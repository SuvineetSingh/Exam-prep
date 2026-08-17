-- User-created rooms (Discord-style): a user creates a room, becomes its
-- owner, can appoint co-admins, and manage membership. Curated/admin-seeded
-- rooms (owner_id IS NULL) are untouched and stay open to everyone.
--
-- IMPORTANT — read before running: this is the first migration in this repo
-- to define RLS on lobby_rooms/lobby_messages. Pre-009 schema (including
-- whatever RLS already exists on these two tables live) was applied via the
-- Supabase dashboard and isn't tracked here. Before running this file,
-- check for pre-existing policies:
--   select * from pg_policies where tablename in ('lobby_rooms','lobby_messages');
-- If policies already exist under different names than the ones below, they
-- will keep applying alongside these (Postgres OR's all matching policies
-- together per command) — review them for conflicts before relying on the
-- privacy guarantees here. The `DROP POLICY IF EXISTS` guards below only
-- make *this file's own* policies safe to re-run, not a full reset.

ALTER TABLE lobby_rooms
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS is_user_created boolean NOT NULL DEFAULT false;

-- Pre-existing gap, not introduced by this migration: app/api/stripe/{webhook,verify}
-- already write user_profiles.is_premium/premium_purchased_at and this Pro-gate
-- policy below reads is_premium, but the column was never actually applied to
-- this live DB (scripts/seed-profiles.sql shows it was only ever added ad hoc
-- elsewhere) — same class of drift as the CPA→CMA migration gotcha. Adding it
-- here since this is the first migration that depends on it.
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS premium_purchased_at timestamptz;

CREATE TABLE IF NOT EXISTS room_members (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id   uuid NOT NULL REFERENCES lobby_rooms(id) ON DELETE CASCADE,
  user_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role      text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'co_admin', 'member')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_room_members_user ON room_members (user_id);
CREATE INDEX IF NOT EXISTS idx_room_members_room ON room_members (room_id);

ALTER TABLE lobby_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE lobby_messages ENABLE ROW LEVEL SECURITY;

-- ── lobby_rooms ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "lobby_rooms: read curated or member" ON lobby_rooms;
CREATE POLICY "lobby_rooms: read curated or member"
  ON lobby_rooms FOR SELECT TO authenticated
  USING (
    is_user_created = false
    OR EXISTS (SELECT 1 FROM room_members m WHERE m.room_id = lobby_rooms.id AND m.user_id = auth.uid())
  );

-- Real Pro gate: a free user calling .insert() directly gets denied here
-- regardless of client-side UI state. Checks course_subscriptions rather
-- than user_profiles.is_premium — is_premium is a convenience flag the
-- Stripe webhook is *supposed* to keep in sync, but it just went from
-- nonexistent to defaulting false for every current row (see column add
-- above), so it's false for already-paying users until their next webhook
-- fire. course_subscriptions is the same authoritative source GET
-- /api/me/pro already uses, and it's actually populated for existing users.
DROP POLICY IF EXISTS "lobby_rooms: pro users create" ON lobby_rooms;
CREATE POLICY "lobby_rooms: pro users create"
  ON lobby_rooms FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = owner_id
    AND is_user_created = true
    AND EXISTS (SELECT 1 FROM course_subscriptions cs WHERE cs.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "lobby_rooms: owner or co_admin update" ON lobby_rooms;
CREATE POLICY "lobby_rooms: owner or co_admin update"
  ON lobby_rooms FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM room_members m WHERE m.room_id = lobby_rooms.id AND m.user_id = auth.uid() AND m.role IN ('owner', 'co_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM room_members m WHERE m.room_id = lobby_rooms.id AND m.user_id = auth.uid() AND m.role IN ('owner', 'co_admin')));

-- ── room_members ─────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "room_members: members read roster" ON room_members;
CREATE POLICY "room_members: members read roster"
  ON room_members FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM room_members me WHERE me.room_id = room_members.room_id AND me.user_id = auth.uid()));

-- Room creation is two client-side inserts (lobby_rooms then room_members),
-- same non-atomic two-step idiom as inviteStudyPartner in partnerQueries.ts.
-- This policy only allows a user to insert themselves as owner of a room
-- they actually just created.
DROP POLICY IF EXISTS "room_members: self-insert as owner" ON room_members;
CREATE POLICY "room_members: self-insert as owner"
  ON room_members FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND role = 'owner'
    AND EXISTS (SELECT 1 FROM lobby_rooms r WHERE r.id = room_id AND r.owner_id = auth.uid())
  );

-- Joining via an accepted invite is added in 017_room_invites.sql once
-- room_invites exists (that policy references this table by name, added
-- there rather than here to keep each migration scoped to what it needs).

DROP POLICY IF EXISTS "room_members: admins remove, self leaves" ON room_members;
CREATE POLICY "room_members: admins remove, self leaves"
  ON room_members FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM room_members admin WHERE admin.room_id = room_members.room_id AND admin.user_id = auth.uid() AND admin.role IN ('owner', 'co_admin'))
  );

-- Only the owner promotes/demotes, and only between co_admin/member (can't
-- touch the owner row itself via this policy).
DROP POLICY IF EXISTS "room_members: owner changes role" ON room_members;
CREATE POLICY "room_members: owner changes role"
  ON room_members FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM room_members o WHERE o.room_id = room_members.room_id AND o.user_id = auth.uid() AND o.role = 'owner'))
  WITH CHECK (role IN ('co_admin', 'member'));

-- ── lobby_messages ───────────────────────────────────────────────────────
-- Extends read/send access to respect room privacy. DM rows and curated-room
-- rows behave exactly as before.

DROP POLICY IF EXISTS "lobby_messages: read own dm or visible room" ON lobby_messages;
CREATE POLICY "lobby_messages: read own dm or visible room"
  ON lobby_messages FOR SELECT TO authenticated
  USING (
    (message_type = 'dm' AND (auth.uid() = sender_id OR auth.uid() = recipient_id))
    OR (message_type = 'room' AND EXISTS (
      SELECT 1 FROM lobby_rooms r
      WHERE r.id = lobby_messages.room_id
        AND (r.is_user_created = false OR EXISTS (SELECT 1 FROM room_members m WHERE m.room_id = r.id AND m.user_id = auth.uid()))
    ))
  );

DROP POLICY IF EXISTS "lobby_messages: send own dm or member room" ON lobby_messages;
CREATE POLICY "lobby_messages: send own dm or member room"
  ON lobby_messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND (
      (message_type = 'dm' AND recipient_id IS NOT NULL)
      OR (message_type = 'room' AND EXISTS (
        SELECT 1 FROM lobby_rooms r
        WHERE r.id = room_id
          AND (r.is_user_created = false OR EXISTS (SELECT 1 FROM room_members m WHERE m.room_id = r.id AND m.user_id = auth.uid()))
      ))
    )
  );

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'room_members') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE room_members;
  END IF;
END $$;
