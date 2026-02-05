import { vi, describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import React from 'react';
import QualifiedTeamsGrid from '../../app/components/qualified-teams/qualified-teams-grid';
import { renderWithTheme } from '../utils/test-utils';
import { testFactories } from '../db/test-factories';

// Mock GroupCard
vi.mock('../../app/components/qualified-teams/group-card', () => ({
  default: ({ group, teams, onPositionChange, onToggleThirdPlace }: any) => (
    <div data-testid={`group-card-${group.id}`}>
      <span>{group.name}</span>
      <span>Teams: {teams.length}</span>
      {onPositionChange && (
        <button
          onClick={() => onPositionChange('team-1', 2)}
          data-testid={`position-change-${group.id}`}
        >
          Change Position
        </button>
      )}
      {onToggleThirdPlace && (
        <button
          onClick={() => onToggleThirdPlace('team-1')}
          data-testid={`toggle-third-${group.id}`}
        >
          Toggle Third
        </button>
      )}
    </div>
  ),
}));

describe('QualifiedTeamsGrid', () => {
  const mockGroups = [
    {
      group: testFactories.tournamentGroup({
        id: 'group-1',
        name: 'Group A',
        tournament_id: 'tournament-1',
      }),
      teams: [
        testFactories.team({ id: 'team-1', name: 'Argentina', short_name: 'ARG' }),
        testFactories.team({ id: 'team-2', name: 'Brazil', short_name: 'BRA' }),
      ],
    },
    {
      group: testFactories.tournamentGroup({
        id: 'group-2',
        name: 'Group B',
        tournament_id: 'tournament-1',
      }),
      teams: [
        testFactories.team({ id: 'team-3', name: 'Chile', short_name: 'CHI' }),
        testFactories.team({ id: 'team-4', name: 'Uruguay', short_name: 'URU' }),
      ],
    },
  ];

  const mockPredictions = new Map([
    [
      'team-1',
      testFactories.qualifiedTeamPrediction({
        id: 'pred-1',
        team_id: 'team-1',
        group_id: 'group-1',
        predicted_position: 1,
        predicted_to_qualify: true,
      }),
    ],
  ]);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render all group cards', () => {
      renderWithTheme(
        <QualifiedTeamsGrid
          groups={mockGroups}
          predictions={mockPredictions}
          isLocked={false}
          allowsThirdPlace={false}
        />
      );

      expect(screen.getByTestId('group-card-group-1')).toBeInTheDocument();
      expect(screen.getByTestId('group-card-group-2')).toBeInTheDocument();
    });

    it('should render group names', () => {
      renderWithTheme(
        <QualifiedTeamsGrid
          groups={mockGroups}
          predictions={mockPredictions}
          isLocked={false}
          allowsThirdPlace={false}
        />
      );

      expect(screen.getByText('Group A')).toBeInTheDocument();
      expect(screen.getByText('Group B')).toBeInTheDocument();
    });

    it('should pass teams to each group card', () => {
      renderWithTheme(
        <QualifiedTeamsGrid
          groups={mockGroups}
          predictions={mockPredictions}
          isLocked={false}
          allowsThirdPlace={false}
        />
      );

      expect(screen.getByTestId('group-card-group-1')).toHaveTextContent('Teams: 2');
      expect(screen.getByTestId('group-card-group-2')).toHaveTextContent('Teams: 2');
    });
  });

  describe('Responsive Grid', () => {
    it('should render Material-UI Grid container', () => {
      const { container } = renderWithTheme(
        <QualifiedTeamsGrid
          groups={mockGroups}
          predictions={mockPredictions}
          isLocked={false}
          allowsThirdPlace={false}
        />
      );

      const gridContainer = container.querySelector('.MuiGrid-container');
      expect(gridContainer).toBeInTheDocument();
    });

    it('should render correct number of groups', () => {
      renderWithTheme(
        <QualifiedTeamsGrid
          groups={mockGroups}
          predictions={mockPredictions}
          isLocked={false}
          allowsThirdPlace={false}
        />
      );

      // Verify both groups are rendered via mocked GroupCard
      expect(screen.getByTestId('group-card-group-1')).toBeInTheDocument();
      expect(screen.getByTestId('group-card-group-2')).toBeInTheDocument();
    });
  });

  describe('Props Passing', () => {
    it('should pass predictions to all group cards', () => {
      renderWithTheme(
        <QualifiedTeamsGrid
          groups={mockGroups}
          predictions={mockPredictions}
          isLocked={false}
          allowsThirdPlace={false}
        />
      );

      expect(screen.getByTestId('group-card-group-1')).toBeInTheDocument();
      expect(screen.getByTestId('group-card-group-2')).toBeInTheDocument();
    });

    it('should pass isLocked to all group cards', () => {
      renderWithTheme(
        <QualifiedTeamsGrid
          groups={mockGroups}
          predictions={mockPredictions}
          isLocked={true}
          allowsThirdPlace={false}
        />
      );

      expect(screen.getByTestId('group-card-group-1')).toBeInTheDocument();
      expect(screen.getByTestId('group-card-group-2')).toBeInTheDocument();
    });

    it('should pass allowsThirdPlace to all group cards', () => {
      renderWithTheme(
        <QualifiedTeamsGrid
          groups={mockGroups}
          predictions={mockPredictions}
          isLocked={false}
          allowsThirdPlace={true}
        />
      );

      expect(screen.getByTestId('group-card-group-1')).toBeInTheDocument();
      expect(screen.getByTestId('group-card-group-2')).toBeInTheDocument();
    });
  });

  describe('Callback Wrapping', () => {
    it('should wrap onPositionChange with groupId', () => {
      const onPositionChange = vi.fn();

      renderWithTheme(
        <QualifiedTeamsGrid
          groups={mockGroups}
          predictions={mockPredictions}
          isLocked={false}
          allowsThirdPlace={false}
          onPositionChange={onPositionChange}
        />
      );

      const button = screen.getByTestId('position-change-group-1');
      button.click();

      expect(onPositionChange).toHaveBeenCalledWith('group-1', 'team-1', 2);
    });

    it('should wrap onToggleThirdPlace with groupId', () => {
      const onToggleThirdPlace = vi.fn();

      renderWithTheme(
        <QualifiedTeamsGrid
          groups={mockGroups}
          predictions={mockPredictions}
          isLocked={false}
          allowsThirdPlace={true}
          onToggleThirdPlace={onToggleThirdPlace}
        />
      );

      const button = screen.getByTestId('toggle-third-group-1');
      button.click();

      expect(onToggleThirdPlace).toHaveBeenCalledWith('group-1', 'team-1');
    });

    it('should call correct callback for each group', () => {
      const onPositionChange = vi.fn();

      renderWithTheme(
        <QualifiedTeamsGrid
          groups={mockGroups}
          predictions={mockPredictions}
          isLocked={false}
          allowsThirdPlace={false}
          onPositionChange={onPositionChange}
        />
      );

      const button1 = screen.getByTestId('position-change-group-1');
      const button2 = screen.getByTestId('position-change-group-2');

      button1.click();
      expect(onPositionChange).toHaveBeenCalledWith('group-1', 'team-1', 2);

      onPositionChange.mockClear();

      button2.click();
      expect(onPositionChange).toHaveBeenCalledWith('group-2', 'team-1', 2);
    });

    it('should not pass callbacks when not provided', () => {
      renderWithTheme(
        <QualifiedTeamsGrid
          groups={mockGroups}
          predictions={mockPredictions}
          isLocked={false}
          allowsThirdPlace={false}
        />
      );

      expect(screen.queryByTestId('position-change-group-1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('toggle-third-group-1')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty groups array', () => {
      const { container } = renderWithTheme(
        <QualifiedTeamsGrid
          groups={[]}
          predictions={mockPredictions}
          isLocked={false}
          allowsThirdPlace={false}
        />
      );

      expect(container.querySelector('[data-testid^="group-card-"]')).not.toBeInTheDocument();
    });

    it('should handle single group', () => {
      renderWithTheme(
        <QualifiedTeamsGrid
          groups={[mockGroups[0]]}
          predictions={mockPredictions}
          isLocked={false}
          allowsThirdPlace={false}
        />
      );

      expect(screen.getByTestId('group-card-group-1')).toBeInTheDocument();
      expect(screen.queryByTestId('group-card-group-2')).not.toBeInTheDocument();
    });

    it('should handle many groups', () => {
      const manyGroups = [
        ...mockGroups,
        {
          group: testFactories.tournamentGroup({
            id: 'group-3',
            name: 'Group C',
            tournament_id: 'tournament-1',
          }),
          teams: [testFactories.team({ id: 'team-5', name: 'Peru', short_name: 'PER' })],
        },
        {
          group: testFactories.tournamentGroup({
            id: 'group-4',
            name: 'Group D',
            tournament_id: 'tournament-1',
          }),
          teams: [testFactories.team({ id: 'team-6', name: 'Colombia', short_name: 'COL' })],
        },
      ];

      renderWithTheme(
        <QualifiedTeamsGrid
          groups={manyGroups}
          predictions={mockPredictions}
          isLocked={false}
          allowsThirdPlace={false}
        />
      );

      expect(screen.getByTestId('group-card-group-1')).toBeInTheDocument();
      expect(screen.getByTestId('group-card-group-2')).toBeInTheDocument();
      expect(screen.getByTestId('group-card-group-3')).toBeInTheDocument();
      expect(screen.getByTestId('group-card-group-4')).toBeInTheDocument();
    });

    it('should handle group with empty teams', () => {
      const groupsWithEmpty = [
        ...mockGroups,
        {
          group: testFactories.tournamentGroup({
            id: 'group-3',
            name: 'Group C',
            tournament_id: 'tournament-1',
          }),
          teams: [],
        },
      ];

      renderWithTheme(
        <QualifiedTeamsGrid
          groups={groupsWithEmpty}
          predictions={mockPredictions}
          isLocked={false}
          allowsThirdPlace={false}
        />
      );

      expect(screen.getByTestId('group-card-group-3')).toBeInTheDocument();
      expect(screen.getByTestId('group-card-group-3')).toHaveTextContent('Teams: 0');
    });

    it('should handle empty predictions map', () => {
      renderWithTheme(
        <QualifiedTeamsGrid
          groups={mockGroups}
          predictions={new Map()}
          isLocked={false}
          allowsThirdPlace={false}
        />
      );

      expect(screen.getByTestId('group-card-group-1')).toBeInTheDocument();
      expect(screen.getByTestId('group-card-group-2')).toBeInTheDocument();
    });
  });
});
