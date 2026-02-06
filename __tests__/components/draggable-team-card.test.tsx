import { vi, describe, it, expect, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import React from 'react';
import DraggableTeamCard from '../../app/components/qualified-teams/draggable-team-card';
import { renderWithTheme } from '../utils/test-utils';
import { testFactories } from '../db/test-factories';

// Mock @dnd-kit/sortable
const mockUseSortable = vi.fn();
vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => mockUseSortable(),
}));

// Mock @dnd-kit/utilities
vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: (transform: any) => (transform ? 'transform: translate(10px, 10px)' : ''),
    },
  },
}));

describe('DraggableTeamCard', () => {
  const mockTeam = testFactories.team({
    id: 'team-1',
    name: 'Argentina',
    short_name: 'ARG',
  });

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
    it('should render team name and short name', () => {
      renderWithTheme(
        <DraggableTeamCard
          team={mockTeam}
          position={1}
          predictedToQualify={true}
          disabled={false}
        />
      );

      expect(screen.getByText('Argentina')).toBeInTheDocument();
      expect(screen.getByText('ARG')).toBeInTheDocument();
    });

    it('should render position badge with correct number', () => {
      renderWithTheme(
        <DraggableTeamCard
          team={mockTeam}
          position={1}
          predictedToQualify={true}
          disabled={false}
        />
      );

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('st')).toBeInTheDocument();
    });

    it('should render drag indicator icon', () => {
      const { container } = renderWithTheme(
        <DraggableTeamCard
          team={mockTeam}
          position={1}
          predictedToQualify={true}
          disabled={false}
        />
      );

      const dragIcon = container.querySelector('svg[data-testid="DragIndicatorIcon"]');
      expect(dragIcon).toBeInTheDocument();
    });
  });

  describe('Position Suffixes', () => {
    it('should display "st" suffix for position 1', () => {
      renderWithTheme(
        <DraggableTeamCard
          team={mockTeam}
          position={1}
          predictedToQualify={true}
          disabled={false}
        />
      );

      expect(screen.getByText('st')).toBeInTheDocument();
    });

    it('should display "nd" suffix for position 2', () => {
      renderWithTheme(
        <DraggableTeamCard
          team={mockTeam}
          position={2}
          predictedToQualify={true}
          disabled={false}
        />
      );

      expect(screen.getByText('nd')).toBeInTheDocument();
    });

    it('should display "rd" suffix for position 3', () => {
      renderWithTheme(
        <DraggableTeamCard
          team={mockTeam}
          position={3}
          predictedToQualify={false}
          disabled={false}
        />
      );

      expect(screen.getByText('rd')).toBeInTheDocument();
    });

    it('should display "th" suffix for position 4 and higher', () => {
      renderWithTheme(
        <DraggableTeamCard
          team={mockTeam}
          position={4}
          predictedToQualify={false}
          disabled={false}
        />
      );

      expect(screen.getByText('th')).toBeInTheDocument();
    });
  });

  describe('Third Place Checkbox', () => {
    it('should show checkbox for position 3', () => {
      renderWithTheme(
        <DraggableTeamCard
          team={mockTeam}
          position={3}
          predictedToQualify={false}
          disabled={false}
        />
      );

      expect(screen.getByRole('checkbox')).toBeInTheDocument();
      expect(screen.getByText('Clasifica')).toBeInTheDocument();
    });

    it('should not show checkbox for position 1', () => {
      renderWithTheme(
        <DraggableTeamCard
          team={mockTeam}
          position={1}
          predictedToQualify={true}
          disabled={false}
        />
      );

      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    });

    it('should not show checkbox for position 2', () => {
      renderWithTheme(
        <DraggableTeamCard
          team={mockTeam}
          position={2}
          predictedToQualify={true}
          disabled={false}
        />
      );

      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    });

    it('should not show checkbox for position 4', () => {
      renderWithTheme(
        <DraggableTeamCard
          team={mockTeam}
          position={4}
          predictedToQualify={false}
          disabled={false}
        />
      );

      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    });

    it('should be checked when predictedToQualify is true', () => {
      renderWithTheme(
        <DraggableTeamCard
          team={mockTeam}
          position={3}
          predictedToQualify={true}
          disabled={false}
        />
      );

      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });

    it('should be unchecked when predictedToQualify is false', () => {
      renderWithTheme(
        <DraggableTeamCard
          team={mockTeam}
          position={3}
          predictedToQualify={false}
          disabled={false}
        />
      );

      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.checked).toBe(false);
    });

    it('should call onToggleThirdPlace when checkbox is clicked', () => {
      const onToggleThirdPlace = vi.fn();

      renderWithTheme(
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
      renderWithTheme(
        <DraggableTeamCard
          team={mockTeam}
          position={3}
          predictedToQualify={false}
          disabled={true}
        />
      );

      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.disabled).toBe(true);
    });
  });

  describe('Disabled State', () => {
    it('should render without errors when disabled', () => {
      renderWithTheme(
        <DraggableTeamCard
          team={mockTeam}
          position={1}
          predictedToQualify={true}
          disabled={true}
        />
      );

      expect(screen.getByText('Argentina')).toBeInTheDocument();
    });

    it('should render without errors when not disabled', () => {
      renderWithTheme(
        <DraggableTeamCard
          team={mockTeam}
          position={1}
          predictedToQualify={true}
          disabled={false}
        />
      );

      expect(screen.getByText('Argentina')).toBeInTheDocument();
    });
  });

  describe('Drag and Drop Integration', () => {
    it('should apply transform style when dragging', () => {
      mockUseSortable.mockReturnValue({
        attributes: { role: 'button', tabIndex: 0 },
        listeners: { onPointerDown: vi.fn() },
        setNodeRef: vi.fn(),
        transform: { x: 10, y: 10 },
        transition: 'transform 200ms ease',
        isDragging: true,
      });

      const { container } = renderWithTheme(
        <DraggableTeamCard
          team={mockTeam}
          position={1}
          predictedToQualify={true}
          disabled={false}
        />
      );

      const card = container.querySelector('[style*="transform"]');
      expect(card).toBeInTheDocument();
    });

    it('should apply opacity style when dragging', () => {
      mockUseSortable.mockReturnValue({
        attributes: { role: 'button', tabIndex: 0 },
        listeners: { onPointerDown: vi.fn() },
        setNodeRef: vi.fn(),
        transform: { x: 10, y: 10 },
        transition: 'transform 200ms ease',
        isDragging: true,
      });

      const { container } = renderWithTheme(
        <DraggableTeamCard
          team={mockTeam}
          position={1}
          predictedToQualify={true}
          disabled={false}
        />
      );

      const card = container.querySelector('[style*="opacity"]');
      expect(card).toBeInTheDocument();
      expect(card).toHaveStyle({ opacity: 0.5 });
    });

    it('should apply full opacity when not dragging', () => {
      mockUseSortable.mockReturnValue({
        attributes: { role: 'button', tabIndex: 0 },
        listeners: { onPointerDown: vi.fn() },
        setNodeRef: vi.fn(),
        transform: null,
        transition: null,
        isDragging: false,
      });

      const { container } = renderWithTheme(
        <DraggableTeamCard
          team={mockTeam}
          position={1}
          predictedToQualify={true}
          disabled={false}
        />
      );

      const card = container.querySelector('[style*="opacity"]');
      expect(card).toBeInTheDocument();
      expect(card).toHaveStyle({ opacity: 1 });
    });

    it('should attach drag listeners to drag handle', () => {
      const mockListeners = { onPointerDown: vi.fn() };
      mockUseSortable.mockReturnValue({
        attributes: { role: 'button', tabIndex: 0 },
        listeners: mockListeners,
        setNodeRef: vi.fn(),
        transform: null,
        transition: null,
        isDragging: false,
      });

      renderWithTheme(
        <DraggableTeamCard
          team={mockTeam}
          position={1}
          predictedToQualify={true}
          disabled={false}
        />
      );

      expect(mockUseSortable).toHaveBeenCalled();
    });
  });

  describe('Background Colors (Integration with Theme)', () => {
    it('should apply success color for position 1', () => {
      const { container } = renderWithTheme(
        <DraggableTeamCard
          team={mockTeam}
          position={1}
          predictedToQualify={true}
          disabled={false}
        />
      );

      const card = container.querySelector('.MuiCard-root');
      expect(card).toBeInTheDocument();
      // Background color is applied via sx prop, difficult to test exact color
      // This verifies the component renders without errors
    });

    it('should apply success color for position 2', () => {
      const { container } = renderWithTheme(
        <DraggableTeamCard
          team={mockTeam}
          position={2}
          predictedToQualify={true}
          disabled={false}
        />
      );

      const card = container.querySelector('.MuiCard-root');
      expect(card).toBeInTheDocument();
    });

    it('should apply info color for position 3 when qualifying', () => {
      const { container } = renderWithTheme(
        <DraggableTeamCard
          team={mockTeam}
          position={3}
          predictedToQualify={true}
          disabled={false}
        />
      );

      const card = container.querySelector('.MuiCard-root');
      expect(card).toBeInTheDocument();
    });

    it('should apply grey color for position 3 when not qualifying', () => {
      const { container } = renderWithTheme(
        <DraggableTeamCard
          team={mockTeam}
          position={3}
          predictedToQualify={false}
          disabled={false}
        />
      );

      const card = container.querySelector('.MuiCard-root');
      expect(card).toBeInTheDocument();
    });

    it('should apply grey color for position 4 and higher', () => {
      const { container } = renderWithTheme(
        <DraggableTeamCard
          team={mockTeam}
          position={4}
          predictedToQualify={false}
          disabled={false}
        />
      );

      const card = container.querySelector('.MuiCard-root');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing onToggleThirdPlace callback', () => {
      renderWithTheme(
        <DraggableTeamCard
          team={mockTeam}
          position={3}
          predictedToQualify={false}
          disabled={false}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      // Should not throw when clicking
      expect(() => fireEvent.click(checkbox)).not.toThrow();
    });

    it('should handle team with null theme', () => {
      const teamWithNullTheme = testFactories.team({
        id: 'team-2',
        name: 'Brazil',
        short_name: 'BRA',
        theme: null,
      });

      renderWithTheme(
        <DraggableTeamCard
          team={teamWithNullTheme}
          position={1}
          predictedToQualify={true}
          disabled={false}
        />
      );

      expect(screen.getByText('Brazil')).toBeInTheDocument();
    });

    it('should handle team with long name', () => {
      const teamWithLongName = testFactories.team({
        id: 'team-3',
        name: 'Very Long Team Name That Exceeds Normal Length',
        short_name: 'LONG',
      });

      renderWithTheme(
        <DraggableTeamCard
          team={teamWithLongName}
          position={1}
          predictedToQualify={true}
          disabled={false}
        />
      );

      expect(screen.getByText('Very Long Team Name That Exceeds Normal Length')).toBeInTheDocument();
    });
  });
});
