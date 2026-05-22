import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GuessesContextProvider, GuessesContext } from '../../app/components/context-providers/guesses-context-provider';
import type { GameGuessNew } from '../../app/db/tables-definition';

vi.mock('../../app/actions/guesses-actions', () => ({
  updateOrCreateGameGuesses: vi.fn(),
}));

const makeGuess = (gameId: string, home: number, away: number): GameGuessNew => ({
  game_id: gameId,
  game_number: 1,
  user_id: 'user1',
  home_score: home,
  away_score: away,
});

const BulkConsumer = ({ guessesToSet }: { guessesToSet: GameGuessNew[] }) => {
  const ctx = React.useContext(GuessesContext);
  return (
    <div>
      <div data-testid="guesses-json">{JSON.stringify(ctx.gameGuesses)}</div>
      <button
        data-testid="bulk-btn"
        onClick={() => ctx.bulkSetGameGuesses(guessesToSet)}
      >
        bulk
      </button>
    </div>
  );
};

describe('GuessesContext.bulkSetGameGuesses', () => {
  beforeEach(() => vi.clearAllMocks());

  it('merges new guesses into state', async () => {
    const user = userEvent.setup();
    const newGuesses = [makeGuess('g1', 2, 1), makeGuess('g2', 0, 0)];

    render(
      <GuessesContextProvider gameGuesses={{}} autoSave={false}>
        <BulkConsumer guessesToSet={newGuesses} />
      </GuessesContextProvider>
    );

    await user.click(screen.getByTestId('bulk-btn'));

    const stored = JSON.parse(screen.getByTestId('guesses-json').textContent!);
    expect(stored['g1'].home_score).toBe(2);
    expect(stored['g2'].away_score).toBe(0);
  });

  it('overwrites existing guess for same game_id', async () => {
    const user = userEvent.setup();
    const initial = { g1: makeGuess('g1', 1, 0) };
    const updated = [makeGuess('g1', 3, 2)];

    render(
      <GuessesContextProvider gameGuesses={initial} autoSave={false}>
        <BulkConsumer guessesToSet={updated} />
      </GuessesContextProvider>
    );

    await user.click(screen.getByTestId('bulk-btn'));

    const stored = JSON.parse(screen.getByTestId('guesses-json').textContent!);
    expect(stored['g1'].home_score).toBe(3);
    expect(stored['g1'].away_score).toBe(2);
  });

  it('does not overwrite unrelated existing guesses', async () => {
    const user = userEvent.setup();
    const initial = { g_existing: makeGuess('g_existing', 1, 0) };
    const newGuess = [makeGuess('g_new', 2, 1)];

    render(
      <GuessesContextProvider gameGuesses={initial} autoSave={false}>
        <BulkConsumer guessesToSet={newGuess} />
      </GuessesContextProvider>
    );

    await user.click(screen.getByTestId('bulk-btn'));

    const stored = JSON.parse(screen.getByTestId('guesses-json').textContent!);
    expect(stored['g_existing'].home_score).toBe(1);
    expect(stored['g_new'].home_score).toBe(2);
  });

  it('empty array call leaves state unchanged', async () => {
    const user = userEvent.setup();
    const initial = { g1: makeGuess('g1', 1, 0) };

    render(
      <GuessesContextProvider gameGuesses={initial} autoSave={false}>
        <BulkConsumer guessesToSet={[]} />
      </GuessesContextProvider>
    );

    await user.click(screen.getByTestId('bulk-btn'));

    const stored = JSON.parse(screen.getByTestId('guesses-json').textContent!);
    expect(stored['g1'].home_score).toBe(1);
  });

  it('does not trigger auto-save when autoSave=true', async () => {
    const { updateOrCreateGameGuesses } = await import('../../app/actions/guesses-actions');
    const mockSave = vi.mocked(updateOrCreateGameGuesses);
    const user = userEvent.setup();

    render(
      <GuessesContextProvider gameGuesses={{}} autoSave={true}>
        <BulkConsumer guessesToSet={[makeGuess('g1', 1, 0)]} />
      </GuessesContextProvider>
    );

    await user.click(screen.getByTestId('bulk-btn'));

    expect(mockSave).not.toHaveBeenCalled();
  });
});
