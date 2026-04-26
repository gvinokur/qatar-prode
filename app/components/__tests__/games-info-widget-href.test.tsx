import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { GamesInfoWidget } from '../tournament-hub/games-info-widget';
import { GamesInfoWidgetCta } from '../tournament-hub/games-info-widget-cta';

vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: string) => key
}));

vi.mock('../tournament-hub/games-info-widget-cta', () => ({
  GamesInfoWidgetCta: vi.fn(() => null)
}));

vi.mock('../tournament-hub/dashboard-card', () => ({
  DashboardCard: ({ children }: { children: React.ReactNode }) => React.createElement('div', null, children)
}));

vi.mock('@mui/material', () => ({
  Box: ({ children }: any) => React.createElement('div', null, children),
  LinearProgress: () => null,
  Stack: ({ children }: any) => React.createElement('div', null, children),
  Typography: ({ children }: any) => React.createElement('span', null, children),
}));

vi.mock('@mui/icons-material', () => ({
  AddCircleOutline: () => null,
  Schedule: () => null,
  SportsSoccer: () => null,
}));

const baseProps = {
  scoringRules: { matches: [], qualifiers: [], awards: [] } as any,
  gamesHref: '/en/tournaments/t1/games',
  predictedGames: 0,
  totalGames: 10
};

describe('GamesInfoWidget CTA href', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('includes ?edit=next in href when user is logged in', async () => {
    const element = await GamesInfoWidget({ ...baseProps, isLoggedOff: false });
    render(element);

    expect(vi.mocked(GamesInfoWidgetCta)).toHaveBeenCalledWith(
      expect.objectContaining({ href: '/en/tournaments/t1/games?edit=next' }),
      undefined
    );
  });

  it('uses plain gamesHref when user is logged off', async () => {
    const element = await GamesInfoWidget({ ...baseProps, isLoggedOff: true });
    render(element);

    expect(vi.mocked(GamesInfoWidgetCta)).toHaveBeenCalledWith(
      expect.objectContaining({ href: '/en/tournaments/t1/games' }),
      undefined
    );
  });
});
