import HistoryIcon from '@mui/icons-material/History'
import { getTranslations } from 'next-intl/server'
import { getRecentResultsData } from '../../actions/hub-actions'
import { DashboardCard } from './dashboard-card'
import { RecentResultsWidget } from './recent-results-widget'
import type { Locale } from '../../../i18n.config'

interface TournamentHubRecentResultsProps {
  readonly tournamentId: string
  readonly locale: Locale
}

export async function TournamentHubRecentResults({
  tournamentId,
  locale,
}: TournamentHubRecentResultsProps) {
  const [data, t] = await Promise.all([
    getRecentResultsData(tournamentId, locale),
    getTranslations({ locale, namespace: 'hub.recentResults' }),
  ])
  const base = `/${locale}/tournaments/${tournamentId}`

  return (
    <DashboardCard title={t('title')} icon={<HistoryIcon fontSize="small" />}>
      <RecentResultsWidget
        data={data}
        statsHref={`${base}/stats`}
        resultsHref={`${base}/results`}
        qualifiedTeamsHref={`${base}/qualified-teams`}
        awardsHref={`${base}/awards`}
      />
    </DashboardCard>
  )
}
