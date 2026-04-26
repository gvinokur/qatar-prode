import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { GamesActiveClient } from '../tournament-hub/games-active-client';
import { GuessesContext } from '../context-providers/guesses-context-provider';
import { testFactories } from '@/__tests__/db/test-factories';

vi.mock('next-intl', () => ({
  useTranslations: vi.fn(() => (key: string) => key)
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) =>
    React.createElement('a', { href, ...props }, children)
}));

vi.mock('../tournament-hub/dashboard-card', () => ({
  DashboardCard: ({ children }: { children: React.ReactNode }) => React.createElement('div', null, children)
}));

vi.mock('../flippable-game-card', () => ({
  default: () => React.createElement('div', null, 'GameCard')
}));

vi.mock('@mui/material', () => ({
  Box: ({ children }: any) => React.createElement('div', null, children),
  Button: ({ component: Component, href, children, ...props }: any) =>
    Component
      ? React.createElement(Component, { href, ...props }, children)
      : React.createElement('button', props, children),
  IconButton: ({ onClick, children, disabled, ...props }: any) =>
    React.createElement('button', { onClick, disabled, ...props }, children),
  Stack: ({ children }: any) => React.createElement('div', null, children),
  Typography: ({ children }: any) => React.createElement('span', null, children),
}));

vi.mock('@mui/icons-material', () => ({
  Error: () => null,
  Info: () => null,
  KeyboardArrowDown: () => null,
  KeyboardArrowUp: () => null,
  SportsSoccer: () => null,
  WarningAmber: () => null,
}));

const defaultGuessesContext = {
  gameGuesses: {},
  boostCounts: { silver: { used: 0, max: 5 }, golden: { used: 0, max: 3 } }
};

describe('GamesActiveClient View All href', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('includes current game ID in View All href', () => {
    const game = testFactories.game({ id: 'game-abc' });
    const team = testFactories.team();

    render(
      <GuessesContext.Provider value={defaultGuessesContext as any}>
        <GamesActiveClient
          games={[game]}
          teamsMap={{ [team.id]: team }}
          tournamentId="t1"
          gamesHref="/en/tournaments/t1/games"
          urgencyLevel="safe"
          cardTitle="Predictions"
          initialPredicted={0}
          totalGames={10}
          urgentGameIds={[]}
          onAllUrgentComplete={vi.fn()}
        />
      </GuessesContext.Provider>
    );

    const link = screen.getByRole('link', { name: 'gamesWidget.ctaViewAll' });
    expect(link).toHaveAttribute('href', '/en/tournaments/t1/games?edit=game-abc');
  });

  it('updates href to second game ID after navigating down', async () => {
    const game1 = testFactories.game({ id: 'game-first' });
    const game2 = testFactories.game({ id: 'game-second' });
    const team = testFactories.team();

    render(
      <GuessesContext.Provider value={defaultGuessesContext as any}>
        <GamesActiveClient
          games={[game1, game2]}
          teamsMap={{ [team.id]: team }}
          tournamentId="t1"
          gamesHref="/en/tournaments/t1/games"
          urgencyLevel="safe"
          cardTitle="Predictions"
          initialPredicted={0}
          totalGames={10}
          urgentGameIds={[]}
          onAllUrgentComplete={vi.fn()}
        />
      </GuessesContext.Provider>
    );

    const downButton = screen.getByRole('button', { name: 'next game' });
    await act(async () => { downButton.click(); });

    const link = screen.getByRole('link', { name: 'gamesWidget.ctaViewAll' });
    expect(link).toHaveAttribute('href', '/en/tournaments/t1/games?edit=game-second');
  });
});
