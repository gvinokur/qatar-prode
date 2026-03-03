import { vi, describe, it, expect, beforeEach } from 'vitest';
import * as userActions from '../../app/actions/user-actions';
import * as gameGuessRepository from '../../app/db/game-guess-repository';
import * as tournamentGuessRepository from '../../app/db/tournament-guess-repository';
import * as tournamentGroupRepository from '../../app/db/tournament-group-repository';
import * as playoffTeamsCalculator from '../../app/utils/playoff-teams-calculator';
import * as tournamentPlayoffRepository from '../../app/db/tournament-playoff-repository';
import * as gameRepository from '../../app/db/game-repository';
import * as qualifiedTeamsRepository from '../../app/db/qualified-teams-repository';
import { db } from '../../app/db/database';
import {
  updateOrCreateGameGuesses,
  updateOrCreateTournamentGuess,
  updatePlayoffGameGuesses,
} from '../../app/actions/guesses-actions';
import { GameGuessNew, TournamentGuessNew, UserUpdate, GameGuess, TournamentGuess } from '../../app/db/tables-definition';
import { ExtendedGameData, ExtendedPlayoffRoundData } from '../../app/definitions';

// Mock the auth module to prevent Next-auth module resolution errors
vi.mock('../../auth', () => ({
  auth: vi.fn(),
}));

// Mock the database
vi.mock('../../app/db/database', () => {
  const createQueryChain = () => ({
    selectAll: vi.fn(() => createQueryChain()),
    where: vi.fn(() => createQueryChain()),
    select: vi.fn(() => createQueryChain()),
    distinct: vi.fn(() => createQueryChain()),
    orderBy: vi.fn(() => createQueryChain()),
    execute: vi.fn().mockResolvedValue([]),
    executeTakeFirst: vi.fn().mockResolvedValue(null)
  });

  return {
    db: {
      selectFrom: vi.fn(() => createQueryChain()),
      updateTable: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            execute: vi.fn().mockResolvedValue(undefined)
          }))
        }))
      }))
    }
  };
});

vi.mock('../../app/actions/user-actions');
vi.mock('../../app/db/game-guess-repository');
vi.mock('../../app/db/tournament-guess-repository');
vi.mock('../../app/db/tournament-group-repository');
vi.mock('../../app/utils/playoff-teams-calculator');
vi.mock('../../app/db/tournament-playoff-repository');
vi.mock('../../app/db/game-repository');
vi.mock('../../app/db/qualified-teams-repository', () => ({
  getAllUserGroupPositionsPredictions: vi.fn().mockResolvedValue([]),
}));

const mockGetLoggedInUser = vi.mocked(userActions.getLoggedInUser);
const mockUpdateGameGuessByGameId = vi.mocked(gameGuessRepository.updateGameGuessByGameId);
const mockUpdateOrCreateGuess = vi.mocked(gameGuessRepository.updateOrCreateGuess);
const mockDbUpdateOrCreateTournamentGuess = vi.mocked(tournamentGuessRepository.updateOrCreateTournamentGuess);
const mockFindGroupsInTournament = vi.mocked(tournamentGroupRepository.findGroupsInTournament);
const mockCalculatePlayoffTeamsFromPositions = vi.mocked(playoffTeamsCalculator.calculatePlayoffTeamsFromPositions);
const mockFindPlayoffStagesWithGamesInTournament = vi.mocked(tournamentPlayoffRepository.findPlayoffStagesWithGamesInTournament);
const mockFindGamesInTournament = vi.mocked(gameRepository.findGamesInTournament);
const mockGetAllUserGroupPositionsPredictions = vi.mocked(qualifiedTeamsRepository.getAllUserGroupPositionsPredictions);

describe('Guesses Actions', () => {
  const mockUser = {
    id: 'user1',
    email: 'user@test.com',
    emailVerified: new Date(),
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

  const mockGameGuessResult: GameGuess = {
    id: 'guess1',
    game_id: 'game1',
    game_number: 1,
    user_id: 'user1',
    home_team: 'team1',
    away_team: 'team2',
    home_score: 2,
    away_score: 1,
    home_penalty_winner: undefined,
    away_penalty_winner: undefined,
    score: undefined,
    boost_type: null,
    boost_multiplier: 1.0,
    final_score: undefined,
    updated_at: new Date()
  };

  const mockTournamentGuess: TournamentGuessNew = {
    tournament_id: 'tournament1',
    user_id: 'user1',
    champion_team_id: 'team1',
    runner_up_team_id: 'team2'
  };

  const mockTournamentGuessResult: TournamentGuess = {
    id: 'tournament-guess1',
    tournament_id: 'tournament1',
    user_id: 'user1',
    champion_team_id: 'team1',
    runner_up_team_id: 'team2',
    third_place_team_id: undefined,
    best_player_id: undefined,
    top_goalscorer_player_id: undefined,
    best_goalkeeper_player_id: undefined,
    best_young_player_id: undefined,
    honor_roll_score: undefined,
    individual_awards_score: undefined,
    qualified_teams_score: undefined,
    group_position_score: undefined
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetLoggedInUser.mockResolvedValue(mockUser);
    mockUpdateOrCreateGuess.mockResolvedValue(mockGameGuessResult);
    mockDbUpdateOrCreateTournamentGuess.mockResolvedValue(mockTournamentGuessResult);
    mockFindGroupsInTournament.mockResolvedValue([]);
    mockFindPlayoffStagesWithGamesInTournament.mockResolvedValue([]);
    mockFindGamesInTournament.mockResolvedValue([]);
    mockCalculatePlayoffTeamsFromPositions.mockReturnValue(Promise.resolve({}));
    mockUpdateGameGuessByGameId.mockResolvedValue(mockGameGuessResult);
    mockGetAllUserGroupPositionsPredictions.mockResolvedValue([]);
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
      expect(result).toEqual({ success: true });
    });

    it('returns unauthorized when user is not logged in', async () => {
      mockGetLoggedInUser.mockResolvedValue(undefined);
      const gameGuesses = [mockGameGuess];

      const result = await updateOrCreateGameGuesses(gameGuesses);

      expect(result).toEqual({ success: false, error: 'guess.unauthorized' });
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

      const result = await updateOrCreateGameGuesses(gameGuesses);

      expect(result).toEqual({ success: false, error: 'Database error' });
    });
  });

  describe('updateOrCreateTournamentGuess', () => {
    it('creates or updates tournament guess', async () => {
      const result = await updateOrCreateTournamentGuess(mockTournamentGuess);

      expect(mockDbUpdateOrCreateTournamentGuess).toHaveBeenCalledWith(mockTournamentGuess);
      expect(result).toEqual(mockTournamentGuessResult);
    });

    it('handles repository errors', async () => {
      mockDbUpdateOrCreateTournamentGuess.mockRejectedValue(new Error('Database error'));

      const result = await updateOrCreateTournamentGuess(mockTournamentGuess);

      expect(result).toEqual({ success: false, error: 'guess.updateFailed' });
    });
  });

  describe('updatePlayoffGameGuesses', () => {
    const mockPlayoffStage: ExtendedPlayoffRoundData = {
      id: 'stage1',
      tournament_id: 'tournament1',
      round_name: 'Quarter Finals',
      round_order: 1,
      total_games: 4,
      is_final: false,
      is_third_place: false,
      is_first_stage: true,
      games: [{ game_id: 'game1' }]
    };

    const mockGame: ExtendedGameData = {
      id: 'game1',
      tournament_id: 'tournament1',
      game_number: 1,
      home_team: 'team1',
      away_team: 'team2',
      game_date: new Date('2024-01-01'),
      location: 'Stadium 1',
      home_team_rule: undefined,
      away_team_rule: undefined,
      game_type: 'playoff',
      game_local_timezone: undefined,
      group: undefined,
      playoffStage: undefined,
      gameResult: undefined
    };

    const mockGroup = {
      id: 'group1',
      tournament_id: 'tournament1',
      group_letter: 'A',
      sort_by_games_between_teams: false
    };

    const mockPlayoffTeams = {
      'game1': {
        game_id: 'game1',
        homeTeam: {
          team_id: 'team1',
          games_played: 3,
          points: 9,
          win: 3,
          draw: 0,
          loss: 0,
          goals_for: 6,
          goals_against: 1,
          goal_difference: 5,
          conduct_score: 0,
          is_complete: true
        },
        awayTeam: {
          team_id: 'team2',
          games_played: 3,
          points: 6,
          win: 2,
          draw: 0,
          loss: 1,
          goals_for: 4,
          goals_against: 3,
          goal_difference: 1,
          conduct_score: 0,
          is_complete: true
        }
      }
    };

    beforeEach(() => {
      mockFindPlayoffStagesWithGamesInTournament.mockResolvedValue([mockPlayoffStage]);
      mockFindGamesInTournament.mockResolvedValue([mockGame]);
      mockFindGroupsInTournament.mockResolvedValue([mockGroup]);
      mockCalculatePlayoffTeamsFromPositions.mockReturnValue(Promise.resolve(mockPlayoffTeams));
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
      mockGetLoggedInUser.mockResolvedValue(undefined);

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
          game_id: 'game1',
          homeTeam: { 
            team_id: 'team1',
            games_played: 3,
            points: 9,
            win: 3,
            draw: 0,
            loss: 0,
            goals_for: 6,
            goals_against: 1,
            goal_difference: 5,
            is_complete: true
          },
          awayTeam: undefined
        }
      };
      mockCalculatePlayoffTeamsFromPositions.mockReturnValue(mockPlayoffTeamsWithMissingTeams as any);

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

    it('updates orphaned guess game_id when matching guess found', async () => {
      const orphanedGuess = { id: 'orphan1', game_id: null, home_team: 'team1', away_team: 'team2', user_id: 'user1' };
      const orphanChain = {
        selectAll: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(orphanedGuess),
      };
      vi.mocked(db.selectFrom).mockReturnValueOnce(orphanChain as any);

      await updatePlayoffGameGuesses('tournament1');

      expect(orphanChain.executeTakeFirst).toHaveBeenCalled();
      expect(mockUpdateGameGuessByGameId).toHaveBeenCalledWith('game1', mockUser.id, {
        home_team: 'team1',
        away_team: 'team2',
      });
    });

    it('continues execution when orphaned guess update fails', async () => {
      const orphanedGuess = { id: 'orphan1', game_id: null, home_team: 'team1', away_team: 'team2', user_id: 'user1' };
      const orphanChain = {
        selectAll: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(orphanedGuess),
      };
      vi.mocked(db.selectFrom).mockReturnValueOnce(orphanChain as any);
      vi.mocked(db.updateTable).mockReturnValueOnce({
        set: vi.fn(() => ({ where: vi.fn(() => ({ execute: vi.fn().mockRejectedValue(new Error('DB update error')) })) }))
      } as any);

      // Should not throw despite the update error
      await expect(updatePlayoffGameGuesses('tournament1')).resolves.toBeDefined();
      expect(mockUpdateGameGuessByGameId).toHaveBeenCalled();
    });

    it('excludes position-3 teams with predicted_to_qualify: false from standings', async () => {
      mockFindGroupsInTournament.mockResolvedValue([mockGroup]);
      mockGetAllUserGroupPositionsPredictions.mockResolvedValue([
        {
          id: 'pred1',
          user_id: 'user1',
          tournament_id: 'tournament1',
          group_id: 'group1',
          team_predicted_positions: [
            { team_id: 'team1', predicted_position: 1, predicted_to_qualify: true },
            { team_id: 'team2', predicted_position: 2, predicted_to_qualify: true },
            { team_id: 'team3', predicted_position: 3, predicted_to_qualify: false },
          ] as any,
          created_at: new Date(),
          updated_at: new Date(),
        }
      ]);

      await updatePlayoffGameGuesses('tournament1');

      const callArgs = mockCalculatePlayoffTeamsFromPositions.mock.calls[0];
      const positionsByGroup = callArgs[3] as Record<string, Array<{ team_id: string; position: number }>>
      const groupAStandings = positionsByGroup['A'];

      expect(groupAStandings).toHaveLength(2);
      expect(groupAStandings.map(s => s.team_id)).toEqual(['team1', 'team2']);
      expect(groupAStandings.map(s => s.position)).toEqual([1, 2]);
    });

    it('includes position-3 teams with predicted_to_qualify: true in standings', async () => {
      mockFindGroupsInTournament.mockResolvedValue([mockGroup]);
      mockGetAllUserGroupPositionsPredictions.mockResolvedValue([
        {
          id: 'pred1',
          user_id: 'user1',
          tournament_id: 'tournament1',
          group_id: 'group1',
          team_predicted_positions: [
            { team_id: 'team1', predicted_position: 1, predicted_to_qualify: true },
            { team_id: 'team2', predicted_position: 2, predicted_to_qualify: true },
            { team_id: 'team3', predicted_position: 3, predicted_to_qualify: true },
          ] as any,
          created_at: new Date(),
          updated_at: new Date(),
        }
      ]);

      await updatePlayoffGameGuesses('tournament1');

      const callArgs = mockCalculatePlayoffTeamsFromPositions.mock.calls[0];
      const positionsByGroup = callArgs[3] as Record<string, Array<{ team_id: string; position: number }>>
      const groupAStandings = positionsByGroup['A'];

      expect(groupAStandings).toHaveLength(3);
      expect(groupAStandings.map(s => s.team_id)).toEqual(['team1', 'team2', 'team3']);
      expect(groupAStandings.map(s => s.position)).toEqual([1, 2, 3]);
    });

    it('always includes position-1 and position-2 teams regardless of predicted_to_qualify', async () => {
      mockFindGroupsInTournament.mockResolvedValue([mockGroup]);
      mockGetAllUserGroupPositionsPredictions.mockResolvedValue([
        {
          id: 'pred1',
          user_id: 'user1',
          tournament_id: 'tournament1',
          group_id: 'group1',
          team_predicted_positions: [
            { team_id: 'team1', predicted_position: 1, predicted_to_qualify: false },
            { team_id: 'team2', predicted_position: 2, predicted_to_qualify: false },
          ] as any,
          created_at: new Date(),
          updated_at: new Date(),
        }
      ]);

      await updatePlayoffGameGuesses('tournament1');

      const callArgs = mockCalculatePlayoffTeamsFromPositions.mock.calls[0];
      const positionsByGroup = callArgs[3] as Record<string, Array<{ team_id: string; position: number }>>
      const groupAStandings = positionsByGroup['A'];

      expect(groupAStandings).toHaveLength(2);
      expect(groupAStandings.map(s => s.team_id)).toEqual(['team1', 'team2']);
      expect(groupAStandings.map(s => s.position)).toEqual([1, 2]);
    });
  });
}); 