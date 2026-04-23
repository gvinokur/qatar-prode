import { getTranslations } from 'next-intl/server'
import { GamesActiveSection } from './games-active-section'
import { computeUrgencyLevel } from '../../utils/urgency-utils'
import type { ActionCenterData } from '../../actions/hub-actions'

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
      initialSilverUsed={data.silverBoostsUsed}
      initialGoldenUsed={data.goldenBoostsUsed}
      tournamentId={tournamentId}
      gamesHref={gamesHref}
      cardTitle={t('gamesWidget.cardTitle')}
    />
  )
}
