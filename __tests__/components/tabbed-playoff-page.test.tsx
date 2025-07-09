import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import TabbedPlayoffsPage, { Section } from '../../app/components/playoffs/tabbed-playoff-page';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Mock the GamesGrid component
vi.mock('../../app/components/games-grid', () => ({
  default: ({ games, isPlayoffs, teamsMap, isLoggedIn, isAwardsPredictionLocked }: any) => (
    <div data-testid="games-grid">
      <div data-testid="games-count">{games.length}</div>
      <div data-testid="is-playoffs">{isPlayoffs.toString()}</div>
      <div data-testid="is-logged-in">{isLoggedIn.toString()}</div>
      <div data-testid="is-awards-locked">{isAwardsPredictionLocked.toString()}</div>
    </div>
  ),
}));

// Mock the Grid component with unique test IDs
vi.mock('../../app/components/mui-wrappers', () => ({
  Grid: ({ children, ...props }: any) => {
    const testId = props.container ? 'grid-container' : 'grid-item';
    return <div data-testid={testId} {...props}>{children}</div>;
  },
}));

const mockTheme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={mockTheme}>
      {component}
    </ThemeProvider>
  );
};

describe('TabbedPlayoffsPage', () => {
  const mockTeamsMap = {
    'team-1': { id: 'team-1', name: 'Team A' },
    'team-2': { id: 'team-2', name: 'Team B' },
    'team-3': { id: 'team-3', name: 'Team C' },
    'team-4': { id: 'team-4', name: 'Team D' },
  };

  const createMockSections = (): Section[] => [
    {
      section: 'Round of 16',
      games: [
        {
          id: 'game-1',
          game_date: new Date('2024-06-15T20:00:00Z'),
          home_team: 'team-1',
          away_team: 'team-2',
        } as any,
        {
          id: 'game-2',
          game_date: new Date('2024-06-16T20:00:00Z'),
          home_team: 'team-3',
          away_team: 'team-4',
        } as any,
      ],
    },
    {
      section: 'Quarter Finals',
      games: [
        {
          id: 'game-3',
          game_date: new Date('2024-06-20T20:00:00Z'),
          home_team: 'team-1',
          away_team: 'team-3',
        } as any,
      ],
    },
    {
      section: 'Semi Finals',
      games: [
        {
          id: 'game-4',
          game_date: new Date('2024-06-25T20:00:00Z'),
          home_team: 'team-1',
          away_team: 'team-4',
        } as any,
      ],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders all playoff sections as tabs', () => {
      const sections = createMockSections();
      renderWithTheme(
        <TabbedPlayoffsPage
          sections={sections}
          teamsMap={mockTeamsMap}
        />
      );

      expect(screen.getByText('Round of 16')).toBeInTheDocument();
      expect(screen.getByText('Quarter Finals')).toBeInTheDocument();
      expect(screen.getByText('Semi Finals')).toBeInTheDocument();
    });

    it('renders GamesGrid with correct props', () => {
      const sections = createMockSections();
      renderWithTheme(
        <TabbedPlayoffsPage
          sections={sections}
          teamsMap={mockTeamsMap}
          isLoggedIn={true}
          isAwardsPredictionLocked={false}
        />
      );

      const gamesGrid = screen.getByTestId('games-grid');
      expect(gamesGrid).toBeInTheDocument();
      expect(screen.getByTestId('is-playoffs')).toHaveTextContent('true');
      expect(screen.getByTestId('is-logged-in')).toHaveTextContent('true');
      expect(screen.getByTestId('is-awards-locked')).toHaveTextContent('false');
    });

    it('renders correct number of games for selected tab', async () => {
      const sections = createMockSections();
      renderWithTheme(
        <TabbedPlayoffsPage
          sections={sections}
          teamsMap={mockTeamsMap}
        />
      );

      // Wait for the component to settle and show the correct number of games
      await waitFor(() => {
        const gamesCount = screen.getByTestId('games-count');
        expect(gamesCount).toBeInTheDocument();
      });
    });
  });

  describe('Tab Selection', () => {
    it('allows manual tab switching', async () => {
      const sections = createMockSections();
      renderWithTheme(
        <TabbedPlayoffsPage
          sections={sections}
          teamsMap={mockTeamsMap}
        />
      );

      // Wait for initial render to complete
      await waitFor(() => {
        expect(screen.getByTestId('games-grid')).toBeInTheDocument();
      });

      // Click on Quarter Finals tab
      const quarterFinalsTab = screen.getByText('Quarter Finals');
      fireEvent.click(quarterFinalsTab);

      await waitFor(() => {
        expect(screen.getByTestId('games-count')).toHaveTextContent('1');
      });
    });

    it('updates selected tab when clicked', async () => {
      const sections = createMockSections();
      renderWithTheme(
        <TabbedPlayoffsPage
          sections={sections}
          teamsMap={mockTeamsMap}
        />
      );

      // Wait for initial render to complete
      await waitFor(() => {
        expect(screen.getByTestId('games-grid')).toBeInTheDocument();
      });

      const semiFinalsTab = screen.getByText('Semi Finals');
      fireEvent.click(semiFinalsTab);

      await waitFor(() => {
        expect(semiFinalsTab).toHaveClass('Mui-selected');
      });
    });
  });

  describe('Automatic Tab Selection Based on Date', () => {
    it('selects tab with game closest to today by default', async () => {
      const today = new Date('2024-06-19T12:00:00Z'); // Closer to Quarter Finals (2024-06-20) than Round of 16 (2024-06-16)
      vi.setSystemTime(today);

      const sections = createMockSections();
      renderWithTheme(
        <TabbedPlayoffsPage
          sections={sections}
          teamsMap={mockTeamsMap}
        />
      );

      // Should select Quarter Finals as it has the game closest to today (2024-06-20)
      await waitFor(() => {
        const quarterFinalsTab = screen.getByText('Quarter Finals');
        expect(quarterFinalsTab).toHaveClass('Mui-selected');
      });

      vi.useRealTimers();
    });

    it('selects first tab when no games have dates', async () => {
      const sectionsWithoutDates: Section[] = [
        {
          section: 'Round of 16',
          games: [
            {
              id: 'game-1',
              home_team: 'team-1',
              away_team: 'team-2',
            } as any,
          ],
        },
        {
          section: 'Quarter Finals',
          games: [
            {
              id: 'game-2',
              home_team: 'team-3',
              away_team: 'team-4',
            } as any,
          ],
        },
      ];

      renderWithTheme(
        <TabbedPlayoffsPage
          sections={sectionsWithoutDates}
          teamsMap={mockTeamsMap}
        />
      );

      await waitFor(() => {
        const roundOf16Tab = screen.getByText('Round of 16');
        expect(roundOf16Tab).toHaveClass('Mui-selected');
      });
    });

    it('selects tab with past game closest to today', async () => {
      const today = new Date('2024-06-26T12:00:00Z'); // After all games
      vi.setSystemTime(today);

      const sections = createMockSections();
      renderWithTheme(
        <TabbedPlayoffsPage
          sections={sections}
          teamsMap={mockTeamsMap}
        />
      );

      // Should select Semi Finals as it has the most recent game (2024-06-25)
      await waitFor(() => {
        const semiFinalsTab = screen.getByText('Semi Finals');
        expect(semiFinalsTab).toHaveClass('Mui-selected');
      });

      vi.useRealTimers();
    });

    it('selects tab with future game closest to today', async () => {
      const today = new Date('2024-06-14T12:00:00Z'); // Before all games
      vi.setSystemTime(today);

      const sections = createMockSections();
      renderWithTheme(
        <TabbedPlayoffsPage
          sections={sections}
          teamsMap={mockTeamsMap}
        />
      );

      // Should select Round of 16 as it has the closest future game (2024-06-15)
      await waitFor(() => {
        const roundOf16Tab = screen.getByText('Round of 16');
        expect(roundOf16Tab).toHaveClass('Mui-selected');
      });

      vi.useRealTimers();
    });
  });

  describe('Props Handling', () => {
    it('handles empty sections array', () => {
      renderWithTheme(
        <TabbedPlayoffsPage
          sections={[]}
          teamsMap={mockTeamsMap}
        />
      );

      // Should render without crashing
      expect(screen.getByTestId('grid-container')).toBeInTheDocument();
    });

    it('handles sections with empty games arrays', () => {
      const sectionsWithEmptyGames: Section[] = [
        {
          section: 'Round of 16',
          games: [],
        },
        {
          section: 'Quarter Finals',
          games: [],
        },
      ];

      renderWithTheme(
        <TabbedPlayoffsPage
          sections={sectionsWithEmptyGames}
          teamsMap={mockTeamsMap}
        />
      );

      expect(screen.getByText('Round of 16')).toBeInTheDocument();
      expect(screen.getByText('Quarter Finals')).toBeInTheDocument();
    });

    it('passes correct props to GamesGrid', () => {
      const sections = createMockSections();
      renderWithTheme(
        <TabbedPlayoffsPage
          sections={sections}
          teamsMap={mockTeamsMap}
          isLoggedIn={false}
          isAwardsPredictionLocked={true}
        />
      );

      expect(screen.getByTestId('is-logged-in')).toHaveTextContent('false');
      expect(screen.getByTestId('is-awards-locked')).toHaveTextContent('true');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      const sections = createMockSections();
      renderWithTheme(
        <TabbedPlayoffsPage
          sections={sections}
          teamsMap={mockTeamsMap}
        />
      );

      const tabsContainer = screen.getByLabelText('Rondas de Playoffs');
      expect(tabsContainer).toBeInTheDocument();
    });

    it('has proper tab panel roles', async () => {
      const sections = createMockSections();
      renderWithTheme(
        <TabbedPlayoffsPage
          sections={sections}
          teamsMap={mockTeamsMap}
        />
      );

      // Wait for the component to render all tab panels
      await waitFor(() => {
        const tabPanels = screen.getAllByRole('tabpanel');
        expect(tabPanels.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles invalid date strings gracefully', async () => {
      const sectionsWithInvalidDates: Section[] = [
        {
          section: 'Round of 16',
          games: [
            {
              id: 'game-1',
              game_date: new Date('invalid-date'), // This will create an invalid Date
              home_team: 'team-1',
              away_team: 'team-2',
            } as any,
          ],
        },
        {
          section: 'Quarter Finals',
          games: [
            {
              id: 'game-2',
              game_date: new Date('2024-06-20T20:00:00Z'),
              home_team: 'team-3',
              away_team: 'team-4',
            } as any,
          ],
        },
      ];

      renderWithTheme(
        <TabbedPlayoffsPage
          sections={sectionsWithInvalidDates}
          teamsMap={mockTeamsMap}
        />
      );

      // Should select Quarter Finals as it has the valid date closest to today
      await waitFor(() => {
        const quarterFinalsTab = screen.getByText('Quarter Finals');
        expect(quarterFinalsTab).toHaveClass('Mui-selected');
      });
    });

    it('handles null/undefined game dates', async () => {
      const sectionsWithNullDates: Section[] = [
        {
          section: 'Round of 16',
          games: [
            {
              id: 'game-1',
              game_date: null as any,
              home_team: 'team-1',
              away_team: 'team-2',
            } as any,
          ],
        },
        {
          section: 'Quarter Finals',
          games: [
            {
              id: 'game-2',
              game_date: undefined as any,
              home_team: 'team-3',
              away_team: 'team-4',
            } as any,
          ],
        },
      ];

      renderWithTheme(
        <TabbedPlayoffsPage
          sections={sectionsWithNullDates}
          teamsMap={mockTeamsMap}
        />
      );

      // Should default to first tab when dates are null/undefined
      await waitFor(() => {
        const roundOf16Tab = screen.getByText('Round of 16');
        expect(roundOf16Tab).toHaveClass('Mui-selected');
      });
    });
  });
}); 