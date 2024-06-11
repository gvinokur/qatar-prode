'use server'

import { db } from './database'
import {createBaseFunctions} from "./base-repository";
import {
  TournamentGroup,
  TournamentGroupGameTable,
  TournamentGroupTable,
  TournamentGroupTeamTable,
} from "./tables-definition";
import {jsonArrayFrom} from "kysely/helpers/postgres";

const baseFunctions = createBaseFunctions<TournamentGroupTable, TournamentGroup>('tournament_groups');
export const findTournamentgroupById = baseFunctions.findById
export const updateTournamentGroup = baseFunctions.update
export const createTournamentGroup = baseFunctions.create
export const deleteTournamentGroup =  baseFunctions.delete

export async function createTournamentGroupTeam(tournamentGroupTeam: TournamentGroupTeamTable) {
  return await db.insertInto('tournament_group_teams')
    .values(tournamentGroupTeam)
    .returningAll()
    .executeTakeFirstOrThrow()
}

export async function createTournamentGroupGame(tournamentGroupGame: TournamentGroupGameTable) {
  return await db.insertInto('tournament_group_games')
    .values(tournamentGroupGame)
    .returningAll()
    .executeTakeFirstOrThrow()
}

export async function findGroupsInTournament(tournamentId: string) {
  return await db.selectFrom('tournament_groups')
    .where('tournament_id', '=', tournamentId)
    .selectAll()
    .execute()
}

export async function findGroupsWithGamesAndTeamsInTournament(tournamentId: string) {
  return await db.selectFrom('tournament_groups')
    .where('tournament_id', '=', tournamentId)
    .selectAll()
    .select((eb) => [
      jsonArrayFrom(
        eb.selectFrom('tournament_group_games')
          .innerJoin('games', 'games.id', 'tournament_group_games.game_id')
          .orderBy('games.game_number', 'asc')
          .select('game_id')
          .whereRef('tournament_group_games.tournament_group_id', '=', 'tournament_groups.id')

      ).as('games'),
      jsonArrayFrom(
        eb.selectFrom('tournament_group_teams')
          .orderBy('position', 'asc')
          .select('team_id')
          .whereRef('tournament_group_teams.tournament_group_id', '=', 'tournament_groups.id')
      ).as('teams')
    ])
    .execute()
}

export async function deleteAllGroupsFromTournament(tournamentId: string) {
  const groups = await findGroupsInTournament(tournamentId)
  const waitForAllDelete = Promise.all(groups.map(async (group) => {
    await db.deleteFrom('tournament_group_teams')
      .where('tournament_group_id', '=', group.id)
      .execute()

    await deleteTournamentGroup(group.id)
  }))
  return waitForAllDelete
}
