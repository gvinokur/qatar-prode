import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithTheme } from '../../utils/test-utils';
import GroupSelector from '../../../app/components/groups-page/group-selector';
import { usePathname } from 'next/navigation';
import type { User } from 'next-auth';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

// Mock next-intl
vi.mock('next-intl', () => ({
  useLocale: () => 'es',
  useTranslations: (namespace: string) => {
    const translations: Record<string, Record<string, string>> = {
      'navigation.topNav': {
        hub: 'HUB',
        matches: 'PARTIDOS',
        qualified: 'CLASIFICADOS',
        awards: 'PREMIOS',
        ariaLabel: 'Navegación del torneo',
      },
    };
    return (key: string) => translations[namespace]?.[key] || key;
  },
}));

describe('GroupSelector', () => {
  const mockGroups = [
    { group_letter: 'A', id: 'group-1' },
    { group_letter: 'B', id: 'group-2' },
  ];
  const tournamentId = 'tournament-123';

  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Default pathname
    vi.mocked(usePathname).mockReturnValue('/es/tournaments/tournament-123');
  });

  describe('Rendering', () => {
    it('renders all four tabs (Hub, Matches, Qualified, Awards)', () => {
      renderWithTheme(
        <GroupSelector
          groups={mockGroups}
          tournamentId={tournamentId}
        />
      );

      expect(screen.getByRole('tab', { name: /HUB/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /PARTIDOS/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /CLASIFICADOS/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /PREMIOS/i })).toBeInTheDocument();
    });

    it('renders with custom background and text colors', () => {
      const { container } = renderWithTheme(
        <GroupSelector
          groups={mockGroups}
          tournamentId={tournamentId}
          backgroundColor="#FF0000"
          textColor="#00FF00"
        />
      );

      const tabs = container.querySelector('[role="tablist"]');
      expect(tabs).toBeInTheDocument();
    });

    it('renders with aria-label for accessibility', () => {
      renderWithTheme(
        <GroupSelector
          groups={mockGroups}
          tournamentId={tournamentId}
        />
      );

      expect(screen.getByRole('tablist', { name: 'Navegación del torneo' })).toBeInTheDocument();
    });

    it('renders Matches tab with soccer ball icon', () => {
      renderWithTheme(
        <GroupSelector
          groups={mockGroups}
          tournamentId={tournamentId}
        />
      );

      const matchesTab = screen.getByRole('tab', { name: /PARTIDOS/i });
      expect(matchesTab).toBeInTheDocument();
      // MUI icon renders as SVG with specific test ID or class
      expect(matchesTab.querySelector('svg')).toBeInTheDocument();
    });

    it('renders Qualified tab with an icon', () => {
      renderWithTheme(
        <GroupSelector
          groups={mockGroups}
          tournamentId={tournamentId}
        />
      );

      const qualifiedTab = screen.getByRole('tab', { name: /CLASIFICADOS/i });
      expect(qualifiedTab.querySelector('svg')).toBeInTheDocument();
    });

    it('renders Awards tab with an icon', () => {
      renderWithTheme(
        <GroupSelector
          groups={mockGroups}
          tournamentId={tournamentId}
        />
      );

      const awardsTab = screen.getByRole('tab', { name: /PREMIOS/i });
      expect(awardsTab.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Tab States - Unauthenticated User', () => {
    it('Hub tab is enabled when user is undefined', () => {
      renderWithTheme(
        <GroupSelector
          groups={mockGroups}
          tournamentId={tournamentId}
          user={undefined}
        />
      );

      const hubTab = screen.getByRole('tab', { name: /HUB/i });
      expect(hubTab).not.toHaveAttribute('aria-disabled', 'true');
      expect(hubTab).not.toHaveClass('Mui-disabled');
    });

    it('Matches tab is always enabled when user is undefined', () => {
      renderWithTheme(
        <GroupSelector
          groups={mockGroups}
          tournamentId={tournamentId}
          user={undefined}
        />
      );

      const matchesTab = screen.getByRole('tab', { name: /PARTIDOS/i });
      expect(matchesTab).not.toHaveAttribute('aria-disabled', 'true');
      expect(matchesTab).not.toHaveClass('Mui-disabled');
    });

    it('Qualified tab is disabled when user is undefined', () => {
      renderWithTheme(
        <GroupSelector
          groups={mockGroups}
          tournamentId={tournamentId}
          user={undefined}
        />
      );

      const qualifiedTab = screen.getByRole('tab', { name: /CLASIFICADOS/i });
      expect(qualifiedTab).toHaveAttribute('aria-disabled', 'true');
      expect(qualifiedTab).toHaveClass('Mui-disabled');
    });

    it('Awards tab is disabled when user is undefined', () => {
      renderWithTheme(
        <GroupSelector
          groups={mockGroups}
          tournamentId={tournamentId}
          user={undefined}
        />
      );

      const awardsTab = screen.getByRole('tab', { name: /PREMIOS/i });
      expect(awardsTab).toHaveAttribute('aria-disabled', 'true');
      expect(awardsTab).toHaveClass('Mui-disabled');
    });

    it('Qualified tab is disabled when user prop is omitted', () => {
      renderWithTheme(
        <GroupSelector
          groups={mockGroups}
          tournamentId={tournamentId}
        />
      );

      const qualifiedTab = screen.getByRole('tab', { name: /CLASIFICADOS/i });
      expect(qualifiedTab).toHaveAttribute('aria-disabled', 'true');
    });

    it('Awards tab is disabled when user prop is omitted', () => {
      renderWithTheme(
        <GroupSelector
          groups={mockGroups}
          tournamentId={tournamentId}
        />
      );

      const awardsTab = screen.getByRole('tab', { name: /PREMIOS/i });
      expect(awardsTab).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('Tab States - Authenticated User', () => {
    it('Hub tab is enabled when user is provided', () => {
      renderWithTheme(
        <GroupSelector
          groups={mockGroups}
          tournamentId={tournamentId}
          user={mockUser}
        />
      );

      const hubTab = screen.getByRole('tab', { name: /HUB/i });
      expect(hubTab).not.toHaveAttribute('aria-disabled', 'true');
      expect(hubTab).not.toHaveClass('Mui-disabled');
    });

    it('Matches tab is enabled when user is provided', () => {
      renderWithTheme(
        <GroupSelector
          groups={mockGroups}
          tournamentId={tournamentId}
          user={mockUser}
        />
      );

      const matchesTab = screen.getByRole('tab', { name: /PARTIDOS/i });
      expect(matchesTab).not.toHaveAttribute('aria-disabled', 'true');
    });

    it('Qualified tab is enabled when user is provided', () => {
      renderWithTheme(
        <GroupSelector
          groups={mockGroups}
          tournamentId={tournamentId}
          user={mockUser}
        />
      );

      const qualifiedTab = screen.getByRole('tab', { name: /CLASIFICADOS/i });
      expect(qualifiedTab).not.toHaveAttribute('aria-disabled', 'true');
      expect(qualifiedTab).not.toHaveClass('Mui-disabled');
    });

    it('Awards tab is enabled when user is provided', () => {
      renderWithTheme(
        <GroupSelector
          groups={mockGroups}
          tournamentId={tournamentId}
          user={mockUser}
        />
      );

      const awardsTab = screen.getByRole('tab', { name: /PREMIOS/i });
      expect(awardsTab).not.toHaveAttribute('aria-disabled', 'true');
      expect(awardsTab).not.toHaveClass('Mui-disabled');
    });
  });

  describe('Tab Links', () => {
    it('Matches tab links to /games URL', () => {
      renderWithTheme(
        <GroupSelector
          groups={mockGroups}
          tournamentId={tournamentId}
        />
      );

      const matchesTab = screen.getByRole('tab', { name: /PARTIDOS/i });
      expect(matchesTab).toHaveAttribute('href', '/es/tournaments/tournament-123/games');
    });

    it('Hub tab links to tournament root URL', () => {
      renderWithTheme(
        <GroupSelector
          groups={mockGroups}
          tournamentId={tournamentId}
        />
      );

      const hubTab = screen.getByRole('tab', { name: /HUB/i });
      expect(hubTab).toHaveAttribute('href', '/es/tournaments/tournament-123');
    });

    it('Qualified tab links to qualified-teams URL', () => {
      renderWithTheme(
        <GroupSelector
          groups={mockGroups}
          tournamentId={tournamentId}
        />
      );

      const qualifiedTab = screen.getByRole('tab', { name: /CLASIFICADOS/i });
      expect(qualifiedTab).toHaveAttribute('href', '/es/tournaments/tournament-123/qualified-teams');
    });

    it('Awards tab links to awards URL', () => {
      renderWithTheme(
        <GroupSelector
          groups={mockGroups}
          tournamentId={tournamentId}
        />
      );

      const awardsTab = screen.getByRole('tab', { name: /PREMIOS/i });
      expect(awardsTab).toHaveAttribute('href', '/es/tournaments/tournament-123/awards');
    });
  });

  describe('Tab Selection', () => {
    it('selects Hub tab when pathname is tournament root', () => {
      vi.mocked(usePathname).mockReturnValue('/es/tournaments/tournament-123');

      renderWithTheme(
        <GroupSelector
          groups={mockGroups}
          tournamentId={tournamentId}
        />
      );

      const hubTab = screen.getByRole('tab', { name: /HUB/i });
      expect(hubTab).toHaveAttribute('aria-selected', 'true');
      expect(hubTab).toHaveClass('Mui-selected');
    });

    it('selects Matches tab when pathname includes /games', () => {
      vi.mocked(usePathname).mockReturnValue('/es/tournaments/tournament-123/games');

      renderWithTheme(
        <GroupSelector
          groups={mockGroups}
          tournamentId={tournamentId}
        />
      );

      const matchesTab = screen.getByRole('tab', { name: /PARTIDOS/i });
      expect(matchesTab).toHaveAttribute('aria-selected', 'true');
      expect(matchesTab).toHaveClass('Mui-selected');
    });

    it('selects Qualified tab when pathname includes /qualified-teams', () => {
      vi.mocked(usePathname).mockReturnValue('/es/tournaments/tournament-123/qualified-teams');

      renderWithTheme(
        <GroupSelector
          groups={mockGroups}
          tournamentId={tournamentId}
        />
      );

      const qualifiedTab = screen.getByRole('tab', { name: /CLASIFICADOS/i });
      expect(qualifiedTab).toHaveAttribute('aria-selected', 'true');
      expect(qualifiedTab).toHaveClass('Mui-selected');
    });

    it('selects Awards tab when pathname includes /awards', () => {
      vi.mocked(usePathname).mockReturnValue('/es/tournaments/tournament-123/awards');

      renderWithTheme(
        <GroupSelector
          groups={mockGroups}
          tournamentId={tournamentId}
        />
      );

      const awardsTab = screen.getByRole('tab', { name: /PREMIOS/i });
      expect(awardsTab).toHaveAttribute('aria-selected', 'true');
      expect(awardsTab).toHaveClass('Mui-selected');
    });

    it('defaults to Hub tab for unknown tournament pages', () => {
      vi.mocked(usePathname).mockReturnValue('/es/tournaments/tournament-123/some-other-page');

      renderWithTheme(
        <GroupSelector
          groups={mockGroups}
          tournamentId={tournamentId}
        />
      );

      const hubTab = screen.getByRole('tab', { name: /HUB/i });
      expect(hubTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Selected Tab Styling', () => {
    it('applies selected styling to Hub tab when on tournament root', () => {
      vi.mocked(usePathname).mockReturnValue('/es/tournaments/tournament-123');

      renderWithTheme(
        <GroupSelector
          groups={mockGroups}
          tournamentId={tournamentId}
        />
      );

      const hubTab = screen.getByRole('tab', { name: /HUB/i });
      expect(hubTab).toHaveClass('Mui-selected');
    });

    it('applies selected styling to Matches tab when on /games path', () => {
      vi.mocked(usePathname).mockReturnValue('/es/tournaments/tournament-123/games');

      renderWithTheme(
        <GroupSelector
          groups={mockGroups}
          tournamentId={tournamentId}
        />
      );

      const matchesTab = screen.getByRole('tab', { name: /PARTIDOS/i });
      expect(matchesTab).toHaveClass('Mui-selected');
    });

    it('applies selected styling with custom colors', () => {
      vi.mocked(usePathname).mockReturnValue('/es/tournaments/tournament-123/qualified-teams');

      const { container } = renderWithTheme(
        <GroupSelector
          groups={mockGroups}
          tournamentId={tournamentId}
          backgroundColor="#FF0000"
          textColor="#00FF00"
          user={mockUser}
        />
      );

      const qualifiedTab = screen.getByRole('tab', { name: /CLASIFICADOS/i });
      expect(qualifiedTab).toHaveClass('Mui-selected');
      expect(qualifiedTab).toBeInTheDocument();
    });

    it('does not apply selected styling to non-selected tabs', () => {
      vi.mocked(usePathname).mockReturnValue('/es/tournaments/tournament-123');

      renderWithTheme(
        <GroupSelector
          groups={mockGroups}
          tournamentId={tournamentId}
        />
      );

      const qualifiedTab = screen.getByRole('tab', { name: /CLASIFICADOS/i });
      const awardsTab = screen.getByRole('tab', { name: /PREMIOS/i });

      expect(qualifiedTab).not.toHaveClass('Mui-selected');
      expect(awardsTab).not.toHaveClass('Mui-selected');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty groups array', () => {
      renderWithTheme(
        <GroupSelector
          groups={[]}
          tournamentId={tournamentId}
        />
      );

      expect(screen.getByRole('tab', { name: /HUB/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /PARTIDOS/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /CLASIFICADOS/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /PREMIOS/i })).toBeInTheDocument();
    });

    it('handles different tournament IDs in URLs', () => {
      const differentTournamentId = 'tournament-456';

      renderWithTheme(
        <GroupSelector
          groups={mockGroups}
          tournamentId={differentTournamentId}
        />
      );

      const matchesTab = screen.getByRole('tab', { name: /PARTIDOS/i });
      expect(matchesTab).toHaveAttribute('href', '/es/tournaments/tournament-456/games');
    });

    it('renders with dark theme', () => {
      renderWithTheme(
        <GroupSelector
          groups={mockGroups}
          tournamentId={tournamentId}
        />,
        { theme: 'dark' }
      );

      expect(screen.getByRole('tab', { name: /HUB/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /PARTIDOS/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /CLASIFICADOS/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /PREMIOS/i })).toBeInTheDocument();
    });

    it('handles user with minimal properties', () => {
      const minimalUser: User = {
        id: 'user-2',
        email: 'minimal@example.com',
      };

      renderWithTheme(
        <GroupSelector
          groups={mockGroups}
          tournamentId={tournamentId}
          user={minimalUser}
        />
      );

      const qualifiedTab = screen.getByRole('tab', { name: /CLASIFICADOS/i });
      expect(qualifiedTab).not.toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('Disabled Tab Behavior', () => {
    it('disabled Qualified tab still has correct href attribute', () => {
      renderWithTheme(
        <GroupSelector
          groups={mockGroups}
          tournamentId={tournamentId}
          user={undefined}
        />
      );

      const qualifiedTab = screen.getByRole('tab', { name: /CLASIFICADOS/i });
      expect(qualifiedTab).toHaveAttribute('href', '/es/tournaments/tournament-123/qualified-teams');
      expect(qualifiedTab).toHaveAttribute('aria-disabled', 'true');
    });

    it('disabled Awards tab still has correct href attribute', () => {
      renderWithTheme(
        <GroupSelector
          groups={mockGroups}
          tournamentId={tournamentId}
          user={undefined}
        />
      );

      const awardsTab = screen.getByRole('tab', { name: /PREMIOS/i });
      expect(awardsTab).toHaveAttribute('href', '/es/tournaments/tournament-123/awards');
      expect(awardsTab).toHaveAttribute('aria-disabled', 'true');
    });
  });
});
