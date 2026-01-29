import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material';
import { UrgencyAccordionGroup } from '../../app/components/urgency-accordion-group';
import type { ExtendedGameData } from '../../app/definitions';
import type { Team, GameGuessNew } from '../../app/db/tables-definition';

// Mock UrgencyAccordion
vi.mock('../../app/components/urgency-accordion', () => ({
  UrgencyAccordion: ({ severity, title, games, isExpanded, tierId }: any) => (
    <div data-testid={`accordion-${tierId}`}>
      <div data-testid={`accordion-title-${tierId}`}>{title}</div>
      <div data-testid={`accordion-severity-${tierId}`}>{severity}</div>
      <div data-testid={`accordion-expanded-${tierId}`}>{String(isExpanded)}</div>
      <div data-testid={`accordion-games-${tierId}`}>{games.length}</div>
    </div>
  )
}));

// Mock GameResultEditDialog
vi.mock('../../app/components/game-result-edit-dialog', () => ({
  default: ({ open, gameId, onClose }: any) => (
    open ? <div data-testid="edit-dialog">Editing game: {gameId}</div> : null
  )
}));

// Mock GuessesContext
const mockUpdateGameGuess = vi.fn();
vi.mock('../../app/components/context-providers/guesses-context-provider', () => ({
  GuessesContext: {
    Provider: ({ children }: any) => children,
    Consumer: ({ children }: any) => children({ updateGameGuess: mockUpdateGameGuess })
  },
  useContext: () => ({ updateGameGuess: mockUpdateGameGuess })
}));

// Mock useCountdownContext
const mockCurrentTime = Date.now();
vi.mock('../../app/components/context-providers/countdown-context-provider', () => ({
  useCountdownContext: () => ({ currentTime: mockCurrentTime })
}));

// Mock next-auth
vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { id: 'user1' } } })
}));

// Mock guesses actions
vi.mock('../../app/actions/guesses-actions', () => ({
  updateOrCreateTournamentGuess: vi.fn()
}));

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('UrgencyAccordionGroup', () => {
  const ONE_HOUR = 60 * 60 * 1000;

  const mockTeamsMap: Record<string, Team> = {
    'team1': {
      id: 'team1',
      name: 'Argentina',
      short_name: 'ARG',
      tournament_id: 'tournament1',
      theme: 'argentina',
      group_id: null
    },
    'team2': {
      id: 'team2',
      name: 'Brasil',
      short_name: 'BRA',
      tournament_id: 'tournament1',
      theme: 'brasil',
      group_id: null
    }
  };

  // Create games at different urgency levels relative to mockCurrentTime
  const urgentGame: ExtendedGameData = {
    id: 'urgent-game',
    tournament_id: 'tournament1',
    game_number: 1,
    home_team: 'team1',
    away_team: 'team2',
    game_date: new Date(mockCurrentTime + ONE_HOUR + 30 * 60 * 1000), // 1.5 hours from now
    location: 'Stadium 1',
    game_type: 'group',
    home_team_rule: undefined,
    away_team_rule: undefined,
    game_local_timezone: 'America/Montevideo',
    playoffStage: undefined
  };

  const warningGame: ExtendedGameData = {
    id: 'warning-game',
    tournament_id: 'tournament1',
    game_number: 2,
    home_team: 'team2',
    away_team: 'team1',
    game_date: new Date(mockCurrentTime + ONE_HOUR + 5 * ONE_HOUR), // 6 hours from now
    location: 'Stadium 2',
    game_type: 'group',
    home_team_rule: undefined,
    away_team_rule: undefined,
    game_local_timezone: 'America/Montevideo',
    playoffStage: undefined
  };

  const noticeGame: ExtendedGameData = {
    id: 'notice-game',
    tournament_id: 'tournament1',
    game_number: 3,
    home_team: 'team1',
    away_team: 'team2',
    game_date: new Date(mockCurrentTime + ONE_HOUR + 30 * ONE_HOUR), // 31 hours from now
    location: 'Stadium 3',
    game_type: 'group',
    home_team_rule: undefined,
    away_team_rule: undefined,
    game_local_timezone: 'America/Montevideo',
    playoffStage: undefined
  };

  const tooFarGame: ExtendedGameData = {
    id: 'far-game',
    tournament_id: 'tournament1',
    game_number: 4,
    home_team: 'team2',
    away_team: 'team1',
    game_date: new Date(mockCurrentTime + ONE_HOUR + 50 * ONE_HOUR), // 51 hours from now (beyond 48h)
    location: 'Stadium 4',
    game_type: 'group',
    home_team_rule: undefined,
    away_team_rule: undefined,
    game_local_timezone: 'America/Montevideo',
    playoffStage: undefined
  };

  const closedGame: ExtendedGameData = {
    id: 'closed-game',
    tournament_id: 'tournament1',
    game_number: 5,
    home_team: 'team1',
    away_team: 'team2',
    game_date: new Date(mockCurrentTime - 2 * ONE_HOUR), // 2 hours ago (closed)
    location: 'Stadium 5',
    game_type: 'group',
    home_team_rule: undefined,
    away_team_rule: undefined,
    game_local_timezone: 'America/Montevideo',
    playoffStage: undefined
  };

  const mockGameGuesses: Record<string, GameGuessNew> = {
    'warning-game': {
      game_id: 'warning-game',
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('game filtering by urgency tier', () => {
    it('filters games correctly into urgent tier (< 2h)', () => {
      renderWithTheme(
        <UrgencyAccordionGroup
          games={[urgentGame, warningGame, noticeGame]}
          teamsMap={mockTeamsMap}
          gameGuesses={{}}
          tournamentId="tournament1"
          isPlayoffs={false}
        />
      );

      const urgentAccordion = screen.queryByTestId('accordion-urgent');
      expect(urgentAccordion).toBeInTheDocument();
      expect(screen.getByTestId('accordion-games-urgent')).toHaveTextContent('1');
    });

    it('filters games correctly into warning tier (2-24h)', () => {
      renderWithTheme(
        <UrgencyAccordionGroup
          games={[urgentGame, warningGame, noticeGame]}
          teamsMap={mockTeamsMap}
          gameGuesses={{}}
          tournamentId="tournament1"
          isPlayoffs={false}
        />
      );

      const warningAccordion = screen.queryByTestId('accordion-warning');
      expect(warningAccordion).toBeInTheDocument();
      expect(screen.getByTestId('accordion-games-warning')).toHaveTextContent('1');
    });

    it('filters games correctly into notice tier (24-48h)', () => {
      renderWithTheme(
        <UrgencyAccordionGroup
          games={[urgentGame, warningGame, noticeGame]}
          teamsMap={mockTeamsMap}
          gameGuesses={{}}
          tournamentId="tournament1"
          isPlayoffs={false}
        />
      );

      const noticeAccordion = screen.queryByTestId('accordion-notice');
      expect(noticeAccordion).toBeInTheDocument();
      expect(screen.getByTestId('accordion-games-notice')).toHaveTextContent('1');
    });

    it('excludes games beyond 48 hours', () => {
      renderWithTheme(
        <UrgencyAccordionGroup
          games={[tooFarGame]}
          teamsMap={mockTeamsMap}
          gameGuesses={{}}
          tournamentId="tournament1"
          isPlayoffs={false}
        />
      );

      expect(screen.queryByTestId('accordion-urgent')).not.toBeInTheDocument();
      expect(screen.queryByTestId('accordion-warning')).not.toBeInTheDocument();
      expect(screen.queryByTestId('accordion-notice')).not.toBeInTheDocument();
    });

    it('excludes closed games (past deadline)', () => {
      renderWithTheme(
        <UrgencyAccordionGroup
          games={[closedGame]}
          teamsMap={mockTeamsMap}
          gameGuesses={{}}
          tournamentId="tournament1"
          isPlayoffs={false}
        />
      );

      expect(screen.queryByTestId('accordion-urgent')).not.toBeInTheDocument();
      expect(screen.queryByTestId('accordion-warning')).not.toBeInTheDocument();
      expect(screen.queryByTestId('accordion-notice')).not.toBeInTheDocument();
    });

    it('hides tier accordion when no games in that tier', () => {
      renderWithTheme(
        <UrgencyAccordionGroup
          games={[warningGame]} // Only warning tier
          teamsMap={mockTeamsMap}
          gameGuesses={{}}
          tournamentId="tournament1"
          isPlayoffs={false}
        />
      );

      expect(screen.queryByTestId('accordion-urgent')).not.toBeInTheDocument();
      expect(screen.getByTestId('accordion-warning')).toBeInTheDocument();
      expect(screen.queryByTestId('accordion-notice')).not.toBeInTheDocument();
    });
  });

  describe('accordion titles', () => {
    it('builds title with game count and unpredicted count', () => {
      renderWithTheme(
        <UrgencyAccordionGroup
          games={[urgentGame, warningGame]}
          teamsMap={mockTeamsMap}
          gameGuesses={{}} // No predictions
          tournamentId="tournament1"
          isPlayoffs={false}
        />
      );

      // Urgent: 1 game, 1 unpredicted
      expect(screen.getByTestId('accordion-title-urgent')).toHaveTextContent('1 partido cierra en 2 horas, 1 sin predecir');

      // Warning: 1 game, 1 unpredicted
      expect(screen.getByTestId('accordion-title-warning')).toHaveTextContent('1 partido cierra en 24 horas, 1 sin predecir');
    });

    it('uses plural form for multiple games', () => {
      const urgentGame2 = { ...urgentGame, id: 'urgent-game-2' };

      renderWithTheme(
        <UrgencyAccordionGroup
          games={[urgentGame, urgentGame2]}
          teamsMap={mockTeamsMap}
          gameGuesses={{}}
          tournamentId="tournament1"
          isPlayoffs={false}
        />
      );

      expect(screen.getByTestId('accordion-title-urgent')).toHaveTextContent('2 partidos cierran en 2 horas, 2 sin predecir');
    });

    it('omits unpredicted count when all games are predicted', () => {
      const allPredicted = {
        'urgent-game': {
          game_id: 'urgent-game',
          game_number: 1,
          user_id: 'user1',
          home_score: 1,
          away_score: 0,
          home_penalty_winner: false,
          away_penalty_winner: false,
          boost_type: null,
          home_team: 'team1',
          away_team: 'team2'
        }
      };

      renderWithTheme(
        <UrgencyAccordionGroup
          games={[urgentGame]}
          teamsMap={mockTeamsMap}
          gameGuesses={allPredicted}
          tournamentId="tournament1"
          isPlayoffs={false}
        />
      );

      expect(screen.getByTestId('accordion-title-urgent')).toHaveTextContent('1 partido cierra en 2 horas');
      expect(screen.getByTestId('accordion-title-urgent')).not.toHaveTextContent('sin predecir');
    });

    it('shows partial unpredicted count', () => {
      const urgentGame2 = { ...urgentGame, id: 'urgent-game-2' };
      const partialPredicted = {
        'urgent-game': {
          game_id: 'urgent-game',
          game_number: 1,
          user_id: 'user1',
          home_score: 1,
          away_score: 0,
          home_penalty_winner: false,
          away_penalty_winner: false,
          boost_type: null,
          home_team: 'team1',
          away_team: 'team2'
        }
      };

      renderWithTheme(
        <UrgencyAccordionGroup
          games={[urgentGame, urgentGame2]}
          teamsMap={mockTeamsMap}
          gameGuesses={partialPredicted}
          tournamentId="tournament1"
          isPlayoffs={false}
        />
      );

      // 2 games total, 1 unpredicted
      expect(screen.getByTestId('accordion-title-urgent')).toHaveTextContent('2 partidos cierran en 2 horas, 1 sin predecir');
    });
  });

  describe('accordion expansion', () => {
    it('auto-expands urgent tier on mount when it has unpredicted games', () => {
      renderWithTheme(
        <UrgencyAccordionGroup
          games={[urgentGame]}
          teamsMap={mockTeamsMap}
          gameGuesses={{}} // Unpredicted
          tournamentId="tournament1"
          isPlayoffs={false}
        />
      );

      // Should be expanded initially
      expect(screen.getByTestId('accordion-expanded-urgent')).toHaveTextContent('true');
    });

    it('does not auto-expand urgent tier when all games are predicted', () => {
      const allPredicted = {
        'urgent-game': {
          game_id: 'urgent-game',
          game_number: 1,
          user_id: 'user1',
          home_score: 1,
          away_score: 0,
          home_penalty_winner: false,
          away_penalty_winner: false,
          boost_type: null,
          home_team: 'team1',
          away_team: 'team2'
        }
      };

      renderWithTheme(
        <UrgencyAccordionGroup
          games={[urgentGame]}
          teamsMap={mockTeamsMap}
          gameGuesses={allPredicted}
          tournamentId="tournament1"
          isPlayoffs={false}
        />
      );

      // Should not be expanded
      expect(screen.getByTestId('accordion-expanded-urgent')).toHaveTextContent('false');
    });

    it('does not auto-expand when no urgent games', () => {
      renderWithTheme(
        <UrgencyAccordionGroup
          games={[warningGame, noticeGame]}
          teamsMap={mockTeamsMap}
          gameGuesses={{}}
          tournamentId="tournament1"
          isPlayoffs={false}
        />
      );

      expect(screen.getByTestId('accordion-expanded-warning')).toHaveTextContent('false');
      expect(screen.getByTestId('accordion-expanded-notice')).toHaveTextContent('false');
    });
  });

  describe('severity colors', () => {
    it('assigns error severity to urgent tier', () => {
      renderWithTheme(
        <UrgencyAccordionGroup
          games={[urgentGame]}
          teamsMap={mockTeamsMap}
          gameGuesses={{}}
          tournamentId="tournament1"
          isPlayoffs={false}
        />
      );

      expect(screen.getByTestId('accordion-severity-urgent')).toHaveTextContent('error');
    });

    it('assigns warning severity to warning tier', () => {
      renderWithTheme(
        <UrgencyAccordionGroup
          games={[warningGame]}
          teamsMap={mockTeamsMap}
          gameGuesses={{}}
          tournamentId="tournament1"
          isPlayoffs={false}
        />
      );

      expect(screen.getByTestId('accordion-severity-warning')).toHaveTextContent('warning');
    });

    it('assigns info severity to notice tier', () => {
      renderWithTheme(
        <UrgencyAccordionGroup
          games={[noticeGame]}
          teamsMap={mockTeamsMap}
          gameGuesses={{}}
          tournamentId="tournament1"
          isPlayoffs={false}
        />
      );

      expect(screen.getByTestId('accordion-severity-notice')).toHaveTextContent('info');
    });
  });

  describe('edge cases', () => {
    it('handles empty games array', () => {
      renderWithTheme(
        <UrgencyAccordionGroup
          games={[]}
          teamsMap={mockTeamsMap}
          gameGuesses={{}}
          tournamentId="tournament1"
          isPlayoffs={false}
        />
      );

      expect(screen.queryByTestId('accordion-urgent')).not.toBeInTheDocument();
      expect(screen.queryByTestId('accordion-warning')).not.toBeInTheDocument();
      expect(screen.queryByTestId('accordion-notice')).not.toBeInTheDocument();
    });

    it('sorts games by deadline within each tier', () => {
      // Create multiple urgent games with different times
      const urgentGame1 = {
        ...urgentGame,
        id: 'urgent-1',
        game_date: new Date(mockCurrentTime + ONE_HOUR + 90 * 60 * 1000) // 2.5h from now
      };
      const urgentGame2 = {
        ...urgentGame,
        id: 'urgent-2',
        game_date: new Date(mockCurrentTime + ONE_HOUR + 30 * 60 * 1000) // 1.5h from now (earlier)
      };

      renderWithTheme(
        <UrgencyAccordionGroup
          games={[urgentGame1, urgentGame2]}
          teamsMap={mockTeamsMap}
          gameGuesses={{}}
          tournamentId="tournament1"
          isPlayoffs={false}
        />
      );

      // Both should be in urgent tier
      expect(screen.getByTestId('accordion-games-urgent')).toHaveTextContent('2');
    });

    it('handles games right at tier boundaries', () => {
      // Game at exactly 2 hours
      const borderGame1 = {
        ...urgentGame,
        id: 'border-1',
        game_date: new Date(mockCurrentTime + ONE_HOUR + 2 * ONE_HOUR) // Exactly 3h from now (2h + 1h deadline offset)
      };

      renderWithTheme(
        <UrgencyAccordionGroup
          games={[borderGame1]}
          teamsMap={mockTeamsMap}
          gameGuesses={{}}
          tournamentId="tournament1"
          isPlayoffs={false}
        />
      );

      // Should be in warning tier (>= 2h)
      expect(screen.queryByTestId('accordion-warning')).toBeInTheDocument();
    });
  });

  describe('optional props', () => {
    it('accepts silverMax and goldenMax props', () => {
      renderWithTheme(
        <UrgencyAccordionGroup
          games={[urgentGame]}
          teamsMap={mockTeamsMap}
          gameGuesses={{}}
          tournamentId="tournament1"
          isPlayoffs={false}
          silverMax={3}
          goldenMax={1}
        />
      );

      expect(screen.getByTestId('accordion-urgent')).toBeInTheDocument();
    });

    it('handles isPlayoffs flag', () => {
      const playoffGame = {
        ...urgentGame,
        game_type: 'playoff' as const,
        playoffStage: {
          id: 'stage1',
          tournament_id: 'tournament1',
          round_name: 'Final',
          round_order: 1,
          is_final: true,
          is_third_place: false
        }
      };

      renderWithTheme(
        <UrgencyAccordionGroup
          games={[playoffGame]}
          teamsMap={mockTeamsMap}
          gameGuesses={{}}
          tournamentId="tournament1"
          isPlayoffs={true}
        />
      );

      expect(screen.getByTestId('accordion-urgent')).toBeInTheDocument();
    });
  });
});
