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
1. Shows "Save & Next" as the primary action when the user is in guided mode
2. Auto-advances to the next **unpredicted** group game (using `isGamePredictionComplete`)
3. Stops auto-advance at the Group Stage boundary (never crosses into Playoffs)
4. Replaces the static divider between Group Stage and Playoffs with a contextual banner linking to Qualified Teams predictions

## Acceptance Criteria

1. **Save & Next Button** — In edit mode, "Save & Next" is primary when `?guided=true` URL param is present
2. **Unpredicted Game Detection** — `isGamePredictionComplete` (existing utility) identifies the next target, not the time-based disabled check
3. **Contextual Stage Transition Banner** — Between Group Stage and Playoffs, 3 states:
   - **State A** (tournament started, QT open): CTA "Predict Qualified Teams"
   - **State B** (tournament started, QT closed): CTA "Check your QT Predictions"
   - **State C** (pre-tournament): No CTA, static separator
4. **Flow Boundaries** — Auto-advance stops at end of Group Stage; smooth scroll before opening next card

## Technical Approach

### Guided Mode Activation
- `?guided=true` URL param marks the user as being in guided mode
- `UnifiedGamesPageContent` reads this via `useSearchParams()` and derives `isGuidedMode: boolean`
- Param is NOT cleared after reading (persists throughout the session on that page)
- Story #391 will later set this param when entering from guided entry points; this story defines the behavior

### "Save & Next" as Primary Button
Prop flows from URL param down through component tree:
```
UnifiedGamesPageContent → GamesListWithScroll → FlippableGameCard → GamePredictionEditControls
```
When `isGuidedMode=true` on **desktop** with `onSaveAndAdvance` provided:
- Show `[Cancel]` `[Save & Next (contained)]` instead of `[Cancel]` `[Save (contained)]`
- Mobile already has `getMobileButtonLabel()` returning "next" dynamically; no change needed there

### Auto-Advance Logic Fix
Current `handleAutoAdvanceNext` finds the next game by skipping time-disabled ones. The story requires:
1. Only look within **group-stage games** (`game.playoffStage === null`)
2. Skip games where `isGamePredictionComplete` returns **true** (already predicted)
3. Stop silently if no unpredicted group game follows

### QT State Derivation
In `UnifiedGamesPageContent`:
```typescript
const qtState = useMemo(() => {
  if (!tournamentStartDate || Date.now() < tournamentStartDate.getTime()) {
    return 'pre-tournament' as const;  // State C
  }
  if (tournamentPredictionCompletion?.isPredictionLocked) {
    return 'closed-progressing' as const;  // State B
  }
  return 'open' as const;  // State A
}, [tournamentStartDate, tournamentPredictionCompletion?.isPredictionLocked]);
```

`qualifiedTeamsHref` is built in `UnifiedGamesPage` (server component, has `locale`) and passed down.

### Contextual Stage Transition Banner
- Renders in place of `StageSeparator` for the **first playoff section** only
- Maintains identical typography/divider visual as `StageSeparator`
- When CTA present: adds a small Button below the separator line, right-aligned
- When no CTA: renders exactly like the current `StageSeparator`

Detection in `GamesListWithScroll`:
```typescript
const isFirstPlayoffSection = section.sectionKey.startsWith('playoff-') &&
  !sections.slice(0, idx).some(s => s.sectionKey.startsWith('playoff-'));
```

## Visual Prototype

### Contextual Stage Transition Banner

**State A (QT Open) — between group and playoff sections:**

```
┌──────────────────────────────────────────────────────────────┐
│                                                               │
│  GROUP STAGE ───────────────────────────────────────────────  │
│  ... last group game cards ...                                │
│                                                               │
│  PLAYOFFS ────────────────────────── [Predict Qual. Teams →]  │
│                                                               │
│  ... first playoff game cards ...                             │
└──────────────────────────────────────────────────────────────┘
```

**State B (QT Closed, groups progressing):**
```
  PLAYOFFS ──────────────────────── [Check your QT Predictions →]
```

**State C (Pre-tournament, or no CTA):**
```
  PLAYOFFS ────────────────────────────────────────────────────
  (same as current StageSeparator - no button)
```

### Guided Mode Button Layout (Desktop)

**Default mode (current):**
```
 [Cancel]  [Save]
```

**Guided mode (`?guided=true`):**
```
 [Cancel]  [Save & Next]
```

## Files to Create

### `app/components/stage-transition-banner.tsx` (new)
Reuses `StageSeparator` styling, adds optional CTA button right-aligned on the divider row.

## Files to Modify

### `app/components/game-prediction-edit-controls.tsx`
Add `isGuidedMode?: boolean` prop. In `renderActionButtons()`, when `isGuidedMode && onSaveAndAdvance`, replace "Save" with "Save & Next" as the primary button on desktop.

### `app/components/flippable-game-card.tsx`
Add `isGuidedMode?: boolean` to `FlippableGameCardProps`. Pass through to `GamePredictionEditControls`.

### `app/components/games-list-with-scroll.tsx`
- Add props: `isGuidedMode?`, `qtState?`, `qualifiedTeamsHref?`
- Import and use `isGamePredictionComplete` in `handleAutoAdvanceNext`
- Filter to group-stage games only in `handleAutoAdvanceNext`
- In render loop: detect first playoff section, render `StageTransitionBanner` there
- Pass `isGuidedMode` to each `FlippableGameCard`

### `app/components/unified-games-page-client.tsx`
- Derive `isGuidedMode` from `searchParams.get('guided') === 'true'`
- Derive `qtState` from `tournamentStartDate` + `isPredictionLocked`
- Pass `isGuidedMode`, `qtState`, `qualifiedTeamsHref` to `GamesListWithScroll`
- Add `qualifiedTeamsHref` to `UnifiedGamesPageClientProps` (passed from server component)

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

**Modified flows:**
- **No new cross-layer flows** — all changes are within the Client component tree. `UnifiedGamesPageContent` passes new props to `GamesListWithScroll`, which passes `isGuidedMode` to `FlippableGameCard`, which passes it to `GamePredictionEditControls`.
- The QT href is pre-built in the Server component and passed as a string prop.

### `app/components/stage-transition-banner.tsx` *(new)*

- **StageTransitionBanner({ label, ctaLabel?, ctaHref? })**: `JSX.Element`
  Renders a full-width grid row (same layout as `StageSeparator`) with the section label and optional right-aligned CTA button. When `ctaLabel` and `ctaHref` are omitted, renders identically to `StageSeparator`.
  Calls: none (pure presentational)
  Tests:
  - renders label text using overline typography matching StageSeparator visual
  - renders CTA button when both ctaLabel and ctaHref are provided
  - does NOT render a button when ctaLabel is undefined (State C fallback)
  - CTA button is right-aligned inside the banner row

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
  Finds the next group-stage game (no `playoffStage`) after `currentGameId` where `isGamePredictionComplete` returns false. Scrolls to it and calls `handleEditStart`. If no unpredicted group game remains, stops silently (flow boundary reached). Guards against missing DOM element (card not found in DOM).
  Calls: `handleEditStart`, `isGamePredictionComplete`
  Tests:
  - advances to next group game where prediction is incomplete
  - skips group games where prediction is already complete
  - does NOT advance into playoff games (boundary stops at last group game)
  - stops silently when all following group games are already predicted
  - calls scrollIntoView on the target card element
  - stops silently when target card element is not found in DOM (defensive guard)

- **GamesListWithScroll({ ..., isGuidedMode?, qtState?, qualifiedTeamsHref? })**: `JSX.Element` *(was: no guided/qt props)*
  Accepts 3 new optional props. Passes `isGuidedMode` to each `FlippableGameCard`. For the first playoff section, renders `StageTransitionBanner` instead of `StageSeparator`, with CTA derived from `qtState`.
  Calls: none (render only)
  Tests:
  - renders StageTransitionBanner for first playoff section when qtState is 'open'
  - renders StageTransitionBanner with "Check" CTA when qtState is 'closed-progressing'
  - renders standard StageSeparator (no CTA) for first playoff section when qtState is 'pre-tournament'
  - renders standard StageSeparator for non-playoff sections regardless of qtState
  - passes isGuidedMode=true to FlippableGameCard when prop is true

### `app/components/unified-games-page-client.tsx` *(modified)*

**Changed functions:**

- **UnifiedGamesPageContent(props)**: `JSX.Element` *(was: no guided mode)*
  Reads `?guided=true` URL param to set `isGuidedMode`. Derives `qtState` from `tournamentStartDate` + `isPredictionLocked`. Passes new props to `GamesListWithScroll`.
  Calls: none (logic only)
  Tests:
  - isGuidedMode is true when searchParams contains guided=true
  - isGuidedMode is false when guided param is absent
  - qtState is 'pre-tournament' when tournamentStartDate is undefined
  - qtState is 'open' when tournament started and isPredictionLocked=false
  - qtState is 'closed-progressing' when tournament started and isPredictionLocked=true

## Testing Strategy

### Unit Tests

**New tests** (`./__tests__/stage-transition-banner.test.tsx`):
- Renders with label only (no CTA) — matches StageSeparator appearance
- Renders with ctaLabel+ctaHref — CTA button appears
- CTA button absence when props omitted

**Modified tests** (`game-prediction-edit-controls.test.tsx` or new file):
- isGuidedMode=true desktop: "Save & Next" button rendered as contained
- isGuidedMode=false desktop: "Save" button rendered as contained (regression)
- clicking "Save & Next" invokes onSaveAndAdvance

**Modified tests** (`games-list-with-scroll.test.tsx` or new file):
- auto-advance skips predicted games
- auto-advance stops at group stage boundary
- banner renders for first playoff section with correct CTA per qtState

**Modified tests** (`unified-games-page-client.test.tsx` - existing):
- guided param detected correctly

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
- Modify `games-list-with-scroll.tsx` (auto-advance fix + banner insertion + guided prop threading)

**Wave 3** (depends on Wave 2):
- Modify `unified-games-page-client.tsx` (derive+pass new props)
- Modify `unified-games-page.tsx` (pass qualifiedTeamsHref)

**Wave 4** (docs):
- Update `docs/code-structure/components/components-tournament-games.md`

## Validation Considerations

- **SonarCloud**: 0 new issues. All new exported functions must have JSDoc only where needed.
- **Coverage**: ≥80% on new code. Focus on `StageTransitionBanner`, `handleAutoAdvanceNext` logic, `renderActionButtons` guided branch.
- **Regression**: Existing button layout (non-guided mode) must be unchanged. Existing `handleAutoAdvanceNext` keyboard Tab behavior must still work.
- **i18n**: New keys added to both `en` and `es` locale files.

## Open Questions

None — all requirements are clear from the story and codebase exploration.
