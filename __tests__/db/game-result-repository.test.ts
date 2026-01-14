import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  createGameResult,
  updateGameResult,
  findGameResultByGameId,
  findGameResultByGameIds,
} from '../../app/db/game-result-repository';
import { db } from '../../app/db/database';
import { testFactories } from './test-factories';
import { createMockSelectQuery, createMockInsertQuery, createMockUpdateQuery } from './mock-helpers';

// Mock the database
vi.mock('../../app/db/database', () => ({
  db: {
    selectFrom: vi.fn(),
    insertInto: vi.fn(),
    updateTable: vi.fn(),
    deleteFrom: vi.fn(),
  },
}));

// Mock React cache
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    cache: vi.fn((fn) => fn),
  };
});

describe('Game Result Repository', () => {
  const mockDb = vi.mocked(db);
  const mockGameResult = testFactories.gameResult();
  const mockGameResults = [
    testFactories.gameResult({ game_id: 'game-1', home_score: 2, away_score: 1, is_draft: false }),
    testFactories.gameResult({ game_id: 'game-2', home_score: 1, away_score: 1, is_draft: false }),
    testFactories.gameResult({ game_id: 'game-3', home_score: 0, away_score: 3, is_draft: true }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createGameResult', () => {
    it('should create game result', async () => {
      const newResult = {
        game_id: 'game-1',
        home_score: 2,
        away_score: 1,
        home_penalty_score: undefined,
        away_penalty_score: undefined,
        is_draft: false,
      };
      const mockQuery = createMockInsertQuery(mockGameResult);
      mockDb.insertInto.mockReturnValue(mockQuery as any);

      const result = await createGameResult(newResult);

      expect(mockDb.insertInto).toHaveBeenCalledWith('game_results');
      expect(mockQuery.values).toHaveBeenCalledWith(newResult);
      expect(mockQuery.returningAll).toHaveBeenCalled();
      expect(mockQuery.executeTakeFirstOrThrow).toHaveBeenCalled();
      expect(result).toEqual(mockGameResult);
    });

    it('should create game result with penalty scores', async () => {
      const newResultWithPenalties = {
        game_id: 'game-1',
        home_score: 1,
        away_score: 1,
        home_penalty_score: 4,
        away_penalty_score: 3,
        is_draft: false,
      };
      const mockQuery = createMockInsertQuery({ ...mockGameResult, ...newResultWithPenalties });
      mockDb.insertInto.mockReturnValue(mockQuery as any);

      const result = await createGameResult(newResultWithPenalties);

      expect(mockQuery.values).toHaveBeenCalledWith(newResultWithPenalties);
      expect(result.home_penalty_score).toBe(4);
      expect(result.away_penalty_score).toBe(3);
    });

    it('should create draft game result', async () => {
      const draftResult = {
        game_id: 'game-1',
        home_score: 0,
        away_score: 0,
        home_penalty_score: undefined,
        away_penalty_score: undefined,
        is_draft: true,
      };
      const mockQuery = createMockInsertQuery({ ...mockGameResult, is_draft: true });
      mockDb.insertInto.mockReturnValue(mockQuery as any);

      const result = await createGameResult(draftResult);

      expect(mockQuery.values).toHaveBeenCalledWith(draftResult);
      expect(result.is_draft).toBe(true);
    });

    it('should throw error when insert fails', async () => {
      const mockQuery = {
        values: vi.fn().mockReturnThis(),
        returningAll: vi.fn().mockReturnThis(),
        executeTakeFirstOrThrow: vi.fn().mockRejectedValue(new Error('Insert failed')),
      };
      mockDb.insertInto.mockReturnValue(mockQuery as any);

      await expect(createGameResult({
        game_id: 'game-1',
        home_score: 0,
        away_score: 0,
        is_draft: false,
      })).rejects.toThrow('Insert failed');
    });
  });

  describe('updateGameResult', () => {
    it('should update game result by game_id', async () => {
      const updates = {
        home_score: 3,
        away_score: 2,
        is_draft: false,
      };
      const updatedResult = { ...mockGameResult, ...updates };
      const mockQuery = createMockUpdateQuery(updatedResult);
      mockDb.updateTable.mockReturnValue(mockQuery as any);

      const result = await updateGameResult('game-1', updates);

      expect(mockDb.updateTable).toHaveBeenCalledWith('game_results');
      expect(mockQuery.where).toHaveBeenCalledWith('game_id', '=', 'game-1');
      expect(mockQuery.set).toHaveBeenCalledWith(updates);
      expect(mockQuery.returningAll).toHaveBeenCalled();
      expect(mockQuery.executeTakeFirst).toHaveBeenCalled();
      expect(result).toEqual(updatedResult);
    });

    it('should update penalty scores', async () => {
      const updates = {
        home_penalty_score: 5,
        away_penalty_score: 4,
      };
      const mockQuery = createMockUpdateQuery({ ...mockGameResult, ...updates });
      mockDb.updateTable.mockReturnValue(mockQuery as any);

      const result = await updateGameResult('game-1', updates);

      expect(mockQuery.set).toHaveBeenCalledWith(updates);
      expect(result.home_penalty_score).toBe(5);
      expect(result.away_penalty_score).toBe(4);
    });

    it('should update draft status', async () => {
      const updates = { is_draft: false };
      const mockQuery = createMockUpdateQuery({ ...mockGameResult, is_draft: false });
      mockDb.updateTable.mockReturnValue(mockQuery as any);

      const result = await updateGameResult('game-1', updates);

      expect(mockQuery.set).toHaveBeenCalledWith({ is_draft: false });
      expect(result.is_draft).toBe(false);
    });

    it('should return undefined when game not found', async () => {
      const mockQuery = createMockUpdateQuery(undefined);
      mockDb.updateTable.mockReturnValue(mockQuery as any);

      const result = await updateGameResult('nonexistent', { home_score: 1, away_score: 1 });

      expect(result).toBeUndefined();
    });

    it('should handle partial updates', async () => {
      const updates = { home_score: 5 };
      const mockQuery = createMockUpdateQuery({ ...mockGameResult, home_score: 5 });
      mockDb.updateTable.mockReturnValue(mockQuery as any);

      await updateGameResult('game-1', updates);

      expect(mockQuery.set).toHaveBeenCalledWith({ home_score: 5 });
    });
  });

  describe('findGameResultByGameId', () => {
    it('should find game result excluding drafts by default', async () => {
      const mockQuery = createMockSelectQuery(mockGameResult);
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      const result = await findGameResultByGameId('game-1');

      expect(mockDb.selectFrom).toHaveBeenCalledWith('game_results');
      expect(mockQuery.selectAll).toHaveBeenCalled();
      expect(mockQuery.where).toHaveBeenCalledWith('game_id', '=', 'game-1');
      expect(mockQuery.where).toHaveBeenCalledWith('is_draft', 'in', [false, false]);
      expect(mockQuery.executeTakeFirst).toHaveBeenCalled();
      expect(result).toEqual(mockGameResult);
    });

    it('should include drafts when includeDrafts is true', async () => {
      const draftResult = testFactories.gameResult({ is_draft: true });
      const mockQuery = createMockSelectQuery(draftResult);
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      const result = await findGameResultByGameId('game-1', true);

      expect(mockQuery.where).toHaveBeenCalledWith('game_id', '=', 'game-1');
      expect(mockQuery.where).toHaveBeenCalledWith('is_draft', 'in', [false, true]);
      expect(result).toEqual(draftResult);
    });

    it('should return undefined when result not found', async () => {
      const mockQuery = createMockSelectQuery(undefined);
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      const result = await findGameResultByGameId('nonexistent');

      expect(result).toBeUndefined();
    });

    it('should handle result with penalty scores', async () => {
      const resultWithPenalties = testFactories.gameResult({
        home_penalty_score: 5,
        away_penalty_score: 3,
      });
      const mockQuery = createMockSelectQuery(resultWithPenalties);
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      const result = await findGameResultByGameId('game-1');

      expect(result?.home_penalty_score).toBe(5);
      expect(result?.away_penalty_score).toBe(3);
    });
  });

  describe('findGameResultByGameIds', () => {
    it('should find multiple game results excluding drafts by default', async () => {
      const nonDraftResults = mockGameResults.filter(r => !r.is_draft);
      const mockQuery = createMockSelectQuery(nonDraftResults);
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      const result = await findGameResultByGameIds(['game-1', 'game-2']);

      expect(mockDb.selectFrom).toHaveBeenCalledWith('game_results');
      expect(mockQuery.selectAll).toHaveBeenCalled();
      expect(mockQuery.where).toHaveBeenCalledWith('game_id', 'in', ['game-1', 'game-2']);
      expect(mockQuery.where).toHaveBeenCalledWith('is_draft', 'in', [false, false]);
      expect(mockQuery.execute).toHaveBeenCalled();
      expect(result).toEqual(nonDraftResults);
    });

    it('should include drafts when includeDrafts is true', async () => {
      const mockQuery = createMockSelectQuery(mockGameResults);
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      const result = await findGameResultByGameIds(['game-1', 'game-2', 'game-3'], true);

      expect(mockQuery.where).toHaveBeenCalledWith('game_id', 'in', ['game-1', 'game-2', 'game-3']);
      expect(mockQuery.where).toHaveBeenCalledWith('is_draft', 'in', [false, true]);
      expect(result).toEqual(mockGameResults);
    });

    it('should return empty array when no results found', async () => {
      const mockQuery = createMockSelectQuery([]);
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      const result = await findGameResultByGameIds(['nonexistent-1', 'nonexistent-2']);

      expect(result).toEqual([]);
    });

    it('should handle single game ID in array', async () => {
      const mockQuery = createMockSelectQuery([mockGameResult]);
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      const result = await findGameResultByGameIds(['game-1']);

      expect(mockQuery.where).toHaveBeenCalledWith('game_id', 'in', ['game-1']);
      expect(result).toHaveLength(1);
    });

    it('should handle empty array of game IDs', async () => {
      const mockQuery = createMockSelectQuery([]);
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      const result = await findGameResultByGameIds([]);

      expect(mockQuery.where).toHaveBeenCalledWith('game_id', 'in', []);
      expect(result).toEqual([]);
    });

    it('should handle large number of game IDs', async () => {
      const manyGameIds = Array.from({ length: 50 }, (_, i) => `game-${i}`);
      const mockQuery = createMockSelectQuery([]);
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      await findGameResultByGameIds(manyGameIds);

      expect(mockQuery.where).toHaveBeenCalledWith('game_id', 'in', manyGameIds);
    });
  });

  describe('Draft Filtering Logic', () => {
    it('should filter out drafts when includeDrafts is false', async () => {
      const mockQuery = createMockSelectQuery(mockGameResult);
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      await findGameResultByGameId('game-1', false);

      expect(mockQuery.where).toHaveBeenCalledWith('is_draft', 'in', [false, false]);
    });

    it('should include both drafts and non-drafts when includeDrafts is true', async () => {
      const mockQuery = createMockSelectQuery(mockGameResults);
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      await findGameResultByGameIds(['game-1', 'game-3'], true);

      expect(mockQuery.where).toHaveBeenCalledWith('is_draft', 'in', [false, true]);
    });

    it('should use [false, false] as default draft filter', async () => {
      const mockQuery = createMockSelectQuery(mockGameResult);
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      // Call without includeDrafts parameter
      await findGameResultByGameId('game-1');

      expect(mockQuery.where).toHaveBeenCalledWith('is_draft', 'in', [false, false]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle database connection errors on create', async () => {
      const mockQuery = {
        values: vi.fn().mockReturnThis(),
        returningAll: vi.fn().mockReturnThis(),
        executeTakeFirstOrThrow: vi.fn().mockRejectedValue(new Error('Connection lost')),
      };
      mockDb.insertInto.mockReturnValue(mockQuery as any);

      await expect(createGameResult({
        game_id: 'game-1',
        home_score: 0,
        away_score: 0,
        is_draft: false,
      })).rejects.toThrow('Connection lost');
    });

    it('should handle database connection errors on find', async () => {
      vi.clearAllMocks();

      const mockQuery = {
        selectAll: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockRejectedValue(new Error('Connection lost')),
      };
      mockDb.selectFrom.mockReturnValueOnce(mockQuery as any);

      await expect(findGameResultByGameId('game-1')).rejects.toThrow('Connection lost');
    });

    it('should handle zero scores correctly', async () => {
      const zeroScoreResult = testFactories.gameResult({ home_score: 0, away_score: 0 });
      const mockQuery = createMockInsertQuery(zeroScoreResult);
      mockDb.insertInto.mockReturnValue(mockQuery as any);

      const result = await createGameResult({
        game_id: 'game-1',
        home_score: 0,
        away_score: 0,
        is_draft: false,
      });

      expect(result.home_score).toBe(0);
      expect(result.away_score).toBe(0);
    });

    it('should handle high score values', async () => {
      const highScoreResult = testFactories.gameResult({ home_score: 99, away_score: 88 });
      const mockQuery = createMockInsertQuery(highScoreResult);
      mockDb.insertInto.mockReturnValue(mockQuery as any);

      const result = await createGameResult({
        game_id: 'game-1',
        home_score: 99,
        away_score: 88,
        is_draft: false,
      });

      expect(result.home_score).toBe(99);
      expect(result.away_score).toBe(88);
    });

    it('should handle undefined penalty scores', async () => {
      const resultWithoutPenalties = testFactories.gameResult({
        home_penalty_score: undefined,
        away_penalty_score: undefined,
      });
      const mockQuery = createMockSelectQuery(resultWithoutPenalties);
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      const result = await findGameResultByGameId('game-1');

      expect(result?.home_penalty_score).toBeUndefined();
      expect(result?.away_penalty_score).toBeUndefined();
    });
  });

});
