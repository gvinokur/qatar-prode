'use client'

import {createTheme} from "@mui/material/styles";
import {ThemeProvider} from "@mui/material";
import {useTheme } from 'next-themes'
import {useEffect, useState} from "react";

export type ThemeMode = 'light' | 'dark'

export default function AppThemeProvider(
  {
    children,
  }: {
    children: React.ReactNode
  }) {
  const { resolvedTheme: themeMode } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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

  return mounted && <ThemeProvider theme={theme}>{children}</ThemeProvider>
}

