import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GameCardPointOverlay from '../../app/components/game-card-point-overlay';

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

describe('GameCardPointOverlay', () => {
  const defaultProps = {
    points: 2,
    baseScore: 2,
    multiplier: 1,
    boostType: null as null,
    scoreDescription: 'Exact score',
  };

  it('should render point chip with correct value', () => {
    render(<GameCardPointOverlay {...defaultProps} />);

    expect(screen.getByText(/2 pts/i)).toBeInTheDocument();
  });

  it('should display "+2 pts" for positive points', () => {
    render(<GameCardPointOverlay {...defaultProps} points={2} />);

    expect(screen.getByText(/\+2 pts/i)).toBeInTheDocument();
  });

  it('should display "0 pts" for zero points', () => {
    render(<GameCardPointOverlay {...defaultProps} points={0} baseScore={0} scoreDescription="Miss" />);

    expect(screen.getByText(/0 pts/i)).toBeInTheDocument();
  });

  it('should display "1 pt" (singular) for 1 point', () => {
    render(<GameCardPointOverlay {...defaultProps} points={1} baseScore={1} scoreDescription="Correct winner" />);

    expect(screen.getByText(/\+1 pt\b/i)).toBeInTheDocument();
  });

  it('should show breakdown tooltip when clicked', async () => {
    render(<GameCardPointOverlay {...defaultProps} />);

    const chip = screen.getByText(/2 pts/i).closest('div');
    expect(chip).toBeInTheDocument();

    fireEvent.click(chip!);

    await waitFor(() => {
      expect(screen.getByText('Point Breakdown')).toBeInTheDocument();
    });
  });

  it('should close breakdown tooltip when clicking backdrop', async () => {
    render(<GameCardPointOverlay {...defaultProps} />);

    const chip = screen.getByText(/2 pts/i).closest('div');
    fireEvent.click(chip!);

    await waitFor(() => {
      expect(screen.getByText('Point Breakdown')).toBeInTheDocument();
    });

    // Click the backdrop to close
    const backdrop = document.querySelector('.MuiBackdrop-root');
    if (backdrop) {
      fireEvent.click(backdrop);

      await waitFor(() => {
        expect(screen.queryByText('Point Breakdown')).not.toBeInTheDocument();
      });
    }
  });

  describe('with silver boost', () => {
    it('should display boosted points with multiplier notation', () => {
      render(
        <GameCardPointOverlay
          points={4}
          baseScore={2}
          multiplier={2}
          boostType="silver"
          scoreDescription="Exact score"
        />
      );

      expect(screen.getByText(/\+4 pts/i)).toBeInTheDocument();
      expect(screen.getByText(/2pt x2/i)).toBeInTheDocument();
    });
  });

  describe('with golden boost', () => {
    it('should display boosted points with multiplier notation', () => {
      render(
        <GameCardPointOverlay
          points={6}
          baseScore={2}
          multiplier={3}
          boostType="golden"
          scoreDescription="Exact score"
        />
      );

      expect(screen.getByText(/\+6 pts/i)).toBeInTheDocument();
      expect(screen.getByText(/2pt x3/i)).toBeInTheDocument();
    });
  });
});
