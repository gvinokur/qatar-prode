# Story 468 Plan: Banner Layout Bug Fix

## Context

**Story:** [Bug] Banner message and action buttons get squeezed onto the same row in narrow containers  
**Story Number:** 468  
**Story URL:** https://github.com/gvinokur/qatar-prode/issues/468  
**Labels:** bug  
**Project:** UX Audit 2026

Banners that use `PredictionStatusHeader` (tutorial, app install, notification opt-in, pre-tournament CTA, etc.) have a layout bug in their expanded section: when rendered inside a narrow container (e.g. a dashboard widget column), the message text and action buttons are forced onto the same flex row. Since the buttons have `flexShrink: 0` and the text has `flex: 1, minWidth: 0`, the text collapses to an unreadably thin column.

Expected behavior: in narrow containers, the message text should span the full banner width and buttons should appear below it, right-aligned.

---

## Acceptance Criteria

- [ ] Wide container: single row (message + buttons side by side) — unchanged
- [ ] Narrow container: message takes 100% width, buttons wrap to row below, right-aligned
- [ ] Single-button and two-button banners both reflow correctly
- [ ] All banner variants (tutorial, app install, notification opt-in, pre-tournament, etc.) behave consistently
- [ ] Layout is correct in EN and ES

---

## Root Cause

File: `app/components/prediction-status-header/prediction-status-header.tsx` (line 207)

```jsx
<Box sx={{ pl: 1.25, pr: 1.25, py: 1.25, display: 'flex', alignItems: 'center', gap: 1.25 }}>
  <Typography sx={{ flex: 1, minWidth: 0, ... }}>
    {variant.message}
  </Typography>
  {expandedActions}   {/* flexShrink: 0 */}
</Box>
```

Two problems:
1. The outer Box has no `flexWrap: 'wrap'`, so it never wraps.
2. The Typography has `minWidth: 0`, so when wrapping is absent it squeezes to nothing.

---

## Technical Approach

**One file to change:** `app/components/prediction-status-header/prediction-status-header.tsx`

Three targeted changes:

### 1. Add `flexWrap: 'wrap'` to the expanded section Box (line 207)

```diff
- <Box sx={{ pl: 1.25, pr: 1.25, py: 1.25, display: 'flex', alignItems: 'center', gap: 1.25 }}>
+ <Box sx={{ pl: 1.25, pr: 1.25, py: 1.25, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.25 }}>
```

### 2. Give the Typography a meaningful `flex-basis` so wrapping triggers before text becomes unreadable (line 208–213)

```diff
- sx={{ flex: 1, minWidth: 0, fontWeight: 600, ... }}
+ sx={{ flex: '1 1 150px', minWidth: 0, fontWeight: 600, ... }}
```

`flex: '1 1 150px'` means: grow to fill space, shrink if needed, but never accept less than 150px as its base. When the container can't provide 150px alongside the buttons, the text wraps to its own line (taking full width via flex-grow: 1).

### 3. Add `ml: 'auto'` to the expandedActions wrappers so they right-align when on their own row

In the `bothActions` case (line 117):
```diff
- <Box sx={{ display: 'flex', gap: 0.75, flexShrink: 0, flexWrap: 'wrap', alignItems: 'center' }}>
+ <Box sx={{ display: 'flex', gap: 0.75, flexShrink: 0, flexWrap: 'wrap', alignItems: 'center', ml: 'auto' }}>
```

In the single-action case (line 122–123), wrap the button in a Box:
```diff
- expandedActions = renderAction(variant.action, 'contained');
+ expandedActions = (
+   <Box sx={{ flexShrink: 0, ml: 'auto' }}>
+     {renderAction(variant.action, 'contained')}
+   </Box>
+ );
```

**Why `ml: 'auto'` achieves right-alignment on the wrapped row:**
- Wide mode: text has `flex-grow: 1` so it absorbs all free space → `ml: auto` is effectively 0, buttons sit naturally at end of row ✓
- Narrow mode: buttons are alone on their row; `ml: auto` absorbs all remaining space on the left → buttons pushed to the right edge ✓

---

## Visual Prototype

```
Wide container (> 150px text + buttons):
┌──────────────────────────────────────────────────┐
│ 🚀 Pre-tournament — get your picks in            │
├──────────────────────────────────────────────────┤
│ Install the app for instant notifications   [CTA]│
└──────────────────────────────────────────────────┘

Narrow container (< 150px text + buttons):
┌────────────────────────────┐
│ 🚀 Pre-tournament — ...    │
├────────────────────────────┤
│ Install the app for        │
│ instant notifications      │
│                      [CTA] │
└────────────────────────────┘

Two-button narrow:
┌────────────────────────────┐
│ 🚀 Pre-tournament — ...    │
├────────────────────────────┤
│ Complete your predictions  │
│ before the deadline        │
│           [Dismiss] [Predict]│
└────────────────────────────┘
```

---

## Files to Create / Modify

| File | Change |
|------|--------|
| `app/components/prediction-status-header/prediction-status-header.tsx` | Layout fix — 4 lines |

No new files. No new exports. No schema or DB changes.

---

## Mid-Level Design

### Call Graph Changes

No call graph changes. `PredictionStatusHeader` props and return type are unchanged; only the internal layout of the expanded section changes.

### `app/components/prediction-status-header/prediction-status-header.tsx` *(modified — internal layout only)*

**Changed internal layout (not an exported function — no signature change):**

The expanded section `<Box>` (currently line 207) and the `expandedActions` variable construction are the only changes. The exported component `PredictionStatusHeader({ variant })` keeps the same props and renders the same semantic content; only the flex layout properties change.

**Behaviour contract (regression tests):**
- Wide: message and buttons on one row (unchanged)
- Narrow: message fills full width; buttons are right-aligned on a new row below
- Single-button and two-button variants both right-align on wrap

---

## Testing Strategy

This is a pure CSS/layout change. jsdom (Vitest's DOM environment) does not compute CSS layout, so assertions on `margin-left: auto` or `flex-wrap` visual behavior are not meaningful — the only valid automated tests are structural/attribute assertions on the rendered JSX.

**Step 0 — Read existing tests first:**  
There are existing tests in `app/components/prediction-status-header/__tests__/`. Read them to find the mock variant construction pattern before writing new tests. Update existing snapshots if present; add new test cases if not covered.

**Test cases (snapshot-first approach — assert full rendered output to catch unintended sx changes):**

```
Test 1 — Expanded section has flexWrap enabled (both-action variant)
  Create a variant with message + two actions (using inline mock object — confirm with testFactories if factory exists)
  Render <PredictionStatusHeader variant={...} />
  Find the expanded-section Box (the one with py: 1.25 containing the message Typography)
  Assert: sx prop contains flexWrap: 'wrap'
  Assert: Typography sx contains flex: '1 1 150px'
  Assert: buttons wrapper Box sx contains ml: 'auto'

Test 2 — Single-action variant: action wrapped in Box with ml:auto
  Create a variant with message + one action, no secondaryAction
  Render <PredictionStatusHeader variant={...} />
  Find the single-action wrapper Box rendered by expandedActions
  Assert: sx contains ml: 'auto'

Test 3 — Non-expanded variant: expanded section is not rendered
  Create a variant with no message field
  Render <PredictionStatusHeader variant={...} />
  Assert: the Divider + expanded Box are not in the DOM

Test 4 — No-action expanded variant: expandedActions is null (message only)
  Create a variant with message but no action
  Render <PredictionStatusHeader variant={...} />
  Assert: expanded section renders; no Button elements present

Test 5 — Wide container regression: no changes to non-expanded (collapsed) state
  Create a variant with no message (collapsed header)
  Render <PredictionStatusHeader variant={...} />
  Assert: the Divider and expanded Box are absent — top strip layout unchanged
  (Visual regression for wide containers is covered by Vercel Preview; jsdom cannot simulate CSS layout)
```

**Mock variant data:** Read the existing tests in `app/components/prediction-status-header/__tests__/` first and reuse their mock construction pattern. The `StatusHeaderVariant` type is imported from `./types`.

---

## CODE-STRUCTURE.md Impact

No exported function signatures change. The `PredictionStatusHeader` component entry in `docs/code-structure/components/components-shared-ui.md` does not need updating. The call graph does not change.

The only CODE-STRUCTURE update required: **none** (internal layout only).

---

## Implementation Steps

1. Read the current file to confirm line numbers match.
2. Apply the three targeted edits to `app/components/prediction-status-header/prediction-status-header.tsx`:
   a. Add `flexWrap: 'wrap'` to expanded section Box
   b. Change Typography flex to `'1 1 150px'`
   c. Add `ml: 'auto'` to both expandedActions wrappers (and wrap single action in Box)
3. Run `npm run lint` and `npm run build` to verify no regressions.
4. Commit and push to feature branch for Vercel Preview.

---

## Implementation Amendments

### Amendment 1: Increase flex-basis from 150px to 200px
**Date:** 2026-06-10
**Reason:** After testing in Vercel Preview, user requested a wider minimum text width so wrapping triggers earlier in narrower containers.
**Change:** `flex: '1 1 150px'` changed to `flex: '1 1 200px'` in the expanded section Typography.

---

## Open Questions

None — the fix is well-defined and isolated.

---

## Story Context

- **Story Number:** 468
- **Story Title:** [Bug] Banner message and action buttons get squeezed onto the same row in narrow containers
- **Worktree Path:** (to be created by git-ops agent at `/Users/gvinokur/Personal/qatar-prode-story-468`)
- **Branch:** (to be created: `feature/story-468`)
- **PR Number:** (fill after PR creation)
- **PR URL:** (fill after PR creation)
- **Current Phase:** planning
