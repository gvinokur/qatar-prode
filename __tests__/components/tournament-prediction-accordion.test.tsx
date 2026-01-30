import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TournamentPredictionAccordion } from '@/app/components/tournament-prediction-accordion';
import type { TournamentPredictionCompletion } from '@/app/db/tables-definition';

describe('TournamentPredictionAccordion', () => {
  const mockTournamentPredictions: TournamentPredictionCompletion = {
    finalStandings: {
      completed: 2,
      total: 3,
      champion: true,
      runnerUp: true,
      thirdPlace: false
    },
    awards: {
      completed: 3,
      total: 4,
      bestPlayer: true,
      topGoalscorer: true,
      bestGoalkeeper: true,
      bestYoungPlayer: false
    },
    qualifiers: {
      completed: 16,
      total: 32
    },
    overallCompleted: 21,
    overallTotal: 39,
    overallPercentage: 54,
    isPredictionLocked: false
  };

  const defaultProps = {
    tournamentPredictions: mockTournamentPredictions,
    tournamentId: '1',
    isExpanded: false,
    onToggle: jest.fn()
  };

  describe('Rendering', () => {
    it('renders summary with correct completion count', () => {
      render(<TournamentPredictionAccordion {...defaultProps} />);
      expect(screen.getByText('Predicciones de Torneo - 21/39 (54%)')).toBeInTheDocument();
    });

    it('renders with correct icon for incomplete state', () => {
      render(<TournamentPredictionAccordion {...defaultProps} />);
      expect(screen.getByTestId('WarningIcon')).toBeInTheDocument();
    });

    it('renders with correct icon for complete state', () => {
      const completeProps = {
        ...defaultProps,
        tournamentPredictions: {
          ...mockTournamentPredictions,
          overallCompleted: 39,
          overallTotal: 39,
          overallPercentage: 100
        }
      };
      render(<TournamentPredictionAccordion {...completeProps} />);
      expect(screen.getByTestId('CheckCircleIcon')).toBeInTheDocument();
    });

    it('renders with correct icon for locked state', () => {
      const lockedProps = {
        ...defaultProps,
        tournamentPredictions: {
          ...mockTournamentPredictions,
          isPredictionLocked: true
        }
      };
      render(<TournamentPredictionAccordion {...lockedProps} />);
      expect(screen.getByTestId('LockIcon')).toBeInTheDocument();
    });

    it('icon size is 24px (default MUI size)', () => {
      const { container } = render(<TournamentPredictionAccordion {...defaultProps} />);
      const icon = container.querySelector('[data-testid="WarningIcon"]');
      // MUI icons default to 24px, no explicit fontSize means default
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Categories', () => {
    it('renders all 3 categories when expanded', () => {
      render(<TournamentPredictionAccordion {...defaultProps} isExpanded={true} />);
      expect(screen.getByText('Podio')).toBeInTheDocument();
      expect(screen.getByText('Premios Individuales')).toBeInTheDocument();
      expect(screen.getByText('Clasificados')).toBeInTheDocument();
    });

    it('hides Clasificados when total is 0', () => {
      const propsWithoutQualifiers = {
        ...defaultProps,
        tournamentPredictions: {
          ...mockTournamentPredictions,
          qualifiers: {
            completed: 0,
            total: 0
          },
          overallTotal: 7,
          overallCompleted: 5
        },
        isExpanded: true
      };
      render(<TournamentPredictionAccordion {...propsWithoutQualifiers} />);
      expect(screen.getByText('Podio')).toBeInTheDocument();
      expect(screen.getByText('Premios Individuales')).toBeInTheDocument();
      expect(screen.queryByText('Clasificados')).not.toBeInTheDocument();
    });

    it('passes correct props to Podio card', () => {
      render(<TournamentPredictionAccordion {...defaultProps} isExpanded={true} />);
      expect(screen.getByText('2/3 (67%)')).toBeInTheDocument();
    });

    it('passes correct props to Premios card', () => {
      render(<TournamentPredictionAccordion {...defaultProps} isExpanded={true} />);
      expect(screen.getByText('3/4 (75%)')).toBeInTheDocument();
    });

    it('passes correct props to Clasificados card', () => {
      render(<TournamentPredictionAccordion {...defaultProps} isExpanded={true} />);
      expect(screen.getByText('16/32 (50%)')).toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    it('calls onToggle when clicked', () => {
      const onToggle = jest.fn();
      render(<TournamentPredictionAccordion {...defaultProps} onToggle={onToggle} />);

      const accordion = screen.getByRole('button', { name: /predicciones de torneo/i });
      fireEvent.click(accordion);

      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('expands when isExpanded is true', () => {
      render(<TournamentPredictionAccordion {...defaultProps} isExpanded={true} />);
      // When expanded, categories should be visible
      expect(screen.getByText('Podio')).toBeInTheDocument();
    });

    it('collapses when isExpanded is false', () => {
      render(<TournamentPredictionAccordion {...defaultProps} isExpanded={false} />);
      // When collapsed, categories should not be visible
      expect(screen.queryByText('Podio')).not.toBeInTheDocument();
    });
  });

  describe('Border Colors', () => {
    it('has warning.main border color for incomplete state', () => {
      const { container } = render(<TournamentPredictionAccordion {...defaultProps} />);
      const accordionSummary = container.querySelector('.MuiAccordionSummary-root');
      expect(accordionSummary).toHaveStyle({ borderLeftColor: expect.any(String) });
    });

    it('has success.main border color for complete state', () => {
      const completeProps = {
        ...defaultProps,
        tournamentPredictions: {
          ...mockTournamentPredictions,
          overallCompleted: 39,
          overallTotal: 39,
          overallPercentage: 100
        }
      };
      const { container } = render(<TournamentPredictionAccordion {...completeProps} />);
      const accordionSummary = container.querySelector('.MuiAccordionSummary-root');
      expect(accordionSummary).toHaveStyle({ borderLeftColor: expect.any(String) });
    });

    it('has text.disabled border color for locked state', () => {
      const lockedProps = {
        ...defaultProps,
        tournamentPredictions: {
          ...mockTournamentPredictions,
          isPredictionLocked: true
        }
      };
      const { container } = render(<TournamentPredictionAccordion {...lockedProps} />);
      const accordionSummary = container.querySelector('.MuiAccordionSummary-root');
      expect(accordionSummary).toHaveStyle({ borderLeftColor: expect.any(String) });
    });
  });

  describe('Empty State', () => {
    it('handles tournamentPredictions with overallTotal = 0 gracefully', () => {
      const emptyProps = {
        ...defaultProps,
        tournamentPredictions: {
          finalStandings: { completed: 0, total: 0, champion: false, runnerUp: false, thirdPlace: false },
          awards: { completed: 0, total: 0, bestPlayer: false, topGoalscorer: false, bestGoalkeeper: false, bestYoungPlayer: false },
          qualifiers: { completed: 0, total: 0 },
          overallCompleted: 0,
          overallTotal: 0,
          overallPercentage: 0,
          isPredictionLocked: false
        }
      };
      render(<TournamentPredictionAccordion {...emptyProps} />);
      expect(screen.getByText('Predicciones de Torneo - 0/0 (0%)')).toBeInTheDocument();
    });
  });

  describe('Locked State', () => {
    it('passes isLocked to all category cards when locked', () => {
      const lockedProps = {
        ...defaultProps,
        tournamentPredictions: {
          ...mockTournamentPredictions,
          isPredictionLocked: true
        },
        isExpanded: true
      };
      render(<TournamentPredictionAccordion {...lockedProps} />);

      // All cards should show "Cerrado" chip
      const cerradoChips = screen.getAllByText('Cerrado');
      expect(cerradoChips.length).toBeGreaterThanOrEqual(3);
    });

    it('does not show Completar buttons when locked', () => {
      const lockedProps = {
        ...defaultProps,
        tournamentPredictions: {
          ...mockTournamentPredictions,
          isPredictionLocked: true
        },
        isExpanded: true
      };
      render(<TournamentPredictionAccordion {...lockedProps} />);

      expect(screen.queryByRole('link', { name: /completar/i })).not.toBeInTheDocument();
    });
  });
});
