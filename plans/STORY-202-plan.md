# Implementation Plan: Fix Tournament Deletion Bug (#202)

## Story Context

**Issue:** #202 - Fix: Cannot delete tournaments due to missing qualified teams predictions cleanup
**Priority:** High
**Effort:** Low (1-2 days)
**Category:** Technical UX

### Problem Statement

When attempting to delete a tournament through the backoffice, the operation fails because the `eraseDbTournament()` function doesn't clean up records from the `tournament_user_group_positions_predictions` table. This table stores users' predictions for which teams will qualify from each group and in what position.

### Root Cause

The `deleteDBTournamentTree()` function in `app/actions/backoffice-actions.ts` (lines 114-127) deletes many related entities before deleting the tournament, but it's missing a call to delete group positions predictions. Even though the table has `ON DELETE CASCADE` on its foreign key to `tournaments(id)`, the deletion might fail due to constraint enforcement order or dependency chain issues with tournament groups.

### Impact

- **Severity:** High - Blocks tournament deletion feature entirely
- **User Impact:** Administrators cannot delete tournaments, preventing cleanup of test/old data
- **Business Impact:** Prevents proper tournament lifecycle management

## Acceptance Criteria

- [ ] New repository function `deleteAllTournamentGroupPositionsPredictions(tournamentId)` exists in `qualified-teams-repository.ts`
- [ ] Function is called in correct order within `deleteDBTournamentTree()` (after tournament guesses, before groups)
- [ ] Unit test added for new repository function
- [ ] Integration test updated in backoffice-actions tests to verify the new function is called
- [ ] Manual verification: Tournament with group positions predictions can be successfully deleted
- [ ] 0 new SonarCloud issues
- [ ] 80%+ coverage on new code

## Technical Approach

### 1. Add Missing Repository Function

**File:** `app/db/qualified-teams-repository.ts`

Add new function following the existing pattern of deletion functions:

```typescript
/**
 * Delete all group positions predictions for a tournament across all users
 * Used when deleting a tournament (admin operation)
 */
export async function deleteAllTournamentGroupPositionsPredictions(
  tournamentId: string
): Promise<void> {
  await db
    .deleteFrom(jsonbTableName) // Uses existing constant defined at line 13: 'tournament_user_group_positions_predictions'
    .where('tournament_id', '=', tournamentId)
    .execute();
}
```

**Rationale:**
- Follows existing naming convention (`deleteAll*`)
- Consistent with other bulk deletion functions
- Simple, focused responsibility
- No return value needed (same as other delete functions)
- Uses existing `jsonbTableName` constant (defined at top of file)

### 2. Update Tournament Deletion Function

**File:** `app/actions/backoffice-actions.ts`

**Import the new function:**
```typescript
import { deleteAllTournamentGroupPositionsPredictions } from '../db/qualified-teams-repository';
```

**Add call in correct order (after line 115):**
```typescript
// Delete all related entities in reverse order of dependencies
// User-related data
await deleteAllGameGuessesByTournamentId(tournament.id);
await deleteAllTournamentGuessesByTournamentId(tournament.id);
await deleteAllTournamentGroupPositionsPredictions(tournament.id); // NEW

// Tournament structure and content
await deleteAllPlayersInTournament(tournament.id);
// ... rest remains the same
```

**Order Rationale:**
- **After** tournament guesses: Group positions predictions are user-related prediction data (same category)
- **Before** groups: The table has foreign keys to both `tournaments(id)` and `tournament_groups(id)` (see migration `20260206000000_create_jsonb_positions_predictions.sql`). While both have `ON DELETE CASCADE`, explicit deletion ensures proper cleanup order and avoids potential cascade conflicts.
- **Before** tournament: Must delete related records before parent entity

### 3. Add Repository Tests

**File:** `__tests__/db/qualified-teams-repository.test.ts`

Add new test following existing pattern (after line 181):

```typescript
describe('deleteAllTournamentGroupPositionsPredictions', () => {
  it('should delete all predictions for a tournament across all users', async () => {
    const mockQuery = createMockDeleteQuery();
    mockDb.deleteFrom.mockReturnValue(mockQuery as any);

    await deleteAllTournamentGroupPositionsPredictions('tournament-1');

    // Verify correct table name (matches jsonbTableName constant in repository)
    expect(mockDb.deleteFrom).toHaveBeenCalledWith('tournament_user_group_positions_predictions');
    expect(mockQuery.where).toHaveBeenCalledWith('tournament_id', '=', 'tournament-1');
    expect(mockQuery.execute).toHaveBeenCalled();
  });
});
```

### 4. Update Integration Tests

**File:** `__tests__/actions/backoffice-actions.test.ts`

**Add module import** (at top with other imports):
```typescript
import * as qualifiedTeamsRepository from '../../app/db/qualified-teams-repository';
```

**Add mock** (in the vi.mock section ~line 100-150):
```typescript
vi.mock('../../app/db/qualified-teams-repository', () => ({
  deleteAllTournamentGroupPositionsPredictions: vi.fn(),
  // ... other exports if needed
}));
```

**Add mock function** (around line 283-290 with other delete mocks):
```typescript
const mockDeleteAllTournamentGroupPositionsPredictions = vi.mocked(
  qualifiedTeamsRepository.deleteAllTournamentGroupPositionsPredictions
);
```

**Update test for `deleteDBTournamentTree()`:**
Search for test named "should delete tournament and all related entities" or similar.
Add assertion for new function call:

```typescript
expect(mockDeleteAllTournamentGroupPositionsPredictions).toHaveBeenCalledWith(tournament.id);
```

Verify the call order is correct (after `mockDeleteAllTournamentGuessesByTournamentId`, before `mockDeleteAllGroupsFromTournament`).

## Files to Create/Modify

### Files to Modify

1. **`app/db/qualified-teams-repository.ts`**
   - Add `deleteAllTournamentGroupPositionsPredictions()` function
   - ~10 lines of code

2. **`app/actions/backoffice-actions.ts`**
   - Import new function
   - Add function call in `deleteDBTournamentTree()` at line 116
   - ~2 lines of code

3. **`__tests__/db/qualified-teams-repository.test.ts`**
   - Add test for new deletion function
   - ~12 lines of code

4. **`__tests__/actions/backoffice-actions.test.ts`**
   - Add mock import
   - Add mock function variable
   - Add assertion in existing test
   - ~5 lines of code

### Files to Read (No Changes)

- `app/db/database.ts` - Understand db instance
- `app/db/tables-definition.ts` - Confirm table structure
- `migrations/20260206000000_create_jsonb_positions_predictions.sql` - Verify foreign key constraints

## Implementation Steps

### Step 1: Add Repository Function
1. Open `app/db/qualified-teams-repository.ts`
2. Add new function at end of file (after line 144)
3. Follow existing pattern of deletion functions
4. Add JSDoc comment explaining purpose

### Step 2: Update Tournament Deletion
1. Open `app/actions/backoffice-actions.ts`
2. Add import at top with other repository imports
3. Add function call at line 116 (after tournament guesses deletion)
4. Verify order is correct

### Step 3: Add Repository Tests
1. Open `__tests__/db/qualified-teams-repository.test.ts`
2. Add new describe block after existing delete tests
3. Follow existing test pattern using mock helpers
4. Verify all expectations are correct

### Step 4: Update Integration Tests
1. Open `__tests__/actions/backoffice-actions.test.ts`
2. Add mock import in vi.mock section
3. Add mock function variable with other delete mocks
4. Find and update deleteDBTournamentTree test
5. Add assertion for new function call
6. Verify call order in test

### Step 5: Run Tests and Validate
1. Run repository tests: `npm test qualified-teams-repository`
2. Run backoffice tests: `npm test backoffice-actions`
3. Run full test suite: `npm test`
4. Verify 80%+ coverage on new code
5. Fix any failing tests

### Step 6: Manual Testing (if possible)
1. Create test tournament with groups
2. Add some user predictions for qualified teams
3. Deactivate tournament
4. Attempt to delete tournament
5. Verify deletion succeeds without errors

## Testing Strategy

### Unit Tests

**Repository Test** (`__tests__/db/qualified-teams-repository.test.ts`):
- ✅ Verifies correct table name used (`tournament_user_group_positions_predictions`)
- ✅ Verifies correct where clause (tournament_id filter)
- ✅ Verifies execute is called
- ✅ Follows existing test pattern using `createMockDeleteQuery()`

**Integration Test** (`__tests__/actions/backoffice-actions.test.ts`):
- ✅ Verifies new function is called during tournament deletion
- ✅ Verifies function is called with correct tournament ID
- ✅ Verifies call order (after guesses, before groups)
- ✅ Maintains existing test coverage for other cleanup operations

### Coverage Target

- New function: 100% coverage (simple delete query)
- Modified function call: Covered by existing integration test
- Overall: 80%+ coverage on new code (exceeds SonarCloud requirement)

### Edge Cases Covered

1. **No predictions exist:** Delete succeeds with 0 rows affected (normal SQL behavior)
2. **Multiple users have predictions:** All deleted correctly (where clause only filters by tournament_id)
3. **Multiple groups:** All predictions across all groups deleted (no group_id filter)
4. **Foreign key constraints:** Deletion happens before groups are deleted, avoiding constraint violations

## Validation Considerations

### SonarCloud Requirements

1. **Code Coverage:** New code has 100% test coverage ✅
2. **Code Smells:** Function follows existing patterns, no duplication ✅
3. **Bugs:** Proper error handling via Kysely's built-in mechanisms ✅
4. **Security:** Admin-only operation (verified in parent function) ✅
5. **Duplicated Code:** 0% - unique function with clear purpose ✅

### Pre-Commit Checklist

- [ ] All tests pass: `npm test`
- [ ] Linting passes: `npm run lint`
- [ ] Build succeeds: `npm run build`
- [ ] No TypeScript errors
- [ ] Coverage meets 80% threshold

### Quality Gates

- **0 new SonarCloud issues** of any severity
- **80%+ coverage** on new code
- **All tests passing** (unit + integration)
- **No regressions** in existing functionality

## Risk Assessment

### Low Risk ✅

This is a straightforward bug fix with minimal risk:

1. **Isolated Change:** Only affects tournament deletion flow
2. **Follows Existing Patterns:** Uses same structure as other delete functions
3. **Well-Tested:** Comprehensive unit and integration tests
4. **Safe Operation:** Admin-only, already gated by authorization checks
5. **No Database Changes:** Uses existing table and schema
6. **Reversible:** If issues arise, can be easily reverted

### Potential Issues (Mitigated)

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Function called in wrong order | Low | High | Integration test verifies order; code review |
| Delete cascade conflicts | Very Low | Medium | Foreign keys have ON DELETE CASCADE; order is correct |
| Performance on large datasets | Very Low | Low | Simple indexed query on tournament_id |
| Missing test coverage | Very Low | Low | Comprehensive test suite; SonarCloud enforcement |

## Dependencies

### No External Dependencies

- Uses existing `db` instance
- Uses existing `jsonbTableName` constant
- No new packages required
- No database migrations needed

### Internal Dependencies

- **Database:** `app/db/database.ts` - db instance
- **Table Definition:** `app/db/tables-definition.ts` - TypeScript types
- **Parent Function:** `app/actions/backoffice-actions.ts` - tournament deletion flow
- **Test Utilities:** `__tests__/db/mock-helpers.ts` - mock helpers for tests

## Open Questions

None. The solution is straightforward and well-defined.

## Success Metrics

- ✅ Tournament deletion works correctly with group positions predictions
- ✅ 0 new SonarCloud issues
- ✅ 80%+ test coverage on new code
- ✅ All existing tests continue to pass
- ✅ No performance degradation in tournament deletion
