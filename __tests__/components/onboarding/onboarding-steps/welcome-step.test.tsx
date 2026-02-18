import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import WelcomeStep from '@/app/components/onboarding/onboarding-steps/welcome-step'
import { renderWithTheme } from '@/__tests__/utils/test-utils'
import { createMockTranslations } from '@/__tests__/utils/mock-translations'
import * as intl from 'next-intl'

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: vi.fn(),
  useLocale: vi.fn(() => 'es')
}))

describe('WelcomeStep', () => {
  beforeEach(() => {
    vi.mocked(intl.useTranslations).mockReturnValue(
      createMockTranslations('onboarding.steps.welcome')
    )
  })

  it('renders welcome title', () => {
    renderWithTheme(<WelcomeStep />)

    expect(screen.getByText('[title]')).toBeInTheDocument()
  })

  it('renders welcome description', () => {
    renderWithTheme(<WelcomeStep />)

    expect(screen.getByText('[description]')).toBeInTheDocument()
  })

  it('renders duration info', () => {
    renderWithTheme(<WelcomeStep />)

    expect(screen.getByText('[durationInfo]')).toBeInTheDocument()
  })

  it('renders soccer icon', () => {
    const { container } = renderWithTheme(<WelcomeStep />)

    // Check for MUI SportsSoccerIcon (rendered as svg)
    const svgIcon = container.querySelector('svg[data-testid="SportsSoccerIcon"]')
    expect(svgIcon).toBeInTheDocument()
  })

  it('renders with centered layout', () => {
    const { container } = renderWithTheme(<WelcomeStep />)

    const box = container.querySelector('.MuiBox-root')
    expect(box).toBeInTheDocument()
  })
})
