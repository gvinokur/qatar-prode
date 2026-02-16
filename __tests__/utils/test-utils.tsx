import { render, type RenderResult } from '@testing-library/react';
import { ThemeProvider, type ThemeOptions } from '@mui/material/styles';
import { createTestTheme } from './test-theme';
import { GuessesContext } from '../../app/components/context-providers/guesses-context-provider';
import { TimezoneProvider } from '../../app/components/context-providers/timezone-context-provider';
import type { GameGuessNew, TournamentGroupTeamStatsGuessNew } from '../../app/db/tables-definition';
import { vi } from 'vitest';

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

// Context provider types
export type GameGuessMap = { [k: string]: GameGuessNew };

/**
 * Boost counts structure
 */
export interface BoostCounts {
  silver: { used: number; max: number };
  golden: { used: number; max: number };
}

/**
 * Extended GuessesContext value type for testing
 * Includes both real context properties and test-specific mock properties
 */
export interface GuessesContextValue {
  gameGuesses: GameGuessMap;
  guessedPositions: TournamentGroupTeamStatsGuessNew[];
  boostCounts: BoostCounts;
  updateGameGuess: (gameId: string, gameGuess: GameGuessNew) => Promise<void>;
  pendingSaves: Set<string>;
  saveErrors: Record<string, string>;
  clearSaveError: (gameId: string) => void;
  flushPendingSave: (gameId: string) => Promise<void>;
}

/**
 * Options for renderWithProviders function
 * Extends RenderWithThemeOptions with context and timezone support
 */
export interface RenderWithProvidersOptions extends RenderWithThemeOptions {
  /**
   * GuessesContext mock value
   * - Pass `true` to use default mock values
   * - Pass partial object to override specific properties
   * - Omit or pass `undefined` to not include GuessesContext
   */
  guessesContext?: Partial<GuessesContextValue> | boolean;
  /**
   * Include TimezoneProvider wrapper
   * - Pass `true` to wrap component with TimezoneProvider
   * - Omit or pass `false` to not include TimezoneProvider
   */
  timezone?: boolean;
}

/**
 * Enhanced render result with rerender support for all providers
 */
export interface RenderWithProvidersResult extends RenderResult {
  /** Rerender function that maintains all providers (theme, context, timezone) */
  rerenderWithProviders: (component: React.ReactElement) => void;
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

/**
 * Creates a mock GuessesContext value with sensible defaults
 *
 * @param overrides - Partial context value to override defaults
 * @returns Complete GuessesContextValue with defaults and overrides merged
 *
 * @example
 * // Use defaults (empty gameGuesses, empty pendingSaves)
 * const context = createMockGuessesContext();
 *
 * @example
 * // Override specific properties
 * const context = createMockGuessesContext({
 *   gameGuesses: { 'game1': { game_id: 'game1', ... } },
 *   pendingSaves: new Set(['game1'])
 * });
 *
 * @example
 * // Override with custom mock implementations
 * const context = createMockGuessesContext({
 *   updateGameGuess: vi.fn().mockRejectedValue(new Error('Network error'))
 * });
 */
export const createMockGuessesContext = (
  overrides?: Partial<GuessesContextValue>
): GuessesContextValue => {
  return {
    gameGuesses: {},
    guessedPositions: [],
    boostCounts: {
      silver: { used: 0, max: 5 },
      golden: { used: 0, max: 2 }
    },
    updateGameGuess: vi.fn().mockResolvedValue(undefined),
    pendingSaves: new Set<string>(),
    saveErrors: {},
    clearSaveError: vi.fn(),
    flushPendingSave: vi.fn().mockResolvedValue(undefined),
    ...overrides
  };
};

/**
 * Renders a component wrapped in multiple providers (theme, context, timezone)
 * Provides a composable API for testing components that need various contexts
 *
 * @param component - React component to render
 * @param options - Configuration for providers (theme, guessesContext, timezone)
 * @returns Testing Library render result with rerenderWithProviders function
 *
 * @example
 * // Just theme (same as renderWithTheme)
 * renderWithProviders(<MyComponent />);
 *
 * @example
 * // Theme + default context
 * renderWithProviders(<MyComponent />, {
 *   guessesContext: true
 * });
 *
 * @example
 * // Theme + custom context values
 * renderWithProviders(<MyComponent />, {
 *   guessesContext: createMockGuessesContext({
 *     gameGuesses: { 'game1': mockGuess }
 *   })
 * });
 *
 * @example
 * // Theme + timezone
 * renderWithProviders(<MyComponent />, {
 *   timezone: true
 * });
 *
 * @example
 * // All providers with dark theme
 * renderWithProviders(<MyComponent />, {
 *   theme: 'dark',
 *   guessesContext: createMockGuessesContext({ gameGuesses: {...} }),
 *   timezone: true
 * });
 *
 * @example
 * // Rerender with providers
 * const { rerenderWithProviders } = renderWithProviders(<MyComponent prop="initial" />, {
 *   guessesContext: true,
 *   timezone: true
 * });
 * rerenderWithProviders(<MyComponent prop="updated" />);
 */
export const renderWithProviders = (
  component: React.ReactElement,
  options: RenderWithProvidersOptions = {}
): RenderWithProvidersResult => {
  const { theme, themeOverrides, guessesContext, timezone } = options;

  // Create theme
  const testTheme = createTestTheme(theme || 'light', themeOverrides);

  // Build context value if needed
  let contextValue: GuessesContextValue | undefined;
  if (guessesContext === true) {
    contextValue = createMockGuessesContext();
  } else if (guessesContext && typeof guessesContext === 'object') {
    contextValue = createMockGuessesContext(guessesContext);
  }

  // Compose providers from inside-out
  let wrapped = component;

  // Add GuessesContext if provided
  if (contextValue) {
    wrapped = (
      <GuessesContext.Provider value={contextValue}>
        {wrapped}
      </GuessesContext.Provider>
    );
  }

  // Add TimezoneProvider if requested
  if (timezone) {
    wrapped = <TimezoneProvider>{wrapped}</TimezoneProvider>;
  }

  // Always wrap in ThemeProvider
  wrapped = <ThemeProvider theme={testTheme}>{wrapped}</ThemeProvider>;

  // Render with Testing Library
  const result = render(wrapped);

  // Return with custom rerender that maintains all providers
  return {
    ...result,
    rerenderWithProviders: (newComponent: React.ReactElement) => {
      let wrappedRerender = newComponent;

      if (contextValue) {
        wrappedRerender = (
          <GuessesContext.Provider value={contextValue}>
            {wrappedRerender}
          </GuessesContext.Provider>
        );
      }

      if (timezone) {
        wrappedRerender = <TimezoneProvider>{wrappedRerender}</TimezoneProvider>;
      }

      wrappedRerender = (
        <ThemeProvider theme={testTheme}>{wrappedRerender}</ThemeProvider>
      );

      result.rerender(wrappedRerender);
    }
  };
};
