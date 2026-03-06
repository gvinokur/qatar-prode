'use server'

import { getGameGuessStatisticsForUsers } from '../db/game-guess-repository'
import { getTournamentGuessStatsForUsers } from '../db/tournament-guess-repository'
import { getGameCountsForTournament } from '../db/game-repository'
import {
  calculateAccuracyStats,
  type PerformanceStats,
  type AccuracyStats,
} from '../utils/stats-calculations'

export interface UserComparisonStats {
  userId: string
  performance: PerformanceStats
  accuracy: AccuracyStats
}

export async function getUserStatsForComparison(
  userIds: [string, string],
  tournamentId: string
): Promise<UserComparisonStats[]> {
  const [gameStatsList, tournamentGuessList, gameCounts] = await Promise.all([
    getGameGuessStatisticsForUsers(userIds, tournamentId),
    getTournamentGuessStatsForUsers(userIds, tournamentId),
    getGameCountsForTournament(tournamentId),
  ])

  const { total: totalGamesAvailable, played: totalGamesPlayed } = gameCounts

  return userIds.map((userId) => {
    const gameStats = gameStatsList.find((s) => s.user_id === userId) ?? null
    const tournamentGuess = tournamentGuessList.find((g) => g.user_id === userId) ?? null

    const groupGamePoints = gameStats?.group_score ?? 0
    const groupBoostBonus = gameStats?.group_boost_bonus ?? 0
    const groupQualifiedTeamsPoints = tournamentGuess?.qualified_teams_score ?? 0
    const groupQualifiedTeamsCorrect = tournamentGuess?.qualified_teams_correct ?? 0
    const groupQualifiedTeamsExact = tournamentGuess?.qualified_teams_exact ?? 0
    const groupPositionPoints = tournamentGuess?.group_position_score ?? 0
    const playoffGamePoints = gameStats?.playoff_score ?? 0
    const playoffBoostBonus = gameStats?.playoff_boost_bonus ?? 0
    const honorRollPoints = tournamentGuess?.honor_roll_score ?? 0
    const individualAwardsPoints = tournamentGuess?.individual_awards_score ?? 0

    const groupStagePoints = groupGamePoints + groupBoostBonus + groupQualifiedTeamsPoints
    const playoffStagePoints =
      playoffGamePoints + playoffBoostBonus + honorRollPoints + individualAwardsPoints
    const totalPoints = groupStagePoints + playoffStagePoints

    const performance: PerformanceStats = {
      totalPoints,
      groupStagePoints,
      groupGamePoints,
      groupBoostBonus,
      groupQualifiedTeamsPoints,
      groupQualifiedTeamsCorrect,
      groupQualifiedTeamsExact,
      groupPositionPoints,
      playoffStagePoints,
      playoffGamePoints,
      playoffBoostBonus,
      honorRollPoints,
      individualAwardsPoints,
    }

    // In H2H context, totalPredictionsMade is not tracked — use 0
    // completionPercentage won't be shown; accuracy % uses totalGamesPlayed as denominator
    const accuracy = calculateAccuracyStats(gameStats, 0, totalGamesAvailable, totalGamesPlayed)

    return { userId, performance, accuracy }
  })
}
