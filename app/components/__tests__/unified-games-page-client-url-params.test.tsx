import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, act, screen, fireEvent } from '@testing-library/react';
import { UnifiedGamesPageClient } from '../unified-games-page-client';
import { GuessesContext } from '../context-providers/guesses-context-provider';
import * as nextNavigation from 'next/navigation';
import * as autoScroll from '../../utils/auto-scroll';
import * as guessesActions from '../../actions/guesses-actions';
import { testFactories } from '@/__tests__/db/test-factories';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(),
  useRouter: vi.fn()
}));

vi.mock('../context-providers/filter-context-provider', () => ({
  FilterContextProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useFilterContext: vi.fn()
}));

vi.mock('../context-providers/edit-trigger-context-provider', () => ({
  useEditTrigger: vi.fn()
}));

vi.mock('../context-providers/guesses-context-provider', () => ({
  GuessesContext: React.createContext({
    gameGuesses: {},
    boostCounts: {
      silver: { used: 0, max: 5 },
      golden: { used: 0, max: 3 }
    },
    bulkSetGameGuesses: vi.fn()
  })
}));

vi.mock('../ai-generate-all-dialog', () => ({
  default: ({ onConfirm, loading, open }: any) => open ? (
    <div data-testid="ai-dialog">
      <span data-testid="ai-dialog-loading">{loading ? 'true' : 'false'}</span>
      <button data-testid="ai-dialog-confirm" onClick={onConfirm} disabled={loading}>Confirm</button>
    </div>
  ) : null
}));

vi.mock('../../utils/ai-prediction-generator', () => ({
  generateAIPrediction: vi.fn(() => ({ homeScore: 1, awayScore: 0 }))
}));

vi.mock('../../actions/guesses-actions', () => ({
  updateOrCreateGameGuesses: vi.fn(() => Promise.resolve({ success: true }))
}));

vi.mock('../prediction-status-header', () => ({
  PredictionStatusHeader: () => <div>StatusHeader</div>,
  computeGamesHeaderVariant: vi.fn(() => null)
}));


vi.mock('../../utils/auto-scroll', () => ({
  scrollToGame: vi.fn(),
  findScrollTarget: vi.fn()
}));

vi.mock('@mui/material', () => ({
  Box: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Fab: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  Tooltip: ({ children }: any) => <>{children}</>,
  useTheme: vi.fn(() => ({ breakpoints: { down: () => false } })),
  useMediaQuery: vi.fn(() => false)
}));

// Mock child components
vi.mock('../game-filters', () => ({
  GameFilters: () => <div>GameFilters</div>
}));

vi.mock('../compact-prediction-dashboard', () => ({
  CompactPredictionDashboard: () => <div>Dashboard</div>
}));

vi.mock('../secondary-filters', () => ({
  SecondaryFilters: () => <div>SecondaryFilters</div>
}));

vi.mock('../games-list-with-scroll', () => ({
  GamesListWithScroll: () => <div>GamesList</div>
}));

vi.mock('../common/scroll-shadow-container', () => ({
  ScrollShadowContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

describe('UnifiedGamesPageClient URL Parameter Handling', () => {
  let mockSetActiveFilter: ReturnType<typeof vi.fn>;
  let mockSetGroupFilter: ReturnType<typeof vi.fn>;
  let mockSetRoundFilter: ReturnType<typeof vi.fn>;
  let mockTriggerEdit: ReturnType<typeof vi.fn>;
  let mockSearchParams: Map<string, string>;

  beforeEach(async () => {
    vi.useFakeTimers();
    mockSetActiveFilter = vi.fn();
    mockSetGroupFilter = vi.fn();
    mockSetRoundFilter = vi.fn();
    mockTriggerEdit = vi.fn();
    mockSearchParams = new Map();

    // Mock useFilterContext
    const { useFilterContext } = vi.mocked(await import('../context-providers/filter-context-provider'));
    useFilterContext.mockReturnValue({
      activeFilter: 'all',
      groupFilter: null,
      roundFilter: null,
      setActiveFilter: mockSetActiveFilter,
      setGroupFilter: mockSetGroupFilter,
      setRoundFilter: mockSetRoundFilter
    });

    // Mock useEditTrigger
    const { useEditTrigger } = vi.mocked(await import('../context-providers/edit-trigger-context-provider'));
    useEditTrigger.mockReturnValue({
      triggerEdit: mockTriggerEdit,
      registerTrigger: vi.fn(),
      isEditMode: false,
      isEditModeRef: { current: false },
      setEditMode: vi.fn()
    });

    // Mock useSearchParams
    vi.mocked(nextNavigation.useSearchParams).mockReturnValue({
      get: (key: string) => mockSearchParams.get(key) || null,
      getAll: () => [],
      has: (key: string) => mockSearchParams.has(key),
      keys: () => mockSearchParams.keys(),
      values: () => mockSearchParams.values(),
      entries: () => mockSearchParams.entries(),
      forEach: () => {},
      toString: () => '',
      size: mockSearchParams.size,
      [Symbol.iterator]: () => mockSearchParams[Symbol.iterator]()
    } as URLSearchParams);

    // Mock useRouter
    vi.mocked(nextNavigation.useRouter).mockReturnValue({
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn()
    } as unknown as ReturnType<typeof nextNavigation.useRouter>);

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('should detect edit parameter and clear filters', async () => {
    // Set edit parameter
    mockSearchParams.set('edit', 'game-123');

    const game = testFactories.game({ id: 'game-123' });
    const tournament = testFactories.tournament();
    const team = testFactories.team();

    render(
      <UnifiedGamesPageClient
        games={[game]}
        gameCounts={{ total: 1, predicted: 0, remaining: 1 }}
        teamsMap={{ [team.id]: team }}
        tournamentId={tournament.id}
        groups={[]}
        rounds={[]}
        tournament={tournament}
        closingGames={[]}
        tournamentPredictionCompletion={null}
        tournamentStartDate={undefined}
        qualifiedTeamsHref="/en/tournaments/t1/qualified-teams"
      />
    );

    // Effects run synchronously within act(); assert directly
    expect(mockSetActiveFilter).toHaveBeenCalledWith('all');
    expect(mockSetGroupFilter).toHaveBeenCalledWith(null);
    expect(mockSetRoundFilter).toHaveBeenCalledWith(null);
  });

  it('should trigger edit mode after filter state confirms clearing', async () => {
    // Set edit parameter
    mockSearchParams.set('edit', 'game-456');

    // Mock filter state as already cleared
    const { useFilterContext } = vi.mocked(await import('../context-providers/filter-context-provider'));
    useFilterContext.mockReturnValue({
      activeFilter: 'all',
      groupFilter: null,
      roundFilter: null,
      setActiveFilter: mockSetActiveFilter,
      setGroupFilter: mockSetGroupFilter,
      setRoundFilter: mockSetRoundFilter
    });

    const game = testFactories.game({ id: 'game-456' });
    const tournament = testFactories.tournament();
    const team = testFactories.team();

    render(
      <UnifiedGamesPageClient
        games={[game]}
        gameCounts={{ total: 1, predicted: 0, remaining: 1 }}
        teamsMap={{ [team.id]: team }}
        tournamentId={tournament.id}
        groups={[]}
        rounds={[]}
        tournament={tournament}
        closingGames={[]}
        tournamentPredictionCompletion={null}
        tournamentStartDate={undefined}
        qualifiedTeamsHref="/en/tournaments/t1/qualified-teams"
      />
    );

    // Advance fake timers to fire the nested setTimeout callbacks
    await act(async () => {
      vi.runAllTimers();
    });

    // Verify triggerEdit is called after filters are cleared
    expect(mockTriggerEdit).toHaveBeenCalledWith('game-456');
  });

  it('should override localStorage filters when edit parameter present', async () => {
    // Pre-populate localStorage with filter state
    globalThis.localStorage.setItem('tournamentFilter-123', 'unpredicted');
    globalThis.localStorage.setItem('tournamentGroupFilter-123', 'group-a');

    // Mock initial filter state from localStorage
    const { useFilterContext } = vi.mocked(await import('../context-providers/filter-context-provider'));
    useFilterContext.mockReturnValue({
      activeFilter: 'unpredicted', // Initially from localStorage
      groupFilter: 'group-a', // Initially from localStorage
      roundFilter: null,
      setActiveFilter: mockSetActiveFilter,
      setGroupFilter: mockSetGroupFilter,
      setRoundFilter: mockSetRoundFilter
    });

    // Set edit parameter
    mockSearchParams.set('edit', 'game-789');

    const game = testFactories.game({ id: 'game-789' });
    const tournament = testFactories.tournament({ id: '123' });
    const team = testFactories.team();

    render(
      <UnifiedGamesPageClient
        games={[game]}
        gameCounts={{ total: 1, predicted: 0, remaining: 1 }}
        teamsMap={{ [team.id]: team }}
        tournamentId="123"
        groups={[]}
        rounds={[]}
        tournament={tournament}
        closingGames={[]}
        tournamentPredictionCompletion={null}
        tournamentStartDate={undefined}
        qualifiedTeamsHref="/en/tournaments/123/qualified-teams"
      />
    );

    // Effects run synchronously within act(); assert directly
    expect(mockSetActiveFilter).toHaveBeenCalledWith('all');
    expect(mockSetGroupFilter).toHaveBeenCalledWith(null);
    expect(mockSetRoundFilter).toHaveBeenCalledWith(null);

    // Cleanup
    globalThis.localStorage.removeItem('tournamentFilter-123');
    globalThis.localStorage.removeItem('tournamentGroupFilter-123');
  });

  it('should resolve ?edit=next to first upcoming game and clear filters', async () => {
    vi.mocked(autoScroll.findScrollTarget).mockReturnValue('game-upcoming-id');
    mockSearchParams.set('edit', 'next');

    const game = testFactories.game({ id: 'upcoming-id' });
    const tournament = testFactories.tournament();
    const team = testFactories.team();

    render(
      <UnifiedGamesPageClient
        games={[game]}
        gameCounts={{ total: 1, predicted: 0, remaining: 1 }}
        teamsMap={{ [team.id]: team }}
        tournamentId={tournament.id}
        groups={[]}
        rounds={[]}
        tournament={tournament}
        closingGames={[]}
        tournamentPredictionCompletion={null}
        tournamentStartDate={undefined}
        qualifiedTeamsHref="/en/tournaments/t1/qualified-teams"
      />
    );

    expect(mockSetActiveFilter).toHaveBeenCalledWith('all');
    expect(mockSetGroupFilter).toHaveBeenCalledWith(null);
    expect(mockSetRoundFilter).toHaveBeenCalledWith(null);
  });

  it('should trigger edit on resolved game ID when ?edit=next', async () => {
    vi.mocked(autoScroll.findScrollTarget).mockReturnValue('game-upcoming-id');
    mockSearchParams.set('edit', 'next');

    const game = testFactories.game({ id: 'upcoming-id' });
    const tournament = testFactories.tournament();
    const team = testFactories.team();

    render(
      <UnifiedGamesPageClient
        games={[game]}
        gameCounts={{ total: 1, predicted: 0, remaining: 1 }}
        teamsMap={{ [team.id]: team }}
        tournamentId={tournament.id}
        groups={[]}
        rounds={[]}
        tournament={tournament}
        closingGames={[]}
        tournamentPredictionCompletion={null}
        tournamentStartDate={undefined}
        qualifiedTeamsHref="/en/tournaments/t1/qualified-teams"
      />
    );

    await act(async () => {
      vi.runAllTimers();
    });

    expect(mockTriggerEdit).toHaveBeenCalledWith('upcoming-id');
  });

  it('should not set pending edit when ?edit=next with no scroll target', () => {
    vi.mocked(autoScroll.findScrollTarget).mockReturnValue(null);
    mockSearchParams.set('edit', 'next');

    const tournament = testFactories.tournament();
    const team = testFactories.team();

    render(
      <UnifiedGamesPageClient
        games={[]}
        gameCounts={{ total: 0, predicted: 0, remaining: 0 }}
        teamsMap={{ [team.id]: team }}
        tournamentId={tournament.id}
        groups={[]}
        rounds={[]}
        tournament={tournament}
        closingGames={[]}
        tournamentPredictionCompletion={null}
        tournamentStartDate={undefined}
        qualifiedTeamsHref="/en/tournaments/t1/qualified-teams"
      />
    );

    expect(mockSetActiveFilter).not.toHaveBeenCalledWith('all');
    expect(mockTriggerEdit).not.toHaveBeenCalled();
  });

  it('should resolve ?edit=next to first unpredicted upcoming game (skipping predicted ones)', async () => {
    mockSearchParams.set('edit', 'next');
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // tomorrow
    const predictedGame = testFactories.game({ id: 'predicted-game', game_date: futureDate });
    const unpredictedGame = testFactories.game({ id: 'unpredicted-game', game_date: new Date(futureDate.getTime() + 3600_000) });
    const tournament = testFactories.tournament();
    const team = testFactories.team();
    const completeGuess = testFactories.gameGuess({ game_id: 'predicted-game', home_score: 1, away_score: 0 });

    render(
      <GuessesContext.Provider value={{ gameGuesses: { 'predicted-game': completeGuess }, boostCounts: { silver: { used: 0, max: 5 }, golden: { used: 0, max: 3 } } } as any}>
        <UnifiedGamesPageClient
          games={[predictedGame, unpredictedGame] as any}
          gameCounts={{ total: 2, predicted: 1, remaining: 1 }}
          teamsMap={{ [team.id]: team }}
          tournamentId={tournament.id}
          groups={[]}
          rounds={[]}
          tournament={tournament}
          closingGames={[]}
          tournamentPredictionCompletion={null}
          tournamentStartDate={undefined}
          qualifiedTeamsHref="/en/tournaments/t1/qualified-teams"
        />
      </GuessesContext.Provider>
    );

    await act(async () => { vi.runAllTimers(); });

    // triggerEdit should be called with the unpredicted game, not the predicted one
    expect(mockTriggerEdit).toHaveBeenCalledWith('unpredicted-game');
    expect(mockTriggerEdit).not.toHaveBeenCalledWith('predicted-game');
  });

  it('should fall back to findScrollTarget when all upcoming games are predicted', () => {
    vi.mocked(autoScroll.findScrollTarget).mockReturnValue('game-predicted-game');
    mockSearchParams.set('edit', 'next');
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const predictedGame = testFactories.game({ id: 'predicted-game', game_date: futureDate });
    const tournament = testFactories.tournament();
    const team = testFactories.team();
    const completeGuess = testFactories.gameGuess({ game_id: 'predicted-game', home_score: 1, away_score: 0 });

    render(
      <GuessesContext.Provider value={{ gameGuesses: { 'predicted-game': completeGuess }, boostCounts: { silver: { used: 0, max: 5 }, golden: { used: 0, max: 3 } } }}>
        <UnifiedGamesPageClient
          games={[predictedGame] as any}
          gameCounts={{ total: 1, predicted: 1, remaining: 0 }}
          teamsMap={{ [team.id]: team }}
          tournamentId={tournament.id}
          groups={[]}
          rounds={[]}
          tournament={tournament}
          closingGames={[]}
          tournamentPredictionCompletion={null}
          tournamentStartDate={undefined}
          qualifiedTeamsHref="/en/tournaments/t1/qualified-teams"
        />
      </GuessesContext.Provider>
    );

    // All upcoming games predicted → falls back to findScrollTarget
    expect(autoScroll.findScrollTarget).toHaveBeenCalled();
    expect(mockSetActiveFilter).toHaveBeenCalledWith('all');
  });

  it('should skip locked game (deadline passed) when ?edit=next and open the next valid unpredicted game', async () => {
    mockSearchParams.set('edit', 'next');
    const now = Date.now();
    // deadline = game_date - 1h; locked game has game_date = now + 30min → deadline = now - 30min (passed)
    const lockedGame = testFactories.game({ id: 'locked-game', game_date: new Date(now + 30 * 60 * 1000) });
    // open game has game_date = now + 2h → deadline = now + 1h (open)
    const openGame = testFactories.game({ id: 'open-game', game_date: new Date(now + 2 * 60 * 60 * 1000) });
    const tournament = testFactories.tournament();
    const team = testFactories.team();

    render(
      <UnifiedGamesPageClient
        games={[lockedGame, openGame] as any}
        gameCounts={{ total: 2, predicted: 0, remaining: 2 }}
        teamsMap={{ [team.id]: team }}
        tournamentId={tournament.id}
        groups={[]}
        rounds={[]}
        tournament={tournament}
        closingGames={[]}
        tournamentPredictionCompletion={null}
        tournamentStartDate={undefined}
        qualifiedTeamsHref="/en/tournaments/t1/qualified-teams"
      />
    );

    await act(async () => { vi.runAllTimers(); });

    expect(mockTriggerEdit).toHaveBeenCalledWith('open-game');
    expect(mockTriggerEdit).not.toHaveBeenCalledWith('locked-game');
  });

  it('should do nothing when no edit parameter', () => {
    // No edit parameter in URL
    mockSearchParams.clear();

    const game = testFactories.game();
    const tournament = testFactories.tournament();
    const team = testFactories.team();

    render(
      <UnifiedGamesPageClient
        games={[game]}
        gameCounts={{ total: 1, predicted: 0, remaining: 1 }}
        teamsMap={{ [team.id]: team }}
        tournamentId={tournament.id}
        groups={[]}
        rounds={[]}
        tournament={tournament}
        closingGames={[]}
        tournamentPredictionCompletion={null}
        tournamentStartDate={undefined}
        qualifiedTeamsHref="/en/tournaments/t1/qualified-teams"
      />
    );

    // Verify no filter changes or edit triggers
    expect(mockSetActiveFilter).not.toHaveBeenCalledWith('all');
    expect(mockTriggerEdit).not.toHaveBeenCalled();
  });
});

describe('UnifiedGamesPageClient AI Generate All', () => {
  const now = Date.now();
  // Game with deadline well in the future
  const openGame = testFactories.game({
    id: 'open-game',
    home_team: 'team-a',
    away_team: 'team-b',
    game_date: new Date(now + 5 * 60 * 60 * 1000), // 5 hours from now
  });
  const tournament = testFactories.tournament();
  const team = testFactories.team();

  const mockBulkSetGameGuesses = vi.fn();

  const renderComponent = (contextOverrides: any = {}) =>
    render(
      <GuessesContext.Provider value={{
        gameGuesses: {},
        boostCounts: { silver: { used: 0, max: 5 }, golden: { used: 0, max: 3 } },
        bulkSetGameGuesses: mockBulkSetGameGuesses,
        ...contextOverrides,
      }}>
        <UnifiedGamesPageClient
          games={[openGame] as any}
          gameCounts={{ total: 1, predicted: 0, remaining: 1 }}
          teamsMap={{ [team.id]: team }}
          tournamentId={tournament.id}
          groups={[]}
          rounds={[]}
          tournament={tournament}
          closingGames={[]}
          tournamentPredictionCompletion={null}
          tournamentStartDate={undefined}
          qualifiedTeamsHref="/en/tournaments/t1/qualified-teams"
        />
      </GuessesContext.Provider>
    );

  beforeEach(async () => {
    vi.clearAllMocks();
    const { useFilterContext } = vi.mocked(await import('../context-providers/filter-context-provider'));
    useFilterContext.mockReturnValue({
      activeFilter: 'all', groupFilter: null, roundFilter: null,
      setActiveFilter: vi.fn(), setGroupFilter: vi.fn(), setRoundFilter: vi.fn()
    });
    const { useEditTrigger } = vi.mocked(await import('../context-providers/edit-trigger-context-provider'));
    useEditTrigger.mockReturnValue({
      triggerEdit: vi.fn(), registerTrigger: vi.fn(),
      isEditMode: false, isEditModeRef: { current: false }, setEditMode: vi.fn()
    });
    vi.mocked(nextNavigation.useSearchParams).mockReturnValue({
      get: () => null, getAll: () => [], has: () => false,
      keys: () => [][Symbol.iterator](), values: () => [][Symbol.iterator](),
      entries: () => [][Symbol.iterator](), forEach: () => {}, toString: () => '',
      size: 0, [Symbol.iterator]: () => [][Symbol.iterator]()
    } as unknown as URLSearchParams);
    vi.mocked(nextNavigation.useRouter).mockReturnValue({
      push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(),
      back: vi.fn(), forward: vi.fn(), refresh: vi.fn()
    } as unknown as ReturnType<typeof nextNavigation.useRouter>);
  });

  it('shows AI generate FAB when there are open unpredicted games', () => {
    renderComponent();
    // The FAB is rendered as a button (via the @mui/material mock)
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('calls bulkSetGameGuesses and closes dialog on successful generation', async () => {
    vi.mocked(guessesActions.updateOrCreateGameGuesses).mockResolvedValueOnce({ success: true });
    renderComponent();

    // Click the AI FAB to open dialog (first button that's not disabled)
    const fab = screen.getAllByRole('button').find(b => !b.disabled);
    expect(fab).toBeDefined();
    fireEvent.click(fab!);

    // Dialog should now be visible
    expect(screen.getByTestId('ai-dialog')).toBeInTheDocument();

    // Click confirm
    await act(async () => {
      fireEvent.click(screen.getByTestId('ai-dialog-confirm'));
    });

    expect(guessesActions.updateOrCreateGameGuesses).toHaveBeenCalledTimes(1);
    expect(mockBulkSetGameGuesses).toHaveBeenCalledTimes(1);
  });

  it('shows error and keeps dialog open when server returns success=false', async () => {
    vi.mocked(guessesActions.updateOrCreateGameGuesses).mockResolvedValueOnce({
      success: false, error: 'Server error'
    });
    renderComponent();

    const fab = screen.getAllByRole('button').find(b => !b.disabled);
    fireEvent.click(fab!);
    expect(screen.getByTestId('ai-dialog')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByTestId('ai-dialog-confirm'));
    });

    expect(mockBulkSetGameGuesses).not.toHaveBeenCalled();
    // Dialog still open
    expect(screen.getByTestId('ai-dialog')).toBeInTheDocument();
  });
});
