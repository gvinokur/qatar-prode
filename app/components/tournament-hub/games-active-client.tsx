'use client'

import React, { useContext, useRef, useState } from 'react'
import { Box, Button, IconButton, Stack, Typography } from '@mui/material'
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Error as ErrorIcon,
  InfoOutlined as InfoOutlinedIcon,
  SportsSoccer as SportsSoccerIcon,
  WarningAmber as WarningAmberIcon,
} from '@mui/icons-material'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import FlippableGameCard from '../flippable-game-card'
import { DashboardCard } from './dashboard-card'
import { GuessesContext } from '../context-providers/guesses-context-provider'
import type { ExtendedGameData } from '../../definitions'
import type { Team, GameGuessNew } from '../../db/tables-definition'

/** Mirrors the server-side completion check in getTournamentPredictionCompletion. */
function isGuessComplete(guess: GameGuessNew | undefined, isPlayoff: boolean): boolean {
  if (!guess) return false
  if (guess.home_score === null || guess.home_score === undefined) return false
  if (guess.away_score === null || guess.away_score === undefined) return false
  // Tied playoff games require a penalty winner to be truly complete
  if (isPlayoff && guess.home_score === guess.away_score) {
    return !!(guess.home_penalty_winner || guess.away_penalty_winner)
  }
  return true
}

function countCompleteInWindow(
  guessMap: Record<string, GameGuessNew>,
  windowGames: ExtendedGameData[]
): number {
  return windowGames.filter((g) => isGuessComplete(guessMap[g.id], !!g.playoffStage)).length
}

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
  /** IDs of games that were in urgent mode at server render time */
  readonly urgentGameIds: string[]
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
}: GamesActiveClientProps) {
  const t = useTranslations('hub')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [editingGameId, setEditingGameId] = useState<string | null>(null)
  const { gameGuesses } = useContext(GuessesContext)

  // Snapshot initial guesses on first render — used as baseline for delta tracking
  const initialGuessesRef = useRef(gameGuesses)

  // Delta: net change in COMPLETE predictions among window games.
  // Uses the same completion criteria as the server: both scores present, and for tied
  // playoff games a penalty winner must be selected. initialPredicted (server) already
  // includes all tournament predictions, so adding the delta gives an accurate live count.
  const initialWindowPredicted = countCompleteInWindow(initialGuessesRef.current, games)
  const currentWindowPredicted = countCompleteInWindow(gameGuesses, games)
  const delta = currentWindowPredicted - initialWindowPredicted

  const adjustedPredicted = initialPredicted + delta
  const adjustedUnpredicted = totalGames - adjustedPredicted

  // When all originally-urgent games become completely predicted, transition to safe mode
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

  const currentGame = games[currentIndex]
  const guess = currentGame ? gameGuesses[currentGame.id] : undefined
  const isCurrentGameComplete = isGuessComplete(guess, !!currentGame?.playoffStage)

  const handleLeft = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1)
  }
  const handleRight = () => {
    if (currentIndex < games.length - 1) setCurrentIndex((i) => i + 1)
  }

  const renderStatusRow = () => {
    if (effectiveUrgencyLevel === 'empty') return null

    let icon: React.ReactNode = null
    let message: string

    if (effectiveUrgencyLevel === 'critical') {
      icon = <ErrorIcon color="error" fontSize="small" />
      message = t('gamesWidget.urgentMessage', { count: adjustedUnpredicted })
    } else if (effectiveUrgencyLevel === 'high') {
      icon = <WarningAmberIcon color="warning" fontSize="small" />
      message = t('gamesWidget.urgentMessage', { count: adjustedUnpredicted })
    } else if (effectiveUrgencyLevel === 'medium') {
      icon = <InfoOutlinedIcon color="info" fontSize="small" />
      message = t('gamesWidget.urgentMessage', { count: adjustedUnpredicted })
    } else {
      // safe — only show when the current game has a complete prediction
      if (!isCurrentGameComplete) return null
      message = t('gamesWidget.safeMessage')
    }

    return (
      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 1 }}>
        {icon}
        <Typography variant="body2" color="text.secondary">
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

        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton
            size="small"
            onClick={handleLeft}
            disabled={currentIndex === 0}
            aria-label="previous game"
          >
            <ChevronLeftIcon />
          </IconButton>

          <Box sx={{ flexGrow: 1 }}>
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

          <IconButton
            size="small"
            onClick={handleRight}
            disabled={currentIndex === games.length - 1}
            aria-label="next game"
          >
            <ChevronRightIcon />
          </IconButton>
        </Stack>

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
