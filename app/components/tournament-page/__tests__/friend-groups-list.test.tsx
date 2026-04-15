import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import FriendGroupsList from '../friend-groups-list';
import { renderWithTheme } from '@/__tests__/utils/test-utils';

// Mock server actions used by FriendGroupsList
vi.mock('@/app/actions/prode-group-actions', () => ({
  createDbGroup: vi.fn(),
  deleteGroup: vi.fn(),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const userGroups = [
  { id: 'group-1', name: 'My World Cup Group' },
  { id: 'group-2', name: 'Work Friends' },
];

const participantGroups = [
  { id: 'group-3', name: 'Casual League' },
];

/** Expand the FriendGroupsList card by clicking the expand button */
function expandList() {
  // Default locale is 'es' in test-utils so aria-label is 'mostrar más'
  const expandButton = screen.getByLabelText('mostrar más');
  fireEvent.click(expandButton);
}

describe('FriendGroupsList — rank badges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('no groupRanks (backward compat)', () => {
    it('renders without rank chips when groupRanks is undefined', () => {
      renderWithTheme(
        <FriendGroupsList
          userGroups={userGroups}
          participantGroups={[]}
          tournamentId="t-1"
        />
      );
      expandList();

      // No rank chips rendered
      expect(screen.queryByText('#1')).not.toBeInTheDocument();
      expect(screen.queryByText('#2')).not.toBeInTheDocument();
    });

    it('renders without rank chips when groupRanks is empty {}', () => {
      renderWithTheme(
        <FriendGroupsList
          userGroups={userGroups}
          participantGroups={[]}
          tournamentId="t-1"
          groupRanks={{}}
        />
      );
      expandList();

      expect(screen.queryByText('#1')).not.toBeInTheDocument();
    });
  });

  describe('with groupRanks', () => {
    const groupRanks = {
      'group-1': 4,
      'group-2': 2,
    };

    it('renders per-row rank chips for groups with an entry', () => {
      renderWithTheme(
        <FriendGroupsList
          userGroups={userGroups}
          participantGroups={[]}
          tournamentId="t-1"
          groupRanks={groupRanks}
        />
      );
      expandList();

      // Both groups have entries — chips should appear
      expect(screen.getByText('#2')).toBeInTheDocument();
    });

    it('does not render chip for groups with no entry in groupRanks', () => {
      renderWithTheme(
        <FriendGroupsList
          userGroups={userGroups}
          participantGroups={participantGroups}
          tournamentId="t-1"
          groupRanks={groupRanks} // group-3 has no entry
        />
      );
      expandList();

      // group-3 (Casual League) has no entry — text "#7" should not appear
      expect(screen.queryByText('#7')).not.toBeInTheDocument();
    });

    it('renders subtitle with rank for primary group when groupRanks has entry', () => {
      renderWithTheme(
        <FriendGroupsList
          userGroups={userGroups}
          participantGroups={[]}
          tournamentId="t-1"
          groupRanks={groupRanks}
        />
      );

      // Subtitle includes primary group rank and group name
      // "2 groups - #4 in My World Cup Group"
      expect(screen.getByText(/My World Cup Group/)).toBeInTheDocument();
    });

    it('does not render rank in subtitle when groupRanks is undefined', () => {
      renderWithTheme(
        <FriendGroupsList
          userGroups={userGroups}
          participantGroups={[]}
          tournamentId="t-1"
        />
      );

      // Subtitle shows only group count, no rank text
      expect(screen.queryByText(/My World Cup Group/)).not.toBeInTheDocument();
    });
  });

  describe('participant group rank badges', () => {
    it('renders per-row chip for participant groups with a rank entry', () => {
      renderWithTheme(
        <FriendGroupsList
          userGroups={[]}
          participantGroups={participantGroups}
          tournamentId="t-1"
          groupRanks={{ 'group-3': 7 }}
        />
      );
      expandList();

      // Per-row chip shows #7 for the participant group
      const rankElements = screen.getAllByText('#7');
      expect(rankElements.length).toBeGreaterThanOrEqual(1);
    });
  });
});
