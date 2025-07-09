import { vi, describe, it, expect, beforeEach } from 'vitest';
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
import { Tournament, TournamentNew, TournamentGroup, Team, Game, PlayoffRound, PlayoffRoundNew, PlayoffRoundUpdate, TournamentGroupTeam } from '../../app/db/tables-definition';
import { CompleteGroupData, CompletePlayoffData, ExtendedPlayoffRoundData } from '../../app/definitions';

// Mock all database repositories
vi.mock('../../app/db/tournament-repository', () => ({
  createTournament: vi.fn(),
  findAllActiveTournaments: vi.fn(),
  findAllTournaments: vi.fn(),
  findTournamentById: vi.fn(),
  updateTournament: vi.fn(),
}));

vi.mock('../../app/db/game-repository', () => ({
  findFirstGameInTournament: vi.fn(),
  findGamesAroundCurrentTime: vi.fn(),
  findGamesInGroup: vi.fn(),
  findGamesInTournament: vi.fn(),
}));

vi.mock('../../app/db/tournament-group-repository', () => ({
  createTournamentGroup: vi.fn(),
  createTournamentGroupTeam: vi.fn(),
  deleteTournamentGroupTeams: vi.fn(),
  findGroupsInTournament: vi.fn(),
  findGroupsWithGamesAndTeamsInTournament: vi.fn(),
  findTeamsInGroup: vi.fn(),
  findTournamentgroupById: vi.fn(),
  updateTournamentGroup: vi.fn(),
}));

vi.mock('../../app/db/tournament-playoff-repository', () => ({
  createPlayoffRound: vi.fn(),
  findPlayoffStagesWithGamesInTournament: vi.fn(),
  updatePlayoffRound: vi.fn(),
}));

vi.mock('../../app/db/team-repository', () => ({
  findTeamInGroup: vi.fn(),
  findTeamInTournament: vi.fn(),
}));

vi.mock('../../app/actions/user-actions', () => ({
  getLoggedInUser: vi.fn(),
}));

// Mock the s3Client from nodejs-s3-typescript
vi.mock('nodejs-s3-typescript', () => ({
  s3Client: vi.fn(),
}));

// Mock the s3 actions module
vi.mock('../../app/actions/s3', () => ({
  createS3Client: vi.fn(),
  getS3KeyFromURL: vi.fn(),
}));

vi.mock('../../app/utils/ObjectUtils', () => ({
  toMap: vi.fn(),
}));

// Import mocked functions
import * as tournamentRepository from '../../app/db/tournament-repository';
import * as gameRepository from '../../app/db/game-repository';
import * as tournamentGroupRepository from '../../app/db/tournament-group-repository';
import * as tournamentPlayoffRepository from '../../app/db/tournament-playoff-repository';
import * as teamRepository from '../../app/db/team-repository';
import * as userActions from '../../app/actions/user-actions';
import * as s3 from '../../app/actions/s3';
import * as objectUtils from '../../app/utils/ObjectUtils';
import { s3Client } from 'nodejs-s3-typescript';

const mockCreateTournament = vi.mocked(tournamentRepository.createTournament);
const mockFindAllActiveTournaments = vi.mocked(tournamentRepository.findAllActiveTournaments);
const mockFindAllTournaments = vi.mocked(tournamentRepository.findAllTournaments);
const mockFindTournamentById = vi.mocked(tournamentRepository.findTournamentById);
const mockUpdateTournament = vi.mocked(tournamentRepository.updateTournament);

const mockFindFirstGameInTournament = vi.mocked(gameRepository.findFirstGameInTournament);
const mockFindGamesAroundCurrentTime = vi.mocked(gameRepository.findGamesAroundCurrentTime);
const mockFindGamesInGroup = vi.mocked(gameRepository.findGamesInGroup);
const mockFindGamesInTournament = vi.mocked(gameRepository.findGamesInTournament);

const mockCreateTournamentGroup = vi.mocked(tournamentGroupRepository.createTournamentGroup);
const mockCreateTournamentGroupTeam = vi.mocked(tournamentGroupRepository.createTournamentGroupTeam);
const mockDeleteTournamentGroupTeams = vi.mocked(tournamentGroupRepository.deleteTournamentGroupTeams);
const mockFindGroupsInTournament = vi.mocked(tournamentGroupRepository.findGroupsInTournament);
const mockFindGroupsWithGamesAndTeamsInTournament = vi.mocked(tournamentGroupRepository.findGroupsWithGamesAndTeamsInTournament);
const mockFindTeamsInGroup = vi.mocked(tournamentGroupRepository.findTeamsInGroup);
const mockFindTournamentgroupById = vi.mocked(tournamentGroupRepository.findTournamentgroupById);
const mockUpdateTournamentGroup = vi.mocked(tournamentGroupRepository.updateTournamentGroup);

const mockCreatePlayoffRound = vi.mocked(tournamentPlayoffRepository.createPlayoffRound);
const mockFindPlayoffStagesWithGamesInTournament = vi.mocked(tournamentPlayoffRepository.findPlayoffStagesWithGamesInTournament);
const mockUpdatePlayoffRound = vi.mocked(tournamentPlayoffRepository.updatePlayoffRound);

const mockFindTeamInGroup = vi.mocked(teamRepository.findTeamInGroup);
const mockFindTeamInTournament = vi.mocked(teamRepository.findTeamInTournament);

const mockGetLoggedInUser = vi.mocked(userActions.getLoggedInUser);
const mockCreateS3Client = vi.mocked(s3.createS3Client);
const mockGetS3KeyFromURL = vi.mocked(s3.getS3KeyFromURL);
const mockToMap = vi.mocked(objectUtils.toMap);
const mockS3ClientConstructor = vi.mocked(s3Client);

describe('Tournament Actions', () => {
  const mockAdminUser = { id: 'admin1', email: 'admin@example.com', emailVerified: new Date(), isAdmin: true };
  const mockRegularUser = { id: 'user1', email: 'user@example.com', emailVerified: new Date(), isAdmin: false };

  const mockTournament: Tournament = {
    id: 'tournament1',
    short_name: 'WC2024',
    long_name: 'World Cup 2024',
    is_active: true,
    theme: {
      primary_color: '#ff0000',
      secondary_color: '#00ff00',
      logo: 'https://example.com/logo.png',
      s3_logo_key: 'logos/logo.png',
      is_s3_logo: true,
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
  };

  const mockTournamentNew: TournamentNew = {
    short_name: 'WC2024',
    long_name: 'World Cup 2024',
    is_active: true,
    theme: {
      primary_color: '#ff0000',
      secondary_color: '#00ff00',
    },
  };

  const mockTournamentGroup: TournamentGroup = {
    id: 'group1',
    tournament_id: 'tournament1',
    group_letter: 'A',
    sort_by_games_between_teams: false,
  };

  const mockTeam: Team = {
    id: 'team1',
    name: 'Team One',
    short_name: 'T1',
    theme: null,
  };

  const mockGame: Game = {
    id: 'game1',
    tournament_id: 'tournament1',
    game_number: 1,
    home_team: 'team1',
    away_team: 'team2',
    game_date: new Date('2024-01-01'),
    location: 'Stadium A',
    game_type: 'group',
    home_team_rule: undefined,
    away_team_rule: undefined,
    game_local_timezone: undefined,
  };

  const mockPlayoffRound: ExtendedPlayoffRoundData = {
    id: 'playoff1',
    tournament_id: 'tournament1',
    round_name: 'Quarter Finals',
    round_order: 1,
    total_games: 4,
    is_final: false,
    is_third_place: false,
    is_first_stage: false,
    games: [{ game_id: 'game1' }],
  };

  const mockTournamentGroupTeam: TournamentGroupTeam = {
    id: 'pos1',
    team_id: 'team1',
    position: 1,
    tournament_group_id: 'group1',
    games_played: 0,
    points: 0,
    win: 0,
    draw: 0,
    loss: 0,
    goals_for: 0,
    goals_against: 0,
    goal_difference: 0,
    is_complete: false,
  };

  const mockS3Client = {
    uploadFile: vi.fn(),
    deleteFile: vi.fn(),
    config: {},
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetLoggedInUser.mockResolvedValue(mockAdminUser);
    mockToMap.mockImplementation((items) => {
      const map: any = {};
      items.forEach((item: any, index: number) => {
        map[item.id || `item${index}`] = item;
      });
      return map;
    });
    
    // Set up S3 mocks - similar to prode-group-actions pattern
    mockCreateS3Client.mockReturnValue(mockS3Client as any);
    mockGetS3KeyFromURL.mockReturnValue('logos/logo.png');
    mockS3Client.uploadFile.mockResolvedValue({ location: 'https://s3.example.com/new-logo.png', key: 'new-logo.png' });
    mockS3Client.deleteFile.mockResolvedValue(undefined);
    
    // Reset all repository mocks
    mockFindAllTournaments.mockResolvedValue([]);
    mockFindAllActiveTournaments.mockResolvedValue([]);
    mockFindTournamentById.mockResolvedValue(mockTournament);
    mockCreateTournament.mockResolvedValue(mockTournament);
    mockUpdateTournament.mockResolvedValue(mockTournament);
  });

  describe('getAllTournaments', () => {
    it('returns all tournaments including inactive ones', async () => {
      const tournaments = [mockTournament, { ...mockTournament, id: 'tournament2', is_active: false }];
      mockFindAllTournaments.mockResolvedValue(tournaments);

      const result = await getAllTournaments();

      expect(mockFindAllTournaments).toHaveBeenCalledWith();
      expect(result).toEqual(tournaments);
    });

    it('handles empty tournaments list', async () => {
      mockFindAllTournaments.mockResolvedValue([]);

      const result = await getAllTournaments();

      expect(result).toEqual([]);
    });

    it('handles database errors', async () => {
      mockFindAllTournaments.mockRejectedValue(new Error('Database error'));

      await expect(getAllTournaments()).rejects.toThrow('Database error');
    });
  });

  describe('getTournaments', () => {
    it('returns only active tournaments', async () => {
      const activeTournaments = [mockTournament];
      mockFindAllActiveTournaments.mockResolvedValue(activeTournaments);

      const result = await getTournaments();

      expect(mockFindAllActiveTournaments).toHaveBeenCalledWith();
      expect(result).toEqual(activeTournaments);
    });

    it('handles empty active tournaments', async () => {
      mockFindAllActiveTournaments.mockResolvedValue([]);

      const result = await getTournaments();

      expect(result).toEqual([]);
    });

    it('handles database errors', async () => {
      mockFindAllActiveTournaments.mockRejectedValue(new Error('Database error'));

      await expect(getTournaments()).rejects.toThrow('Database error');
    });
  });

  describe('getGamesAroundMyTime', () => {
    it('returns games around current time for tournament', async () => {
      const games = [mockGame];
      mockFindGamesAroundCurrentTime.mockResolvedValue(games);

      const result = await getGamesAroundMyTime('tournament1');

      expect(mockFindGamesAroundCurrentTime).toHaveBeenCalledWith('tournament1');
      expect(result).toEqual(games);
    });

    it('handles no games found', async () => {
      mockFindGamesAroundCurrentTime.mockResolvedValue([]);

      const result = await getGamesAroundMyTime('tournament1');

      expect(result).toEqual([]);
    });

    it('handles database errors', async () => {
      mockFindGamesAroundCurrentTime.mockRejectedValue(new Error('Database error'));

      await expect(getGamesAroundMyTime('tournament1')).rejects.toThrow('Database error');
    });
  });

  describe('getTeamsMap', () => {
    it('returns teams map for tournament', async () => {
      const teams = [mockTeam];
      mockFindTeamInTournament.mockResolvedValue(teams);

      const result = await getTeamsMap('tournament1', 'tournament');

      expect(mockFindTeamInTournament).toHaveBeenCalledWith('tournament1');
      expect(mockToMap).toHaveBeenCalledWith(teams);
      expect(result).toEqual({ team1: mockTeam });
    });

    it('returns teams map for group', async () => {
      const teams = [mockTeam];
      mockFindTeamInGroup.mockResolvedValue(teams);

      const result = await getTeamsMap('group1', 'group');

      expect(mockFindTeamInGroup).toHaveBeenCalledWith('group1');
      expect(mockToMap).toHaveBeenCalledWith(teams);
      expect(result).toEqual({ team1: mockTeam });
    });

    it('defaults to tournament when no teamParent specified', async () => {
      const teams = [mockTeam];
      mockFindTeamInTournament.mockResolvedValue(teams);

      const result = await getTeamsMap('tournament1');

      expect(mockFindTeamInTournament).toHaveBeenCalledWith('tournament1');
      expect(result).toEqual({ team1: mockTeam });
    });

    it('handles database errors', async () => {
      mockFindTeamInTournament.mockRejectedValue(new Error('Database error'));

      await expect(getTeamsMap('tournament1')).rejects.toThrow('Database error');
    });
  });

  describe('getCompleteGroupData', () => {
    it('returns complete group data', async () => {
      const groups = [mockTournamentGroup];
      const teams = [mockTeam];
      const games = [mockGame];
      const teamPositions = [mockTournamentGroupTeam];

      mockFindTournamentgroupById.mockResolvedValue(mockTournamentGroup);
      mockFindGroupsInTournament.mockResolvedValue(groups);
      mockFindTeamInGroup.mockResolvedValue(teams);
      mockFindGamesInGroup.mockResolvedValue(games);
      mockFindTeamsInGroup.mockResolvedValue(teamPositions);

      const result = await getCompleteGroupData('group1');

      expect(mockFindTournamentgroupById).toHaveBeenCalledWith('group1');
      expect(mockFindGroupsInTournament).toHaveBeenCalledWith('tournament1');
      expect(mockFindTeamInGroup).toHaveBeenCalledWith('group1');
      expect(mockFindGamesInGroup).toHaveBeenCalledWith('group1', true, false);
      expect(mockFindTeamsInGroup).toHaveBeenCalledWith('group1');
      expect(result).toEqual({
        group: mockTournamentGroup,
        allGroups: groups,
        teamsMap: { team1: mockTeam },
        gamesMap: { game1: mockGame },
        teamPositions,
      });
    });

    it('includes draft results when requested', async () => {
      const groups = [mockTournamentGroup];
      const teams = [mockTeam];
      const games = [mockGame];
      const teamPositions = [mockTournamentGroupTeam];

      mockFindTournamentgroupById.mockResolvedValue(mockTournamentGroup);
      mockFindGroupsInTournament.mockResolvedValue(groups);
      mockFindTeamInGroup.mockResolvedValue(teams);
      mockFindGamesInGroup.mockResolvedValue(games);
      mockFindTeamsInGroup.mockResolvedValue(teamPositions);

      await getCompleteGroupData('group1', true);

      expect(mockFindGamesInGroup).toHaveBeenCalledWith('group1', true, true);
    });

    it('throws error when group not found', async () => {
      mockFindTournamentgroupById.mockResolvedValue(null);

      await expect(getCompleteGroupData('group1')).rejects.toBe('Invalid group id');
    });

    it('handles database errors', async () => {
      mockFindTournamentgroupById.mockRejectedValue(new Error('Database error'));

      await expect(getCompleteGroupData('group1')).rejects.toThrow('Database error');
    });
  });

  describe('getCompletePlayoffData', () => {
    it('returns complete playoff data', async () => {
      const playoffStages = [mockPlayoffRound];
      const teams = [mockTeam];
      const games = [mockGame];

      mockFindPlayoffStagesWithGamesInTournament.mockResolvedValue(playoffStages);
      mockFindTeamInTournament.mockResolvedValue(teams);
      mockFindGamesInTournament.mockResolvedValue(games);

      const result = await getCompletePlayoffData('tournament1');

      expect(mockFindPlayoffStagesWithGamesInTournament).toHaveBeenCalledWith('tournament1');
      expect(mockFindTeamInTournament).toHaveBeenCalledWith('tournament1');
      expect(mockFindGamesInTournament).toHaveBeenCalledWith('tournament1', true);
      expect(result).toEqual({
        playoffStages,
        teamsMap: { team1: mockTeam },
        gamesMap: { game1: mockGame },
        tournamentStartDate: mockGame.game_date,
      });
    });

    it('excludes draft results when requested', async () => {
      const playoffStages = [mockPlayoffRound];
      const teams = [mockTeam];
      const games = [mockGame];

      mockFindPlayoffStagesWithGamesInTournament.mockResolvedValue(playoffStages);
      mockFindTeamInTournament.mockResolvedValue(teams);
      mockFindGamesInTournament.mockResolvedValue(games);

      await getCompletePlayoffData('tournament1', false);

      expect(mockFindGamesInTournament).toHaveBeenCalledWith('tournament1', false);
    });

    it('handles no games scenario', async () => {
      const playoffStages = [mockPlayoffRound];
      const teams = [mockTeam];

      mockFindPlayoffStagesWithGamesInTournament.mockResolvedValue(playoffStages);
      mockFindTeamInTournament.mockResolvedValue(teams);
      mockFindGamesInTournament.mockResolvedValue([]);

      const result = await getCompletePlayoffData('tournament1');

      expect(result.tournamentStartDate).toBeUndefined();
    });

    it('handles database errors', async () => {
      mockFindPlayoffStagesWithGamesInTournament.mockRejectedValue(new Error('Database error'));

      await expect(getCompletePlayoffData('tournament1')).rejects.toThrow('Database error');
    });
  });

  describe('getTournamentAndGroupsData', () => {
    it('returns tournament and groups data', async () => {
      const groups = [mockTournamentGroup];

      mockFindTournamentById.mockResolvedValue(mockTournament);
      mockFindGroupsInTournament.mockResolvedValue(groups);

      const result = await getTournamentAndGroupsData('tournament1');

      expect(mockFindTournamentById).toHaveBeenCalledWith('tournament1');
      expect(mockFindGroupsInTournament).toHaveBeenCalledWith('tournament1');
      expect(result).toEqual({
        tournament: mockTournament,
        allGroups: groups,
      });
    });

    it('handles database errors', async () => {
      mockFindTournamentById.mockRejectedValue(new Error('Database error'));

      await expect(getTournamentAndGroupsData('tournament1')).rejects.toThrow('Database error');
    });
  });

  describe('getTournamentStartDate', () => {
    it('returns tournament start date from first game', async () => {
      mockFindFirstGameInTournament.mockResolvedValue(mockGame);

      const result = await getTournamentStartDate('tournament1');

      expect(mockFindFirstGameInTournament).toHaveBeenCalledWith('tournament1');
      expect(result).toEqual(mockGame.game_date);
    });

    it('returns default date when no games found', async () => {
      mockFindFirstGameInTournament.mockResolvedValue(null);

      const result = await getTournamentStartDate('tournament1');

      expect(result).toEqual(new Date(2024, 0, 1));
    });

    it('handles database errors', async () => {
      mockFindFirstGameInTournament.mockRejectedValue(new Error('Database error'));

      await expect(getTournamentStartDate('tournament1')).rejects.toThrow('Database error');
    });
  });

  describe('deactivateTournament', () => {
    it('deactivates tournament when user is admin', async () => {
      mockFindTournamentById.mockResolvedValue(mockTournament);
      mockUpdateTournament.mockResolvedValue({ ...mockTournament, is_active: false });

      const result = await deactivateTournament('tournament1');

      expect(mockGetLoggedInUser).toHaveBeenCalledWith();
      expect(mockFindTournamentById).toHaveBeenCalledWith('tournament1');
      expect(mockUpdateTournament).toHaveBeenCalledWith('tournament1', { is_active: false });
      expect(result.is_active).toBe(false);
    });

    it('throws error when user is not admin', async () => {
      mockGetLoggedInUser.mockResolvedValue(mockRegularUser);

      await expect(deactivateTournament('tournament1'))
        .rejects.toThrow('Unauthorized: Only administrators can deactivate tournaments');
      
      expect(mockFindTournamentById).not.toHaveBeenCalled();
      expect(mockUpdateTournament).not.toHaveBeenCalled();
    });

    it('throws error when user is not logged in', async () => {
      mockGetLoggedInUser.mockResolvedValue(null);

      await expect(deactivateTournament('tournament1'))
        .rejects.toThrow('Unauthorized: Only administrators can deactivate tournaments');
      
      expect(mockFindTournamentById).not.toHaveBeenCalled();
      expect(mockUpdateTournament).not.toHaveBeenCalled();
    });

    it('throws error when tournament not found', async () => {
      mockFindTournamentById.mockResolvedValue(null);

      await expect(deactivateTournament('tournament1'))
        .rejects.toThrow('Tournament not found');
      
      expect(mockUpdateTournament).not.toHaveBeenCalled();
    });

    it('handles database errors', async () => {
      mockFindTournamentById.mockRejectedValue(new Error('Database error'));

      await expect(deactivateTournament('tournament1')).rejects.toThrow('Database error');
    });
  });

  describe('createOrUpdateTournament', () => {
    const mockFormData = new FormData();
    const mockTournamentData = {
      short_name: 'WC2024',
      long_name: 'World Cup 2024',
      is_active: true,
      theme: { primary_color: '#ff0000' },
    };

    beforeEach(() => {
      mockFormData.append('tournament', JSON.stringify(mockTournamentData));
    });

    it('creates new tournament when no tournamentId provided', async () => {
      mockCreateTournament.mockResolvedValue(mockTournament);

      const result = await createOrUpdateTournament(null, mockFormData);

      expect(mockCreateTournament).toHaveBeenCalledWith({
        ...mockTournamentData,
        theme: {
          primary_color: '#ff0000',
          logo: undefined,
          s3_logo_key: undefined,
          is_s3_logo: true,
        },
      });
      expect(result).toEqual(mockTournament);
    });

    it('updates existing tournament when tournamentId provided', async () => {
      mockFindTournamentById.mockResolvedValue(mockTournament);
      mockUpdateTournament.mockResolvedValue(mockTournament);

      const result = await createOrUpdateTournament('tournament1', mockFormData);

      expect(mockFindTournamentById).toHaveBeenCalledWith('tournament1');
      expect(mockUpdateTournament).toHaveBeenCalledWith('tournament1', {
        ...mockTournamentData,
        theme: {
          primary_color: '#ff0000',
          secondary_color: '#00ff00',
          logo: 'https://example.com/logo.png',
          s3_logo_key: 'logos/logo.png',
          is_s3_logo: true,
        },
      });
      expect(result).toEqual(mockTournament);
    });

    it('throws error when user is not admin', async () => {
      mockGetLoggedInUser.mockResolvedValue(mockRegularUser);

      await expect(createOrUpdateTournament(null, mockFormData))
        .rejects.toThrow('Unauthorized: Only administrators can manage tournaments');
      
      expect(mockCreateTournament).not.toHaveBeenCalled();
      expect(mockUpdateTournament).not.toHaveBeenCalled();
    });

    it('throws error when user is not logged in', async () => {
      mockGetLoggedInUser.mockResolvedValue(null);

      await expect(createOrUpdateTournament(null, mockFormData))
        .rejects.toThrow('Unauthorized: Only administrators can manage tournaments');
    });

    it('throws error when tournament not found for update', async () => {
      mockFindTournamentById.mockResolvedValue(null);

      await expect(createOrUpdateTournament('tournament1', mockFormData))
        .rejects.toThrow('Tournament not found');
    });

    it('handles logo upload for new tournament', async () => {
      const mockLogoFile = { size: 100, name: 'logo.png', type: 'image/png', arrayBuffer: async () => new Uint8Array([1,2,3]) };
      const mockFormDataEntries = [
        ['tournament', JSON.stringify(mockTournamentData)],
        ['logo', mockLogoFile]
      ];
      
      mockCreateTournament.mockResolvedValue(mockTournament);

      const result = await createOrUpdateTournament(null, mockFormDataEntries as any);

      expect(mockS3Client.uploadFile).toHaveBeenCalled();
      expect(mockCreateTournament).toHaveBeenCalledWith({
        ...mockTournamentData,
        theme: {
          primary_color: '#ff0000',
          logo: 'https://s3.example.com/new-logo.png',
          s3_logo_key: 'new-logo.png',
          is_s3_logo: true,
        },
      });
    });

    it('handles logo upload for existing tournament and deletes old logo', async () => {
      const mockLogoFile = { size: 100, name: 'logo.png', type: 'image/png', arrayBuffer: async () => new Uint8Array([1,2,3]) };
      const mockFormDataEntries = [
        ['tournament', JSON.stringify(mockTournamentData)],
        ['logo', mockLogoFile]
      ];
      
      mockFindTournamentById.mockResolvedValue(mockTournament);
      mockUpdateTournament.mockResolvedValue(mockTournament);

      const result = await createOrUpdateTournament('tournament1', mockFormDataEntries as any);

      expect(mockS3Client.uploadFile).toHaveBeenCalled();
      expect(mockS3Client.deleteFile).toHaveBeenCalledWith('logos/logo.png');
      expect(mockUpdateTournament).toHaveBeenCalledWith('tournament1', {
        ...mockTournamentData,
        theme: {
          primary_color: '#ff0000',
          secondary_color: '#00ff00',
          logo: 'https://s3.example.com/new-logo.png',
          s3_logo_key: 'new-logo.png',
          is_s3_logo: true,
        },
      });
    });

    it('handles S3 upload errors', async () => {
      const mockLogoFile = { size: 100, name: 'logo.png', type: 'image/png', arrayBuffer: async () => new Uint8Array([1,2,3]) };
      const mockFormDataEntries = [
        ['tournament', JSON.stringify(mockTournamentData)],
        ['logo', mockLogoFile]
      ];
      
      mockS3Client.uploadFile.mockRejectedValue(new Error('S3 upload failed'));

      await expect(createOrUpdateTournament(null, mockFormDataEntries as any))
        .rejects.toThrow('Failed to upload logo');
    });

    it('handles S3 delete errors gracefully', async () => {
      const mockLogoFile = { size: 100, name: 'logo.png', type: 'image/png', arrayBuffer: async () => new Uint8Array([1,2,3]) };
      const mockFormDataEntries = [
        ['tournament', JSON.stringify(mockTournamentData)],
        ['logo', mockLogoFile]
      ];
      
      mockFindTournamentById.mockResolvedValue(mockTournament);
      mockUpdateTournament.mockResolvedValue(mockTournament);
      mockS3Client.deleteFile.mockRejectedValue(new Error('S3 delete failed'));

      const result = await createOrUpdateTournament('tournament1', mockFormDataEntries as any);

      expect(result).toEqual(mockTournament);
      expect(mockS3Client.deleteFile).toHaveBeenCalledWith('logos/logo.png');
    });

    it('handles database errors', async () => {
      mockCreateTournament.mockRejectedValue(new Error('Database error'));

      await expect(createOrUpdateTournament(null, mockFormData))
        .rejects.toThrow('Database error');
    });
  });

  describe('getTournamentById', () => {
    it('returns tournament by id', async () => {
      mockFindTournamentById.mockResolvedValue(mockTournament);

      const result = await getTournamentById('tournament1');

      expect(mockFindTournamentById).toHaveBeenCalledWith('tournament1');
      expect(result).toEqual(mockTournament);
    });

    it('returns null when tournament not found', async () => {
      mockFindTournamentById.mockResolvedValue(null);

      const result = await getTournamentById('tournament1');

      expect(result).toBeNull();
    });

    it('handles database errors', async () => {
      mockFindTournamentById.mockRejectedValue(new Error('Database error'));

      await expect(getTournamentById('tournament1')).rejects.toThrow('Database error');
    });
  });

  describe('getCompleteTournamentGroups', () => {
    it('returns complete tournament groups', async () => {
      const groups = [mockTournamentGroup];
      mockFindGroupsWithGamesAndTeamsInTournament.mockResolvedValue(groups);

      const result = await getCompleteTournamentGroups('tournament1');

      expect(mockFindGroupsWithGamesAndTeamsInTournament).toHaveBeenCalledWith('tournament1');
      expect(result).toEqual(groups);
    });

    it('handles database errors', async () => {
      mockFindGroupsWithGamesAndTeamsInTournament.mockRejectedValue(new Error('Database error'));

      await expect(getCompleteTournamentGroups('tournament1')).rejects.toThrow('Database error');
    });
  });

  describe('createOrUpdateTournamentGroup', () => {
    const mockGroupData = {
      group_letter: 'A',
      sort_by_games_between_teams: false,
    };
    const mockTeamIds = ['team1', 'team2'];
    const mockUpdatedGroups = [mockTournamentGroup];

    it('creates new tournament group', async () => {
      mockCreateTournamentGroup.mockResolvedValue(mockTournamentGroup);
      mockCreateTournamentGroupTeam.mockResolvedValue({ id: 'groupteam1' } as any);
      mockFindGroupsWithGamesAndTeamsInTournament.mockResolvedValue(mockUpdatedGroups);

      const result = await createOrUpdateTournamentGroup('tournament1', mockGroupData, mockTeamIds);

      expect(mockCreateTournamentGroup).toHaveBeenCalledWith({
        tournament_id: 'tournament1',
        group_letter: 'A',
        sort_by_games_between_teams: false,
      });
      expect(mockCreateTournamentGroupTeam).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockUpdatedGroups);
    });

    it('updates existing tournament group', async () => {
      const groupDataWithId = { ...mockGroupData, id: 'group1' };
      mockUpdateTournamentGroup.mockResolvedValue(mockTournamentGroup);
      mockFindTeamInGroup.mockResolvedValue([mockTeam]);
      mockDeleteTournamentGroupTeams.mockResolvedValue([]);
      mockCreateTournamentGroupTeam.mockResolvedValue({ id: 'groupteam1' } as any);
      mockFindGroupsWithGamesAndTeamsInTournament.mockResolvedValue(mockUpdatedGroups);

      const result = await createOrUpdateTournamentGroup('tournament1', groupDataWithId, mockTeamIds);

      expect(mockUpdateTournamentGroup).toHaveBeenCalledWith('group1', {
        group_letter: 'A',
        sort_by_games_between_teams: false,
      });
      expect(mockFindTeamInGroup).toHaveBeenCalledWith('group1');
      expect(result).toEqual(mockUpdatedGroups);
    });

    it('throws error when user is not admin', async () => {
      mockGetLoggedInUser.mockResolvedValue(mockRegularUser);

      await expect(createOrUpdateTournamentGroup('tournament1', mockGroupData, mockTeamIds))
        .rejects.toThrow('Unauthorized: Only administrators can manage tournament groups');
      
      expect(mockCreateTournamentGroup).not.toHaveBeenCalled();
      expect(mockUpdateTournamentGroup).not.toHaveBeenCalled();
    });

    it('throws error when user is not logged in', async () => {
      mockGetLoggedInUser.mockResolvedValue(null);

      await expect(createOrUpdateTournamentGroup('tournament1', mockGroupData, mockTeamIds))
        .rejects.toThrow('Unauthorized: Only administrators can manage tournament groups');
    });

    it('handles team replacement in existing group', async () => {
      const groupDataWithId = { ...mockGroupData, id: 'group1' };
      const differentTeamIds = ['team3', 'team4'];
      mockUpdateTournamentGroup.mockResolvedValue(mockTournamentGroup);
      mockFindTeamInGroup.mockResolvedValue([mockTeam]);
      mockDeleteTournamentGroupTeams.mockResolvedValue([]);
      mockCreateTournamentGroupTeam.mockResolvedValue({ id: 'groupteam1' } as any);
      mockFindGroupsWithGamesAndTeamsInTournament.mockResolvedValue(mockUpdatedGroups);

      await createOrUpdateTournamentGroup('tournament1', groupDataWithId, differentTeamIds);

      expect(mockDeleteTournamentGroupTeams).toHaveBeenCalledWith('group1');
      expect(mockCreateTournamentGroupTeam).toHaveBeenCalledTimes(2);
    });

    it('skips team creation when teams are the same', async () => {
      const groupDataWithId = { ...mockGroupData, id: 'group1' };
      const existingTeams = [{ id: 'team1' }, { id: 'team2' }];
      mockUpdateTournamentGroup.mockResolvedValue(mockTournamentGroup);
      mockFindTeamInGroup.mockResolvedValue(existingTeams);
      mockFindGroupsWithGamesAndTeamsInTournament.mockResolvedValue(mockUpdatedGroups);

      await createOrUpdateTournamentGroup('tournament1', groupDataWithId, mockTeamIds);

      expect(mockDeleteTournamentGroupTeams).not.toHaveBeenCalled();
      expect(mockCreateTournamentGroupTeam).not.toHaveBeenCalled();
    });

    it('handles empty team list', async () => {
      mockCreateTournamentGroup.mockResolvedValue(mockTournamentGroup);
      mockFindGroupsWithGamesAndTeamsInTournament.mockResolvedValue(mockUpdatedGroups);

      const result = await createOrUpdateTournamentGroup('tournament1', mockGroupData, []);

      expect(mockCreateTournamentGroupTeam).not.toHaveBeenCalled();
      expect(result).toEqual(mockUpdatedGroups);
    });

    it('handles database errors', async () => {
      mockCreateTournamentGroup.mockRejectedValue(new Error('Database error'));

      await expect(createOrUpdateTournamentGroup('tournament1', mockGroupData, mockTeamIds))
        .rejects.toThrow('Database error');
    });
  });

  describe('getPlayoffRounds', () => {
    it('returns playoff rounds for tournament', async () => {
      const playoffRounds = [mockPlayoffRound];
      mockFindPlayoffStagesWithGamesInTournament.mockResolvedValue(playoffRounds);

      const result = await getPlayoffRounds('tournament1');

      expect(mockFindPlayoffStagesWithGamesInTournament).toHaveBeenCalledWith('tournament1');
      expect(result).toEqual(playoffRounds);
    });

    it('handles database errors', async () => {
      mockFindPlayoffStagesWithGamesInTournament.mockRejectedValue(new Error('Database error'));

      await expect(getPlayoffRounds('tournament1')).rejects.toThrow('Database error');
    });
  });

  describe('createOrUpdatePlayoffRound', () => {
    const mockPlayoffRoundNew: PlayoffRoundNew = {
      tournament_id: 'tournament1',
      round_name: 'Semi Finals',
      round_order: 2,
      total_games: 2,
      is_final: false,
      is_third_place: false,
      is_first_stage: false,
    };

    const mockPlayoffRoundUpdate: PlayoffRoundUpdate = {
      id: 'playoff1',
      round_name: 'Updated Semi Finals',
      round_order: 2,
      total_games: 2,
    };

    it('creates new playoff round', async () => {
      mockCreatePlayoffRound.mockResolvedValue(mockPlayoffRound);

      const result = await createOrUpdatePlayoffRound(mockPlayoffRoundNew);

      expect(mockCreatePlayoffRound).toHaveBeenCalledWith(mockPlayoffRoundNew);
      expect(result).toEqual(mockPlayoffRound);
    });

    it('updates existing playoff round', async () => {
      mockUpdatePlayoffRound.mockResolvedValue(mockPlayoffRound);

      const result = await createOrUpdatePlayoffRound(mockPlayoffRoundUpdate);

      expect(mockUpdatePlayoffRound).toHaveBeenCalledWith('playoff1', mockPlayoffRoundUpdate);
      expect(result).toEqual(mockPlayoffRound);
    });

    it('throws error when user is not admin', async () => {
      mockGetLoggedInUser.mockResolvedValue(mockRegularUser);

      await expect(createOrUpdatePlayoffRound(mockPlayoffRoundNew))
        .rejects.toThrow('Unauthorized: Only administrators can manage playoff stages');
      
      expect(mockCreatePlayoffRound).not.toHaveBeenCalled();
      expect(mockUpdatePlayoffRound).not.toHaveBeenCalled();
    });

    it('throws error when user is not logged in', async () => {
      mockGetLoggedInUser.mockResolvedValue(null);

      await expect(createOrUpdatePlayoffRound(mockPlayoffRoundNew))
        .rejects.toThrow('Unauthorized: Only administrators can manage playoff stages');
    });

    it('handles create operation errors', async () => {
      mockCreatePlayoffRound.mockRejectedValue(new Error('Create failed'));

      await expect(createOrUpdatePlayoffRound(mockPlayoffRoundNew))
        .rejects.toThrow('Create failed');
    });

    it('handles update operation errors', async () => {
      mockUpdatePlayoffRound.mockRejectedValue(new Error('Update failed'));

      await expect(createOrUpdatePlayoffRound(mockPlayoffRoundUpdate))
        .rejects.toThrow('Update failed');
    });

    it('wraps generic errors with consistent message', async () => {
      mockCreatePlayoffRound.mockRejectedValue(new Error());

      await expect(createOrUpdatePlayoffRound(mockPlayoffRoundNew))
        .rejects.toThrow('Failed to save playoff stage');
    });

    it('preserves specific error messages', async () => {
      mockCreatePlayoffRound.mockRejectedValue(new Error('Specific error'));

      await expect(createOrUpdatePlayoffRound(mockPlayoffRoundNew))
        .rejects.toThrow('Specific error');
    });
  });

  describe('Error handling and edge cases', () => {
    it('handles null/undefined values gracefully', async () => {
      mockFindAllTournaments.mockResolvedValue([]);
      mockFindAllActiveTournaments.mockResolvedValue([]);
      mockFindTournamentById.mockResolvedValue(null);

      const allTournaments = await getAllTournaments();
      const activeTournaments = await getTournaments();
      const tournament = await getTournamentById('nonexistent');

      expect(allTournaments).toEqual([]);
      expect(activeTournaments).toEqual([]);
      expect(tournament).toBeNull();
    });

    it('handles concurrent operations correctly', async () => {
      // Set up specific mock responses for concurrent test
      mockFindAllTournaments.mockResolvedValue([mockTournament]);
      mockFindAllActiveTournaments.mockResolvedValue([mockTournament]);
      mockFindTournamentById.mockResolvedValue(mockTournament);

      const promises = [
        getAllTournaments(),
        getTournaments(),
        getTournamentById('tournament1'),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(results[0]).toEqual([mockTournament]);
      expect(results[1]).toEqual([mockTournament]);
      expect(results[2]).toEqual(mockTournament);
    });

    it('handles malformed FormData in createOrUpdateTournament', async () => {
      const badFormData = new FormData();
      badFormData.append('tournament', 'invalid-json');

      await expect(createOrUpdateTournament(null, badFormData))
        .rejects.toThrow();
    });

    it('handles missing tournament data in FormData', async () => {
      const emptyFormData = new FormData();

      await expect(createOrUpdateTournament(null, emptyFormData))
        .rejects.toThrow();
    });
  });
});
