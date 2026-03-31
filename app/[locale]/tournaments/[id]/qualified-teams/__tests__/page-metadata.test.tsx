import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateMetadata } from '../page'

const mockFindTournamentById = vi.fn()

vi.mock('next-intl/server', () => ({
  getLocale: async () => 'en',
  getTranslations: async ({ namespace }: { locale: string; namespace: string }) => {
    const translations: Record<string, Record<string, string>> = {
      common: { 'app.name': 'World Cup Predictions' },
      'qualified-teams': {
        'page.title': 'Qualified Teams Prediction',
        'metadata.description': 'Predict which teams qualify from each group in {name}',
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
vi.mock('@/app/actions/qualification-actions', () => ({ getTournamentQualificationConfig: vi.fn() }))
vi.mock('@/app/db/database', () => ({ db: {} }))
vi.mock('@/app/utils/localization-helper', () => ({ applyLocalizationBatch: vi.fn() }))
vi.mock('@/app/components/qualified-teams/qualified-teams-client-page', () => ({ default: () => null }))
vi.mock('@/app/components/debug', () => ({ DebugObject: () => null }))
vi.mock('@/app/db/team-repository', () => ({ findQualifiedTeams: vi.fn() }))
vi.mock('@/app/utils/qualified-teams-scoring', () => ({ calculateQualifiedTeamsScore: vi.fn() }))
vi.mock('@/app/db/game-repository', () => ({ getAllTournamentGames: vi.fn() }))
vi.mock('@/app/db/game-guess-repository', () => ({ findGameGuessesByUserId: vi.fn() }))
vi.mock('@/app/db/tournament-prediction-completion-repository', () => ({ getTournamentPredictionCompletion: vi.fn() }))
vi.mock('@/app/actions/tournament-actions', () => ({ getTeamsMap: vi.fn() }))

beforeEach(() => { mockFindTournamentById.mockReset() })

describe('Qualified Teams Page generateMetadata', () => {
  it('returns tournament-specific title when tournament exists', async () => {
    mockFindTournamentById.mockResolvedValue({ long_name: 'FIFA World Cup 2026', short_name: 'WC26' })

    const metadata = await generateMetadata({ params: Promise.resolve({ id: 'tournament-1' }) })

    expect(metadata.title).toBe('Qualified Teams Prediction – FIFA World Cup 2026 | World Cup Predictions')
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
