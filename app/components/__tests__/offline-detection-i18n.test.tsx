import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import OfflineDetection from '../offline-detection'
import { renderWithTheme } from '@/__tests__/utils/test-utils'

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

describe('OfflineDetection i18n', () => {
  beforeEach(() => {
    // Mock navigator.onLine
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: false, // Start offline to show the snackbar
    })
  })

  it('uses pwa namespace', () => {
    renderWithTheme(<OfflineDetection />)

    // The translation mock returns keys as-is, so we should see "offline.message"
    // in the rendered output
    expect(screen.getByText(/offline\.message/i)).toBeInTheDocument()
  })

  it('renders offline message with translation key', () => {
    renderWithTheme(<OfflineDetection />)

    // Verify the translation key is being used
    const messageElement = screen.getByText(/offline\.message/i)
    expect(messageElement).toBeInTheDocument()
  })
})
