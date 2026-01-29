'use client'

import { Box, Step, StepLabel, Stepper } from "@mui/material"

type OnboardingProgressProps = {
  readonly currentStep: number
  readonly totalSteps: number
}

const STEP_LABELS = [
  'Bienvenida',
  'Predicciones',
  'Puntaje',
  'Boosts',
  'Checklist'
]

export default function OnboardingProgress({ currentStep, totalSteps }: OnboardingProgressProps) {
  return (
    <Box sx={{ width: '100%', mb: 3 }}>
      <Stepper activeStep={currentStep} alternativeLabel>
        {STEP_LABELS.slice(0, totalSteps).map((label, index) => (
          <Step key={label} completed={index < currentStep}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  )
}
