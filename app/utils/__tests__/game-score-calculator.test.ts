import { describe, it, expect } from 'vitest'
import { calculateScoreForGame, checkGoalDifferenceMatch } from '../game-score-calculator'
import { testFactories } from '@/__tests__/db/test-factories'
import type { ExtendedGameData } from '@/app/definitions'

const DEFAULT_CONFIG = {
  game_exact_score_points: 3,
  game_correct_outcome_points: 1,
  game_correct_goal_difference_points: 2,
}

function makeGame(homeScore: number, awayScore: number, gameType: 'group' | 'final' = 'group', penaltyHome?: number, penaltyAway?: number): ExtendedGameData {
  return {
    ...testFactories.game({ game_type: gameType }),
    gameResult: testFactories.gameResult({
      home_score: homeScore,
      away_score: awayScore,
      home_penalty_score: penaltyHome,
      away_penalty_score: penaltyAway,
    }),
  }
}

describe('checkGoalDifferenceMatch', () => {
  it('returns null when goal differences do not match (2-1 vs 3-0)', () => {
    const guess = testFactories.gameGuess({ home_score: 2, away_score: 1 })
    const result = checkGoalDifferenceMatch(3, 0, guess, false, false, 2)
    expect(result).toBeNull()
  })

  it('returns goal_difference tier when home-win margins match (3-2 vs 2-1)', () => {
    const guess = testFactories.gameGuess({ home_score: 2, away_score: 1 })
    const result = checkGoalDifferenceMatch(3, 2, guess, false, false, 2)
    expect(result).toEqual({ score: 2, tier: 'goal_difference' })
  })

  it('returns goal_difference tier when both are draws with different scores (2-2 vs 0-0)', () => {
    const guess = testFactories.gameGuess({ home_score: 0, away_score: 0 })
    const result = checkGoalDifferenceMatch(2, 2, guess, false, false, 2)
    expect(result).toEqual({ score: 2, tier: 'goal_difference' })
  })

  it('returns score=0/tier=missed when margin matches but wrong penalty winner', () => {
    const guess = testFactories.gameGuess({ home_score: 1, away_score: 1, home_penalty_winner: false, away_penalty_winner: false })
    // homePenaltyWin=true means home team won penalties, user didn't predict it
    const result = checkGoalDifferenceMatch(1, 1, guess, true, false, 2)
    expect(result).toEqual({ score: 0, tier: 'missed' })
  })

  it('returns goal_difference tier when margins match and correct penalty winner', () => {
    const guess = testFactories.gameGuess({ home_score: 1, away_score: 1, home_penalty_winner: true, away_penalty_winner: false })
    const result = checkGoalDifferenceMatch(1, 1, guess, true, false, 2)
    expect(result).toEqual({ score: 2, tier: 'goal_difference' })
  })
})

describe('calculateScoreForGame', () => {
  it('returns { score: 0, tier: "missed" } for completely wrong prediction', () => {
    const game = makeGame(2, 0)
    const guess = testFactories.gameGuess({ home_score: 0, away_score: 2 })
    expect(calculateScoreForGame(game, guess, DEFAULT_CONFIG)).toEqual({ score: 0, tier: 'missed' })
  })

  it('returns { score: 3, tier: "exact" } for exact score match', () => {
    const game = makeGame(2, 1)
    const guess = testFactories.gameGuess({ home_score: 2, away_score: 1 })
    expect(calculateScoreForGame(game, guess, DEFAULT_CONFIG)).toEqual({ score: 3, tier: 'exact' })
  })

  it('returns { score: 2, tier: "goal_difference" } when margin matches but score differs (3-2 vs 2-1)', () => {
    const game = makeGame(3, 2)
    const guess = testFactories.gameGuess({ home_score: 2, away_score: 1 })
    expect(calculateScoreForGame(game, guess, DEFAULT_CONFIG)).toEqual({ score: 2, tier: 'goal_difference' })
  })

  it('returns { score: 1, tier: "correct" } for correct outcome only (no margin match)', () => {
    const game = makeGame(3, 1)
    const guess = testFactories.gameGuess({ home_score: 1, away_score: 0 })
    expect(calculateScoreForGame(game, guess, DEFAULT_CONFIG)).toEqual({ score: 1, tier: 'correct' })
  })

  it('goal_difference overrides correct when margin matches', () => {
    const game = makeGame(4, 2)
    const guess = testFactories.gameGuess({ home_score: 2, away_score: 0 })
    const result = calculateScoreForGame(game, guess, DEFAULT_CONFIG)
    expect(result.tier).toBe('goal_difference')
    expect(result.score).toBe(2)
  })

  it('returns { score: 0, tier: "missed" } when game has no result', () => {
    const game = { ...testFactories.game(), gameResult: null }
    const guess = testFactories.gameGuess({ home_score: 2, away_score: 1 })
    expect(calculateScoreForGame(game, guess, DEFAULT_CONFIG)).toEqual({ score: 0, tier: 'missed' })
  })

  it('playoff tie with wrong penalty winner returns { score: 0, tier: "missed" }', () => {
    const game = makeGame(1, 1, 'final', 5, 4)
    const guess = testFactories.gameGuess({ home_score: 1, away_score: 1, home_penalty_winner: false, away_penalty_winner: true })
    expect(calculateScoreForGame(game, guess, DEFAULT_CONFIG)).toEqual({ score: 0, tier: 'missed' })
  })

  it('playoff tie with correct penalty winner and matching margin returns goal_difference', () => {
    const game = makeGame(1, 1, 'final', 5, 4)
    const guess = testFactories.gameGuess({ home_score: 0, away_score: 0, home_penalty_winner: true, away_penalty_winner: false })
    const result = calculateScoreForGame(game, guess, DEFAULT_CONFIG)
    expect(result.tier).toBe('goal_difference')
  })

  it('uses DEFAULT_SCORING when no config provided', () => {
    const game = makeGame(2, 1)
    const guess = testFactories.gameGuess({ home_score: 2, away_score: 1 })
    // Default: exact=3
    expect(calculateScoreForGame(game, guess)).toEqual({ score: 3, tier: 'exact' })
  })
})
