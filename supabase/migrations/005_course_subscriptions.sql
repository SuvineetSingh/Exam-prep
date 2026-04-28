-- Per-course subscription table
-- Replaces the single is_premium flag with per-course purchases at $50/course

CREATE TABLE IF NOT EXISTS public.course_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course TEXT NOT NULL CHECK (course IN ('CPA', 'CFA', 'FE')),
  stripe_session_id TEXT,
  purchased_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, course)
);

ALTER TABLE public.course_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own course subscriptions"
  ON public.course_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Service role key bypasses RLS, but we need an INSERT policy for the anon/authenticated
-- role in case we ever call this from a non-service context.
CREATE POLICY "Service role inserts course subscriptions"
  ON public.course_subscriptions FOR INSERT
  WITH CHECK (true);
