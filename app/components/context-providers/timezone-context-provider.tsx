'use client'

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

type TimezoneContextType = {
  showLocalTime: boolean;
  toggleTimezone: () => void;
};

const TimezoneContext = createContext<TimezoneContextType>({
  showLocalTime: true,
  toggleTimezone: () => {},
});

export function TimezoneProvider({ children }: { children: React.ReactNode }) {
  const [showLocalTime, setShowLocalTime] = useState(true);

  // Load preference from localStorage on mount
  useEffect(() => {
    const savedPreference = localStorage.getItem('showLocalTime');
    if (savedPreference !== null) {
      setShowLocalTime(savedPreference === 'true');
    }
  }, []);

  const toggleTimezone = () => {
    const newValue = !showLocalTime;
    setShowLocalTime(newValue);
    localStorage.setItem('showLocalTime', String(newValue));
  };

  const contextValue = useMemo(
    () => ({ showLocalTime, toggleTimezone }),
    [showLocalTime, toggleTimezone]
  );

  return (
    <TimezoneContext.Provider value={contextValue}>
      {children}
    </TimezoneContext.Provider>
  );
}

export const useTimezone = () => useContext(TimezoneContext); 