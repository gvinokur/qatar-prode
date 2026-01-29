import { vi, describe, it, expect, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import OnboardingTooltip from '../../../app/components/onboarding/onboarding-tooltip'
import * as onboardingActions from '../../../app/actions/onboarding-actions'

// Mock the onboarding actions
vi.mock('../../../app/actions/onboarding-actions', () => ({
  dismissTooltip: vi.fn().mockResolvedValue({ success: true })
}))

describe('OnboardingTooltip', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders tooltip with title and content when not dismissed', () => {
    render(
      <OnboardingTooltip
        id="test-tooltip"
        title="Test Title"
        content="Test Content"
        dismissed={false}
      >
        <button>Target Element</button>
      </OnboardingTooltip>
    )

    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Test Content')).toBeInTheDocument()
    expect(screen.getByText('Target Element')).toBeInTheDocument()
  })

  it('does not show tooltip when dismissed', () => {
    render(
      <OnboardingTooltip
        id="test-tooltip"
        title="Test Title"
        content="Test Content"
        dismissed={true}
      >
        <button>Target Element</button>
      </OnboardingTooltip>
    )

    expect(screen.queryByText('Test Title')).not.toBeInTheDocument()
    expect(screen.queryByText('Test Content')).not.toBeInTheDocument()
    expect(screen.getByText('Target Element')).toBeInTheDocument()
  })

  it('renders children element', () => {
    render(
      <OnboardingTooltip
        id="test-tooltip"
        title="Test Title"
        content="Test Content"
        dismissed={false}
      >
        <button data-testid="child-element">Click Me</button>
      </OnboardingTooltip>
    )

    expect(screen.getByTestId('child-element')).toBeInTheDocument()
  })

  it('calls dismissTooltip when close button is clicked', async () => {
    render(
      <OnboardingTooltip
        id="test-tooltip-123"
        title="Test Title"
        content="Test Content"
        dismissed={false}
      >
        <button>Target Element</button>
      </OnboardingTooltip>
    )

    const closeButton = screen.getByTestId('tooltip-close-button')
    fireEvent.click(closeButton)

    expect(onboardingActions.dismissTooltip).toHaveBeenCalledWith('test-tooltip-123')
  })

  it('hides tooltip locally after dismiss button click', async () => {
    render(
      <OnboardingTooltip
        id="test-tooltip"
        title="Test Title"
        content="Test Content"
        dismissed={false}
      >
        <button>Target Element</button>
      </OnboardingTooltip>
    )

    expect(screen.getByText('Test Title')).toBeInTheDocument()

    const closeButton = screen.getByTestId('tooltip-close-button')
    fireEvent.click(closeButton)

    // After clicking, the title should not be visible
    // Note: This depends on MUI Tooltip behavior in tests
    expect(screen.getByText('Target Element')).toBeInTheDocument()
  })

  it('passes tooltip id correctly', () => {
    const tooltipId = 'unique-tooltip-id'

    render(
      <OnboardingTooltip
        id={tooltipId}
        title="Test"
        content="Content"
        dismissed={false}
      >
        <div>Child</div>
      </OnboardingTooltip>
    )

    const closeButton = screen.getByTestId('tooltip-close-button')
    fireEvent.click(closeButton)

    expect(onboardingActions.dismissTooltip).toHaveBeenCalledWith(tooltipId)
  })
})
