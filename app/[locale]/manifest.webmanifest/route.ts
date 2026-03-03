import { NextRequest, NextResponse } from 'next/server'
import { getTranslations } from 'next-intl/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'common' })

  const manifest = {
    id: 'prode_mundial',
    start_url: `/${locale}`,
    name: t('app.name'),
    short_name: t('app.name'),
    description: t('app.description'),
    icons: [
      {
        src: '/web-app-manifest-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/web-app-manifest-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/web-app-manifest-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      }
    ],
    theme_color: '#7c3aed',
    background_color: '#7c3aed',
    display: 'standalone',
    dir: 'auto',
    lang: locale,
    orientation: 'any',
    categories: ['social', 'sports']
  }

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600'
    }
  })
}
