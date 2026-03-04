export interface LobbyRoom {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  industry: string;
  icon: string | null;
  sort_order: number;
  created_at: string;
}

export interface LobbyUserProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  industry: string | null;
  exam_type: string | null;
  bio: string | null;
  current_room_id: string | null;
  is_bot: boolean;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
}

export interface OnlineUser {
  id: string;
  username: string;
  exam_type?: string;
  avatar_url?: string;
  is_bot?: boolean;
  online_at: string;
}

export interface LobbyMessage {
  id: string;
  room_id: string | null;
  sender_id: string;
  recipient_id: string | null;
  content: string;
  message_type: 'room' | 'dm';
  created_at: string;
  sender: {
    username: string | null;
    avatar_url: string | null;
    is_bot: boolean;
    exam_type: string | null;
    industry: string | null;
  };
}

export interface DMConversation {
  partner_id: string;
  partner_username: string;
  partner_avatar_url: string | null;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

export interface BotScriptEntry {
  content: string;
  room_slug: string;
  min_delay_ms: number;
  max_delay_ms: number;
}

export interface BotScript {
  messages: BotScriptEntry[];
  loop: boolean;
}
