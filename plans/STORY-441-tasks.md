# Story 441 Tasks

## Wave Summary
- Wave 1 (Parallel): Task 1A (types.ts + PSH icons), Task 1B (PriorityAttentionState timing fields)
- Wave 2 (Sequential): Task 2 (hub-header-variant.ts)
- Wave 3 (Parallel): Tasks 3A (tests), 3B (priority-attention-widget), 3C (engagement-rotator-widget), 3D (hub-logged-out-header + dashboard-banner)
- Wave 4 (Sequential): Validation + commit

## Tasks

### Task 1A — Extend PSH type system with 5 new icons
**Status:** pending
**Wave:** 1
**Blocked by:** —
**Files:** app/components/prediction-status-header/types.ts, app/components/prediction-status-header/prediction-status-header.tsx

Add `'login' | 'clock' | 'book' | 'mobile' | 'bell'` to the `leadIcon` union in types.ts. Add rendering for each in the `LeadIcon` switch in prediction-status-header.tsx (LoginIcon, AccessTimeIcon, MenuBookIcon, InstallMobileIcon, NotificationsNoneIcon from @mui/icons-material).

CODE-STRUCTURE: components-shared-ui.md (PSH section), no call graph change.

### Task 1B — Enrich PriorityAttentionState with timing fields
**Status:** pending
**Wave:** 1
**Blocked by:** —
**Files:** app/utils/priority-attention.ts

Add `msUntilMostUrgentGame?: number` to PriorityAttentionState (populated in urgent-games branch). Add `msUntilPredictionLock?: number` to PriorityAttentionState (populated in deadline branch via buildDeadlineState).

CODE-STRUCTURE: utils.md (priority-attention section), no call graph change.

### Task 2 — Create hub-header-variant.ts
**Status:** pending
**Wave:** 2
**Blocked by:** Task 1A, Task 1B
**Files:** app/components/prediction-status-header/hub-header-variant.ts (new)

Three exported functions: computeHubPriorityVariant (P1-P5), computeLoggedOutVariant (S1), computeEngagementVariant (P6-P8). See plan Mid-Level Design for full specs.

CODE-STRUCTURE: components-shared-ui.md (PSH section — add hub-header-variant.ts entry), no call graph change.

### Task 3A — Write unit tests for hub-header-variant.ts
**Status:** pending
**Wave:** 3
**Blocked by:** Task 2
**Files:** app/components/prediction-status-header/__tests__/hub-header-variant.test.ts (new)

Tests for all 3 exported functions. Use local makeState() helpers + mockT pattern. See plan for full test list.

CODE-STRUCTURE: none (test file).

### Task 3B — Update priority-attention-widget.tsx
**Status:** pending
**Wave:** 3
**Blocked by:** Task 2
**Files:** app/components/tournament-hub/priority-attention-widget.tsx

Replace buildCardConfig() + custom Paper card with PredictionStatusHeader + computeHubPriorityVariant. Remove CardConfig type, Paper/Avatar/Typography/Button imports no longer needed.

CODE-STRUCTURE: components-tournament-hub.md, no call graph change (same callers, same outputs).

### Task 3C — Update engagement-rotator-widget.tsx
**Status:** pending
**Wave:** 3
**Blocked by:** Task 2
**Files:** app/components/tournament-hub/engagement-rotator-widget.tsx

Replace EngagementCard sub-component + CardProps interface with PredictionStatusHeader + computeEngagementVariant. Keep all state management, localStorage, event handlers, dialog logic.

CODE-STRUCTURE: components-tournament-hub.md, no call graph change.

### Task 3D — Create HubLoggedOutHeader + update DashboardBanner
**Status:** pending
**Wave:** 3
**Blocked by:** Task 2
**Files:** app/components/tournament-hub/hub-logged-out-header.tsx (new), app/components/tournament-hub/dashboard-banner.tsx

New HubLoggedOutHeader Client Component manages dialog state + renders PredictionStatusHeader. DashboardBanner imports HubLoggedOutHeader instead of LoggedOffBanner.

CODE-STRUCTURE: components-tournament-hub.md (add hub-logged-out-header.tsx, update dashboard-banner.tsx entry), no call graph change (same structure, different leaf component).

### Task 4 — Validation + CODE-STRUCTURE + commit
**Status:** pending
**Wave:** 4
**Blocked by:** All Wave 3 tasks
**Files:** docs/code-structure/*, CODE-STRUCTURE.md

Run tests, lint, build. Update CODE-STRUCTURE layer files. Commit and push.
