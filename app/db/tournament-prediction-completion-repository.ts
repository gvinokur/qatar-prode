import { sql } from 'kysely';
import { db } from './database';
import { TournamentPredictionCompletion, Tournament, TeamPositionPrediction, PlayoffRoundCompletionData } from './tables-definition';
import { findTournamentGuessByUserIdTournament } from './tournament-guess-repository';
import { getTournamentStartDate } from '../actions/tournament-actions';
import { getAllUserGroupPositionsPredictions } from './qualified-teams-repository';
import { PREDICTION_LOCK_OFFSET_MS } from '../utils/prediction-constants';

/**
 * Single query replacing 6 sequential COUNT queries.
 * Uses LEFT JOIN so all games appear (for totals), and COUNT(*) FILTER for conditional metrics.
 */
async function fetchGameAndBoostStats(userId: string, tournamentId: string) {
  return db
    .selectFrom('games')
    .leftJoin('game_guesses', (join) =>
      join
        .onRef('game_guesses.game_id', '=', 'games.id')
        .on('game_guesses.user_id', '=', userId)
    )
    .where('games.tournament_id', '=', tournamentId)
    .select([
      sql<number>`count(*)`.as('total_games'),
      sql<number>`count(*) filter (where games.game_type = 'group')`.as('total_group_games'),
      sql<number>`count(*) filter (
        where game_guesses.home_score is not null
        and game_guesses.away_score is not null
        and (
          games.game_type = 'group'
          or game_guesses.home_score != game_guesses.away_score
          or game_guesses.home_penalty_winner = true
          or game_guesses.away_penalty_winner = true
        )
      )`.as('completed_games'),
      sql<number>`count(*) filter (
        where games.game_type = 'group'
        and game_guesses.home_score is not null
        and game_guesses.away_score is not null
      )`.as('completed_group_games'),
      sql<number>`count(*) filter (where game_guesses.boost_type = 'silver')`.as('silver_boosts_used'),
      sql<number>`count(*) filter (where game_guesses.boost_type = 'golden')`.as('golden_boosts_used'),
    ])
    .executeTakeFirst()
}

/**
 * Single GROUP BY query replacing 4 sequential queries (round metadata, total per round,
 * completed per round, first-stage total for qualifier slots).
 */
async function fetchPlayoffRoundsWithCompletion(userId: string, tournamentId: string) {
  return db
    .selectFrom('tournament_playoff_rounds')
    .innerJoin(
      'tournament_playoff_round_games',
      'tournament_playoff_round_games.tournament_playoff_round_id',
      'tournament_playoff_rounds.id'
    )
    .leftJoin('game_guesses', (join) =>
      join
        .onRef('game_guesses.game_id', '=', 'tournament_playoff_round_games.game_id')
        .on('game_guesses.user_id', '=', userId)
    )
    .where('tournament_playoff_rounds.tournament_id', '=', tournamentId)
    .groupBy([
      'tournament_playoff_rounds.id',
      'tournament_playoff_rounds.round_name',
      'tournament_playoff_rounds.round_order',
      'tournament_playoff_rounds.is_final',
      'tournament_playoff_rounds.is_third_place',
      'tournament_playoff_rounds.is_first_stage',
    ])
    .orderBy('tournament_playoff_rounds.round_order', 'asc')
    .select([
      'tournament_playoff_rounds.id',
      'tournament_playoff_rounds.round_name',
      'tournament_playoff_rounds.round_order',
      'tournament_playoff_rounds.is_final',
      'tournament_playoff_rounds.is_third_place',
      'tournament_playoff_rounds.is_first_stage',
      sql<number>`count(*)`.as('total_games'),
      sql<number>`count(*) filter (
        where game_guesses.home_score is not null
        and game_guesses.away_score is not null
        and (
          game_guesses.home_score != game_guesses.away_score
          or game_guesses.home_penalty_winner = true
          or game_guesses.away_penalty_winner = true
        )
      )`.as('completed_games'),
    ])
    .execute()
}

/**
 * Get tournament prediction completion status for a user.
 * Tracks completion across 3 categories: final standings, awards, and qualifiers.
 *
 * Runs 4 parallel DB queries instead of 13 sequential ones:
 * 1. findTournamentGuessByUserIdTournament — final standings + award data
 * 2. fetchGameAndBoostStats — game totals, completions, and boost counts (replaces 6 queries)
 * 3. getAllUserGroupPositionsPredictions — qualifier completion
 * 4. fetchPlayoffRoundsWithCompletion — round metadata + per-round totals (replaces 4 queries)
 *
 * Pass firstGameDate when the caller already has it (e.g. hub-actions already fetches
 * findFirstGameInTournament) to skip an extra DB round-trip for isPredictionLocked.
 */
export async function getTournamentPredictionCompletion(
  userId: string,
  tournamentId: string,
  tournament: Tournament,
  firstGameDate?: Date | null
): Promise<TournamentPredictionCompletion> {
  const [tournamentGuess, gameStats, groupPredictions, playoffRoundsData] = await Promise.all([
    findTournamentGuessByUserIdTournament(userId, tournamentId),
    fetchGameAndBoostStats(userId, tournamentId),
    getAllUserGroupPositionsPredictions(userId, tournamentId),
    fetchPlayoffRoundsWithCompletion(userId, tournamentId),
  ])

  const totalGames = Number(gameStats?.total_games ?? 0)
  const completedGames = Number(gameStats?.completed_games ?? 0)
  const totalGroupGames = Number(gameStats?.total_group_games ?? 0)
  const completedGroupGames = Number(gameStats?.completed_group_games ?? 0)
  const silverBoostsUsed = Number(gameStats?.silver_boosts_used ?? 0)
  const goldenBoostsUsed = Number(gameStats?.golden_boosts_used ?? 0)

  const silverBoostsMax = tournament.max_silver_games ?? 0
  const goldenBoostsMax = tournament.max_golden_games ?? 0

  // Category 1: Final Standings (3 items)
  const champion = !!tournamentGuess?.champion_team_id
  const runnerUp = !!tournamentGuess?.runner_up_team_id
  const thirdPlace = !!tournamentGuess?.third_place_team_id
  const finalStandingsCompleted = [champion, runnerUp, thirdPlace].filter(Boolean).length

  // Category 2: Individual Awards (4 items)
  const bestPlayer = !!tournamentGuess?.best_player_id
  const topGoalscorer = !!tournamentGuess?.top_goalscorer_player_id
  const bestGoalkeeper = !!tournamentGuess?.best_goalkeeper_player_id
  const bestYoungPlayer = !!tournamentGuess?.best_young_player_id
  const awardsCompleted = [bestPlayer, topGoalscorer, bestGoalkeeper, bestYoungPlayer].filter(Boolean).length

  // Category 3: Qualifiers — derive totalQualifierSlots from first-stage rounds
  const totalFirstRoundGames = playoffRoundsData
    .filter((r) => r.is_first_stage)
    .reduce((sum, r) => sum + Number(r.total_games), 0)
  const totalQualifierSlots = totalFirstRoundGames * 2

  const qualifiersCompleted = groupPredictions.reduce((count, group) => {
    const positions = group.team_predicted_positions as unknown as TeamPositionPrediction[]
    return count + positions.filter((t) => t.predicted_to_qualify).length
  }, 0)

  // Overall metrics
  const overallTotal = 3 + 4 + totalQualifierSlots
  const overallCompleted = finalStandingsCompleted + awardsCompleted + qualifiersCompleted
  const overallPercentage = overallTotal > 0 ? Math.round((overallCompleted / overallTotal) * 100) : 0

  // Per-playoff-round completion
  const playoffRoundsCompletion: Record<string, PlayoffRoundCompletionData> = {}
  for (const round of playoffRoundsData) {
    playoffRoundsCompletion[round.id] = {
      total: Number(round.total_games),
      completed: Number(round.completed_games),
      round_name: round.round_name,
      is_final: round.is_final ?? undefined,
      is_third_place: round.is_third_place ?? undefined,
    }
  }

  // isPredictionLocked: use firstGameDate if provided by caller, otherwise fetch from DB
  const tournamentStartDate = firstGameDate !== undefined
    ? firstGameDate
    : await getTournamentStartDate(tournamentId)

  const isPredictionLocked = tournamentStartDate
    ? Date.now() > tournamentStartDate.getTime() + PREDICTION_LOCK_OFFSET_MS
    : false

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
    completedGames,
    totalGames,
    completedGroupGames,
    totalGroupGames,
    silverBoostsUsed,
    goldenBoostsUsed,
    silverBoostsMax,
    goldenBoostsMax,
    playoffRoundsCompletion,
  }
}
