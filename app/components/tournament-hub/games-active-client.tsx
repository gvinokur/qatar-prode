'use client'

import React, { useContext, useState } from 'react'
import { Box, Button, IconButton, Stack, Typography } from '@mui/material'
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Error as ErrorIcon,
  InfoOutlined as InfoOutlinedIcon,
  WarningAmber as WarningAmberIcon,
} from '@mui/icons-material'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import FlippableGameCard from '../flippable-game-card'
import { GuessesContext } from '../context-providers/guesses-context-provider'
import type { ExtendedGameData } from '../../definitions'
import type { Team } from '../../db/tables-definition'

interface GamesActiveClientProps {
  readonly games: ExtendedGameData[]
  readonly teamsMap: Record<string, Team>
  readonly tournamentId: string
  readonly gamesHref: string
  readonly mode: 'urgent' | 'fallback' | 'empty'
  readonly urgencyLevel: 'critical' | 'high' | 'medium' | 'safe' | 'empty'
  readonly unpredictedCount: number
}

export function GamesActiveClient({
  games,
  teamsMap,
  tournamentId,
  gamesHref,
  urgencyLevel,
  unpredictedCount,
}: GamesActiveClientProps) {
  const t = useTranslations('hub')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [editingGameId, setEditingGameId] = useState<string | null>(null)
  const { gameGuesses } = useContext(GuessesContext)

  const currentGame = games[currentIndex]
  const guess = currentGame ? gameGuesses[currentGame.id] : undefined

  const handleLeft = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1)
  }
  const handleRight = () => {
    if (currentIndex < games.length - 1) setCurrentIndex((i) => i + 1)
  }

  const renderStatusRow = () => {
    if (urgencyLevel === 'empty') return null

    let icon: React.ReactNode = null
    let message: string

    if (urgencyLevel === 'critical') {
      icon = <ErrorIcon color="error" fontSize="small" />
      message = t('gamesWidget.urgentMessage', { count: unpredictedCount })
    } else if (urgencyLevel === 'high') {
      icon = <WarningAmberIcon color="warning" fontSize="small" />
      message = t('gamesWidget.urgentMessage', { count: unpredictedCount })
    } else if (urgencyLevel === 'medium') {
      icon = <InfoOutlinedIcon color="info" fontSize="small" />
      message = t('gamesWidget.urgentMessage', { count: unpredictedCount })
    } else {
      // safe — only show when the current game is already predicted
      if (!guess) return null
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
  )
}
