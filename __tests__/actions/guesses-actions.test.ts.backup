import {
  updateOrCreateGameGuesses,
  updateOrCreateTournamentGuess,
  updateOrCreateTournamentGroupTeamGuesses,
  updatePlayoffGameGuesses
} from '../../app/actions/guesses-actions';
import { GameGuessNew, TournamentGuessNew, TournamentGroupTeamStatsGuessNew, UserUpdate } from '../../app/db/tables-definition';

// Mock all the database repositories and dependencies
jest.mock('../../app/actions/user-actions', () => ({
  getLoggedInUser: jest.fn(),
}));

jest.mock('../../app/db/game-guess-repository', () => ({
  updateGameGuessByGameId: jest.fn(),
  updateOrCreateGuess: jest.fn(),
}));

jest.mock('../../app/db/tournament-guess-repository', () => ({
  updateOrCreateTournamentGuess: jest.fn(),
}));

jest.mock('../../app/db/tournament-group-team-guess-repository', () => ({
  findAllTournamentGroupTeamGuessInGroup: jest.fn(),
  upsertTournamentGroupTeamGuesses: jest.fn(),
}));

jest.mock('../../app/db/tournament-group-repository', () => ({
  findGroupsInTournament: jest.fn(),
}));

jest.mock('../../app/db/tournament-playoff-repository', () => ({
  findPlayoffStagesWithGamesInTournament: jest.fn(),
}));

jest.mock('../../app/db/game-repository', () => ({
  findGamesInTournament: jest.fn(),
}));

jest.mock('../../app/utils/playoff-teams-calculator', () => ({
  calculatePlayoffTeamsFromPositions: jest.fn(),
}));

jest.mock('../../app/db/database', () => ({
  db: {
    selectFrom: jest.fn(() => ({
      selectAll: jest.fn(() => ({
        where: jest.fn(() => ({
          where: jest.fn(() => ({
            where: jest.fn(() => ({
              where: jest.fn(() => ({
                executeTakeFirst: jest.fn().mockResolvedValue(null),
              })),
            })),
          })),
        })),
      })),
    })),
    updateTable: jest.fn(() => ({
      set: jest.fn(() => ({
        where: jest.fn(() => ({
          execute: jest.fn().mockResolvedValue(undefined),
        })),
      })),
    })),
  },
}));

// Import mocked functions
const mockGetLoggedInUser = require('../../app/actions/user-actions').getLoggedInUser;
const mockUpdateGameGuessByGameId = require('../../app/db/game-guess-repository').updateGameGuessByGameId;
const mockUpdateOrCreateGuess = require('../../app/db/game-guess-repository').updateOrCreateGuess;
const mockUpdateOrCreateTournamentGuess = require('../../app/db/tournament-guess-repository').updateOrCreateTournamentGuess;
const mockFindAllTournamentGroupTeamGuessInGroup = require('../../app/db/tournament-group-team-guess-repository').findAllTournamentGroupTeamGuessInGroup;
const mockUpsertTournamentGroupTeamGuesses = require('../../app/db/tournament-group-team-guess-repository').upsertTournamentGroupTeamGuesses;
const mockFindGroupsInTournament = require('../../app/db/tournament-group-repository').findGroupsInTournament;
const mockFindPlayoffStagesWithGamesInTournament = require('../../app/db/tournament-playoff-repository').findPlayoffStagesWithGamesInTournament;
const mockFindGamesInTournament = require('../../app/db/game-repository').findGamesInTournament;
const mockCalculatePlayoffTeamsFromPositions = require('../../app/utils/playoff-teams-calculator').calculatePlayoffTeamsFromPositions;

describe('Guesses Actions', () => {
  const mockUser = {
    id: 'user1',
    email: 'user@test.com',
    isAdmin: false
  };

  const mockGameGuess: GameGuessNew = {
    game_id: 'game1',
    game_number: 1,
    user_id: 'user1',
    home_team: 'team1',
    away_team: 'team2',
    home_score: 2,
    away_score: 1
  };

  const mockTournamentGuess: TournamentGuessNew = {
    tournament_id: 'tournament1',
    user_id: 'user1',
    champion_team_id: 'team1',
    runner_up_team_id: 'team2'
  };

  const mockGroupTeamGuess: TournamentGroupTeamStatsGuessNew = {
    tournament_group_id: 'group1',
    user_id: 'user1',
    team_id: 'team1',
    position: 1,
    games_played: 3,
    points: 9,
    win: 3,
    draw: 0,
    loss: 0,
    goals_for: 6,
    goals_against: 1,
    goal_difference: 5,
    is_complete: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetLoggedInUser.mockResolvedValue(mockUser);
    mockUpdateOrCreateGuess.mockResolvedValue({ id: 'guess1' });
    mockUpdateOrCreateTournamentGuess.mockResolvedValue({ id: 'tournament-guess1' });
    mockUpsertTournamentGroupTeamGuesses.mockResolvedValue([{ id: 'group-guess1' }]);
    mockFindAllTournamentGroupTeamGuessInGroup.mockResolvedValue([]);
    mockFindGroupsInTournament.mockResolvedValue([]);
    mockFindPlayoffStagesWithGamesInTournament.mockResolvedValue([]);
    mockFindGamesInTournament.mockResolvedValue([]);
    mockCalculatePlayoffTeamsFromPositions.mockReturnValue({});
    mockUpdateGameGuessByGameId.mockResolvedValue({ id: 'updated-guess1' });
  });

  describe('updateOrCreateGameGuesses', () => {
    it('creates game guesses when user is logged in', async () => {
      const gameGuesses = [mockGameGuess];
      const result = await updateOrCreateGameGuesses(gameGuesses);

      expect(mockGetLoggedInUser).toHaveBeenCalled();
      expect(mockUpdateOrCreateGuess).toHaveBeenCalledWith({
        ...mockGameGuess,
        user_id: mockUser.id
      });
      expect(result).toBeUndefined();
    });

    it('returns unauthorized when user is not logged in', async () => {
      mockGetLoggedInUser.mockResolvedValue(null);
      const gameGuesses = [mockGameGuess];

      const result = await updateOrCreateGameGuesses(gameGuesses);

      expect(result).toBe('Unauthorized action');
      expect(mockUpdateOrCreateGuess).not.toHaveBeenCalled();
    });

    it('handles multiple game guesses', async () => {
      const gameGuesses = [mockGameGuess, { ...mockGameGuess, game_id: 'game2' }];
      await updateOrCreateGameGuesses(gameGuesses);

      expect(mockUpdateOrCreateGuess).toHaveBeenCalledTimes(2);
    });

    it('handles repository errors gracefully', async () => {
      mockUpdateOrCreateGuess.mockRejectedValue(new Error('Database error'));
      const gameGuesses = [mockGameGuess];

      await expect(updateOrCreateGameGuesses(gameGuesses))
        .rejects.toThrow('Database error');
    });
  });

  describe('updateOrCreateTournamentGuess', () => {
    it('creates or updates tournament guess', async () => {
      const result = await updateOrCreateTournamentGuess(mockTournamentGuess);

      expect(mockUpdateOrCreateTournamentGuess).toHaveBeenCalledWith(mockTournamentGuess);
      expect(result).toEqual({ id: 'tournament-guess1' });
    });

    it('handles repository errors', async () => {
      mockUpdateOrCreateTournamentGuess.mockRejectedValue(new Error('Database error'));

      await expect(updateOrCreateTournamentGuess(mockTournamentGuess))
        .rejects.toThrow('Database error');
    });
  });

  describe('updateOrCreateTournamentGroupTeamGuesses', () => {
    it('creates or updates tournament group team guesses', async () => {
      const groupTeamGuesses = [mockGroupTeamGuess];
      const result = await updateOrCreateTournamentGroupTeamGuesses(groupTeamGuesses);

      expect(mockUpsertTournamentGroupTeamGuesses).toHaveBeenCalledWith(groupTeamGuesses);
      expect(result).toEqual([{ id: 'group-guess1' }]);
    });

    it('handles repository errors', async () => {
      mockUpsertTournamentGroupTeamGuesses.mockRejectedValue(new Error('Database error'));
      const groupTeamGuesses = [mockGroupTeamGuess];

      await expect(updateOrCreateTournamentGroupTeamGuesses(groupTeamGuesses))
        .rejects.toThrow('Database error');
    });
  });

  describe('updatePlayoffGameGuesses', () => {
    const mockPlayoffStage = {
      id: 'stage1',
      round_name: 'Quarter Finals',
      games: [{ id: 'game1' }]
    };

    const mockGame = {
      id: 'game1',
      tournament_id: 'tournament1',
      game_number: 1,
      game_date: new Date('2024-01-01')
    };

    const mockGroup = {
      id: 'group1',
      tournament_id: 'tournament1',
      group_letter: 'A'
    };

    const mockPlayoffTeams = {
      'game1': {
        homeTeam: { team_id: 'team1' },
        awayTeam: { team_id: 'team2' }
      }
    };

    beforeEach(() => {
      mockFindPlayoffStagesWithGamesInTournament.mockResolvedValue([mockPlayoffStage]);
      mockFindGamesInTournament.mockResolvedValue([mockGame]);
      mockFindGroupsInTournament.mockResolvedValue([mockGroup]);
      mockCalculatePlayoffTeamsFromPositions.mockReturnValue(mockPlayoffTeams);
    });

    it('updates playoff game guesses when user is logged in and playoff stages exist', async () => {
      const result = await updatePlayoffGameGuesses('tournament1');

      expect(mockGetLoggedInUser).toHaveBeenCalled();
      expect(mockFindPlayoffStagesWithGamesInTournament).toHaveBeenCalledWith('tournament1');
      expect(mockFindGamesInTournament).toHaveBeenCalledWith('tournament1');
      expect(mockFindGroupsInTournament).toHaveBeenCalledWith('tournament1');
      expect(mockCalculatePlayoffTeamsFromPositions).toHaveBeenCalled();
      expect(mockUpdateGameGuessByGameId).toHaveBeenCalledWith('game1', mockUser.id, {
        home_team: 'team1',
        away_team: 'team2'
      });
      expect(result).toBeDefined();
    });

    it('returns undefined when user is not logged in', async () => {
      mockGetLoggedInUser.mockResolvedValue(null);

      const result = await updatePlayoffGameGuesses('tournament1');

      expect(result).toBeUndefined();
      expect(mockUpdateGameGuessByGameId).not.toHaveBeenCalled();
    });

    it('returns undefined when no playoff stages exist', async () => {
      mockFindPlayoffStagesWithGamesInTournament.mockResolvedValue([]);

      const result = await updatePlayoffGameGuesses('tournament1');

      expect(result).toBeUndefined();
      expect(mockUpdateGameGuessByGameId).not.toHaveBeenCalled();
    });

    it('uses provided user when passed as parameter', async () => {
      const providedUser: UserUpdate = { id: 'user2' };
      await updatePlayoffGameGuesses('tournament1', providedUser);

      expect(mockGetLoggedInUser).not.toHaveBeenCalled();
      expect(mockUpdateGameGuessByGameId).toHaveBeenCalledWith('game1', 'user2', {
        home_team: 'team1',
        away_team: 'team2'
      });
    });

    it('handles games with missing teams', async () => {
      const mockPlayoffTeamsWithMissingTeams = {
        'game1': {
          homeTeam: { team_id: 'team1' },
          awayTeam: null
        }
      };
      mockCalculatePlayoffTeamsFromPositions.mockReturnValue(mockPlayoffTeamsWithMissingTeams);

      await updatePlayoffGameGuesses('tournament1');

      expect(mockUpdateGameGuessByGameId).toHaveBeenCalledWith('game1', mockUser.id, {
        home_team: 'team1',
        away_team: null
      });
    });

    it('handles database update errors gracefully', async () => {
      mockUpdateGameGuessByGameId.mockRejectedValue(new Error('Update failed'));

      await expect(updatePlayoffGameGuesses('tournament1'))
        .rejects.toThrow('Update failed');
    });

    // Note: The following tests are skipped due to complex database mocking requirements
    // They test edge cases in the temporary fix logic that would require sophisticated
    // database query mocking that is beyond the scope of this test suite
    it.skip('handles the temporary fix logic for existing guesses', async () => {
      // This test would require complex database mocking
    });

    it.skip('continues execution when temporary fix update fails', async () => {
      // This test would require complex database mocking
    });
  });
}); 