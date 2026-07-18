-- Study partner scheduling + the missing piece of the invite flow.
--
-- 013 added partner_status to friendships but nothing records WHO sent the
-- invite, so the accept/decline UI can't tell inviter from invitee.
ALTER TABLE friendships
  ADD COLUMN IF NOT EXISTS partner_invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- The live update policy on friendships is addressee-only (it was built for
-- accepting friend requests): a requester's UPDATE silently no-ops. Partner
-- invites are written by either party, so add a permissive policy covering
-- both (permissive policies OR together with the existing one).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'friendships' AND policyname = 'friendships: parties can update'
  ) THEN
    CREATE POLICY "friendships: parties can update"
      ON friendships FOR UPDATE
      TO authenticated
      USING (auth.uid() = requester_id OR auth.uid() = addressee_id)
      WITH CHECK (auth.uid() = requester_id OR auth.uid() = addressee_id);
  END IF;
END $$;

-- Invite toasts are delivered via a postgres_changes UPDATE subscription on
-- friendships, which requires the table in the realtime publication.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'friendships'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE friendships;
  END IF;
END $$;

-- Scheduled sessions between study partners, keyed by the friendship row
-- (partner = upgraded friendship; there is no separate partnership table).
CREATE TABLE IF NOT EXISTS study_sessions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  friendship_id uuid NOT NULL REFERENCES friendships(id) ON DELETE CASCADE,
  proposed_by   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_at  timestamptz NOT NULL,
  status        text NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'confirmed', 'done', 'cancelled')),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_study_sessions_friendship
  ON study_sessions (friendship_id, scheduled_at DESC);

ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

-- The partner panel live-syncs the session list via postgres_changes.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'study_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE study_sessions;
  END IF;
END $$;

-- Only the two people on the friendship row can see or touch its sessions.
CREATE POLICY "study_sessions: partners only"
  ON study_sessions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM friendships f
      WHERE f.id = friendship_id
        AND (auth.uid() = f.requester_id OR auth.uid() = f.addressee_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM friendships f
      WHERE f.id = friendship_id
        AND (auth.uid() = f.requester_id OR auth.uid() = f.addressee_id)
    )
  );
