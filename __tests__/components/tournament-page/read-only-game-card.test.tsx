import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '@mui/material/styles'
import { NextIntlClientProvider } from 'next-intl'
import { createTestTheme } from '@/__tests__/utils/test-theme'
import { setTestLocale } from '@/vitest.setup'
import ReadOnlyGameCard from '@/app/components/tournament-page/read-only-game-card'
import { Theme } from '@/app/db/tables-definition'
import esTournamentMessages from '@/locales/es/tournament.json'
import enTournamentMessages from '@/locales/en/tournament.json'

// Mock the child components
vi.mock('@/app/components/compact-game-view-card', () => ({
  default: ({
    gameNumber,
    homeTeamNameOrDescription,
    awayTeamNameOrDescription,
    homeScore,
    awayScore,
    location,
    disabled,
    onEditClick
  }: any) => (
    <div data-testid="compact-game-view-card">
      <div data-testid="game-number">{gameNumber}</div>
      <div data-testid="home-team">{homeTeamNameOrDescription}</div>
      <div data-testid="away-team">{awayTeamNameOrDescription}</div>
      {homeScore !== undefined && <div data-testid="home-score">{homeScore}</div>}
      {awayScore !== undefined && <div data-testid="away-score">{awayScore}</div>}
      <div data-testid="location">{location}</div>
      <div data-testid="disabled">{disabled ? 'true' : 'false'}</div>
      <button onClick={() => onEditClick?.(gameNumber)}>Edit</button>
    </div>
  )
}))

vi.mock('@/app/components/auth/login-or-signup-dialog', () => ({
  default: ({ openLoginDialog, handleCloseLoginDialog }: any) => (
    openLoginDialog ? (
      <div data-testid="auth-dialog">
        <button onClick={() => handleCloseLoginDialog()}>Close Dialog</button>
      </div>
    ) : null
  )
}))

// Helper function to render with proper i18n setup
const renderWithI18n = (component: React.ReactElement, locale: 'es' | 'en' = 'es') => {
  // Set the global test locale for the mocked useTranslations hook
  setTestLocale(locale)

  const theme = createTestTheme('light')
  const messages = locale === 'es'
    ? { tournament: esTournamentMessages }
    : { tournament: enTournamentMessages }

  return render(
    <ThemeProvider theme={theme}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        {component}
      </NextIntlClientProvider>
    </ThemeProvider>
  )
}

describe('ReadOnlyGameCard', () => {
  const mockHomeTheme: Theme = {
    id: 1,
    primary_color_hex: '#FF0000',
    secondary_color_hex: '#FFFFFF',
    logo_url: '/home-logo.png'
  }

  const mockAwayTheme: Theme = {
    id: 2,
    primary_color_hex: '#0000FF',
    secondary_color_hex: '#FFFFFF',
    logo_url: '/away-logo.png'
  }

  const defaultProps = {
    gameNumber: 1,
    gameDate: new Date('2024-11-15T18:00:00Z'),
    location: 'Stadium Test',
    gameTimezone: 'America/Argentina/Buenos_Aires',
    homeTeamNameOrDescription: 'Home Team',
    homeTeamShortNameOrDescription: 'HOME',
    homeTeamTheme: mockHomeTheme,
    awayTeamNameOrDescription: 'Away Team',
    awayTeamShortNameOrDescription: 'AWAY',
    awayTeamTheme: mockAwayTheme,
    isPlayoffGame: false,
    groupOrPlayoffText: 'Group A',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset to Spanish locale before each test
    setTestLocale('es')
  })

  describe('Component Rendering', () => {
    it('renders game card with CompactGameViewCard', () => {
      renderWithI18n(
        <ReadOnlyGameCard {...defaultProps} />,
        'es'
      )

      expect(screen.getByTestId('compact-game-view-card')).toBeInTheDocument()
      expect(screen.getByTestId('game-number')).toHaveTextContent('1')
      expect(screen.getByTestId('home-team')).toHaveTextContent('Home Team')
      expect(screen.getByTestId('away-team')).toHaveTextContent('Away Team')
      expect(screen.getByTestId('location')).toHaveTextContent('Stadium Test')
    })

    it('renders with team scores when provided', () => {
      renderWithI18n(
        <ReadOnlyGameCard
          {...defaultProps}
          homeScore={2}
          awayScore={1}
        />,
        'es'
      )

      expect(screen.getByTestId('home-score')).toHaveTextContent('2')
      expect(screen.getByTestId('away-score')).toHaveTextContent('1')
    })

    it('renders as disabled card', () => {
      renderWithI18n(
        <ReadOnlyGameCard {...defaultProps} />,
        'es'
      )

      expect(screen.getByTestId('disabled')).toHaveTextContent('true')
    })

    it('renders playoff game information', () => {
      renderWithI18n(
        <ReadOnlyGameCard
          {...defaultProps}
          isPlayoffGame={true}
          groupOrPlayoffText="Quarterfinal"
        />,
        'es'
      )

      expect(screen.getByTestId('compact-game-view-card')).toBeInTheDocument()
    })

    it('renders without team themes', () => {
      renderWithI18n(
        <ReadOnlyGameCard
          {...defaultProps}
          homeTeamTheme={null}
          awayTeamTheme={null}
        />,
        'es'
      )

      expect(screen.getByTestId('compact-game-view-card')).toBeInTheDocument()
    })

    it('renders without short team names', () => {
      renderWithI18n(
        <ReadOnlyGameCard
          {...defaultProps}
          homeTeamShortNameOrDescription={undefined}
          awayTeamShortNameOrDescription={undefined}
        />,
        'es'
      )

      expect(screen.getByTestId('home-team')).toHaveTextContent('Home Team')
      expect(screen.getByTestId('away-team')).toHaveTextContent('Away Team')
    })

    it('renders without timezone', () => {
      renderWithI18n(
        <ReadOnlyGameCard
          {...defaultProps}
          gameTimezone={undefined}
        />,
        'es'
      )

      expect(screen.getByTestId('compact-game-view-card')).toBeInTheDocument()
    })
  })

  describe('CTA Overlay', () => {
    it('shows CTA overlay when showCtaOverlay=true (Spanish)', () => {
      renderWithI18n(
        <ReadOnlyGameCard
          {...defaultProps}
          showCtaOverlay={true}
        />,
        'es'
      )

      // Check that the CTA message is displayed (Spanish)
      expect(screen.getByText('Inicia sesión o regístrate para predecir')).toBeInTheDocument()

      // Check that the button is displayed
      expect(screen.getByRole('button', { name: /Iniciar Sesión o Registrarse/i })).toBeInTheDocument()

      // Verify the compact card is still rendered but overlay is visible
      expect(screen.getByTestId('compact-game-view-card')).toBeInTheDocument()
    })

    it('shows CTA overlay when showCtaOverlay=true (English)', () => {
      renderWithI18n(
        <ReadOnlyGameCard
          {...defaultProps}
          showCtaOverlay={true}
        />,
        'en'
      )

      // Check that the CTA message is displayed (English)
      expect(screen.getByText('Login or sign up to predict')).toBeInTheDocument()

      // Check that the button is displayed
      expect(screen.getByRole('button', { name: /Login or Sign Up/i })).toBeInTheDocument()
    })

    it('hides CTA overlay when showCtaOverlay=false', () => {
      renderWithI18n(
        <ReadOnlyGameCard
          {...defaultProps}
          showCtaOverlay={false}
        />,
        'es'
      )

      // CTA message should not be visible
      expect(screen.queryByText('Inicia sesión o regístrate para predecir')).not.toBeInTheDocument()

      // Button should not be visible
      expect(screen.queryByRole('button', { name: /Iniciar Sesión o Registrarse/i })).not.toBeInTheDocument()

      // Compact card should still be visible
      expect(screen.getByTestId('compact-game-view-card')).toBeInTheDocument()
    })

    it('hides CTA overlay by default when showCtaOverlay is not provided', () => {
      renderWithI18n(
        <ReadOnlyGameCard {...defaultProps} />,
        'es'
      )

      expect(screen.queryByText('Inicia sesión o regístrate para predecir')).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Iniciar Sesión o Registrarse/i })).not.toBeInTheDocument()
    })
  })

  describe('Auth Dialog Interactions', () => {
    it('opens auth dialog when CTA button is clicked', async () => {
      const user = userEvent.setup()

      renderWithI18n(
        <ReadOnlyGameCard
          {...defaultProps}
          showCtaOverlay={true}
        />,
        'es'
      )

      // Initially, auth dialog should not be visible
      expect(screen.queryByTestId('auth-dialog')).not.toBeInTheDocument()

      // Click the CTA button
      const ctaButton = screen.getByRole('button', { name: /Iniciar Sesión o Registrarse/i })
      await user.click(ctaButton)

      // Auth dialog should now be visible
      await waitFor(() => {
        expect(screen.getByTestId('auth-dialog')).toBeInTheDocument()
      })
    })

    it('closes auth dialog when close handler is called', async () => {
      const user = userEvent.setup()

      renderWithI18n(
        <ReadOnlyGameCard
          {...defaultProps}
          showCtaOverlay={true}
        />,
        'es'
      )

      // Open the dialog
      const ctaButton = screen.getByRole('button', { name: /Iniciar Sesión o Registrarse/i })
      await user.click(ctaButton)

      // Dialog should be open
      await waitFor(() => {
        expect(screen.getByTestId('auth-dialog')).toBeInTheDocument()
      })

      // Close the dialog
      const closeButton = screen.getByRole('button', { name: /Close Dialog/i })
      await user.click(closeButton)

      // Dialog should be closed
      await waitFor(() => {
        expect(screen.queryByTestId('auth-dialog')).not.toBeInTheDocument()
      })
    })

    it('can open and close dialog multiple times', async () => {
      const user = userEvent.setup()

      renderWithI18n(
        <ReadOnlyGameCard
          {...defaultProps}
          showCtaOverlay={true}
        />,
        'es'
      )

      const ctaButton = screen.getByRole('button', { name: /Iniciar Sesión o Registrarse/i })

      // First open
      await user.click(ctaButton)
      await waitFor(() => {
        expect(screen.getByTestId('auth-dialog')).toBeInTheDocument()
      })

      // First close
      let closeButton = screen.getByRole('button', { name: /Close Dialog/i })
      await user.click(closeButton)
      await waitFor(() => {
        expect(screen.queryByTestId('auth-dialog')).not.toBeInTheDocument()
      })

      // Second open
      await user.click(ctaButton)
      await waitFor(() => {
        expect(screen.getByTestId('auth-dialog')).toBeInTheDocument()
      })

      // Second close
      closeButton = screen.getByRole('button', { name: /Close Dialog/i })
      await user.click(closeButton)
      await waitFor(() => {
        expect(screen.queryByTestId('auth-dialog')).not.toBeInTheDocument()
      })
    })

    it('does not show auth dialog when CTA overlay is hidden', async () => {
      renderWithI18n(
        <ReadOnlyGameCard
          {...defaultProps}
          showCtaOverlay={false}
        />,
        'es'
      )

      // Auth dialog should not be present
      expect(screen.queryByTestId('auth-dialog')).not.toBeInTheDocument()

      // CTA button should not be present
      expect(screen.queryByRole('button', { name: /Iniciar Sesión o Registrarse/i })).not.toBeInTheDocument()
    })
  })

  describe('Edit Click Handler', () => {
    it('handles edit click without errors (no-op)', async () => {
      const user = userEvent.setup()

      renderWithI18n(
        <ReadOnlyGameCard {...defaultProps} />,
        'es'
      )

      // The edit button in the mocked CompactGameViewCard
      const editButton = screen.getByRole('button', { name: /Edit/i })

      // Should not throw error when clicked (it's a no-op)
      await expect(user.click(editButton)).resolves.not.toThrow()
    })
  })

  describe('Props Propagation to CompactGameViewCard', () => {
    it('passes all required props correctly', () => {
      renderWithI18n(
        <ReadOnlyGameCard
          {...defaultProps}
          homeScore={3}
          awayScore={2}
        />,
        'es'
      )

      const card = screen.getByTestId('compact-game-view-card')
      expect(card).toBeInTheDocument()

      // Verify game details are passed
      expect(screen.getByTestId('game-number')).toHaveTextContent('1')
      expect(screen.getByTestId('home-team')).toHaveTextContent('Home Team')
      expect(screen.getByTestId('away-team')).toHaveTextContent('Away Team')
      expect(screen.getByTestId('home-score')).toHaveTextContent('3')
      expect(screen.getByTestId('away-score')).toHaveTextContent('2')
      expect(screen.getByTestId('location')).toHaveTextContent('Stadium Test')
      expect(screen.getByTestId('disabled')).toHaveTextContent('true')
    })

    it('passes isGameFixture=true and isGameGuess=false', () => {
      renderWithI18n(
        <ReadOnlyGameCard {...defaultProps} />,
        'es'
      )

      // The component should always render in fixture mode (read-only)
      expect(screen.getByTestId('compact-game-view-card')).toBeInTheDocument()
      expect(screen.getByTestId('disabled')).toHaveTextContent('true')
    })
  })

  describe('Accessibility', () => {
    it('CTA button has login icon', () => {
      renderWithI18n(
        <ReadOnlyGameCard
          {...defaultProps}
          showCtaOverlay={true}
        />,
        'es'
      )

      const button = screen.getByRole('button', { name: /Iniciar Sesión o Registrarse/i })
      expect(button).toBeInTheDocument()
    })

    it('CTA message is readable', () => {
      renderWithI18n(
        <ReadOnlyGameCard
          {...defaultProps}
          showCtaOverlay={true}
        />,
        'es'
      )

      const message = screen.getByText('Inicia sesión o regístrate para predecir')
      expect(message).toBeVisible()
    })
  })

  describe('Dark Theme', () => {
    it('renders correctly with dark theme', () => {
      renderWithI18n(
        <ReadOnlyGameCard
          {...defaultProps}
          showCtaOverlay={true}
        />,
        'es'
      )

      expect(screen.getByTestId('compact-game-view-card')).toBeInTheDocument()
      expect(screen.getByText('Inicia sesión o regístrate para predecir')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Iniciar Sesión o Registrarse/i })).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles missing optional props gracefully', () => {
      const minimalProps = {
        gameNumber: 1,
        gameDate: new Date('2024-11-15T18:00:00Z'),
        location: 'Test Stadium',
        homeTeamNameOrDescription: 'Team A',
        awayTeamNameOrDescription: 'Team B',
        isPlayoffGame: false,
      }

      renderWithI18n(
        <ReadOnlyGameCard {...minimalProps} />,
        'es'
      )

      expect(screen.getByTestId('compact-game-view-card')).toBeInTheDocument()
      expect(screen.getByTestId('home-team')).toHaveTextContent('Team A')
      expect(screen.getByTestId('away-team')).toHaveTextContent('Team B')
    })

    it('handles empty groupOrPlayoffText', () => {
      renderWithI18n(
        <ReadOnlyGameCard
          {...defaultProps}
          groupOrPlayoffText=""
        />,
        'es'
      )

      expect(screen.getByTestId('compact-game-view-card')).toBeInTheDocument()
    })

    it('handles zero scores', () => {
      renderWithI18n(
        <ReadOnlyGameCard
          {...defaultProps}
          homeScore={0}
          awayScore={0}
        />,
        'es'
      )

      expect(screen.getByTestId('home-score')).toHaveTextContent('0')
      expect(screen.getByTestId('away-score')).toHaveTextContent('0')
    })

    it('handles high score values', () => {
      renderWithI18n(
        <ReadOnlyGameCard
          {...defaultProps}
          homeScore={10}
          awayScore={8}
        />,
        'es'
      )

      expect(screen.getByTestId('home-score')).toHaveTextContent('10')
      expect(screen.getByTestId('away-score')).toHaveTextContent('8')
    })
  })

  describe('State Management', () => {
    it('maintains dialog state independently from overlay state', async () => {
      const user = userEvent.setup()
      const theme = createTestTheme('light')
      const messages = { tournament: esTournamentMessages }

      const { rerender } = render(
        <ThemeProvider theme={theme}>
          <NextIntlClientProvider locale="es" messages={messages}>
            <ReadOnlyGameCard
              {...defaultProps}
              showCtaOverlay={true}
            />
          </NextIntlClientProvider>
        </ThemeProvider>
      )

      // Open dialog
      const ctaButton = screen.getByRole('button', { name: /Iniciar Sesión o Registrarse/i })
      await user.click(ctaButton)

      await waitFor(() => {
        expect(screen.getByTestId('auth-dialog')).toBeInTheDocument()
      })

      // Re-render without CTA overlay - dialog should remain open
      rerender(
        <ThemeProvider theme={theme}>
          <NextIntlClientProvider locale="es" messages={messages}>
            <ReadOnlyGameCard
              {...defaultProps}
              showCtaOverlay={false}
            />
          </NextIntlClientProvider>
        </ThemeProvider>
      )

      // Dialog should still be open even though overlay is hidden
      expect(screen.getByTestId('auth-dialog')).toBeInTheDocument()
      expect(screen.queryByText('Inicia sesión o regístrate para predecir')).not.toBeInTheDocument()
    })
  })
})
