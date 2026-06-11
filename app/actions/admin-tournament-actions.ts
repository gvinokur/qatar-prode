'use server'

import { getLoggedInUser } from './user-actions'
import {
  getUserTournamentCompletionsPaginated,
  type UserTournamentCompletionRow,
} from '../db/user-tournament-completion-repository'
import { findAllProdeGroupsForAdmin } from '../db/prode-group-repository'

export type { UserTournamentCompletionRow }

export async function getUserTournamentCompletionsAction(
  tournamentId: string,
  page: number,
  pageSize: number,
  groupId?: string
): Promise<{ rows: UserTournamentCompletionRow[]; total: number }> {
  const user = await getLoggedInUser()
  if (!user?.isAdmin) {
    throw new Error('Unauthorized')
  }

  return getUserTournamentCompletionsPaginated(tournamentId, page, pageSize, groupId)
}

export async function getAllGroupsForAdminAction(): Promise<{ id: string; name: string }[]> {
  const user = await getLoggedInUser()
  if (!user?.isAdmin) {
    throw new Error('Unauthorized')
  }

  return findAllProdeGroupsForAdmin()
}
