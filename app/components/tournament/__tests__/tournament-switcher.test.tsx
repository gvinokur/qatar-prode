import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TournamentSwitcher from '../tournament-switcher';
import { renderWithTheme } from '@/__tests__/utils/test-utils';
import { createMockRouter } from '@/__tests__/mocks/next-navigation.mocks';
import * as dismissalStorage from '@/app/utils/dismissal-storage';

// Mock next/navigation
const mockPush = vi.fn();
const mockRouter = createMockRouter({ push: mockPush });
const mockUsePathname = vi.fn(() => '/en/tournaments/world-cup-2022/matches');

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => mockUsePathname(),
}));

// Mock next-intl
const mockUseLocale = vi.fn(() => 'en');

vi.mock('next-intl', () => ({
  useLocale: () => mockUseLocale(),
}));

// Mock dismissal-storage
vi.mock('@/app/utils/dismissal-storage', () => ({
  setLastSelectedTournamentId: vi.fn(),
}));

describe('TournamentSwitcher', () => {
  const mockTournaments = [
    {
      id: 'world-cup-2022',
      long_name: 'FIFA World Cup 2022',
      short_name: 'WC 2022',
    },
    {
      id: 'copa-america-2024',
      long_name: 'Copa America 2024',
      short_name: 'CA 2024',
    },
    {
      id: 'euro-2024',
      long_name: 'UEFA Euro 2024',
      short_name: 'Euro 2024',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock implementations to defaults
    mockUsePathname.mockReturnValue('/en/tournaments/world-cup-2022/matches');
    mockUseLocale.mockReturnValue('en');
  });

  describe('Rendering', () => {
    it('does not render when only 1 tournament', () => {
      const singleTournament = [mockTournaments[0]];

      const { container } = renderWithTheme(
        <TournamentSwitcher
          currentTournamentId="world-cup-2022"
          tournaments={singleTournament}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('renders IconButton when multiple tournaments', () => {
      renderWithTheme(
        <TournamentSwitcher
          currentTournamentId="world-cup-2022"
          tournaments={mockTournaments}
        />
      );

      const button = screen.getByRole('button', { name: /switch tournament/i });
      expect(button).toBeInTheDocument();
    });

    it('has correct IconButton attributes', () => {
      renderWithTheme(
        <TournamentSwitcher
          currentTournamentId="world-cup-2022"
          tournaments={mockTournaments}
        />
      );

      const button = screen.getByRole('button', { name: /switch tournament/i });
      expect(button).toHaveAttribute('aria-label', 'Switch tournament');
    });
  });

  describe('Menu Interaction', () => {
    it('opens menu on click', async () => {
      const user = userEvent.setup();

      renderWithTheme(
        <TournamentSwitcher
          currentTournamentId="world-cup-2022"
          tournaments={mockTournaments}
        />
      );

      const button = screen.getByRole('button', { name: /switch tournament/i });
      await user.click(button);

      // Menu should be visible
      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });
    });

    it('shows all tournaments in menu', async () => {
      const user = userEvent.setup();

      renderWithTheme(
        <TournamentSwitcher
          currentTournamentId="world-cup-2022"
          tournaments={mockTournaments}
        />
      );

      const button = screen.getByRole('button', { name: /switch tournament/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });

      // All tournament names should be present
      expect(screen.getByText('FIFA World Cup 2022')).toBeInTheDocument();
      expect(screen.getByText('Copa America 2024')).toBeInTheDocument();
      expect(screen.getByText('UEFA Euro 2024')).toBeInTheDocument();
    });

    it('marks current tournament as selected', async () => {
      const user = userEvent.setup();

      renderWithTheme(
        <TournamentSwitcher
          currentTournamentId="world-cup-2022"
          tournaments={mockTournaments}
        />
      );

      const button = screen.getByRole('button', { name: /switch tournament/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });

      const menuItems = screen.getAllByRole('menuitem');
      const currentMenuItem = menuItems.find(
        (item) => item.textContent === 'FIFA World Cup 2022'
      );

      expect(currentMenuItem).toHaveClass('Mui-selected');
    });

    it('shows check icon for current tournament', async () => {
      const user = userEvent.setup();

      renderWithTheme(
        <TournamentSwitcher
          currentTournamentId="world-cup-2022"
          tournaments={mockTournaments}
        />
      );

      const button = screen.getByRole('button', { name: /switch tournament/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });

      // Check icon should be present for current tournament
      const menuItems = screen.getAllByRole('menuitem');
      const currentMenuItem = menuItems.find(
        (item) => item.textContent === 'FIFA World Cup 2022'
      );

      // Check that it contains a CheckIcon (via MuiSvgIcon)
      const checkIcon = currentMenuItem?.querySelector('.MuiSvgIcon-root');
      expect(checkIcon).toBeInTheDocument();
    });

    it('closes menu on selection', async () => {
      const user = userEvent.setup();

      renderWithTheme(
        <TournamentSwitcher
          currentTournamentId="world-cup-2022"
          tournaments={mockTournaments}
        />
      );

      const button = screen.getByRole('button', { name: /switch tournament/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });

      // Click on a different tournament
      const copaMenuItem = screen.getByText('Copa America 2024');
      await user.click(copaMenuItem);

      // Menu should close
      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('navigates to selected tournament on click', async () => {
      const user = userEvent.setup();

      renderWithTheme(
        <TournamentSwitcher
          currentTournamentId="world-cup-2022"
          tournaments={mockTournaments}
        />
      );

      const button = screen.getByRole('button', { name: /switch tournament/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });

      // Click on Copa America
      const copaMenuItem = screen.getByText('Copa America 2024');
      await user.click(copaMenuItem);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/en/tournaments/copa-america-2024/matches');
      });
    });

    it('preserves current page path when switching', async () => {
      const user = userEvent.setup();

      // Mock pathname with a specific page (e.g., standings)
      mockUsePathname.mockReturnValue('/en/tournaments/world-cup-2022/standings');

      renderWithTheme(
        <TournamentSwitcher
          currentTournamentId="world-cup-2022"
          tournaments={mockTournaments}
        />
      );

      const button = screen.getByRole('button', { name: /switch tournament/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });

      // Click on Euro 2024
      const euroMenuItem = screen.getByText('UEFA Euro 2024');
      await user.click(euroMenuItem);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/en/tournaments/euro-2024/standings');
      });
    });

    it('handles root tournament path correctly', async () => {
      const user = userEvent.setup();

      // Mock pathname at tournament root (no subpage)
      mockUsePathname.mockReturnValue('/en/tournaments/world-cup-2022');

      renderWithTheme(
        <TournamentSwitcher
          currentTournamentId="world-cup-2022"
          tournaments={mockTournaments}
        />
      );

      const button = screen.getByRole('button', { name: /switch tournament/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });

      // Click on Copa America
      const copaMenuItem = screen.getByText('Copa America 2024');
      await user.click(copaMenuItem);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/en/tournaments/copa-america-2024');
      });
    });

    it('works with different locales', async () => {
      const user = userEvent.setup();

      // Mock Spanish locale
      mockUseLocale.mockReturnValue('es');
      mockUsePathname.mockReturnValue('/es/tournaments/world-cup-2022/matches');

      renderWithTheme(
        <TournamentSwitcher
          currentTournamentId="world-cup-2022"
          tournaments={mockTournaments}
        />
      );

      const button = screen.getByRole('button', { name: /switch tournament/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });

      // Click on Euro 2024
      const euroMenuItem = screen.getByText('UEFA Euro 2024');
      await user.click(euroMenuItem);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/es/tournaments/euro-2024/matches');
      });
    });
  });

  describe('localStorage Integration', () => {
    it('saves selection to localStorage on tournament click', async () => {
      const user = userEvent.setup();

      renderWithTheme(
        <TournamentSwitcher
          currentTournamentId="world-cup-2022"
          tournaments={mockTournaments}
        />
      );

      const button = screen.getByRole('button', { name: /switch tournament/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });

      // Click on Copa America
      const copaMenuItem = screen.getByText('Copa America 2024');
      await user.click(copaMenuItem);

      await waitFor(() => {
        expect(dismissalStorage.setLastSelectedTournamentId).toHaveBeenCalledWith(
          'copa-america-2024'
        );
      });
    });

    it('saves selection before navigation', async () => {
      const user = userEvent.setup();
      const callOrder: string[] = [];

      // Track call order
      vi.mocked(dismissalStorage.setLastSelectedTournamentId).mockImplementation(() => {
        callOrder.push('localStorage');
      });
      mockPush.mockImplementation(() => {
        callOrder.push('navigation');
      });

      renderWithTheme(
        <TournamentSwitcher
          currentTournamentId="world-cup-2022"
          tournaments={mockTournaments}
        />
      );

      const button = screen.getByRole('button', { name: /switch tournament/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });

      const euroMenuItem = screen.getByText('UEFA Euro 2024');
      await user.click(euroMenuItem);

      await waitFor(() => {
        expect(callOrder).toEqual(['localStorage', 'navigation']);
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles empty tournaments array', () => {
      const { container } = renderWithTheme(
        <TournamentSwitcher currentTournamentId="world-cup-2022" tournaments={[]} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('handles tournament with special characters in id', async () => {
      const user = userEvent.setup();
      const specialTournaments = [
        { id: 'tournament-2024', long_name: 'Tournament 2024', short_name: 'T24' },
        { id: 'special_tournament', long_name: 'Special Tournament', short_name: 'ST' },
      ];

      renderWithTheme(
        <TournamentSwitcher
          currentTournamentId="tournament-2024"
          tournaments={specialTournaments}
        />
      );

      const button = screen.getByRole('button', { name: /switch tournament/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });

      const specialMenuItem = screen.getByText('Special Tournament');
      await user.click(specialMenuItem);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/en/tournaments/special_tournament');
      });
    });

    it('handles very long tournament names', async () => {
      const user = userEvent.setup();
      const longNameTournaments = [
        {
          id: 'short-id',
          long_name: 'A Very Long Tournament Name That Might Cause Display Issues',
          short_name: 'Short',
        },
        { id: 'other', long_name: 'Other Tournament', short_name: 'Other' },
      ];

      renderWithTheme(
        <TournamentSwitcher
          currentTournamentId="short-id"
          tournaments={longNameTournaments}
        />
      );

      const button = screen.getByRole('button', { name: /switch tournament/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });

      expect(
        screen.getByText('A Very Long Tournament Name That Might Cause Display Issues')
      ).toBeInTheDocument();
    });
  });
});
