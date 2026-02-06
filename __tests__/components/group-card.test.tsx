import { vi, describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import React from 'react';
import GroupCard from '../../app/components/qualified-teams/group-card';
import { renderWithTheme } from '../utils/test-utils';
import { testFactories } from '../db/test-factories';

// Mock @dnd-kit/sortable
const mockUseSortable = vi.fn();
vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => mockUseSortable(),
  SortableContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  verticalListSortingStrategy: vi.fn(),
}));

// Mock @dnd-kit/utilities
vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: (transform: any) => (transform ? 'transform: translate(10px, 10px)' : ''),
    },
  },
}));

// Mock DraggableTeamCard
vi.mock('../../app/components/qualified-teams/draggable-team-card', () => ({
  default: ({ team, position, predictedToQualify, disabled, onToggleThirdPlace }: any) => (
    <div data-testid={`team-card-${team.id}`}>
      <span>{team.name}</span>
      <span>Position: {position}</span>
      <span>Qualifies: {predictedToQualify ? 'Yes' : 'No'}</span>
      <span>Disabled: {disabled ? 'Yes' : 'No'}</span>
      {onToggleThirdPlace && (
        <button onClick={onToggleThirdPlace} data-testid={`toggle-third-${team.id}`}>
          Toggle
        </button>
      )}
    </div>
  ),
}));

describe('GroupCard', () => {
  const mockGroup = testFactories.tournamentGroup({
    id: 'group-1',
    group_letter: 'A',
    tournament_id: 'tournament-1',
  });

  const mockTeams = [
    testFactories.team({ id: 'team-1', name: 'Argentina', short_name: 'ARG' }),
    testFactories.team({ id: 'team-2', name: 'Brazil', short_name: 'BRA' }),
    testFactories.team({ id: 'team-3', name: 'Chile', short_name: 'CHI' }),
    testFactories.team({ id: 'team-4', name: 'Uruguay', short_name: 'URU' }),
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
    [
      'team-2',
      testFactories.qualifiedTeamPrediction({
        id: 'pred-2',
        team_id: 'team-2',
        group_id: 'group-1',
        predicted_position: 2,
        predicted_to_qualify: true,
      }),
    ],
    [
      'team-3',
      testFactories.qualifiedTeamPrediction({
        id: 'pred-3',
        team_id: 'team-3',
        group_id: 'group-1',
        predicted_position: 3,
        predicted_to_qualify: false,
      }),
    ],
    [
      'team-4',
      testFactories.qualifiedTeamPrediction({
        id: 'pred-4',
        team_id: 'team-4',
        group_id: 'group-1',
        predicted_position: 4,
        predicted_to_qualify: false,
      }),
    ],
  ]);

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSortable.mockReturnValue({
      attributes: { role: 'button', tabIndex: 0 },
      listeners: { onPointerDown: vi.fn() },
      setNodeRef: vi.fn(),
      transform: null,
      transition: null,
      isDragging: false,
    });
  });

  describe('Basic Rendering', () => {
    it('should render group name', () => {
      renderWithTheme(
        <GroupCard
          group={mockGroup}
          teams={mockTeams}
          predictions={mockPredictions}
          isLocked={false}
          allowsThirdPlace={false}
        />
      );

      expect(screen.getByText('GRUPO A')).toBeInTheDocument();
    });

    it('should render all team cards', () => {
      renderWithTheme(
        <GroupCard
          group={mockGroup}
          teams={mockTeams}
          predictions={mockPredictions}
          isLocked={false}
          allowsThirdPlace={false}
        />
      );

      expect(screen.getByText('Argentina')).toBeInTheDocument();
      expect(screen.getByText('Brazil')).toBeInTheDocument();
      expect(screen.getByText('Chile')).toBeInTheDocument();
      expect(screen.getByText('Uruguay')).toBeInTheDocument();
    });

    it('should render qualification instructions for positions 1-2', () => {
      renderWithTheme(
        <GroupCard
          group={mockGroup}
          teams={mockTeams}
          predictions={mockPredictions}
          isLocked={false}
          allowsThirdPlace={false}
        />
      );

      expect(screen.getByText(/Posiciones 1-2:/)).toBeInTheDocument();
      expect(screen.getByText(/Clasifican automáticamente a la siguiente ronda/)).toBeInTheDocument();
    });

    it('should render third place instructions when enabled', () => {
      renderWithTheme(
        <GroupCard
          group={mockGroup}
          teams={mockTeams}
          predictions={mockPredictions}
          isLocked={false}
          allowsThirdPlace={true}
        />
      );

      expect(screen.getByText(/Posición 3:/)).toBeInTheDocument();
      expect(screen.getByText(/Selecciona los equipos que predices que clasificarán/)).toBeInTheDocument();
    });

    it('should not render third place instructions when disabled', () => {
      renderWithTheme(
        <GroupCard
          group={mockGroup}
          teams={mockTeams}
          predictions={mockPredictions}
          isLocked={false}
          allowsThirdPlace={false}
        />
      );

      expect(screen.queryByText(/Posición 3:/)).not.toBeInTheDocument();
    });
  });

  describe('Team Sorting', () => {
    it('should display teams in order by predicted position', () => {
      const { container } = renderWithTheme(
        <GroupCard
          group={mockGroup}
          teams={mockTeams}
          predictions={mockPredictions}
          isLocked={false}
          allowsThirdPlace={false}
        />
      );

      const teamCards = container.querySelectorAll('[data-testid^="team-card-"]');
      expect(teamCards).toHaveLength(4);

      // Verify order: team-1 (pos 1), team-2 (pos 2), team-3 (pos 3), team-4 (pos 4)
      expect(teamCards[0]).toHaveAttribute('data-testid', 'team-card-team-1');
      expect(teamCards[1]).toHaveAttribute('data-testid', 'team-card-team-2');
      expect(teamCards[2]).toHaveAttribute('data-testid', 'team-card-team-3');
      expect(teamCards[3]).toHaveAttribute('data-testid', 'team-card-team-4');
    });

    it('should re-sort when predictions change', () => {
      const { container, rerender } = renderWithTheme(
        <GroupCard
          group={mockGroup}
          teams={mockTeams}
          predictions={mockPredictions}
          isLocked={false}
          allowsThirdPlace={false}
        />
      );

      // Change predictions - swap positions 1 and 2
      const updatedPredictions = new Map([
        [
          'team-1',
          testFactories.qualifiedTeamPrediction({
            id: 'pred-1',
            team_id: 'team-1',
            group_id: 'group-1',
            predicted_position: 2,
            predicted_to_qualify: true,
          }),
        ],
        [
          'team-2',
          testFactories.qualifiedTeamPrediction({
            id: 'pred-2',
            team_id: 'team-2',
            group_id: 'group-1',
            predicted_position: 1,
            predicted_to_qualify: true,
          }),
        ],
        [
          'team-3',
          testFactories.qualifiedTeamPrediction({
            id: 'pred-3',
            team_id: 'team-3',
            group_id: 'group-1',
            predicted_position: 3,
            predicted_to_qualify: false,
          }),
        ],
        [
          'team-4',
          testFactories.qualifiedTeamPrediction({
            id: 'pred-4',
            team_id: 'team-4',
            group_id: 'group-1',
            predicted_position: 4,
            predicted_to_qualify: false,
          }),
        ],
      ]);

      rerender(
        <GroupCard
          group={mockGroup}
          teams={mockTeams}
          predictions={updatedPredictions}
          isLocked={false}
          allowsThirdPlace={false}
        />
      );

      const teamCards = container.querySelectorAll('[data-testid^="team-card-"]');

      // Verify new order: team-2 (pos 1), team-1 (pos 2), team-3 (pos 3), team-4 (pos 4)
      expect(teamCards[0]).toHaveAttribute('data-testid', 'team-card-team-2');
      expect(teamCards[1]).toHaveAttribute('data-testid', 'team-card-team-1');
      expect(teamCards[2]).toHaveAttribute('data-testid', 'team-card-team-3');
      expect(teamCards[3]).toHaveAttribute('data-testid', 'team-card-team-4');
    });
  });

  describe('Prediction Data Passing', () => {
    it('should pass correct position to each team card', () => {
      renderWithTheme(
        <GroupCard
          group={mockGroup}
          teams={mockTeams}
          predictions={mockPredictions}
          isLocked={false}
          allowsThirdPlace={false}
        />
      );

      expect(screen.getByTestId('team-card-team-1')).toHaveTextContent('Position: 1');
      expect(screen.getByTestId('team-card-team-2')).toHaveTextContent('Position: 2');
      expect(screen.getByTestId('team-card-team-3')).toHaveTextContent('Position: 3');
      expect(screen.getByTestId('team-card-team-4')).toHaveTextContent('Position: 4');
    });

    it('should pass correct qualification status to each team card', () => {
      renderWithTheme(
        <GroupCard
          group={mockGroup}
          teams={mockTeams}
          predictions={mockPredictions}
          isLocked={false}
          allowsThirdPlace={false}
        />
      );

      expect(screen.getByTestId('team-card-team-1')).toHaveTextContent('Qualifies: Yes');
      expect(screen.getByTestId('team-card-team-2')).toHaveTextContent('Qualifies: Yes');
      expect(screen.getByTestId('team-card-team-3')).toHaveTextContent('Qualifies: No');
      expect(screen.getByTestId('team-card-team-4')).toHaveTextContent('Qualifies: No');
    });

    it('should pass disabled state to team cards when locked', () => {
      renderWithTheme(
        <GroupCard
          group={mockGroup}
          teams={mockTeams}
          predictions={mockPredictions}
          isLocked={true}
          allowsThirdPlace={false}
        />
      );

      expect(screen.getByTestId('team-card-team-1')).toHaveTextContent('Disabled: Yes');
      expect(screen.getByTestId('team-card-team-2')).toHaveTextContent('Disabled: Yes');
      expect(screen.getByTestId('team-card-team-3')).toHaveTextContent('Disabled: Yes');
      expect(screen.getByTestId('team-card-team-4')).toHaveTextContent('Disabled: Yes');
    });

    it('should pass disabled=false when not locked', () => {
      renderWithTheme(
        <GroupCard
          group={mockGroup}
          teams={mockTeams}
          predictions={mockPredictions}
          isLocked={false}
          allowsThirdPlace={false}
        />
      );

      expect(screen.getByTestId('team-card-team-1')).toHaveTextContent('Disabled: No');
      expect(screen.getByTestId('team-card-team-2')).toHaveTextContent('Disabled: No');
      expect(screen.getByTestId('team-card-team-3')).toHaveTextContent('Disabled: No');
      expect(screen.getByTestId('team-card-team-4')).toHaveTextContent('Disabled: No');
    });
  });

  describe('Third Place Toggle', () => {
    it('should provide toggle callback for position 3 team', () => {
      const onToggleThirdPlace = vi.fn();

      renderWithTheme(
        <GroupCard
          group={mockGroup}
          teams={mockTeams}
          predictions={mockPredictions}
          isLocked={false}
          allowsThirdPlace={true}
          onToggleThirdPlace={onToggleThirdPlace}
        />
      );

      expect(screen.getByTestId('toggle-third-team-3')).toBeInTheDocument();
    });

    it('should not provide toggle callback for non-position-3 teams', () => {
      const onToggleThirdPlace = vi.fn();

      renderWithTheme(
        <GroupCard
          group={mockGroup}
          teams={mockTeams}
          predictions={mockPredictions}
          isLocked={false}
          allowsThirdPlace={true}
          onToggleThirdPlace={onToggleThirdPlace}
        />
      );

      expect(screen.queryByTestId('toggle-third-team-1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('toggle-third-team-2')).not.toBeInTheDocument();
      expect(screen.queryByTestId('toggle-third-team-4')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty teams array', () => {
      renderWithTheme(
        <GroupCard
          group={mockGroup}
          teams={[]}
          predictions={new Map()}
          isLocked={false}
          allowsThirdPlace={false}
        />
      );

      expect(screen.getByText('GRUPO A')).toBeInTheDocument();
      expect(screen.queryByTestId(/team-card-/)).not.toBeInTheDocument();
    });

    it('should skip rendering team without prediction', () => {
      const incompleteTeams = [mockTeams[0], mockTeams[1]];
      const incompletePredictions = new Map([[mockTeams[0].id, mockPredictions.get(mockTeams[0].id)!]]);

      const { container } = renderWithTheme(
        <GroupCard
          group={mockGroup}
          teams={incompleteTeams}
          predictions={incompletePredictions}
          isLocked={false}
          allowsThirdPlace={false}
        />
      );

      const teamCards = container.querySelectorAll('[data-testid^="team-card-"]');
      expect(teamCards).toHaveLength(1);
      expect(teamCards[0]).toHaveAttribute('data-testid', 'team-card-team-1');
    });

    it('should handle missing callbacks gracefully', () => {
      renderWithTheme(
        <GroupCard
          group={mockGroup}
          teams={mockTeams}
          predictions={mockPredictions}
          isLocked={false}
          allowsThirdPlace={true}
        />
      );

      expect(screen.getByText('GRUPO A')).toBeInTheDocument();
    });

    it('should format group letter correctly', () => {
      const groupB = testFactories.tournamentGroup({
        id: 'group-2',
        group_letter: 'b',
        tournament_id: 'tournament-1',
      });

      renderWithTheme(
        <GroupCard
          group={groupB}
          teams={mockTeams}
          predictions={mockPredictions}
          isLocked={false}
          allowsThirdPlace={false}
        />
      );

      expect(screen.getByText('GRUPO B')).toBeInTheDocument();
    });
  });

  describe('Card Layout', () => {
    it('should render as Material-UI Card', () => {
      const { container } = renderWithTheme(
        <GroupCard
          group={mockGroup}
          teams={mockTeams}
          predictions={mockPredictions}
          isLocked={false}
          allowsThirdPlace={false}
        />
      );

      const card = container.querySelector('.MuiCard-root');
      expect(card).toBeInTheDocument();
    });

    it('should render CardContent', () => {
      const { container } = renderWithTheme(
        <GroupCard
          group={mockGroup}
          teams={mockTeams}
          predictions={mockPredictions}
          isLocked={false}
          allowsThirdPlace={false}
        />
      );

      const cardContent = container.querySelector('.MuiCardContent-root');
      expect(cardContent).toBeInTheDocument();
    });

    it('should render Alert for instructions', () => {
      const { container } = renderWithTheme(
        <GroupCard
          group={mockGroup}
          teams={mockTeams}
          predictions={mockPredictions}
          isLocked={false}
          allowsThirdPlace={false}
        />
      );

      const alert = container.querySelector('.MuiAlert-root');
      expect(alert).toBeInTheDocument();
    });
  });
});
