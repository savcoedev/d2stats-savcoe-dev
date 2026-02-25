

## Overhaul: New Calculation Engine, Role Groups, Game Mode Labels, and Hero Names

### What's Changing

The uploaded PDF defines a completely new scoring system that replaces the current weighted-average-based engine. Here's a summary of every change.

---

### 1. New Scoring Formulas (from the PDF)

The current engine uses role-weighted normalization against baselines. The PDF specifies three explicit formulas:

**Impact Score (replaces "Combat Score")**
```text
I = max(0, (K * 2.5) + (A * 1.5) + (TD / 500) - (D * 2.0)) * mode_scalar
```
- K = Kills, A = Assists, TD = Tower Damage, D = Deaths
- mode_scalar: Standard = 1.0, Turbo = 0.65

**Map Pressure (replaces current Map Pressure)**
```text
P = (TD + (LH * mode_scalar)) / (100 * T_minutes)
```
- TD = Tower Damage, LH = Last Hits
- T_minutes = match duration in minutes

**Survival Consistency (replaces "Survival Rate")**
```text
S = ((T_match - (D * 35)) / T_match) * 100
```
- T_match = match duration in seconds, D = Deaths
- 35 = estimated average respawn/downtime per death

---

### 2. New Role Groups

Currently the system uses 5 lane roles (Pos 1-5) from OpenDota's `lane_role` field. The PDF consolidates to 3 groups:

| New Group          | OpenDota lane_role values |
|--------------------|--------------------------|
| Core (Pos 1/2)     | 1 (Safe Lane), 2 (Mid)   |
| Offlane (Pos 3)    | 3 (Off Lane)             |
| Support (Pos 4/5)  | 4 (Jungle/Roam), + fallback for pos 5 detection |

The `lane_role_name` stored in `player_match_stats` will change from "Safe Lane" / "Mid Lane" / "Off Lane" / "Jungle" to "Core" / "Offlane" / "Support".

---

### 3. Role-Based Tier Thresholds (replaces fixed 0-100 scale)

The current TierBadge uses a fixed scale (S >= 90, A >= 80, etc.). The PDF defines role-dependent thresholds for the Impact Score:

| Tier       | Core (Pos 1/2) | Offlane (Pos 3) | Support (Pos 4/5) |
|------------|-----------------|------------------|--------------------|
| S-Class    | I >= 30.0       | I >= 26.0        | I >= 22.0          |
| A-Class    | I >= 20.0       | I >= 18.0        | I >= 14.0          |
| B-Class    | I >= 12.0       | I >= 10.0        | I >= 8.0           |
| C-Class    | I < 12.0        | I < 10.0         | I < 8.0            |

Note: The PDF uses 4 tiers (S/A/B/C) instead of the current 6 (S/A/B/C/D/F). The TierBadge will be updated accordingly.

---

### 4. Game Mode Labeling

Ensure matches display consistently as "Ranked", "Normal", or "Turbo":
- Game mode 22 = "Ranked"
- Game mode 23 = "Turbo"
- All others (1, 2, 3, 4, 5, 12, 16) = "Normal"

---

### 5. Hero Names from Heroes Table

The `sync-matches` function already looks up hero names from the `heroes` table, but falls back to "Hero {id}" when the table is empty. This will be fixed by ensuring `sync-heroes` is called before `sync-matches`, and the fallback text is improved.

---

### Files to Modify

**Backend (Edge Functions)**

1. **`supabase/functions/sync-matches/index.ts`** -- Complete rewrite of scoring logic:
   - Remove the old `ROLE_WEIGHTS`, `BASELINES`, `normalize()`, and `computeScores()` functions
   - Implement the 3 new formulas: Impact Score, Map Pressure, Survival Consistency
   - Add `mode_scalar` (1.0 for standard, 0.65 for turbo/mode 23)
   - Map `lane_role` to new role groups: Core / Offlane / Support
   - Update `GAME_MODE_NAMES` to output "Ranked", "Normal", "Turbo"
   - Store Impact Score in `combat_score` column, Pressure in `map_pressure_score`, Survival in `survival_rate`
   - Auto-call `sync-heroes` if hero table is empty before processing

2. **`supabase/functions/compare-players/index.ts`** -- No formula changes needed, just reads averages from DB. Already correct.

**Frontend Components**

3. **`src/components/dashboard/TierBadge.tsx`** -- Update to:
   - Accept a `role` prop (Core / Offlane / Support) and use role-dependent thresholds for Impact Score
   - For Map Pressure and Survival (which don't have role thresholds in the PDF), keep a simplified scale
   - Reduce to 4 tiers: S, A, B, C
   - Update colors: S = Gold, A = Green, B = Blue, C = Muted Red

4. **`src/components/dashboard/ScoreCard.tsx`** -- Pass role context to TierBadge for the Impact Score card

5. **`src/components/dashboard/MatchHistory.tsx`** -- Pass role to TierBadge for per-match tier display

6. **`src/components/dashboard/GameModeToggle.tsx`** -- Labels already correct ("Ranked", "Normal", "Turbo"). No changes.

7. **`src/pages/Dashboard.tsx`** -- Update score card labels:
   - "Combat Score" becomes "Impact Score"
   - Icons remain the same
   - Pass dominant role group to TierBadge

8. **`src/components/dashboard/PerformanceChart.tsx`** -- Rename "Combat" line to "Impact"

9. **`src/components/compare/RadarComparison.tsx`** -- Rename "Combat" axis to "Impact"

10. **`src/components/onboarding/OnboardingModal.tsx`** -- Update metric descriptions to match the new formulas

11. **`src/components/compare/PlayerBreakdown.tsx`** -- Rename "Combat" to "Impact"

**Database**

12. **No schema migration needed** -- The existing `map_pressure_score`, `combat_score`, and `survival_rate` columns in `player_match_stats` will store the new formula outputs. The column names stay the same; only the computed values change.

13. **Existing match data** -- Previously synced matches will have old scores. On next sync, new matches use new formulas. A one-time re-sync will recalculate all matches (since the edge function skips already-existing match IDs, we may want to add a `force` flag to re-process).

---

### Implementation Order

1. Update `sync-matches` edge function with new formulas, role groups, and game mode labels
2. Update `TierBadge` with role-dependent thresholds and 4 tiers
3. Update `Dashboard`, `ScoreCard`, `MatchHistory` to use "Impact Score" naming and pass role
4. Update `PerformanceChart`, `RadarComparison`, `PlayerBreakdown`, `OnboardingModal` labels
5. Deploy edge function and test
6. Optionally add a "force re-sync" button to recalculate old match scores

