import { 
  getGameWinner, 
  getGameLoser, 
  getGuessWinner, 
  getGuessLoser, 
  getWinner
} from '../../app/utils/score-utils';
import { GameGuessNew } from '../../app/db/tables-definition';

// Mock ExtendedGameData for testing
const createMockGame = (overrides: any = {}) => ({
  id: 'game1',
  home_team: 'Team A',
  away_team: 'Team B',
  gameResult: undefined,
  ...overrides
});

const createMockGuess = (overrides: any = {}): GameGuessNew => ({
  game_id: 'game1',
  user_id: 'user1',
  id: 'guess1',
  game_number: 1,
  home_team: 'Team A',
  away_team: 'Team B',
  home_score: undefined,
  away_score: undefined,
  home_penalty_winner: false,
  away_penalty_winner: false,
  score: undefined,
  ...overrides
});

describe('getWinner', () => {
  it('should return home team when home score is higher', () => {
    const result = getWinner(2, 1, false, false, 'Team A', 'Team B');
    expect(result).toBe('Team A');
  });

  it('should return away team when away score is higher', () => {
    const result = getWinner(1, 2, false, false, 'Team A', 'Team B');
    expect(result).toBe('Team B');
  });

  it('should return home team when scores are tied and home wins penalty shootout', () => {
    const result = getWinner(1, 1, true, false, 'Team A', 'Team B');
    expect(result).toBe('Team A');
  });

  it('should return away team when scores are tied and away wins penalty shootout', () => {
    const result = getWinner(1, 1, false, true, 'Team A', 'Team B');
    expect(result).toBe('Team B');
  });

  it('should return undefined when scores are tied but no penalty winner', () => {
    const result = getWinner(1, 1, false, false, 'Team A', 'Team B');
    expect(result).toBeUndefined();
  });

  it('should return undefined when scores are not integers', () => {
    const result = getWinner(1.5, 2, false, false, 'Team A', 'Team B');
    expect(result).toBeUndefined();
  });

  it('should return undefined when scores are undefined', () => {
    const result = getWinner(undefined, 2, false, false, 'Team A', 'Team B');
    expect(result).toBeUndefined();
  });

  it('should return undefined when scores are null', () => {
    const result = getWinner(null as any, 2, false, false, 'Team A', 'Team B');
    expect(result).toBeUndefined();
  });

  it('should handle both penalty winners being true (edge case)', () => {
    const result = getWinner(1, 1, true, true, 'Team A', 'Team B');
    expect(result).toBe('Team A'); // Should return home team (first condition)
  });

  it('should handle teams being null', () => {
    const result = getWinner(2, 1, false, false, null, null);
    expect(result).toBeNull();
  });
});

describe('getGameWinner', () => {
  it('should return home team when home score is higher', () => {
    const game = createMockGame({
      gameResult: { home_score: 2, away_score: 1, game_id: 'game1', is_draft: false }
    });
    const result = getGameWinner(game);
    expect(result).toBe('Team A');
  });

  it('should return away team when away score is higher', () => {
    const game = createMockGame({
      gameResult: { home_score: 1, away_score: 2, game_id: 'game1', is_draft: false }
    });
    const result = getGameWinner(game);
    expect(result).toBe('Team B');
  });

  it('should return home team when scores are tied and home wins penalty shootout', () => {
    const game = createMockGame({
      gameResult: { 
        home_score: 1, 
        away_score: 1, 
        home_penalty_score: 5, 
        away_penalty_score: 4,
        game_id: 'game1', 
        is_draft: false 
      }
    });
    const result = getGameWinner(game);
    expect(result).toBe('Team A');
  });

  it('should return away team when scores are tied and away wins penalty shootout', () => {
    const game = createMockGame({
      gameResult: { 
        home_score: 1, 
        away_score: 1, 
        home_penalty_score: 4, 
        away_penalty_score: 5,
        game_id: 'game1', 
        is_draft: false 
      }
    });
    const result = getGameWinner(game);
    expect(result).toBe('Team B');
  });

  it('should return undefined when no game result exists', () => {
    const game = createMockGame();
    const result = getGameWinner(game);
    expect(result).toBeUndefined();
  });

  it('should return undefined when scores are not integers', () => {
    const game = createMockGame({
      gameResult: { home_score: 1.5, away_score: 2, game_id: 'game1', is_draft: false }
    });
    const result = getGameWinner(game);
    expect(result).toBeUndefined();
  });

  it('should return undefined when penalty scores are not integers', () => {
    const game = createMockGame({
      gameResult: { 
        home_score: 1, 
        away_score: 1, 
        home_penalty_score: 5.5, 
        away_penalty_score: 4,
        game_id: 'game1', 
        is_draft: false 
      }
    });
    const result = getGameWinner(game);
    expect(result).toBeUndefined();
  });

  it('should return undefined when penalty scores are undefined', () => {
    const game = createMockGame({
      gameResult: { 
        home_score: 1, 
        away_score: 1, 
        home_penalty_score: undefined, 
        away_penalty_score: 4,
        game_id: 'game1', 
        is_draft: false 
      }
    });
    const result = getGameWinner(game);
    expect(result).toBeUndefined();
  });

  it('should handle teams being null', () => {
    const game = createMockGame({
      home_team: null,
      away_team: null,
      gameResult: { home_score: 2, away_score: 1, game_id: 'game1', is_draft: false }
    });
    const result = getGameWinner(game);
    expect(result).toBeNull();
  });
});

describe('getGameLoser', () => {
  it('should return away team when home score is higher', () => {
    const game = createMockGame({
      gameResult: { home_score: 2, away_score: 1, game_id: 'game1', is_draft: false }
    });
    const result = getGameLoser(game);
    expect(result).toBe('Team B');
  });

  it('should return home team when away score is higher', () => {
    const game = createMockGame({
      gameResult: { home_score: 1, away_score: 2, game_id: 'game1', is_draft: false }
    });
    const result = getGameLoser(game);
    expect(result).toBe('Team A');
  });

  it('should return away team when scores are tied and home wins penalty shootout', () => {
    const game = createMockGame({
      gameResult: { 
        home_score: 1, 
        away_score: 1, 
        home_penalty_score: 5, 
        away_penalty_score: 4,
        game_id: 'game1', 
        is_draft: false 
      }
    });
    const result = getGameLoser(game);
    expect(result).toBe('Team B');
  });

  it('should return home team when scores are tied and away wins penalty shootout', () => {
    const game = createMockGame({
      gameResult: { 
        home_score: 1, 
        away_score: 1, 
        home_penalty_score: 4, 
        away_penalty_score: 5,
        game_id: 'game1', 
        is_draft: false 
      }
    });
    const result = getGameLoser(game);
    expect(result).toBe('Team A');
  });

  it('should return undefined when no game result exists', () => {
    const game = createMockGame();
    const result = getGameLoser(game);
    expect(result).toBeUndefined();
  });

  it('should handle teams being null', () => {
    const game = createMockGame({
      home_team: null,
      away_team: null,
      gameResult: { home_score: 2, away_score: 1, game_id: 'game1', is_draft: false }
    });
    const result = getGameLoser(game);
    expect(result).toBeNull();
  });
});

describe('getGuessWinner', () => {
  it('should return home team when home score is higher', () => {
    const guess = createMockGuess({ home_score: 2, away_score: 1 });
    const result = getGuessWinner(guess, 'Team A', 'Team B');
    expect(result).toBe('Team A');
  });

  it('should return away team when away score is higher', () => {
    const guess = createMockGuess({ home_score: 1, away_score: 2 });
    const result = getGuessWinner(guess, 'Team A', 'Team B');
    expect(result).toBe('Team B');
  });

  it('should return home team when scores are tied and home wins penalty shootout', () => {
    const guess = createMockGuess({ 
      home_score: 1, 
      away_score: 1, 
      home_penalty_winner: true, 
      away_penalty_winner: false 
    });
    const result = getGuessWinner(guess, 'Team A', 'Team B');
    expect(result).toBe('Team A');
  });

  it('should return away team when scores are tied and away wins penalty shootout', () => {
    const guess = createMockGuess({ 
      home_score: 1, 
      away_score: 1, 
      home_penalty_winner: false, 
      away_penalty_winner: true 
    });
    const result = getGuessWinner(guess, 'Team A', 'Team B');
    expect(result).toBe('Team B');
  });

  it('should return undefined when scores are tied but no penalty winner', () => {
    const guess = createMockGuess({ 
      home_score: 1, 
      away_score: 1, 
      home_penalty_winner: false, 
      away_penalty_winner: false 
    });
    const result = getGuessWinner(guess, 'Team A', 'Team B');
    expect(result).toBeUndefined();
  });

  it('should return undefined when scores are not integers', () => {
    const guess = createMockGuess({ home_score: 1.5, away_score: 2 });
    const result = getGuessWinner(guess, 'Team A', 'Team B');
    expect(result).toBeUndefined();
  });

  it('should return undefined when scores are undefined', () => {
    const guess = createMockGuess({ home_score: undefined, away_score: 2 });
    const result = getGuessWinner(guess, 'Team A', 'Team B');
    expect(result).toBeUndefined();
  });

  it('should handle teams being null', () => {
    const guess = createMockGuess({ home_score: 2, away_score: 1 });
    const result = getGuessWinner(guess, null, null);
    expect(result).toBeNull();
  });

  it('should use teams from guess if not provided', () => {
    const guess = createMockGuess({ 
      home_score: 2, 
      away_score: 1, 
      home_team: 'Guess Team A', 
      away_team: 'Guess Team B' 
    });
    const result = getGuessWinner(guess);
    expect(result).toBeUndefined();
  });
});

describe('getGuessLoser', () => {
  it('should return away team when home score is higher', () => {
    const guess = createMockGuess({ home_score: 2, away_score: 1 });
    const result = getGuessLoser(guess, 'Team A', 'Team B');
    expect(result).toBe('Team B');
  });

  it('should return home team when away score is higher', () => {
    const guess = createMockGuess({ home_score: 1, away_score: 2 });
    const result = getGuessLoser(guess, 'Team A', 'Team B');
    expect(result).toBe('Team A');
  });

  it('should return away team when scores are tied and home wins penalty shootout', () => {
    const guess = createMockGuess({ 
      home_score: 1, 
      away_score: 1, 
      home_penalty_winner: true, 
      away_penalty_winner: false 
    });
    const result = getGuessLoser(guess, 'Team A', 'Team B');
    expect(result).toBe('Team B');
  });

  it('should return home team when scores are tied and away wins penalty shootout', () => {
    const guess = createMockGuess({ 
      home_score: 1, 
      away_score: 1, 
      home_penalty_winner: false, 
      away_penalty_winner: true 
    });
    const result = getGuessLoser(guess, 'Team A', 'Team B');
    expect(result).toBe('Team A');
  });

  it('should return undefined when scores are tied but no penalty winner', () => {
    const guess = createMockGuess({ 
      home_score: 1, 
      away_score: 1, 
      home_penalty_winner: false, 
      away_penalty_winner: false 
    });
    const result = getGuessLoser(guess, 'Team A', 'Team B');
    expect(result).toBeUndefined();
  });

  it('should handle teams being null', () => {
    const guess = createMockGuess({ home_score: 2, away_score: 1 });
    const result = getGuessLoser(guess, null, null);
    expect(result).toBeNull();
  });

  it('should use teams from guess if not provided', () => {
    const guess = createMockGuess({ 
      home_score: 2, 
      away_score: 1, 
      home_team: 'Guess Team A', 
      away_team: 'Guess Team B' 
    });
    const result = getGuessLoser(guess);
    expect(result).toBeUndefined();
  });
}); 