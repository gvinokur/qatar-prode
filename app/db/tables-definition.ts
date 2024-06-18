import {
  ColumnType,
  Generated,
  Insertable,
  JSONColumnType,
  Selectable,
  Updateable
} from "kysely";
import exp from "node:constants";

export interface Identifiable {
  id: Generated<string>
}

export interface Theme {
  primary_color?: string
  secondary_color?: string
  logo?: string
  web_page?: string
}

export interface TournamentTable extends Identifiable{
  short_name: string

  long_name: string

  is_active: boolean

  theme: JSONColumnType<Theme> | null
}

export type Tournament = Selectable<TournamentTable>
export type TournamentNew = Insertable<TournamentTable>
export type TournamentUpdate = Updateable<TournamentTable>

export interface UserTable extends Identifiable{
  email: string
  nickname: string | null
  password_hash: string
  is_admin?: boolean
}

export type User = Selectable<UserTable>
export type UserNew = Insertable<UserTable>
export type UserUpdate = Updateable<UserTable>

export interface TournamentGroupTable extends Identifiable{
  tournament_id: string
  group_letter: string
}

export type TournamentGroup = Selectable<TournamentGroupTable>
export type TournamentGroupNew = Insertable<TournamentGroupTable>
export type TournamentGroupUpdate = Updateable<TournamentGroupTable>

export interface TeamTable extends Identifiable {
  name: string
  short_name: string
  theme: JSONColumnType<any> | null
}

export type Team = Selectable<TeamTable>
export type TeamNew = Insertable<TeamTable>
export type TeamUpdate = Updateable<TeamTable>

export interface TournamentTeamTable {
  tournament_id: string
  team_id: string
}

export interface TournamentGroupTeamTable extends TeamStats, Identifiable {
}

export type TournamentGroupTeam = Selectable<TournamentGroupTeamTable>
export type TournamentGroupTeamNew = Insertable<TournamentGroupTeamTable>
export type TournamentGroupTeamUpdate = Updateable<TournamentGroupTeamTable>

export interface TournamentGroupTeamStatsGuessTable extends TeamStats, Identifiable {
  user_id: string
}

export type TournamentGroupTeamStatsGuess = Selectable<TournamentGroupTeamStatsGuessTable>
export type TournamentGroupTeamStatsGuessNew = Insertable<TournamentGroupTeamStatsGuessTable>
export type TournamentGroupTeamStatsGuessUpdate = Updateable<TournamentGroupTeamStatsGuessTable>

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
}

export type TournamentGuess = Selectable<TournamentGuessTable>
export type TournamentGuessNew = Insertable<TournamentGuessTable>
export type TournamentGuessUpdate = Updateable<TournamentGuessTable>

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
  tournament_group_id: string
  position: number
  games_played: number
  points: number
  win: number
  draw: number
  loss: number
  goals_for: number
  goals_against: number
  goal_difference: number
}
