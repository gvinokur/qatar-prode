import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { renderWithTheme } from '@/__tests__/utils/test-utils'
import LeaderboardView from '@/app/components/leaderboard/LeaderboardView'
import * as MUI from '@mui/material'

// Mock useMediaQuery
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material')
  return {
    ...actual,
    useMediaQuery: vi.fn()
  }
})

const mockScores = [
  {
    userId: 'user-1',
    userName: 'Alice',
    totalPoints: 1200,
    groupStagePoints: 800,
    knockoutPoints: 400,
    boostsUsed: 4,
    correctPredictions: 45,
    playedGames: 50
  },
  {
    userId: 'user-2',
    userName: 'Bob',
    totalPoints: 1000,
    groupStagePoints: 700,
    knockoutPoints: 300,
    boostsUsed: 3,
    correctPredictions: 40,
    playedGames: 50
  }
]

const mockTournament = {
  id: 'tournament-1',
  name: 'World Cup 2026'
}

describe('LeaderboardView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders cards on mobile', () => {
    // Mock mobile viewport
    vi.mocked(MUI.useMediaQuery).mockReturnValue(true)

    renderWithTheme(
      <LeaderboardView
        scores={mockScores}
        currentUserId="user-1"
        tournament={mockTournament}
      />
    )

    // LeaderboardCards should render (check for card-specific elements)
    expect(screen.getByText('You')).toBeInTheDocument() // user-1 is current user
    expect(screen.getByText('Bob')).toBeInTheDocument()

    // Should have card roles
    const cards = screen.getAllByRole('button')
    expect(cards.length).toBeGreaterThan(0)
  })

  it('renders table on desktop', () => {
    // Mock desktop viewport
    vi.mocked(MUI.useMediaQuery).mockReturnValue(false)

    renderWithTheme(
      <LeaderboardView
        scores={mockScores}
        currentUserId="user-1"
        tournament={mockTournament}
      />
    )

    // LeaderboardTable should render (check for table elements)
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByText('Player')).toBeInTheDocument() // table header
    expect(screen.getByText('Total Points')).toBeInTheDocument()
  })

  it('passes scores to child components', () => {
    vi.mocked(MUI.useMediaQuery).mockReturnValue(true)

    renderWithTheme(
      <LeaderboardView
        scores={mockScores}
        currentUserId="user-1"
        tournament={mockTournament}
      />
    )

    // Check that scores are rendered
    expect(screen.getByText('1,200 pts')).toBeInTheDocument()
    expect(screen.getByText('1,000 pts')).toBeInTheDocument()
  })

  it('passes currentUserId to child components', () => {
    vi.mocked(MUI.useMediaQuery).mockReturnValue(true)

    renderWithTheme(
      <LeaderboardView
        scores={mockScores}
        currentUserId="user-2"
        tournament={mockTournament}
      />
    )

    // Bob should be highlighted as "You"
    expect(screen.getByText('You')).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  it('handles empty scores', () => {
    vi.mocked(MUI.useMediaQuery).mockReturnValue(true)

    renderWithTheme(
      <LeaderboardView
        scores={[]}
        currentUserId="user-1"
        tournament={mockTournament}
      />
    )

    expect(screen.getByText(/no leaderboard data/i)).toBeInTheDocument()
  })

  it('adapts to viewport changes', () => {
    const { rerender } = renderWithTheme(
      <LeaderboardView
        scores={mockScores}
        currentUserId="user-1"
        tournament={mockTournament}
      />
    )

    // Start with mobile
    vi.mocked(MUI.useMediaQuery).mockReturnValue(true)
    rerender(
      <LeaderboardView
        scores={mockScores}
        currentUserId="user-1"
        tournament={mockTournament}
      />
    )

    // Should show cards (buttons)
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0)

    // Switch to desktop
    vi.mocked(MUI.useMediaQuery).mockReturnValue(false)
    rerender(
      <LeaderboardView
        scores={mockScores}
        currentUserId="user-1"
        tournament={mockTournament}
      />
    )

    // Should show table
    expect(screen.getByRole('table')).toBeInTheDocument()
  })
})
