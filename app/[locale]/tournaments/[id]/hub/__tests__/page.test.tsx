import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, cleanup } from '@testing-library/react';
import { render } from '@testing-library/react';
import TournamentHubPage from '../page';

// Mock next-intl/server
vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn().mockResolvedValue((key: string) => {
    const translations: Record<string, string> = {
      smartPredictorCarousel: 'Smart Predictor Carousel',
      predictionDashboard: 'Prediction Dashboard',
      leaderboardPeek: 'Leaderboard Peek',
    };
    return translations[key] ?? key;
  }),
  getLocale: vi.fn().mockResolvedValue('en'),
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

  it('renders three placeholder sections with correct labels', async () => {
    const React = (await import('react')).default;
    const page = await TournamentHubPage({ params: mockParams });
    const { container } = render(page as React.ReactElement);

    // Three Paper sections rendered
    const papers = container.querySelectorAll('.MuiPaper-root');
    expect(papers.length).toBe(3);

    expect(screen.getByText('Smart Predictor Carousel')).toBeInTheDocument();
    expect(screen.getByText('Prediction Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Leaderboard Peek')).toBeInTheDocument();
  });
});
