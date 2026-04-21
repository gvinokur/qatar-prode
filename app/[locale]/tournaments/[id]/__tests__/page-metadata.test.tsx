import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, cleanup } from '@testing-library/react';
import { render } from '@testing-library/react';
import TournamentHubPage from '../page';

const mockRedirect = vi.fn()
const mockGetLoggedInUser = vi.fn()

// Mock next/navigation
vi.mock('next/navigation', () => ({
  redirect: (url: string) => mockRedirect(url),
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
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the hub page without errors when logged in', async () => {
    const result = await TournamentHubPage({ params: mockParams });
    expect(result).toBeTruthy();
  });

  it('renders the Banner Area placeholder when logged in', async () => {
    const React = (await import('react')).default;
    const page = await TournamentHubPage({ params: mockParams });
    render(page as React.ReactElement);

    expect(screen.getByText(/Banner Area/)).toBeInTheDocument();
  });

  it('renders all four mock DashboardCard titles when logged in', async () => {
    const React = (await import('react')).default;
    const page = await TournamentHubPage({ params: mockParams });
    render(page as React.ReactElement);

    expect(screen.getByText('Games')).toBeInTheDocument();
    expect(screen.getByText('Standings')).toBeInTheDocument();
    expect(screen.getByText('Groups')).toBeInTheDocument();
    expect(screen.getByText('Results')).toBeInTheDocument();
  });

  it('redirects to /games when user is not logged in', async () => {
    mockGetLoggedInUser.mockResolvedValue(null);

    await TournamentHubPage({ params: mockParams });

    expect(mockRedirect).toHaveBeenCalledWith('/en/tournaments/tournament-1/games');
  });
});
