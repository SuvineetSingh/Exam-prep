-- Confirmed via direct test: a co_admin could DELETE the owner's
-- room_members row. The DELETE policy ("user_id = auth.uid() OR
-- is_room_admin(...)") never excluded role = 'owner' — any admin
-- (including a co-admin) could remove anyone, owner included. There's no
-- ownership-transfer flow in this feature, so an owner-less room is a dead
-- end (nobody left could invite/promote/manage) — block removing the
-- owner row entirely, whether by another admin or by the owner "leaving"
-- themselves.

DROP POLICY IF EXISTS "room_members: admins remove, self leaves" ON room_members;
CREATE POLICY "room_members: admins remove, self leaves"
  ON room_members FOR DELETE TO authenticated
  USING (
    role != 'owner'
    AND (user_id = auth.uid() OR is_room_admin(room_id, auth.uid()))
  );
