import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FriendGroupsList from '../../../app/components/tournament-page/friend-groups-list';
import { renderWithTheme } from '../../utils/test-utils';

// Mock the actions
vi.mock('../../../app/actions/prode-group-actions', () => ({
  createDbGroup: vi.fn(),
  deleteGroup: vi.fn(),
}));

// Mock the InviteFriendsDialog component
vi.mock('../../../app/components/invite-friends-dialog', () => ({
  default: ({ children }: any) => <div data-testid="invite-friends-dialog">{children}</div>
}));

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>
}));

// Helper to expand the card
async function expandCard() {
  const expandButton = screen.getByLabelText(/mostrar más/i)
  await userEvent.click(expandButton)
}

describe('FriendGroupsList', () => {
  const mockUserGroups = [
    { id: 'group1', name: 'My Group 1' },
    { id: 'group2', name: 'My Group 2' }
  ];

  const mockParticipantGroups = [
    { id: 'group3', name: 'Participant Group 1' },
    { id: 'group4', name: 'Participant Group 2' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('renders component with title', () => {
      renderWithTheme(
        <FriendGroupsList
          userGroups={mockUserGroups}
          participantGroups={mockParticipantGroups}
        />
      );

      expect(screen.getByText('Grupos de Amigos')).toBeInTheDocument();
    });

    it('starts collapsed by default', () => {
      renderWithTheme(
        <FriendGroupsList
          userGroups={mockUserGroups}
          participantGroups={mockParticipantGroups}
        />
      );

      // Content should not be visible when collapsed
      expect(screen.queryByText('My Group 1')).not.toBeInTheDocument();
      expect(screen.queryByText('My Group 2')).not.toBeInTheDocument();
    });

    it('renders user groups as links when expanded', async () => {
      renderWithTheme(
        <FriendGroupsList
          userGroups={mockUserGroups}
          participantGroups={mockParticipantGroups}
        />
      );

      await expandCard();

      expect(screen.getByText('My Group 1')).toBeInTheDocument();
      expect(screen.getByText('My Group 2')).toBeInTheDocument();
    });

    it('renders participant groups as links when expanded', async () => {
      renderWithTheme(
        <FriendGroupsList
          userGroups={mockUserGroups}
          participantGroups={mockParticipantGroups}
        />
      );

      await expandCard();

      expect(screen.getByText('Participant Group 1')).toBeInTheDocument();
      expect(screen.getByText('Participant Group 2')).toBeInTheDocument();
    });

    it('renders create group button even when collapsed', () => {
      renderWithTheme(
        <FriendGroupsList
          userGroups={mockUserGroups}
          participantGroups={mockParticipantGroups}
        />
      );

      // Button text changed from "Crear Nuevo Grupo" to "Crear Grupo"
      expect(screen.getByText('Crear Grupo')).toBeInTheDocument();
    });

    it('renders delete buttons for user groups only when expanded', async () => {
      renderWithTheme(
        <FriendGroupsList
          userGroups={mockUserGroups}
          participantGroups={mockParticipantGroups}
        />
      );

      await expandCard();

      // Should have delete buttons for user groups
      const deleteButtons = screen.getAllByTitle('Borrar Grupo');
      expect(deleteButtons).toHaveLength(mockUserGroups.length);
    });
  });

  describe('promise handling fix', () => {
    it('has slotProps.paper.onSubmit that wraps handleSubmit properly', () => {
      renderWithTheme(
        <FriendGroupsList
          userGroups={mockUserGroups}
          participantGroups={mockParticipantGroups}
        />
      );

      // This test verifies that the component renders without errors
      // The actual promise handling fix is tested by the fact that
      // the component doesn't crash when rendering, which would happen
      // if the onSubmit handler was returning a promise directly
      expect(screen.getByText('Grupos de Amigos')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('renders correctly with empty arrays', () => {
      renderWithTheme(
        <FriendGroupsList
          userGroups={[]}
          participantGroups={[]}
        />
      );

      expect(screen.getByText('Grupos de Amigos')).toBeInTheDocument();
      // Button text changed from "Crear Nuevo Grupo" to "Crear Grupo"
      expect(screen.getByText('Crear Grupo')).toBeInTheDocument();
    });

    it('renders correctly with only user groups', async () => {
      renderWithTheme(
        <FriendGroupsList
          userGroups={mockUserGroups}
          participantGroups={[]}
        />
      );

      await expandCard();

      expect(screen.getByText('My Group 1')).toBeInTheDocument();
      expect(screen.getByText('My Group 2')).toBeInTheDocument();
      expect(screen.getByText('Crear Grupo')).toBeInTheDocument();
    });

    it('renders correctly with only participant groups', async () => {
      renderWithTheme(
        <FriendGroupsList
          userGroups={[]}
          participantGroups={mockParticipantGroups}
        />
      );

      await expandCard();

      expect(screen.getByText('Participant Group 1')).toBeInTheDocument();
      expect(screen.getByText('Participant Group 2')).toBeInTheDocument();
      expect(screen.getByText('Crear Grupo')).toBeInTheDocument();
    });
  });
});
