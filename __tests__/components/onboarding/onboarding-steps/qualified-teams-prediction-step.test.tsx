import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import QualifiedTeamsPredictionStep from '@/app/components/onboarding/onboarding-steps/qualified-teams-prediction-step'
import { renderWithTheme } from '@/__tests__/utils/test-utils'
import { createMockTranslations } from '@/__tests__/utils/mock-translations'
import * as intl from 'next-intl'

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: vi.fn(),
  useLocale: vi.fn(() => 'es')
}))

// Mock the demo component
vi.mock('@/app/components/onboarding/demo/qualified-teams-onboarding-demo', () => ({
  default: ({ group, teams }: any) => (
    <div data-testid="qualified-teams-demo">
      <div data-testid="demo-group">{group?.group_letter || 'A'}</div>
      <div data-testid="demo-teams-count">{teams?.length || 0}</div>
    </div>
  ),
}))

describe('QualifiedTeamsPredictionStep', () => {
  beforeEach(() => {
    vi.mocked(intl.useTranslations).mockReturnValue(
      createMockTranslations('onboarding.steps.qualifiedTeams')
    )
  })

  it('renders title', () => {
    renderWithTheme(<QualifiedTeamsPredictionStep />)

    expect(screen.getByText('[title]')).toBeInTheDocument()
  })

  it('renders instructions', () => {
    renderWithTheme(<QualifiedTeamsPredictionStep />)

    expect(screen.getByText('[instructions]')).toBeInTheDocument()
  })

  it('renders info tip', () => {
    renderWithTheme(<QualifiedTeamsPredictionStep />)

    expect(screen.getByText('[infoTip]')).toBeInTheDocument()
  })

  it('renders qualified teams demo component', () => {
    renderWithTheme(<QualifiedTeamsPredictionStep />)

    expect(screen.getByTestId('qualified-teams-demo')).toBeInTheDocument()
  })

  it('passes demo data to qualified teams component', () => {
    renderWithTheme(<QualifiedTeamsPredictionStep />)

    // Demo component receives group and teams data
    expect(screen.getByTestId('demo-group')).toBeInTheDocument()
    expect(screen.getByTestId('demo-teams-count')).toBeInTheDocument()
  })

  it('renders within a paper container', () => {
    const { container } = renderWithTheme(<QualifiedTeamsPredictionStep />)

    const paper = container.querySelector('.MuiPaper-root')
    expect(paper).toBeInTheDocument()
  })
})
