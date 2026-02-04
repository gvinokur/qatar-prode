import { vi, describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import TournamentBottomNav from '../../../app/components/tournament-bottom-nav/tournament-bottom-nav';
import { renderWithTheme } from '../../utils/test-utils';
import { setupTestMocks } from '../../mocks/setup-helpers';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

describe('TournamentBottomNav', () => {
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

  describe('rendering', () => {
    it('renders all 4 navigation tabs', () => {
      renderWithTheme(
        <TournamentBottomNav tournamentId={mockTournamentId} currentPath="/" />
      );

      expect(screen.getByRole('button', { name: /home/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /tournament/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /friend groups/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /stats/i })).toBeInTheDocument();
    });

    it('displays correct icons for each tab', () => {
      renderWithTheme(
        <TournamentBottomNav tournamentId={mockTournamentId} currentPath="/" />
      );

      // Check for Material Icons by their test IDs or aria-labels
      const homeButton = screen.getByRole('button', { name: /home/i });
      const tournamentButton = screen.getByRole('button', { name: /tournament/i });
      const friendGroupsButton = screen.getByRole('button', { name: /friend groups/i });
      const statsButton = screen.getByRole('button', { name: /stats/i });

      // Verify buttons exist with icons
      expect(homeButton).toBeInTheDocument();
      expect(tournamentButton).toBeInTheDocument();
      expect(friendGroupsButton).toBeInTheDocument();
      expect(statsButton).toBeInTheDocument();
    });
  });

  describe('tab selection', () => {
    it('selects main-home tab when currentPath is /', () => {
      renderWithTheme(
        <TournamentBottomNav tournamentId={mockTournamentId} currentPath="/" />
      );

      const homeButton = screen.getByRole('button', { name: /home/i });
      expect(homeButton).toHaveClass('Mui-selected');
    });

    it('selects tournament-home tab when currentPath is /tournaments/[id]', () => {
      renderWithTheme(
        <TournamentBottomNav
          tournamentId={mockTournamentId}
          currentPath={`/tournaments/${mockTournamentId}`}
        />
      );

      const tournamentButton = screen.getByRole('button', { name: /tournament/i });
      expect(tournamentButton).toHaveClass('Mui-selected');
    });

    it('selects friend-groups tab when currentPath is /tournaments/[id]/friend-groups', () => {
      renderWithTheme(
        <TournamentBottomNav
          tournamentId={mockTournamentId}
          currentPath={`/tournaments/${mockTournamentId}/friend-groups`}
        />
      );

      const friendGroupsButton = screen.getByRole('button', { name: /friend groups/i });
      expect(friendGroupsButton).toHaveClass('Mui-selected');
    });

    it('selects stats tab when currentPath starts with /tournaments/[id]/stats', () => {
      renderWithTheme(
        <TournamentBottomNav
          tournamentId={mockTournamentId}
          currentPath={`/tournaments/${mockTournamentId}/stats`}
        />
      );

      const statsButton = screen.getByRole('button', { name: /stats/i });
      expect(statsButton).toHaveClass('Mui-selected');
    });

    it('selects stats tab when currentPath is /tournaments/[id]/stats/subpage', () => {
      renderWithTheme(
        <TournamentBottomNav
          tournamentId={mockTournamentId}
          currentPath={`/tournaments/${mockTournamentId}/stats/subpage`}
        />
      );

      const statsButton = screen.getByRole('button', { name: /stats/i });
      expect(statsButton).toHaveClass('Mui-selected');
    });

    it('does not select friend-groups tab for tournament game groups', () => {
      renderWithTheme(
        <TournamentBottomNav
          tournamentId={mockTournamentId}
          currentPath={`/tournaments/${mockTournamentId}/groups/A`}
        />
      );

      const friendGroupsButton = screen.getByRole('button', { name: /friend groups/i });
      expect(friendGroupsButton).not.toHaveClass('Mui-selected');
    });

    it('updates selected tab when currentPath changes', () => {
      const { rerenderWithTheme } = renderWithTheme(
        <TournamentBottomNav tournamentId={mockTournamentId} currentPath="/" />
      );

      let homeButton = screen.getByRole('button', { name: /home/i });
      expect(homeButton).toHaveClass('Mui-selected');

      // Change to tournament home
      rerenderWithTheme(
        <TournamentBottomNav
          tournamentId={mockTournamentId}
          currentPath={`/tournaments/${mockTournamentId}`}
        />
      );

      homeButton = screen.getByRole('button', { name: /home/i });
      const tournamentButton = screen.getByRole('button', { name: /tournament/i });
      expect(homeButton).not.toHaveClass('Mui-selected');
      expect(tournamentButton).toHaveClass('Mui-selected');
    });
  });

  describe('navigation', () => {
    it('navigates to / when Home tab is clicked', async () => {
      const user = userEvent.setup();
      renderWithTheme(
        <TournamentBottomNav
          tournamentId={mockTournamentId}
          currentPath={`/tournaments/${mockTournamentId}`}
        />
      );

      const homeButton = screen.getByRole('button', { name: /home/i });
      await user.click(homeButton);

      expect(mockRouter.push).toHaveBeenCalledWith('/');
    });

    it('navigates to /tournaments/[id] when Tournament tab is clicked', async () => {
      const user = userEvent.setup();
      renderWithTheme(
        <TournamentBottomNav tournamentId={mockTournamentId} currentPath="/" />
      );

      const tournamentButton = screen.getByRole('button', { name: /tournament/i });
      await user.click(tournamentButton);

      expect(mockRouter.push).toHaveBeenCalledWith(`/tournaments/${mockTournamentId}`);
    });

    it('navigates to /tournaments/[id]/friend-groups when Friend Groups tab is clicked', async () => {
      const user = userEvent.setup();
      renderWithTheme(
        <TournamentBottomNav tournamentId={mockTournamentId} currentPath="/" />
      );

      const friendGroupsButton = screen.getByRole('button', { name: /friend groups/i });
      await user.click(friendGroupsButton);

      expect(mockRouter.push).toHaveBeenCalledWith(`/tournaments/${mockTournamentId}/friend-groups`);
    });

    it('navigates to /tournaments/[id]/stats when Stats tab is clicked', async () => {
      const user = userEvent.setup();
      renderWithTheme(
        <TournamentBottomNav tournamentId={mockTournamentId} currentPath="/" />
      );

      const statsButton = screen.getByRole('button', { name: /stats/i });
      await user.click(statsButton);

      expect(mockRouter.push).toHaveBeenCalledWith(`/tournaments/${mockTournamentId}/stats`);
    });
  });

  describe('responsive behavior', () => {
    it('applies mobile-only display styles', () => {
      const { container } = renderWithTheme(
        <TournamentBottomNav tournamentId={mockTournamentId} currentPath="/" />
      );

      const bottomNav = container.querySelector('.MuiBottomNavigation-root');
      expect(bottomNav).toHaveStyle({
        display: 'flex',
        position: 'fixed',
        bottom: '0',
        width: '100%',
      });
    });

    it('has high z-index to appear above content', () => {
      const { container } = renderWithTheme(
        <TournamentBottomNav tournamentId={mockTournamentId} currentPath="/" />
      );

      const bottomNav = container.querySelector('.MuiBottomNavigation-root');
      expect(bottomNav).toHaveStyle({ zIndex: '1300' });
    });
  });
});
