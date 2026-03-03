import { describe, it, expect, vi } from 'vitest'
import { GET } from '../manifest.webmanifest/route'
import { NextRequest } from 'next/server'

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
  }
}))

describe('Locale-specific PWA Manifest Route Handler', () => {
  it('generates Spanish manifest with correct locale', async () => {
    const request = new NextRequest('http://localhost:3000/es/manifest.webmanifest')
    const response = await GET(request, { params: Promise.resolve({ locale: 'es' }) })
    const result = await response.json()

    expect(result.name).toBe('Prode Mundial')
    expect(result.description).toBe('Plataforma de pronósticos deportivos')
    expect(result.lang).toBe('es')
    expect(result.start_url).toBe('/es')
  })

  it('generates English manifest with correct locale', async () => {
    const request = new NextRequest('http://localhost:3000/en/manifest.webmanifest')
    const response = await GET(request, { params: Promise.resolve({ locale: 'en' }) })
    const result = await response.json()

    expect(result.name).toBe('World Cup Predictions')
    expect(result.description).toBe('Sports prediction platform')
    expect(result.lang).toBe('en')
    expect(result.start_url).toBe('/en')
  })

  it('includes all required PWA fields', async () => {
    const request = new NextRequest('http://localhost:3000/es/manifest.webmanifest')
    const response = await GET(request, { params: Promise.resolve({ locale: 'es' }) })
    const result = await response.json()

    expect(result.id).toBe('prode_mundial')
    expect(result.theme_color).toBe('#7c3aed')
    expect(result.background_color).toBe('#7c3aed')
    expect(result.display).toBe('standalone')
    expect(result.icons).toHaveLength(3)
    expect(result.categories).toEqual(['social', 'sports'])
  })

  it('includes correct icon configurations', async () => {
    const request = new NextRequest('http://localhost:3000/es/manifest.webmanifest')
    const response = await GET(request, { params: Promise.resolve({ locale: 'es' }) })
    const result = await response.json()

    expect(result.icons[0]).toMatchObject({
      src: '/web-app-manifest-192x192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'maskable'
    })

    expect(result.icons[1]).toMatchObject({
      src: '/web-app-manifest-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable'
    })
  })

  it('returns correct Content-Type header', async () => {
    const request = new NextRequest('http://localhost:3000/es/manifest.webmanifest')
    const response = await GET(request, { params: Promise.resolve({ locale: 'es' }) })

    expect(response.headers.get('Content-Type')).toBe('application/manifest+json')
  })
})
