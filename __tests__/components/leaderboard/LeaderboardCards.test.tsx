import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent, act, waitFor } from '@testing-library/react'
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
    // Names may appear in both leaderboard cards and off-screen sharing templates
    expect(screen.getAllByText('Bob').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Charlie').length).toBeGreaterThan(0)
  })

  it('sorts users by total points descending with positional fallback ranks', () => {
    renderWithTheme(
      <LeaderboardCards
        scores={mockScores}
        currentUserId="user-99"
      />
    )

    const cards = screen.getAllByRole('button', { name: /leaderboard card/i })
    // Alice and Bob tie at 100 points; Alice first alphabetically (user-1 < user-2)
    // Positional fallback (no materializedRanks): index 0→rank 1, index 1→rank 2, index 2→rank 3
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

  it('renders empty state when scores array is empty', () => {
    renderWithTheme(
      <LeaderboardCards
        scores={[]}
        currentUserId="user-1"
        materializedRanks={new Map([['user-1', { currentRank: 1, rankChange: 0 }]])}
      />
    )

    expect(screen.getByText(/no leaderboard data/i)).toBeInTheDocument()
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

    // Name may appear in both leaderboard card and off-screen sharing template
    expect(screen.getAllByText('Unknown User').length).toBeGreaterThan(0)
  })

  describe('materializedRanks prop', () => {
    it('displays ranks from materializedRanks map when provided and non-empty', () => {
      // Assign different ranks to each user to verify materialized values are used
      const materializedRanks = new Map([
        ['user-1', { currentRank: 3, rankChange: 0 }], // Alice → rank 3 (not positional rank 1)
        ['user-2', { currentRank: 1, rankChange: 0 }], // Bob → rank 1
        ['user-3', { currentRank: 2, rankChange: 0 }], // Charlie → rank 2
      ])

      renderWithTheme(
        <LeaderboardCards
          scores={mockScores}
          currentUserId="user-99"
          materializedRanks={materializedRanks}
        />
      )

      const cards = screen.getAllByRole('button', { name: /leaderboard card/i })
      // Sort order by score unchanged: Alice first (100, user-1), Bob second (100, user-2), Charlie last (80)
      expect(cards[0]).toHaveAccessibleName(/alice.*rank 3/i)
      expect(cards[1]).toHaveAccessibleName(/bob.*rank 1/i)
      expect(cards[2]).toHaveAccessibleName(/charlie.*rank 2/i)
    })

    it('falls back to positional rank when materializedRanks is an empty Map', () => {
      renderWithTheme(
        <LeaderboardCards
          scores={mockScores}
          currentUserId="user-99"
          materializedRanks={new Map()}
        />
      )

      const cards = screen.getAllByRole('button', { name: /leaderboard card/i })
      expect(cards[0]).toHaveAccessibleName(/alice.*rank 1/i)
      expect(cards[1]).toHaveAccessibleName(/bob.*rank 2/i)
      expect(cards[2]).toHaveAccessibleName(/charlie.*rank 3/i)
    })

    it('uses positional fallback for users missing from materializedRanks', () => {
      // Map has only an entry for a user not in scores — score users should all get positional ranks
      const materializedRanks = new Map([
        ['user-999', { currentRank: 1, rankChange: 0 }],
      ])

      renderWithTheme(
        <LeaderboardCards
          scores={mockScores}
          currentUserId="user-99"
          materializedRanks={materializedRanks}
        />
      )

      const cards = screen.getAllByRole('button', { name: /leaderboard card/i })
      // hasMaterialized=true but no match for score users → positional fallback
      expect(cards[0]).toHaveAccessibleName(/alice.*rank 1/i)
      expect(cards[1]).toHaveAccessibleName(/bob.*rank 2/i)
      expect(cards[2]).toHaveAccessibleName(/charlie.*rank 3/i)
    })

    it('shows rank change number after animation completes with positive rankChange', async () => {
      const scoresWithHistory = [
        { ...mockScores[0], penultimateSnapshotPoints: 80, latestSnapshotPoints: 100 },
        { ...mockScores[1], penultimateSnapshotPoints: 90, latestSnapshotPoints: 100 },
        mockScores[2],
      ]
      const materializedRanks = new Map([
        ['user-1', { currentRank: 1, rankChange: 2 }],
        ['user-2', { currentRank: 2, rankChange: 0 }],
        ['user-3', { currentRank: 3, rankChange: 0 }],
      ])

      renderWithTheme(
        <LeaderboardCards
          scores={scoresWithHistory}
          currentUserId="user-99"
          materializedRanks={materializedRanks}
        />
      )

      // During 'yesterday' phase: rankChange=0 for all (condition: sortBy=today && hasSnapshotHistory)
      expect(screen.queryByText('2')).not.toBeInTheDocument()

      // Wait for the 800ms animation timer to fire and React to re-render in 'today' phase
      // (using real timers — avoids React 18 scheduler/fake-timer interaction issues)
      await waitFor(
        () => expect(screen.getByText('2')).toBeInTheDocument(),
        { timeout: 2000 }
      )
    })

    it('does not show rank change number during yesterday animation phase', () => {
      vi.useFakeTimers()
      try {
        const scoresWithHistory = [
          { ...mockScores[0], penultimateSnapshotPoints: 80, latestSnapshotPoints: 100 },
        ]
        const materializedRanks = new Map([
          ['user-1', { currentRank: 1, rankChange: 3 }],
        ])

        renderWithTheme(
          <LeaderboardCards
            scores={scoresWithHistory}
            currentUserId="user-99"
            materializedRanks={materializedRanks}
          />
        )

        // sortBy='yesterday' initially when hasSnapshotHistory=true → rankChange forced to 0
        expect(screen.queryByText('3')).not.toBeInTheDocument()
      } finally {
        vi.useRealTimers()
      }
    })
  })

  it('sorts tied users alphabetically by user ID with positional fallback ranks', () => {
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
    // All three users tied at 100 points; sorted alphabetically by user ID: user-a, user-b, user-c
    // Positional fallback (no materializedRanks): ranks are 1, 2, 3
    expect(cards[0]).toHaveAccessibleName(/alice.*rank 1/i)
    expect(cards[1]).toHaveAccessibleName(/bob.*rank 2/i)
    expect(cards[2]).toHaveAccessibleName(/charlie.*rank 3/i)
  })
})
