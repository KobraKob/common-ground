-- CommonGround 001_init_schema.sql
-- Master PostgreSQL Schema Migration

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Core Enums
CREATE TYPE platform_role AS ENUM ('USER', 'MODERATOR', 'ADMIN');
CREATE TYPE verification_stage AS ENUM ('STAGE_1_PROVISIONAL', 'STAGE_2_COMMUNITY_VALIDATED', 'STAGE_3_INSTITUTIONAL_VERIFIED', 'STAGE_4_OFFICIAL_PARTNER');
CREATE TYPE profile_visibility AS ENUM ('PUBLIC', 'CAMPUS_ONLY', 'SHARED_COMMUNITIES_ONLY');
CREATE TYPE dm_permission AS ENUM ('EVERYONE', 'SAME_CAMPUS_OR_COMMUNITY', 'NONE');
CREATE TYPE community_type AS ENUM ('CAMPUS_HUB', 'DEPARTMENT', 'CLASS_COHORT', 'CLUB', 'CROSS_CAMPUS_INTEREST', 'PROJECT_GROUP');
CREATE TYPE community_visibility AS ENUM ('PUBLIC', 'CAMPUS_RESTRICTED', 'PRIVATE_INVITE_ONLY');
CREATE TYPE member_role AS ENUM ('MEMBER', 'MODERATOR', 'OWNER');
CREATE TYPE post_category AS ENUM ('DISCUSSION', 'QUESTION_QA', 'ANNOUNCEMENT', 'HANGOUT_MEME', 'OPPORTUNITY');
CREATE TYPE conversation_type AS ENUM ('DIRECT', 'GROUP_CHAT', 'ANNOUNCEMENT_CHANNEL');
CREATE TYPE project_stage AS ENUM ('IDEA', 'RECRUITING', 'PROTOTYPING', 'LIVE', 'COMPLETED');
CREATE TYPE report_target_type AS ENUM ('USER', 'POST', 'COMMENT', 'MESSAGE', 'COMMUNITY', 'EVENT', 'PROJECT', 'RESOURCE');
CREATE TYPE report_status AS ENUM ('PENDING', 'UNDER_REVIEW', 'RESOLVED_ACTION_TAKEN', 'DISMISSED');

-- 1. colleges
CREATE TABLE colleges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    short_name VARCHAR(50) NOT NULL,
    city VARCHAR(100) NOT NULL DEFAULT 'Bengaluru',
    state VARCHAR(100) NOT NULL DEFAULT 'Karnataka',
    email_domains TEXT[] DEFAULT '{}',
    is_official_partner BOOLEAN DEFAULT FALSE,
    is_active_cluster BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. users & student_profiles
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    platform_role platform_role DEFAULT 'USER',
    is_suspended BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE student_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    handle VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    college_id UUID REFERENCES colleges(id) ON DELETE SET NULL,
    verification_stage verification_stage DEFAULT 'STAGE_1_PROVISIONAL',
    course_branch VARCHAR(120),
    graduation_year INT,
    skills TEXT[] DEFAULT '{}',
    interests TEXT[] DEFAULT '{}',
    collaboration_goals TEXT[] DEFAULT '{}',
    profile_visibility profile_visibility DEFAULT 'PUBLIC',
    show_course_year BOOLEAN DEFAULT TRUE,
    dm_permission dm_permission DEFAULT 'SAME_CAMPUS_OR_COMMUNITY',
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. affiliation_claims & verification_records
CREATE TABLE affiliation_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    claimed_stage verification_stage NOT NULL,
    institutional_email VARCHAR(255),
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE verification_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    verified_stage verification_stage NOT NULL,
    method VARCHAR(50) NOT NULL,
    verified_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. communities & community_memberships
CREATE TABLE communities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(150) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    community_type community_type NOT NULL,
    visibility community_visibility DEFAULT 'PUBLIC',
    college_id UUID REFERENCES colleges(id) ON DELETE SET NULL,
    is_official_endorsed BOOLEAN DEFAULT FALSE,
    invite_code VARCHAR(32) UNIQUE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    member_count INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE community_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role member_role DEFAULT 'MEMBER',
    is_muted BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_community_user UNIQUE(community_id, user_id)
);

-- 5. posts, polls, poll_votes, comments, reactions, resources
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    college_id UUID REFERENCES colleges(id) ON DELETE SET NULL,
    category post_category NOT NULL,
    title VARCHAR(300),
    body TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    is_cross_campus BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    accepted_answer_comment_id UUID,
    opportunity_meta JSONB,
    upvotes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    is_hidden_by_mod BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE polls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID UNIQUE NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    question VARCHAR(300) NOT NULL,
    options JSONB NOT NULL DEFAULT '[]',
    expires_at TIMESTAMPTZ
);

CREATE TABLE poll_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    option_id VARCHAR(50) NOT NULL,
    CONSTRAINT uq_poll_user UNIQUE(poll_id, user_id)
);

CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    is_useful_answer BOOLEAN DEFAULT FALSE,
    upvotes_count INT DEFAULT 0,
    is_hidden_by_mod BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add FK for posts.accepted_answer_comment_id
ALTER TABLE posts ADD CONSTRAINT fk_posts_accepted_answer
    FOREIGN KEY (accepted_answer_comment_id) REFERENCES comments(id) ON DELETE SET NULL;

CREATE TABLE reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type VARCHAR(32) NOT NULL,
    target_id UUID NOT NULL,
    reaction_type VARCHAR(32) DEFAULT 'UPVOTE',
    CONSTRAINT uq_reaction UNIQUE(user_id, target_type, target_id)
);

CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uploader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    college_id UUID REFERENCES colleges(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_url TEXT,
    external_link TEXT,
    subject_tags TEXT[] DEFAULT '{}',
    is_pinned BOOLEAN DEFAULT FALSE,
    is_public_commons BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. conversations, conversation_members, messages
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_type conversation_type NOT NULL,
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    title VARCHAR(150),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    last_message_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE conversation_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role member_role DEFAULT 'MEMBER',
    is_muted BOOLEAN DEFAULT FALSE,
    quiet_hours_until TIMESTAMPTZ,
    last_read_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_conv_member UNIQUE(conversation_id, user_id)
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reply_to_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    body TEXT NOT NULL,
    attachments JSONB DEFAULT '[]',
    is_announcement BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. events & event_rsvps
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    college_id UUID REFERENCES colleges(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    is_online BOOLEAN DEFAULT FALSE,
    venue_or_link TEXT NOT NULL,
    is_cross_campus BOOLEAN DEFAULT TRUE,
    safety_notes TEXT,
    rsvp_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE event_rsvps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(32) DEFAULT 'GOING',
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_event_rsvp UNIQUE(event_id, user_id)
);

-- 8. projects, project_members, tasks
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    college_id UUID REFERENCES colleges(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    pitch VARCHAR(300) NOT NULL,
    description TEXT NOT NULL,
    stage project_stage DEFAULT 'IDEA',
    skills_needed TEXT[] DEFAULT '{}',
    open_roles TEXT[] DEFAULT '{}',
    is_cross_campus_open BOOLEAN DEFAULT TRUE,
    repo_or_demo_links JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_title VARCHAR(100),
    status VARCHAR(50) DEFAULT 'PENDING_REQUEST',
    pitch_note TEXT,
    joined_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_project_member UNIQUE(project_id, user_id)
);

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'TODO',
    assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. user_blocks, user_mutes, reports, moderation_actions, notifications, analytics_events
CREATE TABLE user_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_user_block UNIQUE(blocker_id, blocked_id)
);

CREATE TABLE user_mutes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    muted_target_type VARCHAR(50) NOT NULL,
    muted_target_value VARCHAR(150) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type report_target_type NOT NULL,
    target_id UUID NOT NULL,
    reason VARCHAR(100) NOT NULL,
    details TEXT,
    status report_status DEFAULT 'PENDING',
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    resolved_at TIMESTAMPTZ
);

CREATE TABLE moderation_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    report_id UUID REFERENCES reports(id) ON DELETE SET NULL,
    action_type VARCHAR(50) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id UUID NOT NULL,
    notes TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    action_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_name VARCHAR(100) NOT NULL,
    college_id UUID REFERENCES colleges(id) ON DELETE SET NULL,
    is_cross_campus_interaction BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Full-Text Search Indexes & Performance GIN indexes
CREATE INDEX idx_posts_community_created ON posts (community_id, created_at DESC);
CREATE INDEX idx_posts_college_created ON posts (college_id, created_at DESC);
CREATE INDEX idx_posts_tags_gin ON posts USING GIN (tags);
CREATE INDEX idx_posts_fts ON posts USING GIN (to_tsvector('english', coalesce(title, '') || ' ' || body));
CREATE INDEX idx_resources_fts ON resources USING GIN (to_tsvector('english', title || ' ' || coalesce(description, '')));
CREATE INDEX idx_messages_conv_created ON messages (conversation_id, created_at DESC);
CREATE INDEX idx_messages_fts ON messages USING GIN (to_tsvector('english', body));
CREATE INDEX idx_profiles_skills_gin ON student_profiles USING GIN (skills);
CREATE INDEX idx_profiles_interests_gin ON student_profiles USING GIN (interests);
