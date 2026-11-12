# AGENTS.md — CommonGround AI Coding Agent Guide

## Aesthetic Direction: Neo-Y2K Editorial
- Base theme: `neoY2kTheme` extending `@astryxdesign/theme-y2k`.
- Typography: Use Crimson Text for hero/section display titles, Poppins for body copy, and uppercase JetBrains Mono for badges, metrics, and secondary labels.
- Surfaces: Keep layouts spacious with 24px+ section gaps; prefer 1px hairline borders (`#CCCFFA` light / `#282C47` dark) over heavy drop shadows.
- Accents: Reserve neon green (`#C5E17A`) and periwinkle (`#CCCFFA`) for primary CTAs, active indicators, and focus states.

## Product Architecture & Principles
1. **Product Identity**: CommonGround is a Bengaluru-first cross-campus student network, communication layer, and collaboration platform connecting students across RVCE, PESU, BMSCE, Christ, MSRIT, IIITB, and citywide.
2. **Staged Trust Model**:
   - `STAGE_1_PROVISIONAL`: Open registration with selected college. Badge: "Provisional Student — Self-Reported". Never imply official college endorsement.
   - `STAGE_2_COMMUNITY_VALIDATED`: Verified via trusted campus rep or peer invite code. Badge: "Peer-Validated Student".
   - `STAGE_3_INSTITUTIONAL_VERIFIED`: Verified via institutional email (`.edu.in` / `.ac.in`) or student ID check. Badge: "Verified Student".
   - `STAGE_4_OFFICIAL_PARTNER`: Official institution or department administration account. Badge: "Official Institution Badge".
3. **Privacy & Block Boundaries**:
   - When User A blocks User B (or vice versa): 1-to-1 DMs are disabled, profiles return restricted/404, and posts/comments are filtered from feeds.
   - Private group content (messages, announcements, pinned resources) must never leak into public search or city feeds.
4. **Communication Architecture**:
   - Every community has separated tabs: Announcements (admin/mod post only), Discussion Chat (threaded replies), and Pinned Vault (resources & links).
