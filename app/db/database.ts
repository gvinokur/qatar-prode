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
  TournamentGroupTable, TournamentGroupTeamStatsGuessTable,
  TournamentGroupTeamTable, TournamentGuessTable,
  TournamentTable,
  TournamentTeamTable, TournamentVenueTable,
  UserTable,
  ProdeGroupTournamentBettingTable,
  ProdeGroupTournamentBettingPaymentTable
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
  tournament_group_team_stats_guess: TournamentGroupTeamStatsGuessTable

  tournament_playoff_rounds: PlayoffRoundTable
  tournament_playoff_round_games: PlayoffRoundGameTable

  prode_groups: ProdeGroupTable
  prode_group_participants: ProdeGroupParticipantTable

  game_guesses: GameGuessTable
  game_results: GameResultTable

  tournament_guesses: TournamentGuessTable
  tournament_venues: TournamentVenueTable

  prode_group_tournament_betting: ProdeGroupTournamentBettingTable
  prode_group_tournament_betting_payments: ProdeGroupTournamentBettingPaymentTable
}

export const db= createKysely<Database>();
