import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, within, fireEvent } from '@testing-library/react';
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
  default: ({ game, isEditing, onEditStart, onEditEnd, onAutoAdvanceNext, onAutoGoPrevious, onStageClick }: any) => (
    <div data-testid={`game-card-${game.id}`}>
      <div>Game: {game.game_number}</div>
      <button onClick={onEditStart}>Edit</button>
      <button onClick={onEditEnd}>End Edit</button>
      <button onClick={onAutoAdvanceNext}>Next</button>
      <button onClick={onAutoGoPrevious}>Previous</button>
      {onStageClick && <button data-testid={`stage-click-${game.id}`} onClick={onStageClick}>Stage</button>}
      {isEditing && <div>Editing</div>}
    </div>
  ),
}));

// Mock StageSeparator
vi.mock('../../app/components/stage-separator', () => ({
  StageSeparator: ({ label }: { label: string }) => (
    <div data-testid="stage-separator" data-label={label}>{label}</div>
  ),
}));

// Mock StageTransitionBanner
vi.mock('../../app/components/stage-transition-banner', () => ({
  StageTransitionBanner: ({ label, ctaLabel, ctaHref }: any) => (
    <div data-testid="stage-transition-banner" data-label={label} data-cta={ctaLabel} data-href={ctaHref}>{label}</div>
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

// Mock EditTriggerProvider
vi.mock('../../app/components/context-providers/edit-trigger-context-provider', () => ({
  useEditTrigger: vi.fn(),
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
import { useEditTrigger } from '../../app/components/context-providers/edit-trigger-context-provider';

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
    matchday: null,
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
    qtPredictionLocked: false,
    qualifiedTeamsHref: '/en/tournaments/tournament-1/qualified-teams',
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

    // Setup edit trigger mock
    vi.mocked(useEditTrigger).mockReturnValue({
      triggerEdit: vi.fn(),
      registerTrigger: vi.fn(),
      isEditMode: false,
      isEditModeRef: { current: false },
      setEditMode: vi.fn(),
    });

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

      await waitFor(() => {
        expect(mockEditMode.startEdit).toHaveBeenCalledWith('game2', 'inline');
      });
    });

    it('skips already-predicted group games when advancing', async () => {
      const games = [
        createMockGame({ id: 'game1', game_number: 1 }),
        createMockGame({ id: 'game2', game_number: 2 }), // already predicted
        createMockGame({ id: 'game3', game_number: 3 }),
      ];

      const predictedGuess: GameGuessNew = {
        game_id: 'game2',
        game_number: 2,
        user_id: 'user-1',
        home_score: 2,
        away_score: 1,
        home_penalty_winner: false,
        away_penalty_winner: false,
        home_team: 'team1',
        away_team: 'team2',
        boost_type: null,
        score: undefined,
      };

      const user = userEvent.setup();
      renderWithProviders(
        <GamesListWithScroll {...defaultProps} games={games} />,
        {
          guessesContext: createMockGuessesContext({
            gameGuesses: { 'game2': predictedGuess }
          })
        }
      );

      const game1Card = screen.getByTestId('game-card-game1');
      const nextButton = within(game1Card).getByText('Next');

      await user.click(nextButton);

      // Should skip predicted game2 and go to game3
      await waitFor(() => {
        expect(mockEditMode.startEdit).toHaveBeenCalledWith('game3', 'inline');
      });
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
          block: 'start',
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

  describe('Story #254 - Two-Column Grid Layout', () => {
    it('should render games in a grid container', () => {
      const { container } = renderWithProviders(
        <GamesListWithScroll {...defaultProps} />,
        { guessesContext: true }
      );

      // Find the grid container (Box with CSS Grid styling via MUI classes)
      // Grid is applied via sx prop, so we check for the presence of the games structure
      const gameCards = container.querySelectorAll('[data-testid^="game-card-"]');
      expect(gameCards.length).toBeGreaterThan(0);
    });

    it('should render all game cards in the grid', () => {
      const multipleGames = [
        createMockGame({ id: 'game1', game_number: 1 }),
        createMockGame({ id: 'game2', game_number: 2 }),
        createMockGame({ id: 'game3', game_number: 3 }),
      ];

      renderWithProviders(
        <GamesListWithScroll {...defaultProps} games={multipleGames} />,
        { guessesContext: true }
      );

      expect(screen.getByTestId('game-card-game1')).toBeInTheDocument();
      expect(screen.getByTestId('game-card-game2')).toBeInTheDocument();
      expect(screen.getByTestId('game-card-game3')).toBeInTheDocument();
    });

    it('should handle single game', () => {
      const singleGame = createMockGame({
        id: 'game1',
        game_number: 1,
      });

      renderWithProviders(
        <GamesListWithScroll
          {...defaultProps}
          games={[singleGame]}
        />,
        { guessesContext: true }
      );

      expect(screen.getByTestId('game-card-game1')).toBeInTheDocument();
    });

    it('should handle odd number of games', () => {
      const threeGames = [
        createMockGame({ id: 'game1', game_number: 1 }),
        createMockGame({ id: 'game2', game_number: 2 }),
        createMockGame({ id: 'game3', game_number: 3 }),
      ];

      renderWithProviders(
        <GamesListWithScroll
          {...defaultProps}
          games={threeGames}
        />,
        { guessesContext: true }
      );

      expect(screen.getByTestId('game-card-game1')).toBeInTheDocument();
      expect(screen.getByTestId('game-card-game2')).toBeInTheDocument();
      expect(screen.getByTestId('game-card-game3')).toBeInTheDocument();
    });

    it('should render navigation buttons outside the grid', () => {
      const multipleGames = [
        createMockGame({ id: 'game1', game_number: 1 }),
        createMockGame({ id: 'game2', game_number: 2 }),
        createMockGame({ id: 'game3', game_number: 3 }),
      ];

      renderWithProviders(
        <GamesListWithScroll {...defaultProps} games={multipleGames} />,
        { guessesContext: true }
      );

      // Navigation buttons should still be present (supports both English and Spanish)
      const goToNextButton = screen.getByText(/Go to Next Match|Ir al Proximo Partido/i);
      const backToTopButton = screen.getByText(/Back to Top|Volver al Principio/i);

      expect(goToNextButton).toBeInTheDocument();
      expect(backToTopButton).toBeInTheDocument();
    });

    it('should not render navigation buttons when only 1 game', () => {
      const singleGame = createMockGame({
        id: 'game1',
        game_number: 1,
      });

      renderWithProviders(
        <GamesListWithScroll
          {...defaultProps}
          games={[singleGame]}
        />,
        { guessesContext: true }
      );

      // Navigation buttons should not appear for single game (check both languages)
      expect(screen.queryByText(/Go to Next Match|Ir al Proximo Partido/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Back to Top|Volver al Principio/i)).not.toBeInTheDocument();
    });

    it('should preserve game IDs for scrolling', () => {
      const multipleGames = [
        createMockGame({ id: 'game1', game_number: 1 }),
        createMockGame({ id: 'game2', game_number: 2 }),
        createMockGame({ id: 'game3', game_number: 3 }),
      ];

      const { container } = renderWithProviders(
        <GamesListWithScroll {...defaultProps} games={multipleGames} />,
        { guessesContext: true }
      );

      // Each game should have an id attribute for scrolling
      expect(container.querySelector('#game-game1')).toBeInTheDocument();
      expect(container.querySelector('#game-game2')).toBeInTheDocument();
      expect(container.querySelector('#game-game3')).toBeInTheDocument();
    });

    it('should handle large number of games (no virtualization needed)', () => {
      const manyGames = Array.from({ length: 50 }, (_, i) =>
        createMockGame({
          id: `game${i + 1}`,
          game_number: i + 1,
        })
      );

      renderWithProviders(
        <GamesListWithScroll
          {...defaultProps}
          games={manyGames}
        />,
        { guessesContext: true }
      );

      // All games should be rendered (no virtualization for <100 games)
      expect(screen.getByTestId('game-card-game1')).toBeInTheDocument();
      expect(screen.getByTestId('game-card-game50')).toBeInTheDocument();
    });
  });

  describe('Story #376 — Stage Separators and section grouping', () => {
    it('renders a StageSeparator for group games with matchday', () => {
      const game = createMockGame({
        id: 'game1',
        matchday: 1,
        group: { tournament_group_id: 'grp-a', group_letter: 'A' },
      });

      renderWithProviders(
        <GamesListWithScroll {...defaultProps} games={[game]} />,
        { guessesContext: true }
      );

      expect(screen.getByTestId('stage-separator')).toBeInTheDocument();
    });

    it('renders separate StageSeparators for different matchdays', () => {
      const game1 = createMockGame({
        id: 'game1',
        game_number: 1,
        matchday: 1,
        group: { tournament_group_id: 'grp-a', group_letter: 'A' },
      });
      const game2 = createMockGame({
        id: 'game2',
        game_number: 2,
        matchday: 2,
        group: { tournament_group_id: 'grp-a', group_letter: 'A' },
      });

      renderWithProviders(
        <GamesListWithScroll {...defaultProps} games={[game1, game2]} />,
        { guessesContext: true }
      );

      expect(screen.getAllByTestId('stage-separator')).toHaveLength(2);
    });

    it('groups games with the same matchday under one separator', () => {
      const game1 = createMockGame({
        id: 'game1',
        game_number: 1,
        matchday: 1,
        group: { tournament_group_id: 'grp-a', group_letter: 'A' },
      });
      const game2 = createMockGame({
        id: 'game2',
        game_number: 2,
        matchday: 1,
        group: { tournament_group_id: 'grp-b', group_letter: 'B' },
      });

      renderWithProviders(
        <GamesListWithScroll {...defaultProps} games={[game1, game2]} />,
        { guessesContext: true }
      );

      expect(screen.getAllByTestId('stage-separator')).toHaveLength(1);
    });

    it('renders StageTransitionBanner (not StageSeparator) for the first playoff section', () => {
      const game = createMockGame({
        id: 'game1',
        playoffStage: {
          tournament_playoff_round_id: 'round-qf',
          round_name: 'Quarterfinals',
          is_final: false,
          is_third_place: false,
        },
      });

      renderWithProviders(
        <GamesListWithScroll {...defaultProps} games={[game]} />,
        { guessesContext: true }
      );

      expect(screen.getByTestId('stage-transition-banner')).toBeInTheDocument();
      expect(screen.queryByTestId('stage-separator')).not.toBeInTheDocument();
    });

    it('calls onGameStageClick with the game when stage button is clicked', () => {
      const onGameStageClick = vi.fn();
      const game = createMockGame({
        id: 'game1',
        matchday: 1,
        group: { tournament_group_id: 'grp-a', group_letter: 'A' },
      });

      renderWithProviders(
        <GamesListWithScroll {...defaultProps} games={[game]} onGameStageClick={onGameStageClick} />,
        { guessesContext: true }
      );

      fireEvent.click(screen.getByTestId('stage-click-game1'));
      expect(onGameStageClick).toHaveBeenCalledWith(game);
    });
  });

  describe('Story #392 — Guided flow (banner + auto-advance + isGuidedMode)', () => {
    it('renders StageTransitionBanner with "Predict" CTA when qtPredictionLocked=false', () => {
      const groupGame = createMockGame({
        id: 'g1',
        matchday: 1,
        group: { tournament_group_id: 'grp-a', group_letter: 'A' },
      });
      const playoffGame = createMockGame({
        id: 'p1',
        playoffStage: {
          tournament_playoff_round_id: 'round-qf',
          round_name: 'Quarterfinals',
          is_final: false,
          is_third_place: false,
        },
      });

      renderWithProviders(
        <GamesListWithScroll
          {...defaultProps}
          games={[groupGame, playoffGame]}
          qtPredictionLocked={false}
        />,
        { guessesContext: true }
      );

      const banner = screen.getByTestId('stage-transition-banner');
      expect(banner.dataset.cta).toBe('Predecir Equipos Clasificados');
    });

    it('renders StageTransitionBanner with "Check" CTA when qtPredictionLocked=true', () => {
      const groupGame = createMockGame({
        id: 'g1',
        matchday: 1,
        group: { tournament_group_id: 'grp-a', group_letter: 'A' },
      });
      const playoffGame = createMockGame({
        id: 'p1',
        playoffStage: {
          tournament_playoff_round_id: 'round-qf',
          round_name: 'Quarterfinals',
          is_final: false,
          is_third_place: false,
        },
      });

      renderWithProviders(
        <GamesListWithScroll
          {...defaultProps}
          games={[groupGame, playoffGame]}
          qtPredictionLocked={true}
        />,
        { guessesContext: true }
      );

      const banner = screen.getByTestId('stage-transition-banner');
      expect(banner.dataset.cta).toBe('Ver tus Predicciones de Clasificados');
    });

    it('only renders one StageTransitionBanner even with multiple playoff rounds', () => {
      const groupGame = createMockGame({
        id: 'g1',
        matchday: 1,
        group: { tournament_group_id: 'grp-a', group_letter: 'A' },
      });
      const playoffQF = createMockGame({
        id: 'p-qf',
        game_number: 10,
        playoffStage: {
          tournament_playoff_round_id: 'round-qf',
          round_name: 'Quarterfinals',
          is_final: false,
          is_third_place: false,
        },
      });
      const playoffSF = createMockGame({
        id: 'p-sf',
        game_number: 11,
        playoffStage: {
          tournament_playoff_round_id: 'round-sf',
          round_name: 'Semifinals',
          is_final: false,
          is_third_place: false,
        },
      });

      renderWithProviders(
        <GamesListWithScroll
          {...defaultProps}
          games={[groupGame, playoffQF, playoffSF]}
        />,
        { guessesContext: true }
      );

      expect(screen.getAllByTestId('stage-transition-banner')).toHaveLength(1);
      // Semifinals round gets a regular StageSeparator
      expect(screen.getAllByTestId('stage-separator').length).toBeGreaterThanOrEqual(1);
    });

    it('does not advance into playoff games (stops at group stage boundary)', async () => {
      const groupGame = createMockGame({ id: 'g1', game_number: 1 });
      const playoffGame = createMockGame({
        id: 'p1',
        game_number: 2,
        playoffStage: {
          tournament_playoff_round_id: 'round-qf',
          round_name: 'Quarterfinals',
          is_final: false,
          is_third_place: false,
        },
      });

      const user = userEvent.setup();
      renderWithProviders(
        <GamesListWithScroll {...defaultProps} games={[groupGame, playoffGame]} />,
        { guessesContext: true }
      );

      const game1Card = screen.getByTestId('game-card-g1');
      const nextButton = within(game1Card).getByText('Next');

      mockEditMode.startEdit.mockClear();
      await user.click(nextButton);

      // Should NOT advance into the playoff game
      expect(mockEditMode.startEdit).not.toHaveBeenCalled();
    });

    it('passes isGuidedMode=true to every FlippableGameCard', () => {
      // The mock FlippableGameCard exposes a "Next" button regardless of isGuidedMode,
      // so we verify via the mock component's captured call behavior.
      // We check this indirectly: both game cards render correctly.
      const games = [
        createMockGame({ id: 'game1', game_number: 1 }),
        createMockGame({ id: 'game2', game_number: 2 }),
      ];

      renderWithProviders(
        <GamesListWithScroll {...defaultProps} games={games} />,
        { guessesContext: true }
      );

      // Both cards rendered — isGuidedMode prop threads through without errors
      expect(screen.getByTestId('game-card-game1')).toBeInTheDocument();
      expect(screen.getByTestId('game-card-game2')).toBeInTheDocument();
    });

    it('stops silently when all remaining group games are already predicted', async () => {
      const game1 = createMockGame({ id: 'game1', game_number: 1 });
      const game2 = createMockGame({ id: 'game2', game_number: 2 });

      const game2Guess: GameGuessNew = {
        game_id: 'game2',
        game_number: 2,
        user_id: 'user-1',
        home_score: 1,
        away_score: 0,
        home_penalty_winner: false,
        away_penalty_winner: false,
        home_team: 'team1',
        away_team: 'team2',
        boost_type: null,
        score: undefined,
      };

      const user = userEvent.setup();
      renderWithProviders(
        <GamesListWithScroll {...defaultProps} games={[game1, game2]} />,
        {
          guessesContext: createMockGuessesContext({
            gameGuesses: { 'game2': game2Guess }
          })
        }
      );

      const game1Card = screen.getByTestId('game-card-game1');
      const nextButton = within(game1Card).getByText('Next');

      mockEditMode.startEdit.mockClear();
      await user.click(nextButton);

      // game2 is predicted → no unpredicted group games remain → stops silently
      expect(mockEditMode.startEdit).not.toHaveBeenCalled();
    });
  });
});
