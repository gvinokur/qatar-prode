'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import { PredictionStatusHeader } from '../prediction-status-header'
import { computeLoggedOutVariant } from '../prediction-status-header/hub-header-variant'
import LoginOrSignupDialog from '../auth/login-or-signup-dialog'

const OnboardingDialogClient = dynamic(
  () => import('../onboarding/onboarding-dialog-client'),
  { ssr: false }
)

/**
 * S1 — Logged-out CTA banner for the Hub page.
 * Renders a PredictionStatusHeader in brand/login tone with sign-in and learn-how actions.
 * Can be reused on other pages that want the same logged-out PSH treatment.
 */
export function HubLoggedOutHeader() {
  const t = useTranslations('tournament.public')
  const [openAuthDialog, setOpenAuthDialog] = useState(false)
  const [openOnboarding, setOpenOnboarding] = useState(false)

  const variant = computeLoggedOutVariant(
    t,
    () => setOpenAuthDialog(true),
    () => setOpenOnboarding(true),
  )

  return (
    <>
      <PredictionStatusHeader variant={variant} />
      <LoginOrSignupDialog
        openLoginDialog={openAuthDialog}
        handleCloseLoginDialog={() => setOpenAuthDialog(false)}
      />
      {openOnboarding && (
        <OnboardingDialogClient
          initialOpen={true}
          onClose={() => setOpenOnboarding(false)}
        />
      )}
    </>
  )
}
