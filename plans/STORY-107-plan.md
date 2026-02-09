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

- [ ] Users can view their qualified teams predictions alongside actual results **inline on prediction page**
- [ ] Visual indicators clearly distinguish between:
  - ⭐ Correct team + exact position (full points) - **Gold/yellow color** (User Feedback #1)
  - ✓ Correct team + wrong position (partial points) - **Lighter green color** (User Feedback #1)
  - ✗ Wrong team (no points) - Red color
  - ⏳ Pending 3rd place qualification - **Blue hourglass** (User Feedback #4)
- [ ] Points displayed in **Chip component** like game cards (User Feedback #2)
- [ ] Results show **progressively as groups complete** (User Feedback #3)
- [ ] Pending 3rd place state works correctly (User Feedback #4):
  - [ ] When group complete but best 3rds not determined
  - [ ] Shows hourglass icon and "Pendiente" chip
  - [ ] Updates when best 3rds finalized
- [ ] Group total points displayed in header
- [ ] Display is responsive and works on mobile/tablet devices
- [ ] All text in **Spanish only** (no i18n yet) (User Feedback #5)
- [ ] Tests achieve ≥80% coverage on modified code
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

**When Prediction is Partial/Wrong:**
```
GRUPO B                                    Total: 2 pts
┌────────────────────────────────────────────────────────┐
│ [≡] (1st) España                                       │
│     Actual: 2nd ✓  [+1 pt]                            │  ← Lighter green, chip for points
│     (Predicted 1st, finished 2nd)                      │
│                                                        │
├────────────────────────────────────────────────────────┤
│ [≡] (2nd) Alemania                                     │
│     Actual: 1st ✓  [+1 pt]                            │  ← Lighter green, chip for points
│     (Predicted 2nd, finished 1st)                      │
│                                                        │
├────────────────────────────────────────────────────────┤
│ [≡] (3rd) Italia                       [✓] Clasifica   │
│     Actual: Did not qualify ✗  [+0 pts]               │  ← Red/error, chip shows 0 pts
│     (Predicted to qualify, did not)                    │
└────────────────────────────────────────────────────────┘
```

**Pending 3rd Place Qualification (Point #4):**
```
GRUPO C (Group Complete, 3rd place pending)     Total: 4 pts + ? pending
┌────────────────────────────────────────────────────────┐
│ [≡] (1st) Brasil                                       │
│     Actual: 1st ⭐  [+2 pts]                           │  ← Gold/yellow for perfect
│                                                        │
├────────────────────────────────────────────────────────┤
│ [≡] (2nd) Uruguay                                      │
│     Actual: 2nd ⭐  [+2 pts]                           │  ← Gold/yellow for perfect
│                                                        │
├────────────────────────────────────────────────────────┤
│ [≡] (3rd) Colombia                     [✓] Clasifica   │
│     Actual: 3rd ⏳  [Pending]                          │  ← Blue hourglass icon
│     (Could still qualify as best 3rd place)            │  ← Info text
└────────────────────────────────────────────────────────┘
```

**User Feedback #2:** Points shown in Chip component (like game cards), not plain text
**User Feedback #3:** Show results as soon as groups complete (progressive display)
**User Feedback #4:** Pending state for 3rd place teams when group complete but not all groups finished

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

**Decision:** Using Material-UI Icons with enhanced color scheme:
- `CheckCircleIcon` with **gold/yellow tint** - Perfect prediction (qualification + exact position) - 2 pts
- `CheckCircleIcon` with **success.light (lighter green)** - Correct team, wrong position - 1 pt
- `HourglassEmptyIcon` with **info.main (blue)** - Pending 3rd place qualification (see point #4)
- `CancelIcon` with **error.main (red)** - Did not qualify or wrong prediction - 0 pts

**Rationale (based on user feedback #1):**
- "Correct team in wrong position should not be warning, but a lighter green"
- "Make the exact even better than green (maybe the golden one)"
- Gold/yellow for perfect match makes it feel more rewarding
- Lighter green for partial correct feels more positive than orange warning

**Icon Size:** `fontSize="small"` for inline display
**Color Application:** Applied via `sx={{ color: 'palette.color' }}` pattern

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
   - Add props: `result?: TeamScoringResult | null`, `isGroupComplete: boolean`, `isPending3rdPlace: boolean`
   - Add results overlay section (conditional - only when `result` exists AND `isGroupComplete === true`)
   - Show: Visual indicator icon (gold star for perfect, green check for partial, red X for wrong, blue hourglass for pending)
   - Show: **Chip component** for points ("+2 pts", "+1 pt", "+0 pts", "Pendiente")
   - Show: Actual position text ("Actual: 1ro", "Actual: 2do")
   - Show: Brief status text when position wrong or pending
   - Keep existing drag-and-drop, position badge, checkbox functionality
   - Enhance background color:
     - Perfect (2 pts): Gold/yellow tint
     - Partial (1 pt): success.light (lighter green)
     - Wrong (0 pts): error.light
     - Pending: info.light (blue)
   - Handle pending 3rd place state:
     - Show hourglass icon + "Pendiente" chip
     - Show explanation text: "Podría clasificar como mejor tercero"

#### Phase 3: Update GroupCard Component
1. Modify `app/components/qualified-teams/group-card.tsx`:
   - Add props:
     - `scoringForGroup?: { teams: TeamScoringResult[], totalPoints: number, pendingPoints?: number } | null`
     - `isGroupComplete: boolean`
     - `hasPending3rdPlace: boolean`
   - Update header to show group total points when results available
     - Format: "Total: 4 pts" (when all finalized)
     - Format: "Total: 4 pts + ? pendiente" (when 3rd place pending)
   - Pass props to each `DraggableTeamCard`:
     - `result` (match by team ID)
     - `isGroupComplete`
     - `isPending3rdPlace` (true if team is 3rd AND could still qualify)
   - Calculate pending state:
     - Check if team is in 3rd position
     - Check if user predicted to qualify
     - Check if best 3rd places not yet determined (not all groups complete)

#### Phase 4: Update QualifiedTeamsClientPage Component
1. Modify `app/components/qualified-teams/qualified-teams-client-page.tsx`:
   - Add props: `actualResults`, `scoringBreakdown`
   - Create lookup map for scoring results by group ID
   - Pass scoring data to each `GroupCard`
   - No state management changes needed (results are read-only)

#### Phase 5: Spanish Localization (No i18n Yet)

**User Feedback #5:** "We only have Latam spanish as language, no i18n yet"

**Decision:** Hardcode Spanish strings directly in components (no i18n library needed for this story).

**Strings needed (Spanish only):**
- "Actual:" - Actual result label
- "Total:" - Group total label
- "No clasificó" - Did not qualify
- "Predicción correcta" - Correct prediction (tooltip/aria-label)
- "Equipo correcto, posición incorrecta" - Right team, wrong position
- "Equipo incorrecto" - Wrong team
- "Pendiente de clasificación" - Pending qualification (3rd place)
- "Podría clasificar como mejor tercero" - Could qualify as best 3rd place
- "pt" / "pts" - Point/points (singular/plural)
- "1ro", "2do", "3ro" - Position labels (1st, 2nd, 3rd)

**Implementation:**
- No `useTranslations()` hook needed
- No `locales/es.json` or `locales/en.json` updates
- Hardcode Spanish strings directly in JSX
- If i18n is added later, these can be extracted to translation files

**Note:** This simplifies implementation significantly - no translation key management needed.

#### Phase 6: Conditional Display Logic (Progressive Results)

**User Feedback #3:** "Start showing results as soon as something is calculated, which is when groups start to finish"

1. **Show results overlay when:**
   - Group is complete (`group_complete === true` from standings)
   - Team has `actualPosition !== null` OR team did not qualify
   - Component receives `result` prop from parent

2. **Progressive display scenarios:**

   **A. Group NOT complete:**
   - No results overlay
   - Card displays normally (current prediction UI)

   **B. Group complete, all positions finalized:**
   - Show full results overlay for all teams
   - 1st/2nd: Gold/green icons with points chip
   - 3rd: Shows qualified or not qualified status

   **C. Group complete, 3rd place PENDING (User Feedback #4):**
   - **Tournament allows 3rd place qualification:** `allowsThirdPlace === true`
   - **Group is complete:** Top 2 teams finalized
   - **Best 3rd places not yet determined:** Not all groups finished
   - **Team is in 3rd position:** `actualPosition === 3`
   - **User predicted this team to qualify:** `predictedToQualify === true`

   **In this case:**
   - Show **pending icon** (⏳ HourglassEmptyIcon, blue/info color)
   - Show **"Pendiente" chip** instead of points chip
   - Show explanation: "Podría clasificar como mejor tercero"
   - Background: Info color tint (light blue)

   **When best 3rd places are finalized:**
   - Pending icon changes to ✓ (qualified) or ✗ (not qualified)
   - "Pendiente" chip changes to "+2 pts" or "+0 pts"

3. **Points display (User Feedback #2):**
   - Use MUI `Chip` component (like game cards)
   - Format: "+2 pts", "+1 pt", "+0 pts", "Pendiente"
   - Size: `size="small"`
   - Colors:
     - Gold/yellow background for +2 pts (perfect match)
     - Success.light background for +1 pt (partial)
     - Error.light background for +0 pts (incorrect)
     - Info.light background for "Pendiente" (pending)

4. **Background color enhancement:**
   - Perfect match (2 pts): Gold/yellow tint
   - Partial match (1 pt): success.light (lighter green)
   - Wrong (0 pts): error.light (light red)
   - Pending: info.light (light blue)

5. **Accessibility:**
   - Icons have aria-labels: "Predicción correcta", "Equipo correcto", "Predicción incorrecta", "Pendiente de clasificación"
   - Chip component is semantic (announces points to screen readers)
   - Results overlay uses semantic HTML

### 4. Files to Create/Modify

**No New Files** - Enhancing existing components only ✅

**Modified Files:**
- `app/tournaments/[id]/qualified-teams/page.tsx` - Fetch actual results, scoring data, and group completion status
- `app/components/qualified-teams/qualified-teams-client-page.tsx` - Accept and pass down results with group states
- `app/components/qualified-teams/group-card.tsx` - Show group total points in header, handle pending state
- `app/components/qualified-teams/draggable-team-card.tsx` - Show inline results overlay with Chip, icons, pending state
- ~~`locales/es.json`~~ - **Not needed** (no i18n yet, hardcode Spanish strings)
- ~~`locales/en.json`~~ - **Not needed** (no i18n yet)

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
     - Shows results overlay when `result` prop provided AND `isGroupComplete === true`
     - Hides overlay when `isGroupComplete === false` (progressive display)
     - **Visual indicators:**
       - Perfect match (2 pts): Gold/yellow star icon (⭐ CheckCircleIcon with gold color)
       - Partial match (1 pt): Green check icon (✓ CheckCircleIcon with success.light)
       - Wrong (0 pts): Red X icon (✗ CancelIcon with error.main)
       - Pending 3rd place: Blue hourglass icon (⏳ HourglassEmptyIcon with info.main)
     - **Points Chip (User Feedback #2):**
       - Renders MUI Chip component (not plain text)
       - Shows "+2 pts" with gold background (perfect)
       - Shows "+1 pt" with success.light background (partial)
       - Shows "+0 pts" with error.light background (wrong)
       - Shows "Pendiente" with info.light background (pending 3rd)
       - Correct pluralization (1 pt vs 2 pts)
     - **Actual position display:**
       - Shows "Actual: 1ro", "Actual: 2do", "Actual: 3ro" (Spanish only)
       - Status text when position wrong
     - **Pending 3rd place state (User Feedback #4):**
       - `isPending3rdPlace === true` → Shows hourglass icon
       - Shows "Pendiente" chip
       - Shows "Podría clasificar como mejor tercero" text
       - Background: info.light (light blue tint)
     - **Background colors (User Feedback #1):**
       - Perfect: Gold/yellow tint
       - Partial: success.light (lighter green, NOT orange)
       - Wrong: error.light
       - Pending: info.light
     - **Accessibility:** Icons have aria-labels in Spanish, Chip is semantic

2. **`group-card.test.tsx` (update existing):**
   - Existing tests: Group rendering, team sorting, accordion behavior
   - **NEW: Group total points tests:**
     - Shows group total in header when `scoringForGroup` provided AND `isGroupComplete === true`
     - Formats points correctly:
       - "Total: 4 pts" (all finalized)
       - "Total: 4 pts + ? pendiente" (3rd place pending)
     - Hides total when group not complete
     - Passes correct props to each DraggableTeamCard:
       - `result` (matched by team ID)
       - `isGroupComplete`
       - `isPending3rdPlace` (calculated per team)
     - **Pending 3rd place logic:**
       - Calculates correctly when team is 3rd AND user predicted to qualify AND best 3rds not finalized
       - Shows pending indicator only for applicable teams

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
- [ ] Results overlay shows on each team card when **group is complete** (User Feedback #3)
- [ ] Visual indicators use correct colors (User Feedback #1):
  - [ ] Perfect match (2 pts): Gold/yellow star icon
  - [ ] Partial match (1 pt): Lighter green check icon (NOT orange)
  - [ ] Wrong (0 pts): Red X icon
  - [ ] Pending 3rd place: Blue hourglass icon (User Feedback #4)
- [ ] Points displayed in **Chip component** like game cards (User Feedback #2)
  - [ ] "+2 pts", "+1 pt", "+0 pts" format
  - [ ] "Pendiente" for pending 3rd place teams
  - [ ] Colored backgrounds (gold, light green, light red, light blue)
- [ ] Pending 3rd place state working correctly (User Feedback #4):
  - [ ] Shows when group complete but best 3rds not determined
  - [ ] Shows hourglass icon and "Pendiente" chip
  - [ ] Shows explanation text
  - [ ] Updates to ✓ or ✗ when best 3rds finalized
- [ ] Group total points displayed in header
- [ ] Progressive display: Results show as groups complete (User Feedback #3)
- [ ] Responsive on mobile (accordion) and desktop (card layout)
- [ ] All text in Spanish only (User Feedback #5) - No i18n needed
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
