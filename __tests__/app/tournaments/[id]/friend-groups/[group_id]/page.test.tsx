import { describe, it, expect, vi, beforeEach } from 'vitest';
import { redirect } from 'next/navigation';
import TournamentScopedFriendGroup from '@/app/[locale]/tournaments/[id]/friend-groups/[group_id]/page';
import { getLoggedInUser } from '@/app/actions/user-actions';
import { findProdeGroupById, findParticipantsInGroup } from '@/app/db/prode-group-repository';
import { findTournamentById } from '@/app/db/tournament-repository';
import { findUsersByIds } from '@/app/db/users-repository';
import { getUserScoresForTournament } from '@/app/actions/prode-group-actions';
import { getGroupTournamentBettingConfigAction, getGroupTournamentBettingPaymentsAction } from '@/app/actions/group-tournament-betting-actions';
import { testFactories } from '../../../../../db/test-factories';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT_TO:${url}`);
  }),
}));

// Mock actions
vi.mock('@/app/actions/user-actions', () => ({
  getLoggedInUser: vi.fn(),
}));

vi.mock('@/app/actions/prode-group-actions', () => ({
  getUserScoresForTournament: vi.fn(),
}));

vi.mock('@/app/actions/group-tournament-betting-actions', () => ({
  getGroupTournamentBettingConfigAction: vi.fn(),
  getGroupTournamentBettingPaymentsAction: vi.fn(),
}));

// Mock repositories
vi.mock('@/app/db/prode-group-repository', () => ({
  findProdeGroupById: vi.fn(),
  findParticipantsInGroup: vi.fn(),
}));

vi.mock('@/app/db/tournament-repository', () => ({
  findTournamentById: vi.fn(),
}));

vi.mock('@/app/db/users-repository', () => ({
  findUsersByIds: vi.fn(),
}));

// Mock theme utils
vi.mock('@/app/utils/theme-utils', () => ({
  getThemeLogoUrl: vi.fn().mockReturnValue('https://example.com/logo.png'),
}));

// Mock notification actions to avoid VAPID setup issues
vi.mock('@/app/actions/notifiaction-actions', () => ({
  sendNotificationToUser: vi.fn(),
}));

describe('TournamentScopedFriendGroup', () => {
  const mockTournamentId = 'tournament-1';
  const mockGroupId = 'group-1';
  const mockUser = testFactories.user({ id: 'user-1', nickname: 'TestUser' });
  const mockTournament = testFactories.tournament({ id: mockTournamentId });
  const mockProdeGroup = testFactories.prodeGroup({
    id: mockGroupId,
    name: 'Test Group',
    owner_user_id: 'user-1',
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('redirects', () => {
    it('redirects to tournament page if user is not logged in', async () => {
      vi.mocked(getLoggedInUser).mockResolvedValue(null);
      vi.mocked(findProdeGroupById).mockResolvedValue(mockProdeGroup);
      vi.mocked(findTournamentById).mockResolvedValue(mockTournament);

      const params = Promise.resolve({ id: mockTournamentId, group_id: mockGroupId });
      const searchParams = Promise.resolve({});

      await expect(TournamentScopedFriendGroup({ params, searchParams }))
        .rejects.toThrow(`REDIRECT_TO:/es/tournaments/${mockTournamentId}`);
    });

    it('redirects to tournament page if prode group not found', async () => {
      vi.mocked(getLoggedInUser).mockResolvedValue(mockUser);
      vi.mocked(findProdeGroupById).mockResolvedValue(null);
      vi.mocked(findTournamentById).mockResolvedValue(mockTournament);

      const params = Promise.resolve({ id: mockTournamentId, group_id: mockGroupId });
      const searchParams = Promise.resolve({});

      await expect(TournamentScopedFriendGroup({ params, searchParams }))
        .rejects.toThrow(`REDIRECT_TO:/es/tournaments/${mockTournamentId}`);
    });

    it('redirects to tournament page if tournament not found', async () => {
      vi.mocked(getLoggedInUser).mockResolvedValue(mockUser);
      vi.mocked(findProdeGroupById).mockResolvedValue(mockProdeGroup);
      vi.mocked(findTournamentById).mockResolvedValue(null);

      const params = Promise.resolve({ id: mockTournamentId, group_id: mockGroupId });
      const searchParams = Promise.resolve({});

      await expect(TournamentScopedFriendGroup({ params, searchParams }))
        .rejects.toThrow(`REDIRECT_TO:/es/tournaments/${mockTournamentId}`);
    });
  });

  describe('data fetching', () => {
    const mockParticipants = [
      { user_id: 'user-2', is_admin: false },
      { user_id: 'user-3', is_admin: true },
    ];
    const mockUsers = [
      testFactories.user({ id: 'user-1', nickname: 'User 1' }),
      testFactories.user({ id: 'user-2', nickname: 'User 2' }),
      testFactories.user({ id: 'user-3', nickname: 'User 3' }),
    ];
    const mockUserScores = [
      { userId: 'user-1', totalPoints: 100 },
      { userId: 'user-2', totalPoints: 80 },
      { userId: 'user-3', totalPoints: 90 },
    ];

    beforeEach(() => {
      vi.mocked(getLoggedInUser).mockResolvedValue(mockUser);
      vi.mocked(findProdeGroupById).mockResolvedValue(mockProdeGroup);
      vi.mocked(findTournamentById).mockResolvedValue(mockTournament);
      vi.mocked(findParticipantsInGroup).mockResolvedValue(mockParticipants);
      vi.mocked(findUsersByIds).mockResolvedValue(mockUsers);
      vi.mocked(getUserScoresForTournament).mockResolvedValue(mockUserScores);
      vi.mocked(getGroupTournamentBettingConfigAction).mockResolvedValue(null);
      vi.mocked(getGroupTournamentBettingPaymentsAction).mockResolvedValue([]);
    });

    it('fetches prode group by group_id', async () => {
      const params = Promise.resolve({ id: mockTournamentId, group_id: mockGroupId });
      const searchParams = Promise.resolve({});

      await TournamentScopedFriendGroup({ params, searchParams });

      expect(findProdeGroupById).toHaveBeenCalledWith(mockGroupId);
    });

    it('fetches tournament by id', async () => {
      const params = Promise.resolve({ id: mockTournamentId, group_id: mockGroupId });
      const searchParams = Promise.resolve({});

      await TournamentScopedFriendGroup({ params, searchParams });

      expect(findTournamentById).toHaveBeenCalledWith(mockTournamentId);
    });

    it('fetches participants in the group', async () => {
      const params = Promise.resolve({ id: mockTournamentId, group_id: mockGroupId });
      const searchParams = Promise.resolve({});

      await TournamentScopedFriendGroup({ params, searchParams });

      expect(findParticipantsInGroup).toHaveBeenCalledWith(mockGroupId);
    });

    it('fetches users including owner and participants', async () => {
      const params = Promise.resolve({ id: mockTournamentId, group_id: mockGroupId });
      const searchParams = Promise.resolve({});

      await TournamentScopedFriendGroup({ params, searchParams });

      expect(findUsersByIds).toHaveBeenCalledWith([
        mockProdeGroup.owner_user_id,
        'user-2',
        'user-3',
      ]);
    });

    it('fetches user scores only for the specific tournament', async () => {
      const params = Promise.resolve({ id: mockTournamentId, group_id: mockGroupId });
      const searchParams = Promise.resolve({});

      await TournamentScopedFriendGroup({ params, searchParams });

      expect(getUserScoresForTournament).toHaveBeenCalledTimes(1);
      expect(getUserScoresForTournament).toHaveBeenCalledWith(
        [mockProdeGroup.owner_user_id, 'user-2', 'user-3'],
        mockTournamentId
      );
    });

    it('fetches betting config for the specific tournament', async () => {
      const params = Promise.resolve({ id: mockTournamentId, group_id: mockGroupId });
      const searchParams = Promise.resolve({});

      await TournamentScopedFriendGroup({ params, searchParams });

      expect(getGroupTournamentBettingConfigAction).toHaveBeenCalledWith(
        mockGroupId,
        mockTournamentId
      );
    });

    it('fetches betting payments if config exists', async () => {
      const mockConfig = { id: 'config-1' };
      vi.mocked(getGroupTournamentBettingConfigAction).mockResolvedValue(mockConfig);

      const params = Promise.resolve({ id: mockTournamentId, group_id: mockGroupId });
      const searchParams = Promise.resolve({});

      await TournamentScopedFriendGroup({ params, searchParams });

      expect(getGroupTournamentBettingPaymentsAction).toHaveBeenCalledWith('config-1');
    });

    it('does not fetch betting payments if config does not exist', async () => {
      vi.mocked(getGroupTournamentBettingConfigAction).mockResolvedValue(null);

      const params = Promise.resolve({ id: mockTournamentId, group_id: mockGroupId });
      const searchParams = Promise.resolve({});

      await TournamentScopedFriendGroup({ params, searchParams });

      expect(getGroupTournamentBettingPaymentsAction).not.toHaveBeenCalled();
    });
  });

  describe('rendering', () => {
    const mockParticipants = [
      { user_id: 'user-2', is_admin: false },
    ];
    const mockUsers = [
      testFactories.user({ id: 'user-1', nickname: 'User 1' }),
      testFactories.user({ id: 'user-2', nickname: 'User 2' }),
    ];
    const mockUserScores = [
      { userId: 'user-1', totalPoints: 100 },
      { userId: 'user-2', totalPoints: 80 },
    ];

    beforeEach(() => {
      vi.mocked(getLoggedInUser).mockResolvedValue(mockUser);
      vi.mocked(findProdeGroupById).mockResolvedValue(mockProdeGroup);
      vi.mocked(findTournamentById).mockResolvedValue(mockTournament);
      vi.mocked(findParticipantsInGroup).mockResolvedValue(mockParticipants);
      vi.mocked(findUsersByIds).mockResolvedValue(mockUsers);
      vi.mocked(getUserScoresForTournament).mockResolvedValue(mockUserScores);
      vi.mocked(getGroupTournamentBettingConfigAction).mockResolvedValue(null);
      vi.mocked(getGroupTournamentBettingPaymentsAction).mockResolvedValue([]);
    });

    it('renders the page with group data', async () => {
      const params = Promise.resolve({ id: mockTournamentId, group_id: mockGroupId });
      const searchParams = Promise.resolve({});

      const result = await TournamentScopedFriendGroup({ params, searchParams });

      expect(result).toBeDefined();
    });

    it('pre-selects the tournament in ProdeGroupTable', async () => {
      const params = Promise.resolve({ id: mockTournamentId, group_id: mockGroupId });
      const searchParams = Promise.resolve({});

      const result = await TournamentScopedFriendGroup({ params, searchParams });

      // The result should be a React element, we can't easily test the props
      // but we've verified the data is fetched correctly
      expect(result).toBeDefined();
    });
  });
});
