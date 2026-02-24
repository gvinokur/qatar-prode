'use client'

import {
  Box,
  Card,
  CardContent,
  Typography,
  alpha,
  Chip,
} from '@mui/material'
import { Lock as LockIcon, Login as LoginIcon } from '@mui/icons-material'
import { Theme } from '../../db/tables-definition'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { getThemeLogoUrl } from '../../utils/theme-utils'
import LoginOrSignupDialog from '../auth/login-or-signup-dialog'
import GameCountdownDisplay from '../game-countdown-display'

interface ReadOnlyGameCardProps {
  readonly gameNumber: number
  readonly gameDate: Date
  readonly location: string
  readonly gameTimezone?: string
  readonly homeTeamNameOrDescription: string
  readonly homeTeamShortNameOrDescription?: string
  readonly homeTeamTheme?: Theme | null
  readonly awayTeamNameOrDescription: string
  readonly awayTeamShortNameOrDescription?: string
  readonly awayTeamTheme?: Theme | null
  readonly homeScore?: number
  readonly awayScore?: number
  readonly isPlayoffGame: boolean
  readonly groupOrPlayoffText?: string
}

export default function ReadOnlyGameCard({
  gameNumber,
  gameDate,
  location,
  gameTimezone,
  homeTeamNameOrDescription,
  homeTeamShortNameOrDescription,
  homeTeamTheme,
  awayTeamNameOrDescription,
  awayTeamShortNameOrDescription,
  awayTeamTheme,
  homeScore,
  awayScore,
  isPlayoffGame,
  groupOrPlayoffText,
}: ReadOnlyGameCardProps) {
  const t = useTranslations('tournament.public')
  const [openAuthDialog, setOpenAuthDialog] = useState(false)

  const handleCardClick = () => {
    setOpenAuthDialog(true)
  }

  const handleCloseAuthDialog = () => {
    setOpenAuthDialog(false)
  }

  const homeLogoUrl = homeTeamTheme ? getThemeLogoUrl(homeTeamTheme) : null
  const awayLogoUrl = awayTeamTheme ? getThemeLogoUrl(awayTeamTheme) : null

  const hasResult = homeScore !== undefined && homeScore !== null && awayScore !== undefined && awayScore !== null
  const isPast = new Date() > gameDate

  return (
    <>
      <Card
        onClick={handleCardClick}
        sx={{
          position: 'relative',
          cursor: 'pointer',
          opacity: 0.85,
          transition: 'all 0.2s',
          '&:hover': {
            opacity: 1,
            transform: 'scale(1.02)',
            boxShadow: 4,
          },
        }}
      >
        {/* Lock Overlay */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: alpha('#000', 0.05),
            zIndex: 10,
            pointerEvents: 'none',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0.5,
              backgroundColor: alpha('#fff', 0.95),
              px: 2,
              py: 1,
              borderRadius: 1,
              boxShadow: 2,
            }}
          >
            <LockIcon color="action" fontSize="small" />
            <Typography variant="caption" color="text.secondary" fontWeight={600} textAlign="center">
              {t('cardLockMessage')}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <LoginIcon fontSize="small" color="primary" />
              <Typography variant="caption" color="primary" fontWeight={700}>
                {t('loginOrSignup')}
              </Typography>
            </Box>
          </Box>
        </Box>

        <CardContent sx={{ pb: 1.5 }}>
          {/* Game Number and Info */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Chip
              label={`#${gameNumber}`}
              size="small"
              color="primary"
              sx={{ fontWeight: 600 }}
            />
            {groupOrPlayoffText && (
              <Typography variant="caption" color="text.secondary">
                {groupOrPlayoffText}
              </Typography>
            )}
          </Box>

          {/* Teams */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
            {/* Home Team */}
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              {homeLogoUrl && (
                <Box
                  component="img"
                  src={homeLogoUrl}
                  alt={homeTeamNameOrDescription}
                  sx={{ width: 32, height: 32, objectFit: 'contain' }}
                />
              )}
              <Typography variant="body2" fontWeight={600} noWrap>
                {homeTeamShortNameOrDescription || homeTeamNameOrDescription}
              </Typography>
            </Box>

            {/* Score or vs */}
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {hasResult ? (
                <>
                  <Typography variant="h6" fontWeight={700}>
                    {homeScore}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    -
                  </Typography>
                  <Typography variant="h6" fontWeight={700}>
                    {awayScore}
                  </Typography>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                  vs
                </Typography>
              )}
            </Box>

            {/* Away Team */}
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
              <Typography variant="body2" fontWeight={600} noWrap>
                {awayTeamShortNameOrDescription || awayTeamNameOrDescription}
              </Typography>
              {awayLogoUrl && (
                <Box
                  component="img"
                  src={awayLogoUrl}
                  alt={awayTeamNameOrDescription}
                  sx={{ width: 32, height: 32, objectFit: 'contain' }}
                />
              )}
            </Box>
          </Box>

          {/* Date and Location */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'center' }}>
            {!isPast && <GameCountdownDisplay gameDate={gameDate} timezone={gameTimezone} />}
            <Typography variant="caption" color="text.secondary">
              {location}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Auth Dialog */}
      <LoginOrSignupDialog
        openLoginDialog={openAuthDialog}
        handleCloseLoginDialog={handleCloseAuthDialog}
      />
    </>
  )
}
