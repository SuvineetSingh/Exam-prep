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
