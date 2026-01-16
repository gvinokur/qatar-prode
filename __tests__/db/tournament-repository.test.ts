import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  findTournamentById,
  findTournamentByName,
  findAllTournaments,
  findAllActiveTournaments,
  createTournament,
  updateTournament,
  deleteTournament,
  createTournamentTeam,
  deleteTournamentTeams,
} from '../../app/db/tournament-repository';
import { db } from '../../app/db/database';
import { testFactories } from './test-factories';
import { createMockSelectQuery, createMockInsertQuery, createMockUpdateQuery, createMockDeleteQuery, createMockBaseFunctions } from './mock-helpers';

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

// Mock environment utils
vi.mock('../../app/utils/environment-utils', () => ({
  isDevelopmentMode: vi.fn(() => false),
}));

describe('Tournament Repository', () => {
  const mockDb = vi.mocked(db);
  const mockTournament = testFactories.tournament();
  const mockTournaments = [
    testFactories.tournament({ id: 'tournament-1', long_name: 'FIFA 2026' }),
    testFactories.tournament({ id: 'tournament-2', long_name: 'Copa America 2024' }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Base CRUD Functions', () => {
    describe('findTournamentById', () => {
      it('should call base findById function', async () => {
        mockBaseFunctions.findById.mockResolvedValue(mockTournament);

        const result = await findTournamentById('tournament-1');

        expect(mockBaseFunctions.findById).toHaveBeenCalledWith('tournament-1');
        expect(result).toEqual(mockTournament);
      });

      it('should return null when tournament not found', async () => {
        mockBaseFunctions.findById.mockResolvedValue(null);

        const result = await findTournamentById('nonexistent');

        expect(result).toBeNull();
      });
    });

    describe('createTournament', () => {
      it('should call base create function', async () => {
        const newTournament = testFactories.tournament({ id: 'new-tournament' });
        mockBaseFunctions.create.mockResolvedValue(newTournament);

        const result = await createTournament({
          short_name: 'NEW',
          long_name: 'New Tournament',
          is_active: true,
        });

        expect(mockBaseFunctions.create).toHaveBeenCalledWith({
          short_name: 'NEW',
          long_name: 'New Tournament',
          is_active: true,
        });
        expect(result).toEqual(newTournament);
      });
    });

    describe('updateTournament', () => {
      it('should call base update function', async () => {
        const updatedTournament = testFactories.tournament({ long_name: 'Updated Name' });
        mockBaseFunctions.update.mockResolvedValue(updatedTournament);

        const result = await updateTournament('tournament-1', { long_name: 'Updated Name' });

        expect(mockBaseFunctions.update).toHaveBeenCalledWith('tournament-1', { long_name: 'Updated Name' });
        expect(result).toEqual(updatedTournament);
      });
    });

    describe('deleteTournament', () => {
      it('should call base delete function', async () => {
        mockBaseFunctions.delete.mockResolvedValue(mockTournament);

        const result = await deleteTournament('tournament-1');

        expect(mockBaseFunctions.delete).toHaveBeenCalledWith('tournament-1');
        expect(result).toEqual(mockTournament);
      });
    });
  });

  describe('Custom Query Functions', () => {
    describe('findTournamentByName', () => {
      it('should find tournament by long_name', async () => {
        const mockQuery = createMockSelectQuery(mockTournament);
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await findTournamentByName('FIFA 2026');

        expect(mockDb.selectFrom).toHaveBeenCalledWith('tournaments');
        expect(mockQuery.where).toHaveBeenCalledWith('long_name', '=', 'FIFA 2026');
        expect(mockQuery.selectAll).toHaveBeenCalled();
        expect(mockQuery.executeTakeFirst).toHaveBeenCalled();
        expect(result).toEqual(mockTournament);
      });

      it('should return null when tournament with name not found', async () => {
        const mockQuery = createMockSelectQuery(null);
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await findTournamentByName('Nonexistent Tournament');

        expect(result).toBeNull();
      });
    });

    describe('findAllTournaments', () => {
      it('should return all tournaments', async () => {
        const mockQuery = createMockSelectQuery(mockTournaments);
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await findAllTournaments();

        expect(mockDb.selectFrom).toHaveBeenCalledWith('tournaments');
        expect(mockQuery.selectAll).toHaveBeenCalled();
        expect(mockQuery.execute).toHaveBeenCalled();
        expect(result).toEqual(mockTournaments);
      });

      it('should return empty array when no tournaments exist', async () => {
        const mockQuery = createMockSelectQuery([]);
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await findAllTournaments();

        expect(result).toEqual([]);
      });
    });

    describe('findAllActiveTournaments', () => {
      it('should find active tournaments excluding dev_only in production', async () => {
        const { isDevelopmentMode } = await import('../../app/utils/environment-utils');
        vi.mocked(isDevelopmentMode).mockReturnValue(false);

        const mockWhere = vi.fn().mockReturnThis();
        const mockQuery = {
          where: mockWhere,
          selectAll: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue(mockTournaments),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await findAllActiveTournaments();

        expect(mockDb.selectFrom).toHaveBeenCalledWith('tournaments');
        expect(mockWhere).toHaveBeenCalledWith('is_active', '=', true);
        expect(mockWhere).toHaveBeenCalledWith(expect.any(Function));
        expect(result).toEqual(mockTournaments);
      });

      it('should find all active tournaments in development mode', async () => {
        const { isDevelopmentMode } = await import('../../app/utils/environment-utils');
        vi.mocked(isDevelopmentMode).mockReturnValue(true);

        const mockWhere = vi.fn().mockReturnThis();
        const mockQuery = {
          where: mockWhere,
          selectAll: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue(mockTournaments),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await findAllActiveTournaments();

        expect(mockDb.selectFrom).toHaveBeenCalledWith('tournaments');
        expect(mockWhere).toHaveBeenCalledWith('is_active', '=', true);
        expect(result).toEqual(mockTournaments);
      });

      it('should return empty array when no active tournaments', async () => {
        const mockWhere = vi.fn().mockReturnThis();
        const mockQuery = {
          where: mockWhere,
          selectAll: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue([]),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await findAllActiveTournaments();

        expect(result).toEqual([]);
      });

      it('should filter dev tournaments by user permission in production', async () => {
        const { isDevelopmentMode } = await import('../../app/utils/environment-utils');
        vi.mocked(isDevelopmentMode).mockReturnValue(false);

        const mockWhere = vi.fn().mockReturnThis();
        const mockQuery = {
          where: mockWhere,
          selectAll: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue(mockTournaments),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await findAllActiveTournaments('user-123');

        expect(mockDb.selectFrom).toHaveBeenCalledWith('tournaments');
        expect(mockWhere).toHaveBeenCalledWith('is_active', '=', true);
        expect(mockWhere).toHaveBeenCalledWith(expect.any(Function));
        expect(result).toEqual(mockTournaments);
      });

      it('should allow userId parameter in development mode', async () => {
        const { isDevelopmentMode } = await import('../../app/utils/environment-utils');
        vi.mocked(isDevelopmentMode).mockReturnValue(true);

        const mockWhere = vi.fn().mockReturnThis();
        const mockQuery = {
          where: mockWhere,
          selectAll: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue(mockTournaments),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await findAllActiveTournaments('user-123');

        expect(mockDb.selectFrom).toHaveBeenCalledWith('tournaments');
        expect(mockWhere).toHaveBeenCalledWith('is_active', '=', true);
        // In dev mode, no additional filtering is applied
        expect(result).toEqual(mockTournaments);
      });

      it('should handle undefined userId in production', async () => {
        const { isDevelopmentMode } = await import('../../app/utils/environment-utils');
        vi.mocked(isDevelopmentMode).mockReturnValue(false);

        const mockWhere = vi.fn().mockReturnThis();
        const mockQuery = {
          where: mockWhere,
          selectAll: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue(mockTournaments),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await findAllActiveTournaments(undefined);

        expect(mockDb.selectFrom).toHaveBeenCalledWith('tournaments');
        expect(mockWhere).toHaveBeenCalledWith('is_active', '=', true);
        expect(mockWhere).toHaveBeenCalledWith(expect.any(Function));
        expect(result).toEqual(mockTournaments);
      });

      it('should handle empty string userId in production', async () => {
        const { isDevelopmentMode } = await import('../../app/utils/environment-utils');
        vi.mocked(isDevelopmentMode).mockReturnValue(false);

        const mockWhere = vi.fn().mockReturnThis();
        const mockQuery = {
          where: mockWhere,
          selectAll: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue([]),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await findAllActiveTournaments('');

        expect(mockDb.selectFrom).toHaveBeenCalledWith('tournaments');
        expect(result).toEqual([]);
      });
    });

    describe('createTournamentTeam', () => {
      it('should create tournament team', async () => {
        const tournamentTeam = {
          tournament_id: 'tournament-1',
          team_id: 'team-1',
        };
        const mockQuery = createMockInsertQuery(tournamentTeam);
        mockDb.insertInto.mockReturnValue(mockQuery as any);

        const result = await createTournamentTeam(tournamentTeam);

        expect(mockDb.insertInto).toHaveBeenCalledWith('tournament_teams');
        expect(mockQuery.values).toHaveBeenCalledWith(tournamentTeam);
        expect(mockQuery.returningAll).toHaveBeenCalled();
        expect(mockQuery.executeTakeFirstOrThrow).toHaveBeenCalled();
        expect(result).toEqual(tournamentTeam);
      });

      it('should throw error when insert fails', async () => {
        const tournamentTeam = {
          tournament_id: 'tournament-1',
          team_id: 'team-1',
        };
        const mockQuery = {
          values: vi.fn().mockReturnThis(),
          returningAll: vi.fn().mockReturnThis(),
          executeTakeFirstOrThrow: vi.fn().mockRejectedValue(new Error('Insert failed')),
        };
        mockDb.insertInto.mockReturnValue(mockQuery as any);

        await expect(createTournamentTeam(tournamentTeam)).rejects.toThrow('Insert failed');
      });
    });

    describe('deleteTournamentTeams', () => {
      it('should delete all teams for tournament', async () => {
        const mockQuery = createMockDeleteQuery([{ tournament_id: 'tournament-1', team_id: 'team-1' }]);
        mockDb.deleteFrom.mockReturnValue(mockQuery as any);

        await deleteTournamentTeams('tournament-1');

        expect(mockDb.deleteFrom).toHaveBeenCalledWith('tournament_teams');
        expect(mockQuery.where).toHaveBeenCalledWith('tournament_id', '=', 'tournament-1');
        expect(mockQuery.execute).toHaveBeenCalled();
      });

      it('should handle deleting teams from tournament with no teams', async () => {
        const mockQuery = createMockDeleteQuery([]);
        mockDb.deleteFrom.mockReturnValue(mockQuery as any);

        const result = await deleteTournamentTeams('empty-tournament');

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

      await expect(findTournamentByName('Test')).rejects.toThrow('Connection lost');
    });

    it('should handle special characters in tournament name', async () => {
      const mockQuery = createMockSelectQuery(mockTournament);
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      await findTournamentByName("FIFA's World Cup 2026");

      expect(mockQuery.where).toHaveBeenCalledWith('long_name', '=', "FIFA's World Cup 2026");
    });
  });
});
