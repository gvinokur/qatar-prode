# Story 332 Tasks

## Wave Summary
- Wave 1 (Sequential): Task 1 (DB schema + types)
- Wave 2 (Parallel): Task 2 (DB repo) + Task 8 (translations)
- Wave 3 (Parallel): Task 3 (server actions) + Task 4 (TournamentGroupCard)
- Wave 4 (Parallel): Task 5 (FriendGroupsList) + Task 6 (TournamentGroupsList)
- Wave 5 (Sequential): Task 7 (data flow wiring)

## Tasks

### Task 1 — Create DB migration and add UserFavoriteGroupTable type definitions
**Status:** pending
**Owner:**
**Wave:** 1
**Blocked by:** —
**Files:** migrations/20260417000000_create_user_favorite_groups.sql, app/db/tables-definition.ts, app/db/database.ts

### Task 2 — Implement favorite-groups-repository.ts
**Status:** pending
**Owner:**
**Wave:** 2
**Blocked by:** Task 1
**Files:** app/db/favorite-groups-repository.ts

### Task 3 — Implement favorite-group-actions.ts and update getGroupsForUser
**Status:** pending
**Owner:**
**Wave:** 3
**Blocked by:** Task 2
**Files:** app/actions/favorite-group-actions.ts, app/actions/prode-group-actions.ts

### Task 4 — Update TournamentGroupCard — add star/crown icons and clickable title link
**Status:** pending
**Owner:**
**Wave:** 3
**Blocked by:** —
**Files:** app/components/tournament-page/tournament-group-card.tsx

### Task 5 — Update FriendGroupsList — add star/crown icons, sort logic, and optimistic state
**Status:** pending
**Owner:**
**Wave:** 4
**Blocked by:** Task 3
**Files:** app/components/tournament-page/friend-groups-list.tsx

### Task 6 — Update TournamentGroupsList — add sort, optimistic state, pass favorites props to cards
**Status:** pending
**Owner:**
**Wave:** 4
**Blocked by:** Tasks 3, 4
**Files:** app/components/tournament-page/tournament-groups-list.tsx

### Task 7 — Wire favorites data through layout, page, and sidebar
**Status:** pending
**Owner:**
**Wave:** 5
**Blocked by:** Tasks 3, 5, 6
**Files:** app/[locale]/tournaments/[id]/layout.tsx, app/components/tournament-page/tournament-sidebar.tsx, app/[locale]/tournaments/[id]/friend-groups/page.tsx, app/definitions.ts

### Task 8 — Fix Spanish translations and add favorites i18n keys
**Status:** pending
**Owner:**
**Wave:** 2
**Blocked by:** —
**Files:** locales/es/groups.json, locales/en/groups.json
