import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateMetadata } from '../page'

const mockFindTournamentById = vi.fn()

vi.mock('next-intl/server', () => ({
  getLocale: async () => 'en',
  getTranslations: async ({ namespace }: { locale: string; namespace: string }) => {
    const translations: Record<string, Record<string, string>> = {
      common: { 'app.name': 'World Cup Predictions' },
      stats: {
        'sidebar.title': 'Your Stats',
        'metadata.description': 'View your prediction stats and performance for {name}',
      },
    }
    return (key: string, params?: Record<string, string>) => {
      let value = translations[namespace]?.[key] ?? key
      if (params) {
        Object.entries(params).forEach(([k, v]) => { value = value.replace(`{${k}}`, v) })
      }
      return value
    }
  },
}))

vi.mock('@/app/db/tournament-repository', () => ({
  findTournamentById: (...args: unknown[]) => mockFindTournamentById(...args),
}))

vi.mock('@/app/actions/user-actions', () => ({ getLoggedInUser: vi.fn() }))
vi.mock('@/app/db/game-guess-repository', () => ({ getGameGuessStatisticsForUsers: vi.fn(), getBoostAllocationBreakdown: vi.fn(), findGameGuessesByUserId: vi.fn() }))
vi.mock('@/app/db/tournament-guess-repository', () => ({ findTournamentGuessByUserIdTournament: vi.fn() }))
vi.mock('@/app/db/game-repository', () => ({ getGameCountsForTournament: vi.fn() }))
vi.mock('@/app/db/score-history-repository', () => ({ getScoreHistoryForUsers: vi.fn() }))
vi.mock('@/app/utils/stats-calculations', () => ({ calculateAccuracyStats: vi.fn(), calculateBoostStats: vi.fn() }))
vi.mock('@/app/components/mui-wrappers', () => ({ Box: () => null }))
vi.mock('@/app/components/tournament-stats/performance-overview-card', () => ({ PerformanceOverviewCard: () => null }))
vi.mock('@/app/components/tournament-stats/prediction-accuracy-card', () => ({ PredictionAccuracyCard: () => null }))
vi.mock('@/app/components/tournament-stats/boost-analysis-card', () => ({ BoostAnalysisCard: () => null }))
vi.mock('@/app/components/tournament-stats/history-tab-card', () => ({ HistoryTabCard: () => null }))
vi.mock('@/app/components/tournament-stats/stats-tabs', () => ({ StatsTabs: () => null }))

beforeEach(() => { mockFindTournamentById.mockReset() })

describe('Stats Page generateMetadata', () => {
  it('returns tournament-specific title when tournament exists', async () => {
    mockFindTournamentById.mockResolvedValue({ long_name: 'FIFA World Cup 2026', short_name: 'WC26' })

    const metadata = await generateMetadata({ params: Promise.resolve({ id: 'tournament-1' }) })

    expect(metadata.title).toBe('Your Stats – FIFA World Cup 2026 | World Cup Predictions')
  })

  it('returns fallback appName when tournament not found', async () => {
    mockFindTournamentById.mockResolvedValue(null)

    const metadata = await generateMetadata({ params: Promise.resolve({ id: 'nonexistent' }) })

    expect(metadata.title).toBe('World Cup Predictions')
  })

  it('returns fallback appName when repository throws an error', async () => {
    mockFindTournamentById.mockRejectedValue(new Error('DB connection failed'))

    const metadata = await generateMetadata({ params: Promise.resolve({ id: 'tournament-1' }) })

    expect(metadata.title).toBe('World Cup Predictions')
  })

  it('includes tournament name in description', async () => {
    mockFindTournamentById.mockResolvedValue({ long_name: 'FIFA World Cup 2026', short_name: 'WC26' })

    const metadata = await generateMetadata({ params: Promise.resolve({ id: 'tournament-1' }) })

    expect(metadata.description).toContain('FIFA World Cup 2026')
  })
})
