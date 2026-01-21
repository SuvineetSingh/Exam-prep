# Supabase Setup Guide

## 📋 Quick Start

### Step 1: Get Your Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project (or create a new one)
3. Navigate to: **Settings** (gear icon) → **API**
4. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (long JWT token starting with `eyJ...`)

### Step 2: Configure Environment Variables

1. Open the `.env.local` file in your project root
2. Replace the placeholder values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **Important:** 
- Use the **anon public** key (NOT the service_role key)
- Don't add quotes around the values
- Don't add trailing slashes to the URL

### Step 3: Restart Dev Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

### Step 4: Test Connection

Visit: http://localhost:3000/test-db

You should see: ✅ **Successfully connected to Supabase!**

---

## 🗄️ Database Setup

### Create Tables

Run this SQL in your Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  subscription_plan TEXT DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Questions table
CREATE TABLE public.questions (
  id BIGSERIAL PRIMARY KEY,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('CPA', 'CFA', 'FE')),
  category TEXT NOT NULL,
  subcategory TEXT,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  explanation TEXT,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User answers table
CREATE TABLE public.user_answers (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id BIGINT REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_answer CHAR(1) NOT NULL,
  is_correct BOOLEAN NOT NULL,
  mode TEXT CHECK (mode IN ('practice', 'exam')),
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exam sessions table
CREATE TABLE public.exam_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_type TEXT NOT NULL,
  question_count INTEGER NOT NULL,
  time_limit INTEGER,
  score INTEGER,
  percentage DECIMAL(5,2),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- User payments table
CREATE TABLE public.user_payments (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_questions_exam_type ON public.questions(exam_type);
CREATE INDEX idx_questions_category ON public.questions(category);
CREATE INDEX idx_user_answers_user_id ON public.user_answers(user_id);
CREATE INDEX idx_user_answers_question_id ON public.user_answers(question_id);
CREATE INDEX idx_exam_sessions_user_id ON public.exam_sessions(user_id);
CREATE INDEX idx_user_payments_user_id ON public.user_payments(user_id);
```

### Enable Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_payments ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Questions policies (paid users only)
CREATE POLICY "Paid users can view questions"
  ON public.questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_payments
      WHERE user_id = auth.uid()
      AND status = 'completed'
    )
  );

-- User answers policies
CREATE POLICY "Users can view own answers"
  ON public.user_answers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own answers"
  ON public.user_answers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Exam sessions policies
CREATE POLICY "Users can view own sessions"
  ON public.exam_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions"
  ON public.exam_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Payments policies
CREATE POLICY "Users can view own payments"
  ON public.user_payments FOR SELECT
  USING (auth.uid() = user_id);
```

---

## 🔐 Authentication Setup

Authentication is already configured! The middleware in `middleware.ts` handles session management.

### Enable Email Auth

1. Go to: **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure email templates (optional)

### Add Sample User (for testing)

```sql
-- This will be done through the signup flow in your app
-- Or manually in Supabase Dashboard → Authentication → Users
```

---

## ✅ Verification Checklist

- [ ] Environment variables set in `.env.local`
- [ ] Dev server restarted
- [ ] Test page shows ✅ success
- [ ] Database tables created
- [ ] RLS policies enabled
- [ ] Email authentication enabled

---

## 🔧 Troubleshooting

### "Missing Supabase environment variables"

**Cause:** `.env.local` file not found or not loaded

**Fix:**
1. Ensure `.env.local` exists in project root
2. Check file name is exactly `.env.local` (not `.env.local.txt`)
3. Restart dev server: `npm run dev`

### "Invalid API key" or "JWT expired"

**Cause:** Wrong API key or expired key

**Fix:**
1. Get fresh keys from Supabase Dashboard → Settings → API
2. Use **anon public** key (not service_role)
3. Copy the entire key (they're long!)

### "Row Level Security policy violation"

**Cause:** User trying to access data they don't have permission for

**Fix:**
1. Check RLS policies are set up correctly
2. Ensure user is authenticated
3. Verify payment status for paid features

### Connection works but can't query tables

**Cause:** Tables don't exist or RLS blocks access

**Fix:**
1. Run the table creation SQL in Supabase dashboard
2. Enable RLS policies
3. Check user authentication status

---

## 📚 Next Steps

1. **Add Sample Questions**: Insert test data to your questions table
2. **Test Authentication**: Create signup/login pages
3. **Build Features**: Start with question display and practice mode
4. **Set up Stripe**: Configure payment processing
5. **Deploy**: Push to Vercel and connect production Supabase

---

## 🔗 Useful Links

- [Supabase Dashboard](https://app.supabase.com)
- [Supabase Docs](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js + Supabase Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)

---

**Need Help?** Check the `/documentation` folder for more details!
