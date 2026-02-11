# Implementation Plan: Qualified Teams Groups - Multiple UI/UX Fixes

**Story:** #124 - [BUG] Qualified Teams Groups - Multiple UI/UX Issues
**Type:** Bugfix
**Complexity:** Medium

## Story Context

Four UI/UX bugs identified in the qualified teams groups page that affect user experience in editable mode:

1. **Pre-selection indicators**: First 2 teams show yellow qualification indicators before user selection
2. **No completion status**: No visual indication of whether user has made predictions on a group
3. **Wrong indicator color**: Qualification markers use yellow (warning) instead of green (success)
4. **Saving state confusion**: Saving state uses same visual as "permanently locked" state

These issues make it confusing for users to:
- Distinguish between "I selected this" vs "This is just in a qualifying position"
- Know which groups they've completed
- Understand temporary saving state vs permanent locked state
- Interpret qualification status (yellow = warning, should be green = success)

## Acceptance Criteria

- [ ] Qualification indicators only appear on teams after predictions are locked (readonly mode)
- [ ] Groups show clear completion status (0/4, 2/4, 4/4 teams positioned)
- [ ] Qualification markers use green color instead of yellow
- [ ] Saving state has distinct visual treatment from "locked" state
- [ ] All changes preserve existing drag-and-drop functionality
- [ ] Tests updated to cover new behaviors
- [ ] No SonarCloud issues introduced

## Technical Approach

### Bug 1: Remove Pre-selection Indicators in Editable Mode

**Current behavior:**
- `getSelectionBorderColor()` in `draggable-team-card.tsx` returns yellow border for positions 1-2 in editable mode
- Shows qualification status before user has confirmed their predictions

**Fix:**
- Remove automatic yellow borders in editable mode (when `disabled=false`)
- Only show colored borders in readonly mode (when `disabled=true`)
- Rationale: Position numbers already indicate position; colored borders should only show final results

**Changes:**
```typescript
// draggable-team-card.tsx:110-123
function getSelectionBorderColor(theme: Theme, options: BorderColorOptions): string | null {
  // Remove this function's logic entirely OR return null always
  // Colored borders should only appear in readonly mode (handled by other functions)
  return null;
}
```

### Bug 2: Add Completion Status Indicators

**Current behavior:**
- Mobile accordion shows: "GRUPO A - 2 seleccionados"
- No indication if user has made predictions (2 could mean "2 auto-generated" or "2 user-selected")

**Fix:**
- Track completion status per group based on user interactions
- Show completion indicator in group header (desktop and mobile)
- Display format: "4/4 equipos posicionados" or "2/4 equipos posicionados"

**Implementation:**
1. Check if all teams in a group have predictions (not just positions 1-2)
2. Add completion status to GroupCard header
3. Desktop: Show status chip/badge next to group letter
4. Mobile: Show status in accordion summary

**Changes:**
```typescript
// group-card.tsx
// Add completion status calculation
// NOTE: We count ALL teams with predictions (not just "qualified" status)
// because user needs to position all 4 teams, even if 3rd/4th don't qualify
const completionStatus = useMemo(() => {
  const teamsWithPredictions = teams.filter(team => predictions.has(team.id)).length;
  return {
    completed: teamsWithPredictions,
    total: teams.length,
    isComplete: teamsWithPredictions === teams.length
  };
}, [teams, predictions]);

// Update GroupHeader component (DESKTOP)
// PLACEMENT: Below group letter, above team list
// FORMAT: "X/4 equipos posicionados" (shows positioning, not qualification)
<Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
  {completionStatus.completed}/{completionStatus.total} equipos posicionados
</Typography>

// Update mobile accordion summary (MOBILE)
// PLACEMENT: Right side of accordion header, before expand icon
// FORMAT: Small chip with "X/4", green when complete
<Chip
  label={`${completionStatus.completed}/${completionStatus.total}`}
  size="small"
  color={completionStatus.isComplete ? "success" : "default"}
  sx={{ mr: 1 }}
/>
```

**Terminology Clarification:**
- Use "equipos posicionados" (teams positioned) NOT "equipos calificados" (teams qualified)
- Rationale: All 4 teams need positions (1st, 2nd, 3rd, 4th), but only 2-3 qualify
- Completion = all teams have positions assigned, regardless of qualification status

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

### Bug 4: Distinct Saving State

**Current behavior:**
- `qualified-teams-client-page.tsx` line 311: `isLocked={isLocked || isSaving}`
- Saving state visually identical to permanently locked state
- Users can't distinguish "temporarily disabled while saving" from "closed for editing"

**Fix:**
- Pass `isSaving` as separate prop to child components
- Add visual indicator for saving state (e.g., loading spinner, "Guardando..." text)
- Keep drag-and-drop disabled during save
- Show distinct visual from permanent lock (lock icon)

**Implementation:**
1. Update `DraggableTeamCardProps` to include `isSaving: boolean`
2. Update `GroupCardProps` to include `isSaving: boolean`
3. Thread `isSaving` through component tree
4. In `DraggableTeamCard`, show saving indicator when `isSaving=true && !disabled`
5. In `GroupCard`, show saving indicator in header when `isSaving=true`

**Changes:**
```typescript
// qualified-teams-client-page.tsx:311
<QualifiedTeamsGrid
  groups={groups}
  predictions={predictions}
  isLocked={isLocked}  // Separate from isSaving
  isSaving={isSaving}   // New prop
  allowsThirdPlace={allowsThirdPlace}
  // ... other props
/>

// qualified-teams-grid.tsx
export interface QualifiedTeamsGridProps {
  // ... existing props
  readonly isSaving: boolean;  // Add new prop
}

// group-card.tsx
export interface GroupCardProps {
  // ... existing props
  readonly isSaving: boolean;  // Add new prop
}

// draggable-team-card.tsx
export interface DraggableTeamCardProps {
  // ... existing props
  readonly isSaving: boolean;  // Add new prop
}

// In DraggableTeamCard, show spinner when saving:
// PLACEMENT: Spinner appears to the right of team name, before checkbox/results
// STYLING: Small spinner (16px), uses theme primary color, margin-left: 1
{isSaving && (
  <CircularProgress size={16} sx={{ ml: 1, color: 'primary.main' }} />
)}

// Disable drag during save OR lock:
const {
  // ...
} = useSortable({
  id: team.id,
  disabled: disabled || isSaving,  // Disable for both locked AND saving
});

// Disable third place checkbox during save:
<ThirdPlaceCheckbox
  checked={predictedToQualify}
  disabled={disabled || isSaving}  // Disable during save or lock
  onChange={onToggleThirdPlace}
/>
```

**Edge Case: isSaving=true AND isLocked=true**
- This can occur during initial load if tournament is already locked
- Behavior: Both props passed separately, but only `isLocked` visual shown (no spinner)
- Rationale: If tournament is locked, saving is unlikely; locked state takes precedence
- Implementation: `{isSaving && !disabled && (...)}` - spinner only shows if NOT disabled

## Files to Modify

### Core Component Files
1. **`app/components/qualified-teams/draggable-team-card.tsx`**
   - Remove `getSelectionBorderColor()` auto-borders logic (Bug 1)
   - Change yellow to green if function kept (Bug 3)
   - Add `isSaving` prop and visual indicator (Bug 4)
   - Update `disabled` logic to separate lock from saving
   - Lines to modify: ~110-123, ~353-455

2. **`app/components/qualified-teams/group-card.tsx`**
   - Add completion status calculation (Bug 2)
   - Update `GroupHeader` with completion indicator (Bug 2)
   - Update mobile accordion summary with status (Bug 2)
   - Add `isSaving` prop and thread through (Bug 4)
   - Lines to modify: ~45-68 (header), ~106-112 (accordion), ~215-217 (summary)

3. **`app/components/qualified-teams/qualified-teams-grid.tsx`**
   - Add `isSaving` prop to interface (Bug 4)
   - Pass `isSaving` to `GroupCard` components (Bug 4)
   - Lines to modify: ~9-31 (interface), ~74-89 (GroupCard usage)

4. **`app/components/qualified-teams/qualified-teams-client-page.tsx`**
   - Change `isLocked={isLocked || isSaving}` to pass separately (Bug 4)
   - Pass `isSaving` prop to `QualifiedTeamsGrid` (Bug 4)
   - Lines to modify: ~311 (grid props)

### Test Files to Update

**Existing test files (verify before implementation):**
- `__tests__/components/qualified-teams-context.test.tsx` ✓ (exists)
- `__tests__/components/qualified-teams/qualified-teams-client-page-dnd.test.tsx` ✓ (exists)
- `__tests__/components/qualified-teams/qualified-teams-client-page-smoke.test.tsx` ✓ (exists)
- `__tests__/components/qualified-teams/qualified-teams-grid.test.tsx` ✓ (exists)

**Test files to create (if not exist):**
- `__tests__/components/qualified-teams/draggable-team-card.test.tsx` (may need to create)
- `__tests__/components/qualified-teams/group-card.test.tsx` (may need to create)

**Updates required:**

1. **`__tests__/components/qualified-teams/draggable-team-card.test.tsx`** (create if needed)
   - Test: No colored border in editable mode (Bug 1)
   - Test: Green border in locked mode for qualified teams (Bug 3)
   - Test: Saving spinner appears when isSaving=true && !disabled
   - Test: Drag disabled when isSaving=true OR disabled=true
   - Test: Third place checkbox disabled when isSaving=true
   - Test: Existing border logic preserved (pending, correct, wrong results)

2. **`__tests__/components/qualified-teams/group-card.test.tsx`** (create if needed)
   - Test: Completion status calculated correctly (0/4, 2/4, 4/4)
   - Test: Completion indicator visible in header (desktop)
   - Test: Completion chip in accordion summary (mobile)
   - Test: isSaving prop threaded through to DraggableTeamCard

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

**Step 1.1: Fix Bug 4 - Add isSaving Prop Threading**
- Update prop interfaces from bottom-up
- `DraggableTeamCardProps` → add `isSaving: boolean`
- `GroupCardProps` → add `isSaving: boolean`
- `QualifiedTeamsGridProps` → add `isSaving: boolean`
- Update `qualified-teams-client-page.tsx` to pass `isSaving` separately

**Step 1.2: Fix Bug 4 - Add Saving Visual Indicators**
- Add saving spinner to `DraggableTeamCard`
- Update drag disable logic: `disabled: disabled || isSaving`
- Add saving indicator to `GroupCard` header (optional)

**Step 1.3: Fix Bug 1 - Remove Editable Mode Borders**
- Modify `getSelectionBorderColor()` to return `null` in editable mode
- OR remove the function entirely and update `getBorderColor()` logic
- Verify borders still appear correctly in locked/results mode

**Step 1.4: Fix Bug 3 - Change Yellow to Green**
- Review all uses of `theme.palette.warning.main` in `draggable-team-card.tsx`
- Change to `theme.palette.success.main` where appropriate
- Ensure consistency with existing success states

**Step 1.5: Fix Bug 2 - Add Completion Status**
- Add completion calculation to `GroupCard`
- Update `GroupHeader` component with status display
- Update mobile accordion summary with completion indicator

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
   - ✅ No colored border in editable mode (Bug 1)
   - ✅ Green border in locked mode for qualified teams (Bug 3)
   - ✅ Saving spinner appears when isSaving=true
   - ✅ Drag disabled when isSaving=true OR disabled=true
   - ✅ Existing border logic preserved (pending, correct, wrong)

2. **GroupCard Tests** (`group-card.test.tsx`)
   - ✅ Completion status calculated correctly (0/4, 2/4, 4/4)
   - ✅ Completion indicator visible in header (desktop)
   - ✅ Completion status in accordion summary (mobile)
   - ✅ isSaving prop threaded through correctly

3. **QualifiedTeamsGrid Tests** (`qualified-teams-grid.test.tsx`)
   - ✅ isSaving prop passed to all GroupCard components
   - ✅ Grid rendering with new props

4. **QualifiedTeamsClientPage Tests** (`qualified-teams-client-page-dnd.test.tsx`)
   - ✅ isLocked and isSaving passed separately (not combined)
   - ✅ Saving state shows visual indicators
   - ✅ Context provides isSaving correctly

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

### Bug 4: Saving State Indicator

**During Save:**
```
┌──────────────────────────────────────┐
│ ⬜ [1st] Argentina    [🔄]           │  ← Spinner during save
├──────────────────────────────────────┤
│ ⬜ [2nd] Brazil       [🔄]           │  ← Disabled, can't drag
├──────────────────────────────────────┤
│ ⬜ [3rd] Chile   [☑] Clasifica [🔄] │
├──────────────────────────────────────┤
│ ⬜ [4th] Uruguay      [🔄]           │
└──────────────────────────────────────┘
     Guardando predicciones...             ← Toast/snackbar
```

**Permanently Locked:**
```
┌──────────────────────────────────────┐
│ 🔒 [1st] Argentina                   │  ← Lock icon (not spinner)
├──────────────────────────────────────┤
│ 🔒 [2nd] Brazil                      │  ← Different from saving
├──────────────────────────────────────┤
│ 🔒 [3rd] Chile   [☑] Clasifica      │
├──────────────────────────────────────┤
│ 🔒 [4th] Uruguay                     │
└──────────────────────────────────────┘
```

**States:**
- **Editable**: No border, draggable, no icons
- **Saving**: Spinner visible, drag disabled temporarily, no border
- **Locked**: Lock icon (already implemented via Alert), borders show results
- **Results**: Green/red borders, points displayed, readonly

### Component Hierarchy (with new isSaving prop)

```
QualifiedTeamsClientPage
├─ QualifiedTeamsContextProvider (provides isSaving)
│  └─ QualifiedTeamsUI
│     └─ QualifiedTeamsGrid (receives isSaving)
│        └─ GroupCard[] (receives isSaving)
│           └─ DraggableTeamCard[] (receives isSaving)
│              └─ [Shows spinner if isSaving=true]
```

## Risk Assessment

**Low Risk:**
- Pure UI changes, no business logic affected
- No database schema changes
- No API contract changes
- Existing tests will catch regressions

**Medium Risk:**
- Border color logic is complex (many conditionals)
- PropsDrilling isSaving through multiple layers
- Could affect drag-and-drop performance if not optimized

**Mitigation:**
- Comprehensive test coverage (≥80%)
- Manual testing of all states (editable, saving, locked, results)
- Code review focusing on border logic and prop threading
- Performance testing of drag operations with isSaving checks

## Success Criteria

- [ ] Users see NO yellow borders in editable mode before interaction
- [ ] Users see green borders in locked/results mode for qualified teams
- [ ] Users can distinguish saving state from locked state
- [ ] Users can see completion status for each group
- [ ] All existing functionality preserved (drag-and-drop, third place selection, scoring)
- [ ] All tests pass with ≥80% coverage
- [ ] SonarCloud reports 0 new issues
- [ ] Manual testing checklist complete
- [ ] Code review approved

---

**Estimated Complexity:** Medium
**Estimated Files Changed:** 4 core files + 4 test files
**Breaking Changes:** None
**Database Migrations:** None
