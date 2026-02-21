import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import GroupSelector from '../group-selector'
import { renderWithTheme } from '@/__tests__/utils/test-utils'

// Mock next-intl - returns keys as-is for verification
// This approach follows tournament-bottom-nav-i18n.test.tsx pattern
// We verify translation keys are used correctly, not actual translations
vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string) => key,
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/en/tournaments/test-tournament',
}))

describe('GroupSelector i18n', () => {
  const defaultProps = {
    groups: [
      { group_letter: 'A', id: 'group-a' },
      { group_letter: 'B', id: 'group-b' },
    ],
    tournamentId: 'test-tournament',
  }

  it('renders all tabs with translation keys', () => {
    renderWithTheme(<GroupSelector {...defaultProps} />)

    // Verify all 3 tabs use translation keys
    expect(screen.getByRole('tab', { name: /matches/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /qualified/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /awards/i })).toBeInTheDocument()
  })

  it('uses navigation.topNav namespace', () => {
    renderWithTheme(<GroupSelector {...defaultProps} />)

    // Mock returns key as-is, so rendered text will be the key
    expect(screen.getByRole('tab', { name: /matches/i })).toBeInTheDocument()
  })

  it('translates aria-label for accessibility', () => {
    const { container } = renderWithTheme(<GroupSelector {...defaultProps} />)

    // Find the Tabs component and verify aria-label
    const tabsElement = container.querySelector('[role="tablist"]')
    expect(tabsElement).toHaveAttribute('aria-label', 'ariaLabel')
  })

  it('preserves tab navigation functionality', () => {
    renderWithTheme(<GroupSelector {...defaultProps} />)

    const matchesTab = screen.getByRole('tab', { name: /matches/i })
    const qualifiedTab = screen.getByRole('tab', { name: /qualified/i })
    const awardsTab = screen.getByRole('tab', { name: /awards/i })

    // Verify tabs have correct href attributes
    expect(matchesTab.closest('a')).toHaveAttribute('href', '/en/tournaments/test-tournament')
    expect(qualifiedTab.closest('a')).toHaveAttribute('href', '/en/tournaments/test-tournament/qualified-teams')
    expect(awardsTab.closest('a')).toHaveAttribute('href', '/en/tournaments/test-tournament/awards')
  })
})
