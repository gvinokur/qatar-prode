/**
 * Demo data for onboarding flow
 * Matches actual data structures from app/db/tables-definition.ts
 */

import type {
  Team,
  Game,
  GameGuess,
  QualifiedTeamPrediction,
  TournamentGroup,
  TournamentPredictionCompletion,
} from '@/app/db/tables-definition'

// Demo tournament
export const DEMO_TOURNAMENT = {
  id: 'demo-tournament',
  short_name: 'Demo',
  is_active: true,
}

// 4 teams (1 group)
export const DEMO_TEAMS: Team[] = [
  { id: 'team-1', name: 'Brasil', short_name: 'BRA', theme: null },
  { id: 'team-2', name: 'Argentina', short_name: 'ARG', theme: null },
  { id: 'team-3', name: 'Uruguay', short_name: 'URU', theme: null },
  { id: 'team-4', name: 'Chile', short_name: 'CHI', theme: null },
]

// Teams map for quick lookup
export const DEMO_TEAMS_MAP: Record<string, Team> = Object.fromEntries(
  DEMO_TEAMS.map((team) => [team.id, team])
)

// 1 tournament group
export const DEMO_GROUPS_DATA: TournamentGroup[] = [
  {
    id: 'group-a',
    tournament_id: 'demo-tournament',
    group_letter: 'A',
    sort_by_games_between_teams: false,
  },
]

// 2 games from the group
export const DEMO_GAMES: Game[] = [
  {
    id: 'game-1',
    tournament_id: 'demo-tournament',
    game_number: 1,
    home_team: 'team-1', // Brasil
    away_team: 'team-2', // Argentina
    game_date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    location: 'Estadio Demo',
    game_type: 'group',
    home_team_rule: undefined,
    away_team_rule: undefined,
    game_local_timezone: undefined,
  },
  {
    id: 'game-2',
    tournament_id: 'demo-tournament',
    game_number: 2,
    home_team: 'team-3', // Uruguay
    away_team: 'team-4', // Chile
    game_date: new Date(Date.now() + 48 * 60 * 60 * 1000), // In 2 days
    location: 'Estadio Demo',
    game_type: 'group',
    home_team_rule: undefined,
    away_team_rule: undefined,
    game_local_timezone: undefined,
  },
]

// Game guesses - matches GameGuess type
export const DEMO_GAME_GUESSES: Record<string, GameGuess> = {
  'game-1': {
    id: 'guess-1',
    game_id: 'game-1',
    game_number: 1,
    user_id: 'demo-user',
    home_team: 'team-1',
    away_team: 'team-2',
    home_score: 2,
    away_score: 1,
    boost_type: null,
    home_penalty_winner: undefined,
    away_penalty_winner: undefined,
    score: undefined,
    boost_multiplier: undefined,
    final_score: undefined,
    updated_at: undefined,
  },
  'game-2': {
    id: 'guess-2',
    game_id: 'game-2',
    game_number: 2,
    user_id: 'demo-user',
    home_team: 'team-3',
    away_team: 'team-4',
    home_score: 1,
    away_score: 1,
    boost_type: null,
    home_penalty_winner: undefined,
    away_penalty_winner: undefined,
    score: undefined,
    boost_multiplier: undefined,
    final_score: undefined,
    updated_at: undefined,
  },
}

// Qualified team predictions - matches QualifiedTeamPrediction type (as array for initialPredictions)
export const DEMO_QUALIFIED_PREDICTIONS_ARRAY: QualifiedTeamPrediction[] = [
  {
    id: 'pred-1',
    user_id: 'demo-user',
    tournament_id: 'demo-tournament',
    group_id: 'group-a',
    team_id: 'team-1',
    predicted_position: 1,
    predicted_to_qualify: true,
    created_at: undefined,
    updated_at: undefined,
  },
  {
    id: 'pred-2',
    user_id: 'demo-user',
    tournament_id: 'demo-tournament',
    group_id: 'group-a',
    team_id: 'team-2',
    predicted_position: 2,
    predicted_to_qualify: true,
    created_at: undefined,
    updated_at: undefined,
  },
  {
    id: 'pred-3',
    user_id: 'demo-user',
    tournament_id: 'demo-tournament',
    group_id: 'group-a',
    team_id: 'team-3',
    predicted_position: 3,
    predicted_to_qualify: false,
    created_at: undefined,
    updated_at: undefined,
  },
  {
    id: 'pred-4',
    user_id: 'demo-user',
    tournament_id: 'demo-tournament',
    group_id: 'group-a',
    team_id: 'team-4',
    predicted_position: 4,
    predicted_to_qualify: false,
    created_at: undefined,
    updated_at: undefined,
  },
]

// Qualified team predictions as Map (for context provider)
export const DEMO_QUALIFIED_PREDICTIONS = new Map<
  string,
  QualifiedTeamPrediction
>([
  [
    'group-a-team-1',
    {
      id: 'pred-1',
      user_id: 'demo-user',
      tournament_id: 'demo-tournament',
      group_id: 'group-a',
      team_id: 'team-1',
      predicted_position: 1,
      predicted_to_qualify: true,
      created_at: undefined,
      updated_at: undefined,
    },
  ],
  [
    'group-a-team-2',
    {
      id: 'pred-2',
      user_id: 'demo-user',
      tournament_id: 'demo-tournament',
      group_id: 'group-a',
      team_id: 'team-2',
      predicted_position: 2,
      predicted_to_qualify: true,
      created_at: undefined,
      updated_at: undefined,
    },
  ],
  [
    'group-a-team-3',
    {
      id: 'pred-3',
      user_id: 'demo-user',
      tournament_id: 'demo-tournament',
      group_id: 'group-a',
      team_id: 'team-3',
      predicted_position: 3,
      predicted_to_qualify: false,
      created_at: undefined,
      updated_at: undefined,
    },
  ],
  [
    'group-a-team-4',
    {
      id: 'pred-4',
      user_id: 'demo-user',
      tournament_id: 'demo-tournament',
      group_id: 'group-a',
      team_id: 'team-4',
      predicted_position: 4,
      predicted_to_qualify: false,
      created_at: undefined,
      updated_at: undefined,
    },
  ],
])

// Groups with teams for qualified teams demo
export const DEMO_GROUPS = [
  {
    group: DEMO_GROUPS_DATA[0],
    teams: DEMO_TEAMS, // All 4 teams in Group A
  },
]

// Tournament prediction completion for dashboard
export const DEMO_TOURNAMENT_PREDICTIONS: TournamentPredictionCompletion = {
  finalStandings: {
    completed: 3,
    total: 3,
    champion: true,
    runnerUp: true,
    thirdPlace: true,
  },
  awards: {
    completed: 2,
    total: 4,
    bestPlayer: true,
    topGoalscorer: true,
    bestGoalkeeper: false,
    bestYoungPlayer: false,
  },
  qualifiers: {
    completed: 4,
    total: 4,
  },
  overallCompleted: 9,
  overallTotal: 11,
  overallPercentage: 82,
  isPredictionLocked: false,
}

// Props for CompactPredictionDashboard
export const DEMO_DASHBOARD_PROPS = {
  totalGames: 48,
  predictedGames: 32,
  silverUsed: 3,
  silverMax: 5,
  goldenUsed: 1,
  goldenMax: 2,
}
