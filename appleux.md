# CommonGround UX Review: Apple-Inspired Redesign

Nov 13, 2026 · @Balavanth

The live CommonGround site shows a new user too much at once, and Apple's design guidance points to a lighter first visit. This review covers the landing page, signup, City and Commons, and judges structure and flow only, not rendered color, type or spacing.

## What makes it feel heavy

A first-time visitor meets roughly 21 navigation controls, a ten-field signup and an empty feed under a full composer.

- **Three navigation systems on every page.** A top bar, a six-item "Navigation Matrix" with codes like FEED // 01, and a bottom bar add up to roughly 21 links and controls before any content, counted from the page markup (some may be hidden at certain screen sizes). They include a Mod Queue link and a three-persona switcher that guests shouldn't see.
- **The landing page explains everything at once.** It has three CTAs, four stat tiles, a four-tab feature section, six campus cards and three testimonials.
- **Signup is one page with ten inputs.** That includes confirm password and comma-separated skills.
- **The guest City page puts controls above an empty feed.** A full composer (post types, upload/link/poll, a demo-clip picker), three tabs, four filters and a sort control sit above a feed that reads "No pulse drops yet".
- **The vocabulary needs decoding.** Stage Trust, Peer-Val, Night Owls, Pulse Drops and Vault all ask the user to learn the product's terms first.

## What Apple's approach suggests

Ask for less up front, put content first, and teach in context. Apple's long-stated principles are clarity, deference (the UI serves content and never competes with it) and depth (layers convey hierarchy). Seven changes follow, in priority order.

1. **One navigation system, five destinations or fewer.** Use a bottom tab bar on mobile and a slim sidebar on desktop. Drop the 00–05 codes, show Mod Queue only to moderators, and hide the persona switcher behind a dev flag. For each element, write down the user problem it solves and cut it if none can be named.
2. **Landing page with one promise and one action.** Keep the hero and the Aarav sample post, and turn the six campus cards into a "Which campus?" picker. Choosing RVCE can then reshape the page around RVCE content, which is personalization from the first click. Cut the stat tiles and feature tabs.
3. **Two-field signup.** Apple says to ask for an account only if core functionality requires it ([Managing accounts](https://developer.apple.com/design/human-interface-guidelines/managing-accounts.md)), to request initial setup information only when necessary ([Launching](https://developer-rno.apple.com/design/human-interface-guidelines/patterns/launching)), and to get information from the system rather than asking for it ([Entering data](https://developer-rno.apple.com/design/human-interface-guidelines/patterns/entering-data)). The campus cards already list email domains, so a college email can set campus and the Verified badge automatically. Ask for skills when someone first opens Build and for subjects the first time they open Commons. Explain trust tiers in a badge tooltip, not as a disclosure block on the form.
4. **Guest view as a preview.** Collapse the composer to one "Share something…" row that asks for sign-in on tap. Apple's rule is to ask people to sign in only in exchange for value ([Sign in with Apple](https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple.md)). Seed the empty feed with clearly labelled starter content, because an empty feed is the weakest first impression.
5. **Progressive disclosure inside screens.** Show the few options that serve most tasks first and put the rest on a labelled second level ([Nielsen](https://uxtigers.com/post/progressive-disclosure)). Peer Directory and Clubs & Rooms are separate jobs, not tabs of the feed. Keep daily-use actions visible, since burying them charges users an interaction cost on every visit.
6. **Personalize content, not navigation.** Rank the home feed by campus and interests, and show one "next best action" card such as "Verify with your college email to vote". Keep nav positions fixed, because adaptive menus that reshuffle break spatial memory. For feature discovery, Apple's [TipKit](https://developer.apple.com/tutorials/data/documentation/tipkit.md) shows contextual tips for features people haven't found yet, once a condition is met. The same idea fits triggers like a first visit to Commons, a first post, or three days without joining a cohort.
7. **Plain labels, personality elsewhere.** Keep the Neo-Y2K attitude in visuals and empty states, but name things literally: "Verified" instead of "Stage Trust", "Post" instead of "Pulse Drop".

## Credibility issues to fix before real users arrive

The landing page presents seeded demo data as real, and its numbers disagree with each other.

- The page says "Real Student Experiences" and "1,480+ Students Live", but both come from seeded demo personas.
- The counts conflict: the six campus cards add up to 1,600, City says 1,480 and Commons says 890.

If trust is the product, label demo data as demo or remove it.

## Gaps in what could be checked

Several pages and states could not be read, so these findings cover less than the whole product.

- `/campus` returned only a loading line.
- `/build` returned an error.
- Signed-in screens such as Profile, Messages and Moderation were not visible.
- The "three onboarding screens max" figure that circulates comes from community summaries. Apple's own onboarding page says to keep onboarding fast, fun and optional.

## Sources

The CommonGround pages were opened directly on 2026-11-13. The Apple, Nielsen and principle-summary points rest on search excerpts of the pages below, not full reads.

- CommonGround pages read: [landing](https://common-ground-phi-one.vercel.app/), [City](https://common-ground-phi-one.vercel.app/city), [signup](https://common-ground-phi-one.vercel.app/signup), [Commons](https://common-ground-phi-one.vercel.app/commons)
- Apple HIG: [Onboarding](https://developer.apple.com/design/human-interface-guidelines/onboarding.md), [Managing accounts](https://developer.apple.com/design/human-interface-guidelines/managing-accounts.md), [Sign in with Apple](https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple.md), [Launching](https://developer-rno.apple.com/design/human-interface-guidelines/patterns/launching), [Entering data](https://developer-rno.apple.com/design/human-interface-guidelines/patterns/entering-data)
- Apple [TipKit documentation](https://developer.apple.com/tutorials/data/documentation/tipkit.md)
- Jakob Nielsen, [Progressive Disclosure](https://uxtigers.com/post/progressive-disclosure)
- Principle summaries: [Apple design system overview](https://www.superdesign.dev/blog/apple-design-system), [Uxcel: Design principles of Apple platforms](https://uxcel.com/lessons/design-principles-of-apple-platforms-037)
