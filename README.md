# CommonGround — Cross-Campus Student Network & Collaboration Platform

> **Bengaluru Launch Cluster**: RV College of Engineering (`RVCE`), PES University (`PESU`), BMS College of Engineering (`BMSCE`), Christ University (`CHRIST`), MS Ramaiah Institute of Technology (`MSRIT`), and IIIT Bangalore (`IIITB`).

CommonGround connects college students across Bengaluru in a unified, privacy-guarded environment combining **Campus Home Base**, **City Discovery & Hangout**, **Commons Searchable Knowledge**, **Organized Communication (Groups & DMs)**, **Projects & Opportunities**, and **Platform Safety Governance**.

---

## 🎨 Aesthetic Direction: Neo-Y2K Editorial
- **Base Theme**: `neoY2kTheme` extending `@astryxdesign/theme-y2k`.
- **Palette**:
  - Background: `#F5F6FD` (airy ice-lavender light mode) / `#0E0F1A` (deep navy-obsidian dark mode).
  - Surfaces: `#FFFFFF` / `#151726`.
  - Accents: `#1A1C29` (charcoal light) / `#C5E17A` (signature neon green dark mode).
  - Hairline Borders: `#CCCFFA` (crisp periwinkle light) / `#282C47` (obsidian dark).
- **Typography Contrast**:
  - Display / Hero Headings: **Crimson Text** (with italic emphasis on key terms).
  - Body Copy: **Poppins** for clean readability.
  - Metrics, Counters & Chips: **JetBrains Mono** uppercase.
- **Hardware Polish**: 1px hairline borders (`inset 0 1px 0 rgba(255, 255, 255, 0.25)`), tactile pill controls (`rounded-full` shifting `translateY(1px)` on press), and rounded chat composer (16px).

---

## 🛡️ The 4-Stage Trust Architecture
1. `STAGE_1_PROVISIONAL`: Open registration. Student selects a Bengaluru college. Displays **"Provisional Student — Self-Reported"**.
2. `STAGE_2_COMMUNITY_VALIDATED`: Verified via trusted campus representatives or controlled peer cohort invite codes. Displays **"Peer-Validated Student"**.
3. `STAGE_3_INSTITUTIONAL_VERIFIED`: Verified via institutional `.edu.in` / `.ac.in` student email OTP or manual student ID check. Displays **"Verified Student"**.
4. `STAGE_4_OFFICIAL_PARTNER`: Reserved exclusively for authorized college administration or department pages. Displays **"Official Institution Badge"**.

---

## 🏗️ Repository Architecture

```text
commonground/
├── build.md                         # Master engineering blueprint
├── AGENTS.md                        # Aesthetic and agent guardrails
├── docker-compose.yml               # Local Docker PostgreSQL, Redis, FastAPI & Next.js
├── .env.example                     # Environment template
├── supabase/
│   ├── config.toml                  # Supabase local config
│   ├── migrations/
│   │   └── 001_init_schema.sql      # Full PostgreSQL schema with enums and GIN indexes
│   └── seed.sql                     # Deterministic seed data for Bengaluru cluster
├── backend/
│   ├── pyproject.toml
│   ├── requirements.txt
│   ├── pytest.ini
│   ├── app/
│   │   ├── main.py                  # FastAPI application entry, CORS, lifespan
│   │   ├── seed.py                  # Database initialization and seed script
│   │   ├── core/
│   │   │   ├── config.py            # Pydantic Settings
│   │   │   ├── database.py          # Cross-compatible SQLAlchemy async engine (Postgres / SQLite)
│   │   │   ├── security.py          # Supabase JWT & dev auth header dependencies
│   │   │   ├── permissions.py       # RBAC, DM permission & privacy block checks
│   │   │   └── rate_limit.py        # Sliding window rate limiter
│   │   ├── modules/
│   │   │   ├── identity/            # User, StudentProfile, Claims, Blocks, Mutes
│   │   │   ├── colleges/            # Bengaluru colleges and Campus Hub overview
│   │   │   ├── communities/         # Communities, Group Chats & Announcement channels
│   │   │   ├── commons/             # Q&A, Nested Comments, Accepted Answers, Resources, Unified Search
│   │   │   ├── messaging/           # 1-to-1 DMs and Group Messages
│   │   │   ├── events/              # Campus and City Events with RSVP
│   │   │   ├── projects/            # Cross-campus team formation & Task boards
│   │   │   ├── notifications/       # In-app notifications
│   │   │   └── moderation/          # Report triage, Moderation Actions, Audit log
│   │   └── tests/
│   │       ├── conftest.py
│   │       └── test_core_flows.py   # Automated pytest async suite
└── frontend/
    ├── package.json
    ├── capacitor.config.ts          # Mobile wrapper configuration (Android & iOS)
    ├── next.config.ts
    ├── tailwind.config.ts           # Neo-Y2K custom tokens and fonts
    ├── tsconfig.json
    └── src/
        ├── app/
        │   ├── layout.tsx           # Global font imports, shell, header & sidebar
        │   ├── globals.css          # Neo-Y2K hairline cards, tactile pill buttons
        │   ├── campus/              # Module 5.1: Campus Home Base & Hub
        │   ├── city/                # Module 5.2: City Pulse & People Directory
        │   ├── commons/             # Module 5.3: Searchable Q&A & Notes Vault
        │   ├── messages/            # Module 6: Solves WhatsApp chaos (Split sub-tabs & DMs)
        │   ├── build/               # Modules 5.4 & 5.6: Projects, Events & Opportunities
        │   ├── profile/             # Staged trust visualizer & privacy toggles
        │   ├── moderation/          # Moderator queue & immutable audit log
        │   └── (auth)/onboarding/   # Onboarding with explicit provisional status banner
        ├── components/shared/
        │   ├── GlobalHeader.tsx     # Live search, persona switcher, theme toggle
        │   ├── NavigationSidebar.tsx# Desktop sidebar + mobile bottom nav
        │   ├── TrustBadge.tsx       # 4-stage technical trust badges
        │   └── ReportModal.tsx      # Universal 2-click report modal
        ├── theme/
        │   └── neoY2kTheme.ts       # Astryx defineTheme implementation
        ├── lib/
        │   ├── api.ts               # Typed client with live API + offline mock fallback
        │   └── mockData.ts          # Bengaluru cluster seed data
        └── types/
            └── index.ts             # Shared domain TypeScript types
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.11+
- Node.js 18+ (Node 24 tested)
- npm 10+

### 2. Backend Setup & Run
```bash
cd backend
python -m pip install -r requirements.txt
# Run automated tests
python -m pytest app/tests -v
# Seed database
python -m app.seed
# Start FastAPI dev server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be available at `http://localhost:8000/docs`.

### 3. Frontend Setup & Run
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` to interact with CommonGround.

### 4. Running via Docker Compose
```bash
docker-compose up --build
```

---

## 🧪 Verification & Acceptance Criteria
- **Stage 1 Provisional Status**: Newly registered students are tagged with `STAGE_1_PROVISIONAL` and a prominent self-reported banner.
- **Privacy & Blocking**: When User A blocks User B, direct messaging is forbidden (`403`), and direct profile lookup returns `404 Not Found`.
- **Announcement Protection**: Non-moderators attempting to post to `ANNOUNCEMENT_CHANNEL` receive `403 Forbidden`.
- **Moderator Queue Isolation**: Non-moderators are rejected with `403 Forbidden` from `/api/v1/moderation/queue`.
- **Search Boundaries**: Private group messages only surface in search for authorized conversation members.
- **Frontend Production Build**: `npm run build` passes with zero type errors and zero bundle warnings.
