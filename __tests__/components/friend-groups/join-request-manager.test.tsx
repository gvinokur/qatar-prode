import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { useRouter } from 'next/navigation';
import JoinRequestManager from '../../../app/components/friend-groups/join-request-manager';
import { renderWithTheme } from '../../utils/test-utils';
import { createMockRouter } from '../../mocks/next-navigation.mocks';

vi.mock('@/app/actions/prode-group-join-request-actions', () => ({
  approveJoinRequestAction: vi.fn(),
  rejectJoinRequestAction: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

const makeRequest = (overrides: Partial<{
  id: string;
  user_id: string;
  user_nickname?: string | null;
  user_email?: string | null;
  requested_at: Date;
  request_source: string;
  status: string;
  message?: string | null;
}> = {}) => ({
  id: 'request-1',
  user_id: 'user-1',
  user_nickname: 'TestUser',
  user_email: 'test@example.com',
  requested_at: new Date('2026-02-20T12:00:00Z'),
  request_source: 'invite_link',
  status: 'pending',
  ...overrides,
});

const defaultProps = {
  groupId: 'group-1',
  initialRequests: [] as ReturnType<typeof makeRequest>[],
  locale: 'es' as const,
};

describe('JoinRequestManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue(createMockRouter());
  });

  describe('Empty state', () => {
    it('shows "No hay solicitudes pendientes" when no pending and no rejected requests', () => {
      renderWithTheme(
        <JoinRequestManager {...defaultProps} initialRequests={[]} />
      );

      expect(screen.getByText('No hay solicitudes pendientes')).toBeInTheDocument();
    });
  });

  describe('Pending requests', () => {
    it('shows the user nickname for a pending request', () => {
      const request = makeRequest({ user_nickname: 'JuanPerez', status: 'pending' });
      renderWithTheme(
        <JoinRequestManager {...defaultProps} initialRequests={[request]} />
      );

      expect(screen.getByText('JuanPerez')).toBeInTheDocument();
    });

    it('shows Approve and Reject buttons for pending requests', () => {
      const request = makeRequest({ status: 'pending' });
      renderWithTheme(
        <JoinRequestManager {...defaultProps} initialRequests={[request]} />
      );

      expect(screen.getByRole('button', { name: /Aprobar/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Rechazar/i })).toBeInTheDocument();
    });

    it('displays message in italic when present', () => {
      const request = makeRequest({ status: 'pending', message: 'Hola, soy tu amigo del gimnasio' });
      renderWithTheme(
        <JoinRequestManager {...defaultProps} initialRequests={[request]} />
      );

      expect(screen.getByText(/Hola, soy tu amigo del gimnasio/i)).toBeInTheDocument();
    });

    it('does not render message element when message is null', () => {
      const request = makeRequest({ status: 'pending', message: null });
      renderWithTheme(
        <JoinRequestManager {...defaultProps} initialRequests={[request]} />
      );

      // The request renders without any message block — only standard elements visible
      expect(screen.getByText('TestUser')).toBeInTheDocument();
      // No italic message text should exist
      const italicElements = document.querySelectorAll('[style*="italic"]');
      expect(italicElements.length).toBe(0);
    });

    it('does not render message element when message is undefined', () => {
      const request = makeRequest({ status: 'pending' }); // message not set
      renderWithTheme(
        <JoinRequestManager {...defaultProps} initialRequests={[request]} />
      );

      expect(screen.getByText('TestUser')).toBeInTheDocument();
      const italicElements = document.querySelectorAll('[style*="italic"]');
      expect(italicElements.length).toBe(0);
    });
  });

  describe('Rejected requests', () => {
    it('shows "Rechazadas Recientemente" section title for rejected requests', () => {
      const request = makeRequest({ id: 'request-2', status: 'rejected' });
      renderWithTheme(
        <JoinRequestManager {...defaultProps} initialRequests={[request]} />
      );

      expect(screen.getByText('Rechazadas Recientemente')).toBeInTheDocument();
    });

    it('shows "Aprobar de todas formas" button but no Reject button for rejected requests', () => {
      const request = makeRequest({ id: 'request-2', status: 'rejected' });
      renderWithTheme(
        <JoinRequestManager {...defaultProps} initialRequests={[request]} />
      );

      expect(screen.getByRole('button', { name: /Aprobar de todas formas/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Rechazar/i })).not.toBeInTheDocument();
    });
  });

  describe('Approve action', () => {
    it('calls approveJoinRequestAction and shows success message on approve', async () => {
      const { approveJoinRequestAction } = await import('@/app/actions/prode-group-join-request-actions');
      (approveJoinRequestAction as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      // Use two requests so that after one is approved the list is not empty
      // (the empty-state card does not render the success Alert)
      const request1 = makeRequest({ id: 'request-1', user_nickname: 'User1', status: 'pending' });
      const request2 = makeRequest({ id: 'request-2', user_nickname: 'User2', status: 'pending' });
      renderWithTheme(
        <JoinRequestManager {...defaultProps} initialRequests={[request1, request2]} />
      );

      fireEvent.click(screen.getAllByRole('button', { name: /^Aprobar$/i })[0]);

      await waitFor(() => {
        expect(approveJoinRequestAction).toHaveBeenCalledWith('request-1', 'group-1', undefined);
        expect(screen.getByText('Solicitud aprobada')).toBeInTheDocument();
      });
    });

    it('performs optimistic update: removes request from list immediately after approve', async () => {
      const { approveJoinRequestAction } = await import('@/app/actions/prode-group-join-request-actions');
      (approveJoinRequestAction as ReturnType<typeof vi.fn>).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 200))
      );

      const request = makeRequest({ user_nickname: 'OptimisticUser', status: 'pending' });
      renderWithTheme(
        <JoinRequestManager {...defaultProps} initialRequests={[request]} />
      );

      expect(screen.getByText('OptimisticUser')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /Aprobar/i }));

      // After click the item should be removed optimistically before server responds
      await waitFor(() => {
        expect(screen.queryByText('OptimisticUser')).not.toBeInTheDocument();
      });
    });

    it('reverts the list on approve failure', async () => {
      const { approveJoinRequestAction } = await import('@/app/actions/prode-group-join-request-actions');
      (approveJoinRequestAction as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Server error')
      );

      const request = makeRequest({ user_nickname: 'RevertUser', status: 'pending' });
      renderWithTheme(
        <JoinRequestManager {...defaultProps} initialRequests={[request]} />
      );

      fireEvent.click(screen.getByRole('button', { name: /Aprobar/i }));

      await waitFor(() => {
        // Request should be restored after failure
        expect(screen.getByText('RevertUser')).toBeInTheDocument();
      });
    });
  });

  describe('Reject action', () => {
    it('calls rejectJoinRequestAction and shows success message on reject', async () => {
      const { rejectJoinRequestAction } = await import('@/app/actions/prode-group-join-request-actions');
      (rejectJoinRequestAction as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      // Use two requests so that after one is rejected the list is not empty
      // (the empty-state card does not render the success Alert)
      const request1 = makeRequest({ id: 'request-1', user_nickname: 'User1', status: 'pending' });
      const request2 = makeRequest({ id: 'request-2', user_nickname: 'User2', status: 'pending' });
      renderWithTheme(
        <JoinRequestManager {...defaultProps} initialRequests={[request1, request2]} />
      );

      fireEvent.click(screen.getAllByRole('button', { name: /Rechazar/i })[0]);

      await waitFor(() => {
        expect(rejectJoinRequestAction).toHaveBeenCalledWith('request-1', 'group-1');
        expect(screen.getByText('Solicitud rechazada')).toBeInTheDocument();
      });
    });
  });

  describe('Both pending and rejected requests', () => {
    it('shows pending and rejected sections simultaneously', () => {
      const pendingRequest = makeRequest({
        id: 'pending-1',
        user_nickname: 'PendingUser',
        status: 'pending',
      });
      const rejectedRequest = makeRequest({
        id: 'rejected-1',
        user_nickname: 'RejectedUser',
        status: 'rejected',
      });

      renderWithTheme(
        <JoinRequestManager
          {...defaultProps}
          initialRequests={[pendingRequest, rejectedRequest]}
        />
      );

      expect(screen.getByText('PendingUser')).toBeInTheDocument();
      expect(screen.getByText('RejectedUser')).toBeInTheDocument();
      expect(screen.getByText('Rechazadas Recientemente')).toBeInTheDocument();
      // Pending request has Approve button (exact text) and Reject button
      expect(screen.getByRole('button', { name: /^Aprobar$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Rechazar/i })).toBeInTheDocument();
      // Rejected request has "Aprobar de todas formas" button
      expect(screen.getByRole('button', { name: /Aprobar de todas formas/i })).toBeInTheDocument();
    });
  });
});
