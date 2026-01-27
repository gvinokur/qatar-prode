import { db } from './database';
import { TournamentPredictionCompletion } from './tables-definition';

/**
 * Get tournament prediction completion status for a user
 * Tracks completion across 3 categories: final standings, awards, and qualifiers
 *
 * CRITICAL FIX: Uses proper JOIN through playoff_round_games -> tournament_playoff_rounds
 * to check is_first_stage = true (NOT game_type = 'first_round')
 */
export async function getTournamentPredictionCompletion(
  userId: string,
  tournamentId: string
): Promise<TournamentPredictionCompletion> {
  // Fetch user's tournament guess
  const tournamentGuess = await db
    .selectFrom('tournament_guesses')
    .selectAll()
    .where('user_id', '=', userId)
    .where('tournament_id', '=', tournamentId)
    .executeTakeFirst();

  // Category 1: Final Standings (3 items)
  const champion = !!tournamentGuess?.champion_team_id;
  const runnerUp = !!tournamentGuess?.runner_up_team_id;
  const thirdPlace = !!tournamentGuess?.third_place_team_id;
  const finalStandingsCompleted = [champion, runnerUp, thirdPlace].filter(Boolean).length;

  // Category 2: Individual Awards (4 items)
  const bestPlayer = !!tournamentGuess?.best_player_id;
  const topGoalscorer = !!tournamentGuess?.top_goalscorer_player_id;
  const bestGoalkeeper = !!tournamentGuess?.best_goalkeeper_player_id;
  const bestYoungPlayer = !!tournamentGuess?.best_young_player_id;
  const awardsCompleted = [bestPlayer, topGoalscorer, bestGoalkeeper, bestYoungPlayer].filter(Boolean).length;

  // Category 3: Qualifiers (dynamic count)
  // CRITICAL: Use proper JOIN pattern through playoff_round_games -> tournament_playoff_rounds
  // Query total first-stage playoff games (these require qualified team guesses)
  const totalFirstRoundGamesResult = await db
    .selectFrom('games')
    .innerJoin('tournament_playoff_round_games', 'tournament_playoff_round_games.game_id', 'games.id')
    .innerJoin('tournament_playoff_rounds', 'tournament_playoff_rounds.id', 'tournament_playoff_round_games.tournament_playoff_round_id')
    .select((eb) => eb.fn.countAll<number>().as('count'))
    .where('tournament_playoff_rounds.tournament_id', '=', tournamentId)
    .where('tournament_playoff_rounds.is_first_stage', '=', true)
    .executeTakeFirst();

  const totalFirstRoundGames = Number(totalFirstRoundGamesResult?.count ?? 0);

  // Count how many first-round games the user has guessed
  // A game is "guessed" if user predicted both home_team and away_team
  // These get populated when user completes group position predictions
  const guessedFirstRoundGamesResult = await db
    .selectFrom('game_guesses')
    .innerJoin('games', 'games.id', 'game_guesses.game_id')
    .innerJoin('tournament_playoff_round_games', 'tournament_playoff_round_games.game_id', 'games.id')
    .innerJoin('tournament_playoff_rounds', 'tournament_playoff_rounds.id', 'tournament_playoff_round_games.tournament_playoff_round_id')
    .select((eb) => eb.fn.countAll<number>().as('count'))
    .where('game_guesses.user_id', '=', userId)
    .where('tournament_playoff_rounds.tournament_id', '=', tournamentId)
    .where('tournament_playoff_rounds.is_first_stage', '=', true)
    .where('game_guesses.home_team', 'is not', null)
    .where('game_guesses.away_team', 'is not', null)
    .executeTakeFirst();

  const qualifiersCompleted = Number(guessedFirstRoundGamesResult?.count ?? 0);

  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.warn('[TournamentPredictionCompletion] Qualifiers Debug:', {
      tournamentId,
      userId,
      totalFirstRoundGames,
      qualifiersCompleted,
    });
  }

  // Calculate overall metrics
  const overallTotal = 3 + 4 + totalFirstRoundGames; // finalStandings + awards + qualifiers
  const overallCompleted = finalStandingsCompleted + awardsCompleted + qualifiersCompleted;
  const overallPercentage = overallTotal > 0 ? Math.round((overallCompleted / overallTotal) * 100) : 0;

  // Check if predictions are locked (5 days after tournament starts)
  const earliestGameResult = await db
    .selectFrom('games')
    .select('game_date')
    .where('tournament_id', '=', tournamentId)
    .orderBy('game_date', 'asc')
    .limit(1)
    .executeTakeFirst();

  const isPredictionLocked = earliestGameResult
    ? new Date().getTime() > new Date(earliestGameResult.game_date).getTime() + 5 * 24 * 60 * 60 * 1000
    : false;

  return {
    finalStandings: {
      completed: finalStandingsCompleted,
      total: 3,
      champion,
      runnerUp,
      thirdPlace,
    },
    awards: {
      completed: awardsCompleted,
      total: 4,
      bestPlayer,
      topGoalscorer,
      bestGoalkeeper,
      bestYoungPlayer,
    },
    qualifiers: {
      completed: qualifiersCompleted,
      total: totalFirstRoundGames,
    },
    overallCompleted,
    overallTotal,
    overallPercentage,
    isPredictionLocked,
  };
}
