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

## Architecture Principle

**Each page calculates its OWN prediction type (has the data), fetches OTHER types from DB in a single query.**

- **Home page:** Calculates game predictions (has games data), fetches tournament predictions from DB
- **Qualified Teams:** Calculates qualified teams predictions (has predictions data), fetches game predictions from DB
- **Awards:** Calculates awards predictions (has tournament guess data), fetches game predictions from DB

**Dashboard component is dumb - receives all data as props, doesn't care how you got it.**

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

  // ✅ CHANGE: Break apart tournament predictions for clarity
  readonly tournamentPredictionPercentage?: number;
  readonly tournamentPredictionIsLocked?: boolean;
  readonly tournamentId?: string;

  // ✅ CHANGE: Replace tournamentStartDate with hours calculation
  readonly tournamentClosesInHours?: number; // Positive = hours until close, Negative = hours since closed

  // ✅ CHANGE: Only pass games closing in next 48 hours (not all games)
  readonly gamesClosingInNext48Hours?: Array<{
    game: ExtendedGameData;
    gameGuess?: GameGuessNew;
  }>;
  readonly teamsMap?: Record<string, Team>;
  // ❌ REMOVE: isPlayoffs - not needed

  // ✅ ADD: Boost data (replace context usage)
  readonly silverBoostUsed: number;
  readonly silverBoostMax: number;
  readonly goldenBoostUsed: number;
  readonly goldenBoostMax: number;

  // ❌ REMOVE: gameGuesses map - only need gamesClosingInNext48Hours

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

// ✅ Update urgency calculation to use gamesClosingInNext48Hours
// Instead of: getGameUrgencyLevel(games, gameGuesses)
// Use: Calculate from gamesClosingInNext48Hours prop

// ✅ Update tournament urgency to use tournamentClosesInHours
// Instead of: getTournamentUrgencyLevel(tournamentPredictions, tournamentStartDate)
// Use: Calculate from tournamentClosesInHours and tournamentPredictionPercentage/isLocked

// ✅ Update hasUrgentGames check
// Instead of: checkUrgentGames(games, gameGuesses)
// Use: gamesClosingInNext48Hours.length > 0
```

### Part 3: Update Home Page (UnifiedGamesPage)

**Home page HAS games data → calculates game predictions itself, fetches tournament predictions from DB.**

**File:** `app/components/unified-games-page.tsx`

```typescript
// ❌ REMOVE: getPredictionDashboardStats fetch (line 34) - don't need it
// Home page calculates game predictions from games it already has

// ✅ KEEP: All existing fetches (games, tournament, etc.)
```

**File:** `app/components/unified-games-page-client.tsx`

```typescript
// ✅ Calculate game predictions from games data (HOME PAGE'S RESPONSIBILITY)
const totalGames = games.length;
const predictedGames = games.filter(game => {
  const guess = guessesContext.gameGuesses[game.id];

  // Check if both scores filled
  if (guess?.home_score == null || guess?.away_score == null) return false;

  // For playoff games with tied scores, check penalty winner
  if (game.playoff_round_id && guess.home_score === guess.away_score) {
    return guess.home_penalty_winner === true || guess.away_penalty_winner === true;
  }

  return true;
}).length;

// ✅ Calculate boost usage from game guesses
const silverBoostUsed = Object.values(guessesContext.gameGuesses).filter(g => g.boost_type === 'silver').length;
const goldenBoostUsed = Object.values(guessesContext.gameGuesses).filter(g => g.boost_type === 'golden').length;

// ✅ Calculate tournament closes in hours
const tournamentClosesInHours = tournamentStartDate
  ? ((tournamentStartDate.getTime() + 5 * 24 * 60 * 60 * 1000) - Date.now()) / (60 * 60 * 1000)
  : undefined;

// ✅ Build gamesClosingInNext48Hours with guesses
const gamesClosingInNext48Hours = closingGames.map(game => ({
  game,
  gameGuess: guessesContext.gameGuesses[game.id]
}));

// Pass to CompactPredictionDashboard
<CompactPredictionDashboard
  totalGames={totalGames}
  predictedGames={predictedGames}  // Calculated here, not from DB
  silverBoostUsed={silverBoostUsed}
  silverBoostMax={tournament.max_silver_games || 0}
  goldenBoostUsed={goldenBoostUsed}
  goldenBoostMax={tournament.max_golden_games || 0}
  tournamentPredictionPercentage={tournamentPredictionCompletion?.overallPercentage}
  tournamentPredictionIsLocked={tournamentPredictionCompletion?.isPredictionLocked}
  tournamentClosesInHours={tournamentClosesInHours}
  gamesClosingInNext48Hours={gamesClosingInNext48Hours}
  tournamentId={tournamentId}
  teamsMap={teamsMap}
/>
```

**Note:**
- Home page calculates its OWN predictions (has the data)
- Playoff tie validation happens CLIENT-SIDE using same logic as repository
- Tournament predictions come from existing `getTournamentPredictionCompletion()` call

### Part 4: Update Qualified Teams Page

**Qualified Teams HAS qualified teams data → calculates qualified teams predictions itself, fetches game predictions from DB.**

**File:** `app/[locale]/tournaments/[id]/qualified-teams/page.tsx`

**Update fetches:**

```typescript
// ✅ ADD: Fetch game predictions from DB (SINGLE QUERY)
const [gamePredictionStats, tournamentPredictionCompletion, teamsMap] = await Promise.all([
  getPredictionDashboardStats(user.id, tournamentId),  // Game predictions from DB
  getTournamentPredictionCompletion(user.id, tournamentId, tournament),
  getTeamsMap(tournamentId)
]);

// ❌ REMOVE: getAllTournamentGames, findGameGuessesByUserId (don't need them)
```

**Update props passed to client:**

```typescript
<QualifiedTeamsClientPage
  // ... existing props ...
  gamePredictionStats={gamePredictionStats}  // ✅ ADD
  tournamentPredictionCompletion={tournamentPredictionCompletion}
  tournament={tournament}
  teamsMap={teamsMap}
  // ❌ REMOVE: games, gameGuessesArray
/>
```

**File:** `app/components/qualified-teams/qualified-teams-client-page.tsx`

**Update props interface:**

```typescript
// ✅ ADD:
readonly gamePredictionStats: {
  totalGames: number;
  predictedGames: number;
  silverUsed: number;
  goldenUsed: number;
};
readonly tournament: Tournament;

// ❌ REMOVE:
readonly games: any[];
readonly gameGuessesArray: any[];
readonly tournamentStartDate?: Date;

// ✅ KEEP:
readonly tournamentPredictionCompletion: any;
readonly teamsMap: Record<string, Team>;
```

**Update dashboard usage:**

```typescript
// ✅ Calculate qualified teams predictions (THIS PAGE'S RESPONSIBILITY)
const predictedQualifiedTeams = initialPredictions.filter(p => p.predicted_to_qualify).length;
const totalQualifiedTeamsNeeded = allowsThirdPlace
  ? groups.length * 2 + maxThirdPlace
  : groups.length * 2;

// ✅ Calculate tournament closes in hours
const tournamentClosesInHours = tournament.start_date
  ? ((tournament.start_date.getTime() + 5 * 24 * 60 * 60 * 1000) - Date.now()) / (60 * 60 * 1000)
  : undefined;

<CompactPredictionDashboard
  // Game predictions from DB
  totalGames={gamePredictionStats.totalGames}
  predictedGames={gamePredictionStats.predictedGames}
  silverBoostUsed={gamePredictionStats.silverUsed}
  silverBoostMax={tournament.max_silver_games || 0}
  goldenBoostUsed={gamePredictionStats.goldenUsed}
  goldenBoostMax={tournament.max_golden_games || 0}

  // Tournament predictions (qualified teams - calculated here)
  tournamentPredictionPercentage={Math.round((predictedQualifiedTeams / totalQualifiedTeamsNeeded) * 100)}
  tournamentPredictionIsLocked={isLocked}
  tournamentClosesInHours={tournamentClosesInHours}

  // No games closing data on this page
  gamesClosingInNext48Hours={[]}
  tournamentId={tournament.id}
  teamsMap={teamsMap}
/>
```

**Note:**
- Qualified Teams page calculates its OWN predictions (qualified teams)
- Gets game predictions from DB (doesn't have games data)
- No GuessesContextProvider wrapper needed

### Part 5: Update Awards Page

**Awards HAS tournament guess data → calculates awards predictions itself, fetches game predictions from DB.**

**File:** `app/[locale]/tournaments/[id]/awards/page.tsx`

**Update fetches:**

```typescript
// ✅ ADD: Fetch game predictions from DB (SINGLE QUERY)
const [tournamentGuesses, allPlayers, tournamentStartDate, teamsMap, tournament, playoffStages, gamePredictionStats] = await Promise.all([
  findTournamentGuessByUserIdTournament(user.id, params.id).then(result => result || buildTournamentGuesses(user.id, params.id)),
  findAllPlayersInTournamentWithTeamData(params.id),
  getTournamentStartDate(params.id),
  getTeamsMap(params.id),
  findTournamentById(params.id),
  getPlayoffRounds(params.id),
  getPredictionDashboardStats(user.id, params.id)  // ✅ Game predictions from DB
]);

// ❌ REMOVE: getAllTournamentGames, findGameGuessesByUserId (lines 50-51)

// ✅ KEEP: Existing tournamentPredictionCompletion fetch (lines 60-62)
const tournamentPredictionCompletion = tournament
  ? await getTournamentPredictionCompletion(user.id, params.id, tournament)
  : null;
```

**Update props passed to AwardsPanel:**

```typescript
<AwardsPanel
  // ... existing props ...
  gamePredictionStats={gamePredictionStats}  // ✅ ADD
  tournament={tournament}
  tournamentPredictionCompletion={tournamentPredictionCompletion}
  tournamentStartDate={tournamentStartDate}
  teamsMap={teamsMap}
  // ❌ REMOVE: games, gameGuessesArray
/>
```

**File:** `app/components/awards/award-panel.tsx`

**Update props interface:**

```typescript
// ✅ ADD:
readonly gamePredictionStats: {
  totalGames: number;
  predictedGames: number;
  silverUsed: number;
  goldenUsed: number;
};
readonly tournament: Tournament;

// ❌ REMOVE:
readonly games: any[];
readonly gameGuessesArray: any[];

// ✅ KEEP:
readonly tournamentPredictionCompletion: any;
readonly tournamentStartDate: Date;
readonly teamsMap: Record<string, Team>;
```

**Update dashboard usage:**

```typescript
// ✅ Calculate awards predictions (THIS PAGE'S RESPONSIBILITY)
const predictedHonorRollAwards = [
  tournamentGuesses.champion_id,
  tournamentGuesses.runner_up_id,
  hasThirdPlaceGame ? tournamentGuesses.third_place_id : null
].filter(Boolean).length;

const totalHonorRollAwards = hasThirdPlaceGame ? 3 : 2;

const predictedIndividualAwards = [
  tournamentGuesses.top_scorer_id,
  tournamentGuesses.best_player_id,
  tournamentGuesses.best_young_player_id,
  tournamentGuesses.best_goalkeeper_id
].filter(Boolean).length;

const totalIndividualAwards = 4;

const totalAwards = totalHonorRollAwards + totalIndividualAwards;
const predictedAwards = predictedHonorRollAwards + predictedIndividualAwards;

// ✅ Calculate tournament closes in hours
const tournamentClosesInHours = tournamentStartDate
  ? ((tournamentStartDate.getTime() + 5 * 24 * 60 * 60 * 1000) - Date.now()) / (60 * 60 * 1000)
  : undefined;

<CompactPredictionDashboard
  // Game predictions from DB
  totalGames={gamePredictionStats.totalGames}
  predictedGames={gamePredictionStats.predictedGames}
  silverBoostUsed={gamePredictionStats.silverUsed}
  silverBoostMax={tournament.max_silver_games || 0}
  goldenBoostUsed={gamePredictionStats.goldenUsed}
  goldenBoostMax={tournament.max_golden_games || 0}

  // Tournament predictions (awards - calculated here)
  tournamentPredictionPercentage={Math.round((predictedAwards / totalAwards) * 100)}
  tournamentPredictionIsLocked={isPredictionLocked}
  tournamentClosesInHours={tournamentClosesInHours}

  // No games closing data on this page
  gamesClosingInNext48Hours={[]}
  tournamentId={tournament.id}
  teamsMap={teamsMap}
/>
```

**Note:**
- Awards page calculates its OWN predictions (awards)
- Gets game predictions from DB (doesn't have games data)
- No GuessesContextProvider wrapper needed

**Note on GuessesContextProvider:**
- Home page KEEPS GuessesContextProvider (needed for games list editing)
- Qualified Teams and Awards pages don't use GuessesContextProvider (no game editing)

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
