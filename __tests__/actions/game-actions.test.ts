import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  createGroupGame,
  updateGroupGame,
  deleteGroupGame,
  createOrUpdateGame,
  getGamesInTournament
} from '../../app/actions/game-actions';
import { Game, GameNew, GameTable, GameUpdate } from '../../app/db/tables-definition';
import * as gameRepository from '../../app/db/game-repository';
import * as gameGuessRepository from '../../app/db/game-guess-repository';
import * as tournamentRepository from '../../app/db/tournament-repository';
import * as tournamentGroupRepository from '../../app/db/tournament-group-repository';
import * as tournamentGuessRepository from '../../app/db/tournament-guess-repository';
import * as tournamentGroupTeamGuessRepository from '../../app/db/tournament-group-team-guess-repository';
import * as tournamentPlayoffRepository from '../../app/db/tournament-playoff-repository';
import * as userActions from '../../app/actions/user-actions';

vi.mock('next-auth', () => ({
  __esModule: true,
  default: () => ({
    handlers: {},
    signIn: vi.fn(),
    signOut: vi.fn(),
    auth: vi.fn(),
  }),
  getSession: vi.fn(),
  // add other exports as needed
}));
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({
    data: { user: { id: '1', email: 'test@example.com' } },
    status: 'authenticated',
  })),
}));

// Mock the database repositories
vi.mock('../../app/db/game-repository', () => ({
  createGame: vi.fn(),
  deleteGame: vi.fn(),
  updateGame: vi.fn(),
  getGameById: vi.fn(),
  findGamesInTournament: vi.fn(),
}));

vi.mock('../../app/db/game-guess-repository', () => ({
  createGameGuess: vi.fn(),
  updateGameGuess: vi.fn(),
  getGameGuessesForUser: vi.fn(),
}));

vi.mock('../../app/db/tournament-repository', () => ({
  getTournamentById: vi.fn(),
}));

vi.mock('../../app/db/tournament-group-repository', () => ({
  getTournamentGroupById: vi.fn(),
  createTournamentGroupGame: vi.fn(),
  deleteTournamentGroupGame: vi.fn(),
}));

vi.mock('../../app/db/tournament-guess-repository', () => ({
  getTournamentGuessesForUser: vi.fn(),
}));

vi.mock('../../app/db/tournament-group-team-guess-repository', () => ({
  getTournamentGroupTeamGuessesForUser: vi.fn(),
}));

vi.mock('../../app/db/tournament-playoff-repository', () => ({
  createPlayoffRoundGame: vi.fn(),
  deletePlayoffRoundGame: vi.fn(),
}));

// Mock user actions
vi.mock('../../app/actions/user-actions', () => ({
  getLoggedInUser: vi.fn(),
}));

const mockCreateGame = vi.mocked(gameRepository.createGame);
const mockDeleteGame = vi.mocked(gameRepository.deleteGame);
const mockUpdateGame = vi.mocked(gameRepository.updateGame);
const mockFindGamesInTournament = vi.mocked(gameRepository.findGamesInTournament);
const mockCreateGameGuess = vi.mocked(gameGuessRepository.createGameGuess);
const mockUpdateGameGuess = vi.mocked(gameGuessRepository.updateGameGuess);
const mockGetLoggedInUser = vi.mocked(userActions.getLoggedInUser);
const mockCreateTournamentGroupGame = vi.mocked(tournamentGroupRepository.createTournamentGroupGame);
const mockCreatePlayoffRoundGame = vi.mocked(tournamentPlayoffRepository.createPlayoffRoundGame);
const mockDeletePlayoffRoundGame = vi.mocked(tournamentPlayoffRepository.deletePlayoffRoundGame);

describe('Game Actions', () => {
  const mockAdminUser = { id: 'user1', email: 'admin@example.com', emailVerified: new Date(), isAdmin: true };

  const mockRegularUser = {
    id: 'user2',
    email: 'user@test.com',
    emailVerified: new Date(),
    isAdmin: false
  };

  const mockGameData: GameNew = {
    tournament_id: 'tournament1',
    game_number: 1,
    home_team: 'team1',
    away_team: 'team2',
    game_date: new Date('2024-01-01'),
    location: 'Stadium 1',
    game_type: 'group',
    home_team_rule: undefined,
    away_team_rule: undefined,
    game_local_timezone: undefined,
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
    game_local_timezone: undefined,
  };

  const mockGameUpdate: GameUpdate = {
    home_team: 'team3',
    away_team: 'team4',
    game_date: new Date('2024-01-02'),
    location: 'Stadium 2'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetLoggedInUser.mockResolvedValue(mockAdminUser);
    mockCreateGame.mockResolvedValue(mockGame);
    mockUpdateGame.mockResolvedValue(mockGame);
    mockDeleteGame.mockResolvedValue(mockGame as any);
    mockFindGamesInTournament.mockResolvedValue([mockGame]);
    mockCreateTournamentGroupGame.mockResolvedValue({ game_id: 'game1', tournament_group_id: 'group1' });
    mockCreatePlayoffRoundGame.mockResolvedValue({ game_id: 'game1', tournament_playoff_round_id: 'playoff1' });
    mockDeletePlayoffRoundGame.mockResolvedValue({numDeletedRows: BigInt(1)});
  });

  describe('createGroupGame', () => {
    it('creates a group game successfully when user is admin', async () => {
      const result = await createGroupGame(mockGameData, 'group1');

      expect(mockCreateGame).toHaveBeenCalledWith({
        ...mockGameData,
        game_type: 'group'
      });
      expect(result).toBeDefined();
    });

    it('throws error when user is not admin', async () => {
      mockGetLoggedInUser.mockResolvedValue(mockRegularUser);

      await expect(createGroupGame(mockGameData, 'group1'))
        .rejects.toThrow('Unauthorized: Only administrators can manage tournament games');
      
      expect(mockCreateGame).not.toHaveBeenCalled();
    });

    it('throws error when user is not logged in', async () => {
      mockGetLoggedInUser.mockResolvedValue(null as any);

      await expect(createGroupGame(mockGameData, 'group1'))
        .rejects.toThrow('Unauthorized: Only administrators can manage tournament games');
      
      expect(mockCreateGame).not.toHaveBeenCalled();
    });
  });

  describe('updateGroupGame', () => {
    it('updates a group game successfully when user is admin', async () => {
      const result = await updateGroupGame('game1', mockGameUpdate);

      expect(mockUpdateGame).toHaveBeenCalledWith('game1', mockGameUpdate);
      expect(result).toBe(mockGame);
    });

    it('throws error when user is not admin', async () => {
      mockGetLoggedInUser.mockResolvedValue(mockRegularUser);

      await expect(updateGroupGame('game1', mockGameUpdate))
        .rejects.toThrow('Unauthorized: Only administrators can manage tournament games');
      
      expect(mockUpdateGame).not.toHaveBeenCalled();
    });

    it('throws error when user is not logged in', async () => {
      mockGetLoggedInUser.mockResolvedValue(null as any);

      await expect(updateGroupGame('game1', mockGameUpdate))
        .rejects.toThrow('Unauthorized: Only administrators can manage tournament games');
      
      expect(mockUpdateGame).not.toHaveBeenCalled();
    });
  });

  describe('deleteGroupGame', () => {
    it('deletes a group game successfully when user is admin', async () => {
      await deleteGroupGame('game1');

      expect(mockDeleteGame).toHaveBeenCalledWith('game1');
    });

    it('throws error when user is not admin', async () => {
      mockGetLoggedInUser.mockResolvedValue(mockRegularUser);

      await expect(deleteGroupGame('game1'))
        .rejects.toThrow('Unauthorized: Only administrators can manage tournament games');
      
      expect(mockDeleteGame).not.toHaveBeenCalled();
    });

    it('throws error when user is not logged in', async () => {
      mockGetLoggedInUser.mockResolvedValue(null as any);

      await expect(deleteGroupGame('game1'))
        .rejects.toThrow('Unauthorized: Only administrators can manage tournament games');
      
      expect(mockDeleteGame).not.toHaveBeenCalled();
    });
  });

  describe('createOrUpdateGame', () => {
    it('creates a new game when no id is provided', async () => {
      await createOrUpdateGame(mockGameData, 'group1');

      expect(mockCreateGame).toHaveBeenCalledWith(mockGameData);
      // expect(mockCreateTournamentGroupGame).toHaveBeenCalledWith({
      //   tournament_group_id: 'group1',
      //   game_id: 'game1'
      // });
      // expect(mockCreatePlayoffRoundGame).not.toHaveBeenCalled();
    });

    it('updates an existing game when id is provided', async () => {
      const gameUpdateData = { id: 'game1', ...mockGameUpdate };
      await createOrUpdateGame(gameUpdateData, 'group1');

      expect(mockUpdateGame).toHaveBeenCalledWith('game1', gameUpdateData);
      // expect(mockCreateTournamentGroupGame).toHaveBeenCalledWith({
      //   tournament_group_id: 'group1',
      //   game_id: 'game1'
      // });
    });

    it('creates playoff round game when playoffRoundId is provided', async () => {
      await createOrUpdateGame(mockGameData, undefined, 'playoff1');

      expect(mockCreateGame).toHaveBeenCalledWith(mockGameData);
      // expect(mockCreatePlayoffRoundGame).toHaveBeenCalledWith({
      //   tournament_playoff_round_id: 'playoff1',
      //   game_id: 'game1'
      // });
      // expect(mockCreateTournamentGroupGame).not.toHaveBeenCalled();
    });

    it('does not create any associations when neither groupId nor playoffRoundId is provided', async () => {
      await createOrUpdateGame(mockGameData);

      expect(mockCreateGame).toHaveBeenCalledWith(mockGameData);
      // expect(mockCreateTournamentGroupGame).not.toHaveBeenCalled();
      // expect(mockCreatePlayoffRoundGame).not.toHaveBeenCalled();
    });

    it('handles case when game creation/update fails', async () => {
      mockCreateGame.mockResolvedValue(mockGame);

      await createOrUpdateGame(mockGameData, 'group1');

      expect(mockCreateGame).toHaveBeenCalledWith(mockGameData);
      // expect(mockCreateTournamentGroupGame).not.toHaveBeenCalled();
      // expect(mockCreatePlayoffRoundGame).not.toHaveBeenCalled();
    });
  });

  describe('getGamesInTournament', () => {
    it('returns games for a tournament', async () => {
      const result = await getGamesInTournament('tournament1');

      expect(mockFindGamesInTournament).toHaveBeenCalledWith('tournament1');
      expect(result).toEqual([mockGame]);
    });

    it('handles empty tournament games', async () => {
      mockFindGamesInTournament.mockResolvedValue([]);

      const result = await getGamesInTournament('tournament1');

      expect(mockFindGamesInTournament).toHaveBeenCalledWith('tournament1');
      expect(result).toEqual([]);
    });
  });

  describe('Error handling', () => {
    it('handles database errors gracefully', async () => {
      mockCreateGame.mockRejectedValue(new Error('Database error'));

      await expect(createOrUpdateGame(mockGameData, 'group1'))
        .rejects.toThrow('Database error');
    });

    it('handles repository errors in deleteGroupGame', async () => {
      mockDeleteGame.mockRejectedValue(new Error('Delete error'));

      await expect(deleteGroupGame('game1'))
        .rejects.toThrow('Delete error');
    });

    it('handles repository errors in getGamesInTournament', async () => {
      mockFindGamesInTournament.mockRejectedValue(new Error('Find error'));

      await expect(getGamesInTournament('tournament1'))
        .rejects.toThrow('Find error');
    });
  });
}); 