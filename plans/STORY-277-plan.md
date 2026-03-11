# Plan: Leaderboard Rank Changes Based on Score History Snapshots (#277)

## Context

The leaderboard rank change arrows currently read `yesterday_*` materialized columns from the DB. This story replaces them entirely with history-snapshot-based rank changes and removes ALL code that reads `yesterday_*` columns, so Story 2 can drop the DB columns with no code changes.

`yesterday_*` **write** logic (snapshot updates in backoffice-actions, tournament-guess-repository) is **not changed** — that's Story 2.

---

## Behavioral Specification

- **Rank change** = rank at penultimate snapshot date − rank at latest snapshot date (positive = up)
- **LOCF**: score at a date = last known snapshot on or before that date; users with **no prior snapshot** get score **0** (ranked last), not excluded
- **< 2 distinct snapshot dates**: No rank change shown (no animation, no arrows)
- **No history**: Same

---

## Complete Change Inventory

### Removed: All `yesterday_*` reads from code

| Location | What's removed |
|----------|----------------|
| `app/db/game-guess-repository.ts` — `getGameGuessStatisticsForUsers` | Remove select of `yesterday_total_game_score as yesterday_total_score`, `yesterday_boost_bonus`; remove from return type |
| `app/definitions.ts` — `GameStatisticForUser` type | Remove `yesterday_total_score`, `yesterday_boost_bonus` fields |
| `app/actions/prode-group-actions.ts` — `getUserScoresForTournament` | Remove `yesterdayTotalPoints` assembly (reading `yesterday_total_score`, `yesterday_boost_bonus`, `yesterday_tournament_score`) |
| `app/definitions.ts` — `UserScore` | Remove `yesterdayTotalPoints?: number` |
| `app/components/leaderboard/types.ts` — `LeaderboardUser` | Remove `yesterdayTotalPoints?: number` |
| `app/components/friend-groups/friends-group-table.tsx` | Remove explicit `yesterdayTotalPoints: score.yesterdayTotalPoints` copy in transform |
| `app/components/leaderboard/LeaderboardCards.tsx` | Remove all `yesterdayTotalPoints` / `hasYesterdayData` references |
| `scripts/validate-materialized-scores.ts` | Remove `yesterday_boost_bonus` AND `yesterday_total_score` from `fieldsToCheck` |

Note: `getTournamentGuessStatsForUsers` in tournament-guess-repository.ts selects `yesterday_tournament_score`. Since `getUserScoresForTournament` no longer assembles `yesterdayTotalPoints`, this field is simply unused after the action change. No repo change needed — Story 2 will drop it.

### Added: History-based snapshot scores

| Location | What's added |
|----------|--------------|
| `app/actions/score-history-actions.ts` — `buildForwardFilledMap` | LOCF fix: score=0 before first snapshot |
| `app/actions/score-history-actions.ts` | Export `computeSnapshotScores` utility |
| `app/definitions.ts` — `UserScore` | Add `latestSnapshotPoints?: number`, `penultimateSnapshotPoints?: number` |
| `app/components/leaderboard/types.ts` — `LeaderboardUser` | Add same two fields |
| `app/[locale]/friend-groups/[id]/page.tsx` | Compute + patch snapshot scores from history onto user scores |
| `app/[locale]/tournaments/[id]/friend-groups/[group_id]/page.tsx` | Same |
| `app/components/leaderboard/LeaderboardCards.tsx` | Use new fields for animation and rank change |

---

## Technical Approach

### 1. LOCF fix — `buildForwardFilledMap` (score-history-actions.ts)

```typescript
// Before: excludes users with no prior data
if (lastKnown !== undefined) filled.set(date, lastKnown);

// After: score=0 before first snapshot
filled.set(date, lastKnown ?? 0);
// Remove `if (filled.size > 0)` guard — every user always gets entries
```

Effect: all group members now appear in history from the first snapshot date of any member. New users are ranked last (score=0) before their first snapshot. Affects History tab charts (lines start at 0 for new users) and rank computations.

### 2. New exported utility — `computeSnapshotScores` (score-history-actions.ts)

**Dependency chain:** `buildForwardFilledMap` (modified in step 1) is called inside `getScoreHistoryForGroup`, which populates `ScoreHistoryResult.userHistories`. Each `UserScoreHistory.data` array already reflects the score=0 LOCF behavior — every user has an entry at every snapshot date. `computeSnapshotScores` simply reads these pre-filled `userHistories`; it does NOT re-run LOCF logic. The `?? 0` fallbacks in the algorithm below are safety nets only; with the step-1 fix in place, they will never fire.

```typescript
export function computeSnapshotScores(
  userHistories: UserScoreHistory[]
): Map<string, { latest: number; penultimate: number | undefined }>
```

Algorithm:
1. Collect all distinct dates from `userHistories[*].data[*].date`, sort ascending
2. `latestDate = sortedDates[last]`; `penultimateDate = sortedDates[last-2]` (undefined if < 2 dates)
3. For each user: `latest = data.find(p => p.date === latestDate)?.totalPoints ?? 0`
4. For each user: `penultimate = penultimateDate ? (data.find(p => p.date === penultimateDate)?.totalPoints ?? 0) : undefined`
5. Returns Map — all users included; LOCF with score=0 guarantees entries at all dates

### 3. Remove `yesterday_*` reads from DB layer

**`app/db/game-guess-repository.ts` — `getGameGuessStatisticsForUsers`:**
Remove the two `yesterday_*` selects:
```typescript
// Remove:
'yesterday_total_game_score as yesterday_total_score',
'yesterday_boost_bonus',
```
Remove from the return type. Callers that used these fields must be updated (only `getUserScoresForTournament`).

**`app/db/tournament-guess-repository.ts` — `getTournamentGuessStatsForUsers`:**
Remove `yesterday_tournament_score` from the select. Only `getUserScoresForTournament` consumed this field.

### 4. Remove `yesterdayTotalPoints` assembly from action

**`app/actions/prode-group-actions.ts` — `getUserScoresForTournament`:**
Remove:
```typescript
// Remove these lines:
yesterdayTotalPoints:
  (gameStats?.yesterday_total_score || 0) +
  (gameStats?.yesterday_boost_bonus || 0) +
  (tournamentGuess?.yesterday_tournament_score || 0),
```
`UserScore.yesterdayTotalPoints` field is also removed from `app/definitions.ts`.

### 5. Patch snapshot scores in pages

Both pages already call `getScoreHistoryForGroup` for the History tab. After fetching:

```typescript
const snapshotScores = computeSnapshotScores(historyResult.userHistories)

const patchedScores = scores.map(score => {
  const snapshots = snapshotScores.get(score.userId)
  return {
    ...score,
    latestSnapshotPoints: snapshots?.latest,
    penultimateSnapshotPoints: snapshots?.penultimate,
  }
})
```

**Global page (`friend-groups/[id]/page.tsx`):** `userScoresByTournament` is `const` — build a new `patchedUserScoresByTournament` via `Object.fromEntries`.

**Tournament-scoped page:** Same — patch `userScores` before building `userScoresByTournament`.

### 6. Update LeaderboardCards

Replace all `yesterdayTotalPoints` / `hasYesterdayData` usage:

```typescript
// Before:
const hasYesterdayData = scores.some(s => s.yesterdayTotalPoints !== undefined)
const scoreField = sortBy === 'yesterday' ? 'yesterdayTotalPoints' : 'totalPoints'
// calculateRanksWithChange(..., 'yesterdayTotalPoints')

// After:
const hasSnapshotHistory = scores.some(s => s.penultimateSnapshotPoints !== undefined)
// Animation: 'yesterday' → 'today' phases still work, just different field names
const scoreField = sortBy === 'yesterday'
  ? 'penultimateSnapshotPoints'
  : (scores.some(s => s.latestSnapshotPoints !== undefined) ? 'latestSnapshotPoints' : 'totalPoints')
// calculateRanksWithChange(..., 'penultimateSnapshotPoints')
```

`transformToLeaderboardUser`: replace `yesterdayTotalPoints` with `latestSnapshotPoints` + `penultimateSnapshotPoints`.

`calculateRanksWithChange` function itself is unchanged (it's generic). Rename its `yesterdayScoreField` parameter to `comparisonScoreField`.

### 7. friends-group-table.tsx

Remove explicit `yesterdayTotalPoints: score.yesterdayTotalPoints` line from score transform — the `...score` spread will carry `latestSnapshotPoints` and `penultimateSnapshotPoints` automatically.

---

## Files to Modify

| File | Change |
|------|--------|
| `app/actions/score-history-actions.ts` | LOCF fix + export `computeSnapshotScores` |
| `app/definitions.ts` | Remove `yesterdayTotalPoints`, add `latestSnapshotPoints`/`penultimateSnapshotPoints` to `UserScore`; remove yesterday fields from `GameStatisticForUser` |
| `app/db/game-guess-repository.ts` | Remove `yesterday_*` selects from `getGameGuessStatisticsForUsers` |
| ~~`app/db/tournament-guess-repository.ts`~~ | No changes — `findTournamentGuessByUserIdsTournament` (used by leaderboard) does `selectAll()` so the field exists in the row but we simply stop using it. `getTournamentGuessStatsForUsers` is used by the stats page (unrelated). Repo cleanup is Story 2. |
| `app/actions/prode-group-actions.ts` | Remove `yesterdayTotalPoints` assembly |
| `app/components/leaderboard/types.ts` | Remove `yesterdayTotalPoints`, add snapshot fields to `LeaderboardUser` |
| `app/components/leaderboard/LeaderboardCards.tsx` | Use snapshot fields for animation + rank change |
| `app/components/friend-groups/friends-group-table.tsx` | Remove explicit `yesterdayTotalPoints` copy |
| `app/utils/rank-calculator.ts` | Rename `yesterdayScoreField` → `comparisonScoreField` |
| `app/[locale]/friend-groups/[id]/page.tsx` | Compute + patch snapshot scores |
| `app/[locale]/tournaments/[id]/friend-groups/[group_id]/page.tsx` | Same |
| `scripts/validate-materialized-scores.ts` | Remove `yesterday_boost_bonus` AND `yesterday_total_score` from `fieldsToCheck` |

## Tests to Update

| File | Change |
|------|--------|
| `__tests__/actions/score-history-actions.test.ts` | Update LOCF tests (score=0); **update existing test 5** (user-B at day1 must assert `totalPoints: 0`, not `toBeUndefined`); add `computeSnapshotScores` tests |
| `__tests__/db/game-guess-repository-materialized.test.ts` | Remove assertions for `yesterday_total_score`/`yesterday_boost_bonus` |
| `__tests__/actions/prode-group-actions.test.ts` | Remove `yesterdayTotalPoints` assertions from `getUserScoresForTournament` tests |
| `__tests__/utils/rank-calculator.test.ts` | Rename `yesterdayTotalPoints` → `penultimateSnapshotPoints` in test fixtures |
| `__tests__/components/tournament-page/user-tournament-statistics.test.tsx` | Remove `yesterday_total_score: null` and `yesterday_boost_bonus: null` from mock `GameStatisticForUser` fixtures (TypeScript will error when fields are removed from type) |

**Not changed** (Story 2): `__tests__/db/tournament-guess-repository.test.ts` — tests snapshot *write* logic, stays until columns are dropped.

---

## Mid-Level Design

### Call Graph Changes

**Modified flows:**
- **Both friend-group pages** — after fetching `historyData`, call `computeSnapshotScores` → patch `latestSnapshotPoints` + `penultimateSnapshotPoints` onto each `UserScore`; `getUserScoresForTournament` no longer returns `yesterdayTotalPoints`
- **`LeaderboardCards`** — animation and rank change now driven by `penultimateSnapshotPoints` / `latestSnapshotPoints` instead of `yesterdayTotalPoints`

**New flows:** none

---

### `app/actions/score-history-actions.ts` *(modified)*

**Changed functions:**
- **`buildForwardFilledMap`** — private; change `if (lastKnown !== undefined) filled.set(...)` to `filled.set(date, lastKnown ?? 0)`; remove size guard
  Tests:
  - user with no snapshots gets score=0 for all dates when other users have snapshots
  - user whose first snapshot is date[-1] gets score=0 at date[-2] (existing test 5 assertion flipped: `toBeUndefined` → assert entry exists with `totalPoints: 0`)
  - existing LOCF carry-forward behavior unchanged for users with prior snapshots

**New functions:**
- **`computeSnapshotScores(userHistories: UserScoreHistory[]): Map<string, { latest: number; penultimate: number | undefined }>`**
  Returns latest and penultimate LOCF scores per user. Returns empty Map if no histories. `penultimate` is undefined when fewer than 2 distinct dates exist.
  Calls: (none — pure data transformation)
  Tests:
  - returns empty Map when `userHistories` is empty
  - `penultimate` is `undefined` when only 1 distinct date
  - returns correct latest and penultimate when ≥2 dates exist
  - user with LOCF-carried score (no snapshot exactly on penultimate date) returns carried value
  - user with no snapshot before penultimate date returns 0 (from LOCF fix)
  - all users returned, no sparse exclusion

---

### `app/db/game-guess-repository.ts` *(modified)*

**Changed functions:**
- **`getGameGuessStatisticsForUsers`** — remove `yesterday_total_game_score as yesterday_total_score` and `yesterday_boost_bonus` from select; remove from return type

### `app/actions/prode-group-actions.ts` *(modified)*

**Changed functions:**
- **`getUserScoresForTournament`** — remove `yesterdayTotalPoints` from assembled `UserScore`; no longer reads yesterday fields from game/tournament stats

### `app/components/leaderboard/LeaderboardCards.tsx` *(modified)*

No new functions. Logic changes: replace `hasYesterdayData`/`yesterdayTotalPoints` with `hasSnapshotHistory`/`penultimateSnapshotPoints`/`latestSnapshotPoints` throughout.

### `app/utils/rank-calculator.ts` *(modified)*

**Changed functions:**
- **`calculateRanksWithChange`** — rename parameter `yesterdayScoreField` → `comparisonScoreField` (no behavior change)

---

## Testing Strategy

**Unit tests** (4 files updated, new cases for `computeSnapshotScores` + LOCF fix):
- `buildForwardFilledMap`: 3 new test cases
- `computeSnapshotScores`: 6 test cases (pure function, no mocks)

**Manual verification in Vercel Preview:**
1. Group with ≥2 snapshot dates → rank arrows reflect history
2. New user who just joined → shows as having moved up (from rank last)
3. Group with 0 or 1 snapshot date → no rank arrows (not even "—")
4. History tab charts → new users visible from score=0 before first snapshot
5. No leaderboard regression (scores displayed correctly, animation still works)

---

## CODE-STRUCTURE Files to Update

- `docs/code-structure/actions.md` — update `getUserScoresForTournament`, `buildForwardFilledMap`; add `computeSnapshotScores`
- `docs/code-structure/db.md` — update `getGameGuessStatisticsForUsers`, `getTournamentGuessStatsForUsers`
- `docs/code-structure/components/components-leaderboard.md` — update `LeaderboardCards`, `LeaderboardUser` type
- `docs/code-structure/pages.md` — update both friend-group pages
- Call graph: update both page flows

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| No history snapshots | `snapshotScores` empty → no patch → no animation, no arrows |
| Only 1 snapshot date | `penultimate = undefined` → no patch → same |
| User never played | LOCF gives score=0 → ranked last → rank change computed correctly when others have scores |
| New user (first snapshot = latest date) | score=0 at penultimate → rank change = (last rank) - (actual rank) = positive |
| `yesterday_*` DB columns | Still populated by backoffice writes; no code reads them after this story |
