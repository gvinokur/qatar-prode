# Implementation Plan: Story #214 - Predictions Dashboard: Auto-Recalculation & Incomplete Game Guess Counting Issues

## Context

The Compact Prediction Dashboard component has architectural issues causing performance problems and data accuracy bugs:

**Problem 1: Dashboard is coupled to GuessesContext**
- Dashboard uses `useContext(GuessesContext)` to get `gameGuesses` and `boostCounts`
- Not reusable - tightly coupled to context
- Pages fetch unnecessary data just to populate context for dashboard

**Problem 2: Qualified Teams page fetches ALL game guesses unnecessarily**
- Fetches all game guesses via `findGameGuessesByUserId()` (line 194)
- Only needed for dashboard display, not the page itself
- Unnecessary database query and data transfer

**Problem 3: Awards page fetches ALL game guesses unnecessarily**
- Fetches all game guesses via `findGameGuessesByUserId()` (line 51)
- Only needed for dashboard display, not the page itself
- Unnecessary database query and data transfer

**Problem 4: Data accuracy bug in `getPredictionDashboardStats()`**
- Counts incomplete playoff game guesses as complete
- Missing validation: playoff ties without penalty winner selection
- Current validation only checks `home_score` and `away_score` are not null (lines 420-421)
- For playoff games with tied scores, must also validate penalty winner selected

**Solution:**
1. Fix repository function to validate playoff tie completeness
2. Make dashboard a pure component receiving all data as props
3. Eliminate unnecessary data fetching on Qualified Teams and Awards pages
4. Update Home page to use `getPredictionDashboardStats()` repository function

## Acceptance Criteria

### Data Accuracy
- [ ] Playoff ties without penalty winner NOT counted as complete predictions
- [ ] Playoff ties with penalty winner ARE counted as complete predictions
- [ ] Group stage games counted correctly (no regression)

### Performance
- [ ] Qualified Teams page does NOT fetch game guesses
- [ ] Awards page does NOT fetch game guesses
- [ ] Home page uses `getPredictionDashboardStats()` for efficient data fetching

### Architecture
- [ ] Dashboard component has NO context dependencies
- [ ] All data passed explicitly via props
- [ ] Dashboard is pure and reusable

## Technical Approach

### Part 1: Fix Repository Function - Validate Playoff Ties

**File:** `app/db/game-guess-repository.ts`

Update `getPredictionDashboardStats()` (lines 396-442):

```typescript
export async function getPredictionDashboardStats(
  userId: string,
  tournamentId: string
): Promise<{
  totalGames: number;
  predictedGames: number;
  silverUsed: number;
  goldenUsed: number;
}> {
  const stats = await db
    .selectFrom('games')
    .leftJoin('game_guesses', (join) =>
      join
        .onRef('game_guesses.game_id', '=', 'games.id')
        .on('game_guesses.user_id', '=', userId)
    )
    // ✅ ADD: Join to identify playoff games
    .leftJoin('tournament_playoff_round_games',
      'tournament_playoff_round_games.game_id',
      'games.id'
    )
    .where('games.tournament_id', '=', tournamentId)
    .select((eb) => [
      eb.fn.countAll<number>().as('total_games'),

      // ✅ UPDATE: Validate playoff ties
      eb.fn
        .count<number>('game_guesses.id')
        .filterWhere('game_guesses.home_score', 'is not', null)
        .filterWhere('game_guesses.away_score', 'is not', null)
        .filterWhere((eb) =>
          eb.or([
            // Not a playoff game
            eb('tournament_playoff_round_games.game_id', 'is', null),
            // Playoff game with decisive score (no tie)
            eb('game_guesses.home_score', '!=', eb.ref('game_guesses.away_score')),
            // Playoff tie with penalty winner selected (exactly one winner)
            eb.and([
              eb('game_guesses.home_score', '=', eb.ref('game_guesses.away_score')),
              eb.or([
                // Home penalty winner selected (and not away)
                eb.and([
                  eb('game_guesses.home_penalty_winner', '=', true),
                  eb.or([
                    eb('game_guesses.away_penalty_winner', 'is', null),
                    eb('game_guesses.away_penalty_winner', '=', false)
                  ])
                ]),
                // Away penalty winner selected (and not home)
                eb.and([
                  eb('game_guesses.away_penalty_winner', '=', true),
                  eb.or([
                    eb('game_guesses.home_penalty_winner', 'is', null),
                    eb('game_guesses.home_penalty_winner', '=', false)
                  ])
                ])
              ])
            ])
          ])
        )
        .as('predicted_games'),

      // Boost counts (unchanged)
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

  return {
    totalGames: Number(stats.total_games),
    predictedGames: Number(stats.predicted_games),
    silverUsed: Number(stats.silver_used),
    goldenUsed: Number(stats.golden_used),
  };
}
```

**Pattern used:**
- Similar to existing playoff joins in `app/db/game-repository.ts:40-46` and `app/db/tournament-prediction-completion-repository.ts:43-44`

**Schema verification needed:**
- Confirm `game_guesses` table has `home_penalty_winner` and `away_penalty_winner` boolean columns
- Validation ensures EXACTLY ONE penalty winner is selected (not both, not neither)

**Note on Boost Counts Architecture:**
- Repository returns `silverUsed` and `goldenUsed` (counts from game_guesses table)
- Max values (`silverMax`, `goldenMax`) come from tournament record (`tournament.max_silver_games`, `tournament.max_golden_games`)
- This architectural split is intentional: usage comes from guesses, limits come from tournament config

### Part 2: Make Dashboard Pure Component

**File:** `app/components/compact-prediction-dashboard.tsx`

**Update props interface:**

```typescript
interface CompactPredictionDashboardProps {
  // Games (existing - keep)
  readonly totalGames: number;
  readonly predictedGames: number;

  // Tournament Predictions (existing - keep)
  readonly tournamentPredictions?: TournamentPredictionCompletion;
  readonly tournamentId?: string;
  readonly tournamentStartDate?: Date;

  // Games data (existing - keep for popovers)
  readonly games?: ExtendedGameData[];
  readonly teamsMap?: Record<string, Team>;
  readonly isPlayoffs?: boolean;

  // ✅ ADD: Boost data (replace context usage)
  readonly silverBoostUsed: number;
  readonly silverBoostMax: number;
  readonly goldenBoostUsed: number;
  readonly goldenBoostMax: number;

  // ✅ ADD: Game guesses (for urgency and popover)
  readonly gameGuesses: Record<string, any>;

  // Demo mode (existing - keep)
  readonly demoMode?: boolean;
}
```

**Remove context dependency:**

```typescript
// ❌ REMOVE line 43
const { gameGuesses, boostCounts } = useContext(GuessesContext);

// ✅ Use props instead
const boostCounts = {
  silver: { used: silverBoostUsed, max: silverBoostMax },
  golden: { used: goldenBoostUsed, max: goldenBoostMax }
};
```

### Part 3: Update Home Page (UnifiedGamesPage)

**File:** `app/components/unified-games-page.tsx`

Currently fetches `dashboardStats` but doesn't use it (line 34).

**Update to pass dashboard stats as props:**

```typescript
// Line 34 - Already fetches this, just need to use it
const dashboardStats = await getPredictionDashboardStats(user.id, tournamentId);

// Pass to UnifiedGamesPageClient (add to props)
<UnifiedGamesPageClient
  games={games}
  // ... existing props ...
  dashboardStats={dashboardStats}  // ✅ ADD
/>
```

**File:** `app/components/unified-games-page-client.tsx`

Update component to accept `dashboardStats` and pass to dashboard:

```typescript
// Add to props interface
readonly dashboardStats: {
  totalGames: number;
  predictedGames: number;
  silverUsed: number;
  goldenUsed: number;
};

// ❌ REMOVE manual calculation (lines 57-61)
// Current code manually counts predicted games like this:
// const predictedGames = games.filter(game => {
//   const guess = guessesContext.gameGuesses[game.id];
//   return guess && guess.home_score !== null && guess.away_score !== null;
// }).length;
// This is REMOVED - use repository calculation instead

// ✅ Use dashboardStats from repository (accurate with playoff validation)

// Pass to CompactPredictionDashboard
<CompactPredictionDashboard
  totalGames={dashboardStats.totalGames}
  predictedGames={dashboardStats.predictedGames}  // From repository, not manual calc
  silverBoostUsed={dashboardStats.silverUsed}
  silverBoostMax={tournament.max_silver_games || 0}
  goldenBoostUsed={dashboardStats.goldenUsed}
  goldenBoostMax={tournament.max_golden_games || 0}
  gameGuesses={guessesContext.gameGuesses}  // Still needed for urgency + popovers
  tournamentPredictions={tournamentPredictionCompletion}
  tournamentId={tournamentId}
  tournamentStartDate={tournamentStartDate}
  games={games}
  teamsMap={teamsMap}
  isPlayoffs={rounds.some(r => !r.is_third_place)}
/>
```

**Note:**
- `gameGuesses` from context is still needed for urgency calculation and popover display
- Repository's `predictedGames` is more accurate (includes playoff validation)
- Manual calculation would miss incomplete playoff ties

### Part 4: Update Qualified Teams Page

**File:** `app/[locale]/tournaments/[id]/qualified-teams/page.tsx`

**Remove unnecessary fetches (lines 192-194):**

```typescript
// ❌ REMOVE these lines:
const [games, gameGuessesArray, tournamentPredictionCompletion, teamsMap] = await Promise.all([
  getAllTournamentGames(tournamentId),
  findGameGuessesByUserId(user.id, tournamentId),  // ❌ NOT NEEDED
  getTournamentPredictionCompletion(user.id, tournamentId, tournament),
  getTeamsMap(tournamentId)
]);
```

**Replace with minimal fetch:**

```typescript
// ✅ Only fetch what's actually needed
const [tournamentPredictionCompletion, teamsMap] = await Promise.all([
  getTournamentPredictionCompletion(user.id, tournamentId, tournament),
  getTeamsMap(tournamentId)
]);

// ✅ Calculate tournament start from predictions or tournament data
const tournamentStartDate = tournament.start_date || undefined;
```

**Update props passed to client (lines 234-238):**

```typescript
<QualifiedTeamsClientPage
  // ... existing props ...
  tournamentPredictionCompletion={tournamentPredictionCompletion}
  tournamentStartDate={tournamentStartDate}
  teamsMap={teamsMap}
  // ❌ REMOVE: games, gameGuessesArray
/>
```

**File:** `app/components/qualified-teams/qualified-teams-client-page.tsx`

**Update props interface (remove lines 58-59):**

```typescript
// ❌ REMOVE these props:
readonly games: any[];
readonly gameGuessesArray: any[];

// Keep these:
readonly tournamentPredictionCompletion: any;
readonly tournamentStartDate?: Date;
readonly teamsMap: Record<string, Team>;
```

**Update dashboard usage (find where CompactPredictionDashboard is rendered):**

```typescript
// ✅ Pass only tournament predictions (no game data)
<CompactPredictionDashboard
  totalGames={0}  // Not showing game predictions on this page
  predictedGames={0}
  silverBoostUsed={0}  // Not applicable
  silverBoostMax={0}
  goldenBoostUsed={0}
  goldenBoostMax={0}
  gameGuesses={{}}  // Empty - no games on this page
  tournamentPredictions={tournamentPredictionCompletion}
  tournamentId={tournament.id}
  tournamentStartDate={tournamentStartDate}
  teamsMap={teamsMap}
  // ❌ Do NOT pass games/isPlayoffs - not needed on this page
/>
```

**Note on zero-game rendering:**
- Dashboard will only show tournament prediction row
- Game prediction row is conditionally rendered in component (check line 124-137)
- When `totalGames === 0`, game row won't render
- Popover won't open since there's no game row to click
- Boost display is controlled by `showBoosts` (line 52): `const showBoosts = boostCounts.silver.max > 0 || boostCounts.golden.max > 0`
- With `silverBoostMax={0}` and `goldenBoostMax={0}`, boost section won't render

### Part 5: Update Awards Page

**File:** `app/[locale]/tournaments/[id]/awards/page.tsx`

**Remove unnecessary fetches (lines 50-51):**

```typescript
// ❌ REMOVE from Promise.all:
games,           // Line 50 - NOT NEEDED
gameGuessesArray // Line 51 - NOT NEEDED
```

**Updated parallel fetch (lines 43-52):**

❌ **DO NOT ADD** `tournamentPredictionCompletion` fetch - it's already fetched at lines 60-62:
```typescript
const tournamentPredictionCompletion = tournament
  ? await getTournamentPredictionCompletion(user.id, params.id, tournament)
  : null
```

**Just use the existing fetch** - no changes needed to Promise.all array.

Only change: Remove `games` and `gameGuessesArray` from the existing Promise.all (lines 50-51).

**Update props passed to AwardsPanel (lines 88-92):**

```typescript
<AwardsPanel
  // ... existing props ...
  tournamentPredictionCompletion={tournamentPredictionCompletion}
  tournamentStartDate={tournamentStartDate}
  teamsMap={teamsMap}
  // ❌ REMOVE: games, gameGuessesArray
/>
```

**File:** `app/components/awards/award-panel.tsx`

**Update props interface (remove lines 38-39):**

```typescript
// ❌ REMOVE these props:
readonly games: any[];
readonly gameGuessesArray: any[];

// Keep these:
readonly tournamentPredictionCompletion: any;
readonly tournamentStartDate: Date;
readonly teamsMap: Record<string, Team>;
```

**Update dashboard usage (find where CompactPredictionDashboard is rendered):**

```typescript
// ✅ Pass only tournament predictions (no game data)
<CompactPredictionDashboard
  totalGames={0}  // Not showing game predictions on this page
  predictedGames={0}
  silverBoostUsed={0}  // Not applicable
  silverBoostMax={0}
  goldenBoostUsed={0}
  goldenBoostMax={0}
  gameGuesses={{}}  // Empty - no games on this page
  tournamentPredictions={tournamentPredictionCompletion}
  tournamentId={tournament.id}
  tournamentStartDate={tournamentStartDate}
  teamsMap={teamsMap}
/>
```

### Part 6: Remove GuessesContextProvider Wrapper (Qualified Teams & Awards)

Both pages currently wrap the dashboard in GuessesContextProvider even though it's no longer needed.

**File:** `app/components/qualified-teams/qualified-teams-client-page.tsx`

Find where dashboard is rendered - if wrapped in `GuessesContextProvider`, remove the wrapper:

```typescript
// ❌ REMOVE wrapper if exists:
<GuessesContextProvider gameGuesses={gameGuesses} ...>
  <CompactPredictionDashboard ... />
</GuessesContextProvider>

// ✅ Direct render:
<CompactPredictionDashboard ... />
```

**File:** `app/components/awards/award-panel.tsx`

Same approach - remove `GuessesContextProvider` wrapper if it exists.

**Note:** Home page KEEPS GuessesContextProvider because it's used for the entire games list, not just the dashboard.

## Files to Create/Modify

### Database Repository
- [x] `app/db/game-guess-repository.ts` - Fix `getPredictionDashboardStats()` (lines 396-442)

### Core Component
- [x] `app/components/compact-prediction-dashboard.tsx` - Make pure component

### Home Page
- [x] `app/components/unified-games-page.tsx` - Pass dashboardStats to client
- [x] `app/components/unified-games-page-client.tsx` - Accept dashboardStats, pass to dashboard

### Qualified Teams Page
- [x] `app/[locale]/tournaments/[id]/qualified-teams/page.tsx` - Remove game fetches
- [x] `app/components/qualified-teams/qualified-teams-client-page.tsx` - Update props, remove wrapper

### Awards Page
- [x] `app/[locale]/tournaments/[id]/awards/page.tsx` - Remove game fetches
- [x] `app/components/awards/award-panel.tsx` - Update props, remove wrapper

### Testing
- [x] `app/db/__tests__/game-guess-repository.test.ts` - Add playoff tie validation tests
- [x] `app/components/__tests__/compact-prediction-dashboard.test.tsx` - Update for pure component
- [x] Integration tests for each page

## Implementation Steps

### Phase 1: Fix Repository Function (Foundation)
1. Update `getPredictionDashboardStats()` to join with `tournament_playoff_round_games`
2. Add playoff tie validation logic
3. Write tests for playoff scenarios

### Phase 2: Make Dashboard Pure Component
1. Update props interface to accept boost data and gameGuesses
2. Remove `useContext(GuessesContext)` usage
3. Calculate `boostCounts` from props
4. Update tests

### Phase 3: Update Home Page
1. Pass `dashboardStats` from UnifiedGamesPage to client
2. Update client to use `dashboardStats` instead of manual calculation
3. Pass boost data and gameGuesses to dashboard

### Phase 4: Update Qualified Teams Page
1. Remove `getAllTournamentGames` and `findGameGuessesByUserId` fetches
2. Update props passed to client component
3. Update client to render dashboard with minimal data
4. Remove GuessesContextProvider wrapper if exists

### Phase 5: Update Awards Page
1. Remove `games` and `gameGuessesArray` fetches
2. Add `tournamentPredictionCompletion` fetch
3. Update props passed to AwardsPanel
4. Update AwardsPanel to render dashboard with minimal data
5. Remove GuessesContextProvider wrapper if exists

### Phase 6: Testing & Validation
1. Run unit tests for repository function
2. Run component tests
3. Test each page manually (Home, Qualified Teams, Awards)
4. Verify database queries reduced on Qualified Teams/Awards pages
5. Verify dashboard displays correctly on all pages

## Testing Strategy

### Unit Tests

**Repository Function (`game-guess-repository.test.ts`):**
```typescript
describe('getPredictionDashboardStats', () => {
  it('counts group stage games when both scores filled', async () => {
    // Test non-playoff game with scores
    // Expected: predictedGames = 1
  });

  it('counts playoff games with decisive score', async () => {
    // Test playoff game with different scores (e.g., 2-1)
    // Expected: predictedGames = 1
  });

  it('does NOT count playoff tie without penalty winner', async () => {
    // Test playoff game with same scores, no penalty winner
    // home_score = 1, away_score = 1, both penalty fields null/false
    // Expected: predictedGames = 0
  });

  it('counts playoff tie WITH home penalty winner', async () => {
    // Test playoff game: home_score = 1, away_score = 1
    // home_penalty_winner = true, away_penalty_winner = false/null
    // Expected: predictedGames = 1
  });

  it('counts playoff tie WITH away penalty winner', async () => {
    // Test playoff game: home_score = 1, away_score = 1
    // away_penalty_winner = true, home_penalty_winner = false/null
    // Expected: predictedGames = 1
  });

  it('does NOT count playoff tie with BOTH penalty winners', async () => {
    // Test invalid state: home_score = 1, away_score = 1
    // home_penalty_winner = true, away_penalty_winner = true
    // Expected: predictedGames = 0 (invalid state, should not count)
  });

  it('handles mix of playoff and group stage games', async () => {
    // Test tournament with both types:
    // - 2 group games (both complete) = 2 counted
    // - 1 playoff game with decisive score = 1 counted
    // - 1 playoff tie with penalty = 1 counted
    // - 1 playoff tie without penalty = 0 counted
    // Expected: predictedGames = 4
  });

  it('counts boost usage correctly', async () => {
    // Test silver and golden boost counts
    // 3 games with silver boost, 2 with golden
    // Expected: silverUsed = 3, goldenUsed = 2
  });

  it('handles tournaments with no playoff games', async () => {
    // Test tournament with only group games
    // Expected: Query succeeds, counts group games normally
  });

  it('handles games with no guesses', async () => {
    // Test tournament with 5 games, user has made 0 guesses
    // Expected: totalGames = 5, predictedGames = 0
  });
});
```

**Component Tests (`compact-prediction-dashboard.test.tsx`):**
```typescript
describe('CompactPredictionDashboard', () => {
  it('renders without context dependency', () => {
    // Render with all props, no context provider
  });

  it('displays boost data from props', () => {
    // Pass boost props, verify display
  });

  it('calculates urgency from gameGuesses prop', () => {
    // Pass gameGuesses, verify urgency calculation
  });

  it('shows only tournament row when totalGames is 0', () => {
    // Test Qualified Teams / Awards scenario
  });
});
```

### Integration Tests

**Home Page:**
- Dashboard displays with data from `getPredictionDashboardStats()`
- Boost counts accurate
- Games closing urgency correct
- Context still works for games list

**Qualified Teams Page:**
- Dashboard displays without fetching game guesses
- No GuessesContextProvider wrapper
- Page still functions correctly

**Awards Page:**
- Dashboard displays without fetching game guesses
- No GuessesContextProvider wrapper
- Page still functions correctly

### Manual Testing Checklist

- [ ] Home page: Dashboard shows game predictions and boosts
- [ ] Home page: Click game row opens popover with urgency groups
- [ ] Home page: Click tournament row opens tournament details
- [ ] Qualified Teams: Dashboard shows only tournament prediction row
- [ ] Qualified Teams: No game data fetched (check network tab)
- [ ] Awards: Dashboard shows only tournament prediction row
- [ ] Awards: No game data fetched (check network tab)
- [ ] All pages: Urgency colors correct
- [ ] Playoff game with tie + no penalty: Not counted as predicted
- [ ] Playoff game with tie + penalty winner: Counted as predicted

## Edge Cases & Considerations

### Repository Function
- Handle tournaments with no playoff games (left join returns null) ✅ Covered by OR condition
- Handle games with no guesses ✅ Left join handles this
- Ensure boost counts remain accurate ✅ Filter on boost_type unchanged
- Both penalty winners selected ✅ Validation ensures exactly one
- Schema verification needed: Confirm `home_penalty_winner` and `away_penalty_winner` exist as boolean columns

### Dashboard Component
- Handle undefined/null props gracefully ✅ Existing code uses optional chaining
- Hide game row when `totalGames === 0` ✅ Existing conditional render at lines 124-137
- Maintain existing popover functionality ✅ Popovers receive games/gameGuesses as props
- Zero boost data: Component checks `showBoosts` (line 52) - renders nothing if max is 0
- Empty gameGuesses map: Urgency helpers handle empty maps gracefully

### Pages
- Tournament without groups (Qualified Teams page) - Unlikely but handled by empty array
- Tournament without awards (Awards page) - Tournament guess can be null, handled
- Missing tournament start date - Props are optional, urgency uses fallback logic

## Rollback Plan

If issues arise:
1. Repository function is backward compatible (only adds join, doesn't remove fields)
2. Dashboard props are additive (existing props still work)
3. Can revert pages one at a time
4. GuessesContextProvider can be re-added if needed

## Performance Impact

### Before
- Qualified Teams: Fetches ALL game guesses (~50-100 rows)
- Awards: Fetches ALL game guesses (~50-100 rows)
- Total unnecessary queries: 2 per page load

### After
- Qualified Teams: No game guesses fetch
- Awards: No game guesses fetch
- Estimated improvement: ~100-200ms per page load (depending on tournament size)

## Migration Notes

- No database migrations required
- No breaking API changes
- Backward compatible (old code will continue to work)
- Can deploy incrementally

## Success Metrics

1. **Data Accuracy:** 0 incomplete playoff ties counted as complete
2. **Performance:** 0 game guesses queries on Qualified Teams/Awards pages
3. **Architecture:** 0 context dependencies in CompactPredictionDashboard
4. **Tests:** 100% coverage on new validation logic
5. **SonarCloud:** 0 new issues, ≥80% coverage on changed code
