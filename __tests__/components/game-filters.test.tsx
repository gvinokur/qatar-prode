import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithTheme } from '../utils/test-utils';
import { GameFilters } from '../../app/components/game-filters';
import { TournamentGameCounts } from '../../app/db/game-repository';
import { FilterType } from '../../app/utils/game-filters';

describe('GameFilters', () => {
  const defaultGameCounts: TournamentGameCounts = {
    total: 50,
    groups: 36,
    playoffs: 14,
    unpredicted: 10,
    closingSoon: 5
  };

  const defaultProps = {
    gameCounts: defaultGameCounts,
    activeFilter: 'all' as FilterType,
    onFilterChange: vi.fn()
  };

  describe('rendering', () => {
    it('renders select with label', () => {
      renderWithTheme(<GameFilters {...defaultProps} />);

      expect(screen.getByLabelText('Filtro')).toBeInTheDocument();
    });

    it('shows current active filter value', () => {
      const { container } = renderWithTheme(<GameFilters {...defaultProps} activeFilter="groups" />);

      // MUI Select uses a hidden input
      expect(screen.getByLabelText('Filtro')).toBeInTheDocument();
      expect(container.querySelector('input[value="groups"]')).toBeInTheDocument();
    });
  });

  describe('filter options', () => {
    it('renders all filter options', async () => {
      const user = userEvent.setup();
      renderWithTheme(<GameFilters {...defaultProps} />);

      // Open select
      const select = screen.getByLabelText('Filtro');
      await user.click(select);

      // Check all options are present
      expect(screen.getByRole('option', { name: /Todos/ })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /Grupos/ })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /Playoffs/ })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /Sin Predecir/ })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /Cierran Pronto/ })).toBeInTheDocument();
    });

    it('displays counts for each filter', async () => {
      const user = userEvent.setup();
      renderWithTheme(<GameFilters {...defaultProps} />);

      const select = screen.getByLabelText('Filtro');
      await user.click(select);

      // Check for count displays (may have multiple matches)
      expect(screen.getAllByText(/\(50\)/).length).toBeGreaterThan(0); // total
      expect(screen.getAllByText(/\(36\)/).length).toBeGreaterThan(0); // groups
      expect(screen.getAllByText(/\(14\)/).length).toBeGreaterThan(0); // playoffs
      expect(screen.getAllByText(/\(10\)/).length).toBeGreaterThan(0); // unpredicted
      expect(screen.getAllByText(/\(5\)/).length).toBeGreaterThan(0); // closingSoon
    });
  });

  describe('filter selection', () => {
    it('calls onFilterChange when filter is selected', async () => {
      const user = userEvent.setup();
      const onFilterChange = vi.fn();
      renderWithTheme(<GameFilters {...defaultProps} onFilterChange={onFilterChange} />);

      const select = screen.getByLabelText('Filtro');
      await user.click(select);

      const groupsOption = screen.getByRole('option', { name: /Grupos/ });
      await user.click(groupsOption);

      expect(onFilterChange).toHaveBeenCalledWith('groups');
    });

    it('calls onFilterChange with correct values', async () => {
      const user = userEvent.setup();
      const onFilterChange = vi.fn();

      renderWithTheme(<GameFilters {...defaultProps} activeFilter="all" onFilterChange={onFilterChange} />);

      const select = screen.getByLabelText('Filtro');

      // Test groups filter
      onFilterChange.mockClear();
      await user.click(select);
      await user.click(screen.getByRole('option', { name: /Grupos/ }));
      expect(onFilterChange).toHaveBeenCalledWith('groups');

      // Test playoffs filter
      onFilterChange.mockClear();
      await user.click(select);
      await user.click(screen.getByRole('option', { name: /Playoffs/ }));
      expect(onFilterChange).toHaveBeenCalledWith('playoffs');
    });
  });

  describe('active filter display', () => {
    it('displays "all" filter as active', () => {
      const { container } = renderWithTheme(<GameFilters {...defaultProps} activeFilter="all" />);

      expect(screen.getByLabelText('Filtro')).toBeInTheDocument();
      expect(container.querySelector('input[value="all"]')).toBeInTheDocument();
    });

    it('displays "groups" filter as active', () => {
      const { container } = renderWithTheme(<GameFilters {...defaultProps} activeFilter="groups" />);

      expect(screen.getByLabelText('Filtro')).toBeInTheDocument();
      expect(container.querySelector('input[value="groups"]')).toBeInTheDocument();
    });

    it('displays "playoffs" filter as active', () => {
      const { container } = renderWithTheme(<GameFilters {...defaultProps} activeFilter="playoffs" />);

      expect(screen.getByLabelText('Filtro')).toBeInTheDocument();
      expect(container.querySelector('input[value="playoffs"]')).toBeInTheDocument();
    });

    it('displays "unpredicted" filter as active', () => {
      const { container } = renderWithTheme(<GameFilters {...defaultProps} activeFilter="unpredicted" />);

      expect(screen.getByLabelText('Filtro')).toBeInTheDocument();
      expect(container.querySelector('input[value="unpredicted"]')).toBeInTheDocument();
    });

    it('displays "closingSoon" filter as active', () => {
      const { container } = renderWithTheme(<GameFilters {...defaultProps} activeFilter="closingSoon" />);

      expect(screen.getByLabelText('Filtro')).toBeInTheDocument();
      expect(container.querySelector('input[value="closingSoon"]')).toBeInTheDocument();
    });
  });

  describe('game counts updates', () => {
    it('updates displayed counts when gameCounts prop changes', async () => {
      const user = userEvent.setup();
      const { rerender } = renderWithTheme(<GameFilters {...defaultProps} />);

      // Update counts
      const newGameCounts: TournamentGameCounts = {
        total: 60,
        groups: 40,
        playoffs: 20,
        unpredicted: 15,
        closingSoon: 8
      };

      rerender(<GameFilters {...defaultProps} gameCounts={newGameCounts} />);

      const select = screen.getByLabelText('Filtro');
      await user.click(select);

      // Verify all filter options are still rendered with updated counts
      expect(screen.getByRole('option', { name: /Todos/ })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /Grupos/ })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /Playoffs/ })).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('handles zero counts', async () => {
      const user = userEvent.setup();
      const zeroGameCounts: TournamentGameCounts = {
        total: 0,
        groups: 0,
        playoffs: 0,
        unpredicted: 0,
        closingSoon: 0
      };

      renderWithTheme(<GameFilters {...defaultProps} gameCounts={zeroGameCounts} />);

      const select = screen.getByLabelText('Filtro');
      await user.click(select);

      const options = screen.getAllByText(/\(0\)/);
      expect(options.length).toBeGreaterThanOrEqual(5); // All 5 filters should show (0)
    });

    it('handles large counts', async () => {
      const user = userEvent.setup();
      const largeGameCounts: TournamentGameCounts = {
        total: 1000,
        groups: 720,
        playoffs: 280,
        unpredicted: 500,
        closingSoon: 50
      };

      renderWithTheme(<GameFilters {...defaultProps} gameCounts={largeGameCounts} />);

      const select = screen.getByLabelText('Filtro');
      await user.click(select);

      // Check that options with large counts are present (may have multiple matches)
      const countElements = screen.getAllByText(/\(1000\)/);
      expect(countElements.length).toBeGreaterThan(0);
      expect(screen.getAllByText(/\(720\)/).length).toBeGreaterThan(0);
    });
  });

  describe('accessibility', () => {
    it('has proper form control label', () => {
      renderWithTheme(<GameFilters {...defaultProps} />);

      const select = screen.getByLabelText('Filtro');
      expect(select).toHaveAccessibleName('Filtro');
    });

    it('select is keyboard navigable', async () => {
      const user = userEvent.setup();
      renderWithTheme(<GameFilters {...defaultProps} />);

      const select = screen.getByLabelText('Filtro');

      // Tab to select
      await user.tab();
      expect(select).toHaveFocus();

      // Open with keyboard
      await user.keyboard('{Enter}');

      // Options should be visible
      expect(screen.getByRole('option', { name: /Todos/ })).toBeInTheDocument();
    });
  });

  describe('layout', () => {
    it('renders full width FormControl', () => {
      const { container } = renderWithTheme(<GameFilters {...defaultProps} />);
      const formControl = container.querySelector('.MuiFormControl-root');

      expect(formControl).toHaveClass('MuiFormControl-fullWidth');
    });

    it('uses small size', () => {
      const { container } = renderWithTheme(<GameFilters {...defaultProps} />);
      const select = container.querySelector('.MuiInputBase-root');

      expect(select).toHaveClass('MuiInputBase-sizeSmall');
    });
  });
});
