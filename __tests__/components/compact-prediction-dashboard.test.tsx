import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { CompactPredictionDashboard } from '@/app/components/compact-prediction-dashboard';
import { renderWithTheme } from '@/__tests__/utils/test-utils';
import type { Team } from '@/app/db/tables-definition';
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

  const defaultProps = {
    totalGames: 10,
    predictedGames: 7,
    urgentGames: [mockGame],
    urgentGameGuesses: {},
    teamsMap: { team1: mockTeam },
    silverBoostsUsed: 2,
    silverBoostsMax: 5,
    goldenBoostsUsed: 1,
    goldenBoostsMax: 3,
  };

  const tournamentPredictionProps = {
    finalStandingsCompleted: 24,
    finalStandingsTotal: 32,
    awardsCompleted: 3,
    awardsTotal: 5,
    qualifiersCompleted: 12,
    qualifiersTotal: 16,
    overallPercentage: 75,
    isPredictionLocked: false,
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
      renderWithTheme(<CompactPredictionDashboard {...defaultProps} />);

      expect(screen.getByTestId('progress-row-Partidos')).toBeInTheDocument();
    });

    it('renders tournament predictions row when provided', () => {
      renderWithTheme(
        <CompactPredictionDashboard
          {...defaultProps}
          {...tournamentPredictionProps}
          tournamentId="tournament1"
        />
      );

      expect(screen.getByTestId('progress-row-Partidos')).toBeInTheDocument();
      expect(screen.getByTestId('progress-row-Torneo')).toBeInTheDocument();
    });

    it('does not render tournament row when predictions are missing', () => {
      renderWithTheme(<CompactPredictionDashboard {...defaultProps} />);

      expect(screen.getByTestId('progress-row-Partidos')).toBeInTheDocument();
      expect(screen.queryByTestId('progress-row-Torneo')).not.toBeInTheDocument();
    });

    it('does not render tournament row when tournament ID is missing', () => {
      renderWithTheme(
        <CompactPredictionDashboard
          {...defaultProps}
          {...tournamentPredictionProps}
        />
      );

      expect(screen.queryByTestId('progress-row-Torneo')).not.toBeInTheDocument();
    });

    it('renders tournament row when individual props are provided (even without overallPercentage)', () => {
      renderWithTheme(
        <CompactPredictionDashboard
          {...defaultProps}
          finalStandingsCompleted={2}
          finalStandingsTotal={3}
          awardsCompleted={3}
          awardsTotal={4}
          qualifiersCompleted={12}
          qualifiersTotal={16}
          isPredictionLocked={false}
          tournamentId="tournament1"
        />
      );

      // Dashboard should calculate percentage from individual props and render row
      expect(screen.getByTestId('progress-row-Torneo')).toBeInTheDocument();
    });
  });

  describe('Game Popover Interactions', () => {
    it('opens game details popover when game row is clicked', async () => {
      renderWithTheme(<CompactPredictionDashboard {...defaultProps} />);

      const gameRow = screen.getByTestId('progress-row-Partidos');
      fireEvent.click(gameRow);

      await waitFor(() => {
        expect(screen.getByTestId('game-details-popover')).toBeInTheDocument();
      });
    });

    it('closes game details popover when close button is clicked', async () => {
      renderWithTheme(<CompactPredictionDashboard {...defaultProps} />);

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
      renderWithTheme(
        <CompactPredictionDashboard
          {...defaultProps}
          {...tournamentPredictionProps}
          tournamentId="tournament1"
        />
      );

      const tournamentRow = screen.getByTestId('progress-row-Torneo');
      fireEvent.click(tournamentRow);

      await waitFor(() => {
        expect(screen.getByTestId('tournament-details-popover')).toBeInTheDocument();
      });
    });

    it('closes tournament details popover when close button is clicked', async () => {
      renderWithTheme(
        <CompactPredictionDashboard
          {...defaultProps}
          {...tournamentPredictionProps}
          tournamentId="tournament1"
        />
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

  describe('Boost Counts', () => {
    it('renders with custom boost counts', () => {
      renderWithTheme(
        <CompactPredictionDashboard
          {...defaultProps}
          silverBoostsUsed={3}
          silverBoostsMax={5}
          goldenBoostsUsed={2}
          goldenBoostsMax={3}
        />
      );

      // Component should render without errors and use prop values
      expect(screen.getByTestId('progress-row-Partidos')).toBeInTheDocument();
    });

    it('handles zero boost maxes', () => {
      renderWithTheme(
        <CompactPredictionDashboard
          {...defaultProps}
          silverBoostsUsed={0}
          silverBoostsMax={0}
          goldenBoostsUsed={0}
          goldenBoostsMax={0}
        />
      );

      expect(screen.getByTestId('progress-row-Partidos')).toBeInTheDocument();
    });

    it('handles all boosts used', () => {
      renderWithTheme(
        <CompactPredictionDashboard
          {...defaultProps}
          silverBoostsUsed={5}
          silverBoostsMax={5}
          goldenBoostsUsed={3}
          goldenBoostsMax={3}
        />
      );

      expect(screen.getByTestId('progress-row-Partidos')).toBeInTheDocument();
    });
  });

  describe('Demo Mode', () => {
    it('disables interactions in demo mode', () => {
      renderWithTheme(
        <CompactPredictionDashboard {...defaultProps} demoMode={true} />
      );

      const gameRow = screen.getByTestId('progress-row-Partidos');
      fireEvent.click(gameRow);

      // Should not open popover in demo mode
      expect(screen.queryByTestId('game-details-popover')).not.toBeInTheDocument();
    });

    it('renders normally in demo mode', () => {
      renderWithTheme(
        <CompactPredictionDashboard
          {...defaultProps}
          {...tournamentPredictionProps}
          demoMode={true}
          tournamentId="tournament1"
        />
      );

      expect(screen.getByTestId('progress-row-Partidos')).toBeInTheDocument();
      expect(screen.getByTestId('progress-row-Torneo')).toBeInTheDocument();
    });
  });

  describe('Urgent Games', () => {
    it('handles empty urgent games array', () => {
      renderWithTheme(
        <CompactPredictionDashboard
          {...defaultProps}
          urgentGames={[]}
        />
      );

      expect(screen.getByTestId('progress-row-Partidos')).toBeInTheDocument();
    });

    it('handles urgent games with guesses', () => {
      renderWithTheme(
        <CompactPredictionDashboard
          {...defaultProps}
          urgentGames={[mockGame]}
          urgentGameGuesses={{
            'game1': { home_score: 2, away_score: 1 }
          }}
        />
      );

      expect(screen.getByTestId('progress-row-Partidos')).toBeInTheDocument();
    });

    it('handles urgent games without guesses', () => {
      renderWithTheme(
        <CompactPredictionDashboard
          {...defaultProps}
          urgentGames={[mockGame]}
          urgentGameGuesses={{}}
        />
      );

      expect(screen.getByTestId('progress-row-Partidos')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles zero predicted games', () => {
      renderWithTheme(
        <CompactPredictionDashboard {...defaultProps} predictedGames={0} />
      );

      expect(screen.getByTestId('progress-row-Partidos')).toBeInTheDocument();
    });

    it('handles zero total games', () => {
      renderWithTheme(
        <CompactPredictionDashboard {...defaultProps} totalGames={0} />
      );

      expect(screen.getByTestId('progress-row-Partidos')).toBeInTheDocument();
    });

    it('handles complete predictions', () => {
      renderWithTheme(
        <CompactPredictionDashboard
          {...defaultProps}
          predictedGames={10}
          totalGames={10}
        />
      );

      expect(screen.getByTestId('progress-row-Partidos')).toBeInTheDocument();
    });

    it('handles undefined urgentGames', () => {
      renderWithTheme(
        <CompactPredictionDashboard
          {...defaultProps}
          urgentGames={undefined}
        />
      );

      expect(screen.getByTestId('progress-row-Partidos')).toBeInTheDocument();
    });

    it('handles undefined urgentGameGuesses', () => {
      renderWithTheme(
        <CompactPredictionDashboard
          {...defaultProps}
          urgentGameGuesses={undefined}
        />
      );

      expect(screen.getByTestId('progress-row-Partidos')).toBeInTheDocument();
    });
  });

  describe('Tournament Start Date', () => {
    it('renders with past tournament start date', () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
      renderWithTheme(
        <CompactPredictionDashboard
          {...defaultProps}
          tournamentStartDate={pastDate}
        />
      );

      expect(screen.getByTestId('progress-row-Partidos')).toBeInTheDocument();
    });

    it('renders with future tournament start date', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
      renderWithTheme(
        <CompactPredictionDashboard
          {...defaultProps}
          tournamentStartDate={futureDate}
        />
      );

      expect(screen.getByTestId('progress-row-Partidos')).toBeInTheDocument();
    });
  });

  describe('Multiple Interactions', () => {
    it('handles switching between popovers', async () => {
      renderWithTheme(
        <CompactPredictionDashboard
          {...defaultProps}
          {...tournamentPredictionProps}
          tournamentId="tournament1"
        />
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
      renderWithTheme(
        <CompactPredictionDashboard
          {...defaultProps}
          {...tournamentPredictionProps}
          tournamentId="tournament1"
        />
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

  describe('Flattened Tournament Predictions Props', () => {
    it('handles partial tournament prediction props', () => {
      renderWithTheme(
        <CompactPredictionDashboard
          {...defaultProps}
          finalStandingsCompleted={10}
          finalStandingsTotal={32}
          tournamentId="tournament1"
        />
      );

      // Should not render tournament row when all props are not present
      expect(screen.queryByTestId('progress-row-Torneo')).not.toBeInTheDocument();
    });

    it('handles complete tournament prediction props with all values', () => {
      renderWithTheme(
        <CompactPredictionDashboard
          {...defaultProps}
          {...tournamentPredictionProps}
          tournamentId="tournament1"
        />
      );

      expect(screen.getByTestId('progress-row-Torneo')).toBeInTheDocument();
    });

    it('handles zero values in tournament predictions', () => {
      renderWithTheme(
        <CompactPredictionDashboard
          {...defaultProps}
          finalStandingsCompleted={0}
          finalStandingsTotal={32}
          awardsCompleted={0}
          awardsTotal={5}
          qualifiersCompleted={0}
          qualifiersTotal={16}
          overallPercentage={0}
          isPredictionLocked={false}
          tournamentId="tournament1"
        />
      );

      expect(screen.getByTestId('progress-row-Torneo')).toBeInTheDocument();
    });

    it('handles locked tournament predictions', () => {
      renderWithTheme(
        <CompactPredictionDashboard
          {...defaultProps}
          {...tournamentPredictionProps}
          isPredictionLocked={true}
          tournamentId="tournament1"
        />
      );

      expect(screen.getByTestId('progress-row-Torneo')).toBeInTheDocument();
    });

    it('handles 100% complete tournament predictions', () => {
      renderWithTheme(
        <CompactPredictionDashboard
          {...defaultProps}
          finalStandingsCompleted={32}
          finalStandingsTotal={32}
          awardsCompleted={5}
          awardsTotal={5}
          qualifiersCompleted={16}
          qualifiersTotal={16}
          overallPercentage={100}
          isPredictionLocked={false}
          tournamentId="tournament1"
        />
      );

      expect(screen.getByTestId('progress-row-Torneo')).toBeInTheDocument();
    });
  });
});
