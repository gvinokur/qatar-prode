import { MetadataRoute } from 'next'
import { getTranslations } from 'next-intl/server'

export default async function manifest(
  { params }: { params: Promise<{ locale: string }> }
): Promise<MetadataRoute.Manifest> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'common' })

  return {
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
    theme_color: '#242424',
    background_color: '#242424',
    display: 'standalone',
    dir: 'auto',
    lang: locale,
    orientation: 'any',
    categories: ['social', 'sports']
  }
}
