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
});
