import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  updateTournamentTeamPlayer,
  deleteSpecificTeamPlayers,
} from '../../app/actions/team-actions';

// Mock auth module
vi.mock('../../auth', () => ({
  auth: vi.fn(),
}));

// Mock user actions
vi.mock('../../app/actions/user-actions', () => ({
  getLoggedInUser: vi.fn(),
}));

// Mock player repository
vi.mock('../../app/db/player-repository', () => ({
  updatePlayer: vi.fn(),
  deletePlayer: vi.fn(),
  createPlayer: vi.fn(),
  findAllPlayersInTournamentWithTeamData: vi.fn(),
  deleteAllPlayersInTournamentTeam: vi.fn(),
}));

// Mock tournament-guess-repository
vi.mock('../../app/db/tournament-guess-repository', () => ({
  clearPlayerAwardSelections: vi.fn(),
}));

// Mock team repository (required by team-actions module)
vi.mock('../../app/db/team-repository', () => ({
  createTeam: vi.fn(),
  updateTeam: vi.fn(),
  findTeamInTournament: vi.fn(),
}));

// Mock tournament-repository (required by team-actions module)
vi.mock('../../app/db/tournament-repository', () => ({
  createTournamentTeam: vi.fn(),
}));

// Mock tournament actions
vi.mock('../../app/actions/tournament-actions', () => ({
  getTournamentStartDate: vi.fn(),
}));

// Mock S3 actions
vi.mock('../../app/actions/s3', () => ({
  createS3Client: vi.fn(() => ({
    uploadFile: vi.fn(),
    deleteFile: vi.fn(),
  })),
  deleteThemeLogoFromS3: vi.fn(),
}));

// Mock next-intl
vi.mock('next-intl/server', () => ({
  getLocale: vi.fn(() => 'es'),
}));

import { getLoggedInUser } from '../../app/actions/user-actions';
import { updatePlayer, deletePlayer } from '../../app/db/player-repository';
import { clearPlayerAwardSelections } from '../../app/db/tournament-guess-repository';

const mockGetLoggedInUser = vi.mocked(getLoggedInUser);
const mockUpdatePlayer = vi.mocked(updatePlayer);
const mockDeletePlayer = vi.mocked(deletePlayer);
const mockClearPlayerAwardSelections = vi.mocked(clearPlayerAwardSelections);

const mockAdminUser = {
  id: 'admin-1',
  email: 'admin@example.com',
  isAdmin: true,
};

const mockRegularUser = {
  id: 'user-1',
  email: 'user@example.com',
  isAdmin: false,
};

describe('Team Actions - Player Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('updateTournamentTeamPlayer', () => {
    it('should throw Unauthorized when user is not admin', async () => {
      mockGetLoggedInUser.mockResolvedValue(mockRegularUser as any);

      await expect(
        updateTournamentTeamPlayer('player-1', { age_at_tournament: 25, position: 'GK' })
      ).rejects.toThrow('Unauthorized: Only administrators can access this data');
    });

    it('should throw Unauthorized when no user is logged in', async () => {
      mockGetLoggedInUser.mockResolvedValue(null);

      await expect(
        updateTournamentTeamPlayer('player-1', { age_at_tournament: 25, position: 'GK' })
      ).rejects.toThrow();
    });

    it('should call updatePlayer with the correct playerId and data', async () => {
      mockGetLoggedInUser.mockResolvedValue(mockAdminUser as any);
      mockUpdatePlayer.mockResolvedValue(undefined as any);

      await updateTournamentTeamPlayer('player-1', { age_at_tournament: 28, position: 'DF' });

      expect(mockUpdatePlayer).toHaveBeenCalledWith('player-1', {
        age_at_tournament: 28,
        position: 'DF',
      });
    });

    it('should update age_at_tournament when it has changed', async () => {
      mockGetLoggedInUser.mockResolvedValue(mockAdminUser as any);
      mockUpdatePlayer.mockResolvedValue(undefined as any);

      await updateTournamentTeamPlayer('player-99', { age_at_tournament: 32, position: 'FW' });

      expect(mockUpdatePlayer).toHaveBeenCalledWith(
        'player-99',
        expect.objectContaining({ age_at_tournament: 32 })
      );
    });

    it('should update position when it has changed', async () => {
      mockGetLoggedInUser.mockResolvedValue(mockAdminUser as any);
      mockUpdatePlayer.mockResolvedValue(undefined as any);

      await updateTournamentTeamPlayer('player-99', { age_at_tournament: 25, position: 'MF' });

      expect(mockUpdatePlayer).toHaveBeenCalledWith(
        'player-99',
        expect.objectContaining({ position: 'MF' })
      );
    });
  });

  describe('deleteSpecificTeamPlayers', () => {
    it('should throw Unauthorized when user is not admin', async () => {
      mockGetLoggedInUser.mockResolvedValue(mockRegularUser as any);

      await expect(
        deleteSpecificTeamPlayers('tournament-1', 'team-1', ['player-1'])
      ).rejects.toThrow('Unauthorized: Only administrators can access this data');
    });

    it('should throw Unauthorized when no user is logged in', async () => {
      mockGetLoggedInUser.mockResolvedValue(null);

      await expect(
        deleteSpecificTeamPlayers('tournament-1', 'team-1', ['player-1'])
      ).rejects.toThrow();
    });

    it('should no-op when playerIds is empty', async () => {
      mockGetLoggedInUser.mockResolvedValue(mockAdminUser as any);

      await deleteSpecificTeamPlayers('tournament-1', 'team-1', []);

      expect(mockClearPlayerAwardSelections).not.toHaveBeenCalled();
      expect(mockDeletePlayer).not.toHaveBeenCalled();
    });

    it('should call clearPlayerAwardSelections before deleting players', async () => {
      mockGetLoggedInUser.mockResolvedValue(mockAdminUser as any);
      mockClearPlayerAwardSelections.mockResolvedValue(undefined);
      mockDeletePlayer.mockResolvedValue(undefined as any);

      const callOrder: string[] = [];
      mockClearPlayerAwardSelections.mockImplementation(async () => {
        callOrder.push('clearAwards');
      });
      mockDeletePlayer.mockImplementation(async () => {
        callOrder.push('deletePlayer');
        return undefined as any;
      });

      await deleteSpecificTeamPlayers('tournament-1', 'team-1', ['player-1']);

      expect(callOrder[0]).toBe('clearAwards');
      expect(callOrder).toContain('deletePlayer');
    });

    it('should call clearPlayerAwardSelections with the given player IDs', async () => {
      mockGetLoggedInUser.mockResolvedValue(mockAdminUser as any);
      mockClearPlayerAwardSelections.mockResolvedValue(undefined);
      mockDeletePlayer.mockResolvedValue(undefined as any);

      await deleteSpecificTeamPlayers('tournament-1', 'team-1', ['player-1', 'player-2']);

      expect(mockClearPlayerAwardSelections).toHaveBeenCalledWith(['player-1', 'player-2']);
    });

    it('should call deletePlayer for each specified player ID', async () => {
      mockGetLoggedInUser.mockResolvedValue(mockAdminUser as any);
      mockClearPlayerAwardSelections.mockResolvedValue(undefined);
      mockDeletePlayer.mockResolvedValue(undefined as any);

      await deleteSpecificTeamPlayers('tournament-1', 'team-1', ['player-1', 'player-2']);

      expect(mockDeletePlayer).toHaveBeenCalledWith('player-1');
      expect(mockDeletePlayer).toHaveBeenCalledWith('player-2');
      expect(mockDeletePlayer).toHaveBeenCalledTimes(2);
    });
  });
});
