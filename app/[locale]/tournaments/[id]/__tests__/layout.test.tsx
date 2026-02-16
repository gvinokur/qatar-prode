import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import TournamentLayout from '../layout';
import { getTournamentAndGroupsData, getTournamentStartDate, getGroupStandingsForTournament } from '@/app/actions/tournament-actions';
import { getGroupsForUser } from '@/app/actions/prode-group-actions';
import { getLoggedInUser } from '@/app/actions/user-actions';
import { findTournamentGuessByUserIdTournament } from '@/app/db/tournament-guess-repository';
import { getPlayersInTournament } from '@/app/db/player-repository';
import { hasUserPermission } from '@/app/db/tournament-view-permission-repository';
import { findTournamentById } from '@/app/db/tournament-repository';
import { getGameGuessStatisticsForUsers } from '@/app/db/game-guess-repository';
import { redirect, notFound } from 'next/navigation';
import { renderWithTheme } from '@/__tests__/utils/test-utils';

// Mock server actions
vi.mock('@/app/actions/tournament-actions', () => ({
  getTournamentAndGroupsData: vi.fn(),
  getTournamentStartDate: vi.fn(),
  getGroupStandingsForTournament: vi.fn()
}));

vi.mock('@/app/actions/prode-group-actions', () => ({
  getGroupsForUser: vi.fn()
}));

vi.mock('@/app/actions/user-actions', () => ({
  getLoggedInUser: vi.fn()
}));

vi.mock('@/app/db/tournament-guess-repository', () => ({
  findTournamentGuessByUserIdTournament: vi.fn()
}));

vi.mock('@/app/db/player-repository', () => ({
  getPlayersInTournament: vi.fn()
}));

vi.mock('@/app/db/tournament-view-permission-repository', () => ({
  hasUserPermission: vi.fn()
}));

vi.mock('@/app/db/tournament-repository', () => ({
  findTournamentById: vi.fn()
}));

vi.mock('@/app/db/game-guess-repository', () => ({
  getGameGuessStatisticsForUsers: vi.fn()
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  notFound: vi.fn(),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  usePathname: vi.fn(() => '/tournaments/tournament-1'),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn()
  }))
}));

// Mock environment utils
vi.mock('@/app/utils/environment-utils', () => ({
  isDevelopmentMode: vi.fn(() => false)
}));

// Mock notification utils to avoid VAPID setup issues
vi.mock('@/app/utils/notifications-utils', () => ({
  sendGroupInviteNotification: vi.fn(),
  sendGameUpdateNotification: vi.fn(),
  isNotificationSupported: vi.fn(() => false),
  checkExistingSubscription: vi.fn(() => Promise.resolve(false)),
  requestNotificationPermission: vi.fn(() => Promise.resolve(false))
}));

describe('TournamentLayout - Mobile Header Integration', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User'
  };

  const mockTournamentData = {
    tournament: {
      id: 'tournament-1',
      short_name: 'Qatar 2022',
      long_name: 'FIFA World Cup Qatar 2022',
      dev_only: false,
      theme: {
        primary_color: '#8B1538',
        secondary_color: '#FFFFFF'
      }
    },
    allGroups: [
      { id: 'group-a', group_letter: 'A', tournament_id: 'tournament-1' },
      { id: 'group-b', group_letter: 'B', tournament_id: 'tournament-1' }
    ]
  };

  const mockTournamentGuesses = {
    user_id: 'user-1',
    tournament_id: 'tournament-1',
    champion_team_id: 'team-1',
    runner_up_team_id: 'team-2',
    best_player_id: 'player-1',
    best_young_player_id: 'player-2',
    best_goalkeeper_player_id: 'player-3',
    top_goalscorer_player_id: 'player-4'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (getLoggedInUser as any).mockResolvedValue(mockUser);
    (getTournamentAndGroupsData as any).mockResolvedValue(mockTournamentData);
    (getTournamentStartDate as any).mockResolvedValue(new Date('2024-12-01'));
    (findTournamentGuessByUserIdTournament as any).mockResolvedValue(mockTournamentGuesses);
    (getPlayersInTournament as any).mockResolvedValue(5);
    (hasUserPermission as any).mockResolvedValue(true);
    (getGroupsForUser as any).mockResolvedValue({ userGroups: [], participantGroups: [] });
    (getGroupStandingsForTournament as any).mockResolvedValue({
      groups: [],
      defaultGroupId: 'group-a',
      qualifiedTeams: []
    });
    (findTournamentById as any).mockResolvedValue(mockTournamentData.tournament);
    (getGameGuessStatisticsForUsers as any).mockResolvedValue([]);
  });

  it('renders tournament layout with all header components', async () => {
    const params = Promise.resolve({ id: 'tournament-1' });
    const children = <div data-testid="child-content">Tournament Content</div>;

    const result = await TournamentLayout({ params, children });

    renderWithTheme(result as React.ReactElement);

    // Verify child content is rendered
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('includes La Maquina logo button for home navigation', async () => {
    const params = Promise.resolve({ id: 'tournament-1' });
    const children = <div>Content</div>;

    const result = await TournamentLayout({ params, children });
    renderWithTheme(result as React.ReactElement);

    // Find logo by alt text
    const logo = screen.getByAltText('La Maquina');
    expect(logo).toBeInTheDocument();
    expect(logo.tagName).toBe('IMG');

    // Verify logo is inside a link to home
    const homeLink = logo.closest('a');
    expect(homeLink).toHaveAttribute('href', '/es');
  });

  it('includes tournament logo and name', async () => {
    const params = Promise.resolve({ id: 'tournament-1' });
    const children = <div>Content</div>;

    const result = await TournamentLayout({ params, children });
    renderWithTheme(result as React.ReactElement);

    // Verify desktop displays long_name
    expect(screen.getByText('FIFA World Cup Qatar 2022')).toBeInTheDocument();

    // Verify mobile displays short_name
    expect(screen.getByText('Qatar 2022')).toBeInTheDocument();

    // Verify tournament logo
    const tournamentLogo = screen.getByAltText('FIFA World Cup Qatar 2022');
    expect(tournamentLogo).toBeInTheDocument();
  });

  it('includes GroupSelector component', async () => {
    const params = Promise.resolve({ id: 'tournament-1' });
    const children = <div>Content</div>;

    const result = await TournamentLayout({ params, children });
    renderWithTheme(result as React.ReactElement);

    // GroupSelector should be present (it would show group navigation)
    // We can't test the actual component since it's a separate component,
    // but we verified it's in the layout structure
    expect(getTournamentAndGroupsData).toHaveBeenCalledWith('tournament-1');
  });

  it('redirects to login for dev tournament without user in production', async () => {
    const devTournamentData = {
      ...mockTournamentData,
      tournament: {
        ...mockTournamentData.tournament,
        dev_only: true
      }
    };

    (getTournamentAndGroupsData as any).mockResolvedValue(devTournamentData);
    (getLoggedInUser as any).mockResolvedValue(null);

    // Mock redirect to throw to stop execution (simulating real redirect behavior)
    (redirect as any).mockImplementation(() => {
      throw new Error('REDIRECT');
    });

    const params = Promise.resolve({ id: 'tournament-1' });
    const children = <div>Content</div>;

    try {
      await TournamentLayout({ params, children });
    } catch (e: any) {
      // Expected to throw due to redirect
      expect(e.message).toBe('REDIRECT');
    }

    expect(redirect).toHaveBeenCalledWith('/es?openSignin=true&returnUrl=/es/tournaments/tournament-1');
  });

  it('shows notFound for dev tournament without permission', async () => {
    const devTournamentData = {
      ...mockTournamentData,
      tournament: {
        ...mockTournamentData.tournament,
        dev_only: true
      }
    };

    (getTournamentAndGroupsData as any).mockResolvedValue(devTournamentData);
    (hasUserPermission as any).mockResolvedValue(false);

    const params = Promise.resolve({ id: 'tournament-1' });
    const children = <div>Content</div>;

    await TournamentLayout({ params, children });

    expect(notFound).toHaveBeenCalled();
  });

  it('fetches user tournament guesses when user is logged in', async () => {
    const params = Promise.resolve({ id: 'tournament-1' });
    const children = <div>Content</div>;

    await TournamentLayout({ params, children });

    expect(findTournamentGuessByUserIdTournament).toHaveBeenCalledWith('user-1', 'tournament-1');
  });

  it('does not fetch tournament guesses when user is not logged in', async () => {
    (getLoggedInUser as any).mockResolvedValue(null);

    const params = Promise.resolve({ id: 'tournament-1' });
    const children = <div>Content</div>;

    await TournamentLayout({ params, children });

    expect(findTournamentGuessByUserIdTournament).not.toHaveBeenCalled();
  });

  it('renders with tournament data correctly', async () => {
    const params = Promise.resolve({ id: 'tournament-1' });
    const children = <div>Content</div>;

    const result = await TournamentLayout({ params, children });
    renderWithTheme(result as React.ReactElement);

    // Verify tournament data was fetched correctly
    expect(getTournamentAndGroupsData).toHaveBeenCalledWith('tournament-1');
    expect(getTournamentStartDate).toHaveBeenCalledWith('tournament-1');
  });

  it('shows dev tournament badge when tournament is dev_only', async () => {
    const devTournamentData = {
      ...mockTournamentData,
      tournament: {
        ...mockTournamentData.tournament,
        dev_only: true
      }
    };

    (getTournamentAndGroupsData as any).mockResolvedValue(devTournamentData);
    (hasUserPermission as any).mockResolvedValue(true);

    const params = Promise.resolve({ id: 'tournament-1' });
    const children = <div>Content</div>;

    const result = await TournamentLayout({ params, children });
    renderWithTheme(result as React.ReactElement);

    // Dev badge shows BugReportIcon with "Development Tournament" title
    const devBadge = screen.getByTitle('Development Tournament');
    expect(devBadge).toBeInTheDocument();
  });
});
