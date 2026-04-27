import { describe, it, expect } from 'vitest'
import { areGroupStageGamesPredicted } from '../stage-utils'
import type { ActionCenterData } from '../../actions/hub-actions'

const makeData = (groupStageGamesCompleted: number, groupStageGamesTotal: number): Pick<ActionCenterData, 'groupStageGamesCompleted' | 'groupStageGamesTotal'> => ({
  groupStageGamesCompleted,
  groupStageGamesTotal,
})

describe('areGroupStageGamesPredicted', () => {
  it('returns false when totalGroupGames is 0', () => {
    expect(areGroupStageGamesPredicted(makeData(0, 0) as ActionCenterData)).toBe(false)
  })

  it('returns false when completed < total', () => {
    expect(areGroupStageGamesPredicted(makeData(40, 48) as ActionCenterData)).toBe(false)
  })

  it('returns false when completed is 0', () => {
    expect(areGroupStageGamesPredicted(makeData(0, 48) as ActionCenterData)).toBe(false)
  })

  it('returns true when completed === total > 0', () => {
    expect(areGroupStageGamesPredicted(makeData(48, 48) as ActionCenterData)).toBe(true)
  })
})
