import { getActionCenterGames, computeIsIncompleteUser } from '../../actions/hub-actions'
import type { ActionCenterData } from '../../actions/hub-actions'
import { ActionCenterCarousel } from './action-center-carousel'
import { PreTournamentNewUserActionCenter } from './pre-tournament-new-user-action-center'
import type { Locale } from '../../../i18n.config'

interface TournamentHubActionCenterProps {
  readonly tournamentId: string
  readonly locale: Locale
  /** Pre-fetched data from the page level. When provided, skips the internal fetch. */
  readonly data?: ActionCenterData
}

export async function TournamentHubActionCenter({
  tournamentId,
  locale,
  data: dataProp,
}: TournamentHubActionCenterProps) {
  const data = dataProp ?? (await getActionCenterGames(tournamentId, locale))
  if (data.tournamentFinished) return null

  if (await computeIsIncompleteUser(data)) {
    return (
      <PreTournamentNewUserActionCenter data={data} tournamentId={tournamentId} locale={locale} />
    )
  }

  return <ActionCenterCarousel data={data} tournamentId={tournamentId} locale={locale} />
}
