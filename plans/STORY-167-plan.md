# Implementation Plan: Lift Boost Counts to GuessesContext

## Story Context

**Issue:** #167 - Lift Boost Counts to GuessesContext to Fix Infinite Boosts & Eliminate 48 DB Queries

**Problem:**
1. **Infinite Boosts Bug (#166):** Users can apply boosts beyond configured limits because boost counts are not synchronized across the app. Dashboard counts are fetched server-side on page load and never refreshed. Game card counts are fetched independently by each card on mount and cached locally. When a user changes a boost on Game A, the dashboard and other game cards still show stale counts.

2. **Performance Issue:** Each game card makes an independent server action call + database query on mount. For 48 games, this results in 48 server round-trips + 48 database queries, adding ~2.4s latency on page load.

**Solution:**
Lift boost counts to GuessesContext and calculate them from existing game guesses in memory. This provides a single source of truth, eliminates redundant queries, and ensures instant synchronization across all components.

**Expected Impact:**
- Fix infinite boosts bug
- Eliminate 48 DB queries per page load
- Improve page load time by ~2.4s
- Boost count updates become instant (<1ms vs 50-100ms)

## Acceptance Criteria

### Functional
- ✅ When user changes boost on any game, counts update immediately on:
  - Dashboard
  - Current game card
  - All other game cards
- ✅ Cannot exceed boost limits (client-side validation enforced by context)
- ✅ Boost counts match reality across all UI elements
- ✅ Existing boost functionality still works (add/remove/switch types)

### Performance
- ✅ Zero additional DB queries for boost counts (down from 48)
- ✅ Zero additional server action calls for boost counts (down from 48)
- ✅ Page loads at least 2 seconds faster
- ✅ Boost count updates are instant (no network latency)

### Code Quality
- ✅ All tests pass
- ✅ SonarCloud: 0 new issues, ≥80% coverage on new code
- ✅ Clean up unused code if safe (check usage first)

## Technical Approach

### 1. Extend GuessesContext Interface

**File:** `app/components/context-providers/guesses-context-provider.tsx`

Add boost counts to the context value:

```typescript
interface BoostCounts {
  silver: { used: number; max: number };
  golden: { used: number; max: number };
}

interface GuessesContextValue {
  gameGuesses: GameGuessMap;
  boostCounts: BoostCounts;  // NEW
  updateGameGuess: (gameId: string, gameGuess: GameGuessNew) => Promise<void>;
}
```

### 2. Add Tournament Max Values to Provider Props

**File:** `app/components/context-providers/guesses-context-provider.tsx`

```typescript
export interface GuessesContextProviderProps {
  readonly children: React.ReactNode;
  readonly gameGuesses: {[k:string]: GameGuessNew};
  readonly autoSave?: boolean;
  readonly tournamentMaxSilver?: number;  // NEW
  readonly tournamentMaxGolden?: number;  // NEW
}
```

### 3. Calculate Boost Counts from Game Guesses

**File:** `app/components/context-providers/guesses-context-provider.tsx`

Use `useMemo` to efficiently calculate counts:

```typescript
const boostCounts = useMemo(() => {
  const guesses = Object.values(gameGuesses);
  const silverUsed = guesses.filter(g => g.boost_type === 'silver').length;
  const goldenUsed = guesses.filter(g => g.boost_type === 'golden').length;

  return {
    silver: { used: silverUsed, max: tournamentMaxSilver || 0 },
    golden: { used: goldenUsed, max: tournamentMaxGolden || 0 }
  };
}, [gameGuesses, tournamentMaxSilver, tournamentMaxGolden]);
```

**Why useMemo:** Boost count calculation is O(n) where n = number of games. Using `useMemo` ensures it only recalculates when `gameGuesses` changes (which happens on every prediction update), not on every render.

### 4. Update Context Value

**File:** `app/components/context-providers/guesses-context-provider.tsx`

Include `boostCounts` in the context:

```typescript
const context = useMemo(() => ({
  gameGuesses,
  boostCounts,  // NEW
  updateGameGuess
}), [gameGuesses, boostCounts, updateGameGuess]);
```

### 5. Pass Tournament Max Values from Parent

**File:** `app/components/unified-games-page.tsx`

Update the provider instantiation:

```typescript
<GuessesContextProvider
  gameGuesses={gameGuesses}
  autoSave={true}
  tournamentMaxSilver={tournament.max_silver_games || 0}  // NEW
  tournamentMaxGolden={tournament.max_golden_games || 0}  // NEW
>
```

**Verify All GuessesContextProvider Usage:**

Based on grep results, GuessesContextProvider is used in:

1. **`app/components/unified-games-page.tsx`** (main usage)
   - ✅ Has tournament data available
   - ✅ Pass max values as shown above

2. **`app/components/onboarding/*`** (demo/onboarding flows)
   - Uses `MockGuessesContextProvider` (different component)
   - ✅ No changes needed (demo has its own hardcoded data)

3. **Test files** (`__tests__/**/*.test.tsx`)
   - ✅ Tests will provide mock values or use renderWithProviders
   - ✅ Test suite will verify behavior with/without max values

**Default Behavior:**
- If `tournamentMaxSilver` or `tournamentMaxGolden` are not provided (undefined)
- Context defaults to `0` via `tournamentMaxSilver || 0`
- This is safe: boosts disabled if max not specified
- Prevents accidental infinite boosts

**Edge Case Handling:**
- If tournament is null/undefined: Page shows error before reaching context
- If max values are explicitly `null`: Coerced to `0` (disabled)
- If max values are `0`: Boosts disabled (expected behavior)

### 6. Remove Individual Fetch in GameBoostSelector

**File:** `app/components/game-boost-selector.tsx`

**Remove:**
- Lines 66-76: `useEffect` that fetches boost counts
- Line 50: Local state `boostCounts`

**Add:**
```typescript
import { GuessesContext } from './context-providers/guesses-context-provider';

const { boostCounts } = useContext(GuessesContext);
```

**Update:**
- Lines 117-131: Remove local count update logic (context handles this automatically)
- Keep validation logic (lines 92-102) but use context counts

### 7. Update Dashboard to Use Context

**File:** `app/components/compact-prediction-dashboard.tsx`

**Current:** Receives `silverUsed`, `goldenUsed`, `silverMax`, `goldenMax` as props

**Change:** Read from context instead:

```typescript
const { boostCounts } = useContext(GuessesContext);

const silverUsed = boostCounts.silver.used;
const silverMax = boostCounts.silver.max;
const goldenUsed = boostCounts.golden.used;
const goldenMax = boostCounts.golden.max;
```

**Remove from props:** Remove boost-related props from interface (lines 21-24)

**Update parent:** Remove prop passing in `unified-games-page-client.tsx` (lines 138-141)

### 8. Update GamesListWithScroll

**File:** `app/components/games-list-with-scroll.tsx`

**Current:** Receives `dashboardStats` prop, passes to FlippableGameCard (lines 229-232)

**Change:** Remove boost prop passing:

```typescript
// Remove these props from FlippableGameCard:
// silverUsed={dashboardStats?.silverUsed || 0}
// silverMax={tournament?.max_silver_games || 0}
// goldenUsed={dashboardStats?.goldenUsed || 0}
// goldenMax={tournament?.max_golden_games || 0}
```

FlippableGameCard will read from context instead.

### 9. Update FlippableGameCard

**File:** `app/components/flippable-game-card.tsx`

**Remove from props:**
- Lines 36-40: Boost count props

**Add context usage:**
```typescript
const { boostCounts } = useContext(GuessesContext);
```

**Update GamePredictionEditControls:**
```typescript
<GamePredictionEditControls
  // ... other props
  silverUsed={boostCounts.silver.used}
  silverMax={boostCounts.silver.max}
  goldenUsed={boostCounts.golden.used}
  goldenMax={boostCounts.golden.max}
  // ... other props
/>
```

### 10. Update BoostCountsSummary Component

**File:** `app/components/boost-counts-summary.tsx`

**Status:** Component exists but appears **UNUSED** (no imports found in grep search)

**Current implementation:**
- Fetches boost counts independently using `getBoostCountsAction` (line 22)
- Shows available boosts in a Paper component
- Another source of redundant DB queries if used

**Decision:**
- **Verify usage:** Check if component is imported anywhere
- **If unused:** Remove the component entirely (safe cleanup)
- **If used:** Update to use context instead of fetching:

```typescript
import { useContext } from 'react';
import { GuessesContext } from './context-providers/guesses-context-provider';

export default function BoostCountsSummary() {
  const { boostCounts } = useContext(GuessesContext);

  // Remove useEffect fetch (lines 19-29)
  // Remove local state (lines 14-17)
  // Use context counts directly
}
```

### 11. Check for Unused Code (Safe Cleanup)

**Before removing, verify no other usage:**

1. **Check `getBoostCountsAction` usage:**
   ```bash
   grep -r "getBoostCountsAction" --include="*.ts" --include="*.tsx"
   ```

   **Known consumers:**
   - `GameBoostSelector` (line 23) - will be removed
   - `BoostCountsSummary` (line 6) - component appears unused, verify and remove

   **If no other usage found,** safe to remove from:
   - `app/actions/game-boost-actions.ts` (lines 65-87)

2. **Check `countUserBoostsByType` usage:**
   ```bash
   grep -r "countUserBoostsByType" --include="*.ts" --include="*.tsx"
   ```

   **Important:** Used by `setGameBoostAction` for server-side validation (line 46). **DO NOT REMOVE.**

   Server-side validation is critical as a safety net. Client can be manipulated, so server must re-validate on every boost change.

**Cleanup decision:**
- ✅ Remove `BoostCountsSummary` if unused (verify first)
- ✅ Remove `getBoostCountsAction` after removing all consumers
- ❌ Keep `countUserBoostsByType` (needed for server validation)

### 12. Remove dashboardStats Prop from UnifiedGamesPageClient

**File:** `app/components/unified-games-page-client.tsx`

**Remove:**
- Lines 26-29: `dashboardStats` from props interface
- Lines 43, 81, 207: Remove `dashboardStats` prop passing

**File:** `app/components/unified-games-page.tsx`

**Remove:**
- Line 35: Remove `dashboardStats` from parallel fetch
- Line 46: Remove `getPredictionDashboardStats` call
- Line 81: Remove `dashboardStats` prop passing

**Note:** `getPredictionDashboardStats` might be used elsewhere. Verify usage before removing from repository.

## Files to Modify

### Core Changes (Required)
1. ✅ `app/components/context-providers/guesses-context-provider.tsx` - Add boost counts calculation
2. ✅ `app/components/unified-games-page.tsx` - Pass tournament max values to provider
3. ✅ `app/components/game-boost-selector.tsx` - Remove local fetching, use context
4. ✅ `app/components/compact-prediction-dashboard.tsx` - Use context for boost counts
5. ✅ `app/components/unified-games-page-client.tsx` - Remove dashboardStats prop
6. ✅ `app/components/games-list-with-scroll.tsx` - Remove boost prop passing
7. ✅ `app/components/flippable-game-card.tsx` - Use context for boost counts

### Conditional Cleanup (Check Usage First)
8. ⚠️ `app/components/boost-counts-summary.tsx` - Check usage, remove if unused, otherwise update to use context
9. ⚠️ `app/actions/game-boost-actions.ts` - Remove `getBoostCountsAction` after removing all consumers
10. ⚠️ `app/db/game-guess-repository.ts` - Keep `countUserBoostsByType` (needed for validation)

### Tests (100% coverage required)
11. ✅ `__tests__/components/guesses-context-provider.test.tsx` - Add boost count tests
12. ✅ `__tests__/components/game-boost-selector.test.tsx` - Update to use context
13. ✅ `__tests__/components/compact-prediction-dashboard.test.tsx` - Update for context usage
14. ✅ `__tests__/components/unified-games-page-client.test.tsx` - Remove dashboardStats
15. ✅ `__tests__/components/games-list-with-scroll.test.tsx` - Update props
16. ✅ `__tests__/components/flippable-game-card.test.tsx` - Update to use context
17. ⚠️ `__tests__/components/boost-counts-summary.test.tsx` - Update or remove based on component decision

## Implementation Steps

### Phase 1: Extend Context (Foundation)
1. Update `GuessesContextProvider` interface to include boost counts
2. Add `tournamentMaxSilver` and `tournamentMaxGolden` props
3. Implement `useMemo` calculation for boost counts
4. Add `boostCounts` to context value
5. Write unit tests for boost count calculation
   - Test: Silver count calculated correctly
   - Test: Golden count calculated correctly
   - Test: Counts update when game guess changes
   - Test: Handles edge cases (no boosts, all boosts, mixed)

### Phase 2: Update Provider Instantiation
1. Update `unified-games-page.tsx` to pass tournament max values
2. Verify context provides correct values to consumers

### Phase 3: Update Consumers
1. Update `GameBoostSelector`:
   - Remove `useEffect` fetch (lines 66-76)
   - Remove local `boostCounts` state
   - Add context usage
   - Remove local count update logic (lines 117-131)
   - Keep validation logic (use context counts)
   - Write tests
2. Update `CompactPredictionDashboard`:
   - Add context usage
   - Remove boost props from interface
   - Write tests
3. Update `GamesListWithScroll`:
   - Remove boost prop passing to FlippableGameCard
   - Write tests
4. Update `FlippableGameCard`:
   - Remove boost props
   - Add context usage
   - Update GamePredictionEditControls prop passing
   - Write tests
5. Update `UnifiedGamesPageClient`:
   - Remove dashboardStats prop
   - Write tests

### Phase 4: Cleanup (Verify First)
1. Check `BoostCountsSummary` usage
   - Grep for imports
   - If unused, remove component and test file
   - If used, update to use context
2. Check `getBoostCountsAction` usage
   - After removing GameBoostSelector and BoostCountsSummary consumers
   - If no other usage, remove from `game-boost-actions.ts`
3. Check `getPredictionDashboardStats` usage
   - Verify only used in unified-games-page.tsx for dashboardStats
   - Safe to remove from page after context implementation
   - Keep repository function if used elsewhere
4. Update imports in affected files

### Phase 5: Integration Testing
1. Test multi-card sync:
   - Add boost on Game A → Game B sees updated count
   - Add boost on Game A → Dashboard sees updated count
   - Remove boost on Game A → All components update instantly
2. Test boost limits:
   - Cannot add boost when at limit
   - Can switch boost types (doesn't increase count)
   - Can remove boost (decreases count)
3. Test performance:
   - Verify 0 `getBoostCountsAction` calls in Network tab
   - Verify 0 additional DB queries
   - Measure page load time improvement

## Testing Strategy

### Unit Tests

**GuessesContextProvider** (`__tests__/components/guesses-context-provider.test.tsx`)

Test boost count calculation using a consuming component (not renderHook):

```typescript
// Test consumer component
const BoostCountDisplay = () => {
  const { boostCounts } = useContext(GuessesContext);
  return (
    <div>
      <span data-testid="silver-used">{boostCounts.silver.used}</span>
      <span data-testid="silver-max">{boostCounts.silver.max}</span>
      <span data-testid="golden-used">{boostCounts.golden.used}</span>
      <span data-testid="golden-max">{boostCounts.golden.max}</span>
    </div>
  );
};

describe('boost counts', () => {
  it('calculates silver count from game guesses', () => {
    const gameGuesses = {
      'game1': { game_id: 'game1', boost_type: 'silver', game_number: 1 },
      'game2': { game_id: 'game2', boost_type: null, game_number: 2 },
    };

    render(
      <GuessesContextProvider
        gameGuesses={gameGuesses}
        tournamentMaxSilver={5}
        tournamentMaxGolden={3}
      >
        <BoostCountDisplay />
      </GuessesContextProvider>
    );

    expect(screen.getByTestId('silver-used')).toHaveTextContent('1');
    expect(screen.getByTestId('silver-max')).toHaveTextContent('5');
    expect(screen.getByTestId('golden-used')).toHaveTextContent('0');
    expect(screen.getByTestId('golden-max')).toHaveTextContent('3');
  });

  it('calculates golden count from game guesses', () => {
    const gameGuesses = {
      'game1': { game_id: 'game1', boost_type: 'golden', game_number: 1 },
      'game2': { game_id: 'game2', boost_type: 'golden', game_number: 2 },
      'game3': { game_id: 'game3', boost_type: null, game_number: 3 },
    };

    render(
      <GuessesContextProvider
        gameGuesses={gameGuesses}
        tournamentMaxSilver={5}
        tournamentMaxGolden={3}
      >
        <BoostCountDisplay />
      </GuessesContextProvider>
    );

    expect(screen.getByTestId('golden-used')).toHaveTextContent('2');
  });

  it('updates counts when game guess changes', async () => {
    // Test with real GuessesContextProvider and updateGameGuess
    // Add boost → verify count increases
    // Remove boost → verify count decreases
    // Switch boost type → verify both counts update
  });

  it('handles edge cases', () => {
    // Test: No boosts (all null)
    // Test: All boosts of one type
    // Test: Mixed boost types
    // Test: Max values = 0 (boosts disabled)
  });

  it('handles missing tournament max values', () => {
    const gameGuesses = {
      'game1': { game_id: 'game1', boost_type: 'silver', game_number: 1 },
    };

    render(
      <GuessesContextProvider gameGuesses={gameGuesses}>
        <BoostCountDisplay />
      </GuessesContextProvider>
    );

    // Should default to 0 when max not provided
    expect(screen.getByTestId('silver-max')).toHaveTextContent('0');
    expect(screen.getByTestId('golden-max')).toHaveTextContent('0');
  });
});
```

**GameBoostSelector** (`__tests__/components/game-boost-selector.test.tsx`)

Use real context (renderWithProviders) instead of mocking:

```typescript
it('reads boost counts from context', () => {
  const gameGuesses = {
    'game1': { game_id: 'game1', boost_type: 'silver', game_number: 1 },
    'game2': { game_id: 'game2', boost_type: 'silver', game_number: 2 },
  };

  renderWithProviders(
    <GameBoostSelector
      gameId="game3"
      gameDate={new Date(Date.now() + 100000)}
      currentBoostType={null}
      tournamentId="tournament-1"
    />,
    {
      guessesContext: {
        gameGuesses,
        boostCounts: {
          silver: { used: 2, max: 5 },
          golden: { used: 0, max: 3 }
        }
      }
    }
  );

  // Verify boost count badges show correct values
  expect(screen.getByText('2/5')).toBeInTheDocument();
});

it('validates against context counts when at limit', async () => {
  const user = userEvent.setup();
  const gameGuesses = {
    'game1': { game_id: 'game1', boost_type: 'silver', game_number: 1 },
    'game2': { game_id: 'game2', boost_type: 'silver', game_number: 2 },
    'game3': { game_id: 'game3', boost_type: 'silver', game_number: 3 },
    'game4': { game_id: 'game4', boost_type: 'silver', game_number: 4 },
    'game5': { game_id: 'game5', boost_type: 'silver', game_number: 5 },
  };

  renderWithProviders(
    <GameBoostSelector
      gameId="game6"
      gameDate={new Date(Date.now() + 100000)}
      currentBoostType={null}
      tournamentId="tournament-1"
    />,
    {
      guessesContext: {
        gameGuesses,
        boostCounts: {
          silver: { used: 5, max: 5 },  // At limit
          golden: { used: 0, max: 3 }
        }
      }
    }
  );

  // Click silver boost button
  const silverButton = screen.getByLabelText(/Multiplicador de Plata/i);
  await user.click(silverButton);

  // Should show error dialog
  expect(screen.getByText(/Límite de Multiplicadores Alcanzado/i)).toBeInTheDocument();
  expect(screen.getByText(/Has usado todos tus 5 multiplicadores de plata/i)).toBeInTheDocument();
});

it('allows switching boost types even at limit', async () => {
  // Test that switching from silver to golden works even when golden is at limit
  // Because switching doesn't increase count, just changes type
});
```

**CompactPredictionDashboard** (`__tests__/components/compact-prediction-dashboard.test.tsx`)

```typescript
it('displays boost counts from context', () => {
  const gameGuesses = {
    'game1': { game_id: 'game1', boost_type: 'silver', game_number: 1 },
    'game2': { game_id: 'game2', boost_type: 'silver', game_number: 2 },
    'game3': { game_id: 'game3', boost_type: 'golden', game_number: 3 },
  };

  renderWithProviders(
    <CompactPredictionDashboard
      totalGames={10}
      predictedGames={5}
    />,
    {
      guessesContext: {
        gameGuesses,
        boostCounts: {
          silver: { used: 2, max: 5 },
          golden: { used: 1, max: 3 }
        }
      }
    }
  );

  // Verify dashboard displays correct counts
  // Check PredictionProgressRow receives correct boost props
});

it('updates when context changes', () => {
  // Render with initial context
  // Update context value
  // Verify dashboard reflects new counts
});
```

### Integration Tests

**Multi-Card Synchronization** (Add to existing tests or create new integration test file)

```typescript
describe('Boost Count Synchronization', () => {
  it('synchronizes boost counts across GameBoostSelector, FlippableGameCard, and CompactPredictionDashboard', async () => {
    const user = userEvent.setup();

    // Initial game guesses with one boost
    const initialGameGuesses = {
      'game1': { game_id: 'game1', boost_type: 'silver', game_number: 1 },
      'game2': { game_id: 'game2', boost_type: null, game_number: 2 },
      'game3': { game_id: 'game3', boost_type: null, game_number: 3 },
    };

    // Render multiple components that consume boost counts
    const { container } = render(
      <GuessesContextProvider
        gameGuesses={initialGameGuesses}
        tournamentMaxSilver={5}
        tournamentMaxGolden={3}
        autoSave={false}
      >
        <div data-testid="dashboard">
          <CompactPredictionDashboard totalGames={3} predictedGames={3} />
        </div>
        <div data-testid="game2-selector">
          <GameBoostSelector
            gameId="game2"
            gameDate={new Date(Date.now() + 100000)}
            currentBoostType={null}
            tournamentId="tournament-1"
          />
        </div>
        <div data-testid="game3-selector">
          <GameBoostSelector
            gameId="game3"
            gameDate={new Date(Date.now() + 100000)}
            currentBoostType={null}
            tournamentId="tournament-1"
          />
        </div>
      </GuessesContextProvider>
    );

    // Initial state: 1 silver boost used
    expect(screen.getAllByText('1/5')).toHaveLength(2); // Both selectors show 1/5

    // Add silver boost to game2
    const game2SilverButton = within(screen.getByTestId('game2-selector'))
      .getByLabelText(/Multiplicador de Plata/i);
    await user.click(game2SilverButton);

    // All components should immediately show 2/5
    await waitFor(() => {
      expect(screen.getAllByText('2/5')).toHaveLength(2); // Both selectors updated
    });

    // Dashboard should also reflect the update
    // (Verify through PredictionProgressRow props or visual element)
  });

  it('prevents exceeding boost limits across all components', async () => {
    // Test that limit validation works when approaching from multiple components
  });
});

### Performance Regression Tests

**Prevent Context Re-render Issues** (Add to guesses-context-provider.test.tsx)

```typescript
describe('performance', () => {
  it('only recalculates boost counts when gameGuesses change', () => {
    const gameGuesses = {
      'game1': { game_id: 'game1', boost_type: 'silver', game_number: 1 },
    };

    const spy = vi.spyOn(Object, 'values'); // Spy on Object.values used in calculation

    const { rerender } = render(
      <GuessesContextProvider
        gameGuesses={gameGuesses}
        tournamentMaxSilver={5}
        tournamentMaxGolden={3}
      >
        <BoostCountDisplay />
      </GuessesContextProvider>
    );

    const initialCallCount = spy.mock.calls.length;

    // Rerender with same gameGuesses object (should not recalculate)
    rerender(
      <GuessesContextProvider
        gameGuesses={gameGuesses}
        tournamentMaxSilver={5}
        tournamentMaxGolden={3}
      >
        <BoostCountDisplay />
      </GuessesContextProvider>
    );

    // Verify calculation didn't run again
    expect(spy.mock.calls.length).toBe(initialCallCount);

    spy.mockRestore();
  });

  it('recalculates when gameGuesses object changes', () => {
    // Test that useMemo correctly detects changes
  });
});
```

### Manual Testing Checklist

**Page Load Performance:**
- [ ] Open DevTools Network tab
- [ ] Load tournament page
- [ ] Verify 0 calls to `getBoostCountsAction`
- [ ] Verify page loads ~2s faster

**Boost Synchronization:**
- [ ] Add silver boost to Game 1
- [ ] Verify dashboard count updates immediately
- [ ] Verify all other cards show updated count
- [ ] Add boosts until limit
- [ ] Verify cannot add more (validation works)
- [ ] Switch boost type on Game 1
- [ ] Verify old type count decreases, new type increases

**Edge Cases:**
- [ ] Tournament with no boosts (max = 0) - component hidden
- [ ] Tournament with only silver boosts
- [ ] Tournament with only golden boosts
- [ ] Switch boost type when at limit of new type (should fail)

## Validation Considerations

### SonarCloud Requirements
- **Coverage:** ≥80% on new code (all new functions and branches)
- **Issues:** 0 new issues of any severity
- **Focus areas:**
  - Proper React hooks usage (useMemo dependencies)
  - No cognitive complexity violations
  - Proper TypeScript types (no `any`)

### Performance Validation
- **Before:** 48 server calls + 48 DB queries on page load
- **After:** 0 additional calls/queries
- **Measurement:** Chrome DevTools Network tab
- **Expected:** Page load time improvement of ~2.4s

### Regression Prevention
- Server-side validation MUST remain (`setGameBoostAction`)
- Client-side validation is UX optimization only
- Double-check all boost functionality still works
- Verify no edge cases broken (playoffs, groups, etc.)

## Open Questions

None - approach is straightforward and well-defined in the story.

## Potential Risks

### Risk 1: Context Re-renders
**Issue:** Boost count calculation runs on every context update (frequent on prediction page)

**Mitigation:**
- Using `useMemo` with correct dependencies
- Calculation is O(n) where n = games, acceptable for <100 games
- Only recalculates when `gameGuesses` changes (expected)

### Risk 2: Breaking Other Usages
**Issue:** Removing `getBoostCountsAction` might break other consumers

**Mitigation:**
- Grep for all usages before removing
- Check test files for mocks
- Only remove if 100% certain it's unused

### Risk 3: Server-Client Count Mismatch
**Issue:** Client calculates different count than server validation

**Mitigation:**
- Both use same logic (count boost_type fields)
- Server validation is source of truth
- Client validation is UX optimization only
- Any mismatch caught by server and reported to user

## Success Metrics

### Functional
- ✅ Boost counts synchronized across all components
- ✅ Cannot exceed boost limits
- ✅ All existing boost functionality works

### Performance
- ✅ 0 `getBoostCountsAction` calls on page load
- ✅ Page loads ≥2s faster
- ✅ Boost updates instant (<1ms)

### Quality
- ✅ 0 new SonarCloud issues
- ✅ ≥80% test coverage on new code
- ✅ All tests pass
