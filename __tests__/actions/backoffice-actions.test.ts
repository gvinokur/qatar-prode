import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  deleteDBTournamentTree,
  generateDbTournamentTeamPlayers,
  generateDbTournament,
  saveGameResults,
  saveGamesData,
  calculateAndSavePlayoffGamesForTournament,
  getGroupDataWithGamesAndTeams,
  recalculateAllPlayoffFirstRoundGameGuesses,
  calculateGameScores,
  findDataForAwards,
  updateTournamentAwards,
  updateTournamentHonorRoll,
  copyTournament,
  getTournamentPermissionData,
  updateTournamentPermissions,
  getRecentUnscoredGames,
  saveAndPublishSingleGameResult,
  saveGamesAndRecalculate,
} from '../../app/actions/backoffice-actions';
import { GameResult, Tournament, TournamentUpdate } from '../../app/db/tables-definition';
import { ExtendedGameData, ExtendedGroupData, ExtendedPlayoffRoundData } from '../../app/definitions';
import { testFactories } from '../db/test-factories';

// Mock the auth module
vi.mock('../../auth', () => ({
  auth: vi.fn(),
}));

// Mock revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock tournaments data
vi.mock('../../data/tournaments', () => ({
  default: [
    {
      tournament_name: 'Test Tournament',
      tournament_short_name: 'TT',
      tournament_theme: {
        primary_color: '#ff0000',
        secondary_color: '#00ff00',
        logo: 'test-logo.png',
        web_page: 'test.com'
      },
      teams: [
        {
          name: 'Team A',
          short_name: 'TA',
          primary_color: '#ff0000',
          secondary_color: '#ffffff'
        },
        {
          name: 'Team B',
          short_name: 'TB',
          primary_color: '#0000ff',
          secondary_color: '#ffffff'
        }
      ],
      groups: [
        {
          letter: 'A',
          teams: ['Team A', 'Team B']
        }
      ],
      playoffs: [
        {
          stage: 'Final',
          order: 1,
          games: 1,
          is_final: true,
          is_third_place: false
        }
      ],
      games: [
        {
          game_number: 1,
          home_team: 'Team A',
          away_team: 'Team B',
          date: new Date('2024-01-01'),
          location: 'Stadium A',
          group: 'A',
          playoff: null,
          home_team_rule: null,
          away_team_rule: null
        }
      ],
      players: [
        {
          name: 'Player 1',
          team: 'Team A',
          position: 'Forward',
          age: 25
        }
      ]
    }
  ]
}));

// Mock all database repositories
vi.mock('../../app/db/tournament-repository', () => ({
  createTournament: vi.fn(),
  createTournamentTeam: vi.fn(),
  deleteTournament: vi.fn(),
  deleteTournamentTeams: vi.fn(),
  findTournamentById: vi.fn(),
  findTournamentByName: vi.fn(),
  updateTournament: vi.fn(),
}));

vi.mock('../../app/db/team-repository', () => ({
  createTeam: vi.fn(),
  findGuessedQualifiedTeams: vi.fn(),
  findQualifiedTeams: vi.fn(),
  findTeamInGroup: vi.fn(),
  findTeamInTournament: vi.fn(),
  findTeamsByIds: vi.fn(),
  getTeamByName: vi.fn(),
}));

vi.mock('../../app/db/quick-score-repository', () => ({
  findRecentUnscoredGames: vi.fn(),
}));

vi.mock('../../app/db/tournament-group-repository', () => ({
  createTournamentGroup: vi.fn(),
  createTournamentGroupGame: vi.fn(),
  createTournamentGroupTeam: vi.fn(),
  deleteAllGroupsFromTournament: vi.fn(),
  findGroupsInTournament: vi.fn(),
  findGroupsWithGamesAndTeamsInTournament: vi.fn(),
  findTournamentgroupById: vi.fn(),
  updateTournamentGroupTeams: vi.fn(),
  findTeamsInGroup: vi.fn(),
}));

vi.mock('../../app/db/tournament-playoff-repository', () => ({
  createPlayoffRound: vi.fn(),
  createPlayoffRoundGame: vi.fn(),
  deleteAllPlayoffRoundsInTournament: vi.fn(),
  findPlayoffStagesWithGamesInTournament: vi.fn(),
  findPlayoffRoundsWithAvailabilityInfo: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../app/db/game-repository', () => ({
  createGame: vi.fn(),
  deleteAllGamesFromTournament: vi.fn(),
  findAllGamesWithPublishedResultsAndGameGuesses: vi.fn(),
  findGamesInGroup: vi.fn(),
  findGamesInTournament: vi.fn(),
  updateGame: vi.fn(),
}));

vi.mock('../../app/db/player-repository', () => ({
  createPlayer: vi.fn(),
  findAllPlayersInTournamentWithTeamData: vi.fn(),
  findPlayerByTeamAndTournament: vi.fn(),
  updatePlayer: vi.fn(),
  deleteAllPlayersInTournament: vi.fn(),
}));

vi.mock('../../app/db/tournament-venue-repository', () => ({
  findAllTournamentVenues: vi.fn(),
  createTournamentVenue: vi.fn(),
  deleteAllTournamentVenues: vi.fn(),
}));

vi.mock('../../app/db/tournament-third-place-rules-repository', () => ({
  findThirdPlaceRulesByTournament: vi.fn(),
  createThirdPlaceRule: vi.fn(),
  deleteThirdPlaceRulesByTournament: vi.fn(),
}));

vi.mock('../../app/db/game-result-repository', () => ({
  createGameResult: vi.fn(),
  findGameResultByGameId: vi.fn(),
  findGameResultByGameIds: vi.fn(),
  updateGameResult: vi.fn(),
  deleteAllGameResultsByTournamentId: vi.fn(),
}));

vi.mock('../../app/db/game-guess-repository', () => ({
  findAllGuessesForGamesWithResultsInDraft: vi.fn(),
  findGameGuessesByUserId: vi.fn(),
  updateGameGuess: vi.fn(),
  updateGameGuessWithBoost: vi.fn(),
  deleteAllGameGuessesByTournamentId: vi.fn(),
}));

vi.mock('../../app/utils/date-utils', () => ({
  getTodayYYYYMMDD: vi.fn(() => 20260206),
  getLocalGameTime: vi.fn((date: Date) => date.toISOString()),
  getUserLocalTime: vi.fn((date: Date) => date.toISOString()),
  getCompactGameTime: vi.fn((date: Date) => date.toISOString()),
  getCompactUserTime: vi.fn((date: Date) => date.toISOString()),
}));

vi.mock('../../app/db/tournament-guess-repository', () => ({
  findTournamentGuessByTournament: vi.fn(),
  updateTournamentGuess: vi.fn(),
  updateTournamentGuessByUserIdTournament: vi.fn(),
  deleteAllTournamentGuessesByTournamentId: vi.fn(),
  recalculateGameScoresForUsers: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../app/db/qualified-teams-repository', () => ({
  deleteAllTournamentGroupPositionsPredictions: vi.fn(),
}));

vi.mock('../../app/db/users-repository', () => ({
  findAllUsers: vi.fn(),
}));

vi.mock('../../app/db/tournament-view-permission-repository', () => ({
  findUserIdsForTournament: vi.fn(),
  removeAllTournamentPermissions: vi.fn(),
  addUsersToTournament: vi.fn(),
}));

vi.mock('../../app/actions/user-actions', () => ({
  getLoggedInUser: vi.fn(),
}));

vi.mock('../../app/actions/guesses-actions', () => ({
  updatePlayoffGameGuesses: vi.fn(),
}));

vi.mock('../../app/utils/playoff-teams-calculator', () => ({
  calculatePlayoffTeams: vi.fn(),
}));

vi.mock('../../app/utils/group-position-calculator', () => ({
  calculateGroupPosition: vi.fn(),
}));

vi.mock('../../app/utils/game-score-calculator', () => ({
  calculateScoreForGame: vi.fn(),
}));

vi.mock('../../app/utils/ObjectUtils', () => ({
  customToMap: vi.fn(),
  toMap: vi.fn(),
}));

vi.mock('../../app/utils/award-utils', () => ({
  awardsDefinition: [
    {
      property: 'best_player_id',
      label: 'Best Player',
      points: 3
    },
    {
      property: 'top_goalscorer_player_id',
      label: 'Top Goalscorer',
      points: 3
    }
  ]
}));

vi.mock('../../app/db/database', () => ({
  db: {
    selectFrom: vi.fn(() => ({
      select: vi.fn(() => ({
        execute: vi.fn().mockResolvedValue([])
      }))
    }))
  }
}));

vi.mock('../../app/db/score-history-repository', () => ({
  writeScoreSnapshot: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../app/actions/group-ranking-actions', () => ({
  recalculateGroupRankingsForUsers: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../app/actions/qualified-teams-scoring-actions', () => ({
  calculateAndStoreQualifiedTeamsScores: vi.fn().mockResolvedValue(undefined),
}));

// Import mocked functions
import * as tournamentRepository from '../../app/db/tournament-repository';
import * as teamRepository from '../../app/db/team-repository';
import * as quickScoreRepository from '../../app/db/quick-score-repository';
import * as tournamentGroupRepository from '../../app/db/tournament-group-repository';
import * as tournamentPlayoffRepository from '../../app/db/tournament-playoff-repository';
import * as gameRepository from '../../app/db/game-repository';
import * as playerRepository from '../../app/db/player-repository';
import * as gameResultRepository from '../../app/db/game-result-repository';
import * as gameGuessRepository from '../../app/db/game-guess-repository';
import * as tournamentGuessRepository from '../../app/db/tournament-guess-repository';
import * as qualifiedTeamsRepository from '../../app/db/qualified-teams-repository';
import * as tournamentVenueRepository from '../../app/db/tournament-venue-repository';
import * as tournamentThirdPlaceRulesRepository from '../../app/db/tournament-third-place-rules-repository';
import * as usersRepository from '../../app/db/users-repository';
import * as tournamentViewPermissionRepository from '../../app/db/tournament-view-permission-repository';
import * as userActions from '../../app/actions/user-actions';
import * as guessesActions from '../../app/actions/guesses-actions';
import * as playoffTeamsCalculator from '../../app/utils/playoff-teams-calculator';
import * as groupPositionCalculator from '../../app/utils/group-position-calculator';
import * as gameScoreCalculator from '../../app/utils/game-score-calculator';
import * as objectUtils from '../../app/utils/ObjectUtils';
import * as database from '../../app/db/database';
import * as qualifiedTeamsScoringActions from '../../app/actions/qualified-teams-scoring-actions';
import { revalidatePath } from 'next/cache';

// Mock functions
const mockDeleteAllGameGuessesByTournamentId = vi.mocked(gameGuessRepository.deleteAllGameGuessesByTournamentId);
const mockDeleteAllTournamentGuessesByTournamentId = vi.mocked(tournamentGuessRepository.deleteAllTournamentGuessesByTournamentId);
const mockDeleteAllTournamentGroupPositionsPredictions = vi.mocked(qualifiedTeamsRepository.deleteAllTournamentGroupPositionsPredictions);
const mockDeleteAllGamesFromTournament = vi.mocked(gameRepository.deleteAllGamesFromTournament);
const mockDeleteAllPlayoffRoundsInTournament = vi.mocked(tournamentPlayoffRepository.deleteAllPlayoffRoundsInTournament);
const mockDeleteAllGroupsFromTournament = vi.mocked(tournamentGroupRepository.deleteAllGroupsFromTournament);
const mockDeleteTournamentTeams = vi.mocked(tournamentRepository.deleteTournamentTeams);
const mockDeleteTournament = vi.mocked(tournamentRepository.deleteTournament);
const mockRevalidatePath = vi.mocked(revalidatePath);

const mockFindTournamentByName = vi.mocked(tournamentRepository.findTournamentByName);
const mockFindTournamentById = vi.mocked(tournamentRepository.findTournamentById);
const mockCreateTournament = vi.mocked(tournamentRepository.createTournament);
const mockUpdateTournament = vi.mocked(tournamentRepository.updateTournament);
const mockCreateTournamentTeam = vi.mocked(tournamentRepository.createTournamentTeam);

const mockFindTeamInTournament = vi.mocked(teamRepository.findTeamInTournament);
const mockFindPlayerByTeamAndTournament = vi.mocked(playerRepository.findPlayerByTeamAndTournament);
const mockUpdatePlayer = vi.mocked(playerRepository.updatePlayer);
const mockCreatePlayer = vi.mocked(playerRepository.createPlayer);
const mockGetTeamByName = vi.mocked(teamRepository.getTeamByName);
const mockCreateTeam = vi.mocked(teamRepository.createTeam);
const mockFindQualifiedTeams = vi.mocked(teamRepository.findQualifiedTeams);
const mockFindGuessedQualifiedTeams = vi.mocked(teamRepository.findGuessedQualifiedTeams);
const mockFindTeamInGroup = vi.mocked(teamRepository.findTeamInGroup);

const mockCreateTournamentGroup = vi.mocked(tournamentGroupRepository.createTournamentGroup);
const mockCreateTournamentGroupTeam = vi.mocked(tournamentGroupRepository.createTournamentGroupTeam);
const mockCreateTournamentGroupGame = vi.mocked(tournamentGroupRepository.createTournamentGroupGame);
const mockFindGroupsWithGamesAndTeamsInTournament = vi.mocked(tournamentGroupRepository.findGroupsWithGamesAndTeamsInTournament);
const mockFindGroupsInTournament = vi.mocked(tournamentGroupRepository.findGroupsInTournament);
const mockFindTournamentgroupById = vi.mocked(tournamentGroupRepository.findTournamentgroupById);
const _mockUpdateTournamentGroupTeams = vi.mocked(tournamentGroupRepository.updateTournamentGroupTeams);
const mockFindTeamsInGroup = vi.mocked(tournamentGroupRepository.findTeamsInGroup);

const mockCreatePlayoffRound = vi.mocked(tournamentPlayoffRepository.createPlayoffRound);
const mockCreatePlayoffRoundGame = vi.mocked(tournamentPlayoffRepository.createPlayoffRoundGame);
const mockFindPlayoffStagesWithGamesInTournament = vi.mocked(tournamentPlayoffRepository.findPlayoffStagesWithGamesInTournament);

const mockCreateGame = vi.mocked(gameRepository.createGame);
const mockUpdateGame = vi.mocked(gameRepository.updateGame);
const mockFindGamesInTournament = vi.mocked(gameRepository.findGamesInTournament);
const mockFindGamesInGroup = vi.mocked(gameRepository.findGamesInGroup);
const mockFindAllGamesWithPublishedResultsAndGameGuesses = vi.mocked(gameRepository.findAllGamesWithPublishedResultsAndGameGuesses);

const mockFindAllPlayersInTournamentWithTeamData = vi.mocked(playerRepository.findAllPlayersInTournamentWithTeamData);
const mockDeleteAllPlayersInTournament = vi.mocked(playerRepository.deleteAllPlayersInTournament);

const mockFindAllTournamentVenues = vi.mocked(tournamentVenueRepository.findAllTournamentVenues);
const mockCreateTournamentVenue = vi.mocked(tournamentVenueRepository.createTournamentVenue);
const mockDeleteAllTournamentVenues = vi.mocked(tournamentVenueRepository.deleteAllTournamentVenues);

const mockFindThirdPlaceRulesByTournament = vi.mocked(tournamentThirdPlaceRulesRepository.findThirdPlaceRulesByTournament);
const mockCreateThirdPlaceRule = vi.mocked(tournamentThirdPlaceRulesRepository.createThirdPlaceRule);
const mockDeleteThirdPlaceRulesByTournament = vi.mocked(tournamentThirdPlaceRulesRepository.deleteThirdPlaceRulesByTournament);

const mockCreateGameResult = vi.mocked(gameResultRepository.createGameResult);
const mockUpdateGameResult = vi.mocked(gameResultRepository.updateGameResult);
const mockFindGameResultByGameId = vi.mocked(gameResultRepository.findGameResultByGameId);
const mockFindGameResultByGameIds = vi.mocked(gameResultRepository.findGameResultByGameIds);
const mockDeleteAllGameResultsByTournamentId = vi.mocked(gameResultRepository.deleteAllGameResultsByTournamentId);

const mockFindGameGuessesByUserId = vi.mocked(gameGuessRepository.findGameGuessesByUserId);
const mockUpdateGameGuess = vi.mocked(gameGuessRepository.updateGameGuess);
const mockUpdateGameGuessWithBoost = vi.mocked(gameGuessRepository.updateGameGuessWithBoost);
const mockFindAllGuessesForGamesWithResultsInDraft = vi.mocked(gameGuessRepository.findAllGuessesForGamesWithResultsInDraft);

const mockFindTournamentGuessByTournament = vi.mocked(tournamentGuessRepository.findTournamentGuessByTournament);
const mockUpdateTournamentGuess = vi.mocked(tournamentGuessRepository.updateTournamentGuess);
const mockUpdateTournamentGuessByUserIdTournament = vi.mocked(tournamentGuessRepository.updateTournamentGuessByUserIdTournament);

const mockGetLoggedInUser = vi.mocked(userActions.getLoggedInUser);
const mockFindTeamsByIds = vi.mocked(teamRepository.findTeamsByIds);
const mockFindRecentUnscoredGames = vi.mocked(quickScoreRepository.findRecentUnscoredGames);

const mockUpdatePlayoffGameGuesses = vi.mocked(guessesActions.updatePlayoffGameGuesses);

const mockCalculatePlayoffTeams = vi.mocked(playoffTeamsCalculator.calculatePlayoffTeams);
const mockCalculateGroupPosition = vi.mocked(groupPositionCalculator.calculateGroupPosition);
const mockCalculateScoreForGame = vi.mocked(gameScoreCalculator.calculateScoreForGame);
const mockCustomToMap = vi.mocked(objectUtils.customToMap);
const mockToMap = vi.mocked(objectUtils.toMap);

const mockDb = vi.mocked(database.db);

const mockCalculateAndStoreQualifiedTeamsScores = vi.mocked(qualifiedTeamsScoringActions.calculateAndStoreQualifiedTeamsScores);

const mockFindAllUsers = vi.mocked(usersRepository.findAllUsers);
const mockFindUserIdsForTournament = vi.mocked(tournamentViewPermissionRepository.findUserIdsForTournament);
const mockRemoveAllTournamentPermissions = vi.mocked(tournamentViewPermissionRepository.removeAllTournamentPermissions);
const mockAddUsersToTournament = vi.mocked(tournamentViewPermissionRepository.addUsersToTournament);

describe('Backoffice Actions', () => {
  const mockAdminUser = {
    id: 'admin1',
    email: 'admin@example.com',
    emailVerified: new Date(),
    isAdmin: true
  };

  const mockRegularUser = {
    id: 'user1',
    email: 'user@example.com',
    emailVerified: new Date(),
    isAdmin: false
  };

  const mockTournament: Tournament = {
    id: 'tournament1',
    short_name: 'TT',
    long_name: 'Test Tournament',
    is_active: true,
    theme: {
      primary_color: '#ff0000',
      secondary_color: '#00ff00'
    },
    dev_only: false,
    display_name: true,
    champion_team_id: null,
    runner_up_team_id: null,
    third_place_team_id: null,
    best_player_id: undefined,
    top_goalscorer_player_id: undefined,
    best_goalkeeper_player_id: undefined,
    best_young_player_id: undefined,
    game_exact_score_points: 3,
    game_correct_outcome_points: 1,
    champion_points: 10,
    runner_up_points: 5,
    third_place_points: 3,
    individual_award_points: 5,
    qualified_team_points: 1,
    exact_position_qualified_points: 1,
    max_silver_games: 3,
    max_golden_games: 1,
    tiebreaker_mode: 'standard' as const,
  };

  const mockTeam = {
    id: 'team1',
    name: 'Team A',
    short_name: 'TA',
    theme: null
  };

  const mockPlayer = {
    id: 'player1',
    tournament_id: 'tournament1',
    team_id: 'team1',
    name: 'Player 1',
    age_at_tournament: 25,
    position: 'Forward',
    team: {
      id: 'team1',
      name: 'Team A',
      short_name: 'TA',
      theme: null
    }
  };

  const mockGame = {
    id: 'game1',
    tournament_id: 'tournament1',
    game_number: 1,
    home_team: 'team1',
    away_team: 'team2',
    game_date: new Date('2024-01-01'),
    location: 'Stadium A',
    game_type: 'group' as const,
    home_team_rule: undefined,
    away_team_rule: undefined,
    game_local_timezone: undefined,
  };

  const mockGameResult: GameResult = {
    game_id: 'game1',
    home_score: 2,
    away_score: 1,
    home_penalty_score: undefined,
    away_penalty_score: undefined,
    is_draft: false
  };

  const mockExtendedGameData: ExtendedGameData = {
    ...mockGame,
    gameResult: mockGameResult
  };

  const mockExtendedGroupData: ExtendedGroupData = {
    id: 'group1',
    tournament_id: 'tournament1',
    group_letter: 'A',
    sort_by_games_between_teams: false,
    teams: [{ team_id: 'team1' }],
    games: [{ game_id: 'game1' }]
  };

  const mockExtendedPlayoffRoundData: ExtendedPlayoffRoundData = {
    id: 'playoff1',
    tournament_id: 'tournament1',
    round_name: 'Final',
    round_order: 1,
    total_games: 1,
    is_final: true,
    is_third_place: false,
    is_first_stage: false,
    games: [{ game_id: 'game1' }]
  };

  const _mockTournamentGuess = {
    id: 'guess1',
    tournament_id: 'tournament1',
    user_id: 'user1',
    champion_team_id: 'team1',
    runner_up_team_id: 'team2',
    third_place_team_id: 'team3',
    best_player_id: 'player1',
    top_goalscorer_player_id: 'player2',
    best_goalkeeper_player_id: 'player3',
    best_young_player_id: 'player4',
    honor_roll_score: 0,
    individual_awards_score: 0,
    qualified_teams_score: 0,
    group_position_score: 0
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetLoggedInUser.mockResolvedValue(mockAdminUser);
    
    // Setup common mocks
    mockCustomToMap.mockImplementation((items, keyFn) => {
      const map: any = {};
      items.forEach(item => {
        map[keyFn(item) as string] = item;
      });
      return map;
    });
    
    mockToMap.mockImplementation((items) => {
      const map: any = {};
      items.forEach((item: any) => {
        map[item.id] = item;
      });
      return map;
    });

    mockDb.selectFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        execute: vi.fn().mockResolvedValue([{ id: 'user1' }, { id: 'user2' }])
      })
    } as any);
  });

  describe('deleteDBTournamentTree', () => {
    it('deletes all tournament data in correct order', async () => {
      const inactiveTournament = { ...mockTournament, is_active: false };
      await deleteDBTournamentTree(inactiveTournament);

      expect(mockRevalidatePath).toHaveBeenCalledWith(`/tournaments/${mockTournament.id}/backoffice`);
      expect(mockUpdateTournament).toHaveBeenCalledWith(mockTournament.id, {
        best_player_id: null,
        best_goalkeeper_player_id: null,
        top_goalscorer_player_id: null,
        best_young_player_id: null,
        champion_team_id: null,
        runner_up_team_id: null,
        third_place_team_id: null,
      });
      expect(mockDeleteAllGameGuessesByTournamentId).toHaveBeenCalledWith(mockTournament.id);
      expect(mockDeleteAllTournamentGuessesByTournamentId).toHaveBeenCalledWith(mockTournament.id);
      expect(mockDeleteAllTournamentGroupPositionsPredictions).toHaveBeenCalledWith(mockTournament.id);
      expect(mockDeleteAllPlayersInTournament).toHaveBeenCalledWith(mockTournament.id);
      expect(mockDeleteAllTournamentVenues).toHaveBeenCalledWith(mockTournament.id);
      expect(mockDeleteThirdPlaceRulesByTournament).toHaveBeenCalledWith(mockTournament.id);
      expect(mockDeleteAllGameResultsByTournamentId).toHaveBeenCalledWith(mockTournament.id);
      expect(mockDeleteAllGamesFromTournament).toHaveBeenCalledWith(mockTournament.id);
      expect(mockDeleteAllPlayoffRoundsInTournament).toHaveBeenCalledWith(mockTournament.id);
      expect(mockDeleteAllGroupsFromTournament).toHaveBeenCalledWith(mockTournament.id);
      expect(mockDeleteTournamentTeams).toHaveBeenCalledWith(mockTournament.id);
      expect(mockDeleteTournament).toHaveBeenCalledWith(mockTournament.id);
    });

    it('handles deletion errors gracefully', async () => {
      const inactiveTournament = { ...mockTournament, is_active: false };
      mockDeleteAllGameGuessesByTournamentId.mockRejectedValue(new Error('Database error'));

      await expect(deleteDBTournamentTree(inactiveTournament)).rejects.toThrow('Database error');
    });

    it('throws error when trying to delete active tournament', async () => {
      await expect(deleteDBTournamentTree(mockTournament)).rejects.toThrow('tournament.cannotDeleteActive');
    });
  });

  describe('generateDbTournamentTeamPlayers', () => {
    beforeEach(() => {
      mockFindTournamentByName.mockResolvedValue(mockTournament);
      mockFindTeamInTournament.mockResolvedValue([mockTeam]);
      mockFindPlayerByTeamAndTournament.mockResolvedValue(undefined);
      mockCreatePlayer.mockResolvedValue(mockPlayer);
    });

    it('creates players for tournament teams', async () => {
      const result = await generateDbTournamentTeamPlayers('Test Tournament');

      expect(mockFindTournamentByName).toHaveBeenCalledWith('Test Tournament');
      expect(mockFindTeamInTournament).toHaveBeenCalledWith(mockTournament.id);
      expect(mockCreatePlayer).toHaveBeenCalledWith({
        tournament_id: mockTournament.id,
        team_id: mockTeam.id,
        name: 'Player 1',
        age_at_tournament: 25,
        position: 'Forward'
      });
      expect(result).toEqual(['All players created']);
    });

    it('updates existing players', async () => {
      const existingPlayer = { ...mockPlayer, age_at_tournament: 24 };
      mockFindPlayerByTeamAndTournament.mockResolvedValue(existingPlayer);

      await generateDbTournamentTeamPlayers('Test Tournament');

      expect(mockUpdatePlayer).toHaveBeenCalledWith(existingPlayer.id, {
        ...existingPlayer,
        age_at_tournament: 25,
        position: 'Forward'
      });
    });

    it('throws error when tournament does not exist in database', async () => {
      mockFindTournamentByName.mockResolvedValue(undefined);

      await expect(generateDbTournamentTeamPlayers('Test Tournament'))
        .rejects.toBe('Cannot create players for a non existing tournament');
    });

    it('throws error when no teams exist', async () => {
      mockFindTeamInTournament.mockResolvedValue([]);

      await expect(generateDbTournamentTeamPlayers('Test Tournament'))
        .rejects.toBe('Cannot create players for a tournament without teams');
    });

    it('returns empty array when no tournaments match the name', async () => {
      const result = await generateDbTournamentTeamPlayers('Non-existent Tournament');
      
      expect(result).toEqual([]);
      expect(mockFindTournamentByName).not.toHaveBeenCalled();
    });
  });

  describe('generateDbTournament', () => {
    beforeEach(() => {
      mockFindTournamentByName.mockResolvedValue(undefined);
      mockCreateTournament.mockResolvedValue(mockTournament);
      mockGetTeamByName.mockResolvedValue(undefined);
      mockCreateTeam.mockResolvedValue(mockTeam);
      mockCreateTournamentTeam.mockResolvedValue({ tournament_id: 'tournament1', team_id: 'team1' });
      mockCreateTournamentGroup.mockResolvedValue({ id: 'group1', tournament_id: 'tournament1', group_letter: 'A', sort_by_games_between_teams: false });
      mockCreateTournamentGroupTeam.mockResolvedValue({ id: 'groupteam1', team_id: 'team1', position: 1, tournament_group_id: 'group1', games_played: 1, points: 1, win: 1, draw: 1, loss: 1, goals_for: 1, goals_against: 1, goal_difference: 1, conduct_score: 0, is_complete: true });
      mockCreatePlayoffRound.mockResolvedValue({ id: 'playoff1', tournament_id: 'tournament1', round_name: 'Final', round_order: 1, total_games: 1, is_final: true, is_third_place: false, is_first_stage: false });
      mockCreateGame.mockResolvedValue(mockGame);
      mockCreateTournamentGroupGame.mockResolvedValue({ tournament_group_id: 'group1', game_id: 'game1' });
      mockCreatePlayoffRoundGame.mockResolvedValue({ tournament_playoff_round_id: 'playoff1', game_id: 'game1' });
    });

    it('creates new tournament successfully', async () => {
      const result = await generateDbTournament('Test Tournament');

      expect(mockFindTournamentByName).toHaveBeenCalledWith('Test Tournament');
      expect(mockCreateTournament).toHaveBeenCalledWith({
        short_name: 'TT',
        long_name: 'Test Tournament',
        theme: JSON.stringify({
          primary_color: '#ff0000',
          secondary_color: '#00ff00',
          logo: 'test-logo.png',
          web_page: 'test.com'
        }),
        is_active: true
      });
      expect(result).toEqual(['El campeonato fue creado exitosamente']);
    });

    it('returns existing tournament message when tournament exists', async () => {
      mockFindTournamentByName.mockResolvedValue(mockTournament);

      const result = await generateDbTournament('Test Tournament');

      expect(result).toEqual(['El torneo ya existe']);
      expect(mockCreateTournament).not.toHaveBeenCalled();
    });

    it('deletes existing tournament when deletePrevious is true', async () => {
      const inactiveTournament = { ...mockTournament, is_active: false };
      mockFindTournamentByName.mockResolvedValue(inactiveTournament);
      mockDeleteAllGameGuessesByTournamentId.mockResolvedValue([]);
      mockDeleteAllPlayersInTournament.mockResolvedValue([]);
      mockDeleteAllTournamentVenues.mockResolvedValue([]);
      mockDeleteThirdPlaceRulesByTournament.mockResolvedValue([]);

      const result = await generateDbTournament('Test Tournament', true);

      expect(result).toEqual(['Primero lo borro']);
    });

    it('uses existing teams when available', async () => {
      mockGetTeamByName.mockResolvedValue(mockTeam);

      await generateDbTournament('Test Tournament');

      expect(mockCreateTeam).not.toHaveBeenCalled();
      expect(mockCreateTournamentTeam).toHaveBeenCalledWith({
        tournament_id: mockTournament.id,
        team_id: mockTeam.id
      });
    });

    it('handles creation errors gracefully', async () => {
      mockCreateTournament.mockRejectedValue(new Error('Database error'));

      const result = await generateDbTournament('Test Tournament');

      expect(result).toEqual(['El campeonato no pudo ser creado']);
    });
  });

  describe('saveGameResults', () => {
    it('creates new game results when none exist', async () => {
      mockFindGameResultByGameId.mockResolvedValue(undefined);

      await saveGameResults([mockExtendedGameData]);

      expect(mockCreateGameResult).toHaveBeenCalledWith(mockGameResult);
      expect(mockUpdateGameResult).not.toHaveBeenCalled();
    });

    it('updates existing game results', async () => {
      mockFindGameResultByGameId.mockResolvedValue(mockGameResult);

      await saveGameResults([mockExtendedGameData]);

      expect(mockUpdateGameResult).toHaveBeenCalledWith(mockGame.id, mockGameResult);
      expect(mockCreateGameResult).not.toHaveBeenCalled();
    });

    it('skips games without results', async () => {
      const gameWithoutResult = { ...mockExtendedGameData, gameResult: undefined };

      await saveGameResults([gameWithoutResult]);

      expect(mockCreateGameResult).not.toHaveBeenCalled();
      expect(mockUpdateGameResult).not.toHaveBeenCalled();
    });

    it('triggers recalculation when changing scores on published results', async () => {
      const existingResult = { ...mockGameResult, is_draft: false, home_score: 1, away_score: 1 };
      const newResult = { ...mockGameResult, is_draft: false, home_score: 2, away_score: 1 };
      const gameWithNewScore = { ...mockExtendedGameData, gameResult: newResult };

      mockFindGameResultByGameId.mockResolvedValue(existingResult);
      // Mock the queries that calculateGameScores uses
      mockFindAllGamesWithPublishedResultsAndGameGuesses.mockResolvedValue([]);
      mockFindAllGuessesForGamesWithResultsInDraft.mockResolvedValue([]);

      await saveGameResults([gameWithNewScore]);

      // Should set to draft first
      expect(mockUpdateGameResult).toHaveBeenNthCalledWith(1, mockGame.id, { ...newResult, is_draft: true });
      // Should call calculateGameScores to cleanup
      expect(mockUpdateGameResult).toHaveBeenNthCalledWith(2, mockGame.id, { ...newResult, is_draft: false });
      expect(mockUpdateGameResult).toHaveBeenCalledTimes(2);
    });

    it('does not trigger recalculation when scores unchanged on published results', async () => {
      const existingResult = { ...mockGameResult, is_draft: false, home_score: 2, away_score: 1 };
      const sameResult = { ...mockGameResult, is_draft: false, home_score: 2, away_score: 1 };
      const gameWithSameScore = { ...mockExtendedGameData, gameResult: sameResult };

      mockFindGameResultByGameId.mockResolvedValue(existingResult);

      await saveGameResults([gameWithSameScore]);

      // Should just update normally
      expect(mockUpdateGameResult).toHaveBeenCalledWith(mockGame.id, sameResult);
      expect(mockUpdateGameResult).toHaveBeenCalledTimes(1);
    });

    it('does not trigger recalculation when changing draft results', async () => {
      const existingResult = { ...mockGameResult, is_draft: true, home_score: 1, away_score: 1 };
      const newResult = { ...mockGameResult, is_draft: true, home_score: 2, away_score: 1 };
      const gameWithNewScore = { ...mockExtendedGameData, gameResult: newResult };

      mockFindGameResultByGameId.mockResolvedValue(existingResult);

      await saveGameResults([gameWithNewScore]);

      // Should just update normally
      expect(mockUpdateGameResult).toHaveBeenCalledWith(mockGame.id, newResult);
      expect(mockUpdateGameResult).toHaveBeenCalledTimes(1);
    });

    it('triggers recalculation when penalty scores change on published results', async () => {
      const existingResult = { ...mockGameResult, is_draft: false, home_penalty_score: 3, away_penalty_score: 4 };
      const newResult = { ...mockGameResult, is_draft: false, home_penalty_score: 4, away_penalty_score: 5 };
      const gameWithNewPenalty = { ...mockExtendedGameData, gameResult: newResult };

      mockFindGameResultByGameId.mockResolvedValue(existingResult);
      // Mock the queries that calculateGameScores uses
      mockFindAllGamesWithPublishedResultsAndGameGuesses.mockResolvedValue([]);
      mockFindAllGuessesForGamesWithResultsInDraft.mockResolvedValue([]);

      await saveGameResults([gameWithNewPenalty]);

      // Should set to draft first, then republish
      expect(mockUpdateGameResult).toHaveBeenCalledWith(mockGame.id, { ...newResult, is_draft: true });
      expect(mockUpdateGameResult).toHaveBeenCalledTimes(2);
    });

    it('throws when trying to publish a new result with missing away score', async () => {
      mockFindGameResultByGameId.mockResolvedValue(undefined);
      const incompleteResult = { ...mockGameResult, away_score: undefined, is_draft: false };
      const gameWithIncompleteResult = { ...mockExtendedGameData, gameResult: incompleteResult };

      await expect(saveGameResults([gameWithIncompleteResult])).rejects.toThrow(
        'Cannot publish incomplete result'
      );
      expect(mockCreateGameResult).not.toHaveBeenCalled();
    });

    it('throws when trying to publish an existing result with missing home score', async () => {
      const incompleteResult = { ...mockGameResult, home_score: undefined, is_draft: false };
      const existingDraftResult = { ...mockGameResult, is_draft: true };
      mockFindGameResultByGameId.mockResolvedValue(existingDraftResult);
      const gameWithIncompleteResult = { ...mockExtendedGameData, gameResult: incompleteResult };

      await expect(saveGameResults([gameWithIncompleteResult])).rejects.toThrow(
        'Cannot publish incomplete result'
      );
    });

    it('throws when trying to publish a tied playoff game without penalty scores', async () => {
      mockFindGameResultByGameId.mockResolvedValue(undefined);
      const tiedPlayoffResult = {
        ...mockGameResult,
        home_score: 1,
        away_score: 1,
        home_penalty_score: undefined,
        away_penalty_score: undefined,
        is_draft: false,
      };
      const playoffGame = {
        ...mockExtendedGameData,
        playoffStage: { tournament_playoff_round_id: 'round1', round_name: 'Final', is_final: true, is_third_place: false },
        gameResult: tiedPlayoffResult,
      };

      await expect(saveGameResults([playoffGame])).rejects.toThrow(
        'Cannot publish incomplete result'
      );
    });

    it('does not throw when draft-saving an incomplete result', async () => {
      mockFindGameResultByGameId.mockResolvedValue(undefined);
      const draftIncomplete = { ...mockGameResult, away_score: undefined, is_draft: true };
      const gameWithDraftIncomplete = { ...mockExtendedGameData, gameResult: draftIncomplete };

      await expect(saveGameResults([gameWithDraftIncomplete])).resolves.not.toThrow();
      expect(mockCreateGameResult).toHaveBeenCalledWith(draftIncomplete);
    });
  });

  describe('saveGamesData', () => {
    it('updates game data correctly', async () => {
      await saveGamesData([mockExtendedGameData]);

      expect(mockUpdateGame).toHaveBeenCalledWith(mockGame.id, {
        home_team: mockGame.home_team,
        away_team: mockGame.away_team,
        game_date: mockGame.game_date
      });
    });

    it('handles multiple games', async () => {
      const game2 = { ...mockExtendedGameData, id: 'game2' };
      
      await saveGamesData([mockExtendedGameData, game2]);

      expect(mockUpdateGame).toHaveBeenCalledTimes(2);
    });
  });

  describe('calculateAndSavePlayoffGamesForTournament', () => {
    beforeEach(() => {
      mockFindGroupsWithGamesAndTeamsInTournament.mockResolvedValue([mockExtendedGroupData]);
      mockFindGamesInTournament.mockResolvedValue([mockGame]);
      mockFindPlayoffStagesWithGamesInTournament.mockResolvedValue([mockExtendedPlayoffRoundData]);
      mockFindGameResultByGameIds.mockResolvedValue([mockGameResult]);
      mockCalculatePlayoffTeams.mockReturnValue(Promise.resolve({
        [mockGame.id as string]: {
          game_id: mockGame.id,
          homeTeam: {
            team_id: 'team1',
            games_played: 0,
            points: 0,
            win: 0,
            draw: 0,
            loss: 0,
            goals_for: 0,
            goals_against: 0,
            goal_difference: 0,
            conduct_score: 0,
            is_complete: false
          },
          awayTeam: {
            team_id: 'team2',
            games_played: 0,
            points: 0,
            win: 0,
            draw: 0,
            loss: 0,
            goals_for: 0,
            goals_against: 0,
            goal_difference: 0,
            conduct_score: 0,
            is_complete: false
          }
        }
      }));
    });

    it('calculates and saves playoff games', async () => {
      await calculateAndSavePlayoffGamesForTournament('tournament1');

      expect(mockCalculatePlayoffTeams).toHaveBeenCalled();
      expect(mockUpdateGame).toHaveBeenCalledWith(mockGame.id, {
        home_team: 'team1',
        away_team: 'team2'
      });
    });

    it('handles null team calculations', async () => {
      mockCalculatePlayoffTeams.mockReturnValue(Promise.resolve({
        [mockGame.id as string]: {
          game_id: mockGame.id,
          homeTeam: null,
          awayTeam: null
        }
      }) as any);

      await calculateAndSavePlayoffGamesForTournament('tournament1');

      expect(mockUpdateGame).toHaveBeenCalledWith(mockGame.id, {
        home_team: null,
        away_team: null
      });
    });
  });

  describe('getGroupDataWithGamesAndTeams', () => {
    it('returns group data with games and teams', async () => {
      const mockGroups = [mockExtendedGroupData];
      mockFindGroupsWithGamesAndTeamsInTournament.mockResolvedValue(mockGroups);
      mockFindTournamentById.mockResolvedValue(mockTournament);

      const result = await getGroupDataWithGamesAndTeams('tournament1');

      expect(mockFindGroupsWithGamesAndTeamsInTournament).toHaveBeenCalledWith('tournament1');
      expect(result.groups).toEqual(mockGroups);
      // tiebreaker_mode not in mockTournament → defaults to 'standard'
      expect(result.tiebreakerMode).toBe('standard');
    });
  });

  describe('recalculateAllPlayoffFirstRoundGameGuesses', () => {
    beforeEach(() => {
      mockUpdatePlayoffGameGuesses.mockResolvedValue([{ id: 'guess1', game_number: 1, home_team: 'team1', away_team: 'team2', game_id: 'game1', home_score: 1, away_score: 2, user_id: 'user1', home_penalty_winner: false, away_penalty_winner: false, score: 1, boost_type: null, boost_multiplier: 1.0, final_score: 1, updated_at: new Date() }]);
    });

    it('recalculates playoff guesses for all users', async () => {
      const result = await recalculateAllPlayoffFirstRoundGameGuesses('tournament1');

      expect(mockUpdatePlayoffGameGuesses).toHaveBeenCalledTimes(2); // 2 users
      expect(result).toHaveLength(2);
    });

    it('filters out empty results', async () => {
      mockUpdatePlayoffGameGuesses.mockResolvedValue([]);

      const result = await recalculateAllPlayoffFirstRoundGameGuesses('tournament1');

      expect(result).toEqual([]);
    });
  });

  describe('calculateGameScores', () => {
    beforeEach(() => {
      mockFindTournamentById.mockResolvedValue(mockTournament);
      mockFindAllGamesWithPublishedResultsAndGameGuesses.mockResolvedValue([
        {
          ...mockGame,
          gameResult: mockGameResult,
          gameGuesses: [{ id: 'guess1', game_number: 1, home_team: 'team1', away_team: 'team2', game_id: 'game1', home_score: 1, away_score: 2, user_id: 'user1', home_penalty_winner: false, away_penalty_winner: false, score: 1, boost_type: null, boost_multiplier: 1.0, final_score: 1, updated_at: new Date() }]
        }
      ]);
      mockFindAllGuessesForGamesWithResultsInDraft.mockResolvedValue([
        { id: 'guess2', game_id: 'game2', game_number: 2, user_id: 'user2', home_team: 'team3', away_team: 'team4', home_score: 2, away_score: 1, home_penalty_winner: false, away_penalty_winner: false, score: 5, boost_type: null, boost_multiplier: 1.0, final_score: 5, updated_at: new Date() }
      ]);
      mockCalculateScoreForGame.mockReturnValue({ score: 2, tier: 'exact' });
      mockUpdateGameGuessWithBoost.mockResolvedValue({ id: 'guess1', game_number: 1, home_team: 'team1', away_team: 'team2', game_id: 'game1', home_score: 1, away_score: 2, user_id: 'user1', home_penalty_winner: false, away_penalty_winner: false, score: 2, boost_type: null, boost_multiplier: 1.0, final_score: 2, updated_at: new Date() });
    });

    it('calculates and updates game scores', async () => {
      const result = await calculateGameScores(false, false);

      expect(mockCalculateScoreForGame).toHaveBeenCalled();
      expect(mockUpdateGameGuessWithBoost).toHaveBeenCalledWith('guess1', 2, null, 'exact');
      expect(mockUpdateGameGuess).toHaveBeenCalledWith('guess2', {
        score: null,
        final_score: null,
        boost_multiplier: null
      });
      expect(result).toEqual({
        updatedGameGuesses: expect.arrayContaining([expect.arrayContaining([expect.any(Object)])]),
        cleanedGameGuesses: expect.any(Array)
      });
    });

    it('handles force drafts parameter', async () => {
      await calculateGameScores(true, false);

      expect(mockFindAllGamesWithPublishedResultsAndGameGuesses).toHaveBeenCalledWith(true, false);
    });
  });

  describe('findDataForAwards', () => {
    beforeEach(() => {
      mockFindTournamentById.mockResolvedValue(mockTournament);
      mockFindAllPlayersInTournamentWithTeamData.mockResolvedValue([mockPlayer]);
    });

    it('returns tournament and player data for awards', async () => {
      const result = await findDataForAwards('tournament1');

      expect(mockFindTournamentById).toHaveBeenCalledWith('tournament1');
      expect(mockFindAllPlayersInTournamentWithTeamData).toHaveBeenCalledWith('tournament1');
      expect(result).toEqual({
        tournamentUpdate: {
          champion_team_id: null,
          runner_up_team_id: null,
          third_place_team_id: null,
          best_player_id: undefined,
          top_goalscorer_player_id: undefined,
          best_goalkeeper_player_id: undefined,
          best_young_player_id: undefined,
          dev_only: false,
          display_name: true,
          game_exact_score_points: 3,
          game_correct_outcome_points: 1,
          champion_points: 10,
          runner_up_points: 5,
          third_place_points: 3,
          individual_award_points: 5,
          qualified_team_points: 1,
          exact_position_qualified_points: 1,
          max_silver_games: 3,
          max_golden_games: 1,
          tiebreaker_mode: 'standard', // story #443
        },
        players: [mockPlayer]
      });
    });
  });

  describe('updateTournamentAwards', () => {
    const mockTournamentUpdate: TournamentUpdate = {
      best_player_id: 'player1',
      top_goalscorer_player_id: 'player2'
    };

    beforeEach(() => {
      mockFindTournamentById.mockResolvedValue(mockTournament);
      mockUpdateTournament.mockResolvedValue(mockTournament);
      mockFindTournamentGuessByTournament.mockResolvedValue([
        { 
          id: 'guess1', 
          tournament_id: 'tournament1', 
          user_id: 'user1', 
          champion_team_id: null, 
          runner_up_team_id: null, 
          third_place_team_id: null, 
          best_player_id: 'player1', 
          top_goalscorer_player_id: 'player3', 
          best_goalkeeper_player_id: undefined, 
          best_young_player_id: undefined, 
          honor_roll_score: undefined, 
          individual_awards_score: undefined, 
          qualified_teams_score: undefined, 
          group_position_score: undefined 
        }
      ]);
      mockUpdateTournamentGuess.mockResolvedValue({ 
        id: 'guess1', 
        tournament_id: 'tournament1', 
        user_id: 'user1', 
        champion_team_id: null, 
        runner_up_team_id: null, 
        third_place_team_id: null, 
        best_player_id: undefined, 
        top_goalscorer_player_id: undefined, 
        best_goalkeeper_player_id: undefined, 
        best_young_player_id: undefined, 
        honor_roll_score: undefined, 
        individual_awards_score: undefined, 
        qualified_teams_score: undefined, 
        group_position_score: undefined 
      });
    });

    it('updates tournament awards and calculates scores', async () => {
      const result = await updateTournamentAwards('tournament1', mockTournamentUpdate);

      expect(mockUpdateTournament).toHaveBeenCalledWith('tournament1', mockTournamentUpdate);
      expect(mockUpdateTournamentGuess).toHaveBeenCalledWith('guess1', {
        individual_awards_score: 5 // Only best_player_id matches (5 points from tournament config)
      });
      expect(result).toHaveLength(1);
    });

    it('calculates zero score when no awards match', async () => {
      mockFindTournamentGuessByTournament.mockResolvedValue([
        { 
          id: 'guess1', 
          tournament_id: 'tournament1', 
          user_id: 'user1', 
          champion_team_id: null, 
          runner_up_team_id: null, 
          third_place_team_id: null, 
          best_player_id: 'player3', 
          top_goalscorer_player_id: 'player4', 
          best_goalkeeper_player_id: undefined, 
          best_young_player_id: undefined, 
          honor_roll_score: undefined, 
          individual_awards_score: undefined, 
          qualified_teams_score: undefined, 
          group_position_score: undefined 
        }
      ]);

      await updateTournamentAwards('tournament1', mockTournamentUpdate);

      expect(mockUpdateTournamentGuess).toHaveBeenCalledWith('guess1', {
        individual_awards_score: 0
      });
    });
  });

  describe('updateTournamentHonorRoll', () => {
    const mockTournamentUpdate: TournamentUpdate = {
      champion_team_id: 'team1',
      runner_up_team_id: 'team2',
      third_place_team_id: 'team3'
    };

    beforeEach(() => {
      mockFindTournamentById.mockResolvedValue(mockTournament);
      mockUpdateTournament.mockResolvedValue(mockTournament);
      mockFindTournamentGuessByTournament.mockResolvedValue([
        {
          id: 'guess1',
          tournament_id: 'tournament1', 
          user_id: 'user1', 
          champion_team_id: 'team1',
          runner_up_team_id: 'team2',
          third_place_team_id: 'team4',
          best_player_id: undefined, 
          top_goalscorer_player_id: undefined, 
          best_goalkeeper_player_id: undefined, 
          best_young_player_id: undefined, 
          honor_roll_score: undefined, 
          individual_awards_score: undefined, 
          qualified_teams_score: undefined, 
          group_position_score: undefined 
        }
      ]);
      mockUpdateTournamentGuess.mockResolvedValue({ 
        id: 'guess1', 
        tournament_id: 'tournament1', 
        user_id: 'user1', 
        champion_team_id: null, 
        runner_up_team_id: null, 
        third_place_team_id: null, 
        best_player_id: undefined, 
        top_goalscorer_player_id: undefined, 
        best_goalkeeper_player_id: undefined, 
        best_young_player_id: undefined, 
        honor_roll_score: undefined, 
        individual_awards_score: undefined, 
        qualified_teams_score: undefined, 
        group_position_score: undefined 
      });
    });

    it('updates tournament honor roll and calculates scores', async () => {
      const result = await updateTournamentHonorRoll('tournament1', mockTournamentUpdate);

      expect(mockUpdateTournament).toHaveBeenCalledWith('tournament1', mockTournamentUpdate);
      expect(mockUpdateTournamentGuess).toHaveBeenCalledWith('guess1', {
        honor_roll_score: 15 // 10 (champion) + 5 (runner-up) + 0 (third place) from tournament config
      });
      expect(result).toHaveLength(1);
    });

    it('does not update scores when no honor roll data provided', async () => {
      const result = await updateTournamentHonorRoll('tournament1', {});

      expect(mockUpdateTournament).toHaveBeenCalledWith('tournament1', {});
      expect(result).toBeUndefined();
    });
  });

  describe('copyTournament', () => {
    beforeEach(() => {
      mockFindTournamentById.mockResolvedValue(mockTournament);
      mockCreateTournament.mockResolvedValue({ ...mockTournament, id: 'tournament2' });
      mockFindTeamInTournament.mockResolvedValue([mockTeam]);
      mockCreateTournamentTeam.mockResolvedValue({ tournament_id: 'tournament2', team_id: 'team1' });
      mockFindAllPlayersInTournamentWithTeamData.mockResolvedValue([mockPlayer]);
      mockCreatePlayer.mockResolvedValue({ ...mockPlayer, tournament_id: 'tournament2' });
      mockFindAllTournamentVenues.mockResolvedValue([]);
      mockCreateTournamentVenue.mockResolvedValue({ id: 'venue2', tournament_id: 'tournament2', name: 'Venue', location: 'Location', picture_url: null });
      mockFindThirdPlaceRulesByTournament.mockResolvedValue([]);
      mockCreateThirdPlaceRule.mockResolvedValue({ id: 'rule2', tournament_id: 'tournament2', combination_key: 'key', rules: {}, created_at: undefined, updated_at: undefined });
      mockFindPlayoffStagesWithGamesInTournament.mockResolvedValue([mockExtendedPlayoffRoundData]);
      mockCreatePlayoffRound.mockResolvedValue({ ...mockExtendedPlayoffRoundData, id: 'playoff2' });
      mockFindGroupsWithGamesAndTeamsInTournament.mockResolvedValue([mockExtendedGroupData]);
      mockCreateTournamentGroup.mockResolvedValue({ ...mockExtendedGroupData, id: 'group2' });
      mockCreateTournamentGroupTeam.mockResolvedValue({
        id: 'groupteam2',
        tournament_group_id: 'group2',
        position: 1,
        team_id: 'team1',
        games_played: 0,
        points: 0,
        win: 0,
        draw: 0,
        loss: 0,
        goals_for: 0,
        goals_against: 0,
        goal_difference: 0,
        conduct_score: 0,
        is_complete: false
      });
      mockFindGamesInTournament.mockResolvedValue([mockGame]);
      mockCreateGame.mockResolvedValue({ ...mockGame, id: 'game2' });
      mockCreateTournamentGroupGame.mockResolvedValue({ tournament_group_id: 'group2', game_id: 'game2' });
      mockCreatePlayoffRoundGame.mockResolvedValue({ tournament_playoff_round_id: 'playoff2', game_id: 'game2' });
    });

    it('copies tournament successfully when user is admin', async () => {
      const result = await copyTournament('tournament1', undefined, 'Custom Name', 'CN');

      expect(mockGetLoggedInUser).toHaveBeenCalled();
      expect(mockFindTournamentById).toHaveBeenCalledWith('tournament1');
      expect(mockCreateTournament).toHaveBeenCalledWith(expect.objectContaining({
        long_name: 'Custom Name',
        short_name: 'CN',
        theme: mockTournament.theme && JSON.stringify(mockTournament.theme) || undefined,
        is_active: false,
        dev_only: false
      }));
      expect(result.id).toBe('tournament2');
    });

    it('uses default names when not provided', async () => {
      await copyTournament('tournament1');

      expect(mockCreateTournament).toHaveBeenCalledWith(expect.objectContaining({
        long_name: 'Test Tournament - Copy',
        short_name: 'TT - Copy',
        theme: mockTournament.theme && JSON.stringify(mockTournament.theme) || undefined,
        is_active: false,
        dev_only: false
      }));
    });

    it('throws error when user is not admin', async () => {
      mockGetLoggedInUser.mockResolvedValue(mockRegularUser);

      await expect(copyTournament('tournament1'))
        .rejects.toThrow('unauthorized');
    });

    it('throws error when user is not logged in', async () => {
      mockGetLoggedInUser.mockResolvedValue(undefined);

      await expect(copyTournament('tournament1'))
        .rejects.toThrow('unauthorized');
    });

    it('throws error when tournament not found', async () => {
      mockFindTournamentById.mockResolvedValue(undefined);

      await expect(copyTournament('tournament1'))
        .rejects.toThrow('notFound');
    });

    it('copies all tournament components', async () => {
      await copyTournament('tournament1');

      expect(mockFindAllTournamentVenues).toHaveBeenCalled();
      expect(mockFindThirdPlaceRulesByTournament).toHaveBeenCalled();
      expect(mockCreateTournamentTeam).toHaveBeenCalled();
      expect(mockCreatePlayer).toHaveBeenCalled();
      expect(mockCreatePlayoffRound).toHaveBeenCalled();
      expect(mockCreateTournamentGroup).toHaveBeenCalled();
      expect(mockCreateTournamentGroupTeam).toHaveBeenCalled();
      expect(mockCreateGame).toHaveBeenCalled();
      expect(mockCreateTournamentGroupGame).toHaveBeenCalled();
      expect(mockCreatePlayoffRoundGame).toHaveBeenCalled();
    });

    it('shifts game dates when newStartDate is provided', async () => {
      const originalGameDate = new Date('2024-01-01T12:00:00Z');
      const newStartDate = new Date('2024-02-01T12:00:00Z');
      const expectedShiftedDate = new Date('2024-02-01T12:00:00Z');

      mockGame.game_date = originalGameDate;
      mockFindGamesInTournament.mockResolvedValue([mockGame]);

      await copyTournament('tournament1', newStartDate);

      // Verify createGame was called with shifted date
      expect(mockCreateGame).toHaveBeenCalledWith(expect.objectContaining({
        game_date: expect.any(Date),
      }));

      // Get the actual date passed to createGame
      const createGameCall = mockCreateGame.mock.calls[0][0];
      const actualDate = createGameCall.game_date;

      // The date should be shifted by the difference between newStartDate and original first game
      const expectedOffset = newStartDate.getTime() - originalGameDate.getTime();
      const actualOffset = actualDate.getTime() - originalGameDate.getTime();

      expect(actualOffset).toBe(expectedOffset);
    });

    it('does not shift dates when newStartDate is not provided', async () => {
      const originalGameDate = new Date('2024-01-01T12:00:00Z');
      mockGame.game_date = originalGameDate;
      mockFindGamesInTournament.mockResolvedValue([mockGame]);

      await copyTournament('tournament1');

      // Verify createGame was called with original date (not shifted)
      expect(mockCreateGame).toHaveBeenCalledWith(expect.objectContaining({
        game_date: originalGameDate,
      }));
    });
  });


  describe('Error handling and edge cases', () => {
    it('handles database connection errors', async () => {
      mockFindTournamentById.mockRejectedValue(new Error('Connection lost'));

      await expect(copyTournament('tournament1')).rejects.toThrow('Connection lost');
    });

    it('handles concurrent operations', async () => {
      // Reset mocks to avoid interference from previous tests
      mockFindTournamentById.mockResolvedValue(mockTournament);
      mockFindGroupsWithGamesAndTeamsInTournament.mockResolvedValue([mockExtendedGroupData]);
      mockFindGroupsInTournament.mockResolvedValue([{ id: 'group1', tournament_id: 'tournament1', group_letter: 'A', sort_by_games_between_teams: false }]);
      mockFindAllPlayersInTournamentWithTeamData.mockResolvedValue([mockPlayer]);
      mockFindTeamsInGroup.mockResolvedValue([]);
      mockUpdateTournamentGuessByUserIdTournament.mockResolvedValue({ 
        id: 'guess1', 
        tournament_id: 'tournament1', 
        user_id: 'user1', 
        champion_team_id: null, 
        runner_up_team_id: null, 
        third_place_team_id: null, 
        best_player_id: undefined, 
        top_goalscorer_player_id: undefined, 
        best_goalkeeper_player_id: undefined, 
        best_young_player_id: undefined, 
        honor_roll_score: undefined, 
        individual_awards_score: undefined, 
        qualified_teams_score: undefined, 
        group_position_score: undefined 
      });

      const promises = [
        getGroupDataWithGamesAndTeams('tournament1'),
        findDataForAwards('tournament1')
      ];

      await Promise.all(promises);

      expect(mockFindGroupsWithGamesAndTeamsInTournament).toHaveBeenCalledWith('tournament1');
      expect(mockFindTournamentById).toHaveBeenCalledWith('tournament1');
    });

    it('handles null/undefined values gracefully', async () => {
      mockFindTournamentById.mockResolvedValue(undefined);
      mockFindGroupsWithGamesAndTeamsInTournament.mockResolvedValue([]);
      mockFindTournamentGuessByTournament.mockResolvedValue([]);

      const awardsResult = await findDataForAwards('tournament1');
      const groupsResult = await getGroupDataWithGamesAndTeams('tournament1');

      expect(awardsResult.tournamentUpdate).toEqual({});
      expect(groupsResult.groups).toEqual([]);

      // updateTournamentAwards now throws when tournament not found
      await expect(updateTournamentAwards('tournament1', {})).rejects.toThrow('notFound');
    });

    it('handles empty arrays in calculations', async () => {
      mockFindAllGamesWithPublishedResultsAndGameGuesses.mockResolvedValue([]);
      mockFindAllGuessesForGamesWithResultsInDraft.mockResolvedValue([]);

      const gameScores = await calculateGameScores(false, false);

      expect(gameScores.updatedGameGuesses).toEqual([]);
      expect(gameScores.cleanedGameGuesses).toEqual([]);
    });
  });

  describe('Tournament Permission Management', () => {
    describe('getTournamentPermissionData', () => {
      it('should fetch all users and permitted user IDs', async () => {
        const mockAllUsers = [
          { id: 'user-1', email: 'user1@example.com', nickname: 'User One', is_admin: false },
          { id: 'user-2', email: 'admin@example.com', nickname: 'Admin User', is_admin: true }
        ];
        const mockPermittedUserIds = ['user-1'];

        mockFindAllUsers.mockResolvedValue(mockAllUsers);
        mockFindUserIdsForTournament.mockResolvedValue(mockPermittedUserIds);

        const result = await getTournamentPermissionData('tournament-123');

        expect(mockFindAllUsers).toHaveBeenCalled();
        expect(mockFindUserIdsForTournament).toHaveBeenCalledWith('tournament-123');
        expect(result).toEqual({
          allUsers: [
            { id: 'user-1', email: 'user1@example.com', nickname: 'User One', isAdmin: false },
            { id: 'user-2', email: 'admin@example.com', nickname: 'Admin User', isAdmin: true }
          ],
          permittedUserIds: ['user-1']
        });
      });

      it('should handle users with null is_admin as false', async () => {
        const mockAllUsers = [
          { id: 'user-1', email: 'user@example.com', nickname: 'User', is_admin: undefined }
        ];

        mockFindAllUsers.mockResolvedValue(mockAllUsers);
        mockFindUserIdsForTournament.mockResolvedValue([]);

        const result = await getTournamentPermissionData('tournament-123');

        expect(result.allUsers[0].isAdmin).toBe(false);
      });

      it('should handle empty users list', async () => {
        mockFindAllUsers.mockResolvedValue([]);
        mockFindUserIdsForTournament.mockResolvedValue([]);

        const result = await getTournamentPermissionData('tournament-123');

        expect(result).toEqual({
          allUsers: [],
          permittedUserIds: []
        });
      });

      it('should handle empty permitted users list', async () => {
        const mockAllUsers = [
          { id: 'user-1', email: 'user@example.com', nickname: 'User', is_admin: false }
        ];

        mockFindAllUsers.mockResolvedValue(mockAllUsers);
        mockFindUserIdsForTournament.mockResolvedValue([]);

        const result = await getTournamentPermissionData('tournament-123');

        expect(result.permittedUserIds).toEqual([]);
      });

      it('should handle database errors', async () => {
        mockFindAllUsers.mockRejectedValue(new Error('Database error'));

        await expect(getTournamentPermissionData('tournament-123')).rejects.toThrow('Database error');
      });
    });

    describe('updateTournamentPermissions', () => {
      it('should remove old permissions and add new ones', async () => {
        const userIds = ['user-1', 'user-2', 'user-3'];

        mockRemoveAllTournamentPermissions.mockResolvedValue(undefined);
        mockAddUsersToTournament.mockResolvedValue(undefined);

        await updateTournamentPermissions('tournament-123', userIds);

        expect(mockRemoveAllTournamentPermissions).toHaveBeenCalledWith('tournament-123');
        expect(mockAddUsersToTournament).toHaveBeenCalledWith('tournament-123', userIds);
      });

      it('should handle empty user IDs array', async () => {
        mockRemoveAllTournamentPermissions.mockResolvedValue(undefined);
        mockAddUsersToTournament.mockResolvedValue(undefined);

        await updateTournamentPermissions('tournament-123', []);

        expect(mockRemoveAllTournamentPermissions).toHaveBeenCalledWith('tournament-123');
        expect(mockAddUsersToTournament).toHaveBeenCalledWith('tournament-123', []);
      });

      it('should handle removal errors', async () => {
        mockRemoveAllTournamentPermissions.mockRejectedValue(new Error('Removal failed'));

        await expect(updateTournamentPermissions('tournament-123', ['user-1'])).rejects.toThrow('Removal failed');
        expect(mockAddUsersToTournament).not.toHaveBeenCalled();
      });

      it('should handle addition errors', async () => {
        mockRemoveAllTournamentPermissions.mockResolvedValue(undefined);
        mockAddUsersToTournament.mockRejectedValue(new Error('Addition failed'));

        await expect(updateTournamentPermissions('tournament-123', ['user-1'])).rejects.toThrow('Addition failed');
      });

      it('should update permissions for single user', async () => {
        mockRemoveAllTournamentPermissions.mockResolvedValue(undefined);
        mockAddUsersToTournament.mockResolvedValue(undefined);

        await updateTournamentPermissions('tournament-123', ['user-1']);

        expect(mockRemoveAllTournamentPermissions).toHaveBeenCalledWith('tournament-123');
        expect(mockAddUsersToTournament).toHaveBeenCalledWith('tournament-123', ['user-1']);
      });

      it('should update permissions for multiple users', async () => {
        const userIds = ['user-1', 'user-2', 'user-3', 'user-4', 'user-5'];

        mockRemoveAllTournamentPermissions.mockResolvedValue(undefined);
        mockAddUsersToTournament.mockResolvedValue(undefined);

        await updateTournamentPermissions('tournament-123', userIds);

        expect(mockAddUsersToTournament).toHaveBeenCalledWith('tournament-123', userIds);
      });
    });
  });

  describe('getRecentUnscoredGames', () => {
    it('throws Unauthorized when user is not admin', async () => {
      mockGetLoggedInUser.mockResolvedValue({ ...mockRegularUser } as any);

      await expect(getRecentUnscoredGames('en')).rejects.toThrow();
    });

    it('throws Unauthorized when no session', async () => {
      mockGetLoggedInUser.mockResolvedValue(null as any);

      await expect(getRecentUnscoredGames('en')).rejects.toThrow();
    });

    it('returns empty games and teamsMap when no recent unscored games', async () => {
      mockGetLoggedInUser.mockResolvedValue({ ...mockAdminUser } as any);
      mockFindRecentUnscoredGames.mockResolvedValue([]);
      mockFindTeamsByIds.mockResolvedValue([]);

      const result = await getRecentUnscoredGames('en');

      expect(result.games).toEqual([]);
      expect(result.teamsMap).toEqual({});
      expect(mockFindTeamsByIds).toHaveBeenCalledWith([]);
    });

    it('returns localized games and teamsMap for valid admin', async () => {
      const game = testFactories.game({ id: 'game-1', home_team: 'team-1', away_team: 'team-2' });
      const team1 = testFactories.team({ id: 'team-1' });
      const team2 = testFactories.team({ id: 'team-2' });

      mockGetLoggedInUser.mockResolvedValue({ ...mockAdminUser } as any);
      mockFindRecentUnscoredGames.mockResolvedValue([game] as any);
      mockFindTeamsByIds.mockResolvedValue([team1, team2]);

      const result = await getRecentUnscoredGames('en');

      expect(result.games).toHaveLength(1);
      expect(result.teamsMap).toHaveProperty('team-1');
      expect(result.teamsMap).toHaveProperty('team-2');
    });

    it('builds teamsMap with all teams referenced by returned games', async () => {
      const game = testFactories.game({ id: 'game-1', home_team: 'team-1', away_team: 'team-2' });
      const team1 = testFactories.team({ id: 'team-1', name: 'Spain' });
      const team2 = testFactories.team({ id: 'team-2', name: 'France' });

      mockGetLoggedInUser.mockResolvedValue({ ...mockAdminUser } as any);
      mockFindRecentUnscoredGames.mockResolvedValue([game] as any);
      mockFindTeamsByIds.mockResolvedValue([team1, team2]);

      const result = await getRecentUnscoredGames('en');

      expect(mockFindTeamsByIds).toHaveBeenCalledWith(expect.arrayContaining(['team-1', 'team-2']));
      expect(Object.keys(result.teamsMap)).toHaveLength(2);
    });
  });

  describe('saveGamesAndRecalculate', () => {
    function setupCommonMocks() {
      mockGetLoggedInUser.mockResolvedValue({ ...mockAdminUser } as any);
      mockFindGameResultByGameId.mockResolvedValue(undefined);
      mockCreateGameResult.mockResolvedValue(undefined as any);
      mockFindAllGuessesForGamesWithResultsInDraft.mockResolvedValue([]);
      mockFindAllGamesWithPublishedResultsAndGameGuesses.mockResolvedValue([]);
      mockFindPlayoffStagesWithGamesInTournament.mockResolvedValue([
        { id: 'stage-1', games: [], round_order: 1, is_final: false } as any
      ]);
      mockCalculatePlayoffTeams.mockResolvedValue({});
      mockFindGroupsWithGamesAndTeamsInTournament.mockResolvedValue([]);
      mockFindGamesInTournament.mockResolvedValue([]);
      mockFindGameResultByGameIds.mockResolvedValue([]);
      mockCustomToMap.mockReturnValue({});
      mockToMap.mockReturnValue({});
    }

    it('throws Unauthorized when user is not admin', async () => {
      mockGetLoggedInUser.mockResolvedValue({ ...mockRegularUser } as any);
      const game = testFactories.game({ id: 'game-1' });
      await expect(saveGamesAndRecalculate([game as any], 'tournament-1', 'en')).rejects.toThrow();
    });

    it('calls saveGameResults with the provided games', async () => {
      setupCommonMocks();
      const game = testFactories.game({ id: 'game-1', tournament_id: 'tournament-1' });
      const gameResult = testFactories.gameResult({ game_id: 'game-1', home_score: 1, away_score: 0, is_draft: false });
      const gameWithResult = { ...game, gameResult, group: null, playoffStage: null };

      await saveGamesAndRecalculate([gameWithResult as any], 'tournament-1', 'en');

      expect(mockCreateGameResult).toHaveBeenCalledWith(
        expect.objectContaining({ game_id: 'game-1' })
      );
    });

    it('calls calculateGameScores for all games including playoff games', async () => {
      setupCommonMocks();
      const game = testFactories.game({ id: 'game-1', tournament_id: 'tournament-1' });
      const gameResult = testFactories.gameResult({ game_id: 'game-1', home_score: 2, away_score: 1, is_draft: false });
      const playoffGame = { ...game, gameResult, group: null, playoffStage: { id: 'stage-1', round_name: 'QF' } };

      await saveGamesAndRecalculate([playoffGame as any], 'tournament-1', 'en');

      expect(mockFindAllGamesWithPublishedResultsAndGameGuesses).toHaveBeenCalled();
    });

    it('does not call group pipeline for playoff games but does trigger playoff propagation', async () => {
      setupCommonMocks();
      const game = testFactories.game({ id: 'game-1', tournament_id: 'tournament-1' });
      const gameResult = testFactories.gameResult({ game_id: 'game-1', home_score: 2, away_score: 1, is_draft: false });
      const playoffGame = { ...game, gameResult, group: null, playoffStage: { id: 'stage-1' } };

      await saveGamesAndRecalculate([playoffGame as any], 'tournament-1', 'en');

      expect(mockFindGamesInGroup).not.toHaveBeenCalled();
      expect(mockCalculateAndStoreQualifiedTeamsScores).not.toHaveBeenCalled();
      // Published playoff games now trigger playoff winner propagation
      expect(mockFindPlayoffStagesWithGamesInTournament).toHaveBeenCalled();
    });

    it('calls group pipeline for group games', async () => {
      setupCommonMocks();
      mockFindGamesInGroup.mockResolvedValue([]);
      mockFindTeamsInGroup.mockResolvedValue([]);
      mockFindTournamentById.mockResolvedValue({ tiebreaker_mode: 'standard' } as any);
      mockCalculateGroupPosition.mockReturnValue([]);

      const game = testFactories.game({ id: 'game-1', tournament_id: 'tournament-1' });
      const gameResult = testFactories.gameResult({ game_id: 'game-1', home_score: 1, away_score: 0, is_draft: false });
      const groupGame = { ...game, gameResult, group: { tournament_group_id: 'group-1' }, playoffStage: null };

      await saveGamesAndRecalculate([groupGame as any], 'tournament-1', 'en');

      expect(mockFindGamesInGroup).toHaveBeenCalledWith('group-1', true, false);
      expect(mockFindTeamsInGroup).toHaveBeenCalledWith('group-1');
      expect(mockFindTournamentById).toHaveBeenCalledWith('tournament-1');
      expect(mockFindPlayoffStagesWithGamesInTournament).toHaveBeenCalled();
      expect(mockCalculateAndStoreQualifiedTeamsScores).toHaveBeenCalledWith('tournament-1', 'en');
    });

    it('uses sortByGamesBetweenTeams=true when tournament.tiebreaker_mode is head_to_head', async () => {
      setupCommonMocks();
      mockFindGamesInGroup.mockResolvedValue([]);
      mockFindTeamsInGroup.mockResolvedValue([{ team_id: 'team-1', conduct_score: 0 } as any]);
      mockFindTournamentById.mockResolvedValue({ tiebreaker_mode: 'head_to_head' } as any);
      mockCalculateGroupPosition.mockReturnValue([]);

      const game = testFactories.game({ id: 'game-1', tournament_id: 'tournament-1' });
      const gameResult = testFactories.gameResult({ game_id: 'game-1', home_score: 1, away_score: 0, is_draft: false });
      const groupGame = { ...game, gameResult, group: { tournament_group_id: 'group-1' }, playoffStage: null };

      await saveGamesAndRecalculate([groupGame as any], 'tournament-1', 'en');

      expect(mockCalculateGroupPosition).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        true,
        expect.anything()
      );
    });
  });

  describe('saveAndPublishSingleGameResult', () => {
    function setupCommonMocks() {
      mockFindGameResultByGameId.mockResolvedValue(undefined);
      mockCreateGameResult.mockResolvedValue(undefined as any);
      mockFindAllGuessesForGamesWithResultsInDraft.mockResolvedValue([]);
      mockFindAllGamesWithPublishedResultsAndGameGuesses.mockResolvedValue([]);
      mockFindPlayoffStagesWithGamesInTournament.mockResolvedValue([
        { id: 'stage-1', games: [], round_order: 1, is_final: false } as any
      ]);
      mockCalculatePlayoffTeams.mockResolvedValue({});
      mockFindGroupsWithGamesAndTeamsInTournament.mockResolvedValue([]);
      mockFindGamesInTournament.mockResolvedValue([]);
      mockFindGameResultByGameIds.mockResolvedValue([]);
      mockCustomToMap.mockReturnValue({});
      mockToMap.mockReturnValue({});
    }

    it('throws Unauthorized when user is not admin', async () => {
      mockGetLoggedInUser.mockResolvedValue({ ...mockRegularUser } as any);

      const game = testFactories.game({ id: 'game-1' });
      await expect(saveAndPublishSingleGameResult(game as any, 'en')).rejects.toThrow();
    });

    it('publishes game result with is_draft set to false', async () => {
      mockGetLoggedInUser.mockResolvedValue({ ...mockAdminUser } as any);
      setupCommonMocks();

      const game = testFactories.game({ id: 'game-1', home_team: 'team-1', away_team: 'team-2' });
      const gameResult = testFactories.gameResult({ game_id: 'game-1', home_score: 2, away_score: 1, is_draft: true });
      const gameWithResult = { ...game, gameResult, group: null, playoffStage: null };

      await saveAndPublishSingleGameResult(gameWithResult as any, 'en');

      expect(mockCreateGameResult).toHaveBeenCalledWith(
        expect.objectContaining({ is_draft: false })
      );
    });

    it('calls group pipeline for group-stage games', async () => {
      mockGetLoggedInUser.mockResolvedValue({ ...mockAdminUser } as any);
      setupCommonMocks();
      mockFindGamesInGroup.mockResolvedValue([]);
      mockFindTeamsInGroup.mockResolvedValue([]);
      mockFindTournamentById.mockResolvedValue({ tiebreaker_mode: 'standard' } as any);
      mockCalculateGroupPosition.mockReturnValue([]);

      const game = testFactories.game({ id: 'game-1', tournament_id: 'tournament-1' });
      const gameResult = testFactories.gameResult({ game_id: 'game-1', home_score: 1, away_score: 0, is_draft: true });
      const groupGame = { ...game, gameResult, group: { tournament_group_id: 'group-1' }, playoffStage: null };

      await saveAndPublishSingleGameResult(groupGame as any, 'en');

      expect(mockFindGamesInGroup).toHaveBeenCalledWith('group-1', true, false);
      expect(mockCalculateAndStoreQualifiedTeamsScores).toHaveBeenCalledWith('tournament-1', 'en');
    });

    it('does not call group pipeline for playoff-stage games', async () => {
      mockGetLoggedInUser.mockResolvedValue({ ...mockAdminUser } as any);
      setupCommonMocks();

      const game = testFactories.game({ id: 'game-1', tournament_id: 'tournament-1' });
      const gameResult = testFactories.gameResult({ game_id: 'game-1', home_score: 2, away_score: 1, is_draft: true });
      const playoffGame = { ...game, gameResult, group: null, playoffStage: { id: 'stage-1' } };

      await saveAndPublishSingleGameResult(playoffGame as any, 'en');

      expect(mockFindGamesInGroup).not.toHaveBeenCalled();
      expect(mockCalculateAndStoreQualifiedTeamsScores).not.toHaveBeenCalled();
      expect(mockFindAllGamesWithPublishedResultsAndGameGuesses).toHaveBeenCalled();
    });
  });

  describe('calculateAndSavePlayoffGamesForTournament', () => {
    function buildR32Game(id: string, gameNumber: number, homeTeam: string, awayTeam: string, homeScore: number, awayScore: number, isDraft = false) {
      const result = testFactories.gameResult({ game_id: id, home_score: homeScore, away_score: awayScore, is_draft: isDraft });
      return { ...testFactories.game({ id, game_number: gameNumber, home_team: homeTeam, away_team: awayTeam }), gameResult: result };
    }

    function buildNextRoundGame(id: string, gameNumber: number, homeSourceGameNumber: number, awaySourceGameNumber: number, homeWinner = true, awayWinner = true) {
      return {
        ...testFactories.game({ id, game_number: gameNumber, home_team: null, away_team: null }),
        gameResult: null,
        home_team_rule: { game: homeSourceGameNumber, winner: homeWinner },
        away_team_rule: { game: awaySourceGameNumber, winner: awayWinner },
      };
    }

    function setupMocks(games: any[], stages: any[]) {
      mockFindGroupsWithGamesAndTeamsInTournament.mockResolvedValue([]);
      mockFindGamesInTournament.mockResolvedValue(games as any);
      mockFindPlayoffStagesWithGamesInTournament.mockResolvedValue(stages as any);
      mockFindGameResultByGameIds.mockResolvedValue([]);
      mockCustomToMap.mockReturnValue({});
      mockCalculatePlayoffTeams.mockResolvedValue(
        Object.fromEntries(stages[0]?.games.map((g: any) => [g.game_id, { homeTeam: null, awayTeam: null }]) ?? [])
      );
      mockUpdateGame.mockResolvedValue(undefined as any);
      const gamesById: Record<string, any> = Object.fromEntries(games.map(g => [g.id, g]));
      mockToMap.mockReturnValue(gamesById as any);
    }

    it('updates stage 1 game teams from stage 0 published results', async () => {
      const r32 = buildR32Game('game-r32', 1, 'team-a', 'team-b', 2, 0);
      const qf = buildNextRoundGame('game-qf', 2, 1, 1, true, false);

      setupMocks([r32, qf], [
        { id: 'stage-0', games: [{ game_id: 'game-r32' }], round_order: 0 },
        { id: 'stage-1', games: [{ game_id: 'game-qf' }], round_order: 1 },
      ]);
      mockCalculatePlayoffTeams.mockResolvedValue({
        'game-r32': { homeTeam: { team_id: 'team-a' }, awayTeam: { team_id: 'team-b' } },
      });

      await calculateAndSavePlayoffGamesForTournament('tournament-1');

      // getGameWinner(r32) = 'team-a' (home wins 2-0), getGameLoser(r32) = 'team-b'
      expect(mockUpdateGame).toHaveBeenCalledWith('game-qf', { home_team: 'team-a', away_team: 'team-b' });
    });

    it('sets team to null for stage 1 when source result is still draft', async () => {
      const r32 = buildR32Game('game-r32', 1, 'team-a', 'team-b', 2, 0, true);
      const qf = buildNextRoundGame('game-qf', 2, 1, 1);

      setupMocks([r32, qf], [
        { id: 'stage-0', games: [{ game_id: 'game-r32' }], round_order: 0 },
        { id: 'stage-1', games: [{ game_id: 'game-qf' }], round_order: 1 },
      ]);

      await calculateAndSavePlayoffGamesForTournament('tournament-1');

      expect(mockUpdateGame).toHaveBeenCalledWith('game-qf', { home_team: null, away_team: null });
    });

    it('sets team to null when source game has no result', async () => {
      const r32 = { ...testFactories.game({ id: 'game-r32', game_number: 1, home_team: 'team-a', away_team: 'team-b' }), gameResult: null };
      const qf = buildNextRoundGame('game-qf', 2, 1, 1);

      setupMocks([r32, qf], [
        { id: 'stage-0', games: [{ game_id: 'game-r32' }], round_order: 0 },
        { id: 'stage-1', games: [{ game_id: 'game-qf' }], round_order: 1 },
      ]);

      await calculateAndSavePlayoffGamesForTournament('tournament-1');

      expect(mockUpdateGame).toHaveBeenCalledWith('game-qf', { home_team: null, away_team: null });
    });

    it('assigns loser team when winner=false (3rd-place game scenario)', async () => {
      const sf1 = buildR32Game('game-sf1', 1, 'team-a', 'team-b', 1, 2);
      const thirdPlace = buildNextRoundGame('game-3rd', 2, 1, 1, false, false);

      setupMocks([sf1, thirdPlace], [
        { id: 'stage-0', games: [{ game_id: 'game-sf1' }], round_order: 0 },
        { id: 'stage-1', games: [{ game_id: 'game-3rd' }], round_order: 1 },
      ]);
      mockCalculatePlayoffTeams.mockResolvedValue({
        'game-sf1': { homeTeam: { team_id: 'team-a' }, awayTeam: { team_id: 'team-b' } },
      });

      await calculateAndSavePlayoffGamesForTournament('tournament-1');

      // sf1: away wins 2-1 → winner='team-b', loser='team-a'; both slots use loser
      expect(mockUpdateGame).toHaveBeenCalledWith('game-3rd', { home_team: 'team-a', away_team: 'team-a' });
    });

    it('skips stage 1 games whose rules are not TeamWinnerRule', async () => {
      const r32 = buildR32Game('game-r32', 1, 'team-a', 'team-b', 2, 0);
      const qf = {
        ...testFactories.game({ id: 'game-qf', game_number: 2 }),
        gameResult: null,
        home_team_rule: { group: 'A', position: 1 },
        away_team_rule: { group: 'B', position: 1 },
      };

      setupMocks([r32, qf], [
        { id: 'stage-0', games: [{ game_id: 'game-r32' }], round_order: 0 },
        { id: 'stage-1', games: [{ game_id: 'game-qf' }], round_order: 1 },
      ]);

      await calculateAndSavePlayoffGamesForTournament('tournament-1');

      expect(mockUpdateGame).not.toHaveBeenCalledWith('game-qf', expect.anything());
    });

    it('chains winners through 3 stages correctly', async () => {
      // stage-0: sf game (home team-a wins 3-0)
      const sf = buildR32Game('game-sf', 1, 'team-a', 'team-b', 3, 0);
      // stage-1: final game — seeded from sf winner/loser, and itself has a published result (team-a wins 2-1)
      const finalResult = testFactories.gameResult({ game_id: 'game-final', home_score: 2, away_score: 1, is_draft: false });
      const final = {
        ...testFactories.game({ id: 'game-final', game_number: 2, home_team: 'team-a', away_team: 'team-b' }),
        gameResult: finalResult,
        home_team_rule: { game: 1, winner: true },
        away_team_rule: { game: 1, winner: false },
      };
      // stage-2: trophy game — seeded from final winner/loser
      const trophy = buildNextRoundGame('game-trophy', 3, 2, 2, true, false);

      setupMocks([sf, final, trophy], [
        { id: 'stage-0', games: [{ game_id: 'game-sf' }], round_order: 0 },
        { id: 'stage-1', games: [{ game_id: 'game-final' }], round_order: 1 },
        { id: 'stage-2', games: [{ game_id: 'game-trophy' }], round_order: 2 },
      ]);
      mockCalculatePlayoffTeams.mockResolvedValue({
        'game-sf': { homeTeam: { team_id: 'team-a' }, awayTeam: { team_id: 'team-b' } },
      });

      await calculateAndSavePlayoffGamesForTournament('tournament-1');

      // stage-1: sf winner=team-a (3-0), loser=team-b → final slots: home=team-a, away=team-b
      expect(mockUpdateGame).toHaveBeenCalledWith('game-final', { home_team: 'team-a', away_team: 'team-b' });
      // stage-2: final winner=team-a (2-1), loser=team-b → trophy: home=team-a, away=team-b
      expect(mockUpdateGame).toHaveBeenCalledWith('game-trophy', { home_team: 'team-a', away_team: 'team-b' });
    });
  });
});
