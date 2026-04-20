'use client'

import React, { useState } from 'react'
import {
  Box,
  Stack,
  Typography,
  Button,
  CircularProgress,
} from '@mui/material'
import {
  CalendarToday as CalendarTodayIcon,
  AccountTree as AccountTreeIcon,
  EmojiEvents as EmojiEventsIcon,
  SportsSoccer as SportsSoccerIcon,
} from '@mui/icons-material'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { GuessesContextProvider } from '../context-providers/guesses-context-provider'
import { ScrollShadowContainer } from '../common/scroll-shadow-container'
import FlippableGameCard from '../flippable-game-card'
import { ActionCenterData } from '../../actions/hub-actions'
import type { Locale } from '../../../i18n.config'
import { PreTournamentCountdown } from './pre-tournament-hero'
import { TournamentStartBanner } from './tournament-start-banner'

interface ActionCenterCarouselProps {
  readonly data: ActionCenterData
  readonly tournamentId: string
  readonly locale: Locale
}

/** Renders a CircularProgress with a visible grey track and an icon centered inside. */
function TrackedCircularProgress({ value, icon }: { value: number; icon: React.ReactNode }) {
  return (
    <Box
      sx={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Track (always-visible background ring) */}
      <CircularProgress
        variant="determinate"
        value={100}
        size={64}
        sx={{ color: 'action.selected', position: 'absolute', top: 0, left: 0 }}
      />
      {/* Actual progress */}
      <CircularProgress variant="determinate" value={value} size={64} color="secondary" />
      {/* Icon centered inside the circle */}
      <Box
        sx={{
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </Box>
    </Box>
  )
}

export function ActionCenterCarousel({ data, tournamentId, locale }: ActionCenterCarouselProps) {
  const t = useTranslations('hub')
  const [editingGameId, setEditingGameId] = useState<string | null>(null)

  const subtitle =
    data.mode === 'fallback' ? t('actionCenter.fallbackSubtitle') : t('actionCenter.subtitle')

  const gamesUrl = `/${locale}/tournaments/${tournamentId}`
  const qualifiedTeamsUrl = `/${locale}/tournaments/${tournamentId}/qualified-teams`
  const awardsUrl = `/${locale}/tournaments/${tournamentId}/awards`
  const gamesCircleUrl = `/${locale}/tournaments/${tournamentId}/games`

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

  const gamesProgress =
    data.totalGames === 0 ? 0 : Math.round((data.predictedGames / data.totalGames) * 100)
  const awardsProgress =
    data.awardsTotal === 0 ? 0 : Math.round((data.awardsCompleted / data.awardsTotal) * 100)
  const qtProgress =
    data.qualifiersTotal === 0
      ? 0
      : Math.round((data.qualifiersCompleted / data.qualifiersTotal) * 100)

  return (
    <GuessesContextProvider
      gameGuesses={data.gameGuesses}
      autoSave={true}
      tournamentMaxSilver={data.tournamentMaxSilver}
      tournamentMaxGolden={data.tournamentMaxGolden}
    >
      <Box>
        {/* Celebration banner — shown above everything for 48h after tournament starts */}
        {data.tournamentJustStarted && (
          <TournamentStartBanner locale={locale} tournamentId={tournamentId} />
        )}

        {/* Countdown — shown before the tournament starts */}
        {!data.tournamentHasStarted && data.firstGameDate !== null && (
          <PreTournamentCountdown firstGameDate={data.firstGameDate} />
        )}

        {/* Header — centered */}
        <Box sx={{ mb: 1, textAlign: 'center' }}>
          <Typography variant="h6">{t('actionCenter.title')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        </Box>

        {/* Opener label — shown when the carousel was backfilled with the first tournament game */}
        {data.openerBackfill && (
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ display: 'block', textAlign: 'center', mb: 0.5 }}
          >
            {t('preTournament.openerLabel')}
          </Typography>
        )}

        {data.mode === 'empty' ? (
          /* Empty state — no games and no opener to backfill */
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
          /* Game carousel — includes opener when openerBackfill=true */
          <ScrollShadowContainer
            direction="horizontal"
            hideScrollbar={true}
            scrollContainerSx={{
              display: 'flex',
              gap: 2,
              pb: 1,
              ...(data.games.length === 1 ? { justifyContent: 'center' } : {}),
            }}
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

        {/* Prediction progress — circular progress row replacing the old quick-action cards */}
        {data.qtAndAwardsOpen && (
          <Stack direction="row" justifyContent="space-around" sx={{ mt: 2 }}>
            {/* Qualified Teams */}
            <Box
              component={Link}
              href={qualifiedTeamsUrl}
              sx={{
                textDecoration: 'none',
                color: 'inherit',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              <TrackedCircularProgress
                value={qtProgress}
                icon={<AccountTreeIcon sx={{ color: 'text.secondary', fontSize: 22 }} />}
              />
              <Box>
                <Typography variant="body2" fontWeight={500}>
                  {t('preTournament.qtLabel')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {data.qualifiersCompleted}/{data.qualifiersTotal}
                </Typography>
              </Box>
            </Box>

            {/* Awards */}
            <Box
              component={Link}
              href={awardsUrl}
              sx={{
                textDecoration: 'none',
                color: 'inherit',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              <TrackedCircularProgress
                value={awardsProgress}
                icon={<EmojiEventsIcon sx={{ color: 'text.secondary', fontSize: 22 }} />}
              />
              <Box>
                <Typography variant="body2" fontWeight={500}>
                  {t('preTournament.awardsLabel')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {data.awardsCompleted}/{data.awardsTotal}
                </Typography>
              </Box>
            </Box>

            {/* Games */}
            <Box
              component={Link}
              href={gamesCircleUrl}
              sx={{
                textDecoration: 'none',
                color: 'inherit',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              <TrackedCircularProgress
                value={gamesProgress}
                icon={<SportsSoccerIcon sx={{ color: 'text.secondary', fontSize: 22 }} />}
              />
              <Box>
                <Typography variant="body2" fontWeight={500}>
                  {t('preTournament.gamesLabel')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('preTournament.gamesOfTotal', {
                    predicted: data.predictedGames,
                    total: data.totalGames,
                  })}
                </Typography>
              </Box>
            </Box>
          </Stack>
        )}
      </Box>
    </GuessesContextProvider>
  )
}
