import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateQualifiedTeamsScore } from '../../app/utils/qualified-teams-scoring';
import { testFactories } from '../db/test-factories';
import { createMockSelectQuery } from '../db/mock-helpers';
import type { TeamPositionPrediction } from '../../app/db/tables-definition';

// Mock all repository dependencies
vi.mock('../../app/db/tournament-repository', () => ({
  findTournamentById: vi.fn(),
}));

vi.mock('../../app/db/qualified-teams-repository', () => ({
  getAllUserGroupPositionsPredictions: vi.fn(),
}));

vi.mock('../../app/db/team-repository', () => ({
  findQualifiedTeams: vi.fn(),
}));

vi.mock('../../app/db/database', () => ({
  db: {
    selectFrom: vi.fn(),
  },
}));

// Import mocked modules
import { findTournamentById } from '../../app/db/tournament-repository';
import { getAllUserGroupPositionsPredictions } from '../../app/db/qualified-teams-repository';
import { findQualifiedTeams } from '../../app/db/team-repository';
import { db } from '../../app/db/database';

const mockFindTournamentById = vi.mocked(findTournamentById);
const mockGetAllUserGroupPositionsPredictions = vi.mocked(getAllUserGroupPositionsPredictions);
const mockFindQualifiedTeams = vi.mocked(findQualifiedTeams);
const mockDb = vi.mocked(db);

describe('calculateQualifiedTeamsScore', () => {
  const userId = 'user-1';
  const tournamentId = 'tournament-1';
  const groupId = 'group-A';

  // Test data
  const tournament = testFactories.tournament({
    id: tournamentId,
    qualified_team_points: 2, // Base points for qualification
    exact_position_qualified_points: 1, // Bonus for exact position
  });

  const team1 = testFactories.team({ id: 'team-1', name: 'Team 1' });
  const team2 = testFactories.team({ id: 'team-2', name: 'Team 2' });
  const team3 = testFactories.team({ id: 'team-3', name: 'Team 3' });
  const team4 = testFactories.team({ id: 'team-4', name: 'Team 4' });

  beforeEach(() => {
    vi.clearAllMocks();

    // Default tournament mock
    mockFindTournamentById.mockResolvedValue(tournament);
  });

  describe('Error handling', () => {
    it('should throw error when tournament not found', async () => {
      mockFindTournamentById.mockResolvedValue(null);

      await expect(
        calculateQualifiedTeamsScore(userId, tournamentId)
      ).rejects.toThrow(`Tournament ${tournamentId} not found`);
    });

    it('should throw error when groups are incomplete', async () => {
      // Mock user predictions
      const predictions: TeamPositionPrediction[] = [
        { team_id: 'team-1', predicted_position: 1, predicted_to_qualify: true },
      ];

      mockGetAllUserGroupPositionsPredictions.mockResolvedValue([
        {
          id: 'pred-1',
          user_id: userId,
          tournament_id: tournamentId,
          group_id: groupId,
          team_predicted_positions: predictions,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      // Mock group standings with incomplete status
      const mockQuery = createMockSelectQuery([
        {
          team_id: 'team-1',
          group_id: groupId,
          position: 1,
          is_complete: false, // Incomplete group
          team_name: 'Team 1',
          group_name: 'Group A',
        },
      ]);

      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      await expect(
        calculateQualifiedTeamsScore(userId, tournamentId)
      ).rejects.toThrow('Cannot calculate scores: Groups Group A are not complete');
    });
  });

  describe('Rule 1-2: Direct qualifiers (positions 1-2) that qualify', () => {
    it('should award base + bonus points for exact position match (position 1)', async () => {
      // User predicts team-1 at position 1, and team-1 actually finishes 1st and qualifies
      const predictions: TeamPositionPrediction[] = [
        { team_id: 'team-1', predicted_position: 1, predicted_to_qualify: true },
      ];

      mockGetAllUserGroupPositionsPredictions.mockResolvedValue([
        {
          id: 'pred-1',
          user_id: userId,
          tournament_id: tournamentId,
          group_id: groupId,
          team_predicted_positions: predictions,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      // Mock group standings
      const mockQuery = createMockSelectQuery([
        {
          team_id: 'team-1',
          group_id: groupId,
          position: 1,
          is_complete: true,
          team_name: 'Team 1',
          group_name: 'Group A',
        },
      ]);

      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      // Mock qualified teams (team-1 qualified)
      mockFindQualifiedTeams.mockResolvedValue([team1]);

      const result = await calculateQualifiedTeamsScore(userId, tournamentId);

      expect(result.totalScore).toBe(3); // 2 (base) + 1 (bonus)
      expect(result.breakdown).toHaveLength(1);
      expect(result.breakdown[0].teams[0]).toMatchObject({
        teamId: 'team-1',
        predictedPosition: 1,
        actualPosition: 1,
        predictedToQualify: true,
        actuallyQualified: true,
        pointsAwarded: 3,
        reason: 'qualified + exact position',
      });
    });

    it('should award base + bonus points for exact position match (position 2)', async () => {
      // User predicts team-2 at position 2, and team-2 actually finishes 2nd and qualifies
      const predictions: TeamPositionPrediction[] = [
        { team_id: 'team-2', predicted_position: 2, predicted_to_qualify: true },
      ];

      mockGetAllUserGroupPositionsPredictions.mockResolvedValue([
        {
          id: 'pred-1',
          user_id: userId,
          tournament_id: tournamentId,
          group_id: groupId,
          team_predicted_positions: predictions,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      const mockQuery = createMockSelectQuery([
        {
          team_id: 'team-2',
          group_id: groupId,
          position: 2,
          is_complete: true,
          team_name: 'Team 2',
          group_name: 'Group A',
        },
      ]);

      mockDb.selectFrom.mockReturnValue(mockQuery as any);
      mockFindQualifiedTeams.mockResolvedValue([team2]);

      const result = await calculateQualifiedTeamsScore(userId, tournamentId);

      expect(result.totalScore).toBe(3); // 2 (base) + 1 (bonus)
      expect(result.breakdown[0].teams[0].pointsAwarded).toBe(3);
      expect(result.breakdown[0].teams[0].reason).toBe('qualified + exact position');
    });

    it('should award base points only for wrong position but qualified', async () => {
      // User predicts team-1 at position 1, but team-1 finishes 2nd (still qualifies)
      const predictions: TeamPositionPrediction[] = [
        { team_id: 'team-1', predicted_position: 1, predicted_to_qualify: true },
      ];

      mockGetAllUserGroupPositionsPredictions.mockResolvedValue([
        {
          id: 'pred-1',
          user_id: userId,
          tournament_id: tournamentId,
          group_id: groupId,
          team_predicted_positions: predictions,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      const mockQuery = createMockSelectQuery([
        {
          team_id: 'team-1',
          group_id: groupId,
          position: 2, // Wrong position
          is_complete: true,
          team_name: 'Team 1',
          group_name: 'Group A',
        },
      ]);

      mockDb.selectFrom.mockReturnValue(mockQuery as any);
      mockFindQualifiedTeams.mockResolvedValue([team1]); // Still qualified

      const result = await calculateQualifiedTeamsScore(userId, tournamentId);

      expect(result.totalScore).toBe(2); // Only base points
      expect(result.breakdown[0].teams[0].pointsAwarded).toBe(2);
      expect(result.breakdown[0].teams[0].reason).toBe('qualified, wrong position');
    });
  });

  describe('Rule 3: Third place with qualify=true that qualifies', () => {
    it('should award base + bonus points for exact position match (position 3)', async () => {
      // User predicts team-3 at position 3 with qualify=true, and team-3 finishes 3rd and qualifies
      const predictions: TeamPositionPrediction[] = [
        { team_id: 'team-3', predicted_position: 3, predicted_to_qualify: true },
      ];

      mockGetAllUserGroupPositionsPredictions.mockResolvedValue([
        {
          id: 'pred-1',
          user_id: userId,
          tournament_id: tournamentId,
          group_id: groupId,
          team_predicted_positions: predictions,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      const mockQuery = createMockSelectQuery([
        {
          team_id: 'team-3',
          group_id: groupId,
          position: 3,
          is_complete: true,
          team_name: 'Team 3',
          group_name: 'Group A',
        },
      ]);

      mockDb.selectFrom.mockReturnValue(mockQuery as any);
      mockFindQualifiedTeams.mockResolvedValue([team3]);

      const result = await calculateQualifiedTeamsScore(userId, tournamentId);

      expect(result.totalScore).toBe(3); // 2 (base) + 1 (bonus)
      expect(result.breakdown[0].teams[0]).toMatchObject({
        teamId: 'team-3',
        predictedPosition: 3,
        actualPosition: 3,
        predictedToQualify: true,
        actuallyQualified: true,
        pointsAwarded: 3,
        reason: 'qualified + exact position',
      });
    });

    it('should award base points only when 3rd place team qualifies but predicted different position', async () => {
      // User predicts team-3 at position 2, but team-3 finishes 3rd (still qualifies as 3rd place)
      const predictions: TeamPositionPrediction[] = [
        { team_id: 'team-3', predicted_position: 2, predicted_to_qualify: true },
      ];

      mockGetAllUserGroupPositionsPredictions.mockResolvedValue([
        {
          id: 'pred-1',
          user_id: userId,
          tournament_id: tournamentId,
          group_id: groupId,
          team_predicted_positions: predictions,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      const mockQuery = createMockSelectQuery([
        {
          team_id: 'team-3',
          group_id: groupId,
          position: 3,
          is_complete: true,
          team_name: 'Team 3',
          group_name: 'Group A',
        },
      ]);

      mockDb.selectFrom.mockReturnValue(mockQuery as any);
      mockFindQualifiedTeams.mockResolvedValue([team3]);

      const result = await calculateQualifiedTeamsScore(userId, tournamentId);

      expect(result.totalScore).toBe(2); // Only base points
      expect(result.breakdown[0].teams[0].pointsAwarded).toBe(2);
      expect(result.breakdown[0].teams[0].reason).toBe('qualified, wrong position');
    });

    it('should award 0 points when 3rd place team qualifies but user set qualify=false', async () => {
      // User predicts team-3 at position 3 but qualify=false, team-3 qualifies anyway
      const predictions: TeamPositionPrediction[] = [
        { team_id: 'team-3', predicted_position: 3, predicted_to_qualify: false },
      ];

      mockGetAllUserGroupPositionsPredictions.mockResolvedValue([
        {
          id: 'pred-1',
          user_id: userId,
          tournament_id: tournamentId,
          group_id: groupId,
          team_predicted_positions: predictions,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      const mockQuery = createMockSelectQuery([
        {
          team_id: 'team-3',
          group_id: groupId,
          position: 3,
          is_complete: true,
          team_name: 'Team 3',
          group_name: 'Group A',
        },
      ]);

      mockDb.selectFrom.mockReturnValue(mockQuery as any);
      mockFindQualifiedTeams.mockResolvedValue([team3]);

      const result = await calculateQualifiedTeamsScore(userId, tournamentId);

      expect(result.totalScore).toBe(0);
      expect(result.breakdown[0].teams[0]).toMatchObject({
        teamId: 'team-3',
        predictedPosition: 3,
        actualPosition: 3,
        predictedToQualify: false,
        actuallyQualified: true,
        pointsAwarded: 0,
        reason: 'qualified, but user did not predict qualification',
      });
    });
  });

  describe('Rule 4: Team does not qualify → 0 points', () => {
    it('should award 0 points when team does not qualify, even if position is correct', async () => {
      // User predicts team-4 at position 4, team-4 finishes 4th (correct) but does not qualify
      const predictions: TeamPositionPrediction[] = [
        { team_id: 'team-4', predicted_position: 4, predicted_to_qualify: false },
      ];

      mockGetAllUserGroupPositionsPredictions.mockResolvedValue([
        {
          id: 'pred-1',
          user_id: userId,
          tournament_id: tournamentId,
          group_id: groupId,
          team_predicted_positions: predictions,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      const mockQuery = createMockSelectQuery([
        {
          team_id: 'team-4',
          group_id: groupId,
          position: 4,
          is_complete: true,
          team_name: 'Team 4',
          group_name: 'Group A',
        },
      ]);

      mockDb.selectFrom.mockReturnValue(mockQuery as any);
      mockFindQualifiedTeams.mockResolvedValue([]); // No qualified teams

      const result = await calculateQualifiedTeamsScore(userId, tournamentId);

      expect(result.totalScore).toBe(0);
      expect(result.breakdown[0].teams[0]).toMatchObject({
        teamId: 'team-4',
        predictedPosition: 4,
        actualPosition: 4,
        predictedToQualify: false,
        actuallyQualified: false,
        pointsAwarded: 0,
        reason: 'not qualified',
      });
    });

    it('should award 0 points when predicted team does not qualify (even if predicted to qualify)', async () => {
      // User predicts team-1 at position 1 to qualify, but team-1 doesn't make playoffs
      const predictions: TeamPositionPrediction[] = [
        { team_id: 'team-1', predicted_position: 1, predicted_to_qualify: true },
      ];

      mockGetAllUserGroupPositionsPredictions.mockResolvedValue([
        {
          id: 'pred-1',
          user_id: userId,
          tournament_id: tournamentId,
          group_id: groupId,
          team_predicted_positions: predictions,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      const mockQuery = createMockSelectQuery([
        {
          team_id: 'team-1',
          group_id: groupId,
          position: 1,
          is_complete: true,
          team_name: 'Team 1',
          group_name: 'Group A',
        },
      ]);

      mockDb.selectFrom.mockReturnValue(mockQuery as any);
      mockFindQualifiedTeams.mockResolvedValue([team2]); // Only team-2 qualified

      const result = await calculateQualifiedTeamsScore(userId, tournamentId);

      expect(result.totalScore).toBe(0);
      expect(result.breakdown[0].teams[0]).toMatchObject({
        pointsAwarded: 0,
        reason: 'not qualified',
      });
    });
  });

  describe('Multiple groups and teams', () => {
    it('should calculate scores across multiple groups', async () => {
      const groupA = 'group-A';
      const groupB = 'group-B';

      const predictions: TeamPositionPrediction[] = [
        { team_id: 'team-1', predicted_position: 1, predicted_to_qualify: true },
        { team_id: 'team-2', predicted_position: 2, predicted_to_qualify: true },
      ];

      mockGetAllUserGroupPositionsPredictions.mockResolvedValue([
        {
          id: 'pred-1',
          user_id: userId,
          tournament_id: tournamentId,
          group_id: groupA,
          team_predicted_positions: [predictions[0]],
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'pred-2',
          user_id: userId,
          tournament_id: tournamentId,
          group_id: groupB,
          team_predicted_positions: [predictions[1]],
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      const mockQuery = createMockSelectQuery([
        {
          team_id: 'team-1',
          group_id: groupA,
          position: 1,
          is_complete: true,
          team_name: 'Team 1',
          group_name: 'Group A',
        },
        {
          team_id: 'team-2',
          group_id: groupB,
          position: 2,
          is_complete: true,
          team_name: 'Team 2',
          group_name: 'Group B',
        },
      ]);

      mockDb.selectFrom.mockReturnValue(mockQuery as any);
      mockFindQualifiedTeams.mockResolvedValue([team1, team2]);

      const result = await calculateQualifiedTeamsScore(userId, tournamentId);

      expect(result.totalScore).toBe(6); // 3 points per group (exact position + qualified)
      expect(result.breakdown).toHaveLength(2);
      expect(result.breakdown[0].groupId).toBe(groupA);
      expect(result.breakdown[1].groupId).toBe(groupB);
    });

    it('should handle multiple teams in same group with mixed results', async () => {
      const predictions: TeamPositionPrediction[] = [
        { team_id: 'team-1', predicted_position: 1, predicted_to_qualify: true }, // Correct
        { team_id: 'team-2', predicted_position: 2, predicted_to_qualify: true }, // Wrong position
        { team_id: 'team-3', predicted_position: 3, predicted_to_qualify: true }, // Qualified, wrong pos
        { team_id: 'team-4', predicted_position: 4, predicted_to_qualify: false }, // Not qualified
      ];

      mockGetAllUserGroupPositionsPredictions.mockResolvedValue([
        {
          id: 'pred-1',
          user_id: userId,
          tournament_id: tournamentId,
          group_id: groupId,
          team_predicted_positions: predictions,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      const mockQuery = createMockSelectQuery([
        { team_id: 'team-1', group_id: groupId, position: 1, is_complete: true, team_name: 'Team 1', group_name: 'Group A' },
        { team_id: 'team-2', group_id: groupId, position: 1, is_complete: true, team_name: 'Team 2', group_name: 'Group A' },
        { team_id: 'team-3', group_id: groupId, position: 2, is_complete: true, team_name: 'Team 3', group_name: 'Group A' },
        { team_id: 'team-4', group_id: groupId, position: 4, is_complete: true, team_name: 'Team 4', group_name: 'Group A' },
      ]);

      mockDb.selectFrom.mockReturnValue(mockQuery as any);
      mockFindQualifiedTeams.mockResolvedValue([team1, team2, team3]); // team-4 not qualified

      const result = await calculateQualifiedTeamsScore(userId, tournamentId);

      // team-1: 3 (exact), team-2: 2 (qualified, wrong pos), team-3: 2 (qualified, wrong pos), team-4: 0
      expect(result.totalScore).toBe(7);
      expect(result.breakdown[0].teams).toHaveLength(4);
      expect(result.breakdown[0].teams[0].pointsAwarded).toBe(3);
      expect(result.breakdown[0].teams[1].pointsAwarded).toBe(2);
      expect(result.breakdown[0].teams[2].pointsAwarded).toBe(2);
      expect(result.breakdown[0].teams[3].pointsAwarded).toBe(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle no predictions', async () => {
      mockGetAllUserGroupPositionsPredictions.mockResolvedValue([]);

      const mockQuery = createMockSelectQuery([]);
      mockDb.selectFrom.mockReturnValue(mockQuery as any);
      mockFindQualifiedTeams.mockResolvedValue([]);

      const result = await calculateQualifiedTeamsScore(userId, tournamentId);

      expect(result.totalScore).toBe(0);
      expect(result.breakdown).toHaveLength(0);
    });

    it('should handle qualified team with no actual position data', async () => {
      const predictions: TeamPositionPrediction[] = [
        { team_id: 'team-1', predicted_position: 1, predicted_to_qualify: true },
      ];

      mockGetAllUserGroupPositionsPredictions.mockResolvedValue([
        {
          id: 'pred-1',
          user_id: userId,
          tournament_id: tournamentId,
          group_id: groupId,
          team_predicted_positions: predictions,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      // Team qualified but no position data in standings
      const mockQuery = createMockSelectQuery([]);
      mockDb.selectFrom.mockReturnValue(mockQuery as any);
      mockFindQualifiedTeams.mockResolvedValue([team1]);

      const result = await calculateQualifiedTeamsScore(userId, tournamentId);

      expect(result.breakdown[0].teams[0]).toMatchObject({
        actualPosition: null,
        actuallyQualified: true,
        pointsAwarded: 0,
        reason: 'qualified, but no position data',
      });
    });

    it('should use custom scoring points from tournament config', async () => {
      const customTournament = testFactories.tournament({
        id: tournamentId,
        qualified_team_points: 5, // Custom base points
        exact_position_qualified_points: 3, // Custom bonus
      });

      mockFindTournamentById.mockResolvedValue(customTournament);

      const predictions: TeamPositionPrediction[] = [
        { team_id: 'team-1', predicted_position: 1, predicted_to_qualify: true },
      ];

      mockGetAllUserGroupPositionsPredictions.mockResolvedValue([
        {
          id: 'pred-1',
          user_id: userId,
          tournament_id: tournamentId,
          group_id: groupId,
          team_predicted_positions: predictions,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      const mockQuery = createMockSelectQuery([
        {
          team_id: 'team-1',
          group_id: groupId,
          position: 1,
          is_complete: true,
          team_name: 'Team 1',
          group_name: 'Group A',
        },
      ]);

      mockDb.selectFrom.mockReturnValue(mockQuery as any);
      mockFindQualifiedTeams.mockResolvedValue([team1]);

      const result = await calculateQualifiedTeamsScore(userId, tournamentId);

      expect(result.totalScore).toBe(8); // 5 (base) + 3 (bonus)
    });

    it('should use default scoring points when tournament config is null', async () => {
      const defaultTournament = testFactories.tournament({
        id: tournamentId,
        qualified_team_points: undefined,
        exact_position_qualified_points: undefined,
      });

      mockFindTournamentById.mockResolvedValue(defaultTournament);

      const predictions: TeamPositionPrediction[] = [
        { team_id: 'team-1', predicted_position: 1, predicted_to_qualify: true },
      ];

      mockGetAllUserGroupPositionsPredictions.mockResolvedValue([
        {
          id: 'pred-1',
          user_id: userId,
          tournament_id: tournamentId,
          group_id: groupId,
          team_predicted_positions: predictions,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      const mockQuery = createMockSelectQuery([
        {
          team_id: 'team-1',
          group_id: groupId,
          position: 1,
          is_complete: true,
          team_name: 'Team 1',
          group_name: 'Group A',
        },
      ]);

      mockDb.selectFrom.mockReturnValue(mockQuery as any);
      mockFindQualifiedTeams.mockResolvedValue([team1]);

      const result = await calculateQualifiedTeamsScore(userId, tournamentId);

      expect(result.totalScore).toBe(2); // Default: 1 (base) + 1 (bonus)
    });
  });

  describe('Result structure', () => {
    it('should return correct result structure with breakdown', async () => {
      const predictions: TeamPositionPrediction[] = [
        { team_id: 'team-1', predicted_position: 1, predicted_to_qualify: true },
      ];

      mockGetAllUserGroupPositionsPredictions.mockResolvedValue([
        {
          id: 'pred-1',
          user_id: userId,
          tournament_id: tournamentId,
          group_id: groupId,
          team_predicted_positions: predictions,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      const mockQuery = createMockSelectQuery([
        {
          team_id: 'team-1',
          group_id: groupId,
          position: 1,
          is_complete: true,
          team_name: 'Team 1',
          group_name: 'Group A',
        },
      ]);

      mockDb.selectFrom.mockReturnValue(mockQuery as any);
      mockFindQualifiedTeams.mockResolvedValue([team1]);

      const result = await calculateQualifiedTeamsScore(userId, tournamentId);

      expect(result).toMatchObject({
        userId,
        tournamentId,
        totalScore: expect.any(Number),
        breakdown: expect.arrayContaining([
          expect.objectContaining({
            groupId: expect.any(String),
            groupName: expect.any(String),
            teams: expect.arrayContaining([
              expect.objectContaining({
                teamId: expect.any(String),
                teamName: expect.any(String),
                groupId: expect.any(String),
                predictedPosition: expect.any(Number),
                actualPosition: expect.any(Number),
                predictedToQualify: expect.any(Boolean),
                actuallyQualified: expect.any(Boolean),
                pointsAwarded: expect.any(Number),
                reason: expect.any(String),
              }),
            ]),
          }),
        ]),
      });
    });
  });
});
