import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateMetadata } from '../page'

const mockFindProdeGroupById = vi.fn()
const mockFindTournamentById = vi.fn()

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

vi.mock('@/app/db/tournament-repository', () => ({
  findTournamentById: (...args: unknown[]) => mockFindTournamentById(...args),
}))

vi.mock('@/app/actions/user-actions', () => ({ getLoggedInUser: vi.fn() }))
vi.mock('@/app/db/prode-group-join-request-repository', () => ({ findPendingJoinRequest: vi.fn() }))

beforeEach(() => {
  mockFindProdeGroupById.mockReset()
  mockFindTournamentById.mockReset()
})

describe('Tournament-scoped Friend Group Page generateMetadata', () => {
  it('includes both group and tournament names in title when both exist', async () => {
    mockFindProdeGroupById.mockResolvedValue({ id: 'group-1', name: 'Los Amigos' })
    mockFindTournamentById.mockResolvedValue({ id: 't-1', long_name: 'FIFA World Cup 2026', short_name: 'WC26' })

    const metadata = await generateMetadata({
      params: Promise.resolve({ id: 't-1', group_id: 'group-1', locale: 'en' })
    })

    expect(metadata.title).toBe('Los Amigos | WC26 | World Cup Predictions')
  })

  it('falls back to group name only when tournament not found', async () => {
    mockFindProdeGroupById.mockResolvedValue({ id: 'group-1', name: 'Los Amigos' })
    mockFindTournamentById.mockResolvedValue(null)

    const metadata = await generateMetadata({
      params: Promise.resolve({ id: 'nonexistent', group_id: 'group-1', locale: 'en' })
    })

    expect(metadata.title).toBe('Los Amigos | World Cup Predictions')
  })

  it('returns fallback appName when group not found', async () => {
    mockFindProdeGroupById.mockResolvedValue(null)
    mockFindTournamentById.mockResolvedValue({ id: 't-1', long_name: 'FIFA World Cup 2026', short_name: 'WC26' })

    const metadata = await generateMetadata({
      params: Promise.resolve({ id: 't-1', group_id: 'nonexistent', locale: 'en' })
    })

    expect(metadata.title).toBe('World Cup Predictions')
  })

  it('returns fallback appName when repository throws an error', async () => {
    mockFindProdeGroupById.mockRejectedValue(new Error('DB error'))

    const metadata = await generateMetadata({
      params: Promise.resolve({ id: 't-1', group_id: 'group-1', locale: 'en' })
    })

    expect(metadata.title).toBe('World Cup Predictions')
  })
})
