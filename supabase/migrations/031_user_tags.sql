-- Professional tags: freeform, user-chosen tags (LinkedIn-skills style),
-- exactly 5 per user. FK points at user_profiles(id) rather than auth.users(id)
-- so PostgREST can embed user_tags(...) under a user_profiles select — see
-- 019_room_fkeys_to_user_profiles.sql for why that matters in this project.
--
-- position (1-5) is the enforcement mechanism: PRIMARY KEY (user_id, position)
-- caps each user at exactly 5 rows without a trigger. The only write path is
-- the save_profile_and_tags() function below, which always upserts all 5
-- positions in one statement, so there's never a transiently-visible
-- "4 tags" or "6 tags" state for other readers.
CREATE TABLE IF NOT EXISTS user_tags (
  user_id    uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  tag        text NOT NULL CHECK (char_length(trim(tag)) BETWEEN 1 AND 40),
  position   smallint NOT NULL CHECK (position BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, position)
);

-- Case-insensitive per-user uniqueness ("Excel" and "excel" can't coexist).
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_tags_user_lower_tag
  ON user_tags (user_id, lower(tag));

ALTER TABLE user_tags ENABLE ROW LEVEL SECURITY;

-- Semi-public within the app, mirroring activity_events in
-- 012_activity_feed.sql: any signed-in user can read anyone's tags (needed
-- for FindPeople / MiniProfileCard display and for autocomplete suggestions
-- to surface tags other users picked). No anon access — there's no
-- middleware gate in this app, so RLS's `TO authenticated` is the only wall
-- keeping this off the public internet, same as every other table here.
CREATE POLICY "user_tags: authenticated can read"
  ON user_tags FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "user_tags: users manage their own"
  ON user_tags FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Atomic combined save: updates user_profiles and upserts user_tags in a
-- single transaction, so a partial-save state (profile fields updated but
-- tags unchanged, or vice versa) can never happen. SECURITY INVOKER (the
-- default) means this still runs as the calling authenticated role, so both
-- tables' RLS policies above apply exactly as if the client had issued the
-- statements directly — this does not bypass RLS. The explicit auth.uid()
-- check is defense in depth on top of the RLS policies, not a replacement
-- for them.
--
-- This is the only write path into user_tags anywhere in the app (see
-- lib/supabase/queries/tagQueries.ts) — the exactly-5 check here is what
-- makes that invariant hold even if a future caller is added.
CREATE OR REPLACE FUNCTION save_profile_and_tags(
  p_user_id uuid,
  p_updates jsonb,
  p_tags text[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  IF array_length(p_tags, 1) IS DISTINCT FROM 5 THEN
    RAISE EXCEPTION 'exactly 5 tags required';
  END IF;

  UPDATE user_profiles SET
    username             = CASE WHEN p_updates ? 'username' THEN p_updates->>'username' ELSE username END,
    full_name            = CASE WHEN p_updates ? 'full_name' THEN p_updates->>'full_name' ELSE full_name END,
    avatar_url           = CASE WHEN p_updates ? 'avatar_url' THEN p_updates->>'avatar_url' ELSE avatar_url END,
    exam_type            = CASE WHEN p_updates ? 'exam_type' THEN p_updates->>'exam_type' ELSE exam_type END,
    bio                  = CASE WHEN p_updates ? 'bio' THEN p_updates->>'bio' ELSE bio END,
    country_code         = CASE WHEN p_updates ? 'country_code' THEN p_updates->>'country_code' ELSE country_code END,
    industry             = CASE WHEN p_updates ? 'industry' THEN p_updates->>'industry' ELSE industry END,
    study_time           = CASE WHEN p_updates ? 'study_time' THEN p_updates->>'study_time' ELSE study_time END,
    onboarding_completed = CASE WHEN p_updates ? 'onboarding_completed' THEN (p_updates->>'onboarding_completed')::boolean ELSE onboarding_completed END,
    updated_at           = now()
  WHERE id = p_user_id;

  INSERT INTO user_tags (user_id, tag, position)
  SELECT p_user_id, t, ord
  FROM unnest(p_tags) WITH ORDINALITY AS x(t, ord)
  ON CONFLICT (user_id, position) DO UPDATE SET tag = EXCLUDED.tag;
END;
$$;

GRANT EXECUTE ON FUNCTION save_profile_and_tags(uuid, jsonb, text[]) TO authenticated;

-- Autocomplete: trigram index makes the '%term%' pattern below indexable
-- (a plain btree can't accelerate a substring match), and ranking by
-- popularity happens here in SQL rather than scanning + grouping client-side.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_user_tags_tag_trgm
  ON user_tags USING gin (tag gin_trgm_ops);

-- STABLE + SECURITY INVOKER: read-only, still subject to the
-- "authenticated can read" policy above, so it can't surface anything a
-- direct authenticated select on user_tags couldn't already.
CREATE OR REPLACE FUNCTION suggest_tags(p_prefix text, p_limit int DEFAULT 8)
RETURNS TABLE(tag text, usage_count bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT (array_agg(t.tag ORDER BY t.created_at))[1] AS tag, count(*)::bigint AS usage_count
  FROM user_tags t
  WHERE t.tag ILIKE '%' || p_prefix || '%'
  GROUP BY lower(t.tag)
  ORDER BY usage_count DESC, tag ASC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION suggest_tags(text, int) TO authenticated;
