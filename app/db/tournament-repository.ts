import { db } from './database'
import {createBaseFunctions} from "./base-repository";
import {Tournament, TournamentTable, TournamentTeamTable} from "./tables-definition";
import {isDevelopmentMode} from "../utils/environment-utils";

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

export async function findAllTournaments () {
  return db.selectFrom('tournaments')
    .selectAll()
    .execute()
}

export async function findAllActiveTournaments (userId?: string) {
  const isDevMode = isDevelopmentMode()

  let query = db
    .selectFrom('tournaments')
    .where('is_active', '=', true)

  // In production, apply dev tournament filtering
  if (!isDevMode) {
    query = query.where(eb => {
      return eb.or([
        // Include non-dev tournaments
        eb('dev_only', '=', false),
        // Include dev tournaments if user has permission
        eb.and([
          eb('dev_only', '=', true),
          userId
            ? eb.exists(
                db
                  .selectFrom('tournament_view_permissions')
                  .whereRef('tournament_view_permissions.tournament_id', '=', 'tournaments.id')
                  .where('tournament_view_permissions.user_id', '=', userId)
              )
            : eb.val(false) // No user = no dev tournament access
        ])
      ])
    })
  }
  // In development mode, show all active tournaments (no filtering)

  return query.selectAll().execute()
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
