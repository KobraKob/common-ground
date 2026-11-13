# CommonGround product and engineering upgrade

## Product direction

CommonGround is a cross-campus student network for discovering people, knowledge, communities, projects and opportunities beyond a student's own institution. The core product loop is:

**Discover → Connect → Learn → Build → Contribute**

Prioritise meaningful collaboration and repeat utility over vanity engagement metrics.

## Implemented in this branch

### Shared experience system
- Introduced a neutral surface and typography system with an 8-point spacing scale, consistent radii, one blue accent, focus-visible states and reduced-motion support.
- Added system/light/dark appearance selection with a persistent manual override.
- Replaced the desktop sidebar with a compact primary navigation row and retained a five-destination mobile bottom bar.
- Simplified the root layout and removed remote font stylesheet dependencies.
- Reworked the landing page around one clear promise, real product destinations and participating-campus links. Removed fabricated testimonial and activity-count presentation.
- Standardised campus hero presentation and removed the decorative radial glow.

### Discovery and student value
- Added a live discovery hub for campuses, cross-campus interest circles, projects, events and community-submitted opportunities.
- Added an interactive OpenStreetMap campus network with source-linked approximate campus-centre pins, accessible pin selection, campus detail links and external directions.
- Added public circle creation and joining through the existing community service.
- Added exact skill-tag matching for projects and opportunity posts. This is deterministic matching, not an opaque AI score.
- Added a Campus Passport assembled from profile verification, skills, interests, accepted project memberships, organizer-confirmed event attendance, community memberships and useful-answer activity.
- Added a durable event-attendance ledger. Only event organizers can mark a GOING RSVP as attended, only after the event ends; RSVP alone never counts as attendance.
- Added opt-in peer mentorship with public-profile eligibility, explicit availability, topic matching, contact-permission checks, block checks, private requests and accept/decline/cancel controls.
- Added a Build workspace with project creation, join requests, accepted-member roster, task creation, task status controls and project-lead assignment permissions.
- Added a moderator-only Campus Intelligence page with aggregated activity and platform inventory metrics.
- Removed client-side fallback content that presented invented posts, resources, announcements, events or community counts as real activity.

### Reliability, privacy and performance
- Replaced the unbounded process cache with a bounded, thread-safe LRU/TTL cache and SHA-256 ETags.
- Bypassed shared caching whenever cookies or authorization credentials are present.
- Replaced campus-directory N+1 count queries with grouped aggregates.
- Replaced project-list creator/member N+1 queries with joined aggregates.
- Paginated event listing and joined organizer names in one query.
- Protected project task workspaces so only the project owner and accepted collaborators can read or write tasks.
- Enforced campus-only project join restrictions server-side.
- Protected runtime metrics and metric reset endpoints behind moderator/admin authorization.
- Added privacy-limited authenticated analytics events. Only allowlisted event names and coarse product surfaces are accepted; no free-form search terms, message content or personal activity payloads are collected.
- Added moderator-only aggregated analytics and performance indexes for discovery, collaboration and analytics query paths.
- Removed feed N+1 queries by joining author/community/college data and batching reaction lookups.
- Replaced resource uploader N+1 lookups with one joined query and bounded resource pagination.
- Added explicit 12-item page loading for City and Commons feeds, so the first render does not request 50 posts.
- Avoided JSON content-type headers on bodyless GET requests to reduce unnecessary cross-origin preflights.
- Made profile privacy controls persist through the authenticated profile update endpoint.
- Connected institutional verification requests to the existing claim workflow; the interface accurately describes a pending review and does not claim to send an OTP.
- Added a functional Ctrl/Command+K search shortcut, keyboard Escape handling and a skip-to-content link.
- Added production-route smoke checks to CI and tests for profile privacy persistence and verification claim submission.
- Added tests for analytics authorization/ingestion, project workspace and task permissions, event attendance verification and mentorship consent/contact boundaries.

## Measurement definitions

- **Tracked active students (24h / 7d):** distinct authenticated users with an analytics event recorded in the window. This is not a retroactive count and must not be presented as a complete DAU/WAU until instrumentation coverage is validated.
- **Tracked events:** accepted analytics records in the selected period.
- **Cross-campus collaborations:** existing analytics records where a project collaborator from a different campus was accepted.
- **Projects and events created:** database counts for the selected period.
- **Public communities:** visible community inventory, not active membership.

The analytics dashboard displays this measurement limitation directly. It intentionally does not expose individual activity.

## Design and accessibility rules

1. Use one clear primary action per view.
2. Use semantic HTML, accessible names, visible keyboard focus and minimum 44px interaction targets.
3. Inputs must remain at least 16px on mobile to avoid unwanted browser zoom.
4. Honour reduced-motion preferences.
5. Keep motion functional and brief. Avoid decorative glows, unnecessary parallax and continuous animation.
6. Use real backend records. Empty states must be honest; never invent members, events, testimonials, counts or activity.
7. Keep private data private. Use aggregated analytics only; never show private student activity in Campus Intelligence.
8. Make loading, empty, error, disabled and success states explicit.

## Follow-up work still required

These are intentionally not represented as shipped functionality:

- Campus representatives should verify approximate map pins before they are treated as authoritative entrances or travel/safety guidance. Coordinate provenance and limitations are recorded in docs/CAMPUS_COORDINATE_SOURCES.md.
- A complete contribution ledger for peer mentoring outcomes and project task completion. The Passport currently records accepted project memberships and organizer-confirmed event attendance; it does not yet claim mentorship sessions or completed tasks until those outcomes have a verified workflow.
- Milestone history, activity timeline and richer task dependencies in project workspaces.
- Automatic infinite-scroll integration. City and Commons currently use explicit accessible “Load more” pagination; the reusable virtualized feed primitive is not yet wired into those routes.
- Broader TanStack Query migration for server-state caching and invalidation across legacy pages. Discovery and the City feed now use cached query flows; other legacy routes remain to be migrated.
- A full WCAG 2.2 AA audit with keyboard/screen-reader testing across every route and modal.
- A full browser-based E2E suite and verified deployment/restore drills. CI includes production-route HTTP smoke checks, but these do not replace real browser interaction tests.
- Legal review and owner completion of the Privacy and Terms drafts. These routes are explicitly marked as drafts and must not be represented as approved policy.

## Acceptance gates

- Backend test suite passes, including new analytics and project permission tests.
- Frontend TypeScript static check and production build pass.
- Dependency and secret scanning pass.
- Staging database migration is applied and rolled back in a rehearsal.
- Project workspace authorization is verified for owner, accepted member, pending member and unrelated user.
- Analytics summary is inaccessible to ordinary users and contains only aggregate counts.
- Manual mobile checks confirm no horizontal overflow, no nested scroll traps and usable 44px targets.
- Measure LCP, CLS and INP on a mid-range Android device over 4G before claiming performance targets have been met.
- Apply migrations 004–006 in staging, rehearse rollback and verify the event-attendance and mentorship constraints against the production database engine.
