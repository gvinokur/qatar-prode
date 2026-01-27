import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PredictionStatusBar } from '../../app/components/prediction-status-bar';
import { TournamentPredictionCompletion } from '../../app/db/tables-definition';

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

  describe('Tournament Predictions', () => {
    const mockTournamentPredictions: TournamentPredictionCompletion = {
      finalStandings: {
        completed: 2,
        total: 3,
        champion: true,
        runnerUp: true,
        thirdPlace: false,
      },
      awards: {
        completed: 3,
        total: 4,
        bestPlayer: true,
        topGoalscorer: true,
        bestGoalkeeper: true,
        bestYoungPlayer: false,
      },
      qualifiers: {
        completed: 8,
        total: 16,
      },
      overallCompleted: 13,
      overallTotal: 23,
      overallPercentage: 57,
      isPredictionLocked: false,
    };

    it('does not render tournament section when tournamentPredictions is not provided', () => {
      render(<PredictionStatusBar {...defaultProps} />);

      expect(screen.queryByText('Predicciones de Torneo')).not.toBeInTheDocument();
    });

    it('renders tournament predictions section when provided', () => {
      render(
        <PredictionStatusBar
          {...defaultProps}
          tournamentPredictions={mockTournamentPredictions}
          tournamentId="tournament-1"
        />
      );

      expect(screen.getByText('Predicciones de Torneo')).toBeInTheDocument();
    });

    it('renders final standings category', () => {
      render(
        <PredictionStatusBar
          {...defaultProps}
          tournamentPredictions={mockTournamentPredictions}
          tournamentId="tournament-1"
        />
      );

      expect(screen.getByText('Podio')).toBeInTheDocument();
      expect(screen.getByText('2/3 (67%)')).toBeInTheDocument();
    });

    it('renders awards category', () => {
      render(
        <PredictionStatusBar
          {...defaultProps}
          tournamentPredictions={mockTournamentPredictions}
          tournamentId="tournament-1"
        />
      );

      expect(screen.getByText('Premios Individuales')).toBeInTheDocument();
      expect(screen.getByText('3/4 (75%)')).toBeInTheDocument();
    });

    it('renders qualifiers category when total > 0', () => {
      render(
        <PredictionStatusBar
          {...defaultProps}
          tournamentPredictions={mockTournamentPredictions}
          tournamentId="tournament-1"
        />
      );

      expect(screen.getByText('Clasificados')).toBeInTheDocument();
      expect(screen.getByText('8/16 (50%)')).toBeInTheDocument();
    });

    it('does not render qualifiers when total is 0', () => {
      const predictionsWithNoQualifiers: TournamentPredictionCompletion = {
        ...mockTournamentPredictions,
        qualifiers: { completed: 0, total: 0 },
      };

      render(
        <PredictionStatusBar
          {...defaultProps}
          tournamentPredictions={predictionsWithNoQualifiers}
          tournamentId="tournament-1"
        />
      );

      expect(screen.queryByText('Clasificados')).not.toBeInTheDocument();
    });

    it('shows Completar button for incomplete categories when not locked', () => {
      render(
        <PredictionStatusBar
          {...defaultProps}
          tournamentPredictions={mockTournamentPredictions}
          tournamentId="tournament-1"
        />
      );

      const completarButtons = screen.getAllByText('Completar');
      expect(completarButtons.length).toBeGreaterThan(0);
    });

    it('does not show Completar button when category is complete', () => {
      const completePredictions: TournamentPredictionCompletion = {
        ...mockTournamentPredictions,
        finalStandings: {
          completed: 3,
          total: 3,
          champion: true,
          runnerUp: true,
          thirdPlace: true,
        },
      };

      render(
        <PredictionStatusBar
          {...defaultProps}
          tournamentPredictions={completePredictions}
          tournamentId="tournament-1"
        />
      );

      // Should have fewer Completar buttons since one category is complete
      const completarButtons = screen.queryAllByText('Completar');
      expect(completarButtons.length).toBeLessThan(3);
    });

    it('shows Cerrado chip when predictions are locked', () => {
      const lockedPredictions: TournamentPredictionCompletion = {
        ...mockTournamentPredictions,
        isPredictionLocked: true,
      };

      render(
        <PredictionStatusBar
          {...defaultProps}
          tournamentPredictions={lockedPredictions}
          tournamentId="tournament-1"
        />
      );

      const cerradoChips = screen.getAllByText('Cerrado');
      expect(cerradoChips.length).toBeGreaterThan(0);
    });

    it('does not show Completar buttons when locked', () => {
      const lockedPredictions: TournamentPredictionCompletion = {
        ...mockTournamentPredictions,
        isPredictionLocked: true,
      };

      render(
        <PredictionStatusBar
          {...defaultProps}
          tournamentPredictions={lockedPredictions}
          tournamentId="tournament-1"
        />
      );

      expect(screen.queryByText('Completar')).not.toBeInTheDocument();
    });

    it('renders tournament urgency warning for < 2 hours until lock', () => {
      const now = new Date();
      // Lock time is 5 days after tournament start
      // For < 2 hours until lock: tournament should have started 4 days, 23 hours ago
      const tournamentStart = new Date(now.getTime() - (5 * 24 * 60 * 60 * 1000 - 1 * 60 * 60 * 1000)); // 1 hour until lock

      render(
        <PredictionStatusBar
          {...defaultProps}
          tournamentPredictions={mockTournamentPredictions}
          tournamentId="tournament-1"
          tournamentStartDate={tournamentStart}
        />
      );

      expect(screen.getByText('Predicciones de torneo cierran en 2 horas')).toBeInTheDocument();
    });

    it('renders tournament warning for < 24 hours until lock', () => {
      const now = new Date();
      // For 12 hours until lock: tournament should have started 4 days, 12 hours ago
      const tournamentStart = new Date(now.getTime() - (5 * 24 * 60 * 60 * 1000 - 12 * 60 * 60 * 1000)); // 12 hours until lock

      render(
        <PredictionStatusBar
          {...defaultProps}
          tournamentPredictions={mockTournamentPredictions}
          tournamentId="tournament-1"
          tournamentStartDate={tournamentStart}
        />
      );

      expect(screen.getByText('Predicciones de torneo cierran en 24 horas')).toBeInTheDocument();
    });

    it('renders tournament info for < 48 hours until lock', () => {
      const now = new Date();
      // For 36 hours until lock: tournament should have started 3 days, 12 hours ago
      const tournamentStart = new Date(now.getTime() - (5 * 24 * 60 * 60 * 1000 - 36 * 60 * 60 * 1000)); // 36 hours until lock

      render(
        <PredictionStatusBar
          {...defaultProps}
          tournamentPredictions={mockTournamentPredictions}
          tournamentId="tournament-1"
          tournamentStartDate={tournamentStart}
        />
      );

      expect(screen.getByText('Predicciones de torneo cierran en 2 días')).toBeInTheDocument();
    });

    it('does not render tournament warning when locked', () => {
      const lockedPredictions: TournamentPredictionCompletion = {
        ...mockTournamentPredictions,
        isPredictionLocked: true,
      };

      const now = new Date();
      const tournamentStart = new Date(now.getTime() - (5 * 24 * 60 * 60 * 1000 - 1 * 60 * 60 * 1000));

      render(
        <PredictionStatusBar
          {...defaultProps}
          tournamentPredictions={lockedPredictions}
          tournamentId="tournament-1"
          tournamentStartDate={tournamentStart}
        />
      );

      expect(screen.queryByText(/Predicciones de torneo cierran/)).not.toBeInTheDocument();
    });

    it('does not render tournament warning when 100% complete', () => {
      const completePredictions: TournamentPredictionCompletion = {
        ...mockTournamentPredictions,
        overallPercentage: 100,
      };

      const now = new Date();
      const tournamentStart = new Date(now.getTime() - (5 * 24 * 60 * 60 * 1000 - 1 * 60 * 60 * 1000));

      render(
        <PredictionStatusBar
          {...defaultProps}
          tournamentPredictions={completePredictions}
          tournamentId="tournament-1"
          tournamentStartDate={tournamentStart}
        />
      );

      expect(screen.queryByText(/Predicciones de torneo cierran/)).not.toBeInTheDocument();
    });

    it('combines game and tournament warnings', () => {
      const now = new Date();
      const tournamentStart = new Date(now.getTime() - (5 * 24 * 60 * 60 * 1000 - 1 * 60 * 60 * 1000));

      render(
        <PredictionStatusBar
          {...defaultProps}
          urgentGames={2}
          tournamentPredictions={mockTournamentPredictions}
          tournamentId="tournament-1"
          tournamentStartDate={tournamentStart}
        />
      );

      const alerts = screen.getAllByRole('alert');
      expect(alerts.length).toBe(2);
      expect(screen.getByText('2 partidos cierran en 2 horas')).toBeInTheDocument();
      expect(screen.getByText('Predicciones de torneo cierran en 2 horas')).toBeInTheDocument();
    });
  });
});
