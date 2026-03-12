# Plan: Stop Writing to Yesterday-Score Columns (#283)

## Context

Story #272 introduced `tournament_score_history` as the canonical store for daily score snapshots.
Story #277 removed all **reads** of the `yesterday_*` columns from `tournament_guesses`, replacing them with reads from `tournament_score_history`. Now that nothing reads those columns, writing to them is wasted I/O. This story removes all write paths so the columns sit idle before Story #278 drops them entirely.

A score-history audit performed during planning also revealed a **bug**: `calculateAndStoreQualifiedTeamsScores()` updates `qualified_teams_score` in `tournament_guesses` but never calls `writeScoreSnapshot()`, so qualified-teams scoring events are not recorded in `tournament_score_history`. This story fixes that gap too.

## Acceptance Criteria

- No code writes to `yesterday_tournament_score`, `yesterday_total_game_score`, `yesterday_boost_bonus`, or `last_score_update_date` in `tournament_guesses`
- `legacyGetGameGuessStatisticsForUsers` no longer computes the two `yesterday_*` SQL aggregation columns
- `updateTournamentGuessWithSnapshot` is deleted; its 2 callers in `backoffice-actions.ts` call `updateTournamentGuess` directly
- `updateTournamentGuessByUserIdTournamentWithSnapshot` (dead code — never called) is deleted
- `writeScoreSnapshot` calls (→ `tournament_score_history`) are called in ALL score-update paths, including `calculateAndStoreQualifiedTeamsScores` (bug fix)
- All tests pass; new/updated tests cover changed functions

## Score-Write Path Audit

| Path | Updates | writeScoreSnapshot? | Status |
|------|---------|-------------------|--------|
| `recalculateGameScoresForUsers` | game scores, boosts | ✅ yes | Safe |
| `updateTournamentAwards` | `individual_awards_score` | ✅ yes | Safe |
| `updateTournamentHonorRoll` | `honor_roll_score` | ✅ yes | Safe |
| `calculateAndStoreQualifiedTeamsScores` | `qualified_teams_score` | ❌ missing | **Bug — fix in this story** |

`group_position_score` has no active write path beyond initial record creation — no gap.

## Technical Approach

### 1. `app/db/tournament-guess-repository.ts`

**Delete `updateTournamentGuessWithSnapshot` (lines 28–56)**
The function was a thin wrapper around `updateTournamentGuess` that also wrote `yesterday_tournament_score` and `last_score_update_date`. After removal, its 2 callers in `backoffice-actions.ts` call `updateTournamentGuess` directly. Function name was misleading — the actual snapshot (to the history table) was always done by the caller.

**Delete `updateTournamentGuessByUserIdTournamentWithSnapshot` (lines 76–105)**
Dead code — no callers anywhere in the codebase.

**`TournamentGuessStats` type (lines 123–132) + `getTournamentGuessStatsForUsers` (lines 138–158)**
Remove `yesterday_tournament_score` from the type definition and from the `.select([...])` list.

**`recalculateGameScoresForUsers` (lines 240–259)**
Remove `yesterday_total_game_score` and `yesterday_boost_bonus` from the `updates` object. The `legacyGetGameGuessStatisticsForUsers` call stays — it's still needed for all other materialized fields.

### 2. `app/db/game-guess-repository.ts`

**`legacyGetGameGuessStatisticsForUsers` (lines 205–233)**
Remove `yesterday_total_score` (lines 208–217) and `yesterday_boost_bonus` (lines 220–233) from the SQL select. `last_game_date` stays. `GameStatisticForUser` in `types/definitions.ts` already omits these fields so the `as` cast is safe.

### 3. `app/actions/backoffice-actions.ts`

Both callers of `updateTournamentGuessWithSnapshot` are updated to call `updateTournamentGuess` directly. The `writeScoreSnapshot` calls after each are **unchanged**:

```typescript
// updateTournamentAwards — line 582
const updatedGuess = await updateTournamentGuess(tournamentGuess.id, {
  individual_awards_score: awardsScore
})

// updateTournamentHonorRoll — line 633
const updatedGuess = await updateTournamentGuess(tournamentGuess.id, {
  honor_roll_score: honorRollScore
})
```

Remove the import of `updateTournamentGuessWithSnapshot` from `backoffice-actions.ts`.

### 4. `app/actions/qualified-teams-scoring-actions.ts` (bug fix)

Inside the per-user loop, change the upsert to use `.returningAll().executeTakeFirst()` so we get the full updated row without an extra DB query. Then call `writeScoreSnapshot` with all 6 score segments:

```typescript
const upsertedRow = await db
  .insertInto('tournament_guesses')
  .values({ user_id: userId, tournament_id: tournamentId, qualified_teams_score: ..., ... })
  .onConflict(oc => oc.columns(['user_id', 'tournament_id']).doUpdateSet({ ... }))
  .returningAll()
  .executeTakeFirst();

if (upsertedRow) {
  await writeScoreSnapshot({
    user_id: userId,
    tournament_id: tournamentId,
    snapshot_date: getTodayYYYYMMDD(),
    total_game_score: upsertedRow.total_game_score ?? 0,
    total_boost_bonus: upsertedRow.total_boost_bonus ?? 0,
    honor_roll_score: upsertedRow.honor_roll_score ?? 0,
    individual_awards_score: upsertedRow.individual_awards_score ?? 0,
    qualified_teams_score: upsertedRow.qualified_teams_score ?? 0,
    group_position_score: upsertedRow.group_position_score ?? 0,
  });
}
```

Add imports: `writeScoreSnapshot` from `score-history-repository`, `getTodayYYYYMMDD` from `date-utils`.

### 5. Test updates

**`__tests__/db/tournament-guess-repository.test.ts`:**
- Remove `yesterday_total_score` and `yesterday_boost_bonus` from all `mockStats` objects (~7 occurrences)
- In `"should handle partial stats with null values"` test: remove `yesterday_total_game_score: 0` and `yesterday_boost_bonus: 0` from `expect.objectContaining` assertion (lines 381–382)
- Add tests for the deleted `updateTournamentGuessWithSnapshot` replacement behavior — since callers now use `updateTournamentGuess` directly, no new wrapper tests needed; remove any existing tests for `updateTournamentGuessWithSnapshot` if they exist (currently none in the test file)

**`__tests__/actions/stats-actions.test.ts`:**
- Remove `yesterday_tournament_score: undefined` from `mockTournamentGuesses` entries (lines ~65, 75)

**New test file: `__tests__/actions/qualified-teams-scoring-actions.test.ts`** (or update existing if one exists):
- `calculateAndStoreQualifiedTeamsScores` calls `writeScoreSnapshot` for each user after upserting
- `writeScoreSnapshot` receives all 6 score segments from the upserted row
- `writeScoreSnapshot` is NOT called when upsert returns undefined
- `writeScoreSnapshot` is NOT called when `userIds` is empty (early return)

### 6. `docs/code-structure/db.md`

Update descriptions for:
- `tournament-guess-repository`: Remove `updateTournamentGuessWithSnapshot` and `updateTournamentGuessByUserIdTournamentWithSnapshot`; update `TournamentGuessStats` type, `getTournamentGuessStatsForUsers`, `recalculateGameScoresForUsers`
- `game-guess-repository`: Update `legacyGetGameGuessStatisticsForUsers` — note `yesterday_*` columns removed

Update for `qualified-teams-scoring-actions.ts` if it appears in `docs/code-structure/actions.md`.

## Mid-Level Design

### Call Graph Changes

No flow additions or removals. `calculateAndStoreQualifiedTeamsScores` now calls `writeScoreSnapshot` — this is an addition to an existing flow, not a new flow.

### `app/db/tournament-guess-repository.ts` *(modified)*

**Deleted functions:**
- `updateTournamentGuessWithSnapshot` — deleted; callers updated to use `updateTournamentGuess`
- `updateTournamentGuessByUserIdTournamentWithSnapshot` — deleted (dead code)

**Changed functions:**

- **`TournamentGuessStats`** *(type)*: Remove `yesterday_tournament_score` field.

- **`getTournamentGuessStatsForUsers(userIds: string[], tournamentId: string)`**: `Promise<TournamentGuessStats[]>`
  Select list no longer includes `yesterday_tournament_score`.
  Calls: `db.selectFrom`
  Tests:
  - returns stats without `yesterday_tournament_score` field
  - returns empty array when userIds is empty
  - returns expected fields for valid users

- **`recalculateGameScoresForUsers(userIds: string[], tournamentId: string)`**: `Promise<TournamentGuess[]>`
  `updates` object no longer includes `yesterday_total_game_score` or `yesterday_boost_bonus`.
  Calls: `legacyGetGameGuessStatisticsForUsers`, `findTournamentGuessByUserIdTournament`, `createTournamentGuess`, `updateTournamentGuessByUserIdTournament`, `writeScoreSnapshot`
  Tests:
  - does NOT include `yesterday_total_game_score` in the DB update payload (update existing assertion)
  - does NOT include `yesterday_boost_bonus` in the DB update payload (update existing assertion)
  - still calls `writeScoreSnapshot` with correct score segments (existing test unchanged)

### `app/db/game-guess-repository.ts` *(modified)*

**Changed functions:**

- **`legacyGetGameGuessStatisticsForUsers(userIds: string[], tournamentId: string)`**: `Promise<GameStatisticForUser[]>`
  SQL no longer computes `yesterday_total_score` or `yesterday_boost_bonus`.
  Calls: `db.selectFrom` (Kysely)
  Tests:
  - returned objects do not contain `yesterday_total_score` or `yesterday_boost_bonus`
  - still returns `total_score`, `total_boost_bonus`, `group_score`, etc.
  - returns empty array when no matching users

### `app/actions/backoffice-actions.ts` *(modified)*

**Changed functions:**

- **`updateTournamentAwards(tournamentId, withUpdate, locale)`**: `Promise<(TournamentGuess | undefined)[]>`
  Calls `updateTournamentGuess` instead of `updateTournamentGuessWithSnapshot`. Behavior is identical — `writeScoreSnapshot` call is unchanged.
  Calls: `updateTournament`, `findTournamentById`, `findTournamentGuessByTournament`, `updateTournamentGuess`, `writeScoreSnapshot`
  Tests: existing tests unchanged (mock changes only — swap `updateTournamentGuessWithSnapshot` mock for `updateTournamentGuess`)

- **`updateTournamentHonorRoll(tournamentId, withUpdate, locale)`**: `Promise<...>`
  Same pattern as above.
  Tests: same approach

### `app/actions/qualified-teams-scoring-actions.ts` *(modified — bug fix)*

**Changed functions:**

- **`calculateAndStoreQualifiedTeamsScores(tournamentId, locale)`**: `Promise<BatchScoringResult>`
  Upsert now uses `.returningAll().executeTakeFirst()`. Calls `writeScoreSnapshot` for each successfully upserted user.
  Calls: `findTournamentById`, `db.selectFrom`, `db.updateTable`, `calculateQualifiedTeamsScore`, `db.insertInto`, `writeScoreSnapshot`, `getTodayYYYYMMDD`, `revalidatePath`
  Tests:
  - calls `writeScoreSnapshot` with all 6 score segments for each processed user
  - `writeScoreSnapshot` receives `qualified_teams_score` equal to calculated score
  - does not call `writeScoreSnapshot` when upsert returns undefined
  - does not call `writeScoreSnapshot` when no users have predictions (early return)

## Files to Create/Modify

| File | Change |
|------|--------|
| `app/db/tournament-guess-repository.ts` | Delete 2 functions, remove snapshot writes, clean up type |
| `app/db/game-guess-repository.ts` | Remove `yesterday_*` SQL columns |
| `app/actions/backoffice-actions.ts` | Replace `WithSnapshot` calls with `updateTournamentGuess` |
| `app/actions/qualified-teams-scoring-actions.ts` | Bug fix: add `writeScoreSnapshot` calls |
| `__tests__/db/tournament-guess-repository.test.ts` | Update mocks/assertions |
| `__tests__/actions/stats-actions.test.ts` | Remove stale mock field |
| `__tests__/actions/qualified-teams-scoring-actions.test.ts` | New tests for snapshot writes |
| `docs/code-structure/db.md` | Update function descriptions |
| `docs/code-structure/actions.md` | Update `qualified-teams-scoring-actions` description |

## Testing Strategy

- Run full test suite — all tests must pass
- Existing `tournament-guess-repository.test.ts` test updates: remove yesterday fields from mocks/assertions
- New tests in `qualified-teams-scoring-actions.test.ts` covering snapshot write behavior
- No migrations required (columns remain until Story #278)
- SonarCloud: removing dead code reduces cognitive complexity; bug fix adds new code paths requiring ≥80% coverage

## Validation Considerations

- No migrations required
- No UI impact (reads removed in #277)
- Score history will now be complete — qualified teams scoring events will appear in rank history
