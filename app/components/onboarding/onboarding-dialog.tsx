'use client'

import { Button, Dialog, DialogActions, DialogContent, LinearProgress, Box } from "@mui/material"
import { useState, useCallback, useRef, useEffect } from "react"
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
  readonly open: boolean
  readonly onClose: () => void
}

type OnboardingStep = 'welcome' | 'prediction' | 'scoring' | 'boost' | 'checklist'

const STEP_ORDER: OnboardingStep[] = ['welcome', 'prediction', 'scoring', 'boost', 'checklist']

export default function OnboardingDialog({ open, onClose }: OnboardingDialogProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showHeaderShadow, setShowHeaderShadow] = useState(false)
  const [showFooterShadow, setShowFooterShadow] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const currentStepIndex = STEP_ORDER.indexOf(currentStep)
  const progress = ((currentStepIndex + 1) / STEP_ORDER.length) * 100

  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return

      const { scrollTop, scrollHeight, clientHeight } = contentRef.current

      // Show header shadow when scrolled down
      setShowHeaderShadow(scrollTop > 0)

      // Show footer shadow when not scrolled to bottom
      const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 1
      setShowFooterShadow(!isAtBottom && scrollHeight > clientHeight)
    }

    const content = contentRef.current
    if (content) {
      content.addEventListener('scroll', handleScroll)
      // Check initial state
      handleScroll()

      return () => content.removeEventListener('scroll', handleScroll)
    }
  }, [])

  useEffect(() => {
    // Recheck scroll state when step changes
    if (contentRef.current) {
      const { scrollHeight, clientHeight } = contentRef.current
      setShowFooterShadow(scrollHeight > clientHeight)
    }
  }, [currentStep])

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
      {/* Sticky Header */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 1,
          bgcolor: 'background.paper',
          borderBottom: showHeaderShadow ? '1px solid' : 'none',
          borderColor: 'divider',
          boxShadow: showHeaderShadow ? 1 : 0,
          transition: 'box-shadow 0.2s, border-color 0.2s'
        }}
      >
        <LinearProgress variant="determinate" value={progress} sx={{ height: 2 }} />
        <Box sx={{ p: 3, pb: 2 }}>
          <OnboardingProgress currentStep={currentStepIndex} totalSteps={STEP_ORDER.length} />
        </Box>
      </Box>

      <DialogContent ref={contentRef} sx={{ minHeight: 400, px: 3, pt: 0, pb: 3 }}>
        {renderStepContent()}
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          pb: 2,
          justifyContent: 'space-between',
          borderTop: showFooterShadow ? '1px solid' : 'none',
          borderColor: 'divider',
          boxShadow: showFooterShadow ? 1 : 0,
          transition: 'box-shadow 0.2s, border-color 0.2s'
        }}
      >
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
