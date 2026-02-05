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
  QualifiedTeamPrediction,
  TournamentVenue,
  TournamentThirdPlaceRules,
  ProdeGroupTournamentBetting,
  ProdeGroupTournamentBettingPayment,
} from '../../app/db/tables-definition';

/**
 * Type-safe test data factories for Kysely database tables.
 *
 * Each factory creates a valid object with sensible defaults that can be overridden.
 * All factories support partial overrides for customizing specific properties while
 * keeping default values for others.
 *
 * **Benefits:**
 * - **Type safety**: Full TypeScript support with autocomplete
 * - **Consistency**: All tests use same default values
 * - **Less boilerplate**: No need to specify every field
 * - **Maintainability**: Update defaults in one place
 *
 * @example
 * // Use defaults
 * const tournament = testFactories.tournament();
 * // { id: 'tournament-1', short_name: 'TEST', long_name: 'Test Tournament 2024', ... }
 *
 * @example
 * // Override specific properties
 * const tournament = testFactories.tournament({
 *   id: 'world-cup-2026',
 *   long_name: 'FIFA World Cup 2026'
 * });
 *
 * @example
 * // Create related entities
 * const tournament = testFactories.tournament({ id: 'euro-2024' });
 * const game = testFactories.game({
 *   tournament_id: tournament.id,
 *   home_team: 'germany',
 *   away_team: 'spain'
 * });
 *
 * @see {@link createMany} for bulk creation with sequential IDs
 */
export const testFactories = {
  /**
   * Creates a Tournament with default values.
   *
   * Default values include:
   * - Basic info: short_name='TEST', long_name='Test Tournament 2024'
   * - Status: is_active=true, dev_only=false
   * - Points: exact score (10), correct outcome (5), champion (15), etc.
   * - Boost limits: max_silver_games (5), max_golden_games (3)
   * - All award IDs: null or undefined
   *
   * @param overrides - Partial tournament object to override defaults
   * @returns Complete Tournament object
   *
   * @example
   * const tournament = testFactories.tournament();
   *
   * @example
   * const worldCup = testFactories.tournament({
   *   id: 'wc-2026',
   *   short_name: 'WC26',
   *   long_name: 'FIFA World Cup 2026',
   *   game_exact_score_points: 15
   * });
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
   * Creates a User with default values.
   *
   * Default values:
   * - email: 'test@example.com'
   * - nickname: 'TestUser'
   * - password_hash: 'hashed_password_123' (pre-hashed for testing)
   * - is_admin: false
   * - email_verified: true
   * - All reset/verification tokens: null
   *
   * @param overrides - Partial user object to override defaults
   * @returns Complete User object
   *
   * @example
   * const user = testFactories.user({ email: 'john@example.com', nickname: 'John' });
   *
   * @example
   * const adminUser = testFactories.user({ is_admin: true, nickname: 'Admin' });
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
   * Creates a Team with default values.
   *
   * @param overrides - Partial team object to override defaults
   * @returns Complete Team object
   *
   * @example
   * const team = testFactories.team({ id: 'argentina', name: 'Argentina', short_name: 'ARG' });
   *
   * @example
   * // Create multiple teams with createMany
   * const teams = createMany(testFactories.team, 4, (i) => ({
   *   id: `team-${i}`,
   *   name: `Team ${i}`
   * }));
   */
  team: (overrides?: Partial<Team>): Team => ({
    id: 'team-1',
    name: 'Test Team',
    short_name: 'TST',
    theme: null,
    ...overrides,
  }),

  /**
   * Creates a Game (match) with default values.
   *
   * Default values:
   * - tournament_id: 'tournament-1'
   * - home_team: 'team-1', away_team: 'team-2'
   * - game_date: '2024-06-14T18:00:00Z'
   * - game_type: 'group'
   * - game_local_timezone: 'America/New_York'
   *
   * @param overrides - Partial game object to override defaults
   * @returns Complete Game object
   *
   * @example
   * const game = testFactories.game({
   *   tournament_id: 'euro-2024',
   *   home_team: 'germany',
   *   away_team: 'spain',
   *   game_date: new Date('2024-07-14T20:00:00Z')
   * });
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
   * Creates a GameGuess (user's prediction for a game) with default values.
   *
   * Default values:
   * - game_id: 'game-1', user_id: 'user-1'
   * - home_team: 'team-1', away_team: 'team-2'
   * - home_score: 2, away_score: 1
   * - boost_multiplier: 1.0 (no boost)
   *
   * @param overrides - Partial game guess object to override defaults
   * @returns Complete GameGuess object
   *
   * @example
   * const guess = testFactories.gameGuess({
   *   user_id: 'user-123',
   *   game_id: 'game-1',
   *   home_score: 3,
   *   away_score: 2,
   *   boost_type: 'golden',
   *   boost_multiplier: 2.0
   * });
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

  /**
   * Qualified Team Prediction factory
   *
   * Creates a prediction for which teams qualify from tournament groups and their final positions.
   *
   * Default values:
   * - user_id: 'user-1', tournament_id: 'tournament-1'
   * - group_id: 'group-1', team_id: 'team-1'
   * - predicted_position: 1 (first place)
   * - predicted_to_qualify: true
   *
   * @param overrides - Partial qualified team prediction object to override defaults
   * @returns Complete QualifiedTeamPrediction object
   *
   * @example
   * // Position 1 or 2 (always qualify)
   * const prediction = testFactories.qualifiedTeamPrediction({
   *   team_id: 'argentina',
   *   predicted_position: 1,
   *   predicted_to_qualify: true
   * });
   *
   * @example
   * // Position 3 with third-place qualifier checkbox checked
   * const thirdPlacePrediction = testFactories.qualifiedTeamPrediction({
   *   team_id: 'colombia',
   *   predicted_position: 3,
   *   predicted_to_qualify: true  // User predicts this 3rd place team will qualify
   * });
   *
   * @example
   * // Position 3 without third-place qualifier (potential but not selected)
   * const potentialThirdPlace = testFactories.qualifiedTeamPrediction({
   *   team_id: 'chile',
   *   predicted_position: 3,
   *   predicted_to_qualify: false  // User thinks they won't make it as 3rd place
   * });
   *
   * @example
   * // Position 4 (not qualifying)
   * const fourthPlace = testFactories.qualifiedTeamPrediction({
   *   team_id: 'peru',
   *   predicted_position: 4,
   *   predicted_to_qualify: false
   * });
   */
  qualifiedTeamPrediction: (overrides?: Partial<QualifiedTeamPrediction>): QualifiedTeamPrediction => ({
    id: 'qualified-prediction-1',
    user_id: 'user-1',
    tournament_id: 'tournament-1',
    group_id: 'group-1',
    team_id: 'team-1',
    predicted_position: 1,
    predicted_to_qualify: true,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  }),
};

/**
 * Creates multiple instances with sequential IDs using a function to customize each instance.
 *
 * The overridesFn receives the index (starting from 1) and returns partial overrides
 * for that specific instance. This is useful for creating sequential test data.
 *
 * @template T - The type of entity being created
 * @param factory - Factory function from testFactories (e.g., testFactories.team)
 * @param count - Number of instances to create
 * @param overridesFn - Optional function that receives index (1-based) and returns overrides for that instance
 * @returns Array of created instances
 *
 * @example
 * // Simple: Create 4 teams with default values
 * const teams = createMany(testFactories.team, 4);
 * // [{ id: 'team-1', ...}, { id: 'team-2', ...}, { id: 'team-3', ...}, { id: 'team-4', ...}]
 *
 * @example
 * // With custom sequential IDs and names
 * const teams = createMany(testFactories.team, 4, (i) => ({
 *   id: `team-${i}`,
 *   name: `Team ${i}`,
 *   short_name: `T${i}`
 * }));
 *
 * @example
 * // Create users with sequential emails
 * const users = createMany(testFactories.user, 10, (i) => ({
 *   id: `user-${i}`,
 *   email: `user${i}@example.com`,
 *   nickname: `User${i}`
 * }));
 *
 * @example
 * // Create games for a tournament
 * const tournament = testFactories.tournament({ id: 'euro-2024' });
 * const games = createMany(testFactories.game, 6, (i) => ({
 *   id: `game-${i}`,
 *   tournament_id: tournament.id,
 *   game_number: i,
 *   game_date: new Date(`2024-06-${14 + i}T18:00:00Z`)
 * }));
 *
 * @see testFactories for available factory functions
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
