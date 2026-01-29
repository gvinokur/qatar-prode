# Implementation Plan: UXI-006 Interactive Closing Soon Dashboard

**Story**: #15 - Transform static urgency alerts into interactive accordion-based dashboard
**Worktree**: `/Users/gvinokur/Personal/qatar-prode-story-15`
**Branch**: `feature/story-15`

---

## Overview

Transform the static urgency alerts in `PredictionStatusBar` from passive notifications into an interactive accordion-based dashboard. Users will see specific games closing soon, edit predictions directly, and have the urgent tier auto-expanded.

**Current Problem**:
- Users see "2 partidos cierran en 2 horas" but can't see WHICH games
- Must manually scroll through entire grid to find closing games
- No direct path from alert to action

**Solution**:
- Three expandable accordions (urgent/warning/notice tiers)
- Each shows specific games with countdown timers
- Direct edit button on each game card
- Auto-expand urgent tier if it has unpredicted games
- Real-time updates via GuessesContext

---

## Component Architecture

### New Components (3 files)

#### 1. UrgencyAccordionGroup (`/Users/gvinokur/Personal/qatar-prode-story-15/app/components/urgency-accordion-group.tsx`)

**Purpose**: Container managing all three urgency tier accordions

**Key Responsibilities**:
- Filter games by urgency tier (urgent/warning/notice) client-side
- Manage accordion expansion state (single accordion open at a time)
- Auto-expand urgent tier on mount if it has unpredicted games
- Integrate GameResultEditDialog for editing predictions
- Handle real-time updates from GuessesContext

**Props Interface**:
```typescript
interface UrgencyAccordionGroupProps {
  games: ExtendedGameData[];
  teamsMap: Record<string, Team>;
  gameGuesses: Record<string, GameGuessNew>;
  tournamentId: string;
  isPlayoffs: boolean;
}
```

**Filtering Logic**:
```typescript
const ONE_HOUR = 60 * 60 * 1000;

// Filter games by urgency tier
const filterGamesByUrgency = () => {
  const now = Date.now();
  const urgent: ExtendedGameData[] = [];
  const warning: ExtendedGameData[] = [];
  const notice: ExtendedGameData[] = [];

  games.forEach(game => {
    const deadline = game.game_date.getTime() - ONE_HOUR;
    const timeUntilClose = deadline - now;

    // Only include games closing within 48 hours
    if (timeUntilClose > 48 * ONE_HOUR || timeUntilClose < -ONE_HOUR) {
      return;
    }

    if (timeUntilClose < 2 * ONE_HOUR) {
      urgent.push(game);
    } else if (timeUntilClose < 24 * ONE_HOUR) {
      warning.push(game);
    } else {
      notice.push(game);
    }
  });

  // Sort by deadline (earliest first)
  const sortByDeadline = (a, b) =>
    a.game_date.getTime() - b.game_date.getTime();

  return {
    urgent: urgent.sort(sortByDeadline),
    warning: warning.sort(sortByDeadline),
    notice: notice.sort(sortByDeadline)
  };
};
```

**State Management**:
- `expandedTierId: string | null` - tracks which accordion is expanded
- Auto-expand on mount: urgent tier if it has unpredicted games, otherwise null

---

#### 2. UrgencyAccordion (`/Users/gvinokur/Personal/qatar-prode-story-15/app/components/urgency-accordion.tsx`)

**Purpose**: Single accordion representing one urgency tier

**Key Responsibilities**:
- Group games into "REQUIEREN ACCIÓN" (unpredicted) and "YA PREDICHOS" (predicted)
- Display game count badge in summary
- Show Alert-style title with severity color
- Render UrgencyGameCards in responsive Grid
- Handle expansion/collapse

**Props Interface**:
```typescript
interface UrgencyAccordionProps {
  severity: 'error' | 'warning' | 'info';
  title: string; // e.g., "2 partidos cierran en 2 horas"
  games: ExtendedGameData[];
  teamsMap: Record<string, Team>;
  gameGuesses: Record<string, GameGuessNew>;
  isExpanded: boolean;
  onToggle: (tierId: string) => void;
  tierId: string; // 'urgent' | 'warning' | 'notice'
  onEditGame: (gameId: string) => void;
}
```

**Grouping Logic**:
```typescript
const isPredicted = (game: ExtendedGameData): boolean => {
  const guess = gameGuesses[game.id];
  return !!(
    guess &&
    guess.home_score != null &&
    guess.away_score != null &&
    typeof guess.home_score === 'number' &&
    typeof guess.away_score === 'number'
  );
};

const unpredictedGames = games.filter(g => !isPredicted(g));
const predictedGames = games.filter(g => isPredicted(g));
```

**Layout Structure**:
```
<Accordion expanded={isExpanded} onChange={onToggle}>
  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
    <Alert severity={severity} icon={false}>
      {title}
    </Alert>
  </AccordionSummary>

  <AccordionDetails>
    {/* REQUIEREN ACCIÓN section */}
    {unpredictedGames.length > 0 && (
      <Box>
        <Typography variant="subtitle2" color="error">
          REQUIEREN ACCIÓN ({unpredictedGames.length})
        </Typography>
        <Grid container spacing={1}>
          {unpredictedGames.map(game => (
            <Grid key={game.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <UrgencyGameCard ... />
            </Grid>
          ))}
        </Grid>
      </Box>
    )}

    {/* YA PREDICHOS section */}
    {predictedGames.length > 0 && (
      <Box>
        <Typography variant="subtitle2" color="success">
          YA PREDICHOS ({predictedGames.length})
        </Typography>
        <Grid container spacing={1}>
          {predictedGames.map(game => (
            <Grid key={game.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <UrgencyGameCard ... />
            </Grid>
          ))}
        </Grid>
      </Box>
    )}
  </AccordionDetails>
</Accordion>
```

---

#### 3. UrgencyGameCard (`/Users/gvinokur/Personal/qatar-prode-story-15/app/components/urgency-game-card.tsx`)

**Purpose**: Compact game card display within accordion

**Key Responsibilities**:
- Display teams with logos (20px size)
- Show GameCountdownDisplay component
- Display edit button with proper label
- Show boost badge if applied
- Indicate prediction status (scores or "vs")

**Props Interface**:
```typescript
interface UrgencyGameCardProps {
  game: ExtendedGameData;
  teamsMap: Record<string, Team>;
  isPredicted: boolean;
  prediction?: {
    homeScore: number;
    awayScore: number;
    boostType?: 'silver' | 'golden' | null;
  };
  onEdit: (gameId: string) => void;
  disabled?: boolean;
}
```

**Layout** (compact, ~80-100px height):
```
┌────────────────────────────────────┐
│ 🏴 Argentina vs Brasil   [✏️ Edit] │  ← Teams + Edit button (top right)
│ 📊 2-1 [2x]              OR  vs    │  ← Score + Boost (if predicted) OR "vs" (unpredicted)
│ ⏰ Cierra en 1h 23m                │  ← GameCountdownDisplay
└────────────────────────────────────┘
```

**Styling**:
- Similar to CompactGameViewCard but more compact
- Border color based on boost (reuse getBoostBorderColor logic)
- Smaller font sizes (body2/caption)
- Team logos: 20px (vs 24px in full cards)
- Edit button positioned top right (following existing pattern)

---

### Modified Components (2 files)

#### 4. PredictionStatusBar (`/Users/gvinokur/Personal/qatar-prode-story-15/app/components/prediction-status-bar.tsx`)

**Changes**:
1. Add new optional props to interface (lines 12-27):
```typescript
interface PredictionStatusBarProps {
  // ... existing props

  // New optional props for accordion support
  readonly games?: ExtendedGameData[];
  readonly teamsMap?: Record<string, Team>;
  readonly gameGuesses?: Record<string, GameGuessNew>;
  readonly tournamentId?: string;
  readonly isPlayoffs?: boolean;
}
```

2. Replace static Alert rendering (lines 286-299) with conditional:
```typescript
{/* Urgency Warnings Section */}
{showAccordions ? (
  <UrgencyAccordionGroup
    games={games!}
    teamsMap={teamsMap!}
    gameGuesses={gameGuesses!}
    tournamentId={tournamentId!}
    isPlayoffs={isPlayoffs!}
  />
) : allWarnings.length > 0 ? (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
    {allWarnings.map((warning, index) => (
      <Alert key={`${warning.severity}-${index}`} severity={warning.severity}>
        {warning.message}
      </Alert>
    ))}
  </Box>
) : null}
```

3. Add helper variable:
```typescript
const showAccordions = games && teamsMap && gameGuesses && tournamentId !== undefined;
```

**Backward Compatibility**: Pages not passing new props will still see static alerts

---

#### 5. PredictionDashboard (`/Users/gvinokur/Personal/qatar-prode-story-15/app/components/prediction-dashboard.tsx`)

**Changes**:
1. Pass new props to PredictionStatusBar (modify lines 114-124):
```typescript
<PredictionStatusBar
  totalGames={currentStats.totalGames}
  predictedGames={currentStats.predictedGames}
  silverUsed={currentStats.silverUsed}
  silverMax={silverMax}
  goldenUsed={currentStats.goldenUsed}
  goldenMax={goldenMax}
  urgentGames={currentStats.urgentGames}
  warningGames={currentStats.warningGames}
  noticeGames={currentStats.noticeGames}
  // NEW: Pass data for accordion support
  games={games}
  teamsMap={teamsMap}
  gameGuesses={gameGuesses}
  tournamentId={tournamentId}
  isPlayoffs={isPlayoffs}
/>
```

**No other changes needed** - component already has all required data

---

## Data Flow

```
PredictionDashboard
  ├─ Has: games, teamsMap, tournamentId, isPlayoffs
  ├─ Gets from context: gameGuesses (via GuessesContext)
  ↓
PredictionStatusBar
  ├─ Receives all props
  ├─ Conditionally renders UrgencyAccordionGroup OR static alerts
  ↓
UrgencyAccordionGroup
  ├─ Filters games by urgency tier (useMemo with currentTime dependency)
  ├─ Manages accordion expansion state
  ├─ Renders GameResultEditDialog
  ↓
UrgencyAccordion (one per tier)
  ├─ Groups games by isPredicted
  ├─ Renders two sections: unpredicted, predicted
  ↓
UrgencyGameCard (one per game)
  ├─ Displays game info with GameCountdownDisplay
  ├─ Edit button calls onEdit callback
  ↓
GameResultEditDialog (opens on edit click)
  ├─ User edits prediction
  ├─ Calls GuessesContext.updateGameGuess()
  ↓
GuessesContext updates
  ├─ State change triggers re-render
  ├─ UrgencyAccordionGroup re-filters games
  ├─ Games move between sections automatically
```

---

## Implementation Order

### Phase 1: Base Components (Build bottom-up)
1. **UrgencyGameCard** - Atomic component, easiest to test in isolation
2. **UrgencyAccordion** - Uses UrgencyGameCard, test grouping logic
3. **UrgencyAccordionGroup** - Container, test filtering and state management

### Phase 2: Integration
4. **PredictionStatusBar** - Add conditional rendering
5. **PredictionDashboard** - Pass new props
6. **Manual Testing** - Verify accordions appear and work

### Phase 3: Edit Integration
7. **GameResultEditDialog in UrgencyAccordionGroup** - Copy pattern from GamesGrid
8. **Test prediction flow** - Edit → save → context update → re-render

### Phase 4: Polish
9. **Styling refinements** - Match existing theme, responsive breakpoints
10. **Edge cases** - Empty states, tier transitions, mobile optimization

### Phase 5: Testing
12. **Unit tests** - All new components
13. **Integration tests** - Full prediction flow
14. **Accessibility** - Keyboard navigation, screen readers

---

## Edge Cases & Behaviors

### 1. No Games in a Tier
**Behavior**: Hide accordion entirely
```typescript
{urgentGames.length > 0 && <UrgencyAccordion tier="urgent" ... />}
```

### 2. All Games Predicted in a Tier
**Behavior**: Show accordion, display only "YA PREDICHOS" section

### 3. Games Transitioning Between Tiers
**Behavior**: Handled automatically via useMemo with currentTime dependency
- CountdownContext updates currentTime every second
- UrgencyAccordionGroup re-filters in useMemo
- Games smoothly move between tiers

### 4. Empty Tier After Expansion
**Behavior**: Auto-collapse if expanded tier becomes empty

### 5. Closed Games (< -1 hour past deadline)
**Behavior**: Exclude from all tiers (already closed, no action needed)

### 6. User Not Logged In
**Behavior**: Show accordions in read-only mode (hide edit buttons)

### 7. Mobile vs Desktop
**Responsive Grid**:
- xs (< 600px): 1 column
- sm (600-900px): 2 columns
- md+ (> 900px): 3 columns

---

## Testing Strategy

### Unit Tests (Required for 80% coverage)

#### `__tests__/components/urgency-accordion-group.test.tsx`
- ✓ Filters games by urgency tier correctly
- ✓ Hides tiers with no games
- ✓ Sorts games by deadline within each tier
- ✓ Auto-expands urgent tier if unpredicted games exist
- ✓ Handles empty games array
- ✓ Updates when gameGuesses change
- ✓ Updates when time passes (via currentTime)

#### `__tests__/components/urgency-accordion.test.tsx`
- ✓ Groups games into unpredicted and predicted
- ✓ Hides unpredicted section when all predicted
- ✓ Hides predicted section when none predicted
- ✓ Shows correct game count in summary
- ✓ Expands/collapses on click
- ✓ Applies correct severity styling

#### `__tests__/components/urgency-game-card.test.tsx`
- ✓ Displays team names and logos
- ✓ Shows countdown timer
- ✓ Shows edit button when enabled
- ✓ Hides edit button when disabled
- ✓ Shows boost badge when boost applied
- ✓ Calls onEdit when edit button clicked
- ✓ Shows scores when predicted

### Integration Tests

#### `__tests__/integration/prediction-dashboard-urgency.test.tsx`
- ✓ Passes games to PredictionStatusBar
- ✓ Updates accordions when prediction saved
- ✓ Moves game from unpredicted to predicted on save
- ✓ Updates game count badges after edit
- ✓ Opens GameResultEditDialog on edit click

---

## Critical Files Reference

**Files to Create**:
- `/Users/gvinokur/Personal/qatar-prode-story-15/app/components/urgency-accordion-group.tsx`
- `/Users/gvinokur/Personal/qatar-prode-story-15/app/components/urgency-accordion.tsx`
- `/Users/gvinokur/Personal/qatar-prode-story-15/app/components/urgency-game-card.tsx`

**Files to Modify**:
- `/Users/gvinokur/Personal/qatar-prode-story-15/app/components/prediction-status-bar.tsx` (lines 12-27, 286-299)
- `/Users/gvinokur/Personal/qatar-prode-story-15/app/components/prediction-dashboard.tsx` (lines 114-124)

**Files to Reference (No Changes)**:
- `/Users/gvinokur/Personal/qatar-prode-story-15/app/components/game-countdown-display.tsx` - Reuse for countdown
- `/Users/gvinokur/Personal/qatar-prode-story-15/app/components/game-result-edit-dialog.tsx` - Reuse for editing
- `/Users/gvinokur/Personal/qatar-prode-story-15/app/components/compact-game-view-card.tsx` - Reference for styling
- `/Users/gvinokur/Personal/qatar-prode-story-15/app/components/games-grid.tsx` - Reference for edit integration pattern
- `/Users/gvinokur/Personal/qatar-prode-story-15/app/components/backoffice/PlayersTab.tsx` - Reference for Accordion pattern

---

## Verification & Testing

### Manual Testing Checklist

1. **Load tournament page**
   - ✓ Accordions render instead of static alerts
   - ✓ Games correctly grouped by urgency tier
   - ✓ Urgent tier auto-expanded (if has games)

2. **Expand/Collapse Accordions**
   - ✓ Only one accordion open at a time
   - ✓ Click to expand/collapse works

3. **Game Card Display**
   - ✓ Teams display with logos
   - ✓ Countdown updates every second
   - ✓ Edit button visible and clickable
   - ✓ Boost badge shows if applied

4. **Edit Prediction Flow**
   - ✓ Click edit button → dialog opens
   - ✓ Enter scores and boost
   - ✓ Save → dialog closes
   - ✓ Game moves from "REQUIEREN ACCIÓN" to "YA PREDICHOS"
   - ✓ Countdown continues updating

5. **Real-time Updates**
   - ✓ Wait for time to pass → game transitions between tiers
   - ✓ Make multiple predictions → sections update
   - ✓ All games predicted → accordion shows only "YA PREDICHOS"

6. **Empty States**
   - ✓ No urgent games → urgent tier hidden
   - ✓ All games predicted → only "YA PREDICHOS" section
   - ✓ No games closing → no accordions shown

7. **Mobile Testing**
   - ✓ Single column layout on mobile
   - ✓ Touch-friendly buttons (min 44x44px)
   - ✓ Readable text sizes
   - ✓ Smooth scrolling

8. **Backward Compatibility**
   - ✓ Pages not passing games prop still show static alerts

### Automated Tests

```bash
# Run all tests
npm run test

# Run specific test files
npm run test urgency-accordion-group.test.tsx
npm run test urgency-accordion.test.tsx
npm run test urgency-game-card.test.tsx
npm run test prediction-dashboard-urgency.test.tsx

# Check coverage
npm run test -- --coverage
```

### Build & Lint

```bash
# Build check
npm run build

# Lint check
npm run lint

# Type check
npx tsc --noEmit
```

---

## Success Criteria

1. ✅ Users can see WHICH games are closing (not just counts)
2. ✅ Users can edit predictions directly from accordion (no scrolling)
3. ✅ Urgent tier auto-expands by default
4. ✅ Games grouped into "REQUIEREN ACCIÓN" and "YA PREDICHOS"
5. ✅ Real-time countdown timers update every second
6. ✅ Boost badges visible when applied
7. ✅ Mobile responsive (1/2/3 column layouts)
8. ✅ Backward compatible (pages without new props show static alerts)
9. ✅ 80% test coverage on new code
10. ✅ 0 new SonarCloud issues

---

## Out of Scope (Future Enhancements)

- Browser push notifications for urgent games
- Inline quick-edit (without opening dialog)
- Swipe gestures on mobile
- "Snooze" or "remind me later" functionality
- Historical urgency analytics
- Static filter dropdown (can be separate story)

---

## Notes

- **No database changes** - All data already available
- **No breaking changes** - Backward compatible via conditional rendering
- **Performance optimized** - useMemo for filtering, React.memo for cards
- **Accessibility** - Native MUI Accordion keyboard support, proper ARIA labels
- **Reuses existing infrastructure** - GameCountdownDisplay, GameResultEditDialog, GuessesContext
