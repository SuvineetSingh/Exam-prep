-- Fix for user_answers table
-- This script handles cases where the table already exists with missing columns
-- Run this in your Supabase SQL Editor

-- First, check if table exists and add missing columns if needed
DO $$
BEGIN
  -- Add created_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'user_answers'
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.user_answers
    ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
  END IF;

  -- Add time_spent column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'user_answers'
    AND column_name = 'time_spent'
  ) THEN
    ALTER TABLE public.user_answers
    ADD COLUMN time_spent INTEGER DEFAULT 0;
  END IF;
END $$;

-- Create indexes (IF NOT EXISTS prevents errors if they already exist)
CREATE INDEX IF NOT EXISTS idx_user_answers_user_id ON public.user_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_question_id ON public.user_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_created_at ON public.user_answers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_answers_user_created ON public.user_answers(user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.user_answers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid errors
DROP POLICY IF EXISTS "Users can view own answers" ON public.user_answers;
DROP POLICY IF EXISTS "Users can insert own answers" ON public.user_answers;
DROP POLICY IF EXISTS "Users can update own answers" ON public.user_answers;

-- Create RLS Policies
CREATE POLICY "Users can view own answers"
  ON public.user_answers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own answers"
  ON public.user_answers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own answers"
  ON public.user_answers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add helpful comment
COMMENT ON TABLE public.user_answers IS 'Tracks user question attempts for statistics and progress tracking';
