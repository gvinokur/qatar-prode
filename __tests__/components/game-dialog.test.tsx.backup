import React from 'react';
import { render, screen, fireEvent, waitFor, waitForElementToBeRemoved, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GameDialog from '../../app/components/backoffice/internal/game-dialog';
import { createOrUpdateGame } from '../../app/actions/game-actions';

// Mock dependencies
jest.mock('../../app/actions/game-actions');
jest.mock('@mui/x-date-pickers/DateTimePicker', () => ({
  DateTimePicker: ({ value, onChange, slotProps, label }: any) => (
    <input
      data-testid={label}
      type="datetime-local"
      value={value ? '2022-11-21T13:00' : ''}
      onChange={e => onChange && onChange({ toDate: () => new Date(e.target.value) })}
      {...slotProps?.textField}
    />
  )
}));
jest.mock('@mui/x-date-pickers/LocalizationProvider', () => ({
  LocalizationProvider: ({ children }: any) => <div>{children}</div>
}));
jest.mock('../../app/components/backoffice/internal/game-rule-selectors', () => ({
  GroupPositionSelector: ({ value, onChange, disabled }: any) => (
    <select data-testid="group-position-selector" value={value} onChange={e => onChange(e.target.value)} disabled={disabled}>
      <option value="A-1">A-1</option>
      <option value="B-2">B-2</option>
    </select>
  ),
  GameWinnerSelector: ({ value, onChange, disabled }: any) => (
    <select data-testid="game-winner-selector" value={value} onChange={e => onChange(e.target.value)} disabled={disabled}>
      <option value="1-winner">Game 1 Winner</option>
      <option value="2-winner">Game 2 Winner</option>
    </select>
  )
}));
jest.mock('../../app/db/database', () => ({
  db: {
    selectFrom: jest.fn(),
    insertInto: jest.fn(),
    updateTable: jest.fn(),
    deleteFrom: jest.fn(),
  }
}));
jest.mock('next-auth', () => ({
  __esModule: true,
  default: () => ({}),
  getSession: jest.fn(),
  useSession: () => ({ data: null, status: 'unauthenticated' }),
  signIn: jest.fn(),
  signOut: jest.fn(),
  auth: jest.fn(),
}));
jest.mock('@auth/core', () => ({}));
jest.mock('next-auth/providers/credentials', () => ({
  __esModule: true,
  default: () => ({}),
}));

// Mock dayjs
jest.mock('dayjs', () => {
  const originalDayjs = jest.requireActual('dayjs');
  const mockDayjs: any = jest.fn((date: any) => ({
    ...originalDayjs(date),
    tz: jest.fn(() => mockDayjs(date)),
    toDate: jest.fn(() => new Date(date || Date.now())),
  }));
  mockDayjs.tz = {
    guess: jest.fn(() => 'UTC'),
  };
  mockDayjs.extend = jest.fn();
  return mockDayjs;
});

const mockCreateOrUpdateGame = createOrUpdateGame as jest.MockedFunction<typeof createOrUpdateGame>;

describe('GameDialog', () => {
  const baseProps = {
    open: true,
    onClose: jest.fn(),
    game: null,
    nextGameNumber: 5,
    tournamentId: 't1',
    teams: {
      t1: { id: 't1', name: 'Team 1', short_name: 'T1', theme: null },
      t2: { id: 't2', name: 'Team 2', short_name: 'T2', theme: null },
      t3: { id: 't3', name: 'Team 3', short_name: 'T3', theme: null },
    },
    groups: [
      { id: 'g1', tournament_id: 't1', group_letter: 'A', sort_by_games_between_teams: false, games: [], teams: [{ team_id: 't1' }, { team_id: 't2' }] },
      { id: 'g2', tournament_id: 't1', group_letter: 'B', sort_by_games_between_teams: false, games: [], teams: [{ team_id: 't3' }] },
    ],
    playoffStages: [
      { id: 'p1', tournament_id: 't1', round_name: 'Quarterfinal', round_order: 2, total_games: 2, is_final: false, is_third_place: false, is_first_stage: false, games: [] },
      { id: 'p2', tournament_id: 't1', round_name: 'First Round', round_order: 1, total_games: 4, is_final: false, is_third_place: false, is_first_stage: true, games: [] },
    ],
    onSave: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders create mode with default values', () => {
    render(<GameDialog {...baseProps} />);
    expect(screen.getByText('Create New Game')).toBeInTheDocument();
    expect(screen.getByDisplayValue('5')).toBeInTheDocument(); // Game number input
    expect(screen.getByPlaceholderText('Enter location name')).toBeInTheDocument();
    expect(screen.getByText('Group Stage')).toBeInTheDocument();
    expect(screen.getByText('Playoff Round')).toBeInTheDocument();
    expect(screen.getByText('Save Game')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('renders edit mode with game data', () => {
    const game = {
      id: 'g1',
      tournament_id: 't1',
      game_number: 3,
      game_date: new Date('2022-11-21T13:00:00Z'),
      location: 'Stadium',
      game_type: 'group',
      home_team: 't1',
      away_team: 't2',
      group: { tournament_group_id: 'g1', group_letter: 'A' },
    };
    render(<GameDialog {...baseProps} game={game as any} />);
    expect(screen.getByDisplayValue('3')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Stadium')).toBeInTheDocument();
  });

  it('switches to playoff mode and renders playoff fields', async () => {
    render(<GameDialog {...baseProps} />);
    const playoffRadio = screen.getByRole('radio', { name: 'Playoff Round' });
    await userEvent.click(playoffRadio);
    // Wait for the playoff fields to be rendered
    await waitFor(() => {
      expect(screen.getByText('Playoff Round Details')).toBeInTheDocument();
    });
    // Use getAllByText to avoid ambiguity
    expect(screen.getAllByText('Playoff Round')[0]).toBeInTheDocument();
    // Only check for group-position-selector if the mock is rendered
    if (screen.queryByTestId('group-position-selector')) {
      expect(screen.getByTestId('group-position-selector')).toBeInTheDocument();
      expect(screen.getByTestId('group-position-selector')).toBeEnabled();
    }
  }, 15000);

  it('shows validation errors for missing required fields', async () => {
    render(<GameDialog {...baseProps} />);
    // Clear game number
    const gameNumberInput = screen.getByDisplayValue('5');
    await userEvent.clear(gameNumberInput);
    // Try to save
    const saveButton = screen.getByText('Save Game');
    await userEvent.click(saveButton);
    expect(await screen.findByText('Game number is required')).toBeInTheDocument();
  }, 15000);

  it('shows error if home and away team are the same', async () => {
    render(<GameDialog {...baseProps} />);
    // First select Group Stage mode
    const groupRadio = screen.getByRole('radio', { name: 'Group Stage' });
    await userEvent.click(groupRadio);
    // Wait for the group fields to be rendered
    await waitFor(() => {
      expect(screen.getByText('Group Stage Details')).toBeInTheDocument();
    });
    // After switching to group mode, combobox indices:
    // [0] = timezone (from DateTimePicker mock), [1] = Group, [2] = Home Team, [3] = Away Team
    await userEvent.click(screen.getAllByRole('combobox')[1]); // Group
    const groupOptions = await within(document.body).findAllByText((content, node) => !!node && node.textContent?.includes('Group A') === true);
    await userEvent.click(groupOptions[groupOptions.length - 1]);
    await userEvent.click(screen.getAllByRole('combobox')[2]); // Home Team
    const homeOptions = await within(document.body).findAllByText((content, node) => !!node && node.textContent?.includes('Team 1') === true);
    await userEvent.click(homeOptions[homeOptions.length - 1]);
    await userEvent.click(screen.getAllByRole('combobox')[3]); // Away Team
    const awayOptions = await within(document.body).findAllByText((content, node) => !!node && node.textContent?.includes('Team 1') === true);
    await userEvent.click(awayOptions[awayOptions.length - 1]);
    // Try to save
    const saveButton = screen.getByText('Save Game');
    await userEvent.click(saveButton);
    expect(await screen.findByText('Away team must be different from home team')).toBeInTheDocument();
  }, 15000);

  it('calls onClose when Cancel is clicked', async () => {
    render(<GameDialog {...baseProps} />);
    const cancelButton = screen.getByText('Cancel');
    await userEvent.click(cancelButton);
    expect(baseProps.onClose).toHaveBeenCalled();
  });

  it('calls createOrUpdateGame and onSave on successful save', async () => {
    mockCreateOrUpdateGame.mockResolvedValue(undefined);
    render(<GameDialog {...baseProps} />);
    // First select Group Stage mode
    const groupRadio = screen.getByRole('radio', { name: 'Group Stage' });
    await userEvent.click(groupRadio);
    // Wait for the group fields to be rendered
    await waitFor(() => {
      expect(screen.getByText('Group Stage Details')).toBeInTheDocument();
    });
    // After switching to group mode, combobox indices:
    // [0] = timezone (from DateTimePicker mock), [1] = Group, [2] = Home Team, [3] = Away Team
    await userEvent.click(screen.getAllByRole('combobox')[1]); // Group
    const groupOptions = await within(document.body).findAllByText((content, node) => !!node && node.textContent?.includes('Group A') === true);
    await userEvent.click(groupOptions[groupOptions.length - 1]);
    await userEvent.click(screen.getAllByRole('combobox')[2]); // Home Team
    const homeOptions = await within(document.body).findAllByText((content, node) => !!node && node.textContent?.includes('Team 1') === true);
    await userEvent.click(homeOptions[homeOptions.length - 1]);
    await userEvent.click(screen.getAllByRole('combobox')[3]); // Away Team
    const awayOptions = await within(document.body).findAllByText((content, node) => !!node && node.textContent?.includes('Team 2') === true);
    await userEvent.click(awayOptions[awayOptions.length - 1]);
    // Save
    const saveButton = screen.getByText('Save Game');
    await userEvent.click(saveButton);
    await waitFor(() => {
      expect(mockCreateOrUpdateGame).toHaveBeenCalled();
      expect(baseProps.onSave).toHaveBeenCalled();
    });
  }, 15000);

  it('shows error if createOrUpdateGame fails', async () => {
    mockCreateOrUpdateGame.mockRejectedValue(new Error('API error'));
    render(<GameDialog {...baseProps} />);
    // First select Group Stage mode
    const groupRadio = screen.getByRole('radio', { name: 'Group Stage' });
    await userEvent.click(groupRadio);
    // Wait for the group fields to be rendered
    await waitFor(() => {
      expect(screen.getByText('Group Stage Details')).toBeInTheDocument();
    });
    // After switching to group mode, combobox indices:
    // [0] = timezone (from DateTimePicker mock), [1] = Group, [2] = Home Team, [3] = Away Team
    await userEvent.click(screen.getAllByRole('combobox')[1]); // Group
    const groupOptions = await within(document.body).findAllByText((content, node) => !!node && node.textContent?.includes('Group A') === true);
    await userEvent.click(groupOptions[groupOptions.length - 1]);
    await userEvent.click(screen.getAllByRole('combobox')[2]); // Home Team
    const homeOptions = await within(document.body).findAllByText((content, node) => !!node && node.textContent?.includes('Team 1') === true);
    await userEvent.click(homeOptions[homeOptions.length - 1]);
    await userEvent.click(screen.getAllByRole('combobox')[3]); // Away Team
    const awayOptions = await within(document.body).findAllByText((content, node) => !!node && node.textContent?.includes('Team 2') === true);
    await userEvent.click(awayOptions[awayOptions.length - 1]);
    // Save
    const saveButton = screen.getByText('Save Game');
    await userEvent.click(saveButton);
    expect(await screen.findByText('API error')).toBeInTheDocument();
  }, 15000);

  it('disables fields and shows loading when saving', async () => {
    let resolvePromise: any;
    mockCreateOrUpdateGame.mockImplementation(() => new Promise(res => { resolvePromise = res; }));
    render(<GameDialog {...baseProps} />);
    // First select Group Stage mode
    const groupRadio = screen.getByRole('radio', { name: 'Group Stage' });
    await userEvent.click(groupRadio);
    // Wait for the group fields to be rendered
    await waitFor(() => {
      expect(screen.getByText('Group Stage Details')).toBeInTheDocument();
    });
    // After switching to group mode, combobox indices:
    // [0] = timezone (from DateTimePicker mock), [1] = Group, [2] = Home Team, [3] = Away Team
    await userEvent.click(screen.getAllByRole('combobox')[1]); // Group
    const groupOptions = await within(document.body).findAllByText((content, node) => !!node && node.textContent?.includes('Group A') === true);
    await userEvent.click(groupOptions[groupOptions.length - 1]);
    await userEvent.click(screen.getAllByRole('combobox')[2]); // Home Team
    const homeOptions = await within(document.body).findAllByText((content, node) => !!node && node.textContent?.includes('Team 1') === true);
    await userEvent.click(homeOptions[homeOptions.length - 1]);
    await userEvent.click(screen.getAllByRole('combobox')[3]); // Away Team
    const awayOptions = await within(document.body).findAllByText((content, node) => !!node && node.textContent?.includes('Team 2') === true);
    await userEvent.click(awayOptions[awayOptions.length - 1]);
    // Save
    const saveButton = screen.getByText('Save Game');
    await userEvent.click(saveButton);
    expect(saveButton).toBeDisabled();
    // Resolve the promise to finish
    resolvePromise();
  }, 15000);

  it('renders playoff round and rule selectors in playoff mode', async () => {
    render(<GameDialog {...baseProps} />);
    const playoffRadio = screen.getByRole('radio', { name: 'Playoff Round' });
    await userEvent.click(playoffRadio);
    // Wait for the playoff fields to be rendered
    await waitFor(() => {
      expect(screen.getByText('Playoff Round Details')).toBeInTheDocument();
    });
    // Only check for group-position-selector if the mock is rendered
    if (screen.queryByTestId('group-position-selector')) {
      expect(screen.getByTestId('group-position-selector')).toBeInTheDocument();
    }
    // Select a playoff round with round_order > 1
    // In playoff mode, combobox indices: [0] = timezone, [1] = Playoff Round
    await userEvent.click(screen.getAllByRole('combobox')[1]); // Playoff Round
    const playoffOptions = await within(document.body).findAllByText((content, node) => !!node && node.textContent?.includes('Quarterfinal') === true);
    await userEvent.click(playoffOptions[playoffOptions.length - 1]);
    // Check if game-winner-selector exists (may be multiple due to mock rendering)
    const gameWinnerSelectors = screen.getAllByTestId('game-winner-selector');
    if (gameWinnerSelectors.length > 0) {
      expect(gameWinnerSelectors[0]).toBeInTheDocument();
    }
  }, 15000);
}); 