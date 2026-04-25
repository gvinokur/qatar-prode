# Story #359 — [Story 6] Dashboard: Hub Page Orchestration

## Context

Stories 1–5 of the Dashboard series decoupled the monolithic `TournamentHubActionCenter` into individual, independently rendered widgets (`GamesPredictionWidget`, `QualifiedTeamsWidget`, `AwardsWidget`, `TournamentHubLeaderboardPeek`, `TournamentHubRecentResults`, `StatsAtAGlanceWidget`). Those widgets are now directly orchestrated by the hub page (`app/[locale]/tournaments/[id]/page.tsx`).

Story 6 is the final chapter: confirm the hub page correctly implements the visibility matrix and remove the now-orphaned legacy components that are no longer referenced by any production code.

---

## Objectives

1. Fix widget render order in `page.tsx` to match the canonical grid sequence
2. Delete the three orphaned legacy components and their test files
3. Clean up stale comments referencing deleted components
4. Update CODE-STRUCTURE documentation

---

## Acceptance Criteria

- **Widget Order** — Grid renders widgets in the canonical sequence:
  1. Games Card (pre-tournament info or active carousel)
  2. Qualified Teams (pre-lock only)
  3. Awards (pre-lock only)
  4. Results (post-start; becomes slot 2 once QT/Awards lock)
  5. Stats (post-start, authenticated only; becomes slot 3 once QT/Awards lock)
  6+. Friend Groups (always last)

- **Visibility Matrix** — Teams/Awards widgets hidden after prediction lock; Results/Stats shown after tournament start.
  - `QualifiedTeamsWidget` + `AwardsWidget`: rendered only when `msUntilPredictionLock > 0`
  - `TournamentHubRecentResults`: rendered only when `timing?.tournamentHasStarted`
  - `StatsAtAGlanceWidget`: rendered only when `timing?.tournamentHasStarted && user`
  - **Visibility rules already implemented; order fix required (see Step 0 below).**

---

## Technical Approach

### Step 0: Fix Widget Render Order in `app/[locale]/tournaments/[id]/page.tsx`

**Current order (incorrect):**
1. `GamesPredictionWidget`
2. `QualifiedTeamsWidget` + `AwardsWidget` (pre-lock)
3. `TournamentHubLeaderboardPeek` ← Friend Groups inserted too early
4. `TournamentHubRecentResults` (post-start)
5. `StatsAtAGlanceWidget` (post-start, authenticated)

**Correct order:**
1. `GamesPredictionWidget`
2. `QualifiedTeamsWidget` (pre-lock)
3. `AwardsWidget` (pre-lock)
4. `TournamentHubRecentResults` (post-start)
5. `StatsAtAGlanceWidget` (post-start, authenticated)
6. `TournamentHubLeaderboardPeek` ← Friend Groups always last

Change: move the `TournamentHubLeaderboardPeek` `<Suspense>` block to after `StatsAtAGlanceWidget`.

### Why These Components Can Be Safely Deleted

| Component | Status | Evidence |
|-----------|--------|---------|
| `TournamentHubActionCenter` | Orphaned | No production file imports it — only its own test |
| `PreTournamentNewUserActionCenter` | Orphaned | Only imported by `TournamentHubActionCenter` (being removed) |
| `ActionCenterCarousel` | Orphaned | Only imported by `TournamentHubActionCenter` (being removed) |

All three components' functionality has been superseded:
- `ActionCenterCarousel` → replaced by `GamesActiveWidget` + `GamesActiveSection` (game carousel) and separate `QualifiedTeamsWidget`/`AwardsWidget` cards
- `PreTournamentNewUserActionCenter` → replaced by `DashboardBanner` (countdown + tutorial CTA) + individual widgets for each prediction track
- `TournamentHubActionCenter` → removed as a routing shell; the hub page now directly orchestrates widgets

### Step 1: Delete Legacy Components (3 source files)

```
app/components/tournament-hub/tournament-hub-action-center.tsx
app/components/tournament-hub/pre-tournament-new-user-action-center.tsx
app/components/tournament-hub/action-center-carousel.tsx
```

### Step 2: Delete Legacy Test Files (3 test files)

```
app/components/tournament-hub/__tests__/tournament-hub-action-center.test.tsx
app/components/tournament-hub/__tests__/pre-tournament-new-user-action-center.test.tsx
app/components/tournament-hub/__tests__/action-center-carousel.test.tsx
```

### Step 3: Clean Up Stale Comment in `pre-tournament-hero.tsx`

Lines 8–11 contain a stale comment referencing `ActionCenterCarousel`:
```ts
// PreTournamentCountdown — exported so ActionCenterCarousel can render it
// ABOVE the "Action Center" header title.
// ---------------------------------------------------------------------------
```
Remove this multi-line comment block. `PreTournamentCountdown` is now used by `DashboardBanner`.

### Step 4: Verify No Orphaned Exports in `hub-actions.ts`

- `computeIsIncompleteUser` — still used by `DashboardBanner.tsx` → **keep**
- `getActionCenterGames` — still used by `page.tsx` → **keep**
- `ActionCenterData` type — still used by `page.tsx`, `DashboardBanner`, `GamesPredictionWidget` → **keep**

No changes needed to `hub-actions.ts`.

### Step 5: Update CODE-STRUCTURE Docs

- `docs/code-structure/components/components-tournament-hub.md`: remove entries for the 3 deleted components
- `CODE-STRUCTURE.md`: verify call graph — no changes needed (deleted components were already absent from the hub page's call graph after Stories 1–5)

---

## Mid-Level Design

No new functions or components. This story is purely deletion + documentation cleanup.

### Call Graph Changes

No call graph changes. The removed components were already absent from the hub page's data flow.

---

## Files to Delete

```
app/components/tournament-hub/tournament-hub-action-center.tsx
app/components/tournament-hub/pre-tournament-new-user-action-center.tsx
app/components/tournament-hub/action-center-carousel.tsx
app/components/tournament-hub/__tests__/tournament-hub-action-center.test.tsx
app/components/tournament-hub/__tests__/pre-tournament-new-user-action-center.test.tsx
app/components/tournament-hub/__tests__/action-center-carousel.test.tsx
```

## Files to Modify

```
app/[locale]/tournaments/[id]/page.tsx                          # fix widget render order (move LeaderboardPeek to end)
app/components/tournament-hub/pre-tournament-hero.tsx           # remove stale comment (lines 8–11)
docs/code-structure/components/components-tournament-hub.md     # remove deleted component entries
```

---

## Testing Strategy

- Run `npm test` — all existing tests should pass. The deleted test files tested deleted components; no regressions expected elsewhere.
- Run `npm run build` — should complete with no missing module errors.
- Run `npm run lint` — should be clean.

No new tests required — we are deleting dead code, not adding functionality.

---

## Validation Checklist

1. `npm run build` — succeeds with no module-not-found errors
2. `npm test` — green (fewer tests than before, no failures)
3. `npm run lint` — no ESLint issues
4. `grep -r "TournamentHubActionCenter\|PreTournamentNewUserActionCenter\|ActionCenterCarousel" app/` — returns zero results (complete removal confirmed)
