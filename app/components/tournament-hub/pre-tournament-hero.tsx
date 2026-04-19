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

interface PreTournamentHeroProps {
  readonly firstGameDate: Date
  readonly openerGame: ExtendedGameData | null
  readonly tournamentId: string
  readonly locale: Locale
  readonly teamsMap: Record<string, Team>
  readonly gameGuesses: Record<string, GameGuessNew>
  readonly qtAndAwardsOpen: boolean
  readonly totalGames: number
  readonly predictedGames: number
  readonly hasAwardsPredictions: boolean
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

export default function PreTournamentHero({
  firstGameDate,
  openerGame,
  tournamentId,
  locale,
  teamsMap,
  gameGuesses,
  qtAndAwardsOpen,
  totalGames,
  predictedGames,
  hasAwardsPredictions,
}: PreTournamentHeroProps) {
  const t = useTranslations('hub')
  const theme = useTheme()
  const isDesktop = useMediaQuery(theme.breakpoints.up('sm'))
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => computeTimeLeft(firstGameDate))

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(computeTimeLeft(firstGameDate)), 1000)
    return () => clearInterval(id)
  }, [firstGameDate])

  const overallProgress =
    totalGames === 0 ? 0 : Math.round((predictedGames / totalGames) * 100)

  return (
    <Box>
      {/* Section 1: Countdown */}
      <Paper
        sx={{
          background:
            'linear-gradient(135deg, rgba(25, 118, 210, 0.08), rgba(25, 118, 210, 0.03))',
          border: '1px solid',
          borderColor: 'primary.light',
          borderRadius: 2,
          p: 3,
          textAlign: 'center',
          mb: 2,
        }}
      >
        <Typography variant="overline" color="primary">
          {t('preTournament.countdownTitle')}
        </Typography>
        <Stack
          direction="row"
          justifyContent="center"
          spacing={4}
          sx={{ mt: 1 }}
        >
          <Box textAlign="center">
            <Typography variant="h3" fontWeight="bold" color="primary">
              {timeLeft.days}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('preTournament.days')}
            </Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h3" fontWeight="bold" color="primary">
              {timeLeft.hours}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('preTournament.hours')}
            </Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h3" fontWeight="bold" color="primary">
              {timeLeft.mins}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('preTournament.mins')}
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* Section 2: Opener game card (only when openerGame != null) */}
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
            isEditing={false}
            onEditStart={() => {}}
            onEditEnd={() => {}}
            onAutoAdvanceNext={() => {}}
            onAutoGoPrevious={() => {}}
          />
        </Box>
      )}

      {/* Section 3: Progress row (shown when QT/Awards predictions are open) */}
      {qtAndAwardsOpen && <Stack direction="row" justifyContent="space-around" sx={{ mt: 2 }}>
        {/* Item 1: QT */}
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
          <AccountTreeIcon color="primary" sx={{ mb: 0.5 }} />
          <CircularProgress variant="determinate" value={0} size={48} />
          {isDesktop ? (
            <Typography variant="body2" fontWeight={500}>
              Qualified Teams
            </Typography>
          ) : (
            <Typography variant="caption">
              {t('preTournament.qtShort')}
            </Typography>
          )}
        </Box>

        {/* Item 2: Awards */}
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
          <EmojiEventsIcon color="primary" sx={{ mb: 0.5 }} />
          <CircularProgress
            variant="determinate"
            value={hasAwardsPredictions ? 100 : 0}
            size={48}
          />
          {isDesktop ? (
            <Box>
              <Typography variant="body2" fontWeight={500}>
                Individual Awards
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {hasAwardsPredictions
                  ? t('preTournament.awardsDone')
                  : t('preTournament.awardsNotStarted')}
              </Typography>
            </Box>
          ) : (
            <Typography variant="caption">
              {t('preTournament.awardsShort')}
            </Typography>
          )}
        </Box>

        {/* Item 3: Overall */}
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
          <SportsSoccerIcon color="primary" sx={{ mb: 0.5 }} />
          <CircularProgress
            variant="determinate"
            value={overallProgress}
            size={48}
          />
          {isDesktop ? (
            <Box>
              <Typography variant="body2" fontWeight={500}>
                Overall
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('preTournament.gamesOfTotal', {
                  predicted: predictedGames,
                  total: totalGames,
                })}
              </Typography>
            </Box>
          ) : (
            <Typography variant="caption">
              {t('preTournament.totalShort')}
            </Typography>
          )}
        </Box>
      </Stack>}
    </Box>
  )
}
