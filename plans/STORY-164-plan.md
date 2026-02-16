# Implementation Plan: Bug #164 - Individual Awards and Honor Roll Guesses Being Cleared on Update

## Story Context

**Issue:** [BUG] Individual Awards and Honor Roll Guesses Being Cleared on Update (#164)

**Severity:** Critical - Data Loss

**Problem:** When an administrator updates individual awards or honor roll values, all user guesses for individual awards and honor roll are being cleared/cleaned, resulting in users losing their prediction points.

## Root Cause Analysis

After investigating the codebase, I've identified the bug in `app/actions/backoffice-actions.ts`:

### The Problem

Both `updateTournamentAwards()` (lines 451-477) and `updateTournamentHonorRoll()` (lines 479-514) have the same bug:

**They only calculate scores based on the fields being updated in the current request (`withUpdate`), NOT all fields that exist in the tournament.**

### How the Bug Manifests

#### For Individual Awards (`updateTournamentAwards`):

```typescript
export async function updateTournamentAwards(tournamentId: string, withUpdate: TournamentUpdate) {
  // Updates the tournament with ONLY the fields in withUpdate
  await updateTournament(tournamentId, withUpdate)

  const tournament = await findTournamentById(tournamentId);
  const individual_award_points = tournament.individual_award_points ?? 3;
  const allTournamentGuesses = await findTournamentGuessByTournament(tournamentId)

  return await Promise.all(allTournamentGuesses.map(async (tournamentGuess) => {
    const awardsScore = awardsDefinition.reduce((accumScore, awardDefinition) => {
      // BUG: Only checks awards in withUpdate, ignores all other awards!
      if (withUpdate[awardDefinition.property]) {
        if (tournamentGuess[awardDefinition.property] === withUpdate[awardDefinition.property]) {
          return accumScore + individual_award_points
        }
      }
      return accumScore
    }, 0)
    // BUG: Sets total score to ONLY the score from fields in withUpdate
    return await updateTournamentGuessWithSnapshot(tournamentGuess.id, {
      individual_awards_score: awardsScore
    })
  }))
}
```

**Example Scenario:**

1. Tournament already has:
   - `best_player_id = 'player1'`
   - `top_goalscorer_player_id = 'player2'`
2. User has guesses matching both awards (should have 6 points total: 3+3)
3. Admin updates `best_goalkeeper_player_id = 'player3'`
4. Function receives `withUpdate = { best_goalkeeper_player_id: 'player3' }`
5. Score calculation loop ONLY checks `best_goalkeeper_player_id` (the only field in withUpdate)
6. Ignores `best_player_id` and `top_goalscorer_player_id` (not in withUpdate)
7. Sets `individual_awards_score = 0` or points only for best_goalkeeper match
8. **Result: User loses all points from previously set awards!**

#### For Honor Roll (`updateTournamentHonorRoll`):

Same pattern:

```typescript
export async function updateTournamentHonorRoll(tournamentId: string, withUpdate: TournamentUpdate) {
  await updateTournament(tournamentId, withUpdate)

  // ...

  if(withUpdate.champion_team_id || withUpdate.runner_up_team_id || withUpdate.third_place_team_id) {
    const allTournamentGuesses = await findTournamentGuessByTournament(tournamentId)
    return await Promise.all(allTournamentGuesses.map(async (tournamentGuess) => {
      let honorRollScore = 0
      // BUG: Only checks fields in withUpdate!
      if(withUpdate.champion_team_id &&
        tournamentGuess.champion_team_id === withUpdate.champion_team_id) {
        honorRollScore += champion_points
      }
      if(withUpdate.runner_up_team_id &&
        tournamentGuess.runner_up_team_id === withUpdate.runner_up_team_id) {
        honorRollScore += runner_up_points
      }
      if(withUpdate.third_place_team_id &&
        tournamentGuess.third_place_team_id === withUpdate.third_place_team_id) {
        honorRollScore += third_place_points
      }
      // BUG: Sets total score to ONLY the score from fields in withUpdate
      return await updateTournamentGuessWithSnapshot(tournamentGuess.id, {
        honor_roll_score: honorRollScore
      })
    }))
  }
}
```

**Example:** If admin updates only `champion_team_id`, users lose all points from `runner_up_team_id` and `third_place_team_id` that were previously set.

## Technical Approach

### Fix Strategy

**Change the score calculation to use the UPDATED tournament state (which has ALL fields), not just the fields in `withUpdate`.**

#### For `updateTournamentAwards()`:

**Before (buggy):**
```typescript
const awardsScore = awardsDefinition.reduce((accumScore, awardDefinition) => {
  if (withUpdate[awardDefinition.property]) { // BUG: Only checks withUpdate
    if (tournamentGuess[awardDefinition.property] === withUpdate[awardDefinition.property]) {
      return accumScore + individual_award_points
    }
  }
  return accumScore
}, 0)
```

**After (fixed):**
```typescript
const awardsScore = awardsDefinition.reduce((accumScore, awardDefinition) => {
  // Use tournament (UPDATED state with ALL fields), not withUpdate
  if (tournament[awardDefinition.property]) {
    if (tournamentGuess[awardDefinition.property] === tournament[awardDefinition.property]) {
      return accumScore + individual_award_points
    }
  }
  return accumScore
}, 0)
```

**Key change:** Check `tournament[awardDefinition.property]` instead of `withUpdate[awardDefinition.property]`.

Since we call `updateTournament(tournamentId, withUpdate)` first, then fetch the tournament with `findTournamentById()`, the `tournament` variable now contains ALL awards (previously set + newly updated).

#### For `updateTournamentHonorRoll()`:

**Before (buggy):**
```typescript
let honorRollScore = 0
if(withUpdate.champion_team_id &&
  tournamentGuess.champion_team_id === withUpdate.champion_team_id) {
  honorRollScore += champion_points
}
// ... similar for runner_up and third_place
```

**After (fixed):**
```typescript
let honorRollScore = 0
if(tournament.champion_team_id &&
  tournamentGuess.champion_team_id === tournament.champion_team_id) {
  honorRollScore += champion_points
}
if(tournament.runner_up_team_id &&
  tournamentGuess.runner_up_team_id === tournament.runner_up_team_id) {
  honorRollScore += runner_up_points
}
if(tournament.third_place_team_id &&
  tournamentGuess.third_place_team_id === tournament.third_place_team_id) {
  honorRollScore += third_place_points
}
```

**Key changes:**
1. Check `tournament.champion_team_id` instead of `withUpdate.champion_team_id`
2. Check ALL three honor roll fields, not just the ones in `withUpdate`
3. Remove the outer `if` condition that checked if any honor roll fields exist in `withUpdate`

### Why This Fix Works

1. `updateTournament(tournamentId, withUpdate)` updates the tournament record with the new fields
2. `findTournamentById(tournamentId)` fetches the UPDATED tournament (now has ALL fields: old + new)
3. Score calculation now uses `tournament` (complete state) instead of `withUpdate` (partial update)
4. Result: Scores are calculated correctly based on ALL awards/honor roll fields, not just the ones being updated

## Acceptance Criteria

✅ When admin updates ONE individual award, users retain points for ALL other individual awards
✅ When admin updates ONE honor roll field, users retain points for ALL other honor roll fields
✅ Score calculations are based on the complete tournament state, not just the update delta
✅ Existing tests pass with updated logic
✅ New regression tests verify the fix

## Files to Modify

### 1. `app/actions/backoffice-actions.ts`

**Lines 451-477: Fix `updateTournamentAwards()`**

Changes:
- Line 465: Change `if (withUpdate[awardDefinition.property])` to `if (tournament[awardDefinition.property])`
- Line 466: Change `withUpdate[awardDefinition.property]` to `tournament[awardDefinition.property]`

**Lines 479-514: Fix `updateTournamentHonorRoll()`**

Changes:
- Remove the outer `if` condition at line 493
- Always calculate score for all three honor roll fields
- Line 497: Change `if(withUpdate.champion_team_id &&` to `if(tournament.champion_team_id &&`
- Line 498: Change `withUpdate.champion_team_id)` to `tournament.champion_team_id)`
- Line 501: Change `if(withUpdate.runner_up_team_id &&` to `if(tournament.runner_up_team_id &&`
- Line 502: Change `withUpdate.runner_up_team_id)` to `tournament.runner_up_team_id)`
- Line 505: Change `if(withUpdate.third_place_team_id &&` to `if(tournament.third_place_team_id &&`
- Line 506: Change `withUpdate.third_place_team_id)` to `tournament.third_place_team_id)`

### 2. `__tests__/actions/backoffice-actions.test.ts`

**Update existing tests (lines 922-1066):**

Tests need to be updated because the mock behavior changes:
- `updateTournamentAwards` test: Mock `findTournamentById` to return tournament with ALL awards (not just the ones being updated)
- `updateTournamentHonorRoll` test: Mock `findTournamentById` to return tournament with ALL honor roll fields

**Add new regression tests:**

1. **Test: "updateTournamentAwards preserves scores for existing awards when updating different award"**
   - Setup: Tournament has `best_player_id = 'player1'`, `top_goalscorer_player_id = 'player2'`
   - User guess matches both awards
   - Action: Update `best_goalkeeper_player_id = 'player3'` (user doesn't match this one)
   - Expected: User retains 6 points (3+3 from the two original awards)

2. **Test: "updateTournamentAwards recalculates correctly when updating existing award"**
   - Setup: Tournament has `best_player_id = 'player1'`
   - User guess matches the award (3 points)
   - Action: Update `best_player_id = 'player2'` (user no longer matches)
   - Expected: User has 0 points

3. **Test: "updateTournamentHonorRoll preserves scores for existing honor roll when updating different field"**
   - Setup: Tournament has `champion_team_id = 'team1'`, `runner_up_team_id = 'team2'`
   - User guess matches both (5+3=8 points)
   - Action: Update `third_place_team_id = 'team3'` (user doesn't match this one)
   - Expected: User retains 8 points

4. **Test: "updateTournamentHonorRoll recalculates correctly when updating existing honor roll field"**
   - Setup: Tournament has `champion_team_id = 'team1'`
   - User guess matches (5 points)
   - Action: Update `champion_team_id = 'team2'` (user no longer matches)
   - Expected: User has 0 points (or points from other honor roll fields if set)

## Implementation Steps

### Step 1: Fix `updateTournamentAwards()`

File: `app/actions/backoffice-actions.ts` (lines 451-477)

Change the score calculation logic to use `tournament` instead of `withUpdate`:

```typescript
export async function updateTournamentAwards(tournamentId: string, withUpdate: TournamentUpdate) {
  //Store and Calculate score for all users if not empty
  await updateTournament(tournamentId, withUpdate)

  // Get tournament for scoring config
  const tournament = await findTournamentById(tournamentId);
  if (!tournament) {
    throw new Error(`Tournament ${tournamentId} not found`);
  }

  const individual_award_points = tournament.individual_award_points ?? 3;
  const allTournamentGuesses = await findTournamentGuessByTournament(tournamentId)

  return await Promise.all(allTournamentGuesses.map(async (tournamentGuess) => {
    const awardsScore = awardsDefinition.reduce((accumScore, awardDefinition) => {
      // FIX: Use tournament (complete state) instead of withUpdate (partial update)
      if (tournament[awardDefinition.property]) {
        if (tournamentGuess[awardDefinition.property] === tournament[awardDefinition.property]) {
          return accumScore + individual_award_points
        }
      }
      return accumScore
    }, 0)
    return await updateTournamentGuessWithSnapshot(tournamentGuess.id, {
      individual_awards_score: awardsScore
    })
  }))
}
```

### Step 2: Fix `updateTournamentHonorRoll()`

File: `app/actions/backoffice-actions.ts` (lines 479-514)

Change the score calculation logic to:
1. Always run (remove outer if condition)
2. Use `tournament` instead of `withUpdate`
3. Check all three honor roll fields

```typescript
export async function updateTournamentHonorRoll(tournamentId: string, withUpdate: TournamentUpdate) {
  //Store and calculate score for all users if the honor roll is not empty
  await updateTournament(tournamentId, withUpdate)

  // Get tournament for scoring config
  const tournament = await findTournamentById(tournamentId);
  if (!tournament) {
    throw new Error(`Tournament ${tournamentId} not found`);
  }

  const champion_points = tournament.champion_points ?? 5;
  const runner_up_points = tournament.runner_up_points ?? 3;
  const third_place_points = tournament.third_place_points ?? 1;

  // FIX: Always recalculate scores based on ALL honor roll fields in tournament
  const allTournamentGuesses = await findTournamentGuessByTournament(tournamentId)
  return await Promise.all(allTournamentGuesses.map(async (tournamentGuess) => {
    let honorRollScore = 0
    // FIX: Use tournament (complete state) instead of withUpdate (partial update)
    if(tournament.champion_team_id &&
      tournamentGuess.champion_team_id === tournament.champion_team_id) {
      honorRollScore += champion_points
    }
    if(tournament.runner_up_team_id &&
      tournamentGuess.runner_up_team_id === tournament.runner_up_team_id) {
      honorRollScore += runner_up_points
    }
    if(tournament.third_place_team_id &&
      tournamentGuess.third_place_team_id === tournament.third_place_team_id) {
      honorRollScore += third_place_points
    }
    return await updateTournamentGuessWithSnapshot(tournamentGuess.id, {
      honor_roll_score: honorRollScore
    })
  }))
}
```

### Step 3: Update Existing Tests

File: `__tests__/actions/backoffice-actions.test.ts`

**Update test mocks:**

Both tests need to mock `findTournamentById` to return a tournament with ALL relevant fields, not just the ones being updated:

```typescript
describe('updateTournamentAwards', () => {
  // ... existing setup ...

  beforeEach(() => {
    // Mock findTournamentById to return tournament with ALL awards
    mockFindTournamentById.mockResolvedValue({
      id: 'tournament1',
      individual_award_points: 3,
      // Include the fields being updated PLUS any existing fields
      best_player_id: 'player1',
      top_goalscorer_player_id: 'player2',
      // ... other tournament fields
    });
  });
});

describe('updateTournamentHonorRoll', () => {
  // ... existing setup ...

  beforeEach(() => {
    // Mock findTournamentById to return tournament with ALL honor roll fields
    mockFindTournamentById.mockResolvedValue({
      id: 'tournament1',
      champion_points: 5,
      runner_up_points: 3,
      third_place_points: 1,
      // Include the fields being updated PLUS any existing fields
      champion_team_id: 'team1',
      runner_up_team_id: 'team2',
      third_place_team_id: 'team3',
      // ... other tournament fields
    });
  });
});
```

### Step 4: Add Regression Tests

File: `__tests__/actions/backoffice-actions.test.ts`

Add 4 new regression tests (see "Add new regression tests" section above for test descriptions).

These tests verify:
1. Updating one award preserves scores from other awards
2. Updating an existing award recalculates correctly
3. Updating one honor roll field preserves scores from other honor roll fields
4. Updating an existing honor roll field recalculates correctly

### Step 5: Manual Testing

After code changes and tests pass:

1. **Setup test data:**
   - Create a tournament
   - Set `best_player_id = 'player1'` and `top_goalscorer_player_id = 'player2'`
   - Create a user guess matching both awards (should have 6 points)

2. **Reproduce the bug (before fix):**
   - Update `best_goalkeeper_player_id = 'player3'`
   - Check user's `individual_awards_score`
   - Expected (buggy behavior): Score is 0 or only counts best_goalkeeper

3. **Verify the fix (after fix):**
   - Update `best_goalkeeper_player_id = 'player3'`
   - Check user's `individual_awards_score`
   - Expected (fixed behavior): Score is still 6 (3+3 from the two original awards)

4. **Test honor roll similarly:**
   - Set `champion_team_id` and `runner_up_team_id`
   - User matches both (8 points: 5+3)
   - Update `third_place_team_id`
   - Verify user still has 8 points

## Testing Strategy

### Unit Tests

**Existing tests to update:**
- `updateTournamentAwards` test suite (lines 922-1003)
- `updateTournamentHonorRoll` test suite (lines 1005-1066)

**New regression tests to add:**
- Individual awards: Preserve existing scores when updating different award
- Individual awards: Recalculate when updating existing award
- Honor roll: Preserve existing scores when updating different field
- Honor roll: Recalculate when updating existing field

**Test coverage requirements:**
- 80% coverage on modified lines (SonarCloud requirement)
- All regression scenarios covered
- Edge cases: empty awards, null values, no matching guesses

### Integration Tests

**Manual verification:**
1. Test via backoffice UI (Awards tab)
2. Test via backoffice UI (Playoff tab - honor roll)
3. Verify leaderboard scores remain correct after updates

### Edge Cases to Test

1. **No existing awards:** Update first award → Score calculated correctly
2. **All awards already set:** Update one award → Scores recalculated for all awards
3. **User doesn't match any awards:** Score remains 0 after update
4. **Multiple users:** All users' scores recalculated correctly
5. **Null/undefined values:** Handled gracefully (awards set to null don't contribute to score)
6. **Custom scoring points:** Respects tournament's `individual_award_points` setting

## Risks & Mitigation

### Risk 1: Performance Impact

**Risk:** Recalculating scores for ALL guesses on every update (even when updating one field)

**Mitigation:**
- This is the CURRENT behavior - we're just fixing the calculation, not changing the approach
- For large tournaments, this runs once per admin action (not frequent)
- If needed later: Optimize by only recalculating when relevant fields change

### Risk 2: Existing Data Corruption

**Risk:** Users may have already lost points due to this bug

**Impact:**
- Historical score data may be incorrect
- Users may have lost points from previous admin updates

**Mitigation:**
- **This story:** Fix the bug to prevent further data loss (stop the bleeding)
- **Separate follow-up story:** Data reconciliation/recovery for users who already lost points
- Rationale: Keep this story focused on the urgent fix; data recovery is a separate concern that can be addressed after the fix is deployed

**Decision:** Data reconciliation is OUT OF SCOPE for this story. Will create a separate follow-up story for data recovery after this fix is deployed and verified.

### Risk 3: Test Coverage

**Risk:** Existing tests may not catch all edge cases

**Mitigation:**
- Add comprehensive regression tests (see Testing Strategy)
- Manual verification before deployment
- Monitor SonarCloud coverage (must maintain ≥80%)

## Validation Checklist

Before marking as complete:

- [ ] Both functions (`updateTournamentAwards` and `updateTournamentHonorRoll`) are fixed
- [ ] All existing tests pass
- [ ] New regression tests added and passing
- [ ] Code coverage ≥80% on modified lines
- [ ] Manual testing completed (see Step 5 above)
- [ ] SonarCloud shows 0 new issues
- [ ] Verified in Vercel Preview deployment

## Post-Deployment

### Data Reconciliation (OUT OF SCOPE - Follow-up Story Needed)

**Status:** Data reconciliation is **NOT included in this story**.

**Why:**
- This story focuses on fixing the bug to prevent further data loss
- Data recovery for users who already lost points is a separate concern
- Keeps this story focused and deployable quickly (urgent fix)

**Follow-up Story Required:**
Create a separate story for data reconciliation after this fix is deployed:
- **Title:** "Data Recovery: Recalculate Tournament Guess Scores After Bug #164 Fix"
- **Scope:** Run a one-time migration script to recalculate all tournament guess scores based on current tournament state
- **Priority:** High (but not blocking this bug fix)

**Script logic (for follow-up story):**
```typescript
// For each tournament
const tournament = await findTournamentById(tournamentId);
const allGuesses = await findTournamentGuessByTournament(tournamentId);

// Recalculate individual awards scores
for (const guess of allGuesses) {
  const awardsScore = awardsDefinition.reduce((acc, award) => {
    if (tournament[award.property] && guess[award.property] === tournament[award.property]) {
      return acc + (tournament.individual_award_points ?? 3);
    }
    return acc;
  }, 0);

  await updateTournamentGuess(guess.id, { individual_awards_score: awardsScore });
}

// Recalculate honor roll scores
for (const guess of allGuesses) {
  let honorRollScore = 0;
  if (tournament.champion_team_id && guess.champion_team_id === tournament.champion_team_id) {
    honorRollScore += (tournament.champion_points ?? 5);
  }
  if (tournament.runner_up_team_id && guess.runner_up_team_id === tournament.runner_up_team_id) {
    honorRollScore += (tournament.runner_up_points ?? 3);
  }
  if (tournament.third_place_team_id && guess.third_place_team_id === tournament.third_place_team_id) {
    honorRollScore += (tournament.third_place_points ?? 1);
  }

  await updateTournamentGuess(guess.id, { honor_roll_score: honorRollScore });
}
```

## Success Metrics

- ✅ Users no longer lose points when admin updates awards/honor roll
- ✅ All existing tests pass
- ✅ New regression tests verify the fix
- ✅ 0 new SonarCloud issues
- ✅ Manual testing confirms correct behavior
- ✅ Vercel Preview deployment works correctly

## Timeline Estimate

- Fix implementation: 30 minutes
- Test updates: 1 hour
- Manual testing: 30 minutes
- Code review & validation: 30 minutes
- **Total: ~2.5 hours**

## Dependencies

### Story-147 Analysis

**Question:** Should we wait for story-147 (Materialize Score Calculations) to merge first?

**Answer: NO - Proceed independently**

**Analysis:**
- **Story-147 changes:** Materializes game scores (group/playoff) in `tournament_guesses` table
  - Modifies: `calculateGameScores()`, adds new columns, updates read paths
  - Does NOT modify: `updateTournamentAwards()` or `updateTournamentHonorRoll()`
- **Story-164 changes (this bug fix):** Fixes tournament awards and honor roll score calculation
  - Modifies: `updateTournamentAwards()` and `updateTournamentHonorRoll()`
  - Does NOT touch: Game score calculations or materialization

**Conclusion:**
- ✅ **No code conflicts** - Different functions modified
- ✅ **Orthogonal concerns** - Game scores (147) vs awards/honor roll (164)
- ✅ **Critical urgency** - Data loss is happening now, can't wait for performance optimization
- ⚠️ **Minor risk** - Test files might have merge conflicts (easily resolved)

**Decision: Proceed with story-164 independently. Do not wait for story-147 to merge.**

## References

- Issue: #164
- Related files:
  - `app/actions/backoffice-actions.ts` (main fix)
  - `__tests__/actions/backoffice-actions.test.ts` (test updates)
  - `app/components/backoffice/awards-tab.tsx` (calls updateTournamentAwards)
  - `app/components/backoffice/playoff-tab.tsx` (calls updateTournamentHonorRoll)
