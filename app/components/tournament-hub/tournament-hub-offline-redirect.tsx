'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  readonly tournamentId: string
  readonly locale: string
}

export function TournamentHubOfflineRedirect({ tournamentId, locale }: Props) {
  const router = useRouter()
  const hasRedirected = useRef(false)

  const redirectToGames = () => {
    if (hasRedirected.current) return
    hasRedirected.current = true
    router.replace(`/${locale}/tournaments/${tournamentId}/games`)
  }

  useEffect(() => {
    if (!navigator.onLine) {
      redirectToGames()
      return
    }

    window.addEventListener('offline', redirectToGames)
    return () => window.removeEventListener('offline', redirectToGames)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
