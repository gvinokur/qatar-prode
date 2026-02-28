import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import PendingRequestsCard from '../../../app/components/friend-groups/pending-requests-card';
import { renderWithTheme } from '../../utils/test-utils';

vi.mock('@/app/actions/prode-group-join-request-actions', () => ({
  cancelJoinRequestAction: vi.fn(),
}));

const mockRefresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: mockRefresh,
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

interface UserJoinRequest {
  id: string;
  group_id: string;
  group_name?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: Date;
  resolved_at?: Date | null;
}

const makePendingRequest = (overrides: Partial<UserJoinRequest> = {}): UserJoinRequest => ({
  id: 'req-1',
  group_id: 'group-1',
  group_name: 'Mi Grupo',
  status: 'pending',
  requested_at: new Date('2026-02-01T12:00:00Z'),
  resolved_at: null,
  ...overrides,
});

describe('PendingRequestsCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Empty state', () => {
    it('shows "No hay solicitudes pendientes" when requests array is empty', () => {
      renderWithTheme(<PendingRequestsCard requests={[]} />);

      expect(screen.getByText('No hay solicitudes pendientes')).toBeInTheDocument();
    });

    it('shows card title "Mis Solicitudes Pendientes" in empty state', () => {
      renderWithTheme(<PendingRequestsCard requests={[]} />);

      expect(screen.getByText('Mis Solicitudes Pendientes')).toBeInTheDocument();
    });
  });

  describe('Card title', () => {
    it('shows card title "Mis Solicitudes Pendientes" when requests exist', () => {
      const requests = [makePendingRequest()];

      renderWithTheme(<PendingRequestsCard requests={requests} />);

      expect(screen.getByText('Mis Solicitudes Pendientes')).toBeInTheDocument();
    });
  });

  describe('Group name display', () => {
    it('shows the group name for a pending request', () => {
      const requests = [makePendingRequest({ group_name: 'Los Campeones' })];

      renderWithTheme(<PendingRequestsCard requests={requests} />);

      expect(screen.getByText('Los Campeones')).toBeInTheDocument();
    });

    it('shows "Grupo Desconocido" when group_name is null', () => {
      const requests = [makePendingRequest({ group_name: null })];

      renderWithTheme(<PendingRequestsCard requests={requests} />);

      expect(screen.getByText('Grupo Desconocido')).toBeInTheDocument();
    });

    it('shows "Grupo Desconocido" when group_name is undefined', () => {
      const requests = [makePendingRequest({ group_name: undefined })];

      renderWithTheme(<PendingRequestsCard requests={requests} />);

      expect(screen.getByText('Grupo Desconocido')).toBeInTheDocument();
    });
  });

  describe('Status chips', () => {
    it('shows "Pendiente" chip for pending requests', () => {
      const requests = [makePendingRequest({ status: 'pending' })];

      renderWithTheme(<PendingRequestsCard requests={requests} />);

      expect(screen.getByText('Pendiente')).toBeInTheDocument();
    });

    it('shows "Rechazada" chip for rejected requests', () => {
      const requests = [
        makePendingRequest({ id: 'req-2', status: 'rejected', resolved_at: null }),
      ];

      renderWithTheme(<PendingRequestsCard requests={requests} />);

      expect(screen.getByText('Rechazada')).toBeInTheDocument();
    });

    it('shows "Aprobada" chip for approved requests', () => {
      const requests = [makePendingRequest({ id: 'req-3', status: 'approved' })];

      renderWithTheme(<PendingRequestsCard requests={requests} />);

      expect(screen.getByText('Aprobada')).toBeInTheDocument();
    });
  });

  describe('Cancel button', () => {
    it('shows Cancel button for pending requests', () => {
      const requests = [makePendingRequest({ status: 'pending' })];

      renderWithTheme(<PendingRequestsCard requests={requests} />);

      expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
    });

    it('does NOT show Cancel button for rejected requests', () => {
      const requests = [makePendingRequest({ status: 'rejected', resolved_at: null })];

      renderWithTheme(<PendingRequestsCard requests={requests} />);

      expect(screen.queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument();
    });

    it('does NOT show Cancel button for approved requests', () => {
      const requests = [makePendingRequest({ status: 'approved' })];

      renderWithTheme(<PendingRequestsCard requests={requests} />);

      expect(screen.queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument();
    });
  });

  describe('canRequestAgain text', () => {
    it('shows "Puedes solicitar nuevamente" for rejected requests with resolved_at', () => {
      const requests = [
        makePendingRequest({
          status: 'rejected',
          resolved_at: new Date('2026-02-20T12:00:00Z'),
        }),
      ];

      renderWithTheme(<PendingRequestsCard requests={requests} />);

      expect(screen.getByText(/Puedes solicitar nuevamente/)).toBeInTheDocument();
    });

    it('does NOT show "Puedes solicitar nuevamente" for rejected requests without resolved_at', () => {
      const requests = [
        makePendingRequest({ status: 'rejected', resolved_at: null }),
      ];

      renderWithTheme(<PendingRequestsCard requests={requests} />);

      expect(screen.queryByText(/Puedes solicitar nuevamente/)).not.toBeInTheDocument();
    });
  });

  describe('Show all / pagination', () => {
    const manyRequests = (): UserJoinRequest[] =>
      Array.from({ length: 5 }, (_, i) =>
        makePendingRequest({
          id: `req-${i + 1}`,
          group_name: `Grupo ${i + 1}`,
        })
      );

    it('shows only the first 3 requests initially when more than 3 exist', () => {
      renderWithTheme(<PendingRequestsCard requests={manyRequests()} />);

      expect(screen.getByText('Grupo 1')).toBeInTheDocument();
      expect(screen.getByText('Grupo 2')).toBeInTheDocument();
      expect(screen.getByText('Grupo 3')).toBeInTheDocument();
      expect(screen.queryByText('Grupo 4')).not.toBeInTheDocument();
      expect(screen.queryByText('Grupo 5')).not.toBeInTheDocument();
    });

    it('shows a "viewAll" button when more than 3 requests exist', () => {
      renderWithTheme(<PendingRequestsCard requests={manyRequests()} />);

      // The component uses tCommon('viewAll') from namespace 'common.buttons',
      // which returns the key 'viewAll' since it's not found in that namespace.
      expect(screen.getByRole('button', { name: 'viewAll' })).toBeInTheDocument();
    });

    it('does NOT show the "viewAll" button when 3 or fewer requests exist', () => {
      const requests = [
        makePendingRequest({ id: 'req-1', group_name: 'Grupo 1' }),
        makePendingRequest({ id: 'req-2', group_name: 'Grupo 2' }),
        makePendingRequest({ id: 'req-3', group_name: 'Grupo 3' }),
      ];

      renderWithTheme(<PendingRequestsCard requests={requests} />);

      expect(screen.queryByRole('button', { name: 'viewAll' })).not.toBeInTheDocument();
    });

    it('shows all requests after clicking the "viewAll" button', () => {
      renderWithTheme(<PendingRequestsCard requests={manyRequests()} />);

      const viewAllButton = screen.getByRole('button', { name: 'viewAll' });
      fireEvent.click(viewAllButton);

      expect(screen.getByText('Grupo 1')).toBeInTheDocument();
      expect(screen.getByText('Grupo 2')).toBeInTheDocument();
      expect(screen.getByText('Grupo 3')).toBeInTheDocument();
      expect(screen.getByText('Grupo 4')).toBeInTheDocument();
      expect(screen.getByText('Grupo 5')).toBeInTheDocument();
    });

    it('hides the "viewAll" button after it is clicked', () => {
      renderWithTheme(<PendingRequestsCard requests={manyRequests()} />);

      const viewAllButton = screen.getByRole('button', { name: 'viewAll' });
      fireEvent.click(viewAllButton);

      expect(screen.queryByRole('button', { name: 'viewAll' })).not.toBeInTheDocument();
    });
  });

  describe('Cancel action', () => {
    it('calls confirm dialog before canceling a request', async () => {
      const { cancelJoinRequestAction } = await import(
        '@/app/actions/prode-group-join-request-actions'
      );
      (cancelJoinRequestAction as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const requests = [makePendingRequest({ id: 'req-cancel' })];
      renderWithTheme(<PendingRequestsCard requests={requests} />);

      const cancelButton = screen.getByRole('button', { name: 'Cancelar' });
      fireEvent.click(cancelButton);

      expect(window.confirm).toHaveBeenCalledWith(
        '¿Estás seguro que quieres cancelar esta solicitud?'
      );

      // Wait for async action to settle to avoid act() warnings
      await waitFor(() => {
        expect(cancelJoinRequestAction).toHaveBeenCalled();
      });
    });

    it('calls cancelJoinRequestAction with the request id after confirming', async () => {
      const { cancelJoinRequestAction } = await import(
        '@/app/actions/prode-group-join-request-actions'
      );
      (cancelJoinRequestAction as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const requests = [makePendingRequest({ id: 'req-cancel' })];
      renderWithTheme(<PendingRequestsCard requests={requests} />);

      const cancelButton = screen.getByRole('button', { name: 'Cancelar' });
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(cancelJoinRequestAction).toHaveBeenCalledWith('req-cancel');
      });
    });

    it('removes the request from the list after a successful cancel', async () => {
      const { cancelJoinRequestAction } = await import(
        '@/app/actions/prode-group-join-request-actions'
      );
      (cancelJoinRequestAction as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const requests = [
        makePendingRequest({ id: 'req-keep', group_name: 'Grupo A' }),
        makePendingRequest({ id: 'req-cancel', group_name: 'Grupo B' }),
      ];
      renderWithTheme(<PendingRequestsCard requests={requests} />);

      expect(screen.getByText('Grupo B')).toBeInTheDocument();

      const cancelButtons = screen.getAllByRole('button', { name: 'Cancelar' });
      // Second cancel button corresponds to 'Grupo B' (req-cancel)
      fireEvent.click(cancelButtons[1]);

      await waitFor(() => {
        expect(screen.queryByText('Grupo B')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Grupo A')).toBeInTheDocument();
    });

    it('does NOT call cancelJoinRequestAction when confirm is dismissed', async () => {
      const { cancelJoinRequestAction } = await import(
        '@/app/actions/prode-group-join-request-actions'
      );
      vi.spyOn(window, 'confirm').mockReturnValue(false);

      const requests = [makePendingRequest({ id: 'req-cancel' })];
      renderWithTheme(<PendingRequestsCard requests={requests} />);

      const cancelButton = screen.getByRole('button', { name: 'Cancelar' });
      fireEvent.click(cancelButton);

      expect(cancelJoinRequestAction).not.toHaveBeenCalled();
    });
  });
});
