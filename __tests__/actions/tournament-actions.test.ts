import {
  getAllTournaments,
  getTournaments,
  getGamesAroundMyTime,
  getTeamsMap,
  getCompleteGroupData,
  getCompletePlayoffData,
  getTournamentAndGroupsData,
  getTournamentStartDate,
  deactivateTournament,
  createOrUpdateTournament,
  getTournamentById,
  getCompleteTournamentGroups,
  createOrUpdateTournamentGroup,
  getPlayoffRounds,
  createOrUpdatePlayoffRound
} from '../../app/actions/tournament-actions';
import { Tournament, TournamentNew, Game, Team, TournamentGroup, PlayoffRoundNew, PlayoffRoundUpdate } from '../../app/db/tables-definition';

// Mock all the database repositories
jest.mock('../../app/db/tournament-repository', () => ({
  createTournament: jest.fn(),
  findAllActiveTournaments: jest.fn(),
  findAllTournaments: jest.fn(),
  findTournamentById: jest.fn(),
  updateTournament: jest.fn(),
}));

jest.mock('../../app/db/game-repository', () => ({
  findFirstGameInTournament: jest.fn(),
  findGamesAroundCurrentTime: jest.fn(),
  findGamesInGroup: jest.fn(),
  findGamesInTournament: jest.fn(),
}));

jest.mock('../../app/db/tournament-group-repository', () => ({
  createTournamentGroup: jest.fn(),
  createTournamentGroupTeam: jest.fn(),
  deleteTournamentGroupTeams: jest.fn(),
  findGroupsInTournament: jest.fn(),
  findGroupsWithGamesAndTeamsInTournament: jest.fn(),
  findTeamsInGroup: jest.fn(),
  findTournamentgroupById: jest.fn(),
  updateTournamentGroup: jest.fn(),
}));

jest.mock('../../app/db/tournament-playoff-repository', () => ({
  createPlayoffRound: jest.fn(),
  findPlayoffStagesWithGamesInTournament: jest.fn(),
  updatePlayoffRound: jest.fn(),
}));

jest.mock('../../app/db/team-repository', () => ({
  findTeamInGroup: jest.fn(),
  findTeamInTournament: jest.fn(),
}));

jest.mock('../../app/actions/user-actions', () => ({
  getLoggedInUser: jest.fn(),
}));

jest.mock('../../app/actions/s3', () => ({
  createS3Client: jest.fn(),
  getS3KeyFromURL: jest.fn(),
}));

// Import mocked functions
const mockCreateTournament = require('../../app/db/tournament-repository').createTournament;
const mockFindAllActiveTournaments = require('../../app/db/tournament-repository').findAllActiveTournaments;
const mockFindAllTournaments = require('../../app/db/tournament-repository').findAllTournaments;
const mockFindTournamentById = require('../../app/db/tournament-repository').findTournamentById;
const mockUpdateTournament = require('../../app/db/tournament-repository').updateTournament;

const mockFindFirstGameInTournament = require('../../app/db/game-repository').findFirstGameInTournament;
const mockFindGamesAroundCurrentTime = require('../../app/db/game-repository').findGamesAroundCurrentTime;
const mockFindGamesInGroup = require('../../app/db/game-repository').findGamesInGroup;
const mockFindGamesInTournament = require('../../app/db/game-repository').findGamesInTournament;

const mockCreateTournamentGroup = require('../../app/db/tournament-group-repository').createTournamentGroup;
const mockCreateTournamentGroupTeam = require('../../app/db/tournament-group-repository').createTournamentGroupTeam;
const mockDeleteTournamentGroupTeams = require('../../app/db/tournament-group-repository').deleteTournamentGroupTeams;
const mockFindGroupsInTournament = require('../../app/db/tournament-group-repository').findGroupsInTournament;
const mockFindGroupsWithGamesAndTeamsInTournament = require('../../app/db/tournament-group-repository').findGroupsWithGamesAndTeamsInTournament;
const mockFindTeamsInGroup = require('../../app/db/tournament-group-repository').findTeamsInGroup;
const mockFindTournamentgroupById = require('../../app/db/tournament-group-repository').findTournamentgroupById;
const mockUpdateTournamentGroup = require('../../app/db/tournament-group-repository').updateTournamentGroup;

const mockCreatePlayoffRound = require('../../app/db/tournament-playoff-repository').createPlayoffRound;
const mockFindPlayoffStagesWithGamesInTournament = require('../../app/db/tournament-playoff-repository').findPlayoffStagesWithGamesInTournament;
const mockUpdatePlayoffRound = require('../../app/db/tournament-playoff-repository').updatePlayoffRound;

const mockFindTeamInGroup = require('../../app/db/team-repository').findTeamInGroup;
const mockFindTeamInTournament = require('../../app/db/team-repository').findTeamInTournament;

const mockGetLoggedInUser = require('../../app/actions/user-actions').getLoggedInUser;
const mockCreateS3Client = require('../../app/actions/s3').createS3Client;
const mockGetS3KeyFromURL = require('../../app/actions/s3').getS3KeyFromURL;

describe('Tournament Actions', () => {
  const mockAdminUser = {
    id: 'user1',
    email: 'admin@test.com',
    isAdmin: true
  };

  const mockRegularUser = {
    id: 'user2',
    email: 'user@test.com',
    isAdmin: false
  };

  const mockTournament: Tournament = {
    id: 'tournament1',
    short_name: 'WC2024',
    long_name: 'World Cup 2024',
    is_active: true,
    champion_team_id: null,
    runner_up_team_id: null,
    third_place_team_id: null,
    best_player_id: undefined,
    top_goalscorer_player_id: undefined,
    best_goalkeeper_player_id: undefined,
    best_young_player_id: undefined,
    dev_only: undefined,
    display_name: undefined,
    theme: {
      primary_color: '#ff0000',
      secondary_color: '#00ff00',
      logo: 'https://example.com/logo.png',
      s3_logo_key: 'tournament-logos/logo.png',
      is_s3_logo: true
    }
  };

  const mockGame: Game = {
    id: 'game1',
    tournament_id: 'tournament1',
    game_number: 1,
    home_team: 'team1',
    away_team: 'team2',
    game_date: new Date('2024-01-01'),
    location: 'Stadium 1',
    game_type: 'group',
    home_team_rule: undefined,
    away_team_rule: undefined,
    game_local_timezone: undefined
  };

  const mockTeam: Team = {
    id: 'team1',
    name: 'Team A',
    short_name: 'TA',
    theme: null
  };

  const mockTournamentGroup: TournamentGroup = {
    id: 'group1',
    tournament_id: 'tournament1',
    group_letter: 'A',
    sort_by_games_between_teams: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetLoggedInUser.mockResolvedValue(mockAdminUser);
    mockFindAllActiveTournaments.mockResolvedValue([mockTournament]);
    mockFindAllTournaments.mockResolvedValue([mockTournament]);
    mockFindTournamentById.mockResolvedValue(mockTournament);
    mockUpdateTournament.mockResolvedValue(mockTournament);
    mockCreateTournament.mockResolvedValue(mockTournament);
    mockFindFirstGameInTournament.mockResolvedValue(mockGame);
    mockFindGamesAroundCurrentTime.mockResolvedValue([mockGame]);
    mockFindGamesInGroup.mockResolvedValue([mockGame]);
    mockFindGamesInTournament.mockResolvedValue([mockGame]);
    mockFindGroupsInTournament.mockResolvedValue([mockTournamentGroup]);
    mockFindGroupsWithGamesAndTeamsInTournament.mockResolvedValue([mockTournamentGroup]);
    mockFindTeamsInGroup.mockResolvedValue([mockTeam]);
    mockFindTeamInGroup.mockResolvedValue([mockTeam]);
    mockFindTeamInTournament.mockResolvedValue([mockTeam]);
    mockFindTournamentgroupById.mockResolvedValue(mockTournamentGroup);
    mockCreateTournamentGroup.mockResolvedValue(mockTournamentGroup);
    mockUpdateTournamentGroup.mockResolvedValue(mockTournamentGroup);
    mockCreateTournamentGroupTeam.mockResolvedValue(undefined);
    mockDeleteTournamentGroupTeams.mockResolvedValue(undefined);
    mockFindPlayoffStagesWithGamesInTournament.mockResolvedValue([]);
    mockCreatePlayoffRound.mockResolvedValue({});
    mockUpdatePlayoffRound.mockResolvedValue({});
    mockCreateS3Client.mockReturnValue({
      uploadFile: jest.fn().mockResolvedValue({ location: 'https://s3.amazonaws.com/logo.png', key: 'new-key' }),
      deleteFile: jest.fn().mockResolvedValue(undefined)
    });
    mockGetS3KeyFromURL.mockReturnValue('old-key');
  });

  describe('getAllTournaments', () => {
    it('returns all tournaments including dev and inactive ones', async () => {
      const result = await getAllTournaments();

      expect(mockFindAllTournaments).toHaveBeenCalled();
      expect(result).toEqual([mockTournament]);
    });
  });

  describe('getTournaments', () => {
    it('returns only active tournaments', async () => {
      const result = await getTournaments();

      expect(mockFindAllActiveTournaments).toHaveBeenCalled();
      expect(result).toEqual([mockTournament]);
    });
  });

  describe('getGamesAroundMyTime', () => {
    it('returns games around current time for a tournament', async () => {
      const result = await getGamesAroundMyTime('tournament1');

      expect(mockFindGamesAroundCurrentTime).toHaveBeenCalledWith('tournament1');
      expect(result).toEqual([mockGame]);
    });
  });

  describe('getTeamsMap', () => {
    it('returns teams map for tournament', async () => {
      const result = await getTeamsMap('tournament1', 'tournament');

      expect(mockFindTeamInTournament).toHaveBeenCalledWith('tournament1');
      expect(result).toEqual({ 'team1': mockTeam });
    });

    it('returns teams map for group', async () => {
      const result = await getTeamsMap('group1', 'group');

      expect(mockFindTeamInGroup).toHaveBeenCalledWith('group1');
      expect(result).toEqual({ 'team1': mockTeam });
    });

    it('defaults to tournament when teamParent is not specified', async () => {
      const result = await getTeamsMap('tournament1');

      expect(mockFindTeamInTournament).toHaveBeenCalledWith('tournament1');
      expect(result).toEqual({ 'team1': mockTeam });
    });
  });

  describe('getCompleteGroupData', () => {
    it('returns complete group data when group exists', async () => {
      const result = await getCompleteGroupData('group1');

      expect(mockFindTournamentgroupById).toHaveBeenCalledWith('group1');
      expect(mockFindGroupsInTournament).toHaveBeenCalledWith('tournament1');
      expect(mockFindTeamInGroup).toHaveBeenCalledWith('group1');
      expect(mockFindGamesInGroup).toHaveBeenCalledWith('group1', true, false);
      expect(mockFindTeamsInGroup).toHaveBeenCalledWith('group1');
      expect(result).toBeDefined();
    });

    it('throws error when group does not exist', async () => {
      // Reset the mock for this specific test
      mockFindTournamentgroupById.mockReset();
      mockFindTournamentgroupById.mockResolvedValue(null);

      await expect(getCompleteGroupData('invalid-group'))
        .rejects.toBe('Invalid group id');
    });

    it('includes draft results when specified', async () => {
      await getCompleteGroupData('group1', true);

      expect(mockFindGamesInGroup).toHaveBeenCalledWith('group1', true, true);
    });
  });

  describe('getCompletePlayoffData', () => {
    it('returns complete playoff data', async () => {
      const result = await getCompletePlayoffData('tournament1');

      expect(mockFindPlayoffStagesWithGamesInTournament).toHaveBeenCalledWith('tournament1');
      expect(mockFindTeamInTournament).toHaveBeenCalledWith('tournament1');
      expect(mockFindGamesInTournament).toHaveBeenCalledWith('tournament1', true);
      expect(result).toBeDefined();
    });

    it('excludes draft results when specified', async () => {
      await getCompletePlayoffData('tournament1', false);

      expect(mockFindGamesInTournament).toHaveBeenCalledWith('tournament1', false);
    });
  });

  describe('getTournamentAndGroupsData', () => {
    it('returns tournament and groups data', async () => {
      const result = await getTournamentAndGroupsData('tournament1');

      expect(mockFindTournamentById).toHaveBeenCalledWith('tournament1');
      expect(mockFindGroupsInTournament).toHaveBeenCalledWith('tournament1');
      expect(result).toEqual({
        tournament: mockTournament,
        allGroups: [mockTournamentGroup]
      });
    });
  });

  describe('getTournamentStartDate', () => {
    it('returns first game date when games exist', async () => {
      const result = await getTournamentStartDate('tournament1');

      expect(mockFindFirstGameInTournament).toHaveBeenCalledWith('tournament1');
      expect(result).toEqual(mockGame.game_date);
    });

    it('returns default date when no games exist', async () => {
      mockFindFirstGameInTournament.mockResolvedValue(null);

      const result = await getTournamentStartDate('tournament1');

      expect(result).toEqual(new Date(2024, 0, 1));
    });
  });

  describe('deactivateTournament', () => {
    it('deactivates tournament when user is admin and tournament exists', async () => {
      const result = await deactivateTournament('tournament1');

      expect(mockGetLoggedInUser).toHaveBeenCalled();
      expect(mockFindTournamentById).toHaveBeenCalledWith('tournament1');
      expect(mockUpdateTournament).toHaveBeenCalledWith('tournament1', { is_active: false });
      expect(result).toBe(mockTournament);
    });

    it('throws error when user is not admin', async () => {
      mockGetLoggedInUser.mockResolvedValue(mockRegularUser);

      await expect(deactivateTournament('tournament1'))
        .rejects.toThrow('Unauthorized: Only administrators can deactivate tournaments');
      
      expect(mockUpdateTournament).not.toHaveBeenCalled();
    });

    it('throws error when user is not logged in', async () => {
      mockGetLoggedInUser.mockResolvedValue(null);

      await expect(deactivateTournament('tournament1'))
        .rejects.toThrow('Unauthorized: Only administrators can deactivate tournaments');
      
      expect(mockUpdateTournament).not.toHaveBeenCalled();
    });

    it('throws error when tournament does not exist', async () => {
      mockFindTournamentById.mockResolvedValue(null);

      await expect(deactivateTournament('invalid-tournament'))
        .rejects.toThrow('Tournament not found');
      
      expect(mockUpdateTournament).not.toHaveBeenCalled();
    });
  });

  describe('getTournamentById', () => {
    it('returns tournament by id', async () => {
      const result = await getTournamentById('tournament1');

      expect(mockFindTournamentById).toHaveBeenCalledWith('tournament1');
      expect(result).toBe(mockTournament);
    });
  });

  describe('getCompleteTournamentGroups', () => {
    it('returns complete tournament groups', async () => {
      const result = await getCompleteTournamentGroups('tournament1');

      expect(mockFindGroupsWithGamesAndTeamsInTournament).toHaveBeenCalledWith('tournament1');
      expect(result).toEqual([mockTournamentGroup]);
    });
  });

  describe('getPlayoffRounds', () => {
    it('returns playoff rounds for tournament', async () => {
      const result = await getPlayoffRounds('tournament1');

      expect(mockFindPlayoffStagesWithGamesInTournament).toHaveBeenCalledWith('tournament1');
      expect(result).toEqual([]);
    });
  });

  describe('createOrUpdatePlayoffRound', () => {
    const mockPlayoffRoundData: PlayoffRoundNew = {
      tournament_id: 'tournament1',
      round_name: 'Quarter Finals',
      round_order: 1,
      total_games: 4
    };

    it('creates new playoff round when user is admin', async () => {
      const result = await createOrUpdatePlayoffRound(mockPlayoffRoundData);

      expect(mockGetLoggedInUser).toHaveBeenCalled();
      expect(mockCreatePlayoffRound).toHaveBeenCalledWith(mockPlayoffRoundData);
      expect(result).toBeDefined();
    });

    it('updates existing playoff round when id is provided', async () => {
      const updateData: PlayoffRoundUpdate = { id: 'round1', ...mockPlayoffRoundData };
      await createOrUpdatePlayoffRound(updateData);

      expect(mockUpdatePlayoffRound).toHaveBeenCalledWith('round1', updateData);
    });

    it('throws error when user is not admin', async () => {
      mockGetLoggedInUser.mockResolvedValue(mockRegularUser);

      await expect(createOrUpdatePlayoffRound(mockPlayoffRoundData))
        .rejects.toThrow('Unauthorized: Only administrators can manage playoff stages');
      
      expect(mockCreatePlayoffRound).not.toHaveBeenCalled();
    });

    it('handles repository errors gracefully', async () => {
      mockCreatePlayoffRound.mockRejectedValue(new Error('Database error'));

      await expect(createOrUpdatePlayoffRound(mockPlayoffRoundData))
        .rejects.toThrow('Database error');
    });
  });
}); 