import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import InstallPwa from '../Install-pwa'
import { renderWithTheme } from '@/__tests__/utils/test-utils'

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

// Mock NotificationsSubscriptionPrompt
vi.mock('../notifications-subscription-prompt', () => ({
  default: () => null,
}))

describe('InstallPwa i18n', () => {
  beforeEach(() => {
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    }
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    })

    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
  })

  it('uses pwa namespace', () => {
    // Mock iOS device
    Object.defineProperty(window.navigator, 'userAgent', {
      writable: true,
      value: 'iPhone',
    })

    renderWithTheme(<InstallPwa />)

    // Verify title translation key is used
    expect(screen.getByText(/install\.title/i)).toBeInTheDocument()
  })

  it('renders iOS-specific strings when on iOS device', () => {
    // Mock iOS device
    Object.defineProperty(window.navigator, 'userAgent', {
      writable: true,
      value: 'iPhone',
    })

    renderWithTheme(<InstallPwa />)

    // Verify iOS heading translation key
    expect(screen.getByText(/install\.ios\.heading/i)).toBeInTheDocument()

    // Verify iOS guide toggle button
    expect(screen.getByText(/install\.ios\.showGuide/i)).toBeInTheDocument()
  })

  it('toggle guide shows/hides correctly with translated button text', () => {
    // Mock iOS device
    Object.defineProperty(window.navigator, 'userAgent', {
      writable: true,
      value: 'iPhone',
    })

    renderWithTheme(<InstallPwa />)

    const toggleButton = screen.getByText(/install\.ios\.showGuide/i)
    expect(toggleButton).toBeInTheDocument()

    // Click to expand guide
    fireEvent.click(toggleButton)

    // Now should show hideGuide text
    expect(screen.getByText(/install\.ios\.hideGuide/i)).toBeInTheDocument()

    // Verify iOS instruction strings are visible
    expect(screen.getByText(/install\.ios\.instructions\.title/i)).toBeInTheDocument()
    expect(screen.getByText(/install\.ios\.instructions\.step1/i)).toBeInTheDocument()
    expect(screen.getByText(/install\.ios\.instructions\.step2/i)).toBeInTheDocument()
    expect(screen.getByText(/install\.ios\.instructions\.step3/i)).toBeInTheDocument()
  })
})
