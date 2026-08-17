-- Room-level invites: an admin (owner or co-admin) invites a specific user
-- into a private room. Independent of the friend system — inviting a
-- non-friend into a room is allowed.

CREATE TABLE IF NOT EXISTS room_invites (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id      uuid NOT NULL REFERENCES lobby_rooms(id) ON DELETE CASCADE,
  inviter_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz
);

-- A user can be re-invited after declining, but not double-invited while a
-- prior invite is still pending — partial unique index since plain UNIQUE
-- can't be scoped to a single status value.
CREATE UNIQUE INDEX IF NOT EXISTS idx_room_invites_pending_unique
  ON room_invites (room_id, invitee_id) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_room_invites_invitee ON room_invites (invitee_id, status);

ALTER TABLE room_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "room_invites: parties can read" ON room_invites;
CREATE POLICY "room_invites: parties can read"
  ON room_invites FOR SELECT TO authenticated
  USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);

-- Only room admins can invite — DB-enforced, not just a hidden button.
DROP POLICY IF EXISTS "room_invites: admins create" ON room_invites;
CREATE POLICY "room_invites: admins create"
  ON room_invites FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = inviter_id
    AND EXISTS (SELECT 1 FROM room_members m WHERE m.room_id = room_invites.room_id AND m.user_id = auth.uid() AND m.role IN ('owner', 'co_admin'))
  );

DROP POLICY IF EXISTS "room_invites: invitee responds" ON room_invites;
CREATE POLICY "room_invites: invitee responds"
  ON room_invites FOR UPDATE TO authenticated
  USING (auth.uid() = invitee_id)
  WITH CHECK (auth.uid() = invitee_id AND status IN ('accepted', 'declined'));

-- Deferred from 016_user_created_rooms.sql: joining via an accepted invite,
-- now that room_invites exists.
DROP POLICY IF EXISTS "room_members: join via accepted invite" ON room_members;
CREATE POLICY "room_members: join via accepted invite"
  ON room_members FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND role = 'member'
    AND EXISTS (
      SELECT 1 FROM room_invites i
      WHERE i.room_id = room_members.room_id AND i.invitee_id = auth.uid() AND i.status = 'accepted'
    )
  );

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'room_invites') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE room_invites;
  END IF;
END $$;
