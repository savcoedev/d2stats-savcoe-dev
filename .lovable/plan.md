# D2Stats — One-Page PDF Case Study

A single-page, editorial/magazine-style PDF portfolio case study summarizing D2Stats. No repo link, qualitative + illustrative metrics drawn from real app facts only.

## Format
- **File:** `/mnt/documents/d2stats-case-study.pdf`
- **Size:** US Letter portrait, generous margins (~0.75")
- **Tone:** Editorial — serif display headline, clean sans body, restrained accent color, lots of whitespace
- **Tooling:** ReportLab (Platypus + Canvas) in a Python script run via `code--exec`

## Page Layout (top → bottom)

```text
┌─────────────────────────────────────────────────────┐
│  CASE STUDY · 2025                  D2STATS         │  ← eyebrow row
│                                                     │
│  Role-aware analytics                               │
│  for Dota 2 players.                                │  ← serif headline
│                                                     │
│  ───────                                            │
│                                                     │
│  THE PROBLEM        THE SOLUTION                    │  ← two-column body
│  [paragraph]        [paragraph]                     │
│                                                     │
│  MEASURABLE VALUE                                   │
│  ┌────┬────┬────┬────┐                              │
│  │ 25 │ 3  │ 4  │ 60 │   stat tiles + captions     │
│  └────┴────┴────┴────┘                              │
│                                                     │
│  STACK         |  HIGHLIGHTS                        │
│  React · TS …  |  · Steam OpenID → Supabase bridge  │
│                |  · Hardened edge fns (JWT)         │
│                |  · Transparent score formulas      │
│                                                     │
│  ───────                                            │
│  Live  →  d2stats-savcoe-dev.lovable.app            │  ← footer
└─────────────────────────────────────────────────────┘
```

## Content

**Headline:** "Role-aware analytics for Dota 2 players."

**Problem (~50 words):** KDA flattens every player into the same yardstick. A support warding the map and a carry farming a lane get judged identically, so post-game stats rarely reflect actual contribution — leaving players without a meaningful read on whether they're improving.

**Solution (~60 words):** D2Stats ingests recent matches via the OpenDota API, classifies each game by lane role, and scores it across three dimensions — Impact, Map Pressure, Survival — weighted to that role and game mode. Every score exposes its formula and live inputs, so players see exactly what drove the grade.

**Measurable value (illustrative tiles, all grounded in real app facts):**
- **25** — match window analyzed per sync (recency-weighted)
- **3** — contextual score dimensions (Impact, Map Pressure, Survival)
- **4** — performance tiers (S / A / B / C) tuned per role group
- **60 fps** — transform/opacity-only animations across the UI

**Stack:** React 18 · TypeScript · Vite · Tailwind · Framer Motion · Recharts · Supabase · Steam OpenID · OpenDota

**Engineering highlights (3 bullets):**
- Custom Steam OpenID → Supabase Auth bridge with origin-allowlisted redirects
- JWT-validated edge functions with server-derived `steam_id` to prevent identity spoofing
- Transparent scoring: every grade exposes its formula and the match-specific inputs

**Footer:** Live → `d2stats-savcoe-dev.lovable.app`

## Visual Direction
- **Palette:** Off-white background `#F7F5F2`, near-black text `#1A1A1A`, single muted accent `#3A5A78` (matte off-blue from the app's identity) for the headline rule, stat numbers, and link
- **Type:** Georgia (serif) for headline + section labels in small caps; Helvetica for body and captions
- **Rules:** Two thin horizontal hairlines (top/bottom thirds) for editorial pacing; small caps eyebrows for section labels
- **Stat tiles:** 4 equal-width cells separated by hairlines (no boxes), big serif numbers + small caps captions

## QA
After generating, render the PDF to JPEG with `pdftoppm` and visually inspect for:
- Text overflow or clipped lines
- Column alignment and even spacing
- Margin consistency and accent-color contrast

Iterate until clean, then deliver via `<lov-artifact>`.
