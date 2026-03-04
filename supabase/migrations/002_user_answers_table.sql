-- Create user_answers table to track question attempts and statistics
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.user_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_spent INTEGER DEFAULT 0, -- in seconds
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance (with IF NOT EXISTS check)
CREATE INDEX IF NOT EXISTS idx_user_answers_user_id ON public.user_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_question_id ON public.user_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_created_at ON public.user_answers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_answers_user_created ON public.user_answers(user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.user_answers ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist (to avoid errors on re-run)
DROP POLICY IF EXISTS "Users can view own answers" ON public.user_answers;
DROP POLICY IF EXISTS "Users can insert own answers" ON public.user_answers;
DROP POLICY IF EXISTS "Users can update own answers" ON public.user_answers;

-- RLS Policies

-- Users can view their own answers
CREATE POLICY "Users can view own answers"
  ON public.user_answers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own answers
CREATE POLICY "Users can insert own answers"
  ON public.user_answers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own answers (for time tracking, etc.)
CREATE POLICY "Users can update own answers"
  ON public.user_answers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add helpful comment
COMMENT ON TABLE public.user_answers IS 'Tracks user question attempts for statistics and progress tracking';
