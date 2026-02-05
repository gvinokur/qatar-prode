'use client'

import { usePathname } from 'next/navigation'
import { useMediaQuery, useTheme } from '@mui/material'
import { ReactNode } from 'react'

interface ConditionalHeaderProps {
  readonly children: ReactNode
}

/**
 * Wrapper component that conditionally hides the App Header on tournament pages (mobile only).
 *
 * Logic:
 * - Hides header if current route starts with '/tournaments/' AND viewport is mobile (< 900px)
 * - Shows header otherwise (desktop OR non-tournament pages)
 */
export default function ConditionalHeader({ children }: ConditionalHeaderProps) {
  const pathname = usePathname()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  // Check if current route is a tournament page
  const isTournamentPage = pathname.startsWith('/tournaments/')

  // Hide header if tournament page AND mobile
  if (isTournamentPage && isMobile) {
    return null
  }

  // Show header otherwise
  return <>{children}</>
}
