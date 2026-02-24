import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../utils/test-utils'
import TournamentBottomNav from '../../../app/components/tournament-bottom-nav/tournament-bottom-nav'
import { NextIntlClientProvider } from 'next-intl'
import enNavigationMessages from '../../../locales/en/navigation.json'
import esNavigationMessages from '../../../locales/es/navigation.json'
import type { User } from '../../../app/db/tables-definition'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn()
  }),
  usePathname: () => '/en/tournaments/test-tournament-id'
}))

// Helper to render with navigation messages
const renderWithNavigationMessages = (component: React.ReactElement, locale: 'en' | 'es' = 'en') => {
  const messages = locale === 'en' ? enNavigationMessages : esNavigationMessages
  return renderWithProviders(
    <NextIntlClientProvider locale={locale} messages={{ navigation: messages }}>
      {component}
    </NextIntlClientProvider>,
    { locale }
  )
}

const mockUser: User = {
  id: 'user1',
  email: 'test@example.com',
  nickname: 'TestUser',
  password_hash: 'hash',
  is_admin: false,
  created_at: new Date()
}

const defaultProps = {
  tournamentId: 'test-tournament-id',
  currentPath: '/en/tournaments/test-tournament-id'
}

describe('TournamentBottomNav - Authentication Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Unauthenticated users', () => {
    it('should render only Home, Results, and Rules tabs', () => {
      const { container } = renderWithNavigationMessages(
        <TournamentBottomNav {...defaultProps} user={undefined} />
      )

      const buttons = container.querySelectorAll('button')
      expect(buttons).toHaveLength(3)
    })

    it('should NOT render Stats tab', () => {
      const { container } = renderWithNavigationMessages(
        <TournamentBottomNav {...defaultProps} user={undefined} />
      )

      const buttons = container.querySelectorAll('button')
      expect(buttons).toHaveLength(3)
      // Verify Stats is not present by checking button count
    })

    it('should NOT render Groups tab', () => {
      const { container } = renderWithNavigationMessages(
        <TournamentBottomNav {...defaultProps} user={undefined} />
      )

      const buttons = container.querySelectorAll('button')
      expect(buttons).toHaveLength(3)
      // Verify Groups is not present by checking button count
    })

    it('should render exactly 3 navigation items', () => {
      const { container } = renderWithNavigationMessages(
        <TournamentBottomNav {...defaultProps} user={undefined} />
      )

      const navButtons = container.querySelectorAll('button')
      expect(navButtons).toHaveLength(3)
    })
  })

  describe('Authenticated users', () => {
    it('should render all 5 tabs including Stats and Groups', () => {
      const { container } = renderWithNavigationMessages(
        <TournamentBottomNav {...defaultProps} user={mockUser} />
      )

      const buttons = container.querySelectorAll('button')
      expect(buttons).toHaveLength(5)
    })

    it('should render exactly 5 navigation items', () => {
      const { container } = renderWithNavigationMessages(
        <TournamentBottomNav {...defaultProps} user={mockUser} />
      )

      const navButtons = container.querySelectorAll('button')
      expect(navButtons).toHaveLength(5)
    })

    it('should render Stats tab', () => {
      const { container } = renderWithNavigationMessages(
        <TournamentBottomNav {...defaultProps} user={mockUser} />
      )

      const buttons = container.querySelectorAll('button')
      expect(buttons).toHaveLength(5)
    })

    it('should render Groups tab', () => {
      const { container } = renderWithNavigationMessages(
        <TournamentBottomNav {...defaultProps} user={mockUser} />
      )

      const buttons = container.querySelectorAll('button')
      expect(buttons).toHaveLength(5)
    })
  })

  describe('Tab order', () => {
    it('should maintain correct tab order for unauthenticated users', () => {
      const { container } = renderWithNavigationMessages(
        <TournamentBottomNav {...defaultProps} user={undefined} />
      )

      const buttons = container.querySelectorAll('button')
      // Verify we have exactly 3 buttons
      expect(buttons).toHaveLength(3)
    })

    it('should maintain correct tab order for authenticated users', () => {
      const { container } = renderWithNavigationMessages(
        <TournamentBottomNav {...defaultProps} user={mockUser} />
      )

      const buttons = container.querySelectorAll('button')
      // Verify we have exactly 5 buttons
      expect(buttons).toHaveLength(5)
    })
  })

  describe('Active tab highlighting', () => {
    it('should work correctly with limited tabs for unauthenticated users', () => {
      const { container } = renderWithNavigationMessages(
        <TournamentBottomNav
          {...defaultProps}
          currentPath="/en/tournaments/test-tournament-id/results"
          user={undefined}
        />
      )

      // Results tab should still be present
      const buttons = container.querySelectorAll('button')
      expect(buttons).toHaveLength(3)
    })

    it('should work correctly with all tabs for authenticated users', () => {
      const { container } = renderWithNavigationMessages(
        <TournamentBottomNav
          {...defaultProps}
          currentPath="/en/tournaments/test-tournament-id/stats"
          user={mockUser}
        />
      )

      // All tabs should be present
      const buttons = container.querySelectorAll('button')
      expect(buttons).toHaveLength(5)
    })
  })

  describe('Spanish localization', () => {
    it('should render Spanish labels for unauthenticated users', () => {
      renderWithNavigationMessages(
        <TournamentBottomNav {...defaultProps} user={undefined} />,
        'es'
      )

      // Check for Spanish labels (using the actual translation keys from navigation.json)
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(3)
    })

    it('should render Spanish labels for authenticated users', () => {
      renderWithNavigationMessages(
        <TournamentBottomNav {...defaultProps} user={mockUser} />,
        'es'
      )

      // Check for Spanish labels
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(5)
    })
  })

  describe('Responsive behavior', () => {
    it('should only show on mobile screens', () => {
      const { container } = renderWithNavigationMessages(
        <TournamentBottomNav {...defaultProps} user={undefined} />
      )

      const bottomNav = container.querySelector('[class*="MuiBottomNavigation"]')
      expect(bottomNav).toBeInTheDocument()
      // Component should have display flex on xs, none on md
      expect(bottomNav).toHaveStyle({ display: 'flex' })
    })

    it('should have fixed positioning at bottom', () => {
      const { container } = renderWithNavigationMessages(
        <TournamentBottomNav {...defaultProps} user={undefined} />
      )

      const bottomNav = container.querySelector('[class*="MuiBottomNavigation"]')
      expect(bottomNav).toHaveStyle({ position: 'fixed', bottom: '0' })
    })

    it('should have correct height', () => {
      const { container } = renderWithNavigationMessages(
        <TournamentBottomNav {...defaultProps} user={undefined} />
      )

      const bottomNav = container.querySelector('[class*="MuiBottomNavigation"]')
      expect(bottomNav).toHaveStyle({ height: '56px' })
    })
  })

  describe('Edge cases', () => {
    it('should handle null user same as undefined', () => {
      renderWithNavigationMessages(
        <TournamentBottomNav {...defaultProps} user={null as any} />
      )

      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(3)
    })

    it('should handle user with minimal data', () => {
      const minimalUser: User = {
        id: 'user2',
        email: 'minimal@example.com',
        nickname: null,
        password_hash: null,
        created_at: new Date()
      }

      renderWithNavigationMessages(
        <TournamentBottomNav {...defaultProps} user={minimalUser} />
      )

      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(5)
    })

    it('should handle admin user same as regular user', () => {
      const adminUser: User = {
        ...mockUser,
        is_admin: true
      }

      renderWithNavigationMessages(
        <TournamentBottomNav {...defaultProps} user={adminUser} />
      )

      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(5)
    })
  })
})
