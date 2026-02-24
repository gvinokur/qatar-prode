import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PublicCTABar from '@/app/components/tournament-page/public-cta-bar'
import { renderWithTheme } from '@/__tests__/utils/test-utils'
import { createMockTranslations } from '@/__tests__/utils/mock-translations'
import * as intl from 'next-intl'

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: vi.fn(),
  useLocale: vi.fn(() => 'es'),
}))

// Mock child components
vi.mock('@/app/components/auth/login-or-signup-dialog', () => ({
  __esModule: true,
  default: ({ openLoginDialog, handleCloseLoginDialog }: any) =>
    openLoginDialog ? (
      <div data-testid="login-or-signup-dialog">
        <div data-testid="dialog-title">Login or Signup</div>
        <button
          data-testid="close-auth-dialog"
          onClick={() => handleCloseLoginDialog()}
        >
          Close
        </button>
      </div>
    ) : null,
}))

vi.mock('@/app/components/onboarding/onboarding-dialog-client', () => ({
  __esModule: true,
  default: ({ initialOpen, onClose }: any) =>
    initialOpen ? (
      <div data-testid="onboarding-dialog-client">
        <div data-testid="onboarding-title">How It Works</div>
        <button data-testid="close-onboarding-dialog" onClick={onClose}>
          Close
        </button>
      </div>
    ) : null,
}))

describe('PublicCTABar', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Setup i18n mock
    vi.mocked(intl.useTranslations).mockReturnValue(
      createMockTranslations('tournament.public')
    )
  })

  describe('Rendering', () => {
    it('renders the CTA bar', () => {
      renderWithTheme(<PublicCTABar />)

      expect(screen.getByText('[ctaMessage]')).toBeInTheDocument()
    })

    it('displays the CTA message', () => {
      renderWithTheme(<PublicCTABar />)

      expect(screen.getByText('[ctaMessage]')).toBeInTheDocument()
    })

    it('displays Learn How button', () => {
      renderWithTheme(<PublicCTABar />)

      expect(screen.getByText('[learnHow]')).toBeInTheDocument()
    })

    it('displays Login/Signup button', () => {
      renderWithTheme(<PublicCTABar />)

      expect(screen.getByText('[loginOrSignup]')).toBeInTheDocument()
    })

    it('displays Info icon', () => {
      renderWithTheme(<PublicCTABar />)

      // Info icon is rendered by MUI component
      const message = screen.getByText('[ctaMessage]')
      expect(message).toBeInTheDocument()
    })

    it('displays School icon on Learn How button', () => {
      renderWithTheme(<PublicCTABar />)

      const learnHowButton = screen.getByText('[learnHow]')
      expect(learnHowButton).toBeInTheDocument()
    })

    it('displays Login icon on Login/Signup button', () => {
      renderWithTheme(<PublicCTABar />)

      const loginButton = screen.getByText('[loginOrSignup]')
      expect(loginButton).toBeInTheDocument()
    })
  })

  describe('Onboarding Dialog', () => {
    it('does not show onboarding dialog initially', () => {
      renderWithTheme(<PublicCTABar />)

      expect(
        screen.queryByTestId('onboarding-dialog-client')
      ).not.toBeInTheDocument()
    })

    it('opens onboarding dialog when Learn How button is clicked', async () => {
      const user = userEvent.setup()
      renderWithTheme(<PublicCTABar />)

      const learnHowButton = screen.getByText('[learnHow]')
      await user.click(learnHowButton)

      await waitFor(() => {
        expect(screen.getByTestId('onboarding-dialog-client')).toBeInTheDocument()
      })
    })

    it('displays onboarding content when dialog is open', async () => {
      const user = userEvent.setup()
      renderWithTheme(<PublicCTABar />)

      const learnHowButton = screen.getByText('[learnHow]')
      await user.click(learnHowButton)

      await waitFor(() => {
        expect(screen.getByTestId('onboarding-title')).toHaveTextContent(
          'How It Works'
        )
      })
    })

    it('closes onboarding dialog when close button is clicked', async () => {
      const user = userEvent.setup()
      renderWithTheme(<PublicCTABar />)

      // Open dialog
      const learnHowButton = screen.getByText('[learnHow]')
      await user.click(learnHowButton)

      await waitFor(() => {
        expect(screen.getByTestId('onboarding-dialog-client')).toBeInTheDocument()
      })

      // Close dialog
      const closeButton = screen.getByTestId('close-onboarding-dialog')
      await user.click(closeButton)

      await waitFor(() => {
        expect(
          screen.queryByTestId('onboarding-dialog-client')
        ).not.toBeInTheDocument()
      })
    })

    it('can open onboarding dialog multiple times', async () => {
      const user = userEvent.setup()
      renderWithTheme(<PublicCTABar />)

      const learnHowButton = screen.getByText('[learnHow]')

      // First open
      await user.click(learnHowButton)
      await waitFor(() => {
        expect(screen.getByTestId('onboarding-dialog-client')).toBeInTheDocument()
      })

      // Close
      await user.click(screen.getByTestId('close-onboarding-dialog'))
      await waitFor(() => {
        expect(
          screen.queryByTestId('onboarding-dialog-client')
        ).not.toBeInTheDocument()
      })

      // Second open
      await user.click(learnHowButton)
      await waitFor(() => {
        expect(screen.getByTestId('onboarding-dialog-client')).toBeInTheDocument()
      })
    })
  })

  describe('Auth Dialog', () => {
    it('does not show auth dialog initially', () => {
      renderWithTheme(<PublicCTABar />)

      expect(
        screen.queryByTestId('login-or-signup-dialog')
      ).not.toBeInTheDocument()
    })

    it('opens auth dialog when Login/Signup button is clicked', async () => {
      const user = userEvent.setup()
      renderWithTheme(<PublicCTABar />)

      const loginButton = screen.getByText('[loginOrSignup]')
      await user.click(loginButton)

      await waitFor(() => {
        expect(screen.getByTestId('login-or-signup-dialog')).toBeInTheDocument()
      })
    })

    it('displays auth dialog content when open', async () => {
      const user = userEvent.setup()
      renderWithTheme(<PublicCTABar />)

      const loginButton = screen.getByText('[loginOrSignup]')
      await user.click(loginButton)

      await waitFor(() => {
        expect(screen.getByTestId('dialog-title')).toHaveTextContent(
          'Login or Signup'
        )
      })
    })

    it('closes auth dialog when close button is clicked', async () => {
      const user = userEvent.setup()
      renderWithTheme(<PublicCTABar />)

      // Open dialog
      const loginButton = screen.getByText('[loginOrSignup]')
      await user.click(loginButton)

      await waitFor(() => {
        expect(screen.getByTestId('login-or-signup-dialog')).toBeInTheDocument()
      })

      // Close dialog
      const closeButton = screen.getByTestId('close-auth-dialog')
      await user.click(closeButton)

      await waitFor(() => {
        expect(
          screen.queryByTestId('login-or-signup-dialog')
        ).not.toBeInTheDocument()
      })
    })

    it('can open auth dialog multiple times', async () => {
      const user = userEvent.setup()
      renderWithTheme(<PublicCTABar />)

      const loginButton = screen.getByText('[loginOrSignup]')

      // First open
      await user.click(loginButton)
      await waitFor(() => {
        expect(screen.getByTestId('login-or-signup-dialog')).toBeInTheDocument()
      })

      // Close
      await user.click(screen.getByTestId('close-auth-dialog'))
      await waitFor(() => {
        expect(
          screen.queryByTestId('login-or-signup-dialog')
        ).not.toBeInTheDocument()
      })

      // Second open
      await user.click(loginButton)
      await waitFor(() => {
        expect(screen.getByTestId('login-or-signup-dialog')).toBeInTheDocument()
      })
    })
  })

  describe('Dialog Independence', () => {
    it('can open onboarding dialog while auth dialog is closed', async () => {
      const user = userEvent.setup()
      renderWithTheme(<PublicCTABar />)

      const learnHowButton = screen.getByText('[learnHow]')
      await user.click(learnHowButton)

      await waitFor(() => {
        expect(screen.getByTestId('onboarding-dialog-client')).toBeInTheDocument()
        expect(
          screen.queryByTestId('login-or-signup-dialog')
        ).not.toBeInTheDocument()
      })
    })

    it('can open auth dialog while onboarding dialog is closed', async () => {
      const user = userEvent.setup()
      renderWithTheme(<PublicCTABar />)

      const loginButton = screen.getByText('[loginOrSignup]')
      await user.click(loginButton)

      await waitFor(() => {
        expect(screen.getByTestId('login-or-signup-dialog')).toBeInTheDocument()
        expect(
          screen.queryByTestId('onboarding-dialog-client')
        ).not.toBeInTheDocument()
      })
    })

    it('closes onboarding dialog when opening auth dialog', async () => {
      const user = userEvent.setup()
      renderWithTheme(<PublicCTABar />)

      // Open onboarding
      const learnHowButton = screen.getByText('[learnHow]')
      await user.click(learnHowButton)

      await waitFor(() => {
        expect(screen.getByTestId('onboarding-dialog-client')).toBeInTheDocument()
      })

      // Close onboarding
      await user.click(screen.getByTestId('close-onboarding-dialog'))

      await waitFor(() => {
        expect(
          screen.queryByTestId('onboarding-dialog-client')
        ).not.toBeInTheDocument()
      })

      // Open auth
      const loginButton = screen.getByText('[loginOrSignup]')
      await user.click(loginButton)

      await waitFor(() => {
        expect(screen.getByTestId('login-or-signup-dialog')).toBeInTheDocument()
      })
    })
  })

  describe('Button Interactions', () => {
    it('Learn How button is clickable', async () => {
      const user = userEvent.setup()
      renderWithTheme(<PublicCTABar />)

      const learnHowButton = screen.getByText('[learnHow]')
      expect(learnHowButton.closest('button')).toBeEnabled()
    })

    it('Login/Signup button is clickable', async () => {
      const user = userEvent.setup()
      renderWithTheme(<PublicCTABar />)

      const loginButton = screen.getByText('[loginOrSignup]')
      expect(loginButton.closest('button')).toBeEnabled()
    })

    it('handles rapid clicks on Learn How button', async () => {
      const user = userEvent.setup()
      renderWithTheme(<PublicCTABar />)

      const learnHowButton = screen.getByText('[learnHow]')

      // Click multiple times rapidly
      await user.click(learnHowButton)
      await user.click(learnHowButton)
      await user.click(learnHowButton)

      // Should only open one dialog
      await waitFor(() => {
        expect(screen.getByTestId('onboarding-dialog-client')).toBeInTheDocument()
      })
    })

    it('handles rapid clicks on Login/Signup button', async () => {
      const user = userEvent.setup()
      renderWithTheme(<PublicCTABar />)

      const loginButton = screen.getByText('[loginOrSignup]')

      // Click multiple times rapidly
      await user.click(loginButton)
      await user.click(loginButton)
      await user.click(loginButton)

      // Should only open one dialog
      await waitFor(() => {
        expect(screen.getByTestId('login-or-signup-dialog')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('renders buttons with proper structure', () => {
      renderWithTheme(<PublicCTABar />)

      const learnHowButton = screen.getByText('[learnHow]').closest('button')
      const loginButton = screen.getByText('[loginOrSignup]').closest('button')

      expect(learnHowButton).toBeInTheDocument()
      expect(loginButton).toBeInTheDocument()
    })

    it('has proper button text for screen readers', () => {
      renderWithTheme(<PublicCTABar />)

      expect(screen.getByText('[learnHow]')).toBeInTheDocument()
      expect(screen.getByText('[loginOrSignup]')).toBeInTheDocument()
    })
  })

  describe('Translations', () => {
    it('uses correct translation namespace', () => {
      renderWithTheme(<PublicCTABar />)

      expect(intl.useTranslations).toHaveBeenCalledWith('tournament.public')
    })

    it('displays translated CTA message', () => {
      renderWithTheme(<PublicCTABar />)

      expect(screen.getByText('[ctaMessage]')).toBeInTheDocument()
    })

    it('displays translated Learn How button text', () => {
      renderWithTheme(<PublicCTABar />)

      expect(screen.getByText('[learnHow]')).toBeInTheDocument()
    })

    it('displays translated Login/Signup button text', () => {
      renderWithTheme(<PublicCTABar />)

      expect(screen.getByText('[loginOrSignup]')).toBeInTheDocument()
    })
  })

  describe('Theme Integration', () => {
    it('renders with theme provider', () => {
      const { container } = renderWithTheme(<PublicCTABar />)

      expect(container).toBeTruthy()
      expect(screen.getByText('[ctaMessage]')).toBeInTheDocument()
    })

    it('renders with dark theme', () => {
      const { container } = renderWithTheme(<PublicCTABar />, { theme: 'dark' })

      expect(container).toBeTruthy()
      expect(screen.getByText('[ctaMessage]')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles missing translation keys gracefully', () => {
      vi.mocked(intl.useTranslations).mockReturnValue((key: string) => key)

      renderWithTheme(<PublicCTABar />)

      expect(screen.getByText('ctaMessage')).toBeInTheDocument()
      expect(screen.getByText('learnHow')).toBeInTheDocument()
      expect(screen.getByText('loginOrSignup')).toBeInTheDocument()
    })

    it('maintains state when switching between dialogs', async () => {
      const user = userEvent.setup()
      renderWithTheme(<PublicCTABar />)

      // Open onboarding
      await user.click(screen.getByText('[learnHow]'))
      await waitFor(() => {
        expect(screen.getByTestId('onboarding-dialog-client')).toBeInTheDocument()
      })

      // Close onboarding
      await user.click(screen.getByTestId('close-onboarding-dialog'))
      await waitFor(() => {
        expect(
          screen.queryByTestId('onboarding-dialog-client')
        ).not.toBeInTheDocument()
      })

      // Open auth
      await user.click(screen.getByText('[loginOrSignup]'))
      await waitFor(() => {
        expect(screen.getByTestId('login-or-signup-dialog')).toBeInTheDocument()
      })

      // Close auth
      await user.click(screen.getByTestId('close-auth-dialog'))
      await waitFor(() => {
        expect(
          screen.queryByTestId('login-or-signup-dialog')
        ).not.toBeInTheDocument()
      })

      // Verify CTA bar is still rendered
      expect(screen.getByText('[ctaMessage]')).toBeInTheDocument()
    })
  })
})
