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

  it('returns 0 for goal_difference and exact when userGameStats is null', () => {
    const stats = calculateAccuracyStats(null, 0, 64, 30)
    expect(stats.overallGoalDifference).toBe(0)
    expect(stats.overallExact).toBe(0)
    expect(stats.groupGoalDifference).toBe(0)
    expect(stats.playoffGoalDifference).toBe(0)
  })

  it('goal_difference is cumulative: total_exact_guesses (goal_diff + exact combined)', () => {
    const stats = calculateAccuracyStats(baseStats, 20, 64, 30)
    // total_exact_guesses=5 (goal_diff 3 + exact 2), so cumulative goal_difference = 5
    // 5/30 = 16.7%
    expect(stats.overallGoalDifference).toBe(5)
    expect(stats.overallGoalDifferencePercentage).toBe(16.7)
  })

  it('exact is exclusive: total_exact_guesses - total_goal_difference_guesses', () => {
    const stats = calculateAccuracyStats(baseStats, 20, 64, 30)
    // 5 - 3 = 2 pure exact predictions
    expect(stats.overallExact).toBe(2)
  })

  it('correctly computes group and playoff goal_difference as cumulative', () => {
    const stats = calculateAccuracyStats(baseStats, 20, 64, 30)
    // group: exact_or_better=3, playoff: exact_or_better=2
    expect(stats.groupGoalDifference).toBe(3)
    expect(stats.playoffGoalDifference).toBe(2)
    // group exact: 3 - 2 = 1, playoff exact: 2 - 1 = 1
    expect(stats.groupExact).toBe(1)
    expect(stats.playoffExact).toBe(1)
  })

  it('correct field is unaffected by goal_difference change', () => {
    const stats = calculateAccuracyStats(baseStats, 20, 64, 30)
    expect(stats.overallCorrect).toBe(10)
    expect(stats.groupCorrect).toBe(6)
  })
})
