# Implementation Plan: Story #214

**Issue:** [Bug] Predictions Dashboard: Auto-Recalculation & Incomplete Game Guess Counting Issues

## Context

Two related bugs in the predictions dashboard affecting user experience:

1. **Dashboard doesn't auto-recalculate** when users change qualified teams or awards predictions
2. **Incomplete game guesses are incorrectly counted as complete** (missing penalty winners in playoff ties)

These issues cause confusion as the dashboard shows stale data and inflated prediction counts.

## Story Summary

### Issue #1: Missing Cache Revalidation

**Problem:** When users update qualified teams positions or tournament awards (champion/runner-up), the predictions dashboard doesn't update automatically because server actions don't trigger Next.js cache revalidation.

**Impact:** Users see stale completion percentages until they manually refresh the page.

### Issue #2: Incomplete Guesses Counted as Complete

**Problem:** Game guesses are counted as "complete" even when they're missing required data:
- Group stage games missing home_score or away_score
- **Playoff games with tied scores missing penalty winner selection**

**Impact:** Dashboard shows inflated prediction counts, giving users false sense of completion.

## Acceptance Criteria

### Issue #1: Auto-Recalculation
- [x] After saving qualified teams positions, dashboard updates automatically
- [x] After saving tournament awards, dashboard updates automatically
- [x] No manual page refresh needed

### Issue #2: Accurate Game Guess Counting
- [x] Only complete game guesses are counted in dashboard
- [x] Complete = both scores filled AND (not playoff OR decisive score OR penalty winner selected)
- [x] All pages using game guess counts use the corrected logic
- [x] SQL query properly validates playoff ties

## Technical Approach

### Issue #1: Add Cache Revalidation

**Files to modify:**
1. `app/actions/qualification-actions.ts` - Add revalidatePath after `updateGroupPositionsJsonb()` saves
2. `app/actions/guesses-actions.ts` - Add revalidatePath after `updateOrCreateTournamentGuess()` saves

**Implementation:**
```typescript
import { revalidatePath } from 'next/cache';

// In updateGroupPositionsJsonb - after successful save (line 262)
// Note: Revalidate both locales to cover all route variants
revalidatePath(`/en/tournaments/${tournamentId}/qualified-teams`);
revalidatePath(`/es/tournaments/${tournamentId}/qualified-teams`);

// In updateOrCreateTournamentGuess - after successful save (line 42)
revalidatePath(`/en/tournaments/${tournamentId}/awards`);
revalidatePath(`/es/tournaments/${tournamentId}/awards`);
```

**Why this works:**
- Next.js caches server component output
- `revalidatePath()` invalidates cache for that route
- Next request re-runs server component with fresh data
- Dashboard gets updated `tournamentPredictionCompletion` prop

### Issue #2: Fix Incomplete Game Guess Counting

**Current problem:**
- Pages count `gameGuessesArray.length` directly
- SQL query in `getPredictionDashboardStats()` doesn't validate playoff ties

**Solution:**
Modify `getPredictionDashboardStats()` SQL query to properly validate playoff ties, then use this query result everywhere instead of manual counting.

**A Game Guess is Complete When:**
1. Both `home_score` and `away_score` are NOT NULL
2. **For playoff games with tied scores**: Either `home_penalty_winner` OR `away_penalty_winner` must be `true`

**Files to modify:**

1. **`app/db/game-guess-repository.ts`** - Fix SQL query in `getPredictionDashboardStats()`
   - Join with `tournament_playoff_round_games` to identify playoff games
   - Add conditional validation for playoff ties with penalty winners

2. **Server pages** (fetch dashboardStats and pass to components):
   - `app/[locale]/tournaments/[id]/awards/page.tsx`
   - `app/[locale]/tournaments/[id]/qualified-teams/page.tsx`
   - `app/[locale]/tournaments/[id]/stats/page.tsx`

3. **Components** (update to use dashboardStats prop):
   - `app/components/awards/award-panel.tsx`
   - `app/components/qualified-teams/qualified-teams-client-page.tsx`

**SQL Query Strategy:**

**Key clarification:** Kysely's `.filterWhere()` applies row-level filtering BEFORE aggregation. Each condition filters individual rows, then the count aggregates only rows that pass all filters.

```typescript
// In getPredictionDashboardStats()
const stats = await db
  .selectFrom('games')
  .leftJoin('tournament_playoff_round_games', 'tournament_playoff_round_games.game_id', 'games.id')
  .leftJoin('game_guesses', (join) =>
    join
      .onRef('game_guesses.game_id', '=', 'games.id')
      .on('game_guesses.user_id', '=', userId)
  )
  .where('games.tournament_id', '=', tournamentId)
  .select((eb) => [
    eb.fn.countAll<number>().as('total_games'),

    // Predicted games with proper playoff tie validation
    // filterWhere applies to each row BEFORE counting
    eb.fn
      .count<number>('game_guesses.id')
      .filterWhere('game_guesses.home_score', 'is not', null)
      .filterWhere('game_guesses.away_score', 'is not', null)
      // Additional filter: For playoff ties, require penalty winner
      .filterWhere((eb) =>
        eb.or([
          // Condition 1: Not a playoff game (group stage games always count if scores exist)
          eb('tournament_playoff_round_games.game_id', 'is', null),
          // Condition 2: Playoff game with decisive score (no tie)
          eb('game_guesses.home_score', '<>', eb.ref('game_guesses.away_score')),
          // Condition 3: Playoff tie with penalty winner selected
          eb.and([
            eb('game_guesses.home_score', '=', eb.ref('game_guesses.away_score')),
            eb.or([
              eb('game_guesses.home_penalty_winner', '=', true),
              eb('game_guesses.away_penalty_winner', '=', true)
            ])
          ])
        ])
      )
      .as('predicted_games'),

    // Boost counts remain unchanged
    eb.fn
      .count<number>('game_guesses.id')
      .filterWhere('game_guesses.boost_type', '=', 'silver')
      .as('silver_used'),
    eb.fn
      .count<number>('game_guesses.id')
      .filterWhere('game_guesses.boost_type', '=', 'golden')
      .as('golden_used'),
  ])
  .executeTakeFirstOrThrow();
```

**Query Performance:**
- `tournament_playoff_round_games` table should have index on `game_id` (verify or add if missing)
- LEFT JOIN ensures group stage games (not in playoff table) are still counted
- Filter conditions applied row-by-row before aggregation

**Component/Page Updates:**

Replace manual counting with DB query:
```typescript
// BEFORE (awards page, qualified-teams page, stats page):
const gameGuessesArray = await findGameGuessesByUserId(user.id, tournamentId);
// Component receives: predictedGames={gameGuessesArray.length}

// AFTER:
const [gameGuessesArray, dashboardStats] = await Promise.all([
  findGameGuessesByUserId(user.id, tournamentId),
  getPredictionDashboardStats(user.id, tournamentId)
]);
// Component receives: predictedGames={dashboardStats.predictedGames}
```

## Implementation Steps

### Phase 1: Fix Cache Revalidation (Issue #1)
1. Import `revalidatePath` in `qualification-actions.ts`
2. Add revalidation call after successful save in `updateGroupPositionsJsonb()`
3. Import `revalidatePath` in `guesses-actions.ts`
4. Add revalidation call after successful save in `updateOrCreateTournamentGuess()`
5. Test: Save qualified teams → Dashboard updates automatically
6. Test: Save awards → Dashboard updates automatically

### Phase 2: Fix SQL Query (Issue #2)
1. Modify `getPredictionDashboardStats()` in `game-guess-repository.ts`
2. Add join with `tournament_playoff_round_games`
3. Add conditional validation for playoff ties in `predicted_games` count
4. Test: Create playoff game guess with tied score, no penalty winner → NOT counted
5. Test: Create playoff game guess with tied score + penalty winner → counted
6. Test: Create group game guess with both scores → counted

### Phase 3: Update Server Pages
1. Update `app/[locale]/tournaments/[id]/awards/page.tsx`
   - Import `getPredictionDashboardStats`
   - Fetch in parallel with existing queries
   - Pass `dashboardStats` to `AwardsPanel`

2. Update `app/[locale]/tournaments/[id]/qualified-teams/page.tsx`
   - Import `getPredictionDashboardStats`
   - Fetch in parallel with existing queries
   - Pass `dashboardStats` to `QualifiedTeamsClientPage`

3. Update `app/[locale]/tournaments/[id]/stats/page.tsx`
   - Import `getPredictionDashboardStats`
   - Fetch in parallel with existing queries
   - Use `dashboardStats.predictedGames` instead of manual count

### Phase 4: Update Components
1. Update `app/components/awards/award-panel.tsx`
   - Add `dashboardStats` prop to interface
   - Replace `predictedGames={gameGuessesArray.length}` with `predictedGames={dashboardStats.predictedGames}`
   - **Note:** `gameGuessesArray` is still needed for GuessesContext, so keep fetching it

2. Update `app/components/qualified-teams/qualified-teams-client-page.tsx`
   - Add `dashboardStats` prop to interface
   - Replace `predictedGames={gameGuessesArray.length}` with `predictedGames={dashboardStats.predictedGames}`
   - **Note:** `gameGuessesArray` is still needed for GuessesContext, so keep fetching it

### Phase 5: Integration Testing
1. Create test scenario with playoff tie (no penalty winner)
2. Verify dashboard doesn't count incomplete guess
3. Add penalty winner
4. Verify dashboard counts complete guess
5. Verify all three pages (awards, qualified-teams, stats) show same count
6. Test cache revalidation on both actions

## Files to Create/Modify

### Modified Files
- [x] `app/actions/qualification-actions.ts` - Add revalidatePath (both locales)
- [x] `app/actions/guesses-actions.ts` - Add revalidatePath (both locales)
- [x] `app/db/game-guess-repository.ts` - Fix SQL query with playoff tie validation
- [x] `app/[locale]/tournaments/[id]/awards/page.tsx` - Fetch and pass dashboardStats
- [x] `app/[locale]/tournaments/[id]/qualified-teams/page.tsx` - Fetch and pass dashboardStats
- [x] `app/[locale]/tournaments/[id]/stats/page.tsx` - Use dashboardStats instead of manual count
- [x] `app/components/awards/award-panel.tsx` - Add dashboardStats prop, use it
- [x] `app/components/qualified-teams/qualified-teams-client-page.tsx` - Add dashboardStats prop, use it

### Test Files
- [x] `__tests__/db/game-guess-repository.test.ts` - Add playoff tie validation tests (extend existing)
- [x] `__tests__/actions/qualification-actions.test.ts` - Add revalidation tests (extend existing)
- [x] `__tests__/actions/guesses-actions.test.ts` - Add revalidation tests (extend existing)
- [x] `__tests__/components/awards/award-panel.test.tsx` - Add test for dashboardStats prop (new or extend)
- [x] `__tests__/components/qualified-teams/qualified-teams-client-page.test.tsx` - Add test for dashboardStats prop (new or extend)

### No New Files
All changes are modifications to existing files.

## Testing Strategy

### Unit Tests

**Test file:** `__tests__/db/game-guess-repository.test.ts` (extend existing file)

**Test cases:**
1. **Group stage game with both scores** → counted as predicted
2. **Group stage game with one score missing** → NOT counted
3. **Playoff game with decisive score (no tie)** → counted as predicted
4. **Playoff game with tied score, no penalty winner** → NOT counted (key test)
5. **Playoff game with tied score + home_penalty_winner** → counted as predicted
6. **Playoff game with tied score + away_penalty_winner** → counted as predicted
7. **Playoff game with both scores missing** → NOT counted

**Test pattern using actual factories:**
```typescript
import { testFactories } from '../db/test-factories';
import { getPredictionDashboardStats } from '../../app/db/game-guess-repository';

describe('getPredictionDashboardStats - playoff tie validation', () => {
  let tournamentId: string;
  let userId: string;
  let playoffGame: any;
  let groupGame: any;

  beforeEach(async () => {
    // Setup test tournament and user
    const tournament = await testFactories.tournament();
    tournamentId = tournament.id;
    const user = await testFactories.user();
    userId = user.id;

    // Create playoff game (linked to tournament_playoff_round_games)
    playoffGame = await testFactories.game({
      tournament_id: tournamentId,
      game_type: 'playoff'
    });
    // Link to playoff round
    await testFactories.playoffRoundGame({ game_id: playoffGame.id });

    // Create group game
    groupGame = await testFactories.game({
      tournament_id: tournamentId,
      game_type: 'group'
    });
  });

  it('should NOT count playoff tie without penalty winner', async () => {
    // Create tied guess without penalty winner
    await testFactories.gameGuess({
      user_id: userId,
      game_id: playoffGame.id,
      home_score: 2,
      away_score: 2,
      home_penalty_winner: null,
      away_penalty_winner: null
    });

    const stats = await getPredictionDashboardStats(userId, tournamentId);

    expect(stats.predictedGames).toBe(0); // Should NOT count
  });

  it('should count playoff tie WITH home penalty winner', async () => {
    await testFactories.gameGuess({
      user_id: userId,
      game_id: playoffGame.id,
      home_score: 2,
      away_score: 2,
      home_penalty_winner: true,
      away_penalty_winner: false
    });

    const stats = await getPredictionDashboardStats(userId, tournamentId);

    expect(stats.predictedGames).toBe(1); // Should count
  });

  it('should count playoff decisive score without penalty winner', async () => {
    await testFactories.gameGuess({
      user_id: userId,
      game_id: playoffGame.id,
      home_score: 3,
      away_score: 1,
      home_penalty_winner: null,
      away_penalty_winner: null
    });

    const stats = await getPredictionDashboardStats(userId, tournamentId);

    expect(stats.predictedGames).toBe(1); // Should count
  });

  it('should count group stage game with both scores', async () => {
    await testFactories.gameGuess({
      user_id: userId,
      game_id: groupGame.id,
      home_score: 2,
      away_score: 2,
      home_penalty_winner: null, // Not needed for group games
      away_penalty_winner: null
    });

    const stats = await getPredictionDashboardStats(userId, tournamentId);

    expect(stats.predictedGames).toBe(1); // Should count
  });
});
```

**Test utilities:**
- `testFactories.tournament()` - Create test tournament
- `testFactories.user()` - Create test user
- `testFactories.game({ game_type: 'playoff' })` - Create playoff game
- `testFactories.playoffRoundGame({ game_id })` - Link game to playoff round
- `testFactories.gameGuess()` - Create game guess

### Integration Tests

**Test file:** `__tests__/actions/qualification-actions.test.ts` (extend existing)

**Test case: Cache revalidation (Vitest syntax)**
```typescript
import { vi } from 'vitest';
import * as nextCache from 'next/cache';

it('should revalidate paths after updating group positions', async () => {
  // Vitest spy (not jest.spyOn)
  const revalidateSpy = vi.spyOn(nextCache, 'revalidatePath').mockImplementation(() => {});

  await updateGroupPositionsJsonb(groupId, tournamentId, positionUpdates, 'es');

  // Verify both locale paths are revalidated
  expect(revalidateSpy).toHaveBeenCalledWith(`/en/tournaments/${tournamentId}/qualified-teams`);
  expect(revalidateSpy).toHaveBeenCalledWith(`/es/tournaments/${tournamentId}/qualified-teams`);
  expect(revalidateSpy).toHaveBeenCalledTimes(2);

  revalidateSpy.mockRestore();
});
```

**Test file:** `__tests__/actions/guesses-actions.test.ts` (extend existing)

**Test case: Cache revalidation (Vitest syntax)**
```typescript
import { vi } from 'vitest';
import * as nextCache from 'next/cache';

it('should revalidate paths after updating tournament guess', async () => {
  const revalidateSpy = vi.spyOn(nextCache, 'revalidatePath').mockImplementation(() => {});

  await updateOrCreateTournamentGuess(tournamentGuess, 'es');

  // Verify both locale paths are revalidated
  expect(revalidateSpy).toHaveBeenCalledWith(`/en/tournaments/${tournamentId}/awards`);
  expect(revalidateSpy).toHaveBeenCalledWith(`/es/tournaments/${tournamentId}/awards`);
  expect(revalidateSpy).toHaveBeenCalledTimes(2);

  revalidateSpy.mockRestore();
});
```

**Note:** Using Vitest's `vi.spyOn()` instead of Jest's `jest.spyOn()` since the project uses Vitest.

### Manual Testing Checklist

**Cache Revalidation:**
- [ ] Go to Qualified Teams page
- [ ] Change team positions
- [ ] Verify dashboard updates WITHOUT page refresh
- [ ] Go to Awards page
- [ ] Change champion selection
- [ ] Verify dashboard updates WITHOUT page refresh

**Accurate Counting:**
- [ ] Create playoff game guess with tie, no penalty winner
- [ ] Verify NOT counted in dashboard
- [ ] Add penalty winner
- [ ] Verify NOW counted in dashboard
- [ ] Verify all pages (awards, qualified-teams, stats) show same count

## Validation Considerations

### SonarCloud Requirements
- **80% coverage on new code** - All new SQL logic must be tested
- **0 new issues** - SQL query must pass complexity checks
- **Security** - No SQL injection (using Kysely query builder ✅)

### Coverage Strategy
- Test all SQL query branches (playoff vs group, tie vs decisive, penalty winner vs none)
- Test revalidation calls in both server actions
- Mock test utilities usage (renderWithTheme, createMockSelectQuery, testFactories)

### Quality Gates
- All existing tests pass
- New tests for SQL query branches
- Integration tests for revalidation
- No increase in cyclomatic complexity
- Type safety maintained

## Edge Cases & Considerations

### Edge Case 1: Playoff Game Identification
**Question:** How do we reliably identify playoff games?
**Answer:** Join with `tournament_playoff_round_games` table. If `game_id` exists in that table, it's a playoff game.

### Edge Case 2: Both Penalty Winners True
**Question:** What if both `home_penalty_winner` AND `away_penalty_winner` are true?
**Answer:** This is invalid data, but our query uses OR so it would count it. The game-guess creation logic should prevent this (validation in UI/server action).

### Edge Case 3: Null vs False for Penalty Winners
**Question:** Are penalty winner fields `null` or `false` when not set?
**Answer:** Schema allows `null`. Our query checks `= true` explicitly, so both `null` and `false` are treated as "no penalty winner".

### Edge Case 4: Migration Impact
**Question:** Do we need a migration?
**Answer:** No. We're only changing query logic, not database schema. Existing data remains valid.

### Edge Case 5: Performance
**Question:** Does the extra join impact performance?
**Answer:** `tournament_playoff_round_games` is small (only playoff games, ~10-20 per tournament). LEFT JOIN is fine.
**Action:** Verify index exists on `tournament_playoff_round_games.game_id`. If missing, add migration (out of scope for this story but document as tech debt).

## Risks & Mitigation

### Risk 1: Over-Revalidation
**Impact:** Revalidating too many routes causes unnecessary re-renders
**Mitigation:** Only revalidate the specific route where prediction was made (not all tournament routes)

### Risk 2: SQL Query Complexity
**Impact:** Complex nested conditions might be hard to maintain
**Mitigation:** Add comprehensive tests, use clear comments in code, consider extracting to helper if it gets too complex

### Risk 3: Breaking Existing Functionality
**Impact:** Changing prediction count logic might break dependent features
**Mitigation:**
- Run full test suite
- Test all three pages that use the count
- Verify dashboard calculations still work

## Resolved Questions

### Q1: Should revalidation include locale segment?
**A:** Yes. Routes are `/[locale]/tournaments/[id]/...`, so revalidate both `/en/...` and `/es/...` paths.

### Q2: Does filterWhere work at row level or aggregate level?
**A:** Row level. Kysely's `.filterWhere()` filters individual rows BEFORE the count aggregation.

### Q3: Does testFactories have a playoffRoundGame method?
**A:** Need to verify. If missing, create inline during test setup using `db.insertInto('tournament_playoff_round_games')`.

### Q4: Is gameGuessesArray still needed after adding dashboardStats?
**A:** Yes. GuessesContext still needs the full array for managing game predictions. Only the count calculation changes.

## Related Code References

**Penalty winner pattern:**
- `app/utils/score-utils.tsx` - `getGuessWinner()` shows how penalty winners are used

**Playoff game detection:**
- `ExtendedGameData.playoffStage` - Present for playoff games (but we use DB join for query)

**Dashboard component:**
- `app/components/compact-prediction-dashboard.tsx` - Receives `predictedGames` prop

**Test utilities:**
- `@/__tests__/db/test-factories` - Use `testFactories.game()`, `testFactories.gameGuess()`
- `@/__tests__/db/mock-helpers` - Use `createMockSelectQuery()` for Kysely mocks
