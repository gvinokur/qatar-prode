import type { MetadataRoute } from 'next'
import { locales } from '../i18n.config'
import { findAllActiveTournaments } from './db/tournament-repository'
import { findAllPublicGroupsForSitemap } from './db/prode-group-repository'

export const dynamic = 'force-dynamic'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://prodemundial.app'

const tournamentSubPages = [
  '',
  '/results',
  '/rules',
  '/awards',
  '/stats',
  '/qualified-teams',
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [tournaments, groups] = await Promise.all([
    findAllActiveTournaments(),
    findAllPublicGroupsForSitemap(),
  ])

  const entries: MetadataRoute.Sitemap = []

  // Home pages for each locale
  for (const locale of locales) {
    entries.push({
      url: `${baseUrl}/${locale}`,
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, `${baseUrl}/${l}`])
        ),
      },
    })
  }

  // Tournament sub-pages for each locale
  for (const tournament of tournaments) {
    for (const subPage of tournamentSubPages) {
      for (const locale of locales) {
        entries.push({
          url: `${baseUrl}/${locale}/tournaments/${tournament.id}${subPage}`,
          alternates: {
            languages: Object.fromEntries(
              locales.map((l) => [l, `${baseUrl}/${l}/tournaments/${tournament.id}${subPage}`])
            ),
          },
        })
      }
    }
  }

  // Public friend-group pages for each locale
  for (const group of groups) {
    for (const locale of locales) {
      entries.push({
        url: `${baseUrl}/${locale}/friend-groups/${group.id}`,
        alternates: {
          languages: Object.fromEntries(
            locales.map((l) => [l, `${baseUrl}/${l}/friend-groups/${group.id}`])
          ),
        },
      })
    }
  }

  return entries
}
