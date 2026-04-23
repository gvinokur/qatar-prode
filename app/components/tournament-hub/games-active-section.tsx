'use client'

import React, { useCallback, useState } from 'react'
import { useLocale } from 'next-intl'
import { toLocale } from '../../utils/locale-utils'
import { GamesActiveClient } from './games-active-client'
import { GuessesContextProvider } from '../context-providers/guesses-context-provider'
import { getActionCenterGames } from '../../actions/hub-actions'
import { calculateDeadline } from '../../utils/countdown-utils'
import type { ExtendedGameData } from '../../definitions'
import type { Team, GameGuessNew } from '../../db/tables-definition'

type UrgencyLevel = 'critical' | 'high' | 'medium' | 'safe' | 'empty'

const ONE_HOUR_MS = 60 * 60 * 1000
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000
const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000

function computeUrgencyLevel(data: { mode: string; games: ExtendedGameData[] }): UrgencyLevel {
  if (data.mode !== 'urgent') {
    return data.mode === 'fallback' ? 'safe' : 'empty'
  }
  if (data.games.length === 0) return 'empty'

  const now = Date.now()
  const minDeadline = Math.min(...data.games.map((g) => calculateDeadline(g.game_date)))
  const msUntilDeadline = minDeadline - now

  if (msUntilDeadline < 2 * ONE_HOUR_MS) return 'critical'
  if (msUntilDeadline < TWENTY_FOUR_HOURS_MS) return 'high'
  if (msUntilDeadline <= FORTY_EIGHT_HOURS_MS) return 'medium'
  return 'safe'
}

interface GamesActiveSectionProps {
  readonly initialGames: ExtendedGameData[]
  readonly initialGameGuesses: Record<string, GameGuessNew>
  readonly initialTeamsMap: Record<string, Team>
  readonly initialUrgencyLevel: UrgencyLevel
  readonly initialUrgentGameIds: string[]
  readonly initialPredicted: number
  readonly totalGames: number
  readonly tournamentMaxSilver: number
  readonly tournamentMaxGolden: number
  readonly tournamentId: string
  readonly gamesHref: string
  readonly cardTitle: string
}

/**
 * Client-side owner of the active games carousel.
 *
 * Holds all dynamic carousel state (games, guesses, urgency) locally so it can
 * be independently refreshed without touching the rest of the hub page.
 * When all urgent games are predicted, calls getActionCenterGames directly and
 * replaces state with the fresh server response. The key prop on
 * GuessesContextProvider forces a clean remount — resetting both the guess
 * context and the delta snapshot in GamesActiveClient — so the header counter
 * reflects the server's updated predictedGames count.
 */
export function GamesActiveSection({
  initialGames,
  initialGameGuesses,
  initialTeamsMap,
  initialUrgencyLevel,
  initialUrgentGameIds,
  initialPredicted,
  totalGames,
  tournamentMaxSilver,
  tournamentMaxGolden,
  tournamentId,
  gamesHref,
  cardTitle,
}: GamesActiveSectionProps) {
  const locale = toLocale(useLocale())

  const [games, setGames] = useState(initialGames)
  const [gameGuesses, setGameGuesses] = useState(initialGameGuesses)
  const [teamsMap, setTeamsMap] = useState(initialTeamsMap)
  const [urgencyLevel, setUrgencyLevel] = useState(initialUrgencyLevel)
  const [urgentGameIds, setUrgentGameIds] = useState(initialUrgentGameIds)
  const [predicted, setPredicted] = useState(initialPredicted)
  const [refetchKey, setRefetchKey] = useState(0)

  const handleAllUrgentComplete = useCallback(async () => {
    try {
      const fresh = await getActionCenterGames(tournamentId, locale)
      setGames(fresh.games)
      setGameGuesses(fresh.gameGuesses)
      setTeamsMap(fresh.teamsMap)
      setUrgencyLevel(computeUrgencyLevel(fresh))
      setUrgentGameIds(fresh.mode === 'urgent' ? fresh.games.map((g) => g.id) : [])
      setPredicted(fresh.predictedGames)
      // Increment key to remount GuessesContextProvider and GamesActiveClient —
      // this resets the guess context and the delta snapshot simultaneously.
      setRefetchKey((k) => k + 1)
    } catch (err) {
      console.error('[GamesActiveSection] Refetch failed:', err)
    }
  }, [tournamentId, locale])

  return (
    <GuessesContextProvider
      key={refetchKey}
      gameGuesses={gameGuesses}
      autoSave={true}
      tournamentMaxSilver={tournamentMaxSilver}
      tournamentMaxGolden={tournamentMaxGolden}
    >
      <GamesActiveClient
        games={games}
        teamsMap={teamsMap}
        tournamentId={tournamentId}
        gamesHref={gamesHref}
        urgencyLevel={urgencyLevel}
        cardTitle={cardTitle}
        initialPredicted={predicted}
        totalGames={totalGames}
        urgentGameIds={urgentGameIds}
        onAllUrgentComplete={handleAllUrgentComplete}
      />
    </GuessesContextProvider>
  )
}
