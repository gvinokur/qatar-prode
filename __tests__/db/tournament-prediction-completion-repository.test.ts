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

      // Mock: 16 first_round games, 8 groups, 0 complete groups
      let callCount = 0;
      mockDb.selectFrom.mockImplementation((tableName: string) => {
        callCount++;
        if (callCount === 1) {
          // First call: count total first_round games (16)
          return createMockSelectQuery({ count: 16 }) as any;
        } else if (callCount === 2) {
          // Second call: count total groups (8)
          return createMockSelectQuery({ count: 8 }) as any;
        } else {
          // Third call: count complete groups (0)
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

      // Mock: 16 first_round games, 8 total groups, 4 complete groups
      let callCount = 0;
      mockDb.selectFrom.mockImplementation((tableName: string) => {
        callCount++;
        if (callCount === 1) {
          // First call: count total first_round games (16)
          return createMockSelectQuery({ count: 16 }) as any;
        } else if (callCount === 2) {
          // Second call: count total groups (8)
          return createMockSelectQuery({ count: 8 }) as any;
        } else {
          // Third call: count complete groups (4)
          return createMockSelectQuery({ count: 4 }) as any;
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

      // Mock: 16 first_round games, 8 total groups, all 8 complete
      let callCount = 0;
      mockDb.selectFrom.mockImplementation((tableName: string) => {
        callCount++;
        if (callCount === 1) {
          // First call: count total first_round games (16)
          return createMockSelectQuery({ count: 16 }) as any;
        } else if (callCount === 2) {
          // Second call: count total groups (8)
          return createMockSelectQuery({ count: 8 }) as any;
        } else {
          // Third call: count complete groups (8 - all complete!)
          return createMockSelectQuery({ count: 8 }) as any;
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

      // Mock: 16 first_round games, 8 groups, 0 complete groups
      let callCount = 0;
      mockDb.selectFrom.mockImplementation((tableName: string) => {
        callCount++;
        if (callCount === 1) {
          // First call: count total first_round games (16)
          return createMockSelectQuery({ count: 16 }) as any;
        } else if (callCount === 2) {
          // Second call: count total groups (8)
          return createMockSelectQuery({ count: 8 }) as any;
        } else {
          // Third call: count complete groups (0)
          return createMockSelectQuery({ count: 0 }) as any;
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
  });
});
