import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithTheme, renderWithProviders } from '../../utils/test-utils';
import { testFactories } from '../../db/test-factories';
import GroupResultCard from '../../../app/components/results-page/group-result-card';
import type { ExtendedGameData } from '../../../app/definitions';
import type { TeamStats } from '../../../app/db/tables-definition';

// Mock child components
vi.mock('../../../app/components/results-page/minimalistic-games-list', () => ({
  default: ({ games, teamsMap }: { games: ExtendedGameData[]; teamsMap: Record<string, unknown> }) => (
    <div data-testid="minimalistic-games-list">
      <span>Games: {games.length}</span>
      <span>Teams in map: {Object.keys(teamsMap).length}</span>
    </div>
  ),
}));

vi.mock('../../../app/components/groups-page/team-standings-cards', () => ({
  default: ({
    teamStats,
    teamsMap,
    qualifiedTeams,
    compact,
  }: {
    teamStats: TeamStats[];
    teamsMap: Record<string, unknown>;
    qualifiedTeams: ReadonlyArray<{ readonly id: string }>;
    compact: boolean;
  }) => (
    <div data-testid="team-standings-cards">
      <span>Team stats: {teamStats.length}</span>
      <span>Teams in map: {Object.keys(teamsMap).length}</span>
      <span>Qualified teams: {qualifiedTeams.length}</span>
      <span>Compact: {compact ? 'yes' : 'no'}</span>
    </div>
  ),
}));

// Mock MUI useMediaQuery
const mockUseMediaQuery = vi.fn();
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    useMediaQuery: () => mockUseMediaQuery(),
  };
});

describe('GroupResultCard', () => {
  // Test data setup
  const team1 = testFactories.team({ id: 'team-1', name: 'Argentina', short_name: 'ARG' });
  const team2 = testFactories.team({ id: 'team-2', name: 'Brazil', short_name: 'BRA' });
  const team3 = testFactories.team({ id: 'team-3', name: 'Chile', short_name: 'CHI' });
  const team4 = testFactories.team({ id: 'team-4', name: 'Colombia', short_name: 'COL' });

  const teamsMap = {
    [team1.id]: team1,
    [team2.id]: team2,
    [team3.id]: team3,
    [team4.id]: team4,
  };

  const teamStats: TeamStats[] = [
    {
      id: 'stats-1',
      tournament_group_id: 'group-a',
      team_id: team1.id,
      position: 0,
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
    {
      id: 'stats-2',
      tournament_group_id: 'group-a',
      team_id: team2.id,
      position: 1,
      games_played: 3,
      points: 6,
      win: 2,
      draw: 0,
      loss: 1,
      goals_for: 5,
      goals_against: 3,
      goal_difference: 2,
      conduct_score: 0,
      is_complete: true,
    },
    {
      id: 'stats-3',
      tournament_group_id: 'group-a',
      team_id: team3.id,
      position: 2,
      games_played: 3,
      points: 3,
      win: 1,
      draw: 0,
      loss: 2,
      goals_for: 3,
      goals_against: 5,
      goal_difference: -2,
      conduct_score: 0,
      is_complete: true,
    },
    {
      id: 'stats-4',
      tournament_group_id: 'group-a',
      team_id: team4.id,
      position: 3,
      games_played: 3,
      points: 0,
      win: 0,
      draw: 0,
      loss: 3,
      goals_for: 1,
      goals_against: 7,
      goal_difference: -6,
      conduct_score: 0,
      is_complete: true,
    },
  ];

  const games: ExtendedGameData[] = [
    {
      id: 'game-1',
      tournament_id: 'tournament-1',
      game_number: 1,
      home_team: team1.id,
      away_team: team2.id,
      game_date: new Date('2024-06-14T18:00:00Z'),
      location: 'Stadium A',
      game_type: 'group',
      game_local_timezone: 'America/New_York',
      home_team_rule: undefined,
      away_team_rule: undefined,
      result: {
        game_id: 'game-1',
        home_score: 2,
        away_score: 1,
        home_penalty_score: undefined,
        away_penalty_score: undefined,
        is_draft: false,
      },
      guess: undefined,
    },
    {
      id: 'game-2',
      tournament_id: 'tournament-1',
      game_number: 2,
      home_team: team3.id,
      away_team: team4.id,
      game_date: new Date('2024-06-14T21:00:00Z'),
      location: 'Stadium B',
      game_type: 'group',
      game_local_timezone: 'America/New_York',
      home_team_rule: undefined,
      away_team_rule: undefined,
      result: {
        game_id: 'game-2',
        home_score: 1,
        away_score: 0,
        home_penalty_score: undefined,
        away_penalty_score: undefined,
        is_draft: false,
      },
      guess: undefined,
    },
    {
      id: 'game-3',
      tournament_id: 'tournament-1',
      game_number: 3,
      home_team: team1.id,
      away_team: team3.id,
      game_date: new Date('2024-06-18T18:00:00Z'),
      location: 'Stadium A',
      game_type: 'group',
      game_local_timezone: 'America/New_York',
      home_team_rule: undefined,
      away_team_rule: undefined,
      result: {
        game_id: 'game-3',
        home_score: 3,
        away_score: 0,
        home_penalty_score: undefined,
        away_penalty_score: undefined,
        is_draft: false,
      },
      guess: undefined,
    },
  ];

  const qualifiedTeams = [{ id: team1.id }, { id: team2.id }];

  const group = {
    id: 'group-a',
    letter: 'A',
    teamStats,
    teamsMap,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic rendering', () => {
    it('renders group letter in header', () => {
      mockUseMediaQuery.mockReturnValue(false);

      renderWithTheme(
        <GroupResultCard group={group} games={games} qualifiedTeams={qualifiedTeams} />
      );

      expect(screen.getByText('GRUPO A')).toBeInTheDocument();
    });

    it('renders group letter in uppercase', () => {
      mockUseMediaQuery.mockReturnValue(false);

      const lowercaseGroup = { ...group, letter: 'b' };
      renderWithTheme(
        <GroupResultCard group={lowercaseGroup} games={games} qualifiedTeams={qualifiedTeams} />
      );

      expect(screen.getByText('GRUPO B')).toBeInTheDocument();
    });

    it('renders MinimalisticGamesList component', () => {
      mockUseMediaQuery.mockReturnValue(false);

      renderWithTheme(
        <GroupResultCard group={group} games={games} qualifiedTeams={qualifiedTeams} />
      );

      const gamesList = screen.getByTestId('minimalistic-games-list');
      expect(gamesList).toBeInTheDocument();
      expect(gamesList).toHaveTextContent('Games: 3');
      expect(gamesList).toHaveTextContent('Teams in map: 4');
    });

    it('renders TeamStandingsCards component', () => {
      mockUseMediaQuery.mockReturnValue(false);

      renderWithTheme(
        <GroupResultCard group={group} games={games} qualifiedTeams={qualifiedTeams} />
      );

      const standingsCards = screen.getByTestId('team-standings-cards');
      expect(standingsCards).toBeInTheDocument();
      expect(standingsCards).toHaveTextContent('Team stats: 4');
      expect(standingsCards).toHaveTextContent('Teams in map: 4');
      expect(standingsCards).toHaveTextContent('Qualified teams: 2');
      expect(standingsCards).toHaveTextContent('Compact: yes');
    });

    it('passes correct props to child components', () => {
      mockUseMediaQuery.mockReturnValue(false);

      renderWithTheme(
        <GroupResultCard group={group} games={games} qualifiedTeams={qualifiedTeams} />
      );

      // MinimalisticGamesList receives games and teamsMap
      const gamesList = screen.getByTestId('minimalistic-games-list');
      expect(gamesList).toHaveTextContent('Games: 3');
      expect(gamesList).toHaveTextContent('Teams in map: 4');

      // TeamStandingsCards receives teamStats, teamsMap, qualifiedTeams, and compact=true
      const standingsCards = screen.getByTestId('team-standings-cards');
      expect(standingsCards).toHaveTextContent('Team stats: 4');
      expect(standingsCards).toHaveTextContent('Teams in map: 4');
      expect(standingsCards).toHaveTextContent('Qualified teams: 2');
      expect(standingsCards).toHaveTextContent('Compact: yes');
    });
  });

  describe('Mobile behavior (useMediaQuery returns true)', () => {
    it('card is collapsible on mobile', () => {
      mockUseMediaQuery.mockReturnValue(true);

      renderWithTheme(
        <GroupResultCard group={group} games={games} qualifiedTeams={qualifiedTeams} />
      );

      // Collapse component should be present (rendered by MUI)
      // Content is initially visible (expanded=true by default)
      expect(screen.getByTestId('minimalistic-games-list')).toBeInTheDocument();
      expect(screen.getByTestId('team-standings-cards')).toBeInTheDocument();
    });

    it('shows expand button in header on mobile', () => {
      mockUseMediaQuery.mockReturnValue(true);

      renderWithTheme(
        <GroupResultCard group={group} games={games} qualifiedTeams={qualifiedTeams} />
      );

      const expandButton = screen.getByLabelText('mostrar más');
      expect(expandButton).toBeInTheDocument();
    });

    it('default state is expanded on mobile', () => {
      mockUseMediaQuery.mockReturnValue(true);

      renderWithTheme(
        <GroupResultCard group={group} games={games} qualifiedTeams={qualifiedTeams} />
      );

      // Content should be visible by default
      expect(screen.getByTestId('minimalistic-games-list')).toBeInTheDocument();
      expect(screen.getByTestId('team-standings-cards')).toBeInTheDocument();

      // Expand button should show aria-expanded=true
      const expandButton = screen.getByLabelText('mostrar más');
      expect(expandButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('clicking expand button toggles collapse state on mobile', async () => {
      mockUseMediaQuery.mockReturnValue(true);

      renderWithTheme(
        <GroupResultCard group={group} games={games} qualifiedTeams={qualifiedTeams} />
      );

      const user = userEvent.setup();
      const expandButton = screen.getByLabelText('mostrar más');

      // Initially expanded
      expect(expandButton).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByTestId('minimalistic-games-list')).toBeInTheDocument();

      // Click to collapse
      await user.click(expandButton);

      // After collapse, content should be removed (unmountOnExit)
      expect(expandButton).toHaveAttribute('aria-expanded', 'false');
      // Note: Content may still be in document briefly due to transition
      // We check the aria-expanded attribute as the source of truth

      // Click to expand again
      await user.click(expandButton);

      // Should be expanded again
      expect(expandButton).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Desktop behavior (useMediaQuery returns false)', () => {
    it('card is always expanded on desktop', () => {
      mockUseMediaQuery.mockReturnValue(false);

      renderWithTheme(
        <GroupResultCard group={group} games={games} qualifiedTeams={qualifiedTeams} />
      );

      // Content is always visible
      expect(screen.getByTestId('minimalistic-games-list')).toBeInTheDocument();
      expect(screen.getByTestId('team-standings-cards')).toBeInTheDocument();
    });

    it('no expand button shown in header on desktop', () => {
      mockUseMediaQuery.mockReturnValue(false);

      renderWithTheme(
        <GroupResultCard group={group} games={games} qualifiedTeams={qualifiedTeams} />
      );

      // Expand button should not be present
      expect(screen.queryByLabelText('mostrar más')).not.toBeInTheDocument();
    });
  });

  describe('Content sections', () => {
    it('shows "Partidos:" label for games section', () => {
      mockUseMediaQuery.mockReturnValue(false);

      renderWithTheme(
        <GroupResultCard group={group} games={games} qualifiedTeams={qualifiedTeams} />
      );

      expect(screen.getByText('Partidos:')).toBeInTheDocument();
    });

    it('shows "Tabla de Posiciones:" label for standings section', () => {
      mockUseMediaQuery.mockReturnValue(false);

      renderWithTheme(
        <GroupResultCard group={group} games={games} qualifiedTeams={qualifiedTeams} />
      );

      expect(screen.getByText('Tabla de Posiciones:')).toBeInTheDocument();
    });

    it('games section appears before standings section', () => {
      mockUseMediaQuery.mockReturnValue(false);

      renderWithTheme(
        <GroupResultCard group={group} games={games} qualifiedTeams={qualifiedTeams} />
      );

      const partidosLabel = screen.getByText('Partidos:');
      const tablaLabel = screen.getByText('Tabla de Posiciones:');
      const gamesList = screen.getByTestId('minimalistic-games-list');
      const standingsCards = screen.getByTestId('team-standings-cards');

      // Check DOM order
      const allElements = [partidosLabel, gamesList, tablaLabel, standingsCards];
      const sortedElements = allElements.slice().sort((a, b) => {
        const position = a.compareDocumentPosition(b);
        return position & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
      });

      expect(sortedElements).toEqual(allElements);
    });
  });

  describe('Edge cases', () => {
    it('handles empty games array', () => {
      mockUseMediaQuery.mockReturnValue(false);

      renderWithTheme(
        <GroupResultCard group={group} games={[]} qualifiedTeams={qualifiedTeams} />
      );

      const gamesList = screen.getByTestId('minimalistic-games-list');
      expect(gamesList).toHaveTextContent('Games: 0');
    });

    it('handles empty teamStats array', () => {
      mockUseMediaQuery.mockReturnValue(false);

      const emptyGroup = { ...group, teamStats: [] };
      renderWithTheme(
        <GroupResultCard group={emptyGroup} games={games} qualifiedTeams={qualifiedTeams} />
      );

      const standingsCards = screen.getByTestId('team-standings-cards');
      expect(standingsCards).toHaveTextContent('Team stats: 0');
    });

    it('handles empty qualifiedTeams array', () => {
      mockUseMediaQuery.mockReturnValue(false);

      renderWithTheme(
        <GroupResultCard group={group} games={games} qualifiedTeams={[]} />
      );

      const standingsCards = screen.getByTestId('team-standings-cards');
      expect(standingsCards).toHaveTextContent('Qualified teams: 0');
    });

    it('handles different group letters', () => {
      mockUseMediaQuery.mockReturnValue(false);

      const groupH = { ...group, letter: 'H' };
      renderWithTheme(
        <GroupResultCard group={groupH} games={games} qualifiedTeams={qualifiedTeams} />
      );

      expect(screen.getByText('GRUPO H')).toBeInTheDocument();
    });
  });

  describe('Responsive behavior transitions', () => {
    it('switches from desktop to mobile behavior when screen size changes', () => {
      mockUseMediaQuery.mockReturnValue(false);

      const { rerenderWithTheme } = renderWithTheme(
        <GroupResultCard group={group} games={games} qualifiedTeams={qualifiedTeams} />
      );

      // Desktop: no expand button
      expect(screen.queryByLabelText('mostrar más')).not.toBeInTheDocument();

      // Switch to mobile
      mockUseMediaQuery.mockReturnValue(true);
      rerenderWithTheme(
        <GroupResultCard group={group} games={games} qualifiedTeams={qualifiedTeams} />
      );

      // Mobile: expand button appears
      expect(screen.getByLabelText('mostrar más')).toBeInTheDocument();
    });

    it('switches from mobile to desktop behavior when screen size changes', () => {
      mockUseMediaQuery.mockReturnValue(true);

      const { rerenderWithTheme } = renderWithTheme(
        <GroupResultCard group={group} games={games} qualifiedTeams={qualifiedTeams} />
      );

      // Mobile: expand button present
      expect(screen.getByLabelText('mostrar más')).toBeInTheDocument();

      // Switch to desktop
      mockUseMediaQuery.mockReturnValue(false);
      rerenderWithTheme(
        <GroupResultCard group={group} games={games} qualifiedTeams={qualifiedTeams} />
      );

      // Desktop: expand button removed
      expect(screen.queryByLabelText('mostrar más')).not.toBeInTheDocument();
    });
  });

  describe('i18n - Spanish Language (Interpolation)', () => {
    it('should display Spanish group label with letter interpolation (GRUPO A)', () => {
      mockUseMediaQuery.mockReturnValue(false);

      renderWithProviders(
        <GroupResultCard group={group} games={games} qualifiedTeams={qualifiedTeams} />,
        { locale: 'es' }
      );

      // Spanish: "GRUPO {letter}" should become "GRUPO A"
      expect(screen.getByText('GRUPO A')).toBeInTheDocument();
    });

    it('should display Spanish group label with different letters (B, C, H)', () => {
      mockUseMediaQuery.mockReturnValue(false);

      const groupB = { ...group, letter: 'B' };
      const { unmount } = renderWithProviders(
        <GroupResultCard group={groupB} games={games} qualifiedTeams={qualifiedTeams} />,
        { locale: 'es' }
      );

      expect(screen.getByText('GRUPO B')).toBeInTheDocument();
      unmount();

      const groupC = { ...group, letter: 'C' };
      renderWithProviders(
        <GroupResultCard group={groupC} games={games} qualifiedTeams={qualifiedTeams} />,
        { locale: 'es' }
      );

      expect(screen.getByText('GRUPO C')).toBeInTheDocument();
    });

    it('should display Spanish labels for games and standings sections', () => {
      mockUseMediaQuery.mockReturnValue(false);

      renderWithProviders(
        <GroupResultCard group={group} games={games} qualifiedTeams={qualifiedTeams} />,
        { locale: 'es' }
      );

      // Check Spanish labels
      expect(screen.getByText('Partidos:')).toBeInTheDocument();
      expect(screen.getByText('Tabla de Posiciones:')).toBeInTheDocument();
    });

    it('should display correct aria-label for expand button in Spanish', () => {
      mockUseMediaQuery.mockReturnValue(true);

      renderWithProviders(
        <GroupResultCard group={group} games={games} qualifiedTeams={qualifiedTeams} />,
        { locale: 'es' }
      );

      const expandButton = screen.getByLabelText('mostrar más');
      expect(expandButton).toHaveAttribute('aria-label', 'mostrar más');
    });

    it('should handle lowercase group letter and convert to uppercase', () => {
      mockUseMediaQuery.mockReturnValue(false);

      const groupLowercase = { ...group, letter: 'e' };
      renderWithProviders(
        <GroupResultCard group={groupLowercase} games={games} qualifiedTeams={qualifiedTeams} />,
        { locale: 'es' }
      );

      // Component uses .toUpperCase() in the interpolation
      expect(screen.getByText('GRUPO E')).toBeInTheDocument();
    });

    it('should correctly interpolate all group letters A-H', () => {
      mockUseMediaQuery.mockReturnValue(false);

      const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

      for (const letter of letters) {
        const groupWithLetter = { ...group, letter };
        const { unmount } = renderWithProviders(
          <GroupResultCard group={groupWithLetter} games={games} qualifiedTeams={qualifiedTeams} />,
          { locale: 'es' }
        );

        expect(screen.getByText(`GRUPO ${letter}`)).toBeInTheDocument();
        unmount();
      }
    });
  });

  describe('i18n - English Language (Interpolation)', () => {
    it('should display English group label with letter interpolation (EnOf(GRUPO A))', () => {
      mockUseMediaQuery.mockReturnValue(false);

      renderWithProviders(
        <GroupResultCard group={group} games={games} qualifiedTeams={qualifiedTeams} />,
        { locale: 'en' }
      );

      // English: "EnOf(GRUPO {letter})" should become "EnOf(GRUPO A)"
      expect(screen.getByText('EnOf(GRUPO A)')).toBeInTheDocument();
    });

    it('should display English group label with different letters (B, C, H)', () => {
      mockUseMediaQuery.mockReturnValue(false);

      const groupB = { ...group, letter: 'B' };
      const { unmount } = renderWithProviders(
        <GroupResultCard group={groupB} games={games} qualifiedTeams={qualifiedTeams} />,
        { locale: 'en' }
      );

      expect(screen.getByText('EnOf(GRUPO B)')).toBeInTheDocument();
      unmount();

      const groupC = { ...group, letter: 'C' };
      renderWithProviders(
        <GroupResultCard group={groupC} games={games} qualifiedTeams={qualifiedTeams} />,
        { locale: 'en' }
      );

      expect(screen.getByText('EnOf(GRUPO C)')).toBeInTheDocument();
    });

    it('should display English labels for games and standings sections', () => {
      mockUseMediaQuery.mockReturnValue(false);

      renderWithProviders(
        <GroupResultCard group={group} games={games} qualifiedTeams={qualifiedTeams} />,
        { locale: 'en' }
      );

      // Check English labels
      expect(screen.getByText('EnOf(Partidos:)')).toBeInTheDocument();
      expect(screen.getByText('EnOf(Tabla de Posiciones:)')).toBeInTheDocument();
    });

    it('should display correct aria-label for expand button in English', () => {
      mockUseMediaQuery.mockReturnValue(true);

      renderWithProviders(
        <GroupResultCard group={group} games={games} qualifiedTeams={qualifiedTeams} />,
        { locale: 'en' }
      );

      const expandButton = screen.getByLabelText('EnOf(mostrar más)');
      expect(expandButton).toHaveAttribute('aria-label', 'EnOf(mostrar más)');
    });

    it('should handle lowercase group letter and convert to uppercase in English', () => {
      mockUseMediaQuery.mockReturnValue(false);

      const groupLowercase = { ...group, letter: 'f' };
      renderWithProviders(
        <GroupResultCard group={groupLowercase} games={games} qualifiedTeams={qualifiedTeams} />,
        { locale: 'en' }
      );

      // Component uses .toUpperCase() in the interpolation
      expect(screen.getByText('EnOf(GRUPO F)')).toBeInTheDocument();
    });

    it('should correctly interpolate all group letters A-H in English', () => {
      mockUseMediaQuery.mockReturnValue(false);

      const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

      for (const letter of letters) {
        const groupWithLetter = { ...group, letter };
        const { unmount } = renderWithProviders(
          <GroupResultCard group={groupWithLetter} games={games} qualifiedTeams={qualifiedTeams} />,
          { locale: 'en' }
        );

        expect(screen.getByText(`EnOf(GRUPO ${letter})`)).toBeInTheDocument();
        unmount();
      }
    });
  });

  describe('i18n - Locale Switching', () => {
    it('should switch from Spanish to English with correct interpolation', () => {
      mockUseMediaQuery.mockReturnValue(false);

      // Start with Spanish
      const { unmount } = renderWithProviders(
        <GroupResultCard group={group} games={games} qualifiedTeams={qualifiedTeams} />,
        { locale: 'es' }
      );

      expect(screen.getByText('GRUPO A')).toBeInTheDocument();
      expect(screen.getByText('Partidos:')).toBeInTheDocument();
      unmount();

      // Switch to English
      renderWithProviders(
        <GroupResultCard group={group} games={games} qualifiedTeams={qualifiedTeams} />,
        { locale: 'en' }
      );

      expect(screen.getByText('EnOf(GRUPO A)')).toBeInTheDocument();
      expect(screen.getByText('EnOf(Partidos:)')).toBeInTheDocument();
    });

    it('should switch from English to Spanish with correct interpolation', () => {
      mockUseMediaQuery.mockReturnValue(false);

      // Start with English
      const { unmount } = renderWithProviders(
        <GroupResultCard group={group} games={games} qualifiedTeams={qualifiedTeams} />,
        { locale: 'en' }
      );

      expect(screen.getByText('EnOf(GRUPO A)')).toBeInTheDocument();
      expect(screen.getByText('EnOf(Partidos:)')).toBeInTheDocument();
      unmount();

      // Switch to Spanish
      renderWithProviders(
        <GroupResultCard group={group} games={games} qualifiedTeams={qualifiedTeams} />,
        { locale: 'es' }
      );

      expect(screen.getByText('GRUPO A')).toBeInTheDocument();
      expect(screen.getByText('Partidos:')).toBeInTheDocument();
    });
  });

  describe('i18n - Interpolation Edge Cases', () => {
    it('should render with all uppercase letter from the start', () => {
      mockUseMediaQuery.mockReturnValue(false);

      const groupUppercase = { ...group, letter: 'G' };
      renderWithProviders(
        <GroupResultCard group={groupUppercase} games={games} qualifiedTeams={qualifiedTeams} />,
        { locale: 'es' }
      );

      expect(screen.getByText('GRUPO G')).toBeInTheDocument();
    });

    it('should render with all lowercase letter that needs uppercase conversion', () => {
      mockUseMediaQuery.mockReturnValue(false);

      const groupLowercase = { ...group, letter: 'h' };
      renderWithProviders(
        <GroupResultCard group={groupLowercase} games={games} qualifiedTeams={qualifiedTeams} />,
        { locale: 'es' }
      );

      // Component uses .toUpperCase()
      expect(screen.getByText('GRUPO H')).toBeInTheDocument();
    });

    it('should render correct content with empty games array', () => {
      mockUseMediaQuery.mockReturnValue(false);

      renderWithProviders(
        <GroupResultCard group={group} games={[]} qualifiedTeams={qualifiedTeams} />,
        { locale: 'es' }
      );

      // Should still show labels even with empty games
      expect(screen.getByText('GRUPO A')).toBeInTheDocument();
      expect(screen.getByText('Partidos:')).toBeInTheDocument();
      expect(screen.getByText('Tabla de Posiciones:')).toBeInTheDocument();
    });

    it('should render correct content with different qualified teams', () => {
      mockUseMediaQuery.mockReturnValue(false);

      renderWithProviders(
        <GroupResultCard group={group} games={games} qualifiedTeams={[]} />,
        { locale: 'es' }
      );

      // Should still show all content even with empty qualified teams
      expect(screen.getByText('GRUPO A')).toBeInTheDocument();
      expect(screen.getByText('Partidos:')).toBeInTheDocument();
    });
  });
});
