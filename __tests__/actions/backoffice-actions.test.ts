import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  deleteDBTournamentTree,
  generateDbTournamentTeamPlayers,
  generateDbTournament,
  saveGameResults,
  saveGamesData,
  calculateAndSavePlayoffGamesForTournament,
  getGroupDataWithGamesAndTeams,
  calculateAllUsersGroupPositions,
  recalculateAllPlayoffFirstRoundGameGuesses,
  calculateGameScores,
  calculateAndStoreQualifiedTeamsPoints,
  findDataForAwards,
  updateTournamentAwards,
  updateTournamentHonorRoll,
  copyTournament,
  calculateAndStoreGroupPositionScores,
  getTournamentPermissionData,
  updateTournamentPermissions
} from '../../app/actions/backoffice-actions';
import { GameResult, Tournament, TournamentUpdate } from '../../app/db/tables-definition';
import { ExtendedGameData, ExtendedGroupData, ExtendedPlayoffRoundData } from '../../app/definitions';

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
  getTeamByName: vi.fn(),
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
}));

vi.mock('../../app/db/tournament-group-team-guess-repository', () => ({
  findAllUserTournamentGroupsWithoutGuesses: vi.fn(),
  findAllTournamentGroupTeamGuessInGroup: vi.fn(),
  deleteAllTournamentGroupTeamStatGuessesByTournamentId: vi.fn(),
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
  updateTournamentGuessWithSnapshot: vi.fn(),
  updateTournamentGuessByUserIdTournament: vi.fn(),
  updateTournamentGuessByUserIdTournamentWithSnapshot: vi.fn(),
  deleteAllTournamentGuessesByTournamentId: vi.fn(),
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
  updateOrCreateTournamentGroupTeamGuesses: vi.fn(),
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

// Import mocked functions
import * as tournamentRepository from '../../app/db/tournament-repository';
import * as teamRepository from '../../app/db/team-repository';
import * as tournamentGroupRepository from '../../app/db/tournament-group-repository';
import * as tournamentPlayoffRepository from '../../app/db/tournament-playoff-repository';
import * as gameRepository from '../../app/db/game-repository';
import * as playerRepository from '../../app/db/player-repository';
import * as gameResultRepository from '../../app/db/game-result-repository';
import * as tournamentGroupTeamGuessRepository from '../../app/db/tournament-group-team-guess-repository';
import * as gameGuessRepository from '../../app/db/game-guess-repository';
import * as tournamentGuessRepository from '../../app/db/tournament-guess-repository';
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
import { revalidatePath } from 'next/cache';

// Mock functions
const mockDeleteAllGameGuessesByTournamentId = vi.mocked(gameGuessRepository.deleteAllGameGuessesByTournamentId);
const mockDeleteAllTournamentGuessesByTournamentId = vi.mocked(tournamentGuessRepository.deleteAllTournamentGuessesByTournamentId);
const mockDeleteAllTournamentGroupTeamStatGuessesByTournamentId = vi.mocked(tournamentGroupTeamGuessRepository.deleteAllTournamentGroupTeamStatGuessesByTournamentId);
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

const mockFindAllUserTournamentGroupsWithoutGuesses = vi.mocked(tournamentGroupTeamGuessRepository.findAllUserTournamentGroupsWithoutGuesses);
const mockFindAllTournamentGroupTeamGuessInGroup = vi.mocked(tournamentGroupTeamGuessRepository.findAllTournamentGroupTeamGuessInGroup);

const mockFindGameGuessesByUserId = vi.mocked(gameGuessRepository.findGameGuessesByUserId);
const mockUpdateGameGuess = vi.mocked(gameGuessRepository.updateGameGuess);
const mockUpdateGameGuessWithBoost = vi.mocked(gameGuessRepository.updateGameGuessWithBoost);
const mockFindAllGuessesForGamesWithResultsInDraft = vi.mocked(gameGuessRepository.findAllGuessesForGamesWithResultsInDraft);

const mockFindTournamentGuessByTournament = vi.mocked(tournamentGuessRepository.findTournamentGuessByTournament);
const mockUpdateTournamentGuess = vi.mocked(tournamentGuessRepository.updateTournamentGuess);
const mockUpdateTournamentGuessWithSnapshot = vi.mocked(tournamentGuessRepository.updateTournamentGuessWithSnapshot);
const mockUpdateTournamentGuessByUserIdTournament = vi.mocked(tournamentGuessRepository.updateTournamentGuessByUserIdTournament);
const mockUpdateTournamentGuessByUserIdTournamentWithSnapshot = vi.mocked(tournamentGuessRepository.updateTournamentGuessByUserIdTournamentWithSnapshot);

const mockGetLoggedInUser = vi.mocked(userActions.getLoggedInUser);

const mockUpdateOrCreateTournamentGroupTeamGuesses = vi.mocked(guessesActions.updateOrCreateTournamentGroupTeamGuesses);
const mockUpdatePlayoffGameGuesses = vi.mocked(guessesActions.updatePlayoffGameGuesses);

const mockCalculatePlayoffTeams = vi.mocked(playoffTeamsCalculator.calculatePlayoffTeams);
const mockCalculateGroupPosition = vi.mocked(groupPositionCalculator.calculateGroupPosition);
const mockCalculateScoreForGame = vi.mocked(gameScoreCalculator.calculateScoreForGame);
const mockCustomToMap = vi.mocked(objectUtils.customToMap);
const mockToMap = vi.mocked(objectUtils.toMap);

const mockDb = vi.mocked(database.db);

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
      expect(mockDeleteAllGameGuessesByTournamentId).toHaveBeenCalledWith(mockTournament.id);
      expect(mockDeleteAllTournamentGuessesByTournamentId).toHaveBeenCalledWith(mockTournament.id);
      expect(mockDeleteAllTournamentGroupTeamStatGuessesByTournamentId).toHaveBeenCalledWith(mockTournament.id);
      expect(mockDeleteAllPlayersInTournament).toHaveBeenCalledWith(mockTournament.id);
      expect(mockDeleteAllTournamentVenues).toHaveBeenCalledWith(mockTournament.id);
      expect(mockDeleteThirdPlaceRulesByTournament).toHaveBeenCalledWith(mockTournament.id);
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
      await expect(deleteDBTournamentTree(mockTournament)).rejects.toThrow('Cannot delete an active tournament');
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

      const result = await getGroupDataWithGamesAndTeams('tournament1');

      expect(mockFindGroupsWithGamesAndTeamsInTournament).toHaveBeenCalledWith('tournament1');
      expect(result).toEqual(mockGroups);
    });
  });

  describe('calculateAllUsersGroupPositions', () => {
    beforeEach(() => {
      mockFindAllUserTournamentGroupsWithoutGuesses.mockResolvedValue([
        { user_id: 'user1', tournament_group_id: 'group1' }
      ]);
      mockFindGameGuessesByUserId.mockResolvedValue([]);
      mockFindGamesInGroup.mockResolvedValue([mockGame]);
      mockFindTeamInGroup.mockResolvedValue([mockTeam]);
      mockFindTournamentgroupById.mockResolvedValue({ id: 'group1', tournament_id: 'tournament1', group_letter: 'A', sort_by_games_between_teams: false });
      mockCalculateGroupPosition.mockReturnValue([
        { team_id: 'team1', games_played: 1, points: 3, win: 1, draw: 0, loss: 0, goals_for: 2, goals_against: 1, goal_difference: 1, conduct_score: 0, is_complete: true }
      ]);
    });

    it('calculates group positions for all users', async () => {
      await calculateAllUsersGroupPositions('tournament1');

      expect(mockCalculateGroupPosition).toHaveBeenCalled();
      expect(mockUpdateOrCreateTournamentGroupTeamGuesses).toHaveBeenCalled();
    });

    it('handles empty user groups', async () => {
      mockFindAllUserTournamentGroupsWithoutGuesses.mockResolvedValue([]);

      const result = await calculateAllUsersGroupPositions('tournament1');

      expect(result).toEqual([]);
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
      mockCalculateScoreForGame.mockReturnValue(2);
      mockUpdateGameGuessWithBoost.mockResolvedValue({ id: 'guess1', game_number: 1, home_team: 'team1', away_team: 'team2', game_id: 'game1', home_score: 1, away_score: 2, user_id: 'user1', home_penalty_winner: false, away_penalty_winner: false, score: 2, boost_type: null, boost_multiplier: 1.0, final_score: 2, updated_at: new Date() });
    });

    it('calculates and updates game scores', async () => {
      const result = await calculateGameScores(false, false);

      expect(mockCalculateScoreForGame).toHaveBeenCalled();
      expect(mockUpdateGameGuessWithBoost).toHaveBeenCalledWith('guess1', 2, null);
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

  describe('calculateAndStoreQualifiedTeamsPoints', () => {
    beforeEach(() => {
      mockFindQualifiedTeams.mockResolvedValue({
        teams: [{ id: 'team1', name: 'Team 1', short_name: 'T1', theme: null }],
        completeGroupIds: new Set(),
        allGroupsComplete: false
      });
      mockFindGuessedQualifiedTeams.mockResolvedValue([{ id: 'team1', name: 'Team 1', short_name: 'T1', theme: null }]);
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
    });

    it('calculates qualified teams points correctly', async () => {
      const result = await calculateAndStoreQualifiedTeamsPoints('tournament1');

      expect(mockUpdateTournamentGuessByUserIdTournamentWithSnapshot).toHaveBeenCalledWith('user1', 'tournament1', {
        qualified_teams_score: 1
      });
      expect(result).toHaveLength(2);
    });

    it('handles users without tournament guesses', async () => {
      mockUpdateTournamentGuessByUserIdTournament.mockResolvedValue(undefined);

      const result = await calculateAndStoreQualifiedTeamsPoints('tournament1');

      expect(result[0]).toEqual({ status: 'warning', warning: 'No tournament guess found for user user1' });
    });

    it('handles calculation errors', async () => {
      mockFindQualifiedTeams.mockRejectedValue(new Error('Database error'));

      await expect(calculateAndStoreQualifiedTeamsPoints('tournament1'))
        .rejects.toThrow('Database error');
    });

    it('handles individual user errors', async () => {
      mockFindGuessedQualifiedTeams.mockRejectedValue(new Error('User data error'));

      const result = await calculateAndStoreQualifiedTeamsPoints('tournament1');

      expect(result[0]).toEqual({ error: 'Error calculating qualified teams points for user user1' });
      expect(result[1]).toEqual({ error: 'Error calculating qualified teams points for user user2' });
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
      expect(mockUpdateTournamentGuessWithSnapshot).toHaveBeenCalledWith('guess1', {
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

      expect(mockUpdateTournamentGuessWithSnapshot).toHaveBeenCalledWith('guess1', {
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
      expect(mockUpdateTournamentGuessWithSnapshot).toHaveBeenCalledWith('guess1', {
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
        .rejects.toThrow('Unauthorized: Only administrators can copy tournaments');
    });

    it('throws error when user is not logged in', async () => {
      mockGetLoggedInUser.mockResolvedValue(undefined);

      await expect(copyTournament('tournament1'))
        .rejects.toThrow('Unauthorized: Only administrators can copy tournaments');
    });

    it('throws error when tournament not found', async () => {
      mockFindTournamentById.mockResolvedValue(undefined);

      await expect(copyTournament('tournament1'))
        .rejects.toThrow('Tournament not found');
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

  describe('calculateAndStoreGroupPositionScores', () => {
    beforeEach(() => {
      mockFindTournamentById.mockResolvedValue(mockTournament);
      mockFindQualifiedTeams.mockResolvedValue({
        teams: [{ id: 'team1', name: 'Team A', short_name: 'TA', theme: null }],
        completeGroupIds: new Set(),
        allGroupsComplete: false
      });
      mockFindGroupsInTournament.mockResolvedValue([{ id: 'group1', tournament_id: 'tournament1', group_letter: 'A', sort_by_games_between_teams: false }]);
      mockFindTeamsInGroup.mockResolvedValue([
        { id: 'teamgroup1', team_id: 'team1', position: 1, tournament_group_id: 'group1', games_played: 3, points: 6, win: 2, draw: 0, loss: 1, goals_for: 4, goals_against: 2, goal_difference: 2, conduct_score: 0, is_complete: true },
        { id: 'teamgroup2', team_id: 'team2', position: 2, tournament_group_id: 'group1', games_played: 3, points: 3, win: 1, draw: 0, loss: 2, goals_for: 2, goals_against: 4, goal_difference: -2, conduct_score: 0, is_complete: true }
      ]);
      mockFindAllTournamentGroupTeamGuessInGroup.mockResolvedValue([
        { id: 'guess1', user_id: 'user1', team_id: 'team1', position: 1, tournament_group_id: 'group1', games_played: 3, points: 6, win: 2, draw: 0, loss: 1, goals_for: 4, goals_against: 2, goal_difference: 2, conduct_score: 0, is_complete: true },
        { id: 'guess2', user_id: 'user1', team_id: 'team2', position: 3, tournament_group_id: 'group1', games_played: 3, points: 3, win: 1, draw: 0, loss: 2, goals_for: 2, goals_against: 4, goal_difference: -2, conduct_score: 0, is_complete: true }
      ]);
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
    });

    it('calculates group position scores correctly', async () => {
      await calculateAndStoreGroupPositionScores('tournament1');

      // With new qualification-aware logic:
      // team1: qualified (in qualifiedTeams) + position 1 matches = 1 point (exact_position_qualified_points default is 1)
      // team2: NOT qualified (not in qualifiedTeams) + position doesn't match = 0 points
      expect(mockUpdateTournamentGuessByUserIdTournamentWithSnapshot).toHaveBeenCalledWith('user1', 'tournament1', {
        group_position_score: 1
      });
    });

    it('skips incomplete groups', async () => {
      mockFindTeamsInGroup.mockResolvedValue([
        { id: 'teamgroup1', team_id: 'team1', position: 1, tournament_group_id: 'group1', games_played: 2, points: 3, win: 1, draw: 0, loss: 1, goals_for: 2, goals_against: 2, goal_difference: 0, conduct_score: 0, is_complete: false }
      ]);

      await calculateAndStoreGroupPositionScores('tournament1');

      expect(mockUpdateTournamentGuessByUserIdTournamentWithSnapshot).toHaveBeenCalledWith('user1', 'tournament1', {
        group_position_score: 0
      });
    });

    it('skips incomplete user guesses', async () => {
      mockFindAllTournamentGroupTeamGuessInGroup.mockResolvedValue([
        { id: 'guess1', user_id: 'user1', team_id: 'team1', position: 1, tournament_group_id: 'group1', games_played: 2, points: 3, win: 1, draw: 0, loss: 1, goals_for: 2, goals_against: 2, goal_difference: 0, conduct_score: 0, is_complete: false }
      ]);

      await calculateAndStoreGroupPositionScores('tournament1');

      expect(mockUpdateTournamentGuessByUserIdTournamentWithSnapshot).toHaveBeenCalledWith('user1', 'tournament1', {
        group_position_score: 0
      });
    });

    it('handles empty groups', async () => {
      mockFindGroupsInTournament.mockResolvedValue([]);

      await calculateAndStoreGroupPositionScores('tournament1');

      expect(mockUpdateTournamentGuessByUserIdTournamentWithSnapshot).toHaveBeenCalledWith('user1', 'tournament1', {
        group_position_score: 0
      });
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
      mockFindAllTournamentGroupTeamGuessInGroup.mockResolvedValue([]);
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
        calculateAndStoreGroupPositionScores('tournament1'),
        findDataForAwards('tournament1')
      ];

      await Promise.all(promises);

      expect(mockFindGroupsWithGamesAndTeamsInTournament).toHaveBeenCalledWith('tournament1');
      expect(mockFindGroupsInTournament).toHaveBeenCalledWith('tournament1');
      expect(mockFindTournamentById).toHaveBeenCalledWith('tournament1');
    });

    it('handles null/undefined values gracefully', async () => {
      mockFindTournamentById.mockResolvedValue(undefined);
      mockFindGroupsWithGamesAndTeamsInTournament.mockResolvedValue([]);
      mockFindTournamentGuessByTournament.mockResolvedValue([]);

      const awardsResult = await findDataForAwards('tournament1');
      const groupsResult = await getGroupDataWithGamesAndTeams('tournament1');

      expect(awardsResult.tournamentUpdate).toEqual({});
      expect(groupsResult).toEqual([]);

      // updateTournamentAwards now throws when tournament not found
      await expect(updateTournamentAwards('tournament1', {})).rejects.toThrow('Tournament tournament1 not found');
    });

    it('handles empty arrays in calculations', async () => {
      mockFindAllUserTournamentGroupsWithoutGuesses.mockResolvedValue([]);
      mockFindAllGamesWithPublishedResultsAndGameGuesses.mockResolvedValue([]);
      mockFindAllGuessesForGamesWithResultsInDraft.mockResolvedValue([]);

      const groupPositions = await calculateAllUsersGroupPositions('tournament1');
      const gameScores = await calculateGameScores(false, false);

      expect(groupPositions).toEqual([]);
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
});
