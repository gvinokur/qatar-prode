import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import NotificationsSubscriptionPrompt from '../notifications-subscription-prompt'
import { renderWithTheme } from '@/__tests__/utils/test-utils'

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

// Mock next-auth
vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        id: 'test-user-id',
      },
    },
    status: 'authenticated',
  }),
}))

// Mock notification utils
vi.mock('../../utils/notifications-utils', () => ({
  checkExistingSubscription: vi.fn().mockResolvedValue(false),
  isNotificationSupported: vi.fn().mockReturnValue(true),
  subscribeToNotifications: vi.fn().mockResolvedValue(undefined),
}))

describe('NotificationsSubscriptionPrompt i18n', () => {
  beforeEach(() => {
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    }
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    })

    // Mock Notification API
    Object.defineProperty(window, 'Notification', {
      writable: true,
      value: {
        permission: 'default',
      },
    })
  })

  it('uses pwa namespace', async () => {
    renderWithTheme(<NotificationsSubscriptionPrompt canOpen={true} />)

    // Wait for component to render after async checks
    const titleElement = await screen.findByText(/notifications\.title/i)
    expect(titleElement).toBeInTheDocument()
  })

  it('renders all notification strings with translation keys', async () => {
    renderWithTheme(<NotificationsSubscriptionPrompt canOpen={true} />)

    // Verify all translation keys are rendered
    expect(await screen.findByText(/notifications\.title/i)).toBeInTheDocument()
    expect(screen.getByText(/notifications\.message/i)).toBeInTheDocument()
    expect(screen.getByText(/notifications\.neverAsk/i)).toBeInTheDocument()
    expect(screen.getByText(/notifications\.notNow/i)).toBeInTheDocument()
    expect(screen.getByText(/notifications\.activate/i)).toBeInTheDocument()
  })

  it('button actions work correctly with translated labels', async () => {
    renderWithTheme(<NotificationsSubscriptionPrompt canOpen={true} />)

    // Verify buttons are present with translation keys
    const neverAskButton = await screen.findByText(/notifications\.neverAsk/i)
    const notNowButton = screen.getByText(/notifications\.notNow/i)
    const activateButton = screen.getByText(/notifications\.activate/i)

    expect(neverAskButton).toBeInTheDocument()
    expect(notNowButton).toBeInTheDocument()
    expect(activateButton).toBeInTheDocument()
  })
})
