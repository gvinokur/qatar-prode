import { 
  getGameWinner, 
  getGameLoser, 
  getGuessWinner, 
  getGuessLoser, 
  getWinner
} from '../../app/utils/score-utils';
import { GameGuessNew } from '../../app/db/tables-definition';
import { ExtendedGameData } from '../../app/definitions';

// Mock ExtendedGameData for testing
const _createMockGame = (overrides: any = {}) => ({
  id: 'game1',
  home_team: 'Team A',
  away_team: 'Team B',
  gameResult: undefined,
  ...overrides
});

const _createMockGuess = (overrides: any = {}): GameGuessNew => ({
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

describe('score-utils', () => {
  const mockGame = (homeTeam: string, awayTeam: string): ExtendedGameData => ({
    id: 'test-game',
    tournament_id: 'test-tournament',
    game_number: 1,
    home_team: homeTeam,
    away_team: awayTeam,
    game_date: new Date(),
    location: 'test-venue',
    home_team_rule: undefined,
    away_team_rule: undefined,
    game_type: undefined,
    game_local_timezone: undefined,
    group: null,
    playoffStage: null,
    gameResult: undefined
  });

  const mockGameGuess = (homeScore: number, awayScore: number, homePenaltyWinner = false, awayPenaltyWinner = false): GameGuessNew => ({
    game_number: 1,
    game_id: 'test-game',
    user_id: 'test-user',
    home_team: 'team1',
    away_team: 'team2',
    home_score: homeScore,
    away_score: awayScore,
    home_penalty_winner: homePenaltyWinner,
    away_penalty_winner: awayPenaltyWinner
  });

  describe('getGameWinner', () => {
    it('should return home team when home team wins', () => {
      const game = {
        ...mockGame('team1', 'team2'),
        gameResult: {
          game_id: 'test-game',
          is_draft: false,
          home_score: 2,
          away_score: 1,
          home_penalty_score: undefined,
          away_penalty_score: undefined
        }
      };

      const winner = getGameWinner(game);
      expect(winner).toBe('team1');
    });

    it('should return away team when away team wins', () => {
      const game = {
        ...mockGame('team1', 'team2'),
        gameResult: {
          game_id: 'test-game',
          is_draft: false,
          home_score: 1,
          away_score: 2,
          home_penalty_score: undefined,
          away_penalty_score: undefined
        }
      };

      const winner = getGameWinner(game);
      expect(winner).toBe('team2');
    });

    it('should return home team when scores are tied and home team wins penalties', () => {
      const game = {
        ...mockGame('team1', 'team2'),
        gameResult: {
          game_id: 'test-game',
          is_draft: false,
          home_score: 1,
          away_score: 1,
          home_penalty_score: 5,
          away_penalty_score: 4
        }
      };

      const winner = getGameWinner(game);
      expect(winner).toBe('team1');
    });

    it('should return away team when scores are tied and away team wins penalties', () => {
      const game = {
        ...mockGame('team1', 'team2'),
        gameResult: {
          game_id: 'test-game',
          is_draft: false,
          home_score: 1,
          away_score: 1,
          home_penalty_score: 4,
          away_penalty_score: 5
        }
      };

      const winner = getGameWinner(game);
      expect(winner).toBe('team2');
    });

    it('should return undefined when scores are tied and no penalty scores', () => {
      const game = {
        ...mockGame('team1', 'team2'),
        gameResult: {
          game_id: 'test-game',
          is_draft: false,
          home_score: 1,
          away_score: 1,
          home_penalty_score: undefined,
          away_penalty_score: undefined
        }
      };

      const winner = getGameWinner(game);
      expect(winner).toBeUndefined();
    });

    it('should return undefined when no game result', () => {
      const game = mockGame('team1', 'team2');

      const winner = getGameWinner(game);
      expect(winner).toBeUndefined();
    });

    it('should return undefined when scores are not integers', () => {
      const game = {
        ...mockGame('team1', 'team2'),
        gameResult: {
          game_id: 'test-game',
          is_draft: false,
          home_score: 1.5,
          away_score: 1,
          home_penalty_score: undefined,
          away_penalty_score: undefined
        }
      };

      const winner = getGameWinner(game);
      expect(winner).toBeUndefined();
    });

    it('should return undefined when scores are undefined', () => {
      const game = {
        ...mockGame('team1', 'team2'),
        gameResult: {
          game_id: 'test-game',
          is_draft: false,
          home_score: undefined,
          away_score: undefined,
          home_penalty_score: undefined,
          away_penalty_score: undefined
        }
      };

      const winner = getGameWinner(game);
      expect(winner).toBeUndefined();
    });
  });

  describe('getGameLoser', () => {
    it('should return away team when home team wins', () => {
      const game = {
        ...mockGame('team1', 'team2'),
        gameResult: {
          game_id: 'test-game',
          is_draft: false,
          home_score: 2,
          away_score: 1,
          home_penalty_score: undefined,
          away_penalty_score: undefined
        }
      };

      const loser = getGameLoser(game);
      expect(loser).toBe('team2');
    });

    it('should return home team when away team wins', () => {
      const game = {
        ...mockGame('team1', 'team2'),
        gameResult: {
          game_id: 'test-game',
          is_draft: false,
          home_score: 1,
          away_score: 2,
          home_penalty_score: undefined,
          away_penalty_score: undefined
        }
      };

      const loser = getGameLoser(game);
      expect(loser).toBe('team1');
    });

    it('should return away team when scores are tied and home team wins penalties', () => {
      const game = {
        ...mockGame('team1', 'team2'),
        gameResult: {
          game_id: 'test-game',
          is_draft: false,
          home_score: 1,
          away_score: 1,
          home_penalty_score: 5,
          away_penalty_score: 4
        }
      };

      const loser = getGameLoser(game);
      expect(loser).toBe('team2');
    });

    it('should return home team when scores are tied and away team wins penalties', () => {
      const game = {
        ...mockGame('team1', 'team2'),
        gameResult: {
          game_id: 'test-game',
          is_draft: false,
          home_score: 1,
          away_score: 1,
          home_penalty_score: 4,
          away_penalty_score: 5
        }
      };

      const loser = getGameLoser(game);
      expect(loser).toBe('team1');
    });

    it('should return undefined when scores are tied and no penalty scores', () => {
      const game = {
        ...mockGame('team1', 'team2'),
        gameResult: {
          game_id: 'test-game',
          is_draft: false,
          home_score: 1,
          away_score: 1,
          home_penalty_score: undefined,
          away_penalty_score: undefined
        }
      };

      const loser = getGameLoser(game);
      expect(loser).toBeUndefined();
    });
  });

  describe('getGuessWinner', () => {
    it('should return home team when home team wins', () => {
      const guess = mockGameGuess(2, 1);
      const winner = getGuessWinner(guess, 'team1', 'team2');
      expect(winner).toBe('team1');
    });

    it('should return away team when away team wins', () => {
      const guess = mockGameGuess(1, 2);
      const winner = getGuessWinner(guess, 'team1', 'team2');
      expect(winner).toBe('team2');
    });

    it('should return home team when scores are tied and home team wins penalties', () => {
      const guess = mockGameGuess(1, 1, true, false);
      const winner = getGuessWinner(guess, 'team1', 'team2');
      expect(winner).toBe('team1');
    });

    it('should return away team when scores are tied and away team wins penalties', () => {
      const guess = mockGameGuess(1, 1, false, true);
      const winner = getGuessWinner(guess, 'team1', 'team2');
      expect(winner).toBe('team2');
    });

    it('should return undefined when scores are tied and no penalty winner', () => {
      const guess = mockGameGuess(1, 1, false, false);
      const winner = getGuessWinner(guess, 'team1', 'team2');
      expect(winner).toBeUndefined();
    });

    it('should return undefined when no teams provided', () => {
      const guess = mockGameGuess(2, 1);
      const winner = getGuessWinner(guess);
      expect(winner).toBeUndefined();
    });
  });

  describe('getGuessLoser', () => {
    it('should return away team when home team wins', () => {
      const guess = mockGameGuess(2, 1);
      const loser = getGuessLoser(guess, 'team1', 'team2');
      expect(loser).toBe('team2');
    });

    it('should return home team when away team wins', () => {
      const guess = mockGameGuess(1, 2);
      const loser = getGuessLoser(guess, 'team1', 'team2');
      expect(loser).toBe('team1');
    });

    it('should return away team when scores are tied and home team wins penalties', () => {
      const guess = mockGameGuess(1, 1, true, false);
      const loser = getGuessLoser(guess, 'team1', 'team2');
      expect(loser).toBe('team2');
    });

    it('should return home team when scores are tied and away team wins penalties', () => {
      const guess = mockGameGuess(1, 1, false, true);
      const loser = getGuessLoser(guess, 'team1', 'team2');
      expect(loser).toBe('team1');
    });

    it('should return undefined when scores are tied and no penalty winner', () => {
      const guess = mockGameGuess(1, 1, false, false);
      const loser = getGuessLoser(guess, 'team1', 'team2');
      expect(loser).toBeUndefined();
    });

    it('should return undefined when no teams provided', () => {
      const guess = mockGameGuess(2, 1);
      const loser = getGuessLoser(guess);
      expect(loser).toBeUndefined();
    });
  });

  describe('getWinner', () => {
    it('should return home team when home team wins', () => {
      const winner = getWinner(2, 1, false, false, 'team1', 'team2');
      expect(winner).toBe('team1');
    });

    it('should return away team when away team wins', () => {
      const winner = getWinner(1, 2, false, false, 'team1', 'team2');
      expect(winner).toBe('team2');
    });

    it('should return home team when scores are tied and home team wins penalties', () => {
      const winner = getWinner(1, 1, true, false, 'team1', 'team2');
      expect(winner).toBe('team1');
    });

    it('should return away team when scores are tied and away team wins penalties', () => {
      const winner = getWinner(1, 1, false, true, 'team1', 'team2');
      expect(winner).toBe('team2');
    });

    it('should return undefined when scores are tied and no penalty winner', () => {
      const winner = getWinner(1, 1, false, false, 'team1', 'team2');
      expect(winner).toBeUndefined();
    });

    it('should return undefined when scores are not integers', () => {
      const winner = getWinner(1.5, 1, false, false, 'team1', 'team2');
      expect(winner).toBeUndefined();
    });

    it('should return undefined when scores are undefined', () => {
      const winner = getWinner(undefined, undefined, false, false, 'team1', 'team2');
      expect(winner).toBeUndefined();
    });

    it('should return undefined when no teams provided', () => {
      const winner = getWinner(2, 1, false, false);
      expect(winner).toBeUndefined();
    });
  });
}); 