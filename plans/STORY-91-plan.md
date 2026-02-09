# Implementation Plan: Story #91 - Remove Old Group Prediction Table and Migrate to New Qualification System

## Story Context

**Issue:** #91 - [TECH] Remove old group prediction table and migrate to new qualification system
**Type:** Technical cleanup/debt reduction
**Effort:** Medium (5-8 story points)
**Status:** In Progress

### Background

This is a follow-up to story #90 (Visual Qualification Prediction Interface), which implemented a new decoupled qualification prediction system with:
- `tournament_qualified_teams_predictions` table - individual prediction rows
- `tournament_user_group_positions_predictions` table - JSONB atomic batch updates
- Explicit `predicted_to_qualify` flag and flexible position constraints
- New scoring logic: 1 point for correct qualification, +1 bonus for exact position match
- `qualification_score` column in `tournament_guesses` table

The old system (`tournament_group_team_stats_guess`) was confusing, coupled to game scores, and has been superseded. This story removes it entirely.

## Objectives

1. **Remove all code references** to `tournament_group_team_stats_guess` table
2. **Delete the old repository** and all associated functions
3. **Remove old scoring logic** (`calculateAndStoreGroupPositionScores()`)
4. **Archive the database table** (keep 30 days for rollback safety)
5. **Ensure no regressions** - all existing functionality works with new system

**Out of Scope:**
- Data migration script (no data to migrate - old and new systems track different things)
- UI changes (new UI already implemented in #90)
- Scoring display updates (already show `qualification_score` from #90)

## Acceptance Criteria

- [ ] Zero references to old table `tournament_group_team_stats_guess` in codebase (grep: 0 matches)
- [ ] Zero references to old types `TournamentGroupTeamStatsGuess*` except in legacy display code (see note below)
- [ ] Zero references to old scoring function `calculateAndStoreGroupPositionScores` (grep: 0 matches)
- [ ] Repository file `tournament-group-team-guess-repository.ts` deleted
- [ ] Old table archived (renamed to `*_archived`, kept for 30 days)
- [ ] All tests pass (unit, integration)
- [ ] TypeScript compilation succeeds (npm run build)
- [ ] No performance regressions (baseline: leaderboard load < 500ms)
- [ ] SonarCloud: 0 new issues, 80% coverage on new code
- [ ] Historical tournaments display old scores with "Legacy" indicator (read-only, < 150ms additional latency)

**Note on Legacy Display Code:**
- Allowed references: `group_position_score` column reads in UI components for DISPLAY ONLY
- Not allowed: Writes, calculations, or updates to `group_position_score`
- Verification: Grep should find ~2-3 references in display components only (leaderboard, user stats)

## Technical Approach

### Why No Data Migration Needed

The old and new systems track fundamentally different things:
- **Old system:** Predicted final group standings (positions 1-4 for all teams)
- **New system:** Qualification predictions (positions + explicit checkbox for 3rd place)

**Key differences:**
1. Old: Implicit qualification from position
2. New: Explicit `predicted_to_qualify` flag
3. Old: Coupled to game score predictions
4. New: Completely decoupled

**Decision:** Don't migrate old predictions. Reasons:
- Different data models (can't map 1:1)
- New system has been live since #90 - users already made fresh predictions
- Old predictions are historical data, not current state
- Risk of corrupting clean new data with stale old predictions

**Approach:** Archive old table, keep for 30 days for reference, then drop.

### Implementation Strategy

#### Phase 1: Code Removal (Safe, No Database Changes)
Remove all TypeScript/React code first while keeping database table intact (safety net).

#### Phase 2: Database Archive (After Code Verified Clean)
Rename table to `*_archived` after confirming no code references remain.

#### Phase 3: Validation (30-Day Period)
Monitor for issues. If problems arise, old table is still available for rollback.

#### Phase 4: Final Cleanup (After 30 Days)
Drop archived table if no issues reported.

**This story covers Phases 1-2 only.** Phase 3 is monitoring, Phase 4 will be a separate follow-up task.

### Historical Data Handling

**Problem:** Old tournaments have `group_position_score` values in `tournament_guesses` table, but we're removing the calculation function.

**Solution:** Keep the database column, display historical scores as read-only legacy data with clear visual indicators.

**Cutover Date:** Use deployment timestamp of this cleanup (2026-02-09) to determine legacy vs. current tournaments.

**Implementation:**

1. **DO NOT drop `group_position_score` column** from `tournament_guesses` table

2. **UI Display Logic (2-3 allowed code references for READ ONLY):**
   ```typescript
   // Example: LeaderboardCard.tsx, UserStatsPage.tsx
   const CLEANUP_DEPLOYMENT_DATE = new Date('2026-02-09T00:00:00Z');
   const isLegacyTournament = tournament.created_at < CLEANUP_DEPLOYMENT_DATE;

   if (isLegacyTournament && tournamentGuess.group_position_score > 0) {
     // Display with legacy indicator
   } else {
     // Display only qualification_score
   }
   ```

3. **Visual Styling for Legacy Scores:**
   - **Badge:** Gray badge with "Legacy" text next to score
   - **Tooltip:** "Score calculated using old group position prediction system (deprecated Feb 2026)"
   - **Styling:** Slightly muted color (gray-600 instead of primary color)
   - **Icon:** Small info icon (ℹ️) that shows tooltip on hover

4. **Display Format Examples:**

   **Old Tournament (created before 2026-02-09):**
   ```
   Group Stage Points: 45 pts
   ├─ Games: 30 pts
   ├─ Boosts: 5 pts
   ├─ Qualified Teams: 8 pts
   └─ Group Positions (Legacy) ℹ️: 2 pts

   [Tooltip on hover: "Score calculated using old group position prediction system (deprecated Feb 2026)"]
   ```

   **New Tournament (created after 2026-02-09):**
   ```
   Group Stage Points: 43 pts
   ├─ Games: 30 pts
   ├─ Boosts: 5 pts
   └─ Qualified Teams: 8 pts
   ```

5. **Database Verification Query:**
   ```sql
   -- Check which tournaments have legacy scores
   SELECT
     t.id AS tournament_id,
     t.name AS tournament_name,
     t.created_at,
     COUNT(tg.id) AS total_predictions,
     COUNT(CASE WHEN tg.group_position_score > 0 THEN 1 END) AS with_legacy_score,
     AVG(CASE WHEN tg.group_position_score > 0 THEN tg.group_position_score END) AS avg_legacy_score
   FROM tournaments t
   LEFT JOIN tournament_guesses tg ON t.id = tg.tournament_id
   WHERE t.created_at < '2026-02-09'
   GROUP BY t.id, t.name, t.created_at
   ORDER BY t.created_at DESC;
   ```

**Rationale:**
- Preserves historical tournament integrity (no data loss)
- Users can see their past scores with clear context
- Visual distinction prevents confusion between legacy and current scoring
- Specific cutover date ensures deterministic behavior
- Performance acceptable (< 150ms additional latency for legacy tournaments)

**Code References Allowed:**
- Display components that READ `group_position_score` for legacy tournaments (2-3 files max)
- NO writes, calculations, or updates to this column
- Verification grep should find these specific read-only references

## Files to Modify/Delete

### DELETE (9 files)

1. **`app/db/tournament-group-team-guess-repository.ts`** - Entire repository file
2. **`__tests__/db/test-factories.ts`** - Remove `tournamentGroupTeamStatsGuess()` factory (lines 317+)
3. **`__tests__/actions/guesses-actions.test.ts`** - Remove tests for old action (lines 238-249)
4. **`migrations/20260113000001_add_conduct_score_to_team_stats.sql`** - Delete (only relevant to old table)

### MODIFY - Remove Imports/References (12 files)

5. **`app/db/tables-definition.ts`** - Remove `TournamentGroupTeamStatsGuessTable` interface (lines 144-152)
6. **`app/db/database.ts`** - Remove table from Kysely schema (line 37)
7. **`app/actions/guesses-actions.ts`** - Remove `updateOrCreateTournamentGroupTeamGuesses()` and imports (lines 4, 8-10, 48-50)
8. **`app/actions/backoffice-actions.ts`** - Remove:
   - `calculateAllUsersGroupPositions()` function (lines 375-435)
   - `calculateAndStoreGroupPositionScores()` function (lines 854-911)
   - Old table imports and cleanup calls (lines 72, 81, 121)
9. **`app/tournaments/[id]/groups/[group_id]/page.tsx`** - Remove old table query (lines 6, 50-68)
10. **`app/components/context-providers/guesses-context-provider.tsx`** - Remove old prediction saves (lines 7, 12, 21, 35, 48, 66-80)
11. **`app/db/tournament-prediction-completion-repository.ts`** - Remove old table query (lines 66-80)
12. **`__tests__/actions/backoffice-actions.test.ts`** - Remove old scoring tests (lines 18, 1313-1426)
13. **`__tests__/components/guesses-context-provider.test.tsx`** - Remove old type mocks (lines 6, 88)
14. **`__tests__/components/backoffice/tournament-backoffice-tab.test.tsx`** - Remove old mock (line 32)
15. **`__tests__/utils/test-utils.tsx`** - Remove `guessedPositions` from interface (lines 6, 30)
16. **`docs/claude/architecture.md`** - Remove old table reference (line 234)

### KEEP (No Changes)

17. **`app/utils/group-position-calculator.ts`** - KEEP entire file (generic utility used for actual standings calculations, not just predictions)
18. **`app/components/backoffice/group-backoffice-tab.tsx`** - KEEP (uses calculator utility for actual standings)
19. **`app/definitions.ts`** - KEEP `groupPositionScore` field comment (historical reference, doesn't hurt)

### NEW FILES - Database Migration

20. **`migrations/20260209000000_archive_old_group_predictions_table.sql`** - New migration to rename table

## Pre-Implementation Verification

**Before starting any code changes, verify dependencies are met:**

### Dependency Checklist

```bash
# 1. Verify story #90 is deployed and working
gh pr list --search "is:merged 90" --json number,title,mergedAt
# Should show #90 merged and deployed

# 2. Check new qualification system tables exist
psql $DATABASE_URL -c "\dt tournament_qualified_teams_predictions"
psql $DATABASE_URL -c "\dt tournament_user_group_positions_predictions"
# Both tables should exist

# 3. Find all references to old table (baseline before cleanup)
echo "=== Code References ==="
grep -r "tournament_group_team_stats_guess" --include="*.ts" --include="*.tsx" app/ __tests__/ | wc -l
grep -r "TournamentGroupTeamStatsGuess" --include="*.ts" --include="*.tsx" app/ __tests__/ | wc -l
grep -r "calculateAndStoreGroupPositionScores" --include="*.ts" --include="*.tsx" app/ __tests__/ | wc -l

echo "=== Migration References ==="
grep -r "tournament_group_team_stats_guess" migrations/ | wc -l

echo "=== Script References ==="
grep -r "tournament_group_team_stats_guess" scripts/ 2>/dev/null | wc -l || echo "0"

# Document these counts - we'll verify they're all zero after cleanup
```

**Expected findings (from codebase analysis):**
- ~20-25 code references
- ~3-5 migration references
- ~0 script references

**If any unexpected references found:** Investigate before proceeding with cleanup.

### Soft Dependency Verification

**Check for background jobs, external integrations, and database dependencies:**

```bash
echo "=== Checking Soft Dependencies ==="

# 1. Background jobs/queues
echo "Background jobs referencing old scoring:"
grep -r "group_position_score" app/jobs app/queues app/workers 2>/dev/null | wc -l || echo "0 (no jobs directory)"

# 2. External integrations/exports
echo "External integrations referencing old scoring:"
grep -r "group_position_score" app/integrations app/exports app/api/external 2>/dev/null | wc -l || echo "0 (no integrations directory)"

# 3. Database views
echo "Database views depending on old columns:"
psql $DATABASE_URL -c "
  SELECT table_name, view_definition
  FROM information_schema.views
  WHERE view_definition LIKE '%group_position_score%'
     OR view_definition LIKE '%tournament_group_team_stats_guess%';" || echo "Unable to check views"

# 4. Materialized views
echo "Materialized views depending on old columns:"
psql $DATABASE_URL -c "
  SELECT matviewname, definition
  FROM pg_matviews
  WHERE definition LIKE '%group_position_score%'
     OR definition LIKE '%tournament_group_team_stats_guess%';" || echo "Unable to check matviews"

# 5. Database triggers
echo "Triggers depending on old table:"
psql $DATABASE_URL -c "
  SELECT trigger_name, event_object_table, action_statement
  FROM information_schema.triggers
  WHERE event_object_table = 'tournament_group_team_stats_guess';" || echo "Unable to check triggers"

# 6. Analytics/reporting queries (if stored procedures exist)
echo "Stored procedures referencing old scoring:"
psql $DATABASE_URL -c "
  SELECT routine_name, routine_definition
  FROM information_schema.routines
  WHERE routine_definition LIKE '%group_position_score%'
     OR routine_definition LIKE '%tournament_group_team_stats_guess%';" || echo "Unable to check routines"
```

**Expected result:** All queries should return 0 rows or "0 references"

**If soft dependencies found:**
- Document each dependency
- Determine if it should be updated or removed
- Add to implementation steps
- Do NOT proceed with cleanup until plan for each dependency is clear

## Implementation Steps

### Step 0: Verify group-position-calculator.ts Usage

**Before assuming it can be kept, verify it's not only used by old system:**

```bash
# Find all imports of group-position-calculator
grep -r "group-position-calculator" --include="*.ts" --include="*.tsx" app/ __tests__/

# Review each usage - is it for:
# - Actual standings calculation? (KEEP)
# - Old prediction system? (REMOVE)
```

**Expected result:** Calculator is used by both old and new systems for actual standings. Decision: KEEP the utility.

### Step 1: Remove Repository and Functions

**1.1 Delete repository file:**
```bash
rm app/db/tournament-group-team-guess-repository.ts
```

**1.2 Remove table definition from `app/db/tables-definition.ts`:**
- Delete `TournamentGroupTeamStatsGuessTable` interface (lines 144-152)
- Delete type exports: `TournamentGroupTeamStatsGuess`, `TournamentGroupTeamStatsGuessNew`, `TournamentGroupTeamStatsGuessUpdate`

**1.3 Remove table from Kysely schema in `app/db/database.ts`:**
- Delete line 37: `tournament_group_team_stats_guess: TournamentGroupTeamStatsGuessTable`

**1.4 Delete old migration:**
```bash
rm migrations/20260113000001_add_conduct_score_to_team_stats.sql
```

### Step 2: Remove Server Actions

**2.1 Update `app/actions/guesses-actions.ts`:**
- Remove import: `TournamentGroupTeamStatsGuessNew` (line 4)
- Remove imports: `findAllTournamentGroupTeamGuessInGroup`, `upsertTournamentGroupTeamGuesses` (lines 8-10)
- Delete function: `updateOrCreateTournamentGroupTeamGuesses()` (lines 48-50)

**2.2 Update `app/actions/backoffice-actions.ts`:**
- Remove imports related to old repository (line 72)
- Remove import: `updateOrCreateTournamentGroupTeamGuesses` (line 81)
- Remove cleanup call on line 121
- Delete function: `calculateAllUsersGroupPositions()` (lines 375-435)
- Delete function: `calculateAndStoreGroupPositionScores()` (lines 854-911)

**2.3 Update `app/components/backoffice/tournament-backoffice-tab.tsx`:**
- Remove button handlers that called old scoring functions:
  - `calculateGroupPositionForPlayers()` (lines 39-44)
  - `calculateGroupPositionScores()` (lines 67-72)
- Remove UI buttons on lines 174, 218

### Step 3: Remove Component References

**3.1 Update `app/tournaments/[id]/groups/[group_id]/page.tsx`:**
- Remove import: `TournamentGroupTeamStatsGuess` (line 6)
- Remove old table query (lines 50-68):
  - Delete `findAllTournamentGroupTeamGuessInGroup()` call
  - Delete fallback calculation logic
- Keep the group page functional with actual standings display

**3.2 Update `app/components/context-providers/guesses-context-provider.tsx`:**
- Remove import: `TournamentGroupTeamStatsGuessNew` (lines 7, 21, 35, 48)
- Remove `updateOrCreateTournamentGroupTeamGuesses()` calls (lines 12, 80)
- Remove group position calculation and save logic (lines 66-77)
- Context provider should only handle game score predictions now

**3.3 Update `app/db/tournament-prediction-completion-repository.ts`:**
- Remove old table query from lines 66-80
- Update completion check to only verify:
  - Game predictions exist
  - Qualification predictions exist (from new system)
- Don't check old `tournament_group_team_stats_guess` table

### Step 4: Remove Test References

**4.1 Delete test factory from `__tests__/db/test-factories.ts`:**
- Remove import: `TournamentGroupTeamStatsGuess` (line 12)
- Delete factory function: `tournamentGroupTeamStatsGuess()` (lines 317+)

**4.2 Update `__tests__/actions/guesses-actions.test.ts`:**
- Remove imports: `TournamentGroupTeamStatsGuessNew`, `TournamentGroupTeamStatsGuess` (line 16)
- Delete tests for `updateOrCreateTournamentGroupTeamGuesses()` (lines 238-249)
- Keep tests for game prediction actions

**4.3 Update `__tests__/actions/backoffice-actions.test.ts`:**
- Remove import: `calculateAndStoreGroupPositionScores` (line 18)
- Delete tests for old scoring function (lines 1313-1426)
- Keep tests for new `calculateAndStoreQualificationScores()`

**4.4 Update `__tests__/components/guesses-context-provider.test.tsx`:**
- Remove import: `TournamentGroupTeamStatsGuessNew` (line 6)
- Remove mock data for old predictions (line 88)
- Update tests to only cover game score prediction functionality

**4.5 Update `__tests__/components/backoffice/tournament-backoffice-tab.test.tsx`:**
- Remove mock for `calculateAndStoreGroupPositionScores` (line 32)
- Keep mocks for new qualification scoring functions

**4.6 Update `__tests__/utils/test-utils.tsx`:**
- Remove import: `TournamentGroupTeamStatsGuessNew` (line 6)
- Remove `guessedPositions` field from test interface (line 30)

### Step 5: Update Documentation

**5.1 Update `docs/claude/architecture.md`:**
- Remove old table reference from line 234
- Add note about new qualification prediction system

**5.2 Update `docs/claude/testing.md`:**
- Remove reference to `testFactories.tournamentGroupTeamStatsGuess()` (line 61)

**5.3 Update `__tests__/db/README.md`:**
- Remove factory documentation (line 630)

### Step 6: Create Database Migration

**6.1 Create new migration file:** `migrations/20260209000000_archive_old_group_predictions_table.sql`

```sql
-- Archive old group prediction table
-- Keep for 30 days as rollback safety net
-- Will be dropped in follow-up migration after validation period

ALTER TABLE tournament_group_team_stats_guess
  RENAME TO tournament_group_team_stats_guess_archived;

-- Add comment for future reference
COMMENT ON TABLE tournament_group_team_stats_guess_archived IS
  'Archived 2026-02-09. Old group prediction system replaced by tournament_qualified_teams_predictions. Safe to drop after 2026-03-11 if no issues reported.';
```

**6.2 Create rollback migration:** `migrations/20260209000000_archive_old_group_predictions_table_rollback.sql`

```sql
-- Rollback: Restore old table name if needed
ALTER TABLE tournament_group_team_stats_guess_archived
  RENAME TO tournament_group_team_stats_guess;

COMMENT ON TABLE tournament_group_team_stats_guess IS NULL;
```

### Step 7: Run Tests and Validation

**7.1 TypeScript compilation:**
```bash
npm run build
# MUST succeed with 0 errors
# This verifies no TypeScript references remain to removed types
```

**7.2 Run linter:**
```bash
npm run lint
# MUST succeed with 0 warnings
```

**7.3 Run unit tests:**
```bash
npm run test
# MUST pass 100%
# Coverage should not drop below project baseline
```

**7.4 Search for remaining references (CRITICAL VERIFICATION):**
```bash
echo "=== Verifying Code Cleanup ==="

# Old table references (MUST BE 0 - table no longer used)
TABLE_REFS=$(grep -r "tournament_group_team_stats_guess" --include="*.ts" --include="*.tsx" app/ __tests__/ 2>/dev/null | wc -l)
echo "Old table references: $TABLE_REFS (MUST BE 0)"

# Old type references (MUST BE 0 - types removed)
TYPE_REFS=$(grep -r "TournamentGroupTeamStatsGuess" --include="*.ts" --include="*.tsx" app/ __tests__/ 2>/dev/null | wc -l)
echo "Old type references: $TYPE_REFS (MUST BE 0)"

# Old function references (MUST BE 0 - calculation function removed)
FUNC_REFS=$(grep -r "calculateAndStoreGroupPositionScores" --include="*.ts" --include="*.tsx" app/ __tests__/ 2>/dev/null | wc -l)
echo "Old scoring function references: $FUNC_REFS (MUST BE 0)"

# Legacy display references (ALLOWED: 2-3 for read-only display)
LEGACY_REFS=$(grep -r "group_position_score" --include="*.ts" --include="*.tsx" app/components/ app/tournaments/ 2>/dev/null | grep -v "qualification_score")
LEGACY_COUNT=$(echo "$LEGACY_REFS" | grep -c "group_position_score" || echo "0")
echo "Legacy display references (READ ONLY): $LEGACY_COUNT (EXPECTED: 2-3)"
echo "$LEGACY_REFS"

# Verify legacy references are READ ONLY (no writes/calculations)
if [ "$LEGACY_COUNT" -gt 0 ]; then
  echo "Checking legacy references are READ ONLY..."
  WRITE_REFS=$(echo "$LEGACY_REFS" | grep -E "(=|\+=|-=|\+\+|--)" | wc -l)
  if [ "$WRITE_REFS" -gt 0 ]; then
    echo "❌ ERROR: Found WRITE operations to group_position_score (should be READ ONLY)"
    echo "$LEGACY_REFS" | grep -E "(=|\+=|-=|\+\+|--)"
    exit 1
  else
    echo "✅ Legacy references are READ ONLY"
  fi
fi

# Overall verification
if [ "$TABLE_REFS" -ne 0 ] || [ "$TYPE_REFS" -ne 0 ] || [ "$FUNC_REFS" -ne 0 ]; then
  echo "❌ CLEANUP INCOMPLETE - Old system references still exist!"
  exit 1
elif [ "$LEGACY_COUNT" -lt 2 ] || [ "$LEGACY_COUNT" -gt 4 ]; then
  echo "⚠️  WARNING: Legacy display references count unexpected (expected 2-3, found $LEGACY_COUNT)"
  echo "   Review to ensure historical tournament scores will display correctly"
else
  echo "✅ All cleanup verification passed"
fi

echo ""
echo "=== Verifying Migration Cleanup ==="
MIG_REFS=$(grep -r "tournament_group_team_stats_guess" migrations/ 2>/dev/null | grep -v "archived" | wc -l)
echo "Migration references (excluding archived): $MIG_REFS (MUST BE 0)"

echo ""
echo "=== Verifying Documentation Cleanup ==="
DOC_REFS=$(grep -r "tournament_group_team_stats_guess" docs/ 2>/dev/null | wc -l)
echo "Documentation references: $DOC_REFS (SHOULD BE 0)"
```

**7.5 Run SonarCloud analysis locally (if available):**
```bash
# If sonar-scanner available locally
npm run sonar-scan 2>/dev/null || echo "Will verify on CI/CD"
```

**7.6 Manual verification - Specific test scenarios:**

**Scenario 1: Group standings page (old system removed)**
```
Navigate to: /tournaments/[id]/groups/[group_id]
Expected:
  ✓ Page loads without errors
  ✓ Actual standings display correctly (using calculator utility)
  ✓ No errors in browser console about missing predictions
  ✓ No 404s for old table queries
```

**Scenario 2: Qualification predictions (new system works)**
```
Navigate to: /tournaments/[id]/qualified-teams
Actions:
  1. Make predictions using drag-and-drop UI
  2. Check 3rd place qualification checkbox
  3. Save predictions
  4. Reload page
Expected:
  ✓ Saves work correctly
  ✓ Predictions persist on reload
  ✓ No errors in browser console
```

**Scenario 3: Friend group leaderboards (scoring correct)**
```
Navigate to: /tournaments/[id]/friend-groups/[group_id]
Expected:
  ✓ Scores display with correct breakdown
  ✓ Shows "Qualified Teams" score (not "Group Positions")
  ✓ Scores match backend calculation
  ✓ Historical tournaments still show old scores if they exist
```

**Scenario 4: Backoffice scoring (old functions removed)**
```
Navigate to: /tournaments/[id]/backoffice
Expected:
  ✓ Old "Calculate Group Position Scores" button is GONE
  ✓ New "Calculate Qualification Scores" button exists
  ✓ Clicking new button works without errors
  ✓ Scores are calculated and stored in qualification_score column
```

**Scenario 5: User stats page (no old score references)**
```
Navigate to: /tournaments/[id]/stats
Expected:
  ✓ Point breakdown shows qualification score
  ✓ No references to "group position score" in breakdown
  ✓ For historical tournaments: old scores display if they exist (read-only)
  ✓ For new tournaments: only qualification_score is shown
```

**Scenario 6: Historical data handling**
```
For tournaments created BEFORE this cleanup:
  1. Check tournament_guesses table has group_position_score values
  2. Load tournament leaderboard
Expected:
  ✓ Old group_position_score displays for historical tournaments
  ✓ Labeled as "Group Positions (legacy)" or similar
  ✓ Not editable/recalculable (calculation function removed)
  ✓ Clear indication this is historical data, not active
```

**7.7 Performance baseline validation:**
```bash
# Measure leaderboard query time before/after
echo "Testing leaderboard performance..."
time curl -s "https://localhost:3000/tournaments/1/friend-groups/1" > /dev/null

# Should complete in < 500ms (baseline)
# Old table removal should NOT regress performance
```

### Step 8: Run Database Migration

**After all code changes are committed and deployed to staging:**

```bash
# Staging environment
psql $STAGING_DATABASE_URL -f migrations/20260209000000_archive_old_group_predictions_table.sql

# Verify table renamed
psql $STAGING_DATABASE_URL -c "\dt tournament_group_team_stats_guess*"
# Should show: tournament_group_team_stats_guess_archived

# Test application on staging - ensure no errors
```

**Production deployment:**
```bash
# AFTER staging validation passes
psql $DATABASE_URL -f migrations/20260209000000_archive_old_group_predictions_table.sql

# Verify
psql $DATABASE_URL -c "\dt tournament_group_team_stats_guess*"
```

## Testing Strategy

### Unit Tests

**New tests to add:**
- None required (removing code, not adding new logic)

**Existing tests to update:**
All test updates listed in Step 4 above ensure test suite remains comprehensive after removal.

### Integration Tests

**Manual test scenarios (see Step 7.6 for detailed test cases):**
- Group standings page
- Qualification predictions page
- Friend group leaderboards
- Backoffice scoring
- User stats page
- Historical data handling

### Edge Case Testing

**Edge Case 1: Concurrent predictions during deployment**
```
Scenario: User makes qualification predictions while deployment is in progress
Steps:
  1. Start deployment (code update)
  2. User accesses /tournaments/[id]/qualified-teams
  3. User makes predictions and saves
Expected: Save should succeed or fail gracefully with retry
```

**Edge Case 2: Archived table accessed directly**
```
Scenario: Someone tries to query archived table directly via SQL
Steps:
  1. psql $DATABASE_URL -c "SELECT * FROM tournament_group_team_stats_guess;"
Expected: ERROR: relation does not exist (table renamed)

  2. psql $DATABASE_URL -c "SELECT * FROM tournament_group_team_stats_guess_archived;"
Expected: SUCCESS (data still accessible for rollback)
```

**Edge Case 3: Historical tournament with NULL group_position_score**
```
Scenario: Old tournament where no one made group position predictions
Steps:
  1. Find old tournament with NULL group_position_score values
  2. Load leaderboard
Expected: Display "Qualified Teams: 0 pts" (don't show legacy section if no scores)
```

**Edge Case 4: Mixed tournament state**
```
Scenario: Tournament started before cleanup, finished after cleanup
Steps:
  1. Tournament created with old system predictions
  2. Cleanup deployed
  3. Tournament finishes, scoring runs
Expected: Use new qualification scoring, old predictions ignored/archived
```

### Rollback Testing (Staging Only)

**Rollback Test 1: Database rollback**
```
Steps:
  1. Run archive migration on staging
  2. Verify table renamed
  3. Run rollback migration
  4. Verify table restored to original name
  5. Verify data integrity (count rows before/after)
Expected: All data preserved, table name restored
```

**Rollback Test 2: Full system rollback**
```
Steps:
  1. Deploy cleanup changes to staging
  2. Verify new system works
  3. Simulate production issue (e.g., scoring calculation error)
  4. Execute full rollback (DB + code)
  5. Verify old system functional again
Expected: Old system works, no data loss, scoring calculations correct
```

### Regression Testing

**Critical paths to validate:**
- Tournament creation and configuration
- Making game score predictions
- Making qualification predictions (new system)
- Viewing friend group leaderboards
- Viewing personal statistics
- Admin backoffice scoring operations

### Performance Validation

**Before and after metrics:**
- Leaderboard query time (should not regress)
- Friend group dashboard load time
- Database query count on scoring pages

## Validation Considerations

### SonarCloud Requirements

**Coverage:**
- No new code being added, so no coverage requirements
- Ensure removed code doesn't drop overall project coverage below threshold
- All updated test files must maintain 80%+ coverage

**Code Quality:**
- Remove all dead code (no commented-out references to old table)
- No unused imports after cleanup
- All TypeScript errors resolved

### Quality Gates

- [ ] All tests pass
- [ ] No TypeScript compilation errors
- [ ] No ESLint warnings
- [ ] Grep search returns zero results for old table name
- [ ] Application loads without errors on all major pages
- [ ] Database migration runs successfully on staging

## Rollback Plan

### Pre-Rollback Preparation (Before Production Deployment)

**MANDATORY: Test rollback procedure on staging before production deployment**

```bash
# Staging rollback drill (run BEFORE production deployment)
echo "=== Pre-Rollback Drill on Staging ==="

# 1. Deploy cleanup changes to staging
# 2. Verify new system works
# 3. Intentionally trigger rollback

# Step 1: Archive table
psql $STAGING_DATABASE_URL -f migrations/20260209000000_archive_old_group_predictions_table.sql

# Step 2: Verify app works with archived table
curl -s https://staging.example.com/tournaments/1/groups/1 | grep "standings" || echo "ERROR"

# Step 3: Execute rollback
psql $STAGING_DATABASE_URL -f migrations/20260209000000_archive_old_group_predictions_table_rollback.sql

# Step 4: Verify table restored
psql $STAGING_DATABASE_URL -c "\dt tournament_group_team_stats_guess"
# Should show: tournament_group_team_stats_guess (NOT archived)

# Step 5: Verify data integrity
BEFORE_COUNT=<documented before archiving>
AFTER_COUNT=$(psql $STAGING_DATABASE_URL -t -c "SELECT COUNT(*) FROM tournament_group_team_stats_guess;")
if [ "$BEFORE_COUNT" -eq "$AFTER_COUNT" ]; then
  echo "✅ Rollback drill successful - all data preserved"
else
  echo "❌ DATA LOSS DETECTED - rollback procedure needs fix!"
  exit 1
fi
```

**Document rollback drill results before production deployment.**

### Rollback Decision Criteria

**The archived table will be kept for exactly 30 days (until March 11, 2026) to enable rollback.**

**Drop decision on March 11, 2026:**
- ✅ IF: No production issues reported AND new system stable → Create follow-up story to drop archived table
- ❌ IF: Issues reported OR new system unstable → Extend archive period OR restore old system

**Decision maker:** Product owner + Tech lead

**Post-rollback decision criteria:**
- After rollback: Schedule post-mortem within 24 hours
- Identify root cause before re-attempting cleanup
- Re-attempt timeline: TBD after root cause analysis (likely 1-2 sprints)

### If Issues Found During Staging

**Scenario A: Code issues (before database migration run)**
```bash
# 1. Revert code changes
git revert <commit-sha>
git push

# 2. Redeploy previous version
# No database rollback needed (table not archived yet)
```

**Scenario B: Database migration issues**
```bash
# 1. Run rollback migration
psql $STAGING_DATABASE_URL -f migrations/20260209000000_archive_old_group_predictions_table_rollback.sql

# 2. Verify table restored
psql $STAGING_DATABASE_URL -c "\dt tournament_group_team_stats_guess"
# Should show: tournament_group_team_stats_guess (not archived)

# 3. Revert code changes
git revert <commit-sha>
git push
```

### If Issues Found After Production Deployment

**Emergency rollback procedure (ONLY if critical scoring errors):**

**Step 1: Immediate mitigation (< 5 minutes)**
```bash
# Restore old table name
psql $DATABASE_URL -f migrations/20260209000000_archive_old_group_predictions_table_rollback.sql

# Verify restoration
psql $DATABASE_URL -c "SELECT COUNT(*) FROM tournament_group_team_stats_guess;"
# Should return original row count (data preserved in archived table)
```

**Step 2: Code rollback (< 15 minutes)**
```bash
# Revert code commits
git revert <commit-sha-1> <commit-sha-2> ...
git push origin main

# Trigger emergency redeployment
# Wait for deployment to complete
```

**Step 3: Verification (< 30 minutes)**
```bash
# Verify old system is functional
curl https://production-url/tournaments/1/groups/1 | grep "standings"
# Should not error

# Check scoring calculations work
# (Manual test in backoffice)
```

**Step 4: Post-mortem**
- Document what went wrong
- Identify root cause
- Plan remediation
- Schedule re-attempt of cleanup after fix

**Types of issues that warrant rollback:**
- Critical: Scoring calculations broken, data loss, production errors
- Do NOT rollback for: Minor UI issues, performance tweaks, non-blocking bugs

**Communication during rollback:**

**Immediate (< 5 minutes):**
- Tech lead: Post in `#engineering` Slack channel: "Production rollback in progress for story #91. ETA: 30 minutes."
- Product owner: Post in `#product` Slack channel: "Temporary scoring system issue detected. Engineering team resolving."

**During rollback (5-30 minutes):**
- Display app banner to users: "We're experiencing a temporary issue with the scoring system. Your data is safe. Updates coming soon."
- Update GitHub issue #91 with: "Rollback initiated at [timestamp]. Reason: [brief description]."

**After rollback complete (< 60 minutes):**
- Remove app banner, replace with: "Scoring system issue resolved. No data was lost. Thank you for your patience."
- Tech lead: Post in `#engineering`: "Rollback complete. System stable. Post-mortem scheduled for [date/time]."
- Product owner: Email stakeholders with summary (template below)

**Stakeholder email template:**
```
Subject: [RESOLVED] Temporary Scoring System Issue - Feb 9, 2026

Hi team,

We experienced a temporary issue with our scoring system this evening related to a planned system cleanup (Story #91).

Impact:
- Duration: [X minutes]
- User-facing: [Brief description]
- Data loss: None - all user predictions and scores preserved

Resolution:
- Issue detected at [time]
- System rolled back to previous stable version at [time]
- Full functionality restored at [time]

Next Steps:
- Post-mortem meeting: [date/time]
- Root cause analysis in progress
- Will share findings and prevention plan by [date]

Thank you,
[Name]
```

**Post-mortem (within 24 hours):**
- Schedule 1-hour meeting with: Tech lead, Product owner, Engineering team
- Document: What happened, why it happened, how we detected it, how we fixed it, how we prevent it
- Share report in Confluence/Notion with stakeholders

## Dependencies

- ✅ Story #90 (Visual Qualification Prediction Interface) - Completed and deployed
- ✅ New qualification system stable for at least 1 week
- ✅ Users have made predictions in new system

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Missing code reference causes runtime error | High | Thorough grep search before commit; staging validation |
| Database migration fails | Medium | Test on staging first; rollback script ready |
| Performance regression | Low | Monitor query times; old table removal should improve performance |
| User confusion about scores | Low | New UI from #90 already deployed; users familiar with new system |

## Timeline Estimate

- **Step 1-5 (Code removal):** 4-6 hours
- **Step 6 (Migration creation):** 1 hour
- **Step 7 (Testing):** 2-3 hours
- **Step 8 (Database migration):** 1 hour (includes staging validation)
- **Total:** 8-11 hours (1.5-2 days)

## Follow-Up Tasks

**After 30-day validation period (separate story):**
- Create new migration to drop `tournament_group_team_stats_guess_archived` table
- Remove rollback migration file
- Update any remaining documentation

## Notes

- **Not rushing:** New system from #90 has been stable for sufficient time
- **Safety first:** Keeping archived table for 30 days provides safety net
- **No data loss:** Old table preserved in archived state
- **Clean codebase:** Eliminates confusing dual prediction systems
- **Improved maintainability:** Single source of truth for qualification predictions

## Success Criteria

- [ ] All code references removed
- [ ] All tests pass
- [ ] No TypeScript/ESLint errors
- [ ] Database table archived successfully
- [ ] Staging validation passes
- [ ] Production deployment successful
- [ ] No user-reported issues for 1 week post-deployment
- [ ] SonarCloud quality gates pass

**When all criteria met, this story is complete. The 30-day monitoring period begins, after which Phase 4 (table drop) can be executed as a separate task.**
