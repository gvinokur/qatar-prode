# Implementation Plan: Story #254
## [UX] Tournament Home: Two-Column Game Card Layout for Large Screens

### Story Context

**Issue:** #254
**Title:** [UX] Tournament Home: Two-Column Game Card Layout for Large Screens
**Labels:** category/technical-ux, effort/low, type/ux-improvement
**Status:** In Progress

**Problem Statement:**
The tournament home page displays game cards in a single vertical column regardless of screen size. This creates three UX problems:
1. Excessive scrolling on large screens with wasted horizontal space
2. Limited clickable area (only the score grid is clickable, not the entire card)
3. Poor actual result UI (tiny banner with abbreviated team names that gets truncated on mobile)

**Objectives:**
1. Implement responsive two-column grid layout for large screens
2. Make entire card clickable to enter edit mode
3. Redesign actual result display with better readability and visual hierarchy

**User Impact:**
- Reduced scrolling on desktop (50% fewer screens to scroll through)
- Better discoverability with fully clickable cards
- Easier comparison between predictions and actual results
- Improved mobile readability (no text truncation)
- Professional appearance with clear visual feedback

### Acceptance Criteria

**Two-Column Layout:**
- [x] Game cards display in 2 columns on tablets and larger screens (≥600px)
- [x] Single column maintained on mobile (<600px)
- [x] Layout uses viewport breakpoints (consistent with project patterns)
- [x] No horizontal scrolling introduced
- [x] Card content remains readable at half-width

**Entire Card Clickable:**
- [x] Entire card surface area is clickable to enter edit mode
- [x] Card component wraps onClick handler (not just inner grid)
- [x] Keyboard navigation works correctly
- [x] Focus states are clearly visible
- [x] Non-interactive elements (checkboxes, buttons) don't trigger card click

**Actual Result UI:**
- [x] "Actual Result" label centered (matches "Your Prediction" style)
- [x] Full team names displayed (no abbreviations like "BRA")
- [x] Prediction Result badge shown below score (Exact/Correct/Incorrect)
- [x] Badge colors: Green for Exact/Correct, Red for Incorrect
- [x] No gradient backgrounds (subtle borders only)
- [x] Handles "In Play" state with appropriate message
- [x] No text truncation on mobile devices
- [x] Clear visual hierarchy maintained

**General:**
- [x] No visual glitches during layout transitions
- [x] All game states work correctly (before game, in play, completed)
- [x] Maintains responsive design across all screen sizes
- [x] Accessibility standards met (WCAG 2.1 AA)

### Visual Prototypes

**Mockup References:**
- Before/After comparison: `docs/mockups/issue-254-before-after.png`
- All prediction states: `docs/mockups/issue-254-all-states.png`
- Complete mockup: `docs/mockups/issue-254-mockup-full.png`
- Interactive HTML: `game-card-result-mockup-v3.html`

**Current vs New:**

```
┌─ CURRENT (Before) ─────────────────┐    ┌─ NEW (After) ──────────────────────┐
│                                    │    │                                    │
│  [Card Header: Game #, Date]       │    │     [Card Header: Game #, Date]    │
│  ─────────────────────────────     │    │     ──────────────────────────     │
│  Brazil    2 - 2    Morocco        │    │     Your Prediction                │
│  [Team Logos]                      │    │     Brazil    1 - 0    Morocco     │
│  ─────────────────────────────     │    │     [Team Logos]                   │
│  Location: Qatar Stadium           │    │     ──────────────────────────     │
│                                    │    │     Actual Result                  │
│  BRA 2 - 2 MAR  ← Tiny banner      │    │     Brazil    2 - 2    Morocco     │
│                                    │    │     [Team Logos]                   │
└────────────────────────────────────┘    │     ──────────────────────────     │
                                          │     Prediction Result: ✓ Correct   │
                                          │     [Green badge]                  │
                                          │     ──────────────────────────     │
                                          │     Location: Qatar Stadium        │
                                          │                                    │
                                          └────────────────────────────────────┘
```

**Two-Column Layout (Desktop):**

```
┌──────────── Tournament Home (Desktop ≥600px) ────────────┐
│                                                           │
│  ┌───────────────────────┐  ┌───────────────────────┐    │
│  │   Game 1              │  │   Game 2              │    │
│  │   Brazil vs Morocco   │  │   Argentina vs Peru   │    │
│  └───────────────────────┘  └───────────────────────┘    │
│                                                           │
│  ┌───────────────────────┐  ┌───────────────────────┐    │
│  │   Game 3              │  │   Game 4              │    │
│  │   Spain vs Germany    │  │   France vs Italy     │    │
│  └───────────────────────┘  └───────────────────────┘    │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

**Mobile Layout (<600px):**

```
┌─── Tournament Home (Mobile) ───┐
│                                │
│  ┌─────────────────────────┐   │
│  │   Game 1                │   │
│  │   Brazil vs Morocco     │   │
│  └─────────────────────────┘   │
│                                │
│  ┌─────────────────────────┐   │
│  │   Game 2                │   │
│  │   Argentina vs Peru     │   │
│  └─────────────────────────┘   │
│                                │
│  ┌─────────────────────────┐   │
│  │   Game 3                │   │
│  │   Spain vs Germany      │   │
│  └─────────────────────────┘   │
│                                │
└────────────────────────────────┘
```

**Actual Result Section (All States):**

```
State 1: EXACT (Green border, green badge)
┌────────────────────────────────┐
│     Your Prediction            │
│     Brazil    1 - 0    Morocco │
│     ──────────────────────     │
│     Actual Result              │
│     Brazil    1 - 0    Morocco │
│     ──────────────────────     │
│     ✓ Exact (10 points)        │
│     [Green Badge]              │
└────────────────────────────────┘

State 2: CORRECT (Green border, green badge)
┌────────────────────────────────┐
│     Your Prediction            │
│     Brazil    2 - 0    Morocco │
│     ──────────────────────     │
│     Actual Result              │
│     Brazil    1 - 0    Morocco │
│     ──────────────────────     │
│     ✓ Correct (3 points)       │
│     [Green Badge]              │
└────────────────────────────────┘

State 3: INCORRECT (Red border, red badge)
┌────────────────────────────────┐
│     Your Prediction            │
│     Brazil    2 - 0    Morocco │
│     ──────────────────────     │
│     Actual Result              │
│     Morocco   1 - 0    Brazil  │
│     ──────────────────────     │
│     ✗ Incorrect (0 points)     │
│     [Red Badge]                │
└────────────────────────────────┘

State 4: IN PLAY (Orange border, no badge)
┌────────────────────────────────┐
│     Your Prediction            │
│     Brazil    2 - 0    Morocco │
│     ──────────────────────     │
│     ⚽ In Play or Recently      │
│     Finished                   │
└────────────────────────────────┘

State 5: BEFORE GAME (No result section)
┌────────────────────────────────┐
│     Your Prediction            │
│     Brazil    2 - 0    Morocco │
│     ──────────────────────     │
│     Location: Qatar Stadium    │
└────────────────────────────────┘
```

### Technical Approach

#### 1. Two-Column Grid Layout

**File:** `/Users/gvinokur/Personal/qatar-prode/app/components/games-list-with-scroll.tsx`

**Current Implementation (Lines 200-262):**
```tsx
<Stack spacing={2}>
  {games.map(game => (
    <Box key={game.id}>
      <FlippableGameCard {...props} />
    </Box>
  ))}
</Stack>
```

**New Implementation:**
```tsx
<Grid container spacing={2}>
  {games.map(game => (
    <Grid key={game.id} size={{ xs: 12, sm: 6 }}>
      <FlippableGameCard {...props} />
    </Grid>
  ))}
</Grid>
```

**Changes:**
- Replace `Stack` with `Grid container`
- Wrap each card in `Grid` item with responsive sizing
- `xs: 12` = full width on mobile (<600px)
- `sm: 6` = half width on tablets and desktop (≥600px)
- `spacing={2}` maintains 16px gaps between cards

**Rationale:**
- Uses Material-UI Grid component (MUI v7 API with `size` prop)
- Follows existing project patterns (see `games-grid.tsx` and `qualified-teams-grid.tsx`)
- Viewport-based breakpoints (project standard, not container queries)
- Automatically handles navigation button visibility (they're already responsive)

**Edge Cases:**
- Odd number of games: Last card takes full width in second column
- Empty games list: Already handled by existing empty state component
- Single game: Displays centered in first column

#### 2. Make Entire Card Clickable

**File:** `/Users/gvinokur/Personal/qatar-prode/app/components/compact-game-view-card.tsx`

**Current Implementation (Lines 270-276):**
```tsx
<Grid
  container
  spacing={1}
  sx={isClickableStyles}
  onClick={handleEditClick}
  width='100%'
>
  {/* Teams and scores */}
</Grid>
```

Only the inner Grid (teams + scores) is clickable.

**Revised Approach (Simpler, Less Disruptive):**

Instead of moving onClick to Card (which would require complex stopPropagation for nested elements), enhance the Card visual feedback while keeping the Grid handler:

```tsx
<Card
  variant='outlined'
  sx={{
    ...boostStyles,
    // Add cursor pointer to entire card when clickable
    ...(isClickable && !isGameFixture ? { cursor: 'pointer' } : {}),
    // Existing focus-within styling already provides visual feedback (lines 147-150)
  }}
>
  <CardContent>
    {/* Keep existing onClick on Grid - no changes to interaction model */}
    <Grid
      container
      spacing={1}
      onClick={handleEditClick}
      sx={{
        // Grid remains the interactive target
        // Remove local cursor pointer (inherited from Card now)
      }}
    >
      {/* Teams and scores */}
    </Grid>
  </CardContent>
</Card>
```

**Changes:**
- Add `cursor: 'pointer'` to Card sx prop when clickable (visual feedback only)
- Keep `onClick={handleEditClick}` on Grid (existing interaction model)
- Remove redundant cursor pointer from Grid styles (inherited from Card)
- No stopPropagation needed (simpler, more maintainable)

**Why This Approach:**
- Card provides visual feedback (cursor pointer) for entire surface
- Grid remains the actual click target (no event propagation issues)
- Nested interactive elements (checkbox, buttons) continue to work as-is
- Existing focus management preserved
- Less code, fewer edge cases

**Accessibility:**
- Card already has proper focus outline via `:focus-within` (lines 147-150)
- Grid already has proper click/keyboard handling
- No changes needed to existing accessibility structure

**Testing Scenarios:**
- Hover over card → Cursor changes to pointer (visual cue)
- Click on teams/scores → Opens edit dialog (existing behavior)
- Click on header/location → No action (but cursor hints clickability)
- Publish checkbox/edit button → Work independently (no conflicts)
- Tab navigation → Works as before
- Disabled cards → No pointer cursor

**Note:** This provides the visual hint that the card is interactive while maintaining the existing, proven interaction model. Users will discover the clickable area through the cursor feedback.

#### 3. Redesigned Actual Result Display

**File:** `/Users/gvinokur/Personal/qatar-prode/app/components/compact-game-view-card.tsx`

**Create New Component:** `/Users/gvinokur/Personal/qatar-prode/app/components/actual-result-display.tsx`

**Component Structure:**
```tsx
'use client'

import { Box, Typography, Grid, Chip } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslations } from 'next-intl';
import { Theme } from '../db/tables-definition';

interface ActualResultDisplayProps {
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  predictionResult: 'exact' | 'correct' | 'incorrect';
  homeTeamTheme?: Theme | null;
  awayTeamTheme?: Theme | null;
  homePenaltyScore?: number | null;
  awayPenaltyScore?: number | null;
}

export function ActualResultDisplay({ ... }: ActualResultDisplayProps) {
  const t = useTranslations('predictions'); // Use existing 'predictions' namespace

  return (
    <Box sx={{ mt: 1, borderTop: (theme) => `1px solid ${theme.palette.divider}` }}>
      {/* "Actual Result" label - centered */}
      <Typography variant="body2" align="center" sx={{ mt: 1, mb: 0.5, fontWeight: 'medium' }}>
        {t('game.actualResult')}
      </Typography>

      {/* Score display with full team names */}
      <Grid container spacing={1} alignItems="center" justifyContent="center">
        <Grid size={5} sx={{ textAlign: 'right' }}>
          <Typography variant="body2" fontWeight="medium">
            {homeTeamName}
          </Typography>
          {homeTeamTheme && <TeamLogo theme={homeTeamTheme} size={24} />}
        </Grid>

        <Grid size={2} sx={{ textAlign: 'center' }}>
          <Typography variant="body1" fontWeight="bold">
            {homeScore} - {awayScore}
          </Typography>
          {(homePenaltyScore !== null || awayPenaltyScore !== null) && (
            <Typography variant="caption" color="text.secondary">
              ({homePenaltyScore ?? 0} - {awayPenaltyScore ?? 0} pen)
            </Typography>
          )}
        </Grid>

        <Grid size={5}>
          <Typography variant="body2" fontWeight="medium">
            {awayTeamName}
          </Typography>
          {awayTeamTheme && <TeamLogo theme={awayTeamTheme} size={24} />}
        </Grid>
      </Grid>

      {/* Prediction Result badge */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
        <Chip
          label={getPredictionResultLabel(predictionResult, t)}
          icon={getPredictionResultIcon(predictionResult)}
          color={predictionResult === 'incorrect' ? 'error' : 'success'}
          size="small"
          variant="filled"
        />
      </Box>
    </Box>
  );
}

// Helper functions
function getPredictionResultLabel(
  result: 'exact' | 'correct' | 'incorrect',
  t: ReturnType<typeof useTranslations>
): string {
  const points = result === 'exact' ? 10 : result === 'correct' ? 3 : 0;
  const labels = {
    exact: t('game.predictionResultExact', { points }),
    correct: t('game.predictionResultCorrect', { points }),
    incorrect: t('game.predictionResultIncorrect'),
  };
  return labels[result];
}

function getPredictionResultIcon(result: 'exact' | 'correct' | 'incorrect') {
  return result === 'incorrect' ? <CloseIcon /> : <CheckIcon />;
}
```

**Helper Functions:**
```tsx
function getPredictionResultLabel(
  result: 'exact' | 'correct' | 'incorrect',
  t: ReturnType<typeof useTranslations>
): string {
  // Points based on result type (matches scoring system)
  const points = result === 'exact' ? 10 : result === 'correct' ? 3 : 0;

  const labels = {
    exact: t('game.predictionResultExact', { points }), // "✓ Exact (10 points)"
    correct: t('game.predictionResultCorrect', { points }), // "✓ Correct (3 points)"
    incorrect: t('game.predictionResultIncorrect'), // "✗ Incorrect (0 points)"
  };
  return labels[result];
}

function getPredictionResultIcon(result: 'exact' | 'correct' | 'incorrect') {
  return result === 'incorrect' ? <CloseIcon /> : <CheckIcon />;
}
```

**Integration in CompactGameViewCard:**

Replace current result banner (lines 389-430) with:

```tsx
{/* Add "Your Prediction" label above existing prediction */}
<Typography variant="body2" align="center" sx={{ mb: 1, fontWeight: 'medium' }}>
  {t('game.yourPrediction')}
</Typography>

{/* Existing teams + scores grid */}
<Grid container spacing={1}>
  {/* ... existing code ... */}
</Grid>

{/* New actual result section */}
{isGameGuess && gameResult && hasResult && (
  <ActualResultDisplay
    homeTeamName={homeTeamNameOrDescription}
    awayTeamName={awayTeamNameOrDescription}
    homeScore={gameResult.home_score!}
    awayScore={gameResult.away_score!}
    predictionResult={calculatePredictionResult(
      homeScore,
      awayScore,
      gameResult.home_score!,
      gameResult.away_score!
    )}
    homeTeamTheme={homeTeamTheme}
    awayTeamTheme={awayTeamTheme}
    homePenaltyScore={gameResult.home_penalty_score}
    awayPenaltyScore={gameResult.away_penalty_score}
  />
)}

{/* In Play message (replaces result when game is ongoing) */}
{isGameGuess && !hasResult && isPastDeadline && (
  <Box sx={{ mt: 1, textAlign: 'center', borderTop: (theme) => `1px solid ${theme.palette.divider}`, pt: 1 }}>
    <Typography variant="body2" color="warning.main">
      ⚽ {t('game.inPlayOrRecentlyFinished')}
    </Typography>
  </Box>
)}
```

**Calculate Prediction Result (Explicit Logic):**
```tsx
/**
 * Determines prediction accuracy based on predicted vs actual scores.
 *
 * Returns:
 * - 'exact': Predicted scores match actual scores exactly
 * - 'correct': Predicted winner matches actual winner (but not exact score)
 * - 'incorrect': Predicted winner does not match actual winner
 *
 * Winner determination:
 * - home > away = home wins
 * - away > home = away wins
 * - home === away = draw
 *
 * Edge cases:
 * - User predicted draw (1-1), actual was draw (0-0) → 'correct' (same winner: draw)
 * - User predicted home win (2-0), actual was draw (1-1) → 'incorrect' (different winner)
 * - User predicted draw (0-0), actual was home win (1-0) → 'incorrect' (different winner)
 */
function calculatePredictionResult(
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number
): 'exact' | 'correct' | 'incorrect' {
  // EXACT: Predicted scores match actual scores exactly
  if (predictedHome === actualHome && predictedAway === actualAway) {
    return 'exact';
  }

  // Determine winners using explicit conditions
  // Predicted winner
  const predictedWinner: 'home' | 'away' | 'draw' =
    predictedHome > predictedAway ? 'home' :
    predictedHome < predictedAway ? 'away' :
    'draw'; // predictedHome === predictedAway

  // Actual winner
  const actualWinner: 'home' | 'away' | 'draw' =
    actualHome > actualAway ? 'home' :
    actualHome < actualAway ? 'away' :
    'draw'; // actualHome === actualAway

  // CORRECT: Predicted winner matches actual winner (not exact score)
  if (predictedWinner === actualWinner) {
    return 'correct';
  }

  // INCORRECT: Predicted winner does not match actual winner
  return 'incorrect';
}
```

**Test Cases:**
- `calculatePredictionResult(2, 0, 2, 0)` → `'exact'` (exact match)
- `calculatePredictionResult(2, 0, 3, 1)` → `'correct'` (both home wins)
- `calculatePredictionResult(1, 1, 0, 0)` → `'correct'` (both draws)
- `calculatePredictionResult(2, 0, 0, 2)` → `'incorrect'` (home win vs away win)
- `calculatePredictionResult(1, 1, 2, 0)` → `'incorrect'` (draw vs home win)
- `calculatePredictionResult(2, 0, 1, 1)` → `'incorrect'` (home win vs draw)

**Note:** This logic does NOT account for penalty shootouts. If penalties are involved, the regular time winner is used for classification.

**Border Styling (Precedence Defined):**

Card already has boost border styling (lines 143-145):
```tsx
borderColor: getBoostBorderColor(), // Boost-specific colors
borderWidth: boostType ? 2 : 1,
boxShadow: getBoostShadow(),
```

**Conflict Resolution:**
Boost borders take visual precedence over result borders. When a game has both boost and result:
- Show boost border (user's active choice)
- Show result via ActualResultDisplay badge color only (no border)

When game has NO boost but HAS result:
- Show result border (green for exact/correct, red for incorrect)

**Implementation:**
```tsx
const resultBorderColor = isGameGuess && gameResult && hasResult && !boostType
  ? (calculatePredictionResult(...) === 'incorrect' ? 'error.main' : 'success.main')
  : undefined;

<Card
  variant='outlined'
  sx={{
    borderColor: boostType ? getBoostBorderColor() : (resultBorderColor || 'divider'),
    borderWidth: boostType ? 2 : (resultBorderColor ? 2 : 1),
    boxShadow: getBoostShadow(), // Boost shadow only
    // ... rest of styles
  }}
>
```

**Priority:**
1. Boost border (if boost exists)
2. Result border (if no boost, has result)
3. Default border (divider color, 1px)

**Translation Keys (Add to `/locales/en/predictions.json` and `/locales/es/predictions.json`):**

Add to existing "game" section in predictions.json:

```json
// /locales/en/predictions.json
{
  "game": {
    "vs": "vs",
    "editPrediction": "Edit prediction: {homeTeam} vs {awayTeam}",
    // ... existing keys ...
    "inPlayOrRecentlyFinished": "IN PLAY OR RECENTLY FINISHED",
    // ADD NEW KEYS BELOW:
    "yourPrediction": "Your Prediction",
    "actualResult": "Actual Result",
    "predictionResultExact": "✓ Exact ({points} points)",
    "predictionResultCorrect": "✓ Correct ({points} points)",
    "predictionResultIncorrect": "✗ Incorrect (0 points)"
  }
}
```

```json
// /locales/es/predictions.json
{
  "game": {
    "vs": "vs",
    "editPrediction": "Editar predicción: {homeTeam} vs {awayTeam}",
    // ... existing keys ...
    "inPlayOrRecentlyFinished": "EN JUEGO O RECIÉN TERMINADO",
    // ADD NEW KEYS BELOW:
    "yourPrediction": "Tu Predicción",
    "actualResult": "Resultado Real",
    "predictionResultExact": "✓ Exacto ({points} puntos)",
    "predictionResultCorrect": "✓ Correcto ({points} puntos)",
    "predictionResultIncorrect": "✗ Incorrecto (0 puntos)"
  }
}
```

**Usage in components:**
```tsx
// Use existing 'predictions' namespace
const t = useTranslations('predictions');

// Access keys:
t('game.yourPrediction') // "Your Prediction" / "Tu Predicción"
t('game.actualResult') // "Actual Result" / "Resultado Real"
t('game.predictionResultExact', { points: 10 }) // "✓ Exact (10 points)" / "✓ Exacto (10 puntos)"
```

### Files to Create/Modify

**Modified:**
1. `/Users/gvinokur/Personal/qatar-prode/app/components/games-list-with-scroll.tsx`
   - Replace Stack with Grid container
   - Wrap cards in Grid items with responsive sizing

2. `/Users/gvinokur/Personal/qatar-prode/app/components/compact-game-view-card.tsx`
   - Move onClick to Card component
   - Add accessibility attributes (role, tabIndex, onKeyDown)
   - Add "Your Prediction" label
   - Replace result banner with ActualResultDisplay component
   - Add result border styling
   - Add calculatePredictionResult function
   - Stop propagation for nested interactive elements

**Created:**
3. `/Users/gvinokur/Personal/qatar-prode/app/components/actual-result-display.tsx`
   - New component for redesigned result display
   - Props interface
   - Helper functions for labels and icons
   - Responsive layout with Grid

**Translation Files:**
4. `/Users/gvinokur/Personal/qatar-prode/locales/en/predictions.json`
5. `/Users/gvinokur/Personal/qatar-prode/locales/es/predictions.json`
   - Add translation keys to "game" section: yourPrediction, actualResult, predictionResultExact, predictionResultCorrect, predictionResultIncorrect

### Implementation Steps

1. **Add Translation Keys**
   - Add new keys to `locales/en/predictions.json` and `locales/es/predictions.json`
   - Add to existing "game" section
   - Keys: yourPrediction, actualResult, predictionResultExact, predictionResultCorrect, predictionResultIncorrect
   - Include {points} parameter for Exact/Correct labels
   - Verify translations are appropriate in both languages

2. **Create ActualResultDisplay Component**
   - Create new file `app/components/actual-result-display.tsx`
   - Implement component with Grid layout, Typography, and Chip
   - Add helper functions for labels and icons
   - Export component

3. **Update CompactGameViewCard (Result Display)**
   - Import ActualResultDisplay
   - Add "Your Prediction" label above existing prediction
   - Replace result banner (lines 389-430) with ActualResultDisplay
   - Add calculatePredictionResult function
   - Add result border styling to Card sx prop
   - Handle "In Play" state with message

4. **Update CompactGameViewCard (Clickability)**
   - Move onClick handler from Grid (line 274) to Card (line 154)
   - Add cursor pointer style to Card when clickable
   - Add accessibility attributes: role="button", tabIndex={0}, onKeyDown
   - Add stopPropagation to publish checkbox and edit button onClick handlers
   - Test keyboard navigation and focus states

5. **Update GamesListWithScroll (Layout)**
   - Import Grid component from '@mui/material'
   - Replace Stack with Grid container
   - Wrap FlippableGameCard in Grid items
   - Set responsive sizing: size={{ xs: 12, sm: 6 }}
   - Maintain spacing={2}
   - Verify navigation buttons still work

6. **Manual Testing**
   - Test two-column layout on different screen sizes
   - Test entire card clickability (header, body, footer)
   - Test nested interactivity (checkbox, buttons)
   - Test keyboard navigation (Tab, Enter)
   - Test all result states (exact, correct, incorrect, in play, before game)
   - Test mobile layout (no truncation)
   - Test with odd number of games
   - Test with single game

7. **Write Unit Tests**
   - Test ActualResultDisplay component rendering
   - Test calculatePredictionResult logic
   - Test responsive Grid layout
   - Test card clickability
   - Test accessibility attributes
   - Test translation keys

### Testing Strategy

#### Unit Tests

**Test File 1:** `__tests__/components/actual-result-display.test.tsx`

**Test scenarios:**
- Renders with full team names (no abbreviations)
- Displays correct scores (home, away, penalties)
- Shows "Exact" badge with green color when exact match
- Shows "Correct" badge with green color when winner matches
- Shows "Incorrect" badge with red color when winner doesn't match
- Displays team logos when theme provided
- Hides logos when theme is null
- Handles penalty scores display
- Applies correct typography variants
- Centers content properly

**Test File 2:** `__tests__/components/compact-game-view-card.test.tsx` (extend existing)

**New test scenarios:**
- **Clickability:**
  - Entire card is clickable when not disabled
  - Card is not clickable when disabled
  - Publish checkbox click doesn't trigger card click
  - Edit button click still works
  - Card has role="button" when clickable
  - Card is keyboard accessible (Tab, Enter)
  - Card has proper focus styles

- **Result Display:**
  - Shows "Your Prediction" label above prediction
  - Shows ActualResultDisplay when game has result
  - Shows "In Play" message when past deadline but no result
  - Doesn't show result section before game starts
  - Applies green border for exact result
  - Applies green border for correct result
  - Applies red border for incorrect result
  - Shows orange border for in-play games

- **Translation:**
  - Uses translation keys for labels
  - Works in both English and Spanish

**Test File 3:** `__tests__/components/games-list-with-scroll.test.tsx` (extend existing)

**New test scenarios:**
- **Layout:**
  - Uses Grid container instead of Stack
  - Wraps each card in Grid item
  - Applies responsive sizing (xs:12, sm:6)
  - Maintains spacing of 2
  - Handles empty games list
  - Handles single game
  - Handles odd number of games

- **Responsive:**
  - Mock useMediaQuery to test mobile (<600px)
  - Mock useMediaQuery to test tablet (≥600px)
  - Verify Grid size prop changes based on viewport

**Test File 4:** `__tests__/utils/prediction-result.test.ts`

**Test calculatePredictionResult function:**
- Returns 'exact' when scores match exactly
- Returns 'correct' when winner matches (home win)
- Returns 'correct' when winner matches (away win)
- Returns 'correct' when both are draws
- Returns 'incorrect' when predicted home win but actual away win
- Returns 'incorrect' when predicted away win but actual draw
- Returns 'incorrect' when predicted draw but actual home win
- Handles edge cases (0-0, high scores)

#### Integration Tests

**Test File:** `__tests__/integration/game-card-layout.test.tsx`

**Scenarios:**
- Renders tournament page with multiple game cards
- Verifies two-column layout on desktop
- Verifies single-column layout on mobile
- Clicking card opens edit dialog
- Clicking publish checkbox doesn't open dialog
- Result displays correctly across all states
- Border colors match prediction results

#### Visual Regression Tests

**Manual testing scenarios:**
- Screenshot comparison before/after on mobile
- Screenshot comparison before/after on tablet
- Screenshot comparison before/after on desktop
- Screenshot of all result states side-by-side
- Screenshot of card hover and focus states

#### Accessibility Tests

**Using @testing-library/jest-dom and vitest-axe:**
```tsx
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

it('has no accessibility violations', async () => {
  const { container } = renderWithTheme(<CompactGameViewCard {...props} />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

**Manual WCAG 2.1 AA checks:**
- Color contrast ratios for text and badges
- Keyboard navigation works for all interactive elements
- Screen reader announces card as button when clickable
- Focus indicators are visible
- Semantic HTML (proper heading levels, regions)

### Validation Considerations

#### SonarCloud Requirements

**Coverage Target:**
- 80% coverage on new code (all new functions and components)
- Calculate: (lines covered / total lines) × 100 ≥ 80%

**Files needing coverage:**
- `actual-result-display.tsx` - 100% (new file)
- `compact-game-view-card.tsx` - Modified sections at 80%+
- `games-list-with-scroll.tsx` - Modified sections at 80%+
- Helper functions (calculatePredictionResult) - 100%

**Code Quality:**
- 0 new bugs
- 0 new vulnerabilities
- 0 new code smells
- 0 new security hotspots
- Maintainability rating: A or B
- Duplicated code: <5%

**Specific checks:**
- No console.log statements
- No unused variables or imports
- Proper TypeScript types (no `any`)
- JSDoc comments for exported functions
- Error handling for edge cases
- Accessibility attributes present

#### Pre-commit Validation

**Run before commit:**
```bash
npm run test           # All tests pass
npm run lint           # No ESLint errors
npm run build          # Production build succeeds
```

**Git pre-commit hook:**
- Runs automatically via Husky
- Tests only modified files
- Blocks commit if any check fails

#### Manual Validation Checklist

**Functional:**
- [ ] Two-column layout appears on tablets and desktop
- [ ] Single-column layout on mobile
- [ ] Entire card is clickable (all areas)
- [ ] Nested buttons/checkboxes work independently
- [ ] Keyboard navigation works (Tab, Enter)
- [ ] Result displays correctly for all states
- [ ] Borders match result type
- [ ] No text truncation on mobile
- [ ] Team logos appear when available
- [ ] Penalty scores display correctly

**Visual:**
- [ ] Cards have proper spacing in grid
- [ ] No layout shift when resizing
- [ ] Focus outline is visible
- [ ] Hover cursor appears on desktop
- [ ] Colors match theme (light/dark mode)
- [ ] Typography is readable
- [ ] Alignment is consistent

**Accessibility:**
- [ ] Card has role="button" when clickable
- [ ] Card is keyboard accessible
- [ ] Screen reader announces correctly
- [ ] Color contrast meets WCAG AA
- [ ] Focus indicators are visible

**Edge Cases:**
- [ ] Odd number of games (last card centered)
- [ ] Single game (displays in first column)
- [ ] Empty games list (shows empty state)
- [ ] Very long team names (text wraps properly)
- [ ] Missing team logos (graceful fallback)
- [ ] Games with penalties (displays in result)

### Open Questions

None - all requirements are clear from the issue description and mockups.

### Dependencies

**External:**
- Material-UI Grid component (already in use)
- Material-UI Chip component (already in use)
- Material-UI icons: CheckIcon, CloseIcon (already in use)

**Internal:**
- Translation system (next-intl)
- Theme context (MUI ThemeProvider)
- Existing game card structure
- FlippableGameCard wrapper

**No new dependencies required.**

### Risk Assessment

**Low Risk:**
- Uses established Material-UI patterns
- Follows existing responsive design approach
- No data model changes
- No API changes
- Isolated to UI layer

**Potential Issues:**
- Card content at half-width on tablets might feel cramped
  - Mitigation: Test on real tablets, adjust breakpoint if needed (sm → md)
- Focus management when moving onClick to Card
  - Mitigation: Comprehensive keyboard navigation tests
- Performance with many cards (e.g., 64 World Cup games)
  - Mitigation: Grid is performant, no virtualization needed for <100 items

**Rollback Plan:**
- Changes are isolated to 3 files
- Can revert commit if issues found in production
- No database migrations or data changes involved

### Notes

**Design Approved:**
- User feedback session 2026-03-04
- Mockups created and reviewed
- No gradient backgrounds (avoids "traffic light" effect)
- Subtle borders only for result states

**Responsive Strategy:**
- Uses viewport breakpoints (project standard)
- NOT using container queries or ResizeObserver
- Follows existing patterns in `games-grid.tsx` and `qualified-teams-grid.tsx`

**Accessibility Priority:**
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- Color contrast

**Performance:**
- No expensive calculations
- No animations or transitions
- Static grid layout (CSS Grid)
- Minimal re-renders
