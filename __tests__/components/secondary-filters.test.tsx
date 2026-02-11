import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithTheme } from '../utils/test-utils';
import { SecondaryFilters } from '../../app/components/secondary-filters';
import { TournamentGroup, PlayoffRound } from '../../app/db/tables-definition';

describe('SecondaryFilters', () => {
  const mockGroups: TournamentGroup[] = [
    {
      id: 'group-a',
      tournament_id: 'tournament-1',
      group_letter: 'a',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 'group-b',
      tournament_id: 'tournament-1',
      group_letter: 'b',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 'group-c',
      tournament_id: 'tournament-1',
      group_letter: 'c',
      created_at: new Date(),
      updated_at: new Date()
    }
  ];

  const mockRounds: PlayoffRound[] = [
    {
      id: 'round-1',
      tournament_id: 'tournament-1',
      round_name: 'Octavos de Final',
      round_order: 1,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 'round-2',
      tournament_id: 'tournament-1',
      round_name: 'Cuartos de Final',
      round_order: 2,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 'round-3',
      tournament_id: 'tournament-1',
      round_name: 'Semifinales',
      round_order: 3,
      created_at: new Date(),
      updated_at: new Date()
    }
  ];

  const defaultProps = {
    activeFilter: 'all' as const,
    groupFilter: null,
    roundFilter: null,
    groups: mockGroups,
    rounds: mockRounds,
    onGroupChange: vi.fn(),
    onRoundChange: vi.fn()
  };

  describe('visibility based on active filter', () => {
    it('renders nothing when activeFilter is "all"', () => {
      const { container } = renderWithTheme(<SecondaryFilters {...defaultProps} activeFilter="all" />);

      expect(container.firstChild).toBeNull();
    });

    it('renders nothing when activeFilter is "unpredicted"', () => {
      const { container } = renderWithTheme(<SecondaryFilters {...defaultProps} activeFilter="unpredicted" />);

      expect(container.firstChild).toBeNull();
    });

    it('renders nothing when activeFilter is "closingSoon"', () => {
      const { container } = renderWithTheme(<SecondaryFilters {...defaultProps} activeFilter="closingSoon" />);

      expect(container.firstChild).toBeNull();
    });

    it('renders group selector when activeFilter is "groups"', () => {
      renderWithTheme(<SecondaryFilters {...defaultProps} activeFilter="groups" />);

      expect(screen.getByLabelText('Grupo')).toBeInTheDocument();
    });

    it('renders round selector when activeFilter is "playoffs"', () => {
      renderWithTheme(<SecondaryFilters {...defaultProps} activeFilter="playoffs" />);

      expect(screen.getByLabelText('Ronda')).toBeInTheDocument();
    });
  });

  describe('group selector', () => {
    const groupProps = { ...defaultProps, activeFilter: 'groups' as const };

    it('renders all groups as options', async () => {
      const user = userEvent.setup();
      renderWithTheme(<SecondaryFilters {...groupProps} />);

      const select = screen.getByLabelText('Grupo');
      await user.click(select);

      expect(screen.getByRole('option', { name: 'Todos' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Grupo A' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Grupo B' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Grupo C' })).toBeInTheDocument();
    });

    it('displays selected group', () => {
      const { container } = renderWithTheme(<SecondaryFilters {...groupProps} groupFilter="group-a" />);

      // MUI Select uses a hidden input, check that the component renders with the filter
      expect(screen.getByLabelText('Grupo')).toBeInTheDocument();
      expect(container.querySelector('input[value="group-a"]')).toBeInTheDocument();
    });

    it('displays "Todos" when no group is selected', () => {
      const { container } = renderWithTheme(<SecondaryFilters {...groupProps} groupFilter={null} />);

      // When null, the value should be empty string
      expect(screen.getByLabelText('Grupo')).toBeInTheDocument();
      expect(container.querySelector('input[value=""]')).toBeInTheDocument();
    });

    it('calls onGroupChange when group is selected', async () => {
      const user = userEvent.setup();
      const onGroupChange = vi.fn();
      renderWithTheme(<SecondaryFilters {...groupProps} onGroupChange={onGroupChange} />);

      const select = screen.getByLabelText('Grupo');
      await user.click(select);

      const groupOption = screen.getByRole('option', { name: 'Grupo B' });
      await user.click(groupOption);

      expect(onGroupChange).toHaveBeenCalledWith('group-b');
    });

    it('calls onGroupChange with null when "Todos" is selected', async () => {
      const user = userEvent.setup();
      const onGroupChange = vi.fn();
      renderWithTheme(<SecondaryFilters {...groupProps} groupFilter="group-a" onGroupChange={onGroupChange} />);

      const select = screen.getByLabelText('Grupo');
      await user.click(select);

      const todosOption = screen.getByRole('option', { name: 'Todos' });
      await user.click(todosOption);

      expect(onGroupChange).toHaveBeenCalledWith(null);
    });

    it('uppercases group letters in display', async () => {
      const user = userEvent.setup();
      renderWithTheme(<SecondaryFilters {...groupProps} />);

      const select = screen.getByLabelText('Grupo');
      await user.click(select);

      // group_letter is 'a', 'b', 'c' but should display as 'A', 'B', 'C'
      expect(screen.getByRole('option', { name: 'Grupo A' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Grupo B' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Grupo C' })).toBeInTheDocument();
    });
  });

  describe('round selector', () => {
    const playoffProps = { ...defaultProps, activeFilter: 'playoffs' as const };

    it('renders all rounds as options', async () => {
      const user = userEvent.setup();
      renderWithTheme(<SecondaryFilters {...playoffProps} />);

      const select = screen.getByLabelText('Ronda');
      await user.click(select);

      expect(screen.getByRole('option', { name: 'Todos' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Octavos de Final' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Cuartos de Final' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Semifinales' })).toBeInTheDocument();
    });

    it('displays selected round', () => {
      const { container } = renderWithTheme(<SecondaryFilters {...playoffProps} roundFilter="round-2" />);

      // MUI Select uses a hidden input, check that the component renders with the filter
      expect(screen.getByLabelText('Ronda')).toBeInTheDocument();
      expect(container.querySelector('input[value="round-2"]')).toBeInTheDocument();
    });

    it('displays "Todos" when no round is selected', () => {
      const { container } = renderWithTheme(<SecondaryFilters {...playoffProps} roundFilter={null} />);

      // When null, the value should be empty string
      expect(screen.getByLabelText('Ronda')).toBeInTheDocument();
      expect(container.querySelector('input[value=""]')).toBeInTheDocument();
    });

    it('calls onRoundChange when round is selected', async () => {
      const user = userEvent.setup();
      const onRoundChange = vi.fn();
      renderWithTheme(<SecondaryFilters {...playoffProps} onRoundChange={onRoundChange} />);

      const select = screen.getByLabelText('Ronda');
      await user.click(select);

      const roundOption = screen.getByRole('option', { name: 'Semifinales' });
      await user.click(roundOption);

      expect(onRoundChange).toHaveBeenCalledWith('round-3');
    });

    it('calls onRoundChange with null when "Todos" is selected', async () => {
      const user = userEvent.setup();
      const onRoundChange = vi.fn();
      renderWithTheme(<SecondaryFilters {...playoffProps} roundFilter="round-1" onRoundChange={onRoundChange} />);

      const select = screen.getByLabelText('Ronda');
      await user.click(select);

      const todosOption = screen.getByRole('option', { name: 'Todos' });
      await user.click(todosOption);

      expect(onRoundChange).toHaveBeenCalledWith(null);
    });

    it('displays round names correctly', async () => {
      const user = userEvent.setup();
      renderWithTheme(<SecondaryFilters {...playoffProps} />);

      const select = screen.getByLabelText('Ronda');
      await user.click(select);

      expect(screen.getByRole('option', { name: 'Octavos de Final' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Cuartos de Final' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Semifinales' })).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('handles empty groups array', async () => {
      const user = userEvent.setup();
      renderWithTheme(<SecondaryFilters {...defaultProps} activeFilter="groups" groups={[]} />);

      const select = screen.getByLabelText('Grupo');
      await user.click(select);

      // Only "Todos" option should be present
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(1);
      expect(options[0]).toHaveTextContent('Todos');
    });

    it('handles empty rounds array', async () => {
      const user = userEvent.setup();
      renderWithTheme(<SecondaryFilters {...defaultProps} activeFilter="playoffs" rounds={[]} />);

      const select = screen.getByLabelText('Ronda');
      await user.click(select);

      // Only "Todos" option should be present
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(1);
      expect(options[0]).toHaveTextContent('Todos');
    });

    it('handles single group', async () => {
      const user = userEvent.setup();
      const singleGroup = [mockGroups[0]];
      renderWithTheme(<SecondaryFilters {...defaultProps} activeFilter="groups" groups={singleGroup} />);

      const select = screen.getByLabelText('Grupo');
      await user.click(select);

      expect(screen.getByRole('option', { name: 'Todos' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Grupo A' })).toBeInTheDocument();
    });

    it('handles single round', async () => {
      const user = userEvent.setup();
      const singleRound = [mockRounds[0]];
      renderWithTheme(<SecondaryFilters {...defaultProps} activeFilter="playoffs" rounds={singleRound} />);

      const select = screen.getByLabelText('Ronda');
      await user.click(select);

      expect(screen.getByRole('option', { name: 'Todos' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Octavos de Final' })).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('group selector has proper label', () => {
      renderWithTheme(<SecondaryFilters {...defaultProps} activeFilter="groups" />);

      const select = screen.getByLabelText('Grupo');
      expect(select).toHaveAccessibleName('Grupo');
    });

    it('round selector has proper label', () => {
      renderWithTheme(<SecondaryFilters {...defaultProps} activeFilter="playoffs" />);

      const select = screen.getByLabelText('Ronda');
      expect(select).toHaveAccessibleName('Ronda');
    });

    it('group selector is keyboard navigable', async () => {
      const user = userEvent.setup();
      renderWithTheme(<SecondaryFilters {...defaultProps} activeFilter="groups" />);

      const select = screen.getByLabelText('Grupo');

      await user.tab();
      expect(select).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(screen.getByRole('option', { name: 'Todos' })).toBeInTheDocument();
    });

    it('round selector is keyboard navigable', async () => {
      const user = userEvent.setup();
      renderWithTheme(<SecondaryFilters {...defaultProps} activeFilter="playoffs" />);

      const select = screen.getByLabelText('Ronda');

      await user.tab();
      expect(select).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(screen.getByRole('option', { name: 'Todos' })).toBeInTheDocument();
    });
  });

  describe('layout', () => {
    it('renders full width FormControl for groups', () => {
      const { container } = renderWithTheme(<SecondaryFilters {...defaultProps} activeFilter="groups" />);
      const formControl = container.querySelector('.MuiFormControl-root');

      expect(formControl).toHaveClass('MuiFormControl-fullWidth');
    });

    it('renders full width FormControl for rounds', () => {
      const { container } = renderWithTheme(<SecondaryFilters {...defaultProps} activeFilter="playoffs" />);
      const formControl = container.querySelector('.MuiFormControl-root');

      expect(formControl).toHaveClass('MuiFormControl-fullWidth');
    });

    it('uses small size for groups', () => {
      const { container } = renderWithTheme(<SecondaryFilters {...defaultProps} activeFilter="groups" />);
      const select = container.querySelector('.MuiInputBase-root');

      expect(select).toHaveClass('MuiInputBase-sizeSmall');
    });

    it('uses small size for rounds', () => {
      const { container } = renderWithTheme(<SecondaryFilters {...defaultProps} activeFilter="playoffs" />);
      const select = container.querySelector('.MuiInputBase-root');

      expect(select).toHaveClass('MuiInputBase-sizeSmall');
    });
  });
});
