import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  findTournamentgroupById,
  findGroupsInTournament,
  findGroupsWithGamesAndTeamsInTournament,
  findTeamsInGroup,
  createTournamentGroup,
  createTournamentGroupTeam,
  createTournamentGroupGame,
  updateTournamentGroup,
  updateTournamentGroupTeams,
  updateTeamConductScores,
  deleteTournamentGroup,
  deleteAllGroupsFromTournament,
  deleteTournamentGroupTeams,
  deleteTournamentGroupGame,
} from '../../app/db/tournament-group-repository';
import { db } from '../../app/db/database';
import { testFactories } from './test-factories';
import { createMockSelectQuery, createMockInsertQuery, createMockUpdateQuery, createMockDeleteQuery } from './mock-helpers';

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

describe('Tournament Group Repository', () => {
  const mockDb = vi.mocked(db);
  const mockGroup = testFactories.tournamentGroup();
  const mockGroups = [
    testFactories.tournamentGroup({ id: 'group-1', group_letter: 'A' }),
    testFactories.tournamentGroup({ id: 'group-2', group_letter: 'B' }),
  ];
  const mockGroupTeam = testFactories.tournamentGroupTeam();
  const mockGroupGame = testFactories.tournamentGroupGame();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Base CRUD Functions', () => {
    describe('findTournamentgroupById', () => {
      it('should call base findById function', async () => {
        mockBaseFunctions.findById.mockResolvedValue(mockGroup);

        const result = await findTournamentgroupById('group-1');

        expect(mockBaseFunctions.findById).toHaveBeenCalledWith('group-1');
        expect(result).toEqual(mockGroup);
      });

      it('should return null when group not found', async () => {
        mockBaseFunctions.findById.mockResolvedValue(null);

        const result = await findTournamentgroupById('nonexistent');

        expect(result).toBeNull();
      });
    });

    describe('createTournamentGroup', () => {
      it('should call base create function', async () => {
        const newGroup = testFactories.tournamentGroup({ group_letter: 'C' });
        mockBaseFunctions.create.mockResolvedValue(newGroup);

        const result = await createTournamentGroup({
          tournament_id: 'tournament-1',
          group_letter: 'C',
          sort_by_games_between_teams: false,
        });

        expect(mockBaseFunctions.create).toHaveBeenCalledWith({
          tournament_id: 'tournament-1',
          group_letter: 'C',
          sort_by_games_between_teams: false,
        });
        expect(result).toEqual(newGroup);
      });
    });

    describe('updateTournamentGroup', () => {
      it('should call base update function', async () => {
        const updatedGroup = testFactories.tournamentGroup({ group_letter: 'Z' });
        mockBaseFunctions.update.mockResolvedValue(updatedGroup);

        const result = await updateTournamentGroup('group-1', { group_letter: 'Z' });

        expect(mockBaseFunctions.update).toHaveBeenCalledWith('group-1', { group_letter: 'Z' });
        expect(result).toEqual(updatedGroup);
      });
    });

    describe('deleteTournamentGroup', () => {
      it('should call base delete function', async () => {
        mockBaseFunctions.delete.mockResolvedValue(mockGroup);

        const result = await deleteTournamentGroup('group-1');

        expect(mockBaseFunctions.delete).toHaveBeenCalledWith('group-1');
        expect(result).toEqual(mockGroup);
      });
    });
  });

  describe('Group Team Functions', () => {
    describe('createTournamentGroupTeam', () => {
      it('should create tournament group team', async () => {
        const mockQuery = createMockInsertQuery(mockGroupTeam);
        mockDb.insertInto.mockReturnValue(mockQuery as any);

        const result = await createTournamentGroupTeam({
          tournament_group_id: 'group-1',
          team_id: 'team-1',
          position: 1,
        });

        expect(mockDb.insertInto).toHaveBeenCalledWith('tournament_group_teams');
        expect(mockQuery.values).toHaveBeenCalledWith({
          tournament_group_id: 'group-1',
          team_id: 'team-1',
          position: 1,
        });
        expect(mockQuery.returningAll).toHaveBeenCalled();
        expect(mockQuery.executeTakeFirstOrThrow).toHaveBeenCalled();
        expect(result).toEqual(mockGroupTeam);
      });

      it('should throw error when insert fails', async () => {
        const mockQuery = {
          values: vi.fn().mockReturnThis(),
          returningAll: vi.fn().mockReturnThis(),
          executeTakeFirstOrThrow: vi.fn().mockRejectedValue(new Error('Insert failed')),
        };
        mockDb.insertInto.mockReturnValue(mockQuery as any);

        await expect(createTournamentGroupTeam({
          tournament_group_id: 'group-1',
          team_id: 'team-1',
          position: 1,
        })).rejects.toThrow('Insert failed');
      });
    });

    describe('findTeamsInGroup', () => {
      it('should find teams ordered by position', async () => {
        const mockTeams = [
          testFactories.tournamentGroupTeam({ position: 1, team_id: 'team-1' }),
          testFactories.tournamentGroupTeam({ position: 2, team_id: 'team-2' }),
        ];
        const mockQuery = createMockSelectQuery(mockTeams);
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await findTeamsInGroup('group-1');

        expect(mockDb.selectFrom).toHaveBeenCalledWith('tournament_group_teams');
        expect(mockQuery.where).toHaveBeenCalledWith('tournament_group_id', '=', 'group-1');
        expect(mockQuery.orderBy).toHaveBeenCalledWith('position', 'asc');
        expect(mockQuery.selectAll).toHaveBeenCalled();
        expect(mockQuery.execute).toHaveBeenCalled();
        expect(result).toEqual(mockTeams);
      });

      it('should return empty array when group has no teams', async () => {
        const mockQuery = createMockSelectQuery([]);
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await findTeamsInGroup('empty-group');

        expect(result).toEqual([]);
      });
    });

    describe('updateTournamentGroupTeams', () => {
      it('should update multiple teams with Promise.all', async () => {
        const updates = [
          { team_id: 'team-1', tournament_group_id: 'group-1', position: 2 },
          { team_id: 'team-2', tournament_group_id: 'group-1', position: 1 },
        ];
        const mockQuery = createMockUpdateQuery(mockGroupTeam);
        mockDb.updateTable.mockReturnValue(mockQuery as any);

        const result = await updateTournamentGroupTeams(updates);

        expect(mockDb.updateTable).toHaveBeenCalledTimes(2);
        expect(mockQuery.where).toHaveBeenCalled();
        expect(mockQuery.set).toHaveBeenCalledWith({ position: 2 });
        expect(mockQuery.set).toHaveBeenCalledWith({ position: 1 });
        expect(result).toHaveLength(2);
      });

      it('should skip updates without team_id and tournament_group_id', async () => {
        const updates = [
          { position: 2 }, // missing team_id and tournament_group_id
        ];

        const result = await updateTournamentGroupTeams(updates as any);

        expect(mockDb.updateTable).not.toHaveBeenCalled();
        expect(result).toEqual([undefined]);
      });

      it('should handle empty array', async () => {
        const result = await updateTournamentGroupTeams([]);

        expect(mockDb.updateTable).not.toHaveBeenCalled();
        expect(result).toEqual([]);
      });
    });

    describe('updateTeamConductScores', () => {
      it('should update conduct scores for multiple teams', async () => {
        const conductScores = {
          'team-1': 5,
          'team-2': 3,
          'team-3': 0,
        };
        const mockQuery = createMockUpdateQuery(mockGroupTeam);
        mockDb.updateTable.mockReturnValue(mockQuery as any);

        await updateTeamConductScores(conductScores, 'group-1');

        expect(mockDb.updateTable).toHaveBeenCalledTimes(3);
        expect(mockQuery.set).toHaveBeenCalledWith({ conduct_score: 5 });
        expect(mockQuery.set).toHaveBeenCalledWith({ conduct_score: 3 });
        expect(mockQuery.set).toHaveBeenCalledWith({ conduct_score: 0 });
        expect(mockQuery.where).toHaveBeenCalledWith('team_id', '=', 'team-1');
        expect(mockQuery.where).toHaveBeenCalledWith('team_id', '=', 'team-2');
        expect(mockQuery.where).toHaveBeenCalledWith('team_id', '=', 'team-3');
        expect(mockQuery.where).toHaveBeenCalledWith('tournament_group_id', '=', 'group-1');
      });

      it('should handle empty conduct scores object', async () => {
        const result = await updateTeamConductScores({}, 'group-1');

        expect(mockDb.updateTable).not.toHaveBeenCalled();
        expect(result).toEqual([]);
      });

      it('should handle negative conduct scores', async () => {
        const conductScores = { 'team-1': -2 };
        const mockQuery = createMockUpdateQuery(mockGroupTeam);
        mockDb.updateTable.mockReturnValue(mockQuery as any);

        await updateTeamConductScores(conductScores, 'group-1');

        expect(mockQuery.set).toHaveBeenCalledWith({ conduct_score: -2 });
      });
    });

    describe('deleteTournamentGroupTeams', () => {
      it('should delete all teams from group', async () => {
        const mockQuery = createMockDeleteQuery([mockGroupTeam]);
        mockDb.deleteFrom.mockReturnValue(mockQuery as any);

        await deleteTournamentGroupTeams('group-1');

        expect(mockDb.deleteFrom).toHaveBeenCalledWith('tournament_group_teams');
        expect(mockQuery.where).toHaveBeenCalledWith('tournament_group_id', '=', 'group-1');
        expect(mockQuery.execute).toHaveBeenCalled();
      });

      it('should handle deleting from group with no teams', async () => {
        const mockQuery = createMockDeleteQuery([]);
        mockDb.deleteFrom.mockReturnValue(mockQuery as any);

        const result = await deleteTournamentGroupTeams('empty-group');

        expect(mockQuery.execute).toHaveBeenCalled();
        expect(result).toEqual([]);
      });
    });
  });

  describe('Group Game Functions', () => {
    describe('createTournamentGroupGame', () => {
      it('should create tournament group game', async () => {
        const mockQuery = createMockInsertQuery(mockGroupGame);
        mockDb.insertInto.mockReturnValue(mockQuery as any);

        const result = await createTournamentGroupGame({
          tournament_group_id: 'group-1',
          game_id: 'game-1',
        });

        expect(mockDb.insertInto).toHaveBeenCalledWith('tournament_group_games');
        expect(mockQuery.values).toHaveBeenCalledWith({
          tournament_group_id: 'group-1',
          game_id: 'game-1',
        });
        expect(mockQuery.returningAll).toHaveBeenCalled();
        expect(mockQuery.executeTakeFirstOrThrow).toHaveBeenCalled();
        expect(result).toEqual(mockGroupGame);
      });

      it('should throw error when insert fails', async () => {
        const mockQuery = {
          values: vi.fn().mockReturnThis(),
          returningAll: vi.fn().mockReturnThis(),
          executeTakeFirstOrThrow: vi.fn().mockRejectedValue(new Error('Insert failed')),
        };
        mockDb.insertInto.mockReturnValue(mockQuery as any);

        await expect(createTournamentGroupGame({
          tournament_group_id: 'group-1',
          game_id: 'game-1',
        })).rejects.toThrow('Insert failed');
      });
    });

    describe('deleteTournamentGroupGame', () => {
      it('should delete tournament group game by game_id', async () => {
        const mockQuery = createMockDeleteQuery([mockGroupGame]);
        mockDb.deleteFrom.mockReturnValue(mockQuery as any);

        await deleteTournamentGroupGame('game-1');

        expect(mockDb.deleteFrom).toHaveBeenCalledWith('tournament_group_games');
        expect(mockQuery.where).toHaveBeenCalledWith('game_id', '=', 'game-1');
        expect(mockQuery.execute).toHaveBeenCalled();
      });

      it('should handle deleting nonexistent game', async () => {
        const mockQuery = createMockDeleteQuery([]);
        mockDb.deleteFrom.mockReturnValue(mockQuery as any);

        const result = await deleteTournamentGroupGame('nonexistent-game');

        expect(mockQuery.execute).toHaveBeenCalled();
        expect(result).toEqual([]);
      });
    });
  });

  describe('Group Query Functions', () => {
    describe('findGroupsInTournament', () => {
      it('should find all groups for tournament', async () => {
        const mockQuery = createMockSelectQuery(mockGroups);
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await findGroupsInTournament('tournament-1');

        expect(mockDb.selectFrom).toHaveBeenCalledWith('tournament_groups');
        expect(mockQuery.where).toHaveBeenCalledWith('tournament_id', '=', 'tournament-1');
        expect(mockQuery.selectAll).toHaveBeenCalled();
        expect(mockQuery.execute).toHaveBeenCalled();
        expect(result).toEqual(mockGroups);
      });

      it('should return empty array when tournament has no groups', async () => {
        const mockQuery = createMockSelectQuery([]);
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await findGroupsInTournament('empty-tournament');

        expect(result).toEqual([]);
      });
    });

    describe('findGroupsWithGamesAndTeamsInTournament', () => {
      it('should find groups with nested games and teams using jsonArrayFrom', async () => {
        const mockGroupsWithNested = mockGroups.map(g => ({
          ...g,
          games: [{ game_id: 'game-1' }, { game_id: 'game-2' }],
          teams: [{ team_id: 'team-1' }, { team_id: 'team-2' }],
        }));
        const mockQuery = {
          where: vi.fn().mockReturnThis(),
          selectAll: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue(mockGroupsWithNested),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await findGroupsWithGamesAndTeamsInTournament('tournament-1');

        expect(mockDb.selectFrom).toHaveBeenCalledWith('tournament_groups');
        expect(mockQuery.where).toHaveBeenCalledWith('tournament_id', '=', 'tournament-1');
        expect(mockQuery.selectAll).toHaveBeenCalled();
        expect(mockQuery.select).toHaveBeenCalledWith(expect.any(Function));
        expect(mockQuery.execute).toHaveBeenCalled();
        expect(result).toEqual(mockGroupsWithNested);
      });

      it('should return groups with empty games and teams arrays when no nested data', async () => {
        const mockGroupsEmpty = mockGroups.map(g => ({
          ...g,
          games: [],
          teams: [],
        }));
        const mockQuery = {
          where: vi.fn().mockReturnThis(),
          selectAll: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue(mockGroupsEmpty),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await findGroupsWithGamesAndTeamsInTournament('tournament-1');

        expect(result).toEqual(mockGroupsEmpty);
      });

      it('should return empty array when tournament has no groups', async () => {
        const mockQuery = {
          where: vi.fn().mockReturnThis(),
          selectAll: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue([]),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await findGroupsWithGamesAndTeamsInTournament('empty-tournament');

        expect(result).toEqual([]);
      });
    });

    describe('deleteAllGroupsFromTournament', () => {
      it('should cascade delete all groups and their teams', async () => {
        // Mock findGroupsInTournament to return test groups
        const mockQuery = createMockSelectQuery(mockGroups);
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        // Mock delete teams query
        const mockDeleteQuery = createMockDeleteQuery([]);
        mockDb.deleteFrom.mockReturnValue(mockDeleteQuery as any);

        // Mock deleteTournamentGroup (base function)
        mockBaseFunctions.delete.mockResolvedValue(mockGroup);

        await deleteAllGroupsFromTournament('tournament-1');

        expect(mockDb.deleteFrom).toHaveBeenCalledWith('tournament_group_teams');
        expect(mockDeleteQuery.where).toHaveBeenCalledWith('tournament_group_id', '=', 'group-1');
        expect(mockDeleteQuery.where).toHaveBeenCalledWith('tournament_group_id', '=', 'group-2');
        expect(mockBaseFunctions.delete).toHaveBeenCalledWith('group-1');
        expect(mockBaseFunctions.delete).toHaveBeenCalledWith('group-2');
      });

      it('should handle tournament with no groups', async () => {
        // Mock findGroupsInTournament to return empty array
        const mockQuery = createMockSelectQuery([]);
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await deleteAllGroupsFromTournament('empty-tournament');

        expect(mockDb.deleteFrom).not.toHaveBeenCalled();
        expect(mockBaseFunctions.delete).not.toHaveBeenCalled();
        expect(result).toEqual([]);
      });

      it('should handle errors during cascade delete', async () => {
        // Mock findGroupsInTournament to return test groups
        const mockQueryFind = createMockSelectQuery(mockGroups);
        mockDb.selectFrom.mockReturnValue(mockQueryFind as any);

        // Mock delete to throw error
        const mockDeleteQuery = {
          where: vi.fn().mockReturnThis(),
          execute: vi.fn().mockRejectedValue(new Error('Delete failed')),
        };
        mockDb.deleteFrom.mockReturnValue(mockDeleteQuery as any);

        await expect(deleteAllGroupsFromTournament('tournament-1')).rejects.toThrow('Delete failed');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle database connection errors', async () => {
      // Clear all previous mocks first
      vi.clearAllMocks();

      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        selectAll: vi.fn().mockReturnThis(),
        execute: vi.fn().mockRejectedValue(new Error('Connection lost')),
      };
      mockDb.selectFrom.mockReturnValueOnce(mockQuery as any);

      await expect(findGroupsInTournament('tournament-1')).rejects.toThrow('Connection lost');
    });

    it('should handle special characters in group letters', async () => {
      const groupWithSpecialLetter = testFactories.tournamentGroup({ group_letter: 'A*' });
      mockBaseFunctions.create.mockResolvedValue(groupWithSpecialLetter);

      const result = await createTournamentGroup({
        tournament_id: 'tournament-1',
        group_letter: 'A*',
        sort_by_games_between_teams: false,
      });

      expect(result.group_letter).toBe('A*');
    });

    it('should handle zero position for teams', async () => {
      const mockQuery = createMockInsertQuery(mockGroupTeam);
      mockDb.insertInto.mockReturnValue(mockQuery as any);

      await createTournamentGroupTeam({
        tournament_group_id: 'group-1',
        team_id: 'team-1',
        position: 0,
      });

      expect(mockQuery.values).toHaveBeenCalledWith({
        tournament_group_id: 'group-1',
        team_id: 'team-1',
        position: 0,
      });
    });

    it('should handle large conduct score values', async () => {
      const conductScores = { 'team-1': 999 };
      const mockQuery = createMockUpdateQuery(mockGroupTeam);
      mockDb.updateTable.mockReturnValue(mockQuery as any);

      await updateTeamConductScores(conductScores, 'group-1');

      expect(mockQuery.set).toHaveBeenCalledWith({ conduct_score: 999 });
    });
  });
});
