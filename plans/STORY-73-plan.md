# Implementation Plan: Story #73 - Create Theme Testing Utilities

## Story Context

**Epic:** Test Pattern Refactoring & Utility Standardization (#72)
**Priority:** P0 - CRITICAL (User-reported pain point)
**Effort:** 4-6 hours

### Problem Statement

Currently, 16 test files contain duplicated theme setup code (15-28 lines each), totaling ~300-400 lines of duplication. Every file that tests MUI-themed components recreates the same ThemeProvider wrapper and theme configuration. This creates:

1. **Maintenance burden**: Any theme change requires updating 16+ files
2. **Inconsistency**: Some tests use full accent colors (gold, silver, bronze), others use minimal themes
3. **Verbosity**: New tests require copying 15-28 lines of boilerplate
4. **User pain point**: Explicitly reported as an issue

### Objectives

1. Create centralized theme utilities to eliminate duplication
2. Provide `renderWithTheme()` function for easy component testing
3. Support both light and dark modes
4. Support theme overrides for edge cases
5. Reduce theme setup from 15-28 lines to 1 import

### Success Criteria

- ✅ Zero theme duplication in test files
- ✅ All 16+ test files updated to use new utilities
- ✅ All tests passing with same behavior
- ✅ Coverage maintained at ≥80%
- ✅ Full TypeScript support (no `any` types)
- ✅ 300-400 lines of code eliminated

## Research Findings

### Current Duplication Patterns

**Pattern 1: Full accent colors (10 files)**
```typescript
const testTheme = createTheme({
  palette: {
    mode: 'light',
    accent: {
      gold: { main: '#ffc107', light: '#ffd54f', dark: '#ffa000', contrastText: '#000000' },
      silver: { main: '#C0C0C0', light: '#E0E0E0', dark: '#A0A0A0', contrastText: '#000000' }
    }
  }
});
```
~20-28 lines per file

**Pattern 2: Minimal theme (6 files)**
```typescript
const theme = createTheme();
```
~9-12 lines per file (including renderWithTheme wrapper)

### Files to Update (16 total)

1. `__tests__/components/game-boost-selector.test.tsx` (28 lines, accent colors)
2. `__tests__/components/header/theme-switcher.test.tsx` (16 lines, basic theme)
3. `__tests__/components/urgency-game-card.test.tsx` (9 lines, basic theme)
4. `__tests__/components/urgency-accordion.test.tsx` (theme usage)
5. `__tests__/components/tournament-page/friend-groups-list.test.tsx` (theme usage)
6. `__tests__/components/tabbed-playoff-page.test.tsx` (theme usage)
7. `__tests__/components/prediction-status-bar.test.tsx` (theme usage)
8. `__tests__/components/point-breakdown-tooltip.test.tsx` (theme usage)
9. `__tests__/components/header/header.test.tsx` (theme usage)
10. `__tests__/components/game-result-edit-dialog.test.tsx` (theme usage)
11. `__tests__/components/game-prediction-edit-controls.test.tsx` (theme usage)
12. `__tests__/components/game-countdown-display.test.tsx` (theme usage)
13. `__tests__/components/game-card-point-overlay.test.tsx` (theme usage)
14. `__tests__/components/friend-groups/notification-dialog.test.tsx` (theme usage)
15. `__tests__/components/friend-groups/friend-groups-themer.test.tsx` (theme usage)
16. `__tests__/components/compact-game-view-card.test.tsx` (theme usage)

Additional files may be identified during migration.

## Technical Approach

### 1. Create Test Theme Utility

**File:** `__tests__/utils/test-theme.ts`

Create a factory function that generates MUI themes for testing:

```typescript
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
        },
        bronze: {
          main: '#CD7F32',
          light: '#E0A560',
          dark: '#A0632A',
          contrastText: '#000000'
        }
      }
    },
    ...overrides
  });
};
```

**Key features:**
- Includes standard MUI colors (primary, secondary) for consistency
- Includes all accent colors (gold, silver, bronze) for boost components
- Supports light/dark modes
- Accepts theme overrides using MUI's `ThemeOptions` type (supports typography, spacing, etc.)
- Fully typed return value (no `any` types)
- Comprehensive JSDoc

### 2. Create Render Utility

**File:** `__tests__/utils/test-utils.tsx`

Create a render helper that wraps components with ThemeProvider:

```typescript
import { render, type RenderResult } from '@testing-library/react';
import { ThemeProvider, type ThemeOptions } from '@mui/material/styles';
import { createTestTheme } from './test-theme';

export interface RenderWithThemeOptions {
  /** Theme mode: 'light' or 'dark' (default: 'light') */
  theme?: 'light' | 'dark';
  /** Optional theme configuration overrides (supports any MUI ThemeOptions) */
  themeOverrides?: ThemeOptions;
}

/**
 * Renders a component wrapped in MUI ThemeProvider with test theme
 *
 * @param component - React component to render
 * @param options - Optional theme configuration
 * @returns Testing Library render result
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
 * // Custom theme overrides
 * renderWithTheme(<MyComponent />, {
 *   themeOverrides: { palette: { primary: { main: '#custom' } } }
 * });
 */
export const renderWithTheme = (
  component: React.ReactElement,
  options: RenderWithThemeOptions = {}
): RenderResult => {
  const theme = createTestTheme(
    options.theme || 'light',
    options.themeOverrides
  );

  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};
```

**Key features:**
- Simple API: one function call instead of 15-28 lines
- Optional configuration for theme mode and overrides
- Fully typed parameters and return value
- Comprehensive JSDoc with examples

### 3. Migration Strategy

Update all 16 test files in batches:

**For each file:**
1. Remove local `createTheme` imports/calls (10-25 lines)
2. Remove local `renderWithTheme` function (4-8 lines)
3. Add import: `import { renderWithTheme } from '@/__tests__/utils/test-utils';`
4. Replace all `render()` calls with `renderWithTheme()`
5. Verify test behavior unchanged

**Batch approach:**
- Batch 1: 5 files (game components)
- Batch 2: 5 files (UI components)
- Batch 3: 6 files (misc components)
- Run tests after each batch

## Implementation Steps

### Step 1: Create Utilities (30-45 minutes)

1. Create directory:
   ```bash
   mkdir -p __tests__/utils
   ```

2. Create `__tests__/utils/test-theme.ts`:
   - Implement `createTestTheme()` function
   - Add complete JSDoc with examples
   - Include all accent colors (gold, silver, bronze)
   - Support light/dark modes
   - Support theme overrides

3. Create `__tests__/utils/test-utils.tsx`:
   - Implement `renderWithTheme()` function
   - Use `createTestTheme()` internally
   - Add complete JSDoc with examples
   - Fully typed interface and options

4. Verify TypeScript compilation:
   ```bash
   npx tsc --noEmit
   ```

### Step 2: Proof of Concept (15-20 minutes)

1. Pick 2-3 diverse test files with different patterns:
   - One with full accent colors (e.g., `game-boost-selector.test.tsx`)
   - One with basic theme only (e.g., `urgency-game-card.test.tsx`)
   - One with custom theme extensions/primary colors (e.g., `header/theme-switcher.test.tsx`)

2. Update each file:
   - Remove local theme setup
   - Add import of `renderWithTheme`
   - Update all render calls

3. Run specific tests:
   ```bash
   npm test -- game-boost-selector.test.tsx
   npm test -- urgency-game-card.test.tsx
   ```

4. Verify:
   - All tests pass
   - No behavior changes
   - No coverage decrease

5. Document migration patterns identified:
   - Pattern A: Files with `const testTheme = createTheme({ palette: {...} })`
   - Pattern B: Files with `const theme = createTheme()` (minimal)
   - Pattern C: Files with custom mockTheme variables or nested definitions
   - How to handle each pattern with the new utility

### Step 3: Batch Migration (90-120 minutes)

**Batch 1: Game components (5 files, 30-40 min)**
- `game-boost-selector.test.tsx`
- `game-prediction-edit-controls.test.tsx`
- `game-countdown-display.test.tsx`
- `game-card-point-overlay.test.tsx`
- `game-result-edit-dialog.test.tsx`

Run tests: `npm test -- game-*.test.tsx`

**Batch 2: UI components (5 files, 30-40 min)**
- `header/theme-switcher.test.tsx`
- `header/header.test.tsx`
- `prediction-status-bar.test.tsx`
- `point-breakdown-tooltip.test.tsx`
- `compact-game-view-card.test.tsx`

Run tests: `npm test -- header/ prediction-status-bar point-breakdown compact-game`

**Batch 3: Remaining components (6 files, 30-40 min)**
- `urgency-game-card.test.tsx`
- `urgency-accordion.test.tsx`
- `tabbed-playoff-page.test.tsx`
- `tournament-page/friend-groups-list.test.tsx`
- `friend-groups/notification-dialog.test.tsx`
- `friend-groups/friend-groups-themer.test.tsx`

Run tests: `npm test -- urgency tabbed friend-groups`

### Step 4: Verification (20-30 minutes)

1. Run full test suite:
   ```bash
   npm test
   ```

2. Check coverage:
   ```bash
   npm test -- --coverage
   ```
   - Verify ≥80% coverage on new code
   - No decrease in overall coverage

3. Search for remaining duplication:
   ```bash
   grep -r "const testTheme = createTheme" __tests__/components
   grep -r "const renderWithTheme =" __tests__/components
   ```
   - Should return zero results

4. TypeScript compilation:
   ```bash
   npx tsc --noEmit
   ```
   - Zero errors

5. Verify JSDoc:
   - Test utilities are easily discoverable
   - Examples are clear
   - Parameters documented

## Testing Strategy

### Unit Testing

The new utilities don't require dedicated unit tests because:
1. They're thin wrappers around existing libraries
2. Validation happens through existing component tests
3. If any test fails, the utilities are working incorrectly

### Integration Testing

Validation through existing test suite:
- All 16+ component tests serve as integration tests
- If tests pass with same behavior, utilities work correctly

### Regression Prevention

- Run tests after each batch (3-4 files)
- Any failure = fix before continuing
- Compare coverage before/after
- Verify no test behavior changes

## Validation & Quality Gates

### Pre-Implementation
- [x] Plan reviewed and approved
- [ ] TypeScript types understood
- [ ] File locations identified

### During Implementation
- [ ] Each batch: tests pass
- [ ] No TypeScript errors
- [ ] No new lint errors
- [ ] Coverage doesn't decrease

### Pre-Commit
- [ ] All 16+ files updated
- [ ] Full test suite passes
- [ ] Coverage ≥80% on new code
- [ ] Zero theme duplication remains
- [ ] TypeScript compiles
- [ ] Lint passes

### SonarCloud Requirements
- **Coverage:** ≥80% on new utilities (coverage provided by 16+ component tests using the utilities)
- **Duplicated Code:** 0% (this story eliminates ~300-400 lines of duplication)
- **Code Smells:** 0 new issues
- **Type Safety:** No `any` types in utilities (using `ThemeOptions` type from MUI)
- **Note:** New utility files are thin wrappers - their coverage comes from integration tests (component tests), not unit tests

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Tests fail after migration | HIGH | Update in batches, run tests after each batch |
| Theme behavior changes | MEDIUM | Preserve exact color values, verify visually unchanged |
| TypeScript errors | LOW | Fully type utilities, compile after creation |
| Missing edge cases | LOW | Support theme overrides for unusual cases |
| Coverage decrease | LOW | Utilities covered by existing tests |

## Open Questions

None - Requirements are clear from story and epic analysis.

## Success Metrics

**Immediate (Post-Story):**
- ✅ 300-400 lines of code eliminated
- ✅ 16+ files updated
- ✅ 2 new utility files created
- ✅ 100% of tests passing
- ✅ Coverage maintained ≥80%
- ✅ Zero theme duplication

**Long-term (Future):**
- All new component tests use `renderWithTheme()`
- Faster test creation (copy 1 line vs 15-28 lines)
- Easier theme maintenance (1 file vs 16+ files)

## Dependencies

**Depends on:** None (can start immediately)

**Blocks:** Story #76 (Context Provider Utilities) - extends same `test-utils.tsx` file

**Related:** Story #74 (Next.js Mock Utilities) - can work in parallel

## Files to Create

1. `__tests__/utils/test-theme.ts` - Theme factory function
2. `__tests__/utils/test-utils.tsx` - Render helper with theme wrapper

## Files to Modify

### Test Files (16+)
All files that currently have local theme setup:
- `__tests__/components/game-boost-selector.test.tsx`
- `__tests__/components/header/theme-switcher.test.tsx`
- `__tests__/components/urgency-game-card.test.tsx`
- (Plus 13+ more identified during migration)

### No Application Code Changes
This is a test-only refactoring. No application code is modified.

## Rollback Plan

If issues arise:
1. New utilities are additive (don't break anything by existing)
2. Can revert individual file migrations via git
3. Can pause migration and continue later
4. Original patterns preserved in git history

## Notes

- This is the highest priority story in the epic (user-reported pain point)
- Epic analysis documents in `/tmp/` provide additional examples
- Similar pattern to existing `__tests__/db/mock-helpers.ts` (good reference)
- Story #76 will extend `test-utils.tsx` for context providers
