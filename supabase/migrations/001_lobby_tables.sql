-- ============================================
-- Migration 001: Lobby / Chatroom Tables
-- Run this in the Supabase SQL Editor
-- ============================================

-- 1. lobby_rooms
CREATE TABLE public.lobby_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  industry TEXT NOT NULL,
  icon TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.lobby_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rooms are viewable by authenticated users"
  ON public.lobby_rooms FOR SELECT
  TO authenticated USING (true);

-- 2. user_profiles
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  industry TEXT,
  exam_type TEXT,
  bio TEXT,
  current_room_id UUID REFERENCES public.lobby_rooms(id),
  is_bot BOOLEAN DEFAULT false,
  bot_script JSONB,
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.user_profiles FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Users can insert own profile"
  ON public.user_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id);

-- 3. lobby_messages
CREATE TABLE public.lobby_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.lobby_rooms(id),
  sender_id UUID NOT NULL REFERENCES public.user_profiles(id),
  recipient_id UUID REFERENCES public.user_profiles(id),
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'room'
    CHECK (message_type IN ('room', 'dm')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_lobby_messages_room
  ON public.lobby_messages(room_id, created_at DESC)
  WHERE message_type = 'room';

CREATE INDEX idx_lobby_messages_dm
  ON public.lobby_messages(sender_id, recipient_id, created_at DESC)
  WHERE message_type = 'dm';

CREATE INDEX idx_lobby_messages_dm_reverse
  ON public.lobby_messages(recipient_id, sender_id, created_at DESC)
  WHERE message_type = 'dm';

ALTER TABLE public.lobby_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Room messages viewable by authenticated, DMs by participants"
  ON public.lobby_messages FOR SELECT
  TO authenticated USING (
    message_type = 'room'
    OR sender_id = auth.uid()
    OR recipient_id = auth.uid()
  );

CREATE POLICY "Users can send messages as themselves"
  ON public.lobby_messages FOR INSERT
  TO authenticated WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can delete own messages"
  ON public.lobby_messages FOR DELETE
  TO authenticated USING (sender_id = auth.uid());

-- Enable Realtime on lobby_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.lobby_messages;

-- 4. Seed rooms
INSERT INTO public.lobby_rooms (slug, name, description, industry, icon, sort_order) VALUES
  ('general-study', 'General Study Hall', 'Open discussion for all exam types and topics', 'General', '📚', 1),
  ('cpa-accounting', 'CPA Accounting', 'For CPA exam candidates discussing accounting topics', 'Accounting', '📊', 2),
  ('cfa-finance', 'CFA Finance', 'For CFA candidates discussing finance and investment', 'Finance', '📈', 3),
  ('fe-engineering', 'FE Engineering', 'For FE exam candidates discussing engineering fundamentals', 'Engineering', '🔧', 4),
  ('motivation-tips', 'Motivation & Tips', 'Share study tips, motivation, and exam strategies', 'General', '💪', 5);

-- 5. Auto-update trigger for user_profiles.updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_user_profiles_updated
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 6. Auto-create user_profiles row on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
