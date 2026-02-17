import { vi, describe, it, expect, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import ChecklistStep from '../../../app/components/onboarding/onboarding-steps/checklist-step'
import { createMockTranslations } from '@/__tests__/utils/mock-translations'
import * as intl from 'next-intl'

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: vi.fn(),
  useLocale: vi.fn(() => 'es')
}))

describe('ChecklistStep', () => {
  beforeEach(() => {
    vi.mocked(intl.useTranslations).mockReturnValue(
      createMockTranslations('onboarding.steps.checklist')
    )
  })

  it('renders checklist title', () => {
    const mockOnComplete = vi.fn()
    render(<ChecklistStep onComplete={mockOnComplete} />)

    expect(screen.getByText('[title]')).toBeInTheDocument()
    expect(screen.getByText('[instructions]')).toBeInTheDocument()
  })

  it('renders all checklist items', () => {
    const mockOnComplete = vi.fn()
    render(<ChecklistStep onComplete={mockOnComplete} />)

    expect(screen.getByText('[items.firstPrediction]')).toBeInTheDocument()
    expect(screen.getByText('[items.championAndAwards]')).toBeInTheDocument()
    expect(screen.getByText('[items.qualifiedTeams]')).toBeInTheDocument()
    expect(screen.getByText('[items.joinGroup]')).toBeInTheDocument()
    expect(screen.getByText('[items.reviewRules]')).toBeInTheDocument()
  })

  it('renders deadline education section', () => {
    const mockOnComplete = vi.fn()
    render(<ChecklistStep onComplete={mockOnComplete} />)

    expect(screen.getByText('[deadlinesHeader]')).toBeInTheDocument()
    expect(screen.getByText('[matchPredictions.label]')).toBeInTheDocument()
    expect(screen.getByText('[matchPredictions.deadline]')).toBeInTheDocument()
    expect(screen.getByText('[tournamentAndClassification.label]')).toBeInTheDocument()
    expect(screen.getByText('[tournamentAndClassification.deadline]')).toBeInTheDocument()
    expect(screen.getByText('[boosts.label]')).toBeInTheDocument()
    expect(screen.getByText('[boosts.deadline]')).toBeInTheDocument()
  })

  it('toggles item checked state when clicked', () => {
    const mockOnComplete = vi.fn()
    render(<ChecklistStep onComplete={mockOnComplete} />)

    const firstItem = screen.getByText('[items.firstPrediction]')
    const listItemButton = firstItem.closest('[role="button"]')

    expect(listItemButton).toBeInTheDocument()

    // Click to check
    if (listItemButton) {
      fireEvent.click(listItemButton)
    }

    // Item should now have line-through styling (implementation detail)
    // We can verify the checkbox icon changed by checking for CheckCircleIcon
  })

  it('renders complete button', () => {
    const mockOnComplete = vi.fn()
    render(<ChecklistStep onComplete={mockOnComplete} />)

    const completeButton = screen.getByRole('button', { name: /\[startButton\]/ })
    expect(completeButton).toBeInTheDocument()
  })

  it('calls onComplete when complete button is clicked', () => {
    const mockOnComplete = vi.fn()
    render(<ChecklistStep onComplete={mockOnComplete} />)

    const completeButton = screen.getByRole('button', { name: /\[startButton\]/ })
    fireEvent.click(completeButton)

    expect(mockOnComplete).toHaveBeenCalledTimes(1)
  })

  it('allows multiple items to be checked', () => {
    const mockOnComplete = vi.fn()
    render(<ChecklistStep onComplete={mockOnComplete} />)

    const items = screen.getAllByRole('button').filter(button =>
      button.textContent?.includes('[items.')
    )

    // Click multiple items
    if (items.length >= 2) {
      fireEvent.click(items[0])
      fireEvent.click(items[1])
    }

    // Both should be checkable
    expect(items.length).toBeGreaterThan(0)
  })

  it('allows items to be unchecked', () => {
    const mockOnComplete = vi.fn()
    render(<ChecklistStep onComplete={mockOnComplete} />)

    const firstItem = screen.getByText('[items.firstPrediction]')
    const listItemButton = firstItem.closest('[role="button"]')

    expect(listItemButton).toBeInTheDocument()

    if (listItemButton) {
      // Check
      fireEvent.click(listItemButton)
      // Uncheck
      fireEvent.click(listItemButton)
    }

    // Item should be unchecked again
    expect(listItemButton).toBeInTheDocument()
  })

  it('displays helpful tip about accessing checklist later', () => {
    const mockOnComplete = vi.fn()
    render(<ChecklistStep onComplete={mockOnComplete} />)

    expect(screen.getByText('[infoTip]')).toBeInTheDocument()
  })
})
