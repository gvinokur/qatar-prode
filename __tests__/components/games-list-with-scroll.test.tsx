import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GamesListWithScroll } from '../../app/components/games-list-with-scroll';
import { renderWithProviders, createMockGuessesContext } from '../utils/test-utils';
import { testFactories } from '../db/test-factories';
import { ExtendedGameData } from '../../app/definitions';
import { Team, GameGuessNew } from '../../app/db/tables-definition';
import { createAuthenticatedSessionValue } from '../mocks/next-auth.mocks';
import * as autoScrollUtils from '../../app/utils/auto-scroll';
import * as playoffUtils from '../../app/utils/playoff-utils';

// Mock next-auth
vi.mock('next-auth/react', () => ({
  useSession: vi.fn()
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useReducedMotion: () => false,
}));

// Mock FlippableGameCard
vi.mock('../../app/components/flippable-game-card', () => ({
  default: ({ game, isEditing, onEditStart, onEditEnd, onAutoAdvanceNext, onAutoGoPrevious }: any) => (
    <div data-testid={`game-card-${game.id}`}>
      <div>Game: {game.game_number}</div>
      <button onClick={onEditStart}>Edit</button>
      <button onClick={onEditEnd}>End Edit</button>
      <button onClick={onAutoAdvanceNext}>Next</button>
      <button onClick={onAutoGoPrevious}>Previous</button>
      {isEditing && <div>Editing</div>}
    </div>
  ),
}));

// Mock EmptyGamesState
vi.mock('../../app/components/empty-games-state', () => ({
  EmptyGamesState: ({ filterType }: any) => (
    <div data-testid="empty-games-state">No games - Filter: {filterType}</div>
  ),
}));

// Mock EditModeProvider
vi.mock('../../app/components/context-providers/edit-mode-context-provider', () => ({
  useEditMode: vi.fn(),
}));

// Mock MUI useMediaQuery
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    useMediaQuery: () => false, // Not mobile
  };
});

// Import after mocks
import { useSession } from 'next-auth/react';
import { useEditMode } from '../../app/components/context-providers/edit-mode-context-provider';

describe('GamesListWithScroll', () => {
  const mockTeamsMap: Record<string, Team> = {
    'team1': testFactories.team({
      id: 'team1',
      name: 'Mexico',
      short_name: 'MEX',
      flag_url: 'mexico.png',
      fifa_code: 'MEX'
    }),
    'team2': testFactories.team({
      id: 'team2',
      name: 'Qatar',
      short_name: 'QAT',
      flag_url: 'qatar.png',
      fifa_code: 'QAT'
    }),
    'team3': testFactories.team({
      id: 'team3',
      name: 'Brazil',
      short_name: 'BRA',
      flag_url: 'brazil.png',
      fifa_code: 'BRA'
    }),
  };

  const mockTournament = testFactories.tournament({
    id: 'tournament-1',
    max_silver_games: 5,
    max_golden_games: 3,
  });

  const createMockGame = (overrides?: Partial<ExtendedGameData>): ExtendedGameData => ({
    id: 'game1',
    tournament_id: 'tournament-1',
    game_number: 1,
    home_team: 'team1',
    away_team: 'team2',
    game_date: new Date(Date.now() + 48 * 60 * 60 * 1000), // 2 days from now
    location: 'Stadium 1',
    home_team_rule: undefined,
    away_team_rule: undefined,
    game_type: 'group',
    game_local_timezone: undefined,
    group: undefined,
    playoffStage: undefined,
    gameResult: undefined,
    ...overrides,
  });

  const defaultProps = {
    games: [createMockGame()],
    teamsMap: mockTeamsMap,
    tournamentId: 'tournament-1',
    activeFilter: 'all' as const,
    dashboardStats: {
      silverUsed: 0,
      goldenUsed: 0,
    },
    tournament: mockTournament,
  };

  let mockEditMode: any;
  let mockUpdateGameGuess: any;

  beforeEach(() => {
    // Setup session mock
    vi.mocked(useSession).mockReturnValue(
      createAuthenticatedSessionValue({ id: 'user-1' })
    );

    // Setup edit mode mock
    mockEditMode = {
      editingGameId: null,
      editMode: null,
      startEdit: vi.fn().mockResolvedValue(undefined),
      endEdit: vi.fn(),
    };
    vi.mocked(useEditMode).mockReturnValue(mockEditMode);

    // Setup update game guess mock
    mockUpdateGameGuess = vi.fn().mockResolvedValue(undefined);

    // Mock sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });

    // Mock scrollIntoView
    Element.prototype.scrollIntoView = vi.fn();

    // Spy on auto-scroll utilities
    vi.spyOn(autoScrollUtils, 'findScrollTarget');
    vi.spyOn(autoScrollUtils, 'scrollToGame');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders empty state when no games', () => {
      renderWithProviders(
        <GamesListWithScroll
          {...defaultProps}
          games={[]}
        />,
        { guessesContext: true }
      );

      expect(screen.getByTestId('empty-games-state')).toBeInTheDocument();
      expect(screen.getByText('No games - Filter: all')).toBeInTheDocument();
    });

    it('renders single game without navigation buttons', () => {
      renderWithProviders(
        <GamesListWithScroll {...defaultProps} />,
        { guessesContext: true }
      );

      expect(screen.getByTestId('game-card-game1')).toBeInTheDocument();
      expect(screen.queryByText('Ir al Proximo Partido')).not.toBeInTheDocument();
      expect(screen.queryByText('Volver al Principio')).not.toBeInTheDocument();
    });

    it('renders multiple games with navigation buttons', () => {
      const games = [
        createMockGame({ id: 'game1', game_number: 1 }),
        createMockGame({ id: 'game2', game_number: 2 }),
      ];

      renderWithProviders(
        <GamesListWithScroll
          {...defaultProps}
          games={games}
        />,
        { guessesContext: true }
      );

      expect(screen.getByTestId('game-card-game1')).toBeInTheDocument();
      expect(screen.getByTestId('game-card-game2')).toBeInTheDocument();
      expect(screen.getByText('Ir al Proximo Partido')).toBeInTheDocument();
      expect(screen.getByText('Volver al Principio')).toBeInTheDocument();
    });

    it('renders game cards with correct props', () => {
      const gameGuess: GameGuessNew = {
        game_id: 'game1',
        game_number: 1,
        user_id: 'user-1',
        home_score: 2,
        away_score: 1,
        home_penalty_winner: false,
        away_penalty_winner: false,
        home_team: 'team1',
        away_team: 'team2',
        boost_type: 'silver',
        score: undefined,
      };

      renderWithProviders(
        <GamesListWithScroll {...defaultProps} />,
        {
          guessesContext: createMockGuessesContext({
            gameGuesses: { 'game1': gameGuess },
          }),
        }
      );

      const gameCard = screen.getByTestId('game-card-game1');
      expect(gameCard).toBeInTheDocument();
    });

    it('applies correct box id for scrolling', () => {
      const games = [
        createMockGame({ id: 'game1', game_number: 1 }),
        createMockGame({ id: 'game2', game_number: 2 }),
      ];

      const { container } = renderWithProviders(
        <GamesListWithScroll
          {...defaultProps}
          games={games}
        />,
        { guessesContext: true }
      );

      const box1 = container.querySelector('#game-game1');
      const box2 = container.querySelector('#game-game2');

      expect(box1).toBeInTheDocument();
      expect(box2).toBeInTheDocument();
      expect(box1).toHaveAttribute('data-game-id', 'game1');
      expect(box2).toHaveAttribute('data-game-id', 'game2');
    });
  });

  describe('Auto-scroll on mount', () => {
    it('auto-scrolls to target game on first mount', async () => {
      const games = [
        createMockGame({ id: 'game1', game_number: 1, game_date: new Date(Date.now() - 24 * 60 * 60 * 1000) }), // Past
        createMockGame({ id: 'game2', game_number: 2, game_date: new Date(Date.now() + 24 * 60 * 60 * 1000) }), // Future
      ];

      vi.mocked(window.sessionStorage.getItem).mockReturnValue(null);
      vi.spyOn(autoScrollUtils, 'findScrollTarget').mockReturnValue('game-game2');

      renderWithProviders(
        <GamesListWithScroll
          {...defaultProps}
          games={games}
        />,
        { guessesContext: true }
      );

      await waitFor(() => {
        expect(autoScrollUtils.findScrollTarget).toHaveBeenCalledWith(games);
      }, { timeout: 500 });

      await waitFor(() => {
        expect(autoScrollUtils.scrollToGame).toHaveBeenCalledWith('game-game2', 'smooth');
      }, { timeout: 500 });

      expect(window.sessionStorage.setItem).toHaveBeenCalledWith('autoScrolled-tournament-1', 'true');
    });

    it('does not auto-scroll if already scrolled in session', () => {
      const games = [createMockGame({ id: 'game1', game_number: 1 })];

      vi.mocked(window.sessionStorage.getItem).mockReturnValue('true');

      renderWithProviders(
        <GamesListWithScroll
          {...defaultProps}
          games={games}
        />,
        { guessesContext: true }
      );

      expect(autoScrollUtils.scrollToGame).not.toHaveBeenCalled();
    });

    it('does not auto-scroll when no games', () => {
      renderWithProviders(
        <GamesListWithScroll
          {...defaultProps}
          games={[]}
        />,
        { guessesContext: true }
      );

      expect(autoScrollUtils.scrollToGame).not.toHaveBeenCalled();
    });

    it('does not auto-scroll when findScrollTarget returns null', async () => {
      const games = [createMockGame({ id: 'game1', game_number: 1 })];

      vi.mocked(window.sessionStorage.getItem).mockReturnValue(null);
      vi.spyOn(autoScrollUtils, 'findScrollTarget').mockReturnValue(null);

      renderWithProviders(
        <GamesListWithScroll
          {...defaultProps}
          games={games}
        />,
        { guessesContext: true }
      );

      await waitFor(() => {
        expect(autoScrollUtils.findScrollTarget).toHaveBeenCalled();
      });

      expect(autoScrollUtils.scrollToGame).not.toHaveBeenCalled();
    });
  });

  describe('Scroll navigation buttons', () => {
    it('scrolls to top when "Volver al Principio" clicked', async () => {
      const games = [
        createMockGame({ id: 'game1', game_number: 1 }),
        createMockGame({ id: 'game2', game_number: 2 }),
      ];

      const user = userEvent.setup();
      renderWithProviders(
        <GamesListWithScroll
          {...defaultProps}
          games={games}
        />,
        { guessesContext: true }
      );

      const backButton = screen.getByText('Volver al Principio');
      await user.click(backButton);

      expect(autoScrollUtils.scrollToGame).toHaveBeenCalledWith('game-game1', 'smooth');
    });

    it('scrolls to next target game when "Ir al Proximo Partido" clicked', async () => {
      const games = [
        createMockGame({ id: 'game1', game_number: 1 }),
        createMockGame({ id: 'game2', game_number: 2 }),
      ];

      vi.spyOn(autoScrollUtils, 'findScrollTarget').mockReturnValue('game-game2');

      const user = userEvent.setup();
      renderWithProviders(
        <GamesListWithScroll
          {...defaultProps}
          games={games}
        />,
        { guessesContext: true }
      );

      const nextButton = screen.getByText('Ir al Proximo Partido');
      await user.click(nextButton);

      expect(autoScrollUtils.findScrollTarget).toHaveBeenCalledWith(games);
      expect(autoScrollUtils.scrollToGame).toHaveBeenCalledWith('game-game2', 'smooth');
    });

    it('scrolls to last game when no target found', async () => {
      const games = [
        createMockGame({ id: 'game1', game_number: 1 }),
        createMockGame({ id: 'game2', game_number: 2 }),
      ];

      vi.spyOn(autoScrollUtils, 'findScrollTarget').mockReturnValue(null);

      const user = userEvent.setup();
      renderWithProviders(
        <GamesListWithScroll
          {...defaultProps}
          games={games}
        />,
        { guessesContext: true }
      );

      const nextButton = screen.getByText('Ir al Proximo Partido');
      await user.click(nextButton);

      expect(autoScrollUtils.scrollToGame).toHaveBeenCalledWith('game-game2', 'smooth');
    });

    it('does nothing when "Ir al Proximo Partido" clicked with no games', async () => {
      const games = [
        createMockGame({ id: 'game1', game_number: 1 }),
        createMockGame({ id: 'game2', game_number: 2 }),
      ];

      vi.spyOn(autoScrollUtils, 'findScrollTarget').mockReturnValue(null);

      const user = userEvent.setup();
      const { rerender } = renderWithProviders(
        <GamesListWithScroll
          {...defaultProps}
          games={games}
        />,
        { guessesContext: true }
      );

      // Clear the initial auto-scroll calls
      vi.clearAllMocks();

      // Update to empty games
      rerender(
        <GamesListWithScroll
          {...defaultProps}
          games={[]}
        />
      );

      // Verify empty state is shown
      expect(screen.getByTestId('empty-games-state')).toBeInTheDocument();
    });
  });

  describe('Edit mode interactions', () => {
    it('calls startEdit when game card edit button clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <GamesListWithScroll {...defaultProps} />,
        { guessesContext: true }
      );

      const editButton = screen.getByText('Edit');
      await user.click(editButton);

      expect(mockEditMode.startEdit).toHaveBeenCalledWith('game1', 'inline');
    });

    it('marks game as editing when editingGameId matches', () => {
      renderWithProviders(
        <GamesListWithScroll {...defaultProps} />,
        { guessesContext: true }
      );

      const gameCard = screen.getByTestId('game-card-game1');
      expect(within(gameCard).queryByText('Editing')).not.toBeInTheDocument();
    });

    it('calls endEdit when game card end edit button clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <GamesListWithScroll {...defaultProps} />,
        { guessesContext: true }
      );

      const endEditButton = screen.getByText('End Edit');
      await user.click(endEditButton);

      expect(mockEditMode.endEdit).toHaveBeenCalled();
    });

    it('does not crash when editMode is null', async () => {
      vi.mocked(useEditMode).mockReturnValue(null as any);

      const user = userEvent.setup();
      renderWithProviders(
        <GamesListWithScroll {...defaultProps} />,
        { guessesContext: true }
      );

      const editButton = screen.getByText('Edit');
      await user.click(editButton);

      // Should not throw error
      expect(screen.getByTestId('game-card-game1')).toBeInTheDocument();
    });
  });

  describe('Auto-advance next game', () => {
    it('advances to next enabled game', async () => {
      const games = [
        createMockGame({
          id: 'game1',
          game_number: 1,
          game_date: new Date(Date.now() + 48 * 60 * 60 * 1000),
        }),
        createMockGame({
          id: 'game2',
          game_number: 2,
          game_date: new Date(Date.now() + 72 * 60 * 60 * 1000),
        }),
      ];

      const user = userEvent.setup();
      renderWithProviders(
        <GamesListWithScroll
          {...defaultProps}
          games={games}
        />,
        { guessesContext: true }
      );

      const game1Card = screen.getByTestId('game-card-game1');
      const nextButton = within(game1Card).getByText('Next');

      await user.click(nextButton);

      expect(mockEditMode.startEdit).toHaveBeenCalledWith('game2', 'inline');
    });

    it('skips disabled games when advancing', async () => {
      const now = Date.now();
      const games = [
        createMockGame({
          id: 'game1',
          game_number: 1,
          game_date: new Date(now + 48 * 60 * 60 * 1000), // 2 days from now - enabled
        }),
        createMockGame({
          id: 'game2',
          game_number: 2,
          game_date: new Date(now + 30 * 60 * 1000), // 30 minutes from now - disabled (< 1 hour)
        }),
        createMockGame({
          id: 'game3',
          game_number: 3,
          game_date: new Date(now + 72 * 60 * 60 * 1000), // 3 days from now - enabled
        }),
      ];

      const user = userEvent.setup();
      renderWithProviders(
        <GamesListWithScroll
          {...defaultProps}
          games={games}
        />,
        { guessesContext: true }
      );

      const game1Card = screen.getByTestId('game-card-game1');
      const nextButton = within(game1Card).getByText('Next');

      await user.click(nextButton);

      // Should skip game2 and go to game3
      expect(mockEditMode.startEdit).toHaveBeenCalledWith('game3', 'inline');
    });

    it('does nothing when at last enabled game', async () => {
      const games = [
        createMockGame({
          id: 'game1',
          game_number: 1,
          game_date: new Date(Date.now() + 48 * 60 * 60 * 1000),
        }),
      ];

      const user = userEvent.setup();
      renderWithProviders(
        <GamesListWithScroll
          {...defaultProps}
          games={games}
        />,
        { guessesContext: true }
      );

      const game1Card = screen.getByTestId('game-card-game1');
      const nextButton = within(game1Card).getByText('Next');

      mockEditMode.startEdit.mockClear();
      await user.click(nextButton);

      // Should not call startEdit since there's no next game
      expect(mockEditMode.startEdit).not.toHaveBeenCalled();
    });

    it('scrolls to next game card after advancing', async () => {
      const games = [
        createMockGame({
          id: 'game1',
          game_number: 1,
          game_date: new Date(Date.now() + 48 * 60 * 60 * 1000),
        }),
        createMockGame({
          id: 'game2',
          game_number: 2,
          game_date: new Date(Date.now() + 72 * 60 * 60 * 1000),
        }),
      ];

      // Mock getElementById
      const mockElement = document.createElement('div');
      mockElement.id = 'game-game2';
      vi.spyOn(document, 'getElementById').mockReturnValue(mockElement);

      const user = userEvent.setup();
      renderWithProviders(
        <GamesListWithScroll
          {...defaultProps}
          games={games}
        />,
        { guessesContext: true }
      );

      const game1Card = screen.getByTestId('game-card-game1');
      const nextButton = within(game1Card).getByText('Next');

      await user.click(nextButton);

      await waitFor(() => {
        expect(mockElement.scrollIntoView).toHaveBeenCalledWith({
          behavior: 'smooth',
          block: 'center',
        });
      }, { timeout: 200 });
    });
  });

  describe('Auto-go previous game', () => {
    it('goes to previous enabled game', async () => {
      const games = [
        createMockGame({
          id: 'game1',
          game_number: 1,
          game_date: new Date(Date.now() + 48 * 60 * 60 * 1000),
        }),
        createMockGame({
          id: 'game2',
          game_number: 2,
          game_date: new Date(Date.now() + 72 * 60 * 60 * 1000),
        }),
      ];

      const user = userEvent.setup();
      renderWithProviders(
        <GamesListWithScroll
          {...defaultProps}
          games={games}
        />,
        { guessesContext: true }
      );

      const game2Card = screen.getByTestId('game-card-game2');
      const prevButton = within(game2Card).getByText('Previous');

      await user.click(prevButton);

      expect(mockEditMode.startEdit).toHaveBeenCalledWith('game1', 'inline');
    });

    it('skips disabled games when going previous', async () => {
      const now = Date.now();
      const games = [
        createMockGame({
          id: 'game1',
          game_number: 1,
          game_date: new Date(now + 48 * 60 * 60 * 1000), // enabled
        }),
        createMockGame({
          id: 'game2',
          game_number: 2,
          game_date: new Date(now + 30 * 60 * 1000), // disabled
        }),
        createMockGame({
          id: 'game3',
          game_number: 3,
          game_date: new Date(now + 72 * 60 * 60 * 1000), // enabled
        }),
      ];

      const user = userEvent.setup();
      renderWithProviders(
        <GamesListWithScroll
          {...defaultProps}
          games={games}
        />,
        { guessesContext: true }
      );

      const game3Card = screen.getByTestId('game-card-game3');
      const prevButton = within(game3Card).getByText('Previous');

      await user.click(prevButton);

      // Should skip game2 and go to game1
      expect(mockEditMode.startEdit).toHaveBeenCalledWith('game1', 'inline');
    });

    it('does nothing when at first enabled game', async () => {
      const games = [
        createMockGame({
          id: 'game1',
          game_number: 1,
          game_date: new Date(Date.now() + 48 * 60 * 60 * 1000),
        }),
      ];

      const user = userEvent.setup();
      renderWithProviders(
        <GamesListWithScroll
          {...defaultProps}
          games={games}
        />,
        { guessesContext: true }
      );

      const game1Card = screen.getByTestId('game-card-game1');
      const prevButton = within(game1Card).getByText('Previous');

      mockEditMode.startEdit.mockClear();
      await user.click(prevButton);

      // Should not call startEdit since there's no previous game
      expect(mockEditMode.startEdit).not.toHaveBeenCalled();
    });

    it('scrolls to previous game card after going back', async () => {
      const games = [
        createMockGame({
          id: 'game1',
          game_number: 1,
          game_date: new Date(Date.now() + 48 * 60 * 60 * 1000),
        }),
        createMockGame({
          id: 'game2',
          game_number: 2,
          game_date: new Date(Date.now() + 72 * 60 * 60 * 1000),
        }),
      ];

      // Mock getElementById
      const mockElement = document.createElement('div');
      mockElement.id = 'game-game1';
      vi.spyOn(document, 'getElementById').mockReturnValue(mockElement);

      const user = userEvent.setup();
      renderWithProviders(
        <GamesListWithScroll
          {...defaultProps}
          games={games}
        />,
        { guessesContext: true }
      );

      const game2Card = screen.getByTestId('game-card-game2');
      const prevButton = within(game2Card).getByText('Previous');

      await user.click(prevButton);

      await waitFor(() => {
        expect(mockElement.scrollIntoView).toHaveBeenCalledWith({
          behavior: 'smooth',
          block: 'center',
        });
      }, { timeout: 200 });
    });
  });

  describe('Playoff game team updates', () => {
    it('updates playoff game teams when guesses change', async () => {
      const playoffGame = createMockGame({
        id: 'playoff1',
        game_number: 10,
        home_team: undefined,
        away_team: undefined,
        playoffStage: 'QUARTERFINALS',
        home_team_rule: {
          game: 5,
          winner: true,
        },
        away_team_rule: {
          game: 6,
          winner: true,
        },
      });

      const groupGame1 = createMockGame({
        id: 'game5',
        game_number: 5,
        home_team: 'team1',
        away_team: 'team2',
      });

      const groupGame2 = createMockGame({
        id: 'game6',
        game_number: 6,
        home_team: 'team2',
        away_team: 'team3',
      });

      const gameGuess1: GameGuessNew = {
        game_id: 'game5',
        game_number: 5,
        user_id: 'user-1',
        home_score: 2,
        away_score: 1,
        home_penalty_winner: false,
        away_penalty_winner: false,
        home_team: 'team1',
        away_team: 'team2',
        score: undefined,
      };

      const gameGuess2: GameGuessNew = {
        game_id: 'game6',
        game_number: 6,
        user_id: 'user-1',
        home_score: 1,
        away_score: 2,
        home_penalty_winner: false,
        away_penalty_winner: false,
        home_team: 'team2',
        away_team: 'team3',
        score: undefined,
      };

      vi.spyOn(playoffUtils, 'calculateTeamNamesForPlayoffGame').mockReturnValue({
        homeTeam: 'team1',
        awayTeam: 'team3',
      });

      const mockContext = createMockGuessesContext({
        gameGuesses: {
          'game5': gameGuess1,
          'game6': gameGuess2,
        },
        updateGameGuess: mockUpdateGameGuess,
      });

      renderWithProviders(
        <GamesListWithScroll
          {...defaultProps}
          games={[playoffGame, groupGame1, groupGame2]}
        />,
        { guessesContext: mockContext }
      );

      await waitFor(() => {
        expect(playoffUtils.calculateTeamNamesForPlayoffGame).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(mockUpdateGameGuess).toHaveBeenCalled();
      });
    });

    it('does not update playoff games when no session data', () => {
      vi.mocked(useSession).mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: vi.fn(),
      });

      const playoffGame = createMockGame({
        id: 'playoff1',
        game_number: 10,
        home_team: undefined,
        away_team: undefined,
        playoffStage: 'QUARTERFINALS',
        home_team_rule: {
          game: 5,
          winner: true,
        },
        away_team_rule: {
          game: 6,
          winner: true,
        },
      });

      const mockContext = createMockGuessesContext({
        updateGameGuess: mockUpdateGameGuess,
      });

      renderWithProviders(
        <GamesListWithScroll
          {...defaultProps}
          games={[playoffGame]}
        />,
        { guessesContext: mockContext }
      );

      expect(mockUpdateGameGuess).not.toHaveBeenCalled();
    });

    it('does not update non-playoff games', () => {
      const groupGame = createMockGame({
        id: 'game1',
        game_number: 1,
        home_team: 'team1',
        away_team: 'team2',
        playoffStage: undefined,
      });

      const mockContext = createMockGuessesContext({
        updateGameGuess: mockUpdateGameGuess,
      });

      renderWithProviders(
        <GamesListWithScroll
          {...defaultProps}
          games={[groupGame]}
        />,
        { guessesContext: mockContext }
      );

      expect(playoffUtils.calculateTeamNamesForPlayoffGame).not.toHaveBeenCalled();
    });

    it('does not update when teams are already set correctly', async () => {
      const playoffGame = createMockGame({
        id: 'playoff1',
        game_number: 10,
        home_team: undefined,
        away_team: undefined,
        playoffStage: 'QUARTERFINALS',
        home_team_rule: {
          game: 5,
          winner: true,
        },
        away_team_rule: {
          game: 6,
          winner: true,
        },
      });

      const playoffGuess: GameGuessNew = {
        game_id: 'playoff1',
        game_number: 10,
        user_id: 'user-1',
        home_score: undefined,
        away_score: undefined,
        home_penalty_winner: false,
        away_penalty_winner: false,
        home_team: 'team1',
        away_team: 'team3',
        score: undefined,
      };

      vi.spyOn(playoffUtils, 'calculateTeamNamesForPlayoffGame').mockReturnValue({
        homeTeam: 'team1',
        awayTeam: 'team3',
      });

      const mockContext = createMockGuessesContext({
        gameGuesses: {
          'playoff1': playoffGuess,
        },
        updateGameGuess: mockUpdateGameGuess,
      });

      renderWithProviders(
        <GamesListWithScroll
          {...defaultProps}
          games={[playoffGame]}
        />,
        { guessesContext: mockContext }
      );

      await waitFor(() => {
        expect(playoffUtils.calculateTeamNamesForPlayoffGame).toHaveBeenCalled();
      });

      // Should not update since teams are already correct
      expect(mockUpdateGameGuess).not.toHaveBeenCalled();
    });
  });

  describe('Dashboard stats and boost limits', () => {
    it('passes dashboard stats to game cards', () => {
      const dashboardStats = {
        silverUsed: 3,
        goldenUsed: 2,
      };

      renderWithProviders(
        <GamesListWithScroll
          {...defaultProps}
          dashboardStats={dashboardStats}
        />,
        { guessesContext: true }
      );

      expect(screen.getByTestId('game-card-game1')).toBeInTheDocument();
    });

    it('handles null dashboard stats', () => {
      renderWithProviders(
        <GamesListWithScroll
          {...defaultProps}
          dashboardStats={null}
        />,
        { guessesContext: true }
      );

      expect(screen.getByTestId('game-card-game1')).toBeInTheDocument();
    });

    it('passes tournament boost limits to game cards', () => {
      const tournament = testFactories.tournament({
        id: 'tournament-1',
        max_silver_games: 10,
        max_golden_games: 5,
      });

      renderWithProviders(
        <GamesListWithScroll
          {...defaultProps}
          tournament={tournament}
        />,
        { guessesContext: true }
      );

      expect(screen.getByTestId('game-card-game1')).toBeInTheDocument();
    });
  });

  describe('Filter types', () => {
    it('passes correct filter type to empty state', () => {
      renderWithProviders(
        <GamesListWithScroll
          {...defaultProps}
          games={[]}
          activeFilter="unpredicted"
        />,
        { guessesContext: true }
      );

      expect(screen.getByText('No games - Filter: unpredicted')).toBeInTheDocument();
    });

    it('passes groups filter type to empty state', () => {
      renderWithProviders(
        <GamesListWithScroll
          {...defaultProps}
          games={[]}
          activeFilter="groups"
        />,
        { guessesContext: true }
      );

      expect(screen.getByText('No games - Filter: groups')).toBeInTheDocument();
    });

    it('passes playoffs filter type to empty state', () => {
      renderWithProviders(
        <GamesListWithScroll
          {...defaultProps}
          games={[]}
          activeFilter="playoffs"
        />,
        { guessesContext: true }
      );

      expect(screen.getByText('No games - Filter: playoffs')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('handles game with no guess data', () => {
      renderWithProviders(
        <GamesListWithScroll {...defaultProps} />,
        {
          guessesContext: createMockGuessesContext({
            gameGuesses: {},
          }),
        }
      );

      expect(screen.getByTestId('game-card-game1')).toBeInTheDocument();
    });

    it('handles games with past dates', () => {
      const pastGame = createMockGame({
        id: 'game1',
        game_number: 1,
        game_date: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
      });

      renderWithProviders(
        <GamesListWithScroll
          {...defaultProps}
          games={[pastGame]}
        />,
        { guessesContext: true }
      );

      expect(screen.getByTestId('game-card-game1')).toBeInTheDocument();
    });

    it('handles multiple playoffs games', () => {
      const playoffGames = [
        createMockGame({
          id: 'playoff1',
          game_number: 10,
          playoffStage: 'QUARTERFINALS',
          home_team_rule: { game: 5, winner: true },
          away_team_rule: { game: 6, winner: true },
        }),
        createMockGame({
          id: 'playoff2',
          game_number: 11,
          playoffStage: 'QUARTERFINALS',
          home_team_rule: { game: 7, winner: true },
          away_team_rule: { game: 8, winner: true },
        }),
      ];

      renderWithProviders(
        <GamesListWithScroll
          {...defaultProps}
          games={playoffGames}
        />,
        { guessesContext: true }
      );

      expect(screen.getByTestId('game-card-playoff1')).toBeInTheDocument();
      expect(screen.getByTestId('game-card-playoff2')).toBeInTheDocument();
    });

    it('handles missing teams in teamsMap', () => {
      const gameWithMissingTeam = createMockGame({
        id: 'game1',
        game_number: 1,
        home_team: 'team-unknown',
        away_team: 'team2',
      });

      renderWithProviders(
        <GamesListWithScroll
          {...defaultProps}
          games={[gameWithMissingTeam]}
        />,
        { guessesContext: true }
      );

      expect(screen.getByTestId('game-card-game1')).toBeInTheDocument();
    });

    it('handles empty teamsMap', () => {
      renderWithProviders(
        <GamesListWithScroll
          {...defaultProps}
          teamsMap={{}}
        />,
        { guessesContext: true }
      );

      expect(screen.getByTestId('game-card-game1')).toBeInTheDocument();
    });
  });
});
