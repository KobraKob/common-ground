# CommonGround — Implementation Summary & Verification Guide

> **Project Overview**: CommonGround is a Bengaluru-first cross-campus student network, communication layer, and collaboration platform connecting students across RVCE, PESU, BMSCE, Christ, MSRIT, and IIITB.
> Built following the master blueprint in `build.md` and styled in accordance with the **Neo-Y2K Editorial** design specification (`AGENTS.md`).

---

## 1. What Has Been Implemented (Complete Audit)

### 🎨 Neo-Y2K Editorial Design System
- [x] **Theme Token Extension (`frontend/src/theme/neoY2kTheme.ts`)**:
  - Implements Astryx's `defineTheme` extending `@astryxdesign/theme-y2k`.
  - Airy ice-lavender light mode (`#F5F6FD`) / Deep navy-obsidian dark mode (`#0E0F1A`).
  - Charcoal light mode (`#1A1C29`) / Signature neon green dark mode (`#C5E17A`).
  - Periwinkle hairline borders (`#CCCFFA` light / `#282C47` dark).
  - 16px border-radius component override for the chat composer.
- [x] **Typography Trio (`frontend/src/app/globals.css`)**:
  - Display / Hero Headings: **Crimson Text** (with italic emphasis for focal words).
  - Body Copy: **Poppins** for modern readability.
  - Metrics, Counters & Status Badges: **JetBrains Mono** uppercase.
- [x] **Tactile Hardware Polish**:
  - Crisp 1px hairline card borders with inner top highlight (`inset 0 1px 0 rgba(255, 255, 255, 0.25)`).
  - Tactile pill buttons (`.neo-pill-btn`) shifting down on press (`transform: translateY(1px)`).
  - Dark mode glow effects on primary CTAs (`box-shadow: 0 0 12px rgba(197, 225, 122, 0.4)`).

---

### 🛡️ The 4-Stage Staged Trust Architecture
Implemented across backend authorization and frontend badging (`TrustBadge.tsx`):
1. **`STAGE_1_PROVISIONAL`**:
   - Open student onboarding with selected Bengaluru college.
   - Profile badge: **"Provisional Student — Self-Reported"** (Amber warning shield).
   - Prominent honest affiliation disclaimer banners; never implies official endorsement.
2. **`STAGE_2_COMMUNITY_VALIDATED`**:
   - Verified via trusted student representatives or peer cohort invite codes.
   - Badge: **"Peer-Validated Student"** (Sky blue checkmark).
3. **`STAGE_3_INSTITUTIONAL_VERIFIED`**:
   - Authenticated via `.edu.in` / `.ac.in` student email OTP or physical student ID check.
   - Badge: **"Verified Student"** (Neon green badge).
4. **`STAGE_4_OFFICIAL_PARTNER`**:
   - Reserved strictly for officially authorized college administration accounts.
   - Badge: **"Official Institution Badge"** (Indigo institutional shield).

---

### 🔒 Privacy, Block Boundaries & Security
- [x] **Mutual Block Enforcement (`backend/app/core/permissions.py`)**:
  - When User A blocks User B (or vice versa):
    - Profile queries return `404 Not Found`.
    - Direct 1-to-1 DMs return `403 Forbidden`.
    - Feed posts and comments are automatically excluded from lists.
- [x] **Server-Side Profile Visibility Rules**:
  - `PUBLIC`, `CAMPUS_ONLY`, and `SHARED_COMMUNITIES_ONLY` evaluated server-side before returning contact data, branch, or graduation year.
- [x] **Direct Message (DM) Permissions**:
  - `EVERYONE`, `SAME_CAMPUS_OR_COMMUNITY`, or `NONE`.
- [x] **Announcement Channel Protection**:
  - Only users with `OWNER` or `MODERATOR` community roles can publish to `ANNOUNCEMENT_CHANNEL` conversations. Standard members receive `403 Forbidden`.
- [x] **Search Boundary Isolation**:
  - The unified search endpoint queries authorized messages **only** from conversations where the requesting student is a member. Private group discussions never leak into public search or city feeds.

---

### 🗄️ Database, Migrations & Deterministic Seed Data
- [x] **SQL Schema (`supabase/migrations/001_init_schema.sql`)**:
  - 12 PostgreSQL enums and 27 relational tables with foreign keys and cascade rules.
  - GIN indexes for full-text search across `posts`, `resources`, `messages`, `skills`, and `interests`.
- [x] **Bengaluru Launch Cluster Seed (`supabase/seed.sql` & `backend/app/seed.py`)**:
  - 6 Colleges: RVCE, PESU, BMSCE, Christ, MSRIT, IIITB.
  - 4 Demo Personas covering all trust stages:
    - **Aarav Patel** (`aarav_builder` @ RVCE, Stage 3 Verified, Builder persona)
    - **Diya Sharma** (`diya_blr` @ PESU, Stage 2 Community Validated, Designer persona)
    - **Rohan Kumar** (`rohan_k` @ BMSCE, Stage 1 Provisional, Learner persona)
    - **CommonGround Mod** (`mod_blr`, Moderator persona)
  - Starter communities: *RVCE Campus Hub*, *PESU Cohort*, *Bengaluru Student Builders*, *BLR Design & UI Collective*, *Bengaluru Hackathon Finder*.
  - Seed Q&A threads with accepted answers, active projects (*BMTC Transit Pulse*), and verified opportunities.

---

### 🖥️ Frontend UX & 5 Primary Destinations
1. **Campus (`/campus`) — Home Base**:
   - Honest affiliation banner: "Student-Led Campus Space • Self-Reported Community".
   - 4 Sub-Tabs: **Overview & Feed** (with live post composer), **Departments & Class Groups**, **Pinned Announcements**, and **Campus Events**.
   - Campus switcher dropdown to inspect RVCE, PESU, BMSCE, Christ, MSRIT, IIITB.
2. **City (`/city`) — Cross-College Network & Hangout**:
   - 3 Tabs: **City Pulse** (live posts & commuter polls with percentage bars), **People Directory** (filter students by `Python`, `Rust`, `Next.js`, `Figma`), and **Cross-Campus Clubs**.
3. **Commons (`/commons`) — Searchable Knowledge Layer**:
   - Q&A discussions with "Solved / Useful Answer" badges.
   - Study Resources & Notes Vault with direct PDF triggers.
   - Topic tag directory (`#DSA`, `#VTU`, `#AI`, `#UIUX`, etc.).
   - Interactive "Ask a Question" modal.
4. **Messages (`/messages`) — WhatsApp Chaos Solution**:
   - Left channel list for group chats and 1-to-1 DMs.
   - 3 clean sub-tabs for Community Groups: **Announcements** (lock-guarded), **Discussion Chat**, and **Pinned Vault**.
   - Interactive message composer (16px border-radius).
5. **Build (`/build`) — Collaboration, Events & Opportunities**:
   - 3 Tabs: **Active Projects** (teammate recruiting, skills needed, request to join), **Curated Opportunities** (with `VERIFIED` and `COMMUNITY_SUBMITTED` trust badges), and **City & Campus Events** (with RSVP tracking).
   - "Launch a Project" modal.
6. **Identity & Profile (`/profile`)**:
   - 4-Stage Trust Visualizer card.
   - Privacy visibility toggles and DM permission selector.
   - Institutional `.edu.in` email verification trigger.
7. **Moderator Queue (`/moderation`)**:
   - Triage queue for pending reports.
   - Action controls: `Hide Content`, `Suspend User`, `Dismiss Report`.
   - Immutable audit trail table (`moderation_actions`).
8. **Onboarding Wizard (`/(auth)/onboarding`)**:
   - College selection with prominent Stage 1 Provisional disclosure alert.
   - Skills, branch, graduation year input.
9. **Universal Report Modal (`ReportModal.tsx`)**:
   - Available across posts, messages, comments, events, and user profiles.

---

### 📱 Mobile Packaging Readiness
- [x] **`frontend/capacitor.config.ts`**: Configured with appId `in.commonground.app`, splash screen delays, and dark mode background (`#0E0F1A`).
- [x] Responsive layout with desktop sidebar and mobile bottom navigation with safe-area insets.

---

## 2. How to Run & Verify CommonGround

### Prerequisites
- **Python**: 3.11+ (Python 3.14 tested and compatible)
- **Node.js**: 18+ (Node 24 tested and compatible)
- **npm**: 10+

---

### Step 1: Run Backend Tests & Start FastAPI

Open a terminal in the project root:

```powershell
# 1. Navigate to backend directory
cd backend

# 2. Run the automated Pytest test suite
python -m pytest app/tests -v
```
You should see all 5 core tests pass:
- `test_health_check`
- `test_onboarding_sets_stage1_provisional`
- `test_block_enforcement_prevents_dms_and_hides_profile`
- `test_announcement_channel_permission_guard`
- `test_moderation_queue_restricted_to_moderators`

```powershell
# 3. Seed the database with Bengaluru colleges & demo personas
python -m app.seed

# 4. Start the FastAPI development server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
The backend API is now running at `http://localhost:8000`.
Interactive Swagger API documentation is available at `http://localhost:8000/docs`.

---

### Step 2: Start Next.js Frontend

Open a **second terminal** in the project root:

```powershell
# 1. Navigate to frontend directory
cd frontend

# 2. Run development server
npm run dev
```
Open **`http://localhost:3000`** in your browser.

---

### Step 3: Interactive Verification Tour (What to Check)

1. **Active Persona Switcher (Top Right Header)**:
   - Click the persona dropdown in the header to switch between:
     - **Aarav (RVCE)**: Has `STAGE_3_INSTITUTIONAL_VERIFIED` badge.
     - **Diya (PESU)**: Has `STAGE_2_COMMUNITY_VALIDATED` badge.
     - **Rohan (BMSCE)**: Has `STAGE_1_PROVISIONAL` badge.
   - Notice how all badges and campus affiliations adapt immediately.

2. **Campus Hub (`/campus`)**:
   - Inspect the amber banner: *"Student-Led Campus Space • Self-Reported Community"*.
   - Use the **Switch Campus** dropdown to toggle between RVCE, PESU, BMSCE, Christ, MSRIT, and IIITB.
   - Switch between **Overview & Feed**, **Departments & Cohorts**, **Pinned Announcements**, and **Campus Events**.
   - Type a post or question in the post composer and click **Publish Post**.

3. **City Pulse & People Directory (`/city`)**:
   - Click on the poll (e.g. *Namma Metro vs BMTC Vajra*): cast a vote and see the live animated percentage bar update.
   - Switch to **People Directory**: click skill filter pills (`Python`, `Figma`, `Rust`, `Next.js`) to filter students across Bengaluru.
   - Click **Direct Message** on any student card.

4. **The Commons (`/commons`)**:
   - Notice the green **"Solved Answer"** badge on the VTU Data Structures question.
   - Switch to **Study Resources Vault** and click **Download PDF** on the handwritten notes.
   - Click **Ask a Question** button to open the modal and post a new question.

5. **Organized Messages (`/messages`)**:
   - Click on **Builder Announcements**: notice the sub-tab bar separating **Announcements**, **Discussion Chat**, and **Pinned Vault**.
   - Notice the lock notice when a non-moderator/provisional student attempts to post to the announcement channel.
   - Switch to **Discussion Chat** and send a message.

6. **Build & Opportunities (`/build`)**:
   - Browse active cross-campus projects like *BMTC Transit Pulse*.
   - Click **Curated Opportunities** to verify the `VERIFIED` and `COMMUNITY_SUBMITTED` trust tags.
   - Click **City & Campus Events** and click **RSVP Going**.

7. **Identity, Trust & Privacy (`/profile`)**:
   - View the 4-Stage Trust Architecture visualizer cards.
   - Test changing **Profile Visibility** and **Direct Message Permission** dropdowns.
   - Click **Verify College Email** to test the `.edu.in` verification dialog.

8. **Moderator Queue (`/moderation`)**:
   - Inspect pending safety reports in the triage queue.
   - Click **Hide Content** or **Dismiss** and observe the action immediately logged into the immutable `moderation_actions` audit table at the bottom.

9. **Theme Toggle (Top Right Header)**:
   - Click the Sun/Moon icon to switch between Light Mode (ice-lavender canvas `#F5F6FD` with periwinkle borders `#CCCFFA`) and Dark Mode (navy-obsidian canvas `#0E0F1A` with neon green accents `#C5E17A`).

10. **Global Search (Header Search Bar)**:
    - Type `dsa` or `bmtc` or `aarav` in the header search bar. A dropdown will instantly surface matching students, Commons Q&A, and communities.
