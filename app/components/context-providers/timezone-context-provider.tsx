'use client'

import React, { createContext, useContext, useState, useEffect } from 'react';

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

  return (
    <TimezoneContext.Provider value={{ showLocalTime, toggleTimezone }}>
      {children}
    </TimezoneContext.Provider>
  );
}

export const useTimezone = () => useContext(TimezoneContext); 