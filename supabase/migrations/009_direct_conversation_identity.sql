-- Give each direct-message pair one stable conversation identity.
-- Existing group and announcement conversations remain unaffected.
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS direct_key VARCHAR(64);
CREATE UNIQUE INDEX IF NOT EXISTS uq_conversations_direct_key
  ON conversations (direct_key)
  WHERE direct_key IS NOT NULL;
