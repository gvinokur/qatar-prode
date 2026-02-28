import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import PendingRequestView from '../../../app/components/friend-groups/pending-request-view';
import { renderWithTheme } from '../../utils/test-utils';
import { testFactories } from '../../db/test-factories';

// Mock next/navigation per-file (global mock in vitest.setup.ts is overridden here for spy access)
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/es',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// Mock the cancelJoinRequestAction
vi.mock('../../../app/actions/prode-group-join-request-actions', () => ({
  cancelJoinRequestAction: vi.fn(),
}));

const mockGroup = testFactories.prodeGroup({ name: 'My Test Group' });
const mockRequestId = 'request-abc-123';
const mockRequestedAt = new Date('2026-01-15T10:00:00Z');

const defaultProps = {
  group: mockGroup,
  requestId: mockRequestId,
  requestedAt: mockRequestedAt,
};

describe('PendingRequestView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows pending request title', () => {
    renderWithTheme(<PendingRequestView {...defaultProps} />);

    expect(screen.getByText('Solicitud Pendiente')).toBeInTheDocument();
  });

  it('shows group name', () => {
    renderWithTheme(<PendingRequestView {...defaultProps} />);

    expect(screen.getByText('My Test Group')).toBeInTheDocument();
  });

  it('shows member count when provided', () => {
    renderWithTheme(<PendingRequestView {...defaultProps} memberCount={5} />);

    expect(screen.getByText(/miembro/i)).toBeInTheDocument();
  });

  it('does not show member count when not provided', () => {
    renderWithTheme(<PendingRequestView {...defaultProps} />);

    expect(screen.queryByText(/miembros/)).not.toBeInTheDocument();
  });

  it('shows hidden content warning', () => {
    renderWithTheme(<PendingRequestView {...defaultProps} />);

    expect(
      screen.getByText(
        'La tabla de posiciones, puntajes e información de apuestas están ocultos hasta que tu solicitud sea aprobada.'
      )
    ).toBeInTheDocument();
  });

  it('shows cancel button', () => {
    renderWithTheme(<PendingRequestView {...defaultProps} />);

    expect(screen.getByRole('button', { name: 'Cancelar Solicitud' })).toBeInTheDocument();
  });

  it('clicking cancel button shows confirm dialog', () => {
    renderWithTheme(<PendingRequestView {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: 'Cancelar Solicitud' });
    fireEvent.click(cancelButton);

    expect(window.confirm).toHaveBeenCalledWith(
      '¿Estás seguro que quieres cancelar tu solicitud de ingreso?'
    );
  });

  it('if confirmed: calls cancelJoinRequestAction with requestId', async () => {
    const { cancelJoinRequestAction } = await import(
      '../../../app/actions/prode-group-join-request-actions'
    );
    (cancelJoinRequestAction as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    renderWithTheme(<PendingRequestView {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: 'Cancelar Solicitud' });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(cancelJoinRequestAction).toHaveBeenCalledWith(mockRequestId);
    });
  });

  it('if confirmed and tournamentId provided: redirects to /${locale}/tournaments/${tournamentId}/friend-groups', async () => {
    const { cancelJoinRequestAction } = await import(
      '../../../app/actions/prode-group-join-request-actions'
    );
    (cancelJoinRequestAction as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    renderWithTheme(
      <PendingRequestView {...defaultProps} tournamentId="tournament-42" />
    );

    const cancelButton = screen.getByRole('button', { name: 'Cancelar Solicitud' });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/es/tournaments/tournament-42/friend-groups');
    });
  });

  it('if confirmed and no tournamentId: redirects to /${locale}', async () => {
    const { cancelJoinRequestAction } = await import(
      '../../../app/actions/prode-group-join-request-actions'
    );
    (cancelJoinRequestAction as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    renderWithTheme(<PendingRequestView {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: 'Cancelar Solicitud' });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/es');
    });
  });

  it('if user cancels confirm dialog: action is NOT called', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    const { cancelJoinRequestAction } = await import(
      '../../../app/actions/prode-group-join-request-actions'
    );

    renderWithTheme(<PendingRequestView {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: 'Cancelar Solicitud' });
    fireEvent.click(cancelButton);

    expect(cancelJoinRequestAction).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('if action fails: shows error message', async () => {
    const { cancelJoinRequestAction } = await import(
      '../../../app/actions/prode-group-join-request-actions'
    );
    (cancelJoinRequestAction as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Error al cancelar solicitud')
    );

    renderWithTheme(<PendingRequestView {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: 'Cancelar Solicitud' });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.getByText('Error al cancelar solicitud')).toBeInTheDocument();
    });
  });
});
