-- Media attachments on room messages: photos, videos, audio, PDFs, documents.

ALTER TABLE lobby_messages
  ADD COLUMN IF NOT EXISTS attachment_path text,
  ADD COLUMN IF NOT EXISTS attachment_type text CHECK (attachment_type IN ('image', 'video', 'audio', 'pdf', 'document')),
  ADD COLUMN IF NOT EXISTS attachment_name text,
  ADD COLUMN IF NOT EXISTS attachment_size integer;

-- Private bucket: room content must not be publicly link-shareable, and
-- curated rooms are open-to-all-authenticated rather than truly "public".
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('room-attachments', 'room-attachments', false, 26214400) -- 25MB
ON CONFLICT (id) DO NOTHING;

-- Same access rule as lobby_messages: curated rooms are readable/postable by
-- any authenticated user (no room_members rows exist for them), user-created
-- rooms are members-only. is_room_member alone would wrongly block curated
-- rooms (nobody has a room_members row there), so this mirrors the actual
-- lobby_messages policy condition rather than just re-using is_room_member.
CREATE OR REPLACE FUNCTION can_access_room(p_room_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM lobby_rooms r
    WHERE r.id = p_room_id AND (r.is_user_created = false OR is_room_member(r.id, p_user_id))
  );
$$;

-- Path convention: room-attachments/{room_id}/{filename}. storage.foldername
-- splits the path so the first segment is the room id, checked against
-- can_access_room — the standard Supabase multi-tenant storage RLS pattern.
DROP POLICY IF EXISTS "room_attachments: readable by room" ON storage.objects;
CREATE POLICY "room_attachments: readable by room"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'room-attachments'
    AND can_access_room((storage.foldername(name))[1]::uuid, auth.uid())
  );

DROP POLICY IF EXISTS "room_attachments: uploadable by room" ON storage.objects;
CREATE POLICY "room_attachments: uploadable by room"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'room-attachments'
    AND can_access_room((storage.foldername(name))[1]::uuid, auth.uid())
  );
