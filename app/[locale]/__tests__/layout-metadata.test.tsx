import { describe, it, expect, vi } from 'vitest'
import { generateMetadata } from '../layout'

// Mock next-intl/server
vi.mock('next-intl/server', () => ({
  getTranslations: async ({ locale, namespace: _namespace }: { locale: string; namespace: string }) => {
    const translations: Record<string, Record<string, string>> = {
      'es': {
        'app.name': 'Prode Mundial',
        'app.description': 'Plataforma de pronósticos deportivos'
      },
      'en': {
        'app.name': 'World Cup Predictions',
        'app.description': 'Sports prediction platform'
      }
    }
    return (key: string) => translations[locale]?.[key] || key
  },
  getMessages: async () => ({}) // Return empty messages object
}))

// Mock user actions (LocaleLayout uses getLoggedInUser)
vi.mock('../../actions/user-actions', () => ({
  getLoggedInUser: async () => null
}))

describe('LocaleLayout Metadata', () => {
  it('generates Spanish metadata with correct locale', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: 'es' })
    })

    expect(metadata.title).toBe('Prode Mundial')
    expect(metadata.description).toBe('Plataforma de pronósticos deportivos')
    expect(metadata.manifest).toBe('/es/manifest.webmanifest')
  })

  it('generates English metadata with correct locale', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: 'en' })
    })

    expect(metadata.title).toBe('World Cup Predictions')
    expect(metadata.description).toBe('Sports prediction platform')
    expect(metadata.manifest).toBe('/en/manifest.webmanifest')
  })

  it('includes Open Graph metadata with correct locale', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: 'es' })
    })

    expect(metadata.openGraph).toMatchObject({
      type: 'website',
      locale: 'es',
      alternateLocale: ['en'],
      siteName: 'Prode Mundial',
      title: 'Prode Mundial',
      description: 'Plataforma de pronósticos deportivos',
    })
  })

  it('includes Twitter card metadata', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: 'en' })
    })

    expect(metadata.twitter).toMatchObject({
      card: 'summary',
      title: 'World Cup Predictions',
      description: 'Sports prediction platform',
    })
  })

  it('includes canonical and language alternates', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: 'es' })
    })

    expect(metadata.alternates).toMatchObject({
      canonical: '/es',
      languages: {
        'es': '/es',
        'en': '/en',
      },
    })
  })

  it('sets alternate locale correctly for both languages', async () => {
    const esMetadata = await generateMetadata({
      params: Promise.resolve({ locale: 'es' })
    })
    const enMetadata = await generateMetadata({
      params: Promise.resolve({ locale: 'en' })
    })

    expect(esMetadata.openGraph?.alternateLocale).toEqual(['en'])
    expect(enMetadata.openGraph?.alternateLocale).toEqual(['es'])
  })
})
