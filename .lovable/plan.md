
# Rebuild Survival Consistency Score

## New Formula

Replace the current time-based survival formula with a KDA-ratio + Impact-weighted approach:

```
death_ratio = Deaths / max(Kills + Assists, 1)
base_survival = max(0, 100 - (death_ratio * 40))
impact_bonus = clamp(impact_score * 0.5, 0, 20)
survival_score = clamp(base_survival + impact_bonus, 0, 100)
```

**How it works:**
- **Base component** (0–100): Starts at 100, loses 40 points per unit of D/(K+A). A player with 1:1 death-to-participation ratio gets 60; a player dying twice per participation gets 20.
- **Impact bonus** (0–20): Rewards high-impact players who trade aggressively but still contribute. Scaled from the already-computed Impact Score.
- **Turbo scalar**: Applied to the impact_score input (already scaled by 0.65), so turbo survival naturally adjusts.

**Tier thresholds remain**: S≥80, A≥60, B≥40, C<40 (unchanged in TierBadge).

## Files to Change

1. **`supabase/functions/sync-matches/index.ts`** — Update `computeScores()` to use the new survival formula.
2. **`supabase/functions/compare-players/index.ts`** — If it has its own scoring logic, update there too.
3. **`mem://logic/scoring-formulas`** — Update memory with new formula.

## Re-sync Note

Existing match data will be recomputed on next sync (the sync function already recomputes scores for all 25 stored matches).
