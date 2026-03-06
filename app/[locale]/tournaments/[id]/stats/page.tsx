'use server'

import { Box } from "../../../../components/mui-wrappers";
import { getLoggedInUser } from "../../../../actions/user-actions";
import { redirect } from "next/navigation";
import { getGameGuessStatisticsForUsers, getBoostAllocationBreakdown, findGameGuessesByUserId } from "../../../../db/game-guess-repository";
import { findTournamentGuessByUserIdTournament } from "../../../../db/tournament-guess-repository";
import { findTournamentById } from "../../../../db/tournament-repository";
import { getGameCountsForTournament } from "../../../../db/game-repository";
import { PerformanceOverviewCard } from "../../../../components/tournament-stats/performance-overview-card";
import { PredictionAccuracyCard } from "../../../../components/tournament-stats/prediction-accuracy-card";
import { BoostAnalysisCard } from "../../../../components/tournament-stats/boost-analysis-card";
import { StatsTabs } from "../../../../components/tournament-stats/stats-tabs";
import { calculateAccuracyStats, calculateBoostStats, type PerformanceStats } from "../../../../utils/stats-calculations";

type Props = {
  readonly params: Promise<{
    id: string
  }>
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

  // Get total games and played games via efficient COUNT query (1 row instead of all game rows)
  const { total: totalGamesAvailable, played: totalGamesPlayed } = await getGameCountsForTournament(tournamentId)

  const accuracyStats = calculateAccuracyStats(userGameStats, totalPredictionsMade, totalGamesAvailable, totalGamesPlayed)

  // Calculate Boost stats
  const silverBoostStats = calculateBoostStats(silverBoostData, tournament.max_silver_games, 'silver')
  const goldenBoostStats = calculateBoostStats(goldenBoostData, tournament.max_golden_games, 'golden')

  return (
    <Box sx={{ pt: 2, height: '100%' }}>
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
