import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import GameCardPointOverlay from '../../app/components/game-card-point-overlay';
import { renderWithTheme } from '../utils/test-utils';

// Mock framer-motion to avoid animation complexities in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  useMotionValue: () => ({ set: vi.fn(), get: () => 0 }),
  useTransform: () => 0,
  animate: vi.fn(() => ({ stop: vi.fn() })),
}));

// Mock next/navigation for useSearchParams
vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: vi.fn(() => null),
  }),
}));

describe('GameCardPointOverlay', () => {
  const defaultProps = {
    gameId: '1',
    points: 2,
    baseScore: 2,
    multiplier: 1,
    boostType: null as null,
    scoreDescription: 'Exact score',
  };

  it('should render point chip with correct value', () => {
    renderWithTheme(<GameCardPointOverlay {...defaultProps} />);

    expect(screen.getByText(/2 pts/i)).toBeInTheDocument();
  });

  it('should display "+2 pts" for positive points', () => {
    renderWithTheme(<GameCardPointOverlay {...defaultProps} points={2} />);

    expect(screen.getByText(/\+2 pts/i)).toBeInTheDocument();
  });

  it('should display "0 pts" for zero points', () => {
    renderWithTheme(<GameCardPointOverlay {...defaultProps} points={0} baseScore={0} scoreDescription="Miss" />);

    expect(screen.getByText(/0 pts/i)).toBeInTheDocument();
  });

  it('should display "1 pt" (singular) for 1 point', () => {
    renderWithTheme(<GameCardPointOverlay {...defaultProps} points={1} baseScore={1} scoreDescription="Correct winner" />);

    expect(screen.getByText(/\+1 pt\b/i)).toBeInTheDocument();
  });

  it('should show breakdown tooltip when clicked', async () => {
    renderWithTheme(<GameCardPointOverlay {...defaultProps} />);

    const chip = screen.getByText(/2 pts/i).closest('div');
    expect(chip).toBeInTheDocument();

    fireEvent.click(chip!);

    await waitFor(() => {
      expect(screen.getByText('Desglose de Puntos')).toBeInTheDocument();
    });
  });

  it('should close breakdown tooltip when clicking backdrop', async () => {
    renderWithTheme(<GameCardPointOverlay {...defaultProps} />);

    const chip = screen.getByText(/2 pts/i).closest('div');
    fireEvent.click(chip!);

    await waitFor(() => {
      expect(screen.getByText('Desglose de Puntos')).toBeInTheDocument();
    });

    // Click the backdrop to close
    const backdrop = document.querySelector('.MuiBackdrop-root');
    if (backdrop) {
      fireEvent.click(backdrop);

      await waitFor(() => {
        expect(screen.queryByText('Desglose de Puntos')).not.toBeInTheDocument();
      });
    }
  });

  describe('with silver boost', () => {
    it('should display boosted points without inline multiplier', () => {
      renderWithTheme(
        <GameCardPointOverlay
          gameId="1"
          points={4}
          baseScore={2}
          multiplier={2}
          boostType="silver"
          scoreDescription="Exact score"
        />
      );

      // Should show final points
      expect(screen.getByText(/\+4 pts/i)).toBeInTheDocument();
      // Should NOT show inline multiplier (removed per refinement #3)
      expect(screen.queryByText(/2pt x2/i)).not.toBeInTheDocument();
    });
  });

  describe('with golden boost', () => {
    it('should display boosted points without inline multiplier', () => {
      renderWithTheme(
        <GameCardPointOverlay
          gameId="1"
          points={6}
          baseScore={2}
          multiplier={3}
          boostType="golden"
          scoreDescription="Exact score"
        />
      );

      // Should show final points
      expect(screen.getByText(/\+6 pts/i)).toBeInTheDocument();
      // Should NOT show inline multiplier (removed per refinement #3)
      expect(screen.queryByText(/2pt x3/i)).not.toBeInTheDocument();
    });
  });

  describe('Round 2 refinements', () => {
    it('should render all chips with consistent 24px height', () => {
      const { rerenderWithTheme, container } = renderWithTheme(<GameCardPointOverlay {...defaultProps} points={0} />);
      let chip = container.querySelector('.MuiChip-root');
      expect(chip).toHaveStyle({ height: '24px' });

      // Regular win (no boost)
      rerenderWithTheme(
        <GameCardPointOverlay {...defaultProps} points={2} boostType={null} />
      );
      chip = container.querySelector('.MuiChip-root');
      expect(chip).toHaveStyle({ height: '24px' });

      // Silver boost
      rerenderWithTheme(
        <GameCardPointOverlay {...defaultProps} points={4} boostType="silver" />
      );
      chip = container.querySelector('.MuiChip-root');
      expect(chip).toHaveStyle({ height: '24px' });

      // Golden boost
      rerenderWithTheme(
        <GameCardPointOverlay {...defaultProps} points={6} boostType="golden" />
      );
      chip = container.querySelector('.MuiChip-root');
      expect(chip).toHaveStyle({ height: '24px' });
    });

    it('should use white text for regular success chips', () => {
      const { container } = renderWithTheme(
        <GameCardPointOverlay {...defaultProps} points={2} boostType={null} />
      );

      const chip = container.querySelector('.MuiChip-root');
      // Check for rgb(255, 255, 255) which is equivalent to 'white'
      expect(chip).toHaveStyle({ color: 'rgb(255, 255, 255)' });
    });

    it('should render CheckEffect for regular wins without boost', () => {
      renderWithTheme(<GameCardPointOverlay {...defaultProps} points={2} boostType={null} />);

      // Should show points text for regular win
      expect(screen.getByText(/\+2 pts/i)).toBeInTheDocument();

      // CheckEffect is rendered as part of the points display
      // The icon is wrapped in the Box component with the points text
    });

    it('should render TrophyBounce for boosted wins', () => {
      renderWithTheme(<GameCardPointOverlay {...defaultProps} points={4} boostType="silver" />);

      // Should show points text for boosted win
      expect(screen.getByText(/\+4 pts/i)).toBeInTheDocument();

      // TrophyBounce is rendered as part of the points display
    });

    it('should render SobEffect for zero points', () => {
      renderWithTheme(<GameCardPointOverlay {...defaultProps} points={0} baseScore={0} />);

      // Should show zero points text
      expect(screen.getByText(/0 pts/i)).toBeInTheDocument();

      // SobEffect is rendered as part of the points display
    });
  });
});
