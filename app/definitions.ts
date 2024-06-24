import {
  Game,
  GameResult,
  GameResultNew,
  Player,
  PlayoffRound,
  Team, TeamStats,
  Tournament,
  TournamentGroup
} from "./db/tables-definition";

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
  gameResult?: GameResultNew
}

export interface CompleteTournamentData {
  tournament: Tournament
  teamsMap: {[k:string]: Team}
  gamesMap: {[k:string]: ExtendedGameData}
  groups: ExtendedGroupData[]
  playoffRounds: ExtendedPlayoffRoundData[]
}

export interface CompleteGroupData {
  group: TournamentGroup
  allGroups: TournamentGroup[]
  teamsMap: {[k:string]: Team}
  gamesMap: {[k:string]: ExtendedGameData}
  teamPositions: TeamStats[]
}


export interface CompletePlayoffData {
  playoffStages: ExtendedPlayoffRoundData[]
  teamsMap: {[k:string]: Team}
  gamesMap: {[k:string]: Game}
  tournamentStartDate: Date
}

export interface UserScore {
  userId: string,
  groupStageScore: number,
  groupStageQualifiersScore: number,
  playoffScore: number,
  honorRollScore: number,
  totalPoints: number,
  individualAwardsScore: number
}

export interface ExtendedPlayerData extends Player{
  team: Team
}
