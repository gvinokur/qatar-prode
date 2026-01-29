import { vi, describe, it, expect } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import WelcomeStep from '../../../app/components/onboarding/onboarding-steps/welcome-step'
import BoostIntroductionStep from '../../../app/components/onboarding/onboarding-steps/boost-introduction-step'
import ScoringExplanationStep from '../../../app/components/onboarding/onboarding-steps/scoring-explanation-step'

describe('WelcomeStep', () => {
  it('renders welcome message', () => {
    render(<WelcomeStep />)

    expect(screen.getByText('¡Bienvenido a Qatar Prode!')).toBeInTheDocument()
    expect(screen.getByText(/Te guiaremos a través de las funciones principales/)).toBeInTheDocument()
    expect(screen.getByText(/Este tutorial tomará aproximadamente 2 minutos/)).toBeInTheDocument()
  })

  it('displays soccer icon', () => {
    const { container } = render(<WelcomeStep />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})

describe('BoostIntroductionStep', () => {
  it('renders boost introduction title', () => {
    render(<BoostIntroductionStep />)
    expect(screen.getByText('Multiplica Tus Puntos con Boosts')).toBeInTheDocument()
    expect(screen.getByText(/Usa tus boosts estratégicamente/)).toBeInTheDocument()
  })

  it('displays silver boost information', () => {
    render(<BoostIntroductionStep />)

    expect(screen.getByText('Boost Plateado')).toBeInTheDocument()
    expect(screen.getByText('Multiplica × 2')).toBeInTheDocument()
    expect(screen.getByText(/Duplica tus puntos en el partido que elijas/)).toBeInTheDocument()
    expect(screen.getByText(/Cantidad limitada por torneo/)).toBeInTheDocument()
  })

  it('displays golden boost information', () => {
    render(<BoostIntroductionStep />)

    expect(screen.getByText('Boost Dorado')).toBeInTheDocument()
    expect(screen.getByText('Multiplica × 3')).toBeInTheDocument()
    expect(screen.getByText(/Triplica tus puntos en tu partido más importante/)).toBeInTheDocument()
    expect(screen.getByText(/Muy escaso - ¡úsalo sabiamente!/)).toBeInTheDocument()
  })

  it('displays important points alert', () => {
    render(<BoostIntroductionStep />)

    expect(screen.getByText('Puntos Importantes:')).toBeInTheDocument()
    expect(screen.getByText(/Los boosts son/)).toBeInTheDocument()
    expect(screen.getByText(/específicos de cada torneo/)).toBeInTheDocument()
    expect(screen.getByText(/predicciones de partidos/)).toBeInTheDocument()
  })

  it('displays strategic tip', () => {
    render(<BoostIntroductionStep />)

    expect(screen.getByText(/Consejo Estratégico/)).toBeInTheDocument()
    expect(screen.getByText(/Guarda tus boosts para finales/)).toBeInTheDocument()
  })
})

describe('ScoringExplanationStep', () => {
  it('renders scoring explanation title', () => {
    render(<ScoringExplanationStep />)

    expect(screen.getByText('¿Cómo se Calcula el Puntaje?')).toBeInTheDocument()
    expect(screen.getByText(/Gana puntos por predicciones correctas/)).toBeInTheDocument()
  })

  it('displays game prediction scoring sections', () => {
    render(<ScoringExplanationStep />)

    expect(screen.getByText('Partidos')).toBeInTheDocument()
    expect(screen.getByText('Resultado exacto')).toBeInTheDocument()
    expect(screen.getByText('Resultado correcto')).toBeInTheDocument()
  })

  it('displays tournament prediction scoring', () => {
    render(<ScoringExplanationStep />)

    expect(screen.getByText('Torneo')).toBeInTheDocument()
  })

  it('displays scoring note', () => {
    render(<ScoringExplanationStep />)

    expect(screen.getByText(/Los valores de puntaje pueden variar/)).toBeInTheDocument()
  })
})
