import { describe, it, expect } from 'vitest'
import { calculatePredictionResult } from '../compact-game-view-card'

describe('calculatePredictionResult — goal_difference', () => {
  it('returns "goal_difference" when margin matches but score differs (3-2 vs 2-1)', () => {
    expect(calculatePredictionResult(2, 1, 3, 2)).toBe('goal_difference')
  })

  it('returns "goal_difference" for both-draw with different scores (2-2 vs 0-0)', () => {
    expect(calculatePredictionResult(0, 0, 2, 2)).toBe('goal_difference')
  })

  it('returns "goal_difference" for away-win same margin (0-2 vs 1-3)', () => {
    expect(calculatePredictionResult(0, 2, 1, 3)).toBe('goal_difference')
  })

  it('returns "correct" when same winner direction but margin differs', () => {
    expect(calculatePredictionResult(1, 0, 3, 0)).toBe('correct')
  })

  it('returns "exact" for exact match (takes priority over goal_difference)', () => {
    expect(calculatePredictionResult(2, 1, 2, 1)).toBe('exact')
  })

  it('returns "incorrect" for different winner direction', () => {
    expect(calculatePredictionResult(2, 1, 1, 2)).toBe('incorrect')
  })

  describe('playoff penalty edge cases', () => {
    const penaltyOpts = {
      actualHomePenaltyScore: 5,
      actualAwayPenaltyScore: 4,
    }

    it('returns "goal_difference" when margin=0 matches (different draw scores) and penalty winner correct', () => {
      // predicted 0-0, actual 1-1 — both draws, same margin, penalty winner correct
      expect(
        calculatePredictionResult(0, 0, 1, 1, {
          ...penaltyOpts,
          predictedHomePenaltyWinner: true,
          predictedAwayPenaltyWinner: false,
        })
      ).toBe('goal_difference')
    })

    it('returns "incorrect" when margin=0 but wrong penalty winner', () => {
      expect(
        calculatePredictionResult(1, 1, 1, 1, {
          ...penaltyOpts,
          predictedHomePenaltyWinner: false,
          predictedAwayPenaltyWinner: true,
        })
      ).toBe('incorrect')
    })

    it('returns "incorrect" when margin=0 but no penalty winner predicted', () => {
      expect(
        calculatePredictionResult(1, 1, 1, 1, {
          ...penaltyOpts,
          predictedHomePenaltyWinner: undefined,
          predictedAwayPenaltyWinner: undefined,
        })
      ).toBe('incorrect')
    })
  })
})
