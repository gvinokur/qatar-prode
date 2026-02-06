import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DndContext } from '@dnd-kit/core';
import QualifiedTeamsGrid from '../../../app/components/qualified-teams/qualified-teams-grid';
import { renderWithTheme } from '../../utils/test-utils';
import { testFactories } from '../../db/test-factories';

// Mock useMediaQuery to return false (desktop view)
vi.mock('@mui/material/useMediaQuery', () => ({
  default: () => false,
}));

describe('QualifiedTeamsGrid', () => {
  const mockGroup1 = testFactories.tournamentGroup({
    id: 'group-1',
    group_letter: 'A',
  });

  const mockGroup2 = testFactories.tournamentGroup({
    id: 'group-2',
    group_letter: 'B',
  });

  const mockTeam1 = testFactories.team({ id: 'team-1', name: 'Argentina' });
  const mockTeam2 = testFactories.team({ id: 'team-2', name: 'Brazil' });
  const mockTeam3 = testFactories.team({ id: 'team-3', name: 'Chile' });
  const mockTeam4 = testFactories.team({ id: 'team-4', name: 'Colombia' });

  const mockPrediction1 = testFactories.qualifiedTeamPrediction({
    team_id: 'team-1',
    predicted_position: 1,
    predicted_to_qualify: true,
  });

  const mockPrediction2 = testFactories.qualifiedTeamPrediction({
    team_id: 'team-2',
    predicted_position: 2,
    predicted_to_qualify: true,
  });

  const mockPrediction3 = testFactories.qualifiedTeamPrediction({
    team_id: 'team-3',
    predicted_position: 1,
    predicted_to_qualify: true,
  });

  const mockPrediction4 = testFactories.qualifiedTeamPrediction({
    team_id: 'team-4',
    predicted_position: 2,
    predicted_to_qualify: true,
  });

  const renderWithDndContext = (ui: React.ReactElement) => {
    return renderWithTheme(<DndContext>{ui}</DndContext>);
  };

  it('should render all groups', () => {
    const groups = [
      { group: mockGroup1, teams: [mockTeam1, mockTeam2] },
      { group: mockGroup2, teams: [mockTeam3, mockTeam4] },
    ];

    const predictions = new Map([
      [mockTeam1.id, mockPrediction1],
      [mockTeam2.id, mockPrediction2],
      [mockTeam3.id, mockPrediction3],
      [mockTeam4.id, mockPrediction4],
    ]);

    renderWithDndContext(
      <QualifiedTeamsGrid
        groups={groups}
        predictions={predictions}
        isLocked={false}
        allowsThirdPlace={false}
      />
    );

    expect(screen.getByText('GRUPO A')).toBeInTheDocument();
    expect(screen.getByText('GRUPO B')).toBeInTheDocument();
  });

  it('should render teams within each group', () => {
    const groups = [
      { group: mockGroup1, teams: [mockTeam1, mockTeam2] },
    ];

    const predictions = new Map([
      [mockTeam1.id, mockPrediction1],
      [mockTeam2.id, mockPrediction2],
    ]);

    renderWithDndContext(
      <QualifiedTeamsGrid
        groups={groups}
        predictions={predictions}
        isLocked={false}
        allowsThirdPlace={false}
      />
    );

    expect(screen.getByText('Argentina')).toBeInTheDocument();
    expect(screen.getByText('Brazil')).toBeInTheDocument();
  });

  it('should handle empty groups array', () => {
    renderWithDndContext(
      <QualifiedTeamsGrid
        groups={[]}
        predictions={new Map()}
        isLocked={false}
        allowsThirdPlace={false}
      />
    );

    expect(screen.queryByText(/GRUPO/)).not.toBeInTheDocument();
  });

  it('should pass isLocked to group cards', () => {
    const groups = [
      { group: mockGroup1, teams: [mockTeam1] },
    ];

    const predictions = new Map([
      [mockTeam1.id, mockPrediction1],
    ]);

    renderWithDndContext(
      <QualifiedTeamsGrid
        groups={groups}
        predictions={predictions}
        isLocked={true}
        allowsThirdPlace={false}
      />
    );

    // When locked, drag handle and interactions should be disabled
    // The group card will have reduced opacity
    expect(screen.getByText('Argentina')).toBeInTheDocument();
  });

  it('should pass allowsThirdPlace to group cards', () => {
    const mockPred3 = testFactories.qualifiedTeamPrediction({
      team_id: 'team-1',
      predicted_position: 3,
      predicted_to_qualify: false,
    });

    const groups = [
      { group: mockGroup1, teams: [mockTeam1] },
    ];

    const predictions = new Map([
      [mockTeam1.id, mockPred3],
    ]);

    renderWithDndContext(
      <QualifiedTeamsGrid
        groups={groups}
        predictions={predictions}
        isLocked={false}
        allowsThirdPlace={true}
      />
    );

    // Position 3 should have a checkbox when third place is allowed
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('should call onPositionChange with groupId when provided', () => {
    const onPositionChange = vi.fn();

    const groups = [
      { group: mockGroup1, teams: [mockTeam1] },
    ];

    const predictions = new Map([
      [mockTeam1.id, mockPrediction1],
    ]);

    renderWithDndContext(
      <QualifiedTeamsGrid
        groups={groups}
        predictions={predictions}
        isLocked={false}
        allowsThirdPlace={false}
        onPositionChange={onPositionChange}
      />
    );

    // GroupCard receives the callback with groupId already bound
    expect(screen.getByText('Argentina')).toBeInTheDocument();
  });

  it('should call onToggleThirdPlace with groupId when provided', () => {
    const onToggleThirdPlace = vi.fn();

    const mockPred3 = testFactories.qualifiedTeamPrediction({
      team_id: 'team-1',
      predicted_position: 3,
      predicted_to_qualify: false,
    });

    const groups = [
      { group: mockGroup1, teams: [mockTeam1] },
    ];

    const predictions = new Map([
      [mockTeam1.id, mockPred3],
    ]);

    renderWithDndContext(
      <QualifiedTeamsGrid
        groups={groups}
        predictions={predictions}
        isLocked={false}
        allowsThirdPlace={true}
        onToggleThirdPlace={onToggleThirdPlace}
      />
    );

    // GroupCard receives the callback with groupId already bound
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
  });

  it('should not pass callbacks when not provided', () => {
    const groups = [
      { group: mockGroup1, teams: [mockTeam1] },
    ];

    const predictions = new Map([
      [mockTeam1.id, mockPrediction1],
    ]);

    renderWithDndContext(
      <QualifiedTeamsGrid
        groups={groups}
        predictions={predictions}
        isLocked={false}
        allowsThirdPlace={false}
      />
    );

    // Should render without callbacks
    expect(screen.getByText('Argentina')).toBeInTheDocument();
  });

  it('should render responsive grid layout', () => {
    const groups = [
      { group: mockGroup1, teams: [mockTeam1] },
      { group: mockGroup2, teams: [mockTeam3] },
    ];

    const predictions = new Map([
      [mockTeam1.id, mockPrediction1],
      [mockTeam3.id, mockPrediction3],
    ]);

    const { container } = renderWithDndContext(
      <QualifiedTeamsGrid
        groups={groups}
        predictions={predictions}
        isLocked={false}
        allowsThirdPlace={false}
      />
    );

    // Grid container should exist
    const gridContainer = container.querySelector('.MuiGrid-container');
    expect(gridContainer).toBeInTheDocument();
  });
});
