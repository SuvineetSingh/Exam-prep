-- Activity feed foundations: semi-public event stream driving the lobby
-- discovery feed. quiz_completed events are written by a DB trigger on
-- exam_sessions (submission is a multi-step client-side flow, so app-code
-- writes could drift out of sync with the session row); room_joined /
-- dm_started / study_session_started are written by application code.

CREATE TABLE IF NOT EXISTS activity_events (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('quiz_completed', 'room_joined', 'dm_started', 'study_session_started')),
  metadata   jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_events_created_at
  ON activity_events (created_at DESC);

-- Timed exams UPSERT exam_sessions (and delete + retry on partial failure),
-- so the trigger below can fire more than once per session. This index makes
-- the event write idempotent per session.
CREATE UNIQUE INDEX IF NOT EXISTS idx_activity_events_quiz_session
  ON activity_events (event_type, (metadata->>'session_id'))
  WHERE event_type = 'quiz_completed';

ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;

-- The feed is semi-public by design: any signed-in user can read it.
-- Per-user opt-out (user_profiles.show_in_activity_feed) is applied at
-- query time, not here.
CREATE POLICY "activity_events: authenticated can read"
  ON activity_events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "activity_events: users insert their own"
  ON activity_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Needed for the live feed UI (postgres_changes INSERT subscription).
-- Guarded so a dashboard re-run of this file doesn't error.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'activity_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE activity_events;
  END IF;
END $$;

-- Profile additions: user-set country shown in feed rows, and the feed
-- privacy opt-out.
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS country_code text CHECK (country_code ~ '^[A-Z]{2}$'),
  ADD COLUMN IF NOT EXISTS show_in_activity_feed boolean NOT NULL DEFAULT true;

-- SECURITY DEFINER so the event insert/delete doesn't depend on the calling
-- role's activity_events policies (there is deliberately no user-facing
-- delete policy).
CREATE OR REPLACE FUNCTION log_quiz_completed_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO activity_events (user_id, event_type, metadata)
  VALUES (
    NEW.user_id,
    'quiz_completed',
    jsonb_build_object(
      'session_id', NEW.id,
      'course', NEW.exam_type,
      'mode', NEW.mode,
      'score', NEW.score,
      'percentage', NEW.percentage,
      'total_questions', NEW.total_questions
    )
  )
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

-- The timed-exam submit flow deletes the session row if the user_answers
-- write fails (see app/timed-exam/[sessionId]/page.tsx) — remove the event
-- too so the feed never shows a session that history doesn't have.
CREATE OR REPLACE FUNCTION delete_quiz_completed_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM activity_events
  WHERE event_type = 'quiz_completed'
    AND metadata->>'session_id' = OLD.id::text;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_exam_sessions_quiz_completed ON exam_sessions;
CREATE TRIGGER trg_exam_sessions_quiz_completed
  AFTER INSERT OR UPDATE ON exam_sessions
  FOR EACH ROW
  WHEN (NEW.score IS NOT NULL)
  EXECUTE FUNCTION log_quiz_completed_event();

DROP TRIGGER IF EXISTS trg_exam_sessions_quiz_deleted ON exam_sessions;
CREATE TRIGGER trg_exam_sessions_quiz_deleted
  AFTER DELETE ON exam_sessions
  FOR EACH ROW
  EXECUTE FUNCTION delete_quiz_completed_event();
