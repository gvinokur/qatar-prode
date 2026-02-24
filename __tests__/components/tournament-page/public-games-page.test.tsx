import { vi, describe, it, expect, beforeEach } from 'vitest';
import { PublicGamesPage } from '../../../app/components/tournament-page/public-games-page';
import * as tournamentActions from '../../../app/actions/tournament-actions';
import * as gameRepository from '../../../app/db/game-repository';
import * as tournamentGroupRepository from '../../../app/db/tournament-group-repository';
import * as tournamentPlayoffRepository from '../../../app/db/tournament-playoff-repository';
import { testFactories, createMany } from '../../db/test-factories';

// Mock tournament actions
vi.mock('../../../app/actions/tournament-actions', () => ({
  getTeamsMap: vi.fn(),
}));

// Mock database repositories
vi.mock('../../../app/db/game-repository', () => ({
  getAllTournamentGames: vi.fn(),
}));

vi.mock('../../../app/db/tournament-group-repository', () => ({
  findGroupsInTournament: vi.fn(),
}));

vi.mock('../../../app/db/tournament-playoff-repository', () => ({
  findPlayoffStagesWithGamesInTournament: vi.fn(),
}));

// Mock the client component
vi.mock('../../../app/components/tournament-page/public-games-page-client', () => ({
  default: ({ games, teamsMap, groups, rounds }: any) => (
    <div data-testid="public-games-page-client">
      <div data-testid="games-count">{games.length}</div>
      <div data-testid="teams-count">{Object.keys(teamsMap).length}</div>
      <div data-testid="groups-count">{groups.length}</div>
      <div data-testid="rounds-count">{rounds.length}</div>
    </div>
  ),
}));

const mockGetTeamsMap = vi.mocked(tournamentActions.getTeamsMap);
const mockGetAllTournamentGames = vi.mocked(gameRepository.getAllTournamentGames);
const mockFindGroupsInTournament = vi.mocked(tournamentGroupRepository.findGroupsInTournament);
const mockFindPlayoffStagesWithGamesInTournament = vi.mocked(tournamentPlayoffRepository.findPlayoffStagesWithGamesInTournament);

describe('PublicGamesPage', () => {
  const tournamentId = 'tournament-1';

  // Create mock data using test factories
  const mockTeam1 = testFactories.team({ id: 'team-1', name: 'Argentina', short_name: 'ARG' });
  const mockTeam2 = testFactories.team({ id: 'team-2', name: 'Brazil', short_name: 'BRA' });
  const mockTeam3 = testFactories.team({ id: 'team-3', name: 'Chile', short_name: 'CHI' });
  const mockTeam4 = testFactories.team({ id: 'team-4', name: 'Uruguay', short_name: 'URU' });

  const mockTeamsMap = {
    [mockTeam1.id]: mockTeam1,
    [mockTeam2.id]: mockTeam2,
    [mockTeam3.id]: mockTeam3,
    [mockTeam4.id]: mockTeam4,
  };

  const mockGames = createMany(testFactories.game, 4, (i) => ({
    id: `game-${i}`,
    tournament_id: tournamentId,
    game_number: i,
    home_team: i % 2 === 1 ? mockTeam1.id : mockTeam3.id,
    away_team: i % 2 === 1 ? mockTeam2.id : mockTeam4.id,
    game_date: new Date(`2024-06-${14 + i}T18:00:00Z`),
  }));

  const mockGroups = createMany(testFactories.tournamentGroup, 2, (i) => ({
    id: `group-${i}`,
    tournament_id: tournamentId,
    group_letter: i === 1 ? 'A' : 'B',
  }));

  const mockRounds = createMany(testFactories.playoffRound, 2, (i) => ({
    id: `round-${i}`,
    tournament_id: tournamentId,
    round_name: i === 1 ? 'Round of 16' : 'Quarterfinals',
    round_order: i,
  }));

  beforeEach(() => {
    vi.clearAllMocks();

    // Set default mock implementations
    mockGetAllTournamentGames.mockResolvedValue(mockGames);
    mockGetTeamsMap.mockResolvedValue(mockTeamsMap);
    mockFindGroupsInTournament.mockResolvedValue(mockGroups);
    mockFindPlayoffStagesWithGamesInTournament.mockResolvedValue(mockRounds);
  });

  describe('Data fetching', () => {
    it('should fetch all tournament data in parallel', async () => {
      await PublicGamesPage({ tournamentId });

      expect(mockGetAllTournamentGames).toHaveBeenCalledWith(tournamentId);
      expect(mockGetTeamsMap).toHaveBeenCalledWith(tournamentId);
      expect(mockFindGroupsInTournament).toHaveBeenCalledWith(tournamentId);
      expect(mockFindPlayoffStagesWithGamesInTournament).toHaveBeenCalledWith(tournamentId);
    });

    it('should fetch games correctly', async () => {
      const games = mockGames.slice(0, 2);
      mockGetAllTournamentGames.mockResolvedValue(games);

      await PublicGamesPage({ tournamentId });

      expect(mockGetAllTournamentGames).toHaveBeenCalledWith(tournamentId);
      expect(mockGetAllTournamentGames).toHaveBeenCalledTimes(1);
    });

    it('should fetch teams map correctly', async () => {
      const teamsMap = {
        [mockTeam1.id]: mockTeam1,
        [mockTeam2.id]: mockTeam2,
      };
      mockGetTeamsMap.mockResolvedValue(teamsMap);

      await PublicGamesPage({ tournamentId });

      expect(mockGetTeamsMap).toHaveBeenCalledWith(tournamentId);
      expect(mockGetTeamsMap).toHaveBeenCalledTimes(1);
    });

    it('should fetch groups correctly', async () => {
      const groups = mockGroups.slice(0, 1);
      mockFindGroupsInTournament.mockResolvedValue(groups);

      await PublicGamesPage({ tournamentId });

      expect(mockFindGroupsInTournament).toHaveBeenCalledWith(tournamentId);
      expect(mockFindGroupsInTournament).toHaveBeenCalledTimes(1);
    });

    it('should fetch playoff rounds correctly', async () => {
      const rounds = mockRounds.slice(0, 1);
      mockFindPlayoffStagesWithGamesInTournament.mockResolvedValue(rounds);

      await PublicGamesPage({ tournamentId });

      expect(mockFindPlayoffStagesWithGamesInTournament).toHaveBeenCalledWith(tournamentId);
      expect(mockFindPlayoffStagesWithGamesInTournament).toHaveBeenCalledTimes(1);
    });
  });

  describe('Client component rendering', () => {
    it('should render PublicGamesPageClient with correct props', async () => {
      const result = await PublicGamesPage({ tournamentId });

      expect(result).toBeDefined();
      expect(result.type).toBeDefined();
    });

    it('should pass all fetched data to client component', async () => {
      const result = await PublicGamesPage({ tournamentId });
      const props = result.props;

      expect(props.games).toEqual(mockGames);
      expect(props.teamsMap).toEqual(mockTeamsMap);
      expect(props.groups).toEqual(mockGroups);
      expect(props.rounds).toEqual(mockRounds);
    });

    it('should pass games array to client component', async () => {
      const games = mockGames.slice(0, 3);
      mockGetAllTournamentGames.mockResolvedValue(games);

      const result = await PublicGamesPage({ tournamentId });
      const props = result.props;

      expect(props.games).toEqual(games);
      expect(props.games.length).toBe(3);
    });

    it('should pass teams map to client component', async () => {
      const teamsMap = {
        [mockTeam1.id]: mockTeam1,
      };
      mockGetTeamsMap.mockResolvedValue(teamsMap);

      const result = await PublicGamesPage({ tournamentId });
      const props = result.props;

      expect(props.teamsMap).toEqual(teamsMap);
      expect(Object.keys(props.teamsMap).length).toBe(1);
    });

    it('should pass groups array to client component', async () => {
      const groups = [mockGroups[0]];
      mockFindGroupsInTournament.mockResolvedValue(groups);

      const result = await PublicGamesPage({ tournamentId });
      const props = result.props;

      expect(props.groups).toEqual(groups);
      expect(props.groups.length).toBe(1);
    });

    it('should pass rounds array to client component', async () => {
      const rounds = [mockRounds[0]];
      mockFindPlayoffStagesWithGamesInTournament.mockResolvedValue(rounds);

      const result = await PublicGamesPage({ tournamentId });
      const props = result.props;

      expect(props.rounds).toEqual(rounds);
      expect(props.rounds.length).toBe(1);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty games array', async () => {
      mockGetAllTournamentGames.mockResolvedValue([]);

      const result = await PublicGamesPage({ tournamentId });
      const props = result.props;

      expect(props.games).toEqual([]);
      expect(props.games.length).toBe(0);
    });

    it('should handle empty teams map', async () => {
      mockGetTeamsMap.mockResolvedValue({});

      const result = await PublicGamesPage({ tournamentId });
      const props = result.props;

      expect(props.teamsMap).toEqual({});
      expect(Object.keys(props.teamsMap).length).toBe(0);
    });

    it('should handle empty groups array', async () => {
      mockFindGroupsInTournament.mockResolvedValue([]);

      const result = await PublicGamesPage({ tournamentId });
      const props = result.props;

      expect(props.groups).toEqual([]);
      expect(props.groups.length).toBe(0);
    });

    it('should handle empty rounds array', async () => {
      mockFindPlayoffStagesWithGamesInTournament.mockResolvedValue([]);

      const result = await PublicGamesPage({ tournamentId });
      const props = result.props;

      expect(props.rounds).toEqual([]);
      expect(props.rounds.length).toBe(0);
    });

    it('should handle all data empty', async () => {
      mockGetAllTournamentGames.mockResolvedValue([]);
      mockGetTeamsMap.mockResolvedValue({});
      mockFindGroupsInTournament.mockResolvedValue([]);
      mockFindPlayoffStagesWithGamesInTournament.mockResolvedValue([]);

      const result = await PublicGamesPage({ tournamentId });
      const props = result.props;

      expect(props.games).toEqual([]);
      expect(props.teamsMap).toEqual({});
      expect(props.groups).toEqual([]);
      expect(props.rounds).toEqual([]);
    });

    it('should handle large datasets', async () => {
      const manyGames = createMany(testFactories.game, 50, (i) => ({
        id: `game-${i}`,
        tournament_id: tournamentId,
        game_number: i,
      }));

      const manyTeams = createMany(testFactories.team, 32, (i) => ({
        id: `team-${i}`,
        name: `Team ${i}`,
      }));

      const manyTeamsMap = Object.fromEntries(
        manyTeams.map(team => [team.id, team])
      );

      mockGetAllTournamentGames.mockResolvedValue(manyGames);
      mockGetTeamsMap.mockResolvedValue(manyTeamsMap);

      const result = await PublicGamesPage({ tournamentId });
      const props = result.props;

      expect(props.games.length).toBe(50);
      expect(Object.keys(props.teamsMap).length).toBe(32);
    });
  });

  describe('Error handling', () => {
    it('should propagate errors from getAllTournamentGames', async () => {
      const error = new Error('Failed to fetch games');
      mockGetAllTournamentGames.mockRejectedValue(error);

      await expect(PublicGamesPage({ tournamentId })).rejects.toThrow('Failed to fetch games');
    });

    it('should propagate errors from getTeamsMap', async () => {
      const error = new Error('Failed to fetch teams');
      mockGetTeamsMap.mockRejectedValue(error);

      await expect(PublicGamesPage({ tournamentId })).rejects.toThrow('Failed to fetch teams');
    });

    it('should propagate errors from findGroupsInTournament', async () => {
      const error = new Error('Failed to fetch groups');
      mockFindGroupsInTournament.mockRejectedValue(error);

      await expect(PublicGamesPage({ tournamentId })).rejects.toThrow('Failed to fetch groups');
    });

    it('should propagate errors from findPlayoffStagesWithGamesInTournament', async () => {
      const error = new Error('Failed to fetch rounds');
      mockFindPlayoffStagesWithGamesInTournament.mockRejectedValue(error);

      await expect(PublicGamesPage({ tournamentId })).rejects.toThrow('Failed to fetch rounds');
    });
  });

  describe('Different tournament IDs', () => {
    it('should fetch data for different tournament ID', async () => {
      const differentTournamentId = 'tournament-2';

      await PublicGamesPage({ tournamentId: differentTournamentId });

      expect(mockGetAllTournamentGames).toHaveBeenCalledWith(differentTournamentId);
      expect(mockGetTeamsMap).toHaveBeenCalledWith(differentTournamentId);
      expect(mockFindGroupsInTournament).toHaveBeenCalledWith(differentTournamentId);
      expect(mockFindPlayoffStagesWithGamesInTournament).toHaveBeenCalledWith(differentTournamentId);
    });

    it('should work with UUID-style tournament ID', async () => {
      const uuidTournamentId = '550e8400-e29b-41d4-a716-446655440000';

      await PublicGamesPage({ tournamentId: uuidTournamentId });

      expect(mockGetAllTournamentGames).toHaveBeenCalledWith(uuidTournamentId);
    });
  });
});
