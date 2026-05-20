# Story 450: AI-Generate Game Score Predictions Based on Team Rankings

## Context

FIFA 2026 has 48 group-stage games — manually filling every score is a significant barrier to entry. This story adds an ✨ AI-generate feature that produces probabilistic scores based on FIFA world rankings. Users get two entry points: a per-game sparkle icon on unfilled cards and a bulk "AI-generate all" button. The algorithm is deterministic (same team pair → same prediction), so results feel computed rather than arbitrary. Existing predictions are never overwritten; deadline-closed games are skipped.

## Approach

Generate predictions **entirely client-side** using a pure utility function + static rankings data, then save via the existing `updateOrCreateGameGuesses()` server action. No new server action needed. The GuessesContext gains one new method (`bulkSetGameGuesses`) for efficient batch state updates after bulk generation.

The algorithm uses **real randomness** (`Math.random()`) so each invocation — and each user — gets different predictions for the same game. The rank ratio drives the *probability distribution*, not the outcome itself.

---

## Files to Create

### 1. `data/fifa-2026/rankings.ts`
Static record mapping TeamNames → FIFA world ranking (integer, 1 = best). Covers all 48 qualified teams. Used by the generation utility on the client. Playoff placeholder entries (UEFAPlayoffA, etc.) receive a default rank of 50 so the algorithm degrades gracefully if team is unknown.

### 2. `app/utils/ai-prediction-generator.ts`
Pure utility using `Math.random()` — each call produces a fresh probabilistic result.

```typescript
/** Main export: generate a random score for a game, weighted by rank ratio. */
export function generateAIPrediction(
  homeTeamId: string,
  awayTeamId: string,
  rankings: Record<string, number>,
  isPlayoff: boolean
): { homeScore: number; awayScore: number; homePenaltyWinner?: boolean; awayPenaltyWinner?: boolean }

/** Internal: pick a value from a weighted distribution using Math.random(). */
function pickWeighted<T>(options: Array<{ value: T; weight: number }>): T
```

Algorithm:
1. Lookup `homeRank` and `awayRank` from rankings map (default 50 if missing)
2. `diff = awayRank - homeRank` — positive = home team is stronger (lower rank = better)
3. `absDiff = Math.abs(diff)` — classify into **strength tier**:
   - **Even** (0–8): ~equal quality, e.g. Rank 1 vs Rank 3, Rank 10 vs Rank 15
   - **Moderate** (9–18): noticeable gap, e.g. Rank 1 vs Rank 10, Rank 5 vs Rank 20
   - **Strong** (19–28): clear mismatch, e.g. Rank 1 vs Rank 22, Rank 10 vs Rank 30
   - **Dominant** (29–49): heavy favourite, e.g. Rank 1 vs Rank 35, Rank 10 vs Rank 48
   - **Extreme** (50+): near-certain result, e.g. Germany vs Curaçao, Argentina vs Trinidad
4. Pick outcome (favoured win / draw / underdog win) using `pickWeighted` with tier probabilities:
   | Tier | Favoured win | Draw | Underdog win |
   |------|-------------|------|-------------|
   | Even | 35% | 30% | 35% |
   | Moderate | 50% | 30% | 20% |
   | Strong | 70% | 20% | 10% |
   | Dominant | 80% | 15% | 5% |
   | Extreme | 93% | 5% | 2% |

   Direction: if `diff > 0`, home team is the favoured side; if `diff < 0`, away team is.

5. Generate score using `pickWeighted` with **score distributions per tier and outcome**:

   **Even (0–8)**
   - Win: 1-0 (28%), 2-1 (27%), 2-0 (15%), 3-1 (10%), 3-2 (8%), 3-0 (5%), 4-2 (4%), 4-3 (3%)
   - Draw: 1-1 (44%), 0-0 (24%), 2-2 (20%), 3-3 (8%), 4-4 (4%)

   **Moderate (9–18)**
   - Win: 2-0 (22%), 2-1 (22%), 1-0 (20%), 3-0 (15%), 3-1 (12%), 4-1 (5%), 4-2 (3%), 5-2 (1%)
   - Draw: 1-1 (48%), 0-0 (20%), 2-2 (22%), 3-3 (8%), 4-4 (2%)

   **Strong (19–28)**
   - Win: 3-0 (22%), 2-0 (20%), 3-1 (18%), 4-0 (15%), 4-1 (12%), 5-0 (7%), 5-1 (4%), 5-2 (2%)
   - Draw: 1-1 (42%), 2-2 (30%), 3-3 (20%), 0-0 (5%), 4-4 (3%)

   **Dominant (29–49)**
   - Win: 4-0 (20%), 3-0 (18%), 4-1 (15%), 3-1 (15%), 5-0 (12%), 5-1 (10%), 6-0 (7%), 6-1 (3%)
   - Draw: 2-2 (40%), 1-1 (30%), 3-3 (22%), 4-4 (8%)

   **Extreme (50+)**
   - Win: 5-0 (20%), 4-0 (15%), 6-0 (15%), 5-1 (12%), 6-1 (10%), 7-0 (10%), 3-0 (8%), 7-1 (6%), 8-0 (4%)
   - Draw: 0-0 (30%), 1-1 (44%), 2-2 (20%), 3-3 (6%) — defensive masterclass / lucky day, mirrors Even distribution

   For underdog wins, use the **Even** win distribution regardless of tier (upsets are fluky, not high-scoring demolitions). Swap scores so the underdog's goals come first.

6. For playoff draw: `favoured wins penalties` with probability `Math.min(75, 50 + absDiff / 3)%` (stronger team more likely to win shootout, capped at 75%)

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

### 4. `app/components/context-providers/guesses-context-provider.tsx`
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

### 5. `app/components/compact-game-view-card.tsx`
Add `onAIGenerateClick?: () => void` to `GameGuessProps` only. Render an `AutoAwesome` icon button adjacent to the edit button when:
- `specificProps.isGameGuess && !hasResult && !disabled && onAIGenerateClick`

Button should be small (same size as edit button), use `AutoAwesome` icon from `@mui/icons-material`, and include a tooltip with the `aiGenerate.buttonLabel` translation key.

### 6. `app/components/game-view.tsx`
Add `onAIGenerateClick?: (gameId: string) => void` to `GameViewProps`. When provided, compute the AI prediction for this specific game and call `updateGameGuess()`:

```typescript
const handleAIGenerateClick = useMemo(() => {
  if (!onAIGenerateClick || !game.home_team || !game.away_team) return undefined;
  return () => {
    const prediction = generateAIPrediction(game.home_team!, game.away_team!, FIFA_2026_RANKINGS, isPlayoffGame);
    const updatedGuess = { ...gameGuess, ...prediction };
    updateGameGuess(game.id, updatedGuess); // auto-saves via context
  };
}, [onAIGenerateClick, game, isPlayoffGame, gameGuess, updateGameGuess]);
```

Pass `handleAIGenerateClick` down to `CompactGameViewCard` as `onAIGenerateClick`. Skip if `editDisabled` is true (uses same deadline check).

### 7. `app/components/games-list-with-scroll.tsx` (if GameView props are passed through)
Pass the new `onAIGenerateClick` prop down the chain to `GameView`. Check how GameView is rendered here.

### 8. `app/components/unified-games-page-client.tsx`
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
      ...generateAIPrediction(game.home_team!, game.away_team!, FIFA_2026_RANKINGS, !!game.playoffStage)
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

### 9. `locales/en/predictions.json` + `locales/es/predictions.json`
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

### `app/utils/ai-prediction-generator.ts` *(new)*
- **pickWeighted\<T\>(options: Array<{ value: T; weight: number }>)**: `T`
  Picks a random value from a weighted array using Math.random(). Used internally.
  Tests:
  - returns a value that exists in the options array
  - throws (or handles) when options array is empty
  - over many calls, distribution roughly matches weights (statistical smoke test with 1000 samples)

- **generateAIPrediction(homeTeamId, awayTeamId, rankings, isPlayoff)**: `{ homeScore: number; awayScore: number; homePenaltyWinner?: boolean; awayPenaltyWinner?: boolean }`
  Probabilistic score prediction using absolute rank difference + `Math.random()`-based weighted selection.
  Tests:
  - scores are non-negative integers in all cases
  - missing team in rankings defaults gracefully (rank 50)
  - playoff game with drawn score always has exactly one of homePenaltyWinner/awayPenaltyWinner set to true
  - non-playoff draw never sets penalty winner fields
  - with mock Math.random() returning 0: Extreme home favourite (diff=55) produces a high-scoring home win (≥3 home goals, 0-1 away goals)
  - with mock Math.random() returning 0: Extreme away favourite (diff=-55) produces a high-scoring away win
  - Even matchup (diff=3) outcome distribution is symmetric (home/away win equally likely across many calls)
  - Dominant tier (diff=40) underdog win uses Even distribution (low-scoring upset, not a demolition)
  - Extreme tier draw (forced via mock) produces score from Extreme draw distribution (0-0, 1-1 weighted heavily — not 3-3 or 4-4)

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

**Wave 1 — Data + Algorithm (no UI, fully testable):**
- `data/fifa-2026/rankings.ts`
- `app/utils/ai-prediction-generator.ts` + tests

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
