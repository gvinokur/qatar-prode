# Story 457 — Remove leftover debug console.warn() logs from components

## Context

Two components have `console.warn()` debug calls that were never cleaned up after development:

- `ScrollShadowContainer` fires 4 warn calls on every scroll event, ResizeObserver callback, child observation, and MutationObserver callback — producing console noise on every user interaction with any scrollable container.
- `OnboardingDialogClient` logs full tournament scoring data on every render.

These add noise that can mask real warnings and degrade the developer experience.

## Acceptance Criteria

- No `[ScrollShadow]` console messages appear when scrolling or resizing a scroll shadow container
- No `[OnboardingDialogClient]` console messages appear when the onboarding dialog is shown
- Component behavior is unchanged for both components

## Files to Modify

| File | Change |
|------|--------|
| `app/components/common/scroll-shadow-container.tsx` | Delete 4 `console.warn` blocks (lines ~320, ~332, ~348, ~355) |
| `app/components/onboarding/onboarding-dialog-client.tsx` | Delete 1 `console.warn` block (lines ~28-39) including its "Debug:" comment |

## Technical Approach

Pure line deletions — no logic changes, no refactoring, no new tests (per "Out of Scope" in story).

### `scroll-shadow-container.tsx` — 4 removals

1. **`handleScroll`** (line ~320): Remove the `console.warn('[ScrollShadow] Scroll event fired', {...})` block (5 lines). Keep `setShadows(...)` call.

2. **`ResizeObserver` callback** (line ~332): Remove the `console.warn('[ScrollShadow] ResizeObserver fired', {...})` block (4 lines). Keep `clearTimeout` and `setTimeout` logic.

3. **`observeChildren`** (line ~348): Remove the single-line `console.warn('[ScrollShadow] Observing child:', child)` after `resizeObserver.observe(child)`.

4. **`MutationObserver` callback** (line ~355): Remove the `console.warn('[ScrollShadow] MutationObserver fired', {...})` block (3 lines). Keep the re-observe and recalculate calls.

### `onboarding-dialog-client.tsx` — 1 removal

Remove the `// Debug: Log tournament data...` comment and the entire `console.warn('[OnboardingDialogClient] Active tournament:', {...})` block (lines ~28-39, 11 lines total).

## Mid-Level Design

### Call Graph Changes

No call graph changes.

### Code Changes

No new or changed exported functions. Changes are deletions only — removing unreachable-in-production debug statements from within existing functions.

## Testing Strategy

Per story: "Out of Scope: Adding new tests."

Manual verification:
1. Open the app and scroll any scroll-shadow container — browser console should show no `[ScrollShadow]` messages.
2. Trigger the onboarding dialog — browser console should show no `[OnboardingDialogClient]` messages.
3. Confirm scrolling/shadow behavior and onboarding dialog behavior are functionally unchanged.

## Implementation Amendments

### Amendment 1: Test file required updates
**Date:** 2026-05-21
**Reason:** The plan stated "no test files cover these debug lines" but `onboarding-dialog-client.test.tsx` had 7 assertions and 2 full tests (`logs tournament data for debugging`, `describe('Console Logging')`) that directly asserted the removed `console.warn` calls. These were removed from the test file.
**Change:** Deleted `describe('Console Logging')` block (2 tests), and removed `console.warn` assertion blocks from `handles tournament with boosts configured`, `handles tournament without boosts`, `handles case when no tournaments exist`, and `handles multiple tournaments` tests. Net: 170 lines removed, 3 lines added.

### Amendment 2: Observer callback parameters simplified
**Date:** 2026-05-21
**Reason:** After removing the `console.warn` calls that used the `entries` and `mutations` parameters in the ResizeObserver and MutationObserver callbacks, those parameters became unused.
**Change:** Changed `ResizeObserver((entries) => {` to `ResizeObserver(() => {` and `MutationObserver((mutations) => {` to `MutationObserver(() => {` to avoid lint unused-variable warnings.

## Validation

- `npm run lint` — no ESLint errors (removing console.warn may satisfy any `no-console` lint rules)
- `npm run build` — clean build
- `npm run test` — existing tests unchanged (no test files cover these debug lines)
