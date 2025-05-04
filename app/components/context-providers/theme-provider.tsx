'use client'

import {createTheme} from "@mui/material/styles";
import {ThemeProvider} from "@mui/material";
import {createContext, useEffect, useState} from "react";
import {useTheme } from 'next-themes'

export type ThemeMode = 'light' | 'dark'

export const AppThemeModeContext = createContext({
  themeMode: 'light' as ThemeMode,
  switchThemeMode: () => {},
})

export default function AppThemeProvider(
  {
    children,
  }: {
    children: React.ReactNode
  }) {
  const { theme: themeMode, setTheme} = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, []);

  const handleSwitchTheme = async () => {
    const newThemeMode = themeMode === 'light' ? 'dark' : 'light'
    setTheme(newThemeMode)
  }

  const lightTheme = {
    primary: {
      main: '#b71c1c',
      contrastText: '#dddddd'
    },
    secondary: {
      main: '#90caf9',
    },
  }
  const darkTheme = {
    mode: 'dark',
    primary: {
      main: '#e57373',  // A softer, muted red
      contrastText: '#f5f5f5'
    },
    secondary: {
      main: '#5c93c4',  // A deeper, desaturated blue
    },
    background: {
      default: '#1a1a1a',  // Not quite black
      paper: '#242424',    // Slightly lighter for elevated surfaces
    },
    text: {
      primary: '#e0e0e0',  // Not pure white
      secondary: '#a0a0a0', // Muted secondary text
    },
    divider: 'rgba(255, 255, 255, 0.08)'  // Subtle dividers
  }

  const themeToUse = themeMode === 'light' ? lightTheme : darkTheme

  const theme = createTheme({
    palette: {
      ...themeToUse
    },
  });

  const context = {
    themeMode: themeMode as ThemeMode,
    switchThemeMode: handleSwitchTheme
  }

  return mounted ? (
    <AppThemeModeContext.Provider value={context}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </AppThemeModeContext.Provider>
  ) : null
}

