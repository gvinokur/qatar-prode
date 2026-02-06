import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithTheme } from '@/__tests__/utils/test-utils'
import LeaderboardView from '@/app/components/leaderboard/LeaderboardView'

const mockScores = [
  {
    userId: 'user-1',
    userName: 'User One',
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
    userName: 'User Two',
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

const mockTournament = {
  id: 'tournament-1',
  name: 'Test Tournament'
}

describe('LeaderboardView', () => {
  it('renders leaderboard cards', () => {
    renderWithTheme(
      <LeaderboardView
        scores={mockScores}
        currentUserId="user-1"
        tournament={mockTournament}
      />
    )

    expect(screen.getByRole('list', { name: /leaderboard/i})).toBeInTheDocument()
    // User One is current user, displays as "You"
    expect(screen.getByText('You')).toBeInTheDocument()
    expect(screen.getByText('User Two')).toBeInTheDocument()
  })

  it('passes currentUserId to LeaderboardCards', () => {
    renderWithTheme(
      <LeaderboardView
        scores={mockScores}
        currentUserId="user-1"
        tournament={mockTournament}
      />
    )

    // Current user card should be highlighted
    expect(screen.getByText('You')).toBeInTheDocument()
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
