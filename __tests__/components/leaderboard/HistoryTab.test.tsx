import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithTheme } from '@/__tests__/utils/test-utils'
import HistoryTab from '@/app/components/leaderboard/HistoryTab'

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

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { id: 'current-user-id' } } }),
}))

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

const validHistoryData = {
  userHistories: [{
    userId: 'user-1',
    displayName: 'Alice',
    data: [{ date: 20260610, totalPoints: 50, rank: 1 }],
  }],
  tournamentStartDate: 20260601,
  tournamentEndDate: 20260715,
  isEmpty: false,
}

describe('HistoryTab', () => {
  it('shows empty state when historyData is undefined', () => {
    renderWithTheme(<HistoryTab historyData={undefined} />)

    expect(screen.getByText('noHistory')).toBeInTheDocument()
    expect(screen.getByText('noHistoryDescription')).toBeInTheDocument()
  })

  it('shows empty state when historyData.isEmpty is true', () => {
    const emptyHistoryData = {
      ...validHistoryData,
      isEmpty: true,
    }

    renderWithTheme(<HistoryTab historyData={emptyHistoryData} />)

    expect(screen.getByText('noHistory')).toBeInTheDocument()
    expect(screen.getByText('noHistoryDescription')).toBeInTheDocument()
  })

  it('shows empty state when tournamentStartDate is null', () => {
    const noStartDateData = {
      ...validHistoryData,
      tournamentStartDate: null,
    }

    renderWithTheme(<HistoryTab historyData={noStartDateData as any} />)

    expect(screen.getByText('noHistory')).toBeInTheDocument()
    expect(screen.getByText('noHistoryDescription')).toBeInTheDocument()
  })

  it('renders ScoreHistoryChart and RankHistoryChart when valid historyData provided', () => {
    renderWithTheme(<HistoryTab historyData={validHistoryData} />)

    const lineCharts = screen.getAllByTestId('line-chart')
    expect(lineCharts.length).toBeGreaterThanOrEqual(2)
  })
})
