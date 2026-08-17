-- Verified via direct RPC + table read as a non-member test account: a
-- private user-created room was still visible in lobby_rooms to someone
-- with zero room_members row and is_room_member() correctly returning
-- false. That means a pre-existing SELECT policy from before 016 (likely a
-- blanket "any authenticated user can read all rooms" policy from the
-- original untracked pre-009 schema) is still active and getting OR'd
-- together with the new one — Postgres combines multiple permissive
-- policies on the same command with OR, so any one of them passing lets
-- the row through regardless of what the others say.
--
-- Fix: drop every existing policy on the four tables this feature touches,
-- by name, dynamically — not just the ones this migration set created —
-- then recreate the canonical set fresh. This guarantees no leftover
-- legacy policy survives, regardless of what it was originally called.

DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('lobby_rooms', 'lobby_messages', 'room_members', 'room_invites')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- ── lobby_rooms ──────────────────────────────────────────────────────────

CREATE POLICY "lobby_rooms: read curated or member"
  ON lobby_rooms FOR SELECT TO authenticated
  USING (is_user_created = false OR is_room_member(id, auth.uid()));

CREATE POLICY "lobby_rooms: pro users create"
  ON lobby_rooms FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = owner_id
    AND is_user_created = true
    AND EXISTS (SELECT 1 FROM course_subscriptions cs WHERE cs.user_id = auth.uid())
  );

CREATE POLICY "lobby_rooms: owner or co_admin update"
  ON lobby_rooms FOR UPDATE TO authenticated
  USING (is_room_admin(id, auth.uid()))
  WITH CHECK (is_room_admin(id, auth.uid()));

-- ── room_members ─────────────────────────────────────────────────────────

CREATE POLICY "room_members: members read roster"
  ON room_members FOR SELECT TO authenticated
  USING (is_room_member(room_id, auth.uid()));

CREATE POLICY "room_members: self-insert as owner"
  ON room_members FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND role = 'owner'
    AND EXISTS (SELECT 1 FROM lobby_rooms r WHERE r.id = room_id AND r.owner_id = auth.uid())
  );

CREATE POLICY "room_members: join via accepted invite"
  ON room_members FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND role = 'member'
    AND EXISTS (
      SELECT 1 FROM room_invites i
      WHERE i.room_id = room_members.room_id AND i.invitee_id = auth.uid() AND i.status = 'accepted'
    )
  );

CREATE POLICY "room_members: admins remove, self leaves"
  ON room_members FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR is_room_admin(room_id, auth.uid()));

CREATE POLICY "room_members: owner changes role"
  ON room_members FOR UPDATE TO authenticated
  USING (is_room_owner(room_id, auth.uid()))
  WITH CHECK (role IN ('co_admin', 'member'));

-- ── lobby_messages ───────────────────────────────────────────────────────

CREATE POLICY "lobby_messages: read own dm or visible room"
  ON lobby_messages FOR SELECT TO authenticated
  USING (
    (message_type = 'dm' AND (auth.uid() = sender_id OR auth.uid() = recipient_id))
    OR (message_type = 'room' AND EXISTS (
      SELECT 1 FROM lobby_rooms r
      WHERE r.id = lobby_messages.room_id
        AND (r.is_user_created = false OR is_room_member(r.id, auth.uid()))
    ))
  );

CREATE POLICY "lobby_messages: send own dm or member room"
  ON lobby_messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND (
      (message_type = 'dm' AND recipient_id IS NOT NULL)
      OR (message_type = 'room' AND EXISTS (
        SELECT 1 FROM lobby_rooms r
        WHERE r.id = room_id
          AND (r.is_user_created = false OR is_room_member(r.id, auth.uid()))
      ))
    )
  );

-- ── room_invites ─────────────────────────────────────────────────────────

CREATE POLICY "room_invites: parties can read"
  ON room_invites FOR SELECT TO authenticated
  USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);

CREATE POLICY "room_invites: admins create"
  ON room_invites FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = inviter_id AND is_room_admin(room_id, auth.uid()));

CREATE POLICY "room_invites: invitee responds"
  ON room_invites FOR UPDATE TO authenticated
  USING (auth.uid() = invitee_id)
  WITH CHECK (auth.uid() = invitee_id AND status IN ('accepted', 'declined'));
