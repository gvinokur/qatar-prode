import { screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import GroupStandingsSidebar from './group-standings-sidebar'
import { renderWithTheme } from '@/__tests__/utils/test-utils'

describe('GroupStandingsSidebar', () => {
  const mockGroups = [
    {
      id: 'group-a',
      letter: 'A',
      teamStats: [
        {
          team_id: 'team-1',
          points: 9,
          wins: 3,
          draws: 0,
          losses: 0,
          goals_for: 8,
          goals_against: 2,
          goal_difference: 6,
        },
      ],
      teamsMap: {
        'team-1': { id: 'team-1', name: 'Team A', flag_url: '/flag-a.png' },
      },
    },
    {
      id: 'group-b',
      letter: 'B',
      teamStats: [],
      teamsMap: {},
    },
  ]

  const mockProps = {
    groups: mockGroups,
    defaultGroupId: 'group-a',
    qualifiedTeams: [],
    tournamentId: 'test-tournament',
  }

  it('renders the standings card with title', () => {
    renderWithTheme(<GroupStandingsSidebar {...mockProps} />)

    expect(screen.getByText('Grupos')).toBeInTheDocument()
  })

  it('shows "Estás aquí" text when isActive is true', () => {
    renderWithTheme(<GroupStandingsSidebar {...mockProps} isActive={true} />)

    expect(screen.getByText('Estás aquí')).toBeInTheDocument()
  })

  it('does not show "Estás aquí" text when isActive is false', () => {
    renderWithTheme(<GroupStandingsSidebar {...mockProps} isActive={false} />)

    expect(screen.queryByText('Estás aquí')).not.toBeInTheDocument()
  })

  it('applies active state styling when isActive is true', () => {
    const { container } = renderWithTheme(<GroupStandingsSidebar {...mockProps} isActive={true} />)

    const card = container.querySelector('.MuiCard-root')
    // MUI sx={{ borderLeft: 3 }} renders as border-left-width
    expect(card).toHaveStyle({
      'border-left-width': '3px',
    })
  })

  it('renders "Ver Resultados" button with Assessment icon', () => {
    renderWithTheme(<GroupStandingsSidebar {...mockProps} />)

    const button = screen.getByRole('link', { name: /Ver Resultados/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('href', '/es/tournaments/test-tournament/results')

    // Check icon is present (MUI renders icon as svg)
    const icon = button.querySelector('svg')
    expect(icon).toBeInTheDocument()
  })

  it('displays current group letter', () => {
    renderWithTheme(<GroupStandingsSidebar {...mockProps} />)

    expect(screen.getByText('GRUPO A')).toBeInTheDocument()
  })

  it('returns null when groups array is empty', () => {
    const { container } = renderWithTheme(
      <GroupStandingsSidebar {...mockProps} groups={[]} />
    )

    expect(container.firstChild).toBeNull()
  })

  it('allows navigation between groups', async () => {
    renderWithTheme(<GroupStandingsSidebar {...mockProps} />)

    expect(screen.getByText('GRUPO A')).toBeInTheDocument()

    // Click next button (using Spanish translation for aria-label)
    const nextButton = screen.getByLabelText('Siguiente grupo')
    fireEvent.click(nextButton)

    // Wait for state update to reflect in DOM
    await waitFor(() => {
      expect(screen.getByText('GRUPO B')).toBeInTheDocument()
    })
  })
})
