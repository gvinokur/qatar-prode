# Plan: [Bug] Hide third-place qualifier checkbox when tournament doesn't allow third-place qualification #323

## Story Context

**Issue:** #323
**Type:** Bug
**Branch:** `feature/story-323`
**Worktree:** `/Users/gvinokur/Personal/qatar-prode-story-323`

## Objective

Hide the third-place qualifier checkbox in the "Qualified Teams" page when the tournament's `allows_third_place_qualification` flag is `false`. Currently the checkbox renders (though disabled) even when the feature is turned off, causing user confusion.

## Acceptance Criteria

- [ ] Third-place qualifier checkbox is **not rendered** (hidden) for any team when `allows_third_place_qualification` is `false`
- [ ] For tournaments that **do** allow third-place qualification, the checkbox continues to appear correctly for position-3 teams
- [ ] Layout remains consistent after the checkbox is hidden (no blank space)
- [ ] Existing test coverage passes; new test verifies hidden-when-disabled behaviour

## Out of Scope

- Redesigning the `DraggableTeamCard` layout
- Modifying the third-place selection limit logic
- Backend/server action changes

## Root Cause Analysis

The prop `allowsThirdPlace` is threaded from `QualifiedTeamsClientPage` → `QualifiedTeamsGrid` → `GroupCard`, but it is **never passed into `DraggableTeamCard`**. The checkbox render condition in `DraggableTeamCard` is:

```tsx
// draggable-team-card.tsx line 471
{position === 3 && !isLocked && (
  <ThirdPlaceCheckbox ... />
)}
```

It only checks `isLocked` — not whether third-place qualification is enabled. When `isLocked: false` and `allowsThirdPlace: false`, the checkbox renders with `disabled={true}` (because `cannotAddMore` is true when `maxThirdPlace === 0`), but it's still visible.

## Technical Approach

Minimal two-file component fix + one test update.

### Step 1: Add `allowsThirdPlace` prop to `DraggableTeamCard`

**File:** `app/components/qualified-teams/draggable-team-card.tsx`

1. Add `allowsThirdPlace: boolean` to the `DraggableTeamCardProps` interface (after `maxThirdPlace`)
2. Destructure `allowsThirdPlace` in the function signature
3. Update the render condition:
   ```tsx
   // Before
   {position === 3 && !isLocked && (
   
   // After
   {position === 3 && !isLocked && allowsThirdPlace && (
   ```

### Step 2: Pass `allowsThirdPlace` from `GroupCard` to `DraggableTeamCard`

**File:** `app/components/qualified-teams/group-card.tsx`

In the `content` JSX where `DraggableTeamCard` is rendered (line ~190), add the prop:
```tsx
<DraggableTeamCard
  ...
  allowsThirdPlace={allowsThirdPlace}
  ...
/>
```

`GroupCard` already receives `allowsThirdPlace` in its props — no interface change needed there.

### Step 3: Update test

**File:** `__tests__/components/qualified-teams/qualified-teams-client-page-smoke.test.tsx`

Update the existing "should render with third place disabled" test to set up a position-3 prediction and assert the "Qualifies" checkbox label is **not** in the DOM.

Add an additional test: "should show third place checkbox when allowed and team is in position 3".

## Files to Modify

| File | Change |
|------|--------|
| `app/components/qualified-teams/draggable-team-card.tsx` | Add `allowsThirdPlace` prop + update render condition |
| `app/components/qualified-teams/group-card.tsx` | Pass `allowsThirdPlace` to `DraggableTeamCard` |
| `__tests__/components/qualified-teams/qualified-teams-client-page-smoke.test.tsx` | Update + add tests |
| `docs/code-structure/components/components-leaderboard-stats.md` | Update `DraggableTeamCard` description |

## Mid-Level Design

### Call Graph Changes

No call graph changes. This is a prop-threading fix within the existing render tree — no new cross-layer calls.

### `app/components/qualified-teams/draggable-team-card.tsx` *(modified)*

**Changed interface:**

- **DraggableTeamCardProps** — add field:
  ```typescript
  /** Whether third-place qualification is enabled for this tournament */
  readonly allowsThirdPlace: boolean;
  ```

**Changed function:**

- **DraggableTeamCard(props: DraggableTeamCardProps)**: `JSX.Element`
  Destructures the new `allowsThirdPlace` prop. Render condition for `ThirdPlaceCheckbox` becomes `position === 3 && !isLocked && allowsThirdPlace`.
  No behavior change for `allowsThirdPlace: true` (existing logic unchanged).
  Tests:
  - checkbox is not rendered when `allowsThirdPlace` is false and position is 3
  - checkbox is not rendered for position 4 regardless of `allowsThirdPlace`
  - checkbox renders when `allowsThirdPlace` is true and position is 3 and not locked

### `app/components/qualified-teams/group-card.tsx` *(modified)*

**Changed usage:**

- `DraggableTeamCard` in the `content` JSX now receives `allowsThirdPlace={allowsThirdPlace}`.
  Tests:
  - `GroupCard` passes `allowsThirdPlace: false` → `DraggableTeamCard` does not render checkbox
  - `GroupCard` passes `allowsThirdPlace: true` → `DraggableTeamCard` renders checkbox for position 3

## Testing Strategy

Tests run at the `QualifiedTeamsClientPage` integration level (existing smoke test pattern) since `DraggableTeamCard` and `GroupCard` have no standalone test files.

### New/Updated Tests in `qualified-teams-client-page-smoke.test.tsx`

**Update: "should render with third place disabled"**
- Add a position-3 prediction (`predicted_position: 3`) to the test data
- Assert `screen.queryByText('Qualifies')` is **null** (checkbox label not rendered)

**New: "should show third place checkbox when allowsThirdPlace is true and team is at position 3"**
- Set `allowsThirdPlace: true`, `maxThirdPlace: 4`
- Include a prediction with `predicted_position: 3`
- Assert `screen.queryByText('Qualifies')` is in the document

### Coverage Note

Existing tests cover `allowsThirdPlace: false` at the smoke level (renders without crash). New tests add assertion on DOM output for the actual fix.

## Validation Considerations

- **No DB migrations** needed
- **No schema changes** needed
- **TypeScript strict mode:** Adding required prop to interface will cause a compile error on existing `GroupCard` usage of `DraggableTeamCard` until Step 2 is done — implement both files in the same commit
- Run `npm run test`, `npm run lint`, `npm run build` before committing

## Open Questions

None.
