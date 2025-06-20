import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  createGroupGame,
  updateGroupGame,
  deleteGroupGame,
  createOrUpdateGame,
  getGamesInTournament
} from '../../app/actions/game-actions';
import { Game, GameNew, GameUpdate } from '../../app/db/tables-definition';

// Mock the database repositories
jest.mock('../../app/db/game-repository', () => ({
  createGame: jest.fn(),
  deleteGame: jest.fn(),
  findGamesInTournament: jest.fn(),
  updateGame: jest.fn(),
}));

jest.mock('../../app/db/tournament-group-repository', () => ({
  createTournamentGroupGame: jest.fn(),
  deleteTournamentGroupGame: jest.fn(),
}));

jest.mock('../../app/db/tournament-playoff-repository', () => ({
  createPlayoffRoundGame: jest.fn(),
  deletePlayoffRoundGame: jest.fn(),
}));

// Mock user actions
jest.mock('../../app/actions/user-actions', () => ({
  getLoggedInUser: jest.fn(),
}));

const mockCreateGame = require('../../app/db/game-repository').createGame;
const mockDeleteGame = require('../../app/db/game-repository').deleteGame;
const mockFindGamesInTournament = require('../../app/db/game-repository').findGamesInTournament;
const mockUpdateGame = require('../../app/db/game-repository').updateGame;
const mockCreateTournamentGroupGame = require('../../app/db/tournament-group-repository').createTournamentGroupGame;
const mockDeleteTournamentGroupGame = require('../../app/db/tournament-group-repository').deleteTournamentGroupGame;
const mockCreatePlayoffRoundGame = require('../../app/db/tournament-playoff-repository').createPlayoffRoundGame;
const mockDeletePlayoffRoundGame = require('../../app/db/tournament-playoff-repository').deletePlayoffRoundGame;
const mockGetLoggedInUser = require('../../app/actions/user-actions').getLoggedInUser;

describe('Game Actions', () => {
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

  const mockGameData: GameNew = {
    tournament_id: 'tournament1',
    game_number: 1,
    home_team: 'team1',
    away_team: 'team2',
    game_date: new Date('2024-01-01'),
    location: 'Stadium 1',
    game_type: 'group'
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

  const mockGameUpdate: GameUpdate = {
    home_team: 'team3',
    away_team: 'team4',
    game_date: new Date('2024-01-02'),
    location: 'Stadium 2'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetLoggedInUser.mockResolvedValue(mockAdminUser);
    mockCreateGame.mockResolvedValue(mockGame);
    mockUpdateGame.mockResolvedValue(mockGame);
    mockDeleteGame.mockResolvedValue(undefined);
    mockFindGamesInTournament.mockResolvedValue([mockGame]);
    mockCreateTournamentGroupGame.mockResolvedValue({ tournament_group_id: 'group1', game_id: 'game1' });
    mockDeleteTournamentGroupGame.mockResolvedValue(undefined);
    mockCreatePlayoffRoundGame.mockResolvedValue(undefined);
    mockDeletePlayoffRoundGame.mockResolvedValue(undefined);
  });

  describe('createGroupGame', () => {
    it('creates a group game successfully when user is admin', async () => {
      const result = await createGroupGame(mockGameData, 'group1');

      expect(mockCreateGame).toHaveBeenCalledWith({
        ...mockGameData,
        game_type: 'group'
      });
      expect(mockCreateTournamentGroupGame).toHaveBeenCalledWith({
        tournament_group_id: 'group1',
        game_id: 'game1'
      });
      expect(result).toBeDefined();
    });

    it('throws error when user is not admin', async () => {
      mockGetLoggedInUser.mockResolvedValue(mockRegularUser);

      await expect(createGroupGame(mockGameData, 'group1'))
        .rejects.toThrow('Unauthorized: Only administrators can manage tournament games');
      
      expect(mockCreateGame).not.toHaveBeenCalled();
      expect(mockCreateTournamentGroupGame).not.toHaveBeenCalled();
    });

    it('throws error when user is not logged in', async () => {
      mockGetLoggedInUser.mockResolvedValue(null);

      await expect(createGroupGame(mockGameData, 'group1'))
        .rejects.toThrow('Unauthorized: Only administrators can manage tournament games');
      
      expect(mockCreateGame).not.toHaveBeenCalled();
      expect(mockCreateTournamentGroupGame).not.toHaveBeenCalled();
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
      mockGetLoggedInUser.mockResolvedValue(null);

      await expect(updateGroupGame('game1', mockGameUpdate))
        .rejects.toThrow('Unauthorized: Only administrators can manage tournament games');
      
      expect(mockUpdateGame).not.toHaveBeenCalled();
    });
  });

  describe('deleteGroupGame', () => {
    it('deletes a group game successfully when user is admin', async () => {
      await deleteGroupGame('game1');

      expect(mockDeleteTournamentGroupGame).toHaveBeenCalledWith('game1');
      expect(mockDeleteGame).toHaveBeenCalledWith('game1');
    });

    it('throws error when user is not admin', async () => {
      mockGetLoggedInUser.mockResolvedValue(mockRegularUser);

      await expect(deleteGroupGame('game1'))
        .rejects.toThrow('Unauthorized: Only administrators can manage tournament games');
      
      expect(mockDeleteTournamentGroupGame).not.toHaveBeenCalled();
      expect(mockDeleteGame).not.toHaveBeenCalled();
    });

    it('throws error when user is not logged in', async () => {
      mockGetLoggedInUser.mockResolvedValue(null);

      await expect(deleteGroupGame('game1'))
        .rejects.toThrow('Unauthorized: Only administrators can manage tournament games');
      
      expect(mockDeleteTournamentGroupGame).not.toHaveBeenCalled();
      expect(mockDeleteGame).not.toHaveBeenCalled();
    });
  });

  describe('createOrUpdateGame', () => {
    it('creates a new game when no id is provided', async () => {
      await createOrUpdateGame(mockGameData, 'group1');

      expect(mockCreateGame).toHaveBeenCalledWith(mockGameData);
      expect(mockDeleteTournamentGroupGame).toHaveBeenCalledWith('game1');
      expect(mockDeletePlayoffRoundGame).toHaveBeenCalledWith('game1');
      expect(mockCreateTournamentGroupGame).toHaveBeenCalledWith({
        tournament_group_id: 'group1',
        game_id: 'game1'
      });
      expect(mockCreatePlayoffRoundGame).not.toHaveBeenCalled();
    });

    it('updates an existing game when id is provided', async () => {
      const gameUpdateData = { id: 'game1', ...mockGameUpdate };
      await createOrUpdateGame(gameUpdateData, 'group1');

      expect(mockUpdateGame).toHaveBeenCalledWith('game1', gameUpdateData);
      expect(mockDeleteTournamentGroupGame).toHaveBeenCalledWith('game1');
      expect(mockDeletePlayoffRoundGame).toHaveBeenCalledWith('game1');
      expect(mockCreateTournamentGroupGame).toHaveBeenCalledWith({
        tournament_group_id: 'group1',
        game_id: 'game1'
      });
    });

    it('creates playoff round game when playoffRoundId is provided', async () => {
      await createOrUpdateGame(mockGameData, undefined, 'playoff1');

      expect(mockCreateGame).toHaveBeenCalledWith(mockGameData);
      expect(mockDeleteTournamentGroupGame).toHaveBeenCalledWith('game1');
      expect(mockDeletePlayoffRoundGame).toHaveBeenCalledWith('game1');
      expect(mockCreatePlayoffRoundGame).toHaveBeenCalledWith({
        tournament_playoff_round_id: 'playoff1',
        game_id: 'game1'
      });
      expect(mockCreateTournamentGroupGame).not.toHaveBeenCalled();
    });

    it('does not create any associations when neither groupId nor playoffRoundId is provided', async () => {
      await createOrUpdateGame(mockGameData);

      expect(mockCreateGame).toHaveBeenCalledWith(mockGameData);
      expect(mockDeleteTournamentGroupGame).toHaveBeenCalledWith('game1');
      expect(mockDeletePlayoffRoundGame).toHaveBeenCalledWith('game1');
      expect(mockCreateTournamentGroupGame).not.toHaveBeenCalled();
      expect(mockCreatePlayoffRoundGame).not.toHaveBeenCalled();
    });

    it('handles case when game creation/update fails', async () => {
      mockCreateGame.mockResolvedValue(undefined);

      await createOrUpdateGame(mockGameData, 'group1');

      expect(mockCreateGame).toHaveBeenCalledWith(mockGameData);
      expect(mockDeleteTournamentGroupGame).not.toHaveBeenCalled();
      expect(mockDeletePlayoffRoundGame).not.toHaveBeenCalled();
      expect(mockCreateTournamentGroupGame).not.toHaveBeenCalled();
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
      mockDeleteTournamentGroupGame.mockRejectedValue(new Error('Delete error'));

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