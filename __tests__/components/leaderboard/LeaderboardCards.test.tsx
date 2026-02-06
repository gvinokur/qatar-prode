import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithTheme } from '@/__tests__/utils/test-utils'
import LeaderboardCards from '@/app/components/leaderboard/LeaderboardCards'

const mockScores = [
  {
    userId: 'user-1',
    userName: 'Alice',
    totalPoints: 100,
    groupStagePoints: 70,
    knockoutPoints: 30,
    groupStageScore: 60,
    groupStageQualifiersScore: 10,
    groupPositionScore: 5,
    playoffScore: 25,
    groupBoostBonus: 5,
    playoffBoostBonus: 5,
    honorRollScore: 10,
    individualAwardsScore: 5
  },
  {
    userId: 'user-2',
    userName: 'Bob',
    totalPoints: 100,
    groupStagePoints: 50,
    knockoutPoints: 50,
    groupStageScore: 45,
    groupStageQualifiersScore: 5,
    groupPositionScore: 3,
    playoffScore: 47,
    groupBoostBonus: 0,
    playoffBoostBonus: 3,
    honorRollScore: 5,
    individualAwardsScore: 8
  },
  {
    userId: 'user-3',
    userName: 'Charlie',
    totalPoints: 80,
    groupStagePoints: 50,
    knockoutPoints: 30,
    groupStageScore: 45,
    groupStageQualifiersScore: 5,
    groupPositionScore: 3,
    playoffScore: 27,
    groupBoostBonus: 0,
    playoffBoostBonus: 3,
    honorRollScore: 5,
    individualAwardsScore: 8
  }
]

describe('LeaderboardCards', () => {
  it('renders leaderboard list', () => {
    renderWithTheme(
      <LeaderboardCards
        scores={mockScores}
        currentUserId="user-1"
      />
    )

    expect(screen.getByRole('list', { name: /leaderboard/i })).toBeInTheDocument()
    // Alice is current user, so displays as "You"
    expect(screen.getByText('You')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('Charlie')).toBeInTheDocument()
  })

  it('sorts users by total points descending', () => {
    renderWithTheme(
      <LeaderboardCards
        scores={mockScores}
        currentUserId="user-99"
      />
    )

    const cards = screen.getAllByRole('button', { name: /leaderboard card/i })
    // Alice and Bob tie at 100 points, Alice comes first alphabetically (user-1 < user-2)
    expect(cards[0]).toHaveAccessibleName(/alice.*rank 1/i)
    expect(cards[1]).toHaveAccessibleName(/bob.*rank 2/i)
    expect(cards[2]).toHaveAccessibleName(/charlie.*rank 3/i)
  })

  it('highlights current user card', () => {
    renderWithTheme(
      <LeaderboardCards
        scores={mockScores}
        currentUserId="user-2"
      />
    )

    // Bob is the current user
    expect(screen.getByText('You')).toBeInTheDocument()
  })

  it('allows expanding and collapsing cards', () => {
    renderWithTheme(
      <LeaderboardCards
        scores={mockScores}
        currentUserId="user-99"
      />
    )

    const aliceCard = screen.getByLabelText(/alice.*leaderboard card/i)

    // Initially collapsed
    expect(aliceCard).toHaveAttribute('aria-expanded', 'false')

    // Expand
    fireEvent.click(aliceCard)
    expect(aliceCard).toHaveAttribute('aria-expanded', 'true')

    // Collapse
    fireEvent.click(aliceCard)
    expect(aliceCard).toHaveAttribute('aria-expanded', 'false')
  })

  it('ensures only one card is expanded at a time', () => {
    renderWithTheme(
      <LeaderboardCards
        scores={mockScores}
        currentUserId="user-99"
      />
    )

    const aliceCard = screen.getByLabelText(/alice.*leaderboard card/i)
    const bobCard = screen.getByLabelText(/bob.*leaderboard card/i)

    // Expand Alice
    fireEvent.click(aliceCard)
    expect(aliceCard).toHaveAttribute('aria-expanded', 'true')
    expect(bobCard).toHaveAttribute('aria-expanded', 'false')

    // Expand Bob (should collapse Alice)
    fireEvent.click(bobCard)
    expect(aliceCard).toHaveAttribute('aria-expanded', 'false')
    expect(bobCard).toHaveAttribute('aria-expanded', 'true')
  })

  it('displays empty state when no scores', () => {
    renderWithTheme(
      <LeaderboardCards
        scores={[]}
        currentUserId="user-1"
      />
    )

    expect(screen.getByText(/no leaderboard data/i)).toBeInTheDocument()
    expect(screen.getByText(/check back after predictions close/i)).toBeInTheDocument()
  })

  it('handles missing userName gracefully', () => {
    const scoresWithMissingName = [
      {
        userId: 'user-99',
        totalPoints: 100,
        groupStagePoints: 70,
        knockoutPoints: 30,
        groupStageScore: 60,
        groupStageQualifiersScore: 10,
        groupPositionScore: 5,
        playoffScore: 25,
        groupBoostBonus: 5,
        playoffBoostBonus: 5,
        honorRollScore: 10,
        individualAwardsScore: 5
      }
    ]

    renderWithTheme(
      <LeaderboardCards
        scores={scoresWithMissingName}
        currentUserId="user-1"
      />
    )

    expect(screen.getByText('Unknown User')).toBeInTheDocument()
  })

  it('handles tie-breaking by user ID', () => {
    const tiedScores = [
      {
        userId: 'user-c',
        userName: 'Charlie',
        totalPoints: 100,
        groupStagePoints: 50,
        knockoutPoints: 50,
        groupStageScore: 50,
        groupStageQualifiersScore: 0,
        playoffScore: 50,
        groupBoostBonus: 0,
        playoffBoostBonus: 0,
        honorRollScore: 0,
        individualAwardsScore: 0
      },
      {
        userId: 'user-a',
        userName: 'Alice',
        totalPoints: 100,
        groupStagePoints: 50,
        knockoutPoints: 50,
        groupStageScore: 50,
        groupStageQualifiersScore: 0,
        playoffScore: 50,
        groupBoostBonus: 0,
        playoffBoostBonus: 0,
        honorRollScore: 0,
        individualAwardsScore: 0
      },
      {
        userId: 'user-b',
        userName: 'Bob',
        totalPoints: 100,
        groupStagePoints: 50,
        knockoutPoints: 50,
        groupStageScore: 50,
        groupStageQualifiersScore: 0,
        playoffScore: 50,
        groupBoostBonus: 0,
        playoffBoostBonus: 0,
        honorRollScore: 0,
        individualAwardsScore: 0
      }
    ]

    renderWithTheme(
      <LeaderboardCards
        scores={tiedScores}
        currentUserId="user-1"
      />
    )

    const cards = screen.getAllByRole('button', { name: /leaderboard card/i })
    // Should be sorted alphabetically by user ID: user-a, user-b, user-c
    expect(cards[0]).toHaveAccessibleName(/alice.*rank 1/i)
    expect(cards[1]).toHaveAccessibleName(/bob.*rank 2/i)
    expect(cards[2]).toHaveAccessibleName(/charlie.*rank 3/i)
  })
})
