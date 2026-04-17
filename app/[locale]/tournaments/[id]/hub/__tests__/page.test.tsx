import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, cleanup } from '@testing-library/react';
import { render } from '@testing-library/react';
import TournamentHubPage from '../page';

// Mock next-intl/server
vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn().mockResolvedValue((key: string) => key),
  getLocale: vi.fn().mockResolvedValue('en'),
}));

// Mock locale-utils
vi.mock('@/app/utils/locale-utils', () => ({
  toLocale: vi.fn((v: string) => v),
}));

// Mock TournamentHubActionCenter (server component — renders a test placeholder)
vi.mock('@/app/components/tournament-hub/tournament-hub-action-center', () => ({
  TournamentHubActionCenter: () => <div data-testid="action-center">Action Center</div>,
}));

// Mock TournamentHubLeaderboardPeek (server component — renders a test placeholder)
vi.mock('@/app/components/tournament-hub/tournament-hub-leaderboard-peek', () => ({
  TournamentHubLeaderboardPeek: () => <div data-testid="leaderboard-peek">Leaderboard Peek Widget</div>,
}));

// Mock TournamentHubRecentResults (server component — renders a test placeholder)
vi.mock('@/app/components/tournament-hub/tournament-hub-recent-results', () => ({
  TournamentHubRecentResults: () => <div data-testid="recent-results">Recent Results Widget</div>,
}));

describe('TournamentHubPage', () => {
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

  it('does not render the Smart Predictor Carousel placeholder', async () => {
    const React = (await import('react')).default;
    const page = await TournamentHubPage({ params: mockParams });
    render(page as React.ReactElement);

    expect(screen.queryByText('Smart Predictor Carousel')).not.toBeInTheDocument();
  });
});
