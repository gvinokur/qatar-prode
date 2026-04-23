import { calculateDeadline } from './countdown-utils'

export type UrgencyLevel = 'critical' | 'high' | 'medium' | 'safe' | 'empty'

const ONE_HOUR_MS = 60 * 60 * 1000
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000
const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000

/**
 * Derives the urgency level for the active games carousel from carousel data.
 * 'critical'  — nearest deadline < 2 hours
 * 'high'      — nearest deadline < 24 hours
 * 'medium'    — nearest deadline ≤ 48 hours
 * 'safe'      — all games predicted (fallback mode) or deadline > 48h
 * 'empty'     — no games in the window
 */
export function computeUrgencyLevel(data: {
  mode: string
  games: Array<{ game_date: Date }>
}): UrgencyLevel {
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
