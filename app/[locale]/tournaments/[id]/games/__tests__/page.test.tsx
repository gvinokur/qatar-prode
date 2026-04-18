import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, cleanup } from '@testing-library/react';
import { render } from '@testing-library/react';
import TournamentGamesPage from '../page';

// Mock next-intl/server
vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn().mockResolvedValue((key: string) => key),
  getLocale: vi.fn().mockResolvedValue('en'),
}));

// Mock metadata-utils
vi.mock('@/app/utils/metadata-utils', () => ({
  buildTournamentMetadata: vi.fn().mockResolvedValue({ title: 'Test Tournament' }),
}));

// Mock UnifiedGamesPage
vi.mock('@/app/components/unified-games-page', () => ({
  UnifiedGamesPage: ({ tournamentId }: { tournamentId: string }) => (
    <div data-testid="unified-games-page" data-tournament-id={tournamentId}>Games Page</div>
  ),
}));

describe('TournamentGamesPage', () => {
  const mockParams = Promise.resolve({ id: 'tournament-1' });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders UnifiedGamesPage with tournamentId', async () => {
    const React = (await import('react')).default;
    const page = await TournamentGamesPage({ params: mockParams });
    render(page as React.ReactElement);

    const gamesPage = screen.getByTestId('unified-games-page');
    expect(gamesPage).toBeInTheDocument();
    expect(gamesPage).toHaveAttribute('data-tournament-id', 'tournament-1');
  });

  it('renders without errors when locale is "es"', async () => {
    const { getLocale } = await import('next-intl/server');
    vi.mocked(getLocale).mockResolvedValue('es');

    const result = await TournamentGamesPage({ params: mockParams });
    expect(result).toBeTruthy();
  });

  it('generates metadata with tournament title', async () => {
    const { buildTournamentMetadata } = await import('@/app/utils/metadata-utils');
    const { generateMetadata } = await import('../page');

    await generateMetadata({ params: mockParams });

    expect(buildTournamentMetadata).toHaveBeenCalledWith(
      'tournament-1',
      expect.any(String),
      expect.any(Function),
      expect.any(Function)
    );
  });
});
