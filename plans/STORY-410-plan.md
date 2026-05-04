# Plan: Tournament layout — eliminate redundant DB call and parallelize data loading #410

## Story Context

**Issue:** #410 — [Story] Tournament layout: eliminate redundant DB call and parallelize data loading
**Epic:** #409

## Objective

The tournament layout server component currently makes 8+ database calls sequentially and fetches group standings data even for unauthenticated visitors who will never see it. This story removes the redundant `findTournamentById` call (the data is already in `layoutData.tournament`), parallelizes the independent fetches using `Promise.all` waves, and gates the expensive `getGroupStandingsForTournament` call behind an auth check. No visible change in page behavior for any user.

## Acceptance Criteria

- [ ] All tournament sub-pages (hub, games, stats, results, awards, qualified-teams, rules) load and display correctly
- [ ] The tournament sidebar shows correct group standings, user rank, and group list for authenticated users
- [ ] Unauthenticated visitors see the correct public view with no errors
- [ ] The JSON-LD sports event structured data in page source still includes the correct location data
- [ ] No visible change in page content or behavior for any user type

## Technical Approach

**Problem analysis:**

The current `TournamentLayout` function (356 lines) has three performance issues:

1. **Redundant DB call:** `getTournamentAndGroupsData(params.id)` internally calls `findTournamentById(params.id)` and returns the result as `layoutData.tournament`. Then on line 125, the layout calls `findTournamentById(params.id)` again to get a `tournament` variable used only for `extractScoringConfig(tournament)` and `tournament?.locations` in the JSON-LD builder. Since `applyLocalization` only replaces `long_name`/`short_name` and passes all other fields through, `layoutData.tournament` contains all the same fields. The second call is fully redundant.

2. **Sequential fetches:** The following 8 calls execute one-at-a-time even though many are independent of each other: `getLoggedInUser`, `getTournamentAndGroupsData`, `getTournaments`, `checkDevTournamentPermission`, `findTournamentGuessByUserIdTournament`, `getTournamentStartDate`, `findTournamentById` (redundant), `getGroupsForUser`, `getGroupStandingsForTournament`, `getGameGuessStatisticsForUsers`, then the already-parallel group rank calls.

3. **Unnecessary standings fetch for unauthenticated visitors:** `getGroupStandingsForTournament(params.id)` is always called regardless of auth state. This function itself makes multiple DB queries (fetches all groups, qualified teams, game results per group). Unauthenticated visitors never see group standings, so this work is wasted.

**Fix strategy — 3 Promise.all waves:**

Wave 1 (no dependencies — run in parallel):
- `getLoggedInUser()`
- `getTournamentAndGroupsData(params.id)`
- `getTournaments()`
- `getTournamentStartDate(params.id)`

After Wave 1: `checkDevTournamentPermission(...)` — must be sequential (can redirect/notFound)

Wave 2 (user-dependent — run in parallel):
- `findUserById(user.id)` — for email verification fallback (only if user exists)
- `findTournamentGuessByUserIdTournament(user.id, params.id)` — only if user
- `getGroupsForUser()` — only if user
- `getGroupStandingsForTournament(params.id)` — **only if user** (auth-gated)
- `getGameGuessStatisticsForUsers([user.id], params.id)` — only if user

After Wave 2: compute `isVerified` from the parallel-fetched `userRecord`

Wave 3 (already parallel): group rank calls per group — unchanged

**`isVerified` computation:** Currently `findUserById` is embedded inline in the `isVerified` expression (conditional on `user.emailVerified` being falsy). With parallelization we always fetch `userRecord` when user exists (same cost if `emailVerified` is already set, since we're running it in parallel anyway), and compute `isVerified = user && (user.emailVerified || userRecord?.email_verified)` after Wave 2.

**`findTournamentById` removal:** Remove the import from `tournament-repository` in the layout file. Replace `tournament` variable usages:
- `extractScoringConfig(tournament)` → `extractScoringConfig(layoutData.tournament)`
- `buildSportsEventJsonLd(..., tournament?.locations)` → `buildSportsEventJsonLd(..., layoutData.tournament?.locations)`

## Mid-Level Design

### Call Graph Changes

No call graph changes. The story only changes the execution order and parallelism of existing calls in the layout — no new cross-layer flows, no new actions, no new DB calls.

### `app/[locale]/tournaments/[id]/layout.tsx` *(modified)*

**Changed functions:**

- **TournamentLayout({ params, children }: TournamentLayoutProps): Promise\<JSX.Element\>** *(behavior change only — signature unchanged)*
  Parallelizes all independent data fetches into Promise.all waves; removes redundant `findTournamentById` call; gates `getGroupStandingsForTournament` behind auth check.
  Calls: getLoggedInUser, getTournamentAndGroupsData, getTournaments, getTournamentStartDate (Wave 1), checkDevTournamentPermission, findUserById, findTournamentGuessByUserIdTournament, getGroupsForUser, getGroupStandingsForTournament, getGameGuessStatisticsForUsers (Wave 2), getGroupRankingForUser (Wave 3)
  Tests:
  - does not call findTournamentById (removed — redundant)
  - does not call getGroupStandingsForTournament when user is not logged in
  - calls getGroupStandingsForTournament when user is logged in
  - fetches getTournamentAndGroupsData, getTournaments, getTournamentStartDate on every request regardless of auth state (Wave 1 always runs)
  - renders correctly with unauthenticated user and null tournament.locations (JSON-LD builder handles null gracefully)
  - renders correctly with authenticated user and empty groups array in prodeGroups

Note on test mock pattern: the existing layout test file uses inline mock objects (not `testFactories`) because it is testing a Server Component that receives mocked action/repo results, not DB query shapes. New tests will follow the same inline mock pattern already established in the file.

## Files to Create/Modify

**Modify:**
- `app/[locale]/tournaments/[id]/layout.tsx` — remove redundant import + call, add Promise.all waves, gate standings
- `app/[locale]/tournaments/[id]/__tests__/layout.test.tsx` — remove `findTournamentById` mock, add auth-gated standings tests

## Implementation Steps

1. **Remove redundant `findTournamentById` import and call** — Delete the import of `findTournamentById` from `tournament-repository`; delete line 125 (`const tournament = await findTournamentById(params.id)`); replace `tournament` variable with `layoutData.tournament` in `extractScoringConfig(...)` and `buildSportsEventJsonLd(...)`.
   - Files: `app/[locale]/tournaments/[id]/layout.tsx`
   - Dependencies: none

2. **Add Wave 1 parallelization** — Replace the sequential `getLoggedInUser`, `getTournamentAndGroupsData`, `getTournaments`, `getTournamentStartDate` calls with a single `Promise.all`.
   - Files: `app/[locale]/tournaments/[id]/layout.tsx`
   - Dependencies: Step 1 must complete first

3. **Add Wave 2 parallelization + auth-gate standings** — Replace sequential `findUserById`, `findTournamentGuessByUserIdTournament`, `getGroupsForUser`, `getGroupStandingsForTournament`, `getGameGuessStatisticsForUsers` with a `Promise.all`; gate all five on `user` being truthy; compute `isVerified` from the parallel-fetched `userRecord`.
   - Files: `app/[locale]/tournaments/[id]/layout.tsx`
   - Dependencies: Steps 1–2 must complete first

4. **Update tests** — Remove `findTournamentById` mock and import; add test verifying standings are not fetched for unauthenticated users; adjust any mock setup that relied on the redundant call.
   - Files: `app/[locale]/tournaments/[id]/__tests__/layout.test.tsx`
   - Dependencies: Steps 1–3 must complete first

## Testing Strategy

**Unit / component tests:**
- `app/[locale]/tournaments/[id]/__tests__/layout.test.tsx`
  - `does not call findTournamentById` — assert mock not called after refactor
  - `does not fetch group standings for unauthenticated users` — assert `getGroupStandingsForTournament` not called when `getLoggedInUser` returns null
  - `fetches group standings for authenticated users` — assert `getGroupStandingsForTournament` called when user is logged in
  - `always fetches tournament data regardless of auth state` — assert `getTournamentAndGroupsData`, `getTournaments`, `getTournamentStartDate` called even when user is null
  - `renders correctly when tournament.locations is null` — JSON-LD inline script renders without throwing
  - `renders correctly when user has no groups (empty prodeGroups)` — no group rank calls made
  - All existing tests continue to pass

**Coverage target:** ≥80% on changed code (layout.tsx is already well-covered by existing tests)

## Validation Considerations

- SonarCloud: no new code paths, only restructuring — no anticipated issues
- Coverage: existing test suite covers the layout; new tests added for the two new behaviors
- Security: no auth logic changed; `checkDevTournamentPermission` still runs before Wave 2 data is fetched; group standings remain behind user check
- Correctness: `applyLocalization` is a pure object spread — all tournament fields (scoring config, locations, dev_only, theme, etc.) are preserved in `layoutData.tournament`

## Open Questions

*(none — all decisions resolved during research)*

## Implementation Amendments

*(Added during implementation when deviations from plan are discovered)*
