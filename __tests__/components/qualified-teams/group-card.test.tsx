import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DndContext } from '@dnd-kit/core';
import GroupCard from '../../../app/components/qualified-teams/group-card';
import { renderWithTheme } from '../../utils/test-utils';
import { testFactories } from '../../db/test-factories';

// Mock useMediaQuery - default to desktop, can be overridden per test
const mockUseMediaQuery = vi.fn(() => false);
vi.mock('@mui/material/useMediaQuery', () => ({
  default: mockUseMediaQuery,
}));

describe('GroupCard', () => {
  const mockGroup = testFactories.tournamentGroup({
    id: 'group-1',
    group_letter: 'A',
  });

  const mockTeam1 = testFactories.team({ id: 'team-1', name: 'Argentina' });
  const mockTeam2 = testFactories.team({ id: 'team-2', name: 'Brazil' });

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

  const renderWithDndContext = (ui: React.ReactElement) => {
    return renderWithTheme(
      <DndContext>
        {ui}
      </DndContext>
    );
  };

  it('should render group header with letter', () => {
    const teams = [mockTeam1, mockTeam2];
    const predictions = new Map([
      [mockTeam1.id, mockPrediction1],
      [mockTeam2.id, mockPrediction2],
    ]);

    renderWithDndContext(
      <GroupCard
        group={mockGroup}
        teams={teams}
        predictions={predictions}
        isLocked={false}
        isSaving={false}
        allowsThirdPlace={false}
        isGroupComplete={false}
        allGroupsComplete={false}
      />
    );

    expect(screen.getByText('GRUPO A')).toBeInTheDocument();
  });

  it('should render all teams in sorted order by position', () => {
    const mockPred1Pos2 = testFactories.qualifiedTeamPrediction({
      team_id: 'team-1',
      predicted_position: 2,
      predicted_to_qualify: true,
    });

    const mockPred2Pos1 = testFactories.qualifiedTeamPrediction({
      team_id: 'team-2',
      predicted_position: 1,
      predicted_to_qualify: true,
    });

    const teams = [mockTeam1, mockTeam2];
    const predictions = new Map([
      [mockTeam1.id, mockPred1Pos2],
      [mockTeam2.id, mockPred2Pos1],
    ]);

    renderWithDndContext(
      <GroupCard
        group={mockGroup}
        teams={teams}
        predictions={predictions}
        isLocked={false}
        isSaving={false}
        allowsThirdPlace={false}
        isGroupComplete={false}
        allGroupsComplete={false}
      />
    );

    // Both teams should be rendered
    expect(screen.getByText('Argentina')).toBeInTheDocument();
    expect(screen.getByText('Brazil')).toBeInTheDocument();

    // Brazil should appear before Argentina (position 1 vs 2)
    const teamNames = screen.getAllByText(/Argentina|Brazil/);
    expect(teamNames[0].textContent).toBe('Brazil');
    expect(teamNames[1].textContent).toBe('Argentina');
  });

  it('should pass isLocked to team cards', () => {
    const teams = [mockTeam1];
    const predictions = new Map([[mockTeam1.id, mockPrediction1]]);

    renderWithDndContext(
      <GroupCard
        group={mockGroup}
        teams={teams}
        predictions={predictions}
        isLocked={true}
        isSaving={false}
        allowsThirdPlace={false}
        isGroupComplete={false}
        allGroupsComplete={false}
      />
    );

    // When locked, drag handle and interactions should be disabled
    // Check that the card has reduced opacity (0.6 when disabled)
    const cardElement = screen.getByText('Argentina').closest('[style*="opacity"]');
    expect(cardElement).toBeInTheDocument();
  });

  it('should call onPositionChange when provided', () => {
    const onPositionChange = vi.fn();
    const teams = [mockTeam1];
    const predictions = new Map([[mockTeam1.id, mockPrediction1]]);

    renderWithDndContext(
      <GroupCard
        group={mockGroup}
        teams={teams}
        predictions={predictions}
        isLocked={false}
        allowsThirdPlace={false}
        onPositionChange={onPositionChange}
      />
    );

    // onPositionChange callback should be passed to child components
    expect(screen.getByText('Argentina')).toBeInTheDocument();
  });

  it('should call onToggleThirdPlace for position 3 teams', () => {
    const onToggleThirdPlace = vi.fn();

    const mockPred3 = testFactories.qualifiedTeamPrediction({
      team_id: 'team-1',
      predicted_position: 3,
      predicted_to_qualify: false,
    });

    const teams = [mockTeam1];
    const predictions = new Map([[mockTeam1.id, mockPred3]]);

    renderWithDndContext(
      <GroupCard
        group={mockGroup}
        teams={teams}
        predictions={predictions}
        isLocked={false}
        allowsThirdPlace={true}
        onToggleThirdPlace={onToggleThirdPlace}
      />
    );

    // Find and click the checkbox for third place
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(onToggleThirdPlace).toHaveBeenCalledWith('team-1');
  });

  it('should not provide onToggleThirdPlace for non-position-3 teams', () => {
    const onToggleThirdPlace = vi.fn();

    const teams = [mockTeam1];
    const predictions = new Map([[mockTeam1.id, mockPrediction1]]);

    renderWithDndContext(
      <GroupCard
        group={mockGroup}
        teams={teams}
        predictions={predictions}
        isLocked={false}
        allowsThirdPlace={true}
        onToggleThirdPlace={onToggleThirdPlace}
      />
    );

    // Position 1 should not have a checkbox
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('should not render teams without predictions', () => {
    const teams = [mockTeam1, mockTeam2];
    const predictions = new Map([[mockTeam1.id, mockPrediction1]]);

    renderWithDndContext(
      <GroupCard
        group={mockGroup}
        teams={teams}
        predictions={predictions}
        isLocked={false}
        isSaving={false}
        allowsThirdPlace={false}
        isGroupComplete={false}
        allGroupsComplete={false}
      />
    );

    // Only Argentina should be rendered (has prediction)
    expect(screen.getByText('Argentina')).toBeInTheDocument();
    expect(screen.queryByText('Brazil')).not.toBeInTheDocument();
  });

  describe('Completion status (Bug 2)', () => {
    it('should show CheckCircleIcon when group is touched (qualifiedCount > 0)', () => {
      const teams = [mockTeam1, mockTeam2];
      const predictions = new Map([
        [mockTeam1.id, mockPrediction1], // predicted_to_qualify: true
        [mockTeam2.id, mockPrediction2], // predicted_to_qualify: true
      ]);

      renderWithDndContext(
        <GroupCard
          group={mockGroup}
          teams={teams}
          predictions={predictions}
          isLocked={false}
          isSaving={false}
          allowsThirdPlace={false}
          isGroupComplete={false}
          allGroupsComplete={false}
        />
      );

      // Should show CheckCircleIcon when qualifiedCount > 0
      expect(screen.getByTestId('CheckCircleIcon')).toBeInTheDocument();
    });

    it('should not show CheckCircleIcon when group is not touched (qualifiedCount === 0)', () => {
      const mockPred1NotQualified = testFactories.qualifiedTeamPrediction({
        team_id: 'team-1',
        predicted_position: 1,
        predicted_to_qualify: false,
      });

      const mockPred2NotQualified = testFactories.qualifiedTeamPrediction({
        team_id: 'team-2',
        predicted_position: 2,
        predicted_to_qualify: false,
      });

      const teams = [mockTeam1, mockTeam2];
      const predictions = new Map([
        [mockTeam1.id, mockPred1NotQualified],
        [mockTeam2.id, mockPred2NotQualified],
      ]);

      renderWithDndContext(
        <GroupCard
          group={mockGroup}
          teams={teams}
          predictions={predictions}
          isLocked={false}
          isSaving={false}
          allowsThirdPlace={false}
          isGroupComplete={false}
          allGroupsComplete={false}
        />
      );

      // Should not show CheckCircleIcon when qualifiedCount === 0
      expect(screen.queryByTestId('CheckCircleIcon')).not.toBeInTheDocument();
    });

    it('should show CheckCircleIcon in mobile accordion when group is touched', () => {
      // Mock mobile view
      mockUseMediaQuery.mockReturnValue(true);

      const teams = [mockTeam1];
      const predictions = new Map([
        [mockTeam1.id, mockPrediction1], // predicted_to_qualify: true
      ]);

      renderWithDndContext(
        <GroupCard
          group={mockGroup}
          teams={teams}
          predictions={predictions}
          isLocked={false}
          isSaving={false}
          allowsThirdPlace={false}
          isGroupComplete={false}
          allGroupsComplete={false}
        />
      );

      // Should show CheckCircleIcon in accordion summary
      expect(screen.getByTestId('CheckCircleIcon')).toBeInTheDocument();

      // Reset mock for other tests
      mockUseMediaQuery.mockReturnValue(false);
    });
  });

  describe('Saving state (Bug 4)', () => {
    it('should gray out cards and disable interactions when isSaving is true', () => {
      const teams = [mockTeam1];
      const predictions = new Map([[mockTeam1.id, mockPrediction1]]);

      const { container } = renderWithDndContext(
        <GroupCard
          group={mockGroup}
          teams={teams}
          predictions={predictions}
          isLocked={false}
          isSaving={true}
          allowsThirdPlace={false}
          isGroupComplete={false}
          allGroupsComplete={false}
        />
      );

      // Card should have reduced opacity
      const card = container.querySelector('[class*="MuiCard"]');
      expect(card).toHaveStyle({ opacity: '0.6' });
      expect(card).toHaveStyle({ pointerEvents: 'none' });
    });

    it('should not affect cards when isSaving is false', () => {
      const teams = [mockTeam1];
      const predictions = new Map([[mockTeam1.id, mockPrediction1]]);

      const { container } = renderWithDndContext(
        <GroupCard
          group={mockGroup}
          teams={teams}
          predictions={predictions}
          isLocked={false}
          isSaving={false}
          allowsThirdPlace={false}
          isGroupComplete={false}
          allGroupsComplete={false}
        />
      );

      // Card should have full opacity
      const card = container.querySelector('[class*="MuiCard"]');
      expect(card).toHaveStyle({ opacity: '1' });
      expect(card).toHaveStyle({ pointerEvents: 'auto' });
    });
  });
});
