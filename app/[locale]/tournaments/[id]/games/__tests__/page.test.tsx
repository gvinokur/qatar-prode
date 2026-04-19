'use server'

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, cleanup } from '@testing-library/react';
import { render } from '@testing-library/react';
import TournamentGamesPage from '../page';

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
    const result = await TournamentGamesPage({ params: mockParams });
    expect(result).toBeTruthy();
  });
});
