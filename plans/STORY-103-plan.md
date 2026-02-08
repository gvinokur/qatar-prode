# Implementation Plan: Story #103 - Backoffice Game Management Improvements

## Story Context

**Issue:** #103 - [UXI] Backoffice Game Management Improvements

**Objective:** Enhance backoffice game management with:
1. Flippable game cards (consistent with end-user experience)
2. Auto-fill functionality to generate realistic test scores using Poisson distribution
3. Clear functionality to unpublish all games in a group/round

**Target Users:** Tournament administrators managing game data

---

## Acceptance Criteria

### Feature 1: Flippable Game Cards in Backoffice
- [ ] Backoffice game cards have the same flip interaction as end-user game cards
- [ ] Front shows basic game info (teams, time, status)
- [ ] Back shows score editing interface
- [ ] Animation is smooth and consistent with end-user experience
- [ ] Works for both group stage and playoff games
- [ ] Maintains existing publish/unpublish toggle functionality

### Feature 2: Auto-fill Game Scores for Testing
- [ ] "Auto-fill Scores" button available for each group in group stage
- [ ] "Auto-fill Scores" button available for each playoff round
- [ ] Scores generated using Poisson distribution (λ = 1.35)
- [ ] Auto-fill only affects games without results OR games with draft results (skips published games)
- [ ] Generated scores are immediately published (visible to users)
- [ ] Auto-fill triggers full recalculation pipeline (playoff games, group positions, scores, qualified teams)
- [ ] Visual feedback during generation process (loading state)
- [ ] Success notification after completion showing count of games filled

### Feature 3: Clear Game Scores
- [ ] "Clear Scores" button available for each group/round
- [ ] Clear unpublishes all games in that group/round by deleting game_results records
- [ ] Clear triggers full recalculation pipeline (cleans up guess scores, recalculates positions)
- [ ] Confirmation dialog before clearing scores (shows count: "Clear scores from X games in Group A?")
- [ ] Visual feedback during clearing process
- [ ] Success notification after completion showing count of games cleared

---

## Visual Prototypes

### Prototype 1: Flippable Game Card in Backoffice

#### Front Side (Read-Only View)
```
┌─────────────────────────────────────────────┐
│  [Edit ↻]                    [☑️ Published] │ ← Action buttons
├─────────────────────────────────────────────┤
│                                             │
│        GAME 12 · Starts in 2 days          │
│                                             │
│   ┌──────┐                       ┌──────┐  │
│   │ ARG  │  Argentina     2  :  1│ BRA  │  │ ← Team logos + scores
│   └──────┘                       └──────┘  │
│                                             │
│              📍 Lusail Stadium              │
│                                             │
└─────────────────────────────────────────────┘
```

**Layout Details:**
- Card background: White with subtle shadow
- Edit button (top-left): Icon button with rotate icon
- Published checkbox (top-right): Toggle between draft/published
- Game info: Centered, game number + countdown timer
- Teams: Horizontal layout with logos (48x48px), names, scores
- Location: Bottom, centered with pin icon

**States:**
- **Draft**: Red checkbox outline, "DRAFT" chip badge
- **Published**: Green checkbox filled, no badge
- **Hover**: Slight elevation increase, edit button highlight

#### Back Side (Edit View - Click Edit to Flip)
```
┌─────────────────────────────────────────────┐
│            Edit Game Result                 │ ← Header
├─────────────────────────────────────────────┤
│                                             │
│  Argentina                          Brazil  │
│  ┌─────────┐                      ┌─────────┐
│  │    2    │                      │    1    │ ← Score inputs
│  └─────────┘                      └─────────┘
│                                             │
│  [IF playoff & tied scores:]                │
│                                             │
│  Penalty Shootout Winner:                   │
│  ○ Argentina    ○ Brazil                    │ ← Radio selection
│                                             │
│  📅 Dec 18, 2025  ⏰ 18:00 (Local)         │ ← Date/time display
│                                             │
│          [Cancel]        [Save Result]      │ ← Action buttons
│                                             │
└─────────────────────────────────────────────┘
```

**Layout Details:**
- Same card dimensions as front
- Score inputs: Large number inputs (centered, 60px font size)
- Penalty section: Only visible when playoff game with tied scores
- Date/time: Read-only display at bottom
- Buttons: Cancel (text button) + Save Result (contained button)

**Animation:**
- Same 3D flip as end-user cards (0.4s ease-in-out)
- Respects prefers-reduced-motion
- Focus management: After flip, focus first input
- After save/cancel: Flip back and focus edit button

---

### Prototype 2: Auto-fill & Clear Buttons Layout

#### Groups Tab Header (Example: Group A)
```
┌───────────────────────────────────────────────────────────┐
│  Group A                            [⚙️ Bulk Actions ▾]   │ ← Dropdown menu
└───────────────────────────────────────────────────────────┘

[Dropdown expanded:]
┌────────────────────────────┐
│ 🎲 Auto-fill Scores        │ ← Generate scores option
│ 🗑️  Clear All Scores       │ ← Clear scores option
└────────────────────────────┘
```

#### Playoff Tab Header (Example: Quarterfinals)
```
┌───────────────────────────────────────────────────────────┐
│  Quarterfinals                      [⚙️ Bulk Actions ▾]   │ ← Dropdown menu
└───────────────────────────────────────────────────────────┘

[Same dropdown with Auto-fill + Clear options]
```

**UI Placement:**
- Dropdown button in section header (top-right corner)
- Icon: Settings gear + down arrow
- Menu items with icons for visual clarity
- Separated by divider if needed

**States:**
- **Normal**: Outlined button, neutral color
- **Loading**: Disabled with circular progress indicator
- **Success**: Brief green checkmark, then return to normal

---

### Prototype 3: Confirmation Dialog (Clear Scores)

```
┌─────────────────────────────────────────────┐
│  ⚠️  Clear All Scores in Group A?           │
│                                             │
│  This will:                                 │
│  • Remove all scores from games in Group A │
│  • Set all games to DRAFT status           │
│  • Hide results from end users             │
│                                             │
│  This action cannot be undone.              │
│                                             │
│          [Cancel]     [Clear Scores]        │
│                                             │
└─────────────────────────────────────────────┘
```

**Dialog Details:**
- Warning icon (yellow/orange)
- Clear explanation of consequences
- Bullet list for readability
- Cancel button (text, neutral)
- Clear button (contained, warning color)

---

### Prototype 4: Loading & Success States

#### During Auto-fill (Overlay on section)
```
┌─────────────────────────────────────────────┐
│                                             │
│           [○ ○ ○]  Loading...              │ ← Circular progress
│                                             │
│     Generating scores for Group A...        │
│                                             │
└─────────────────────────────────────────────┘
```

#### Success Notification (Snackbar)
```
┌─────────────────────────────────────────────┐
│  ✓  Auto-filled 6 games in Group A          │ [X]
└─────────────────────────────────────────────┘
```

---

## Technical Approach

### 1. Flippable Game Cards

**Strategy:** Adapt existing `FlippableGameCard` component for backoffice use

**Current State:**
- End-user: `FlippableGameCard` wraps `GameView` (read) + `GamePredictionEditControls` (edit)
- Backoffice: `BackofficeGameView` wraps `CompactGameViewCard` + `GameResultEditDialog` (modal)

**Implementation:**
1. Create new component: `BackofficeFlippableGameCard`
2. Reuse flip animation logic from `FlippableGameCard`
3. Front side: Adapt `CompactGameViewCard` (keep publish toggle, remove dialog trigger)
4. Back side: Create `BackofficeGameResultEditControls` (inline editing like end-user, but for game results)
5. Replace `BackofficeGameView` usage in `group-backoffice-tab.tsx` and `playoff-tab.tsx`

**Key Differences from End-User Card:**
- Front: Show publish/draft status (checkbox)
- Back: Edit game results (not guesses), include date/time picker
- Admin-only component (no auth checks needed in component)

**Animation Details:**
- Same 3D transform: `rotateY(180deg)`
- Same timing: 0.4s (desktop), 0.5s (mobile)
- Extract animation constants to shared utility to avoid duplication:
  - `FLIP_DURATION_DESKTOP = 0.4`
  - `FLIP_DURATION_MOBILE = 0.5`
  - Reuse from `FlippableGameCard` or create shared constant file
- Preserve backface-visibility and z-index management
- Focus management for accessibility
- Respect `prefers-reduced-motion` (set transition to 'none' when enabled)

### 2. Poisson Distribution Score Generator

**Mathematical Approach:**
- Use Poisson distribution with λ = 1.35 (average goals per team)
- Generate independent scores for home and away teams
- Round to nearest integer, minimum 0

**Implementation:**
1. Create utility function: `generatePoissonScore(lambda: number): number`
   - Use inverse transform sampling or Knuth algorithm
   - Return integer ≥ 0
2. Create utility function: `generateMatchScore(lambda: number = 1.35): { homeScore: number, awayScore: number, homePenaltyScore?: number, awayPenaltyScore?: number }`
   - Generate independent home/away scores using Poisson(λ=1.35)
   - For playoff games: If scores equal (natural tie), generate penalty scores:
     - Use Poisson(λ=3) for each team's penalty score (realistic shootout)
     - Cap at 5 per team (max shootout rounds)
     - Add 1 to one team randomly (ensures winner)
3. Create server action: `autoFillGameScores(groupId?, playoffRoundId?)`
   - Query all games in group/round
   - Filter: Only games without results OR games with draft results (skip published)
   - Generate scores for each filtered game
   - Set `is_draft = false` (publish immediately)
   - Save via bulk operation (transactional)
   - Trigger full recalculation pipeline:
     - `calculateAndSavePlayoffGamesForTournament()` (update playoff matchups)
     - `calculateAndStoreGroupPosition()` (recalculate group standings)
     - `calculateGameScores()` (calculate user guess scores)
     - `calculateAndStoreQualifiedTeamsPoints()` (update qualified teams)
   - Return count of updated games and count of skipped games

**Poisson Generation Algorithm (Knuth):**
```typescript
function generatePoissonScore(lambda: number): number {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;

  do {
    k++;
    p *= Math.random();
  } while (p > L);

  return k - 1;
}
```

### 3. Clear Scores Functionality

**Implementation:**
1. Create server action: `clearGameScores(groupId?, playoffRoundId?)`
   - Verify admin authorization (reject non-admin with 401)
   - Query all games in group/round with results
   - DELETE game_results records (chosen approach - cleaner and aligns with "clear" semantics)
   - Operation is transactional (all succeed or all fail)
   - Trigger full recalculation pipeline:
     - `calculateGameScores(false, false)` (cleans up guess scores for cleared games)
     - `calculateAndStoreGroupPosition()` (recalculate group standings without these results)
     - `calculateAndStoreQualifiedTeamsPoints()` (update qualified teams)
   - Return count of cleared games

**Database Operations:**
- **Chosen approach: DELETE game_results records**
- Rationale: Cleaner, aligns with "clear" semantics, simpler than null handling
- Foreign key constraints verified (game_results.game_id allows deletion)

### 4. UI Integration

**Bulk Actions Dropdown:**
1. Create component: `BulkActionsMenu`
   - Props: `groupId?`, `playoffRoundId?`, `sectionName` (e.g., "Group A")
   - Menu items: "Auto-fill Scores", "Clear All Scores"
   - Triggers: Server actions with loading states
2. Add to `group-backoffice-tab.tsx` header
3. Add to `playoff-tab.tsx` section headers

**Confirmation Dialog:**
1. Create generic: `ConfirmDialog` (enables future reuse in backoffice)
   - Generic confirmation with customizable content
   - Props: `open`, `title`, `message`, `onConfirm`, `onCancel`, `confirmColor`
2. Show before clear operation with specific message:
   - Title: "Clear All Scores in [Section Name]?"
   - Message: "Clear scores from X games in [Section]? This will remove all scores and set games to DRAFT status."
3. Show operation in progress (loading overlay)

**Notifications:**
1. Use existing notification system (Snackbar)
2. Auto-fill success: "Auto-filled X games in [section] (skipped Y published games)"
3. Clear success: "Cleared scores from X games in [section]"
4. Error: "Failed to [operation]: [error message]"

---

## Files to Create/Modify

### New Files
1. **`/app/components/backoffice/backoffice-flippable-game-card.tsx`**
   - Main flippable card component for backoffice
   - Wraps front (view) and back (edit) sides

2. **`/app/components/backoffice/backoffice-game-result-edit-controls.tsx`**
   - Inline edit controls (back side of card)
   - Score inputs, penalty selection, date/time, save/cancel

3. **`/app/components/backoffice/bulk-actions-menu.tsx`**
   - Dropdown menu for auto-fill and clear actions
   - Handles loading states and confirmations

4. **`/app/actions/game-score-generator-actions.ts`**
   - `autoFillGameScores(groupId?, playoffRoundId?)`
   - `clearGameScores(groupId?, playoffRoundId?)`
   - Admin authorization checks

5. **`/app/utils/poisson-generator.ts`**
   - `generatePoissonScore(lambda: number): number`
   - `generateMatchScore(lambda?: number): { homeScore, awayScore, homePenaltyScore?, awayPenaltyScore? }`

6. **`/app/components/confirm-dialog.tsx`**
   - Generic confirmation dialog (reusable)
   - Or adapt existing if one exists

### Modified Files
1. **`/app/components/backoffice/group-backoffice-tab.tsx`**
   - Replace `BackofficeGameView` with `BackofficeFlippableGameCard`
   - Add `BulkActionsMenu` to header
   - Update save handlers to work with flippable cards

2. **`/app/components/backoffice/playoff-tab.tsx`**
   - Replace `BackofficeGameView` with `BackofficeFlippableGameCard`
   - Add `BulkActionsMenu` to each round section header

3. **`/app/components/backoffice/groups-backoffice-tab.tsx`**
   - May need minor adjustments for layout consistency

### Files to Reference (No Changes)
- `/app/components/flippable-game-card.tsx` - Reference for animation logic
- `/app/components/compact-game-view-card.tsx` - Reference for front side content
- `/app/components/game-result-edit-dialog.tsx` - Reference for edit form fields
- `/app/actions/backoffice-actions.ts` - Reference for existing bulk operations
- `/app/db/game-repository.ts` - Query games by group/round

---

## Implementation Steps

### Phase 1: Poisson Score Generator (Foundation)
1. Create `poisson-generator.ts` utility
   - Implement `generatePoissonScore()` with Knuth algorithm
   - Implement `generateMatchScore()` with playoff tie handling
   - Add input validation (lambda > 0)

2. Create server actions in `game-score-generator-actions.ts`
   - `autoFillGameScores()`: Query games, filter unpublished, generate scores, bulk save, publish, trigger recalculation
   - `clearGameScores()`: Query games, delete results, trigger recalculation
   - Add admin authorization checks at start of each action (use pattern from `backoffice-actions.ts`)
   - Wrap operations in transactions (all succeed or all fail)
   - Add error handling with descriptive messages:
     - DB constraint violations
     - Permission denied (401)
     - Invalid game state
     - Network/connection errors

3. Unit tests for Poisson generator
   - Test distribution properties (mean approximates lambda)
   - Test edge cases (lambda = 0, very large lambda)
   - Test match score generation (home/away independence, playoff penalties)

### Phase 2: Flippable Game Card Components
4. Create `BackofficeGameResultEditControls` component
   - Score input fields (number inputs with large font)
   - Penalty selection (radio buttons for playoff ties)
   - Date/time picker (from existing dialog)
   - Save/Cancel buttons
   - Form validation
   - Loading states during save

5. Create `BackofficeFlippableGameCard` component
   - Reuse flip animation logic from `FlippableGameCard`
   - Front side: Adapted `CompactGameViewCard` (no dialog trigger)
   - Back side: `BackofficeGameResultEditControls`
   - Maintain publish/draft toggle on front
   - Handle edit button click → flip to back
   - Handle save/cancel → flip to front
   - Focus management for accessibility

6. Unit tests for flippable card
   - Test flip animation triggers
   - Test edit/save/cancel flow
   - Test keyboard navigation
   - Test publish toggle integration
   - Test reduced motion support

### Phase 3: Bulk Actions UI
7. Create `BulkActionsMenu` component
   - Dropdown button with settings icon
   - Menu items: Auto-fill, Clear
   - Click handlers for each action
   - Loading states (disable button, show progress)
   - Success/error notifications

8. Create `ConfirmDialog` component
   - Generic confirmation dialog
   - Customizable title, message, button text
   - Warning styling for destructive actions
   - Keyboard support (Escape to cancel, Enter to confirm)

9. Unit tests for bulk actions
   - Test menu open/close
   - Test confirmation dialog flow
   - Test loading states
   - Test error handling

### Phase 4: Integration
10. Update `group-backoffice-tab.tsx`
    - Replace `BackofficeGameView` with `BackofficeFlippableGameCard`
    - Add `BulkActionsMenu` to group header
    - Connect auto-fill and clear actions
    - Update save handlers if needed
    - Test with multiple groups

11. Update `playoff-tab.tsx`
    - Replace `BackofficeGameView` with `BackofficeFlippableGameCard`
    - Add `BulkActionsMenu` to each round header
    - Connect auto-fill and clear actions
    - Handle round-specific operations
    - Test with all playoff rounds

12. Integration tests
    - Test flippable card in group context
    - Test flippable card in playoff context
    - Test auto-fill for group
    - Test auto-fill for playoff round
    - Test clear for group
    - Test clear for playoff round
    - Test confirmation flow
    - Test notifications

### Phase 5: Polish & Edge Cases
13. Edge case handling
    - Auto-fill with no games in section
    - Clear with no results to clear
    - Auto-fill during ongoing operation
    - Network errors during bulk operations
    - Permission errors (non-admin trying to access)

14. Visual polish
    - Ensure animation smoothness
    - Verify responsive layout (mobile, tablet, desktop)
    - Test dark mode compatibility (if applicable)
    - Verify loading indicators
    - Test notification timing and placement

15. Accessibility audit
    - Keyboard navigation through flippable cards
    - Screen reader announcements
    - Focus management during flips
    - ARIA labels for all interactive elements
    - Color contrast validation

---

## Testing Strategy

### Unit Tests

**Poisson Generator (`poisson-generator.test.ts`):**
- Test `generatePoissonScore()` returns non-negative integers
- Test distribution mean approximates lambda (run 10,000 samples)
- Test `generateMatchScore()` returns valid match score object with homeScore and awayScore
- Test playoff ties generate penalty scores (homePenaltyScore, awayPenaltyScore)
- Test penalty scores are capped at 5 per team
- Test penalty winner is determined (one team has +1 penalty score)
- Test edge cases: lambda = 0, lambda = 10
- Use test utilities from `@/__tests__/db/test-factories` for mock data

**Server Actions (`game-score-generator-actions.test.ts`):**
- Mock game repository queries using `@/__tests__/db/mock-helpers`
- Test `autoFillGameScores()` generates and saves scores for unpublished games
- Test `autoFillGameScores()` skips games with published results
- Test `autoFillGameScores()` publishes results (is_draft = false)
- Test `autoFillGameScores()` triggers recalculation pipeline
- Test `autoFillGameScores()` returns correct count (filled + skipped)
- Test `clearGameScores()` deletes game_results records
- Test `clearGameScores()` triggers recalculation pipeline
- Test `clearGameScores()` returns correct count of cleared games
- Test admin authorization (reject non-admin users with 401)
- Test transactional behavior (all succeed or all fail)
- Test error handling (database errors, validation errors, permission denied)

**Flippable Card (`backoffice-flippable-game-card.test.ts`):**
- Test component renders with game data
- Test edit button triggers flip animation
- Test save button flips back and calls onSave
- Test cancel button flips back without saving
- Test publish toggle works on front side
- Test keyboard navigation (Tab, Enter, Escape)
- Test reduced motion support

**Bulk Actions Menu (`bulk-actions-menu.test.ts`):**
- Test menu opens/closes
- Test auto-fill triggers server action
- Test clear shows confirmation dialog
- Test loading states disable interactions
- Test success notification shows
- Test error notification shows

**Edit Controls (`backoffice-game-result-edit-controls.test.ts`):**
- Test score inputs accept numbers
- Test penalty selection shows for playoff ties
- Test save button validates inputs
- Test cancel button discards changes
- Test form validation (required fields)

### Integration Tests

**Groups Tab (`group-backoffice-tab.integration.test.tsx`):**
- Test flippable cards render for all games in group
- Test auto-fill updates all game cards
- Test clear removes scores from all cards
- Test edit → save → flip back flow
- Test multiple groups work independently

**Playoff Tab (`playoff-tab.integration.test.tsx`):**
- Test flippable cards render for playoff games
- Test auto-fill by round updates correct games
- Test clear by round affects only that round
- Test penalty score handling for tied games

**End-to-End Flow:**
1. Navigate to backoffice → Groups → Group A
2. Click bulk actions → Auto-fill scores
3. Verify all games show generated scores
4. Click on game card → Edit button
5. Card flips to show edit controls
6. Modify score
7. Click Save
8. Card flips back with updated score
9. Click bulk actions → Clear scores
10. Confirm in dialog
11. Verify all scores cleared and games unpublished

### Visual Regression Tests
- Screenshot comparison of flippable card (front and back)
- Screenshot of bulk actions menu
- Screenshot of confirmation dialog
- Animation timing verification (flip duration)

---

## Validation Considerations

### SonarCloud Requirements
- **Code coverage:** ≥80% on new code (all new files must have comprehensive tests)
- **0 new issues** of any severity (bugs, code smells, vulnerabilities)
- **Security:** No hardcoded lambda value in production (use constant or config)
- **Maintainability:** Keep components focused (single responsibility)
- **Duplicated code:** <5% (reuse flip animation, avoid copy-paste)

### Quality Gates
1. **Before commit:**
   - All unit tests pass
   - All integration tests pass
   - Lint passes (no warnings)
   - Build succeeds

2. **Vercel Preview:**
   - Manual test auto-fill functionality
   - Manual test clear functionality
   - Manual test flippable cards in both groups and playoffs
   - Manual test on mobile device (responsive layout)

3. **Before merge:**
   - SonarCloud analysis passes (0 new issues)
   - Code review approved
   - Visual QA completed

---

## Design Decisions (Resolved)

1. **Auto-fill behavior for existing scores:**
   - ✅ DECIDED: Only fill games without results OR games with draft results
   - Skip published games to prevent data loss
   - Notification shows count of skipped games

2. **Playoff penalty scores:**
   - ✅ DECIDED: Generate realistic penalty scores when ties occur naturally
   - Use Poisson(λ=3) for each team, cap at 5 per team
   - Add 1 to random team to ensure winner
   - Ties occur naturally from Poisson distribution (~20-25% of games)

3. **Clear confirmation specificity:**
   - ✅ DECIDED: Show count of games in confirmation
   - Format: "Clear scores from X games in Group A?"

4. **Database operation for clear:**
   - ✅ DECIDED: DELETE game_results records
   - Cleaner approach, aligns with "clear" semantics
   - Foreign key constraints allow deletion

5. **Recalculation pipeline:**
   - ✅ DECIDED: Both auto-fill and clear trigger full recalculation
   - Ensures consistent state across playoff matchups, group standings, guess scores

## Open Questions (For Future Consideration)

1. **Keyboard shortcuts:**
   - Should there be keyboard shortcuts for auto-fill/clear?
   - Recommendation: Not in initial version (can add later as enhancement)

2. **Undo functionality:**
   - Should we provide undo for clear operation?
   - Recommendation: No - confirmation dialog is sufficient safeguard

3. **Partial failure handling:**
   - What if only some games fail to auto-fill/clear?
   - Current approach: Transactional (all or nothing)
   - Alternative: Best-effort with partial success reporting
   - Recommendation: Keep transactional for simplicity

---

## Success Metrics

- [ ] All acceptance criteria met
- [ ] 80%+ code coverage on new code
- [ ] 0 new SonarCloud issues
- [ ] All existing tests pass
- [ ] Visual QA approved by user
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] Accessibility audit passes (keyboard navigation, screen reader)

---

## Dependencies

**External Libraries:**
- Material-UI (existing) - for card, buttons, menu, dialog components
- React (existing) - for component structure
- Next.js (existing) - for server actions

**Internal Dependencies:**
- Existing flip animation patterns from `flippable-game-card.tsx`
- Existing game repository queries
- Existing backoffice action patterns
- Existing notification system (Snackbar)

**No new external dependencies required.**
