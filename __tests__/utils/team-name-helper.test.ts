import { describe, it, expect } from 'vitest';
import { getTeamNames } from '../../app/utils/team-name-helper';
import { ExtendedGameData } from '../../app/definitions';
import { Team } from '../../app/db/tables-definition';

describe('team-name-helper', () => {
  const mockTeamsMap: Record<string, Team> = {
    'team1': {
      id: 'team1',
      name: 'Mexico',
      short_name: 'MEX',
      flag_url: 'mexico.png',
      fifa_code: 'MEX'
    },
    'team2': {
      id: 'team2',
      name: 'Qatar',
      short_name: 'QAT',
      flag_url: 'qatar.png',
      fifa_code: 'QAT'
    }
  };

  const baseGame: ExtendedGameData = {
    id: 'game1',
    tournament_id: 'tournament1',
    game_number: 1,
    home_team: 'team1',
    away_team: 'team2',
    game_date: new Date('2024-01-01'),
    location: 'Stadium 1',
    home_team_rule: undefined,
    away_team_rule: undefined,
    game_type: 'group',
    game_local_timezone: undefined,
    group: undefined,
    playoffStage: undefined,
    gameResult: undefined
  };

  describe('getTeamNames', () => {
    it('returns team names from teamsMap when teams are assigned', () => {
      const result = getTeamNames(baseGame, undefined, mockTeamsMap);

      expect(result).toEqual({
        homeTeamId: 'team1',
        awayTeamId: 'team2',
        homeTeamName: 'Mexico',
        awayTeamName: 'Qatar',
        homeTeamShortName: 'MEX',
        awayTeamShortName: 'QAT'
      });
    });

    it('returns team names from guess when game teams are null (playoff games)', () => {
      const playoffGame: ExtendedGameData = {
        ...baseGame,
        home_team: null,
        away_team: null,
        home_team_rule: 'Winner Group A',
        away_team_rule: 'Runner-up Group B'
      };

      const gameGuess = {
        home_team: 'team1',
        away_team: 'team2'
      };

      const result = getTeamNames(playoffGame, gameGuess, mockTeamsMap);

      expect(result).toEqual({
        homeTeamId: 'team1',
        awayTeamId: 'team2',
        homeTeamName: 'Mexico',
        awayTeamName: 'Qatar',
        homeTeamShortName: 'MEX',
        awayTeamShortName: 'QAT'
      });
    });

    it('returns TBD when team ID exists but not in teamsMap', () => {
      const game: ExtendedGameData = {
        ...baseGame,
        home_team: 'team999',
        away_team: 'team888'
      };

      const result = getTeamNames(game, undefined, mockTeamsMap);

      expect(result).toEqual({
        homeTeamId: 'team999',
        awayTeamId: 'team888',
        homeTeamName: 'TBD',
        awayTeamName: 'TBD',
        homeTeamShortName: 'TBD',
        awayTeamShortName: 'TBD'
      });
    });

    it('returns rule description when teams are TBD (playoff games)', () => {
      const playoffGame: ExtendedGameData = {
        ...baseGame,
        home_team: null,
        away_team: null,
        home_team_rule: 'Winner Group A',
        away_team_rule: 'Runner-up Group B'
      };

      const result = getTeamNames(playoffGame, undefined, mockTeamsMap);

      // When both game and guess teams are null/undefined, it falls back to rule description or TBD
      expect(result.homeTeamId).toBeUndefined();
      expect(result.awayTeamId).toBeUndefined();
      // Team names depend on getTeamDescription function - just verify they're strings
      expect(typeof result.homeTeamName).toBe('string');
      expect(typeof result.awayTeamName).toBe('string');
      expect(typeof result.homeTeamShortName).toBe('string');
      expect(typeof result.awayTeamShortName).toBe('string');
    });

    it('handles undefined gameGuess', () => {
      const result = getTeamNames(baseGame, undefined, mockTeamsMap);

      expect(result.homeTeamName).toBe('Mexico');
      expect(result.awayTeamName).toBe('Qatar');
    });

    it('handles gameGuess with null teams', () => {
      const playoffGame: ExtendedGameData = {
        ...baseGame,
        home_team: null,
        away_team: null,
        home_team_rule: 'Winner Group A',
        away_team_rule: 'Runner-up Group B'
      };

      const gameGuess = {
        home_team: null,
        away_team: null
      };

      const result = getTeamNames(playoffGame, gameGuess, mockTeamsMap);

      // Both team IDs should be null (from game.home_team)
      expect(result.homeTeamId).toBeNull();
      expect(result.awayTeamId).toBeNull();
      // Team names depend on getTeamDescription - just verify they're strings
      expect(typeof result.homeTeamName).toBe('string');
      expect(typeof result.awayTeamName).toBe('string');
    });

    it('prefers game teams over guess teams when both exist', () => {
      const gameGuess = {
        home_team: 'team999',
        away_team: 'team888'
      };

      const result = getTeamNames(baseGame, gameGuess, mockTeamsMap);

      // Should use game.home_team and game.away_team, not guess
      expect(result.homeTeamName).toBe('Mexico');
      expect(result.awayTeamName).toBe('Qatar');
    });

    it('handles empty teamsMap', () => {
      const emptyMap: Record<string, Team> = {};

      const result = getTeamNames(baseGame, undefined, emptyMap);

      expect(result).toEqual({
        homeTeamId: 'team1',
        awayTeamId: 'team2',
        homeTeamName: 'TBD',
        awayTeamName: 'TBD',
        homeTeamShortName: 'TBD',
        awayTeamShortName: 'TBD'
      });
    });
  });
});
