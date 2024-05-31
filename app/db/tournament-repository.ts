import { db } from './database'
import {createBaseFunctions} from "./base-repository";
import {Tournament, TournamentTable, TournamentTeamTable} from "./tables-definition";

const baseFunctions = createBaseFunctions<TournamentTable, Tournament>('tournaments');
export const findTournamentById = baseFunctions.findById
export const updateTournament = baseFunctions.update
export const createTournament = baseFunctions.create
export const deleteTournament =  baseFunctions.delete

export async function findTournamentByName (name:string) {
  return db.selectFrom('tournaments')
    .where('long_name', '=', name)
    .selectAll()
    .executeTakeFirst()
}

export async function findAllActiveTournaments () {
  return db.selectFrom('tournaments')
    .where('is_active', '=', true)
    .selectAll()
    .execute()
}

export async function createTournamentTeam(tournamentTeam: TournamentTeamTable) {
  return await db.insertInto('tournament_teams')
    .values(tournamentTeam)
    .returningAll()
    .executeTakeFirstOrThrow()
}

export async function deleteTournamentTeams(tournamentId: string) {
  return db.deleteFrom('tournament_teams')
    .where('tournament_id', '=', tournamentId)
    .execute()
}
