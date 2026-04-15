'use client'

import React, { useState } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Chip,
} from '@mui/material'
import {
  CalendarToday as CalendarTodayIcon,
  EmojiEvents as EmojiEventsIcon,
  Groups as GroupsIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { GuessesContextProvider } from '../context-providers/guesses-context-provider'
import { ScrollShadowContainer } from '../common/scroll-shadow-container'
import FlippableGameCard from '../flippable-game-card'
import { ActionCenterData } from '../../actions/hub-actions'
import { getUrgencyLevel, formatCountdown } from '../../utils/countdown-utils'
import type { Locale } from '../../../i18n.config'

interface ActionCenterCarouselProps {
  readonly data: ActionCenterData
  readonly tournamentId: string
  readonly locale: Locale
}

export function ActionCenterCarousel({ data, tournamentId, locale }: ActionCenterCarouselProps) {
  const t = useTranslations('hub')
  const [editingGameId, setEditingGameId] = useState<string | null>(null)

  const subtitle =
    data.mode === 'fallback' ? t('actionCenter.fallbackSubtitle') : t('actionCenter.subtitle')

  const gamesUrl = `/${locale}/tournaments/${tournamentId}`
  const qualifiedTeamsUrl = `/${locale}/tournaments/${tournamentId}/qualified-teams`
  const awardsUrl = `/${locale}/tournaments/${tournamentId}/awards`

  const handleEditStart = (gameId: string) => setEditingGameId(gameId)
  const handleEditEnd = () => setEditingGameId(null)

  const handleAutoAdvanceNext = (gameId: string) => {
    const index = data.games.findIndex((g) => g.id === gameId)
    setEditingGameId(
      index !== -1 && index < data.games.length - 1 ? data.games[index + 1].id : null
    )
  }

  const handleAutoGoPrevious = (gameId: string) => {
    const index = data.games.findIndex((g) => g.id === gameId)
    setEditingGameId(index > 0 ? data.games[index - 1].id : null)
  }

  const urgency = getUrgencyLevel(data.msUntilPredictionLock)
  const showUrgencyChip = data.qtAndAwardsOpen && urgency !== 'safe'
  const urgencyChipColor =
    urgency === 'urgent' ? 'error' : urgency === 'warning' ? 'warning' : 'info'
  const countdownText = showUrgencyChip ? formatCountdown(data.msUntilPredictionLock) : ''

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

        {/* Game carousel or empty state */}
        {data.mode === 'empty' ? (
          <Box
            sx={{
              width: '100%',
              py: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              border: '1px dashed',
              borderColor: 'divider',
              borderRadius: 1,
            }}
          >
            <CalendarTodayIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
            <Typography variant="body1" color="text.secondary" fontWeight={500}>
              {t('actionCenter.noGamesInWindow')}
            </Typography>
            <Button component={Link} href={gamesUrl} variant="outlined" size="small">
              {t('actionCenter.predictGames')}
            </Button>
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
                <Box key={game.id} sx={{ minWidth: { xs: 280, sm: 440 }, flexShrink: 0 }}>
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

        {/* Quick-action cards — only shown when QT/Awards predictions are still open */}
        {data.qtAndAwardsOpen && (
          <Box sx={{ mt: 2 }}>
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ display: 'block', textAlign: 'center', mb: 1 }}
            >
              {t('actionCenter.quickActions')}
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent sx={{ pb: 0 }}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.5 }}>
                      <GroupsIcon color="primary" fontSize="small" />
                      <Typography variant="subtitle2">
                        {t('actionCenter.qualifiedTeamsTitle')}
                      </Typography>
                      {showUrgencyChip && (
                        <Chip
                          label={countdownText}
                          color={urgencyChipColor}
                          size="small"
                          icon={<ScheduleIcon />}
                          sx={{ ml: 'auto' }}
                          data-testid="urgency-chip-qt"
                        />
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {t('actionCenter.qualifiedTeamsHint')}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button component={Link} href={qualifiedTeamsUrl} size="small">
                      {t('actionCenter.goToPage')}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent sx={{ pb: 0 }}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.5 }}>
                      <EmojiEventsIcon color="primary" fontSize="small" />
                      <Typography variant="subtitle2">
                        {t('actionCenter.awardsTitle')}
                      </Typography>
                      {showUrgencyChip && (
                        <Chip
                          label={countdownText}
                          color={urgencyChipColor}
                          size="small"
                          icon={<ScheduleIcon />}
                          sx={{ ml: 'auto' }}
                          data-testid="urgency-chip-awards"
                        />
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {t('actionCenter.awardsHint')}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button component={Link} href={awardsUrl} size="small">
                      {t('actionCenter.goToPage')}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}
      </Box>
    </GuessesContextProvider>
  )
}
