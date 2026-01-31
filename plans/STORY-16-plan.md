# UXI-004: Quick Prediction Mode (Batch Edit) - Implementation Plan

## Goal
Replace 5+ minute prediction workflow (25+ clicks) with inline card flip editing that takes ~90 seconds.

## User Requirements Summary
- **Hybrid Approach**: Dialog for urgency accordions, inline flip for full game lists
- **Shared Logic**: Extract common edit controls used by both dialog and inline editor
- **Card Flip**: Click edit → card flips → show inline editor on back
- **Auto-Save**: On blur with 500ms debounce
- **Keyboard Nav**: Tab (fields → next card), Arrow keys (boost), Escape (exit)

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│         GamePredictionEditControls                   │
│         (NEW: Shared component)                      │
│  - Score inputs (TextField)                          │
│  - Penalty selection (Checkbox)                      │
│  - Boost selector (ToggleButtonGroup)                │
│  - Validation & error display                        │
└──────────────┬──────────────────────┬────────────────┘
               │                      │
               │ Used by:             │ Used by:
               ▼                      ▼
    ┌──────────────────┐    ┌──────────────────┐
    │ Dialog Wrapper   │    │ Card Flip Back   │
    │ (existing)       │    │ (NEW)            │
    └──────────────────┘    └──────────────────┘
```

## Context Architecture Decision ⚠️

**Critical Issue**: Current `GuessesContext` uses batch save pattern (saves entire gameGuesses array), but inline editing needs per-game saves with debouncing.

**Solution**: Track dirty games and only save changed ones:
- Add `dirtyGames: Set<string>` to track which games have unsaved changes
- Add `lastSavedValues: Record<string, GameGuessNew>` to detect actual changes
- Modify `autoSaveGameGuesses()` to filter only dirty games before saving
- Clear dirty flag after successful save

This maintains backward compatibility while enabling per-game debouncing.

---

## Implementation Phases (REVISED ORDER)

### Phase 1: Shared Edit Controls Component ⭐
**Priority**: Critical Foundation | **Effort**: 2-3h

**Create**: `/Users/gvinokur/Personal/qatar-prode-story-16/app/components/game-prediction-edit-controls.tsx`

**Extracted from** `game-result-edit-dialog.tsx`:
- Lines 315-351: Score input grid
- Lines 355-432: Penalty selection logic
- Lines 436-520: Boost selector ToggleButtonGroup

**Props Interface**:
```typescript
interface GamePredictionEditControlsProps {
  // Game info
  gameId: string;
  homeTeamName: string;
  awayTeamName: string;
  isPlayoffGame: boolean;
  tournamentId?: string;

  // Values
  homeScore?: number;
  awayScore?: number;
  homePenaltyWinner?: boolean;
  awayPenaltyWinner?: boolean;
  boostType?: 'silver' | 'golden' | null;
  initialBoostType?: 'silver' | 'golden' | null;

  // Boost counts (passed from parent to avoid stale data)
  silverUsed: number;
  silverMax: number;
  goldenUsed: number;
  goldenMax: number;

  // Callbacks
  onHomeScoreChange: (value?: number) => void;
  onAwayScoreChange: (value?: number) => void;
  onHomePenaltyWinnerChange: (checked: boolean) => void;
  onAwayPenaltyWinnerChange: (checked: boolean) => void;
  onBoostTypeChange: (type: 'silver' | 'golden' | null) => void;

  // State
  loading?: boolean;
  error?: string | null;

  // Layout (vertical for dialog, horizontal for inline)
  layout?: 'vertical' | 'horizontal';
  compact?: boolean;

  // Refs for keyboard navigation
  homeScoreInputRef?: React.RefObject<HTMLInputElement>;
  awayScoreInputRef?: React.RefObject<HTMLInputElement>;
  boostButtonGroupRef?: React.RefObject<HTMLDivElement>;

  // Keyboard callbacks
  onTabFromLastField?: () => void; // Auto-advance to next card
  onEscapePressed?: () => void; // Exit edit mode
}
```

**Key Features**:
- **FIXED**: Boost counts passed as props (not fetched internally) to avoid stale data
- Calculate effective boost counts dynamically (account for switching types)
- TextField with `type="number"`, `min: 0`, centered text
- ToggleButtonGroup with StarIcon (silver) and TrophyIcon (golden)
- ARIA labels for accessibility
- Support both vertical (dialog) and horizontal (inline) layouts
- Keyboard event handlers for Tab (last field) and Escape

---

### Phase 2: Enhanced GuessesContext ⭐
**Priority**: Critical Infrastructure | **Effort**: 3-4h

**Modify**: `/Users/gvinokur/Personal/qatar-prode-story-16/app/components/context-providers/guesses-context-provider.tsx`

**Current Issues**:
- No debouncing (immediate save on line 44-46)
- Batch save pattern conflicts with per-game debouncing
- No error handling/rollback
- Silent failures
- No tracking of in-flight requests (race conditions)

**Changes Required**:

1. **Add State**:
```typescript
const [pendingSaves, setPendingSaves] = useState<Set<string>>(new Set());
const [saveErrors, setSaveErrors] = useState<Record<string, string>>({});
const [dirtyGames, setDirtyGames] = useState<Set<string>>(new Set());
const [lastSavedValues, setLastSavedValues] = useState<Record<string, GameGuessNew>>({});
const saveTimeoutRefs = useRef<Record<string, NodeJS.Timeout>>({});
const saveAbortControllers = useRef<Record<string, AbortController>>({});
const pendingSavePromises = useRef<Map<string, Promise<void>>>(new Map());
```

2. **Enhanced `updateGameGuess` Signature**:
```typescript
updateGameGuess(
  gameId: string,
  gameGuess: GameGuessNew,
  options?: { immediate?: boolean; debounceMs?: number }
): Promise<void>
```

3. **Implementation** with dirty tracking:
   - Optimistic update (immediate `setGameGuesses`)
   - Mark game as dirty: `setDirtyGames(prev => new Set(prev).add(gameId))`
   - Clear existing timeout and abort controller for gameId
   - Mark as pending save
   - Debounce 500ms (configurable)
   - **Only save dirty games** (not entire array)
   - Try-catch with rollback on error
   - Clear dirty flag on success
   - Track promise to prevent concurrent saves

4. **Modified `autoSaveGameGuesses`** (FIXED: race condition):
```typescript
// CRITICAL FIX: Use ref to always read latest gameGuesses state
const gameGuessesRef = useRef(gameGuesses);
useEffect(() => {
  gameGuessesRef.current = gameGuesses;
}, [gameGuesses]);

const autoSaveGameGuesses = async () => {
  // Always read from ref to get latest values (avoid stale closure)
  const currentGuesses = gameGuessesRef.current;

  // Filter only dirty games that have actually changed
  const dirtyGuessesArray = Array.from(dirtyGames)
    .filter(gameId => {
      const current = currentGuesses[gameId];
      const lastSaved = lastSavedValues[gameId];
      return !lastSaved || JSON.stringify(current) !== JSON.stringify(lastSaved);
    })
    .map(gameId => currentGuesses[gameId]);

  if (dirtyGuessesArray.length === 0) return;

  // Include updated_at timestamp for optimistic locking
  const guessesWithTimestamp = dirtyGuessesArray.map(g => ({
    ...g,
    updated_at: new Date()
  }));

  await updateOrCreateGameGuesses(guessesWithTimestamp);

  // Update lastSavedValues
  setLastSavedValues(prev => ({
    ...prev,
    ...Object.fromEntries(dirtyGuessesArray.map(g => [g.game_id, g]))
  }));

  // Clear dirty flags for saved games
  setDirtyGames(prev => {
    const next = new Set(prev);
    dirtyGuessesArray.forEach(g => next.delete(g.game_id));
    return next;
  });
};
```

5. **Concurrent Save Protection with Optimistic Locking**:
```typescript
const executeSave = async () => {
  // Check if save already in progress
  if (pendingSavePromises.current.has(gameId)) {
    await pendingSavePromises.current.get(gameId);
    return;
  }

  // Create AbortController for this save
  const abortController = new AbortController();
  saveAbortControllers.current[gameId] = abortController;

  const savePromise = (async () => {
    try {
      await autoSaveGameGuesses(); // Uses ref for latest values

      // Success: clear flags
      setPendingSaves(prev => {
        const next = new Set(prev);
        next.delete(gameId);
        return next;
      });
    } catch (error) {
      if (error.name === 'AbortError') return; // Cancelled, not an error

      // Check for conflict (409 status)
      if (error.response?.status === 409) {
        // Multi-user conflict detected
        setSaveErrors(prev => ({
          ...prev,
          [gameId]: 'This prediction was updated by another user. Please refresh.'
        }));
        // Don't rollback - let user see conflict message
        return;
      }

      // Network/server error: rollback
      setGameGuesses(prev => ({
        ...prev,
        [gameId]: previousGuess
      }));

      setSaveErrors(prev => ({
        ...prev,
        [gameId]: 'Failed to save. Click retry.'
      }));
    } finally {
      pendingSavePromises.current.delete(gameId);
      delete saveAbortControllers.current[gameId];
    }
  })();

  pendingSavePromises.current.set(gameId, savePromise);
  await savePromise;
};
```

**Server-Side Changes Required**:
Modify `/Users/gvinokur/Personal/qatar-prode-story-16/app/db/game-guess-repository.ts`:

```typescript
export async function updateOrCreateGuess(gameGuess: GameGuessNew) {
  const existing = await db.selectFrom('game_guesses')
    .where('game_id', '=', gameGuess.game_id)
    .where('user_id', '=', gameGuess.user_id)
    .select(['updated_at'])
    .executeTakeFirst();

  // Optimistic locking: check timestamp
  if (existing && gameGuess.updated_at) {
    if (new Date(existing.updated_at) > new Date(gameGuess.updated_at)) {
      // Server version is newer - conflict!
      throw new Error('CONFLICT:409');
    }
  }

  // Proceed with update
  await db.deleteFrom('game_guesses')
    .where('game_id', '=', gameGuess.game_id)
    .where('user_id', '=', gameGuess.user_id)
    .execute();

  return db.insertInto('game_guesses')
    .values({
      ...gameGuess,
      updated_at: new Date() // Server sets timestamp
    })
    .execute();
}
```

6. **Context Value Updates**:
```typescript
{
  gameGuesses,
  guessedPositions,
  updateGameGuess,
  pendingSaves,           // NEW
  saveErrors,             // NEW
  dirtyGames,             // NEW
  clearSaveError,         // NEW
  flushPendingSave        // NEW: await pending save for gameId
}
```

7. **Cleanup on Unmount**:
```typescript
useEffect(() => {
  return () => {
    // Clear timeouts
    Object.values(saveTimeoutRefs.current).forEach(clearTimeout);
    // Abort in-flight requests
    Object.values(saveAbortControllers.current).forEach(c => c.abort());
    // Flush remaining dirty games
    if (dirtyGames.size > 0) {
      const dirtyGuessesArray = Array.from(dirtyGames).map(id => gameGuesses[id]);
      updateOrCreateGameGuesses(dirtyGuessesArray).catch(() => {
        // Silent fail on unmount
      });
    }
  };
}, [dirtyGames, gameGuesses]);
```

**Testing**:
- Rapid input → only one save after debounce
- Concurrent saves → await previous save before starting new one
- Server error → rollback to previous value
- Unmount → flush dirty games, abort in-flight
- Tab switch → dirty games persisted
- Only changed games sent to server (not entire array)

---

### Phase 3: Refactor Dialog (Backward Compatibility)
**Priority**: Medium | **Effort**: 1-2h

**Modify**: `/Users/gvinokur/Personal/qatar-prode-story-16/app/components/game-result-edit-dialog.tsx`

**Changes**:
1. Import `GamePredictionEditControls`
2. Replace lines 315-520 with:
```tsx
<GamePredictionEditControls
  gameId={props.gameId}
  homeTeamName={props.homeTeamName}
  awayTeamName={props.awayTeamName}
  isPlayoffGame={props.isPlayoffGame}
  tournamentId={props.tournamentId}
  homeScore={homeScore}
  awayScore={awayScore}
  homePenaltyWinner={homePenaltyWinner}
  awayPenaltyWinner={awayPenaltyWinner}
  boostType={boostType}
  initialBoostType={props.initialBoostType}
  onHomeScoreChange={setHomeScore}
  onAwayScoreChange={setAwayScore}
  onHomePenaltyWinnerChange={setHomePenaltyWinner}
  onAwayPenaltyWinnerChange={setAwayPenaltyWinner}
  onBoostTypeChange={setBoostType}
  loading={loading}
  error={error}
  layout="vertical"
/>
```
3. Keep dialog wrapper, title, actions
4. Keep DateTimePicker for game results (not applicable to guesses)

**Verify**:
- Urgency accordions still work (`urgency-accordion-group.tsx` lines 251-268)
- No visual changes for users
- All existing functionality preserved

---

### Phase 4: Card Flip Animation Component ⭐
**Priority**: High | **Effort**: 3-4h

**Create**: `/Users/gvinokur/Personal/qatar-prode-story-16/app/components/flippable-game-card.tsx`

**Dependencies**: Framer Motion v12.11.0 (already installed)

**CRITICAL FIX**: Don't flip entire CompactGameViewCard (419 lines with complex interactions). Instead:
- **Keep header visible** (game countdown, boost chip, edit button)
- **Only flip content area** (teams + scores section, lines 254-354 of compact-game-view-card.tsx)
- **Preserve state** during flip (no AnimatePresence mode="wait")

**Props Interface** (FULLY CONTROLLED - no context reading):
```typescript
interface FlippableGameCardProps {
  // Game data
  game: ExtendedGameData;
  teamsMap: Record<string, Team>;
  isPlayoffs: boolean;
  tournamentId?: string;

  // Current guess values (from parent's context)
  homeScore?: number;
  awayScore?: number;
  homePenaltyWinner?: boolean;
  awayPenaltyWinner?: boolean;
  boostType?: 'silver' | 'golden' | null;
  initialBoostType?: 'silver' | 'golden' | null;

  // Edit state
  isEditing: boolean;
  onEditStart: () => void;
  onEditEnd: () => void;

  // Edit callbacks (parent handles context updates)
  onHomeScoreChange: (value?: number) => void;
  onAwayScoreChange: (value?: number) => void;
  onHomePenaltyWinnerChange: (checked: boolean) => void;
  onAwayPenaltyWinnerChange: (checked: boolean) => void;
  onBoostTypeChange: (type: 'silver' | 'golden' | null) => void;

  // Boost counts for edit controls
  silverUsed: number;
  silverMax: number;
  goldenUsed: number;
  goldenMax: number;

  // State indicators (from parent's context)
  isPending: boolean; // pendingSaves.has(game.id)
  error?: string | null; // saveErrors[game.id]

  // Disabled state
  disabled?: boolean;

  // Auto-advance
  onAutoAdvanceNext?: () => void;
}
```

**Rationale**: Fully controlled component is:
- **Testable**: No context mocking required
- **Clear data flow**: All data via props, no dual sources
- **Reusable**: Can use outside GuessesContext if needed
```

**Animation Pattern** (flip only content, not card wrapper):
```typescript
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from 'framer-motion';

const flipVariants = {
  front: {
    rotateY: 0,
    transition: { duration: 0.4, ease: 'easeInOut' },
    backfaceVisibility: 'hidden'
  },
  back: {
    rotateY: 180,
    transition: { duration: 0.4, ease: 'easeInOut' },
    backfaceVisibility: 'hidden'
  }
};

export function FlippableGameCard({ game, teamsMap, ... }: FlippableGameCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const groupContext = useContext(GuessesContext);
  const gameGuess = groupContext.gameGuesses[game.id];

  return (
    <Card variant="outlined" sx={{ position: 'relative' }}>
      {/* Header: ALWAYS VISIBLE (no flip) */}
      <CardContent sx={{ py: 2, px: 2, '&:last-child': { pb: 3 } }}>
        <GameCountdownDisplay {...} />
        <Divider />

        {/* Flippable Content Area */}
        <Box sx={{ perspective: '1000px', position: 'relative', minHeight: '120px' }}>
          <AnimatePresence mode="sync" initial={false}>
            {!isEditing ? (
              <motion.div
                key="front"
                layoutId={`game-${game.id}-content`}
                initial={prefersReducedMotion ? false : "back"}
                animate="front"
                exit="back"
                variants={prefersReducedMotion ? {} : flipVariants}
                style={{
                  position: 'absolute',
                  width: '100%',
                  transformStyle: 'preserve-3d'
                }}
              >
                {/* Teams grid (lines 254-354 from CompactGameViewCard) */}
                <Grid container spacing={1}>
                  {/* Home team, score, away team */}
                </Grid>
              </motion.div>
            ) : (
              <motion.div
                key="back"
                layoutId={`game-${game.id}-content`}
                initial={prefersReducedMotion ? false : "front"}
                animate="back"
                exit="front"
                variants={prefersReducedMotion ? {} : flipVariants}
                style={{
                  position: 'absolute',
                  width: '100%',
                  transform: 'rotateY(180deg)',
                  transformStyle: 'preserve-3d'
                }}
              >
                <Box sx={{ transform: 'scaleX(-1)' /* Un-flip content */ }}>
                  <GamePredictionEditControls
                    {...editControlsProps}
                    layout="horizontal"
                    compact
                    onTabFromLastField={onAutoAdvanceNext}
                    onEscapePressed={onEditEnd}
                  />
                </Box>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>

        <Divider sx={{ mt: 2 }} />

        {/* Footer: Location, actual result (if exists) */}
      </CardContent>
    </Card>
  );
}
```

**Keyboard Navigation State Machine**:
```typescript
// States: idle, editing_home, editing_away, editing_boost
// Transitions:
//   idle + Enter → editing_home (focus home input)
//   editing_home + Tab → editing_away
//   editing_away + Tab → editing_boost
//   editing_boost + Tab → onAutoAdvanceNext() (if not last card)
//   editing_boost + Tab (last card) → blur (stay in edit)
//   any + Shift+Tab → previous field (or stay if first)
//   any + Escape → idle (exit edit mode, restore focus to edit button)
//   editing_boost + Enter → blur (explicit save)

const [focusState, setFocusState] = useState<'idle' | 'home' | 'away' | 'boost'>('idle');

useEffect(() => {
  if (isEditing && focusState === 'idle') {
    setFocusState('home');
    homeInputRef.current?.focus();
  }
}, [isEditing, focusState]);

const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Escape') {
    onEditEnd();
    setFocusState('idle');
    // Restore focus to edit button
    editButtonRef.current?.focus();
  }
};
```

**Visual Feedback**:
- Show `CircularProgress` in corner when `pendingSaves.has(gameId)`
- Error Alert below controls if `saveErrors[gameId]` exists
- Overlay with `alpha(primary, 0.05)` during save
- Subtle border pulse during edit: `animation: pulse 2s infinite`

**Performance Optimizations**:
- `layoutId` prevents layout thrashing during flip
- `transform-style: preserve-3d` enables GPU acceleration
- `backface-visibility: hidden` prevents render on backside
- `will-change: transform` hint for browser
- `useReducedMotion()` respects accessibility preferences

---

### Phase 5: Integrate into GamesGrid ⭐
**Priority**: Critical | **Effort**: 2-3h

**Modify**: `/Users/gvinokur/Personal/qatar-prode-story-16/app/components/games-grid.tsx`

**Changes**:

1. **Add State**:
```typescript
const [editingGameId, setEditingGameId] = useState<string | null>(null);
// Note: No feature flag - inline editing is the default now
// Dialog only used for urgency accordions (space-constrained context)
```

2. **Update `handleEditClick`** (lines 69-76):
```typescript
const handleEditClick = (gameNumber: number) => {
  if (!isLoggedIn) return;
  const game = games.find(g => g.game_number === gameNumber);
  if (!game) return;

  // Always use inline editing in GamesGrid
  setEditingGameId(game.id);
};
```

3. **Replace GameView with FlippableGameCard** (lines 144-151):
```tsx
<Grid container spacing={2}>
  {games.map(game => {
    const gameGuess = gameGuesses[game.id];
    const homeTeam = game.home_team || gameGuess?.home_team;
    const awayTeam = game.away_team || gameGuess?.away_team;

    return (
      <Grid key={game.game_number} size={{ xs: 12, sm: 6 }}>
        <FlippableGameCard
          game={game}
          teamsMap={teamsMap}
          isPlayoffs={isPlayoffs}
          tournamentId={tournamentId}
          isEditing={editingGameId === game.id}
          onEditStart={() => handleEditStart(game.id)}
          onEditEnd={() => setEditingGameId(null)}
          silverUsed={dashboardStats.silverUsed}
          silverMax={tournament.max_silver_games}
          goldenUsed={dashboardStats.goldenUsed}
          goldenMax={tournament.max_golden_games}
          disabled={!isLoggedIn}
          onAutoAdvanceNext={() => {
            const idx = games.findIndex(g => g.id === game.id);
            // Find next enabled game (skip disabled and errored)
            for (let i = idx + 1; i < games.length; i++) {
              const nextGame = games[i];
              const isDisabled = Date.now() + ONE_HOUR > nextGame.game_date.getTime();
              const hasError = groupContext.saveErrors[nextGame.id];

              if (!isDisabled && !hasError) {
                setEditingGameId(nextGame.id);

                // Scroll to next card
                setTimeout(() => {
                  const cardElement = document.querySelector(`[data-game-id="${nextGame.id}"]`);
                  cardElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100); // Delay for flip animation to start

                return;
              }
            }

            // No next enabled game - show feedback
            // Option: Use toast/snackbar (MUI already has this)
            // For now: just stay in current card, user can manually close
          }}
        />
      </Grid>
    );
  })}
</Grid>
```

4. **Concurrent Edit Protection**:
```typescript
const handleEditStart = (gameId: string) => {
  // If another card is editing, flush its pending save
  if (editingGameId && editingGameId !== gameId) {
    if (groupContext.pendingSaves.has(editingGameId)) {
      const prevGuess = gameGuesses[editingGameId];
      if (prevGuess) {
        groupContext.updateGameGuess(editingGameId, prevGuess, { immediate: true });
      }
    }
  }
  setEditingGameId(gameId);
};
```

5. **Keep Dialog for Urgency Accordions** (lines 153-171):
   - Dialog code remains for backward compatibility
   - Used exclusively by `urgency-accordion-group.tsx` (hybrid approach)
   - Reason: Urgency accordions are space-constrained, dialog is appropriate

---

## Edit Mode Coordination (Hybrid Approach)

**Problem**: GamesGrid uses inline flip, UrgencyAccordion uses dialog. Need to prevent both being open simultaneously.

**Solution**: Shared context for edit state coordination.

**Create**: `/Users/gvinokur/Personal/qatar-prode-story-16/app/components/context-providers/edit-mode-context-provider.tsx`

```typescript
interface EditModeContextValue {
  editingGameId: string | null;
  editMode: 'inline' | 'dialog' | null;
  startEdit: (gameId: string, mode: 'inline' | 'dialog') => Promise<void>;
  endEdit: () => void;
}

export function EditModeProvider({ children }) {
  const [editingGameId, setEditingGameId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<'inline' | 'dialog' | null>(null);
  const guessesContext = useContext(GuessesContext);

  const startEdit = async (gameId: string, mode: 'inline' | 'dialog') => {
    // Close any existing edit before opening new one
    if (editingGameId && editingGameId !== gameId) {
      // Flush pending save for previous game
      if (guessesContext.pendingSaves.has(editingGameId)) {
        try {
          await guessesContext.flushPendingSave(editingGameId);
        } catch (error) {
          console.error('Failed to save previous game:', error);
          // Continue anyway - don't block new edit
        }
      }
    }
    setEditingGameId(gameId);
    setEditMode(mode);
  };

  const endEdit = () => {
    setEditingGameId(null);
    setEditMode(null);
  };

  return (
    <EditModeContext.Provider value={{ editingGameId, editMode, startEdit, endEdit }}>
      {children}
    </EditModeContext.Provider>
  );
}
```

**Provider Location**: Wrap at tournament page layout level:

Modify `/Users/gvinokur/Personal/qatar-prode-story-16/app/tournaments/[id]/layout.tsx` (or create if doesn't exist):

```typescript
export default function TournamentLayout({ children }) {
  return (
    <GuessesContextProvider gameGuesses={gameGuesses} autoSave={true}>
      <EditModeProvider>
        {children}
      </EditModeProvider>
    </GuessesContextProvider>
  );
}
```

This ensures EditModeContext is available to both:
- GamesGrid (inline editing)
- UrgencyAccordion (dialog editing)
- Both within same tournament context
```

**Usage in GamesGrid**:
```typescript
const { startEdit, endEdit } = useContext(EditModeContext);

const handleEditStart = (gameId: string) => {
  startEdit(gameId, 'inline');
};
```

**Usage in UrgencyAccordion**:
```typescript
const { startEdit, endEdit } = useContext(EditModeContext);

const handleEditGame = (gameId: string) => {
  startEdit(gameId, 'dialog');
  setEditDialogOpen(true);
};
```

This ensures only one edit UI (inline or dialog) is active at a time.

---

### Phase 6: Mobile Optimization
**Priority**: Medium | **Effort**: 2-3h

**CRITICAL FIX**: Don't use Accordion (conflicts with edit button click). Use **slide-down panel** instead.

**Changes in `flippable-game-card.tsx`**:

```typescript
import { useMediaQuery, useTheme, Collapse } from '@mui/material';

const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

// Mobile: Slide panel below card (no flip)
if (isMobile) {
  return (
    <Card variant="outlined">
      <CardContent>
        {/* Header + Teams grid (always visible) */}
        <GameCountdownDisplay {...} />
        <Divider />

        {/* Teams section (not flipped) */}
        <Grid container spacing={1}>
          {/* Home team, scores, away team */}
        </Grid>

        {/* Edit controls slide down */}
        <Collapse in={isEditing} timeout={300}>
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <GamePredictionEditControls
              {...editControlsProps}
              layout="vertical"
              compact
              onTabFromLastField={onAutoAdvanceNext}
              onEscapePressed={onEditEnd}
            />
          </Box>
        </Collapse>

        <Divider sx={{ mt: 2 }} />
        {/* Footer: location */}
      </CardContent>
    </Card>
  );
}

// Desktop: card flip animation (Phase 4 implementation)
```

**Key Differences Mobile vs Desktop**:
- **Desktop**: 3D flip animation (0.4s), horizontal layout, Tab navigation
- **Mobile**: Slide-down Collapse (0.3s), vertical layout, no Tab key
- Both use same edit controls component
- Mobile: Better touch targets (larger buttons, `minHeight: 44px`)

**Mobile Keyboard Behavior**:
- Virtual keyboard shows on focus → card scrolls to keep input visible (browser default)
- **No Tab key on most mobile keyboards** → use "Next" button instead:
  ```tsx
  {isMobile && (
    <Button
      fullWidth
      variant="outlined"
      onClick={() => {
        // Advance to next field: home → away → boost → done
        if (currentField === 'home') awayInputRef.current?.focus();
        else if (currentField === 'away') boostButtonRef.current?.focus();
        else onAutoAdvanceNext?.(); // Or close edit
      }}
    >
      Next
    </Button>
  )}
  ```
- Auto-advance works via "Next" button, not Tab
- Escape key often not available → "Cancel" button always visible

**Accessibility**:
- `aria-label="Edit prediction for {home} vs {away}"` on edit button
- `aria-live="polite"` region for save status announcements
- `aria-invalid="true"` on inputs with errors
- `aria-expanded={isEditing}` on edit button
- Focus management: edit start → focus home input, edit end → restore focus to edit button
- Screen reader announcement: "Editing prediction. Press Escape to cancel"

---

### Phase 7: Edge Cases & Error Recovery
**Priority**: Medium | **Effort**: 2-3h

**Edge Cases to Handle**:

1. **Network Failures with User-Initiated Retry** (SIMPLIFIED):
   - **No automatic retry** - simpler, avoids countdown timer complexity
   - On network error (500, 503, timeout): rollback + show "Retry" button
   - Don't retry validation errors (400, 422) - show error message
   - User clicks "Retry" → immediate save attempt
   - Keep edit mode open after error (allow user to fix or retry)

   ```typescript
   const isRetryableError = (error: any) => {
     return error.response?.status >= 500 || error.message === 'Network Error';
   };

   try {
     await autoSaveGameGuesses();
     // Success
   } catch (error) {
     if (isRetryableError(error)) {
       // Retryable: rollback + show retry button
       setGameGuesses(prev => ({
         ...prev,
         [gameId]: previousGuess
       }));
       setSaveErrors(prev => ({
         ...prev,
         [gameId]: 'Network error. Click Retry.'
       }));
       // Expose retry function
       setRetryCallbacks(prev => ({
         ...prev,
         [gameId]: () => updateGameGuess(gameId, newGuess, { immediate: true })
       }));
     } else {
       // Non-retryable: show error, don't rollback (might be validation)
       setSaveErrors(prev => ({
         ...prev,
         [gameId]: error.message || 'Failed to save.'
       }));
     }
   }
   ```

   **In GamePredictionEditControls**:
   ```tsx
   {error && (
     <Alert severity="error" action={
       retryCallback && (
         <Button color="inherit" size="small" onClick={retryCallback}>
           Retry
         </Button>
       )
     }>
       {error}
     </Alert>
   )}
   ```

2. **Validation Edge Cases**:
   - Playoff tie + no penalty winner → show inline error, keep edit open
   - Boost limit reached → disable button, show "X/Y used" badge
   - Negative scores → prevented by `min: 0` on TextField
   - Empty scores → save as `undefined` (valid partial prediction)

3. **Concurrent Edit Protection** (COMPREHENSIVE):
   - Only one card editable at a time in grid
   - When opening new card: await pending save of previous card
   - If previous save fails: show error but still allow opening new card
   - Use `flushPendingSave(gameId)` from context

   ```typescript
   const handleEditStart = async (gameId: string) => {
     if (editingGameId && editingGameId !== gameId) {
       // Await previous card's pending save
       try {
         await groupContext.flushPendingSave(editingGameId);
       } catch (error) {
         // Show error but allow continuing
         console.error('Failed to save previous game:', error);
       }
     }
     setEditingGameId(gameId);
   };
   ```

4. **Auto-Advance Edge Cases**:
   - Tab from boost selector → advance to next card
   - Skip disabled games (started games, locked games)
   - If no next enabled game → stay in current card
   - Shift+Tab from home score → focus previous card (if editing)
   - User typing rapidly → debounce prevents lost input

5. **Race Conditions**:
   - Multiple tabs: Use server-side timestamp to detect stale updates
   - Rapid card switching: AbortController cancels in-flight requests
   - Unmount during save: Flush dirty games, abort abortable requests

---

## Automated Testing Strategy

**Test Framework**: Vitest + React Testing Library (already configured)

**Mocking Strategy**:
```typescript
// Mock next-auth
vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { id: 'test-user' } } })
}));

// Mock framer-motion (disable animations)
vi.mock('framer-motion', () => ({
  motion: { div: 'div' },
  AnimatePresence: ({ children }) => children,
  useReducedMotion: () => false
}));

// Mock server actions
vi.mock('../actions/guesses-actions', () => ({
  updateOrCreateGameGuesses: vi.fn().mockResolvedValue(undefined)
}));
```

**Test Files to Create**:

1. **`game-prediction-edit-controls.test.tsx`**:
   - Renders all fields correctly
   - Home/away score inputs accept numbers only
   - Boost selector respects limits (disable when max reached)
   - Effective boost calculation (switching silver→golden)
   - Penalty checkboxes mutual exclusion
   - Tab order: home → away → boost
   - Escape calls `onEscapePressed` callback
   - Tab from last field calls `onTabFromLastField`

2. **`flippable-game-card.test.tsx`**:
   - Card flips on edit start/end
   - Only content area flips (header stays visible)
   - Escape closes edit mode
   - Focus moves to home input on edit start
   - Auto-advance to next card on Tab from last field
   - Save indicator shows when `pendingSaves` includes gameId
   - Error alert shows when `saveErrors` has gameId
   - Mobile: slide panel instead of flip

3. **`guesses-context-provider.test.tsx`**:
   - Debouncing: rapid updates → single save after 500ms
   - Dirty tracking: only changed games saved to server
   - Error rollback: failed save reverts to lastSavedValue
   - Concurrent saves: await previous promise before starting new
   - Cleanup: flush dirty games on unmount
   - Abort in-flight requests on unmount

4. **`games-grid.test.tsx`**:
   - Inline editing mode: click edit → card flips
   - Concurrent edit protection: opening new card flushes previous
   - Auto-advance: Tab from last card advances to next
   - Skip disabled games during auto-advance
   - Dialog fallback still works (urgency accordions)

**Coverage Target**: ≥80% on new code (per CLAUDE.md)

**Example Test**:
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

describe('GamePredictionEditControls', () => {
  it('debounces onChange and calls parent after 500ms', async () => {
    const onHomeScoreChange = vi.fn();
    render(<GamePredictionEditControls homeScore={1} onHomeScoreChange={onHomeScoreChange} {...props} />);

    const input = screen.getByLabelText(/home score/i);

    // Rapid typing
    fireEvent.change(input, { target: { value: '2' } });
    fireEvent.change(input, { target: { value: '3' } });

    // Should NOT call immediately
    expect(onHomeScoreChange).not.toHaveBeenCalled();

    // After 500ms, should call once with final value
    await waitFor(() => expect(onHomeScoreChange).toHaveBeenCalledWith(3), { timeout: 600 });
    expect(onHomeScoreChange).toHaveBeenCalledTimes(1);
  });
});
```

**Integration Tests** (CRITICAL for concurrent edit flow):

```typescript
describe('Concurrent Edit Flow Integration', () => {
  it('handles rapid card switching with save failure', async () => {
    const { findByTestId, findByText } = render(<GamesGrid games={mockGames} teamsMap={mockTeams} ... />);

    // 1. Edit Game A
    const gameACard = await findByTestId('game-card-A');
    fireEvent.click(within(gameACard).getByLabelText('Edit'));
    await waitFor(() => expect(gameACard).toHaveAttribute('data-editing', 'true'));

    // 2. Enter score in Game A
    const homeInput = within(gameACard).getByLabelText('Home Score');
    fireEvent.change(homeInput, { target: { value: '2' } });

    // 3. Don't wait for debounce - immediately edit Game B
    const gameBCard = await findByTestId('game-card-B');
    fireEvent.click(within(gameBCard).getByLabelText('Edit'));

    // 4. Verify: Game A save was flushed (immediate)
    await waitFor(() => {
      expect(mockUpdateGameGuesses).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ game_id: 'game-A', home_score: 2 })])
      );
    });

    // 5. Mock Game A save failure
    mockUpdateGameGuesses.mockRejectedValueOnce(new Error('Network Error'));

    // 6. Verify: Game B entered edit mode despite Game A failure
    await waitFor(() => expect(gameBCard).toHaveAttribute('data-editing', 'true'));

    // 7. Verify: Game A shows error (not corrupted)
    expect(await findByText(/Network error/)).toBeInTheDocument();

    // 8. Verify: Game B state not corrupted
    const gameBHomeInput = within(gameBCard).getByLabelText('Home Score');
    expect(gameBHomeInput).toHaveValue(null); // Clean state
  });
});
```

**Manual Testing Checklist**:
- [ ] Card flip animation smooth (400ms, desktop)
- [ ] Slide panel smooth (300ms, mobile)
- [ ] Auto-save triggers after 500ms debounce
- [ ] Tab navigation: Home → Away → Boost → Next card → scrolls into view
- [ ] Shift+Tab: reverse navigation
- [ ] Escape closes edit mode, restores focus
- [ ] Error shows + rollback on network failure
- [ ] Retry button appears on retryable errors
- [ ] Only one card editable at a time (flushes previous)
- [ ] Urgency accordions still use dialog (hybrid approach)
- [ ] Boost limits enforced correctly (can't exceed max)
- [ ] Boost switching doesn't count against limit
- [ ] Playoff penalty validation works (tied games)
- [ ] Multi-user conflict shows appropriate message (refresh prompt)

---

## Critical Files Reference

### Create New:
1. `/Users/gvinokur/Personal/qatar-prode-story-16/app/components/game-prediction-edit-controls.tsx`
2. `/Users/gvinokur/Personal/qatar-prode-story-16/app/components/flippable-game-card.tsx`

### Modify:
1. `/Users/gvinokur/Personal/qatar-prode-story-16/app/components/context-providers/guesses-context-provider.tsx`
2. `/Users/gvinokur/Personal/qatar-prode-story-16/app/components/game-result-edit-dialog.tsx`
3. `/Users/gvinokur/Personal/qatar-prode-story-16/app/components/games-grid.tsx`

### Keep Unchanged (Hybrid Approach):
1. `/Users/gvinokur/Personal/qatar-prode-story-16/app/components/urgency-accordion-group.tsx` - Continues using dialog

---

## Implementation Notes (from final review)

**3 Integration Points to Watch** (not blockers, just verification needed):

1. **Server Action Error Format**:
   - Current: `updateOrCreateGameGuesses` returns `'Unauthorized action'` string or lets errors bubble
   - Plan assumes: Errors have `error.response?.status` property (HTTP-like)
   - Action: Add adapter layer in error handling to check error type/message

2. **Repository Optimistic Locking**:
   - Current: `updateOrCreateGuess` has no version checking (delete + insert)
   - Plan adds: Timestamp check for multi-user conflicts (lines 273-300)
   - Verify: `GameGuessNew.updated_at` exists in schema ✅ (confirmed line 373-374)

3. **GamesGrid Boost Counts Source**:
   - Plan uses: `silverUsed={dashboardStats.silverUsed}` (line 632-636)
   - Verify during Phase 5: Where does `dashboardStats` come from? (likely parent prop)
   - Fallback: Calculate from `gameGuesses` directly if needed

4. **EditModeProvider File Creation**:
   - Create: `/Users/gvinokur/Personal/qatar-prode-story-16/app/tournaments/[id]/layout.tsx`
   - File doesn't exist yet - standard Next.js 15 App Router pattern

---

## Verification Steps

### After Phase 1-3 (Shared Component + Refactor):
```bash
# Verify dialog still works
npm run dev
# Navigate to: /tournaments/[id]
# Click edit on game in urgency accordion
# Should open dialog with new shared controls
```

### After Phase 4-5 (Card Flip):
```bash
# Verify inline editing
npm run dev
# Navigate to: /groups/[id] or /tournaments/[id]/playoffs
# Click edit button on game card
# Should flip card, show inline editor
# Enter scores, select boost
# Tab through fields
# Escape to close
# Verify auto-save after 500ms
```

### Final Validation:
```bash
# Run tests
npm run test

# Run lint
npm run lint

# Build for production
npm run build
```

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Dialog breaks after refactor | Keep comprehensive tests, feature flag for fallback |
| Debouncing causes data loss | Flush on unmount, immediate save on navigation |
| Card flip disorienting | Use accordion on mobile, 400ms duration feels natural |
| Performance degradation | GPU-accelerated animations, debouncing reduces server load |

---

## Success Metrics

**Quantitative**:
- Prediction time: 5+ min → ~90 sec ✅
- Click count: 25+ → ~10 ✅
- Server requests: 25+ → 5-8 per session ✅

**Qualitative**:
- Smoother bulk prediction experience
- No accessibility regressions
- Mobile-friendly editing

---

## Implementation Order (REVISED)

## Minimal Feature Flag (Kill Switch)

Given the complexity (7 phases, 18-28 hours), add a simple on/off kill switch for first 2 weeks after launch:

**Environment Variable**: `NEXT_PUBLIC_INLINE_EDIT_ENABLED=true`

**Usage in GamesGrid**:
```typescript
const INLINE_EDIT_ENABLED = process.env.NEXT_PUBLIC_INLINE_EDIT_ENABLED === 'true';

return (
  <Grid container spacing={2}>
    {games.map(game => (
      <Grid key={game.game_number} size={{ xs: 12, sm: 6 }}>
        {INLINE_EDIT_ENABLED ? (
          <FlippableGameCard {...props} />
        ) : (
          <GameView game={game} teamsMap={teamsMap} handleEditClick={handleEditClick} disabled={!isLoggedIn} />
        )}
      </Grid>
    ))}
  </Grid>
);
```

**Rollback Plan**: If critical bugs discovered in production:
1. Set `NEXT_PUBLIC_INLINE_EDIT_ENABLED=false` in Vercel env
2. Redeploy (takes ~2 minutes)
3. All users revert to dialog-based editing
4. Fix bugs, re-enable when ready

No user data loss - both modes use same GuessesContext save mechanism.

---

**Issues addressed from review cycles**:

**Cycle 1 issues**:
- ✅ GuessesContext batch save conflict → dirty tracking added
- ✅ Card flip breaks complex card → only flip content area
- ✅ Concurrent edits → AbortController + promise tracking
- ✅ Boost count stale data → passed from parent as props
- ✅ Keyboard navigation incomplete → full state machine spec
- ✅ Urgency accordion integration → EditModeContext coordination
- ✅ Mobile accordion conflicts → slide panel instead
- ✅ Phase ordering suboptimal → reordered below
- ✅ Testing strategy missing → automated tests with vitest
- ✅ Feature flag over-engineering → removed initially
- ✅ Error recovery underspecified → retry schedule defined
- ✅ Auto-advance edge cases → skip disabled games spec

**Cycle 2 issues**:
- ✅ Dirty tracking race condition → use ref for latest gameGuesses
- ✅ No multi-user conflict detection → added optimistic locking with updated_at
- ✅ EditModeContext underspecified → provider location + cleanup implementation
- ✅ FlippableGameCard dual data source → fully controlled (props only)
- ✅ Auto-advance no scrolling → added scrollIntoView
- ✅ Retry logic over-engineered → simplified to user-initiated retry button
- ✅ Feature flag removed prematurely → re-added minimal kill switch
- ✅ Mobile keyboard behavior missing → added "Next" button for field navigation
- ✅ Integration tests missing → added concurrent edit flow test
- ✅ Error recovery UX unclear → stay in edit mode, show retry button

**Revised Phase Order**:

1. **Phase 1**: Shared edit controls component (foundation, 2-3h)
2. **Phase 2**: Enhanced GuessesContext with dirty tracking (infrastructure, 3-4h)
3. **Phase 4**: Card flip component (build new UI first to validate APIs, 3-4h)
4. **Phase 3**: Refactor dialog (proves shared component works, 1-2h)
5. **Phase 5**: Integrate into games-grid + EditModeContext (connect everything, 2-3h)
6. **Phase 6**: Mobile optimization (slide panel, 2-3h)
7. **Phase 7**: Edge cases, error recovery, automated tests (polish, 2-3h)

**Total Estimated Effort**: 15-22 hours across 7 phases

**Critical Path**: Phases 1, 2, 4, 5 (core functionality)
**Can Defer**: Phases 6, 7 (mobile + polish, follow-up PR if needed)

**Rationale for Reordering**:
- Building card flip (Phase 4) before refactoring dialog (Phase 3) validates that shared component API works in practice
- This catches API issues early when they're easier to fix
- Dialog refactor becomes simpler once we know the shared component works
