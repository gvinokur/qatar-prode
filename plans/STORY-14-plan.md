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
- [ ] Shows base points earned ("+2 points! (Exact score)")
- [ ] Shows boosted points with multiplier ("+6 points! (2 pts x3 boost)")
- [ ] Counter animation from 0 to final value
- [ ] Confetti animation for correct predictions
- [ ] Trophy icon bounce animation
- [ ] Clickable overlay shows point breakdown tooltip
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
  - Description: Text like "Exact score" or "Correct winner"

#### 2. Create Point Display Components

**New file**: `app/components/game-card-point-overlay.tsx` (Client Component)
- Props: `points`, `baseScore`, `multiplier`, `boostType`, `scoreDescription`, `onBreakdownClick`
- Layout: Overlay badge positioned top-right of game card
- Animation: Framer-motion counter from 0 to final value
- Style: Success/primary color with semi-transparent background
- Shows: "+6 points" prominently with small boost indicator

**New file**: `app/components/point-breakdown-tooltip.tsx` (Client Component)
- Props: `baseScore`, `multiplier`, `scoreDescription`, `boostType`
- Content:
  ```
  Point Breakdown
  Base: 2 points (Exact score)
  Boost: 3x (Golden)
  Total: 6 points
  ```
- Uses MUI Tooltip or custom Popover

**New file**: `app/components/celebration-effects.tsx` (Client Component)
- Confetti animation using `framer-motion`
- Trophy bounce animation
- Triggered when points > 0

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

#### Confetti Animation
- Use framer-motion particles or simple CSS confetti
- Trigger once on mount if points > 0
- Brief animation (1-2 seconds)

#### Trophy Bounce
- Apply to boost icon when boosted points earned
- Scale + spring animation via framer-motion

## Implementation Steps

### Phase 1: Point Calculation Logic
1. Create `app/utils/point-calculator.ts`
   - Implement `calculateFinalPoints()` function
   - Add score description mapping (0="Miss", 1="Correct winner", 2="Exact score")
   - Export types: `PointCalculation` interface

2. Write unit tests for point calculator
   - Test unboosted scores (0, 1, 2 points)
   - Test silver boost (2x multiplier)
   - Test golden boost (3x multiplier)
   - Test edge cases (null boost, 0 score with boost)

### Phase 2: Point Display Components
3. Create `app/components/game-card-point-overlay.tsx`
   - Client component with framer-motion counter
   - Badge/chip style with prominent point value
   - Click handler for breakdown
   - Conditional rendering (only show when results exist)

4. Create `app/components/point-breakdown-tooltip.tsx`
   - Simple tooltip/popover with breakdown table
   - Show base, multiplier, total
   - Include score description and boost type

5. Create `app/components/celebration-effects.tsx`
   - Confetti component using framer-motion
   - Trophy bounce animation component
   - Both trigger automatically on correct predictions

### Phase 3: Integration
6. Update `app/components/compact-game-view-card.tsx`
   - Import point calculator and overlay component
   - Calculate final points from scoreForGame + boostType
   - Add point overlay after game result available
   - Wire up breakdown tooltip click handler
   - Position overlay (top-right corner via Badge or absolute)

7. Handle edge cases
   - No result yet: Don't show overlay
   - Score is 0: Show "0 points" with subdued styling (no animation)
   - Boost but 0 score: Show multiplier but no celebration

### Phase 4: Visual Polish
8. Add animations
   - Counter animation (0 → final value)
   - Fade-in entrance
   - Confetti for scores > 0
   - Trophy bounce for boosted scores

9. Styling consistency
   - Use theme colors (success.main for points)
   - Match existing boost chip styling
   - Ensure readability on light/dark themes
   - Mobile responsive sizing

### Phase 5: Testing
10. Write component tests
    - GameCardPointOverlay rendering
    - Counter animation behavior
    - Breakdown tooltip interaction
    - Celebration effects triggering

11. Manual testing checklist
    - [ ] Point overlay appears after game result
    - [ ] Counter animates smoothly
    - [ ] Breakdown tooltip shows on click
    - [ ] Confetti appears for correct predictions
    - [ ] Trophy bounces for boosted games
    - [ ] Works on mobile viewport
    - [ ] Dark mode styling correct
    - [ ] No layout shift or overlap with existing elements

## Testing Strategy

### Unit Tests
- `__tests__/utils/point-calculator.test.ts`
  - Test all score combinations (0, 1, 2) × boost types (none, silver, golden)
  - Test score descriptions
  - Test edge cases

### Component Tests
- `__tests__/components/game-card-point-overlay.test.ts`
  - Rendering with different point values
  - Click interaction for breakdown
  - Animation presence (framer-motion render check)

- `__tests__/components/point-breakdown-tooltip.test.ts`
  - Content rendering
  - Correct calculations displayed

- `__tests__/components/compact-game-view-card.test.ts`
  - Update existing tests to verify point overlay appears
  - Test conditional rendering (with/without result)
  - Test boost integration

### Manual Testing
1. **Unboosted game**:
   - Make exact score prediction → Verify "+2 points! (Exact score)" appears
   - Make winner prediction → Verify "+1 point! (Correct winner)" appears
   - Make wrong prediction → Verify "0 points" appears (subdued)

2. **Boosted game**:
   - Silver boost exact score → Verify "+4 points! (2 pts x2 boost)" with trophy bounce
   - Golden boost exact score → Verify "+6 points! (2 pts x3 boost)" with trophy bounce

3. **Breakdown tooltip**:
   - Click point overlay → Verify breakdown shows base, multiplier, total

4. **Animations**:
   - Verify counter counts up smoothly
   - Verify confetti appears briefly for correct predictions
   - Verify trophy bounces for boosted games

5. **Visual**:
   - Check alignment and positioning (no overlap)
   - Test on mobile (responsive sizing)
   - Verify dark mode appearance

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

## Open Questions
None - requirements are clear from story description and exploration findings.

## Success Criteria
- Point overlays display correctly on all game cards with results
- Animations enhance emotional engagement (confetti, counter, bounce)
- Boost multipliers are clearly communicated
- Breakdown tooltip provides detailed scoring information
- No layout issues or visual regressions
- Tests pass with 60%+ coverage
