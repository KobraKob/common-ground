# CommonGround — Complete Visual Overhaul Specification (`REDESIGN.md`)
**Theme Direction:** *Celestial Campus Nightscape (Shinkai Astral Violet + Warm Campus Window Gold + Wet-Pavement Glassmorphism)*

> **CRITICAL INSTRUCTIONS FOR THE CODING AGENT:**
> The current "Neo-Y2K Editorial" theme (`#F5F6FD` light lavender, `#C5E17A` lime green, `Crimson Text` serif font, and flat boxy cards) **must be completely removed and replaced**.
> Your objective is to redesign the entire CommonGround frontend so that every screen looks and feels like the **Neon Celestial Campus Nightscape** artwork: a deep, atmospheric midnight-indigo and ultraviolet sky, a giant ringed crescent moon/planet, twinkling 4-point diamond stars (`✦`), glowing warm golden-amber college building windows at night, and glossy rain-slicked courtyard tiles reflecting the lights.

---

## 1. Visual Anatomy of the Reference Image (What Makes It Work)

The reference image succeeds because of **three specific visual contrasts** that you must replicate across the entire UI:

1. **Deep Cosmic Indigo & Ultraviolet Sky (90% of the canvas):**
   * The background is never flat black or flat white. It is a rich vertical gradient transitioning from **Deep Midnight Void (`#050214`)** at the top, through **Royal Astral Indigo (`#120836`)**, down to an **Electric Magenta-Violet Horizon Glow (`#4C1D95` -> `#7E22CE`)**.
2. **Warm Golden-Amber Campus Windows (The 10% Hero Contrast Accent):**
   * Against the cool purple night sky, the college buildings glow from within with **Warm Library Window Amber & Soft Gold (`#F59E0B`, `#FBBF24`, `#FDE68A`)**.
   * In our UI, **primary buttons, active navigation states, pinned announcements, and verified badges** must use this warm golden-amber glow so interactive elements feel like lit campus windows at night.
3. **Rain-Slicked Courtyard Reflections (Wet-Pavement Glassmorphism):**
   * The foreground plaza reflects both the purple sky and the warm golden building lights across a subtle perspective tile grid with specular highlights.
   * Every card, sidebar, modal, and chat panel must use **deep frosted indigo glass** (`backdrop-filter: blur(20px) saturate(165%)`) with a **1px specular gradient border** (glowing violet or warm amber along the top edge, fading to transparent on the bottom).

---

## 2. Exact Color Palette & Design Tokens

Replace all existing colors in `frontend/src/theme/neoY2kTheme.ts`, `tailwind.config.ts`, and `frontend/src/app/globals.css` with these exact tokens:

### 2.1 Background & Sky Layers
| Token | Hex / Value | Usage |
| :--- | :--- | :--- |
| `--bg-void` | `#050214` | Deepest root background (top of night sky) |
| `--bg-cosmos` | `#0B0524` | Primary app background canvas |
| `--bg-nebula` | `#160B3E` | Mid-ground elevated surface / secondary panels |
| `--bg-horizon` | `#2E1065` | Horizon ambient bloom at bottom of hero banners |
| `--bg-glass-card` | `rgba(17, 10, 44, 0.68)` | Standard card background (paired with `backdrop-blur-xl`) |
| `--bg-glass-elevated` | `rgba(28, 16, 68, 0.78)` | Hover state / active modal / sticky nav surface |
| `--bg-glass-input` | `rgba(9, 4, 28, 0.75)` | Recessed search bars, chat composers, form inputs |

### 2.2 Accent Colors (Celestial Violet + Warm Window Gold)
| Token | Hex / Value | Usage |
| :--- | :--- | :--- |
| `--accent-amber-core` | `#F59E0B` | Primary CTA fill start, warm campus window glow |
| `--accent-amber-bright` | `#FBBF24` | Primary CTA fill end, active tab indicator, solved badge |
| `--accent-amber-soft` | `#FDE68A` | Specular text highlight, star/window inner highlight |
| `--accent-violet-core` | `#7C3AED` | Secondary CTA, community pills, orbital accents |
| `--accent-violet-bright` | `#A855F7` | Active borders, cross-campus links, poll bars |
| `--accent-orchid-glow` | `#C084FC` | Top-edge specular card highlight, badges |
| `--accent-cyan-star` | `#38BDF8` | Peer-validated trust badge, shooting star tint |

### 2.3 Typography & Border Tokens
| Token | Hex / Value | Usage |
| :--- | :--- | :--- |
| `--text-starlight` | `#F8F7FF` | Primary headings & body text (crisp lilac-white) |
| `--text-nebula-sec` | `#C4B5FD` | Secondary text, subtitles, descriptions |
| `--text-cosmos-muted` | `#7C6FA6` | Timestamps, handles, muted metadata |
| `--border-hairline` | `rgba(168, 85, 247, 0.22)` | Default 1px translucent ultraviolet border |
| `--border-specular-top` | `rgba(192, 132, 252, 0.45)` | Top highlight border on glass cards |
| `--border-amber-glow` | `rgba(251, 191, 36, 0.45)` | Border for pinned items, active cards, primary inputs |

---

## 3. Typography Overhaul (Remove `Crimson Text`)

**Delete `Crimson Text` immediately.** Serif fonts clash with the sleek anime nightscape aesthetic. Load and apply these three Google Fonts in `frontend/src/app/layout.tsx` and `globals.css`:

1. **Display & Section Headings (`--font-display`):** **`Outfit`** or **`Space Grotesk`** (Weights: `600`, `700`).
   * Tight letter-spacing (`-0.025em`).
   * Hero titles use a subtle starlight-to-lilac gradient text fill (`linear-gradient(135deg, #FFFFFF 0%, #E9D5FF 55%, #FDE68A 100%)`).
2. **UI & Body Copy (`--font-sans`):** **`Plus Jakarta Sans`** (Weights: `400`, `500`, `600`).
   * Clean, modern, effortlessly readable against dark glass surfaces.
3. **Coordinates, Badges, Counts & Tags (`--font-mono`):** **`JetBrains Mono`** (Weights: `500`, `600`).
   * Used for college shortcodes (`RVCE // BLR`), online counters (`142 NIGHT OWLS ACTIVE`), trust badges, and topic tags (`#DSA`).

---

## 4. Hero Artwork & Ambient Background Setup

### Step 4.1: Save the Artwork Asset
1. Save the user's reference image (`Neon Celestial Campus Nightscape.png`) to:
   `frontend/public/assets/celestial-campus-nightscape.png`
2. If the image file is not yet in `public/assets/`, render a high-detail CSS + SVG celestial nightscape fallback so the app never shows a broken image or plain background.

### Step 4.2: Build `CelestialBackground.tsx` (`frontend/src/components/shared/CelestialBackground.tsx`)
Create a fixed, non-interactive `z-0` ambient background component rendered inside the root layout so every page sits inside this world:
* **Layer 1 (Sky Gradient):** Deep vertical gradient from `#050214` (0%) -> `#0D0628` (45%) -> `#240E5A` (80%) -> `#3B1278` (100%).
* **Layer 2 (4-Point Starfield & Shooting Stars):** An SVG overlay rendering crisp 4-point diamond stars (`✦`) of varying opacities (`0.2` to `0.9`) with subtle CSS twinkle animations, plus 2 diagonal shooting-star light trails (`linear-gradient(45deg, rgba(255,255,255,0.8), transparent)`).
* **Layer 3 (Giant Ringed Crescent Planet):** Positioned in the top-right quadrant (`top: -60px; right: -40px; width: 520px; height: 520px`), an SVG planet shaded with deep violet craters (`#1E0B4B` to `#A855F7` rim light) encircled by a sweeping tilted orbital ring (`ellipse` rotated `-22deg` with a glowing `#C084FC` stroke).
* **Layer 4 (Horizon Ambient Blooms):**
  * Left/Center violet cloud bloom: `radial-gradient(circle, rgba(147, 51, 234, 0.28) 0%, transparent 70%)`
  * Right warm campus window reflection bloom: `radial-gradient(circle, rgba(245, 158, 11, 0.16) 0%, transparent 65%)`
* **Layer 5 (Wet-Pavement Courtyard Grid at Bottom):** A subtle perspective grid at the bottom `25vh` of the viewport (`background-image: linear-gradient(to right, rgba(192,132,252,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(251,191,36,0.05) 1px, transparent 1px)`) creating the rain-slicked tile reflection look.

---

## 5. Complete `globals.css` Replacement

Replace the entire contents of `frontend/src/app/globals.css` with the following production stylesheet:

```css
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Outfit:wght@500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg-void: #050214;
  --bg-cosmos: #0B0524;
  --bg-nebula: #160B3E;
  --bg-horizon: #2E1065;
  --bg-glass-card: rgba(16, 9, 42, 0.68);
  --bg-glass-elevated: rgba(26, 14, 64, 0.82);
  --bg-glass-input: rgba(8, 4, 24, 0.78);

  --accent-amber-core: #F59E0B;
  --accent-amber-bright: #FBBF24;
  --accent-amber-soft: #FDE68A;
  --accent-violet-core: #7C3AED;
  --accent-violet-bright: #A855F7;
  --accent-orchid-glow: #C084FC;

  --text-starlight: #F8F7FF;
  --text-nebula-sec: #C4B5FD;
  --text-cosmos-muted: #7C6FA6;

  --border-hairline: rgba(168, 85, 247, 0.22);
  --border-specular-top: rgba(192, 132, 252, 0.42);
  --border-amber-glow: rgba(251, 191, 36, 0.45);

  --font-display: 'Outfit', sans-serif;
  --font-sans: 'Plus Jakarta Sans', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}

* {
  box-sizing: border-box;
}

html,
body {
  background-color: var(--bg-void);
  color: var(--text-starlight);
  font-family: var(--font-sans);
  min-height: 100vh;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3, h4, .font-display {
  font-family: var(--font-display);
  letter-spacing: -0.02em;
}

.font-mono-badge {
  font-family: var(--font-mono);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

/* Starlight Gradient Heading Text */
.text-celestial-gradient {
  background: linear-gradient(135deg, #FFFFFF 0%, #E9D5FF 55%, #FDE68A 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Wet-Pavement Glassmorphic Card (Replaces .neo-card) */
.neo-card,
.celestial-card {
  background: linear-gradient(
    165deg,
    rgba(30, 17, 72, 0.72) 0%,
    rgba(14, 8, 36, 0.78) 60%,
    rgba(20, 11, 48, 0.82) 100%
  );
  backdrop-filter: blur(20px) saturate(165%);
  -webkit-backdrop-filter: blur(20px) saturate(165%);
  border: 1px solid var(--border-hairline);
  border-top: 1px solid var(--border-specular-top);
  border-radius: 18px;
  box-shadow:
    0 14px 40px -10px rgba(3, 1, 12, 0.75),
    inset 0 1px 0 0 rgba(255, 255, 255, 0.14);
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1),
              border-color 0.2s ease,
              box-shadow 0.2s ease;
}

.neo-card:hover,
.celestial-card:hover {
  border-color: rgba(192, 132, 252, 0.45);
  box-shadow:
    0 18px 45px -10px rgba(88, 28, 135, 0.35),
    inset 0 1px 0 0 rgba(253, 230, 138, 0.22);
}

/* Warm Lit Campus Window Card Variant (For Pinned / Featured / Active Items) */
.celestial-card-amber {
  background: linear-gradient(
    165deg,
    rgba(45, 24, 66, 0.76) 0%,
    rgba(18, 10, 42, 0.82) 70%,
    rgba(48, 28, 18, 0.55) 100%
  );
  backdrop-filter: blur(20px) saturate(170%);
  border: 1px solid rgba(251, 191, 36, 0.32);
  border-top: 1px solid rgba(253, 230, 138, 0.65);
  border-radius: 18px;
  box-shadow:
    0 12px 36px -8px rgba(245, 158, 11, 0.18),
    inset 0 1px 12px rgba(251, 191, 36, 0.08);
}

/* Primary CTA: Warm Campus Window Gold Button (Replaces .neo-pill-btn) */
.neo-pill-btn,
.btn-campus-amber {
  background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 60%, #FDE68A 100%);
  color: #090420 !important;
  font-family: var(--font-display);
  font-weight: 700;
  border-radius: 9999px;
  border: 1px solid rgba(255, 251, 235, 0.65);
  box-shadow:
    0 0 20px rgba(251, 191, 36, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  transition: all 0.18s ease;
}

.neo-pill-btn:hover,
.btn-campus-amber:hover {
  transform: translateY(-1px);
  box-shadow:
    0 0 28px rgba(251, 191, 36, 0.55),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  filter: brightness(1.05);
}

.neo-pill-btn:active,
.btn-campus-amber:active {
  transform: translateY(1px);
}

/* Secondary CTA: Nebula Ultraviolet Pill Button */
.btn-nebula-violet {
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.85) 0%, rgba(168, 85, 247, 0.85) 100%);
  color: #F8F7FF;
  font-family: var(--font-display);
  font-weight: 600;
  border-radius: 9999px;
  border: 1px solid rgba(216, 180, 254, 0.45);
  box-shadow: 0 0 18px rgba(139, 92, 246, 0.35);
  transition: all 0.18s ease;
}

.btn-nebula-violet:hover {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.95) 0%, rgba(192, 132, 252, 0.95) 100%);
  box-shadow: 0 0 24px rgba(168, 85, 247, 0.55);
  transform: translateY(-1px);
}

/* Ghost / Filter Pill (Wet Pavement Glass Pill) */
.pill-glass {
  background: rgba(20, 11, 52, 0.65);
  border: 1px solid rgba(168, 85, 247, 0.25);
  color: var(--text-nebula-sec);
  border-radius: 9999px;
  backdrop-filter: blur(12px);
  transition: all 0.15s ease;
}

.pill-glass:hover,
.pill-glass-active {
  background: rgba(124, 58, 237, 0.28);
  border-color: rgba(251, 191, 36, 0.6);
  color: #FDE68A;
  box-shadow: 0 0 14px rgba(251, 191, 36, 0.2);
}

/* Recessed Astral Inputs & Chat Composer */
.celestial-input {
  background: var(--bg-glass-input);
  border: 1px solid rgba(139, 92, 246, 0.28);
  border-radius: 16px;
  color: var(--text-starlight);
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.45);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.celestial-input::placeholder {
  color: var(--text-cosmos-muted);
}

.celestial-input:focus {
  outline: none;
  border-color: var(--accent-amber-bright);
  box-shadow:
    0 0 0 3px rgba(251, 191, 36, 0.15),
    inset 0 2px 6px rgba(0, 0, 0, 0.45);
}

/* Twinkling Star Animation */
@keyframes starPulse {
  0%, 100% { opacity: 0.35; transform: scale(0.9); }
  50% { opacity: 1; transform: scale(1.15); }
}

.animate-star-twinkle {
  animation: starPulse 3.6s ease-in-out infinite;
}

/* Custom Scrollbar */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: #050214;
}
::-webkit-scrollbar-thumb {
  background: #2E1065;
  border-radius: 9999px;
}
::-webkit-scrollbar-thumb:hover {
  background: #7C3AED;
}
```

---

## 6. Component-by-Component Redesign Plan

### 6.1 Panoramic Hero Banner (`CampusHeroBanner.tsx`)
Build a reusable panoramic hero header at the top of `/campus` and `/city` that directly showcases the **Celestial Campus Nightscape** visual:
* **Container:** `relative overflow-hidden rounded-3xl border border-purple-400/30 shadow-2xl min-h-[240px] md:min-h-[280px] flex flex-col justify-end p-6 md:p-8`
* **Background Artwork Layer:**
  * Uses `/assets/celestial-campus-nightscape.png` (`bg-cover bg-center`) **plus** an embedded SVG layer of the ringed crescent planet, twinkling 4-point stars (`✦`), and glowing campus building silhouettes so it looks crisp at any resolution.
  * Overlay gradient at the bottom (`bg-gradient-to-t from-[#07031A] via-[#0E062B]/65 to-transparent`) so foreground typography is 100% legible.
* **Foreground Content:**
  * Top-left floating pill: `✦ BENGALURU NIGHT NETWORK • LIVE` with a pulsing warm amber dot (`#FBBF24`).
  * Main Headline (`text-3xl md:text-4xl font-extrabold text-celestial-gradient`): e.g., *"RV College of Engineering"* on `/campus` or *"Bengaluru After Hours"* on `/city`.
  * Bottom wet-glass bar inside the hero: Displays the Campus Switcher dropdown, active night-owl student counter, and honest affiliation status badge.

### 6.2 Navigation Shell (`frontend/src/app/(main)/layout.tsx`)
* **Remove any white/lavender light backgrounds.** The entire app shell sits over `<CelestialBackground />`.
* **Desktop Left Sidebar (`w-64`):**
  * Floating frosted glass panel (`bg-[#0B0524]/75 backdrop-blur-2xl border-r border-purple-500/20`).
  * Brand Header: **CommonGround** logo with a glowing 4-point star + orbital ring icon in warm gold (`#FBBF24`) and violet (`#C084FC`), subtitled `BLR // STUDENT NETWORK`.
  * **Active Navigation Item:** Looks like a lit campus window at night — warm amber left indicator bar (`w-1 bg-amber-400 shadow-[0_0_12px_#FBBF24]`), subtle amber-violet gradient background (`bg-gradient-to-r from-amber-500/15 via-purple-600/15 to-transparent`), and `#FDE68A` text.
* **Top Header Bar:**
  * Frosted glass bar (`bg-[#090420]/70 backdrop-blur-xl border-b border-purple-500/20`).
  * **Global Search Bar:** Recessed `.celestial-input` with a `✦` search icon and `⌘K` badge. Dropdown results render inside a `.celestial-card` with glowing category dividers.
  * **Persona Switcher & Atmosphere Toggle:** Styled as sleek dark-glass capsules in the top right. Replace the jarring white light-mode toggle with an **"Atmosphere Mode"** toggle (`Deep Midnight` vs. `Twilight Nebula` — both preserving the dark celestial aesthetic).

### 6.3 The 4-Stage Trust Badges (`TrustBadge.tsx`)
Redesign the badges so they harmonize with the nightscape palette:
1. **`STAGE_1_PROVISIONAL` (Provisional Student — Self-Reported):**
   * Warm Amber Window Glow (`bg-amber-500/15 border border-amber-400/45 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.2)]`).
2. **`STAGE_2_COMMUNITY_VALIDATED` (Peer-Validated Student):**
   * Starlight Cyan (`bg-sky-500/15 border border-sky-400/45 text-sky-200 shadow-[0_0_12px_rgba(56,189,248,0.2)]`).
3. **`STAGE_3_INSTITUTIONAL_VERIFIED` (Verified `.edu.in` Student):**
   * Celestial Ultraviolet & Gold (`bg-purple-500/20 border border-purple-400/50 text-purple-100 shadow-[0_0_14px_rgba(168,85,247,0.35)]`) with a gold star checkmark.
4. **`STAGE_4_OFFICIAL_PARTNER` (Official Institution):**
   * Royal Gold & Indigo Shield (`bg-gradient-to-r from-amber-500/25 to-purple-600/25 border border-amber-300/60 text-amber-100`).

### 6.4 Module Screens (`campus`, `city`, `commons`, `messages`, `build`, `profile`, `moderation`)
Update all hardcoded Tailwind classes across every page in `frontend/src/app/`:
* **Search & Replace Legacy Classes:**
  * Replace any `bg-[#F5F6FD]`, `bg-white`, `bg-slate-50`, `text-[#1A1C29]` with `.celestial-card`, `bg-[#0B0524]/80`, `text-[#F8F7FF]`, and `text-[#C4B5FD]`.
  * Replace any `#C5E17A` (lime green) accents with `#FBBF24` (warm window amber) or `#A855F7` (celestial violet).
* **City Pulse Polls (`/city`):**
  * Poll progress bars must use a glowing horizon gradient (`bg-gradient-to-r from-purple-600 via-fuchsia-500 to-amber-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]`).
* **Commons Q&A (`/commons`):**
  * "Solved / Useful Answer" cards use `.celestial-card-amber` with a glowing golden checkmark badge.
* **Messages (`/messages`):**
  * Split chat container uses wet-pavement glassmorphism.
  * Own messages use `bg-gradient-to-br from-purple-600/90 to-indigo-800/90 border border-purple-400/40 text-white`.
  * Announcements channel banner uses warm amber window lighting (`border-amber-400/40 bg-amber-500/10 text-amber-200`).
* **Build & Projects (`/build`):**
  * Project cards feature a top specular highlight, skill tags in `JetBrains Mono` (`bg-purple-950/70 border border-purple-400/30 text-purple-200`), and a primary `.btn-campus-amber` **"Request to Join Team"** CTA.

---

## 7. Step-by-Step Execution Checklist for the Agent

1. [ ] **Save Reference Image:** Copy `Neon Celestial Campus Nightscape.png` into `frontend/public/assets/celestial-campus-nightscape.png`.
2. [ ] **Update Theme Tokens:** Rewrite `frontend/src/theme/neoY2kTheme.ts` and `frontend/tailwind.config.ts` with the Celestial Campus Nightscape palette (`#050214`, `#160B3E`, `#A855F7`, `#FBBF24`). Remove all `#C5E17A` and `#F5F6FD` tokens.
3. [ ] **Replace Global Styles:** Overwrite `frontend/src/app/globals.css` with the CSS in Section 5 (loading `Outfit`, `Plus Jakarta Sans`, and `JetBrains Mono`).
4. [ ] **Create `<CelestialBackground />` & `<CampusHeroBanner />`:** Build the fixed cosmic sky + ringed planet + 4-point starfield background component and the panoramic campus nightscape hero component.
5. [ ] **Refactor App Shell (`frontend/src/app/(main)/layout.tsx`):** Inject `<CelestialBackground />`, restyle the sidebar, mobile bottom dock, search bar, and header controls with wet-pavement glassmorphism and warm amber active window indicators.
6. [ ] **Refactor All 8 Route Pages:** Update `/campus`, `/city`, `/commons`, `/messages`, `/build`, `/profile`, `/moderation`, and `/onboarding` so zero legacy light-mode or lime-green styles remain.
7. [ ] **Build & Verify:** Run `npm run build` in `frontend/` to ensure zero TypeScript or CSS compilation errors, and verify that the rendered app visually matches the **Neon Celestial Campus Nightscape** artwork.