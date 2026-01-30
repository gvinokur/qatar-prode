# UXI-026: Tournament Predictions UI/UX Consistency - Implementation Plan

## Story Overview

**Issue**: #67 [UXI-026] Tournament Predictions UI/UX Consistency
**Priority**: 🔥🔥🔥 Critical
**Effort**: Low (1-2 days)
**Worktree**: `/Users/gvinokur/Personal/qatar-prode-story-67`
**Branch**: `feature/story-67`

## Problem Statement

After implementing UXI-006 (Interactive Closing Soon Dashboard with urgency accordions), there's visual inconsistency between:
- **Closing Soon Games**: Use accordions, color-coded urgency, auto-expand logic, section summaries
- **Tournament Predictions**: Flat list, no accordions, no color coding, always visible
- **Status Bar Layout**: Predictions + boosts on 2 separate lines (wastes vertical space)

## Solution Approach

1. **Apply UXI-006 accordion pattern to tournament predictions** - Create single accordion for entire "Predicciones de Torneo" section
2. **Display categories as cards** - Show Podio, Premios Individuales, Clasificados as cards inside accordion
3. **Add color coding** - ⚠️ Orange (incomplete), ✓ Green (complete), 🔒 Gray (locked)
4. **Smart auto-expand** - Expand if incomplete AND unlocked, collapsed otherwise
5. **Fix status bar layout** - Predictions + boosts on ONE line (desktop ≥960px), 2 lines (mobile)

## Architecture

### Pattern Comparison

| Aspect | Closing Soon Games (UXI-006) | Tournament Predictions (UXI-026) |
|--------|------------------------------|----------------------------------|
| **Accordion Count** | 3 accordions (red/orange/blue tiers) | 1 accordion (entire section) |
| **Content** | Individual game cards | Prediction category cards |
| **Urgency Type** | Time-based (countdown) | Completion-based (% done) |
| **Color System** | error/warning/info (red/orange/blue) | warning/success/disabled (orange/green/gray) |
| **Auto-Expand** | Yes if < 2h + unpredicted | Yes if incomplete + unlocked |

### Component Structure

```
PredictionStatusBar (updated)
├── Game Predictions Section (responsive layout fix)
│   ├── Predictions Label + Progress Bar
│   └── Boosts (2x/3x) - single line on desktop, wraps on mobile
│
├── TournamentPredictionAccordion (NEW)
│   ├── Accordion Summary (title + completion count)
│   └── Accordion Details
│       ├── TournamentPredictionCategoryCard (Podio) (NEW)
│       ├── TournamentPredictionCategoryCard (Premios) (NEW)
│       └── TournamentPredictionCategoryCard (Clasificados) (NEW, conditional)
│
└── Urgency Warnings Section (existing)
```

## Implementation Tasks

### Task 1: Create TournamentPredictionCategoryCard Component

**File**: `/Users/gvinokur/Personal/qatar-prode-story-67/app/components/tournament-prediction-category-card.tsx`

**Component Interface**:
```typescript
interface TournamentPredictionCategoryCardProps {
  readonly title: string;         // "Podio", "Premios Individuales", "Clasificados"
  readonly completed: number;     // e.g., 2
  readonly total: number;         // e.g., 3
  readonly link: string;          // `/tournaments/${id}/awards` or `/tournaments/${id}/playoffs`
  readonly isLocked: boolean;     // From isPredictionLocked
}
```

**Visual Design**:
- Use MUI `<Card>` with `variant="outlined"`
- Card is NOT a Link wrapper (avoids nested interactive elements anti-pattern)
- Only the "Completar" button is clickable (when incomplete + unlocked)
- Thicker border (2px) for incomplete, normal (1px) for complete/locked
- Color-coded icon: ⚠️ warning.main (incomplete), ✓ success.main (complete), 🔒 text.disabled (locked)
- Icon size: 16px (matches current CategoryStatus pattern)
- Layout: Icon + Title on left, Count + Action on right
- Show "Completar" button if incomplete + unlocked
- Show "Cerrado" chip if locked
- NO hover effect on card (only button is interactive)

**Pattern Source**: Based on UrgencyGameCard structure (app/components/urgency-game-card.tsx) but adapted for category display

**Typography**:
```typescript
// Title - 16px icon + body2 text
<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
  {getCategoryStatusIcon(isComplete, isLocked)}  // 16px icon
  <Typography variant="body2" color={isLocked ? 'text.disabled' : 'text.secondary'}>
    {title}
  </Typography>
</Box>

// Count - body2 medium weight
<Typography variant="body2" color="text.primary" fontWeight="medium">
  {completed}/{total} ({percentage}%)
</Typography>
```

**Key Functions**:
```typescript
function getCategoryStatusIcon(isComplete: boolean, isLocked: boolean): JSX.Element  // Returns 16px icon
function getCategoryCardBorderColor(isComplete: boolean, isLocked: boolean): string
function getCategoryCardBorderWidth(isComplete: boolean, isLocked: boolean): number
```

**Defensive Programming**:
```typescript
// Handle edge cases in completion calculation
const safeCompleted = Math.min(completed, total);  // Clamp to max of total
const percentage = total > 0 ? Math.round((safeCompleted / total) * 100) : 0;
```

**Accessibility**:
```typescript
// Card ARIA label for screen readers
<Card aria-label={`${title}: ${completed} de ${total} completado${completed !== 1 ? 's' : ''}`}>

// Button ARIA label
<Button
  component={Link}
  href={link}
  aria-label={`Completar ${title.toLowerCase()}`}
>
  Completar
</Button>
```

### Task 2: Create TournamentPredictionAccordion Component

**File**: `/Users/gvinokur/Personal/qatar-prode-story-67/app/components/tournament-prediction-accordion.tsx`

**Component Interface**:
```typescript
interface TournamentPredictionAccordionProps {
  readonly tournamentPredictions: TournamentPredictionCompletion;  // From db/tables-definition.ts
  readonly tournamentId: string;
  readonly isExpanded: boolean;
  readonly onToggle: () => void;
}
```

**Visual Design**:
- Use MUI `<Accordion>` following UrgencyAccordion pattern exactly (app/components/urgency-accordion.tsx:70-103)
- 4px left border with color based on state
- Accordion summary: Icon (24px) + Title text (body2, fontWeight: 600)
- Title format: "Predicciones de Torneo - {overallCompleted}/{overallTotal} ({overallPercentage}%)"
- Accordion details: 3 category cards (Podio, Premios, Clasificados)

**Typography**:
```typescript
// Accordion summary title - matches UrgencyAccordion pattern (line 99-100)
<Typography variant="body2" sx={{ fontWeight: 600 }}>
  Predicciones de Torneo - {tournamentPredictions.overallCompleted}/{tournamentPredictions.overallTotal} ({tournamentPredictions.overallPercentage}%)
</Typography>
```

**Color Logic**:
```typescript
function getAccordionColor(isPredictionLocked: boolean, overallPercentage: number) {
  if (isPredictionLocked) return 'text.disabled';     // Gray (locked)
  if (overallPercentage === 100) return 'success.main';  // Green (complete)
  return 'warning.main';                               // Orange (incomplete)
}
```

**Icon Logic** (24px default size - matches UrgencyAccordion pattern):
- 🔒 `<LockIcon color="disabled" />` - Locked (24px)
- ✓ `<CheckCircleIcon color="success" />` - Complete (100%) (24px)
- ⚠️ `<WarningIcon color="warning" />` - Incomplete (24px)

**Content Structure**:
```typescript
<AccordionDetails sx={{ pt: 2 }}>
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
    {/* Podio */}
    <TournamentPredictionCategoryCard
      title="Podio"
      completed={tournamentPredictions.finalStandings.completed}
      total={tournamentPredictions.finalStandings.total}
      link={`/tournaments/${tournamentId}/awards`}
      isLocked={tournamentPredictions.isPredictionLocked}
    />

    {/* Premios Individuales */}
    <TournamentPredictionCategoryCard
      title="Premios Individuales"
      completed={tournamentPredictions.awards.completed}
      total={tournamentPredictions.awards.total}
      link={`/tournaments/${tournamentId}/awards`}
      isLocked={tournamentPredictions.isPredictionLocked}
    />

    {/* Clasificados (conditional) */}
    {tournamentPredictions.qualifiers.total > 0 && (
      <TournamentPredictionCategoryCard
        title="Clasificados"
        completed={tournamentPredictions.qualifiers.completed}
        total={tournamentPredictions.qualifiers.total}
        link={`/tournaments/${tournamentId}/playoffs`}
        isLocked={tournamentPredictions.isPredictionLocked}
      />
    )}
  </Box>
</AccordionDetails>
```

**Pattern Source**: Direct adaptation of UrgencyAccordion (app/components/urgency-accordion.tsx)

### Task 3: Update PredictionStatusBar Component

**File**: `/Users/gvinokur/Personal/qatar-prode-story-67/app/components/prediction-status-bar.tsx`

**Changes**:

#### 3.1 Remove CategoryStatus Component
- Delete lines 101-186 (CategoryStatus component definition)
- This component is replaced by TournamentPredictionCategoryCard

#### 3.2 Fix Status Bar Layout (lines 305-334)

**Current Problem**: Single flex container with `flexWrap: 'wrap'` causes boosts to wrap unpredictably. On tablets (600-900px), boosts may wrap to second line even when there's visual space, creating inconsistent layout across screen sizes.

**Solution**: Use MUI responsive sx patterns with explicit breakpoint control

**IMPORTANT**: COMPLETELY REPLACE lines 305-334 (the entire Game Predictions Progress Section Box), do NOT just modify the existing code.

```typescript
{/* Game Predictions Progress Section */}
<Box sx={{
  display: 'flex',
  gap: 2,
  alignItems: 'center',
  mb: allWarnings.length > 0 || tournamentPredictions ? 2 : 0,
  // Mobile (≤960px): Stack vertically
  flexDirection: { xs: 'column', md: 'row' },
  // Mobile: Full width for each section
  alignItems: { xs: 'stretch', md: 'center' }
}}>
  {/* Predictions Label + Progress Bar Container */}
  <Box sx={{
    display: 'flex',
    gap: 2,
    alignItems: 'center',
    flexGrow: 1,
    minWidth: 0
  }}>
    <Typography
      variant="body2"
      color="text.secondary"
      fontWeight="medium"
      sx={{ minWidth: { xs: 'auto', md: '160px' } }}
    >
      Predicciones: {predictedGames}/{totalGames} ({percentage}%)
    </Typography>

    <LinearProgress
      variant="determinate"
      value={percentage}
      sx={{
        flexGrow: 1,
        minWidth: '100px',
        height: 8,
        borderRadius: 4
      }}
    />
  </Box>

  {/* Boost chips (if enabled) */}
  {showBoosts && (
    <Box sx={{
      display: 'flex',
      gap: 1,
      alignItems: 'center',
      flexShrink: 0
    }}>
      <Typography variant="body2" color="text.secondary" fontWeight="medium" sx={{ mr: 0.5 }}>
        Multiplicadores:
      </Typography>
      {silverMax > 0 && <BoostCountBadge type="silver" used={silverUsed} max={silverMax} />}
      {goldenMax > 0 && <BoostCountBadge type="golden" used={goldenUsed} max={goldenMax} />}
    </Box>
  )}
</Box>
```

**Breakpoint**: 900px (MUI's `md` breakpoint - theme.breakpoints.up('md'))
- **Desktop (≥900px)**: Single row - predictions + progress + boosts
- **Mobile (<900px)**: Two rows - predictions on row 1, boosts on row 2

**Note**: MUI breakpoints are: xs (0-599px), sm (600-899px), md (900-1199px), lg (1200px+)

#### 3.3 Replace Tournament Predictions Section (lines 336-369)

**Current Code**: Flat list with CategoryStatus components
```typescript
{/* OLD - TO BE REMOVED */}
{tournamentPredictions && tournamentId && (
  <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
    <Typography variant="body2" color="text.secondary" fontWeight="medium" sx={{ mb: 1 }}>
      Predicciones de Torneo
    </Typography>
    <CategoryStatus title="Podio" ... />
    <CategoryStatus title="Premios Individuales" ... />
    <CategoryStatus title="Clasificados" ... />
  </Box>
)}
```

**New Code**: Single accordion with category cards
```typescript
{/* NEW - Single accordion */}
{tournamentPredictions && tournamentId && (
  <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
    <TournamentPredictionAccordion
      tournamentPredictions={tournamentPredictions}
      tournamentId={tournamentId}
      isExpanded={tournamentAccordionExpanded}
      onToggle={() => setTournamentAccordionExpanded(prev => !prev)}
    />
  </Box>
)}
```

#### 3.4 Add Accordion State Management

**Add state** (near top of component):
```typescript
const [tournamentAccordionExpanded, setTournamentAccordionExpanded] = useState(false);
```

**Add auto-expand logic**:
```typescript
useEffect(() => {
  if (tournamentPredictions) {
    // Auto-expand if incomplete AND unlocked
    const shouldExpand =
      !tournamentPredictions.isPredictionLocked &&
      tournamentPredictions.overallPercentage < 100;

    setTournamentAccordionExpanded(shouldExpand);
  }
}, []); // Only run on mount - INTENTIONAL empty deps array
```

**Logic**: Following UXI-006 pattern (app/components/urgency-accordion-group.tsx:94-101), auto-expand on mount if action required

**Important Behavior Note**: The empty dependency array `[]` is intentional. The accordion:
- Auto-expands on initial page load if incomplete + unlocked
- Preserves user's manual toggle state after mount (doesn't unexpectedly collapse/expand while user is interacting)
- Does NOT react to live data changes (e.g., if user completes final category, accordion won't auto-collapse)
- Resets to auto-expand logic only on page reload/remount

This matches UXI-006's behavior and prevents jarring UX where the accordion collapses while the user is viewing it.

#### 3.5 Update Imports

**CRITICAL**: PredictionStatusBar currently only imports `{ useContext, useMemo }` from React. You MUST add `useState` and `useEffect`.

```typescript
// BEFORE (line 1):
import React, { useContext, useMemo } from 'react';

// AFTER:
import React, { useContext, useMemo, useState, useEffect } from 'react';

// Add new component import
import { TournamentPredictionAccordion } from './tournament-prediction-accordion';

// CategoryStatus is removed, so no import needed for TournamentPredictionCategoryCard
// (it's used internally by TournamentPredictionAccordion)
```

### Task 4: Create Tests

#### 4.1 TournamentPredictionCategoryCard Tests

**File**: `/Users/gvinokur/Personal/qatar-prode-story-67/__tests__/components/tournament-prediction-category-card.test.tsx`

**Test Cases**:
1. **Rendering**: Title, completion count, percentage calculation
2. **Complete State**: Green checkmark icon (16px), no "Completar" button, normal border (1px), card is not clickable
3. **Incomplete State**: Orange warning icon (16px), "Completar" button visible and functional, thicker border (2px), button is clickable Link
4. **Locked State**: Gray lock icon (16px), "Cerrado" chip visible, no "Completar" button, card is not clickable
5. **Border Widths**: Incomplete cards have 2px border, complete/locked have 1px border
6. **Edge Cases**:
   - completed=0, total=0 → Shows 0/0 (0%), renders without errors
   - completed > total → Clamped to total (defensive programming)
   - Very long category titles → Text wraps or truncates gracefully
7. **Accessibility**:
   - Incomplete cards: "Completar" button is keyboard navigable (Tab to focus, Enter to follow link)
   - Locked/complete cards: No focusable interactive elements
   - Proper ARIA labels on card and button (e.g., "Podio: 2 de 3 completados")
   - Icon colors have sufficient contrast

#### 4.2 TournamentPredictionAccordion Tests

**File**: `/Users/gvinokur/Personal/qatar-prode-story-67/__tests__/components/tournament-prediction-accordion.test.tsx`

**Test Cases**:
1. **Rendering**: Summary with correct completion count, correct icon/color based on state, icon size is 24px
2. **Auto-expand Logic**:
   - Auto-expands when incomplete + unlocked
   - Does NOT auto-expand when complete (100%)
   - Does NOT auto-expand when locked
   - Does NOT auto-expand when incomplete but locked
3. **Categories**: Renders all 3 categories, hides Clasificados if total is 0
4. **Interaction**: Toggles expanded state on click, calls onToggle callback
5. **Border Colors**: Correct color for incomplete (warning.main/orange), complete (success.main/green), locked (text.disabled/gray)
6. **Empty State**: Handles tournamentPredictions with overallTotal = 0 gracefully

#### 4.3 PredictionStatusBar Tests (Update Existing)

**File**: `/Users/gvinokur/Personal/qatar-prode-story-67/__tests__/components/prediction-status-bar.test.tsx`

**New Test Cases**:
1. **Tournament Accordion**:
   - Renders accordion when tournamentPredictions provided
   - Does NOT render accordion when tournamentPredictions is undefined
   - Passes correct props to TournamentPredictionAccordion
2. **Layout**: Predictions and boosts in correct responsive structure
3. **Auto-expand**: Tournament accordion auto-expands for incomplete + unlocked state

**Update Existing Tests**:
- Replace CategoryStatus assertions with TournamentPredictionAccordion assertions
- Update snapshots if needed

## Data Flow

```
Server (Tournament Page)
  ↓
Fetch TournamentPredictionCompletion from repository
  ↓
Pass to PredictionStatusBar component
  ↓
PredictionStatusBar
  ├── Calculates auto-expand state (useEffect on mount)
  └── Renders TournamentPredictionAccordion
        ↓
      TournamentPredictionAccordion
        ├── Displays overall completion in summary
        ├── Color-codes border based on state
        └── Renders 3 TournamentPredictionCategoryCard components
              ↓
            TournamentPredictionCategoryCard
              ├── Displays category-specific completion
              ├── Acts as Link to edit page (if incomplete + unlocked)
              └── Shows "Completar" button or "Cerrado" chip
```

## Visual Design Tokens

### Color System

| State | Border Color | Border Width | Icon | Icon Color | Chip |
|-------|-------------|--------------|------|------------|------|
| **Incomplete + Unlocked** | `warning.main` (orange) | 4px (accordion) / 2px (card) | ⚠️ WarningIcon (24px accordion, 16px card) | `warning.main` | - |
| **Complete** | `success.main` (accordion) / `divider` (card) | 4px (accordion) / 1px (card) | ✓ CheckCircleIcon (24px accordion, 16px card) | `success.main` | - |
| **Locked** | `text.disabled` (accordion) / `divider` (card) | 4px (accordion) / 1px (card) | 🔒 LockIcon (24px accordion, 16px card) | `text.disabled` | "Cerrado" |

**Clarification**: Accordion uses color-coded left border (`success.main` for complete, `text.disabled` for locked). Cards use neutral `divider` border for complete/locked states to de-emphasize them, with only incomplete cards using `warning.main` to draw attention.

### MUI Theme Tokens Used

- `theme.palette.warning.main` - Orange for incomplete state
- `theme.palette.success.main` - Green for complete state
- `theme.palette.text.disabled` - Gray for locked state
- `theme.palette.divider` - Default border color
- `theme.palette.error.main` - Red for "REQUIEREN ACCIÓN" sections (reference only)

### Responsive Breakpoints

- `xs`: 0-599px (mobile)
- `sm`: 600-899px (tablet)
- `md`: 900-1199px (desktop) ← **Primary breakpoint for layout change**
- `lg`: 1200px+ (large desktop)

**Note**: MUI's `md` breakpoint is 900px, not 960px. Using `{ xs: 'column', md: 'row' }` means the layout switches from column to row at 900px.

## Edge Cases

1. **Qualifiers count = 0**: Hide Clasificados card entirely (conditional rendering)
2. **Tournament predictions undefined**: Don't render accordion (conditional rendering)
3. **Locked state after auto-expand**: User sees locked content but can't edit
4. **Mobile narrow screens**: Cards are full width, text wraps if needed
5. **Dark mode**: All MUI theme tokens support dark mode automatically

## Integration Points

### No Changes Required

- `/tournaments/[id]/awards` page - Edit page for Podio + Premios (unchanged)
- `/tournaments/[id]/playoffs` page - Edit page for Clasificados (unchanged)
- `app/components/awards/award-panel.tsx` - Edit dialogs (unchanged)
- `app/db/tournament-prediction-completion-repository.ts` - Data fetching (unchanged)
- `app/actions/guesses-actions.ts` - Save logic (unchanged)

### Pages Using PredictionStatusBar

1. **Tournament Home** (`app/tournaments/[id]/page.tsx`) - Shows full component with tournament predictions
2. **Playoff Pages** (`app/tournaments/[id]/playoffs/page.tsx`) - Via PredictionDashboard wrapper
3. **Friend Groups** - Does NOT use PredictionStatusBar

## Critical Files

### New Files (2)
- `/Users/gvinokur/Personal/qatar-prode-story-67/app/components/tournament-prediction-accordion.tsx` (~150 lines)
- `/Users/gvinokur/Personal/qatar-prode-story-67/app/components/tournament-prediction-category-card.tsx` (~100 lines)

### Modified Files (1)
- `/Users/gvinokur/Personal/qatar-prode-story-67/app/components/prediction-status-bar.tsx`
  - Remove CategoryStatus component (~85 lines)
  - Update status bar layout (~30 lines)
  - Replace tournament section (~30 lines)
  - Add accordion state (~10 lines)

### Test Files (3)
- `/Users/gvinokur/Personal/qatar-prode-story-67/__tests__/components/tournament-prediction-accordion.test.tsx` (new, ~200 lines)
- `/Users/gvinokur/Personal/qatar-prode-story-67/__tests__/components/tournament-prediction-category-card.test.tsx` (new, ~150 lines)
- `/Users/gvinokur/Personal/qatar-prode-story-67/__tests__/components/prediction-status-bar.test.tsx` (update, ~50 lines changed)

### Reference Files (Pattern Sources)
- `/Users/gvinokur/Personal/qatar-prode/app/components/urgency-accordion.tsx` - Accordion pattern
- `/Users/gvinokur/Personal/qatar-prode/app/components/urgency-accordion-group.tsx` - Auto-expand logic
- `/Users/gvinokur/Personal/qatar-prode/app/components/urgency-game-card.tsx` - Card pattern
- `/Users/gvinokur/Personal/qatar-prode/app/db/tables-definition.ts` - TournamentPredictionCompletion interface

## Implementation Sequence

### Wave 1: Category Card (Standalone)
1. Create `TournamentPredictionCategoryCard` component
2. Implement color logic, icon logic, click behavior
3. Write comprehensive tests
4. Verify component works standalone

### Wave 2: Accordion Component (Uses category card)
1. Create `TournamentPredictionAccordion` component
2. Implement summary title, border color, icon
3. Render 3 category cards inside AccordionDetails
4. Write comprehensive tests
5. Verify component works standalone

### Wave 3: Integration (Update existing component)
1. Update PredictionStatusBar imports
2. Remove CategoryStatus component
3. Fix status bar layout with responsive patterns
4. Replace tournament section with accordion
5. Add accordion state + auto-expand logic
6. Update existing tests

### Wave 4: Testing & Refinement
1. Run all tests
2. Test responsive behavior at 900px breakpoint (MUI's `md`)
3. Test auto-expand logic
4. Test navigation to edit pages
5. Test dark mode (toggle theme, verify colors, contrast, visibility)
6. Manual QA on tournament home page

## Verification Plan

### Manual Testing

1. **Visual Consistency**:
   - Tournament predictions accordion matches urgency accordions style
   - Color coding is consistent (orange/green/gray)
   - Left border is 4px and clearly visible

2. **Auto-Expand Logic**:
   - Load tournament page with incomplete predictions (unlocked) → Accordion auto-expands
   - Load tournament page with complete predictions → Accordion collapsed
   - Load tournament page with locked predictions → Accordion collapsed

3. **Status Bar Layout**:
   - Desktop (≥900px): Predictions + progress + boosts on ONE line
   - Mobile (<900px): Predictions on line 1, boosts on line 2
   - Test at 899px and 900px to verify breakpoint transition
   - Progress bar fills available space correctly

4. **Category Cards**:
   - Click incomplete category → Navigate to edit page
   - Locked categories show "Cerrado" chip and are not clickable
   - Complete categories show green checkmark
   - Hover effects work on incomplete cards

5. **Edge Cases**:
   - Tournament with qualifiers.total = 0 → Clasificados card hidden
   - Tournament without predictions prop → No accordion rendered

### Automated Testing

```bash
# Run all tests
npm run test

# Run specific test files
npm run test tournament-prediction-accordion.test.tsx
npm run test tournament-prediction-category-card.test.tsx
npm run test prediction-status-bar.test.tsx
```

### Linting & Build

```bash
# Check for lint errors
npm run lint

# Production build
npm run build
```

## Success Criteria

- [ ] Tournament predictions section is a single collapsible accordion
- [ ] Accordion shows overall completion in title (e.g., "Predicciones de Torneo - 37/39 (95%)")
- [ ] Color coding at accordion level: ⚠️ Orange (incomplete), ✓ Green (complete), 🔒 Gray (locked)
- [ ] Auto-expand logic: Expanded if incomplete + unlocked, collapsed otherwise
- [ ] Three categories (Podio, Premios, Clasificados) displayed as cards inside accordion
- [ ] Cards show individual completion status and state
- [ ] Cards are clickable Links when incomplete + unlocked
- [ ] Status bar + boosts fit on single line on desktop (≥960px)
- [ ] Status bar uses 2 lines on mobile (<960px)
- [ ] Visual consistency with closing soon games accordion pattern (UXI-006)
- [ ] All existing functionality preserved (edit dialogs, locking logic, navigation)
- [ ] No performance regressions
- [ ] All tests passing (≥80% coverage on new code)

## Out of Scope

- Animation transitions for accordion expand/collapse
- Drag-to-reorder tournament prediction categories
- Customizable default state preferences
- "Complete all" bulk action button
- Individual category accordions (nested accordions)
- Changes to edit pages or save logic
