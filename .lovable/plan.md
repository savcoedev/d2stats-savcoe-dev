## Fix Sync Behavior + Map Pressure Parity

### Issues from HAR & Investigation

1. **HAR shows `{"success":true,"processed":0}`**: sync is returning 200 OK but processing 0 matches. Reason: the function fetches the latest 25 matches from OpenDota, but every one already exists in the DB (we have 59 rows), so the dedup check (`if (existing) continue;`) skips them all. New scoring formulas are never re-applied to existing rows.

2. **Old data accumulating**: DB has 59 rows spanning Jan–Apr, but we only want the latest 25.

3. **Map Pressure scale mismatch**: current values are 0.0–~1.5 (avg 0.23). Tier thresholds for pressure/survival are 40/60/80. Multiplying by 100 brings pressure into 0–150 range, achieving parity with the tier system used by Survival.

### Changes

**1. `supabase/functions/sync-matches/index.ts`**
- **Trim old data on every sync**: after processing, delete all matches/stats for this user that are NOT in the latest-25 set (keep only the most-recent 25 by `start_time`).
- **Re-process recent matches**: change the dedup logic. Instead of skipping existing matches entirely, always recompute scores and `upsert` them. This way each sync refreshes scores using current formulas. (Detail fetch from OpenDota is still skipped for existing matches to save API calls — we re-upsert with whatever fields we already have plus newly recomputed scores from stored raw stats.)
  - Simpler approach: for existing matches, re-read their stored raw stats (kills/deaths/etc.) and re-run `computeScores` then update only the score columns. For new matches, do the full fetch + insert.
- **Map Pressure formula**: change denominator from `100 * durationMin` to `durationMin` (i.e. drop the `* 100`), so pressure now sits in roughly 0–150 range, parity with survival/tier scale.
  - New: `mapPressure = (TD + (LH * mode_scalar)) / durationMin`

**2. Backfill existing rows**
- One-time UPDATE: `UPDATE player_match_stats SET map_pressure_score = map_pressure_score * 100;` to scale the 59 existing rows.
- One-time DELETE: trim DB down to latest 25 matches per user, so the user immediately sees the trimmed view (matches the new behavior).

**3. `Dashboard.tsx`**
- Add toast feedback after sync so the user sees "Synced N new matches, recomputed M existing" instead of a silent 200.

### Result

- Every sync refreshes scores with the latest formulas (no stale data).
- DB is auto-trimmed to last 25 matches per user.
- Map Pressure values display in the same 0–100+ range as Survival, so the same tier thresholds (40/60/80 → C/B/A/S) make sense.
- Visible feedback when sync completes.
