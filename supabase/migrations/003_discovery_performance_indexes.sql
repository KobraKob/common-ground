-- Query-path indexes for campus discovery, collaboration and product analytics.
-- Safe to apply repeatedly; no table or column data is changed.
CREATE INDEX IF NOT EXISTS ix_projects_stage_created_at
  ON projects (stage, created_at DESC);

CREATE INDEX IF NOT EXISTS ix_project_members_project_status_user
  ON project_members (project_id, status, user_id);

CREATE INDEX IF NOT EXISTS ix_events_starts_at_college
  ON events (starts_at, college_id);

CREATE INDEX IF NOT EXISTS ix_event_rsvps_event_user
  ON event_rsvps (event_id, user_id);

CREATE INDEX IF NOT EXISTS ix_communities_type_visibility_members
  ON communities (community_type, visibility, member_count DESC);

CREATE INDEX IF NOT EXISTS ix_messages_conversation_created
  ON messages (conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS ix_conversation_members_user_conversation
  ON conversation_members (user_id, conversation_id);

CREATE INDEX IF NOT EXISTS ix_analytics_events_user_created
  ON analytics_events (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS ix_tasks_project_created
  ON tasks (project_id, created_at);
