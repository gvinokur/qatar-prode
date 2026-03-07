import { describe, it, expect } from 'vitest'
import {
  calculatePercentage,
  calculateAccuracyStats,
  calculateBoostStats,
} from '../../app/utils/stats-calculations'

describe('calculatePercentage', () => {
  it('returns 0 when denominator is 0', () => {
    expect(calculatePercentage(10, 0)).toBe(0)
  })

  it('calculates percentage with 1 decimal place by default', () => {
    expect(calculatePercentage(1, 3)).toBe(33.3)
  })

  it('calculates percentage with 0 decimal places', () => {
    expect(calculatePercentage(1, 4, 0)).toBe(25)
  })

  it('calculates 100%', () => {
    expect(calculatePercentage(5, 5)).toBe(100)
  })

  it('handles zero numerator', () => {
    expect(calculatePercentage(0, 10)).toBe(0)
  })
})

describe('calculateAccuracyStats', () => {
  const baseGameStats = {
    total_correct_guesses: 20,
    total_exact_guesses: 8,
    group_correct_guesses: 15,
    group_exact_guesses: 6,
    playoff_correct_guesses: 5,
    playoff_exact_guesses: 2,
  }

  it('calculates stats correctly with full data', () => {
    const result = calculateAccuracyStats(baseGameStats, 30, 64, 40)

    expect(result.totalPredictionsMade).toBe(30)
    expect(result.totalGamesAvailable).toBe(64)
    expect(result.totalGamesPlayed).toBe(40)
    expect(result.overallCorrect).toBe(20)
    expect(result.overallExact).toBe(8)
    expect(result.overallMissed).toBe(20) // 40 - 20
    expect(result.completionPercentage).toBe(46.9) // 30/64
    expect(result.overallCorrectPercentage).toBe(50) // 20/40
    expect(result.overallExactPercentage).toBe(20) // 8/40
    expect(result.groupCorrect).toBe(15)
    expect(result.groupCorrectPercentage).toBe(37.5) // 15/40
    expect(result.playoffCorrect).toBe(5)
    expect(result.playoffCorrectPercentage).toBe(12.5) // 5/40
  })

  it('handles null game stats with zeros', () => {
    const result = calculateAccuracyStats(null, 0, 64, 40)

    expect(result.overallCorrect).toBe(0)
    expect(result.overallExact).toBe(0)
    expect(result.overallCorrectPercentage).toBe(0)
    expect(result.groupCorrect).toBe(0)
    expect(result.playoffCorrect).toBe(0)
  })

  it('handles zero games played (no division by zero)', () => {
    const result = calculateAccuracyStats(baseGameStats, 0, 64, 0)

    expect(result.overallCorrectPercentage).toBe(0)
    expect(result.overallExactPercentage).toBe(0)
    expect(result.groupCorrectPercentage).toBe(0)
    expect(result.playoffCorrectPercentage).toBe(0)
    expect(result.overallMissed).toBe(-20) // 0 - 20 (correct behavior; no games played)
  })

  it('handles zero games available (completion percentage is 0)', () => {
    const result = calculateAccuracyStats(baseGameStats, 10, 0, 20)
    expect(result.completionPercentage).toBe(0)
  })
})

describe('calculateBoostStats', () => {
  const baseBoostData = {
    totalBoosts: 5,
    lockedBoosts: 4,
    activeBoosts: 1,
    scoredGamesCount: 3,
    totalPointsEarned: 12,
    byGroup: [{ groupLetter: 'A', count: 2 }, { groupLetter: 'B', count: 2 }],
    playoffCount: 0,
  }

  it('calculates boost stats correctly', () => {
    const result = calculateBoostStats(baseBoostData, 10, 'silver')

    expect(result.boostType).toBe('silver')
    expect(result.available).toBe(10)
    expect(result.totalBoosts).toBe(5)
    expect(result.lockedBoosts).toBe(4)
    expect(result.activeBoosts).toBe(1)
    expect(result.used).toBe(5) // same as totalBoosts
    expect(result.usedPercentage).toBe(40) // 4/10
    expect(result.scoredGames).toBe(3)
    expect(result.successRate).toBe(75) // 3/4
    expect(result.pointsEarned).toBe(12)
    expect(result.roi).toBe(3) // 12/4
    expect(result.allocationByGroup).toHaveLength(2)
    expect(result.allocationPlayoffs).toBe(0)
  })

  it('handles null maxGames (available = 0)', () => {
    const result = calculateBoostStats(baseBoostData, null, 'golden')

    expect(result.available).toBe(0)
    expect(result.usedPercentage).toBe(0)
    expect(result.boostType).toBe('golden')
  })

  it('handles zero locked boosts (roi = 0, no division by zero)', () => {
    const data = { ...baseBoostData, lockedBoosts: 0, totalPointsEarned: 0, scoredGamesCount: 0 }
    const result = calculateBoostStats(data, 10, 'silver')

    expect(result.roi).toBe(0)
    expect(result.successRate).toBe(0)
  })
})
