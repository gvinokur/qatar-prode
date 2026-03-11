import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithTheme } from '@/__tests__/utils/test-utils';
import { ScoreGrowthChart } from '@/app/components/tournament-stats/score-growth-chart';
import { testFactories } from '@/__tests__/db/test-factories';

vi.mock('@mui/x-charts/LineChart', () => ({
  LineChart: ({ series }: any) => (
    <div
      data-testid="line-chart"
      data-series-count={String(series?.length ?? 0)}
    >
      {series?.map((s: any) => (
        <div
          key={s.id}
          data-testid={`series-${s.id}`}
          data-area={String(s.area)}
          data-stack={s.stack}
        />
      ))}
    </div>
  ),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('ScoreGrowthChart', () => {
  it('renders chart title', () => {
    const rows = [testFactories.scoreHistory({ total_game_score: 10 })];
    renderWithTheme(<ScoreGrowthChart rows={rows} />);
    expect(screen.getByText('history.title')).toBeInTheDocument();
  });

  it('renders without crashing when given a single-row history', () => {
    const rows = [testFactories.scoreHistory()];
    renderWithTheme(<ScoreGrowthChart rows={rows} />);
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('passes 6 series to LineChart', () => {
    const rows = [testFactories.scoreHistory()];
    renderWithTheme(<ScoreGrowthChart rows={rows} />);
    expect(screen.getByTestId('line-chart')).toHaveAttribute('data-series-count', '6');
  });

  it('all 6 series have area=true and stack=total', () => {
    const rows = [testFactories.scoreHistory()];
    renderWithTheme(<ScoreGrowthChart rows={rows} />);

    const seriesIds = ['gameScore', 'boostBonus', 'honorRoll', 'individualAwards', 'qualifiedTeams', 'groupPosition'];
    for (const id of seriesIds) {
      const el = screen.getByTestId(`series-${id}`);
      expect(el).toHaveAttribute('data-area', 'true');
      expect(el).toHaveAttribute('data-stack', 'total');
    }
  });
});
