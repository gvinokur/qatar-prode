import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import TournamentGroupsPage from '@/app/[locale]/tournaments/[id]/friend-groups/page';
import { getGroupsForUser, calculateTournamentGroupStats } from '@/app/actions/prode-group-actions';
import { getLoggedInUser } from '@/app/actions/user-actions';
import { redirect } from 'next/navigation';
import { renderWithTheme } from '@/__tests__/utils/test-utils';

vi.mock('@/app/actions/prode-group-actions', () => ({
  getGroupsForUser: vi.fn(),
  calculateTournamentGroupStats: vi.fn()
}));

vi.mock('@/app/actions/user-actions', () => ({
  getLoggedInUser: vi.fn()
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn()
}));

describe('TournamentGroupsPage', () => {
  const mockUser = { id: 'user-1', email: 'test@example.com' };
  const mockUserGroups = [
    { id: 'group-1', name: 'My Group', owner_user_id: 'user-1' }
  ];
  const mockParticipantGroups = [
    { id: 'group-2', name: 'Friend Group', owner_user_id: 'user-2' }
  ];

  const mockGroupStats = {
    groupId: 'group-1',
    groupName: 'My Group',
    isOwner: true,
    totalParticipants: 5,
    userPosition: 1,
    userPoints: 50,
    leaderName: 'You',
    leaderPoints: 50,
    themeColor: null
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to login if user is not logged in', async () => {
    (getLoggedInUser as any).mockResolvedValue(null);

    const params = Promise.resolve({ id: 'tournament-1' });
    await TournamentGroupsPage({ params });

    expect(redirect).toHaveBeenCalledWith('/es/login?redirect=/es/tournaments/tournament-1/friend-groups');
  });

  it('redirects to tournament page if no groups data', async () => {
    (getLoggedInUser as any).mockResolvedValue(mockUser);
    (getGroupsForUser as any).mockResolvedValue(null);

    const params = Promise.resolve({ id: 'tournament-1' });
    await TournamentGroupsPage({ params });

    expect(redirect).toHaveBeenCalledWith('/es/tournaments/tournament-1');
  });

  it('fetches groups for logged in user', async () => {
    (getLoggedInUser as any).mockResolvedValue(mockUser);
    (getGroupsForUser as any).mockResolvedValue({
      userGroups: mockUserGroups,
      participantGroups: mockParticipantGroups
    });
    (calculateTournamentGroupStats as any).mockResolvedValue(mockGroupStats);

    const params = Promise.resolve({ id: 'tournament-1' });
    await TournamentGroupsPage({ params });

    expect(getLoggedInUser).toHaveBeenCalled();
    expect(getGroupsForUser).toHaveBeenCalled();
  });

  it('calculates stats for each group', async () => {
    (getLoggedInUser as any).mockResolvedValue(mockUser);
    (getGroupsForUser as any).mockResolvedValue({
      userGroups: mockUserGroups,
      participantGroups: mockParticipantGroups
    });
    (calculateTournamentGroupStats as any).mockResolvedValue(mockGroupStats);

    const params = Promise.resolve({ id: 'tournament-1' });
    const result = await TournamentGroupsPage({ params });

    // Should call calculateTournamentGroupStats for each group (2 total)
    expect(calculateTournamentGroupStats).toHaveBeenCalledTimes(2);
    expect(calculateTournamentGroupStats).toHaveBeenCalledWith('group-1', 'tournament-1', 'user-1');
    expect(calculateTournamentGroupStats).toHaveBeenCalledWith('group-2', 'tournament-1', 'user-1');
  });

  it('renders TournamentGroupsList with calculated stats', async () => {
    (getLoggedInUser as any).mockResolvedValue(mockUser);
    (getGroupsForUser as any).mockResolvedValue({
      userGroups: mockUserGroups,
      participantGroups: []
    });
    (calculateTournamentGroupStats as any).mockResolvedValue(mockGroupStats);

    const params = Promise.resolve({ id: 'tournament-1' });
    const result = await TournamentGroupsPage({ params });

    // Component should be returned
    expect(result).toBeDefined();
  });

  it('handles empty groups list', async () => {
    (getLoggedInUser as any).mockResolvedValue(mockUser);
    (getGroupsForUser as any).mockResolvedValue({
      userGroups: [],
      participantGroups: []
    });

    const params = Promise.resolve({ id: 'tournament-1' });
    const result = await TournamentGroupsPage({ params });

    // Should not call calculateTournamentGroupStats for no groups
    expect(calculateTournamentGroupStats).not.toHaveBeenCalled();
    expect(result).toBeDefined();
  });
});
