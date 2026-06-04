-- User XP totals
CREATE TABLE IF NOT EXISTS user_xp (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp   integer NOT NULL DEFAULT 0,
  level      integer NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Individual XP transactions
CREATE TABLE IF NOT EXISTS xp_transactions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount       integer NOT NULL,
  source       text NOT NULL,
  reference_id text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- User badge unlocks
CREATE TABLE IF NOT EXISTS user_achievements (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_key text NOT NULL,
  earned_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_key)
);

ALTER TABLE user_xp ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_xp: users own their data"
  ON user_xp FOR ALL USING (auth.uid() = user_id);

ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "xp_transactions: users own their data"
  ON xp_transactions FOR ALL USING (auth.uid() = user_id);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_achievements: users own their data"
  ON user_achievements FOR ALL USING (auth.uid() = user_id);
