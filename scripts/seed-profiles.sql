-- ============================================================
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- It applies migration 003 and seeds profiles for the 5 test users
-- ============================================================

-- Step 1: Add is_premium column if it doesn't exist
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN NOT NULL DEFAULT false;

-- Step 2: Create profiles for the 5 test auth users
-- Looks up each user's ID from auth.users by email
INSERT INTO user_profiles (id, username, full_name, exam_type, industry, bio, is_premium, last_seen_at)
SELECT
  au.id,
  p.username,
  p.full_name,
  p.exam_type,
  p.industry,
  p.bio,
  p.is_premium,
  now()
FROM auth.users au
JOIN (VALUES
  ('alice.test@examprep.dev',  'alice_cpa',   'Alice Chen',     'CPA', 'Finance',            'CPA candidate, 3rd attempt. Let''s go.',       true),
  ('bob.test@examprep.dev',    'bob_cfa',     'Bob Patel',      'CFA', 'Investment Banking', 'Level II CFA. Grinding every day.',             false),
  ('carol.test@examprep.dev',  'carol_fe',    'Carol Nguyen',   'FE',  'Engineering',        'Civil engineer prepping for FE exam.',          true),
  ('david.test@examprep.dev',  'david_cpa2',  'David Kim',      'CPA', 'Accounting',         'Big 4 staff accountant, CPA or bust.',          false),
  ('eva.test@examprep.dev',    'eva_cfa2',    'Eva Martinez',   'CFA', 'Asset Management',   'Level I CFA. Study group welcome!',             true)
) AS p(email, username, full_name, exam_type, industry, bio, is_premium)
  ON au.email = p.email
ON CONFLICT (id) DO UPDATE SET
  username    = EXCLUDED.username,
  full_name   = EXCLUDED.full_name,
  exam_type   = EXCLUDED.exam_type,
  industry    = EXCLUDED.industry,
  bio         = EXCLUDED.bio,
  is_premium  = EXCLUDED.is_premium,
  last_seen_at = now();

-- Step 3: Verify
SELECT
  au.email,
  up.username,
  up.exam_type,
  up.industry,
  CASE WHEN up.is_premium THEN '🥇 Pro' ELSE '⬜ Basic' END AS plan
FROM auth.users au
JOIN user_profiles up ON au.id = up.id
WHERE au.email LIKE '%.test@examprep.dev'
ORDER BY au.email;
