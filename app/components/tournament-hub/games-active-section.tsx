'use client'

import React, { useCallback, useState } from 'react'
import { useLocale } from 'next-intl'
import { toLocale } from '../../utils/locale-utils'
import { GamesActiveClient } from './games-active-client'
import { GuessesContextProvider } from '../context-providers/guesses-context-provider'
import { getCarouselGames } from '../../actions/hub-actions'
import { computeUrgencyLevel, type UrgencyLevel } from '../../utils/urgency-utils'
import type { ExtendedGameData } from '../../definitions'
import type { Team, GameGuessNew } from '../../db/tables-definition'

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
  /** Tournament-wide silver boost count at page-load time — used as baseline for delta tracking */
  readonly initialSilverUsed: number
  /** Tournament-wide golden boost count at page-load time — used as baseline for delta tracking */
  readonly initialGoldenUsed: number
  readonly tournamentId: string
  readonly gamesHref: string
  readonly cardTitle: string
}

/**
 * Client-side owner of the active games carousel.
 *
 * Holds all dynamic carousel state (games, guesses, urgency, predicted count, boost counts)
 * locally so it can be independently refreshed without touching the rest of the hub page.
 * When all urgent games are predicted, calls getCarouselGames (lightweight — no
 * getTournamentPredictionCompletion) and replaces state with the fresh response.
 * The key prop on GuessesContextProvider forces a clean remount — resetting both the guess
 * context and the delta snapshot in GamesActiveClient — so the header counter reflects the
 * server's updated predictedGames count.
 *
 * Boost counts: GuessesContextProvider receives tournament-wide baseline counts (silverUsed /
 * goldenUsed) and computes the final used count by adding the carousel-session delta internally.
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
  initialSilverUsed,
  initialGoldenUsed,
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
  const [silverUsed, setSilverUsed] = useState(initialSilverUsed)
  const [goldenUsed, setGoldenUsed] = useState(initialGoldenUsed)
  const [refetchKey, setRefetchKey] = useState(0)

  const handleAllUrgentComplete = useCallback(async () => {
    try {
      const fresh = await getCarouselGames(tournamentId, locale)
      setGames(fresh.games)
      setGameGuesses(fresh.gameGuesses)
      setTeamsMap(fresh.teamsMap)
      setUrgencyLevel(computeUrgencyLevel(fresh))
      setUrgentGameIds(fresh.urgentGameIds)
      setPredicted(fresh.predictedGames)
      setSilverUsed(fresh.silverBoostsUsed)
      setGoldenUsed(fresh.goldenBoostsUsed)
      // Increment key to remount GuessesContextProvider and GamesActiveClient —
      // this resets the guess context and the delta snapshots simultaneously.
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
      tournamentSilverUsed={silverUsed}
      tournamentGoldenUsed={goldenUsed}
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
