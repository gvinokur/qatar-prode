# Implementation Plan: Results & Tables Navigation Feature

## Story Context

**GitHub Issue:** #129 - Results & Tables Navigation Feature
**URL:** https://github.com/gvinokur/qatar-prode/issues/129

**User Request:** Create a new "Results & Tables" main navigation item where users can view actual game results, group tables, and playoff bracket in a minimalistic, read-only fashion.

**Scope:** This is a pure results-viewing experience - no prediction interaction, no editing. Think of it like a sports news site's results section.

## Acceptance Criteria

1. ✅ New "Results & Tables" navigation item appears in:
   - Mobile bottom navigation (with appropriate icon)
   - Desktop navigation (in header or sidebar)

2. ✅ Results page has two sub-sections accessible via tabs/segments:
   - **Groups Stage**: Grid of group cards showing games and standings
   - **Playoffs**: Traditional bracket diagram showing knockout rounds

3. ✅ Groups Stage View displays:
   - One card per group (A, B, C, etc.)
   - Each card shows minimalistic game results + ultra-compact group table
   - Responsive layout: 1 card/row (mobile), 2-3 cards/row (tablet/desktop)
   - Cards are collapsible on mobile

4. ✅ Playoffs View displays:
   - Traditional bracket diagram (Round of 16 → Quarters → Semis → Final)
   - Horizontally scrollable on mobile
   - Minimalistic game cards showing results only
   - No interaction (view-only)

5. ✅ Navigation behavior:
   - Bottom nav shows "Results" icon on mobile
   - Desktop shows "Results" link in header navigation
   - Clicking navigates to `/tournaments/[id]/results`
   - Default view: Groups Stage

## Visual Prototypes

### Mobile View - Groups Stage

```
┌─────────────────────────────────┐
│  ☰ Results & Tables             │
│  [Groups] [Playoffs]            │ ← Tabs
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────┐   │
│  │ ▼ GRUPO A               │   │ ← Collapsible
│  ├─────────────────────────┤   │
│  │ 🇶🇦 Qatar 0 - 2 Ecuador 🇪🇨│   │
│  │ 🇸🇳 Senegal 0 - 2 Netherlands 🇳🇱│
│  │ 🇶🇦 Qatar 1 - 3 Senegal 🇸🇳│   │
│  │ 🇳🇱 Netherlands 1 - 1 Ecuador 🇪🇨│
│  │ ... (2 more games)        │   │
│  │                           │   │
│  │ 📊 STANDINGS:             │   │
│  │ 1. 🇳🇱 NED  7pts  5-1     │   │
│  │ 2. 🇸🇳 SEN  6pts  5-4     │   │
│  │ 3. 🇪🇨 ECU  4pts  4-3     │   │
│  │ 4. 🇶🇦 QAT  0pts  1-7     │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ ▼ GRUPO B               │   │
│  ├─────────────────────────┤   │
│  │ ... (games and table)   │   │
│  └─────────────────────────┘   │
│                                 │
└─────────────────────────────────┘
│ [Home] [Tournament] [Results] [Stats] │ ← Bottom Nav
└─────────────────────────────────────────┘
```

### Desktop View - Groups Stage

```
┌────────────────────────────────────────────────────────────┐
│  🏆 Tournament Header                          [User] [⚙]  │
│  [Groups] [Playoffs]                                       │ ← Tabs
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────┐│
│  │ GRUPO A         │  │ GRUPO B         │  │ GRUPO C    ││
│  ├─────────────────┤  ├─────────────────┤  ├────────────┤│
│  │ QAT 0-2 ECU     │  │ ENG 6-2 IRN     │  │ ARG 1-2 SAU││
│  │ SEN 0-2 NED     │  │ USA 1-1 WAL     │  │ MEX 0-0 POL││
│  │ QAT 1-3 SEN     │  │ WAL 0-2 IRN     │  │ POL 2-0 SAU││
│  │ NED 1-1 ECU     │  │ ENG 0-0 USA     │  │ ARG 2-0 MEX││
│  │ ... (more)      │  │ ... (more)      │  │ ... (more) ││
│  │                 │  │                 │  │            ││
│  │ 📊 STANDINGS:   │  │ 📊 STANDINGS:   │  │ 📊 STANDI..││
│  │ 1. NED  7  5-1  │  │ 1. ENG  7  9-2  │  │ 1. ARG 6   ││
│  │ 2. SEN  6  5-4  │  │ 2. USA  5  2-1  │  │ 2. POL 4   ││
│  │ 3. ECU  4  4-3  │  │ 3. IRN  3  4-7  │  │ 3. MEX 4   ││
│  │ 4. QAT  0  1-7  │  │ 4. WAL  1  1-6  │  │ 4. SAU 3   ││
│  └─────────────────┘  └─────────────────┘  └────────────┘│
│                                                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────┐│
│  │ GRUPO D         │  │ GRUPO E         │  │ GRUPO F    ││
│  │ ... (same)      │  │ ... (same)      │  │ ... (same) ││
│  └─────────────────┘  └─────────────────┘  └────────────┘│
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Desktop View - Playoffs (Traditional Bracket)

```
┌────────────────────────────────────────────────────────────────────────────────┐
│  🏆 Tournament Header                                          [User] [⚙]     │
│  [Groups] [Playoffs]                                                          │ ← Tabs
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  Round of 16          Quarter-Finals         Semi-Finals          Final       │
│                                                                                │
│  ┌─────────┐                                                                  │
│  │ NED 3-1 │──┐                                                               │
│  └─────────┘  │  ┌─────────┐                                                  │
│               ├──│ NED 2-2 │──┐                                               │
│  ┌─────────┐  │  │ (4-3p)  │  │                                               │
│  │ USA 3-1 │──┘  └─────────┘  │  ┌─────────┐                                 │
│  └─────────┘                  ├──│ ARG 3-0 │──┐                               │
│                               │  └─────────┘  │                               │
│  ┌─────────┐                  │               │  ┌─────────┐                  │
│  │ ARG 2-1 │──┐               │               ├──│ ARG 3-3 │                  │
│  └─────────┘  │  ┌─────────┐  │               │  │ (4-2p)  │                  │
│               ├──│ ARG 2-1 │──┘               │  └─────────┘ 🏆 CHAMPION     │
│  ┌─────────┐  │  └─────────┘                  │                               │
│  │ AUS 2-1 │──┘                               │                               │
│  └─────────┘                                  │                               │
│                                               │                               │
│  ┌─────────┐                                  │                               │
│  │ FRA 3-1 │──┐                               │                               │
│  └─────────┘  │  ┌─────────┐                  │                               │
│               ├──│ FRA 2-1 │──┐               │                               │
│  ┌─────────┐  │  └─────────┘  │  ┌─────────┐ │                               │
│  │ POL 1-3 │──┘               ├──│ FRA 2-0 │─┘                               │
│  └─────────┘                  │  └─────────┘                                  │
│                               │                                               │
│  ┌─────────┐                  │                                               │
│  │ ENG 3-0 │──┐               │                                               │
│  └─────────┘  │  ┌─────────┐  │                                               │
│               ├──│ ENG 1-2 │──┘                                               │
│  ┌─────────┐  │  └─────────┘                                                  │
│  │ SEN 0-3 │──┘                                                               │
│  └─────────┘                                                                  │
│                                                                                │
│  [Scroll horizontally for more →]                                             │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
```

**Component States:**
- **Loading:** Show skeleton loaders for cards
- **Empty:** "No games available yet" message
- **Collapsed (mobile):** Only show group letter header
- **Expanded (mobile):** Show full games list + table
- **Desktop:** All cards expanded by default

**Responsive Considerations:**
- Mobile (xs): 1 card per row, collapsible accordion style
- Tablet (sm-md): 2 cards per row
- Desktop (lg+): 3 cards per row
- Bracket: Horizontally scrollable on all screen sizes, optimized for desktop

## Technical Approach

### 1. Route Structure

Create new page route:
- **Path:** `/app/tournaments/[id]/results/page.tsx`
- **Type:** Server Component (for data fetching)
- **Layout:** Uses existing `/app/tournaments/[id]/layout.tsx` (with header and bottom nav)

### 2. Navigation Updates

#### Mobile Bottom Navigation
**File:** `app/components/tournament-bottom-nav/tournament-bottom-nav.tsx`
- Add new tab: `value="results"` with icon `<Assessment />` (from `@mui/icons-material`)
- Update `useEffect` to handle `/tournaments/${tournamentId}/results` path
- Update `handleChange` to navigate to results page
- Current tabs: Home, Tournament, Friend Groups, Stats → Add "Results" between Tournament and Friend Groups

#### Desktop Navigation
**File:** `app/components/tournament-page/group-standings-sidebar.tsx`
- Add "Ver Resultados" link in the GroupStandingsSidebar component (existing sidebar on desktop)
- Link appears below or above the group standings accordion
- Format: Link/Button with `Assessment` icon → navigates to `/tournaments/[id]/results`
- User will optimize desktop navigation later (mobile is priority)

**Decision:** Link in existing sidebar component, not in main AppBar. Simple and contextual.

### 3. Data Fetching Strategy

**Server Component** fetches all data in parallel with error handling:

```typescript
// app/tournaments/[id]/results/page.tsx
const [
  groups,
  allGames,
  teamsMap,
  groupStandings,
  playoffStages
] = await Promise.all([
  findGroupsInTournament(tournamentId),
  getAllTournamentGames(tournamentId),
  getTeamsMap(tournamentId),
  getGroupStandingsForTournament(tournamentId),
  findPlayoffStagesWithGamesInTournament(tournamentId)
])

// Filter to only finished games (have scores)
const finishedGames = allGames.filter(game =>
  game.home_team_score !== null &&
  game.away_team_score !== null &&
  game.game_date < new Date() // Game has been played
)

// Handle empty data cases
if (!groups || groups.length === 0) {
  // Show "No groups configured" empty state
}
if (!playoffStages || playoffStages.length === 0) {
  // Show "Playoffs haven't started" empty state
}
```

**Error Handling:**
- If repository functions fail → catch and show error boundary
- If tournament not found → redirect to 404
- If no finished games → show "No results available yet" message

**Reuse existing functions:**
- `findGroupsInTournament()` - from `app/db/tournament-group-repository.ts`
- `getAllTournamentGames()` - from `app/db/game-repository.ts`
- `getTeamsMap()` - from `app/actions/tournament-actions.ts`
- `getGroupStandingsForTournament()` - from `app/actions/tournament-actions.ts`
- `findPlayoffStagesWithGamesInTournament()` - from `app/db/tournament-playoff-repository.ts`

### 4. Component Architecture

```
app/tournaments/[id]/results/page.tsx (Server Component)
└── ResultsPageClient (Client Component)
    ├── Tabs (MUI) - "Groups" / "Playoffs"
    ├── GroupsStageView (Groups tab content)
    │   └── Grid of GroupResultCard components
    │       └── GroupResultCard (per group)
    │           ├── Accordion (MUI) - collapsible on mobile
    │           ├── MinimalisticGamesList
    │           └── CompactGroupTable (reuse TeamStandingsCards)
    └── PlayoffsBracketView (Playoffs tab content)
        └── BracketDiagram
            └── BracketRound (per round)
                └── BracketGameCard (minimalistic)
```

### 5. New Components to Create

#### 5.1. Server Component - Main Page
**File:** `app/tournaments/[id]/results/page.tsx`
- Fetch all data (groups, games, teams, standings, playoffs)
- Pass data to `ResultsPageClient`

#### 5.2. Client Component - Page Container
**File:** `app/components/results-page/results-page-client.tsx`
- State: `selectedTab` (0=Groups, 1=Playoffs)
- Renders MUI `Tabs` for sub-navigation
- Conditionally renders `GroupsStageView` or `PlayoffsBracketView`

#### 5.3. Groups Stage View
**File:** `app/components/results-page/groups-stage-view.tsx`
- Props: `groups`, `groupStandings`, `games`, `teamsMap`
- Renders responsive grid (1/2/3 columns)
- Maps over groups, renders `GroupResultCard` for each

#### 5.4. Group Result Card
**File:** `app/components/results-page/group-result-card.tsx`
- Props: `group`, `games[]`, `standings`, `teamsMap`, `defaultExpanded`
- Uses MUI `Accordion` (collapsed on mobile by default)
- **Header:** `AccordionSummary` with group letter (e.g., "GRUPO A")
- **Content:** `AccordionDetails` with:
  - `MinimalisticGamesList` - shows game results
  - `CompactGroupTable` - reuse existing `TeamStandingsCards` component

#### 5.5. Minimalistic Games List
**File:** `app/components/results-page/minimalistic-games-list.tsx`
- Props: `games[]`, `teamsMap`
- Simple list of game results (no interaction)
- Format: `🇶🇦 Qatar 0 - 2 Ecuador 🇪🇨`
- Sort by game_number ascending
- Show only finished games (have scores)
- **Penalty shootouts:** Use utility function `formatPenaltyResult(game)` → returns `"(4-3p)"` or `null`

#### 5.5a. Penalty Result Formatter (NEW UTILITY)
**File:** `app/utils/penalty-result-formatter.ts`
```typescript
export function formatPenaltyResult(game: ExtendedGameData): string | null {
  if (!game.penalty_home_score || !game.penalty_away_score) {
    return null;
  }
  return `(${game.penalty_home_score}-${game.penalty_away_score}p)`;
}

export function formatGameScore(game: ExtendedGameData): string {
  const regularScore = `${game.home_team_score} - ${game.away_team_score}`;
  const penaltyResult = formatPenaltyResult(game);
  return penaltyResult ? `${regularScore} ${penaltyResult}` : regularScore;
}
```
- Handles edge case: penalties exist but scores don't (shouldn't happen, but defensive)
- Reusable across MinimalisticGamesList and BracketGameCard

#### 5.6. Playoffs Bracket View
**File:** `app/components/results-page/playoffs-bracket-view.tsx`
- Props: `playoffStages[]`, `games`, `teamsMap`
- Renders traditional bracket diagram
- Horizontally scrollable container (Box with overflow-x)
- Organizes rounds: Round of 16, Quarter-Finals, Semi-Finals, Final, Third Place
- Uses CSS Grid or Flexbox for bracket layout
- Connects games with visual lines (borders/pseudo-elements)

#### 5.7. Bracket Game Card
**File:** `app/components/results-page/bracket-game-card.tsx`
- Props: `game`, `teamsMap`
- Minimalistic game card for bracket
- Format:
  ```
  ┌───────────┐
  │ NED  3    │
  │ USA  1    │
  └───────────┘
  ```
- Show team codes (3-letter) + scores
- Highlight winner (bold or color)
- Show penalty result if applicable: `(4-3p)`
- No click interaction (read-only)

### 6. Reusable Components

**Already exist, will reuse:**
- `TeamStandingsCards` - for compact group standings
  - File: `app/components/groups-page/team-standings-cards.tsx`
  - Props: `teamStats`, `teamsMap`, `qualifiedTeams`, `compact`
  - Set `compact={true}` for ultra-compact display

**Material-UI components:**
- `Accordion`, `AccordionSummary`, `AccordionDetails` - for collapsible group cards
- `Tabs`, `Tab` - for Groups/Playoffs navigation
- `Grid` (Grid2) - for responsive card layout
- `Box`, `Typography`, `Paper` - for layout and styling
- Icons: `Assessment` (Results tab), `ExpandMore` (accordion), `EmojiEvents` (groups), `AccountTree` (playoffs)

### 7. Styling Approach

**Responsive Breakpoints (Explicit MUI Grid2 Configuration):**
- xs (0-600px): `size={{ xs: 12 }}` - 1 card per row, fully collapsible
- sm (600-900px): `size={{ xs: 12, sm: 6 }}` - 2 cards per row
- md+ (900px+): `size={{ xs: 12, sm: 6, md: 4 }}` - 3 cards per row
- Minimum card width: 280px (ensures text readability)
- Gap between cards: `spacing={2}` (16px)

**Group Card Styling:**
```typescript
<Paper elevation={2} sx={{
  mb: 2, // margin between cards
  '& .MuiAccordionSummary-root': {
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.contrastText
  }
}}>
```

**Bracket Styling:**
```typescript
<Box sx={{
  overflowX: 'auto',
  overflowY: 'hidden',
  display: 'flex',
  gap: 4, // space between rounds
  minHeight: '600px',
  p: 3
}}>
  {/* Rounds */}
</Box>
```

**Bracket Connections:**
- Use CSS borders and pseudo-elements (::before, ::after) to draw lines
- Alternative: SVG overlay (more complex but cleaner)
- Recommendation: Start with CSS borders, iterate to SVG if needed

### 8. Bracket Layout Algorithm (DETAILED IMPLEMENTATION)

**Challenge:** Position games in bracket to show progression visually with connection lines

**Primary Approach: SVG Overlay (Recommended)**

SVG is cleaner and more maintainable than CSS pseudo-elements for bracket connections.

**Implementation Details:**

```typescript
// app/components/results-page/bracket-layout-utils.ts

export interface BracketRound {
  name: string;
  games: ExtendedGameData[];
  columnIndex: number;
}

export interface GamePosition {
  gameId: string;
  x: number;
  y: number;
  roundIndex: number;
  gameIndexInRound: number;
}

export const BRACKET_CONSTANTS = {
  GAME_CARD_HEIGHT: 80, // px
  GAME_CARD_WIDTH: 200, // px
  ROUND_SPACING: 300, // horizontal space between rounds
  BASE_VERTICAL_SPACING: 120, // minimum vertical space between games
  MOBILE_SCALE: 0.7, // scale factor for mobile
};

/**
 * Calculate vertical spacing for a round based on number of games
 * Games double in spacing each round to create visual convergence
 */
export function calculateRoundSpacing(gamesInRound: number): number {
  const { BASE_VERTICAL_SPACING, GAME_CARD_HEIGHT } = BRACKET_CONSTANTS;

  // Each subsequent round has 2x spacing (visual convergence)
  // Round of 16: 120px between games
  // Quarters: 240px + 80px (card height) = 320px
  // Semis: 640px
  // Final: centered

  return BASE_VERTICAL_SPACING * (16 / gamesInRound) + GAME_CARD_HEIGHT;
}

/**
 * Calculate absolute position for each game in the bracket
 */
export function calculateGamePositions(rounds: BracketRound[]): GamePosition[] {
  const positions: GamePosition[] = [];
  const { ROUND_SPACING, GAME_CARD_HEIGHT } = BRACKET_CONSTANTS;

  rounds.forEach((round, roundIndex) => {
    const spacing = calculateRoundSpacing(round.games.length);
    const x = roundIndex * ROUND_SPACING;

    round.games.forEach((game, gameIndex) => {
      const y = gameIndex * spacing;

      positions.push({
        gameId: game.id,
        x,
        y,
        roundIndex,
        gameIndexInRound: gameIndex,
      });
    });
  });

  return positions;
}

/**
 * Calculate SVG path for connection lines between rounds
 */
export function calculateConnectionPath(
  fromPosition: GamePosition,
  toPosition: GamePosition
): string {
  const { GAME_CARD_HEIGHT, GAME_CARD_WIDTH } = BRACKET_CONSTANTS;

  // Start from right-center of "from" card
  const x1 = fromPosition.x + GAME_CARD_WIDTH;
  const y1 = fromPosition.y + GAME_CARD_HEIGHT / 2;

  // End at left-center of "to" card
  const x2 = toPosition.x;
  const y2 = toPosition.y + GAME_CARD_HEIGHT / 2;

  // Midpoint for vertical line
  const midX = (x1 + x2) / 2;

  // SVG path: horizontal → vertical → horizontal
  return `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
}
```

**Bracket Component Structure:**

```tsx
// playoffs-bracket-view.tsx
<Box sx={{ position: 'relative', overflowX: 'auto', minHeight: '800px' }}>
  {/* SVG layer for connection lines */}
  <svg
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 0,
    }}
  >
    {connectionPaths.map((path, idx) => (
      <path
        key={idx}
        d={path}
        stroke="currentColor"
        strokeWidth={2}
        fill="none"
        opacity={0.3}
      />
    ))}
  </svg>

  {/* Game cards layer */}
  <Box sx={{ position: 'relative', zIndex: 1 }}>
    {gamePositions.map((pos) => (
      <Box
        key={pos.gameId}
        sx={{
          position: 'absolute',
          left: pos.x,
          top: pos.y,
        }}
      >
        <BracketGameCard game={getGameById(pos.gameId)} teamsMap={teamsMap} />
      </Box>
    ))}
  </Box>
</Box>
```

**Mobile Responsiveness:**
- Apply `MOBILE_SCALE` (0.7x) to all dimensions on screens < 600px
- Bracket width: `numRounds * (GAME_CARD_WIDTH * 0.7) + ROUND_SPACING * 0.7 * (numRounds - 1)`
- Minimum scroll width ensures all rounds visible (horizontally scrollable)
- On very narrow screens (< 350px), bracket still scrolls - partial visibility is acceptable
- Touch-scroll optimized (momentum scrolling enabled)
- SVG viewBox scales dynamically: `viewBox="0 0 ${totalWidth} ${totalHeight}"`

**Third Place Playoff:**
- Positioned separately below semifinals bracket
- Not connected to main bracket tree (doesn't fit single-elimination structure)
- Shown as standalone card with label "3rd Place"

### 9. Files to Create/Modify

#### New Files (8 components + 2 utilities)
1. `app/tournaments/[id]/results/page.tsx` - Server component, main page
2. `app/components/results-page/results-page-client.tsx` - Client wrapper with tabs
3. `app/components/results-page/groups-stage-view.tsx` - Groups grid layout
4. `app/components/results-page/group-result-card.tsx` - Individual group card
5. `app/components/results-page/minimalistic-games-list.tsx` - Simple games list
6. `app/components/results-page/playoffs-bracket-view.tsx` - Bracket diagram
7. `app/components/results-page/bracket-game-card.tsx` - Minimalistic game card
8. `app/components/results-page/loading-skeleton.tsx` - Skeleton loader for cards
9. `app/components/results-page/bracket-layout-utils.ts` - Helper for bracket positioning (SVG paths)
10. `app/utils/penalty-result-formatter.ts` - Utility for penalty shootout formatting

#### Modified Files (2 navigation files)
1. `app/components/tournament-bottom-nav/tournament-bottom-nav.tsx` - Add "Results" tab
2. `app/components/tournament-page/group-standings-sidebar.tsx` - Add "Ver Resultados" link

#### Test Files (9 tests: 7 component + 2 utility tests)
1. `__tests__/tournaments/[id]/results.page.test.tsx`
2. `__tests__/components/results-page/results-page-client.test.tsx`
3. `__tests__/components/results-page/groups-stage-view.test.tsx`
4. `__tests__/components/results-page/group-result-card.test.tsx`
5. `__tests__/components/results-page/minimalistic-games-list.test.tsx`
6. `__tests__/components/results-page/playoffs-bracket-view.test.tsx`
7. `__tests__/components/results-page/bracket-game-card.test.tsx`
8. `__tests__/utils/penalty-result-formatter.test.ts` - Test penalty formatting utility
9. `__tests__/components/results-page/bracket-layout-utils.test.ts` - Test positioning calculations

### 10. Implementation Steps

#### Phase 1: Setup & Navigation (Foundation)
1. **Verify TeamStandingsCards API** - Read component, confirm props match plan assumptions
2. Create new route: `app/tournaments/[id]/results/page.tsx` (empty shell with basic data fetching)
3. Update mobile bottom nav: add "Results" tab
4. Update desktop sidebar: add "Ver Resultados" link in GroupStandingsSidebar
5. Test navigation: clicking "Results" navigates to new page from both mobile and desktop

#### Phase 2: Groups Stage View (Core Feature)
4. Create `GroupsStageView` component with responsive grid
5. Create `GroupResultCard` component with accordion
6. Create `MinimalisticGamesList` component
7. Wire up data fetching in page.tsx for groups
8. Test: Groups stage view shows all groups with games and standings

#### Phase 3: Playoffs Bracket (Advanced)
9. Create `PlayoffsBracketView` component with horizontal scroll
10. Create `BracketGameCard` minimalistic component
11. Implement bracket layout algorithm (positioning + connections)
12. Wire up playoff data fetching
13. Test: Bracket displays correctly on desktop and mobile

#### Phase 4: Tabs & Integration
14. Create `ResultsPageClient` with MUI Tabs
15. Integrate GroupsStageView and PlayoffsBracketView
16. Default tab: Groups
17. Test: Tabs switch between Groups and Playoffs

#### Phase 5: Polish & Responsive
18. Create `LoadingSkeleton` component for card placeholders
19. Add loading states to page (show skeletons while data fetches)
20. Add empty states with specific conditions:
    - No groups: "No hay grupos configurados"
    - No playoffs: "Los playoffs aún no comenzaron"
    - No finished games (but tournament started): "No hay resultados disponibles todavía"
    - Tournament upcoming (all games in future): "Resultados disponibles a partir del [tournament_start_date]"
21. Refine mobile collapsible behavior (default collapsed, smooth animation)
22. Refine desktop layout (3 columns, proper spacing)
23. Test responsive behavior across breakpoints (xs, sm, md, lg)

#### Phase 6: Testing & Validation
23. Write unit tests for all components
24. Write integration test for page
25. Manual testing: mobile, tablet, desktop
26. Test with tournaments that have:
    - Only groups (no playoffs)
    - Only playoffs (no groups)
    - Both groups and playoffs
    - No games at all

### 11. Edge Cases & Considerations

**Edge Cases:**
1. **Tournament with no games yet** → Show empty state
2. **Tournament with only groups (no playoffs)** → Hide Playoffs tab or show empty state
3. **Tournament with only playoffs (no groups)** → Hide Groups tab
4. **Games without scores (future games)** → Don't show in results (filter by game_date < now && scores exist)
5. **Third place playoff** → Show separately in bracket (below semis)
6. **Penalty shootouts** → Show penalty result: `(4-3p)`
7. **Mobile landscape mode** → Bracket should still be scrollable
8. **Groups with different number of teams** → Group table adapts automatically (using TeamStandingsCards)

**Performance:**
- Use React.memo() for `GroupResultCard` (many cards on page)
- Use virtualization if >20 groups (unlikely, but future-proof)
- Lazy load bracket view (code-split)

**Accessibility:**
- Accordion keyboard navigation (ARIA labels)
- Bracket game cards: announce scores for screen readers
- Tab navigation: proper ARIA roles
- Mobile: touch-friendly targets (min 44x44px)

**Internationalization:**
- Tab labels: "Grupos" / "Playoffs" (check if i18n is set up)
- Group card headers: "GRUPO A" (already in Spanish)
- Empty states: Spanish messages

### 12. Testing Strategy

**Unit Tests (Vitest + React Testing Library):**

1. **GroupResultCard:**
   - Renders group letter in header
   - Shows correct number of games
   - Shows group standings table
   - Accordion expands/collapses on click (mobile)
   - Default expanded on desktop

2. **MinimalisticGamesList:**
   - Renders all games for a group
   - Shows team names and scores correctly
   - Handles games without scores (shouldn't render)
   - Sorts by game_number

3. **PlayoffsBracketView:**
   - Renders all playoff rounds
   - Games positioned correctly in bracket
   - Horizontally scrollable
   - Connection lines drawn between games (visual regression test)

4. **BracketGameCard:**
   - Shows team codes and scores
   - Highlights winner
   - Shows penalty result if applicable
   - Read-only (no click handlers)

5. **ResultsPageClient:**
   - Renders tabs: Groups and Playoffs
   - Default tab is Groups
   - Clicking Playoffs tab switches view
   - Tab state persists during session (optional)

6. **Page Integration Test:**
   - Fetches data correctly (mock repository functions)
   - Passes data to client component
   - Shows loading state (skeleton)
   - Shows empty state if no data

7. **penalty-result-formatter utility:**
   - Returns null when no penalties
   - Returns "(4-3p)" format when penalties exist
   - Handles penalty_score=0 correctly (e.g., "(5-0p)")
   - formatGameScore() combines regular and penalty scores

8. **bracket-layout-utils:**
   - calculateRoundSpacing() returns correct spacing for 16/8/4/2/1 games
   - calculateGamePositions() positions games with correct x,y coordinates
   - calculateConnectionPath() generates valid SVG path strings
   - Mobile scaling applies MOBILE_SCALE correctly

**Test Utilities to Use:**
- `renderWithTheme()` - from `__tests__/utils/test-utils.tsx`
- `testFactories` - from `__tests__/db/test-factories.ts` (for mock games, teams)
- Mock Next.js router - from `__tests__/mocks/next-navigation.mocks.ts`

**Coverage Target:**
- 80% coverage on all new components (SonarCloud requirement)
- Edge cases: empty states, future games, penalty shootouts

### 13. Open Questions & Decisions Needed

1. **Desktop Navigation:** Where should the "Results" link appear on desktop?
   - Option A: Add link in AppBar next to tournament logo
   - Option B: Add to GroupSelector dropdown
   - Option C: Create new horizontal nav below AppBar
   - **Recommendation:** Option A (simple, visible, consistent with mobile bottom nav)

2. **Default Tab:** Should it be Groups or Playoffs?
   - **Recommendation:** Groups (most common use case)

3. **Bracket Library:** Use external library or build from scratch?
   - **Recommendation:** Build from scratch (more control, simpler for MVP)
   - Can iterate to library later if needed

4. **Third Place Playoff:** Show in bracket or separately?
   - **Recommendation:** Show separately below bracket (doesn't fit in tree structure)

5. **Icons:** Which icons for tabs and navigation?
   - Results nav: `Assessment` or `TableChart`?
   - Groups tab: `EmojiEvents` or `Group`?
   - Playoffs tab: `AccountTree` or `EmojiEvents`?
   - **Recommendation:**
     - Results nav: `Assessment` (matches "results" concept)
     - Groups tab: `EmojiEvents` (trophy, tournament feel)
     - Playoffs tab: `AccountTree` (tree structure, bracket feel)

### 14. Validation & Quality Gates

**Pre-commit validation (MANDATORY):**
- ✅ `npm run test` - all tests pass
- ✅ `npm run lint` - no linting errors
- ✅ `npm run build` - builds successfully

**SonarCloud requirements:**
- ✅ 80% coverage on new code
- ✅ 0 new issues (any severity)
- ✅ Security rating: A
- ✅ Maintainability: B or higher

**Manual validation:**
- ✅ Mobile: Navigation works, cards collapsible
- ✅ Tablet: 2 cards per row
- ✅ Desktop: 3 cards per row, bracket scrolls horizontally
- ✅ Empty states: Show when no data
- ✅ Loading states: Show skeleton loaders
- ✅ Bracket: Connections drawn correctly (visual check)

**User acceptance:**
- ✅ User can navigate to Results page from mobile and desktop
- ✅ Groups stage shows all groups with games and standings
- ✅ Playoffs bracket shows traditional bracket diagram
- ✅ All views are read-only (no interaction)
- ✅ Minimalistic design (clean, fast, easy to scan)

## Summary

This plan delivers a new **Results & Tables** feature with:
- Clean navigation integration (mobile + desktop)
- Two sub-views: Groups Stage (grid of cards) + Playoffs (bracket diagram)
- Read-only, minimalistic design focused on results viewing
- Responsive layout optimized for all screen sizes
- Reuses existing components and data fetching utilities
- Comprehensive testing (80% coverage)
- Full SonarCloud compliance

**Next Steps:**
1. User reviews plan and approves
2. Clarify open questions (desktop nav placement)
3. Execute implementation in phases
4. Deploy to Vercel Preview for testing
5. Final SonarCloud validation
6. Merge to main

**Estimated Complexity:** Medium-High
- Groups view: Straightforward (reuse existing components)
- Bracket view: Complex (positioning, connections, responsiveness)
- Testing: Standard (7 components, comprehensive test suites)

**Dependencies:**
- No external libraries needed
- Uses existing MUI components
- Reuses TeamStandingsCards for group tables
- Standard Next.js 15 patterns (Server Components, parallel data fetching)
