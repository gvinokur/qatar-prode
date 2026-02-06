import { describe, it, expect } from 'vitest'
import { screen, within } from '@testing-library/react'
import { renderWithTheme } from '@/__tests__/utils/test-utils'
import LeaderboardTable from '@/app/components/leaderboard/LeaderboardTable'
import type { LeaderboardUser } from '@/app/components/leaderboard/types'

const mockScores: LeaderboardUser[] = [
  {
    id: 'user-1',
    name: 'Alice',
    totalPoints: 100,
    groupPoints: 70,
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
    id: 'user-2',
    name: 'Bob',
    totalPoints: 80,
    groupPoints: 50,
    knockoutPoints: 30,
    groupStageScore: 45,
    groupStageQualifiersScore: 5,
    groupPositionScore: 3,
    playoffScore: 27,
    groupBoostBonus: 0,
    playoffBoostBonus: 3,
    honorRollScore: 5,
    individualAwardsScore: 8
  },
  {
    id: 'user-3',
    name: 'Charlie',
    totalPoints: 90,
    groupPoints: 60,
    knockoutPoints: 30,
    groupStageScore: 55,
    groupStageQualifiersScore: 5,
    groupPositionScore: 4,
    playoffScore: 26,
    groupBoostBonus: 0,
    playoffBoostBonus: 4,
    honorRollScore: 7,
    individualAwardsScore: 8
  }
]

describe('LeaderboardTable', () => {
  it('renders table with headers', () => {
    renderWithTheme(
      <LeaderboardTable
        scores={mockScores}
        currentUserId="user-1"
      />
    )

    expect(screen.getByRole('columnheader', { name: '#' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /player/i })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /total points/i })).toBeInTheDocument()
  })

  it('displays users sorted by total points', () => {
    renderWithTheme(
      <LeaderboardTable
        scores={mockScores}
        currentUserId="user-1"
      />
    )

    const rows = screen.getAllByRole('row')
    // First row is header, then Alice (100), Charlie (90), Bob (80)
    expect(within(rows[1]).getByText('1')).toBeInTheDocument()
    expect(within(rows[1]).getByText(/alice|you/i)).toBeInTheDocument()
    expect(within(rows[2]).getByText('2')).toBeInTheDocument()
    expect(within(rows[2]).getByText('Charlie')).toBeInTheDocument()
    expect(within(rows[3]).getByText('3')).toBeInTheDocument()
    expect(within(rows[3]).getByText('Bob')).toBeInTheDocument()
  })

  it('highlights current user row', () => {
    renderWithTheme(
      <LeaderboardTable
        scores={mockScores}
        currentUserId="user-2"
      />
    )

    const rows = screen.getAllByRole('row')
    // Bob is the current user (row index 3)
    const bobRow = rows[3]
    expect(bobRow).toHaveClass('Mui-selected')
    expect(within(bobRow).getByText('You')).toBeInTheDocument()
  })

  it('displays "You" for current user instead of name', () => {
    renderWithTheme(
      <LeaderboardTable
        scores={mockScores}
        currentUserId="user-1"
      />
    )

    expect(screen.getByText('You')).toBeInTheDocument()
    expect(screen.queryByText('Alice')).not.toBeInTheDocument()
  })

  it('formats total points with locale string', () => {
    const highScoreUser: LeaderboardUser = {
      id: 'user-4',
      name: 'Dave',
      totalPoints: 1000,
      groupPoints: 500,
      knockoutPoints: 500,
      groupStageScore: 450,
      groupStageQualifiersScore: 50,
      playoffScore: 500,
      groupBoostBonus: 0,
      playoffBoostBonus: 0,
      honorRollScore: 0,
      individualAwardsScore: 0
    }

    renderWithTheme(
      <LeaderboardTable
        scores={[highScoreUser]}
        currentUserId="user-1"
      />
    )

    // Should display with comma separator
    expect(screen.getByText('1,000')).toBeInTheDocument()
  })

  it('handles ties by sorting alphabetically by user ID', () => {
    const tiedScores: LeaderboardUser[] = [
      {
        id: 'user-c',
        name: 'Charlie',
        totalPoints: 100,
        groupPoints: 50,
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
        id: 'user-a',
        name: 'Alice',
        totalPoints: 100,
        groupPoints: 50,
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
        id: 'user-b',
        name: 'Bob',
        totalPoints: 100,
        groupPoints: 50,
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
      <LeaderboardTable
        scores={tiedScores}
        currentUserId="user-x"
      />
    )

    const rows = screen.getAllByRole('row')
    // Should be sorted: user-a (Alice), user-b (Bob), user-c (Charlie)
    expect(within(rows[1]).getByText('Alice')).toBeInTheDocument()
    expect(within(rows[2]).getByText('Bob')).toBeInTheDocument()
    expect(within(rows[3]).getByText('Charlie')).toBeInTheDocument()
  })

  it('displays all users when provided', () => {
    renderWithTheme(
      <LeaderboardTable
        scores={mockScores}
        currentUserId="user-1"
      />
    )

    const rows = screen.getAllByRole('row')
    // 1 header + 3 user rows
    expect(rows).toHaveLength(4)
  })
})
