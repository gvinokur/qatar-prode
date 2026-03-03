'use client'

import {createTheme, PaletteMode} from "@mui/material/styles";
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
        ? 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)'
        : 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)';
      document.documentElement.style.setProperty('--gradient-primary', gradientValue);
    }
  }, [mounted, themeMode])

  const lightTheme = {
    mode: 'light' as PaletteMode,
    primary: {
      main: '#7c3aed',        // Violet
      light: '#a855f7',
      dark: '#6b21a8',
      contrastText: '#ffffff'
    },
    secondary: {
      main: '#f87171',        // Coral
      light: '#fca5a5',
      dark: '#dc2626',
      contrastText: '#ffffff'
    },
    accent: {
      gold: {
        main: '#ffc107',      // Gold for awards (same as original)
        light: '#ffd54f',
        dark: '#ffa000',
        contrastText: '#000000'
      },
      silver: {
        main: '#C0C0C0',      // Silver for awards (same as original)
        light: '#E0E0E0',
        dark: '#A0A0A0',
        contrastText: '#000000'
      }
    },
    background: {
      default: '#f5f3ff',     // Lavender tint
      paper: '#ffffff',
    },
    text: {
      primary: '#2e1065',     // Deep purple
      secondary: '#7c3aed',   // Violet
    },
    divider: 'rgba(124, 58, 237, 0.12)'
  }

  const darkTheme = {
    mode: 'dark' as PaletteMode,
    primary: {
      main: '#a78bfa',        // SOFTER violet (less eye strain)
      light: '#c4b5fd',
      dark: '#8b5cf6',
      contrastText: '#ffffff'
    },
    secondary: {
      main: '#f87171',        // Coral
      light: '#fca5a5',
      dark: '#dc2626',
      contrastText: '#ffffff'
    },
    accent: {
      gold: {
        main: '#ffb300',      // Dimmed gold for dark mode
        light: '#ffd54f',
        dark: '#ff8f00',
        contrastText: '#000000'
      },
      silver: {
        main: '#B0B0B0',      // Dimmed silver for dark mode
        light: '#D0D0D0',
        dark: '#909090',
        contrastText: '#000000'
      }
    },
    background: {
      default: '#0a0a0a',     // NEUTRAL black (not purple-tinted)
      paper: '#1a1a1a',       // Neutral dark gray
    },
    text: {
      primary: '#e5e7eb',     // Neutral light gray
      secondary: '#9ca3af',   // Neutral medium gray
    },
    divider: 'rgba(255, 255, 255, 0.08)'
  }

  const themeToUse = themeMode === 'light' ? lightTheme : darkTheme

  const theme = createTheme({
    palette: {
      ...themeToUse
    },
    typography: {
      fontFamily: [
        'Archivo',              // Primary: Violet theme font (geometric, modern)
        'Roboto',               // MUI default fallback
        'Helvetica',            // System fallback
        'Arial',                // System fallback
        'sans-serif',           // Generic fallback
      ].join(','),
      // Configure font weights for MUI typography variants
      h1: { fontWeight: 700 },
      h2: { fontWeight: 700 },
      h3: { fontWeight: 600 },
      h4: { fontWeight: 600 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      subtitle1: { fontWeight: 500 },
      subtitle2: { fontWeight: 500 },
      body1: { fontWeight: 400 },
      body2: { fontWeight: 400 },
      button: { fontWeight: 600 },
    },
  });

  return mounted && <ThemeProvider theme={theme}>{children}</ThemeProvider>
}
