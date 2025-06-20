import { calculateGroupPosition, genericTeamStatsComparator, pointsBasesTeamStatsComparator } from '../../app/utils/group-position-calculator';
import { Game, GameGuessNew, GameResultNew } from '../../app/db/tables-definition';

describe('group-position-calculator', () => {
  const mockGame = (homeTeam: string, awayTeam: string, homeScore: number, awayScore: number): Game => ({
    id: `game-${homeTeam}-${awayTeam}`,
    tournament_id: 'test-tournament',
    game_number: 1,
    home_team: homeTeam,
    away_team: awayTeam,
    game_date: new Date(),
    location: 'test-venue',
    home_team_rule: undefined,
    away_team_rule: undefined,
    game_type: undefined,
    game_local_timezone: undefined
  });

  const mockGameWithResult = (homeTeam: string, awayTeam: string, homeScore: number, awayScore: number) => ({
    ...mockGame(homeTeam, awayTeam, homeScore, awayScore),
    resultOrGuess: {
      game_id: `game-${homeTeam}-${awayTeam}`,
      is_draft: false,
      home_score: homeScore,
      away_score: awayScore,
      home_penalty_score: undefined,
      away_penalty_score: undefined
    } as GameResultNew
  });

  const mockGameWithGuess = (homeTeam: string, awayTeam: string, homeScore: number, awayScore: number) => ({
    ...mockGame(homeTeam, awayTeam, homeScore, awayScore),
    resultOrGuess: {
      game_number: 1,
      game_id: `game-${homeTeam}-${awayTeam}`,
      user_id: 'test-user',
      home_team: homeTeam,
      away_team: awayTeam,
      home_score: homeScore,
      away_score: awayScore,
      home_penalty_winner: false,
      away_penalty_winner: false
    } as GameGuessNew
  });

  describe('calculateGroupPosition', () => {
    it('should handle empty games array', () => {
      const teamIds = ['team1', 'team2', 'team3', 'team4'];
      const games: any[] = [];
      
      const result = calculateGroupPosition(teamIds, games);
      
      expect(result).toHaveLength(4);
      result.forEach(team => {
        expect(team.games_played).toBe(0);
        expect(team.points).toBe(0);
        expect(team.is_complete).toBe(true);
      });
    });

    it('should handle games with no scores', () => {
      const teamIds = ['team1', 'team2', 'team3', 'team4'];
      const games = [
        mockGame('team1', 'team2', 0, 0),
        mockGame('team3', 'team4', 0, 0)
      ];
      
      const result = calculateGroupPosition(teamIds, games);
      
      expect(result).toHaveLength(4);
      result.forEach(team => {
        expect(team.games_played).toBe(0);
        expect(team.points).toBe(0);
        expect(team.is_complete).toBe(false);
      });
    });

    it('should handle games with null resultOrGuess', () => {
      const teamIds = ['team1', 'team2', 'team3', 'team4'];
      const games = [
        { ...mockGame('team1', 'team2', 0, 0), resultOrGuess: null },
        { ...mockGame('team3', 'team4', 0, 0), resultOrGuess: null }
      ];
      
      const result = calculateGroupPosition(teamIds, games);
      
      expect(result).toHaveLength(4);
      result.forEach(team => {
        expect(team.games_played).toBe(0);
        expect(team.points).toBe(0);
        expect(team.is_complete).toBe(false);
      });
    });

    it('should handle games with undefined scores', () => {
      const teamIds = ['team1', 'team2', 'team3', 'team4'];
      const games = [
        {
          ...mockGame('team1', 'team2', 0, 0),
          resultOrGuess: { home_score: undefined, away_score: undefined } as any
        }
      ];
      
      const result = calculateGroupPosition(teamIds, games);
      
      expect(result).toHaveLength(4);
      result.forEach(team => {
        expect(team.games_played).toBe(0);
        expect(team.points).toBe(0);
        expect(team.is_complete).toBe(false);
      });
    });

    it('should handle four-way tie with sortByGamesBetweenTeams=true', () => {
      const teamIds = ['team1', 'team2', 'team3', 'team4'];
      const games = [
        mockGameWithResult('team1', 'team2', 1, 1),
        mockGameWithResult('team3', 'team4', 1, 1),
        mockGameWithResult('team1', 'team3', 1, 1),
        mockGameWithResult('team2', 'team4', 1, 1),
        mockGameWithResult('team1', 'team4', 1, 1),
        mockGameWithResult('team2', 'team3', 1, 1)
      ];
      
      const result = calculateGroupPosition(teamIds, games, true);
      
      expect(result).toHaveLength(4);
      result.forEach(team => {
        expect(team.points).toBe(3); // 3 draws = 3 points
        expect(team.games_played).toBe(3);
      });
    });

    it('should handle three-way tie at top', () => {
      const teamIds = ['team1', 'team2', 'team3', 'team4'];
      const games = [
        mockGameWithResult('team1', 'team2', 1, 1), // team1: 1pt, team2: 1pt
        mockGameWithResult('team3', 'team4', 2, 0), // team3: 3pt, team4: 0pt
        mockGameWithResult('team1', 'team3', 1, 1), // team1: 2pt, team3: 4pt
        mockGameWithResult('team2', 'team4', 2, 0), // team2: 4pt, team4: 0pt
        mockGameWithResult('team1', 'team4', 1, 1), // team1: 3pt, team4: 1pt
        mockGameWithResult('team2', 'team3', 1, 1)  // team2: 5pt, team3: 5pt
      ];
      
      const result = calculateGroupPosition(teamIds, games, true);
      
      expect(result).toHaveLength(4);
      // team1: 3pt, team2: 5pt, team3: 5pt, team4: 1pt
      expect(result[0].points).toBe(5);
      expect(result[1].points).toBe(5);
      expect(result[2].points).toBe(3);
      expect(result[3].points).toBe(1); // team4
    });

    it('should handle three-way tie at bottom', () => {
      const teamIds = ['team1', 'team2', 'team3', 'team4'];
      const games = [
        mockGameWithResult('team1', 'team2', 2, 0),
        mockGameWithResult('team3', 'team4', 1, 1),
        mockGameWithResult('team1', 'team3', 2, 0),
        mockGameWithResult('team2', 'team4', 1, 1),
        mockGameWithResult('team1', 'team4', 2, 0),
        mockGameWithResult('team2', 'team3', 1, 1)
      ];
      
      const result = calculateGroupPosition(teamIds, games, true);
      
      expect(result).toHaveLength(4);
      expect(result[0].points).toBe(9); // team1 wins all
      expect(result[1].points).toBe(2); // team2, team3, team4 tie with 2 points each
      expect(result[2].points).toBe(2);
      expect(result[3].points).toBe(2);
    });

    it('should handle two-way tie with no winner between teams', () => {
      const teamIds = ['team1', 'team2', 'team3', 'team4'];
      const games = [
        mockGameWithResult('team1', 'team2', 1, 1), // tie between team1 and team2
        mockGameWithResult('team3', 'team4', 2, 0),
        mockGameWithResult('team1', 'team3', 2, 0),
        mockGameWithResult('team2', 'team4', 2, 0),
        mockGameWithResult('team1', 'team4', 2, 0),
        mockGameWithResult('team2', 'team3', 2, 0)
      ];
      
      const result = calculateGroupPosition(teamIds, games, true);
      
      expect(result).toHaveLength(4);
      // team1 and team2 should be tied with same points
      expect(result[0].points).toBe(7);
      expect(result[1].points).toBe(7);
      expect(result[2].points).toBe(3);
      expect(result[3].points).toBe(0);
    });

    it('should handle two-way tie with winner between teams', () => {
      const teamIds = ['team1', 'team2', 'team3', 'team4'];
      const games = [
        mockGameWithResult('team1', 'team2', 2, 1), // team1 beats team2
        mockGameWithResult('team3', 'team4', 2, 0),
        mockGameWithResult('team1', 'team3', 2, 0),
        mockGameWithResult('team2', 'team4', 2, 0),
        mockGameWithResult('team1', 'team4', 2, 0),
        mockGameWithResult('team2', 'team3', 2, 0)
      ];
      
      const result = calculateGroupPosition(teamIds, games, true);
      
      expect(result).toHaveLength(4);
      expect(result[0].team_id).toBe('team1'); // team1 should be first
      expect(result[1].team_id).toBe('team2'); // team2 should be second
      expect(result[0].points).toBe(9);
      expect(result[1].points).toBe(6);
    });

    it('should handle group with less than 4 teams', () => {
      const teamIds = ['team1', 'team2', 'team3'];
      const games = [
        mockGameWithResult('team1', 'team2', 2, 1),
        mockGameWithResult('team1', 'team3', 1, 0),
        mockGameWithResult('team2', 'team3', 1, 1)
      ];
      
      const result = calculateGroupPosition(teamIds, games);
      
      expect(result).toHaveLength(3);
      expect(result[0].team_id).toBe('team1');
      expect(result[1].team_id).toBe('team2');
      expect(result[2].team_id).toBe('team3');
    });

    it('should handle games with penalty scores', () => {
      const teamIds = ['team1', 'team2', 'team3', 'team4'];
      const games = [
        {
          ...mockGame('team1', 'team2', 1, 1),
          resultOrGuess: {
            game_id: 'game-team1-team2',
            is_draft: false,
            home_score: 1,
            away_score: 1,
            home_penalty_score: 5,
            away_penalty_score: 4
          } as GameResultNew
        }
      ];
      
      const result = calculateGroupPosition(teamIds, games);
      
      expect(result).toHaveLength(4);
      // team1 should have 1 point (draw), team2 should have 1 point (draw)
      const team1 = result.find(t => t.team_id === 'team1');
      const team2 = result.find(t => t.team_id === 'team2');
      expect(team1?.points).toBe(1);
      expect(team2?.points).toBe(1);
    });

    it('should handle mixed game types (results and guesses)', () => {
      const teamIds = ['team1', 'team2', 'team3', 'team4'];
      const games = [
        mockGameWithResult('team1', 'team2', 2, 1),
        mockGameWithGuess('team3', 'team4', 1, 0),
        mockGameWithResult('team1', 'team3', 1, 1),
        mockGameWithGuess('team2', 'team4', 2, 0)
      ];
      
      const result = calculateGroupPosition(teamIds, games);
      
      expect(result).toHaveLength(4);
      result.forEach(team => {
        expect(team.games_played).toBeGreaterThan(0);
        expect(team.is_complete).toBe(true); // All games have valid scores
      });
    });
  });

  describe('comparators', () => {
    it('should compare team stats correctly with genericTeamStatsComparator', () => {
      const teamA = {
        team_id: 'team1',
        games_played: 3,
        points: 6,
        win: 2,
        draw: 0,
        loss: 1,
        goals_for: 5,
        goals_against: 3,
        goal_difference: 2,
        is_complete: true
      };
      
      const teamB = {
        team_id: 'team2',
        games_played: 3,
        points: 6,
        win: 2,
        draw: 0,
        loss: 1,
        goals_for: 4,
        goals_against: 2,
        goal_difference: 2,
        is_complete: true
      };
      
      const result = genericTeamStatsComparator(teamA, teamB);
      expect(result).toBeLessThan(0); // teamB should be ranked higher due to better goal difference
    });

    it('should compare team stats correctly with pointsBasesTeamStatsComparator', () => {
      const teamA = {
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
      };
      
      const teamB = {
        team_id: 'team2',
        games_played: 3,
        points: 6,
        win: 2,
        draw: 0,
        loss: 1,
        goals_for: 4,
        goals_against: 2,
        goal_difference: 2,
        is_complete: true
      };
      
      const result = pointsBasesTeamStatsComparator(teamA, teamB);
      expect(result).toBeLessThan(0); // teamA should be ranked higher due to more points
    });

    it('should handle equal teams in genericTeamStatsComparator', () => {
      const teamA = {
        team_id: 'team1',
        games_played: 3,
        points: 6,
        win: 2,
        draw: 0,
        loss: 1,
        goals_for: 5,
        goals_against: 3,
        goal_difference: 2,
        is_complete: true
      };
      
      const teamB = {
        team_id: 'team2',
        games_played: 3,
        points: 6,
        win: 2,
        draw: 0,
        loss: 1,
        goals_for: 5,
        goals_against: 3,
        goal_difference: 2,
        is_complete: true
      };
      
      const result = genericTeamStatsComparator(teamA, teamB);
      expect(result).toBe(0); // teams should be equal
    });

    it('should handle equal teams in pointsBasesTeamStatsComparator', () => {
      const teamA = {
        team_id: 'team1',
        games_played: 3,
        points: 6,
        win: 2,
        draw: 0,
        loss: 1,
        goals_for: 5,
        goals_against: 3,
        goal_difference: 2,
        is_complete: true
      };
      
      const teamB = {
        team_id: 'team2',
        games_played: 3,
        points: 6,
        win: 2,
        draw: 0,
        loss: 1,
        goals_for: 4,
        goals_against: 2,
        goal_difference: 2,
        is_complete: true
      };
      
      const result = pointsBasesTeamStatsComparator(teamA, teamB);
      expect(result).toBe(0); // teams should be equal (same points)
    });
  });
}); 