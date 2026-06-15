import { vi, describe, it, expect, beforeEach } from 'vitest';
import { findRecentUnscoredGames } from '../../app/db/quick-score-repository';
import { db } from '../../app/db/database';
import { testFactories } from './test-factories';
import { createMockSelectQuery } from './mock-helpers';

vi.mock('../../app/db/database', () => ({
  db: {
    selectFrom: vi.fn(),
  },
}));

vi.mock('kysely/helpers/postgres', () => ({
  jsonObjectFrom: vi.fn().mockReturnValue({ as: vi.fn().mockReturnValue(null) }),
}));

vi.mock('kysely', async () => {
  const actual = await vi.importActual('kysely') as any;
  return {
    ...actual,
    sql: Object.assign(
      vi.fn().mockReturnValue({}),
      { raw: vi.fn().mockReturnValue({}) }
    ),
  };
});

describe('Quick Score Repository', () => {
  const mockDb = vi.mocked(db);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findRecentUnscoredGames', () => {
    it('returns empty array when no games exist in the 24h window', async () => {
      const mockQuery = createMockSelectQuery([]);
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      const result = await findRecentUnscoredGames(24);

      expect(result).toEqual([]);
      expect(mockQuery.execute).toHaveBeenCalled();
    });

    it('returns games from the given time window', async () => {
      const game = testFactories.game({ id: 'game-1' });
      const mockQuery = createMockSelectQuery([game]);
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      const result = await findRecentUnscoredGames(24);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('game-1');
    });

    it('calls selectFrom on games table', async () => {
      const mockQuery = createMockSelectQuery([]);
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      await findRecentUnscoredGames(24);

      expect(mockDb.selectFrom).toHaveBeenCalledWith('games');
    });

    it('applies leftJoin to filter out published results', async () => {
      const mockQuery = createMockSelectQuery([]);
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      await findRecentUnscoredGames(24);

      expect(mockQuery.leftJoin).toHaveBeenCalled();
    });

    it('orders results by game_date ascending', async () => {
      const mockQuery = createMockSelectQuery([]);
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      await findRecentUnscoredGames(24);

      expect(mockQuery.orderBy).toHaveBeenCalledWith('games.game_date', 'asc');
    });

    it('returns multiple games when available', async () => {
      const games = [
        testFactories.game({ id: 'game-1' }),
        testFactories.game({ id: 'game-2' }),
      ];
      const mockQuery = createMockSelectQuery(games);
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      const result = await findRecentUnscoredGames(24);

      expect(result).toHaveLength(2);
    });
  });
});
