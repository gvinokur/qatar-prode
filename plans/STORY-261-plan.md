# Implementation Plan: Fix Stats Calculation for In-Progress Tournaments

**Story:** #261 - [Fix] Stats Calculation: Accuracy & Boosts Incorrect for In-Progress Tournaments
**Type:** Bug Fix
**Priority:** High (Blocker for Head-to-Head Comparison #258)
**Estimated Effort:** 4.5 days

## Context

The stats system currently includes data that shouldn't be counted for in-progress tournaments:

### Problem 1: Accuracy Stats
Currently counts **ALL predictions** (including unplayed games), making accuracy percentages misleading.
- User predicted 50/64 games, only 30 games played
- Shows: "Accuracy: 20/50 (40%)" ❌
- Should show: "Accuracy: 20/30 (67%)" ✅

### Problem 2: Boost Stats
Currently counts **ALL boosts assigned** (including games where users can still change their boost), making boost usage stats misleading.
- User assigned 5 silver boosts: 3 games finished (locked), 2 games not yet played (active)
- Shows: "Used: 5/5 (100%)" ❌
- Should show: "Locked: 3/5 (60%), Active: 2/5 (40%)" ✅

### Why This Matters
- **User Experience:** Misleading stats confuse users about performance
- **Head-to-Head Feature:** Blocker for story #258 - comparison needs accurate stats
- **Competitive Fairness:** Users comparing stats need consistent data
- **Trust:** Incorrect stats erode confidence in platform

## Acceptance Criteria

- [ ] Accuracy stats only count predictions for games with results
- [ ] Boost stats distinguish between locked (game finished) and active (can still change) boosts
- [ ] Stats page displays total games played separately from total predictions made
- [ ] Boost Analysis Card shows locked vs active boosts when applicable
- [ ] All existing accuracy/boost tests updated and passing
- [ ] New tests cover in-progress tournament scenarios
- [ ] SonarCloud: 0 new issues, 80%+ coverage on new/modified code
- [ ] Materialized stats data updated for all users after deployment

## Visual Prototypes

### Component 1: Prediction Accuracy Card (Updated)

**Current Layout:**
```
┌───────────────────────────────────────────┐
│ Prediction Accuracy                       │
├───────────────────────────────────────────┤
│ Total Predictions: 50/64            84.2% │
│                                           │
│ Overall Accuracy                          │
│   Result Correct:      20 (40.0%)   ❌   │ <- Wrong denominator
│   Exact Score:          8 (16.0%)        │
│   Missed:              22 (44.0%)        │
└───────────────────────────────────────────┘
```

**Updated Layout:**
```
┌───────────────────────────────────────────┐
│ Prediction Accuracy                       │
├───────────────────────────────────────────┤
│ Total Predictions:           50/64        │
│ Completed:                   84.2%        │
│ Games played:           30 finished  ✅   │ <- NEW
│ * Accuracy calculated only for games      │ <- NEW note
│   with results                            │
│                                           │
│ Overall Accuracy                          │
│   Result Correct:  20/30 (66.7%)    ✅   │ <- Correct denominator
│   Exact Score:      8/30 (26.7%)         │
│   Missed:          10/30 (33.3%)         │
│                                           │
│ By Phase                                  │
│ Group Stage                               │
│   Result Correct:  15/20 (75.0%)         │
│   Exact Score:      6/20 (30.0%)         │
│ Playoff Stage                             │
│   Result Correct:   5/10 (50.0%)         │
│   Exact Score:      2/10 (20.0%)         │
└───────────────────────────────────────────┘
```

**Changes:**
- **NEW:** "Games played: X finished" row (body2, text.secondary)
- **NEW:** Explanatory note in italics (caption, text.secondary)
- **UPDATED:** Accuracy denominators changed from totalPredictionsMade to totalGamesPlayed
- **UPDATED:** Display format: "X/totalGamesPlayed (percentage)" instead of "X (percentage)"

**Material-UI Components:**
- `Card`, `CardHeader`, `CardContent` (existing)
- `Grid` container with size prop (existing)
- `Typography` variants: h6, body1, body2, caption

**State Variations:**
- **Empty state:** No predictions made - show "No predictions yet" message (existing)
- **No games played:** Games predicted but no results - show 0/0, note visible
- **Partial completion:** Some games played - show actual counts, note visible
- **All games played:** All games have results - standard display

**Responsive Considerations:**
- Mobile (< 600px): Full width, single column maintained
- Tablet/Desktop: Same layout (card is already responsive via parent StatsTabs)

---

### Component 2: Boost Analysis Card (Updated)

**Current Layout:**
```
┌───────────────────────────────────────────┐
│ Boost Analysis                            │
├───────────────────────────────────────────┤
│ Silver Boosts                             │
│   Available:              5               │
│   Used:              5 (100%)        ❌   │ <- Includes changeable
│   Scored Games:      2 (40%)              │
│   Points Earned:     6 pts                │
│   ROI:               1.2 pts              │
│                                           │
│ Golden Boosts                             │
│   Available:              2               │
│   Used:              2 (100%)        ❌   │
│   Scored Games:      1 (50%)              │
│   Points Earned:     9 pts                │
│   ROI:               4.5 pts              │
└───────────────────────────────────────────┘
```

**Updated Layout (Tournament In Progress):**
```
┌───────────────────────────────────────────┐
│ Boost Analysis                            │
├───────────────────────────────────────────┤
│ Silver Boosts                             │
│   Available:              5               │
│   Locked:            3/5             ✅   │ <- Only locked count
│   Active:      2 (can change)   ⚠️   │ <- NEW (warning color)
│   Scored Games:   2/3 (66.7%)            │ <- % of locked
│   Points Earned:     4 pts                │
│   ROI:               1.3 pts              │
│                                           │
│ Golden Boosts                             │
│   Available:              2               │
│   Locked:            1/2             ✅   │
│   Active:      1 (can change)   ⚠️   │ <- NEW
│   Scored Games:   1/1 (100%)             │
│   Points Earned:     9 pts                │
│   ROI:               9.0 pts              │
│                                           │
│ Distribution                              │
│   Silver: Group A (2), Group B (1)       │
│   Golden: Playoffs (1)                   │
└───────────────────────────────────────────┘
```

**Updated Layout (Tournament Completed):**
```
┌───────────────────────────────────────────┐
│ Boost Analysis                            │
├───────────────────────────────────────────┤
│ Silver Boosts                             │
│   Available:              5               │
│   Locked:            5/5             ✅   │ <- All locked
│   (Active row hidden - 0 active)          │ <- Hidden when 0
│   Scored Games:   3/5 (60%)              │
│   Points Earned:     6 pts                │
│   ROI:               1.2 pts              │
│                                           │
│ Golden Boosts                             │
│   Available:              2               │
│   Locked:            2/2             ✅   │
│   Scored Games:   2/2 (100%)             │
│   Points Earned:    18 pts                │
│   ROI:               9.0 pts              │
│                                           │
│ Distribution                              │
│   Silver: Group A (2), Group B (2), ...  │
│   Golden: Final (1), Semi (1)            │
└───────────────────────────────────────────┘
```

**Changes:**
- **REPLACED:** "Used" label → "Locked" label (body1, primary.light)
- **NEW:** "Active" row when activeBoosts > 0 (body2, warning.main)
- **NEW:** "(can change)" suffix for active boosts (body2, warning.main)
- **UPDATED:** Success rate denominator changed to lockedBoosts
- **CONDITIONAL:** Active row only shows when activeBoosts > 0

**Material-UI Components:**
- `Card`, `CardHeader`, `CardContent` (existing)
- `Grid` container with size prop (existing)
- `Typography` with color variants: primary.light, warning.main, success.main

**State Variations:**
- **Empty state:** No boosts used - show "No boosts assigned yet" message (existing)
- **All locked:** Tournament complete - hide "Active" row
- **Mixed locked/active:** Tournament in progress - show both rows with warning color for active
- **All active:** Tournament not started - show all as active (edge case)

**Responsive Considerations:**
- Mobile (< 600px): Full width, single column maintained
- Tablet/Desktop: Same layout (card is already responsive)
- Text wrapping: "(can change)" may wrap on very small screens - acceptable

**Color Scheme:**
- Locked boosts: Standard text colors (primary.light, text.primary)
- Active boosts: Warning color (warning.main) to indicate "can still change"
- Success metrics: Success color (success.main) for points earned

---

### Component Similarities:
Both components follow the existing pattern:
- **Card structure:** Material-UI Card with CardHeader and CardContent
- **Layout:** Grid container with 2-column layout (8/4 split for label/value)
- **Typography:** Consistent hierarchy (h6 for sections, body1 for main items, body2 for secondary)
- **Color scheme:** Existing theme colors (primary, secondary, text.secondary)
- **Spacing:** Consistent with existing cards (Grid spacing={1}, mt={2} for dividers)

---

## Technical Approach

### Phase 1: Fix Repository Functions

#### 1. Fix `legacyGetGameGuessStatisticsForUsers()` (game-guess-repository.ts, lines 64-238)

**Current Issue:** Counts all predictions regardless of game status

**Solution:** Add LEFT JOIN with `game_results` table and filter to only count games with results

**Note on game_results table:** The `game_results` table only has rows when a result is recorded. Games without results have NO row in this table (not a row with NULL). Therefore, LEFT JOIN + filter on `home_score IS NOT NULL` will correctly exclude games without results.

```typescript
export async function legacyGetGameGuessStatisticsForUsers(userIds: string[], tournamentId: string) {
  const statisticsForUsers = await db.selectFrom('game_guesses')
    .innerJoin('games', 'games.id', 'game_guesses.game_id')
    .leftJoin('game_results', 'game_results.game_id', 'games.id')  // ✅ NEW: Join results
    .where('game_guesses.user_id', 'in', userIds)
    .where('games.tournament_id', '=', tournamentId)
    .where('game_results.home_score', 'is not', null)  // ✅ NEW: Only games with results
    .select('user_id')
    .select(eb => [
      // Existing aggregations remain unchanged
      // The WHERE clause ensures only games with results are counted
    ])
    .groupBy('game_guesses.user_id')
    .execute()

  return statisticsForUsers as GameStatisticForUser[]
}
```

**Impact:**
- Materialization will automatically use fixed logic via `recalculateGameScoresForUsers()` (see Phase 5)
- Existing aggregation logic unchanged, only filtering added
- **Edge case handling:** If no games have results yet, the query returns empty array (no user stats) - UI handles this with empty state

#### 2. Fix `getBoostAllocationBreakdown()` (game-guess-repository.ts, lines 468-530)

**Current Issue:** Counts all boosts, including those on games where users can still change their selection

**Solution:**
- Query 1 & 2: Filter to only count "locked" boosts (game has result OR game_date < NOW())
- Query 3 (new): Count "active" boosts (game has no result AND game_date >= NOW())
- Return both `lockedBoosts` and `activeBoosts` separately

```typescript
export async function getBoostAllocationBreakdown(
  userId: string,
  tournamentId: string,
  boostType: 'silver' | 'golden'
): Promise<{
  byGroup: { groupLetter: string; count: number }[];
  playoffCount: number;
  totalBoosts: number;
  lockedBoosts: number;      // ✅ NEW
  activeBoosts: number;      // ✅ NEW
  scoredGamesCount: number;
  totalPointsEarned: number;
}> {
  // Query 1: Group stage boosts (LOCKED only)
  const groupBoosts = await db
    .selectFrom('game_guesses as gg')
    .innerJoin('games as g', 'g.id', 'gg.game_id')
    .leftJoin('game_results as gr', 'gr.game_id', 'g.id')
    .innerJoin('tournament_group_games as tgg', 'tgg.game_id', 'g.id')
    .innerJoin('tournament_groups as tg', 'tg.id', 'tgg.tournament_group_id')
    .where('gg.user_id', '=', userId)
    .where('g.tournament_id', '=', tournamentId)
    .where('gg.boost_type', '=', boostType)
    .where((eb) => eb.or([
      eb('gr.home_score', 'is not', null),  // Has result
      eb('g.game_date', '<', sql`NOW()`)     // Game started/closed
    ]))
    // ... rest of query

  // Query 2: Playoff boosts (LOCKED only) - similar filter

  // Query 3: Active boosts (NEW)
  const activeBoostsCount = await db
    .selectFrom('game_guesses as gg')
    .innerJoin('games as g', 'g.id', 'gg.game_id')
    .leftJoin('game_results as gr', 'gr.game_id', 'g.id')
    .where('gg.user_id', '=', userId)
    .where('g.tournament_id', '=', tournamentId)
    .where('gg.boost_type', '=', boostType)
    .where((eb) => eb.and([
      eb('gr.home_score', 'is', null),      // No result
      eb('g.game_date', '>=', sql`NOW()`)   // Game not started
    ]))
    .select(eb => eb.fn.countAll().as('count'))
    .executeTakeFirst();

  // NOTE on game_date timing:
  // - game_date is the scheduled kick-off time (when the game starts)
  // - Predictions are locked AT game start time (game_date)
  // - "Active" boost = game_date in future (user can still change boost)
  // - "Locked" boost = game_date passed OR result exists (boost decision is final)
  // - This means there's a brief window between game start and result entry where
  //   the boost is "locked" (can't change) but not yet scored (no result).
  //   This is acceptable - we count it as locked because the decision is final.

  // Calculate results
  const lockedBoosts = byGroup.reduce((sum, g) => sum + g.count, 0) + playoffCount;
  const activeBoosts = activeBoostsCount ? Number(activeBoostsCount.count) : 0;
  const totalBoosts = lockedBoosts + activeBoosts;

  return {
    byGroup,
    playoffCount,
    totalBoosts,
    lockedBoosts,      // ✅ NEW
    activeBoosts,      // ✅ NEW
    scoredGamesCount,
    totalPointsEarned,
  };
}
```

### Phase 2: Update Stats Page (tournaments/[id]/stats/page.tsx)

#### 1. Update Type Definitions

```typescript
type AccuracyStats = {
  readonly totalPredictionsMade: number
  readonly totalGamesAvailable: number
  readonly totalGamesPlayed: number       // ✅ NEW
  readonly completionPercentage: number
  // ... rest unchanged
}

type BoostStats = {
  readonly boostType: 'silver' | 'golden'
  readonly available: number
  readonly totalBoosts: number           // ✅ RENAMED (was: used)
  readonly lockedBoosts: number          // ✅ NEW
  readonly activeBoosts: number          // ✅ NEW
  readonly usedPercentage: number
  // ... rest unchanged
}
```

#### 2. Update Calculations

```typescript
// Calculate total games played (games with results)
// NOTE: findGamesInTournament() exists at app/db/game-repository.ts line 26
// It returns ExtendedGameData[] with gameResult field
const allGames = await findGamesInTournament(tournamentId)
const totalGamesAvailable = allGames.length
const totalGamesPlayed = allGames.filter(g => g.gameResult?.home_score != null).length

// Update calculateAccuracyStats to accept totalGamesPlayed
const accuracyStats = calculateAccuracyStats(
  userGameStats,
  totalPredictionsMade,
  totalGamesAvailable,
  totalGamesPlayed  // ✅ NEW parameter
)

// Update calculateBoostStats to handle new fields
const silverBoostStats = calculateBoostStats(silverBoostData, tournament.max_silver_games, 'silver')
```

#### 3. Update Helper Functions

```typescript
function calculateAccuracyStats(
  userGameStats: GameStatisticForUser | null,
  totalPredictionsMade: number,
  totalGamesAvailable: number,
  totalGamesPlayed: number  // ✅ NEW
): AccuracyStats {
  const overallCorrect = userGameStats?.total_correct_guesses ?? 0
  const overallExact = userGameStats?.total_exact_guesses ?? 0

  // ✅ EDGE CASE: Division by zero when no games played
  // calculatePercentage already handles denominator = 0 (returns 0)
  // But we ensure percentages are based on totalGamesPlayed, not totalPredictionsMade
  return {
    totalPredictionsMade,
    totalGamesAvailable,
    totalGamesPlayed,  // ✅ NEW
    completionPercentage: calculatePercentage(totalPredictionsMade, totalGamesAvailable),
    overallCorrect,
    overallCorrectPercentage: calculatePercentage(overallCorrect, totalGamesPlayed),  // Changed denominator
    overallExact,
    overallExactPercentage: calculatePercentage(overallExact, totalGamesPlayed),
    overallMissed: totalGamesPlayed - overallCorrect,  // ✅ Changed to use totalGamesPlayed
    overallMissedPercentage: calculatePercentage(totalGamesPlayed - overallCorrect, totalGamesPlayed),
    // ... rest updated similarly with totalGamesPlayed denominator
  }
}

function calculateBoostStats(
  boostData: { totalBoosts, lockedBoosts, activeBoosts, scoredGamesCount, totalPointsEarned, byGroup, playoffCount },
  maxGames: number | null | undefined,
  boostType: 'silver' | 'golden'
): BoostStats {
  const available = maxGames ?? 0

  // ✅ EDGE CASE: Division by zero when no locked boosts
  // calculatePercentage handles this (returns 0)
  return {
    boostType,
    available,
    totalBoosts: boostData.totalBoosts,
    lockedBoosts: boostData.lockedBoosts,     // ✅ NEW
    activeBoosts: boostData.activeBoosts,     // ✅ NEW
    usedPercentage: calculatePercentage(boostData.lockedBoosts, available),  // Changed to locked only
    scoredGames: boostData.scoredGamesCount,
    successRate: calculatePercentage(boostData.scoredGamesCount, boostData.lockedBoosts),  // Changed denominator
    pointsEarned: boostData.totalPointsEarned,
    roi: boostData.lockedBoosts > 0 ? Math.round((boostData.totalPointsEarned / boostData.lockedBoosts) * 10) / 10 : 0,
    allocationByGroup: boostData.byGroup,
    allocationPlayoffs: boostData.playoffCount,
  }
}
```

### Phase 3: Update UI Components

#### 1. Prediction Accuracy Card (prediction-accuracy-card.tsx)

**Changes:**
- Add `totalGamesPlayed` to props
- Display "Games played: X finished" below total predictions
- Add note: "* Accuracy calculated only for games with results"
- Update display to show "X / totalGamesPlayed" instead of "X / totalPredictionsMade"

```typescript
type Props = {
  readonly totalGamesPlayed: number  // ✅ NEW
  // ... rest unchanged
}

// Display changes:
<Grid size={8}>
  <Typography variant='body2' color='text.secondary'>
    {t('accuracy.gamesPlayed')}
  </Typography>
</Grid>
<Grid size={4}>
  <Typography variant='body2' color='text.secondary' align='right'>
    {props.totalGamesPlayed} {t('accuracy.finished')}
  </Typography>
</Grid>

// Add note
<Grid size={12}>
  <Typography variant='caption' color='text.secondary' sx={{ fontStyle: 'italic' }}>
    {t('accuracy.note')}
  </Typography>
</Grid>

// Update accuracy display
{props.overallCorrect} / {props.totalGamesPlayed} ({props.overallCorrectPercentage.toFixed(1)}%)
```

#### 2. Boost Analysis Card (boost-analysis-card.tsx)

**Changes:**
- Add `totalBoosts`, `lockedBoosts`, `activeBoosts` to props
- Replace "Used" with "Locked" label
- Add "Active" row when `activeBoosts > 0`
- Update success rate calculation to use locked boosts only

```typescript
type Props = {
  readonly silverBoost: {
    readonly totalBoosts: number       // ✅ NEW
    readonly lockedBoosts: number      // ✅ NEW
    readonly activeBoosts: number      // ✅ NEW
    // ... rest unchanged
  }
  // ... same for goldenBoost
}

// Display changes:
<Grid size={8}>
  <Typography variant='body1' color='primary.light' sx={{ pl: 2 }}>
    {t('boosts.locked')}
  </Typography>
</Grid>
<Grid size={4}>
  <Typography variant='body1' fontWeight={700} align='right'>
    {props.silverBoost.lockedBoosts} / {props.silverBoost.available}
  </Typography>
</Grid>

{props.silverBoost.activeBoosts > 0 && (
  <>
    <Grid size={8}>
      <Typography variant='body2' color='warning.main' sx={{ pl: 2 }}>
        {t('boosts.active')}
      </Typography>
    </Grid>
    <Grid size={4}>
      <Typography variant='body2' fontWeight={700} color='warning.main' align='right'>
        {props.silverBoost.activeBoosts} {t('boosts.canChange')}
      </Typography>
    </Grid>
  </>
)}

// Update success rate display
{props.silverBoost.scoredGames} / {props.silverBoost.lockedBoosts} ({props.silverBoost.successRate.toFixed(1)}%)
```

### Phase 4: Add Translations

#### Add to messages/en.json:
```json
{
  "stats": {
    "accuracy": {
      "gamesPlayed": "Games played",
      "finished": "finished",
      "note": "* Accuracy calculated only for games with results"
    },
    "boosts": {
      "locked": "Locked",
      "active": "Active",
      "canChange": "(can change)"
    }
  }
}
```

#### Add to messages/es.json:
```json
{
  "stats": {
    "accuracy": {
      "gamesPlayed": "Partidos jugados",
      "finished": "finalizados",
      "note": "* Precisión calculada solo para partidos con resultados"
    },
    "boosts": {
      "locked": "Bloqueados",
      "active": "Activos",
      "canChange": "(se pueden cambiar)"
    }
  }
}
```

### Phase 5: Data Migration (Post-Deployment)

#### Materialization Workflow Context

The system uses **materialized columns** in the `tournament_guesses` table for performance:
- Function `recalculateGameScoresForUsers()` (in `app/db/tournament-guess-repository.ts`) calls `legacyGetGameGuessStatisticsForUsers()`
- Results are stored in materialized columns: `total_game_score`, `total_correct_guesses`, etc.
- When we fix `legacyGetGameGuessStatisticsForUsers`, the materialization function automatically uses the corrected logic
- **Current stats page reads from materialized columns** via `getGameGuessStatisticsForUsers()` (lines 250-282 in game-guess-repository.ts)

#### Migration Steps (Asynchronous - Don't Block Deployment)

**1. Deploy code changes** (repository fixes + UI updates)

**2. Run materialization script** (background job after deployment):
```bash
# Run in production after deploy (non-blocking)
npm run recalculate-stats
```

This triggers `recalculateGameScoresForUsers()` for all users, which:
- Calls the fixed `legacyGetGameGuessStatisticsForUsers()`
- Updates materialized columns with correct values
- Stores results in `tournament_guesses` table

**3. Migration verification:**
```bash
# Random sample verification (before migration)
SELECT user_id, total_correct_guesses, total_game_score
FROM tournament_guesses
WHERE tournament_id = 'fifa-2026'
LIMIT 10;

# Run migration
npm run recalculate-stats

# Verify same users (after migration)
SELECT user_id, total_correct_guesses, total_game_score
FROM tournament_guesses
WHERE tournament_id = 'fifa-2026'
AND user_id IN ('<user-ids-from-sample>');

# Compare: total_correct_guesses should be <= previous value (some predictions now excluded)
```

**4. Timing & monitoring:**
- **Estimated time:** ~5-10 minutes for 1000 users (depends on DB size)
- **Monitoring:** Watch logs for completion, check for errors
- **Alert on failure:** If migration fails, stats will show old values (acceptable temporarily)

**5. Rollback plan:**
- If migration reveals data issues: Revert code, re-run with old logic
- Stats page uses materialized columns, so reverting code doesn't break UI
- Can re-run migration after fixing issues

#### Translation Keys Registration

**Note:** This project uses `next-intl` with automatic key discovery from JSON files. New keys in `messages/en.json` and `messages/es.json` are automatically available. No registration in `i18n.config.ts` is needed unless creating a NEW namespace.

**For this story:** All keys added to existing `stats` namespace (verified to exist in messages/en.json - used by current accuracy/boost cards), so no registration required.

**Verification step:** Before implementation, confirm `stats.accuracy.*` and `stats.boosts.*` keys exist in current messages files. If not, add namespace to i18n.config.ts.

## Files to Create/Modify

### Repository Layer
- `app/db/game-guess-repository.ts` (MODIFY)
  - Fix `legacyGetGameGuessStatisticsForUsers()` - Add game_results filter
  - Fix `getBoostAllocationBreakdown()` - Add locked/active split

### Stats Page
- `app/[locale]/tournaments/[id]/stats/page.tsx` (MODIFY)
  - Update type definitions (AccuracyStats, BoostStats)
  - Add totalGamesPlayed calculation
  - Update calculateAccuracyStats helper
  - Update calculateBoostStats helper

### UI Components
- `app/components/tournament-stats/prediction-accuracy-card.tsx` (MODIFY)
  - Add totalGamesPlayed prop
  - Add "Games played" display
  - Add accuracy note
  - Update accuracy display format

- `app/components/tournament-stats/boost-analysis-card.tsx` (MODIFY)
  - Add totalBoosts, lockedBoosts, activeBoosts props
  - Replace "Used" with "Locked"
  - Add "Active" display when applicable
  - Update success rate calculation

### Translations
- `messages/en.json` (MODIFY) - Add accuracy.gamesPlayed, accuracy.finished, accuracy.note, boosts.locked, boosts.active, boosts.canChange
- `messages/es.json` (MODIFY) - Add Spanish translations

## Testing Strategy

### Unit Tests

#### Repository Tests
1. **Test `legacyGetGameGuessStatisticsForUsers` with mixed game states**
   - File: `__tests__/db/game-guess-repository.test.ts`
   - Scenario: Tournament with 10 games total, 6 games with results, 4 games no results
   - Mock user predictions: 8 games predicted (4 with results, 4 without results)
   - Assert: Only 4 predictions counted (those with results)
   - Assert: Accuracy stats reflect only played games

2. **Test `legacyGetGameGuessStatisticsForUsers` with NO played games (EDGE CASE)**
   - File: `__tests__/db/game-guess-repository.test.ts`
   - Scenario: Tournament with 10 games, 0 games with results (all pending)
   - Mock user predictions: 5 games predicted (none have results)
   - Assert: Query returns empty array (no user stats)
   - Assert: totalGamesPlayed = 0, UI shows "No games played yet" state

3. **Test `legacyGetGameGuessStatisticsForUsers` with game_results table structure**
   - File: `__tests__/db/game-guess-repository.test.ts`
   - Scenario: Mix of games with/without game_results rows
   - Mock: 3 games have game_results rows with scores, 7 games have NO game_results rows
   - Assert: Only the 3 games with results rows are counted
   - Verifies LEFT JOIN + NULL filter works correctly

4. **Test `getBoostAllocationBreakdown` with locked/active split**
   - File: `__tests__/db/game-guess-repository.test.ts`
   - Scenario: 5 silver boosts assigned - 3 games finished, 2 games future
   - Assert: `lockedBoosts: 3, activeBoosts: 2, totalBoosts: 5`
   - Assert: Success rate based on locked boosts only

5. **Test `getBoostAllocationBreakdown` with NO active boosts (EDGE CASE)**
   - File: `__tests__/db/game-guess-repository.test.ts`
   - Scenario: All boosts assigned to finished games
   - Assert: `activeBoosts: 0` (not NULL)
   - Assert: `activeBoostsCount` NULL case handled correctly

6. **Test `getBoostAllocationBreakdown` with NO locked boosts (EDGE CASE)**
   - File: `__tests__/db/game-guess-repository.test.ts`
   - Scenario: All boosts assigned to future games
   - Assert: `lockedBoosts: 0, activeBoosts: 5`
   - Assert: successRate = 0 (no division by zero error)

#### Component Tests
1. **Test PredictionAccuracyCard with new fields**
   - File: `__tests__/components/tournament-stats/prediction-accuracy-card.test.tsx`
   - Test "Games played" display
   - Test accuracy note display
   - Test percentages based on totalGamesPlayed

2. **Test PredictionAccuracyCard with NO games played (EDGE CASE)**
   - File: `__tests__/components/tournament-stats/prediction-accuracy-card.test.tsx`
   - Props: totalGamesPlayed = 0, totalPredictionsMade = 5
   - Assert: Display shows "0/0" for accuracy (not error)
   - Assert: Percentages show "0.0%" (calculatePercentage handles denominator = 0)

3. **Test BoostAnalysisCard with locked/active split**
   - File: `__tests__/components/tournament-stats/boost-analysis-card.test.tsx`
   - Test "Locked" display
   - Test "Active" display when activeBoosts > 0
   - Test "Active" hidden when activeBoosts = 0
   - Test success rate calculation

4. **Test BoostAnalysisCard with NO locked boosts (EDGE CASE)**
   - File: `__tests__/components/tournament-stats/boost-analysis-card.test.tsx`
   - Props: lockedBoosts = 0, activeBoosts = 3
   - Assert: Success rate shows "0/0 (0.0%)" (no division by zero)
   - Assert: "Active" row visible with warning color

5. **Test BoostAnalysisCard with ALL locked, no active (EDGE CASE)**
   - File: `__tests__/components/tournament-stats/boost-analysis-card.test.tsx`
   - Props: lockedBoosts = 5, activeBoosts = 0
   - Assert: "Active" row hidden (not displayed)
   - Assert: Success rate based on locked boosts

### Integration Tests

1. **Test Stats Page with in-progress tournament**
   - Create tournament with mixed game states
   - Create user predictions
   - Verify accuracy calculations correct
   - Verify boost calculations correct

### Manual Testing Checklist

**Pre-deployment:**
- [ ] Verify unit tests all pass
- [ ] Check SonarCloud: 0 new issues, 80%+ coverage
- [ ] Test locally with FIFA 2026 data (in-progress tournament)

**Post-deployment:**
- [ ] Run materialization script
- [ ] Spot-check user stats on production (compare old vs new)
- [ ] Verify Head-to-Head comparison (#258) can proceed

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing features | High | Comprehensive testing before deploy, all tests must pass |
| Users confused by stat changes | Medium | Add explanatory text in UI ("* Accuracy calculated only...") |
| Performance impact of additional queries | Low | Left join is efficient, minimal impact |
| Migration takes too long | Low | Run in background after deploy, doesn't block app |
| Active boosts query adds complexity | Medium | Thorough testing, clear separation of locked/active logic |

## Validation Considerations

### SonarCloud Requirements
- Target: 80% coverage on new/modified code
- 0 new issues of any severity
- Focus areas:
  - Repository function edge cases (no games, no results, no boosts)
  - Component prop validation
  - Translation key coverage

### Quality Gates
- All existing tests must pass
- New tests must cover:
  - In-progress tournament scenarios
  - Edge cases (no predictions, no boosts, all games played)
  - UI component rendering with new fields

## Success Metrics

✅ **Accuracy stats only count played games** - Percentages based on games with results
✅ **Boost stats distinguish locked vs active** - Clear separation in UI
✅ **Head-to-Head comparison (#258) unblocked** - Accurate stats available for comparison
✅ **No user complaints** - Stats make intuitive sense
✅ **All tests passing** - 80%+ coverage, 0 new SonarCloud issues

## Dependencies

**Blocks:** #258 (Head-to-Head Comparison)

**Required before implementation:**
- None

**Required for deployment:**
- Database access for migration script

## Open Questions

1. **Should we show "X games pending results" explicitly in the UI?**
   - Recommendation: Not in this story - keep it simple. Users can infer from "Games played: X finished"

2. **Should boost "Active" be called "Pending" or "Assigned"?**
   - Recommendation: "Active" (matches the idea that they're still changeable/active)

3. **Do we backfill historical tournaments?**
   - Recommendation: Yes, run migration for all tournaments to ensure consistency

4. **Should we add a warning when comparing stats between users if one has more games played?**
   - Recommendation: Out of scope for this story, address in #258

## Implementation Steps

1. **Repository fixes** (1 day)
   - Fix `legacyGetGameGuessStatisticsForUsers`
   - Fix `getBoostAllocationBreakdown`
   - Update return types

2. **Stats page updates** (0.5 day)
   - Update type definitions
   - Update calculations
   - Update helper functions

3. **UI component updates** (0.5 day)
   - Update PredictionAccuracyCard
   - Update BoostAnalysisCard

4. **Translations** (0.5 day)
   - Add English translations
   - Add Spanish translations

5. **Testing** (2 days)
   - Write repository tests
   - Write component tests
   - Write integration tests
   - Manual testing

6. **Post-deployment** (0.5 day)
   - Run migration script
   - Monitor and verify

**Total: 4.5 days**
