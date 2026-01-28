'use client'

import { Button, Dialog, DialogActions, DialogContent, LinearProgress } from "@mui/material"
import { useState, useCallback } from "react"
import {
  WelcomeStep,
  SamplePredictionStep,
  ScoringExplanationStep,
  BoostIntroductionStep,
  ChecklistStep
} from "./onboarding-steps"
import { markOnboardingComplete, skipOnboardingFlow, saveOnboardingStep } from "../../actions/onboarding-actions"
import OnboardingProgress from "./onboarding-progress"

/**
 * Progressive Onboarding Flow Dialog
 *
 * A 5-step interactive onboarding experience for new users.
 *
 * Steps:
 * 1. Welcome - Introduction to Qatar Prode
 * 2. Predictions - Multi-tab demo (Games, Tournament, Qualifiers)
 * 3. Scoring - Points breakdown (tournament-specific)
 * 4. Boosts - Multiplier explanation (tournament-dependent)
 * 5. Checklist - Getting started tasks with deadlines
 *
 * Testing: Visit /?showOnboarding=true to force show the dialog
 */

type OnboardingDialogProps = {
  open: boolean
  onClose: () => void
}

type OnboardingStep = 'welcome' | 'prediction' | 'scoring' | 'boost' | 'checklist'

const STEP_ORDER: OnboardingStep[] = ['welcome', 'prediction', 'scoring', 'boost', 'checklist']

export default function OnboardingDialog({ open, onClose }: OnboardingDialogProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const currentStepIndex = STEP_ORDER.indexOf(currentStep)
  const progress = ((currentStepIndex + 1) / STEP_ORDER.length) * 100

  const handleNext = useCallback(async () => {
    const nextIndex = currentStepIndex + 1

    if (nextIndex >= STEP_ORDER.length) {
      // Completed all steps
      setIsSubmitting(true)
      await markOnboardingComplete()
      setIsSubmitting(false)
      onClose()
      return
    }

    const nextStep = STEP_ORDER[nextIndex]
    setCurrentStep(nextStep)
    await saveOnboardingStep(nextIndex)
  }, [currentStepIndex, onClose])

  const handleBack = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStep(STEP_ORDER[currentStepIndex - 1])
    }
  }, [currentStepIndex])

  const handleSkip = useCallback(async () => {
    setIsSubmitting(true)
    await skipOnboardingFlow()
    setIsSubmitting(false)
    onClose()
  }, [onClose])

  const renderStepContent = () => {
    switch (currentStep) {
      case 'welcome':
        return <WelcomeStep />
      case 'prediction':
        return <SamplePredictionStep />
      case 'scoring':
        return <ScoringExplanationStep />
      case 'boost':
        return <BoostIntroductionStep />
      case 'checklist':
        return <ChecklistStep onComplete={handleNext} />
      default:
        return null
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleSkip}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown
    >
      <LinearProgress variant="determinate" value={progress} sx={{ height: 2 }} />

      <DialogContent sx={{ minHeight: 400, p: 3 }}>
        <OnboardingProgress currentStep={currentStepIndex} totalSteps={STEP_ORDER.length} />
        {renderStepContent()}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
        <Button
          onClick={handleSkip}
          disabled={isSubmitting}
          color="inherit"
        >
          Saltar Tutorial
        </Button>

        <div>
          {currentStepIndex > 0 && currentStep !== 'checklist' && (
            <Button onClick={handleBack} disabled={isSubmitting} sx={{ mr: 1 }}>
              Atrás
            </Button>
          )}

          {currentStep !== 'checklist' && (
            <Button
              onClick={handleNext}
              variant="contained"
              disabled={isSubmitting}
            >
              {currentStepIndex === STEP_ORDER.length - 1 ? 'Finalizar' : 'Siguiente'}
            </Button>
          )}
        </div>
      </DialogActions>
    </Dialog>
  )
}
