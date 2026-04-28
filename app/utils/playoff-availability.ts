const THREE_HOURS_MS = 3 * 60 * 60 * 1000

export interface PlayoffRoundAvailabilityInfo {
  roundId: string
  roundOrder: number
  /** True when any game in the round has both home_team and away_team set (non-null). */
  hasTeamsDefined: boolean
  /** Max game_date of the previous stage; null when there is no previous stage data. */
  previousStageLastGameDate: Date | null
  /** True when the user still has at least one unpredicted game in this round. */
  hasUnpredictedGames: boolean
}

/**
 * Pure function. Returns the IDs of playoff rounds that are "Now Available" for prediction.
 *
 * A round qualifies when the user has unpredicted games AND at least one trigger fires:
 *   Trigger A — hasTeamsDefined (real team names assigned to at least one game)
 *   Trigger B — 3 h have elapsed since the last game of the previous stage
 */
export function computeNowAvailableRoundIds(
  rounds: PlayoffRoundAvailabilityInfo[],
  now: number
): string[] {
  return rounds
    .filter((round) => {
      if (!round.hasUnpredictedGames) return false
      const triggerA = round.hasTeamsDefined
      const triggerB =
        round.previousStageLastGameDate !== null &&
        round.previousStageLastGameDate.getTime() + THREE_HOURS_MS < now
      return triggerA || triggerB
    })
    .map((round) => round.roundId)
}
