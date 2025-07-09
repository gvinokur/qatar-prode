// Mock the auth module to prevent Next-auth import issues - must be first!
vi.mock('../../auth', () => ({
  auth: vi.fn().mockResolvedValue({
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      emailVerified: new Date()
    }
  })
}));

import { vi, describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GamesGrid from '../../app/components/games-grid';
import { GuessesContext } from '../../app/components/context-providers/guesses-context-provider';
import * as guessesActions from '../../app/actions/guesses-actions';

// Mocks
vi.mock('../../app/components/game-view', () => ({
  __esModule: true,
  default: ({ game, handleEditClick, disabled }: any) => (
    <div data-testid={`game-view-${game.game_number}`}>
      <button onClick={() => handleEditClick(game.game_number)} disabled={disabled} data-testid={`edit-btn-${game.game_number}`}>Edit</button>
      <span>{game.home_team} vs {game.away_team}</span>
    </div>
  )
}));
vi.mock('../../app/components/game-result-edit-dialog', () => ({
  __esModule: true,
  default: ({ open, onClose, onGameGuessSave, homeTeamName, awayTeamName, gameId, gameNumber, ..._props }: any) =>
    open ? (
      <div data-testid="game-result-dialog">
        <span data-testid="dialog-home">{homeTeamName}</span>
        <span data-testid="dialog-away">{awayTeamName}</span>
        <button onClick={() => onGameGuessSave(gameId, 1, 2, false, false)} data-testid="save-btn">Save</button>
        <button onClick={onClose} data-testid="close-btn">Close</button>
        <span data-testid="dialog-game-number">{gameNumber}</span>
      </div>
    ) : null
}));
vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { id: 'u1' } } }),
}));
vi.mock('../../app/utils/playoffs-rule-helper', () => ({
  getTeamDescription: (rule: any) => `Rule: ${rule}`
}));
vi.mock('../../app/utils/score-utils', () => ({
  getGuessWinner: vi.fn(() => 't1'),
  getGuessLoser: vi.fn(() => 't2'),
}));
vi.mock('../../app/utils/playoff-teams-calculator', () => ({
  calculateTeamNamesForPlayoffGame: vi.fn(() => ({ homeTeam: 't1', awayTeam: 't2' }))
}));
vi.mock('../../app/actions/guesses-actions', () => ({
  updateOrCreateTournamentGuess: vi.fn()
}));

const updateGameGuess = vi.fn();
const guessesContextValue = {
  gameGuesses: {},
  guessedPositions: [],
  updateGameGuess,
};

const teamsMap = {
  t1: { id: 't1', name: 'Team 1', short_name: 'T1', theme: null },
  t2: { id: 't2', name: 'Team 2', short_name: 'T2', theme: null },
};
const baseGame = {
  game_date: new Date(),
  location: 'Stadium',
  home_team_rule: undefined,
  away_team_rule: undefined,
  game_type: 'group',
  game_local_timezone: 'UTC',
};
const games = [
  { id: 'g1', game_number: 1, home_team: 't1', away_team: 't2', tournament_id: 't', playoffStage: undefined, group: null, gameResult: null, ...baseGame },
  { id: 'g2', game_number: 2, home_team: 't2', away_team: 't1', tournament_id: 't', playoffStage: undefined, group: null, gameResult: null, ...baseGame },
];

describe('GamesGrid', () => {
  beforeEach(() => {
    updateGameGuess.mockClear();
  });

  function renderWithContext(ui: React.ReactNode) {
    return render(
      <GuessesContext.Provider value={guessesContextValue}>
        {ui}
      </GuessesContext.Provider>
    );
  }

  it('renders all games', () => {
    renderWithContext(<GamesGrid games={games} teamsMap={teamsMap} isPlayoffs={false} />);
    expect(screen.getByTestId('game-view-1')).toBeInTheDocument();
    expect(screen.getByTestId('game-view-2')).toBeInTheDocument();
  });

  it('opens dialog on edit and passes correct props', async () => {
    renderWithContext(<GamesGrid games={games} teamsMap={teamsMap} isPlayoffs={false} />);
    await userEvent.click(screen.getByTestId('edit-btn-1'));
    expect(screen.getByTestId('game-result-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-home')).toHaveTextContent('Team 1');
    expect(screen.getByTestId('dialog-away')).toHaveTextContent('Team 2');
    expect(screen.getByTestId('dialog-game-number')).toHaveTextContent('1');
  });

  it('saves game result and updates context', async () => {
    renderWithContext(<GamesGrid games={games} teamsMap={teamsMap} isPlayoffs={false} />);
    await userEvent.click(screen.getByTestId('edit-btn-1'));
    await userEvent.click(screen.getByTestId('save-btn'));
    await waitFor(() => {
      expect(updateGameGuess).toHaveBeenCalledWith('g1', expect.objectContaining({ home_score: 1, away_score: 2 }));
    });
  });

  it('closes dialog on close', async () => {
    renderWithContext(<GamesGrid games={games} teamsMap={teamsMap} isPlayoffs={false} />);
    await userEvent.click(screen.getByTestId('edit-btn-1'));
    expect(screen.getByTestId('game-result-dialog')).toBeInTheDocument();
    await userEvent.click(screen.getByTestId('close-btn'));
    await waitFor(() => {
      expect(screen.queryByTestId('game-result-dialog')).not.toBeInTheDocument();
    });
  });

  it('does not allow editing if not logged in', () => {
    vi.doMock('next-auth/react', () => ({ useSession: () => ({ data: null }) }));
    renderWithContext(<GamesGrid games={games} teamsMap={teamsMap} isPlayoffs={false} isLoggedIn={false} />);
    expect(screen.getByTestId('edit-btn-1')).toBeDisabled();
  });

  it('handles playoff logic and triggers tournament guess update', async () => {
    const playoffGame = { ...games[0], playoffStage: { tournament_playoff_round_id: 'r1', round_name: 'Final', is_final: true, is_third_place: false } };
    const playoffContextValue = {
      gameGuesses: {
        'g1': {
          game_id: 'g1',
          game_number: 1,
          user_id: 'u1',
          home_team: 't1',
          away_team: 't2',
          home_score: undefined,
          away_score: undefined,
          home_penalty_winner: false,
          away_penalty_winner: false,
          score: undefined
        }
      },
      guessedPositions: [],
      updateGameGuess,
    };
    
    render(
      <GuessesContext.Provider value={playoffContextValue}>
        <GamesGrid games={[playoffGame]} teamsMap={teamsMap} isPlayoffs={true} />
      </GuessesContext.Provider>
    );
    
    await userEvent.click(screen.getByTestId('edit-btn-1'));
    await userEvent.click(screen.getByTestId('save-btn'));
    
    const mockUpdateOrCreateTournamentGuess = vi.mocked(guessesActions.updateOrCreateTournamentGuess);
    
    await waitFor(() => {
      expect(mockUpdateOrCreateTournamentGuess).toHaveBeenCalledWith(expect.objectContaining({ champion_team_id: 't1', runner_up_team_id: 't2' }));
    }, { timeout: 10000 });
  }, 15000);

  it('renders nothing if no games', () => {
    renderWithContext(<GamesGrid games={[]} teamsMap={teamsMap} isPlayoffs={false} />);
    expect(screen.queryByTestId('game-view-1')).not.toBeInTheDocument();
  });
}); 