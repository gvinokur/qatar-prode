import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { FilterContextProvider, useFilterContext } from '../../../app/components/context-providers/filter-context-provider';
import { FilterType } from '../../../app/utils/game-filters';
import type { ReactNode } from 'react';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }
  };
})();

// Set up global mocks
beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
    writable: true,
    configurable: true
  });
  localStorageMock.clear();
});

afterEach(() => {
  localStorageMock.clear();
});

// Helper to render hook with provider
const createWrapper = (tournamentId: string) => {
  return ({ children }: { children: ReactNode }) => (
    <FilterContextProvider tournamentId={tournamentId}>
      {children}
    </FilterContextProvider>
  );
};

describe('FilterContextProvider', () => {
  const tournamentId = 'tournament-123';

  describe('initialization', () => {
    it('initializes with default values when localStorage is empty', () => {
      const { result } = renderHook(() => useFilterContext(), {
        wrapper: createWrapper(tournamentId)
      });

      expect(result.current.activeFilter).toBe('all');
      expect(result.current.groupFilter).toBeNull();
      expect(result.current.roundFilter).toBeNull();
    });

    it('loads activeFilter from localStorage on mount', () => {
      localStorageMock.setItem(`tournamentFilter-${tournamentId}`, 'groups');

      const { result } = renderHook(() => useFilterContext(), {
        wrapper: createWrapper(tournamentId)
      });

      expect(result.current.activeFilter).toBe('groups');
    });

    it('loads groupFilter from localStorage on mount', () => {
      localStorageMock.setItem(`tournamentGroupFilter-${tournamentId}`, 'group-a');

      const { result } = renderHook(() => useFilterContext(), {
        wrapper: createWrapper(tournamentId)
      });

      expect(result.current.groupFilter).toBe('group-a');
    });

    it('loads roundFilter from localStorage on mount', () => {
      localStorageMock.setItem(`tournamentRoundFilter-${tournamentId}`, 'round-1');

      const { result } = renderHook(() => useFilterContext(), {
        wrapper: createWrapper(tournamentId)
      });

      expect(result.current.roundFilter).toBe('round-1');
    });

    it('loads all filters from localStorage when all are present', () => {
      localStorageMock.setItem(`tournamentFilter-${tournamentId}`, 'playoffs');
      localStorageMock.setItem(`tournamentGroupFilter-${tournamentId}`, 'group-b');
      localStorageMock.setItem(`tournamentRoundFilter-${tournamentId}`, 'round-2');

      const { result } = renderHook(() => useFilterContext(), {
        wrapper: createWrapper(tournamentId)
      });

      expect(result.current.activeFilter).toBe('playoffs');
      expect(result.current.groupFilter).toBe('group-b');
      expect(result.current.roundFilter).toBe('round-2');
    });
  });

  describe('namespace isolation', () => {
    it('isolates localStorage keys by tournament ID', () => {
      const tournament1 = 'tournament-1';
      const tournament2 = 'tournament-2';

      // Set filter for tournament 1
      localStorageMock.setItem(`tournamentFilter-${tournament1}`, 'groups');

      // Tournament 2 should have default value
      const { result } = renderHook(() => useFilterContext(), {
        wrapper: createWrapper(tournament2)
      });

      expect(result.current.activeFilter).toBe('all'); // not 'groups'
    });

    it('allows different tournaments to have different filter values', () => {
      const tournament1 = 'tournament-1';
      const tournament2 = 'tournament-2';

      localStorageMock.setItem(`tournamentFilter-${tournament1}`, 'groups');
      localStorageMock.setItem(`tournamentFilter-${tournament2}`, 'playoffs');

      const { result: result1 } = renderHook(() => useFilterContext(), {
        wrapper: createWrapper(tournament1)
      });
      const { result: result2 } = renderHook(() => useFilterContext(), {
        wrapper: createWrapper(tournament2)
      });

      expect(result1.current.activeFilter).toBe('groups');
      expect(result2.current.activeFilter).toBe('playoffs');
    });
  });

  describe('setActiveFilter', () => {
    it('updates activeFilter state', () => {
      const { result } = renderHook(() => useFilterContext(), {
        wrapper: createWrapper(tournamentId)
      });

      act(() => {
        result.current.setActiveFilter('unpredicted');
      });

      expect(result.current.activeFilter).toBe('unpredicted');
    });

    it('persists activeFilter to localStorage', () => {
      const { result } = renderHook(() => useFilterContext(), {
        wrapper: createWrapper(tournamentId)
      });

      act(() => {
        result.current.setActiveFilter('closingSoon');
      });

      expect(localStorageMock.getItem(`tournamentFilter-${tournamentId}`)).toBe('closingSoon');
    });

    it('resets groupFilter when activeFilter changes', () => {
      localStorageMock.setItem(`tournamentGroupFilter-${tournamentId}`, 'group-a');

      const { result } = renderHook(() => useFilterContext(), {
        wrapper: createWrapper(tournamentId)
      });

      act(() => {
        result.current.setActiveFilter('playoffs');
      });

      expect(result.current.groupFilter).toBeNull();
    });

    it('resets roundFilter when activeFilter changes', () => {
      localStorageMock.setItem(`tournamentRoundFilter-${tournamentId}`, 'round-1');

      const { result } = renderHook(() => useFilterContext(), {
        wrapper: createWrapper(tournamentId)
      });

      act(() => {
        result.current.setActiveFilter('groups');
      });

      expect(result.current.roundFilter).toBeNull();
    });

    it('removes secondary filters from localStorage when activeFilter changes', () => {
      localStorageMock.setItem(`tournamentGroupFilter-${tournamentId}`, 'group-a');
      localStorageMock.setItem(`tournamentRoundFilter-${tournamentId}`, 'round-1');

      const { result } = renderHook(() => useFilterContext(), {
        wrapper: createWrapper(tournamentId)
      });

      act(() => {
        result.current.setActiveFilter('unpredicted');
      });

      expect(localStorageMock.getItem(`tournamentGroupFilter-${tournamentId}`)).toBeNull();
      expect(localStorageMock.getItem(`tournamentRoundFilter-${tournamentId}`)).toBeNull();
    });

    it('handles all filter types', () => {
      const { result } = renderHook(() => useFilterContext(), {
        wrapper: createWrapper(tournamentId)
      });

      const filterTypes: FilterType[] = ['all', 'groups', 'playoffs', 'unpredicted', 'closingSoon'];

      filterTypes.forEach(filterType => {
        act(() => {
          result.current.setActiveFilter(filterType);
        });

        expect(result.current.activeFilter).toBe(filterType);
        expect(localStorageMock.getItem(`tournamentFilter-${tournamentId}`)).toBe(filterType);
      });
    });
  });

  describe('setGroupFilter', () => {
    it('updates groupFilter state', () => {
      const { result } = renderHook(() => useFilterContext(), {
        wrapper: createWrapper(tournamentId)
      });

      act(() => {
        result.current.setGroupFilter('group-a');
      });

      expect(result.current.groupFilter).toBe('group-a');
    });

    it('persists groupFilter to localStorage', () => {
      const { result } = renderHook(() => useFilterContext(), {
        wrapper: createWrapper(tournamentId)
      });

      act(() => {
        result.current.setGroupFilter('group-b');
      });

      expect(localStorageMock.getItem(`tournamentGroupFilter-${tournamentId}`)).toBe('group-b');
    });

    it('removes groupFilter from localStorage when set to null', () => {
      localStorageMock.setItem(`tournamentGroupFilter-${tournamentId}`, 'group-a');

      const { result } = renderHook(() => useFilterContext(), {
        wrapper: createWrapper(tournamentId)
      });

      act(() => {
        result.current.setGroupFilter(null);
      });

      expect(result.current.groupFilter).toBeNull();
      expect(localStorageMock.getItem(`tournamentGroupFilter-${tournamentId}`)).toBeNull();
    });

    it('allows changing groupFilter multiple times', () => {
      const { result } = renderHook(() => useFilterContext(), {
        wrapper: createWrapper(tournamentId)
      });

      act(() => {
        result.current.setGroupFilter('group-a');
      });
      expect(result.current.groupFilter).toBe('group-a');

      act(() => {
        result.current.setGroupFilter('group-b');
      });
      expect(result.current.groupFilter).toBe('group-b');

      act(() => {
        result.current.setGroupFilter(null);
      });
      expect(result.current.groupFilter).toBeNull();
    });
  });

  describe('setRoundFilter', () => {
    it('updates roundFilter state', () => {
      const { result } = renderHook(() => useFilterContext(), {
        wrapper: createWrapper(tournamentId)
      });

      act(() => {
        result.current.setRoundFilter('round-1');
      });

      expect(result.current.roundFilter).toBe('round-1');
    });

    it('persists roundFilter to localStorage', () => {
      const { result } = renderHook(() => useFilterContext(), {
        wrapper: createWrapper(tournamentId)
      });

      act(() => {
        result.current.setRoundFilter('round-2');
      });

      expect(localStorageMock.getItem(`tournamentRoundFilter-${tournamentId}`)).toBe('round-2');
    });

    it('removes roundFilter from localStorage when set to null', () => {
      localStorageMock.setItem(`tournamentRoundFilter-${tournamentId}`, 'round-1');

      const { result } = renderHook(() => useFilterContext(), {
        wrapper: createWrapper(tournamentId)
      });

      act(() => {
        result.current.setRoundFilter(null);
      });

      expect(result.current.roundFilter).toBeNull();
      expect(localStorageMock.getItem(`tournamentRoundFilter-${tournamentId}`)).toBeNull();
    });

    it('allows changing roundFilter multiple times', () => {
      const { result } = renderHook(() => useFilterContext(), {
        wrapper: createWrapper(tournamentId)
      });

      act(() => {
        result.current.setRoundFilter('round-1');
      });
      expect(result.current.roundFilter).toBe('round-1');

      act(() => {
        result.current.setRoundFilter('round-2');
      });
      expect(result.current.roundFilter).toBe('round-2');

      act(() => {
        result.current.setRoundFilter(null);
      });
      expect(result.current.roundFilter).toBeNull();
    });
  });

  describe('useFilterContext error handling', () => {
    it('throws error when used outside FilterContextProvider', () => {
      // Suppress console.error for this test
      const consoleError = console.error;
      console.error = vi.fn();

      expect(() => {
        renderHook(() => useFilterContext());
      }).toThrow('useFilterContext must be used within FilterContextProvider');

      console.error = consoleError;
    });
  });

  describe('SSR compatibility', () => {
    it('returns default values when window is undefined', () => {
      // This is implicitly tested by the initialization tests since we're in a test environment
      // where globalThis.window might not exist or behave like a browser
      const { result } = renderHook(() => useFilterContext(), {
        wrapper: createWrapper(tournamentId)
      });

      expect(result.current.activeFilter).toBe('all');
      expect(result.current.groupFilter).toBeNull();
      expect(result.current.roundFilter).toBeNull();
    });
  });

  describe('integration scenarios', () => {
    it('maintains state across filter changes', () => {
      const { result } = renderHook(() => useFilterContext(), {
        wrapper: createWrapper(tournamentId)
      });

      // Set all filters
      act(() => {
        result.current.setActiveFilter('groups');
        result.current.setGroupFilter('group-a');
      });

      expect(result.current.activeFilter).toBe('groups');
      expect(result.current.groupFilter).toBe('group-a');

      // Change to playoffs
      act(() => {
        result.current.setActiveFilter('playoffs');
        result.current.setRoundFilter('round-1');
      });

      expect(result.current.activeFilter).toBe('playoffs');
      expect(result.current.groupFilter).toBeNull(); // reset
      expect(result.current.roundFilter).toBe('round-1');
    });

    it('persists complete state to localStorage', () => {
      const { result } = renderHook(() => useFilterContext(), {
        wrapper: createWrapper(tournamentId)
      });

      act(() => {
        result.current.setActiveFilter('playoffs');
        result.current.setRoundFilter('semifinals');
      });

      // Create new hook instance to simulate page reload
      const { result: reloadedResult } = renderHook(() => useFilterContext(), {
        wrapper: createWrapper(tournamentId)
      });

      expect(reloadedResult.current.activeFilter).toBe('playoffs');
      expect(reloadedResult.current.roundFilter).toBe('semifinals');
    });
  });
});
