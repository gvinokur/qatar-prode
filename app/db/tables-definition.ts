import {
  Generated,
  Insertable,
  JSONColumnType,
  Selectable,
  Updateable
} from "kysely";
import {PushSubscription} from "web-push";

export interface Identifiable {
  id: Generated<string>
}

export interface Theme {
  primary_color?: string
  secondary_color?: string
  logo?: string
  web_page?: string
  is_s3_logo?: boolean
  s3_logo_key?: string
}

export interface TournamentTable extends Identifiable{
  short_name: string

  long_name: string

  is_active: boolean

  champion_team_id?: string | null
  runner_up_team_id?: string | null
  third_place_team_id?: string | null
  best_player_id?: string
  top_goalscorer_player_id?: string
  best_goalkeeper_player_id?: string
  best_young_player_id?: string
  dev_only?: boolean
  display_name?: boolean

  theme: JSONColumnType<Theme> | null | undefined

  // Scoring configuration fields
  game_exact_score_points?: number
  game_correct_outcome_points?: number
  champion_points?: number
  runner_up_points?: number
  third_place_points?: number
  individual_award_points?: number
  qualified_team_points?: number
  exact_position_qualified_points?: number
  max_silver_games?: number
  max_golden_games?: number

  // Third place qualification configuration
  allows_third_place_qualification?: boolean | null
  max_third_place_qualifiers?: number | null
}

export type Tournament = Selectable<TournamentTable>
export type TournamentNew = Insertable<TournamentTable>
export type TournamentUpdate = Updateable<TournamentTable>

export interface OnboardingChecklistItem {
  id: string
  label: string
  completed: boolean
  completedAt?: Date
  order: number
}

export interface OnboardingData {
  currentStep?: number
  skippedSteps?: number[]
  dismissedTooltips?: string[]
  checklist?: {
    items: OnboardingChecklistItem[]
  }
}

export interface OAuthAccount {
  provider: string  // e.g., "google"
  provider_user_id: string  // OAuth provider's user ID
  email: string  // Email from OAuth provider
  connected_at: string  // ISO date string
}

export interface UserTable extends Identifiable{
  email: string
  nickname: string | null
  password_hash: string | null  // Nullable for OAuth-only users
  is_admin?: boolean
  reset_token?: string | null
  reset_token_expiration?: Date | null
  email_verified?: boolean
  verification_token?: string | null
  verification_token_expiration?: Date | null
  notification_subscriptions?: JSONColumnType<PushSubscription[]> | null
  onboarding_completed?: boolean
  onboarding_completed_at?: Date | null
  onboarding_data?: JSONColumnType<OnboardingData> | null
  // OAuth fields
  auth_providers?: JSONColumnType<string[]> | null  // e.g., ["credentials", "google"]
  oauth_accounts?: JSONColumnType<OAuthAccount[]> | null
  nickname_setup_required?: boolean
}

export type User = Selectable<UserTable>
export type UserNew = Insertable<UserTable>
export type UserUpdate = Updateable<UserTable>

export interface TournamentGroupTable extends Identifiable{
  tournament_id: string
  group_letter: string
  sort_by_games_between_teams: boolean
}

export type TournamentGroup = Selectable<TournamentGroupTable>
export type TournamentGroupNew = Insertable<TournamentGroupTable>
export type TournamentGroupUpdate = Updateable<TournamentGroupTable>

export interface TeamTable extends Identifiable {
  name: string
  short_name: string
  theme: JSONColumnType<Theme> | null | undefined
}

export type Team = Selectable<TeamTable>
export type TeamNew = Insertable<TeamTable>
export type TeamUpdate = Updateable<TeamTable>

export interface TournamentTeamTable {
  tournament_id: string
  team_id: string
}

export interface TournamentViewPermissionTable extends Identifiable {
  tournament_id: string
  user_id: string
  created_at?: Date
}

export type TournamentViewPermission = Selectable<TournamentViewPermissionTable>
export type TournamentViewPermissionNew = Insertable<TournamentViewPermissionTable>
export type TournamentViewPermissionUpdate = Updateable<TournamentViewPermissionTable>

export interface TournamentGroupTeamTable extends TeamStats, Identifiable {
  tournament_group_id: string
  position: number
}

export type TournamentGroupTeam = Selectable<TournamentGroupTeamTable>
export type TournamentGroupTeamNew = Insertable<TournamentGroupTeamTable>
export type TournamentGroupTeamUpdate = Updateable<TournamentGroupTeamTable>

export interface PlayoffRoundTable extends Identifiable {
  tournament_id: string
  round_name: string
  round_order: number
  total_games: number
  is_final?: boolean
  is_third_place?: boolean
  is_first_stage?: boolean
}

export type PlayoffRound = Selectable<PlayoffRoundTable>
export type PlayoffRoundNew = Insertable<PlayoffRoundTable>
export type PlayoffRoundUpdate = Updateable<PlayoffRoundTable>

export interface GroupFinishRule {
  group: string
  position: number
}

export interface TeamWinnerRule {
  game: number
  winner: boolean
}

export interface GameTable extends Identifiable {
  tournament_id: string
  game_number: number
  home_team?: string | null
  away_team?: string | null
  game_date: Date
  location: string
  home_team_rule?: JSONColumnType<GroupFinishRule | TeamWinnerRule>
  away_team_rule?: JSONColumnType<GroupFinishRule | TeamWinnerRule>
  game_type?: string
  game_local_timezone?: string
}

export type Game = Selectable<GameTable>
export type GameNew = Insertable<GameTable>
export type GameUpdate = Updateable<GameTable>

export interface TournamentGroupGameTable {
  tournament_group_id: string
  game_id: string
}

export interface PlayoffRoundGameTable {
  tournament_playoff_round_id: string
  game_id: string
}

export interface ProdeGroupTable extends Identifiable{
  owner_user_id: string
  name: string
  theme?: JSONColumnType<Theme>
}

export type ProdeGroup = Selectable<ProdeGroupTable>
export type ProdeGroupNew = Insertable<ProdeGroupTable>
export type ProdeGroupUpdate = Updateable<ProdeGroupTable>

export interface ProdeGroupParticipantTable {
  prode_group_id: string
  participant_id: string
  is_admin?: boolean
}

export interface GameResultTable {
  game_id: string
  home_score?: number
  away_score?: number
  home_penalty_score?: number
  away_penalty_score?: number
  is_draft: boolean
}

export type GameResult = Selectable<GameResultTable>
export type GameResultNew = Insertable<GameResultTable>
export type GameResultUpdate = Updateable<GameResultTable>

export interface GameGuessTable extends Identifiable{
  game_id: string
  game_number: number
  user_id: string
  home_team?: string | null
  away_team?: string | null
  home_score?: number
  away_score?: number
  home_penalty_winner?: boolean
  away_penalty_winner?: boolean
  /**
   * Undefined - The game has not been played or the calculation did not happen
   * 0 - Missed guess
   * 1- Correct guess with wrong score
   * 2- Exact guess
   */
  score?:number

  // Boost fields
  boost_type?: 'silver' | 'golden' | null
  boost_multiplier?: number
  final_score?: number

  // Optimistic locking
  updated_at?: Date
}

export type GameGuess = Selectable<GameGuessTable>
export type GameGuessNew = Insertable<GameGuessTable>
export type GameGuessUpdate = Updateable<GameGuessTable>

export interface TournamentGuessTable extends Identifiable{
  tournament_id:string
  user_id:string
  champion_team_id?: string | null
  runner_up_team_id?: string | null
  third_place_team_id?: string | null
  best_player_id?: string
  top_goalscorer_player_id?: string
  best_goalkeeper_player_id?: string
  best_young_player_id?: string
  /**
   * undefined - No positions defined or did not calculate them
   * 5 points for champion guess
   * 3 points for runner up guess
   * 1 point for third place guess
   */
  honor_roll_score?: number
  /**
   * undefined - No awards defined or did not calculate them
   * 3 points for each correct award
   */
  individual_awards_score?:number
  /**
   * undefined - no qualified team yet.
   * 1 point for each correct qualified team guessed
   */
  qualified_teams_score?: number
  /**
   * Count of teams correctly predicted to qualify (regardless of position)
   */
  qualified_teams_correct?: number
  /**
   * Count of teams correctly predicted to qualify with exact position match
   */
  qualified_teams_exact?: number
  /**
   * undefined - no group position score yet.
   * 1 point for each exact group position guessed
   */
  group_position_score?: number
  /**
   * undefined - no qualification predictions yet
   * 1 point for correct qualification + 1 point for exact position
   */
  qualification_score?: number
  /**
   * Date when tournament scores were last updated, in YYYYMMDD format (e.g., 20260206)
   * Used for daily rank change tracking
   */
  last_score_update_date?: number
  /**
   * Snapshot of previous day's total tournament score
   * Sum of: qualified_teams_score + honor_roll_score + individual_awards_score + group_position_score
   * Updated on first score change each day
   */
  yesterday_tournament_score?: number
}

export type TournamentGuess = Selectable<TournamentGuessTable>
export type TournamentGuessNew = Insertable<TournamentGuessTable>
export type TournamentGuessUpdate = Updateable<TournamentGuessTable>

export interface QualifiedTeamPredictionTable extends Identifiable {
  user_id: string
  tournament_id: string
  group_id: string
  team_id: string
  predicted_position: number
  predicted_to_qualify: boolean
  created_at?: Date
  updated_at?: Date
}

export type QualifiedTeamPrediction = Selectable<QualifiedTeamPredictionTable>
export type QualifiedTeamPredictionNew = Insertable<QualifiedTeamPredictionTable>
export type QualifiedTeamPredictionUpdate = Updateable<QualifiedTeamPredictionTable>

// JSONB-based group positions prediction (atomic batch updates)
export interface TeamPositionPrediction {
  team_id: string
  predicted_position: number
  predicted_to_qualify: boolean
}

export interface TournamentUserGroupPositionsPredictionTable extends Identifiable {
  user_id: string
  tournament_id: string
  group_id: string
  team_predicted_positions: JSONColumnType<TeamPositionPrediction[]>
  created_at?: Date
  updated_at?: Date
}

export type TournamentUserGroupPositionsPrediction = Selectable<TournamentUserGroupPositionsPredictionTable>
export type TournamentUserGroupPositionsPredictionNew = Insertable<TournamentUserGroupPositionsPredictionTable>
export type TournamentUserGroupPositionsPredictionUpdate = Updateable<TournamentUserGroupPositionsPredictionTable>

// Tournament Prediction Completion Tracking
export interface TournamentPredictionCompletion {
  // Final standings (3 items: champion, runner-up, third place)
  finalStandings: {
    completed: number;
    total: number;
    champion: boolean;
    runnerUp: boolean;
    thirdPlace: boolean;
  };
  // Individual awards (4 items)
  awards: {
    completed: number;
    total: number;
    bestPlayer: boolean;
    topGoalscorer: boolean;
    bestGoalkeeper: boolean;
    bestYoungPlayer: boolean;
  };
  // Qualifiers (dynamic count based on playoff bracket)
  qualifiers: {
    completed: number;
    total: number;
  };
  // Overall metrics
  overallCompleted: number;
  overallTotal: number;
  overallPercentage: number;
  isPredictionLocked: boolean;
}

export interface PlayerTable extends Identifiable {
  team_id: string
  tournament_id: string
  name: string
  position: string
  age_at_tournament: number
}

export type Player = Selectable<PlayerTable>
export type PlayerNew = Insertable<PlayerTable>
export type PlayerUpdate = Updateable<PlayerTable>

export interface TeamStats {
  team_id: string
  games_played: number
  points: number
  win: number
  draw: number
  loss: number
  goals_for: number
  goals_against: number
  goal_difference: number
  conduct_score: number
  is_complete: boolean
}

export interface TournamentVenueTable extends Identifiable {
  tournament_id: string;
  name: string;
  location: string;
  picture_url: string | null;
}

export type TournamentVenue = Selectable<TournamentVenueTable>;
export type TournamentVenueNew = Insertable<TournamentVenueTable>
export type TournamentVenueUpdate = Updateable<TournamentVenueTable>

// Third-place qualifier assignment rules
export interface ThirdPlaceRuleMapping {
  [bracketPosition: string]: string; // e.g., {"Position1": "A", "Position2": "B"}
}

export interface TournamentThirdPlaceRulesTable extends Identifiable {
  tournament_id: string;
  combination_key: string;
  rules: JSONColumnType<ThirdPlaceRuleMapping>;
  created_at?: Date;
  updated_at?: Date;
}

export type TournamentThirdPlaceRules = Selectable<TournamentThirdPlaceRulesTable>;
export type TournamentThirdPlaceRulesNew = Insertable<TournamentThirdPlaceRulesTable>;
export type TournamentThirdPlaceRulesUpdate = Updateable<TournamentThirdPlaceRulesTable>;

// Betting configuration for a group/tournament pair
export interface ProdeGroupTournamentBettingTable extends Identifiable {
  group_id: string;
  tournament_id: string;
  betting_enabled: boolean;
  betting_amount?: number | null;
  betting_payout_description?: string | null;
}

export type ProdeGroupTournamentBetting = Selectable<ProdeGroupTournamentBettingTable>;
export type ProdeGroupTournamentBettingNew = Insertable<ProdeGroupTournamentBettingTable>;
export type ProdeGroupTournamentBettingUpdate = Updateable<ProdeGroupTournamentBettingTable>;

// Payment status for each user in a group/tournament bet
export interface ProdeGroupTournamentBettingPaymentTable extends Identifiable {
  group_tournament_betting_id: string;
  user_id: string;
  has_paid: boolean;
}

export type ProdeGroupTournamentBettingPayment = Selectable<ProdeGroupTournamentBettingPaymentTable>;
export type ProdeGroupTournamentBettingPaymentNew = Insertable<ProdeGroupTournamentBettingPaymentTable>;
export type ProdeGroupTournamentBettingPaymentUpdate = Updateable<ProdeGroupTournamentBettingPaymentTable>;
