import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, act } from '@testing-library/react';
import { UnifiedGamesPageClient } from '../unified-games-page-client';
import * as nextNavigation from 'next/navigation';
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
    }
  })
}));

vi.mock('../utils/auto-scroll', () => ({
  scrollToGame: vi.fn(),
  findScrollTarget: vi.fn()
}));

vi.mock('@mui/material', () => ({
  Box: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Fab: ({ children, ...props }: any) => <button {...props}>{children}</button>,
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
      />
    );

    // Verify no filter changes or edit triggers
    expect(mockSetActiveFilter).not.toHaveBeenCalledWith('all');
    expect(mockTriggerEdit).not.toHaveBeenCalled();
  });
});
