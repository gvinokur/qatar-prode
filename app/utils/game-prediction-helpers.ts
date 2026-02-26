/**
 * Helper functions for game prediction validation
 */

/**
 * Checks if a game prediction is complete
 *
 * For group games: Both scores must be filled
 * For playoff games: Both scores must be filled, AND if tied, a penalty winner must be selected
 *
 * @param gameType - The type of game ('group', 'playoff', 'first_round', etc.)
 * @param homeScore - Home team score (can be null, undefined, or number)
 * @param awayScore - Away team score (can be null, undefined, or number)
 * @param homePenaltyWinner - Whether home team won on penalties (can be null, undefined, or boolean)
 * @param awayPenaltyWinner - Whether away team won on penalties (can be null, undefined, or boolean)
 * @returns true if the prediction is complete, false otherwise
 */
export function isGamePredictionComplete(
  gameType: string | undefined | null,
  homeScore: number | null | undefined,
  awayScore: number | null | undefined,
  homePenaltyWinner?: boolean | null | undefined,
  awayPenaltyWinner?: boolean | null | undefined
): boolean {
  // Both scores must be filled (check for both null and undefined)
  if (homeScore == null || awayScore == null) {
    return false;
  }

  // For group games, having both scores is sufficient
  if (gameType === 'group') {
    return true;
  }

  // For playoff games, check if there's a tie
  const isTied = homeScore === awayScore;

  // If not tied, having both scores is sufficient
  if (!isTied) {
    return true;
  }

  // If tied, a penalty winner must be selected
  // At least one of them should be explicitly true
  return homePenaltyWinner === true || awayPenaltyWinner === true;
}
