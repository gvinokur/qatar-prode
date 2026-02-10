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
  });
});
