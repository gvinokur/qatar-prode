# Plan: Games Page: Internal Flow & Stage Transitions (#392)

## Story Context

**Epic:** #389 — Guided Tournament Prediction Flow  
**Story:** [Story] Games Page: Internal Flow & Stage Transitions

**Part of a 5-story epic** that turns the app from a collection of pages into a guided journey. This story is Step 3 ("Flow") of the narrative:
1. Entry → Priority Attention Widget (#390)
2. Engagement → Hub deep-links (#391)
3. **Flow → Games page auto-advances through group stage (#392)** ← this story
4. Transition → QT nudges (#393)
5. Re-entry → Playoff Alerts (#394)

## Objective

Provide a smooth, auto-advancing prediction experience within the Games page that:
1. Always shows "Save & Next" as the primary desktop action (guided mode is always active on the games page)
2. Auto-advances to the next **unpredicted** group game (using `isGamePredictionComplete`)
3. Stops auto-advance at the Group Stage boundary (never crosses into Playoffs)
4. Replaces the static divider between Group Stage and Playoffs with a contextual 2-state banner linking to Qualified Teams predictions

## Acceptance Criteria (revised after PR feedback)

1. **Save & Next Button** — "Save & Next" is always the primary button in edit mode on the games page (no URL param toggle; guided mode is the default)
2. **Unpredicted Game Detection** — `isGamePredictionComplete` (existing utility) identifies the next target, not the time-based disabled check
3. **Contextual Stage Transition Banner** — Between Group Stage and Playoffs, always shows a CTA with 2 states based purely on `isPredictionLocked`:
   - **State A** (`isPredictionLocked = false`): CTA "Predict Qualified Teams"
   - **State B** (`isPredictionLocked = true`): CTA "Check your QT Predictions"
4. **Flow Boundaries** — Auto-advance stops at end of Group Stage; smooth scroll before opening next card
5. **Cancel keeps guided mode** — Cancelling a card just flips it back without advancing; the user remains in guided mode (the next card they open will still show "Save & Next" as primary)

## Technical Approach

### Guided Mode — Always On
The games page always operates in guided mode. No URL param or state toggle is needed.
- `GamesListWithScroll` always passes `isGuidedMode={true}` to each `FlippableGameCard`
- `FlippableGameCard` threads it to `GamePredictionEditControls`
- `GamePredictionEditControls` shows "Save & Next" as primary when `isGuidedMode && onSaveAndAdvance` provided (desktop layout only)
- Cancel behavior is unchanged: just calls `onEditEnd()`, no advance, no mode change

### "Save & Next" as Primary Button
Prop flows down the component tree:
```
GamesListWithScroll (always true) → FlippableGameCard → GamePredictionEditControls
```
On **desktop** when `isGuidedMode=true` and `onSaveAndAdvance` provided:
- Show `[Cancel]` `[Save & Next (contained)]` instead of `[Cancel]` `[Save (contained)]`
- Mobile layout unchanged: `getMobileButtonLabel()` already returns "next" dynamically

### Auto-Advance Logic Fix
Current `handleAutoAdvanceNext` finds the next game by skipping time-disabled ones. Changed to:
1. Only look within **group-stage games** (`game.playoffStage === null`)
2. Skip games where `isGamePredictionComplete` returns **true** (already predicted)
3. Stop silently if no unpredicted group game follows (flow boundary reached)

### Contextual Stage Transition Banner (2 states only)
- Always renders a CTA in the first-playoff-section separator
- State A (`isPredictionLocked = false`): "Predict Qualified Teams" → links to QT page
- State B (`isPredictionLocked = true`): "Check your QT Predictions" → links to QT page
- `qualifiedTeamsHref` built in `UnifiedGamesPage` server component (has `locale`)
- `isPredictionLocked` from `tournamentPredictionCompletion` already passed to `UnifiedGamesPageClient`

Detection in `GamesListWithScroll` render loop:
```typescript
const isFirstPlayoffSection = section.sectionKey.startsWith('playoff-') &&
  !gameSections.slice(0, sectionIdx).some(s => s.sectionKey.startsWith('playoff-'));
```

## Visual Prototype

### Contextual Stage Transition Banner

**State A (`isPredictionLocked = false`):**
```
┌──────────────────────────────────────────────────────────────┐
│  ... last group game cards ...                                │
│                                                               │
│  PLAYOFFS ────────────────────────── [Predict Qual. Teams →]  │
│                                                               │
│  ... first playoff game cards ...                             │
└──────────────────────────────────────────────────────────────┘
```

**State B (`isPredictionLocked = true`):**
```
  PLAYOFFS ──────────────────────── [Check your QT Predictions →]
```

### Guided Mode Button Layout (Desktop) — Always Active

```
 [Cancel]  [Save & Next]
```

## Files to Create

### `app/components/stage-transition-banner.tsx` (new)
Reuses `StageSeparator` styling; adds a required CTA button right-aligned on the divider row.

## Files to Modify

### `app/components/game-prediction-edit-controls.tsx`
Add `isGuidedMode?: boolean` prop. In `renderActionButtons()`, when `isGuidedMode && onSaveAndAdvance` on desktop, show [Cancel] [Save & Next (contained)] instead of [Cancel] [Save (contained)].

### `app/components/flippable-game-card.tsx`
Add `isGuidedMode?: boolean` to `FlippableGameCardProps`. Pass through to `GamePredictionEditControls`.

### `app/components/games-list-with-scroll.tsx`
- Add props: `qtPredictionLocked: boolean`, `qualifiedTeamsHref: string`
- Import and use `isGamePredictionComplete` in `handleAutoAdvanceNext`
- Filter to group-stage games only in `handleAutoAdvanceNext`
- Always pass `isGuidedMode={true}` to each `FlippableGameCard`
- In render loop: detect first playoff section, render `StageTransitionBanner` there with CTA derived from `qtPredictionLocked`

### `app/components/unified-games-page-client.tsx`
- Add `qualifiedTeamsHref` to `UnifiedGamesPageClientProps`
- Pass `qtPredictionLocked={tournamentPredictionCompletion?.isPredictionLocked ?? false}` and `qualifiedTeamsHref` to `GamesListWithScroll`

### `app/components/unified-games-page.tsx`
- Build `qualifiedTeamsHref = \`/${locale}/tournaments/${tournamentId}/qualified-teams\``
- Pass to `UnifiedGamesPageClient`

### `locales/en/predictions.json` + `locales/es/predictions.json`
Add new translation keys:
- `predictions.edit.saveAndNext` → "Save & Next" / "Guardar y Siguiente"
- `predictions.stageTransition.predictQualifiedTeams` → "Predict Qualified Teams" / "Predecir Equipos Clasificados"
- `predictions.stageTransition.checkQtPredictions` → "Check your QT Predictions" / "Ver tus Predicciones de Clasificados"

### `docs/code-structure/components/components-tournament-games.md`
Update entries for all modified components.

## Mid-Level Design

### Call Graph Changes

**No new cross-layer flows.** All changes are within the Client component tree:
- `UnifiedGamesPageContent` gains two new props (`qtPredictionLocked`, `qualifiedTeamsHref`) forwarded to `GamesListWithScroll`
- `GamesListWithScroll` hardcodes `isGuidedMode={true}` when rendering `FlippableGameCard`
- QT href is a string prop pre-built in the Server component

### `app/components/stage-transition-banner.tsx` *(new)*

- **StageTransitionBanner({ label, ctaLabel, ctaHref })**: `JSX.Element`
  Renders a full-width grid row (same layout as `StageSeparator`) with the section label and a right-aligned CTA button. Always has a CTA — callers supply the label and href.
  Calls: none (pure presentational)
  Tests:
  - renders label text using overline typography matching StageSeparator visual
  - renders CTA button with provided ctaLabel
  - CTA button is right-aligned inside the banner row
  - CTA button navigates to ctaHref when clicked

### `app/components/game-prediction-edit-controls.tsx` *(modified)*

**Changed functions:**

- **renderActionButtons()**: `JSX.Element | null` *(was: no guided-mode awareness)*
  When `isGuidedMode && onSaveAndAdvance` on desktop: renders `[Cancel (outlined)] [Save & Next (contained)]`. Otherwise: existing `[Cancel (outlined)] [Save (contained)]`.
  Calls: `onSaveAndAdvance`, `onCancel`
  Tests:
  - renders "Save & Next" as contained button when isGuidedMode=true and onSaveAndAdvance provided
  - renders "Save" as contained button when isGuidedMode=false (default behavior unchanged)
  - clicking "Save & Next" calls onSaveAndAdvance
  - renders nothing when neither onSave nor onCancel provided (unchanged)

### `app/components/flippable-game-card.tsx` *(modified)*

No new logic — only prop threading. `isGuidedMode` added to `FlippableGameCardProps` and forwarded to `GamePredictionEditControls`.

### `app/components/games-list-with-scroll.tsx` *(modified)*

**Changed functions:**

- **handleAutoAdvanceNext(currentGameId: string)**: `void` *(was: time-based enabled check)*
  Finds the next group-stage game (no `playoffStage`) after `currentGameId` where `isGamePredictionComplete` returns false. Scrolls to it and calls `handleEditStart`. If no unpredicted group game remains, stops silently. Guards against missing DOM element.
  Calls: `handleEditStart`, `isGamePredictionComplete`
  Tests:
  - advances to next group game where prediction is incomplete
  - skips group games where prediction is already complete
  - does NOT advance into playoff games (boundary stops at last group game)
  - stops silently when all following group games are already predicted
  - calls scrollIntoView on the target card element
  - stops silently when target card element is not found in DOM (defensive guard)

- **GamesListWithScroll({ ..., qtPredictionLocked, qualifiedTeamsHref })**: `JSX.Element` *(was: no qt/banner props)*
  Always passes `isGuidedMode={true}` to each `FlippableGameCard`. For the first playoff section, renders `StageTransitionBanner` with CTA label derived from `qtPredictionLocked`.
  Calls: none (render only)
  Tests:
  - renders StageTransitionBanner for first playoff section when qtPredictionLocked=false (State A, "Predict" CTA)
  - renders StageTransitionBanner for first playoff section when qtPredictionLocked=true (State B, "Check" CTA)
  - renders standard StageSeparator for non-first-playoff sections
  - renders standard StageSeparator for group sections regardless of qtPredictionLocked
  - always passes isGuidedMode={true} to each FlippableGameCard

### `app/components/unified-games-page-client.tsx` *(modified)*

**Changed functions:**

- **UnifiedGamesPageContent(props)**: `JSX.Element` *(was: no qt/banner props)*
  Receives `qualifiedTeamsHref` and passes it along with `isPredictionLocked` to `GamesListWithScroll`.
  Calls: none (prop forwarding)
  Tests:
  - passes qtPredictionLocked=true to GamesListWithScroll when isPredictionLocked is true
  - passes qtPredictionLocked=false to GamesListWithScroll when isPredictionLocked is false or completion is null
  - passes qualifiedTeamsHref unchanged to GamesListWithScroll

## Testing Strategy

### Unit Tests

**New tests** (`app/components/__tests__/stage-transition-banner.test.tsx`):
- Renders label with correct overline typography
- Renders CTA button with provided ctaLabel
- CTA button positioned right-aligned
- CTA navigates to ctaHref

**Modified tests** (new file or existing `game-prediction-edit-controls` tests):
- isGuidedMode=true desktop: "Save & Next" button rendered as contained
- isGuidedMode=false desktop: "Save" button rendered as contained (regression)
- clicking "Save & Next" invokes onSaveAndAdvance

**Modified tests** (new `games-list-with-scroll` test file):
- auto-advance skips predicted games
- auto-advance stops at group stage boundary
- banner renders with "Predict" CTA for first playoff section when qtPredictionLocked=false
- banner renders with "Check" CTA for first playoff section when qtPredictionLocked=true
- group sections always get plain StageSeparator

**Modified tests** (`unified-games-page-client` tests):
- qualifiedTeamsHref forwarded correctly
- qtPredictionLocked derived from completion prop

### Test Utilities
- Use `testFactories.createGame()` / `testFactories.createTournament()` for mock data
- Use `renderWithTheme()` from `@/__tests__/utils` for all component tests
- Use `createMockSelectQuery()` for any data dependency mocks

### Coverage
All new functions/branches need ≥80% line coverage on new code.

## Implementation Waves

**Wave 1** (no dependencies):
- Create `stage-transition-banner.tsx`
- Add translations to both locale files

**Wave 2** (depends on Wave 1 for banner):
- Modify `game-prediction-edit-controls.tsx` (add `isGuidedMode` prop + button swap)
- Modify `flippable-game-card.tsx` (thread `isGuidedMode`)
- Modify `games-list-with-scroll.tsx` (auto-advance fix + banner insertion + always-guided)

**Wave 3** (depends on Wave 2):
- Modify `unified-games-page-client.tsx` (pass qt props to list)
- Modify `unified-games-page.tsx` (build + pass qualifiedTeamsHref)

**Wave 4** (docs):
- Update `docs/code-structure/components/components-tournament-games.md`

## Implementation Amendments

### Amendment 1: Scroll-then-open → Open-then-scroll in handleAutoAdvanceNext
**Date:** 2026-04-26
**Reason:** Post-implementation feedback: the expanded inline edit form pushes the card downward after scroll fires, leaving score inputs out of view. Reversing the order (open edit form first, scroll after 150ms) ensures the scroll targets the already-expanded card height.
**Change:** `handleAutoAdvanceNext` now calls `handleEditStart(nextGame.id)` immediately, then fires `scrollIntoView` in a `setTimeout(..., 150)` with `block: 'start'` instead of `block: 'center'`. The AC description "smooth scroll before opening next card" was incorrect; the shipped behavior is the opposite.

## Validation Considerations

- **SonarCloud**: 0 new issues.
- **Coverage**: ≥80% on new code. Focus on `StageTransitionBanner`, `handleAutoAdvanceNext` logic, `renderActionButtons` guided branch.
- **Regression**: Existing desktop button layout when `isGuidedMode=false` (other contexts like GamesGrid) must be unchanged.
- **i18n**: New keys added to both `en` and `es` locale files.

## Open Questions

None — all design decisions resolved via PR feedback.
