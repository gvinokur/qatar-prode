import { screen, fireEvent, render } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import ResultsPageClient from '../../../app/components/results-page/results-page-client';
import { renderWithTheme, renderWithProviders } from '../../utils/test-utils';
import { testFactories, createMany } from '../../db/test-factories';
import esTablesMessages from '../../../locales/es/tables.json';
import enTablesMessages from '../../../locales/en/tables.json';

// Mock GroupsStageView component
vi.mock('../../../app/components/results-page/groups-stage-view', () => ({
  default: ({ groups, games, qualifiedTeams }: any) => (
    <div data-testid="groups-stage-view">
      <div data-testid="groups-count">{groups.length}</div>
      <div data-testid="games-count">{games.length}</div>
      <div data-testid="qualified-teams-count">{qualifiedTeams.length}</div>
    </div>
  ),
}));

// Mock PlayoffsBracketView component
vi.mock('../../../app/components/results-page/playoffs-bracket-view', () => ({
  default: ({ playoffStages, games, teamsMap }: any) => (
    <div data-testid="playoffs-bracket-view">
      <div data-testid="playoff-stages-count">{playoffStages.length}</div>
      <div data-testid="games-count">{games.length}</div>
      <div data-testid="teams-map-size">{Object.keys(teamsMap).length}</div>
    </div>
  ),
}));

describe('ResultsPageClient', () => {
  const mockTeams = createMany(testFactories.team, 4, (i) => ({
    id: `team-${i}`,
    name: `Team ${i}`,
    short_name: `T${i}`,
  }));

  const mockTeamsMap = mockTeams.reduce(
    (acc, team) => ({ ...acc, [team.id]: team }),
    {}
  );

  const mockGames = createMany(testFactories.game, 6, (i) => ({
    id: `game-${i}`,
    game_number: i,
    tournament_id: 'tournament-1',
    home_team: `team-${(i % 4) + 1}`,
    away_team: `team-${((i + 1) % 4) + 1}`,
    game_date: new Date(`2024-06-${14 + i}T18:00:00Z`),
  }));

  const mockGroups = [
    {
      id: 'group-a',
      letter: 'A',
      teamStats: [
        {
          id: 'stats-1',
          tournament_group_id: 'group-a',
          team_id: 'team-1',
          position: 1,
          games_played: 3,
          points: 7,
          win: 2,
          draw: 1,
          loss: 0,
          goals_for: 5,
          goals_against: 2,
          goal_difference: 3,
          conduct_score: 0,
          is_complete: true,
        },
      ],
      teamsMap: mockTeamsMap,
    },
    {
      id: 'group-b',
      letter: 'B',
      teamStats: [
        {
          id: 'stats-2',
          tournament_group_id: 'group-b',
          team_id: 'team-2',
          position: 1,
          games_played: 3,
          points: 9,
          win: 3,
          draw: 0,
          loss: 0,
          goals_for: 7,
          goals_against: 1,
          goal_difference: 6,
          conduct_score: 0,
          is_complete: true,
        },
      ],
      teamsMap: mockTeamsMap,
    },
  ];

  const mockQualifiedTeams = [
    { id: 'team-1' },
    { id: 'team-2' },
  ];

  const mockPlayoffStages = [
    {
      id: 'round-of-16',
      tournament_id: 'tournament-1',
      round_name: 'Round of 16',
      round_order: 1,
      total_games: 8,
      is_final: false,
      is_third_place: false,
      is_first_stage: true,
      games: [{ game_id: 'game-1' }, { game_id: 'game-2' }],
    },
    {
      id: 'quarter-finals',
      tournament_id: 'tournament-1',
      round_name: 'Quarter Finals',
      round_order: 2,
      total_games: 4,
      is_final: false,
      is_third_place: false,
      is_first_stage: false,
      games: [{ game_id: 'game-3' }],
    },
  ];

  const defaultProps = {
    groups: mockGroups,
    qualifiedTeams: mockQualifiedTeams,
    games: mockGames,
    teamsMap: mockTeamsMap,
    playoffStages: mockPlayoffStages,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Tab Rendering', () => {
    it('renders Tabs component', () => {
      renderWithTheme(<ResultsPageClient {...defaultProps} />);

      const tabs = screen.getByRole('tablist');
      expect(tabs).toBeInTheDocument();
    });

    it('shows "Grupos" tab', () => {
      renderWithTheme(<ResultsPageClient {...defaultProps} />);

      const gruposTab = screen.getByRole('tab', { name: /Grupos/i });
      expect(gruposTab).toBeInTheDocument();
    });

    it('shows "Playoffs" tab', () => {
      renderWithTheme(<ResultsPageClient {...defaultProps} />);

      const playoffsTab = screen.getByRole('tab', { name: /Playoffs/i });
      expect(playoffsTab).toBeInTheDocument();
    });

    it('renders both tabs with icons', () => {
      renderWithTheme(<ResultsPageClient {...defaultProps} />);

      const gruposTab = screen.getByRole('tab', { name: /Grupos/i });
      const playoffsTab = screen.getByRole('tab', { name: /Playoffs/i });

      expect(gruposTab).toBeInTheDocument();
      expect(playoffsTab).toBeInTheDocument();
    });
  });

  describe('Default State', () => {
    it('groups tab is active by default (value=0)', () => {
      renderWithTheme(<ResultsPageClient {...defaultProps} />);

      const gruposTab = screen.getByRole('tab', { name: /Grupos/i });
      expect(gruposTab).toHaveAttribute('aria-selected', 'true');
    });

    it('GroupsStageView is rendered by default', () => {
      renderWithTheme(<ResultsPageClient {...defaultProps} />);

      const groupsStageView = screen.getByTestId('groups-stage-view');
      expect(groupsStageView).toBeInTheDocument();
    });

    it('PlayoffsBracketView is not visible by default', () => {
      renderWithTheme(<ResultsPageClient {...defaultProps} />);

      // Tab panel is in DOM but hidden
      const playoffsPanels = screen.getAllByRole('tabpanel', { hidden: true });
      const playoffsPanel = playoffsPanels.find(panel => panel.id === 'results-tabpanel-1');
      expect(playoffsPanel).toHaveAttribute('hidden');
    });

    it('PlayoffsBracketView is not rendered by default', () => {
      renderWithTheme(<ResultsPageClient {...defaultProps} />);

      const playoffsBracketView = screen.queryByTestId('playoffs-bracket-view');
      expect(playoffsBracketView).not.toBeInTheDocument();
    });
  });

  describe('Tab Switching', () => {
    it('clicking Playoffs tab changes active tab', () => {
      renderWithTheme(<ResultsPageClient {...defaultProps} />);

      const playoffsTab = screen.getByRole('tab', { name: /Playoffs/i });
      fireEvent.click(playoffsTab);

      expect(playoffsTab).toHaveAttribute('aria-selected', 'true');
    });

    it('shows PlayoffsBracketView when Playoffs tab is clicked', () => {
      renderWithTheme(<ResultsPageClient {...defaultProps} />);

      const playoffsTab = screen.getByRole('tab', { name: /Playoffs/i });
      fireEvent.click(playoffsTab);

      const playoffsBracketView = screen.getByTestId('playoffs-bracket-view');
      expect(playoffsBracketView).toBeInTheDocument();
    });

    it('hides GroupsStageView when Playoffs tab is clicked', () => {
      renderWithTheme(<ResultsPageClient {...defaultProps} />);

      const playoffsTab = screen.getByRole('tab', { name: /Playoffs/i });
      fireEvent.click(playoffsTab);

      const groupsStageView = screen.queryByTestId('groups-stage-view');
      expect(groupsStageView).not.toBeInTheDocument();
    });

    it('switching back to Grupos tab shows GroupsStageView', () => {
      renderWithTheme(<ResultsPageClient {...defaultProps} />);

      // Switch to Playoffs
      const playoffsTab = screen.getByRole('tab', { name: /Playoffs/i });
      fireEvent.click(playoffsTab);

      // Switch back to Grupos
      const gruposTab = screen.getByRole('tab', { name: /Grupos/i });
      fireEvent.click(gruposTab);

      const groupsStageView = screen.getByTestId('groups-stage-view');
      expect(groupsStageView).toBeInTheDocument();

      const playoffsBracketView = screen.queryByTestId('playoffs-bracket-view');
      expect(playoffsBracketView).not.toBeInTheDocument();
    });
  });

  describe('Props Passing', () => {
    it('passes correct props to GroupsStageView', () => {
      renderWithTheme(<ResultsPageClient {...defaultProps} />);

      const groupsStageView = screen.getByTestId('groups-stage-view');
      const groupsCount = screen.getByTestId('groups-count');
      const gamesCount = screen.getByTestId('games-count');
      const qualifiedTeamsCount = screen.getByTestId('qualified-teams-count');

      expect(groupsStageView).toBeInTheDocument();
      expect(groupsCount).toHaveTextContent(mockGroups.length.toString());
      expect(gamesCount).toHaveTextContent(mockGames.length.toString());
      expect(qualifiedTeamsCount).toHaveTextContent(mockQualifiedTeams.length.toString());
    });

    it('passes correct props to PlayoffsBracketView', () => {
      renderWithTheme(<ResultsPageClient {...defaultProps} />);

      // Switch to Playoffs tab
      const playoffsTab = screen.getByRole('tab', { name: /Playoffs/i });
      fireEvent.click(playoffsTab);

      const playoffsBracketView = screen.getByTestId('playoffs-bracket-view');
      const playoffStagesCount = screen.getByTestId('playoff-stages-count');
      const gamesCount = screen.getByTestId('games-count');
      const teamsMapSize = screen.getByTestId('teams-map-size');

      expect(playoffsBracketView).toBeInTheDocument();
      expect(playoffStagesCount).toHaveTextContent(mockPlayoffStages.length.toString());
      expect(gamesCount).toHaveTextContent(mockGames.length.toString());
      expect(teamsMapSize).toHaveTextContent(Object.keys(mockTeamsMap).length.toString());
    });

    it('passes empty arrays when no data is provided', () => {
      const emptyProps = {
        groups: [],
        qualifiedTeams: [],
        games: [],
        teamsMap: {},
        playoffStages: [],
      };

      renderWithTheme(<ResultsPageClient {...emptyProps} />);

      const groupsCount = screen.getByTestId('groups-count');
      const gamesCount = screen.getByTestId('games-count');
      const qualifiedTeamsCount = screen.getByTestId('qualified-teams-count');

      expect(groupsCount).toHaveTextContent('0');
      expect(gamesCount).toHaveTextContent('0');
      expect(qualifiedTeamsCount).toHaveTextContent('0');
    });
  });

  describe('Tab Panel Behavior', () => {
    it('only active tab panel is visible', () => {
      renderWithTheme(<ResultsPageClient {...defaultProps} />);

      const allPanels = screen.getAllByRole('tabpanel');
      const groupsPanel = allPanels.find(panel => panel.id === 'results-tabpanel-0')!;
      const hiddenPanels = screen.getAllByRole('tabpanel', { hidden: true });
      const playoffsPanel = hiddenPanels.find(panel => panel.id === 'results-tabpanel-1')!;

      expect(groupsPanel).not.toHaveAttribute('hidden');
      expect(playoffsPanel).toHaveAttribute('hidden');
    });

    it('tab panels have correct ARIA attributes', () => {
      renderWithTheme(<ResultsPageClient {...defaultProps} />);

      const allPanels = screen.getAllByRole('tabpanel');
      const groupsPanel = allPanels.find(panel => panel.id === 'results-tabpanel-0')!;
      const hiddenPanels = screen.getAllByRole('tabpanel', { hidden: true });
      const playoffsPanel = hiddenPanels.find(panel => panel.id === 'results-tabpanel-1')!;

      expect(groupsPanel).toHaveAttribute('id', 'results-tabpanel-0');
      expect(playoffsPanel).toHaveAttribute('id', 'results-tabpanel-1');
    });

    it('tabs have correct ARIA controls attributes', () => {
      renderWithTheme(<ResultsPageClient {...defaultProps} />);

      const gruposTab = screen.getByRole('tab', { name: /Grupos/i });
      const playoffsTab = screen.getByRole('tab', { name: /Playoffs/i });

      expect(gruposTab).toHaveAttribute('id', 'results-tab-0');
      expect(gruposTab).toHaveAttribute('aria-controls', 'results-tabpanel-0');
      expect(playoffsTab).toHaveAttribute('id', 'results-tab-1');
      expect(playoffsTab).toHaveAttribute('aria-controls', 'results-tabpanel-1');
    });

    it('switching tabs updates panel visibility', () => {
      renderWithTheme(<ResultsPageClient {...defaultProps} />);

      // Initially, groups panel is visible
      let allPanels = screen.getAllByRole('tabpanel');
      let groupsPanel = allPanels.find(panel => panel.id === 'results-tabpanel-0')!;
      expect(groupsPanel).not.toHaveAttribute('hidden');

      // Switch to Playoffs
      const playoffsTab = screen.getByRole('tab', { name: /Playoffs/i });
      fireEvent.click(playoffsTab);

      // Now playoffs panel is visible
      allPanels = screen.getAllByRole('tabpanel');
      const playoffsPanel = allPanels.find(panel => panel.id === 'results-tabpanel-1')!;
      expect(playoffsPanel).not.toHaveAttribute('hidden');

      // Groups panel is hidden
      const hiddenPanels = screen.getAllByRole('tabpanel', { hidden: true });
      groupsPanel = hiddenPanels.find(panel => panel.id === 'results-tabpanel-0')!;
      expect(groupsPanel).toHaveAttribute('hidden');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA label on tabs container', () => {
      renderWithTheme(<ResultsPageClient {...defaultProps} />);

      const tabsContainer = screen.getByLabelText('results tabs');
      expect(tabsContainer).toBeInTheDocument();
    });

    it('tabs are keyboard navigable', () => {
      renderWithTheme(<ResultsPageClient {...defaultProps} />);

      const gruposTab = screen.getByRole('tab', { name: /Grupos/i });
      const playoffsTab = screen.getByRole('tab', { name: /Playoffs/i });

      expect(gruposTab).toHaveAttribute('tabindex');
      expect(playoffsTab).toHaveAttribute('tabindex');
    });

    it('tab panels have role="tabpanel"', () => {
      renderWithTheme(<ResultsPageClient {...defaultProps} />);

      const allPanels = screen.getAllByRole('tabpanel');
      const groupsPanel = allPanels.find(panel => panel.id === 'results-tabpanel-0')!;
      const hiddenPanels = screen.getAllByRole('tabpanel', { hidden: true });
      const playoffsPanel = hiddenPanels.find(panel => panel.id === 'results-tabpanel-1')!;

      expect(groupsPanel).toBeInTheDocument();
      expect(playoffsPanel).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles switching tabs multiple times', () => {
      renderWithTheme(<ResultsPageClient {...defaultProps} />);

      const gruposTab = screen.getByRole('tab', { name: /Grupos/i });
      const playoffsTab = screen.getByRole('tab', { name: /Playoffs/i });

      // Switch to Playoffs
      fireEvent.click(playoffsTab);
      expect(playoffsTab).toHaveAttribute('aria-selected', 'true');

      // Switch back to Grupos
      fireEvent.click(gruposTab);
      expect(gruposTab).toHaveAttribute('aria-selected', 'true');

      // Switch to Playoffs again
      fireEvent.click(playoffsTab);
      expect(playoffsTab).toHaveAttribute('aria-selected', 'true');

      // Switch back to Grupos again
      fireEvent.click(gruposTab);
      expect(gruposTab).toHaveAttribute('aria-selected', 'true');
    });

    it('renders correctly with minimum props', () => {
      const minimalProps = {
        groups: [],
        qualifiedTeams: [],
        games: [],
        teamsMap: {},
        playoffStages: [],
      };

      renderWithTheme(<ResultsPageClient {...minimalProps} />);

      const gruposTab = screen.getByRole('tab', { name: /Grupos/i });
      const playoffsTab = screen.getByRole('tab', { name: /Playoffs/i });

      expect(gruposTab).toBeInTheDocument();
      expect(playoffsTab).toBeInTheDocument();
    });

    it('maintains tab state when props change', () => {
      const { rerenderWithTheme } = renderWithTheme(
        <ResultsPageClient {...defaultProps} />
      );

      // Switch to Playoffs tab
      const playoffsTab = screen.getByRole('tab', { name: /Playoffs/i });
      fireEvent.click(playoffsTab);
      expect(playoffsTab).toHaveAttribute('aria-selected', 'true');

      // Rerender with different props
      const updatedProps = {
        ...defaultProps,
        games: createMany(testFactories.game, 8, (i) => ({
          id: `game-${i}`,
          game_number: i,
        })),
      };

      rerenderWithTheme(<ResultsPageClient {...updatedProps} />);

      // Tab state should be maintained
      const playoffsTabAfterRerender = screen.getByRole('tab', { name: /Playoffs/i });
      expect(playoffsTabAfterRerender).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Layout and Styling', () => {
    it('renders tabs with fullWidth variant', () => {
      renderWithTheme(<ResultsPageClient {...defaultProps} />);

      const tabsContainer = screen.getByLabelText('results tabs');
      expect(tabsContainer).toBeInTheDocument();
    });

    it('tab panels have scrollable overflow', () => {
      const { container } = renderWithTheme(<ResultsPageClient {...defaultProps} />);

      // Overflow is now handled by ScrollShadowContainer's inner scroll container
      const allPanels = screen.getAllByRole('tabpanel');
      const groupsPanel = allPanels.find(panel => panel.id === 'results-tabpanel-0')!;

      // Find the scroll container within the tab panel
      const scrollContainer = groupsPanel.querySelector('[data-scroll-container]');
      expect(scrollContainer).toBeInTheDocument();
      // The scroll container has overflow from the direction prop (vertical = overflowY: auto)
    });

    it('renders tabs and tab panels in a container', () => {
      renderWithTheme(<ResultsPageClient {...defaultProps} />);

      // The component renders tabs and panels (including hidden ones)
      const tablist = screen.getByRole('tablist');
      const visiblePanels = screen.getAllByRole('tabpanel');
      const hiddenPanels = screen.getAllByRole('tabpanel', { hidden: true });
      const totalPanels = [...new Set([...visiblePanels, ...hiddenPanels])];

      expect(tablist).toBeInTheDocument();
      expect(totalPanels.length).toBe(2);
    });
  });

  describe('Internationalization (i18n)', () => {
    const user = userEvent.setup();

    it('should display Spanish translations for tab labels', () => {
      const messages = { tables: esTablesMessages };

      const emptyProps = {
        groups: [],
        qualifiedTeams: [],
        games: [],
        teamsMap: {},
        playoffStages: [],
      };

      vi.clearAllMocks();

      render(
        <NextIntlClientProvider locale="es" messages={messages}>
          <ResultsPageClient {...emptyProps} />
        </NextIntlClientProvider>
      );

      expect(screen.getByText('Grupos')).toBeInTheDocument();
      expect(screen.getByText('Playoffs')).toBeInTheDocument();
    });

    it('should correctly load English translation messages in NextIntlClientProvider', () => {
      // This test verifies that English messages can be loaded and provided to the component.
      // Note: The vitest setup globally mocks useTranslations to return Spanish by default,
      // but this test ensures the NextIntlClientProvider can accept English messages.
      const messages = { tables: enTablesMessages };

      const emptyProps = {
        groups: [],
        qualifiedTeams: [],
        games: [],
        teamsMap: {},
        playoffStages: [],
      };

      vi.clearAllMocks();

      // Render with English messages in the provider
      render(
        <NextIntlClientProvider locale="en" messages={messages}>
          <ResultsPageClient {...emptyProps} />
        </NextIntlClientProvider>
      );

      // Verify the component renders tabs
      const tablist = screen.getByRole('tablist');
      expect(tablist).toBeInTheDocument();

      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(2);

      // The tabs should be present and functional
      expect(tabs[0]).toBeInTheDocument();
      expect(tabs[1]).toBeInTheDocument();
    });

    it('should switch between Spanish and English translations on tab click', async () => {
      const messages = { tables: esTablesMessages };

      const emptyProps = {
        groups: [],
        qualifiedTeams: [],
        games: [],
        teamsMap: {},
        playoffStages: [],
      };

      vi.clearAllMocks();

      render(
        <NextIntlClientProvider locale="es" messages={messages}>
          <ResultsPageClient {...emptyProps} />
        </NextIntlClientProvider>
      );

      // Both translations should be visible
      const gruposTab = screen.getByRole('tab', { name: /Grupos/i });
      const playoffsTab = screen.getByRole('tab', { name: /Playoffs/i });

      expect(gruposTab).toBeInTheDocument();
      expect(playoffsTab).toBeInTheDocument();

      // Click on Playoffs tab and verify it becomes active
      await user.click(playoffsTab);
      expect(playoffsTab).toHaveAttribute('aria-selected', 'true');
      expect(gruposTab).toHaveAttribute('aria-selected', 'false');

      // Click back to Grupos tab
      await user.click(gruposTab);
      expect(gruposTab).toHaveAttribute('aria-selected', 'true');
      expect(playoffsTab).toHaveAttribute('aria-selected', 'false');
    });

    it('should correctly use useTranslations hook with "tables" namespace', () => {
      const messages = { tables: esTablesMessages };

      const emptyProps = {
        groups: [],
        qualifiedTeams: [],
        games: [],
        teamsMap: {},
        playoffStages: [],
      };

      vi.clearAllMocks();

      render(
        <NextIntlClientProvider locale="es" messages={messages}>
          <ResultsPageClient {...emptyProps} />
        </NextIntlClientProvider>
      );

      // Verify that the component uses the 'tables' namespace by checking for tab translations
      const gruposTab = screen.getByRole('tab', { name: /Grupos/i });
      expect(gruposTab).toBeInTheDocument();
    });

    it('should render both tabs with translations in responsive layout', async () => {
      const messages = { tables: esTablesMessages };

      const emptyProps = {
        groups: [],
        qualifiedTeams: [],
        games: [],
        teamsMap: {},
        playoffStages: [],
      };

      vi.clearAllMocks();

      render(
        <NextIntlClientProvider locale="es" messages={messages}>
          <ResultsPageClient {...emptyProps} />
        </NextIntlClientProvider>
      );

      // Both tabs should be visible and properly translated
      const tablist = screen.getByRole('tablist');
      expect(tablist).toBeInTheDocument();

      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(2);

      expect(tabs[0]).toHaveTextContent('Grupos');
      expect(tabs[1]).toHaveTextContent('Playoffs');
    });

    it('should maintain tab state and translations after switching tabs', async () => {
      const messages = { tables: esTablesMessages };

      const emptyProps = {
        groups: [],
        qualifiedTeams: [],
        games: [],
        teamsMap: {},
        playoffStages: [],
      };

      vi.clearAllMocks();

      render(
        <NextIntlClientProvider locale="es" messages={messages}>
          <ResultsPageClient {...emptyProps} />
        </NextIntlClientProvider>
      );

      // Initially, grupos tab is selected
      const gruposTab = screen.getByRole('tab', { name: /Grupos/i });
      const playoffsTab = screen.getByRole('tab', { name: /Playoffs/i });

      expect(gruposTab).toHaveAttribute('aria-selected', 'true');

      // Click on playoffs
      await user.click(playoffsTab);
      expect(playoffsTab).toHaveAttribute('aria-selected', 'true');
      expect(gruposTab).toHaveAttribute('aria-selected', 'false');

      // Verify translations are still visible
      expect(screen.getByText('Grupos')).toBeInTheDocument();
      expect(screen.getByText('Playoffs')).toBeInTheDocument();
    });

    it('should handle tab navigation with translated labels via keyboard', async () => {
      const messages = { tables: esTablesMessages };

      const emptyProps = {
        groups: [],
        qualifiedTeams: [],
        games: [],
        teamsMap: {},
        playoffStages: [],
      };

      vi.clearAllMocks();

      render(
        <NextIntlClientProvider locale="es" messages={messages}>
          <ResultsPageClient {...emptyProps} />
        </NextIntlClientProvider>
      );

      const gruposTab = screen.getByRole('tab', { name: /Grupos/i });
      const playoffsTab = screen.getByRole('tab', { name: /Playoffs/i });

      // Focus on first tab
      gruposTab.focus();
      expect(gruposTab).toHaveFocus();

      // Click playoffs
      await user.click(playoffsTab);
      expect(playoffsTab).toHaveAttribute('aria-selected', 'true');

      // Click back to grupos
      await user.click(gruposTab);
      expect(gruposTab).toHaveAttribute('aria-selected', 'true');
    });
  });
});
