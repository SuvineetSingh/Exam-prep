import { createClient } from '@/lib/supabase/client';
import type { LobbyRoom, LobbyMessage, LobbyUserProfile } from '@/lib/types/lobby';

export async function fetchRooms(): Promise<LobbyRoom[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('lobby_rooms')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data as LobbyRoom[];
}

export async function fetchRoomMessages(roomId: string, limit = 100): Promise<LobbyMessage[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('lobby_messages')
    .select('*, sender:user_profiles!sender_id(username, avatar_url, is_bot, exam_type, industry)')
    .eq('room_id', roomId)
    .eq('message_type', 'room')
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data as LobbyMessage[];
}

export async function sendRoomMessage(roomId: string, senderId: string, content: string) {
  const supabase = createClient();
  const { error } = await supabase.from('lobby_messages').insert({
    room_id: roomId,
    sender_id: senderId,
    content,
    message_type: 'room',
  });
  if (error) throw error;
}

export async function fetchDMMessages(userId: string, partnerId: string, limit = 100): Promise<LobbyMessage[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('lobby_messages')
    .select('*, sender:user_profiles!sender_id(username, avatar_url, is_bot, exam_type, industry)')
    .eq('message_type', 'dm')
    .or(`and(sender_id.eq.${userId},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${userId})`)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data as LobbyMessage[];
}

export async function sendDM(senderId: string, recipientId: string, content: string) {
  const supabase = createClient();
  const { error } = await supabase.from('lobby_messages').insert({
    sender_id: senderId,
    recipient_id: recipientId,
    content,
    message_type: 'dm',
  });
  if (error) throw error;
}

export async function fetchDMConversations(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('lobby_messages')
    .select('*, sender:user_profiles!sender_id(username, avatar_url), recipient:user_profiles!recipient_id(username, avatar_url)')
    .eq('message_type', 'dm')
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Group by conversation partner and get latest message
  const conversations = new Map<string, {
    partner_id: string;
    partner_username: string;
    partner_avatar_url: string | null;
    last_message: string;
    last_message_at: string;
  }>();

  for (const msg of data || []) {
    const partnerId = msg.sender_id === userId ? msg.recipient_id : msg.sender_id;
    if (!partnerId || conversations.has(partnerId)) continue;

    const partner = msg.sender_id === userId ? msg.recipient : msg.sender;
    conversations.set(partnerId, {
      partner_id: partnerId,
      partner_username: partner?.username || 'Unknown',
      partner_avatar_url: partner?.avatar_url || null,
      last_message: msg.content,
      last_message_at: msg.created_at,
    });
  }

  return Array.from(conversations.values());
}

export async function fetchUnreadCounts(userId: string): Promise<{ rooms: Record<string, number>; dms: Record<string, number> }> {
  const supabase = createClient();

  const [readsRes, roomMsgsRes, dmMsgsRes] = await Promise.all([
    supabase
      .from('conversation_reads')
      .select('conversation_id, conversation_type, last_read_at')
      .eq('user_id', userId),
    supabase
      .from('lobby_messages')
      .select('room_id, created_at')
      .eq('message_type', 'room')
      .neq('sender_id', userId),
    supabase
      .from('lobby_messages')
      .select('sender_id, created_at')
      .eq('message_type', 'dm')
      .eq('recipient_id', userId),
  ]);

  const lastRead = new Map<string, string>();
  for (const row of readsRes.data ?? []) {
    lastRead.set(`${row.conversation_type}:${row.conversation_id}`, row.last_read_at);
  }

  const rooms: Record<string, number> = {};
  for (const msg of roomMsgsRes.data ?? []) {
    if (!msg.room_id) continue;
    const readAt = lastRead.get(`room:${msg.room_id}`);
    if (!readAt || msg.created_at > readAt) {
      rooms[msg.room_id] = (rooms[msg.room_id] ?? 0) + 1;
    }
  }

  const dms: Record<string, number> = {};
  for (const msg of dmMsgsRes.data ?? []) {
    if (!msg.sender_id) continue;
    const readAt = lastRead.get(`dm:${msg.sender_id}`);
    if (!readAt || msg.created_at > readAt) {
      dms[msg.sender_id] = (dms[msg.sender_id] ?? 0) + 1;
    }
  }

  return { rooms, dms };
}

export async function fetchUserRoomActivity(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('lobby_messages')
    .select('room_id, content, created_at')
    .eq('sender_id', userId)
    .eq('message_type', 'room')
    .order('created_at', { ascending: false });

  if (error) throw error;

  const roomMap = new Map<string, { room_id: string; last_message: string; last_message_at: string }>();
  for (const msg of data || []) {
    if (!msg.room_id || roomMap.has(msg.room_id)) continue;
    roomMap.set(msg.room_id, {
      room_id: msg.room_id,
      last_message: msg.content,
      last_message_at: msg.created_at,
    });
  }
  return Array.from(roomMap.values());
}

export async function fetchUserProfile(userId: string): Promise<LobbyUserProfile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) return null;
  return data as LobbyUserProfile;
}

export async function updateUserProfile(userId: string, updates: Partial<LobbyUserProfile>) {
  const supabase = createClient();
  const { error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', userId);

  if (error) throw error;
}

export type FriendshipStatus = 'none' | 'pending_sent' | 'pending_received' | 'accepted';

export async function fetchFriendshipStatus(
  currentUserId: string,
  targetUserId: string
): Promise<FriendshipStatus> {
  const supabase = createClient();
  const { data } = await supabase
    .from('friendships')
    .select('requester_id, status')
    .or(
      `and(requester_id.eq.${currentUserId},addressee_id.eq.${targetUserId}),` +
      `and(requester_id.eq.${targetUserId},addressee_id.eq.${currentUserId})`
    )
    .maybeSingle();

  if (!data) return 'none';
  if (data.status === 'accepted') return 'accepted';
  return data.requester_id === currentUserId ? 'pending_sent' : 'pending_received';
}

const FRIEND_REQUESTS_PER_HOUR = 10;

export async function sendFriendRequest(requesterId: string, addresseeId: string) {
  const supabase = createClient();

  // Cooldown so the lobby→DM shortcut can't be used as a spam vector.
  // Client-enforced (a direct API caller can bypass it); real enforcement
  // needs a DB trigger or a route handler — acceptable gap pre-scale since
  // the friends-only DM gate itself throttles cold outreach.
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from('friendships')
    .select('id', { count: 'exact', head: true })
    .eq('requester_id', requesterId)
    .gte('created_at', oneHourAgo);
  if ((count ?? 0) >= FRIEND_REQUESTS_PER_HOUR) {
    throw new Error('Too many friend requests — please try again in a bit.');
  }

  const { error } = await supabase
    .from('friendships')
    .insert({ requester_id: requesterId, addressee_id: addresseeId });
  if (error) throw error;
}

export async function acceptFriendRequest(requesterId: string, addresseeId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('requester_id', requesterId)
    .eq('addressee_id', addresseeId);
  if (error) throw error;
}

export async function updateUserOnlineStatus(userId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('user_profiles')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) console.error('Failed to update online status:', error);
}
