import { getTranslations } from 'next-intl/server'
import { GamesActiveSection } from './games-active-section'
import { calculateDeadline } from '../../utils/countdown-utils'
import type { ActionCenterData } from '../../actions/hub-actions'

type UrgencyLevel = 'critical' | 'high' | 'medium' | 'safe' | 'empty'

const ONE_HOUR_MS = 60 * 60 * 1000
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000
const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000

function computeUrgencyLevel(data: ActionCenterData): UrgencyLevel {
  if (data.mode !== 'urgent') {
    return data.mode === 'fallback' ? 'safe' : 'empty'
  }
  if (data.games.length === 0) return 'empty'

  const now = Date.now()
  const minDeadline = Math.min(...data.games.map((g) => calculateDeadline(g.game_date)))
  const msUntilDeadline = minDeadline - now

  if (msUntilDeadline < 2 * ONE_HOUR_MS) return 'critical'
  if (msUntilDeadline < TWENTY_FOUR_HOURS_MS) return 'high'
  if (msUntilDeadline <= FORTY_EIGHT_HOURS_MS) return 'medium'
  return 'safe'
}

interface GamesActiveWidgetProps {
  readonly data: ActionCenterData
  readonly tournamentId: string
  readonly gamesHref: string
}

export async function GamesActiveWidget({ data, tournamentId, gamesHref }: GamesActiveWidgetProps) {
  const t = await getTranslations('hub')

  const urgencyLevel = computeUrgencyLevel(data)
  const urgentGameIds = data.mode === 'urgent' ? data.games.map((g) => g.id) : []

  return (
    <GamesActiveSection
      initialGames={data.games}
      initialGameGuesses={data.gameGuesses}
      initialTeamsMap={data.teamsMap}
      initialUrgencyLevel={urgencyLevel}
      initialUrgentGameIds={urgentGameIds}
      initialPredicted={data.predictedGames}
      totalGames={data.totalGames}
      tournamentMaxSilver={data.tournamentMaxSilver}
      tournamentMaxGolden={data.tournamentMaxGolden}
      tournamentId={tournamentId}
      gamesHref={gamesHref}
      cardTitle={t('newUser.tracks.matches.title')}
    />
  )
}
