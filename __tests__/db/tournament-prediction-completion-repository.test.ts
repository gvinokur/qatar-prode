import { vi, describe, it, expect, beforeEach } from 'vitest';
import { getTournamentPredictionCompletion } from '../../app/db/tournament-prediction-completion-repository';
import { db } from '../../app/db/database';
import { testFactories } from './test-factories';
import { createMockSelectQuery } from './mock-helpers';
import * as tournamentGuessRepository from '../../app/db/tournament-guess-repository';
import * as tournamentActions from '../../app/actions/tournament-actions';

// Mock the database
vi.mock('../../app/db/database', () => ({
  db: {
    selectFrom: vi.fn(),
  },
}));

// Mock tournament guess repository
vi.mock('../../app/db/tournament-guess-repository', () => ({
  findTournamentGuessByUserIdTournament: vi.fn(),
}));

// Mock tournament actions
vi.mock('../../app/actions/tournament-actions', () => ({
  getTournamentStartDate: vi.fn(),
}));

describe('Tournament Prediction Completion Repository', () => {
  const mockDb = vi.mocked(db);
  const mockFindTournamentGuess = vi.mocked(tournamentGuessRepository.findTournamentGuessByUserIdTournament);
  const mockGetTournamentStartDate = vi.mocked(tournamentActions.getTournamentStartDate);

  const userId = 'user-1';
  const tournamentId = 'tournament-1';
  const mockTournament = testFactories.tournament({ id: tournamentId });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTournamentPredictionCompletion', () => {
    it('should return 0% completion when user has no predictions', async () => {
      // Mock: No tournament guesses
      mockFindTournamentGuess.mockResolvedValue(undefined);

      // Mock: 16 first_round games exist, but user has 0 guesses
      let callCount = 0;
      mockDb.selectFrom.mockImplementation((tableName: string) => {
        callCount++;
        if (callCount === 1) {
          // First call: count total first_round games
          return createMockSelectQuery({ count: 16 }) as any;
        } else {
          // Second call: count user's first_round guesses (0)
          return createMockSelectQuery({ count: 0 }) as any;
        }
      });

      // Mock: Tournament started 2 days ago (not locked)
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      mockGetTournamentStartDate.mockResolvedValue(twoDaysAgo);

      const result = await getTournamentPredictionCompletion(userId, tournamentId, mockTournament);

      expect(result.finalStandings.completed).toBe(0);
      expect(result.finalStandings.total).toBe(3);
      expect(result.awards.completed).toBe(0);
      expect(result.awards.total).toBe(4);
      expect(result.qualifiers.completed).toBe(0);
      expect(result.qualifiers.total).toBe(16);
      expect(result.overallCompleted).toBe(0);
      expect(result.overallTotal).toBe(23); // 3 + 4 + 16
      expect(result.overallPercentage).toBe(0);
      expect(result.isPredictionLocked).toBe(false);
    });

    it('should calculate partial completion correctly', async () => {
      // Mock: Tournament guesses with champion and best player only
      const mockTournamentGuess = {
        id: 'guess-1',
        tournament_id: tournamentId,
        user_id: userId,
        champion_team_id: 'team-1',
        runner_up_team_id: null,
        third_place_team_id: null,
        best_player_id: 'player-1',
        top_goalscorer_player_id: undefined,
        best_goalkeeper_player_id: undefined,
        best_young_player_id: undefined,
      };
      mockFindTournamentGuess.mockResolvedValue(mockTournamentGuess);

      // Mock: 16 first_round games, user predicted 8
      let callCount = 0;
      mockDb.selectFrom.mockImplementation((tableName: string) => {
        callCount++;
        if (callCount === 1) {
          // First call: count total first_round games
          return createMockSelectQuery({ count: 16 }) as any;
        } else {
          // Second call: count user's first_round guesses
          return createMockSelectQuery({ count: 8 }) as any;
        }
      });

      // Mock: Tournament started 2 days ago (not locked)
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      mockGetTournamentStartDate.mockResolvedValue(twoDaysAgo);

      const result = await getTournamentPredictionCompletion(userId, tournamentId, mockTournament);

      expect(result.finalStandings.completed).toBe(1); // Only champion
      expect(result.finalStandings.champion).toBe(true);
      expect(result.finalStandings.runnerUp).toBe(false);
      expect(result.finalStandings.thirdPlace).toBe(false);

      expect(result.awards.completed).toBe(1); // Only best player
      expect(result.awards.bestPlayer).toBe(true);
      expect(result.awards.topGoalscorer).toBe(false);
      expect(result.awards.bestGoalkeeper).toBe(false);
      expect(result.awards.bestYoungPlayer).toBe(false);

      expect(result.qualifiers.completed).toBe(8);
      expect(result.qualifiers.total).toBe(16);

      expect(result.overallCompleted).toBe(10); // 1 + 1 + 8
      expect(result.overallTotal).toBe(23); // 3 + 4 + 16
      expect(result.overallPercentage).toBe(43); // Math.round(10/23 * 100)
      expect(result.isPredictionLocked).toBe(false);
    });

    it('should return 100% completion when all predictions are made', async () => {
      // Mock: Complete tournament guesses
      const mockTournamentGuess = {
        id: 'guess-1',
        tournament_id: tournamentId,
        user_id: userId,
        champion_team_id: 'team-1',
        runner_up_team_id: 'team-2',
        third_place_team_id: 'team-3',
        best_player_id: 'player-1',
        top_goalscorer_player_id: 'player-2',
        best_goalkeeper_player_id: 'player-3',
        best_young_player_id: 'player-4',
      };
      mockFindTournamentGuess.mockResolvedValue(mockTournamentGuess);

      // Mock: 16 first_round games, user predicted all 16
      let callCount = 0;
      mockDb.selectFrom.mockImplementation((tableName: string) => {
        callCount++;
        if (callCount === 1) {
          return createMockSelectQuery({ count: 16 }) as any;
        } else {
          return createMockSelectQuery({ count: 16 }) as any;
        }
      });

      // Mock: Tournament started 2 days ago (not locked)
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      mockGetTournamentStartDate.mockResolvedValue(twoDaysAgo);

      const result = await getTournamentPredictionCompletion(userId, tournamentId, mockTournament);

      expect(result.finalStandings.completed).toBe(3);
      expect(result.awards.completed).toBe(4);
      expect(result.qualifiers.completed).toBe(16);
      expect(result.overallCompleted).toBe(23);
      expect(result.overallTotal).toBe(23);
      expect(result.overallPercentage).toBe(100);
      expect(result.isPredictionLocked).toBe(false);
    });

    it('should mark predictions as locked after 5 days', async () => {
      // Mock: Some tournament guesses
      const mockTournamentGuess = {
        id: 'guess-1',
        tournament_id: tournamentId,
        user_id: userId,
        champion_team_id: 'team-1',
        runner_up_team_id: null,
        third_place_team_id: null,
        best_player_id: undefined,
        top_goalscorer_player_id: undefined,
        best_goalkeeper_player_id: undefined,
        best_young_player_id: undefined,
      };
      mockFindTournamentGuess.mockResolvedValue(mockTournamentGuess);

      // Mock: 16 first_round games, no user guesses
      let callCount = 0;
      mockDb.selectFrom.mockImplementation((tableName: string) => {
        callCount++;
        if (callCount === 1) {
          return createMockSelectQuery({ count: 16 }) as any;
        } else {
          return createMockSelectQuery({ count: 0 }) as any;
        }
      });

      // Mock: Tournament started 6 days ago (LOCKED)
      const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
      mockGetTournamentStartDate.mockResolvedValue(sixDaysAgo);

      const result = await getTournamentPredictionCompletion(userId, tournamentId, mockTournament);

      expect(result.isPredictionLocked).toBe(true);
      expect(result.overallPercentage).toBe(4); // 1/23 * 100 = 4.3... -> 4
    });

    it('should handle tournaments with no playoff games', async () => {
      // Mock: Complete final standings and awards
      const mockTournamentGuess = {
        id: 'guess-1',
        tournament_id: tournamentId,
        user_id: userId,
        champion_team_id: 'team-1',
        runner_up_team_id: 'team-2',
        third_place_team_id: 'team-3',
        best_player_id: 'player-1',
        top_goalscorer_player_id: 'player-2',
        best_goalkeeper_player_id: 'player-3',
        best_young_player_id: 'player-4',
      };
      mockFindTournamentGuess.mockResolvedValue(mockTournamentGuess);

      // Mock: 0 first_round games (no playoffs)
      let callCount = 0;
      mockDb.selectFrom.mockImplementation((tableName: string) => {
        callCount++;
        return createMockSelectQuery({ count: 0 }) as any;
      });

      // Mock: Tournament started 2 days ago
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      mockGetTournamentStartDate.mockResolvedValue(twoDaysAgo);

      const result = await getTournamentPredictionCompletion(userId, tournamentId, mockTournament);

      expect(result.qualifiers.completed).toBe(0);
      expect(result.qualifiers.total).toBe(0);
      expect(result.overallCompleted).toBe(7); // 3 + 4 + 0
      expect(result.overallTotal).toBe(7); // 3 + 4 + 0
      expect(result.overallPercentage).toBe(100);
    });

    it('should correctly identify individual prediction statuses', async () => {
      // Mock: Mixed predictions
      const mockTournamentGuess = {
        id: 'guess-1',
        tournament_id: tournamentId,
        user_id: userId,
        champion_team_id: 'team-1',
        runner_up_team_id: 'team-2',
        third_place_team_id: null,
        best_player_id: undefined,
        top_goalscorer_player_id: 'player-2',
        best_goalkeeper_player_id: 'player-3',
        best_young_player_id: undefined,
      };
      mockFindTournamentGuess.mockResolvedValue(mockTournamentGuess);

      // Mock: Games (doesn't matter for this test)
      mockDb.selectFrom.mockReturnValue(createMockSelectQuery({ count: 0 }) as any);

      // Mock: Tournament date
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      mockGetTournamentStartDate.mockResolvedValue(twoDaysAgo);

      const result = await getTournamentPredictionCompletion(userId, tournamentId, mockTournament);

      // Final standings: champion (yes), runnerUp (yes), thirdPlace (no)
      expect(result.finalStandings.champion).toBe(true);
      expect(result.finalStandings.runnerUp).toBe(true);
      expect(result.finalStandings.thirdPlace).toBe(false);
      expect(result.finalStandings.completed).toBe(2);

      // Awards: bestPlayer (no), topGoalscorer (yes), bestGoalkeeper (yes), bestYoungPlayer (no)
      expect(result.awards.bestPlayer).toBe(false);
      expect(result.awards.topGoalscorer).toBe(true);
      expect(result.awards.bestGoalkeeper).toBe(true);
      expect(result.awards.bestYoungPlayer).toBe(false);
      expect(result.awards.completed).toBe(2);
    });
  });
});
