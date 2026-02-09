import { db } from './database';
import { TournamentPredictionCompletion, Tournament } from './tables-definition';
import { findTournamentGuessByUserIdTournament } from './tournament-guess-repository';
import { getTournamentStartDate } from '../actions/tournament-actions';

/**
 * Get tournament prediction completion status for a user
 * Tracks completion across 3 categories: final standings, awards, and qualifiers
 *
 * Uses new qualification prediction system (tournament_qualified_teams_predictions)
 * to track group qualifier predictions. A group is complete when user has predicted
 * at least 2 qualified teams (1st and 2nd place) for that group.
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

  const totalGroups = Number(totalGroupsResult?.count ?? 0);

  // Count how many groups the user has completed
  // A group is complete when user has predicted qualified teams for that group
  // Typically 2 qualifiers per group (1st and 2nd place)
  const completeGroupsResult = await db
    .selectFrom('tournament_groups')
    .select((eb) => eb.fn.countAll<number>().as('count'))
    .where('tournament_groups.tournament_id', '=', tournamentId)
    .where((eb) =>
      eb.exists(
        eb.selectFrom('tournament_qualified_teams_predictions')
          .innerJoin('tournament_group_teams', 'tournament_group_teams.team_id', 'tournament_qualified_teams_predictions.team_id')
          .whereRef('tournament_group_teams.tournament_group_id', '=', 'tournament_groups.id')
          .where('tournament_qualified_teams_predictions.user_id', '=', userId)
          .where('tournament_qualified_teams_predictions.tournament_id', '=', tournamentId)
          .where('tournament_qualified_teams_predictions.predicted_to_qualify', '=', true)
          .having((eb) => eb.fn.countAll(), '>=', 2) // At least 2 qualifiers predicted
      )
    )
    .executeTakeFirst();

  const completeGroups = Number(completeGroupsResult?.count ?? 0);

  // Calculate qualifiers completed:
  // - Each complete group contributes 2 qualifiers (1st and 2nd place)
  // - Third-place qualifiers only count when ALL groups are complete
  const allGroupsComplete = completeGroups === totalGroups && totalGroups > 0;
  const thirdPlaceQualifiers = allGroupsComplete ? (totalQualifierSlots - (totalGroups * 2)) : 0;
  const qualifiersCompleted = (completeGroups * 2) + thirdPlaceQualifiers;

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
