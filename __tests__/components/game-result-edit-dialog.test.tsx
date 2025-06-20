import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GameResultEditDialog from '../../app/components/game-result-edit-dialog';
import { updateGameResult } from '../../app/db/game-result-repository';

// Mock next-auth
vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { user: { id: '1', email: 'test@example.com' } },
    status: 'authenticated',
  }),
}));

describe('GameResultEditDialog', () => {
  const baseProps = {
    open: true,
    onClose: vi.fn(),
    gameId: 'game-1',
    gameNumber: 5,
    isPlayoffGame: false,
    homeTeamName: 'Team A',
    awayTeamName: 'Team B',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Game Guess Mode', () => {
    const gameGuessProps = {
      ...baseProps,
      isGameGuess: true as const,
      onGameGuessSave: vi.fn(),
    };

    it('renders game guess dialog with correct title', () => {
      render(<GameResultEditDialog {...gameGuessProps} />);
      expect(screen.getByText('Edit Result: Game #5')).toBeInTheDocument();
      expect(screen.getByText('Team A')).toBeInTheDocument();
      expect(screen.getByText('Team B')).toBeInTheDocument();
    });

    it('initializes with provided values', () => {
      render(
        <GameResultEditDialog
          {...gameGuessProps}
          isPlayoffGame={true}
          initialHomeScore={1}
          initialAwayScore={1}
          initialHomePenaltyWinner={true}
        />
      );
      // Both home and away scores are 1
      expect(screen.getAllByDisplayValue('1')).toHaveLength(2);
      // Penalty winner checkbox for Team A should be checked
      expect(screen.getByRole('checkbox', { name: /Team A/i })).toBeChecked();
    });

    it('handles score changes and resets penalty winners when scores differ', async () => {
      render(
        <GameResultEditDialog
          {...gameGuessProps}
          isPlayoffGame={true}
          initialHomeScore={1}
          initialAwayScore={1}
          initialHomePenaltyWinner={true}
        />
      );

      // Change home score to make scores different
      const homeScoreInput = screen.getAllByRole('spinbutton')[0];
      await userEvent.clear(homeScoreInput);
      await userEvent.type(homeScoreInput, '2');

      // Penalty section should disappear (checkboxes not present)
      expect(screen.queryByRole('checkbox', { name: /Team A/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('checkbox', { name: /Team B/i })).not.toBeInTheDocument();
    });

    it('shows penalty winner selection for tied playoff games', () => {
      render(
        <GameResultEditDialog
          {...gameGuessProps}
          initialHomeScore={1}
          initialAwayScore={1}
          isPlayoffGame={true}
        />
      );

      expect(screen.getByText('Ganador de la tanda de penales')).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: /Team A/i })).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: /Team B/i })).toBeInTheDocument();
    });

    it('validates penalty winner selection for tied playoff games', async () => {
      render(
        <GameResultEditDialog
          {...gameGuessProps}
          initialHomeScore={1}
          initialAwayScore={1}
          isPlayoffGame={true}
        />
      );

      const saveButton = screen.getByText('Save Result');
      await userEvent.click(saveButton);

      expect(screen.getByText('Please select a penalty shootout winner')).toBeInTheDocument();
      expect(gameGuessProps.onGameGuessSave).not.toHaveBeenCalled();
    });

    it('saves game guess successfully', async () => {
      gameGuessProps.onGameGuessSave.mockResolvedValue(undefined);
      render(<GameResultEditDialog {...gameGuessProps} />);

      const homeScoreInput = screen.getAllByRole('spinbutton')[0];
      const awayScoreInput = screen.getAllByRole('spinbutton')[1];
      
      await userEvent.type(homeScoreInput, '2');
      await userEvent.type(awayScoreInput, '1');

      const saveButton = screen.getByText('Save Result');
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(gameGuessProps.onGameGuessSave).toHaveBeenCalledWith('game-1', 2, 1, false, false);
        expect(baseProps.onClose).toHaveBeenCalled();
      });
    });

    it('handles save error', async () => {
      gameGuessProps.onGameGuessSave.mockRejectedValue(new Error('Save failed'));
      render(<GameResultEditDialog {...gameGuessProps} />);

      const homeScoreInput = screen.getAllByRole('spinbutton')[0];
      await userEvent.type(homeScoreInput, '1');

      const saveButton = screen.getByText('Save Result');
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to save game result. Please try again.')).toBeInTheDocument();
        expect(baseProps.onClose).not.toHaveBeenCalled();
      });
    });

    it('prevents closing dialog while loading', async () => {
      gameGuessProps.onGameGuessSave.mockImplementation(() => new Promise(() => {})); // Never resolves
      render(<GameResultEditDialog {...gameGuessProps} isPlayoffGame={true} initialHomeScore={1} initialAwayScore={1} />);

      const homeScoreInput = screen.getAllByRole('spinbutton')[0];
      await userEvent.type(homeScoreInput, '1');

      const saveButton = screen.getByText('Save Result');
      await userEvent.click(saveButton);

      // Dialog should show loading state
      expect(screen.getByText('Saving...')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();

      // Cancel button should be disabled
      const cancelButton = screen.getByText('Cancel');
      expect(cancelButton).toBeDisabled();
    });
  });

  describe('Game Result Mode', () => {
    const gameResultProps = {
      ...baseProps,
      isGameGuess: false as const,
      initialGameDate: new Date('2022-11-21T13:00:00Z'),
      onGameResultSave: vi.fn(),
    };

    it('renders game result dialog with date picker', () => {
      render(<GameResultEditDialog {...gameResultProps} />);
      expect(screen.getAllByText('Game Date & Time').length).toBeGreaterThan(0);
    });

    it('initializes with provided values', () => {
      render(
        <GameResultEditDialog
          {...gameResultProps}
          initialHomeScore={3}
          initialAwayScore={2}
          initialHomePenaltyScore={5}
          initialAwayPenaltyScore={4}
        />
      );
      expect(screen.getByDisplayValue('3')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2')).toBeInTheDocument();
      // Penalty scores are only shown for tied playoff games
      expect(screen.queryByDisplayValue('5')).not.toBeInTheDocument();
      expect(screen.queryByDisplayValue('4')).not.toBeInTheDocument();
    });

    it('shows penalty score inputs for tied playoff games', () => {
      render(
        <GameResultEditDialog
          {...gameResultProps}
          initialHomeScore={1}
          initialAwayScore={1}
          isPlayoffGame={true}
        />
      );

      expect(screen.getByText('Penalty Shootout Scores')).toBeInTheDocument();
      expect(screen.getByText('Team A (Penalty Score)')).toBeInTheDocument();
      expect(screen.getByText('Team B (Penalty Score)')).toBeInTheDocument();
    });

    it('validates penalty scores for tied playoff games', async () => {
      render(
        <GameResultEditDialog
          {...gameResultProps}
          initialHomeScore={1}
          initialAwayScore={1}
          isPlayoffGame={true}
        />
      );

      const saveButton = screen.getByText('Save Result');
      await userEvent.click(saveButton);

      expect(screen.getByText('Please enter both penalty scores')).toBeInTheDocument();
      expect(gameResultProps.onGameResultSave).not.toHaveBeenCalled();
    });

    it('validates game date is required', async () => {
      render(
        <GameResultEditDialog
          {...gameResultProps}
          initialGameDate={undefined as any}
        />
      );

      const saveButton = screen.getByText('Save Result');
      await userEvent.click(saveButton);

      expect(screen.getByText('Please select a game date')).toBeInTheDocument();
      expect(gameResultProps.onGameResultSave).not.toHaveBeenCalled();
    });

    it('saves game result successfully', async () => {
      gameResultProps.onGameResultSave.mockResolvedValue(undefined);
      render(<GameResultEditDialog {...gameResultProps} />);

      const homeScoreInput = screen.getAllByRole('spinbutton')[0];
      const awayScoreInput = screen.getAllByRole('spinbutton')[1];
      
      await userEvent.type(homeScoreInput, '2');
      await userEvent.type(awayScoreInput, '1');

      const saveButton = screen.getByText('Save Result');
      await userEvent.click(saveButton);

      await waitFor(() => {
        const calls = gameResultProps.onGameResultSave.mock.calls;
        expect(calls.length).toBeGreaterThan(0);
        const lastCall = calls[calls.length - 1];
        expect(lastCall[lastCall.length - 1]).toEqual(new Date('2022-02-21T13:00:00.000Z'));
        expect(baseProps.onClose).toHaveBeenCalled();
      });
    });

    it('handles save error', async () => {
      gameResultProps.onGameResultSave.mockRejectedValue(new Error('Save failed'));
      render(<GameResultEditDialog {...gameResultProps} />);

      const homeScoreInput = screen.getAllByRole('spinbutton')[0];
      await userEvent.type(homeScoreInput, '1');

      const saveButton = screen.getByText('Save Result');
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to save game result. Please try again.')).toBeInTheDocument();
        expect(baseProps.onClose).not.toHaveBeenCalled();
      });
    });
  });

  describe('Shared Functionality', () => {
    it('closes dialog on cancel', async () => {
      render(<GameResultEditDialog {...baseProps} isGameGuess={true} onGameGuessSave={vi.fn()} />);
      
      const cancelButton = screen.getByText('Cancel');
      await userEvent.click(cancelButton);

      expect(baseProps.onClose).toHaveBeenCalled();
    });

    it('does not show penalty section for non-playoff games', () => {
      render(
        <GameResultEditDialog
          {...baseProps}
          isGameGuess={true}
          onGameGuessSave={vi.fn()}
          initialHomeScore={1}
          initialAwayScore={1}
          isPlayoffGame={false}
        />
      );

      expect(screen.queryByText('Ganador de la tanda de penales')).not.toBeInTheDocument();
      expect(screen.queryByText('Penalty Shootout Scores')).not.toBeInTheDocument();
    });

    it('does not show penalty section when scores are different', () => {
      render(
        <GameResultEditDialog
          {...baseProps}
          isGameGuess={true}
          onGameGuessSave={vi.fn()}
          initialHomeScore={2}
          initialAwayScore={1}
          isPlayoffGame={true}
        />
      );

      expect(screen.queryByText('Ganador de la tanda de penales')).not.toBeInTheDocument();
    });
  });
}); 