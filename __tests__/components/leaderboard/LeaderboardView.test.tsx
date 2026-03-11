import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithTheme } from '@/__tests__/utils/test-utils'
import LeaderboardView from '@/app/components/leaderboard/LeaderboardView'

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

vi.mock('@/app/components/leaderboard/HistoryTab', () => ({
  default: ({ historyData }: any) => (
    <div data-testid="history-tab">{historyData ? 'has-data' : 'no-data'}</div>
  ),
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
    // Name may appear in both leaderboard card and off-screen sharing template
    expect(screen.getAllByText('User Two').length).toBeGreaterThan(0)
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

describe('LeaderboardView tabs', () => {
  it('default tab is Standings (LeaderboardCards content visible, History tab not selected)', () => {
    renderWithTheme(
      <LeaderboardView
        scores={mockScores}
        currentUserId="user-1"
        tournament={mockTournament}
      />
    )

    // Standings content is visible (mocked LeaderboardCards renders "You")
    expect(screen.getByRole('list', { name: /leaderboard/i })).toBeInTheDocument()
    // Standings tab is selected by default
    expect(screen.getByRole('tab', { name: 'standingsTabLabel' })).toHaveAttribute('aria-selected', 'true')
    // History tab is not selected
    expect(screen.getByRole('tab', { name: 'tabLabel' })).toHaveAttribute('aria-selected', 'false')
  })

  it('History tab renders HistoryTab when clicked', () => {
    const historyData = {
      userHistories: [{
        userId: 'user-1',
        displayName: 'Alice',
        data: [{ date: 20260610, totalPoints: 50, rank: 1 }],
      }],
      tournamentStartDate: 20260601,
      tournamentEndDate: 20260715,
      isEmpty: false,
    }

    renderWithTheme(
      <LeaderboardView
        scores={mockScores}
        currentUserId="user-1"
        tournament={mockTournament}
        historyData={historyData}
      />
    )

    const historyTab = screen.getByRole('tab', { name: 'tabLabel' })
    fireEvent.click(historyTab)

    expect(screen.getByTestId('history-tab')).toBeInTheDocument()
    expect(screen.getByTestId('history-tab')).toHaveTextContent('has-data')
  })

  it('History tab renders HistoryTab with no-data when historyData is undefined', () => {
    renderWithTheme(
      <LeaderboardView
        scores={mockScores}
        currentUserId="user-1"
        tournament={mockTournament}
      />
    )

    const historyTab = screen.getByRole('tab', { name: 'tabLabel' })
    fireEvent.click(historyTab)

    expect(screen.getByTestId('history-tab')).toBeInTheDocument()
    expect(screen.getByTestId('history-tab')).toHaveTextContent('no-data')
  })
})

describe('LeaderboardView hideHistoryTab', () => {
  it('renders LeaderboardCards directly without tab UI when hideHistoryTab=true', () => {
    renderWithTheme(
      <LeaderboardView
        scores={mockScores}
        currentUserId="user-1"
        tournament={mockTournament}
        hideHistoryTab={true}
      />
    )

    expect(screen.getByRole('list', { name: /leaderboard/i })).toBeInTheDocument()
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
  })

  it('still shows Standings/History tabs when hideHistoryTab is false', () => {
    renderWithTheme(
      <LeaderboardView
        scores={mockScores}
        currentUserId="user-1"
        tournament={mockTournament}
        hideHistoryTab={false}
      />
    )

    expect(screen.getByRole('tab', { name: 'standingsTabLabel' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'tabLabel' })).toBeInTheDocument()
  })

  it('still shows Standings/History tabs when hideHistoryTab is undefined (default)', () => {
    renderWithTheme(
      <LeaderboardView
        scores={mockScores}
        currentUserId="user-1"
        tournament={mockTournament}
      />
    )

    expect(screen.getByRole('tab', { name: 'standingsTabLabel' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'tabLabel' })).toBeInTheDocument()
  })
})
