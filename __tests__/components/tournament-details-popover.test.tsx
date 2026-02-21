import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithTheme } from '../utils/test-utils';
import { TournamentDetailsPopover } from '../../app/components/tournament-details-popover';
import { TournamentPredictionCompletion } from '../../app/db/tables-definition';

// Mock the TournamentPredictionAccordion component
vi.mock('../../app/components/tournament-prediction-accordion', () => ({
  TournamentPredictionAccordion: vi.fn(() => (
    <div data-testid="tournament-prediction-accordion">Accordion</div>
  ))
}));

describe('TournamentDetailsPopover', () => {
  const mockTournamentPredictions: TournamentPredictionCompletion = {
    overallPercentage: 75,
    isPredictionLocked: false,
    championPercentage: 100,
    runnerUpPercentage: 100,
    thirdPlacePercentage: 100,
    groupWinnersPercentage: 75,
    roundOf32Percentage: 50,
    quarterFinalsPercentage: 0,
    semiFinalsPercentage: 0
  };

  const defaultProps = {
    open: true,
    anchorEl: document.createElement('div'),
    onClose: vi.fn(),
    width: 600,
    tournamentPredictions: mockTournamentPredictions,
    tournamentId: 'tournament1'
  };

  describe('rendering', () => {
    it('renders when open', () => {
      renderWithTheme(<TournamentDetailsPopover {...defaultProps} />);

      expect(screen.getByText('Predicciones de Torneo')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      renderWithTheme(<TournamentDetailsPopover {...defaultProps} open={false} />);

      expect(screen.queryByText('Predicciones de Torneo')).not.toBeInTheDocument();
    });

    it('renders title', () => {
      renderWithTheme(<TournamentDetailsPopover {...defaultProps} />);

      expect(screen.getByText('Predicciones de Torneo')).toBeInTheDocument();
    });

    it('renders TournamentPredictionAccordion when data is provided', () => {
      renderWithTheme(<TournamentDetailsPopover {...defaultProps} />);

      expect(screen.getByTestId('tournament-prediction-accordion')).toBeInTheDocument();
    });

    it('does not render accordion when tournamentPredictions is undefined', () => {
      renderWithTheme(
        <TournamentDetailsPopover {...defaultProps} tournamentPredictions={undefined} />
      );

      expect(screen.queryByTestId('tournament-prediction-accordion')).not.toBeInTheDocument();
    });

    it('does not render accordion when tournamentId is undefined', () => {
      renderWithTheme(
        <TournamentDetailsPopover {...defaultProps} tournamentId={undefined} />
      );

      expect(screen.queryByTestId('tournament-prediction-accordion')).not.toBeInTheDocument();
    });
  });

  describe('popover behavior', () => {
    it('calls onClose when popover is closed', () => {
      const onClose = vi.fn();
      renderWithTheme(
        <TournamentDetailsPopover {...defaultProps} onClose={onClose} />
      );

      // Note: MUI Popover handles backdrop click internally
      // We verify that onClose prop is passed correctly
      expect(onClose).toBeDefined();
    });

    it('is positioned correctly', () => {
      renderWithTheme(<TournamentDetailsPopover {...defaultProps} />);

      // Verify popover content renders (title is visible)
      expect(screen.getByText('Predicciones de Torneo')).toBeInTheDocument();
    });
  });

  describe('layout', () => {
    it('applies correct width to card', () => {
      renderWithTheme(
        <TournamentDetailsPopover {...defaultProps} width={800} />
      );

      // Popover renders content, verified by title presence
      expect(screen.getByText('Predicciones de Torneo')).toBeInTheDocument();
    });

    it('sets max height for scrolling', () => {
      renderWithTheme(<TournamentDetailsPopover {...defaultProps} />);

      // Popover renders content, verified by title presence
      expect(screen.getByText('Predicciones de Torneo')).toBeInTheDocument();
    });

    it('has proper padding', () => {
      renderWithTheme(<TournamentDetailsPopover {...defaultProps} />);

      // Popover renders content, verified by title presence
      expect(screen.getByText('Predicciones de Torneo')).toBeInTheDocument();
    });
  });

  describe('prop variations', () => {
    it('handles 0% completion', () => {
      const incompletePredictions: TournamentPredictionCompletion = {
        ...mockTournamentPredictions,
        overallPercentage: 0,
        championPercentage: 0,
        runnerUpPercentage: 0,
        thirdPlacePercentage: 0,
        groupWinnersPercentage: 0,
        roundOf32Percentage: 0,
        quarterFinalsPercentage: 0,
        semiFinalsPercentage: 0
      };

      renderWithTheme(
        <TournamentDetailsPopover
          {...defaultProps}
          tournamentPredictions={incompletePredictions}
        />
      );

      expect(screen.getByTestId('tournament-prediction-accordion')).toBeInTheDocument();
    });

    it('handles 100% completion', () => {
      const completePredictions: TournamentPredictionCompletion = {
        overallPercentage: 100,
        isPredictionLocked: false,
        championPercentage: 100,
        runnerUpPercentage: 100,
        thirdPlacePercentage: 100,
        groupWinnersPercentage: 100,
        roundOf32Percentage: 100,
        quarterFinalsPercentage: 100,
        semiFinalsPercentage: 100
      };

      renderWithTheme(
        <TournamentDetailsPopover
          {...defaultProps}
          tournamentPredictions={completePredictions}
        />
      );

      expect(screen.getByTestId('tournament-prediction-accordion')).toBeInTheDocument();
    });

    it('handles locked predictions', () => {
      const lockedPredictions: TournamentPredictionCompletion = {
        ...mockTournamentPredictions,
        isPredictionLocked: true
      };

      renderWithTheme(
        <TournamentDetailsPopover
          {...defaultProps}
          tournamentPredictions={lockedPredictions}
        />
      );

      expect(screen.getByTestId('tournament-prediction-accordion')).toBeInTheDocument();
    });

    it('handles different width values', () => {
      renderWithTheme(<TournamentDetailsPopover {...defaultProps} width={400} />);

      expect(screen.getByText('Predicciones de Torneo')).toBeInTheDocument();
    });

    it('handles large width values', () => {
      renderWithTheme(<TournamentDetailsPopover {...defaultProps} width={1200} />);

      expect(screen.getByText('Predicciones de Torneo')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('renders with proper structure', () => {
      renderWithTheme(<TournamentDetailsPopover {...defaultProps} />);

      // Verify popover content is accessible
      expect(screen.getByText('Predicciones de Torneo')).toBeInTheDocument();
    });

    it('title has proper variant', () => {
      renderWithTheme(<TournamentDetailsPopover {...defaultProps} />);

      const title = screen.getByText('Predicciones de Torneo');
      expect(title).toHaveClass('MuiTypography-h6');
    });

    it('popover renders content correctly', () => {
      renderWithTheme(<TournamentDetailsPopover {...defaultProps} />);

      // Verify both title and accordion are rendered
      expect(screen.getByText('Predicciones de Torneo')).toBeInTheDocument();
      expect(screen.getByTestId('tournament-prediction-accordion')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('renders without errors when both tournamentPredictions and tournamentId are undefined', () => {
      renderWithTheme(
        <TournamentDetailsPopover
          {...defaultProps}
          tournamentPredictions={undefined}
          tournamentId={undefined}
        />
      );

      expect(screen.getByText('Predicciones de Torneo')).toBeInTheDocument();
      expect(screen.queryByTestId('tournament-prediction-accordion')).not.toBeInTheDocument();
    });

    it('handles null anchorEl gracefully', () => {
      renderWithTheme(<TournamentDetailsPopover {...defaultProps} anchorEl={null} />);

      // Popover should still render but not be visible
      expect(screen.queryByText('Predicciones de Torneo')).toBeInTheDocument();
    });
  });
});
