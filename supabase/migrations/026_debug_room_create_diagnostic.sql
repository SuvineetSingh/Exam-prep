-- TEMPORARY diagnostic only — not a fix. Room creation is being rejected by
-- RLS under conditions that each test true independently via direct RPC
-- calls (is_user_pro() returns true, payload has owner_id = auth.uid() and
-- is_user_created = true), which shouldn't be possible if the policy is
-- what migration 025 says it is. This function surfaces the exact values
-- Postgres sees in the same evaluation context as the real INSERT, so the
-- actual cause can be identified instead of guessed at.
CREATE OR REPLACE FUNCTION debug_room_create_check(p_owner_id uuid, p_is_user_created boolean)
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  SELECT jsonb_build_object(
    'auth_uid', auth.uid(),
    'p_owner_id', p_owner_id,
    'owner_id_matches', auth.uid() = p_owner_id,
    'p_is_user_created', p_is_user_created,
    'is_pro', is_user_pro(auth.uid()),
    'current_role', current_setting('role', true),
    'jwt_role_claim', current_setting('request.jwt.claims', true)::jsonb ->> 'role'
  );
$$;

GRANT EXECUTE ON FUNCTION debug_room_create_check(uuid, boolean) TO authenticated;
