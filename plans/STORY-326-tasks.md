# Story 326 Tasks

## Wave Summary
- Wave 1 (Parallel): Tasks 1, 2
- Wave 2 (Sequential): Task 3
- Wave 3 (Parallel): Tasks 4, 5

## Tasks

### Task 1 — Create InviteFlierTemplate component
**Status:** completed
**Owner:** main-agent
**Wave:** 1
**Blocked by:** —
**Files:** app/components/friend-groups/sharing/InviteFlierTemplate.tsx

### Task 2 — Add translations for tabs and flier UI
**Status:** completed
**Owner:** main-agent
**Wave:** 1
**Blocked by:** —
**Files:** locales/es/groups.json, locales/en/groups.json

### Task 3 — Redesign InviteFriendsDialog with Tabs and Folleto tab
**Status:** completed
**Owner:** main-agent
**Wave:** 2
**Blocked by:** Tasks 1, 2
**Files:** app/components/invite-friends-dialog.tsx

### Task 4 — Propagate groupLogoUrl and themeColor through call sites
**Status:** completed
**Owner:** main-agent
**Wave:** 3
**Blocked by:** Task 3
**Files:** app/components/friend-groups/invite-friends-dialog-button.tsx, app/[locale]/friend-groups/[id]/page.tsx, app/[locale]/tournaments/[id]/friend-groups/[group_id]/page.tsx

### Task 5 — Write tests for InviteFlierTemplate and InviteFriendsDialog
**Status:** completed
**Owner:** main-agent
**Wave:** 3
**Blocked by:** Task 3
**Files:** app/components/friend-groups/sharing/__tests__/InviteFlierTemplate.test.tsx, app/components/__tests__/invite-friends-dialog.test.tsx
