# Implementation Plan: Story #128 - Modernize Onboarding Flow

## Story Context

**Issue:** #128 - [UXI] Modernize Onboarding Flow to Reflect Current UX Patterns

**Problem:** The current onboarding flow demonstrates outdated interaction patterns that no longer match the actual app experience. New users learn one set of patterns during onboarding but encounter completely different patterns when using the app.

**Impact:** Creates confusion and poor first impressions for new users who must relearn interaction patterns after completing onboarding.

## Objectives

1. Update Step 2 (Sample Prediction) to demonstrate modern interaction patterns
2. Update text references in Steps 3 and 5 to align with new patterns
3. Ensure onboarding reflects actual app experience (flippable cards, drag-and-drop, unified page, dashboard)
4. Maintain onboarding duration under 2 minutes
5. Preserve accessibility (keyboard navigation, screen readers, reduced motion)

## Acceptance Criteria

### Must Have
- [ ] Step 2 demonstrates flippable card pattern instead of dialog-based editing
- [ ] Step 2 shows draggable team cards instead of static readonly table
- [ ] Step 2 presents unified page concept instead of separate tabs
- [ ] Step 2 includes compact prediction dashboard demo
- [ ] Step 3 scoring text updated to reference "equipos que seleccionaste" not "posiciones calculadas"
- [ ] Step 5 checklist item updated to mention drag-and-drop interface
- [ ] All demos work on mobile (touch interactions)
- [ ] All demos support keyboard navigation
- [ ] Onboarding duration remains under 2 minutes
- [ ] All existing onboarding features preserved (skip, back, progress bar)
- [ ] 80%+ test coverage on new/modified code

### Should Have
- [ ] Smooth flip animation with reduced motion support
- [ ] Visual drag indicators (handles, drop zones) in qualified teams demo
- [ ] Success messages after user interactions in demos
- [ ] Spanish language consistency throughout

### Could Have
- [ ] User stats page added to checklist (6th item)
- [ ] Contextual tooltips in main app for first-time users
- [ ] Welcome step enhancement mentioning new features

## Technical Approach

### Architecture Decision: Demo Components vs Shared Components

**Option A: Create Simplified Demo Components (❌ Rejected by User)**
- Build lightweight demo versions that visually match but use simpler logic
- Pros: Isolated from app changes, faster rendering, easier testing, no server dependencies
- Cons: Code duplication, visual parity maintenance burden, bound to go stale

**Option B: Reuse Actual Components with Mock Handlers (✅ APPROVED BY USER)**
- Use FlippableGameCard, QualifiedTeamsGrid directly with mock data and handlers
- Pros: 100% visual accuracy, no duplication, changes/bug fixes automatically reflected in onboarding
- Cons: Need to handle context providers and dependencies

**Decision: Option B** - Reuse actual components with mock handlers and data.

**Implementation Strategy:**
- Wrap components in necessary context providers (mock implementations)
- Use mock handlers that update local state only (no server actions)
- Provide mock data that matches actual data structure
- If functional/visual separation is needed, refactor actual components first

### Component Structure

**Reuse existing components with mock context:**

```
app/components/onboarding/demo/
├── onboarding-demo-context.tsx      # Mock context providers for demos
├── demo-data.ts                     # Mock data matching actual data structures
└── demo-handlers.ts                 # Mock handlers for state updates (no server calls)
```

**Components to reuse (no changes needed):**
- `app/components/flippable-game-card.tsx` - Use as-is with mock context
- `app/components/qualified-teams/qualified-teams-client-page.tsx` - Use as-is with mock context
- `app/components/compact-prediction-dashboard.tsx` - Use as-is with mock data
- `app/components/unified-games-page-client.tsx` - Use simplified version or extract sub-components

### State Management Strategy

**Use actual components with mock context providers:**
- Wrap components in mock context (GuessesContext, QualifiedTeamsContext, etc.)
- Mock context provides same interface but with local state only
- No server actions or database calls
- Event handlers update mock context state, not real database

**Example mock context pattern:**
```typescript
// onboarding-demo-context.tsx
const MockGuessesContext = createContext({
  gameGuesses: mockGameGuesses,
  updateGameGuess: (gameId, data) => {
    // Update local state only, no server action
    setMockGameGuesses(prev => ({ ...prev, [gameId]: data }))
  },
  pendingSaves: new Set(),
  saveErrors: {},
  // ... other context values
})

// Usage in sample-prediction-step.tsx
<MockGuessesContext.Provider value={mockContextValue}>
  <FlippableGameCard game={demoGame} /* actual component */ />
</MockGuessesContext.Provider>
```

**Benefits:**
- Components behave identically to production
- Bug fixes and improvements automatically apply to onboarding
- No visual drift between onboarding and actual app

## Visual Prototypes

### 1. Flippable Card Demo

**Front Side (View Mode):**
```
┌─────────────────────────────────────────────────┐
│  🔵 ARG  2  -  1  BRA 🟢                       │
│      Argentina vs Brasil                        │
│                                                 │
│  📍 Group A • Match #12                         │
│  🕐 Tomorrow at 15:00                           │
│                                                 │
│  Your prediction: Exact match! +2 pts           │
│                                              ✏️ │
└─────────────────────────────────────────────────┘
```

**Back Side (Edit Mode):**
```
┌─────────────────────────────────────────────────┐
│  Edit Prediction                             ❌ │
│                                                 │
│  Argentina    [2]  -  [1]    Brasil            │
│                                                 │
│  Boost:  ○ None  ○ Silver 🥈  ○ Golden 🥇      │
│                                                 │
│                    [Cancel]  [Save] [Save & →] │
└─────────────────────────────────────────────────┘
```

**Interaction Flow:**
1. Click card or edit icon → Card flips to back (0.4s animation)
2. Edit scores and boost → Visual feedback on input
3. Click Save → Card flips to front, shows updated prediction
4. Success message appears: "¡Perfecto! Así se editan las predicciones"

**Material-UI Components:**
- `Card` for container
- `CardContent` for content areas
- `TextField` type="number" for score inputs
- `RadioGroup` for boost selection
- `IconButton` for edit/close
- `Button` for actions

**Accessibility:**
- Click OR press Enter to flip
- Tab navigation through inputs on back
- Escape to cancel and flip back
- ARIA labels: "Edit prediction", "Home score", "Away score"
- Reduced motion: Skip flip animation if preferred

---

### 2. Draggable Teams Demo

**Group Card Layout:**
```
┌────────────────────────────────────────────┐
│  GRUPO A                              ℹ️   │
├────────────────────────────────────────────┤
│  ☰  1. 🇧🇷 Brasil          ✓ Classifica   │
│  ☰  2. 🇦🇷 Argentina       ✓ Classifica   │
│  ☰  3. 🇺🇾 Uruguay         ☐ Classifica   │
│  ☰  4. 🇨🇱 Chile           ✗ No classifica │
└────────────────────────────────────────────┘
```

**Visual States:**

**Normal State:**
- Drag handle (☰) on left
- Team flag + name
- Qualification badge: ✓ (green) for 1-2, ☐ (checkbox) for 3, ✗ (gray) for 4+

**Dragging State:**
- Card lifts (elevation: 8)
- Opacity: 0.5
- Other cards show drop zones (dashed border)

**After Drag:**
- Card settles with smooth transition
- Qualification badges update automatically
- Success message: "¡Excelente! Así se ordenan los equipos clasificados"

**Interaction Flow:**
1. User sees 2 groups (A & B) side by side on desktop, stacked on mobile
2. Click info icon → Popover: "Arrastra para ordenar los equipos. Posiciones 1-2 clasifican automáticamente."
3. Drag team card → Visual lift and drop zone indicators
4. Drop in new position → Teams reorder, badges update
5. Toggle position 3 checkbox → Changes qualification status

**Material-UI Components:**
- `Card` for group container
- `Box` for team cards
- `Typography` for labels
- `Checkbox` for position 3 toggle
- `Popover` for help text
- Mock DnD: `onMouseDown`/`onTouchStart` handlers (simplified, not real @dnd-kit)

**Accessibility:**
- Keyboard alternative: Arrow keys to reorder + Enter to confirm
- Screen reader announces: "Team moved from position X to position Y"
- Focus management after drag
- High contrast mode support

---

### 3. Unified Page Demo

**Layout Structure:**
```
┌─────────────────────────────────────────────────────┐
│  🎯 Prediction Dashboard                            │
│  Partidos: 32/48 [████████░░░░] 67%  🥈3/5 🥇1/2   │
│  Torneo: 73% [██████████░░] Complete ✓             │
├─────────────────────────────────────────────────────┤
│  Filter: [All ▼]  Groups: [A] [B] [C] [Playoffs]   │
├─────────────────────────────────────────────────────┤
│  📋 2 games shown                                   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ 🔵 ARG 2-1 BRA 🟢               ✏️ +2 pts  │   │
│  │ Group A • Match #12 • Tomorrow 15:00       │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ 🔴 ESP 1-1 GER ⚪              ✏️ +1 pt    │   │
│  │ Group B • Match #18 • In 2 days            │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

**Interaction Flow:**
1. Dashboard shows at top with progress bars and boost counts
2. Filter dropdown defaults to "All" → User clicks, selects "Group A"
3. Secondary filters appear: [A] [B] [C] (A is selected/highlighted)
4. Game list filters to show only Group A games
5. Counter updates: "📋 6 games shown"
6. Success message: "Todas tus predicciones en un solo lugar"

**Responsive Behavior:**
- **Mobile:** Stack vertically, sticky filters, floating scroll buttons
- **Tablet:** 2-column grid for games
- **Desktop:** Dashboard + filters on left panel, games scroll on right

**Material-UI Components:**
- `Stack` for layout
- `Select` for filter dropdown
- `ToggleButtonGroup` for secondary filters
- `LinearProgress` for dashboard progress bars
- `Chip` for boost badges
- Reuse demo flippable cards for game list

---

### 4. Prediction Dashboard Demo

**Component Structure:**
```typescript
interface PredictionDashboardDemoProps {
  totalGames: 48
  predictedGames: 32
  silverUsed: 3
  silverMax: 5
  goldenUsed: 1
  goldenMax: 2
  tournamentComplete: true
}
```

**Visual Layout:**
```
┌──────────────────────────────────────────────────────┐
│  Row 1: Partidos                                     │
│  ├─ Label: "Partidos: 32/48"                         │
│  ├─ Progress bar: 67% (primary color)                │
│  ├─ Boost badges: 🥈 3/5   🥇 1/2                   │
│  └─ Urgency icon: ⚠️ (if closing soon)              │
├──────────────────────────────────────────────────────┤
│  Row 2: Torneo                                       │
│  ├─ Label: "Torneo: 73%"                             │
│  ├─ Progress bar: 73% (secondary color)              │
│  └─ Status icon: ✓ (if complete)                    │
└──────────────────────────────────────────────────────┘
```

**Interaction (Simplified for Demo):**
- No popovers in onboarding demo (keep it simple)
- Just visual display of progress
- Hover effects show it's interactive (but don't actually open popovers)

**Material-UI Components:**
- `Box` for rows
- `LinearProgress` for bars
- `Typography` for labels
- `Chip` for boost badges
- Custom `BoostCountBadge` component (simplified)

---

## Implementation Steps

### Phase 1: Setup Mock Infrastructure (2-3 hours, revised)

**1.1 Create demo data file**
- File: `app/components/onboarding/demo/demo-data.ts`
- Contents: Mock teams, games, tournament data matching actual data structures
- Export: `DEMO_TEAMS`, `DEMO_GAMES`, `DEMO_TOURNAMENT`, `DEMO_GROUPS`, `DEMO_GAME_GUESSES`, `DEMO_QUALIFIED_PREDICTIONS`

**Demo Data Structure (matches actual types):**
```typescript
// Use actual type imports
import type { Team, Game, GameGuess, QualifiedTeamPrediction } from '@/types'

// 8 teams (4 per group) - matches Team type
export const DEMO_TEAMS: Team[] = [
  { id: '1', name: 'Brasil', short_name: 'BRA', theme: null },
  { id: '2', name: 'Argentina', short_name: 'ARG', theme: null },
  // ... 6 more teams
]

// 4 games - matches Game type
export const DEMO_GAMES: Game[] = [
  { id: 'game1', home_team: '1', away_team: '2', group_id: 'groupA', ... },
  // ... 3 more games
]

// Game guesses - matches GameGuess type
export const DEMO_GAME_GUESSES: Record<string, GameGuess> = {
  'game1': { id: 'guess1', game_id: 'game1', home_score: 2, away_score: 1, ... },
  // ... more guesses
}

// Qualified team predictions - matches QualifiedTeamPrediction type
export const DEMO_QUALIFIED_PREDICTIONS: Map<string, QualifiedTeamPrediction> = new Map([
  ['groupA-team1', { predicted_position: 1, predicted_to_qualify: true, ... }],
  // ... more predictions
])
```

**1.2 Create mock context file**
- File: `app/components/onboarding/demo/onboarding-demo-context.tsx`
- Mock GuessesContext, QualifiedTeamsContext with same interface
- Local state only, no server actions

**1.3 Create mock handlers file**
- File: `app/components/onboarding/demo/demo-handlers.ts`
- Mock versions of updateGameGuess, updateGroupPositions, etc.
- Update local state, show success messages, no API calls

### Phase 2: Setup Mock Context Providers (3-4 hours, revised)

**2.1 Create MockGuessesContext**
- File: `app/components/onboarding/demo/onboarding-demo-context.tsx`
- Implement same interface as actual GuessesContext
- Local state management with useState/useReducer
- Mock updateGameGuess handler (updates local state, no server action)
- Mock clearSaveError handler
- Estimated time: 1.5 hours

```typescript
export const MockGuessesContextProvider = ({ children }) => {
  const [gameGuesses, setGameGuesses] = useState(DEMO_GAME_GUESSES)
  const [pendingSaves, setPendingSaves] = useState(new Set())
  const [saveErrors, setSaveErrors] = useState({})

  const updateGameGuess = async (gameId, updates) => {
    // Mock implementation - local state only
    setGameGuesses(prev => ({
      ...prev,
      [gameId]: { ...prev[gameId], ...updates }
    }))
    // Simulate async for realistic behavior
    await new Promise(resolve => setTimeout(resolve, 300))
  }

  return (
    <GuessesContext.Provider value={{ gameGuesses, updateGameGuess, ... }}>
      {children}
    </GuessesContext.Provider>
  )
}
```

**2.2 Create MockQualifiedTeamsContext**
- Same file: `app/components/onboarding/demo/onboarding-demo-context.tsx`
- Implement same interface as actual QualifiedTeamsContext
- Mock updateGroupPositions handler
- Mock save state machine (idle → saving → saved)
- Estimated time: 1.5 hours

**2.3 Test Mock Contexts with Actual Components**
- Wrap FlippableGameCard in MockGuessesContext
- Wrap QualifiedTeamsClientPage in MockQualifiedTeamsContext
- Verify components render correctly with mock data
- Verify interactions update local state
- **CHECKPOINT:** Components should work identically to production
- Estimated time: 0.5 hours

### Phase 3: Update Sample Prediction Step (4-5 hours, revised)

**3.1 Replace TabPanel structure with demo components**
- File: `app/components/onboarding/onboarding-steps/sample-prediction-step.tsx`
- Remove: `Tabs`, `TabPanel` components (lines ~54-327)
- Remove: `GameResultEditDialog` import and usage (lines ~124-140)
- Remove: Static qualified teams table (lines ~243-327)
- Add: Import demo components
- Add: Success message orchestration (see 3.3)
- Preserve: Welcome text and instructions
- Estimated time: 3-4 hours (revised from 2 hours - more complex than initially estimated)

**3.2 Update component structure**

**New Structure:**
```typescript
import { MockGuessesContextProvider, MockQualifiedTeamsContextProvider } from '../demo/onboarding-demo-context'
import FlippableGameCard from '@/components/flippable-game-card' // Actual component
import QualifiedTeamsClientPage from '@/components/qualified-teams/qualified-teams-client-page' // Actual component
import CompactPredictionDashboard from '@/components/compact-prediction-dashboard' // Actual component

<Box>
  {/* Introduction */}
  <Typography>Así funciona la app...</Typography>

  {/* Section 1: Game Predictions - Use actual FlippableGameCard */}
  <Typography variant="h6">1. Predicciones de Partidos</Typography>
  <MockGuessesContextProvider>
    <FlippableGameCard
      game={DEMO_GAMES[0]}
      teamsMap={DEMO_TEAMS_MAP}
      onInteraction={handleCardInteraction}
    />
  </MockGuessesContextProvider>
  {showCardSuccess && (
    <Alert severity="success" onClose={() => setShowCardSuccess(false)}>
      ¡Perfecto! Haz clic en la tarjeta para editarla
    </Alert>
  )}

  {/* Section 2: Qualified Teams - Use actual QualifiedTeamsClientPage */}
  <Typography variant="h6">2. Equipos Clasificados</Typography>
  <MockQualifiedTeamsContextProvider>
    <QualifiedTeamsClientPage
      tournamentId="demo-tournament"
      groups={DEMO_GROUPS}
      allowsThirdPlace={false}
      onInteraction={handleDragInteraction}
    />
  </MockQualifiedTeamsContextProvider>
  {showDragSuccess && (
    <Alert severity="success" onClose={() => setShowDragSuccess(false)}>
      ¡Excelente! Arrastra para reordenar
    </Alert>
  )}

  {/* Section 3: Unified View - Simplified layout demo or extracted sub-components */}
  <Typography variant="h6">3. Vista Unificada</Typography>
  <CompactPredictionDashboard {...DEMO_DASHBOARD_PROPS} />
  <GameFilters value="all" onChange={handleFilterChange} />
  <MockGuessesContextProvider>
    <Stack spacing={2}>
      {DEMO_GAMES.slice(0, 2).map(game => (
        <FlippableGameCard key={game.id} game={game} teamsMap={DEMO_TEAMS_MAP} />
      ))}
    </Stack>
  </MockGuessesContextProvider>
  {showFilterSuccess && (
    <Alert severity="success" onClose={() => setShowFilterSuccess(false)}>
      ¡Genial! Todas tus predicciones en un solo lugar
    </Alert>
  )}

  {/* Section 4: Tournament Awards (Keep existing pattern) */}
  <Typography variant="h6">4. Premios del Torneo</Typography>
  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
    <TeamSelector label="Campeón" teams={DEMO_TEAMS} />
    <TeamSelector label="Subcampeón" teams={DEMO_TEAMS} />
  </Box>
</Box>
```

**3.3 Add interaction tracking and success messages**

**Success Message Strategy: Celebratory (Non-Blocking)**
- Messages appear after first interaction with each demo
- Auto-dismiss after 5 seconds OR user can dismiss with X button
- Do NOT block user from continuing to next step
- Use MUI `Alert` component with `onClose` handler

**State Management:**
```typescript
const [showCardSuccess, setShowCardSuccess] = useState(false)
const [showDragSuccess, setShowDragSuccess] = useState(false)
const [showFilterSuccess, setShowFilterSuccess] = useState(false)

// Success message triggers
const handleCardInteraction = () => {
  if (!showCardSuccess) {
    setShowCardSuccess(true)
    setTimeout(() => setShowCardSuccess(false), 5000) // Auto-dismiss
  }
}
```

**Success Message Triggers:**
1. **Flippable Card:** After user clicks "Save" button (not just flip)
2. **Draggable Teams:** After user completes first drag-and-drop (on drop)
3. **Unified Page:** After user changes filter dropdown (on select change)
4. **Tournament Awards:** Not needed (existing pattern, not new)

**Message Content:**
- Card: "¡Perfecto! Así se editan las predicciones de partidos"
- Drag: "¡Excelente! Así se ordenan los equipos clasificados"
- Filter: "¡Genial! Todas tus predicciones en un solo lugar"

### Phase 4: Update Other Steps (1 hour)

**4.1 Update Scoring Explanation Step**
- File: `app/components/onboarding/onboarding-steps/scoring-explanation-step.tsx`
- Line ~115-120: Update qualified teams text
- Before: "posiciones calculadas automáticamente"
- After: "equipos que seleccionaste en clasificación"
- Estimated time: 15 minutes

**4.2 Update Checklist Step**
- File: `app/components/onboarding/onboarding-steps/checklist-step.tsx`
- Line ~12: Update qualified teams item
- Before: "Completar predicciones de clasificación"
- After: "Ordenar equipos clasificados (arrastra y suelta)"
- Optional: Add 6th item for user stats (if product approves)
- Estimated time: 15 minutes

**4.3 Optional: Welcome Step Enhancement**
- File: `app/components/onboarding/onboarding-steps/welcome-step.tsx`
- Add brief mention of new features after main welcome text
- Example: "Con nuevas funcionalidades: estadísticas personales, interfaz unificada, y más"
- Estimated time: 15 minutes

### Phase 5: Testing (3-4 hours, revised)

**5.1 Unit Tests for Mock Contexts**
- Files:
  - `__tests__/components/onboarding/demo/onboarding-demo-context.test.tsx`
  - `__tests__/components/onboarding/demo/demo-handlers.test.ts`

**Test Coverage:**
- Mock context providers render correctly
- Mock handlers update local state (not server)
- Mock save state machine transitions
- Context interface matches actual context
- Estimated time: 1.5 hours

**Note:** No need to test FlippableGameCard or QualifiedTeamsClientPage - they're already tested in their own test files. We're reusing actual components, not duplicating them.

**5.2 Update Existing Tests**
- File: `__tests__/components/onboarding/sample-prediction-step.test.tsx`
- Remove: Dialog-based editing tests
- Remove: Tab switching tests
- Remove: Static table tests
- Add: Demo component rendering tests
- Add: Section visibility tests
- Add: Interaction tracking tests
- Estimated time: 1.5 hours

**5.3 Integration Tests**
- File: `__tests__/integration/onboarding-flow.test.tsx`
- Update: Step 2 navigation expectations
- Verify: All 5 steps still work end-to-end
- Verify: Skip, back, progress bar still work
- Estimated time: 1 hour

**5.4 Accessibility Tests**
- Keyboard navigation through all demos
- Screen reader announcements (aria-live regions)
- Focus management after interactions
- High contrast mode visual check
- Reduced motion preference respected
- Estimated time: 30 minutes

### Phase 6: Manual Testing & Polish (2-3 hours)

**6.1 Cross-browser Testing**
- Chrome (desktop + mobile)
- Safari (desktop + iOS)
- Firefox (desktop)
- Edge (desktop)

**6.2 Device Testing**
- Desktop: 1920x1080, 1366x768
- Tablet: iPad (768x1024)
- Mobile: iPhone (375x667), Android (360x640)

**6.3 Interaction Polish & Duration Audit (MANDATORY)**

**🔴 CRITICAL: Onboarding Duration Time Audit**

Test with stopwatch and record actual time per section:

| Section | Target Time | Actual Time | Notes |
|---------|-------------|-------------|-------|
| Welcome Step | 15-20s | ___ | Just reading |
| Step 2: Game Prediction Demo | 30-40s | ___ | Flip + edit + save |
| Step 2: Drag Demo | 30-40s | ___ | Drag 1 team |
| Step 2: Unified Page Demo | 20-30s | ___ | Change filter once |
| Step 2: Tournament Awards | 20-30s | ___ | Select champion |
| Step 3: Scoring | 15-20s | ___ | Just reading |
| Step 4: Boosts | 15-20s | ___ | Just reading |
| Step 5: Checklist | 10-15s | ___ | Just reading |
| **TOTAL TARGET** | **~2 minutes** | **___** | |

**If total exceeds 2 minutes:**
- Remove unified page demo (move to welcome text mention)
- OR simplify drag demo to single group
- OR remove tournament awards from Step 2 (already in Step 1)

**Other Polish Checks:**
- Verify flip animation smoothness (60fps on mobile)
- Verify drag visual feedback clarity (elevation, opacity visible)
- Verify success messages timing (5s auto-dismiss)
- Test all on actual mobile device (not just DevTools)

**6.4 Spanish Language Review**
- Verify all text is in Spanish
- Verify terminology consistency across all steps
- Verify instruction clarity (readable at 5th grade level)
- **Reviewer:** Product owner or native Spanish speaker on team
- **Checklist:**
  - [ ] Success messages use natural, encouraging tone
  - [ ] Instructions are clear and concise
  - [ ] No English fallback text
  - [ ] Terminology matches existing app patterns (e.g., "Equipos clasificados", not "Equipos calificados")

## Testing Strategy

### Unit Test Coverage Requirements
- **Demo Components:** 80%+ coverage
  - All interaction handlers
  - State changes
  - Prop variations
  - Edge cases (empty data, disabled states)
- **Updated Steps:** 80%+ coverage
  - Component rendering
  - Section visibility
  - Interaction tracking
  - Text content

### Test Utilities to Use
- `renderWithTheme()` from `__tests__/utils/test-utils.tsx`
- `testFactories.team()`, `testFactories.game()` for mock data
- `fireEvent.click()`, `fireEvent.change()` for interactions
- `fireEvent.mouseDown()`, `fireEvent.mouseMove()` for drag simulation
- `fireEvent.keyDown()` for keyboard navigation
- `waitFor()` for async state updates
- `screen.getByRole()`, `screen.getByTestId()` for queries

### Mock Patterns
```typescript
// Test mock context providers
describe('MockGuessesContextProvider', () => {
  it('provides mock context values', () => {
    const TestComponent = () => {
      const context = useGuessesContext()
      return <div>{Object.keys(context.gameGuesses).length} guesses</div>
    }

    render(
      <MockGuessesContextProvider>
        <TestComponent />
      </MockGuessesContextProvider>
    )

    expect(screen.getByText('4 guesses')).toBeInTheDocument()
  })

  it('updates local state without server calls', async () => {
    const TestComponent = () => {
      const { gameGuesses, updateGameGuess } = useGuessesContext()
      return (
        <button onClick={() => updateGameGuess('game1', { home_score: 3 })}>
          Update
        </button>
      )
    }

    render(
      <MockGuessesContextProvider>
        <TestComponent />
      </MockGuessesContextProvider>
    )

    fireEvent.click(screen.getByText('Update'))

    // No server action mocked - it's all local state
    await waitFor(() => {
      // Verify state updated (would need to expose state or test through component)
    })
  })
})

// Actual FlippableGameCard tests already exist - no duplication needed
```

### Integration Test Scenarios
1. User completes full onboarding with new Step 2 → All steps accessible
2. User interacts with all demo components → Success messages appear
3. User uses keyboard navigation → All demos accessible
4. User uses skip button → Onboarding closes and completes
5. User uses back button → Returns to previous step correctly

### Accessibility Validation
- Run axe-core tests on all demo components
- Manual keyboard navigation testing
- Screen reader testing (VoiceOver on macOS, NVDA on Windows)
- Reduced motion preference testing
- High contrast mode visual inspection

## Files to Create/Modify

### New Files (3, revised)
1. `app/components/onboarding/demo/demo-data.ts` - Mock data matching actual types
2. `app/components/onboarding/demo/onboarding-demo-context.tsx` - Mock context providers
3. `app/components/onboarding/demo/demo-handlers.ts` - Mock handlers for state updates

### Modified Files (3)
1. `app/components/onboarding/onboarding-steps/sample-prediction-step.tsx` - Major overhaul
2. `app/components/onboarding/onboarding-steps/scoring-explanation-step.tsx` - Text updates
3. `app/components/onboarding/onboarding-steps/checklist-step.tsx` - Text updates

### Optional Modified Files (1)
1. `app/components/onboarding/onboarding-steps/welcome-step.tsx` - Feature mention

### New Test Files (2, revised)
1. `__tests__/components/onboarding/demo/onboarding-demo-context.test.tsx` - Mock context tests
2. `__tests__/components/onboarding/demo/demo-handlers.test.ts` - Mock handler tests

### Modified Test Files (2)
1. `__tests__/components/onboarding/sample-prediction-step.test.tsx` - Update expectations
2. `__tests__/integration/onboarding-flow.test.tsx` - Update Step 2 expectations

### Database Changes
**None required** - Existing `onboarding_data` JSON structure supports all changes.

## Validation & Quality Gates

### Pre-Commit Validation
1. **All tests pass:** `npm run test`
2. **No linting errors:** `npm run lint`
3. **Build succeeds:** `npm run build`
4. **No TypeScript errors:** `tsc --noEmit`

### SonarCloud Requirements
- **Code coverage:** ≥80% on new code (demo components + updated steps)
- **New issues:** 0 (any severity)
- **Security rating:** A
- **Maintainability:** B or higher
- **Code duplication:** <5%

### Manual Validation Checklist
- [ ] Onboarding loads without errors
- [ ] Step 2 shows all 4 sections (games, qualified teams, unified view, tournament)
- [ ] Flippable card demo works (click to flip, edit, save)
- [ ] Drag demo works (visual feedback, reordering, qualification updates)
- [ ] Dashboard demo shows progress bars and boost counts
- [ ] Filter demo shows filter dropdown and game filtering
- [ ] Success messages appear after interactions
- [ ] All text is in Spanish
- [ ] Keyboard navigation works (Tab, Enter, Escape, Arrow keys)
- [ ] Reduced motion preference respected (no animations)
- [ ] Mobile touch interactions work
- [ ] Desktop mouse interactions work
- [ ] Step navigation works (Next, Back, Skip)
- [ ] Progress bar updates correctly
- [ ] Onboarding duration < 2 minutes
- [ ] Browser compatibility (Chrome, Safari, Firefox, Edge)
- [ ] Device compatibility (desktop, tablet, mobile)

### Accessibility Checklist
- [ ] All interactive elements keyboard accessible
- [ ] Focus visible on all interactive elements
- [ ] ARIA labels present on buttons and inputs
- [ ] Screen reader announcements for state changes
- [ ] Color contrast ratios meet WCAG AA standards
- [ ] No animations if reduced motion preferred
- [ ] High contrast mode support

## Risks & Mitigation

### Risk 1: Context Provider Complexity
**Impact:** Medium
**Probability:** Low (revised - using actual components eliminates drift risk)
**Mitigation:**
- Mock contexts must match actual context interfaces exactly
- Use TypeScript to enforce interface compatibility
- Test that actual components work with mock contexts
- Document any differences between mock and real context behavior

**Note:** Original risk (demo component divergence) is eliminated by reusing actual components

### Risk 2: Onboarding Duration Exceeds 2 Minutes
**Impact:** High
**Probability:** Medium (revised from Low - 4 new interactive sections)
**Mitigation:**
- **MANDATORY:** Duration audit in Phase 6.3 with per-section time targets (see table)
- **Target:** Each demo interaction should take ≤30-40 seconds
- **Fallback Plan:** If total >2 minutes:
  - Option A: Remove unified page demo, add brief mention in welcome text
  - Option B: Simplify drag demo to single group (2 teams instead of 8)
  - Option C: Remove tournament awards from Step 2 (already covered in tabs)
- **User can skip:** Skip button always available as safety valve
- **Test with real users:** 3-5 users time themselves through onboarding

### Risk 3: Mobile Drag-and-Drop Complexity
**Impact:** Medium
**Probability:** Medium-High (drag without library is hard)
**Mitigation:**
- **Phase 2.2 CHECKPOINT:** Test on actual iOS/Android device immediately after implementing DraggableTeamsDemo
- Use simplified touch handlers: `onTouchStart`, `onTouchMove`, `onTouchEnd`
- Provide clear visual drag indicators (elevation: 8, opacity: 0.5, dashed drop zones)
- **FALLBACK READY:** If drag feels sluggish or unresponsive:
  - Implement tap-to-reorder: Tap team → Highlight available positions → Tap destination → Team moves
  - Test fallback on same device
  - Choose best option before proceeding to Phase 3
- **Success Criteria:** Drag should feel smooth (no lag) and provide clear visual feedback on mobile

### Risk 4: Accessibility Gaps
**Impact:** High
**Probability:** Low
**Mitigation:**
- Implement keyboard alternatives from start (not afterthought)
- Test with screen reader during development
- Use semantic HTML and ARIA attributes
- Follow Material-UI accessibility patterns

### Risk 5: Test Coverage Below 80%
**Impact:** High
**Probability:** Low
**Mitigation:**
- Write tests alongside components (TDD approach)
- Focus on interaction handlers (highest value)
- Use coverage reports to identify gaps
- Allocate sufficient time for testing (4-6 hours estimated)

## Open Questions

### Question 1: Should we add user stats to checklist?
**Context:** Story suggests optional 6th checklist item for user stats discovery
**Options:**
- A) Add 6th item: "Ver tus estadísticas personales"
- B) Keep existing 5 items (don't add cognitive load)
**Recommendation:** Option B (keep 5 items)
**Rationale:** Onboarding should focus on core flows. Stats discovery can happen naturally.
**Decision needed from:** Product/Design

### Question 2: Should we add contextual tooltips throughout app?
**Context:** Story suggests tooltips for first-time users (e.g., "Click to flip")
**Options:**
- A) Add tooltips (tracks dismissal in `dismissedTooltips`)
- B) Skip tooltips (onboarding is sufficient)
**Recommendation:** Option B (skip for now)
**Rationale:** Out of scope for this story. Can be separate feature if data shows users struggle.
**Decision needed from:** Product/Design

### Question 3: Should existing users see updated onboarding?
**Context:** If user completed onboarding before, should they see new version?
**Options:**
- A) Yes - reset onboarding for all users (force re-completion)
- B) No - only new users see updated flow
- C) Optional - add "Replay Onboarding" button in settings
**Recommendation:** Option B (new users only)
**Rationale:** Existing users already familiar with app. Avoid interruption.
**Decision needed from:** Product

### Question 4: How detailed should drag demo be?
**Context:** Balance between realism and implementation complexity
**Options:**
- A) Full @dnd-kit integration (accurate but complex)
- B) Simplified mock drag (visual lift + reorder, no library)
- C) Static demo with "drag here" arrows (no actual dragging)
**Recommendation:** Option B (simplified mock drag)
**Rationale:** Shows interaction pattern without library overhead. Easier to maintain.
**Decision needed from:** Engineering (can decide during implementation)

### Question 5: Should we show actual boost allocation in dashboard demo?
**Context:** Dashboard shows "🥈 3/5 🥇 1/2" - should we explain what this means?
**Options:**
- A) Add tooltip/popover explaining boost counts
- B) Just show the numbers (explain in Boost Introduction Step)
- C) Add brief inline text: "Boosts usados: 3/5 silver, 1/2 golden"
**Recommendation:** Option B (rely on Boost Introduction Step)
**Rationale:** Keep dashboard demo simple. Boost explanation already in Step 4.
**Decision needed from:** UX (can decide during implementation)

## Success Metrics

### Qualitative Metrics
- ✅ New users see same patterns in onboarding as in actual app
- ✅ No confusion about how to edit game predictions
- ✅ Clear understanding of qualified teams drag-and-drop model
- ✅ Awareness of unified page with filters
- ✅ Awareness of prediction dashboard and its purpose

### Quantitative Metrics (if analytics available)
- Onboarding completion rate: Maintain or improve current rate
- Time to complete onboarding: Maintain under 2 minutes
- Feature discovery rate: % of users who interact with flippable cards in first week
- Prediction completion rate: % of users who complete first tournament predictions
- Error rate: Decrease in user support tickets about "how to edit predictions"

## Definition of Done

### Code Complete
- [ ] All demo components implemented and working
- [ ] Sample Prediction Step updated with new demo structure
- [ ] Scoring Explanation Step text updated
- [ ] Checklist Step text updated
- [ ] All components use Material-UI for consistency
- [ ] All components support dark/light theme
- [ ] All components responsive (mobile, tablet, desktop)
- [ ] Spanish language throughout

### Testing Complete
- [ ] Unit tests written for all new demo components
- [ ] Unit tests updated for modified step components
- [ ] Integration tests updated for onboarding flow
- [ ] All tests passing (npm run test)
- [ ] Test coverage ≥80% on new/modified code
- [ ] Accessibility tests passing (keyboard, screen reader, reduced motion)

### Quality Gates Passed
- [ ] No linting errors (npm run lint)
- [ ] Build succeeds (npm run build)
- [ ] No TypeScript errors (tsc --noEmit)
- [ ] SonarCloud: 0 new issues (any severity)
- [ ] SonarCloud: ≥80% coverage on new code
- [ ] SonarCloud: Security rating A
- [ ] SonarCloud: Maintainability B or higher

### Manual Validation Complete
- [ ] Tested on Chrome (desktop + mobile DevTools)
- [ ] Tested on Safari (desktop + iOS Simulator)
- [ ] Tested on Firefox (desktop)
- [ ] Tested on Edge (desktop)
- [ ] Tested on actual mobile devices (iOS + Android)
- [ ] Keyboard navigation verified
- [ ] Screen reader tested (VoiceOver or NVDA)
- [ ] Reduced motion preference respected
- [ ] High contrast mode checked
- [ ] Onboarding duration under 2 minutes
- [ ] All interactions feel smooth and responsive
- [ ] Success messages display correctly
- [ ] No console errors or warnings

### Documentation Complete
- [ ] Code comments for complex logic
- [ ] Visual parity requirements documented in demo components
- [ ] PR description includes before/after screenshots
- [ ] Demo components marked as "simplified versions" in comments

### User Acceptance
- [ ] Product owner reviews onboarding flow
- [ ] UX designer approves visual alignment
- [ ] Optional: 3-5 test users complete walkthrough and provide feedback

## Related Issues

- Original onboarding: Story #11
- Flippable card: Story #16 (reference: `plans/STORY-16-plan.md`)
- Qualified teams: Story #98 (reference: `plans/STORY-103-plan.md`)
- Unified games page: Story #114 (reference: `plans/STORY-114-plan.md`)

## Estimated Effort

- **Setup & Mock Data:** 2-3 hours (revised - includes mock context setup, more complex than demo data)
- **Mock Context Providers:** 3-4 hours (revised from 6-8 hours - simpler than building demo components)
- **Update Steps:** 4-5 hours (same complexity)
- **Testing:** 3-4 hours (revised from 4-6 hours - less to test, actual components already tested)
- **Manual Testing & Polish:** 2-3 hours (includes mandatory duration audit)
- **Total:** 14-19 hours (revised from 17-24 hours - simpler approach, less duplication)

**Benefits of Revised Approach:**
- Fewer hours overall (5-8 hours saved)
- No code duplication to maintain
- Bug fixes automatically apply to onboarding
- 100% visual accuracy guaranteed

**Confidence Level:** High - Well-scoped, clear requirements, existing patterns to follow
