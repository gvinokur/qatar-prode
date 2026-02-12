import { ExtendedGameData } from '../definitions'

/**
 * Formats penalty shootout result for display.
 * Returns formatted penalty score like "(4-3p)" or null if no penalties.
 *
 * @param game - Extended game data with gameResult
 * @returns Formatted penalty string or null
 *
 * @example
 * formatPenaltyResult(game) // Returns "(4-3p)" or null
 */
export function formatPenaltyResult(game: ExtendedGameData): string | null {
  const homePenaltyScore = game.gameResult?.home_penalty_score
  const awayPenaltyScore = game.gameResult?.away_penalty_score

  // Check if both penalty scores exist and are valid numbers
  if (
    typeof homePenaltyScore === 'number' &&
    typeof awayPenaltyScore === 'number' &&
    Number.isInteger(homePenaltyScore) &&
    Number.isInteger(awayPenaltyScore)
  ) {
    return `(${homePenaltyScore}-${awayPenaltyScore}p)`
  }

  return null
}

/**
 * Formats full game score including regular time and penalty shootout if applicable.
 * Returns combined score like "2 - 2 (4-3p)" or just "2 - 2" if no penalties.
 *
 * @param game - Extended game data with gameResult
 * @returns Formatted game score string
 *
 * @example
 * formatGameScore(game) // Returns "2 - 2 (4-3p)" or "2 - 2"
 */
export function formatGameScore(game: ExtendedGameData): string {
  const homeScore = game.gameResult?.home_score
  const awayScore = game.gameResult?.away_score

  // Build regular score
  const regularScore = `${homeScore ?? '-'} - ${awayScore ?? '-'}`

  // Add penalty result if applicable
  const penaltyResult = formatPenaltyResult(game)
  return penaltyResult ? `${regularScore} ${penaltyResult}` : regularScore
}
