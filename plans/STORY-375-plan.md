# Story 375 — User Stats at a Glance Widget

## Context

Players on the Tournament Hub can see individual game results and leaderboard rank, but there is no holistic view of their own score performance. This widget surfaces total score, category-level breakdowns (Matches / Qualified Teams / Awards), deltas since the last daily snapshot, a sparkline trend, and a link to the full stats page — all in a compact DashboardCard format.

Score history data already exists in `tournament_score_history` (written by the scoring cron). This story adds a new server action to aggregate it and a new Server Component to render it on the hub grid.

---

## Acceptance Criteria

- A "Stats at a Glance" DashboardCard appears on the Tournament Hub after the tournament starts (only for logged-in users).
- Shows current total score prominently.
- Shows momentum indicator: points delta since the last snapshot (e.g. "Since yesterday, Apr 22").
- Three category rows with delta and total: Matches (SportsSoccerIcon), Qualified Teams (CheckCircleOutlineIcon), Awards (EmojiEventsIcon).
- Compact sparkline for last 7 snapshots.
- "See all statistics" button → `/[locale]/tournaments/[id]/stats`.
- Empty state when no score history exists (no redundant "Go to Predictions" CTA).
- Fully localized in English and Argentine Spanish.

---

## Data Model

`tournament_score_history` fields used:
- `total_game_score` + `total_boost_bonus` → **Matches** category
- `qualified_teams_score` + `group_position_score` → **Qualified Teams** category
- `honor_roll_score` + `individual_awards_score` → **Awards** category
- `total_points` (GENERATED ALWAYS) → **Total**

Three categories sum to `total_points`. ✓

---

## Technical Approach

### New server action: `getStatsAtAGlanceData`

Added to `app/actions/hub-actions.ts`.

Fetches `getScoreHistoryForUsers([userId], tournamentId)` (already exported from score-history-repository). Returns a `StatsAtAGlanceData` object:

```typescript
export interface StatsAtAGlanceData {
  hasData: boolean
  totalPoints: number
  matchesPoints: number        // total_game_score + total_boost_bonus
  qualifiedTeamsPoints: number // qualified_teams_score + group_position_score
  awardsPoints: number         // honor_roll_score + individual_awards_score
  momentumPoints: number       // totalPoints delta since prev snapshot (0 if only 1 row)
  matchesDelta: number
  qualifiedTeamsDelta: number
  awardsDelta: number
  snapshotDateLabel: string | null  // formatted date of prev snapshot
  isYesterday: boolean              // true when prev snapshot was yesterday (Argentina TZ)
  sparklineData: number[]           // last 7 total_points values, oldest first
}
```

Logic:
1. `getLoggedInUser()` — throw Unauthorized if null.
2. `getScoreHistoryForUsers([user.id], tournamentId)` — ordered by date asc.
3. If empty → return `{ hasData: false, ... zeros }`.
4. Latest snapshot = last row. Previous snapshot = second-to-last (if exists).
5. Deltas = latest - previous (or 0 when only one snapshot).
6. `sparklineData` = last 7 rows' `total_points` values.
7. `snapshotDateLabel` = formatted date of previous snapshot (Intl.DateTimeFormat locale, month short + day).
8. `isYesterday` = compare `prevSnapshot.snapshot_date` to yesterday's YYYYMMDD in Argentina TZ.

### New component: `StatsAtAGlanceWidget`

`app/components/tournament-hub/stats-at-a-glance-widget.tsx` — Async Server Component.

Fetches `getStatsAtAGlanceData` and `getTranslations('hub.statsAtAGlance')` in parallel.

Structure:
```
DashboardCard(title=t('title'), icon=InsightsIcon)
├── hasData=false → EmptyState
│     InsightsIcon (large, disabled) + "No points yet" + subtitle
└── hasData=true → PopulatedState
      ├── Stack row: Typography h3 total + "pts" + momentum chip (ArrowDropUpIcon + delta)
      ├── Typography caption: "Since yesterday (Apr 22)" or "Since {date}"
      ├── Divider
      ├── 3 category rows (SportsSoccer / CheckCircle / EmojiEvents + delta + total)
      ├── Sparkline (inline SVG, 120×40, primary color)
      └── Button text fullWidth → statsHref ("See all statistics")
```

**Sparkline**: Inline helper component (server-renderable, pure SVG calculation). Fixed 120×40 px dimensions. Uses `stroke="currentColor"` with `color: 'primary.main'` on wrapper Box.

**Momentum indicator**: Only rendered when `momentumPoints > 0`. Color: `success.main`. Icon: `ArrowDropUpIcon`. If delta = 0 or negative: omit momentum row (no negative deltas shown in this widget — out of scope).

### Page integration

`app/[locale]/tournaments/[id]/page.tsx` — add widget to the grid:

```tsx
{timing?.tournamentHasStarted && user && (
  <Suspense fallback={<DashboardCard title={t('statsAtAGlance.title')} icon={<InsightsIcon fontSize="small" />} />}>
    <StatsAtAGlanceWidget tournamentId={id} locale={locale} />
  </Suspense>
)}
```

The page needs `getTranslations('hub.statsAtAGlance')` for the Suspense fallback title. Alternatively the fallback can be a simple untranslated string like `"Stats"`.

### Translations

Add `statsAtAGlance` to `locales/en/hub.json` and `locales/es/hub.json`:

**English:**
```json
"statsAtAGlance": {
  "title": "Stats at a Glance",
  "noData": "No points yet",
  "noDataSubtitle": "Start predicting to see your stats!",
  "matchesLabel": "Matches",
  "qualifiedTeamsLabel": "Qualified Teams",
  "awardsLabel": "Awards",
  "trendLabel": "Trend",
  "sinceYesterday": "Since yesterday ({date})",
  "since": "Since {date}",
  "seeAllStats": "See all statistics"
}
```

**Spanish:**
```json
"statsAtAGlance": {
  "title": "Estadísticas",
  "noData": "Aún no tenés puntos",
  "noDataSubtitle": "¡Empezá a predecir para ver tus estadísticas!",
  "matchesLabel": "Partidos",
  "qualifiedTeamsLabel": "Clasificados",
  "awardsLabel": "Premios",
  "trendLabel": "Tendencia",
  "sinceYesterday": "Desde ayer ({date})",
  "since": "Desde {date}",
  "seeAllStats": "Ver estadísticas completas"
}
```

---

## Files to Create / Modify

### Create
1. `app/components/tournament-hub/stats-at-a-glance-widget.tsx` — new Async Server Component
2. `app/components/tournament-hub/__tests__/stats-at-a-glance-widget.test.tsx` — component tests

### Modify
3. `app/actions/hub-actions.ts` — add `StatsAtAGlanceData` interface + `getStatsAtAGlanceData()`
4. `app/[locale]/tournaments/[id]/page.tsx` — add widget to grid (with Suspense)
5. `locales/en/hub.json` — add `statsAtAGlance` section
6. `locales/es/hub.json` — add `statsAtAGlance` section

### CODE-STRUCTURE updates (same commit as source changes)
7. `docs/code-structure/actions.md` — add `getStatsAtAGlanceData` entry under hub-actions.ts
8. `docs/code-structure/components/components-tournament-hub.md` — add `StatsAtAGlanceWidget` entry
9. `CODE-STRUCTURE.md` — add new flow to Call Graph (Flow 34: StatsAtAGlance)

---

## Mid-Level Design

### Call Graph Changes

**New flow:**
- **Flow 34 (Stats at a Glance)**: `TournamentHubPage` → (Suspense) `StatsAtAGlanceWidget` → `getStatsAtAGlanceData` → `getScoreHistoryForUsers`

### `app/actions/hub-actions.ts` *(modified)*

**New interface:**
```typescript
export interface StatsAtAGlanceData {
  hasData: boolean
  totalPoints: number
  matchesPoints: number
  qualifiedTeamsPoints: number
  awardsPoints: number
  momentumPoints: number
  matchesDelta: number
  qualifiedTeamsDelta: number
  awardsDelta: number
  snapshotDateLabel: string | null
  isYesterday: boolean
  sparklineData: number[]
}
```

**New function:**

- **getStatsAtAGlanceData(tournamentId: string, locale: Locale)**: `Promise<StatsAtAGlanceData>`
  Fetches score history for the logged-in user. Returns `hasData=false` when no snapshots exist. Computes per-category totals and deltas from the latest two snapshots. Returns the last 7 snapshots as sparkline data. Formats the previous snapshot date using `Intl.DateTimeFormat` with the given locale.
  Calls: getLoggedInUser, getScoreHistoryForUsers
  Tests (use `testFactories.user()` and `testFactories.tournamentScoreHistory()` for mock data):
  - throws Unauthorized when user is not logged in
  - returns hasData=false with all zeros when no snapshots exist
  - returns correct category totals from the latest snapshot when one snapshot exists
  - returns delta=0 and isYesterday=false when only one snapshot exists
  - returns correct deltas computed from latest minus previous snapshot
  - sets isYesterday=true when previous snapshot was written yesterday (Argentina TZ)
  - sparklineData contains at most 7 entries from the most recent snapshots
  - sparklineData preserves chronological order (oldest to newest)

### `app/components/tournament-hub/stats-at-a-glance-widget.tsx` *(new)*

- **StatsAtAGlanceWidget({ tournamentId, locale })**: `Promise<JSX.Element>` — [Server] Async component. Fetches `getStatsAtAGlanceData` and `getTranslations('hub.statsAtAGlance')` in parallel. Computes `statsHref = /${locale}/tournaments/${tournamentId}/stats`. Wraps content in `DashboardCard(title=t('title'), icon=InsightsIcon)`. When `!data.hasData`: renders empty state (centered `InsightsIcon` 48px disabled + `t('noData')` body2 + `t('noDataSubtitle')` caption). When `data.hasData`: renders total score row (h3 + "pts" + momentum chip when momentumPoints > 0), snapshot date caption, Divider, 3 category rows, Sparkline, "See all statistics" Button.
  Calls: getStatsAtAGlanceData, getTranslations
  Renders: DashboardCard, Sparkline (inline helper)
  Tests:
  - renders card title from translation key
  - renders empty state when hasData=false (InsightsIcon + noData text)
  - renders total points as h3 when hasData=true
  - renders momentum chip when momentumPoints > 0
  - does NOT render momentum chip when momentumPoints is 0
  - renders all three category rows (Matches, Qualified Teams, Awards)
  - renders sparkline SVG path when sparklineData has entries
  - renders "See all statistics" link pointing to statsHref

- **Sparkline({ data: number[] })**: `JSX.Element` — [inline helper, not exported] Pure SVG component. Computes min/max range, maps values to 120×40 coordinate space, renders an SVG `<path>` with `stroke="currentColor"` and `strokeWidth=2`. Wrapped in `Box sx={{ color: 'primary.main' }}`.

---

## Visual Prototype

```
┌──────────────────────────────────────┐
│ [◉] Estadísticas / Stats at a Glance │
├──────────────────────────────────────┤
│                                       │
│  128    pts        ▲ 12 pts           │
│  Desde ayer (22 de abr)               │
│                                       │
│ ─────────────────────────────────     │
│  ⚽ Partidos       +7     84 pts      │
│  ✓ Clasificados   +3     30 pts      │
│  🏆 Premios        +2     14 pts      │
│                                       │
│  TENDENCIA                            │
│  〰〰〰〰〰〰〰〰    +40%           │
│                    últimos 5 días     │
│                                       │
│  [ Ver estadísticas completas ]       │
└──────────────────────────────────────┘

Empty state:
┌──────────────────────────────────────┐
│ [◉] Estadísticas                     │
├──────────────────────────────────────┤
│                                       │
│         [insights icon large]         │
│         Aún no tenés puntos           │
│    ¡Empezá a predecir para ver        │
│          tus estadísticas!            │
│                                       │
└──────────────────────────────────────┘
```

---

## Implementation Waves

### Wave 1 — Data layer + translations
- Add `StatsAtAGlanceData` interface + `getStatsAtAGlanceData()` to `hub-actions.ts`
- Add translation keys to `locales/en/hub.json` and `locales/es/hub.json`
- Update `docs/code-structure/actions.md`

### Wave 2 — Component
- Create `stats-at-a-glance-widget.tsx`
- Create `__tests__/stats-at-a-glance-widget.test.tsx`
- Update `docs/code-structure/components/components-tournament-hub.md`

### Wave 3 — Page integration + call graph
- Update `app/[locale]/tournaments/[id]/page.tsx`
- Update `CODE-STRUCTURE.md` call graph

---

## Testing Strategy

**Server action unit tests** (`app/actions/__tests__/hub-actions.test.ts` or new file):
- Mock `getLoggedInUser` and `getScoreHistoryForUsers`
- Minimum 8 cases covering: no user, no history, single snapshot, multi-snapshot deltas, yesterday detection, sparkline slice

**Component tests** (`__tests__/stats-at-a-glance-widget.test.tsx`):
- Use `renderWithTheme` + mock `getStatsAtAGlanceData`
- Minimum 8 cases covering: card title, empty state, populated state, momentum, category rows, sparkline, link

Coverage gate: ≥80% on new code.

---

## Validation (SonarCloud / Quality Gates)

- 0 new issues (any severity)
- ≥80% coverage on new code
- No duplication — reuse `DashboardCard`, `getScoreHistoryForUsers`, `getLoggedInUser` patterns from existing hub widgets
- Security: server action uses `getLoggedInUser()` auth check ✓
