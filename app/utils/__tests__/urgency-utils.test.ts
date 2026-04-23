import { describe, it, expect } from 'vitest'
import { computeStatusWidgetSeverity } from '../urgency-utils'

const ONE_HOUR_MS = 60 * 60 * 1000
const TWENTY_FOUR_HOURS_MS = 24 * ONE_HOUR_MS
const FORTY_EIGHT_HOURS_MS = 48 * ONE_HOUR_MS

describe('computeStatusWidgetSeverity', () => {
  it('returns "error" when msUntilLock is less than 2 hours', () => {
    expect(computeStatusWidgetSeverity(ONE_HOUR_MS)).toBe('error')
    expect(computeStatusWidgetSeverity(0)).toBe('error')
    expect(computeStatusWidgetSeverity(2 * ONE_HOUR_MS - 1)).toBe('error')
  })

  it('returns "warning" when msUntilLock is between 2 hours and 24 hours', () => {
    expect(computeStatusWidgetSeverity(2 * ONE_HOUR_MS)).toBe('warning')
    expect(computeStatusWidgetSeverity(12 * ONE_HOUR_MS)).toBe('warning')
    expect(computeStatusWidgetSeverity(TWENTY_FOUR_HOURS_MS - 1)).toBe('warning')
  })

  it('returns "info" when msUntilLock is between 24 hours and 48 hours', () => {
    expect(computeStatusWidgetSeverity(TWENTY_FOUR_HOURS_MS)).toBe('info')
    expect(computeStatusWidgetSeverity(36 * ONE_HOUR_MS)).toBe('info')
    expect(computeStatusWidgetSeverity(FORTY_EIGHT_HOURS_MS - 1)).toBe('info')
  })

  it('returns "normal" when msUntilLock is 48 hours or more', () => {
    expect(computeStatusWidgetSeverity(FORTY_EIGHT_HOURS_MS)).toBe('normal')
    expect(computeStatusWidgetSeverity(7 * TWENTY_FOUR_HOURS_MS)).toBe('normal')
  })

  it('returns "normal" for Number.MAX_SAFE_INTEGER', () => {
    expect(computeStatusWidgetSeverity(Number.MAX_SAFE_INTEGER)).toBe('normal')
  })
})
