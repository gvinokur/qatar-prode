import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatsAtAGlanceWidget } from '../stats-at-a-glance-widget'
import * as hubActions from '@/app/actions/hub-actions'
import type { StatsAtAGlanceData } from '@/app/actions/hub-actions'

vi.mock('@/app/actions/hub-actions', () => ({
  getStatsAtAGlanceData: vi.fn(),
}))

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(
    async (config: { locale: string; namespace: string } | string) => {
      const ns = typeof config === 'string' ? config : config.namespace
      return (key: string, params?: Record<string, unknown>) => {
        if (params && Object.keys(params).length > 0) {
          return `${ns}.${key}(${JSON.stringify(params)})`
        }
        return `${ns}.${key}`
      }
    }
  ),
}))

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

vi.mock('../dashboard-card', () => ({
  DashboardCard: ({ title, children }: { title: string; children?: React.ReactNode }) => (
    <div data-testid="dashboard-card">
      <span data-testid="dashboard-card-title">{title}</span>
      {children}
    </div>
  ),
}))

const emptyData: StatsAtAGlanceData = {
  hasData: false,
  totalPoints: 0,
  matchesPoints: 0,
  qualifiedTeamsPoints: 0,
  awardsPoints: 0,
  momentumPoints: 0,
  matchesDelta: 0,
  qualifiedTeamsDelta: 0,
  awardsDelta: 0,
  snapshotDateLabel: null,
  isYesterday: false,
  sparklineData: [],
}

const populatedData: StatsAtAGlanceData = {
  hasData: true,
  totalPoints: 128,
  matchesPoints: 84,
  qualifiedTeamsPoints: 30,
  awardsPoints: 14,
  momentumPoints: 12,
  matchesDelta: 7,
  qualifiedTeamsDelta: 3,
  awardsDelta: 2,
  snapshotDateLabel: 'Apr 22',
  isYesterday: true,
  sparklineData: [10, 30, 55, 80, 95, 116, 128],
}

const defaultProps = { tournamentId: 'tournament-1', locale: 'en' as const }

describe('StatsAtAGlanceWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('card title', () => {
    it('renders card title from translation key', async () => {
      vi.mocked(hubActions.getStatsAtAGlanceData).mockResolvedValue(emptyData)
      render(await StatsAtAGlanceWidget(defaultProps))
      expect(screen.getByTestId('dashboard-card-title')).toHaveTextContent(
        'hub.statsAtAGlance.title'
      )
    })
  })

  describe('empty state', () => {
    it('renders noData text when hasData is false', async () => {
      vi.mocked(hubActions.getStatsAtAGlanceData).mockResolvedValue(emptyData)
      render(await StatsAtAGlanceWidget(defaultProps))
      expect(screen.getByText('hub.statsAtAGlance.noData')).toBeInTheDocument()
    })

    it('renders noDataSubtitle when hasData is false', async () => {
      vi.mocked(hubActions.getStatsAtAGlanceData).mockResolvedValue(emptyData)
      render(await StatsAtAGlanceWidget(defaultProps))
      expect(screen.getByText('hub.statsAtAGlance.noDataSubtitle')).toBeInTheDocument()
    })

    it('does not render total points when hasData is false', async () => {
      vi.mocked(hubActions.getStatsAtAGlanceData).mockResolvedValue(emptyData)
      render(await StatsAtAGlanceWidget(defaultProps))
      expect(screen.queryByText('128')).not.toBeInTheDocument()
    })
  })

  describe('populated state', () => {
    it('renders total points as large number when hasData is true', async () => {
      vi.mocked(hubActions.getStatsAtAGlanceData).mockResolvedValue(populatedData)
      render(await StatsAtAGlanceWidget(defaultProps))
      expect(screen.getByText('128')).toBeInTheDocument()
    })

    it('renders momentum chip with point delta when momentumPoints is positive', async () => {
      vi.mocked(hubActions.getStatsAtAGlanceData).mockResolvedValue(populatedData)
      render(await StatsAtAGlanceWidget(defaultProps))
      expect(screen.getByText('12 pts')).toBeInTheDocument()
    })

    it('does not render momentum chip when momentumPoints is zero', async () => {
      vi.mocked(hubActions.getStatsAtAGlanceData).mockResolvedValue({
        ...populatedData,
        momentumPoints: 0,
      })
      render(await StatsAtAGlanceWidget(defaultProps))
      expect(screen.queryByText('0 pts')).not.toBeInTheDocument()
    })

    it('renders since-yesterday caption when isYesterday is true', async () => {
      vi.mocked(hubActions.getStatsAtAGlanceData).mockResolvedValue(populatedData)
      render(await StatsAtAGlanceWidget(defaultProps))
      const els = screen.getAllByText('hub.statsAtAGlance.sinceYesterday({"date":"Apr 22"})')
      expect(els.length).toBeGreaterThanOrEqual(1)
    })

    it('renders since caption when isYesterday is false and snapshotDateLabel exists', async () => {
      vi.mocked(hubActions.getStatsAtAGlanceData).mockResolvedValue({
        ...populatedData,
        isYesterday: false,
        snapshotDateLabel: 'Apr 20',
      })
      render(await StatsAtAGlanceWidget(defaultProps))
      const els = screen.getAllByText('hub.statsAtAGlance.since({"date":"Apr 20"})')
      expect(els.length).toBeGreaterThanOrEqual(1)
    })

    it('renders all three category labels', async () => {
      vi.mocked(hubActions.getStatsAtAGlanceData).mockResolvedValue(populatedData)
      render(await StatsAtAGlanceWidget(defaultProps))
      expect(screen.getByText('hub.statsAtAGlance.matchesLabel')).toBeInTheDocument()
      expect(screen.getByText('hub.statsAtAGlance.qualifiedTeamsLabel')).toBeInTheDocument()
      expect(screen.getByText('hub.statsAtAGlance.awardsLabel')).toBeInTheDocument()
    })

    it('renders category delta as +N in success color when delta is positive', async () => {
      vi.mocked(hubActions.getStatsAtAGlanceData).mockResolvedValue(populatedData)
      render(await StatsAtAGlanceWidget(defaultProps))
      expect(screen.getByText('+7')).toBeInTheDocument()
    })

    it('renders category delta as 0 in neutral color when delta is zero but total is non-zero', async () => {
      vi.mocked(hubActions.getStatsAtAGlanceData).mockResolvedValue({
        ...populatedData,
        matchesDelta: 0,
        matchesPoints: 84,
      })
      render(await StatsAtAGlanceWidget(defaultProps))
      expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('does not render category delta when total for that category is zero', async () => {
      vi.mocked(hubActions.getStatsAtAGlanceData).mockResolvedValue({
        ...populatedData,
        awardsPoints: 0,
        awardsDelta: 0,
      })
      render(await StatsAtAGlanceWidget(defaultProps))
      // awardsPoints is 0, so its delta chip should not appear
      // Other categories still render their deltas
      const zeroBadges = screen.queryAllByText('0')
      expect(zeroBadges).toHaveLength(0)
    })

    it('renders sparkline when sparklineData has 2 or more entries', async () => {
      vi.mocked(hubActions.getStatsAtAGlanceData).mockResolvedValue(populatedData)
      render(await StatsAtAGlanceWidget(defaultProps))
      expect(screen.getByTestId('sparkline')).toBeInTheDocument()
    })

    it('does not render sparkline when sparklineData has fewer than 2 entries', async () => {
      vi.mocked(hubActions.getStatsAtAGlanceData).mockResolvedValue({
        ...populatedData,
        sparklineData: [128],
      })
      render(await StatsAtAGlanceWidget(defaultProps))
      expect(screen.queryByTestId('sparkline')).not.toBeInTheDocument()
    })

    it('renders trend momentum label below sparkline when momentumPoints is positive', async () => {
      vi.mocked(hubActions.getStatsAtAGlanceData).mockResolvedValue(populatedData)
      render(await StatsAtAGlanceWidget(defaultProps))
      expect(screen.getByText('+12 pts')).toBeInTheDocument()
    })

    it('does not render trend momentum label when momentumPoints is zero', async () => {
      vi.mocked(hubActions.getStatsAtAGlanceData).mockResolvedValue({
        ...populatedData,
        momentumPoints: 0,
      })
      render(await StatsAtAGlanceWidget(defaultProps))
      expect(screen.queryByText('+0 pts')).not.toBeInTheDocument()
    })
  })

  describe('navigation', () => {
    it('renders see-all-stats link pointing to stats page', async () => {
      vi.mocked(hubActions.getStatsAtAGlanceData).mockResolvedValue(populatedData)
      render(await StatsAtAGlanceWidget({ tournamentId: 'tournament-42', locale: 'es' }))
      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', '/es/tournaments/tournament-42/stats')
    })

    it('calls getStatsAtAGlanceData with correct tournamentId and locale', async () => {
      vi.mocked(hubActions.getStatsAtAGlanceData).mockResolvedValue(emptyData)
      await StatsAtAGlanceWidget({ tournamentId: 'tournament-99', locale: 'es' })
      expect(hubActions.getStatsAtAGlanceData).toHaveBeenCalledWith('tournament-99', 'es')
    })
  })
})
