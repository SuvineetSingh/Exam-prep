-- Preferred study time-of-day, collected in the onboarding tour's profile
-- step and editable later in Settings. Feeds study-partner/room matching
-- alongside the existing industry/country_code fields.
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS study_time text CHECK (study_time IN ('morning', 'afternoon', 'night'));
