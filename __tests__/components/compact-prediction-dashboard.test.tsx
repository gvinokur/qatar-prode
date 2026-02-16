import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { CompactPredictionDashboard } from '@/app/components/compact-prediction-dashboard';
import { renderWithProviders, createMockGuessesContext } from '@/__tests__/utils/test-utils';
import type { TournamentPredictionCompletion, Team } from '@/app/db/tables-definition';
import type { ExtendedGameData } from '@/app/definitions';

// Mock child components
vi.mock('@/app/components/prediction-progress-row', () => ({
  PredictionProgressRow: vi.fn(({ label, onClick }) => (
    <div
      data-testid={`progress-row-${label}`}
      onClick={onClick}
      role="button"
    >
      {label}
    </div>
  ))
}));

vi.mock('@/app/components/boost-info-popover', () => ({
  default: vi.fn(({ open, boostType, onClose }) => (
    open ? (
      <div data-testid="boost-info-popover">
        Boost Info: {boostType}
        <button onClick={onClose} data-testid="close-boost-popover">Close</button>
      </div>
    ) : null
  ))
}));

vi.mock('@/app/components/game-details-popover', () => ({
  GameDetailsPopover: vi.fn(({ open, onClose }) => (
    open ? (
      <div data-testid="game-details-popover">
        Game Details
        <button onClick={onClose} data-testid="close-game-popover">Close</button>
      </div>
    ) : null
  ))
}));

vi.mock('@/app/components/tournament-details-popover', () => ({
  TournamentDetailsPopover: vi.fn(({ open, onClose }) => (
    open ? (
      <div data-testid="tournament-details-popover">
        Tournament Details
        <button onClick={onClose} data-testid="close-tournament-popover">Close</button>
      </div>
    ) : null
  ))
}));

// Mock urgency helpers
vi.mock('@/app/components/urgency-helpers', () => ({
  getGameUrgencyLevel: vi.fn(() => 'notice'),
  getTournamentUrgencyLevel: vi.fn(() => 'warning'),
  hasUrgentGames: vi.fn(() => false),
  getUrgencyIcon: vi.fn(() => <span>Icon</span>)
}));

describe('CompactPredictionDashboard', () => {
  const mockTeam: Team = {
    id: 'team1',
    name: 'Team 1',
    slug: 'team-1',
    flag_url: '/flags/team1.png',
    group: 'A',
    tournament_id: 'tournament1',
    created_at: new Date(),
    updated_at: new Date()
  };

  const mockGame: ExtendedGameData = {
    id: 'game1',
    home_team_id: 'team1',
    away_team_id: 'team2',
    game_date: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    group: 'A',
    stage: 'group',
    tournament_id: 'tournament1',
    home_score: null,
    away_score: null,
    created_at: new Date(),
    updated_at: new Date(),
    home_team: mockTeam,
    away_team: { ...mockTeam, id: 'team2', name: 'Team 2' }
  };

  const mockTournamentPredictions: TournamentPredictionCompletion = {
    overallPercentage: 75,
    isPredictionLocked: false,
    breakdown: {
      groups: {
        totalPositions: 32,
        predictedPositions: 24,
        percentageComplete: 75
      },
      qualifiedTeams: {
        totalTeams: 16,
        predictedTeams: 12,
        percentageComplete: 75
      }
    }
  };

  const defaultProps = {
    totalGames: 10,
    predictedGames: 7,
    games: [mockGame],
    teamsMap: { team1: mockTeam },
    isPlayoffs: false
  };

  const defaultBoostCounts = {
    silver: { used: 2, max: 5 },
    golden: { used: 1, max: 3 },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window resize observer
    global.ResizeObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn()
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders game predictions row', () => {
      renderWithProviders(
        <CompactPredictionDashboard {...defaultProps} />,
        {
          guessesContext: createMockGuessesContext({
            boostCounts: defaultBoostCounts,
          }),
        }
      );

      expect(screen.getByTestId('progress-row-Partidos')).toBeInTheDocument();
    });

    it('renders tournament predictions row when provided', () => {
      renderWithProviders(
        <CompactPredictionDashboard
          {...defaultProps}
          tournamentPredictions={mockTournamentPredictions}
          tournamentId="tournament1"
        />,
        {
          guessesContext: createMockGuessesContext({
            boostCounts: defaultBoostCounts,
          }),
        }
      );

      expect(screen.getByTestId('progress-row-Partidos')).toBeInTheDocument();
      expect(screen.getByTestId('progress-row-Torneo')).toBeInTheDocument();
    });

    it('does not render tournament row when predictions are missing', () => {
      renderWithProviders(
        <CompactPredictionDashboard {...defaultProps} />,
        {
          guessesContext: createMockGuessesContext({
            boostCounts: defaultBoostCounts,
          }),
        }
      );

      expect(screen.getByTestId('progress-row-Partidos')).toBeInTheDocument();
      expect(screen.queryByTestId('progress-row-Torneo')).not.toBeInTheDocument();
    });

    it('does not render tournament row when tournament ID is missing', () => {
      renderWithProviders(
        <CompactPredictionDashboard
          {...defaultProps}
          tournamentPredictions={mockTournamentPredictions}
        />,
        {
          guessesContext: createMockGuessesContext({
            boostCounts: defaultBoostCounts,
          }),
        }
      );

      expect(screen.queryByTestId('progress-row-Torneo')).not.toBeInTheDocument();
    });
  });

  describe('Game Popover Interactions', () => {
    it('opens game details popover when game row is clicked', async () => {
      renderWithProviders(
        <CompactPredictionDashboard {...defaultProps} />,
        {
          guessesContext: createMockGuessesContext({
            boostCounts: defaultBoostCounts,
          }),
        }
      );

      const gameRow = screen.getByTestId('progress-row-Partidos');
      fireEvent.click(gameRow);

      await waitFor(() => {
        expect(screen.getByTestId('game-details-popover')).toBeInTheDocument();
      });
    });

    it('closes game details popover when close button is clicked', async () => {
      renderWithProviders(
        <CompactPredictionDashboard {...defaultProps} />,
        {
          guessesContext: createMockGuessesContext({
            boostCounts: defaultBoostCounts,
          }),
        }
      );

      // Open popover
      const gameRow = screen.getByTestId('progress-row-Partidos');
      fireEvent.click(gameRow);

      await waitFor(() => {
        expect(screen.getByTestId('game-details-popover')).toBeInTheDocument();
      });

      // Close popover
      const closeButton = screen.getByTestId('close-game-popover');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('game-details-popover')).not.toBeInTheDocument();
      });
    });
  });

  describe('Tournament Popover Interactions', () => {
    it('opens tournament details popover when tournament row is clicked', async () => {
      renderWithProviders(
        <CompactPredictionDashboard
          {...defaultProps}
          tournamentPredictions={mockTournamentPredictions}
          tournamentId="tournament1"
        />,
        {
          guessesContext: createMockGuessesContext({
            boostCounts: defaultBoostCounts,
          }),
        }
      );

      const tournamentRow = screen.getByTestId('progress-row-Torneo');
      fireEvent.click(tournamentRow);

      await waitFor(() => {
        expect(screen.getByTestId('tournament-details-popover')).toBeInTheDocument();
      });
    });

    it('closes tournament details popover when close button is clicked', async () => {
      renderWithProviders(
        <CompactPredictionDashboard
          {...defaultProps}
          tournamentPredictions={mockTournamentPredictions}
          tournamentId="tournament1"
        />,
        {
          guessesContext: createMockGuessesContext({
            boostCounts: defaultBoostCounts,
          }),
        }
      );

      // Open popover
      const tournamentRow = screen.getByTestId('progress-row-Torneo');
      fireEvent.click(tournamentRow);

      await waitFor(() => {
        expect(screen.getByTestId('tournament-details-popover')).toBeInTheDocument();
      });

      // Close popover
      const closeButton = screen.getByTestId('close-tournament-popover');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('tournament-details-popover')).not.toBeInTheDocument();
      });
    });
  });

  describe('Boost Counts from Context', () => {
    it('reads boost counts from GuessesContext', () => {
      renderWithProviders(
        <CompactPredictionDashboard {...defaultProps} />,
        {
          guessesContext: createMockGuessesContext({
            boostCounts: {
              silver: { used: 3, max: 5 },
              golden: { used: 2, max: 3 },
            },
          }),
        }
      );

      // Component should render without errors and use context values
      expect(screen.getByTestId('progress-row-Partidos')).toBeInTheDocument();
    });

    it('handles zero boost maxes', () => {
      renderWithProviders(
        <CompactPredictionDashboard {...defaultProps} />,
        {
          guessesContext: createMockGuessesContext({
            boostCounts: {
              silver: { used: 0, max: 0 },
              golden: { used: 0, max: 0 },
            },
          }),
        }
      );

      expect(screen.getByTestId('progress-row-Partidos')).toBeInTheDocument();
    });
  });

  describe('Demo Mode', () => {
    it('disables interactions in demo mode', () => {
      renderWithProviders(
        <CompactPredictionDashboard {...defaultProps} demoMode={true} />,
        {
          guessesContext: createMockGuessesContext({
            boostCounts: defaultBoostCounts,
          }),
        }
      );

      const gameRow = screen.getByTestId('progress-row-Partidos');
      fireEvent.click(gameRow);

      // Should not open popover in demo mode
      expect(screen.queryByTestId('game-details-popover')).not.toBeInTheDocument();
    });

    it('renders normally in demo mode', () => {
      renderWithProviders(
        <CompactPredictionDashboard
          {...defaultProps}
          demoMode={true}
          tournamentPredictions={mockTournamentPredictions}
          tournamentId="tournament1"
        />,
        {
          guessesContext: createMockGuessesContext({
            boostCounts: defaultBoostCounts,
          }),
        }
      );

      expect(screen.getByTestId('progress-row-Partidos')).toBeInTheDocument();
      expect(screen.getByTestId('progress-row-Torneo')).toBeInTheDocument();
    });
  });

  describe('Playoffs Mode', () => {
    it('renders correctly for playoffs', () => {
      renderWithProviders(
        <CompactPredictionDashboard {...defaultProps} isPlayoffs={true} />,
        {
          guessesContext: createMockGuessesContext({
            boostCounts: defaultBoostCounts,
          }),
        }
      );

      expect(screen.getByTestId('progress-row-Partidos')).toBeInTheDocument();
    });

    it('renders playoffs with tournament predictions', () => {
      renderWithProviders(
        <CompactPredictionDashboard
          {...defaultProps}
          isPlayoffs={true}
          tournamentPredictions={mockTournamentPredictions}
          tournamentId="tournament1"
        />,
        {
          guessesContext: createMockGuessesContext({
            boostCounts: defaultBoostCounts,
          }),
        }
      );

      expect(screen.getByTestId('progress-row-Partidos')).toBeInTheDocument();
      expect(screen.getByTestId('progress-row-Torneo')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty games array', () => {
      renderWithProviders(
        <CompactPredictionDashboard {...defaultProps} games={[]} />,
        {
          guessesContext: createMockGuessesContext({
            boostCounts: defaultBoostCounts,
          }),
        }
      );

      expect(screen.getByTestId('progress-row-Partidos')).toBeInTheDocument();
    });

    it('handles zero predicted games', () => {
      renderWithProviders(
        <CompactPredictionDashboard {...defaultProps} predictedGames={0} />,
        {
          guessesContext: createMockGuessesContext({
            boostCounts: defaultBoostCounts,
          }),
        }
      );

      expect(screen.getByTestId('progress-row-Partidos')).toBeInTheDocument();
    });

    it('handles zero total games', () => {
      renderWithProviders(
        <CompactPredictionDashboard {...defaultProps} totalGames={0} />,
        {
          guessesContext: createMockGuessesContext({
            boostCounts: defaultBoostCounts,
          }),
        }
      );

      expect(screen.getByTestId('progress-row-Partidos')).toBeInTheDocument();
    });

    it('handles complete predictions', () => {
      renderWithProviders(
        <CompactPredictionDashboard
          {...defaultProps}
          predictedGames={10}
          totalGames={10}
        />,
        {
          guessesContext: createMockGuessesContext({
            boostCounts: defaultBoostCounts,
          }),
        }
      );

      expect(screen.getByTestId('progress-row-Partidos')).toBeInTheDocument();
    });
  });

  describe('Tournament Start Date', () => {
    it('renders with past tournament start date', () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
      renderWithProviders(
        <CompactPredictionDashboard
          {...defaultProps}
          tournamentStartDate={pastDate}
        />,
        {
          guessesContext: createMockGuessesContext({
            boostCounts: defaultBoostCounts,
          }),
        }
      );

      expect(screen.getByTestId('progress-row-Partidos')).toBeInTheDocument();
    });

    it('renders with future tournament start date', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
      renderWithProviders(
        <CompactPredictionDashboard
          {...defaultProps}
          tournamentStartDate={futureDate}
        />,
        {
          guessesContext: createMockGuessesContext({
            boostCounts: defaultBoostCounts,
          }),
        }
      );

      expect(screen.getByTestId('progress-row-Partidos')).toBeInTheDocument();
    });
  });

  describe('Multiple Interactions', () => {
    it('handles switching between popovers', async () => {
      renderWithProviders(
        <CompactPredictionDashboard
          {...defaultProps}
          tournamentPredictions={mockTournamentPredictions}
          tournamentId="tournament1"
        />,
        {
          guessesContext: createMockGuessesContext({
            boostCounts: defaultBoostCounts,
          }),
        }
      );

      // Open game popover
      const gameRow = screen.getByTestId('progress-row-Partidos');
      fireEvent.click(gameRow);

      await waitFor(() => {
        expect(screen.getByTestId('game-details-popover')).toBeInTheDocument();
      });

      // Close game popover
      const closeGameButton = screen.getByTestId('close-game-popover');
      fireEvent.click(closeGameButton);

      await waitFor(() => {
        expect(screen.queryByTestId('game-details-popover')).not.toBeInTheDocument();
      });

      // Open tournament popover
      const tournamentRow = screen.getByTestId('progress-row-Torneo');
      fireEvent.click(tournamentRow);

      await waitFor(() => {
        expect(screen.getByTestId('tournament-details-popover')).toBeInTheDocument();
      });
    });

    it('closes tournament popover and opens game popover', async () => {
      renderWithProviders(
        <CompactPredictionDashboard
          {...defaultProps}
          tournamentPredictions={mockTournamentPredictions}
          tournamentId="tournament1"
        />,
        {
          guessesContext: createMockGuessesContext({
            boostCounts: defaultBoostCounts,
          }),
        }
      );

      // Open tournament popover
      const tournamentRow = screen.getByTestId('progress-row-Torneo');
      fireEvent.click(tournamentRow);

      await waitFor(() => {
        expect(screen.getByTestId('tournament-details-popover')).toBeInTheDocument();
      });

      // Close tournament popover
      const closeTournamentButton = screen.getByTestId('close-tournament-popover');
      fireEvent.click(closeTournamentButton);

      await waitFor(() => {
        expect(screen.queryByTestId('tournament-details-popover')).not.toBeInTheDocument();
      });

      // Open game popover
      const gameRow = screen.getByTestId('progress-row-Partidos');
      fireEvent.click(gameRow);

      await waitFor(() => {
        expect(screen.getByTestId('game-details-popover')).toBeInTheDocument();
      });
    });
  });
});
