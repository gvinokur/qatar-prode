# Implementation Plan: Qualified Teams Groups - Multiple UI/UX Fixes

**Story:** #124 - [BUG] Qualified Teams Groups - Multiple UI/UX Issues
**Type:** Bugfix
**Complexity:** Medium

**Plan Status:** Updated after merging latest main (commits 4102a27, 5b1b4e3)
- ✅ Merged main successfully with no conflicts
- ✅ Verified line numbers still accurate (getSelectionBorderColor at line 111, isLocked at line 311)
- ✅ Confirmed all test files already exist (draggable-team-card.test.tsx, group-card.test.tsx)
- ✅ Plan updated to reflect current codebase state

## Story Context

Three UI/UX bugs identified in the qualified teams groups page that affect user experience in editable mode:

1. **Pre-selection indicators**: First 2 teams show yellow qualification indicators before user selection
2. **No completion status**: No visual indication of whether user has made predictions on a group
3. **Wrong indicator color**: Qualification markers use yellow (warning) instead of green (success)

~~4. **Saving state confusion**: Saving state uses same visual as "permanently locked" state~~ ❌ **REMOVED** - Current locked state behavior is correct per user feedback

These issues make it confusing for users to:
- Distinguish between "I selected this" vs "This is just in a qualifying position"
- Know which groups they've completed
- Interpret qualification status (yellow = warning, should be green = success)

## Acceptance Criteria

- [ ] Qualification indicators appear ONLY on teams with `predicted_to_qualify === true` (in both editable and readonly modes)
- [ ] NO automatic borders based on position alone (positions 1-2 should not auto-show borders)
- [ ] Groups show clear binary completion status (completed icon/color when group has been touched)
- [ ] Qualification markers use green color instead of yellow
- [ ] All changes preserve existing drag-and-drop functionality
- [ ] Tests updated to cover new behaviors
- [ ] No SonarCloud issues introduced

## Technical Approach

### Bug 1: Fix Pre-selection Indicators - Check predicted_to_qualify, Not Position

**Current behavior:**
- `getSelectionBorderColor()` in `draggable-team-card.tsx` returns yellow border for positions 1-2 automatically
- Line 118: `if (position === 1 || position === 2 || (position === 3 && predictedToQualify))`
- Shows borders based on POSITION, not on actual `predicted_to_qualify` value
- Results in borders appearing before user has set `predicted_to_qualify === true`

**Fix:**
- Change logic to ONLY check `predictedToQualify` (the prop), not position
- Show colored borders when `predictedToQualify === true`, regardless of position
- Don't show borders based on position alone
- Rationale: Borders should indicate user's prediction (predicted_to_qualify), not automatic position-based assumptions

**Changes:**
```typescript
// draggable-team-card.tsx:110-123
function getSelectionBorderColor(theme: Theme, options: BorderColorOptions): string | null {
  const { disabled, predictedToQualify } = options;

  if (disabled) {
    return null;  // In readonly mode, other functions handle colors
  }

  // Show border ONLY when predicted_to_qualify is explicitly true
  // Don't auto-show based on position
  if (predictedToQualify) {
    return theme.palette.success.main;  // Use green, not yellow (Bug 3 fix)
  }

  return null;
}
```

**Key change:** Remove `position === 1 || position === 2` check, only check `predictedToQualify`

### Bug 2: Add Group Completion Status Indicators

**Current behavior:**
- Mobile accordion shows: "GRUPO A - 2 seleccionados" (qualification count)
- No clear indicator if user has touched/completed this group
- User can't distinguish "not started" from "completed"

**Key insight (from user feedback):**
- When a group is touched, ALL 4 positions are set at once (not incrementally)
- Completion is binary: either 0 teams positioned (not touched) OR 4 teams positioned (touched)
- There is NO intermediate state (no 2/4 or 3/4)
- The "X seleccionados" already shows qualified count (which is correct)

**Fix:**
- Add binary completion indicator: Has this group been touched/completed?
- Show visual difference between "not completed" and "completed" groups
- Keep existing "X seleccionados" count (shows qualified teams)
- Don't show "X/4" positioning count (it's always 0/4 or 4/4)

**Implementation:**
1. Check if group has been touched: Do predictions exist for this group?
2. Add completion visual indicator (checkmark, chip color, etc.)
3. Desktop: Show completion badge/icon next to group letter
4. Mobile: Change accordion chip/header style when completed

**Changes:**
```typescript
// group-card.tsx
// Binary completion status - either all predictions exist or none
const isGroupCompleted = useMemo(() => {
  // If ANY team has a prediction, the group is completed (all 4 are set)
  return teams.some(team => predictions.has(team.id));
}, [teams, predictions]);

// Update GroupHeader component (DESKTOP)
// Show completion indicator (e.g., checkmark icon)
<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
  <Typography variant="h5">GRUPO {groupLetter.toUpperCase()}</Typography>
  {isGroupCompleted && <CheckCircleIcon sx={{ fontSize: 20, color: 'success.main' }} />}
</Box>

// Update mobile accordion summary (MOBILE)
// Change chip/header style when completed
<Chip
  icon={isGroupCompleted ? <CheckCircleIcon /> : undefined}
  label={`${qualifiedCount} seleccionado${qualifiedCount === 1 ? '' : 's'}`}
  size="small"
  color={isGroupCompleted ? "success" : "default"}
  sx={{ mr: 1 }}
/>
```

**Key difference from original plan:**
- ❌ Don't show "X/4 equipos posicionados" (always 0 or 4)
- ✅ Show binary completion status (completed icon/color)
- ✅ Keep existing "X seleccionados" qualified count

### Bug 3: Change Yellow to Green

**Current behavior:**
- `getSelectionBorderColor()` returns `theme.palette.warning.main` (yellow)
- Yellow indicates warning/caution, not positive selection

**Fix:**
- Change `theme.palette.warning.main` to `theme.palette.success.main`
- Note: With Bug 1 fix (removing editable mode borders), this only affects locked mode
- Locked mode already uses success.main for correct predictions (line 100, 152)
- Ensure consistency across all "qualified" states

**Changes:**
- If `getSelectionBorderColor` is kept for any reason, change yellow to green
- Review all usage of `warning.main` in draggable-team-card.tsx
- Ensure pending states still use `info.main` (blue) appropriately

### ~~Bug 4: Distinct Saving State~~ ❌ **REMOVED**

**User feedback:** "Not needed, the locked state is good as it is right now."

The current behavior where `isLocked={isLocked || isSaving}` (line 311 in qualified-teams-client-page.tsx) is correct. Saving state using the same visual as locked state is acceptable and does not need to be changed.

**No changes required for Bug 4.**

## Files to Modify

### Core Component Files
1. **`app/components/qualified-teams/draggable-team-card.tsx`**
   - Fix `getSelectionBorderColor()` to check `predictedToQualify`, not position (Bug 1)
   - Change yellow to green (Bug 3)
   - Lines to modify: ~110-123 (getSelectionBorderColor function)

2. **`app/components/qualified-teams/group-card.tsx`**
   - Add binary completion status calculation (Bug 2)
   - Update `GroupHeader` with completion indicator icon/badge (Bug 2)
   - Update mobile accordion summary with completion styling (Bug 2)
   - Lines to modify: ~45-68 (header), ~106-112 (accordion), ~215-217 (summary)

### Test Files to Update

**Existing test files (verified after merging latest main):**
- `__tests__/components/qualified-teams-context.test.tsx` ✓ (exists)
- `__tests__/components/qualified-teams/qualified-teams-client-page-dnd.test.tsx` ✓ (exists)
- `__tests__/components/qualified-teams/qualified-teams-client-page-smoke.test.tsx` ✓ (exists)
- `__tests__/components/qualified-teams/qualified-teams-grid.test.tsx` ✓ (exists)
- `__tests__/components/qualified-teams/draggable-team-card.test.tsx` ✓ (exists - 16KB, comprehensive)
- `__tests__/components/qualified-teams/group-card.test.tsx` ✓ (exists - 6KB, comprehensive)

**Updates required:**

1. **`__tests__/components/qualified-teams/draggable-team-card.test.tsx`** (UPDATE existing tests)
   - ADD: No colored border in editable mode (Bug 1)
   - MODIFY: Verify green border in locked mode for qualified teams (Bug 3)
   - ADD: Saving spinner appears when isSaving=true && !disabled
   - ADD: Drag disabled when isSaving=true OR disabled=true
   - ADD: Third place checkbox disabled when isSaving=true
   - VERIFY: Existing border logic preserved (pending, correct, wrong results)
   - Note: File already has 16KB of tests - update existing tests for border colors

2. **`__tests__/components/qualified-teams/group-card.test.tsx`** (UPDATE existing tests)
   - ADD: Completion status calculated correctly (0/4, 2/4, 4/4)
   - ADD: Completion indicator visible in header (desktop)
   - ADD: Completion chip in accordion summary (mobile)
   - ADD: isSaving prop threaded through to DraggableTeamCard
   - Note: File already has 6KB of tests - extend with new test cases

3. **`__tests__/components/qualified-teams/qualified-teams-grid.test.tsx`**
   - Test: isSaving prop passed to all GroupCard components
   - Update snapshots for new completion status UI
   - Test: Grid rendering with new props

4. **`__tests__/components/qualified-teams/qualified-teams-client-page-dnd.test.tsx`**
   - Test: isLocked and isSaving passed separately (not combined)
   - Test: Saving state shows visual indicators (spinner)
   - Test: Drag-and-drop disabled during save
   - Test: Edge case - isSaving=true && isLocked=true (spinner hidden)

5. **`__tests__/components/qualified-teams-context.test.tsx`**
   - Test: isSaving state computed correctly (saveState === 'saving')
   - Test: Save state transitions (idle -> saving -> saved -> idle)
   - Test: isSaving remains false when saveState is 'saved' or 'error'

## Implementation Steps

### Phase 1: Core Component Changes (Sequential)

**Step 1.1: Fix Bug 1 - Check predictedToQualify, Not Position**
- Modify `getSelectionBorderColor()` in `draggable-team-card.tsx`
- Remove automatic position-based borders (position 1, 2)
- Only check `predictedToQualify` prop
- Return green color when `predictedToQualify === true`

**Step 1.2: Fix Bug 3 - Change Yellow to Green**
- In `getSelectionBorderColor()`, use `theme.palette.success.main` instead of `theme.palette.warning.main`
- Verify consistency with existing success states

**Step 1.3: Fix Bug 2 - Add Binary Completion Status**
- Add binary completion calculation to `GroupCard` (group touched or not)
- Update `GroupHeader` component with completion icon/badge
- Update mobile accordion summary with completion styling (color change when complete)

### Phase 2: Testing (Parallel after Phase 1)

**Step 2.1: Update Existing Tests**
- Update snapshots for new UI elements
- Fix broken tests due to prop changes
- Verify all existing tests pass

**Step 2.2: Add New Test Cases**
- Completion status indicators (Bug 2)
- Saving state visuals (Bug 4)
- Border colors in editable vs readonly (Bugs 1, 3)
- Drag-and-drop disabled during save (Bug 4)

### Phase 3: Manual Verification

**Step 3.1: Visual Testing**
- Test in editable mode: no yellow borders on positions 1-2
- Test in locked mode: green borders for qualified teams
- Test saving state: spinner appears, drag disabled
- Test completion status: shows correctly on all groups

**Step 3.2: Interaction Testing**
- Drag teams in editable mode: smooth, no borders
- Lock tournament: borders appear with correct colors
- Save predictions: spinner appears, UI disabled briefly
- Check mobile accordion: completion status visible

## Testing Strategy

### Unit Tests (Vitest + React Testing Library)

**Test Coverage Requirements:**
- New code: ≥80% coverage (SonarCloud requirement)
- Focus on business logic and UI state changes

**Test Cases:**

1. **DraggableTeamCard Tests** (`draggable-team-card.test.tsx`)
   - ✅ Borders only show when `predictedToQualify === true`, not based on position (Bug 1)
   - ✅ Green border shown when qualified, not yellow (Bug 3)
   - ✅ No automatic borders for positions 1-2 in editable mode (Bug 1)
   - ✅ Existing border logic preserved (pending, correct, wrong results)

2. **GroupCard Tests** (`group-card.test.tsx`)
   - ✅ Binary completion status calculated correctly (touched vs not touched)
   - ✅ Completion indicator visible when group is touched (Bug 2)
   - ✅ Completion styling in accordion summary (mobile)
   - ✅ "X seleccionados" count shows qualified teams

**Test Utilities:**
- Use `renderWithTheme()` from `@/__tests__/utils/test-utils`
- Use mock data factories from `@/__tests__/db/test-factories`
- Mock Next.js hooks with utilities from `@/__tests__/mocks/`

### Manual Testing Checklist

**Desktop View:**
- [ ] Editable mode: No yellow borders on positions 1-2
- [ ] Editable mode: Completion status shows "X/4 equipos posicionados"
- [ ] Locked mode: Green borders on qualified teams
- [ ] Saving state: Spinner visible, drag disabled
- [ ] Results mode: Green (correct) and red (wrong) borders

**Mobile View:**
- [ ] Accordion collapsed: Shows completion status
- [ ] Accordion expanded: Completion indicator visible
- [ ] Saving state: Spinner in accordion summary
- [ ] All interactions work on touch devices

**Edge Cases:**
- [ ] Empty group (0/4 predictions)
- [ ] Partial predictions (2/4 teams)
- [ ] Complete predictions (4/4 teams)
- [ ] Rapid drag operations during save
- [ ] Network error during save (rollback works)

## Validation Considerations

### SonarCloud Requirements

**Code Coverage:**
- New code must have ≥80% line coverage
- Focus on:
  - Border color logic branches
  - Completion status calculation
  - isSaving prop handling
  - Drag-and-drop disable logic

**Code Quality:**
- 0 new issues of any severity
- No code duplication (DRY principle)
- Maintain existing security rating (A)
- Maintainability rating ≥ B

**Potential Issues:**
- Cognitive complexity in border color functions (already exists)
- Duplication in completion status logic (extract to utility)
- Props drilling (isSaving through 3 layers) - acceptable for this case

### Pre-Commit Validation

**Must pass before commit:**
```bash
npm run test       # All tests pass
npm run lint       # No linting errors
npm run build      # Build succeeds
```

**If tests fail:** Fix issues before committing
**If lint fails:** Fix formatting/style issues
**If build fails:** Fix TypeScript/compilation errors

### Deployment Considerations

- Changes are purely UI/visual - no database migrations needed
- No API changes - existing server actions unchanged
- No breaking changes - all props are additions or modifications
- Safe to deploy without feature flag

## Open Questions

None - requirements are clear from bug descriptions.

## Visual Prototypes

### Bug 1 & 3: Border Colors

**Before (Current - Editable Mode):**
```
┌──────────────────────────────────────┐
│ 🟡 [1st] Argentina                   │  ← Yellow border (auto)
├──────────────────────────────────────┤
│ 🟡 [2nd] Brazil                      │  ← Yellow border (auto)
├──────────────────────────────────────┤
│ ⬜ [3rd] Chile         [☐] Clasifica │  ← No border
├──────────────────────────────────────┤
│ ⬜ [4th] Uruguay                     │  ← No border
└──────────────────────────────────────┘
```

**After (Fixed - Editable Mode):**
```
┌──────────────────────────────────────┐
│ ⬜ [1st] Argentina                   │  ← No border
├──────────────────────────────────────┤
│ ⬜ [2nd] Brazil                      │  ← No border
├──────────────────────────────────────┤
│ ⬜ [3rd] Chile         [☐] Clasifica │  ← No border
├──────────────────────────────────────┤
│ ⬜ [4th] Uruguay                     │  ← No border
└──────────────────────────────────────┘
```

**After (Fixed - Locked/Results Mode):**
```
┌──────────────────────────────────────┐
│ 🟢 [1st] Argentina      +2 pts ✓    │  ← Green border (qualified)
├──────────────────────────────────────┤
│ 🟢 [2nd] Brazil         +2 pts ✓    │  ← Green border (qualified)
├──────────────────────────────────────┤
│ 🔴 [3rd] Chile          +0 pts ✗    │  ← Red border (wrong)
├──────────────────────────────────────┤
│ ⬜ [4th] Uruguay                     │  ← No border (not predicted)
└──────────────────────────────────────┘
```

### Bug 2: Completion Status Indicators

**Desktop - Group Header:**
```
┌─────────────────────────────────────────┐
│  GRUPO A                                │
│  2/4 equipos posicionados               │  ← New status indicator
│  ─────────────────────────────────────  │
│                                         │
│  [Teams listed below]                   │
└─────────────────────────────────────────┘
```

**Mobile - Accordion Summary:**
```
┌─────────────────────────────────────────┐
│  GRUPO A                    [2/4] ▼     │  ← Status chip
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  GRUPO A                    [4/4] ▼     │  ← Complete (green chip)
└─────────────────────────────────────────┘
```

### ~~Bug 4: Saving State Indicator~~ ❌ **REMOVED**

User feedback: "Not needed, the locked state is good as it is right now."

No visual changes needed for saving state.

**States:**
- **Editable**: Borders only on teams with `predicted_to_qualify === true` (green), draggable
- **Locked**: Lock icon (already implemented via Alert), borders show results
- **Results**: Green/red borders based on correctness, points displayed, readonly

## Risk Assessment

**Low Risk:**
- Pure UI changes, no business logic affected
- No database schema changes
- No API contract changes
- Existing tests will catch regressions
- Only 2 component files modified

**Medium Risk:**
- Border color logic has multiple conditionals (requires careful testing)
- Color change from yellow to green affects visual consistency

**Mitigation:**
- Comprehensive test coverage (≥80%)
- Manual testing of all states (editable, locked, results)
- Code review focusing on border logic
- Visual regression testing on different screen sizes

## Success Criteria

- [ ] Borders only show when `predicted_to_qualify === true` (not based on position alone)
- [ ] Borders use green color instead of yellow
- [ ] Groups show binary completion indicator (touched vs not touched)
- [ ] All existing functionality preserved (drag-and-drop, third place selection, scoring)
- [ ] All tests pass with ≥80% coverage
- [ ] SonarCloud reports 0 new issues
- [ ] Manual testing checklist complete
- [ ] Code review approved

---

**Estimated Complexity:** Low-Medium (reduced from Medium due to Bug 4 removal)
**Estimated Files Changed:** 2 core files + 2 test files (reduced from 4+4)
**Breaking Changes:** None
**Database Migrations:** None
