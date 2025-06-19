import { Game, GameResultNew, GameGuess } from '../../app/db/tables-definition';
import { 
  calculatePlayoffTeams, 
  calculatePlayoffTeamsFromPositions,
  calculateTeamNamesForPlayoffGame,
  groupCompleteReducer 
} from '../../app/utils/playoff-teams-calculator';
import { TeamStats } from '../../app/db/tables-definition';

// Mock data structures for the test
const mockGroups = [
  {
    id: 'g1',
    group_letter: 'A',
    tournament_id: 't1',
    teams: [
      { team_id: 'A1' },
      { team_id: 'A2' },
      { team_id: 'A3' },
      { team_id: 'A4' },
    ],
    games: [
      { game_id: 'g1' },
      { game_id: 'g2' },
      { game_id: 'g3' },
      { game_id: 'g4' },
      { game_id: 'g5' },
      { game_id: 'g6' },
    ],
    sort_by_games_between_teams: false,
  },
  {
    id: 'g2',
    group_letter: 'B',
    tournament_id: 't1',
    teams: [
      { team_id: 'B1' },
      { team_id: 'B2' },
      { team_id: 'B3' },
      { team_id: 'B4' },
    ],
    games: [
      { game_id: 'g7' },
      { game_id: 'g8' },
      { game_id: 'g9' },
      { game_id: 'g10' },
      { game_id: 'g11' },
      { game_id: 'g12' },
    ],
    sort_by_games_between_teams: false,
  },
  {
    id: 'g3',
    group_letter: 'C',
    tournament_id: 't1',
    teams: [
      { team_id: 'C1' },
      { team_id: 'C2' },
      { team_id: 'C3' },
      { team_id: 'C4' },
    ],
    games: [
      { game_id: 'g13' },
      { game_id: 'g14' },
      { game_id: 'g15' },
      { game_id: 'g16' },
      { game_id: 'g17' },
      { game_id: 'g18' },
    ],
    sort_by_games_between_teams: false,
  },
  {
    id: 'g4',
    group_letter: 'D',
    tournament_id: 't1',
    teams: [
      { team_id: 'D1' },
      { team_id: 'D2' },
      { team_id: 'D3' },
      { team_id: 'D4' },
    ],
    games: [
      { game_id: 'g19' },
      { game_id: 'g20' },
      { game_id: 'g21' },
      { game_id: 'g22' },
      { game_id: 'g23' },
      { game_id: 'g24' },
    ],
    sort_by_games_between_teams: false,
  },
];

const mockGamesMap: Record<string, Game> = {
  // Group A games
  g1: { home_team: 'A1', away_team: 'A2', tournament_id: 't1', id: 'g1', game_number: 1, game_date: new Date(), location: 'Location 1', game_type: 'group', game_local_timezone: 'America/New_York', home_team_rule: undefined, away_team_rule: undefined },
  g2: { home_team: 'A3', away_team: 'A4', tournament_id: 't1', id: 'g2', game_number: 2, game_date: new Date(), location: 'Location 2', game_type: 'group', game_local_timezone: 'America/New_York', home_team_rule: undefined, away_team_rule: undefined },
  g3: { home_team: 'A1', away_team: 'A3', tournament_id: 't1', id: 'g3', game_number: 3, game_date: new Date(), location: 'Location 3', game_type: 'group', game_local_timezone: 'America/New_York', home_team_rule: undefined, away_team_rule: undefined },
  g4: { home_team: 'A2', away_team: 'A4', tournament_id: 't1', id: 'g4', game_number: 4, game_date: new Date(), location: 'Location 4', game_type: 'group', game_local_timezone: 'America/New_York', home_team_rule: undefined, away_team_rule: undefined },
  g5: { home_team: 'A1', away_team: 'A4', tournament_id: 't1', id: 'g5', game_number: 5, game_date: new Date(), location: 'Location 5', game_type: 'group', game_local_timezone: 'America/New_York', home_team_rule: undefined, away_team_rule: undefined },
  g6: { home_team: 'A2', away_team: 'A3', tournament_id: 't1', id: 'g6', game_number: 6, game_date: new Date(), location: 'Location 6', game_type: 'group', game_local_timezone: 'America/New_York', home_team_rule: undefined, away_team_rule: undefined },
  
  // Group B games
  g7: { home_team: 'B1', away_team: 'B2', tournament_id: 't1', id: 'g7', game_number: 7, game_date: new Date(), location: 'Location 7', game_type: 'group', game_local_timezone: 'America/New_York', home_team_rule: undefined, away_team_rule: undefined },
  g8: { home_team: 'B3', away_team: 'B4', tournament_id: 't1', id: 'g8', game_number: 8, game_date: new Date(), location: 'Location 8', game_type: 'group', game_local_timezone: 'America/New_York', home_team_rule: undefined, away_team_rule: undefined },
  g9: { home_team: 'B1', away_team: 'B3', tournament_id: 't1', id: 'g9', game_number: 9, game_date: new Date(), location: 'Location 9', game_type: 'group', game_local_timezone: 'America/New_York', home_team_rule: undefined, away_team_rule: undefined },
  g10: { home_team: 'B2', away_team: 'B4', tournament_id: 't1', id: 'g10', game_number: 10, game_date: new Date(), location: 'Location 10', game_type: 'group', game_local_timezone: 'America/New_York', home_team_rule: undefined, away_team_rule: undefined }, 
  g11: { home_team: 'B1', away_team: 'B4', tournament_id: 't1', id: 'g11', game_number: 11, game_date: new Date(), location: 'Location 11', game_type: 'group', game_local_timezone: 'America/New_York', home_team_rule: undefined, away_team_rule: undefined },
  g12: { home_team: 'B2', away_team: 'B3', tournament_id: 't1', id: 'g12', game_number: 12, game_date: new Date(), location: 'Location 12', game_type: 'group', game_local_timezone: 'America/New_York', home_team_rule: undefined, away_team_rule: undefined },
  
  // Group C games (for third place scenarios)
  g13: { home_team: 'C1', away_team: 'C2', tournament_id: 't1', id: 'g13', game_number: 13, game_date: new Date(), location: 'Location 13', game_type: 'group', game_local_timezone: 'America/New_York', home_team_rule: undefined, away_team_rule: undefined },
  g14: { home_team: 'C3', away_team: 'C4', tournament_id: 't1', id: 'g14', game_number: 14, game_date: new Date(), location: 'Location 14', game_type: 'group', game_local_timezone: 'America/New_York', home_team_rule: undefined, away_team_rule: undefined },
  g15: { home_team: 'C1', away_team: 'C3', tournament_id: 't1', id: 'g15', game_number: 15, game_date: new Date(), location: 'Location 15', game_type: 'group', game_local_timezone: 'America/New_York', home_team_rule: undefined, away_team_rule: undefined },
  g16: { home_team: 'C2', away_team: 'C4', tournament_id: 't1', id: 'g16', game_number: 16, game_date: new Date(), location: 'Location 16', game_type: 'group', game_local_timezone: 'America/New_York', home_team_rule: undefined, away_team_rule: undefined },
  g17: { home_team: 'C1', away_team: 'C4', tournament_id: 't1', id: 'g17', game_number: 17, game_date: new Date(), location: 'Location 17', game_type: 'group', game_local_timezone: 'America/New_York', home_team_rule: undefined, away_team_rule: undefined },
  g18: { home_team: 'C2', away_team: 'C3', tournament_id: 't1', id: 'g18', game_number: 18, game_date: new Date(), location: 'Location 18', game_type: 'group', game_local_timezone: 'America/New_York', home_team_rule: undefined, away_team_rule: undefined },
  
  // Group D games (for third place scenarios)
  g19: { home_team: 'D1', away_team: 'D2', tournament_id: 't1', id: 'g19', game_number: 19, game_date: new Date(), location: 'Location 19', game_type: 'group', game_local_timezone: 'America/New_York', home_team_rule: undefined, away_team_rule: undefined },
  g20: { home_team: 'D3', away_team: 'D4', tournament_id: 't1', id: 'g20', game_number: 20, game_date: new Date(), location: 'Location 20', game_type: 'group', game_local_timezone: 'America/New_York', home_team_rule: undefined, away_team_rule: undefined },
  g21: { home_team: 'D1', away_team: 'D3', tournament_id: 't1', id: 'g21', game_number: 21, game_date: new Date(), location: 'Location 21', game_type: 'group', game_local_timezone: 'America/New_York', home_team_rule: undefined, away_team_rule: undefined },
  g22: { home_team: 'D2', away_team: 'D4', tournament_id: 't1', id: 'g22', game_number: 22, game_date: new Date(), location: 'Location 22', game_type: 'group', game_local_timezone: 'America/New_York', home_team_rule: undefined, away_team_rule: undefined },
  g23: { home_team: 'D1', away_team: 'D4', tournament_id: 't1', id: 'g23', game_number: 23, game_date: new Date(), location: 'Location 23', game_type: 'group', game_local_timezone: 'America/New_York', home_team_rule: undefined, away_team_rule: undefined },
  g24: { home_team: 'D2', away_team: 'D3', tournament_id: 't1', id: 'g24', game_number: 24, game_date: new Date(), location: 'Location 24', game_type: 'group', game_local_timezone: 'America/New_York', home_team_rule: undefined, away_team_rule: undefined },
  
  // Playoff games
  p1: { home_team: null, away_team: null, tournament_id: 't1', id: 'p1', game_number: 25, game_date: new Date(), location: 'Location 25', game_type: 'playoff', game_local_timezone: 'America/New_York', home_team_rule: {group: 'A', position: 1}, away_team_rule: {group: 'B', position: 2} },
  p2: { home_team: null, away_team: null, tournament_id: 't1', id: 'p2', game_number: 26, game_date: new Date(), location: 'Location 26', game_type: 'playoff', game_local_timezone: 'America/New_York', home_team_rule: {group: 'B', position: 1}, away_team_rule: {group: 'A', position: 2} },
  p3: { home_team: null, away_team: null, tournament_id: 't1', id: 'p3', game_number: 27, game_date: new Date(), location: 'Location 27', game_type: 'playoff', game_local_timezone: 'America/New_York', home_team_rule: {group: 'C', position: 1}, away_team_rule: {group: 'D', position: 2} },
  p4: { home_team: null, away_team: null, tournament_id: 't1', id: 'p4', game_number: 28, game_date: new Date(), location: 'Location 28', game_type: 'playoff', game_local_timezone: 'America/New_York', home_team_rule: {group: 'D', position: 1}, away_team_rule: {group: 'C', position: 2} },
  
  // Third place playoff games
  p5: { home_team: null, away_team: null, tournament_id: 't1', id: 'p5', game_number: 29, game_date: new Date(), location: 'Location 29', game_type: 'playoff', game_local_timezone: 'America/New_York', home_team_rule: {group: 'A', position: 3}, away_team_rule: {group: 'B', position: 3} },
  p6: { home_team: null, away_team: null, tournament_id: 't1', id: 'p6', game_number: 30, game_date: new Date(), location: 'Location 30', game_type: 'playoff', game_local_timezone: 'America/New_York', home_team_rule: {group: 'C', position: 3}, away_team_rule: {group: 'D', position: 3} },
};

const mockGameResultsMap: Record<string, GameResultNew> = {
  // Group A results
  g1: { home_score: 2, away_score: 1, game_id: 'g1', is_draft: false },
  g2: { home_score: 0, away_score: 0, game_id: 'g2', is_draft: false },
  g3: { home_score: 1, away_score: 1, game_id: 'g3', is_draft: false },
  g4: { home_score: 3, away_score: 2, game_id: 'g4', is_draft: false },
  g5: { home_score: 0, away_score: 2, game_id: 'g5', is_draft: false },
  g6: { home_score: 1, away_score: 0, game_id: 'g6', is_draft: false },
  
  // Group B results
  g7: { home_score: 1, away_score: 1, game_id: 'g7', is_draft: false },
  g8: { home_score: 2, away_score: 2, game_id: 'g8', is_draft: false },
  g9: { home_score: 0, away_score: 1, game_id: 'g9', is_draft: false },
  g10: { home_score: 2, away_score: 0, game_id: 'g10', is_draft: false },
  g11: { home_score: 1, away_score: 3, game_id: 'g11', is_draft: false },
  g12: { home_score: 0, away_score: 0, game_id: 'g12', is_draft: false },
  
  // Group C results
  g13: { home_score: 3, away_score: 0, game_id: 'g13', is_draft: false },
  g14: { home_score: 1, away_score: 2, game_id: 'g14', is_draft: false },
  g15: { home_score: 2, away_score: 1, game_id: 'g15', is_draft: false },
  g16: { home_score: 0, away_score: 1, game_id: 'g16', is_draft: false },
  g17: { home_score: 1, away_score: 0, game_id: 'g17', is_draft: false },
  g18: { home_score: 2, away_score: 2, game_id: 'g18', is_draft: false },
  
  // Group D results
  g19: { home_score: 2, away_score: 0, game_id: 'g19', is_draft: false },
  g20: { home_score: 1, away_score: 1, game_id: 'g20', is_draft: false },
  g21: { home_score: 0, away_score: 2, game_id: 'g21', is_draft: false },
  g22: { home_score: 3, away_score: 1, game_id: 'g22', is_draft: false },
  g23: { home_score: 1, away_score: 1, game_id: 'g23', is_draft: false },
  g24: { home_score: 0, away_score: 3, game_id: 'g24', is_draft: false },
};

const mockGameGuessesMap: Record<string, GameGuess> = {
  g1: { home_score: 2, away_score: 1, game_id: 'g1', user_id: 'user1', id: 'guess1', score: undefined, home_penalty_winner: false, away_penalty_winner: false, game_number: 1, home_team: 'A1', away_team: 'A2' },
  g2: { home_score: 0, away_score: 0, game_id: 'g2', user_id: 'user1', id: 'guess2', score: undefined, home_penalty_winner: false, away_penalty_winner: false, game_number: 2, home_team: 'A3', away_team: 'A4' },
  g3: { home_score: 1, away_score: 1, game_id: 'g3', user_id: 'user1', id: 'guess3', score: undefined, home_penalty_winner: false, away_penalty_winner: false, game_number: 3, home_team: 'A1', away_team: 'A3' },
  g4: { home_score: 3, away_score: 2, game_id: 'g4', user_id: 'user1', id: 'guess4', score: undefined, home_penalty_winner: false, away_penalty_winner: false, game_number: 4, home_team: 'A2', away_team: 'A4' },
  g5: { home_score: 0, away_score: 2, game_id: 'g5', user_id: 'user1', id: 'guess5', score: undefined, home_penalty_winner: false, away_penalty_winner: false, game_number: 5, home_team: 'A1', away_team: 'A4' },
  g6: { home_score: 1, away_score: 0, game_id: 'g6', user_id: 'user1', id: 'guess6', score: undefined, home_penalty_winner: false, away_penalty_winner: false, game_number: 6, home_team: 'A2', away_team: 'A3' },
};

const mockFirstPlayoffStage = {
    id: 'stage1',
    tournament_id: 't1',
    round_name: 'Quarterfinals',
    round_order: 1,
    total_games: 2,
    is_final: false,
    is_third_place: false,
    is_first_stage: true,
    games: [
      {
        game_id: 'p1',
        home_team_rule: { group: 'A', position: 1 },
        away_team_rule: { group: 'B', position: 2 },
      },
      {
        game_id: 'p2',
        home_team_rule: { group: 'B', position: 1 },
        away_team_rule: { group: 'A', position: 2 },
      },
    ],
  };

const mockPlayoffStageWithThirdPlace = {
    id: 'stage1',
    tournament_id: 't1',
    round_name: 'Quarterfinals',
    round_order: 1,
    total_games: 6,
    is_final: false,
    is_third_place: false,
    is_first_stage: true,
    games: [
      {
        game_id: 'p1',
        home_team_rule: { group: 'A', position: 1 },
        away_team_rule: { group: 'B', position: 2 },
      },
      {
        game_id: 'p2',
        home_team_rule: { group: 'B', position: 1 },
        away_team_rule: { group: 'A', position: 2 },
      },
      {
        game_id: 'p3',
        home_team_rule: { group: 'C', position: 1 },
        away_team_rule: { group: 'D', position: 2 },
      },
      {
        game_id: 'p4',
        home_team_rule: { group: 'D', position: 1 },
        away_team_rule: { group: 'C', position: 2 },
      },
      {
        game_id: 'p5',
        home_team_rule: { group: 'A', position: 3 },
        away_team_rule: { group: 'B', position: 3 },
      },
      {
        game_id: 'p6',
        home_team_rule: { group: 'C', position: 3 },
        away_team_rule: { group: 'D', position: 3 },
      },
    ],
  };

describe('calculatePlayoffTeams', () => {
  it('should correctly map group winners and runners-up to playoff slots', () => {
    const result = calculatePlayoffTeams(
      mockFirstPlayoffStage,
      mockGroups,
      mockGamesMap,
      mockGameResultsMap,
      {}
    );
    expect(result).toHaveProperty('p1');
    expect(result).toHaveProperty('p2');
    // Updated assertions based on actual tiebreaker logic
    expect(result.p1.homeTeam.team_id).toBe('A2');
    expect(result.p2.awayTeam.team_id).toBe('A4');
    expect(result.p1.awayTeam.team_id).toBe('B3');
    expect(result.p2.homeTeam.team_id).toBe('B2');
  });

  it('should handle incomplete groups and not assign teams prematurely', () => {
    const incompleteResults: Record<string, GameResultNew> = { ...mockGameResultsMap };
    delete incompleteResults.g1;
    const result = calculatePlayoffTeams(
      mockFirstPlayoffStage,
      mockGroups,
      mockGamesMap,
      incompleteResults,
      {}
    );
    expect(result.p1.homeTeam).toBeUndefined();
    expect(result.p2.awayTeam).toBeUndefined();
  });

  it('should use head-to-head tiebreaker when sort_by_games_between_teams is true', () => {
    const groupsWithHeadToHead = [
      {
        ...mockGroups[0],
        sort_by_games_between_teams: true,
      },
      {
        ...mockGroups[1],
        sort_by_games_between_teams: true,
      }
    ];
    // Manipulate results to force a tie in group A
    const resultsWithTie = {
      ...mockGameResultsMap,
      g1: { home_score: 3, away_score: 0, game_id: 'g1', is_draft: false }, // A1 beats A2
      g2: { home_score: 0, away_score: 1, game_id: 'g2', is_draft: false }, // A4 beats A3
      g3: { home_score: 0, away_score: 1, game_id: 'g3', is_draft: false }, // A1 loses to A3
      g4: { home_score: 1, away_score: 0, game_id: 'g4', is_draft: false }, // A2 beats A4
      g5: { home_score: 1, away_score: 0, game_id: 'g5', is_draft: false }, // A1 beats A4
      g6: { home_score: 0, away_score: 1, game_id: 'g6', is_draft: false }, // A2 loses to A3
    };
    const result = calculatePlayoffTeams(
      mockFirstPlayoffStage,
      groupsWithHeadToHead,
      mockGamesMap,
      resultsWithTie,
      {}
    );
    // The winner of A should be A3 (beats both A1 and A2 in head-to-head)
    expect(result.p1.homeTeam.team_id).toBe('A3');
    expect(result.p2.awayTeam.team_id).toBe('A1');
  });

  it('should use guesses when results are not available', () => {
    const result = calculatePlayoffTeams(
      mockFirstPlayoffStage,
      mockGroups,
      mockGamesMap,
      {}, // No results
      mockGameGuessesMap // Use guesses instead
    );
    expect(result).toHaveProperty('p1');
    expect(result).toHaveProperty('p2');
    expect(result.p1.homeTeam).toBeDefined();
    expect(result.p2.awayTeam).toBeDefined();
  });

  it('should handle third place team selection correctly', () => {
    const result = calculatePlayoffTeams(
      mockPlayoffStageWithThirdPlace,
      mockGroups,
      mockGamesMap,
      mockGameResultsMap,
      {}
    );
    expect(result).toHaveProperty('p5');
    expect(result).toHaveProperty('p6');
    // Third place teams may be undefined if not all groups are complete
    // The function returns the structure but teams may be undefined
    expect(result.p5).toHaveProperty('homeTeam');
    expect(result.p5).toHaveProperty('awayTeam');
    expect(result.p6).toHaveProperty('homeTeam');
    expect(result.p6).toHaveProperty('awayTeam');
  });

  it('should return structure with undefined teams when no groups are complete', () => {
    const result = calculatePlayoffTeams(
      mockFirstPlayoffStage,
      mockGroups,
      mockGamesMap,
      {}, // No results
      {} // No guesses
    );
    expect(result).toHaveProperty('p1');
    expect(result).toHaveProperty('p2');
    expect(result.p1.homeTeam).toBeUndefined();
    expect(result.p1.awayTeam).toBeUndefined();
    expect(result.p2.homeTeam).toBeUndefined();
    expect(result.p2.awayTeam).toBeUndefined();
  });
});

describe('calculatePlayoffTeamsFromPositions', () => {
  const mockPositionsByGroup = {
    'A': [
      { team_id: 'A1', points: 9, is_complete: true, games_played: 3, win: 3, draw: 0, loss: 0, goals_for: 6, goals_against: 2, goal_difference: 4 },
      { team_id: 'A2', points: 6, is_complete: true, games_played: 3, win: 2, draw: 0, loss: 1, goals_for: 4, goals_against: 3, goal_difference: 1 },
      { team_id: 'A3', points: 3, is_complete: true, games_played: 3, win: 1, draw: 0, loss: 2, goals_for: 2, goals_against: 4, goal_difference: -2 },
      { team_id: 'A4', points: 0, is_complete: true, games_played: 3, win: 0, draw: 0, loss: 3, goals_for: 1, goals_against: 4, goal_difference: -3 },
    ] as TeamStats[],
    'B': [
      { team_id: 'B1', points: 7, is_complete: true, games_played: 3, win: 2, draw: 1, loss: 0, goals_for: 5, goals_against: 2, goal_difference: 3 },
      { team_id: 'B2', points: 5, is_complete: true, games_played: 3, win: 1, draw: 2, loss: 0, goals_for: 3, goals_against: 2, goal_difference: 1 },
      { team_id: 'B3', points: 4, is_complete: true, games_played: 3, win: 1, draw: 1, loss: 1, goals_for: 4, goals_against: 3, goal_difference: 1 },
      { team_id: 'B4', points: 0, is_complete: true, games_played: 3, win: 0, draw: 0, loss: 3, goals_for: 1, goals_against: 6, goal_difference: -5 },
    ] as TeamStats[],
  };

  it('should calculate playoff teams from group positions', () => {
    const result = calculatePlayoffTeamsFromPositions(
      mockFirstPlayoffStage,
      mockGamesMap,
      mockPositionsByGroup
    );
    expect(result).toHaveProperty('p1');
    expect(result).toHaveProperty('p2');
    expect(result.p1.homeTeam.team_id).toBe('A1');
    expect(result.p1.awayTeam.team_id).toBe('B2');
    expect(result.p2.homeTeam.team_id).toBe('B1');
    expect(result.p2.awayTeam.team_id).toBe('A2');
  });

  it('should filter out incomplete groups', () => {
    const incompletePositions = {
      'A': [
        { team_id: 'A1', points: 9, is_complete: true, games_played: 3, win: 3, draw: 0, loss: 0, goals_for: 6, goals_against: 2, goal_difference: 4 },
        { team_id: 'A2', points: 6, is_complete: true, games_played: 3, win: 2, draw: 0, loss: 1, goals_for: 4, goals_against: 3, goal_difference: 1 },
        { team_id: 'A3', points: 3, is_complete: true, games_played: 3, win: 1, draw: 0, loss: 2, goals_for: 2, goals_against: 4, goal_difference: -2 },
        { team_id: 'A4', points: 0, is_complete: true, games_played: 3, win: 0, draw: 0, loss: 3, goals_for: 1, goals_against: 4, goal_difference: -3 },
      ] as TeamStats[],
      'B': [
        { team_id: 'B1', points: 7, is_complete: false, games_played: 2, win: 1, draw: 1, loss: 0, goals_for: 3, goals_against: 1, goal_difference: 2 }, // Incomplete
        { team_id: 'B2', points: 5, is_complete: false, games_played: 2, win: 1, draw: 2, loss: 0, goals_for: 2, goals_against: 1, goal_difference: 1 },
        { team_id: 'B3', points: 4, is_complete: false, games_played: 2, win: 1, draw: 1, loss: 1, goals_for: 3, goals_against: 2, goal_difference: 1 },
        { team_id: 'B4', points: 0, is_complete: false, games_played: 2, win: 0, draw: 0, loss: 2, goals_for: 0, goals_against: 4, goal_difference: -4 },
      ] as TeamStats[],
    };

    const result = calculatePlayoffTeamsFromPositions(
      mockFirstPlayoffStage,
      mockGamesMap,
      incompletePositions
    );
    // Should return structure with undefined teams for incomplete groups
    expect(result).toHaveProperty('p1');
    expect(result).toHaveProperty('p2');
    expect(result.p1.homeTeam).toBeDefined(); // A group is complete
    expect(result.p1.awayTeam).toBeUndefined(); // B group is incomplete
    expect(result.p2.homeTeam).toBeUndefined(); // B group is incomplete
    expect(result.p2.awayTeam).toBeDefined(); // A group is complete
  });
});

describe('calculateTeamNamesForPlayoffGame', () => {
  const mockGame: any = {
    id: 'p1',
    home_team: null,
    away_team: null,
    home_team_rule: { group: 'A', position: 1 },
    away_team_rule: { group: 'B', position: 2 },
  };

  const mockGameGuesses = {
    'p1': { home_score: 2, away_score: 1, game_id: 'p1', user_id: 'user1', id: 'guess1', score: undefined, home_penalty_winner: false, away_penalty_winner: false, game_number: 25, home_team: null, away_team: null },
  };

  it('should return undefined for playoff games with group rules (not team winner rules)', () => {
    const result = calculateTeamNamesForPlayoffGame(
      true, // isPlayoffGame
      mockGame,
      mockGameGuesses,
      mockGamesMap
    );
    expect(result).toBeUndefined();
  });

  it('should return undefined for non-playoff games', () => {
    const result = calculateTeamNamesForPlayoffGame(
      false, // isPlayoffGame
      mockGame,
      mockGameGuesses,
      mockGamesMap
    );
    expect(result).toBeUndefined();
  });

  it('should return undefined for games without guesses', () => {
    const result = calculateTeamNamesForPlayoffGame(
      true,
      mockGame,
      {}, // No guesses
      mockGamesMap
    );
    expect(result).toBeUndefined();
  });

  it('should return undefined for playoff games with actual teams assigned', () => {
    const gameWithTeams = {
      ...mockGame,
      home_team: 'Team A',
      away_team: 'Team B'
    };
    const result = calculateTeamNamesForPlayoffGame(
      true,
      gameWithTeams,
      mockGameGuesses,
      mockGamesMap
    );
    expect(result).toBeUndefined();
  });
});

describe('groupCompleteReducer', () => {
  it('should return true when all teams are complete', () => {
    const completeTeams: TeamStats[] = [
      { team_id: 'A1', points: 9, is_complete: true, games_played: 3, win: 3, draw: 0, loss: 0, goals_for: 6, goals_against: 2, goal_difference: 4 },
      { team_id: 'A2', points: 6, is_complete: true, games_played: 3, win: 2, draw: 0, loss: 1, goals_for: 4, goals_against: 3, goal_difference: 1 },
      { team_id: 'A3', points: 3, is_complete: true, games_played: 3, win: 1, draw: 0, loss: 2, goals_for: 2, goals_against: 4, goal_difference: -2 },
      { team_id: 'A4', points: 0, is_complete: true, games_played: 3, win: 0, draw: 0, loss: 3, goals_for: 1, goals_against: 4, goal_difference: -3 },
    ];
    expect(groupCompleteReducer(completeTeams)).toBe(true);
  });

  it('should return false when any team is incomplete', () => {
    const incompleteTeams: TeamStats[] = [
      { team_id: 'A1', points: 9, is_complete: true, games_played: 3, win: 3, draw: 0, loss: 0, goals_for: 6, goals_against: 2, goal_difference: 4 },
      { team_id: 'A2', points: 6, is_complete: false, games_played: 2, win: 1, draw: 0, loss: 1, goals_for: 2, goals_against: 2, goal_difference: 0 }, // Incomplete
      { team_id: 'A3', points: 3, is_complete: true, games_played: 3, win: 1, draw: 0, loss: 2, goals_for: 2, goals_against: 4, goal_difference: -2 },
      { team_id: 'A4', points: 0, is_complete: true, games_played: 3, win: 0, draw: 0, loss: 3, goals_for: 1, goals_against: 4, goal_difference: -3 },
    ];
    expect(groupCompleteReducer(incompleteTeams)).toBe(false);
  });

  it('should return true for empty array', () => {
    expect(groupCompleteReducer([])).toBe(true);
  });
}); 