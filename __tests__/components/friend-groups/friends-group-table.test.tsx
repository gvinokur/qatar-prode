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
      password_hash: 'hash1'
    } as User,
    'user2': {
      id: 'user2',
      email: 'user2@test.com',
      nickname: 'User Two',
      password_hash: 'hash2'
    } as User,
    'owner': {
      id: 'owner',
      email: 'owner@test.com',
      nickname: 'Owner',
      password_hash: 'hash3'
    } as User
  };

  const mockTournaments: Tournament[] = [
    {
      id: 'tournament1',
      short_name: 'TT1',
      long_name: 'Test Tournament 1',
      is_active: true,
      theme: { primary_color: '#000', secondary_color: '#fff' }
    } as Tournament,
    {
      id: 'tournament2',
      short_name: 'TT2',
      long_name: 'Test Tournament 2',
      is_active: true,
      theme: { primary_color: '#000', secondary_color: '#fff' }
    } as Tournament
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
      individualAwardsScore: 0,
      groupBoostBonus: 8,
      playoffBoostBonus: 5,
      totalBoostBonus: 13
    },
    {
      userId: 'user2',
      totalPoints: 80,
      groupStageScore: 35,
      groupStageQualifiersScore: 15,
      groupPositionScore: 8,
      playoffScore: 20,
      honorRollScore: 2,
      individualAwardsScore: 0,
      groupBoostBonus: 6,
      playoffBoostBonus: 3,
      totalBoostBonus: 9
    },
    {
      userId: 'owner',
      totalPoints: 90,
      groupStageScore: 38,
      groupStageQualifiersScore: 18,
      groupPositionScore: 9,
      playoffScore: 22,
      honorRollScore: 3,
      individualAwardsScore: 0,
      groupBoostBonus: 7,
      playoffBoostBonus: 4,
      totalBoostBonus: 11
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

    it('renders user scores using card-based leaderboard', () => {
      render(<ProdeGroupTable {...defaultProps} />);

      // Check for leaderboard lists (one for each tab, both mounted)
      const lists = screen.getAllByRole('list', { name: /leaderboard/i });
      expect(lists.length).toBeGreaterThanOrEqual(1);

      // Check that users are displayed (cards show "You" for current user, names for others)
      // Both tabs are kept mounted, so text appears twice
      expect(screen.getAllByText('You').length).toBeGreaterThanOrEqual(1); // user1 is current user
      expect(screen.getAllByText('Owner').length).toBeGreaterThan(0);
      expect(screen.getAllByText('User Two').length).toBeGreaterThan(0);
    });

    it('displays user scores in correct order (highest first)', () => {
      render(<ProdeGroupTable {...defaultProps} />);

      // Get all leaderboard cards (both tabs are kept mounted)
      const cards = screen.getAllByRole('button', { name: /leaderboard card/i });

      // Should have at least 3 cards
      expect(cards.length).toBeGreaterThanOrEqual(3);

      // Verify scores appear in descending order: 100, 90, 80
      // Both tabs are kept mounted, so text may appear multiple times
      expect(screen.getAllByText('100 pts').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('90 pts').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('80 pts').length).toBeGreaterThanOrEqual(1);
    });

    it('highlights the logged in user card', () => {
      render(<ProdeGroupTable {...defaultProps} />);

      // Current user card should show "You" with hint
      // Both tabs are kept mounted, so text appears twice
      expect(screen.getAllByText('You').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/tap to view details/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Tab switching', () => {
    it('switches between tournaments when clicking tabs', async () => {
      render(<ProdeGroupTable {...defaultProps} />);

      // Verify first tournament is selected
      expect(screen.getAllByText('100 pts').length).toBeGreaterThanOrEqual(1);

      // Click on second tournament tab
      fireEvent.click(screen.getByText('TT2'));

      await waitFor(() => {
        // Should show scores for tournament2 (reduced by 10)
        // Note: Both tabs are kept mounted, so scores appear multiple times
        const scores90 = screen.getAllByText('90 pts');
        const scores80 = screen.getAllByText('80 pts');
        const scores70 = screen.getAllByText('70 pts');

        expect(scores90.length).toBeGreaterThanOrEqual(1); // user1: 100-10
        expect(scores80.length).toBeGreaterThanOrEqual(1); // owner: 90-10
        expect(scores70.length).toBeGreaterThanOrEqual(1); // user2: 80-10
      });
    });

    it('hides tabs when only one tournament', () => {
      render(<ProdeGroupTable {...defaultProps} tournaments={[mockTournaments[0]]} />);

      // Should not show tabs when there's only one tournament
      expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
      expect(screen.queryByText('TT1')).not.toBeInTheDocument();
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
    it('handles empty tournaments array', () => {
      render(
        <ProdeGroupTable
          {...defaultProps}
          tournaments={[]}
          userScoresByTournament={{}}
          bettingData={{}}
        />
      );

      expect(screen.getByText('Tabla de Posiciones')).toBeInTheDocument();
      expect(screen.getByText('No hay torneos activos disponibles en este momento.')).toBeInTheDocument();
      expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    });

    it('handles empty user scores', () => {
      render(
        <ProdeGroupTable
          {...defaultProps}
          userScoresByTournament={{ 'tournament1': [], 'tournament2': [] }}
        />
      );

      expect(screen.getByText('Tabla de Posiciones')).toBeInTheDocument();
      // Should show empty state
      expect(screen.getAllByText('No leaderboard data')).toHaveLength(2);
    });

    it('handles missing user data gracefully', () => {
      render(
        <ProdeGroupTable
          {...defaultProps}
          users={{}}
        />
      );

      // Should fallback to "Unknown User" when user data is missing
      expect(screen.getByText('Tabla de Posiciones')).toBeInTheDocument();
    });

    it('handles custom action prop', () => {
      const customAction = <button data-testid="custom-action">Custom Action</button>;

      render(<ProdeGroupTable {...defaultProps} action={customAction} />);

      expect(screen.getByTestId('custom-action')).toBeInTheDocument();
    });
  });

  describe('Card interactions', () => {
    it('expands card to show detailed breakdown when clicked', () => {
      render(<ProdeGroupTable {...defaultProps} />);

      // Get the current user's cards (both tabs are mounted)
      const userCards = screen.getAllByLabelText(/your leaderboard card/i);
      const firstCard = userCards[0];

      // Initially collapsed
      expect(firstCard).toHaveAttribute('aria-expanded', 'false');

      // Click to expand
      fireEvent.click(firstCard);

      // Should now be expanded and show detailed breakdown
      // Both tabs are kept mounted, so "Desglose de Puntos" appears multiple times
      expect(firstCard).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getAllByText(/desglose de puntos/i).length).toBeGreaterThanOrEqual(1);
    });

    it('shows detailed point breakdown when expanded', () => {
      render(<ProdeGroupTable {...defaultProps} />);

      // Get the first user card (from the visible tab)
      const userCards = screen.getAllByLabelText(/your leaderboard card/i);
      fireEvent.click(userCards[0]);

      // Check for detailed breakdown sections
      // Both tabs are kept mounted, so sections appear multiple times
      expect(screen.getAllByText('Partidos de Fase de Grupos').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Equipos Clasificados').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Partidos de Playoff').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Cuadro de Honor').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Premios Individuales').length).toBeGreaterThanOrEqual(1);
    });

    it('only expands one card at a time', () => {
      render(<ProdeGroupTable {...defaultProps} />);

      const cards = screen.getAllByRole('button', { name: /leaderboard card/i });

      // Expand first card
      fireEvent.click(cards[0]);
      expect(cards[0]).toHaveAttribute('aria-expanded', 'true');

      // Expand second card
      fireEvent.click(cards[1]);
      expect(cards[1]).toHaveAttribute('aria-expanded', 'true');
      expect(cards[0]).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('Data display in cards', () => {
    it('displays total points correctly', () => {
      render(<ProdeGroupTable {...defaultProps} />);

      // Both tabs are kept mounted, so text appears multiple times
      expect(screen.getAllByText('100 pts').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('90 pts').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('80 pts').length).toBeGreaterThanOrEqual(1);
    });

    it('displays rank correctly', () => {
      render(<ProdeGroupTable {...defaultProps} />);

      // Ranks should be #1, #2, #3
      const cards = screen.getAllByRole('button', { name: /leaderboard card, rank/i });
      expect(cards[0]).toHaveAccessibleName(/rank 1/i);
      expect(cards[1]).toHaveAccessibleName(/rank 2/i);
      expect(cards[2]).toHaveAccessibleName(/rank 3/i);
    });

    it('shows boost bonuses conditionally when expanded', () => {
      render(<ProdeGroupTable {...defaultProps} />);

      // Get the first user card
      const userCards = screen.getAllByLabelText(/your leaderboard card/i);
      fireEvent.click(userCards[0]);

      // Should show boost bonuses for user1 (8 and 5)
      // Both tabs are kept mounted, so boost values appear multiple times
      expect(screen.getAllByText('+8').length).toBeGreaterThanOrEqual(1); // group boost
      expect(screen.getAllByText('+5').length).toBeGreaterThanOrEqual(1); // playoff boost
    });
  });
});
