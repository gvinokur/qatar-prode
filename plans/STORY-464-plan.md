# Story #464: Show AI auto-fill button in game card edit mode

## Context
The AI auto-fill button (sparkle / `AutoAwesome` icon) is currently only available in game card **view mode** — rendered inside `CompactGameViewCard` when `onAIGenerateClick` is provided. When the user flips the card to **edit mode**, the button disappears, forcing a cancel → AI fill → re-enter edit cycle.

This story wires the same AI prediction logic into `GamePredictionEditControls` (the edit-mode back face), positioned below the score inputs and above the Boost section, centered.

## Acceptance Criteria
- AI auto-fill button (sparkle icon) visible in edit mode, below score inputs and above Boost section, centered
- Clicking fills both score inputs with AI-generated predictions, overwriting any values already entered
- For playoff games where AI predicts a tie, the penalties winner field is also filled
- Works in EN and ES (no new translation keys needed — reuse `aiGenerate.tooltipSingle`)

## Out of Scope
- Changing AI auto-fill behavior in view mode
- Keyboard navigation integration for the new button

---

## Technical Approach

### Architecture Overview

The `FlippableGameCard` already has:
- `onAIGenerateClick?: (gameId: string) => void` prop
- It passes this prop to `GameView` (front face) ✅
- It does **not** pass anything to `GamePredictionEditControls` (back face) ❌

`GameView` contains `handleAIGenerateClick` which calls `generateAIPrediction(homeRank, awayRank, isPlayoffGame)` and updates the `GuessesContext` directly.

For **edit mode**, we cannot update the context directly because `FlippableGameCard` maintains local edit state (`editHomeScore`, `editAwayScore`, etc.) that is only committed on Save. Instead, the AI prediction must update the **local edit state** in `FlippableGameCard`.

### Changes Required

#### 1. `app/components/flippable-game-card.tsx`
- Import `generateAIPrediction` from `'../utils/ai-prediction-generator'` (already used in `GameView`, same pattern)
- Add `useMemo` import if not present (already imported)
- Create `handleAIGenerateInEditMode` handler:
  - Only defined if `onAIGenerateClick` is provided and game has both teams and is not `disabled`
  - Reads `homeRank`/`awayRank` from `teamsMap`
  - Calls `generateAIPrediction(homeRank, awayRank, isPlayoffs)`
  - Updates local edit state: `setEditHomeScore`, `setEditAwayScore`, and conditionally `setEditHomePenaltyWinner`/`setEditAwayPenaltyWinner`
- Pass `handleAIGenerateInEditMode` to `GamePredictionEditControls` as `onAIGenerateClick`

#### 2. `app/components/game-prediction-edit-controls.tsx`
- Add `AutoAwesome as AutoAwesomeIcon` to MUI icons import
- Add `Tooltip, IconButton` to MUI components import (already imported)
- Add `onAIGenerateClick?: () => void` to `GamePredictionEditControlsProps` interface (readonly)
- Destructure in component function
- Add AI button render inline between `renderPenaltySelection()` and `renderBoostSelection()` calls:
  ```tsx
  {onAIGenerateClick && (
    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
      <Tooltip title={t('aiGenerate.tooltipSingle')}>
        <IconButton
          size="small"
          onClick={onAIGenerateClick}
          aria-label={t('aiGenerate.tooltipSingle')}
        >
          <AutoAwesomeIcon sx={{ width: '20px', height: '20px' }} />
        </IconButton>
      </Tooltip>
    </Box>
  )}
  ```

### No translation changes needed
Reuse existing key: `predictions.aiGenerate.tooltipSingle` ("Generate prediction") — same string works in both modes.

### No worktree-level code structure changes to layers
- `game-prediction-edit-controls.tsx` and `flippable-game-card.tsx` are both tracked in `docs/code-structure/components/components-tournament-games.md`

---

## Mid-Level Design

### Call Graph Changes
No new cross-layer flows. The handler stays entirely within `FlippableGameCard`'s local state — no new server action or repository call.

**Modified flows:**
- **Edit-mode flip card** — `FlippableGameCard` now passes `onAIGenerateClick` (edit variant) to `GamePredictionEditControls`. The callback calls `generateAIPrediction` and updates local edit state rather than context.

### `app/components/flippable-game-card.tsx` *(modified)*

**New logic (not a separate export):**

- **`handleAIGenerateInEditMode`**: `(() => void) | undefined`  
  Computed via `useMemo`. Defined only when `onAIGenerateClick && game.home_team && game.away_team && !disabled`.  
  Calls `generateAIPrediction(homeRank, awayRank, isPlayoffs)` and updates `editHomeScore`, `editAwayScore`, and optionally `editHomePenaltyWinner` / `editAwayPenaltyWinner`.  
  Calls: `generateAIPrediction`  
  Tests:
  - returns `undefined` when `onAIGenerateClick` is not provided
  - returns `undefined` when `disabled` is true
  - calls `setEditHomeScore` and `setEditAwayScore` with AI-generated values, overwriting any existing values
  - sets penalty winner fields when AI predicts a tie in a playoff game
  - does not set penalty winner fields for group-stage games
  - returns `undefined` when either team is missing from `teamsMap` (passes `undefined` rank to generator gracefully)

### `app/components/game-prediction-edit-controls.tsx` *(modified)*

**Interface change:**

- Add `readonly onAIGenerateClick?: () => void` to `GamePredictionEditControlsProps`

**Render change (no new exported function):**

- Renders centered `IconButton` with `AutoAwesomeIcon` and `Tooltip` between score/penalty and boost sections, only when `onAIGenerateClick` is defined  
  Tests:
  - renders AI button when `onAIGenerateClick` prop is provided
  - does not render AI button when `onAIGenerateClick` is not provided
  - calls `onAIGenerateClick` when button is clicked
  - button `aria-label` equals the tooltip title (same `aiGenerate.tooltipSingle` value)

---

## Files to Create / Modify

| File | Change |
|------|--------|
| `app/components/flippable-game-card.tsx` | Add `handleAIGenerateInEditMode`, pass to `GamePredictionEditControls` |
| `app/components/game-prediction-edit-controls.tsx` | Add `onAIGenerateClick` prop + render AI button |
| `docs/code-structure/components/components-tournament-games.md` | Update entries for `FlippableGameCard` and `GamePredictionEditControls` |

---

## Visual Prototype

```
┌─────────────────────────────────────────┐
│   TeamA  [  2  ]  vs  [  1  ]  TeamB    │  ← score inputs (existing)
├─────────────────────────────────────────┤
│                   ✨                     │  ← NEW: centered sparkle icon button
├─────────────────────────────────────────┤
│  Boost: [None] [2x Silver] [3x Golden]  │  ← boost section (existing)
├─────────────────────────────────────────┤
│            [Cancel]  [Save]             │  ← action buttons (existing)
└─────────────────────────────────────────┘
```

The button uses `AutoAwesomeIcon` (same icon as view mode), wrapped in `Tooltip` with `aiGenerate.tooltipSingle` text.

---

## Testing Strategy

### Unit tests for `GamePredictionEditControls`
- Test file: `app/components/__tests__/game-prediction-edit-controls.test.tsx` (if exists) or create new
- Test: renders button when `onAIGenerateClick` provided
- Test: does not render button when `onAIGenerateClick` not provided
- Test: calls `onAIGenerateClick` on click

### Unit tests for `FlippableGameCard`
- Test file: `app/components/__tests__/flippable-game-card.test.tsx` (if exists) or create new
- Test: `handleAIGenerateInEditMode` is undefined when `onAIGenerateClick` prop absent
- Test: `handleAIGenerateInEditMode` updates edit state with AI values
- Test: playoff tie case sets penalty winner

### Manual verification
1. Open a tournament games page
2. Click edit (flip) on a game card
3. Verify sparkle button appears below the score inputs and above the Boost section
4. Click the sparkle button
5. Verify scores are populated with AI-generated values
6. For a playoff game: verify penalty winner is set when scores are tied
7. Verify in both EN and ES locales

---

## Validation
- `npm run test` — ensure no regressions
- `npm run lint` — no new lint issues
- `npm run build` — clean build
