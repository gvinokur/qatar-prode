'use server'

import { Metadata } from 'next'
import { Box } from "../../../../components/mui-wrappers";
import { getLoggedInUser } from "../../../../actions/user-actions";
import { redirect } from "next/navigation";
import { getGameGuessStatisticsForUsers, getBoostAllocationBreakdown, countGameGuessesByUserId } from "../../../../db/game-guess-repository";
import { findTournamentGuessByUserIdTournament } from "../../../../db/tournament-guess-repository";
import { getGameCountsForTournament } from "../../../../db/game-repository";
import { getScoreHistoryForUsers } from "../../../../db/score-history-repository";
import { PerformanceOverviewCard } from "../../../../components/tournament-stats/performance-overview-card";
import { PredictionAccuracyCard } from "../../../../components/tournament-stats/prediction-accuracy-card";
import { BoostAnalysisCard } from "../../../../components/tournament-stats/boost-analysis-card";
import { HistoryTabCard } from "../../../../components/tournament-stats/history-tab-card";
import { StatsTabs } from "../../../../components/tournament-stats/stats-tabs";
import { calculateAccuracyStats, calculateBoostStats, type PerformanceStats } from "../../../../utils/stats-calculations";
import { getTranslations, getLocale } from 'next-intl/server';
import { buildTournamentMetadata, findTournamentByIdCached } from '../../../../utils/metadata-utils'
import JsonLd from '../../../../components/shared/json-ld'
import { buildBreadcrumbListJsonLd } from '../../../../utils/json-ld-utils'

type Props = {
  readonly params: Promise<{
    id: string
  }>
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  const locale = await getLocale()
  const tCommon = await getTranslations({ locale, namespace: 'common' })
  const tStats = await getTranslations({ locale, namespace: 'stats' })
  const appName = tCommon('app.name')

  return buildTournamentMetadata(
    id,
    appName,
    (t) => `${tStats('sidebar.title')} – ${t.long_name} | ${appName}`,
    (t) => tStats('metadata.description', { name: t.long_name })
  )
}

export default async function TournamentStatsPage(props: Props) {
  const params = await props.params
  const tournamentId = params.id
  const locale = await getLocale()
  const tCommon = await getTranslations({ locale, namespace: 'common' })
  const tStats = await getTranslations({ locale, namespace: 'stats' })
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  // Auth check
  const user = await getLoggedInUser()
  if (!user) {
    redirect(`/es/tournaments/${tournamentId}`)
  }

  // Fetch all required data
  const tournament = await findTournamentByIdCached(tournamentId)
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
  // Get actual game prediction count via SQL COUNT(*) query
  const totalPredictionsMade = await countGameGuessesByUserId(user.id, tournamentId)

  // Get total games and played games via efficient COUNT query (1 row instead of all game rows)
  const { total: totalGamesAvailable, played: totalGamesPlayed } = await getGameCountsForTournament(tournamentId)

  const accuracyStats = calculateAccuracyStats(userGameStats, totalPredictionsMade, totalGamesAvailable, totalGamesPlayed)

  // Calculate Boost stats
  const silverBoostStats = calculateBoostStats(silverBoostData, tournament.max_silver_games, 'silver')
  const goldenBoostStats = calculateBoostStats(goldenBoostData, tournament.max_golden_games, 'golden')

  // Fetch score history for History tab
  const userHistory = await getScoreHistoryForUsers([user.id], tournamentId)

  return (
    <>
      <JsonLd data={buildBreadcrumbListJsonLd([
        { name: tCommon('breadcrumb.home'), url: `${appUrl}/${locale}` },
        { name: tournament.long_name, url: `${appUrl}/${locale}/tournaments/${tournamentId}` },
        { name: tStats('sidebar.title'), url: `${appUrl}/${locale}/tournaments/${tournamentId}/stats` },
      ])} />
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
          historyTab={<HistoryTabCard rows={userHistory} />}
        />
      </Box>
    </>
  )
}
