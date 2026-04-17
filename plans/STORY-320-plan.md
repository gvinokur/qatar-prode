# Story #320 — Migrate FE Rank Calculation to Materialized Ranks

## Context

Story #315 added the `group_rankings` table and a server-side materialization pipeline. Every time scores change (game results, awards, qualified teams), `recalculateGroupRankingsForUsers()` fires and writes a daily snapshot of each user's rank and score into `group_rankings`.

Despite this infrastructure, the leaderboard UI (`LeaderboardCards.tsx`) still independently re-computes ranks on the client using `calculateRanks()` and `calculateRanksWithChange()`. This causes:
- Redundant client-side CPU and DB aggregation work on every page load
- Two separate ranking computations that must stay in sync
- Complexity in `LeaderboardCards` that will grow with the codebase

This story removes the client-side rank calculation from `LeaderboardCards` and replaces it with reads from `group_rankings`, which already holds the authoritative ranks.

**Parent Epic:** #314 — Tournament Hub & Social Momentum

---

## Scope Analysis

### What gets migrated
- `app/components/leaderboard/LeaderboardCards.tsx` — the only place `calculateRanks()` and `calculateRanksWithChange()` are called in the leaderboard context.

### What does NOT change
- `app/components/groups-page/team-standings-cards.tsx` — uses `calculateRanks()` for *tournament group stage standings* (teams, not users). Unrelated to `group_rankings` table. Out of scope.
- `app/actions/group-ranking-actions.ts` → `recalculateGroupRankings()` — the materialization function itself uses `calculateRanks()` server-side. Stays.
- `app/utils/rank-calculator.ts` — utility stays (used by materialization + team standings).

### Affected pages
Both friend group leaderboard pages fetch scores and pass them to `ProdeGroupTable → LeaderboardView → LeaderboardCards`:
1. `app/[locale]/friend-groups/[id]/page.tsx` (multi-tournament)
2. `app/[locale]/tournaments/[id]/friend-groups/[group_id]/page.tsx` (single tournament)

---

## Technical Approach

### Animation Preservation
`LeaderboardCards` animates from "yesterday's order" → "today's order" using `penultimateSnapshotPoints` and `latestSnapshotPoints` for sort ordering. This score-based sort is preserved — only the displayed rank *numbers* and *rank change indicators* switch to materialized values. The animation still reads scores from `tournament_score_history` (via `getScoreHistoryForGroup`).

### Fallback
When `group_rankings` has no snapshots for a group (e.g., newly created group, or no score update has run yet), `LeaderboardCards` falls back to positional ranking (array index + 1, no competition ties). `calculateRanks()` is removed from `LeaderboardCards` — the fallback is intentionally simpler since it's a rare edge case.

---

## Files to Create / Modify

| File | Change |
|------|--------|
| `app/db/group-ranking-repository.ts` | Add `getLatestRankingsForGroupWithChange()` |
| `app/actions/group-ranking-actions.ts` | Add `getMaterializedLeaderboardRanks()` |
| `app/[locale]/friend-groups/[id]/page.tsx` | Fetch materialized ranks per tournament |
| `app/[locale]/tournaments/[id]/friend-groups/[group_id]/page.tsx` | Fetch materialized ranks |
| `app/components/friend-groups/friends-group-table.tsx` | Thread `materializedRanksByTournament` prop |
| `app/components/leaderboard/LeaderboardView.tsx` | Thread `materializedRanks` prop |
| `app/components/leaderboard/LeaderboardCards.tsx` | Replace FE rank calc with materialized data |
| `app/components/leaderboard/types.ts` | Add `materializedRanks` prop; remove `previousScores` |

---

## Mid-Level Design

### Call Graph Changes

**Modified flows:**

- **Flow 28 (Group rank snapshot READ PATH)** — extended to cover batch read for the full leaderboard. Previously only single-user reads (`getGroupRankingForUser` → `getLatestTwoGroupRankingSnapshots`). Now adds a full-group batch read path:
  ```
  FriendGroupPage / TournamentFriendGroupPage
    └── getMaterializedLeaderboardRanks(groupId, tournamentId)  [new]
          └── getLatestRankingsForGroupWithChange(groupId, tournamentId)  [new]
                └── group_rankings table (3 queries)
  ```

**No new flows.** The downstream rendering path (`ProdeGroupTable → LeaderboardView → LeaderboardCards`) is an existing flow; we're only modifying the data passed through it.

---

### `app/db/group-ranking-repository.ts` *(modified)*

**New functions:**

- **getLatestRankingsForGroupWithChange(groupId: string, tournamentId: string)**: `Promise<{ userId: string; currentRank: number; previousRank: number | null; currentScore: number }[]>`
  Returns all users' ranks at the latest snapshot, with each user's rank at the penultimate snapshot (for rank-change computation). Three-step implementation: (1) get the two most-recent distinct snapshot_dates, (2) fetch all user ranks at the latest date, (3) fetch all user ranks at the penultimate date (if exists) and join. Returns empty array when no snapshots exist.
  Calls: db (Kysely)
  Tests:
  - returns empty array when group has no snapshots
  - returns all users with `previousRank: null` when only one snapshot date exists
  - returns correct `currentRank` and `previousRank` when two snapshot dates exist
  - handles users missing from the penultimate snapshot (new members) with `previousRank: null`

---

### `app/actions/group-ranking-actions.ts` *(modified)*

**New functions:**

- **getMaterializedLeaderboardRanks(groupId: string, tournamentId: string)**: `Promise<Map<string, { currentRank: number; rankChange: number }>>`
  Server Action wrapper. Calls `getLatestRankingsForGroupWithChange`, converts to a Map keyed by userId. `rankChange = previousRank - currentRank` (positive = moved up). Users with `previousRank: null` get `rankChange: 0`. Returns empty Map when no snapshots or when repository throws.
  Calls: getLatestRankingsForGroupWithChange
  Tests:
  - returns empty Map when repository returns empty array
  - sets rankChange to 0 for users with no previous snapshot
  - computes rankChange correctly (positive when rank improved)
  - computes rankChange correctly (negative when rank dropped)
  - returns empty Map when repository throws (error isolation — leaderboard should not break)

---

### `app/components/leaderboard/types.ts` *(modified)*

**Changed interfaces:**

- **LeaderboardCardsProps**: Add `materializedRanks?: Map<string, { currentRank: number; rankChange: number }>`. Remove `previousScores?: unknown[]` (unused dead prop — `LeaderboardView` always passes `undefined`).
- **LeaderboardViewProps**: Add `materializedRanks?: Map<string, { currentRank: number; rankChange: number }>`.

---

### `app/components/leaderboard/LeaderboardCards.tsx` *(modified)*

**Changed behavior:**

- Remove imports of `calculateRanks`, `calculateRanksWithChange` from `../../utils/rank-calculator`
- Accept new `materializedRanks` prop
- In `leaderboardUsers` useMemo (currently lines 92–125): replace `calculateRanks()` + `calculateRanksWithChange()` calls with:
  - When `materializedRanks` is non-empty: look up `currentRank` and `rankChange` from the map for each user; sort-by-score animation still proceeds as before
  - When `materializedRanks` is empty/undefined: assign `currentRank = index + 1` (positional fallback), `rankChange = 0`
- Sort order (score-based, for animation) is unchanged
- Remove `previousScores` from destructured props

The `leaderboardUsers` memo now has this shape after migration:
```typescript
const leaderboardUsers = useMemo(() => {
  const transformed = scores.map(transformToLeaderboardUser)
  // ... sorting by score (unchanged) ...
  const sorted = transformed.toSorted(/* score comparator, unchanged */)

  const hasMaterialized = materializedRanks && materializedRanks.size > 0

  return sorted.map((user, index) => {
    const mat = hasMaterialized ? materializedRanks.get(user.id) : undefined
    return {
      ...user,
      currentRank: mat?.currentRank ?? index + 1,
      rankChange: sortBy === 'today' && hasSnapshotHistory ? (mat?.rankChange ?? 0) : 0,
    }
  })
}, [scores, sortBy, hasSnapshotHistory, materializedRanks])
```

Tests:
- renders cards with ranks from materializedRanks when map is non-empty
- falls back to positional rank when materializedRanks is empty/undefined
- rank change indicator shown when sortBy is 'today' and materializedRanks has rankChange > 0
- no rank change indicator during 'yesterday' animation phase
- ignores materializedRanks entries for userIds not present in scores (partial map)
- renders empty state correctly when scores array is empty

---

### Pages and intermediary components

No Mid-Level Design entries needed for the page/component prop-threading changes — these are straightforward prop additions with no new logic.

---

## Testing Strategy

1. **New unit tests** for `getLatestRankingsForGroupWithChange` in `__tests__/db/group-ranking-repository.test.ts` (create if not exists)
2. **New unit tests** for `getMaterializedLeaderboardRanks` in `__tests__/actions/group-ranking-actions.test.ts` (append to existing file)
3. **New component tests** for `LeaderboardCards` in `__tests__/components/leaderboard/LeaderboardCards.test.tsx` (create)
4. Coverage requirement: ≥80% on all changed files
5. **Test utilities**: All tests MUST use `testFactories.*` for mock users/groups/rankings, `createMockSelectQuery()` for repository-layer mocks, and `renderWithTheme()` for component tests

## Validation

- `npm run test` — all tests pass
- `npm run lint` — no new issues
- `npm run build` — no type errors
- Manual: Open friend-group leaderboard — ranks should match what was shown before; rank-change arrows should appear correctly after score updates
- SonarCloud: 0 new issues of any severity

## Rollout Note

The `group_rankings` table is fully populated for all active groups (every score-update function calls `recalculateGroupRankingsForUsers`). New groups will have no snapshots until the first score update fires — the positional fallback covers this gracefully.
