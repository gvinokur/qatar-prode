import { getActionCenterGames } from '../../actions/hub-actions'
import { ActionCenterCarousel } from './action-center-carousel'
import type { Locale } from '../../../i18n.config'

interface TournamentHubActionCenterProps {
  readonly tournamentId: string
  readonly locale: Locale
}

export async function TournamentHubActionCenter({
  tournamentId,
  locale,
}: TournamentHubActionCenterProps) {
  const data = await getActionCenterGames(tournamentId, locale)
  return <ActionCenterCarousel data={data} tournamentId={tournamentId} locale={locale} />
}
