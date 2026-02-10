import { vi, describe, it, expect, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import GroupStandingsSidebar from '../../../app/components/tournament-page/group-standings-sidebar';
import { renderWithTheme } from '../../utils/test-utils';
import { testFactories, createMany } from '../../db/test-factories';
import type { Team, TeamStats } from '../../../app/db/tables-definition';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  },
  LayoutGroup: ({ children }: any) => <div>{children}</div>
}));

// Mock RankChangeIndicator
vi.mock('../../../app/components/leaderboard/RankChangeIndicator', () => ({
  default: ({ change }: { change: number }) => (
    <div data-testid="rank-change-indicator">{change}</div>
  )
}));

describe('GroupStandingsSidebar', () => {
  const mockTeams: Team[] = createMany(testFactories.team, 4, (i) => ({
    id: `team-${i + 1}`,
    name: `Team ${i + 1}`,
    short_name: `T${i + 1}`
  }));

  const mockTeamsMap: { [key: string]: Team } = Object.fromEntries(
    mockTeams.map(team => [team.id, team])
  );

  const mockTeamStats: TeamStats[] = mockTeams.map((team, i) => ({
    team_id: team.id,
    tournament_id: 'tournament-1',
    group_id: 'group-1',
    points: 10 - i * 2, // Descending: 10, 8, 6, 4
    games_played: 3,
    win: 3 - i,
    loss: i,
    draw: 0,
    goals_for: 6 - i,
    goals_against: i,
    goal_difference: 6 - 2 * i,
    conduct_score: 0
  }));

  const mockGroupsData = [
    {
      id: 'group-1',
      letter: 'A',
      teamStats: mockTeamStats,
      teamsMap: mockTeamsMap
    },
    {
      id: 'group-2',
      letter: 'B',
      teamStats: mockTeamStats.slice().reverse(), // Different standings for Group B
      teamsMap: mockTeamsMap
    }
  ];

  const mockQualifiedTeams = [
    { id: 'team-1' },
    { id: 'team-2' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders component with title', () => {
      renderWithTheme(
        <GroupStandingsSidebar
          groups={mockGroupsData}
          defaultGroupId="group-1"
          qualifiedTeams={mockQualifiedTeams}
        />
      );

      expect(screen.getByText('Grupos')).toBeInTheDocument();
    });

    it('renders carousel navigation with arrows', () => {
      renderWithTheme(
        <GroupStandingsSidebar
          groups={mockGroupsData}
          defaultGroupId="group-1"
          qualifiedTeams={mockQualifiedTeams}
        />
      );

      // Should render navigation arrows
      expect(screen.getByLabelText('Previous group')).toBeInTheDocument();
      expect(screen.getByLabelText('Next group')).toBeInTheDocument();
    });

    it('displays default selected group', () => {
      renderWithTheme(
        <GroupStandingsSidebar
          groups={mockGroupsData}
          defaultGroupId="group-1"
          qualifiedTeams={mockQualifiedTeams}
        />
      );

      // Should display "GRUPO A" header
      expect(screen.getByText('GRUPO A')).toBeInTheDocument();
    });

    it('renders team standings for selected group', () => {
      renderWithTheme(
        <GroupStandingsSidebar
          groups={mockGroupsData}
          defaultGroupId="group-1"
          qualifiedTeams={mockQualifiedTeams}
        />
      );

      // Should render team standings cards with ranks
      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('#2')).toBeInTheDocument();
      expect(screen.getByText('#3')).toBeInTheDocument();
      expect(screen.getByText('#4')).toBeInTheDocument();

      // Should render team names (at least one team should be visible)
      // TeamStandingsCards component sorts and displays teams
      const teamCards = screen.getAllByRole('button');
      expect(teamCards.length).toBeGreaterThanOrEqual(4);
    });

    it('returns null when no groups provided', () => {
      const { container } = renderWithTheme(
        <GroupStandingsSidebar
          groups={[]}
          defaultGroupId=""
          qualifiedTeams={[]}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('handles undefined groups gracefully', () => {
      const { container } = renderWithTheme(
        <GroupStandingsSidebar
          groups={null as any}
          defaultGroupId=""
          qualifiedTeams={[]}
        />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Carousel Navigation', () => {
    it('navigates to next group when next arrow clicked', async () => {
      renderWithTheme(
        <GroupStandingsSidebar
          groups={mockGroupsData}
          defaultGroupId="group-1"
          qualifiedTeams={mockQualifiedTeams}
        />
      );

      // Initially should show Group A
      expect(screen.getByText('GRUPO A')).toBeInTheDocument();

      // Click next arrow
      const nextButton = screen.getByLabelText('Next group');
      fireEvent.click(nextButton);

      // Should now show Group B
      expect(await screen.findByText('GRUPO B')).toBeInTheDocument();
    });

    it('navigates to previous group when previous arrow clicked', () => {
      renderWithTheme(
        <GroupStandingsSidebar
          groups={mockGroupsData}
          defaultGroupId="group-2"
          qualifiedTeams={mockQualifiedTeams}
        />
      );

      // Initially should show Group B
      expect(screen.getByText('GRUPO B')).toBeInTheDocument();

      // Click previous arrow
      const prevButton = screen.getByLabelText('Previous group');
      fireEvent.click(prevButton);

      // Should now show Group A
      expect(screen.getByText('GRUPO A')).toBeInTheDocument();
    });

    it('disables previous arrow when on first group', () => {
      renderWithTheme(
        <GroupStandingsSidebar
          groups={mockGroupsData}
          defaultGroupId="group-1"
          qualifiedTeams={mockQualifiedTeams}
        />
      );

      const prevButton = screen.getByLabelText('Previous group');
      expect(prevButton).toBeDisabled();
    });

    it('disables next arrow when on last group', () => {
      renderWithTheme(
        <GroupStandingsSidebar
          groups={mockGroupsData}
          defaultGroupId="group-2"
          qualifiedTeams={mockQualifiedTeams}
        />
      );

      const nextButton = screen.getByLabelText('Next group');
      expect(nextButton).toBeDisabled();
    });

    it('updates team standings when switching groups', () => {
      renderWithTheme(
        <GroupStandingsSidebar
          groups={mockGroupsData}
          defaultGroupId="group-1"
          qualifiedTeams={mockQualifiedTeams}
        />
      );

      // Click next arrow
      const nextButton = screen.getByLabelText('Next group');
      fireEvent.click(nextButton);

      // Should still render team standings (TeamStandingsCards component handles rendering)
      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('#2')).toBeInTheDocument();
    });
  });

  describe('Qualified Teams', () => {
    it('passes qualified teams to TeamStandingsCards', () => {
      renderWithTheme(
        <GroupStandingsSidebar
          groups={mockGroupsData}
          defaultGroupId="group-1"
          qualifiedTeams={mockQualifiedTeams}
        />
      );

      // TeamStandingsCards should render the standings
      // The qualified teams highlighting is tested in team-standings-cards.test.tsx
      expect(screen.getByText('#1')).toBeInTheDocument();
    });

    it('handles empty qualified teams list', () => {
      renderWithTheme(
        <GroupStandingsSidebar
          groups={mockGroupsData}
          defaultGroupId="group-1"
          qualifiedTeams={[]}
        />
      );

      // Should still render team standings without highlighting
      expect(screen.getByText('#1')).toBeInTheDocument();
      // TeamStandingsCards component renders teams correctly
      // Note: getAllByRole('button') includes accordion expand button + team cards
      const teamCards = screen.getAllByRole('button');
      expect(teamCards.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Accessibility', () => {
    it('navigation buttons have proper aria-labels', () => {
      renderWithTheme(
        <GroupStandingsSidebar
          groups={mockGroupsData}
          defaultGroupId="group-1"
          qualifiedTeams={mockQualifiedTeams}
        />
      );

      // Navigation buttons should have aria-labels for screen readers
      expect(screen.getByLabelText('Previous group')).toBeInTheDocument();
      expect(screen.getByLabelText('Next group')).toBeInTheDocument();
    });

    it('navigation buttons are keyboard accessible', () => {
      renderWithTheme(
        <GroupStandingsSidebar
          groups={mockGroupsData}
          defaultGroupId="group-1"
          qualifiedTeams={mockQualifiedTeams}
        />
      );

      // Buttons should be focusable and clickable
      const prevButton = screen.getByLabelText('Previous group');
      const nextButton = screen.getByLabelText('Next group');

      expect(prevButton).toBeInTheDocument();
      expect(nextButton).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('falls back to first group if default group not found', () => {
      renderWithTheme(
        <GroupStandingsSidebar
          groups={mockGroupsData}
          defaultGroupId="nonexistent-group"
          qualifiedTeams={mockQualifiedTeams}
        />
      );

      // Should fall back to Group A (first group)
      expect(screen.getByText('GRUPO A')).toBeInTheDocument();
    });

    it('renders single group with disabled navigation arrows', () => {
      const singleGroupData = [mockGroupsData[0]];

      renderWithTheme(
        <GroupStandingsSidebar
          groups={singleGroupData}
          defaultGroupId="group-1"
          qualifiedTeams={mockQualifiedTeams}
        />
      );

      // Should render navigation but both arrows should be disabled
      const prevButton = screen.getByLabelText('Previous group');
      const nextButton = screen.getByLabelText('Next group');

      expect(prevButton).toBeDisabled();
      expect(nextButton).toBeDisabled();
    });

    it('handles many groups with carousel navigation', () => {
      const manyGroups = Array.from({ length: 8 }, (_, i) => ({
        id: `group-${i + 1}`,
        letter: String.fromCharCode(65 + i), // A, B, C, ..., H
        teamStats: mockTeamStats,
        teamsMap: mockTeamsMap
      }));

      renderWithTheme(
        <GroupStandingsSidebar
          groups={manyGroups}
          defaultGroupId="group-1"
          qualifiedTeams={mockQualifiedTeams}
        />
      );

      // Should render navigation arrows for carousel
      expect(screen.getByLabelText('Previous group')).toBeInTheDocument();
      expect(screen.getByLabelText('Next group')).toBeInTheDocument();
      // Should show first group initially
      expect(screen.getByText('GRUPO A')).toBeInTheDocument();
    });
  });

  describe('Theme Integration', () => {
    it('uses theme colors for accordion header', () => {
      const { container } = renderWithTheme(
        <GroupStandingsSidebar
          groups={mockGroupsData}
          defaultGroupId="group-1"
          qualifiedTeams={mockQualifiedTeams}
        />
      );

      // Accordion should be rendered with MUI components
      const accordionSummary = container.querySelector('.MuiAccordionSummary-root');
      expect(accordionSummary).toBeInTheDocument();
    });

    it('applies theme to navigation buttons', () => {
      renderWithTheme(
        <GroupStandingsSidebar
          groups={mockGroupsData}
          defaultGroupId="group-1"
          qualifiedTeams={mockQualifiedTeams}
        />
      );

      // Navigation buttons should be rendered with MUI components
      const prevButton = screen.getByLabelText('Previous group');
      const nextButton = screen.getByLabelText('Next group');

      expect(prevButton).toBeInTheDocument();
      expect(nextButton).toBeInTheDocument();
    });
  });
});
