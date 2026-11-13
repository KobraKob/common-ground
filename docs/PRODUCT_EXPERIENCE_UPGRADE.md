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
- Added a Campus Passport assembled from profile verification, skills, interests and accepted project memberships with role titles.
- Added a Build workspace with project creation, join requests, and task creation for project leads and accepted members.
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
- Added tests for analytics authorization/ingestion and project workspace/campus-boundary permissions.

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
- A durable contribution ledger for event participation, accepted project work, peer mentoring and community contributions. Campus Passport currently shows verified profile details and accepted project memberships; it does not yet claim event attendance or mentoring activity it cannot verify.
- Mentor discovery and matching, including consent, availability and safeguarding rules.
- Task status editing, assignment management, milestones and activity history in project workspaces.
- Full infinite-scroll/virtualized feed integration. Pagination and a reusable virtualized feed primitive exist in the codebase, but the current city feed still needs end-to-end integration.
- Broader TanStack Query migration for server-state caching and invalidation across legacy pages.
- A full WCAG 2.2 AA audit with keyboard/screen-reader testing across every route and modal.
- A production browser E2E suite and verified deployment/restore drills. CI results must pass before merge.
- A reviewed Privacy Policy and Terms of Service. Do not publish generated legal copy as approved policy.

## Acceptance gates

- Backend test suite passes, including new analytics and project permission tests.
- Frontend TypeScript static check and production build pass.
- Dependency and secret scanning pass.
- Staging database migration is applied and rolled back in a rehearsal.
- Project workspace authorization is verified for owner, accepted member, pending member and unrelated user.
- Analytics summary is inaccessible to ordinary users and contains only aggregate counts.
- Manual mobile checks confirm no horizontal overflow, no nested scroll traps and usable 44px targets.
- Measure LCP, CLS and INP on a mid-range Android device over 4G before claiming performance targets have been met.
