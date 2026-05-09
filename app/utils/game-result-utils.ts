import type { GameResultNew } from '../db/tables-definition'

/**
 * Returns true when a game result is complete enough to be published.
 *
 * A result is publishable when:
 * - Both home_score and away_score are set (not null/undefined)
 * - For tied playoff games, both penalty scores are also set
 *
 * Draft saves are unrestricted — this check only applies when transitioning
 * is_draft from true → false.
 */
export function isGameResultPublishable(
  result: GameResultNew | null | undefined,
  isPlayoff: boolean
): boolean {
  if (!result) return false
  if (result.home_score === null || result.home_score === undefined) return false
  if (result.away_score === null || result.away_score === undefined) return false
  if (isPlayoff && result.home_score === result.away_score) {
    return (
      result.home_penalty_score !== null &&
      result.home_penalty_score !== undefined &&
      result.away_penalty_score !== null &&
      result.away_penalty_score !== undefined
    )
  }
  return true
}
