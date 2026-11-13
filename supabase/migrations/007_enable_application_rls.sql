-- All application data is accessed through the authenticated FastAPI service.
-- The browser uses Supabase Auth only; it does not query public tables directly.
-- Enable RLS so the public anon/authenticated PostgREST roles cannot bypass the
-- backend's profile visibility, block, moderation and membership checks.
-- The backend DATABASE_URL must use the trusted table-owner/service database role.

DO $$
DECLARE
  table_name TEXT;
  app_tables TEXT[] := ARRAY[
    'colleges', 'users', 'student_profiles', 'affiliation_claims',
    'verification_records', 'communities', 'community_memberships',
    'posts', 'polls', 'poll_votes', 'comments', 'reactions', 'resources',
    'conversations', 'conversation_members', 'messages', 'events',
    'event_rsvps', 'event_attendance', 'projects', 'project_members',
    'tasks', 'user_blocks', 'user_mutes', 'reports', 'moderation_actions',
    'notifications', 'analytics_events', 'mentorship_profiles', 'mentorship_requests'
  ];
BEGIN
  FOREACH table_name IN ARRAY app_tables LOOP
    IF to_regclass(format('public.%I', table_name)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon', table_name);
      END IF;
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        EXECUTE format('REVOKE ALL ON TABLE public.%I FROM authenticated', table_name);
      END IF;
    END IF;
  END LOOP;
END $$;

-- No anon/authenticated policies are intentionally created. All access flows
-- through the backend, where per-user and moderator permissions are enforced.
