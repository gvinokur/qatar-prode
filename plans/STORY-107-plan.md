# Implementation Plan: Qualified Teams Prediction Results Breakdown (Story #107)

## Story Context

**Issue:** #107 - [STORY] Qualified Teams Prediction Results Breakdown

**Objective:** Create a user-facing UI that shows a detailed breakdown of qualified teams prediction results, allowing users to see which predictions were correct/incorrect and how many points they earned per group.

**Related Stories:**
- Story #90 - Qualified teams prediction feature
- Story #100 - Scoring system for qualified teams predictions (prerequisite - already implemented)

**Current State:**
- Users can predict which teams will qualify from each group (positions 1, 2, and optionally 3rd place)
- Scoring system is fully implemented (`qualified-teams-scoring.ts`)
- Users see total "Puntos por Clasificados" in stats dashboard
- **Missing:** Detailed breakdown showing which predictions were right/wrong

## Acceptance Criteria

- [ ] Users can view their qualified teams predictions alongside actual results
- [ ] Visual indicators clearly distinguish between:
  - ✓ Correct team + exact position (full points)
  - ~ Correct team + wrong position (partial points)
  - ✗ Wrong team (no points)
- [ ] Points earned per prediction/group are displayed clearly
- [ ] Display is responsive and works on mobile/tablet devices
- [ ] All text is internationalized (Spanish + English)
- [ ] Feature only shows when tournament results are finalized
- [ ] Tests achieve ≥80% coverage on new code
- [ ] 0 new SonarCloud issues

## Visual Prototypes

### Integration Point: Stats Page - Performance Tab

**Decision:** Add expandable section within the existing `PerformanceOverviewCard` component below the "Equipos Clasificados" summary line.

**Reasoning:**
- Keeps qualified teams in Performance tab (logical grouping)
- Uses existing card structure (minimally invasive)
- Matches boost analysis pattern (summary + detailed breakdown)
- Users see summary first, expand for details
- No new tab required (avoids cognitive load)

### Prototype 1: Collapsed State (Default)

```
┌─────────────────────────────────────────────────────────────┐
│ Equipos Clasificados                                 12 pts │
│   [▼ Ver desglose detallado]                               │
└─────────────────────────────────────────────────────────────┘
```

**Implementation:**
- Existing "Equipos Clasificados" row with points
- Add expand button/link below (IconButton with ExpandMore icon)
- Uses MUI Collapse component to toggle visibility

### Prototype 2: Expanded State - Group Breakdown

```
┌─────────────────────────────────────────────────────────────┐
│ Equipos Clasificados                                 12 pts │
│   [▲ Ocultar desglose]                                     │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ Grupo A                                        4 pts  │  │
│ ├───────────────────────────────────────────────────────┤  │
│ │ Posición 1 - Argentina                               │  │
│ │   ✓ Tu predicción: Argentina (Pos 1)      +2 pts    │  │
│ │   Estado: Correcto (equipo + posición exacta)       │  │
│ │                                                       │  │
│ │ Posición 2 - México                                  │  │
│ │   ~ Tu predicción: México (Pos 3)          +1 pt     │  │
│ │   Estado: Parcialmente correcto (posición incorrecta)│  │
│ │                                                       │  │
│ │ Posición 3 - Polonia                                 │  │
│ │   ✗ Tu predicción: Arabia Saudita         +0 pts    │  │
│ │   Estado: Incorrecto (equipo no clasificó)          │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ Grupo B                                        3 pts  │  │
│ ├───────────────────────────────────────────────────────┤  │
│ │ [... teams ...]                                       │  │
│ └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**NOTE:** Team flags (🇦🇷, 🇲🇽, etc.) are OUT OF SCOPE for this story. The database does not store country codes or flag information. This feature will display team names only.

**Visual Elements:**
- **Group sections** - MUI Paper/Box with border, stacked vertically with gap
- **Group header** - Bold group name + total points earned for group (right-aligned)
- **Team rows** - 3 rows per group (positions 1, 2, 3)
  - Actual result (position + flag + team name)
  - User's prediction with visual indicator (✓, ~, ✗)
  - Points earned for that prediction
  - Status explanation text (secondary color)

**Color Coding:**
- ✓ (Correct): `success.main` (green)
- ~ (Partial): `warning.main` (orange)
- ✗ (Wrong): `error.main` (red)
- Background tints: `alpha(color, 0.1)` for subtle emphasis

**Responsive Behavior:**
- Desktop (md+): Two-column grid (Group A | Group B, Group C | Group D, etc.)
- Mobile (xs-sm): Single column, stacked groups
- Typography scales down on smaller screens (`body2` → `caption`)

### Prototype 3: Alternative - Compact Side-by-Side Layout

```
┌───────────────────────────────────────────────────────────┐
│ Grupo A                                          4 pts    │
├─────────────────────────┬─────────────────────────────────┤
│  Tu Predicción          │   Resultado Real               │
├─────────────────────────┼─────────────────────────────────┤
│ 1. Argentina  ✓         │ 1. Argentina           +2 pts  │
│ 2. Polonia     ~        │ 2. México              +1 pt   │
│ 3. México      ✗        │ 3. Polonia             +0 pts  │
└─────────────────────────┴─────────────────────────────────┘
```

**Design Decision:** Using Prototype 2 (vertical stacked layout) as primary approach. More detailed, shows explanation text, better for mobile, consistent with existing game prediction patterns.

### Material-UI Components to Use

Based on existing patterns:
- `Box` - Layout containers with flexbox
- `Paper` or `Card` - Group sections (outlined variant)
- `Typography` - Text hierarchy (`body2`, `caption`, `subtitle2`)
- `Collapse` - Expand/collapse animation
- `Grid` - Responsive layout for groups
- `Divider` - Section separators
- `Chip` (optional) - Visual indicators as chips instead of symbols
- `alpha()` - Semi-transparent backgrounds

### Icons/Visual Indicators

**Decision:** Using Material-UI Icons for consistency with game prediction displays:
- `CheckCircleIcon` - Correct (green) - Full points for qualification + exact position
- `WarningAmberIcon` - Partial (orange) - Qualified but wrong position
- `CancelIcon` - Wrong (red) - Did not qualify or no prediction made

**Icon Size:** `fontSize="small"` for inline display with text
**Color Application:** Applied via `sx={{ color: 'success.main' }}` pattern

## Technical Approach

### 1. Data Flow

**✅ VERIFIED:** Data structure and functions exist in codebase.

**Server Component Integration (stats/page.tsx, after line 157):**
```typescript
// app/tournaments/[id]/stats/page.tsx

// EXISTING (line 157):
const groupQualifiedTeamsPoints = tournamentGuess?.qualified_teams_score ?? 0

// ADD AFTER LINE 157:
// Import at top: import { calculateQualifiedTeamsScore } from '../../../utils/qualified-teams-scoring'
const qualifiedTeamsBreakdown = user && groupQualifiedTeamsPoints > 0
  ? await calculateQualifiedTeamsScore(user.id, tournamentId)
  : null;

// Later in performanceStats object (line 168-180), add:
// ...existing props...
qualifiedTeamsBreakdown  // NEW
```

**Update PerformanceOverviewCard props (line 200+):**
```typescript
<PerformanceOverviewCard
  {...performanceStats}
  qualifiedTeamsBreakdown={qualifiedTeamsBreakdown}  // NEW
/>
```

**Existing Function (verified at app/utils/qualified-teams-scoring.ts):**
- `calculateQualifiedTeamsScore(userId, tournamentId): Promise<QualifiedTeamsScoringResult>`
- Returns exact structure needed:
  ```typescript
  {
    userId: string
    tournamentId: string
    totalScore: number
    breakdown: {
      groupId: string
      groupName: string  // e.g., "A", "B", "C"
      teams: TeamScoringResult[]  // All predicted teams with scoring results
    }[]
  }
  ```
- `TeamScoringResult` contains: `teamId`, `teamName`, `groupId`, `predictedPosition`, `actualPosition`, `predictedToQualify`, `actuallyQualified`, `pointsAwarded`, `reason`

### 2. Component Structure

**New Component: `qualified-teams-breakdown.tsx`**
- Client component (`'use client'`)
- Props: `breakdown: QualifiedTeamsScoringResult | null`
- Manages expand/collapse state with `useState`
- Renders group-by-group breakdown
- Responsive grid layout

**Modified Component: `performance-overview-card.tsx`**
- Add new prop: `qualifiedTeamsBreakdown?: QualifiedTeamsScoringResult | null`
- Pass to new `QualifiedTeamsBreakdown` component
- Render below existing "Equipos Clasificados" row

### 3. Implementation Steps

#### Phase 1: Create New Component
1. Create `app/components/tournament-stats/qualified-teams-breakdown.tsx`
2. Implement expand/collapse state management
3. Create group section rendering logic
4. Add visual indicators (icons + colors)
5. Implement responsive grid (2 columns desktop, 1 mobile)

#### Phase 2: Create Helper Components
1. Create `qualified-teams-group-section.tsx` for individual group display
2. Create `qualified-team-result-row.tsx` for team prediction result
3. Ensure proper TypeScript types for all props

#### Phase 3: Integration
1. Update `performance-overview-card.tsx` props interface
2. Add `QualifiedTeamsBreakdown` component below summary line
3. Pass breakdown data from server component
4. Handle null/undefined cases (no predictions, no results yet)

#### Phase 4: Internationalization
1. Add i18n keys to `locales/es.json` and `locales/en.json`:
   - "stats.qualifiedTeams.showBreakdown" / "Show detailed breakdown"
   - "stats.qualifiedTeams.hideBreakdown" / "Hide breakdown"
   - "stats.qualifiedTeams.group" / "Group"
   - "stats.qualifiedTeams.position" / "Position"
   - "stats.qualifiedTeams.yourPrediction" / "Your prediction"
   - "stats.qualifiedTeams.actualResult" / "Actual result"
   - "stats.qualifiedTeams.points" / "point" | "points" (singular/plural)
   - "stats.qualifiedTeams.status.correctFull" / "Correct (team + exact position)"
   - "stats.qualifiedTeams.status.correctPartial" / "Partially correct (wrong position)"
   - "stats.qualifiedTeams.status.incorrect" / "Incorrect (team did not qualify)"
   - "stats.qualifiedTeams.status.noPrediction" / "No prediction made"
   - "stats.qualifiedTeams.status.pending" / "Results pending"
   - "stats.qualifiedTeams.emptyState" / "No predictions made yet"
   - "stats.qualifiedTeams.groupTotal" / "Group total"
2. Use `useTranslations()` hook in components
3. Handle pluralization for points: `t('stats.qualifiedTeams.points', { count: pointsAwarded })`

#### Phase 5: Conditional Display Logic & Empty States
1. **Show breakdown button when:**
   - User has predictions (`breakdown !== null`)
   - At least one group has qualified teams (`breakdown.breakdown.some(g => g.teams.some(t => t.actuallyQualified))`)

2. **Empty state scenarios:**
   - **No predictions made:** Don't show breakdown section at all (breakdown === null)
   - **Predictions made but no results yet:** Show expand button, but when expanded show "Results pending" message per group
   - **Partial results:** Show groups with results, show "Results pending" for incomplete groups

3. **Conditional rendering per team:**
   - If `actualPosition === null`: Show "Results pending" instead of actual position
   - If `!predictedToQualify`: Show "No prediction made" status with gray color
   - If `actuallyQualified` but `actualPosition === null`: Show qualified but position pending

4. **Accessibility for empty states:**
   - Use `role="status"` for pending messages
   - Clear aria-labels for conditional states

### 4. Files to Create/Modify

**New Files:**
- `app/components/tournament-stats/qualified-teams-breakdown.tsx` - Main breakdown component
- `app/components/tournament-stats/qualified-teams-group-section.tsx` - Individual group display
- `app/components/tournament-stats/qualified-team-result-row.tsx` - Single team result

**Modified Files:**
- `app/components/tournament-stats/performance-overview-card.tsx` - Add breakdown integration
- `app/tournaments/[id]/stats/page.tsx` - Fetch breakdown data
- `locales/es.json` - Add Spanish translations
- `locales/en.json` - Add English translations

**Test Files to Create:**
- `__tests__/components/tournament-stats/qualified-teams-breakdown.test.tsx`
- `__tests__/components/tournament-stats/qualified-teams-group-section.test.tsx`
- `__tests__/components/tournament-stats/qualified-team-result-row.test.tsx`

### 5. Database Queries

**No new queries needed!** ✅

- Existing `calculateQualifiedTeamsScore()` function provides all data
- Already queries:
  - User predictions from `tournament_user_group_positions_predictions`
  - Qualified teams from `findQualifiedTeams()`
  - Tournament scoring config

### 6. Type Definitions

**Existing Types (in `qualified-teams-scoring.ts`):**
```typescript
interface TeamScoringResult {
  teamId: string;
  teamName: string;
  groupId: string;
  predictedPosition: number;
  actualPosition: number | null;
  predictedToQualify: boolean;
  actuallyQualified: boolean;
  pointsAwarded: number;
  reason: string;
}

interface QualifiedTeamsScoringResult {
  userId: string;
  tournamentId: string;
  totalScore: number;
  breakdown: {
    groupId: string;
    groupName: string;
    teams: TeamScoringResult[];
  }[];
}
```

**New Props Interfaces:**
```typescript
interface QualifiedTeamsBreakdownProps {
  breakdown: QualifiedTeamsScoringResult | null;
}

interface QualifiedTeamsGroupSectionProps {
  groupName: string;
  groupScore: number;
  teams: TeamScoringResult[];
}

interface QualifiedTeamResultRowProps {
  team: TeamScoringResult;
  position: number;
}
```

## Testing Strategy

### Unit Tests

**Component Tests (Vitest + React Testing Library):**

1. **`qualified-teams-breakdown.test.tsx`:**
   - Renders expand button when collapsed
   - Expands/collapses on button click
   - Shows all groups in breakdown
   - **Handles null breakdown (no predictions)** - Component doesn't render
   - **Handles empty breakdown array** - Shows empty state message
   - **Handles partial results** - Shows "Results pending" for groups without qualified teams
   - **Handles progressive results** - Shows actual results for complete groups, pending for incomplete
   - Responsive layout (mobile vs desktop) - Grid changes from 2 columns to 1 on mobile
   - Uses i18n translations correctly - All text uses translation keys
   - **Accessibility:** ARIA labels on expand button, role="region" on breakdown section

2. **`qualified-teams-group-section.test.tsx`:**
   - Renders group name and total score
   - Shows all team results
   - Applies correct styling for group container

3. **`qualified-team-result-row.test.tsx`:**
   - Shows correct visual indicator (✓, ~, ✗) based on result
   - Displays points earned with correct pluralization (1 pt vs 2 pts)
   - Shows status explanation with i18n
   - Applies correct color coding (green/orange/red)
   - **Handles edge cases:**
     - `actualPosition === null` → Shows "Results pending"
     - `!predictedToQualify` → Shows "No prediction made" with gray color
     - `predictedToQualify && !actuallyQualified` → Shows wrong prediction icon
     - `actuallyQualified && actualPosition === null` → Shows qualified but position pending
   - **Accessibility:** Screen reader text for icons (aria-label or visually-hidden text)

**Integration Tests:**

4. **`performance-overview-card.test.tsx` (update existing):**
   - Passes breakdown prop to QualifiedTeamsBreakdown
   - Shows breakdown component when prop provided
   - Hides breakdown when prop is null

5. **Stats page integration test:**
   - Server component fetches breakdown data
   - Data flows to PerformanceOverviewCard
   - Breakdown renders correctly with real data structure

### Test Data Factories

**Use existing:**
- `testFactories.createMockTournament()`
- `testFactories.createMockUser()`
- `testFactories.createMockTeam()`

**Create new:**
```typescript
// __tests__/db/test-factories.ts
createMockQualifiedTeamsBreakdown(overrides?: Partial<QualifiedTeamsScoringResult>): QualifiedTeamsScoringResult

createMockTeamScoringResult(overrides?: Partial<TeamScoringResult>): TeamScoringResult
```

### Test Utilities

**✅ VERIFIED:** Test utilities exist in codebase.

**Use mandatory utilities:**
- `renderWithTheme()` from `@/__tests__/utils/test-utils` (verified at `__tests__/utils/test-utils.tsx`)
- `renderWithProviders()` for context wrappers (verified)
- Mock i18n with `next-intl/navigation` mocks
- `testFactories` for creating mock data (verified)

### Integration Test Details

**Stats page integration test (`__tests__/app/tournaments/[id]/stats/page.test.tsx`):**
```typescript
// Mock setup
const mockBreakdown: QualifiedTeamsScoringResult = {
  userId: 'user-1',
  tournamentId: 'tournament-1',
  totalScore: 12,
  breakdown: [
    {
      groupId: 'group-a',
      groupName: 'A',
      teams: [
        testFactories.createMockTeamScoringResult({
          teamName: 'Argentina',
          predictedPosition: 1,
          actualPosition: 1,
          pointsAwarded: 2,
          reason: 'qualified + exact position'
        }),
        // ... more teams
      ]
    },
    // ... more groups
  ]
}

// Test cases:
1. Fetches breakdown when user has predictions
2. Passes breakdown to PerformanceOverviewCard
3. Breakdown renders correctly with mock data
4. Handles null breakdown (no predictions)
5. Handles server error gracefully (try-catch on calculateQualifiedTeamsScore)
```

### Coverage Goals

- ≥80% on all new files
- **Branch coverage for all conditional scenarios:**
  - breakdown === null
  - breakdown.breakdown.length === 0
  - actualPosition === null (results pending)
  - predictedToQualify === false (no prediction)
  - actuallyQualified with different position combinations
  - Responsive breakpoint changes (desktop vs mobile grid)
- All user interaction flows (expand/collapse, responsive behavior)
- All i18n string paths (both Spanish and English)

## Accessibility Requirements

### WCAG 2.1 AA Compliance

**1. Keyboard Navigation:**
- Expand/collapse button must be keyboard accessible (native `<button>` or `IconButton`)
- Tab order: Expand button → (when expanded) group sections in logical order
- Enter/Space keys trigger expand/collapse
- Focus visible indicator on all interactive elements

**2. Screen Reader Support:**
- **Expand button:** `aria-label="Show detailed qualified teams breakdown"` / `"Hide qualified teams breakdown"`
- **Expand button state:** `aria-expanded={isExpanded}` attribute
- **Breakdown section:** `role="region"` with `aria-labelledby` pointing to "Equipos Clasificados" heading
- **Visual indicator icons:**
  - Either: `aria-label` on icon (e.g., "Correct prediction")
  - Or: Visually hidden text: `<span className="sr-only">Correct prediction</span>`
- **Pending states:** `role="status"` for "Results pending" messages

**3. Color Contrast:**
- Verify color contrast ratios meet WCAG AA (4.5:1 for normal text, 3:1 for large text):
  - `success.main` (green) on white background
  - `warning.main` (orange) on white background
  - `error.main` (red) on white background
  - `text.secondary` for explanatory text
- Use Material-UI theme colors (already meet WCAG standards)

**4. Focus Management:**
- When expanding, focus remains on expand button (don't auto-focus into content)
- When collapsing, focus returns to expand button
- No keyboard traps

**5. Text Alternatives:**
- All visual indicators (icons) have text equivalents
- Points always displayed as text, not just color
- Status always includes text explanation, not just color/icon

**6. Responsive Text Sizing:**
- Typography scales properly with browser zoom (use rem/em units)
- No text truncation that loses meaning
- Mobile typography remains readable (minimum 14px / 0.875rem)

### Testing Accessibility

**Automated tests:**
- `axe-core` or `jest-axe` for automated a11y testing
- Test each component state for violations

**Manual tests:**
- Keyboard-only navigation through all states
- Screen reader testing (VoiceOver on Mac, NVDA on Windows)
- Color contrast verification with browser DevTools

## Validation Considerations

### SonarCloud Requirements

**To meet quality gates:**

1. **Code Coverage:** ≥80% on new code
   - Comprehensive component tests
   - Integration tests for data flow
   - Edge case handling

2. **Code Duplication:** <5%
   - Extract shared logic into helper functions
   - Reuse existing color/styling utilities
   - Use composition for team result rows

3. **Complexity:** Keep functions simple
   - Single responsibility per component
   - Extract visual indicator logic into utility function
   - Separate data transformation from rendering

4. **Security:** No vulnerabilities
   - Sanitize team names if rendering HTML (use `Typography` component)
   - No eval() or dangerous patterns
   - Validate data structure before rendering

5. **Maintainability:** B or higher
   - Clear component naming
   - Props interfaces with JSDoc comments
   - Consistent with existing codebase patterns

### Pre-Commit Checks

**Before committing (MANDATORY):**
1. Run tests: `npm test`
2. Run linter: `npm run lint`
3. Run build: `npm run build`
4. All must pass ✅

### Vercel Preview Testing

**After commit/push:**
1. User tests in Vercel Preview (default workflow)
2. Verify responsive behavior on mobile/tablet
3. Check i18n in both Spanish and English
4. Test expand/collapse interactions
5. Validate visual indicators and colors

## Design Decisions (Finalized)

### 1. Layout: Vertical Stacked (Prototype 2) ✅
**Rationale:** More detailed, shows explanation text, better for mobile, consistent with existing patterns

### 2. Visual Indicators: MUI Icons ✅
**Rationale:** Consistent with game prediction displays, better accessibility with aria-labels
- `CheckCircleIcon` (green) for correct
- `WarningAmberIcon` (orange) for partial
- `CancelIcon` (red) for incorrect

### 3. Display Timing: Progressive ✅
**Rationale:** Matches existing qualified teams scoring behavior from `calculateQualifiedTeamsScore()`
- Show results for complete groups immediately
- Show "Results pending" for incomplete groups
- Update progressively as more groups complete

### 4. Default State: Collapsed ✅
**Rationale:** Keeps stats page scannable, follows boost analysis pattern, user opts in to details

### 5. Team Flags: OUT OF SCOPE ✅
**Rationale:** Database does not store country codes or flag emoji data. Show team names only.

## Open Questions for User

### Question 1: Performance Considerations
**Context:** Large tournaments could have 8+ groups × 3 teams = 24+ prediction rows

**Options:**
- **Option A:** Render all groups at once (simpler implementation)
- **Option B:** Add virtualization for very long lists (more complex, better performance)

**Recommendation:** Option A for this story. Performance optimization can be added later if needed.

### Question 2: Mobile Breakpoint for Grid
**Context:** Responsive layout switches from 2-column to 1-column

**Options:**
- **Option A:** Switch at `md` breakpoint (960px) - More conservative
- **Option B:** Switch at `sm` breakpoint (600px) - Shows 2 columns on tablets

**Recommendation:** Option A (`md` breakpoint) to ensure readability on tablets.

## Risk Assessment

### Low Risk ✅
- ✅ **No database changes needed** - Uses existing `calculateQualifiedTeamsScore()` function
- ✅ **Scoring logic already implemented and tested** - Verified in `app/utils/qualified-teams-scoring.ts`
- ✅ **Similar patterns exist in codebase** - Boost breakdown in BoostAnalysisCard, game predictions in GameCard
- ✅ **Pure presentation layer** - No mutations, only display
- ✅ **Test utilities verified** - `renderWithTheme()`, `renderWithProviders()`, `testFactories` all exist
- ✅ **Clear data structure** - `QualifiedTeamsScoringResult` interface well-defined
- ✅ **Integration point verified** - Stats page structure confirmed (line 157 for data fetch)

### Medium Risk ⚠️
- ⚠️ **Responsive behavior** - Need thorough mobile/tablet testing in Vercel Preview
- ⚠️ **i18n completeness** - 15+ translation keys, need complete coverage
- ⚠️ **Accessibility** - Multiple WCAG requirements, need manual testing
- ⚠️ **Edge cases** - Many conditional states (no predictions, partial results, pending)

### Mitigation Strategies
1. ✅ Visual prototypes finalized - Using Prototype 2 (vertical stacked)
2. Test responsive behavior on multiple screen sizes in Vercel Preview (mobile, tablet, desktop)
3. Complete i18n key list documented (15 keys for Spanish + English)
4. Accessibility requirements clearly defined with test cases
5. Comprehensive edge case testing (null breakdown, empty results, pending states)
6. Use existing MUI theme colors (already WCAG compliant)

## Implementation Timeline Estimate

**Note:** No time estimates provided per project guidelines. Work will be broken into atomic tasks with dependencies.

**Task Complexity:**
- Component creation: Moderate (following existing patterns)
- Integration: Simple (props passing, no architecture changes)
- Testing: Moderate (multiple components, responsive testing)
- i18n: Simple (following established patterns)

## Success Metrics

**Definition of Done:**
- [ ] User can expand/collapse breakdown in stats page
- [ ] Visual indicators clearly show correct/partial/incorrect predictions
- [ ] Points per team and per group displayed accurately
- [ ] Responsive on mobile/tablet/desktop
- [ ] All text internationalized (ES + EN)
- [ ] Tests pass with ≥80% coverage
- [ ] 0 new SonarCloud issues
- [ ] Linter passes
- [ ] Build succeeds
- [ ] User approval in Vercel Preview

## Related Documentation

- **Architecture:** Server Components pass data to Client Components (no repository imports in client)
- **Testing:** [testing.md](../docs/claude/testing.md) - Use mandatory test utilities
- **Validation:** [validation.md](../docs/claude/validation.md) - SonarCloud quality gates
- **Implementation:** [implementation.md](../docs/claude/implementation.md) - Task definition and execution workflow

## Next Steps

After plan approval:
1. Read [implementation.md](../docs/claude/implementation.md) completely
2. Define tasks with TaskCreate (atomic, with dependencies)
3. Implement components following approved design
4. Create tests in parallel
5. Run validation checks (test, lint, build)
6. Commit and deploy to Vercel Preview
7. User testing and feedback
8. Final SonarCloud validation
9. Ready to merge
