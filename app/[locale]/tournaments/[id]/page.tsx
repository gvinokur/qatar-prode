'use server'

import { Suspense } from 'react'
import { Box } from '@mui/material'
import HistoryIcon from '@mui/icons-material/History'
import GroupsIcon from '@mui/icons-material/Groups'
import InsightsIcon from '@mui/icons-material/Insights'
import { getLocale, getTranslations } from 'next-intl/server'
import { toLocale } from '@/app/utils/locale-utils'
import { getLoggedInUser } from '@/app/actions/user-actions'
import { getTournamentHubPageData, getActionCenterGames, getPublicTournamentTiming } from '@/app/actions/hub-actions'
import { PREDICTION_LOCK_OFFSET_MS } from '@/app/utils/prediction-constants'
import { DashboardCard } from '@/app/components/tournament-hub/dashboard-card'
import { DashboardBanner } from '@/app/components/tournament-hub/dashboard-banner'
import { TournamentHubRecentResults } from '@/app/components/tournament-hub/tournament-hub-recent-results'
import { TournamentHubLeaderboardPeek } from '@/app/components/tournament-hub/tournament-hub-leaderboard-peek'
import { StatsAtAGlanceWidget } from '@/app/components/tournament-hub/stats-at-a-glance-widget'
import { GamesPredictionWidget } from '@/app/components/tournament-hub/games-prediction-widget'
import { QualifiedTeamsWidget } from '@/app/components/tournament-hub/qualified-teams-widget'
import { AwardsWidget } from '@/app/components/tournament-hub/awards-widget'
import { getRulesBySection } from '@/app/utils/scoring-rules-utils'

type Props = {
  readonly params: Promise<{
    id: string
  }>
}

export default async function TournamentHubPage(props: Props) {
  const { id } = await props.params
  const locale = toLocale(await getLocale())
  const gamesHref = `/${locale}/tournaments/${id}/games`

  const [hubData, user] = await Promise.all([
    getTournamentHubPageData(id),
    getLoggedInUser(),
  ])

  const tRules = await getTranslations('rules.rules')
  const scoringRules = getRulesBySection(
    hubData.scoringConfig,
    (key, params) => tRules(key as Parameters<typeof tRules>[0], params as Parameters<typeof tRules>[1]) // NOSONAR
  )

  const [timing, data] = await Promise.all([
    getPublicTournamentTiming(id, locale),
    !hubData.isFinished && user ? getActionCenterGames(id, locale) : Promise.resolve(null),
  ])
  const actionCenterData = data

  const lockDateFormatted = timing?.firstGameDate
    ? new Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric', year: 'numeric' }).format(
        new Date(timing.firstGameDate.getTime() + PREDICTION_LOCK_OFFSET_MS)
      )
    : null
  const msUntilPredictionLock = timing?.firstGameDate
    ? timing.firstGameDate.getTime() + PREDICTION_LOCK_OFFSET_MS - Date.now()
    : Number.MAX_SAFE_INTEGER

  return (
    <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>

      {/* Banner Area */}
      <DashboardBanner user={user} timing={timing} data={data} />

      {/* Widget Grid — CSS Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 2 }}>
        <GamesPredictionWidget
          tournamentId={id}
          scoringRules={scoringRules}
          totalGames={hubData.totalGames}
          isStarted={hubData.isStarted}
          isFinished={hubData.isFinished}
          actionCenterData={actionCenterData}
          gamesHref={gamesHref}
        />
        {msUntilPredictionLock > 0 && (
          <>
            <QualifiedTeamsWidget
              isLoggedOff={!user}
              scoringRules={scoringRules}
              qtHref={`/${locale}/tournaments/${id}/qualified-teams`}
              qualifiersCompleted={actionCenterData?.qualifiersCompleted ?? 0}
              qualifiersTotal={hubData.qualifiersTotal}
              msUntilPredictionLock={msUntilPredictionLock}
              lockDateFormatted={lockDateFormatted}
            />
            <AwardsWidget
              isLoggedOff={!user}
              scoringRules={scoringRules}
              awardsHref={`/${locale}/tournaments/${id}/awards`}
              awardsCompleted={actionCenterData?.awardsCompleted ?? 0}
              awardsTotal={hubData.awardsTotal}
              msUntilPredictionLock={msUntilPredictionLock}
              lockDateFormatted={lockDateFormatted}
            />
          </>
        )}
        <Suspense fallback={<DashboardCard title="Groups" icon={<GroupsIcon fontSize="small" />} />}>
          <TournamentHubLeaderboardPeek tournamentId={id} locale={locale} isAuthenticated={!!user} />
        </Suspense>
        {timing?.tournamentHasStarted && (
          <Suspense fallback={<DashboardCard title="Results" icon={<HistoryIcon fontSize="small" />} />}>
            <TournamentHubRecentResults tournamentId={id} locale={locale} />
          </Suspense>
        )}
        {timing?.tournamentHasStarted && user && (
          <Suspense fallback={<DashboardCard title="Stats" icon={<InsightsIcon fontSize="small" />} />}>
            <StatsAtAGlanceWidget tournamentId={id} locale={locale} />
          </Suspense>
        )}
      </Box>

    </Box>
  )
}
