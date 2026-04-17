# Story 318 Tasks

## Wave Summary
- Wave 1 (Parallel): Tasks 1, 3
- Wave 2 (Parallel): Tasks 2, 4 (after wave 1)
- Wave 3 (Sequential): Task 5 (after wave 2)
- Wave 4 (Sequential): Task 6 (after wave 3)

## Tasks

### Task 1 — Add findRecentGamesWithUserGuesses to game-repository.ts
**Status:** completed
**Owner:** main-agent
**Wave:** 1
**Blocked by:** —
**Files:** app/db/game-repository.ts, docs/code-structure/db.md

### Task 2 — Add getRecentResultsData to hub-actions.ts
**Status:** completed
**Owner:** main-agent
**Wave:** 2
**Blocked by:** Task 1
**Files:** app/actions/hub-actions.ts, docs/code-structure/actions.md, CODE-STRUCTURE.md

### Task 3 — Add recentResults translation keys to en and es hub.json
**Status:** completed
**Owner:** main-agent
**Wave:** 1
**Blocked by:** —
**Files:** locales/en/hub.json, locales/es/hub.json

### Task 4 — Create RecentResultsWidget client component
**Status:** completed
**Owner:** main-agent
**Wave:** 2
**Blocked by:** Task 3
**Files:** app/components/tournament-hub/recent-results-widget.tsx, docs/code-structure/components/components-tournament-hub.md

### Task 5 — Create TournamentHubRecentResults server component and wire into hub page
**Status:** completed
**Owner:** main-agent
**Wave:** 3
**Blocked by:** Tasks 2, 4
**Files:** app/components/tournament-hub/tournament-hub-recent-results.tsx, app/[locale]/tournaments/[id]/hub/page.tsx, docs/code-structure/pages.md, CODE-STRUCTURE.md

### Task 6 — Write tests for all new code
**Status:** completed
**Owner:** main-agent
**Wave:** 4
**Blocked by:** Task 5
**Files:** app/components/tournament-hub/__tests__/recent-results-widget.test.tsx, app/components/tournament-hub/__tests__/tournament-hub-recent-results.test.tsx, app/actions/__tests__/hub-actions.test.ts (added), app/[locale]/tournaments/[id]/hub/__tests__/page.test.tsx (updated)
