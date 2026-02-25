

## Limit to Last 25 Games + Add Game Dates to Chart

### Changes

**1. Backend: `sync-matches` Edge Function**
- Change OpenDota API fetch from `limit=50` to `limit=25`
- This limits data capture to only the last 25 matches

**2. Frontend: `Dashboard.tsx`**
- Change the query `.limit(50)` to `.limit(25)` for fetching stats
- Change `stats.slice(0, 20)` to use all 25 stats (no slicing needed)
- Include the `start_time` field in chart data so the X-axis shows game dates instead of match numbers

**3. Frontend: `PerformanceChart.tsx`**
- Update the `ChartDataPoint` interface to include a `date` string field (formatted date like "Feb 20")
- Change the XAxis `dataKey` from `"match"` to `"date"` so game dates appear on the X-axis
- Add angle/formatting to date tick labels so they don't overlap

### Technical Details

**sync-matches/index.ts** (line 107):
- `limit=50` becomes `limit=25`

**Dashboard.tsx**:
- Line 56: `.limit(50)` becomes `.limit(25)`
- Lines 110-115: Chart data construction adds a `date` field using `format(new Date(m.start_time), "MMM d")` from `date-fns`, and removes the now-unnecessary `match` field

**PerformanceChart.tsx**:
- Interface gains `date: string` field
- XAxis switches to `dataKey="date"` with angled labels (`angle={-45}`, `textAnchor="end"`) and increased bottom margin for readability
- Tooltip `labelFormatter` shows the date string

