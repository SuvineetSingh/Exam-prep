-- room_members.user_id / room_invites.inviter_id/invitee_id / lobby_rooms.owner_id
-- were declared REFERENCES auth.users(id) in 016/017. That's data-valid (every
-- user_profiles.id IS an auth.users.id 1:1), but PostgREST can only embed a
-- related table when a FK points directly at it — this app's existing tables
-- (e.g. lobby_messages.sender_id) point at user_profiles(id) for exactly this
-- reason, which is what lets `sender:user_profiles!sender_id(...)` embeds work
-- elsewhere. Re-pointing these to match, so the same embed pattern works for
-- fetchRoomMembers/fetchPendingRoomInvites.

ALTER TABLE room_members DROP CONSTRAINT IF EXISTS room_members_user_id_fkey;
ALTER TABLE room_members
  ADD CONSTRAINT room_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

ALTER TABLE room_invites DROP CONSTRAINT IF EXISTS room_invites_inviter_id_fkey;
ALTER TABLE room_invites
  ADD CONSTRAINT room_invites_inviter_id_fkey FOREIGN KEY (inviter_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

ALTER TABLE room_invites DROP CONSTRAINT IF EXISTS room_invites_invitee_id_fkey;
ALTER TABLE room_invites
  ADD CONSTRAINT room_invites_invitee_id_fkey FOREIGN KEY (invitee_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

ALTER TABLE lobby_rooms DROP CONSTRAINT IF EXISTS lobby_rooms_owner_id_fkey;
ALTER TABLE lobby_rooms
  ADD CONSTRAINT lobby_rooms_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES user_profiles(id) ON DELETE CASCADE;
