// Shared stats calculation utilities used by both the stats page and head-to-head comparison

export type PerformanceStats = {
  readonly totalPoints: number
  readonly groupStagePoints: number
  readonly groupGamePoints: number
  readonly groupBoostBonus: number
  readonly groupQualifiedTeamsPoints: number
  readonly groupQualifiedTeamsCorrect: number
  readonly groupQualifiedTeamsExact: number
  readonly groupPositionPoints: number
  readonly playoffStagePoints: number
  readonly playoffGamePoints: number
  readonly playoffBoostBonus: number
  readonly honorRollPoints: number
  readonly individualAwardsPoints: number
}

export type AccuracyStats = {
  readonly totalPredictionsMade: number
  readonly totalGamesAvailable: number
  readonly totalGamesPlayed: number
  readonly completionPercentage: number
  readonly overallCorrect: number
  readonly overallCorrectPercentage: number
  readonly overallExact: number
  readonly overallExactPercentage: number
  readonly overallMissed: number
  readonly overallMissedPercentage: number
  readonly groupCorrect: number
  readonly groupCorrectPercentage: number
  readonly groupExact: number
  readonly groupExactPercentage: number
  readonly playoffCorrect: number
  readonly playoffCorrectPercentage: number
  readonly playoffExact: number
  readonly playoffExactPercentage: number
}

export type BoostStats = {
  readonly boostType: 'silver' | 'golden'
  readonly available: number
  readonly totalBoosts: number
  readonly lockedBoosts: number
  readonly activeBoosts: number
  readonly used: number
  readonly usedPercentage: number
  readonly scoredGames: number
  readonly successRate: number
  readonly pointsEarned: number
  readonly roi: number
  readonly allocationByGroup: { groupLetter: string; count: number }[]
  readonly allocationPlayoffs: number
}

export function calculatePercentage(
  numerator: number,
  denominator: number,
  decimalPlaces: number = 1
): number {
  if (denominator === 0) return 0
  const multiplier = decimalPlaces === 1 ? 1000 : 100
  const divisor = decimalPlaces === 1 ? 10 : 1
  return Math.round((numerator / denominator) * multiplier) / divisor
}

export function calculateAccuracyStats(
  userGameStats: {
    total_correct_guesses?: number
    total_exact_guesses?: number
    group_correct_guesses?: number
    group_exact_guesses?: number
    playoff_correct_guesses?: number
    playoff_exact_guesses?: number
  } | null,
  totalPredictionsMade: number,
  totalGamesAvailable: number,
  totalGamesPlayed: number
): AccuracyStats {
  const overallCorrect = userGameStats?.total_correct_guesses ?? 0
  const overallExact = userGameStats?.total_exact_guesses ?? 0

  return {
    totalPredictionsMade,
    totalGamesAvailable,
    totalGamesPlayed,
    completionPercentage: calculatePercentage(totalPredictionsMade, totalGamesAvailable),
    overallCorrect,
    overallCorrectPercentage: calculatePercentage(overallCorrect, totalGamesPlayed),
    overallExact,
    overallExactPercentage: calculatePercentage(overallExact, totalGamesPlayed),
    overallMissed: totalGamesPlayed - overallCorrect,
    overallMissedPercentage: calculatePercentage(totalGamesPlayed - overallCorrect, totalGamesPlayed),
    groupCorrect: userGameStats?.group_correct_guesses ?? 0,
    groupCorrectPercentage: calculatePercentage(userGameStats?.group_correct_guesses ?? 0, totalGamesPlayed),
    groupExact: userGameStats?.group_exact_guesses ?? 0,
    groupExactPercentage: calculatePercentage(userGameStats?.group_exact_guesses ?? 0, totalGamesPlayed),
    playoffCorrect: userGameStats?.playoff_correct_guesses ?? 0,
    playoffCorrectPercentage: calculatePercentage(userGameStats?.playoff_correct_guesses ?? 0, totalGamesPlayed),
    playoffExact: userGameStats?.playoff_exact_guesses ?? 0,
    playoffExactPercentage: calculatePercentage(userGameStats?.playoff_exact_guesses ?? 0, totalGamesPlayed),
  }
}

export function calculateBoostStats(
  boostData: {
    totalBoosts: number
    lockedBoosts: number
    activeBoosts: number
    scoredGamesCount: number
    totalPointsEarned: number
    byGroup: { groupLetter: string; count: number }[]
    playoffCount: number
  },
  maxGames: number | null | undefined,
  boostType: 'silver' | 'golden'
): BoostStats {
  const available = maxGames ?? 0
  const { totalBoosts, lockedBoosts, activeBoosts, scoredGamesCount, totalPointsEarned, byGroup, playoffCount } =
    boostData

  return {
    boostType,
    available,
    totalBoosts,
    lockedBoosts,
    activeBoosts,
    used: totalBoosts,
    usedPercentage: calculatePercentage(lockedBoosts, available),
    scoredGames: scoredGamesCount,
    successRate: calculatePercentage(scoredGamesCount, lockedBoosts),
    pointsEarned: totalPointsEarned,
    roi: lockedBoosts > 0 ? Math.round((totalPointsEarned / lockedBoosts) * 10) / 10 : 0,
    allocationByGroup: byGroup,
    allocationPlayoffs: playoffCount,
  }
}
