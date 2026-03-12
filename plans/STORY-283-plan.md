# Plan: Stop Writing to Yesterday-Score Columns (#283)

## Context

Story #272 introduced `tournament_score_history` as the canonical store for daily score snapshots.
Story #277 removed all **reads** of the `yesterday_*` columns from `tournament_guesses`, replacing them with reads from `tournament_score_history`. Now that nothing reads those columns, writing to them is wasted I/O. This story removes all write paths so the columns sit idle before Story #278 drops them entirely.

## Acceptance Criteria

- No code writes to `yesterday_tournament_score`, `yesterday_total_game_score`, `yesterday_boost_bonus`, or `last_score_update_date` in `tournament_guesses`
- `legacyGetGameGuessStatisticsForUsers` no longer computes the two `yesterday_*` SQL aggregation columns
- `updateTournamentGuessByUserIdTournamentWithSnapshot` (dead code — never called) is deleted
- `writeScoreSnapshot` calls (→ `tournament_score_history`) are **unchanged**
- All tests pass; new/updated tests cover changed functions

## Technical Approach

### 1. `app/db/tournament-guess-repository.ts`

**`updateTournamentGuessWithSnapshot` (lines 28–56)**

Remove the entire snapshot block (lines 38–53). The function retains its signature so callers in `backoffice-actions.ts` don't need updating. Body becomes a single delegation:

```typescript
export async function updateTournamentGuessWithSnapshot(
  guessId: string,
  updates: TournamentGuessUpdate
): Promise<TournamentGuess | undefined> {
  return updateTournamentGuess(guessId, updates);
}
```

Remove the `getTodayYYYYMMDD` import if it's no longer used elsewhere in this file (it's still used in `recalculateGameScoresForUsers` line 272, so it stays).

**`updateTournamentGuessByUserIdTournamentWithSnapshot` (lines 76–105)**

Delete entirely — confirmed no callers anywhere in the codebase.

**`TournamentGuessStats` type (line 123–132) and `getTournamentGuessStatsForUsers` (lines 138–158)**

Remove `yesterday_tournament_score` field from both:
- `TournamentGuessStats` type definition
- `.select([...])` list in `getTournamentGuessStatsForUsers`

**`recalculateGameScoresForUsers` (lines 240–259)**

Remove the two yesterday fields from the `updates` object:
```diff
- yesterday_total_game_score: stats?.yesterday_total_score || 0,
- yesterday_boost_bonus: stats?.yesterday_boost_bonus || 0,
```
The `legacyGetGameGuessStatisticsForUsers` call stays — it's still needed for all other materialized score fields.

### 2. `app/db/game-guess-repository.ts`

**`legacyGetGameGuessStatisticsForUsers` (lines 205–233)**

Remove the two `yesterday_*` computed columns from the SQL select:
- `yesterday_total_score` (lines 208–217)
- `yesterday_boost_bonus` (lines 220–233)

`last_game_date` stays (still written to `last_game_score_update_at`).

### 3. Test updates — `__tests__/db/tournament-guess-repository.test.ts`

- Remove `yesterday_total_score` and `yesterday_boost_bonus` from all `mockStats` objects passed to `mockLegacyGetGameGuessStatisticsForUsers` (lines ~68, 161, 223, 408, 468, 534)
- In the `"should handle partial stats with null values"` test (lines ~375–384): remove `yesterday_total_game_score: 0` and `yesterday_boost_bonus: 0` from the `expect.objectContaining(...)` assertion — these fields will no longer be in the `updates` object
- Add tests for the simplified `updateTournamentGuessWithSnapshot`:
  - returns updated guess when record exists
  - returns undefined when record does not exist
  - does NOT write `yesterday_tournament_score` or `last_score_update_date` to the update payload
- Keep the test "should preserve snapshot fields for rank tracking" (line 704) — it tests `updateOrCreateTournamentGuess` which is unchanged

### 4. Test updates — `__tests__/actions/stats-actions.test.ts`

- Remove `yesterday_tournament_score: undefined` from `mockTournamentGuesses` entries — the `TournamentGuessStats` type will no longer include that field, so the mock data should stay in sync

### 4. `docs/code-structure/db.md`

Update entries for:
- `tournament-guess-repository`: Remove `updateTournamentGuessByUserIdTournamentWithSnapshot` from function list; update descriptions for `updateTournamentGuessWithSnapshot`, `getTournamentGuessStatsForUsers`, `recalculateGameScoresForUsers`, and `TournamentGuessStats` type
- `game-guess-repository`: Update `legacyGetGameGuessStatisticsForUsers` description to note `yesterday_*` columns removed

## Mid-Level Design

### Call Graph Changes

No call graph changes. No new flows added or removed. `recalculateGameScoresForUsers` still calls `legacyGetGameGuessStatisticsForUsers` and `writeScoreSnapshot`. The `updateTournamentGuessWithSnapshot` callers in `backoffice-actions.ts` are unchanged.

### `app/db/tournament-guess-repository.ts` *(modified)*

**Changed functions:**

- **`updateTournamentGuessWithSnapshot(guessId: string, updates: TournamentGuessUpdate)`**: `Promise<TournamentGuess | undefined>`
  Body reduced to `return updateTournamentGuess(guessId, updates)`. No more daily-snapshot detection or writes to `yesterday_tournament_score`/`last_score_update_date`.
  Calls: `updateTournamentGuess`
  Tests:
  - returns updated guess when record exists
  - returns undefined when record does not exist
  - does NOT write `yesterday_tournament_score` or `last_score_update_date` to the update payload

- **`getTournamentGuessStatsForUsers(userIds: string[], tournamentId: string)`**: `Promise<TournamentGuessStats[]>`
  `TournamentGuessStats` type and select list no longer include `yesterday_tournament_score`.
  Calls: `db.selectFrom`
  Tests:
  - returns stats without `yesterday_tournament_score` field
  - returns empty array when userIds is empty

- **`recalculateGameScoresForUsers(userIds: string[], tournamentId: string)`**: `Promise<TournamentGuess[]>`
  Updates object no longer includes `yesterday_total_game_score` or `yesterday_boost_bonus`. The `"should handle partial stats with null values"` test must have those two fields removed from its `expect.objectContaining` assertion.
  Calls: `legacyGetGameGuessStatisticsForUsers`, `findTournamentGuessByUserIdTournament`, `createTournamentGuess`, `updateTournamentGuessByUserIdTournament`, `writeScoreSnapshot`
  Tests:
  - does NOT include `yesterday_total_game_score` in the DB update payload (update existing test assertion)
  - does NOT include `yesterday_boost_bonus` in the DB update payload (update existing test assertion)
  - still calls `writeScoreSnapshot` with correct score segments (existing test unchanged)

**Deleted functions:**

- `updateTournamentGuessByUserIdTournamentWithSnapshot` — dead code, no callers

### `app/db/game-guess-repository.ts` *(modified)*

**Changed functions:**

- **`legacyGetGameGuessStatisticsForUsers(userIds: string[], tournamentId: string)`**: `Promise<GameStatisticForUser[]>`
  SQL query no longer computes `yesterday_total_score` or `yesterday_boost_bonus` columns. Return type `GameStatisticForUser` already does not include these fields (they were extra untyped fields). `last_game_date` remains.
  Calls: `db.selectFrom` (Kysely)
  Tests:
  - returned objects do not contain `yesterday_total_score` or `yesterday_boost_bonus` properties
  - still returns `total_score`, `total_boost_bonus`, `group_score`, etc.
  - returns empty array when no matching users

## Files to Create/Modify

| File | Change |
|------|--------|
| `app/db/tournament-guess-repository.ts` | Remove snapshot writes, delete dead function, clean up type |
| `app/db/game-guess-repository.ts` | Remove `yesterday_*` SQL columns from legacy aggregation |
| `__tests__/db/tournament-guess-repository.test.ts` | Update mocks and assertions |
| `docs/code-structure/db.md` | Update function descriptions |

## Testing Strategy

- Run existing test suite — all tests must pass
- Update tests in `tournament-guess-repository.test.ts`:
  - Remove `yesterday_total_score`/`yesterday_boost_bonus` from mock stats objects
  - Replace assertion checking `yesterday_total_game_score`/`yesterday_boost_bonus` are in DB update with assertion they are NOT
  - Add tests for simplified `updateTournamentGuessWithSnapshot` (no snapshot side-effects)
- No new test files needed — changes are confined to two well-tested repository modules
- SonarCloud: all changes reduce code, no new code branches, coverage should hold

## Validation Considerations

- No migrations required (columns remain until Story #278)
- No UI impact (reads were already removed by Story #277)
- SonarCloud: removing dead code and SQL columns should not introduce new issues
- Verify `writeScoreSnapshot` call still works end-to-end (no change to its inputs)
