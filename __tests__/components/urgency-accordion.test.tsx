import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material';
import { UrgencyAccordion } from '../../app/components/urgency-accordion';
import type { ExtendedGameData } from '../../app/definitions';
import type { Team, GameGuessNew } from '../../app/db/tables-definition';

// Mock UrgencyGameCard
vi.mock('../../app/components/urgency-game-card', () => ({
  UrgencyGameCard: ({ game, isPredicted, prediction }: any) => (
    <div data-testid={`game-card-${game.id}`}>
      Game: {game.id} | Predicted: {String(isPredicted)} | Score: {prediction ? `${prediction.homeScore}-${prediction.awayScore}` : 'N/A'}
    </div>
  )
}));

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('UrgencyAccordion', () => {
  const mockTeamsMap: Record<string, Team> = {
    'team1': {
      id: 'team1',
      name: 'Argentina',
      short_name: 'ARG',
      theme: { primary_color: '#74ACDF', secondary_color: '#FFFFFF' }
    },
    'team2': {
      id: 'team2',
      name: 'Brasil',
      short_name: 'BRA',
      theme: { primary_color: '#009B3A', secondary_color: '#FEDF00' }
    }
  };

  const mockGames: ExtendedGameData[] = [
    {
      id: 'game1',
      tournament_id: 'tournament1',
      game_number: 1,
      home_team: 'team1',
      away_team: 'team2',
      game_date: new Date('2024-11-22T16:30:00Z'),
      location: 'Stadium 1',
      game_type: 'group',
      home_team_rule: undefined,
      away_team_rule: undefined,
      game_local_timezone: 'America/Montevideo',
      playoffStage: undefined
    },
    {
      id: 'game2',
      tournament_id: 'tournament1',
      game_number: 2,
      home_team: 'team2',
      away_team: 'team1',
      game_date: new Date('2024-11-22T18:30:00Z'),
      location: 'Stadium 2',
      game_type: 'group',
      home_team_rule: undefined,
      away_team_rule: undefined,
      game_local_timezone: 'America/Montevideo',
      playoffStage: undefined
    }
  ];

  const mockGameGuesses: Record<string, GameGuessNew> = {
    'game2': {
      game_id: 'game2',
      game_number: 2,
      user_id: 'user1',
      home_score: 2,
      away_score: 1,
      home_penalty_winner: false,
      away_penalty_winner: false,
      boost_type: null,
      home_team: 'team2',
      away_team: 'team1'
    }
  };

  const mockOnToggle = vi.fn();
  const mockOnEditGame = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('renders accordion with title', () => {
      renderWithTheme(
        <UrgencyAccordion
          severity="error"
          title="2 partidos cierran en 2 horas"
          games={mockGames}
          teamsMap={mockTeamsMap}
          gameGuesses={mockGameGuesses}
          isExpanded={false}
          onToggle={mockOnToggle}
          tierId="urgent"
          onEditGame={mockOnEditGame}
        />
      );

      expect(screen.getByText('2 partidos cierran en 2 horas')).toBeInTheDocument();
    });

    it('renders with error severity styling', () => {
      renderWithTheme(
        <UrgencyAccordion
          severity="error"
          title="2 partidos cierran en 2 horas"
          games={mockGames}
          teamsMap={mockTeamsMap}
          gameGuesses={mockGameGuesses}
          isExpanded={false}
          onToggle={mockOnToggle}
          tierId="urgent"
          onEditGame={mockOnEditGame}
        />
      );

      // Error icon should be present
      const errorIcon = document.querySelector('[data-testid="ErrorIcon"]');
      expect(errorIcon).toBeInTheDocument();
    });

    it('renders with warning severity styling', () => {
      renderWithTheme(
        <UrgencyAccordion
          severity="warning"
          title="3 partidos cierran en 24 horas"
          games={mockGames}
          teamsMap={mockTeamsMap}
          gameGuesses={mockGameGuesses}
          isExpanded={false}
          onToggle={mockOnToggle}
          tierId="warning"
          onEditGame={mockOnEditGame}
        />
      );

      // Warning icon should be present
      const warningIcon = document.querySelector('[data-testid="WarningIcon"]');
      expect(warningIcon).toBeInTheDocument();
    });

    it('renders with info severity styling', () => {
      renderWithTheme(
        <UrgencyAccordion
          severity="info"
          title="4 partidos cierran en 2 días"
          games={mockGames}
          teamsMap={mockTeamsMap}
          gameGuesses={mockGameGuesses}
          isExpanded={false}
          onToggle={mockOnToggle}
          tierId="notice"
          onEditGame={mockOnEditGame}
        />
      );

      // Info icon should be present
      const infoIcon = document.querySelector('[data-testid="InfoIcon"]');
      expect(infoIcon).toBeInTheDocument();
    });

    it('renders expand icon', () => {
      renderWithTheme(
        <UrgencyAccordion
          severity="error"
          title="2 partidos cierran en 2 horas"
          games={mockGames}
          teamsMap={mockTeamsMap}
          gameGuesses={mockGameGuesses}
          isExpanded={false}
          onToggle={mockOnToggle}
          tierId="urgent"
          onEditGame={mockOnEditGame}
        />
      );

      const expandIcon = document.querySelector('[data-testid="ExpandMoreIcon"]');
      expect(expandIcon).toBeInTheDocument();
    });
  });

  describe('game grouping', () => {
    it('groups games into unpredicted and predicted sections', () => {
      renderWithTheme(
        <UrgencyAccordion
          severity="error"
          title="2 partidos cierran en 2 horas"
          games={mockGames}
          teamsMap={mockTeamsMap}
          gameGuesses={mockGameGuesses}
          isExpanded={true}
          onToggle={mockOnToggle}
          tierId="urgent"
          onEditGame={mockOnEditGame}
        />
      );

      // Should show both sections
      expect(screen.getByText(/REQUIEREN ACCIÓN \(1\)/)).toBeInTheDocument();
      expect(screen.getByText(/YA PREDICHOS \(1\)/)).toBeInTheDocument();
    });

    it('shows only unpredicted section when all games are unpredicted', () => {
      renderWithTheme(
        <UrgencyAccordion
          severity="error"
          title="2 partidos cierran en 2 horas"
          games={mockGames}
          teamsMap={mockTeamsMap}
          gameGuesses={{}}
          isExpanded={true}
          onToggle={mockOnToggle}
          tierId="urgent"
          onEditGame={mockOnEditGame}
        />
      );

      expect(screen.getByText(/REQUIEREN ACCIÓN \(2\)/)).toBeInTheDocument();
      expect(screen.queryByText(/YA PREDICHOS/)).not.toBeInTheDocument();
    });

    it('shows only predicted section when all games are predicted', () => {
      const allPredicted: Record<string, GameGuessNew> = {
        'game1': {
          game_id: 'game1',
          game_number: 1,
          user_id: 'user1',
          home_score: 1,
          away_score: 0,
          home_penalty_winner: false,
          away_penalty_winner: false,
          boost_type: null,
          home_team: 'team1',
          away_team: 'team2'
        },
        'game2': {
          game_id: 'game2',
          game_number: 2,
          user_id: 'user1',
          home_score: 2,
          away_score: 1,
          home_penalty_winner: false,
          away_penalty_winner: false,
          boost_type: null,
          home_team: 'team2',
          away_team: 'team1'
        }
      };

      renderWithTheme(
        <UrgencyAccordion
          severity="error"
          title="2 partidos cierran en 2 horas"
          games={mockGames}
          teamsMap={mockTeamsMap}
          gameGuesses={allPredicted}
          isExpanded={true}
          onToggle={mockOnToggle}
          tierId="urgent"
          onEditGame={mockOnEditGame}
        />
      );

      expect(screen.queryByText(/REQUIEREN ACCIÓN/)).not.toBeInTheDocument();
      expect(screen.getByText(/YA PREDICHOS \(2\)/)).toBeInTheDocument();
    });

    it('renders correct number of game cards in each section', () => {
      renderWithTheme(
        <UrgencyAccordion
          severity="error"
          title="2 partidos cierran en 2 horas"
          games={mockGames}
          teamsMap={mockTeamsMap}
          gameGuesses={mockGameGuesses}
          isExpanded={true}
          onToggle={mockOnToggle}
          tierId="urgent"
          onEditGame={mockOnEditGame}
        />
      );

      expect(screen.getByTestId('game-card-game1')).toBeInTheDocument();
      expect(screen.getByTestId('game-card-game2')).toBeInTheDocument();
    });
  });

  describe('expansion behavior', () => {
    it('shows content when expanded', () => {
      renderWithTheme(
        <UrgencyAccordion
          severity="error"
          title="2 partidos cierran en 2 horas"
          games={mockGames}
          teamsMap={mockTeamsMap}
          gameGuesses={mockGameGuesses}
          isExpanded={true}
          onToggle={mockOnToggle}
          tierId="urgent"
          onEditGame={mockOnEditGame}
        />
      );

      expect(screen.getByText(/REQUIEREN ACCIÓN \(1\)/)).toBeInTheDocument();
      expect(screen.getByText(/YA PREDICHOS \(1\)/)).toBeInTheDocument();
    });

    it('calls onToggle when accordion is clicked', async () => {
      const user = userEvent.setup();

      const { container } = renderWithTheme(
        <UrgencyAccordion
          severity="error"
          title="2 partidos cierran en 2 horas"
          games={mockGames}
          teamsMap={mockTeamsMap}
          gameGuesses={mockGameGuesses}
          isExpanded={false}
          onToggle={mockOnToggle}
          tierId="urgent"
          onEditGame={mockOnEditGame}
        />
      );

      // Find the accordion summary by its ID
      const accordionHeader = container.querySelector('#urgent-header');
      if (accordionHeader) {
        await user.click(accordionHeader);
      }

      expect(mockOnToggle).toHaveBeenCalledWith('urgent');
    });
  });

  describe('edge cases', () => {
    it('handles empty games array', () => {
      renderWithTheme(
        <UrgencyAccordion
          severity="error"
          title="0 partidos cierran en 2 horas"
          games={[]}
          teamsMap={mockTeamsMap}
          gameGuesses={{}}
          isExpanded={true}
          onToggle={mockOnToggle}
          tierId="urgent"
          onEditGame={mockOnEditGame}
        />
      );

      expect(screen.queryByText(/REQUIEREN ACCIÓN/)).not.toBeInTheDocument();
      expect(screen.queryByText(/YA PREDICHOS/)).not.toBeInTheDocument();
    });

    it('handles games with partial predictions (missing scores)', () => {
      const partialGuesses: Record<string, GameGuessNew> = {
        'game1': {
          game_id: 'game1',
          game_number: 1,
          user_id: 'user1',
          home_score: undefined,
          away_score: undefined,
          home_penalty_winner: false,
          away_penalty_winner: false,
          boost_type: null,
          home_team: 'team1',
          away_team: 'team2'
        }
      };

      renderWithTheme(
        <UrgencyAccordion
          severity="error"
          title="2 partidos cierran en 2 horas"
          games={mockGames}
          teamsMap={mockTeamsMap}
          gameGuesses={partialGuesses}
          isExpanded={true}
          onToggle={mockOnToggle}
          tierId="urgent"
          onEditGame={mockOnEditGame}
        />
      );

      // Game1 should be in unpredicted because scores are null
      expect(screen.getByText(/REQUIEREN ACCIÓN \(2\)/)).toBeInTheDocument();
    });

    it('handles games with 0 scores (should count as predicted)', () => {
      const zeroScores: Record<string, GameGuessNew> = {
        'game1': {
          game_id: 'game1',
          game_number: 1,
          user_id: 'user1',
          home_score: 0,
          away_score: 0,
          home_penalty_winner: false,
          away_penalty_winner: false,
          boost_type: null,
          home_team: 'team1',
          away_team: 'team2'
        }
      };

      renderWithTheme(
        <UrgencyAccordion
          severity="error"
          title="2 partidos cierran en 2 horas"
          games={mockGames}
          teamsMap={mockTeamsMap}
          gameGuesses={zeroScores}
          isExpanded={true}
          onToggle={mockOnToggle}
          tierId="urgent"
          onEditGame={mockOnEditGame}
        />
      );

      // Game1 should be in predicted section (0-0 is a valid score)
      expect(screen.getByText(/YA PREDICHOS \(1\)/)).toBeInTheDocument();
      expect(screen.getByText(/REQUIEREN ACCIÓN \(1\)/)).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has proper aria-controls and id attributes', () => {
      renderWithTheme(
        <UrgencyAccordion
          severity="error"
          title="2 partidos cierran en 2 horas"
          games={mockGames}
          teamsMap={mockTeamsMap}
          gameGuesses={mockGameGuesses}
          isExpanded={false}
          onToggle={mockOnToggle}
          tierId="urgent"
          onEditGame={mockOnEditGame}
        />
      );

      const accordionHeader = document.getElementById('urgent-header');
      expect(accordionHeader).toBeInTheDocument();
      expect(accordionHeader).toHaveAttribute('aria-controls', 'urgent-content');
    });
  });
});
