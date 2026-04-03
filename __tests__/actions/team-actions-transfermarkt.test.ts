import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  saveTeamTransfermarktId,
  getTransfermarktPlayerData
} from '../../app/actions/team-actions';
import { testFactories } from '../db/test-factories';

// Mock auth module
vi.mock('../../auth', () => ({
  auth: vi.fn(),
}));

// Mock user actions
vi.mock('../../app/actions/user-actions', () => ({
  getLoggedInUser: vi.fn(),
}));

// Mock team repository
vi.mock('../../app/db/team-repository', () => ({
  updateTeam: vi.fn(),
}));

// Mock tournament actions
vi.mock('../../app/actions/tournament-actions', () => ({
  getTournamentStartDate: vi.fn(),
}));

// Mock global fetch
global.fetch = vi.fn();

import { getLoggedInUser } from '../../app/actions/user-actions';
import { updateTeam as updateTeaminDb } from '../../app/db/team-repository';
import { getTournamentStartDate } from '../../app/actions/tournament-actions';

const mockGetLoggedInUser = vi.mocked(getLoggedInUser);
const mockUpdateTeaminDb = vi.mocked(updateTeaminDb);
const mockGetTournamentStartDate = vi.mocked(getTournamentStartDate);
const mockFetch = vi.mocked(global.fetch);

describe('Team Actions - Transfermarkt Integration', () => {
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

  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateTeaminDb.mockResolvedValue(undefined as any);
    mockGetTournamentStartDate.mockResolvedValue(new Date('2024-06-14'));
  });

  describe('saveTeamTransfermarktId', () => {
    it('should throw Unauthorized when user is not admin', async () => {
      mockGetLoggedInUser.mockResolvedValue(mockRegularUser as any);

      const teamId = 'team-1';
      const transfermarktId = '583';

      await expect(
        saveTeamTransfermarktId(teamId, transfermarktId)
      ).rejects.toThrow('Unauthorized: Only administrators can access this data');
    });

    it('should throw Unauthorized when user is not logged in', async () => {
      mockGetLoggedInUser.mockResolvedValue(null);

      const teamId = 'team-1';
      const transfermarktId = '583';

      await expect(
        saveTeamTransfermarktId(teamId, transfermarktId)
      ).rejects.toThrow();
    });

    it('should call updateTeaminDb with correct teamId and transfermarkt_id when admin', async () => {
      mockGetLoggedInUser.mockResolvedValue(mockAdminUser as any);

      const teamId = 'team-123';
      const transfermarktId = '583';

      await saveTeamTransfermarktId(teamId, transfermarktId);

      expect(mockUpdateTeaminDb).toHaveBeenCalledWith(teamId, {
        transfermarkt_id: transfermarktId,
      });
    });

    it('should not throw when called with valid inputs by admin user', async () => {
      mockGetLoggedInUser.mockResolvedValue(mockAdminUser as any);

      const teamId = 'team-1';
      const transfermarktId = '583';

      await expect(
        saveTeamTransfermarktId(teamId, transfermarktId)
      ).resolves.not.toThrow();
    });
  });

  describe('getTransfermarktPlayerData - URL Construction', () => {
    const mockHtmlResponse = `
      <html>
        <body>
          <table class="items">
            <tbody>
              <tr class="odd">
                <td title="Goalkeeper"></td>
                <td></td>
                <td>Jan 15, 1990</td>
                <td><table><tr><td class="hauptlink"><a>Player Name</a></td></tr></table></td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `;

    it('should throw Unauthorized when user is not admin', async () => {
      mockGetLoggedInUser.mockResolvedValue(mockRegularUser as any);

      await expect(
        getTransfermarktPlayerData('team-name', '583', 'tournament-1')
      ).rejects.toThrow('Unauthorized: Only administrators can access this data');
    });

    it('should use hardcoded club URL when urlTemplate is null', async () => {
      mockGetLoggedInUser.mockResolvedValue(mockAdminUser as any);
      mockFetch.mockResolvedValue(
        new Response(mockHtmlResponse, { status: 200 })
      );

      await getTransfermarktPlayerData('paris-saint-germain', '583', 'tournament-1', null);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://www.transfermarkt.com/paris-saint-germain/kader/verein/583/saison_id/2024/plus/1'),
        expect.any(Object)
      );
    });

    it('should use hardcoded club URL when urlTemplate is undefined', async () => {
      mockGetLoggedInUser.mockResolvedValue(mockAdminUser as any);
      mockFetch.mockResolvedValue(
        new Response(mockHtmlResponse, { status: 200 })
      );

      await getTransfermarktPlayerData('paris-saint-germain', '583', 'tournament-1', undefined);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://www.transfermarkt.com/paris-saint-germain/kader/verein/583/saison_id/2024/plus/1'),
        expect.any(Object)
      );
    });

    it('should use hardcoded club URL when urlTemplate is missing {teamId} placeholder', async () => {
      mockGetLoggedInUser.mockResolvedValue(mockAdminUser as any);
      mockFetch.mockResolvedValue(
        new Response(mockHtmlResponse, { status: 200 })
      );

      const invalidTemplate = 'https://www.transfermarkt.com/{teamName}/kader/verein/999/saison_id/2024/plus/1';

      await getTransfermarktPlayerData('paris-saint-germain', '583', 'tournament-1', invalidTemplate);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://www.transfermarkt.com/paris-saint-germain/kader/verein/583/saison_id/2024/plus/1'),
        expect.any(Object)
      );
    });

    it('should use hardcoded club URL when urlTemplate is missing {teamName} placeholder', async () => {
      mockGetLoggedInUser.mockResolvedValue(mockAdminUser as any);
      mockFetch.mockResolvedValue(
        new Response(mockHtmlResponse, { status: 200 })
      );

      const invalidTemplate = 'https://www.transfermarkt.com/fixed-team/kader/verein/{teamId}/saison_id/2024/plus/1';

      await getTransfermarktPlayerData('paris-saint-germain', '583', 'tournament-1', invalidTemplate);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://www.transfermarkt.com/paris-saint-germain/kader/verein/583/saison_id/2024/plus/1'),
        expect.any(Object)
      );
    });

    it('should substitute {teamName} and {teamId} when valid template is provided', async () => {
      mockGetLoggedInUser.mockResolvedValue(mockAdminUser as any);
      mockFetch.mockResolvedValue(
        new Response(mockHtmlResponse, { status: 200 })
      );

      const validTemplate = 'https://www.transfermarkt.com/{teamName}/kader/verein/{teamId}/saison_id/2025/plus/1';

      await getTransfermarktPlayerData('paris-saint-germain', '583', 'tournament-1', validTemplate);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://www.transfermarkt.com/paris-saint-germain/kader/verein/583/saison_id/2025/plus/1',
        expect.any(Object)
      );
    });

    it('should handle template with only {teamName} placeholder (missing {teamId} means use default)', async () => {
      mockGetLoggedInUser.mockResolvedValue(mockAdminUser as any);
      mockFetch.mockResolvedValue(
        new Response(mockHtmlResponse, { status: 200 })
      );

      const incompleteTemplate = 'https://example.com/{teamName}/squad';

      await getTransfermarktPlayerData('paris-saint-germain', '583', 'tournament-1', incompleteTemplate);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://www.transfermarkt.com/paris-saint-germain/kader/verein/583/saison_id/2024/plus/1'),
        expect.any(Object)
      );
    });

    it('should include User-Agent header in fetch request', async () => {
      mockGetLoggedInUser.mockResolvedValue(mockAdminUser as any);
      mockFetch.mockResolvedValue(
        new Response(mockHtmlResponse, { status: 200 })
      );

      await getTransfermarktPlayerData('paris-saint-germain', '583', 'tournament-1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': expect.stringContaining('Mozilla'),
          }),
        })
      );
    });
  });
});
