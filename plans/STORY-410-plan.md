# Plan: Tournament layout — eliminate redundant DB call #410

## Story Context

**Issue:** #410 — [Story] Tournament layout: eliminate redundant DB call and parallelize data loading
**Epic:** #409
**Related:** #422 (sidebar extraction — the larger performance win; do that next)

## Objective

Remove the redundant `findTournamentById` call in the tournament layout. The data it returns is already present in `layoutData.tournament` from `getTournamentAndGroupsData`, which calls `findTournamentById` internally. The second call is a no-op that hits the database unnecessarily on every tournament page load.

The parallelization and sidebar data optimizations originally in this story's scope have been moved to #422, which takes the correct architectural approach (streaming Server Component) rather than optimizing within a pattern we're about to replace.

## Acceptance Criteria

- [ ] All tournament sub-pages (hub, games, stats, results, awards, qualified-teams, rules) load and display correctly
- [ ] The tournament sidebar shows correct group standings, user rank, and group list for authenticated users
- [ ] Unauthenticated visitors see the correct public view with no errors
- [ ] The JSON-LD sports event structured data in the page source still includes the correct location data
- [ ] No visible change in page content or behavior for any user type

## Technical Approach

`getTournamentAndGroupsData(params.id)` calls `findTournamentById` internally and returns the result as `layoutData.tournament`. `applyLocalization` only overwrites `long_name` and `short_name` — all other fields (scoring config, `locations`, `dev_only`, `theme`, etc.) pass through unchanged.

On line 125 the layout calls `findTournamentById(params.id)` again, storing the result in a `tournament` variable used in two places:
1. `extractScoringConfig(tournament)` → replace with `extractScoringConfig(layoutData.tournament)`
2. `buildSportsEventJsonLd(..., tournament?.locations)` → replace with `buildSportsEventJsonLd(..., layoutData.tournament?.locations)`

After those substitutions, the `tournament` variable and the `findTournamentById` import are both unused and can be deleted.

## Mid-Level Design

### Call Graph Changes

No call graph changes. One DB call is removed; no new calls or flows are introduced.

### `app/[locale]/tournaments/[id]/layout.tsx` *(modified)*

**Changed functions:**

- **TournamentLayout({ params, children }: TournamentLayoutProps): Promise\<JSX.Element\>** *(behavior change only — signature unchanged)*
  Removes the redundant `findTournamentById` call; uses `layoutData.tournament` in its place for scoring config extraction and JSON-LD location data.
  Calls: getLoggedInUser, getTournamentAndGroupsData, getTournaments, getTournamentStartDate, checkDevTournamentPermission, findUserById, findTournamentGuessByUserIdTournament, getGroupsForUser, getGroupStandingsForTournament, getGameGuessStatisticsForUsers, getGroupRankingForUser
  Tests:
  - does not call `findTournamentById` directly (removed — data comes from layoutData)
  - renders JSON-LD with correct location data from layoutData.tournament
  - renders correct scoring config in sidebar from layoutData.tournament fields
  - renders correctly when tournament.locations is null (JSON-LD builder handles null gracefully)
  - all existing tests continue to pass with no mock setup changes needed

## Files to Create/Modify

**Modify:**
- `app/[locale]/tournaments/[id]/layout.tsx` — remove import, remove `const tournament = ...` line, replace two usages
- `app/[locale]/tournaments/[id]/__tests__/layout.test.tsx` — remove `findTournamentById` mock and its import; add assertion that it is not called

## Implementation Steps

1. **Remove `findTournamentById` from layout** — delete the import of `findTournamentById` from `'../../../db/tournament-repository'`; delete `const tournament = await findTournamentById(params.id)` (line 125); replace `extractScoringConfig(tournament)` with `extractScoringConfig(layoutData.tournament)`; replace `tournament?.locations` with `layoutData.tournament?.locations` in `buildSportsEventJsonLd`.
   - Files: `app/[locale]/tournaments/[id]/layout.tsx`
   - Dependencies: none

2. **Update tests** — remove `findTournamentById` mock import and `vi.mock` block; remove the `(findTournamentById as any).mockResolvedValue(...)` line from `beforeEach`; add a test asserting `findTournamentById` is not called; add a test for null `tournament.locations`.
   - Files: `app/[locale]/tournaments/[id]/__tests__/layout.test.tsx`
   - Dependencies: Step 1 must complete first

## Testing Strategy

**Unit / component tests:**
- `app/[locale]/tournaments/[id]/__tests__/layout.test.tsx`
  - `does not call findTournamentById` — assert mock is never called after refactor
  - `renders correctly when tournament.locations is null` — JSON-LD inline script renders without throwing
  - All existing tests pass without modification

**Coverage target:** ≥80% on changed code (layout is already well-covered; changes are minimal)

## Validation Considerations

- SonarCloud: no new code — removing lines only; no new issues expected
- Coverage: existing suite covers the layout; two new tests added
- Correctness: `applyLocalization` is a pure spread — all non-name fields in `layoutData.tournament` are identical to what `findTournamentById` would have returned

## Open Questions

*(none)*

## Implementation Amendments

*(Added during implementation when deviations from plan are discovered)*
