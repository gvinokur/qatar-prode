# Implementation Plan: Tournament Prediction Status Icons Time-Based Urgency

**Story:** #213 - [Bug] Tournament Prediction Status Icons Ignore Time-Based Urgency

## Context

Tournament prediction status icons currently always show a warning icon (🟠) when predictions are incomplete, regardless of how much time remains until the prediction deadline. This is inconsistent with the game predictions urgency system, which shows different icons (info, warning, error) based on time urgency. Users see orange warning icons even when they have >2 days to complete predictions, creating unnecessary urgency and poor UX.

The issue affects two components:
- **TournamentPredictionAccordion** (parent): Shows overall tournament prediction status
- **TournamentPredictionCategoryCard** (children): Shows individual category status (Podio, Individual Awards, Qualified Teams)

The codebase already has urgency calculation logic in `urgency-helpers.tsx` that's used for game predictions, but it's not being used for tournament predictions in these components.

## Objectives

1. Make tournament prediction icons use time-based urgency (same system as game predictions)
2. Implement "worst child status" aggregation for parent accordion
3. Ensure consistency across the prediction status system
4. Maintain existing tests and add new time-based test scenarios

## Root Cause

### Current Implementation Issues

**TournamentPredictionAccordion** (`app/components/tournament-prediction-accordion.tsx` lines 37-52):
```typescript
const getAccordionColor = (): string => {
  if (isPredictionLocked) return 'text.disabled';
  if (overallPercentage === 100) return 'success.main';
  return 'warning.main';  // ❌ Always warning for incomplete
};

const getAccordionIcon = (): React.ReactElement => {
  if (isPredictionLocked) return <LockIcon color="disabled" />;
  if (overallPercentage === 100) return <CheckCircleIcon color="success" />;
  return <WarningIcon color="warning" />;  // ❌ Always warning for incomplete
};
```

**TournamentPredictionCategoryCard** (`app/components/tournament-prediction-category-card.tsx` lines 41-49):
```typescript
const getCategoryStatusIcon = (): React.ReactElement => {
  if (isLocked) return <LockIcon sx={{ fontSize: 16, color: 'info.main' }} />;
  if (isComplete) return <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />;
  return <WarningIcon sx={{ fontSize: 16, color: 'warning.main' }} />;  // ❌ Always warning
};
```

**Missing Data Flow:**
- `prediction-status-bar.tsx` has `tournamentStartDate` prop (line 25)
- But doesn't pass it to `TournamentPredictionAccordion` (line 325-330)
- Neither component receives or uses `tournamentStartDate` for urgency calculation

## Acceptance Criteria

- [ ] Tournament prediction categories show time-based urgency icons
- [ ] Parent accordion icon reflects worst child status
- [ ] Icons match game prediction urgency system behavior:
  - >48h until lock → INFO icon (blue) for incomplete predictions
  - 24-48h until lock → INFO icon (blue)
  - 2-24h until lock → WARNING icon (orange)
  - <2h until lock → ERROR icon (red)
  - 100% complete → SUCCESS icon (green)
  - Locked → LOCK icon (gray)
- [ ] Existing unit tests pass
- [ ] New tests cover time-based urgency scenarios
- [ ] Border colors update to match urgency level
- [ ] Visual verification in dashboard confirms correct behavior

## Technical Approach

### 1. Data Flow Changes

**prediction-status-bar.tsx** (line 325-330):
```typescript
<TournamentPredictionAccordion
  tournamentPredictions={tournamentPredictions}
  tournamentId={tournamentId}
  tournamentStartDate={tournamentStartDate}  // ✅ ADD THIS
  isExpanded={tournamentAccordionExpanded}
  onToggle={() => setTournamentAccordionExpanded(prev => !prev)}
/>
```

### 2. Component Updates

#### TournamentPredictionAccordion

**Add prop and calculate urgency:**
```typescript
interface TournamentPredictionAccordionProps {
  readonly tournamentPredictions: TournamentPredictionCompletion;
  readonly tournamentId: string;
  readonly tournamentStartDate?: Date;  // ✅ ADD THIS
  readonly isExpanded: boolean;
  readonly onToggle: () => void;
}

// Inside component:
// Calculate urgency for each category
const finalStandingsUrgency = getCategoryUrgencyLevel(
  tournamentPredictions.finalStandings.completed,
  tournamentPredictions.finalStandings.total,
  isPredictionLocked,
  tournamentStartDate
);

const awardsUrgency = getCategoryUrgencyLevel(
  tournamentPredictions.awards.completed,
  tournamentPredictions.awards.total,
  isPredictionLocked,
  tournamentStartDate
);

const qualifiersUrgency = tournamentPredictions.qualifiers.total > 0
  ? getCategoryUrgencyLevel(
      tournamentPredictions.qualifiers.completed,
      tournamentPredictions.qualifiers.total,
      isPredictionLocked,
      tournamentStartDate
    )
  : 'complete';

// Get worst urgency level across all categories
const overallUrgency = getWorstUrgencyLevel(
  finalStandingsUrgency,
  awardsUrgency,
  qualifiersUrgency
);
```

**Update icon/color functions to use urgency:**
```typescript
const getAccordionColor = (): string => {
  switch (overallUrgency) {
    case 'urgent': return 'error.main';
    case 'warning': return 'warning.main';
    case 'notice': return 'info.main';
    case 'complete': return 'success.main';
    case 'locked': return 'text.disabled';
  }
};

const getAccordionIcon = (): React.ReactElement => {
  return getUrgencyIcon(overallUrgency);  // Use existing helper
};
```

**Pass tournamentStartDate to children:**
```typescript
<TournamentPredictionCategoryCard
  title={t('tournament.podium')}
  completed={tournamentPredictions.finalStandings.completed}
  total={tournamentPredictions.finalStandings.total}
  link={`/${locale}/tournaments/${tournamentId}/awards`}
  isLocked={isPredictionLocked}
  tournamentStartDate={tournamentStartDate}  // ✅ ADD THIS
/>
```

#### TournamentPredictionCategoryCard

**Add prop and calculate urgency:**
```typescript
interface TournamentPredictionCategoryCardProps {
  readonly title: string;
  readonly completed: number;
  readonly total: number;
  readonly link: string;
  readonly isLocked: boolean;
  readonly tournamentStartDate?: Date;  // ✅ ADD THIS
}

// Inside component:
const urgencyLevel = getCategoryUrgencyLevel(
  safeCompleted,
  total,
  isLocked,
  tournamentStartDate
);
```

**Update icon/color functions to use urgency:**
```typescript
const getCategoryStatusIcon = (): React.ReactElement => {
  const icon = getUrgencyIcon(urgencyLevel);
  // Clone icon with fontSize for consistency (category cards use 16px)
  return React.cloneElement(icon, { sx: { fontSize: 16 } });
};

const getCategoryCardBorderColor = (): string => {
  switch (urgencyLevel) {
    case 'urgent': return 'error.main';
    case 'warning': return 'warning.main';
    case 'notice': return 'info.main';
    case 'complete': return 'divider';
    case 'locked': return 'divider';
  }
};

const getCategoryCardBorderWidth = (): number => {
  // Thicker border for urgent/warning to draw attention
  return (urgencyLevel === 'urgent' || urgencyLevel === 'warning') ? 2 : 1;
};
```

### 3. Helper Functions

**Add to urgency-helpers.tsx (shared location to avoid duplication):**
```typescript
// Time constants for urgency calculations
export const URGENCY_TIME_CONSTANTS = {
  TOURNAMENT_LOCK_OFFSET_DAYS: 5,
  URGENT_THRESHOLD_HOURS: 2,
  WARNING_THRESHOLD_HOURS: 24,
  NOTICE_THRESHOLD_HOURS: 48
} as const;

/**
 * Calculate urgency level for a specific tournament prediction category
 * @param completed - Number of predictions completed in this category
 * @param total - Total predictions needed in this category
 * @param isPredictionLocked - Whether predictions are locked
 * @param tournamentStartDate - Tournament start date (used to calculate lock time)
 * @returns Urgency level for this category
 */
export function getCategoryUrgencyLevel(
  completed: number,
  total: number,
  isPredictionLocked: boolean,
  tournamentStartDate: Date | undefined
): UrgencyLevel {
  if (isPredictionLocked) return 'locked';
  if (completed === total) return 'complete';
  if (!tournamentStartDate) return 'notice';  // Default to notice if no date

  // Lock time is TOURNAMENT_LOCK_OFFSET_DAYS after tournament start
  const lockTime = new Date(
    tournamentStartDate.getTime() +
    URGENCY_TIME_CONSTANTS.TOURNAMENT_LOCK_OFFSET_DAYS * 24 * 60 * 60 * 1000
  );
  const now = new Date();
  const hoursUntilLock = (lockTime.getTime() - now.getTime()) / (60 * 60 * 1000);

  if (hoursUntilLock < 0) return 'locked';
  if (hoursUntilLock < URGENCY_TIME_CONSTANTS.URGENT_THRESHOLD_HOURS) return 'urgent';
  if (hoursUntilLock < URGENCY_TIME_CONSTANTS.WARNING_THRESHOLD_HOURS) return 'warning';
  if (hoursUntilLock < URGENCY_TIME_CONSTANTS.NOTICE_THRESHOLD_HOURS) return 'notice';
  return 'notice';  // >48h = notice (not urgent, but incomplete)
}

/**
 * Get the worst (most urgent) urgency level from a list
 * Priority: urgent > warning > notice > complete > locked
 * @param levels - Urgency levels to compare
 * @returns The most urgent level
 */
export function getWorstUrgencyLevel(...levels: UrgencyLevel[]): UrgencyLevel {
  const priority: UrgencyLevel[] = ['urgent', 'warning', 'notice', 'complete', 'locked'];

  for (const level of priority) {
    if (levels.includes(level)) {
      return level;
    }
  }

  return 'complete';  // Fallback
}
```

**Import in tournament-prediction-accordion.tsx:**
```typescript
import { UrgencyLevel, getUrgencyIcon, getCategoryUrgencyLevel, getWorstUrgencyLevel } from './urgency-helpers';
```

**Import in tournament-prediction-category-card.tsx:**
```typescript
import { UrgencyLevel, getUrgencyIcon, getCategoryUrgencyLevel } from './urgency-helpers';
```

### 4. Visual Changes Summary

**Icon Changes Based on Time:**

| Time Until Lock | Current Icon | New Icon | Color | When |
|----------------|--------------|----------|-------|------|
| >48 hours | ⚠️ Warning | ℹ️ Info | Blue | Not urgent, plenty of time |
| 24-48 hours | ⚠️ Warning | ℹ️ Info | Blue | Still comfortable time |
| 2-24 hours | ⚠️ Warning | ⚠️ Warning | Orange | Getting close, attention needed |
| <2 hours | ⚠️ Warning | 🔴 Error | Red | Urgent, deadline approaching |
| 100% complete | ✅ Check | ✅ Check | Green | No change |
| Locked | 🔒 Lock | 🔒 Lock | Gray | No change |

**Border Changes:**
- Urgent (red) → 2px red border
- Warning (orange) → 2px orange border
- Notice (blue) → 1px blue border
- Complete/Locked → 1px divider (gray)

**Parent Accordion Behavior:**
- Shows worst child status (most urgent category determines parent icon)
- Example: If Podio is urgent (red), Awards is notice (blue), and Qualifiers is complete (green) → Parent shows urgent (red)

## Files to Modify

1. **app/components/urgency-helpers.tsx**
   - Add `URGENCY_TIME_CONSTANTS` export with time thresholds (prevent magic numbers)
   - Add `getCategoryUrgencyLevel()` helper function (category-level urgency calculation)
   - Add `getWorstUrgencyLevel()` helper function (aggregate worst urgency from children)
   - Update existing `getTournamentUrgencyLevel()` to use `URGENCY_TIME_CONSTANTS` for consistency

2. **app/components/prediction-status-bar.tsx**
   - Line 325-330: Add `tournamentStartDate` prop to `TournamentPredictionAccordion`

3. **app/components/tournament-prediction-accordion.tsx**
   - Add `tournamentStartDate` to interface (line 19-24)
   - Import `getCategoryUrgencyLevel`, `getWorstUrgencyLevel` from urgency-helpers
   - Calculate urgency for each category
   - Update `getAccordionColor()` to use urgency (line 37-41)
   - Update `getAccordionIcon()` to use `getUrgencyIcon()` (line 44-52)
   - Pass `tournamentStartDate` to all `TournamentPredictionCategoryCard` children (lines 90-115)

4. **app/components/tournament-prediction-category-card.tsx**
   - Add `tournamentStartDate` to interface (line 18-24)
   - Import `getCategoryUrgencyLevel` from urgency-helpers
   - Calculate urgency level
   - Update `getCategoryStatusIcon()` to use `getUrgencyIcon()` (line 41-49)
   - Update `getCategoryCardBorderColor()` to use urgency (line 52-57)
   - Update `getCategoryCardBorderWidth()` to use urgency (line 60-65)

## Testing Strategy

### Unit Tests

#### 1. Update Existing Tests

**tournament-prediction-accordion.test.tsx:**
- Update "renders with correct icon for incomplete state" test to include `tournamentStartDate` and verify time-based icons
- Add tests for each urgency level (urgent, warning, notice)
- Add tests for "worst child status" aggregation
- Add test for missing `tournamentStartDate` (should default to notice)

**tournament-prediction-category-card.test.tsx:**
- Add tests for time-based urgency icons
- Add tests for urgency-based border colors and widths
- Add test for missing `tournamentStartDate` (should default to notice)

#### 2. New Test Scenarios

**Time-based urgency tests (use vi.useFakeTimers for deterministic time):**
```typescript
describe('Time-based Urgency', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z')); // Fixed time for tests
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows INFO icon when >48h until lock and incomplete', () => {
    const tournamentStart = new Date('2023-12-28T12:00:00Z'); // Lock in 72h
    // Test expects InfoIcon
  });

  it('shows WARNING icon when 2-24h until lock and incomplete', () => {
    const tournamentStart = new Date('2023-12-27T12:00:00Z'); // Lock in 12h
    // Test expects WarningIcon
  });

  it('shows ERROR icon when <2h until lock and incomplete', () => {
    const tournamentStart = new Date('2023-12-26T13:00:00Z'); // Lock in 1h
    // Test expects ErrorIcon
  });

  it('shows ERROR icon when exactly at lock time (0h until lock)', () => {
    const tournamentStart = new Date('2023-12-26T12:00:00Z'); // Lock now
    // Test expects ErrorIcon or locked (edge case)
  });

  it('defaults to notice when tournamentStartDate is undefined', () => {
    // Test expects InfoIcon
  });
});
```

**Worst child status tests (accordion only):**
```typescript
describe('Worst Child Status Aggregation', () => {
  it('shows urgent when any child is urgent', () => {
    // Podio: urgent, Awards: notice, Qualifiers: complete
    // Expect parent to show ErrorIcon
  });

  it('shows warning when no urgent but has warning', () => {
    // Podio: warning, Awards: notice, Qualifiers: complete
    // Expect parent to show WarningIcon
  });

  it('shows notice when all incomplete children are notice', () => {
    // Podio: notice, Awards: notice, Qualifiers: complete
    // Expect parent to show InfoIcon
  });
});
```

#### 3. Test Utilities to Use

**MANDATORY utilities from testing.md:**
- `renderWithTheme()` from `@/__tests__/utils/test-utils` for theme context
  - **CRITICAL**: Update tournament-prediction-accordion.test.tsx to use `renderWithTheme()` (currently uses raw `render()`)
  - Category card tests already use `renderWithTheme()` correctly
- `vi.useFakeTimers()` for deterministic time in time-based urgency tests
- Test factories if creating mock tournament prediction data (check `@/__tests__/db/test-factories`)

#### 4. Additional Test Coverage

**Icon size consistency test (category cards):**
```typescript
it('preserves 16px icon size when using getUrgencyIcon', () => {
  const props = {
    ...defaultProps,
    tournamentStartDate: new Date(Date.now() + 1 * 60 * 60 * 1000) // urgent
  };
  const { container } = renderWithTheme(<TournamentPredictionCategoryCard {...props} />);
  const icon = container.querySelector('[data-testid="ErrorIcon"]');
  expect(icon).toHaveStyle({ fontSize: '16px' });
});
```

**Helper function coverage targets:**
- `getCategoryUrgencyLevel`: Test all 7 branches (locked, complete, no date, <0h, <2h, <24h, <48h, >48h)
- `getWorstUrgencyLevel`: Test all 5 urgency levels + combinations (urgent+warning, warning+notice, etc.)

### Manual Testing

**Scenarios to verify in dashboard:**

1. **>48h until lock**: Create test tournament starting in 4 days → Incomplete predictions should show blue info icons
2. **24-48h until lock**: Create test tournament starting in 2 days → Incomplete should show blue info icons
3. **2-24h until lock**: Create test tournament starting in 12 hours → Incomplete should show orange warning icons
4. **<2h until lock**: Create test tournament starting in -4 days (lock in 1h) → Incomplete should show red error icons
5. **Mixed states**: Partially complete categories → Parent should show worst child status
6. **All complete**: All predictions 100% → Green check icons
7. **Locked**: Tournament locked → Gray lock icons

**Test in dashboard URL:**
```
http://localhost:3000/[locale]/dashboard
```

## Implementation Steps

### Phase 1: Component Updates (Sequential)

1. **Update urgency-helpers.tsx (foundation)**
   - Add `URGENCY_TIME_CONSTANTS` export with time thresholds
   - Add `getCategoryUrgencyLevel()` helper function
   - Add `getWorstUrgencyLevel()` helper function
   - Update existing `getTournamentUrgencyLevel()` to use constants (optional refactor for consistency)

2. **Update prediction-status-bar.tsx**
   - Pass `tournamentStartDate` to `TournamentPredictionAccordion`
   - Quick change, no complex logic

3. **Update tournament-prediction-accordion.tsx**
   - Add `tournamentStartDate` prop to interface
   - Import helpers from urgency-helpers (`getCategoryUrgencyLevel`, `getWorstUrgencyLevel`, `getUrgencyIcon`)
   - Calculate urgency for each category
   - Update `getAccordionColor()` and `getAccordionIcon()` to use urgency
   - Pass `tournamentStartDate` to all category card children

4. **Update tournament-prediction-category-card.tsx**
   - Add `tournamentStartDate` prop to interface
   - Import `getCategoryUrgencyLevel` and `getUrgencyIcon` from urgency-helpers
   - Calculate urgency level
   - Update `getCategoryStatusIcon()` to use `getUrgencyIcon()` with `React.cloneElement` for 16px size
   - Update `getCategoryCardBorderColor()` to use urgency
   - Update `getCategoryCardBorderWidth()` to use urgency

### Phase 2: Testing (Parallel after Phase 1)

5. **Add tests to urgency-helpers.test.tsx**
   - Test `getCategoryUrgencyLevel()` with all branches
   - Test `getWorstUrgencyLevel()` with all priority combinations
   - Use `vi.useFakeTimers()` for deterministic time
   - Ensure 100% branch coverage for new helpers

6. **Update tournament-prediction-accordion.test.tsx**
   - **CRITICAL**: Replace `render()` with `renderWithTheme()` in all tests
   - Add time-based urgency test cases (with vi.useFakeTimers)
   - Add worst child status aggregation tests
   - Update existing tests to handle new behavior

7. **Update tournament-prediction-category-card.test.tsx**
   - Add time-based urgency test cases (with vi.useFakeTimers)
   - Add urgency-based border tests
   - Add icon size consistency test (verify 16px preserved with cloneElement)
   - Update existing tests
   - Already uses `renderWithTheme()` ✅

### Phase 3: Validation

8. **Run validation checks**
   - `npm test` - All tests must pass
   - `npm run lint` - No linting errors
   - `npm run build` - Production build succeeds

9. **Manual verification**
   - Test in local dashboard with different time scenarios
   - Verify icons match expected behavior
   - Verify border colors and widths
   - Verify parent accordion shows worst child status

## SonarCloud Considerations

### Coverage Requirements
- **Target**: 80% coverage on new code
- **Strategy**:
  - Add comprehensive unit tests for helper functions (`getCategoryUrgencyLevel`, `getWorstUrgencyLevel`)
  - Test all urgency level branches (urgent, warning, notice, complete, locked)
  - Test edge cases (missing date, past lock time, exact boundary times)

### Quality Gates
- **0 new issues** (any severity)
- **Security**: No security hotspots (icon rendering is safe)
- **Maintainability**: Functions are pure, testable, well-named
- **Duplicated Code**: Helper functions are reused across components (acceptable)

### Potential Issues to Avoid
- ❌ Uncovered branches in urgency calculation
- ❌ Complex nested ternaries (use switch statements)
- ❌ Magic numbers (use constants for time calculations)
- ❌ Unused imports

## Edge Cases & Considerations

1. **Missing tournamentStartDate**
   - Default to `'notice'` urgency level
   - Prevents errors, shows safe default

2. **Past lock time but not locked**
   - `hoursUntilLock < 0` → Return `'locked'`
   - Defensive programming

3. **Exact boundary times**
   - Use `<` not `<=` for clear boundaries
   - Example: 2h exactly = warning (not urgent)

4. **Helper function reuse**
   - `getCategoryUrgencyLevel` is defined in `urgency-helpers.tsx` (shared location)
   - Imported in both accordion and category card components
   - Avoids code duplication and improves maintainability

5. **Icon size consistency**
   - Accordion icons: 24px (default MUI size)
   - Category card icons: 16px (custom via `sx={{ fontSize: 16 }}`)
   - Use `React.cloneElement` to preserve size while changing icon

6. **Qualifiers conditional rendering**
   - If `qualifiers.total === 0`, not rendered
   - `getWorstUrgencyLevel` should handle this (use 'complete' for missing categories)

## Open Questions

None - implementation is well-defined by the issue and existing urgency helpers.

## Dependencies

- No new dependencies
- Reuses existing `urgency-helpers.tsx` functions
- Uses existing MUI icons (already imported)

## Rollback Plan

If issues arise:
1. Revert changes to the 3 files
2. Components fall back to original behavior (always warning for incomplete)
3. No database changes, no migration needed
4. Safe to rollback at any time

## Success Metrics

- [ ] All unit tests pass (existing + new)
- [ ] 80% coverage on modified code
- [ ] 0 new SonarCloud issues
- [ ] Visual verification confirms correct icons at different time ranges
- [ ] User sees appropriate urgency levels (not always warned when plenty of time remains)
