import { describe, it, expect } from 'vitest'
import { calculateAccuracyStats } from '../stats-calculations'

describe('calculateAccuracyStats — goal_difference fields', () => {
  const baseStats = {
    total_correct_guesses: 10,
    total_exact_guesses: 5,
    total_goal_difference_guesses: 3,
    group_correct_guesses: 6,
    group_exact_guesses: 3,
    group_goal_difference_guesses: 2,
    playoff_correct_guesses: 4,
    playoff_exact_guesses: 2,
    playoff_goal_difference_guesses: 1,
  }

  it('returns 0 for goal_difference counts when fields are absent (backward compat)', () => {
    const stats = calculateAccuracyStats(
      { total_correct_guesses: 10, total_exact_guesses: 5 } as any,
      20, 64, 30
    )
    expect(stats.overallGoalDifference).toBe(0)
    expect(stats.overallGoalDifferencePercentage).toBe(0)
    expect(stats.groupGoalDifference).toBe(0)
    expect(stats.playoffGoalDifference).toBe(0)
  })

  it('returns 0 for all fields when userGameStats is null', () => {
    const stats = calculateAccuracyStats(null, 0, 64, 30)
    expect(stats.overallGoalDifference).toBe(0)
    expect(stats.groupGoalDifference).toBe(0)
    expect(stats.playoffGoalDifference).toBe(0)
  })

  it('correctly computes overallGoalDifferencePercentage', () => {
    const stats = calculateAccuracyStats(baseStats, 20, 64, 30)
    // 3/30 = 10.0%
    expect(stats.overallGoalDifference).toBe(3)
    expect(stats.overallGoalDifferencePercentage).toBe(10.0)
  })

  it('correctly computes group and playoff goal_difference counts', () => {
    const stats = calculateAccuracyStats(baseStats, 20, 64, 30)
    expect(stats.groupGoalDifference).toBe(2)
    expect(stats.playoffGoalDifference).toBe(1)
  })

  it('does not affect existing exact and correct fields', () => {
    const stats = calculateAccuracyStats(baseStats, 20, 64, 30)
    expect(stats.overallCorrect).toBe(10)
    expect(stats.overallExact).toBe(5)
    expect(stats.groupCorrect).toBe(6)
    expect(stats.groupExact).toBe(3)
  })
})
