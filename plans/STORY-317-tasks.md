# Story 317 Tasks

## Wave Summary
- Wave 1 (Parallel): Task 1, Task 2
- Wave 2 (Parallel): Task 3, Task 4
- Wave 3 (Sequential): Task 5

## Tasks

### Task 1 — Create hub-actions.ts with getActionCenterGames + tests
**Status:** completed
**Owner:** main-agent
**Wave:** 1
**Blocked by:** —
**Files:** app/actions/hub-actions.ts, app/actions/__tests__/hub-actions.test.ts

### Task 2 — Add translation keys to locales/en/hub.json and locales/es/hub.json
**Status:** completed
**Owner:** main-agent
**Wave:** 1
**Blocked by:** —
**Files:** locales/en/hub.json, locales/es/hub.json

### Task 3 — Create action-center-carousel.tsx + tests
**Status:** completed
**Owner:** main-agent
**Wave:** 2
**Blocked by:** Task 1, Task 2
**Files:** app/components/tournament-hub/action-center-carousel.tsx, app/components/tournament-hub/__tests__/action-center-carousel.test.tsx

### Task 4 — Create tournament-hub-action-center.tsx (server wrapper)
**Status:** completed
**Owner:** main-agent
**Wave:** 2
**Blocked by:** Task 1
**Files:** app/components/tournament-hub/tournament-hub-action-center.tsx

### Task 5 — Update hub/page.tsx to use TournamentHubActionCenter + CODE-STRUCTURE updates
**Status:** completed
**Owner:** main-agent
**Wave:** 3
**Blocked by:** Task 3, Task 4
**Files:** app/[locale]/tournaments/[id]/hub/page.tsx, app/[locale]/tournaments/[id]/hub/__tests__/page.test.tsx, CODE-STRUCTURE.md, docs/code-structure/actions.md, docs/code-structure/pages.md, docs/code-structure/components/components-tournament-hub.md
