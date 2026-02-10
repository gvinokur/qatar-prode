import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  getTournamentQualificationConfig,
  updateGroupPositionsJsonb,
} from '../../app/actions/qualification-actions';
import { QualificationPredictionError } from '../../app/actions/qualification-errors';
import * as userActions from '../../app/actions/user-actions';
import { db } from '../../app/db/database';
import { upsertGroupPositionsPrediction, getAllUserGroupPositionsPredictions } from '../../app/db/qualified-teams-repository';

// Mock next-auth
vi.mock('../../auth', () => ({
  __esModule: true,
  default: () => ({
    handlers: {},
    signIn: vi.fn(),
    signOut: vi.fn(),
    auth: vi.fn(),
  }),
}));

// Mock database
vi.mock('../../app/db/database', () => {
  const createQueryChain = () => ({
    selectAll: vi.fn(() => createQueryChain()),
    where: vi.fn(() => createQueryChain()),
    select: vi.fn(() => createQueryChain()),
    distinct: vi.fn(() => createQueryChain()),
    orderBy: vi.fn(() => createQueryChain()),
    execute: vi.fn().mockResolvedValue([]),
    executeTakeFirst: vi.fn().mockResolvedValue(null)
  });

  return {
    db: {
      selectFrom: vi.fn(() => createQueryChain()),
      updateTable: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            execute: vi.fn().mockResolvedValue(undefined)
          }))
        }))
      }))
    }
  };
});

// Mock repository
vi.mock('../../app/db/qualified-teams-repository', () => ({
  upsertGroupPositionsPrediction: vi.fn(),
  getAllUserGroupPositionsPredictions: vi.fn(),
}));

// Mock user actions
vi.mock('../../app/actions/user-actions', () => ({
  getLoggedInUser: vi.fn(),
}));

// Mock guesses actions to prevent circular dependency
vi.mock('../../app/actions/guesses-actions', () => ({
  updatePlayoffGameGuesses: vi.fn().mockResolvedValue(undefined),
}));

import * as guessesActions from '../../app/actions/guesses-actions';
const mockUpdatePlayoffGameGuesses = vi.mocked(guessesActions.updatePlayoffGameGuesses);

const mockDb = vi.mocked(db);
const mockGetLoggedInUser = vi.mocked(userActions.getLoggedInUser);
const mockUpsertGroupPositions = vi.mocked(upsertGroupPositionsPrediction);
const mockGetAllUserGroupPositionsPredictions = vi.mocked(getAllUserGroupPositionsPredictions);

describe('Qualification Actions', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    emailVerified: new Date(),
    isAdmin: false,
  };

  const mockTournament = {
    id: 'tournament-1',
    is_active: true,
    allows_third_place_qualification: true,
    max_third_place_qualifiers: 8,
    dev_only: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetLoggedInUser.mockResolvedValue(mockUser);
  });

  describe('getTournamentQualificationConfig', () => {
    it('should return tournament qualification configuration', async () => {
      // Mock tournament query
      const mockTournamentQuery = {
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(mockTournament),
      };

      // Mock game query (for getTournamentStartDate) - use future date so tournament is not locked
      const mockGameQuery = {
        selectAll: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue({
          game_date: new Date('2026-12-31'),
        }),
      };

      mockDb.selectFrom.mockImplementation((table: string) => {
        if (table === 'tournaments') return mockTournamentQuery as any;
        if (table === 'games') return mockGameQuery as any;
        return mockTournamentQuery as any;
      });

      const result = await getTournamentQualificationConfig('tournament-1');

      expect(result).toEqual({
        allowsThirdPlace: true,
        maxThirdPlace: 8,
        isLocked: false,
      });
    });

    it('should handle tournament not found', async () => {
      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(null),
      };
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      await expect(
        getTournamentQualificationConfig('tournament-1')
      ).rejects.toThrow('Torneo no encontrado');
    });
  });

  describe('updateGroupPositionsJsonb', () => {
    it('should handle empty array gracefully', async () => {
      const result = await updateGroupPositionsJsonb('group-1', 'tournament-1', []);

      expect(result.success).toBe(true);
      expect(result.message).toBe('No hay predicciones para actualizar');
      expect(mockUpsertGroupPositions).not.toHaveBeenCalled();
    });

    it('should reject unauthenticated users', async () => {
      mockGetLoggedInUser.mockResolvedValue(null);

      const positionUpdates = [{ teamId: 'team-1', position: 1, qualifies: true }];

      await expect(
        updateGroupPositionsJsonb('group-1', 'tournament-1', positionUpdates)
      ).rejects.toThrow(QualificationPredictionError);

      await expect(
        updateGroupPositionsJsonb('group-1', 'tournament-1', positionUpdates)
      ).rejects.toThrow('Debes iniciar sesión para actualizar predicciones');
    });

    it('should reject if tournament not found', async () => {
      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(null),
      };
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      const positionUpdates = [{ teamId: 'team-1', position: 1, qualifies: true }];

      await expect(
        updateGroupPositionsJsonb('group-1', 'tournament-1', positionUpdates)
      ).rejects.toThrow('Torneo no encontrado');
    });

    it('should reject if tournament is locked', async () => {
      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue({
          ...mockTournament,
          is_active: false,
        }),
      };
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      const positionUpdates = [{ teamId: 'team-1', position: 1, qualifies: true }];

      await expect(
        updateGroupPositionsJsonb('group-1', 'tournament-1', positionUpdates)
      ).rejects.toThrow('Las predicciones están bloqueadas para este torneo');
    });

    it('should successfully update positions', async () => {
      // Mock tournament query
      const mockTournamentQuery = {
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(mockTournament),
      };

      // Mock team validation queries (all teams are in the group)
      const mockTeamQuery = {
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue({ team_id: 'team-1' }),
      };

      // Mock third place count query (return empty array - no other third place predictions)
      const mockThirdPlaceQuery = {
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue([]),
      };

      // Mock game query (for getTournamentStartDate) - use future date so tournament is not locked
      const mockGameQuery = {
        selectAll: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue({
          game_date: new Date('2026-12-31'),
        }),
      };

      mockDb.selectFrom.mockImplementation((table: string) => {
        if (table === 'tournaments') return mockTournamentQuery as any;
        if (table === 'tournament_group_teams') return mockTeamQuery as any;
        if (table === 'tournament_user_group_positions_predictions') return mockThirdPlaceQuery as any;
        if (table === 'games') return mockGameQuery as any;
        return mockTeamQuery as any;
      });

      // Mock repository function to return empty array (no existing third place predictions)
      mockGetAllUserGroupPositionsPredictions.mockResolvedValue([]);

      mockUpsertGroupPositions.mockResolvedValue(undefined);

      const positionUpdates = [
        { teamId: 'team-1', position: 1, qualifies: true },
        { teamId: 'team-2', position: 2, qualifies: true },
      ];

      const result = await updateGroupPositionsJsonb('group-1', 'tournament-1', positionUpdates);

      expect(result.success).toBe(true);
      expect(mockUpsertGroupPositions).toHaveBeenCalled();
    });

    it('should reject duplicate teams', async () => {
      const mockTournamentQuery = {
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(mockTournament),
      };
      mockDb.selectFrom.mockReturnValue(mockTournamentQuery as any);

      const positionUpdates = [
        { teamId: 'team-1', position: 1, qualifies: true },
        { teamId: 'team-1', position: 2, qualifies: true }, // Duplicate!
      ];

      await expect(
        updateGroupPositionsJsonb('group-1', 'tournament-1', positionUpdates)
      ).rejects.toThrow('Hay equipos duplicados');
    });

    it('should reject invalid positions (less than 1)', async () => {
      const mockTournamentQuery = {
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(mockTournament),
      };
      mockDb.selectFrom.mockReturnValue(mockTournamentQuery as any);

      const positionUpdates = [
        { teamId: 'team-1', position: 0, qualifies: true }, // Invalid position!
      ];

      await expect(
        updateGroupPositionsJsonb('group-1', 'tournament-1', positionUpdates)
      ).rejects.toThrow('Todas las posiciones deben ser al menos 1');
    });

    it('should reject duplicate positions', async () => {
      const mockTournamentQuery = {
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(mockTournament),
      };
      mockDb.selectFrom.mockReturnValue(mockTournamentQuery as any);

      const positionUpdates = [
        { teamId: 'team-1', position: 1, qualifies: true },
        { teamId: 'team-2', position: 1, qualifies: true }, // Duplicate position!
      ];

      await expect(
        updateGroupPositionsJsonb('group-1', 'tournament-1', positionUpdates)
      ).rejects.toThrow('Hay posiciones duplicadas');
    });

    it('should reject when positions 1-2 are not marked as qualified', async () => {
      const mockTournamentQuery = {
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(mockTournament),
      };
      mockDb.selectFrom.mockReturnValue(mockTournamentQuery as any);

      const positionUpdates = [
        { teamId: 'team-1', position: 1, qualifies: false }, // Position 1 must qualify!
        { teamId: 'team-2', position: 2, qualifies: true },
      ];

      await expect(
        updateGroupPositionsJsonb('group-1', 'tournament-1', positionUpdates)
      ).rejects.toThrow('Los equipos en posiciones 1 y 2 deben estar calificados');
    });

    it('should reject third place qualifiers when tournament does not allow them', async () => {
      const mockTournamentQuery = {
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue({
          ...mockTournament,
          allows_third_place_qualification: false,
        }),
      };
      const mockTeamQuery = {
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue({ team_id: 'team-1' }),
      };
      const mockGameQuery = {
        selectAll: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue({
          game_date: new Date('2026-12-31'),
        }),
      };

      mockDb.selectFrom.mockImplementation((table: string) => {
        if (table === 'tournaments') return mockTournamentQuery as any;
        if (table === 'tournament_group_teams') return mockTeamQuery as any;
        if (table === 'games') return mockGameQuery as any;
        return mockTeamQuery as any;
      });

      mockGetAllUserGroupPositionsPredictions.mockResolvedValue([]);

      const positionUpdates = [
        { teamId: 'team-1', position: 1, qualifies: true },
        { teamId: 'team-2', position: 2, qualifies: true },
        { teamId: 'team-3', position: 3, qualifies: true }, // Third place not allowed!
      ];

      await expect(
        updateGroupPositionsJsonb('group-1', 'tournament-1', positionUpdates)
      ).rejects.toThrow('Este torneo no permite calificar equipos de tercer lugar');
    });

    it('should reject too many third place qualifiers', async () => {
      const mockTournamentQuery = {
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue({
          ...mockTournament,
          max_third_place_qualifiers: 2, // Only 2 allowed
        }),
      };
      const mockTeamQuery = {
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue({ team_id: 'team-1' }),
      };
      const mockGameQuery = {
        selectAll: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue({
          game_date: new Date('2026-12-31'),
        }),
      };

      mockDb.selectFrom.mockImplementation((table: string) => {
        if (table === 'tournaments') return mockTournamentQuery as any;
        if (table === 'tournament_group_teams') return mockTeamQuery as any;
        if (table === 'games') return mockGameQuery as any;
        return mockTeamQuery as any;
      });

      // User already has 2 third place qualifiers in other groups
      mockGetAllUserGroupPositionsPredictions.mockResolvedValue([
        {
          id: 'pred-other',
          user_id: 'user-1',
          tournament_id: 'tournament-1',
          group_id: 'group-other',
          team_predicted_positions: [
            { team_id: 'team-x', predicted_position: 3, predicted_to_qualify: true },
            { team_id: 'team-y', predicted_position: 3, predicted_to_qualify: true },
          ],
        },
      ] as any);

      const positionUpdates = [
        { teamId: 'team-1', position: 1, qualifies: true },
        { teamId: 'team-2', position: 2, qualifies: true },
        { teamId: 'team-3', position: 3, qualifies: true }, // Would exceed limit!
      ];

      await expect(
        updateGroupPositionsJsonb('group-1', 'tournament-1', positionUpdates)
      ).rejects.toThrow('Solo puedes seleccionar 2 equipos de tercer lugar en total');
    });

    it('should reject team not in group', async () => {
      const mockTournamentQuery = {
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(mockTournament),
      };
      // Mock team NOT found in group
      const mockTeamQuery = {
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(null), // Team not found!
      };
      const mockGameQuery = {
        selectAll: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue({
          game_date: new Date('2026-12-31'),
        }),
      };

      mockDb.selectFrom.mockImplementation((table: string) => {
        if (table === 'tournaments') return mockTournamentQuery as any;
        if (table === 'tournament_group_teams') return mockTeamQuery as any;
        if (table === 'games') return mockGameQuery as any;
        return mockTeamQuery as any;
      });

      mockGetAllUserGroupPositionsPredictions.mockResolvedValue([]);

      const positionUpdates = [
        { teamId: 'team-999', position: 1, qualifies: true }, // Team not in group!
      ];

      await expect(
        updateGroupPositionsJsonb('group-1', 'tournament-1', positionUpdates)
      ).rejects.toThrow('El equipo team-999 no pertenece al grupo group-1');
    });

    it('should allow updates in dev environment for dev tournaments even when locked', async () => {
      // Set environment to development
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const mockTournamentQuery = {
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue({
          ...mockTournament,
          is_active: false, // Locked
          dev_only: true,   // But it's a dev tournament
        }),
      };
      const mockTeamQuery = {
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue({ team_id: 'team-1' }),
      };
      const mockGameQuery = {
        selectAll: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue({
          game_date: new Date('2026-12-31'),
        }),
      };

      mockDb.selectFrom.mockImplementation((table: string) => {
        if (table === 'tournaments') return mockTournamentQuery as any;
        if (table === 'tournament_group_teams') return mockTeamQuery as any;
        if (table === 'games') return mockGameQuery as any;
        return mockTeamQuery as any;
      });

      mockGetAllUserGroupPositionsPredictions.mockResolvedValue([]);
      mockUpsertGroupPositions.mockResolvedValue(undefined);
      mockUpdatePlayoffGameGuesses.mockResolvedValue(undefined);

      const positionUpdates = [
        { teamId: 'team-1', position: 1, qualifies: true },
        { teamId: 'team-2', position: 2, qualifies: true },
      ];

      const result = await updateGroupPositionsJsonb('group-1', 'tournament-1', positionUpdates);

      expect(result.success).toBe(true);
      expect(mockUpsertGroupPositions).toHaveBeenCalled();

      // Restore environment
      process.env.NODE_ENV = originalEnv;
    });

    it('should call updatePlayoffGameGuesses after successful update', async () => {
      const mockTournamentQuery = {
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(mockTournament),
      };
      const mockTeamQuery = {
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue({ team_id: 'team-1' }),
      };
      const mockGameQuery = {
        selectAll: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue({
          game_date: new Date('2026-12-31'),
        }),
      };

      mockDb.selectFrom.mockImplementation((table: string) => {
        if (table === 'tournaments') return mockTournamentQuery as any;
        if (table === 'tournament_group_teams') return mockTeamQuery as any;
        if (table === 'games') return mockGameQuery as any;
        return mockTeamQuery as any;
      });

      mockGetAllUserGroupPositionsPredictions.mockResolvedValue([]);
      mockUpsertGroupPositions.mockResolvedValue(undefined);
      mockUpdatePlayoffGameGuesses.mockClear();

      const positionUpdates = [
        { teamId: 'team-1', position: 1, qualifies: true },
        { teamId: 'team-2', position: 2, qualifies: true },
      ];

      await updateGroupPositionsJsonb('group-1', 'tournament-1', positionUpdates);

      expect(mockUpdatePlayoffGameGuesses).toHaveBeenCalledWith('tournament-1', { id: 'user-1' });
    });

    it('should handle database errors gracefully', async () => {
      const mockTournamentQuery = {
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(mockTournament),
      };
      const mockTeamQuery = {
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue({ team_id: 'team-1' }),
      };
      const mockGameQuery = {
        selectAll: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue({
          game_date: new Date('2026-12-31'),
        }),
      };

      mockDb.selectFrom.mockImplementation((table: string) => {
        if (table === 'tournaments') return mockTournamentQuery as any;
        if (table === 'tournament_group_teams') return mockTeamQuery as any;
        if (table === 'games') return mockGameQuery as any;
        return mockTeamQuery as any;
      });

      mockGetAllUserGroupPositionsPredictions.mockResolvedValue([]);
      // Simulate database error
      mockUpsertGroupPositions.mockRejectedValue(new Error('Database connection failed'));

      const positionUpdates = [
        { teamId: 'team-1', position: 1, qualifies: true },
      ];

      await expect(
        updateGroupPositionsJsonb('group-1', 'tournament-1', positionUpdates)
      ).rejects.toThrow('Error al guardar las predicciones. Por favor intenta de nuevo.');
    });
  });
});
