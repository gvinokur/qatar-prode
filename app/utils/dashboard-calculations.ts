/**
 * Dashboard calculation utilities
 *
 * Pure functions for calculating prediction completion counts.
 * Used by CompactPredictionDashboard for dynamic metric calculation.
 */

import { GameGuessNew, TournamentGuessNew } from '../db/tables-definition';
import { ExtendedGameData } from '../definitions';
import { QualifiedTeamPrediction } from '../db/tables-definition';

/**
 * Calculate number of completed game predictions
 *
 * A game prediction is considered complete when:
 * - Non-playoff game: Both scores are provided (home_score and away_score not null)
 * - Playoff game with decisive score: Both scores provided and scores differ
 * - Playoff game with tie: Both scores provided AND penalty winner selected
 *
 * This enhances the simple validation (which only checks for non-null scores)
 * by adding playoff tie validation to ensure users select a penalty winner
 * for tied playoff games.
 *
 * @param games - Array of games to check
 * @param gameGuesses - Record of game guesses by game ID
 * @returns Number of complete predictions
 */
export function calculateGamePredictions(
  games: ExtendedGameData[],
  gameGuesses: Record<string, GameGuessNew>
): number {
  return games.filter(game => {
    const guess = gameGuesses[game.id];
    if (!guess) return false;

    // Must have both scores
    if (guess.home_score == null || guess.away_score == null) return false;

    const isPlayoff = !!game.playoffStage;
    const isTie = guess.home_score === guess.away_score;

    // Non-playoff: just need scores
    if (!isPlayoff) return true;

    // Playoff with decisive score: complete
    if (!isTie) return true;

    // Playoff tie: need penalty winner (enhancement over simple validation)
    // Only one should be true, but if both are true (invalid state),
    // the UI validation prevents this, so we count it as complete
    return guess.home_penalty_winner || guess.away_penalty_winner;
  }).length;
}

/**
 * Calculate number of qualified team predictions
 *
 * Counts teams where predicted_to_qualify is true.
 * Note: A team can have a position (e.g., 5th) but not qualify,
 * so we check the predicted_to_qualify flag, not just position.
 *
 * @param predictions - Map of qualified team predictions
 * @returns Number of teams predicted to qualify
 */
export function calculateQualifiedTeamsPredictions(
  predictions: Map<string, QualifiedTeamPrediction>
): number {
  return Array.from(predictions.values()).filter(
    p => p.predicted_to_qualify === true
  ).length;
}

/**
 * Calculate number of completed final standings predictions
 *
 * Final standings include:
 * - Champion (1st place)
 * - Runner-up (2nd place)
 * - Third place (3rd place)
 *
 * @param tournamentGuesses - Tournament guesses object or null
 * @returns Number of completed final standings (0-3)
 */
export function calculateFinalStandings(
  tournamentGuesses: TournamentGuessNew | null
): number {
  if (!tournamentGuesses) return 0;

  const fields = [
    'champion_team_id',
    'runner_up_team_id',
    'third_place_team_id'
  ] as const;

  return fields.filter(field => tournamentGuesses[field] != null).length;
}

/**
 * Calculate number of completed individual award predictions
 *
 * Individual awards include:
 * - Top Goalscorer
 * - Best Player
 * - Best Goalkeeper
 * - Best Young Player
 *
 * @param tournamentGuesses - Tournament guesses object or null
 * @returns Number of completed awards (0-4)
 */
export function calculateAwards(
  tournamentGuesses: TournamentGuessNew | null
): number {
  if (!tournamentGuesses) return 0;

  const fields = [
    'top_goalscorer_player_id',
    'best_player_id',
    'best_goalkeeper_player_id',
    'best_young_player_id'
  ] as const;

  return fields.filter(field => tournamentGuesses[field] != null).length;
}
