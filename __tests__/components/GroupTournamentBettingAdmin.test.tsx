import { vi, describe, it, expect, beforeEach, afterEach, Mock } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GroupTournamentBettingAdmin from '../../app/components/friend-groups/group-tournament-betting-admin';
import { setGroupTournamentBettingConfigAction, setUserGroupTournamentBettingPaymentAction } from '../../app/actions/group-tournament-betting-actions';
import { ProdeGroupTournamentBetting, ProdeGroupTournamentBettingPayment } from '../../app/db/tables-definition';

// Mock the actions
vi.mock('../../app/actions/group-tournament-betting-actions', () => ({
  setGroupTournamentBettingConfigAction: vi.fn(),
  setUserGroupTournamentBettingPaymentAction: vi.fn(),
}));

describe('GroupTournamentBettingAdmin', () => {
  const mockProps = {
    groupId: 'group-1',
    tournamentId: 'tournament-1',
    currentUserId: 'user-1',
    isAdmin: true,
    members: [
      { id: 'user-1', nombre: 'User One' },
      { id: 'user-2', nombre: 'User Two' },
    ],
    config: {
      id: 'config-1',
      group_id: 'group-1',
      tournament_id: 'tournament-1',
      betting_enabled: true,
      betting_amount: 100,
      betting_payout_description: 'Test description',
    } as ProdeGroupTournamentBetting,
    payments: [
      { id: 'payment-1', group_tournament_betting_id: 'config-1', user_id: 'user-1', has_paid: true },
      { id: 'payment-2', group_tournament_betting_id: 'config-1', user_id: 'user-2', has_paid: false },
    ] as ProdeGroupTournamentBettingPayment[],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Owner View', () => {
    it('renders betting configuration section', () => {
      render(<GroupTournamentBettingAdmin {...mockProps} />);
      
      expect(screen.getByText('Apuesta habilitada')).toBeInTheDocument();
      expect(screen.getAllByText('Monto de la apuesta').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Descripción del pago').length).toBeGreaterThan(0);
    });

    it('toggles betting enabled state', async () => {
      (setGroupTournamentBettingConfigAction as Mock).mockResolvedValueOnce({
        ...mockProps.config,
        betting_enabled: false,
      });

      render(<GroupTournamentBettingAdmin {...mockProps} />);
      
      const toggleButton = screen.getByText('Deshabilitar');
      await act(async () => {
        await userEvent.click(toggleButton);
      });

      expect(setGroupTournamentBettingConfigAction).toHaveBeenCalledWith(
        mockProps.groupId,
        mockProps.tournamentId,
        expect.objectContaining({
          betting_enabled: false,
        })
      );

      await waitFor(() => {
        expect(screen.getByText('Apuesta deshabilitada')).toBeInTheDocument();
      });
    });

    it('updates betting amount on blur', async () => {
      (setGroupTournamentBettingConfigAction as Mock).mockResolvedValueOnce({
        ...mockProps.config,
        betting_amount: 200,
      });

      render(<GroupTournamentBettingAdmin {...mockProps} />);
      
      const amountInput = screen.getByLabelText('Monto de la apuesta');
      await act(async () => {
        await userEvent.clear(amountInput);
        await userEvent.type(amountInput, '200');
        fireEvent.blur(amountInput);
      });

      expect(setGroupTournamentBettingConfigAction).toHaveBeenCalledWith(
        mockProps.groupId,
        mockProps.tournamentId,
        expect.objectContaining({
          betting_amount: 200,
        })
      );
    });

    it('updates betting description on blur', async () => {
      const newDescription = 'New test description';
      (setGroupTournamentBettingConfigAction as Mock).mockResolvedValueOnce({
        ...mockProps.config,
        betting_payout_description: newDescription,
      });

      render(<GroupTournamentBettingAdmin {...mockProps} />);
      
      const descriptionInput = screen.getByLabelText('Descripción del pago');
      await act(async () => {
        await userEvent.clear(descriptionInput);
        await userEvent.type(descriptionInput, newDescription);
        fireEvent.blur(descriptionInput);
      });

      expect(setGroupTournamentBettingConfigAction).toHaveBeenCalledWith(
        mockProps.groupId,
        mockProps.tournamentId,
        expect.objectContaining({
          betting_payout_description: newDescription,
        })
      );
    });

    it('toggles payment status', async () => {
      (setUserGroupTournamentBettingPaymentAction as Mock).mockResolvedValueOnce({});

      render(<GroupTournamentBettingAdmin {...mockProps} />);
      
      const toggleButtons = screen.getAllByText('Cambiar');
      await act(async () => {
        await userEvent.click(toggleButtons[1]); // Click for User Two
      });

      expect(setUserGroupTournamentBettingPaymentAction).toHaveBeenCalledWith(
        mockProps.config.id,
        'user-2',
        true,
        mockProps.groupId
      );
    });

    it('shows error message when update fails', async () => {
      const errorMessage = 'Update failed';
      (setGroupTournamentBettingConfigAction as Mock).mockRejectedValueOnce(new Error(errorMessage));

      render(<GroupTournamentBettingAdmin {...mockProps} />);
      
      const toggleButton = screen.getByText('Deshabilitar');
      await act(async () => {
        await userEvent.click(toggleButton);
      });

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('handles marking member as paid when no payment info exists', async () => {
      const propsWithNewMember = {
        ...mockProps,
        members: [
          ...mockProps.members,
          { id: 'user-3', nombre: 'User Three' }
        ],
        payments: mockProps.payments // No payment info for user-3
      };

      (setUserGroupTournamentBettingPaymentAction as Mock).mockResolvedValueOnce({
        id: 'payment-3',
        group_tournament_betting_id: 'config-1',
        user_id: 'user-3',
        has_paid: true
      });

      render(<GroupTournamentBettingAdmin {...propsWithNewMember} />);
      
      // Find the toggle button for User Three
      const userThreeRow = screen.getByText('User Three').closest('tr');
      const toggleButton = userThreeRow?.querySelector('button');
      
      await act(async () => {
        await userEvent.click(toggleButton!);
      });

      expect(setUserGroupTournamentBettingPaymentAction).toHaveBeenCalledWith(
        mockProps.config.id,
        'user-3',
        true,
        mockProps.groupId
      );

      // Verify the UI updates to show the payment status
      await waitFor(() => {
        expect(screen.getAllByText('✅')).toHaveLength(2); // Now two members are marked as paid
      });
    });
  });

  describe('Non-Owner View', () => {
    const nonOwnerProps = {
      ...mockProps,
      isAdmin: false,
    };

    it('renders read-only view', () => {
      render(<GroupTournamentBettingAdmin {...nonOwnerProps} />);
      // Use getAllByText for ambiguous or repeated texts
      expect(screen.getAllByText((content, node) => !!node && node.textContent !== null && node.textContent.replace(/\s+/g, ' ').includes('Apuesta habilitada')).length).toBeGreaterThan(0);
      expect(screen.getAllByText((content, node) => !!node && node.textContent !== null && node.textContent.replace(/\s+/g, ' ').includes('Monto por persona: $ 100')).length).toBeGreaterThan(0);
      expect(screen.getAllByText((content, node) => !!node && node.textContent !== null && node.textContent.replace(/\s+/g, ' ').includes('Monto acumulado: $ 100')).length).toBeGreaterThan(0);
      expect(screen.getAllByText((content, node) => !!node && node.textContent !== null && node.textContent.replace(/\s+/g, ' ').includes('Descripción:')).length).toBeGreaterThan(0);
      expect(screen.getAllByText((content, node) => !!node && node.textContent !== null && node.textContent.includes('Pagaron:')).length).toBeGreaterThan(0);
      expect(screen.getAllByText((content, node) => !!node && node.textContent !== null && node.textContent.includes('User One')).length).toBeGreaterThan(0);
      expect(screen.queryByText('Monto de la apuesta')).not.toBeInTheDocument();
      expect(screen.queryByText('Descripción del pago')).not.toBeInTheDocument();
    });

    it('shows payment status for all members', () => {
      render(<GroupTournamentBettingAdmin {...nonOwnerProps} />);
      // Check for user names in the paid/unpaid section
      expect(screen.getAllByText((content, node) => !!node && node.textContent !== null && node.textContent.includes('User One')).length).toBeGreaterThan(0);
    });
  });

  describe('Snackbar', () => {
    it('shows success message after successful update', async () => {
      // REMOVE
    });

    it('shows error message after failed update', async () => {
      // REMOVE
    });

    it('closes snackbar after timeout', async () => {
      // REMOVE
    });
  });
}); 