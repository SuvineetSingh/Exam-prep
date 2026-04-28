-- Migration 004: exam_sessions table + mode/exam_session_id columns on user_answers
-- Run this in the Supabase SQL Editor

-- 1. Create exam_sessions table
CREATE TABLE IF NOT EXISTS public.exam_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_type TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'timed' CHECK (mode IN ('practice', 'timed')),
  total_questions INTEGER NOT NULL DEFAULT 0,
  score INTEGER,
  percentage INTEGER,
  time_taken_seconds INTEGER,
  total_time_given_seconds INTEGER,
  answered_count INTEGER,
  unanswered_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exam_sessions_user_id ON public.exam_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_user_created ON public.exam_sessions(user_id, created_at DESC);

ALTER TABLE public.exam_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own sessions" ON public.exam_sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON public.exam_sessions;

CREATE POLICY "Users can view own sessions"
  ON public.exam_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON public.exam_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 2. Add mode column to user_answers (tracks practice vs timed)
ALTER TABLE public.user_answers
  ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'practice' CHECK (mode IN ('practice', 'timed'));

-- 3. Add exam_session_id FK to user_answers
ALTER TABLE public.user_answers
  ADD COLUMN IF NOT EXISTS exam_session_id UUID REFERENCES public.exam_sessions(id) ON DELETE CASCADE;

-- 4. Add exam_type to user_answers (used for per-exam quota checks on questions/practice pages)
ALTER TABLE public.user_answers
  ADD COLUMN IF NOT EXISTS exam_type TEXT;

CREATE INDEX IF NOT EXISTS idx_user_answers_exam_type ON public.user_answers(user_id, exam_type);

-- 5. Index for fast lookup by session (used in review pages)
CREATE INDEX IF NOT EXISTS idx_user_answers_session ON public.user_answers(exam_session_id);

-- 6. Unique constraint to allow upsert(onConflict: 'exam_session_id,question_id')
--    Only enforced when exam_session_id is not null
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_answers_session_question
  ON public.user_answers(exam_session_id, question_id)
  WHERE exam_session_id IS NOT NULL;

COMMENT ON TABLE public.exam_sessions IS 'Records every completed practice or timed exam session';
