# D2Stats

**Role-aware analytics for Dota 2 players.**

🔗 Live: https://d2.savcoe.dev

---

## Overview

KDA flattens every player into the same yardstick — a support warding the map and a carry farming a lane get judged identically, so post-game stats rarely reflect actual contribution. **D2Stats** ingests recent matches via the OpenDota API, classifies each game by lane role, and scores it across three dimensions — **Impact**, **Map Pressure**, and **Survival** — weighted to that role and game mode. Every score exposes its formula and live inputs, so players see exactly what drove the grade.

## Features

- **Role-aware scoring** — separate weighting for Core, Offlane, and Support
- **Three-axis grading** — Impact, Map Pressure, Survival (instead of a single KDA number)
- **4-tier system** — S / A / B / C, with thresholds tuned per role group
- **Transparent formulas** — every grade exposes the math and the match-specific inputs that produced it
- **Recency-weighted analysis** — last 25 matches per sync, weighted toward recent games
- **3-way radar comparison** — overlay your metrics against two other players
- **Friends leaderboard** — ranks registered users among your Steam friends
- **Game-mode segregation** — Ranked, Normal, and Turbo handled separately (with Turbo scaling)
- **Publish verification** — manual "Verify deployment" admin action fetches the live `index.html`, asserts the React root and bundled script tags are present, and emails the admin if anything is missing
- **Transactional email** — branded notifications sent from `mail.d2.savcoe.dev`

## Tech Stack

**Frontend** — React 18 · TypeScript · Vite · Tailwind CSS · Framer Motion · shadcn/ui · Recharts
**Backend** — Supabase (Postgres, Auth, Edge Functions)
**Integrations** — Steam OpenID · OpenDota API

## Architecture

```text
        ┌──────────────────┐
        │   React Client   │
        │  (Vite + TS)     │
        └────────┬─────────┘
                 │  JWT
        ┌────────▼─────────┐
        │  Edge Functions  │
        │  (Deno / Supabase)│
        └──┬────────┬───────┘
           │        │
   ┌───────▼──┐  ┌──▼─────────┐  ┌──────────────┐  ┌──────────────┐
   │ OpenDota │  │ Steam      │  │ Supabase DB  │  │ Resend /     │
   │   API    │  │ OpenID     │  │ (Postgres+RLS)│  │ Email (SMTP) │
   └──────────┘  └────────────┘  └──────────────┘  └──────────────┘
```

## Engineering Highlights

- **Steam OpenID → Supabase Auth bridge** — custom edge function exchanges Steam identity for a Supabase session
- **Hardened edge functions** — JWT validation on every sensitive endpoint; `steam_id` is server-derived from the token to prevent identity spoofing
- **Open-redirect protection** — `redirect_uri` is validated against an origin allowlist before being reflected back to the caller
- **Transparent scoring** — every metric in the UI links back to its formula and per-match inputs; no black-box grades
- **60 fps motion** — transform/opacity-only animations across the app, glassmorphism surfaces with matte off-white/off-blue palette
- **Publish health check** — admin-triggered edge function fetches the deployed HTML, validates required markers (React root, hashed bundle tags), logs the result, and queues an email alert via the transactional email pipeline if the published page is broken

## Local Development

```sh
git clone <your-repo-url>
cd d2stats
npm install
npm run dev
```

Backend env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`) are auto-provisioned via Lovable Cloud.

## Project Structure

```text
src/
├─ pages/              Landing · Dashboard · NotFound
├─ components/
│  ├─ dashboard/       Score cards, tier badges, match history, leaderboard
│  ├─ compare/         3-way radar + per-player breakdown
│  ├─ onboarding/      Progressive tour
│  └─ ui/              shadcn primitives
├─ contexts/           AuthContext (Steam-backed Supabase session)
└─ integrations/supabase/

supabase/functions/
├─ steam-auth/             Steam OpenID → Supabase session bridge
├─ sync-matches/           OpenDota match ingest (25-game window)
├─ sync-heroes/            Hero metadata sync
├─ compare-players/        3-way comparison aggregation
├─ get-friends-leaderboard/ Steam friends ∩ registered users
├─ verify-publish/         Fetches deployed HTML, validates required markers, logs result, queues alert on failure
└─ process-email-queue/    Drains the outbound transactional email queue
```

## License

MIT
