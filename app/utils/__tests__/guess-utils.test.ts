import { describe, it, expect } from 'vitest'
import { isGuessComplete, countCompleteGuesses } from '../guess-utils'
import { testFactories } from '@/__tests__/db/test-factories'
import type { GameGuessNew } from '@/app/db/tables-definition'

describe('isGuessComplete', () => {
  describe('undefined / missing guess', () => {
    it('returns false for undefined guess', () => {
      expect(isGuessComplete(undefined, false)).toBe(false)
    })
  })

  describe('regular (non-playoff) games', () => {
    it('returns true when both scores are set', () => {
      const guess = testFactories.gameGuess({ home_score: 2, away_score: 1 }) as GameGuessNew
      expect(isGuessComplete(guess, false)).toBe(true)
    })

    it('returns true for 0-0 (valid prediction)', () => {
      const guess = testFactories.gameGuess({ home_score: 0, away_score: 0 }) as GameGuessNew
      expect(isGuessComplete(guess, false)).toBe(true)
    })

    it('returns false when home_score is null', () => {
      const guess = testFactories.gameGuess({ home_score: null as any, away_score: 1 }) as GameGuessNew
      expect(isGuessComplete(guess, false)).toBe(false)
    })

    it('returns false when home_score is undefined', () => {
      const guess = testFactories.gameGuess({ home_score: undefined as any, away_score: 1 }) as GameGuessNew
      expect(isGuessComplete(guess, false)).toBe(false)
    })

    it('returns false when away_score is null', () => {
      const guess = testFactories.gameGuess({ home_score: 2, away_score: null as any }) as GameGuessNew
      expect(isGuessComplete(guess, false)).toBe(false)
    })

    it('returns false when away_score is undefined', () => {
      const guess = testFactories.gameGuess({ home_score: 2, away_score: undefined as any }) as GameGuessNew
      expect(isGuessComplete(guess, false)).toBe(false)
    })

    it('ignores penalty winner fields for non-playoff tied games', () => {
      const guess = testFactories.gameGuess({
        home_score: 1,
        away_score: 1,
        home_penalty_winner: false,
        away_penalty_winner: false,
      }) as GameGuessNew
      expect(isGuessComplete(guess, false)).toBe(true)
    })
  })

  describe('playoff games', () => {
    it('returns true for non-tied playoff result', () => {
      const guess = testFactories.gameGuess({ home_score: 2, away_score: 0 }) as GameGuessNew
      expect(isGuessComplete(guess, true)).toBe(true)
    })

    it('returns false for tied playoff without a penalty winner', () => {
      const guess = testFactories.gameGuess({
        home_score: 1,
        away_score: 1,
        home_penalty_winner: false,
        away_penalty_winner: false,
      }) as GameGuessNew
      expect(isGuessComplete(guess, true)).toBe(false)
    })

    it('returns true for tied playoff with home penalty winner', () => {
      const guess = testFactories.gameGuess({
        home_score: 1,
        away_score: 1,
        home_penalty_winner: true,
        away_penalty_winner: false,
      }) as GameGuessNew
      expect(isGuessComplete(guess, true)).toBe(true)
    })

    it('returns true for tied playoff with away penalty winner', () => {
      const guess = testFactories.gameGuess({
        home_score: 0,
        away_score: 0,
        home_penalty_winner: false,
        away_penalty_winner: true,
      }) as GameGuessNew
      expect(isGuessComplete(guess, true)).toBe(true)
    })
  })
})

describe('countCompleteGuesses', () => {
  const game1 = testFactories.game({ id: 'g-1' }) as any
  const game2 = testFactories.game({ id: 'g-2' }) as any
  const game3 = testFactories.game({
    id: 'g-3',
    game_type: 'playoff',
    playoffStage: { tournament_playoff_round_id: 'r-1', round_name: 'QF', is_final: false, is_third_place: false },
  } as any) as any

  it('returns 0 for empty guess map', () => {
    expect(countCompleteGuesses({}, [game1, game2])).toBe(0)
  })

  it('counts only games with complete guesses', () => {
    const guessMap = {
      'g-1': testFactories.gameGuess({ game_id: 'g-1', home_score: 1, away_score: 0 }) as GameGuessNew,
      // g-2 has no guess
    }
    expect(countCompleteGuesses(guessMap, [game1, game2])).toBe(1)
  })

  it('does not count games whose guesses have missing scores', () => {
    const guessMap = {
      'g-1': testFactories.gameGuess({ game_id: 'g-1', home_score: 2, away_score: undefined as any }) as GameGuessNew,
    }
    expect(countCompleteGuesses(guessMap, [game1])).toBe(0)
  })

  it('does not count tied playoff without penalty winner', () => {
    const guessMap = {
      'g-3': testFactories.gameGuess({
        game_id: 'g-3',
        home_score: 1,
        away_score: 1,
        home_penalty_winner: false,
        away_penalty_winner: false,
      }) as GameGuessNew,
    }
    expect(countCompleteGuesses(guessMap, [game3])).toBe(0)
  })

  it('counts tied playoff with penalty winner', () => {
    const guessMap = {
      'g-3': testFactories.gameGuess({
        game_id: 'g-3',
        home_score: 1,
        away_score: 1,
        home_penalty_winner: true,
        away_penalty_winner: false,
      }) as GameGuessNew,
    }
    expect(countCompleteGuesses(guessMap, [game3])).toBe(1)
  })
})
