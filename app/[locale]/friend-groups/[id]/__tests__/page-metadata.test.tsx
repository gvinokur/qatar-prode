import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateMetadata } from '../page'

const mockFindProdeGroupById = vi.fn()

vi.mock('next-intl/server', () => ({
  getLocale: async () => 'en',
  getTranslations: async ({ namespace }: { locale: string; namespace: string }) => {
    const translations: Record<string, Record<string, string>> = {
      common: { 'app.name': 'World Cup Predictions' },
      groups: { 'metadata.description': 'View friend group standings and compete in {name}' },
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

vi.mock('@/app/db/prode-group-repository', () => ({
  findProdeGroupById: (...args: unknown[]) => mockFindProdeGroupById(...args),
  findParticipantsInGroup: vi.fn(),
}))

vi.mock('@/app/actions/user-actions', () => ({ getLoggedInUser: vi.fn() }))
vi.mock('@/app/db/tournament-repository', () => ({ findAllActiveTournaments: vi.fn(), findTournamentById: vi.fn() }))
vi.mock('@/app/db/users-repository', () => ({ findUsersByIds: vi.fn() }))

beforeEach(() => { mockFindProdeGroupById.mockReset() })

describe('Friend Groups Page generateMetadata', () => {
  it('returns group-specific title when group exists', async () => {
    mockFindProdeGroupById.mockResolvedValue({ id: 'group-1', name: 'The Champions' })

    const metadata = await generateMetadata({ params: Promise.resolve({ id: 'group-1', locale: 'en' }) })

    expect(metadata.title).toBe('The Champions | World Cup Predictions')
  })

  it('returns fallback appName when group not found', async () => {
    mockFindProdeGroupById.mockResolvedValue(null)

    const metadata = await generateMetadata({ params: Promise.resolve({ id: 'nonexistent', locale: 'en' }) })

    expect(metadata.title).toBe('World Cup Predictions')
  })

  it('returns fallback appName when repository throws an error', async () => {
    mockFindProdeGroupById.mockRejectedValue(new Error('DB error'))

    const metadata = await generateMetadata({ params: Promise.resolve({ id: 'group-1', locale: 'en' }) })

    expect(metadata.title).toBe('World Cup Predictions')
  })

  it('includes group name in description', async () => {
    mockFindProdeGroupById.mockResolvedValue({ id: 'group-1', name: 'The Champions' })

    const metadata = await generateMetadata({ params: Promise.resolve({ id: 'group-1', locale: 'en' }) })

    expect(metadata.description).toContain('The Champions')
  })
})
