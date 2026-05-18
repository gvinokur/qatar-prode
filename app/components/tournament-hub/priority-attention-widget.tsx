import { getTranslations } from 'next-intl/server'
import { computePriorityAttention } from '../../utils/priority-attention'
import type { ActionCenterData } from '../../actions/hub-actions'
import { PredictionStatusHeader } from '../prediction-status-header'
import { computeHubPriorityVariant } from '../prediction-status-header/hub-header-variant'
import { EngagementRotatorWidget } from './engagement-rotator-widget'

interface PriorityAttentionWidgetProps {
  readonly data: ActionCenterData
  readonly gamesHref: string
  readonly qtHref: string
  readonly awardsHref: string
}

export async function PriorityAttentionWidget({
  data,
  gamesHref,
  qtHref,
  awardsHref,
}: PriorityAttentionWidgetProps) {
  const state = computePriorityAttention(data)

  if (!state) {
    return (
      <EngagementRotatorWidget
        tournamentStarted={data.tournamentHasStarted}
        gamesHref={gamesHref}
        predictedGames={data.predictedGames}
      />
    )
  }

  const t = await getTranslations('hub')
  const variant = computeHubPriorityVariant(state, t, gamesHref, qtHref, awardsHref)

  return <PredictionStatusHeader variant={variant} />
}
