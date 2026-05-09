import { describe, it, expect } from 'vitest'
import { isGameResultPublishable } from '../game-result-utils'
import type { GameResultNew } from '../../db/tables-definition'

const base: GameResultNew = {
  game_id: 'game-1',
  home_score: 2,
  away_score: 1,
  is_draft: false,
}

describe('isGameResultPublishable', () => {
  it('returns false when result is null', () => {
    expect(isGameResultPublishable(null, false)).toBe(false)
  })

  it('returns false when result is undefined', () => {
    expect(isGameResultPublishable(undefined, false)).toBe(false)
  })

  it('returns false when home_score is missing', () => {
    expect(isGameResultPublishable({ ...base, home_score: undefined }, false)).toBe(false)
  })

  it('returns false when away_score is missing', () => {
    expect(isGameResultPublishable({ ...base, away_score: undefined }, false)).toBe(false)
  })

  it('returns true for a group game with both scores set', () => {
    expect(isGameResultPublishable(base, false)).toBe(true)
  })

  it('returns true for a playoff game where one team wins (scores differ)', () => {
    expect(isGameResultPublishable({ ...base, home_score: 2, away_score: 1 }, true)).toBe(true)
  })

  it('returns false for a tied playoff game without penalty scores', () => {
    const tied: GameResultNew = {
      ...base,
      home_score: 1,
      away_score: 1,
    }
    expect(isGameResultPublishable(tied, true)).toBe(false)
  })

  it('returns false for a tied playoff game with only one penalty score', () => {
    const tied: GameResultNew = {
      ...base,
      home_score: 1,
      away_score: 1,
      home_penalty_score: 4,
    }
    expect(isGameResultPublishable(tied, true)).toBe(false)
  })

  it('returns true for a tied playoff game with both penalty scores set', () => {
    const tied: GameResultNew = {
      ...base,
      home_score: 1,
      away_score: 1,
      home_penalty_score: 4,
      away_penalty_score: 3,
    }
    expect(isGameResultPublishable(tied, true)).toBe(true)
  })

  it('does not require penalty scores for a tied group stage game', () => {
    const tied: GameResultNew = { ...base, home_score: 0, away_score: 0 }
    expect(isGameResultPublishable(tied, false)).toBe(true)
  })
})
