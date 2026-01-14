import {
  Tournament,
  User,
  Team,
  Game,
  GameGuess,
  GameResult,
  Player,
  TournamentGroup,
  TournamentGroupTeam,
  TournamentGroupGameTable,
  TournamentGroupTeamStatsGuess,
  PlayoffRound,
  ProdeGroup,
  TournamentGuess,
  TournamentVenue,
  TournamentThirdPlaceRules,
  ProdeGroupTournamentBetting,
  ProdeGroupTournamentBettingPayment,
} from '../../app/db/tables-definition';

/**
 * Type-safe test data factories for Kysely database tables.
 * Each factory creates a valid object with sensible defaults that can be overridden.
 *
 * Usage:
 * ```typescript
 * const tournament = testFactories.tournament({ long_name: 'Custom Name' });
 * const game = testFactories.game({ tournament_id: tournament.id });
 * ```
 */
export const testFactories = {
  /**
   * Tournament factory
   */
  tournament: (overrides?: Partial<Tournament>): Tournament => ({
    id: 'tournament-1',
    short_name: 'TEST',
    long_name: 'Test Tournament 2024',
    is_active: true,
    champion_team_id: null,
    runner_up_team_id: null,
    third_place_team_id: null,
    best_player_id: undefined,
    top_goalscorer_player_id: undefined,
    best_goalkeeper_player_id: undefined,
    best_young_player_id: undefined,
    dev_only: false,
    display_name: true,
    theme: null,
    game_exact_score_points: 10,
    game_correct_outcome_points: 5,
    champion_points: 15,
    runner_up_points: 10,
    third_place_points: 5,
    individual_award_points: 3,
    qualified_team_points: 2,
    exact_position_qualified_points: 1,
    max_silver_games: 5,
    max_golden_games: 3,
    ...overrides,
  }),

  /**
   * User factory
   */
  user: (overrides?: Partial<User>): User => ({
    id: 'user-1',
    email: 'test@example.com',
    nickname: 'TestUser',
    password_hash: 'hashed_password_123',
    is_admin: false,
    reset_token: null,
    reset_token_expiration: null,
    email_verified: true,
    verification_token: null,
    verification_token_expiration: null,
    notification_subscriptions: null,
    ...overrides,
  }),

  /**
   * Team factory
   */
  team: (overrides?: Partial<Team>): Team => ({
    id: 'team-1',
    name: 'Test Team',
    short_name: 'TST',
    theme: null,
    ...overrides,
  }),

  /**
   * Game factory
   */
  game: (overrides?: Partial<Game>): Game => ({
    id: 'game-1',
    tournament_id: 'tournament-1',
    game_number: 1,
    home_team: 'team-1',
    away_team: 'team-2',
    game_date: new Date('2024-06-14T18:00:00Z'),
    location: 'Test Stadium',
    home_team_rule: undefined,
    away_team_rule: undefined,
    game_type: 'group',
    game_local_timezone: 'America/New_York',
    ...overrides,
  }),

  /**
   * Game Guess factory
   */
  gameGuess: (overrides?: Partial<GameGuess>): GameGuess => ({
    id: 'guess-1',
    game_id: 'game-1',
    game_number: 1,
    user_id: 'user-1',
    home_team: 'team-1',
    away_team: 'team-2',
    home_score: 2,
    away_score: 1,
    home_penalty_winner: undefined,
    away_penalty_winner: undefined,
    score: undefined,
    boost_type: null,
    boost_multiplier: 1.0,
    final_score: undefined,
    ...overrides,
  }),

  /**
   * Game Result factory
   */
  gameResult: (overrides?: Partial<GameResult>): GameResult => ({
    game_id: 'game-1',
    home_score: 2,
    away_score: 1,
    home_penalty_score: undefined,
    away_penalty_score: undefined,
    is_draft: false,
    ...overrides,
  }),

  /**
   * Player factory
   */
  player: (overrides?: Partial<Player>): Player => ({
    id: 'player-1',
    team_id: 'team-1',
    tournament_id: 'tournament-1',
    name: 'Test Player',
    position: 'Forward',
    age_at_tournament: 25,
    ...overrides,
  }),

  /**
   * Tournament Group factory
   */
  tournamentGroup: (overrides?: Partial<TournamentGroup>): TournamentGroup => ({
    id: 'group-1',
    tournament_id: 'tournament-1',
    group_letter: 'A',
    sort_by_games_between_teams: false,
    ...overrides,
  }),

  /**
   * Tournament Group Team factory
   */
  tournamentGroupTeam: (overrides?: Partial<TournamentGroupTeam>): TournamentGroupTeam => ({
    id: 'group-team-1',
    tournament_group_id: 'group-1',
    team_id: 'team-1',
    position: 0,
    games_played: 3,
    points: 7,
    win: 2,
    draw: 1,
    loss: 0,
    goals_for: 5,
    goals_against: 2,
    goal_difference: 3,
    conduct_score: 0,
    is_complete: false,
    ...overrides,
  }),

  /**
   * Tournament Group Game factory (junction table)
   */
  tournamentGroupGame: (overrides?: Partial<TournamentGroupGameTable>): TournamentGroupGameTable => ({
    tournament_group_id: 'group-1',
    game_id: 'game-1',
    ...overrides,
  }),

  /**
   * Tournament Group Team Stats Guess factory
   */
  tournamentGroupTeamStatsGuess: (overrides?: Partial<TournamentGroupTeamStatsGuess>): TournamentGroupTeamStatsGuess => ({
    id: 'stats-guess-1',
    tournament_group_id: 'group-1',
    user_id: 'user-1',
    team_id: 'team-1',
    position: 0,
    games_played: 3,
    points: 7,
    win: 2,
    draw: 1,
    loss: 0,
    goals_for: 5,
    goals_against: 2,
    goal_difference: 3,
    conduct_score: 0,
    is_complete: false,
    ...overrides,
  }),

  /**
   * Playoff Round factory
   */
  playoffRound: (overrides?: Partial<PlayoffRound>): PlayoffRound => ({
    id: 'round-1',
    tournament_id: 'tournament-1',
    round_name: 'Round of 16',
    round_order: 1,
    total_games: 8,
    is_final: false,
    is_third_place: false,
    is_first_stage: true,
    ...overrides,
  }),

  /**
   * Prode Group factory
   */
  prodeGroup: (overrides?: Partial<ProdeGroup>): ProdeGroup => ({
    id: 'prode-group-1',
    owner_user_id: 'user-1',
    name: 'Test Prode Group',
    theme: undefined,
    ...overrides,
  }),

  /**
   * Tournament Guess factory
   */
  tournamentGuess: (overrides?: Partial<TournamentGuess>): TournamentGuess => ({
    id: 'tournament-guess-1',
    tournament_id: 'tournament-1',
    user_id: 'user-1',
    champion_team_id: null,
    runner_up_team_id: null,
    third_place_team_id: null,
    best_player_id: undefined,
    top_goalscorer_player_id: undefined,
    best_goalkeeper_player_id: undefined,
    best_young_player_id: undefined,
    honor_roll_score: undefined,
    individual_awards_score: undefined,
    qualified_teams_score: undefined,
    group_position_score: undefined,
    ...overrides,
  }),

  /**
   * Tournament Venue factory
   */
  tournamentVenue: (overrides?: Partial<TournamentVenue>): TournamentVenue => ({
    id: 'venue-1',
    tournament_id: 'tournament-1',
    name: 'Test Stadium',
    location: 'Test City',
    picture_url: null,
    ...overrides,
  }),

  /**
   * Tournament Third Place Rules factory
   */
  tournamentThirdPlaceRules: (overrides?: Partial<TournamentThirdPlaceRules>): TournamentThirdPlaceRules => ({
    id: 'rules-1',
    tournament_id: 'tournament-1',
    combination_key: 'ABCDEFGH',
    rules: { Position1: 'A', Position2: 'B' },
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  }),

  /**
   * Prode Group Tournament Betting factory
   */
  prodeGroupTournamentBetting: (overrides?: Partial<ProdeGroupTournamentBetting>): ProdeGroupTournamentBetting => ({
    id: 'betting-1',
    group_id: 'prode-group-1',
    tournament_id: 'tournament-1',
    betting_enabled: true,
    betting_amount: 50,
    betting_payout_description: 'Winner takes all',
    ...overrides,
  }),

  /**
   * Prode Group Tournament Betting Payment factory
   */
  prodeGroupTournamentBettingPayment: (overrides?: Partial<ProdeGroupTournamentBettingPayment>): ProdeGroupTournamentBettingPayment => ({
    id: 'payment-1',
    group_tournament_betting_id: 'betting-1',
    user_id: 'user-1',
    has_paid: false,
    ...overrides,
  }),
};

/**
 * Helper to create multiple instances with sequential IDs
 *
 * Usage:
 * ```typescript
 * const teams = createMany(testFactories.team, 4, (i) => ({
 *   id: `team-${i}`,
 *   name: `Team ${i}`
 * }));
 * ```
 */
export function createMany<T>(
  factory: (overrides?: Partial<T>) => T,
  count: number,
  overridesFn?: (index: number) => Partial<T>
): T[] {
  return Array.from({ length: count }, (_, i) =>
    factory(overridesFn ? overridesFn(i + 1) : undefined)
  );
}
