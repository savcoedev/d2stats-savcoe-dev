

## Clear Old Match Data for Re-Sync

All 50 existing matches were scored with the old calculation engine. To apply the new formulas (Impact Score, Map Pressure, Survival Consistency) and updated role groups (Core/Offlane/Support), we need to wipe the old data and let you re-sync.

### Steps

1. **Delete all rows from `player_match_stats`** (50 rows with old scores)
2. **Delete all rows from `matches`** (50 rows referencing old data)

This ensures the next sync processes all matches fresh with the new formulas, role groups, and game mode labels.

### After Deletion

You'll log in, hit the Sync button, and all matches will be re-fetched from OpenDota and scored with:
- New Impact Score formula: `max(0, (K*2.5)+(A*1.5)+(TD/500)-(D*2.0)) * mode_scalar`
- New Map Pressure formula: `(TD + LH*mode_scalar) / (100 * T_min)`
- New Survival Consistency: `((T_sec - D*35) / T_sec) * 100`
- Role groups: Core / Offlane / Support
- Game modes: Ranked / Normal / Turbo
- Proper hero names from the heroes table

