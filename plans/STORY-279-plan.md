# Plan: History Tab in User Stats Page (#279)

## Context

The user stats page (`/tournaments/[id]/stats`) currently has three tabs: Performance Overview, Prediction Accuracy, and Boost Analysis. They are all point-in-time snapshots. Story #272 introduced the `tournament_score_history` table with daily per-user score snapshots, but the user stats page doesn't expose this data yet.

This story adds a fourth **History** tab displaying a stacked area chart of the user's cumulative score growth over the tournament, broken down by the 6 score components.

## Acceptance Criteria

- [ ] Fourth "History" tab on user stats page
- [ ] Stacked area chart with 6 bands (game score, boost bonus, honor roll, individual awards, qualified teams, group position), stacked bottom-to-top
- [ ] X axis: snapshot dates (chronological); Y axis: total cumulative points
- [ ] Chart populated from `tournament_score_history` for the current user
- [ ] Empty state when no history snapshots exist
- [ ] All text internationalized (English + Spanish)
- [ ] Responsive, consistent with other stats tab layout

## Technical Approach

### Data Flow

The stats page is a Server Component that already calls repositories directly (consistent pattern throughout the file). No new Server Action is needed.

**New data fetched in page:**
```ts
const userHistory = await getScoreHistoryForUsers([user.id], tournamentId)
// Returns TournamentScoreHistory[] ordered by snapshot_date ASC
// Each row: snapshot_date, total_game_score, total_boost_bonus, honor_roll_score,
//           individual_awards_score, qualified_teams_score, group_position_score, total_points
```

This is a single-user query — no forward-filling, rank computation, or display name lookup needed.

### Chart: Stacked Area with `@mui/x-charts` v8

Use `@mui/x-charts` v8.27.4 (already in the project). Use `LineChart` from `@mui/x-charts/LineChart` (same import as existing `ScoreHistoryChart.tsx`) with `area: true` and `stack: 'total'` on each series — the MUI X Charts v8 pattern for stacked area charts.

> **Implementation note:** Before writing `ScoreGrowthChart`, verify `area` + `stack` series properties against the installed version's `LineSeries` TypeScript type from `@mui/x-charts`. The properties are standard in v8 but the implementer must confirm the TypeScript signature compiles.

**X-axis date conversion:** `snapshot_date` is a `YYYYMMDD` integer. Convert to milliseconds using `yyyymmddToMs` (duplicate inline from `ScoreHistoryChart.tsx` — small pure function, not worth extracting yet). Pass as `scaleType: 'time'` to the x-axis.

Band order (bottom to top, series index 0–5):
1. `total_game_score` — Game score
2. `total_boost_bonus` — Boost bonus
3. `honor_roll_score` — Honor roll score
4. `individual_awards_score` — Individual awards score
5. `qualified_teams_score` — Qualified teams score
6. `group_position_score` — Group position score

### Component Architecture

Following the same pattern as the other tab cards:

```
TournamentStatsPage (Server Component)
  → fetches userHistory via getScoreHistoryForUsers([user.id], tournamentId)
  → renders <HistoryTabCard rows={userHistory} />
  → passes pre-rendered ReactNode to StatsTabs as historyTab prop

StatsTabs (Client Component)
  → adds 4th tab "History" at index 3
  → renders historyTab in TabPanel index={3}

HistoryTabCard (Client Component)
  → if rows.length === 0: render empty state Typography
  → else: render <ScoreGrowthChart rows={rows} />

ScoreGrowthChart (Client Component)
  → converts snapshot_date integers to ms via yyyymmddToMs
  → renders LineChart with 6 area+stack series, scaleType: 'time' x-axis
```

## Files to Create

| File | Description |
|------|-------------|
| `app/components/tournament-stats/score-growth-chart.tsx` | Stacked area chart — 6 bands, `@mui/x-charts` LineChart |
| `app/components/tournament-stats/history-tab-card.tsx` | Card wrapper with empty state and `ScoreGrowthChart` |

## Files to Modify

| File | Change |
|------|--------|
| `app/[locale]/tournaments/[id]/stats/page.tsx` | Import `getScoreHistoryForUsers`; fetch `userHistory`; pass `historyTab={<HistoryTabCard .../>}` to `StatsTabs` |
| `app/components/tournament-stats/stats-tabs.tsx` | Add required `historyTab` prop; add 4th Tab + TabPanel |
| `locales/en/stats.json` | Add `tabs.history` + `history.*` keys |
| `locales/es/stats.json` | Add Spanish equivalents |
| `__tests__/db/test-factories.ts` | Add `scoreHistory()` factory for `TournamentScoreHistory` mock data |
| `__tests__/components/tournament-stats/stats-tabs.test.tsx` | Add `historyTab` prop to ALL existing test cases (required prop — all 6 tests will fail to compile without it); add 2 new test cases |
| `__tests__/app/[locale]/tournaments/[id]/stats/page.test.tsx` (or equivalent path) | Mock `getScoreHistoryForUsers` from `score-history-repository` (returning `[]` by default) |
| `docs/code-structure/components-tournament-stats.md` | Document new components |
| `docs/code-structure/pages.md` | Update TournamentStatsPage call list |
| `CODE-STRUCTURE.md` | Update call graph flow |

## Visual Prototype

### Tab Addition

```
┌──────────────────────────────────────────────────────────┐
│  Performance │ Accuracy │ Boost Analysis │ History       │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Score Growth                                            │
│  ┌────────────────────────────────────────────────────┐  │
│  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░     │  │
│  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓     │  │
│  │ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒     │  │
│  │ █████████████████████████████████████████████     │  │
│  │ ─────────────────────────────────────────────     │  │
│  │ Jun 10   Jun 17   Jun 24   Jul 01   Jul 08        │  │
│  └────────────────────────────────────────────────┘  │
│  ■ Game Score  ■ Boost Bonus  ■ Honor Roll            │
│  ■ Ind. Awards  ■ Qualified Teams  ■ Grp Position     │
└──────────────────────────────────────────────────────────┘
```

### Empty State

```
┌──────────────────────────────────────────────────────────┐
│  Performance │ Accuracy │ Boost Analysis │ History       │
├──────────────────────────────────────────────────────────┤
│                                                          │
│     No score history yet. History will appear once      │
│     the tournament starts and scores are calculated.    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Responsive Considerations
- Chart height: 260px (matches `ScoreHistoryChart` in leaderboard)
- MUI X Charts legend renders below by default — sufficient for mobile
- `ScrollShadowContainer` already handles overflow on small screens

## Translation Keys

### English (`locales/en/stats.json`) — add inside existing object
```json
"tabs": {
  "performance": "Performance",
  "accuracy": "Accuracy",
  "boosts": "Boost Analysis",
  "history": "History",
  "ariaLabel": "tournament statistics"
},
"history": {
  "title": "Score Growth",
  "emptyState": "No score history yet. History will appear once the tournament starts and scores are calculated.",
  "bands": {
    "gameScore": "Game Score",
    "boostBonus": "Boost Bonus",
    "honorRoll": "Honor Roll",
    "individualAwards": "Individual Awards",
    "qualifiedTeams": "Qualified Teams",
    "groupPosition": "Group Position"
  }
}
```

### Spanish (`locales/es/stats.json`) — add inside existing object
```json
"tabs": {
  "history": "Historial"
},
"history": {
  "title": "Crecimiento de Puntos",
  "emptyState": "Sin historial de puntos aún. El historial aparecerá cuando el torneo comience y se calculen los puntos.",
  "bands": {
    "gameScore": "Puntos por Partidos",
    "boostBonus": "Bonus Boost",
    "honorRoll": "Honor Roll",
    "individualAwards": "Premios Individuales",
    "qualifiedTeams": "Equipos Clasificados",
    "groupPosition": "Posición de Grupo"
  }
}
```

## Mid-Level Design

### Call Graph Changes

**Modified flows:**
- **Flow (User stats page)** — extend `TournamentStatsPage` to also call `getScoreHistoryForUsers` and pass `<HistoryTabCard>` to `StatsTabs` as new required `historyTab` prop; `StatsTabs` renders 4th Tab + `TabPanel` → `HistoryTabCard` → `ScoreGrowthChart` (when non-empty)

**New flows:** none

---

### `app/components/tournament-stats/score-growth-chart.tsx` *(new)*

```ts
// Local utility (duplicated from ScoreHistoryChart.tsx — inline, not extracted)
function yyyymmddToMs(d: number): number

// Props
interface ScoreGrowthChartProps {
  rows: TournamentScoreHistory[]  // from tables-definition; ordered by snapshot_date ASC
}
```

- **ScoreGrowthChart({ rows }: ScoreGrowthChartProps)**: `JSX.Element`
  Client component (`'use client'`). Converts each `TournamentScoreHistory` row's `snapshot_date` to milliseconds via `yyyymmddToMs`. Builds 6 series arrays (one value per date per band), each with `area: true, stack: 'total'`. Renders `LineChart` with `xAxis: [{ data: dateMs[], scaleType: 'time', valueFormatter: DD MMM }]`. Renders chart title from `t('history.title')`.
  Calls: `useTranslations('stats')`, `LineChart` from `@mui/x-charts/LineChart`
  Tests:
  - renders chart title (`t('history.title')`)
  - renders without crashing when given a single-row history array
  - correctly derives 6 series from row data (verify via mocked LineChart receiving `series` prop of length 6)
  - x-axis dates are sorted in ascending order (match input order since repository returns ASC)

---

### `app/components/tournament-stats/history-tab-card.tsx` *(new)*

```ts
interface HistoryTabCardProps {
  rows: TournamentScoreHistory[]
}
```

- **HistoryTabCard({ rows }: HistoryTabCardProps)**: `JSX.Element`
  Client component (`'use client'`). Renders a `Typography` empty state paragraph when `rows.length === 0`, otherwise renders `<ScoreGrowthChart rows={rows} />`. Translation namespace: `'stats'`.
  Calls: `useTranslations('stats')`, `ScoreGrowthChart`
  Tests:
  - renders empty state text matching `t('history.emptyState')` when rows is `[]`
  - does not render empty state text when rows has data
  - renders `ScoreGrowthChart` (via data-testid or mock) when rows has data

---

### `app/components/tournament-stats/stats-tabs.tsx` *(modified)*

```ts
// Updated Props type
type Props = {
  readonly performanceTab: React.ReactNode
  readonly precisionTab: React.ReactNode
  readonly boostsTab: React.ReactNode
  readonly historyTab: React.ReactNode   // NEW — required
}
```

- **StatsTabs({ performanceTab, precisionTab, boostsTab, historyTab })**: `JSX.Element` *(was: no historyTab)*
  Adds `<Tab label={t('tabs.history')} {...a11yProps(3)} />` at index 3 and a corresponding `<TabPanel value={value} index={3}>{historyTab}</TabPanel>`.
  Tests (updates to existing test file):
  - **All 6 existing test cases** must have `historyTab={<div>History</div>}` added to `StatsTabs` props (required prop — tests fail to compile without it)
  - New: renders "historial" (es) tab label
  - New: renders historyTab content when History tab is clicked (index 3)

---

### `app/[locale]/tournaments/[id]/stats/page.tsx` *(modified)*

No new TypeScript signature — page is a default export async function (unchanged signature). Changes:
- Add import: `import { getScoreHistoryForUsers } from '../../../../db/score-history-repository'`
- Add import: `import { HistoryTabCard } from '../../../../components/tournament-stats/history-tab-card'`
- Add data fetch: `const userHistory = await getScoreHistoryForUsers([user.id], tournamentId)`
- Pass prop: `historyTab={<HistoryTabCard rows={userHistory} />}` to `StatsTabs`

---

### `__tests__/db/test-factories.ts` *(modified)*

Add factory:
```ts
scoreHistory(overrides?: Partial<TournamentScoreHistory>): TournamentScoreHistory
// Returns a full TournamentScoreHistory row (Selectable type — all fields required):
// id: 'history-1'
// user_id: 'user-1'
// tournament_id: 'tournament-1'
// snapshot_date: 20260601
// total_game_score: 0
// total_boost_bonus: 0
// honor_roll_score: 0
// individual_awards_score: 0
// qualified_teams_score: 0
// group_position_score: 0
// total_points: 0   ← Generated<number> resolves to number in Selectable<>
// created_at: new Date()  ← Generated<Date> resolves to Date in Selectable<>
```
Tests: no dedicated test needed — factory is used in component tests.

## Implementation Steps

0. **Run `npm install`** in the worktree — `@mui/x-charts` is declared in `package.json` but must be installed before writing any chart code. Run `npm install` in `/Users/gvinokur/Personal/qatar-prode-story-279` before step 3.
1. **Add `scoreHistory` factory** to `__tests__/db/test-factories.ts`
2. **Add translations** — extend `stats.json` (en + es) with `tabs.history` and `history.*` keys
3. **Create `ScoreGrowthChart`** — stacked area chart using `@mui/x-charts` `LineChart`, 6 series with `area: true, stack: 'total'`, `scaleType: 'time'` x-axis
4. **Create `HistoryTabCard`** — empty state + chart wrapper
5. **Update `StatsTabs`** — add `historyTab` required prop + 4th tab/panel
6. **Update stats page** — fetch `userHistory`, render `HistoryTabCard`, pass to `StatsTabs`
7. **Write tests**:
   - Create `history-tab-card.test.tsx`
   - Create `score-growth-chart.test.tsx` (mock `@mui/x-charts/LineChart`)
   - Update `stats-tabs.test.tsx` — add `historyTab` prop to all 6 existing cases + 2 new cases
   - Update stats page test — mock `getScoreHistoryForUsers` returning `[]`
8. **Update CODE-STRUCTURE.md** — components layer + pages layer + call graph

## Testing Strategy

### New test files

**`__tests__/components/tournament-stats/history-tab-card.test.tsx`**
- Empty state renders when rows is `[]` — text matches `history.emptyState` key
- Does not show empty state text when rows has data
- Renders ScoreGrowthChart when rows has data (mock ScoreGrowthChart with `data-testid`)

**`__tests__/components/tournament-stats/score-growth-chart.test.tsx`**
Mock pattern (same as other chart tests): `vi.mock('@mui/x-charts/LineChart', () => ({ LineChart: (props) => <div data-testid="line-chart" data-series-count={props.series.length} /> }))`
- Renders chart title from `t('history.title')`
- Single-row input: chart renders without crashing
- 6 series are passed to `LineChart` (check `data-series-count="6"`)
- All 6 series have `area: true` and `stack: 'total'` (inspect `series` prop)

### Updated test files

**`__tests__/components/tournament-stats/stats-tabs.test.tsx`**
- Add `historyTab={<div data-testid="history-content">History Content</div>}` to all 6 existing test cases
- Add: renders "historial" tab label (Spanish locale)
- Add: clicking History tab shows historyTab content and hides others

**Stats page test** (find actual file path before implementing)
- Add `vi.mock('.../score-history-repository', () => ({ getScoreHistoryForUsers: vi.fn().mockResolvedValue([]) }))` to prevent test failures from the new import

### Test Utilities
- Use `renderWithTheme()` from `@/__tests__/utils/test-utils`
- Use `testFactories.scoreHistory()` (added in step 1 above)
- Mock `next-intl` via existing mock utilities

## Validation Considerations

- **SonarCloud**: 80% coverage on new components required → cover both empty and populated states for `HistoryTabCard`; mock `LineChart` for `ScoreGrowthChart` tests
- **0 new issues**: no unused imports, no `any` types, strict TypeScript
- **i18n**: `'stats'` namespace is already registered — only new keys needed
- **No migrations needed**: reads from existing `tournament_score_history` table

## CODE-STRUCTURE Files to Update

- `docs/code-structure/components-tournament-stats.md` — add `ScoreGrowthChart` and `HistoryTabCard` entries
- `docs/code-structure/pages.md` — update `TournamentStatsPage` to include `getScoreHistoryForUsers` + `HistoryTabCard` in call list
- `CODE-STRUCTURE.md` call graph — update flow to include `HistoryTabCard → ScoreGrowthChart` branch under user stats page

## Open Questions

None — requirements are clear and all infrastructure already exists.

---

## Amendments

### Amendment 1 — Card wrapper + reduced left margin on history charts (post-preview feedback)

**Trigger:** User visual feedback after Vercel Preview testing.

**Changes made:**

1. **`HistoryTabCard`** — wrapped `ScoreGrowthChart` in `Card variant="outlined"` + `CardContent`, matching the card pattern used by `HistoryTab.tsx` in the leaderboard. Empty state path unchanged.

2. **`ScoreGrowthChart`** — reduced `margin.left` from 40 to 10 in the `LineChart` so the chart area starts close to the left edge.

3. **`ScoreHistoryChart`** and **`RankHistoryChart`** (leaderboard) — same `margin.left` reduction (40 → 10). User noticed both charts shared the same visual issue.
