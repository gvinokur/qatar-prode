import { describe, it, expect, vi } from 'vitest'
import OnboardingTrigger from '@/app/components/onboarding/onboarding-trigger'
import { renderWithTheme } from '@/__tests__/utils/test-utils'

// Mock OnboardingDialogClient component
vi.mock('@/app/components/onboarding/onboarding-dialog-client', () => ({
  __esModule: true,
  default: () => <div data-testid="onboarding-dialog-client">OnboardingDialogClient</div>
}))

describe('OnboardingTrigger', () => {
  it('renders OnboardingDialogClient component', () => {
    const { getByTestId } = renderWithTheme(<OnboardingTrigger />)

    expect(getByTestId('onboarding-dialog-client')).toBeInTheDocument()
  })

  it('renders without props', () => {
    // Component should render successfully with no props
    expect(() => renderWithTheme(<OnboardingTrigger />)).not.toThrow()
  })

  it('is a simple wrapper component', () => {
    const { container } = renderWithTheme(<OnboardingTrigger />)

    // Should have exactly one child element (OnboardingDialogClient)
    expect(container.firstChild?.childNodes.length).toBe(1)
  })
})
