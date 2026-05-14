CREATE TABLE IF NOT EXISTS public.starred_questions (
  user_id     UUID   NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id BIGINT NOT NULL,
  exam_type   TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, question_id)
);

ALTER TABLE public.starred_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own starred questions" ON public.starred_questions;
CREATE POLICY "Users manage own starred questions" ON public.starred_questions
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
