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

// ── Mock helpers ────────────────────────────────────────────────────────────

const makeGameStats = (overrides: Record<string, number> = {}) => ({
  total_games: 0,
  total_group_games: 0,
  completed_games: 0,
  completed_group_games: 0,
  silver_boosts_used: 0,
  golden_boosts_used: 0,
  ...overrides,
})

const makePlayoffRound = (id: string, overrides: Record<string, unknown> = {}) => ({
  id,
  round_name: 'Round of 16',
  round_order: 1,
  is_final: false,
  is_third_place: false,
  is_first_stage: true,
  total_games: 8,
  completed_games: 0,
  ...overrides,
})

// New implementation calls selectFrom exactly twice in parallel:
//   1st: fetchGameAndBoostStats  → executeTakeFirst → aggregate stats object
//   2nd: fetchPlayoffRoundsWithCompletion → execute → array of round objects
function mockSelectQueries(
  gameStats: ReturnType<typeof makeGameStats> | null,
  playoffRounds: ReturnType<typeof makePlayoffRound>[]
) {
  vi.mocked(db.selectFrom)
    .mockReturnValueOnce(createMockSelectQuery(gameStats) as any)
    .mockReturnValueOnce(createMockSelectQuery(playoffRounds) as any)
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('Tournament Prediction Completion Repository', () => {
  const mockFindTournamentGuess = vi.mocked(tournamentGuessRepository.findTournamentGuessByUserIdTournament);
  const mockGetTournamentStartDate = vi.mocked(tournamentActions.getTournamentStartDate);
  const mockGetAllUserGroupPositionsPredictions = vi.mocked(qualifiedTeamsRepository.getAllUserGroupPositionsPredictions);

  const userId = 'user-1';
  const tournamentId = 'tournament-1';
  const mockTournament = testFactories.tournament({ id: tournamentId });

  // A single first-stage round with 16 games → totalQualifierSlots = 32
  const defaultPlayoffRounds = [makePlayoffRound('r1', { is_first_stage: true, total_games: 16 })]
  const oneDayAgo = () => new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
  const sixDaysAgo = () => new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTournamentPredictionCompletion', () => {
    it('should return 0% completion when user has no predictions', async () => {
      mockFindTournamentGuess.mockResolvedValue(undefined);
      mockGetAllUserGroupPositionsPredictions.mockResolvedValue([]);
      mockSelectQueries(makeGameStats({ total_games: 20 }), defaultPlayoffRounds)
      mockGetTournamentStartDate.mockResolvedValue(oneDayAgo());

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

      mockSelectQueries(
        makeGameStats({ total_games: 20, completed_games: 10, silver_boosts_used: 2, golden_boosts_used: 1 }),
        defaultPlayoffRounds
      )
      mockGetTournamentStartDate.mockResolvedValue(oneDayAgo());

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

      // 8 groups × 4 qualifying teams = 32 total qualifiers
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

      mockSelectQueries(
        makeGameStats({ total_games: 20, completed_games: 20, silver_boosts_used: 10, golden_boosts_used: 5 }),
        defaultPlayoffRounds
      )
      mockGetTournamentStartDate.mockResolvedValue(oneDayAgo());

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

    it('should mark predictions as locked after 2 days', async () => {
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
      mockGetAllUserGroupPositionsPredictions.mockResolvedValue([]);
      mockSelectQueries(makeGameStats({ total_games: 20 }), defaultPlayoffRounds)
      mockGetTournamentStartDate.mockResolvedValue(sixDaysAgo());

      const result = await getTournamentPredictionCompletion(userId, tournamentId, mockTournament);

      expect(result.isPredictionLocked).toBe(true);
      expect(result.overallPercentage).toBe(3); // 1/39 * 100 = 2.56... -> 3
    });

    it('should handle tournaments with no playoff games', async () => {
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
      mockGetAllUserGroupPositionsPredictions.mockResolvedValue([]);
      // Empty playoff rounds → totalQualifierSlots = 0
      mockSelectQueries(makeGameStats(), [])
      mockGetTournamentStartDate.mockResolvedValue(oneDayAgo());

      const result = await getTournamentPredictionCompletion(userId, tournamentId, mockTournament);

      expect(result.qualifiers.completed).toBe(0);
      expect(result.qualifiers.total).toBe(0);
      expect(result.overallCompleted).toBe(7); // 3 + 4 + 0
      expect(result.overallTotal).toBe(7); // 3 + 4 + 0
      expect(result.overallPercentage).toBe(100);
    });

    it('should correctly identify individual prediction statuses', async () => {
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
      mockGetAllUserGroupPositionsPredictions.mockResolvedValue([]);
      mockSelectQueries(makeGameStats(), [])
      mockGetTournamentStartDate.mockResolvedValue(oneDayAgo());

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
        mockFindTournamentGuess.mockResolvedValue(undefined);
        mockGetAllUserGroupPositionsPredictions.mockResolvedValue([]);
        mockSelectQueries(makeGameStats({ total_games: 10, completed_games: 0 }), [])
        mockGetTournamentStartDate.mockResolvedValue(oneDayAgo());

        const result = await getTournamentPredictionCompletion(userId, tournamentId, mockTournament);

        expect(result.completedGames).toBe(0);
        expect(result.totalGames).toBe(10);
      });

      it('should count completed games correctly when user has predictions', async () => {
        mockFindTournamentGuess.mockResolvedValue(undefined);
        mockGetAllUserGroupPositionsPredictions.mockResolvedValue([]);
        mockSelectQueries(makeGameStats({ total_games: 20, completed_games: 15 }), [])
        mockGetTournamentStartDate.mockResolvedValue(oneDayAgo());

        const result = await getTournamentPredictionCompletion(userId, tournamentId, mockTournament);

        expect(result.completedGames).toBe(15);
        expect(result.totalGames).toBe(20);
      });

      it('should handle partial game predictions (only one score filled)', async () => {
        mockFindTournamentGuess.mockResolvedValue(undefined);
        mockGetAllUserGroupPositionsPredictions.mockResolvedValue([]);
        // completed_games only counts rows where BOTH scores are set
        mockSelectQueries(makeGameStats({ total_games: 10, completed_games: 5 }), [])
        mockGetTournamentStartDate.mockResolvedValue(oneDayAgo());

        const result = await getTournamentPredictionCompletion(userId, tournamentId, mockTournament);

        // Only games with BOTH scores filled are counted as completed
        expect(result.completedGames).toBe(5);
        expect(result.totalGames).toBe(10);
      });

      it('should handle tournament with no games', async () => {
        mockFindTournamentGuess.mockResolvedValue(undefined);
        mockGetAllUserGroupPositionsPredictions.mockResolvedValue([]);
        mockSelectQueries(makeGameStats(), [])
        mockGetTournamentStartDate.mockResolvedValue(oneDayAgo());

        const result = await getTournamentPredictionCompletion(userId, tournamentId, mockTournament);

        expect(result.completedGames).toBe(0);
        expect(result.totalGames).toBe(0);
      });
    });

    describe('Boost Tracking', () => {
      it('should return 0 boosts used when user has no game predictions', async () => {
        mockFindTournamentGuess.mockResolvedValue(undefined);
        mockGetAllUserGroupPositionsPredictions.mockResolvedValue([]);
        mockSelectQueries(makeGameStats({ total_games: 10 }), [])
        mockGetTournamentStartDate.mockResolvedValue(oneDayAgo());

        const result = await getTournamentPredictionCompletion(userId, tournamentId, mockTournament);

        expect(result.silverBoostsUsed).toBe(0);
        expect(result.goldenBoostsUsed).toBe(0);
        expect(result.silverBoostsMax).toBe(5); // From mockTournament default
        expect(result.goldenBoostsMax).toBe(3); // From mockTournament default
      });

      it('should count silver boosts correctly', async () => {
        mockFindTournamentGuess.mockResolvedValue(undefined);
        mockGetAllUserGroupPositionsPredictions.mockResolvedValue([]);
        mockSelectQueries(
          makeGameStats({ total_games: 10, completed_games: 10, silver_boosts_used: 3 }),
          []
        )
        mockGetTournamentStartDate.mockResolvedValue(oneDayAgo());

        const result = await getTournamentPredictionCompletion(userId, tournamentId, mockTournament);

        expect(result.silverBoostsUsed).toBe(3);
        expect(result.goldenBoostsUsed).toBe(0);
        expect(result.silverBoostsMax).toBe(5);
        expect(result.goldenBoostsMax).toBe(3);
      });

      it('should count golden boosts correctly', async () => {
        mockFindTournamentGuess.mockResolvedValue(undefined);
        mockGetAllUserGroupPositionsPredictions.mockResolvedValue([]);
        mockSelectQueries(
          makeGameStats({ total_games: 10, completed_games: 10, golden_boosts_used: 2 }),
          []
        )
        mockGetTournamentStartDate.mockResolvedValue(oneDayAgo());

        const result = await getTournamentPredictionCompletion(userId, tournamentId, mockTournament);

        expect(result.silverBoostsUsed).toBe(0);
        expect(result.goldenBoostsUsed).toBe(2);
        expect(result.silverBoostsMax).toBe(5);
        expect(result.goldenBoostsMax).toBe(3);
      });

      it('should count both silver and golden boosts correctly', async () => {
        mockFindTournamentGuess.mockResolvedValue(undefined);
        mockGetAllUserGroupPositionsPredictions.mockResolvedValue([]);
        mockSelectQueries(
          makeGameStats({ total_games: 20, completed_games: 20, silver_boosts_used: 5, golden_boosts_used: 3 }),
          []
        )
        mockGetTournamentStartDate.mockResolvedValue(oneDayAgo());

        const result = await getTournamentPredictionCompletion(userId, tournamentId, mockTournament);

        expect(result.silverBoostsUsed).toBe(5);
        expect(result.goldenBoostsUsed).toBe(3);
        expect(result.silverBoostsMax).toBe(5);
        expect(result.goldenBoostsMax).toBe(3);
      });

      it('should use custom tournament boost limits', async () => {
        const customTournament = testFactories.tournament({
          id: tournamentId,
          max_silver_games: 10,
          max_golden_games: 7,
        });

        mockFindTournamentGuess.mockResolvedValue(undefined);
        mockGetAllUserGroupPositionsPredictions.mockResolvedValue([]);
        mockSelectQueries(
          makeGameStats({ total_games: 10, completed_games: 10, silver_boosts_used: 8, golden_boosts_used: 5 }),
          []
        )
        mockGetTournamentStartDate.mockResolvedValue(oneDayAgo());

        const result = await getTournamentPredictionCompletion(userId, tournamentId, customTournament);

        expect(result.silverBoostsUsed).toBe(8);
        expect(result.goldenBoostsUsed).toBe(5);
        expect(result.silverBoostsMax).toBe(10);
        expect(result.goldenBoostsMax).toBe(7);
      });

      it('should handle tournaments with no boost limits (null values)', async () => {
        const noBoostTournament = testFactories.tournament({
          id: tournamentId,
          max_silver_games: null,
          max_golden_games: null,
        });

        mockFindTournamentGuess.mockResolvedValue(undefined);
        mockGetAllUserGroupPositionsPredictions.mockResolvedValue([]);
        mockSelectQueries(makeGameStats({ total_games: 10, completed_games: 10 }), [])
        mockGetTournamentStartDate.mockResolvedValue(oneDayAgo());

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
        const customTournament = testFactories.tournament({
          id: tournamentId,
          max_silver_games: 8,
          max_golden_games: 4,
        });

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

        // First-stage round with 8 games → totalQualifierSlots = 16
        mockSelectQueries(
          makeGameStats({ total_games: 48, completed_games: 40, silver_boosts_used: 7, golden_boosts_used: 3 }),
          [makePlayoffRound('r1', { is_first_stage: true, total_games: 8 })]
        )
        mockGetTournamentStartDate.mockResolvedValue(oneDayAgo());

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

    describe('playoffRoundsCompletion', () => {
      const setupBaseMocks = () => {
        mockFindTournamentGuess.mockResolvedValue(undefined)
        mockGetAllUserGroupPositionsPredictions.mockResolvedValue([])
        mockGetTournamentStartDate.mockResolvedValue(oneDayAgo())
      }

      it('playoffRoundsCompletion is empty Record when tournament has no playoff rounds', async () => {
        setupBaseMocks()
        mockSelectQueries(makeGameStats(), [])

        const result = await getTournamentPredictionCompletion(userId, tournamentId, mockTournament)
        expect(result.playoffRoundsCompletion).toEqual({})
      })

      it('per-round total matches number of games in that round', async () => {
        setupBaseMocks()
        mockSelectQueries(makeGameStats(), [
          makePlayoffRound('r1', { round_name: 'Round of 16', round_order: 1, total_games: 8, completed_games: 0 }),
        ])

        const result = await getTournamentPredictionCompletion(userId, tournamentId, mockTournament)
        expect(result.playoffRoundsCompletion['r1'].total).toBe(8)
        expect(result.playoffRoundsCompletion['r1'].completed).toBe(0)
      })

      it('per-round completed reflects user game guesses', async () => {
        setupBaseMocks()
        mockSelectQueries(makeGameStats(), [
          makePlayoffRound('r1', { round_name: 'Quarter-Finals', round_order: 2, total_games: 4, completed_games: 3 }),
        ])

        const result = await getTournamentPredictionCompletion(userId, tournamentId, mockTournament)
        expect(result.playoffRoundsCompletion['r1'].completed).toBe(3)
        expect(result.playoffRoundsCompletion['r1'].total).toBe(4)
      })

      it('returns correct round_name for each entry', async () => {
        setupBaseMocks()
        mockSelectQueries(makeGameStats(), [
          makePlayoffRound('r1', { round_name: 'Round of 16', round_order: 1, total_games: 8 }),
          makePlayoffRound('r2', { round_name: 'Quarter-Finals', round_order: 2, total_games: 4 }),
        ])

        const result = await getTournamentPredictionCompletion(userId, tournamentId, mockTournament)
        expect(result.playoffRoundsCompletion['r1'].round_name).toBe('Round of 16')
        expect(result.playoffRoundsCompletion['r2'].round_name).toBe('Quarter-Finals')
      })
    })
  });
});
