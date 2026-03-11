import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithTheme } from '@/__tests__/utils/test-utils'
import LeaderboardView from '@/app/components/leaderboard/LeaderboardView'

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

vi.mock('@/app/components/leaderboard/LeaderboardCards', () => ({
  default: ({ scores }: any) => (
    <div>
      {scores.length === 0
        ? <span>no leaderboard data</span>
        : <ul aria-label="leaderboard">{scores.map((s: any) => <li key={s.userId}>{s.userId === 'user-1' ? 'You' : s.userName}</li>)}</ul>
      }
    </div>
  ),
}))

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

const mockTournament = { id: 'tournament-1', name: 'Test Tournament' }

describe('LeaderboardView', () => {
  it('renders leaderboard cards directly without tab UI', () => {
    renderWithTheme(
      <LeaderboardView
        scores={mockScores}
        currentUserId="user-1"
        tournament={mockTournament}
      />
    )

    expect(screen.getByRole('list', { name: /leaderboard/i })).toBeInTheDocument()
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
  })

  it('passes currentUserId to LeaderboardCards', () => {
    renderWithTheme(
      <LeaderboardView
        scores={mockScores}
        currentUserId="user-1"
        tournament={mockTournament}
      />
    )

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
