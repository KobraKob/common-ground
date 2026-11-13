-- Messaging access and inbox query indexes.
-- Safe to apply after 007_enable_application_rls.sql.
CREATE INDEX IF NOT EXISTS idx_conversation_members_user_conversation
    ON conversation_members (user_id, conversation_id);

CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at
    ON conversations (last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_sender_created
    ON messages (sender_id, created_at DESC);
