-- Fixes infinite recursion in RLS: every policy that checked "is the caller
-- a member/admin of this room" did so via a subquery directly against
-- room_members — including room_members' OWN policies. A policy on
-- room_members that subqueries room_members re-triggers itself, which
-- Postgres detects as infinite recursion and errors on (surfaced by
-- PostgREST as a 500 on any lobby_rooms/lobby_messages read).
--
-- Fix: SECURITY DEFINER helper functions. Executing as the function owner
-- (not subject to RLS the way the calling role's queries are) breaks the
-- recursion — the standard pattern for self-referential RLS checks.

CREATE OR REPLACE FUNCTION is_room_member(p_room_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM room_members WHERE room_id = p_room_id AND user_id = p_user_id);
$$;

CREATE OR REPLACE FUNCTION is_room_admin(p_room_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM room_members
    WHERE room_id = p_room_id AND user_id = p_user_id AND role IN ('owner', 'co_admin')
  );
$$;

CREATE OR REPLACE FUNCTION is_room_owner(p_room_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM room_members WHERE room_id = p_room_id AND user_id = p_user_id AND role = 'owner'
  );
$$;

-- ── lobby_rooms ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "lobby_rooms: read curated or member" ON lobby_rooms;
CREATE POLICY "lobby_rooms: read curated or member"
  ON lobby_rooms FOR SELECT TO authenticated
  USING (is_user_created = false OR is_room_member(id, auth.uid()));

DROP POLICY IF EXISTS "lobby_rooms: owner or co_admin update" ON lobby_rooms;
CREATE POLICY "lobby_rooms: owner or co_admin update"
  ON lobby_rooms FOR UPDATE TO authenticated
  USING (is_room_admin(id, auth.uid()))
  WITH CHECK (is_room_admin(id, auth.uid()));

-- ── room_members (the actual recursion source) ──────────────────────────

DROP POLICY IF EXISTS "room_members: members read roster" ON room_members;
CREATE POLICY "room_members: members read roster"
  ON room_members FOR SELECT TO authenticated
  USING (is_room_member(room_id, auth.uid()));

DROP POLICY IF EXISTS "room_members: admins remove, self leaves" ON room_members;
CREATE POLICY "room_members: admins remove, self leaves"
  ON room_members FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR is_room_admin(room_id, auth.uid()));

DROP POLICY IF EXISTS "room_members: owner changes role" ON room_members;
CREATE POLICY "room_members: owner changes role"
  ON room_members FOR UPDATE TO authenticated
  USING (is_room_owner(room_id, auth.uid()))
  WITH CHECK (role IN ('co_admin', 'member'));

-- ── lobby_messages ───────────────────────────────────────────────────────

DROP POLICY IF EXISTS "lobby_messages: read own dm or visible room" ON lobby_messages;
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

DROP POLICY IF EXISTS "lobby_messages: send own dm or member room" ON lobby_messages;
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

DROP POLICY IF EXISTS "room_invites: admins create" ON room_invites;
CREATE POLICY "room_invites: admins create"
  ON room_invites FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = inviter_id AND is_room_admin(room_id, auth.uid()));
