import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { renderWithTheme } from '@/__tests__/utils/test-utils'
import { testFactories } from '@/__tests__/db/test-factories'
import OnboardingDialogClient from '@/app/components/onboarding/onboarding-dialog-client'
import * as tournamentActions from '@/app/actions/tournament-actions'

// Mock tournament actions
vi.mock('@/app/actions/tournament-actions', () => ({
  getTournaments: vi.fn(),
}))

// Mock OnboardingDialog child component
vi.mock('@/app/components/onboarding/onboarding-dialog', () => ({
  default: ({ open, onClose, tournament }: any) => (
    <div data-testid="onboarding-dialog">
      <div data-testid="dialog-open">{open.toString()}</div>
      <div data-testid="tournament-id">{tournament?.id || 'no-tournament'}</div>
      <button onClick={onClose} data-testid="close-button">Close</button>
    </div>
  ),
}))

const mockGetTournaments = vi.mocked(tournamentActions.getTournaments)

describe('OnboardingDialogClient', () => {
  // Mock console methods
  const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

  beforeEach(() => {
    vi.clearAllMocks()
    consoleWarnSpy.mockClear()
    consoleErrorSpy.mockClear()
  })

  describe('Loading State', () => {
    it('renders nothing initially while loading', () => {
      // Make getTournaments never resolve to keep loading state
      mockGetTournaments.mockImplementation(() => new Promise(() => {}))

      const { container } = renderWithTheme(
        <OnboardingDialogClient initialOpen={true} />
      )

      // Component returns null during loading
      expect(container.firstChild).toBeNull()
    })

    it('shows nothing when loading tournaments', async () => {
      let resolvePromise: (value: any) => void
      const promise = new Promise((resolve) => {
        resolvePromise = resolve
      })
      mockGetTournaments.mockReturnValue(promise as any)

      renderWithTheme(<OnboardingDialogClient />)

      // While loading, nothing should be rendered
      expect(screen.queryByTestId('onboarding-dialog')).not.toBeInTheDocument()

      // Resolve the promise
      resolvePromise!([testFactories.tournament()])

      // After loading, dialog should appear
      await waitFor(() => {
        expect(screen.getByTestId('onboarding-dialog')).toBeInTheDocument()
      })
    })
  })

  describe('Tournament Data Loading', () => {
    it('loads tournament data on mount using useEffect', async () => {
      const mockTournament = testFactories.tournament({
        id: 'wc-2026',
        short_name: 'WC26',
        game_exact_score_points: 10,
        game_correct_outcome_points: 5,
        champion_points: 15,
        max_silver_games: 5,
        max_golden_games: 3,
      })

      mockGetTournaments.mockResolvedValue([mockTournament])

      renderWithTheme(<OnboardingDialogClient />)

      // Wait for tournament to load
      await waitFor(() => {
        expect(mockGetTournaments).toHaveBeenCalledTimes(1)
      })

      // Dialog should render with tournament data
      await waitFor(() => {
        expect(screen.getByTestId('tournament-id')).toHaveTextContent('wc-2026')
      })
    })

    it('passes tournament data to OnboardingDialog', async () => {
      const mockTournament = testFactories.tournament({
        id: 'euro-2024',
        short_name: 'EURO24',
        max_silver_games: 5,
        max_golden_games: 3,
      })

      mockGetTournaments.mockResolvedValue([mockTournament])

      renderWithTheme(<OnboardingDialogClient initialOpen={true} />)

      await waitFor(() => {
        expect(screen.getByTestId('tournament-id')).toHaveTextContent('euro-2024')
      })
    })

    it('handles tournament with boosts configured', async () => {
      const mockTournament = testFactories.tournament({
        id: 'tournament-with-boosts',
        max_silver_games: 5,
        max_golden_games: 3,
      })

      mockGetTournaments.mockResolvedValue([mockTournament])

      renderWithTheme(<OnboardingDialogClient />)

      await waitFor(() => {
        expect(screen.getByTestId('onboarding-dialog')).toBeInTheDocument()
      })

      // Verify console logging includes boost information
      await waitFor(() => {
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          '[OnboardingDialogClient] Active tournament:',
          expect.objectContaining({
            id: 'tournament-with-boosts',
            hasScoring: expect.objectContaining({
              silverBoosts: 5,
              goldenBoosts: 3,
            }),
          })
        )
      })
    })

    it('handles tournament without boosts', async () => {
      const mockTournament = testFactories.tournament({
        id: 'tournament-no-boosts',
        max_silver_games: 0,
        max_golden_games: 0,
      })

      mockGetTournaments.mockResolvedValue([mockTournament])

      renderWithTheme(<OnboardingDialogClient />)

      await waitFor(() => {
        expect(screen.getByTestId('onboarding-dialog')).toBeInTheDocument()
      })

      // Verify console logging shows zero boosts
      await waitFor(() => {
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          '[OnboardingDialogClient] Active tournament:',
          expect.objectContaining({
            hasScoring: expect.objectContaining({
              silverBoosts: 0,
              goldenBoosts: 0,
            }),
          })
        )
      })
    })

    it('logs tournament data for debugging', async () => {
      const mockTournament = testFactories.tournament({
        id: 'test-tournament',
        short_name: 'TEST',
        game_exact_score_points: 10,
        game_correct_outcome_points: 5,
        champion_points: 15,
        max_silver_games: 5,
        max_golden_games: 3,
      })

      mockGetTournaments.mockResolvedValue([mockTournament])

      renderWithTheme(<OnboardingDialogClient />)

      await waitFor(() => {
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          '[OnboardingDialogClient] Active tournament:',
          {
            id: 'test-tournament',
            name: 'TEST',
            hasScoring: {
              gameExact: 10,
              gameOutcome: 5,
              champion: 15,
              silverBoosts: 5,
              goldenBoosts: 3,
            },
          }
        )
      })
    })
  })

  describe('Error Handling', () => {
    it('handles tournament loading errors gracefully', async () => {
      const error = new Error('Failed to fetch tournaments')
      mockGetTournaments.mockRejectedValue(error)

      renderWithTheme(<OnboardingDialogClient />)

      // Wait for error to be logged
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          '[OnboardingDialogClient] Failed to load tournament:',
          error
        )
      })

      // Dialog should still render (with undefined tournament)
      await waitFor(() => {
        expect(screen.getByTestId('onboarding-dialog')).toBeInTheDocument()
      })

      expect(screen.getByTestId('tournament-id')).toHaveTextContent('no-tournament')
    })

    it('continues to render dialog when getTournaments fails', async () => {
      mockGetTournaments.mockRejectedValue(new Error('Network error'))

      renderWithTheme(<OnboardingDialogClient initialOpen={true} />)

      await waitFor(() => {
        expect(screen.getByTestId('onboarding-dialog')).toBeInTheDocument()
      })

      // Dialog should be open even without tournament data
      expect(screen.getByTestId('dialog-open')).toHaveTextContent('true')
    })
  })

  describe('Empty Tournament Data', () => {
    it('handles case when no tournaments exist (empty array)', async () => {
      mockGetTournaments.mockResolvedValue([])

      renderWithTheme(<OnboardingDialogClient />)

      await waitFor(() => {
        expect(screen.getByTestId('onboarding-dialog')).toBeInTheDocument()
      })

      // Should pass undefined tournament
      expect(screen.getByTestId('tournament-id')).toHaveTextContent('no-tournament')

      // Console should log undefined tournament
      await waitFor(() => {
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          '[OnboardingDialogClient] Active tournament:',
          expect.objectContaining({
            id: undefined,
            name: undefined,
          })
        )
      })
    })

    it('handles case when getTournaments returns undefined', async () => {
      mockGetTournaments.mockResolvedValue(undefined as any)

      renderWithTheme(<OnboardingDialogClient />)

      await waitFor(() => {
        expect(screen.getByTestId('onboarding-dialog')).toBeInTheDocument()
      })

      expect(screen.getByTestId('tournament-id')).toHaveTextContent('no-tournament')
    })

    it('handles case when first tournament is undefined', async () => {
      mockGetTournaments.mockResolvedValue([undefined as any])

      renderWithTheme(<OnboardingDialogClient />)

      await waitFor(() => {
        expect(screen.getByTestId('onboarding-dialog')).toBeInTheDocument()
      })

      expect(screen.getByTestId('tournament-id')).toHaveTextContent('no-tournament')
    })
  })

  describe('Dialog Open/Close Behavior', () => {
    it('opens dialog when initialOpen=true prop is set', async () => {
      const mockTournament = testFactories.tournament()
      mockGetTournaments.mockResolvedValue([mockTournament])

      renderWithTheme(<OnboardingDialogClient initialOpen={true} />)

      await waitFor(() => {
        expect(screen.getByTestId('dialog-open')).toHaveTextContent('true')
      })
    })

    it('opens dialog by default (initialOpen defaults to true)', async () => {
      const mockTournament = testFactories.tournament()
      mockGetTournaments.mockResolvedValue([mockTournament])

      renderWithTheme(<OnboardingDialogClient />)

      await waitFor(() => {
        expect(screen.getByTestId('dialog-open')).toHaveTextContent('true')
      })
    })

    it('does not open dialog when initialOpen=false', async () => {
      const mockTournament = testFactories.tournament()
      mockGetTournaments.mockResolvedValue([mockTournament])

      renderWithTheme(<OnboardingDialogClient initialOpen={false} />)

      await waitFor(() => {
        expect(screen.getByTestId('dialog-open')).toHaveTextContent('false')
      })
    })

    it('calls onClose callback when dialog is closed', async () => {
      const mockTournament = testFactories.tournament()
      mockGetTournaments.mockResolvedValue([mockTournament])
      const onCloseMock = vi.fn()

      renderWithTheme(
        <OnboardingDialogClient initialOpen={true} onClose={onCloseMock} />
      )

      // Wait for dialog to render
      await waitFor(() => {
        expect(screen.getByTestId('close-button')).toBeInTheDocument()
      })

      // Click close button
      screen.getByTestId('close-button').click()

      // onClose callback should be called
      expect(onCloseMock).toHaveBeenCalledTimes(1)

      // Dialog should be closed
      await waitFor(() => {
        expect(screen.getByTestId('dialog-open')).toHaveTextContent('false')
      })
    })

    it('works without onClose callback (optional)', async () => {
      const mockTournament = testFactories.tournament()
      mockGetTournaments.mockResolvedValue([mockTournament])

      renderWithTheme(<OnboardingDialogClient initialOpen={true} />)

      await waitFor(() => {
        expect(screen.getByTestId('close-button')).toBeInTheDocument()
      })

      // Should not throw when clicking close without onClose prop
      expect(() => {
        screen.getByTestId('close-button').click()
      }).not.toThrow()

      // Dialog should still close
      await waitFor(() => {
        expect(screen.getByTestId('dialog-open')).toHaveTextContent('false')
      })
    })

    it('updates internal open state independently when closed', async () => {
      const mockTournament = testFactories.tournament()
      mockGetTournaments.mockResolvedValue([mockTournament])

      renderWithTheme(<OnboardingDialogClient initialOpen={true} />)

      // Wait for dialog to open
      await waitFor(() => {
        expect(screen.getByTestId('dialog-open')).toHaveTextContent('true')
      })

      // Close the dialog
      screen.getByTestId('close-button').click()

      // Verify it's closed
      await waitFor(() => {
        expect(screen.getByTestId('dialog-open')).toHaveTextContent('false')
      })
    })
  })

  describe('Integration Tests', () => {
    it('complete flow: loads tournament, opens dialog, and closes', async () => {
      const mockTournament = testFactories.tournament({
        id: 'integration-test',
        short_name: 'INT',
      })
      mockGetTournaments.mockResolvedValue([mockTournament])
      const onCloseMock = vi.fn()

      renderWithTheme(
        <OnboardingDialogClient initialOpen={true} onClose={onCloseMock} />
      )

      // Initially loading (nothing rendered)
      expect(screen.queryByTestId('onboarding-dialog')).not.toBeInTheDocument()

      // Wait for tournament to load
      await waitFor(() => {
        expect(mockGetTournaments).toHaveBeenCalledTimes(1)
      })

      // Dialog should appear
      await waitFor(() => {
        expect(screen.getByTestId('onboarding-dialog')).toBeInTheDocument()
      })

      // Verify tournament data
      expect(screen.getByTestId('tournament-id')).toHaveTextContent('integration-test')
      expect(screen.getByTestId('dialog-open')).toHaveTextContent('true')

      // Close dialog
      screen.getByTestId('close-button').click()

      // Verify closed
      expect(onCloseMock).toHaveBeenCalledTimes(1)
      await waitFor(() => {
        expect(screen.getByTestId('dialog-open')).toHaveTextContent('false')
      })
    })

    it('handles multiple tournaments (uses first tournament)', async () => {
      const tournament1 = testFactories.tournament({
        id: 'tournament-1',
        short_name: 'T1',
      })
      const tournament2 = testFactories.tournament({
        id: 'tournament-2',
        short_name: 'T2',
      })

      mockGetTournaments.mockResolvedValue([tournament1, tournament2])

      renderWithTheme(<OnboardingDialogClient />)

      await waitFor(() => {
        expect(screen.getByTestId('tournament-id')).toHaveTextContent('tournament-1')
      })

      // Should log the first tournament
      await waitFor(() => {
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          '[OnboardingDialogClient] Active tournament:',
          expect.objectContaining({
            id: 'tournament-1',
          })
        )
      })
    })

    it('renders with theme provider from test utilities', async () => {
      const mockTournament = testFactories.tournament()
      mockGetTournaments.mockResolvedValue([mockTournament])

      // Using renderWithTheme ensures MUI theme context is available
      const { container } = renderWithTheme(
        <OnboardingDialogClient initialOpen={true} />
      )

      await waitFor(() => {
        expect(screen.getByTestId('onboarding-dialog')).toBeInTheDocument()
      })

      // Component should render without theme errors
      expect(container).toBeTruthy()
    })
  })

  describe('Console Logging', () => {
    it('logs tournament with null values correctly', async () => {
      const mockTournament = testFactories.tournament({
        id: 'partial-tournament',
        short_name: null as any,
        max_silver_games: null as any,
        max_golden_games: null as any,
      })

      mockGetTournaments.mockResolvedValue([mockTournament])

      renderWithTheme(<OnboardingDialogClient />)

      await waitFor(() => {
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          '[OnboardingDialogClient] Active tournament:',
          expect.objectContaining({
            id: 'partial-tournament',
            name: null,
            hasScoring: expect.objectContaining({
              silverBoosts: null,
              goldenBoosts: null,
            }),
          })
        )
      })
    })

    it('logs all scoring fields correctly', async () => {
      const mockTournament = testFactories.tournament({
        id: 'scoring-test',
        short_name: 'SC',
        game_exact_score_points: 100,
        game_correct_outcome_points: 50,
        champion_points: 200,
        max_silver_games: 10,
        max_golden_games: 5,
      })

      mockGetTournaments.mockResolvedValue([mockTournament])

      renderWithTheme(<OnboardingDialogClient />)

      await waitFor(() => {
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          '[OnboardingDialogClient] Active tournament:',
          {
            id: 'scoring-test',
            name: 'SC',
            hasScoring: {
              gameExact: 100,
              gameOutcome: 50,
              champion: 200,
              silverBoosts: 10,
              goldenBoosts: 5,
            },
          }
        )
      })
    })
  })
})
