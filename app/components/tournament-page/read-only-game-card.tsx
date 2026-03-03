'use client'

import {
  Box,
  Typography,
  alpha,
  Button,
} from '@mui/material'
import { Login as LoginIcon } from '@mui/icons-material'
import { Theme } from '../../db/tables-definition'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import LoginOrSignupDialog from '../auth/login-or-signup-dialog'
import CompactGameViewCard from '../compact-game-view-card'

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
  groupOrPlayoffText = '',
  showCtaOverlay = false,
}: ReadOnlyGameCardProps) {
  const t = useTranslations('tournament.public')
  const [openAuthDialog, setOpenAuthDialog] = useState(false)

  const handleCtaClick = () => {
    setOpenAuthDialog(true)
  }

  // No-op for edit click since this is read-only
  const handleEditClick = () => {
    // Do nothing
  }

  return (
    <>
      <Box sx={{ position: 'relative' }}>
        <CompactGameViewCard
          isGameFixture={true}
          isGameGuess={false}
          gameNumber={gameNumber}
          gameDate={gameDate}
          location={location}
          gameTimezone={gameTimezone}
          homeTeamNameOrDescription={homeTeamNameOrDescription}
          homeTeamShortNameOrDescription={homeTeamShortNameOrDescription}
          homeTeamTheme={homeTeamTheme}
          awayTeamNameOrDescription={awayTeamNameOrDescription}
          awayTeamShortNameOrDescription={awayTeamShortNameOrDescription}
          awayTeamTheme={awayTeamTheme}
          homeScore={homeScore}
          awayScore={awayScore}
          isPlayoffGame={isPlayoffGame}
          groupOrPlayoffText={groupOrPlayoffText}
          onEditClick={handleEditClick}
          disabled={true}
        />

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
              backgroundColor: (theme) => alpha(theme.palette.common.black, 0.65),
              zIndex: 10,
              borderRadius: 1,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1.5,
                backgroundColor: (theme) => alpha(theme.palette.common.white, 0.98),
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
      </Box>

      {/* Auth Dialog */}
      <LoginOrSignupDialog
        openLoginDialog={openAuthDialog}
        handleCloseLoginDialog={() => setOpenAuthDialog(false)}
      />
    </>
  )
}
