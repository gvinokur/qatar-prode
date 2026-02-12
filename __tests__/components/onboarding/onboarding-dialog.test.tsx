import { vi, describe, it, expect, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import OnboardingDialog from '../../../app/components/onboarding/onboarding-dialog'

// Mock server actions
vi.mock('../../../app/actions/onboarding-actions', () => ({
  markOnboardingComplete: vi.fn().mockResolvedValue({ success: true }),
  skipOnboardingFlow: vi.fn().mockResolvedValue({ success: true }),
  saveOnboardingStep: vi.fn().mockResolvedValue({ success: true })
}))

// Mock step components
vi.mock('../../../app/components/onboarding/onboarding-steps', () => ({
  WelcomeStep: () => <div data-testid="welcome-step">Welcome Step</div>,
  GamePredictionStep: () => <div data-testid="game-prediction-step">Game Prediction Step</div>,
  QualifiedTeamsPredictionStep: () => <div data-testid="qualified-teams-step">Qualified Teams Step</div>,
  TournamentAwardsStep: () => <div data-testid="tournament-awards-step">Tournament Awards Step</div>,
  ScoringExplanationStep: () => <div data-testid="scoring-step">Scoring Step</div>,
  BoostIntroductionStep: () => <div data-testid="boost-step">Boost Step</div>,
  ChecklistStep: ({ onComplete }: { onComplete: () => void }) => (
    <div data-testid="checklist-step">
      Checklist Step
      <button data-testid="checklist-complete" onClick={onComplete}>
        Complete
      </button>
    </div>
  )
}))

// Mock progress component
vi.mock('../../../app/components/onboarding/onboarding-progress', () => ({
  __esModule: true,
  default: ({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => (
    <div data-testid="onboarding-progress">
      Step {currentStep + 1} of {totalSteps}
    </div>
  )
}))

// Mock MUI components
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material')
  return {
    ...actual,
    Dialog: ({ children, open, onClose }: any) => (
      open ? (
        <div data-testid="dialog">
          <div data-testid="dialog-backdrop" onClick={onClose} />
          {children}
        </div>
      ) : null
    ),
    DialogContent: ({ children }: any) => (
      <div data-testid="dialog-content">{children}</div>
    ),
    DialogActions: ({ children }: any) => (
      <div data-testid="dialog-actions">{children}</div>
    ),
    LinearProgress: ({ value }: any) => (
      <div data-testid="linear-progress" data-value={value} />
    ),
    Button: ({ children, onClick, disabled }: any) => (
      <button data-testid="button" onClick={onClick} disabled={disabled}>
        {children}
      </button>
    )
  }
})

describe('OnboardingDialog', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders welcome step initially', () => {
    render(<OnboardingDialog open={true} onClose={mockOnClose} />)

    expect(screen.getByTestId('welcome-step')).toBeInTheDocument()
    expect(screen.getByText('Step 1 of 7')).toBeInTheDocument()
  })

  it('advances to next step when Siguiente button clicked', async () => {
    render(<OnboardingDialog open={true} onClose={mockOnClose} />)

    const nextButtons = screen.getAllByText('Siguiente')
    fireEvent.click(nextButtons[0])

    await waitFor(() => {
      expect(screen.getByTestId('game-prediction-step')).toBeInTheDocument()
      expect(screen.getByText('Step 2 of 7')).toBeInTheDocument()
    })
  })

  it('goes back to previous step when Atrás button clicked', async () => {
    render(<OnboardingDialog open={true} onClose={mockOnClose} />)

    // Go to step 2
    const nextButtons = screen.getAllByText('Siguiente')
    fireEvent.click(nextButtons[0])

    await waitFor(() => {
      expect(screen.getByTestId('game-prediction-step')).toBeInTheDocument()
    })

    // Go back to step 1
    const backButton = screen.getByText('Atrás')
    fireEvent.click(backButton)

    await waitFor(() => {
      expect(screen.getByTestId('welcome-step')).toBeInTheDocument()
      expect(screen.getByText('Step 1 of 7')).toBeInTheDocument()
    })
  })

  it('calls skip handler when Saltar Tutorial button clicked', async () => {
    const { skipOnboardingFlow } = await import('../../../app/actions/onboarding-actions')

    render(<OnboardingDialog open={true} onClose={mockOnClose} />)

    const skipButton = screen.getByText('Saltar Tutorial')
    fireEvent.click(skipButton)

    await waitFor(() => {
      expect(skipOnboardingFlow).toHaveBeenCalled()
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  it('shows checklist step as last step', async () => {
    render(<OnboardingDialog open={true} onClose={mockOnClose} />)

    // Navigate through all steps
    for (let i = 0; i < 6; i++) {
      const nextButtons = screen.getAllByText(/Siguiente|Finalizar/)
      fireEvent.click(nextButtons[0])
      await waitFor(() => {}) // Wait for state update
    }

    expect(screen.getByTestId('checklist-step')).toBeInTheDocument()
    expect(screen.getByText('Step 7 of 7')).toBeInTheDocument()
  })

  it('completes onboarding when checklist step completed', async () => {
    const { markOnboardingComplete } = await import('../../../app/actions/onboarding-actions')

    render(<OnboardingDialog open={true} onClose={mockOnClose} />)

    // Navigate to checklist step
    for (let i = 0; i < 6; i++) {
      const nextButtons = screen.getAllByText(/Siguiente|Finalizar/)
      fireEvent.click(nextButtons[0])
      await waitFor(() => {}) // Wait for state update
    }

    // Complete checklist
    const completeButton = screen.getByTestId('checklist-complete')
    fireEvent.click(completeButton)

    await waitFor(() => {
      expect(markOnboardingComplete).toHaveBeenCalled()
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  it('updates progress bar as steps advance', async () => {
    render(<OnboardingDialog open={true} onClose={mockOnClose} />)

    const getProgress = () => parseFloat(screen.getByTestId('linear-progress').getAttribute('data-value') || '0')

    // Initial progress (step 1/7 ≈ 14.3%)
    expect(getProgress()).toBeCloseTo(14.285714285714285, 5)

    // Advance to step 2
    const nextButtons = screen.getAllByText('Siguiente')
    fireEvent.click(nextButtons[0])

    await waitFor(() => {
      // Step 2/7 ≈ 28.6%
      expect(getProgress()).toBeCloseTo(28.571428571428573, 5)
    })
  })

  it('does not render when open is false', () => {
    render(<OnboardingDialog open={false} onClose={mockOnClose} />)

    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument()
  })
})
