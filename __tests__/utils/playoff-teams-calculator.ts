import { Game, GameResultNew } from '../../app/db/tables-definition';
import { calculatePlayoffTeams } from '../../app/utils/playoff-teams-calculator';

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
];

const mockGamesMap: Record<string, Game> = {
  g1: { home_team: 'A1', away_team: 'A2', tournament_id: 't1', id: 'g1', game_number: 1, game_date: new Date(), location: 'Location 1', game_type: 'group', game_local_timezone: 'America/New_York', home_team_rule: undefined, away_team_rule: undefined },
  g2: { home_team: 'A3', away_team: 'A4', tournament_id: 't1', id: 'g2', game_number: 2, game_date: new Date(), location: 'Location 2', game_type: 'group', game_local_timezone: 'America/New_York', home_team_rule: undefined, away_team_rule: undefined },
  g3: { home_team: 'A1', away_team: 'A3', tournament_id: 't1', id: 'g3', game_number: 3, game_date: new Date(), location: 'Location 3', game_type: 'group', game_local_timezone: 'America/New_York', home_team_rule: undefined, away_team_rule: undefined },
  g4: { home_team: 'A2', away_team: 'A4', tournament_id: 't1', id: 'g4', game_number: 4, game_date: new Date(), location: 'Location 4', game_type: 'group', game_local_timezone: 'America/New_York', home_team_rule: undefined, away_team_rule: undefined },
  g5: { home_team: 'A1', away_team: 'A4', tournament_id: 't1', id: 'g5', game_number: 5, game_date: new Date(), location: 'Location 5', game_type: 'group', game_local_timezone: 'America/New_York', home_team_rule: undefined, away_team_rule: undefined },
  g6: { home_team: 'A2', away_team: 'A3', tournament_id: 't1', id: 'g6', game_number: 6, game_date: new Date(), location: 'Location 6', game_type: 'group', game_local_timezone: 'America/New_York', home_team_rule: undefined, away_team_rule: undefined },
  g7: { home_team: 'B1', away_team: 'B2', tournament_id: 't1', id: 'g7', game_number: 7, game_date: new Date(), location: 'Location 7', game_type: 'group', game_local_timezone: 'America/New_York', home_team_rule: undefined, away_team_rule: undefined },
  g8: { home_team: 'B3', away_team: 'B4', tournament_id: 't1', id: 'g8', game_number: 8, game_date: new Date(), location: 'Location 8', game_type: 'group', game_local_timezone: 'America/New_York', home_team_rule: undefined, away_team_rule: undefined },
  g9: { home_team: 'B1', away_team: 'B3', tournament_id: 't1', id: 'g9', game_number: 9, game_date: new Date(), location: 'Location 9', game_type: 'group', game_local_timezone: 'America/New_York', home_team_rule: undefined, away_team_rule: undefined },
  g10: { home_team: 'B2', away_team: 'B4', tournament_id: 't1', id: 'g10', game_number: 10, game_date: new Date(), location: 'Location 10', game_type: 'group', game_local_timezone: 'America/New_York', home_team_rule: undefined, away_team_rule: undefined }, 
  g11: { home_team: 'B1', away_team: 'B4', tournament_id: 't1', id: 'g11', game_number: 11, game_date: new Date(), location: 'Location 11', game_type: 'group', game_local_timezone: 'America/New_York', home_team_rule: undefined, away_team_rule: undefined },
  g12: { home_team: 'B2', away_team: 'B3', tournament_id: 't1', id: 'g12', game_number: 12, game_date: new Date(), location: 'Location 12', game_type: 'group', game_local_timezone: 'America/New_York', home_team_rule: undefined, away_team_rule: undefined },
  p1: { home_team: null, away_team: null, tournament_id: 't1', id: 'p1', game_number: 13, game_date: new Date(), location: 'Location 13', game_type: 'playoff', game_local_timezone: 'America/New_York', home_team_rule: {group: 'A', position: 1}, away_team_rule: {group: 'B', position: 2} },
  p2: { home_team: null, away_team: null, tournament_id: 't1', id: 'p2', game_number: 24, game_date: new Date(), location: 'Location 14', game_type: 'playoff', game_local_timezone: 'America/New_York', home_team_rule: {group: 'B', position: 1}, away_team_rule: {group: 'A', position: 2} },
};

const mockGameResultsMap: Record<string, GameResultNew> = {
  g1: { home_score: 2, away_score: 1, game_id: 'g1', is_draft: false },
  g2: { home_score: 0, away_score: 0, game_id: 'g2', is_draft: false },
  g3: { home_score: 1, away_score: 1, game_id: 'g3', is_draft: false },
  g4: { home_score: 3, away_score: 2, game_id: 'g4', is_draft: false },
  g5: { home_score: 0, away_score: 2, game_id: 'g5', is_draft: false },
  g6: { home_score: 1, away_score: 0, game_id: 'g6', is_draft: false },
  g7: { home_score: 1, away_score: 1, game_id: 'g7', is_draft: false },
  g8: { home_score: 2, away_score: 2, game_id: 'g8', is_draft: false },
  g9: { home_score: 0, away_score: 1, game_id: 'g9', is_draft: false },
  g10: { home_score: 2, away_score: 0, game_id: 'g10', is_draft: false },
  g11: { home_score: 1, away_score: 3, game_id: 'g11', is_draft: false },
  g12: { home_score: 0, away_score: 0, game_id: 'g12', is_draft: false },
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

  // Add more tests for third-place team selection and edge cases as needed
}); 