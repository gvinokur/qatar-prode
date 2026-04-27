import type { ActionCenterData } from '../actions/hub-actions'

export type PriorityAttentionType =
  | 'urgent-games'
  | 'qt-deadline'
  | 'awards-deadline'
  | 'transition-to-qt'
  | 'transition-to-awards'
  | 'fallback-games'
  | 'qt-nudge'
  | 'awards-nudge'

export interface PriorityAttentionState {
  type: PriorityAttentionType
  /** urgent-games: count of unpredicted urgent games */
  urgentCount?: number
  /** urgent-games: id of first (most urgent) game for deep-link */
  firstUrgentGameId?: string
  completedCount: number
  totalCount: number
}

const HOURS_48_MS = 48 * 60 * 60 * 1000

/**
 * Pure function — no I/O. Evaluates tournament phase and completion state to return the
 * highest-priority actionable item for the attention widget (Tiers 1–2).
 * Returns null when nothing actionable (Tier 3 engagement rotation takes over).
 */
export function computePriorityAttention(data: ActionCenterData): PriorityAttentionState | null {
  if (data.tournamentFinished) return null

  // Tier 1 — urgent-games (unpredicted games with open deadlines)
  if (data.mode === 'urgent') {
    return {
      type: 'urgent-games',
      urgentCount: data.games.length,
      firstUrgentGameId: data.games[0]?.id,
      completedCount: data.predictedGames,
      totalCount: data.totalGames,
    }
  }

  // Tier 1 — QT/awards deadline < 48h (only when tournament is active and lock is approaching)
  if (data.tournamentHasStarted && data.qtAndAwardsOpen && data.msUntilPredictionLock < HOURS_48_MS) {
    if (data.qualifiersCompleted < data.qualifiersTotal) {
      return {
        type: 'qt-deadline',
        completedCount: data.qualifiersCompleted,
        totalCount: data.qualifiersTotal,
      }
    }
    if (data.awardsCompleted < data.awardsTotal) {
      return {
        type: 'awards-deadline',
        completedCount: data.awardsCompleted,
        totalCount: data.awardsTotal,
      }
    }
  }

  // Tier 2 — stage transitions (all games predicted → pick qualifiers)
  if (
    data.totalGames > 0 &&
    data.predictedGames === data.totalGames &&
    data.qualifiersTotal > 0 &&
    data.qualifiersCompleted === 0
  ) {
    return {
      type: 'transition-to-qt',
      completedCount: data.predictedGames,
      totalCount: data.totalGames,
    }
  }

  // Tier 2 — stage transitions (qualifiers done → pick awards)
  if (data.qualifiersTotal > 0 && data.qualifiersCompleted === data.qualifiersTotal && data.awardsCompleted === 0) {
    return {
      type: 'transition-to-awards',
      completedCount: data.qualifiersCompleted,
      totalCount: data.qualifiersTotal,
    }
  }

  // Tier 2 — fallback games nudge (upcoming games exist but no urgency)
  if (data.mode === 'fallback' && data.predictedGames < data.totalGames) {
    return {
      type: 'fallback-games',
      completedCount: data.predictedGames,
      totalCount: data.totalGames,
    }
  }

  // Tier 2 — low-urgency QT/awards nudges (no deadline approaching)
  if (data.qtAndAwardsOpen) {
    if (data.qualifiersCompleted < data.qualifiersTotal) {
      return {
        type: 'qt-nudge',
        completedCount: data.qualifiersCompleted,
        totalCount: data.qualifiersTotal,
      }
    }
    if (data.awardsCompleted < data.awardsTotal) {
      return {
        type: 'awards-nudge',
        completedCount: data.awardsCompleted,
        totalCount: data.awardsTotal,
      }
    }
  }

  return null
}
