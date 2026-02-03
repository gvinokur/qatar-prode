import { createTheme, type Theme, type ThemeOptions } from '@mui/material/styles';

/**
 * Creates a standardized MUI theme for testing
 *
 * @param mode - Theme mode ('light' or 'dark')
 * @param overrides - Optional theme configuration overrides (supports any MUI ThemeOptions)
 * @returns Configured MUI Theme instance
 *
 * @example
 * // Default light theme with accent colors
 * const theme = createTestTheme();
 *
 * @example
 * // Dark theme
 * const darkTheme = createTestTheme('dark');
 *
 * @example
 * // Custom overrides
 * const customTheme = createTestTheme('light', {
 *   palette: { primary: { main: '#custom' } }
 * });
 */
export const createTestTheme = (
  mode: 'light' | 'dark' = 'light',
  overrides?: ThemeOptions
): Theme => {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: '#1976d2',
        light: '#42a5f5',
        dark: '#1565c0',
        contrastText: '#ffffff'
      },
      secondary: {
        main: '#f50057',
        light: '#f73378',
        dark: '#c51162',
        contrastText: '#ffffff'
      },
      accent: {
        gold: {
          main: '#ffc107',
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
    },
    ...overrides
  });
};
