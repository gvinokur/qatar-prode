import { createKysely } from "@vercel/postgres-kysely";
import {
  GameGuessTable, GameResultTable,
  GameTable, PlayerTable,
  PlayoffRoundGameTable,
  PlayoffRoundTable,
  ProdeGroupParticipantTable,
  ProdeGroupTable,
  TeamTable,
  TournamentGroupGameTable,
  TournamentGroupTable,
  TournamentGroupTeamTable, TournamentGuessTable,
  TournamentTable,
  TournamentTeamTable,
  UserTable
} from "./tables-definition";

export interface Database {
  users: UserTable
  teams: TeamTable
  games: GameTable
  players: PlayerTable

  tournaments: TournamentTable
  tournament_teams: TournamentTeamTable

  tournament_groups: TournamentGroupTable
  tournament_group_games: TournamentGroupGameTable
  tournament_group_teams: TournamentGroupTeamTable

  tournament_playoff_rounds: PlayoffRoundTable
  tournament_playoff_round_games: PlayoffRoundGameTable

  prode_groups: ProdeGroupTable
  prode_group_participants: ProdeGroupParticipantTable

  game_guesses: GameGuessTable
  game_results: GameResultTable

  tournament_guesses: TournamentGuessTable
}

export const db= createKysely<Database>();
