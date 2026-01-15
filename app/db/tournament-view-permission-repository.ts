import { db } from './database'
import { createBaseFunctions } from "./base-repository"
import {
  TournamentViewPermission,
  TournamentViewPermissionTable,
  TournamentViewPermissionNew
} from "./tables-definition"

const baseFunctions = createBaseFunctions<
  TournamentViewPermissionTable,
  TournamentViewPermission
>('tournament_view_permissions')

export const findPermissionById = baseFunctions.findById
export const createPermission = baseFunctions.create
export const deletePermission = baseFunctions.delete

// Get all user IDs who have permission to view a specific tournament
export async function findUserIdsForTournament(tournamentId: string): Promise<string[]> {
  const permissions = await db
    .selectFrom('tournament_view_permissions')
    .select('user_id')
    .where('tournament_id', '=', tournamentId)
    .execute()

  return permissions.map(p => p.user_id)
}

// Check if a specific user has permission to view a specific tournament
export async function hasUserPermission(
  tournamentId: string,
  userId: string
): Promise<boolean> {
  const permission = await db
    .selectFrom('tournament_view_permissions')
    .where('tournament_id', '=', tournamentId)
    .where('user_id', '=', userId)
    .selectAll()
    .executeTakeFirst()

  return !!permission
}

// Add multiple users to a tournament's permissions
export async function addUsersToTournament(
  tournamentId: string,
  userIds: string[]
): Promise<void> {
  if (userIds.length === 0) return

  const values: TournamentViewPermissionNew[] = userIds.map(userId => ({
    tournament_id: tournamentId,
    user_id: userId
  }))

  await db
    .insertInto('tournament_view_permissions')
    .values(values)
    .onConflict(oc => oc.columns(['tournament_id', 'user_id']).doNothing())
    .execute()
}

// Remove all permissions for a tournament (for bulk update)
export async function removeAllTournamentPermissions(
  tournamentId: string
): Promise<void> {
  await db
    .deleteFrom('tournament_view_permissions')
    .where('tournament_id', '=', tournamentId)
    .execute()
}

// Remove specific user's permission for a tournament
export async function removeUserFromTournament(
  tournamentId: string,
  userId: string
): Promise<void> {
  await db
    .deleteFrom('tournament_view_permissions')
    .where('tournament_id', '=', tournamentId)
    .where('user_id', '=', userId)
    .execute()
}
