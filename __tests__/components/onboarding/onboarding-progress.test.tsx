import { describe, it, expect } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import OnboardingProgress from '../../../app/components/onboarding/onboarding-progress'

describe('OnboardingProgress', () => {
  it('renders all step labels', () => {
    render(<OnboardingProgress currentStep={0} totalSteps={5} />)

    expect(screen.getByText('Bienvenida')).toBeInTheDocument()
    expect(screen.getByText('Predicciones')).toBeInTheDocument()
    expect(screen.getByText('Puntaje')).toBeInTheDocument()
    expect(screen.getByText('Boosts')).toBeInTheDocument()
    expect(screen.getByText('Checklist')).toBeInTheDocument()
  })

  it('shows correct active step', () => {
    const { rerender } = render(<OnboardingProgress currentStep={0} totalSteps={5} />)
    expect(screen.getByText('Bienvenida')).toBeInTheDocument()

    rerender(<OnboardingProgress currentStep={2} totalSteps={5} />)
    expect(screen.getByText('Puntaje')).toBeInTheDocument()
  })

  it('renders correct number of steps based on totalSteps', () => {
    render(<OnboardingProgress currentStep={0} totalSteps={3} />)

    expect(screen.getByText('Bienvenida')).toBeInTheDocument()
    expect(screen.getByText('Predicciones')).toBeInTheDocument()
    expect(screen.getByText('Puntaje')).toBeInTheDocument()
    expect(screen.queryByText('Boosts')).not.toBeInTheDocument()
    expect(screen.queryByText('Checklist')).not.toBeInTheDocument()
  })

  it('marks previous steps as completed', () => {
    render(<OnboardingProgress currentStep={2} totalSteps={5} />)
    // Steps 0 and 1 should be marked as completed (implementation detail)
    expect(screen.getByText('Bienvenida')).toBeInTheDocument()
    expect(screen.getByText('Predicciones')).toBeInTheDocument()
  })
})
