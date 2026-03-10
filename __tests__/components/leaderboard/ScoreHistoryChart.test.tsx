import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithTheme } from '@/__tests__/utils/test-utils'
import ScoreHistoryChart from '@/app/components/leaderboard/ScoreHistoryChart'

vi.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: ({ dataKey }: any) => <div data-testid={`line-${dataKey}`} />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
}))

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

const singleUserHistory = [
  {
    userId: 'user-1',
    displayName: 'Alice',
    data: [{ date: 20260610, totalPoints: 50 }],
  },
]

const multiUserHistories = [
  {
    userId: 'user-1',
    displayName: 'Alice',
    data: [{ date: 20260610, totalPoints: 50 }],
  },
  {
    userId: 'user-2',
    displayName: 'Bob',
    data: [{ date: 20260610, totalPoints: 40 }],
  },
  {
    userId: 'user-3',
    displayName: 'Charlie',
    data: [{ date: 20260610, totalPoints: 30 }],
  },
]

describe('ScoreHistoryChart', () => {
  it('renders without crash with 1 user and 1 data point', () => {
    renderWithTheme(
      <ScoreHistoryChart
        userHistories={singleUserHistory}
        currentUserId="user-1"
        startDate={20260601}
        endDate={20260715}
      />
    )

    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
  })

  it('renders N Line elements for N users', () => {
    renderWithTheme(
      <ScoreHistoryChart
        userHistories={multiUserHistories}
        currentUserId="user-99"
        startDate={20260601}
        endDate={20260715}
      />
    )

    expect(screen.getByTestId('line-user-1')).toBeInTheDocument()
    expect(screen.getByTestId('line-user-2')).toBeInTheDocument()
    expect(screen.getByTestId('line-user-3')).toBeInTheDocument()
  })

  it('renders a line for the current user', () => {
    renderWithTheme(
      <ScoreHistoryChart
        userHistories={multiUserHistories}
        currentUserId="user-1"
        startDate={20260601}
        endDate={20260715}
      />
    )

    expect(screen.getByTestId('line-user-1')).toBeInTheDocument()
  })

  it('returns null when userHistories is empty', () => {
    const { container } = renderWithTheme(
      <ScoreHistoryChart
        userHistories={[]}
        currentUserId="user-1"
        startDate={20260601}
        endDate={20260715}
      />
    )

    expect(container.firstChild).toBeNull()
  })
})
