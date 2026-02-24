import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, fireEvent, within } from '@testing-library/react'
import LanguageSwitcher from '../language-switcher'
import { renderWithTheme } from '@/__tests__/utils/test-utils'

// Create mock functions that will be hoisted
const { mockPush, mockUpdate, mockUpdateUserLocale, mockAuth } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockUpdate: vi.fn(),
  mockUpdateUserLocale: vi.fn(),
  mockAuth: vi.fn(),
}))

// Mock auth from root
vi.mock('../../../../auth', () => ({
  auth: mockAuth,
}))

// Mock next/headers for server action
const mockCookieSet = vi.fn()
vi.mock('next/headers', () => ({
  cookies: () => ({
    set: mockCookieSet,
    get: () => null,
  }),
}))

// Mock next-intl
vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string) => key,
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/en/dashboard',
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    toString: () => '',
  }),
}))

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  useSession: () => ({
    update: mockUpdate,
    status: 'authenticated',
    data: {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        preferred_locale: 'en',
      },
    },
  }),
}))

// Mock user-actions
vi.mock('../../actions/user-actions', () => ({
  updateUserLocale: mockUpdateUserLocale,
}))

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks()

    // Mock auth to return authenticated user (for server action)
    mockAuth.mockResolvedValue({
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        preferred_locale: 'en',
      },
    })

    // Ensure mocks resolve successfully
    mockUpdate.mockResolvedValue(undefined)
    mockUpdateUserLocale.mockResolvedValue(undefined)
  })

  describe('rendering', () => {
    it('renders language switcher with aria-label', () => {
      renderWithTheme(<LanguageSwitcher />)

      // Avatar uses aria-label (not button role)
      const switcher = screen.getByLabelText(/language.selectLanguage/i)
      expect(switcher).toBeInTheDocument()
    })

    it('uses common namespace for aria-label', () => {
      renderWithTheme(<LanguageSwitcher />)

      // Verify aria-label uses translation key
      const switcher = screen.getByLabelText('language.selectLanguage')
      expect(switcher).toHaveAttribute('aria-label', 'language.selectLanguage')
    })

    it('displays current locale flag', () => {
      renderWithTheme(<LanguageSwitcher />)

      // Current locale is 'en', should show US flag
      const switcher = screen.getByLabelText(/language.selectLanguage/i)
      expect(switcher).toHaveTextContent('🇺🇸')
    })
  })

  describe('language menu', () => {
    it('opens menu when avatar is clicked', async () => {
      renderWithTheme(<LanguageSwitcher />)

      // Open menu
      const switcher = screen.getByLabelText(/language.selectLanguage/i)
      fireEvent.click(switcher)

      // Wait for menu to be visible
      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument()
      })

      // Verify both language options are present
      const menu = screen.getByRole('menu')
      expect(within(menu).getByRole('menuitem', { name: /English/i })).toBeInTheDocument()
      expect(within(menu).getByRole('menuitem', { name: /Español/i })).toBeInTheDocument()
    })

    it('shows current language as selected', async () => {
      renderWithTheme(<LanguageSwitcher />)

      // Open menu
      const switcher = screen.getByLabelText(/language.selectLanguage/i)
      fireEvent.click(switcher)

      // Wait for menu to be visible
      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument()
      })

      // Current locale is 'en', so English should be selected
      const menu = screen.getByRole('menu')
      const englishOption = within(menu).getByRole('menuitem', { name: /English/i })
      expect(englishOption).toHaveClass('Mui-selected')
    })
  })

  describe('integration', () => {
    it('has required dependencies mocked correctly', () => {
      // Verify all mocks are set up
      expect(mockPush).toBeDefined()
      expect(mockUpdate).toBeDefined()
      expect(mockUpdateUserLocale).toBeDefined()
      expect(mockAuth).toBeDefined()

      // Verify component renders without errors
      renderWithTheme(<LanguageSwitcher />)
      expect(screen.getByLabelText(/language.selectLanguage/i)).toBeInTheDocument()
    })
  })
})
