# Story 412 Plan: Consolidate Prediction Completion Progress Queries

## Context

Every hub page load for an authenticated user triggers `getTournamentPredictionCompletion`, which currently issues **13 sequential database queries** to compute how complete a user's predictions are across games, boosts, qualifiers, and awards. Sequential round-trips multiply latency with each query blocking the next.

This story consolidates those queries using:
1. **Conditional aggregation** (COUNT(CASE WHEN ...)) to compute multiple metrics in a single DB pass
2. **`Promise.all`** to run independent queries concurrently
3. **Optional `firstGameDate` param** to eliminate a redundant `findFirstGameInTournament` call inside the repository when the caller already has the value

No UI changes. Same return shape (`TournamentPredictionCompletion`). All callers remain backward compatible.

---

## Acceptance Criteria (from issue)

- [ ] Prediction progress bar shows correct overall % for a user with partial predictions
- [ ] Game completion count (e.g. "42/64 games predicted") is correct
- [ ] Silver and golden boost counters show correct used/max values
- [ ] Qualifier and awards completion indicators show correct values
- [ ] Per-playoff-round completion data (shown in predictions page) is correct
- [ ] "Predictions locked" state triggers correctly after the tournament start window
- [ ] All existing tests pass

---

## Current Query Count: 13 Sequential

| # | Query | Purpose |
|---|-------|---------|
| 1 | `findTournamentGuessByUserIdTournament` | Final standings + award data |
| 2 | COUNT games | `totalGames` |
| 3 | COUNT completed games (with playoff penalty logic) | `completedGames` |
| 4 | COUNT group games | `totalGroupGames` |
| 5 | COUNT completed group games | `completedGroupGames` |
| 6 | COUNT silver boost usage | `silverBoostsUsed` |
| 7 | COUNT golden boost usage | `goldenBoostsUsed` |
| 8 | COUNT first-stage playoff games | `totalQualifierSlots` base |
| 9 | `getAllUserGroupPositionsPredictions` | `qualifiersCompleted` |
| 10 | Fetch all playoff rounds | round metadata |
| 11 | COUNT total games per round | `playoffRoundsCompletion.total` |
| 12 | COUNT completed games per round | `playoffRoundsCompletion.completed` |
| 13 | `getTournamentStartDate` → `findFirstGameInTournament` | `isPredictionLocked` (redundant in hub context) |

---

## After Optimization: 4 Parallel Queries

| # | New Query | Replaces |
|---|-----------|---------|
| 1 | `findTournamentGuessByUserIdTournament` (unchanged) | Query 1 |
| 2 | **`fetchGameAndBoostStats`** — single LEFT JOIN + conditional aggregation | Queries 2–7 |
| 3 | `getAllUserGroupPositionsPredictions` (unchanged) | Query 9 |
| 4 | **`fetchPlayoffRoundsWithCompletion`** — GROUP BY + LEFT JOIN + conditional aggregation | Queries 8, 10, 11, 12 |

Query 13 eliminated by passing `firstGameDate` from callers that already have it.

All 4 queries run in parallel via `Promise.all`.

---

## Files to Modify

| File | Change |
|------|--------|
| `app/db/tournament-prediction-completion-repository.ts` | Core: add 2 private helpers, update main function to run in parallel, add optional `firstGameDate` param |
| `app/actions/hub-actions.ts` | Pass `firstGame?.game_date ?? null` as 4th arg to skip redundant DB call |
| `app/[locale]/tournaments/[id]/awards/page.tsx` | Pass `tournamentStartDate` (already fetched) as 4th arg |
| `app/[locale]/tournaments/[id]/qualified-teams/page.tsx` | Pass `tournamentStartDate` (computable from fetched games) as 4th arg |

> **Note:** `unified-games-page.tsx` also computes `tournamentStartDate` from its `games` array (line 77) — can be updated as a follow-on but is not required for this story.

---

## Technical Approach

### Helper 1: `fetchGameAndBoostStats`

Single query using `LEFT JOIN game_guesses` (restricted to `userId`) with `COUNT(CASE WHEN ...)` aggregation on the `games` table. The LEFT JOIN ensures all games appear (for total counts) while conditional CASE expressions filter for completed games/boosts (NULL rows from LEFT JOIN are excluded by COUNT automatically).

**SQL equivalent:**
```sql
SELECT
  COUNT(*) AS total_games,
  COUNT(CASE WHEN game_type = 'group' THEN 1 END) AS total_group_games,
  COUNT(CASE WHEN gg.home_score IS NOT NULL AND gg.away_score IS NOT NULL
    AND (game_type = 'group'
      OR gg.home_score != gg.away_score
      OR gg.home_penalty_winner = true
      OR gg.away_penalty_winner = true)
    THEN 1 END) AS completed_games,
  COUNT(CASE WHEN game_type = 'group'
    AND gg.home_score IS NOT NULL AND gg.away_score IS NOT NULL
    THEN 1 END) AS completed_group_games,
  COUNT(CASE WHEN gg.boost_type = 'silver' THEN 1 END) AS silver_boosts_used,
  COUNT(CASE WHEN gg.boost_type = 'golden' THEN 1 END) AS golden_boosts_used
FROM games
LEFT JOIN game_guesses gg ON gg.game_id = games.id AND gg.user_id = $userId
WHERE games.tournament_id = $tournamentId
```

### Helper 2: `fetchPlayoffRoundsWithCompletion`

Single query joining `tournament_playoff_rounds` → `tournament_playoff_round_games` → `game_guesses` (LEFT JOIN for userId) with GROUP BY on round ID. Returns per-round metadata + total/completed game counts in one pass. The first-stage total for `totalQualifierSlots` is derived in TypeScript by filtering `is_first_stage = true` rows.

**SQL equivalent:**
```sql
SELECT
  tpr.id, tpr.round_name, tpr.round_order, tpr.is_final,
  tpr.is_third_place, tpr.is_first_stage,
  COUNT(tprg.game_id) AS total_games,
  COUNT(CASE WHEN gg.home_score IS NOT NULL AND gg.away_score IS NOT NULL
    AND (gg.home_score != gg.away_score
      OR gg.home_penalty_winner = true
      OR gg.away_penalty_winner = true)
    THEN 1 END) AS completed_games
FROM tournament_playoff_rounds tpr
INNER JOIN tournament_playoff_round_games tprg ON tprg.tournament_playoff_round_id = tpr.id
LEFT JOIN game_guesses gg ON gg.game_id = tprg.game_id AND gg.user_id = $userId
WHERE tpr.tournament_id = $tournamentId
GROUP BY tpr.id, tpr.round_name, tpr.round_order, tpr.is_final,
         tpr.is_third_place, tpr.is_first_stage
ORDER BY tpr.round_order ASC
```

---

## Mid-Level Design

### Call Graph Changes

**No call graph changes.** `getTournamentPredictionCompletion` already sits between Server Actions/Pages and DB in the call graph. Internal implementation changes do not affect the call graph.

---

### `app/db/tournament-prediction-completion-repository.ts` *(modified)*

**New private functions:**

- **`fetchGameAndBoostStats(userId: string, tournamentId: string)`**: `Promise<{ total_games: number; total_group_games: number; completed_games: number; completed_group_games: number; silver_boosts_used: number; golden_boosts_used: number } | undefined>`
  Single LEFT JOIN query with conditional aggregation replacing 6 sequential COUNT queries.
  Calls: db (Kysely)
  Tests:
  - returns correct total_games count for a tournament with multiple game types
  - completed_games excludes tied playoff games without penalty winner
  - completed_group_games only counts group-type games with both scores set
  - silver_boosts_used and golden_boosts_used count only the respective boost_type
  - returns all zeros when user has made no guesses

- **`fetchPlayoffRoundsWithCompletion(userId: string, tournamentId: string)`**: `Promise<Array<{ id: string; round_name: string; round_order: number; is_final: boolean | null; is_third_place: boolean | null; is_first_stage: boolean | null; total_games: number; completed_games: number }>>`
  Single GROUP BY query with conditional aggregation replacing 4 sequential queries for playoff round metadata and per-round totals.
  Calls: db (Kysely)
  Tests:
  - returns empty array when tournament has no playoff rounds
  - returns correct total_games per round
  - completed_games per round excludes tied games without penalty winner
  - completed_games is 0 for a round where the user has made no guesses (round exists but all games unpredicted)
  - is_first_stage correctly identified from tournament_playoff_rounds data

**Changed functions:**

- **`getTournamentPredictionCompletion(userId: string, tournamentId: string, tournament: Tournament, firstGameDate?: Date | null)`**: `Promise<TournamentPredictionCompletion>` *(was: no `firstGameDate` param)*
  Runs all 4 queries in parallel via `Promise.all`. Derives `totalFirstRoundGames` from `fetchPlayoffRoundsWithCompletion` result by filtering `is_first_stage = true`. When `firstGameDate` is provided, skips `getTournamentStartDate` DB call; otherwise falls back to calling it.
  Calls: findTournamentGuessByUserIdTournament, fetchGameAndBoostStats, getAllUserGroupPositionsPredictions, fetchPlayoffRoundsWithCompletion, getTournamentStartDate (only when firstGameDate not provided)
  Tests:
  - returns same TournamentPredictionCompletion shape with correct values
  - isPredictionLocked is true when firstGameDate + PREDICTION_LOCK_OFFSET_MS < now
  - isPredictionLocked is false when predictions window still open
  - getTournamentStartDate is NOT called when firstGameDate param is provided
  - getTournamentStartDate IS called when firstGameDate param is undefined/not provided
  - qualifier total equals 2x the number of games in first-stage rounds
  - completed_games counts only games where both scores are set (partial scores excluded)

---

### `app/actions/hub-actions.ts` *(modified)*

**Changed functions:**

- **`getActionCenterGames(tournamentId: string, locale: Locale)`**: `Promise<ActionCenterData>` *(signature unchanged externally)*
  Passes `firstGame?.game_date ?? null` as 4th argument to `getTournamentPredictionCompletion`. `firstGame` is already fetched in the existing `Promise.all` batch.
  Calls: (unchanged) + `getTournamentPredictionCompletion` with `firstGame?.game_date ?? null`
  Tests:
  - (existing tests unchanged — they mock `getTournamentPredictionCompletion` at module level)

---

### `app/[locale]/tournaments/[id]/awards/page.tsx` *(modified)*

- Pass `tournamentStartDate` (already fetched via `getTournamentStartDate`) as 4th arg to `getTournamentPredictionCompletion`

### `app/[locale]/tournaments/[id]/qualified-teams/page.tsx` *(modified)*

- Compute `tournamentStartDate` from already-fetched `games` and pass as 4th arg to `getTournamentPredictionCompletion`

---

## Implementation Notes

### Kysely Syntax for Conditional Aggregation

Use `eb.fn.count(eb.case().when(...condition...).then(eb.lit(1)).end())` pattern for COUNT(CASE WHEN). Example:
```ts
(eb) => eb.fn.count<number>(
  eb.case()
    .when(eb.and([
      eb('gg.home_score', 'is not', null),
      eb('gg.away_score', 'is not', null),
    ]))
    .then(eb.lit(1))
    .end()
).as('completed_group_games')
```

### LEFT JOIN with Extra Condition

Use callback form to filter the join to the specific user:
```ts
.leftJoin('game_guesses as gg', (join) =>
  join.onRef('gg.game_id', '=', 'games.id').on('gg.user_id', '=', userId)
)
```

This ensures each game row appears once regardless of whether the user has a guess, allowing total counts to be computed in the same pass as completed counts.

### Backward Compatibility

- `firstGameDate` is optional (`Date | null | undefined`). When `undefined` (not passed), the function falls back to calling `getTournamentStartDate` as before. All existing callers continue to work without changes.
- The function return type `TournamentPredictionCompletion` is unchanged.

---

## Testing Strategy

**Existing tests (no changes needed):**
- `app/actions/__tests__/hub-actions.test.ts` — mocks `getTournamentPredictionCompletion` at module level; unaffected by internal implementation changes
- `app/actions/__tests__/hub-actions-priority.test.ts` — tests `computePriorityAttention` utility; no repository dependency

**New tests to add:**
Create `app/db/__tests__/tournament-prediction-completion-repository.test.ts` with:
- Tests for `fetchGameAndBoostStats` (indirectly via `getTournamentPredictionCompletion` by mocking `db`)
- Tests for `fetchPlayoffRoundsWithCompletion` (indirectly)
- Tests for `getTournamentPredictionCompletion` verifying:
  - `firstGameDate` param eliminates the `getTournamentStartDate` call
  - `getTournamentStartDate` IS called when `firstGameDate` is not provided
  - Correct computation of `isPredictionLocked`
  - Correct derivation of `totalQualifierSlots` from first-stage rounds

**Test setup pattern** (follow `app/db/__tests__/tournament-playoff-repository.test.ts`):
```ts
vi.mock('@/app/db/tournament-prediction-completion-repository', ...)
vi.mock('@/app/db/tournament-guess-repository', () => ({ findTournamentGuessByUserIdTournament: vi.fn() }))
vi.mock('@/app/db/qualified-teams-repository', () => ({ getAllUserGroupPositionsPredictions: vi.fn() }))
vi.mock('@/app/actions/tournament-actions', () => ({ getTournamentStartDate: vi.fn() }))
// Use testFactories.createGame(), testFactories.createGameGuess() for test data
// Mock db.selectFrom(...).leftJoin(...).select(...).executeTakeFirst() / .execute() via vi.fn()
```

---

## Implementation Amendments

### Amendment 1: `qualified-teams/page.tsx` — `firstGameDate` optimization deferred
**Date:** 2026-05-05
**Reason:** The plan called for passing `tournamentStartDate` (derived from `games`) as the 4th arg to `getTournamentPredictionCompletion` in this page. However, `getAllTournamentGames` and `getTournamentPredictionCompletion` run in the same `Promise.all` (lines 217–222), so `games` is not available before the call without restructuring the data fetching into two sequential awaits. The optimization was deferred to avoid that scope expansion. The page continues to work correctly — it falls back to the internal `getTournamentStartDate` call as before.
**Change:** File was NOT modified. Optimization remains applicable as a follow-on story.

---

## Verification

1. Run `npm run test` — all existing tests must pass
2. Run `npm run lint` — no lint errors
3. Run `npm run build` — clean build
4. Load the hub page in Vercel Preview as an authenticated user with partial predictions and verify:
   - Progress bar shows correct %
   - "X/64 games predicted" count is accurate
   - Silver/golden boost counters match
   - Qualifiers and awards completion indicators are correct
5. (Optional) Check DB query logs / performance panel to confirm fewer sequential queries
