'use server'

import { getLoggedInUser } from './user-actions'
import {
  getUserTournamentCompletionsPaginated,
  type UserTournamentCompletionRow,
} from '../db/user-tournament-completion-repository'

export type { UserTournamentCompletionRow }

export async function getUserTournamentCompletionsAction(
  tournamentId: string,
  page: number,
  pageSize: number
): Promise<{ rows: UserTournamentCompletionRow[]; total: number }> {
  const user = await getLoggedInUser()
  if (!user?.isAdmin) {
    throw new Error('Unauthorized')
  }

  return getUserTournamentCompletionsPaginated(tournamentId, page, pageSize)
}
