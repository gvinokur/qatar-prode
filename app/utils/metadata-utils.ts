import type { Metadata } from 'next'

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
