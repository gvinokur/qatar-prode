import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import QualifiedTeamsOnboardingDemo from '@/app/components/onboarding/demo/qualified-teams-onboarding-demo'
import { renderWithTheme } from '@/__tests__/utils/test-utils'
import type { Team, TournamentGroup } from '@/app/db/tables-definition'

// Mock DnD Kit
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: any) => <div data-testid="dnd-context">{children}</div>,
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

// Mock GroupCard
vi.mock('@/app/components/qualified-teams/group-card', () => ({
  default: ({ group, teams }: any) => (
    <div data-testid="group-card">
      <div data-testid="group-id">{group.id}</div>
      <div data-testid="teams-count">{teams.length}</div>
    </div>
  ),
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
})
