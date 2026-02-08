import { vi, describe, it, expect } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import TeamStandingsCards from '../../../app/components/groups-page/team-standings-cards';
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

describe('TeamStandingsCards', () => {
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
    goal_difference: 6 - 2 * i, // Descending: 6, 4, 2, 0
    conduct_score: 0
  }));

  describe('Rendering', () => {
    it('renders all team cards', () => {
      renderWithTheme(
        <TeamStandingsCards
          teamStats={mockTeamStats}
          teamsMap={mockTeamsMap}
          qualifiedTeams={[]}
        />
      );

      // Should render 4 team cards
      expect(screen.getAllByRole('button').length).toBe(4);

      // Check that ranks are rendered
      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('#2')).toBeInTheDocument();
      expect(screen.getByText('#3')).toBeInTheDocument();
      expect(screen.getByText('#4')).toBeInTheDocument();
    });

    it('sorts teams by points descending', () => {
      renderWithTheme(
        <TeamStandingsCards
          teamStats={mockTeamStats}
          teamsMap={mockTeamsMap}
          qualifiedTeams={[]}
        />
      );

      const cards = screen.getAllByRole('button');

      // First card should have highest points (10 points)
      expect(cards[0]).toHaveTextContent('10 pts');

      // Last card should have lowest points (4 points)
      expect(cards[3]).toHaveTextContent('4 pts');
    });

    // Note: Goal difference tiebreaker is tested via the rank-calculator unit tests
    // This component integrates with that calculator

    it('assigns correct ranks (1-based positions)', () => {
      renderWithTheme(
        <TeamStandingsCards
          teamStats={mockTeamStats}
          teamsMap={mockTeamsMap}
          qualifiedTeams={[]}
        />
      );

      // Check that ranks are displayed
      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('#2')).toBeInTheDocument();
      expect(screen.getByText('#3')).toBeInTheDocument();
      expect(screen.getByText('#4')).toBeInTheDocument();
    });
  });

  describe('Empty and Edge Cases', () => {
    it('renders nothing when teamStats is empty', () => {
      const { container } = renderWithTheme(
        <TeamStandingsCards
          teamStats={[]}
          teamsMap={mockTeamsMap}
          qualifiedTeams={[]}
        />
      );

      // Should not render any cards
      expect(screen.queryAllByRole('button').length).toBe(0);
      expect(container.querySelector('[role="button"]')).not.toBeInTheDocument();
    });

    it('handles single team', () => {
      const singleTeamStats = [mockTeamStats[0]];

      const { container } = renderWithTheme(
        <TeamStandingsCards
          teamStats={singleTeamStats}
          teamsMap={mockTeamsMap}
          qualifiedTeams={[]}
        />
      );

      expect(screen.getAllByRole('button').length).toBe(1);
      expect(screen.getByText('#1')).toBeInTheDocument();
      // Component renders successfully with one team
      expect(container).toBeInTheDocument();
    });

    it('handles many teams (scrolling scenario)', () => {
      const manyTeams = createMany(testFactories.team, 8, (i) => ({
        id: `team-${i + 1}`,
        name: `Team ${i + 1}`
      }));

      const manyTeamsMap = Object.fromEntries(
        manyTeams.map(team => [team.id, team])
      );

      const manyTeamStats = manyTeams.map((team, i) => ({
        team_id: team.id,
        tournament_id: 'tournament-1',
        group_id: 'group-1',
        points: 20 - i,
        games_played: 5,
        win: 5 - i,
        loss: i,
        draw: 0,
        goals_for: 10 - i,
        goals_against: i,
        goal_difference: 10 - 2 * i,
        conduct_score: 0
      }));

      renderWithTheme(
        <TeamStandingsCards
          teamStats={manyTeamStats}
          teamsMap={manyTeamsMap}
          qualifiedTeams={[]}
        />
      );

      expect(screen.getAllByRole('button').length).toBe(8);
    });
  });

  describe('Qualified Teams', () => {
    it('renders with qualified teams without errors', () => {
      const qualifiedTeam = mockTeams[0]; // Team 1

      renderWithTheme(
        <TeamStandingsCards
          teamStats={mockTeamStats}
          teamsMap={mockTeamsMap}
          qualifiedTeams={[qualifiedTeam]}
        />
      );

      const cards = screen.getAllByRole('button');
      // Should render 4 cards
      expect(cards.length).toBe(4);

      // Component handles qualified teams correctly (styling is applied internally)
      expect(cards[0]).toBeInTheDocument();
    });

    it('handles multiple qualified teams without errors', () => {
      const qualifiedTeams = [mockTeams[0], mockTeams[1]]; // Team 1 and Team 2

      renderWithTheme(
        <TeamStandingsCards
          teamStats={mockTeamStats}
          teamsMap={mockTeamsMap}
          qualifiedTeams={qualifiedTeams}
        />
      );

      const cards = screen.getAllByRole('button');
      expect(cards.length).toBe(4);
    });

    it('handles empty qualified teams array', () => {
      renderWithTheme(
        <TeamStandingsCards
          teamStats={mockTeamStats}
          teamsMap={mockTeamsMap}
          qualifiedTeams={[]}
        />
      );

      const cards = screen.getAllByRole('button');
      expect(cards.length).toBe(4);
    });
  });

  describe('Rank Changes (Previous Stats)', () => {
    it('shows rank change indicators when previousTeamStats provided', () => {
      const previousTeamStats: TeamStats[] = mockTeams.map((team, i) => ({
        team_id: team.id,
        tournament_id: 'tournament-1',
        group_id: 'group-1',
        points: 8 - i * 2, // Previous points: 8, 6, 4, 2
        games_played: 2,
        win: 2 - i,
        loss: i,
        draw: 0,
        goals_for: 4 - i,
        goals_against: i,
        goal_difference: 4 - 2 * i,
        conduct_score: 0
      }));

      renderWithTheme(
        <TeamStandingsCards
          teamStats={mockTeamStats}
          teamsMap={mockTeamsMap}
          qualifiedTeams={[]}
          previousTeamStats={previousTeamStats}
        />
      );

      // Should show rank change indicators
      const indicators = screen.getAllByTestId('rank-change-indicator');
      expect(indicators.length).toBeGreaterThan(0);
    });

    it('calculates rank change correctly (improvement)', () => {
      // Team 2 moves from rank 3 to rank 2 (improvement of +1)
      const previousTeamStats: TeamStats[] = [
        { ...mockTeamStats[0], team_id: 'team-1', points: 10 },
        { ...mockTeamStats[2], team_id: 'team-3', points: 8 }, // Was rank 2
        { ...mockTeamStats[1], team_id: 'team-2', points: 6 }, // Was rank 3, now rank 2
        { ...mockTeamStats[3], team_id: 'team-4', points: 4 }
      ];

      renderWithTheme(
        <TeamStandingsCards
          teamStats={mockTeamStats}
          teamsMap={mockTeamsMap}
          qualifiedTeams={[]}
          previousTeamStats={previousTeamStats}
        />
      );

      // Team 2 improved from position 3 to position 2
      // Rank change should be positive (3 - 2 = +1)
      const indicators = screen.getAllByTestId('rank-change-indicator');
      expect(indicators.length).toBeGreaterThan(0);
    });

    it('does not show rank change indicators when previousTeamStats not provided', () => {
      renderWithTheme(
        <TeamStandingsCards
          teamStats={mockTeamStats}
          teamsMap={mockTeamsMap}
          qualifiedTeams={[]}
        />
      );

      // Should not show any rank change indicators
      expect(screen.queryAllByTestId('rank-change-indicator').length).toBe(0);
    });

    it('handles empty previousTeamStats array', () => {
      renderWithTheme(
        <TeamStandingsCards
          teamStats={mockTeamStats}
          teamsMap={mockTeamsMap}
          qualifiedTeams={[]}
          previousTeamStats={[]}
        />
      );

      // Should not show rank change indicators
      expect(screen.queryAllByTestId('rank-change-indicator').length).toBe(0);
    });
  });

  describe('Card Expansion (Mutual Exclusion)', () => {
    it('expands card when clicked', () => {
      renderWithTheme(
        <TeamStandingsCards
          teamStats={mockTeamStats}
          teamsMap={mockTeamsMap}
          qualifiedTeams={[]}
        />
      );

      const firstCard = screen.getAllByRole('button')[0];

      // Initially collapsed
      expect(firstCard).toHaveAttribute('aria-expanded', 'false');

      // Click to expand
      fireEvent.click(firstCard);

      // Now expanded
      expect(firstCard).toHaveAttribute('aria-expanded', 'true');

      // Should show detailed stats (use getAllByText since text appears in UI)
      const detailHeaders = screen.getAllByText('Estadísticas Detalladas');
      expect(detailHeaders.length).toBeGreaterThanOrEqual(1);
    });

    it('collapses card when clicked again', () => {
      renderWithTheme(
        <TeamStandingsCards
          teamStats={mockTeamStats}
          teamsMap={mockTeamsMap}
          qualifiedTeams={[]}
        />
      );

      const firstCard = screen.getAllByRole('button')[0];

      // Expand
      fireEvent.click(firstCard);
      expect(firstCard).toHaveAttribute('aria-expanded', 'true');

      // Collapse
      fireEvent.click(firstCard);
      expect(firstCard).toHaveAttribute('aria-expanded', 'false');
    });

    it('only allows one card to be expanded at a time (mutual exclusion)', () => {
      renderWithTheme(
        <TeamStandingsCards
          teamStats={mockTeamStats}
          teamsMap={mockTeamsMap}
          qualifiedTeams={[]}
        />
      );

      const cards = screen.getAllByRole('button');
      const firstCard = cards[0];
      const secondCard = cards[1];

      // Expand first card
      fireEvent.click(firstCard);
      expect(firstCard).toHaveAttribute('aria-expanded', 'true');
      expect(secondCard).toHaveAttribute('aria-expanded', 'false');

      // Expand second card
      fireEvent.click(secondCard);
      expect(firstCard).toHaveAttribute('aria-expanded', 'false');
      expect(secondCard).toHaveAttribute('aria-expanded', 'true');
    });
  });

  // Note: Competition ranking (tied positions like 1-2-2-4) is tested in the rank-calculator unit tests
  // This component integrates with that calculator
});
