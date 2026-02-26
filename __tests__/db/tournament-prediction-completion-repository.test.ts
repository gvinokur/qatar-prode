import { vi, describe, it, expect, beforeEach } from 'vitest';
import { getTournamentPredictionCompletion } from '../../app/db/tournament-prediction-completion-repository';
import { db } from '../../app/db/database';
import { testFactories } from './test-factories';
import { createMockSelectQuery } from './mock-helpers';
import * as tournamentGuessRepository from '../../app/db/tournament-guess-repository';
import * as tournamentActions from '../../app/actions/tournament-actions';
import * as qualifiedTeamsRepository from '../../app/db/qualified-teams-repository';

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

// Mock qualified teams repository
vi.mock('../../app/db/qualified-teams-repository', () => ({
  getAllUserGroupPositionsPredictions: vi.fn(),
}));

describe('Tournament Prediction Completion Repository', () => {
  const mockDb = vi.mocked(db);
  const mockFindTournamentGuess = vi.mocked(tournamentGuessRepository.findTournamentGuessByUserIdTournament);
  const mockGetTournamentStartDate = vi.mocked(tournamentActions.getTournamentStartDate);
  const mockGetAllUserGroupPositionsPredictions = vi.mocked(qualifiedTeamsRepository.getAllUserGroupPositionsPredictions);

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

      // Mock: No group position predictions
      mockGetAllUserGroupPositionsPredictions.mockResolvedValue([]);

      // Mock: Database calls in sequence
      let callCount = 0;
      mockDb.selectFrom.mockImplementation((tableName: string) => {
        callCount++;
        if (callCount === 1) {
          // Call 1: count total games (20 games in tournament)
          return createMockSelectQuery({ count: 20 }) as any;
        } else if (callCount === 2) {
          // Call 2: count completed game guesses (0 - no predictions)
          return createMockSelectQuery({ count: 0 }) as any;
        } else if (callCount === 3) {
          // Call 3: count silver boosts (0 - no predictions)
          return createMockSelectQuery({ count: 0 }) as any;
        } else if (callCount === 4) {
          // Call 4: count golden boosts (0 - no predictions)
          return createMockSelectQuery({ count: 0 }) as any;
        } else {
          // Call 5: count total first_round games (16)
          return createMockSelectQuery({ count: 16 }) as any;
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
      expect(result.qualifiers.total).toBe(32); // 16 games × 2 teams
      expect(result.overallCompleted).toBe(0);
      expect(result.overallTotal).toBe(39); // 3 + 4 + 32
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

      // Mock: 4 groups with 2 qualifying teams each (8 total qualifiers)
      mockGetAllUserGroupPositionsPredictions.mockResolvedValue([
        {
          id: 'pred-1',
          user_id: userId,
          tournament_id: tournamentId,
          group_id: 'group-a',
          team_predicted_positions: [
            { team_id: 'team-1', predicted_position: 1, predicted_to_qualify: true },
            { team_id: 'team-2', predicted_position: 2, predicted_to_qualify: true },
          ],
        },
        {
          id: 'pred-2',
          user_id: userId,
          tournament_id: tournamentId,
          group_id: 'group-b',
          team_predicted_positions: [
            { team_id: 'team-3', predicted_position: 1, predicted_to_qualify: true },
            { team_id: 'team-4', predicted_position: 2, predicted_to_qualify: true },
          ],
        },
        {
          id: 'pred-3',
          user_id: userId,
          tournament_id: tournamentId,
          group_id: 'group-c',
          team_predicted_positions: [
            { team_id: 'team-5', predicted_position: 1, predicted_to_qualify: true },
            { team_id: 'team-6', predicted_position: 2, predicted_to_qualify: true },
          ],
        },
        {
          id: 'pred-4',
          user_id: userId,
          tournament_id: tournamentId,
          group_id: 'group-d',
          team_predicted_positions: [
            { team_id: 'team-7', predicted_position: 1, predicted_to_qualify: true },
            { team_id: 'team-8', predicted_position: 2, predicted_to_qualify: true },
          ],
        },
      ] as any);

      // Mock: Database calls in sequence
      let callCount = 0;
      mockDb.selectFrom.mockImplementation((tableName: string) => {
        callCount++;
        if (callCount === 1) {
          // Call 1: count total games (20)
          return createMockSelectQuery({ count: 20 }) as any;
        } else if (callCount === 2) {
          // Call 2: count completed game guesses (10 - some predictions)
          return createMockSelectQuery({ count: 10 }) as any;
        } else if (callCount === 3) {
          // Call 3: count silver boosts (2)
          return createMockSelectQuery({ count: 2 }) as any;
        } else if (callCount === 4) {
          // Call 4: count golden boosts (1)
          return createMockSelectQuery({ count: 1 }) as any;
        } else {
          // Call 5: count total first_round games (16)
          return createMockSelectQuery({ count: 16 }) as any;
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

      expect(result.qualifiers.completed).toBe(8); // 4 complete groups × 2
      expect(result.qualifiers.total).toBe(32); // 16 games × 2 teams

      expect(result.overallCompleted).toBe(10); // 1 + 1 + 8
      expect(result.overallTotal).toBe(39); // 3 + 4 + 32
      expect(result.overallPercentage).toBe(26); // Math.round(10/39 * 100)
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

      // Mock: All 8 groups with 4 qualifying teams each (32 total qualifiers) for 100% completion
      const mockAllGroupPredictions = [];
      for (let i = 0; i < 8; i++) {
        mockAllGroupPredictions.push({
          id: `pred-${i + 1}`,
          user_id: userId,
          tournament_id: tournamentId,
          group_id: `group-${String.fromCharCode(97 + i)}`,
          team_predicted_positions: [
            { team_id: `team-${i * 4 + 1}`, predicted_position: 1, predicted_to_qualify: true },
            { team_id: `team-${i * 4 + 2}`, predicted_position: 2, predicted_to_qualify: true },
            { team_id: `team-${i * 4 + 3}`, predicted_position: 3, predicted_to_qualify: true },
            { team_id: `team-${i * 4 + 4}`, predicted_position: 4, predicted_to_qualify: true },
          ],
        });
      }
      mockGetAllUserGroupPositionsPredictions.mockResolvedValue(mockAllGroupPredictions as any);

      // Mock: Database calls in sequence
      let callCount = 0;
      mockDb.selectFrom.mockImplementation((tableName: string) => {
        callCount++;
        if (callCount === 1) {
          // Call 1: count total games (20)
          return createMockSelectQuery({ count: 20 }) as any;
        } else if (callCount === 2) {
          // Call 2: count completed game guesses (20 - all games)
          return createMockSelectQuery({ count: 20 }) as any;
        } else if (callCount === 3) {
          // Call 3: count silver boosts (10)
          return createMockSelectQuery({ count: 10 }) as any;
        } else if (callCount === 4) {
          // Call 4: count golden boosts (5)
          return createMockSelectQuery({ count: 5 }) as any;
        } else {
          // Call 5: count total first_round games (16)
          return createMockSelectQuery({ count: 16 }) as any;
        }
      });

      // Mock: Tournament started 2 days ago (not locked)
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      mockGetTournamentStartDate.mockResolvedValue(twoDaysAgo);

      const result = await getTournamentPredictionCompletion(userId, tournamentId, mockTournament);

      expect(result.finalStandings.completed).toBe(3);
      expect(result.awards.completed).toBe(4);
      expect(result.qualifiers.completed).toBe(32); // All 8 groups × 4 qualifying teams
      expect(result.qualifiers.total).toBe(32); // 16 games × 2 teams
      expect(result.overallCompleted).toBe(39); // 3 + 4 + 32
      expect(result.overallTotal).toBe(39); // 3 + 4 + 32
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

      // Mock: No group position predictions
      mockGetAllUserGroupPositionsPredictions.mockResolvedValue([]);

      // Mock: Database calls in sequence
      let callCount = 0;
      mockDb.selectFrom.mockImplementation((tableName: string) => {
        callCount++;
        if (callCount === 1) {
          // Call 1: count total games (20 games in tournament)
          return createMockSelectQuery({ count: 20 }) as any;
        } else if (callCount === 2) {
          // Call 2: count completed game guesses (0 - no predictions)
          return createMockSelectQuery({ count: 0 }) as any;
        } else if (callCount === 3) {
          // Call 3: count silver boosts (0 - no predictions)
          return createMockSelectQuery({ count: 0 }) as any;
        } else if (callCount === 4) {
          // Call 4: count golden boosts (0 - no predictions)
          return createMockSelectQuery({ count: 0 }) as any;
        } else {
          // Call 5: count total first_round games (16)
          return createMockSelectQuery({ count: 16 }) as any;
        }
      });

      // Mock: Tournament started 6 days ago (LOCKED)
      const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
      mockGetTournamentStartDate.mockResolvedValue(sixDaysAgo);

      const result = await getTournamentPredictionCompletion(userId, tournamentId, mockTournament);

      expect(result.isPredictionLocked).toBe(true);
      expect(result.overallPercentage).toBe(3); // 1/39 * 100 = 2.56... -> 3
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

      // Mock: No group position predictions
      mockGetAllUserGroupPositionsPredictions.mockResolvedValue([]);

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
        honor_roll_score: undefined,
        individual_awards_score: undefined,
        qualified_teams_score: undefined,
        group_position_score: undefined,
      };
      mockFindTournamentGuess.mockResolvedValue(mockTournamentGuess);

      // Mock: No group position predictions
      mockGetAllUserGroupPositionsPredictions.mockResolvedValue([]);

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

    // NEW TESTS FOR GAMES AND BOOSTS

    describe('Game Predictions', () => {
      it('should return 0 completed games when user has no game predictions', async () => {
        // Mock: No tournament guesses
        mockFindTournamentGuess.mockResolvedValue(undefined);

        // Mock: No group position predictions
        mockGetAllUserGroupPositionsPredictions.mockResolvedValue([]);

        // Mock database queries for games and boosts
        let callCount = 0;
        mockDb.selectFrom.mockImplementation((tableName: string) => {
          callCount++;
          if (callCount === 1) {
            // First call: count total games (10)
            return createMockSelectQuery({ count: 10 }) as any;
          } else if (callCount === 2) {
            // Second call: count completed game guesses (0 - no guesses)
            return createMockSelectQuery({ count: 0 }) as any;
          } else if (callCount === 3) {
            // Third call: count silver boosts (0)
            return createMockSelectQuery({ count: 0 }) as any;
          } else if (callCount === 4) {
            // Fourth call: count golden boosts (0)
            return createMockSelectQuery({ count: 0 }) as any;
          } else if (callCount === 5) {
            // Fifth call: count total first_round games (16)
            return createMockSelectQuery({ count: 16 }) as any;
          } else if (callCount === 6) {
            // Sixth call: count total groups (8)
            return createMockSelectQuery({ count: 8 }) as any;
          } else {
            // Seventh call: count complete groups (0)
            return createMockSelectQuery({ count: 0 }) as any;
          }
        });

        // Mock: Tournament started 2 days ago
        const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
        mockGetTournamentStartDate.mockResolvedValue(twoDaysAgo);

        const result = await getTournamentPredictionCompletion(userId, tournamentId, mockTournament);

        expect(result.completedGames).toBe(0);
        expect(result.totalGames).toBe(10);
      });

      it('should count completed games correctly when user has predictions', async () => {
        // Mock: No tournament guesses
        mockFindTournamentGuess.mockResolvedValue(undefined);

        // Mock: No group position predictions
        mockGetAllUserGroupPositionsPredictions.mockResolvedValue([]);

        // Mock database queries
        let callCount = 0;
        mockDb.selectFrom.mockImplementation((tableName: string) => {
          callCount++;
          if (callCount === 1) {
            // First call: count total games (20)
            return createMockSelectQuery({ count: 20 }) as any;
          } else if (callCount === 2) {
            // Second call: count completed game guesses (15 completed predictions)
            return createMockSelectQuery({ count: 15 }) as any;
          } else if (callCount === 3) {
            // Third call: count silver boosts (0)
            return createMockSelectQuery({ count: 0 }) as any;
          } else if (callCount === 4) {
            // Fourth call: count golden boosts (0)
            return createMockSelectQuery({ count: 0 }) as any;
          } else if (callCount === 5) {
            // Fifth call: count total first_round games (16)
            return createMockSelectQuery({ count: 16 }) as any;
          } else if (callCount === 6) {
            // Sixth call: count total groups (8)
            return createMockSelectQuery({ count: 8 }) as any;
          } else {
            // Seventh call: count complete groups (0)
            return createMockSelectQuery({ count: 0 }) as any;
          }
        });

        // Mock: Tournament started 2 days ago
        const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
        mockGetTournamentStartDate.mockResolvedValue(twoDaysAgo);

        const result = await getTournamentPredictionCompletion(userId, tournamentId, mockTournament);

        expect(result.completedGames).toBe(15);
        expect(result.totalGames).toBe(20);
      });

      it('should handle partial game predictions (only one score filled)', async () => {
        // Mock: No tournament guesses
        mockFindTournamentGuess.mockResolvedValue(undefined);

        // Mock: No group position predictions
        mockGetAllUserGroupPositionsPredictions.mockResolvedValue([]);

        // Mock database queries
        let callCount = 0;
        mockDb.selectFrom.mockImplementation((tableName: string) => {
          callCount++;
          if (callCount === 1) {
            // First call: count total games (10)
            return createMockSelectQuery({ count: 10 }) as any;
          } else if (callCount === 2) {
            // Second call: count completed game guesses (5)
            // Note: query filters for BOTH home_score AND away_score NOT NULL
            return createMockSelectQuery({ count: 5 }) as any;
          } else if (callCount === 3) {
            // Third call: count silver boosts (0)
            return createMockSelectQuery({ count: 0 }) as any;
          } else if (callCount === 4) {
            // Fourth call: count golden boosts (0)
            return createMockSelectQuery({ count: 0 }) as any;
          } else if (callCount === 5) {
            // Fifth call: count total first_round games (0)
            return createMockSelectQuery({ count: 0 }) as any;
          } else if (callCount === 6) {
            // Sixth call: count total groups (0)
            return createMockSelectQuery({ count: 0 }) as any;
          } else {
            // Seventh call: count complete groups (0)
            return createMockSelectQuery({ count: 0 }) as any;
          }
        });

        // Mock: Tournament started 2 days ago
        const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
        mockGetTournamentStartDate.mockResolvedValue(twoDaysAgo);

        const result = await getTournamentPredictionCompletion(userId, tournamentId, mockTournament);

        // Only games with BOTH scores filled are counted as completed
        expect(result.completedGames).toBe(5);
        expect(result.totalGames).toBe(10);
      });

      it('should handle tournament with no games', async () => {
        // Mock: No tournament guesses
        mockFindTournamentGuess.mockResolvedValue(undefined);

        // Mock: No group position predictions
        mockGetAllUserGroupPositionsPredictions.mockResolvedValue([]);

        // Mock database queries
        let callCount = 0;
        mockDb.selectFrom.mockImplementation((tableName: string) => {
          callCount++;
          if (callCount === 1) {
            // First call: count total games (0)
            return createMockSelectQuery({ count: 0 }) as any;
          } else if (callCount === 2) {
            // Second call: count completed game guesses (0)
            return createMockSelectQuery({ count: 0 }) as any;
          } else if (callCount === 3) {
            // Third call: count silver boosts (0)
            return createMockSelectQuery({ count: 0 }) as any;
          } else if (callCount === 4) {
            // Fourth call: count golden boosts (0)
            return createMockSelectQuery({ count: 0 }) as any;
          } else if (callCount === 5) {
            // Fifth call: count total first_round games (0)
            return createMockSelectQuery({ count: 0 }) as any;
          } else if (callCount === 6) {
            // Sixth call: count total groups (0)
            return createMockSelectQuery({ count: 0 }) as any;
          } else {
            // Seventh call: count complete groups (0)
            return createMockSelectQuery({ count: 0 }) as any;
          }
        });

        // Mock: Tournament started 2 days ago
        const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
        mockGetTournamentStartDate.mockResolvedValue(twoDaysAgo);

        const result = await getTournamentPredictionCompletion(userId, tournamentId, mockTournament);

        expect(result.completedGames).toBe(0);
        expect(result.totalGames).toBe(0);
      });
    });

    describe('Boost Tracking', () => {
      it('should return 0 boosts used when user has no game predictions', async () => {
        // Mock: No tournament guesses
        mockFindTournamentGuess.mockResolvedValue(undefined);

        // Mock: No group position predictions
        mockGetAllUserGroupPositionsPredictions.mockResolvedValue([]);

        // Mock database queries
        let callCount = 0;
        mockDb.selectFrom.mockImplementation((tableName: string) => {
          callCount++;
          if (callCount === 1) {
            // First call: count total games (10)
            return createMockSelectQuery({ count: 10 }) as any;
          } else if (callCount === 2) {
            // Second call: count completed game guesses (0)
            return createMockSelectQuery({ count: 0 }) as any;
          } else if (callCount === 3) {
            // Third call: count silver boosts (0)
            return createMockSelectQuery({ count: 0 }) as any;
          } else if (callCount === 4) {
            // Fourth call: count golden boosts (0)
            return createMockSelectQuery({ count: 0 }) as any;
          } else if (callCount === 5) {
            // Fifth call: count total first_round games (0)
            return createMockSelectQuery({ count: 0 }) as any;
          } else if (callCount === 6) {
            // Sixth call: count total groups (0)
            return createMockSelectQuery({ count: 0 }) as any;
          } else {
            // Seventh call: count complete groups (0)
            return createMockSelectQuery({ count: 0 }) as any;
          }
        });

        // Mock: Tournament started 2 days ago
        const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
        mockGetTournamentStartDate.mockResolvedValue(twoDaysAgo);

        const result = await getTournamentPredictionCompletion(userId, tournamentId, mockTournament);

        expect(result.silverBoostsUsed).toBe(0);
        expect(result.goldenBoostsUsed).toBe(0);
        expect(result.silverBoostsMax).toBe(5); // From mockTournament default
        expect(result.goldenBoostsMax).toBe(3); // From mockTournament default
      });

      it('should count silver boosts correctly', async () => {
        // Mock: No tournament guesses
        mockFindTournamentGuess.mockResolvedValue(undefined);

        // Mock: No group position predictions
        mockGetAllUserGroupPositionsPredictions.mockResolvedValue([]);

        // Mock database queries
        let callCount = 0;
        mockDb.selectFrom.mockImplementation((tableName: string) => {
          callCount++;
          if (callCount === 1) {
            // First call: count total games (10)
            return createMockSelectQuery({ count: 10 }) as any;
          } else if (callCount === 2) {
            // Second call: count completed game guesses (10)
            return createMockSelectQuery({ count: 10 }) as any;
          } else if (callCount === 3) {
            // Third call: count silver boosts (3 silver boosts used)
            return createMockSelectQuery({ count: 3 }) as any;
          } else if (callCount === 4) {
            // Fourth call: count golden boosts (0)
            return createMockSelectQuery({ count: 0 }) as any;
          } else if (callCount === 5) {
            // Fifth call: count total first_round games (0)
            return createMockSelectQuery({ count: 0 }) as any;
          } else if (callCount === 6) {
            // Sixth call: count total groups (0)
            return createMockSelectQuery({ count: 0 }) as any;
          } else {
            // Seventh call: count complete groups (0)
            return createMockSelectQuery({ count: 0 }) as any;
          }
        });

        // Mock: Tournament started 2 days ago
        const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
        mockGetTournamentStartDate.mockResolvedValue(twoDaysAgo);

        const result = await getTournamentPredictionCompletion(userId, tournamentId, mockTournament);

        expect(result.silverBoostsUsed).toBe(3);
        expect(result.goldenBoostsUsed).toBe(0);
        expect(result.silverBoostsMax).toBe(5);
        expect(result.goldenBoostsMax).toBe(3);
      });

      it('should count golden boosts correctly', async () => {
        // Mock: No tournament guesses
        mockFindTournamentGuess.mockResolvedValue(undefined);

        // Mock: No group position predictions
        mockGetAllUserGroupPositionsPredictions.mockResolvedValue([]);

        // Mock database queries
        let callCount = 0;
        mockDb.selectFrom.mockImplementation((tableName: string) => {
          callCount++;
          if (callCount === 1) {
            // First call: count total games (10)
            return createMockSelectQuery({ count: 10 }) as any;
          } else if (callCount === 2) {
            // Second call: count completed game guesses (10)
            return createMockSelectQuery({ count: 10 }) as any;
          } else if (callCount === 3) {
            // Third call: count silver boosts (0)
            return createMockSelectQuery({ count: 0 }) as any;
          } else if (callCount === 4) {
            // Fourth call: count golden boosts (2 golden boosts used)
            return createMockSelectQuery({ count: 2 }) as any;
          } else if (callCount === 5) {
            // Fifth call: count total first_round games (0)
            return createMockSelectQuery({ count: 0 }) as any;
          } else if (callCount === 6) {
            // Sixth call: count total groups (0)
            return createMockSelectQuery({ count: 0 }) as any;
          } else {
            // Seventh call: count complete groups (0)
            return createMockSelectQuery({ count: 0 }) as any;
          }
        });

        // Mock: Tournament started 2 days ago
        const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
        mockGetTournamentStartDate.mockResolvedValue(twoDaysAgo);

        const result = await getTournamentPredictionCompletion(userId, tournamentId, mockTournament);

        expect(result.silverBoostsUsed).toBe(0);
        expect(result.goldenBoostsUsed).toBe(2);
        expect(result.silverBoostsMax).toBe(5);
        expect(result.goldenBoostsMax).toBe(3);
      });

      it('should count both silver and golden boosts correctly', async () => {
        // Mock: No tournament guesses
        mockFindTournamentGuess.mockResolvedValue(undefined);

        // Mock: No group position predictions
        mockGetAllUserGroupPositionsPredictions.mockResolvedValue([]);

        // Mock database queries
        let callCount = 0;
        mockDb.selectFrom.mockImplementation((tableName: string) => {
          callCount++;
          if (callCount === 1) {
            // First call: count total games (20)
            return createMockSelectQuery({ count: 20 }) as any;
          } else if (callCount === 2) {
            // Second call: count completed game guesses (20)
            return createMockSelectQuery({ count: 20 }) as any;
          } else if (callCount === 3) {
            // Third call: count silver boosts (5 - at max)
            return createMockSelectQuery({ count: 5 }) as any;
          } else if (callCount === 4) {
            // Fourth call: count golden boosts (3 - at max)
            return createMockSelectQuery({ count: 3 }) as any;
          } else if (callCount === 5) {
            // Fifth call: count total first_round games (0)
            return createMockSelectQuery({ count: 0 }) as any;
          } else if (callCount === 6) {
            // Sixth call: count total groups (0)
            return createMockSelectQuery({ count: 0 }) as any;
          } else {
            // Seventh call: count complete groups (0)
            return createMockSelectQuery({ count: 0 }) as any;
          }
        });

        // Mock: Tournament started 2 days ago
        const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
        mockGetTournamentStartDate.mockResolvedValue(twoDaysAgo);

        const result = await getTournamentPredictionCompletion(userId, tournamentId, mockTournament);

        expect(result.silverBoostsUsed).toBe(5);
        expect(result.goldenBoostsUsed).toBe(3);
        expect(result.silverBoostsMax).toBe(5);
        expect(result.goldenBoostsMax).toBe(3);
      });

      it('should use custom tournament boost limits', async () => {
        // Create tournament with custom boost limits
        const customTournament = testFactories.tournament({
          id: tournamentId,
          max_silver_games: 10,
          max_golden_games: 7,
        });

        // Mock: No tournament guesses
        mockFindTournamentGuess.mockResolvedValue(undefined);

        // Mock: No group position predictions
        mockGetAllUserGroupPositionsPredictions.mockResolvedValue([]);

        // Mock database queries
        let callCount = 0;
        mockDb.selectFrom.mockImplementation((tableName: string) => {
          callCount++;
          if (callCount === 1) {
            // First call: count total games (10)
            return createMockSelectQuery({ count: 10 }) as any;
          } else if (callCount === 2) {
            // Second call: count completed game guesses (10)
            return createMockSelectQuery({ count: 10 }) as any;
          } else if (callCount === 3) {
            // Third call: count silver boosts (8)
            return createMockSelectQuery({ count: 8 }) as any;
          } else if (callCount === 4) {
            // Fourth call: count golden boosts (5)
            return createMockSelectQuery({ count: 5 }) as any;
          } else if (callCount === 5) {
            // Fifth call: count total first_round games (0)
            return createMockSelectQuery({ count: 0 }) as any;
          } else if (callCount === 6) {
            // Sixth call: count total groups (0)
            return createMockSelectQuery({ count: 0 }) as any;
          } else {
            // Seventh call: count complete groups (0)
            return createMockSelectQuery({ count: 0 }) as any;
          }
        });

        // Mock: Tournament started 2 days ago
        const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
        mockGetTournamentStartDate.mockResolvedValue(twoDaysAgo);

        const result = await getTournamentPredictionCompletion(userId, tournamentId, customTournament);

        expect(result.silverBoostsUsed).toBe(8);
        expect(result.goldenBoostsUsed).toBe(5);
        expect(result.silverBoostsMax).toBe(10);
        expect(result.goldenBoostsMax).toBe(7);
      });

      it('should handle tournaments with no boost limits (null values)', async () => {
        // Create tournament with null boost limits
        const noBoostTournament = testFactories.tournament({
          id: tournamentId,
          max_silver_games: null,
          max_golden_games: null,
        });

        // Mock: No tournament guesses
        mockFindTournamentGuess.mockResolvedValue(undefined);

        // Mock: No group position predictions
        mockGetAllUserGroupPositionsPredictions.mockResolvedValue([]);

        // Mock database queries
        let callCount = 0;
        mockDb.selectFrom.mockImplementation((tableName: string) => {
          callCount++;
          if (callCount === 1) {
            // First call: count total games (10)
            return createMockSelectQuery({ count: 10 }) as any;
          } else if (callCount === 2) {
            // Second call: count completed game guesses (10)
            return createMockSelectQuery({ count: 10 }) as any;
          } else if (callCount === 3) {
            // Third call: count silver boosts (0)
            return createMockSelectQuery({ count: 0 }) as any;
          } else if (callCount === 4) {
            // Fourth call: count golden boosts (0)
            return createMockSelectQuery({ count: 0 }) as any;
          } else if (callCount === 5) {
            // Fifth call: count total first_round games (0)
            return createMockSelectQuery({ count: 0 }) as any;
          } else if (callCount === 6) {
            // Sixth call: count total groups (0)
            return createMockSelectQuery({ count: 0 }) as any;
          } else {
            // Seventh call: count complete groups (0)
            return createMockSelectQuery({ count: 0 }) as any;
          }
        });

        // Mock: Tournament started 2 days ago
        const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
        mockGetTournamentStartDate.mockResolvedValue(twoDaysAgo);

        const result = await getTournamentPredictionCompletion(userId, tournamentId, noBoostTournament);

        expect(result.silverBoostsUsed).toBe(0);
        expect(result.goldenBoostsUsed).toBe(0);
        // Should default to 0 when null
        expect(result.silverBoostsMax).toBe(0);
        expect(result.goldenBoostsMax).toBe(0);
      });
    });

    describe('Integration: Games and Boosts with Full Predictions', () => {
      it('should return all fields correctly in a complete scenario', async () => {
        // Create tournament with custom limits
        const customTournament = testFactories.tournament({
          id: tournamentId,
          max_silver_games: 8,
          max_golden_games: 4,
        });

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

        // Mock: 2 groups with 2 qualifying teams each (4 total qualifiers)
        mockGetAllUserGroupPositionsPredictions.mockResolvedValue([
          {
            id: 'pred-1',
            user_id: userId,
            tournament_id: tournamentId,
            group_id: 'group-a',
            team_predicted_positions: [
              { team_id: 'team-1', predicted_position: 1, predicted_to_qualify: true },
              { team_id: 'team-2', predicted_position: 2, predicted_to_qualify: true },
            ],
          },
          {
            id: 'pred-2',
            user_id: userId,
            tournament_id: tournamentId,
            group_id: 'group-b',
            team_predicted_positions: [
              { team_id: 'team-3', predicted_position: 1, predicted_to_qualify: true },
              { team_id: 'team-4', predicted_position: 2, predicted_to_qualify: true },
            ],
          },
        ] as any);

        // Mock database queries for a complete scenario
        let callCount = 0;
        mockDb.selectFrom.mockImplementation((tableName: string) => {
          callCount++;
          if (callCount === 1) {
            // First call: count total games (48)
            return createMockSelectQuery({ count: 48 }) as any;
          } else if (callCount === 2) {
            // Second call: count completed game guesses (40)
            return createMockSelectQuery({ count: 40 }) as any;
          } else if (callCount === 3) {
            // Third call: count silver boosts (7)
            return createMockSelectQuery({ count: 7 }) as any;
          } else if (callCount === 4) {
            // Fourth call: count golden boosts (3)
            return createMockSelectQuery({ count: 3 }) as any;
          } else if (callCount === 5) {
            // Fifth call: count total first_round games (8)
            return createMockSelectQuery({ count: 8 }) as any;
          } else if (callCount === 6) {
            // Sixth call: count total groups (2)
            return createMockSelectQuery({ count: 2 }) as any;
          } else {
            // Seventh call: count complete groups (2)
            return createMockSelectQuery({ count: 2 }) as any;
          }
        });

        // Mock: Tournament started 2 days ago
        const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
        mockGetTournamentStartDate.mockResolvedValue(twoDaysAgo);

        const result = await getTournamentPredictionCompletion(userId, tournamentId, customTournament);

        // Verify game predictions
        expect(result.completedGames).toBe(40);
        expect(result.totalGames).toBe(48);

        // Verify boost tracking
        expect(result.silverBoostsUsed).toBe(7);
        expect(result.goldenBoostsUsed).toBe(3);
        expect(result.silverBoostsMax).toBe(8);
        expect(result.goldenBoostsMax).toBe(4);

        // Verify final standings
        expect(result.finalStandings.completed).toBe(3);
        expect(result.finalStandings.total).toBe(3);

        // Verify awards
        expect(result.awards.completed).toBe(4);
        expect(result.awards.total).toBe(4);

        // Verify qualifiers
        expect(result.qualifiers.completed).toBe(4);
        expect(result.qualifiers.total).toBe(16); // 8 games × 2 teams

        // Verify overall completion
        expect(result.overallCompleted).toBe(11); // 3 + 4 + 4
        expect(result.overallTotal).toBe(23); // 3 + 4 + 16
        expect(result.overallPercentage).toBe(48); // Math.round(11/23 * 100)
        expect(result.isPredictionLocked).toBe(false);
      });
    });
  });
});
