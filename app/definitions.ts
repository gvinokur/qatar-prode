import {Game, GameResult, PlayoffRound, Team, Tournament, TournamentGroup} from "./db/tables-definition";

/**
 * Includes Group data, games and teams
 */
export interface ExtendedGroupData extends TournamentGroup {
  /**
   * List of ids of all games in this group, sorted by game_number ascending
   */
  games: { game_id: string }[]

  /**
   * List of ids of the teams in this group
   */
  teams: { team_id: string }[]
}

/**
 * Includes the Playoff Round and Game Related data
 */
export interface ExtendedPlayoffRoundData extends PlayoffRound {
  /**
   * List of ids of all games in this group, sorted by game_number ascending
   */
  games: { game_id: string }[]
}

/**
 * Includes the game and game results data
 */
export interface ExtendedGameData extends Game {
  group?: { tournament_group_id: string,  group_letter: string}
  playoffStage?: { tournament_playoff_round_id: string, round_name: string }
  gameResult?: GameResult
}

export interface CompleteTournamentData {
  tournament: Tournament
  teams: Team[]
  teamsMap: {[k:string]: Team}
  games: ExtendedGameData[]
  gamesMap: {[k:string]: ExtendedGameData}
  groups: ExtendedGroupData[]
  playoffRounds: ExtendedPlayoffRoundData[]
}

export interface CompleteGroupData {
  group: TournamentGroup
  allGroups: TournamentGroup[]
  teams: Team[]
  teamsMap: {[k:string]: Team}
  games: Game[]
  gamesMap: {[k:string]: Game}
}


export interface CompletePlayoffData {
  playoffStages: ExtendedPlayoffRoundData[]
  allGroups: ExtendedGroupData[]
  teamsMap: {[k:string]: Team}
  gamesMap: {[k:string]: Game}
  gameResultsMap: {[k:string]: GameResult}
  tournamentStartDate: Date
}

export interface TeamStats {
  team: string
  gamesPlayed: number
  points: number
  win: number
  draw: number
  loss: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
}

export interface UserScore {
  userId: string,
  groupStageScore: number,
  groupStageQualifiersScore: number,
  playoffScore: number,
  honorRollScore: number,
  totalPoints: number,
}
