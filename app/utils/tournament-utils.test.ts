import { describe, it, expect } from 'vitest'
import { extractScoringConfig } from './tournament-utils'

describe('extractScoringConfig', () => {
  it('returns undefined when tournament is null', () => {
    expect(extractScoringConfig(null)).toBeUndefined()
  })

  it('returns undefined when tournament is undefined', () => {
    expect(extractScoringConfig(undefined)).toBeUndefined()
  })

  it('returns config with fallback defaults when tournament fields are null', () => {
    const tournament = {
      game_exact_score_points: null,
      game_correct_goal_difference_points: null,
      game_correct_outcome_points: null,
      champion_points: null,
      runner_up_points: null,
      third_place_points: null,
      individual_award_points: null,
      qualified_team_points: null,
      exact_position_qualified_points: null,
      max_silver_games: null,
      max_golden_games: null,
    }

    const config = extractScoringConfig(tournament)

    expect(config).toEqual({
      game_exact_score_points: 3,
      game_correct_goal_difference_points: 2,
      game_correct_outcome_points: 1,
      champion_points: 5,
      runner_up_points: 3,
      third_place_points: 1,
      individual_award_points: 3,
      qualified_team_points: 1,
      exact_position_qualified_points: 2,
      max_silver_games: 0,
      max_golden_games: 0,
    })
  })

  it('returns correct values when tournament has all scoring fields', () => {
    const tournament = {
      game_exact_score_points: 4,
      game_correct_goal_difference_points: 3,
      game_correct_outcome_points: 2,
      champion_points: 10,
      runner_up_points: 6,
      third_place_points: 3,
      individual_award_points: 5,
      qualified_team_points: 2,
      exact_position_qualified_points: 4,
      max_silver_games: 2,
      max_golden_games: 1,
    }

    const config = extractScoringConfig(tournament)

    expect(config).toEqual({
      game_exact_score_points: 4,
      game_correct_goal_difference_points: 3,
      game_correct_outcome_points: 2,
      champion_points: 10,
      runner_up_points: 6,
      third_place_points: 3,
      individual_award_points: 5,
      qualified_team_points: 2,
      exact_position_qualified_points: 4,
      max_silver_games: 2,
      max_golden_games: 1,
    })
  })

  it('uses provided value (0) instead of default when field is explicitly 0', () => {
    const tournament = { champion_points: 0, runner_up_points: null }
    const config = extractScoringConfig(tournament)

    // 0 is falsy but ?? only triggers on null/undefined, so 0 should be preserved
    expect(config?.champion_points).toBe(0)
    // null uses default
    expect(config?.runner_up_points).toBe(3)
  })
})
