import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  findQualificationPredictionById,
  createQualificationPrediction,
  updateQualificationPrediction,
  deleteQualificationPrediction,
  getQualificationPredictions,
  getQualificationPredictionsByGroup,
  countThirdPlaceQualifiers,
  upsertQualificationPrediction,
  batchUpsertQualificationPredictions,
  deleteAllQualificationPredictions,
  deleteQualificationPredictionsByGroup,
  getQualifiedTeamIds,
  getQualificationPredictionStats,
} from '../../app/db/qualified-teams-repository';
import { db } from '../../app/db/database';
import { testFactories } from './test-factories';

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

describe('Qualified Teams Repository', () => {
  const mockDb = vi.mocked(db);
  const mockPrediction = testFactories.qualifiedTeamPrediction();
  const mockPredictions = [
    testFactories.qualifiedTeamPrediction({
      id: 'pred-1',
      user_id: 'user-1',
      tournament_id: 'tournament-1',
      group_id: 'group-1',
      team_id: 'team-1',
      predicted_position: 1,
      predicted_to_qualify: true,
    }),
    testFactories.qualifiedTeamPrediction({
      id: 'pred-2',
      user_id: 'user-1',
      tournament_id: 'tournament-1',
      group_id: 'group-1',
      team_id: 'team-2',
      predicted_position: 2,
      predicted_to_qualify: true,
    }),
    testFactories.qualifiedTeamPrediction({
      id: 'pred-3',
      user_id: 'user-1',
      tournament_id: 'tournament-1',
      group_id: 'group-1',
      team_id: 'team-3',
      predicted_position: 3,
      predicted_to_qualify: true,
    }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Base CRUD Functions', () => {
    describe('findQualificationPredictionById', () => {
      it('should call base findById function', async () => {
        mockBaseFunctions.findById.mockResolvedValue(mockPrediction);

        const result = await findQualificationPredictionById('pred-1');

        expect(mockBaseFunctions.findById).toHaveBeenCalledWith('pred-1');
        expect(result).toEqual(mockPrediction);
      });
    });

    describe('createQualificationPrediction', () => {
      it('should call base create function', async () => {
        mockBaseFunctions.create.mockResolvedValue(mockPrediction);

        const newPrediction = {
          user_id: 'user-1',
          tournament_id: 'tournament-1',
          group_id: 'group-1',
          team_id: 'team-1',
          predicted_position: 1,
          predicted_to_qualify: true,
        };

        const result = await createQualificationPrediction(newPrediction);

        expect(mockBaseFunctions.create).toHaveBeenCalledWith(newPrediction);
        expect(result).toEqual(mockPrediction);
      });
    });

    describe('updateQualificationPrediction', () => {
      it('should call base update function', async () => {
        const updates = { predicted_position: 2, predicted_to_qualify: true };
        mockBaseFunctions.update.mockResolvedValue({ ...mockPrediction, ...updates });

        const result = await updateQualificationPrediction('pred-1', updates);

        expect(mockBaseFunctions.update).toHaveBeenCalledWith('pred-1', updates);
        expect(result.predicted_position).toBe(2);
      });
    });

    describe('deleteQualificationPrediction', () => {
      it('should call base delete function', async () => {
        mockBaseFunctions.delete.mockResolvedValue(mockPrediction);

        const result = await deleteQualificationPrediction('pred-1');

        expect(mockBaseFunctions.delete).toHaveBeenCalledWith('pred-1');
        expect(result).toEqual(mockPrediction);
      });
    });
  });

  describe('Query Functions', () => {
    describe('getQualificationPredictions', () => {
      it('should get all predictions for user and tournament', async () => {
        const mockQuery = {
          where: vi.fn().mockReturnThis(),
          selectAll: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue(mockPredictions),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await getQualificationPredictions('user-1', 'tournament-1');

        expect(mockDb.selectFrom).toHaveBeenCalledWith('tournament_qualified_teams_predictions');
        expect(mockQuery.where).toHaveBeenCalledWith('user_id', '=', 'user-1');
        expect(mockQuery.where).toHaveBeenCalledWith('tournament_id', '=', 'tournament-1');
        expect(mockQuery.orderBy).toHaveBeenCalledWith('group_id');
        expect(mockQuery.orderBy).toHaveBeenCalledWith('predicted_position');
        expect(result).toEqual(mockPredictions);
      });

      it('should return empty array when no predictions exist', async () => {
        const mockQuery = {
          where: vi.fn().mockReturnThis(),
          selectAll: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue([]),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await getQualificationPredictions('user-1', 'tournament-1');

        expect(result).toEqual([]);
      });
    });

    describe('getQualificationPredictionsByGroup', () => {
      it('should get predictions for specific group', async () => {
        const mockQuery = {
          where: vi.fn().mockReturnThis(),
          selectAll: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue(mockPredictions),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await getQualificationPredictionsByGroup('user-1', 'tournament-1', 'group-1');

        expect(mockDb.selectFrom).toHaveBeenCalledWith('tournament_qualified_teams_predictions');
        expect(mockQuery.where).toHaveBeenCalledWith('user_id', '=', 'user-1');
        expect(mockQuery.where).toHaveBeenCalledWith('tournament_id', '=', 'tournament-1');
        expect(mockQuery.where).toHaveBeenCalledWith('group_id', '=', 'group-1');
        expect(mockQuery.orderBy).toHaveBeenCalledWith('predicted_position');
        expect(result).toEqual(mockPredictions);
      });
    });

    describe('countThirdPlaceQualifiers', () => {
      it('should count third place qualifiers correctly', async () => {
        const mockQuery = {
          where: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          executeTakeFirstOrThrow: vi.fn().mockResolvedValue({ count: 3 }),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await countThirdPlaceQualifiers('user-1', 'tournament-1');

        expect(mockDb.selectFrom).toHaveBeenCalledWith('tournament_qualified_teams_predictions');
        expect(mockQuery.where).toHaveBeenCalledWith('user_id', '=', 'user-1');
        expect(mockQuery.where).toHaveBeenCalledWith('tournament_id', '=', 'tournament-1');
        expect(mockQuery.where).toHaveBeenCalledWith('predicted_position', '=', 3);
        expect(mockQuery.where).toHaveBeenCalledWith('predicted_to_qualify', '=', true);
        expect(result).toBe(3);
      });

      it('should return 0 when no third place qualifiers selected', async () => {
        const mockQuery = {
          where: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          executeTakeFirstOrThrow: vi.fn().mockResolvedValue({ count: 0 }),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await countThirdPlaceQualifiers('user-1', 'tournament-1');

        expect(result).toBe(0);
      });
    });
  });

  describe('Upsert Functions', () => {
    describe('upsertQualificationPrediction', () => {
      it('should create new prediction when none exists', async () => {
        // Mock select to return no existing prediction
        const mockSelectQuery = {
          where: vi.fn().mockReturnThis(),
          selectAll: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue(undefined),
        };
        mockDb.selectFrom.mockReturnValue(mockSelectQuery as any);

        mockBaseFunctions.create.mockResolvedValue(mockPrediction);

        const newPrediction = {
          user_id: 'user-1',
          tournament_id: 'tournament-1',
          group_id: 'group-1',
          team_id: 'team-1',
          predicted_position: 1,
          predicted_to_qualify: true,
        };

        const result = await upsertQualificationPrediction(newPrediction);

        expect(mockBaseFunctions.create).toHaveBeenCalledWith(newPrediction);
        expect(result).toEqual(mockPrediction);
      });

      it('should update existing prediction when one exists', async () => {
        const existingPrediction = { ...mockPrediction, predicted_position: 2 };

        // Mock select to return existing prediction
        const mockSelectQuery = {
          where: vi.fn().mockReturnThis(),
          selectAll: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue(existingPrediction),
        };
        mockDb.selectFrom.mockReturnValue(mockSelectQuery as any);

        // Mock update
        const mockUpdateQuery = {
          set: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          returningAll: vi.fn().mockReturnThis(),
          executeTakeFirstOrThrow: vi.fn().mockResolvedValue({ ...existingPrediction, predicted_position: 1 }),
        };
        mockDb.updateTable.mockReturnValue(mockUpdateQuery as any);

        const updateData = {
          user_id: 'user-1',
          tournament_id: 'tournament-1',
          group_id: 'group-1',
          team_id: 'team-1',
          predicted_position: 1,
          predicted_to_qualify: true,
        };

        const result = await upsertQualificationPrediction(updateData);

        expect(mockDb.updateTable).toHaveBeenCalledWith('tournament_qualified_teams_predictions');
        expect(mockUpdateQuery.where).toHaveBeenCalledWith('id', '=', existingPrediction.id);
        expect(result.predicted_position).toBe(1);
      });
    });

    describe('batchUpsertQualificationPredictions', () => {
      it('should handle empty array', async () => {
        await batchUpsertQualificationPredictions([]);

        expect(mockDb.selectFrom).not.toHaveBeenCalled();
        expect(mockBaseFunctions.create).not.toHaveBeenCalled();
      });

      it('should upsert multiple predictions', async () => {
        const predictions = [
          {
            user_id: 'user-1',
            tournament_id: 'tournament-1',
            group_id: 'group-1',
            team_id: 'team-1',
            predicted_position: 1,
            predicted_to_qualify: true,
          },
          {
            user_id: 'user-1',
            tournament_id: 'tournament-1',
            group_id: 'group-1',
            team_id: 'team-2',
            predicted_position: 2,
            predicted_to_qualify: true,
          },
        ];

        // Mock select to return no existing predictions
        const mockSelectQuery = {
          where: vi.fn().mockReturnThis(),
          selectAll: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue(undefined),
        };
        mockDb.selectFrom.mockReturnValue(mockSelectQuery as any);

        mockBaseFunctions.create.mockResolvedValue(mockPrediction);

        await batchUpsertQualificationPredictions(predictions);

        expect(mockBaseFunctions.create).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Delete Functions', () => {
    describe('deleteAllQualificationPredictions', () => {
      it('should delete all predictions for user and tournament', async () => {
        const mockQuery = {
          where: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue(undefined),
        };
        mockDb.deleteFrom.mockReturnValue(mockQuery as any);

        await deleteAllQualificationPredictions('user-1', 'tournament-1');

        expect(mockDb.deleteFrom).toHaveBeenCalledWith('tournament_qualified_teams_predictions');
        expect(mockQuery.where).toHaveBeenCalledWith('user_id', '=', 'user-1');
        expect(mockQuery.where).toHaveBeenCalledWith('tournament_id', '=', 'tournament-1');
      });
    });

    describe('deleteQualificationPredictionsByGroup', () => {
      it('should delete predictions for specific group', async () => {
        const mockQuery = {
          where: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue(undefined),
        };
        mockDb.deleteFrom.mockReturnValue(mockQuery as any);

        await deleteQualificationPredictionsByGroup('user-1', 'tournament-1', 'group-1');

        expect(mockDb.deleteFrom).toHaveBeenCalledWith('tournament_qualified_teams_predictions');
        expect(mockQuery.where).toHaveBeenCalledWith('user_id', '=', 'user-1');
        expect(mockQuery.where).toHaveBeenCalledWith('tournament_id', '=', 'tournament-1');
        expect(mockQuery.where).toHaveBeenCalledWith('group_id', '=', 'group-1');
      });
    });
  });

  describe('Helper Functions', () => {
    describe('getQualifiedTeamIds', () => {
      it('should separate direct and third place qualifiers', async () => {
        const mixedPredictions = [
          testFactories.qualifiedTeamPrediction({
            team_id: 'team-1',
            predicted_position: 1,
            predicted_to_qualify: true,
          }),
          testFactories.qualifiedTeamPrediction({
            team_id: 'team-2',
            predicted_position: 2,
            predicted_to_qualify: true,
          }),
          testFactories.qualifiedTeamPrediction({
            team_id: 'team-3',
            predicted_position: 3,
            predicted_to_qualify: true,
          }),
          testFactories.qualifiedTeamPrediction({
            team_id: 'team-4',
            predicted_position: 3,
            predicted_to_qualify: false,
          }),
        ];

        const mockQuery = {
          where: vi.fn().mockReturnThis(),
          selectAll: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue(mixedPredictions),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await getQualifiedTeamIds('user-1', 'tournament-1');

        expect(result.directQualifiers).toEqual(['team-1', 'team-2']);
        expect(result.thirdPlaceQualifiers).toEqual(['team-3']);
        expect(result.allQualifiedTeamIds).toEqual(['team-1', 'team-2', 'team-3']);
      });

      it('should return empty arrays when no predictions', async () => {
        const mockQuery = {
          where: vi.fn().mockReturnThis(),
          selectAll: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue([]),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await getQualifiedTeamIds('user-1', 'tournament-1');

        expect(result.directQualifiers).toEqual([]);
        expect(result.thirdPlaceQualifiers).toEqual([]);
        expect(result.allQualifiedTeamIds).toEqual([]);
      });
    });

    describe('getQualificationPredictionStats', () => {
      it('should return correct statistics', async () => {
        // Mock group count
        const mockGroupQuery = {
          where: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          executeTakeFirstOrThrow: vi.fn().mockResolvedValue({ count: 12 }),
        };

        // Mock tournament config
        const mockTournamentQuery = {
          where: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          executeTakeFirstOrThrow: vi.fn().mockResolvedValue({ max_third_place_qualifiers: 8 }),
        };

        // Mock predictions
        const mockPredictionsQuery = {
          where: vi.fn().mockReturnThis(),
          selectAll: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue([
            testFactories.qualifiedTeamPrediction({
              group_id: 'group-1',
              predicted_position: 1,
              predicted_to_qualify: true,
            }),
            testFactories.qualifiedTeamPrediction({
              group_id: 'group-1',
              predicted_position: 2,
              predicted_to_qualify: true,
            }),
            testFactories.qualifiedTeamPrediction({
              group_id: 'group-2',
              predicted_position: 1,
              predicted_to_qualify: true,
            }),
            testFactories.qualifiedTeamPrediction({
              group_id: 'group-2',
              predicted_position: 3,
              predicted_to_qualify: true,
            }),
          ]),
        };

        mockDb.selectFrom.mockImplementation((table: string) => {
          if (table === 'tournament_groups') return mockGroupQuery as any;
          if (table === 'tournaments') return mockTournamentQuery as any;
          if (table === 'tournament_qualified_teams_predictions') return mockPredictionsQuery as any;
          throw new Error(`Unexpected table: ${table}`);
        });

        const result = await getQualificationPredictionStats('user-1', 'tournament-1');

        expect(result.totalGroups).toBe(12);
        expect(result.predictedGroups).toBe(2); // 2 unique groups
        expect(result.totalDirectQualifiers).toBe(3); // 3 positions 1-2
        expect(result.predictedThirdPlace).toBe(1); // 1 third place selected
        expect(result.maxThirdPlace).toBe(8);
      });
    });
  });
});
