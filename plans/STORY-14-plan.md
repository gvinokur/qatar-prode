# Plan: Point Value Display on Game Cards (#14)

## Story Context
- **Epic**: UX Audit 2026
- **Milestone**: Sprint 1-2: Critical Fixes (Due: 2026-02-14)
- **Priority**: Critical (🔥🔥🔥)
- **Size Estimate**: Low (1-2 days)

## Objective
Add point value displays on game cards that show users how many points they earned immediately after game results are available, with animations and boost multiplier effects.

## Acceptance Criteria
- [ ] Point value overlay appears on game cards when results are available
- [ ] Shows base points earned ("+2 puntos! (Resultado exacto)")
- [ ] Shows boosted points with multiplier ("+6 puntos! (2 pts x3 multiplicador)")
- [ ] Counter animation from 0 to final value
- [ ] Celebration animation for correct predictions (confetti/trophy)
- [ ] "Suffering" animation for 0 points (shake/sad effect)
- [ ] Animations play ONCE per game (first visit after completion), not every page load
- [ ] Clickable overlay shows point breakdown tooltip
- [ ] All text in Latam/Argentinean Spanish
- [ ] User understanding of scoring: +50%
- [ ] Emotional engagement: +40%
- [ ] Boost feature awareness: +30%

## Technical Approach

### Current State Analysis
From exploration:
- Game cards in `compact-game-view-card.tsx` show minimal score (small icons only)
- Base scoring works via `game-score-calculator.ts` (returns 0, 1, or 2 points)
- Boost system exists (`boost_type` stored) but final score calculation incomplete
- `framer-motion` library installed but unused - perfect for animations
- MUI Badge, Chip, Tooltip components available

### Architecture Changes

#### 1. Add Point Calculation Utility
**New file**: `app/utils/point-calculator.ts`
- Function: `calculateFinalPoints(baseScore, boostType)`
  - Returns: `{ baseScore, multiplier, finalScore, description }`
  - Multiplier: silver=2x, golden=3x, none=1x
  - Description: Spanish text like "Resultado exacto", "Ganador correcto", "Errado"
- Score descriptions in Spanish:
  - 0 points: "Errado"
  - 1 point: "Ganador correcto"
  - 2 points: "Resultado exacto"

#### 2. Create Point Display Components

**New file**: `app/components/game-card-point-overlay.tsx` (Client Component)
- Props: `points`, `baseScore`, `multiplier`, `boostType`, `scoreDescription`, `gameId`, `onBreakdownClick`
- Layout: Overlay badge positioned top-right of game card
- Animation: Framer-motion counter from 0 to final value
- Style: Success/primary color for points > 0, error color for 0 points
- Shows: "+6 puntos" prominently with small boost indicator
- Tracks animation state in localStorage using gameId to play animations only once
- Spanish text throughout

**New file**: `app/components/point-breakdown-tooltip.tsx` (Client Component)
- Props: `baseScore`, `multiplier`, `scoreDescription`, `boostType`
- Content in Spanish:
  ```
  Desglose de Puntos
  Base: 2 puntos (Resultado exacto)
  Multiplicador: 3x (Dorado)
  Total: 6 puntos
  ```
- Uses MUI Tooltip or custom Popover
- All labels in Spanish

**New file**: `app/components/celebration-effects.tsx` (Client Component)
- Celebration animations for correct predictions (points > 0):
  - Confetti animation using `framer-motion`
  - Trophy bounce animation
- "Suffering" animation for missed predictions (0 points):
  - Shake/wobble animation
  - Red flash or sad emoji effect
  - Makes users "feel" their miss (competitive element)
- Uses localStorage (keyed by gameId) to ensure animations play only ONCE per game
- Checks `game-animations-shown-${gameId}` flag before triggering

### Files to Modify

#### 1. `app/components/compact-game-view-card.tsx`
**Changes:**
- Import new `GameCardPointOverlay` component
- Calculate final points using `calculateFinalPoints(scoreForGame, boostType)`
- Add point overlay when `gameResult` exists and `scoreForGame !== null`
- Position overlay using MUI Badge or absolute positioning
- Add click handler to show breakdown tooltip
- Keep existing small icon display for backwards compatibility (or remove if redundant)

**Line references:**
- Lines 220-225: Current score icon display (may replace or supplement)
- Lines 166-183: Current boost chip (integrate with point display)

#### 2. `app/components/game-view.tsx`
**Changes:**
- No major changes needed, already calculates `scoreForGame` via `calculateScoreForGame()`
- Ensure `boostType` is passed down (already happening)

#### 3. `app/db/tables-definition.ts` (GameGuessTable)
**Changes:**
- Consider adding `final_score_calculated` timestamp field (optional)
- Verify `boost_multiplier` and `final_score` fields exist (lines 200-226)
- May need migration if we want to store calculated final scores

### Dependencies
- **Existing**: `framer-motion@12.11.0` (already installed)
- **No new packages needed**

### Animation Strategy

#### Play Once Logic
**Critical requirement**: Animations should play only ONCE per game - the first time the user visits after game completion. Not on every page load.

**Implementation**:
- Use localStorage to track: `game-animations-shown-${gameId}` = true
- On component mount, check if animations already shown
- If not shown: trigger animations + set flag
- If already shown: skip animations, show static overlay only
- This prevents animation overload when displaying 6+ games on one page

#### Counter Animation (framer-motion)
```tsx
<motion.span
  initial={{ opacity: 0, scale: 0.5 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 0.3 }}
>
  <motion.span
    initial={{ innerText: 0 }}
    animate={{ innerText: finalPoints }}
    transition={{ duration: 0.8, ease: "easeOut" }}
  />
</motion.span>
```

#### Celebration Animations (points > 0)
- Confetti: framer-motion particles or simple CSS confetti
- Trophy bounce: Scale + spring animation for boosted games
- Brief animations (1-2 seconds)
- Only trigger if localStorage flag not set

#### "Suffering" Animation (0 points)
- Shake/wobble animation on the game card
- Red flash overlay or sad emoji (😭)
- Makes users "feel" their miss - competitive element
- Duration: 1-2 seconds
- Only trigger if localStorage flag not set

## Implementation Steps

### Phase 1: Point Calculation Logic
1. Create `app/utils/point-calculator.ts`
   - Implement `calculateFinalPoints()` function
   - Add Spanish score description mapping:
     - 0 = "Errado"
     - 1 = "Ganador correcto"
     - 2 = "Resultado exacto"
   - Export types: `PointCalculation` interface
   - All text constants in Spanish

2. Write unit tests for point calculator
   - Test unboosted scores (0, 1, 2 points)
   - Test silver boost (2x multiplier)
   - Test golden boost (3x multiplier)
   - Test edge cases (null boost, 0 score with boost)
   - Verify Spanish descriptions

### Phase 2: Point Display Components
3. Create `app/components/game-card-point-overlay.tsx`
   - Client component with framer-motion counter
   - Badge/chip style with prominent point value
   - Click handler for breakdown
   - Conditional rendering (only show when results exist)
   - localStorage check: `game-animations-shown-${gameId}`
   - All text in Spanish (e.g., "+6 puntos")
   - Pass gameId for animation tracking

4. Create `app/components/point-breakdown-tooltip.tsx`
   - Simple tooltip/popover with breakdown table
   - Show base, multiplier, total
   - Include score description and boost type
   - All labels in Spanish:
     - "Desglose de Puntos" (header)
     - "Base", "Multiplicador", "Total" (labels)
     - "Dorado", "Plateado" (boost types)

5. Create `app/components/celebration-effects.tsx`
   - Celebration animations (points > 0):
     - Confetti using framer-motion
     - Trophy bounce animation
   - "Suffering" animations (0 points):
     - Shake/wobble effect
     - Red flash or sad emoji
   - localStorage integration to play only once:
     - Check flag on mount
     - Set flag after first play
     - Skip if already played

### Phase 3: Integration
6. Update `app/components/compact-game-view-card.tsx`
   - Import point calculator and overlay component
   - Calculate final points from scoreForGame + boostType
   - Add point overlay after game result available
   - Pass gameId to overlay for animation tracking
   - Wire up breakdown tooltip click handler
   - Position overlay (top-right corner via Badge or absolute)
   - Ensure all text is in Spanish

7. Handle edge cases
   - No result yet: Don't show overlay
   - Score is 0: Show "0 puntos" with error styling + suffering animation (once)
   - Boost but 0 score: Show multiplier but trigger suffering animation instead of celebration
   - Already animated: Show static overlay without animations

### Phase 4: Visual Polish
8. Add animations with localStorage tracking
   - Counter animation (0 → final value)
   - Fade-in entrance
   - Celebration animations (scores > 0):
     - Confetti
     - Trophy bounce for boosted scores
   - "Suffering" animation (0 points):
     - Shake/wobble
     - Red flash or sad emoji
   - localStorage logic:
     - Check `game-animations-shown-${gameId}` before animating
     - Set flag after first animation
     - Ensures animations play only once per game

9. Styling consistency
   - Use theme colors:
     - success.main for points > 0
     - error.main for 0 points
   - Match existing boost chip styling
   - Ensure readability on light/dark themes
   - Mobile responsive sizing
   - Spanish text throughout

### Phase 5: Testing
10. Write component tests
    - GameCardPointOverlay rendering
    - Counter animation behavior
    - Breakdown tooltip interaction
    - Celebration effects triggering
    - "Suffering" animation for 0 points
    - localStorage tracking (mock localStorage)
    - Animation skip logic when flag is set
    - Spanish text rendering

11. Manual testing checklist
    - [ ] Point overlay appears after game result
    - [ ] Counter animates smoothly
    - [ ] Breakdown tooltip shows on click (Spanish text)
    - [ ] Celebration animations for correct predictions (first visit only)
    - [ ] "Suffering" animation for 0 points (first visit only)
    - [ ] Trophy bounces for boosted games
    - [ ] Animations do NOT replay on page refresh
    - [ ] Works on mobile viewport
    - [ ] Dark mode styling correct
    - [ ] No layout shift or overlap with existing elements
    - [ ] All text is in Spanish
    - [ ] Test with 6+ games on same page (no animation overload)

## Testing Strategy

### Unit Tests
- `__tests__/utils/point-calculator.test.ts`
  - Test all score combinations (0, 1, 2) × boost types (none, silver, golden)
  - Test Spanish score descriptions ("Errado", "Ganador correcto", "Resultado exacto")
  - Test edge cases
  - Verify correct Spanish text for all outputs

### Component Tests
- `__tests__/components/game-card-point-overlay.test.ts`
  - Rendering with different point values
  - Spanish text rendering ("+2 puntos", "0 puntos")
  - Click interaction for breakdown
  - Animation presence (framer-motion render check)
  - localStorage tracking:
    - Mock localStorage
    - Verify flag is set after animation
    - Verify animations skip when flag exists

- `__tests__/components/point-breakdown-tooltip.test.ts`
  - Content rendering in Spanish
  - Correct calculations displayed
  - Spanish labels ("Desglose de Puntos", "Base", "Multiplicador", "Total")

- `__tests__/components/celebration-effects.test.ts`
  - Celebration animations trigger for points > 0
  - "Suffering" animation triggers for 0 points
  - localStorage tracking works correctly
  - Animations skip when flag is set

- `__tests__/components/compact-game-view-card.test.ts`
  - Update existing tests to verify point overlay appears
  - Test conditional rendering (with/without result)
  - Test boost integration
  - Verify gameId is passed to overlay

### Manual Testing
1. **Unboosted game (Spanish text)**:
   - Make exact score prediction → Verify "+2 puntos! (Resultado exacto)" appears
   - Make winner prediction → Verify "+1 punto! (Ganador correcto)" appears
   - Make wrong prediction → Verify "0 puntos (Errado)" appears with shake animation

2. **Boosted game (Spanish text)**:
   - Silver boost exact score → Verify "+4 puntos! (2 pts x2 multiplicador)" with trophy bounce
   - Golden boost exact score → Verify "+6 puntos! (2 pts x3 multiplicador)" with trophy bounce

3. **Breakdown tooltip (Spanish)**:
   - Click point overlay → Verify breakdown shows:
     - "Desglose de Puntos" (header)
     - "Base: X puntos (description)"
     - "Multiplicador: Xx (type)"
     - "Total: X puntos"

4. **Animations (play once logic)**:
   - First visit after game completion:
     - Counter animates smoothly
     - Confetti appears for correct predictions
     - Shake animation for 0 points
     - Trophy bounces for boosted games
   - Refresh page:
     - Animations do NOT replay
     - Static overlay remains visible
   - Clear localStorage:
     - Animations play again (verify flag works)
   - Test with 6+ games on page:
     - No animation overload or performance issues

5. **Visual**:
   - Check alignment and positioning (no overlap)
   - Test on mobile (responsive sizing)
   - Verify dark mode appearance
   - All text in Spanish
   - Error color (red) for 0 points, success color (green) for > 0 points

## Rollout Considerations

### Breaking Changes
None - this is a purely additive feature.

### Migration Steps
None required - no database schema changes needed for initial implementation.

Optional future enhancement: Store `final_score` in `game_guesses` table for performance (avoid recalculation).

### Feature Flags
Not needed - feature is always-on once deployed.

### Performance Notes
- Point calculation is lightweight (simple multiplication)
- Framer-motion animations are GPU-accelerated
- Confetti should be brief to avoid performance issues on low-end devices

## Key Design Decisions (from Review Feedback)

### 1. Animation Frequency - Play Once
**Problem**: Displaying 6+ games on one page, animations on every page load would be overwhelming.

**Solution**: Use localStorage to track `game-animations-shown-${gameId}` flag:
- First visit after game completion: Play animations
- Subsequent visits: Show static overlay, skip animations
- This provides emotional impact without performance issues

### 2. Zero Points Animation
**Problem**: Original plan had subdued styling with no animation for 0 points.

**Solution**: Add "suffering" animation for missed predictions:
- Shake/wobble effect on game card
- Red flash or sad emoji
- Makes users "feel" their miss (competitive element)
- Also respects play-once logic via localStorage

### 3. Language - Spanish
**Problem**: Original plan had English text.

**Solution**: All visible text in Latam/Argentinean Spanish:
- "+2 puntos! (Resultado exacto)"
- "0 puntos (Errado)"
- "Desglose de Puntos" (breakdown header)
- "Multiplicador: 2x (Plateado)"
- Consistent Spanish throughout UI

## Open Questions
None - all requirements clarified through review feedback.

## Success Criteria
- Point overlays display correctly on all game cards with results
- Animations enhance emotional engagement (confetti, counter, bounce)
- Boost multipliers are clearly communicated
- Breakdown tooltip provides detailed scoring information
- No layout issues or visual regressions
- Tests pass with 60%+ coverage
