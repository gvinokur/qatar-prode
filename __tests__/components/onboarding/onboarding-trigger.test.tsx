import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import OnboardingTrigger from '../../../app/components/onboarding/onboarding-trigger'

// Mock OnboardingDialog
vi.mock('../../../app/components/onboarding/onboarding-dialog', () => ({
  __esModule: true,
  default: ({ open, onClose }: { open: boolean; onClose: () => void }) => (
    open ? (
      <div data-testid="onboarding-dialog">
        <button data-testid="close-dialog" onClick={onClose}>Close</button>
      </div>
    ) : null
  )
}))

describe('OnboardingTrigger', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('does not show dialog immediately', () => {
    render(<OnboardingTrigger />)
    expect(screen.queryByTestId('onboarding-dialog')).not.toBeInTheDocument()
  })

  it('shows dialog after 500ms delay', () => {
    render(<OnboardingTrigger />)

    expect(screen.queryByTestId('onboarding-dialog')).not.toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(screen.getByTestId('onboarding-dialog')).toBeInTheDocument()
  })

  it('closes dialog when onClose is called', () => {
    render(<OnboardingTrigger />)

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(screen.getByTestId('onboarding-dialog')).toBeInTheDocument()

    const closeButton = screen.getByTestId('close-dialog')

    act(() => {
      closeButton.click()
    })

    expect(screen.queryByTestId('onboarding-dialog')).not.toBeInTheDocument()
  })

  it('cleans up timer on unmount', () => {
    const { unmount } = render(<OnboardingTrigger />)

    unmount()

    act(() => {
      vi.advanceTimersByTime(500)
    })
    // Dialog should not appear after unmount
    expect(screen.queryByTestId('onboarding-dialog')).not.toBeInTheDocument()
  })
})
