import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, cleanup } from '@testing-library/react';
import { render } from '@testing-library/react';
import TournamentHubPage from '../page';

// Mock next-intl/server
vi.mock('next-intl/server', () => ({
  getLocale: vi.fn().mockResolvedValue('en'),
}));

// Mock locale-utils
vi.mock('@/app/utils/locale-utils', () => ({
  toLocale: vi.fn((v: string) => v),
}));

// Mock TournamentHubOfflineRedirect
vi.mock('@/app/components/tournament-hub/tournament-hub-offline-redirect', () => ({
  TournamentHubOfflineRedirect: () => <div data-testid="offline-redirect" />,
}));

// Mock TournamentHubActionCenter
vi.mock('@/app/components/tournament-hub/tournament-hub-action-center', () => ({
  TournamentHubActionCenter: () => <div data-testid="action-center">Action Center</div>,
}));

// Mock TournamentHubLeaderboardPeek
vi.mock('@/app/components/tournament-hub/tournament-hub-leaderboard-peek', () => ({
  TournamentHubLeaderboardPeek: () => <div data-testid="leaderboard-peek">Leaderboard Peek Widget</div>,
}));

// Mock TournamentHubRecentResults
vi.mock('@/app/components/tournament-hub/tournament-hub-recent-results', () => ({
  TournamentHubRecentResults: () => <div data-testid="recent-results">Recent Results Widget</div>,
}));

describe('TournamentHubPage (root landing page)', () => {
  const mockParams = Promise.resolve({ id: 'tournament-1' });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the hub page without errors', async () => {
    const result = await TournamentHubPage({ params: mockParams });
    expect(result).toBeTruthy();
  });

  it('renders the Action Center widget', async () => {
    const React = (await import('react')).default;
    const page = await TournamentHubPage({ params: mockParams });
    render(page as React.ReactElement);

    expect(screen.getByTestId('action-center')).toBeInTheDocument();
  });

  it('renders Recent Results widget and Leaderboard Peek widget', async () => {
    const React = (await import('react')).default;
    const page = await TournamentHubPage({ params: mockParams });
    render(page as React.ReactElement);

    expect(screen.getByTestId('recent-results')).toBeInTheDocument();
    expect(screen.getByTestId('leaderboard-peek')).toBeInTheDocument();
  });

  it('renders offline redirect component', async () => {
    const React = (await import('react')).default;
    const page = await TournamentHubPage({ params: mockParams });
    render(page as React.ReactElement);

    expect(screen.getByTestId('offline-redirect')).toBeInTheDocument();
  });
});
