import { screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import FriendGroupsList from './friend-groups-list'
import { renderWithTheme } from '@/__tests__/utils/test-utils'

// Mock InviteFriendsDialog
vi.mock('../invite-friends-dialog', () => ({
  default: vi.fn(({ trigger }) => <div data-testid="invite-dialog">{trigger}</div>)
}))

// Mock server actions
vi.mock('../../actions/prode-group-actions', () => ({
  createDbGroup: vi.fn(),
  deleteGroup: vi.fn(),
}))

describe('FriendGroupsList', () => {
  const mockUserGroups = [
    { id: 'group-1', name: 'My First Group' },
    { id: 'group-2', name: 'My Second Group' },
  ]

  const mockParticipantGroups = [
    { id: 'group-3', name: 'Friend Group' },
  ]

  const mockProps = {
    userGroups: mockUserGroups,
    participantGroups: mockParticipantGroups,
    tournamentId: 'test-tournament',
  }

  const emptyProps = {
    userGroups: [],
    participantGroups: [],
    tournamentId: 'test-tournament',
    pendingRequests: [],
  }

  it('renders the friend groups card with title', () => {
    renderWithTheme(<FriendGroupsList {...mockProps} />)

    expect(screen.getByText('Grupos de Amigos')).toBeInTheDocument()
  })

  it('shows combined subheader with "Estás aquí" and group count when isActive is true', () => {
    renderWithTheme(<FriendGroupsList {...mockProps} isActive={true} />)

    // mockProps has 2 userGroups + 1 participantGroup = 3 total
    expect(screen.getByText('Estás aquí · 3 grupos')).toBeInTheDocument()
  })

  it('does not show "Estás aquí" in subheader when isActive is false', () => {
    renderWithTheme(<FriendGroupsList {...mockProps} isActive={false} />)

    expect(screen.queryByText(/Estás aquí/)).not.toBeInTheDocument()
  })

  it('shows group count in subheader when groups exist', () => {
    renderWithTheme(<FriendGroupsList {...mockProps} />)

    // mockProps has 2 userGroups + 1 participantGroup = 3 total
    expect(screen.getByText('3 grupos')).toBeInTheDocument()
  })

  it('shows "Sin grupos" in subheader when no groups', () => {
    renderWithTheme(<FriendGroupsList {...emptyProps} />)

    expect(screen.getByText('Sin grupos')).toBeInTheDocument()
  })

  it('applies active state styling when isActive is true', () => {
    const { container } = renderWithTheme(<FriendGroupsList {...mockProps} isActive={true} />)

    const card = container.querySelector('.MuiCard-root')
    // MUI sx={{ borderLeft: 3 }} renders as border-left-width
    expect(card).toHaveStyle({
      'border-left-width': '3px',
    })
  })

  it('renders "Ver Grupos" button with Groups icon when multiple groups exist', () => {
    renderWithTheme(<FriendGroupsList {...mockProps} />)

    const button = screen.getByRole('link', { name: /Ver Grupos/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('href', '/es/tournaments/test-tournament/friend-groups')

    // Check icon is present (MUI renders icon as svg)
    const icon = button.querySelector('svg')
    expect(icon).toBeInTheDocument()
  })

  it('renders "Ver Grupos" button when exactly one group exists', () => {
    const propsWithOneGroup = {
      ...mockProps,
      userGroups: [{ id: 'group-1', name: 'Only Group' }],
      participantGroups: [],
    }
    renderWithTheme(<FriendGroupsList {...propsWithOneGroup} />)

    expect(screen.queryByRole('link', { name: /Ver Grupos/i })).toBeInTheDocument()
  })

  it('does not render "Crear Grupo" button in CardActions when collapsed', () => {
    renderWithTheme(<FriendGroupsList {...mockProps} />)

    // When collapsed (unmountOnExit), the create button is not in the DOM
    expect(screen.queryByRole('button', { name: /Crear Grupo/i })).not.toBeInTheDocument()
  })

  it('renders "Crear Grupo" button inside list when expanded', async () => {
    renderWithTheme(<FriendGroupsList {...mockProps} />)

    const expandButton = screen.getByLabelText('mostrar más')
    fireEvent.click(expandButton)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Crear Grupo/i })).toBeInTheDocument()
    })
  })

  it('displays user groups when expanded', async () => {
    renderWithTheme(<FriendGroupsList {...mockProps} />)

    // Expand the card
    const expandButton = screen.getByLabelText('mostrar más')
    fireEvent.click(expandButton)

    // Wait for expansion animation and content to render
    await waitFor(() => {
      expect(screen.getByText('My First Group')).toBeInTheDocument()
    })
    expect(screen.getByText('My Second Group')).toBeInTheDocument()
  })

  it('displays participant groups when expanded', async () => {
    renderWithTheme(<FriendGroupsList {...mockProps} />)

    // Expand the card
    const expandButton = screen.getByLabelText('mostrar más')
    fireEvent.click(expandButton)

    // Wait for expansion animation and content to render
    await waitFor(() => {
      expect(screen.getByText('Friend Group')).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('renders FriendGroupsSidebarEmptyState when no groups and no pending requests', () => {
      renderWithTheme(<FriendGroupsList {...emptyProps} />)

      // Check for sidebar empty state content
      expect(screen.getByText('¡Compite con Amigos!')).toBeInTheDocument()
      expect(screen.getByText(/Crea grupos privados o únete/)).toBeInTheDocument()
    })

    it('renders "Crear Grupo" CTA button in empty state (auto-expanded)', () => {
      renderWithTheme(<FriendGroupsList {...emptyProps} />)

      // Empty state auto-expands, so create button is visible immediately
      expect(screen.getByRole('button', { name: /Crear Grupo/i })).toBeInTheDocument()
    })

    it('renders regular buttons when there are groups', async () => {
      renderWithTheme(<FriendGroupsList {...mockProps} />)

      // Should NOT show empty state
      expect(screen.queryByText('¡Compite con Amigos!')).not.toBeInTheDocument()

      // Expand to find Create button inside list
      const expandButton = screen.getByLabelText('mostrar más')
      fireEvent.click(expandButton)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Crear Grupo/i })).toBeInTheDocument()
      })
    })

    it('renders regular buttons when there are pending requests', async () => {
      const propsWithPendingRequest = {
        userGroups: [],
        participantGroups: [],
        tournamentId: 'test-tournament',
        pendingRequests: [
          { id: 'req-1', group_id: 'group-1', group_name: 'Pending Group' }
        ],
      }

      renderWithTheme(<FriendGroupsList {...propsWithPendingRequest} />)

      // Should NOT show empty state
      expect(screen.queryByText('¡Compite con Amigos!')).not.toBeInTheDocument()

      // Expand to find Create button inside list
      const expandButton = screen.getByLabelText('mostrar más')
      fireEvent.click(expandButton)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Crear Grupo/i })).toBeInTheDocument()
      })
    })

    it('does not render empty state when tournamentId is missing', async () => {
      const propsWithoutTournament = {
        userGroups: [],
        participantGroups: [],
        pendingRequests: [],
      }

      renderWithTheme(<FriendGroupsList {...propsWithoutTournament} />)

      // Should NOT show sidebar empty state (requires tournamentId)
      expect(screen.queryByText('¡Compite con Amigos!')).not.toBeInTheDocument()

      // Expand to find Create button inside list
      const expandButton = screen.getByLabelText('mostrar más')
      fireEvent.click(expandButton)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Crear Grupo/i })).toBeInTheDocument()
      })
    })
  })
})
