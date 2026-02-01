# Implementation Plan: Story #17 - Enhanced Boost Popover

## Story Context

**Issue:** [UXI-007] Boost Strategy View
**Simplified Scope:** Enhance existing boost popover with strategic information
**Worktree:** `/Users/gvinokur/Personal/qatar-prode-story-17`
**Branch:** `feature/story-17`

### Problem
Users currently lack visibility into:
- Where their boosts are allocated (which groups/playoffs)
- Risk of losing unused boosts
- Boost performance/ROI (points earned from boosted games)

The existing boost popover only explains what boosts mean (2x or 3x multiplier), not how they're being used strategically.

### Solution
Enhance the existing boost popover in the prediction dashboard with three new information sections:

1. **Boost Usage Overview** - Show where boosts are allocated by specific tournament groups (A, B, C) and playoffs
2. **Boost Risk Warning** - Alert when boosts might expire unused
3. **Boost Performance Summary** - Show points earned on boosted games that have been scored

**Out of Scope:**
- Peer comparison (too complex, requires new data tables)
- Drag-and-drop boost reallocation (keep current assignment method)
- Heat map visualization (can be added in future iteration)

## Acceptance Criteria

- [ ] When clicking a boost badge (silver or golden), popover shows information ONLY for that boost type
- [ ] Boost Usage section displays allocation by specific groups (e.g., "Grupo A: 2, Grupo B: 1") and playoffs separately
- [ ] Risk Warning appears when: `(max - used) > 0 AND (totalGames - predictedGames) < (max - used + buffer)`
- [ ] Performance Summary shows total bonus points earned from boosted games that have been scored
- [ ] All sections handle edge cases gracefully (no boosts, no scored games, etc.)
- [ ] Loading state shown while fetching breakdown data
- [ ] All text in Spanish (app language)
- [ ] Unit tests for new repository query, server action, and component
- [ ] SonarCloud: 80% coverage on new code, 0 new issues

## Technical Approach

### Architecture

**Current State:**
- `/Users/gvinokur/Personal/qatar-prode-story-17/app/components/prediction-status-bar.tsx` (lines 333-356)
- Inline Popover component with simple title + description
- Triggered by clicking BoostCountBadge chips

**New Approach:**
1. Extract popover into separate component: `boost-info-popover.tsx`
2. Add new repository query for boost allocation breakdown
3. Add new server action to fetch breakdown data
4. Popover fetches data on mount and displays three conditional sections

### Data Layer

**New Repository Query:** `getBoostAllocationBreakdown()`
- **File:** `/Users/gvinokur/Personal/qatar-prode-story-17/app/db/game-guess-repository.ts`
- **Parameters:** `userId: string, tournamentId: string, boostType: 'silver' | 'golden'`
- **Returns:**
```typescript
{
  byGroup: { groupLetter: string; count: number }[];  // [{ groupLetter: 'A', count: 2 }, ...]
  playoffCount: number;
  totalBoosts: number;
  scoredGamesCount: number;  // Games with this boost type that have been scored
  totalPointsEarned: number;  // Sum of boost bonus (final_score - score) for scored games
}
```

**Query Logic:**
```typescript
// Two separate queries for clarity and correctness:

// 1. Group stage boosts
SELECT
  tg.group_letter,
  COUNT(*) as count,
  SUM(CASE WHEN gg.final_score IS NOT NULL THEN 1 ELSE 0 END) as scored_games,
  SUM(CASE
    WHEN gg.final_score IS NOT NULL
    THEN gg.final_score - COALESCE(gg.score, 0)  // Boost bonus = extra points from multiplier
    ELSE 0
  END) as boost_bonus
FROM game_guesses gg
INNER JOIN games g ON g.id = gg.game_id
INNER JOIN tournament_group_games tgg ON tgg.game_id = g.id  // Only group games
INNER JOIN tournament_groups tg ON tg.id = tgg.tournament_group_id
WHERE gg.user_id = ?
  AND g.tournament_id = ?
  AND gg.boost_type = ?
GROUP BY tg.group_letter
ORDER BY tg.group_letter

// 2. Playoff boosts (separate query)
SELECT
  COUNT(*) as count,
  SUM(CASE WHEN gg.final_score IS NOT NULL THEN 1 ELSE 0 END) as scored_games,
  SUM(CASE
    WHEN gg.final_score IS NOT NULL
    THEN gg.final_score - COALESCE(gg.score, 0)
    ELSE 0
  END) as boost_bonus
FROM game_guesses gg
INNER JOIN games g ON g.id = gg.game_id
INNER JOIN tournament_playoff_round_games prg ON prg.game_id = g.id  // Only playoff games
WHERE gg.user_id = ?
  AND g.tournament_id = ?
  AND gg.boost_type = ?
```

**Note on Calculation:**
- `score` = Base points (0, 1, or 2) before boost multiplier
- `final_score` = Points after boost multiplier (score * multiplier)
- `boost_bonus` = Extra points earned from boost = final_score - score
- Example: score=2 (exact guess), boost_multiplier=2.0 → final_score=4, boost_bonus=2

**New Server Action:** `getBoostAllocationBreakdownAction()`
- **File:** `/Users/gvinokur/Personal/qatar-prode-story-17/app/actions/game-boost-actions.ts`
- Validates user session
- Calls repository function
- Returns data for client component

### UI Component

**New Component:** `boost-info-popover.tsx`
- **Location:** `/Users/gvinokur/Personal/qatar-prode-story-17/app/components/boost-info-popover.tsx`
- **Type:** Client component (`'use client'`)
- **Props:**
```typescript
{
  boostType: 'silver' | 'golden';
  used: number;
  max: number;
  tournamentId: string;
  totalGames: number;
  predictedGames: number;
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
}
```

**Component Structure:**
```
┌──────────────────────────────────────┐
│ 🏆 Multiplicador x2                 │  <- Header (keep existing)
│                                      │
│ Duplica los puntos obtenidos        │  <- Description (keep existing)
│                                      │
│ ───────────────────────────────────  │
│                                      │
│ DISTRIBUCIÓN DE BOOSTS               │  <- NEW: Usage section
│                                      │
│ • Grupo A: 2 partidos               │
│ • Grupo B: 1 partido                │
│ • Playoffs: 1 partido               │
│                                      │
│ Total: 4 de 5 usados                │
│                                      │
│ ───────────────────────────────────  │
│                                      │
│ ⚠️ ALERTA DE RIESGO                 │  <- NEW: Risk warning (conditional)
│                                      │
│ Tienes 1 boost sin usar y solo      │
│ quedan 2 partidos para predecir.    │
│ ¡Úsalo antes de que cierre!         │
│                                      │
│ ───────────────────────────────────  │
│                                      │
│ RENDIMIENTO                          │  <- NEW: Performance (conditional)
│                                      │
│ Ganaste 8 puntos extra en 4         │
│ partidos boosteados calificados     │
│                                      │
└──────────────────────────────────────┘
```

**Material-UI Components:**
- `Popover` - Container
- `Box` - Layout and sections
- `Typography` - Text (variants: subtitle2, body2, caption)
- `Divider` - Section separators
- `CircularProgress` - Loading state
- `Alert` - Risk warning (severity="warning")

**Responsive Design:**
- Max width: 320px (fits mobile)
- Padding: theme.spacing(2)
- Typography responsive with body2/caption variants

### Integration

**Update PredictionStatusBar:**
- Replace inline Popover (lines 333-356)
- Import and use BoostInfoPopover component
- Pass required props from existing state

**Before:**
```tsx
<Popover open={boostPopoverOpen} anchorEl={boostAnchorEl} onClose={handleBoostClose}>
  <Box sx={{ p: 2, minWidth: 200 }}>
    <Typography variant="subtitle2" fontWeight="bold">
      {activeBoostType === 'silver' ? 'Multiplicador x2' : 'Multiplicador x3'}
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
      {activeBoostType === 'silver'
        ? 'Duplica los puntos obtenidos en este partido'
        : 'Triplica los puntos obtenidos en este partido'}
    </Typography>
  </Box>
</Popover>
```

**After:**
```tsx
<BoostInfoPopover
  open={boostPopoverOpen}
  anchorEl={boostAnchorEl}
  onClose={handleBoostClose}
  boostType={activeBoostType}
  used={activeBoostType === 'silver' ? silverUsed : goldenUsed}
  max={activeBoostType === 'silver' ? silverMax : goldenMax}
  tournamentId={tournamentId}
  totalGames={totalGames}
  predictedGames={predictedGames}
/>
```

## Files to Create/Modify

### Create (3 files)
1. `/Users/gvinokur/Personal/qatar-prode-story-17/app/components/boost-info-popover.tsx`
   - New enhanced popover component with three sections

2. `/Users/gvinokur/Personal/qatar-prode-story-17/__tests__/components/boost-info-popover.test.tsx`
   - Component tests for all sections and edge cases

3. `/Users/gvinokur/Personal/qatar-prode-story-17/__tests__/db/game-guess-repository-boost-breakdown.test.ts`
   - Unit tests for new repository query function

### Modify (3 files)
1. `/Users/gvinokur/Personal/qatar-prode-story-17/app/db/game-guess-repository.ts`
   - Add `getBoostAllocationBreakdown()` function

2. `/Users/gvinokur/Personal/qatar-prode-story-17/app/actions/game-boost-actions.ts`
   - Add `getBoostAllocationBreakdownAction()` server action

3. `/Users/gvinokur/Personal/qatar-prode-story-17/app/components/prediction-status-bar.tsx`
   - Replace inline Popover with BoostInfoPopover component

## Implementation Steps

### Wave 1: Data Layer (Backend)
1. **Add repository query function**
   - File: `app/db/game-guess-repository.ts`
   - Function: `getBoostAllocationBreakdown(userId, tournamentId, boostType)`
   - Query joins: game_guesses → games → tournament_group_games → tournament_groups
   - Aggregate by group_letter and calculate boost bonus for scored games
   - Handle null group_letter (playoff games)

2. **Add server action**
   - File: `app/actions/game-boost-actions.ts`
   - Function: `getBoostAllocationBreakdownAction(tournamentId, boostType)`
   - Validate user session with `requireUser()`
   - Call repository function
   - Return typed result

3. **Write data layer tests**
   - File: `__tests__/db/game-guess-repository-boost-breakdown.test.ts`
   - Test cases:
     - No boosts allocated
     - Boosts in multiple groups
     - Mix of group and playoff boosts
     - No scored games yet
     - Some scored, some not scored
     - Correct boost bonus calculation

### Wave 2: UI Component (Frontend)
4. **Create BoostInfoPopover component**
   - File: `app/components/boost-info-popover.tsx`
   - Client component with `'use client'` directive
   - Fetch breakdown data on mount using server action (only if tournamentId provided)
   - **Always visible:** Header section + description (existing content)
   - **Loading state:** Show "Cargando..." in distribution section while fetching
   - **After load:** Render distribution section (new)
   - **Conditionally render:** Risk warning section (only if showWarning = true)
   - **Conditionally render:** Performance section (only if scoredGamesCount > 0)
   - Handle error state with fallback message in distribution section
   - Handle missing tournamentId gracefully (show error, don't crash)

5. **Write component tests**
   - File: `__tests__/components/boost-info-popover.test.tsx`
   - Test cases:
     - Renders all sections when data available
     - Shows loading state while fetching
     - Hides risk warning when no risk
     - Hides performance when no scored games
     - Handles fetch errors gracefully
     - Correct Spanish text rendering
     - Popover opens/closes properly

### Wave 3: Integration
6. **Update PredictionStatusBar**
   - File: `app/components/prediction-status-bar.tsx`
   - Import BoostInfoPopover component
   - Replace inline Popover (lines 333-356)
   - Pass props: boostType, used, max, tournamentId, totalGames, predictedGames
   - Note: tournamentId is already available as optional prop (line 22: `tournamentId?: string`)
   - Handle undefined tournamentId case (component will show error message)

7. **Update existing tests**
   - File: `__tests__/components/prediction-status-bar.test.tsx`
   - Update tests to account for new component
   - Verify popover still opens on badge click

8. **Manual testing scenarios**
   - No boosts allocated yet
   - Some boosts allocated but no games scored
   - All boosts used with some games scored
   - Risk scenario: Few unpredicted games left
   - No risk scenario: Many unpredicted games left
   - All games predicted and scored

## Testing Strategy

### Unit Tests

**Repository Tests** (`__tests__/db/game-guess-repository-boost-breakdown.test.ts`):
- ✅ Returns empty data when no boosts allocated
- ✅ Aggregates boosts correctly by group letter
- ✅ Separates playoff boosts from group boosts
- ✅ Calculates boost bonus only for scored games
- ✅ Handles mix of scored and unscored games
- ✅ Returns correct totals

**Server Action Tests** (add to existing `__tests__/actions/game-boost-actions.test.ts`):
- ✅ Validates user authentication (unauthenticated → throws error)
- ✅ Validates tournament ID (invalid → throws error)
- ✅ Validates boost type (invalid → throws error)
- ✅ Calls repository with correct parameters
- ✅ Returns correctly formatted data
- ✅ Handles database connection errors gracefully
- ✅ Handles empty result set (no boosts allocated)

**Component Tests** (`__tests__/components/boost-info-popover.test.tsx`):
- ✅ Renders header and description (always visible)
- ✅ Shows header + description while loading breakdown (not full spinner)
- ✅ Renders distribution section with group breakdown
- ✅ Shows "Aún no has usado boosts de este tipo" when byGroup is empty
- ✅ Shows risk warning when unused boosts > games left
- ✅ Hides risk warning when no risk
- ✅ Shows performance section when scored games exist
- ✅ Hides performance section when no scored games (scoredGamesCount = 0)
- ✅ Handles data fetch errors gracefully (shows error message, popover doesn't crash)
- ✅ Closes popover when onClose called
- ✅ Handles missing tournamentId prop gracefully

### Integration Tests

**PredictionStatusBar Tests** (update existing):
- ✅ Popover opens on silver badge click
- ✅ Popover opens on golden badge click
- ✅ Correct boost type passed to popover
- ✅ Popover closes on outside click

### Edge Cases

1. **No boosts allocated** (byGroup: [], playoffCount: 0) → Show "Aún no has usado boosts de este tipo" in distribution section
2. **All boosts used** (used === max) → Show full distribution, no risk warning section
3. **No games scored yet** (scoredGamesCount === 0) → Hide performance section entirely
4. **No unpredicted games left** (gamesLeft === 0) → Hide risk warning section
5. **Loading state** → Show header + description while loading. Distribution section shows "Cargando..." with small CircularProgress
6. **Fetch error** → Show error message in distribution section: "Error al cargar datos. Intenta de nuevo."
7. **Missing tournamentId** (undefined) → Show error message: "Información no disponible" and disable data fetching

## Risk Warning Logic

**Constants:**
```typescript
const RISK_WARNING_BUFFER = 3;  // Show warning when games left < unused boosts + buffer
```

**Formula:**
```typescript
const unusedBoosts = max - used;
const gamesLeft = totalGames - predictedGames;
const showWarning = unusedBoosts > 0 && gamesLeft < (unusedBoosts + RISK_WARNING_BUFFER);
```

**Risk Levels:**
- **High Risk** (error): `gamesLeft <= unusedBoosts` → "⚠️ Tienes X boost(s) sin usar y solo quedan Y partido(s)"
- **Medium Risk** (warning): `gamesLeft <= unusedBoosts + 2` → Show warning with less urgency
- **Low Risk**: `gamesLeft > unusedBoosts + RISK_WARNING_BUFFER` → No warning

**Example Scenarios:**
- 5 unused boosts, 3 games left → High Risk (3 <= 5)
- 2 unused boosts, 4 games left → Medium Risk (4 <= 2 + 2)
- 1 unused boost, 5 games left → Low Risk (5 > 1 + 3), no warning

## Spanish Translations

All text already in Spanish:
- "DISTRIBUCIÓN DE BOOSTS"
- "Grupo A", "Grupo B", etc.
- "Playoffs"
- "Total: X de Y usados"
- "ALERTA DE RIESGO"
- "Tienes X boost(s) sin usar y solo quedan Y partidos para predecir"
- "RENDIMIENTO"
- "Ganaste X puntos extra en Y partidos boosteados calificados"
- "Aún no has usado boosts de este tipo"
- "Cargando..."

## Performance Considerations

- Breakdown query called **on-demand** (when popover opens)
- Cache result in component state to avoid refetching on re-open
- Query is lightweight (single aggregation)
- No impact on page load (lazy loaded)
- Uses `cache()` wrapper for server-side deduplication

## Accessibility

- Popover uses Material-UI built-in accessibility
- Proper ARIA labels and roles
- Keyboard navigation (Escape to close)
- Focus management handled by MUI
- Color contrast meets WCAG AA standards

## Validation Considerations

### SonarCloud Quality Gates
- **Coverage:** Target 80%+ on all new code
- **Duplicated Code:** Keep under 5%
- **Cognitive Complexity:** Keep functions simple and focused
- **Security:** No SQL injection (using Kysely query builder)

### Pre-merge Checklist
- [ ] All unit tests passing
- [ ] Integration tests updated and passing
- [ ] Manual testing completed for all scenarios
- [ ] ESLint: No errors
- [ ] Build: No errors
- [ ] SonarCloud: 0 new issues
- [ ] Coverage: ≥80% on new code

## Future Enhancements (Out of Scope)

1. Heat map visualization of boost allocation across tournament
2. Peer comparison - "80% of your group boosted this game"
3. ROI calculator - Historical boost effectiveness trends
4. Suggested boost strategy (AI-powered)
5. Drag-and-drop boost reallocation interface

## Critical Files

**Data Layer:**
- `/Users/gvinokur/Personal/qatar-prode-story-17/app/db/game-guess-repository.ts`
- `/Users/gvinokur/Personal/qatar-prode-story-17/app/actions/game-boost-actions.ts`

**UI Layer:**
- `/Users/gvinokur/Personal/qatar-prode-story-17/app/components/boost-info-popover.tsx` (new)
- `/Users/gvinokur/Personal/qatar-prode-story-17/app/components/prediction-status-bar.tsx`

**Tests:**
- `/Users/gvinokur/Personal/qatar-prode-story-17/__tests__/db/game-guess-repository-boost-breakdown.test.ts` (new)
- `/Users/gvinokur/Personal/qatar-prode-story-17/__tests__/components/boost-info-popover.test.tsx` (new)
- `/Users/gvinokur/Personal/qatar-prode-story-17/__tests__/components/prediction-status-bar.test.tsx`

## Dependencies

No new dependencies required. Using existing:
- Material-UI (Popover, Box, Typography, Alert, CircularProgress, Divider)
- Kysely (SQL query builder)
- React (hooks: useState, useEffect)
- Vitest (testing)
