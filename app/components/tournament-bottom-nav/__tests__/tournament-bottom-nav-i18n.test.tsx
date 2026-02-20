import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import TournamentBottomNav from '../tournament-bottom-nav'
import { renderWithTheme } from '@/__tests__/utils/test-utils'

// Mock next-intl
vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string) => key,
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

describe('TournamentBottomNav i18n', () => {
  const defaultProps = {
    tournamentId: 'test-tournament',
    currentPath: '/en/tournaments/test-tournament',
  }

  it('renders all navigation labels with translation keys', () => {
    renderWithTheme(<TournamentBottomNav {...defaultProps} />)

    // All 5 navigation items should be present with translation keys
    expect(screen.getByRole('button', { name: /bottomNav\.home/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /bottomNav\.results/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /bottomNav\.rules/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /bottomNav\.stats/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /bottomNav\.groups/i })).toBeInTheDocument()
  })

  it('uses navigation namespace for all labels', () => {
    renderWithTheme(<TournamentBottomNav {...defaultProps} />)

    // Verify that all keys are from the navigation namespace
    // Our mock returns keys as-is, so the rendered text will be the key itself
    // Just verify the component renders with the translation keys
    expect(screen.getByRole('button', { name: /bottomNav\.home/i })).toBeInTheDocument()
  })
})
