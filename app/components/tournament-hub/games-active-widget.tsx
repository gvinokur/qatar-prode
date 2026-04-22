import { getTranslations } from 'next-intl/server'
import { SportsSoccer as SportsSoccerIcon } from '@mui/icons-material'
import { DashboardCard } from './dashboard-card'
import { GamesActiveClient } from './games-active-client'
import { GuessesContextProvider } from '../context-providers/guesses-context-provider'
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
  const unpredictedCount = data.mode === 'urgent' ? data.totalGames - data.predictedGames : 0

  return (
    <DashboardCard
      title={t('newUser.tracks.matches.title')}
      icon={<SportsSoccerIcon />}
      count={`${data.predictedGames}/${data.totalGames}`}
      urgent={data.mode === 'urgent'}
    >
      <GuessesContextProvider
        gameGuesses={data.gameGuesses}
        autoSave={true}
        tournamentMaxSilver={data.tournamentMaxSilver}
        tournamentMaxGolden={data.tournamentMaxGolden}
      >
        <GamesActiveClient
          games={data.games}
          teamsMap={data.teamsMap}
          tournamentId={tournamentId}
          gamesHref={gamesHref}
          mode={data.mode}
          urgencyLevel={urgencyLevel}
          unpredictedCount={unpredictedCount}
        />
      </GuessesContextProvider>
    </DashboardCard>
  )
}
