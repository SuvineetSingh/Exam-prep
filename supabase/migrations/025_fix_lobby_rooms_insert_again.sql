-- A raw INSERT as a confirmed-Pro user (is_user_pro() independently returns
-- true for them) still gets 42501 after 024. Rather than assume 024's
-- DROP POLICY IF EXISTS matched the live policy name correctly — the same
-- class of assumption that silently failed once already in this feature
-- (020) — wipe every policy on lobby_rooms by name, dynamically, and
-- recreate the three canonical ones fresh. Self-healing regardless of
-- what's actually there right now.

DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'lobby_rooms'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON lobby_rooms', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "lobby_rooms: read curated or member"
  ON lobby_rooms FOR SELECT TO authenticated
  USING (
    is_user_created = false
    OR is_room_member(id, auth.uid())
    OR EXISTS (
      SELECT 1 FROM room_invites i
      WHERE i.room_id = lobby_rooms.id AND i.invitee_id = auth.uid() AND i.status = 'pending'
    )
  );

CREATE POLICY "lobby_rooms: pro users create"
  ON lobby_rooms FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = owner_id
    AND is_user_created = true
    AND is_user_pro(auth.uid())
  );

CREATE POLICY "lobby_rooms: owner or co_admin update"
  ON lobby_rooms FOR UPDATE TO authenticated
  USING (is_room_admin(id, auth.uid()))
  WITH CHECK (is_room_admin(id, auth.uid()));
