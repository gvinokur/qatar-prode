# Story 450: AI-Generate Game Score Predictions Based on Team Rankings

## Context

FIFA 2026 has 48 group-stage games — manually filling every score is a significant barrier to entry. This story adds an ✨ AI-generate feature that produces probabilistic scores based on FIFA world rankings. Users get two entry points: a per-game sparkle icon on unfilled cards and a bulk "AI-generate all" button. The algorithm is deterministic (same team pair → same prediction), so results feel computed rather than arbitrary. Existing predictions are never overwritten; deadline-closed games are skipped.

## Approach

Generate predictions **entirely client-side** using a pure utility function + static rankings data, then save via the existing `updateOrCreateGameGuesses()` server action. No new server action needed. The GuessesContext gains one new method (`bulkSetGameGuesses`) for efficient batch state updates after bulk generation.

The algorithm uses **real randomness** (`Math.random()`) so each invocation — and each user — gets different predictions for the same game. The rank ratio drives the *probability distribution*, not the outcome itself.

---

## Files to Create

### 1. `app/utils/ai-prediction-generator.ts`
Pure utility using `Math.random()` — each call produces a fresh probabilistic result.

```typescript
/** Internal: Poisson sample using Knuth's algorithm with the provided RNG. */
function samplePoisson(lambda: number, rng: () => number): number

/** Main export: generate a random score using independent Poisson sampling (Skellam model).
 *  homeRank/awayRank come from team.rank in the teamsMap.
 *  rng defaults to Math.random; inject a deterministic function in tests. */
export function generateAIPrediction(
  homeRank: number | null | undefined,
  awayRank: number | null | undefined,
  isPlayoff: boolean,
  rng?: () => number
): { homeScore: number; awayScore: number; homePenaltyWinner?: boolean; awayPenaltyWinner?: boolean }
```

Algorithm:
1. Resolve ranks: if one team's rank is missing, use the opponent's rank for both (`diff = 0` → equal λ). If both missing, treat as equal.
2. `diff = awayRank - homeRank` (positive = home is stronger, lower rank = better)
3. Compute **expected goals (xG)** using symmetric exponential scaling — two constants, no tier tables:
   ```
   BASE_λ = 1.2   // avg WC goals per team per game
   K      = 0.024 // tuned so diff=50 → λHome ≈ 4.0

   λHome = BASE_λ · exp(K · diff)
   λAway = BASE_λ · exp(−K · diff)
   ```
   Invariant: `λHome · λAway = BASE_λ²` always. Total expected goals grow naturally with mismatch.

   Spot checks:
   | diff | λHome | λAway | Character |
   |------|-------|-------|-----------|
   | 0 | 1.20 | 1.20 | Equal (~35/30/35 win/draw/win) |
   | 18 | 1.84 | 0.78 | Clear home favourite |
   | 30 | 2.46 | 0.59 | Strong home |
   | 50 | 3.98 | 0.36 | Germany vs Curaçao |

4. Sample scores independently — win/draw/loss emerge naturally, no outcome pre-selection needed:
   ```
   homeScore = samplePoisson(λHome, rng)
   awayScore = samplePoisson(λAway, rng)
   ```

5. For playoff draw (`homeScore === awayScore`): stronger team wins penalties with probability `min(75, 50 + absDiff / 3)%`, sampled via `rng()`.

### 3. `app/components/ai-generate-all-dialog.tsx`
Reusable confirmation dialog component. Props:
- `open: boolean`
- `onClose: () => void`
- `onConfirm: () => void`
- `pendingCount: number`
- `loading: boolean`
- `errorMessage?: string | null`

Uses MUI Dialog. Shows "Generate predictions for {count} unfilled games based on team rankings?" with Confirm/Cancel. While generating, shows a loading state on the confirm button.

---

## Files to Modify

### 2. `app/components/context-providers/guesses-context-provider.tsx`
Add `bulkSetGameGuesses(guesses: GameGuessNew[]): void` to both the context interface and implementation. Merges the provided guesses into state (no individual saves). This is used after bulk AI generation to update local state without triggering N auto-saves.

```typescript
// In GuessesContextValue:
bulkSetGameGuesses: (guesses: GameGuessNew[]) => void;

// Implementation:
const bulkSetGameGuesses = useCallback((guesses: GameGuessNew[]) => {
  setGameGuesses(prev => {
    const updated = { ...prev };
    for (const g of guesses) updated[g.game_id] = g;
    return updated;
  });
}, []);
```

### 4. `app/components/compact-game-view-card.tsx`
Add `onAIGenerateClick?: () => void` to `GameGuessProps` only. Render an `AutoAwesome` icon button adjacent to the edit button when:
- `specificProps.isGameGuess && !hasResult && !disabled && onAIGenerateClick`

Button should be small (same size as edit button), use `AutoAwesome` icon from `@mui/icons-material`, and include a tooltip with the `aiGenerate.buttonLabel` translation key.

### 5. `app/components/game-view.tsx`
Add `onAIGenerateClick?: (gameId: string) => void` to `GameViewProps`. When provided, read ranks from `teamsMap` and call `generateAIPrediction()`:

```typescript
const handleAIGenerateClick = useMemo(() => {
  if (!onAIGenerateClick || !game.home_team || !game.away_team) return undefined;
  return () => {
    const homeRank = teamsMap[game.home_team!]?.rank;
    const awayRank = teamsMap[game.away_team!]?.rank;
    const prediction = generateAIPrediction(homeRank, awayRank, isPlayoffGame);
    updateGameGuess(game.id, { ...gameGuess, ...prediction });
  };
}, [onAIGenerateClick, game, teamsMap, isPlayoffGame, gameGuess, updateGameGuess]);
```

Pass `handleAIGenerateClick` down to `CompactGameViewCard` as `onAIGenerateClick`. Skip if `editDisabled` is true (uses same deadline check).

### 6. `app/components/games-list-with-scroll.tsx` (if GameView props are passed through)
Pass the new `onAIGenerateClick` prop down the chain to `GameView`. Check how GameView is rendered here.

### 7. `app/components/unified-games-page-client.tsx`
Two additions:

**A) AI-generate FAB (mobile) / Button (desktop):**
- Count open + unpredicted games: `const aiGeneratableCount = useMemo(...)` — games where no complete guess, `calculateDeadline(game.game_date) > Date.now()`, and both `home_team` and `away_team` are known.
- Show FAB (mobile, `AutoAwesome` icon) / SpeedDial-style button alongside existing FABs if `aiGeneratableCount > 0`.

**B) Bulk generate handler:**
```typescript
const [aiDialogOpen, setAiDialogOpen] = useState(false);
const [aiGenerating, setAiGenerating] = useState(false);
const [aiGenerateError, setAiGenerateError] = useState<string | null>(null);

const handleAIGenerateAll = useCallback(async () => {
  if (aiGenerating) return; // guard against concurrent clicks
  setAiGenerating(true);
  setAiGenerateError(null);
  try {
    const guessesToSave: GameGuessNew[] = openUnpredictedGames.map(game => ({
      game_id: game.id,
      game_number: game.game_number,
      user_id: '', // server derives from session
      ...generateAIPrediction(
        teamsMap[game.home_team!]?.rank,
        teamsMap[game.away_team!]?.rank,
        !!game.playoffStage
      )
    }));
    const result = await updateOrCreateGameGuesses(guessesToSave, locale as Locale);
    if (result.success) {
      guessesContext.bulkSetGameGuesses(guessesToSave);
      setAiDialogOpen(false);
    } else {
      setAiGenerateError(result.error ?? 'Failed to generate predictions');
    }
  } catch {
    setAiGenerateError('Failed to generate predictions');
  } finally {
    setAiGenerating(false);
  }
}, [aiGenerating, openUnpredictedGames, guessesContext, locale]);
```

The AI-generate FAB is disabled while `aiGenerating === true` to prevent concurrent invocations. Any error from the server action is displayed inline in the dialog as an error message (so the dialog stays open for retry).

Also pass `onAIGenerateClick` to `GamesListWithScroll` (or handled per-game by GameView if the prop chain supports it).

### 8. `locales/en/predictions.json` + `locales/es/predictions.json`
Add under an `aiGenerate` namespace:
```json
{
  "aiGenerate": {
    "buttonLabel": "AI-generate",
    "generateAllButton": "AI-generate all",
    "dialogTitle": "AI-generate predictions",
    "dialogMessage": "Generate predictions for <strong>{count}</strong> unfilled games based on team rankings?",
    "confirmButton": "Generate",
    "cancelButton": "Cancel",
    "generating": "Generating...",
    "tooltipSingle": "Generate prediction"
  }
}
```
Spanish equivalents in `es/predictions.json`.

---

## Mid-Level Design

### Call Graph Changes

**Modified flows:**
- **Flow 1 (Predictions dashboard / game cards)** — `GameView` gains an `onAIGenerateClick` prop that calls `updateGameGuess()` with a generated prediction; `CompactGameViewCard` gains the same prop and renders an `AutoAwesome` icon button.
- **Flow 1** (bulk path) — `UnifiedGamesPageContent` → `handleAIGenerateAll` → `updateOrCreateGameGuesses` + `bulkSetGameGuesses`

### `data/fifa-2026/rankings.ts` *(new)*
- **FIFA_2026_RANKINGS**: `Record<string, number>`
  Static ranking map for all 48 teams. Exported as a named const.

### `app/db/tables-definition.ts`
No changes needed — `team.rank` already exists via Story #449.

### `app/utils/ai-prediction-generator.ts` *(new)*
- **samplePoisson(lambda: number, rng: () => number)**: `number`
  Knuth's algorithm: multiply `rng()` values until product < `exp(-lambda)`. Returns a non-negative integer.
  Tests:
  - returns 0 for very small lambda with `rng` fixed near 1
  - returns a non-negative integer for all valid lambda inputs
  - over 1000 calls, sample mean approximates lambda (statistical smoke test)

- **generateAIPrediction(homeRank, awayRank, isPlayoff, rng?)**: `{ homeScore: number; awayScore: number; homePenaltyWinner?: boolean; awayPenaltyWinner?: boolean }`
  Computes `λHome` and `λAway` via symmetric exponential scaling (`BASE_λ · exp(±K · diff)`), then samples each team's goals independently via Poisson. Win/draw/loss emerge naturally.
  Callers read `team.rank` from `teamsMap` and pass directly.
  `rng` defaults to `Math.random`; inject for deterministic tests.
  Tests:
  - scores are non-negative integers in all cases
  - one rank null → diff=0 → λHome = λAway = BASE_λ
  - both ranks null → λHome = λAway = BASE_λ
  - playoff draw (homeScore === awayScore): exactly one penalty winner set
  - non-playoff draw: no penalty winner fields set
  - diff=50 (Extreme home): λHome ≈ 4.0, λAway ≈ 0.36 (verify computed lambdas directly)
  - diff=−50 (Extreme away): λHome ≈ 0.36, λAway ≈ 4.0
  - diff=0: λHome = λAway = BASE_λ

### `app/components/context-providers/guesses-context-provider.tsx` *(modified)*
- **bulkSetGameGuesses(guesses: GameGuessNew[])**: `void`
  Merges all provided guesses into state atomically. Does not trigger auto-save.
  Calls: setGameGuesses (setState)
  Tests:
  - merges new guesses without overwriting unrelated existing ones
  - overwrites existing guesses for same game_id
  - empty array call leaves state unchanged

### `app/components/compact-game-view-card.tsx` *(modified)*
- **GameGuessProps** gains `onAIGenerateClick?: () => void`
  AI sparkle button renders when prop present + no prediction + not disabled.
  Tests:
  - renders AutoAwesome button when unpredicted and not disabled
  - does not render AI button when prediction present (homeScore defined)
  - does not render AI button when disabled=true
  - does not render AI button for GameResultProps / GameFixtureProps variants
  - calls onAIGenerateClick when button clicked

### `app/components/game-view.tsx` *(modified)*
- **GameView** gains `onAIGenerateClick?: (gameId: string) => void`
  Derives `handleAIGenerateClick` (undefined when teams unknown or editDisabled).
  Calls: generateAIPrediction, updateGameGuess
  Tests:
  - handleAIGenerateClick is undefined when home_team is null
  - handleAIGenerateClick is undefined when editDisabled
  - handleAIGenerateClick calls updateGameGuess with valid prediction when teams known

### `app/components/ai-generate-all-dialog.tsx` *(new)*
- **AiGenerateAllDialog(props)**: React component
  MUI Dialog with count display, loading state, error display, confirm/cancel.
  Confirm button is disabled and shows spinner when `loading=true`. Error message from `errorMessage` prop renders below the body text.
  Tests:
  - renders correct count in message
  - confirm button shows loading/disabled state when loading=true
  - calls onConfirm when confirm clicked and not loading
  - calls onClose when cancel clicked
  - renders error message when errorMessage prop is set
  - confirm button is NOT disabled when loading=false

### `app/components/unified-games-page-client.tsx` *(modified)*
- **aiGeneratableCount**: `number` (memo)
  Count of games that are unpredicted, before deadline, with known teams.
  Deadline filter uses strict `>` comparison: `calculateDeadline(game.game_date) > Date.now()` (exclusive — a game at exactly the deadline boundary is excluded).
  Tests:
  - counts only games without complete guesses
  - excludes games past deadline (deadline < now)
  - excludes game at exactly the deadline boundary (deadline === now → excluded)
  - excludes games with null home_team or away_team

- **handleAIGenerateAll**: `async () => void`
  Generates and saves bulk predictions. Guards against concurrent calls, cleans up `aiGenerating` in finally block regardless of outcome. On server error, sets `aiGenerateError` and keeps dialog open for retry.
  Tests:
  - sets aiGenerating=true while in-flight, false after completion
  - calls bulkSetGameGuesses and closes dialog on success
  - sets aiGenerateError and keeps dialog open when server returns success=false
  - sets aiGenerateError and keeps dialog open on network/thrown error
  - second call while aiGenerating=true is a no-op (concurrent guard)

---

## Visual Prototype

### Individual Card AI Button

```
┌─────────────────────────────────────────┐
│  ⚽  Argentina  vs  Mexico              │
│        [2]     vs    [—]               │
│   Group A · Closes in 3h              │
│                                         │
│                   [✨] [✏️]             │  ← AI sparkle + edit buttons
└─────────────────────────────────────────┘
```
- `✨` (AutoAwesome icon) only visible when no prediction and before deadline
- Same size/style as the existing edit button
- `✏️` edit button unchanged

### Bulk Button (Mobile FAB, existing area)

```
                        ┌────┐
                        │ ✨ │  ← AI-generate all FAB (new)
                        └────┘
                        ┌────┐
                        │ ↓  │  ← scroll-to-next (existing)
                        └────┘
```

### Confirmation Dialog

```
┌──────────────────────────────────────┐
│  ✨ AI-generate predictions          │
├──────────────────────────────────────┤
│  Generate predictions for            │
│  **36 unfilled games** based on      │
│  team rankings?                      │
│                                      │
│  [Cancel]              [Generate →]  │
└──────────────────────────────────────┘
```

---

## Implementation Order (Waves)

**Wave 1 — Algorithm (no UI, fully testable):**
- `app/utils/ai-prediction-generator.ts` + tests
- Note: `team.rank` is already available via Story #449 — no DB/migration/seed work needed

**Wave 2 — Context + Server plumbing:**
- Add `bulkSetGameGuesses` to GuessesContext + tests

**Wave 3 — Individual card AI button:**
- `CompactGameViewCard` — add prop + button
- `GameView` — handle click + generate
- Wire through games list (if needed)

**Wave 4 — Bulk UI + Dialog:**
- `AiGenerateAllDialog` component
- `unified-games-page-client.tsx` — bulk handler + FAB

**Wave 5 — i18n strings:**
- Add keys to `en/predictions.json` and `es/predictions.json`

**Wave 6 — CODE-STRUCTURE updates:**
- `docs/code-structure/utils.md`
- `docs/code-structure/actions.md` (no new action, but note `updateOrCreateGameGuesses` usage)
- `docs/code-structure/components/components-games.md`
- `CODE-STRUCTURE.md` call graph (Flow 1 update)

---

## Testing Strategy

- Unit tests for `hashSeed` and `generateAIPrediction` (all branches of outcome/score selection)
- Unit tests for `bulkSetGameGuesses` (merge semantics)
- Component tests for `CompactGameViewCard` AI button (conditional rendering)
- Component tests for `AiGenerateAllDialog` (count display, loading, callbacks)
- Integration: `GameView` + GuessesContext mock — AI click generates and saves prediction

Coverage target: ≥80% on all new files.

---

## Verification

1. Start dev server: `npm run dev`
2. Navigate to the games page for FIFA 2026
3. Verify ✨ button appears on cards with no prediction and before deadline
4. Click ✨ on a single card → card updates with a realistic score without page reload
5. Click ✨ "AI-generate all" FAB → dialog shows correct count of unfilled games
6. Confirm → all unfilled open games fill in, page does not reload
7. Existing predictions are unchanged
8. Past-deadline games are not touched
9. Switch locale to ES → all new strings display in Spanish
10. Run `npm test` → all new tests pass
11. Run `npm run build` → no TypeScript errors
12. Run `npm run lint` → no lint issues
