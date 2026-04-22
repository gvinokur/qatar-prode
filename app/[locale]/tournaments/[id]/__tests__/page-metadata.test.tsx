import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, cleanup } from '@testing-library/react';
import { render } from '@testing-library/react';
import TournamentHubPage from '../page';

const mockGetLoggedInUser = vi.fn()
const mockGetActionCenterGames = vi.fn()
const mockGetPublicTournamentTiming = vi.fn()

// Mock next/navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

// Mock next-intl/server
vi.mock('next-intl/server', () => ({
  getLocale: vi.fn().mockResolvedValue('en'),
}));

// Mock locale-utils
vi.mock('@/app/utils/locale-utils', () => ({
  toLocale: vi.fn((v: string) => v),
}));

// Mock user-actions
vi.mock('@/app/actions/user-actions', () => ({
  getLoggedInUser: () => mockGetLoggedInUser(),
}));

// Mock hub-actions
vi.mock('@/app/actions/hub-actions', () => ({
  getActionCenterGames: () => mockGetActionCenterGames(),
  getPublicTournamentTiming: () => mockGetPublicTournamentTiming(),
}));

// Mock DashboardBanner so it doesn't need real data
vi.mock('@/app/components/tournament-hub/dashboard-banner', () => ({
  DashboardBanner: () => <div data-testid="dashboard-banner" />,
}));

// Mock MUI icons used in page.tsx
vi.mock('@mui/icons-material/SportsSoccer', () => ({ default: () => <span data-testid="icon-soccer" /> }))
vi.mock('@mui/icons-material/EmojiEvents', () => ({ default: () => <span data-testid="icon-events" /> }))
vi.mock('@mui/icons-material/Groups', () => ({ default: () => <span data-testid="icon-groups" /> }))
vi.mock('@mui/icons-material/History', () => ({ default: () => <span data-testid="icon-history" /> }))

describe('TournamentHubPage (root landing page)', () => {
  const mockParams = Promise.resolve({ id: 'tournament-1' });
  const mockUser = { id: 'user-1', email: 'test@example.com' };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetLoggedInUser.mockResolvedValue(mockUser);
    mockGetActionCenterGames.mockResolvedValue(null);
    mockGetPublicTournamentTiming.mockResolvedValue(null);
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the hub page without errors when logged in', async () => {
    const result = await TournamentHubPage({ params: mockParams });
    expect(result).toBeTruthy();
  });

  it('renders DashboardBanner component when logged in', async () => {
    const page = await TournamentHubPage({ params: mockParams });
    render(page as Parameters<typeof render>[0]);

    expect(screen.getByTestId('dashboard-banner')).toBeInTheDocument();
  });

  it('renders all four mock DashboardCard titles when logged in', async () => {
    const page = await TournamentHubPage({ params: mockParams });
    render(page as Parameters<typeof render>[0]);

    expect(screen.getByText('Games')).toBeInTheDocument();
    expect(screen.getByText('Standings')).toBeInTheDocument();
    expect(screen.getByText('Groups')).toBeInTheDocument();
    expect(screen.getByText('Results')).toBeInTheDocument();
  });

  it('renders DashboardBanner even when user is not logged in', async () => {
    mockGetLoggedInUser.mockResolvedValue(null);

    const page = await TournamentHubPage({ params: mockParams });
    render(page as Parameters<typeof render>[0]);

    expect(screen.getByTestId('dashboard-banner')).toBeInTheDocument();
  });

  it('does not call getActionCenterGames when user is not logged in', async () => {
    mockGetLoggedInUser.mockResolvedValue(null);

    await TournamentHubPage({ params: mockParams });

    expect(mockGetActionCenterGames).not.toHaveBeenCalled();
  });

  it('calls getActionCenterGames when user is logged in', async () => {
    await TournamentHubPage({ params: mockParams });

    expect(mockGetActionCenterGames).toHaveBeenCalled();
  });

  it('always calls getPublicTournamentTiming regardless of auth state', async () => {
    mockGetLoggedInUser.mockResolvedValue(null);

    await TournamentHubPage({ params: mockParams });

    expect(mockGetPublicTournamentTiming).toHaveBeenCalled();
  });
});
