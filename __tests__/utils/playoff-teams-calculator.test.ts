import {
  calculatePlayoffTeams,
  calculatePlayoffTeamsFromPositions,
  calculateTeamNamesForPlayoffGame,
  groupCompleteReducer
} from '../../app/utils/playoff-teams-calculator';
import { Game, GameGuessNew, TeamStats } from '../../app/db/tables-definition';
import { ExtendedGroupData, ExtendedPlayoffRoundData } from '../../app/definitions';
import { vi } from 'vitest';

// Mock the third place rules repository
vi.mock('../../app/db/tournament-third-place-rules-repository', () => ({
  getThirdPlaceRulesMapForTournament: vi.fn().mockResolvedValue({})
}));

describe('playoff-teams-calculator', () => {
  const mockGame = (gameId: string, gameNumber: number, homeTeam?: string, awayTeam?: string): Game => ({
    id: gameId,
    tournament_id: 'test-tournament',
    game_number: gameNumber,
    home_team: homeTeam,
    away_team: awayTeam,
    game_date: new Date(),
    location: 'test-venue',
    home_team_rule: { group: 'A', position: 1 },
    away_team_rule: { group: 'B', position: 2 },
    game_type: undefined,
    game_local_timezone: undefined
  });

  const mockTeamStats = (teamId: string, points: number, isComplete = true): TeamStats => ({
    team_id: teamId,
    games_played: 3,
    points: points,
    win: points === 9 ? 3 : points === 6 ? 2 : points === 3 ? 1 : 0,
    draw: points % 3 === 1 ? 1 : 0,
    loss: points === 0 ? 3 : points === 3 ? 2 : points === 6 ? 1 : 0,
    goals_for: 5,
    goals_against: 2,
    goal_difference: 3,
    conduct_score: 0,
    is_complete: isComplete
  });

  const mockExtendedGroupData = (groupLetter: string, teamStats: TeamStats[]): ExtendedGroupData => ({
    id: `group-${groupLetter}`,
    tournament_id: 'test-tournament',
    group_letter: groupLetter,
    sort_by_games_between_teams: false,
    games: [],
    teams: teamStats.map(ts => ({ team_id: ts.team_id }))
  });

  const mockExtendedPlayoffRoundData = (games: Game[]): ExtendedPlayoffRoundData => ({
    id: 'playoff-round-1',
    tournament_id: 'test-tournament',
    round_name: 'Round of 16',
    round_order: 1,
    total_games: games.length,
    is_final: false,
    is_third_place: false,
    is_first_stage: true,
    games: games.map(g => ({ game_id: g.id }))
  });

  describe('calculatePlayoffTeams', () => {
    it('should calculate playoff teams correctly for first stage', async () => {
      const groups: ExtendedGroupData[] = [
        mockExtendedGroupData('A', [
          mockTeamStats('team1', 9), // 1st
          mockTeamStats('team2', 6), // 2nd
          mockTeamStats('team3', 3), // 3rd
          mockTeamStats('team4', 0)  // 4th
        ]),
        mockExtendedGroupData('B', [
          mockTeamStats('team5', 9), // 1st
          mockTeamStats('team6', 6), // 2nd
          mockTeamStats('team7', 3), // 3rd
          mockTeamStats('team8', 0)  // 4th
        ])
      ];

      const firstPlayoffStage = mockExtendedPlayoffRoundData([
        mockGame('game1', 1, undefined, undefined),
        mockGame('game2', 2, undefined, undefined)
      ]);

      const gamesMap = {
        'game1': mockGame('game1', 1),
        'game2': mockGame('game2', 2)
      };

      const gameResultsMap = {};
      const gameGuessesMap = {};

      const result = await calculatePlayoffTeams(
        'test-tournament',
        firstPlayoffStage,
        groups,
        gamesMap,
        gameResultsMap,
        gameGuessesMap
      );

      expect(result).toBeDefined();
      expect(Object.keys(result)).toHaveLength(2);
    });

    it('should handle groups with incomplete data', async () => {
      const groups: ExtendedGroupData[] = [
        mockExtendedGroupData('A', [
          mockTeamStats('team1', 9, false), // incomplete
          mockTeamStats('team2', 6, false), // incomplete
          mockTeamStats('team3', 3, false), // incomplete
          mockTeamStats('team4', 0, false)  // incomplete
        ])
      ];

      const firstPlayoffStage = mockExtendedPlayoffRoundData([
        mockGame('game1', 1, undefined, undefined)
      ]);

      const gamesMap = {
        'game1': mockGame('game1', 1)
      };

      const gameResultsMap = {};
      const gameGuessesMap = {};

      const result = await calculatePlayoffTeams(
        'test-tournament',
        firstPlayoffStage,
        groups,
        gamesMap,
        gameResultsMap,
        gameGuessesMap
      );

      expect(result).toBeDefined();
      // Should handle incomplete groups gracefully
    });

    it('should handle empty groups array', async () => {
      const groups: ExtendedGroupData[] = [];

      const firstPlayoffStage = mockExtendedPlayoffRoundData([
        mockGame('game1', 1, undefined, undefined)
      ]);

      const gamesMap = {
        'game1': mockGame('game1', 1)
      };

      const gameResultsMap = {};
      const gameGuessesMap = {};

      const result = await calculatePlayoffTeams(
        'test-tournament',
        firstPlayoffStage,
        groups,
        gamesMap,
        gameResultsMap,
        gameGuessesMap
      );

      expect(result).toBeDefined();
      expect(Object.keys(result)).toHaveLength(1);
    });
  });

  describe('calculatePlayoffTeamsFromPositions', () => {
    it('should calculate teams from positions correctly', async () => {
      const positionsByGroup = {
        'A': [
          mockTeamStats('team1', 9), // 1st
          mockTeamStats('team2', 6), // 2nd
          mockTeamStats('team3', 3), // 3rd
          mockTeamStats('team4', 0)  // 4th
        ],
        'B': [
          mockTeamStats('team5', 9), // 1st
          mockTeamStats('team6', 6), // 2nd
          mockTeamStats('team7', 3), // 3rd
          mockTeamStats('team8', 0)  // 4th
        ]
      };

      const firstPlayoffStage = mockExtendedPlayoffRoundData([
        mockGame('game1', 1, undefined, undefined),
        mockGame('game2', 2, undefined, undefined)
      ]);

      const gamesMap = {
        'game1': mockGame('game1', 1),
        'game2': mockGame('game2', 2)
      };

      const result = await calculatePlayoffTeamsFromPositions(
        'test-tournament',
        firstPlayoffStage,
        gamesMap,
        positionsByGroup
      );

      expect(result).toBeDefined();
      expect(Object.keys(result)).toHaveLength(2);
    });

    it('should handle third place team rules correctly', async () => {
      const positionsByGroup = {
        'A': [
          mockTeamStats('team1', 9), // 1st
          mockTeamStats('team2', 6), // 2nd
          mockTeamStats('team3', 3), // 3rd
          mockTeamStats('team4', 0)  // 4th
        ],
        'B': [
          mockTeamStats('team5', 9), // 1st
          mockTeamStats('team6', 6), // 2nd
          mockTeamStats('team7', 3), // 3rd
          mockTeamStats('team8', 0)  // 4th
        ],
        'C': [
          mockTeamStats('team9', 9), // 1st
          mockTeamStats('team10', 6), // 2nd
          mockTeamStats('team11', 3), // 3rd
          mockTeamStats('team12', 0)  // 4th
        ],
        'D': [
          mockTeamStats('team13', 9), // 1st
          mockTeamStats('team14', 6), // 2nd
          mockTeamStats('team15', 3), // 3rd
          mockTeamStats('team16', 0)  // 4th
        ]
      };

      const firstPlayoffStage = mockExtendedPlayoffRoundData([
        mockGame('game1', 1, undefined, undefined)
      ]);

      const gamesMap = {
        'game1': mockGame('game1', 1)
      };

      const result = await calculatePlayoffTeamsFromPositions(
        'test-tournament',
        firstPlayoffStage,
        gamesMap,
        positionsByGroup
      );

      expect(result).toBeDefined();
      expect(Object.keys(result)).toHaveLength(1);
    });

    it('should handle missing third place teams', async () => {
      const positionsByGroup = {
        'A': [
          mockTeamStats('team1', 9), // 1st
          mockTeamStats('team2', 6), // 2nd
          // Missing 3rd and 4th place teams
        ]
      };

      const firstPlayoffStage = mockExtendedPlayoffRoundData([
        mockGame('game1', 1, undefined, undefined)
      ]);

      const gamesMap = {
        'game1': mockGame('game1', 1)
      };

      const result = await calculatePlayoffTeamsFromPositions(
        'test-tournament',
        firstPlayoffStage,
        gamesMap,
        positionsByGroup
      );

      expect(result).toBeDefined();
      expect(Object.keys(result)).toHaveLength(1);
    });

    it('should handle empty positions by group', async () => {
      const positionsByGroup = {};

      const firstPlayoffStage = mockExtendedPlayoffRoundData([
        mockGame('game1', 1, undefined, undefined)
      ]);

      const gamesMap = {
        'game1': mockGame('game1', 1)
      };

      const result = await calculatePlayoffTeamsFromPositions(
        'test-tournament',
        firstPlayoffStage,
        gamesMap,
        positionsByGroup
      );

      expect(result).toBeDefined();
      expect(Object.keys(result)).toHaveLength(1);
    });
  });

  describe('calculateTeamNamesForPlayoffGame', () => {
    it('should calculate team names for playoff game with guesses', () => {
      const isPlayoffGame = true;
      const game = {
        ...mockGame('game1', 1, undefined, undefined),
        home_team_rule: { game: 1, winner: true },
        away_team_rule: { game: 2, winner: true }
      };
      const gameGuesses = {
        'guess1': {
          game_number: 1,
          game_id: 'game1',
          user_id: 'user1',
          home_team: 'team1',
          away_team: 'team2',
          home_score: 2,
          away_score: 1,
          home_penalty_winner: false,
          away_penalty_winner: false
        } as GameGuessNew
      };
      const gamesMap = {
        'game1': mockGame('game1', 1, 'team1', 'team2')
      };

      const result = calculateTeamNamesForPlayoffGame(
        isPlayoffGame,
        game,
        gameGuesses,
        gamesMap
      );

      expect(result).toBeDefined();
    });

    it('should handle non-playoff games', () => {
      const isPlayoffGame = false;
      const game = mockGame('game1', 1, 'team1', 'team2');
      const gameGuesses = {};
      const gamesMap = {};

      const result = calculateTeamNamesForPlayoffGame(
        isPlayoffGame,
        game,
        gameGuesses,
        gamesMap
      );

      expect(result).toBeUndefined();
    });

    it('should handle playoff games with existing teams', () => {
      const isPlayoffGame = true;
      const game = {
        ...mockGame('game1', 1, 'team1', 'team2'),
        home_team_rule: { game: 1, winner: true },
        away_team_rule: { game: 2, winner: true }
      };
      const gameGuesses = {};
      const gamesMap = {};

      const result = calculateTeamNamesForPlayoffGame(
        isPlayoffGame,
        game,
        gameGuesses,
        gamesMap
      );

      expect(result).toBeUndefined();
    });

    it('should handle missing game guesses', () => {
      const isPlayoffGame = true;
      const game = {
        ...mockGame('game1', 1, undefined, undefined),
        home_team_rule: { game: 1, winner: true },
        away_team_rule: { game: 2, winner: true }
      };
      const gameGuesses = {};
      const gamesMap = {};

      const result = calculateTeamNamesForPlayoffGame(
        isPlayoffGame,
        game,
        gameGuesses,
        gamesMap
      );

      expect(result).toEqual({ homeTeam: undefined, awayTeam: undefined });
    });

    it('should calculate team names with loser rules for home team', () => {
      const isPlayoffGame = true;
      const game = {
        ...mockGame('game1', 1, undefined, undefined),
        home_team_rule: { game: 1, winner: false }, // loser
        away_team_rule: { game: 2, winner: true }   // winner
      };
      const gameGuesses = {
        'guess1': {
          game_number: 1,
          game_id: 'game1',
          user_id: 'user1',
          home_team: 'team1',
          away_team: 'team2',
          home_score: 1,  // team1 loses
          away_score: 2,  // team2 wins
          home_penalty_winner: false,
          away_penalty_winner: false
        } as GameGuessNew,
        'guess2': {
          game_number: 2,
          game_id: 'game2',
          user_id: 'user1',
          home_team: 'team3',
          away_team: 'team4',
          home_score: 3,  // team3 wins
          away_score: 1,  // team4 loses
          home_penalty_winner: false,
          away_penalty_winner: false
        } as GameGuessNew
      };
      const gamesMap = {
        'game1': mockGame('game1', 1, 'team1', 'team2'),
        'game2': mockGame('game2', 2, 'team3', 'team4')
      };

      const result = calculateTeamNamesForPlayoffGame(
        isPlayoffGame,
        game,
        gameGuesses,
        gamesMap
      );

      expect(result).toBeDefined();
      expect(result?.homeTeam).toBe('team1'); // loser of game 1
      expect(result?.awayTeam).toBe('team3'); // winner of game 2
    });

    it('should calculate team names with loser rules for away team', () => {
      const isPlayoffGame = true;
      const game = {
        ...mockGame('game1', 1, undefined, undefined),
        home_team_rule: { game: 1, winner: true },  // winner
        away_team_rule: { game: 2, winner: false }  // loser
      };
      const gameGuesses = {
        'guess1': {
          game_number: 1,
          game_id: 'game1',
          user_id: 'user1',
          home_team: 'team1',
          away_team: 'team2',
          home_score: 2,  // team1 wins
          away_score: 1,  // team2 loses
          home_penalty_winner: false,
          away_penalty_winner: false
        } as GameGuessNew,
        'guess2': {
          game_number: 2,
          game_id: 'game2',
          user_id: 'user1',
          home_team: 'team3',
          away_team: 'team4',
          home_score: 1,  // team3 loses
          away_score: 2,  // team4 wins
          home_penalty_winner: false,
          away_penalty_winner: false
        } as GameGuessNew
      };
      const gamesMap = {
        'game1': mockGame('game1', 1, 'team1', 'team2'),
        'game2': mockGame('game2', 2, 'team3', 'team4')
      };

      const result = calculateTeamNamesForPlayoffGame(
        isPlayoffGame,
        game,
        gameGuesses,
        gamesMap
      );

      expect(result).toBeDefined();
      expect(result?.homeTeam).toBe('team1'); // winner of game 1
      expect(result?.awayTeam).toBe('team3'); // loser of game 2
    });

    it('should calculate team names with both loser rules', () => {
      const isPlayoffGame = true;
      const game = {
        ...mockGame('game1', 1, undefined, undefined),
        home_team_rule: { game: 1, winner: false }, // loser
        away_team_rule: { game: 2, winner: false }  // loser
      };
      const gameGuesses = {
        'guess1': {
          game_number: 1,
          game_id: 'game1',
          user_id: 'user1',
          home_team: 'team1',
          away_team: 'team2',
          home_score: 1,  // team1 loses
          away_score: 2,  // team2 wins
          home_penalty_winner: false,
          away_penalty_winner: false
        } as GameGuessNew,
        'guess2': {
          game_number: 2,
          game_id: 'game2',
          user_id: 'user1',
          home_team: 'team3',
          away_team: 'team4',
          home_score: 0,  // team3 loses
          away_score: 1,  // team4 wins
          home_penalty_winner: false,
          away_penalty_winner: false
        } as GameGuessNew
      };
      const gamesMap = {
        'game1': mockGame('game1', 1, 'team1', 'team2'),
        'game2': mockGame('game2', 2, 'team3', 'team4')
      };

      const result = calculateTeamNamesForPlayoffGame(
        isPlayoffGame,
        game,
        gameGuesses,
        gamesMap
      );

      expect(result).toBeDefined();
      expect(result?.homeTeam).toBe('team1'); // loser of game 1
      expect(result?.awayTeam).toBe('team3'); // loser of game 2
    });
  });

  describe('groupCompleteReducer', () => {
    it('should return true when all teams are complete', () => {
      const teamPositions = [
        mockTeamStats('team1', 9, true),
        mockTeamStats('team2', 6, true),
        mockTeamStats('team3', 3, true),
        mockTeamStats('team4', 0, true)
      ];

      const result = groupCompleteReducer(teamPositions);
      expect(result).toBe(true);
    });

    it('should return false when any team is incomplete', () => {
      const teamPositions = [
        mockTeamStats('team1', 9, true),
        mockTeamStats('team2', 6, false), // incomplete
        mockTeamStats('team3', 3, true),
        mockTeamStats('team4', 0, true)
      ];

      const result = groupCompleteReducer(teamPositions);
      expect(result).toBe(false);
    });

    it('should return true for empty array', () => {
      const teamPositions: TeamStats[] = [];

      const result = groupCompleteReducer(teamPositions);
      expect(result).toBe(true);
    });

    it('should return true for single complete team', () => {
      const teamPositions = [
        mockTeamStats('team1', 9, true)
      ];

      const result = groupCompleteReducer(teamPositions);
      expect(result).toBe(true);
    });

    it('should return false for single incomplete team', () => {
      const teamPositions = [
        mockTeamStats('team1', 9, false)
      ];

      const result = groupCompleteReducer(teamPositions);
      expect(result).toBe(false);
    });
  });
}); 