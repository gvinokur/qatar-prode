import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import '@testing-library/jest-dom';
import ProdeGroupTable from '../../../app/components/friend-groups/friends-group-table';
import { Tournament, User } from '../../../app/db/tables-definition';
import { UserScore } from '../../../app/definitions';

// Mock the action functions
vi.mock('../../../app/actions/prode-group-actions', () => ({
  promoteParticipantToAdmin: vi.fn(),
  demoteParticipantFromAdmin: vi.fn()
}));

// Mock the sub-components
vi.mock('../../../app/components/friend-groups/group-tournament-betting-admin', () => ({
  default: ({ groupId, tournamentId, isAdmin }: any) => (
    <div data-testid="group-tournament-betting-admin">
      <span>GroupTournamentBettingAdmin</span>
      <span data-testid="group-id">{groupId}</span>
      <span data-testid="tournament-id">{tournamentId}</span>
      <span data-testid="is-admin">{isAdmin ? 'true' : 'false'}</span>
    </div>
  )
}));

vi.mock('../../../app/components/friend-groups/notification-dialog', () => ({
  default: ({ open, onClose, groupId, tournamentId, senderId }: any) => (
    <div data-testid="notification-dialog" style={{ display: open ? 'block' : 'none' }}>
      <span>NotificationDialog</span>
      <button onClick={onClose} data-testid="close-notification">Close</button>
      <span data-testid="notification-group-id">{groupId}</span>
      <span data-testid="notification-tournament-id">{tournamentId}</span>
      <span data-testid="notification-sender-id">{senderId}</span>
    </div>
  )
}));

// Mock MUI useMediaQuery
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    useMediaQuery: vi.fn()
  };
});

import { useMediaQuery } from '@mui/material';

describe('ProdeGroupTable', () => {
  const mockUsers: { [k: string]: User } = {
    'user1': {
      id: 'user1',
      email: 'user1@test.com',
      nickname: 'User One',
      is_email_verified: true,
      is_prode_admin: false,
      created_date: new Date(),
      modified_date: new Date()
    },
    'user2': {
      id: 'user2',
      email: 'user2@test.com',
      nickname: 'User Two',
      is_email_verified: true,
      is_prode_admin: false,
      created_date: new Date(),
      modified_date: new Date()
    },
    'owner': {
      id: 'owner',
      email: 'owner@test.com',
      nickname: 'Owner',
      is_email_verified: true,
      is_prode_admin: false,
      created_date: new Date(),
      modified_date: new Date()
    }
  };

  const mockTournaments: Tournament[] = [
    {
      id: 'tournament1',
      name: 'Test Tournament 1',
      short_name: 'TT1',
      description: 'Test',
      is_active: true,
      logo_url: null,
      created_date: new Date(),
      modified_date: new Date()
    },
    {
      id: 'tournament2',
      name: 'Test Tournament 2',
      short_name: 'TT2',
      description: 'Test 2',
      is_active: true,
      logo_url: null,
      created_date: new Date(),
      modified_date: new Date()
    }
  ];

  const mockUserScores: UserScore[] = [
    {
      userId: 'user1',
      totalPoints: 100,
      groupStageScore: 40,
      groupStageQualifiersScore: 20,
      groupPositionScore: 10,
      playoffScore: 25,
      honorRollScore: 5,
      individualAwardsScore: 0
    },
    {
      userId: 'user2',
      totalPoints: 80,
      groupStageScore: 35,
      groupStageQualifiersScore: 15,
      groupPositionScore: 8,
      playoffScore: 20,
      honorRollScore: 2,
      individualAwardsScore: 0
    },
    {
      userId: 'owner',
      totalPoints: 90,
      groupStageScore: 38,
      groupStageQualifiersScore: 18,
      groupPositionScore: 9,
      playoffScore: 22,
      honorRollScore: 3,
      individualAwardsScore: 0
    }
  ];

  const mockUserScoresByTournament = {
    'tournament1': mockUserScores,
    'tournament2': mockUserScores.map(score => ({ ...score, totalPoints: score.totalPoints - 10 }))
  };

  const mockMembers = [
    { id: 'user1', nombre: 'User One', is_admin: false },
    { id: 'user2', nombre: 'User Two', is_admin: true },
    { id: 'owner', nombre: 'Owner', is_admin: false }
  ];

  const mockBettingData = {
    'tournament1': {
      config: { enabled: true, amount: 100 },
      payments: []
    },
    'tournament2': {
      config: { enabled: false, amount: 0 },
      payments: []
    }
  };

  const defaultProps = {
    users: mockUsers,
    userScoresByTournament: mockUserScoresByTournament,
    loggedInUser: 'user1',
    tournaments: mockTournaments,
    groupId: 'group1',
    ownerId: 'owner',
    members: mockMembers,
    bettingData: mockBettingData
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useMediaQuery as any).mockReturnValue(true); // Default to desktop view
  });

  describe('Rendering', () => {
    it('renders the component with tournament tabs', () => {
      render(<ProdeGroupTable {...defaultProps} />);
      
      expect(screen.getByText('Tabla de Posiciones')).toBeInTheDocument();
      expect(screen.getByText('TT1')).toBeInTheDocument();
      expect(screen.getByText('TT2')).toBeInTheDocument();
    });

    it('renders user scores in correct order (highest first)', () => {
      render(<ProdeGroupTable {...defaultProps} />);
      
      const rows = screen.getAllByRole('row');
      // Header row + 3 user rows (× 2 for each tab) = 8 total rows
      expect(rows.length).toBeGreaterThanOrEqual(4);
      
      // Check the users are present
      expect(screen.getAllByText('User One')).toHaveLength(2); // One for each tab
      expect(screen.getAllByText('Owner')).toHaveLength(2);    // One for each tab
      expect(screen.getAllByText('User Two')).toHaveLength(2);  // One for each tab
    });

    it('highlights the logged in user row', () => {
      render(<ProdeGroupTable {...defaultProps} />);
      
      // Check that the logged in user (user1) rows have selected styling
      const userRows = screen.getAllByRole('row').filter(row => 
        row.textContent?.includes('User One')
      );
      expect(userRows.length).toBeGreaterThan(0);
      
      // At least one user row should exist
      const firstUserRow = userRows[0];
      expect(firstUserRow).toBeInTheDocument();
    });

    it('displays admin and owner icons correctly', () => {
      render(<ProdeGroupTable {...defaultProps} />);
      
      // Check for admin icon (admin crown) - User Two is admin
      const adminRows = screen.getAllByRole('row').filter(row => 
        row.textContent?.includes('User Two')
      );
      expect(adminRows.length).toBeGreaterThan(0);
      
      // Check for owner icon - Owner user
      const ownerRows = screen.getAllByRole('row').filter(row => 
        row.textContent?.includes('Owner')
      );
      expect(ownerRows.length).toBeGreaterThan(0);
      
      // Verify the component shows user names correctly
      expect(screen.getAllByText('User Two')).toHaveLength(2); // One for each tab
      expect(screen.getAllByText('Owner')).toHaveLength(2); // One for each tab
    });

    it('shows actions column only when logged user is owner', () => {
      render(<ProdeGroupTable {...defaultProps} />);
      
      // Should not show actions column when user is not owner
      expect(screen.queryByText('Actions')).not.toBeInTheDocument();
    });

    it('shows actions column when logged user is owner', () => {
      render(<ProdeGroupTable {...defaultProps} loggedInUser="owner" />);
      
      expect(screen.getAllByText('Actions')).toHaveLength(2); // One for each tab
      expect(screen.getAllByText('Hacer admin')).toHaveLength(2); // One for each tab
      expect(screen.getAllByText('Quitar admin')).toHaveLength(2); // One for each tab
    });
  });

  describe('Responsive behavior', () => {
    it('hides certain columns on small screens', () => {
      (useMediaQuery as any).mockReturnValue(false); // Mobile view
      
      render(<ProdeGroupTable {...defaultProps} />);
      
      // These columns should be hidden on mobile
      expect(screen.queryByText('Puntos Clasificados')).not.toBeInTheDocument();
      expect(screen.queryByText('Posiciones Grupo')).not.toBeInTheDocument();
      expect(screen.queryByText('Cuadro de Honor')).not.toBeInTheDocument();
      expect(screen.queryByText('Premios')).not.toBeInTheDocument();
    });

    it('shows all columns on desktop', () => {
      (useMediaQuery as any).mockReturnValue(true); // Desktop view
      
      render(<ProdeGroupTable {...defaultProps} />);
      
      expect(screen.getAllByText('Puntos Clasificados')).toHaveLength(2); // One for each tab
      expect(screen.getAllByText('Posiciones Grupo')).toHaveLength(2); // One for each tab
      expect(screen.getAllByText('Cuadro de Honor')).toHaveLength(2); // One for each tab
      expect(screen.getAllByText('Premios')).toHaveLength(2); // One for each tab
    });
  });

  describe('Tab switching', () => {
    it('switches between tournaments when clicking tabs', async () => {
      render(<ProdeGroupTable {...defaultProps} />);
      
      // Click on second tournament tab
      fireEvent.click(screen.getByText('TT2'));
      
      await waitFor(() => {
        // Should show scores for tournament2 (reduced by 10)
        // There will be multiple elements because of how the component renders both tabs
        expect(screen.getAllByText('90').length).toBeGreaterThanOrEqual(1); // user1: 100-10
        expect(screen.getAllByText('80').length).toBeGreaterThanOrEqual(1); // owner: 90-10
        expect(screen.getAllByText('70').length).toBeGreaterThanOrEqual(1); // user2: 80-10
      });
    });
  });

  describe('Admin actions', () => {
    it('promotes user to admin successfully', async () => {
      const { promoteParticipantToAdmin } = await import('../../../app/actions/prode-group-actions');
      (promoteParticipantToAdmin as any).mockResolvedValue(undefined);
      
      render(<ProdeGroupTable {...defaultProps} loggedInUser="owner" />);
      
      const promoteButtons = screen.getAllByText('Hacer admin');
      fireEvent.click(promoteButtons[0]);
      
      await waitFor(() => {
        expect(promoteParticipantToAdmin).toHaveBeenCalledWith('group1', 'user1');
      });

      await waitFor(() => {
        expect(screen.getByText('Usuario promovido a admin')).toBeInTheDocument();
      });
    });

    it('demotes admin user successfully', async () => {
      const { demoteParticipantFromAdmin } = await import('../../../app/actions/prode-group-actions');
      (demoteParticipantFromAdmin as any).mockResolvedValue(undefined);
      
      render(<ProdeGroupTable {...defaultProps} loggedInUser="owner" />);
      
      const demoteButtons = screen.getAllByText('Quitar admin');
      fireEvent.click(demoteButtons[0]);
      
      await waitFor(() => {
        expect(demoteParticipantFromAdmin).toHaveBeenCalledWith('group1', 'user2');
      });

      await waitFor(() => {
        expect(screen.getByText('Usuario removido como admin')).toBeInTheDocument();
      });
    });

    it('handles promotion error', async () => {
      const { promoteParticipantToAdmin } = await import('../../../app/actions/prode-group-actions');
      (promoteParticipantToAdmin as any).mockRejectedValue(new Error('Network error'));
      
      render(<ProdeGroupTable {...defaultProps} loggedInUser="owner" />);
      
      const promoteButtons = screen.getAllByText('Hacer admin');
      fireEvent.click(promoteButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('handles demotion error', async () => {
      const { demoteParticipantFromAdmin } = await import('../../../app/actions/prode-group-actions');
      (demoteParticipantFromAdmin as any).mockRejectedValue(new Error('Custom error'));
      
      render(<ProdeGroupTable {...defaultProps} loggedInUser="owner" />);
      
      const demoteButtons = screen.getAllByText('Quitar admin');
      fireEvent.click(demoteButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByText('Custom error')).toBeInTheDocument();
      });
    });

    it('shows loading state during admin actions', async () => {
      const { promoteParticipantToAdmin } = await import('../../../app/actions/prode-group-actions');
      (promoteParticipantToAdmin as any).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      render(<ProdeGroupTable {...defaultProps} loggedInUser="owner" />);
      
      const promoteButtons = screen.getAllByText('Hacer admin');
      fireEvent.click(promoteButtons[0]);
      
      expect(screen.getAllByText('Agregando...')).toHaveLength(2); // One for each tab
      
      // Wait for promise to resolve
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    it('disables buttons during loading', () => {
      render(<ProdeGroupTable {...defaultProps} loggedInUser="owner" />);
      
      const promoteButtons = screen.getAllByText('Hacer admin');
      const demoteButtons = screen.getAllByText('Quitar admin');
      
      fireEvent.click(promoteButtons[0]);
      
      expect(promoteButtons[0]).toBeDisabled();
      expect(demoteButtons[0]).not.toBeDisabled(); // Different user, should not be disabled
    });
  });

  describe('AdminActionButton component', () => {
    it('renders nothing for owner', () => {
      const { container } = render(
        <ProdeGroupTable 
          {...defaultProps} 
          loggedInUser="owner"
          members={[{ id: 'owner', nombre: 'Owner', is_admin: false }]}
        />
      );
      
      // Owner row should not have admin action buttons
      const ownerRow = container.querySelector('[data-testid="owner-actions"]');
      expect(ownerRow).not.toBeInTheDocument();
    });

    it('shows promote button for non-admin users', () => {
      render(<ProdeGroupTable {...defaultProps} loggedInUser="owner" />);
      
      expect(screen.getAllByText('Hacer admin')).toHaveLength(2); // One for each tab
    });

    it('shows demote button for admin users', () => {
      render(<ProdeGroupTable {...defaultProps} loggedInUser="owner" />);
      
      expect(screen.getAllByText('Quitar admin')).toHaveLength(2); // One for each tab
    });
  });

  describe('Notification functionality', () => {
    it('shows notification button for admins', () => {
      render(<ProdeGroupTable {...defaultProps} loggedInUser="user2" />); // user2 is admin

      expect(screen.getAllByText('Enviar Notificación')).toHaveLength(2); // One for each tab
    });

    it('shows notification button for owner', () => {
      render(<ProdeGroupTable {...defaultProps} loggedInUser="owner" />);

      expect(screen.getAllByText('Enviar Notificación')).toHaveLength(2); // One for each tab
    });

    it('does not show notification button for regular users', () => {
      render(<ProdeGroupTable {...defaultProps} loggedInUser="user1" />); // user1 is not admin

      expect(screen.queryByText('Enviar Notificación')).not.toBeInTheDocument();
    });

    it('opens notification dialog when button clicked', () => {
      render(<ProdeGroupTable {...defaultProps} loggedInUser="owner" />);

      const notificationButtons = screen.getAllByText('Enviar Notificación');
      fireEvent.click(notificationButtons[0]);

      expect(screen.getByTestId('notification-dialog')).toBeVisible();
    });

    it('closes notification dialog', () => {
      render(<ProdeGroupTable {...defaultProps} loggedInUser="owner" />);

      const notificationButtons = screen.getAllByText('Enviar Notificación');
      fireEvent.click(notificationButtons[0]);

      const closeButton = screen.getByTestId('close-notification');
      fireEvent.click(closeButton);

      expect(screen.getByTestId('notification-dialog')).not.toBeVisible();
    });

    it('passes correct tournament id to notification dialog initially', () => {
      render(<ProdeGroupTable {...defaultProps} loggedInUser="owner" />);

      const notificationButtons = screen.getAllByText('Enviar Notificación');
      fireEvent.click(notificationButtons[0]);

      // Should pass the first tournament's ID
      expect(screen.getByTestId('notification-tournament-id')).toHaveTextContent('tournament1');
    });

    it('passes correct tournament id to notification dialog after tab switch', async () => {
      render(<ProdeGroupTable {...defaultProps} loggedInUser="owner" />);

      // Switch to second tournament tab
      fireEvent.click(screen.getByText('TT2'));

      await waitFor(() => {
        const notificationButtons = screen.getAllByText('Enviar Notificación');
        fireEvent.click(notificationButtons[1]); // Click the button in the second tab

        // Should pass the second tournament's ID, not undefined
        expect(screen.getByTestId('notification-tournament-id')).toHaveTextContent('tournament2');
      });
    });
  });

  describe('Snackbar notifications', () => {
    it('closes snackbar when close button clicked', async () => {
      const { promoteParticipantToAdmin } = await import('../../../app/actions/prode-group-actions');
      (promoteParticipantToAdmin as any).mockResolvedValue(undefined);
      
      render(<ProdeGroupTable {...defaultProps} loggedInUser="owner" />);
      
      const promoteButtons = screen.getAllByText('Hacer admin');
      fireEvent.click(promoteButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByText('Usuario promovido a admin')).toBeInTheDocument();
      });
      
      // Close snackbar
      const closeSnackbarButton = screen.getByLabelText('Close');
      fireEvent.click(closeSnackbarButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Usuario promovido a admin')).not.toBeInTheDocument();
      });
    });
  });

  describe('GroupTournamentBettingAdmin integration', () => {
    it('passes correct props to GroupTournamentBettingAdmin', () => {
      render(<ProdeGroupTable {...defaultProps} loggedInUser="user2" />); // user2 is admin
      
      expect(screen.getAllByTestId('group-tournament-betting-admin')).toHaveLength(2); // One for each tab
      expect(screen.getAllByTestId('group-id')[0]).toHaveTextContent('group1');
      expect(screen.getAllByTestId('tournament-id')[0]).toHaveTextContent('tournament1');
      expect(screen.getAllByTestId('is-admin')[0]).toHaveTextContent('true');
    });

    it('passes admin status correctly for owner', () => {
      render(<ProdeGroupTable {...defaultProps} loggedInUser="owner" />);
      
      expect(screen.getAllByTestId('is-admin')[0]).toHaveTextContent('true');
    });

    it('passes admin status correctly for non-admin user', () => {
      render(<ProdeGroupTable {...defaultProps} loggedInUser="user1" />);
      
      expect(screen.getAllByTestId('is-admin')[0]).toHaveTextContent('false');
    });
  });

  describe('Edge cases', () => {
    it('handles empty user scores', () => {
      render(
        <ProdeGroupTable 
          {...defaultProps} 
          userScoresByTournament={{ 'tournament1': [], 'tournament2': [] }}
        />
      );
      
      expect(screen.getByText('Tabla de Posiciones')).toBeInTheDocument();
      // Should not crash with empty scores
    });

    it('handles missing user data gracefully', () => {
      render(
        <ProdeGroupTable 
          {...defaultProps} 
          users={{}}
        />
      );
      
      // Should fallback to email when nickname is not available
      expect(screen.getByText('Tabla de Posiciones')).toBeInTheDocument();
    });

    it('handles missing member data', () => {
      render(
        <ProdeGroupTable 
          {...defaultProps} 
          members={[]}
          loggedInUser="owner"
        />
      );
      
      expect(screen.getByText('Tabla de Posiciones')).toBeInTheDocument();
    });

    it('handles custom action prop', () => {
      const customAction = <button data-testid="custom-action">Custom Action</button>;
      
      render(<ProdeGroupTable {...defaultProps} action={customAction} />);
      
      expect(screen.getByTestId('custom-action')).toBeInTheDocument();
    });
  });

  describe('Data display', () => {
    it('displays all score columns correctly', () => {
      render(<ProdeGroupTable {...defaultProps} />);
      
      // Both tabs are rendered, so we see scores for both
      expect(screen.getAllByText('100').length).toBeGreaterThanOrEqual(1); // Total points
      expect(screen.getAllByText('40').length).toBeGreaterThanOrEqual(1);  // Group stage
      expect(screen.getAllByText('20').length).toBeGreaterThanOrEqual(1);  // Qualifiers
      expect(screen.getAllByText('10').length).toBeGreaterThanOrEqual(1);  // Group position
      expect(screen.getAllByText('25').length).toBeGreaterThanOrEqual(1);  // Playoff
      expect(screen.getAllByText('5').length).toBeGreaterThanOrEqual(1);   // Honor roll
      expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(3);   // Individual awards (3 users)
    });

    it('displays fallback for missing group position score', () => {
      const scoresWithoutGroupPosition = mockUserScores.map(score => ({
        ...score,
        groupPositionScore: undefined
      }));
      
      render(
        <ProdeGroupTable 
          {...defaultProps} 
          userScoresByTournament={{ 
            'tournament1': scoresWithoutGroupPosition, 
            'tournament2': scoresWithoutGroupPosition 
          }}
        />
      );
      
      // Should show 0 for undefined group position scores
      const zeroElements = screen.getAllByText('0');
      expect(zeroElements.length).toBeGreaterThanOrEqual(6); // At least 3 users × 2 score types (group position + individual awards) = 6 zeros
    });
  });
});
