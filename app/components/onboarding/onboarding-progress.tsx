'use client'

import { Box, Step, StepLabel, Stepper } from "@mui/material"

type OnboardingProgressProps = {
  readonly currentStep: number
  readonly totalSteps: number
  readonly includeBoosts?: boolean
}

export default function OnboardingProgress({ currentStep, totalSteps, includeBoosts = true }: OnboardingProgressProps) {
  // Build step labels dynamically based on whether boosts are included
  const stepLabels = ['Bienvenida', 'Partidos', 'Clasificados', 'Premios', 'Puntaje']
  if (includeBoosts) {
    stepLabels.push('Boosts')
  }
  stepLabels.push('Checklist')

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
