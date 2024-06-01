import {createBaseFunctions} from "./base-repository";
import {Player, PlayerTable} from "./tables-definition";
import {db} from "./database";
import {jsonArrayFrom, jsonObjectFrom} from "kysely/helpers/postgres";

const tableName = 'players'

const baseFunctions = createBaseFunctions<PlayerTable, Player>(tableName)

export const findPLayerById = baseFunctions.findById
export const createPlayer = baseFunctions.create
export const deletePlayer = baseFunctions.delete
export const updatePlayer = baseFunctions.update

export async function findPlayerByTeamAndTournament(tournamentId: string, teamId: string, name: string) {
  return db.selectFrom(tableName)
    .selectAll()
    .where('tournament_id', '=', tournamentId)
    .where('team_id', '=', teamId)
    .where('name', '=', name)
    .executeTakeFirst()
}

export async function findAllPlayersInTournamentWithTeamData(tournamentId: string) {
  return db.selectFrom('players')
    .where('players.tournament_id', '=', tournamentId)
    .selectAll()
    .select((eb) => [
      jsonObjectFrom(
        eb.selectFrom('teams')
          .selectAll()
          .whereRef('teams.id', '=', 'players.team_id')

      ).as('team')
    ])
    .execute()
}
