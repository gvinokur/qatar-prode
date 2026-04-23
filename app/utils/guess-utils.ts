import type { GameGuessNew } from '../db/tables-definition'
import type { ExtendedGameData } from '../definitions'

/**
 * Returns true when a game guess is fully complete.
 *
 * A guess is complete when:
 * - Both home_score and away_score are set (not null/undefined)
 * - For tied playoff games, one of the penalty winner flags is also set
 *
 * Mirrors the server-side logic in getTournamentPredictionCompletion and the
 * urgency filter in getActionCenterGames — all three must remain in sync.
 */
export function isGuessComplete(guess: GameGuessNew | undefined, isPlayoff: boolean): boolean {
  if (!guess) return false
  if (guess.home_score === null || guess.home_score === undefined) return false
  if (guess.away_score === null || guess.away_score === undefined) return false
  if (isPlayoff && guess.home_score === guess.away_score) {
    return !!(guess.home_penalty_winner || guess.away_penalty_winner)
  }
  return true
}

/**
 * Counts the number of games in a set that have a complete guess.
 */
export function countCompleteGuesses(
  guessMap: Record<string, GameGuessNew>,
  games: ExtendedGameData[]
): number {
  return games.filter((g) => isGuessComplete(guessMap[g.id], !!g.playoffStage)).length
}
