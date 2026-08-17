-- Root cause of the room-creation RLS failures (024-027 were all chasing
-- the wrong layer): not the INSERT policy, but Postgres's documented RLS +
-- RETURNING behavior. When INSERT ... RETURNING produces a row that fails
-- the table's SELECT policy, Postgres raises "new row violates row-level
-- security policy" and rolls back the whole statement — even though the
-- INSERT policy itself was satisfied. createRoom() does
-- .insert({...}).select().single(), and at that exact instant the owner's
-- room_members row doesn't exist yet (it's a second, separate insert right
-- after) — so is_room_member() correctly says "not visible yet" and
-- Postgres aborts. Confirmed: the identical insert without requesting the
-- row back (no `Prefer: return=representation`) succeeded.
--
-- Fix: a room's creator can always see their own room, membership row or
-- not — this is also just correct semantics, not merely a workaround.

DROP POLICY IF EXISTS "lobby_rooms: read curated or member" ON lobby_rooms;
CREATE POLICY "lobby_rooms: read curated or member"
  ON lobby_rooms FOR SELECT TO authenticated
  USING (
    is_user_created = false
    OR owner_id = auth.uid()
    OR is_room_member(id, auth.uid())
    OR EXISTS (
      SELECT 1 FROM room_invites i
      WHERE i.room_id = lobby_rooms.id AND i.invitee_id = auth.uid() AND i.status = 'pending'
    )
  );

-- Diagnostic-only functions from the debugging session, no longer needed.
DROP FUNCTION IF EXISTS debug_room_create_check(uuid, boolean);
DROP FUNCTION IF EXISTS debug_list_policies();
