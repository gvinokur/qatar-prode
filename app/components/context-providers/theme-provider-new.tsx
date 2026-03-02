'use client'

import {createTheme} from "@mui/material/styles";
import {ThemeProvider} from "@mui/material";
import {useTheme } from 'next-themes'
import {useEffect, useState} from "react";
import {useThemeVariant} from './theme-variant-provider'

export type ThemeMode = 'light' | 'dark'

export default function AppThemeProvider(
  {
    children,
  }: {
    children: React.ReactNode
  }) {
  const { resolvedTheme: themeMode } = useTheme()
  const { variant } = useThemeVariant()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Theme definitions for all 3 variants
  const themeDefinitions = {
    violet: {
      dark: {
        mode: 'dark',
        primary: {
          main: '#7c3aed',      // Soft violet
          light: '#a78bfa',
          dark: '#6b21a8',
          contrastText: '#ffffff'
        },
        secondary: {
          main: '#f87171',      // Coral-red
          light: '#fca5a5',
          dark: '#dc2626',
        },
        accent: {
          gold: {
            main: '#fbbf24',
            light: '#fcd34d',
            dark: '#f59e0b',
            contrastText: '#000000'
          },
          silver: {
            main: '#B0B0B0',
            light: '#D0D0D0',
            dark: '#909090',
            contrastText: '#000000'
          }
        },
        background: {
          default: '#0f0a1a',
          paper: '#1e1330',
        },
        text: {
          primary: '#faf5ff',
          secondary: '#d8b4fe',
        },
        divider: 'rgba(167, 139, 250, 0.12)'
      },
      light: {
        mode: 'light',
        primary: {
          main: '#7c3aed',
          light: '#a855f7',
          dark: '#6b21a8',
          contrastText: '#ffffff'
        },
        secondary: {
          main: '#f87171',
          light: '#fca5a5',
          dark: '#dc2626',
        },
        accent: {
          gold: {
            main: '#f59e0b',
            light: '#fbbf24',
            dark: '#d97706',
            contrastText: '#000000'
          },
          silver: {
            main: '#9ca3af',
            light: '#d1d5db',
            dark: '#6b7280',
            contrastText: '#000000'
          }
        },
        background: {
          default: '#f5f3ff',
          paper: '#ffffff',
        },
        text: {
          primary: '#2e1065',
          secondary: '#7c3aed',
        },
        divider: 'rgba(124, 58, 237, 0.12)'
      }
    },
    rose: {
      dark: {
        mode: 'dark',
        primary: {
          main: '#e11d48',      // Rose red
          light: '#f43f5e',
          dark: '#881337',
          contrastText: '#ffffff'
        },
        secondary: {
          main: '#fde68a',      // Cream-yellow
          light: '#fef3c7',
          dark: '#fbbf24',
        },
        accent: {
          gold: {
            main: '#fbbf24',
            light: '#fcd34d',
            dark: '#f59e0b',
            contrastText: '#000000'
          },
          silver: {
            main: '#B0B0B0',
            light: '#D0D0D0',
            dark: '#909090',
            contrastText: '#000000'
          }
        },
        background: {
          default: '#120808',
          paper: '#1c0e0e',
        },
        text: {
          primary: '#fff1f2',
          secondary: '#fecdd3',
        },
        divider: 'rgba(251, 113, 133, 0.12)'
      },
      light: {
        mode: 'light',
        primary: {
          main: '#b91c1c',
          light: '#dc2626',
          dark: '#7f1d1d',
          contrastText: '#ffffff'
        },
        secondary: {
          main: '#78350f',      // Brown
          light: '#92400e',
          dark: '#451a03',
        },
        accent: {
          gold: {
            main: '#f59e0b',
            light: '#fbbf24',
            dark: '#d97706',
            contrastText: '#000000'
          },
          silver: {
            main: '#9ca3af',
            light: '#d1d5db',
            dark: '#6b7280',
            contrastText: '#000000'
          }
        },
        background: {
          default: '#fef2f2',
          paper: '#ffffff',
        },
        text: {
          primary: '#450a0a',
          secondary: '#991b1b',
        },
        divider: 'rgba(185, 28, 28, 0.12)'
      }
    },
    olive: {
      dark: {
        mode: 'dark',
        primary: {
          main: '#65a30d',      // Olive green
          light: '#84cc16',
          dark: '#3f6212',
          contrastText: '#ffffff'
        },
        secondary: {
          main: '#ea580c',      // Orange
          light: '#fb923c',
          dark: '#c2410c',
        },
        accent: {
          gold: {
            main: '#fbbf24',
            light: '#fcd34d',
            dark: '#f59e0b',
            contrastText: '#000000'
          },
          silver: {
            main: '#B0B0B0',
            light: '#D0D0D0',
            dark: '#909090',
            contrastText: '#000000'
          }
        },
        background: {
          default: '#050a05',
          paper: '#0d1a0d',
        },
        text: {
          primary: '#f7fee7',
          secondary: '#d9f99d',
        },
        divider: 'rgba(132, 204, 22, 0.12)'
      },
      light: {
        mode: 'light',
        primary: {
          main: '#3f6212',
          light: '#65a30d',
          dark: '#1a2e05',
          contrastText: '#ffffff'
        },
        secondary: {
          main: '#ea580c',
          light: '#fb923c',
          dark: '#c2410c',
        },
        accent: {
          gold: {
            main: '#f59e0b',
            light: '#fbbf24',
            dark: '#d97706',
            contrastText: '#000000'
          },
          silver: {
            main: '#9ca3af',
            light: '#d1d5db',
            dark: '#6b7280',
            contrastText: '#000000'
          }
        },
        background: {
          default: '#f7fee7',
          paper: '#ffffff',
        },
        text: {
          primary: '#1a2e05',
          secondary: '#3f6212',
        },
        divider: 'rgba(63, 98, 18, 0.12)'
      }
    }
  }

  // Gradient definitions for CSS variables
  const gradients = {
    violet: {
      dark: 'linear-gradient(135deg, #6b21a8 0%, #a78bfa 100%)',
      light: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)'
    },
    rose: {
      dark: 'linear-gradient(135deg, #881337 0%, #e11d48 100%)',
      light: 'linear-gradient(135deg, #7f1d1d 0%, #b91c1c 100%)'
    },
    olive: {
      dark: 'linear-gradient(135deg, #3f6212 0%, #65a30d 100%)',
      light: 'linear-gradient(135deg, #3f6212 0%, #65a30d 100%)'
    }
  }

  // Inject CSS gradient variable based on theme mode and variant
  useEffect(() => {
    if (mounted && themeMode && variant) {
      const gradientValue = gradients[variant][themeMode as 'light' | 'dark']
      document.documentElement.style.setProperty('--gradient-primary', gradientValue);

      // Also set a data attribute for variant-specific styling
      document.documentElement.setAttribute('data-theme-variant', variant)
    }
  }, [mounted, themeMode, variant])

  // Get the current theme configuration
  const mode = (themeMode as 'light' | 'dark') || 'dark'
  const themeConfig = themeDefinitions[variant][mode]

  const theme = createTheme({
    palette: {
      ...themeConfig
    },
  });

  return mounted && <ThemeProvider theme={theme}>{children}</ThemeProvider>
}
