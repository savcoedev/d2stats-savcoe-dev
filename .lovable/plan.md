

## Rebuild: Missing Features from Product Spec

After auditing the codebase against the uploaded specification, here's what already exists and what needs to be built.

### Already Implemented
- Steam OpenID authentication (with redirect fix)
- Custom scoring engine (role-weighted Map Pressure, Combat, Survival in `sync-matches`)
- Glassmorphism design system (glass cards, gradients, fluid typography)
- Dashboard with score cards, performance line chart, match history, game mode toggle
- Friends leaderboard panel (UI shell, not wired to data)

### Features to Build

---

### 1. Hero Dictionary Cache (Edge Function + Database)

The spec requires a backend job that syncs hero data from OpenDota's `/constants/heroes` endpoint, converting image paths to full Steam CDN URLs. Currently heroes display as "Hero 123".

**Database:**
- Create a `heroes` table: `id (int PK)`, `name (text)`, `localized_name (text)`, `icon_url (text)`, `image_url (text)`, `updated_at (timestamp)`
- No RLS needed (public read data)

**Edge Function:** `sync-heroes/index.ts`
- Fetch `https://api.opendota.com/api/constants/heroes`
- Convert relative image paths to `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/{name}.png`
- Upsert all heroes into the `heroes` table

**Update `sync-matches`:**
- After processing matches, look up hero names from the `heroes` table instead of using "Hero {id}"

---

### 2. Tier Badge System (S through F)

The spec requires gamified tier badges based on score thresholds: S (>=90), A (>=80), B (>=70), C (>=60), D (>=50), F (<50).

**New component:** `src/components/dashboard/TierBadge.tsx`
- Accepts a numeric score, returns a styled badge with the tier letter
- Tier-specific accent colors: Matte Gold (S), Matte Green (A), Blue (B), Teal (C), Orange (D), Muted Red (F)
- Glowing effect for S and A tiers

**Integration points:**
- ScoreCard component: show tier badge below the circular score
- MatchHistory: replace raw score numbers with tier badges
- Each match row shows a prominent tier badge for the overall score

---

### 3. Three-Way Comparison Engine (New Tab + Edge Function)

The spec requires a dedicated comparison tab where users can query up to 3 Steam IDs and see a Radar Chart overlay.

**Edge Function:** `compare-players/index.ts`
- Accepts an array of up to 3 Steam IDs
- Uses `Promise.all()` for concurrent OpenDota API fetches
- Returns averaged role-weighted scores per player
- Includes hero and profile data

**New components:**
- `src/components/compare/CompareTab.tsx` -- main container with 3 Steam ID input fields
- `src/components/compare/RadarComparison.tsx` -- Recharts RadarChart with overlapping neon accent lines for each player
- `src/components/compare/PlayerBreakdown.tsx` -- side-by-side role-filtered metric grid below the radar

**Routing:**
- Add a tab navigation to the Dashboard (Overview | Compare)
- Or add a `/compare` route

**UI Details:**
- Responsive CSS Grid layout
- Glassmorphism cards for each player's breakdown
- Neon accent lines on the radar (primary, accent, and a third color)

---

### 4. Hero Avatars in Match History

Once the heroes table exists:
- Update MatchHistory to display the official hero portrait image next to each match row
- Use the `image_url` from the heroes table
- Lazy-load images for performance

---

### 5. Onboarding Flow for First-Time Users

The spec requires a progressive disclosure modal explaining custom metrics.

**New component:** `src/components/onboarding/OnboardingModal.tsx`
- Multi-step Framer Motion spotlight tour
- Step 1: Explain Map Pressure metric
- Step 2: Explain Combat Score metric
- Step 3: Explain Survival Rate metric
- Step 4: Explain tier badges (S-F)
- Uses `localStorage` flag to show only on first visit
- Frosted glass modal with animated transitions

---

### 6. Error State UI Components

The spec calls for graceful degradation states:
- **API Rate Limit:** Frosted amber banner component
- **Private Profile:** Informational prompt card
- **Unparsed Match:** Muted grey overlay on affected match rows

**New component:** `src/components/ui/StatusBanner.tsx`
- Variants: `rate-limit` (amber), `private-profile` (info), `unparsed` (grey)

---

### 7. Wire Up Friends Leaderboard

The leaderboard UI exists but has no data source.

**Edge Function:** `get-friends-leaderboard/index.ts`
- Accept user's Steam ID
- Fetch Steam friends list via Steam API
- Cross-reference with the `users` table to find friends on the platform
- Query their averaged scores from `player_match_stats`
- Return sorted leaderboard data

**Dashboard update:**
- Call this function on mount and populate the existing `FriendsLeaderboard` component

---

### Technical Summary

```text
New database tables:
  - heroes (id, name, localized_name, icon_url, image_url, updated_at)

New edge functions:
  - sync-heroes        -- fetches hero dictionary from OpenDota
  - compare-players    -- concurrent 3-way player comparison
  - get-friends-leaderboard -- Steam friends cross-referenced with platform

Modified edge functions:
  - sync-matches       -- resolve hero names from heroes table

New frontend components:
  - TierBadge.tsx
  - CompareTab.tsx + RadarComparison.tsx + PlayerBreakdown.tsx
  - OnboardingModal.tsx
  - StatusBanner.tsx

Modified frontend components:
  - Dashboard.tsx      -- add tab navigation (Overview | Compare), wire friends
  - MatchHistory.tsx   -- add hero avatars, tier badges
  - ScoreCard.tsx      -- add tier badge display
  - App.tsx            -- add /compare route if needed
```

### Implementation Order

1. Heroes table + sync-heroes function (unblocks hero images everywhere)
2. TierBadge component (small, reusable, unblocks other UI)
3. Update MatchHistory and ScoreCard with hero images and tier badges
4. Compare engine (edge function + UI)
5. Friends leaderboard wiring
6. Onboarding modal
7. Error state banners

