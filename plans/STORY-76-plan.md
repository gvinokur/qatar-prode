# Implementation Plan: Story #76 - Create Context Provider Utilities

## Story Context

**Issue:** #76 - Story 4: Create Context Provider Utilities
**Epic:** #72 - Test Pattern Refactoring & Utility Standardization
**Worktree:** `/Users/gvinokur/Personal/qatar-prode-story-76`
**Branch:** `feature/story-76`

## Problem Statement

Test files manually set up GuessesContext and TimezoneProvider with 50-120 lines of boilerplate per file. This pattern is repeated across 10+ test files, creating:
- Verbose setup code (23 lines for mock context, 20 lines for wrapper)
- Inconsistent mock values across tests
- Hard to compose multiple contexts together
- No easy way to test different context states

## Solution Overview

Extend `__tests__/utils/test-utils.tsx` (created in Story #73) with:
1. `renderWithProviders()` - Composable render function supporting theme + context + timezone
2. `createMockGuessesContext()` - Factory for creating mock context values with sensible defaults
3. Maintain backward compatibility with existing `renderWithTheme()` from Story #73

**Impact:** Reduce 50-120 lines per file to 3-5 lines, clean composable API.

---

## Technical Approach

### 1. File to Modify

**Single file:** `/Users/gvinokur/Personal/qatar-prode-story-76/__tests__/utils/test-utils.tsx`

Current state (from Story #73):
- Has `renderWithTheme()` function with ThemeProvider support
- Has `RenderWithThemeOptions` interface
- Has `rerenderWithTheme()` rerender support
- Well-documented with JSDoc examples

### 2. Type Definitions to Add

**Import additional types:**
```typescript
import { GuessesContext } from '@/components/context-providers/guesses-context-provider';
import type { GameGuessNew, TournamentGroupTeamStatsGuessNew } from '@/db/tables-definition';
import { TimezoneProvider } from '@/components/context-providers/timezone-context-provider';
```

**New interfaces:**
```typescript
// GuessesContext value type (matches actual context)
export type GameGuessMap = { [k: string]: GameGuessNew };

export interface GuessesContextValue {
  gameGuesses: GameGuessMap;
  guessedPositions: TournamentGroupTeamStatsGuessNew[];
  updateGameGuess: (gameId: string, gameGuess: GameGuessNew) => Promise<void>;
  pendingSaves: Set<string>;
  saveErrors: Record<string, string>;
  clearSaveError: (gameId: string) => void;
  flushPendingSave: (gameId: string) => Promise<void>;
}

// Options for renderWithProviders
export interface RenderWithProvidersOptions extends RenderWithThemeOptions {
  /** GuessesContext mock value. Pass true for defaults, or provide custom values */
  guessesContext?: Partial<GuessesContextValue> | boolean;
  /** Include TimezoneProvider wrapper */
  timezone?: boolean;
}

// Enhanced result with rerender support
export interface RenderWithProvidersResult extends RenderResult {
  /** Rerender function that maintains all providers */
  rerenderWithProviders: (component: React.ReactElement) => void;
}
```

### 3. Mock Context Factory

**Function signature:**
```typescript
export const createMockGuessesContext = (
  overrides?: Partial<GuessesContextValue>
): GuessesContextValue
```

**Implementation logic:**
```typescript
export const createMockGuessesContext = (
  overrides?: Partial<GuessesContextValue>
): GuessesContextValue => {
  return {
    gameGuesses: {},
    guessedPositions: [],
    updateGameGuess: vi.fn().mockResolvedValue(undefined),
    pendingSaves: new Set<string>(),
    saveErrors: {},
    clearSaveError: vi.fn(),
    flushPendingSave: vi.fn().mockResolvedValue(undefined),
    ...overrides
  };
};
```

**Why this approach:**
- Empty defaults work for most tests (empty gameGuesses, empty pendingSaves)
- Easy to override specific properties
- Returns complete GuessesContextValue (no partial types leaking)
- Mock functions return resolved promises (matches actual async behavior)
- Includes all 7 properties used in actual test files

### 4. Composable Render Function

**Function signature:**
```typescript
export const renderWithProviders = (
  component: React.ReactElement,
  options: RenderWithProvidersOptions = {}
): RenderWithProvidersResult
```

**Provider nesting order (outermost to innermost):**
```
ThemeProvider (always present)
  └─ TimezoneProvider (if timezone: true)
    └─ GuessesContext.Provider (if guessesContext provided)
      └─ Component
```

**Implementation logic:**
```typescript
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
```

**Key design decisions:**
- Theme always present (backward compatible behavior)
- GuessesContext optional (only if provided in options)
- TimezoneProvider optional (only if timezone: true)
- Provider composition preserves nesting order on rerender
- Options extend RenderWithThemeOptions (smooth API evolution)

### 5. Backward Compatibility

**Preserve existing `renderWithTheme()` function:**
- Keep as-is, no modifications needed
- Story #73 tests continue working
- Used in 19+ files, don't break them

**Transition strategy:**
- Old tests: Continue using `renderWithTheme()`
- New tests: Use `renderWithProviders()` for context support
- No migration required for existing tests

---

## Implementation Steps

### Step 1: Extend test-utils.tsx (45 minutes)
1. Add import statements (GuessesContext, types, TimezoneProvider)
2. Add type definitions (interfaces, types)
3. Implement `createMockGuessesContext()` factory
4. Implement `renderWithProviders()` function
5. Add JSDoc documentation with examples
6. Verify TypeScript compilation: `npm run build`

### Step 2: Create Unit Tests (30 minutes)
**New file:** `__tests__/utils/test-utils.test.tsx`

Test coverage:
- `createMockGuessesContext()` returns defaults
- `createMockGuessesContext()` merges overrides
- `renderWithProviders()` with no options (theme only)
- `renderWithProviders()` with guessesContext: true
- `renderWithProviders()` with guessesContext: partial overrides
- `renderWithProviders()` with timezone: true
- `renderWithProviders()` with all options combined
- `rerenderWithProviders()` maintains all providers
- Context values accessible to child components

### Step 3: Migrate Sample Test File (30 minutes)
**File:** `__tests__/components/game-view.test.tsx`

Current pattern (42 lines of boilerplate):
```typescript
// Lines 58-70: Mock game guesses (~13 lines)
const mockGameGuesses: { [k: string]: GameGuessNew } = {
  'game1': {
    game_id: 'game1',
    game_number: 1,
    user_id: 'user1',
    home_score: 2,
    away_score: 1,
    home_penalty_winner: false,
    away_penalty_winner: false,
    home_team: 'team1',
    away_team: 'team2',
  },
};

// Lines 72-80: Mock context value (~9 lines)
const mockContext = {
  gameGuesses: mockGameGuesses,
  guessedPositions: [],
  updateGameGuess: vi.fn(),
  pendingSaves: new Set<string>(),
  saveErrors: {},
  clearSaveError: vi.fn(),
  flushPendingSave: vi.fn(),
};

// Lines 121-140: Manual render wrapper (~20 lines)
const renderGameView = (
  game: ExtendedGameData = baseGame,
  teamsMap: { [k: string]: Team } = mockTeamsMap,
  handleEditClick = vi.fn(),
  disabled = false,
  gameGuesses = mockGameGuesses
) => {
  return render(
    <TimezoneProvider>
      <GuessesContext.Provider value={{ ...mockContext, gameGuesses }}>
        <GameView
          game={game}
          teamsMap={teamsMap}
          handleEditClick={handleEditClick}
          disabled={disabled}
        />
      </GuessesContext.Provider>
    </TimezoneProvider>
  );
};
```

New pattern (5-8 lines):
```typescript
import { renderWithProviders, createMockGuessesContext } from '@/__tests__/utils/test-utils';

const renderGameView = (gameGuesses = {}) => {
  return renderWithProviders(<GameView {...props} />, {
    guessesContext: createMockGuessesContext({ gameGuesses }),
    timezone: true
  });
};
```

**Migration checklist:**
- Keep mock game data (lines 58-70 - still needed for test data)
- Remove manual mock context setup (lines 72-80, ~9 lines)
- Remove manual render wrapper (lines 121-140, ~20 lines)
- Add imports from test-utils
- Create new renderGameView using renderWithProviders
- Preserve function parameters (game, teamsMap, handleEditClick, disabled, gameGuesses)
- Run tests to verify behavior unchanged: `npm test game-view.test.tsx`

### Step 4: Validate Integration (15 minutes)
1. Run full test suite: `npm test`
2. Verify Story #73 tests still pass (backward compatibility)
3. Verify game-view.test.tsx passes with new utility
4. Check TypeScript compilation: `npm run build`
5. Run linter: `npm run lint`

### Step 5: Document Usage (15 minutes)
Add JSDoc to new functions with usage examples:
- `createMockGuessesContext()` - show default vs override patterns
- `renderWithProviders()` - show single provider vs composition
- Include before/after examples in comments

**Total estimated time:** 2-2.5 hours

---

## Files to Create/Modify

### Files to Modify
1. `/Users/gvinokur/Personal/qatar-prode-story-76/__tests__/utils/test-utils.tsx`
   - Add imports (GuessesContext, types, TimezoneProvider)
   - Add type definitions (3 interfaces, ~40 lines)
   - Add `createMockGuessesContext()` (~10 lines)
   - Add `renderWithProviders()` (~50 lines)
   - Add JSDoc documentation (~20 lines)
   - **Total:** ~120 lines added

2. `/Users/gvinokur/Personal/qatar-prode-story-76/__tests__/components/game-view.test.tsx`
   - Remove manual context setup (~35 lines deleted)
   - Add test-utils imports (~2 lines)
   - Update renderGameView helper (~5 lines)
   - **Net:** ~30 lines removed

### Files to Create
3. `/Users/gvinokur/Personal/qatar-prode-story-76/__tests__/utils/test-utils.test.tsx`
   - Unit tests for new utilities
   - ~150-200 lines of comprehensive tests

---

## Acceptance Criteria

### Functional Requirements
- ✅ `renderWithProviders()` supports theme option (from Story #73)
- ✅ `renderWithProviders()` supports guessesContext option
- ✅ `renderWithProviders()` supports timezone option
- ✅ `createMockGuessesContext()` provides sensible defaults
- ✅ `createMockGuessesContext()` accepts partial overrides
- ✅ `rerenderWithProviders()` maintains all providers
- ✅ All providers compose correctly (theme + context + timezone)
- ✅ Backward compatibility: `renderWithTheme()` still works

### Quality Gates
- ✅ All tests passing: `npm test`
- ✅ Story #73 tests still pass (backward compatibility check)
- ✅ TypeScript compiles: `npm run build`
- ✅ Linter passes: `npm run lint`
- ✅ 80% coverage on new code (test-utils additions)
- ✅ No `any` types in implementation
- ✅ JSDoc documentation complete

### Integration Validation
- ✅ game-view.test.tsx migrated successfully
- ✅ Boilerplate reduced (29 lines removed: context setup + wrapper)
- ✅ Test behavior unchanged after migration
- ✅ Context values accessible in child components
- ✅ All 7 context properties (gameGuesses, guessedPositions, updateGameGuess, pendingSaves, saveErrors, clearSaveError, flushPendingSave) working correctly

---

## Testing Strategy

### Unit Tests (test-utils.test.tsx)

**Test Suite Structure:**
```typescript
describe('createMockGuessesContext', () => {
  it('returns default values when no overrides provided')
  it('merges overrides into defaults')
  it('overrides gameGuesses')
  it('overrides guessedPositions')
  it('overrides updateGameGuess')
  it('creates mock function that resolves')
});

describe('renderWithProviders', () => {
  describe('theme support', () => {
    it('renders with default light theme')
    it('renders with dark theme')
    it('applies theme overrides')
  });

  describe('guessesContext support', () => {
    it('renders without context when not provided')
    it('renders with default context when guessesContext: true')
    it('renders with custom context when provided partial overrides')
    it('makes context accessible to child components')
  });

  describe('timezone support', () => {
    it('renders without TimezoneProvider when timezone: false')
    it('renders with TimezoneProvider when timezone: true')
    it('makes timezone context accessible to child')
  });

  describe('provider composition', () => {
    it('composes theme + context')
    it('composes theme + timezone')
    it('composes context + timezone')
    it('composes all three: theme + context + timezone')
    it('nests providers in correct order')
  });

  describe('rerender support', () => {
    it('rerenderWithProviders maintains theme')
    it('rerenderWithProviders maintains guessesContext')
    it('rerenderWithProviders maintains timezone')
    it('rerenderWithProviders maintains all providers together')
  });
});
```

### Integration Tests (game-view.test.tsx)

**Validation approach:**
- Run existing tests after migration
- All assertions should still pass
- Test behavior unchanged (only setup simplified)
- Context values work as before

**Test scenario example:**
```typescript
it('renders game view with guesses context', () => {
  const mockGameGuesses = { 'game1': { ... } };

  renderWithProviders(<GameView game={baseGame} />, {
    guessesContext: createMockGuessesContext({ gameGuesses: mockGameGuesses }),
    timezone: true
  });

  // Existing assertions still work
  expect(screen.getByText('Team 1')).toBeInTheDocument();
});
```

---

## Verification Steps

### Pre-Implementation Verification
1. ✅ Story #73 is merged and complete
2. ✅ `__tests__/utils/test-utils.tsx` exists with `renderWithTheme()`
3. ✅ Story #73 tests are passing
4. ✅ Worktree is on correct branch: `feature/story-76`

### Post-Implementation Verification
1. **Run test suite:** `npm test`
   - All tests should pass
   - No regression in Story #73 tests
   - New test-utils.test.tsx should pass

2. **Check TypeScript:** `npm run build`
   - No type errors
   - All imports resolve correctly

3. **Run linter:** `npm run lint`
   - No ESLint errors
   - No unused imports

4. **Check coverage:** `npm test -- --coverage`
   - 80%+ coverage on test-utils.tsx additions
   - test-utils.test.tsx has comprehensive coverage

5. **Manual verification:**
   - Read test-utils.tsx - clean, well-documented
   - Read game-view.test.tsx - boilerplate reduced, tests pass
   - Verify backward compatibility - renderWithTheme still works

---

## Usage Examples

### Before (Manual Setup - 42 lines)
```typescript
// Mock game guesses (lines 58-70, ~13 lines)
const mockGameGuesses: { [k: string]: GameGuessNew } = {
  'game1': {
    game_id: 'game1',
    game_number: 1,
    user_id: 'user1',
    home_score: 2,
    away_score: 1,
    home_penalty_winner: false,
    away_penalty_winner: false,
    home_team: 'team1',
    away_team: 'team2',
  },
};

// Mock context (lines 72-80, ~9 lines)
const mockContext = {
  gameGuesses: mockGameGuesses,
  guessedPositions: [],
  updateGameGuess: vi.fn(),
  pendingSaves: new Set<string>(),
  saveErrors: {},
  clearSaveError: vi.fn(),
  flushPendingSave: vi.fn(),
};

// Manual wrapper (lines 121-140, ~20 lines)
const renderGameView = (
  game = baseGame,
  teamsMap = mockTeamsMap,
  handleEditClick = vi.fn(),
  disabled = false,
  gameGuesses = mockGameGuesses
) => {
  return render(
    <TimezoneProvider>
      <GuessesContext.Provider value={{ ...mockContext, gameGuesses }}>
        <GameView
          game={game}
          teamsMap={teamsMap}
          handleEditClick={handleEditClick}
          disabled={disabled}
        />
      </GuessesContext.Provider>
    </TimezoneProvider>
  );
};
```

### After (With Utility - 5 lines)
```typescript
import { renderWithProviders, createMockGuessesContext } from '@/__tests__/utils/test-utils';

const renderGameView = (gameGuesses = {}) => {
  return renderWithProviders(<GameView game={baseGame} teamsMap={mockTeamsMap} />, {
    guessesContext: createMockGuessesContext({ gameGuesses }),
    timezone: true
  });
};
```

### Additional Usage Patterns

**Just context (no timezone):**
```typescript
renderWithProviders(<MyComponent />, {
  guessesContext: createMockGuessesContext({ gameGuesses: { ... } })
});
```

**Just timezone (no context):**
```typescript
renderWithProviders(<MyComponent />, {
  timezone: true
});
```

**Theme + context + timezone:**
```typescript
renderWithProviders(<MyComponent />, {
  theme: 'dark',
  guessesContext: createMockGuessesContext({ guessedPositions: [...] }),
  timezone: true
});
```

**Default context (empty gameGuesses):**
```typescript
renderWithProviders(<MyComponent />, {
  guessesContext: true
});
```

---

## Risk Assessment

### Low Risk Areas
- Adding new functions (non-breaking)
- Type definitions (compile-time safety)
- Mock factory (simple defaults)

### Medium Risk Areas
- Provider nesting order (must be correct)
- Rerender functionality (must preserve providers)
- Backward compatibility (must not break Story #73)

### Mitigation Strategies
1. **Provider nesting:** Follow exact pattern from existing tests
2. **Rerender:** Test thoroughly in unit tests
3. **Backward compatibility:** Run Story #73 tests before committing
4. **Type safety:** Use strict TypeScript, no `any` types

### Rollback Plan
- Changes are additive (don't modify existing functions)
- Can rollback file changes if issues arise
- Story #73 unaffected (renderWithTheme preserved)

---

## Dependencies

### Blocks
- Story #5 (Testing Guidelines) - Will document these utilities

### Depends On
- ✅ Story #73 (Theme Utilities) - MUST be complete first
- Extends the same `test-utils.tsx` file
- Builds on existing pattern

### Independent Of
- Stories #2, #3, #6, #7 - No conflicts

---

## Definition of Done

- ✅ `test-utils.tsx` extended with new functions
- ✅ `createMockGuessesContext()` implemented with defaults and overrides
- ✅ `renderWithProviders()` implemented with provider composition
- ✅ `rerenderWithProviders()` maintains all providers
- ✅ Unit tests created in `test-utils.test.tsx`
- ✅ `game-view.test.tsx` migrated to use new utilities
- ✅ All tests passing (including Story #73 tests)
- ✅ TypeScript compiles without errors
- ✅ Linter passes
- ✅ 80%+ coverage on new code
- ✅ JSDoc documentation complete
- ✅ No `any` types in implementation
- ✅ Backward compatibility verified

---

## Notes for Implementation

### Key Considerations
1. **Import paths:** Use `@/` alias for absolute imports
2. **Mock functions:** Use `vi.fn().mockResolvedValue(undefined)` for async functions
3. **Provider order:** Theme → Timezone → Guesses → Component (outermost to innermost)
4. **Type safety:** Import types from actual source files (not redefine)
5. **Documentation:** Follow existing JSDoc style from Story #73

### Don't Forget
- Test rerender functionality thoroughly
- Verify Story #73 tests still pass (backward compatibility)
- Check that context values are accessible in test components
- Document all usage patterns in JSDoc
- Keep mock defaults simple (empty objects/arrays)

### Success Indicators
- Boilerplate reduced from 43 lines to 5-8 lines
- All providers compose correctly
- Tests pass with same behavior as before
- Story #73 tests unaffected
- Clean, well-documented code
