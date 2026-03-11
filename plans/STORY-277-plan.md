# Plan: Leaderboard Rank Changes Based on Score History Snapshots (#277)

## Context

The Friend Groups leaderboard shows rank change arrows (↑↓) using `yesterday_*` materialized columns — confusing because the "yesterday" concept resets on the first score update of each day.

Story #272 introduced `tournament_score_history` with daily snapshots. This story replaces rank changes by deriving them from the last two comparable snapshot dates. The key insight: `getScoreHistoryForGroup` already computes LOCF-filled scores **and** competition ranks per date for the History tab — we reuse that work directly rather than re-computing ranks a second time.

`yesterday_*` columns remain untouched (Story 2 removes them).

---

## Behavioral Specification

- **Rank change** = rank at penultimate snapshot date − rank at latest snapshot date (positive = moved up)
- **LOCF**: Each user's score at a date = their most recent snapshot on or before that date; users with **no prior snapshot** get score=**0** (ranked last), not excluded
- **< 2 distinct snapshot dates across all users**: All rank changes = 0
- **No history at all**: Same — all rank changes = 0

---

## Technical Approach

### Change 1: LOCF includes score=0 before first snapshot

**File:** `app/actions/score-history-actions.ts`, `buildForwardFilledMap`

Currently users with no prior snapshot on a date are excluded from that date entirely. Change: treat score as `0` for all dates before the user's first snapshot.

```typescript
// Before
if (lastKnown !== undefined) filled.set(date, lastKnown);

// After
filled.set(date, lastKnown ?? 0);
// Remove the `if (filled.size > 0)` guard — every user gets entries for all dates
```

Effect on History tab charts: users now appear from the first snapshot date of any group member, starting at score=0 until their own first snapshot. This is intentional — it shows new users joining from the bottom rather than appearing out of nowhere mid-tournament.

Effect on rank computation: all group members are now ranked at every date; new users rank last (tied with other 0-score users).

### Change 2: New `computeHistoryRankChanges` utility

**File:** `app/actions/score-history-actions.ts` — new exported function

```typescript
export function computeHistoryRankChanges(
  userHistories: UserScoreHistory[]
): Map<string, number>
```

Algorithm:
1. Collect all distinct dates from all `userHistories[*].data[*].date`, sort ascending
2. If `< 2` distinct dates → return empty `Map` (caller sets rank change = 0 for everyone)
3. `latestDate = sortedDates[sortedDates.length - 1]`
4. `penultimateDate = sortedDates[sortedDates.length - 2]`
5. For each user:
   - `rankAtLatest = data.find(p => p.date === latestDate)?.rank ?? (userHistories.length + 1)`
   - `rankAtPenultimate = data.find(p => p.date === penultimateDate)?.rank ?? (userHistories.length + 1)`
   - `result.set(user.userId, rankAtPenultimate - rankAtLatest)`
6. Return `Map<userId, rankChange>`

With the LOCF change from Step 1, all users will have entries at every date once any user in the group has a snapshot — so the `?? (userHistories.length + 1)` fallback is only needed for users who are in `allParticipants` but have no history at all (never played).

### Change 3: Thread `historyRankChange` through the data model

Add optional field to `UserScore` so it travels naturally through the existing chain:

**`app/definitions.ts`:**
```typescript
interface UserScore {
  // ... existing fields
  historyRankChange?: number  // pre-computed from score history; undefined = no history
}
```

**`app/components/leaderboard/types.ts` — `LeaderboardUser`:**
```typescript
interface LeaderboardUser {
  // ... existing fields
  historyRankChange?: number
}
```

**`app/components/leaderboard/LeaderboardCards.tsx` — `transformToLeaderboardUser`:**
Map `score.historyRankChange → leaderboardUser.historyRankChange`.

### Change 4: `LeaderboardCards` uses pre-computed rank change

**File:** `app/components/leaderboard/LeaderboardCards.tsx`

```typescript
// Current:
if (sortBy === 'today' && hasYesterdayData) {
  return calculateRanksWithChange(usersWithCurrentRank, 'yesterdayTotalPoints')
}

// New: prefer history-based rank change when available
const hasHistoryRankChange = sorted.some(s => s.historyRankChange !== undefined)
if (sortBy === 'today' && hasHistoryRankChange) {
  return usersWithCurrentRank.map(user => ({
    ...user,
    rankChange: user.historyRankChange ?? 0
  }))
} else if (sortBy === 'today' && hasYesterdayData) {
  return calculateRanksWithChange(usersWithCurrentRank, 'yesterdayTotalPoints') // old fallback kept until Story 2
}
```

The animation (`hasYesterdayData`, `yesterdayTotalPoints`) is untouched — that is a separate concern for Story 2.

### Change 5: Pages compute and set `historyRankChange`

Both pages call `getScoreHistoryForGroup` for the History tab. After fetching, compute rank changes and patch the scores:

```typescript
const rankChanges = computeHistoryRankChanges(historyResult.userHistories)

const patchedScores = scores.map(score => ({
  ...score,
  historyRankChange: rankChanges.size > 0
    ? (rankChanges.get(score.userId) ?? 0)
    : undefined,  // no history → no indicator
}))
```

- `rankChanges.size > 0` → real rank changes; users missing from map (never played) get 0
- `rankChanges.size === 0` → `historyRankChange = undefined` → `LeaderboardCards` shows no change indicators

**Global page (`app/[locale]/friend-groups/[id]/page.tsx`):** `userScoresByTournament` is `const` — build a new `patchedUserScoresByTournament` (via `Object.fromEntries`) and use it in the JSX.

**Tournament-scoped page (`app/[locale]/tournaments/[id]/friend-groups/[group_id]/page.tsx`):** `historyData` and `userScores` are both available; patch before building `userScoresByTournament`.

---

## Files to Modify

| File | Change |
|------|--------|
| `app/actions/score-history-actions.ts` | Change LOCF (score=0); export `computeHistoryRankChanges` |
| `app/definitions.ts` | Add `historyRankChange?: number` to `UserScore` |
| `app/components/leaderboard/types.ts` | Add `historyRankChange?: number` to `LeaderboardUser` |
| `app/components/leaderboard/LeaderboardCards.tsx` | Use pre-computed rank change when available |
| `app/[locale]/friend-groups/[id]/page.tsx` | Compute + apply rank changes to scores |
| `app/[locale]/tournaments/[id]/friend-groups/[group_id]/page.tsx` | Same |

## Files to Update (Tests)

| File | Change |
|------|--------|
| `__tests__/actions/score-history-actions.test.ts` | Update LOCF tests + add `computeHistoryRankChanges` tests |

---

## Mid-Level Design

### Call Graph Changes

**Modified flows:**
- **Friend Groups Page (global)** — after fetching `historyByTournament`, calls `computeHistoryRankChanges(historyByTournament[t.id].userHistories)` per tournament; patches `historyRankChange` on score objects before passing to `ProdeGroupTable`
- **Friend Groups Page (tournament-scoped)** — same with single `historyData`
- **`LeaderboardCards`** — uses `historyRankChange` directly when present, bypasses `calculateRanksWithChange`

**New flows:** none

---

### `app/actions/score-history-actions.ts` *(modified)*

**Changed functions:**

- **`buildForwardFilledMap(userIds, snapshotPointsByUser, allDates)`** — private helper
  Change: `filled.set(date, lastKnown ?? 0)` for all dates; remove `if (filled.size > 0)` guard so every user always gets entries for every date in `allDates`.
  Tests:
  - user with no snapshots gets score=0 for all dates when other users have snapshots
  - user with first snapshot on date[-1] gets score=0 at date[-2] and actual score at date[-1]
  - user with snapshot on date[-2] still gets LOCF-carried score at date[-1] (no regression)

**New functions:**

- **`computeHistoryRankChanges(userHistories: UserScoreHistory[]): Map<string, number>`**
  Derives rank change per user from pre-computed ranks in `userHistories`. Returns empty Map if < 2 distinct snapshot dates. Uses `data[].rank` at penultimate and latest dates directly — no re-computation.
  Calls: (none — pure data transformation)
  Tests:
  - returns empty Map when `userHistories` is empty
  - returns empty Map when all users have only one distinct date
  - positive rankChange when user moved up (penultimate rank > latest rank)
  - negative rankChange when user moved down
  - zero rankChange when rank is unchanged
  - user present in group but with no history data gets rankChange=0 (fallback to last rank)
  - correctly uses penultimate, not latest, when 3+ dates exist

---

### `app/definitions.ts` *(modified)*

**Changed types:**
- **`UserScore`** — add `historyRankChange?: number`

### `app/components/leaderboard/types.ts` *(modified)*

**Changed types:**
- **`LeaderboardUser`** — add `historyRankChange?: number`

### `app/components/leaderboard/LeaderboardCards.tsx` *(modified)*

No new functions. Logic change in rank computation: when `historyRankChange` is present on score objects, use it directly instead of calling `calculateRanksWithChange`. Existing `calculateRanksWithChange` path retained as fallback.

---

## Testing Strategy

**Unit tests for `buildForwardFilledMap` change** (update existing or new cases):
- 3 test cases above, verifying score=0 behavior for new users

**Unit tests for `computeHistoryRankChanges`** (new describe block):
- 7 test cases above
- Pure function, `UserScoreHistory[]` built inline, no mocks needed

**Manual verification in Vercel Preview:**
1. Open Friend Group leaderboard with ≥2 snapshot dates → rank arrows reflect history
2. User who just joined → shows as having moved up from last place
3. Group with 0 or 1 snapshot date → all "—" (no change)
4. History tab charts → new users now visible from score=0 (verify acceptable UX)
5. No regression in leaderboard load time

---

## CODE-STRUCTURE Files to Update

- `docs/code-structure/actions.md` — update `buildForwardFilledMap` description; add `computeHistoryRankChanges`
- `docs/code-structure/pages.md` — update both page descriptions
- `docs/code-structure/components/components-leaderboard.md` (or similar) — update `LeaderboardCards` description
- Call graph: update both friend-groups page flows

---

## Edge Cases Handled

| Scenario | Behavior |
|----------|----------|
| No history snapshots | empty rankChanges → `historyRankChange = undefined` → no arrows |
| Only 1 distinct snapshot date | same as above |
| User never played (no snapshots) | ranked last (score=0) at all dates; rankChange = last_rank - current_rank |
| User joined after penultimate date | score=0 at penultimate, actual at latest → shows rank change correctly |
| All users same score → tied-last at penultimate | competition ranking handles ties; rank change computed correctly |
| `yesterday_*` DB columns | still read, still drive animation; `historyRankChange` overrides rank-change *indicator* only |
