# Implementation Plan: Story #252

## Story Context

**Title:** [Mobile UX] Replace score text input with stepper buttons to avoid keyboard popup

**Problem:**
On mobile devices, score input currently uses `TextField` with `type="number"`, which triggers the mobile keyboard. This:
- Takes 40-60% of screen real estate
- Obscures the beautiful card flip animation
- Clutters the visual experience during prediction editing

**Objective:**
Replace TextField inputs with stepper buttons (increment/decrement pattern) on mobile devices only, keeping TextField on desktop where keyboard input is appropriate.

## Acceptance Criteria

- [ ] Mobile devices (< `sm` breakpoint) show stepper buttons instead of TextField
- [ ] Desktop devices keep existing TextField behavior
- [ ] Touch targets are 44px × 44px (WCAG 2.1 Level AA compliant)
- [ ] No mobile keyboard triggered during score input
- [ ] Card flip animation remains visible during editing
- [ ] Empty state handled: first "+" tap sets to 1 (not undefined + 1)
- [ ] Decrement disabled when score is empty or 0
- [ ] Score display shows current value between buttons
- [ ] Min value: 0, Max value: 99
- [ ] Both horizontal and vertical layouts supported
- [ ] Accessibility: buttons have proper aria-labels
- [ ] Press and hold for rapid increment/decrement (nice-to-have)

## Visual Prototypes

### Mobile Layout: Large Stepper Buttons (44px)

```
┌─────────────────────────────────────────────┐
│              Score Input                    │
├─────────────────────────────────────────────┤
│                                             │
│  Argentina    [ - ]    3    [ + ]          │
│                                             │
│  Brazil       [ - ]    1    [ + ]          │
│                                             │
└─────────────────────────────────────────────┘
```

**Detailed Design:**

**Component Structure:**
- Horizontal layout: Team name (left) + Stepper controls (right)
- Stepper controls: [ Decrement Button ] [ Score Display ] [ Increment Button ]

**Button Specifications:**
- **Size:** 44px × 44px (WCAG 2.1 Level AA minimum touch target)
- **Component:** MUI `IconButton` or `Button`
- **Icons:** `RemoveIcon` (-) and `AddIcon` (+) from `@mui/icons-material`
- **Spacing:** 8px gap between buttons and score display
- **Border radius:** 4px (consistent with MUI defaults)

**Score Display:**
- **Typography:** `body1` variant
- **Font weight:** medium (500)
- **Min width:** 32px (for double-digit numbers)
- **Text align:** center
- **Color:** `text.primary`
- **Empty state:** Show "—" (em dash) or "" (empty string)

**Button States:**
1. **Default:**
   - Background: transparent
   - Border: 1px solid `divider` color
   - Icon color: `text.primary`
   - Hover: background `action.hover`

2. **Disabled (decrement when score is 0 or undefined):**
   - Opacity: 0.38
   - Not clickable
   - Icon color: `text.disabled`

3. **Active (pressed):**
   - Background: `action.selected`
   - Icon color: `primary.main`

4. **Focus:**
   - Outline: 2px solid `primary.main`
   - Outline offset: 2px

**Layout Spacing:**
```
[Team Name]    [ - ]  8px  [Score]  8px  [ + ]
   (flex)       44px        32px          44px
```

**Responsive Breakpoint:**
- Mobile: `theme.breakpoints.down('sm')` (< 600px)
- Desktop: `theme.breakpoints.up('sm')` (≥ 600px)

### Desktop Layout: Keep TextField (Unchanged)

Desktop users continue to see the existing TextField implementation:
```
┌─────────────────────────────────────────────┐
│  Argentina    [ 3 ]                        │
│  Brazil       [ 1 ]                        │
└─────────────────────────────────────────────┘
```

### State Variations

**1. Empty State (Initial):**
```
Argentina    [ - ]    —    [ + ]
             (disabled)  (empty)  (enabled)
```
- Decrement button: disabled
- Score display: "—" or blank
- Increment button: enabled
- First tap of "+": sets score to 1 (not undefined + 1)

**2. Zero State:**
```
Argentina    [ - ]    0    [ + ]
             (disabled)     (enabled)
```
- Decrement button: disabled (can't go below 0)
- Score display: "0"
- Increment button: enabled

**3. Normal State (score > 0):**
```
Argentina    [ - ]    3    [ + ]
             (enabled)      (enabled)
```
- Both buttons enabled
- Decrement: decreases by 1 (min 0)
- Increment: increases by 1 (max 99)

**4. Maximum State (score = 99):**
```
Argentina    [ - ]    99   [ + ]
             (enabled)      (disabled)
```
- Decrement button: enabled
- Increment button: disabled (at max)

**5. Loading State:**
```
Argentina    [ - ]    3    [ + ]
             (all disabled, opacity 0.5)
```
- All buttons disabled during save operation
- Preserve existing loading behavior

## Technical Approach

### 1. Conditional Rendering Based on Device Type

**Location:** `app/components/game-prediction-edit-controls.tsx` (lines 487-698)
**Function:** `renderScoreInputs()`

**Strategy:**
Use the existing `isMobile` detection (already implemented at line 130):
```typescript
const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
```

Modify `renderScoreInputs()` to return different UI based on `isMobile`:
- `isMobile === true` → Render stepper buttons
- `isMobile === false` → Keep existing TextField (no changes)

### 2. Create Reusable Stepper Input Component

**New Component:** `app/components/stepper-score-input.tsx`

**Purpose:**
Encapsulate stepper logic for reusability and testability. This component will handle:
- Increment/decrement logic
- Empty vs zero state differentiation
- Min/max bounds (0-99)
- Accessibility (aria-labels, keyboard navigation)
- Optional: Press-and-hold rapid input

**Props Interface:**
```typescript
interface StepperScoreInputProps {
  value?: number;                              // Score value (undefined = empty)
  onChange: (value?: number) => void;         // Callback when value changes
  teamName: string;                           // For aria-label
  disabled?: boolean;                         // Loading state
  inputRef?: React.RefObject<HTMLDivElement>; // For keyboard navigation
  onKeyDown?: (e: React.KeyboardEvent) => void; // Keyboard event handler
  onFocus?: () => void;                       // Focus event handler
  compact?: boolean;                          // Compact mode (smaller buttons)
}
```

**Component Structure:**
```tsx
export default function StepperScoreInput({
  value,
  onChange,
  teamName,
  disabled = false,
  inputRef,
  onKeyDown,
  onFocus,
  compact = false
}: StepperScoreInputProps) {
  const decrementButtonRef = useRef<HTMLButtonElement>(null);

  // Expose focus() method through parent's ref (for keyboard navigation)
  useImperativeHandle(inputRef, () => ({
    focus: () => {
      // Focus the decrement button (first interactive element)
      decrementButtonRef.current?.focus();
    }
  }));

  // Handle increment
  const handleIncrement = () => {
    if (disabled) return;
    if (value === undefined) {
      onChange(1); // First tap sets to 1
    } else if (value < 99) {
      onChange(value + 1);
    }
  };

  // Handle decrement
  const handleDecrement = () => {
    if (disabled || value === undefined) return;
    if (value > 0) {
      onChange(value - 1);
    } else {
      onChange(0); // Stay at 0, don't go to undefined
    }
  };

  const isDecrementDisabled = disabled || value === undefined || value === 0;
  const isIncrementDisabled = disabled || value === 99;

  return (
    <Box
      sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
    >
      <IconButton
        ref={decrementButtonRef}
        onClick={handleDecrement}
        disabled={isDecrementDisabled}
        size={compact ? 'small' : 'medium'}
        aria-label={`Decrease ${teamName} score`}
        sx={{
          width: compact ? 36 : 44,
          height: compact ? 36 : 44,
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <RemoveIcon fontSize={compact ? 'small' : 'medium'} />
      </IconButton>

      <Typography
        variant={compact ? 'body2' : 'body1'}
        fontWeight="medium"
        sx={{ minWidth: 32, textAlign: 'center' }}
      >
        {value ?? '—'}
      </Typography>

      <IconButton
        onClick={handleIncrement}
        disabled={isIncrementDisabled}
        size={compact ? 'small' : 'medium'}
        aria-label={`Increase ${teamName} score`}
        sx={{
          width: compact ? 36 : 44,
          height: compact ? 36 : 44,
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <AddIcon fontSize={compact ? 'small' : 'medium'} />
      </IconButton>
    </Box>
  );
}
```

### 3. Integration into `renderScoreInputs()`

**Modifications:**

**Horizontal Layout (lines 488-638):**
```tsx
// Before: TextField for home/away scores (lines 499-516, 528-545)
// After: Conditional rendering

if (isMobile) {
  // Mobile: Stepper buttons
  return (
    <Box>
      {/* Home team row */}
      <Grid container spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <Grid size={5}>
          <Typography variant={compact ? 'body2' : 'body1'} fontWeight="medium">
            {homeTeamName}
          </Typography>
        </Grid>
        <Grid size={7}>
          <StepperScoreInput
            value={homeScore}
            onChange={onHomeScoreChange}
            teamName={homeTeamName}
            disabled={loading}
            inputRef={homeScoreInputRef}
            onKeyDown={(e) => handleKeyDown(e, 'home')}
            onFocus={() => setCurrentField('home')}
            compact={compact}
          />
        </Grid>
      </Grid>

      {/* Away team row */}
      <Grid container spacing={1} alignItems="center">
        <Grid size={5}>
          <Typography variant={compact ? 'body2' : 'body1'} fontWeight="medium">
            {awayTeamName}
          </Typography>
        </Grid>
        <Grid size={7}>
          <StepperScoreInput
            value={awayScore}
            onChange={onAwayScoreChange}
            teamName={awayTeamName}
            disabled={loading}
            inputRef={awayScoreInputRef}
            onKeyDown={(e) => handleKeyDown(e, 'away')}
            onFocus={() => setCurrentField('away')}
            compact={compact}
          />
        </Grid>
      </Grid>

      {/* Penalty shootout (unchanged) */}
      {compact && isPenaltyShootout && (
        // ... existing penalty UI (lines 550-636)
      )}
    </Box>
  );
} else {
  // Desktop: Keep existing TextField implementation (lines 488-638)
  return (
    // ... existing code (no changes)
  );
}
```

**Vertical Layout (lines 641-698):**

Similar conditional rendering, but Grid sizes are different:

**Current vertical layout:**
- Team name: `Grid size={8}` (66.7%)
- Score input: `Grid size={4}` (33.3%)

**Mobile stepper vertical layout:**
Keep the same Grid sizes (8/4) because:
- Vertical layout has more horizontal space (team name and input stack vertically)
- Stepper (3 elements) fits comfortably in 33.3% width
- No need to adjust like horizontal layout

```tsx
// Vertical layout mobile stepper
if (isMobile) {
  return (
    <Grid container spacing={2} alignItems="center">
      <Grid size={8}>
        <Typography variant={compact ? 'body2' : 'body1'} fontWeight="medium">
          {homeTeamName}
        </Typography>
      </Grid>
      <Grid size={4}>
        <StepperScoreInput
          value={homeScore}
          onChange={handleHomeScoreChangeInternal}
          teamName={homeTeamName}
          disabled={loading}
          inputRef={homeScoreInputRef}
          onKeyDown={(e) => handleKeyDown(e, 'home')}
          onFocus={() => setCurrentField('home')}
          compact={compact}
        />
      </Grid>
      {/* vs separator */}
      <Grid size={12} sx={{ textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">vs</Typography>
      </Grid>
      {/* Away team */}
      <Grid size={8}>
        <Typography variant={compact ? 'body2' : 'body1'} fontWeight="medium">
          {awayTeamName}
        </Typography>
      </Grid>
      <Grid size={4}>
        <StepperScoreInput
          value={awayScore}
          onChange={handleAwayScoreChangeInternal}
          teamName={awayTeamName}
          disabled={loading}
          inputRef={awayScoreInputRef}
          onKeyDown={(e) => handleKeyDown(e, 'away')}
          onFocus={() => setCurrentField('away')}
          compact={compact}
        />
      </Grid>
    </Grid>
  );
} else {
  // Desktop: Keep existing TextField (no changes)
  // ... existing code (lines 642-698)
}
```

### 4. Handle Callback Signature Changes

**Current callbacks:**
```typescript
onHomeScoreChange: (value?: number) => void;
onAwayScoreChange: (value?: number) => void;
```

**Current TextField implementation:**
```typescript
const handleHomeScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value === '' ? undefined : Number(e.target.value);
  onHomeScoreChange(value);
  // ... penalty logic
};
```

**Recommended approach: Refactor existing handlers to accept number directly**

Currently, `handleHomeScoreChange` and `handleAwayScoreChange` accept `React.ChangeEvent<HTMLInputElement>`.

**Refactor to create reusable handlers:**
```typescript
// NEW: Extracted logic that works for both TextField and Stepper
const handleHomeScoreChangeInternal = (value?: number) => {
  onHomeScoreChange(value);

  // If scores are no longer equal, reset penalty winners
  if (value !== awayScore) {
    onHomePenaltyWinnerChange(false);
    onAwayPenaltyWinnerChange(false);
  }
};

const handleAwayScoreChangeInternal = (value?: number) => {
  onAwayScoreChange(value);

  // If scores are no longer equal, reset penalty winners
  if (homeScore !== value) {
    onHomePenaltyWinnerChange(false);
    onAwayPenaltyWinnerChange(false);
  }
};

// EXISTING: TextField event handler (wraps internal handler)
const handleHomeScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value === '' ? undefined : Number(e.target.value);
  handleHomeScoreChangeInternal(value);
};

const handleAwayScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value === '' ? undefined : Number(e.target.value);
  handleAwayScoreChangeInternal(value);
};
```

**Usage:**
```tsx
// Desktop: TextField uses the event handler
<TextField
  value={homeScore ?? ''}
  onChange={handleHomeScoreChange}
  // ...
/>

// Mobile: Stepper uses the internal handler directly
<StepperScoreInput
  value={homeScore}
  onChange={handleHomeScoreChangeInternal}
  // ...
/>
```

**Benefits:**
- No duplication of penalty reset logic
- Clear separation: event handling vs business logic
- Both paths use the same core logic

### 5. Keyboard Navigation Compatibility

**Current keyboard navigation:**
- `homeScoreInputRef` / `awayScoreInputRef` are `RefObject<HTMLInputElement | null>`
- Used for focus management in keyboard navigation (lines 68-69, 115-120)

**New implementation:**
- `StepperScoreInput` accepts `inputRef?: React.RefObject<HTMLDivElement>`
- The ref is applied to the container `Box`, not individual buttons
- Focus management works the same (focusing the container focuses the first button)

**Keyboard event handling:**

**Parent's `handleKeyDown` is forwarded to stepper:**
```typescript
<StepperScoreInput
  onKeyDown={(e) => handleKeyDown(e, 'home')}
  // ...
/>
```

**Stepper component does NOT handle Tab/Shift+Tab internally:**
- When user presses Tab on stepper, the `onKeyDown` handler (from parent) fires
- Parent's `handleKeyDown` function handles Tab → navigates to next field
- Parent's `handleKeyDown` function handles Shift+Tab → navigates to previous field
- Parent's `handleKeyDown` function handles Enter → saves prediction
- Parent's `handleKeyDown` function handles Escape → cancels edit

**Stepper does NOT need internal keyboard handling** - it delegates to parent.

**Focus behavior:**
- When stepper container receives focus via `inputRef.current.focus()`, the decrement button is focused (via `useImperativeHandle`)
- User can tab out normally (handleKeyDown handles this)

**Optional enhancement (NOT in MVP):**
Arrow keys could increment/decrement when stepper is focused, but this is not essential and can be added later if desired.

### 6. Press-and-Hold Rapid Input (Deferred to Phase 4)

**Decision: NOT included in MVP (Phases 1-3)**

**Rationale:**
- Adds significant complexity (interval management, cleanup, both mouse and touch events)
- Increases test burden (30% more code to cover)
- Risk to 80% coverage goal
- Nice-to-have feature, not essential for UX improvement

**Implementation approach (for Phase 4, if time allows):**
Use `onMouseDown`, `onMouseUp`, `onTouchStart`, `onTouchEnd` events to detect long press.

**Strategy:**
```typescript
const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

const startIncrement = () => {
  handleIncrement(); // Immediate first increment
  const id = setInterval(() => handleIncrement(), 150); // Repeat every 150ms
  setIntervalId(id);
};

const stopIncrement = () => {
  if (intervalId) {
    clearInterval(intervalId);
    setIntervalId(null);
  }
};

// Cleanup on unmount
useEffect(() => {
  return () => {
    if (intervalId) clearInterval(intervalId);
  };
}, [intervalId]);

// On IconButton:
<IconButton
  onClick={handleIncrement}
  onMouseDown={startIncrement}
  onMouseUp={stopIncrement}
  onMouseLeave={stopIncrement}
  onTouchStart={startIncrement}
  onTouchEnd={stopIncrement}
  // ...
/>
```

**Note:** This feature is explicitly deferred to Phase 4 (post-MVP) to ensure 80% coverage is easily achievable in Phases 1-3.

### 7. Import Additions

**File:** `app/components/game-prediction-edit-controls.tsx`

Add to imports (line 6-28):
```typescript
import { IconButton } from '@mui/material'; // Add to line 23
import { AddIcon, RemoveIcon } from '@mui/icons-material'; // New line after line 28
```

**File:** `app/components/stepper-score-input.tsx` (new file)

```typescript
'use client'

import React, { useRef, useImperativeHandle } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material';
```

### 8. Edge Cases to Handle

#### 8.1. Empty vs Zero State

**Problem:** `undefined` vs `0` have different semantics.

**Solution:**
- `undefined` = no score entered yet (show "—")
- `0` = score is zero (show "0")
- First "+" tap on undefined → sets to 1
- First "-" tap on undefined → disabled (can't decrement empty)
- Decrement from 1 → sets to 0 (not undefined)

**Implementation:**
```typescript
const handleIncrement = () => {
  if (value === undefined) {
    onChange(1); // ✅ Correct
  } else {
    onChange(value + 1);
  }
};

const handleDecrement = () => {
  if (value === undefined) return; // ✅ No-op on empty
  if (value > 0) {
    onChange(value - 1);
  }
  // Note: When value === 0, do nothing (don't go to undefined)
};
```

#### 8.2. Penalty Shootout Reset

**Current behavior (lines 163-167, 174-178):**
When scores are no longer equal, reset penalty winners.

**Solution:**
Maintain this logic in the onChange wrapper:
```typescript
const handleHomeScoreChangeFromStepper = (value?: number) => {
  onHomeScoreChange(value);
  if (value !== awayScore) {
    onHomePenaltyWinnerChange(false);
    onAwayPenaltyWinnerChange(false);
  }
};
```

#### 8.3. Ref Type Mismatch and Focus Management

**Current:** `homeScoreInputRef?: React.RefObject<HTMLInputElement | null>`
**New:** Stepper uses `React.RefObject<HTMLDivElement | null>`

**Problem:** Changing to union type `HTMLInputElement | HTMLDivElement` doesn't work:
- MUI `TextField.inputRef` expects `HTMLInputElement` only
- Cannot pass `HTMLDivElement` ref to TextField
- Separate refs approach is messy and duplicates logic

**Recommended Solution: Use imperativeHandle pattern**

**Stepper component exposes unified focus() interface:**
```typescript
export default function StepperScoreInput({
  value,
  onChange,
  teamName,
  disabled = false,
  inputRef,
  onKeyDown,
  onFocus,
  compact = false
}: StepperScoreInputProps) {
  const decrementButtonRef = useRef<HTMLButtonElement>(null);

  // Expose focus() method through parent's ref
  useImperativeHandle(inputRef, () => ({
    focus: () => {
      // Focus the decrement button (first interactive element)
      decrementButtonRef.current?.focus();
    }
  }));

  // ... rest of component
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <IconButton
        ref={decrementButtonRef}
        onClick={handleDecrement}
        // ... rest of props
      />
      {/* ... score display and increment button */}
    </Box>
  );
}
```

**Parent component uses refs uniformly:**
```typescript
// No prop type changes needed!
// homeScoreInputRef works for both TextField and Stepper
homeScoreInputRef?.current?.focus(); // Works for both
```

**Why this works:**
- TextField's `inputRef` already provides `.focus()` method
- Stepper's `useImperativeHandle` exposes `.focus()` method
- Parent component calls `.focus()` identically for both
- No type changes needed in `GamePredictionEditControlsProps`

#### 8.4. Grid Size Adjustments

**Current horizontal layout:**
- Team name: `Grid size={7}` (58.3%)
- Score input: `Grid size={5}` (41.7%)

**New mobile layout:**
Stepper needs more horizontal space (3 elements: - / score / +).

**Recommendation:**
- Team name: `Grid size={5}` (41.7%)
- Stepper controls: `Grid size={7}` (58.3%)

This gives more room for stepper buttons without cramping the layout.

### 9. Accessibility (WCAG 2.1 Level AA)

**Requirements met:**
1. **Touch target size:** 44px × 44px (WCAG 2.5.5)
2. **Keyboard navigation:** All controls accessible via keyboard
3. **Screen reader support:** Proper aria-labels on buttons
4. **Focus indicators:** 2px outline on focus (existing theme)
5. **Color contrast:** Default theme meets WCAG AA standards

**Aria-labels:**
- Decrement button: `Decrease {teamName} score`
- Increment button: `Increase {teamName} score`
- Current score: Announced by screen reader when focused

### 10. Backward Compatibility

**No breaking changes:**
- Desktop users see no difference (TextField unchanged)
- Mobile users get improved UX (no keyboard popup)
- All existing callbacks and props remain unchanged
- Parent components (e.g., `game-card.tsx`) require no modifications

## Files to Modify

### Primary Changes

1. **`app/components/game-prediction-edit-controls.tsx`** (lines 487-698)
   - Import `IconButton`, `AddIcon`, `RemoveIcon`
   - Modify `renderScoreInputs()` to conditionally render stepper on mobile
   - Import and use `StepperScoreInput` component
   - Adjust Grid sizes for stepper layout
   - Update prop types if needed (ref types)

### New Files

2. **`app/components/stepper-score-input.tsx`** (new file)
   - Create reusable stepper component
   - Handle increment/decrement logic
   - Handle empty vs zero state
   - Implement accessibility features
   - Optional: Press-and-hold rapid input

### Testing Files

3. **`__tests__/components/game-prediction-edit-controls.test.tsx`**
   - Add tests for mobile stepper behavior
   - Mock `useMediaQuery` to return `true` (mobile)
   - Test increment/decrement actions
   - Test empty state handling
   - Test keyboard navigation with stepper
   - Test disabled states
   - Ensure desktop tests still pass (mock `useMediaQuery` to return `false`)

4. **`__tests__/components/stepper-score-input.test.tsx`** (new file)
   - Unit tests for stepper component
   - Test increment from undefined → 1
   - Test decrement disabled when undefined or 0
   - Test max value (99)
   - Test disabled state
   - Test aria-labels
   - Test keyboard events

## Testing Strategy

### Unit Tests

**Test scenarios for `StepperScoreInput`:**
1. **Initial render:**
   - Renders with undefined value (shows "—")
   - Decrement button is disabled
   - Increment button is enabled

2. **Increment from empty:**
   - Click "+": value becomes 1 (not undefined + 1)

3. **Decrement behavior:**
   - When undefined: no-op
   - When 0: no-op
   - When > 0: decreases by 1

4. **Increment behavior:**
   - Increases value by 1
   - Stops at 99 (max value)

5. **Disabled state:**
   - All buttons disabled when `disabled={true}`

6. **Accessibility:**
   - Proper aria-labels on buttons
   - Keyboard navigation works

**Test scenarios for `GamePredictionEditControls` (mobile vs desktop):**

**Mock strategy for `useMediaQuery`:**

The existing test file (line 11-17) mocks `useMediaQuery` globally to return `false` (desktop). We need separate test suites for mobile and desktop.

**Approach: Use separate describe blocks with different mocks**

```typescript
// At top of test file:
const mockUseMediaQuery = vi.fn();

vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    useMediaQuery: () => mockUseMediaQuery(), // Use the mock function
  };
});

describe('GamePredictionEditControls', () => {
  describe('Mobile (stepper buttons)', () => {
    beforeEach(() => {
      mockUseMediaQuery.mockReturnValue(true); // Mobile
    });

    it('renders stepper buttons instead of TextField', () => {
      renderWithProviders(<GamePredictionEditControls {...defaultProps} />, {
        guessesContext: createMockGuessesContext({ boostCounts: defaultBoostCounts })
      });

      // Verify stepper buttons are rendered
      expect(screen.getByLabelText(/Increase Mexico score/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Decrease Mexico score/i)).toBeInTheDocument();

      // Verify TextField is NOT rendered
      expect(screen.queryByRole('textbox', { name: /Mexico score/i })).not.toBeInTheDocument();
    });

    // ... more mobile-specific tests
  });

  describe('Desktop (TextField)', () => {
    beforeEach(() => {
      mockUseMediaQuery.mockReturnValue(false); // Desktop
    });

    it('renders TextField instead of stepper buttons', () => {
      renderWithProviders(<GamePredictionEditControls {...defaultProps} />, {
        guessesContext: createMockGuessesContext({ boostCounts: defaultBoostCounts })
      });

      // Verify TextField is rendered
      expect(screen.getByLabelText(/Mexico score/i)).toBeInTheDocument();

      // Verify stepper buttons are NOT rendered
      expect(screen.queryByLabelText(/Increase Mexico score/i)).not.toBeInTheDocument();
    });

    // ... existing desktop tests (ensure they still pass)
  });
});
```

1. **Renders stepper on mobile:**
   - Mock `useMediaQuery` to return `true`
   - Verify increment/decrement buttons are rendered (via aria-label)
   - Verify TextField is NOT rendered

2. **Renders TextField on desktop:**
   - Mock `useMediaQuery` to return `false`
   - Verify TextField is rendered
   - Verify stepper buttons are NOT rendered

3. **Callback integration:**
   - Click "+" on home stepper
   - Verify `onHomeScoreChange` called with correct value

4. **Penalty reset logic:**
   - Set home score = away score (trigger penalty shootout)
   - Change home score via stepper
   - Verify penalty winners are reset

5. **Keyboard navigation:**
   - Tab between fields works with stepper
   - Focus management works correctly

### Manual Testing Checklist

**Mobile devices (iOS Safari, Android Chrome):**
- [ ] No keyboard popup when tapping stepper buttons
- [ ] Card flip animation remains visible during editing
- [ ] Touch targets feel large enough (44px)
- [ ] Increment/decrement works smoothly
- [ ] Empty state handled correctly (first "+" sets to 1)
- [ ] Decrement disabled at 0 or empty
- [ ] Score display is readable
- [ ] Works in both portrait and landscape
- [ ] Press-and-hold works (if implemented)

**Desktop browsers (Chrome, Firefox, Safari):**
- [ ] TextField still rendered (no changes)
- [ ] No regression in existing functionality

**Accessibility:**
- [ ] Screen reader announces button labels correctly
- [ ] Keyboard navigation works (Tab, Shift+Tab, Enter)
- [ ] Focus indicators visible
- [ ] Touch targets meet WCAG 2.1 AA (44px)

**Edge cases:**
- [ ] Playoff games with penalty shootout (stepper + penalty checkboxes)
- [ ] Boost selection (stepper + boost buttons)
- [ ] Horizontal and vertical layouts
- [ ] Compact mode
- [ ] Loading state (all buttons disabled)
- [ ] Error state (display error, stepper still works)

## Validation Considerations

### SonarCloud Quality Gates

**Expected metrics:**
- **Coverage:** 80% on new code (unit tests for stepper component + integration tests)
- **Duplicated code:** <5% (stepper component is reusable, no duplication)
- **Cognitive complexity:** Low (extract increment/decrement logic into helpers)
- **Maintainability:** A rating (clean component structure, clear naming)

**Potential issues:**
- If press-and-hold is implemented, ensure intervals are cleaned up (prevent memory leaks)
- Ensure all accessibility features are covered by tests (aria-labels, keyboard events)

### Performance

**No performance concerns:**
- Stepper component is lightweight (3 buttons + 1 text)
- No expensive calculations
- No network requests
- useMediaQuery already used in parent component (no additional cost)

### Browser Compatibility

**Supported browsers:**
- iOS Safari 14+ (primary mobile target)
- Android Chrome 90+ (primary mobile target)
- Desktop: Chrome 90+, Firefox 88+, Safari 14+

**No polyfills needed:**
- All MUI components used are widely supported
- No cutting-edge CSS or JS features

## Implementation Phases

### Phase 1: Core Stepper Component (Essential)

**Tasks:**
1. Create `app/components/stepper-score-input.tsx`
2. Implement increment/decrement logic
3. Handle empty vs zero state
4. Add accessibility features (aria-labels, keyboard support)
5. Write unit tests for stepper component

**Deliverable:** Fully tested, reusable stepper component

### Phase 2: Integration into Edit Controls (Essential)

**Tasks:**
1. Import stepper component into `game-prediction-edit-controls.tsx`
2. Modify `renderScoreInputs()` for conditional rendering (mobile/desktop)
3. Adjust Grid sizes for stepper layout
4. Handle callback wrappers (penalty reset logic)
5. Update prop types if needed (ref types)
6. Write integration tests for mobile behavior

**Deliverable:** Mobile devices show stepper, desktop shows TextField

### Phase 3: Testing & Validation (Essential)

**Tasks:**
1. Run unit tests (`npm test`)
2. Run lint (`npm run lint`)
3. Run build (`npm run build`)
4. Manual testing on iOS/Android devices
5. Accessibility testing (screen reader, keyboard navigation)
6. Verify no regression on desktop

**Deliverable:** All tests pass, quality gates met, manual testing complete

### Phase 4: Press-and-Hold (Nice-to-Have)

**Tasks:**
1. Add interval-based rapid increment/decrement
2. Handle mouse and touch events
3. Clean up intervals on unmount
4. Test on mobile devices

**Deliverable:** Long press triggers rapid score changes (optional)

## Risks & Mitigation

### Risk 1: Keyboard Navigation Complexity

**Risk:** Stepper buttons might complicate existing keyboard navigation logic.

**Mitigation:**
- Reuse existing `handleKeyDown`, `onFocus` patterns
- Test Tab/Shift+Tab navigation thoroughly
- Ensure focus management works with stepper container

### Risk 2: Ref Type Mismatch

**Risk:** Parent components expect `HTMLInputElement` ref, but stepper uses `HTMLDivElement`.

**Mitigation:**
- Change prop types to union: `HTMLInputElement | HTMLDivElement`
- OR use separate refs for mobile/desktop
- Test focus behavior on both devices

### Risk 3: Grid Layout Breaking on Small Screens

**Risk:** Stepper (3 elements) might not fit well in existing Grid.

**Mitigation:**
- Adjust Grid sizes: Team name = 5, Stepper = 7
- Test on smallest supported screen (iPhone SE: 375px)
- Ensure buttons don't overlap or wrap

### Risk 4: Accessibility Gaps

**Risk:** Screen readers or keyboard users might struggle with stepper.

**Mitigation:**
- Proper aria-labels on all buttons
- Test with VoiceOver (iOS) and TalkBack (Android)
- Ensure keyboard-only navigation works
- Follow WCAG 2.1 Level AA guidelines

## Open Questions

None at this time. Requirements are clear and well-specified in the issue.

## Success Metrics

**User Experience:**
- Mobile keyboard no longer obscures card flip animation
- Touch targets are large and easy to tap
- Score input feels fast and responsive

**Technical:**
- 0 new SonarCloud issues
- 80%+ coverage on new code
- All existing tests pass
- No regression on desktop

**Accessibility:**
- WCAG 2.1 Level AA compliance
- Screen reader compatible
- Keyboard navigable
