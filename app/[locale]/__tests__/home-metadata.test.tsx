import { describe, it, expect, vi } from 'vitest'
import { generateMetadata } from '../page'

vi.mock('next-intl/server', () => ({
  getLocale: async () => 'en',
  getTranslations: async ({ namespace }: { locale: string; namespace: string }) => {
    const translations: Record<string, Record<string, string>> = {
      common: {
        'app.name': 'World Cup Predictions',
        'app.description': 'Sports prediction platform',
        'home.metadata.description': 'Make sports predictions, compete with friends, and track your standings across tournaments',
      },
    }
    return (key: string) => translations[namespace]?.[key] ?? key
  },
}))

vi.mock('../../actions/tournament-actions', () => ({ getTournaments: vi.fn() }))
vi.mock('../../actions/user-actions', () => ({ getLoggedInUser: vi.fn() }))
vi.mock('../../db/onboarding-repository', () => ({ getOnboardingStatus: vi.fn() }))
vi.mock('../../components/onboarding/onboarding-trigger', () => ({ default: () => null }))
vi.mock('../../components/tournament/empty-tournaments-state', () => ({ default: () => null }))
vi.mock('../../components/home/tournament-redirect', () => ({ default: () => null }))

describe('Home Page generateMetadata', () => {
  it('returns improved description from home.metadata.description', async () => {
    const metadata = await generateMetadata()

    expect(metadata.description).toBe(
      'Make sports predictions, compete with friends, and track your standings across tournaments'
    )
    expect(metadata.description).not.toBe('Sports prediction platform')
  })

  it('returns appName as title', async () => {
    const metadata = await generateMetadata()

    expect(metadata.title).toBe('World Cup Predictions')
  })

  it('includes openGraph metadata', async () => {
    const metadata = await generateMetadata()

    expect(metadata.openGraph).toMatchObject({
      type: 'website',
      title: 'World Cup Predictions',
    })
  })
})
