# Story 316 Tasks

## Wave Summary
- Wave 1 (Sequential): Task 1 — isHubEnabled utility
- Wave 2 (Parallel): Tasks 2, 3, 4, 7 — hub page / redirect / layout ranks / bottom nav
- Wave 3 (Parallel): Tasks 5, 8 — sidebar reorder / top nav hub item
- Wave 4 (Sequential): Task 6 — FriendGroupsList rank badges
- Wave 5 (Sequential): Task 9 — Tests

## Tasks

### Task 1 — Add isHubEnabled() to environment-utils.ts
**Status:** completed
**Owner:** main-agent
**Wave:** 1
**Blocked by:** —
**Files:** app/utils/environment-utils.ts

### Task 2 — Create hub page at /tournaments/[id]/hub
**Status:** pending
**Owner:**
**Wave:** 2
**Blocked by:** Task 1
**Files:** app/[locale]/tournaments/[id]/hub/page.tsx (new)

### Task 3 — Update TournamentRedirect to use hub flag
**Status:** pending
**Owner:**
**Wave:** 2
**Blocked by:** Task 1
**Files:** app/components/home/tournament-redirect.tsx

### Task 4 — Add groupRanks fetch to tournament layout
**Status:** pending
**Owner:**
**Wave:** 2
**Blocked by:** —
**Files:** app/[locale]/tournaments/[id]/layout.tsx

### Task 5 — Update TournamentSidebar — reorder sections and thread groupRanks
**Status:** pending
**Owner:**
**Wave:** 3
**Blocked by:** Task 4
**Files:** app/components/tournament-page/tournament-sidebar.tsx

### Task 6 — Add rank badges to FriendGroupsList
**Status:** pending
**Owner:**
**Wave:** 4
**Blocked by:** Task 5
**Files:** app/components/tournament-page/friend-groups-list.tsx

### Task 7 — Update TournamentBottomNav — reorder tabs and hub-aware Home
**Status:** pending
**Owner:**
**Wave:** 2
**Blocked by:** Task 1
**Files:** app/components/tournament-bottom-nav/tournament-bottom-nav.tsx

### Task 8 — Add Hub item to tournament top nav
**Status:** pending
**Owner:**
**Wave:** 3
**Blocked by:** Tasks 1, 2
**Files:** (find via topNav.matches search), locales/en/navigation.json, locales/es/navigation.json

### Task 9 — Write tests for story #316
**Status:** pending
**Owner:**
**Wave:** 5
**Blocked by:** Tasks 1–8
**Files:** multiple __tests__ files
