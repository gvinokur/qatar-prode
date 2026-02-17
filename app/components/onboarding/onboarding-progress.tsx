'use client'

import { Box, Step, StepLabel, Stepper } from "@mui/material"
import { useTranslations } from 'next-intl'

type OnboardingProgressProps = {
  readonly currentStep: number
  readonly totalSteps: number
  readonly includeBoosts?: boolean
}

export default function OnboardingProgress({ currentStep, totalSteps, includeBoosts = true }: OnboardingProgressProps) {
  const t = useTranslations('onboarding.progress')

  // Build step labels dynamically based on whether boosts are included
  const stepLabels = [
    t('welcome'),
    t('gamePrediction'),
    t('qualifiedTeams'),
    t('tournamentAwards'),
    t('scoring')
  ]
  if (includeBoosts) {
    stepLabels.push(t('boosts'))
  }
  stepLabels.push(t('checklist'))

  return (
    <Box sx={{ width: '100%', mb: 3 }}>
      <Stepper activeStep={currentStep} alternativeLabel>
        {stepLabels.map((label, index) => (
          <Step key={label} completed={index < currentStep}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  )
}
