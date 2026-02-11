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

**Option A: Reuse Actual Components (❌ Not Recommended)**
- Use FlippableGameCard, QualifiedTeamsGrid directly
- Pros: 100% accuracy to real experience
- Cons: Heavy dependencies, context providers required, complex state management, harder to maintain

**Option B: Create Simplified Demo Components (✅ RECOMMENDED)**
- Build lightweight demo versions that visually match but use simpler logic
- Pros: Isolated from app changes, faster rendering, easier testing, no server dependencies
- Cons: Need to maintain visual parity when app components change

**Decision: Option B** - Create demo-specific components in `app/components/onboarding/demo/` directory.

### Component Structure

```
app/components/onboarding/demo/
├── flippable-card-demo.tsx          # Simplified flippable card with CSS animations
├── draggable-teams-demo.tsx         # Mock drag-and-drop with visual feedback
├── unified-page-demo.tsx            # Layout demo with filters and games
├── prediction-dashboard-demo.tsx    # Dashboard with mock progress data
└── demo-data.ts                     # Shared mock data for all demos
```

### State Management Strategy

**Demo components will be self-contained:**
- Local React state for interactions (flip state, drag state, filter selection)
- No server actions or database calls
- No complex context providers
- Event handlers update local UI only

**Example state pattern:**
```typescript
// flippable-card-demo.tsx
const [isFlipped, setIsFlipped] = useState(false)
const [homeScore, setHomeScore] = useState(2)
const [awayScore, setAwayScore] = useState(1)

const handleSave = () => {
  setIsFlipped(false)
  // Show success message
}
```

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

### Phase 1: Setup Demo Infrastructure (1-2 hours)

**1.1 Create demo data file**
- File: `app/components/onboarding/demo/demo-data.ts`
- Contents: Mock teams, games, tournament data
- Export: `DEMO_TEAMS`, `DEMO_GAMES`, `DEMO_TOURNAMENT`, `DEMO_GROUPS`

**Demo Data Structure:**
```typescript
// 8 teams (4 per group)
DEMO_TEAMS: Team[] = [
  // Group A: Brasil, Argentina, Uruguay, Chile
  // Group B: España, Alemania, Francia, Portugal
]

// 4 games for unified page demo (2 from each group)
DEMO_GAMES: Game[] = [
  { home: Brasil, away: Argentina, group: 'A' },
  { home: Uruguay, away: Chile, group: 'A' },
  { home: España, away: Alemania, group: 'B' },
  { home: Francia, away: Portugal, group: 'B' },
]

// 2 groups with 4 teams each
DEMO_GROUPS = [
  { name: 'GRUPO A', teams: [Brasil, Argentina, Uruguay, Chile] },
  { name: 'GRUPO B', teams: [España, Alemania, Francia, Portugal] },
]
```

**Reuse existing test factories:**
- Use `testFactories.team()` for teams (don't reinvent)
- Use `testFactories.game()` for games
- Keep consistent with existing test data patterns

**1.2 Create demo components directory**
```bash
mkdir -p app/components/onboarding/demo
```

### Phase 2: Build Demo Components (6-8 hours)

**2.1 FlippableCardDemo Component**
- File: `app/components/onboarding/demo/flippable-card-demo.tsx`
- Features:
  - CSS-based flip animation (not Framer Motion)
  - Local state for flip/scores/boost
  - Save handler with success message
  - Keyboard support (Enter to flip, Escape to cancel)
  - Reduced motion support using MUI's `useMediaQuery('(prefers-reduced-motion: reduce)')`
    - If reduced motion: Instant flip (no transform animation)
    - If animation allowed: 0.4s transform animation
- Props: `game`, `onInteraction?: () => void`
- Estimated time: 2 hours

**Reduced Motion Implementation:**
```typescript
const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
const flipDuration = prefersReducedMotion ? 0 : 0.4
```

**2.2 DraggableTeamsDemo Component**
- File: `app/components/onboarding/demo/draggable-teams-demo.tsx`
- Features:
  - Simplified drag handlers (no @dnd-kit dependency)
  - Visual drag indicators (elevation, opacity)
  - Auto-qualification logic (1-2 qualify, 3 optional, 4+ don't)
  - Keyboard alternative: Up/Down arrows to move within group, Tab to navigate between groups, Enter to confirm
  - Mobile touch support with `onTouchStart`, `onTouchMove`, `onTouchEnd`
  - **CHECKPOINT:** Test on actual iOS/Android device at end of this phase
  - **FALLBACK:** If drag feels sluggish, implement tap-to-reorder (tap team, highlight positions, tap destination)
- Props: `groups`, `onInteraction?: () => void`
- Estimated time: 3 hours

**Keyboard Navigation Model:**
- Focus on team card
- Up arrow: Move team up one position (if not first)
- Down arrow: Move team down one position (if not last)
- Enter: Confirm move (show success feedback)
- Tab: Move to next team (standard focus navigation)

**2.3 PredictionDashboardDemo Component**
- File: `app/components/onboarding/demo/prediction-dashboard-demo.tsx`
- Features:
  - Two-row layout (games + tournament)
  - Progress bars with percentages
  - Boost count badges
  - Urgency icons
  - No interactive popovers (demo only)
- Props: Static data (no props needed)
- Estimated time: 1.5 hours

**2.4 UnifiedPageDemo Component**
- File: `app/components/onboarding/demo/unified-page-demo.tsx`
- Features:
  - Dashboard at top
  - Filter dropdown + secondary filters
  - Filtered game list (uses FlippableCardDemo)
  - Game count display
  - Responsive layout
- Props: None (uses demo data internally)
- Estimated time: 1.5 hours

### Phase 3: Update Sample Prediction Step (3-4 hours)

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
<Box>
  {/* Introduction */}
  <Typography>Así funciona la app...</Typography>

  {/* Section 1: Game Predictions */}
  <Typography variant="h6">1. Predicciones de Partidos</Typography>
  <FlippableCardDemo game={DEMO_GAMES[0]} />
  <Alert severity="success">¡Perfecto! Haz clic en la tarjeta para editarla</Alert>

  {/* Section 2: Qualified Teams */}
  <Typography variant="h6">2. Equipos Clasificados</Typography>
  <DraggableTeamsDemo groups={DEMO_GROUPS} />
  <Alert severity="success">¡Excelente! Arrastra para reordenar</Alert>

  {/* Section 3: Unified View */}
  <Typography variant="h6">3. Vista Unificada</Typography>
  <UnifiedPageDemo />
  <Alert severity="success">Todo en un solo lugar con filtros</Alert>

  {/* Section 4: Tournament Awards (Simplified) */}
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

### Phase 5: Testing (4-6 hours)

**5.1 Unit Tests for Demo Components**
- Files:
  - `__tests__/components/onboarding/demo/flippable-card-demo.test.tsx`
  - `__tests__/components/onboarding/demo/draggable-teams-demo.test.tsx`
  - `__tests__/components/onboarding/demo/prediction-dashboard-demo.test.tsx`
  - `__tests__/components/onboarding/demo/unified-page-demo.test.tsx`

**Test Coverage:**
- Rendering with mock data
- Flip animation state changes
- Drag interaction (mouseDown/move/up)
- Filter selection changes
- Keyboard navigation
- Reduced motion support
- Success message display
- Estimated time: 3 hours

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
// Demo components don't need server action mocks (no API calls)
// Just test local state changes

// Example test structure
describe('FlippableCardDemo', () => {
  it('flips card when edit button clicked', () => {
    render(<FlippableCardDemo game={mockGame} />)

    const editButton = screen.getByLabelText('Edit prediction')
    fireEvent.click(editButton)

    expect(screen.getByText('Edit Prediction')).toBeInTheDocument()
    expect(screen.getByLabelText('Home score')).toBeInTheDocument()
  })

  it('shows success message after save', async () => {
    render(<FlippableCardDemo game={mockGame} />)

    // Flip to edit mode
    fireEvent.click(screen.getByLabelText('Edit prediction'))

    // Save
    fireEvent.click(screen.getByText('Save'))

    // Success message appears
    await waitFor(() => {
      expect(screen.getByText(/¡Perfecto!/)).toBeInTheDocument()
    })
  })
})
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

### New Files (5)
1. `app/components/onboarding/demo/demo-data.ts` - Mock data for demos
2. `app/components/onboarding/demo/flippable-card-demo.tsx` - Flippable card demo
3. `app/components/onboarding/demo/draggable-teams-demo.tsx` - Drag-and-drop demo
4. `app/components/onboarding/demo/prediction-dashboard-demo.tsx` - Dashboard demo
5. `app/components/onboarding/demo/unified-page-demo.tsx` - Unified page demo

### Modified Files (3)
1. `app/components/onboarding/onboarding-steps/sample-prediction-step.tsx` - Major overhaul
2. `app/components/onboarding/onboarding-steps/scoring-explanation-step.tsx` - Text updates
3. `app/components/onboarding/onboarding-steps/checklist-step.tsx` - Text updates

### Optional Modified Files (1)
1. `app/components/onboarding/onboarding-steps/welcome-step.tsx` - Feature mention

### New Test Files (4)
1. `__tests__/components/onboarding/demo/flippable-card-demo.test.tsx`
2. `__tests__/components/onboarding/demo/draggable-teams-demo.test.tsx`
3. `__tests__/components/onboarding/demo/prediction-dashboard-demo.test.tsx`
4. `__tests__/components/onboarding/demo/unified-page-demo.test.tsx`

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

### Risk 1: Demo Components Diverge from Real Components
**Impact:** Medium
**Probability:** Medium
**Mitigation:**
- Document visual parity requirements in component comments
- Add manual visual regression testing checklist
- Create visual comparison screenshots in PR
- Regular review of onboarding vs actual app patterns

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

- **Setup & Demo Data:** 1-2 hours (includes detailed data structure spec)
- **Demo Components:** 6-8 hours (includes mobile device testing checkpoint)
- **Update Steps:** 4-5 hours (revised from 3-4 hours - Step 3.1 is complex)
- **Testing:** 4-6 hours
- **Manual Testing & Polish:** 2-3 hours (includes mandatory duration audit)
- **Total:** 17-24 hours (revised from 16-23 hours)

**Risk Buffer:** +2-3 hours if mobile drag fallback is needed or duration exceeds 2 minutes

**Confidence Level:** High - Well-scoped, clear requirements, existing patterns to follow
