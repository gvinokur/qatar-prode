# Implementation Plan: Bug #164 - Tournament Guesses Being Deleted When Users Update Awards

## Story Context

**Issue:** [BUG] Individual Awards and Honor Roll Guesses Being Cleared on Update (#164)

**Severity:** Critical - Data Loss

**Problem:** When end users update their individual award or honor roll guesses (predictions), all other data in their tournament_guesses record is being deleted, including:
- Other award/honor roll guesses
- All score data (honor_roll_score, individual_awards_score, qualified_teams_score, group_position_score)
- All materialized game scores (total_game_score, group_stage_game_score, playoff_stage_game_score, boost bonuses)
- All prediction statistics (total_correct_guesses, total_exact_guesses, etc.)
- All snapshot fields (yesterday_tournament_score, yesterday_total_game_score, etc.)
- Tracking timestamps (last_score_update_date, last_game_score_update_at)

## Root Cause Analysis

### Investigation Timeline

**Initial misunderstanding:** Originally identified the bug in admin-side scoring functions (`updateTournamentAwards()` and `updateTournamentHonorRoll()` in backoffice-actions.ts), but this was incorrect.

**Actual bug location:** The bug is in the END USER guess saving logic, specifically in `updateOrCreateTournamentGuess()` function in `app/db/tournament-guess-repository.ts` (lines 122-128).

**Discovery:** Through user clarification ("this is updating the award guesses on the end user side, not the admin side" and "Update one award, all user guesses reset"), found that the bug occurs when users save their predictions, not when admins score them.

### The Actual Bug

**File:** `app/db/tournament-guess-repository.ts` (lines 122-128)

```typescript
export async function updateOrCreateTournamentGuess(guess: TournamentGuessNew) {
  const existingGuess = await findTournamentGuessByUserIdTournament(guess.user_id, guess.tournament_id)
  if(existingGuess) {
    await deleteTournamentGuess(existingGuess.id)  // ❌ DELETES entire record
  }
  return createTournamentGuess(guess)  // ❌ CREATES with only fields in 'guess' parameter
}
```

**Problem:** The function uses a **delete+create pattern** instead of an **update operation**. This causes catastrophic data loss because:

1. When a user updates one award guess, the component only sends the fields it manages (award/honor roll guesses)
2. The database record contains MANY MORE FIELDS that are calculated/maintained server-side
3. The function DELETES the entire record (losing all server-maintained data)
4. The function CREATES a new record with ONLY the fields from the component
5. All other data is permanently lost

### Bug History (Git Blame Analysis)

**Original Introduction:**
- **Commit a2620456** (May 29, 2024): "Initial big refactor to use newer versions and fix Db and all things"
  - Function created with delete+create pattern as part of massive refactor (80 files changed)

**Attempted Fix (that didn't fix the actual issue):**
- **Commit 28816627** (May 31, 2024): "fix react hook, fix updating tournament guesses"
  - Only changed `return await deleteTournamentGuess(...)` to `await deleteTournamentGuess(...)`
  - Did NOT fix the delete+create bug - just fixed the return statement

**Why It Became Critical NOW:**
- **Commit c72e1a5** (Feb 15, 2026 - TODAY): Story #147 "Materialize Score Calculations" merged
  - Added extensive materialized fields to `tournament_guesses` table:
    - Game scores: `total_game_score`, `group_stage_game_score`, `playoff_stage_game_score`
    - Boost bonuses: `total_boost_bonus`, `group_stage_boost_bonus`, `playoff_stage_boost_bonus`
    - Statistics: `total_correct_guesses`, `total_exact_guesses`, `group_correct_guesses`, etc.
    - Snapshots: `yesterday_tournament_score`, `yesterday_total_game_score`, `yesterday_boost_bonus`
    - Timestamps: `last_score_update_date`, `last_game_score_update_at`
  - Before story-147: Bug only lost score fields (less noticeable)
  - After story-147: Bug loses ALL materialized data (catastrophic)

**Summary:**
- Bug existed for **~20 months** (May 2024 - Feb 2026)
- Became CRITICAL after story-147 merged (TODAY)
- Users experience complete data wipeout when updating award guesses

### Data Flow Analysis

**How the bug manifests:**

1. **User opens awards page** (`app/tournaments/[id]/awards/page.tsx`)
   - Page fetches tournament_guesses record via `findTournamentGuessByUserIdTournament()`
   - Record contains ALL fields (awards, scores, materialized data, snapshots, etc.)

2. **Component initializes** (`app/components/awards/award-panel.tsx`)
   - Component receives `tournamentGuesses` prop with complete data
   - Initializes local state: `useState(savedTournamentGuesses)`
   - **BUT:** Component only tracks award/honor roll fields in state (not score fields)

3. **User updates one award** (e.g., changes best_player_id)
   - Component handler: `handleGuessChange()`
   - Spreads current state: `{ ...tournamentGuesses, best_player_id: 'newValue' }`
   - **Problem:** State only contains award/honor roll fields, NOT server-calculated fields
   - Calls `savePredictions()` → `updateOrCreateTournamentGuess()`

4. **Server action** (`app/actions/guesses-actions.ts`)
   - Wrapper function calls database function directly
   - Passes the partial data object (only award/honor roll fields)

5. **Database function executes** (`app/db/tournament-guess-repository.ts`)
   - Finds existing record (has ALL fields: awards, scores, materialized data, etc.)
   - **DELETES** entire record
   - **CREATES** new record with ONLY the fields from the component
   - **ALL SERVER-MAINTAINED DATA IS LOST:**
     - ❌ All materialized game scores (story-147 data)
     - ❌ All boost bonuses
     - ❌ All prediction statistics
     - ❌ All snapshot fields (rank tracking)
     - ❌ All tracking timestamps
     - ❌ Other award guesses (if not in component state)

### Why Update Pattern Fixes This

**Correct approach: UPDATE operation**

```typescript
export async function updateOrCreateTournamentGuess(guess: TournamentGuessNew) {
  const existingGuess = await findTournamentGuessByUserIdTournament(guess.user_id, guess.tournament_id)
  if(existingGuess) {
    // UPDATE preserves existing fields not in 'guess' parameter
    return updateTournamentGuess(existingGuess.id, guess)
  } else {
    // CREATE only when no record exists
    return createTournamentGuess(guess)
  }
}
```

**Why this works:**
1. UPDATE operation only modifies the fields provided in `guess` parameter
2. All other fields (scores, materialized data, snapshots) are PRESERVED
3. Component can send partial updates (only award/honor roll fields)
4. Server-maintained fields remain intact

## Technical Approach

### Fix Strategy

**Replace delete+create pattern with UPDATE operation in `updateOrCreateTournamentGuess()` function.**

**File:** `app/db/tournament-guess-repository.ts` (lines 122-128)

**Before (buggy):**
```typescript
export async function updateOrCreateTournamentGuess(guess: TournamentGuessNew) {
  const existingGuess = await findTournamentGuessByUserIdTournament(guess.user_id, guess.tournament_id)
  if(existingGuess) {
    await deleteTournamentGuess(existingGuess.id)  // ❌ DELETES entire record
  }
  return createTournamentGuess(guess)  // ❌ CREATES with only fields in 'guess'
}
```

**After (fixed):**
```typescript
export async function updateOrCreateTournamentGuess(guess: TournamentGuessNew) {
  const existingGuess = await findTournamentGuessByUserIdTournament(guess.user_id, guess.tournament_id)
  if(existingGuess) {
    // ✅ UPDATE preserves fields not in 'guess' parameter
    return updateTournamentGuess(existingGuess.id, guess)
  } else {
    // ✅ CREATE only when no record exists
    return createTournamentGuess(guess)
  }
}
```

**Key changes:**
1. Replace `deleteTournamentGuess()` + `createTournamentGuess()` with `updateTournamentGuess()`
2. UPDATE operation preserves all existing fields not provided in `guess` parameter
3. Only fields in `guess` are modified, all others remain intact

### Why This Fix Works

1. **Partial updates supported:** Component can send only award/honor roll fields
2. **Server data preserved:** Score fields, materialized data, snapshots remain intact
3. **Existing behavior maintained:** CREATE still happens when no record exists
4. **Type-safe:** Uses existing `TournamentGuessUpdate` type via `updateTournamentGuess()`

## Acceptance Criteria

✅ Users can update individual award guesses without losing other award guesses
✅ Users can update honor roll guesses without losing other honor roll guesses
✅ Score fields (honor_roll_score, individual_awards_score, etc.) are preserved
✅ Materialized game scores (from story-147) are preserved
✅ Prediction statistics are preserved
✅ Snapshot fields (rank tracking) are preserved
✅ Tracking timestamps are preserved
✅ New records are created correctly when user has no existing tournament_guesses
✅ Existing tests pass
✅ New regression tests verify the fix

## Files to Modify

### 1. `app/db/tournament-guess-repository.ts`

**Lines 122-128: Fix `updateOrCreateTournamentGuess()`**

Changes:
- Line 125: Replace `await deleteTournamentGuess(existingGuess.id)` with `return updateTournamentGuess(existingGuess.id, guess)`
- Line 127: Keep `return createTournamentGuess(guess)` in else branch

### 2. `__tests__/db/tournament-guess-repository.test.ts`

**New test file (or add to existing test file if it exists)**

Add comprehensive regression tests:

1. **Test: "updateOrCreateTournamentGuess preserves score fields when updating awards"**
   - Setup: User has existing record with award guesses and score fields set
   - Action: Update one award guess
   - Expected: Score fields remain unchanged

2. **Test: "updateOrCreateTournamentGuess preserves materialized game scores"**
   - Setup: User has existing record with materialized game scores from story-147
   - Action: Update one award guess
   - Expected: All materialized fields preserved (total_game_score, group_stage_game_score, etc.)

3. **Test: "updateOrCreateTournamentGuess preserves snapshot fields"**
   - Setup: User has existing record with snapshot fields (yesterday_tournament_score, etc.)
   - Action: Update honor roll guess
   - Expected: All snapshot fields preserved

4. **Test: "updateOrCreateTournamentGuess preserves other award guesses when updating one award"**
   - Setup: User has multiple award guesses set (best_player, top_goalscorer, best_goalkeeper)
   - Action: Update only best_player_id
   - Expected: Other award guesses remain unchanged

5. **Test: "updateOrCreateTournamentGuess creates new record when none exists"**
   - Setup: User has no existing tournament_guesses record
   - Action: Save first award guess
   - Expected: New record created with provided fields

6. **Test: "updateOrCreateTournamentGuess updates multiple fields in single call"**
   - Setup: User has existing record
   - Action: Update multiple awards in one call
   - Expected: All provided fields updated, other fields preserved

### 3. Rollback Incorrect Fix

**Files to revert:**
- `app/actions/backoffice-actions.ts` (revert changes to updateTournamentAwards and updateTournamentHonorRoll)
- `__tests__/actions/backoffice-actions.test.ts` (revert test changes)

**Note:** The changes made to backoffice-actions.ts were based on a misunderstanding of the bug. While they may be technically correct (using tournament state vs withUpdate), they don't fix the actual user-reported issue. Revert them to keep this PR focused on the real bug.

## Implementation Steps

### Step 1: Rollback Incorrect Fix

**Goal:** Remove changes that don't fix the actual bug

1. Revert changes to `app/actions/backoffice-actions.ts`
   - Lines 465-466 in updateTournamentAwards
   - Lines 490-515 in updateTournamentHonorRoll

2. Revert changes to `__tests__/actions/backoffice-actions.test.ts`
   - Remove or revert test mock changes
   - Remove new regression tests added for backoffice functions

**Verification:**
```bash
git diff app/actions/backoffice-actions.ts
git diff __tests__/actions/backoffice-actions.test.ts
```

Both files should show no changes (back to main branch state).

### Step 2: Implement Correct Fix

**File:** `app/db/tournament-guess-repository.ts` (lines 122-128)

Replace the function with:

```typescript
export async function updateOrCreateTournamentGuess(guess: TournamentGuessNew) {
  const existingGuess = await findTournamentGuessByUserIdTournament(guess.user_id, guess.tournament_id)
  if(existingGuess) {
    // UPDATE existing record - preserves fields not in 'guess' parameter
    return updateTournamentGuess(existingGuess.id, guess)
  }
  // CREATE new record only when none exists
  return createTournamentGuess(guess)
}
```

**Note:** The `updateTournamentGuess` function already exists (line 12) and is properly typed to accept `TournamentGuessUpdate` type.

### Step 3: Add Comprehensive Tests

**File:** `__tests__/db/tournament-guess-repository.test.ts` (create if doesn't exist)

Add test suite with 6 regression tests (see "Files to Modify" section above).

**Test structure:**
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  updateOrCreateTournamentGuess,
  findTournamentGuessByUserIdTournament,
  updateTournamentGuess,
  createTournamentGuess
} from '../../app/db/tournament-guess-repository'
import { TournamentGuessNew } from '../../app/db/tables-definition'

vi.mock('../../app/db/tournament-guess-repository', async () => {
  const actual = await vi.importActual('../../app/db/tournament-guess-repository')
  return {
    ...actual,
    findTournamentGuessByUserIdTournament: vi.fn(),
    updateTournamentGuess: vi.fn(),
    createTournamentGuess: vi.fn()
  }
})

describe('updateOrCreateTournamentGuess', () => {
  // Test implementation...
})
```

### Step 4: Manual Testing

**Test scenario 1: Update award guess, verify data preservation**

1. Create test user and tournament
2. Seed tournament_guesses record:
   ```sql
   INSERT INTO tournament_guesses (
     user_id, tournament_id,
     best_player_id, top_goalscorer_player_id,
     individual_awards_score, honor_roll_score,
     total_game_score, yesterday_tournament_score
   ) VALUES (
     'user1', 'tournament1',
     'player1', 'player2',
     6, 8,
     150, 140
   );
   ```

3. Via UI: Update best_player_id to 'player3'

4. Query database:
   ```sql
   SELECT * FROM tournament_guesses WHERE user_id = 'user1' AND tournament_id = 'tournament1';
   ```

5. **Expected:**
   - best_player_id: 'player3' (updated)
   - top_goalscorer_player_id: 'player2' (preserved)
   - individual_awards_score: 6 (preserved)
   - honor_roll_score: 8 (preserved)
   - total_game_score: 150 (preserved)
   - yesterday_tournament_score: 140 (preserved)

**Test scenario 2: First-time guess creation**

1. User with no tournament_guesses record
2. Via UI: Set best_player_id to 'player1'
3. Query database
4. **Expected:** New record created with only user_id, tournament_id, and best_player_id

### Step 5: Commit and Push

**Commit message:**
```
Fix critical data loss bug in user tournament guess updates

When users updated award/honor roll guesses, the updateOrCreateTournamentGuess()
function used a delete+create pattern that wiped out all server-maintained data:
- Score fields (honor_roll_score, individual_awards_score, etc.)
- Materialized game scores (from story-147)
- Prediction statistics
- Snapshot fields (rank tracking)
- Tracking timestamps

Root cause: Function deleted entire record and recreated with only fields from
component, losing all server-calculated data.

Fix: Replace delete+create with UPDATE operation. UPDATE preserves existing
fields not included in the update parameter.

Bug existed since May 2024 but became critical after story-147 (Feb 15, 2026)
added extensive materialized fields to tournament_guesses table.

Fixes #164

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

## Testing Strategy

### Unit Tests

**New test file:** `__tests__/db/tournament-guess-repository.test.ts`

**Test coverage:**
- ✅ Preserves score fields when updating awards
- ✅ Preserves materialized game scores (story-147 fields)
- ✅ Preserves snapshot fields (rank tracking)
- ✅ Preserves other award guesses when updating one
- ✅ Creates new record when none exists
- ✅ Updates multiple fields in single call

**Coverage target:** ≥80% on modified lines (SonarCloud requirement)

### Integration Tests

**Manual verification (via Vercel Preview):**
1. Test awards page: Update various award guesses
2. Verify leaderboard: Scores remain correct
3. Check stats page: Prediction counts preserved
4. Test rank changes: Yesterday snapshots intact

### Edge Cases to Test

1. **No existing record:** First guess → Creates new record
2. **Update single field:** Other fields preserved
3. **Update multiple fields:** All updates applied, others preserved
4. **Null values:** Setting field to null doesn't corrupt other fields
5. **Concurrent updates:** Race conditions handled (existing Kysely transaction safety)
6. **Large datasets:** Performance with many fields (story-147 added ~20 new columns)

## Risks & Mitigation

### Risk 1: Existing Data Corruption

**Risk:** Users have already lost data due to this bug

**Impact:**
- Users who updated awards after story-147 merged (TODAY) lost ALL materialized data
- Historic score data may be incorrect
- Rank tracking snapshots may be missing

**Mitigation:**
- **This story:** Fix the bug immediately (stop the bleeding)
- **Separate follow-up story:** Data reconciliation/recovery
  - Recalculate scores for affected users
  - Restore materialized data where possible
  - Re-run ranking calculations
- **Rationale:** Keep this story focused on urgent fix; recovery is separate concern

**Decision:** Data reconciliation is OUT OF SCOPE for this story.

### Risk 2: Type Safety

**Risk:** `TournamentGuessNew` vs `TournamentGuessUpdate` type mismatch

**Analysis:**
- `guess` parameter is typed as `TournamentGuessNew` (Insertable<TournamentGuessTable>)
- `updateTournamentGuess()` expects `TournamentGuessUpdate` (Updateable<TournamentGuessTable>)
- Both types are compatible for partial updates (Kysely handles this)

**Mitigation:**
- TypeScript will catch any type issues at compile time
- Existing `updateTournamentGuess()` function already handles this correctly
- No changes needed to type signatures

### Risk 3: Test Coverage

**Risk:** Missing edge cases in tests

**Mitigation:**
- Comprehensive test suite (6 regression tests)
- Manual testing before deployment
- SonarCloud coverage monitoring (≥80%)

### Risk 4: Performance

**Risk:** UPDATE vs DELETE+CREATE performance difference

**Analysis:**
- UPDATE is faster than DELETE+CREATE (single operation vs two)
- No performance concerns - this is an improvement

**Conclusion:** No mitigation needed (fix improves performance)

## Validation Checklist

Before marking as complete:

- [ ] Incorrect fix rolled back (backoffice-actions.ts and tests)
- [ ] updateOrCreateTournamentGuess() fixed (UPDATE pattern)
- [ ] New test file created with comprehensive regression tests
- [ ] All tests pass (npm test)
- [ ] Code coverage ≥80% on modified lines
- [ ] Manual testing completed in Vercel Preview
- [ ] Verified: Award guesses preserved
- [ ] Verified: Score fields preserved
- [ ] Verified: Materialized data preserved (story-147 fields)
- [ ] Verified: Snapshot fields preserved
- [ ] SonarCloud shows 0 new issues
- [ ] Lint passes (npm run lint)
- [ ] Build succeeds (npm run build)

## Post-Deployment

### Immediate Actions

1. **Monitor:** Watch for user reports of data loss (should stop)
2. **Verify:** Check production data - no more score wipeouts
3. **Communicate:** Notify users that bug is fixed

### Follow-up Story Required: Data Recovery

**Title:** "Data Recovery: Restore Tournament Guess Data Lost in Bug #164"

**Scope:**
- Identify users affected by bug (updated awards after story-147 merged)
- Recalculate scores based on current tournament state
- Restore materialized game scores (re-run story-147 calculations)
- Re-run rank tracking calculations
- Update yesterday snapshots

**Priority:** High (but not blocking this bug fix)

**Script approach:**
```typescript
// 1. Identify affected users (updated awards after story-147 merge)
const affectedUsers = await findUsersWithMissingMaterializedData()

// 2. For each affected user:
for (const userId of affectedUsers) {
  // Recalculate award/honor roll scores
  await recalculateAwardScores(userId, tournamentId)

  // Restore materialized game scores (story-147)
  await recalculateGameScoresForUsers([userId], tournamentId)

  // Restore rank tracking snapshots
  await restoreYesterdaySnapshots(userId, tournamentId)
}
```

## Success Metrics

- ✅ Users can update awards without losing other data
- ✅ All materialized fields preserved (story-147 compatibility)
- ✅ All tests pass with 80%+ coverage
- ✅ 0 new SonarCloud issues
- ✅ Manual testing confirms correct behavior
- ✅ Vercel Preview deployment works correctly
- ✅ Bug does not recur after deployment

## Timeline Estimate

- Rollback incorrect fix: 15 minutes
- Implement correct fix: 15 minutes
- Create test file and write tests: 2 hours
- Manual testing: 30 minutes
- Code review & validation: 30 minutes
- **Total: ~3.5 hours**

## Dependencies

### Story-147 Relationship

**Story-147:** [PERF] Materialize Score Calculations to Reduce Compute & DB Load (#147)

**Merged:** Feb 15, 2026 (TODAY)

**Impact on this bug:**
- Story-147 added ~20 materialized fields to tournament_guesses table
- These fields are now being wiped out by the delete+create bug
- **This bug became CRITICAL after story-147 merged**
- Before story-147: Bug only lost score fields (less noticeable)
- After story-147: Bug loses ALL materialized data (catastrophic)

**Conclusion:**
- ✅ No code conflicts with story-147
- ✅ This fix makes story-147 materialization actually work for users
- ✅ Critical urgency - fix must be deployed ASAP

## References

- Issue: #164
- Related commit history:
  - a2620456 (2024-05-29): Bug introduced in initial refactor
  - 28816627 (2024-05-31): Attempted fix that didn't fix the bug
  - c72e1a5 (2026-02-15): Story-147 merged, making bug critical
- Related files:
  - `app/db/tournament-guess-repository.ts` (main fix - lines 122-128)
  - `app/actions/guesses-actions.ts` (calls the buggy function)
  - `app/components/awards/award-panel.tsx` (UI component that triggers bug)
  - `app/tournaments/[id]/awards/page.tsx` (page that renders component)
