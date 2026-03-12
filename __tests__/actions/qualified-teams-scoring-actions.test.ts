import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calculateAndStoreQualifiedTeamsScores,
  calculateUserQualifiedTeamsScore,
  triggerQualifiedTeamsScoringAction,
} from '../../app/actions/qualified-teams-scoring-actions';
import { testFactories } from '../db/test-factories';
import { createMockSelectQuery, createMockUpdateQuery } from '../db/mock-helpers';

// Mock dependencies
vi.mock('../../app/utils/qualified-teams-scoring', () => ({
  calculateQualifiedTeamsScore: vi.fn(),
}));

vi.mock('../../app/actions/user-actions', () => ({
  getLoggedInUser: vi.fn(),
}));

vi.mock('../../app/db/tournament-repository', () => ({
  findTournamentById: vi.fn(),
}));

vi.mock('../../app/db/database', () => ({
  db: {
    selectFrom: vi.fn(),
    updateTable: vi.fn(),
    insertInto: vi.fn(),
    transaction: vi.fn(),
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('../../app/db/score-history-repository', () => ({
  writeScoreSnapshot: vi.fn(),
}));

vi.mock('../../app/utils/date-utils', () => ({
  getTodayYYYYMMDD: vi.fn().mockReturnValue(20260312),
}));

// Import mocked modules
import { calculateQualifiedTeamsScore } from '../../app/utils/qualified-teams-scoring';
import { getLoggedInUser } from '../../app/actions/user-actions';
import { findTournamentById } from '../../app/db/tournament-repository';
import { db } from '../../app/db/database';
import { revalidatePath } from 'next/cache';
import { writeScoreSnapshot } from '../../app/db/score-history-repository';

const mockCalculateQualifiedTeamsScore = vi.mocked(calculateQualifiedTeamsScore);
const mockGetLoggedInUser = vi.mocked(getLoggedInUser);
const mockFindTournamentById = vi.mocked(findTournamentById);
const mockDb = vi.mocked(db);
const mockRevalidatePath = vi.mocked(revalidatePath);
const mockWriteScoreSnapshot = vi.mocked(writeScoreSnapshot);

describe('qualified-teams-scoring-actions', () => {
  const tournamentId = 'tournament-1';
  const userId1 = 'user-1';
  const userId2 = 'user-2';

  const tournament = testFactories.tournament({
    id: tournamentId,
    qualified_team_points: 2,
    exact_position_qualified_points: 1,
  });

  const user = testFactories.user({ id: userId1 });

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mocks
    mockFindTournamentById.mockResolvedValue(tournament);
  });

  describe('calculateAndStoreQualifiedTeamsScores', () => {
    it('should successfully calculate and store scores for all users', async () => {
      // Mock users with predictions
      const mockUsersQuery = createMockSelectQuery([
        { user_id: userId1 },
        { user_id: userId2 },
      ]);

      mockDb.selectFrom.mockReturnValue(mockUsersQuery as any);

      // Mock scoring calculation results
      mockCalculateQualifiedTeamsScore
        .mockResolvedValueOnce({
          userId: userId1,
          tournamentId,
          totalScore: 5,
          breakdown: [],
        })
        .mockResolvedValueOnce({
          userId: userId2,
          tournamentId,
          totalScore: 8,
          breakdown: [],
        });

      // Mock clear scores update
      const mockClearQuery = createMockUpdateQuery({ qualified_teams_score: 0 });
      mockDb.updateTable.mockReturnValue(mockClearQuery as any);

      // Mock the upsert query (INSERT...ON CONFLICT DO UPDATE SET...RETURNING *)
      const upsertedRow1 = testFactories.tournamentGuess({ user_id: userId1, tournament_id: tournamentId, qualified_teams_score: 5 });
      const upsertedRow2 = testFactories.tournamentGuess({ user_id: userId2, tournament_id: tournamentId, qualified_teams_score: 8 });
      const mockInsertQuery = {
        values: vi.fn().mockReturnThis(),
        onConflict: vi.fn().mockReturnThis(),
        returningAll: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn()
          .mockResolvedValueOnce(upsertedRow1)
          .mockResolvedValueOnce(upsertedRow2),
      };
      mockDb.insertInto.mockReturnValue(mockInsertQuery as any);
      mockWriteScoreSnapshot.mockResolvedValue(undefined as any);

      const result = await calculateAndStoreQualifiedTeamsScores(tournamentId);

      expect(result.success).toBe(true);
      expect(result.usersProcessed).toBe(2);
      expect(result.totalScoreSum).toBe(13); // 5 + 8
      expect(result.errors).toHaveLength(0);
      expect(mockCalculateQualifiedTeamsScore).toHaveBeenCalledTimes(2);
      expect(mockRevalidatePath).toHaveBeenCalledWith(`/tournaments/${tournamentId}/stats`);
      expect(mockRevalidatePath).toHaveBeenCalledWith(`/tournaments/${tournamentId}`);
    });

    it('should return error when tournament not found', async () => {
      mockFindTournamentById.mockResolvedValue(null);

      const result = await calculateAndStoreQualifiedTeamsScores(tournamentId);

      expect(result.success).toBe(false);
      expect(result.message).toContain('notFound');
      expect(result.usersProcessed).toBe(0);
      expect(result.errors).toHaveLength(1);
    });

    it('should handle no users with predictions gracefully', async () => {
      const mockUsersQuery = createMockSelectQuery([]);
      mockDb.selectFrom.mockReturnValue(mockUsersQuery as any);

      const result = await calculateAndStoreQualifiedTeamsScores(tournamentId);

      expect(result.success).toBe(true);
      expect(result.message).toBe('scoring.noPredictions');
      expect(result.usersProcessed).toBe(0);
      expect(result.totalScoreSum).toBe(0);
    });

    it('should clear all existing scores before recalculating (idempotency)', async () => {
      const mockUsersQuery = createMockSelectQuery([{ user_id: userId1 }]);
      mockDb.selectFrom.mockReturnValue(mockUsersQuery as any);

      const mockClearQuery = createMockUpdateQuery({ qualified_teams_score: 0 });
      mockDb.updateTable.mockReturnValue(mockClearQuery as any);

      mockCalculateQualifiedTeamsScore.mockResolvedValue({
        userId: userId1,
        tournamentId,
        totalScore: 5,
        breakdown: [],
      });

      const upsertedRow = testFactories.tournamentGuess({ user_id: userId1, tournament_id: tournamentId, qualified_teams_score: 5 });
      const mockInsertQuery = {
        values: vi.fn().mockReturnThis(),
        onConflict: vi.fn().mockReturnThis(),
        returningAll: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(upsertedRow),
      };
      mockDb.insertInto.mockReturnValue(mockInsertQuery as any);
      mockWriteScoreSnapshot.mockResolvedValue(undefined as any);

      await calculateAndStoreQualifiedTeamsScores(tournamentId);

      // Verify that updateTable was called to clear scores
      expect(mockDb.updateTable).toHaveBeenCalledWith('tournament_guesses');
      expect(mockClearQuery.set).toHaveBeenCalledWith({ qualified_teams_score: 0 });
      expect(mockClearQuery.where).toHaveBeenCalledWith('tournament_id', '=', tournamentId);
    });

    it('should continue processing other users when one user fails', async () => {
      const mockUsersQuery = createMockSelectQuery([
        { user_id: userId1 },
        { user_id: userId2 },
      ]);

      mockDb.selectFrom.mockReturnValue(mockUsersQuery as any);

      // First user fails, second succeeds
      mockCalculateQualifiedTeamsScore
        .mockRejectedValueOnce(new Error('Incomplete groups'))
        .mockResolvedValueOnce({
          userId: userId2,
          tournamentId,
          totalScore: 8,
          breakdown: [],
        });

      const mockClearQuery = createMockUpdateQuery({ qualified_teams_score: 0 });
      mockDb.updateTable.mockReturnValue(mockClearQuery as any);

      // Mock the upsert query (INSERT...ON CONFLICT DO UPDATE SET...RETURNING *)
      // user-1 fails in calculateQualifiedTeamsScore before reaching insertInto
      // user-2 succeeds
      const upsertedRow2 = testFactories.tournamentGuess({ user_id: userId2, tournament_id: tournamentId, qualified_teams_score: 8 });
      const mockInsertQuery = {
        values: vi.fn().mockReturnThis(),
        onConflict: vi.fn().mockReturnThis(),
        returningAll: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(upsertedRow2),
      };
      mockDb.insertInto.mockReturnValue(mockInsertQuery as any);
      mockWriteScoreSnapshot.mockResolvedValue(undefined as any);

      const result = await calculateAndStoreQualifiedTeamsScores(tournamentId);

      expect(result.success).toBe(true);
      expect(result.usersProcessed).toBe(1); // Only user-2 succeeded
      expect(result.totalScoreSum).toBe(8);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('User user-1: Incomplete groups');
    });

    it('should create new tournament_guess if it does not exist', async () => {
      const mockUsersQuery = createMockSelectQuery([{ user_id: userId1 }]);
      mockDb.selectFrom.mockReturnValue(mockUsersQuery as any);

      mockCalculateQualifiedTeamsScore.mockResolvedValue({
        userId: userId1,
        tournamentId,
        totalScore: 5,
        breakdown: [],
      });

      const mockClearQuery = createMockUpdateQuery({ qualified_teams_score: 0 });
      mockDb.updateTable.mockReturnValue(mockClearQuery as any);

      // Mock the upsert query (INSERT...ON CONFLICT DO UPDATE SET...RETURNING *)
      const upsertedRow = testFactories.tournamentGuess({ user_id: userId1, tournament_id: tournamentId, qualified_teams_score: 5 });
      const mockExecuteTakeFirst = vi.fn().mockResolvedValue(upsertedRow);
      const mockInsertQuery = {
        values: vi.fn().mockReturnThis(),
        onConflict: vi.fn().mockReturnThis(),
        returningAll: vi.fn().mockReturnThis(),
        executeTakeFirst: mockExecuteTakeFirst,
      };
      mockDb.insertInto.mockReturnValue(mockInsertQuery as any);
      mockWriteScoreSnapshot.mockResolvedValue(undefined as any);

      const result = await calculateAndStoreQualifiedTeamsScores(tournamentId);

      expect(result.success).toBe(true);
      expect(result.usersProcessed).toBe(1);
      expect(mockExecuteTakeFirst).toHaveBeenCalled();
    });

    it('should handle top-level errors', async () => {
      mockFindTournamentById.mockRejectedValue(new Error('Database connection failed'));

      const result = await calculateAndStoreQualifiedTeamsScores(tournamentId);

      expect(result.success).toBe(false);
      expect(result.message).toContain('generic');
      expect(result.usersProcessed).toBe(0);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('calculateUserQualifiedTeamsScore', () => {
    it('should successfully calculate score for a single user', async () => {
      const scoringResult = {
        userId: userId1,
        tournamentId,
        totalScore: 7,
        breakdown: [
          {
            groupId: 'group-A',
            groupName: 'Group A',
            teams: [
              {
                teamId: 'team-1',
                teamName: 'Team 1',
                groupId: 'group-A',
                predictedPosition: 1,
                actualPosition: 1,
                predictedToQualify: true,
                actuallyQualified: true,
                pointsAwarded: 3,
                reason: 'qualified + exact position',
              },
            ],
          },
        ],
      };

      mockCalculateQualifiedTeamsScore.mockResolvedValue(scoringResult);

      const result = await calculateUserQualifiedTeamsScore(userId1, tournamentId);

      expect(result.success).toBe(true);
      expect(result.score).toBe(7);
      expect(result.breakdown).toEqual(scoringResult.breakdown);
      expect(mockCalculateQualifiedTeamsScore).toHaveBeenCalledWith(userId1, tournamentId);
    });

    it('should handle errors and return failure result', async () => {
      mockCalculateQualifiedTeamsScore.mockRejectedValue(
        new Error('Cannot calculate scores: Groups Group A are not complete')
      );

      const result = await calculateUserQualifiedTeamsScore(userId1, tournamentId);

      expect(result.success).toBe(false);
      expect(result.message).toContain('generic');
      expect(result.score).toBeUndefined();
      expect(result.breakdown).toBeUndefined();
    });
  });

  describe('triggerQualifiedTeamsScoringAction', () => {
    it('should return unauthorized error when no user logged in', async () => {
      mockGetLoggedInUser.mockResolvedValue(null);

      const result = await triggerQualifiedTeamsScoringAction(tournamentId);

      expect(result.success).toBe(false);
      expect(result.message).toBe('unauthorized');
      expect(result.usersProcessed).toBe(0);
      expect(result.errors).toContain('unauthorized');
    });

    it('should successfully trigger scoring when user is logged in', async () => {
      mockGetLoggedInUser.mockResolvedValue(user);

      const mockUsersQuery = createMockSelectQuery([{ user_id: userId1 }]);
      mockDb.selectFrom.mockReturnValue(mockUsersQuery as any);

      mockCalculateQualifiedTeamsScore.mockResolvedValue({
        userId: userId1,
        tournamentId,
        totalScore: 5,
        breakdown: [],
      });

      const mockClearQuery = createMockUpdateQuery({ qualified_teams_score: 0 });
      mockDb.updateTable.mockReturnValue(mockClearQuery as any);

      // Mock the upsert query (INSERT...ON CONFLICT DO UPDATE SET...RETURNING *)
      const upsertedRow = testFactories.tournamentGuess({ user_id: userId1, tournament_id: tournamentId, qualified_teams_score: 5 });
      const mockInsertQuery = {
        values: vi.fn().mockReturnThis(),
        onConflict: vi.fn().mockReturnThis(),
        returningAll: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(upsertedRow),
      };
      mockDb.insertInto.mockReturnValue(mockInsertQuery as any);
      mockWriteScoreSnapshot.mockResolvedValue(undefined as any);

      const result = await triggerQualifiedTeamsScoringAction(tournamentId);

      expect(result.success).toBe(true);
      expect(result.usersProcessed).toBe(1);
      expect(mockGetLoggedInUser).toHaveBeenCalled();
    });

    it('should handle errors during scoring calculation', async () => {
      mockGetLoggedInUser.mockResolvedValue(user);
      mockFindTournamentById.mockRejectedValue(new Error('Database error'));

      const result = await triggerQualifiedTeamsScoringAction(tournamentId);

      expect(result.success).toBe(false);
      expect(result.message).toContain('generic');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle zero scores correctly', async () => {
      const mockUsersQuery = createMockSelectQuery([{ user_id: userId1 }]);
      mockDb.selectFrom.mockReturnValue(mockUsersQuery as any);

      mockCalculateQualifiedTeamsScore.mockResolvedValue({
        userId: userId1,
        tournamentId,
        totalScore: 0, // User got no points
        breakdown: [],
      });

      const mockClearQuery = createMockUpdateQuery({ qualified_teams_score: 0 });
      mockDb.updateTable.mockReturnValue(mockClearQuery as any);

      // Mock the upsert query (INSERT...ON CONFLICT DO UPDATE SET...RETURNING *)
      const upsertedRow = testFactories.tournamentGuess({ user_id: userId1, tournament_id: tournamentId, qualified_teams_score: 0 });
      const mockInsertQuery = {
        values: vi.fn().mockReturnThis(),
        onConflict: vi.fn().mockReturnThis(),
        returningAll: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(upsertedRow),
      };
      mockDb.insertInto.mockReturnValue(mockInsertQuery as any);
      mockWriteScoreSnapshot.mockResolvedValue(undefined as any);

      const result = await calculateAndStoreQualifiedTeamsScores(tournamentId);

      expect(result.success).toBe(true);
      expect(result.totalScoreSum).toBe(0);
    });

    it('should call writeScoreSnapshot with all score fields from upserted row', async () => {
      const mockUsersQuery = createMockSelectQuery([{ user_id: userId1 }]);
      mockDb.selectFrom.mockReturnValue(mockUsersQuery as any);

      mockCalculateQualifiedTeamsScore.mockResolvedValue({
        userId: userId1,
        tournamentId,
        totalScore: 5,
        breakdown: [],
      });

      const mockClearQuery = createMockUpdateQuery({ qualified_teams_score: 0 });
      mockDb.updateTable.mockReturnValue(mockClearQuery as any);

      const upsertedRow = testFactories.tournamentGuess({
        user_id: userId1,
        tournament_id: tournamentId,
        qualified_teams_score: 5,
        total_game_score: 100,
        total_boost_bonus: 20,
        honor_roll_score: 30,
        individual_awards_score: 40,
        group_position_score: 10,
      });
      const mockInsertQuery = {
        values: vi.fn().mockReturnThis(),
        onConflict: vi.fn().mockReturnThis(),
        returningAll: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(upsertedRow),
      };
      mockDb.insertInto.mockReturnValue(mockInsertQuery as any);
      mockWriteScoreSnapshot.mockResolvedValue(undefined as any);

      await calculateAndStoreQualifiedTeamsScores(tournamentId);

      expect(mockWriteScoreSnapshot).toHaveBeenCalledWith({
        user_id: userId1,
        tournament_id: tournamentId,
        snapshot_date: 20260312,
        total_game_score: upsertedRow.total_game_score ?? 0,
        total_boost_bonus: upsertedRow.total_boost_bonus ?? 0,
        honor_roll_score: upsertedRow.honor_roll_score ?? 0,
        individual_awards_score: upsertedRow.individual_awards_score ?? 0,
        qualified_teams_score: 5,
        group_position_score: upsertedRow.group_position_score ?? 0,
      });
    });

    it('should call writeScoreSnapshot once per successfully processed user', async () => {
      const mockUsersQuery = createMockSelectQuery([
        { user_id: userId1 },
        { user_id: userId2 },
      ]);
      mockDb.selectFrom.mockReturnValue(mockUsersQuery as any);

      mockCalculateQualifiedTeamsScore
        .mockResolvedValueOnce({ userId: userId1, tournamentId, totalScore: 5, breakdown: [] })
        .mockResolvedValueOnce({ userId: userId2, tournamentId, totalScore: 8, breakdown: [] });

      const mockClearQuery = createMockUpdateQuery({ qualified_teams_score: 0 });
      mockDb.updateTable.mockReturnValue(mockClearQuery as any);

      const upsertedRow1 = testFactories.tournamentGuess({ user_id: userId1, tournament_id: tournamentId, qualified_teams_score: 5 });
      const upsertedRow2 = testFactories.tournamentGuess({ user_id: userId2, tournament_id: tournamentId, qualified_teams_score: 8 });
      const mockInsertQuery = {
        values: vi.fn().mockReturnThis(),
        onConflict: vi.fn().mockReturnThis(),
        returningAll: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn()
          .mockResolvedValueOnce(upsertedRow1)
          .mockResolvedValueOnce(upsertedRow2),
      };
      mockDb.insertInto.mockReturnValue(mockInsertQuery as any);
      mockWriteScoreSnapshot.mockResolvedValue(undefined as any);

      await calculateAndStoreQualifiedTeamsScores(tournamentId);

      expect(mockWriteScoreSnapshot).toHaveBeenCalledTimes(2);
    });

    it('should not call writeScoreSnapshot when upsert returns no row', async () => {
      const mockUsersQuery = createMockSelectQuery([{ user_id: userId1 }]);
      mockDb.selectFrom.mockReturnValue(mockUsersQuery as any);

      mockCalculateQualifiedTeamsScore.mockResolvedValue({
        userId: userId1,
        tournamentId,
        totalScore: 5,
        breakdown: [],
      });

      const mockClearQuery = createMockUpdateQuery({ qualified_teams_score: 0 });
      mockDb.updateTable.mockReturnValue(mockClearQuery as any);

      const mockInsertQuery = {
        values: vi.fn().mockReturnThis(),
        onConflict: vi.fn().mockReturnThis(),
        returningAll: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(undefined), // No row returned
      };
      mockDb.insertInto.mockReturnValue(mockInsertQuery as any);

      await calculateAndStoreQualifiedTeamsScores(tournamentId);

      expect(mockWriteScoreSnapshot).not.toHaveBeenCalled();
    });

    it('should not call writeScoreSnapshot when user score calculation fails', async () => {
      const mockUsersQuery = createMockSelectQuery([{ user_id: userId1 }]);
      mockDb.selectFrom.mockReturnValue(mockUsersQuery as any);

      mockCalculateQualifiedTeamsScore.mockRejectedValue(new Error('Calculation failed'));

      const mockClearQuery = createMockUpdateQuery({ qualified_teams_score: 0 });
      mockDb.updateTable.mockReturnValue(mockClearQuery as any);

      await calculateAndStoreQualifiedTeamsScores(tournamentId);

      expect(mockWriteScoreSnapshot).not.toHaveBeenCalled();
    });

    it('should handle multiple errors across different users', async () => {
      const mockUsersQuery = createMockSelectQuery([
        { user_id: userId1 },
        { user_id: userId2 },
        { user_id: 'user-3' },
      ]);

      mockDb.selectFrom.mockReturnValue(mockUsersQuery as any);

      mockCalculateQualifiedTeamsScore
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockRejectedValueOnce(new Error('Error 3'));

      const mockClearQuery = createMockUpdateQuery({ qualified_teams_score: 0 });
      mockDb.updateTable.mockReturnValue(mockClearQuery as any);

      const result = await calculateAndStoreQualifiedTeamsScores(tournamentId);

      expect(result.success).toBe(true); // Still success even if all users failed
      expect(result.usersProcessed).toBe(0);
      expect(result.errors).toHaveLength(3);
      expect(result.totalScoreSum).toBe(0);
    });
  });
});
