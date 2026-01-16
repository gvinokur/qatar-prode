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

/**
 * Helper function to check if user has permission for dev tournaments
 */
function buildDevTournamentPermissionCheck(eb: any, userId: string | undefined) {
  if (!userId) {
    return eb.val(false)
  }

  return eb.exists(
    eb
      .selectFrom('tournament_view_permissions')
      .whereRef('tournament_view_permissions.tournament_id', '=', 'tournaments.id')
      .where('tournament_view_permissions.user_id', '=', userId)
      .select(eb.lit(1).as('one'))
  )
}

export async function findAllActiveTournaments (userId?: string) {
  const isDevMode = isDevelopmentMode()

  let query = db
    .selectFrom('tournaments')
    .where('is_active', '=', true)

  // In production, apply dev tournament filtering
  if (!isDevMode) {
    query = query.where(eb => eb.or([
      eb('dev_only', '=', false),
      eb.and([
        eb('dev_only', '=', true),
        buildDevTournamentPermissionCheck(eb, userId)
      ])
    ]))
  }

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
