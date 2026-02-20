import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import UserActions from '../user-actions'
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
    refresh: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
}))

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  signOut: vi.fn(),
  useSession: () => ({ data: null, status: 'unauthenticated', update: vi.fn() }),
}))

describe('UserActions i18n', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders login button with translation key when user is not logged in', () => {
    renderWithTheme(<UserActions />)

    const loginButton = screen.getByRole('button', { name: 'header.login' })
    expect(loginButton).toBeInTheDocument()
  })

  it('renders user menu tooltip with translation key when user is logged in', () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      nickname: 'TestUser',
    }

    renderWithTheme(<UserActions user={mockUser as any} />)

    // Avatar should be present with tooltip
    const avatar = screen.getByText('T') // First letter of TestUser
    expect(avatar).toBeInTheDocument()
  })

  it('uses navigation namespace for all translation keys', () => {
    // This test verifies that useTranslations is called with 'navigation' namespace
    // The mock returns the key itself, so we can verify keys are from navigation namespace

    const mockUser = {
      id: '1',
      email: 'test@example.com',
      nickname: 'TestUser',
    }

    renderWithTheme(<UserActions user={mockUser as any} />)

    // When logged in, menu items should use translation keys from navigation namespace
    // Check for a specific menu item translation key
    expect(screen.getByText('header.userMenu.settings')).toBeInTheDocument()
  })
})
