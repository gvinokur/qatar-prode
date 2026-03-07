import { describe, it, expect } from 'vitest'
import { getAvatarColor, getUserInitials } from '../../app/utils/avatar-utils'

describe('getAvatarColor', () => {
  it('returns a hex color string', () => {
    const color = getAvatarColor('user-123')
    expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/)
  })

  it('returns the same color for the same userId', () => {
    expect(getAvatarColor('abc')).toBe(getAvatarColor('abc'))
  })

  it('returns different colors for different userIds', () => {
    const colors = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'].map(getAvatarColor)
    const uniqueColors = new Set(colors)
    // Not all the same
    expect(uniqueColors.size).toBeGreaterThan(1)
  })

  it('handles empty string userId', () => {
    const color = getAvatarColor('')
    expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/)
  })
})

describe('getUserInitials', () => {
  it('returns two uppercase initials for a first and last name', () => {
    expect(getUserInitials('John Doe')).toBe('JD')
  })

  it('uses first and last word for multi-word names', () => {
    expect(getUserInitials('Maria de los Angeles Lopez')).toBe('ML')
  })

  it('returns first two characters for single name', () => {
    expect(getUserInitials('Pedro')).toBe('PE')
  })

  it('returns uppercase for lowercase input', () => {
    expect(getUserInitials('john doe')).toBe('JD')
  })

  it('handles single character name', () => {
    expect(getUserInitials('A')).toBe('A')
  })

  it('trims leading and trailing spaces', () => {
    expect(getUserInitials('  John Doe  ')).toBe('JD')
  })
})
