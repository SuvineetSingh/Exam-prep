-- Migration 003: Premium subscription fields + conversation reads
-- Run this in the Supabase SQL Editor

-- 1. Extend user_profiles with premium/Stripe fields
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS premium_purchased_at TIMESTAMPTZ;

-- 2. Track per-user conversation read timestamps (for persistent unread counts)
CREATE TABLE IF NOT EXISTS conversation_reads (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id TEXT NOT NULL,
  conversation_type TEXT NOT NULL CHECK (conversation_type IN ('room', 'dm')),
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, conversation_id, conversation_type)
);

ALTER TABLE conversation_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own reads"
  ON conversation_reads
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
