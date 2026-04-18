import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import GroupSelector from '../group-selector'
import { renderWithTheme } from '@/__tests__/utils/test-utils'

// Mock next-intl - returns keys as-is for verification
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

    expect(screen.getByRole('tab', { name: /hub/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /matches/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /qualified/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /awards/i })).toBeInTheDocument()
  })

  it('hub tab is disabled when user is not provided', () => {
    renderWithTheme(<GroupSelector {...defaultProps} />)

    const hubTab = screen.getByRole('tab', { name: /hub/i })
    expect(hubTab).toHaveAttribute('aria-disabled', 'true')
  })

  it('hub tab is enabled when user is provided', () => {
    const mockUser = { id: 'user-1', email: 'test@example.com', name: 'Test' }
    renderWithTheme(<GroupSelector {...defaultProps} user={mockUser as any} />)

    const hubTab = screen.getByRole('tab', { name: /hub/i })
    expect(hubTab).not.toHaveAttribute('aria-disabled', 'true')
  })

  it('translates aria-label for accessibility', () => {
    const { container } = renderWithTheme(<GroupSelector {...defaultProps} />)

    const tabsElement = container.querySelector('[role="tablist"]')
    expect(tabsElement).toHaveAttribute('aria-label', 'ariaLabel')
  })

  it('hub tab links to tournament root, matches tab links to /games', () => {
    renderWithTheme(<GroupSelector {...defaultProps} />)

    const hubTab = screen.getByRole('tab', { name: /hub/i })
    const matchesTab = screen.getByRole('tab', { name: /matches/i })
    const qualifiedTab = screen.getByRole('tab', { name: /qualified/i })
    const awardsTab = screen.getByRole('tab', { name: /awards/i })

    expect(hubTab.closest('a')).toHaveAttribute('href', '/en/tournaments/test-tournament')
    expect(matchesTab.closest('a')).toHaveAttribute('href', '/en/tournaments/test-tournament/games')
    expect(qualifiedTab.closest('a')).toHaveAttribute('href', '/en/tournaments/test-tournament/qualified-teams')
    expect(awardsTab.closest('a')).toHaveAttribute('href', '/en/tournaments/test-tournament/awards')
  })
})
