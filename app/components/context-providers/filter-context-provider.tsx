'use client'

import { createContext, useState, useContext, useCallback, useMemo, ReactNode } from 'react';
import { FilterType } from '../../utils/game-filters';

interface FilterContextValue {
  activeFilter: FilterType;
  groupFilter: string | null;
  roundFilter: string | null;
  setActiveFilter: (filter: FilterType) => void;
  setGroupFilter: (groupId: string | null) => void;
  setRoundFilter: (round: string | null) => void;
}

const FilterContext = createContext<FilterContextValue | undefined>(undefined);

interface FilterContextProviderProps {
  readonly children: ReactNode;
  readonly tournamentId: string;
}

export function FilterContextProvider({
  children,
  tournamentId
}: FilterContextProviderProps) {
  // Load from localStorage on mount (NAMESPACED by tournament ID to avoid collisions)
  const [activeFilter, setActiveFilterState] = useState<FilterType>(() => {
    if (typeof globalThis.window === 'undefined') return 'all';
    const key = `tournamentFilter-${tournamentId}`;
    const stored = globalThis.localStorage.getItem(key);
    return (stored as FilterType) || 'all';
  });

  const [groupFilter, setGroupFilterState] = useState<string | null>(() => {
    if (typeof globalThis.window === 'undefined') return null;
    const key = `tournamentGroupFilter-${tournamentId}`;
    return globalThis.localStorage.getItem(key) || null;
  });

  const [roundFilter, setRoundFilterState] = useState<string | null>(() => {
    if (typeof globalThis.window === 'undefined') return null;
    const key = `tournamentRoundFilter-${tournamentId}`;
    return globalThis.localStorage.getItem(key) || null;
  });

  // Persist to localStorage on change (NAMESPACED)
  const setActiveFilter = useCallback((filter: FilterType) => {
    setActiveFilterState(filter);
    const key = `tournamentFilter-${tournamentId}`;
    globalThis.localStorage.setItem(key, filter);

    // Reset secondary filters when primary filter changes
    setGroupFilterState(null);
    setRoundFilterState(null);
    globalThis.localStorage.removeItem(`tournamentGroupFilter-${tournamentId}`);
    globalThis.localStorage.removeItem(`tournamentRoundFilter-${tournamentId}`);
  }, [tournamentId]);

  const setGroupFilter = useCallback((groupId: string | null) => {
    setGroupFilterState(groupId);
    const key = `tournamentGroupFilter-${tournamentId}`;
    if (groupId) {
      globalThis.localStorage.setItem(key, groupId);
    } else {
      globalThis.localStorage.removeItem(key);
    }
  }, [tournamentId]);

  const setRoundFilter = useCallback((round: string | null) => {
    setRoundFilterState(round);
    const key = `tournamentRoundFilter-${tournamentId}`;
    if (round) {
      globalThis.localStorage.setItem(key, round);
    } else {
      globalThis.localStorage.removeItem(key);
    }
  }, [tournamentId]);

  const value = useMemo<FilterContextValue>(() => ({
    activeFilter,
    groupFilter,
    roundFilter,
    setActiveFilter,
    setGroupFilter,
    setRoundFilter
  }), [activeFilter, groupFilter, roundFilter, setActiveFilter, setGroupFilter, setRoundFilter]);

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilterContext() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilterContext must be used within FilterContextProvider');
  }
  return context;
}
