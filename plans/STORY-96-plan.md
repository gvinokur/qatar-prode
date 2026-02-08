# Implementation Plan: Bug: Playoff game draft/publish toggle stuck in saving state (#96)

## Story Context

**Issue:** #96 - Bug: Playoff game draft/publish toggle stuck in saving state

**Problem:**
When toggling a playoff game between draft and published status in the backoffice, the checkbox UI gets stuck in a "saving" state (disabled with loading spinner) and never recovers. This prevents further status changes and requires a page reload.

**Root Cause:**
The `handleDraftChange` function in `compact-game-view-card.tsx` (lines 105-111) doesn't have proper error handling. If the `onPublishClick` promise rejects (e.g., due to database errors, network issues, or the complex playoff logic failing), the `setPublishing(false)` statement is never reached, leaving the component permanently stuck in publishing state.

## Acceptance Criteria

- [ ] Status toggle always recovers, even when operation fails
- [ ] User sees success message when toggle succeeds
- [ ] User sees error message when toggle fails
- [ ] User can retry after a failure (checkbox re-enables)
- [ ] Error is logged to console for debugging
- [ ] No regression in normal success flow

## Technical Approach

### 1. Fix Local State Management (Component Level)

**File:** `app/components/compact-game-view-card.tsx`

**Current code (lines 105-111):**
```typescript
const handleDraftChange = async () => {
  if (!specificProps.isGameGuess && !specificProps.isGameFixture && specificProps.onPublishClick) {
    setPublishing(true)
    await specificProps.onPublishClick(gameNumber);
    setPublishing(false)  // ❌ Never reached if promise rejects
  }
};
```

**Fix:**
Add `try-finally` block to ensure `setPublishing(false)` always executes:

```typescript
const handleDraftChange = async () => {
  if (!specificProps.isGameGuess && !specificProps.isGameFixture && specificProps.onPublishClick) {
    setPublishing(true)
    try {
      await specificProps.onPublishClick(gameNumber);
    } finally {
      setPublishing(false)  // ✅ Always executes, even on error
    }
  }
};
```

**Why try-finally, not try-catch-finally:**
- The error should propagate to the parent component (playoff-tab)
- Parent component will handle user-facing error messages
- Component only needs to ensure its own state is cleaned up

### 2. Add Error Handling (Parent Component Level)

**File:** `app/components/backoffice/playoff-tab.tsx`

**Add error state (after line 67):**
```typescript
const [error, setError] = useState<string | null>(null)
```

**Wrap `handleDraftStatusChanged` with try-catch (lines 116-134):**
```typescript
const handleDraftStatusChanged = async (gameNumber: number) => {
  const game = Object.values(gamesMap).find(game => game.game_number === gameNumber);
  if(game) {
    try {
      const gameResult: GameResultNew = game.gameResult || buildGameResult(game)
      const newGame = {
        ...game,
        gameResult: {
          ...gameResult,
          is_draft: !gameResult.is_draft
        }
      }
      const newGamesMap = {
        ...gamesMap,
        [game.id]: newGame
      }

      await commitGameResults(newGame, newGamesMap)
    } catch (err) {
      console.error(`Error changing draft status for game ${gameNumber}:`, err);
      setError(err instanceof Error ? err.message : `Error al cambiar el estado de publicación del partido ${gameNumber}`);
      throw err; // Re-throw so component knows it failed
    }
  }
}
```

**Add error Snackbar to UI (after line 237, after success Snackbar):**
```typescript
<Snackbar
  anchorOrigin={{ vertical: 'top', horizontal: 'center'}}
  open={!!error}
  autoHideDuration={5000}
  onClose={() => setError(null)}
>
  <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
    {error || 'Error al guardar los partidos'}
  </Alert>
</Snackbar>
```

**Already imported:**
- `Alert` and `Snackbar` are already imported from `@mui/material` (line 3)
- No new imports needed

**Snackbar Interaction Note:**
- Success and error Snackbars are independent (both can technically appear simultaneously)
- In practice, only one shows at a time:
  - Success: Shows when `saved=true` (operation succeeds)
  - Error: Shows when `error != null` (operation fails)
- Since operation either succeeds OR fails, both states are mutually exclusive
- No additional logic needed to prevent conflicts

## Files to Modify

1. **`app/components/compact-game-view-card.tsx`**
   - Lines 105-111: Add `try-finally` block in `handleDraftChange`

2. **`app/components/backoffice/playoff-tab.tsx`**
   - After line 67: Add `error` state
   - Lines 116-134: Wrap `handleDraftStatusChanged` in `try-catch`
   - After line 237: Add error Snackbar component

## Implementation Steps

1. **Add local state recovery** (`compact-game-view-card.tsx`)
   - Update `handleDraftChange` with try-finally block
   - Ensure publishing state is always reset

2. **Add error state management** (`playoff-tab.tsx`)
   - Add `error` state variable
   - Update `handleDraftStatusChanged` with try-catch
   - Log errors to console

3. **Add error UI** (`playoff-tab.tsx`)
   - Add error Snackbar after success Snackbar
   - Use 5-second auto-hide duration (longer than success for readability)
   - Display error message to user

## Testing Strategy

### Unit Tests

**Test file:** `__tests__/components/backoffice/playoff-tab.test.tsx` (CREATE NEW FILE)

**Note:** This test file doesn't currently exist and needs to be created from scratch. Use existing backoffice test files (e.g., `tournament-backoffice-tab.test.tsx`) as reference for structure and setup patterns.

**Test Setup Requirements:**
- Import `renderWithTheme` from test utilities
- Mock server actions: `saveGameResults`, `saveGamesData`, `calculateGameScores`, `updateTournamentHonorRoll`
- Mock `getCompletePlayoffData` to return mock playoff structure
- Use `vi.fn()` for all async operations to control success/failure scenarios

Tests to add:
1. **Success case (existing behavior preserved):**
   - Toggle draft to published
   - Verify `commitGameResults` is called
   - Verify success Snackbar appears
   - Verify publishing state is reset

2. **Error case (new behavior):**
   - Mock `commitGameResults` to throw error
   - Toggle draft status
   - Verify error Snackbar appears with message
   - Verify publishing state is reset (checkbox re-enabled)
   - Verify console.error is called

3. **Error recovery:**
   - Trigger error
   - Close error Snackbar
   - Verify can retry (checkbox is not disabled)

**Test file:** `__tests__/components/compact-game-view-card.test.tsx`

Tests to add:
1. **Publishing state recovery on error:**
   - Mock `onPublishClick` to reject
   - Call `handleDraftChange`
   - Verify `setPublishing(false)` is called
   - Verify checkbox is re-enabled

2. **Publishing state recovery on success:**
   - Mock `onPublishClick` to resolve
   - Call `handleDraftChange`
   - Verify `setPublishing(false)` is called
   - Verify normal flow completes

### Manual Testing

1. **Trigger error scenario:**

   **Setup:** Temporarily add error throw to `commitGameResults` function in `playoff-tab.tsx`:
   ```typescript
   const commitGameResults = async (newGame: ExtendedGameData, newGamesMap: {[k: string]: ExtendedGameData}) => {
     // ADD THIS LINE TO TRIGGER ERROR:
     throw new Error('Test error - simulating database failure');

     // Rest of function...
     await saveGameResults(Object.values(newGamesMap))
     // ...
   }
   ```

   **Test steps:**
   - Navigate to Backoffice → Playoff tab
   - Click checkbox on any playoff game to toggle status
   - **Verify:** Red error Snackbar appears with message including game number
   - **Verify:** Checkbox re-enables (not stuck with spinner)
   - **Verify:** Console shows error log with game number
   - **Verify:** Click checkbox again (can retry)
   - **Verify:** Error repeats (expected since we're forcing error)

   **Cleanup:** Remove the throw statement before committing

2. **Success scenario (regression test):**
   - Ensure error throw is removed
   - Toggle playoff game from draft to published
   - **Verify:** Green success Snackbar appears ("Los Partidos se guardaron correctamente!")
   - **Verify:** Game status updates in database (draft = false)
   - **Verify:** Dependent playoff games update teams correctly (if applicable)
   - Toggle back to draft
   - **Verify:** Success message appears again
   - **Verify:** Dependent games clear teams (if applicable)

3. **Edge cases:**

   **Rapid toggles:**
   - Click toggle checkbox rapidly 3-4 times
   - **Verify:** Only one operation executes (checkbox disabled during operation)
   - **Verify:** No duplicate success/error messages

   **Network throttling:**
   - Open Chrome DevTools → Network tab → Throttle to "Slow 3G"
   - Toggle playoff game status
   - **Verify:** Checkbox shows spinner during slow operation
   - **Verify:** Success message appears after operation completes (not stuck)

   **Page load race condition:**
   - Refresh page
   - Immediately click toggle (before page fully loads)
   - **Verify:** Operation either queues or shows loading state correctly

4. **Error recovery flow:**
   - Add error throw as in step 1
   - Toggle game (error appears)
   - Close error Snackbar manually (click X)
   - **Verify:** Error state clears
   - **Verify:** Checkbox is enabled for retry
   - Remove error throw
   - Click toggle again
   - **Verify:** Success message appears (recovered from error state)

## Validation Considerations

### SonarCloud Requirements

- **Coverage:** Add unit tests for both files (80%+ on new code)
  - **New code in compact-game-view-card.tsx:** 5 lines (try-finally block)
  - **New code in playoff-tab.tsx:** ~10 lines (error state + try-catch + Snackbar)
  - **Test coverage verification:**
    - Run `npm run test -- --coverage` after adding tests
    - Verify both files show ≥80% coverage on modified lines
    - If below 80%, add missing test cases for uncovered branches

- **Code Smells:** No new code smells (proper error handling added)
- **Security:** No security issues (no user input, internal state management)
- **Maintainability:** Improved maintainability with proper error handling

### Coverage Checklist

Ensure tests cover:
- [ ] Success path: try block executes, finally resets state
- [ ] Error path: catch block executes, error state set, finally resets state
- [ ] Snackbar visibility: error Snackbar opens when error!=null
- [ ] Snackbar close: error clears when user closes Snackbar
- [ ] Console logging: console.error called with correct game number
- [ ] State transitions: publishing=true → false in all scenarios

### Quality Gates

- All existing tests pass
- New tests achieve 80%+ coverage on modified code
- ESLint passes (no new warnings)
- Build succeeds
- No console errors in normal operation
- Console errors properly logged when errors occur

## Potential Issues & Mitigations

### Issue 1: Multiple rapid toggles
**Risk:** User clicks toggle multiple times rapidly while operation is pending

**Mitigation:**
- `publishing` state already disables checkbox during operation
- `try-finally` ensures state is reset regardless of outcome
- No additional changes needed

### Issue 2: Complex playoff logic failures
**Risk:** `commitGameResults` has multiple async operations that could fail:
- `saveGameResults()` - database write
- `modifyAffectedTeams()` - complex playoff logic
- `saveGamesData()` - more database writes
- `calculateGameScores()` - score calculations
- `updateTournamentHonorRoll()` - honor roll updates

**Mitigation:**
- Error is caught at top level of `handleDraftStatusChanged`
- Generic error message shown to user
- Specific error logged to console for debugging
- User can retry after fixing underlying issue

### Issue 3: Error message localization
**Risk:** Error messages are in Spanish, might need i18n

**Current approach:**
- Use Spanish messages to match existing UI (`"Los Partidos se guardaron correctamente!"`)
- Consistent with existing error handling in the app

**Future:**
- Can be enhanced with proper i18n if needed
- Out of scope for this bugfix

## Dependencies

- None - this is a self-contained UI fix
- No new npm packages required
- No database schema changes
- No API changes

## Risk Assessment

**Risk Level:** Low

**Justification:**
- Isolated change (2 files, minimal lines)
- Doesn't change business logic
- Only adds error handling to existing flow
- Easy to test and verify

**Rollback Plan:**
- If issues arise, revert PR immediately
- No database migration to roll back
- No breaking API changes

## Definition of Done

- [ ] Code changes implemented in both files
- [ ] Unit tests added and passing (80%+ coverage)
- [ ] Manual testing completed (success + error scenarios)
- [ ] ESLint passes with no new warnings
- [ ] Build succeeds
- [ ] SonarCloud shows 0 new issues
- [ ] PR reviewed and approved
- [ ] Changes deployed to Vercel Preview
- [ ] User verification in preview environment
