import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import GroupsTab from '../../../app/components/backoffice/groups-backoffice-tab';

// Mock next/navigation
const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: mockReplace,
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  usePathname: vi.fn(() => '/backoffice'),
}));

// Mock MUI components
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    useMediaQuery: vi.fn(() => true),
  };
});

// Mock child components
vi.mock('../../../app/components/backoffice/group-backoffice-tab', () => ({
  default: vi.fn(() => <div>Group Backoffice Component</div>),
}));

vi.mock('../../../app/components/backoffice/playoff-tab', () => ({
  default: vi.fn(() => <div>Playoff Tab Component</div>),
}));

vi.mock('../../../app/components/backoffice/backoffice-tab-utils', () => ({
  createTab: vi.fn((label: string, component: React.ReactNode) => ({
    type: 'labelledTab',
    label,
    component,
  })),
}));

// Mock the BackofficeTabs component to verify props
vi.mock('../../../app/components/backoffice/backoffice-tabs', () => ({
  BackofficeTabs: vi.fn(({ tabs, tabIdParam }) => (
    React.createElement('div', { 'data-testid': 'backoffice-tabs', 'data-tab-id-param': tabIdParam },
      tabs.map((tab: any, index: number) => (
        React.createElement('div', { key: index }, tab.label)
      ))
    )
  )),
}));

// Mock server actions
const mockGroupData = [
  {
    id: '1',
    group_letter: 'A',
    tournament_id: 'tournament-1',
    teams: [],
    games: [],
  },
  {
    id: '2',
    group_letter: 'B',
    tournament_id: 'tournament-1',
    teams: [],
    games: [],
  },
  {
    id: '3',
    group_letter: 'C',
    tournament_id: 'tournament-1',
    teams: [],
    games: [],
  },
];

vi.mock('../../../app/actions/backoffice-actions', () => ({
  deleteDBTournamentTree: vi.fn(),
  generateDbTournamentTeamPlayers: vi.fn(),
  generateDbTournament: vi.fn(),
  saveGameResults: vi.fn(),
  saveGamesData: vi.fn(),
  calculateAndSavePlayoffGamesForTournament: vi.fn(),
  getGroupDataWithGamesAndTeams: vi.fn(() => Promise.resolve(mockGroupData)),
  calculateAllUsersGroupPositions: vi.fn(),
  recalculateAllPlayoffFirstRoundGameGuesses: vi.fn(),
  calculateGameScores: vi.fn(),
  calculateAndStoreGroupPosition: vi.fn(),
  calculateAndStoreQualifiedTeamsPoints: vi.fn(),
  findDataForAwards: vi.fn(),
  updateTournamentAwards: vi.fn(),
  updateTournamentHonorRoll: vi.fn(),
  copyTournament: vi.fn(),
  calculateAndStoreGroupPositionScores: vi.fn(),
  updateGroupTeamConductScores: vi.fn(),
  getTournamentPermissionData: vi.fn(),
  updateTournamentPermissions: vi.fn(),
}));

describe('GroupsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    render(<GroupsTab tournamentId="tournament-1" />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should render groups tabs after loading', async () => {
    render(<GroupsTab tournamentId="tournament-1" />);

    await waitFor(() => {
      expect(screen.getByText('Grupo A')).toBeInTheDocument();
      expect(screen.getByText('Grupo B')).toBeInTheDocument();
      expect(screen.getByText('Grupo C')).toBeInTheDocument();
      expect(screen.getByText('Playoffs')).toBeInTheDocument();
    });
  });

  it('should pass tabIdParam="group" to BackofficeTabs', async () => {
    const { BackofficeTabs } = await import('../../../app/components/backoffice/backoffice-tabs');

    render(<GroupsTab tournamentId="tournament-1" />);

    await waitFor(() => {
      expect(BackofficeTabs).toHaveBeenCalledWith(
        expect.objectContaining({
          tabIdParam: 'group',
        }),
        expect.anything()
      );
    });

    await waitFor(() => {
      const backofficeTabs = screen.getByTestId('backoffice-tabs');
      expect(backofficeTabs.dataset.tabIdParam).toBe('group');
    });
  });

  it('should sort groups alphabetically by letter', async () => {
    const unsortedGroups = [
      { id: '1', group_letter: 'C', tournament_id: 'tournament-1', teams: [], games: [] },
      { id: '2', group_letter: 'A', tournament_id: 'tournament-1', teams: [], games: [] },
      { id: '3', group_letter: 'B', tournament_id: 'tournament-1', teams: [], games: [] },
    ];

    const { getGroupDataWithGamesAndTeams } = await import(
      '../../../app/actions/backoffice-actions'
    );
    (getGroupDataWithGamesAndTeams as any).mockResolvedValue(unsortedGroups);

    render(<GroupsTab tournamentId="tournament-1" />);

    await waitFor(() => {
      const tabs = screen.getAllByText(/Grupo [ABC]/);
      expect(tabs[0]).toHaveTextContent('Grupo A');
      expect(tabs[1]).toHaveTextContent('Grupo B');
      expect(tabs[2]).toHaveTextContent('Grupo C');
    });
  });

  it('should pass correct tabs array to BackofficeTabs', async () => {
    const { BackofficeTabs } = await import('../../../app/components/backoffice/backoffice-tabs');

    render(<GroupsTab tournamentId="tournament-1" />);

    await waitFor(() => {
      expect(BackofficeTabs).toHaveBeenCalledWith(
        expect.objectContaining({
          tabs: expect.arrayContaining([
            expect.objectContaining({ label: 'Grupo A' }),
            expect.objectContaining({ label: 'Grupo B' }),
            expect.objectContaining({ label: 'Grupo C' }),
            expect.objectContaining({ label: 'Playoffs' }),
          ]),
        }),
        expect.anything()
      );
    });
  });

  it('should handle empty groups array', async () => {
    const { getGroupDataWithGamesAndTeams } = await import(
      '../../../app/actions/backoffice-actions'
    );
    (getGroupDataWithGamesAndTeams as any).mockResolvedValue([]);

    render(<GroupsTab tournamentId="tournament-1" />);

    await waitFor(() => {
      expect(screen.getByText('Playoffs')).toBeInTheDocument();
      expect(screen.queryByText(/Grupo/)).not.toBeInTheDocument();
    });
  });

  it('should load groups for specific tournament', async () => {
    const { getGroupDataWithGamesAndTeams } = await import(
      '../../../app/actions/backoffice-actions'
    );

    render(<GroupsTab tournamentId="tournament-123" />);

    await waitFor(() => {
      expect(getGroupDataWithGamesAndTeams).toHaveBeenCalledWith('tournament-123');
    });
  });
});
