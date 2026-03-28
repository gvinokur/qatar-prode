'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

declare global {
  interface Window {
    adsbygoogle: unknown[]
  }
}

/**
 * Signals a virtual page view to Google AdSense Auto Ads on every route change.
 * Required for SPAs so vignette and anchor ads fire on client-side navigation.
 * Only active when NEXT_PUBLIC_ADSENSE_CLIENT_ID is configured.
 */
export default function AdSensePageViewTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID) return
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {
      // adsbygoogle not yet loaded — Auto Ads handles this on its own init
    }
  }, [pathname])

  return null
}
