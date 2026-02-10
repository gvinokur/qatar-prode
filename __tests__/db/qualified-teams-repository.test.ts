import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  getGroupPositionsPrediction,
  getAllUserGroupPositionsPredictions,
  upsertGroupPositionsPrediction,
  deleteGroupPositionsPrediction,
  deleteAllGroupPositionsPredictions,
} from '../../app/db/qualified-teams-repository';
import { db } from '../../app/db/database';
import { createMockSelectQuery, createMockInsertQuery, createMockDeleteQuery } from './mock-helpers';

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

describe('Qualified Teams Repository', () => {
  const mockDb = vi.mocked(db);

  const mockGroupPrediction = {
    id: 'pred-1',
    user_id: 'user-1',
    tournament_id: 'tournament-1',
    group_id: 'group-a',
    team_predicted_positions: [
      { team_id: 'team-1', predicted_position: 1, predicted_to_qualify: true },
      { team_id: 'team-2', predicted_position: 2, predicted_to_qualify: true },
      { team_id: 'team-3', predicted_position: 3, predicted_to_qualify: true },
      { team_id: 'team-4', predicted_position: 4, predicted_to_qualify: false },
    ],
  };

  const mockAllGroupPredictions = [
    mockGroupPrediction,
    {
      id: 'pred-2',
      user_id: 'user-1',
      tournament_id: 'tournament-1',
      group_id: 'group-b',
      team_predicted_positions: [
        { team_id: 'team-5', predicted_position: 1, predicted_to_qualify: true },
        { team_id: 'team-6', predicted_position: 2, predicted_to_qualify: true },
      ],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getGroupPositionsPrediction', () => {
    it('should return prediction for specific group', async () => {
      const mockQuery = createMockSelectQuery(mockGroupPrediction);
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      const result = await getGroupPositionsPrediction('user-1', 'tournament-1', 'group-a');

      expect(mockDb.selectFrom).toHaveBeenCalledWith('tournament_user_group_positions_predictions');
      expect(result).toEqual(mockGroupPrediction);
    });

    it('should return null when no prediction exists', async () => {
      const mockQuery = createMockSelectQuery(null);
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      const result = await getGroupPositionsPrediction('user-1', 'tournament-1', 'group-a');

      expect(result).toBeNull();
    });
  });

  describe('getAllUserGroupPositionsPredictions', () => {
    it('should return all group predictions for user and tournament', async () => {
      const mockQuery = createMockSelectQuery(mockAllGroupPredictions, 'execute');
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      const result = await getAllUserGroupPositionsPredictions('user-1', 'tournament-1');

      expect(mockDb.selectFrom).toHaveBeenCalledWith('tournament_user_group_positions_predictions');
      expect(result).toEqual(mockAllGroupPredictions);
    });

    it('should return empty array when no predictions exist', async () => {
      const mockQuery = createMockSelectQuery([], 'execute');
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      const result = await getAllUserGroupPositionsPredictions('user-1', 'tournament-1');

      expect(result).toEqual([]);
    });
  });

  describe('upsertGroupPositionsPrediction', () => {
    const teamPositions = [
      { team_id: 'team-1', predicted_position: 1, predicted_to_qualify: true },
      { team_id: 'team-2', predicted_position: 2, predicted_to_qualify: true },
    ];

    it('should create new prediction when none exists', async () => {
      // Mock select query (no existing prediction)
      const mockSelectQuery = createMockSelectQuery(null);
      mockDb.selectFrom.mockReturnValue(mockSelectQuery as any);

      // Mock insert query
      const mockInsertQuery = createMockInsertQuery({ ...mockGroupPrediction, team_predicted_positions: teamPositions });
      mockDb.insertInto.mockReturnValue(mockInsertQuery as any);

      await upsertGroupPositionsPrediction('user-1', 'tournament-1', 'group-a', teamPositions);

      expect(mockDb.selectFrom).toHaveBeenCalled();
      expect(mockDb.insertInto).toHaveBeenCalledWith('tournament_user_group_positions_predictions');
    });

    it('should update existing prediction', async () => {
      // Mock select query (existing prediction found)
      const mockSelectQuery = createMockSelectQuery(mockGroupPrediction);
      mockDb.selectFrom.mockReturnValue(mockSelectQuery as any);

      // Mock update query
      const mockUpdateQuery = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returningAll: vi.fn().mockReturnThis(),
        executeTakeFirstOrThrow: vi.fn().mockResolvedValue({ ...mockGroupPrediction, team_predicted_positions: teamPositions }),
      };
      mockDb.updateTable.mockReturnValue(mockUpdateQuery as any);

      await upsertGroupPositionsPrediction('user-1', 'tournament-1', 'group-a', teamPositions);

      expect(mockDb.selectFrom).toHaveBeenCalled();
      expect(mockDb.updateTable).toHaveBeenCalledWith('tournament_user_group_positions_predictions');
    });

    it('should handle empty team positions array', async () => {
      const mockSelectQuery = createMockSelectQuery(null);
      mockDb.selectFrom.mockReturnValue(mockSelectQuery as any);

      const mockInsertQuery = createMockInsertQuery({ ...mockGroupPrediction, team_predicted_positions: [] });
      mockDb.insertInto.mockReturnValue(mockInsertQuery as any);

      await upsertGroupPositionsPrediction('user-1', 'tournament-1', 'group-a', []);

      expect(mockDb.insertInto).toHaveBeenCalled();
    });
  });

  describe('deleteGroupPositionsPrediction', () => {
    it('should delete prediction for specific group', async () => {
      const mockQuery = createMockDeleteQuery();
      mockDb.deleteFrom.mockReturnValue(mockQuery as any);

      await deleteGroupPositionsPrediction('user-1', 'tournament-1', 'group-a');

      expect(mockDb.deleteFrom).toHaveBeenCalledWith('tournament_user_group_positions_predictions');
    });
  });

  describe('deleteAllGroupPositionsPredictions', () => {
    it('should delete all predictions for user and tournament', async () => {
      const mockQuery = createMockDeleteQuery();
      mockDb.deleteFrom.mockReturnValue(mockQuery as any);

      await deleteAllGroupPositionsPredictions('user-1', 'tournament-1');

      expect(mockDb.deleteFrom).toHaveBeenCalledWith('tournament_user_group_positions_predictions');
    });
  });
});
