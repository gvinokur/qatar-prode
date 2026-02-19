import { screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import GameBoostSelector from '../../app/components/game-boost-selector';
import { renderWithProviders, createMockGuessesContext } from '../utils/test-utils';

// Mock Server Actions using vi.hoisted to avoid hoisting issues
const { mockSetGameBoostAction } = vi.hoisted(() => ({
  mockSetGameBoostAction: vi.fn(),
}));

vi.mock('../../app/actions/game-boost-actions', () => ({
  setGameBoostAction: mockSetGameBoostAction,
}));

// Mock boost badge components
vi.mock('../../app/components/boost-badge', () => ({
  BoostBadge: ({ type }: { type: string }) => (
    <div data-testid={`boost-badge-${type}`}>{type === 'silver' ? '2x' : '3x'}</div>
  ),
  BoostCountBadge: ({ type, used, max }: { type: string; used: number; max: number }) => (
    <div data-testid={`boost-count-${type}`}>{type === 'silver' ? '2x' : '3x'}: {used}/{max}</div>
  ),
}));

describe('GameBoostSelector', () => {
  const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
  const pastDate = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago

  const mockProps = {
    gameId: 'game-123',
    gameDate: futureDate,
    tournamentId: 'tournament-123',
    currentBoostType: null as 'silver' | 'golden' | null,
    disabled: false,
    noPrediction: false,
  };

  const defaultBoostCounts = {
    silver: { used: 2, max: 5 },
    golden: { used: 1, max: 2 },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSetGameBoostAction.mockResolvedValue(undefined);
  });

  describe('Rendering', () => {
    it('renders boost count badges for silver and golden', () => {
      renderWithProviders(<GameBoostSelector {...mockProps} />, {
        guessesContext: createMockGuessesContext({
          boostCounts: defaultBoostCounts,
        }),
      });

      expect(screen.getByTestId('boost-count-silver')).toHaveTextContent('2x: 2/5');
      expect(screen.getByTestId('boost-count-golden')).toHaveTextContent('3x: 1/2');
    });

    it('renders boost badge when silver boost is applied', () => {
      renderWithProviders(<GameBoostSelector {...mockProps} currentBoostType="silver" />, {
        guessesContext: createMockGuessesContext({
          boostCounts: defaultBoostCounts,
        }),
      });

      expect(screen.getByTestId('boost-badge-silver')).toBeInTheDocument();
    });

    it('renders boost badge when golden boost is applied', () => {
      renderWithProviders(<GameBoostSelector {...mockProps} currentBoostType="golden" />, {
        guessesContext: createMockGuessesContext({
          boostCounts: defaultBoostCounts,
        }),
      });

      expect(screen.getByTestId('boost-badge-golden')).toBeInTheDocument();
    });

    it('renders nothing when both boost maxes are 0', () => {
      const { container } = renderWithProviders(<GameBoostSelector {...mockProps} />, {
        guessesContext: createMockGuessesContext({
          boostCounts: {
            silver: { used: 0, max: 0 },
            golden: { used: 0, max: 0 },
          },
        }),
      });

      expect(container.firstChild).toBeNull();
    });

    it('renders only silver boost when golden max is 0', () => {
      renderWithProviders(<GameBoostSelector {...mockProps} />, {
        guessesContext: createMockGuessesContext({
          boostCounts: {
            silver: { used: 2, max: 5 },
            golden: { used: 0, max: 0 },
          },
        }),
      });

      expect(screen.getByTestId('boost-count-silver')).toBeInTheDocument();
      expect(screen.queryByTestId('boost-count-golden')).not.toBeInTheDocument();
    });

    it('renders only golden boost when silver max is 0', () => {
      renderWithProviders(<GameBoostSelector {...mockProps} />, {
        guessesContext: createMockGuessesContext({
          boostCounts: {
            silver: { used: 0, max: 0 },
            golden: { used: 1, max: 2 },
          },
        }),
      });

      expect(screen.queryByTestId('boost-count-silver')).not.toBeInTheDocument();
      expect(screen.getByTestId('boost-count-golden')).toBeInTheDocument();
    });
  });

  describe('Boost Click Handlers', () => {
    it('applies silver boost when silver button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<GameBoostSelector {...mockProps} />, {
        guessesContext: createMockGuessesContext({
          boostCounts: defaultBoostCounts,
        }),
      });

      const silverButton = screen.getAllByRole('button')[0]; // First icon button
      await user.click(silverButton);

      await waitFor(() => {
        expect(mockSetGameBoostAction).toHaveBeenCalledWith('game-123', 'silver', 'es');
      });
    });

    it('applies golden boost when golden button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<GameBoostSelector {...mockProps} />, {
        guessesContext: createMockGuessesContext({
          boostCounts: defaultBoostCounts,
        }),
      });

      const goldenButton = screen.getAllByRole('button')[1]; // Second icon button
      await user.click(goldenButton);

      await waitFor(() => {
        expect(mockSetGameBoostAction).toHaveBeenCalledWith('game-123', 'golden', 'es');
      });
    });

    it('removes boost when clicking active boost button', async () => {
      const user = userEvent.setup();
      renderWithProviders(<GameBoostSelector {...mockProps} currentBoostType="silver" />, {
        guessesContext: createMockGuessesContext({
          boostCounts: defaultBoostCounts,
        }),
      });

      const silverButton = screen.getAllByRole('button')[0];
      await user.click(silverButton);

      await waitFor(() => {
        expect(mockSetGameBoostAction).toHaveBeenCalledWith('game-123', null, 'es');
      });
    });

    it('switches from silver to golden boost', async () => {
      const user = userEvent.setup();
      renderWithProviders(<GameBoostSelector {...mockProps} currentBoostType="silver" />, {
        guessesContext: createMockGuessesContext({
          boostCounts: defaultBoostCounts,
        }),
      });

      const goldenButton = screen.getAllByRole('button')[1];
      await user.click(goldenButton);

      await waitFor(() => {
        expect(mockSetGameBoostAction).toHaveBeenCalledWith('game-123', 'golden', 'es');
      });
    });
  });

  describe('Error Handling - Max Boosts Reached', () => {
    it('shows error dialog when max silver boosts reached', async () => {
      const user = userEvent.setup();
      renderWithProviders(<GameBoostSelector {...mockProps} />, {
        guessesContext: createMockGuessesContext({
          boostCounts: {
            silver: { used: 5, max: 5 },
            golden: { used: 1, max: 2 },
          },
        }),
      });

      const silverButton = screen.getAllByRole('button')[0];
      await user.click(silverButton);

      await screen.findByText(/Has usado todos tus 5 multiplicadores de plata/);
      expect(screen.getByText(/Límite de Multiplicadores Alcanzado/)).toBeInTheDocument();
    });

    it('shows error dialog when max golden boosts reached', async () => {
      const user = userEvent.setup();
      renderWithProviders(<GameBoostSelector {...mockProps} />, {
        guessesContext: createMockGuessesContext({
          boostCounts: {
            silver: { used: 2, max: 5 },
            golden: { used: 2, max: 2 },
          },
        }),
      });

      const goldenButton = screen.getAllByRole('button')[1];
      await user.click(goldenButton);

      await screen.findByText(/Has usado todos tus 2 multiplicadores de oro/);
      expect(screen.getByText(/Límite de Multiplicadores Alcanzado/)).toBeInTheDocument();
    });

    it('closes error dialog when close button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<GameBoostSelector {...mockProps} />, {
        guessesContext: createMockGuessesContext({
          boostCounts: {
            silver: { used: 5, max: 5 },
            golden: { used: 1, max: 2 },
          },
        }),
      });

      const silverButton = screen.getAllByRole('button')[0];
      await user.click(silverButton);

      await screen.findByText(/Límite de Multiplicadores Alcanzado/);

      // Find the icon button (CloseIcon) - it's the button without text content in the dialog
      const buttons = screen.getAllByRole('button');
      const closeButton = buttons.find(btn => !btn.textContent);
      await user.click(closeButton!);

      await waitFor(() => {
        expect(screen.queryByText(/Límite de Multiplicadores Alcanzado/)).not.toBeInTheDocument();
      });
    });

    it('closes error dialog when Cerrar button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<GameBoostSelector {...mockProps} />, {
        guessesContext: createMockGuessesContext({
          boostCounts: {
            silver: { used: 5, max: 5 },
            golden: { used: 1, max: 2 },
          },
        }),
      });

      const silverButton = screen.getAllByRole('button')[0];
      await user.click(silverButton);

      await screen.findByText(/Límite de Multiplicadores Alcanzado/);

      const cerrarButton = screen.getByRole('button', { name: /cerrar/i });
      await user.click(cerrarButton);

      await waitFor(() => {
        expect(screen.queryByText(/Límite de Multiplicadores Alcanzado/)).not.toBeInTheDocument();
      });
    });

    it('shows error dialog when setGameBoostAction fails', async () => {
      mockSetGameBoostAction.mockRejectedValue(new Error('Network error'));

      const user = userEvent.setup();
      renderWithProviders(<GameBoostSelector {...mockProps} />, {
        guessesContext: createMockGuessesContext({
          boostCounts: defaultBoostCounts,
        }),
      });

      const silverButton = screen.getAllByRole('button')[0];
      await user.click(silverButton);

      await screen.findByText(/Network error/);
      expect(screen.getByText(/Límite de Multiplicadores Alcanzado/)).toBeInTheDocument();
    });
  });

  describe('Disabled States', () => {
    it('disables buttons when game has started', () => {
      renderWithProviders(<GameBoostSelector {...mockProps} gameDate={pastDate} />, {
        guessesContext: createMockGuessesContext({
          boostCounts: defaultBoostCounts,
        }),
      });

      const buttons = screen.getAllByRole('button');
      const iconButtons = buttons.filter(btn => !btn.textContent);

      iconButtons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });

    it('disables buttons when no prediction entered', () => {
      renderWithProviders(<GameBoostSelector {...mockProps} noPrediction={true} />, {
        guessesContext: createMockGuessesContext({
          boostCounts: defaultBoostCounts,
        }),
      });

      const buttons = screen.getAllByRole('button');
      const iconButtons = buttons.filter(btn => !btn.textContent);

      iconButtons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });

    it('disables buttons when disabled prop is true', () => {
      renderWithProviders(<GameBoostSelector {...mockProps} disabled={true} />, {
        guessesContext: createMockGuessesContext({
          boostCounts: defaultBoostCounts,
        }),
      });

      const buttons = screen.getAllByRole('button');
      const iconButtons = buttons.filter(btn => !btn.textContent);

      iconButtons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });

    it('does not call setGameBoostAction when button is disabled', () => {
      renderWithProviders(<GameBoostSelector {...mockProps} disabled={true} />, {
        guessesContext: createMockGuessesContext({
          boostCounts: defaultBoostCounts,
        }),
      });

      const silverButton = screen.getAllByRole('button')[0];

      // Verify button is disabled - userEvent correctly refuses to click disabled buttons
      expect(silverButton).toBeDisabled();
      expect(mockSetGameBoostAction).not.toHaveBeenCalled();
    });

    it('disables buttons while loading', async () => {
      mockSetGameBoostAction.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      const user = userEvent.setup();
      renderWithProviders(<GameBoostSelector {...mockProps} />, {
        guessesContext: createMockGuessesContext({
          boostCounts: defaultBoostCounts,
        }),
      });

      const silverButton = screen.getAllByRole('button')[0];
      await user.click(silverButton);

      // During loading, buttons should be disabled
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        const iconButtons = buttons.filter(btn => !btn.textContent);
        iconButtons.forEach(button => {
          expect(button).toBeDisabled();
        });
      });
    });
  });

  describe('Loading State', () => {
    it('handles loading state during boost update', async () => {
      let resolvePromise: () => void;
      const promise = new Promise<void>(resolve => {
        resolvePromise = resolve;
      });
      mockSetGameBoostAction.mockReturnValue(promise);

      const user = userEvent.setup();
      renderWithProviders(<GameBoostSelector {...mockProps} />, {
        guessesContext: createMockGuessesContext({
          boostCounts: defaultBoostCounts,
        }),
      });

      const silverButton = screen.getAllByRole('button')[0];
      await user.click(silverButton);

      // Buttons should be disabled during loading
      await waitFor(() => {
        expect(silverButton).toBeDisabled();
      });

      resolvePromise!();

      // After loading, buttons should be enabled again
      await waitFor(() => {
        expect(silverButton).not.toBeDisabled();
      });
    });
  });

  describe('Error Handling', () => {
    it('shows generic error message when setGameBoostAction fails without message', async () => {
      mockSetGameBoostAction.mockRejectedValue({});

      const user = userEvent.setup();
      renderWithProviders(<GameBoostSelector {...mockProps} />, {
        guessesContext: createMockGuessesContext({
          boostCounts: defaultBoostCounts,
        }),
      });

      const silverButton = screen.getAllByRole('button')[0];
      await user.click(silverButton);

      const errorMessage = await screen.findByText(/Error updating boost/);
      expect(errorMessage).toBeInTheDocument();
    });
  });

  describe('Props Changes', () => {
    it('updates boost type when currentBoostType prop changes', () => {
      const { rerenderWithProviders } = renderWithProviders(
        <GameBoostSelector {...mockProps} currentBoostType="silver" />,
        {
          guessesContext: createMockGuessesContext({
            boostCounts: defaultBoostCounts,
          }),
        }
      );

      expect(screen.getByTestId('boost-badge-silver')).toBeInTheDocument();

      rerenderWithProviders(<GameBoostSelector {...mockProps} currentBoostType="golden" />);

      expect(screen.queryByTestId('boost-badge-silver')).not.toBeInTheDocument();
      expect(screen.getByTestId('boost-badge-golden')).toBeInTheDocument();
    });

    it('reads boost counts from GuessesContext', () => {
      renderWithProviders(<GameBoostSelector {...mockProps} />, {
        guessesContext: createMockGuessesContext({
          boostCounts: {
            silver: { used: 3, max: 5 },
            golden: { used: 2, max: 2 },
          },
        }),
      });

      expect(screen.getByTestId('boost-count-silver')).toHaveTextContent('2x: 3/5');
      expect(screen.getByTestId('boost-count-golden')).toHaveTextContent('3x: 2/2');
    });
  });
});
