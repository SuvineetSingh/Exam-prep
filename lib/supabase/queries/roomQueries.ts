import { createClient } from '@/lib/supabase/client';
import type { LobbyRoom, LobbyMessage } from '@/lib/types/lobby';

function slugify(name: string): string {
  const base = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return `${base || 'room'}-${Math.random().toString(36).slice(2, 7)}`;
}

// Curated rooms (owner_id null) + any user-created rooms the caller belongs
// to — enforced by RLS, this query has no membership filter of its own.
export async function fetchUserRooms(): Promise<LobbyRoom[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('lobby_rooms')
    .select('*')
    .order('is_user_created', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as LobbyRoom[];
}

// Pro-only at the RLS layer (see supabase/migrations/016_user_created_rooms.sql)
// — a free user calling this gets a Postgres permission error, this isn't
// the real gate, just where the UI triggers the attempt.
export async function createRoom(
  ownerId: string,
  input: { name: string; description: string | null; avatarUrl: string | null }
): Promise<LobbyRoom> {
  const supabase = createClient();

  const { data: room, error: roomError } = await supabase
    .from('lobby_rooms')
    .insert({
      name: input.name,
      description: input.description,
      avatar_url: input.avatarUrl,
      icon: null,
      industry: 'Community',
      slug: slugify(input.name),
      sort_order: 0,
      owner_id: ownerId,
      is_user_created: true,
    })
    .select()
    .single();
  if (roomError) throw roomError;

  const { error: memberError } = await supabase
    .from('room_members')
    .insert({ room_id: room.id, user_id: ownerId, role: 'owner' });
  if (memberError) throw memberError;

  return room as LobbyRoom;
}

export interface RoomMember {
  user_id: string;
  role: 'owner' | 'co_admin' | 'member';
  joined_at: string;
  username: string | null;
  avatar_url: string | null;
}

export async function fetchRoomMembers(roomId: string): Promise<RoomMember[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('room_members')
    .select('user_id, role, joined_at, user:user_profiles!user_id(username, avatar_url)')
    .eq('room_id', roomId)
    .order('joined_at', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => {
    const user = row.user as unknown as { username: string | null; avatar_url: string | null } | null;
    return {
      user_id: row.user_id,
      role: row.role,
      joined_at: row.joined_at,
      username: user?.username ?? null,
      avatar_url: user?.avatar_url ?? null,
    };
  });
}

export async function removeRoomMember(roomId: string, userId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('room_members')
    .delete()
    .eq('room_id', roomId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function promoteToCoAdmin(roomId: string, userId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('room_members')
    .update({ role: 'co_admin' })
    .eq('room_id', roomId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function demoteToMember(roomId: string, userId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('room_members')
    .update({ role: 'member' })
    .eq('room_id', roomId)
    .eq('user_id', userId);
  if (error) throw error;
}

export interface RoomInvite {
  id: string;
  room_id: string;
  inviter_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  room: { name: string; avatar_url: string | null } | null;
  inviter: { username: string | null; avatar_url: string | null } | null;
}

// DB-enforced to admins only (see room_invites: admins create policy) —
// this call throws for a non-admin caller regardless of UI state.
export async function inviteToRoom(roomId: string, inviterId: string, inviteeId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('room_invites')
    .insert({ room_id: roomId, inviter_id: inviterId, invitee_id: inviteeId });
  if (error) throw error;
}

export async function fetchPendingRoomInvites(userId: string): Promise<RoomInvite[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('room_invites')
    .select('id, room_id, inviter_id, status, created_at, room:lobby_rooms!room_id(name, avatar_url), inviter:user_profiles!inviter_id(username, avatar_url)')
    .eq('invitee_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as unknown as RoomInvite[];
}

// Two sequential calls (update invite, then insert membership) — same
// non-atomic idiom as respondToPartnerInvite in partnerQueries.ts.
export async function respondToRoomInvite(invite: { id: string; room_id: string }, userId: string, accept: boolean): Promise<void> {
  const supabase = createClient();
  const { error: updateError } = await supabase
    .from('room_invites')
    .update({ status: accept ? 'accepted' : 'declined', responded_at: new Date().toISOString() })
    .eq('id', invite.id);
  if (updateError) throw updateError;

  if (!accept) return;

  const { error: memberError } = await supabase
    .from('room_members')
    .insert({ room_id: invite.room_id, user_id: userId, role: 'member' });
  if (memberError) throw memberError;
}

// ponytail: ilike scan, add a GIN tsvector index on lobby_messages.content
// if room history search gets slow at scale.
export async function searchRoomMessages(roomId: string, term: string): Promise<LobbyMessage[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('lobby_messages')
    .select('*, sender:user_profiles!sender_id(username, avatar_url, is_bot, exam_type, industry)')
    .eq('room_id', roomId)
    .eq('message_type', 'room')
    .ilike('content', `%${term}%`)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data as LobbyMessage[];
}

export type AttachmentType = 'image' | 'video' | 'audio' | 'pdf' | 'document';

function attachmentTypeFromMime(mime: string): AttachmentType {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime === 'application/pdf') return 'pdf';
  return 'document';
}

export interface RoomAttachment {
  path: string;
  type: AttachmentType;
  name: string;
  size: number;
}

// Path convention room-attachments/{roomId}/... is required by the storage
// RLS policy (supabase/migrations/022_room_attachments.sql), which reads the
// first path segment as the room id.
export async function uploadRoomAttachment(roomId: string, file: File): Promise<RoomAttachment> {
  const supabase = createClient();
  const path = `${roomId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const { error } = await supabase.storage
    .from('room-attachments')
    .upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) throw error;
  return { path, type: attachmentTypeFromMime(file.type), name: file.name, size: file.size };
}

export async function sendRoomAttachment(
  roomId: string,
  senderId: string,
  attachment: RoomAttachment,
  caption = ''
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('lobby_messages').insert({
    room_id: roomId,
    sender_id: senderId,
    content: caption,
    message_type: 'room',
    attachment_path: attachment.path,
    attachment_type: attachment.type,
    attachment_name: attachment.name,
    attachment_size: attachment.size,
  });
  if (error) throw error;
}

// Bucket is private (see 022_room_attachments.sql) — reads always go through
// a short-lived signed URL, never a public URL.
export async function getAttachmentSignedUrl(path: string): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.storage.from('room-attachments').createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}
