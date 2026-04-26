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
  readonly overallGoalDifference: number
  readonly overallGoalDifferencePercentage: number
  readonly overallExact: number
  readonly overallExactPercentage: number
  readonly overallMissed: number
  readonly overallMissedPercentage: number
  readonly groupCorrect: number
  readonly groupCorrectPercentage: number
  readonly groupGoalDifference: number
  readonly groupGoalDifferencePercentage: number
  readonly groupExact: number
  readonly groupExactPercentage: number
  readonly playoffCorrect: number
  readonly playoffCorrectPercentage: number
  readonly playoffGoalDifference: number
  readonly playoffGoalDifferencePercentage: number
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
    total_goal_difference_guesses?: number
    group_correct_guesses?: number
    group_exact_guesses?: number
    group_goal_difference_guesses?: number
    playoff_correct_guesses?: number
    playoff_exact_guesses?: number
    playoff_goal_difference_guesses?: number
  } | null,
  totalPredictionsMade: number,
  totalGamesAvailable: number,
  totalGamesPlayed: number
): AccuracyStats {
  const overallCorrect = userGameStats?.total_correct_guesses ?? 0
  // total_exact_guesses in DB = score > 1 = goal_difference + exact combined
  // total_goal_difference_guesses = only goal_difference tier (exclusive)
  // "Goal difference" display is cumulative (includes exact), "Exact" is the strict tier only
  const overallGoalDifferenceExclusive = userGameStats?.total_goal_difference_guesses ?? 0
  const overallGoalDifferenceOrBetter = userGameStats?.total_exact_guesses ?? 0
  const overallGoalDifference = overallGoalDifferenceOrBetter
  const overallExact = overallGoalDifferenceOrBetter - overallGoalDifferenceExclusive

  const groupExactOrBetter = userGameStats?.group_exact_guesses ?? 0
  const groupGoalDifferenceExclusive = userGameStats?.group_goal_difference_guesses ?? 0
  const playoffExactOrBetter = userGameStats?.playoff_exact_guesses ?? 0
  const playoffGoalDifferenceExclusive = userGameStats?.playoff_goal_difference_guesses ?? 0

  return {
    totalPredictionsMade,
    totalGamesAvailable,
    totalGamesPlayed,
    completionPercentage: calculatePercentage(totalPredictionsMade, totalGamesAvailable),
    overallCorrect,
    overallCorrectPercentage: calculatePercentage(overallCorrect, totalGamesPlayed),
    overallGoalDifference,
    overallGoalDifferencePercentage: calculatePercentage(overallGoalDifference, totalGamesPlayed),
    overallExact,
    overallExactPercentage: calculatePercentage(overallExact, totalGamesPlayed),
    overallMissed: totalGamesPlayed - overallCorrect,
    overallMissedPercentage: calculatePercentage(totalGamesPlayed - overallCorrect, totalGamesPlayed),
    groupCorrect: userGameStats?.group_correct_guesses ?? 0,
    groupCorrectPercentage: calculatePercentage(userGameStats?.group_correct_guesses ?? 0, totalGamesPlayed),
    groupGoalDifference: groupExactOrBetter,
    groupGoalDifferencePercentage: calculatePercentage(groupExactOrBetter, totalGamesPlayed),
    groupExact: groupExactOrBetter - groupGoalDifferenceExclusive,
    groupExactPercentage: calculatePercentage(groupExactOrBetter - groupGoalDifferenceExclusive, totalGamesPlayed),
    playoffCorrect: userGameStats?.playoff_correct_guesses ?? 0,
    playoffCorrectPercentage: calculatePercentage(userGameStats?.playoff_correct_guesses ?? 0, totalGamesPlayed),
    playoffGoalDifference: playoffExactOrBetter,
    playoffGoalDifferencePercentage: calculatePercentage(playoffExactOrBetter, totalGamesPlayed),
    playoffExact: playoffExactOrBetter - playoffGoalDifferenceExclusive,
    playoffExactPercentage: calculatePercentage(playoffExactOrBetter - playoffGoalDifferenceExclusive, totalGamesPlayed),
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
