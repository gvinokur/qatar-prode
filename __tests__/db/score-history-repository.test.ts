import { vi, describe, it, expect, beforeEach } from 'vitest';
import { writeScoreSnapshot, getScoreHistoryForUsers } from '../../app/db/score-history-repository';
import { db } from '../../app/db/database';
import { createMockSelectQuery, createMockInsertQuery } from './mock-helpers';

vi.mock('../../app/db/database', () => ({
  db: { selectFrom: vi.fn(), insertInto: vi.fn() },
}));

describe('Score History Repository', () => {
  const mockDb = vi.mocked(db);

  const mockHistory = {
    id: 'hist-1',
    user_id: 'user-1',
    tournament_id: 'tourn-1',
    snapshot_date: 20260610,
    total_game_score: 10,
    total_boost_bonus: 2,
    honor_roll_score: 5,
    individual_awards_score: 3,
    qualified_teams_score: 4,
    group_position_score: 1,
    total_points: 25,
    created_at: new Date('2026-06-10'),
  };

  const mockSnapshot = {
    user_id: 'user-1',
    tournament_id: 'tourn-1',
    snapshot_date: 20260610,
    total_game_score: 10,
    total_boost_bonus: 2,
    honor_roll_score: 5,
    individual_awards_score: 3,
    qualified_teams_score: 4,
    group_position_score: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('writeScoreSnapshot', () => {
    it('should create a row on first write (calls insertInto, onConflict, returningAll, executeTakeFirstOrThrow)', async () => {
      const mockQuery = createMockInsertQuery(mockHistory);
      mockDb.insertInto.mockReturnValue(mockQuery as any);

      const result = await writeScoreSnapshot(mockSnapshot);

      expect(mockDb.insertInto).toHaveBeenCalledWith('tournament_score_history');
      expect(mockQuery.values).toHaveBeenCalledWith(mockSnapshot);
      expect(mockQuery.onConflict).toHaveBeenCalled();
      expect(mockQuery.returningAll).toHaveBeenCalled();
      expect(mockQuery.executeTakeFirstOrThrow).toHaveBeenCalled();
      expect(result).toEqual(mockHistory);
    });

    it('should upsert (update all score fields) on second write for same date', async () => {
      const updatedHistory = { ...mockHistory, total_game_score: 20, total_boost_bonus: 4 };
      const updatedSnapshot = { ...mockSnapshot, total_game_score: 20, total_boost_bonus: 4 };
      const mockQuery = createMockInsertQuery(updatedHistory);
      mockDb.insertInto.mockReturnValue(mockQuery as any);

      const result = await writeScoreSnapshot(updatedSnapshot);

      expect(mockDb.insertInto).toHaveBeenCalledWith('tournament_score_history');
      expect(mockQuery.values).toHaveBeenCalledWith(updatedSnapshot);
      expect(mockQuery.onConflict).toHaveBeenCalled();
      expect(result).toEqual(updatedHistory);
    });

    it('should return value matching the mock', async () => {
      const mockQuery = createMockInsertQuery(mockHistory);
      mockDb.insertInto.mockReturnValue(mockQuery as any);

      const result = await writeScoreSnapshot(mockSnapshot);

      expect(result).toEqual(mockHistory);
      expect(result.total_points).toBe(25);
      expect(result.id).toBe('hist-1');
    });
  });

  describe('getScoreHistoryForUsers', () => {
    it('should return empty array when userIds is empty (no DB call)', async () => {
      const result = await getScoreHistoryForUsers([], 'tourn-1');

      expect(result).toEqual([]);
      expect(mockDb.selectFrom).not.toHaveBeenCalled();
    });

    it('should return rows ordered by snapshot_date ASC', async () => {
      const historyRows = [
        { ...mockHistory, snapshot_date: 20260601 },
        { ...mockHistory, id: 'hist-2', snapshot_date: 20260610 },
      ];
      const mockQuery = createMockSelectQuery(historyRows);
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      const result = await getScoreHistoryForUsers(['user-1'], 'tourn-1');

      expect(mockDb.selectFrom).toHaveBeenCalledWith('tournament_score_history');
      expect(mockQuery.where).toHaveBeenCalledWith('tournament_id', '=', 'tourn-1');
      expect(mockQuery.where).toHaveBeenCalledWith('user_id', 'in', ['user-1']);
      expect(mockQuery.orderBy).toHaveBeenCalledWith('snapshot_date', 'asc');
      expect(mockQuery.execute).toHaveBeenCalled();
      expect(result).toEqual(historyRows);
    });

    it('should filter by tournament_id (not return rows for a different tournament)', async () => {
      const mockQuery = createMockSelectQuery([mockHistory]);
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      await getScoreHistoryForUsers(['user-1'], 'tourn-1');

      expect(mockQuery.where).toHaveBeenCalledWith('tournament_id', '=', 'tourn-1');
      // Verify it is NOT querying with a different tournament id
      expect(mockQuery.where).not.toHaveBeenCalledWith('tournament_id', '=', 'tourn-2');
    });

    it('should query for all provided userIds', async () => {
      const mockQuery = createMockSelectQuery([]);
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      await getScoreHistoryForUsers(['user-1', 'user-2', 'user-3'], 'tourn-1');

      expect(mockQuery.where).toHaveBeenCalledWith('user_id', 'in', ['user-1', 'user-2', 'user-3']);
    });
  });
});
