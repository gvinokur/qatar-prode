'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

interface CountdownContextType {
  currentTime: number;
}

const CountdownContext = createContext<CountdownContextType | undefined>(undefined);

export function useCountdownContext() {
  const context = useContext(CountdownContext);
  if (!context) {
    throw new Error('useCountdownContext must be used within CountdownProvider');
  }
  return context;
}

interface CountdownProviderProps {
  children: React.ReactNode;
}

/**
 * Provides a shared timer that updates every second.
 * This prevents performance issues when rendering multiple countdown timers.
 * All countdown components subscribe to this single interval.
 */
export function CountdownProvider({ children }: Readonly<CountdownProviderProps>) {
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    // Update every second
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const value = useMemo(() => ({ currentTime }), [currentTime]);

  return (
    <CountdownContext.Provider value={value}>
      {children}
    </CountdownContext.Provider>
  );
}
