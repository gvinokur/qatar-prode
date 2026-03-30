import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateMetadata } from '../page'

const mockFindTournamentById = vi.fn()

vi.mock('next-intl/server', () => ({
  getLocale: async () => 'en',
  getTranslations: async ({ namespace }: { locale: string; namespace: string }) => {
    const translations: Record<string, Record<string, string>> = {
      common: { 'app.name': 'World Cup Predictions' },
      tables: {
        'results.title': 'Results and Standings',
        'metadata.description': 'View results and group standings for {name}',
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

vi.mock('@/app/db/game-repository', () => ({ findGamesInTournament: vi.fn() }))
vi.mock('@/app/db/tournament-playoff-repository', () => ({ findPlayoffStagesWithGamesInTournament: vi.fn() }))
vi.mock('@/app/actions/tournament-actions', () => ({ getTeamsMap: vi.fn(), getGroupStandingsForTournament: vi.fn() }))
vi.mock('@/app/components/mui-wrappers', () => ({ Box: () => null, Typography: () => null }))
vi.mock('@/app/components/results-page/results-page-client', () => ({ default: () => null }))
vi.mock('@/app/components/results-page/loading-skeleton', () => ({ default: () => null }))

beforeEach(() => { mockFindTournamentById.mockReset() })

describe('Results Page generateMetadata', () => {
  it('returns tournament-specific title when tournament exists', async () => {
    mockFindTournamentById.mockResolvedValue({ long_name: 'Copa América 2024', short_name: 'CA24' })

    const metadata = await generateMetadata({ params: Promise.resolve({ id: 'tournament-1' }) })

    expect(metadata.title).toBe('Results and Standings – Copa América 2024 | World Cup Predictions')
  })

  it('returns fallback appName when tournament not found', async () => {
    mockFindTournamentById.mockResolvedValue(null)

    const metadata = await generateMetadata({ params: Promise.resolve({ id: 'nonexistent' }) })

    expect(metadata.title).toBe('World Cup Predictions')
  })

  it('returns fallback appName when repository throws an error', async () => {
    mockFindTournamentById.mockRejectedValue(new Error('Connection timeout'))

    const metadata = await generateMetadata({ params: Promise.resolve({ id: 'tournament-1' }) })

    expect(metadata.title).toBe('World Cup Predictions')
  })

  it('includes tournament name in description', async () => {
    mockFindTournamentById.mockResolvedValue({ long_name: 'Copa América 2024', short_name: 'CA24' })

    const metadata = await generateMetadata({ params: Promise.resolve({ id: 'tournament-1' }) })

    expect(metadata.description).toContain('Copa América 2024')
  })
})
