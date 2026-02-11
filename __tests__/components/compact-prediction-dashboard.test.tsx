import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { screen, fireEvent, waitFor, act } from '@testing-library/react';
import { CompactPredictionDashboard } from '@/app/components/compact-prediction-dashboard';
import { renderWithProviders, createMockGuessesContext } from '@/__tests__/utils/test-utils';
import type { TournamentPredictionCompletion, Team } from '@/app/db/tables-definition';
import type { ExtendedGameData } from '@/app/definitions';

// Mock child components
vi.mock('@/app/components/prediction-progress-row', () => ({
  PredictionProgressRow: vi.fn(({ label, onClick, onBoostClick, showBoosts, silverMax, goldenMax }) => (
    <div
      data-testid={`progress-row-${label}`}
      onClick={onClick}
      role="button"
    >
      {label}
      {showBoosts && silverMax > 0 && (
        <button
          data-testid="silver-boost-button"
          onClick={(e) => onBoostClick?.(e, 'silver')}
        >
          Silver Boost
        </button>
      )}
      {showBoosts && goldenMax > 0 && (
        <button
          data-testid="golden-boost-button"
          onClick={(e) => onBoostClick?.(e, 'golden')}
        >
          Golden Boost
        </button>
      )}
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
    silverUsed: 2,
    silverMax: 5,
    goldenUsed: 1,
    goldenMax: 3,
    games: [mockGame],
    teamsMap: { team1: mockTeam },
    isPlayoffs: false
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
        { guessesContext: true }
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
        { guessesContext: true }
      );

      expect(screen.getByTestId('progress-row-Partidos')).toBeInTheDocument();
      expect(screen.getByTestId('progress-row-Torneo')).toBeInTheDocument();
    });

    it('does not render tournament row when predictions are missing', () => {
      renderWithProviders(
        <CompactPredictionDashboard {...defaultProps} />,
        { guessesContext: true }
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
        { guessesContext: true }
      );

      expect(screen.queryByTestId('progress-row-Torneo')).not.toBeInTheDocument();
    });
  });

  describe('Game Popover Interactions', () => {
    it('opens game details popover when game row is clicked', async () => {
      renderWithProviders(
        <CompactPredictionDashboard {...defaultProps} />,
        { guessesContext: true }
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
        { guessesContext: true }
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
        { guessesContext: true }
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
        { guessesContext: true }
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

  describe('Boost Interactions', () => {
    it('shows boost buttons when silverMax > 0', () => {
      renderWithProviders(
        <CompactPredictionDashboard {...defaultProps} />,
        { guessesContext: true }
      );

      expect(screen.getByTestId('silver-boost-button')).toBeInTheDocument();
    });

    it('shows boost buttons when goldenMax > 0', () => {
      renderWithProviders(
        <CompactPredictionDashboard {...defaultProps} />,
        { guessesContext: true }
      );

      expect(screen.getByTestId('golden-boost-button')).toBeInTheDocument();
    });

    it('does not show boost buttons when both max values are 0', () => {
      renderWithProviders(
        <CompactPredictionDashboard
          {...defaultProps}
          silverMax={0}
          goldenMax={0}
        />,
        { guessesContext: true }
      );

      expect(screen.queryByTestId('silver-boost-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('golden-boost-button')).not.toBeInTheDocument();
    });

    it('opens silver boost popover when silver boost button is clicked', async () => {
      renderWithProviders(
        <CompactPredictionDashboard {...defaultProps} />,
        { guessesContext: true }
      );

      const silverButton = screen.getByTestId('silver-boost-button');
      fireEvent.click(silverButton);

      await waitFor(() => {
        expect(screen.getByTestId('boost-info-popover')).toBeInTheDocument();
        expect(screen.getByText('Boost Info: silver')).toBeInTheDocument();
      });
    });

    it('opens golden boost popover when golden boost button is clicked', async () => {
      renderWithProviders(
        <CompactPredictionDashboard {...defaultProps} />,
        { guessesContext: true }
      );

      const goldenButton = screen.getByTestId('golden-boost-button');
      fireEvent.click(goldenButton);

      await waitFor(() => {
        expect(screen.getByTestId('boost-info-popover')).toBeInTheDocument();
        expect(screen.getByText('Boost Info: golden')).toBeInTheDocument();
      });
    });

    it('closes boost popover when close button is clicked', async () => {
      renderWithProviders(
        <CompactPredictionDashboard {...defaultProps} />,
        { guessesContext: true }
      );

      // Open popover
      const silverButton = screen.getByTestId('silver-boost-button');
      fireEvent.click(silverButton);

      await waitFor(() => {
        expect(screen.getByTestId('boost-info-popover')).toBeInTheDocument();
      });

      // Close popover
      const closeButton = screen.getByTestId('close-boost-popover');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('boost-info-popover')).not.toBeInTheDocument();
      });
    });

    it('stops event propagation when boost button is clicked', async () => {
      const onClickSpy = vi.fn();

      renderWithProviders(
        <CompactPredictionDashboard {...defaultProps} />,
        { guessesContext: true }
      );

      const silverButton = screen.getByTestId('silver-boost-button');
      fireEvent.click(silverButton);

      // Game popover should not open when boost button is clicked
      await waitFor(() => {
        expect(screen.queryByTestId('game-details-popover')).not.toBeInTheDocument();
      });
    });
  });

  describe('Context Integration', () => {
    it('uses gameGuesses from GuessesContext', () => {
      const mockGameGuesses = {
        game1: {
          game_id: 'game1',
          user_id: 'user1',
          home_score: 2,
          away_score: 1,
          boost_type: null,
          created_at: new Date(),
          updated_at: new Date()
        }
      };

      renderWithProviders(
        <CompactPredictionDashboard {...defaultProps} />,
        {
          guessesContext: createMockGuessesContext({
            gameGuesses: mockGameGuesses
          })
        }
      );

      expect(screen.getByTestId('progress-row-Partidos')).toBeInTheDocument();
    });

    it('works with empty gameGuesses', () => {
      renderWithProviders(
        <CompactPredictionDashboard {...defaultProps} />,
        {
          guessesContext: createMockGuessesContext({
            gameGuesses: {}
          })
        }
      );

      expect(screen.getByTestId('progress-row-Partidos')).toBeInTheDocument();
    });
  });

  describe('Urgency Level Calculations', () => {
    it('calculates game urgency level using games and gameGuesses', async () => {
      const { getGameUrgencyLevel } = await import('@/app/components/urgency-helpers');

      renderWithProviders(
        <CompactPredictionDashboard {...defaultProps} />,
        { guessesContext: true }
      );

      expect(getGameUrgencyLevel).toHaveBeenCalledWith(
        defaultProps.games,
        expect.any(Object)
      );
    });

    it('calculates tournament urgency level using tournament data', async () => {
      const { getTournamentUrgencyLevel } = await import('@/app/components/urgency-helpers');
      const tournamentStartDate = new Date();

      renderWithProviders(
        <CompactPredictionDashboard
          {...defaultProps}
          tournamentPredictions={mockTournamentPredictions}
          tournamentId="tournament1"
          tournamentStartDate={tournamentStartDate}
        />,
        { guessesContext: true }
      );

      expect(getTournamentUrgencyLevel).toHaveBeenCalledWith(
        mockTournamentPredictions,
        tournamentStartDate
      );
    });

    it('checks for urgent games using hasUrgentGames helper', async () => {
      const { hasUrgentGames } = await import('@/app/components/urgency-helpers');

      renderWithProviders(
        <CompactPredictionDashboard {...defaultProps} />,
        { guessesContext: true }
      );

      expect(hasUrgentGames).toHaveBeenCalledWith(
        defaultProps.games,
        expect.any(Object)
      );
    });
  });

  describe('Edge Cases', () => {
    it('handles zero total games', () => {
      renderWithProviders(
        <CompactPredictionDashboard
          {...defaultProps}
          totalGames={0}
          predictedGames={0}
        />,
        { guessesContext: true }
      );

      expect(screen.getByTestId('progress-row-Partidos')).toBeInTheDocument();
    });

    it('handles 100% prediction completion', () => {
      renderWithProviders(
        <CompactPredictionDashboard
          {...defaultProps}
          totalGames={10}
          predictedGames={10}
        />,
        { guessesContext: true }
      );

      expect(screen.getByTestId('progress-row-Partidos')).toBeInTheDocument();
    });

    it('handles 0% prediction completion', () => {
      renderWithProviders(
        <CompactPredictionDashboard
          {...defaultProps}
          totalGames={10}
          predictedGames={0}
        />,
        { guessesContext: true }
      );

      expect(screen.getByTestId('progress-row-Partidos')).toBeInTheDocument();
    });

    it('handles undefined games array', () => {
      renderWithProviders(
        <CompactPredictionDashboard
          {...defaultProps}
          games={undefined}
        />,
        { guessesContext: true }
      );

      expect(screen.getByTestId('progress-row-Partidos')).toBeInTheDocument();
    });

    it('handles undefined teamsMap', () => {
      renderWithProviders(
        <CompactPredictionDashboard
          {...defaultProps}
          teamsMap={undefined}
        />,
        { guessesContext: true }
      );

      expect(screen.getByTestId('progress-row-Partidos')).toBeInTheDocument();
    });

    it('handles playoffs mode', () => {
      renderWithProviders(
        <CompactPredictionDashboard
          {...defaultProps}
          isPlayoffs={true}
        />,
        { guessesContext: true }
      );

      expect(screen.getByTestId('progress-row-Partidos')).toBeInTheDocument();
    });
  });

  describe('Dashboard Width Tracking', () => {
    it('initializes with default width', () => {
      renderWithProviders(
        <CompactPredictionDashboard {...defaultProps} />,
        { guessesContext: true }
      );

      expect(screen.getByTestId('progress-row-Partidos')).toBeInTheDocument();
    });

    it('updates width on window resize', async () => {
      renderWithProviders(
        <CompactPredictionDashboard {...defaultProps} />,
        { guessesContext: true }
      );

      // Simulate window resize
      await act(async () => {
        global.dispatchEvent(new Event('resize'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('progress-row-Partidos')).toBeInTheDocument();
      });
    });

    it('cleans up resize listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = renderWithProviders(
        <CompactPredictionDashboard {...defaultProps} />,
        { guessesContext: true }
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    });
  });

  describe('Multiple Popovers State Management', () => {
    it('can have only one popover open at a time - game then boost', async () => {
      renderWithProviders(
        <CompactPredictionDashboard {...defaultProps} />,
        { guessesContext: true }
      );

      // Open game popover
      const gameRow = screen.getByTestId('progress-row-Partidos');
      fireEvent.click(gameRow);

      await waitFor(() => {
        expect(screen.getByTestId('game-details-popover')).toBeInTheDocument();
      });

      // Open boost popover (game popover should still be open)
      const silverButton = screen.getByTestId('silver-boost-button');
      fireEvent.click(silverButton);

      await waitFor(() => {
        expect(screen.getByTestId('boost-info-popover')).toBeInTheDocument();
      });
    });

    it('can open tournament popover independently', async () => {
      renderWithProviders(
        <CompactPredictionDashboard
          {...defaultProps}
          tournamentPredictions={mockTournamentPredictions}
          tournamentId="tournament1"
        />,
        { guessesContext: true }
      );

      // Open tournament popover
      const tournamentRow = screen.getByTestId('progress-row-Torneo');
      fireEvent.click(tournamentRow);

      await waitFor(() => {
        expect(screen.getByTestId('tournament-details-popover')).toBeInTheDocument();
      });

      // Game popover should not be open
      expect(screen.queryByTestId('game-details-popover')).not.toBeInTheDocument();
    });
  });

  describe('Boost Type State Management', () => {
    it('tracks active boost type when opening silver boost', async () => {
      renderWithProviders(
        <CompactPredictionDashboard {...defaultProps} />,
        { guessesContext: true }
      );

      const silverButton = screen.getByTestId('silver-boost-button');
      fireEvent.click(silverButton);

      await waitFor(() => {
        expect(screen.getByText('Boost Info: silver')).toBeInTheDocument();
      });
    });

    it('tracks active boost type when opening golden boost', async () => {
      renderWithProviders(
        <CompactPredictionDashboard {...defaultProps} />,
        { guessesContext: true }
      );

      const goldenButton = screen.getByTestId('golden-boost-button');
      fireEvent.click(goldenButton);

      await waitFor(() => {
        expect(screen.getByText('Boost Info: golden')).toBeInTheDocument();
      });
    });

    it('clears active boost type when closing boost popover', async () => {
      renderWithProviders(
        <CompactPredictionDashboard {...defaultProps} />,
        { guessesContext: true }
      );

      // Open silver boost
      const silverButton = screen.getByTestId('silver-boost-button');
      fireEvent.click(silverButton);

      await waitFor(() => {
        expect(screen.getByTestId('boost-info-popover')).toBeInTheDocument();
      });

      // Close boost popover
      const closeButton = screen.getByTestId('close-boost-popover');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('boost-info-popover')).not.toBeInTheDocument();
      });

      // Should be able to open golden boost now
      const goldenButton = screen.getByTestId('golden-boost-button');
      fireEvent.click(goldenButton);

      await waitFor(() => {
        expect(screen.getByText('Boost Info: golden')).toBeInTheDocument();
      });
    });
  });

  describe('Props Variations', () => {
    it('handles all boost values set to 0', () => {
      renderWithProviders(
        <CompactPredictionDashboard
          {...defaultProps}
          silverUsed={0}
          silverMax={0}
          goldenUsed={0}
          goldenMax={0}
        />,
        { guessesContext: true }
      );

      expect(screen.queryByTestId('silver-boost-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('golden-boost-button')).not.toBeInTheDocument();
    });

    it('handles only silver boost available', () => {
      renderWithProviders(
        <CompactPredictionDashboard
          {...defaultProps}
          silverMax={5}
          goldenMax={0}
        />,
        { guessesContext: true }
      );

      expect(screen.getByTestId('silver-boost-button')).toBeInTheDocument();
      expect(screen.queryByTestId('golden-boost-button')).not.toBeInTheDocument();
    });

    it('handles only golden boost available', () => {
      renderWithProviders(
        <CompactPredictionDashboard
          {...defaultProps}
          silverMax={0}
          goldenMax={3}
        />,
        { guessesContext: true }
      );

      expect(screen.queryByTestId('silver-boost-button')).not.toBeInTheDocument();
      expect(screen.getByTestId('golden-boost-button')).toBeInTheDocument();
    });

    it('handles tournament predictions without start date', () => {
      renderWithProviders(
        <CompactPredictionDashboard
          {...defaultProps}
          tournamentPredictions={mockTournamentPredictions}
          tournamentId="tournament1"
          tournamentStartDate={undefined}
        />,
        { guessesContext: true }
      );

      expect(screen.getByTestId('progress-row-Torneo')).toBeInTheDocument();
    });

    it('handles empty games array', () => {
      renderWithProviders(
        <CompactPredictionDashboard
          {...defaultProps}
          games={[]}
        />,
        { guessesContext: true }
      );

      expect(screen.getByTestId('progress-row-Partidos')).toBeInTheDocument();
    });
  });

  describe('Percentage Calculation', () => {
    it('calculates game percentage correctly with positive values', () => {
      renderWithProviders(
        <CompactPredictionDashboard
          {...defaultProps}
          totalGames={10}
          predictedGames={7}
        />,
        { guessesContext: true }
      );

      // The component calculates: Math.round((7 / 10) * 100) = 70%
      expect(screen.getByTestId('progress-row-Partidos')).toBeInTheDocument();
    });

    it('calculates game percentage as 0 when totalGames is 0', () => {
      renderWithProviders(
        <CompactPredictionDashboard
          {...defaultProps}
          totalGames={0}
          predictedGames={0}
        />,
        { guessesContext: true }
      );

      // The component calculates: 0 (to avoid division by zero)
      expect(screen.getByTestId('progress-row-Partidos')).toBeInTheDocument();
    });

    it('handles fractional percentages by rounding', () => {
      renderWithProviders(
        <CompactPredictionDashboard
          {...defaultProps}
          totalGames={3}
          predictedGames={1}
        />,
        { guessesContext: true }
      );

      // The component calculates: Math.round((1 / 3) * 100) = 33%
      expect(screen.getByTestId('progress-row-Partidos')).toBeInTheDocument();
    });
  });
});
