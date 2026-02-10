import { db } from './database';
import { TournamentPredictionCompletion, Tournament, TeamPositionPrediction } from './tables-definition';
import { findTournamentGuessByUserIdTournament } from './tournament-guess-repository';
import { getTournamentStartDate } from '../actions/tournament-actions';
import { getAllUserGroupPositionsPredictions } from './qualified-teams-repository';

/**
 * Get tournament prediction completion status for a user
 * Tracks completion across 3 categories: final standings, awards, and qualifiers
 *
 * Qualifier completion uses new qualification prediction system (tournament_qualified_teams_predictions)
 * and simply counts teams marked with predicted_to_qualify = true. No concept of "complete groups" -
 * users can select third-place qualifiers directly, so we just count total qualified teams predicted.
 *
 * CRITICAL FIX: Uses proper JOIN through playoff_round_games -> tournament_playoff_rounds
 * to check is_first_stage = true (NOT game_type = 'first_round')
 */
export async function getTournamentPredictionCompletion(
  userId: string,
  tournamentId: string,
  _tournament: Tournament
): Promise<TournamentPredictionCompletion> {
  // Fetch user's tournament guess using repository function
  const tournamentGuess = await findTournamentGuessByUserIdTournament(userId, tournamentId);

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
  // Total qualifier slots = first-stage playoff games × 2 (home + away teams)
  const totalFirstRoundGamesResult = await db
    .selectFrom('games')
    .innerJoin('tournament_playoff_round_games', 'tournament_playoff_round_games.game_id', 'games.id')
    .innerJoin('tournament_playoff_rounds', 'tournament_playoff_rounds.id', 'tournament_playoff_round_games.tournament_playoff_round_id')
    .select((eb) => eb.fn.countAll<number>().as('count'))
    .where('tournament_playoff_rounds.tournament_id', '=', tournamentId)
    .where('tournament_playoff_rounds.is_first_stage', '=', true)
    .executeTakeFirst();

  const totalFirstRoundGames = Number(totalFirstRoundGamesResult?.count ?? 0);
  const totalQualifierSlots = totalFirstRoundGames * 2; // Each game has 2 teams

  // Count total groups in tournament
  const totalGroupsResult = await db
    .selectFrom('tournament_groups')
    .select((eb) => eb.fn.countAll<number>().as('count'))
    .where('tournament_id', '=', tournamentId)
    .executeTakeFirst();

  // Count how many teams the user has predicted to qualify
  // Use the working JSONB-based repository function
  const groupPredictions = await getAllUserGroupPositionsPredictions(userId, tournamentId);

  // Count teams marked as predicted_to_qualify across all groups
  const qualifiersCompleted = groupPredictions.reduce((count, group) => {
    const positions = group.team_predicted_positions as unknown as TeamPositionPrediction[];
    return count + positions.filter(t => t.predicted_to_qualify).length;
  }, 0);

  // Calculate overall metrics
  const overallTotal = 3 + 4 + totalQualifierSlots; // finalStandings + awards + qualifiers
  const overallCompleted = finalStandingsCompleted + awardsCompleted + qualifiersCompleted;
  const overallPercentage = overallTotal > 0 ? Math.round((overallCompleted / overallTotal) * 100) : 0;

  // Check if predictions are locked (5 days after tournament starts)
  const tournamentStartDate = await getTournamentStartDate(tournamentId);

  const isPredictionLocked = tournamentStartDate
    ? Date.now() > tournamentStartDate.getTime() + 5 * 24 * 60 * 60 * 1000
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
      total: totalQualifierSlots,
    },
    overallCompleted,
    overallTotal,
    overallPercentage,
    isPredictionLocked,
  };
}
