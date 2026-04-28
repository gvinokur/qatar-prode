import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { UnifiedGamesPage } from '../../app/components/unified-games-page'

// Mock dependencies
vi.mock('../../app/actions/user-actions', () => ({
  getLoggedInUser: vi.fn()
}))

vi.mock('../../app/components/tournament-page/public-games-page', () => ({
  PublicGamesPage: ({ tournamentId }: { tournamentId: string }) => (
    <div data-testid="public-games-page">Public View: {tournamentId}</div>
  )
}))

vi.mock('../../app/components/unified-games-page-client', () => ({
  UnifiedGamesPageClient: () => (
    <div data-testid="authenticated-games-page">Authenticated View</div>
  )
}))

vi.mock('../../app/components/context-providers/guesses-context-provider', () => ({
  GuessesContextProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="guesses-context">{children}</div>
  )
}))

// Mock all data fetching functions
vi.mock('../../app/actions/tournament-actions', () => ({
  getTeamsMap: vi.fn().mockResolvedValue({}),
  getGamesClosingWithin48Hours: vi.fn().mockResolvedValue([])
}))

vi.mock('../../app/db/game-repository', () => ({
  getAllTournamentGames: vi.fn().mockResolvedValue([]),
  getTournamentGameCounts: vi.fn().mockResolvedValue({
    total: 0,
    predicted: 0,
    unpredicted: 0,
    past: 0,
    upcoming: 0
  })
}))

vi.mock('../../app/db/game-guess-repository', () => ({
  findGameGuessesByUserId: vi.fn().mockResolvedValue([]),
  getPredictionDashboardStats: vi.fn().mockResolvedValue({})
}))

vi.mock('../../app/db/tournament-repository', () => ({
  findTournamentById: vi.fn().mockResolvedValue({
    id: 'test-tournament',
    short_name: 'Test Tournament',
    long_name: 'Test Tournament Long Name',
    is_active: true,
    max_silver_games: 5,
    max_golden_games: 2
  })
}))

vi.mock('../../app/db/tournament-group-repository', () => ({
  findGroupsInTournament: vi.fn().mockResolvedValue([])
}))

vi.mock('../../app/db/tournament-playoff-repository', () => ({
  findPlayoffStagesWithGamesInTournament: vi.fn().mockResolvedValue([]),
  findPlayoffRoundsWithAvailabilityInfo: vi.fn().mockResolvedValue([]),
}))

vi.mock('../../app/db/tournament-prediction-completion-repository', () => ({
  getTournamentPredictionCompletion: vi.fn().mockResolvedValue(null)
}))

// Import the mocked module to access mock functions
import { getLoggedInUser } from '../../app/actions/user-actions'

const mockUser = {
  id: 'user123',
  email: 'test@example.com',
  nickname: 'TestUser',
  password_hash: 'hash',
  is_admin: false,
  created_at: new Date()
}

describe('UnifiedGamesPage - Authentication Routing Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Unauthenticated users', () => {
    it('should render PublicGamesPage when user is not authenticated', async () => {
      vi.mocked(getLoggedInUser).mockResolvedValue(null)

      render(await UnifiedGamesPage({ tournamentId: 'tournament-123' }))

      await waitFor(() => {
        expect(screen.getByTestId('public-games-page')).toBeInTheDocument()
      })
    })

    it('should pass tournament ID to PublicGamesPage', async () => {
      vi.mocked(getLoggedInUser).mockResolvedValue(null)

      render(await UnifiedGamesPage({ tournamentId: 'my-tournament' }))

      await waitFor(() => {
        expect(screen.getByText(/Public View: my-tournament/)).toBeInTheDocument()
      })
    })

    it('should NOT render authenticated view', async () => {
      vi.mocked(getLoggedInUser).mockResolvedValue(null)

      render(await UnifiedGamesPage({ tournamentId: 'tournament-123' }))

      await waitFor(() => {
        expect(screen.queryByTestId('authenticated-games-page')).not.toBeInTheDocument()
        expect(screen.queryByTestId('guesses-context')).not.toBeInTheDocument()
      })
    })

    it('should call getLoggedInUser to check authentication', async () => {
      vi.mocked(getLoggedInUser).mockResolvedValue(null)

      render(await UnifiedGamesPage({ tournamentId: 'tournament-123' }))

      expect(getLoggedInUser).toHaveBeenCalledTimes(1)
    })
  })

  describe('Authenticated users', () => {
    it('should render authenticated view when user is logged in', async () => {
      vi.mocked(getLoggedInUser).mockResolvedValue(mockUser)

      render(await UnifiedGamesPage({ tournamentId: 'tournament-123' }))

      await waitFor(() => {
        expect(screen.getByTestId('authenticated-games-page')).toBeInTheDocument()
      })
    })

    it('should wrap authenticated view in GuessesContextProvider', async () => {
      vi.mocked(getLoggedInUser).mockResolvedValue(mockUser)

      render(await UnifiedGamesPage({ tournamentId: 'tournament-123' }))

      await waitFor(() => {
        expect(screen.getByTestId('guesses-context')).toBeInTheDocument()
      })
    })

    it('should NOT render public view', async () => {
      vi.mocked(getLoggedInUser).mockResolvedValue(mockUser)

      render(await UnifiedGamesPage({ tournamentId: 'tournament-123' }))

      await waitFor(() => {
        expect(screen.queryByTestId('public-games-page')).not.toBeInTheDocument()
      })
    })

    it('should call getLoggedInUser to check authentication', async () => {
      vi.mocked(getLoggedInUser).mockResolvedValue(mockUser)

      render(await UnifiedGamesPage({ tournamentId: 'tournament-123' }))

      // Called by the page itself + once inside getPlayoffRoundsAvailability
      expect(getLoggedInUser).toHaveBeenCalled()
    })
  })

  describe('Authentication state transitions', () => {
    it('should switch from public to authenticated view when user logs in', async () => {
      // First render: unauthenticated
      vi.mocked(getLoggedInUser).mockResolvedValue(null)
      const { unmount } = render(await UnifiedGamesPage({ tournamentId: 'tournament-123' }))

      await waitFor(() => {
        expect(screen.getByTestId('public-games-page')).toBeInTheDocument()
      })

      unmount()

      // Second render: authenticated
      vi.mocked(getLoggedInUser).mockResolvedValue(mockUser)
      render(await UnifiedGamesPage({ tournamentId: 'tournament-123' }))

      await waitFor(() => {
        expect(screen.getByTestId('authenticated-games-page')).toBeInTheDocument()
        expect(screen.queryByTestId('public-games-page')).not.toBeInTheDocument()
      })
    })
  })

  describe('Edge cases', () => {
    it('should handle undefined user as unauthenticated', async () => {
      vi.mocked(getLoggedInUser).mockResolvedValue(undefined as any)

      render(await UnifiedGamesPage({ tournamentId: 'tournament-123' }))

      await waitFor(() => {
        expect(screen.getByTestId('public-games-page')).toBeInTheDocument()
      })
    })

    it('should handle user with minimal data as authenticated', async () => {
      const minimalUser = {
        id: 'user456',
        email: 'minimal@example.com',
        nickname: null,
        password_hash: null,
        created_at: new Date()
      }

      vi.mocked(getLoggedInUser).mockResolvedValue(minimalUser)

      render(await UnifiedGamesPage({ tournamentId: 'tournament-123' }))

      await waitFor(() => {
        expect(screen.getByTestId('authenticated-games-page')).toBeInTheDocument()
      })
    })

    it('should handle admin user same as regular user', async () => {
      const adminUser = {
        ...mockUser,
        is_admin: true
      }

      vi.mocked(getLoggedInUser).mockResolvedValue(adminUser)

      render(await UnifiedGamesPage({ tournamentId: 'tournament-123' }))

      await waitFor(() => {
        expect(screen.getByTestId('authenticated-games-page')).toBeInTheDocument()
      })
    })

    it('should handle different tournament IDs correctly', async () => {
      vi.mocked(getLoggedInUser).mockResolvedValue(null)

      const tournamentIds = ['tournament-1', 'tournament-2', 'special-tournament']

      for (const tournamentId of tournamentIds) {
        const { unmount } = render(await UnifiedGamesPage({ tournamentId }))

        await waitFor(() => {
          expect(screen.getByText(new RegExp(`Public View: ${tournamentId}`))).toBeInTheDocument()
        })

        unmount()
      }
    })
  })

  describe('Error handling', () => {
    it('should handle authentication check errors gracefully', async () => {
      vi.mocked(getLoggedInUser).mockRejectedValue(new Error('Auth service down'))

      await expect(async () => {
        render(await UnifiedGamesPage({ tournamentId: 'tournament-123' }))
      }).rejects.toThrow('Auth service down')
    })
  })

  describe('Performance', () => {
    it('should only call getLoggedInUser once per render', async () => {
      vi.mocked(getLoggedInUser).mockResolvedValue(mockUser)

      render(await UnifiedGamesPage({ tournamentId: 'tournament-123' }))

      await waitFor(() => {
        expect(screen.getByTestId('authenticated-games-page')).toBeInTheDocument()
      })

      // Called by the page itself + once inside getPlayoffRoundsAvailability
      expect(getLoggedInUser).toHaveBeenCalledTimes(2)
    })

    it('should not fetch user-specific data for unauthenticated users', async () => {
      vi.mocked(getLoggedInUser).mockResolvedValue(null)

      render(await UnifiedGamesPage({ tournamentId: 'tournament-123' }))

      await waitFor(() => {
        expect(screen.getByTestId('public-games-page')).toBeInTheDocument()
      })

      // Only getLoggedInUser should be called, not game guesses or other user-specific data
      expect(getLoggedInUser).toHaveBeenCalled()
    })
  })
})
