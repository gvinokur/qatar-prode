# Story 319 Tasks

## Wave Summary
- Wave 1 (Parallel): Task 1 (repo function), Task 2 (compact prop)
- Wave 2 (Parallel): Task 3 (hub action, after Task 1), Task 4 (LeaderboardPeekCard, after Task 2)
- Wave 3 (Sequential): Task 5 (TournamentHubLeaderboardPeek, after Tasks 3+4)
- Wave 4 (Sequential): Task 6 (hub page + i18n, after Task 5)
- Wave 5 (Sequential): Task 7 (tests, after Task 6)

## Tasks

### Task 1 — Add getLatestRankingsForGroup to group-ranking-repository
**Status:** pending
**Owner:**
**Wave:** 1
**Blocked by:** —
**Files:** app/db/group-ranking-repository.ts

### Task 2 — Add compact prop to LeaderboardCard
**Status:** pending
**Owner:**
**Wave:** 1
**Blocked by:** —
**Files:** app/components/leaderboard/LeaderboardCard.tsx, app/components/leaderboard/types.ts

### Task 3 — Add getLeaderboardPeekData action and types to hub-actions
**Status:** pending
**Owner:**
**Wave:** 2
**Blocked by:** Task 1
**Files:** app/actions/hub-actions.ts

### Task 4 — Create LeaderboardPeekCard client component
**Status:** pending
**Owner:**
**Wave:** 2
**Blocked by:** Task 2
**Files:** app/components/tournament-hub/leaderboard-peek-card.tsx (new)

### Task 5 — Create TournamentHubLeaderboardPeek server component
**Status:** pending
**Owner:**
**Wave:** 3
**Blocked by:** Tasks 3, 4
**Files:** app/components/tournament-hub/tournament-hub-leaderboard-peek.tsx (new)

### Task 6 — Update hub page and i18n keys
**Status:** pending
**Owner:**
**Wave:** 4
**Blocked by:** Task 5
**Files:** app/[locale]/tournaments/[id]/hub/page.tsx, locales/en/hub.json, locales/es/hub.json

### Task 7 — Write unit tests for new code
**Status:** pending
**Owner:**
**Wave:** 5
**Blocked by:** Task 6
**Files:** app/db/__tests__/, app/actions/__tests__/, app/components/leaderboard/__tests__/, app/components/tournament-hub/__tests__/
