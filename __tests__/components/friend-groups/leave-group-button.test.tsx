import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { useRouter } from 'next/navigation';
import LeaveGroupButton from '../../../app/components/friend-groups/leave-group-button';
import { renderWithTheme } from '../../utils/test-utils';
import { createMockRouter } from '../../mocks/next-navigation.mocks';
import { leaveGroupAction } from '@/app/actions/prode-group-actions';

vi.mock('@/app/actions/prode-group-actions', () => ({
  leaveGroupAction: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

describe('LeaveGroupButton', () => {
  let mockPush: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPush = vi.fn();
    vi.mocked(useRouter).mockReturnValue(createMockRouter({ push: mockPush }));
    vi.mocked(leaveGroupAction).mockResolvedValue(undefined);
  });

  const openDialogAndWait = async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Dejar grupo' }));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
  };

  const clickConfirm = async () => {
    const allLeaveButtons = await screen.findAllByRole('button', { name: 'Dejar grupo' });
    // The last "Dejar grupo" button is inside the dialog
    fireEvent.click(allLeaveButtons[allLeaveButtons.length - 1]);
  };

  it('renders "Dejar grupo" button', () => {
    renderWithTheme(<LeaveGroupButton groupId="group-1" />);
    expect(screen.getByRole('button', { name: 'Dejar grupo' })).toBeInTheDocument();
  });

  it('clicking the button opens the confirmation dialog', async () => {
    renderWithTheme(<LeaveGroupButton groupId="group-1" />);
    await openDialogAndWait();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('dialog shows title "¿Estás seguro?"', async () => {
    renderWithTheme(<LeaveGroupButton groupId="group-1" />);
    await openDialogAndWait();
    expect(screen.getByText('¿Estás seguro?')).toBeInTheDocument();
  });

  it('clicking Cancel closes the dialog', async () => {
    renderWithTheme(<LeaveGroupButton groupId="group-1" />);
    await openDialogAndWait();

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('clicking confirm button calls leaveGroupAction with groupId', async () => {
    renderWithTheme(<LeaveGroupButton groupId="group-123" />);
    await openDialogAndWait();
    await clickConfirm();

    await waitFor(() => {
      expect(leaveGroupAction).toHaveBeenCalledWith('group-123');
    });
  });

  it('on success with tournamentId redirects to tournament friend-groups page', async () => {
    renderWithTheme(<LeaveGroupButton groupId="group-1" tournamentId="tournament-42" />);
    await openDialogAndWait();
    await clickConfirm();

    await waitFor(() => {
      expect(leaveGroupAction).toHaveBeenCalled();
    });

    // The component uses setTimeout(fn, 1200) for the redirect; wait longer than that
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/es/tournaments/tournament-42/friend-groups');
    }, { timeout: 2000 });
  });

  it('on success without tournamentId redirects to locale root', async () => {
    renderWithTheme(<LeaveGroupButton groupId="group-1" />);
    await openDialogAndWait();
    await clickConfirm();

    await waitFor(() => {
      expect(leaveGroupAction).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/es');
    }, { timeout: 2000 });
  });

  it('on error shows error snackbar message', async () => {
    vi.mocked(leaveGroupAction).mockRejectedValue(new Error('Error al dejar el grupo.'));

    renderWithTheme(<LeaveGroupButton groupId="group-1" />);
    await openDialogAndWait();
    await clickConfirm();

    await waitFor(() => {
      expect(screen.getByText('Error al dejar el grupo.')).toBeInTheDocument();
    });
  });
});
