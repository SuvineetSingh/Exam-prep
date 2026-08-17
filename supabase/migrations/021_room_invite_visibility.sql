-- Side effect of fixing the policy leak in 020: room_invites' embedded
-- `room:lobby_rooms!room_id(name, avatar_url)` join now correctly respects
-- lobby_rooms' own RLS — so an invitee who isn't a member yet gets null
-- back for the room name (PostgREST embeds are RLS-filtered same as a
-- direct query). RoomInvitesList.tsx falls back to "A room", which isn't
-- useful — an invitee needs to know what they're being invited to.
--
-- Fix: let a pending invitee read the room's row (name/avatar), same as a
-- member can. This does NOT grant message access — lobby_messages' policy
-- is untouched and still keyed only off room_members, so the room stays
-- unreadable (no chat history) until the invite is actually accepted.

DROP POLICY IF EXISTS "lobby_rooms: read curated or member" ON lobby_rooms;
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
