import { vi, describe, it, expect, beforeEach } from 'vitest';
import { UnifiedGamesPage } from '../../app/components/unified-games-page';
import * as userActions from '../../app/actions/user-actions';
import * as tournamentActions from '../../app/actions/tournament-actions';
import * as gameRepository from '../../app/db/game-repository';
import * as gameGuessRepository from '../../app/db/game-guess-repository';
import * as tournamentRepository from '../../app/db/tournament-repository';
import * as tournamentGroupRepository from '../../app/db/tournament-group-repository';
import * as tournamentPlayoffRepository from '../../app/db/tournament-playoff-repository';
import * as tournamentPredictionCompletionRepository from '../../app/db/tournament-prediction-completion-repository';
import { testFactories, createMany } from '../db/test-factories';

// Mock user actions
vi.mock('../../app/actions/user-actions', () => ({
  getLoggedInUser: vi.fn(),
}));

// Mock tournament actions
vi.mock('../../app/actions/tournament-actions', () => ({
  getTeamsMap: vi.fn(),
  getGamesClosingWithin48Hours: vi.fn(),
}));

// Mock database repositories
vi.mock('../../app/db/game-repository', () => ({
  getAllTournamentGames: vi.fn(),
  getTournamentGameCounts: vi.fn(),
}));

vi.mock('../../app/db/game-guess-repository', () => ({
  findGameGuessesByUserId: vi.fn(),
  getPredictionDashboardStats: vi.fn(),
  getGameGuessStatisticsForUsers: vi.fn(),
}));

vi.mock('../../app/db/tournament-repository', () => ({
  findTournamentById: vi.fn(),
}));

vi.mock('../../app/db/tournament-group-repository', () => ({
  findGroupsInTournament: vi.fn(),
}));

vi.mock('../../app/db/tournament-playoff-repository', () => ({
  findPlayoffStagesWithGamesInTournament: vi.fn(),
  findPlayoffRoundsWithAvailabilityInfo: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../app/db/tournament-prediction-completion-repository', () => ({
  getTournamentPredictionCompletion: vi.fn(),
}));

// Mock the PublicGamesPage component
vi.mock('../../app/components/tournament-page/public-games-page', () => ({
  PublicGamesPage: ({ tournamentId }: any) => (
    <div data-testid="public-games-page">
      <div data-testid="tournament-id">{tournamentId}</div>
    </div>
  ),
}));

// Mock the GuessesContextProvider
vi.mock('../../app/components/context-providers/guesses-context-provider', () => ({
  GuessesContextProvider: ({ children, gameGuesses, autoSave, tournamentMaxSilver, tournamentMaxGolden }: any) => (
    <div data-testid="guesses-context-provider">
      <div data-testid="auto-save">{String(autoSave)}</div>
      <div data-testid="max-silver">{tournamentMaxSilver}</div>
      <div data-testid="max-golden">{tournamentMaxGolden}</div>
      <div data-testid="game-guesses-count">{Object.keys(gameGuesses).length}</div>
      {children}
    </div>
  ),
}));

// Mock the EditTriggerContextProvider
vi.mock('../../app/components/context-providers/edit-trigger-context-provider', () => ({
  EditTriggerContextProvider: ({ children }: any) => (
    <div data-testid="edit-trigger-context-provider">
      {children}
    </div>
  ),
}));

// Mock the UnifiedGamesPageClient component
vi.mock('../../app/components/unified-games-page-client', () => ({
  UnifiedGamesPageClient: ({ games, gameCounts, teamsMap, tournamentId, groups, rounds, tournament, closingGames, tournamentPredictionCompletion, tournamentStartDate }: any) => (
    <div data-testid="unified-games-page-client">
      <div data-testid="tournament-id">{tournamentId}</div>
      <div data-testid="games-count">{games.length}</div>
      <div data-testid="teams-count">{Object.keys(teamsMap).length}</div>
      <div data-testid="groups-count">{groups.length}</div>
      <div data-testid="rounds-count">{rounds.length}</div>
      <div data-testid="tournament-name">{tournament.long_name}</div>
      <div data-testid="closing-games-count">{closingGames.length}</div>
      <div data-testid="has-completion">{tournamentPredictionCompletion ? 'true' : 'false'}</div>
      <div data-testid="has-start-date">{tournamentStartDate ? 'true' : 'false'}</div>
    </div>
  ),
}));

const mockGetLoggedInUser = vi.mocked(userActions.getLoggedInUser);
const mockGetTeamsMap = vi.mocked(tournamentActions.getTeamsMap);
const mockGetGamesClosingWithin48Hours = vi.mocked(tournamentActions.getGamesClosingWithin48Hours);
const mockGetAllTournamentGames = vi.mocked(gameRepository.getAllTournamentGames);
const mockGetTournamentGameCounts = vi.mocked(gameRepository.getTournamentGameCounts);
const mockFindGameGuessesByUserId = vi.mocked(gameGuessRepository.findGameGuessesByUserId);
const mockGetPredictionDashboardStats = vi.mocked(gameGuessRepository.getPredictionDashboardStats);
const mockGetGameGuessStatisticsForUsers = vi.mocked(gameGuessRepository.getGameGuessStatisticsForUsers);
const mockFindTournamentById = vi.mocked(tournamentRepository.findTournamentById);
const mockFindGroupsInTournament = vi.mocked(tournamentGroupRepository.findGroupsInTournament);
const mockFindPlayoffStagesWithGamesInTournament = vi.mocked(tournamentPlayoffRepository.findPlayoffStagesWithGamesInTournament);
const mockGetTournamentPredictionCompletion = vi.mocked(tournamentPredictionCompletionRepository.getTournamentPredictionCompletion);

describe('UnifiedGamesPage', () => {
  const tournamentId = 'tournament-1';

  // Create mock user
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    emailVerified: new Date(),
    name: 'Test User',
    image: null,
    role: 'user' as const,
    timezone: 'UTC',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Create mock data using test factories
  const mockTournament = testFactories.tournament({
    id: tournamentId,
    long_name: 'Test Tournament 2024',
    max_silver_games: 5,
    max_golden_games: 2,
  });

  const mockTeam1 = testFactories.team({ id: 'team-1', name: 'Argentina', short_name: 'ARG' });
  const mockTeam2 = testFactories.team({ id: 'team-2', name: 'Brazil', short_name: 'BRA' });

  const mockTeamsMap = {
    [mockTeam1.id]: mockTeam1,
    [mockTeam2.id]: mockTeam2,
  };

  const mockGames = createMany(testFactories.game, 3, (i) => ({
    id: `game-${i}`,
    tournament_id: tournamentId,
    game_number: i,
    home_team: mockTeam1.id,
    away_team: mockTeam2.id,
    game_date: new Date(`2024-06-${14 + i}T18:00:00Z`),
  }));

  const mockGameGuesses = createMany(testFactories.gameGuess, 2, (i) => ({
    id: `guess-${i}`,
    game_id: `game-${i}`,
    user_id: mockUser.id,
  }));

  const mockGroups = createMany(testFactories.tournamentGroup, 2, (i) => ({
    id: `group-${i}`,
    tournament_id: tournamentId,
    group_letter: i === 1 ? 'A' : 'B',
  }));

  const mockRounds = createMany(testFactories.playoffRound, 1, (i) => ({
    id: `round-${i}`,
    tournament_id: tournamentId,
    round_name: 'Round of 16',
  }));

  const mockGameCounts = {
    totalGames: 50,
    completedGuesses: 25,
    remainingGuesses: 25,
  };

  const mockDashboardStats = {
    totalPredictions: 25,
    correctOutcomes: 15,
    exactScores: 8,
  };

  const mockClosingGames = [mockGames[0]];

  const mockTournamentPredictionCompletion = {
    tournament_id: tournamentId,
    user_id: mockUser.id,
    completion_percentage: 75,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Set default mock implementations for authenticated flow
    mockGetLoggedInUser.mockResolvedValue(mockUser);
    mockGetAllTournamentGames.mockResolvedValue(mockGames);
    mockGetTournamentGameCounts.mockResolvedValue(mockGameCounts);
    mockGetTeamsMap.mockResolvedValue(mockTeamsMap);
    mockFindGameGuessesByUserId.mockResolvedValue(mockGameGuesses);
    mockGetPredictionDashboardStats.mockResolvedValue(mockDashboardStats);
    mockGetGameGuessStatisticsForUsers.mockResolvedValue([]);
    mockFindTournamentById.mockResolvedValue(mockTournament);
    mockFindGroupsInTournament.mockResolvedValue(mockGroups);
    mockFindPlayoffStagesWithGamesInTournament.mockResolvedValue(mockRounds);
    mockGetGamesClosingWithin48Hours.mockResolvedValue(mockClosingGames);
    mockGetTournamentPredictionCompletion.mockResolvedValue(mockTournamentPredictionCompletion);
  });

  describe('Authentication routing', () => {
    it('should route to PublicGamesPage when user is NOT authenticated', async () => {
      mockGetLoggedInUser.mockResolvedValue(null);

      const result = await UnifiedGamesPage({ tournamentId });

      expect(mockGetLoggedInUser).toHaveBeenCalled();
      expect(result.type).toBeDefined();
      expect(result.props.tournamentId).toBe(tournamentId);

      // Verify it doesn't fetch user-specific data
      expect(mockFindGameGuessesByUserId).not.toHaveBeenCalled();
      expect(mockGetTournamentGameCounts).not.toHaveBeenCalled();
      expect(mockGetPredictionDashboardStats).not.toHaveBeenCalled();
    });

    it('should route to UnifiedGamesPageClient when user IS authenticated', async () => {
      const result = await UnifiedGamesPage({ tournamentId });

      expect(mockGetLoggedInUser).toHaveBeenCalled();
      expect(result.type.name).not.toBe('PublicGamesPage');

      // Verify it fetches user-specific data
      expect(mockFindGameGuessesByUserId).toHaveBeenCalledWith(mockUser.id, tournamentId);
      expect(mockGetTournamentGameCounts).toHaveBeenCalledWith(mockUser.id, tournamentId);
      expect(mockGetPredictionDashboardStats).toHaveBeenCalledWith(mockUser.id, tournamentId);
    });

    it('should check user authentication', async () => {
      mockGetLoggedInUser.mockResolvedValue(null);

      await UnifiedGamesPage({ tournamentId });

      expect(mockGetLoggedInUser).toHaveBeenCalledTimes(1);
      // When user is null, it routes to PublicGamesPage and doesn't call authenticated data fetches
      expect(mockGetAllTournamentGames).not.toHaveBeenCalled();
    });
  });

  describe('Public view (unauthenticated)', () => {
    beforeEach(() => {
      mockGetLoggedInUser.mockResolvedValue(null);
    });

    it('should pass correct tournamentId to PublicGamesPage', async () => {
      const result = await UnifiedGamesPage({ tournamentId });

      expect(result.props.tournamentId).toBe(tournamentId);
    });

    it('should work with different tournament IDs', async () => {
      const differentTournamentId = 'tournament-2';
      const result = await UnifiedGamesPage({ tournamentId: differentTournamentId });

      expect(result.props.tournamentId).toBe(differentTournamentId);
    });

    it('should not fetch any user-specific data', async () => {
      await UnifiedGamesPage({ tournamentId });

      expect(mockFindGameGuessesByUserId).not.toHaveBeenCalled();
      expect(mockGetTournamentGameCounts).not.toHaveBeenCalled();
      expect(mockGetPredictionDashboardStats).not.toHaveBeenCalled();
      expect(mockGetTournamentPredictionCompletion).not.toHaveBeenCalled();
    });
  });

  describe('Authenticated view', () => {
    it('should fetch all user-specific data in parallel', async () => {
      await UnifiedGamesPage({ tournamentId });

      expect(mockGetAllTournamentGames).toHaveBeenCalledWith(tournamentId);
      expect(mockGetTournamentGameCounts).toHaveBeenCalledWith(mockUser.id, tournamentId);
      expect(mockGetTeamsMap).toHaveBeenCalledWith(tournamentId);
      expect(mockFindGameGuessesByUserId).toHaveBeenCalledWith(mockUser.id, tournamentId);
      expect(mockGetPredictionDashboardStats).toHaveBeenCalledWith(mockUser.id, tournamentId);
      expect(mockFindTournamentById).toHaveBeenCalledWith(tournamentId);
      expect(mockFindGroupsInTournament).toHaveBeenCalledWith(tournamentId);
      expect(mockFindPlayoffStagesWithGamesInTournament).toHaveBeenCalledWith(tournamentId);
      expect(mockGetGamesClosingWithin48Hours).toHaveBeenCalledWith(tournamentId);
    });

    it('should pass correct props to UnifiedGamesPageClient', async () => {
      const result = await UnifiedGamesPage({ tournamentId });
      const editTriggerProvider = result.props.children;
      const clientComponent = editTriggerProvider.props.children;
      const clientProps = clientComponent.props;

      expect(clientProps.tournamentId).toBe(tournamentId);
      expect(clientProps.games).toEqual(mockGames);
      expect(clientProps.gameCounts).toEqual(mockGameCounts);
      expect(clientProps.teamsMap).toEqual(mockTeamsMap);
      expect(clientProps.groups).toEqual(mockGroups);
      expect(clientProps.rounds).toEqual(mockRounds);
      expect(clientProps.tournament).toEqual(mockTournament);
      expect(clientProps.closingGames).toEqual(mockClosingGames);
      expect(clientProps.tournamentPredictionCompletion).toEqual(mockTournamentPredictionCompletion);
    });

    it('should calculate tournament start date from earliest game', async () => {
      const result = await UnifiedGamesPage({ tournamentId });
      const editTriggerProvider = result.props.children;
      const clientComponent = editTriggerProvider.props.children;
      const clientProps = clientComponent.props;

      expect(clientProps.tournamentStartDate).toBeDefined();
      expect(clientProps.tournamentStartDate.getTime()).toBe(mockGames[0].game_date.getTime());
    });

    it('should convert game guesses array to map', async () => {
      const result = await UnifiedGamesPage({ tournamentId });
      const providerProps = result.props;

      expect(providerProps.gameGuesses).toBeDefined();
      expect(Object.keys(providerProps.gameGuesses).length).toBe(mockGameGuesses.length);
      expect(providerProps.gameGuesses[mockGameGuesses[0].game_id]).toEqual(mockGameGuesses[0]);
      expect(providerProps.gameGuesses[mockGameGuesses[1].game_id]).toEqual(mockGameGuesses[1]);
    });

    it('should wrap UnifiedGamesPageClient in GuessesContextProvider', async () => {
      const result = await UnifiedGamesPage({ tournamentId });

      expect(result.type.name).toBe('GuessesContextProvider');
      expect(result.props.autoSave).toBe(true);
      expect(result.props.tournamentMaxSilver).toBe(mockTournament.max_silver_games);
      expect(result.props.tournamentMaxGolden).toBe(mockTournament.max_golden_games);
    });

    it('should set autoSave to true in context provider', async () => {
      const result = await UnifiedGamesPage({ tournamentId });

      expect(result.props.autoSave).toBe(true);
    });

    it('should pass tournament boost limits to context provider', async () => {
      const tournamentWithCustomBoosts = testFactories.tournament({
        id: tournamentId,
        max_silver_games: 10,
        max_golden_games: 5,
      });
      mockFindTournamentById.mockResolvedValue(tournamentWithCustomBoosts);

      const result = await UnifiedGamesPage({ tournamentId });

      expect(result.props.tournamentMaxSilver).toBe(10);
      expect(result.props.tournamentMaxGolden).toBe(5);
    });
  });

  describe('Tournament not found', () => {
    it('should return "Tournament not found" message when tournament does not exist', async () => {
      mockFindTournamentById.mockResolvedValue(null);

      const result = await UnifiedGamesPage({ tournamentId });

      expect(result.type).toBe('div');
      expect(result.props.children).toBe('Tournament not found.');
    });

    it('should not render client component when tournament not found', async () => {
      mockFindTournamentById.mockResolvedValue(null);

      const result = await UnifiedGamesPage({ tournamentId });

      expect(result.type).toBe('div');
      expect(result.props.children).not.toContain('UnifiedGamesPageClient');
    });
  });

  describe('Tournament start date calculation', () => {
    it('should calculate start date from earliest game', async () => {
      const gamesWithDifferentDates = [
        testFactories.game({ id: 'game-1', game_date: new Date('2024-06-20T18:00:00Z') }),
        testFactories.game({ id: 'game-2', game_date: new Date('2024-06-15T18:00:00Z') }), // Earliest
        testFactories.game({ id: 'game-3', game_date: new Date('2024-06-25T18:00:00Z') }),
      ];
      mockGetAllTournamentGames.mockResolvedValue(gamesWithDifferentDates);

      const result = await UnifiedGamesPage({ tournamentId });
      const editTriggerProvider = result.props.children;
      const clientComponent = editTriggerProvider.props.children;
      const clientProps = clientComponent.props;

      expect(clientProps.tournamentStartDate.getTime()).toBe(new Date('2024-06-15T18:00:00Z').getTime());
    });

    it('should handle no games (undefined start date)', async () => {
      mockGetAllTournamentGames.mockResolvedValue([]);

      const result = await UnifiedGamesPage({ tournamentId });
      const editTriggerProvider = result.props.children;
      const clientComponent = editTriggerProvider.props.children;
      const clientProps = clientComponent.props;

      expect(clientProps.tournamentStartDate).toBeUndefined();
    });

    it('should handle single game', async () => {
      const singleGame = [testFactories.game({ id: 'game-1', game_date: new Date('2024-06-20T18:00:00Z') })];
      mockGetAllTournamentGames.mockResolvedValue(singleGame);

      const result = await UnifiedGamesPage({ tournamentId });
      const editTriggerProvider = result.props.children;
      const clientComponent = editTriggerProvider.props.children;
      const clientProps = clientComponent.props;

      expect(clientProps.tournamentStartDate.getTime()).toBe(singleGame[0].game_date.getTime());
    });
  });

  describe('Tournament prediction completion', () => {
    it('should fetch prediction completion using tournament data', async () => {
      await UnifiedGamesPage({ tournamentId });

      expect(mockGetTournamentPredictionCompletion).toHaveBeenCalledWith(
        mockUser.id,
        tournamentId,
        mockTournament
      );
    });

    it('should handle null tournament prediction completion', async () => {
      mockGetTournamentPredictionCompletion.mockResolvedValue(null);

      const result = await UnifiedGamesPage({ tournamentId });
      const editTriggerProvider = result.props.children;
      const clientComponent = editTriggerProvider.props.children;
      const clientProps = clientComponent.props;

      expect(clientProps.tournamentPredictionCompletion).toBeNull();
    });

    it('should return null when tournament not found during completion fetch', async () => {
      // First call returns tournament (for main flow), second call returns null (for completion)
      mockFindTournamentById
        .mockResolvedValueOnce(mockTournament)
        .mockResolvedValueOnce(null);

      const result = await UnifiedGamesPage({ tournamentId });
      const editTriggerProvider = result.props.children;
      const clientComponent = editTriggerProvider.props.children;
      const clientProps = clientComponent.props;

      expect(clientProps.tournamentPredictionCompletion).toBeNull();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty game guesses array', async () => {
      mockFindGameGuessesByUserId.mockResolvedValue([]);

      const result = await UnifiedGamesPage({ tournamentId });
      const providerProps = result.props;

      expect(providerProps.gameGuesses).toEqual({});
      expect(Object.keys(providerProps.gameGuesses).length).toBe(0);
    });

    it('should handle empty closing games array', async () => {
      mockGetGamesClosingWithin48Hours.mockResolvedValue([]);

      const result = await UnifiedGamesPage({ tournamentId });
      const editTriggerProvider = result.props.children;
      const clientComponent = editTriggerProvider.props.children;
      const clientProps = clientComponent.props;

      expect(clientProps.closingGames).toEqual([]);
    });

    it('should handle tournament with null boost values', async () => {
      const tournamentWithNullBoosts = testFactories.tournament({
        id: tournamentId,
        max_silver_games: null as any,
        max_golden_games: null as any,
      });
      mockFindTournamentById.mockResolvedValue(tournamentWithNullBoosts);

      const result = await UnifiedGamesPage({ tournamentId });

      expect(result.props.tournamentMaxSilver).toBe(0);
      expect(result.props.tournamentMaxGolden).toBe(0);
    });

    it('should handle large datasets', async () => {
      const manyGames = createMany(testFactories.game, 100, (i) => ({
        id: `game-${i}`,
        tournament_id: tournamentId,
        game_number: i,
      }));

      const manyGuesses = createMany(testFactories.gameGuess, 80, (i) => ({
        id: `guess-${i}`,
        game_id: `game-${i}`,
        user_id: mockUser.id,
      }));

      mockGetAllTournamentGames.mockResolvedValue(manyGames);
      mockFindGameGuessesByUserId.mockResolvedValue(manyGuesses);

      const result = await UnifiedGamesPage({ tournamentId });
      const editTriggerProvider = result.props.children;
      const clientComponent = editTriggerProvider.props.children;
      const clientProps = clientComponent.props;

      expect(clientProps.games.length).toBe(100);
      expect(Object.keys(result.props.gameGuesses).length).toBe(80);
    });
  });

  describe('Error handling', () => {
    it('should propagate errors from getLoggedInUser', async () => {
      const error = new Error('Failed to get user');
      mockGetLoggedInUser.mockRejectedValue(error);

      await expect(UnifiedGamesPage({ tournamentId })).rejects.toThrow('Failed to get user');
    });

    it('should propagate errors from getAllTournamentGames', async () => {
      const error = new Error('Failed to fetch games');
      mockGetAllTournamentGames.mockRejectedValue(error);

      await expect(UnifiedGamesPage({ tournamentId })).rejects.toThrow('Failed to fetch games');
    });

    it('should propagate errors from findTournamentById', async () => {
      const error = new Error('Failed to fetch tournament');
      mockFindTournamentById.mockRejectedValue(error);

      await expect(UnifiedGamesPage({ tournamentId })).rejects.toThrow('Failed to fetch tournament');
    });

    it('should propagate errors from findGameGuessesByUserId', async () => {
      const error = new Error('Failed to fetch guesses');
      mockFindGameGuessesByUserId.mockRejectedValue(error);

      await expect(UnifiedGamesPage({ tournamentId })).rejects.toThrow('Failed to fetch guesses');
    });
  });
});
