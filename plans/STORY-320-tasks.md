# Story 320 Tasks

## Wave Summary
- Wave 1 (Parallel): Tasks 1, 3
- Wave 2 (Parallel): Tasks 2, 4
- Wave 3 (Parallel): Tasks 5, 6

## Tasks

### Task 1 — Add getLatestRankingsForGroupWithChange to group-ranking-repository.ts
**Status:** pending
**Owner:**
**Wave:** 1
**Blocked by:** —
**Files:** app/db/group-ranking-repository.ts
**Description:** Add 3-step Kysely query to batch-fetch all users' latest + penultimate ranks for a group.

### Task 2 — Add getMaterializedLeaderboardRanks server action
**Status:** pending
**Owner:**
**Wave:** 2
**Blocked by:** Task 1
**Files:** app/actions/group-ranking-actions.ts
**Description:** Thin wrapper converting repo array to Map<userId, {currentRank, rankChange}>.

### Task 3 — Update types.ts and thread materializedRanks through LeaderboardView and ProdeGroupTable
**Status:** pending
**Owner:**
**Wave:** 1
**Blocked by:** —
**Files:** app/components/leaderboard/types.ts, app/components/leaderboard/LeaderboardView.tsx, app/components/friend-groups/friends-group-table.tsx
**Description:** Add materializedRanks prop to interfaces; remove previousScores dead prop; thread through intermediary components.

### Task 4 — Migrate LeaderboardCards to use materializedRanks instead of calculateRanks
**Status:** pending
**Owner:**
**Wave:** 2
**Blocked by:** Task 3
**Files:** app/components/leaderboard/LeaderboardCards.tsx
**Description:** Remove calculateRanks/calculateRanksWithChange imports; replace useMemo rank logic with materialized lookup + positional fallback.

### Task 5 — Wire materialized ranks into both friend-group pages
**Status:** pending
**Owner:**
**Wave:** 3
**Blocked by:** Tasks 2, 3
**Files:** app/[locale]/friend-groups/[id]/page.tsx, app/[locale]/tournaments/[id]/friend-groups/[group_id]/page.tsx
**Description:** Add getMaterializedLeaderboardRanks call to Promise.all; pass result to ProdeGroupTable.

### Task 6 — Write tests for new repository function, server action, and LeaderboardCards
**Status:** pending
**Owner:**
**Wave:** 3
**Blocked by:** Tasks 1, 2, 4
**Files:** __tests__/db/group-ranking-repository.test.ts, __tests__/actions/group-ranking-actions.test.ts, __tests__/components/leaderboard/LeaderboardCards.test.tsx
**Description:** 15 test cases covering repository, action, and component behavior.
