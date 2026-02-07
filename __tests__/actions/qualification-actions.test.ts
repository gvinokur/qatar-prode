import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  updateQualificationPredictions,
  getTournamentQualificationConfig,
  updateGroupPositionsJsonb,
  QualificationPredictionError,
} from '../../app/actions/qualification-actions';
import { QualifiedTeamPredictionNew } from '../../app/db/tables-definition';
import * as qualificationRepository from '../../app/db/qualified-teams-repository';
import * as userActions from '../../app/actions/user-actions';
import { db } from '../../app/db/database';
import { upsertGroupPositionsPrediction, getAllUserGroupPositionsPredictions } from '../../app/db/qualified-teams-repository';

// Mock next-auth
vi.mock('next-auth', () => ({
  __esModule: true,
  default: () => ({
    handlers: {},
    signIn: vi.fn(),
    signOut: vi.fn(),
    auth: vi.fn(),
  }),
}));

// Mock database
vi.mock('../../app/db/database', () => ({
  db: {
    selectFrom: vi.fn(),
  },
}));

// Mock repository
vi.mock('../../app/db/qualified-teams-repository', () => ({
  batchUpsertQualificationPredictions: vi.fn(),
  countThirdPlaceQualifiers: vi.fn(),
  upsertGroupPositionsPrediction: vi.fn(),
  getAllUserGroupPositionsPredictions: vi.fn(),
}));

// Mock user actions
vi.mock('../../app/actions/user-actions', () => ({
  getLoggedInUser: vi.fn(),
}));

const mockDb = vi.mocked(db);
const mockBatchUpsert = vi.mocked(qualificationRepository.batchUpsertQualificationPredictions);
const mockCountThirdPlace = vi.mocked(qualificationRepository.countThirdPlaceQualifiers);
const mockGetLoggedInUser = vi.mocked(userActions.getLoggedInUser);
const mockUpsertGroupPositions = vi.mocked(upsertGroupPositionsPrediction);
const mockGetAllUserGroupPositions = vi.mocked(getAllUserGroupPositionsPredictions);

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
  };

  const createMockPrediction = (overrides?: Partial<QualifiedTeamPredictionNew>): QualifiedTeamPredictionNew => ({
    user_id: 'user-1',
    tournament_id: 'tournament-1',
    group_id: 'group-1',
    team_id: 'team-1',
    predicted_position: 1,
    predicted_to_qualify: true,
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetLoggedInUser.mockResolvedValue(mockUser);
  });

  describe('updateQualificationPredictions', () => {
    describe('Validation: Empty array', () => {
      it('should handle empty array gracefully', async () => {
        const result = await updateQualificationPredictions([]);

        expect(result.success).toBe(true);
        expect(result.message).toBe('No hay predicciones para actualizar');
        expect(mockBatchUpsert).not.toHaveBeenCalled();
      });
    });

    describe('Validation: Authentication', () => {
      it('should reject unauthenticated users', async () => {
        mockGetLoggedInUser.mockResolvedValue(null);

        const predictions = [createMockPrediction()];

        await expect(updateQualificationPredictions(predictions)).rejects.toThrow(
          QualificationPredictionError
        );
        await expect(updateQualificationPredictions(predictions)).rejects.toThrow(
          'Debes iniciar sesión para actualizar predicciones'
        );
      });

      it('should reject users without ID', async () => {
        mockGetLoggedInUser.mockResolvedValue({ ...mockUser, id: undefined } as any);

        const predictions = [createMockPrediction()];

        await expect(updateQualificationPredictions(predictions)).rejects.toThrow(
          QualificationPredictionError
        );
      });
    });

    describe('Validation: Data consistency', () => {
      it('should reject predictions for different users', async () => {
        const predictions = [
          createMockPrediction({ user_id: 'user-1' }),
          createMockPrediction({ user_id: 'user-2' }),
        ];

        await expect(updateQualificationPredictions(predictions)).rejects.toThrow(
          'Todas las predicciones deben ser para el mismo usuario y torneo'
        );
      });

      it('should reject predictions for different tournaments', async () => {
        const predictions = [
          createMockPrediction({ tournament_id: 'tournament-1' }),
          createMockPrediction({ tournament_id: 'tournament-2' }),
        ];

        await expect(updateQualificationPredictions(predictions)).rejects.toThrow(
          'Todas las predicciones deben ser para el mismo usuario y torneo'
        );
      });
    });

    describe('Validation: Tournament state', () => {
      it('should reject if tournament not found', async () => {
        const predictions = [createMockPrediction()];

        // Mock tournament not found
        const mockQuery = {
          where: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue(undefined),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        await expect(updateQualificationPredictions(predictions)).rejects.toThrow(
          'Torneo no encontrado'
        );
      });

      it('should reject if tournament is locked', async () => {
        const predictions = [createMockPrediction()];

        // Mock locked tournament
        const mockQuery = {
          where: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue({
            ...mockTournament,
            is_active: false,
          }),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        await expect(updateQualificationPredictions(predictions)).rejects.toThrow(
          'Las predicciones están bloqueadas para este torneo'
        );
      });
    });

    describe('Validation: Team belongs to group', () => {
      it('should reject if team not in group', async () => {
        const predictions = [createMockPrediction()];

        // Mock tournament query
        const mockTournamentQuery = {
          where: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue(mockTournament),
        };

        // Mock team-group validation (team NOT in group)
        const mockTeamQuery = {
          where: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue(undefined),
        };

        mockDb.selectFrom.mockImplementation((table: string) => {
          if (table === 'tournaments') return mockTournamentQuery as any;
          if (table === 'tournament_group_teams') return mockTeamQuery as any;
          throw new Error(`Unexpected table: ${table}`);
        });

        await expect(updateQualificationPredictions(predictions)).rejects.toThrow(
          /El equipo .* no pertenece al grupo/
        );
      });

      it('should pass if team is in group', async () => {
        const predictions = [createMockPrediction()];

        // Mock tournament query
        const mockTournamentQuery = {
          where: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue(mockTournament),
        };

        // Mock team-group validation (team IS in group)
        const mockTeamQuery = {
          where: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue({ id: 'group-team-1' }),
        };

        mockDb.selectFrom.mockImplementation((table: string) => {
          if (table === 'tournaments') return mockTournamentQuery as any;
          if (table === 'tournament_group_teams') return mockTeamQuery as any;
          if (table === 'tournament_qualified_teams_predictions') {
            // Mock existing third place count query
            return {
              where: vi.fn().mockReturnThis(),
              select: vi.fn().mockReturnThis(),
              executeTakeFirst: vi.fn().mockResolvedValue({ count: 0 }),
            } as any;
          }
          throw new Error(`Unexpected table: ${table}`);
        });

        mockCountThirdPlace.mockResolvedValue(0);
        mockBatchUpsert.mockResolvedValue();

        const result = await updateQualificationPredictions(predictions);

        expect(result.success).toBe(true);
      });
    });

    describe('Validation: Position constraints', () => {
      it('should reject positions less than 1', async () => {
        const predictions = [createMockPrediction({ predicted_position: 0 })];

        // Mock tournament query
        const mockQuery = {
          where: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue(mockTournament),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        await expect(updateQualificationPredictions(predictions)).rejects.toThrow(
          'La posición predicha debe ser al menos 1'
        );
      });

      it('should reject duplicate positions in same group', async () => {
        const predictions = [
          createMockPrediction({ team_id: 'team-1', predicted_position: 1 }),
          createMockPrediction({ team_id: 'team-2', predicted_position: 1 }), // Duplicate position
        ];

        // Mock tournament query
        const mockTournamentQuery = {
          where: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue(mockTournament),
        };

        // Mock team-group validation
        const mockTeamQuery = {
          where: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue({ id: 'group-team-1' }),
        };

        mockDb.selectFrom.mockImplementation((table: string) => {
          if (table === 'tournaments') return mockTournamentQuery as any;
          if (table === 'tournament_group_teams') return mockTeamQuery as any;
          throw new Error(`Unexpected table: ${table}`);
        });

        await expect(updateQualificationPredictions(predictions)).rejects.toThrow(
          /La posición .* está asignada a múltiples equipos/
        );
      });
    });

    describe('Validation: Max third place qualifiers', () => {
      it('should reject exceeding max third place limit', async () => {
        const predictions = [createMockPrediction({ predicted_position: 3, predicted_to_qualify: true })];

        // Mock tournament with max = 8
        const mockTournamentQuery = {
          where: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue(mockTournament),
        };

        // Mock team-group validation
        const mockTeamQuery = {
          where: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue({ id: 'group-team-1' }),
        };

        // Mock existing third place count (already at 8)
        const mockCountQuery = {
          where: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue({ count: 8 }),
        };

        mockDb.selectFrom.mockImplementation((table: string) => {
          if (table === 'tournaments') return mockTournamentQuery as any;
          if (table === 'tournament_group_teams') return mockTeamQuery as any;
          if (table === 'tournament_qualified_teams_predictions') return mockCountQuery as any;
          throw new Error(`Unexpected table: ${table}`);
        });

        await expect(updateQualificationPredictions(predictions)).rejects.toThrow(
          /Máximo .* clasificados de tercer lugar permitidos/
        );
      });

      it('should allow third place qualifiers within limit', async () => {
        const predictions = [createMockPrediction({ predicted_position: 3, predicted_to_qualify: true })];

        // Mock tournament
        const mockTournamentQuery = {
          where: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue(mockTournament),
        };

        // Mock team-group validation
        const mockTeamQuery = {
          where: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue({ id: 'group-team-1' }),
        };

        // Mock existing count (within limit)
        const mockCountQuery = {
          where: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue({ count: 5 }),
        };

        mockDb.selectFrom.mockImplementation((table: string) => {
          if (table === 'tournaments') return mockTournamentQuery as any;
          if (table === 'tournament_group_teams') return mockTeamQuery as any;
          if (table === 'tournament_qualified_teams_predictions') return mockCountQuery as any;
          throw new Error(`Unexpected table: ${table}`);
        });

        mockBatchUpsert.mockResolvedValue();

        const result = await updateQualificationPredictions(predictions);

        expect(result.success).toBe(true);
        expect(mockBatchUpsert).toHaveBeenCalledWith(predictions);
      });
    });

    describe('Validation: Qualification flags', () => {
      it('should reject positions 1-2 without predicted_to_qualify flag', async () => {
        const predictions = [createMockPrediction({ predicted_position: 1, predicted_to_qualify: false })];

        // Mock tournament query
        const mockTournamentQuery = {
          where: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue(mockTournament),
        };

        // Mock team-group validation
        const mockTeamQuery = {
          where: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue({ id: 'group-team-1' }),
        };

        // Mock third place count query (needed for validation flow)
        const mockCountQuery = {
          where: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue({ count: 0 }),
        };

        mockDb.selectFrom.mockImplementation((table: string) => {
          if (table === 'tournaments') return mockTournamentQuery as any;
          if (table === 'tournament_group_teams') return mockTeamQuery as any;
          if (table === 'tournament_qualified_teams_predictions') return mockCountQuery as any;
          throw new Error(`Unexpected table: ${table}`);
        });

        await expect(updateQualificationPredictions(predictions)).rejects.toThrow(
          'Los equipos en posiciones 1-2 deben estar marcados como clasificados'
        );
      });
    });

    describe('Success cases', () => {
      it('should successfully update predictions', async () => {
        const predictions = [
          createMockPrediction({ team_id: 'team-1', predicted_position: 1 }),
          createMockPrediction({ team_id: 'team-2', predicted_position: 2 }),
        ];

        // Mock all queries
        const mockTournamentQuery = {
          where: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue(mockTournament),
        };

        const mockTeamQuery = {
          where: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue({ id: 'group-team-1' }),
        };

        const mockCountQuery = {
          where: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue({ count: 0 }),
        };

        mockDb.selectFrom.mockImplementation((table: string) => {
          if (table === 'tournaments') return mockTournamentQuery as any;
          if (table === 'tournament_group_teams') return mockTeamQuery as any;
          if (table === 'tournament_qualified_teams_predictions') return mockCountQuery as any;
          throw new Error(`Unexpected table: ${table}`);
        });

        mockBatchUpsert.mockResolvedValue();

        const result = await updateQualificationPredictions(predictions);

        expect(result.success).toBe(true);
        expect(result.message).toMatch(/Actualizado/);
        expect(result.message).toMatch(/predicci/);
        expect(result.message).toContain('2');
        expect(mockBatchUpsert).toHaveBeenCalledWith(predictions);
      });

      it('should handle database errors gracefully', async () => {
        const predictions = [createMockPrediction()];

        // Mock all queries successfully
        const mockTournamentQuery = {
          where: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue(mockTournament),
        };

        const mockTeamQuery = {
          where: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue({ id: 'group-team-1' }),
        };

        const mockCountQuery = {
          where: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue({ count: 0 }),
        };

        mockDb.selectFrom.mockImplementation((table: string) => {
          if (table === 'tournaments') return mockTournamentQuery as any;
          if (table === 'tournament_group_teams') return mockTeamQuery as any;
          if (table === 'tournament_qualified_teams_predictions') return mockCountQuery as any;
          throw new Error(`Unexpected table: ${table}`);
        });

        // Mock database error
        mockBatchUpsert.mockRejectedValue(new Error('Database connection failed'));

        await expect(updateQualificationPredictions(predictions)).rejects.toThrow(
          'Error al guardar las predicciones'
        );
      });
    });
  });

  describe('getTournamentQualificationConfig', () => {
    it('should return tournament configuration', async () => {
      // Mock for tournament query (first call)
      const tournamentQuery = {
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(mockTournament),
      };

      // Mock for game query (second call)
      const gameQuery = {
        selectAll: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue({
          id: 'game-1',
          game_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        }),
      };

      // Return different mocks for each selectFrom call
      mockDb.selectFrom
        .mockReturnValueOnce(tournamentQuery as any)
        .mockReturnValueOnce(gameQuery as any);

      const result = await getTournamentQualificationConfig('tournament-1');

      expect(result.allowsThirdPlace).toBe(true);
      expect(result.maxThirdPlace).toBe(8);
      expect(result.isLocked).toBe(true); // Should be locked (more than 5 days after start)
    });

    it('should handle tournament not found', async () => {
      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(undefined),
      };
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      await expect(getTournamentQualificationConfig('tournament-1')).rejects.toThrow('Torneo no encontrado');
    });

    it('should return correct lock status', async () => {
      // Mock for tournament query (first call)
      const tournamentQuery = {
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(mockTournament),
      };

      // Mock for game query (second call)
      const gameQuery = {
        selectAll: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue({
          id: 'game-1',
          game_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        }),
      };

      // Return different mocks for each selectFrom call
      mockDb.selectFrom
        .mockReturnValueOnce(tournamentQuery as any)
        .mockReturnValueOnce(gameQuery as any);

      const result = await getTournamentQualificationConfig('tournament-1');

      expect(result.isLocked).toBe(false); // Should not be locked (less than 5 days)
    });
  });

  describe('updateGroupPositionsJsonb', () => {
    const positionUpdates = [
      { teamId: 'team-1', position: 1, qualifies: true },
      { teamId: 'team-2', position: 2, qualifies: true },
      { teamId: 'team-3', position: 3, qualifies: false },
    ];

    beforeEach(() => {
      vi.clearAllMocks();
      mockGetLoggedInUser.mockResolvedValue(mockUser);
    });

    it('should reject unauthenticated users', async () => {
      mockGetLoggedInUser.mockResolvedValue(null);

      await expect(
        updateGroupPositionsJsonb('group-1', 'tournament-1', positionUpdates)
      ).rejects.toThrow(QualificationPredictionError);
      await expect(
        updateGroupPositionsJsonb('group-1', 'tournament-1', positionUpdates)
      ).rejects.toThrow('Debes iniciar sesión para actualizar predicciones');
    });

    it('should handle empty updates array', async () => {
      const result = await updateGroupPositionsJsonb('group-1', 'tournament-1', []);

      expect(result.success).toBe(true);
      expect(result.message).toBe('No hay predicciones para actualizar');
    });

    it('should reject if tournament not found', async () => {
      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(undefined),
      };
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

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

      await expect(
        updateGroupPositionsJsonb('group-1', 'tournament-1', positionUpdates)
      ).rejects.toThrow('Las predicciones están bloqueadas para este torneo');
    });

    it('should reject if team does not belong to group', async () => {
      // Mock tournament query (first selectFrom)
      const mockTournamentQuery = {
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(mockTournament),
      };

      // Mock team-group validation query (second selectFrom) - returns less teams than requested
      const mockTeamGroupQuery = {
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue([
          { team_id: 'team-1' },
          { team_id: 'team-2' },
          // Missing team-3, so validation should fail
        ]),
      };

      mockDb.selectFrom
        .mockReturnValueOnce(mockTournamentQuery as any)
        .mockReturnValueOnce(mockTeamGroupQuery as any);

      await expect(
        updateGroupPositionsJsonb('group-1', 'tournament-1', positionUpdates)
      ).rejects.toThrow('Uno o más equipos no pertenecen al grupo especificado');
    });

    it('should reject if positions contain values less than 1', async () => {
      const invalidPositionUpdates = [
        { teamId: 'team-1', position: 0, qualifies: false },
        { teamId: 'team-2', position: 2, qualifies: true },
      ];

      // Mock tournament query
      const mockTournamentQuery = {
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(mockTournament),
      };

      // Mock team-group validation query
      const mockTeamGroupQuery = {
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue([
          { team_id: 'team-1' },
          { team_id: 'team-2' },
        ]),
      };

      mockDb.selectFrom
        .mockReturnValueOnce(mockTournamentQuery as any)
        .mockReturnValueOnce(mockTeamGroupQuery as any);

      await expect(
        updateGroupPositionsJsonb('group-1', 'tournament-1', invalidPositionUpdates)
      ).rejects.toThrow('La posición predicha debe ser al menos 1');
    });

    it('should reject if positions are not unique', async () => {
      const duplicatePositionUpdates = [
        { teamId: 'team-1', position: 1, qualifies: true },
        { teamId: 'team-2', position: 1, qualifies: true }, // Duplicate position
      ];

      // Mock tournament query
      const mockTournamentQuery = {
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(mockTournament),
      };

      // Mock team-group validation query
      const mockTeamGroupQuery = {
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue([
          { team_id: 'team-1' },
          { team_id: 'team-2' },
        ]),
      };

      mockDb.selectFrom
        .mockReturnValueOnce(mockTournamentQuery as any)
        .mockReturnValueOnce(mockTeamGroupQuery as any);

      await expect(
        updateGroupPositionsJsonb('group-1', 'tournament-1', duplicatePositionUpdates)
      ).rejects.toThrow('Las posiciones deben ser únicas dentro del grupo');
    });

    it('should reject if teams in positions 1-2 are not marked as qualified', async () => {
      const invalidQualificationUpdates = [
        { teamId: 'team-1', position: 1, qualifies: false }, // Position 1 must qualify
        { teamId: 'team-2', position: 2, qualifies: true },
      ];

      mockGetAllUserGroupPositions.mockResolvedValue([]);

      // Mock tournament query
      const mockTournamentQuery = {
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(mockTournament),
      };

      // Mock team-group validation query
      const mockTeamGroupQuery = {
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue([
          { team_id: 'team-1' },
          { team_id: 'team-2' },
        ]),
      };

      mockDb.selectFrom
        .mockReturnValueOnce(mockTournamentQuery as any)
        .mockReturnValueOnce(mockTeamGroupQuery as any);

      await expect(
        updateGroupPositionsJsonb('group-1', 'tournament-1', invalidQualificationUpdates)
      ).rejects.toThrow('Los equipos en posiciones 1-2 deben estar marcados como clasificados');
    });

    it('should reject if duplicate team IDs are provided', async () => {
      const duplicateTeamUpdates = [
        { teamId: 'team-1', position: 1, qualifies: true },
        { teamId: 'team-1', position: 2, qualifies: true }, // Duplicate team
      ];

      mockGetAllUserGroupPositions.mockResolvedValue([]);

      // Mock tournament query
      const mockTournamentQuery = {
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(mockTournament),
      };

      // Mock team-group validation query - return 2 results (matching the input length)
      const mockTeamGroupQuery = {
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue([
          { team_id: 'team-1' },
          { team_id: 'team-1' }, // Duplicate, so validateNoDuplicateTeams will catch it
        ]),
      };

      mockDb.selectFrom
        .mockReturnValueOnce(mockTournamentQuery as any)
        .mockReturnValueOnce(mockTeamGroupQuery as any);

      await expect(
        updateGroupPositionsJsonb('group-1', 'tournament-1', duplicateTeamUpdates)
      ).rejects.toThrow('No se puede asignar el mismo equipo a múltiples posiciones');
    });

    it('should reject if third place qualifiers exceed maximum allowed', async () => {
      const thirdPlaceUpdates = [
        { teamId: 'team-1', position: 1, qualifies: true },
        { teamId: 'team-2', position: 2, qualifies: true },
        { teamId: 'team-3', position: 3, qualifies: true }, // Third place qualifier
      ];

      // Mock tournament with max 0 third place qualifiers
      const restrictiveTournament = {
        ...mockTournament,
        allows_third_place_qualification: true,
        max_third_place_qualifiers: 0,
      };

      // Mock getAllUserGroupPositionsPredictions to return empty array (no other groups)
      mockGetAllUserGroupPositions.mockResolvedValue([]);

      // Mock tournament query
      const mockTournamentQuery = {
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(restrictiveTournament),
      };

      // Mock team-group validation query
      const mockTeamGroupQuery = {
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue([
          { team_id: 'team-1' },
          { team_id: 'team-2' },
          { team_id: 'team-3' },
        ]),
      };

      mockDb.selectFrom
        .mockReturnValueOnce(mockTournamentQuery as any)
        .mockReturnValueOnce(mockTeamGroupQuery as any);

      await expect(
        updateGroupPositionsJsonb('group-1', 'tournament-1', thirdPlaceUpdates)
      ).rejects.toThrow(/Máximo.*clasificados de tercer lugar permitidos/);
    });

    it('should handle successful update with valid data', async () => {
      mockUpsertGroupPositions.mockResolvedValue(undefined);
      mockGetAllUserGroupPositions.mockResolvedValue([]);

      // Mock tournament query
      const mockTournamentQuery = {
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(mockTournament),
      };

      // Mock team-group validation query
      const mockTeamGroupQuery = {
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue([
          { team_id: 'team-1' },
          { team_id: 'team-2' },
          { team_id: 'team-3' },
        ]),
      };

      mockDb.selectFrom
        .mockReturnValueOnce(mockTournamentQuery as any)
        .mockReturnValueOnce(mockTeamGroupQuery as any);

      const result = await updateGroupPositionsJsonb('group-1', 'tournament-1', positionUpdates);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Actualizadas');
      expect(result.message).toContain('predicciones exitosamente');
    });

    it('should handle database errors during upsert', async () => {
      mockUpsertGroupPositions.mockRejectedValue(new Error('Database error'));
      mockGetAllUserGroupPositions.mockResolvedValue([]);

      // Mock tournament query
      const mockTournamentQuery = {
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(mockTournament),
      };

      // Mock team-group validation query
      const mockTeamGroupQuery = {
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue([
          { team_id: 'team-1' },
          { team_id: 'team-2' },
          { team_id: 'team-3' },
        ]),
      };

      mockDb.selectFrom
        .mockReturnValueOnce(mockTournamentQuery as any)
        .mockReturnValueOnce(mockTeamGroupQuery as any);

      await expect(
        updateGroupPositionsJsonb('group-1', 'tournament-1', positionUpdates)
      ).rejects.toThrow('Error al guardar las predicciones');
    });
  });
});
