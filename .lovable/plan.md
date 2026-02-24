

# Dota 2 Role-Analytics Dashboard — Full Build Plan

## 1. Design System & Visual Foundation
- Implement a custom matte color palette (off-white, off-grey, off-blue) as CSS variables
- Glassmorphism/Aero UI system: frosted-glass cards with `backdrop-filter`, layered gradients, soft shadows
- Fluid typography using `clamp()` for responsive scaling
- Install and configure **Framer Motion** for premium page/layout transitions, card animations, and gesture interactions
- Dark-toned gradient background to make glass elements pop

## 2. Authentication — Steam Login via Supabase
- Supabase project setup with a `users` table (steam_id, persona_name, avatar_url, last_synced_at)
- Steam OpenID authentication bridged through a Supabase Edge Function that validates the Steam identity and creates/updates a Supabase user session
- Protected routes: unauthenticated users see a cinematic landing page with a "Sign in with Steam" button
- Store the Steam API key as a Supabase secret for server-side use

## 3. Data Pipeline — OpenDota Integration
- **Edge Function: `sync-matches`** — Fetches recent matches from OpenDota `/players/{account_id}/matches`, then fetches detailed stats from `/matches/{match_id}`
- Stores raw match data in a `matches` table (match_id, start_time, duration, game_mode)
- Computes and caches role-weighted scores in a `player_match_stats` junction table (lane_role, is_win, map_pressure_score, combat_score, survival_rate)
- Automatic sync triggered on login + manual "Refresh" button

## 4. Custom Scoring Engine (Edge Function Logic)
- **Time-normalized baseline**: All raw stats normalized to a 40-minute standard (`S_norm = (S_raw / T_match) × 40`) — critical for fair Turbo mode comparisons
- **Role-weighted scoring**: Position-specific weights (Pos 1–5) applied to normalized metrics, producing 0–100 scores for Map Pressure, Combat Score, and Survival Rate
- Game mode segregation: scores tagged by Ranked / Normal / Turbo for strict filtering

## 5. Dashboard Pages & Components

### Landing Page (Unauthenticated)
- Cinematic hero section with animated gradients and a clear value proposition
- "Sign in with Steam" call-to-action

### Main Dashboard (Post-Login)
- **Profile header**: Steam avatar, persona name, last sync time
- **Game Mode Toggle**: Switch between Ranked / Normal / Turbo (filters all data)
- **Score Overview Cards** (glassmorphism): Three animated cards showing Map Pressure, Combat Score, and Survival Rate with circular/radial progress indicators
- **Performance Trend Chart**: Rolling performance over recent matches using Recharts with smooth animated transitions
- **Match History List**: Expandable match cards showing hero played, role detected, duration, win/loss, and individual score breakdown

### Match Detail (Expanded Card)
- Full score breakdown per metric with visual bars
- Role detected vs. expected role indicator
- Hero icon, game mode badge, match duration

### Friends Leaderboard (Collapsible Sidebar/Panel)
- Fetches the user's Steam friends list via API
- Shows rolling 20-game average scores for friends who also use the platform
- Animated rank transitions when scores update
- Collapsible panel so it doesn't distract from personal analytics

## 6. Progressive Onboarding
- First-time users see a centered glassmorphism modal explaining the custom metrics
- Framer Motion spotlight tour using Radix popovers to highlight key dashboard areas (score cards, mode toggle, leaderboard)

## 7. Error Handling & Edge Cases
- **API Down / Rate Limited**: Frosted amber banner indicating cached data is being shown
- **Private Steam Profile**: Animated prompt guiding the user to enable "Expose Public Match Data" in the Dota 2 client
- **Unparsed Match**: Muted grey overlay on the match card indicating replay data is pending

## 8. Performance & Accessibility
- Animate only `transform` and `opacity` for 60fps performance
- Lazy-load heavy assets (images, animations)
- Respect `prefers-reduced-motion` for accessibility
- Responsive design: fluid layouts with container queries, works on desktop and tablet

## 9. Database & Security
- Row-Level Security (RLS) on all tables so users can only access their own data
- Supabase Edge Functions handle all API key usage server-side (Steam key, OpenDota calls)
- Secure session management via Supabase Auth

