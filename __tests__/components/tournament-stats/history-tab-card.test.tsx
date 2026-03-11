import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithTheme } from '@/__tests__/utils/test-utils';
import { HistoryTabCard } from '@/app/components/tournament-stats/history-tab-card';
import { testFactories } from '@/__tests__/db/test-factories';

vi.mock('@/app/components/tournament-stats/score-growth-chart', () => ({
  ScoreGrowthChart: () => <div data-testid="score-growth-chart" />,
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('HistoryTabCard', () => {
  it('renders empty state text when rows is empty', () => {
    renderWithTheme(<HistoryTabCard rows={[]} />);
    expect(screen.getByText('history.emptyState')).toBeInTheDocument();
  });

  it('does not render empty state text when rows has data', () => {
    const rows = [testFactories.scoreHistory({ total_game_score: 20 })];
    renderWithTheme(<HistoryTabCard rows={rows} />);
    expect(screen.queryByText('history.emptyState')).not.toBeInTheDocument();
  });

  it('renders ScoreGrowthChart when rows has data', () => {
    const rows = [testFactories.scoreHistory({ total_game_score: 20 })];
    renderWithTheme(<HistoryTabCard rows={rows} />);
    expect(screen.getByTestId('score-growth-chart')).toBeInTheDocument();
  });
});
