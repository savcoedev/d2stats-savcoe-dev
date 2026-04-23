## Match History: Expose Breakdown + Responsive Layout

The previous round added tooltips, dates, gradient rails, shimmer bars, and a count chip. This round addresses the two gaps that remain: tooltips are hover-only (unusable on touch), and the row overflows on small screens.

### 1. Expose Calculation Breakdown (always visible on demand)

The score formula and live numeric breakdown are currently buried inside a hover tooltip on each `ScoreBar`. On touch devices the tooltip never opens, so the calculation is effectively hidden.

Add a persistent "Show calculation" affordance inside the expanded match panel:

- Below the three `ScoreBar` components, render a **"How these scores are calculated"** collapsible section (closed by default, uses `framer-motion` height animation matching the row expand pattern).
- When opened, render a 3-column grid (stacks to 1 column on mobile) showing each metric's:
  - Metric name + colored icon
  - Formula in a monospaced chip
  - Live breakdown table (the same `breakdown` array currently in the tooltip): K, A, D, TD, LH, Duration, Lost Time, final Score
  - Mode-scalar note for Impact (Turbo = 0.65)
- Toggle is a small ghost button: `Calculator` icon + "Show calculation" / "Hide calculation", right-aligned under the bars.
- Keep the existing hover tooltips on `ScoreBar` for desktop quick-glance — they remain useful but are no longer the only way to see the breakdown.

### 2. Responsive Match Layout

The collapsed row currently lays out hero portrait, hero name, role chip, game mode, K/D/A, duration, date, tier badge, and chevron in a single horizontal flex. Below ~640px this wraps awkwardly and the tier badge gets pushed off the visual grid.

Refactor the row into a responsive two-zone grid:

- **Mobile (`<sm`)**:
  - Row 1: accent rail, hero portrait, hero name + role chip, tier badge, chevron (right-aligned)
  - Row 2 (indented under hero): K/D/A · duration · date · game mode — wraps cleanly with `flex-wrap gap-x-3 gap-y-1`
  - Reduce horizontal padding from `px-6` to `px-4` on `<sm`
- **Desktop (`≥sm`)**: keep the current single-row layout but use `min-w-0` + `truncate` on the hero name, and `shrink-0` on the tier badge + chevron so nothing overflows.

Expanded panel:
- Score bars grid stays `sm:grid-cols-3` but gains `gap-4 sm:gap-5` and reduced horizontal padding on mobile (`px-4 sm:px-6`).
- The new calculation breakdown section uses `grid-cols-1 md:grid-cols-3` so it stacks cleanly on phones and tablets in portrait.

Section header:
- Title + count chip stay left; on mobile reduce to `text-sm` and tighten padding (`p-4 sm:p-6`).

### Technical Details

**File changed:** `src/components/dashboard/MatchHistory.tsx`

- Add per-row state `showCalc: boolean` (track inside `expandedId` panel via a separate `calcOpenId` state, or local state per panel).
- Extract a `CalculationBreakdown` subcomponent that takes the same `breakdown`, `formula`, `label`, `color`, `icon`, `note` props the tooltip uses, so the data source is shared with the tooltips (single source of truth).
- Use `Calculator` icon from `lucide-react` for the toggle.
- Apply Tailwind responsive classes (`px-4 sm:px-6`, `flex-col sm:flex-row`, `hidden sm:flex`, `min-w-0`, `truncate`, `shrink-0`) — no new dependencies.
- Animation: `motion.div` with `initial={{ height: 0, opacity: 0 }}` → `animate={{ height: "auto", opacity: 1 }}`, 250ms easeOut, animating only height + opacity to keep 60fps.

**Files NOT changed:** scoring engine, sync function, database schema, ScoreCard, PerformanceChart, TierBadge, tooltip primitive.
