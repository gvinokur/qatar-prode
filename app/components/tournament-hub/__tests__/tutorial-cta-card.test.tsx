import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TutorialCTACard } from '../tutorial-cta-card'

vi.mock('next-intl', () => ({
  useTranslations: vi.fn(() => (key: string) => key),
}))

// Mock next/dynamic to immediately return the mock component (no lazy loading in tests)
vi.mock('next/dynamic', () => ({
  default: (_importFn: any, _options?: any) => {
    const Mock = ({ onClose }: { onClose?: () => void }) => (
      <div data-testid="onboarding-dialog">
        <button data-testid="close-dialog" onClick={onClose}>
          Close
        </button>
      </div>
    )
    Mock.displayName = 'MockOnboardingDialog'
    return Mock
  },
}))

describe('TutorialCTACard', () => {
  it('renders the tutorial title and subtitle', () => {
    render(<TutorialCTACard />)
    expect(screen.getByText('title')).toBeInTheDocument()
    expect(screen.getByText('subtitle')).toBeInTheDocument()
  })

  it('renders the CTA button', () => {
    render(<TutorialCTACard />)
    expect(screen.getByRole('button', { name: 'cta' })).toBeInTheDocument()
  })

  it('does not render the onboarding dialog initially', () => {
    render(<TutorialCTACard />)
    expect(screen.queryByTestId('onboarding-dialog')).not.toBeInTheDocument()
  })

  it('renders the onboarding dialog after clicking the CTA button', () => {
    render(<TutorialCTACard />)
    fireEvent.click(screen.getByRole('button', { name: 'cta' }))
    expect(screen.getByTestId('onboarding-dialog')).toBeInTheDocument()
  })

  it('hides the onboarding dialog after onClose is triggered', () => {
    render(<TutorialCTACard />)
    fireEvent.click(screen.getByRole('button', { name: 'cta' }))
    expect(screen.getByTestId('onboarding-dialog')).toBeInTheDocument()

    // Simulate the dialog calling onClose
    fireEvent.click(screen.getByTestId('close-dialog'))
    expect(screen.queryByTestId('onboarding-dialog')).not.toBeInTheDocument()
  })

  it('renders tutorial title and CTA button when fullWidth is omitted', () => {
    render(<TutorialCTACard />)
    expect(screen.getByText('title')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'cta' })).toBeInTheDocument()
  })

  it('renders tutorial title and CTA button when fullWidth=true', () => {
    render(<TutorialCTACard fullWidth />)
    expect(screen.getByText('title')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'cta' })).toBeInTheDocument()
  })

  it('opens OnboardingDialogClient when CTA is clicked in fullWidth variant', () => {
    render(<TutorialCTACard fullWidth />)
    fireEvent.click(screen.getByRole('button', { name: 'cta' }))
    expect(screen.getByTestId('onboarding-dialog')).toBeInTheDocument()
  })
})
