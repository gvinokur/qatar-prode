'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Box from '@mui/material/Box'

interface AdSidebarProps {
  isAdFree: boolean
}

declare global {
  interface Window {
    adsbygoogle: unknown[]
  }
}

export default function AdSidebar({ isAdFree }: AdSidebarProps) {
  const pathname = usePathname()

  useEffect(() => {
    if (isAdFree || process.env.NODE_ENV !== 'production') return
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {
      // Ad push failed silently — ad blocker or script not yet loaded
    }
  }, [pathname, isAdFree])

  if (isAdFree) return null

  return (
    <Box
      sx={{
        display: { xs: 'none', xl: 'flex' },
        flexDirection: 'column',
        flexShrink: 0,
        width: 300,
        alignSelf: 'flex-start',
        position: 'sticky',
        top: 16,
      }}
    >
      {process.env.NODE_ENV !== 'production' ? (
        <Box
          sx={{
            width: 300,
            height: 250,
            bgcolor: 'grey.200',
            border: '2px dashed',
            borderColor: 'grey.400',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 1,
          }}
        >
          Ad placeholder (dev)
        </Box>
      ) : (
        <ins
          className="adsbygoogle"
          style={{ display: 'block', minHeight: 0, overflow: 'hidden' }}
          data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
          data-ad-slot={process.env.NEXT_PUBLIC_ADSENSE_SIDEBAR_SLOT_ID}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      )}
    </Box>
  )
}
