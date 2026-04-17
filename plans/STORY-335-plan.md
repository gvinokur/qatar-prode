# Story 335 Plan: Read rank history chart data from group_rankings table

## Context

Every time a user opens the History tab, `getScoreHistoryForGroup()` recomputes ranks per date from raw `tournament_score_history` snapshots. The `group_rankings` table already stores daily rank snapshots (written whenever scores change via Story #315), making this recomputation unnecessary.

Reading pre-stored ranks from `group_rankings` eliminates redundant computation and creates a single source of truth — the History tab's rank chart will show the same values as the Standings tab's materialized ranks.

## Acceptance Criteria

- [ ] Rank history chart uses pre-stored ranks from `group_rankings` when available
- [ ] Falls back to computed ranks when `group_rankings` has no snapshots for the group
- [ ] Works on both `/friend-groups/[id]` and `/tournaments/[id]/friend-groups/[group_id]` pages
- [ ] Rank values are consistent with materialized ranks shown in the Standings tab

## Technical Approach

The current data flow:
```
page → getScoreHistoryForGroup(userIds, tournamentId) → computes ranks per date from score snapshots
                                                       → HistoryTab → RankHistoryChart
```

The new data flow:
```
page → getGroupRankHistory(groupId, tournamentId) → reads pre-stored ranks from group_rankings
     → getScoreHistoryForGroup(userIds, tournamentId) → computes scores (unchanged)
     → HistoryTab(preStoredRankHistories=...) → uses pre-stored ranks when non-null
                                              → falls back to computed ranks when null
```

### Key design decisions

1. **Separate prop, not replacing ScoreHistoryResult** — `getScoreHistoryForGroup` still provides score history data (needed for ScoreHistoryChart) and display names. The new data only overrides the `rank` field in RankHistoryChart.

2. **Null = fallback** — `getGroupRankHistory` returns `null` when no snapshots exist. `HistoryTab` treats null the same as "not provided" and falls back to computed ranks.

3. **Display names from historyData** — `getGroupRankHistory` does not look up display names (no extra DB join). `HistoryTab` merges userId-keyed rank data with display names from `historyData.userHistories`.

4. **Only include users present in historyData** — Prevents showing users in the rank chart who don't have score history (avoids orphaned rank lines).

## Files to Create / Modify

| File | Change |
|------|--------|
| `app/actions/group-ranking-actions.ts` | Add `getGroupRankHistory()` and `UserRankHistoryEntry` type |
| `app/components/leaderboard/HistoryTab.tsx` | Add `preStoredRankHistories` prop; use pre-stored ranks when provided |
| `app/[locale]/friend-groups/[id]/page.tsx` | Call `getGroupRankHistory` per tournament; pass to HistoryTab |
| `app/[locale]/tournaments/[id]/friend-groups/[group_id]/page.tsx` | Same |
| `docs/code-structure/actions.md` | Add `getGroupRankHistory` entry |
| `docs/code-structure/components/components-leaderboard-stats.md` | Update HistoryTab signature |

## Visual Prototype

No UI changes — the rank history chart looks and behaves identically. This is a data-source swap with no visible design difference.

## Mid-Level Design

### Call Graph Changes

**Modified flows:**

- **Flow 29 (Group rank snapshots — read path)** — extend to cover History tab: both friend-group pages now also call `getGroupRankHistory(groupId, tournamentId)` alongside `getScoreHistoryForGroup`, then pass `preStoredRankHistories` down to `HistoryTab`.

No new flows.

### `app/actions/group-ranking-actions.ts` *(modified)*

**New types:**

- **UserRankHistoryEntry**: `{ userId: string; data: Array<{ date: number; rank: number }> }`
  Rank history for a single user: userId + array of (YYYYMMDD date, rank) pairs ordered by date ascending.

**New functions:**

- **getGroupRankHistory(groupId: string, tournamentId: string)**: `Promise<UserRankHistoryEntry[] | null>`
  Reads pre-stored daily rank snapshots from `group_rankings` for all users in a group/tournament.
  Returns null when no snapshots exist (caller should fall back to computed ranks).
  Groups snapshot rows by userId and maps to `{userId, data: [{date, rank}]}`.
  Calls: getGroupRankingSnapshots
  Tests:
  - returns null when group has no ranking snapshots in the table
  - groups snapshots by userId with correct date and rank values
  - each user's data array is ordered by snapshot_date ascending (matches repo order)
  - handles a group with a single user correctly
  - returns entries for every user that has at least one snapshot

### `app/components/leaderboard/HistoryTab.tsx` *(modified)*

**Changed functions:**

- **HistoryTab({ historyData, themeColor, preStoredRankHistories? })**: `JSX.Element` *(was: no preStoredRankHistories param)*
  When `preStoredRankHistories` is provided and non-null, merges with display names from `historyData.userHistories` (userId lookup) and passes merged data to `RankHistoryChart` instead of computed ranks.
  Falls back silently to computed ranks when prop is null, undefined, or when a user in preStoredRankHistories has no matching displayName in historyData.
  Calls: RankHistoryChart, ScoreHistoryChart
  Tests:
  - passes pre-stored ranks to RankHistoryChart when preStoredRankHistories is non-null
  - falls back to historyData computed ranks when preStoredRankHistories is null
  - falls back to computed ranks when preStoredRankHistories is undefined (not passed)
  - excludes users from pre-stored data who are not present in historyData.userHistories

### `app/[locale]/friend-groups/[id]/page.tsx` *(modified)*

Updated to call `getGroupRankHistory` per tournament inside the existing `Promise.all` and pass the result to each `HistoryTab` via the new `preStoredRankHistories` prop.

### `app/[locale]/tournaments/[id]/friend-groups/[group_id]/page.tsx` *(modified)*

Same change: call `getGroupRankHistory(group.id, tournament.id)` and pass to `HistoryTab`.

## Implementation Steps

### Wave 1 — New action (no dependencies)
1. Add `UserRankHistoryEntry` type and `getGroupRankHistory()` to `group-ranking-actions.ts`
2. Write unit tests for `getGroupRankHistory()`

### Wave 2 — Component update (depends on Wave 1 type export)
3. Update `HistoryTab` to accept and use `preStoredRankHistories` prop

### Wave 3 — Page integration (depends on Wave 1 action + Wave 2 component)
4. Update `friend-groups/[id]/page.tsx`
5. Update `tournaments/[id]/friend-groups/[group_id]/page.tsx`

### Wave 4 — CODE-STRUCTURE + tests
6. Update `docs/code-structure/actions.md` and `components-leaderboard-stats.md`

## Testing Strategy

- **Unit tests** for `getGroupRankHistory()` — mock `getGroupRankingSnapshots` using project mock helpers; build fixture rows using `testFactories.*` GroupRankingSnapshot objects
- **Component tests** for `HistoryTab` — use `renderWithTheme()` for MUI v7 compatibility; build mock `historyData` via `testFactories.*`; render with and without `preStoredRankHistories` and assert which data reaches `RankHistoryChart`
- No new e2e tests needed (data-source swap, same visual output)
- Coverage target: ≥ 80% on changed/new code

## Validation Considerations

- SonarCloud: 0 new issues; no new type assertions or `any` usage
- `getGroupRankHistory` must not throw — if the DB call fails it should propagate (consistent with other actions)
- No new translations needed
- No migrations needed (reads existing `group_rankings` table)

## Implementation Amendments

### Amendment 1: tournamentId type changed from number to string
**Date:** 2026-04-17
**Reason:** All tournament IDs in this codebase are UUID strings. The plan incorrectly specified `number`. `Number(uuid)` → `NaN` → DB error "invalid input syntax for type uuid: NaN".
**Change:** `getGroupRankHistory` signature changed to `tournamentId: string`. Removed `Number()` conversions in both calling pages. `String(tournamentId)` conversion inside the action also removed.

## Open Questions

None.
