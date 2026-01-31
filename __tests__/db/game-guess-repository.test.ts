import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  findGameGuessById,
  createGameGuess,
  updateGameGuess,
  deleteGameGuess,
  findGameGuessesByUserId,
  updateGameGuessByGameId,
  updateOrCreateGuess,
  getGameGuessStatisticsForUsers,
  findAllGuessesForGamesWithResultsInDraft,
  deleteAllUserGameGuesses,
  deleteAllGameGuessesByTournamentId,
  updateGameGuessWithBoost,
  setGameGuessBoost,
  countUserBoostsByType,
  getGameGuessWithBoost,
  getPredictionDashboardStats,
  getBoostAllocationBreakdown,
} from '../../app/db/game-guess-repository';
import { db } from '../../app/db/database';
import { testFactories } from './test-factories';
import { createMockSelectQuery, createMockUpdateQuery, createMockDeleteQuery } from './mock-helpers';

// Mock the database
vi.mock('../../app/db/database', () => ({
  db: {
    selectFrom: vi.fn(),
    insertInto: vi.fn(),
    updateTable: vi.fn(),
    deleteFrom: vi.fn(),
  },
}));

// Mock base-repository
const mockBaseFunctions = vi.hoisted(() => ({
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));
vi.mock('../../app/db/base-repository', () => ({
  createBaseFunctions: vi.fn(() => mockBaseFunctions),
}));

// Mock React cache
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    cache: vi.fn((fn) => fn),
  };
});

describe('Game Guess Repository', () => {
  const mockDb = vi.mocked(db);
  const mockGuess = testFactories.gameGuess();
  const mockGuesses = [
    testFactories.gameGuess({ id: 'guess-1', user_id: 'user-1', game_id: 'game-1' }),
    testFactories.gameGuess({ id: 'guess-2', user_id: 'user-1', game_id: 'game-2' }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Base CRUD Functions', () => {
    describe('findGameGuessById', () => {
      it('should call base findById function', async () => {
        mockBaseFunctions.findById.mockResolvedValue(mockGuess);

        const result = await findGameGuessById('guess-1');

        expect(mockBaseFunctions.findById).toHaveBeenCalledWith('guess-1');
        expect(result).toEqual(mockGuess);
      });
    });

    describe('createGameGuess', () => {
      it('should call base create function', async () => {
        mockBaseFunctions.create.mockResolvedValue(mockGuess);

        const newGuess = {
          game_id: 'game-1',
          game_number: 1,
          user_id: 'user-1',
          home_team: 'team-1',
          away_team: 'team-2',
          home_score: 2,
          away_score: 1,
        };

        const result = await createGameGuess(newGuess);

        expect(mockBaseFunctions.create).toHaveBeenCalledWith(newGuess);
        expect(result).toEqual(mockGuess);
      });
    });

    describe('updateGameGuess', () => {
      it('should call base update function', async () => {
        const updates = { home_score: 3, away_score: 2 };
        mockBaseFunctions.update.mockResolvedValue({ ...mockGuess, ...updates });

        const result = await updateGameGuess('guess-1', updates);

        expect(mockBaseFunctions.update).toHaveBeenCalledWith('guess-1', updates);
        expect(result.home_score).toBe(3);
      });
    });

    describe('deleteGameGuess', () => {
      it('should call base delete function', async () => {
        mockBaseFunctions.delete.mockResolvedValue(mockGuess);

        const result = await deleteGameGuess('guess-1');

        expect(mockBaseFunctions.delete).toHaveBeenCalledWith('guess-1');
        expect(result).toEqual(mockGuess);
      });
    });
  });

  describe('Query Functions', () => {
    describe('findGameGuessesByUserId', () => {
      it('should find guesses with game join', async () => {
        const mockQuery = {
          innerJoin: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          selectAll: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue(mockGuesses),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await findGameGuessesByUserId('user-1', 'tournament-1');

        expect(mockDb.selectFrom).toHaveBeenCalledWith('game_guesses');
        expect(mockQuery.innerJoin).toHaveBeenCalledWith('games', 'games.id', 'game_guesses.game_id');
        expect(mockQuery.where).toHaveBeenCalledWith('game_guesses.user_id', '=', 'user-1');
        expect(mockQuery.where).toHaveBeenCalledWith('games.tournament_id', '=', 'tournament-1');
        expect(mockQuery.selectAll).toHaveBeenCalledWith('game_guesses');
        expect(result).toEqual(mockGuesses);
      });

      it('should return empty array when user has no guesses', async () => {
        const mockQuery = {
          innerJoin: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          selectAll: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue([]),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await findGameGuessesByUserId('user-1', 'tournament-1');

        expect(result).toEqual([]);
      });
    });

    describe('updateGameGuessByGameId', () => {
      it('should update guess with team changes', async () => {
        const updates = { home_team: 'team-new', away_team: 'team-new-2' };
        const mockQuery = createMockUpdateQuery({ ...mockGuess, ...updates });
        mockDb.updateTable.mockReturnValue(mockQuery as any);

        const result = await updateGameGuessByGameId('game-1', 'user-1', updates);

        expect(mockDb.updateTable).toHaveBeenCalledWith('game_guesses');
        expect(mockQuery.set).toHaveBeenCalledWith(updates);
        expect(mockQuery.where).toHaveBeenCalledWith('game_guesses.game_id', '=', 'game-1');
        expect(mockQuery.where).toHaveBeenCalledWith('game_guesses.user_id', '=', 'user-1');
        expect(result).toEqual({ ...mockGuess, ...updates });
      });

      it('should use OR condition for team changes', async () => {
        const mockQuery = createMockUpdateQuery(mockGuess);
        mockDb.updateTable.mockReturnValue(mockQuery as any);

        await updateGameGuessByGameId('game-1', 'user-1', { home_team: 'team-1' });

        expect(mockQuery.where).toHaveBeenCalledWith(expect.any(Function));
      });

      it('should return undefined when no update needed', async () => {
        const mockQuery = createMockUpdateQuery(undefined);
        mockDb.updateTable.mockReturnValue(mockQuery as any);

        const result = await updateGameGuessByGameId('game-1', 'user-1', {});

        expect(result).toBeUndefined();
      });
    });

    describe('updateOrCreateGuess', () => {
      it('should delete and recreate existing guess', async () => {
        // Mock findByConditions to return existing guess
        const mockSelectQuery = createMockSelectQuery(mockGuess);
        mockDb.selectFrom.mockReturnValueOnce(mockSelectQuery as any);

        // Mock delete
        mockBaseFunctions.delete.mockResolvedValue(mockGuess);

        // Mock create
        const newGuess = testFactories.gameGuess({ id: 'new-guess-1' });
        mockBaseFunctions.create.mockResolvedValue(newGuess);

        const guessData = {
          game_id: 'game-1',
          game_number: 1,
          user_id: 'user-1',
          home_team: 'team-1',
          away_team: 'team-2',
          home_score: 3,
          away_score: 2,
        };

        const result = await updateOrCreateGuess(guessData);

        expect(mockDb.selectFrom).toHaveBeenCalledWith('game_guesses');
        expect(mockBaseFunctions.delete).toHaveBeenCalledWith(mockGuess.id);
        expect(mockBaseFunctions.create).toHaveBeenCalledWith(guessData);
        expect(result).toEqual(newGuess);
      });

      it('should create new guess if not exists', async () => {
        // Mock findByConditions to return undefined
        const mockSelectQuery = createMockSelectQuery(undefined);
        mockDb.selectFrom.mockReturnValueOnce(mockSelectQuery as any);

        // Mock create
        mockBaseFunctions.create.mockResolvedValue(mockGuess);

        const guessData = {
          game_id: 'game-1',
          game_number: 1,
          user_id: 'user-1',
          home_team: 'team-1',
          away_team: 'team-2',
          home_score: 1,
          away_score: 0,
        };

        const result = await updateOrCreateGuess(guessData);

        expect(mockBaseFunctions.delete).not.toHaveBeenCalled();
        expect(mockBaseFunctions.create).toHaveBeenCalledWith(guessData);
        expect(result).toEqual(mockGuess);
      });
    });

    describe('getGameGuessStatisticsForUsers', () => {
      it('should build complex aggregation query', async () => {
        const mockStatistics = [
          {
            user_id: 'user-1',
            total_correct_guesses: 10,
            total_exact_guesses: 5,
            total_score: 75,
            total_boost_bonus: 15,
            group_correct_guesses: 6,
            group_exact_guesses: 3,
            group_score: 45,
            group_boost_bonus: 9,
            playoff_correct_guesses: 4,
            playoff_exact_guesses: 2,
            playoff_score: 30,
            playoff_boost_bonus: 6,
          },
        ];

        const mockQuery = {
          innerJoin: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          groupBy: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue(mockStatistics),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await getGameGuessStatisticsForUsers(['user-1'], 'tournament-1');

        expect(mockDb.selectFrom).toHaveBeenCalledWith('game_guesses');
        expect(mockQuery.innerJoin).toHaveBeenCalledWith('games', 'games.id', 'game_guesses.game_id');
        expect(mockQuery.where).toHaveBeenCalledWith('game_guesses.user_id', 'in', ['user-1']);
        expect(mockQuery.where).toHaveBeenCalledWith('games.tournament_id', '=', 'tournament-1');
        expect(mockQuery.select).toHaveBeenCalledWith('user_id');
        expect(mockQuery.select).toHaveBeenCalledWith(expect.any(Function));
        expect(mockQuery.groupBy).toHaveBeenCalledWith('game_guesses.user_id');
        expect(result).toEqual(mockStatistics);
      });

      it('should handle multiple users', async () => {
        const mockQuery = {
          innerJoin: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          groupBy: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue([]),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        await getGameGuessStatisticsForUsers(['user-1', 'user-2', 'user-3'], 'tournament-1');

        expect(mockQuery.where).toHaveBeenCalledWith('game_guesses.user_id', 'in', ['user-1', 'user-2', 'user-3']);
      });

      it('should return empty array when no statistics', async () => {
        const mockQuery = {
          innerJoin: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          groupBy: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue([]),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await getGameGuessStatisticsForUsers(['user-1'], 'tournament-1');

        expect(result).toEqual([]);
      });
    });

    describe('findAllGuessesForGamesWithResultsInDraft', () => {
      it('should find guesses with draft results using EXISTS', async () => {
        const mockQuery = {
          selectAll: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue(mockGuesses),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await findAllGuessesForGamesWithResultsInDraft();

        expect(mockDb.selectFrom).toHaveBeenCalledWith('game_guesses');
        expect(mockQuery.selectAll).toHaveBeenCalled();
        expect(mockQuery.where).toHaveBeenCalledWith('score', 'is not', null);
        expect(mockQuery.where).toHaveBeenCalledWith(expect.any(Function));
        expect(result).toEqual(mockGuesses);
      });

      it('should return empty array when no draft results', async () => {
        const mockQuery = {
          selectAll: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue([]),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await findAllGuessesForGamesWithResultsInDraft();

        expect(result).toEqual([]);
      });
    });
  });

  describe('Delete Operations', () => {
    describe('deleteAllUserGameGuesses', () => {
      it('should delete all guesses for user', async () => {
        const mockQuery = createMockDeleteQuery(mockGuesses);
        mockDb.deleteFrom.mockReturnValue(mockQuery as any);

        await deleteAllUserGameGuesses('user-1');

        expect(mockDb.deleteFrom).toHaveBeenCalledWith('game_guesses');
        expect(mockQuery.where).toHaveBeenCalledWith('user_id', '=', 'user-1');
        expect(mockQuery.execute).toHaveBeenCalled();
      });

      it('should handle user with no guesses', async () => {
        const mockQuery = createMockDeleteQuery([]);
        mockDb.deleteFrom.mockReturnValue(mockQuery as any);

        const result = await deleteAllUserGameGuesses('user-with-no-guesses');

        expect(result).toEqual([]);
      });
    });

    describe('deleteAllGameGuessesByTournamentId', () => {
      it('should delete guesses using game subquery', async () => {
        const mockSelectQuery = {
          select: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
        };
        mockDb.selectFrom.mockReturnValue(mockSelectQuery as any);

        const mockDeleteQuery = createMockDeleteQuery(mockGuesses);
        mockDb.deleteFrom.mockReturnValue(mockDeleteQuery as any);

        await deleteAllGameGuessesByTournamentId('tournament-1');

        expect(mockDb.selectFrom).toHaveBeenCalledWith('games');
        expect(mockSelectQuery.select).toHaveBeenCalledWith('id');
        expect(mockSelectQuery.where).toHaveBeenCalledWith('tournament_id', '=', 'tournament-1');
        expect(mockDb.deleteFrom).toHaveBeenCalledWith('game_guesses');
        expect(mockDeleteQuery.where).toHaveBeenCalledWith('game_id', 'in', mockSelectQuery);
      });

      it('should handle tournament with no games', async () => {
        const mockSelectQuery = {
          select: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
        };
        mockDb.selectFrom.mockReturnValue(mockSelectQuery as any);

        const mockDeleteQuery = createMockDeleteQuery([]);
        mockDb.deleteFrom.mockReturnValue(mockDeleteQuery as any);

        const result = await deleteAllGameGuessesByTournamentId('empty-tournament');

        expect(result).toEqual([]);
      });
    });
  });

  describe('Boost Logic', () => {
    describe('updateGameGuessWithBoost', () => {
      it('should calculate golden boost correctly (3.0x)', async () => {
        const mockQuery = createMockUpdateQuery({
          ...mockGuess,
          score: 10,
          boost_multiplier: 3.0,
          final_score: 30,
        });
        mockDb.updateTable.mockReturnValue(mockQuery as any);

        const result = await updateGameGuessWithBoost('guess-1', 10, 'golden');

        expect(mockQuery.set).toHaveBeenCalledWith({
          score: 10,
          boost_multiplier: 3.0,
          final_score: 30,
        });
        expect(result.boost_multiplier).toBe(3.0);
        expect(result.final_score).toBe(30);
      });

      it('should calculate silver boost correctly (2.0x)', async () => {
        const mockQuery = createMockUpdateQuery({
          ...mockGuess,
          score: 10,
          boost_multiplier: 2.0,
          final_score: 20,
        });
        mockDb.updateTable.mockReturnValue(mockQuery as any);

        const result = await updateGameGuessWithBoost('guess-1', 10, 'silver');

        expect(mockQuery.set).toHaveBeenCalledWith({
          score: 10,
          boost_multiplier: 2.0,
          final_score: 20,
        });
        expect(result.boost_multiplier).toBe(2.0);
        expect(result.final_score).toBe(20);
      });

      it('should handle no boost (1.0x)', async () => {
        const mockQuery = createMockUpdateQuery({
          ...mockGuess,
          score: 10,
          boost_multiplier: 1.0,
          final_score: 10,
        });
        mockDb.updateTable.mockReturnValue(mockQuery as any);

        const result = await updateGameGuessWithBoost('guess-1', 10, null);

        expect(mockQuery.set).toHaveBeenCalledWith({
          score: 10,
          boost_multiplier: 1.0,
          final_score: 10,
        });
        expect(result.final_score).toBe(10);
      });

      it('should round final score correctly', async () => {
        const mockQuery = createMockUpdateQuery({
          ...mockGuess,
          score: 7,
          boost_multiplier: 3.0,
          final_score: 21, // 7 * 3.0 = 21.0 → rounds to 21
        });
        mockDb.updateTable.mockReturnValue(mockQuery as any);

        await updateGameGuessWithBoost('guess-1', 7, 'golden');

        expect(mockQuery.set).toHaveBeenCalledWith(expect.objectContaining({
          final_score: 21,
        }));
      });

      it('should handle fractional scores with rounding', async () => {
        const mockQuery = createMockUpdateQuery({
          ...mockGuess,
          score: 5,
          boost_multiplier: 2.0,
          final_score: 10, // 5 * 2.0 = 10.0 → rounds to 10
        });
        mockDb.updateTable.mockReturnValue(mockQuery as any);

        await updateGameGuessWithBoost('guess-1', 5, 'silver');

        expect(mockQuery.set).toHaveBeenCalledWith(expect.objectContaining({
          final_score: 10,
        }));
      });

      it('should handle zero base score', async () => {
        const mockQuery = createMockUpdateQuery({
          ...mockGuess,
          score: 0,
          boost_multiplier: 3.0,
          final_score: 0,
        });
        mockDb.updateTable.mockReturnValue(mockQuery as any);

        await updateGameGuessWithBoost('guess-1', 0, 'golden');

        expect(mockQuery.set).toHaveBeenCalledWith({
          score: 0,
          boost_multiplier: 3.0,
          final_score: 0,
        });
      });
    });

    describe('setGameGuessBoost', () => {
      it('should set golden boost type', async () => {
        const mockQuery = createMockUpdateQuery({ ...mockGuess, boost_type: 'golden' });
        mockDb.updateTable.mockReturnValue(mockQuery as any);

        const result = await setGameGuessBoost('user-1', 'game-1', 'golden');

        expect(mockDb.updateTable).toHaveBeenCalledWith('game_guesses');
        expect(mockQuery.set).toHaveBeenCalledWith({ boost_type: 'golden' });
        expect(mockQuery.where).toHaveBeenCalledWith('user_id', '=', 'user-1');
        expect(mockQuery.where).toHaveBeenCalledWith('game_id', '=', 'game-1');
        expect(result.boost_type).toBe('golden');
      });

      it('should set silver boost type', async () => {
        const mockQuery = createMockUpdateQuery({ ...mockGuess, boost_type: 'silver' });
        mockDb.updateTable.mockReturnValue(mockQuery as any);

        const result = await setGameGuessBoost('user-1', 'game-1', 'silver');

        expect(mockQuery.set).toHaveBeenCalledWith({ boost_type: 'silver' });
        expect(result.boost_type).toBe('silver');
      });

      it('should remove boost type (set to null)', async () => {
        const mockQuery = createMockUpdateQuery({ ...mockGuess, boost_type: null });
        mockDb.updateTable.mockReturnValue(mockQuery as any);

        const result = await setGameGuessBoost('user-1', 'game-1', null);

        expect(mockQuery.set).toHaveBeenCalledWith({ boost_type: null });
        expect(result.boost_type).toBeNull();
      });
    });

    describe('countUserBoostsByType', () => {
      it('should count silver and golden boosts', async () => {
        const mockBoosts = [
          { boost_type: 'silver' as const },
          { boost_type: 'silver' as const },
          { boost_type: 'golden' as const },
        ];
        const mockQuery = {
          innerJoin: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue(mockBoosts),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await countUserBoostsByType('user-1', 'tournament-1');

        expect(mockDb.selectFrom).toHaveBeenCalledWith('game_guesses');
        expect(mockQuery.innerJoin).toHaveBeenCalledWith('games', 'games.id', 'game_guesses.game_id');
        expect(mockQuery.where).toHaveBeenCalledWith('game_guesses.user_id', '=', 'user-1');
        expect(mockQuery.where).toHaveBeenCalledWith('games.tournament_id', '=', 'tournament-1');
        expect(mockQuery.where).toHaveBeenCalledWith('game_guesses.boost_type', 'is not', null);
        expect(result.silver).toBe(2);
        expect(result.golden).toBe(1);
      });

      it('should return zero counts when no boosts', async () => {
        const mockQuery = {
          innerJoin: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue([]),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await countUserBoostsByType('user-1', 'tournament-1');

        expect(result.silver).toBe(0);
        expect(result.golden).toBe(0);
      });

      it('should handle only silver boosts', async () => {
        const mockBoosts = [
          { boost_type: 'silver' as const },
          { boost_type: 'silver' as const },
          { boost_type: 'silver' as const },
        ];
        const mockQuery = {
          innerJoin: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue(mockBoosts),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await countUserBoostsByType('user-1', 'tournament-1');

        expect(result.silver).toBe(3);
        expect(result.golden).toBe(0);
      });

      it('should handle only golden boosts', async () => {
        const mockBoosts = [
          { boost_type: 'golden' as const },
          { boost_type: 'golden' as const },
        ];
        const mockQuery = {
          innerJoin: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue(mockBoosts),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await countUserBoostsByType('user-1', 'tournament-1');

        expect(result.silver).toBe(0);
        expect(result.golden).toBe(2);
      });
    });

    describe('getGameGuessWithBoost', () => {
      it('should find guess with boost info', async () => {
        const mockGuessWithBoost = testFactories.gameGuess({
          boost_type: 'golden',
          boost_multiplier: 3.0,
          final_score: 30,
        });
        const mockQuery = createMockSelectQuery(mockGuessWithBoost);
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await getGameGuessWithBoost('user-1', 'game-1');

        expect(mockDb.selectFrom).toHaveBeenCalledWith('game_guesses');
        expect(mockQuery.where).toHaveBeenCalledWith('user_id', '=', 'user-1');
        expect(mockQuery.where).toHaveBeenCalledWith('game_id', '=', 'game-1');
        expect(mockQuery.selectAll).toHaveBeenCalled();
        expect(result).toEqual(mockGuessWithBoost);
      });

      it('should return undefined when guess not found', async () => {
        const mockQuery = createMockSelectQuery(undefined);
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await getGameGuessWithBoost('user-1', 'nonexistent-game');

        expect(result).toBeUndefined();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle database connection errors', async () => {
      vi.clearAllMocks();

      const mockQuery = {
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        selectAll: vi.fn().mockReturnThis(),
        execute: vi.fn().mockRejectedValue(new Error('Connection lost')),
      };
      mockDb.selectFrom.mockReturnValueOnce(mockQuery as any);

      await expect(findGameGuessesByUserId('user-1', 'tournament-1')).rejects.toThrow('Connection lost');
    });

    it('should handle negative scores', async () => {
      const mockQuery = createMockUpdateQuery({
        ...mockGuess,
        score: -5,
        boost_multiplier: 2.0,
        final_score: -10,
      });
      mockDb.updateTable.mockReturnValue(mockQuery as any);

      await updateGameGuessWithBoost('guess-1', -5, 'silver');

      expect(mockQuery.set).toHaveBeenCalledWith({
        score: -5,
        boost_multiplier: 2.0,
        final_score: -10,
      });
    });

    it('should handle large score values', async () => {
      const mockQuery = createMockUpdateQuery({
        ...mockGuess,
        score: 1000,
        boost_multiplier: 3.0,
        final_score: 3000,
      });
      mockDb.updateTable.mockReturnValue(mockQuery as any);

      await updateGameGuessWithBoost('guess-1', 1000, 'golden');

      expect(mockQuery.set).toHaveBeenCalledWith({
        score: 1000,
        boost_multiplier: 3.0,
        final_score: 3000,
      });
    });
  });

  describe('getPredictionDashboardStats', () => {
    it('should return prediction dashboard statistics', async () => {
      const mockStats = {
        total_games: 10,
        predicted_games: 7,
        silver_used: 2,
        golden_used: 1,
      };

      const mockQuery = {
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        executeTakeFirstOrThrow: vi.fn().mockResolvedValue(mockStats),
      };

      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      const result = await getPredictionDashboardStats('user-1', 'tournament-1');

      expect(mockDb.selectFrom).toHaveBeenCalledWith('games');
      expect(mockQuery.where).toHaveBeenCalledWith('games.tournament_id', '=', 'tournament-1');
      expect(result).toEqual({
        totalGames: 10,
        predictedGames: 7,
        silverUsed: 2,
        goldenUsed: 1,
      });
    });

    it('should return zeros when no data exists', async () => {
      const mockStats = {
        total_games: 0,
        predicted_games: 0,
        silver_used: 0,
        golden_used: 0,
      };

      const mockQuery = {
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        executeTakeFirstOrThrow: vi.fn().mockResolvedValue(mockStats),
      };

      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      const result = await getPredictionDashboardStats('user-1', 'tournament-1');

      expect(result).toEqual({
        totalGames: 0,
        predictedGames: 0,
        silverUsed: 0,
        goldenUsed: 0,
      });
    });

    it('should handle different boost counts', async () => {
      const mockStats = {
        total_games: 20,
        predicted_games: 18,
        silver_used: 5,
        golden_used: 2,
      };

      const mockQuery = {
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        executeTakeFirstOrThrow: vi.fn().mockResolvedValue(mockStats),
      };

      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      const result = await getPredictionDashboardStats('user-2', 'tournament-2');

      expect(result.silverUsed).toBe(5);
      expect(result.goldenUsed).toBe(2);
    });

  });

  describe('getBoostAllocationBreakdown', () => {
    it('should return empty data when no boosts allocated', async () => {
      // Mock group stage query (empty results)
      const mockGroupQuery = {
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue([]),
      };

      // Mock playoff query (no results)
      const mockPlayoffQuery = {
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(null),
      };

      // First selectFrom is for group query
      mockDb.selectFrom.mockReturnValueOnce(mockGroupQuery as any);
      // Second selectFrom is for playoff query
      mockDb.selectFrom.mockReturnValueOnce(mockPlayoffQuery as any);

      const result = await getBoostAllocationBreakdown('user-1', 'tournament-1', 'silver');

      expect(result).toEqual({
        byGroup: [],
        playoffCount: 0,
        totalBoosts: 0,
        scoredGamesCount: 0,
        totalPointsEarned: 0,
      });
    });

    it('should aggregate boosts correctly by group letter', async () => {
      const mockGroupResults = [
        { group_letter: 'A', count: 2, scored_games: 1, boost_bonus: 3 },
        { group_letter: 'B', count: 1, scored_games: 1, boost_bonus: 2 },
      ];

      const mockGroupQuery = {
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue(mockGroupResults),
      };

      const mockPlayoffQuery = {
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(null),
      };

      mockDb.selectFrom.mockReturnValueOnce(mockGroupQuery as any);
      mockDb.selectFrom.mockReturnValueOnce(mockPlayoffQuery as any);

      const result = await getBoostAllocationBreakdown('user-1', 'tournament-1', 'silver');

      expect(result.byGroup).toEqual([
        { groupLetter: 'A', count: 2 },
        { groupLetter: 'B', count: 1 },
      ]);
      expect(result.totalBoosts).toBe(3);
      expect(result.scoredGamesCount).toBe(2);
      expect(result.totalPointsEarned).toBe(5);
    });

    it('should separate playoff boosts from group boosts', async () => {
      const mockGroupResults = [
        { group_letter: 'A', count: 2, scored_games: 0, boost_bonus: 0 },
      ];

      const mockPlayoffResult = {
        count: 3,
        scored_games: 1,
        boost_bonus: 4,
      };

      const mockGroupQuery = {
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue(mockGroupResults),
      };

      const mockPlayoffQuery = {
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(mockPlayoffResult),
      };

      mockDb.selectFrom.mockReturnValueOnce(mockGroupQuery as any);
      mockDb.selectFrom.mockReturnValueOnce(mockPlayoffQuery as any);

      const result = await getBoostAllocationBreakdown('user-1', 'tournament-1', 'golden');

      expect(result.byGroup).toEqual([{ groupLetter: 'A', count: 2 }]);
      expect(result.playoffCount).toBe(3);
      expect(result.totalBoosts).toBe(5);
      expect(result.scoredGamesCount).toBe(1);
      expect(result.totalPointsEarned).toBe(4);
    });

    it('should handle mix of scored and unscored games', async () => {
      const mockGroupResults = [
        { group_letter: 'A', count: 3, scored_games: 2, boost_bonus: 5 },
        { group_letter: 'B', count: 2, scored_games: 0, boost_bonus: 0 },
      ];

      const mockPlayoffResult = {
        count: 1,
        scored_games: 1,
        boost_bonus: 3,
      };

      const mockGroupQuery = {
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue(mockGroupResults),
      };

      const mockPlayoffQuery = {
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(mockPlayoffResult),
      };

      mockDb.selectFrom.mockReturnValueOnce(mockGroupQuery as any);
      mockDb.selectFrom.mockReturnValueOnce(mockPlayoffQuery as any);

      const result = await getBoostAllocationBreakdown('user-1', 'tournament-1', 'silver');

      expect(result.totalBoosts).toBe(6); // 3 + 2 + 1
      expect(result.scoredGamesCount).toBe(3); // 2 + 0 + 1
      expect(result.totalPointsEarned).toBe(8); // 5 + 0 + 3
    });

    it('should return correct totals with only playoff boosts', async () => {
      const mockGroupQuery = {
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue([]),
      };

      const mockPlayoffResult = {
        count: 2,
        scored_games: 2,
        boost_bonus: 6,
      };

      const mockPlayoffQuery = {
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(mockPlayoffResult),
      };

      mockDb.selectFrom.mockReturnValueOnce(mockGroupQuery as any);
      mockDb.selectFrom.mockReturnValueOnce(mockPlayoffQuery as any);

      const result = await getBoostAllocationBreakdown('user-1', 'tournament-1', 'golden');

      expect(result.byGroup).toEqual([]);
      expect(result.playoffCount).toBe(2);
      expect(result.totalBoosts).toBe(2);
      expect(result.scoredGamesCount).toBe(2);
      expect(result.totalPointsEarned).toBe(6);
    });

    it('should handle null boost_bonus values', async () => {
      const mockGroupResults = [
        { group_letter: 'A', count: 2, scored_games: 1, boost_bonus: null },
      ];

      const mockPlayoffResult = {
        count: 1,
        scored_games: 0,
        boost_bonus: null,
      };

      const mockGroupQuery = {
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue(mockGroupResults),
      };

      const mockPlayoffQuery = {
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(mockPlayoffResult),
      };

      mockDb.selectFrom.mockReturnValueOnce(mockGroupQuery as any);
      mockDb.selectFrom.mockReturnValueOnce(mockPlayoffQuery as any);

      const result = await getBoostAllocationBreakdown('user-1', 'tournament-1', 'silver');

      expect(result.totalPointsEarned).toBe(0); // nulls treated as 0
    });

  });
});
