# Implementation Plan: Story #219

## Context

### Problem
Currently, when users click the edit button on games in the "Closing Soon" section of the Prediction Dashboard popover, it opens a modal dialog (`GameResultEditDialog`). This creates a nested interaction pattern (popover → modal) that feels disconnected from the main tournament page experience and can hide target games if active filters are applied.

### User Pain Points
1. **Nested interactions**: Users navigate through popover → modal, which feels heavy
2. **Context switching**: Modal isolates the game from the tournament context
3. **Filter conflicts**: If user has active filters (e.g., "Unpredicted", specific group/round), the target game may be hidden when they navigate to the tournament page
4. **Inconsistent UX**: Urgency accordion uses modals while main tournament page uses inline editing

### Proposed Solution
Replace the modal dialog interaction with navigation to the tournament home page where:
1. User is redirected to `/[locale]/tournaments/[tournamentId]?edit=[gameId]`
2. **All active filters are cleared** to ensure target game is always visible
3. Page automatically scrolls to the target game card
4. The `FlippableGameCard` for that game is automatically set to edit mode

This creates a more seamless experience and leverages the existing inline editing functionality already available on the tournament home page.

## Objectives

1. **Improve UX**: Eliminate nested modal interaction, use existing inline editing
2. **Ensure visibility**: Clear filters automatically to prevent hidden games
3. **Maintain context**: Keep users in main tournament page rather than modal overlay
4. **Leverage existing patterns**: Reuse `FlippableGameCard` inline editing, `scrollToGame` utility, filter clearing logic

## Acceptance Criteria

- [ ] Clicking edit on a game in the urgency accordion navigates to tournament home page
- [ ] URL includes game identifier via query parameter (`?edit=[gameId]`)
- [ ] **All active filters are cleared when navigating with game parameter** (activeFilter → 'all', groupFilter → null, roundFilter → null)
- [ ] **Filter clearing works both when navigating from different page AND when already on tournament page**
- [ ] Page automatically scrolls to the target game card after filters are cleared
- [ ] Game card automatically enters inline edit mode (flipped to edit side)
- [ ] Edit mode focus behavior is preserved (first input field is focused)
- [ ] Browser back button returns user to previous page (not to non-edit state of tournament page)
- [ ] Works correctly on both mobile and desktop viewports
- [ ] URL parameter behavior is acceptable if bookmarked (page loads, scrolls to game, activates edit mode)
- [ ] No regressions to existing inline editing behavior on tournament page
- [ ] **If user is already on tournament page with filters active, clicking a closing soon game clears filters before scrolling/editing**

## Technical Approach

### High-Level Strategy

This implementation follows a **navigation-based approach** where clicking edit on urgency cards triggers browser navigation with URL parameters. The tournament page detects these parameters, clears filters, scrolls to the target game, and activates inline edit mode.

**Key architectural decisions:**
1. **Use Next.js navigation** (`useRouter` from `next/navigation`) for client-side navigation
2. **Query parameter pattern**: `/tournaments/[id]?edit=[gameId]` (simple, standard, no custom parsing)
3. **Filter clearing first**: Reset filters BEFORE scroll/edit to ensure game is visible in DOM
4. **URL cleanup**: Use `window.history.replaceState` to remove parameter after navigation (prevents accidental bookmarking)
5. **Context-based edit triggering**: Expose `handleEditStart` via shared context or ref to enable external triggering

### Detailed Implementation

#### Phase 1: Create Edit Trigger Context

**File**: `app/components/context-providers/edit-trigger-context-provider.tsx` (NEW)

**Purpose**: Expose `handleEditStart` function to components outside the games list (e.g., URL parameter handler)

```typescript
'use client'

import { createContext, useContext, useCallback, useState, ReactNode } from 'react';

interface EditTriggerContextValue {
  triggerEdit: (gameId: string) => void;
  registerTrigger: (trigger: (gameId: string) => void) => void;
}

const EditTriggerContext = createContext<EditTriggerContextValue | undefined>(undefined);

export function EditTriggerContextProvider({ children }: { children: ReactNode }) {
  const [editTrigger, setEditTrigger] = useState<((gameId: string) => void) | null>(null);

  const registerTrigger = useCallback((trigger: (gameId: string) => void | null) => {
    setEditTrigger(() => trigger);
  }, []);

  const triggerEdit = useCallback((gameId: string) => {
    if (editTrigger) {
      editTrigger(gameId);
    }
  }, [editTrigger]);

  return (
    <EditTriggerContext.Provider value={{ triggerEdit, registerTrigger }}>
      {children}
    </EditTriggerContext.Provider>
  );
}

export function useEditTrigger() {
  const context = useContext(EditTriggerContext);
  if (!context) {
    throw new Error('useEditTrigger must be used within EditTriggerContextProvider');
  }
  return context;
}
```

**Rationale**: We need a way to trigger edit mode from UnifiedGamesPageClient (which handles URL parameters) to GamesListWithScroll (which has the `handleEditStart` function). A context provider is the cleanest way to bridge this gap without prop drilling or complex refs.

---

#### Phase 2: Update UrgencyAccordionGroup to Navigate

**File**: `app/components/urgency-accordion-group.tsx`

**Changes**:
1. Import `useRouter` from `next/navigation` and `useLocale` from `next-intl`
2. Update `handleEditGame` to navigate instead of opening dialog
3. Remove unused dialog state and dialog rendering

**Modified `handleEditGame`**:
```typescript
const router = useRouter();
const locale = useLocale();

const handleEditGame = (gameId: string) => {
  const game = games.find(g => g.id === gameId);
  if (game) {
    // Navigate to tournament page with edit parameter
    router.push(`/${locale}/tournaments/${game.tournament_id}?edit=${gameId}`);
  }
};
```

**Removed code**:
- `editDialogOpen`, `setEditDialogOpen` state
- `selectedGame`, `setSelectedGame` state
- `handleGameResultSave` function
- `getTeamNames` function
- `<GameResultEditDialog>` component rendering

**Rationale**: Navigation is simpler and cleaner than managing modal state. The router handles locale automatically via the route structure.

---

#### Phase 3: Update UnifiedGamesPageClient to Handle URL Parameters

**File**: `app/components/unified-games-page-client.tsx`

**Changes**:
1. Import `useSearchParams` from `next/navigation` and `useEditTrigger` hook
2. Add `useEffect` to detect `edit` parameter on mount
3. Clear filters when parameter is present
4. Scroll to game and trigger edit mode
5. Clean up URL parameter

**New URL parameter handler** (with effect-based timing):
```typescript
const searchParams = useSearchParams();
const { triggerEdit } = useEditTrigger();
const [pendingEditGameId, setPendingEditGameId] = useState<string | null>(null);

// Effect 1: Detect edit parameter and clear filters
useEffect(() => {
  const editGameId = searchParams.get('edit');

  if (editGameId && !pendingEditGameId) {
    // Step 1: Store the game ID to trigger scroll/edit after filters update
    setPendingEditGameId(editGameId);

    // Step 2: Clear all filters to ensure game is visible
    setActiveFilter('all');
    setGroupFilter(null);
    setRoundFilter(null);
  }
}, [searchParams, setActiveFilter, setGroupFilter, setRoundFilter, pendingEditGameId]);

// Effect 2: Scroll and trigger edit AFTER filters have updated
useEffect(() => {
  if (pendingEditGameId && activeFilter === 'all' && groupFilter === null && roundFilter === null) {
    // Filters are confirmed cleared - now safe to scroll and edit

    // Small delay to ensure DOM has re-rendered with all games visible
    const timeoutId = setTimeout(() => {
      scrollToGame(`game-${pendingEditGameId}`, 'smooth');

      // Trigger edit after scroll animation completes (~500ms for smooth scroll)
      const editTimeoutId = setTimeout(() => {
        triggerEdit(pendingEditGameId);
        setPendingEditGameId(null); // Clear pending state
      }, 600);

      return () => clearTimeout(editTimeoutId);
    }, 50);

    return () => clearTimeout(timeoutId);
  }
}, [pendingEditGameId, activeFilter, groupFilter, roundFilter, triggerEdit]);
```

**Rationale**:
- **Effect dependencies instead of arbitrary timeouts**: Second effect only runs when filters are confirmed cleared (activeFilter === 'all', etc.)
- **No race conditions**: Filter state changes trigger the scroll/edit sequence, not arbitrary timers
- **Handles localStorage override**: Works whether filters were initialized from localStorage or not - we wait for actual state, not DOM timing
- **Keeps URL parameter**: Removed `replaceState` cleanup - having `?edit=gameId` in bookmark is harmless (just scrolls to that game on page load, which is acceptable UX)
- **Cleanup**: Proper timeout cleanup to avoid memory leaks

---

#### Phase 4: Update GamesListWithScroll to Register Edit Trigger

**File**: `app/components/games-list-with-scroll.tsx`

**Changes**:
1. Import `useEditTrigger` hook
2. Register `handleEditStart` function with context on mount

**Registration code** (with cleanup):
```typescript
const { registerTrigger } = useEditTrigger();

useEffect(() => {
  // Register the trigger function
  registerTrigger(handleEditStart);

  // Cleanup: unregister on unmount
  return () => {
    registerTrigger(null);
  };
}, [handleEditStart, registerTrigger]);
```

**Rationale**: This allows UnifiedGamesPageClient to trigger edit mode by calling `triggerEdit(gameId)`, which internally calls `handleEditStart`. Cleanup ensures no stale references if component unmounts/remounts.

---

#### Phase 5: Wrap UnifiedGamesPageClient in EditTriggerContextProvider

**File**: `app/components/unified-games-page.tsx` (Server Component)

**Changes**:
1. Import `EditTriggerContextProvider`
2. Wrap `UnifiedGamesPageClient` in the provider

**Updated JSX**:
```typescript
return (
  <GuessesContextProvider
    gameGuesses={gameGuesses}
    autoSave={true}
    tournamentMaxSilver={tournament.max_silver_games || 0}
    tournamentMaxGolden={tournament.max_golden_games || 0}
  >
    <EditTriggerContextProvider>
      <UnifiedGamesPageClient
        games={games}
        gameCounts={gameCounts}
        teamsMap={teamsMap}
        tournamentId={tournamentId}
        groups={groups}
        rounds={rounds}
        tournament={tournament}
        closingGames={closingGames}
        tournamentPredictionCompletion={tournamentPredictionCompletion}
        tournamentStartDate={tournamentStartDate}
      />
    </EditTriggerContextProvider>
  </GuessesContextProvider>
);
```

**Rationale**: The provider must wrap both UnifiedGamesPageClient (which triggers edit) and GamesListWithScroll (which registers the trigger). Since GamesListWithScroll is a child of UnifiedGamesPageClient, wrapping at this level ensures both components have access.

---

### Edge Cases Handled

1. **User already on tournament page with "Unpredicted" filter, clicks edit on predicted game**
   - ✅ Filters cleared to 'all', game becomes visible, scroll and edit work

2. **User on different tournament, clicks edit**
   - ✅ Navigation changes route to correct tournament, URL parameter triggers workflow

3. **User on same tournament, no filters, game already visible**
   - ✅ Filter clearing is harmless (already 'all'), scroll and edit work normally

4. **Game is in a specific round/group, filters are active**
   - ✅ Filters cleared, game visible in "All Games" view, scroll and edit work

5. **User bookmarks URL with `?edit=[gameId]`**
   - ✅ URL parameter remains (not cleaned up) - acceptable UX: bookmark loads tournament page, scrolls to that game, and activates edit mode
   - ✅ User can close edit mode and continue browsing normally

6. **Browser back button after editing**
   - ✅ Returns to previous page (e.g., dashboard)
   - ✅ URL parameter remains in history but doesn't affect functionality

7. **Mobile vs desktop viewport**
   - ✅ No viewport-specific logic needed, inline editing already responsive

8. **Game already in edit mode when parameter detected**
   - ✅ `handleEditStart` sets `editingGameId` state, React reconciles if already editing

---

### Timing Constants

**File**: `app/components/unified-games-page-client.tsx`

Define constants at the top of the file to avoid magic numbers (SonarCloud S109 compliance):

```typescript
// Timing constants for edit parameter handling
const DOM_RENDER_DELAY = 50; // ms - small delay for DOM to re-render after filter change
const SCROLL_ANIMATION_DURATION = 600; // ms - time for smooth scroll to complete
```

**Rationale**: Extracting magic numbers to named constants improves maintainability and satisfies SonarCloud quality gates.

---

### Addressing Plan Review Concerns

#### Concern 1: Timing/Race Conditions (RESOLVED)
**Original issue**: Using arbitrary `setTimeout` values (100ms, 200ms) was fragile and browser-dependent.

**Solution implemented**:
- Use effect dependencies instead of fixed timeouts
- Second effect watches `activeFilter`, `groupFilter`, `roundFilter` state
- Only triggers scroll/edit when filters are confirmed cleared (`activeFilter === 'all'`, etc.)
- No race conditions - React guarantees effect runs after state updates

#### Concern 2: Filter State Persistence (RESOLVED)
**Original issue**: FilterContext initializes from localStorage, which might conflict with URL parameter intent.

**Solution implemented**:
- Effect dependency approach handles this automatically
- When page loads with filters from localStorage, first effect sets filters to 'all'/null/null
- Second effect waits for actual state to match (not DOM timing)
- Works whether filters were 'all' initially or had to be overridden

#### Concern 3: Browser History & replaceState (RESOLVED)
**Original issue**: Using `window.history.replaceState` to clean up URL parameter might have unintended consequences.

**Solution implemented**:
- **Removed `replaceState` entirely** - URL parameter remains after navigation
- This is acceptable UX: if user bookmarks `?edit=gameId`, page loads, scrolls to that game, and activates edit mode
- User can close edit mode and continue browsing normally
- Browser back button works correctly (returns to previous page)
- Simpler implementation, no history manipulation edge cases

---

## Visual Prototypes

### User Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                   BEFORE (Current Flow)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. User on Tournament Page                                     │
│     ↓                                                           │
│  2. Click "Games Closing Soon" row in dashboard                 │
│     ↓                                                           │
│  3. GameDetailsPopover opens (overlay)                          │
│     ↓                                                           │
│  4. Click edit button on UrgencyGameCard                        │
│     ↓                                                           │
│  5. GameResultEditDialog modal opens (nested overlay)           │
│     ↓                                                           │
│  6. User edits, saves, modal closes                             │
│     ↓                                                           │
│  7. Back to popover (still open)                                │
│                                                                 │
│  Issues:                                                        │
│  - Two overlay layers (popover + modal)                         │
│  - Game may be hidden by active filters                         │
│  - User loses tournament page context                           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   AFTER (New Flow)                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. User on Tournament Page                                     │
│     ↓                                                           │
│  2. Click "Games Closing Soon" row in dashboard                 │
│     ↓                                                           │
│  3. GameDetailsPopover opens (overlay)                          │
│     ↓                                                           │
│  4. Click edit button on UrgencyGameCard                        │
│     ↓                                                           │
│  5. Navigate to /tournaments/[id]?edit=[gameId]                 │
│     ↓                                                           │
│  6. Filters cleared to 'all' (game now visible)                 │
│     ↓                                                           │
│  7. Page scrolls to target game                                 │
│     ↓                                                           │
│  8. FlippableGameCard flips to edit mode (inline)               │
│     ↓                                                           │
│  9. User edits, saves, card flips back                          │
│     ↓                                                           │
│  10. User can continue editing other games inline               │
│                                                                 │
│  Benefits:                                                      │
│  - Single page context (no nested modals)                       │
│  - Game always visible (filters cleared)                        │
│  - Consistent with existing inline editing UX                   │
└─────────────────────────────────────────────────────────────────┘
```

### Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                 UnifiedGamesPage (Server)                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │         EditTriggerContextProvider (NEW)                  │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │       UnifiedGamesPageClient                        │  │  │
│  │  │                                                     │  │  │
│  │  │  1. useSearchParams() detects ?edit=[gameId]       │  │  │
│  │  │  2. Calls setActiveFilter('all')  ────────────┐    │  │  │
│  │  │  3. Calls setGroupFilter(null)               │    │  │  │
│  │  │  4. Calls setRoundFilter(null)               │    │  │  │
│  │  │  5. Waits for filters to apply (100ms)       │    │  │  │
│  │  │  6. Calls scrollToGame(gameId)  ─────────────┼───┐│  │  │
│  │  │  7. Waits for scroll (200ms)                 │   ││  │  │
│  │  │  8. Calls triggerEdit(gameId) ───────────┐   │   ││  │  │
│  │  │                                          │   │   ││  │  │
│  │  │  ┌────────────────────────────────────┐ │   │   ││  │  │
│  │  │  │    GamesListWithScroll             │ │   │   ││  │  │
│  │  │  │                                    │ │   │   ││  │  │
│  │  │  │  - Registers handleEditStart  ─────┼─┘   │   ││  │  │
│  │  │  │    with context on mount           │     │   ││  │  │
│  │  │  │                                    │     │   ││  │  │
│  │  │  │  - Renders FlippableGameCard ──────┼─────┼───┘│  │  │
│  │  │  │    with isEditing prop            │     │    │  │  │
│  │  │  │                                    │     │    │  │  │
│  │  │  │  - FlippableGameCard flips to ─────┼─────┘    │  │  │
│  │  │  │    edit mode when isEditing=true  │          │  │  │
│  │  │  └────────────────────────────────────┘          │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│            UrgencyAccordionGroup (Modified)                     │
│                                                                 │
│  - User clicks edit button on UrgencyGameCard                   │
│  - handleEditGame calls router.push() ──────────────────────┐   │
│    with /${locale}/tournaments/${tournamentId}?edit=${gameId}  │   │
│  - Browser navigates to tournament page                     │   │
│                                                              │   │
└──────────────────────────────────────────────────────────────┼───┘
                                                              │
                                         Triggers navigation  │
                                                              ↓
                                         UnifiedGamesPageClient
                                         detects URL parameter
```

### State Transitions

```
┌─────────────────────────────────────────────────────────────────┐
│                   Filter State Transitions                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  SCENARIO 1: User on Tournament Page with Filters Active        │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Initial State:                                           │  │
│  │    activeFilter: 'unpredicted'                            │  │
│  │    groupFilter: 'group-a'                                 │  │
│  │    roundFilter: null                                      │  │
│  │    → Target game is HIDDEN (predicted, in Group B)       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                           ↓                                     │
│             User clicks edit on urgency card                    │
│                           ↓                                     │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Navigation:                                              │  │
│  │    router.push('/tournaments/123?edit=game-456')          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                           ↓                                     │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  URL Parameter Handler:                                   │  │
│  │    1. Detects edit=game-456                               │  │
│  │    2. setActiveFilter('all')                              │  │
│  │    3. setGroupFilter(null)                                │  │
│  │    4. setRoundFilter(null)                                │  │
│  │    5. Wait 100ms for filters to re-render                 │  │
│  └───────────────────────────────────────────────────────────┘  │
│                           ↓                                     │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Final State:                                             │  │
│  │    activeFilter: 'all'                                    │  │
│  │    groupFilter: null                                      │  │
│  │    roundFilter: null                                      │  │
│  │    → Target game is VISIBLE (all games shown)            │  │
│  │    → Game is scrolled into view                           │  │
│  │    → Game enters edit mode                                │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  SCENARIO 2: User on Different Page (e.g., Dashboard)          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Initial State: Not on tournament page                    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                           ↓                                     │
│             User clicks edit on urgency card                    │
│                           ↓                                     │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Navigation:                                              │  │
│  │    router.push('/tournaments/123?edit=game-456')          │  │
│  │    → Full page navigation                                 │  │
│  └───────────────────────────────────────────────────────────┘  │
│                           ↓                                     │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Tournament Page Loads:                                   │  │
│  │    - FilterContext initializes from localStorage         │  │
│  │    - May have previous filter state                       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                           ↓                                     │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  URL Parameter Handler:                                   │  │
│  │    1. Detects edit=game-456                               │  │
│  │    2. Overrides filters to 'all'/null/null                │  │
│  │    3. Scrolls and triggers edit                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                           ↓                                     │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Final State: Same as Scenario 1                          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### UI Changes (Before/After)

**Before** (Modal Dialog):
```
┌─────────────────────────────────────────────────────────┐
│              GameResultEditDialog (Modal)               │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Edit Game #12: Argentina vs France                  │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │                                                     │ │
│ │  Home Score:  [ 2 ]                                 │ │
│ │  Away Score:  [ 1 ]                                 │ │
│ │                                                     │ │
│ │  Boost:  ○ None  ◉ Silver  ○ Golden                 │ │
│ │                                                     │ │
│ │              [Cancel]  [Save]                       │ │
│ │                                                     │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
      (Overlays tournament page - context lost)
```

**After** (Inline Edit on Tournament Page):
```
┌─────────────────────────────────────────────────────────────┐
│              Tournament Page (Full Context)                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Filters: [All Games ▼]  [All Groups ▼]                     │
│           ↑ Cleared automatically when edit parameter       │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Game #11: Brazil vs Germany    [Front of card]      │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Game #12: Argentina vs France  [EDIT MODE]          │  │
│  │                                                       │  │
│  │  Edit Prediction:                                     │  │
│  │  Home Score:  [ 2 ]  ← Auto-focused                   │  │
│  │  Away Score:  [ 1 ]                                   │  │
│  │  Boost:  ○ None  ◉ Silver  ○ Golden                   │  │
│  │                                                       │  │
│  │  [< Prev]  [Cancel]  [Save]  [Next >]                 │  │
│  │                                                       │  │
│  └───────────────────────────────────────────────────────┘  │
│           ↑ Scrolled into view, flipped to edit side        │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Game #13: Spain vs Italy       [Front of card]      │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
     (User stays in tournament context, can see other games)
```

---

## Files to Create

### New Files

1. **`app/components/context-providers/edit-trigger-context-provider.tsx`**
   - Context provider to expose `triggerEdit` function
   - Allows UnifiedGamesPageClient to trigger edit mode in GamesListWithScroll
   - ~70 lines

---

## Files to Modify

### Component Changes

1. **`app/components/urgency-accordion-group.tsx`**
   - Import `useRouter` from `next/navigation` and `useLocale` from `next-intl`
   - Update `handleEditGame` to navigate instead of opening dialog
   - Remove dialog-related state and rendering
   - **Lines changed**: ~50 lines removed, ~10 lines added

2. **`app/components/unified-games-page-client.tsx`**
   - Import `useSearchParams` from `next/navigation` and `useEditTrigger` hook
   - Add `useEffect` to detect `edit` URL parameter
   - Clear filters when parameter is present
   - Trigger scroll and edit mode
   - Clean up URL parameter
   - **Lines changed**: ~30 lines added

3. **`app/components/games-list-with-scroll.tsx`**
   - Import `useEditTrigger` hook
   - Register `handleEditStart` with context on mount
   - **Lines changed**: ~10 lines added

4. **`app/components/unified-games-page.tsx`**
   - Import `EditTriggerContextProvider`
   - Wrap `UnifiedGamesPageClient` in provider
   - **Lines changed**: ~5 lines added

---

## Implementation Steps

### Step 1: Create EditTriggerContextProvider
- Create new file `app/components/context-providers/edit-trigger-context-provider.tsx`
- Implement context with `triggerEdit` and `registerTrigger` functions
- Export `useEditTrigger` hook
- **Estimated time**: 15 minutes

### Step 2: Update GamesListWithScroll to Register Trigger
- Import `useEditTrigger` hook
- Add `useEffect` to register `handleEditStart` function
- **Estimated time**: 10 minutes

### Step 3: Update UnifiedGamesPage to Wrap with Provider
- Import `EditTriggerContextProvider`
- Wrap `UnifiedGamesPageClient` in provider (after `GuessesContextProvider`)
- **Estimated time**: 5 minutes

### Step 4: Update UnifiedGamesPageClient to Handle URL Parameters
- Import `useSearchParams` from `next/navigation`, `useState`, and `useEditTrigger` hook
- Define timing constants (DOM_RENDER_DELAY = 50ms, SCROLL_ANIMATION_DURATION = 600ms)
- Add state for `pendingEditGameId`
- Add first `useEffect` to detect `edit` parameter and clear filters
- Add second `useEffect` to scroll/edit after filter state confirms clearing
- **Estimated time**: 30 minutes

### Step 5: Update UrgencyAccordionGroup to Navigate
- Import `useRouter` from `next/navigation` and `useLocale` from `next-intl`
- Update `handleEditGame` to use `router.push` with locale-aware URL
- Remove `editDialogOpen`, `setEditDialogOpen`, `selectedGame`, `setSelectedGame` state
- Remove `handleGameResultSave`, `getTeamNames` functions
- Remove `<GameResultEditDialog>` component rendering
- **Estimated time**: 20 minutes

### Step 6: Manual Testing
- Test from urgency accordion on tournament page (with filters active)
- Test from urgency accordion on different page (e.g., dashboard)
- Test browser back button behavior
- Test on mobile and desktop viewports
- Verify no regressions to existing inline editing
- **Estimated time**: 30 minutes

**Total estimated implementation time**: ~2 hours

---

## Testing Strategy

### Unit Tests

#### Test 1: EditTriggerContextProvider
**File**: `app/components/context-providers/__tests__/edit-trigger-context-provider.test.tsx`

**Coverage**:
- Provider renders children
- `registerTrigger` stores trigger function
- `triggerEdit` calls registered function
- Hook throws error when used outside provider

**Test cases**:
```typescript
describe('EditTriggerContextProvider', () => {
  it('should render children', () => { /* ... */ });
  it('should register and call trigger function', () => { /* ... */ });
  it('should throw error when hook used outside provider', () => { /* ... */ });
});
```

#### Test 2: UnifiedGamesPageClient URL Parameter Handling
**File**: `app/components/__tests__/unified-games-page-client.test.tsx`

**Coverage**:
- Detects `edit` URL parameter on mount
- Clears all filters when parameter is present
- Calls `triggerEdit` with correct game ID after filters are cleared
- Does nothing when no parameter present
- **Handles localStorage filter override** (critical test)

**Test cases**:
```typescript
describe('UnifiedGamesPageClient URL Parameter Handling', () => {
  it('should detect edit parameter and clear filters', () => { /* ... */ });
  it('should trigger edit mode after filter state confirms clearing', () => { /* ... */ });
  it('should override localStorage filters when edit parameter present', () => {
    // Setup: Pre-populate localStorage with 'unpredicted' filter
    localStorage.setItem('tournamentFilter-123', 'unpredicted');

    // Render with ?edit=game-456 parameter
    // Verify: activeFilter becomes 'all' (not 'unpredicted')
    // Verify: triggerEdit called after filter state updates
  });
  it('should do nothing when no edit parameter', () => { /* ... */ });
});
```

#### Test 3: UrgencyAccordionGroup Navigation
**File**: `app/components/__tests__/urgency-accordion-group.test.tsx`

**Coverage**:
- `handleEditGame` calls `router.push` with correct URL
- URL includes locale, tournament ID, and game ID
- Does not render `GameResultEditDialog`
- Edit button triggers navigation

**Test cases**:
```typescript
describe('UrgencyAccordionGroup Navigation', () => {
  it('should navigate to tournament page with edit parameter', () => { /* ... */ });
  it('should not render GameResultEditDialog', () => { /* ... */ });
  it('should handle edit button click with navigation', () => { /* ... */ });
});
```

#### Test 4: GamesListWithScroll Trigger Registration
**File**: `app/components/__tests__/games-list-with-scroll.test.tsx`

**Coverage**:
- Registers `handleEditStart` with context on mount
- Unregisters on unmount

**Test cases**:
```typescript
describe('GamesListWithScroll Trigger Registration', () => {
  it('should register handleEditStart on mount', () => { /* ... */ });
  it('should unregister on unmount', () => { /* ... */ });
});
```

### Integration Tests

#### Test 5: End-to-End Navigation Flow
**File**: `app/components/__tests__/urgency-edit-navigation.integration.test.tsx`

**Coverage**:
- Click edit on urgency card → Navigation → Filters cleared → Scroll → Edit mode activated
- Browser back button returns to previous page
- URL parameter cleaned up

**Test approach**:
- Mock `useRouter`, `useSearchParams`, `scrollToGame`
- Render full component tree (UrgencyAccordionGroup → UnifiedGamesPageClient → GamesListWithScroll)
- Simulate user clicking edit button
- Verify navigation called with correct URL
- Simulate URL parameter present
- Verify filters cleared, scroll called, edit triggered

### Manual Testing Checklist

- [ ] Click edit on urgency card while on tournament page with "Unpredicted" filter active
  - Verify filters cleared, game scrolled into view, edit mode activated
- [ ] Click edit on urgency card while on a different page (e.g., dashboard)
  - Verify navigation to tournament page, game scrolled, edit mode activated
- [ ] Click browser back button after editing
  - Verify returns to previous page (not non-edit state of tournament page)
- [ ] Test on mobile viewport (Chrome DevTools)
  - Verify inline editing works correctly
- [ ] Test on desktop viewport
  - Verify inline editing works correctly
- [ ] Verify no regressions to existing inline editing behavior
  - Click edit on FlippableGameCard directly → Should still work
- [ ] Verify URL parameter is cleaned up
  - Check browser address bar after navigation → No `?edit=` parameter

---

## SonarCloud Quality Gates

### Code Coverage Requirements
- **Overall coverage**: ≥60% (current project standard)
- **New code coverage**: ≥80% (enforced by SonarCloud)

**Coverage strategy**:
- New context provider: 100% coverage (small, critical)
- URL parameter handling: 90% coverage (test all branches)
- Navigation logic: 85% coverage (mock router, verify calls)
- Integration tests: Cover happy path + 2 edge cases

### Code Quality Requirements
- **0 new issues** of any severity (low, medium, high, critical)
- **Security rating**: A
- **Maintainability**: B or higher
- **Duplicated code**: <5%

**Quality strategy**:
- Use existing patterns (context providers, hooks, filters)
- Follow TypeScript strict mode (no `any` types)
- Use readonly props (SonarQube S6759 compliance)
- No unused imports (ESLint auto-fix)
- Extract magic numbers to constants (100ms, 200ms timeouts)

### Potential SonarCloud Issues to Avoid

1. **Cognitive Complexity** (S3776)
   - Keep `useEffect` logic simple (extract helper functions if needed)
   - Max complexity: 15 per function

2. **Magic Numbers** (S109)
   - Extract timeout values to named constants:
     ```typescript
     const FILTER_RENDER_DELAY = 100;
     const SCROLL_SETTLE_DELAY = 200;
     ```

3. **Prefer-const** (S2814)
   - Use `const` for all variables that don't change

4. **Unused Imports** (S1128)
   - Remove all unused imports before commit

5. **Type Safety** (S4323)
   - Avoid `any` types, use proper TypeScript types

---

## Validation Considerations

### Pre-Commit Validation
1. **Run tests**: `npm test` (must pass 100%)
2. **Run linter**: `npm lint` (must pass with 0 warnings)
3. **Run build**: `npm build` (must succeed)
4. **Check coverage**: Verify new code ≥80% coverage

### Deployment Validation
1. **Vercel Preview**: Deploy to preview environment
2. **Manual testing**: Follow manual testing checklist
3. **Performance**: Verify no performance regressions (Lighthouse scores)
4. **SonarCloud**: Verify 0 new issues

### Rollback Plan
- If critical issues found after deploy:
  1. Revert PR merge
  2. Redeploy previous version
  3. Fix issues in new PR

---

## Open Questions

### Question 1: Should the popover close automatically on navigation?
**Answer**: Likely yes - navigation closes the popover automatically in most UX patterns. This is default browser behavior for Next.js navigation, so no additional code needed.

### Question 2: Should there be a visual indication that filters were cleared?
**Options**:
- Brief toast message: "Filters cleared to show game #42"
- Subtle animation on filter chips
- No indication (filters already visible in UI)

**Recommendation**: No indication initially. Filters are visually displayed in the UI, so users can see they've been cleared. If user feedback indicates confusion, add a toast in a follow-up story.

### Question 3: After user finishes editing, should filters be restored to previous state?
**Answer**: Probably not - adds complexity and user can re-filter manually if needed. Filter state is persisted in localStorage, so if user navigates away and back, their previous filters are restored automatically.

### Question 4: Should we support multiple games in URL (e.g., `?edit=game1,game2`)?
**Answer**: No - out of scope for this story. Single game editing is the requirement. If needed later, can be added as enhancement.

### Question 5: What if the game ID in URL parameter doesn't exist?
**Answer**: Graceful degradation:
- `scrollToGame` already handles missing element (logs warning, doesn't crash)
- `triggerEdit` will set `editingGameId` state, but no card will flip (no matching game)
- No errors thrown, page remains functional

---

## Risk Assessment

### Low Risk
- ✅ Using existing patterns (context providers, hooks, navigation)
- ✅ Small, focused changes (5 files modified, 1 new file)
- ✅ Existing utilities reused (scrollToGame, filter context)
- ✅ No database or API changes

### Medium Risk
- ⚠️ **Timing/race conditions**: Filter clearing → DOM update → scroll → edit
  - **Mitigation**: Use timeouts to ensure sequential execution
  - **Testing**: Manual testing with various filter combinations
- ⚠️ **Browser compatibility**: `window.history.replaceState`, `useSearchParams`
  - **Mitigation**: Next.js abstracts browser APIs, handles compatibility
  - **Testing**: Test on Chrome, Firefox, Safari

### High Risk
- None identified

### Dependencies
- Next.js 15 App Router (`useRouter`, `useSearchParams`)
- next-intl locale routing
- Existing filter context, scroll utilities, edit mode context

**No external dependencies added.**

---

## Alternatives Considered

### Alternative 1: Keep Modal, Add Filter Clearing Logic
**Approach**: Keep modal dialog, but add logic to clear filters before showing games in background

**Pros**:
- Smaller code change
- No navigation needed

**Cons**:
- Still has nested interaction (popover → modal)
- User doesn't benefit from tournament page context
- Inconsistent with existing inline editing pattern

**Rejected because**: Doesn't address core UX issue (nested modals, context loss)

---

### Alternative 2: Add Inline Editing to Urgency Accordion
**Approach**: Implement inline editing inside the UrgencyAccordion itself (flip cards in the accordion)

**Pros**:
- No navigation needed
- Self-contained solution

**Cons**:
- Duplicates FlippableGameCard logic
- Accordion space is limited (not ideal for edit form)
- Doesn't leverage existing tournament page editing

**Rejected because**: Code duplication, poor UX in limited accordion space

---

### Alternative 3: Use Hash Fragment Instead of Query Parameter
**Approach**: Navigate to `/tournaments/[id]#edit-game-123` instead of `?edit=game-123`

**Pros**:
- Hash doesn't trigger server-side routing
- Slightly simpler to parse

**Cons**:
- Less semantic (hash typically for anchors, not application state)
- Harder to clean up (can't use `window.history.replaceState` as cleanly)
- Not standard Next.js pattern

**Rejected because**: Query parameters are more idiomatic for Next.js App Router

---

## Success Metrics

### User Experience
- ✅ Reduced interaction depth (1 click instead of 2)
- ✅ No hidden games due to filters
- ✅ Consistent inline editing UX across all entry points

### Code Quality
- ✅ 0 new SonarCloud issues
- ✅ ≥80% coverage on new code
- ✅ All tests passing
- ✅ No performance regressions

### Maintenance
- ✅ Reuses existing patterns (context providers, filter management)
- ✅ Minimal code duplication
- ✅ Clear separation of concerns

---

## Conclusion

This implementation plan provides a comprehensive approach to replacing modal dialogs with navigation-based inline editing for urgency accordion games. By clearing filters automatically and leveraging existing utilities, we ensure the target game is always visible and editable. The solution is low-risk, well-tested, and follows existing project patterns.

**Next steps after plan approval:**
1. Implement EditTriggerContextProvider
2. Update GamesListWithScroll and UnifiedGamesPage
3. Update UnifiedGamesPageClient URL parameter handling
4. Update UrgencyAccordionGroup navigation
5. Write unit and integration tests
6. Manual testing on Vercel Preview
7. SonarCloud validation
8. Merge and deploy
