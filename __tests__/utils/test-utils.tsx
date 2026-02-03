import { render, type RenderResult } from '@testing-library/react';
import { ThemeProvider, type ThemeOptions } from '@mui/material/styles';
import { createTestTheme } from './test-theme';

export interface RenderWithThemeOptions {
  /** Theme mode: 'light' or 'dark' (default: 'light') */
  theme?: 'light' | 'dark';
  /** Optional theme configuration overrides (supports any MUI ThemeOptions) */
  themeOverrides?: ThemeOptions;
}

export interface RenderWithThemeResult extends RenderResult {
  /** Rerender function that automatically wraps component with ThemeProvider */
  rerenderWithTheme: (component: React.ReactElement) => void;
}

/**
 * Renders a component wrapped in MUI ThemeProvider with test theme
 *
 * @param component - React component to render
 * @param options - Optional theme configuration
 * @returns Testing Library render result with rerenderWithTheme function
 *
 * @example
 * // Basic usage with default light theme
 * renderWithTheme(<MyComponent />);
 *
 * @example
 * // Dark theme
 * renderWithTheme(<MyComponent />, { theme: 'dark' });
 *
 * @example
 * // Rerender with theme
 * const { rerenderWithTheme } = renderWithTheme(<MyComponent prop="initial" />);
 * rerenderWithTheme(<MyComponent prop="updated" />);
 *
 * @example
 * // Custom theme overrides
 * renderWithTheme(<MyComponent />, {
 *   themeOverrides: { palette: { primary: { main: '#custom' } } }
 * });
 */
export const renderWithTheme = (
  component: React.ReactElement,
  options: RenderWithThemeOptions = {}
): RenderWithThemeResult => {
  const theme = createTestTheme(
    options.theme || 'light',
    options.themeOverrides
  );

  const result = render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );

  return {
    ...result,
    rerenderWithTheme: (component: React.ReactElement) => {
      result.rerender(
        <ThemeProvider theme={theme}>
          {component}
        </ThemeProvider>
      );
    }
  };
};
