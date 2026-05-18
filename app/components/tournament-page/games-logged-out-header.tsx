'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Box } from '@mui/material'
import { PredictionStatusHeader } from '../prediction-status-header'
import { computeLoggedOutVariant } from '../prediction-status-header/hub-header-variant'
import LoginOrSignupDialog from '../auth/login-or-signup-dialog'

/**
 * Logged-out CTA banner for the Games page.
 * Mirrors HubLoggedOutHeader but wraps PSH in a sticky container so it
 * remains visible as the user scrolls through the games list.
 */
export function GamesLoggedOutHeader() {
  const t = useTranslations('tournament.public')
  const [openAuthDialog, setOpenAuthDialog] = useState(false)

  const variant = computeLoggedOutVariant(t, () => setOpenAuthDialog(true))

  return (
    <>
      <Box sx={{ position: 'sticky', top: 0, zIndex: 1000 }}>
        <PredictionStatusHeader variant={variant} />
      </Box>
      <LoginOrSignupDialog
        openLoginDialog={openAuthDialog}
        handleCloseLoginDialog={() => setOpenAuthDialog(false)}
      />
    </>
  )
}
