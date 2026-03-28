'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'

declare global {
  interface Window {
    adsbygoogle: { pauseAdRequests?: number } & unknown[]
  }
}

/**
 * Manages Google AdSense Auto Ads for SPA navigation.
 *
 * Two responsibilities:
 * 1. Signals virtual page views on each route change so vignette/anchor ads
 *    fire correctly on client-side navigation.
 * 2. Pauses ad requests for ad-free users — handles the edge case where the
 *    script loaded while the user was unauthenticated and they then logged in
 *    as an ad-free user within the same browser session.
 */
export default function AdSensePageViewTracker() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isAdFree = session?.user?.isAdFree ?? false

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID) return
    try {
      globalThis.adsbygoogle = globalThis.adsbygoogle || []
      if (isAdFree) {
        // Script may have loaded while unauthenticated — pause it now
        globalThis.adsbygoogle.pauseAdRequests = 1
      } else {
        globalThis.adsbygoogle.pauseAdRequests = 0
        globalThis.adsbygoogle.push({})
      }
    } catch {
      // adsbygoogle not yet loaded — no-op
    }
  }, [pathname, isAdFree])

  return null
}
