import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TournamentBottomNav from '../tournament-bottom-nav'
import { renderWithTheme } from '@/__tests__/utils/test-utils'
import type { User } from '@/app/db/tables-definition'

const mockPush = vi.fn()

// Mock next-intl
vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string) => key,
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

const mockUser: User = {
  id: 'user1',
  email: 'test@example.com',
  nickname: 'TestUser',
  password_hash: 'hash',
  is_admin: false,
  created_at: new Date()
}

describe('TournamentBottomNav i18n', () => {
  const defaultProps = {
    tournamentId: 'test-tournament',
    currentPath: '/en/tournaments/test-tournament',
    user: mockUser
  }

  it('renders all navigation labels with translation keys', () => {
    renderWithTheme(<TournamentBottomNav {...defaultProps} />)

    expect(screen.getByRole('button', { name: /bottomNav\.home/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /bottomNav\.results/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /bottomNav\.rules/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /bottomNav\.stats/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /bottomNav\.groups/i })).toBeInTheDocument()
  })

  it('home button navigates to tournament root (no /hub suffix)', async () => {
    const user = userEvent.setup()
    renderWithTheme(<TournamentBottomNav {...defaultProps} />)

    const homeButton = screen.getByRole('button', { name: /bottomNav\.home/i })
    await user.click(homeButton)

    expect(mockPush).toHaveBeenCalledWith('/en/tournaments/test-tournament')
    expect(mockPush).not.toHaveBeenCalledWith(expect.stringContaining('/hub'))
  })

  it('uses navigation namespace for all labels', () => {
    renderWithTheme(<TournamentBottomNav {...defaultProps} />)

    expect(screen.getByRole('button', { name: /bottomNav\.home/i })).toBeInTheDocument()
  })
})
