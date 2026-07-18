-- Study partner = an upgrade of an existing friendship, not a separate
-- relationship table. The friends-only DM gate means two users are always
-- already friends before a partner invite can be sent (it happens inside a
-- DM), so the partnership lives on the friendships row itself.
--
-- Live friendships schema (not in this repo's migration history):
--   id uuid PK, requester_id uuid, addressee_id uuid, status text, created_at timestamptz

ALTER TABLE friendships
  ADD COLUMN IF NOT EXISTS is_study_partner boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS partner_status text CHECK (partner_status IN ('pending', 'active', 'ended')),
  ADD COLUMN IF NOT EXISTS partner_since timestamptz,
  -- Which lobby room the connection originated in, for lobby→partner funnel
  -- analysis. Copied from the dm_started activity event when the invite is sent.
  ADD COLUMN IF NOT EXISTS partner_originating_room_id uuid REFERENCES lobby_rooms(id) ON DELETE SET NULL;
