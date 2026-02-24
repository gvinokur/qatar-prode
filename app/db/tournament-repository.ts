import { db, Database } from './database'
import { ExpressionBuilder } from 'kysely'
import {createBaseFunctions} from "./base-repository";
import {Tournament, TournamentTable, TournamentTeamTable} from "./tables-definition";
import {isDevelopmentMode} from "../utils/environment-utils";

const baseFunctions = createBaseFunctions<TournamentTable, Tournament>('tournaments');
export const findTournamentById = baseFunctions.findById
export const updateTournament = baseFunctions.update
export const createTournament = baseFunctions.create
export const deleteTournament =  baseFunctions.delete

/**
 * Find tournament by name.
 *
 * ⚠️ RETURNS RAW DATA - i18n fields must be localized in Server Action
 * ⚠️ DO NOT add locale parameter to this function
 * ⚠️ DO NOT apply localization here
 *
 * @see applyLocalization() in /app/utils/localization-helper.ts must be called in Server Action layer
 */
export async function findTournamentByName (name:string) {
  return db.selectFrom('tournaments')
    .where('long_name', '=', name)
    .selectAll()
    .executeTakeFirst()
}

/**
 * Find all tournaments.
 *
 * ⚠️ RETURNS RAW DATA - i18n fields must be localized in Server Action
 * ⚠️ DO NOT add locale parameter to this function
 * ⚠️ DO NOT apply localization here
 *
 * @see applyLocalization() in /app/utils/localization-helper.ts must be called in Server Action layer
 */
export async function findAllTournaments () {
  return db.selectFrom('tournaments')
    .selectAll()
    .execute()
}

/**
 * Helper function to check if user has permission for dev tournaments
 */
function buildDevTournamentPermissionCheck(
  eb: ExpressionBuilder<Database, 'tournaments'>,
  userId: string | undefined
) {
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

/**
 * Find all active tournaments.
 *
 * ⚠️ RETURNS RAW DATA - i18n fields must be localized in Server Action
 * ⚠️ DO NOT add locale parameter to this function
 * ⚠️ DO NOT apply localization here
 *
 * @see applyLocalization() in /app/utils/localization-helper.ts must be called in Server Action layer
 */
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

/**
 * Find past (inactive) tournaments.
 *
 * ⚠️ RETURNS RAW DATA - i18n fields must be localized in Server Action
 * ⚠️ DO NOT add locale parameter to this function
 * ⚠️ DO NOT apply localization here
 *
 * @see applyLocalization() in /app/utils/localization-helper.ts must be called in Server Action layer
 */
export async function findPastTournaments(limit: number = 5) {
  const query = db
    .selectFrom('tournaments')
    .where('is_active', '=', false)
    .where('dev_only', '=', false)
    .orderBy('id', 'desc')
    .limit(limit)
    .selectAll();

  return await query.execute();
}

/**
 * Create tournament team association.
 *
 * ⚠️ RETURNS RAW DATA - i18n fields must be localized in Server Action
 * ⚠️ DO NOT add locale parameter to this function
 * ⚠️ DO NOT apply localization here
 *
 * @see applyLocalization() in /app/utils/localization-helper.ts must be called in Server Action layer
 */
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
