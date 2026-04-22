'use client'

import { Box, Button, Typography } from '@mui/material'
import { Info, Login, School } from '@mui/icons-material'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import LoginOrSignupDialog from '../auth/login-or-signup-dialog'
import OnboardingDialogClient from '../onboarding/onboarding-dialog-client'

interface LoggedOffBannerProps {
  readonly sticky?: boolean
}

export function LoggedOffBanner({ sticky }: LoggedOffBannerProps) {
  const t = useTranslations('tournament.public')
  const [openAuthDialog, setOpenAuthDialog] = useState(false)
  const [openOnboarding, setOpenOnboarding] = useState(false)

  const handleCloseAuthDialog = () => {
    setOpenAuthDialog(false)
  }

  const handleCloseOnboarding = () => {
    setOpenOnboarding(false)
  }

  return (
    <>
      <Box
        sx={{
          ...(sticky && { position: 'sticky', top: 0, zIndex: 1000 }),
          backgroundColor: 'primary.main',
          color: 'primary.contrastText',
          py: 1.5,
          px: 2,
          mb: 2,
          borderRadius: 1,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
          gap: 1.5,
          boxShadow: 2,
        }}
      >
        {/* Message */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Info fontSize="small" />
          <Typography variant="body2" fontWeight={600}>
            {t('ctaMessage')}
          </Typography>
        </Box>

        {/* Buttons */}
        <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<School />}
            onClick={() => setOpenOnboarding(true)}
            sx={{
              color: 'primary.contrastText',
              borderColor: 'primary.contrastText',
              '&:hover': {
                borderColor: 'primary.contrastText',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            {t('learnHow')}
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<Login />}
            onClick={() => setOpenAuthDialog(true)}
            sx={{
              backgroundColor: 'primary.contrastText',
              color: 'primary.main',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
              },
            }}
          >
            {t('loginOrSignup')}
          </Button>
        </Box>
      </Box>

      {/* Auth Dialog */}
      <LoginOrSignupDialog
        openLoginDialog={openAuthDialog}
        handleCloseLoginDialog={handleCloseAuthDialog}
      />

      {/* Onboarding Dialog */}
      {openOnboarding && (
        <OnboardingDialogClient
          initialOpen={true}
          onClose={handleCloseOnboarding}
        />
      )}
    </>
  )
}

/** @deprecated Use LoggedOffBanner instead */
export default function PublicCTABar() {
  return <LoggedOffBanner sticky />
}
