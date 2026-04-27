# Story 393 Tasks

## Wave Summary
- Wave 1 (Sequential): Task 1 (DB layer)
- Wave 2 (Parallel): Task 2 (utility), Task 3 (translations)
- Wave 3 (Sequential): Task 4 (server action)
- Wave 4 (Parallel): Task 5 (banner component), Task 6 (tests)
- Wave 5 (Sequential): Task 7 (page/client integration)

## Tasks

### Task 1 — Extend TournamentPredictionCompletion with group game counts
**Status:** completed
**Owner:** main-agent
**Wave:** 1
**Blocked by:** —
**Files:** app/db/tables-definition.ts, app/db/tournament-prediction-completion-repository.ts, app/components/onboarding/demo/demo-data.ts
**Description:** Added completedGroupGames and totalGroupGames fields to TournamentPredictionCompletion type and the repository query. Fixed demo-data.ts build error.

### Task 2 — Pure utility: computeGroupStandingsFromGuesses
**Status:** completed
**Owner:** main-agent
**Wave:** 2
**Blocked by:** —
**Files:** app/utils/group-standings-calculator.ts, app/utils/__tests__/group-standings-calculator.test.ts
**Description:** New pure utility function that computes simulated group standings from user guesses. 9 unit tests covering all sort tiebreakers and edge cases.

### Task 3 — Translation keys for QT nudge banner
**Status:** completed
**Owner:** main-agent
**Wave:** 2
**Blocked by:** —
**Files:** locales/en/qualified-teams.json, locales/es/qualified-teams.json
**Description:** Added nudge namespace with all required keys for all 3 banner states and auto-fill dialog.

### Task 4 — bulkAutoFillFromPredictions server action
**Status:** completed
**Owner:** main-agent
**Wave:** 3
**Blocked by:** Task 2, Task 3
**Files:** app/actions/qualification-actions.ts, app/actions/__tests__/bulk-auto-fill.test.ts
**Description:** Server action that reads all group games + guesses, computes standings, upserts predictions for all groups, calls updatePlayoffGameGuesses, revalidates QT page. 6 tests.

### Task 5 — QTActionBanner component
**Status:** completed
**Owner:** main-agent
**Wave:** 4
**Blocked by:** Task 3, Task 4
**Files:** app/components/qualified-teams/qt-action-banner.tsx, app/components/qualified-teams/__tests__/qt-action-banner.test.tsx
**Description:** MUI Paper banner with 3 states. games-finished state shows confirm Dialog. 9 component tests.

### Task 6 — Update CODE-STRUCTURE layer files
**Status:** completed
**Owner:** main-agent
**Wave:** 4
**Blocked by:** Task 1, Task 2, Task 4, Task 5
**Files:** docs/code-structure/db.md, docs/code-structure/actions.md, docs/code-structure/utils.md, docs/code-structure/components/components-leaderboard-stats.md, CODE-STRUCTURE.md, docs/code-structure/pages.md
**Description:** Updated all layer files and extended Flow 4 call graph.

### Task 7 — Wire QTActionBanner into QT page and client page
**Status:** completed
**Owner:** main-agent
**Wave:** 5
**Blocked by:** Task 1, Task 5
**Files:** app/[locale]/tournaments/[id]/qualified-teams/page.tsx, app/components/qualified-teams/qualified-teams-client-page.tsx
**Description:** Server page derives qtBannerState from tournamentPredictionCompletion and passes it to QualifiedTeamsClientPage which mounts QTActionBanner.
