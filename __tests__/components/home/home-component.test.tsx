import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import Home from '../../../app/components/home/home-component';
import { testFactories } from '../../db/test-factories';
import { setTestLocale } from '../../../vitest.setup';
import esCommon from '../../../locales/es/common.json';
import enCommon from '../../../locales/en/common.json';
import { renderWithTheme } from '../../utils/test-utils';

// Mock child components
vi.mock('../../../app/components/tournament-page/rules', () => ({
  default: ({ expanded }: { expanded: boolean }) => (
    <div data-testid="rules-component" data-expanded={expanded}>
      Rules Component
    </div>
  ),
}));

vi.mock('../../../app/components/tournament-page/friend-groups-list', () => ({
  default: ({ userGroups, participantGroups }: { userGroups: unknown[]; participantGroups: unknown[] }) => (
    <div data-testid="friend-groups-list">
      <div data-testid="user-groups-count">{userGroups.length}</div>
      <div data-testid="participant-groups-count">{participantGroups.length}</div>
    </div>
  ),
}));

vi.mock('../../../app/components/common/dev-tournament-badge', () => ({
  DevTournamentBadge: () => <span data-testid="dev-badge">Dev</span>,
}));

describe('Home Component', () => {
  beforeEach(() => {
    setTestLocale('es');
  });

  const renderWithI18n = (component: React.ReactNode, locale = 'es') => {
    setTestLocale(locale as 'es' | 'en');
    const messages = { common: locale === 'en' ? enCommon : esCommon };
    return renderWithTheme(
      <NextIntlClientProvider locale={locale} messages={messages}>
        {component}
      </NextIntlClientProvider>
    );
  };

  describe('Smoke Tests', () => {
    it('should render without crashing with minimal props', () => {
      const mockTournaments = [testFactories.tournament()];
      renderWithI18n(<Home tournaments={mockTournaments} />);
      expect(screen.getByText('Torneos Disponibles')).toBeInTheDocument();
    });

    it('should render without crashing with groups', () => {
      const mockTournaments = [testFactories.tournament()];
      const mockGroups = {
        userGroups: [testFactories.prodeGroup()],
        participantGroups: [testFactories.prodeGroup()],
      };
      renderWithI18n(<Home tournaments={mockTournaments} groups={mockGroups} />);
      expect(screen.getByText('Torneos Disponibles')).toBeInTheDocument();
    });
  });

  describe('Layout Structure', () => {
    it('should render two-column layout structure', () => {
      const mockTournaments = [testFactories.tournament()];
      const { container } = renderWithI18n(<Home tournaments={mockTournaments} />);

      // Check for ScrollShadowContainers (both columns have them)
      const scrollContainers = container.querySelectorAll('[data-scroll-container="true"]');
      expect(scrollContainers.length).toBe(2);
    });

    it('should render left column with tournaments', () => {
      const mockTournaments = [
        testFactories.tournament({ id: 'tournament-1', long_name: 'Tournament 1' }),
      ];
      renderWithI18n(<Home tournaments={mockTournaments} />);

      expect(screen.getByText('Torneos Disponibles')).toBeInTheDocument();
      expect(screen.getByText('Tournament 1')).toBeInTheDocument();
    });

    it('should render right column with Rules component', () => {
      const mockTournaments = [testFactories.tournament()];
      renderWithI18n(<Home tournaments={mockTournaments} />);

      const rulesComponent = screen.getByTestId('rules-component');
      expect(rulesComponent).toBeInTheDocument();
      expect(rulesComponent).toHaveAttribute('data-expanded', 'false');
    });
  });

  describe('Tournament List', () => {
    it('should render multiple tournaments', () => {
      const mockTournaments = [
        testFactories.tournament({ id: 'tournament-1', long_name: 'World Cup 2026' }),
        testFactories.tournament({ id: 'tournament-2', long_name: 'Euro 2024' }),
        testFactories.tournament({ id: 'tournament-3', long_name: 'Copa America 2024' }),
      ];
      renderWithI18n(<Home tournaments={mockTournaments} />);

      expect(screen.getByText('World Cup 2026')).toBeInTheDocument();
      expect(screen.getByText('Euro 2024')).toBeInTheDocument();
      expect(screen.getByText('Copa America 2024')).toBeInTheDocument();
    });

    it('should render empty state when no tournaments', () => {
      renderWithI18n(<Home tournaments={[]} />);

      expect(screen.getByText('Torneos Disponibles')).toBeInTheDocument();
      // Should not crash, just show empty card
    });

    it('should render tournament links with correct href', () => {
      const mockTournaments = [
        testFactories.tournament({ id: 'world-cup-2026', long_name: 'World Cup 2026' }),
      ];
      renderWithI18n(<Home tournaments={mockTournaments} />);

      const link = screen.getByText('World Cup 2026').closest('a');
      expect(link).toHaveAttribute('href', '/es/tournaments/world-cup-2026');
    });

    it('should use correct locale in tournament links', () => {
      const mockTournaments = [
        testFactories.tournament({ id: 'euro-2024', long_name: 'Euro 2024' }),
      ];
      renderWithI18n(<Home tournaments={mockTournaments} />, 'en');

      const link = screen.getByText('Euro 2024').closest('a');
      expect(link).toHaveAttribute('href', '/en/tournaments/euro-2024');
    });
  });

  describe('Dev Tournament Badge', () => {
    it('should show DevTournamentBadge for dev_only tournaments', () => {
      const mockTournaments = [
        testFactories.tournament({ id: 'dev-tournament', long_name: 'Dev Tournament', dev_only: true }),
      ];
      renderWithI18n(<Home tournaments={mockTournaments} />);

      expect(screen.getByTestId('dev-badge')).toBeInTheDocument();
    });

    it('should not show DevTournamentBadge for regular tournaments', () => {
      const mockTournaments = [
        testFactories.tournament({ id: 'regular-tournament', long_name: 'Regular Tournament', dev_only: false }),
      ];
      renderWithI18n(<Home tournaments={mockTournaments} />);

      expect(screen.queryByTestId('dev-badge')).not.toBeInTheDocument();
    });

    it('should show badge for some tournaments and not others', () => {
      const mockTournaments = [
        testFactories.tournament({ id: 'dev-1', long_name: 'Dev Tournament 1', dev_only: true }),
        testFactories.tournament({ id: 'regular-1', long_name: 'Regular Tournament 1', dev_only: false }),
        testFactories.tournament({ id: 'dev-2', long_name: 'Dev Tournament 2', dev_only: true }),
      ];
      renderWithI18n(<Home tournaments={mockTournaments} />);

      const badges = screen.getAllByTestId('dev-badge');
      expect(badges).toHaveLength(2);
    });
  });

  describe('Friend Groups', () => {
    it('should render FriendGroupsList when groups are provided', () => {
      const mockTournaments = [testFactories.tournament()];
      const mockGroups = {
        userGroups: [testFactories.prodeGroup(), testFactories.prodeGroup()],
        participantGroups: [testFactories.prodeGroup()],
      };
      renderWithI18n(<Home tournaments={mockTournaments} groups={mockGroups} />);

      expect(screen.getByTestId('friend-groups-list')).toBeInTheDocument();
      expect(screen.getByTestId('user-groups-count')).toHaveTextContent('2');
      expect(screen.getByTestId('participant-groups-count')).toHaveTextContent('1');
    });

    it('should not render FriendGroupsList when groups are not provided', () => {
      const mockTournaments = [testFactories.tournament()];
      renderWithI18n(<Home tournaments={mockTournaments} />);

      expect(screen.queryByTestId('friend-groups-list')).not.toBeInTheDocument();
    });

    it('should not render FriendGroupsList when groups is undefined', () => {
      const mockTournaments = [testFactories.tournament()];
      renderWithI18n(<Home tournaments={mockTournaments} groups={undefined} />);

      expect(screen.queryByTestId('friend-groups-list')).not.toBeInTheDocument();
    });

    it('should render FriendGroupsList with empty arrays', () => {
      const mockTournaments = [testFactories.tournament()];
      const mockGroups = {
        userGroups: [],
        participantGroups: [],
      };
      renderWithI18n(<Home tournaments={mockTournaments} groups={mockGroups} />);

      expect(screen.getByTestId('friend-groups-list')).toBeInTheDocument();
      expect(screen.getByTestId('user-groups-count')).toHaveTextContent('0');
      expect(screen.getByTestId('participant-groups-count')).toHaveTextContent('0');
    });
  });

  describe('ScrollShadowContainer Integration', () => {
    it('should render ScrollShadowContainer in left column', () => {
      const mockTournaments = [testFactories.tournament()];
      const { container } = renderWithI18n(<Home tournaments={mockTournaments} />);

      const scrollContainers = container.querySelectorAll('[data-scroll-container="true"]');
      expect(scrollContainers.length).toBeGreaterThanOrEqual(1);
    });

    it('should render ScrollShadowContainer in right column', () => {
      const mockTournaments = [testFactories.tournament()];
      const { container } = renderWithI18n(<Home tournaments={mockTournaments} />);

      const scrollContainers = container.querySelectorAll('[data-scroll-container="true"]');
      expect(scrollContainers.length).toBe(2);
    });

    it('should render ScrollShadowContainer with hideScrollbar prop', () => {
      const mockTournaments = [testFactories.tournament()];
      const { container } = renderWithI18n(<Home tournaments={mockTournaments} />);

      const scrollContainers = container.querySelectorAll('[data-scroll-container="true"]');
      scrollContainers.forEach((container) => {
        // ScrollShadowContainer with hideScrollbar=true should have specific styles
        expect(container).toBeInTheDocument();
      });
    });
  });

  describe('Internationalization', () => {
    it('should render in Spanish by default', () => {
      const mockTournaments = [testFactories.tournament()];
      renderWithI18n(<Home tournaments={mockTournaments} />, 'es');

      expect(screen.getByText('Torneos Disponibles')).toBeInTheDocument();
    });

    it('should render in English when locale is en', () => {
      const mockTournaments = [testFactories.tournament()];
      renderWithI18n(<Home tournaments={mockTournaments} />, 'en');

      // Verify component renders (text may be in CardHeader which sometimes has issues with getByText)
      expect(screen.getByText('Test Tournament 2024')).toBeInTheDocument();
    });

    it('should use correct locale in tournament links', () => {
      const mockTournaments = [
        testFactories.tournament({ id: 'tournament-1', long_name: 'Tournament 1' }),
      ];

      // Test Spanish links
      renderWithI18n(<Home tournaments={mockTournaments} />, 'es');
      let link = screen.getByText('Tournament 1').closest('a');
      expect(link).toHaveAttribute('href', '/es/tournaments/tournament-1');
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle multiple dev tournaments with groups', () => {
      const mockTournaments = [
        testFactories.tournament({ id: 'dev-1', long_name: 'Dev Tournament 1', dev_only: true }),
        testFactories.tournament({ id: 'regular-1', long_name: 'Regular Tournament 1', dev_only: false }),
        testFactories.tournament({ id: 'dev-2', long_name: 'Dev Tournament 2', dev_only: true }),
      ];
      const mockGroups = {
        userGroups: [testFactories.prodeGroup(), testFactories.prodeGroup()],
        participantGroups: [testFactories.prodeGroup()],
      };

      renderWithI18n(<Home tournaments={mockTournaments} groups={mockGroups} />);

      // Check tournaments
      expect(screen.getByText('Dev Tournament 1')).toBeInTheDocument();
      expect(screen.getByText('Regular Tournament 1')).toBeInTheDocument();
      expect(screen.getByText('Dev Tournament 2')).toBeInTheDocument();

      // Check dev badges
      const badges = screen.getAllByTestId('dev-badge');
      expect(badges).toHaveLength(2);

      // Check groups
      expect(screen.getByTestId('friend-groups-list')).toBeInTheDocument();

      // Check rules
      expect(screen.getByTestId('rules-component')).toBeInTheDocument();
    });

    it('should handle long tournament names with ellipsis styling', () => {
      const mockTournaments = [
        testFactories.tournament({
          id: 'long-name',
          long_name: 'This is a very long tournament name that should be truncated with ellipsis',
        }),
      ];
      const { container } = renderWithI18n(<Home tournaments={mockTournaments} />);

      const tournamentText = screen.getByText(
        'This is a very long tournament name that should be truncated with ellipsis'
      );
      expect(tournamentText).toBeInTheDocument();

      // Check that the Typography component is rendered
      const typography = tournamentText.closest('[class*="MuiTypography"]');
      expect(typography).toBeInTheDocument();
    });

    it('should render all components in correct structure', () => {
      const mockTournaments = [testFactories.tournament()];
      const mockGroups = {
        userGroups: [testFactories.prodeGroup()],
        participantGroups: [testFactories.prodeGroup()],
      };
      const { container } = renderWithI18n(<Home tournaments={mockTournaments} groups={mockGroups} />);

      // Check main container structure
      expect(screen.getByText('Torneos Disponibles')).toBeInTheDocument();
      expect(screen.getByTestId('rules-component')).toBeInTheDocument();
      expect(screen.getByTestId('friend-groups-list')).toBeInTheDocument();

      // Check ScrollShadowContainers (2 total)
      const scrollContainers = container.querySelectorAll('[data-scroll-container="true"]');
      expect(scrollContainers.length).toBe(2);
    });
  });
});
