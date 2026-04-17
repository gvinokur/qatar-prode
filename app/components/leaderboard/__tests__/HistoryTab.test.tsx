import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { screen } from '@testing-library/react'
import { renderWithTheme } from '@/__tests__/utils/test-utils'
import HistoryTab from '../HistoryTab'
import type { ScoreHistoryResult } from '../../../actions/score-history-actions'
import type { UserRankHistoryEntry } from '../../../actions/group-ranking-actions'

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { id: 'user-1' } } }),
}))

vi.mock('next-intl', async () => {
  const actual = await vi.importActual('next-intl')
  return {
    ...actual,
    useTranslations: () => (key: string) => key,
  }
})

// Capture the props passed to RankHistoryChart for assertion
const mockRankHistoryChart = vi.hoisted(() => vi.fn(() => <div data-testid="rank-chart" />))
vi.mock('../RankHistoryChart', () => ({ default: mockRankHistoryChart }))

// Capture props passed to ScoreHistoryChart too (to avoid render errors)
vi.mock('../ScoreHistoryChart', () => ({ default: () => <div data-testid="score-chart" /> }))

const makeHistoryData = (): ScoreHistoryResult => ({
  tournamentStartDate: 20260601,
  tournamentEndDate: 20260630,
  isEmpty: false,
  userHistories: [
    {
      userId: 'user-1',
      displayName: 'Alice',
      data: [{ date: 20260601, totalPoints: 10, rank: 2 }],
    },
    {
      userId: 'user-2',
      displayName: 'Bob',
      data: [{ date: 20260601, totalPoints: 15, rank: 1 }],
    },
  ],
})

describe('HistoryTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('passes pre-stored ranks to RankHistoryChart when preStoredRankHistories is non-null', () => {
    const preStored: UserRankHistoryEntry[] = [
      { userId: 'user-1', data: [{ date: 20260601, rank: 3 }] },
      { userId: 'user-2', data: [{ date: 20260601, rank: 1 }] },
    ]

    renderWithTheme(
      <HistoryTab historyData={makeHistoryData()} preStoredRankHistories={preStored} />
    )

    const passedHistories = mockRankHistoryChart.mock.calls[0][0].userHistories
    const user1 = passedHistories.find((h: { userId: string }) => h.userId === 'user-1')
    expect(user1.data).toEqual([{ date: 20260601, rank: 3 }])
    expect(user1.displayName).toBe('Alice')
  })

  it('falls back to computed ranks when preStoredRankHistories is null', () => {
    renderWithTheme(
      <HistoryTab historyData={makeHistoryData()} preStoredRankHistories={null} />
    )

    const passedHistories = mockRankHistoryChart.mock.calls[0][0].userHistories
    const user1 = passedHistories.find((h: { userId: string }) => h.userId === 'user-1')
    expect(user1.data).toEqual([{ date: 20260601, rank: 2 }])
  })

  it('falls back to computed ranks when preStoredRankHistories is not passed', () => {
    renderWithTheme(<HistoryTab historyData={makeHistoryData()} />)

    const passedHistories = mockRankHistoryChart.mock.calls[0][0].userHistories
    const user2 = passedHistories.find((h: { userId: string }) => h.userId === 'user-2')
    expect(user2.data).toEqual([{ date: 20260601, rank: 1 }])
  })

  it('excludes users from pre-stored data who are not present in historyData.userHistories', () => {
    const preStored: UserRankHistoryEntry[] = [
      { userId: 'user-1', data: [{ date: 20260601, rank: 1 }] },
      { userId: 'unknown-user', data: [{ date: 20260601, rank: 2 }] },
    ]

    renderWithTheme(
      <HistoryTab historyData={makeHistoryData()} preStoredRankHistories={preStored} />
    )

    const passedHistories = mockRankHistoryChart.mock.calls[0][0].userHistories
    const userIds = passedHistories.map((h: { userId: string }) => h.userId)
    expect(userIds).not.toContain('unknown-user')
    expect(userIds).toContain('user-1')
  })

  it('renders empty state when historyData is undefined', () => {
    renderWithTheme(<HistoryTab />)
    expect(screen.queryByTestId('rank-chart')).not.toBeInTheDocument()
  })
})
