# Story 365 Plan: Tournament Hub Results Widget

## Story Context

**Issue:** #365 — [Story 8] Tournament Hub Results Widget
**Epic:** #353 — Tournament Hub: Responsive Dashboard Refactor
**Status:** Todo

## Objective

Migrate the existing `RecentResultsWidget` into the standardized `DashboardCard` container and wire it into the tournament hub page grid, replacing the current placeholder. All prediction content (games, qualified teams, awards, empty state, "See Stats" button) is preserved — only the outer layout shell changes.

## Acceptance Criteria

- [ ] Results widget rendered inside `DashboardCard` with HistoryIcon
- [ ] Recent game results list with teams, score, correct/incorrect indicators, and points (+X pts)
- [ ] Qualified teams and tournament awards sections shown when data present
- [ ] "See Stats" secondary action button at the bottom
- [ ] Empty state handled gracefully (no games, QT, or awards data)
- [ ] Full localization EN + ES (keys already exist in `hub.recentResults.*`)
- [ ] Hub page wires up `TournamentHubRecentResults` replacing the placeholder

## Out of Scope

- No changes to `getRecentResultsData` or any DB/action logic
- No changes to the full Results page

## Technical Approach

### What Exists (no changes needed)

| File | Status |
|------|--------|
| `app/components/tournament-hub/dashboard-card.tsx` | Ready — reusable card shell |
| `app/components/tournament-hub/recent-results-widget.tsx` | Modify — remove Paper/title wrapper |
| `app/components/tournament-hub/tournament-hub-recent-results.tsx` | Modify — add DashboardCard + i18n |
| `app/[locale]/tournaments/[id]/page.tsx` | Modify — replace placeholder widget |
| `locales/en/hub.json` + `locales/es/hub.json` | Ready — all keys present |
| `app/actions/hub-actions.ts` | No change |

### Changes

**1. `recent-results-widget.tsx`**

Remove the outer `Box` (title heading) and `Paper` wrapper. The widget currently renders:
```
<Box>
  <Box sx={{ mb: 1, textAlign: 'center' }}><Typography>title</Typography></Box>
  <Paper sx={{ p: 2 }}>
    {content sections}
  </Paper>
  <Box sx={{ mt: 1.5, textAlign: 'center' }}><Button>See Stats</Button></Box>
</Box>
```

After refactoring (children of DashboardCard's `CardContent`):
```
<>
  {isEmpty ? <EmptyState /> : <ContentSections />}
  <Box sx={{ mt: 'auto', pt: 1.5, textAlign: 'center' }}>
    <Button>See Stats</Button>
  </Box>
</>
```

The `mt: 'auto'` pushes the button to the bottom of the flex column (DashboardCard's CardContent uses `flexDirection: column, flexGrow: 1`).

**2. `tournament-hub-recent-results.tsx`**

Wrap `RecentResultsWidget` in `DashboardCard`. Add `getTranslations` to get the title from `hub.recentResults.title`:

```tsx
import HistoryIcon from '@mui/icons-material/History'
import { getTranslations } from 'next-intl/server'
import { DashboardCard } from './dashboard-card'

export async function TournamentHubRecentResults({ tournamentId, locale }) {
  const [data, t] = await Promise.all([
    getRecentResultsData(tournamentId, locale),
    getTranslations({ locale, namespace: 'hub.recentResults' }),
  ])
  const base = `/${locale}/tournaments/${tournamentId}`

  return (
    <DashboardCard title={t('title')} icon={<HistoryIcon fontSize="small" />}>
      <RecentResultsWidget
        data={data}
        statsHref={`${base}/stats`}
        resultsHref={`${base}/results`}
        qualifiedTeamsHref={`${base}/qualified-teams`}
        awardsHref={`${base}/awards`}
      />
    </DashboardCard>
  )
}
```

**3. `app/[locale]/tournaments/[id]/page.tsx`**

Replace the placeholder Results `DashboardCard` with `TournamentHubRecentResults`, but **only render it when `timing.tournamentHasStarted === true`**. When the tournament hasn't started, the grid omits the widget entirely.

`timing` is already fetched at the top of `TournamentHubPage` via `getPublicTournamentTiming` — no new data fetching needed.

```tsx
import { Suspense } from 'react'
import { TournamentHubRecentResults } from '@/app/components/tournament-hub/tournament-hub-recent-results'

// In the grid:
{timing.tournamentHasStarted && (
  <Suspense fallback={<DashboardCard title="..." icon={<HistoryIcon />} />}>
    <TournamentHubRecentResults tournamentId={id} locale={locale} />
  </Suspense>
)}

## Visual Prototype

### Results Widget — With Data

```
┌────────────────────────────────────────────┐
│ [◉] Latest Results                         │
├────────────────────────────────────────────┤
│ RECENT GAMES                               │
│ ✓ France 2–1 Germany          +8 pts  [⚡] │
│   Exact result                             │
│ ─────────────────────────────────────────  │
│ ✗ Spain 1–0 Italy              0 pts       │
│   Your guess: 2–1                          │
│                                            │
│ QUALIFIED TEAMS                            │
│ ✓ Qualified Teams             +12 pts      │
│   You got 8 of 16 teams right              │
│                                            │
│ TOURNAMENT AWARDS                          │
│ ✓ Individual Awards            +4 pts      │
│   Correct: Top Goalscorer                  │
│ ─ Final Standings               0 pts      │
│   No correct predictions                   │
│                                            │
│           [View full statistics]           │
└────────────────────────────────────────────┘
```

### Results Widget — Empty State

```
┌────────────────────────────────────────────┐
│ [◉] Latest Results                         │
├────────────────────────────────────────────┤
│                                            │
│              🏆                            │
│        No recent results yet.              │
│   Your prediction outcomes will appear     │
│              here!                         │
│                                            │
│           [View full statistics]           │
└────────────────────────────────────────────┘
```

### Component References

- `DashboardCard` — `app/components/tournament-hub/dashboard-card.tsx` (CardHeader avatar, title, CardContent flex column)
- `HistoryIcon` — from `@mui/icons-material/History` (already imported in page.tsx)
- `CheckCircleOutlineIcon` / `CancelOutlinedIcon` — existing, no change
- `BoostBadge` — existing, no change

## Mid-Level Design

### Call Graph Changes

No new cross-layer flows. `TournamentHubRecentResults` already calls `getRecentResultsData` (Flow exists). Only change: DashboardCard now wraps the output.

### `app/components/tournament-hub/recent-results-widget.tsx` *(modified)*

**Changed functions:**

- **RecentResultsWidget(props: RecentResultsWidgetProps)**: `JSX.Element`
  Remove outer title Box and Paper wrapper. Render content sections directly (isEmpty branch: empty state; populated branch: games/QT/awards sections). Add `mt: 'auto'` to the "See Stats" button container so it anchors to the bottom of DashboardCard's flex column. No prop signature change.
  Tests:
  - renders empty state icon and text when all data arrays are empty and counts are zero
  - renders game list items when recentGames is non-empty
  - renders qualified teams section only when qualifiedTeamsActualCount > 0
  - renders awards section only when individualAwardsScore or honorRollScore is non-null
  - does NOT render a Paper element (DashboardCard provides the card shell now)
  - renders "See Stats" button linking to statsHref

### `app/components/tournament-hub/tournament-hub-recent-results.tsx` *(modified)*

**Changed functions:**

- **TournamentHubRecentResults(props: TournamentHubRecentResultsProps)**: `Promise<JSX.Element>`
  Add `getTranslations` call (from `next-intl/server` — npm, not a project function) for `hub.recentResults` namespace. Wrap `RecentResultsWidget` inside `DashboardCard` with `HistoryIcon` and `t('title')`. Fetch translations and data in parallel.
  Calls: getRecentResultsData, DashboardCard, RecentResultsWidget
  Tests:
  - renders a DashboardCard (identified by hub.recentResults.title text)
  - passes data from getRecentResultsData to RecentResultsWidget
  - passes correct statsHref, resultsHref, qualifiedTeamsHref, awardsHref to RecentResultsWidget
  - re-throws when getRecentResultsData rejects (error boundary handles at page level)

### `app/[locale]/tournaments/[id]/page.tsx` *(modified)*

**Changed functions:**

- **TournamentHubPage(props: Props)**: `Promise<JSX.Element>`
  Replace the placeholder `<DashboardCard title="Results" ...>Lorem ipsum</DashboardCard>` with a conditional: `{timing.tournamentHasStarted && <Suspense><TournamentHubRecentResults /></Suspense>}`. Widget is hidden entirely before tournament start. Remove unused `HistoryIcon` import if it moves into tournament-hub-recent-results.
  Calls: getLoggedInUser, getPublicTournamentTiming, getActionCenterGames, TournamentHubRecentResults
  Tests: (page-level, not unit-tested)

## Files to Create / Modify

| Action | File |
|--------|------|
| Modify | `app/components/tournament-hub/recent-results-widget.tsx` |
| Modify | `app/components/tournament-hub/tournament-hub-recent-results.tsx` |
| Modify | `app/[locale]/tournaments/[id]/page.tsx` |
| Update tests | `app/components/tournament-hub/__tests__/recent-results-widget.test.tsx` |
| Update tests | `app/components/tournament-hub/__tests__/tournament-hub-recent-results.test.tsx` |
| Update docs | `docs/code-structure/components/components-tournament-hub.md` |

## Testing Strategy

### Unit Tests — `recent-results-widget.test.tsx`

Update existing tests to remove assertions on `Paper` / title `Typography`. Existing behavioral tests (game items, QT section, awards section, empty state, "See Stats" button) remain valid. Add:
- A test asserting no `Paper` element is present in the rendered output
- A test for the edge case where `recentGames` is empty but `qualifiedTeamsActualCount > 0` (empty state must NOT appear)

Mock pattern: follow existing test file conventions — `makeRecentGameItem()` helper for game items, inline object literals for `RecentResultsData`.

### Unit Tests — `tournament-hub-recent-results.test.tsx`

Update existing mock setup if needed (mock `getRecentResultsData` via `vi.mock`). Add:
- A test asserting that the DashboardCard title key (`hub.recentResults.title`) appears in rendered output
- A test asserting that when `getRecentResultsData` rejects, the component re-throws (error boundary at page level handles recovery)

Mock pattern: `vi.mock('../../actions/hub-actions', () => ({ getRecentResultsData: vi.fn() }))` — match existing test file pattern.

### Manual Verification

1. Start dev server and navigate to a tournament hub
2. Confirm Results widget appears in the 2-column grid with DashboardCard styling
3. Confirm icon (HistoryIcon) in card header
4. Confirm game list, QT, awards sections render correctly with real data
5. Confirm empty state appears when no results exist
6. Confirm "See Stats" button navigates to `/stats`
7. Confirm Spanish locale renders correctly with `vos` conjugation

## Validation

- `npm run test` — all tests pass
- `npm run lint` — no ESLint issues
- `npm run build` — no TypeScript errors
- Coverage ≥ 80% on modified files
