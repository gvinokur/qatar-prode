import { describe, it, expect, vi, beforeEach } from 'vitest';
import { testFactories } from './test-factories';

// Mock the database
const mockDb = {
  selectFrom: vi.fn(),
};

vi.mock('../../app/db/database', () => ({
  db: mockDb,
}));

describe('Game Guess Repository - Materialized Queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getGameGuessStatisticsForUsers', () => {
    it('should fetch materialized scores from tournament_guesses', async () => {
      const { getGameGuessStatisticsForUsers } = await import('../../app/db/game-guess-repository');

      const userId1 = 'user-1';
      const userId2 = 'user-2';
      const tournamentId = 'tournament-1';

      const mockMaterializedData = [
        {
          user_id: userId1,
          total_game_score: 75,
          group_stage_game_score: 45,
          playoff_stage_game_score: 30,
          total_boost_bonus: 15,
          group_stage_boost_bonus: 9,
          playoff_stage_boost_bonus: 6,
          total_correct_guesses: 10,
          total_exact_guesses: 5,
          group_correct_guesses: 6,
          group_exact_guesses: 3,
          playoff_correct_guesses: 4,
          playoff_exact_guesses: 2,
          qualified_teams_correct: 4,
          qualified_teams_exact: 2,
          last_game_score_update_at: new Date('2024-07-14'),
        },
        {
          user_id: userId2,
          total_game_score: 85,
          group_stage_game_score: 50,
          playoff_stage_game_score: 35,
          total_boost_bonus: 17,
          group_stage_boost_bonus: 10,
          playoff_stage_boost_bonus: 7,
          total_correct_guesses: 12,
          total_exact_guesses: 6,
          group_correct_guesses: 7,
          group_exact_guesses: 3,
          playoff_correct_guesses: 5,
          playoff_exact_guesses: 3,
          qualified_teams_correct: 6,
          qualified_teams_exact: 3,
          last_game_score_update_at: new Date('2024-07-14'),
        },
      ];

      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue(mockMaterializedData),
      };

      mockDb.selectFrom.mockReturnValue(mockQuery);

      const result = await getGameGuessStatisticsForUsers([userId1, userId2], tournamentId);

      expect(mockDb.selectFrom).toHaveBeenCalledWith('tournament_guesses');
      expect(mockQuery.where).toHaveBeenCalledWith('user_id', 'in', [userId1, userId2]);
      expect(mockQuery.where).toHaveBeenCalledWith('tournament_id', '=', tournamentId);
      expect(result).toHaveLength(2);
      expect(result[0].user_id).toBe(userId1);
      expect(result[0].total_game_score).toBe(75);
      expect(result[0].qualified_teams_correct).toBe(4);
      expect(result[0].qualified_teams_exact).toBe(2);
      expect(result[1].user_id).toBe(userId2);
      expect(result[1].total_game_score).toBe(85);
      expect(result[1].qualified_teams_correct).toBe(6);
      expect(result[1].qualified_teams_exact).toBe(3);
    });

    it('should return empty array when no users found', async () => {
      const { getGameGuessStatisticsForUsers } = await import('../../app/db/game-guess-repository');

      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue([]),
      };

      mockDb.selectFrom.mockReturnValue(mockQuery);

      const result = await getGameGuessStatisticsForUsers(['user-nonexistent'], 'tournament-1');

      expect(result).toEqual([]);
    });

    it('should return null for qualified_teams_correct and qualified_teams_exact when row has null values (pre-qualified-teams tournament)', async () => {
      const { getGameGuessStatisticsForUsers } = await import('../../app/db/game-guess-repository');

      const userId = 'user-legacy';
      const tournamentId = 'tournament-legacy';

      const mockMaterializedData = [{
        user_id: userId,
        total_game_score: 40,
        group_stage_game_score: 25,
        playoff_stage_game_score: 15,
        total_boost_bonus: 5,
        group_stage_boost_bonus: 3,
        playoff_stage_boost_bonus: 2,
        total_correct_guesses: 6,
        total_exact_guesses: 2,
        group_correct_guesses: 4,
        group_exact_guesses: 1,
        playoff_correct_guesses: 2,
        playoff_exact_guesses: 1,
        qualified_teams_correct: null,
        qualified_teams_exact: null,
      }];

      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue(mockMaterializedData),
      };

      mockDb.selectFrom.mockReturnValue(mockQuery);

      const result = await getGameGuessStatisticsForUsers([userId], tournamentId);

      expect(result).toHaveLength(1);
      expect(result[0].qualified_teams_correct).toBeNull();
      expect(result[0].qualified_teams_exact).toBeNull();
    });

    it('should return empty array when called with empty userIds', async () => {
      const { getGameGuessStatisticsForUsers } = await import('../../app/db/game-guess-repository');

      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue([]),
      };

      mockDb.selectFrom.mockReturnValue(mockQuery);

      const result = await getGameGuessStatisticsForUsers([], 'tournament-1');

      expect(result).toEqual([]);
    });

    it('should handle single user query', async () => {
      const { getGameGuessStatisticsForUsers } = await import('../../app/db/game-guess-repository');

      const userId = 'user-single';
      const tournamentId = 'tournament-1';

      const mockMaterializedData = [{
        user_id: userId,
        total_game_score: 50,
        group_stage_game_score: 30,
        playoff_stage_game_score: 20,
        total_boost_bonus: 10,
        group_stage_boost_bonus: 6,
        playoff_stage_boost_bonus: 4,
        total_correct_guesses: 8,
        total_exact_guesses: 4,
        group_correct_guesses: 5,
        group_exact_guesses: 2,
        playoff_correct_guesses: 3,
        playoff_exact_guesses: 2,
        last_game_score_update_at: new Date('2024-07-14'),
      }];

      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue(mockMaterializedData),
      };

      mockDb.selectFrom.mockReturnValue(mockQuery);

      const result = await getGameGuessStatisticsForUsers([userId], tournamentId);

      expect(result).toHaveLength(1);
      expect(result[0].user_id).toBe(userId);
    });
  });
});
