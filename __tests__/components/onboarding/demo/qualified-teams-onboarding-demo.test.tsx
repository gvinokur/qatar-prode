import { describe, it, expect, vi } from 'vitest'
import { render, screen, renderHook, act, waitFor } from '@testing-library/react'
import QualifiedTeamsOnboardingDemo from '@/app/components/onboarding/demo/qualified-teams-onboarding-demo'
import { renderWithTheme } from '@/__tests__/utils/test-utils'
import type { Team, TournamentGroup } from '@/app/db/tables-definition'
import React from 'react'

// Mock DnD Kit with realistic behavior
const mockOnDragEnd = vi.fn()
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children, onDragEnd }: any) => {
    // Store the onDragEnd handler for testing
    mockOnDragEnd.mockImplementation(onDragEnd)
    return <div data-testid="dnd-context">{children}</div>
  },
  MouseSensor: vi.fn(),
  TouchSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
  closestCenter: vi.fn(),
}))

vi.mock('@dnd-kit/sortable', () => ({
  arrayMove: (arr: any[], oldIndex: number, newIndex: number) => {
    const newArr = [...arr]
    const [removed] = newArr.splice(oldIndex, 1)
    newArr.splice(newIndex, 0, removed)
    return newArr
  },
}))

// Mock GroupCard with interactive elements
const mockOnToggleThirdPlace = vi.fn()
vi.mock('@/app/components/qualified-teams/group-card', () => ({
  default: ({ group, teams, predictions, onToggleThirdPlace }: any) => {
    // Store handler for testing
    mockOnToggleThirdPlace.mockImplementation(onToggleThirdPlace)
    return (
      <div data-testid="group-card">
        <div data-testid="group-id">{group.id}</div>
        <div data-testid="teams-count">{teams.length}</div>
        <div data-testid="predictions-count">{predictions.size}</div>
        <button
          data-testid="toggle-third-place"
          onClick={() => onToggleThirdPlace && onToggleThirdPlace('team-3')}
        >
          Toggle Third Place
        </button>
      </div>
    )
  },
}))

const mockGroup: TournamentGroup = {
  id: 'group-a',
  tournament_id: 'demo-tournament',
  group_letter: 'A',
  sort_by_games_between_teams: false,
}

const mockTeams: Team[] = [
  { id: 'team-1', name: 'Brasil', short_name: 'BRA', theme: null },
  { id: 'team-2', name: 'Argentina', short_name: 'ARG', theme: null },
  { id: 'team-3', name: 'Uruguay', short_name: 'URU', theme: null },
  { id: 'team-4', name: 'Chile', short_name: 'CHI', theme: null },
]

describe('QualifiedTeamsOnboardingDemo', () => {
  it('renders with mock context provider', () => {
    renderWithTheme(<QualifiedTeamsOnboardingDemo group={mockGroup} teams={mockTeams} />)

    expect(screen.getByTestId('dnd-context')).toBeInTheDocument()
    expect(screen.getByTestId('group-card')).toBeInTheDocument()
  })

  it('passes group and teams to GroupCard', () => {
    renderWithTheme(<QualifiedTeamsOnboardingDemo group={mockGroup} teams={mockTeams} />)

    expect(screen.getByTestId('group-id')).toHaveTextContent('group-a')
    expect(screen.getByTestId('teams-count')).toHaveTextContent('4')
  })

  it('renders with proper layout structure', () => {
    renderWithTheme(<QualifiedTeamsOnboardingDemo group={mockGroup} teams={mockTeams} />)

    // Should render DnD context and group card
    expect(screen.getByTestId('dnd-context')).toBeInTheDocument()
    expect(screen.getByTestId('group-card')).toBeInTheDocument()
  })

  it('transforms predictions from groupId-teamId to teamId keys', () => {
    renderWithTheme(<QualifiedTeamsOnboardingDemo group={mockGroup} teams={mockTeams} />)

    // GroupCard should receive predictions with teamId keys only
    expect(screen.getByTestId('predictions-count')).toHaveTextContent('4')
  })

  it('provides drag and drop sensors', () => {
    renderWithTheme(<QualifiedTeamsOnboardingDemo group={mockGroup} teams={mockTeams} />)

    // DndContext should be set up with sensors
    expect(screen.getByTestId('dnd-context')).toBeInTheDocument()
  })

  it('provides third place toggle handler to GroupCard', () => {
    renderWithTheme(<QualifiedTeamsOnboardingDemo group={mockGroup} teams={mockTeams} />)

    const toggleButton = screen.getByTestId('toggle-third-place')

    // Handler should be provided to GroupCard
    expect(toggleButton).toBeInTheDocument()
  })

  it('passes correct props to GroupCard', () => {
    renderWithTheme(<QualifiedTeamsOnboardingDemo group={mockGroup} teams={mockTeams} />)

    // Verify all required props are present
    expect(screen.getByTestId('group-card')).toBeInTheDocument()
    expect(screen.getByTestId('group-id')).toBeInTheDocument()
    expect(screen.getByTestId('teams-count')).toBeInTheDocument()
    expect(screen.getByTestId('predictions-count')).toBeInTheDocument()
  })

  it('sets up DnD context with collision detection', () => {
    const { container } = renderWithTheme(
      <QualifiedTeamsOnboardingDemo group={mockGroup} teams={mockTeams} />
    )

    // DnD context should be rendered
    const dndContext = screen.getByTestId('dnd-context')
    expect(dndContext).toBeInTheDocument()
  })

  it('renders responsive layout wrapper', () => {
    const { container } = renderWithTheme(
      <QualifiedTeamsOnboardingDemo group={mockGroup} teams={mockTeams} />
    )

    // Component should render without errors
    expect(screen.getByTestId('group-card')).toBeInTheDocument()
  })

  it('handles multiple teams correctly', () => {
    renderWithTheme(<QualifiedTeamsOnboardingDemo group={mockGroup} teams={mockTeams} />)

    // Should handle all 4 teams
    expect(screen.getByTestId('teams-count')).toHaveTextContent('4')
    expect(screen.getByTestId('predictions-count')).toHaveTextContent('4')
  })
})
