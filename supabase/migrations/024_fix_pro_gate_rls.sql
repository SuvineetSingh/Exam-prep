-- Room creation for a genuinely Pro user was silently rejected: the INSERT
-- policy's `EXISTS (SELECT 1 FROM course_subscriptions ...)` subquery runs
-- under the calling user's own row-level permissions, not elevated ones.
-- Every other read of course_subscriptions in this app goes through the
-- service-role client (webhook, verify route, GET /api/me/pro) — there is
-- apparently no RLS policy letting an authenticated user read their own
-- row via the publishable key, so the subquery saw zero rows regardless of
-- whether the subscription existed. Confirmed via a real Pro account
-- (course_subscriptions has their row — the sidebar Pro badge and
-- /api/me/pro both confirm it) still getting 42501 on room creation.
--
-- Fix: same SECURITY DEFINER pattern already used for is_room_member etc.
-- — bypasses course_subscriptions' own RLS for this specific existence
-- check, which is the correct behavior regardless of what that table's
-- policies turn out to be.

CREATE OR REPLACE FUNCTION is_user_pro(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM course_subscriptions WHERE user_id = p_user_id);
$$;

DROP POLICY IF EXISTS "lobby_rooms: pro users create" ON lobby_rooms;
CREATE POLICY "lobby_rooms: pro users create"
  ON lobby_rooms FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = owner_id
    AND is_user_created = true
    AND is_user_pro(auth.uid())
  );
