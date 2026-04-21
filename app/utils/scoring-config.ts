/**
 * Shared scoring configuration types and defaults.
 * Kept in a neutral (non-client, non-server) utility so it can be imported
 * from both Server Components/Actions and Client Components.
 */

export interface ScoringConfig {
  game_exact_score_points: number
  game_correct_outcome_points: number
  champion_points: number
  runner_up_points: number
  third_place_points: number
  individual_award_points: number
  qualified_team_points: number
  exact_position_qualified_points: number
  max_silver_games: number
  max_golden_games: number
}

export const DEFAULT_SCORING: ScoringConfig = {
  game_exact_score_points: 2,
  game_correct_outcome_points: 1,
  champion_points: 5,
  runner_up_points: 3,
  third_place_points: 1,
  individual_award_points: 3,
  qualified_team_points: 1,
  exact_position_qualified_points: 2,
  max_silver_games: 0,
  max_golden_games: 0,
}
