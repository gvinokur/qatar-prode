import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TournamentGroupsList from '@/app/components/tournament-page/tournament-groups-list';
import { renderWithTheme } from '@/__tests__/utils/test-utils';
import type { TournamentGroupStats } from '@/app/definitions';
import { createDbGroup } from '@/app/actions/prode-group-actions';

vi.mock('@/app/actions/prode-group-actions', () => ({
  createDbGroup: vi.fn()
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn()
  }))
}));

describe('TournamentGroupsList', () => {
  const mockGroups: TournamentGroupStats[] = [
    {
      groupId: 'group-1',
      groupName: 'Test Group 1',
      isOwner: true,
      totalParticipants: 10,
      userPosition: 1,
      userPoints: 50,
      leaderName: 'You',
      leaderPoints: 50,
      themeColor: null
    },
    {
      groupId: 'group-2',
      groupName: 'Test Group 2',
      isOwner: false,
      totalParticipants: 8,
      userPosition: 3,
      userPoints: 45,
      leaderName: 'John Doe',
      leaderPoints: 52,
      themeColor: '#FF5733'
    }
  ];

  const tournamentId = 'tournament-1';

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock globalThis.location.reload
    Object.defineProperty(globalThis, 'location', {
      value: { reload: vi.fn() },
      writable: true
    });
  });

  it('renders page title', () => {
    renderWithTheme(<TournamentGroupsList groups={mockGroups} tournamentId={tournamentId} />);
    expect(screen.getByText('Grupos de Amigos')).toBeInTheDocument();
  });

  it('renders Create button', () => {
    renderWithTheme(<TournamentGroupsList groups={mockGroups} tournamentId={tournamentId} />);
    expect(screen.getByRole('button', { name: /Crear/i })).toBeInTheDocument();
  });

  it('renders Join button', () => {
    renderWithTheme(<TournamentGroupsList groups={mockGroups} tournamentId={tournamentId} />);
    expect(screen.getByRole('button', { name: /Unirse/i })).toBeInTheDocument();
  });

  it('renders all group cards', () => {
    renderWithTheme(<TournamentGroupsList groups={mockGroups} tournamentId={tournamentId} />);
    expect(screen.getByText(/Test Group 1/)).toBeInTheDocument();
    expect(screen.getByText(/Test Group 2/)).toBeInTheDocument();
  });

  it('shows empty state when no groups provided', () => {
    renderWithTheme(<TournamentGroupsList groups={[]} tournamentId={tournamentId} />);
    expect(screen.getByText('No Groups Yet!')).toBeInTheDocument();
  });

  it('opens create dialog when Create button is clicked', async () => {
    const user = userEvent.setup();
    renderWithTheme(<TournamentGroupsList groups={mockGroups} tournamentId={tournamentId} />);

    const createButton = screen.getByRole('button', { name: /Crear/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Crear Grupo de Amigos')).toBeInTheDocument();
    });
  });

  it('opens join dialog when Join button is clicked', async () => {
    const user = userEvent.setup();
    renderWithTheme(<TournamentGroupsList groups={mockGroups} tournamentId={tournamentId} />);

    const joinButton = screen.getByRole('button', { name: /Unirse/i });
    await user.click(joinButton);

    await waitFor(() => {
      expect(screen.getByText('Unirse a un Grupo')).toBeInTheDocument();
    });
  });

  it('creates group with provided name', async () => {
    const user = userEvent.setup();
    (createDbGroup as any).mockResolvedValue({ id: 'new-group', name: 'New Group' });

    renderWithTheme(<TournamentGroupsList groups={mockGroups} tournamentId={tournamentId} />);

    // Open create dialog
    const createButton = screen.getByRole('button', { name: /Crear/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Crear Grupo de Amigos')).toBeInTheDocument();
    });

    // Fill in name
    const nameInput = screen.getByLabelText('Nombre');
    await user.type(nameInput, 'My New Group');

    // Submit
    const submitButton = screen.getByRole('button', { name: /Crear$/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(createDbGroup).toHaveBeenCalledWith('My New Group');
    });
  });

  it('closes create dialog when Cancel is clicked', async () => {
    const user = userEvent.setup();
    renderWithTheme(<TournamentGroupsList groups={mockGroups} tournamentId={tournamentId} />);

    // Open dialog
    const createButton = screen.getByRole('button', { name: /Crear/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Crear Grupo de Amigos')).toBeInTheDocument();
    });

    // Click cancel
    const cancelButton = screen.getByRole('button', { name: /Cancelar/i });
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('Crear Grupo de Amigos')).not.toBeInTheDocument();
    });
  });

  it('renders groups in grid layout', () => {
    const { container } = renderWithTheme(<TournamentGroupsList groups={mockGroups} tournamentId={tournamentId} />);
    const grids = container.querySelectorAll('.MuiGrid-root');
    expect(grids.length).toBeGreaterThan(0);
  });
});
