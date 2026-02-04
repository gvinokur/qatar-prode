import { vi, describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { usePathname, useRouter } from 'next/navigation';
import { useMediaQuery } from '@mui/material';
import TournamentBottomNavWrapper from '../../../app/components/tournament-bottom-nav/tournament-bottom-nav-wrapper';
import { renderWithTheme } from '../../utils/test-utils';
import { setupTestMocks } from '../../mocks/setup-helpers';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

// Mock @mui/material hooks
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    useMediaQuery: vi.fn(),
  };
});

describe('TournamentBottomNavWrapper', () => {
  const mockTournamentId = '123';
  let mockRouter: ReturnType<typeof setupTestMocks>['router'];

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup router mock
    const mocks = setupTestMocks({
      navigation: true,
    });
    mockRouter = mocks.router!;
  });

  describe('mobile detection', () => {
    it('renders TournamentBottomNav when on mobile', () => {
      vi.mocked(useMediaQuery).mockReturnValue(true);
      vi.mocked(usePathname).mockReturnValue('/tournaments/123');

      renderWithTheme(<TournamentBottomNavWrapper tournamentId={mockTournamentId} />);

      expect(screen.getByRole('button', { name: /home/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /tournament/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /friend groups/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /stats/i })).toBeInTheDocument();
    });

    it('returns null when not on mobile', () => {
      vi.mocked(useMediaQuery).mockReturnValue(false);
      vi.mocked(usePathname).mockReturnValue('/tournaments/123');

      const { container } = renderWithTheme(
        <TournamentBottomNavWrapper tournamentId={mockTournamentId} />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('pathname handling', () => {
    it('passes correct currentPath to TournamentBottomNav', () => {
      const testPath = '/tournaments/123/stats';
      vi.mocked(useMediaQuery).mockReturnValue(true);
      vi.mocked(usePathname).mockReturnValue(testPath);

      renderWithTheme(<TournamentBottomNavWrapper tournamentId={mockTournamentId} />);

      // Stats button should be selected since currentPath is /tournaments/123/stats
      const statsButton = screen.getByRole('button', { name: /stats/i });
      expect(statsButton).toHaveClass('Mui-selected');
    });

    it('handles main home path correctly', () => {
      vi.mocked(useMediaQuery).mockReturnValue(true);
      vi.mocked(usePathname).mockReturnValue('/');

      renderWithTheme(<TournamentBottomNavWrapper tournamentId={mockTournamentId} />);

      // Home button should be selected since currentPath is /
      const homeButton = screen.getByRole('button', { name: /home/i });
      expect(homeButton).toHaveClass('Mui-selected');
    });

    it('handles tournament home path correctly', () => {
      const testPath = `/tournaments/${mockTournamentId}`;
      vi.mocked(useMediaQuery).mockReturnValue(true);
      vi.mocked(usePathname).mockReturnValue(testPath);

      renderWithTheme(<TournamentBottomNavWrapper tournamentId={mockTournamentId} />);

      // Tournament button should be selected
      const tournamentButton = screen.getByRole('button', { name: /tournament/i });
      expect(tournamentButton).toHaveClass('Mui-selected');
    });

    it('handles friend groups path correctly', () => {
      const testPath = `/tournaments/${mockTournamentId}/friend-groups`;
      vi.mocked(useMediaQuery).mockReturnValue(true);
      vi.mocked(usePathname).mockReturnValue(testPath);

      renderWithTheme(<TournamentBottomNavWrapper tournamentId={mockTournamentId} />);

      // Friend Groups button should be selected
      const friendGroupsButton = screen.getByRole('button', { name: /friend groups/i });
      expect(friendGroupsButton).toHaveClass('Mui-selected');
    });
  });

  describe('responsive behavior', () => {
    it('respects media query breakpoint (md)', () => {
      // Simulate desktop (md and up)
      vi.mocked(useMediaQuery).mockReturnValue(false);
      vi.mocked(usePathname).mockReturnValue('/tournaments/123');

      const { container } = renderWithTheme(
        <TournamentBottomNavWrapper tournamentId={mockTournamentId} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('shows navigation when breakpoint changes to mobile', () => {
      vi.mocked(usePathname).mockReturnValue('/tournaments/123');

      // Start as desktop
      vi.mocked(useMediaQuery).mockReturnValue(false);
      const { container, rerenderWithTheme } = renderWithTheme(
        <TournamentBottomNavWrapper tournamentId={mockTournamentId} />
      );
      expect(container.firstChild).toBeNull();

      // Change to mobile
      vi.mocked(useMediaQuery).mockReturnValue(true);
      rerenderWithTheme(<TournamentBottomNavWrapper tournamentId={mockTournamentId} />);

      expect(screen.getByRole('button', { name: /home/i })).toBeInTheDocument();
    });
  });

  describe('tournament ID handling', () => {
    it('passes tournamentId prop correctly to TournamentBottomNav', () => {
      const differentTournamentId = '456';
      vi.mocked(useMediaQuery).mockReturnValue(true);
      vi.mocked(usePathname).mockReturnValue(`/tournaments/${differentTournamentId}`);

      renderWithTheme(<TournamentBottomNavWrapper tournamentId={differentTournamentId} />);

      // Verify bottom nav is rendered (indirectly confirms tournamentId was passed)
      expect(screen.getByRole('button', { name: /tournament/i })).toBeInTheDocument();
    });
  });
});
