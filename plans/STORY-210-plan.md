# Implementation Plan: Story #210

**Title:** [Bug] Third Place Qualification: Generic Error & No Checkbox Disable When Limit Reached

**Issue:** https://github.com/gvinokur/qatar-prode/issues/210

---

## Context

When users try to add a 9th third-place qualified team (when the maximum is 8), they encounter two UX problems:

1. **Generic server error**: The backend throws a descriptive `QualificationPredictionError`, but Next.js Server Actions don't properly serialize custom Error classes across the server/client boundary. The user sees a generic error instead of the helpful message like "Ya has seleccionado 9 terceros puestos. El máximo permitido es 8."

2. **No proactive prevention**: All "Clasifica" checkboxes remain enabled even when the limit is reached, allowing users to make the mistake before seeing an error. The `ThirdPlaceSummary` component shows a warning AFTER selection (reactive), but doesn't prevent the selection (proactive).

This creates a frustrating UX where users can click a checkbox, wait for it to save, and then see a cryptic error message.

---

## Objectives

1. **Fix backend error serialization** - Return error objects instead of throwing custom Error classes
2. **Add frontend prevention** - Disable checkboxes proactively when limit is reached
3. **Maintain backend validation** - Keep server-side security checks as safety net
4. **Improve error messaging** - Show descriptive errors when they do occur

---

## Acceptance Criteria

- [ ] When 8 third-place teams are selected, remaining checkboxes are disabled
- [ ] Disabled checkboxes show tooltip explaining why ("Máximo de 8 terceros puestos ya seleccionados")
- [ ] Already-checked teams can still be unchecked even when limit is reached
- [ ] Backend returns descriptive error message (not thrown Error)
- [ ] Error message properly displayed in UI Snackbar
- [ ] Backend validation still enforces limit (security/race conditions)
- [ ] All existing tests pass
- [ ] New tests cover disabled state and error handling
- [ ] Works on mobile and desktop

---

## Technical Approach

### 1. Backend Error Serialization Fix

**File:** `app/actions/qualification-actions.ts`

**Problem:** Custom Error classes don't serialize properly in Next.js Server Actions. The error message is lost when `QualificationPredictionError` is thrown from validation helpers.

**Current structure:**
- `updateGroupPositionsJsonb()` is the main Server Action (exported)
- Validation helpers throw `QualificationPredictionError`:
  - `validateTeamsInGroup()` - throws on invalid team/group
  - `validateNoDuplicateTeams()` - throws on duplicates
  - `validatePositionsValidAndUnique()` - throws on invalid positions
  - `validateQualificationFlagsForPositions()` - throws on invalid flags
  - `validateThirdPlaceForGroup()` - throws on too many selections

**Solution: Wrap ALL validation calls in try-catch block**

Update `updateGroupPositionsJsonb()` to catch all validation errors and convert to return objects:

```typescript
export async function updateGroupPositionsJsonb(
  groupId: string,
  tournamentId: string,
  positionUpdates: Array<{ teamId: string; position: number; qualifies: boolean }>,
  locale: Locale = 'es'
): Promise<{ success: boolean; message: string }> {
  const t = await getTranslations({ locale, namespace: 'tournaments' });

  // Early validation: User authentication
  const user = await getLoggedInUser();
  if (!user?.id) {
    return {
      success: false,
      message: t('qualification.unauthorized')
    };
  }

  const userId = user.id;

  // Early validation: Empty array
  if (positionUpdates.length === 0) {
    return { success: true, message: t('qualification.noUpdates') };
  }

  // Early validation: Tournament exists and is not locked
  const tournament = await db
    .selectFrom('tournaments')
    .where('id', '=', tournamentId)
    .select(['id', 'is_active', 'allows_third_place_qualification', 'max_third_place_qualifiers', 'dev_only'])
    .executeTakeFirst();

  if (!tournament) {
    return {
      success: false,
      message: t('qualification.tournamentNotFound')
    };
  }

  // Check dev override
  const isDevelopmentEnvironment = process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview';
  const isDevTournament = tournament.dev_only === true;
  const allowDevOverride = isDevelopmentEnvironment && isDevTournament;

  if (!tournament.is_active && !allowDevOverride) {
    return {
      success: false,
      message: t('qualification.tournamentLocked')
    };
  }

  const teamIds = positionUpdates.map((u) => u.teamId);
  const positionNumbers = positionUpdates.map((u) => u.position);

  // Wrap ALL validation helper calls in try-catch
  try {
    await validateTeamsInGroup(teamIds, groupId, locale);
    await validateNoDuplicateTeams(teamIds, locale);
    await validatePositionsValidAndUnique(positionNumbers, locale);
    await validateQualificationFlagsForPositions(positionUpdates, locale);
    await validateThirdPlaceForGroup(
      positionUpdates,
      {
        allows_third_place_qualification: tournament.allows_third_place_qualification ?? null,
        max_third_place_qualifiers: tournament.max_third_place_qualifiers ?? null
      },
      userId,
      tournamentId,
      groupId,
      locale
    );
  } catch (error) {
    // Convert QualificationPredictionError to return object
    if (error instanceof QualificationPredictionError) {
      return {
        success: false,
        message: error.message
      };
    }
    // Unexpected errors - log and return generic message
    console.error('Unexpected validation error:', error);
    return {
      success: false,
      message: t('qualification.saveFailed')
    };
  }

  // Build TeamPositionPrediction array for JSONB
  const positions: TeamPositionPrediction[] = positionUpdates.map((update) => ({
    team_id: update.teamId,
    predicted_position: update.position,
    predicted_to_qualify: update.qualifies,
  }));

  // Execute atomic JSONB upsert
  try {
    await upsertGroupPositionsPrediction(userId, tournamentId, groupId, positions);

    // Update playoff game guesses based on new qualification predictions
    const { updatePlayoffGameGuesses } = await import('./guesses-actions');
    await updatePlayoffGameGuesses(tournamentId, { id: userId });

    return {
      success: true,
      message: t('qualification.updateSuccess', { count: positions.length }),
    };
  } catch (error) {
    console.error('Error updating group positions (JSONB):', error);
    return {
      success: false,
      message: t('qualification.saveFailed')
    };
  }
}
```

**Key changes:**
1. **Early returns** for auth, empty array, tournament not found, locked tournament (before validation helpers)
2. **Try-catch wrapper** around ALL validation helper calls (lines where `await validate*()` is called)
3. **Error conversion** - if `QualificationPredictionError`, extract `.message` and return object
4. **No changes to validation helpers themselves** - they still throw (less invasive, existing logic preserved)

### 2. Frontend Proactive Prevention

**Component tree (props flow):**
```
QualifiedTeamsClientPage (calculate count)
  ↓ maxThirdPlace, currentThirdPlaceCount
QualifiedTeamsGrid (pass through)
  ↓ maxThirdPlace, currentThirdPlaceCount
GroupCard (pass through)
  ↓ maxThirdPlace, currentThirdPlaceCount, teamId
DraggableTeamCard (compute disabled state)
  ↓ cannotAddMore
ThirdPlaceCheckbox (show tooltip)
```

**File modifications:**

#### `app/components/qualified-teams/qualified-teams-client-page.tsx`

Add calculation of current third-place count:
```typescript
// After line 167, inside QualifiedTeamsUI component
const currentThirdPlaceCount = useMemo(() => {
  return Array.from(predictions.values()).filter(
    p => p.predicted_position === 3 && p.predicted_to_qualify
  ).length;
}, [predictions]);
```

**Null handling for maxThirdPlace:**
The component receives `maxThirdPlace: number` prop, but it comes from `getTournamentQualificationConfig()` which returns `tournament.max_third_place_qualifiers || 0`. This means `maxThirdPlace` is always a number (defaults to 0 if null/undefined in DB).

**Verification:** If `maxThirdPlace === 0`, then `allowsThirdPlace` will be `false` (tournament doesn't allow third place), so checkboxes won't render at all. No additional null handling needed.

Pass to `QualifiedTeamsGrid`:
```typescript
<QualifiedTeamsGrid
  // ... existing props
  maxThirdPlace={maxThirdPlace}  // always number (0 if not set)
  currentThirdPlaceCount={currentThirdPlaceCount}
/>
```

#### `app/components/qualified-teams/qualified-teams-grid.tsx`

Add props to interface:
```typescript
interface QualifiedTeamsGridProps {
  // ... existing props
  readonly maxThirdPlace: number;
  readonly currentThirdPlaceCount: number;
}
```

Pass to `GroupCard`:
```typescript
<GroupCard
  // ... existing props
  maxThirdPlace={maxThirdPlace}
  currentThirdPlaceCount={currentThirdPlaceCount}
/>
```

#### `app/components/qualified-teams/group-card.tsx`

Add props to interface:
```typescript
export interface GroupCardProps {
  // ... existing props
  readonly maxThirdPlace: number;
  readonly currentThirdPlaceCount: number;
}
```

Pass to `DraggableTeamCard`:
```typescript
<DraggableTeamCard
  // ... existing props
  maxThirdPlace={maxThirdPlace}
  currentThirdPlaceCount={currentThirdPlaceCount}
/>
```

#### `app/components/qualified-teams/draggable-team-card.tsx`

Add props to interface:
```typescript
export interface DraggableTeamCardProps {
  // ... existing props
  readonly maxThirdPlace: number;
  readonly currentThirdPlaceCount: number;
}
```

**dnd-kit Compatibility Verification:**
This component is used inside `<DndContext>` and `<SortableContext>`. Adding new props is safe because:
1. Props don't affect drag functionality (no changes to `useSortable` hook usage)
2. New props are readonly primitives (number), not callbacks that could break memoization
3. Disabled state only affects checkbox, not drag handle or card dragging
4. Tests will verify drag-and-drop still works with new props

Compute disabled state:
```typescript
// Around line 441, before rendering ThirdPlaceCheckbox
const cannotAddMore = !predictedToQualify && currentThirdPlaceCount >= maxThirdPlace;
```

Update checkbox render:
```typescript
{position === 3 && !isLocked && (
  <ThirdPlaceCheckbox
    checked={predictedToQualify}
    disabled={isLocked || isSaving || cannotAddMore}
    onChange={onToggleThirdPlace}
    disabledReason={cannotAddMore ? 'limit-reached' : undefined}
    maxThirdPlace={maxThirdPlace}
    t={t}
  />
)}
```

Update `ThirdPlaceCheckbox` component signature:
```typescript
function ThirdPlaceCheckbox({
  checked,
  disabled,
  onChange,
  disabledReason,
  maxThirdPlace,
  t,
}: {
  readonly checked: boolean;
  readonly disabled: boolean;
  readonly onChange?: () => void;
  readonly disabledReason?: 'limit-reached';
  readonly maxThirdPlace?: number;
  readonly t: any;
})
```

Wrap checkbox with `Tooltip`:
```typescript
import { Tooltip } from '@mui/material';

const tooltipMessage = disabledReason === 'limit-reached' && maxThirdPlace
  ? t('thirdPlace.limitReached', { max: maxThirdPlace })
  : '';

return (
  <Tooltip title={tooltipMessage} arrow>
    <span> {/* Wrapper needed for disabled elements */}
      <FormControlLabel
        control={<Checkbox checked={checked} onChange={onChange} disabled={disabled} color="primary" />}
        label={
          <Typography variant="body2" sx={{ fontWeight: 500, whiteSpace: 'nowrap' }}>
            {t('position.label')}
          </Typography>
        }
        sx={{ mr: 0, flexShrink: 0 }}
      />
    </span>
  </Tooltip>
);
```

### 3. i18n Translation Keys

**File:** `i18n/locales/es.json`

Add new translation key in `qualified-teams` section:
```json
"qualified-teams": {
  // ... existing keys
  "thirdPlace": {
    "title": "Terceros Puestos Clasificados",
    "noSelection": "Selecciona los equipos en 3er puesto que clasifican",
    "overLimit": "Has seleccionado {selected} terceros puestos. El máximo es {max}. Debes deseleccionar {excess}.",
    "limitReached": "Máximo de {max} terceros puestos ya seleccionados"
  }
}
```

**File:** `i18n/locales/en.json`

Add English translation:
```json
"qualified-teams": {
  // ... existing keys
  "thirdPlace": {
    "title": "Third Place Qualifiers",
    "noSelection": "Select which 3rd place teams qualify",
    "overLimit": "You have selected {selected} third place teams. The maximum is {max}. You must deselect {excess}.",
    "limitReached": "Maximum of {max} third place teams already selected"
  }
}
```

---

## Files to Modify

### Backend
- `app/actions/qualification-actions.ts` - Replace all `throw QualificationPredictionError` with `return { success: false, message }` in `updateGroupPositionsJsonb` function

### Frontend Components
- `app/components/qualified-teams/qualified-teams-client-page.tsx` - Calculate `currentThirdPlaceCount`, pass props down
- `app/components/qualified-teams/qualified-teams-grid.tsx` - Add props, pass through to GroupCard
- `app/components/qualified-teams/group-card.tsx` - Add props, pass through to DraggableTeamCard
- `app/components/qualified-teams/draggable-team-card.tsx` - Compute `cannotAddMore`, update ThirdPlaceCheckbox with tooltip

### i18n
- `i18n/locales/es.json` - Add `qualified-teams.thirdPlace.limitReached` key
- `i18n/locales/en.json` - Add `qualified-teams.thirdPlace.limitReached` key

### Tests
- `__tests__/actions/qualification-actions.test.ts` - Update assertions to expect `{ success: false, message }` instead of thrown errors
- `__tests__/components/qualified-teams/draggable-team-card.test.tsx` - Add tests for disabled state when limit reached
- `__tests__/components/qualified-teams/qualified-teams-client-page-smoke.test.tsx` - Integration test: verify checkboxes disabled at limit
- `__tests__/components/qualified-teams/qualified-teams-client-page-dnd.test.tsx` - Verify drag-and-drop still works with disabled checkboxes

---

## Implementation Steps

### Step 1: Backend Error Serialization Fix
1. Update `updateGroupPositionsJsonb` in `app/actions/qualification-actions.ts`
2. Convert early validations (auth, tournament checks) to early returns with `{ success: false, message }`
3. Wrap ALL validation helper calls in try-catch block
4. Catch `QualificationPredictionError`, extract `.message`, return `{ success: false, message }`
5. Keep validation helpers unchanged (still throw) - less invasive
6. Keep transaction/upsert logic wrapped in existing try-catch

### Step 2: Frontend Component Updates
1. Update `QualifiedTeamsClientPage` - add `currentThirdPlaceCount` calculation
2. Update `QualifiedTeamsGrid` - add props, pass through
3. Update `GroupCard` - add props, pass through
4. Update `DraggableTeamCard` - add `cannotAddMore` logic and tooltip

### Step 3: i18n Updates
1. Add `thirdPlace.limitReached` translation key to Spanish locale
2. Add `thirdPlace.limitReached` translation key to English locale

### Step 4: Update Tests
1. Update backend tests - expect error objects instead of thrown errors
2. Add frontend tests - verify disabled state
3. Add integration tests - verify tooltip appears
4. Run full test suite

### Step 5: Manual Testing
1. Start dev server with existing tournament data
2. Navigate to qualified teams page
3. Select 8 third-place teams across different groups
4. Verify 9th checkbox is disabled
5. Hover over disabled checkbox - verify tooltip shows
6. Uncheck one team - verify previously disabled checkboxes are now enabled
7. Try to exceed limit via rapid clicking (race condition test)
8. Verify backend returns descriptive error if frontend validation bypassed

---

## Testing Strategy

### Unit Tests

**Backend (`__tests__/actions/qualification-actions.test.ts`):**
- Update existing tests that expect thrown errors
- Change assertions from `expect(() => ...).toThrow()` to `expect(result).toEqual({ success: false, message: ... })`
- Verify all validation paths return proper error objects
- Test cases:
  - Unauthorized user → returns error object
  - Tournament not found → returns error object
  - Tournament locked → returns error object
  - Too many third place selections → returns error object with proper message
  - Duplicate teams → returns error object
  - Invalid positions → returns error object

**Frontend (`__tests__/components/qualified-teams/draggable-team-card.test.tsx`):**
- New test: "disables third place checkbox when limit reached and team not selected"
- New test: "does not disable third place checkbox when limit reached but team is selected"
- New test: "shows tooltip on disabled checkbox"
- New test: "enables checkbox when limit not reached"
- New test: "tooltip is keyboard accessible (shows on focus)"
- New test: "disabled checkbox has proper ARIA attributes for screen readers"

**Integration (`__tests__/components/qualified-teams/qualified-teams-client-page-smoke.test.tsx`):**
- New test: "disables remaining checkboxes after selecting max third place teams"
- New test: "re-enables checkboxes when a third place team is deselected"
- New test: "tooltip shows correct message with max limit"
- **New test: "rapid clicks on multiple checkboxes - only allows up to max limit"** (edge case)
- **New test: "concurrent updates to different groups - frontend prevents exceeding limit"** (edge case)

**Integration with dnd-kit (`__tests__/components/qualified-teams/qualified-teams-client-page-dnd.test.tsx`):**
- Existing test: "drag-and-drop functionality" - verify still works with new props
- New test: "disabled checkbox doesn't affect drag-and-drop of team cards"

### Manual Testing Checklist

- [ ] Desktop: Select 8 third-place teams, verify 9th checkbox disabled
- [ ] Desktop: Hover disabled checkbox, verify tooltip appears
- [ ] Desktop: Uncheck team, verify checkboxes re-enabled
- [ ] Mobile: Same tests on mobile viewport
- [ ] Edge case: Rapid clicking on multiple checkboxes (race condition)
- [ ] Edge case: Direct API call bypassing frontend (backend should still validate)
- [ ] Error display: Force backend error, verify descriptive message in Snackbar

---

## Quality Gates & Validation

### SonarCloud Requirements
- **Coverage**: 80% on new code (all new branches covered)
- **Issues**: 0 new issues of any severity
- **Code Smells**: Keep maintainability rating B or higher

### Pre-Commit Validation (MANDATORY)
```bash
npm test      # All tests must pass
npm run lint  # No linting errors
npm run build # Build must succeed
```

### Accessibility
- Tooltip must be keyboard accessible (focus state)
- Disabled checkbox must have proper ARIA attributes
- Screen reader should announce disabled state and reason

---

## Open Questions

None - approach is straightforward with existing patterns.

---

## Risks & Considerations

1. **Race condition - Same user, different groups simultaneously**
   - **Scenario**: User opens two browser tabs, selects 8 teams in one tab, then rapidly clicks on 2 teams in two different tabs
   - **Current behavior**: Backend validates **per-request** by counting existing selections + new selections. If both requests arrive simultaneously, both could pass validation before either commits.
   - **Mitigation**: Backend validation runs inside transaction, but no database-level unique constraint or SELECT FOR UPDATE
   - **Acceptance**: For this bug fix scope, we accept this edge case. The validation catches 99% of cases (single-tab usage). Database-level constraints would require schema migration (out of scope).
   - **Future enhancement**: Could add version-based optimistic locking or `SELECT FOR UPDATE` on user_group_positions table

2. **Race condition - Two different users (not a concern)**
   - **Scenario**: User A and User B both save at same time
   - **Behavior**: This is NOT a race condition - each user has their own `max_third_place_qualifiers` limit. Backend validates per-user, not globally.
   - **No issue**: Working as intended

3. **Custom error class cleanup**: We're working around Next.js serialization issue rather than fixing root cause
   - **Consideration**: Could remove `QualificationPredictionError` class entirely if not used elsewhere
   - **Decision**: Keep class for now (might be used in other contexts), wrap in try-catch for Server Actions. Less invasive change.

4. **Props drilling**: Passing `maxThirdPlace` and `currentThirdPlaceCount` through 4 component levels
   - **Consideration**: Could use context, but adds complexity
   - **Decision**: Props drilling is acceptable for 4 levels, keeps data flow explicit. Context would be over-engineering.

5. **Tooltip UX**: Tooltip requires hover, not ideal on touch devices
   - **Consideration**: Could show persistent message near disabled checkbox
   - **Decision**: Tooltip is sufficient - `ThirdPlaceSummary` already shows count/limit at top of page. Mobile users see the count indicator.

---

## Verification Plan

### End-to-End Testing
1. Run app locally: `npm run dev`
2. Navigate to `/tournaments/{id}/qualified-teams`
3. Execute manual testing checklist above
4. Verify in Vercel Preview deployment
5. Test on multiple devices/browsers

### Automated Testing
1. Run full test suite: `npm test`
2. Verify coverage: Check SonarCloud report (80%+ on new code)
3. Run lint: `npm run lint` (0 errors)
4. Verify build: `npm run build` (no errors)

---

## Notes

- This fix improves UX by preventing errors before they happen (proactive)
- Backend validation remains as safety net (defense in depth)
- Proper error serialization ensures users see helpful messages when errors do occur
- Tooltip provides contextual help without cluttering UI
