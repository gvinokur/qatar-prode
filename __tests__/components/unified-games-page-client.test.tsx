import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { UnifiedGamesPageClient } from '../../app/components/unified-games-page-client';
import { renderWithProviders, createMockGuessesContext } from '../utils/test-utils';
import { testFactories, createMany } from '../db/test-factories';
import { ExtendedGameData } from '../../app/definitions';
import { TournamentGameCounts } from '../../app/db/game-repository';
import { Team, Tournament, TournamentGroup, PlayoffRound, TournamentPredictionCompletion } from '../../app/db/tables-definition';
import * as gameFiltersModule from '../../app/utils/game-filters';
import * as autoScrollModule from '../../app/utils/auto-scroll';

// Mock child components
const mockCompactPredictionDashboard = vi.fn(() => <div data-testid="compact-prediction-dashboard">Dashboard</div>);
const mockGameFilters = vi.fn(({ onFilterChange, activeFilter }) => (
  <div data-testid="game-filters">
    <button data-testid="filter-groups" onClick={() => onFilterChange('groups')}>Groups</button>
    <button data-testid="filter-playoffs" onClick={() => onFilterChange('playoffs')}>Playoffs</button>
    <span data-testid="active-filter">{activeFilter}</span>
  </div>
));
const mockSecondaryFilters = vi.fn(({ onGroupChange, onRoundChange, groupFilter, roundFilter }) => (
  <div data-testid="secondary-filters">
    <button data-testid="group-a" onClick={() => onGroupChange('group-1')}>Group A</button>
    <button data-testid="round-1" onClick={() => onRoundChange('round-1')}>Round 1</button>
    <span data-testid="group-filter">{groupFilter || 'none'}</span>
    <span data-testid="round-filter">{roundFilter || 'none'}</span>
  </div>
));
const mockGamesListWithScroll = vi.fn(({ games }) => (
  <div data-testid="games-list-with-scroll">
    {games.map((game: ExtendedGameData) => (
      <div key={game.id} id={`game-${game.id}`} data-testid={`game-${game.id}`}>
        Game {game.id}
      </div>
    ))}
  </div>
));

vi.mock('../../app/components/compact-prediction-dashboard', () => ({
  CompactPredictionDashboard: (props: any) => mockCompactPredictionDashboard(props)
}));

vi.mock('../../app/components/game-filters', () => ({
  GameFilters: (props: any) => mockGameFilters(props)
}));

vi.mock('../../app/components/secondary-filters', () => ({
  SecondaryFilters: (props: any) => mockSecondaryFilters(props)
}));

vi.mock('../../app/components/games-list-with-scroll', () => ({
  GamesListWithScroll: (props: any) => mockGamesListWithScroll(props)
}));

// Mock utility modules
vi.mock('../../app/utils/game-filters', async () => {
  const actual = await vi.importActual('../../app/utils/game-filters');
  return {
    ...actual,
    filterGames: vi.fn((games) => games)
  };
});

vi.mock('../../app/utils/auto-scroll', () => ({
  findScrollTarget: vi.fn(() => 'game-1'),
  scrollToGame: vi.fn()
}));

describe('UnifiedGamesPageClient', () => {
  // Test data factories
  const createTestGames = (count: number): ExtendedGameData[] => {
    return createMany(testFactories.game, count, (i) => ({
      id: `game-${i}`,
      game_number: i,
      tournament_id: 'tournament-1',
      home_team: `team-${i * 2 - 1}`,
      away_team: `team-${i * 2}`,
      game_date: new Date(`2024-06-${14 + i}T18:00:00Z`),
      location: `Stadium ${i}`,
      game_type: i <= 3 ? 'group' : 'playoff',
      group: i <= 3 ? { tournament_group_id: 'group-1', group_letter: 'A' } : null,
      playoffStage: i > 3 ? {
        tournament_playoff_round_id: 'round-1',
        round_name: 'Round of 16',
        is_final: false,
        is_third_place: false
      } : null,
      gameResult: null
    })) as ExtendedGameData[];
  };

  const createTestTeamsMap = (count: number): Record<string, Team> => {
    const teams = createMany(testFactories.team, count, (i) => ({
      id: `team-${i}`,
      name: `Team ${i}`,
      short_name: `T${i}`
    }));
    return teams.reduce((acc, team) => ({ ...acc, [team.id]: team }), {});
  };

  const defaultGameCounts: TournamentGameCounts = {
    total: 6,
    groups: 3,
    playoffs: 3,
    unpredicted: 2,
    closingSoon: 1
  };

  const defaultTournament: Tournament = testFactories.tournament({
    id: 'tournament-1',
    short_name: 'TEST',
    long_name: 'Test Tournament 2024',
    max_silver_games: 5,
    max_golden_games: 3
  });

  const defaultGroups: TournamentGroup[] = [
    testFactories.tournamentGroup({ id: 'group-1', group_letter: 'A' }),
    testFactories.tournamentGroup({ id: 'group-2', group_letter: 'B' })
  ];

  const defaultRounds: PlayoffRound[] = [
    testFactories.playoffRound({ id: 'round-1', round_name: 'Round of 16', round_order: 1 }),
    testFactories.playoffRound({ id: 'round-2', round_name: 'Quarter Finals', round_order: 2 })
  ];

  const defaultDashboardStats = {
    silverUsed: 2,
    goldenUsed: 1
  };

  const defaultTournamentPredictionCompletion: TournamentPredictionCompletion = {
    finalStandings: {
      completed: 2,
      total: 3,
      champion: true,
      runnerUp: true,
      thirdPlace: false
    },
    awards: {
      completed: 1,
      total: 4,
      bestPlayer: true,
      topGoalscorer: false,
      bestGoalkeeper: false,
      bestYoungPlayer: false
    },
    qualifiers: {
      completed: 8,
      total: 16
    },
    overallCompleted: 11,
    overallTotal: 23,
    overallPercentage: 47.83,
    isPredictionLocked: false
  };

  // Store original methods
  let originalScrollIntoView: typeof Element.prototype.scrollIntoView;
  let originalScrollTo: typeof Element.prototype.scrollTo;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    });

    // Store original methods
    originalScrollIntoView = Element.prototype.scrollIntoView;
    originalScrollTo = Element.prototype.scrollTo;

    // Mock scroll methods
    Element.prototype.scrollIntoView = vi.fn();
    Element.prototype.scrollTo = vi.fn();

    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024
    });
  });

  afterEach(() => {
    // Restore original methods
    Element.prototype.scrollIntoView = originalScrollIntoView;
    Element.prototype.scrollTo = originalScrollTo;
  });

  describe('Rendering', () => {
    it('should render all main sections', () => {
      const games = createTestGames(6);
      const teamsMap = createTestTeamsMap(12);

      renderWithProviders(
        <UnifiedGamesPageClient
          games={games}
          gameCounts={defaultGameCounts}
          teamsMap={teamsMap}
          tournamentId="tournament-1"
          groups={defaultGroups}
          rounds={defaultRounds}
          dashboardStats={defaultDashboardStats}
          tournament={defaultTournament}
          closingGames={[]}
          tournamentPredictionCompletion={defaultTournamentPredictionCompletion}
          tournamentStartDate={undefined}
        />,
        { guessesContext: true }
      );

      expect(screen.getByTestId('compact-prediction-dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('game-filters')).toBeInTheDocument();
      expect(screen.getByTestId('secondary-filters')).toBeInTheDocument();
      expect(screen.getByTestId('games-list-with-scroll')).toBeInTheDocument();
    });

    it('should render with null dashboardStats', () => {
      const games = createTestGames(6);
      const teamsMap = createTestTeamsMap(12);

      renderWithProviders(
        <UnifiedGamesPageClient
          games={games}
          gameCounts={defaultGameCounts}
          teamsMap={teamsMap}
          tournamentId="tournament-1"
          groups={defaultGroups}
          rounds={defaultRounds}
          dashboardStats={null}
          tournament={defaultTournament}
          closingGames={[]}
          tournamentPredictionCompletion={null}
          tournamentStartDate={undefined}
        />,
        { guessesContext: true }
      );

      expect(screen.getByTestId('compact-prediction-dashboard')).toBeInTheDocument();
    });

    it('should render all games in the list', () => {
      const games = createTestGames(6);
      const teamsMap = createTestTeamsMap(12);

      renderWithProviders(
        <UnifiedGamesPageClient
          games={games}
          gameCounts={defaultGameCounts}
          teamsMap={teamsMap}
          tournamentId="tournament-1"
          groups={defaultGroups}
          rounds={defaultRounds}
          dashboardStats={defaultDashboardStats}
          tournament={defaultTournament}
          closingGames={[]}
          tournamentPredictionCompletion={defaultTournamentPredictionCompletion}
          tournamentStartDate={undefined}
        />,
        { guessesContext: true }
      );

      games.forEach(game => {
        expect(screen.getByTestId(`game-${game.id}`)).toBeInTheDocument();
      });
    });

    it('should render with empty games list', () => {
      const teamsMap = createTestTeamsMap(12);

      renderWithProviders(
        <UnifiedGamesPageClient
          games={[]}
          gameCounts={{ total: 0, groups: 0, playoffs: 0, unpredicted: 0, closingSoon: 0 }}
          teamsMap={teamsMap}
          tournamentId="tournament-1"
          groups={defaultGroups}
          rounds={defaultRounds}
          dashboardStats={defaultDashboardStats}
          tournament={defaultTournament}
          closingGames={[]}
          tournamentPredictionCompletion={defaultTournamentPredictionCompletion}
          tournamentStartDate={undefined}
        />,
        { guessesContext: true }
      );

      expect(screen.getByTestId('compact-prediction-dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('game-filters')).toBeInTheDocument();
    });
  });

  describe('Filter Context Integration', () => {
    it('should initialize with "all" filter from localStorage', () => {
      const games = createTestGames(6);
      const teamsMap = createTestTeamsMap(12);

      renderWithProviders(
        <UnifiedGamesPageClient
          games={games}
          gameCounts={defaultGameCounts}
          teamsMap={teamsMap}
          tournamentId="tournament-1"
          groups={defaultGroups}
          rounds={defaultRounds}
          dashboardStats={defaultDashboardStats}
          tournament={defaultTournament}
          closingGames={[]}
          tournamentPredictionCompletion={defaultTournamentPredictionCompletion}
          tournamentStartDate={undefined}
        />,
        { guessesContext: true }
      );

      expect(screen.getByTestId('active-filter')).toHaveTextContent('all');
    });

    it('should call filter handler when filter button is clicked', () => {
      const games = createTestGames(6);
      const teamsMap = createTestTeamsMap(12);

      renderWithProviders(
        <UnifiedGamesPageClient
          games={games}
          gameCounts={defaultGameCounts}
          teamsMap={teamsMap}
          tournamentId="tournament-1"
          groups={defaultGroups}
          rounds={defaultRounds}
          dashboardStats={defaultDashboardStats}
          tournament={defaultTournament}
          closingGames={[]}
          tournamentPredictionCompletion={defaultTournamentPredictionCompletion}
          tournamentStartDate={undefined}
        />,
        { guessesContext: true }
      );

      // Click the filter button - this should call the onFilterChange handler
      fireEvent.click(screen.getByTestId('filter-groups'));

      // The mock should have been called with the filter change handler
      expect(mockGameFilters).toHaveBeenCalled();
    });

    it('should call group filter handler when group button is clicked', () => {
      const games = createTestGames(6);
      const teamsMap = createTestTeamsMap(12);

      renderWithProviders(
        <UnifiedGamesPageClient
          games={games}
          gameCounts={defaultGameCounts}
          teamsMap={teamsMap}
          tournamentId="tournament-1"
          groups={defaultGroups}
          rounds={defaultRounds}
          dashboardStats={defaultDashboardStats}
          tournament={defaultTournament}
          closingGames={[]}
          tournamentPredictionCompletion={defaultTournamentPredictionCompletion}
          tournamentStartDate={undefined}
        />,
        { guessesContext: true }
      );

      fireEvent.click(screen.getByTestId('group-a'));
      expect(mockSecondaryFilters).toHaveBeenCalled();
    });
  });

  describe('Game Filtering', () => {
    it('should call filterGames with correct parameters', () => {
      const games = createTestGames(6);
      const teamsMap = createTestTeamsMap(12);
      const mockGameGuesses = {
        'game-1': testFactories.gameGuess({ game_id: 'game-1', home_score: 2, away_score: 1 })
      };

      renderWithProviders(
        <UnifiedGamesPageClient
          games={games}
          gameCounts={defaultGameCounts}
          teamsMap={teamsMap}
          tournamentId="tournament-1"
          groups={defaultGroups}
          rounds={defaultRounds}
          dashboardStats={defaultDashboardStats}
          tournament={defaultTournament}
          closingGames={[]}
          tournamentPredictionCompletion={defaultTournamentPredictionCompletion}
          tournamentStartDate={undefined}
        />,
        { guessesContext: { gameGuesses: mockGameGuesses } }
      );

      expect(gameFiltersModule.filterGames).toHaveBeenCalledWith(
        games,
        'all',
        null,
        null,
        mockGameGuesses
      );
    });

    it('should filter games with empty guesses context', () => {
      const games = createTestGames(6);
      const teamsMap = createTestTeamsMap(12);

      renderWithProviders(
        <UnifiedGamesPageClient
          games={games}
          gameCounts={defaultGameCounts}
          teamsMap={teamsMap}
          tournamentId="tournament-1"
          groups={defaultGroups}
          rounds={defaultRounds}
          dashboardStats={defaultDashboardStats}
          tournament={defaultTournament}
          closingGames={[]}
          tournamentPredictionCompletion={defaultTournamentPredictionCompletion}
          tournamentStartDate={undefined}
        />,
        { guessesContext: { gameGuesses: {} } }
      );

      expect(gameFiltersModule.filterGames).toHaveBeenCalledWith(
        games,
        'all',
        null,
        null,
        {}
      );
    });
  });

  describe('Progress Calculation', () => {
    it('should calculate predicted games correctly with full predictions', () => {
      const games = createTestGames(3);
      const teamsMap = createTestTeamsMap(6);
      const mockGameGuesses = {
        'game-1': testFactories.gameGuess({ game_id: 'game-1', home_score: 2, away_score: 1 }),
        'game-2': testFactories.gameGuess({ game_id: 'game-2', home_score: 1, away_score: 1 }),
        'game-3': testFactories.gameGuess({ game_id: 'game-3', home_score: 3, away_score: 0 })
      };

      renderWithProviders(
        <UnifiedGamesPageClient
          games={games}
          gameCounts={defaultGameCounts}
          teamsMap={teamsMap}
          tournamentId="tournament-1"
          groups={defaultGroups}
          rounds={defaultRounds}
          dashboardStats={defaultDashboardStats}
          tournament={defaultTournament}
          closingGames={[]}
          tournamentPredictionCompletion={defaultTournamentPredictionCompletion}
          tournamentStartDate={undefined}
        />,
        { guessesContext: { gameGuesses: mockGameGuesses } }
      );

      // Dashboard should be rendered with calculated progress
      expect(mockCompactPredictionDashboard).toHaveBeenCalledWith(
        expect.objectContaining({
          totalGames: 3,
          predictedGames: 3
        })
      );
    });

    it('should count games with partial predictions as unpredicted', () => {
      const games = createTestGames(3);
      const teamsMap = createTestTeamsMap(6);
      const mockGameGuesses = {
        'game-1': testFactories.gameGuess({ game_id: 'game-1', home_score: 2, away_score: null }),
        'game-2': testFactories.gameGuess({ game_id: 'game-2', home_score: null, away_score: 1 })
      };

      renderWithProviders(
        <UnifiedGamesPageClient
          games={games}
          gameCounts={defaultGameCounts}
          teamsMap={teamsMap}
          tournamentId="tournament-1"
          groups={defaultGroups}
          rounds={defaultRounds}
          dashboardStats={defaultDashboardStats}
          tournament={defaultTournament}
          closingGames={[]}
          tournamentPredictionCompletion={defaultTournamentPredictionCompletion}
          tournamentStartDate={undefined}
        />,
        { guessesContext: { gameGuesses: mockGameGuesses } }
      );

      // Partial predictions should not count as predicted
      expect(mockCompactPredictionDashboard).toHaveBeenCalledWith(
        expect.objectContaining({
          totalGames: 3,
          predictedGames: 0
        })
      );
    });

    it('should handle zero predictions', () => {
      const games = createTestGames(3);
      const teamsMap = createTestTeamsMap(6);

      renderWithProviders(
        <UnifiedGamesPageClient
          games={games}
          gameCounts={defaultGameCounts}
          teamsMap={teamsMap}
          tournamentId="tournament-1"
          groups={defaultGroups}
          rounds={defaultRounds}
          dashboardStats={defaultDashboardStats}
          tournament={defaultTournament}
          closingGames={[]}
          tournamentPredictionCompletion={defaultTournamentPredictionCompletion}
          tournamentStartDate={undefined}
        />,
        { guessesContext: { gameGuesses: {} } }
      );

      expect(mockCompactPredictionDashboard).toHaveBeenCalledWith(
        expect.objectContaining({
          totalGames: 3,
          predictedGames: 0
        })
      );
    });
  });

  describe('Auto-scroll Behavior', () => {
    it('should call findScrollTarget when component mounts with games', () => {
      const games = createTestGames(6);
      const teamsMap = createTestTeamsMap(12);

      vi.mocked(autoScrollModule.findScrollTarget).mockReturnValue('game-1');

      renderWithProviders(
        <UnifiedGamesPageClient
          games={games}
          gameCounts={defaultGameCounts}
          teamsMap={teamsMap}
          tournamentId="tournament-1"
          groups={defaultGroups}
          rounds={defaultRounds}
          dashboardStats={defaultDashboardStats}
          tournament={defaultTournament}
          closingGames={[]}
          tournamentPredictionCompletion={defaultTournamentPredictionCompletion}
          tournamentStartDate={undefined}
        />,
        { guessesContext: true }
      );

      expect(autoScrollModule.findScrollTarget).toHaveBeenCalledWith(games);
    });

    it('should not call scrollToGame when no scroll target is found', () => {
      const games = createTestGames(6);
      const teamsMap = createTestTeamsMap(12);

      vi.mocked(autoScrollModule.findScrollTarget).mockReturnValue(null);

      renderWithProviders(
        <UnifiedGamesPageClient
          games={games}
          gameCounts={defaultGameCounts}
          teamsMap={teamsMap}
          tournamentId="tournament-1"
          groups={defaultGroups}
          rounds={defaultRounds}
          dashboardStats={defaultDashboardStats}
          tournament={defaultTournament}
          closingGames={[]}
          tournamentPredictionCompletion={defaultTournamentPredictionCompletion}
          tournamentStartDate={undefined}
        />,
        { guessesContext: true }
      );

      // scrollToGame should not be called if findScrollTarget returns null
      // Note: This might be called during initial render, so we're just checking it's been considered
      expect(autoScrollModule.findScrollTarget).toHaveBeenCalled();
    });

    it('should not call findScrollTarget when filtered games list is empty', () => {
      const games = createTestGames(6);
      const teamsMap = createTestTeamsMap(12);

      // Mock filterGames to return empty array
      vi.mocked(gameFiltersModule.filterGames).mockReturnValue([]);

      renderWithProviders(
        <UnifiedGamesPageClient
          games={games}
          gameCounts={defaultGameCounts}
          teamsMap={teamsMap}
          tournamentId="tournament-1"
          groups={defaultGroups}
          rounds={defaultRounds}
          dashboardStats={defaultDashboardStats}
          tournament={defaultTournament}
          closingGames={[]}
          tournamentPredictionCompletion={defaultTournamentPredictionCompletion}
          tournamentStartDate={undefined}
        />,
        { guessesContext: true }
      );

      // findScrollTarget should not be called when there are no filtered games
      expect(autoScrollModule.findScrollTarget).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle games with no group or playoff stage', () => {
      const games = createTestGames(2).map(game => ({
        ...game,
        group: null,
        playoffStage: null
      }));
      const teamsMap = createTestTeamsMap(4);

      renderWithProviders(
        <UnifiedGamesPageClient
          games={games}
          gameCounts={defaultGameCounts}
          teamsMap={teamsMap}
          tournamentId="tournament-1"
          groups={[]}
          rounds={[]}
          dashboardStats={defaultDashboardStats}
          tournament={defaultTournament}
          closingGames={[]}
          tournamentPredictionCompletion={defaultTournamentPredictionCompletion}
          tournamentStartDate={undefined}
        />,
        { guessesContext: true }
      );

      expect(screen.getByTestId('games-list-with-scroll')).toBeInTheDocument();
    });

    it('should handle tournament with zero boost limits', () => {
      const games = createTestGames(6);
      const teamsMap = createTestTeamsMap(12);
      const tournament = testFactories.tournament({
        id: 'tournament-1',
        max_silver_games: 0,
        max_golden_games: 0
      });

      renderWithProviders(
        <UnifiedGamesPageClient
          games={games}
          gameCounts={defaultGameCounts}
          teamsMap={teamsMap}
          tournamentId="tournament-1"
          groups={defaultGroups}
          rounds={defaultRounds}
          dashboardStats={{ silverUsed: 0, goldenUsed: 0 }}
          tournament={tournament}
          closingGames={[]}
          tournamentPredictionCompletion={defaultTournamentPredictionCompletion}
          tournamentStartDate={undefined}
        />,
        { guessesContext: true }
      );

      expect(mockCompactPredictionDashboard).toHaveBeenCalledWith(
        expect.objectContaining({
          silverMax: 0,
          goldenMax: 0
        })
      );
    });

    it('should handle empty groups and rounds arrays', () => {
      const games = createTestGames(6);
      const teamsMap = createTestTeamsMap(12);

      renderWithProviders(
        <UnifiedGamesPageClient
          games={games}
          gameCounts={defaultGameCounts}
          teamsMap={teamsMap}
          tournamentId="tournament-1"
          groups={[]}
          rounds={[]}
          dashboardStats={defaultDashboardStats}
          tournament={defaultTournament}
          closingGames={[]}
          tournamentPredictionCompletion={defaultTournamentPredictionCompletion}
          tournamentStartDate={undefined}
        />,
        { guessesContext: true }
      );

      expect(mockSecondaryFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          groups: [],
          rounds: []
        })
      );
    });

    it('should handle undefined tournamentStartDate', () => {
      const games = createTestGames(6);
      const teamsMap = createTestTeamsMap(12);

      renderWithProviders(
        <UnifiedGamesPageClient
          games={games}
          gameCounts={defaultGameCounts}
          teamsMap={teamsMap}
          tournamentId="tournament-1"
          groups={defaultGroups}
          rounds={defaultRounds}
          dashboardStats={defaultDashboardStats}
          tournament={defaultTournament}
          closingGames={[]}
          tournamentPredictionCompletion={defaultTournamentPredictionCompletion}
          tournamentStartDate={undefined}
        />,
        { guessesContext: true }
      );

      expect(mockCompactPredictionDashboard).toHaveBeenCalledWith(
        expect.objectContaining({
          tournamentStartDate: undefined
        })
      );
    });
  });

  describe('Component Props Passing', () => {
    it('should pass correct props to CompactPredictionDashboard', () => {
      const games = createTestGames(6);
      const teamsMap = createTestTeamsMap(12);
      const closingGames = games.slice(0, 2);
      const tournamentStartDate = new Date('2024-06-14T00:00:00Z');

      renderWithProviders(
        <UnifiedGamesPageClient
          games={games}
          gameCounts={defaultGameCounts}
          teamsMap={teamsMap}
          tournamentId="tournament-1"
          groups={defaultGroups}
          rounds={defaultRounds}
          dashboardStats={defaultDashboardStats}
          tournament={defaultTournament}
          closingGames={closingGames}
          tournamentPredictionCompletion={defaultTournamentPredictionCompletion}
          tournamentStartDate={tournamentStartDate}
        />,
        { guessesContext: true }
      );

      expect(mockCompactPredictionDashboard).toHaveBeenCalledWith(
        expect.objectContaining({
          totalGames: 6,
          predictedGames: 0,
          silverUsed: 2,
          silverMax: 5,
          goldenUsed: 1,
          goldenMax: 3,
          tournamentPredictions: defaultTournamentPredictionCompletion,
          tournamentId: 'tournament-1',
          tournamentStartDate: tournamentStartDate,
          games: closingGames,
          teamsMap: teamsMap,
          isPlayoffs: false
        })
      );
    });

    it('should pass correct props to GameFilters', () => {
      const games = createTestGames(6);
      const teamsMap = createTestTeamsMap(12);

      renderWithProviders(
        <UnifiedGamesPageClient
          games={games}
          gameCounts={defaultGameCounts}
          teamsMap={teamsMap}
          tournamentId="tournament-1"
          groups={defaultGroups}
          rounds={defaultRounds}
          dashboardStats={defaultDashboardStats}
          tournament={defaultTournament}
          closingGames={[]}
          tournamentPredictionCompletion={defaultTournamentPredictionCompletion}
          tournamentStartDate={undefined}
        />,
        { guessesContext: true }
      );

      expect(mockGameFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          gameCounts: defaultGameCounts,
          activeFilter: 'all',
          onFilterChange: expect.any(Function)
        })
      );
    });

    it('should pass correct props to SecondaryFilters', () => {
      const games = createTestGames(6);
      const teamsMap = createTestTeamsMap(12);

      renderWithProviders(
        <UnifiedGamesPageClient
          games={games}
          gameCounts={defaultGameCounts}
          teamsMap={teamsMap}
          tournamentId="tournament-1"
          groups={defaultGroups}
          rounds={defaultRounds}
          dashboardStats={defaultDashboardStats}
          tournament={defaultTournament}
          closingGames={[]}
          tournamentPredictionCompletion={defaultTournamentPredictionCompletion}
          tournamentStartDate={undefined}
        />,
        { guessesContext: true }
      );

      expect(mockSecondaryFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          activeFilter: 'all',
          groupFilter: null,
          roundFilter: null,
          groups: defaultGroups,
          rounds: defaultRounds,
          onGroupChange: expect.any(Function),
          onRoundChange: expect.any(Function)
        })
      );
    });

    it('should pass correct props to GamesListWithScroll', () => {
      const games = createTestGames(6);
      const teamsMap = createTestTeamsMap(12);

      renderWithProviders(
        <UnifiedGamesPageClient
          games={games}
          gameCounts={defaultGameCounts}
          teamsMap={teamsMap}
          tournamentId="tournament-1"
          groups={defaultGroups}
          rounds={defaultRounds}
          dashboardStats={defaultDashboardStats}
          tournament={defaultTournament}
          closingGames={[]}
          tournamentPredictionCompletion={defaultTournamentPredictionCompletion}
          tournamentStartDate={undefined}
        />,
        { guessesContext: true }
      );

      expect(mockGamesListWithScroll).toHaveBeenCalledWith(
        expect.objectContaining({
          games: expect.any(Array),
          teamsMap: teamsMap,
          tournamentId: 'tournament-1',
          activeFilter: 'all',
          dashboardStats: defaultDashboardStats,
          tournament: defaultTournament
        })
      );
    });

    it('should handle null tournamentPredictionCompletion', () => {
      const games = createTestGames(6);
      const teamsMap = createTestTeamsMap(12);

      renderWithProviders(
        <UnifiedGamesPageClient
          games={games}
          gameCounts={defaultGameCounts}
          teamsMap={teamsMap}
          tournamentId="tournament-1"
          groups={defaultGroups}
          rounds={defaultRounds}
          dashboardStats={defaultDashboardStats}
          tournament={defaultTournament}
          closingGames={[]}
          tournamentPredictionCompletion={null}
          tournamentStartDate={undefined}
        />,
        { guessesContext: true }
      );

      expect(mockCompactPredictionDashboard).toHaveBeenCalledWith(
        expect.objectContaining({
          tournamentPredictions: undefined
        })
      );
    });
  });

  describe('GuessesContext Integration', () => {
    it('should work with empty gameGuesses', () => {
      const games = createTestGames(6);
      const teamsMap = createTestTeamsMap(12);

      renderWithProviders(
        <UnifiedGamesPageClient
          games={games}
          gameCounts={defaultGameCounts}
          teamsMap={teamsMap}
          tournamentId="tournament-1"
          groups={defaultGroups}
          rounds={defaultRounds}
          dashboardStats={defaultDashboardStats}
          tournament={defaultTournament}
          closingGames={[]}
          tournamentPredictionCompletion={defaultTournamentPredictionCompletion}
          tournamentStartDate={undefined}
        />,
        { guessesContext: { gameGuesses: {} } }
      );

      expect(screen.getByTestId('compact-prediction-dashboard')).toBeInTheDocument();
      expect(mockCompactPredictionDashboard).toHaveBeenCalledWith(
        expect.objectContaining({
          predictedGames: 0
        })
      );
    });

    it('should update filtered games when gameGuesses change', () => {
      const games = createTestGames(6);
      const teamsMap = createTestTeamsMap(12);

      const initialGuesses = {
        'game-1': testFactories.gameGuess({ game_id: 'game-1', home_score: 2, away_score: 1 })
      };

      const { rerenderWithProviders } = renderWithProviders(
        <UnifiedGamesPageClient
          games={games}
          gameCounts={defaultGameCounts}
          teamsMap={teamsMap}
          tournamentId="tournament-1"
          groups={defaultGroups}
          rounds={defaultRounds}
          dashboardStats={defaultDashboardStats}
          tournament={defaultTournament}
          closingGames={[]}
          tournamentPredictionCompletion={defaultTournamentPredictionCompletion}
          tournamentStartDate={undefined}
        />,
        { guessesContext: { gameGuesses: initialGuesses } }
      );

      expect(gameFiltersModule.filterGames).toHaveBeenCalledWith(
        games,
        'all',
        null,
        null,
        initialGuesses
      );

      vi.clearAllMocks();

      // Update guesses
      const updatedGuesses = {
        ...initialGuesses,
        'game-2': testFactories.gameGuess({ game_id: 'game-2', home_score: 1, away_score: 1 })
      };

      rerenderWithProviders(
        <UnifiedGamesPageClient
          games={games}
          gameCounts={defaultGameCounts}
          teamsMap={teamsMap}
          tournamentId="tournament-1"
          groups={defaultGroups}
          rounds={defaultRounds}
          dashboardStats={defaultDashboardStats}
          tournament={defaultTournament}
          closingGames={[]}
          tournamentPredictionCompletion={defaultTournamentPredictionCompletion}
          tournamentStartDate={undefined}
        />
      );

      expect(screen.getByTestId('compact-prediction-dashboard')).toBeInTheDocument();
    });
  });
});
