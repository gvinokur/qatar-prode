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

  // Inject CSS gradient variable based on theme mode
  useEffect(() => {
    if (mounted) {
      const gradientValue = themeMode === 'light'
        ? 'linear-gradient(135deg, #c62828 0%, #e53935 100%)'
        : 'linear-gradient(135deg, #d32f2f 0%, #e57373 100%)';
      document.documentElement.style.setProperty('--gradient-primary', gradientValue);
    }
  }, [mounted, themeMode])

  const lightTheme = {
    primary: {
      main: '#c62828',        // Base red (gradient start)
      light: '#e53935',       // Gradient end
      dark: '#b71c1c',        // Darker variant
      contrastText: '#ffffff'
    },
    secondary: {
      main: '#90caf9',
    },
    accent: {
      gold: {
        main: '#ffc107',      // Better than #FFD700 for contrast
        light: '#ffd54f',
        dark: '#ffa000',
        contrastText: '#000000'
      },
      silver: {
        main: '#C0C0C0',
        light: '#E0E0E0',
        dark: '#A0A0A0',
        contrastText: '#000000'
      }
    }
  }
  const darkTheme = {
    mode: 'dark',
    primary: {
      main: '#e57373',      // A softer, muted red
      light: '#ef9a9a',
      dark: '#d32f2f',
      contrastText: '#ffffff'
    },
    secondary: {
      main: '#5c93c4',      // A deeper, desaturated blue
    },
    accent: {
      gold: {
        main: '#ffb300',    // Dimmed 20% for dark mode readability
        light: '#ffd54f',
        dark: '#ff8f00',
        contrastText: '#000000'
      },
      silver: {
        main: '#B0B0B0',    // Dimmed for dark mode
        light: '#D0D0D0',
        dark: '#909090',
        contrastText: '#000000'
      }
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

