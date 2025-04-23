import { db } from './database'
import {createBaseFunctions} from "./base-repository";
import {
  TournamentGroup,
  TournamentGroupGameTable,
  TournamentGroupTable, TournamentGroupTeamNew,
  TournamentGroupTeamTable, TournamentGroupTeamUpdate,
} from "./tables-definition";
import {jsonArrayFrom} from "kysely/helpers/postgres";

const baseFunctions = createBaseFunctions<TournamentGroupTable, TournamentGroup>('tournament_groups');
export const findTournamentgroupById = baseFunctions.findById
export const updateTournamentGroup = baseFunctions.update
export const createTournamentGroup = baseFunctions.create
export const deleteTournamentGroup =  baseFunctions.delete

export async function createTournamentGroupTeam(tournamentGroupTeam: TournamentGroupTeamNew) {
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

export async function findTeamsInGroup(tournamentGroupId: string) {
  return await db.selectFrom('tournament_group_teams')
    .where('tournament_group_id', '=', tournamentGroupId)
    .orderBy('position', 'asc')
    .selectAll()
    .execute()
}

export async function updateTournamentGroupTeams(groupTeams: TournamentGroupTeamUpdate[]) {
  return Promise.all(groupTeams.map( async ({id, team_id, tournament_group_id, ...withUpdate}) => {
    if(team_id && tournament_group_id) {
      return db.updateTable('tournament_group_teams')
        .where(eb => eb.and([
          eb("tournament_group_teams.team_id","=", team_id),
          eb("tournament_group_teams.tournament_group_id","=", tournament_group_id)
        ]))
        .set(withUpdate)
        .returningAll()
        .executeTakeFirst()
    }
  }))
}

/**
 * Deletes all team associations for a specific tournament group
 * @param tournamentGroupId - The ID of the tournament group
 * @returns A promise that resolves when the deletion is complete
 */
export async function deleteTournamentGroupTeams(tournamentGroupId: string) {
  return await db.deleteFrom('tournament_group_teams')
    .where('tournament_group_id', '=', tournamentGroupId)
    .execute();
}

/**
 * Deletes a tournament group game by the game_id
 * @param gameId - The ID of the game to delete
 */
export async function deleteTournamentGroupGame(gameId: string) {
  return await db.deleteFrom('tournament_group_games')
    .where('game_id', '=', gameId)
    .execute();
}
