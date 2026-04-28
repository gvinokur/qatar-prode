import { describe, it, expect } from 'vitest'
import { computeNowAvailableRoundIds } from '../playoff-availability'
import type { PlayoffRoundAvailabilityInfo } from '../playoff-availability'

const THREE_HOURS_MS = 3 * 60 * 60 * 1000

const makeRound = (
  overrides: Partial<PlayoffRoundAvailabilityInfo> & { roundId?: string } = {}
): PlayoffRoundAvailabilityInfo => ({
  roundId: 'round-1',
  roundOrder: 1,
  hasTeamsDefined: false,
  previousStageLastGameDate: null,
  hasUnpredictedGames: true,
  ...overrides,
})

describe('computeNowAvailableRoundIds', () => {
  const now = Date.now()

  it('returns empty array when all rounds are fully predicted', () => {
    const rounds = [
      makeRound({ roundId: 'r1', hasTeamsDefined: true, hasUnpredictedGames: false }),
      makeRound({ roundId: 'r2', hasTeamsDefined: true, hasUnpredictedGames: false }),
    ]
    expect(computeNowAvailableRoundIds(rounds, now)).toEqual([])
  })

  it('returns round ID when Trigger A fires (hasTeamsDefined=true and has unpredicted games)', () => {
    const rounds = [makeRound({ roundId: 'r1', hasTeamsDefined: true, hasUnpredictedGames: true })]
    expect(computeNowAvailableRoundIds(rounds, now)).toEqual(['r1'])
  })

  it('returns round ID when Trigger B fires (3h past previousStageLastGameDate)', () => {
    const fourHoursAgo = new Date(now - 4 * 60 * 60 * 1000)
    const rounds = [
      makeRound({
        roundId: 'r1',
        hasTeamsDefined: false,
        previousStageLastGameDate: fourHoursAgo,
        hasUnpredictedGames: true,
      }),
    ]
    expect(computeNowAvailableRoundIds(rounds, now)).toEqual(['r1'])
  })

  it('does NOT return round when hasTeamsDefined=false and Trigger B timeline not yet met', () => {
    const oneHourAgo = new Date(now - 1 * 60 * 60 * 1000)
    const rounds = [
      makeRound({
        roundId: 'r1',
        hasTeamsDefined: false,
        previousStageLastGameDate: oneHourAgo,
        hasUnpredictedGames: true,
      }),
    ]
    expect(computeNowAvailableRoundIds(rounds, now)).toEqual([])
  })

  it('does NOT return round when fully predicted even if teams are defined', () => {
    const rounds = [makeRound({ roundId: 'r1', hasTeamsDefined: true, hasUnpredictedGames: false })]
    expect(computeNowAvailableRoundIds(rounds, now)).toEqual([])
  })

  it('handles null previousStageLastGameDate gracefully (only Trigger A applies)', () => {
    const rounds = [
      makeRound({
        roundId: 'r1',
        hasTeamsDefined: false,
        previousStageLastGameDate: null,
        hasUnpredictedGames: true,
      }),
    ]
    expect(computeNowAvailableRoundIds(rounds, now)).toEqual([])
  })

  it('returns multiple qualifying round IDs in order', () => {
    const fourHoursAgo = new Date(now - 4 * 60 * 60 * 1000)
    const rounds = [
      makeRound({ roundId: 'r1', hasTeamsDefined: true, hasUnpredictedGames: true }),
      makeRound({ roundId: 'r2', hasTeamsDefined: false, previousStageLastGameDate: fourHoursAgo, hasUnpredictedGames: true }),
    ]
    const result = computeNowAvailableRoundIds(rounds, now)
    expect(result).toEqual(['r1', 'r2'])
  })
})
