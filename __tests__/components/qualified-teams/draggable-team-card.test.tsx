import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DndContext } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import DraggableTeamCard from '../../../app/components/qualified-teams/draggable-team-card';
import { renderWithTheme } from '../../utils/test-utils';
import { testFactories } from '../../db/test-factories';

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
      />
    );

    const card = container.firstChild;
    expect(card).toHaveStyle({ opacity: '0.6' });
  });
});
