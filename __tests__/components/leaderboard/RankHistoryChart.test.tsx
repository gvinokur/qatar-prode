import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithTheme } from '@/__tests__/utils/test-utils'
import RankHistoryChart from '@/app/components/leaderboard/RankHistoryChart'

vi.mock('@mui/x-charts/LineChart', () => ({
  LineChart: ({ series }: any) => (
    <div data-testid="line-chart">
      {series?.map((s: any) => <div key={s.id} data-testid={`line-${s.id}`} />)}
    </div>
  ),
}))


vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

const singleUserHistory = [
  { userId: 'user-1', displayName: 'Alice', data: [{ date: 20260610, rank: 1 }] },
]

const multiUserHistories = [
  { userId: 'user-1', displayName: 'Alice', data: [{ date: 20260610, rank: 1 }] },
  { userId: 'user-2', displayName: 'Bob', data: [{ date: 20260610, rank: 2 }] },
]

describe('RankHistoryChart', () => {
  it('renders without crash with 1 user and 1 rank data point', () => {
    renderWithTheme(
      <RankHistoryChart
        userHistories={singleUserHistory}
        currentUserId="user-1"
        startDate={20260601}
        endDate={20260715}
        totalUsers={5}
      />
    )
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
  })

  it('renders a line for the current user', () => {
    renderWithTheme(
      <RankHistoryChart
        userHistories={multiUserHistories}
        currentUserId="user-1"
        startDate={20260601}
        endDate={20260715}
        totalUsers={2}
      />
    )
    expect(screen.getByTestId('line-user-1')).toBeInTheDocument()
  })

  it('returns null when userHistories is empty', () => {
    const { container } = renderWithTheme(
      <RankHistoryChart
        userHistories={[]}
        currentUserId="user-1"
        startDate={20260601}
        endDate={20260715}
        totalUsers={0}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders without crash with different totalUsers values', () => {
    renderWithTheme(
      <RankHistoryChart
        userHistories={singleUserHistory}
        currentUserId="user-1"
        startDate={20260601}
        endDate={20260715}
        totalUsers={10}
      />
    )
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
  })
})
