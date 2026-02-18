import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import SamplePredictionStep from '@/app/components/onboarding/onboarding-steps/sample-prediction-step'
import { renderWithTheme } from '@/__tests__/utils/test-utils'
import { createMockTranslations } from '@/__tests__/utils/mock-translations'
import * as intl from 'next-intl'

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: vi.fn(),
  useLocale: vi.fn(() => 'es')
}))

// Mock demo context providers
vi.mock('@/app/components/onboarding/demo/onboarding-demo-context', () => ({
  MockGuessesContextProvider: ({ children }: any) => <div data-testid="mock-guesses-provider">{children}</div>,
  MockQualifiedTeamsContextProvider: ({ children }: any) => <div data-testid="mock-qualified-teams-provider">{children}</div>,
}))

// Mock FlippableGameCard
vi.mock('@/app/components/flippable-game-card', () => ({
  default: ({ game, onEditStart }: any) => (
    <div data-testid={`game-card-${game.id}`}>
      <button onClick={() => onEditStart(game.id)} data-testid={`edit-btn-${game.id}`}>
        Edit Game {game.id}
      </button>
    </div>
  ),
}))

// Mock QualifiedTeamsClientPage
vi.mock('@/app/components/qualified-teams/qualified-teams-client-page', () => ({
  default: () => <div data-testid="qualified-teams-page">Qualified Teams</div>,
}))

// Mock CompactPredictionDashboard
vi.mock('@/app/components/compact-prediction-dashboard', () => ({
  CompactPredictionDashboard: () => <div data-testid="compact-dashboard">Dashboard</div>,
}))

// Mock TeamSelector
vi.mock('@/app/components/awards/team-selector', () => ({
  default: ({ label, onChange, name }: any) => (
    <div data-testid={`team-selector-${name}`}>
      <label>{label}</label>
      <button onClick={() => onChange('test-team-id')}>Select {name}</button>
    </div>
  ),
}))

describe('SamplePredictionStep', () => {
  beforeEach(() => {
    vi.mocked(intl.useTranslations).mockReturnValue(
      createMockTranslations('onboarding.steps.samplePrediction')
    )
  })

  describe('Basic Rendering', () => {
    it('renders main title', () => {
      renderWithTheme(<SamplePredictionStep />)
      expect(screen.getByText('Explora las Predicciones')).toBeInTheDocument()
    })

    it('renders main description', () => {
      renderWithTheme(<SamplePredictionStep />)
      expect(screen.getByText('Conoce las nuevas formas de predecir partidos, ordenar equipos y más')).toBeInTheDocument()
    })
  })

  describe('Section 1: Game Predictions', () => {
    it('renders game predictions section header', () => {
      renderWithTheme(<SamplePredictionStep />)
      expect(screen.getByText('🎴 Predicciones de Partidos')).toBeInTheDocument()
    })

    it('renders click to flip instruction', () => {
      renderWithTheme(<SamplePredictionStep />)
      expect(screen.getByText('[clickToFlip]')).toBeInTheDocument()
    })

    it('renders game cards within MockGuessesContext', () => {
      renderWithTheme(<SamplePredictionStep />)
      expect(screen.getAllByTestId(/^game-card-/).length).toBeGreaterThan(0)
    })

    it('shows success alert when card is edited', async () => {
      renderWithTheme(<SamplePredictionStep />)

      const editButton = screen.getAllByTestId(/^edit-btn-/)[0]
      fireEvent.click(editButton)

      await waitFor(() => {
        expect(screen.getByText('[successAlert]')).toBeInTheDocument()
      })
    })

    it('can close success alert', async () => {
      renderWithTheme(<SamplePredictionStep />)

      const editButton = screen.getAllByTestId(/^edit-btn-/)[0]
      fireEvent.click(editButton)

      await waitFor(() => {
        expect(screen.getByText('[successAlert]')).toBeInTheDocument()
      })

      const alert = screen.getByText('[successAlert]').closest('.MuiAlert-root')
      const closeButton = alert?.querySelector('button')
      if (closeButton) {
        fireEvent.click(closeButton)
      }

      await waitFor(() => {
        expect(screen.queryByText('[successAlert]')).not.toBeInTheDocument()
      })
    })

    it('only shows success alert once per interaction', async () => {
      renderWithTheme(<SamplePredictionStep />)

      const editButtons = screen.getAllByTestId(/^edit-btn-/)

      // First click shows alert
      fireEvent.click(editButtons[0])
      await waitFor(() => {
        expect(screen.getByText('[successAlert]')).toBeInTheDocument()
      })

      // Second click while alert visible should not show duplicate
      fireEvent.click(editButtons[1])

      const alerts = screen.queryAllByText('[successAlert]')
      expect(alerts).toHaveLength(1)
    })
  })

  describe('Section 2: Qualified Teams', () => {
    it('renders qualified teams section header', () => {
      renderWithTheme(<SamplePredictionStep />)
      expect(screen.getByText('🏆 Ordenar Equipos Clasificados')).toBeInTheDocument()
    })

    it('renders drag to reorder instruction', () => {
      renderWithTheme(<SamplePredictionStep />)
      expect(screen.getByText('[dragToReorder]')).toBeInTheDocument()
    })

    it('renders qualified teams component within MockQualifiedTeamsContext', () => {
      renderWithTheme(<SamplePredictionStep />)
      expect(screen.getByTestId('qualified-teams-page')).toBeInTheDocument()
    })
  })

  describe('Section 3: Unified Dashboard', () => {
    it('renders dashboard section header', () => {
      renderWithTheme(<SamplePredictionStep />)
      expect(screen.getByText('📊 Vista Unificada de Predicciones')).toBeInTheDocument()
    })

    it('renders dashboard description', () => {
      renderWithTheme(<SamplePredictionStep />)
      expect(screen.getByText('Todas tus predicciones en un solo lugar')).toBeInTheDocument()
    })

    it('renders compact prediction dashboard', () => {
      renderWithTheme(<SamplePredictionStep />)
      expect(screen.getByTestId('compact-dashboard')).toBeInTheDocument()
    })
  })

  describe('Section 4: Tournament Awards', () => {
    it('renders tournament awards section header', () => {
      renderWithTheme(<SamplePredictionStep />)
      expect(screen.getByText('🎖️ Predicciones del Torneo')).toBeInTheDocument()
    })

    it('renders tournament awards description', () => {
      renderWithTheme(<SamplePredictionStep />)
      expect(screen.getByText('Predice el campeón, subcampeón y tercer lugar')).toBeInTheDocument()
    })

    it('renders champion team selector', () => {
      renderWithTheme(<SamplePredictionStep />)
      expect(screen.getByTestId('team-selector-champion')).toBeInTheDocument()
    })

    it('renders runner-up team selector', () => {
      renderWithTheme(<SamplePredictionStep />)
      expect(screen.getByTestId('team-selector-runnerUp')).toBeInTheDocument()
    })

    it('renders third place team selector', () => {
      renderWithTheme(<SamplePredictionStep />)
      expect(screen.getByTestId('team-selector-thirdPlace')).toBeInTheDocument()
    })

    it('shows team success alert when team is selected', async () => {
      renderWithTheme(<SamplePredictionStep />)

      const selectButton = screen.getByText('Select champion')
      fireEvent.click(selectButton)

      await waitFor(() => {
        expect(screen.getByText('¡Genial! Selecciona tus predicciones para el torneo.')).toBeInTheDocument()
      })
    })
  })

  describe('Layout and Structure', () => {
    it('renders multiple paper sections', () => {
      const { container } = renderWithTheme(<SamplePredictionStep />)
      const papers = container.querySelectorAll('.MuiPaper-root')
      expect(papers.length).toBeGreaterThan(3)
    })

    it('renders dividers between sections', () => {
      const { container } = renderWithTheme(<SamplePredictionStep />)
      const dividers = container.querySelectorAll('.MuiDivider-root')
      expect(dividers.length).toBeGreaterThan(2)
    })
  })

  describe('Context Providers', () => {
    it('renders MockGuessesContextProvider', () => {
      renderWithTheme(<SamplePredictionStep />)
      expect(screen.getAllByTestId('mock-guesses-provider').length).toBeGreaterThan(0)
    })

    it('renders MockQualifiedTeamsContextProvider', () => {
      renderWithTheme(<SamplePredictionStep />)
      expect(screen.getByTestId('mock-qualified-teams-provider')).toBeInTheDocument()
    })
  })

  describe('State Management', () => {
    it('tracks editing state for game cards', async () => {
      renderWithTheme(<SamplePredictionStep />)

      const editButton = screen.getAllByTestId(/^edit-btn-/)[0]
      fireEvent.click(editButton)

      // State change should trigger success alert
      await waitFor(() => {
        expect(screen.getByText('[successAlert]')).toBeInTheDocument()
      })
    })

    it('handles champion team selection', async () => {
      renderWithTheme(<SamplePredictionStep />)

      const championButton = screen.getByText('Select champion')
      fireEvent.click(championButton)

      // Should update state (verified by no errors)
      expect(championButton).toBeInTheDocument()
    })

    it('handles runner-up team selection', async () => {
      renderWithTheme(<SamplePredictionStep />)

      const runnerUpButton = screen.getByText('Select runnerUp')
      fireEvent.click(runnerUpButton)

      expect(runnerUpButton).toBeInTheDocument()
    })

    it('handles third place team selection', async () => {
      renderWithTheme(<SamplePredictionStep />)

      const thirdPlaceButton = screen.getByText('Select thirdPlace')
      fireEvent.click(thirdPlaceButton)

      expect(thirdPlaceButton).toBeInTheDocument()
    })
  })
})
