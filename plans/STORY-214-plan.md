# Implementation Plan: Story #214 - Predictions Dashboard Refactoring

## Context

The Compact Prediction Dashboard has two main problems:

1. **Data Bug:** `getPredictionDashboardStats()` counts playoff ties without penalty winner as complete
2. **Architecture Issue:** Dashboard is coupled to GuessesContext, causing unnecessary data fetching

## Architecture Principle

**Each page calculates its OWN prediction type, fetches OTHER types from DB.**

- **Home:** Calculates game predictions (has games), fetches tournament predictions from DB
- **Qualified Teams:** Calculates qualified teams predictions (has predictions), fetches game predictions from DB
- **Awards:** Calculates awards predictions (has tournament guess), fetches game predictions from DB

**Dashboard is dumb - receives all data as props.**

## Technical Approach

### Part 1: Fix `getPredictionDashboardStats()` - Validate Playoff Ties

**File:** `app/db/game-guess-repository.ts`

Add join with `tournament_playoff_round_games` and validate playoff ties require penalty winner:

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
    .leftJoin('tournament_playoff_round_games',
      'tournament_playoff_round_games.game_id',
      'games.id'
    )
    .where('games.tournament_id', '=', tournamentId)
    .select((eb) => [
      eb.fn.countAll<number>().as('total_games'),

      eb.fn
        .count<number>('game_guesses.id')
        .filterWhere('game_guesses.home_score', 'is not', null)
        .filterWhere('game_guesses.away_score', 'is not', null)
        .filterWhere((eb) =>
          eb.or([
            // Not playoff
            eb('tournament_playoff_round_games.game_id', 'is', null),
            // Playoff with decisive score
            eb('game_guesses.home_score', '!=', eb.ref('game_guesses.away_score')),
            // Playoff tie WITH penalty winner
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

      eb.fn.count<number>('game_guesses.id')
        .filterWhere('game_guesses.boost_type', '=', 'silver')
        .as('silver_used'),
      eb.fn.count<number>('game_guesses.id')
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

### Part 2: Modify `getGamesClosingWithin48Hours()` to Include Guesses

**File:** `app/db/game-repository.ts`

Update existing function to accept `userId` and join with `game_guesses`:

```typescript
export async function getGamesClosingWithin48Hours(
  userId: string,  // ADD this parameter
  tournamentId: string
): Promise<Array<{ game: ExtendedGameData; gameGuess?: GameGuessNew }>> {
  // Existing query + left join with game_guesses where user_id = userId
  // Return array of {game, gameGuess}
}
```

**Update callers:**
- `app/components/unified-games-page.tsx` line 49: Add `user.id` parameter

### Part 3: Make Dashboard Pure Component

**File:** `app/components/compact-prediction-dashboard.tsx`

**New props interface:**
```typescript
interface CompactPredictionDashboardProps {
  readonly totalGames: number;
  readonly predictedGames: number;
  readonly silverBoostUsed: number;
  readonly silverBoostMax: number;
  readonly goldenBoostUsed: number;
  readonly goldenBoostMax: number;
  readonly tournamentPredictionPercentage?: number;
  readonly tournamentPredictionIsLocked?: boolean;
  readonly tournamentClosesInHours?: number;
  readonly gamesClosingInNext48Hours?: Array<{
    game: ExtendedGameData;
    gameGuess?: GameGuessNew;
  }>;
  readonly tournamentId?: string;
  readonly teamsMap?: Record<string, Team>;
  readonly demoMode?: boolean;
}
```

**Remove:**
- `useContext(GuessesContext)`
- All context dependencies

**Calculate from props:**
- `boostCounts` from boost props
- Urgency from `gamesClosingInNext48Hours` and `tournamentClosesInHours`

### Part 4: Home Page

**Calculates:** Game predictions, boost usage
**Fetches from DB:** Tournament predictions

**File:** `app/components/unified-games-page.tsx`
- Remove `getPredictionDashboardStats()` call (line 34)
- Keep everything else

**File:** `app/components/unified-games-page-client.tsx`

```typescript
// Calculate game predictions
const totalGames = games.length;
const predictedGames = games.filter(game => {
  const guess = guessesContext.gameGuesses[game.id];
  if (!guess?.home_score || !guess?.away_score) return false;

  // Playoff tie needs penalty winner
  if (game.playoff_round_id && guess.home_score === guess.away_score) {
    return guess.home_penalty_winner === true || guess.away_penalty_winner === true;
  }
  return true;
}).length;

// Calculate boost usage
const silverBoostUsed = Object.values(guessesContext.gameGuesses).filter(g => g.boost_type === 'silver').length;
const goldenBoostUsed = Object.values(guessesContext.gameGuesses).filter(g => g.boost_type === 'golden').length;

// Calculate tournament closes in hours
const tournamentClosesInHours = tournamentStartDate
  ? ((tournamentStartDate.getTime() + 5 * 24 * 60 * 60 * 1000) - Date.now()) / (60 * 60 * 1000)
  : undefined;

// closingGames already has guesses (from modified getGamesClosingWithin48Hours)

<CompactPredictionDashboard
  totalGames={totalGames}
  predictedGames={predictedGames}
  silverBoostUsed={silverBoostUsed}
  silverBoostMax={tournament.max_silver_games || 0}
  goldenBoostUsed={goldenBoostUsed}
  goldenBoostMax={tournament.max_golden_games || 0}
  tournamentPredictionPercentage={tournamentPredictionCompletion?.overallPercentage}
  tournamentPredictionIsLocked={tournamentPredictionCompletion?.isPredictionLocked}
  tournamentClosesInHours={tournamentClosesInHours}
  gamesClosingInNext48Hours={closingGames}
  tournamentId={tournamentId}
  teamsMap={teamsMap}
/>
```

### Part 5: Qualified Teams Page

**Calculates:** Qualified teams predictions
**Fetches from DB:** Game predictions, closing games

**File:** `app/[locale]/tournaments/[id]/qualified-teams/page.tsx`

```typescript
const [gamePredictionStats, closingGames, tournamentPredictionCompletion, teamsMap] = await Promise.all([
  getPredictionDashboardStats(user.id, tournamentId),
  getGamesClosingWithin48Hours(user.id, tournamentId),
  getTournamentPredictionCompletion(user.id, tournamentId, tournament),
  getTeamsMap(tournamentId)
]);

// REMOVE: getAllTournamentGames, findGameGuessesByUserId

<QualifiedTeamsClientPage
  gamePredictionStats={gamePredictionStats}
  closingGames={closingGames}
  tournamentPredictionCompletion={tournamentPredictionCompletion}
  tournament={tournament}
  teamsMap={teamsMap}
  // REMOVE: games, gameGuessesArray
/>
```

**File:** `app/components/qualified-teams/qualified-teams-client-page.tsx`

```typescript
// Props
readonly gamePredictionStats: { totalGames, predictedGames, silverUsed, goldenUsed };
readonly closingGames: Array<{ game: ExtendedGameData; gameGuess?: GameGuessNew }>;
readonly tournament: Tournament;
readonly tournamentPredictionCompletion: any;
readonly teamsMap: Record<string, Team>;

// Calculate qualified teams predictions
const predictedQualifiedTeams = initialPredictions.filter(p => p.predicted_to_qualify).length;
const totalQualifiedTeamsNeeded = allowsThirdPlace ? groups.length * 2 + maxThirdPlace : groups.length * 2;

const tournamentClosesInHours = tournament.start_date
  ? ((tournament.start_date.getTime() + 5 * 24 * 60 * 60 * 1000) - Date.now()) / (60 * 60 * 1000)
  : undefined;

<CompactPredictionDashboard
  totalGames={gamePredictionStats.totalGames}
  predictedGames={gamePredictionStats.predictedGames}
  silverBoostUsed={gamePredictionStats.silverUsed}
  silverBoostMax={tournament.max_silver_games || 0}
  goldenBoostUsed={gamePredictionStats.goldenUsed}
  goldenBoostMax={tournament.max_golden_games || 0}
  tournamentPredictionPercentage={Math.round((predictedQualifiedTeams / totalQualifiedTeamsNeeded) * 100)}
  tournamentPredictionIsLocked={isLocked}
  tournamentClosesInHours={tournamentClosesInHours}
  gamesClosingInNext48Hours={closingGames}
  tournamentId={tournament.id}
  teamsMap={teamsMap}
/>
```

### Part 6: Awards Page

**Calculates:** Awards predictions
**Fetches from DB:** Game predictions, closing games

**File:** `app/[locale]/tournaments/[id]/awards/page.tsx`

```typescript
const [tournamentGuesses, allPlayers, tournamentStartDate, teamsMap, tournament, playoffStages, gamePredictionStats, closingGames] = await Promise.all([
  findTournamentGuessByUserIdTournament(user.id, params.id).then(r => r || buildTournamentGuesses(user.id, params.id)),
  findAllPlayersInTournamentWithTeamData(params.id),
  getTournamentStartDate(params.id),
  getTeamsMap(params.id),
  findTournamentById(params.id),
  getPlayoffRounds(params.id),
  getPredictionDashboardStats(user.id, params.id),
  getGamesClosingWithin48Hours(user.id, params.id)
]);

// REMOVE: getAllTournamentGames, findGameGuessesByUserId

// KEEP existing tournamentPredictionCompletion fetch

<AwardsPanel
  gamePredictionStats={gamePredictionStats}
  closingGames={closingGames}
  tournament={tournament}
  tournamentPredictionCompletion={tournamentPredictionCompletion}
  tournamentStartDate={tournamentStartDate}
  teamsMap={teamsMap}
  // REMOVE: games, gameGuessesArray
/>
```

**File:** `app/components/awards/award-panel.tsx`

```typescript
// Props
readonly gamePredictionStats: { totalGames, predictedGames, silverUsed, goldenUsed };
readonly closingGames: Array<{ game: ExtendedGameData; gameGuess?: GameGuessNew }>;
readonly tournament: Tournament;
readonly tournamentPredictionCompletion: any;
readonly tournamentStartDate: Date;
readonly teamsMap: Record<string, Team>;

// Calculate awards predictions
const predictedHonorRollAwards = [
  tournamentGuesses.champion_id,
  tournamentGuesses.runner_up_id,
  hasThirdPlaceGame ? tournamentGuesses.third_place_id : null
].filter(Boolean).length;

const predictedIndividualAwards = [
  tournamentGuesses.top_scorer_id,
  tournamentGuesses.best_player_id,
  tournamentGuesses.best_young_player_id,
  tournamentGuesses.best_goalkeeper_id
].filter(Boolean).length;

const totalHonorRollAwards = hasThirdPlaceGame ? 3 : 2;
const totalAwards = totalHonorRollAwards + 4;
const predictedAwards = predictedHonorRollAwards + predictedIndividualAwards;

const tournamentClosesInHours = tournamentStartDate
  ? ((tournamentStartDate.getTime() + 5 * 24 * 60 * 60 * 1000) - Date.now()) / (60 * 60 * 1000)
  : undefined;

<CompactPredictionDashboard
  totalGames={gamePredictionStats.totalGames}
  predictedGames={gamePredictionStats.predictedGames}
  silverBoostUsed={gamePredictionStats.silverUsed}
  silverBoostMax={tournament.max_silver_games || 0}
  goldenBoostUsed={gamePredictionStats.goldenUsed}
  goldenBoostMax={tournament.max_golden_games || 0}
  tournamentPredictionPercentage={Math.round((predictedAwards / totalAwards) * 100)}
  tournamentPredictionIsLocked={isPredictionLocked}
  tournamentClosesInHours={tournamentClosesInHours}
  gamesClosingInNext48Hours={closingGames}
  tournamentId={tournament.id}
  teamsMap={teamsMap}
/>
```

## Files to Modify

1. `app/db/game-guess-repository.ts` - Fix `getPredictionDashboardStats()`
2. `app/db/game-repository.ts` - Modify `getGamesClosingWithin48Hours()` to accept userId and include guesses
3. `app/components/compact-prediction-dashboard.tsx` - Make pure component
4. `app/components/unified-games-page.tsx` - Update getGamesClosingWithin48Hours call
5. `app/components/unified-games-page-client.tsx` - Calculate game predictions
6. `app/[locale]/tournaments/[id]/qualified-teams/page.tsx` - Fetch game stats from DB
7. `app/components/qualified-teams/qualified-teams-client-page.tsx` - Calculate qualified teams predictions
8. `app/[locale]/tournaments/[id]/awards/page.tsx` - Fetch game stats from DB
9. `app/components/awards/award-panel.tsx` - Calculate awards predictions

## Testing

- `app/db/__tests__/game-guess-repository.test.ts` - Test playoff tie validation
- `app/components/__tests__/compact-prediction-dashboard.test.tsx` - Test pure component
- Integration tests for all three pages
