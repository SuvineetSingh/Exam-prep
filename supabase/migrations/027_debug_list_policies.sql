-- TEMPORARY diagnostic only. Lists every policy actually attached to
-- lobby_rooms right now, so we can see ground truth instead of assuming
-- migrations 020/024/025 left the table in the state they describe.
CREATE OR REPLACE FUNCTION debug_list_policies()
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  SELECT jsonb_agg(jsonb_build_object(
    'policyname', policyname,
    'cmd', cmd,
    'roles', roles,
    'qual', qual,
    'with_check', with_check
  ))
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'lobby_rooms';
$$;

GRANT EXECUTE ON FUNCTION debug_list_policies() TO authenticated;
