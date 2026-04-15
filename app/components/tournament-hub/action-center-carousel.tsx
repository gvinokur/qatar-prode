'use client'

import React, { useState } from 'react'
import { Box, Typography } from '@mui/material'
import { CalendarToday as CalendarTodayIcon } from '@mui/icons-material'
import { useTranslations } from 'next-intl'
import { GuessesContextProvider } from '../context-providers/guesses-context-provider'
import { ScrollShadowContainer } from '../common/scroll-shadow-container'
import FlippableGameCard from '../flippable-game-card'
import { ActionCenterData } from '../../actions/hub-actions'
import type { Locale } from '../../../i18n.config'

interface ActionCenterCarouselProps {
  readonly data: ActionCenterData
  readonly tournamentId: string
  readonly locale: Locale
}

export function ActionCenterCarousel({ data, tournamentId }: ActionCenterCarouselProps) {
  const t = useTranslations('hub')
  const [editingGameId, setEditingGameId] = useState<string | null>(null)

  const subtitle =
    data.mode === 'fallback' ? t('actionCenter.fallbackSubtitle') : t('actionCenter.subtitle')

  const handleEditStart = (gameId: string) => {
    setEditingGameId(gameId)
  }

  const handleEditEnd = () => {
    setEditingGameId(null)
  }

  const handleAutoAdvanceNext = (gameId: string) => {
    const index = data.games.findIndex((g) => g.id === gameId)
    if (index !== -1 && index < data.games.length - 1) {
      setEditingGameId(data.games[index + 1].id)
    } else {
      setEditingGameId(null)
    }
  }

  const handleAutoGoPrevious = (gameId: string) => {
    const index = data.games.findIndex((g) => g.id === gameId)
    if (index > 0) {
      setEditingGameId(data.games[index - 1].id)
    } else {
      setEditingGameId(null)
    }
  }

  return (
    <GuessesContextProvider
      gameGuesses={data.gameGuesses}
      autoSave={true}
      tournamentMaxSilver={data.tournamentMaxSilver}
      tournamentMaxGolden={data.tournamentMaxGolden}
    >
      <Box>
        {/* Header — centered */}
        <Box sx={{ mb: 1, textAlign: 'center' }}>
          <Typography variant="h6">{t('actionCenter.title')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        </Box>

        {data.mode === 'empty' ? (
          /* Empty state — full width placeholder */
          <Box
            sx={{
              width: '100%',
              py: 5,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1,
              border: '1px dashed',
              borderColor: 'divider',
              borderRadius: 1,
            }}
          >
            <CalendarTodayIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 0.5 }} />
            <Typography variant="body1" color="text.secondary" fontWeight={500}>
              {t('actionCenter.emptyState')}
            </Typography>
            <Typography
              variant="caption"
              color="text.disabled"
              sx={{ textAlign: 'center', maxWidth: 300 }}
            >
              {t('actionCenter.emptyStateHint')}
            </Typography>
          </Box>
        ) : (
          <ScrollShadowContainer
            direction="horizontal"
            hideScrollbar={true}
            scrollContainerSx={{ display: 'flex', gap: 2, pb: 1 }}
          >
            {data.games.map((game) => {
              const guess = data.gameGuesses[game.id]
              return (
                <Box
                  key={game.id}
                  sx={{ minWidth: { xs: 280, sm: 440 }, flexShrink: 0 }}
                >
                  <FlippableGameCard
                    game={game}
                    teamsMap={data.teamsMap}
                    isPlayoffs={!!game.playoffStage}
                    tournamentId={tournamentId}
                    homeScore={guess?.home_score}
                    awayScore={guess?.away_score}
                    homePenaltyWinner={guess?.home_penalty_winner}
                    awayPenaltyWinner={guess?.away_penalty_winner}
                    boostType={guess?.boost_type}
                    initialBoostType={guess?.boost_type}
                    isEditing={editingGameId === game.id}
                    onEditStart={() => handleEditStart(game.id)}
                    onEditEnd={handleEditEnd}
                    onAutoAdvanceNext={() => handleAutoAdvanceNext(game.id)}
                    onAutoGoPrevious={() => handleAutoGoPrevious(game.id)}
                  />
                </Box>
              )
            })}
          </ScrollShadowContainer>
        )}
      </Box>
    </GuessesContextProvider>
  )
}
