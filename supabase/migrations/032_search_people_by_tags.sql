-- Ranks users by how many of p_filter_tags they have, via a JOIN + GROUP BY
-- that PostgREST's plain query builder can't express (no arbitrary
-- order-by-aggregate through the REST API — same reason suggest_tags is a
-- function, see 031_user_tags.sql). Zero-match users are excluded by the
-- INNER JOIN, not ranked at the bottom — this is a filter that ranks its
-- survivors, not a full relevance sort over every user.
-- Drops the original 8-param signature (with p_current_user_id) in case this
-- migration already ran once — CREATE OR REPLACE only replaces a function
-- with a matching argument list, otherwise it creates a second overload.
DROP FUNCTION IF EXISTS search_people_by_tags(uuid, text[], text, text, text, text, int, int);

CREATE OR REPLACE FUNCTION search_people_by_tags(
  p_filter_tags text[],
  p_term text DEFAULT '',
  p_country text DEFAULT '',
  p_exam text DEFAULT '',
  p_study text DEFAULT '',
  p_limit int DEFAULT 10,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  username text,
  exam_type text,
  full_name text,
  country_code text,
  study_time text,
  match_count int,
  matched_tags text[]
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT
    up.id, up.username, up.exam_type, up.full_name, up.country_code, up.study_time,
    count(ut.tag)::int AS match_count,
    array_agg(ut.tag ORDER BY ut.position) AS matched_tags
  FROM user_profiles up
  JOIN user_tags ut
    ON ut.user_id = up.id
    AND ut.tag ILIKE ANY (p_filter_tags)
  WHERE up.id != auth.uid()
    AND up.is_bot = false
    AND (p_term = '' OR up.username ILIKE '%' || p_term || '%')
    AND (p_country = '' OR up.country_code = p_country)
    AND (p_exam = '' OR up.exam_type = p_exam)
    AND (p_study = '' OR up.study_time = p_study)
  GROUP BY up.id
  ORDER BY match_count DESC, up.username ASC
  LIMIT p_limit OFFSET p_offset;
$$;

GRANT EXECUTE ON FUNCTION search_people_by_tags(text[], text, text, text, text, int, int) TO authenticated;
