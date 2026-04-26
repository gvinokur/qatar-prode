import { describe, it, expect } from 'vitest'
import { DEFAULT_SCORING } from '../scoring-config'

describe('DEFAULT_SCORING', () => {
  it('game_exact_score_points equals 3 (bumped from 2 for tier separation)', () => {
    expect(DEFAULT_SCORING.game_exact_score_points).toBe(3)
  })

  it('game_correct_goal_difference_points equals 2 (new middle tier)', () => {
    expect(DEFAULT_SCORING.game_correct_goal_difference_points).toBe(2)
  })

  it('game_correct_outcome_points equals 1 (unchanged)', () => {
    expect(DEFAULT_SCORING.game_correct_outcome_points).toBe(1)
  })

  it('tier values are strictly ordered: outcome < goal_difference < exact', () => {
    expect(DEFAULT_SCORING.game_correct_outcome_points).toBeLessThan(DEFAULT_SCORING.game_correct_goal_difference_points)
    expect(DEFAULT_SCORING.game_correct_goal_difference_points).toBeLessThan(DEFAULT_SCORING.game_exact_score_points)
  })
})
