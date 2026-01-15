import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  findPLayerById,
  findPlayerByTeamAndTournament,
  findAllPlayersInTournamentWithTeamData,
  getPlayersInTournament,
  createPlayer,
  updatePlayer,
  deletePlayer,
  deleteAllPlayersInTournamentTeam,
  deleteAllPlayersInTournament,
} from '../../app/db/player-repository';
import { db } from '../../app/db/database';
import { testFactories } from './test-factories';
import { createMockSelectQuery, createMockDeleteQuery } from './mock-helpers';

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

describe('Player Repository', () => {
  const mockDb = vi.mocked(db);
  const mockPlayer = testFactories.player();
  const mockPlayers = [
    testFactories.player({ id: 'player-1', name: 'Lionel Messi' }),
    testFactories.player({ id: 'player-2', name: 'Cristiano Ronaldo' }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Base CRUD Functions', () => {
    describe('findPLayerById', () => {
      it('should call base findById function', async () => {
        mockBaseFunctions.findById.mockResolvedValue(mockPlayer);

        const result = await findPLayerById('player-1');

        expect(mockBaseFunctions.findById).toHaveBeenCalledWith('player-1');
        expect(result).toEqual(mockPlayer);
      });

      it('should return null when player not found', async () => {
        mockBaseFunctions.findById.mockResolvedValue(null);

        const result = await findPLayerById('nonexistent');

        expect(result).toBeNull();
      });
    });

    describe('createPlayer', () => {
      it('should call base create function', async () => {
        const newPlayer = testFactories.player({ name: 'New Player' });
        mockBaseFunctions.create.mockResolvedValue(newPlayer);

        const result = await createPlayer({
          team_id: 'team-1',
          tournament_id: 'tournament-1',
          name: 'New Player',
          position: 'Forward',
          age_at_tournament: 25,
        });

        expect(mockBaseFunctions.create).toHaveBeenCalledWith({
          team_id: 'team-1',
          tournament_id: 'tournament-1',
          name: 'New Player',
          position: 'Forward',
          age_at_tournament: 25,
        });
        expect(result).toEqual(newPlayer);
      });
    });

    describe('updatePlayer', () => {
      it('should call base update function', async () => {
        const updatedPlayer = testFactories.player({ name: 'Updated Name' });
        mockBaseFunctions.update.mockResolvedValue(updatedPlayer);

        const result = await updatePlayer('player-1', { name: 'Updated Name' });

        expect(mockBaseFunctions.update).toHaveBeenCalledWith('player-1', { name: 'Updated Name' });
        expect(result).toEqual(updatedPlayer);
      });
    });

    describe('deletePlayer', () => {
      it('should call base delete function', async () => {
        mockBaseFunctions.delete.mockResolvedValue(mockPlayer);

        const result = await deletePlayer('player-1');

        expect(mockBaseFunctions.delete).toHaveBeenCalledWith('player-1');
        expect(result).toEqual(mockPlayer);
      });
    });
  });

  describe('Custom Query Functions', () => {
    describe('findPlayerByTeamAndTournament', () => {
      it('should find player with multiple where conditions', async () => {
        const mockQuery = createMockSelectQuery(mockPlayer);
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await findPlayerByTeamAndTournament('tournament-1', 'team-1', 'Lionel Messi');

        expect(mockDb.selectFrom).toHaveBeenCalledWith('players');
        expect(mockQuery.selectAll).toHaveBeenCalled();
        expect(mockQuery.where).toHaveBeenCalledWith('tournament_id', '=', 'tournament-1');
        expect(mockQuery.where).toHaveBeenCalledWith('team_id', '=', 'team-1');
        expect(mockQuery.where).toHaveBeenCalledWith('name', '=', 'Lionel Messi');
        expect(mockQuery.executeTakeFirst).toHaveBeenCalled();
        expect(result).toEqual(mockPlayer);
      });

      it('should return null when player not found', async () => {
        const mockQuery = createMockSelectQuery(null);
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await findPlayerByTeamAndTournament('tournament-1', 'team-1', 'Nonexistent Player');

        expect(result).toBeNull();
      });

      it('should handle special characters in player name', async () => {
        const mockQuery = createMockSelectQuery(mockPlayer);
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        await findPlayerByTeamAndTournament('tournament-1', 'team-1', "N'Golo Kanté");

        expect(mockQuery.where).toHaveBeenCalledWith('name', '=', "N'Golo Kanté");
      });
    });

    describe('findAllPlayersInTournamentWithTeamData', () => {
      it('should find players with team data using jsonObjectFrom', async () => {
        const mockPlayersWithTeam = mockPlayers.map(p => ({
          ...p,
          team: testFactories.team(),
        }));
        const mockQuery = {
          where: vi.fn().mockReturnThis(),
          selectAll: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue(mockPlayersWithTeam),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await findAllPlayersInTournamentWithTeamData('tournament-1');

        expect(mockDb.selectFrom).toHaveBeenCalledWith('players');
        expect(mockQuery.where).toHaveBeenCalledWith('players.tournament_id', '=', 'tournament-1');
        expect(mockQuery.selectAll).toHaveBeenCalled();
        expect(mockQuery.select).toHaveBeenCalledWith(expect.any(Function));
        expect(mockQuery.execute).toHaveBeenCalled();
        expect(result).toEqual(mockPlayersWithTeam);
      });

      it('should return empty array when tournament has no players', async () => {
        const mockQuery = {
          where: vi.fn().mockReturnThis(),
          selectAll: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue([]),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await findAllPlayersInTournamentWithTeamData('empty-tournament');

        expect(result).toEqual([]);
      });
    });

    describe('getPlayersInTournament', () => {
      it('should count players in tournament', async () => {
        const mockQuery = {
          where: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue({ players_in_tournament: 23 }),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await getPlayersInTournament('tournament-1');

        expect(mockDb.selectFrom).toHaveBeenCalledWith('players');
        expect(mockQuery.where).toHaveBeenCalledWith('players.tournament_id', '=', 'tournament-1');
        expect(mockQuery.select).toHaveBeenCalledWith(expect.any(Function));
        expect(mockQuery.executeTakeFirst).toHaveBeenCalled();
        expect(result).toBe(23);
      });

      it('should return 0 when no players in tournament', async () => {
        const mockQuery = {
          where: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue({ players_in_tournament: 0 }),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await getPlayersInTournament('empty-tournament');

        expect(result).toBe(0);
      });

      it('should return 0 when query returns null', async () => {
        const mockQuery = {
          where: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue(null),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await getPlayersInTournament('empty-tournament');

        expect(result).toBe(0);
      });

      it('should return 0 when query returns undefined players_in_tournament', async () => {
        const mockQuery = {
          where: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue({}),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await getPlayersInTournament('empty-tournament');

        expect(result).toBe(0);
      });
    });

    describe('deleteAllPlayersInTournamentTeam', () => {
      it('should delete all players for tournament and team', async () => {
        const mockQuery = createMockDeleteQuery([mockPlayer]);
        mockDb.deleteFrom.mockReturnValue(mockQuery as any);

        await deleteAllPlayersInTournamentTeam('tournament-1', 'team-1');

        expect(mockDb.deleteFrom).toHaveBeenCalledWith('players');
        expect(mockQuery.where).toHaveBeenCalledWith('tournament_id', '=', 'tournament-1');
        expect(mockQuery.where).toHaveBeenCalledWith('team_id', '=', 'team-1');
        expect(mockQuery.execute).toHaveBeenCalled();
      });

      it('should handle deleting from team with no players', async () => {
        const mockQuery = createMockDeleteQuery([]);
        mockDb.deleteFrom.mockReturnValue(mockQuery as any);

        const result = await deleteAllPlayersInTournamentTeam('tournament-1', 'empty-team');

        expect(mockQuery.execute).toHaveBeenCalled();
        expect(result).toEqual([]);
      });
    });

    describe('deleteAllPlayersInTournament', () => {
      it('should delete all players for a tournament', async () => {
        const mockQuery = createMockDeleteQuery(mockPlayers);
        mockDb.deleteFrom.mockReturnValue(mockQuery as any);

        await deleteAllPlayersInTournament('tournament-1');

        expect(mockDb.deleteFrom).toHaveBeenCalledWith('players');
        expect(mockQuery.where).toHaveBeenCalledWith('tournament_id', '=', 'tournament-1');
        expect(mockQuery.execute).toHaveBeenCalled();
      });

      it('should handle deleting from tournament with no players', async () => {
        const mockQuery = createMockDeleteQuery([]);
        mockDb.deleteFrom.mockReturnValue(mockQuery as any);

        const result = await deleteAllPlayersInTournament('empty-tournament');

        expect(mockQuery.execute).toHaveBeenCalled();
        expect(result).toEqual([]);
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

      await expect(findPlayerByTeamAndTournament('t1', 'team1', 'Player')).rejects.toThrow('Connection lost');
    });

    it('should handle invalid tournament ID gracefully', async () => {
      const mockQuery = createMockSelectQuery(null);
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      const result = await findPlayerByTeamAndTournament('', 'team-1', 'Player');

      expect(mockQuery.where).toHaveBeenCalledWith('tournament_id', '=', '');
      expect(result).toBeNull();
    });
  });
});
