import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import GamePredictionStep from '@/app/components/onboarding/onboarding-steps/game-prediction-step'
import { renderWithTheme } from '@/__tests__/utils/test-utils'
import { createMockTranslations } from '@/__tests__/utils/mock-translations'
import * as intl from 'next-intl'

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: vi.fn(() => (key: string) => key),
  useLocale: vi.fn(() => 'es')
}))

// Mock the demo components
vi.mock('@/app/components/onboarding/demo/onboarding-demo-context', () => ({
  MockGuessesContextProvider: ({ children }: any) => <div data-testid="mock-guesses-provider">{children}</div>,
}))

vi.mock('@/app/components/onboarding/demo/game-card-onboarding-demo', () => ({
  default: ({ game, label, demoNote, isEditing, onEditStart }: any) => (
    <div data-testid={`game-card-${game.id}`}>
      <div data-testid={`label-${game.id}`}>{label}</div>
      {demoNote && <div data-testid={`note-${game.id}`}>{demoNote}</div>}
      <button onClick={onEditStart} data-testid={`edit-btn-${game.id}`}>
        Edit
      </button>
      {isEditing && <div data-testid={`editing-${game.id}`}>Editing</div>}
    </div>
  ),
}))

vi.mock('@/app/components/compact-prediction-dashboard', () => ({
  CompactPredictionDashboard: ({ demoMode }: any) => (
    <div data-testid="compact-dashboard">
      <div data-testid="demo-mode">{String(demoMode)}</div>
    </div>
  ),
}))

describe('GamePredictionStep', () => {
  beforeEach(() => {
    vi.mocked(intl.useTranslations).mockReturnValue(
      createMockTranslations('onboarding.steps.gamePrediction')
    )
  })

  it('renders main heading', () => {
    renderWithTheme(<GamePredictionStep />)

    expect(screen.getByText('[title]')).toBeInTheDocument()
  })

  it('renders instruction text', () => {
    renderWithTheme(<GamePredictionStep />)

    expect(screen.getByText('[clickToFlip]')).toBeInTheDocument()
  })

  it('renders demo disclaimer', () => {
    renderWithTheme(<GamePredictionStep />)

    expect(screen.getByText('[infoTip]')).toBeInTheDocument()
  })

  it('renders compact prediction dashboard in demo mode', () => {
    renderWithTheme(<GamePredictionStep />)
    
    expect(screen.getByTestId('compact-dashboard')).toBeInTheDocument()
    expect(screen.getByTestId('demo-mode')).toHaveTextContent('true')
  })

  it('renders two game cards with correct labels', () => {
    renderWithTheme(<GamePredictionStep />)

    expect(screen.getByTestId('label-game-1')).toHaveTextContent('[groupGameLabel]')
    expect(screen.getByTestId('label-game-2')).toHaveTextContent('[playoffGameLabel]')
  })

  it('renders playoff demo note', () => {
    renderWithTheme(<GamePredictionStep />)

    expect(screen.getByTestId('note-game-2')).toHaveTextContent('[demoNote]')
  })

  it('handles card edit interaction', async () => {
    renderWithTheme(<GamePredictionStep />)
    
    const editBtn = screen.getByTestId('edit-btn-game-1')
    
    fireEvent.click(editBtn)
    
    await waitFor(() => {
      expect(screen.getByTestId('editing-game-1')).toBeInTheDocument()
    })
  })

  it('shows success message after first card interaction', async () => {
    renderWithTheme(<GamePredictionStep />)

    const editBtn = screen.getByTestId('edit-btn-game-1')

    fireEvent.click(editBtn)

    await waitFor(() => {
      expect(screen.getByText('[successAlert]')).toBeInTheDocument()
    })
  })

  it('maintains editing state correctly', async () => {
    renderWithTheme(<GamePredictionStep />)
    
    const editBtn1 = screen.getByTestId('edit-btn-game-1')
    const editBtn2 = screen.getByTestId('edit-btn-game-2')
    
    // Edit first card
    fireEvent.click(editBtn1)
    await waitFor(() => {
      expect(screen.getByTestId('editing-game-1')).toBeInTheDocument()
    })
    
    // Edit second card (should close first)
    fireEvent.click(editBtn2)
    await waitFor(() => {
      expect(screen.queryByTestId('editing-game-1')).not.toBeInTheDocument()
      expect(screen.getByTestId('editing-game-2')).toBeInTheDocument()
    })
  })

  it('renders within mock guesses context', () => {
    renderWithTheme(<GamePredictionStep />)
    
    expect(screen.getByTestId('mock-guesses-provider')).toBeInTheDocument()
  })

  it('renders both game cards', () => {
    renderWithTheme(<GamePredictionStep />)
    
    expect(screen.getByTestId('game-card-game-1')).toBeInTheDocument()
    expect(screen.getByTestId('game-card-game-2')).toBeInTheDocument()
  })
})
