import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  findTeamById,
  getTeamByName,
  findTeamInTournament,
  findTeamInGroup,
  findGuessedQualifiedTeams,
  findQualifiedTeams,
  createTeam,
  updateTeam,
  deleteTeam,
} from '../../app/db/team-repository';
import { db } from '../../app/db/database';
import { testFactories } from './test-factories';
import { createMockSelectQuery } from './mock-helpers';

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

describe('Team Repository', () => {
  const mockDb = vi.mocked(db);
  const mockTeam = testFactories.team();
  const mockTeams = [
    testFactories.team({ id: 'team-1', name: 'Argentina' }),
    testFactories.team({ id: 'team-2', name: 'Brazil' }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Base CRUD Functions', () => {
    describe('findTeamById', () => {
      it('should call base findById function', async () => {
        mockBaseFunctions.findById.mockResolvedValue(mockTeam);

        const result = await findTeamById('team-1');

        expect(mockBaseFunctions.findById).toHaveBeenCalledWith('team-1');
        expect(result).toEqual(mockTeam);
      });

      it('should return null when team not found', async () => {
        mockBaseFunctions.findById.mockResolvedValue(null);

        const result = await findTeamById('nonexistent');

        expect(result).toBeNull();
      });
    });

    describe('createTeam', () => {
      it('should call base create function', async () => {
        const newTeam = testFactories.team({ name: 'New Team' });
        mockBaseFunctions.create.mockResolvedValue(newTeam);

        const result = await createTeam({
          name: 'New Team',
          short_name: 'NEW',
        });

        expect(mockBaseFunctions.create).toHaveBeenCalledWith({
          name: 'New Team',
          short_name: 'NEW',
        });
        expect(result).toEqual(newTeam);
      });
    });

    describe('updateTeam', () => {
      it('should call base update function', async () => {
        const updatedTeam = testFactories.team({ name: 'Updated Name' });
        mockBaseFunctions.update.mockResolvedValue(updatedTeam);

        const result = await updateTeam('team-1', { name: 'Updated Name' });

        expect(mockBaseFunctions.update).toHaveBeenCalledWith('team-1', { name: 'Updated Name' });
        expect(result).toEqual(updatedTeam);
      });
    });

    describe('deleteTeam', () => {
      it('should call base delete function', async () => {
        mockBaseFunctions.delete.mockResolvedValue(mockTeam);

        const result = await deleteTeam('team-1');

        expect(mockBaseFunctions.delete).toHaveBeenCalledWith('team-1');
        expect(result).toEqual(mockTeam);
      });
    });
  });

  describe('Simple Query Functions', () => {
    describe('getTeamByName', () => {
      it('should find team by name', async () => {
        const mockQuery = createMockSelectQuery(mockTeam);
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await getTeamByName('Argentina');

        expect(mockDb.selectFrom).toHaveBeenCalledWith('teams');
        expect(mockQuery.where).toHaveBeenCalledWith('name', '=', 'Argentina');
        expect(mockQuery.selectAll).toHaveBeenCalled();
        expect(mockQuery.executeTakeFirst).toHaveBeenCalled();
        expect(result).toEqual(mockTeam);
      });

      it('should return null when team with name not found', async () => {
        const mockQuery = createMockSelectQuery(null);
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await getTeamByName('Nonexistent Team');

        expect(result).toBeNull();
      });

      it('should handle special characters in team name', async () => {
        const mockQuery = createMockSelectQuery(mockTeam);
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        await getTeamByName("Côte d'Ivoire");

        expect(mockQuery.where).toHaveBeenCalledWith('name', '=', "Côte d'Ivoire");
      });
    });

    describe('findTeamInTournament', () => {
      it('should find teams in tournament with join', async () => {
        const mockQuery = {
          innerJoin: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          selectAll: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue(mockTeams),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await findTeamInTournament('tournament-1');

        expect(mockDb.selectFrom).toHaveBeenCalledWith('teams');
        expect(mockQuery.innerJoin).toHaveBeenCalledWith('tournament_teams', 'tournament_teams.team_id', 'teams.id');
        expect(mockQuery.where).toHaveBeenCalledWith('tournament_teams.tournament_id', '=', 'tournament-1');
        expect(mockQuery.selectAll).toHaveBeenCalledWith('teams');
        expect(mockQuery.execute).toHaveBeenCalled();
        expect(result).toEqual(mockTeams);
      });

      it('should return empty array when tournament has no teams', async () => {
        const mockQuery = {
          innerJoin: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          selectAll: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue([]),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await findTeamInTournament('empty-tournament');

        expect(result).toEqual([]);
      });
    });

    describe('findTeamInGroup', () => {
      it('should find teams in group with join', async () => {
        const mockQuery = {
          innerJoin: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          selectAll: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue(mockTeams),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await findTeamInGroup('group-1');

        expect(mockDb.selectFrom).toHaveBeenCalledWith('teams');
        expect(mockQuery.innerJoin).toHaveBeenCalledWith('tournament_group_teams', 'tournament_group_teams.team_id', 'teams.id');
        expect(mockQuery.where).toHaveBeenCalledWith('tournament_group_teams.tournament_group_id', '=', 'group-1');
        expect(mockQuery.selectAll).toHaveBeenCalledWith('teams');
        expect(mockQuery.execute).toHaveBeenCalled();
        expect(result).toEqual(mockTeams);
      });

      it('should return empty array when group has no teams', async () => {
        const mockQuery = {
          innerJoin: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          selectAll: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue([]),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await findTeamInGroup('empty-group');

        expect(result).toEqual([]);
      });
    });
  });

  describe('Complex Query Functions', () => {
    describe('findGuessedQualifiedTeams', () => {
      it('should find guessed qualified teams for tournament and user', async () => {
        const mockQuery = {
          selectAll: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          $if: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue(mockTeams),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await findGuessedQualifiedTeams('tournament-1', 'user-1');

        expect(mockDb.selectFrom).toHaveBeenCalledWith('teams');
        expect(mockQuery.selectAll).toHaveBeenCalled();
        expect(mockQuery.where).toHaveBeenCalledWith(expect.any(Function));
        expect(mockQuery.$if).toHaveBeenCalledWith(false, expect.any(Function));
        expect(mockQuery.execute).toHaveBeenCalled();
        expect(result).toEqual(mockTeams);
      });

      it('should find guessed qualified teams with group filter', async () => {
        const mockQuery = {
          selectAll: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          $if: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue(mockTeams),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await findGuessedQualifiedTeams('tournament-1', 'user-1', 'group-1');

        expect(mockDb.selectFrom).toHaveBeenCalledWith('teams');
        expect(mockQuery.$if).toHaveBeenCalledWith(true, expect.any(Function));
        expect(result).toEqual(mockTeams);
      });

      it('should return empty array when no guessed qualified teams', async () => {
        const mockQuery = {
          selectAll: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          $if: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue([]),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await findGuessedQualifiedTeams('tournament-1', 'user-1');

        expect(result).toEqual([]);
      });
    });

    describe('findQualifiedTeams', () => {
      it('should find qualified teams for tournament', async () => {
        // Mock group standings query (positions are 0-indexed in DB)
        const mockStandingsQuery = {
          innerJoin: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          $if: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue([
            { id: 'team-1', name: 'Team 1', short_name: 'T1', group_id: 'group-1', position: 0, is_complete: true },
            { id: 'team-2', name: 'Team 2', short_name: 'T2', group_id: 'group-1', position: 1, is_complete: true },
          ]),
        };

        // Mock playoff teams query (no playoffs yet)
        const mockPlayoffQuery = {
          where: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue([]),
        };

        mockDb.selectFrom
          .mockReturnValueOnce(mockStandingsQuery as any)
          .mockReturnValueOnce(mockPlayoffQuery as any);

        const result = await findQualifiedTeams('tournament-1');

        expect(mockDb.selectFrom).toHaveBeenCalledWith('tournament_group_teams');
        expect(mockDb.selectFrom).toHaveBeenCalledWith('games');
        expect(result).toEqual({
          teams: [
            { id: 'team-1', name: 'Team 1', short_name: 'T1', group_id: 'group-1', final_position: 1 },
            { id: 'team-2', name: 'Team 2', short_name: 'T2', group_id: 'group-1', final_position: 2 },
          ],
          completeGroupIds: new Set(['group-1']),
          allGroupsComplete: true,
        });
      });

      it('should find qualified teams with group filter', async () => {
        // Mock group standings query with group filter (positions are 0-indexed in DB)
        const mockStandingsQuery = {
          innerJoin: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          $if: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue([
            { id: 'team-1', name: 'Team 1', short_name: 'T1', group_id: 'group-1', position: 0, is_complete: true },
          ]),
        };

        // Mock playoff teams query
        const mockPlayoffQuery = {
          where: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue([]),
        };

        mockDb.selectFrom
          .mockReturnValueOnce(mockStandingsQuery as any)
          .mockReturnValueOnce(mockPlayoffQuery as any);

        const result = await findQualifiedTeams('tournament-1', 'group-1');

        expect(mockStandingsQuery.$if).toHaveBeenCalledWith(true, expect.any(Function));
        expect(result).toEqual({
          teams: [
            { id: 'team-1', name: 'Team 1', short_name: 'T1', group_id: 'group-1', final_position: 1 },
          ],
          completeGroupIds: new Set(['group-1']),
          allGroupsComplete: true,
        });
      });

      it('should return empty array when no qualified teams', async () => {
        // Mock group standings query (no complete groups)
        const mockStandingsQuery = {
          innerJoin: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          $if: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue([]),
        };

        // Mock playoff teams query
        const mockPlayoffQuery = {
          where: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue([]),
        };

        mockDb.selectFrom
          .mockReturnValueOnce(mockStandingsQuery as any)
          .mockReturnValueOnce(mockPlayoffQuery as any);

        const result = await findQualifiedTeams('tournament-1');

        expect(result).toEqual({
          teams: [],
          completeGroupIds: new Set(),
          allGroupsComplete: false,
        });
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle database connection errors', async () => {
      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        selectAll: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockRejectedValue(new Error('Connection lost')),
      };
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      await expect(getTeamByName('Test')).rejects.toThrow('Connection lost');
    });

    it('should handle null or undefined parameters gracefully', async () => {
      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        selectAll: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(null),
      };
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      const result = await getTeamByName('');

      expect(mockQuery.where).toHaveBeenCalledWith('name', '=', '');
      expect(result).toBeNull();
    });
  });
});
