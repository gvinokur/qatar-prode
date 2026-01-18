import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PredictionStatusBar } from '../../app/components/prediction-status-bar';

describe('PredictionStatusBar', () => {
  const defaultProps = {
    totalGames: 48,
    predictedGames: 24,
    silverUsed: 3,
    silverMax: 5,
    goldenUsed: 1,
    goldenMax: 2,
    urgentGames: 0,
    warningGames: 0,
    noticeGames: 0,
  };

  describe('Progress Display', () => {
    it('renders prediction count and percentage', () => {
      render(<PredictionStatusBar {...defaultProps} />);

      expect(screen.getByText(/Predicciones: 24\/48 \(50%\)/)).toBeInTheDocument();
    });

    it('calculates percentage correctly', () => {
      render(
        <PredictionStatusBar
          {...defaultProps}
          predictedGames={32}
          totalGames={48}
        />
      );

      expect(screen.getByText(/Predicciones: 32\/48 \(67%\)/)).toBeInTheDocument();
    });

    it('handles 0% correctly', () => {
      render(
        <PredictionStatusBar
          {...defaultProps}
          predictedGames={0}
        />
      );

      expect(screen.getByText(/Predicciones: 0\/48 \(0%\)/)).toBeInTheDocument();
    });

    it('handles 100% correctly', () => {
      render(
        <PredictionStatusBar
          {...defaultProps}
          predictedGames={48}
        />
      );

      expect(screen.getByText(/Predicciones: 48\/48 \(100%\)/)).toBeInTheDocument();
    });

    it('handles division by zero when totalGames is 0', () => {
      render(
        <PredictionStatusBar
          {...defaultProps}
          totalGames={0}
          predictedGames={0}
        />
      );

      expect(screen.getByText(/Predicciones: 0\/0 \(0%\)/)).toBeInTheDocument();
    });
  });

  describe('Boost Display', () => {
    it('shows boost indicators when max values > 0', () => {
      render(<PredictionStatusBar {...defaultProps} />);

      expect(screen.getByText('Multiplicadores:')).toBeInTheDocument();
      expect(screen.getByText(/2x: 3\/5/)).toBeInTheDocument();
      expect(screen.getByText(/3x: 1\/2/)).toBeInTheDocument();
    });

    it('hides boost section when both max values are 0', () => {
      render(
        <PredictionStatusBar
          {...defaultProps}
          silverMax={0}
          goldenMax={0}
        />
      );

      expect(screen.queryByText('Multiplicadores:')).not.toBeInTheDocument();
    });

    it('shows only silver boost when golden max is 0', () => {
      render(
        <PredictionStatusBar
          {...defaultProps}
          goldenMax={0}
        />
      );

      expect(screen.getByText('Multiplicadores:')).toBeInTheDocument();
      expect(screen.getByText(/2x: 3\/5/)).toBeInTheDocument();
      expect(screen.queryByText(/3x:/)).not.toBeInTheDocument();
    });

    it('shows only golden boost when silver max is 0', () => {
      render(
        <PredictionStatusBar
          {...defaultProps}
          silverMax={0}
        />
      );

      expect(screen.getByText('Multiplicadores:')).toBeInTheDocument();
      expect(screen.queryByText(/2x:/)).not.toBeInTheDocument();
      expect(screen.getByText(/3x: 1\/2/)).toBeInTheDocument();
    });
  });

  describe('Urgency Warnings', () => {
    it('does not render warnings when all counts are 0', () => {
      render(<PredictionStatusBar {...defaultProps} />);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('renders urgent warning (red/error)', () => {
      render(
        <PredictionStatusBar
          {...defaultProps}
          urgentGames={2}
        />
      );

      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('2 partidos cierran en 2 horas');
      expect(alert).toHaveClass('MuiAlert-standardError');
    });

    it('renders warning alert (orange/warning)', () => {
      render(
        <PredictionStatusBar
          {...defaultProps}
          warningGames={5}
        />
      );

      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('5 partidos cierran en 24 horas');
      expect(alert).toHaveClass('MuiAlert-standardWarning');
    });

    it('renders notice alert (blue/info)', () => {
      render(
        <PredictionStatusBar
          {...defaultProps}
          noticeGames={10}
        />
      );

      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('10 partidos cierran en 2 días');
      expect(alert).toHaveClass('MuiAlert-standardInfo');
    });

    it('uses singular form for 1 game', () => {
      render(
        <PredictionStatusBar
          {...defaultProps}
          urgentGames={1}
        />
      );

      expect(screen.getByText('1 partido cierra en 2 horas')).toBeInTheDocument();
    });

    it('uses plural form for multiple games', () => {
      render(
        <PredictionStatusBar
          {...defaultProps}
          warningGames={3}
        />
      );

      expect(screen.getByText('3 partidos cierran en 24 horas')).toBeInTheDocument();
    });

    it('renders multiple warnings in correct order', () => {
      render(
        <PredictionStatusBar
          {...defaultProps}
          urgentGames={1}
          warningGames={2}
          noticeGames={3}
        />
      );

      const alerts = screen.getAllByRole('alert');
      expect(alerts).toHaveLength(3);

      // Urgent (red) first
      expect(alerts[0]).toHaveTextContent('1 partido cierra en 2 horas');
      expect(alerts[0]).toHaveClass('MuiAlert-standardError');

      // Warning (orange) second
      expect(alerts[1]).toHaveTextContent('2 partidos cierran en 24 horas');
      expect(alerts[1]).toHaveClass('MuiAlert-standardWarning');

      // Notice (blue) third
      expect(alerts[2]).toHaveTextContent('3 partidos cierran en 2 días');
      expect(alerts[2]).toHaveClass('MuiAlert-standardInfo');
    });
  });

  describe('Edge Cases', () => {
    it('handles very large numbers', () => {
      render(
        <PredictionStatusBar
          {...defaultProps}
          totalGames={1000}
          predictedGames={999}
          urgentGames={50}
        />
      );

      expect(screen.getByText(/Predicciones: 999\/1000 \(100%\)/)).toBeInTheDocument();
      expect(screen.getByText('50 partidos cierran en 2 horas')).toBeInTheDocument();
    });

    it('handles negative values gracefully (should not happen in production)', () => {
      render(
        <PredictionStatusBar
          {...defaultProps}
          predictedGames={-5}
        />
      );

      // Component should still render without crashing
      expect(screen.getByText(/Predicciones:/)).toBeInTheDocument();
    });
  });
});
