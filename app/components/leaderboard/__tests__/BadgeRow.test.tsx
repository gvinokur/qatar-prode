import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import React from 'react'
import { renderWithTheme } from '@/__tests__/utils/test-utils'
import { BadgeRow } from '../BadgeRow'
import type { Badge } from '../types'

// Mock next-intl with simple key-pass-through
vi.mock('next-intl', async () => {
  const actual = await vi.importActual('next-intl')
  return {
    ...actual,
    useTranslations: () => (key: string) => key,
  }
})

const positiveBadge: Badge = { id: 'crack', emoji: '🥇', type: 'positive' }
const negativeBadge: Badge = { id: 'dead-last', emoji: '💩', type: 'negative' }

describe('BadgeRow', () => {
  it('renders nothing when badges array is empty', () => {
    const { container } = renderWithTheme(
      <BadgeRow badges={[]} sizePx={16} context="dark" />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders emoji for each badge', () => {
    renderWithTheme(
      <BadgeRow badges={[positiveBadge, negativeBadge]} sizePx={16} context="dark" />
    )
    expect(screen.getByText('🥇')).toBeInTheDocument()
    expect(screen.getByText('💩')).toBeInTheDocument()
  })

  it('applies grayscale filter for negative badges in dark context', () => {
    renderWithTheme(
      <BadgeRow badges={[negativeBadge]} sizePx={16} context="dark" />
    )
    const emoji = screen.getByText('💩')
    expect(emoji).toHaveStyle({ filter: 'grayscale(1)' })
  })

  it('does NOT apply grayscale filter in share context', () => {
    renderWithTheme(
      <BadgeRow badges={[negativeBadge]} sizePx={16} context="share" />
    )
    const emoji = screen.getByText('💩')
    // filter should be undefined / not set
    expect(emoji).not.toHaveStyle({ filter: 'grayscale(1)' })
  })

  it('applies lower opacity to negative badges in dark context', () => {
    renderWithTheme(
      <BadgeRow badges={[negativeBadge]} sizePx={16} context="dark" />
    )
    const emoji = screen.getByText('💩')
    expect(emoji).toHaveStyle({ opacity: 0.4 })
  })

  it('applies opacity 0.35 to negative badges in share context', () => {
    renderWithTheme(
      <BadgeRow badges={[negativeBadge]} sizePx={16} context="share" />
    )
    const emoji = screen.getByText('💩')
    expect(emoji).toHaveStyle({ opacity: 0.35 })
  })

  it('does not reduce opacity for positive badges', () => {
    renderWithTheme(
      <BadgeRow badges={[positiveBadge]} sizePx={16} context="dark" />
    )
    const emoji = screen.getByText('🥇')
    expect(emoji).toHaveStyle({ opacity: 1 })
  })

  it('respects maxDisplay limit', () => {
    const badges: Badge[] = [
      { id: 'crack', emoji: '🥇', type: 'positive' },
      { id: 'rocket', emoji: '📈', type: 'positive' },
      { id: 'sharp', emoji: '🎯', type: 'positive' },
    ]
    renderWithTheme(
      <BadgeRow badges={badges} sizePx={16} context="dark" maxDisplay={2} />
    )
    expect(screen.getByText('🥇')).toBeInTheDocument()
    expect(screen.getByText('📈')).toBeInTheDocument()
    expect(screen.queryByText('🎯')).not.toBeInTheDocument()
  })

  it('renders with correct font size', () => {
    renderWithTheme(
      <BadgeRow badges={[positiveBadge]} sizePx={20} context="dark" />
    )
    const emoji = screen.getByText('🥇')
    expect(emoji).toHaveStyle({ fontSize: '20px' })
  })
})
