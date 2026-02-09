# Implementation Plan: Scoring System for Qualified Teams Predictions

**Story:** #100
**Title:** [STORY] Scoring System for Qualified Teams Predictions
**Effort:** High (5-10 days)

## Context

Story #90 implemented a new visual qualification prediction interface with a JSONB-based table (`tournament_user_group_positions_predictions`) for storing user predictions. However, the scoring system was not implemented. This story implements the scoring calculation logic that compares user predictions against actual tournament results and awards points accordingly.

## Current State Analysis

### What Exists (from Story #90)
- ✅ JSONB-based predictions table: `tournament_user_group_positions_predictions`
- ✅ Repository: `app/db/qualified-teams-repository.ts` with CRUD operations
- ✅ Actions: `app/actions/qualification-actions.ts` for saving predictions
- ✅ UI: Drag-and-drop interface for making predictions
- ✅ Tournament config columns: `allows_third_place_qualification`, `max_third_place_qualifiers`

### What Exists (Legacy System)
- ✅ Old scoring functions: `calculateAndStoreGroupPositionScores()`, `calculateAndStoreQualifiedTeamsPoints()`
- ✅ Old predictions table: `tournament_group_team_stats_guess` (to be removed in #91)
- ✅ Score columns in `tournament_guesses`: `qualified_teams_score`, `group_position_score`
- ✅ Dashboard displays for scores in 3 components

### Gap Analysis
- ❌ NEW scoring functions don't exist for NEW predictions table
- ❌ No automated scoring calculation (all manual backoffice triggers)
- ❌ No clear scoring rules documentation for new system
- ❌ Old scoring functions read from OLD table, not NEW JSONB table
- ❌ No backoffice UI for triggering new qualified teams scoring

## Objectives

1. **Define clear scoring rules** for the new qualified teams prediction system
2. **Implement scoring calculation** that reads from JSONB predictions table
3. **Create server actions** for calculating and storing scores
4. **Add backoffice UI** for triggering score calculations
5. **Ensure dashboard integration** displays scores correctly
6. **Write comprehensive tests** covering all scoring scenarios

## Scoring Rules Definition

### Rule 1: Direct Qualifier Points (Positions 1-2)
- **Condition:** User predicts team at position 1 or 2, AND team actually qualifies
- **Points:** `tournament.qualified_team_points` (default: 1 point)
- **Example:** User predicts Argentina at position 1 in Group A, Argentina qualifies → +1 point

### Rule 2: Exact Position Bonus (Positions 1-2)
- **Condition:** Team qualifies AND predicted position matches actual position exactly
- **Points:** `tournament.exact_position_qualified_points` (default: 1 point) **IN ADDITION** to Rule 1
- **Example:** User predicts Argentina at position 1, Argentina finishes position 1 → +2 points total (1 for qualifying + 1 for exact position)

### Rule 3: Third Place Qualifier Points
- **Condition:** User predicts team at position 3 with `predicted_to_qualify = true`, AND team actually qualifies as third place
- **Points:** `tournament.qualified_team_points` (default: 1 point)
- **Example:** User predicts Morocco at position 3 with qualify flag, Morocco qualifies as one of 8 best third-place teams → +1 point

### Rule 4: Non-Qualifier Teams
- **Condition:** Team does NOT qualify to playoffs
- **Points:** 0 points (regardless of position accuracy)
- **Rationale:** Only reward predictions that matter for tournament progression

### Rule 5: Wrong Position Qualifier
- **Condition:** Team qualifies, but predicted position is wrong (e.g., predicted position 2, finished position 1)
- **Points:** `tournament.qualified_team_points` only (default: 1 point)
- **No bonus:** Exact position bonus NOT awarded

### Scoring Summary Table

| Scenario | Points | Example |
|----------|--------|---------|
| Predicted pos 1, actual pos 1 (qualified) | 2 | 1 (qualified) + 1 (exact) |
| Predicted pos 1, actual pos 2 (qualified) | 1 | 1 (qualified), no bonus |
| Predicted pos 1, actual pos 3 (not qualified) | 0 | Team didn't qualify |
| Predicted pos 3 (qualify=true), actual pos 3 qualified | 2 | 1 (qualified) + 1 (exact) |
| Predicted pos 3 (qualify=true), actual pos 3 NOT qualified | 0 | Team didn't qualify |
| Predicted pos 3 (qualify=false), any actual | 0 | User didn't predict qualification |

## Data Model Reference

### JSONB Predictions Schema

**Table:** `tournament_user_group_positions_predictions`

```sql
CREATE TABLE tournament_user_group_positions_predictions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  tournament_id UUID NOT NULL,
  group_id UUID NOT NULL,
  team_predicted_positions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, tournament_id, group_id)
);
```

**JSONB Array Structure** (`team_predicted_positions`):
```typescript
interface TeamPositionPrediction {
  team_id: string;           // UUID of the team
  predicted_position: number; // Position in group (1, 2, 3, 4...)
  predicted_to_qualify: boolean; // Did user predict this team will qualify?
}

// Example JSONB value:
[
  {"team_id": "uuid-1", "predicted_position": 1, "predicted_to_qualify": true},
  {"team_id": "uuid-2", "predicted_position": 2, "predicted_to_qualify": true},
  {"team_id": "uuid-3", "predicted_position": 3, "predicted_to_qualify": true},
  {"team_id": "uuid-4", "predicted_position": 4, "predicted_to_qualify": false}
]
```

### Qualified Teams Determination

**Query Logic:** Teams that participate in playoff games (first round or later)

```sql
-- Teams that actually qualified to playoffs
SELECT DISTINCT teams.*
FROM teams
WHERE EXISTS (
  SELECT 1 FROM games
  WHERE games.game_type = 'first_round'  -- Playoff bracket games
    AND games.tournament_id = :tournamentId
    AND (teams.id = games.home_team OR teams.id = games.away_team)
)
```

**Rationale:** If a team appears in any playoff game, they qualified from group stage.

**Third Place Qualifier Logic:**
- For tournaments like FIFA 2026: 8 best 3rd place teams qualify
- Determination: Check if position-3 team exists in playoff bracket
- If team with position=3 is in playoff games → They qualified as 3rd place
- If NOT in playoff games → They did NOT qualify

### Authorization Pattern

**Existing pattern** (from `backoffice-actions.ts`):
```typescript
import { getLoggedInUser } from '../db/user-repository';

const user = await getLoggedInUser();
if (!user) {
  return { success: false, message: 'Unauthorized' };
}
// Optionally check user role/permissions here
```

**For scoring actions:** Use same pattern, add admin role check if needed.

## Technical Approach

### Phase 1: Create Scoring Calculation Function

**New utility:** `app/utils/qualified-teams-scoring.ts`

```typescript
interface QualifiedTeamsScoringResult {
  userId: string;
  tournamentId: string;
  totalScore: number;
  breakdown: {
    groupId: string;
    groupName: string;
    teams: Array<{
      teamId: string;
      teamName: string;
      predictedPosition: number;
      actualPosition: number;
      predictedToQualify: boolean;
      actuallyQualified: boolean;
      pointsAwarded: number;
      reason: string; // e.g., "qualified + exact position"
    }>;
  }[];
}

export async function calculateQualifiedTeamsScore(
  userId: string,
  tournamentId: string
): Promise<QualifiedTeamsScoringResult>
```

**Algorithm:**
1. **Fetch tournament config:** `qualified_team_points`, `exact_position_qualified_points` from `tournaments` table
2. **Fetch user's JSONB predictions:** Query `tournament_user_group_positions_predictions` table, parse JSONB array
3. **Fetch actual group standings:** Query `tournament_group_team_stats` table for final positions (`position`, `is_complete`)
4. **Validate groups complete:** Check ALL groups have `is_complete = true`. If ANY incomplete → **FAIL FAST** (error out)
5. **Fetch qualified teams:** Query teams in playoff bracket (game_type = 'first_round') to get Set of qualified team IDs
6. **For each group, for each team in user's predictions:**
   - Find team's actual position in `tournament_group_team_stats`
   - Check if team ID is in qualified teams Set
   - If NOT qualified → Award 0 points
   - If qualified:
     - Award `qualified_team_points` (base, default 1)
     - If `predicted_position === actual_position` → Add `exact_position_qualified_points` (bonus, default 1)
7. **Sum all points** across all groups
8. **Return detailed breakdown** for debugging/display

### Phase 2: Create Server Action

**New action:** `app/actions/qualified-teams-scoring-actions.ts`

```typescript
// Calculate scores for ALL users in a tournament
export async function calculateAndStoreQualifiedTeamsScores(
  tournamentId: string
): Promise<{ success: boolean; usersProcessed: number; errors: string[] }>

// Calculate score for SINGLE user (useful for testing)
export async function calculateUserQualifiedTeamsScore(
  userId: string,
  tournamentId: string
): Promise<{ success: boolean; score: number; breakdown: any }>

// Admin-only trigger
export async function triggerQualifiedTeamsScoringAction(
  tournamentId: string
): Promise<{ success: boolean; message: string }>
```

**Implementation:**
1. **Authorization:** Call `getLoggedInUser()`, verify user is logged in (admin check optional for v1)
2. **Validate tournament:** Check tournament exists and groups are complete (fail if ANY incomplete)
3. **Get all users:** Query users who made predictions for this tournament
4. **Clear previous scores:** Set `tournament_guesses.qualified_teams_score = 0` for all users in tournament (ensures clean slate)
5. **For each user:**
   - Call `calculateQualifiedTeamsScore(userId, tournamentId)`
   - **Use transaction:** Update `tournament_guesses.qualified_teams_score` atomically
   - Store result in `tournament_guesses.qualified_teams_score`
6. **Error handling:** Catch errors per user, log, continue processing other users
7. **Return summary:** Users processed, errors encountered, total score sum for validation

**Data Integrity:**
- **Overwrite behavior:** Explicitly clear all scores before recalculating (idempotent)
- **Transaction support:** Each user update wrapped in transaction
- **Idempotency:** Running twice produces same result (deterministic calculation)

**Batch Processing (Future Enhancement):**
- For v1: Process all users sequentially (acceptable for <500 users)
- Future: Chunk users in batches of 100, add progress tracking
- Deferred to maintain simplicity for initial release

### Phase 3: Update Database Schema (If Needed)

**Current columns in `tournament_guesses`:**
- ✅ `qualified_teams_score` - Already exists
- ✅ `group_position_score` - Already exists

**Evaluation:** Existing columns are sufficient. The new scoring system will:
- Use `qualified_teams_score` for the combined score (qualified teams + position bonuses)
- Keep `group_position_score` for backward compatibility (may be deprecated in #91)

**Alternative approach (if separation desired):**
- Add `qualification_prediction_score` as NEW column
- Keep `qualified_teams_score` as legacy
- Dashboard shows both during transition

**Decision:** Reuse `qualified_teams_score` column to avoid confusion.

### Phase 4: Backoffice UI Integration

**Update:** `app/components/backoffice/tournament-backoffice-tab.tsx`

Add new button in the scoring section:
```tsx
<Button
  variant="outlined"
  onClick={async () => {
    setIsLoading(true);
    const result = await triggerQualifiedTeamsScoringAction(tournament.id);
    setIsLoading(false);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error('Error calculating scores');
    }
  }}
  disabled={isLoading}
>
  Calculate Qualified Teams Scores
</Button>
```

**Placement:** After existing "Calculate Group Position Scores" button

### Phase 5: Dashboard Integration Verification

**No changes needed** - Dashboards already display `qualified_teams_score`:
- ✅ Performance Overview Card (stats page)
- ✅ Friend Group Leaderboard
- ✅ User Tournament Statistics Card

**Testing needed:** Ensure scores update correctly after calculation.

### Phase 6: Background Job Automation (Optional Future Enhancement)

**Current approach:** Manual backoffice trigger (same as existing scoring)

**Future enhancement (out of scope for this story):**
- Auto-trigger when last group game is completed
- Auto-trigger when playoff bracket is generated
- Webhook/event-driven architecture

**Rationale for deferring:** Existing scoring functions are all manual. Consistency with current system is more important than automation for v1.

## Files to Create

### New Files
1. **`app/utils/qualified-teams-scoring.ts`** - Core scoring calculation logic
2. **`app/actions/qualified-teams-scoring-actions.ts`** - Server actions
3. **`__tests__/utils/qualified-teams-scoring.test.ts`** - Unit tests for scoring logic
4. **`__tests__/actions/qualified-teams-scoring-actions.test.ts`** - Integration tests

### Files to Modify
1. **`app/components/backoffice/tournament-backoffice-tab.tsx`** - Add scoring trigger button
2. **`app/db/qualified-teams-repository.ts`** - Add helper functions if needed
3. **`app/db/tournament-guess-repository.ts`** - Ensure update functions work correctly

## Implementation Steps

### Step 1: Define Scoring Rules (Documentation)
**Duration:** 0.5 days
- Document scoring rules in detail (this plan)
- Get user approval on scoring logic
- Confirm which column to use (`qualified_teams_score` vs new column)

### Step 2: Implement Core Scoring Logic
**Duration:** 1.5 days
- Create `qualified-teams-scoring.ts` utility
- Implement `calculateQualifiedTeamsScore()` function
- Handle all edge cases:
  - Groups not complete
  - No predictions for user
  - Teams without final positions
  - Third place qualifier logic

### Step 3: Create Server Actions
**Duration:** 1 day
- Create `qualified-teams-scoring-actions.ts`
- Implement batch scoring for all users
- Implement single user scoring
- Add admin-only authorization checks
- Error handling and logging

### Step 4: Add Backoffice UI
**Duration:** 0.5 days
- Add "Calculate Qualified Teams Scores" button
- Add loading states and error handling
- Add success/error toast messages
- Test button functionality

### Step 5: Write Unit Tests
**Duration:** 1.5 days
- Test scoring calculation with various scenarios:
  - All correct predictions
  - All wrong predictions
  - Mix of correct/wrong
  - Third place qualifiers
  - Non-qualifiers
  - Edge cases (empty predictions, incomplete groups)
- Test server actions
- Mock database queries

### Step 6: Integration Testing
**Duration:** 1 day
- Test full flow: predictions → scoring → dashboard display
- Test with real tournament data
- Test backoffice trigger
- Verify scores update correctly in all dashboard components

### Step 7: Documentation & Code Review
**Duration:** 0.5 days
- Add JSDoc comments to functions
- Update CLAUDE.md if needed
- Document scoring rules for users (help page?)
- Code review and refinements

## Testing Strategy

### Unit Tests

**Test file:** `__tests__/utils/qualified-teams-scoring.test.ts`

Test cases:
1. **Perfect predictions:** All positions correct, all teams qualify → Max points
2. **All wrong:** Wrong positions, wrong qualifiers → 0 points
3. **Qualified but wrong position:** Team qualifies but position wrong → Base points only
4. **Third place scenarios (FIFA 2026 example: 8 best 3rd place out of 12 groups):**
   - **Scenario 4a:** User predicts Group A position 3 with `qualify=true`, team IS one of 8 best → Award 2 points (1 qualified + 1 exact)
   - **Scenario 4b:** User predicts Group B position 3 with `qualify=true`, team is NOT one of 8 best (ranked 9th best) → 0 points (didn't qualify)
   - **Scenario 4c:** User predicts Group C position 3 with `qualify=false`, team IS one of 8 best → 0 points (user didn't predict qualification)
   - **Scenario 4d:** User predicts Group D position 3 with `qualify=false`, team is NOT one of 8 best → 0 points (correct prediction, but no points for non-qualifiers)
   - **Test data:** Create 12 groups, rank position-3 teams, mark top 8 as qualified in playoff bracket
5. **Non-qualifiers:** Teams that don't qualify → 0 points regardless
6. **Edge cases:**
   - Empty predictions → 0 points
   - Incomplete groups → Skip group or error?
   - Missing actual positions → Error handling
7. **Scoring config variations:**
   - Different point values (2 per qualifier, 3 for exact)
   - Zero points configuration

### Integration Tests

**Test file:** `__tests__/actions/qualified-teams-scoring-actions.test.ts`

Test cases:
1. **Batch scoring:** Calculate for all users, verify all updated
2. **Single user scoring:** Calculate for one user, verify correct
3. **Error handling:**
   - Tournament doesn't exist
   - Groups incomplete
   - Database errors
4. **Authorization:** Non-admin cannot trigger
5. **Idempotency:** Running twice produces same result

### Manual Testing Checklist

- [ ] Create test tournament with 2 groups
- [ ] Make predictions as test user
- [ ] Set final group positions
- [ ] Mark teams as qualified
- [ ] Trigger scoring from backoffice
- [ ] Verify score in `tournament_guesses` table
- [ ] Check score displays correctly in all 3 dashboard components
- [ ] Test with different scoring configs
- [ ] Test with third place qualifiers
- [ ] Test with 0 predictions (edge case)

## Acceptance Criteria Verification

### ✅ AC1: Scoring rules are clearly documented
- Documented in this plan
- Will add to user-facing help page (optional)
- JSDoc comments in code

### ✅ AC2: Scores calculate correctly when results are finalized
- Scoring function reads actual results
- Compares against user predictions
- Awards points per defined rules
- Stores in database

### ✅ AC3: Users can see their qualified teams scores in dashboard
- Existing dashboard components already display `qualified_teams_score`
- No UI changes needed
- Verified in 3 locations

### ✅ AC4: Admins can configure scoring rules in backoffice
- Uses existing tournament config columns:
  - `qualified_team_points`
  - `exact_position_qualified_points`
- Already editable in tournament scoring config tab
- No new config needed

## Potential Risks & Mitigations

### Risk 1: Performance with large user base
**Impact:** Calculating scores for 1000+ users could be slow
**Mitigation:**
- Batch process in chunks of 100 users
- Add progress indicator in backoffice
- Consider background job for very large tournaments

### Risk 2: Data integrity (race conditions)
**Impact:** Concurrent score calculations could conflict
**Mitigation:**
- Add transaction support for score updates
- Use database locks if needed
- Idempotent operations (same input = same output)

### Risk 3: Incomplete group data
**Impact:** Scoring fails if groups not finalized
**Mitigation:**
- Validate all groups complete before scoring
- Show clear error message in backoffice
- Skip incomplete groups with warning

### Risk 4: Confusion between old and new scoring
**Impact:** Users see two different scores during transition
**Mitigation:**
- Reuse same column name
- Deprecate old scoring in #91
- Clear communication in release notes

## Quality Gates

### SonarCloud Requirements
- **Coverage:** ≥80% on new code
  - **What counts:** New functions/methods in `utils/` and `actions/` directories
  - **What doesn't count:** Test files (`__tests__/`), type definitions, interfaces
  - **Measurement:** Lines covered by unit/integration tests
- **Duplicated code:** <5%
- **Security rating:** A
- **Maintainability:** B or higher

### Code Quality
- All functions have JSDoc comments
- Type safety: No `any` types
- Error handling: All errors caught and logged
- Consistent with existing patterns

## Dependencies

- ✅ Story #90 (Qualified teams UI) - COMPLETED
- ⚠️ Story #91 (Cleanup old system) - BLOCKED by this story (but not blocking this)

## Resolved Design Decisions

1. **Column choice:** ✅ **DECISION:** Reuse existing `qualified_teams_score` column
   - Rationale: Avoid confusion during transition, single source of truth
   - Old scoring will be deprecated in story #91

2. **Background automation:** ✅ **DECISION:** Manual backoffice trigger for v1
   - Rationale: Consistent with existing scoring system, simpler implementation
   - Future enhancement: Auto-trigger when groups complete

3. **Third place handling:** ✅ **DECISION:** Check playoff bracket participation
   - Implementation: Query `games` table where `game_type = 'first_round'`
   - If position-3 team is in playoff games → They qualified

4. **Incomplete groups:** ✅ **DECISION:** Fail fast if ANY group incomplete
   - Rationale: Simpler logic, prevents partial/confusing scores
   - Error message: "Cannot calculate scores: Groups A, B not complete"
   - Future: Could add option to score only complete groups

5. **Data integrity:** ✅ **DECISION:** Clear all scores before recalculating
   - Implementation: Set `qualified_teams_score = 0` for all users before processing
   - Ensures idempotent behavior (same input → same output)

6. **Batch processing:** ✅ **DECISION:** Deferred to future enhancement
   - v1: Sequential processing (acceptable for <500 users)
   - Future: Chunked processing with progress tracking

7. **Authorization:** ✅ **DECISION:** Use `getLoggedInUser()` pattern
   - Same pattern as existing backoffice actions
   - Admin role check optional for v1 (all logged-in users can trigger from backoffice UI)

## Timeline Estimate

| Phase | Duration | Description |
|-------|----------|-------------|
| Planning & Review | 0.5 days | This plan document |
| Core Scoring Logic | 1.5 days | Calculation algorithm |
| Server Actions | 1 day | Batch processing, authorization |
| Backoffice UI | 0.5 days | Trigger button |
| Unit Tests | 1.5 days | Comprehensive test coverage |
| Integration Tests | 1 day | End-to-end testing |
| Documentation | 0.5 days | Comments, docs, review |
| **Total** | **6.5 days** | Within "high effort" range |

## Success Metrics

- ✅ All unit tests pass (≥80% coverage)
- ✅ Integration tests pass
- ✅ SonarCloud quality gates pass
- ✅ Scores calculate correctly for test data
- ✅ Dashboard displays scores correctly
- ✅ Backoffice trigger works without errors
- ✅ User approval on scoring rules

## Next Steps After Implementation

1. Deploy to staging
2. Run scoring on test tournament data
3. Verify scores match expected results
4. User acceptance testing
5. Deploy to production
6. Monitor for errors
7. Consider future enhancements (background automation, webhooks)
