# Plan: Hub Leaderboard Peek — Only Fetch Rankings for Displayed Groups (#413)

## Context

The hub page shows a leaderboard preview card for the user's top 3 friend groups. The current `getLeaderboardPeekData` in `app/actions/hub-actions.ts` fetches **full ranking data** (all members + user names) for every group the user belongs to, then discards all but 3. A user in 8 groups triggers 8 heavyweight ranking queries (2-step each: max date + JOIN with users table) even though only 3 results are ever displayed.

This story introduces a lightweight summary query for the "survey" phase — asking only "is the user here, and how many members?" for all groups — and reserves full data fetches for the 3 groups that will actually be shown.

**Epic:** #409

## Problem

In `getLeaderboardPeekData` (hub-actions.ts:719-721):
```ts
const rankingsPerGroup = await Promise.all(
  allGroups.map((g) => getLatestRankingsForGroup(g.id, tournamentId))
)
```
This runs N parallel calls to `getLatestRankingsForGroup`, each of which:
1. Fetches the max snapshot date for the group (1 query)
2. JOINs group_rankings with users at that date (1 query)

For a user with 8 groups: **16 DB queries** in Phase 1 alone, producing hundreds of rows — only to keep 3 groups' data.

## Acceptance Criteria
- Leaderboard peek shows correct groups and ranks (same as before)
- Rank change indicator (up/down arrow) shows correct direction
- A user with 1 group sees 1 leaderboard card (no errors)
- A user with 0 groups sees the "create a group" CTA (no errors)
- A user with 5+ groups sees exactly 3 leaderboard cards

## Technical Approach

### Two-phase architecture

**Phase 1 (lightweight — 2 DB round-trips for all groups):**
Call a new `getGroupRankingSummaries(groupIds, userId, tournamentId)` that returns `{ groupId, rankedCount, userIsRanked }[]`:
- Query 1: `SELECT group_id, MAX(snapshot_date)` grouped by group_id
- Query 2: `SELECT group_id, user_id, snapshot_date` for all groups at their latest dates
- JS aggregation: count members per group, flag user presence

**Phase 2 (full data — 3 + 3 queries, only for top 3):**
- `getLatestRankingsForGroup(groupId, tournamentId)` × 3 → full neighbor window data
- `getLatestTwoGroupRankingSnapshots(userId, groupId, tournamentId)` × 3 → rank change

Phase 1 and Phase 2 full-rankings + snapshots run in parallel with `Promise.all([...rankings, ...snapshots])`.

**Query improvement:**
- Before (N=8 groups): 16 queries in Phase 1 + 3 snapshot queries = **19 queries**
- After: 2 lightweight queries + 6 full queries = **8 queries** (constant, regardless of N)

### Correctness preservation
- Sort: currently `b.rankings.length - a.rankings.length` → becomes `b.rankedCount - a.rankedCount` (equivalent: both count ranked members at latest snapshot)
- Filter: currently `rankings.find(r => r.userId === user.id)` → becomes `s.userIsRanked` (equivalent)
- `totalMembers` field: still derived from `rankings.length` after fetching full data for top 3
- `userRank` + neighbor window: unchanged, derived from full rankings in Phase 2
- `rankChange`: unchanged, derived from snapshots in Phase 2

## Files to Modify

| File | Change |
|------|--------|
| `app/db/group-ranking-repository.ts` | Add `getGroupRankingSummaries` |
| `app/actions/hub-actions.ts` | Refactor `getLeaderboardPeekData` to use two-phase approach; update import |
| `app/actions/__tests__/hub-actions.test.ts` | Add `getGroupRankingSummaries` to mock; update `beforeEach` and affected test cases |
| `__tests__/db/group-ranking-repository.test.ts` | Add tests for `getGroupRankingSummaries` |
| `docs/code-structure/db.md` | Add `getGroupRankingSummaries` entry |
| `docs/code-structure/actions.md` | Update `getLeaderboardPeekData` description |

## Mid-Level Design

### Call Graph Changes

**Modified flows:**
- **getLeaderboardPeekData flow**: replaces `getLatestRankingsForGroup × N` with `getGroupRankingSummaries × 1` in Phase 1; Phase 2 still calls `getLatestRankingsForGroup × 3` and `getLatestTwoGroupRankingSnapshots × 3` in parallel.

No new cross-layer flows. The action still calls the same repository, just different functions.

---

### `app/db/group-ranking-repository.ts` *(modified)*

**New functions:**

- **getGroupRankingSummaries(groupIds: string[], userId: string, tournamentId: string)**: `Promise<{ groupId: string; rankedCount: number; userIsRanked: boolean }[]>`
  Lightweight summary of group rankings for the given user and tournament. Makes 2 DB round-trips for all groups: first fetches the latest snapshot date per group, then fetches all (group_id, user_id, snapshot_date) rows at those dates. Aggregates in JavaScript to count ranked members and detect user presence. Groups with no snapshots are absent from the result.
  Calls: (Kysely db directly — no project-level helper functions)
  Tests:
  - returns empty array when groupIds is empty (no DB call)
  - returns empty array when no snapshots exist for any group
  - returns `userIsRanked: false` and correct `rankedCount` when user is not in a group's rankings
  - returns `userIsRanked: true` and correct `rankedCount` when user appears in rankings
  - returns correct summaries for multiple groups in a single call
  - excludes groups that have no snapshot data from the result
  - excludes rows with a stale snapshot_date, counting only the per-group latest snapshot (snapshot mismatch edge case)

---

### `app/actions/hub-actions.ts` *(modified)*

**Changed functions:**

- **getLeaderboardPeekData(tournamentId: string, _locale: Locale)**: `Promise<LeaderboardPeekResult>` *(same signature)*
  Now uses two-phase data fetching. Phase 1: calls `getGroupRankingSummaries` (2 DB round-trips for all groups) to get ranked member counts and user presence. Filters/sorts/slices to top 3. Phase 2: fetches full rankings and rank-change snapshots only for the top 3 groups in parallel.
  Calls: getLoggedInUser, findProdeGroupsByOwner, findProdeGroupsByParticipant, getFavoriteGroupIds, **getGroupRankingSummaries** (new), getLatestRankingsForGroup (×3 only), getLatestTwoGroupRankingSnapshots (×3 only)
  Tests:
  - calls `getGroupRankingSummaries` once (not `getLatestRankingsForGroup` per-group) for survey phase
  - filters out groups where `userIsRanked` is false before fetching full data (Phase 1 filter)
  - sorts by favorites first, then by `rankedCount` descending in Phase 1 (sort behavior unchanged)
  - calls `getLatestRankingsForGroup` and `getLatestTwoGroupRankingSnapshots` only for top 3 groups (Phase 2 scoping)
  - returns empty groups array when no summaries have `userIsRanked: true`
  - builds correct 3-row neighbor window using full rankings fetched in Phase 2 (unchanged behavior)

---

## Implementation Steps

### Task 1: Add `getGroupRankingSummaries` to `group-ranking-repository.ts`

```typescript
export async function getGroupRankingSummaries(
  groupIds: string[],
  userId: string,
  tournamentId: string
): Promise<{ groupId: string; rankedCount: number; userIsRanked: boolean }[]> {
  if (groupIds.length === 0) return []

  // Round-trip 1: latest snapshot_date per group
  const latestDates = await db
    .selectFrom('group_rankings')
    .select(['group_id', db.fn.max('snapshot_date').as('max_date')])
    .where('group_id', 'in', groupIds)
    .where('tournament_id', '=', tournamentId)
    .groupBy('group_id')
    .execute()

  if (latestDates.length === 0) return []

  const latestDateByGroup = new Map(latestDates.map((r) => [r.group_id, r.max_date]))
  const uniqueLatestDates = [...new Set(latestDates.map((r) => r.max_date))]

  // Round-trip 2: (group_id, user_id) rows for all groups at their latest dates
  const rows = await db
    .selectFrom('group_rankings')
    .select(['group_id', 'user_id', 'snapshot_date'])
    .where('group_id', 'in', groupIds)
    .where('tournament_id', '=', tournamentId)
    .where('snapshot_date', 'in', uniqueLatestDates)
    .execute()

  // Aggregate: count members and flag user presence per group
  const summaryByGroup = new Map<string, { rankedCount: number; userIsRanked: boolean }>()
  for (const row of rows) {
    if (row.snapshot_date !== latestDateByGroup.get(row.group_id)) continue
    const existing = summaryByGroup.get(row.group_id) ?? { rankedCount: 0, userIsRanked: false }
    existing.rankedCount++
    if (row.user_id === userId) existing.userIsRanked = true
    summaryByGroup.set(row.group_id, existing)
  }

  return [...summaryByGroup.entries()].map(([groupId, summary]) => ({ groupId, ...summary }))
}
```

### Task 2: Refactor `getLeaderboardPeekData` in `hub-actions.ts`

Update import:
```typescript
import { getGroupRankingSummaries, getLatestRankingsForGroup, getLatestTwoGroupRankingSnapshots } from '../db/group-ranking-repository'
```

Replace Phase 1 (lines 719-745) with:
```typescript
// Phase 1: lightweight summary — 2 DB round-trips for all groups
const summaries = await getGroupRankingSummaries(
  allGroups.map((g) => g.id),
  user.id,
  tournamentId
)

const rankedSummaries = summaries.filter((s) => s.userIsRanked)

const favoriteSet = new Set(favoriteGroupIds)
rankedSummaries.sort((a, b) => {
  const aFav = favoriteSet.has(a.groupId) ? 1 : 0
  const bFav = favoriteSet.has(b.groupId) ? 1 : 0
  if (bFav !== aFav) return bFav - aFav
  return b.rankedCount - a.rankedCount
})

const topSummaries = rankedSummaries.slice(0, MAX_PEEK_GROUPS)
if (topSummaries.length === 0) return { groups: [], userHasGroups, allGroupNames }

// Phase 2: full rankings + snapshots only for top 3, in parallel
const [rankingsForTop, snapshotResults] = await Promise.all([
  Promise.all(topSummaries.map((s) => getLatestRankingsForGroup(s.groupId, tournamentId))),
  Promise.all(topSummaries.map((s) => getLatestTwoGroupRankingSnapshots(user.id, s.groupId, tournamentId))),
])
```

Build `groups` result using `topSummaries` + `rankingsForTop` + `snapshotResults` (same logic as before, just reading `allGroupsMap.get(summary.groupId)` for group metadata).

### Task 3: Update hub-actions.test.ts

1. Add `getGroupRankingSummaries: vi.fn()` to the `vi.mock('@/app/db/group-ranking-repository', ...)` factory.

2. In `beforeEach` for `getLeaderboardPeekData` describe block, add:
```typescript
vi.mocked(groupRankingRepository.getGroupRankingSummaries).mockResolvedValue([
  { groupId: group1.id, rankedCount: 3, userIsRanked: true },
])
```

3. Update tests that mock `getLatestRankingsForGroup` for the survey phase to instead set up `getGroupRankingSummaries` with counts and `getLatestRankingsForGroup` for the top-3 detail phase.

Key test changes:
- "returns up to 3 groups sorted by member count descending": mock `getGroupRankingSummaries` with 3 groups' counts; mock `getLatestRankingsForGroup` for full data of all 3
- "sorts favorite groups before non-favorites": same pattern
- "filters out groups where user has no ranking entry": `getGroupRankingSummaries` returns `userIsRanked: false` for group2; `getLatestRankingsForGroup` only called for group1

### Task 4: Add repository tests in `group-ranking-repository.test.ts`

Add `describe('getGroupRankingSummaries', ...)` block covering all 7 test cases in the Mid-Level Design.

- For the DB mock setup, use the same pattern as existing tests: `createMockSelectQuery` for each query round-trip, chaining `mockDb.selectFrom.mockReturnValueOnce(...)`.
- For snapshot mismatch edge case: set up Query 1 returning `max_date: 20260602` for group-1, and Query 2 returning rows including a stale `snapshot_date: 20260601` entry — verify those stale rows are excluded from the count.
- Note: DB failure paths (`throws when DB fails`) are not part of this codebase's repository test convention — tests validate observable output behaviors via mock queries.
- Use `testFactories.groupRanking(...)` and `testFactories.prodeGroup(...)` for baseline fixture data where applicable (consistent with existing `group-ranking-repository.test.ts` pattern).

Concrete example test to follow:
```typescript
it('returns userIsRanked: true and correct rankedCount when user appears in rankings', async () => {
  const group = testFactories.prodeGroup()
  // Query 1: max snapshot_date per group
  const dateQuery = createMockSelectQuery([{ group_id: group.id, max_date: 20260601 }])
  // Query 2: member rows at latest date
  const membersQuery = createMockSelectQuery([
    { group_id: group.id, user_id: user.id, snapshot_date: 20260601 },
    { group_id: group.id, user_id: 'other-user', snapshot_date: 20260601 },
  ])
  mockDb.selectFrom
    .mockReturnValueOnce(dateQuery as any)
    .mockReturnValueOnce(membersQuery as any)

  const result = await getGroupRankingSummaries([group.id], user.id, tournament.id)

  expect(result).toHaveLength(1)
  expect(result[0].groupId).toBe(group.id)
  expect(result[0].rankedCount).toBe(2)
  expect(result[0].userIsRanked).toBe(true)
})
```

### Task 5: Update CODE-STRUCTURE docs

- `docs/code-structure/db.md`: add `getGroupRankingSummaries` under `group-ranking-repository.ts`
- `docs/code-structure/actions.md`: update `getLeaderboardPeekData` to mention two-phase fetch and `getGroupRankingSummaries`

## Testing Strategy

**Unit tests (Vitest mocks):**
- `__tests__/db/group-ranking-repository.test.ts`: ≥6 new tests for `getGroupRankingSummaries`
- `app/actions/__tests__/hub-actions.test.ts`: update ~4 existing tests + verify no regressions in window/rankChange tests

**Manual verification (Vercel Preview):**
1. Navigate to hub page as a user with 3+ groups — verify 3 leaderboard peek cards appear
2. Navigate as user with 1 group — verify 1 card, no errors
3. Navigate as user with 0 groups — verify "create a group" CTA appears
4. Verify rank change indicators (↑/↓) show correctly on cards with 2+ snapshots

**Coverage:** New DB function gets ≥80% coverage from the repository test block. Existing hub-actions coverage unchanged (same behavior, updated mocks).

## Validation (SonarCloud)
- 0 new issues
- No new duplicated code (getGroupRankingSummaries is a standalone helper, not duplicating existing functions)
- Type-safety: all return types explicitly typed, no `any`
