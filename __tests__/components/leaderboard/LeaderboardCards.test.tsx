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

    // Non-self cards have aria-label "Press Enter to compare with {name}, rank {rank}."
    const cards = screen.getAllByRole('button', { name: /press enter to compare/i })
    // Alice and Bob tie at 100 points (both rank 1), Alice comes first alphabetically (user-1 < user-2)
    // Charlie has 80 points (rank 3, using competition ranking)
    expect(cards[0]).toHaveAccessibleName(/compare with alice.*rank 1/i)
    expect(cards[1]).toHaveAccessibleName(/compare with bob.*rank 1/i)
    expect(cards[2]).toHaveAccessibleName(/compare with charlie.*rank 3/i)
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
    // Alice (user-1) is the current user — self card expands on click
    renderWithTheme(
      <LeaderboardCards
        scores={mockScores}
        currentUserId="user-1"
      />
    )

    // Self card has aria-label containing "Your leaderboard card"
    const selfCard = screen.getByLabelText(/your leaderboard card.*rank/i)

    // Initially collapsed
    expect(selfCard).toHaveAttribute('aria-expanded', 'false')

    // Expand
    fireEvent.click(selfCard)
    expect(selfCard).toHaveAttribute('aria-expanded', 'true')

    // Collapse
    fireEvent.click(selfCard)
    expect(selfCard).toHaveAttribute('aria-expanded', 'false')
  })

  it('ensures only one card is expanded at a time', () => {
    // Alice (user-1) is the current user — self card can expand
    // Bob (user-2) is a non-self card — click opens compare dialog
    renderWithTheme(
      <LeaderboardCards
        scores={mockScores}
        currentUserId="user-1"
      />
    )

    const selfCard = screen.getByLabelText(/your leaderboard card.*rank/i)
    const bobCard = screen.getByLabelText(/compare with bob/i)

    // Initially both collapsed
    expect(selfCard).toHaveAttribute('aria-expanded', 'false')
    expect(bobCard).toHaveAttribute('aria-expanded', 'false')

    // Expand self card (Alice)
    fireEvent.click(selfCard)
    expect(selfCard).toHaveAttribute('aria-expanded', 'true')

    // Click Bob (non-self) — opens compare dialog, does NOT affect self card expansion
    fireEvent.click(bobCard)
    expect(bobCard).toHaveAttribute('aria-expanded', 'false') // Non-self cards don't expand
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

    // Non-self cards (user-a, user-b, user-c) all have "compare" in aria-label
    // currentUserId is "user-1" which doesn't match any score
    const cards = screen.getAllByRole('button', { name: /press enter to compare/i })
    // All three users tied at 100 points (all rank 1 with competition ranking)
    // Sorted alphabetically by user ID: user-a, user-b, user-c
    expect(cards[0]).toHaveAccessibleName(/compare with alice.*rank 1/i)
    expect(cards[1]).toHaveAccessibleName(/compare with bob.*rank 1/i)
    expect(cards[2]).toHaveAccessibleName(/compare with charlie.*rank 1/i)
  })
})
