import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  autoFillGameScores,
  clearGameScores
} from '../../app/actions/game-score-generator-actions';
import { testFactories } from '../db/test-factories';
import { ExtendedGameData } from '../../app/definitions';

// Mock the auth module
vi.mock('../../auth', () => ({
  auth: vi.fn(),
}));

// Mock database repositories
vi.mock('../../app/db/game-repository', () => ({
  findGamesInGroup: vi.fn(),
  findGamesInTournament: vi.fn(),
}));

vi.mock('../../app/db/game-result-repository', () => ({
  findGameResultByGameIds: vi.fn(),
  createGameResult: vi.fn().mockResolvedValue(undefined),
  updateGameResult: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../app/db/tournament-group-repository', () => ({
  findTournamentgroupById: vi.fn(),
  findTeamsInGroup: vi.fn(),
}));

vi.mock('../../app/db/database', () => ({
  db: {
    selectFrom: vi.fn(),
  },
}));

// Mock the Poisson generator
vi.mock('../../app/utils/poisson-generator', () => ({
  generateMatchScore: vi.fn(),
}));

// Mock backoffice actions (recalculation pipeline)
vi.mock('../../app/actions/backoffice-actions', () => ({
  calculateAndSavePlayoffGamesForTournament: vi.fn(),
  calculateAndStoreGroupPosition: vi.fn(),
  calculateGameScores: vi.fn(),
}));

// Mock qualified teams scoring actions
vi.mock('../../app/actions/qualified-teams-scoring-actions', () => ({
  calculateAndStoreQualifiedTeamsScores: vi.fn(),
}));

import { auth } from '../../auth';
import * as gameRepository from '../../app/db/game-repository';
import * as gameResultRepository from '../../app/db/game-result-repository';
import * as tournamentGroupRepository from '../../app/db/tournament-group-repository';
import { db } from '../../app/db/database';
import { generateMatchScore } from '../../app/utils/poisson-generator';
import * as backofficeActions from '../../app/actions/backoffice-actions';
import * as qualifiedTeamsScoringActions from '../../app/actions/qualified-teams-scoring-actions';

const mockAuth = vi.mocked(auth);
const mockFindGamesInGroup = vi.mocked(gameRepository.findGamesInGroup);
const mockFindGamesInTournament = vi.mocked(gameRepository.findGamesInTournament);
const mockFindGameResultByGameIds = vi.mocked(gameResultRepository.findGameResultByGameIds);
const mockCreateGameResult = vi.mocked(gameResultRepository.createGameResult);
const mockUpdateGameResult = vi.mocked(gameResultRepository.updateGameResult);
const mockFindTournamentgroupById = vi.mocked(tournamentGroupRepository.findTournamentgroupById);
const mockFindTeamsInGroup = vi.mocked(tournamentGroupRepository.findTeamsInGroup);
const mockDb = vi.mocked(db);
const mockGenerateMatchScore = vi.mocked(generateMatchScore);
const mockCalculateAndSavePlayoffGamesForTournament = vi.mocked(backofficeActions.calculateAndSavePlayoffGamesForTournament);
const mockCalculateAndStoreGroupPosition = vi.mocked(backofficeActions.calculateAndStoreGroupPosition);
const mockCalculateAndStoreQualifiedTeamsScores = vi.mocked(qualifiedTeamsScoringActions.calculateAndStoreQualifiedTeamsScores);
const mockCalculateGameScores = vi.mocked(backofficeActions.calculateGameScores);

describe('Game Score Generator Actions', () => {
  const mockAdminUser = {
    id: 'admin-1',
    email: 'admin@example.com',
    emailVerified: new Date(),
    isAdmin: true,
  };

  const mockRegularUser = {
    id: 'user-1',
    email: 'user@example.com',
    emailVerified: new Date(),
    isAdmin: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default: Admin user
    mockAuth.mockResolvedValue({
      user: mockAdminUser,
      expires: '2024-12-31',
    } as any);

    // Mock generateMatchScore with default values
    mockGenerateMatchScore.mockReturnValue({
      homeScore: 2,
      awayScore: 1,
    });

    // Mock recalculation functions
    mockCalculateAndSavePlayoffGamesForTournament.mockResolvedValue(undefined as any);
    mockCalculateAndStoreGroupPosition.mockResolvedValue(undefined as any);
    mockCalculateAndStoreQualifiedTeamsScores.mockResolvedValue(undefined as any);
    mockCalculateGameScores.mockResolvedValue(undefined as any);
  });

  describe('autoFillGameScores', () => {
    describe('Authorization', () => {
      it('allows admin user to auto-fill scores', async () => {
        // Setup: Group with games but no results
        const mockGroup = testFactories.tournamentGroup({
          id: 'group-1',
          tournament_id: 'tournament-1',
        });
        const mockGames: ExtendedGameData[] = [
          {
            ...testFactories.game({ id: 'game-1', tournament_id: 'tournament-1' }),
            homeTeam: testFactories.team({ id: 'team-1' }),
            awayTeam: testFactories.team({ id: 'team-2' }),
          } as ExtendedGameData,
        ];

        mockFindTournamentgroupById.mockResolvedValue(mockGroup);
        mockFindGamesInGroup.mockResolvedValue(mockGames);
        mockFindGameResultByGameIds.mockResolvedValue([]);
        mockFindTeamsInGroup.mockResolvedValue([]);

        const result = await autoFillGameScores('group-1');

        expect(result.success).toBe(true);
        expect(result.filledCount).toBe(1);
        expect(result.error).toBeUndefined();
      });

      it('rejects non-admin user', async () => {
        mockAuth.mockResolvedValue({
          user: mockRegularUser,
          expires: '2024-12-31',
        } as any);

        const result = await autoFillGameScores('group-1');

        expect(result.success).toBe(false);
        expect(result.error).toBe('scoreGenerator.unauthorized');
        expect(mockFindGamesInGroup).not.toHaveBeenCalled();
      });

      it('rejects when user is not logged in', async () => {
        mockAuth.mockResolvedValue(null);

        const result = await autoFillGameScores('group-1');

        expect(result.success).toBe(false);
        expect(result.error).toBe('scoreGenerator.unauthorized');
        expect(mockFindGamesInGroup).not.toHaveBeenCalled();
      });
    });

    describe('Input Validation', () => {
      it('requires either groupId or playoffRoundId', async () => {
        const result = await autoFillGameScores();

        expect(result.success).toBe(false);
        expect(result.error).toBe('scoreGenerator.requireGroupOrPlayoff');
        expect(mockFindGamesInGroup).not.toHaveBeenCalled();
      });

      it('returns error when group not found', async () => {
        mockFindTournamentgroupById.mockResolvedValue(null);

        const result = await autoFillGameScores('non-existent-group');

        expect(result.success).toBe(false);
        expect(result.error).toBe('scoreGenerator.groupNotFound');
      });

      it('returns error when playoff round not found', async () => {
        const mockQuery = {
          selectAll: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue(null),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await autoFillGameScores(undefined, 'non-existent-round');

        expect(result.success).toBe(false);
        expect(result.error).toBe('scoreGenerator.playoffRoundNotFound');
      });
    });

    describe('Game Filtering', () => {
      it('fills only unpublished games (no result)', async () => {
        const mockGroup = testFactories.tournamentGroup({
          id: 'group-1',
          tournament_id: 'tournament-1',
        });
        const mockGames: ExtendedGameData[] = [
          {
            ...testFactories.game({ id: 'game-1', tournament_id: 'tournament-1' }),
            homeTeam: testFactories.team({ id: 'team-1' }),
            awayTeam: testFactories.team({ id: 'team-2' }),
          } as ExtendedGameData,
          {
            ...testFactories.game({ id: 'game-2', tournament_id: 'tournament-1' }),
            homeTeam: testFactories.team({ id: 'team-3' }),
            awayTeam: testFactories.team({ id: 'team-4' }),
          } as ExtendedGameData,
        ];

        mockFindTournamentgroupById.mockResolvedValue(mockGroup);
        mockFindGamesInGroup.mockResolvedValue(mockGames);
        mockFindGameResultByGameIds.mockResolvedValue([]);
        mockFindTeamsInGroup.mockResolvedValue([]);

        const result = await autoFillGameScores('group-1');

        expect(result.success).toBe(true);
        expect(result.filledCount).toBe(2);
        expect(result.skippedCount).toBe(0);

        // Verify createGameResult was called for both games
        expect(mockCreateGameResult).toHaveBeenCalledTimes(2);
        expect(mockCreateGameResult).toHaveBeenCalledWith({
          game_id: 'game-1',
          home_score: 2,
          away_score: 1,
          home_penalty_score: undefined,
          away_penalty_score: undefined,
          is_draft: false,
        });
        expect(mockCreateGameResult).toHaveBeenCalledWith({
          game_id: 'game-2',
          home_score: 2,
          away_score: 1,
          home_penalty_score: undefined,
          away_penalty_score: undefined,
          is_draft: false,
        });
      });

      it('fills only draft games (unpublished result)', async () => {
        const mockGroup = testFactories.tournamentGroup({
          id: 'group-1',
          tournament_id: 'tournament-1',
        });
        const mockGames: ExtendedGameData[] = [
          {
            ...testFactories.game({ id: 'game-1', tournament_id: 'tournament-1' }),
            homeTeam: testFactories.team({ id: 'team-1' }),
            awayTeam: testFactories.team({ id: 'team-2' }),
          } as ExtendedGameData,
        ];

        // Game has draft result
        const draftResult = testFactories.gameResult({
          game_id: 'game-1',
          is_draft: true,
        });

        mockFindTournamentgroupById.mockResolvedValue(mockGroup);
        mockFindGamesInGroup.mockResolvedValue(mockGames);
        mockFindGameResultByGameIds.mockResolvedValue([draftResult]);
        mockFindTeamsInGroup.mockResolvedValue([]);

        const result = await autoFillGameScores('group-1');

        expect(result.success).toBe(true);
        expect(result.filledCount).toBe(1);

        // Verify updateGameResult was called for game-1
        expect(mockUpdateGameResult).toHaveBeenCalledTimes(1);
        expect(mockUpdateGameResult).toHaveBeenCalledWith('game-1', {
          home_score: 2,
          away_score: 1,
          home_penalty_score: undefined,
          away_penalty_score: undefined,
          is_draft: false,
        });
      });

      it('skips published games', async () => {
        const mockGroup = testFactories.tournamentGroup({
          id: 'group-1',
          tournament_id: 'tournament-1',
        });
        const mockGames: ExtendedGameData[] = [
          {
            ...testFactories.game({ id: 'game-1', tournament_id: 'tournament-1' }),
            homeTeam: testFactories.team({ id: 'team-1' }),
            awayTeam: testFactories.team({ id: 'team-2' }),
          } as ExtendedGameData,
          {
            ...testFactories.game({ id: 'game-2', tournament_id: 'tournament-1' }),
            homeTeam: testFactories.team({ id: 'team-3' }),
            awayTeam: testFactories.team({ id: 'team-4' }),
          } as ExtendedGameData,
        ];

        // game-1 has published result, game-2 has no result
        const publishedResult = testFactories.gameResult({
          game_id: 'game-1',
          is_draft: false,
        });

        mockFindTournamentgroupById.mockResolvedValue(mockGroup);
        mockFindGamesInGroup.mockResolvedValue(mockGames);
        mockFindGameResultByGameIds.mockResolvedValue([publishedResult]);
        mockFindTeamsInGroup.mockResolvedValue([]);

        const result = await autoFillGameScores('group-1');

        expect(result.success).toBe(true);
        expect(result.filledCount).toBe(1);
        expect(result.skippedCount).toBe(1);

        // Verify createGameResult was called only for game-2
        expect(mockCreateGameResult).toHaveBeenCalledTimes(1);
        expect(mockCreateGameResult).toHaveBeenCalledWith({
          game_id: 'game-2',
          home_score: 2,
          away_score: 1,
          home_penalty_score: undefined,
          away_penalty_score: undefined,
          is_draft: false,
        });
      });

      it('returns success with zero filled when all games are published', async () => {
        const mockGroup = testFactories.tournamentGroup({
          id: 'group-1',
          tournament_id: 'tournament-1',
        });
        const mockGames: ExtendedGameData[] = [
          {
            ...testFactories.game({ id: 'game-1', tournament_id: 'tournament-1' }),
            homeTeam: testFactories.team({ id: 'team-1' }),
            awayTeam: testFactories.team({ id: 'team-2' }),
          } as ExtendedGameData,
        ];

        const publishedResult = testFactories.gameResult({
          game_id: 'game-1',
          is_draft: false,
        });

        mockFindTournamentgroupById.mockResolvedValue(mockGroup);
        mockFindGamesInGroup.mockResolvedValue(mockGames);
        mockFindGameResultByGameIds.mockResolvedValue([publishedResult]);

        const result = await autoFillGameScores('group-1');

        expect(result.success).toBe(true);
        expect(result.filledCount).toBe(0);
        expect(result.skippedCount).toBe(1);
        expect(mockCreateGameResult).not.toHaveBeenCalled();
        expect(mockUpdateGameResult).not.toHaveBeenCalled();
      });
    });

    describe('Score Generation', () => {
      it('creates new game results with generated scores', async () => {
        const mockGroup = testFactories.tournamentGroup({
          id: 'group-1',
          tournament_id: 'tournament-1',
        });
        const mockGames: ExtendedGameData[] = [
          {
            ...testFactories.game({ id: 'game-1', tournament_id: 'tournament-1' }),
            homeTeam: testFactories.team({ id: 'team-1' }),
            awayTeam: testFactories.team({ id: 'team-2' }),
          } as ExtendedGameData,
        ];

        mockFindTournamentgroupById.mockResolvedValue(mockGroup);
        mockFindGamesInGroup.mockResolvedValue(mockGames);
        mockFindGameResultByGameIds.mockResolvedValue([]);
        mockFindTeamsInGroup.mockResolvedValue([]);

        mockGenerateMatchScore.mockReturnValue({
          homeScore: 3,
          awayScore: 2,
        });

        const result = await autoFillGameScores('group-1');

        expect(result.success).toBe(true);

        // Verify createGameResult was called with generated scores
        expect(mockCreateGameResult).toHaveBeenCalledTimes(1);
        expect(mockCreateGameResult).toHaveBeenCalledWith({
          game_id: 'game-1',
          home_score: 3,
          away_score: 2,
          home_penalty_score: undefined,
          away_penalty_score: undefined,
          is_draft: false,
        });
      });

      it('updates existing draft results with generated scores', async () => {
        const mockGroup = testFactories.tournamentGroup({
          id: 'group-1',
          tournament_id: 'tournament-1',
        });
        const mockGames: ExtendedGameData[] = [
          {
            ...testFactories.game({ id: 'game-1', tournament_id: 'tournament-1' }),
            homeTeam: testFactories.team({ id: 'team-1' }),
            awayTeam: testFactories.team({ id: 'team-2' }),
          } as ExtendedGameData,
        ];

        const draftResult = testFactories.gameResult({
          game_id: 'game-1',
          home_score: 0,
          away_score: 0,
          is_draft: true,
        });

        mockFindTournamentgroupById.mockResolvedValue(mockGroup);
        mockFindGamesInGroup.mockResolvedValue(mockGames);
        mockFindGameResultByGameIds.mockResolvedValue([draftResult]);
        mockFindTeamsInGroup.mockResolvedValue([]);

        mockGenerateMatchScore.mockReturnValue({
          homeScore: 2,
          awayScore: 1,
        });

        const result = await autoFillGameScores('group-1');

        expect(result.success).toBe(true);

        // Verify updateGameResult was called with generated scores
        expect(mockUpdateGameResult).toHaveBeenCalledTimes(1);
        expect(mockUpdateGameResult).toHaveBeenCalledWith('game-1', {
          home_score: 2,
          away_score: 1,
          home_penalty_score: undefined,
          away_penalty_score: undefined,
          is_draft: false,
        });
      });

      it('publishes scores immediately (is_draft=false)', async () => {
        const mockGroup = testFactories.tournamentGroup({
          id: 'group-1',
          tournament_id: 'tournament-1',
        });
        const mockGames: ExtendedGameData[] = [
          {
            ...testFactories.game({ id: 'game-1', tournament_id: 'tournament-1' }),
            homeTeam: testFactories.team({ id: 'team-1' }),
            awayTeam: testFactories.team({ id: 'team-2' }),
          } as ExtendedGameData,
        ];

        mockFindTournamentgroupById.mockResolvedValue(mockGroup);
        mockFindGamesInGroup.mockResolvedValue(mockGames);
        mockFindGameResultByGameIds.mockResolvedValue([]);
        mockFindTeamsInGroup.mockResolvedValue([]);

        await autoFillGameScores('group-1');

        // Verify is_draft is false
        expect(mockCreateGameResult).toHaveBeenCalledWith(
          expect.objectContaining({
            is_draft: false,
          })
        );
      });
    });

    describe('Recalculation Pipeline', () => {
      it('triggers full recalculation pipeline after filling scores', async () => {
        const mockGroup = testFactories.tournamentGroup({
          id: 'group-1',
          tournament_id: 'tournament-1',
        });
        const mockGames: ExtendedGameData[] = [
          {
            ...testFactories.game({ id: 'game-1', tournament_id: 'tournament-1' }),
            homeTeam: testFactories.team({ id: 'team-1' }),
            awayTeam: testFactories.team({ id: 'team-2' }),
          } as ExtendedGameData,
        ];

        mockFindTournamentgroupById
          .mockResolvedValueOnce(mockGroup) // First call
          .mockResolvedValueOnce(mockGroup); // Second call in recalculation
        mockFindGamesInGroup
          .mockResolvedValueOnce(mockGames) // First call
          .mockResolvedValueOnce(mockGames); // Second call in recalculation
        mockFindGameResultByGameIds.mockResolvedValue([]);
        mockFindTeamsInGroup.mockResolvedValue([]);

        await autoFillGameScores('group-1');

        expect(mockCalculateAndSavePlayoffGamesForTournament).toHaveBeenCalledWith('tournament-1');
        expect(mockCalculateAndStoreGroupPosition).toHaveBeenCalled();
        expect(mockCalculateGameScores).toHaveBeenCalledWith(false, false);
        expect(mockCalculateAndStoreQualifiedTeamsScores).toHaveBeenCalledWith('tournament-1', 'es');
      });

      it('recalculates group standings for group stage games', async () => {
        const mockGroup = testFactories.tournamentGroup({
          id: 'group-1',
          tournament_id: 'tournament-1',
          sort_by_games_between_teams: true,
        });
        const mockGames: ExtendedGameData[] = [
          {
            ...testFactories.game({ id: 'game-1', tournament_id: 'tournament-1' }),
            homeTeam: testFactories.team({ id: 'team-1' }),
            awayTeam: testFactories.team({ id: 'team-2' }),
          } as ExtendedGameData,
        ];
        const mockTeams = [
          testFactories.tournamentGroupTeam({ team_id: 'team-1' }),
          testFactories.tournamentGroupTeam({ team_id: 'team-2' }),
        ];

        mockFindTournamentgroupById
          .mockResolvedValueOnce(mockGroup)
          .mockResolvedValueOnce(mockGroup);
        mockFindGamesInGroup
          .mockResolvedValueOnce(mockGames)
          .mockResolvedValueOnce(mockGames);
        mockFindGameResultByGameIds.mockResolvedValue([]);
        mockFindTeamsInGroup.mockResolvedValue(mockTeams);

        await autoFillGameScores('group-1');

        expect(mockCalculateAndStoreGroupPosition).toHaveBeenCalledWith(
          'group-1',
          ['team-1', 'team-2'],
          mockGames,
          true
        );
      });

      it('skips group recalculation for playoff games', async () => {
        const mockRound = testFactories.playoffRound({
          id: 'round-1',
          tournament_id: 'tournament-1',
        });
        const mockGames: ExtendedGameData[] = [
          {
            ...testFactories.game({
              id: 'game-1',
              tournament_id: 'tournament-1',
              game_type: 'playoff',
            }),
            homeTeam: testFactories.team({ id: 'team-1' }),
            awayTeam: testFactories.team({ id: 'team-2' }),
            playoffStage: {
              tournament_playoff_round_id: 'round-1',
              round_name: 'Round 1',
              is_final: false,
              is_third_place: false,
            },
          } as ExtendedGameData,
        ];

        const mockQuery = {
          selectAll: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue(mockRound),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);
        mockFindGamesInTournament.mockResolvedValue(mockGames);
        mockFindGameResultByGameIds.mockResolvedValue([]);

        // Mock recalculation functions
        mockCalculateAndSavePlayoffGamesForTournament.mockResolvedValue(undefined);
        mockCalculateGameScores.mockResolvedValue(undefined);
        mockCalculateAndStoreQualifiedTeamsScores.mockResolvedValue(undefined);

        await autoFillGameScores(undefined, 'round-1');

        // Group position should NOT be called for playoff games
        expect(mockCalculateAndStoreGroupPosition).not.toHaveBeenCalled();
        // But other recalculations should still run
        expect(mockCalculateAndSavePlayoffGamesForTournament).toHaveBeenCalled();
        expect(mockCalculateGameScores).toHaveBeenCalled();
      });
    });

    describe('Error Handling', () => {
      it('returns error when repository function fails', async () => {
        const mockGroup = testFactories.tournamentGroup({
          id: 'group-1',
          tournament_id: 'tournament-1',
        });
        const mockGames: ExtendedGameData[] = [
          {
            ...testFactories.game({ id: 'game-1', tournament_id: 'tournament-1' }),
            homeTeam: testFactories.team({ id: 'team-1' }),
            awayTeam: testFactories.team({ id: 'team-2' }),
          } as ExtendedGameData,
        ];

        mockFindTournamentgroupById.mockResolvedValue(mockGroup);
        mockFindGamesInGroup.mockResolvedValue(mockGames);
        mockFindGameResultByGameIds.mockResolvedValue([]);

        // Mock createGameResult to throw error
        mockCreateGameResult.mockRejectedValueOnce(new Error('Database connection failed'));

        const result = await autoFillGameScores('group-1');

        expect(result.success).toBe(false);
        expect(result.error).toBe('generic');
      });
    });
  });

  describe('clearGameScores', () => {
    describe('Authorization', () => {
      it('allows admin user to clear scores', async () => {
        const mockGroup = testFactories.tournamentGroup({
          id: 'group-1',
          tournament_id: 'tournament-1',
        });
        const mockGames: ExtendedGameData[] = [
          {
            ...testFactories.game({ id: 'game-1', tournament_id: 'tournament-1' }),
            homeTeam: testFactories.team({ id: 'team-1' }),
            awayTeam: testFactories.team({ id: 'team-2' }),
            gameResult: testFactories.gameResult({ game_id: 'game-1' }),
          } as ExtendedGameData,
        ];

        mockFindTournamentgroupById.mockResolvedValue(mockGroup);
        mockFindGamesInGroup.mockResolvedValue(mockGames);

        const result = await clearGameScores('group-1');

        expect(result.success).toBe(true);
        expect(result.clearedCount).toBe(1);
        expect(result.error).toBeUndefined();
      });

      it('rejects non-admin user', async () => {
        mockAuth.mockResolvedValue({
          user: mockRegularUser,
          expires: '2024-12-31',
        } as any);

        const result = await clearGameScores('group-1');

        expect(result.success).toBe(false);
        expect(result.error).toBe('scoreGenerator.unauthorized');
        expect(mockFindGamesInGroup).not.toHaveBeenCalled();
      });

      it('rejects when user is not logged in', async () => {
        mockAuth.mockResolvedValue(null);

        const result = await clearGameScores('group-1');

        expect(result.success).toBe(false);
        expect(result.error).toBe('scoreGenerator.unauthorized');
        expect(mockFindGamesInGroup).not.toHaveBeenCalled();
      });
    });

    describe('Input Validation', () => {
      it('requires either groupId or playoffRoundId', async () => {
        const result = await clearGameScores();

        expect(result.success).toBe(false);
        expect(result.error).toBe('scoreGenerator.requireGroupOrPlayoff');
        expect(mockFindGamesInGroup).not.toHaveBeenCalled();
      });

      it('returns error when group not found', async () => {
        mockFindTournamentgroupById.mockResolvedValue(null);

        const result = await clearGameScores('non-existent-group');

        expect(result.success).toBe(false);
        expect(result.error).toBe('scoreGenerator.groupNotFound');
      });

      it('returns error when playoff round not found', async () => {
        const mockQuery = {
          selectAll: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue(null),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await clearGameScores(undefined, 'non-existent-round');

        expect(result.success).toBe(false);
        expect(result.error).toBe('scoreGenerator.playoffRoundNotFound');
      });
    });

    describe('Game Result Deletion', () => {
      it('deletes game results for games with results', async () => {
        const mockGroup = testFactories.tournamentGroup({
          id: 'group-1',
          tournament_id: 'tournament-1',
        });
        const mockGames: ExtendedGameData[] = [
          {
            ...testFactories.game({ id: 'game-1', tournament_id: 'tournament-1' }),
            homeTeam: testFactories.team({ id: 'team-1' }),
            awayTeam: testFactories.team({ id: 'team-2' }),
            gameResult: testFactories.gameResult({ game_id: 'game-1' }),
          } as ExtendedGameData,
          {
            ...testFactories.game({ id: 'game-2', tournament_id: 'tournament-1' }),
            homeTeam: testFactories.team({ id: 'team-3' }),
            awayTeam: testFactories.team({ id: 'team-4' }),
            gameResult: testFactories.gameResult({ game_id: 'game-2' }),
          } as ExtendedGameData,
        ];

        mockFindTournamentgroupById.mockResolvedValue(mockGroup);
        mockFindGamesInGroup.mockResolvedValue(mockGames);

        const result = await clearGameScores('group-1');

        expect(result.success).toBe(true);
        expect(result.clearedCount).toBe(2);

        // Verify updateGameResult was called for both games to clear scores
        expect(mockUpdateGameResult).toHaveBeenCalledTimes(2);
        expect(mockUpdateGameResult).toHaveBeenCalledWith('game-1', {
          home_score: undefined,
          away_score: undefined,
          home_penalty_score: undefined,
          away_penalty_score: undefined,
          is_draft: true,
        });
        expect(mockUpdateGameResult).toHaveBeenCalledWith('game-2', {
          home_score: undefined,
          away_score: undefined,
          home_penalty_score: undefined,
          away_penalty_score: undefined,
          is_draft: true,
        });
      });

      it('returns success with zero cleared when no games have results', async () => {
        const mockGroup = testFactories.tournamentGroup({
          id: 'group-1',
          tournament_id: 'tournament-1',
        });
        const mockGames: ExtendedGameData[] = [
          {
            ...testFactories.game({ id: 'game-1', tournament_id: 'tournament-1' }),
            homeTeam: testFactories.team({ id: 'team-1' }),
            awayTeam: testFactories.team({ id: 'team-2' }),
            // No gameResult
          } as ExtendedGameData,
        ];

        mockFindTournamentgroupById.mockResolvedValue(mockGroup);
        mockFindGamesInGroup.mockResolvedValue(mockGames);

        const result = await clearGameScores('group-1');

        expect(result.success).toBe(true);
        expect(result.clearedCount).toBe(0);
        expect(mockUpdateGameResult).not.toHaveBeenCalled();
      });

      it('only deletes results for games that have them', async () => {
        const mockGroup = testFactories.tournamentGroup({
          id: 'group-1',
          tournament_id: 'tournament-1',
        });
        const mockGames: ExtendedGameData[] = [
          {
            ...testFactories.game({ id: 'game-1', tournament_id: 'tournament-1' }),
            homeTeam: testFactories.team({ id: 'team-1' }),
            awayTeam: testFactories.team({ id: 'team-2' }),
            gameResult: testFactories.gameResult({ game_id: 'game-1' }),
          } as ExtendedGameData,
          {
            ...testFactories.game({ id: 'game-2', tournament_id: 'tournament-1' }),
            homeTeam: testFactories.team({ id: 'team-3' }),
            awayTeam: testFactories.team({ id: 'team-4' }),
            // No gameResult
          } as ExtendedGameData,
        ];

        mockFindTournamentgroupById.mockResolvedValue(mockGroup);
        mockFindGamesInGroup.mockResolvedValue(mockGames);

        const result = await clearGameScores('group-1');

        expect(result.success).toBe(true);
        expect(result.clearedCount).toBe(1);

        // Verify updateGameResult was called only for game-1
        expect(mockUpdateGameResult).toHaveBeenCalledTimes(1);
        expect(mockUpdateGameResult).toHaveBeenCalledWith('game-1', {
          home_score: undefined,
          away_score: undefined,
          home_penalty_score: undefined,
          away_penalty_score: undefined,
          is_draft: true,
        });
      });
    });

    describe('Recalculation Pipeline', () => {
      it('triggers recalculation after deleting scores', async () => {
        const mockGroup = testFactories.tournamentGroup({
          id: 'group-1',
          tournament_id: 'tournament-1',
        });
        const mockGames: ExtendedGameData[] = [
          {
            ...testFactories.game({ id: 'game-1', tournament_id: 'tournament-1' }),
            homeTeam: testFactories.team({ id: 'team-1' }),
            awayTeam: testFactories.team({ id: 'team-2' }),
            gameResult: testFactories.gameResult({ game_id: 'game-1' }),
          } as ExtendedGameData,
        ];

        mockFindTournamentgroupById
          .mockResolvedValueOnce(mockGroup)
          .mockResolvedValueOnce(mockGroup);
        mockFindGamesInGroup
          .mockResolvedValueOnce(mockGames)
          .mockResolvedValueOnce(mockGames);
        mockFindTeamsInGroup.mockResolvedValue([]);

        await clearGameScores('group-1');

        expect(mockCalculateGameScores).toHaveBeenCalledWith(false, false);
        expect(mockCalculateAndStoreQualifiedTeamsScores).toHaveBeenCalledWith('tournament-1', 'es');
      });

      it('recalculates group standings for group stage games', async () => {
        const mockGroup = testFactories.tournamentGroup({
          id: 'group-1',
          tournament_id: 'tournament-1',
          sort_by_games_between_teams: false,
        });
        const mockGames: ExtendedGameData[] = [
          {
            ...testFactories.game({ id: 'game-1', tournament_id: 'tournament-1' }),
            homeTeam: testFactories.team({ id: 'team-1' }),
            awayTeam: testFactories.team({ id: 'team-2' }),
            gameResult: testFactories.gameResult({ game_id: 'game-1' }),
          } as ExtendedGameData,
        ];
        const mockTeams = [
          testFactories.tournamentGroupTeam({ team_id: 'team-1' }),
          testFactories.tournamentGroupTeam({ team_id: 'team-2' }),
        ];

        mockFindTournamentgroupById
          .mockResolvedValueOnce(mockGroup)
          .mockResolvedValueOnce(mockGroup);
        mockFindGamesInGroup
          .mockResolvedValueOnce(mockGames)
          .mockResolvedValueOnce(mockGames);
        mockFindTeamsInGroup.mockResolvedValue(mockTeams);

        await clearGameScores('group-1');

        expect(mockCalculateAndStoreGroupPosition).toHaveBeenCalledWith(
          'group-1',
          ['team-1', 'team-2'],
          mockGames,
          false
        );
      });

      it('skips group recalculation for playoff games', async () => {
        const mockRound = testFactories.playoffRound({
          id: 'round-1',
          tournament_id: 'tournament-1',
        });
        const mockGames: ExtendedGameData[] = [
          {
            ...testFactories.game({
              id: 'game-1',
              tournament_id: 'tournament-1',
              game_type: 'playoff',
            }),
            homeTeam: testFactories.team({ id: 'team-1' }),
            awayTeam: testFactories.team({ id: 'team-2' }),
            gameResult: testFactories.gameResult({ game_id: 'game-1' }),
            playoffStage: {
              tournament_playoff_round_id: 'round-1',
              round_name: 'Round 1',
              is_final: false,
              is_third_place: false,
            },
          } as ExtendedGameData,
        ];

        const mockQuery = {
          selectAll: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue(mockRound),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);
        mockFindGamesInTournament.mockResolvedValue(mockGames);

        // Mock recalculation functions
        mockCalculateGameScores.mockResolvedValue(undefined);
        mockCalculateAndStoreQualifiedTeamsScores.mockResolvedValue(undefined);

        await clearGameScores(undefined, 'round-1');

        // Group position should NOT be called for playoff games
        expect(mockCalculateAndStoreGroupPosition).not.toHaveBeenCalled();
        // But other recalculations should still run
        expect(mockCalculateGameScores).toHaveBeenCalled();
      });
    });

    describe('Error Handling', () => {
      it('returns error when transaction fails', async () => {
        const mockGroup = testFactories.tournamentGroup({
          id: 'group-1',
          tournament_id: 'tournament-1',
        });
        const mockGames: ExtendedGameData[] = [
          {
            ...testFactories.game({ id: 'game-1', tournament_id: 'tournament-1' }),
            homeTeam: testFactories.team({ id: 'team-1' }),
            awayTeam: testFactories.team({ id: 'team-2' }),
            gameResult: testFactories.gameResult({ game_id: 'game-1' }),
          } as ExtendedGameData,
        ];

        mockFindTournamentgroupById.mockResolvedValue(mockGroup);
        mockFindGamesInGroup.mockResolvedValue(mockGames);

        // Mock updateGameResult to throw error
        mockUpdateGameResult.mockRejectedValueOnce(new Error('Database connection failed'));

        const result = await clearGameScores('group-1');

        expect(result.success).toBe(false);
        expect(result.error).toBe('generic');
      });
    });
  });
});
