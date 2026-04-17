import { getRecentResultsData } from '../../actions/hub-actions'
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
  const data = await getRecentResultsData(tournamentId, locale)
  const base = `/${locale}/tournaments/${tournamentId}`

  return (
    <RecentResultsWidget
      data={data}
      statsHref={`${base}/stats`}
      resultsHref={`${base}/results`}
      qualifiedTeamsHref={`${base}/qualified-teams`}
      awardsHref={`${base}/awards`}
    />
  )
}
