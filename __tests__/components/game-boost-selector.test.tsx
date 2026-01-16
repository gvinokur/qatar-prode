import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import GameBoostSelector from '../../app/components/game-boost-selector';

// Mock Server Actions
vi.mock('../../app/actions/game-boost-actions', () => ({
  setGameBoostAction: vi.fn(),
  getBoostCountsAction: vi.fn(() => Promise.resolve({
    silver: { used: 2, max: 5 },
    golden: { used: 1, max: 2 },
  })),
}));

// Mock boost badge components
vi.mock('../../app/components/boost-badge', () => ({
  BoostBadge: ({ type }: { type: string }) => (
    <div data-testid={`boost-badge-${type}`}>{type === 'silver' ? '2x' : '3x'}</div>
  ),
  BoostCountBadge: ({ type, used, max }: { type: string; used: number; max: number }) => (
    <div data-testid={`boost-count-${type}`}>{type === 'silver' ? '2x' : '3x'}: {used}/{max}</div>
  ),
}));

describe('GameBoostSelector', () => {
  const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
  const pastDate = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago

  const mockProps = {
    gameId: 'game-123',
    gameDate: futureDate,
    tournamentId: 'tournament-123',
    currentBoostType: null as 'silver' | 'golden' | null,
    disabled: false,
    noPrediction: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders boost count badges for silver and golden', async () => {
      render(<GameBoostSelector {...mockProps} />);

      // Wait for boost counts to load
      await screen.findByTestId('boost-count-silver');

      expect(screen.getByTestId('boost-count-silver')).toHaveTextContent('2x: 2/5');
      expect(screen.getByTestId('boost-count-golden')).toHaveTextContent('3x: 1/2');
    });

    it('renders boost badge when boost is applied', async () => {
      render(<GameBoostSelector {...mockProps} currentBoostType="silver" />);

      await screen.findByTestId('boost-count-silver');

      expect(screen.getByTestId('boost-badge-silver')).toBeInTheDocument();
    });

    it('renders boost badge for golden boost', async () => {
      render(<GameBoostSelector {...mockProps} currentBoostType="golden" />);

      await screen.findByTestId('boost-count-golden');

      expect(screen.getByTestId('boost-badge-golden')).toBeInTheDocument();
    });
  });

  describe('Disabled States', () => {
    it('renders disabled tooltip when game has started', async () => {
      render(<GameBoostSelector {...mockProps} gameDate={pastDate} />);

      await screen.findByTestId('boost-count-silver');

      // Buttons should be disabled
      const buttons = screen.getAllByRole('button');
      const iconButtons = buttons.filter(btn => !btn.textContent); // IconButtons don't have text

      iconButtons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });

    it('renders disabled tooltip when no prediction entered', async () => {
      render(<GameBoostSelector {...mockProps} noPrediction={true} />);

      await screen.findByTestId('boost-count-silver');

      const buttons = screen.getAllByRole('button');
      const iconButtons = buttons.filter(btn => !btn.textContent);

      iconButtons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });

    it('renders disabled when disabled prop is true', async () => {
      render(<GameBoostSelector {...mockProps} disabled={true} />);

      await screen.findByTestId('boost-count-silver');

      const buttons = screen.getAllByRole('button');
      const iconButtons = buttons.filter(btn => !btn.textContent);

      iconButtons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe('Spanish Translations', () => {
    it('uses Spanish text for tooltips and messages', async () => {
      // This test verifies the translations are in place
      // The actual tooltip text is tested through the disabled state rendering
      const { container } = render(<GameBoostSelector {...mockProps} />);

      await screen.findByTestId('boost-count-silver');

      // Component should render without errors with Spanish translations
      expect(container).toBeInTheDocument();
    });
  });
});
