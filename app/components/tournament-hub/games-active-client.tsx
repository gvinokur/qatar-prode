'use client'

import React, { useContext, useEffect, useRef, useState } from 'react'
import { Box, Button, IconButton, Stack, Typography } from '@mui/material'
import {
  Error as ErrorIcon,
  Info as InfoIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  SportsSoccer as SportsSoccerIcon,
  WarningAmber as WarningAmberIcon,
} from '@mui/icons-material'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import FlippableGameCard from '../flippable-game-card'
import { DashboardCard } from './dashboard-card'
import { GuessesContext } from '../context-providers/guesses-context-provider'
import { isGuessComplete, countCompleteGuesses } from '../../utils/guess-utils'
import type { ExtendedGameData } from '../../definitions'
import type { Team } from '../../db/tables-definition'

type UrgencyLevel = 'critical' | 'high' | 'medium' | 'safe' | 'empty'

interface GamesActiveClientProps {
  readonly games: ExtendedGameData[]
  readonly teamsMap: Record<string, Team>
  readonly tournamentId: string
  readonly gamesHref: string
  readonly urgencyLevel: UrgencyLevel
  readonly cardTitle: string
  readonly initialPredicted: number
  readonly totalGames: number
  /** IDs of games that were in urgent mode at server render / last refetch time */
  readonly urgentGameIds: string[]
  /**
   * Called once when all urgentGameIds become complete. The parent (GamesActiveSection)
   * uses this to fetch fresh carousel data and remount this component with updated state.
   */
  readonly onAllUrgentComplete: () => Promise<void>
}

export function GamesActiveClient({
  games,
  teamsMap,
  tournamentId,
  gamesHref,
  urgencyLevel,
  cardTitle,
  initialPredicted,
  totalGames,
  urgentGameIds,
  onAllUrgentComplete,
}: GamesActiveClientProps) {
  const t = useTranslations('hub')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [editingGameId, setEditingGameId] = useState<string | null>(null)
  const { gameGuesses } = useContext(GuessesContext)

  // Snapshot initial guesses on first render — used as baseline for delta tracking.
  // The header counter tracks tournament-wide completion: initialPredicted (server) + delta
  // from predictions made/removed during this session. On refetch, the component remounts
  // (key change in GamesActiveSection) so the snapshot resets alongside initialPredicted.
  const initialGuessesRef = useRef(gameGuesses)
  const initialWindowPredicted = countCompleteGuesses(initialGuessesRef.current, games)
  const currentWindowPredicted = countCompleteGuesses(gameGuesses, games)
  const delta = currentWindowPredicted - initialWindowPredicted
  const adjustedPredicted = initialPredicted + delta

  // When all originally-urgent games become completely predicted, call the refetch callback.
  // urgentRemaining is also used for the urgency message count (scoped to the carousel window).
  const urgentRemaining = urgentGameIds.filter((id) => {
    const game = games.find((g) => g.id === id)
    return !isGuessComplete(gameGuesses[id], !!game?.playoffStage)
  }).length
  const effectiveIsUrgent = urgentGameIds.length > 0 && urgentRemaining > 0
  const effectiveUrgencyLevel: UrgencyLevel = effectiveIsUrgent
    ? urgencyLevel
    : urgencyLevel !== 'empty'
      ? 'safe'
      : 'empty'

  // Fire once when all urgent games are complete — triggers a client-side refetch of
  // carousel data so the next batch of upcoming games loads without a full page refresh.
  const refetchTriggeredRef = useRef(false)
  useEffect(() => {
    if (urgentGameIds.length > 0 && urgentRemaining === 0 && !refetchTriggeredRef.current) {
      refetchTriggeredRef.current = true
      onAllUrgentComplete()
    }
  }, [urgentRemaining, urgentGameIds, onAllUrgentComplete])

  const currentGame = games[currentIndex]
  const guess = currentGame ? gameGuesses[currentGame.id] : undefined

  const handleUp = () => setCurrentIndex((i) => Math.max(0, i - 1))
  const handleDown = () => setCurrentIndex((i) => Math.min(games.length - 1, i + 1))

  const renderStatusRow = () => {
    if (effectiveUrgencyLevel === 'empty') return null

    let icon: React.ReactNode = null
    let message: string

    if (effectiveUrgencyLevel === 'critical') {
      icon = <ErrorIcon color="error" fontSize="small" />
      message = t('gamesWidget.urgentMessage', { count: urgentRemaining })
    } else if (effectiveUrgencyLevel === 'high') {
      icon = <WarningAmberIcon color="warning" fontSize="small" />
      message = t('gamesWidget.urgentMessage', { count: urgentRemaining })
    } else if (effectiveUrgencyLevel === 'medium') {
      icon = <InfoIcon color="info" fontSize="small" />
      message = t('gamesWidget.urgentMessage', { count: urgentRemaining })
    } else {
      // safe — show regardless of which card is currently visible;
      // the message reflects the overall list state, not the current card
      message = t('gamesWidget.safeMessage')
    }

    return (
      <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5} sx={{ my: 1 }}>
        {icon}
        <Typography variant="body2" color="text.secondary" textAlign="center">
          {message}
        </Typography>
      </Stack>
    )
  }

  if (!currentGame) return null

  return (
    <DashboardCard
      title={cardTitle}
      icon={<SportsSoccerIcon />}
      count={`${adjustedPredicted}/${totalGames}`}
      urgent={effectiveIsUrgent}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {renderStatusRow()}

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <FlippableGameCard
              game={currentGame}
              teamsMap={teamsMap}
              isPlayoffs={!!currentGame.playoffStage}
              tournamentId={tournamentId}
              homeScore={guess?.home_score}
              awayScore={guess?.away_score}
              homePenaltyWinner={guess?.home_penalty_winner}
              awayPenaltyWinner={guess?.away_penalty_winner}
              boostType={guess?.boost_type}
              initialBoostType={guess?.boost_type}
              isEditing={editingGameId === currentGame.id}
              onEditStart={() => setEditingGameId(currentGame.id)}
              onEditEnd={() => setEditingGameId(null)}
            />
          </Box>
          {games.length > 1 && (
            <Stack sx={{ justifyContent: 'center', gap: 1, ml: 0.5 }}>
              <IconButton
                size="small"
                disabled={currentIndex === 0}
                onClick={handleUp}
                aria-label="previous game"
                sx={{ border: '1px solid', borderColor: 'divider', '&.Mui-disabled': { opacity: 0.3 } }}
              >
                <KeyboardArrowUpIcon fontSize="small" />
              </IconButton>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: currentIndex === 0 ? 'primary.main' : 'divider' }} />
                <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: currentIndex > 0 && currentIndex < games.length - 1 ? 'primary.main' : 'divider' }} />
                <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: currentIndex === games.length - 1 ? 'primary.main' : 'divider' }} />
              </Box>
              <IconButton
                size="small"
                disabled={currentIndex === games.length - 1}
                onClick={handleDown}
                aria-label="next game"
                sx={{ border: '1px solid', borderColor: 'divider', '&.Mui-disabled': { opacity: 0.3 } }}
              >
                <KeyboardArrowDownIcon fontSize="small" />
              </IconButton>
            </Stack>
          )}
        </Box>

        <Button
          component={Link}
          href={gamesHref}
          variant="text"
          size="small"
          fullWidth
        >
          {t('gamesWidget.ctaViewAll')}
        </Button>
      </Box>
    </DashboardCard>
  )
}
