import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithTheme } from '@/__tests__/utils/test-utils'
import LeaderboardView from '@/app/components/leaderboard/LeaderboardView'

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
  it('renders cards for all screen sizes', () => {
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
    expect(cards.length).toBe(2)
  })

  it('passes scores correctly', () => {
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

  it('highlights current user correctly', () => {
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
    renderWithTheme(
      <LeaderboardView
        scores={[]}
        currentUserId="user-1"
        tournament={mockTournament}
      />
    )

    expect(screen.getByText(/no leaderboard data/i)).toBeInTheDocument()
  })
})
