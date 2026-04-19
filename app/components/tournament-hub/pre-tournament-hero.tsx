'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Stack,
  Typography,
  CircularProgress,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import {
  AccountTree as AccountTreeIcon,
  EmojiEvents as EmojiEventsIcon,
  SportsSoccer as SportsSoccerIcon,
} from '@mui/icons-material'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import FlippableGameCard from '../flippable-game-card'
import { ExtendedGameData } from '../../definitions'
import { GameGuessNew, Team } from '../../db/tables-definition'
import type { Locale } from '../../../i18n.config'

// ---------------------------------------------------------------------------
// PreTournamentCountdown — exported separately so ActionCenterCarousel can
// render it ABOVE the "Action Center" header title.
// ---------------------------------------------------------------------------

interface PreTournamentCountdownProps {
  readonly firstGameDate: Date
}

interface TimeLeft {
  days: number
  hours: number
  mins: number
}

function computeTimeLeft(target: Date): TimeLeft {
  const diff = Math.max(0, target.getTime() - Date.now())
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return { days, hours, mins }
}

export function PreTournamentCountdown({ firstGameDate }: PreTournamentCountdownProps) {
  const t = useTranslations('hub')
  const theme = useTheme()
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => computeTimeLeft(firstGameDate))

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(computeTimeLeft(firstGameDate)), 1000)
    return () => clearInterval(id)
  }, [firstGameDate])

  return (
    <Paper
      sx={{
        background: `linear-gradient(135deg, ${theme.palette.secondary.main}14 0%, ${theme.palette.secondary.main}08 100%)`,
        border: '1px solid',
        borderColor: 'secondary.light',
        borderRadius: 2,
        p: 3,
        textAlign: 'center',
        mb: 2,
      }}
    >
      <Typography variant="overline" color="secondary">
        {t('preTournament.countdownTitle')}
      </Typography>
      <Stack direction="row" justifyContent="center" spacing={4} sx={{ mt: 1 }}>
        <Box textAlign="center">
          <Typography variant="h3" fontWeight="bold" color="secondary">
            {timeLeft.days}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t('preTournament.days')}
          </Typography>
        </Box>
        <Box textAlign="center">
          <Typography variant="h3" fontWeight="bold" color="secondary">
            {timeLeft.hours}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t('preTournament.hours')}
          </Typography>
        </Box>
        <Box textAlign="center">
          <Typography variant="h3" fontWeight="bold" color="secondary">
            {timeLeft.mins}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t('preTournament.mins')}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  )
}

// ---------------------------------------------------------------------------
// PreTournamentHero — opener game card + progress row.
// The countdown is now rendered separately (see PreTournamentCountdown above).
// ---------------------------------------------------------------------------

interface PreTournamentHeroProps {
  readonly openerGame: ExtendedGameData | null
  readonly tournamentId: string
  readonly locale: Locale
  readonly teamsMap: Record<string, Team>
  readonly gameGuesses: Record<string, GameGuessNew>
  readonly qtAndAwardsOpen: boolean
  readonly totalGames: number
  readonly predictedGames: number
  readonly awardsCompleted: number
  readonly awardsTotal: number
  readonly qualifiersCompleted: number
  readonly qualifiersTotal: number
}

/** Renders a CircularProgress with a visible grey track behind it. */
function TrackedCircularProgress({ value }: { value: number }) {
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      {/* Track (always-visible background ring) */}
      <CircularProgress
        variant="determinate"
        value={100}
        size={48}
        sx={{ color: 'action.selected', position: 'absolute', top: 0, left: 0 }}
      />
      {/* Actual progress */}
      <CircularProgress variant="determinate" value={value} size={48} color="secondary" />
    </Box>
  )
}

export default function PreTournamentHero({
  openerGame,
  tournamentId,
  locale,
  teamsMap,
  gameGuesses,
  qtAndAwardsOpen,
  totalGames,
  predictedGames,
  awardsCompleted,
  awardsTotal,
  qualifiersCompleted,
  qualifiersTotal,
}: PreTournamentHeroProps) {
  const t = useTranslations('hub')
  const theme = useTheme()
  const isDesktop = useMediaQuery(theme.breakpoints.up('sm'))
  const [isEditingOpener, setIsEditingOpener] = useState(false)

  const overallProgress =
    totalGames === 0 ? 0 : Math.round((predictedGames / totalGames) * 100)
  const awardsProgress =
    awardsTotal === 0 ? 0 : Math.round((awardsCompleted / awardsTotal) * 100)
  const qtProgress =
    qualifiersTotal === 0 ? 0 : Math.round((qualifiersCompleted / qualifiersTotal) * 100)

  return (
    <Box>
      {/* Section 1: Opener game card (only when openerGame != null) */}
      {openerGame && (
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ display: 'block', textAlign: 'center', mb: 0.5 }}
          >
            {t('preTournament.openerLabel')}
          </Typography>
          <FlippableGameCard
            game={openerGame}
            teamsMap={teamsMap}
            isPlayoffs={!!openerGame.playoffStage}
            tournamentId={tournamentId}
            homeScore={gameGuesses[openerGame.id]?.home_score}
            awayScore={gameGuesses[openerGame.id]?.away_score}
            homePenaltyWinner={gameGuesses[openerGame.id]?.home_penalty_winner}
            awayPenaltyWinner={gameGuesses[openerGame.id]?.away_penalty_winner}
            boostType={gameGuesses[openerGame.id]?.boost_type}
            initialBoostType={gameGuesses[openerGame.id]?.boost_type}
            isEditing={isEditingOpener}
            onEditStart={() => setIsEditingOpener(true)}
            onEditEnd={() => setIsEditingOpener(false)}
            onAutoAdvanceNext={() => setIsEditingOpener(false)}
            onAutoGoPrevious={() => setIsEditingOpener(false)}
          />
        </Box>
      )}

      {/* Section 2: Progress row (shown when QT/Awards predictions are open) */}
      {qtAndAwardsOpen && (
        <Stack direction="row" justifyContent="space-around" sx={{ mt: 2 }}>
          {/* QT */}
          <Box
            component={Link}
            href={`/${locale}/tournaments/${tournamentId}/qualified-teams`}
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
            <AccountTreeIcon color="secondary" sx={{ mb: 0.5 }} />
            <TrackedCircularProgress value={qtProgress} />
            {isDesktop ? (
              <Box>
                <Typography variant="body2" fontWeight={500}>
                  {t('preTournament.qtLabel')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {qualifiersCompleted}/{qualifiersTotal}
                </Typography>
              </Box>
            ) : (
              <Typography variant="caption">{t('preTournament.qtShort')}</Typography>
            )}
          </Box>

          {/* Awards */}
          <Box
            component={Link}
            href={`/${locale}/tournaments/${tournamentId}/awards`}
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
            <EmojiEventsIcon color="secondary" sx={{ mb: 0.5 }} />
            <TrackedCircularProgress value={awardsProgress} />
            {isDesktop ? (
              <Box>
                <Typography variant="body2" fontWeight={500}>
                  {t('preTournament.awardsLabel')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {awardsCompleted}/{awardsTotal}
                </Typography>
              </Box>
            ) : (
              <Typography variant="caption">{t('preTournament.awardsShort')}</Typography>
            )}
          </Box>

          {/* Overall */}
          <Box
            component={Link}
            href={`/${locale}/tournaments/${tournamentId}`}
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
            <SportsSoccerIcon color="secondary" sx={{ mb: 0.5 }} />
            <TrackedCircularProgress value={overallProgress} />
            {isDesktop ? (
              <Box>
                <Typography variant="body2" fontWeight={500}>
                  {t('preTournament.overallLabel')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('preTournament.gamesOfTotal', {
                    predicted: predictedGames,
                    total: totalGames,
                  })}
                </Typography>
              </Box>
            ) : (
              <Typography variant="caption">{t('preTournament.totalShort')}</Typography>
            )}
          </Box>
        </Stack>
      )}
    </Box>
  )
}
