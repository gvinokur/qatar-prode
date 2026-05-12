# Plan: Story #443 — Configurable group tiebreaker rules per tournament

## Context

Currently each tournament group has a `sort_by_games_between_teams: boolean` field (on `tournament_groups`) that admins toggle per-group in the backoffice. Real tournaments apply the same tiebreaker rules across all groups, so this belongs at the tournament level. The story adds a `tiebreaker_mode` column to `tournaments`, removes the per-group toggle, adds a tournament-level selector in the backoffice, and threads the value through all places that call `calculateGroupPosition`. FIFA's H2H algorithm (already implemented in `group-position-calculator.ts`) is preserved without changes to its logic.

## Acceptance Criteria (from issue)
- [ ] Backoffice: create/edit tournament — choose **Head-to-Head** (default) or **Standard**
- [ ] Head-to-Head: H2H points → H2H GD → H2H goals → overall GD → overall goals → conduct score
- [ ] Standard: overall GD → overall goals → conduct score (current behavior)
- [ ] Per-group "sort by games between teams" toggle removed from backoffice group dialog
- [ ] Hub, predictions, and backoffice standings reflect the tournament's tiebreaker mode
- [ ] Existing tournaments migrate to Standard; new tournaments default to Head-to-Head
- [ ] Works in EN and ES

## Key Insight: Algorithm Mostly Correct, One Bug to Fix

`group-position-calculator.ts` — `calculateGroupPosition(teamIds, games, sortByGamesBetweenTeams, conductScores)` — is mostly FIFA-correct. The source of the `sortByGamesBetweenTeams` flag moves from per-group to per-tournament, AND one bug in `resolveThreeWayTie` is fixed in this story.

**2-way H2H ties**: Correct as-is. A draw means both teams scored the same goals, so H2H GD = 0 and H2H goals are equal — falling through to overall stats is always correct.

**3-way tie bug** (`resolveThreeWayTie`): The current code calls `calculateGroupPosition` recursively on the H2H games (which internally resolves 2-way ties via direct match winner via `resolveTwoWayTies`), then immediately re-sorts the result with `genericTeamStatsComparator`. This re-sort discards the direct-match resolution: if two of the three teams have identical aggregate H2H stats but one beat the other in their direct match, the re-sort treats them as equal and can swap them back. Fix: replace the `calculateGroupPosition(…).sort(genericTeamStatsComparator)` pattern with a two-phase comparator — H2H aggregate criteria first (pts → GD → goals), then fallthrough to overall stats (GD → goals → conduct) when H2H is exhausted.

## Migration

**File:** `migrations/YYYYMMDD-add-tiebreaker-mode-to-tournaments.sql`

```sql
ALTER TABLE tournaments
  ADD COLUMN tiebreaker_mode TEXT NOT NULL DEFAULT 'standard';
```

Default `'standard'` ensures all existing tournaments are unaffected. New tournaments get `'head_to_head'` as the UI default.

`sort_by_games_between_teams` is kept in the DB (deprecated, no longer used) to avoid a destructive migration.

## Visual Prototype

### Backoffice: Tournament Main Data Tab — Tiebreaker Mode Selector

New section added to `tournament-main-data-tab.tsx` below the playoff configuration section:

```
┌───────────────────────────────────────────────────────────┐
│  Tiebreaker Mode                                          │
│                                                           │
│  ● Head-to-Head  (default for new tournaments)            │
│  ○ Standard                                               │
│                                                           │
│  Head-to-Head: H2H results first, then overall stats.     │
│  Standard: overall stats only (goal diff, goals, conduct) │
└───────────────────────────────────────────────────────────┘
```

MUI components: `RadioGroup`, `FormControlLabel`, `Radio`, `FormControl`, `FormLabel`, `FormHelperText`.

### Backoffice: Group Dialog — Remove Toggle

The "Group Rules Configuration" paper section with the `sort_by_games_between_teams` Switch is removed entirely from `group-dialog.tsx`.

## Files to Modify

| File | Change |
|------|--------|
| `migrations/YYYYMMDD-add-tiebreaker-mode-to-tournaments.sql` | **CREATE** — add column |
| `app/db/tables-definition.ts` | Add `TiebreakerMode` type + `tiebreaker_mode` field to `TournamentTable` |
| `app/utils/group-position-calculator.ts` | Fix `resolveThreeWayTie` bug (re-sort undoes direct-match resolution) |
| `app/db/tournament-group-repository.ts` | No change (keep deprecated column) |
| `app/actions/tournament-actions.ts` | `prepareTournamentData`: include `tiebreaker_mode`; `getCompleteTournamentData`: use tournament tiebreaker mode |
| `app/actions/backoffice-actions.ts` | `calculateAndStoreGroupPosition`: fetch tournament for tiebreaker mode; `createOrUpdateTournamentGroup`: remove `sort_by_games_between_teams` param |
| `app/actions/game-score-generator-actions.ts` | Fetch tournament for tiebreaker mode when calling `calculateGroupPosition` |
| `app/utils/group-standings-calculator.ts` | Add `tiebreakerMode` param; delegate to `calculateGroupPosition` for H2H predictions |
| `app/components/backoffice/tournament-main-data-tab.tsx` | Add tiebreaker mode `RadioGroup` |
| `app/components/backoffice/internal/group-dialog.tsx` | Remove `sort_by_games_between_teams` toggle |
| `app/components/backoffice/tournament-groups-manager-tab.tsx` | Remove "head-to-head" note per group |
| `app/components/backoffice/groups-backoffice-tab.tsx` | Pass `tiebreakerMode` from tournament to `GroupBackoffice` |
| `app/components/backoffice/group-backoffice-tab.tsx` | Accept `tiebreakerMode` prop; stop using `group.sort_by_games_between_teams` |
| `__tests__/utils/group-position-calculator.test.ts` | No changes needed (algorithm unchanged) |
| `__tests__/actions/tournament-actions.test.ts` | Update `getCompleteTournamentData` tests to use `tiebreaker_mode` |
| `__tests__/actions/backoffice-actions.test.ts` | Update `calculateAndStoreGroupPosition` tests |

## Mid-Level Design

### Call Graph Changes

**Modified flows:**
- **Flow 5 (Group stats / leaderboard)** — `getCompleteTournamentData` now derives `sortByGamesBetweenTeams` from `tournament.tiebreaker_mode` instead of `group.sort_by_games_between_teams`
- **Backoffice group position recalculation** — `calculateAndStoreGroupPosition` now calls `findTournamentById(group.tournament_id)` before calling `calculateGroupPosition`
- **Game score generator** — `autoFillGameScores` / `clearGameScores` path now fetches tournament tiebreaker mode before calling `calculateGroupPosition`
- **3-way tie resolution** — `resolveThreeWayTie` in `group-position-calculator.ts` replaces the buggy `calculateGroupPosition(…).sort(genericTeamStatsComparator)` pattern with a two-phase comparator

**New flows:** none

---

### `app/db/tables-definition.ts` *(modified)*

**New type:**
- **TiebreakerMode**: `'head_to_head' | 'standard'`
  Shared type for tournament tiebreaker configuration. Used in `TournamentTable` and all callers.

**Changed interface:**
- **TournamentTable** — add field `tiebreaker_mode: TiebreakerMode` (Kysely will read it as `string` from DB, TypeScript types it as the union)

---

### `app/utils/group-position-calculator.ts` *(modified)*

**Changed functions:**

- **resolveThreeWayTie(teamStats, teamsStatsByTeam, games, sortByGamesBetweenTeams, conductScores)**: `boolean` *(same signature)*
  Fix the re-sort bug. When `sortByGamesBetweenTeams === true`:
  1. Compute H2H aggregate stats for each of the 3 tied teams by reducing `tiedTeamGames` with `teamStatsGameReducer` (reuse the existing private helper, or call `calculateGroupPosition(tiedTeams, tiedTeamGames, false, conductScores)` to get the stat objects).
  2. Sort using a two-phase comparator: H2H pts → H2H GD → H2H goals; if equal, fallthrough to `getMagicNumber(teamsStatsByTeam[teamId])` (overall stats).
  3. Map the sorted order back into `teamStats` using overall stat objects.
  No longer calls `.sort(genericTeamStatsComparator)` after the inner `calculateGroupPosition` — that was the bug.
  Calls: calculateGroupPosition (inner, for H2H stat computation only), getMagicNumber (existing private fn)
  Tests:
  - two of three teams have identical H2H aggregate stats but one beat the other in their direct match → the match winner is ranked higher (was previously flipped by the re-sort)
  - three teams with different H2H points → ranked correctly by H2H points (unchanged behavior)
  - three teams all exhausting H2H criteria → fallthrough to overall GD ranks them correctly
  - three teams all exhausting both H2H and overall GD/goals → conduct score is final tiebreaker

---

### `app/utils/group-standings-calculator.ts` *(modified)*

**Changed functions:**

- **computeGroupStandingsFromGuesses(groupGames, guessMap, tiebreakerMode?)**: `TeamStanding[]` *(was: no tiebreakerMode param)*
  When `tiebreakerMode === 'head_to_head'`, constructs `GameWithResultOrGuess[]` (type already exported from `group-position-calculator.ts`) from `groupGames` and `guessMap` and delegates to `calculateGroupPosition(teamIds, gamesWithGuesses, true, {})`, mapping results back to `TeamStanding[]`. Defaults to existing simple sort when `tiebreakerMode === 'standard'` or omitted.
  Calls: calculateGroupPosition (new dependency, only when H2H mode)
  Tests:
  - returns simple sorted standings in standard mode (existing behavior)
  - returns H2H-ordered standings when H2H mode and teams are tied on points with different H2H records
  - returns same result as standard when all H2H criteria are equal (fallthrough to overall stats)
  - skips games with null scores in both modes

---

### `app/actions/tournament-actions.ts` *(modified)*

**Changed functions:**

- **prepareTournamentData(tournamentData, existingTournament, logoUrl, logoKey)**: internal helper — add `tiebreaker_mode` extraction from form data; default to `'head_to_head'` when no existing tournament (new create flow).
  Tests: (internal helper — covered by `createOrUpdateTournament` tests)

- **getCompleteTournamentData(tournamentId, locale)**: `Promise<CompleteTournamentData>` *(was: used `group.sort_by_games_between_teams`)*
  Now derives `const sortByH2H = tournament.tiebreaker_mode === 'head_to_head'` and passes it to every `calculateGroupPosition` call.
  Calls: findTournamentById (already called), calculateGroupPosition (existing)
  Tests:
  - groups use H2H sorting when `tiebreaker_mode = 'head_to_head'`
  - groups use standard sorting when `tiebreaker_mode = 'standard'`
  - multiple groups all receive the same tiebreaker mode from tournament
  - (existing tests updated to provide `tiebreaker_mode` in tournament fixture)

---

### `app/actions/backoffice-actions.ts` *(modified)*

**Changed functions:**

- **createOrUpdateTournamentGroup(tournamentId, groupData, teamIds, locale)**: *(was: groupData included `sort_by_games_between_teams`)*
  Remove `sort_by_games_between_teams` from `groupData` param type and from `updateTournamentGroup` / `createTournamentGroup` calls. The DB column becomes deprecated/ignored.
  Calls: getLoggedInUser, updateTournamentGroup, createTournamentGroup, createTournamentGroupTeam, findGroupsWithGamesAndTeamsInTournament (all existing)
  Tests:
  - group is created without `sort_by_games_between_teams` field (DB write succeeds)
  - group is updated without `sort_by_games_between_teams` field (DB write succeeds)
  - throws Unauthorized when user is not admin
  - returns updated groups list after create

- **calculateAndStoreGroupPosition(groupId)**: `Promise<void>` *(was: used `group.sort_by_games_between_teams`)*
  After fetching the group, also calls `findTournamentById(group.tournament_id)` to get `tiebreaker_mode`, then passes `tournament.tiebreaker_mode === 'head_to_head'` to `calculateGroupPosition`.
  Calls: findTournamentgroupById (existing), findTournamentById (new), calculateGroupPosition (existing)
  Tests:
  - calls calculateGroupPosition with `true` when tournament is `'head_to_head'`
  - calls calculateGroupPosition with `false` when tournament is `'standard'`
  - throws if tournament not found

---

### `app/actions/game-score-generator-actions.ts` *(modified)*

**Changed functions:**

- **autoFillGameScores / clearGameScores** (whichever calls `calculateGroupPosition` at line 134): fetch `findTournamentById` using the game's tournament context before calling `calculateGroupPosition`.
  Calls: findTournamentById (new), calculateGroupPosition (existing)
  Tests:
  - uses H2H tiebreaker when tournament is `'head_to_head'`

---

### `app/components/backoffice/group-backoffice-tab.tsx` *(modified)*

**Changed components:**

- **GroupBackoffice({ group, tournamentId, tiebreakerMode }: Props)**: `JSX.Element` *(was: no `tiebreakerMode` prop)*
  Replace all `group.sort_by_games_between_teams` references with `tiebreakerMode === 'head_to_head'`.
  Tests:
  - renders group standings with H2H flag when tiebreakerMode is 'head_to_head'
  - renders group standings with standard flag when tiebreakerMode is 'standard'
  - does not render sort-by-games toggle anywhere in the component

---

### `app/components/backoffice/groups-backoffice-tab.tsx` *(modified)*

**Changed components:**

- **GroupsTab({ tournamentId }: Props)**: `JSX.Element` *(existing)*
  Fetches `tiebreakerMode` from tournament data (either extend `getGroupDataWithGamesAndTeams` return to include it, or call `getTournamentById` separately). Passes `tiebreakerMode` to each `GroupBackoffice`.
  Calls: getGroupDataWithGamesAndTeams (existing), getTournamentById or extended action (updated)
  Tests:
  - passes correct `tiebreakerMode` down to each GroupBackoffice

---

### `app/components/backoffice/tournament-main-data-tab.tsx` *(modified)*

**Changed components:**

- **TournamentMainDataTab({ tournamentId, onUpdate }: Props)**: `JSX.Element` *(existing)*
  Add `tiebreakerMode` state initialized from `tournament.tiebreaker_mode` (default `'head_to_head'` when creating). Adds a `RadioGroup` with two options. Includes `tiebreakerMode` in the `FormData` submitted to `createOrUpdateTournament`.
  Tests:
  - renders H2H selected by default when no existing tournament
  - renders existing tournament's tiebreaker mode when editing
  - submits `tiebreaker_mode` in form data

---

### `app/components/backoffice/internal/group-dialog.tsx` *(modified)*

**Changed components:**

- **GroupDialog(...)**: Remove entire "Group Rules Configuration" Paper section containing the `sort_by_games_between_teams` Switch. Remove `sortByGamesBetweenTeams` state and its submission to `createOrUpdateTournamentGroup`.
  Tests:
  - dialog renders without sort toggle
  - form submission does not include sort_by_games_between_teams

## Implementation Order

**Wave 1 (no dependencies):**
- Migration file
- `tables-definition.ts` — add type + field
- `group-position-calculator.ts` — fix `resolveThreeWayTie` bug (no new dependencies)

**Wave 2 (depends on Wave 1 types):**
- `tournament-actions.ts` — `prepareTournamentData` + `getCompleteTournamentData`
- `backoffice-actions.ts` — `createOrUpdateTournamentGroup` + `calculateAndStoreGroupPosition`
- `game-score-generator-actions.ts`
- `group-standings-calculator.ts`

**Wave 3 (depends on Wave 2):**
- `tournament-main-data-tab.tsx`
- `group-dialog.tsx`
- `tournament-groups-manager-tab.tsx`
- `groups-backoffice-tab.tsx` + `group-backoffice-tab.tsx`

**Wave 4:**
- Tests — update all affected test files

## Testing Strategy

### Unit Tests
Use `testFactories.*` for all test data construction (tournament, group, team fixtures). Use `createMockSelectQuery()` for DB layer mocks in action tests.

- `group-position-calculator.test.ts` — add 4 new test cases for the 3-way tie bug fix (see Mid-Level Design); use inline game/stat data (pure function, no factory needed)
- `group-standings-calculator.test.ts` — new H2H mode tests for `computeGroupStandingsFromGuesses`; use inline game/guess data (no factory needed for pure function)
- `tournament-actions.test.ts` — update `getCompleteTournamentData` fixtures with `tiebreaker_mode` via `testFactories.tournament({ tiebreaker_mode: 'head_to_head' })`
- `backoffice-actions.test.ts` — update `calculateAndStoreGroupPosition` to test both modes using `testFactories.tournament` + `testFactories.tournamentGroup`

### Error / Edge Case Tests
- `getCompleteTournamentData`: tournament not found → already throws from `findTournamentById` (existing behavior)
- `calculateAndStoreGroupPosition`: group's tournament not found → throw to surface the error
- `computeGroupStandingsFromGuesses`: empty `groupGames` array → returns empty `TeamStanding[]` in both modes
- `computeGroupStandingsFromGuesses`: all guesses null → returns zeroed stats for all teams in both modes
- `TournamentMainDataTab`: existing tournament with unknown `tiebreaker_mode` value → treat as `'standard'` (defensive default)
- `GroupDialog` submit after toggle removal → no regression in group save (submit succeeds without the field)

### Integration Verification
1. Create a new tournament in backoffice — verify H2H is pre-selected
2. Edit an existing tournament — verify Standard is shown (from migration default)
3. Toggle to H2H and save — verify tournament record updated
4. In group backoffice tab, enter game scores with a tie scenario, verify H2H ordering applied
5. Hub group standings — verify they match the tournament's mode
6. Confirm group dialog no longer shows the tiebreaker toggle

## CODE-STRUCTURE Files to Update
- `docs/code-structure/db.md` — `tables-definition.ts` (add `TiebreakerMode` type, `tiebreaker_mode` field to `TournamentTable`)
- `docs/code-structure/utils.md` — `group-position-calculator.ts` (updated `resolveThreeWayTie` behavior), `group-standings-calculator.ts` (updated signature)
- `docs/code-structure/actions.md` — `tournament-actions.ts`, `backoffice-actions.ts`, `game-score-generator-actions.ts`
- `docs/code-structure/components/components-backoffice.md` — `tournament-main-data-tab.tsx`, `group-backoffice-tab.tsx`, `groups-backoffice-tab.tsx`, `group-dialog.tsx`
- Call graph: **YES** — Flow 5 updated, backoffice position recalc updated

## Open Questions
- None — requirements are clear from the issue.
