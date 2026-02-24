'use client'

import {
  Box,
  Card,
  CardContent,
  Typography,
  alpha,
  Chip,
  Button,
} from '@mui/material'
import { Login as LoginIcon } from '@mui/icons-material'
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
  readonly showCtaOverlay?: boolean
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
  showCtaOverlay = false,
}: ReadOnlyGameCardProps) {
  const t = useTranslations('tournament.public')
  const [openAuthDialog, setOpenAuthDialog] = useState(false)

  const handleCtaClick = () => {
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
        sx={{
          position: 'relative',
        }}
      >
        {/* CTA Overlay - shown on every Nth card */}
        {showCtaOverlay && (
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
              backgroundColor: alpha('#000', 0.65),
              zIndex: 10,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1.5,
                backgroundColor: alpha('#fff', 0.98),
                px: 3,
                py: 2.5,
                borderRadius: 2,
                boxShadow: 4,
                maxWidth: '90%',
              }}
            >
              <Typography variant="body2" fontWeight={600} textAlign="center" color="text.primary">
                {t('cardLockMessage')}
              </Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<LoginIcon />}
                onClick={handleCtaClick}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                {t('loginOrSignup')}
              </Button>
            </Box>
          </Box>
        )}

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
            {!isPast && <GameCountdownDisplay gameDate={gameDate} gameTimezone={gameTimezone} />}
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
