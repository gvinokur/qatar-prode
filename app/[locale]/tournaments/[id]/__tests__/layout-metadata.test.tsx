import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateMetadata } from '../layout'

const mockFindTournamentById = vi.fn()

vi.mock('next-intl/server', () => ({
  getLocale: async () => 'en',
  getTranslations: async ({ namespace }: { locale: string; namespace: string }) => {
    const translations: Record<string, Record<string, string>> = {
      common: { 'app.name': 'World Cup Predictions' },
      tournament: { 'metadata.description': 'Make your predictions for {name} and compete with friends' },
    }
    return (key: string, params?: Record<string, string>) => {
      let value = translations[namespace]?.[key] ?? key
      if (params) {
        Object.entries(params).forEach(([k, v]) => { value = value.replace(`{${k}}`, v) })
      }
      return value
    }
  },
  getMessages: async () => ({}),
}))

vi.mock('@/app/db/tournament-repository', () => ({
  findTournamentById: (...args: unknown[]) => mockFindTournamentById(...args),
}))

// Mock all other imports used by TournamentLayout render (not needed for generateMetadata but avoids module errors)
vi.mock('@/app/actions/tournament-actions', () => ({ getTournamentById: vi.fn(), getTournaments: vi.fn(), getTournamentStartDate: vi.fn(), getGroupStandingsForTournament: vi.fn() }))
vi.mock('@/app/actions/prode-group-actions', () => ({ getGroupsForUser: vi.fn() }))
vi.mock('@/app/db/tournament-guess-repository', () => ({ findTournamentGuessByUserIdTournament: vi.fn() }))
vi.mock('@/app/actions/user-actions', () => ({ getLoggedInUser: vi.fn() }))
vi.mock('@/app/db/player-repository', () => ({ getPlayersInTournament: vi.fn() }))
vi.mock('@/app/db/game-guess-repository', () => ({ getGameGuessStatisticsForUsers: vi.fn() }))
vi.mock('@/app/db/tournament-view-permission-repository', () => ({ hasUserPermission: vi.fn() }))
vi.mock('@/app/utils/environment-utils', () => ({ isDevelopmentMode: vi.fn() }))
vi.mock('@/app/utils/theme-utils', () => ({ getThemeLogoUrl: vi.fn() }))

beforeEach(() => { mockFindTournamentById.mockReset() })

describe('Tournament Layout generateMetadata', () => {
  it('returns tournament-specific title when tournament exists', async () => {
    mockFindTournamentById.mockResolvedValue({ long_name: 'FIFA World Cup 2026', short_name: 'WC26' })

    const metadata = await generateMetadata({ params: Promise.resolve({ id: 'tournament-1' }) })

    expect(metadata.title).toBe('FIFA World Cup 2026 | World Cup Predictions')
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

  it('sets openGraph title to match page title', async () => {
    mockFindTournamentById.mockResolvedValue({ long_name: 'FIFA World Cup 2026', short_name: 'WC26' })

    const metadata = await generateMetadata({ params: Promise.resolve({ id: 'tournament-1' }) })

    expect((metadata.openGraph as any)?.title).toBe(metadata.title)
  })
})
