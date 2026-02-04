'use server'

import { Box } from "../../../components/mui-wrappers";
import { getLoggedInUser } from "../../../actions/user-actions";
import { redirect } from "next/navigation";
import { getGameGuessStatisticsForUsers, getBoostAllocationBreakdown } from "../../../db/game-guess-repository";
import { findTournamentGuessByUserIdTournament } from "../../../db/tournament-guess-repository";
import { getTournamentPredictionCompletion } from "../../../db/tournament-prediction-completion-repository";
import { findTournamentById } from "../../../db/tournament-repository";
import { PerformanceOverviewCard } from "../../../components/tournament-stats/performance-overview-card";
import { PredictionAccuracyCard } from "../../../components/tournament-stats/prediction-accuracy-card";
import { BoostAnalysisCard } from "../../../components/tournament-stats/boost-analysis-card";
import { StatsTabs } from "../../../components/tournament-stats/stats-tabs";

type Props = {
  readonly params: Promise<{
    id: string
  }>
}

// Type for calculated stats passed to components
type PerformanceStats = {
  totalPoints: number
  groupStagePoints: number
  groupGamePoints: number
  groupBoostBonus: number
  groupQualifiedTeamsPoints: number
  groupPositionPoints: number
  playoffStagePoints: number
  playoffGamePoints: number
  playoffBoostBonus: number
  honorRollPoints: number
  individualAwardsPoints: number
}

type AccuracyStats = {
  totalPredictionsMade: number
  totalGamesAvailable: number
  completionPercentage: number
  overallCorrect: number
  overallCorrectPercentage: number
  overallExact: number
  overallExactPercentage: number
  overallMissed: number
  overallMissedPercentage: number
  groupCorrect: number
  groupCorrectPercentage: number
  groupExact: number
  groupExactPercentage: number
  playoffCorrect: number
  playoffCorrectPercentage: number
  playoffExact: number
  playoffExactPercentage: number
}

type BoostStats = {
  boostType: 'silver' | 'golden'
  available: number
  used: number
  usedPercentage: number
  scoredGames: number
  successRate: number
  pointsEarned: number
  roi: number
  allocationByGroup: { groupLetter: string, count: number }[]
  allocationPlayoffs: number
}

export default async function TournamentStatsPage(props: Props) {
  const params = await props.params
  const tournamentId = params.id

  // Auth check
  const user = await getLoggedInUser()
  if (!user) {
    redirect(`/tournaments/${tournamentId}`)
  }

  // Fetch all required data
  const tournament = await findTournamentById(tournamentId)
  if (!tournament) {
    redirect(`/tournaments`)
  }

  const userGameStatsList = await getGameGuessStatisticsForUsers([user.id], tournamentId)
  const userGameStats = userGameStatsList.length > 0 ? userGameStatsList[0] : null

  const tournamentGuess = await findTournamentGuessByUserIdTournament(user.id, tournamentId)

  const silverBoostData = await getBoostAllocationBreakdown(user.id, tournamentId, 'silver')
  const goldenBoostData = await getBoostAllocationBreakdown(user.id, tournamentId, 'golden')

  const predictionCompletion = await getTournamentPredictionCompletion(user.id, tournamentId, tournament)

  // Calculate derived metrics for Performance Overview
  const performanceStats: PerformanceStats = {
    totalPoints: 0,
    groupStagePoints: 0,
    groupGamePoints: userGameStats?.group_score ?? 0,
    groupBoostBonus: userGameStats?.group_boost_bonus ?? 0,
    groupQualifiedTeamsPoints: tournamentGuess?.qualified_teams_score ?? 0,
    groupPositionPoints: tournamentGuess?.group_position_score ?? 0,
    playoffStagePoints: 0,
    playoffGamePoints: userGameStats?.playoff_score ?? 0,
    playoffBoostBonus: userGameStats?.playoff_boost_bonus ?? 0,
    honorRollPoints: tournamentGuess?.honor_roll_score ?? 0,
    individualAwardsPoints: tournamentGuess?.individual_awards_score ?? 0
  }

  // Calculate stage totals
  performanceStats.groupStagePoints =
    performanceStats.groupGamePoints +
    performanceStats.groupBoostBonus +
    performanceStats.groupQualifiedTeamsPoints +
    performanceStats.groupPositionPoints

  performanceStats.playoffStagePoints =
    performanceStats.playoffGamePoints +
    performanceStats.playoffBoostBonus +
    performanceStats.honorRollPoints +
    performanceStats.individualAwardsPoints

  performanceStats.totalPoints =
    performanceStats.groupStagePoints +
    performanceStats.playoffStagePoints

  // Calculate Prediction Accuracy stats
  const totalPredictionsMade = predictionCompletion?.overallCompleted ?? 0
  const totalGamesAvailable = predictionCompletion?.overallTotal ?? 0

  const accuracyStats: AccuracyStats = {
    totalPredictionsMade,
    totalGamesAvailable,
    completionPercentage: totalGamesAvailable > 0
      ? Math.round((totalPredictionsMade / totalGamesAvailable) * 1000) / 10
      : 0,
    overallCorrect: userGameStats?.total_correct_guesses ?? 0,
    overallCorrectPercentage: totalPredictionsMade > 0
      ? Math.round((userGameStats?.total_correct_guesses ?? 0) / totalPredictionsMade * 1000) / 10
      : 0,
    overallExact: userGameStats?.total_exact_guesses ?? 0,
    overallExactPercentage: totalPredictionsMade > 0
      ? Math.round((userGameStats?.total_exact_guesses ?? 0) / totalPredictionsMade * 1000) / 10
      : 0,
    overallMissed: totalPredictionsMade - (userGameStats?.total_correct_guesses ?? 0),
    overallMissedPercentage: totalPredictionsMade > 0
      ? Math.round((totalPredictionsMade - (userGameStats?.total_correct_guesses ?? 0)) / totalPredictionsMade * 1000) / 10
      : 0,
    groupCorrect: userGameStats?.group_correct_guesses ?? 0,
    groupCorrectPercentage: totalPredictionsMade > 0
      ? Math.round((userGameStats?.group_correct_guesses ?? 0) / totalPredictionsMade * 1000) / 10
      : 0,
    groupExact: userGameStats?.group_exact_guesses ?? 0,
    groupExactPercentage: totalPredictionsMade > 0
      ? Math.round((userGameStats?.group_exact_guesses ?? 0) / totalPredictionsMade * 1000) / 10
      : 0,
    playoffCorrect: userGameStats?.playoff_correct_guesses ?? 0,
    playoffCorrectPercentage: totalPredictionsMade > 0
      ? Math.round((userGameStats?.playoff_correct_guesses ?? 0) / totalPredictionsMade * 1000) / 10
      : 0,
    playoffExact: userGameStats?.playoff_exact_guesses ?? 0,
    playoffExactPercentage: totalPredictionsMade > 0
      ? Math.round((userGameStats?.playoff_exact_guesses ?? 0) / totalPredictionsMade * 1000) / 10
      : 0,
  }

  // Calculate Boost stats
  const silverBoostStats: BoostStats = {
    boostType: 'silver',
    available: tournament.max_silver_games ?? 0,
    used: silverBoostData.totalBoosts,
    usedPercentage: (tournament.max_silver_games ?? 0) > 0
      ? Math.round((silverBoostData.totalBoosts / (tournament.max_silver_games ?? 1)) * 1000) / 10
      : 0,
    scoredGames: silverBoostData.scoredGamesCount,
    successRate: silverBoostData.totalBoosts > 0
      ? Math.round((silverBoostData.scoredGamesCount / silverBoostData.totalBoosts) * 1000) / 10
      : 0,
    pointsEarned: silverBoostData.totalPointsEarned,
    roi: silverBoostData.totalBoosts > 0
      ? Math.round((silverBoostData.totalPointsEarned / silverBoostData.totalBoosts) * 10) / 10
      : 0,
    allocationByGroup: silverBoostData.byGroup,
    allocationPlayoffs: silverBoostData.playoffCount
  }

  const goldenBoostStats: BoostStats = {
    boostType: 'golden',
    available: tournament.max_golden_games ?? 0,
    used: goldenBoostData.totalBoosts,
    usedPercentage: (tournament.max_golden_games ?? 0) > 0
      ? Math.round((goldenBoostData.totalBoosts / (tournament.max_golden_games ?? 1)) * 1000) / 10
      : 0,
    scoredGames: goldenBoostData.scoredGamesCount,
    successRate: goldenBoostData.totalBoosts > 0
      ? Math.round((goldenBoostData.scoredGamesCount / goldenBoostData.totalBoosts) * 1000) / 10
      : 0,
    pointsEarned: goldenBoostData.totalPointsEarned,
    roi: goldenBoostData.totalBoosts > 0
      ? Math.round((goldenBoostData.totalPointsEarned / goldenBoostData.totalBoosts) * 10) / 10
      : 0,
    allocationByGroup: goldenBoostData.byGroup,
    allocationPlayoffs: goldenBoostData.playoffCount
  }

  return (
    <Box pt={2} maxWidth={'868px'} mx={{md: 'auto'}}>
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
