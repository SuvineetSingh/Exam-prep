import { createClient } from '@/lib/supabase/client';

// Study partner = an upgraded friendship (no separate partnership table).
// These helpers read/write the partner_* columns on friendships and the
// study_sessions table (migrations 013/014).

export interface PartnershipRow {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
  is_study_partner: boolean;
  partner_status: 'pending' | 'active' | 'ended' | null;
  partner_since: string | null;
  partner_invited_by: string | null;
  partner_originating_room_id: string | null;
}

export interface StudySession {
  id: string;
  friendship_id: string;
  proposed_by: string;
  scheduled_at: string;
  status: 'proposed' | 'confirmed' | 'done' | 'cancelled';
  created_at: string;
}

export async function fetchPartnership(
  userA: string,
  userB: string
): Promise<PartnershipRow | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from('friendships')
    .select(
      'id, requester_id, addressee_id, status, is_study_partner, partner_status, partner_since, partner_invited_by, partner_originating_room_id'
    )
    .or(
      `and(requester_id.eq.${userA},addressee_id.eq.${userB}),` +
      `and(requester_id.eq.${userB},addressee_id.eq.${userA})`
    )
    .maybeSingle();
  return (data as PartnershipRow) ?? null;
}

/**
 * Send a study partner invite. Requires an accepted friendship (the DM this
 * is triggered from already implies one). Stamps the originating room from
 * the pair's dm_started funnel event when there is one.
 */
export async function inviteStudyPartner(currentUserId: string, partnerId: string): Promise<void> {
  const supabase = createClient();
  const partnership = await fetchPartnership(currentUserId, partnerId);
  if (!partnership || partnership.status !== 'accepted') {
    throw new Error('You need to be friends before inviting a study partner.');
  }

  const { data: dmEvent } = await supabase
    .from('activity_events')
    .select('metadata')
    .eq('event_type', 'dm_started')
    .or(
      `and(user_id.eq.${currentUserId},metadata->>partner_id.eq.${partnerId}),` +
      `and(user_id.eq.${partnerId},metadata->>partner_id.eq.${currentUserId})`
    )
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  const roomId = (dmEvent?.metadata as { room_id?: string } | undefined)?.room_id ?? null;

  const { error } = await supabase
    .from('friendships')
    .update({
      partner_status: 'pending',
      partner_invited_by: currentUserId,
      partner_originating_room_id: roomId,
    })
    .eq('id', partnership.id);
  if (error) throw error;
}

export async function respondToPartnerInvite(friendshipId: string, accept: boolean): Promise<void> {
  const supabase = createClient();
  const updates = accept
    ? { partner_status: 'active', is_study_partner: true, partner_since: new Date().toISOString() }
    : { partner_status: 'ended', partner_invited_by: null };
  const { error } = await supabase.from('friendships').update(updates).eq('id', friendshipId);
  if (error) throw error;
}

export async function fetchStudySessions(friendshipId: string): Promise<StudySession[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('study_sessions')
    .select('*')
    .eq('friendship_id', friendshipId)
    .order('scheduled_at', { ascending: false })
    .limit(10);
  if (error) throw error;
  return (data as StudySession[]) ?? [];
}

export async function proposeStudySession(
  friendshipId: string,
  proposedBy: string,
  scheduledAt: string
): Promise<StudySession> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('study_sessions')
    .insert({ friendship_id: friendshipId, proposed_by: proposedBy, scheduled_at: scheduledAt })
    .select('*')
    .single();
  if (error) throw error;
  return data as StudySession;
}

export async function updateStudySessionStatus(
  sessionId: string,
  status: StudySession['status']
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('study_sessions').update({ status }).eq('id', sessionId);
  if (error) throw error;
}
