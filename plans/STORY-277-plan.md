# Plan: Leaderboard Rank Changes Based on Score History Snapshots (#277)

## Context

The Friend Groups leaderboard currently shows rank change arrows (↑↓) using `yesterday_*` materialized columns in `tournament_guesses`. These have known problems: the "yesterday" concept resets when the first score update of the day runs, causing confusing rank arrows early in the day before any games are played.

Story #272 introduced `tournament_score_history` with daily snapshots. This story replaces the rank-change source by deriving it from the last two comparable snapshot dates using LOCF, without removing the old columns (that's Story 2).

---

## Behavioral Specification

- **Rank change** = rank at penultimate snapshot date − rank at latest snapshot date (positive = moved up)
- **LOCF**: Each user's score at a given date = their most recent snapshot on or before that date
- **< 2 distinct snapshot dates**: All rank changes = 0 (shown as "—" neutral indicator)
- **No history at all**: Same — all rank changes = 0
- **User with no snapshot at/before penultimate date**: Their penultimate score = 0 (treated as rank last); rank change is still computed correctly

---

## Key Insight: Reuse Already-Fetched History Data

Both pages already call `getScoreHistoryForGroup(allParticipants, tournamentId)` for the History tab. This returns `ScoreHistoryResult` with `UserScoreHistory[]`, where `data[]` is already LOCF-forward-filled across all distinct snapshot dates.

We derive the penultimate scores directly from this already-fetched data — **no additional DB query**.

---

## Technical Approach

### Step 1: New exported utility — `computePenultimateScores`

Add to `app/actions/score-history-actions.ts`:

```typescript
export function computePenultimateScores(
  userHistories: UserScoreHistory[]
): Map<string, number>
```

Algorithm:
1. Collect all distinct dates from all `userHistories[*].data[*].date`
2. Sort ascending
3. If `< 2` distinct dates → return `new Map()` (caller treats as "no rank change")
4. `penultimateDate = sortedDates[sortedDates.length - 2]`
5. For each user: `user.data.find(p => p.date === penultimateDate)`. This point exists iff the user had at least one snapshot on or before the penultimate date (LOCF carried it forward to that date). For users whose first snapshot is after the penultimate date, this returns `undefined`.
6. If found → `result.set(user.userId, point.totalPoints)`, else omit from map — such users are treated as having 0 points at penultimate date by callers (see patching logic notes below)
7. Return `Map<userId, penultimateScore>`

**Placement note:** `computePenultimateScores` is exported from `score-history-actions.ts` (a `'use server'` file) because it is a pure synchronous helper that operates on types defined in that file (`UserScoreHistory`). It has no async behavior and will not be treated as a server action. Both consuming pages are `'use server'` Server Components, so there is no issue. If it were needed in a client component in the future, it would need to be moved to a `utils/` file.

### Step 2: Patch `yesterdayTotalPoints` in pages

After both `userScoresByTournament` and `historyByTournament` (or `historyData`) are fetched, for each tournament:

```typescript
const penultimateScores = computePenultimateScores(historyResult.userHistories)

const patchedScores = scores.map(score => ({
  ...score,
  yesterdayTotalPoints: penultimateScores.size > 0
    ? (penultimateScores.get(score.userId) ?? 0)
    // ^ ?? 0 means "user had no snapshot before penultimate date → treated as 0 pts at that date,
    //   making them ranked last historically". NOT the same as "no rank change".
    : score.totalPoints,  // < 2 distinct snapshot dates → force rankChange = 0 for everyone
}))
```

- `penultimateScores.size > 0` → real rank changes from history; users missing from map get `0` (ranked last at penultimate date)
- `penultimateScores.size === 0` → set `yesterdayTotalPoints = totalPoints` → `rankChange = 0` → shows "—" for all users (correct per spec)

### Step 3: Update both pages

**`app/[locale]/friend-groups/[id]/page.tsx`**: Apply patching after the parallel tournament data fetches (after both `tournamentData` and `historyByTournament` are computed). `userScoresByTournament` is `const` — build a new `patchedUserScoresByTournament` object (or rebuild with `Object.fromEntries`) and use it in the JSX instead of `userScoresByTournament`.

**`app/[locale]/tournaments/[id]/friend-groups/[group_id]/page.tsx`**: Same — `historyData` and `userScores` are both available; patch `userScores` before building `userScoresByTournament`.

The rest of the leaderboard chain (ProdeGroupTable → LeaderboardView → LeaderboardCards → calculateRanksWithChange) is unchanged — it continues to consume `yesterdayTotalPoints` exactly as before.

---

## Files to Modify

| File | Change |
|------|--------|
| `app/actions/score-history-actions.ts` | Export new `computePenultimateScores` function |
| `app/[locale]/friend-groups/[id]/page.tsx` | Import + apply `computePenultimateScores` to patch scores |
| `app/[locale]/tournaments/[id]/friend-groups/[group_id]/page.tsx` | Import + apply `computePenultimateScores` to patch scores |

## Files to Create (Tests)

| File | Change |
|------|--------|
| `__tests__/actions/score-history-actions.test.ts` | Add `computePenultimateScores` describe block |

---

## Mid-Level Design

### Call Graph Changes

**Modified flows:**
- **Friend Groups Page (global)** — after fetching `historyByTournament`, now calls `computePenultimateScores(historyByTournament[t.id].userHistories)` per tournament to derive LOCF-based `yesterdayTotalPoints` before passing scores to `ProdeGroupTable`
- **Friend Groups Page (tournament-scoped)** — after fetching `historyData`, calls `computePenultimateScores(historyData.userHistories)` to patch `userScores` before building `userScoresByTournament`

**New flows:** none

---

### `app/actions/score-history-actions.ts` *(modified)*

**New functions:**

- **`computePenultimateScores(userHistories: UserScoreHistory[]): Map<string, number>`**
  Derives each user's effective "penultimate snapshot score" from LOCF-filled `UserScoreHistory.data`.
  Collects all distinct dates across all users; if < 2 distinct dates, returns empty Map. Otherwise finds the second-to-last date and looks up each user's data point at exactly that date (data points are already LOCF-filled, so the point is present iff the user had any snapshot on or before that date).
  Calls: (none — pure data transformation)
  Tests:
  - returns empty Map when `userHistories` is empty
  - returns empty Map when all users have data on only one distinct date
  - returns correct penultimate scores when exactly 2 distinct dates exist
  - returns penultimate (not latest) when 3+ distinct dates exist
  - excludes user from map when user has no data point at the penultimate date (joined after that date)
  - LOCF-carry: user has snapshot on date[-3] and date[-1] but NOT date[-2] (3 dates in allDates); expected penultimate score = value from date[-3] (LOCF-carried forward to date[-2])

---

### `app/[locale]/friend-groups/[id]/page.tsx` *(modified)*

No new functions. After fetching `historyByTournament`, maps over tournaments to produce history-based `yesterdayTotalPoints` on each score object.

### `app/[locale]/tournaments/[id]/friend-groups/[group_id]/page.tsx` *(modified)*

No new functions. After fetching `historyData`, applies `computePenultimateScores` before constructing `userScoresByTournament`.

---

## Testing Strategy

**Unit tests for `computePenultimateScores`** (new describe block in `__tests__/actions/score-history-actions.test.ts`):
- All 6 test cases from Mid-Level Design above
- No mocks needed — pure function, takes `UserScoreHistory[]` arrays built inline

**Manual verification in Vercel Preview**:
1. Open a Friend Group leaderboard with existing score history snapshots
2. Rank arrows should reflect history-based changes (not yesterday DB columns)
3. Group with only 1 snapshot date → all users show "—"
4. Group with 0 snapshots → all users show "—"
5. No regression in leaderboard load time

---

## CODE-STRUCTURE Files to Update

- `docs/code-structure/actions.md` — Add `computePenultimateScores` entry
- `docs/code-structure/pages.md` — Update both page descriptions to note history-based `yesterdayTotalPoints` patching
- Call graph: Update both friend-groups page flows to show `computePenultimateScores` step

---

## Edge Cases Handled

| Scenario | Behavior |
|----------|----------|
| No history snapshots | `isEmpty: true` → `penultimateScores` empty → all `yesterdayTotalPoints = totalPoints` → rankChange = 0 |
| Only 1 distinct snapshot date | `penultimateScores` empty → same as above |
| User has no snapshot before penultimate date | Not in `penultimateScores` map → `yesterdayTotalPoints = 0` → ranked last at penultimate → rank change = (penultimate rank) - (current rank) |
| All users same score at penultimate date | All tied at the same rank → rank changes reflect movement against those tied ranks |
| `yesterday_*` DB columns | Still read by `getUserScoresForTournament` but immediately overridden — no regression, no removal (Story 2) |
