-- Onboarding walkthrough completion flag.
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

-- Existing users shouldn't see the tour retroactively — it's meant for
-- genuinely new signups (who get `false` from the column default going
-- forward), not everyone who happens to have the flag unset today.
UPDATE user_profiles SET onboarding_completed = true WHERE onboarding_completed = false;
