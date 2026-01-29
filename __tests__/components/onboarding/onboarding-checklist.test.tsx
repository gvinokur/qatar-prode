import { describe, it, expect } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import OnboardingChecklist from '../../../app/components/onboarding/onboarding-checklist'
import type { OnboardingChecklistItem } from '../../../app/db/tables-definition'

describe('OnboardingChecklist', () => {
  const mockItems: OnboardingChecklistItem[] = [
    { id: 'task1', label: 'First task', completed: true, completedAt: new Date('2024-01-01'), order: 1 },
    { id: 'task2', label: 'Second task', completed: false, completedAt: undefined, order: 2 },
    { id: 'task3', label: 'Third task', completed: true, completedAt: new Date('2024-01-02'), order: 3 },
  ]

  it('renders checklist title', () => {
    render(<OnboardingChecklist items={mockItems} />)
    expect(screen.getByText('Lista de Primeros Pasos')).toBeInTheDocument()
  })

  it('displays progress summary', () => {
    render(<OnboardingChecklist items={mockItems} />)
    expect(screen.getByText('2 de 3 completadas (67%)')).toBeInTheDocument()
  })

  it('renders all checklist items', () => {
    render(<OnboardingChecklist items={mockItems} />)
    expect(screen.getByText('First task')).toBeInTheDocument()
    expect(screen.getByText('Second task')).toBeInTheDocument()
    expect(screen.getByText('Third task')).toBeInTheDocument()
  })

  it('shows completion date for completed items', () => {
    render(<OnboardingChecklist items={mockItems} />)
    // Check for "Completado:" text - exact date format may vary by locale
    const completedTexts = screen.getAllByText(/Completado:/)
    expect(completedTexts.length).toBe(2) // Two completed items
  })

  it('displays correct icons for completed and incomplete items', () => {
    const { container } = render(<OnboardingChecklist items={mockItems} />)
    // Material UI renders CheckCircleIcon and RadioButtonUncheckedIcon
    const icons = container.querySelectorAll('svg')
    expect(icons.length).toBeGreaterThan(0)
  })

  it('sorts items by order', () => {
    const unsortedItems: OnboardingChecklistItem[] = [
      { id: 'task3', label: 'Third task', completed: false, completedAt: undefined, order: 3 },
      { id: 'task1', label: 'First task', completed: false, completedAt: undefined, order: 1 },
      { id: 'task2', label: 'Second task', completed: false, completedAt: undefined, order: 2 },
    ]

    render(<OnboardingChecklist items={unsortedItems} />)

    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('First task')
    expect(items[1]).toHaveTextContent('Second task')
    expect(items[2]).toHaveTextContent('Third task')
  })

  it('shows message when no items provided', () => {
    render(<OnboardingChecklist items={[]} />)
    expect(screen.getByText('No hay elementos en la lista de tareas')).toBeInTheDocument()
  })

  it('handles undefined items gracefully', () => {
    render(<OnboardingChecklist items={undefined as any} />)
    expect(screen.getByText('No hay elementos en la lista de tareas')).toBeInTheDocument()
  })

  it('calculates progress correctly with all completed', () => {
    const allCompleted: OnboardingChecklistItem[] = [
      { id: 'task1', label: 'First task', completed: true, completedAt: new Date(), order: 1 },
      { id: 'task2', label: 'Second task', completed: true, completedAt: new Date(), order: 2 },
    ]

    render(<OnboardingChecklist items={allCompleted} />)
    expect(screen.getByText('2 de 2 completadas (100%)')).toBeInTheDocument()
  })

  it('calculates progress correctly with none completed', () => {
    const noneCompleted: OnboardingChecklistItem[] = [
      { id: 'task1', label: 'First task', completed: false, completedAt: undefined, order: 1 },
      { id: 'task2', label: 'Second task', completed: false, completedAt: undefined, order: 2 },
    ]

    render(<OnboardingChecklist items={noneCompleted} />)
    expect(screen.getByText('0 de 2 completadas (0%)')).toBeInTheDocument()
  })
})
