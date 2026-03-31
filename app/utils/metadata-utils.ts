import type { Metadata } from 'next'
import { findTournamentById } from '../db/tournament-repository'

const OG_IMAGE = { url: '/web-app-manifest-512x512.png', width: 512, height: 512 }

/**
 * Builds a standard Next.js Metadata object with OpenGraph and Twitter card fields.
 * Used by all generateMetadata functions to avoid duplicating the return shape.
 */
export function buildPageMetadata(title: string, description: string): Metadata {
  return {
    title,
    description,
    openGraph: {
      type: 'website',
      title,
      description,
      images: [OG_IMAGE],
    },
    twitter: { card: 'summary', title, description },
  }
}

type TournamentShape = { long_name: string; short_name: string }

/**
 * Fetches a tournament and builds page metadata using the provided title/description
 * builders. Returns a fallback { title: appName } on not-found or error.
 */
export async function buildTournamentMetadata(
  id: string,
  appName: string,
  buildTitle: (t: TournamentShape) => string,
  buildDescription: (t: TournamentShape) => string
): Promise<Metadata> {
  try {
    const tournament = await findTournamentById(id)
    if (!tournament) return { title: appName }
    return buildPageMetadata(buildTitle(tournament), buildDescription(tournament))
  } catch {
    return { title: appName }
  }
}
