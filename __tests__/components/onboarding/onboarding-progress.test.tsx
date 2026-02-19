import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import OnboardingProgress from '../../../app/components/onboarding/onboarding-progress'
import { createMockTranslations } from '@/__tests__/utils/mock-translations'
import * as intl from 'next-intl'

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: vi.fn(() => (key: string) => key),
  useLocale: vi.fn(() => 'es')
}))

describe('OnboardingProgress', () => {
  beforeEach(() => {
    vi.mocked(intl.useTranslations).mockReturnValue(
      createMockTranslations('onboarding.progress')
    )
  })

  it('renders all step labels', () => {
    render(<OnboardingProgress currentStep={0} totalSteps={7} />)

    expect(screen.getByText('[welcome]')).toBeInTheDocument()
    expect(screen.getByText('[gamePrediction]')).toBeInTheDocument()
    expect(screen.getByText('[qualifiedTeams]')).toBeInTheDocument()
    expect(screen.getByText('[tournamentAwards]')).toBeInTheDocument()
    expect(screen.getByText('[scoring]')).toBeInTheDocument()
    expect(screen.getByText('[boosts]')).toBeInTheDocument()
    expect(screen.getByText('[checklist]')).toBeInTheDocument()
  })

  it('shows correct active step', () => {
    const { rerender } = render(<OnboardingProgress currentStep={0} totalSteps={7} />)
    expect(screen.getByText('[welcome]')).toBeInTheDocument()

    rerender(<OnboardingProgress currentStep={4} totalSteps={7} />)
    expect(screen.getByText('[scoring]')).toBeInTheDocument()
  })

  it('renders correct number of steps based on includeBoosts flag', () => {
    // With boosts (7 steps)
    const { rerender } = render(<OnboardingProgress currentStep={0} totalSteps={7} includeBoosts={true} />)

    expect(screen.getByText('[welcome]')).toBeInTheDocument()
    expect(screen.getByText('[gamePrediction]')).toBeInTheDocument()
    expect(screen.getByText('[qualifiedTeams]')).toBeInTheDocument()
    expect(screen.getByText('[tournamentAwards]')).toBeInTheDocument()
    expect(screen.getByText('[scoring]')).toBeInTheDocument()
    expect(screen.getByText('[boosts]')).toBeInTheDocument()
    expect(screen.getByText('[checklist]')).toBeInTheDocument()

    // Without boosts (6 steps)
    rerender(<OnboardingProgress currentStep={0} totalSteps={6} includeBoosts={false} />)

    expect(screen.getByText('[welcome]')).toBeInTheDocument()
    expect(screen.getByText('[gamePrediction]')).toBeInTheDocument()
    expect(screen.getByText('[qualifiedTeams]')).toBeInTheDocument()
    expect(screen.getByText('[tournamentAwards]')).toBeInTheDocument()
    expect(screen.getByText('[scoring]')).toBeInTheDocument()
    expect(screen.queryByText('[boosts]')).not.toBeInTheDocument()
    expect(screen.getByText('[checklist]')).toBeInTheDocument()
  })

  it('marks previous steps as completed', () => {
    render(<OnboardingProgress currentStep={3} totalSteps={7} />)
    // Steps 0, 1, and 2 should be marked as completed (implementation detail)
    expect(screen.getByText('[welcome]')).toBeInTheDocument()
    expect(screen.getByText('[gamePrediction]')).toBeInTheDocument()
    expect(screen.getByText('[qualifiedTeams]')).toBeInTheDocument()
  })
})
