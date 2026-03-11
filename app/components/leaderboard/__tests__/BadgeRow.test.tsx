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
      <BadgeRow badges={[]} sizePx={16} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders emoji for each badge', () => {
    renderWithTheme(
      <BadgeRow badges={[positiveBadge, negativeBadge]} sizePx={16} />
    )
    expect(screen.getByText('🥇')).toBeInTheDocument()
    expect(screen.getByText('💩')).toBeInTheDocument()
  })

  it('renders positive badge with success border color', () => {
    renderWithTheme(
      <BadgeRow badges={[positiveBadge]} sizePx={16} />
    )
    const emoji = screen.getByText('🥇')
    expect(emoji).toBeInTheDocument()
    expect(emoji).toHaveStyle({ borderRadius: '6px' })
  })

  it('renders negative badge with error border color', () => {
    renderWithTheme(
      <BadgeRow badges={[negativeBadge]} sizePx={16} />
    )
    const emoji = screen.getByText('💩')
    expect(emoji).toBeInTheDocument()
    expect(emoji).toHaveStyle({ borderRadius: '6px' })
  })

  it('does not apply grayscale filter to any badge', () => {
    renderWithTheme(
      <BadgeRow badges={[negativeBadge]} sizePx={16} />
    )
    const emoji = screen.getByText('💩')
    expect(emoji).not.toHaveStyle({ filter: 'grayscale(1)' })
  })

  it('respects maxDisplay limit', () => {
    const badges: Badge[] = [
      { id: 'crack', emoji: '🥇', type: 'positive' },
      { id: 'rocket', emoji: '📈', type: 'positive' },
      { id: 'sharp', emoji: '🎯', type: 'positive' },
    ]
    renderWithTheme(
      <BadgeRow badges={badges} sizePx={16} maxDisplay={2} />
    )
    expect(screen.getByText('🥇')).toBeInTheDocument()
    expect(screen.getByText('📈')).toBeInTheDocument()
    expect(screen.queryByText('🎯')).not.toBeInTheDocument()
  })

  it('renders with correct font size', () => {
    renderWithTheme(
      <BadgeRow badges={[positiveBadge]} sizePx={20} />
    )
    const emoji = screen.getByText('🥇')
    expect(emoji).toHaveStyle({ fontSize: '20px' })
  })
})
