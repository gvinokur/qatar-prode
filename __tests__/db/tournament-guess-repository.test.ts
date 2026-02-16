import { describe, it, expect, vi, beforeEach } from 'vitest';
import { testFactories } from './test-factories';

// Mock the database and dependencies
const mockDb = {
  selectFrom: vi.fn(),
  updateTable: vi.fn(),
  insertInto: vi.fn(),
};

const mockLegacyGetGameGuessStatisticsForUsers = vi.fn();
const mockFindTournamentGuessByUserIdTournament = vi.fn();
const mockCreateTournamentGuess = vi.fn();
const mockUpdateTournamentGuessByUserIdTournament = vi.fn();

vi.mock('../../app/db/database', () => ({
  db: mockDb,
}));

vi.mock('../../app/db/game-guess-repository', () => ({
  legacyGetGameGuessStatisticsForUsers: mockLegacyGetGameGuessStatisticsForUsers,
}));

describe('Tournament Guess Repository - Materialization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('recalculateGameScoresForUsers', () => {
    it('should return empty array when userIds is empty', async () => {
      // Import after mocks are set up
      const { recalculateGameScoresForUsers } = await import('../../app/db/tournament-guess-repository');

      const result = await recalculateGameScoresForUsers([], 'tournament-1');

      expect(result).toEqual([]);
      expect(mockLegacyGetGameGuessStatisticsForUsers).not.toHaveBeenCalled();
    });

    it('should materialize scores for users with existing tournament_guesses', async () => {
      const { recalculateGameScoresForUsers, findTournamentGuessByUserIdTournament, updateTournamentGuessByUserIdTournament } = await import('../../app/db/tournament-guess-repository');

      const userId = 'user-1';
      const tournamentId = 'tournament-1';

      // Mock legacy stats
      const mockStats = [{
        user_id: userId,
        total_score: 75,
        group_score: 45,
        playoff_score: 30,
        total_boost_bonus: 15,
        group_boost_bonus: 9,
        playoff_boost_bonus: 6,
        total_correct_guesses: 10,
        total_exact_guesses: 5,
        group_correct_guesses: 6,
        group_exact_guesses: 3,
        playoff_correct_guesses: 4,
        playoff_exact_guesses: 2,
        yesterday_total_score: 60,
        yesterday_boost_bonus: 12,
        last_game_date: new Date('2024-07-14'),
      }];

      mockLegacyGetGameGuessStatisticsForUsers.mockResolvedValue(mockStats);

      // Mock existing guess
      const existingGuess = testFactories.tournamentGuess({
        user_id: userId,
        tournament_id: tournamentId,
      });

      const mockUpdateQuery = {
        where: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        returningAll: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue({ ...existingGuess, total_game_score: 75 }),
      };

      const mockSelectQuery = {
        selectAll: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(existingGuess),
      };

      mockDb.selectFrom.mockReturnValue(mockSelectQuery);
      mockDb.updateTable.mockReturnValue(mockUpdateQuery);

      const result = await recalculateGameScoresForUsers([userId], tournamentId);

      expect(mockLegacyGetGameGuessStatisticsForUsers).toHaveBeenCalledWith([userId], tournamentId);
      expect(result).toHaveLength(1);
    });

    it('should handle users without stats (0 game guesses)', async () => {
      const { recalculateGameScoresForUsers } = await import('../../app/db/tournament-guess-repository');

      const userId = 'user-no-guesses';
      const tournamentId = 'tournament-1';

      // No stats for this user
      mockLegacyGetGameGuessStatisticsForUsers.mockResolvedValue([]);

      const existingGuess = testFactories.tournamentGuess({ user_id: userId, tournament_id: tournamentId });

      const mockSelectQuery = {
        selectAll: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(existingGuess),
      };

      const mockUpdateQuery = {
        where: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        returningAll: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue({ ...existingGuess, total_game_score: 0 }),
      };

      mockDb.selectFrom.mockReturnValue(mockSelectQuery);
      mockDb.updateTable.mockReturnValue(mockUpdateQuery);

      const result = await recalculateGameScoresForUsers([userId], tournamentId);

      expect(result).toHaveLength(1);
      expect(mockUpdateQuery.set).toHaveBeenCalledWith(
        expect.objectContaining({
          total_game_score: 0,
          total_boost_bonus: 0,
        })
      );
    });

    it('should create tournament_guesses row for user without one', async () => {
      const { recalculateGameScoresForUsers } = await import('../../app/db/tournament-guess-repository');

      const userId = 'user-new';
      const tournamentId = 'tournament-1';

      const mockStats = [{
        user_id: userId,
        total_score: 50,
        group_score: 30,
        playoff_score: 20,
        total_boost_bonus: 10,
        group_boost_bonus: 6,
        playoff_boost_bonus: 4,
        total_correct_guesses: 8,
        total_exact_guesses: 4,
        group_correct_guesses: 5,
        group_exact_guesses: 2,
        playoff_correct_guesses: 3,
        playoff_exact_guesses: 2,
        yesterday_total_score: 40,
        yesterday_boost_bonus: 8,
        last_game_date: new Date('2024-07-15'),
      }];

      mockLegacyGetGameGuessStatisticsForUsers.mockResolvedValue(mockStats);

      // No existing tournament_guesses row
      const mockSelectQuery = {
        selectAll: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(undefined),
      };

      const newGuess = testFactories.tournamentGuess({ user_id: userId, tournament_id: tournamentId });

      const mockInsertQuery = {
        values: vi.fn().mockReturnThis(),
        returningAll: vi.fn().mockReturnThis(),
        executeTakeFirstOrThrow: vi.fn().mockResolvedValue(newGuess),
      };

      const mockUpdateQuery = {
        where: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        returningAll: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue({ ...newGuess, total_game_score: 50 }),
      };

      mockDb.selectFrom.mockReturnValue(mockSelectQuery);
      mockDb.insertInto.mockReturnValue(mockInsertQuery);
      mockDb.updateTable.mockReturnValue(mockUpdateQuery);

      const result = await recalculateGameScoresForUsers([userId], tournamentId);

      expect(mockInsertQuery.values).toHaveBeenCalledWith({
        user_id: userId,
        tournament_id: tournamentId,
      });
      expect(result).toHaveLength(1);
    });

    it('should handle creation failure gracefully', async () => {
      const { recalculateGameScoresForUsers } = await import('../../app/db/tournament-guess-repository');

      const userId = 'user-fail';
      const tournamentId = 'tournament-1';

      mockLegacyGetGameGuessStatisticsForUsers.mockResolvedValue([{
        user_id: userId,
        total_score: 50,
        group_score: 30,
        playoff_score: 20,
        total_boost_bonus: 10,
        group_boost_bonus: 6,
        playoff_boost_bonus: 4,
        total_correct_guesses: 8,
        total_exact_guesses: 4,
        group_correct_guesses: 5,
        group_exact_guesses: 2,
        playoff_correct_guesses: 3,
        playoff_exact_guesses: 2,
        yesterday_total_score: 40,
        yesterday_boost_bonus: 8,
        last_game_date: new Date('2024-07-15'),
      }]);

      const mockSelectQuery = {
        selectAll: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(undefined),
      };

      const mockInsertQuery = {
        values: vi.fn().mockReturnThis(),
        returningAll: vi.fn().mockReturnThis(),
        executeTakeFirstOrThrow: vi.fn().mockRejectedValue(new Error('Constraint violation')),
      };

      mockDb.selectFrom.mockReturnValue(mockSelectQuery);
      mockDb.insertInto.mockReturnValue(mockInsertQuery);

      const result = await recalculateGameScoresForUsers([userId], tournamentId);

      // Should skip user and return empty array
      expect(result).toHaveLength(0);
    });

    it('should process multiple users sequentially', async () => {
      const { recalculateGameScoresForUsers } = await import('../../app/db/tournament-guess-repository');

      const user1 = 'user-1';
      const user2 = 'user-2';
      const tournamentId = 'tournament-1';

      const mockStats = [
        {
          user_id: user1,
          total_score: 75,
          group_score: 45,
          playoff_score: 30,
          total_boost_bonus: 15,
          group_boost_bonus: 9,
          playoff_boost_bonus: 6,
          total_correct_guesses: 10,
          total_exact_guesses: 5,
          group_correct_guesses: 6,
          group_exact_guesses: 3,
          playoff_correct_guesses: 4,
          playoff_exact_guesses: 2,
          yesterday_total_score: 60,
          yesterday_boost_bonus: 12,
          last_game_date: new Date('2024-07-14'),
        },
        {
          user_id: user2,
          total_score: 85,
          group_score: 50,
          playoff_score: 35,
          total_boost_bonus: 17,
          group_boost_bonus: 10,
          playoff_boost_bonus: 7,
          total_correct_guesses: 12,
          total_exact_guesses: 6,
          group_correct_guesses: 7,
          group_exact_guesses: 3,
          playoff_correct_guesses: 5,
          playoff_exact_guesses: 3,
          yesterday_total_score: 70,
          yesterday_boost_bonus: 14,
          last_game_date: new Date('2024-07-14'),
        },
      ];

      mockLegacyGetGameGuessStatisticsForUsers.mockResolvedValue(mockStats);

      const guess1 = testFactories.tournamentGuess({ user_id: user1, tournament_id: tournamentId });
      const guess2 = testFactories.tournamentGuess({ user_id: user2, tournament_id: tournamentId });

      const mockSelectQuery = {
        selectAll: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn()
          .mockResolvedValueOnce(guess1)
          .mockResolvedValueOnce(guess2),
      };

      const mockUpdateQuery = {
        where: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        returningAll: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn()
          .mockResolvedValueOnce({ ...guess1, total_game_score: 75 })
          .mockResolvedValueOnce({ ...guess2, total_game_score: 85 }),
      };

      mockDb.selectFrom.mockReturnValue(mockSelectQuery);
      mockDb.updateTable.mockReturnValue(mockUpdateQuery);

      const result = await recalculateGameScoresForUsers([user1, user2], tournamentId);

      expect(result).toHaveLength(2);
      expect(mockLegacyGetGameGuessStatisticsForUsers).toHaveBeenCalledWith([user1, user2], tournamentId);
    });

    it('should handle partial stats with null values', async () => {
      const { recalculateGameScoresForUsers } = await import('../../app/db/tournament-guess-repository');

      const userId = 'user-partial';
      const tournamentId = 'tournament-1';

      // Stats with some null/undefined fields
      const mockStats = [{
        user_id: userId,
        total_score: 50,
        group_score: null,
        playoff_score: 50,
        total_boost_bonus: undefined,
        group_boost_bonus: 0,
        playoff_boost_bonus: 10,
        total_correct_guesses: 5,
        total_exact_guesses: null,
        group_correct_guesses: undefined,
        group_exact_guesses: 0,
        playoff_correct_guesses: 5,
        playoff_exact_guesses: 2,
        yesterday_total_score: null,
        yesterday_boost_bonus: undefined,
        last_game_date: new Date('2024-07-14'),
      }];

      mockLegacyGetGameGuessStatisticsForUsers.mockResolvedValue(mockStats);

      const existingGuess = testFactories.tournamentGuess({ user_id: userId, tournament_id: tournamentId });

      const mockSelectQuery = {
        selectAll: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(existingGuess),
      };

      const mockUpdateQuery = {
        where: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        returningAll: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue({ ...existingGuess, total_game_score: 50 }),
      };

      mockDb.selectFrom.mockReturnValue(mockSelectQuery);
      mockDb.updateTable.mockReturnValue(mockUpdateQuery);

      const result = await recalculateGameScoresForUsers([userId], tournamentId);

      expect(result).toHaveLength(1);
      // Verify null/undefined values are converted to 0
      expect(mockUpdateQuery.set).toHaveBeenCalledWith(
        expect.objectContaining({
          total_game_score: 50,
          group_stage_game_score: 0,  // null becomes 0
          total_boost_bonus: 0,  // undefined becomes 0
          total_exact_guesses: 0,  // null becomes 0
          yesterday_total_game_score: 0,  // null becomes 0
          yesterday_boost_bonus: 0,  // undefined becomes 0
        })
      );
    });
  });

  describe('updateOrCreateTournamentGuess - Bug #164 Fix', () => {
    it('should preserve score fields when updating award guesses', async () => {
      const { updateOrCreateTournamentGuess } = await import('../../app/db/tournament-guess-repository');

      const userId = 'user-1';
      const tournamentId = 'tournament-1';

      // Existing guess with score fields
      const existingGuess = testFactories.tournamentGuess({
        user_id: userId,
        tournament_id: tournamentId,
        best_player_id: 'player-1',
        top_goalscorer_player_id: 'player-2',
        individual_awards_score: 6,
        honor_roll_score: 8,
        qualified_teams_score: 10,
      });

      // Mock findTournamentGuessByUserIdTournament to return existing guess
      const mockSelectQuery = {
        selectAll: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(existingGuess),
      };

      // Mock updateTournamentGuess (UPDATE operation)
      const mockUpdateQuery = {
        where: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        returningAll: vi.fn().mockReturnThis(),
        executeTakeFirstOrThrow: vi.fn().mockResolvedValue({
          ...existingGuess,
          best_player_id: 'player-3', // Only this field changes
        }),
      };

      mockDb.selectFrom.mockReturnValue(mockSelectQuery);
      mockDb.updateTable.mockReturnValue(mockUpdateQuery);

      // Update only best_player_id
      const result = await updateOrCreateTournamentGuess({
        user_id: userId,
        tournament_id: tournamentId,
        best_player_id: 'player-3', // Only updating this field
      });

      // Verify UPDATE was called (not DELETE+CREATE)
      expect(mockDb.updateTable).toHaveBeenCalledWith('tournament_guesses');
      expect(mockUpdateQuery.set).toHaveBeenCalledWith({
        user_id: userId,
        tournament_id: tournamentId,
        best_player_id: 'player-3',
      });

      // Verify result has all fields preserved
      expect(result).toEqual(
        expect.objectContaining({
          best_player_id: 'player-3', // Updated
          top_goalscorer_player_id: 'player-2', // Preserved
          individual_awards_score: 6, // Preserved
          honor_roll_score: 8, // Preserved
          qualified_teams_score: 10, // Preserved
        })
      );
    });

    it('should preserve materialized game scores (story-147 fields)', async () => {
      const { updateOrCreateTournamentGuess } = await import('../../app/db/tournament-guess-repository');

      const userId = 'user-1';
      const tournamentId = 'tournament-1';

      // Existing guess with materialized game scores
      const existingGuess = testFactories.tournamentGuess({
        user_id: userId,
        tournament_id: tournamentId,
        best_player_id: 'player-1',
        total_game_score: 150,
        group_stage_game_score: 90,
        playoff_stage_game_score: 60,
        total_boost_bonus: 30,
        group_stage_boost_bonus: 18,
        playoff_stage_boost_bonus: 12,
        total_correct_guesses: 20,
        total_exact_guesses: 10,
      });

      const mockSelectQuery = {
        selectAll: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(existingGuess),
      };

      const mockUpdateQuery = {
        where: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        returningAll: vi.fn().mockReturnThis(),
        executeTakeFirstOrThrow: vi.fn().mockResolvedValue({
          ...existingGuess,
          best_goalkeeper_player_id: 'player-4',
        }),
      };

      mockDb.selectFrom.mockReturnValue(mockSelectQuery);
      mockDb.updateTable.mockReturnValue(mockUpdateQuery);

      // Update award guess
      const result = await updateOrCreateTournamentGuess({
        user_id: userId,
        tournament_id: tournamentId,
        best_goalkeeper_player_id: 'player-4',
      });

      // Verify all materialized fields preserved
      expect(result).toEqual(
        expect.objectContaining({
          total_game_score: 150, // Preserved
          group_stage_game_score: 90, // Preserved
          playoff_stage_game_score: 60, // Preserved
          total_boost_bonus: 30, // Preserved
          group_stage_boost_bonus: 18, // Preserved
          playoff_stage_boost_bonus: 12, // Preserved
          total_correct_guesses: 20, // Preserved
          total_exact_guesses: 10, // Preserved
        })
      );
    });

    it('should preserve snapshot fields for rank tracking', async () => {
      const { updateOrCreateTournamentGuess } = await import('../../app/db/tournament-guess-repository');

      const userId = 'user-1';
      const tournamentId = 'tournament-1';

      const existingGuess = testFactories.tournamentGuess({
        user_id: userId,
        tournament_id: tournamentId,
        champion_team_id: 'team-1',
        yesterday_tournament_score: 140,
        yesterday_total_game_score: 130,
        yesterday_boost_bonus: 25,
        last_score_update_date: 20260214,
        last_game_score_update_at: new Date('2024-07-14'),
      });

      const mockSelectQuery = {
        selectAll: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(existingGuess),
      };

      const mockUpdateQuery = {
        where: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        returningAll: vi.fn().mockReturnThis(),
        executeTakeFirstOrThrow: vi.fn().mockResolvedValue({
          ...existingGuess,
          runner_up_team_id: 'team-2',
        }),
      };

      mockDb.selectFrom.mockReturnValue(mockSelectQuery);
      mockDb.updateTable.mockReturnValue(mockUpdateQuery);

      // Update honor roll guess
      const result = await updateOrCreateTournamentGuess({
        user_id: userId,
        tournament_id: tournamentId,
        runner_up_team_id: 'team-2',
      });

      // Verify all snapshot fields preserved
      expect(result).toEqual(
        expect.objectContaining({
          yesterday_tournament_score: 140, // Preserved
          yesterday_total_game_score: 130, // Preserved
          yesterday_boost_bonus: 25, // Preserved
          last_score_update_date: 20260214, // Preserved
          last_game_score_update_at: new Date('2024-07-14'), // Preserved
        })
      );
    });

    it('should preserve other award guesses when updating one award', async () => {
      const { updateOrCreateTournamentGuess } = await import('../../app/db/tournament-guess-repository');

      const userId = 'user-1';
      const tournamentId = 'tournament-1';

      // Multiple awards already set
      const existingGuess = testFactories.tournamentGuess({
        user_id: userId,
        tournament_id: tournamentId,
        best_player_id: 'player-1',
        top_goalscorer_player_id: 'player-2',
        best_goalkeeper_player_id: 'player-3',
        best_young_player_id: 'player-4',
      });

      const mockSelectQuery = {
        selectAll: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(existingGuess),
      };

      const mockUpdateQuery = {
        where: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        returningAll: vi.fn().mockReturnThis(),
        executeTakeFirstOrThrow: vi.fn().mockResolvedValue({
          ...existingGuess,
          best_player_id: 'player-99',
        }),
      };

      mockDb.selectFrom.mockReturnValue(mockSelectQuery);
      mockDb.updateTable.mockReturnValue(mockUpdateQuery);

      // Update only best_player_id
      const result = await updateOrCreateTournamentGuess({
        user_id: userId,
        tournament_id: tournamentId,
        best_player_id: 'player-99',
      });

      // Verify all other awards preserved
      expect(result).toEqual(
        expect.objectContaining({
          best_player_id: 'player-99', // Updated
          top_goalscorer_player_id: 'player-2', // Preserved
          best_goalkeeper_player_id: 'player-3', // Preserved
          best_young_player_id: 'player-4', // Preserved
        })
      );
    });

    it('should create new record when none exists', async () => {
      const { updateOrCreateTournamentGuess } = await import('../../app/db/tournament-guess-repository');

      const userId = 'user-new';
      const tournamentId = 'tournament-1';

      // No existing guess
      const mockSelectQuery = {
        selectAll: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(undefined),
      };

      const newGuess = testFactories.tournamentGuess({
        user_id: userId,
        tournament_id: tournamentId,
        best_player_id: 'player-1',
      });

      const mockInsertQuery = {
        values: vi.fn().mockReturnThis(),
        returningAll: vi.fn().mockReturnThis(),
        executeTakeFirstOrThrow: vi.fn().mockResolvedValue(newGuess),
      };

      mockDb.selectFrom.mockReturnValue(mockSelectQuery);
      mockDb.insertInto.mockReturnValue(mockInsertQuery);

      // Create first guess
      const result = await updateOrCreateTournamentGuess({
        user_id: userId,
        tournament_id: tournamentId,
        best_player_id: 'player-1',
      });

      // Verify INSERT was called (not UPDATE)
      expect(mockDb.insertInto).toHaveBeenCalledWith('tournament_guesses');
      expect(mockInsertQuery.values).toHaveBeenCalledWith({
        user_id: userId,
        tournament_id: tournamentId,
        best_player_id: 'player-1',
      });

      expect(result).toEqual(
        expect.objectContaining({
          user_id: userId,
          tournament_id: tournamentId,
          best_player_id: 'player-1',
        })
      );
    });

    it('should update multiple fields in single call while preserving others', async () => {
      const { updateOrCreateTournamentGuess } = await import('../../app/db/tournament-guess-repository');

      const userId = 'user-1';
      const tournamentId = 'tournament-1';

      const existingGuess = testFactories.tournamentGuess({
        user_id: userId,
        tournament_id: tournamentId,
        best_player_id: 'player-1',
        champion_team_id: 'team-1',
        individual_awards_score: 3,
        honor_roll_score: 5,
        total_game_score: 100,
      });

      const mockSelectQuery = {
        selectAll: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(existingGuess),
      };

      const mockUpdateQuery = {
        where: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        returningAll: vi.fn().mockReturnThis(),
        executeTakeFirstOrThrow: vi.fn().mockResolvedValue({
          ...existingGuess,
          best_player_id: 'player-2',
          top_goalscorer_player_id: 'player-3',
        }),
      };

      mockDb.selectFrom.mockReturnValue(mockSelectQuery);
      mockDb.updateTable.mockReturnValue(mockUpdateQuery);

      // Update multiple awards at once
      const result = await updateOrCreateTournamentGuess({
        user_id: userId,
        tournament_id: tournamentId,
        best_player_id: 'player-2',
        top_goalscorer_player_id: 'player-3',
      });

      // Verify UPDATE with multiple fields
      expect(mockUpdateQuery.set).toHaveBeenCalledWith({
        user_id: userId,
        tournament_id: tournamentId,
        best_player_id: 'player-2',
        top_goalscorer_player_id: 'player-3',
      });

      // Verify other fields preserved
      expect(result).toEqual(
        expect.objectContaining({
          best_player_id: 'player-2', // Updated
          top_goalscorer_player_id: 'player-3', // Updated
          champion_team_id: 'team-1', // Preserved
          individual_awards_score: 3, // Preserved
          honor_roll_score: 5, // Preserved
          total_game_score: 100, // Preserved
        })
      );
    });

    it('should handle null values without corrupting other fields', async () => {
      const { updateOrCreateTournamentGuess } = await import('../../app/db/tournament-guess-repository');

      const userId = 'user-1';
      const tournamentId = 'tournament-1';

      const existingGuess = testFactories.tournamentGuess({
        user_id: userId,
        tournament_id: tournamentId,
        best_player_id: 'player-1',
        top_goalscorer_player_id: 'player-2',
        individual_awards_score: 6,
      });

      const mockSelectQuery = {
        selectAll: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(existingGuess),
      };

      const mockUpdateQuery = {
        where: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        returningAll: vi.fn().mockReturnThis(),
        executeTakeFirstOrThrow: vi.fn().mockResolvedValue({
          ...existingGuess,
          best_player_id: null,
        }),
      };

      mockDb.selectFrom.mockReturnValue(mockSelectQuery);
      mockDb.updateTable.mockReturnValue(mockUpdateQuery);

      // Clear best_player_id (set to null)
      const result = await updateOrCreateTournamentGuess({
        user_id: userId,
        tournament_id: tournamentId,
        best_player_id: null,
      });

      // Verify null update doesn't corrupt other fields
      expect(result).toEqual(
        expect.objectContaining({
          best_player_id: null, // Set to null
          top_goalscorer_player_id: 'player-2', // Preserved
          individual_awards_score: 6, // Preserved
        })
      );
    });
  });
});
