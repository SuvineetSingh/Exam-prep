export interface LobbyRoom {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  industry: string;
  icon: string | null;
  sort_order: number;
  created_at: string;
  owner_id: string | null;
  avatar_url: string | null;
  is_user_created: boolean;
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
  country_code: string | null;
  study_time: string | null;
  show_in_activity_feed: boolean;
  onboarding_completed: boolean;
  is_bot: boolean;
  is_premium: boolean;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
}

export interface LobbyMessage {
  id: string;
  room_id: string | null;
  sender_id: string;
  recipient_id: string | null;
  content: string;
  message_type: 'room' | 'dm';
  created_at: string;
  attachment_path: string | null;
  attachment_type: 'image' | 'video' | 'audio' | 'pdf' | 'document' | null;
  attachment_name: string | null;
  attachment_size: number | null;
  sender: {
    username: string | null;
    avatar_url: string | null;
    is_bot: boolean;
    exam_type: string | null;
    industry: string | null;
  };
}

export interface NotificationToast {
  id: string;
  type: 'room' | 'dm' | 'room_invite';
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  message: string;
  roomId?: string;
  roomName?: string;
  dmPartnerId?: string;
  timestamp: Date;
}

export interface UserTag {
  tag: string;
  position: number;
}

export interface UnreadCounts {
  rooms: { [roomId: string]: number };
  dms: { [userId: string]: number };
}
