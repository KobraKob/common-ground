-- Performance indexes for the primary feed, collaboration and event access paths.
-- This migration is additive and does not modify application data.

CREATE INDEX IF NOT EXISTS ix_posts_feed_ordering_v2
  ON posts (is_hidden_by_mod, is_pinned DESC, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS ix_posts_college_feed_v2
  ON posts (college_id, is_hidden_by_mod, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS ix_posts_community_feed_v2
  ON posts (community_id, is_hidden_by_mod, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS ix_messages_conversation_timeline_v2
  ON messages (conversation_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS ix_conversation_members_user_conversation_v2
  ON conversation_members (user_id, conversation_id);

CREATE INDEX IF NOT EXISTS ix_community_memberships_user_community_v2
  ON community_memberships (user_id, community_id);

CREATE INDEX IF NOT EXISTS ix_project_members_project_status_v2
  ON project_members (project_id, status);

CREATE INDEX IF NOT EXISTS ix_events_start_time_v2
  ON events (starts_at ASC, id ASC);
