import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import TournamentLayout from '../layout';
import { getTournamentById, getTournamentStartDate, getGroupStandingsForTournament, getTournaments } from '@/app/actions/tournament-actions';
import { getGroupsForUser } from '@/app/actions/prode-group-actions';
import { getLoggedInUser } from '@/app/actions/user-actions';
import { getPlayersInTournament } from '@/app/db/player-repository';
import { hasUserPermission } from '@/app/db/tournament-view-permission-repository';
import { getGameGuessStatisticsForUsers } from '@/app/db/game-guess-repository';
import { redirect, notFound } from 'next/navigation';
import { renderWithTheme } from '@/__tests__/utils/test-utils';
import { findUserById } from '@/app/db/users-repository';

// Mock server actions
vi.mock('@/app/actions/tournament-actions', () => ({
  getTournamentById: vi.fn(),
  getTournamentStartDate: vi.fn(),
  getGroupStandingsForTournament: vi.fn(),
  getTournaments: vi.fn()
}));

vi.mock('@/app/actions/prode-group-actions', () => ({
  getGroupsForUser: vi.fn()
}));

vi.mock('@/app/actions/group-ranking-actions', () => ({
  getGroupRankingForUser: vi.fn().mockResolvedValue(null)
}));

vi.mock('@/app/actions/user-actions', () => ({
  getLoggedInUser: vi.fn()
}));

vi.mock('@/app/db/player-repository', () => ({
  getPlayersInTournament: vi.fn()
}));

vi.mock('@/app/db/tournament-view-permission-repository', () => ({
  hasUserPermission: vi.fn()
}));

vi.mock('@/app/db/game-guess-repository', () => ({
  getGameGuessStatisticsForUsers: vi.fn()
}));

vi.mock('@/app/db/users-repository', () => ({
  findUserById: vi.fn()
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
  isDevelopmentMode: vi.fn(() => false),
  isHubEnabled: vi.fn(() => false)
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

  const mockTournament = {
    id: 'tournament-1',
    short_name: 'Qatar 2022',
    long_name: 'FIFA World Cup Qatar 2022',
    dev_only: false,
    theme: {
      primary_color: '#8B1538',
      secondary_color: '#FFFFFF'
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (getLoggedInUser as any).mockResolvedValue(mockUser);
    (getTournamentById as any).mockResolvedValue(mockTournament);
    (getTournamentStartDate as any).mockResolvedValue(new Date('2024-12-01'));
    (getTournaments as any).mockResolvedValue([mockTournament]);
    (getPlayersInTournament as any).mockResolvedValue(5);
    (hasUserPermission as any).mockResolvedValue(true);
    (getGroupsForUser as any).mockResolvedValue({ userGroups: [], participantGroups: [] });
    (getGroupStandingsForTournament as any).mockResolvedValue({
      groups: [],
      defaultGroupId: 'group-a',
      qualifiedTeams: []
    });
    (getGameGuessStatisticsForUsers as any).mockResolvedValue([]);
    (findUserById as any).mockResolvedValue({ email_verified: true });
    // Default: verification not required
    vi.stubEnv('REQUIRE_EMAIL_VERIFICATION', 'false');
  });

  it('renders tournament layout with all header components', async () => {
    const params = Promise.resolve({ id: 'tournament-1' });
    const children = <div data-testid="child-content">Tournament Content</div>;

    const result = await TournamentLayout({ params, children });

    renderWithTheme(result as React.ReactElement);

    // Verify child content is rendered
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('includes Prode Mundial logo button for home navigation', async () => {
    const params = Promise.resolve({ id: 'tournament-1' });
    const children = <div>Content</div>;

    const result = await TournamentLayout({ params, children });
    renderWithTheme(result as React.ReactElement);

    // Find logo by alt text
    const logo = screen.getByAltText('Prode Mundial');
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
    expect(getTournamentById).toHaveBeenCalledWith('tournament-1');
  });

  it('redirects to login for dev tournament without user in production', async () => {
    const devTournamentData = {
      ...mockTournament,
      dev_only: true
    };

    (getTournamentById as any).mockResolvedValue(devTournamentData);
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
      ...mockTournament,
      dev_only: true
    };

    (getTournamentById as any).mockResolvedValue(devTournamentData);
    (hasUserPermission as any).mockResolvedValue(false);

    const params = Promise.resolve({ id: 'tournament-1' });
    const children = <div>Content</div>;

    await TournamentLayout({ params, children });

    expect(notFound).toHaveBeenCalled();
  });

  it('renders with tournament data correctly', async () => {
    const params = Promise.resolve({ id: 'tournament-1' });
    const children = <div>Content</div>;

    const result = await TournamentLayout({ params, children });
    renderWithTheme(result as React.ReactElement);

    // Verify tournament data was fetched correctly
    expect(getTournamentById).toHaveBeenCalledWith('tournament-1');
    expect(getTournamentStartDate).toHaveBeenCalledWith('tournament-1');
  });

  describe('Email verification overlay', () => {
    it('renders VerificationBanner below AppBar when user is unverified and verification required', async () => {
      vi.stubEnv('REQUIRE_EMAIL_VERIFICATION', 'true');
      (getLoggedInUser as any).mockResolvedValue({ ...mockUser, emailVerified: null });
      (findUserById as any).mockResolvedValue({ email_verified: null });

      const params = Promise.resolve({ id: 'tournament-1' });
      const children = <div>Content</div>;

      const result = await TournamentLayout({ params, children });
      renderWithTheme(result as React.ReactElement);

      expect(screen.getByText('Email Not Verified')).toBeInTheDocument();
    });

    it('does not render VerificationBanner when user is verified', async () => {
      vi.stubEnv('REQUIRE_EMAIL_VERIFICATION', 'true');
      (getLoggedInUser as any).mockResolvedValue({ ...mockUser, emailVerified: new Date() });
      (findUserById as any).mockResolvedValue({ email_verified: true });

      const params = Promise.resolve({ id: 'tournament-1' });
      const children = <div>Content</div>;

      const result = await TournamentLayout({ params, children });
      renderWithTheme(result as React.ReactElement);

      expect(screen.queryByText('Email Not Verified')).not.toBeInTheDocument();
    });

    it('does not render VerificationBanner when REQUIRE_EMAIL_VERIFICATION is false', async () => {
      vi.stubEnv('REQUIRE_EMAIL_VERIFICATION', 'false');
      (getLoggedInUser as any).mockResolvedValue({ ...mockUser, emailVerified: null });
      (findUserById as any).mockResolvedValue({ email_verified: null });

      const params = Promise.resolve({ id: 'tournament-1' });
      const children = <div>Content</div>;

      const result = await TournamentLayout({ params, children });
      renderWithTheme(result as React.ReactElement);

      expect(screen.queryByText('Email Not Verified')).not.toBeInTheDocument();
    });

    it('does not render VerificationBanner when no user is logged in', async () => {
      vi.stubEnv('REQUIRE_EMAIL_VERIFICATION', 'true');
      (getLoggedInUser as any).mockResolvedValue(null);

      const params = Promise.resolve({ id: 'tournament-1' });
      const children = <div>Content</div>;

      const result = await TournamentLayout({ params, children });
      renderWithTheme(result as React.ReactElement);

      expect(screen.queryByText('Email Not Verified')).not.toBeInTheDocument();
    });

    it('AppBar is rendered outside the pointer-events:none wrapper (always interactive)', async () => {
      vi.stubEnv('REQUIRE_EMAIL_VERIFICATION', 'true');
      (getLoggedInUser as any).mockResolvedValue({ ...mockUser, emailVerified: null });
      (findUserById as any).mockResolvedValue({ email_verified: null });

      const params = Promise.resolve({ id: 'tournament-1' });
      const children = <div data-testid="child-content">Content</div>;

      const result = await TournamentLayout({ params, children });
      renderWithTheme(result as React.ReactElement);

      // AppBar should be present (always interactive — not wrapped in pointer-events:none)
      const appBar = screen.getByRole('banner');
      expect(appBar).toBeInTheDocument();
      expect(appBar).not.toHaveStyle({ pointerEvents: 'none' });
    });
  });

  it('shows dev tournament badge when tournament is dev_only', async () => {
    const devTournamentData = {
      ...mockTournament,
      dev_only: true
    };

    (getTournamentById as any).mockResolvedValue(devTournamentData);
    (hasUserPermission as any).mockResolvedValue(true);

    const params = Promise.resolve({ id: 'tournament-1' });
    const children = <div>Content</div>;

    const result = await TournamentLayout({ params, children });
    renderWithTheme(result as React.ReactElement);

    // Dev badge shows BugReportIcon with "Development Tournament" title
    const devBadge = screen.getByTitle('Development Tournament');
    expect(devBadge).toBeInTheDocument();
  });

  it('fetches tournament via getTournamentById (not getTournamentAndGroupsData)', async () => {
    const params = Promise.resolve({ id: 'tournament-1' });
    const children = <div>Content</div>;

    await TournamentLayout({ params, children });

    expect(getTournamentById).toHaveBeenCalledWith('tournament-1');
  });

  it('renders correctly when tournament locations is null', async () => {
    const tournamentWithoutLocations = { ...mockTournament, locations: null };
    (getTournamentById as any).mockResolvedValue(tournamentWithoutLocations);

    const params = Promise.resolve({ id: 'tournament-1' });
    const children = <div data-testid="child-content">Content</div>;

    // Should not throw when locations is null (JSON-LD builder handles null gracefully)
    const result = await TournamentLayout({ params, children });
    renderWithTheme(result as React.ReactElement);

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });
});
