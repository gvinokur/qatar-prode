# STORY-424: Consolidate tournament stats page to use single data fetch

## Context

After story #422 extended `getGameGuessStatisticsForUsers` with tournament-level scoring fields
(`qualified_teams_score`, `group_position_score`, `honor_roll_score`, `individual_awards_score`),
the stats page still calls `findTournamentGuessByUserIdTournament` separately to retrieve
`qualified_teams_correct` and `qualified_teams_exact`. Both calls hit the same `tournament_guesses`
table — the only reason the second call is still needed is that those two fields were never added
to the first query's SELECT list. This story removes that redundancy.

---

## Acceptance Criteria

- The personal stats page shows identical data to today (scores and accuracy counts unchanged)
- No regression on the awards page
- `findTournamentGuessByUserIdTournament` is no longer called by the stats page

---

## Technical Approach

### Root Cause

`getGameGuessStatisticsForUsers` reads from `tournament_guesses` and already fetches:
- Game scores (group, playoff, boost)
- All 9 accuracy count fields (`total/group/playoff_correct/exact/goal_difference_guesses`)
- Tournament-level scores (`qualified_teams_score`, `group_position_score`, `honor_roll_score`, `individual_awards_score`)

But it does NOT fetch:
- `qualified_teams_correct`
- `qualified_teams_exact`

The stats page therefore calls `findTournamentGuessByUserIdTournament` (a full `SELECT *` on the same row) just to get these two fields.

### Fix

1. **Add the two missing fields** to `getGameGuessStatisticsForUsers`'s SELECT list and to the `GameStatisticForUser` type.
2. **Remove `findTournamentGuessByUserIdTournament`** from the stats page, replacing all `tournamentGuess?.xxx` references with `userGameStats?.xxx`.

`countGameGuessesByUserId` is intentionally kept — it hits `game_guesses` (not `tournament_guesses`) and provides `totalPredictionsMade` which is not materialized in `tournament_guesses`.

### Out of Scope

- `stats-actions.ts` (`getUserStatsForComparison`) has the same two-query pattern using `getTournamentGuessStatsForUsers` — left for a follow-up since the issue explicitly limits scope to the stats page.
- Awards page (no changes).
- Display/UI changes.

---

## Files to Modify

| File | Change |
|------|--------|
| `types/definitions.ts` | Add `qualified_teams_correct` and `qualified_teams_exact` to `GameStatisticForUser` |
| `app/db/game-guess-repository.ts` | Add the two fields to `getGameGuessStatisticsForUsers` SELECT |
| `app/[locale]/tournaments/[id]/stats/page.tsx` | Remove `findTournamentGuessByUserIdTournament` call; use `userGameStats` for all fields |
| `docs/code-structure/db.md` | Update `getGameGuessStatisticsForUsers` description |
| `docs/code-structure/pages.md` | Update `TournamentStatsPage` Calls list |
| `CODE-STRUCTURE.md` | Update Flow 12 call graph |

---

## Mid-Level Design

### Call Graph Changes

**Modified flows:**

- **Flow 12 (User stats page)** — remove `findTournamentGuessByUserIdTournament` from `TournamentStatsPage`

Updated Flow 12:
```
TournamentStatsPage (Server)
  ├── getLoggedInUser
  ├── findTournamentByIdCached
  ├── getGameGuessStatisticsForUsers          ← now also returns qualified_teams_correct/exact
  ├── getBoostAllocationBreakdown
  ├── getGameCountsForTournament
  ├── countGameGuessesByUserId
  ├── calculateAccuracyStats (util)
  ├── calculateBoostStats (util)
  └── getScoreHistoryForUsers (score-history-repository)
```
(removed: `findTournamentGuessByUserIdTournament`)

### `types/definitions.ts` *(modified)*

**Changed type:**

- **GameStatisticForUser** — add two optional fields:
  - `qualified_teams_correct?: number | null`
  - `qualified_teams_exact?: number | null`

### `app/db/game-guess-repository.ts` *(modified)*

**Changed functions:**

- **getGameGuessStatisticsForUsers(userIds: string[], tournamentId: string)**: `Promise<GameStatisticForUser[]>` *(unchanged signature, extended SELECT)*
  Adds `'qualified_teams_correct'` and `'qualified_teams_exact'` to the SELECT list so callers
  get qualified-team accuracy data in the same query.
  Calls: db (Kysely selectFrom tournament_guesses)
  Tests (using Kysely builder inline mocks — this DB layer test mocks at the Kysely `selectFrom/select/where/execute` chain; testFactories are not applicable here since there is no real DB connection in unit tests):
  - returns `qualified_teams_correct` and `qualified_teams_exact` from the result row when present
  - returns null for `qualified_teams_correct` and `qualified_teams_exact` when the row has null values (pre-qualified-teams tournament data)
  - returns an empty array when called with an empty userIds array ([]); no DB call needed
  - existing: returns all 9 accuracy count fields and 4 score fields (`group_score`, `playoff_score`, `group_boost_bonus`, `playoff_boost_bonus`) unchanged for multi-user input

### `app/[locale]/tournaments/[id]/stats/page.tsx` *(modified)*

**Changed component:**

- **TournamentStatsPage()** — [Server] *(unchanged signature)*
  Remove `findTournamentGuessByUserIdTournament` call. Read all formerly-`tournamentGuess`
  fields from `userGameStats` directly:
  - `qualified_teams_score` → `userGameStats?.qualified_teams_score ?? 0`
  - `qualified_teams_correct` → `userGameStats?.qualified_teams_correct ?? 0`
  - `qualified_teams_exact` → `userGameStats?.qualified_teams_exact ?? 0`
  - `group_position_score` → `userGameStats?.group_position_score ?? 0`
  - `honor_roll_score` → `userGameStats?.honor_roll_score ?? 0`
  - `individual_awards_score` → `userGameStats?.individual_awards_score ?? 0`
  Calls: getLoggedInUser, findTournamentByIdCached, getGameGuessStatisticsForUsers,
         getBoostAllocationBreakdown, getGameCountsForTournament, countGameGuessesByUserId,
         calculateAccuracyStats, calculateBoostStats, getScoreHistoryForUsers
  Tests: (page component — verified by integration; no unit test needed for page orchestration)

---

## Implementation Steps

1. **`types/definitions.ts`**: Add `qualified_teams_correct?: number | null` and `qualified_teams_exact?: number | null` to `GameStatisticForUser`.

2. **`app/db/game-guess-repository.ts`**: In `getGameGuessStatisticsForUsers`, add to the SELECT array:
   ```ts
   'qualified_teams_correct',
   'qualified_teams_exact',
   ```

3. **`app/[locale]/tournaments/[id]/stats/page.tsx`**:
   - Remove import of `findTournamentGuessByUserIdTournament`
   - Remove the `const tournamentGuess = await findTournamentGuessByUserIdTournament(...)` call
   - Replace all `tournamentGuess?.xxx` with `userGameStats?.xxx`:
     - `tournamentGuess?.qualified_teams_score` → `userGameStats?.qualified_teams_score`
     - `tournamentGuess?.qualified_teams_correct` → `userGameStats?.qualified_teams_correct`
     - `tournamentGuess?.qualified_teams_exact` → `userGameStats?.qualified_teams_exact`
     - `tournamentGuess?.group_position_score` → `userGameStats?.group_position_score`
     - `tournamentGuess?.honor_roll_score` → `userGameStats?.honor_roll_score`
     - `tournamentGuess?.individual_awards_score` → `userGameStats?.individual_awards_score`

4. **Tests** (`__tests__/db/game-guess-repository-materialized.test.ts`): Update mock data and assertions to include `qualified_teams_correct` and `qualified_teams_exact`.

5. **CODE-STRUCTURE updates**: `docs/code-structure/db.md`, `docs/code-structure/pages.md`, `CODE-STRUCTURE.md` (Flow 12).

---

## Testing Strategy

- **Unit test** (`__tests__/db/game-guess-repository-materialized.test.ts`):
  - Uses Kysely builder inline mocks (the existing pattern for this file — no testFactories because this layer mocks at `selectFrom/where/select/execute` chain level, not row-level data).
  - Extend existing mock data objects to include `qualified_teams_correct` and `qualified_teams_exact`.
  - Add assertion: result row contains the new fields with expected values.
  - Add test case: a user with null `qualified_teams_correct`/`exact` returns null for those fields.
  - Add test case: empty `userIds` array returns empty array without querying DB.
- **Manual / Vercel Preview**: Visit the tournament stats page and confirm Performance tab shows correct qualified team scores and accuracy tab shows correct counts — identical to pre-change.
- Run `npm run test` and `npm run build` before commit.

---

## Validation / Quality Gates

- TypeScript strict mode: `GameStatisticForUser` type change propagates cleanly — no other callers of `getGameGuessStatisticsForUsers` use `qualified_teams_correct`/`exact` yet, so no breakage.
- `stats-actions.ts` / `getTournamentGuessStatsForUsers` are unchanged — existing tests for those pass unmodified.
- 0 new SonarCloud issues expected (simple field additions + dead code removal).
