import { GamesInfoWidget } from './games-info-widget'
import { GamesActiveWidget } from './games-active-widget'
import type { ActionCenterData } from '../../actions/hub-actions'
import type { ScoringRulesBySection } from '../../utils/scoring-rules-utils'

interface GamesPredictionWidgetProps {
  readonly tournamentId: string
  readonly scoringRules: ScoringRulesBySection
  readonly totalGames: number
  readonly isNearStart: boolean
  readonly isFinished: boolean
  readonly actionCenterData: ActionCenterData | null
  readonly gamesHref: string
}

export function GamesPredictionWidget({
  tournamentId,
  scoringRules,
  totalGames,
  isNearStart,
  isFinished,
  actionCenterData,
  gamesHref,
}: GamesPredictionWidgetProps) {
  if (isFinished) return null

  if (!actionCenterData) {
    return (
      <GamesInfoWidget
        isLoggedOff={true}
        scoringRules={scoringRules}
        gamesHref={gamesHref}
        predictedGames={0}
        totalGames={totalGames}
      />
    )
  }

  if (!isNearStart) {
    return (
      <GamesInfoWidget
        isLoggedOff={false}
        scoringRules={scoringRules}
        gamesHref={gamesHref}
        predictedGames={actionCenterData.predictedGames}
        totalGames={totalGames}
      />
    )
  }

  return (
    <GamesActiveWidget
      data={actionCenterData}
      tournamentId={tournamentId}
      gamesHref={gamesHref}
    />
  )
}
