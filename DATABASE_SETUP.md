# Database Setup Guide

This guide will help you set up the required database tables in Supabase to make your dashboard work with real data.


```sql
-- Create user_answers table
CREATE TABLE IF NOT EXISTS public.user_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  question_id UUID NOT NULL,
  user_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_answers_user_id ON public.user_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_created_at ON public.user_answers(created_at);
CREATE INDEX IF NOT EXISTS idx_user_answers_question_id ON public.user_answers(question_id);

-- Enable Row Level Security
ALTER TABLE public.user_answers ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- Users can only read their own answers
CREATE POLICY "Users can view their own answers"
  ON public.user_answers
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own answers
CREATE POLICY "Users can insert their own answers"
  ON public.user_answers
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own answers
CREATE POLICY "Users can update their own answers"
  ON public.user_answers
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Optional: Add a function to auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.user_answers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
```

## How to Apply This:

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **"New Query"**
4. Copy and paste the SQL script above
5. Click **"Run"** or press `Ctrl/Cmd + Enter`

## Verify the Setup:

After running the SQL, verify:

```sql
-- Check if table exists
SELECT * FROM public.user_answers LIMIT 1;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'user_answers';
```

## Add Sample Data (Optional)

To test the dashboard with sample data:

```sql
-- Insert sample answers (replace with your actual user ID)
INSERT INTO public.user_answers (user_id, question_id, user_answer, is_correct, created_at)
VALUES
  (auth.uid(), gen_random_uuid(), 'A', true, now() - interval '2 days'),
  (auth.uid(), gen_random_uuid(), 'B', true, now() - interval '1 day'),
  (auth.uid(), gen_random_uuid(), 'C', false, now() - interval '1 day'),
  (auth.uid(), gen_random_uuid(), 'A', true, now()),
  (auth.uid(), gen_random_uuid(), 'D', true, now());
```

This will give you:
- **5 questions answered**
- **80% accuracy rate** (4 correct out of 5)
- **3-day study streak**
- **2 answers today**

## Expected Dashboard Display:

After adding sample data, your dashboard should show:

```
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│ Questions Answered  │  │ Accuracy Rate       │  │ Study Streak        │
│        5            │  │       80%           │  │      3 days         │
│ +2 today            │  │ Overall performance │  │ Keep it up!         │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘
```

## Troubleshooting

### Issue: "Could not fetch user stats" warning persists

**Solution:**
1. Make sure you're logged in
2. Verify RLS policies are enabled (see SQL above)
3. Check that your user ID matches: Run `SELECT auth.uid()` in SQL Editor
4. Clear browser cache and reload

### Issue: Stats show 0 even with data

**Solution:**
1. Check data exists: `SELECT * FROM user_answers WHERE user_id = auth.uid();`
2. Verify `created_at` timestamps are correct
3. Check `is_correct` is a boolean, not null

## Next Steps

Once the table is set up:
1. Answer some practice questions (when that feature is built)
2. Your stats will automatically update
3. Return to the dashboard to see your progress!

---

**Need Help?** Check the Supabase documentation or contact support.
