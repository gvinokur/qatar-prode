'use client'

import React, { useState } from 'react'
import { Box, Typography } from '@mui/material'
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
        <Box sx={{ mb: 1 }}>
          <Typography variant="h6">{t('actionCenter.title')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        </Box>

        {data.mode === 'empty' ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
            {t('actionCenter.emptyState')}
          </Typography>
        ) : (
          <ScrollShadowContainer
            direction="horizontal"
            hideScrollbar={true}
            scrollContainerSx={{ display: 'flex', gap: 2, pb: 1 }}
          >
            {data.games.map((game) => {
              const guess = data.gameGuesses[game.id]
              return (
                <Box key={game.id} sx={{ minWidth: 280, maxWidth: 340, flexShrink: 0 }}>
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
