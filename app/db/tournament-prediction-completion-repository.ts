import { db } from "./database";
import { TournamentPredictionCompletion, Tournament } from "./tables-definition";
import { findTournamentGuessByUserIdTournament } from "./tournament-guess-repository";
import { getTournamentStartDate } from "../actions/tournament-actions";

/**
 * Get tournament prediction completion status for a user
 * Tracks completion across 3 categories: final standings, awards, and qualifiers
 */
export async function getTournamentPredictionCompletion(
  userId: string,
  tournamentId: string,
  tournament: Tournament
): Promise<TournamentPredictionCompletion> {
  // Fetch user's tournament guesses
  const tournamentGuesses = await findTournamentGuessByUserIdTournament(userId, tournamentId);

  // Calculate final standings completion (champion, runner-up, third place)
  const champion = !!tournamentGuesses?.champion_team_id;
  const runnerUp = !!tournamentGuesses?.runner_up_team_id;
  const thirdPlace = !!tournamentGuesses?.third_place_team_id;

  // Only count third place if it's not null in the tournament definition
  // (some tournaments don't have third place games)
  const finalStandingsTotal = 3;
  const finalStandingsCompleted =
    (champion ? 1 : 0) +
    (runnerUp ? 1 : 0) +
    (thirdPlace ? 1 : 0);

  // Calculate awards completion (4 individual awards)
  const bestPlayer = !!tournamentGuesses?.best_player_id;
  const topGoalscorer = !!tournamentGuesses?.top_goalscorer_player_id;
  const bestGoalkeeper = !!tournamentGuesses?.best_goalkeeper_player_id;
  const bestYoungPlayer = !!tournamentGuesses?.best_young_player_id;

  const awardsTotal = 4;
  const awardsCompleted =
    (bestPlayer ? 1 : 0) +
    (topGoalscorer ? 1 : 0) +
    (bestGoalkeeper ? 1 : 0) +
    (bestYoungPlayer ? 1 : 0);

  // Calculate qualifiers completion (based on first_round game guesses)
  // Count total first_round games
  const totalFirstRoundGames = await db
    .selectFrom('games')
    .select(eb => eb.fn.countAll<number>().as('count'))
    .where('tournament_id', '=', tournamentId)
    .where('game_type', '=', 'first_round')
    .executeTakeFirst();

  const qualifiersTotal = Number(totalFirstRoundGames?.count ?? 0);

  // Count user's first_round game guesses
  const userFirstRoundGuesses = await db
    .selectFrom('game_guesses')
    .innerJoin('games', 'games.id', 'game_guesses.game_id')
    .select(eb => eb.fn.countAll<number>().as('count'))
    .where('games.tournament_id', '=', tournamentId)
    .where('games.game_type', '=', 'first_round')
    .where('game_guesses.user_id', '=', userId)
    .where('game_guesses.home_team', 'is not', null)
    .where('game_guesses.away_team', 'is not', null)
    .executeTakeFirst();

  const qualifiersCompleted = Number(userFirstRoundGuesses?.count ?? 0);

  // Calculate overall completion
  const overallTotal = finalStandingsTotal + awardsTotal + qualifiersTotal;
  const overallCompleted = finalStandingsCompleted + awardsCompleted + qualifiersCompleted;
  const overallPercentage = overallTotal > 0 ? Math.round((overallCompleted / overallTotal) * 100) : 0;

  // Check if predictions are locked (5 days after tournament start)
  const tournamentStartDate = await getTournamentStartDate(tournamentId);
  const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;
  const currentTime = new Date();
  const isPredictionLocked = (currentTime.getTime() - tournamentStartDate.getTime()) >= FIVE_DAYS_MS;

  return {
    finalStandings: {
      completed: finalStandingsCompleted,
      total: finalStandingsTotal,
      champion,
      runnerUp,
      thirdPlace,
    },
    awards: {
      completed: awardsCompleted,
      total: awardsTotal,
      bestPlayer,
      topGoalscorer,
      bestGoalkeeper,
      bestYoungPlayer,
    },
    qualifiers: {
      completed: qualifiersCompleted,
      total: qualifiersTotal,
    },
    overallCompleted,
    overallTotal,
    overallPercentage,
    isPredictionLocked,
  };
}
