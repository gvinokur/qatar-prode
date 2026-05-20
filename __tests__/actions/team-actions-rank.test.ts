import { vi, describe, it, expect, beforeEach } from 'vitest';
import { createTeam, updateTeam } from '../../app/actions/team-actions';
import { testFactories } from '../db/test-factories';

vi.mock('../../auth', () => ({
  auth: vi.fn(),
}));

vi.mock('../../app/actions/user-actions', () => ({
  getLoggedInUser: vi.fn(),
}));

vi.mock('../../app/db/team-repository', () => ({
  createTeam: vi.fn(),
  updateTeam: vi.fn(),
  findTeamInTournament: vi.fn(),
}));

vi.mock('../../app/db/tournament-repository', () => ({
  createTournamentTeam: vi.fn(),
}));

vi.mock('../../app/actions/s3', () => ({
  createS3Client: vi.fn(() => ({
    uploadFile: vi.fn(),
    deleteFile: vi.fn(),
  })),
  deleteThemeLogoFromS3: vi.fn(),
}));

vi.mock('next-intl/server', () => ({
  getLocale: vi.fn().mockResolvedValue('en'),
}));

vi.mock('../../app/utils/localization-helper', () => ({
  applyLocalization: vi.fn((entity: unknown) => entity),
  applyLocalizationBatch: vi.fn((entities: unknown[]) => entities),
}));

import { getLoggedInUser } from '../../app/actions/user-actions';
import {
  createTeam as createTeamInDb,
  updateTeam as updateTeaminDb,
} from '../../app/db/team-repository';
import { createTournamentTeam } from '../../app/db/tournament-repository';

const mockGetLoggedInUser = vi.mocked(getLoggedInUser);
const mockCreateTeamInDb = vi.mocked(createTeamInDb);
const mockUpdateTeaminDb = vi.mocked(updateTeaminDb);
const mockCreateTournamentTeam = vi.mocked(createTournamentTeam);

const makeFormData = (rank: number | null | undefined, extra?: Record<string, string>) => {
  const fd = new FormData();
  fd.append(
    'team',
    JSON.stringify({
      name: 'Test Team',
      short_name: 'TST',
      theme: { primary_color: '#000', secondary_color: '#fff' },
      rank,
      ...extra,
    })
  );
  return fd;
};

describe('Team Actions — rank validation', () => {
  const adminUser = { id: 'admin-1', email: 'admin@example.com', isAdmin: true };
  const regularUser = { id: 'user-1', email: 'user@example.com', isAdmin: false };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateTournamentTeam.mockResolvedValue(undefined as any);
  });

  // ─── createTeam ──────────────────────────────────────────────────────────────

  describe('createTeam', () => {
    beforeEach(() => {
      mockGetLoggedInUser.mockResolvedValue(adminUser as any);
    });

    it('throws validation error when rank is 0', async () => {
      await expect(createTeam(makeFormData(0), 'tournament-1')).rejects.toThrow(
        'Rank must be between 1 and 999'
      );
    });

    it('throws validation error when rank is 1000', async () => {
      await expect(createTeam(makeFormData(1000), 'tournament-1')).rejects.toThrow(
        'Rank must be between 1 and 999'
      );
    });

    it('throws validation error when rank is negative', async () => {
      await expect(createTeam(makeFormData(-5), 'tournament-1')).rejects.toThrow(
        'Rank must be between 1 and 999'
      );
    });

    it('accepts rank of null (unranked)', async () => {
      mockCreateTeamInDb.mockResolvedValue(testFactories.team({ rank: null }) as any);
      await expect(createTeam(makeFormData(null), 'tournament-1')).resolves.toBeDefined();
    });

    it('accepts rank = 1 (lower boundary)', async () => {
      mockCreateTeamInDb.mockResolvedValue(testFactories.team({ rank: 1 }) as any);
      await expect(createTeam(makeFormData(1), 'tournament-1')).resolves.toBeDefined();
    });

    it('accepts rank = 999 (upper boundary)', async () => {
      mockCreateTeamInDb.mockResolvedValue(testFactories.team({ rank: 999 }) as any);
      await expect(createTeam(makeFormData(999), 'tournament-1')).resolves.toBeDefined();
    });
  });

  // ─── updateTeam ──────────────────────────────────────────────────────────────

  describe('updateTeam', () => {
    it('throws Unauthorized when user is not admin (before rank validation runs)', async () => {
      mockGetLoggedInUser.mockResolvedValue(regularUser as any);
      // Pass an invalid rank to confirm auth runs first
      await expect(updateTeam('team-1', makeFormData(0))).rejects.toThrow('Unauthorized');
    });

    it('throws validation error when rank is 0', async () => {
      mockGetLoggedInUser.mockResolvedValue(adminUser as any);
      await expect(updateTeam('team-1', makeFormData(0))).rejects.toThrow(
        'Rank must be between 1 and 999'
      );
    });

    it('throws validation error when rank is 1000', async () => {
      mockGetLoggedInUser.mockResolvedValue(adminUser as any);
      await expect(updateTeam('team-1', makeFormData(1000))).rejects.toThrow(
        'Rank must be between 1 and 999'
      );
    });

    it('accepts rank of null (unranked, clears the field)', async () => {
      mockGetLoggedInUser.mockResolvedValue(adminUser as any);
      mockUpdateTeaminDb.mockResolvedValue(testFactories.team({ rank: null }) as any);
      await expect(updateTeam('team-1', makeFormData(null))).resolves.toBeDefined();
    });

    it('accepts rank = 1 (lower boundary)', async () => {
      mockGetLoggedInUser.mockResolvedValue(adminUser as any);
      mockUpdateTeaminDb.mockResolvedValue(testFactories.team({ rank: 1 }) as any);
      await expect(updateTeam('team-1', makeFormData(1))).resolves.toBeDefined();
    });

    it('accepts rank = 999 (upper boundary)', async () => {
      mockGetLoggedInUser.mockResolvedValue(adminUser as any);
      mockUpdateTeaminDb.mockResolvedValue(testFactories.team({ rank: 999 }) as any);
      await expect(updateTeam('team-1', makeFormData(999))).resolves.toBeDefined();
    });
  });
});
