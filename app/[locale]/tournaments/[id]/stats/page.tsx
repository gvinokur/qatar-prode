'use server'

import { Box } from "../../../../components/mui-wrappers";
import { getLoggedInUser } from "../../../../actions/user-actions";
import { redirect } from "next/navigation";
import { getGameGuessStatisticsForUsers, getBoostAllocationBreakdown, findGameGuessesByUserId } from "../../../../db/game-guess-repository";
import { findTournamentGuessByUserIdTournament } from "../../../../db/tournament-guess-repository";
import { findTournamentById } from "../../../../db/tournament-repository";
import { findGamesInTournament } from "../../../../db/game-repository";
import { PerformanceOverviewCard } from "../../../../components/tournament-stats/performance-overview-card";
import { PredictionAccuracyCard } from "../../../../components/tournament-stats/prediction-accuracy-card";
import { BoostAnalysisCard } from "../../../../components/tournament-stats/boost-analysis-card";
import { StatsTabs } from "../../../../components/tournament-stats/stats-tabs";

type Props = {
  readonly params: Promise<{
    id: string
  }>
}

// Type for calculated stats passed to components
type PerformanceStats = {
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

type AccuracyStats = {
  readonly totalPredictionsMade: number
  readonly totalGamesAvailable: number
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

type BoostStats = {
  readonly boostType: 'silver' | 'golden'
  readonly available: number
  readonly used: number
  readonly usedPercentage: number
  readonly scoredGames: number
  readonly successRate: number
  readonly pointsEarned: number
  readonly roi: number
  readonly allocationByGroup: { groupLetter: string, count: number }[]
  readonly allocationPlayoffs: number
}

// Helper function to calculate percentage with proper rounding
function calculatePercentage(numerator: number, denominator: number, decimalPlaces: number = 1): number {
  if (denominator === 0) return 0
  const multiplier = decimalPlaces === 1 ? 1000 : 100
  const divisor = decimalPlaces === 1 ? 10 : 1
  return Math.round((numerator / denominator) * multiplier) / divisor
}

// Helper function to calculate accuracy stats
function calculateAccuracyStats(
  userGameStats: { total_correct_guesses?: number, total_exact_guesses?: number, group_correct_guesses?: number, group_exact_guesses?: number, playoff_correct_guesses?: number, playoff_exact_guesses?: number } | null,
  totalPredictionsMade: number,
  totalGamesAvailable: number
): AccuracyStats {
  const overallCorrect = userGameStats?.total_correct_guesses ?? 0
  const overallExact = userGameStats?.total_exact_guesses ?? 0

  return {
    totalPredictionsMade,
    totalGamesAvailable,
    completionPercentage: calculatePercentage(totalPredictionsMade, totalGamesAvailable),
    overallCorrect,
    overallCorrectPercentage: calculatePercentage(overallCorrect, totalPredictionsMade),
    overallExact,
    overallExactPercentage: calculatePercentage(overallExact, totalPredictionsMade),
    overallMissed: totalPredictionsMade - overallCorrect,
    overallMissedPercentage: calculatePercentage(totalPredictionsMade - overallCorrect, totalPredictionsMade),
    groupCorrect: userGameStats?.group_correct_guesses ?? 0,
    groupCorrectPercentage: calculatePercentage(userGameStats?.group_correct_guesses ?? 0, totalPredictionsMade),
    groupExact: userGameStats?.group_exact_guesses ?? 0,
    groupExactPercentage: calculatePercentage(userGameStats?.group_exact_guesses ?? 0, totalPredictionsMade),
    playoffCorrect: userGameStats?.playoff_correct_guesses ?? 0,
    playoffCorrectPercentage: calculatePercentage(userGameStats?.playoff_correct_guesses ?? 0, totalPredictionsMade),
    playoffExact: userGameStats?.playoff_exact_guesses ?? 0,
    playoffExactPercentage: calculatePercentage(userGameStats?.playoff_exact_guesses ?? 0, totalPredictionsMade),
  }
}

// Helper function to calculate boost stats
function calculateBoostStats(
  boostData: { totalBoosts: number, scoredGamesCount: number, totalPointsEarned: number, byGroup: { groupLetter: string, count: number }[], playoffCount: number },
  maxGames: number | null | undefined,
  boostType: 'silver' | 'golden'
): BoostStats {
  const available = maxGames ?? 0
  const { totalBoosts, scoredGamesCount, totalPointsEarned, byGroup, playoffCount } = boostData

  return {
    boostType,
    available,
    used: totalBoosts,
    usedPercentage: calculatePercentage(totalBoosts, available),
    scoredGames: scoredGamesCount,
    successRate: calculatePercentage(scoredGamesCount, totalBoosts),
    pointsEarned: totalPointsEarned,
    roi: totalBoosts > 0 ? Math.round((totalPointsEarned / totalBoosts) * 10) / 10 : 0,
    allocationByGroup: byGroup,
    allocationPlayoffs: playoffCount
  }
}

export default async function TournamentStatsPage(props: Props) {
  const params = await props.params
  const tournamentId = params.id

  // Auth check
  const user = await getLoggedInUser()
  if (!user) {
    redirect(`/es/tournaments/${tournamentId}`)
  }

  // Fetch all required data
  const tournament = await findTournamentById(tournamentId)
  if (!tournament) {
    redirect(`/es/tournaments`)
  }

  const userGameStatsList = await getGameGuessStatisticsForUsers([user.id], tournamentId)
  const userGameStats = userGameStatsList.length > 0 ? userGameStatsList[0] : null

  const tournamentGuess = await findTournamentGuessByUserIdTournament(user.id, tournamentId)

  const silverBoostData = await getBoostAllocationBreakdown(user.id, tournamentId, 'silver')
  const goldenBoostData = await getBoostAllocationBreakdown(user.id, tournamentId, 'golden')

  // Calculate derived metrics for Performance Overview
  const groupGamePoints = userGameStats?.group_score ?? 0
  const groupBoostBonus = userGameStats?.group_boost_bonus ?? 0
  const groupQualifiedTeamsPoints = tournamentGuess?.qualified_teams_score ?? 0
  const groupQualifiedTeamsCorrect = tournamentGuess?.qualified_teams_correct ?? 0
  const groupQualifiedTeamsExact = tournamentGuess?.qualified_teams_exact ?? 0
  const groupPositionPoints = tournamentGuess?.group_position_score ?? 0 // Legacy, always 0 now
  const playoffGamePoints = userGameStats?.playoff_score ?? 0
  const playoffBoostBonus = userGameStats?.playoff_boost_bonus ?? 0
  const honorRollPoints = tournamentGuess?.honor_roll_score ?? 0
  const individualAwardsPoints = tournamentGuess?.individual_awards_score ?? 0

  // Note: groupPositionPoints excluded from calculation as it's deprecated (always 0)
  const groupStagePoints = groupGamePoints + groupBoostBonus + groupQualifiedTeamsPoints
  const playoffStagePoints = playoffGamePoints + playoffBoostBonus + honorRollPoints + individualAwardsPoints
  const totalPoints = groupStagePoints + playoffStagePoints

  const performanceStats: PerformanceStats = {
    totalPoints,
    groupStagePoints,
    groupGamePoints,
    groupBoostBonus,
    groupQualifiedTeamsPoints,
    groupQualifiedTeamsCorrect,
    groupQualifiedTeamsExact,
    groupPositionPoints, // Keep for backward compatibility in UI
    playoffStagePoints,
    playoffGamePoints,
    playoffBoostBonus,
    honorRollPoints,
    individualAwardsPoints
  }

  // Calculate Prediction Accuracy stats
  // Get actual game prediction count from game guesses
  const gameGuessesArray = user ? await findGameGuessesByUserId(user.id, tournamentId) : []
  const totalPredictionsMade = gameGuessesArray.length

  // Get total games in tournament
  const allGames = await findGamesInTournament(tournamentId)
  const totalGamesAvailable = allGames.length

  const accuracyStats = calculateAccuracyStats(userGameStats, totalPredictionsMade, totalGamesAvailable)

  // Calculate Boost stats
  const silverBoostStats = calculateBoostStats(silverBoostData, tournament.max_silver_games, 'silver')
  const goldenBoostStats = calculateBoostStats(goldenBoostData, tournament.max_golden_games, 'golden')

  return (
    <Box pt={2}>
      <StatsTabs
        performanceTab={<PerformanceOverviewCard {...performanceStats} />}
        precisionTab={<PredictionAccuracyCard {...accuracyStats} />}
        boostsTab={
          <BoostAnalysisCard
            silverBoost={silverBoostStats}
            goldenBoost={goldenBoostStats}
          />
        }
      />
    </Box>
  )
}
