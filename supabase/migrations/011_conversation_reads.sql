-- Per-user "last read" timestamps for lobby rooms and DMs.
-- Used by hooks/useNotifications.ts for unread-message counts; the table was
-- referenced by code but never created, causing sitewide 404s on its queries.
CREATE TABLE IF NOT EXISTS conversation_reads (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id   text NOT NULL,
  conversation_type text NOT NULL CHECK (conversation_type IN ('room', 'dm')),
  last_read_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, conversation_id, conversation_type)
);

ALTER TABLE conversation_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conversation_reads: users own their data"
  ON conversation_reads FOR ALL USING (auth.uid() = user_id);
