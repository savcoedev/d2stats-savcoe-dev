## Tooltips, Match Dates & High-Fidelity Polish

### 1. Formula Tooltips on Score Bars (per match)

In `MatchHistory.tsx`, wrap each `ScoreBar` (Map Pressure, Impact, Survival) inside the expanded match panel with a Radix `Tooltip` that explains the formula using **the actual numbers from that match**.

Tooltip content per metric (uses `kills/deaths/assists`, `duration`, plus the stored score):

- **Impact Score**
  - Formula: `max(0, (K × 2.5) + (A × 1.5) + (TD ÷ 500) − (D × 2.0)) × mode_scalar`
  - Live values: `K=${kills}, A=${assists}, D=${deaths}` and the resulting score
  - Note: Turbo applies a 0.65 scalar
- **Map Pressure**
  - Formula: `(TD + LH × mode_scalar) ÷ duration_minutes`
  - Live values: duration in minutes, resulting score
- **Survival Consistency**
  - Formula: `((duration_sec − D × 35) ÷ duration_sec) × 100`
  - Live values: duration, deaths, resulting %

Tooltips trigger on hover **and** focus (keyboard accessible), use the existing `glass-card` styling with a subtle border-glow, and render via a single `TooltipProvider` wrapping the match list.

### 2. Match Date in Match Row

The collapsed match row currently shows hero name, role, K/D/A, and duration but **no date**. Add a right-aligned date next to the duration:

- Format: `MMM d` for matches in the last year (e.g., "Apr 18"), `MMM d, yyyy` otherwise
- Source: `match.start_time`
- Style: `text-xs text-muted-foreground` with a small `Calendar` icon from `lucide-react`
- Place inline with the K/D/A · duration metadata row

### 3. High-Fidelity Visual Elements

Subtle upgrades focused on the match list and expanded panel — no architectural changes:

- **Win/loss accent rail**: replace the flat 1px bar with a vertical gradient (win: emerald → cyan; loss: rose → orange) plus a soft outer glow when the row is expanded.
- **Hero portrait**: add a 1px ring matching the win/loss color, slight rounded-lg, and a hover scale (`scale-105`) with `transition-transform`.
- **Row hover**: layer a faint radial gradient highlight (top-left primary glow) on hover instead of the flat `bg-secondary/30`.
- **Expanded panel**: add a top inner-shadow divider, increase padding, and give each `ScoreBar` track a subtle inset shadow + an animated shimmer on the filled portion (CSS gradient sweep, 2.4s loop, low opacity).
- **Score bar end-caps**: add a small glowing dot at the end of each filled bar in the metric color.
- **Tier badge in expanded view**: add the existing `glow` already present; bump to `md` size for clarity.
- **Section header**: give the "Match History" header a small accent underline (`text-gradient` rule already exists) and a count chip showing total matches synced.
- **Card chrome**: apply `glow-border` to the MatchHistory card for a premium framed look.

### Files Changed

- `src/components/dashboard/MatchHistory.tsx` — add tooltips, match date, visual upgrades, count chip, gradient accents, shimmer bars
- `src/App.tsx` (or wherever providers live) — confirm a single `TooltipProvider` is mounted; add one inside MatchHistory if not

### Files NOT Changed

- Scoring engine, sync function, database schema, ScoreCard, PerformanceChart — out of scope for this request.
