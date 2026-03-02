import { screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TournamentGroupsList from './tournament-groups-list';
import { renderWithProviders } from '@/__tests__/utils/test-utils';
import type { TournamentGroupStats } from '../../definitions';

// Mock server actions
vi.mock('../../actions/prode-group-actions', () => ({
  createDbGroup: vi.fn(),
}));

describe('TournamentGroupsList', () => {
  const mockGroups: TournamentGroupStats[] = [
    {
      groupId: 'group-1',
      groupName: 'Test Group 1',
      userPosition: 1,
      totalParticipants: 10,
      userPoints: 100,
      leaderName: 'Test User',
      leaderPoints: 100,
      isOwner: true
    },
    {
      groupId: 'group-2',
      groupName: 'Test Group 2',
      userPosition: 2,
      totalParticipants: 5,
      userPoints: 80,
      leaderName: 'Leader User',
      leaderPoints: 90,
      isOwner: false
    }
  ];

  const defaultProps = {
    groups: mockGroups,
    tournamentId: 'test-tournament',
    pendingRequests: []
  };

  describe('With Groups', () => {
    it('renders the groups list header', () => {
      renderWithProviders(<TournamentGroupsList {...defaultProps} />);

      expect(screen.getByText('Grupos de Amigos')).toBeInTheDocument();
    });

    it('renders all group cards', () => {
      renderWithProviders(<TournamentGroupsList {...defaultProps} />);

      expect(screen.getByText('Test Group 1')).toBeInTheDocument();
      expect(screen.getByText('Test Group 2')).toBeInTheDocument();
    });

    it('renders Create Group button', () => {
      renderWithProviders(<TournamentGroupsList {...defaultProps} />);

      expect(screen.getByRole('button', { name: /Crear/i })).toBeInTheDocument();
    });

    it('renders Discover Groups button', () => {
      renderWithProviders(<TournamentGroupsList {...defaultProps} />);

      expect(screen.getByRole('button', { name: /Descubrir/i })).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    const emptyProps = {
      groups: [],
      tournamentId: 'test-tournament',
      pendingRequests: []
    };

    it('renders FriendGroupsLandingEmptyState when no groups and no pending requests', () => {
      renderWithProviders(<TournamentGroupsList {...emptyProps} />);

      // Check for landing page empty state content
      expect(screen.getByText('Las Predicciones Son Mejores con Amigos')).toBeInTheDocument();
      expect(screen.getByText(/Crea grupos privados para tu grupo/)).toBeInTheDocument();
    });

    it('renders Create Your First Group button in empty state', () => {
      renderWithProviders(<TournamentGroupsList {...emptyProps} />);

      expect(screen.getByRole('button', { name: /Crea Tu Primer Grupo/i })).toBeInTheDocument();
    });

    it('renders Discover Public Groups button in empty state', () => {
      renderWithProviders(<TournamentGroupsList {...emptyProps} />);

      expect(screen.getByRole('button', { name: /Descubrir Grupos Públicos/i })).toBeInTheDocument();
    });

    it('renders features section in empty state', () => {
      renderWithProviders(<TournamentGroupsList {...emptyProps} />);

      expect(screen.getByText('¿Por Qué Unirse o Crear un Grupo?')).toBeInTheDocument();
      expect(screen.getByText('Grupos Privados')).toBeInTheDocument();
      expect(screen.getByText('Competencias Públicas')).toBeInTheDocument();
    });

    it('renders how it works section in empty state', () => {
      renderWithProviders(<TournamentGroupsList {...emptyProps} />);

      expect(screen.getByText('Cómo Funciona')).toBeInTheDocument();
      expect(screen.getByText('Crear un Grupo')).toBeInTheDocument();
      expect(screen.getByText('Unirse a un Grupo Privado')).toBeInTheDocument();
      expect(screen.getByText('Unirse a un Grupo Público')).toBeInTheDocument();
    });

    it('renders use cases section in empty state', () => {
      renderWithProviders(<TournamentGroupsList {...emptyProps} />);

      expect(screen.getByText('Formas Populares de Usar Grupos')).toBeInTheDocument();
      expect(screen.getByText('Familia y Amigos')).toBeInTheDocument();
      expect(screen.getByText('Competencias de Oficina')).toBeInTheDocument();
    });

    it('renders final CTA section in empty state', () => {
      renderWithProviders(<TournamentGroupsList {...emptyProps} />);

      expect(screen.getByText('¿Listo para Comenzar?')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Crear un Grupo Privado/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Explorar Grupos Públicos/i })).toBeInTheDocument();
    });

    it('does not render empty state when there are groups', () => {
      renderWithProviders(<TournamentGroupsList {...defaultProps} />);

      // Should NOT show landing empty state
      expect(screen.queryByText('Las Predicciones Son Mejores con Amigos')).not.toBeInTheDocument();
    });

    it('does not render empty state when there are pending requests', () => {
      const propsWithPendingRequest = {
        groups: [],
        tournamentId: 'test-tournament',
        pendingRequests: [
          {
            id: 'req-1',
            group_id: 'group-1',
            group_name: 'Pending Group',
            status: 'pending' as const,
            requested_at: new Date()
          }
        ]
      };

      renderWithProviders(<TournamentGroupsList {...propsWithPendingRequest} />);

      // Should NOT show landing empty state
      expect(screen.queryByText('Las Predicciones Son Mejores con Amigos')).not.toBeInTheDocument();

      // Should show regular group cards (pending request card)
      expect(screen.getByText('Pending Group')).toBeInTheDocument();
    });
  });

  describe('Create Dialog', () => {
    it('opens create dialog when Create button is clicked in regular view', () => {
      renderWithProviders(<TournamentGroupsList {...defaultProps} />);

      const createButton = screen.getByRole('button', { name: /Crear/i });
      fireEvent.click(createButton);

      // Dialog should be open
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Crear Grupo de Amigos')).toBeInTheDocument();
    });

    it('opens create dialog when Create button is clicked in empty state', () => {
      const emptyProps = {
        groups: [],
        tournamentId: 'test-tournament',
        pendingRequests: []
      };

      renderWithProviders(<TournamentGroupsList {...emptyProps} />);

      const createButton = screen.getByRole('button', { name: /Crea Tu Primer Grupo/i });
      fireEvent.click(createButton);

      // Dialog should be open
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Crear Grupo de Amigos')).toBeInTheDocument();
    });
  });
});
