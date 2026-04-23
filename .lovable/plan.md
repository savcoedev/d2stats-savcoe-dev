## Plan: Generate Portfolio README.md

Create a polished `README.md` artifact at `/mnt/documents/README.md` summarizing D2Stats for portfolio/repo use. This replaces the default Lovable scaffold README with a project-focused one.

### Structure

1. **Title + tagline** — "D2Stats — Role-aware analytics for Dota 2 players."
2. **Live link** — `https://d2stats-savcoe-dev.lovable.app` (no repo link, per prior preference).
3. **Overview** — 2–3 sentence problem/solution framing (KDA flattens players → role-weighted scoring across Impact, Map Pressure, Survival).
4. **Features** — bulleted:
   - Role-aware scoring (Core / Offlane / Support)
   - Three-axis grading: Impact, Map Pressure, Survival
   - 4-tier system (S / A / B / C) with role-tuned thresholds
   - Transparent calculation breakdowns per match
   - Recency-weighted 25-match analysis window
   - 3-way radar comparison
   - Friends leaderboard via Steam friends list
   - Game-mode segregation (Ranked / Normal / Turbo)
5. **Tech stack** — React 18, TypeScript, Vite, Tailwind, Framer Motion, shadcn/ui, Recharts, Supabase (Postgres, Auth, Edge Functions), Steam OpenID, OpenDota API.
6. **Architecture** — short ASCII/text diagram showing client → edge functions → OpenDota / Steam / Supabase DB.
7. **Engineering highlights**:
   - Custom Steam OpenID → Supabase Auth bridge
   - JWT-validated edge functions with server-derived `steam_id`
   - Origin-allowlisted redirects (open-redirect hardening)
   - Transparent scoring formulas exposed in UI
   - Glassmorphism UI with transform/opacity-only 60fps animations
8. **Local development** — clone, `npm i`, `npm run dev`; note that Supabase env vars are auto-provisioned by Lovable Cloud.
9. **Project structure** — brief tree of `src/` and `supabase/functions/`.
10. **License** — MIT placeholder line.

### Deliverable
- File: `/mnt/documents/README.md`
- Delivered via `<lov-artifact>` with `text/markdown` MIME type.
- No QA screenshot needed (plain markdown).

Approve to generate.