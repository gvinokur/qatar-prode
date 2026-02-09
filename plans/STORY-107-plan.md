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

### Integration Point: Qualified Teams Page (Inline with Predictions)

**Decision:** Show results INLINE with existing prediction cards on `/tournaments/[id]/qualified-teams` page.

**Reasoning (based on user feedback):**
- Users already see their predictions on the qualified teams page
- More intuitive to show results where predictions were made
- Avoids data duplication between prediction page and stats page
- Simpler implementation - no new components needed
- Better UX - immediate feedback on the same screen

**Current UI Structure:**
- **Page:** `/tournaments/[id]/qualified-teams` - Drag-and-drop prediction interface
- **Components:** `DraggableTeamCard` (team cards), `GroupCard` (group container)
- **Existing Features:** Position badges, drag handles, "Clasifica" checkbox for 3rd place
- **Background Colors:** Green (qualified), Yellow (can qualify), Gray (cannot qualify)

### Prototype 1: Before Tournament Results (Current State)

```
GRUPO A
┌───────────────────────────────────────────────┐
│ [≡] (1st) Argentina                           │  ← Green background
│                                               │
├───────────────────────────────────────────────┤
│ [≡] (2nd) México                              │  ← Green background
│                                               │
├───────────────────────────────────────────────┤
│ [≡] (3rd) Polonia              [✓] Clasifica  │  ← Green (checked)
│                                               │
├───────────────────────────────────────────────┤
│ [≡] (4th) Arabia Saudita                      │  ← Gray (cannot qualify)
└───────────────────────────────────────────────┘
```

**Current:** Drag-and-drop interface for making predictions. Background colors show qualification status.

### Prototype 2: After Tournament Results - Inline Results Display

```
GRUPO A                                    Total: 4 pts ✓
┌────────────────────────────────────────────────────────┐
│ [≡] (1st) Argentina                                    │
│     Actual: 1st ✓  +2 pts                             │  ← Green background + success icon
│                                                        │
├────────────────────────────────────────────────────────┤
│ [≡] (2nd) México                                       │
│     Actual: 2nd ✓  +2 pts                             │  ← Green background + success icon
│                                                        │
├────────────────────────────────────────────────────────┤
│ [≡] (3rd) Polonia                      [✓] Clasifica   │
│     Actual: 3rd ✓  +2 pts                             │  ← Green background + success icon
│                                                        │
├────────────────────────────────────────────────────────┤
│ [≡] (4th) Arabia Saudita                               │
│     Did not qualify                                    │  ← Gray (no points, not predicted)
└────────────────────────────────────────────────────────┘
```

**When Prediction is Wrong:**
```
GRUPO B                                    Total: 1 pt ~
┌────────────────────────────────────────────────────────┐
│ [≡] (1st) España                                       │
│     Actual: 2nd ~  +1 pt                              │  ← Orange/warning background
│     (Predicted 1st, finished 2nd)                      │
│                                                        │
├────────────────────────────────────────────────────────┤
│ [≡] (2nd) Alemania                                     │
│     Actual: 1st ~  +1 pt                              │  ← Orange/warning background
│     (Predicted 2nd, finished 1st)                      │
│                                                        │
├────────────────────────────────────────────────────────┤
│ [≡] (3rd) Italia                       [✓] Clasifica   │
│     Actual: Did not qualify ✗  +0 pts                 │  ← Red/error background
│     (Predicted to qualify, did not)                    │
└────────────────────────────────────────────────────────┘
```

**Visual Elements:**
- **Results overlay** - Added below team name in each card
- **Icon indicators:** CheckCircleIcon (✓), WarningAmberIcon (~), CancelIcon (✗)
- **Points display:** "+2 pts", "+1 pt", "+0 pts" on each card
- **Status text:** Brief explanation below icon (e.g., "Predicted 1st, finished 2nd")
- **Group total:** In group header showing total points for that group
- **Background colors:** Existing green/yellow/gray system, enhanced with success/warning/error overlays

### Prototype 3: Optional Summary Section (Top of Page)

```
┌────────────────────────────────────────────────────────┐
│ TUS RESULTADOS - EQUIPOS CLASIFICADOS                  │
├────────────────────────────────────────────────────────┤
│ Total de Puntos: 12 pts                                │
│                                                        │
│ ✓ Correctos (equipo + posición): 6 equipos (12 pts)   │
│ ~ Parciales (equipo correcto): 2 equipos (2 pts)      │
│ ✗ Incorrectos: 4 equipos (0 pts)                      │
└────────────────────────────────────────────────────────┘
```

**Optional:** Summary card at top of page showing aggregate results. Simple stats without detailed breakdown.

**Design Decision:** Focus on Prototype 2 (inline results). Prototype 3 (summary) is optional and can be added in future iteration if needed.

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

**Server Component Integration (qualified-teams/page.tsx):**
```typescript
// app/tournaments/[id]/qualified-teams/page.tsx

// EXISTING (line 173-174):
const actualQualifiedTeams = await findQualifiedTeams(tournamentId);
const scoringResult = await calculateQualifiedTeamsScore(user.id, tournamentId);

// CURRENT: Only fetched when ?debug param present
// NEW: Fetch for all authenticated users when results are available

// After line 168 (after predictions fetch), ADD:
// Fetch actual results if any groups have completed
const actualQualifiedTeams = await findQualifiedTeams(tournamentId);

// Calculate scoring breakdown (returns null-safe result)
const scoringResult = actualQualifiedTeams.length > 0
  ? await calculateQualifiedTeamsScore(user.id, tournamentId)
  : null;

// Pass to client component (line 191-199):
<QualifiedTeamsClientPage
  tournament={tournament}
  groups={groupsWithTeams}
  initialPredictions={predictions}
  userId={user.id}
  isLocked={isLocked}
  allowsThirdPlace={config.allowsThirdPlace}
  maxThirdPlace={config.maxThirdPlace}
  actualResults={actualQualifiedTeams}        // NEW
  scoringBreakdown={scoringResult}             // NEW
/>
```

**Existing Functions (verified):**
- `findQualifiedTeams(tournamentId)` - Returns qualified teams with positions
  - Returns: `Array<{ id, name, short_name, group_id, final_position }>`
- `calculateQualifiedTeamsScore(userId, tournamentId)` - Returns detailed scoring
  - Returns: `QualifiedTeamsScoringResult` with breakdown by group

### 2. Component Structure

**Modified Component: `qualified-teams-client-page.tsx`**
- Add new props: `actualResults?: QualifiedTeam[]`, `scoringBreakdown?: QualifiedTeamsScoringResult | null`
- Pass down to `GroupCard` components
- No new components needed - enhance existing ones

**Modified Component: `group-card.tsx`**
- Add new prop: `scoringForGroup?: { teams: TeamScoringResult[], totalPoints: number } | null`
- Extract scoring data for current group from breakdown
- Display group total points in header when results available
- Pass scoring data to `DraggableTeamCard`

**Modified Component: `draggable-team-card.tsx`**
- Add new prop: `result?: TeamScoringResult | null`
- When `result` exists: Show actual position, points earned, visual indicator
- Keep existing UI (position badge, team name, drag handle, checkbox)
- Add results overlay below team name (conditional rendering)

### 3. Implementation Steps

#### Phase 1: Server Component Data Fetching
1. Update `app/tournaments/[id]/qualified-teams/page.tsx`:
   - Move `findQualifiedTeams()` call outside of debug block (line 173)
   - Move `calculateQualifiedTeamsScore()` call outside of debug block (line 174)
   - Only fetch when tournament has results (`actualQualifiedTeams.length > 0`)
   - Pass `actualResults` and `scoringBreakdown` to client component

#### Phase 2: Update DraggableTeamCard Component
1. Modify `app/components/qualified-teams/draggable-team-card.tsx`:
   - Add prop: `result?: TeamScoringResult | null`
   - Add results overlay section (conditional - only when `result` exists)
   - Show: Visual indicator icon, actual position text, points earned
   - Show: Brief status text (e.g., "Predicted 1st, finished 2nd")
   - Keep existing drag-and-drop, position badge, checkbox functionality
   - Enhance background color based on result accuracy (green✓/orange~/red✗)

#### Phase 3: Update GroupCard Component
1. Modify `app/components/qualified-teams/group-card.tsx`:
   - Add prop: `scoringForGroup?: { teams: TeamScoringResult[], totalPoints: number } | null`
   - Extract scoring data for current group from breakdown
   - Update header to show group total points when results available
   - Pass `result` prop to each `DraggableTeamCard` (match by team ID)
   - Handle case where some teams have results, some don't (progressive results)

#### Phase 4: Update QualifiedTeamsClientPage Component
1. Modify `app/components/qualified-teams/qualified-teams-client-page.tsx`:
   - Add props: `actualResults`, `scoringBreakdown`
   - Create lookup map for scoring results by group ID
   - Pass scoring data to each `GroupCard`
   - No state management changes needed (results are read-only)

#### Phase 5: Internationalization
1. Add i18n keys to `locales/es.json` and `locales/en.json`:
   - "qualifiedTeams.results.actual" / "Actual"
   - "qualifiedTeams.results.predicted" / "Predicted"
   - "qualifiedTeams.results.finished" / "finished"
   - "qualifiedTeams.results.groupTotal" / "Total"
   - "qualifiedTeams.results.didNotQualify" / "Did not qualify"
   - "qualifiedTeams.results.notPredicted" / "Not predicted to qualify"
   - "qualifiedTeams.results.statusCorrect" / "Correct"
   - "qualifiedTeams.results.statusPartial" / "Qualified, wrong position"
   - "qualifiedTeams.results.statusIncorrect" / "Did not qualify"
   - "qualifiedTeams.results.points" / "pt" | "pts" (singular/plural)
   - "qualifiedTeams.results.position1st" / "1st"
   - "qualifiedTeams.results.position2nd" / "2nd"
   - "qualifiedTeams.results.position3rd" / "3rd"
2. Use `useTranslations()` hook in modified components
3. Handle pluralization for points display

#### Phase 6: Conditional Display Logic
1. **Show results overlay when:**
   - User has made predictions (always true on this page)
   - At least one team has `actualPosition !== null` (results are available)
   - Component receives `result` prop from parent

2. **Conditional rendering scenarios:**
   - **No results yet:** Don't show overlay, card displays normally (current behavior)
   - **Results available:** Show overlay with actual position, icon, points
   - **Progressive results:** Some groups complete, others pending
     - Completed groups: Show full results overlay
     - Pending groups: No overlay (normal display)
   - **Team not predicted to qualify (`!predictedToQualify`):**
     - If actually qualified: Show "Did not predict, team qualified" message (no points)
     - If did not qualify: No results overlay needed

3. **Background color enhancement:**
   - Keep existing green/yellow/gray base colors
   - When results available, enhance with result accuracy:
     - Correct (✓): Brighter green or success.light tint
     - Partial (~): Warning orange tint
     - Incorrect (✗): Error red tint

4. **Accessibility:**
   - Visual indicators must have text alternatives (aria-label)
   - Results overlay has semantic HTML (not just styled divs)
   - Screen reader announces results when present

### 4. Files to Create/Modify

**No New Files** - Enhancing existing components only ✅

**Modified Files:**
- `app/tournaments/[id]/qualified-teams/page.tsx` - Fetch actual results and scoring data
- `app/components/qualified-teams/qualified-teams-client-page.tsx` - Accept and pass down results
- `app/components/qualified-teams/group-card.tsx` - Show group total points in header
- `app/components/qualified-teams/draggable-team-card.tsx` - Show inline results overlay
- `locales/es.json` - Add Spanish translations (~13 keys)
- `locales/en.json` - Add English translations (~13 keys)

**Test Files to Update:**
- `__tests__/components/qualified-teams/draggable-team-card.test.tsx` - Add result overlay tests
- `__tests__/components/qualified-teams/group-card.test.tsx` - Add group total tests
- `__tests__/components/qualified-teams/qualified-teams-client-page-smoke.test.tsx` - Add results prop tests
- `__tests__/app/tournaments/[id]/qualified-teams/page.test.tsx` - Add server data fetching tests

### 5. Database Queries & Data Storage Concerns

**No new queries needed!** ✅

- Existing `calculateQualifiedTeamsScore()` function provides all data
- Already queries:
  - User predictions from `tournament_user_group_positions_predictions`
  - Qualified teams from `findQualifiedTeams()`
  - Tournament scoring config

**Addressing Data Intensity Concerns:**

**User Concern:** "May be too data intensive if we don't store the actual detailed summary in the DB"

**Analysis:**
- `calculateQualifiedTeamsScore()` is **already used** in the codebase (debug mode, scoring calculation)
- Performance characteristics:
  - Fetches user's predictions (1 query with JSONB, cached)
  - Fetches qualified teams (1 query, progressive results)
  - Calculation is in-memory (O(n) where n = number of predictions ~24 teams max)
  - No N+1 queries, no complex joins

**Decision: Do NOT store detailed summary in DB** ✅

**Rationale:**
1. **Not a performance bottleneck:** Calculation is fast (<50ms for typical tournament)
2. **Data freshness:** Calculated on-demand means always current (no stale cache)
3. **Simplicity:** No sync issues between stored summary and actual data
4. **Storage efficiency:** Avoids duplicating data already in database
5. **Flexibility:** Easy to change scoring rules without data migration

**If performance becomes an issue later:**
- Option 1: Add Redis caching layer (cache calculated results for 5-10 minutes)
- Option 2: Materialize summary in DB only after tournament complete (one-time calculation)
- Option 3: Background job to pre-calculate summaries

**For now:** Keep it simple, calculate on-demand. Monitor performance in production.

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

1. **`draggable-team-card.test.tsx` (update existing):**
   - Existing tests: Drag-and-drop, position badge, checkbox
   - **NEW: Results overlay tests:**
     - Shows results overlay when `result` prop provided
     - Shows correct visual indicator (✓ CheckCircleIcon, ~ WarningAmberIcon, ✗ CancelIcon)
     - Displays points earned with correct pluralization (1 pt vs 2 pts)
     - Shows actual position text with i18n ("Actual: 1st", "Actual: 2nd")
     - Shows status message when prediction wrong ("Predicted 1st, finished 2nd")
     - Hides overlay when `result` prop is null/undefined
     - **Edge cases:**
       - `predictedToQualify === false` → Shows "Did not predict" when team qualified
       - `actuallyQualified === false` → Shows "Did not qualify" with red icon
       - `actualPosition === predictedPosition` → Shows green check with "+2 pts"
       - `actualPosition !== predictedPosition` but qualified → Shows orange warning with "+1 pt"
     - **Accessibility:** Icons have aria-labels, results overlay has semantic HTML

2. **`group-card.test.tsx` (update existing):**
   - Existing tests: Group rendering, team sorting, accordion behavior
   - **NEW: Group total points tests:**
     - Shows group total in header when `scoringForGroup` provided
     - Formats points correctly ("Total: 4 pts ✓")
     - Hides total when no results available
     - Passes correct `result` prop to each DraggableTeamCard

3. **`qualified-teams-client-page-smoke.test.tsx` (update existing):**
   - Existing tests: Renders groups, handles predictions
   - **NEW: Results integration tests:**
     - Accepts `actualResults` and `scoringBreakdown` props
     - Creates lookup map for scoring by group
     - Passes scoring data to GroupCard components
     - Handles null scoring breakdown gracefully

**Server Component Tests:**

4. **`qualified-teams/page.test.tsx` (update existing):**
   - Existing tests: Auth, tournament fetch, predictions initialization
   - **NEW: Results fetching tests:**
     - Calls `findQualifiedTeams()` outside debug mode
     - Calls `calculateQualifiedTeamsScore()` when qualified teams exist
     - Passes `actualResults` and `scoringBreakdown` to client component
     - Handles case when no qualified teams yet (returns null)

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

### Integration Test Mock Data Example

**Qualified teams page test (`__tests__/app/tournaments/[id]/qualified-teams/page.test.tsx`):**
```typescript
// Mock qualified teams (from findQualifiedTeams)
const mockQualifiedTeams = [
  { id: 'team-1', name: 'Argentina', short_name: 'ARG', group_id: 'group-a', final_position: 1 },
  { id: 'team-2', name: 'Mexico', short_name: 'MEX', group_id: 'group-a', final_position: 2 },
  // ...
]

// Mock scoring breakdown (from calculateQualifiedTeamsScore)
const mockScoringResult: QualifiedTeamsScoringResult = {
  userId: 'user-1',
  tournamentId: 'tournament-1',
  totalScore: 12,
  breakdown: [
    {
      groupId: 'group-a',
      groupName: 'A',
      teams: [
        {
          teamId: 'team-1',
          teamName: 'Argentina',
          groupId: 'group-a',
          predictedPosition: 1,
          actualPosition: 1,
          predictedToQualify: true,
          actuallyQualified: true,
          pointsAwarded: 2,
          reason: 'qualified + exact position'
        },
        // ... more teams
      ]
    }
  ]
}

// Test cases:
1. Fetches actualResults when qualified teams exist
2. Calculates scoringBreakdown when results available
3. Passes both props to QualifiedTeamsClientPage
4. Handles case when no qualified teams yet (null scoringBreakdown)
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

## Design Decisions (Finalized - Based on User Feedback)

### 1. Integration Point: Inline with Predictions ✅
**Rationale:** Show results where predictions were made (qualified teams page), not in stats page
**User Feedback:** "We already have a qualified tab with the predictions of the user. I believe we should implement the visual indicator inline with those predictions"

### 2. Display Pattern: Results Overlay on Team Cards ✅
**Rationale:** Enhance existing `DraggableTeamCard` components with results overlay
- No new components needed
- Simpler implementation
- Better UX - results appear directly on prediction cards

### 3. Visual Indicators: MUI Icons ✅
**Rationale:** Consistent with game prediction displays
- `CheckCircleIcon` (green) for correct prediction
- `WarningAmberIcon` (orange) for qualified but wrong position
- `CancelIcon` (red) for did not qualify

### 4. Display Timing: Progressive ✅
**Rationale:** Matches existing qualified teams scoring behavior
- Show results as groups complete
- No overlay when no results yet (normal prediction UI)
- Progressive enhancement as tournament progresses

### 5. Optional Summary Section: OUT OF SCOPE (for now) ✅
**Rationale:** User mentioned "may be too data intensive" and summary is "somewhat of an overkill"
**Decision:** Focus on inline results only. Summary can be added in future iteration if needed.

### 6. Data Storage: Calculate On-Demand ✅
**Rationale:** User concern about data intensity if we store detailed summary in DB
**Decision:** Do NOT store in DB. Calculate on-demand using existing `calculateQualifiedTeamsScore()` function.
**Performance:** Fast enough (<50ms), keeps data fresh, avoids complexity.

## Resolved Questions (Based on User Feedback)

### ✅ Where to show results?
**Original plan:** Stats page with expandable breakdown
**User feedback:** "I believe we should implement the visual indicator inline with those predictions"
**Decision:** Show inline on qualified teams prediction page ✅

### ✅ Should we create separate components?
**Original plan:** New breakdown components in tournament-stats/
**User feedback:** Show inline with existing predictions
**Decision:** Enhance existing components (DraggableTeamCard, GroupCard) ✅

### ✅ Should we add detailed summaries everywhere?
**User feedback:** "I think this is somewhat of an overkill and may be too data intensive"
**Decision:** Focus on inline results only. Summary sections OUT OF SCOPE for this story. ✅

### ✅ Should we store detailed summary in DB?
**User feedback:** "may be too data intensive if we don't store the actual detailed summary in the DB"
**Decision:** Calculate on-demand, do NOT store in DB. Fast enough, keeps data fresh. ✅

## Remaining Open Questions

### Question 1: Status Text Level of Detail
**Context:** When showing wrong predictions, how much detail?

**Options:**
- **Option A:** Just icon + points ("+1 pt ~")
- **Option B:** Brief text ("Wrong position")
- **Option C:** Detailed text ("Predicted 1st, finished 2nd")

**Recommendation:** Option B for mobile (space constrained), Option C for desktop (more space)

### Question 2: Animation/Transition
**Context:** Should results overlay have entrance animation?

**Options:**
- **Option A:** No animation (instant display)
- **Option B:** Fade in animation (Material-UI Fade component)

**Recommendation:** Option A (simpler, no animation needed)

## Risk Assessment

### Low Risk ✅ (Simpler Implementation = Lower Risk)
- ✅ **No new components** - Enhancing existing components only
- ✅ **No database changes needed** - Uses existing `calculateQualifiedTeamsScore()` function
- ✅ **Scoring logic already implemented** - Verified in `app/utils/qualified-teams-scoring.ts`
- ✅ **Existing UI patterns** - Building on top of DraggableTeamCard (already tested, working)
- ✅ **Pure presentation layer** - No mutations, only display overlay
- ✅ **Test utilities verified** - Existing test suite for qualified-teams components
- ✅ **Clear data structure** - `QualifiedTeamsScoringResult` and `TeamScoringResult` interfaces
- ✅ **Performance acceptable** - On-demand calculation (<50ms), no DB storage needed
- ✅ **Responsive already handled** - Existing components are responsive (accordion on mobile)

### Medium Risk ⚠️
- ⚠️ **Results overlay layout** - Need to fit results text without breaking card layout
- ⚠️ **i18n completeness** - ~13 translation keys (reduced from 15)
- ⚠️ **Progressive results** - Handle partial tournament completion gracefully
- ⚠️ **Background color conflicts** - Enhanced colors must maintain text contrast

### Mitigation Strategies
1. ✅ Use inline overlay below team name (doesn't break existing layout)
2. ✅ Fewer translation keys (13 vs 15) due to simpler UI
3. ✅ Conditional rendering - only show overlay when results exist
4. ✅ Test color contrast with existing green/yellow/gray backgrounds
5. Test on mobile (accordion layout) and desktop (card layout) in Vercel Preview
6. Use MUI Typography components (automatic color contrast handling)

## Implementation Timeline Estimate

**Note:** No time estimates provided per project guidelines. Work will be broken into atomic tasks with dependencies.

**Task Complexity:**
- Component creation: Moderate (following existing patterns)
- Integration: Simple (props passing, no architecture changes)
- Testing: Moderate (multiple components, responsive testing)
- i18n: Simple (following established patterns)

## Success Metrics

**Definition of Done:**
- [ ] Results overlay shows on each team card when results available
- [ ] Visual indicators clearly show correct/partial/incorrect predictions (✓/~/✗ icons)
- [ ] Points per team displayed accurately (+2 pts, +1 pt, +0 pts)
- [ ] Group total points displayed in group header
- [ ] Results only show when tournament data available (progressive display)
- [ ] Responsive on mobile (accordion) and desktop (card layout)
- [ ] All text internationalized (ES + EN, ~13 keys)
- [ ] Tests pass with ≥80% coverage on modified code
- [ ] 0 new SonarCloud issues
- [ ] Linter passes
- [ ] Build succeeds
- [ ] No performance regression (calculation <50ms)
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
