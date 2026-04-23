# Story 356 Tasks

## Wave Summary
- Wave 1 (Parallel): Tasks 14, 15, 16, 17
- Wave 2 (Sequential): Task 18 (blocked by all Wave 1)

## Tasks

### Task 14 — Extend ActionCenterData with silverBoostsUsed/goldenBoostsUsed
**Status:** pending
**Owner:**
**Wave:** 1
**Blocked by:** —
**Files:** app/actions/hub-actions.ts, docs/code-structure/actions.md

### Task 15 — Extract computeUrgencyLevel to shared urgency-utils.ts
**Status:** pending
**Owner:**
**Wave:** 1
**Blocked by:** —
**Files:** app/utils/urgency-utils.ts (new), games-active-widget.tsx, games-active-section.tsx, docs/code-structure/utils.md

### Task 16 — Create getCarouselGames lightweight server action
**Status:** pending
**Owner:**
**Wave:** 1
**Blocked by:** —
**Files:** app/actions/hub-actions.ts, docs/code-structure/actions.md

### Task 17 — Update GuessesContextProvider with tournament-wide boost counts + delta
**Status:** pending
**Owner:**
**Wave:** 1
**Blocked by:** —
**Files:** app/components/context-providers/guesses-context-provider.tsx, docs/code-structure/components/components-context-providers.md

### Task 18 — Wire GamesActiveSection + GamesActiveWidget with getCarouselGames and boost tracking
**Status:** pending
**Owner:**
**Wave:** 2
**Blocked by:** Tasks 14, 15, 16, 17
**Files:** games-active-section.tsx, games-active-widget.tsx, docs/code-structure/components/components-tournament-hub.md, CODE-STRUCTURE.md
