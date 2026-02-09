# Component Testing Utilities

This directory contains reusable utilities for testing React components with theme and context providers.

## Contents

- **test-utils.tsx** - Component rendering utilities (`renderWithTheme`, `renderWithProviders`, context mocks)
- **test-theme.ts** - Theme creation utilities for consistent test themes

## Quick Start

```typescript
import { renderWithTheme, renderWithProviders, createMockGuessesContext } from '@/__tests__/utils/test-utils';
import { screen } from '@testing-library/react';

// Simple component with theme
renderWithTheme(<MyComponent />);

// Component with theme + context
renderWithProviders(<MyComponent />, {
  guessesContext: true,
  timezone: true
});
```

---

## renderWithTheme()

Renders a component wrapped in MUI ThemeProvider with a test theme. Use this for **any component that uses MUI theme** (colors, spacing, typography, etc.).

### Function Signature

```typescript
function renderWithTheme(
  component: React.ReactElement,
  options?: RenderWithThemeOptions
): RenderWithThemeResult

interface RenderWithThemeOptions {
  /** Theme mode: 'light' or 'dark' (default: 'light') */
  theme?: 'light' | 'dark';
  /** Optional theme configuration overrides (supports any MUI ThemeOptions) */
  themeOverrides?: ThemeOptions;
}

interface RenderWithThemeResult extends RenderResult {
  /** Rerender function that automatically wraps component with ThemeProvider */
  rerenderWithTheme: (component: React.ReactElement) => void;
}
```

### Usage Examples

#### Basic Usage (Light Theme)

```typescript
import { renderWithTheme } from '@/__tests__/utils/test-utils';
import { screen } from '@testing-library/react';
import { BoostBadge } from '../boost-badge';

describe('BoostBadge', () => {
  it('should render with theme colors', () => {
    renderWithTheme(<BoostBadge boost="gold" />);

    const badge = screen.getByTestId('boost-badge');
    expect(badge).toHaveStyle({ backgroundColor: '#ffc107' });
  });
});
```

#### Dark Theme

```typescript
it('should render correctly in dark mode', () => {
  renderWithTheme(<MyComponent />, { theme: 'dark' });

  const element = screen.getByRole('button');
  // Theme automatically provides dark mode colors
  expect(element).toHaveStyle({ color: '#fff' });
});
```

#### Custom Theme Overrides

```typescript
it('should use custom primary color', () => {
  renderWithTheme(<MyComponent />, {
    themeOverrides: {
      palette: {
        primary: { main: '#ff0000' }
      }
    }
  });

  const button = screen.getByRole('button');
  expect(button).toHaveStyle({ backgroundColor: '#ff0000' });
});
```

#### Using rerenderWithTheme

```typescript
it('should update when props change', () => {
  const { rerenderWithTheme } = renderWithTheme(<Counter count={0} />);

  expect(screen.getByText('Count: 0')).toBeInTheDocument();

  // Rerender maintains theme wrapper
  rerenderWithTheme(<Counter count={5} />);

  expect(screen.getByText('Count: 5')).toBeInTheDocument();
});
```

### When to Use renderWithTheme

✅ **Use when:**
- Component uses MUI components (Button, Typography, Box, etc.)
- Component uses theme properties (theme.palette, theme.spacing, etc.)
- Component uses `sx` prop or `styled()` components
- Testing theme-dependent styles or behavior

❌ **Don't use when:**
- Component doesn't use any MUI theme features
- Component needs context providers (use `renderWithProviders` instead)
- Testing plain React components with no styling

---

## renderWithProviders()

Renders a component wrapped in multiple providers (theme, context, timezone). Use this for **components that need context or multiple providers**.

### Function Signature

```typescript
function renderWithProviders(
  component: React.ReactElement,
  options?: RenderWithProvidersOptions
): RenderWithProvidersResult

interface RenderWithProvidersOptions extends RenderWithThemeOptions {
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

interface RenderWithProvidersResult extends RenderResult {
  /** Rerender function that maintains all providers (theme, context, timezone) */
  rerenderWithProviders: (component: React.ReactElement) => void;
}
```

### Usage Examples

#### Basic Usage (Theme Only)

```typescript
import { renderWithProviders } from '@/__tests__/utils/test-utils';

it('should render with theme', () => {
  // Same as renderWithTheme(<MyComponent />)
  renderWithProviders(<MyComponent />);

  expect(screen.getByRole('button')).toBeInTheDocument();
});
```

#### Theme + Default Context

```typescript
it('should render with default guesses context', () => {
  renderWithProviders(<GameView />, {
    guessesContext: true  // Uses default mock values
  });

  // Component has access to empty gameGuesses, mock functions, etc.
  expect(screen.getByText('No guesses yet')).toBeInTheDocument();
});
```

#### Theme + Custom Context Values

```typescript
import { createMockGuessesContext, testFactories } from '@/__tests__/utils/test-utils';

it('should display game guesses', () => {
  const mockGuesses = {
    'game-1': testFactories.gameGuess({
      game_id: 'game-1',
      home_team_score: 2,
      away_team_score: 1
    })
  };

  renderWithProviders(<GameView />, {
    guessesContext: createMockGuessesContext({
      gameGuesses: mockGuesses
    })
  });

  expect(screen.getByText('2 - 1')).toBeInTheDocument();
});
```

#### Theme + Context + Timezone

```typescript
it('should format times in user timezone', () => {
  renderWithProviders(<GameSchedule />, {
    guessesContext: true,
    timezone: true  // Wraps with TimezoneProvider
  });

  // Component has access to timezone context
  expect(screen.getByText(/10:00 AM/)).toBeInTheDocument();
});
```

#### All Options with Dark Theme

```typescript
it('should work with all providers and dark theme', () => {
  const mockGuesses = { 'game-1': testFactories.gameGuess() };

  renderWithProviders(<ComplexComponent />, {
    theme: 'dark',
    themeOverrides: { palette: { primary: { main: '#custom' } } },
    guessesContext: createMockGuessesContext({ gameGuesses: mockGuesses }),
    timezone: true
  });

  // Component has theme, context, and timezone providers
  expect(screen.getByRole('main')).toBeInTheDocument();
});
```

#### Using rerenderWithProviders

```typescript
it('should update when props change', () => {
  const { rerenderWithProviders } = renderWithProviders(<GameView gameId="1" />, {
    guessesContext: true,
    timezone: true
  });

  expect(screen.getByText('Game 1')).toBeInTheDocument();

  // Rerender maintains all providers
  rerenderWithProviders(<GameView gameId="2" />);

  expect(screen.getByText('Game 2')).toBeInTheDocument();
});
```

### When to Use renderWithProviders

✅ **Use when:**
- Component uses `useContext(GuessesContext)` or `useGuesses()` hook
- Component uses `useTimezone()` hook
- Component needs multiple providers (theme + context + timezone)
- Testing context-dependent behavior

❌ **Don't use when:**
- Component only needs theme (use `renderWithTheme` instead - simpler)
- Component doesn't use any contexts or providers

---

## createMockGuessesContext()

Creates a mock GuessesContext value with sensible defaults. Use this helper to create context values for `renderWithProviders`.

### Function Signature

```typescript
function createMockGuessesContext(
  overrides?: Partial<GuessesContextValue>
): GuessesContextValue

interface GuessesContextValue {
  gameGuesses: GameGuessMap;
  updateGameGuess: (gameId: string, gameGuess: GameGuessNew) => Promise<void>;
}
```

### Default Values

When called without arguments, returns:
- `gameGuesses`: `{}` (empty)
- `guessedPositions`: `[]` (empty)
- `updateGameGuess`: Mock function (resolves successfully)
- `pendingSaves`: Empty Set
- `saveErrors`: `{}` (empty)
- `clearSaveError`: Mock function
- `flushPendingSave`: Mock function (resolves successfully)

### Usage Examples

#### Use Defaults

```typescript
import { renderWithProviders, createMockGuessesContext } from '@/__tests__/utils/test-utils';

it('should render with empty guesses', () => {
  renderWithProviders(<GameView />, {
    guessesContext: createMockGuessesContext()
    // OR just: guessesContext: true
  });

  expect(screen.getByText('No guesses')).toBeInTheDocument();
});
```

#### Override Game Guesses

```typescript
it('should display existing guesses', () => {
  const mockGuesses = {
    'game-1': testFactories.gameGuess({ game_id: 'game-1', home_team_score: 3 }),
    'game-2': testFactories.gameGuess({ game_id: 'game-2', away_team_score: 2 })
  };

  renderWithProviders(<GameList />, {
    guessesContext: createMockGuessesContext({
      gameGuesses: mockGuesses
    })
  });

  expect(screen.getByText('3 - 0')).toBeInTheDocument();
  expect(screen.getByText('0 - 2')).toBeInTheDocument();
});
```

#### Override with Pending Saves

```typescript
it('should show saving indicator', () => {
  renderWithProviders(<GameCard gameId="game-1" />, {
    guessesContext: createMockGuessesContext({
      pendingSaves: new Set(['game-1'])
    })
  });

  expect(screen.getByText('Saving...')).toBeInTheDocument();
});
```

#### Override with Save Errors

```typescript
it('should display save error', () => {
  renderWithProviders(<GameCard gameId="game-1" />, {
    guessesContext: createMockGuessesContext({
      saveErrors: { 'game-1': 'Network error' }
    })
  });

  expect(screen.getByText('Network error')).toBeInTheDocument();
});
```

#### Custom Mock Implementations

```typescript
import { vi } from 'vitest';

it('should handle update failure', async () => {
  const mockUpdate = vi.fn().mockRejectedValue(new Error('Save failed'));

  renderWithProviders(<GameForm gameId="game-1" />, {
    guessesContext: createMockGuessesContext({
      updateGameGuess: mockUpdate
    })
  });

  // Trigger update
  await userEvent.click(screen.getByRole('button', { name: 'Save' }));

  expect(mockUpdate).toHaveBeenCalled();
  expect(screen.getByText('Save failed')).toBeInTheDocument();
});
```

---

## When to Use What

Use this decision tree to choose the right utility:

```
Does component use MUI theme?
    ↓                    ↓
   YES                  NO
    ↓                    ↓
Does it use context?   Use standard render()
    ↓        ↓
   YES      NO
    ↓        ↓
renderWithProviders  renderWithTheme
```

### Decision Matrix

| Component Uses | Utility to Use | Example |
|----------------|----------------|---------|
| MUI theme only | `renderWithTheme()` | Styled components, MUI components |
| MUI + GuessesContext | `renderWithProviders({ guessesContext: true })` | Game cards with guess state |
| MUI + Timezone | `renderWithProviders({ timezone: true })` | Date/time displays |
| MUI + Multiple contexts | `renderWithProviders({ guessesContext: true, timezone: true })` | Full game views |
| No theme or context | `render()` (standard RTL) | Plain React components |

---

## DO NOT DO - Common Antipatterns

### ❌ Don't Create Local Theme Setup

```typescript
// ❌ BAD - Duplicates theme setup in every test file
import { createTheme, ThemeProvider } from '@mui/material/styles';

const testTheme = createTheme({
  palette: { mode: 'light', primary: { main: '#1976d2' } }
});

const renderWithTheme = (component) =>
  render(<ThemeProvider theme={testTheme}>{component}</ThemeProvider>);

describe('MyComponent', () => {
  it('should render', () => {
    renderWithTheme(<MyComponent />);
  });
});
```

✅ **GOOD - Use shared utility:**

```typescript
// ✅ GOOD - Uses shared, consistent test theme
import { renderWithTheme } from '@/__tests__/utils/test-utils';

describe('MyComponent', () => {
  it('should render', () => {
    renderWithTheme(<MyComponent />);
  });
});
```

### ❌ Don't Create Local Context Wrappers

```typescript
// ❌ BAD - Manual wrapper creation
const mockContext = {
  gameGuesses: {},
  updateGameGuess: vi.fn(),
  // ... all other properties
};

const wrapper = ({ children }) => (
  <GuessesContext.Provider value={mockContext}>
    {children}
  </GuessesContext.Provider>
);

render(<MyComponent />, { wrapper });
```

✅ **GOOD - Use renderWithProviders:**

```typescript
// ✅ GOOD - Composable and complete
import { renderWithProviders, createMockGuessesContext } from '@/__tests__/utils/test-utils';

renderWithProviders(<MyComponent />, {
  guessesContext: createMockGuessesContext()
  // OR just: guessesContext: true
});
```

### ❌ Don't Manually Compose Multiple Providers

```typescript
// ❌ BAD - Error-prone manual composition
const testTheme = createTestTheme('light');
const mockContext = createMockGuessesContext();

const AllProviders = ({ children }) => (
  <ThemeProvider theme={testTheme}>
    <TimezoneProvider>
      <GuessesContext.Provider value={mockContext}>
        {children}
      </GuessesContext.Provider>
    </TimezoneProvider>
  </ThemeProvider>
);

render(<MyComponent />, { wrapper: AllProviders });
```

✅ **GOOD - Use renderWithProviders with options:**

```typescript
// ✅ GOOD - Clean and declarative
renderWithProviders(<MyComponent />, {
  guessesContext: true,
  timezone: true
});
```

---

## Migration from Old Patterns

If you have existing tests using old patterns, migrate them to use these utilities:

### Before: Local Theme Setup

```typescript
// Old pattern
const testTheme = createTheme({ palette: { mode: 'light' } });
render(<ThemeProvider theme={testTheme}><MyComponent /></ThemeProvider>);
```

### After: Use renderWithTheme

```typescript
// New pattern
import { renderWithTheme } from '@/__tests__/utils/test-utils';
renderWithTheme(<MyComponent />);
```

### Before: Manual Context Wrapper

```typescript
// Old pattern
const wrapper = ({ children }) => (
  <GuessesContext.Provider value={mockContext}>
    {children}
  </GuessesContext.Provider>
);
render(<MyComponent />, { wrapper });
```

### After: Use renderWithProviders

```typescript
// New pattern
import { renderWithProviders } from '@/__tests__/utils/test-utils';
renderWithProviders(<MyComponent />, { guessesContext: true });
```

---

## Related Documentation

- **[Testing Guide](../../docs/claude/testing.md)** - Complete testing guidelines
- **[Mock Utilities Guide](../__tests__/mocks/README.md)** - Next.js and NextAuth mocking
- **[Database Testing Guide](../__tests__/db/README.md)** - Repository and database mocking

---

## Summary

**Three main utilities:**
1. **`renderWithTheme()`** - For MUI components (theme only)
2. **`renderWithProviders()`** - For components with contexts (theme + context + timezone)
3. **`createMockGuessesContext()`** - For creating context mock values

**Key principles:**
- Don't duplicate theme/context setup code
- Use the right utility for your component's needs
- Leverage composition with `renderWithProviders` options
- Test behavior, not implementation details
