# Implementation Plan: Story #221 - Decouple CompactPredictionDashboard from GuessesContext

## Context

**IMPORTANT:** This is a **data flow refactoring only** - no UI changes, no visual changes, no user-facing behavior changes. Only changes to how data is fetched, calculated, and passed to the dashboard component.

The `CompactPredictionDashboard` component is currently tightly coupled with `GuessesContext`, which causes several issues:

**Problems:**
1. **Not reactive to data changes** - Component relies on context that may not update when underlying data changes (e.g., Awards/Qualified Teams pages manage their own state separately)
2. **Inconsistent behavior across pages:**
   - Home Page calculates `predictedGames` correctly (both scores filled)
   - Awards/Qualified Teams pass `gameGuessesArray.length` (counts ALL guesses, not just complete ones)
3. **Performance issues** - Awards/Qualified Teams fetch ALL games and guesses just for urgency calculation
4. **Violates separation of concerns** - Mixes presentation logic with data fetching

**Why this refactoring is needed:**
- Each page manages LOCAL STATE for prediction types it allows users to edit (games, qualified teams, awards)
- Dashboard should reactively display current state of parent component
- Repository should provide comprehensive baseline data
- Each parent should override repository data with calculated values from their managed state

**Desired outcome:**
- `CompactPredictionDashboard` becomes a pure presentation component
- Receives all data as flat, destructured props
- No context dependencies
- Each parent component calculates metrics for prediction types it manages
- Repository provides comprehensive baseline for all dashboard metrics

---

## Story Details

**Issue:** #221 - [Refactor] Decouple CompactPredictionDashboard from GuessesContext
**Epic:** UX Audit 2026
**Priority:** Medium (refactoring for maintainability and correctness)

---

## Acceptance Criteria

### Component Refactoring
- [ ] `CompactPredictionDashboard` has no context dependencies (no `useContext` calls)
- [ ] `CompactPredictionDashboard` receives all data as flat, individual props
- [ ] `CompactPredictionDashboard` performs no calculations, pure presentation

### Repository
- [ ] Repository returns only **complete** game predictions (both scores filled)
- [ ] Repository returns boost usage counts (silver/golden)
- [ ] Repository returns urgent games as targeted subset (not all games)
- [ ] Repository returns count, games array, and guesses for urgent games

### Override Pattern (Critical)
- [ ] Home Page calculates game/boost metrics from context, overrides repository baseline
- [ ] Home Page calculates urgent games from existing in-memory data
- [ ] Qualified Teams Page calculates qualified teams count from managed state, overrides repository baseline
- [ ] Awards Page calculates awards/honor roll from managed state, overrides repository baseline
- [ ] Each page uses repository data as-is for prediction types it doesn't manage

### Functionality
- [ ] All three pages display correct, consistent data in dashboard
- [ ] Dashboard updates reactively when parent component state changes
- [ ] Urgent games popover shows correct games on all three pages
- [ ] No performance regression (Awards/Qualified Teams don't fetch all games)

### Cleanup
- [ ] Investigate and handle old `PredictionDashboard` component (still used by TabbedPlayoffsPage)
- [ ] All existing tests pass
- [ ] New tests cover refactored components and override pattern
- [ ] 80% coverage on new/modified code

---

## Technical Approach

### Architecture: Override Pattern

Each page follows this pattern:

```
1. Server Component (Page)
   ↓
   Fetches BASELINE from repository
   ↓
   Passes relevant subset to Client Component

2. Client Component (Parent)
   ↓
   Receives baseline data from server
   ↓
   Manages LOCAL STATE for its prediction types
   ↓
   CALCULATES completions from local state
   ↓
   OVERRIDES repository data with calculated values
   ↓
   Passes FINAL values to Dashboard

3. Dashboard Component
   ↓
   Pure presentation based on props
```

### Page Responsibilities

**Home Page (UnifiedGamesPageClient):**
- **Manages:** Game predictions, boost selections (via GuessesContext)
- **Calculates from context:** Game completion count, boost usage counts, urgent games count
- **Uses from repository:** Tournament predictions (awards, qualified teams, honor roll)
- **Override:** Replaces repository's game/boost/urgent data with calculated values

**Qualified Teams Page (QualifiedTeamsClientPage):**
- **Manages:** Qualified team selections (via local predictions state)
- **Calculates from state:** Qualified teams completion count
- **Uses from repository:** Games, boosts, urgent games, tournament predictions (awards, honor roll)
- **Override:** Replaces repository's qualified teams count with calculated value

**Awards Page (AwardsPanel):**
- **Manages:** Final standings, individual awards (via local tournamentGuesses state)
- **Calculates from state:** Honor roll completion, individual awards completion
- **Uses from repository:** Games, boosts, qualified teams, urgent games
- **Override:** Replaces repository's honor roll and awards data with calculated values

---

## Implementation Steps

### Phase 1: Repository Extension

**File:** `app/db/tournament-prediction-completion-repository.ts`

**Extend `getTournamentPredictionCompletion` function to return:**

1. **Complete game predictions count:**
   - Filter `game_guesses` where `home_score IS NOT NULL AND away_score IS NOT NULL`
   - Return count as `completedGames`

2. **Boost usage counts:**
   - Count `game_guesses` where `boost_type = 'silver'` → `silverBoostsUsed`
   - Count `game_guesses` where `boost_type = 'golden'` → `goldenBoostsUsed`

3. **Urgent games data (new query):**
   - **Query logic:** Games where `game_date <= NOW() + INTERVAL '48 hours'` AND `game_date > NOW()`
   - **Timezone handling:** Database stores `game_date` in UTC, use `NOW()` for UTC comparison
   - **Incomplete definition:** Guess is null OR (`home_score IS NULL` OR `away_score IS NULL`)
     - Both scores null = no prediction
     - One score null = incomplete prediction
     - Both scores filled = complete (excluded from urgent)
   - **Join pattern:** LEFT JOIN with user's `game_guesses` to include unpredicted games
   - Return:
     - `urgentGamesCount`: Number of urgent incomplete games
     - `urgentGames`: Array of ExtendedGameData for those games (sorted by game_date ASC)
     - `urgentGameGuesses`: Map of game_id → GameGuess for user's guesses (empty object if no guess)

**Return type update:**
```typescript
interface TournamentPredictionCompletion {
  // Existing fields (keep all)
  finalStandings: {...}
  awards: {...}
  qualifiers: {...}
  overallCompleted: number
  overallTotal: number
  overallPercentage: number
  isPredictionLocked: boolean

  // New fields
  completedGames: number           // Games with both scores filled
  totalGames: number               // Total tournament games
  silverBoostsUsed: number         // Silver boosts currently used
  goldenBoostsUsed: number         // Golden boosts currently used
  silverBoostsMax: number          // From tournament.max_silver_games (0 if null)
  goldenBoostsMax: number          // From tournament.max_golden_games (0 if null)
  urgentGames: ExtendedGameData[]  // Games closing in 48hrs (incomplete), sorted by game_date
  urgentGameGuesses: Record<string, GameGuessNew> // User's guesses for urgent games (empty {} if none)

  // Note: urgentGamesCount removed (redundant - use urgentGames.length instead)
}
```

**Performance consideration:** Urgent games query is a targeted subset (48hr window), not all tournament games.

---

### Phase 2: CompactPredictionDashboard Refactoring

**File:** `app/components/compact-prediction-dashboard.tsx`

**Remove:**
- All `useContext(GuessesContext)` calls (line 44)
- Internal urgency calculations using context data (lines 52-110)
- Dependency on `GuessesContextProvider`

**New props interface:**
```typescript
interface CompactPredictionDashboardProps {
  // Game predictions
  readonly totalGames: number
  readonly predictedGames: number

  // Boosts (flattened from nested structure)
  readonly silverBoostsUsed: number
  readonly silverBoostsMax: number
  readonly goldenBoostsUsed: number
  readonly goldenBoostsMax: number

  // Tournament predictions (flattened)
  readonly finalStandingsCompleted: number
  readonly finalStandingsTotal: number
  readonly individualAwardsCompleted: number
  readonly individualAwardsTotal: number
  readonly qualifiedTeamsCompleted: number
  readonly qualifiedTeamsTotal: number

  // Urgent games data (for popover)
  readonly urgentGames: ExtendedGameData[]
  readonly urgentGameGuesses: Record<string, GameGuessNew>

  // Supporting data
  readonly tournamentId: string
  readonly tournamentStartDate?: Date
  readonly teamsMap: Record<string, Team>
  readonly demoMode?: boolean
  readonly isPredictionLocked: boolean

  // Note: isPlayoffs prop removed (unused - verified in urgency-accordion-group.tsx line 27)
}
```

**Changes:**
- Remove nested `tournamentPredictions` object, flatten all values
- Receive boost data as individual props (not from context)
- **Calculate urgency levels internally** using existing helper functions from `app/components/urgency-helpers.tsx`
  - `getGameUrgencyLevel(urgentGames, urgentGameGuesses)` - pure function, can calculate in component
  - `getTournamentUrgencyLevel(tournamentPredictions, tournamentStartDate)` - pure function, can calculate in component
  - Helpers only depend on data already received as props
- Receive urgent games data for popover

**Child components:**
- `PredictionProgressRow`: No changes needed (already receives individual props)
- `GameDetailsPopover`:
  - Remove `games` prop (received all tournament games)
  - Add `urgentGames` prop (only games in 48hr window)
  - Add `urgentGameGuesses` prop (map for those specific games)
  - Logic change: Only render urgent games (no filtering needed, already filtered)
  - Grouping logic remains same (urgent/warning/notice by deadline)
- `TournamentDetailsPopover`:
  - Remove `tournamentPredictions` object prop
  - Add individual props: `finalStandingsCompleted/Total`, `individualAwardsCompleted/Total`, `qualifiedTeamsCompleted/Total`
  - Update accordion rendering to use flattened values
- `BoostInfoPopover`:
  - Already receives `boostType`, `used`, `max` as individual props
  - No changes needed (doesn't access context)

**Component remains:**
- Client component (needs interactivity for popovers)
- Responsible only for rendering UI
- No data fetching or calculation logic

**Props interface note:**
- Interface reduced to ~15 individual props (urgency levels removed, urgentGamesCount removed)
- **Urgency calculation:** Component calculates internally using pure helper functions
  - Receives: urgentGames, urgentGameGuesses, tournamentStartDate, isPredictionLocked
  - Calculates: gameUrgencyLevel, tournamentUrgencyLevel
  - Helpers are pure functions with no side effects
- **Alternative considered:** Group related props into objects (gameMetrics, boosts, tournaments)
- **Decision:** Keep flat props for Phase 1 implementation
  - Easier to pass individual calculated values from parent
  - Clear which values parent must provide
  - Can refactor to grouped props later if duplication becomes issue

---

### Phase 3: Home Page (UnifiedGamesPageClient) Update

**Files:**
- Server: `app/components/unified-games-page.tsx` (if it exists, otherwise inline in page)
- Client: `app/components/unified-games-page-client.tsx`

**Server Component responsibilities:**
- Call `getTournamentPredictionCompletion` to get baseline
- Pass to client: tournament predictions only (awards, qualified teams, honor roll)
- Pass null for game/boost metrics (client will calculate from context)

**Client Component changes:**

1. **Keep GuessesContextProvider** (still needed for game prediction management)

2. **Calculate from GuessesContext:**
   - `predictedGames`: Count games where `gameGuesses[game.id]` has both scores filled
   - `silverBoostsUsed`, `goldenBoostsUsed`: From `boostCounts` in context
   - `urgentGames`: Filter `games` for closing within 48hrs and incomplete/unpredicted
   - `urgentGameGuesses`: Map of guesses for those urgent games only

3. **Dashboard calculates urgency levels internally:**
   - No need to pre-calculate urgency in parent
   - Dashboard uses `getGameUrgencyLevel(urgentGames, urgentGameGuesses)` helper
   - Dashboard uses `getTournamentUrgencyLevel(tournamentPredictions, tournamentStartDate)` helper
   - Helpers are pure functions, no side effects

4. **Flatten and pass to dashboard:**
   - Extract final standings values from `tournamentPredictions.finalStandings`
   - Extract awards values from `tournamentPredictions.awards`
   - Extract qualifiers values from `tournamentPredictions.qualifiers`
   - Pass all boost maximums from tournament object
   - Pass all urgency data

**Override pattern:**
- Repository provides tournament predictions baseline
- Client calculates game/boost metrics from live context
- Client merges and passes final values

---

### Phase 4: Qualified Teams Page Update

**Files:**
- Server: `app/[locale]/tournaments/[id]/qualified-teams/page.tsx`
- Client: `app/components/qualified-teams/qualified-teams-client-page.tsx`

**Server Component changes:**

1. **Fetch comprehensive baseline:**
   - Call `getTournamentPredictionCompletion` to get complete dashboard data
   - Includes: games, boosts, urgent games, tournament predictions

2. **Pass to client:**
   - All baseline metrics from repository
   - Client will override qualified teams portion

**Client Component changes:**

1. **Calculate from local state:**
   - Access `predictions` from `useQualifiedTeamsContext()`
   - `qualifiedTeamsCompleted`: Count DISTINCT teams where `predicted_to_qualify === true`
     - Group by `team_id` to avoid duplicate counts
     - A team appears once even if predicted in multiple groups (shouldn't happen, but defensive)
   - `qualifiedTeamsTotal`: From `allowsThirdPlace` and `maxThirdPlace` props
     - Calculate: `(groups.length * 2) + min(maxThirdPlace, groups.length)` if `allowsThirdPlace`
     - Otherwise: `groups.length * 2` (top 2 from each group)

2. **Use repository baseline for:**
   - Game predictions (completed, total)
   - Boost usage (silver, golden)
   - Urgent games (count, array, guesses)
   - Tournament predictions awards and honor roll

3. **Override pattern:**
   - Receive all baseline data from server
   - Calculate only qualified teams count from local state
   - Override `qualifiedTeamsCompleted` and `qualifiedTeamsTotal`
   - Pass merged data to dashboard

4. **Flatten and pass to dashboard:**
   - Destructure all repository data
   - Override qualified teams values
   - Pass flattened props (dashboard calculates urgency internally)

**GuessesContextProvider:**
- Still needed by page for game prediction management (not removed)
- Dashboard no longer depends on it (receives data as props)
- **Clarification on "decoupling":**
  - Dashboard component itself is fully decoupled (no useContext calls)
  - Parent components MAY use context for their own state management (acceptable)
  - Home Page uses GuessesContext to manage live game predictions
  - Context is parent's implementation detail, dashboard doesn't know about it
  - This achieves the goal: dashboard is a pure presentation component

---

### Phase 5: Awards Page Update

**Files:**
- Server: `app/[locale]/tournaments/[id]/awards/page.tsx`
- Client: `app/components/awards/award-panel.tsx`

**Server Component changes:**

1. **Fetch comprehensive baseline:**
   - Call `getTournamentPredictionCompletion` for complete dashboard data
   - Remove separate fetching of all games/guesses (use repository's urgent games instead)

2. **Pass to client:**
   - All baseline metrics
   - Client will override awards and honor roll portions

**Client Component changes:**

1. **Calculate from local state:**
   - Access `tournamentGuesses` state (lines 63, 99-100)
   - **Honor roll completion:**
     - Count how many of `champion_team_id`, `runner_up_team_id`, `third_place_team_id` are filled (not null)
     - **Total calculation:** Check `hasThirdPlaceGame` prop to determine if total = 3 or 2
     - If `hasThirdPlaceGame === false`, exclude `third_place_team_id` from count and total
   - **Individual awards completion:**
     - Count how many of `best_player_id`, `top_goalscorer_id`, `best_goalkeeper_id`, `best_young_player_id` are filled (not null)
     - Total = 4 (always, all tournaments have these awards)

2. **Use repository baseline for:**
   - Game predictions (completed, total)
   - Boost usage
   - Qualified teams
   - Urgent games data

3. **Override pattern:**
   - Receive all baseline from server
   - Calculate awards/honor roll from local `tournamentGuesses` state
   - Override `finalStandingsCompleted`, `individualAwardsCompleted`
   - Pass merged data to dashboard

4. **Remove:**
   - Manual calculation `predictedGames={gameGuessesArray.length}` (incorrect - counts all guesses)
   - Fetching all games just for urgency (use repository's urgent games)

5. **Flatten and pass:**
   - Destructure repository data
   - Override awards/honor roll values
   - Pass flattened props (dashboard calculates urgency internally)

**GuessesContextProvider:**
- Still wraps component (needed for other features)
- Dashboard receives data as props, not from context

---

### Phase 6: Helper Functions (Optional)

**Consider creating urgency calculation utilities:**

**File:** `app/utils/dashboard-helpers.ts` (new file)

**Functions:**
- `calculateUrgentGamesData(games, gameGuesses)`: Returns count, games array, guesses map
- `calculateGamePredictionCompletion(games, gameGuesses)`: Returns predictedGames count
- `calculateBoostUsage(gameGuesses)`: Returns silver/golden counts

**Benefits:**
- Reduces duplication in Home Page
- Clear, testable utility functions
- Not strictly necessary (only Home Page calculates client-side)

**Recommendation:** Create only if implementation shows significant duplication. Otherwise, keep logic inline in Home Page component.

---

### Phase 7: Old PredictionDashboard Investigation

**Files:**
- `app/components/prediction-dashboard.tsx`
- `app/components/playoffs/tabbed-playoff-page.tsx`

**Investigation findings:**
- `prediction-dashboard.tsx` still exists (100 lines)
- Used by `TabbedPlayoffsPage` (lines 6, 137)
- `TabbedPlayoffsPage` is exported but not imported anywhere in active codebase
- Likely legacy code from earlier playoff implementation

**Action:**
- **Investigate during implementation:** Check if `TabbedPlayoffsPage` is actively used
  - Search for imports in codebase (already confirmed: not imported)
  - Check deployment logs for page access (if available)
  - Verify with user if this is legacy code
- **Decision paths:**
  - If unused: Create follow-up issue to delete both components
  - If used: Decide whether to update to use new `CompactPredictionDashboard` or leave as-is
- **Do NOT delete as part of this story** (separate concern, minimize scope)

**Reasoning:**
- Refactoring `CompactPredictionDashboard` is independent of old component
- Old `PredictionDashboard` uses different data flow (not affected by this refactor)
- Deletion should be separate story after user confirmation
- Minimizes scope and risk of breaking unknown dependencies

---

## Files to Create/Modify

### Modified Files

**Repository:**
- `app/db/tournament-prediction-completion-repository.ts`
  - Extend `getTournamentPredictionCompletion` to include games, boosts, urgent games
  - Update return type interface
  - Add new database queries
  - **Backward compatibility:** Repository changes are additive (new fields added to return type)
  - **Other consumers:** Audit if other code uses this function (exploration found only 3 pages use it)
  - Existing fields remain unchanged, safe to deploy incrementally

**Component:**
- `app/components/compact-prediction-dashboard.tsx`
  - Remove context dependencies
  - Update props interface (flatten all values)
  - Receive urgency data as props instead of calculating

**Parent Components:**
- `app/components/unified-games-page-client.tsx`
  - Calculate game/boost metrics from context
  - Calculate urgent games from existing data
  - Flatten and pass all props to dashboard

- `app/components/qualified-teams/qualified-teams-client-page.tsx`
  - Calculate qualified teams count from state
  - Use repository baseline for other metrics
  - Flatten and pass props

- `app/components/awards/award-panel.tsx`
  - Calculate awards/honor roll from state
  - Use repository baseline for other metrics
  - Remove fetching all games (use repository's urgent games)

**Server Components:**
- `app/[locale]/tournaments/[id]/awards/page.tsx`
  - Fetch comprehensive dashboard baseline
  - Remove separate game/guesses fetching

- `app/[locale]/tournaments/[id]/qualified-teams/page.tsx`
  - Fetch comprehensive dashboard baseline
  - Pass to client

**Child Components (minor changes):**
- `app/components/game-details-popover.tsx`
  - Receive urgent games data instead of all games
- `app/components/tournament-details-popover.tsx`
  - Receive flattened tournament prediction values

**Type Definitions:**
- `app/db/tables-definition.ts`
  - Update `TournamentPredictionCompletion` interface with new fields

### Test Files to Update

- `__tests__/db/tournament-prediction-completion-repository.test.ts`
  - Test new repository fields (completedGames, boosts, urgent games)
  - Test urgent games query (48hr window, incomplete only)

- `__tests__/components/compact-prediction-dashboard.test.tsx`
  - Remove context mocking (no longer needed)
  - Update to test with new flattened props
  - Test with all required props

- `__tests__/components/unified-games-page-client.test.tsx`
  - Test override pattern (context calculations)
  - Test urgent games calculation
  - Test flattened props passed to dashboard

- `__tests__/components/awards/award-panel.test.tsx`
  - Test awards/honor roll calculation from state
  - Test override pattern
  - Verify uses repository baseline for games/boosts

- `__tests__/components/qualified-teams/qualified-teams-client-page.test.tsx`
  - Test qualified teams calculation from state
  - Test override pattern

### New Files (Optional)

- `app/utils/dashboard-helpers.ts`
  - Urgency calculation utilities (only if duplication warrants it)
  - Not created unless implementation shows need

---

## Testing Strategy

### Unit Tests

**Repository Tests:**
- `getTournamentPredictionCompletion` returns completedGames (only both scores filled)
- Returns correct boost usage counts
- Urgent games query returns only games in 48hr window
- Urgent games only includes incomplete predictions
- Urgent game guesses map matches urgent games array

**Component Tests:**
- `CompactPredictionDashboard`:
  - Renders without context provider (no context dependency)
  - Receives all data as flattened props
  - Displays correct values from props
  - Popover interactions work with new prop structure
  - No calculations performed internally

**Parent Component Tests:**
- **Home Page:**
  - Calculates game completion from context
  - Calculates boost usage from context
  - Calculates urgent games from existing data
  - Overrides repository baseline correctly
  - Passes flattened props to dashboard

- **Qualified Teams Page:**
  - Calculates qualified teams count from state
  - Uses repository baseline for games/boosts
  - Overrides only qualified teams portion
  - Passes flattened props

- **Awards Page:**
  - Calculates honor roll from state
  - Calculates individual awards from state
  - Uses repository baseline for games/boosts/qualified teams
  - Overrides only awards/honor roll portions
  - Passes flattened props

### Integration Tests

- All three pages display dashboard with correct data
- Dashboard updates reactively when parent state changes:
  - Home Page: Make prediction → game count updates
  - Qualified Teams: Toggle qualification → count updates
  - Awards: Fill award → completion updates
- Urgent games popover shows correct games on all pages
- No performance regression (Awards/Qualified Teams don't fetch all games)

### Coverage Goals

- Repository: 80% coverage on new query logic
- Component: 80% coverage on rendering logic
- Parent components: 80% coverage on override pattern logic

---

## Validation Considerations

### SonarCloud Requirements

- **Coverage:** 80% on all new/modified code
- **Issues:** 0 new issues of any severity
- **Duplicated code:** Watch for duplication in parent components (flatten/override pattern)
- **Complexity:** Keep functions focused (single responsibility)

### Edge Cases

- **No tournament predictions:** Some tournaments don't have all prediction types enabled
- **Tournament not started:** Urgency calculations when tournament hasn't begun
- **No boost limits:** Tournaments where max_silver_games and max_golden_games are null/0
  - Repository should return 0 for max values if null in database
- **Demo mode:** Dashboard used in onboarding steps (must still work)
- **Empty state:** User has made no predictions at all
  - All completed counts = 0
  - urgentGames = all games in 48hr window
  - urgentGameGuesses = empty object {}
- **All complete:** User has completed all predictions (100%)
  - urgentGames = empty array []
  - urgentGamesCount = 0
- **Locked state:** Tournament started >5 days ago (predictions locked)
- **Repository query failures:**
  - If urgent games query fails, return empty array and count = 0
  - If boost count query fails, return 0 for used counts
  - Dashboard should handle gracefully (show 0 values, not crash)
- **Incomplete data shapes:**
  - If `urgentGameGuesses` missing game IDs, treat as no prediction
  - If tournament config incomplete, use safe defaults (max = 0)

### Performance Validation

- **Baseline metrics (before):**
  - Awards/Qualified Teams pages fetch ALL tournament games (e.g., 64 games for World Cup)
  - Awards/Qualified Teams pages fetch ALL user's game guesses (e.g., 64 guesses)
  - Query time: ~200-500ms for full game/guess fetch
  - Data transfer: ~50-100KB for all games with team data

- **Target metrics (after):**
  - Only fetch urgent games (typically 0-10 games in 48hr window)
  - Query time: <100ms for urgent games subset
  - Data transfer: <10KB for urgent games only
  - Expected improvement: 50-80% reduction in query time and data transfer

- **Validation steps:**
  - Compare old vs new query execution time (use database query logs)
  - Measure network payload size (before/after)
  - Verify no N+1 queries introduced (check for unexpected additional queries)
  - Test with tournaments of different sizes (16 teams, 32 teams, 64 teams)

---

## Migration Strategy

### Implementation Order

1. **Repository first:**
   - Extend `getTournamentPredictionCompletion`
   - Add tests for new fields
   - Deploy and verify data correctness

2. **Dashboard component:**
   - Remove context dependencies
   - Update props interface
   - Update tests
   - Verify in isolation (Storybook or test environment)

3. **Parent components (one at a time):**
   - Start with **Qualified Teams** (simplest override pattern)
   - Then **Awards** (similar pattern)
   - Finally **Home Page** (most complex, calculates most metrics)

4. **Verification after each parent:**
   - Test page in development
   - Verify dashboard displays correctly
   - Verify reactivity (state changes update dashboard)
   - Run tests

5. **Cleanup:**
   - Remove unused imports
   - Update documentation
   - Run full test suite

### Rollback Plan

If issues arise:
- Repository changes are additive (backward compatible)
- Component changes can be reverted (keep old version in git)
- Parent component updates are independent (can revert individually)

---

## Open Questions

None - all requirements clarified in issue description.

---

## Dependencies

- No external library changes needed
- No database schema changes (using existing tables)
- No API changes (internal refactoring only)

---

## Timeline Estimate

- **Repository extension:** 1-2 hours
- **Dashboard refactoring:** 2-3 hours
- **Parent component updates:** 3-4 hours (1 hour per component)
- **Testing:** 2-3 hours
- **Validation and fixes:** 1-2 hours
- **Total:** 9-14 hours

---

## Success Metrics

- [ ] Zero new SonarCloud issues
- [ ] 80% coverage on all modified code
- [ ] All three pages display correct dashboard data
- [ ] Dashboard updates reactively when state changes
- [ ] Performance improvement: Awards/Qualified Teams pages no longer fetch all games
- [ ] All existing tests pass
- [ ] User can complete all prediction workflows without regression
