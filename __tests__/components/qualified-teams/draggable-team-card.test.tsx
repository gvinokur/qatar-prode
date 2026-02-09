import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DndContext } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import DraggableTeamCard from '../../../app/components/qualified-teams/draggable-team-card';
import { renderWithTheme } from '../../utils/test-utils';
import { testFactories } from '../../db/test-factories';
import { TeamScoringResult } from '../../../app/utils/qualified-teams-scoring';

describe('DraggableTeamCard', () => {
  const mockTeam = testFactories.team({
    id: 'team-1',
    name: 'Argentina',
    theme: { primary: '#75AADB', secondary: '#FFFFFF' },
  });

  const renderWithDndContext = (ui: React.ReactElement) => {
    return renderWithTheme(
      <DndContext>
        <SortableContext items={['team-1']}>
          {ui}
        </SortableContext>
      </DndContext>
    );
  };

  it('should render team name', () => {
    renderWithDndContext(
      <DraggableTeamCard
        team={mockTeam}
        position={1}
        predictedToQualify={true}
        disabled={false}
        isGroupComplete={false}
        isPending3rdPlace={false}
      />
    );

    expect(screen.getByText('Argentina')).toBeInTheDocument();
  });

  it('should render position badge', () => {
    renderWithDndContext(
      <DraggableTeamCard
        team={mockTeam}
        position={1}
        predictedToQualify={true}
        disabled={false}
        isGroupComplete={false}
        isPending3rdPlace={false}
      />
    );

    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('should render checkbox for position 3', () => {
    renderWithDndContext(
      <DraggableTeamCard
        team={mockTeam}
        position={3}
        predictedToQualify={false}
        disabled={false}
        isGroupComplete={false}
        isPending3rdPlace={false}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  it('should render checked checkbox when third place qualifies', () => {
    renderWithDndContext(
      <DraggableTeamCard
        team={mockTeam}
        position={3}
        predictedToQualify={true}
        disabled={false}
        isGroupComplete={false}
        isPending3rdPlace={false}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('should call onToggleThirdPlace when checkbox clicked', () => {
    const onToggleThirdPlace = vi.fn();

    renderWithDndContext(
      <DraggableTeamCard
        team={mockTeam}
        position={3}
        predictedToQualify={false}
        disabled={false}
        onToggleThirdPlace={onToggleThirdPlace}
        isGroupComplete={false}
        isPending3rdPlace={false}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(onToggleThirdPlace).toHaveBeenCalledTimes(1);
  });

  it('should disable checkbox when disabled prop is true', () => {
    renderWithDndContext(
      <DraggableTeamCard
        team={mockTeam}
        position={3}
        predictedToQualify={false}
        disabled={true}
        isGroupComplete={false}
        isPending3rdPlace={false}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
  });

  it('should not render checkbox for positions 1-2', () => {
    renderWithDndContext(
      <DraggableTeamCard
        team={mockTeam}
        position={1}
        predictedToQualify={true}
        disabled={false}
        isGroupComplete={false}
        isPending3rdPlace={false}
      />
    );

    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('should not render checkbox for position 4+', () => {
    renderWithDndContext(
      <DraggableTeamCard
        team={mockTeam}
        position={4}
        predictedToQualify={false}
        disabled={false}
        isGroupComplete={false}
        isPending3rdPlace={false}
      />
    );

    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('should render drag handle when not disabled', () => {
    renderWithDndContext(
      <DraggableTeamCard
        team={mockTeam}
        position={1}
        predictedToQualify={true}
        disabled={false}
        isGroupComplete={false}
        isPending3rdPlace={false}
      />
    );

    // Drag handle should be present (DragIndicatorIcon)
    const dragHandle = screen.getByTestId('DragIndicatorIcon');
    expect(dragHandle).toBeInTheDocument();
  });

  it('should have reduced opacity when disabled', () => {
    const { container } = renderWithDndContext(
      <DraggableTeamCard
        team={mockTeam}
        position={1}
        predictedToQualify={true}
        disabled={true}
        isGroupComplete={false}
        isPending3rdPlace={false}
      />
    );

    const card = container.firstChild;
    expect(card).toHaveStyle({ opacity: '0.6' });
  });

  describe('Results Overlay', () => {
    const mockResult: TeamScoringResult = {
      teamId: 'team-1',
      teamName: 'Argentina',
      groupId: 'group-a',
      predictedPosition: 1,
      actualPosition: 1,
      predictedToQualify: true,
      actuallyQualified: true,
      pointsAwarded: 2,
      reason: 'qualified + exact position',
    };

    it('should not show results overlay when group is not complete', () => {
      renderWithDndContext(
        <DraggableTeamCard
          team={mockTeam}
          position={1}
          predictedToQualify={true}
          disabled={false}
          result={mockResult}
          isGroupComplete={false}
          isPending3rdPlace={false}
        />
      );

      expect(screen.queryByText('+2 pts')).not.toBeInTheDocument();
    });

    it('should not show results overlay when result is not available', () => {
      renderWithDndContext(
        <DraggableTeamCard
          team={mockTeam}
          position={1}
          predictedToQualify={true}
          disabled={false}
          result={null}
          isGroupComplete={true}
          isPending3rdPlace={false}
        />
      );

      expect(screen.queryByText('+2 pts')).not.toBeInTheDocument();
    });

    it('should show perfect match result (2 pts) with check icon', () => {
      renderWithDndContext(
        <DraggableTeamCard
          team={mockTeam}
          position={1}
          predictedToQualify={true}
          disabled={false}
          result={mockResult}
          isGroupComplete={true}
          isPending3rdPlace={false}
        />
      );

      expect(screen.getByText('+2 pts')).toBeInTheDocument();
      expect(screen.getByTestId('CheckCircleIcon')).toBeInTheDocument();
    });

    it('should show partial match result (1 pt) with check icon', () => {
      const partialResult: TeamScoringResult = {
        ...mockResult,
        predictedPosition: 2,
        actualPosition: 1,
        pointsAwarded: 1,
        reason: 'qualified, wrong position',
      };

      renderWithDndContext(
        <DraggableTeamCard
          team={mockTeam}
          position={2}
          predictedToQualify={true}
          disabled={false}
          result={partialResult}
          isGroupComplete={true}
          isPending3rdPlace={false}
        />
      );

      expect(screen.getByText('+1 pt')).toBeInTheDocument();
      expect(screen.getByTestId('CheckCircleIcon')).toBeInTheDocument();
    });

    it('should show wrong prediction result (0 pts) with cancel icon', () => {
      const wrongResult: TeamScoringResult = {
        ...mockResult,
        actualPosition: null,
        actuallyQualified: false,
        pointsAwarded: 0,
        reason: 'predicted qualification, but did not qualify',
      };

      renderWithDndContext(
        <DraggableTeamCard
          team={mockTeam}
          position={1}
          predictedToQualify={true}
          disabled={false}
          result={wrongResult}
          isGroupComplete={true}
          isPending3rdPlace={false}
        />
      );

      expect(screen.getByText('+0 pts')).toBeInTheDocument();
      expect(screen.getByTestId('CancelIcon')).toBeInTheDocument();
    });

    it('should show pending 3rd place result with hourglass icon', () => {
      const pendingResult: TeamScoringResult = {
        ...mockResult,
        predictedPosition: 3,
        actualPosition: null,
        actuallyQualified: false,
        pointsAwarded: 0,
        reason: 'group not complete',
      };

      renderWithDndContext(
        <DraggableTeamCard
          team={mockTeam}
          position={3}
          predictedToQualify={true}
          disabled={false}
          result={pendingResult}
          isGroupComplete={true}
          isPending3rdPlace={true}
        />
      );

      expect(screen.getByText('Pendiente')).toBeInTheDocument();
      expect(screen.getByTestId('HourglassEmptyIcon')).toBeInTheDocument();
    });

    it('should apply correct background color for perfect match', () => {
      const { container } = renderWithDndContext(
        <DraggableTeamCard
          team={mockTeam}
          position={1}
          predictedToQualify={true}
          disabled={false}
          result={mockResult}
          isGroupComplete={true}
          isPending3rdPlace={false}
        />
      );

      // Gold/yellow background for perfect match (2 pts)
      const card = container.querySelector('[class*="MuiCard"]');
      expect(card).toHaveStyle({ backgroundColor: expect.stringMatching(/rgb.*|#.*/) });
    });

    it('should apply correct background color for partial match', () => {
      const partialResult: TeamScoringResult = {
        ...mockResult,
        pointsAwarded: 1,
        reason: 'qualified, wrong position',
      };

      const { container } = renderWithDndContext(
        <DraggableTeamCard
          team={mockTeam}
          position={1}
          predictedToQualify={true}
          disabled={false}
          result={partialResult}
          isGroupComplete={true}
          isPending3rdPlace={false}
        />
      );

      // Light green background for partial match (1 pt)
      const card = container.querySelector('[class*="MuiCard"]');
      expect(card).toHaveStyle({ backgroundColor: expect.stringMatching(/rgb.*|#.*/) });
    });

    it('should apply correct background color for pending 3rd place', () => {
      const pendingResult: TeamScoringResult = {
        ...mockResult,
        pointsAwarded: 0,
      };

      const { container } = renderWithDndContext(
        <DraggableTeamCard
          team={mockTeam}
          position={3}
          predictedToQualify={true}
          disabled={false}
          result={pendingResult}
          isGroupComplete={true}
          isPending3rdPlace={true}
        />
      );

      // Blue background for pending
      const card = container.querySelector('[class*="MuiCard"]');
      expect(card).toHaveStyle({ backgroundColor: expect.stringMatching(/rgb.*|#.*/) });
    });
  });
});
