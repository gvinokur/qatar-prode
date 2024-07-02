import '@testing-library/jest-dom'

import { calculateScoreForGame } from '../../app/utils/game-score-calculator';

describe('calculateScoreForGame', () => {
  it('should return 0 when required input data is missing or invalid', () => {
    expect(calculateScoreForGame({} as any, {} as any)).toBe(0);
    expect(calculateScoreForGame({ gameResult: {} } as any, {} as any)).toBe(0);
    expect(calculateScoreForGame({ gameResult: { home_score: 1 } } as any, {} as any)).toBe(0);
    expect(calculateScoreForGame({ gameResult: { away_score: 1 } } as any, {} as any)).toBe(0);
    expect(calculateScoreForGame({ gameResult: { home_score: 1, away_score: 1 } } as any, {} as any)).toBe(0);
  });

  it('should return 2 when game scores and guesses match exactly', () => {
    const game = { gameResult: { home_score: 2, away_score: 1 } } as any;
    const gameGuess = { home_score: 2, away_score: 1 } as any;
    expect(calculateScoreForGame(game, gameGuess)).toBe(2);
  });

  it('should return 1 when game result and guess have the same winner', () => {
    const game = { gameResult: { home_score: 2, away_score: 1 } } as any;
    const gameGuess = { home_score: 3, away_score: 2 } as any;
    expect(calculateScoreForGame(game, gameGuess)).toBe(1);
  });

  it('should return 0 when game result and guess have different winners', () => {
    const game = { gameResult: { home_score: 2, away_score: 1 } } as any;
    const gameGuess = { home_score: 1, away_score: 2 } as any;
    expect(calculateScoreForGame(game, gameGuess)).toBe(0);
  });

  it('should handle playoff games with tied scores and penalty winners', () => {
    const game = { gameResult: { home_score: 1, away_score: 1, home_penalty_score: 2, away_penalty_score: 1 }, game_type: 'playoffs'} as any;
    const gameGuessExact = { home_score: 1, away_score: 1, home_penalty_winner: true } as any;
    const gameGuessCorrect = { home_score: 2, away_score: 1 } as any;
    const gameGuessCorrect2 = { home_score: 2, away_score: 2, home_penalty_winner: true } as any;
    const gameGuessIncorrect = { home_score: 1, away_score: 1, away_penalty_winner: true } as any;
    const gameGuessIncorrect2 = { home_score: 1, away_score: 2 } as any;
    expect(calculateScoreForGame(game, gameGuessExact)).toBe(2);
    expect(calculateScoreForGame(game, gameGuessCorrect)).toBe(1);
    expect(calculateScoreForGame(game, gameGuessCorrect2)).toBe(1);
    expect(calculateScoreForGame(game, gameGuessIncorrect)).toBe(0);
    expect(calculateScoreForGame(game, gameGuessIncorrect2)).toBe(0);
  });

  it('should handle playoff games with tied scores in 0 and penalty winners', () => {
    const game = { gameResult: { home_score: 0, away_score: 0, home_penalty_score: 3, away_penalty_score: 0 }, game_type: 'playoffs'} as any;
    const gameGuessExact = { home_score: 0, away_score: 0, home_penalty_winner: true } as any;
    const gameGuessCorrect = { home_score: 2, away_score: 0 } as any;
    const gameGuessCorrect2 = { home_score: 2, away_score: 2, home_penalty_winner: true } as any;
    const gameGuessIncorrect = { home_score: 1, away_score: 1, away_penalty_winner: true } as any;
    const gameGuessIncorrect2 = { home_score: 1, away_score: 2 } as any;
    expect(calculateScoreForGame(game, gameGuessExact)).toBe(2);
    expect(calculateScoreForGame(game, gameGuessCorrect)).toBe(1);
    expect(calculateScoreForGame(game, gameGuessCorrect2)).toBe(1);
    expect(calculateScoreForGame(game, gameGuessIncorrect)).toBe(0);
    expect(calculateScoreForGame(game, gameGuessIncorrect2)).toBe(0);
  });

  it('should handle playoff games with non-tied scores and penalty winner guesses', () => {
    const game = { gameResult: { home_score: 2, away_score: 1 }, game_type: 'playoffs' } as any;
    const gameGuessCorrect = { home_score: 1, away_score: 1, home_penalty_winner: true } as any;
    const gameGuessIncorrect = { home_score: 1, away_score: 1, away_penalty_winner: true } as any;
    expect(calculateScoreForGame(game, gameGuessCorrect)).toBe(1);
    expect(calculateScoreForGame(game, gameGuessIncorrect)).toBe(0);
  });
});
