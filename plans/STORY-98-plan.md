# Implementation Plan: Story #98 - Integration Tests for Qualified Teams Feature

## Story Context

**Issue**: #98 - [TECH] Integration Tests for Qualified Teams Feature
**Type**: Infrastructure / Testing
**Effort**: Low
**Related**: Story #90 (qualified teams feature implementation)

### Background
The qualified teams prediction feature was implemented in Story #90 with comprehensive unit tests (85%+ coverage). However, integration tests are needed to verify complete user flows across multiple components, including drag-and-drop interactions, multi-group scenarios, third-place qualification rules, tournament lock state, and backoffice configuration integration.

### Objectives
1. Add end-to-end integration tests for the qualified teams feature
2. Test multi-component flows that unit tests don't cover
3. Verify drag-and-drop behavior with state management
4. Test third-place qualification rules across multiple groups
5. Validate tournament lock state integration
6. Ensure backoffice configuration changes affect user experience correctly

---

## Acceptance Criteria

- [ ] Integration tests for drag-and-drop prediction flow (single group)
- [ ] Integration tests for multi-group third-place selection with global limits
- [ ] Integration tests for scoring calculation and display after group completion
- [ ] Integration tests for tournament lock state (read-only mode)
- [ ] Integration tests for pending third-place states and transitions
- [ ] Integration tests for optimistic updates and error recovery
- [ ] Integration tests for mobile vs desktop responsive behavior
- [ ] Integration tests for backoffice configuration changes
- [ ] All tests follow existing integration testing patterns (Vitest + React Testing Library)
- [ ] Tests use proper utilities (renderWithTheme, test factories, mock helpers)
- [ ] 80%+ coverage maintained on new test code
- [ ] All tests pass locally and in CI/CD

---

## Technical Approach

### Testing Strategy

We'll create integration tests following the established patterns in `__tests__/integration/`:
- **Multi-component interaction**: Test how drag-and-drop, context, and server actions work together
- **Mock external dependencies**: Mock Next.js hooks, server actions, repositories
- **Test realistic user flows**: Focus on complete workflows, not isolated components
- **Use existing utilities**: Leverage `renderWithTheme`, `testFactories`, `createMockSelectQuery`, etc.

### Test Categories

**Category 1: Basic Drag-and-Drop Flow (Single Group)**
- User loads page with initial predictions (all qualify=false)
- User drags teams to reorder positions
- Automatic qualification for positions 1-2
- Manual qualification toggle for position 3
- Batch save to server with optimistic updates
- Success/error handling with snackbar feedback

**Category 2: Multi-Group Third-Place Selection**
- User navigates between multiple groups
- User selects third-place qualifiers across groups
- Global limit validation (e.g., max 4 teams from position 3)
- ThirdPlaceSummary shows progress (e.g., "3 / 4")
- Validation error when limit exceeded
- Cross-group state consistency

**Category 3: Scoring and Group Completion**
- Group completes with actual standings
- Scoring calculated for user's predictions
- DraggableTeamCard shows results (green border, success chip)
- Scoring breakdown displayed (qualification + position bonus)
- Different states: exact match (+2), qualified wrong position (+1), not predicted (0)

**Category 4: Pending Third-Place States**
- Group completes but third-place qualifier not yet determined
- Card shows pending state (blue border, hourglass icon)
- After playoff bracket determined, state transitions to final result
- Handle case where third-place team doesn't qualify

**Category 5: Tournament Lock State**
- Tournament locked (5+ days after start)
- All drag-and-drop disabled
- Checkboxes disabled
- Warning alert displayed
- Read-only mode for predictions
- Dev override with `?editPlayoffs=true` in dev/preview environments

**Category 6: Optimistic Updates and Error Recovery**
- User drags teams, context updates optimistically
- Save succeeds → snackbar confirmation
- Save fails → rollback to previous state, error snackbar
- Race conditions: rapid successive drags
- Network error handling

**Category 7: Responsive Behavior**
- Desktop: 3-column grid, card layout
- Tablet: 2-column grid
- Mobile: 1-column grid, accordion layout
- Accordion expand/collapse on mobile
- Group summary shows "GRUPO X - Y seleccionados"

### Mocking Strategy

**Mocks needed:**
1. **Next.js**: `usePathname`, `useRouter`, `useSearchParams`, `redirect`, `notFound`
2. **MUI**: `useMediaQuery` for responsive testing
3. **Server Actions**: `updateGroupPositions` from `qualification-actions.ts`
4. **Repositories**: `getQualifiedTeamsPredictionForGroup`, `getTournamentQualificationConfig`
5. **Utility Functions**: `getTournamentStartDate`, `getLoggedInUser`
6. **DnD Kit**: Use actual library (not mocked) for realistic drag simulation

**Mock Data:**
- Use `testFactories.tournament()`, `testFactories.tournamentGroup()`, `testFactories.team()`
- Create factory for qualified teams predictions: `testFactories.qualifiedTeamPrediction()`
- Create realistic multi-group scenarios (4 groups, 16 teams)
- **Group completion mock**: Mock `actualResults` as array of qualified team IDs:
  ```typescript
  const mockActualResults = {
    groupId: 'group-a',
    qualifiedTeamIds: ['team-1', 'team-2', 'team-3'], // 1st, 2nd, 3rd place
    standings: [
      { teamId: 'team-1', position: 1 },
      { teamId: 'team-2', position: 2 },
      { teamId: 'team-3', position: 3 },
      { teamId: 'team-4', position: 4 }
    ]
  }
  ```
- **Playoff bracket mock**: Mock `hasPlayoffBracket` boolean to simulate when third-place qualifiers are determined
- **Pending state**: When group complete but `hasPlayoffBracket = false`, third-place teams show pending state

---

## Files to Create

All new test files will be in `__tests__/integration/`:

### 1. `qualified-teams-drag-and-drop.test.tsx`
**Purpose**: Test basic drag-and-drop flow with single group
**Scenarios**:
- Load page with initial predictions
- Drag team from position 1 to position 2 (swap)
- Verify automatic qualification for top 2
- Toggle third-place qualification checkbox
- Verify batch save with optimistic update
- Test save success and error handling

### 2. `qualified-teams-multi-group-third-place.test.tsx`
**Purpose**: Test third-place selection across multiple groups
**Scenarios**:
- Load tournament with 4 groups (max 4 third-place qualifiers)
- Select third-place teams in groups A, B, C
- Navigate between groups, verify state persistence
- Select 4th third-place team → ThirdPlaceSummary shows "4 / 4"
- Attempt to select 5th → validation error
- Deselect one team → can select another

### 3. `qualified-teams-scoring-integration.test.tsx`
**Purpose**: Test scoring calculation and display after group completion
**Scenarios**:
- User makes predictions: Team A (1st, qualify), Team B (2nd, qualify), Team C (3rd, qualify)
- Group completes with same standings (A=1st, B=2nd, C=3rd)
- Verify scoring: A=+2, B=+2, C=+2
- Test partial match: predicted A=1st, actual B=1st → verify A gets 0, B shows as qualified
- Test wrong position: predicted A=1st, actual A=2nd → verify A=+1 (qualified, wrong position)

### 4. `qualified-teams-tournament-lock.test.tsx`
**Purpose**: Test tournament lock state and read-only mode
**Scenarios**:
- Tournament started 6 days ago → isLocked = true
- Verify drag-and-drop disabled
- Verify checkboxes disabled
- Warning alert displayed
- Dev override: dev tournament with `?editPlayoffs=true` → can still edit

### 5. `qualified-teams-pending-states.test.tsx`
**Purpose**: Test pending third-place states and transitions
**Scenarios**:
- Group completes: Team C finishes 3rd (user predicted C to qualify)
- Other groups not complete → C shows pending state
- After all groups complete and playoff bracket exists → C transitions to final result
- Test case where C didn't qualify → shows failure state

### 6. `qualified-teams-error-recovery.test.tsx`
**Purpose**: Test optimistic updates and error recovery
**Scenarios**:
- User drags team → optimistic update (immediate UI change)
- Save succeeds → confirmation snackbar
- User drags again → save fails → rollback to previous state
- Error snackbar displayed
- User corrects and saves again → success

### 7. `qualified-teams-responsive.test.tsx`
**Purpose**: Test responsive behavior across devices
**Scenarios**:
- Desktop (lg+): verify 3-column grid
- Tablet (md): verify 2-column grid
- Mobile (sm): verify 1-column grid, accordion layout
- Mobile accordion: expand/collapse groups
- Mobile summary: verify "GRUPO A - 3 seleccionados" format

### 8. `qualified-teams-backoffice-integration.test.tsx`
**Purpose**: Test integration with backoffice tournament configuration
**Scenarios**:
- Tournament with `allows_third_place_qualification = false` → third-place checkboxes hidden
- Tournament with `allows_third_place_qualification = true` → checkboxes visible
- Tournament with `max_third_place_qualifiers = 2` → can select max 2 teams
- ThirdPlaceSummary shows correct limit based on configuration
- Configuration changes reflect in UI (simulate config change via rerender)

---

## Implementation Steps

### Step 1: Setup Test Utilities and Verify Existing Patterns
- Verify `testFactories` has all necessary factories (tournament, group, team)
- Check existing unit tests for qualified teams to understand mocking patterns
- **Tournament configuration**: Use `testFactories.tournament()` with overrides:
  ```typescript
  testFactories.tournament({
    allows_third_place_qualification: true,
    max_third_place_qualifiers: 4
  })
  ```
- **DnD simulation**: Check existing dnd tests for drag simulation patterns (e.g., `qualified-teams-client-page-dnd.test.tsx`)
- **useMediaQuery mock**: Follow pattern from `tournament-layout-bottom-nav.test.tsx`:
  ```typescript
  vi.mock('@mui/material', async () => {
    const actual = await vi.importActual('@mui/material');
    return { ...actual, useMediaQuery: vi.fn() };
  });
  ```
- Create `testFactories.qualifiedTeamPrediction()` if not exists

### Step 2: Create Base Integration Test (Drag-and-Drop)
**File**: `qualified-teams-drag-and-drop.test.tsx`
1. Setup mocks for Next.js, server actions, repositories
2. Create realistic test data (1 tournament, 1 group, 4 teams)
3. Test initial render with predictions (all qualify=false)
4. Simulate drag operation (Team 1 ↔ Team 2)
5. Verify optimistic update in context
6. Verify server action called with correct payload
7. Test success path: confirmation snackbar
8. Test error path: rollback + error snackbar

### Step 3: Create Multi-Group Third-Place Test
**File**: `qualified-teams-multi-group-third-place.test.tsx`
1. Setup 4 groups with 16 teams total
2. Mock tournament config: `max_third_place_qualifiers = 4`
3. Test selecting third-place teams across groups
4. Verify ThirdPlaceSummary count updates
5. Test validation error when exceeding limit
6. Test deselect and reselect flow

### Step 4: Create Scoring Integration Test
**File**: `qualified-teams-scoring-integration.test.tsx`
1. Mock group completion with actual standings
2. Test exact match scoring (+2 pts)
3. Test qualified wrong position (+1 pt)
4. Test not predicted (0 pts)
5. Verify DraggableTeamCard shows correct result state
6. Verify scoring breakdown displayed

### Step 5: Create Tournament Lock Test
**File**: `qualified-teams-tournament-lock.test.tsx`
1. Mock tournament start date (6+ days ago)
2. Verify isLocked = true
3. Test disabled drag-and-drop
4. Test disabled checkboxes
5. Test warning alert displayed
6. Test dev override scenario

### Step 6: Create Pending States Test
**File**: `qualified-teams-pending-states.test.tsx`
1. Mock partially complete groups
2. Test pending third-place display
3. Mock playoff bracket determination
4. Test state transition to final result

### Step 7: Create Error Recovery Test
**File**: `qualified-teams-error-recovery.test.tsx`
1. Mock successful save initially
2. Mock failed save on second attempt
3. Verify rollback to previous state
4. Verify error snackbar
5. Test retry success

### Step 8: Create Responsive Test
**File**: `qualified-teams-responsive.test.tsx`
1. Mock `useMediaQuery` for desktop/tablet/mobile
2. Test grid column count changes
3. Test accordion on mobile
4. Test card layout on desktop
5. Verify responsive summary format

### Step 9: Create Backoffice Integration Test
**File**: `qualified-teams-backoffice-integration.test.tsx`
1. Mock tournament with different configurations
2. Test third-place checkboxes hidden when `allows_third_place_qualification = false`
3. Test third-place checkboxes visible when enabled
4. Test limit enforcement with different `max_third_place_qualifiers` values
5. Test ThirdPlaceSummary shows correct limit

### Step 10: Run All Tests Locally
```bash
npm run test -- __tests__/integration/qualified-teams
```

### Step 11: Verify Coverage
- Run coverage report
- Ensure 80%+ coverage on new test files
- Check for any uncovered edge cases

---

## Testing Strategy

### Test File Structure
Each integration test follows this pattern:
```typescript
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { renderWithTheme } from '../utils/test-utils';
import { testFactories } from '../db/test-factories';

// Mock dependencies
vi.mock('next/navigation', () => ({ ... }));
vi.mock('../../app/actions/qualification-actions', () => ({ ... }));

describe('Qualified Teams - [Feature]', () => {
  const mockData = { ... };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Primary behavior', () => {
    it('should [specific behavior]', () => {
      // Setup, Render, Act, Assert
    });
  });
});
```

### Utilities to Use
- **Rendering**: `renderWithTheme()` or `renderWithProviders()`
- **Data**: `testFactories.tournament()`, `testFactories.tournamentGroup()`, `testFactories.team()`
- **Mocks**: `createMockRouter()`, `createMockSelectQuery()`, `vi.mocked()`
- **Assertions**: `toBeInTheDocument()`, `toHaveBeenCalledWith()`, `toHaveTextContent()`

### Coverage Requirements
- All 8 integration test files created
- Minimum 80% coverage on new test code
- All critical user flows tested
- All edge cases covered (errors, validation, state transitions)
- Backoffice configuration integration verified

---

## Validation Considerations

### Quality Gates
- **SonarCloud**: 0 new issues, 80%+ coverage on new code
- **Tests**: All integration tests pass locally and in CI/CD
- **Linting**: No ESLint errors or warnings
- **Build**: Project builds successfully

### Manual Testing Checklist
Not applicable - this is a testing-only story with no user-facing changes.

### Pre-Commit Validation
1. Run all new integration tests: `npm run test -- __tests__/integration/qualified-teams`
2. Run full test suite: `npm run test`
3. Run linter: `npm run lint`
4. Build project: `npm run build`

### CI/CD Validation
- GitHub Actions runs all tests
- SonarCloud analysis passes
- No new code smells or bugs introduced

---

## Open Questions

None - the scope is well-defined and follows established patterns.

---

## Benefits

1. **Confidence**: Integration tests verify complete user workflows
2. **Regression prevention**: Catch bugs that unit tests miss (multi-component interactions)
3. **Documentation**: Tests serve as examples of expected behavior
4. **Quality**: Demonstrates thorough testing practices for complex features
5. **Coverage**: Fills gaps in testing strategy (unit tests → integration tests → e2e)

---

## Risks and Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Tests too slow | CI/CD takes longer | Keep tests focused, avoid unnecessary renders |
| Flaky tests | CI/CD failures | Use proper mocks, avoid timing issues |
| Maintenance burden | Tests break often | Follow existing patterns, use stable selectors |
| Over-mocking | Tests don't catch real bugs | Mock only external dependencies, use real components |

---

## Related Documentation

- [Testing Guide](docs/claude/testing.md) - Testing patterns and utilities
- [Integration Tests](/__tests__/integration/README.md) - Existing integration test examples (if exists)
- Story #90 - Qualified teams feature implementation
- Issue #91 - Table migration cleanup (related)
