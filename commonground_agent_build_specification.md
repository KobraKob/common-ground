# CommonGround — AI Coding Agent Build Specification (`build.md`)

> **Purpose of this file:** This is the master engineering blueprint and execution guide for building **CommonGround**, a Bengaluru-first cross-campus student network, communication layer, and collaboration platform.
> **Instructions for the Coding Agent:** Read this entire specification before writing code. Follow the **Phased Execution Plan (Section 8)** sequentially. Do not skip database constraints, permission checks, or safety/moderation workflows. Verify each phase against the **Acceptance Criteria** before moving to the next.

---

## 1. Product Context & Core Engineering Rules

### 1.1 What CommonGround Is
CommonGround connects college students across Bengaluru (and eventually other cities) in one unified environment combining:
1. **Campus:** Student-led college homepages, departments, announcements, and campus events.
2. **City:** Cross-campus discovery of people, communities, events, and discussions across the city.
3. **Commons:** Searchable Q&A, study notes, reusable resources, and topic discussions that outlive chat history.
4. **Communication (Groups & Messaging):** Organized student group chats with separated announcements, threads, pinned resources, and 1-to-1 DMs.
5. **Projects & Opportunities:** Lightweight team formation ("I have an idea -> we are building it") and curated student opportunities (hackathons, internships, workshops).
6. **Hangout:** Informal student social energy (polls, prompts, interest rooms, casual campus moments).

### 1.2 Strict Guardrails (DOs and DON'Ts)
- **DO build a Modular Monolith:** Keep backend domains cleanly separated by module (`identity`, `colleges`, `communities`, `posts`, `messaging`, `events`, `projects`, `moderation`), all running within a single deployable service.
- **DO enforce backend authorization on every action:** Never rely solely on frontend UI hiding. Enforce Role-Based Access Control (RBAC), privacy visibility, and block-list filtering at the API and database levels.
- **DO distinguish provisional vs. verified status:** Never imply official college endorsement when a student selects a college. Clearly badge accounts and spaces as `provisional`, `student_verified`, `email_verified`, or `official_institution`.
- **DO separate public content from private group content:** Private group messages, posts, and files must never leak into global search, city feeds, or unauthenticated endpoints.
- **DO NOT build deferred features:** Do **not** implement microservices, AI recommendation engines, payment gateways, a buyer/seller marketplace, gamification streaks/leaderboards, or LMS grading tools.

---

## 2. Tech Stack & Repository Structure

### 2.1 Technology Stack
- **Frontend:** Next.js (App Router), React 19, TypeScript (strict mode), Tailwind CSS, Lucide Icons, TanStack Query (server state), Zustand (client UI/realtime state).
- **Mobile Packaging Readiness:** Capacitor (`@capacitor/core`, `@capacitor/ios`, `@capacitor/android`) configured for mobile-first responsive viewports, safe-area insets, deep links, and push notification hooks.
- **Backend API:** Python 3.11+ with **FastAPI**, Pydantic v2, SQLAlchemy 2.0 (async) + AsyncPG, Alembic for migrations.
- **Database, Auth, Storage & Realtime:** **Supabase** (PostgreSQL 15+, Supabase Auth JWT verification, Supabase Storage buckets for media/resources, Supabase Realtime for live chat and notifications).
- **Validation & Security:** `slowapi` (or Redis-backed rate limiting) for anti-spam, strict MIME/size validation on uploads, structured JSON logging.

### 2.2 Monorepo Layout
Create the project using the following structure:

```text
commonground/
├── build.md
├── docker-compose.yml               # Local PostgreSQL / Redis / FastAPI dev environment
├── .env.example                     # Template for all required environment variables
├── supabase/
│   ├── config.toml
│   ├── migrations/                  # Ordered SQL migrations (001_init_schema.sql, etc.)
│   └── seed.sql                     # Initial Bengaluru college cluster & seed communities
├── backend/
│   ├── pyproject.toml               # Or requirements.txt
│   ├── alembic.ini
│   ├── app/
│   │   ├── main.py                  # FastAPI app entry, CORS, exception handlers, rate limiter
│   │   ├── core/
│   │   │   ├── config.py            # Pydantic Settings
│   │   │   ├── database.py          # Async SQLAlchemy engine & session dependency
│   │   │   ├── security.py          # Supabase JWT validation, current_user dependencies
│   │   │   ├── permissions.py       # RBAC & block/privacy enforcement helpers
│   │   │   └── rate_limit.py        # Rate limiting rules for auth, posts, messages, invites
│   │   ├── modules/
│   │   │   ├── identity/            # Users, StudentProfiles, AffiliationClaims, Verification, Blocks
│   │   │   ├── colleges/            # Colleges, Campus hubs, Campus directory
│   │   │   ├── communities/         # Communities (Groups), Memberships, Invites, Pinned Resources
│   │   │   ├── commons/             # Posts, Q&A, Comments, Reactions, Polls, Searchable Resources
│   │   │   ├── messaging/           # Conversations, ConversationMembers, Messages, Threads
│   │   │   ├── events/              # Events, EventRSVPs
│   │   │   ├── projects/            # Projects, ProjectMembers, Tasks, Opportunities
│   │   │   ├── notifications/       # In-app Notifications & preferences
│   │   │   ├── moderation/          # Reports, ModerationActions, Moderator Queue, Audit Logs
│   │   │   └── analytics/           # Activation & meaningful connection event tracking
│   │   └── tests/                   # Pytest async test suite covering RBAC, privacy, and core flows
└── frontend/
    ├── package.json
    ├── capacitor.config.ts          # Capacitor configuration for Android/iOS wrapper
    ├── next.config.ts
    ├── tailwind.config.ts
    └── src/
        ├── app/                     # Next.js App Router pages & layouts
        │   ├── (auth)/              # Login, Signup, Onboarding wizard
        │   ├── (main)/              # Authenticated shell with bottom/sidebar nav
        │   │   ├── campus/          # Module 5.1: College home base, departments, announcements
        │   │   ├── city/            # Module 5.2: Cross-college network, people/group discovery, Hangout
        │   │   ├── commons/         # Module 5.3: Searchable Q&A, study notes, resources
        │   │   ├── messages/        # Module 6: Direct & Group chats, Announcements tab, Threads
        │   │   ├── build/           # Modules 5.4 & 5.6: Projects workspace, Events & Opportunities
        │   │   ├── profile/         # User profile, verification status, privacy & block settings
        │   │   └── moderation/      # Platform & community moderator queues
        ├── components/
        │   ├── ui/                  # Reusable design primitives (badges, modals, drawers, inputs)
        │   ├── shared/              # TrustBadge, ReportModal, BlockButton, GlobalSearch, UserCard
        │   └── modules/             # Feature-specific components
        ├── lib/
        │   ├── api.ts               # Typed API client with auth token injection
        │   ├── supabase.ts          # Supabase browser/server client for Auth & Realtime
        │   └── validators.ts        # Zod schemas matching backend Pydantic models
        └── types/
            └── index.ts             # Shared TypeScript interfaces
```

---

## 3. Identity, Staged Trust & Permission Architecture

### 3.1 The 4-Stage Trust Model (Critical Requirement)
Every student affiliation claim and community space must carry an explicit trust state:
1. `STAGE_1_PROVISIONAL`: Open registration. Student selects a college from the Bengaluru list. Profile displays **"Provisional Student — Self-Reported"**.
2. `STAGE_2_COMMUNITY_VALIDATED`: Verified via an existing trusted campus representative or controlled peer invite code. Displays **"Peer-Validated Student"**.
3. `STAGE_3_INSTITUTIONAL_VERIFIED`: Verified via institutional `.edu.in` / `.ac.in` email OTP or manual ID check by platform moderators. Displays **"Verified Student"**.
4. `STAGE_4_OFFICIAL_PARTNER`: Reserved strictly for officially authorized college administration or faculty accounts/pages. Displays **"Official Institution Badge"**.

### 3.2 Role Hierarchy
- **Platform Roles (`users.platform_role`):**
  - `USER`: Standard student account.
  - `MODERATOR`: Can view the global moderation queue, resolve reports, hide content, and issue temporary suspensions.
  - `ADMIN`: Full platform control, college verification approval, moderator management, audit log review.
- **Community / Group Roles (`community_memberships.role`):**
  - `MEMBER`: Can read, post, comment, and chat according to group rules.
  - `MODERATOR`: Can pin posts/resources, post to the Announcements channel, mute/remove disruptive members.
  - `OWNER`: Full control over group settings, invite links, role assignments, and archive status.

### 3.3 Privacy & Blocking Enforcement Rule
Whenever user $A$ blocks user $B$ (or vice versa):
- Neither user can send 1-to-1 messages to the other.
- Direct profile queries return `404 Not Found` or a restricted view.
- Posts/comments from blocked users are filtered out of feeds and threads.
- Profile visibility settings (`PUBLIC`, `CAMPUS_ONLY`, `SHARED_COMMUNITIES_ONLY`) must be evaluated server-side before returning contact details, course/year, or DM availability.

---

## 4. Complete Database Schema Specification (PostgreSQL)

Create SQLAlchemy models and Alembic/Supabase SQL migrations implementing these exact entities, enums, and indexes. Use `UUID` (`gen_random_uuid()`) for all primary keys and `TIMESTAMPTZ` (`now()`) for all timestamps.

### 4.1 Core Enums
```sql
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
```

### 4.2 Tables & Columns

#### 1. `colleges`
- `id` (UUID, PK)
- `name` (VARCHAR(255), NOT NULL) — e.g., "RV College of Engineering", "PES University"
- `slug` (VARCHAR(100), UNIQUE, NOT NULL)
- `short_name` (VARCHAR(50), NOT NULL) — e.g., "RVCE", "PESU"
- `city` (VARCHAR(100), NOT NULL, DEFAULT `'Bengaluru'`)
- `state` (VARCHAR(100), NOT NULL, DEFAULT `'Karnataka'`)
- `email_domains` (TEXT[], DEFAULT `'{}'`) — e.g., `['rvce.edu.in']`
- `is_official_partner` (BOOLEAN, DEFAULT `FALSE`) — **Must be false unless Stage 4 partnership exists**
- `is_active_cluster` (BOOLEAN, DEFAULT `TRUE`) — Controls Phase 1 launch cluster visibility
- `created_at` (TIMESTAMPTZ)

#### 2. `users` & `student_profiles`
- **`users`**:
  - `id` (UUID, PK — matches `auth.users.id` in Supabase)
  - `email` (VARCHAR(255), UNIQUE, NOT NULL)
  - `platform_role` (`platform_role`, DEFAULT `'USER'`)
  - `is_suspended` (BOOLEAN, DEFAULT `FALSE`)
  - `created_at`, `updated_at` (TIMESTAMPTZ)
- **`student_profiles`**:
  - `user_id` (UUID, PK, FK -> `users.id` ON DELETE CASCADE)
  - `handle` (VARCHAR(50), UNIQUE, NOT NULL)
  - `display_name` (VARCHAR(100), NOT NULL)
  - `bio` (TEXT)
  - `avatar_url` (TEXT)
  - `college_id` (UUID, FK -> `colleges.id`, NULLABLE)
  - `verification_stage` (`verification_stage`, DEFAULT `'STAGE_1_PROVISIONAL'`)
  - `course_branch` (VARCHAR(120)) — e.g., "B.E. Computer Science", "B.Des"
  - `graduation_year` (INT)
  - `skills` (TEXT[], DEFAULT `'{}'`)
  - `interests` (TEXT[], DEFAULT `'{}'`)
  - `collaboration_goals` (TEXT[], DEFAULT `'{}'`) — e.g., `['Hackathons', 'Research', 'Side Projects']`
  - `profile_visibility` (`profile_visibility`, DEFAULT `'PUBLIC'`)
  - `show_course_year` (BOOLEAN, DEFAULT `TRUE`)
  - `dm_permission` (`dm_permission`, DEFAULT `'SAME_CAMPUS_OR_COMMUNITY'`)
  - `onboarding_completed` (BOOLEAN, DEFAULT `FALSE`)
  - `created_at`, `updated_at` (TIMESTAMPTZ)

#### 3. `affiliation_claims` & `verification_records`
- **`affiliation_claims`**:
  - `id` (UUID, PK), `user_id` (UUID, FK -> `users.id`), `college_id` (UUID, FK -> `colleges.id`), `claimed_stage` (`verification_stage`), `institutional_email` (VARCHAR), `status` (`PENDING`, `APPROVED`, `REJECTED`), `created_at`
- **`verification_records`**:
  - `id` (UUID, PK), `user_id` (UUID, FK -> `users.id`), `college_id` (UUID, FK -> `colleges.id`), `verified_stage` (`verification_stage`), `method` (`SELF_SELECTED`, `PEER_INVITE`, `EMAIL_OTP`, `ADMIN_MANUAL`), `verified_by_user_id` (UUID, NULLABLE), `created_at`

#### 4. `communities` & `community_memberships`
- **`communities`**:
  - `id` (UUID, PK)
  - `name` (VARCHAR(150), NOT NULL)
  - `slug` (VARCHAR(150), UNIQUE, NOT NULL)
  - `description` (TEXT, NOT NULL)
  - `community_type` (`community_type`, NOT NULL)
  - `visibility` (`community_visibility`, DEFAULT `'PUBLIC'`)
  - `college_id` (UUID, FK -> `colleges.id`, NULLABLE — `NULL` for cross-campus city communities)
  - `is_official_endorsed` (BOOLEAN, DEFAULT `FALSE`) — **Must clearly distinguish student-led vs. official**
  - `invite_code` (VARCHAR(32), UNIQUE, NULLABLE)
  - `created_by` (UUID, FK -> `users.id`)
  - `member_count` (INT, DEFAULT `1`)
  - `created_at`, `updated_at` (TIMESTAMPTZ)
- **`community_memberships`**:
  - `id` (UUID, PK)
  - `community_id` (UUID, FK -> `communities.id` ON DELETE CASCADE)
  - `user_id` (UUID, FK -> `users.id` ON DELETE CASCADE)
  - `role` (`member_role`, DEFAULT `'MEMBER'`)
  - `is_muted` (BOOLEAN, DEFAULT `FALSE`)
  - `joined_at` (TIMESTAMPTZ)
  - UNIQUE(`community_id`, `user_id`)

#### 5. `posts`, `polls`, `comments`, `reactions` & `resources` (Commons & Feeds)
- **`posts`**:
  - `id` (UUID, PK)
  - `author_id` (UUID, FK -> `users.id` ON DELETE CASCADE)
  - `community_id` (UUID, FK -> `communities.id`, NULLABLE)
  - `college_id` (UUID, FK -> `colleges.id`, NULLABLE)
  - `category` (`post_category`, NOT NULL)
  - `title` (VARCHAR(300), NULLABLE — required for `QUESTION_QA`, `ANNOUNCEMENT`, `OPPORTUNITY`)
  - `body` (TEXT, NOT NULL)
  - `tags` (TEXT[], DEFAULT `'{}'`)
  - `is_cross_campus` (BOOLEAN, DEFAULT `FALSE`) — If true and community is public, surfaces in City & Commons feeds
  - `is_pinned` (BOOLEAN, DEFAULT `FALSE`)
  - `accepted_answer_comment_id` (UUID, NULLABLE) — For `QUESTION_QA` in Commons
  - `opportunity_meta` (JSONB, NULLABLE) — `{ "type": "HACKATHON|INTERNSHIP|WORKSHOP", "deadline": "ISO8601", "verification_label": "VERIFIED|COMMUNITY_SUBMITTED|UNVERIFIED", "external_url": "..." }`
  - `upvotes_count` (INT, DEFAULT `0`), `comments_count` (INT, DEFAULT `0`)
  - `is_hidden_by_mod` (BOOLEAN, DEFAULT `FALSE`)
  - `created_at`, `updated_at` (TIMESTAMPTZ)
- **`polls`**:
  - `id` (UUID, PK), `post_id` (UUID, UNIQUE, FK -> `posts.id` ON DELETE CASCADE), `question` (VARCHAR(300)), `options` (JSONB — `[{ "id": "opt1", "text": "...", "votes": 0 }]`), `expires_at` (TIMESTAMPTZ, NULLABLE)
- **`poll_votes`**:
  - `id` (UUID, PK), `poll_id` (UUID, FK -> `polls.id` ON DELETE CASCADE), `user_id` (UUID, FK -> `users.id`), `option_id` (VARCHAR), UNIQUE(`poll_id`, `user_id`)
- **`comments`**:
  - `id` (UUID, PK)
  - `post_id` (UUID, FK -> `posts.id` ON DELETE CASCADE)
  - `author_id` (UUID, FK -> `users.id` ON DELETE CASCADE)
  - `parent_comment_id` (UUID, FK -> `comments.id`, NULLABLE — supports nested replies)
  - `body` (TEXT, NOT NULL)
  - `is_useful_answer` (BOOLEAN, DEFAULT `FALSE`)
  - `upvotes_count` (INT, DEFAULT `0`)
  - `is_hidden_by_mod` (BOOLEAN, DEFAULT `FALSE`)
  - `created_at` (TIMESTAMPTZ)
- **`reactions`**:
  - `id` (UUID, PK), `user_id` (UUID, FK -> `users.id`), `target_type` (`POST` | `COMMENT` | `MESSAGE`), `target_id` (UUID), `reaction_type` (VARCHAR(32), DEFAULT `'UPVOTE'`), UNIQUE(`user_id`, `target_type`, `target_id`)
- **`resources`** (Searchable Knowledge Layer):
  - `id` (UUID, PK)
  - `uploader_id` (UUID, FK -> `users.id`)
  - `community_id` (UUID, FK -> `communities.id`, NULLABLE)
  - `college_id` (UUID, FK -> `colleges.id`, NULLABLE)
  - `title` (VARCHAR(255), NOT NULL)
  - `description` (TEXT)
  - `file_url` (TEXT, NULLABLE)
  - `external_link` (TEXT, NULLABLE)
  - `subject_tags` (TEXT[], DEFAULT `'{}'`)
  - `is_pinned` (BOOLEAN, DEFAULT `FALSE`)
  - `is_public_commons` (BOOLEAN, DEFAULT `TRUE`)
  - `created_at` (TIMESTAMPTZ)

#### 6. `conversations`, `conversation_members` & `messages` (Communication Layer)
- **`conversations`**:
  - `id` (UUID, PK)
  - `conversation_type` (`conversation_type`, NOT NULL)
  - `community_id` (UUID, FK -> `communities.id` ON DELETE CASCADE, NULLABLE — links group chat + announcement channel to a community)
  - `title` (VARCHAR(150), NULLABLE)
  - `description` (TEXT, NULLABLE)
  - `created_at`, `last_message_at` (TIMESTAMPTZ)
- **`conversation_members`**:
  - `id` (UUID, PK)
  - `conversation_id` (UUID, FK -> `conversations.id` ON DELETE CASCADE)
  - `user_id` (UUID, FK -> `users.id` ON DELETE CASCADE)
  - `role` (`member_role`, DEFAULT `'MEMBER'`)
  - `is_muted` (BOOLEAN, DEFAULT `FALSE`)
  - `quiet_hours_until` (TIMESTAMPTZ, NULLABLE)
  - `last_read_at` (TIMESTAMPTZ, DEFAULT `now()`)
  - UNIQUE(`conversation_id`, `user_id`)
- **`messages`**:
  - `id` (UUID, PK)
  - `conversation_id` (UUID, FK -> `conversations.id` ON DELETE CASCADE)
  - `sender_id` (UUID, FK -> `users.id` ON DELETE CASCADE)
  - `reply_to_message_id` (UUID, FK -> `messages.id`, NULLABLE — threaded replies)
  - `body` (TEXT, NOT NULL)
  - `attachments` (JSONB, DEFAULT `'[]'`) — `[{ "name": "...", "url": "...", "mime_type": "...", "size_bytes": 1234 }]`
  - `is_announcement` (BOOLEAN, DEFAULT `FALSE`)
  - `is_pinned` (BOOLEAN, DEFAULT `FALSE`)
  - `is_deleted` (BOOLEAN, DEFAULT `FALSE`)
  - `created_at` (TIMESTAMPTZ)

#### 7. `events` & `event_rsvps`
- **`events`**:
  - `id` (UUID, PK)
  - `organizer_id` (UUID, FK -> `users.id`)
  - `community_id` (UUID, FK -> `communities.id`, NULLABLE)
  - `college_id` (UUID, FK -> `colleges.id`, NULLABLE)
  - `title` (VARCHAR(200), NOT NULL)
  - `description` (TEXT, NOT NULL)
  - `starts_at` (TIMESTAMPTZ, NOT NULL)
  - `ends_at` (TIMESTAMPTZ, NOT NULL)
  - `is_online` (BOOLEAN, DEFAULT `FALSE`)
  - `venue_or_link` (TEXT, NOT NULL)
  - `is_cross_campus` (BOOLEAN, DEFAULT `TRUE`)
  - `safety_notes` (TEXT, NULLABLE)
  - `rsvp_count` (INT, DEFAULT `0`)
  - `created_at` (TIMESTAMPTZ)
- **`event_rsvps`**:
  - `id` (UUID, PK), `event_id` (UUID, FK -> `events.id` ON DELETE CASCADE), `user_id` (UUID, FK -> `users.id` ON DELETE CASCADE), `status` (`GOING`, `INTERESTED`), `created_at` (TIMESTAMPTZ), UNIQUE(`event_id`, `user_id`)

#### 8. `projects`, `project_members` & `tasks`
- **`projects`**:
  - `id` (UUID, PK)
  - `creator_id` (UUID, FK -> `users.id`)
  - `college_id` (UUID, FK -> `colleges.id`, NULLABLE)
  - `title` (VARCHAR(200), NOT NULL)
  - `pitch` (VARCHAR(300), NOT NULL)
  - `description` (TEXT, NOT NULL)
  - `stage` (`project_stage`, DEFAULT `'IDEA'`)
  - `skills_needed` (TEXT[], DEFAULT `'{}'`)
  - `open_roles` (TEXT[], DEFAULT `'{}'`)
  - `is_cross_campus_open` (BOOLEAN, DEFAULT `TRUE`)
  - `repo_or_demo_links` (JSONB, DEFAULT `'[]'`)
  - `created_at`, `updated_at` (TIMESTAMPTZ)
- **`project_members`**:
  - `id` (UUID, PK)
  - `project_id` (UUID, FK -> `projects.id` ON DELETE CASCADE)
  - `user_id` (UUID, FK -> `users.id` ON DELETE CASCADE)
  - `role_title` (VARCHAR(100))
  - `status` (`PENDING_REQUEST`, `ACCEPTED`, `DECLINED`)
  - `pitch_note` (TEXT, NULLABLE — message sent when requesting to join)
  - `joined_at` (TIMESTAMPTZ)
  - UNIQUE(`project_id`, `user_id`)
- **`tasks`**:
  - `id` (UUID, PK)
  - `project_id` (UUID, FK -> `projects.id` ON DELETE CASCADE)
  - `title` (VARCHAR(255), NOT NULL)
  - `status` (`TODO`, `IN_PROGRESS`, `DONE`, DEFAULT `'TODO'`)
  - `assignee_id` (UUID, FK -> `users.id`, NULLABLE)
  - `created_at` (TIMESTAMPTZ)

#### 9. `user_blocks`, `user_mutes`, `reports`, `moderation_actions`, `notifications`, `analytics_events`
- **`user_blocks`**:
  - `id` (UUID, PK), `blocker_id` (UUID, FK -> `users.id`), `blocked_id` (UUID, FK -> `users.id`), `created_at` (TIMESTAMPTZ), UNIQUE(`blocker_id`, `blocked_id`)
- **`user_mutes`**:
  - `id` (UUID, PK), `user_id` (UUID, FK -> `users.id`), `muted_target_type` (`USER` | `COMMUNITY` | `TAG`), `muted_target_value` (VARCHAR), `created_at` (TIMESTAMPTZ)
- **`reports`**:
  - `id` (UUID, PK)
  - `reporter_id` (UUID, FK -> `users.id`)
  - `target_type` (`report_target_type`, NOT NULL)
  - `target_id` (UUID, NOT NULL)
  - `reason` (`HARASSMENT`, `IMPERSONATION`, `SPAM`, `UNSAFE_MEETUP`, `MISINFORMATION`, `OTHER`)
  - `details` (TEXT)
  - `status` (`report_status`, DEFAULT `'PENDING'`)
  - `resolved_by` (UUID, FK -> `users.id`, NULLABLE)
  - `created_at`, `resolved_at` (TIMESTAMPTZ)
- **`moderation_actions`** (Immutable Audit Log):
  - `id` (UUID, PK)
  - `actor_id` (UUID, FK -> `users.id`)
  - `report_id` (UUID, FK -> `reports.id`, NULLABLE)
  - `action_type` (`HIDE_CONTENT`, `RESTORE_CONTENT`, `REMOVE_FROM_GROUP`, `SUSPEND_USER`, `VERIFY_AFFILIATION`, `DISMISS_REPORT`)
  - `target_type` (VARCHAR(50)), `target_id` (UUID)
  - `notes` (TEXT, NOT NULL)
  - `created_at` (TIMESTAMPTZ)
- **`notifications`**:
  - `id` (UUID, PK), `user_id` (UUID, FK -> `users.id` ON DELETE CASCADE), `type` (VARCHAR(50)), `title` (VARCHAR(200)), `body` (TEXT), `action_url` (TEXT), `is_read` (BOOLEAN, DEFAULT `FALSE`), `created_at` (TIMESTAMPTZ)
- **`analytics_events`**:
  - `id` (UUID, PK), `user_id` (UUID, NULLABLE), `event_name` (VARCHAR(100)), `college_id` (UUID, NULLABLE), `is_cross_campus_interaction` (BOOLEAN, DEFAULT `FALSE`), `metadata` (JSONB), `created_at` (TIMESTAMPTZ)

### 4.3 Required Indexes & Full-Text Search
Add PostgreSQL GIN indexes for fast search across Commons, Messages, and Discovery:
```sql
CREATE INDEX idx_posts_community_created ON posts (community_id, created_at DESC);
CREATE INDEX idx_posts_college_created ON posts (college_id, created_at DESC);
CREATE INDEX idx_posts_tags_gin ON posts USING GIN (tags);
CREATE INDEX idx_posts_fts ON posts USING GIN (to_tsvector('english', coalesce(title, '') || ' ' || body));
CREATE INDEX idx_resources_fts ON resources USING GIN (to_tsvector('english', title || ' ' || coalesce(description, '')));
CREATE INDEX idx_messages_conv_created ON messages (conversation_id, created_at DESC);
CREATE INDEX idx_messages_fts ON messages USING GIN (to_tsvector('english', body));
CREATE INDEX idx_profiles_skills_gin ON student_profiles USING GIN (skills);
CREATE INDEX idx_profiles_interests_gin ON student_profiles USING GIN (interests);
```

---

## 5. Backend API Specification (FastAPI)

All API endpoints must be prefixed with `/api/v1` and return standard paginated responses `{ "items": [...], "next_cursor": "...", "total": 123 }` for list queries.

### 5.1 Identity, Onboarding & Trust (`/api/v1/auth` & `/api/v1/profiles`)
- `POST /api/v1/profiles/onboarding`: Create/update `student_profiles`, select initial `college_id` (sets `STAGE_1_PROVISIONAL`), set skills, interests, and auto-join the selected college's default `CAMPUS_HUB` community.
- `GET /api/v1/profiles/me` & `PATCH /api/v1/profiles/me`: Update profile fields, privacy visibility (`PUBLIC`, `CAMPUS_ONLY`, `SHARED_COMMUNITIES_ONLY`), and DM permissions.
- `GET /api/v1/profiles/{handle}`: Fetch student profile respecting block lists and `profile_visibility` rules.
- `POST /api/v1/profiles/verify/request`: Submit institutional email or peer-invite code to advance from `STAGE_1_PROVISIONAL` to Stage 2 or Stage 3.
- `POST /api/v1/profiles/{user_id}/block` & `DELETE /api/v1/profiles/{user_id}/block`: Block or unblock a user.
- `POST /api/v1/profiles/mutes`: Mute a user, community, or topic tag.

### 5.2 Campus & Colleges (`/api/v1/colleges`)
- `GET /api/v1/colleges`: List active Bengaluru colleges with member counts, community counts, and explicit `is_official_partner` boolean.
- `GET /api/v1/colleges/{slug}`: Fetch Campus Hub overview (pinned announcements, student-led communities vs. official spaces, upcoming campus events, active discussions).

### 5.3 Communities & Group Communication (`/api/v1/communities` & `/api/v1/conversations`)
- `POST /api/v1/communities`: Create a new student group (`DEPARTMENT`, `CLASS_COHORT`, `CLUB`, `CROSS_CAMPUS_INTEREST`). Automatically provisions two linked conversations:
  1. An `ANNOUNCEMENT_CHANNEL` (where only `OWNER` and `MODERATOR` can post).
  2. A `GROUP_CHAT` (for general discussion with threaded replies).
- `GET /api/v1/communities`: Browse/search communities by college, type, or cross-campus visibility.
- `POST /api/v1/communities/{id}/join` & `POST /api/v1/communities/join-by-code/{invite_code}`: Join public, campus-restricted (checks user's `college_id`), or invite-link groups.
- `GET /api/v1/conversations`: List user's active DMs and community group chats with unread counts.
- `POST /api/v1/conversations/direct`: Start or retrieve a 1-to-1 DM with another student (validates `dm_permission` and `user_blocks` first).
- `GET /api/v1/conversations/{id}/messages`: Cursor-paginated message history + search filter (`?q=...`) within authorized conversations.
- `POST /api/v1/conversations/{id}/messages`: Send message or threaded reply (`reply_to_message_id`). Enforces announcement permission if `conversation_type == 'ANNOUNCEMENT_CHANNEL'`.

### 5.4 Commons, Feeds & Search (`/api/v1/posts`, `/api/v1/resources`, `/api/v1/search`)
- `GET /api/v1/posts`: Unified feed endpoint supporting query filters:
  - `scope=campus` (user's college posts & announcements)
  - `scope=city` (cross-campus discussions, Hangout posts, polls)
  - `scope=commons` (`QUESTION_QA` threads and study discussions)
  - `scope=opportunities` (`OPPORTUNITY` listings with verification labels)
  - Automatically excludes muted tags/users/communities and blocked users.
- `POST /api/v1/posts`: Create a post (with optional poll options or opportunity metadata).
- `POST /api/v1/posts/{id}/comments`: Add comment or nested reply.
- `POST /api/v1/posts/{id}/accept-answer/{comment_id}`: Allow question author or community moderator to mark a comment as the useful/accepted answer in Commons.
- `GET /api/v1/resources` & `POST /api/v1/resources`: Upload or link study notes, past papers, or class resources with subject tags and community pinning.
- `GET /api/v1/search`: Unified search across `students`, `communities`, `commons_posts`, `resources`, and authorized `messages` (strictly enforcing privacy boundaries so private group content never leaks to non-members).

### 5.5 Projects & Events (`/api/v1/projects`, `/api/v1/events`)
- `GET /api/v1/projects` & `POST /api/v1/projects`: Browse and create cross-campus project calls with `skills_needed`, `open_roles`, and `stage`.
- `POST /api/v1/projects/{id}/join-request`: Express interest and request to join a project team.
- `PATCH /api/v1/projects/{id}/members/{member_id}`: Project creator accepts/declines collaborators (auto-adds accepted members to a project workspace & group chat, and logs a `cross_campus_connection` analytics event if colleges differ).
- `GET /api/v1/projects/{id}/tasks` & `POST /api/v1/projects/{id}/tasks`: Simple kanban/checklist tasks and project links inside the project workspace.
- `GET /api/v1/events`, `POST /api/v1/events`, `POST /api/v1/events/{id}/rsvp`: Campus and city-wide events with organizer accountability and RSVP tracking.

### 5.6 Trust, Safety & Moderation (`/api/v1/moderation`)
- `POST /api/v1/moderation/reports`: Report any entity (`USER`, `POST`, `COMMENT`, `MESSAGE`, `COMMUNITY`, `EVENT`, `PROJECT`, `RESOURCE`).
- `GET /api/v1/moderation/queue`: Moderator-only queue of pending reports sorted by severity and report count.
- `POST /api/v1/moderation/actions`: Execute moderation action (`HIDE_CONTENT`, `SUSPEND_USER`, `REMOVE_FROM_GROUP`, `DISMISS_REPORT`) and append an immutable record to `moderation_actions`.

---

## 6. Frontend UX & Navigation Architecture

The product must feel like **one coherent environment**, not six disconnected apps. Build a responsive layout (Sidebar on Desktop, Bottom Navigation Bar on Mobile/Capacitor) with **5 primary destinations** plus a persistent Global Search & Notifications header:

1. **Campus (`/campus`) — The Home Base:**
   - Displays the student's selected Bengaluru college header with an honest affiliation badge (`Student-Led Campus Space` vs. `Official Partner`).
   - Tabs: **Overview & Feed**, **Departments & Class Groups**, **Pinned Announcements & Resources**, **Campus Events**.
2. **City (`/city`) — The Cross-College Network & Hangout:**
   - Discover beyond the student's institution across Bengaluru.
   - Tabs: **City Pulse (Cross-Campus Feed & Hangout Polls/Memes)**, **People Directory (Filter by skills, interests, goals)**, **Cross-Campus Clubs & Rooms**.
3. **Commons (`/commons`) — Searchable Knowledge:**
   - Designed so valuable answers never die in chat history.
   - Tabs: **Q&A Discussions** (with "Solved / Useful Answer" badges), **Study Resources & Notes Vault**, **Topic Tags** (`#DSA`, `#UIUX`, `#Internships`, `#BengaluruHackathons`).
4. **Messages (`/messages`) — Organized Student Groups & DMs:**
   - Solves WhatsApp chaos.
   - Every Community Group view has 3 clean sub-tabs at the top:
     - **Announcements** (clean, noise-free channel for class/club reps)
     - **Discussion Chat** (with threaded replies and search)
     - **Pinned Vault** (files, links, and resources shared in the group)
   - Separate tab for **Direct Messages (1-to-1)**.
5. **Build & Next Steps (`/build`) — Projects, Events & Opportunities:**
   - Tabs: **Projects (Find Teammates / Active Workspaces)**, **Opportunities (Internships, Hackathons, Scholarships with `Verified` / `Community-Submitted` labels)**, **City & Campus Events**.

---

## 7. Seed Data Specification (Bengaluru Launch Cluster)

Create a deterministic seed script (`supabase/seed.sql` and a FastAPI CLI command `python -m app.seed`) that populates:
1. **Phase 1 Bengaluru College Cluster (`is_active_cluster = true`, `is_official_partner = false`):**
   - RV College of Engineering (`RVCE`)
   - PES University (`PESU`)
   - BMS College of Engineering (`BMSCE`)
   - Christ University (`CHRIST`)
   - MS Ramaiah Institute of Technology (`MSRIT`)
   - International Institute of Information Technology Bangalore (`IIITB`)
2. **Demo Accounts across Trust Stages:**
   - `aarav@rvce.edu.in` (RVCE, `STAGE_3_INSTITUTIONAL_VERIFIED`, Builder persona)
   - `diya@pes.edu` (PESU, `STAGE_2_COMMUNITY_VALIDATED`, Community Organizer persona)
   - `rohan@gmail.com` (BMSCE selected, `STAGE_1_PROVISIONAL`, Curious Learner persona)
   - `mod@commonground.in` (`MODERATOR` role)
3. **Starter Communities, Commons Q&A, & Cross-Campus Projects:**
   - Campus groups for RVCE & PESU CSE cohorts (with sample Announcements + Pinned Study Notes).
   - Cross-campus communities: *Bengaluru Student Builders*, *BLR Design & UI Collective*, *Bengaluru Hackathon Finder*.
   - 5 answered Commons Q&A threads, 3 active cross-campus Projects recruiting teammates, and 4 labeled Opportunities.

---

## 8. Phased Execution Plan for the Coding Agent

Execute the build in the following **6 sequential stages**. After completing each stage, run the verification checks before starting the next stage.

### Stage 1: Foundation, Auth, Staged Trust & Core Navigation
- **Tasks:**
  1. Scaffold the monorepo (`/backend` FastAPI + `/frontend` Next.js TypeScript + `/supabase` migrations) and `docker-compose.yml`.
  2. Write and apply the complete PostgreSQL schema migration and seed script.
  3. Implement Supabase JWT authentication middleware in FastAPI (`get_current_user`).
  4. Build Onboarding flow: Account creation -> College selection (with explicit Provisional status banner) -> Skills/Interests selection -> Auto-join college hub.
  5. Build Profile page with Staged Trust badges (`STAGE_1` to `STAGE_4`), privacy toggles (`PUBLIC`, `CAMPUS_ONLY`, `SHARED_COMMUNITIES_ONLY`), Block user button, and Universal Report modal.
  6. Implement the responsive App Shell (5 primary navigation destinations + header search/notifications).
- **Acceptance Criteria:**
  - A new user can sign up, complete onboarding, select a Bengaluru college, see their `Provisional Student` badge, block/report another user, and navigate all 5 top-level routes without errors.

### Stage 2: Communication Layer (Groups, Announcements, Threads & Resources)
- **Tasks:**
  1. Build Community creation, invite-code generation (`/join-by-code/{code}`), and role management (`OWNER`, `MODERATOR`, `MEMBER`).
  2. Build the split Group Communication view: **Announcements Channel** (admin/mod post only), **Group Chat** (with threaded replies and message search), and **Pinned Resource Vault**.
  3. Implement 1-to-1 Direct Messaging enforcing `dm_permission` and `user_blocks`.
  4. Wire Supabase Realtime (or WebSockets) for live message delivery and in-app notification badges, plus mute/quiet-hour controls.
- **Acceptance Criteria:**
  - A class representative can create a cohort group, share an invite link, post an official announcement that stays separated from student chat, pin a study PDF/link to the group vault, and search past messages.

### Stage 3: Campus, City Discovery & Commons (Searchable Knowledge)
- **Tasks:**
  1. Build the **Campus** module (`/campus`) showing college communities, department spaces, and campus announcements with clear `Student-Created` vs. `Officially Endorsed` labels.
  2. Build the **Commons** module (`/commons`) with topic-tagged Q&A threads, nested comments, upvotes, "Mark as Accepted/Useful Answer", and the searchable Study Resources directory.
  3. Build the **City** module (`/city`) featuring the Cross-Campus student directory (filter by skills, interests, collaboration goals without exposing private data) and cross-campus community discovery.
  4. Build the unified Global Search bar (`/api/v1/search`) querying students, communities, Commons Q&A, resources, and authorized messages.
- **Acceptance Criteria:**
  - Students from RVCE and PESU can discover each other by skill (`React`, `Python`, `UI Design`), search Commons for a past question or study resource, and mark an answer as accepted.

### Stage 4: Collaboration (Projects, Events & Opportunities)
- **Tasks:**
  1. Build the **Projects** workspace (`/build?tab=projects`): create project pitch, list needed skills/open roles, submit "Request to Join" with a pitch note, approve collaborators, and manage simple project tasks (`TODO`, `IN_PROGRESS`, `DONE`) + links.
  2. Build the **Events** directory and RSVP flow (`/build?tab=events`) with date, online/in-person location details, organizer badge, and safety guidelines.
  3. Build the **Opportunities** board (`/build?tab=opportunities`) with deadline reminders, saved items, and mandatory trust labels (`VERIFIED`, `COMMUNITY_SUBMITTED`, `UNVERIFIED`).
- **Acceptance Criteria:**
  - A student from one college can post a project idea, review and accept a join request from a student at another college, and collaborate inside the shared project task board.

### Stage 5: Hangout, Moderation Queue & Safety Governance
- **Tasks:**
  1. Add **Hangout** features inside the City/Campus feeds: interactive Polls, casual prompts, meme/moment posts, and one-click topic/group muting controls so users can shape their feed.
  2. Build the **Moderator Dashboard** (`/moderation`) for `MODERATOR` and `ADMIN` roles: view pending reports queue, inspect reported content in context, execute actions (hide post/comment/message, suspend user, dismiss report), and view the immutable `moderation_actions` audit log.
  3. Add rate-limiting middleware on sign-ups, post creation, messaging, and group invites.
  4. Wire up the `analytics_events` logger tracking the North Star metric (**Weekly Meaningful Student Connections**: cross-campus DMs, useful answers in Commons, group participation, and project team formations).
- **Acceptance Criteria:**
  - Any post, message, event, or profile can be reported in 2 clicks; moderators can resolve reports from `/moderation` with full audit logging; muted topics/users immediately disappear from the user's feed.

### Stage 6: Mobile Packaging (Capacitor) & End-to-End Verification
- **Tasks:**
  1. Configure Capacitor (`capacitor.config.ts`) to wrap the Next.js build cleanly with mobile viewport handling, touch-friendly tap targets, and offline/slow-network loading states.
  2. Write automated backend Pytest tests verifying:
     - Private group messages and posts never appear in public search or unauthenticated queries.
     - Blocked users cannot DM or view each other's profiles.
     - `STAGE_1_PROVISIONAL` accounts and student-created college pages never display official endorsement badges.
     - Non-moderators cannot post to `ANNOUNCEMENT_CHANNEL` conversations or access `/api/v1/moderation/queue`.
- **Acceptance Criteria:**
  - All backend tests pass (`pytest`), frontend compiles with zero TypeScript or ESLint errors (`npm run build`), and the seeded local application runs end-to-end.