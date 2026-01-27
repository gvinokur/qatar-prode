import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TournamentPredictionStatusBar } from '../../app/components/tournament-prediction-status-bar';
import { TournamentPredictionCompletion } from '../../app/db/tables-definition';

describe('TournamentPredictionStatusBar', () => {
  const tournamentId = 'tournament-1';

  const createCompletionData = (overrides?: Partial<TournamentPredictionCompletion>): TournamentPredictionCompletion => ({
    finalStandings: {
      completed: 0,
      total: 3,
      champion: false,
      runnerUp: false,
      thirdPlace: false,
    },
    awards: {
      completed: 0,
      total: 4,
      bestPlayer: false,
      topGoalscorer: false,
      bestGoalkeeper: false,
      bestYoungPlayer: false,
    },
    qualifiers: {
      completed: 0,
      total: 16,
    },
    overallCompleted: 0,
    overallTotal: 23,
    overallPercentage: 0,
    isPredictionLocked: false,
    ...overrides,
  });

  describe('Overall Progress Display', () => {
    it('renders overall completion count and percentage', () => {
      const completion = createCompletionData({
        overallCompleted: 10,
        overallTotal: 23,
        overallPercentage: 43,
      });

      render(<TournamentPredictionStatusBar completion={completion} tournamentId={tournamentId} />);

      expect(screen.getByText(/Predicciones Torneo: 10\/23 \(43%\)/)).toBeInTheDocument();
    });

    it('displays 0% for no predictions', () => {
      const completion = createCompletionData();

      render(<TournamentPredictionStatusBar completion={completion} tournamentId={tournamentId} />);

      expect(screen.getByText(/Predicciones Torneo: 0\/23 \(0%\)/)).toBeInTheDocument();
    });

    it('displays 100% for complete predictions', () => {
      const completion = createCompletionData({
        finalStandings: {
          completed: 3,
          total: 3,
          champion: true,
          runnerUp: true,
          thirdPlace: true,
        },
        awards: {
          completed: 4,
          total: 4,
          bestPlayer: true,
          topGoalscorer: true,
          bestGoalkeeper: true,
          bestYoungPlayer: true,
        },
        qualifiers: {
          completed: 16,
          total: 16,
        },
        overallCompleted: 23,
        overallTotal: 23,
        overallPercentage: 100,
      });

      render(<TournamentPredictionStatusBar completion={completion} tournamentId={tournamentId} />);

      expect(screen.getByText(/Predicciones Torneo: 23\/23 \(100%\)/)).toBeInTheDocument();
    });
  });

  describe('Category Status Display', () => {
    it('renders all three categories with correct completion counts', () => {
      const completion = createCompletionData({
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
      });

      render(<TournamentPredictionStatusBar completion={completion} tournamentId={tournamentId} />);

      expect(screen.getByText('Podio')).toBeInTheDocument();
      expect(screen.getByText(/2\/3 \(67%\)/)).toBeInTheDocument();

      expect(screen.getByText('Premios Individuales')).toBeInTheDocument();
      expect(screen.getByText(/3\/4 \(75%\)/)).toBeInTheDocument();

      expect(screen.getByText('Clasificados')).toBeInTheDocument();
      expect(screen.getByText(/8\/16 \(50%\)/)).toBeInTheDocument();
    });

    it('shows checkmark icon for completed categories', () => {
      const completion = createCompletionData({
        finalStandings: {
          completed: 3,
          total: 3,
          champion: true,
          runnerUp: true,
          thirdPlace: true,
        },
        awards: {
          completed: 0,
          total: 4,
          bestPlayer: false,
          topGoalscorer: false,
          bestGoalkeeper: false,
          bestYoungPlayer: false,
        },
        qualifiers: {
          completed: 0,
          total: 16,
        },
      });

      render(<TournamentPredictionStatusBar completion={completion} tournamentId={tournamentId} />);

      // CheckCircleIcon should be present for completed category
      const icons = document.querySelectorAll('svg[data-testid="CheckCircleIcon"]');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('shows warning icon for incomplete categories', () => {
      const completion = createCompletionData({
        finalStandings: {
          completed: 1,
          total: 3,
          champion: true,
          runnerUp: false,
          thirdPlace: false,
        },
      });

      render(<TournamentPredictionStatusBar completion={completion} tournamentId={tournamentId} />);

      // WarningIcon should be present for incomplete categories
      const icons = document.querySelectorAll('svg[data-testid="WarningIcon"]');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('hides qualifiers category when total is 0', () => {
      const completion = createCompletionData({
        qualifiers: {
          completed: 0,
          total: 0,
        },
        overallTotal: 7, // Only 3 + 4
      });

      render(<TournamentPredictionStatusBar completion={completion} tournamentId={tournamentId} />);

      expect(screen.getByText('Podio')).toBeInTheDocument();
      expect(screen.getByText('Premios Individuales')).toBeInTheDocument();
      expect(screen.queryByText('Clasificados')).not.toBeInTheDocument();
    });
  });

  describe('Action Links', () => {
    it('shows "Completar" button for incomplete categories when not locked', () => {
      const completion = createCompletionData({
        finalStandings: {
          completed: 1,
          total: 3,
          champion: true,
          runnerUp: false,
          thirdPlace: false,
        },
        isPredictionLocked: false,
      });

      render(<TournamentPredictionStatusBar completion={completion} tournamentId={tournamentId} />);

      const completarButtons = screen.getAllByText('Completar');
      expect(completarButtons.length).toBeGreaterThan(0);
    });

    it('hides "Completar" button for completed categories', () => {
      const completion = createCompletionData({
        finalStandings: {
          completed: 3,
          total: 3,
          champion: true,
          runnerUp: true,
          thirdPlace: true,
        },
        awards: {
          completed: 0,
          total: 4,
          bestPlayer: false,
          topGoalscorer: false,
          bestGoalkeeper: false,
          bestYoungPlayer: false,
        },
        qualifiers: {
          completed: 0,
          total: 16,
        },
        isPredictionLocked: false,
      });

      render(<TournamentPredictionStatusBar completion={completion} tournamentId={tournamentId} />);

      // Should have 2 "Completar" buttons (awards and qualifiers), not 3
      const completarButtons = screen.getAllByText('Completar');
      expect(completarButtons).toHaveLength(2);
    });

    it('links to correct pages', () => {
      const completion = createCompletionData({
        finalStandings: {
          completed: 0,
          total: 3,
          champion: false,
          runnerUp: false,
          thirdPlace: false,
        },
        awards: {
          completed: 0,
          total: 4,
          bestPlayer: false,
          topGoalscorer: false,
          bestGoalkeeper: false,
          bestYoungPlayer: false,
        },
        qualifiers: {
          completed: 0,
          total: 16,
        },
        isPredictionLocked: false,
      });

      render(<TournamentPredictionStatusBar completion={completion} tournamentId={tournamentId} />);

      // Check for links
      const links = screen.getAllByRole('link');

      // Podio and Premios Individuales should link to awards page
      const awardsLinks = links.filter(link =>
        link.getAttribute('href') === `/tournaments/${tournamentId}/awards`
      );
      expect(awardsLinks).toHaveLength(2);

      // Clasificados should link to playoffs page
      const playoffsLinks = links.filter(link =>
        link.getAttribute('href') === `/tournaments/${tournamentId}/playoffs`
      );
      expect(playoffsLinks).toHaveLength(1);
    });
  });

  describe('Lock Status', () => {
    it('shows "Cerrado" chip when predictions are locked', () => {
      const completion = createCompletionData({
        isPredictionLocked: true,
      });

      render(<TournamentPredictionStatusBar completion={completion} tournamentId={tournamentId} />);

      expect(screen.getByText('Cerrado')).toBeInTheDocument();
    });

    it('hides "Cerrado" chip when predictions are not locked', () => {
      const completion = createCompletionData({
        isPredictionLocked: false,
      });

      render(<TournamentPredictionStatusBar completion={completion} tournamentId={tournamentId} />);

      expect(screen.queryByText('Cerrado')).not.toBeInTheDocument();
    });

    it('shows lock icon for incomplete categories when locked', () => {
      const completion = createCompletionData({
        finalStandings: {
          completed: 1,
          total: 3,
          champion: true,
          runnerUp: false,
          thirdPlace: false,
        },
        isPredictionLocked: true,
      });

      render(<TournamentPredictionStatusBar completion={completion} tournamentId={tournamentId} />);

      // LockIcon should be present for incomplete categories when locked
      const icons = document.querySelectorAll('svg[data-testid="LockIcon"]');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('hides "Completar" buttons when locked', () => {
      const completion = createCompletionData({
        finalStandings: {
          completed: 1,
          total: 3,
          champion: true,
          runnerUp: false,
          thirdPlace: false,
        },
        isPredictionLocked: true,
      });

      render(<TournamentPredictionStatusBar completion={completion} tournamentId={tournamentId} />);

      expect(screen.queryByText('Completar')).not.toBeInTheDocument();
    });
  });

  describe('Alert Messages', () => {
    it('shows warning alert when incomplete and not locked', () => {
      const completion = createCompletionData({
        overallPercentage: 50,
        isPredictionLocked: false,
      });

      render(<TournamentPredictionStatusBar completion={completion} tournamentId={tournamentId} />);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent(/Completa tus predicciones de torneo antes del cierre/);
      expect(alert).toHaveClass('MuiAlert-standardWarning');
    });

    it('hides alert when predictions are complete', () => {
      const completion = createCompletionData({
        overallPercentage: 100,
        isPredictionLocked: false,
      });

      render(<TournamentPredictionStatusBar completion={completion} tournamentId={tournamentId} />);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('hides alert when predictions are locked', () => {
      const completion = createCompletionData({
        overallPercentage: 50,
        isPredictionLocked: true,
      });

      render(<TournamentPredictionStatusBar completion={completion} tournamentId={tournamentId} />);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles zero total predictions gracefully', () => {
      const completion = createCompletionData({
        finalStandings: { completed: 0, total: 3, champion: false, runnerUp: false, thirdPlace: false },
        awards: { completed: 0, total: 4, bestPlayer: false, topGoalscorer: false, bestGoalkeeper: false, bestYoungPlayer: false },
        qualifiers: { completed: 0, total: 0 },
        overallCompleted: 0,
        overallTotal: 7,
        overallPercentage: 0,
      });

      render(<TournamentPredictionStatusBar completion={completion} tournamentId={tournamentId} />);

      expect(screen.getByText(/Predicciones Torneo: 0\/7 \(0%\)/)).toBeInTheDocument();
    });

    it('calculates percentages correctly for each category', () => {
      const completion = createCompletionData({
        finalStandings: {
          completed: 1,
          total: 3,
          champion: true,
          runnerUp: false,
          thirdPlace: false,
        },
        awards: {
          completed: 2,
          total: 4,
          bestPlayer: true,
          topGoalscorer: true,
          bestGoalkeeper: false,
          bestYoungPlayer: false,
        },
        qualifiers: {
          completed: 4,
          total: 16,
        },
      });

      render(<TournamentPredictionStatusBar completion={completion} tournamentId={tournamentId} />);

      // Podio: 1/3 = 33%
      expect(screen.getByText(/1\/3 \(33%\)/)).toBeInTheDocument();

      // Awards: 2/4 = 50%
      expect(screen.getByText(/2\/4 \(50%\)/)).toBeInTheDocument();

      // Qualifiers: 4/16 = 25%
      expect(screen.getByText(/4\/16 \(25%\)/)).toBeInTheDocument();
    });
  });
});
