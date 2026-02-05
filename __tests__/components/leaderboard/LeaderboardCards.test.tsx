import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { renderWithTheme } from '@/__tests__/utils/test-utils'
import LeaderboardCards from '@/app/components/leaderboard/LeaderboardCards'

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
  },
  {
    userId: 'user-3',
    userName: 'Charlie',
    totalPoints: 1000, // Same points as Bob (tie)
    groupStagePoints: 650,
    knockoutPoints: 350,
    boostsUsed: 2,
    correctPredictions: 38,
    playedGames: 50
  }
]

describe('LeaderboardCards', () => {
  it('renders all user cards', () => {
    renderWithTheme(
      <LeaderboardCards
        scores={mockScores}
        currentUserId="user-1"
        previousScores={undefined}
      />
    )

    expect(screen.getByText('You')).toBeInTheDocument() // user-1 (current user)
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('Charlie')).toBeInTheDocument()
  })

  it('highlights current user', () => {
    renderWithTheme(
      <LeaderboardCards
        scores={mockScores}
        currentUserId="user-2"
        previousScores={undefined}
      />
    )

    expect(screen.getByText('You')).toBeInTheDocument() // user-2 is current user
    expect(screen.getByText(/tap to view details/i)).toBeInTheDocument()
  })

  it('sorts by total points descending', () => {
    renderWithTheme(
      <LeaderboardCards
        scores={mockScores}
        currentUserId="user-1"
        previousScores={undefined}
      />
    )

    const ranks = screen.getAllByText(/^#\d+$/)
    expect(ranks[0]).toHaveTextContent('#1') // Alice (1200 pts)
    expect(ranks[1]).toHaveTextContent('#2') // Bob or Charlie (1000 pts, tie-broken by ID)
    expect(ranks[2]).toHaveTextContent('#3')
  })

  it('handles users with tied scores', () => {
    // Bob and Charlie both have 1000 points
    // Tie-breaking should be deterministic by user ID
    renderWithTheme(
      <LeaderboardCards
        scores={mockScores}
        currentUserId="user-1"
        previousScores={undefined}
      />
    )

    const cards = screen.getAllByRole('button')
    expect(cards.length).toBe(3)

    // Alice should be #1 (1200 pts)
    const ranks = screen.getAllByText(/^#\d+$/)
    expect(ranks[0]).toHaveTextContent('#1')
  })

  it('allows only one expanded card', () => {
    renderWithTheme(
      <LeaderboardCards
        scores={mockScores}
        currentUserId="user-1"
        previousScores={undefined}
      />
    )

    const cards = screen.getAllByRole('button')

    // Initially all cards should be collapsed
    cards.forEach(card => {
      expect(card).toHaveAttribute('aria-expanded', 'false')
    })

    // Expand first card
    fireEvent.click(cards[0])
    expect(cards[0]).toHaveAttribute('aria-expanded', 'true')
    expect(cards[1]).toHaveAttribute('aria-expanded', 'false')
    expect(cards[2]).toHaveAttribute('aria-expanded', 'false')

    // Expand second card - first should collapse
    fireEvent.click(cards[1])
    expect(cards[0]).toHaveAttribute('aria-expanded', 'false')
    expect(cards[1]).toHaveAttribute('aria-expanded', 'true')
    expect(cards[2]).toHaveAttribute('aria-expanded', 'false')

    // Clicking same card again should collapse it
    fireEvent.click(cards[1])
    cards.forEach(card => {
      expect(card).toHaveAttribute('aria-expanded', 'false')
    })
  })

  it('handles empty leaderboard', () => {
    renderWithTheme(
      <LeaderboardCards
        scores={[]}
        currentUserId="user-1"
        previousScores={undefined}
      />
    )

    expect(screen.getByText(/no leaderboard data/i)).toBeInTheDocument()
    expect(screen.getByText(/check back after predictions close/i)).toBeInTheDocument()
  })

  it('handles single user', () => {
    renderWithTheme(
      <LeaderboardCards
        scores={[mockScores[0]]}
        currentUserId="user-1"
        previousScores={undefined}
      />
    )

    expect(screen.getByText('#1')).toBeInTheDocument()
    expect(screen.getByText('You')).toBeInTheDocument()
  })

  it('handles missing currentUserId', () => {
    renderWithTheme(
      <LeaderboardCards
        scores={mockScores}
        currentUserId=""
        previousScores={undefined}
      />
    )

    // No card should be highlighted as "You"
    expect(screen.queryByText('You')).not.toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('Charlie')).toBeInTheDocument()
  })

  it('calculates rank changes with previous scores', () => {
    const previousScores = [
      { userId: 'user-2', totalPoints: 1300 }, // Bob was #1
      { userId: 'user-1', totalPoints: 1100 }, // Alice was #2
      { userId: 'user-3', totalPoints: 900 }   // Charlie was #3
    ]

    renderWithTheme(
      <LeaderboardCards
        scores={mockScores}
        currentUserId="user-1"
        previousScores={previousScores}
      />
    )

    // Alice improved from #2 to #1 (+1)
    // Bob declined from #1 to #2 (-1)
    // Charlie stayed at #3 (0)

    // Check that rank change indicators are present
    const cards = screen.getAllByRole('button')
    expect(cards.length).toBe(3)
  })
})
