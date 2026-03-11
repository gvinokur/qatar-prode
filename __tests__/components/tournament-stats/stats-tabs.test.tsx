import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithTheme } from '../../utils/test-utils';
import { StatsTabs } from '../../../app/components/tournament-stats/stats-tabs';

describe('StatsTabs', () => {
  const mockPerformanceTab = <div data-testid="performance-content">Performance Content</div>;
  const mockPrecisionTab = <div data-testid="precision-content">Precision Content</div>;
  const mockBoostsTab = <div data-testid="boosts-content">Boosts Content</div>;
  const mockHistoryTab = <div data-testid="history-content">History Content</div>;

  it('should render with all four tabs', () => {
    renderWithTheme(
      <StatsTabs
        performanceTab={mockPerformanceTab}
        precisionTab={mockPrecisionTab}
        boostsTab={mockBoostsTab}
        historyTab={mockHistoryTab}
      />
    );

    expect(screen.getByRole('tab', { name: /rendimiento/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /precisión/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /boosts/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /historial/i })).toBeInTheDocument();
  });

  it('should show performance tab content by default', () => {
    renderWithTheme(
      <StatsTabs
        performanceTab={mockPerformanceTab}
        precisionTab={mockPrecisionTab}
        boostsTab={mockBoostsTab}
        historyTab={mockHistoryTab}
      />
    );

    expect(screen.getByTestId('performance-content')).toBeInTheDocument();
    expect(screen.queryByTestId('precision-content')).not.toBeInTheDocument();
    expect(screen.queryByTestId('boosts-content')).not.toBeInTheDocument();
    expect(screen.queryByTestId('history-content')).not.toBeInTheDocument();
  });

  it('should switch to precision tab when clicked', async () => {
    const user = userEvent.setup();

    renderWithTheme(
      <StatsTabs
        performanceTab={mockPerformanceTab}
        precisionTab={mockPrecisionTab}
        boostsTab={mockBoostsTab}
        historyTab={mockHistoryTab}
      />
    );

    const precisionTab = screen.getByRole('tab', { name: /precisión/i });
    await user.click(precisionTab);

    expect(screen.queryByTestId('performance-content')).not.toBeInTheDocument();
    expect(screen.getByTestId('precision-content')).toBeInTheDocument();
    expect(screen.queryByTestId('boosts-content')).not.toBeInTheDocument();
    expect(screen.queryByTestId('history-content')).not.toBeInTheDocument();
  });

  it('should switch to boosts tab when clicked', async () => {
    const user = userEvent.setup();

    renderWithTheme(
      <StatsTabs
        performanceTab={mockPerformanceTab}
        precisionTab={mockPrecisionTab}
        boostsTab={mockBoostsTab}
        historyTab={mockHistoryTab}
      />
    );

    const boostsTab = screen.getByRole('tab', { name: /boosts/i });
    await user.click(boostsTab);

    expect(screen.queryByTestId('performance-content')).not.toBeInTheDocument();
    expect(screen.queryByTestId('precision-content')).not.toBeInTheDocument();
    expect(screen.getByTestId('boosts-content')).toBeInTheDocument();
    expect(screen.queryByTestId('history-content')).not.toBeInTheDocument();
  });

  it('should maintain tab selection when switching between tabs', async () => {
    const user = userEvent.setup();

    renderWithTheme(
      <StatsTabs
        performanceTab={mockPerformanceTab}
        precisionTab={mockPrecisionTab}
        boostsTab={mockBoostsTab}
        historyTab={mockHistoryTab}
      />
    );

    // Switch to precision
    await user.click(screen.getByRole('tab', { name: /precisión/i }));
    expect(screen.getByTestId('precision-content')).toBeInTheDocument();

    // Switch to boosts
    await user.click(screen.getByRole('tab', { name: /boosts/i }));
    expect(screen.getByTestId('boosts-content')).toBeInTheDocument();

    // Switch back to performance
    await user.click(screen.getByRole('tab', { name: /rendimiento/i }));
    expect(screen.getByTestId('performance-content')).toBeInTheDocument();
  });

  it('should have correct tab indicator (selected state)', async () => {
    const user = userEvent.setup();

    renderWithTheme(
      <StatsTabs
        performanceTab={mockPerformanceTab}
        precisionTab={mockPrecisionTab}
        boostsTab={mockBoostsTab}
        historyTab={mockHistoryTab}
      />
    );

    const performanceTab = screen.getByRole('tab', { name: /rendimiento/i });
    const precisionTab = screen.getByRole('tab', { name: /precisión/i });

    // Performance tab should be selected initially
    expect(performanceTab).toHaveAttribute('aria-selected', 'true');
    expect(precisionTab).toHaveAttribute('aria-selected', 'false');

    // Click precision tab
    await user.click(precisionTab);

    // Precision tab should now be selected
    expect(performanceTab).toHaveAttribute('aria-selected', 'false');
    expect(precisionTab).toHaveAttribute('aria-selected', 'true');
  });

  it('should render with ScrollShadowContainer for scrollable content', () => {
    const { container } = renderWithTheme(
      <StatsTabs
        performanceTab={mockPerformanceTab}
        precisionTab={mockPrecisionTab}
        boostsTab={mockBoostsTab}
        historyTab={mockHistoryTab}
      />
    );

    // ScrollShadowContainer adds data-scroll-container attribute
    const scrollContainer = container.querySelector('[data-scroll-container="true"]');
    expect(scrollContainer).toBeInTheDocument();
  });

  it('should switch to history tab when clicked', async () => {
    const user = userEvent.setup();

    renderWithTheme(
      <StatsTabs
        performanceTab={mockPerformanceTab}
        precisionTab={mockPrecisionTab}
        boostsTab={mockBoostsTab}
        historyTab={mockHistoryTab}
      />
    );

    const historyTab = screen.getByRole('tab', { name: /historial/i });
    await user.click(historyTab);

    expect(screen.queryByTestId('performance-content')).not.toBeInTheDocument();
    expect(screen.queryByTestId('precision-content')).not.toBeInTheDocument();
    expect(screen.queryByTestId('boosts-content')).not.toBeInTheDocument();
    expect(screen.getByTestId('history-content')).toBeInTheDocument();
  });

  it('should render historyTab content in the History tab panel', async () => {
    const user = userEvent.setup();

    renderWithTheme(
      <StatsTabs
        performanceTab={mockPerformanceTab}
        precisionTab={mockPrecisionTab}
        boostsTab={mockBoostsTab}
        historyTab={mockHistoryTab}
      />
    );

    await user.click(screen.getByRole('tab', { name: /historial/i }));

    expect(screen.getByTestId('history-content')).toBeInTheDocument();
    expect(screen.getByText('History Content')).toBeInTheDocument();
  });
});
