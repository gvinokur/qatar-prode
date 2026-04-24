'use client'

import React, { useState } from 'react'
import {
  Box,
  IconButton,
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
  KeyboardArrowUp as KeyboardArrowUpIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
} from '@mui/icons-material'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { GuessesContextProvider } from '../context-providers/guesses-context-provider'
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
function TrackedCircularProgress({ value, icon }: { readonly value: number; readonly icon: React.ReactNode }) {
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

interface VerticalNavProps {
  readonly current: number
  readonly total: number
  readonly onUp: () => void
  readonly onDown: () => void
}

function VerticalNav({ current, total, onUp, onDown }: VerticalNavProps) {
  return (
    <Stack sx={{ justifyContent: 'center', gap: 1, ml: 0.5 }}>
      <IconButton
        size="small"
        disabled={current === 0}
        onClick={onUp}
        aria-label="previous"
        sx={{ border: '1px solid', borderColor: 'divider', '&.Mui-disabled': { opacity: 0.3 } }}
      >
        <KeyboardArrowUpIcon fontSize="small" />
      </IconButton>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
        <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: current === 0 ? 'primary.main' : 'divider' }} />
        <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: current > 0 && current < total - 1 ? 'primary.main' : 'divider' }} />
        <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: current === total - 1 ? 'primary.main' : 'divider' }} />
      </Box>
      <IconButton
        size="small"
        disabled={current === total - 1}
        onClick={onDown}
        aria-label="next"
        sx={{ border: '1px solid', borderColor: 'divider', '&.Mui-disabled': { opacity: 0.3 } }}
      >
        <KeyboardArrowDownIcon fontSize="small" />
      </IconButton>
    </Stack>
  )
}

export function ActionCenterCarousel({ data, tournamentId, locale }: ActionCenterCarouselProps) {
  const t = useTranslations('hub')
  const [editingGameId, setEditingGameId] = useState<string | null>(null)
  const [visibleIndex, setVisibleIndex] = useState(0)

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
    if (index !== -1 && index < data.games.length - 1) {
      setEditingGameId(data.games[index + 1].id)
      setVisibleIndex((i) => Math.min(data.games.length - 1, i + 1))
    } else {
      setEditingGameId(null)
    }
  }

  const handleAutoGoPrevious = (gameId: string) => {
    const index = data.games.findIndex((g) => g.id === gameId)
    if (index > 0) {
      setEditingGameId(data.games[index - 1].id)
      setVisibleIndex((i) => Math.max(0, i - 1))
    } else {
      setEditingGameId(null)
    }
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
        {data.tournamentJustStarted && <TournamentStartBanner />}

        {/* Countdown — shown before the tournament starts */}
        {!data.tournamentHasStarted && data.firstGameDate !== null && (
          <PreTournamentCountdown
            firstGameDate={data.firstGameDate}
            tournamentName={data.tournamentName}
          />
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
          /* Single-card view with vertical navigation */
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {data.games[visibleIndex] && (() => {
                const game = data.games[visibleIndex]
                const guess = data.gameGuesses[game.id]
                return (
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
                )
              })()}
            </Box>
            {data.games.length > 1 && (
              <VerticalNav
                current={visibleIndex}
                total={data.games.length}
                onUp={() => setVisibleIndex((i) => Math.max(0, i - 1))}
                onDown={() => setVisibleIndex((i) => Math.min(data.games.length - 1, i + 1))}
              />
            )}
          </Box>
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
