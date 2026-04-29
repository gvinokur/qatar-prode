import type { ActionCenterData } from '../actions/hub-actions'
import { calculateDeadline } from './countdown-utils'
import { areGroupStageGamesPredicted } from './stage-utils'

export type PriorityAttentionType =
  | 'urgent-games'
  | 'deadline'
  | 'new-actions-qt'
  | 'new-actions-awards'

export interface PriorityAttentionState {
  type: PriorityAttentionType
  /** urgent-games: count of unpredicted urgent games */
  urgentCount?: number
  /** urgent-games: id of first (most urgent) game for deep-link */
  firstUrgentGameId?: string
  completedCount: number
  totalCount: number
  /** deadline only: whether QT predictions are still incomplete */
  qtIncomplete?: boolean
  /** deadline only: number of QT predictions completed */
  qtCompleted?: number
  /** deadline only: total QT predictions available */
  qtTotal?: number
  /** deadline only: whether awards predictions are still incomplete */
  awardsIncomplete?: boolean
  /** deadline only: number of awards predictions completed */
  awardsCompleted?: number
  /** deadline only: total awards predictions available */
  awardsTotal?: number
}

const HOURS_48_MS = 48 * 60 * 60 * 1000
const HOURS_24_MS = 24 * 60 * 60 * 1000

function buildDeadlineState(data: ActionCenterData): PriorityAttentionState | null {
  if (!data.tournamentHasStarted || !data.qtAndAwardsOpen || data.msUntilPredictionLock >= HOURS_48_MS) return null
  const qtIncomplete = data.qualifiersCompleted < data.qualifiersTotal
  const awardsIncomplete = data.awardsCompleted < data.awardsTotal
  if (!qtIncomplete && !awardsIncomplete) return null
  return {
    type: 'deadline',
    completedCount: qtIncomplete ? data.qualifiersCompleted : data.awardsCompleted,
    totalCount: qtIncomplete ? data.qualifiersTotal : data.awardsTotal,
    qtIncomplete,
    qtCompleted: data.qualifiersCompleted,
    qtTotal: data.qualifiersTotal,
    awardsIncomplete,
    awardsCompleted: data.awardsCompleted,
    awardsTotal: data.awardsTotal,
  }
}

/**
 * Pure function — no I/O. Evaluates tournament phase and completion state to return the
 * highest-priority actionable item for the attention widget (Tiers 1–2).
 * Returns null when nothing actionable (Tier 3 engagement rotation takes over).
 *
 * Tier 1 — Urgent: unpredicted games with open deadlines, or QT/awards deadline < 48h
 * Tier 2 — New actions: stage transitions (pre-tournament only)
 * Tier 3 — Engagement rotation (handled by EngagementRotatorWidget)
 */
export function computePriorityAttention(data: ActionCenterData): PriorityAttentionState | null {
  if (data.tournamentFinished) return null

  if (data.mode === 'urgent') {
    const now = Date.now()
    const within24h = data.games.filter(
      (g) => calculateDeadline(g.game_date) - now <= HOURS_24_MS
    )
    if (within24h.length > 0) {
      return {
        type: 'urgent-games',
        urgentCount: within24h.length,
        firstUrgentGameId: within24h[0]?.id,
        completedCount: data.predictedGames,
        totalCount: data.totalGames,
      }
    }
    // No games within 24h — fall through to lower-priority states
  }

  const deadline = buildDeadlineState(data)
  if (deadline) return deadline

  if (!data.tournamentHasStarted && areGroupStageGamesPredicted(data) && data.qualifiersTotal > 0 && data.qualifiersCompleted === 0) {
    return { type: 'new-actions-qt', completedCount: data.groupStageGamesCompleted, totalCount: data.groupStageGamesTotal }
  }

  if (!data.tournamentHasStarted && data.qualifiersTotal > 0 && data.qualifiersCompleted === data.qualifiersTotal && data.awardsCompleted === 0 && data.awardsTotal > 0) {
    return { type: 'new-actions-awards', completedCount: data.qualifiersCompleted, totalCount: data.qualifiersTotal }
  }

  return null
}
