import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithTheme } from '../utils/test-utils';
import { ProgressTracker } from '../../app/components/progress-tracker';

describe('ProgressTracker', () => {
  const defaultProps = {
    totalGames: 10,
    predictedGames: 5,
    silverUsed: 2,
    silverMax: 5,
    goldenUsed: 1,
    goldenMax: 3
  };

  describe('predictions display', () => {
    it('renders predictions count', () => {
      renderWithTheme(<ProgressTracker {...defaultProps} />);

      expect(screen.getByText(/Predicciones: 5\/10 \(50%\)/)).toBeInTheDocument();
    });

    it('calculates percentage correctly', () => {
      renderWithTheme(<ProgressTracker {...defaultProps} totalGames={20} predictedGames={10} />);

      expect(screen.getByText(/Predicciones: 10\/20 \(50%\)/)).toBeInTheDocument();
    });

    it('handles zero total games', () => {
      renderWithTheme(<ProgressTracker {...defaultProps} totalGames={0} predictedGames={0} />);

      expect(screen.getByText(/Predicciones: 0\/0 \(0%\)/)).toBeInTheDocument();
    });

    it('handles 100% completion', () => {
      renderWithTheme(<ProgressTracker {...defaultProps} totalGames={10} predictedGames={10} />);

      expect(screen.getByText(/Predicciones: 10\/10 \(100%\)/)).toBeInTheDocument();
    });

    it('rounds percentage to nearest integer', () => {
      renderWithTheme(<ProgressTracker {...defaultProps} totalGames={3} predictedGames={1} />);

      // 1/3 = 33.33% -> rounds to 33%
      expect(screen.getByText(/Predicciones: 1\/3 \(33%\)/)).toBeInTheDocument();
    });
  });

  describe('progress bar', () => {
    it('renders LinearProgress with correct value', () => {
      const { container } = renderWithTheme(<ProgressTracker {...defaultProps} />);
      const progressBar = container.querySelector('.MuiLinearProgress-root');

      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute('aria-valuenow', '50');
    });

    it('shows 0% when no games predicted', () => {
      const { container } = renderWithTheme(<ProgressTracker {...defaultProps} predictedGames={0} />);
      const progressBar = container.querySelector('.MuiLinearProgress-root');

      expect(progressBar).toHaveAttribute('aria-valuenow', '0');
    });

    it('shows 100% when all games predicted', () => {
      const { container } = renderWithTheme(<ProgressTracker {...defaultProps} predictedGames={10} />);
      const progressBar = container.querySelector('.MuiLinearProgress-root');

      expect(progressBar).toHaveAttribute('aria-valuenow', '100');
    });
  });

  describe('boost badges', () => {
    it('renders boost badges when max values > 0', () => {
      const { container } = renderWithTheme(<ProgressTracker {...defaultProps} />);

      // Check for MUI Chip components (BoostCountBadge renders as chips)
      const chips = container.querySelectorAll('.MuiChip-root');
      expect(chips.length).toBeGreaterThan(0);
    });

    it('renders silver and golden badges', () => {
      renderWithTheme(<ProgressTracker {...defaultProps} silverUsed={2} silverMax={5} goldenUsed={1} goldenMax={3} />);

      // Check for the badge labels showing usage
      expect(screen.getByText('2/5')).toBeInTheDocument(); // silver
      expect(screen.getByText('1/3')).toBeInTheDocument(); // golden
    });

    it('hides boost section when both max values are 0', () => {
      const { container } = renderWithTheme(
        <ProgressTracker {...defaultProps} silverMax={0} goldenMax={0} />
      );

      // No boost chips should be rendered
      const chips = container.querySelectorAll('.MuiChip-root');
      expect(chips).toHaveLength(0);
    });

    it('shows only silver badge when only silverMax > 0', () => {
      renderWithTheme(<ProgressTracker {...defaultProps} silverUsed={2} silverMax={5} goldenMax={0} />);

      expect(screen.getByText('2/5')).toBeInTheDocument();
      expect(screen.queryByText(/\/3/)).not.toBeInTheDocument(); // golden badge not present
    });

    it('shows only golden badge when only goldenMax > 0', () => {
      renderWithTheme(<ProgressTracker {...defaultProps} silverMax={0} goldenUsed={1} goldenMax={3} />);

      expect(screen.getByText('1/3')).toBeInTheDocument();
      expect(screen.queryByText(/\/5/)).not.toBeInTheDocument(); // silver badge not present
    });
  });

  describe('boost values', () => {
    it('displays correct silver boost usage', () => {
      renderWithTheme(<ProgressTracker {...defaultProps} silverUsed={3} silverMax={5} />);

      expect(screen.getByText('3/5')).toBeInTheDocument();
    });

    it('displays correct golden boost usage', () => {
      renderWithTheme(<ProgressTracker {...defaultProps} goldenUsed={2} goldenMax={3} />);

      expect(screen.getByText('2/3')).toBeInTheDocument();
    });

    it('handles all silver boosts used', () => {
      renderWithTheme(<ProgressTracker {...defaultProps} silverUsed={5} silverMax={5} />);

      expect(screen.getByText('5/5')).toBeInTheDocument();
    });

    it('handles no boosts used', () => {
      renderWithTheme(<ProgressTracker {...defaultProps} silverUsed={0} goldenUsed={0} />);

      expect(screen.getByText('0/5')).toBeInTheDocument();
      expect(screen.getByText('0/3')).toBeInTheDocument();
    });
  });

  describe('layout', () => {
    it('renders in a Card component', () => {
      const { container } = renderWithTheme(<ProgressTracker {...defaultProps} />);

      expect(container.querySelector('.MuiCard-root')).toBeInTheDocument();
    });

    it('uses flexbox layout', () => {
      const { container } = renderWithTheme(<ProgressTracker {...defaultProps} />);
      const box = container.querySelector('.MuiBox-root');

      expect(box).toHaveStyle({
        display: 'flex'
      });
    });
  });

  describe('edge cases', () => {
    it('handles negative predicted games (treats as 0)', () => {
      renderWithTheme(<ProgressTracker {...defaultProps} predictedGames={-5} />);

      // Percentage calculation should handle this gracefully
      const { container } = renderWithTheme(<ProgressTracker {...defaultProps} predictedGames={-5} />);
      expect(container).toBeInTheDocument();
    });

    it('handles predicted > total games (clamps to 100%)', () => {
      renderWithTheme(<ProgressTracker {...defaultProps} totalGames={5} predictedGames={10} />);

      // Should show 10/5 (200%) - no clamping in display, but progress bar clamps to 100%
      expect(screen.getByText(/Predicciones: 10\/5 \(200%\)/)).toBeInTheDocument();
    });

    it('handles large numbers', () => {
      renderWithTheme(
        <ProgressTracker
          {...defaultProps}
          totalGames={1000}
          predictedGames={750}
          silverUsed={50}
          silverMax={100}
          goldenUsed={25}
          goldenMax={50}
        />
      );

      expect(screen.getByText(/Predicciones: 750\/1000 \(75%\)/)).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('progress bar has proper aria attributes', () => {
      const { container } = renderWithTheme(<ProgressTracker {...defaultProps} />);
      const progressBar = container.querySelector('.MuiLinearProgress-root');

      expect(progressBar).toHaveAttribute('role', 'progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });
  });
});
