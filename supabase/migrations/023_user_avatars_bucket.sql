-- Pre-existing gap, not introduced this session: components/settings/ProfileTab.tsx
-- has always uploaded to a 'user-avatars' bucket (and CreateRoomModal.tsx now
-- reuses it for room avatars under a room-avatars/ prefix), but the bucket
-- was never actually created in this live Supabase project — confirmed by
-- reproducing "StorageApiError: Bucket not found" on the untouched profile
-- avatar upload, not just the new room-avatar one. Same class of drift as
-- the missing user_profiles.is_premium column: code assumes a resource this
-- particular project never had provisioned.

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('user-avatars', 'user-avatars', true, 5242880) -- 5MB, matches ProfileTab's client-side check
ON CONFLICT (id) DO NOTHING;

-- Public bucket (avatars are low-sensitivity, meant to be viewable by
-- anyone via getPublicUrl) — read is open. Writes still require the
-- uploader's own auth.uid() to appear in the filename, since both
-- ProfileTab and CreateRoomModal name files `{prefix}/{userId}-{timestamp}.{ext}`.
DROP POLICY IF EXISTS "user_avatars: public read" ON storage.objects;
CREATE POLICY "user_avatars: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'user-avatars');

DROP POLICY IF EXISTS "user_avatars: owner uploads" ON storage.objects;
CREATE POLICY "user_avatars: owner uploads"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'user-avatars' AND name LIKE '%' || auth.uid()::text || '%');
