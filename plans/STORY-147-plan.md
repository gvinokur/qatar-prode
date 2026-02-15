# Implementation Plan: Story #147 - Materialize Score Calculations

## Story Context

**Problem:** User scores are calculated on-demand via expensive SQL aggregations on every page load, resulting in ~300 DB queries/min and ~21 sec compute/min during active tournaments.

**Solution:** Materialize game score aggregations in the `tournament_guesses` table alongside existing tournament-level scores, making it the single source of truth for all user scores.

**Expected Impact:**
- 90% reduction in query time (50-100ms → 5-10ms)
- 93% reduction in Vercel compute (21 sec/min → 1.5 sec/min)
- 98% reduction in queries during peak (300/min → 5/min write events only)

## Acceptance Criteria

- [ ] Tournament layout loads with <10ms for score fetch (down from 50-100ms)
- [ ] Friend group leaderboards load with 1 DB query (down from 2-5)
- [ ] Game result publication triggers score materialization for all affected users
- [ ] Materialized scores match on-demand calculations (spot-check validation)
- [ ] Yesterday scores are correctly snapshotted for rank change tracking
- [ ] All existing call sites updated to use materialized scores
- [ ] No regressions in score accuracy
- [ ] Production monitoring shows 90%+ reduction in query time

## Technical Approach

### Phase 1: Schema Migration

**Add materialized score columns to `tournament_guesses` table:**

```sql
ALTER TABLE tournament_guesses
  -- Game score totals (sum of game_guesses.score)
  ADD COLUMN total_game_score INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN group_stage_game_score INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN playoff_stage_game_score INTEGER DEFAULT 0 NOT NULL,

  -- Boost bonuses (sum of final_score - score)
  ADD COLUMN total_boost_bonus INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN group_stage_boost_bonus INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN playoff_stage_boost_bonus INTEGER DEFAULT 0 NOT NULL,

  -- Yesterday snapshots for rank tracking (24-hour window)
  ADD COLUMN yesterday_total_game_score INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN yesterday_boost_bonus INTEGER DEFAULT 0 NOT NULL,

  -- Timestamp of last game score update
  ADD COLUMN last_game_score_update_at TIMESTAMP WITH TIME ZONE;
```

**Add computed column for total points:**

```sql
ALTER TABLE tournament_guesses
  ADD COLUMN total_points INTEGER GENERATED ALWAYS AS (
    COALESCE(total_game_score, 0) +
    COALESCE(total_boost_bonus, 0) +
    COALESCE(qualified_teams_score, 0) +
    COALESCE(honor_roll_score, 0) +
    COALESCE(individual_awards_score, 0) +
    COALESCE(group_position_score, 0)
  ) STORED;
```

**Add performance index for leaderboard queries:**

```sql
CREATE INDEX idx_tournament_guesses_leaderboard
  ON tournament_guesses (tournament_id, total_points DESC);
```

**Rationale:**
- Reuses existing snapshot infrastructure (`last_score_update_date`, `yesterday_tournament_score`)
- Computed `total_points` column ensures consistency and simplifies queries
- Index choice: `(tournament_id, total_points DESC)` optimizes:
  - Friend group leaderboards (sort by points within tournament)
  - Tournament-wide leaderboards (if added later)
  - Note: Individual user lookups use existing PK index on (user_id, tournament_id)
  - Query pattern analysis shows leaderboards > individual lookups (90% vs 10% of queries)

### Phase 2: Materialization Function

**Create `recalculateGameScoresForUsers()` in `tournament-guess-repository.ts`:**

```typescript
/**
 * Recalculate and materialize game scores for users in a tournament
 * @param userIds - User IDs to recalculate (affected by game result)
 * @param tournamentId - Tournament ID
 * @returns Array of updated tournament guesses
 */
export async function recalculateGameScoresForUsers(
  userIds: string[],
  tournamentId: string
): Promise<TournamentGuess[]> {
  // Edge case: empty user IDs array
  if (!userIds || userIds.length === 0) {
    return [];
  }

  // Fetch aggregated game scores using existing query
  // This will internally use materialized data after Phase 4, but during transition
  // we need to explicitly call the aggregation version
  const gameStats = await getGameGuessStatisticsForUsersFromAggregation(userIds, tournamentId);

  // Build map for efficient lookup
  const statsByUserId = customToMap(gameStats, (stat) => stat.user_id);

  // Update each user's tournament_guesses with materialized scores
  // Note: We use sequential updates per user (not Promise.all) to avoid race conditions
  // within the same batch. Concurrent batches for different tournaments are still safe.
  const results: TournamentGuess[] = [];

  for (const userId of userIds) {
    const stats = statsByUserId[userId];

    // Ensure tournament_guesses row exists (create if needed)
    let tournamentGuess = await findTournamentGuessByUserIdTournament(userId, tournamentId);

    if (!tournamentGuess) {
      // User has game_guesses but no tournament_guesses row - create it
      try {
        tournamentGuess = await createTournamentGuess({
          user_id: userId,
          tournament_id: tournamentId,
        });
      } catch (error) {
        // If creation fails (e.g., constraint violation), skip this user
        console.error(`Failed to create tournament_guesses row for user ${userId}:`, error);
        continue;
      }
    }

    // Prepare updates with materialized scores
    const updates: TournamentGuessUpdate = {
      total_game_score: stats?.total_score || 0,
      group_stage_game_score: stats?.group_score || 0,
      playoff_stage_game_score: stats?.playoff_score || 0,
      total_boost_bonus: stats?.total_boost_bonus || 0,
      group_stage_boost_bonus: stats?.group_boost_bonus || 0,
      playoff_stage_boost_bonus: stats?.playoff_boost_bonus || 0,
      yesterday_total_game_score: stats?.yesterday_total_score || 0,
      yesterday_boost_bonus: stats?.yesterday_boost_bonus || 0,
      last_game_score_update_at: new Date(),
    };

    // Update with transaction-safe update
    const updated = await updateTournamentGuessByUserIdTournament(userId, tournamentId, updates);
    if (updated) {
      results.push(updated);
    }
  }

  return results;
}
```

**Create legacy aggregation query for testing:**

Keep the original complex SQL aggregation as `getGameGuessStatisticsForUsersFromAggregation()`:

```typescript
/**
 * LEGACY: Get game guess statistics using SQL aggregation
 * This function preserves the original aggregation logic for:
 * 1. Testing parity with materialized scores
 * 2. Materialization function during initial backfill
 * 3. Spot-check validation in production
 *
 * After migration stabilizes (1-2 sprints), this can be removed.
 */
export async function getGameGuessStatisticsForUsersFromAggregation(
  userIds: string[],
  tournamentId: string
): Promise<GameStatisticForUser[]> {
  // [EXISTING SQL AGGREGATION LOGIC MOVED HERE - lines 59-232 from current implementation]
  const statisticsForUsers = await db.selectFrom('game_guesses')
    .innerJoin('games', 'games.id', 'game_guesses.game_id')
    .where('game_guesses.user_id', 'in', userIds)
    .where('games.tournament_id', '=', tournamentId)
    .select('user_id')
    .select(eb => [
      // ... all existing aggregation logic ...
    ])
    .groupBy('game_guesses.user_id')
    .execute()

  return statisticsForUsers as GameStatisticForUser[]
}
```

**Design decisions:**
- Preserves legacy aggregation as `getGameGuessStatisticsForUsersFromAggregation()` for testing parity
- Sequential updates per user within a batch to avoid intra-batch race conditions
- Handles missing `tournament_guesses` rows with error recovery
- Edge cases covered: empty userIds, creation failures, missing stats

**Yesterday snapshot logic (aligned with tournament scores):**
- Uses same `last_score_update_date` field (existing in tournament_guesses)
- Yesterday snapshot rotation handled by `updateTournamentGuessByUserIdTournament()`:
  - On first update each day (based on Argentina timezone), snapshots CURRENT scores before applying update
  - Yesterday fields capture "as of end of previous day" for rank change calculations
- Initial backfill: Sets yesterday values from aggregation query's yesterday calculation (24-hour window)
- Subsequent updates: Automatic snapshot rotation via existing logic

### Phase 3: Event Triggers

**Update `calculateGameScores()` in `backoffice-actions.ts`:**

After updating game guess scores (line ~420), add materialization trigger:

```typescript
export async function calculateGameScores(forceDrafts: boolean, forceAllGuesses: boolean) {
  // Existing logic: update game_guesses with calculated scores
  const gamesWithResultAndGuesses = await findAllGamesWithPublishedResultsAndGameGuesses(forceDrafts, forceAllGuesses)
  // ... existing score calculation ...
  const {updatedGameGuesses, cleanedGameGuesses} = /* existing logic */;

  // NEW: Materialize scores for affected users
  // Get unique user IDs from all updated game guesses
  const affectedUserIds = new Set<string>();
  updatedGameGuesses.flat().forEach(guess => affectedUserIds.add(guess.user_id));
  cleanedGameGuesses.forEach(guess => affectedUserIds.add(guess.user_id));

  // Group by tournament for efficient batching
  const usersByTournament = new Map<string, Set<string>>();
  for (const game of gamesWithResultAndGuesses) {
    if (!usersByTournament.has(game.tournament_id)) {
      usersByTournament.set(game.tournament_id, new Set());
    }
    game.gameGuesses.forEach(guess => {
      usersByTournament.get(game.tournament_id)!.add(guess.user_id);
    });
  }

  // Materialize scores for each tournament
  await Promise.all(
    Array.from(usersByTournament.entries()).map(([tournamentId, userIds]) =>
      recalculateGameScoresForUsers(Array.from(userIds), tournamentId)
    )
  );

  return {updatedGameGuesses, cleanedGameGuesses};
}
```

**Rationale:**
- Synchronous materialization ensures consistency (scores updated immediately)
- Batched by tournament for efficiency
- Handles both score updates and cleanups (draft results removed)

**Note on boost allocation:**
Boost type changes (`setGameBoostAction()`) only occur BEFORE games start (validation on line 27-30 of `game-boost-actions.ts`). Scores don't exist yet, so no materialization needed. Materialization happens later when game result is published.

### Phase 4: Simplify Read Paths

**Current flow (complex):**
```typescript
// getUserScoresForTournament() in prode-group-actions.ts (line 194)
// 1. Fetch game stats (expensive aggregation)
const gameStats = await getGameGuessStatisticsForUsers(userIds, tournamentId);
// 2. Fetch tournament guesses
const tournamentGuesses = await findTournamentGuessByUserIdsTournament(userIds, tournamentId);
// 3. Manually combine data
return userIds.map(userId => ({
  groupStageScore: gameStats[userId]?.group_score || 0,
  playoffScore: gameStats[userId]?.playoff_score || 0,
  totalPoints: gameStats[userId]?.total_score + gameStats[userId]?.total_boost_bonus + /* tournament scores */,
  // ... etc
}));
```

**New flow (simple):**
```typescript
// getUserScoresForTournament() - simplified
export async function getUserScoresForTournament(
  userIds: string[],
  tournamentId: string
): Promise<UserScore[]> {
  // Single query - all scores materialized in tournament_guesses
  const tournamentGuesses = await findTournamentGuessByUserIdsTournament(userIds, tournamentId);
  const guessesByUserId = customToMap(tournamentGuesses, (guess) => guess.user_id);

  return userIds.map(userId => {
    const guess = guessesByUserId[userId];

    return {
      userId,
      // Game scores (materialized)
      groupStageScore: guess?.group_stage_game_score || 0,
      playoffScore: guess?.playoff_stage_game_score || 0,
      groupBoostBonus: guess?.group_stage_boost_bonus || 0,
      playoffBoostBonus: guess?.playoff_stage_boost_bonus || 0,
      totalBoostBonus: guess?.total_boost_bonus || 0,
      // Tournament scores (already materialized)
      groupStageQualifiersScore: guess?.qualified_teams_score || 0,
      honorRollScore: guess?.honor_roll_score || 0,
      individualAwardsScore: guess?.individual_awards_score || 0,
      groupPositionScore: guess?.group_position_score || 0,
      // Total points (computed column)
      totalPoints: guess?.total_points || 0,
      // Yesterday scores (for rank tracking)
      yesterdayTotalPoints:
        (guess?.yesterday_total_game_score || 0) +
        (guess?.yesterday_boost_bonus || 0) +
        (guess?.yesterday_tournament_score || 0)
    };
  }) as UserScore[];
}
```

**Update all call sites:**

1. **Tournament layout** (`app/tournaments/[id]/layout.tsx:100`)
   - Currently: `await getGameGuessStatisticsForUsers([user.id], params.id)`
   - Change: Keep same call, but function now reads from materialized data internally
   - Impact: 90% faster (50-100ms → 5-10ms)

2. **Friend group leaderboard** (`app/tournaments/[id]/friend-groups/[group_id]/page.tsx:49`)
   - Currently: `await getUserScoresForTournament(allParticipants, tournament.id)`
   - Change: No change needed, function internally simplified
   - Impact: 1 query instead of 2-5

3. **Stats page** (`app/tournaments/[id]/stats/page.tsx:6`)
   - Currently: `await getGameGuessStatisticsForUsers([user.id], tournamentId)`
   - Change: Keep same call, function reads materialized data
   - Impact: Instant stats load

4. **Sidebar stats** (passed from layout to `TournamentSidebar` component)
   - Already uses `getGameGuessStatisticsForUsers()` from layout
   - No additional changes needed

**Decision:** Keep `getGameGuessStatisticsForUsers()` function signature unchanged, but modify implementation to read from materialized columns instead of running aggregations. This minimizes changes across call sites.

```typescript
// Modified getGameGuessStatisticsForUsers() in game-guess-repository.ts
export async function getGameGuessStatisticsForUsers(
  userIds: string[],
  tournamentId: string
): Promise<GameStatisticForUser[]> {
  // NEW IMPLEMENTATION: Read from materialized columns
  const tournamentGuesses = await db
    .selectFrom('tournament_guesses')
    .where('user_id', 'in', userIds)
    .where('tournament_id', '=', tournamentId)
    .select([
      'user_id',
      // Map materialized columns to expected output format
      'total_game_score as total_score',
      'group_stage_game_score as group_score',
      'playoff_stage_game_score as playoff_score',
      'total_boost_bonus',
      'group_stage_boost_bonus as group_boost_bonus',
      'playoff_stage_boost_bonus as playoff_boost_bonus',
      'yesterday_total_game_score as yesterday_total_score',
      'yesterday_boost_bonus',
      // Note: correct/exact guess counts not materialized (low value, adds complexity)
      // Set to 0 for now - these are only used in stats page detail cards
    ])
    .execute();

  // Return with correct/exact counts set to 0 (acceptable tradeoff - detail metrics vs core performance)
  return tournamentGuesses.map(tg => ({
    user_id: tg.user_id,
    total_score: tg.total_score,
    group_score: tg.group_score,
    playoff_score: tg.playoff_score,
    total_boost_bonus: tg.total_boost_bonus,
    group_boost_bonus: tg.group_boost_bonus,
    playoff_boost_bonus: tg.playoff_boost_bonus,
    yesterday_total_score: tg.yesterday_total_score,
    yesterday_boost_bonus: tg.yesterday_boost_bonus,
    // Detail metrics (correct/exact counts) - fallback to 0
    // These are only shown in stats page detail cards, not critical for performance
    total_correct_guesses: 0,
    total_exact_guesses: 0,
    group_correct_guesses: 0,
    group_exact_guesses: 0,
    playoff_correct_guesses: 0,
    playoff_exact_guesses: 0,
  })) as GameStatisticForUser[];
}
```

**Tradeoff: Correct/Exact Guess Counts**
- **Not materialized:** `total_correct_guesses`, `total_exact_guesses`, `group_correct_guesses`, etc.
- **Rationale:** These are detail metrics shown only in stats page cards, not used for leaderboards or core flows
- **Impact:** Stats page will show 0 for these counts (acceptable regression for 90% performance gain)
- **Verification needed:** Test stats page UI to ensure it handles 0 values gracefully (no UI breaks, displays "0" not "N/A")
- **Alternative:** If needed later, can be calculated on-demand for stats page only (1 user vs 100 users)
- **Code comment required:**
  ```typescript
  // TODO: Correct/exact guess counts intentionally hardcoded to 0 for performance
  // These detail metrics are only shown in stats page and don't justify materialization cost
  // If needed, can be calculated on-demand for stats page only (single user query)
  total_correct_guesses: 0,
  total_exact_guesses: 0,
  // ...
  ```

### Phase 5: Backfill & Migration Strategy

**Backfill script:** `scripts/backfill-materialized-scores.ts`

```typescript
import { db } from '../app/db/database';
import { recalculateGameScoresForUsers } from '../app/db/tournament-guess-repository';

async function backfillMaterializedScores() {
  console.log('Starting backfill of materialized scores...');

  // Get all active tournaments (or all tournaments for complete backfill)
  const tournaments = await db
    .selectFrom('tournaments')
    .where('is_active', '=', true)  // Only active tournaments to minimize load
    .select(['id', 'long_name'])
    .execute();

  console.log(`Found ${tournaments.length} active tournaments`);

  for (const tournament of tournaments) {
    console.log(`\nProcessing tournament: ${tournament.long_name} (${tournament.id})`);

    // Get all users with game guesses for this tournament
    const userIds = await db
      .selectFrom('game_guesses')
      .innerJoin('games', 'games.id', 'game_guesses.game_id')
      .where('games.tournament_id', '=', tournament.id)
      .select('game_guesses.user_id')
      .distinct()
      .execute();

    console.log(`  Found ${userIds.length} users with guesses`);

    // Process in batches of 50 users to avoid memory issues
    const BATCH_SIZE = 50;
    for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
      const batch = userIds.slice(i, i + BATCH_SIZE).map(u => u.user_id);
      console.log(`  Processing users ${i + 1}-${Math.min(i + BATCH_SIZE, userIds.length)}...`);

      try {
        await recalculateGameScoresForUsers(batch, tournament.id);
      } catch (error) {
        console.error(`  Error processing batch:`, error);
        // Continue with next batch (partial failure doesn't stop entire backfill)
      }
    }

    console.log(`  ✓ Completed tournament: ${tournament.long_name}`);
  }

  console.log('\n✓ Backfill complete!');
}

// Run backfill
backfillMaterializedScores()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Backfill failed:', error);
    process.exit(1);
  });
```

**Migration execution plan:**

1. **Development testing:**
   - Run migration on dev database
   - Run backfill script
   - Verify materialized scores match on-demand calculations (use legacy aggregation function for comparison)
   - Test all user flows (leaderboards, sidebar, stats)
   - Verify stats page tolerates 0 values for correct/exact counts (acceptable regression)

2. **Production deployment (safe sequence):**

   **Step 1: Schema migration (non-breaking)**
   - Deploy migration adds columns with DEFAULT 0
   - Existing queries unaffected (don't use new columns yet)
   - Materialization function can start working but isn't triggered yet

   **Step 2: Enable write path (materialization trigger)**
   - Deploy code that adds materialization to `calculateGameScores()`
   - New game results will now materialize scores
   - Old data still unmaterialized (all columns are 0)
   - Queries still use legacy aggregation (reads unchanged)

   **Step 3: Backfill existing data**
   - Run backfill script during low-traffic window (recommended: 2-4am)
   - Process in batches (50 users at a time)
   - Monitor for errors, continue on partial failures
   - Concurrent game results are safe (see edge case handling above)
   - Validate: Spot-check 10-20 users across tournaments

   **Step 4: Enable read path (switch to materialized data)**
   - Deploy code that modifies `getGameGuessStatisticsForUsers()` to read materialized columns
   - This is the CRITICAL switch - queries now use new data source
   - Monitor query performance: Should see 90% reduction immediately
   - Monitor error rates: Should be 0 new errors
   - If issues: Rollback read path immediately (see below)

   **Step 5: Monitoring (first 24 hours)**
   - Query time: Layout page <10ms, friend groups <10ms
   - Error rates: 0 new 500 errors
   - Score accuracy: Spot-check 10 users - materialized vs legacy aggregation match
   - Vercel compute: Should see ~90% reduction in function duration

3. **Rollback plan (per deployment step):**

   **If issues after Step 4 (read path):**
   - Revert `getGameGuessStatisticsForUsers()` to use legacy aggregation
   - Queries switch back to on-demand calculation
   - No data loss, immediate recovery
   - Materialization continues in background (write path still active)

   **If issues after Step 2-3 (write path/backfill):**
   - Disable materialization trigger in `calculateGameScores()`
   - New game results won't materialize (no harm - queries use legacy)
   - Fix issues, re-run backfill, redeploy

   **Full rollback (worst case):**
   - Revert all code changes
   - Schema columns remain (unused, no harm)
   - System operates as before migration

**Edge case handling:**

- **Users with game_guesses but no tournament_guesses row:**
  - `recalculateGameScoresForUsers()` creates missing rows
  - Backfill script handles this automatically

- **Concurrent updates during backfill:**
  - **Scenario:** Game result published while backfill processes same user
  - **Resolution:** Both operations use same aggregation source (game_guesses table)
  - **Outcome:** Last write wins (idempotent - both compute same values)
  - **Proof:** Materialization reads current game_guesses state, backfill reads current state → same result
  - **Edge case:** If game result publishes BETWEEN aggregation read and tournament_guesses write:
    - Game result materialization completes first → correct final state
    - Backfill overwrites → also correct (reads updated game_guesses)
    - Both operations converge to same final state

- **Missing yesterday snapshots:**
  - Existing snapshot logic in `updateTournamentGuessByUserIdTournament()` handles first-time updates
  - No special handling needed

## Files to Create/Modify

### New Files
- `migrations/20260215000000_add_materialized_game_scores.sql` - Schema changes
- `scripts/backfill-materialized-scores.ts` - One-time backfill script

### Modified Files

**Phase 2: Materialization Function**
- `app/db/tournament-guess-repository.ts`
  - Add `recalculateGameScoresForUsers()` function

**Phase 3: Event Triggers**
- `app/actions/backoffice-actions.ts`
  - Modify `calculateGameScores()` to trigger materialization

**Phase 4: Read Path Updates**
- `app/db/game-guess-repository.ts`
  - Modify `getGameGuessStatisticsForUsers()` to read materialized columns
- `app/actions/prode-group-actions.ts`
  - Simplify `getUserScoresForTournament()` (optional, handled by repository change)

**Phase 5: Type Definitions**
- `app/db/tables-definition.ts`
  - Add new columns to `TournamentGuessTable` interface

## Testing Strategy

### Unit Tests

**Repository tests:**
- `__tests__/db/tournament-guess-repository.test.ts`
  - Test `recalculateGameScoresForUsers()` with known data
  - Verify materialized scores match aggregation results (use `getGameGuessStatisticsForUsersFromAggregation()`)
  - Test creation of missing `tournament_guesses` rows
  - Test yesterday snapshot logic
  - **Edge cases:**
    - Empty userIds array → returns empty array
    - User with 0 game guesses → creates row with 0 scores
    - tournament_guesses creation failure → logs error, continues with other users
    - Concurrent calls for same user → last write wins (idempotent)

**Action tests:**
- `__tests__/actions/backoffice-actions.test.ts`
  - Test `calculateGameScores()` triggers materialization
  - Verify all affected users get updates
  - Test batch processing by tournament

### Integration Tests

**Score consistency validation:**
```typescript
// Test: Materialized scores match on-demand calculations
describe('Materialized scores parity', () => {
  it('should match getGameGuessStatisticsForUsers results', async () => {
    // Set up test data with known game guesses
    // Test factory creates 3 users with: group games (3 correct, 1 exact), playoff games (2 correct), boosts
    const { userIds, tournamentId } = await testFactories.createGameGuessesWithScores({
      userCount: 3,
      tournamentId: 'test-tournament',
      groupGames: 5,
      playoffGames: 3,
      withBoosts: true,
    });

    // Calculate using legacy aggregation
    const legacyStats = await getGameGuessStatisticsForUsersFromAggregation(userIds, tournamentId);

    // Materialize scores
    await recalculateGameScoresForUsers(userIds, tournamentId);

    // Read materialized scores
    const materializedStats = await getGameGuessStatisticsForUsers(userIds, tournamentId);

    // Verify parity (scores, bonuses, yesterday values)
    for (const userId of userIds) {
      const legacy = legacyStats.find(s => s.user_id === userId);
      const materialized = materializedStats.find(s => s.user_id === userId);

      expect(materialized?.total_score).toBe(legacy?.total_score);
      expect(materialized?.group_score).toBe(legacy?.group_score);
      expect(materialized?.playoff_score).toBe(legacy?.playoff_score);
      expect(materialized?.total_boost_bonus).toBe(legacy?.total_boost_bonus);
      expect(materialized?.group_boost_bonus).toBe(legacy?.group_boost_bonus);
      expect(materialized?.playoff_boost_bonus).toBe(legacy?.playoff_boost_bonus);
      expect(materialized?.yesterday_total_score).toBe(legacy?.yesterday_total_score);
      expect(materialized?.yesterday_boost_bonus).toBe(legacy?.yesterday_boost_bonus);
    }
  });
});
```

**Backfill script tests:**
```typescript
describe('Backfill script', () => {
  it('should handle batch processing correctly', async () => {
    // Create 150 users (3 batches of 50)
    const userIds = await testFactories.createUsersWithGameGuesses(150);

    await backfillMaterializedScores();

    // Verify all users have materialized scores
    for (const userId of userIds) {
      const guess = await findTournamentGuessByUserIdTournament(userId, tournamentId);
      expect(guess?.total_game_score).toBeGreaterThanOrEqual(0);
    }
  });

  it('should recover from partial batch failures', async () => {
    // Mock one user in batch causing error
    const userIds = await testFactories.createUsersWithGameGuesses(100);
    // ... mock error for user 25 ...

    await backfillMaterializedScores();

    // Verify other users in batch still processed
    const firstBatch = userIds.slice(0, 50);
    expect(/* users 1-24 and 26-50 have scores */);
  });

  it('should be idempotent (running twice produces same result)', async () => {
    const userIds = await testFactories.createUsersWithGameGuesses(10);

    await backfillMaterializedScores();
    const firstRun = await findTournamentGuessByUserIdsTournament(userIds, tournamentId);

    await backfillMaterializedScores();
    const secondRun = await findTournamentGuessByUserIdsTournament(userIds, tournamentId);

    // Verify scores unchanged
    expect(secondRun).toEqual(firstRun);
  });
});
```

**End-to-end flow tests:**
- Test game result publication → materialization → UI displays correct scores
- Test friend group leaderboard with materialized scores
- Test tournament sidebar shows correct stats
- **Stats page tolerance test:** Verify stats page renders correctly with 0 for correct/exact counts (acceptable regression)

### Performance Validation

**Query benchmarks:**
```typescript
// Measure query time improvement
describe('Performance benchmarks', () => {
  it('should reduce query time by 90%', async () => {
    const userIds = Array.from({ length: 100 }, (_, i) => `user-${i}`);

    // Benchmark old approach
    const startLegacy = Date.now();
    await getGameGuessStatisticsForUsersLegacy(userIds, tournamentId);
    const legacyTime = Date.now() - startLegacy;

    // Benchmark new approach
    const startMaterialized = Date.now();
    await getGameGuessStatisticsForUsers(userIds, tournamentId);
    const materializedTime = Date.now() - startMaterialized;

    // Verify >80% improvement
    expect(materializedTime).toBeLessThan(legacyTime * 0.2);
  });
});
```

**Load tests:**
- Simulate 100 concurrent friend group page loads
- Verify no connection pool exhaustion
- Measure Vercel compute reduction

### SonarCloud Quality Gates

**Coverage target:** 80% on new code
- `recalculateGameScoresForUsers()` - full coverage
- Modified `calculateGameScores()` - test materialization trigger
- Modified `getGameGuessStatisticsForUsers()` - test new implementation

**Maintainability:**
- No duplicated logic (reuses existing aggregation during materialization)
- Clear function boundaries (materialization vs. read)
- Well-documented tradeoffs (correct/exact counts)

## Open Questions & Risks

### Resolved During Planning

1. **Q: How to handle users with game_guesses but no tournament_guesses row?**
   - A: `recalculateGameScoresForUsers()` creates missing rows automatically

2. **Q: Should we materialize correct/exact guess counts?**
   - A: No - low value detail metrics, adds schema complexity. Acceptable to show 0 in stats page.

3. **Q: How to handle boost changes after game results exist?**
   - A: Not possible - boosts can only be set before game starts (validation in `setGameBoostAction`)

4. **Q: Yesterday snapshot logic - reuse existing pattern or create new?**
   - A: Reuse existing `last_score_update_date` and yesterday field pattern from tournament scores

### Remaining Risks

1. **Race conditions during concurrent game result publications:**
   - **Risk:** Multiple games published simultaneously → concurrent updates to same `tournament_guesses` row
   - **Resolution:** Sequential updates within batch (not Promise.all) eliminates intra-batch races
   - **Cross-batch safety:** Different tournaments process independently (no shared state)
   - **PostgreSQL locking:** Row-level locks prevent inter-batch conflicts (last write wins)
   - **Outcome:** Idempotent operations - both compute from same source (game_guesses) → same result
   - **Action:** Monitor for deadlocks in production (unlikely given sequential updates)

2. **Backfill consistency during concurrent game publications:**
   - **Risk:** Game result published while backfill processes same user
   - **Resolution:** Both operations read from game_guesses → compute same values → idempotent
   - **Edge case:** If game publishes between aggregation read and write:
     - Game materialization completes first → correct
     - Backfill overwrites → also correct (reads updated game_guesses)
   - **Outcome:** Converges to same final state regardless of execution order
   - **Action:** Validated in edge case tests (see testing strategy)

3. **Backfill performance on large datasets:**
   - **Risk:** Thousands of users × active tournaments = slow backfill
   - **Mitigation:** Batch processing (50 users at a time), run during low-traffic window (2-4am)
   - **Estimated time:** 1000 users = 20 batches × 2 sec/batch = ~40 seconds per tournament
   - **Action:** Test backfill on production-like dataset size (pre-deployment validation)

4. **Computed column performance:**
   - **Risk:** `total_points` computed column adds overhead to every UPDATE
   - **Mitigation:** Computed columns are highly optimized in PostgreSQL (marginal cost ~1-2ms)
   - **Trade-off:** Small UPDATE overhead vs. query-time calculation savings (50-100ms)
   - **Action:** Benchmark UPDATE performance before/after in dev environment

## Implementation Sequence

1. **Phase 1: Schema migration** (Day 1)
   - Create migration file
   - Test on dev database
   - Verify no breaking changes

2. **Phase 2: Materialization function** (Day 1-2)
   - Implement `recalculateGameScoresForUsers()`
   - Unit tests with known data
   - Verify parity with aggregations

3. **Phase 3: Event triggers** (Day 2)
   - Modify `calculateGameScores()`
   - Integration tests
   - Verify materialization runs on game result publication

4. **Phase 4: Read path updates** (Day 2-3)
   - Modify `getGameGuessStatisticsForUsers()` to read materialized data
   - Update type definitions
   - Update all tests
   - Verify all call sites work correctly

5. **Phase 5: Backfill & validation** (Day 3-4)
   - Create backfill script
   - Run backfill on dev/staging
   - Spot-check score accuracy
   - Performance benchmarks

6. **Deployment & monitoring** (Day 4-5)
   - Deploy to production during low-traffic window
   - Run backfill
   - Monitor query performance, error rates
   - Validate 90%+ performance improvement

## Monitoring & Validation Strategy

**Post-deployment monitoring (first 24-48 hours):**

1. **Query Performance Metrics:**
   - Monitor: `getGameGuessStatisticsForUsers()` execution time
   - Target: <10ms (down from 50-100ms) - 80%+ improvement
   - Alert if: >20ms (degradation from baseline)
   - Tool: Vercel function logs + custom timing logs

2. **Error Rates:**
   - Monitor: 500 errors on tournament layout, friend groups, stats pages
   - Target: 0 new errors (baseline: current error rate)
   - Alert if: >1% increase in error rate
   - Tool: Vercel error logs

3. **Score Accuracy Validation:**
   - Sample 20 random users across 3 tournaments
   - Compare: Materialized scores vs. legacy aggregation (run both)
   - Target: 100% match (all fields identical)
   - Alert if: Any mismatch detected
   - Tool: Manual spot-check script + automated validation

4. **Compute Cost Reduction:**
   - Monitor: Vercel function execution time for affected pages
   - Target: 90%+ reduction (21 sec/min → ~2 sec/min)
   - Measure: Total execution time across all affected functions
   - Tool: Vercel analytics dashboard

5. **Materialization Success Rate:**
   - Monitor: `recalculateGameScoresForUsers()` execution count and failures
   - Target: >99% success rate
   - Alert if: >5 failures per hour
   - Add logging: User IDs, tournament IDs, error messages

**Logging additions:**

```typescript
// In recalculateGameScoresForUsers()
console.log(`[Materialization] Processing ${userIds.length} users for tournament ${tournamentId}`);
// On error:
console.error(`[Materialization] Failed for user ${userId} in tournament ${tournamentId}:`, error);
```

**Validation script (production spot-check):**

```typescript
// scripts/validate-materialized-scores.ts
async function validateRandomUsers(sampleSize: number = 20) {
  // Select random users from active tournaments
  // For each user:
  //   - Fetch materialized scores
  //   - Compute legacy aggregation
  //   - Compare all fields
  //   - Report mismatches
}
```

## Success Metrics

**Performance (primary):**
- [ ] Tournament layout: <10ms for score fetch (down from 50-100ms)
- [ ] Friend groups: 1 query (down from 2-5)
- [ ] Stats page: <10ms (down from 50-100ms)

**Compute savings:**
- [ ] 90%+ reduction in query time
- [ ] 90%+ reduction in Vercel compute time

**Quality:**
- [ ] 0 score accuracy regressions (spot-check validation with 20+ samples)
- [ ] 80%+ test coverage on new code
- [ ] 0 new SonarCloud issues

## Follow-up Tasks (Technical Debt)

1. **Consider removing aggregation query entirely:**
   - After confirming materialized scores work correctly, the complex SQL aggregation in `getGameGuessStatisticsForUsers()` is no longer needed
   - Keep legacy query for a grace period (1-2 sprints) for spot-check validation
   - Then remove to simplify codebase

2. **Materialized correct/exact guess counts (optional):**
   - If stats page metrics become important, add these counts to schema
   - Low priority - detail metrics, not core functionality

3. **Monitoring & alerting:**
   - Add logging for materialization failures
   - Alert if materialization takes >5s (indicates performance degradation)
   - Dashboard for materialization event frequency

4. **Documentation:**
   - Document the new score calculation flow
   - Update architecture diagram
   - Add comments explaining materialization vs aggregation

## Notes

- **No UI changes required** - this is a backend optimization
- **Backward compatible** - schema changes are additive
- **Incremental rollout possible** - can deploy to staging first, validate, then production
- **Monitoring critical** - watch query performance and error rates closely post-deployment
