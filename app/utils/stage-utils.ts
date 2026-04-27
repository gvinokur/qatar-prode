import type { ActionCenterData } from '../actions/hub-actions'

/** True when all group-stage games have been predicted by the user. */
export function areGroupStageGamesPredicted(data: ActionCenterData): boolean {
  return data.groupStageGamesTotal > 0 && data.groupStageGamesCompleted === data.groupStageGamesTotal
}
