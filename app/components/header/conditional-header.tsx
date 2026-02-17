'use client'

import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

interface ConditionalHeaderProps {
  readonly children: ReactNode
}

/**
 * Wrapper component that conditionally hides the App Header on tournament pages.
 *
 * Logic:
 * - Hides header if current route starts with '/tournaments/' (all viewports)
 * - Shows header on non-tournament pages
 */
export default function ConditionalHeader({ children }: ConditionalHeaderProps) {
  const pathname = usePathname()

  // Check if current route is a tournament page (accounting for locale prefix)
  const tournamentPageRegex = /^\/[^/]+\/tournaments\//
  const isTournamentPage = tournamentPageRegex.exec(pathname)

  // Hide header on tournament pages
  if (isTournamentPage) {
    return null
  }

  // Show header otherwise
  return <>{children}</>
}
