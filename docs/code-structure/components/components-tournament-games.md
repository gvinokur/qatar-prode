# Components: Tournament Games & Predictions

Part of the CODE-STRUCTURE.md system. See `CODE-STRUCTURE.md` for the full index and call graph.

**Last updated:** 2026-05-18

---

## Files

Now let me compile the complete report with all the file information.

---

## Component Reference Report

**File:** `app/components/actual-result-display.tsx`
Displays actual game result with scores and prediction result badge. Shows "Actual Result" label, team names, scores, logos, penalty scores, and prediction accuracy with points earned. Derives homeIsWinner/awayIsWinner inline using typeof null-safety guard on penalty scores and passes C2 winner props to TeamScoreRow. `PredictionResult` type exported (Story #364).
- **PredictionResult**: `'exact' | 'goal_difference' | 'correct' | 'incorrect'` — exported type (Story #364)
- **ActualResultDisplay** (FC) - `[Client]` - Calls: none (inline winner derivation) - Uses: `useTranslations` - Renders: `TeamScoreRow` (with homeIsWinner/awayIsWinner)
- **getPredictionResultLabel** (fn) - Helper to format prediction result labels with translations; includes goal_difference case (Story #364)
- **getPredictionResultIcon** (fn) - Returns icon: CompareArrowsIcon for goal_difference, CheckIcon for exact/correct, CloseIcon for incorrect (Story #364)

**File:** `app/components/boost-badge.tsx`
Reusable boost badge component displaying boost type and multiplier with trophy icon.
- **BoostBadge** (FC) - `[Client]` - Calls: none - Uses: `useTheme` - Renders: `Chip`
- **BoostCountBadge** (FC) - `[Client]` - Calls: none - Uses: `useTheme` - Renders: `Chip`

**File:** `app/components/boost-counts-summary.tsx`
Displays available boosts summary in a paper component. Shows silver and golden boost counts with usage indicators.
- **BoostCountsSummary** (FC) - `[Client]` - Calls: none - Uses: `useContext(GuessesContext), useTheme` - Renders: `Paper, Chip`

**File:** `app/components/boost-info-popover.tsx`
Popover showing detailed boost allocation breakdown by group, playoff, and performance metrics.
- **BoostInfoPopover** (FC) - `[Client]` - Calls: `getBoostAllocationBreakdownAction` - Uses: `useTranslations, useLocale` - Renders: `Popover, Box`
- **LoadingState** (FC) - Helper loading indicator component
- **ErrorState** (FC) - Helper error display component
- **EmptyState** (FC) - Helper empty state display
- **BreakdownContent** (FC) - Helper to render breakdown content
- **DistributionSection** (FC) - Helper section for boost distribution
- **PerformanceSection** (FC) - Helper section for boost performance

**File:** `app/components/stage-separator.tsx`
Full-width header row that spans a CSS grid column (gridColumn: '1 / -1') to visually separate game groups by matchday or round.
- **StageSeparator({ label: string, isNowAvailable?: boolean })** (FC) - `[Client]` - Calls: none - Uses: `useTranslations` - Renders: `Box (gridColumn 1/-1), Typography (overline, primary.main), Chip (success, when isNowAvailable), Divider`

**File:** `app/components/stage-transition-banner.tsx`
Full-width banner replacing StageSeparator at the Group Stage→Playoff boundary. Renders the same overline label + divider layout as StageSeparator, plus a right-aligned outlined CTA Button linking to ctaHref.
- **StageTransitionBanner({ label: string, ctaLabel: string, ctaHref: string, isNowAvailable?: boolean })** (FC) - `[Client]` - Calls: none - Uses: `useTranslations` - Renders: `Box (gridColumn 1/-1), Typography (overline), Chip (success, when isNowAvailable), Divider, Button (outlined, Link)`

**File:** `app/components/compact-game-view-card.tsx`
Compact card displaying a single game with prediction and result. Handles game guesses, fixtures, and results with optional boost display. Computes prediction row winner inline (predictionHomeIsWinner/predictionAwayIsWinner) and passes C2 props to the prediction TeamScoreRow; actual result row winner is handled independently by ActualResultDisplay. When `isGameGuess && stageLabel` is provided, renders a stage label row below the location — clickable (with ArrowForwardIos icon) when `onStageClick` is provided, static otherwise.
- **CompactGameViewCard** (FC) - `[Client]` - Calls: none - Uses: `useTheme, useTranslations` - Renders: `Card, GameCountdownDisplay, TeamScoreRow` (prediction row with C2 winner props)`, ActualResultDisplay, GameCardPointOverlay`
- Props `GameGuessProps` include: `stageLabel?: string`, `onStageClick?: () => void`, `onAIGenerateClick?: () => void` — when provided and game has no prediction and is not disabled, renders an `AutoAwesome` icon button beside the edit button
- Props `GameResultProps` include: `canPublish?: boolean` — when `false`, the publish toggle Checkbox is disabled and shows `game.incompleteResult` tooltip instead of `game.isPublished`
- **calculatePredictionResult(predictedHome, predictedAway, actualHome, actualAway, penaltyOptions?)** (fn) - Determines prediction accuracy (exact/goal_difference/correct/incorrect). Checks exact → goal_difference (same margin) → correct winner → incorrect. `penaltyOptions` groups `{predictedHomePenaltyWinner?, predictedAwayPenaltyWinner?, actualHomePenaltyScore?, actualAwayPenaltyScore?}`. Returns 'incorrect' when scores or margin match but penalty winner wrong (Story #364).

**File:** `app/components/compact-prediction-dashboard.tsx`
Compact dashboard showing game and tournament prediction progress with urgency indicators and boost counts. Kept for onboarding demo; prediction pages use PredictionStatusHeader instead.
- **CompactPredictionDashboard** (FC) - `[Client]` - Calls: none - Uses: `useTranslations, useSearchParams, useMemo, useState, useContext` - Renders: `Box, PredictionProgressRow, GameDetailsPopover, TournamentDetailsPopover, BoostInfoPopover`

**File:** `app/components/flippable-game-card.tsx`
3D flip card for inline game editing. Shows game view on front, edit controls on back with keyboard navigation support.
- **FlippableGameCard** (FC) - `[Client]` - Calls: `generateAIPrediction` - Uses: `useContext(GuessesContext), useTheme, useMediaQuery, useReducedMotion, useMemo` - Renders: `Box, GameView, Card, GamePredictionEditControls`
- Props include: `onStageClick?: () => void` — passed through to `GameView`; `isGuidedMode?: boolean` — threaded to `GamePredictionEditControls`; `onAIGenerateClick?: (gameId: string) => void` — passed through to `GameView` (view mode) and as a local-state handler to `GamePredictionEditControls` (edit mode)

**File:** `app/components/game-boost-selector.tsx`
Interactive boost selector with silver/golden buttons, count badges, and dialog for boost limit warnings.
- **GameBoostSelector** (FC) - `[Client]` - Calls: `setGameBoostAction` - Uses: `useContext(GuessesContext), useTranslations, useLocale, useTheme` - Renders: `Box, IconButton, Tooltip, Dialog, Alert, BoostBadge, BoostCountBadge`

**File:** `app/components/game-card-point-overlay.tsx`
Animated point display overlay for game cards with celebration effects and breakdown tooltip.
- **GameCardPointOverlay** (FC) - `[Client]` - Calls: none - Uses: `useTheme, useSearchParams, useTranslations` - Renders: `Box, ConfettiEffect, Chip, PointBreakdownTooltip`

**File:** `app/components/game-countdown-display.tsx`
Countdown timer display for game predictions with color-coded urgency and optional progress bar.
- **GameCountdownDisplay** (FC) - `[Client]` - Calls: none - Uses: `useGameCountdown, useLocale, useTranslations, useTimezone` - Renders: `Box, LinearProgress, Link, Typography`

**File:** `app/components/game-details-popover.tsx`
Popover displaying game predictions grouped by urgency level (urgent/warning/notice).
- **GameDetailsPopover** (FC) - `[Client]` - Calls: none - Uses: `useTranslations` - Renders: `Popover, Card, UrgencyAccordionGroup`

**File:** `app/components/game-filters.tsx`
Game filter selector with counts for all/groups/playoffs/unpredicted/closingSoon filters.
- **GameFilters** (FC) - `[Client]` - Calls: none - Uses: `useTranslations` - Renders: `FormControl, Select, MenuItem`

**File:** `app/components/game-prediction-edit-controls.tsx`
Full game prediction edit form with scores, penalties, boosts, keyboard navigation, and save/cancel controls. When `isGuidedMode=true` and `onSaveAndAdvance` is provided, renders "Save & Next" as the primary desktop action instead of "Save".
- **GamePredictionEditControls** (FC) - `[Client]` - Calls: none - Uses: `useContext(GuessesContext), useTheme, useMediaQuery, useTranslations` - Renders: `Box, TextField, Checkbox, ToggleButtonGroup, GameBoostSelector, StepperScoreInput, Alert, IconButton, Tooltip`
- Props include: `isGuidedMode?: boolean` — when true and `onSaveAndAdvance` is provided, desktop shows [Cancel] [Save & Next] instead of [Cancel] [Save]; `onAIGenerateClick?: () => void` — when provided, renders a centered `AutoAwesomeIcon` button between the penalty section and boost section

**File:** `app/components/game-result-edit-dialog.tsx`
Dialog for editing game results or guesses. Supports penalty shootouts, game date (for results), and game guess forms.
- **GameResultEditDialog** (FC) - `[Client]` - Calls: none - Uses: `useState, useEffect` - Renders: `Dialog, DateTimePicker, GamePredictionEditControls, TextField, Grid`

**File:** `app/components/game-view.tsx`
Displays a single game prediction card. Gets game data from context, computes stageLabel from group letter or playoff round name, and renders CompactGameViewCard.
- **GameView({ game, teamsMap, handleEditClick, disabled?, onStageClick?, onAIGenerateClick? })** (FC) - `[Client]` - Calls: `calculateScoreForGame, generateAIPrediction, updateGameGuess` - Uses: `useContext(GuessesContext), useTranslations, useMemo` - Renders: `CompactGameViewCard`
- **buildGameGuess** (fn) - Helper to build empty GameGuess object

**File:** `app/components/games-grid.tsx`
Grid of games with optional inline editing via FlippableGameCard or dialog editing. Handles playoff team updates and tournament guess updates.
- **GamesGrid** (FC) - `[Client]` - Calls: `updateOrCreateTournamentGuess` - Uses: `useContext(GuessesContext), useEditMode, useSession, useTranslations, useLocale` - Renders: `Grid, FlippableGameCard, GameView, GameResultEditDialog`
- **buildGameGuess** (fn) - Helper to create initial GameGuess structure
- **handleAutoAdvanceNext** (fn) - Navigates to next editable game
- **handleAutoGoPrevious** (fn) - Navigates to previous editable game

**File:** `app/components/games-list-loading.tsx`
Skeleton loading component displaying game card loaders.
- **GamesListLoading** (FC) - `[Client]` - Calls: none - Uses: none - Renders: `Stack, GameCardSkeleton`

**File:** `app/components/games-list-with-scroll.tsx`
Scrollable list of games with stage separators, filter integration, auto-scroll to first unpredicted game, and keyboard navigation support. Groups games into `GameSection[]` (by matchday for group games, by round for playoff games). Renders `StageTransitionBanner` at the Group Stage→Playoff boundary (first playoff section) and `StageSeparator` for all other sections. Always passes `isGuidedMode={true}` to each `FlippableGameCard`. Auto-advance skips predicted games and stops at the group stage boundary.
- **GamesListWithScroll({ games, teamsMap, tournamentId, activeFilter, tournament, onGameStageClick?, qtPredictionLocked, qualifiedTeamsHref, nowAvailableRoundIds?: Set<string>, onAIGenerateClick?: (gameId: string) => void })** (FC) - `[Client]` - Calls: `isGamePredictionComplete` - Uses: `useContext(GuessesContext), useEditMode, useEditTrigger, useSession, useTranslations, useMemo` - Renders: `Box, StageSeparator (with isNowAvailable), StageTransitionBanner (with isNowAvailable), FlippableGameCard, EmptyGamesState`

**File:** `app/components/stepper-score-input.tsx`
Stepper input for scores with increment/decrement buttons, imperatively expose focus method.
- **StepperScoreInput** (FC) - `[Client]` - Calls: none - Uses: `useRef, useImperativeHandle` - Renders: `Box, IconButton, Typography`

**File:** `app/components/urgency-accordion-group.tsx`
Groups games into urgency tiers (urgent/warning/notice) with auto-expansion for unpredicted urgent games. Used from the Games, Qualified Teams, and Awards pages. Secondary sorts by `game_number` for stability.
- **UrgencyAccordionGroup** (FC) - `[Client]` - Calls: none - Uses: `useRouter, useTranslations, useLocale, useCountdownContext, useMemo, useState, useEffect` - Renders: `Box, UrgencyAccordion`
- `handleEditGame(gameId)` — navigates to `/${locale}/tournaments/${tournamentId}/games?edit=${gameId}` (games page, not hub page), opening the game in edit mode via the `?edit` URL param flow.

**File:** `app/components/urgency-accordion.tsx`
Accordion for single urgency tier showing unpredicted games first, then predicted games.
- **UrgencyAccordion** (FC) - `[Client]` - Calls: none - Uses: `useTranslations, useMemo` - Renders: `Accordion, AccordionDetails, Grid, UrgencyGameCard`

**File:** `app/components/urgency-game-card.tsx`
Compact game card in urgency accordion showing team names, logos, prediction (if any), countdown, and edit button.
- **UrgencyGameCard** (FC) - `[Client]` - Calls: none - Uses: `useTheme, useTranslations` - Renders: `Card, CardContent, Box, GameCountdownDisplay, BoostBadge, IconButton`

**File:** `app/components/urgency-helpers.tsx`
Helper functions and constants for urgency level calculations, color mapping, and icon selection.
- **URGENCY_TIME_CONSTANTS** (const) - Time thresholds for urgency levels
- **URGENCY_COLOR_MAP** (const) - Maps urgency levels to theme colors
- **getGameUrgencyLevel** (fn) - Determines urgency for game predictions
- **getTournamentUrgencyLevel** (fn) - Determines urgency for tournament predictions
- **getCategoryUrgencyLevel** (fn) - Determines urgency for prediction category
- **getWorstUrgencyLevel** (fn) - Returns most urgent level from list
- **getUrgencyIcon** (fn) - Returns icon for urgency level
- **hasUrgentGames** (fn) - Checks if games need urgent attention

**File:** `app/components/unified-games-page-client.tsx`
Main games page with filter integration, edit parameter handling, auto-scroll to next/urgent games, and stage-click filter handler. Imports `EDIT_NEXT_TOKEN` from `prediction-constants` and `findScrollTarget` from `auto-scroll`.
- **UnifiedGamesPageContent** (FC) - `[Client]` - Calls: `computeGamesHeaderVariant, generateAIPrediction, updateOrCreateGameGuesses, isGuessComplete, calculateDeadline` - Uses: `useSearchParams, useRouter, useFilterContext, useEditTrigger, useContext(GuessesContext), useTranslations, useLocale, useTheme, useMediaQuery, useMemo, useEffect, useState, useCallback` - Renders: `ScrollShadowContainer, PredictionStatusHeader, GameFilters, SecondaryFilters, GamesListWithScroll, Fab, AiGenerateAllDialog`
- Props include: `qualifiedTeamsHref: string` — forwarded to `GamesListWithScroll`; `qtPredictionLocked` derived from `tournamentPredictionCompletion?.isPredictionLocked ?? false`; `nowAvailableRoundIds?: string[]` — converted to `Set<string>` via `useMemo`, forwarded to both `GamesListWithScroll` and `SecondaryFilters`
- Effect 1 handles `?edit` param: if value equals `EDIT_NEXT_TOKEN` ("next"), finds the first upcoming game (`game_date >= now`) where `isGuessComplete` returns false (skipping already-predicted games); falls back to `findScrollTarget(games)` (first chronological upcoming) only when all upcoming games are predicted or no upcoming game exists. For a specific game ID, uses the param value directly. Clears all filters and sets `pendingEditGameId` so Effect 2 can scroll+trigger edit.
- `openUnpredictedGames` memo: games where `deadline > now`, both teams known, and guess not complete — drives AI FAB visibility and bulk handler input
- `handleAIGenerateAll` — generates predictions for all `openUnpredictedGames` in one `updateOrCreateGameGuesses` call; guards against concurrent calls; on success calls `bulkSetGameGuesses` and closes dialog
- `handleGameStageClick(game: ExtendedGameData)` — sets `activeFilter` + group/round filter based on the game's stage; passed to `GamesListWithScroll` as `onGameStageClick`
- **UnifiedGamesPageClient** (FC) - `[Client]` - Calls: none - Uses: none - Renders: `FilterContextProvider, UnifiedGamesPageContent`

**File:** `app/components/unified-games-page.tsx`
Server component that fetches all tournament data and renders client page with GuessesContext and EditTriggerContext. Builds `qualifiedTeamsHref = /${locale}/tournaments/${tournamentId}/qualified-teams` and passes it to `UnifiedGamesPageClient`.
- **UnifiedGamesPage** (FC) - `[Server]` - Calls: `getLoggedInUser, getTeamsMap, getGamesClosingWithin48Hours, getAllTournamentGames, getTournamentGameCounts, findGameGuessesByUserId, getPredictionDashboardStats, getGameGuessStatisticsForUsers, findTournamentById, findGroupsInTournament, findPlayoffStagesWithGamesInTournament, getTournamentPredictionCompletion, getPlayoffRoundsAvailability, applyLocalization, getLocale` - Uses: none - Renders: `GuessesContextProvider, EditTriggerContextProvider, UnifiedGamesPageClient, PublicGamesPage`

**File:** `app/components/prediction-dashboard.tsx`
Dashboard with status bar and games grid. Recalculates prediction stats client-side when guesses change.
- **PredictionDashboard** (FC) - `[Client]` - Calls: none - Uses: `useContext(GuessesContext), useMemo` - Renders: `PredictionStatusBar, GamesGrid`

**File:** `app/components/prediction-dashboard-types.ts`
Type definition for urgency warning with severity, count, and message.
- **UrgencyWarning** (interface) - Type for urgency warnings

**File:** `app/components/prediction-progress-row.tsx`
Reusable progress row for game and tournament predictions with optional boost badges.
- **PredictionProgressRow** (FC) - `[Client]` - Calls: none - Uses: `getUrgencyIcon` - Renders: `Box, LinearProgress, IconButton, BoostCountBadge`

**File:** `app/components/prediction-status-bar.tsx`
Status bar showing prediction progress, boosts, tournament predictions accordion, and urgency warnings.
- **PredictionStatusBar** (FC) - `[Client]` - Calls: none - Uses: `useContext(GuessesContext), useTranslations, useMemo, useState, useEffect` - Renders: `Card, Box, LinearProgress, TournamentPredictionAccordion, UrgencyAccordionGroup, BoostCountBadge, BoostInfoPopover, Alert`
- **buildUrgencyWarnings** (fn) - Creates warning alerts for urgent games
- **buildTournamentUrgencyWarnings** (fn) - Creates warning alerts for tournament predictions

**File:** `app/components/point-breakdown-tooltip.tsx`
Popover showing detailed point calculation: base score, boost multiplier, and total.
- **PointBreakdownTooltip** (FC) - `[Client]` - Calls: none - Uses: `useTheme, useTranslations` - Renders: `Popover, Box, Stack, Typography, Divider`

**File:** `app/components/secondary-filters.tsx`
Conditional filter selector for groups or rounds based on active primary filter.
- **SecondaryFilters({ activeFilter, groupFilter, roundFilter, groups, rounds, onGroupChange, onRoundChange, nowAvailableRoundIds?: Set<string> })** (FC) - `[Client]` - Calls: none - Uses: `useTranslations` - Renders: `FormControl, Select, MenuItem, Chip (success badge on round MenuItem when round is in nowAvailableRoundIds)`

**File:** `app/components/empty-games-state.tsx`
Empty state component showing contextual message based on filter type (Spanish text).
- **EmptyGamesState** (FC) - `[Client]` - Calls: none - Uses: none - Renders: `Box, Typography`

**File:** `app/components/tournament-prediction-accordion.tsx`
Accordion showing tournament prediction categories (podium, awards, qualifiers) with completion progress and links.
- **TournamentPredictionAccordion** (FC) - `[Client]` - Calls: none - Uses: `useLocale, useTranslations` - Renders: `Accordion, AccordionDetails, Box, TournamentPredictionCategoryCard`

**File:** `app/components/tournament-prediction-category-card.tsx`
Card showing single tournament prediction category with progress, urgency icon, and action button/lock chip.
- **TournamentPredictionCategoryCard** (FC) - `[Client]` - Calls: none - Uses: `useTranslations` - Renders: `Card, CardContent, Box, Typography, Button, Chip, LockIcon`

**File:** `app/components/home/home-component.tsx`
Home page with tournament list and sidebar (rules, friend groups). Uses ScrollShadowContainer for scrollable sections.
- **Home** (FC) - `[Client]` - Calls: none - Uses: `useTheme, useLocale, useTranslations` - Renders: `Box, Grid, ScrollShadowContainer, Card, Link, Rules, FriendGroupsList, DevTournamentBadge`

**File:** `app/components/home/tournament-redirect.tsx`
Loading component that redirects to last selected or first tournament while preserving query parameters. Always redirects to `/${locale}/tournaments/${id}` (tournament Hub root).
- **TournamentRedirect** (FC) - `[Client]` - Calls: `getLastSelectedTournamentId, setLastSelectedTournamentId` - Uses: `useRouter, useSearchParams, useLocale, useTranslations` - Renders: `Box, CircularProgress, Typography`

**File:** `app/components/home/footer.tsx`
Fixed footer with teasing message about standings. Fetches user ranking for specific tournament if configured.
- **Footer** (FC) - `[Client]` - Calls: `getLoggedInUser, getUsersForGroup, getUserScoresForTournament` - Uses: `useTranslations, useTheme, useMediaQuery, usePathname, useEffect, useState` - Renders: `AppBar, Toolbar, Box, Typography`

**File:** `app/components/tournament/empty-tournaments-state.tsx`
Server component showing empty state with past tournaments list when no active tournaments exist.
- **EmptyTournamentsState** (FC) - `[Server]` - Calls: `getPastTournaments` - Uses: `getTranslations` - Renders: `Box, Typography, Stack`

**File:** `app/components/tournament/new-tournament-snackbar.tsx`
Snackbar notifying user of current tournament and other available tournaments with dismissal storage.
- **NewTournamentSnackbar** (FC) - `[Client]` - Calls: `getDismissalState, setDismissalState` - Uses: `useTranslations, useState, useEffect` - Renders: `Snackbar, Alert, AlertTitle, Typography`

**File:** `app/components/tournament/tournament-switcher.tsx`
Dropdown menu to switch between tournaments while preserving current page path.
- **TournamentSwitcher** (FC) - `[Client]` - Calls: `setLastSelectedTournamentId` - Uses: `useRouter, usePathname, useLocale, useState` - Renders: `IconButton, Menu, MenuItem, ListItemIcon, CheckIcon`

**File:** `app/components/groups-page/group-selector.tsx`
Tab navigation for tournament pages: Hub, Matches, Qualified Teams, Individual Awards. Hub tab always rendered with Dashboard icon, linking to tournament root. Matches tab links to `/games`. Qualified Teams and Awards tabs are disabled for non-authenticated users; Hub tab is always enabled.
- **GroupSelector({ tournamentId, backgroundColor, textColor, user })** (FC) - `[Client]` - Calls: none - Uses: `useLocale, useTranslations, usePathname, useTheme, useMediaQuery` - Renders: `Tabs, Tab, Link, DashboardIcon, SportsSoccerIcon, AccountTreeIcon, EmojiEventsIcon`. On mobile (`sm` breakpoint): `variant="standard"` + `centered`, unselected tabs render icon-only (`label={undefined}`), icon-only tabs get `iconOnlySx`; on desktop: `variant="fullWidth"`. Hub tab always enabled; Qualified Teams and Awards disabled when `!user`.
- **getTabSx** (fn) - Helper for tab styling
- **getSelectedTab(pathname, tournamentId)** (fn) - Helper to determine active tab: `/games` → `'matches'`; root path → `'hub'`; `/qualified-teams` → `'qualified-teams'`; `/awards` → `'individual_awards'`

**File:** `app/components/groups-page/group-table.tsx`
Paper displaying "Tabla de Posiciones" (standings table) using TeamStandingsCards component.
- **GroupTable** (FC) - `[Client]` - Calls: none - Uses: none - Renders: `Paper, Typography, TeamStandingsCards`

**File:** `app/components/groups-page/team-standing-card.tsx`
Expandable card showing team rank, name, points with collapsible details (W-D-L, goals, conduct score).
- **TeamStandingCard** (FC) - `[Client]` - Calls: none - Uses: `useTheme, useTranslations` - Renders: `Card, CardContent, Box, Typography, Collapse, Divider, RankChangeIndicator`
- **getCardPadding** (fn) - Helper for responsive padding
- **getTeamDisplay** (fn) - Helper for team name formatting
- **getAriaLabel** (fn) - Helper for accessibility labels
- **getPointsDisplayText** (fn) - Helper for points display formatting

**File:** `app/components/groups-page/team-standings-cards.tsx`
Container for team standing cards with rank calculation, qualification highlighting, and rank change indicators.
- **TeamStandingsCards** (FC) - `[Client]` - Calls: `calculateRanks` - Uses: `useTranslations, useMemo, useState` - Renders: `LayoutGroup, Box, TeamStandingCard`

**File:** `app/components/groups-page/types.ts`
Type definitions for team standings components (TeamStanding, TeamStandingsCardsProps, TeamStandingCardProps).
- **TeamStanding** (interface) - Complete team standing with position, stats, and qualification
- **TeamStandingsCardsProps** (interface) - Props for standings container
- **TeamStandingCardProps** (interface) - Props for individual standing card

**Folder:** `app/components/prediction-status-header/`
Phase-aware prediction status header with tone-driven design. Replaces CompactPredictionDashboard on all prediction pages.

**File:** `app/components/prediction-status-header/types.ts`
Type definitions for the status header variant descriptor pattern.
- **StatusHeaderTone** (type) - Union: 'brand' | 'calm' | 'success' | 'deadlineSoon' | 'deadlineUrgent' | 'deadlineNow' | 'locked'
- **HeaderAction** (type) - `{ label: string; href: string } | { label: string; onClick: () => void }`
- **StatusHeaderVariant** (interface) - Full descriptor: tone, stageLabel?, leadIcon, statusText, chip?, boosts?, pointsBadge?, message?, action?, secondaryAction?
  - **leadIcon** union: 'rocket' | 'check' | 'info' | 'warning' | 'error' | 'lock' | 'flag' | 'trophy' | 'login' | 'clock' | 'book' | 'mobile' | 'bell'

**File:** `app/components/prediction-status-header/prediction-status-header.tsx`
Presentational component rendering any StatusHeaderVariant descriptor as a toned MUI card with optional action buttons.
- **PredictionStatusHeader({ variant })**: `JSX.Element` — [Client] Renders header card from descriptor. Background tint + left border from tone using MUI palette tokens. All action buttons use `color="primary"`. message rendered with `white-space: pre-line`. href actions use Next.js Link; onClick actions call the handler directly.
  Uses: useTheme

**File:** `app/components/prediction-status-header/games-header-variant.ts`
Pure selector functions for the Games prediction page header variant.
- **computeGamesHeaderVariant(input: GamesHeaderInput, t: TFunction)**: `StatusHeaderVariant` — Priority: tournament-finished → urgent-unpredicted → pre-groups-complete-nudge-qt → pre-tournament → stage-active-caught-up
- **deriveStageLabel(games: ExtendedGameData[], now: Date)**: `string | undefined` — Interval model; Final+Third merged into Finals bucket
- **getNextBatchSummary(games: ExtendedGameData[], now: Date, t: TFunction)**: `string` — Returns human-readable label for next unpredicted game batch ("today" / "tomorrow" / "in N days")
- **collapsePlayoffDenominator(playoffRoundsCompletion: Record<string, PlayoffRoundCompletionData>)**: `Record<string, PlayoffRoundCompletionData>` — Merges Third-place game into Final round entry so playoff denominator counts Final+Third as one slot
- **GamesHeaderInput** (interface) — completion, games, urgentGames, gameGuesses, teamsMap, tournamentId, gamePointsEarned?, locale, now?

**File:** `app/components/prediction-status-header/qt-header-variant.ts`
Pure selector function for the Qualified Teams prediction page header variant.
- **computeQTHeaderVariant(input: QTHeaderInput, t: TFunction)**: `StatusHeaderVariant` — Priority: never-filled-locked → locked-with-results → locked-pending → completed-pre-lock (qualifiers done regardless of group progress; Recalculate CTA only when groups also done) → lock-window-urgent (groups complete: auto-fill CTA; groups incomplete: predict-matches href) → pre-tournament-auto-fill-ready → pre-tournament
- **computeQTLockUrgency(qtLockAt: Date, now: Date)**: `StatusHeaderTone` — < 2h → deadlineNow, < 24h → deadlineUrgent, < 48h → deadlineSoon, else → brand
- **QTHeaderInput** (interface) — isLocked, qtLockAt, predictedGroupGames, totalGroupGames, qualifiersCompleted, qualifiersTotal, definedSoFar, correctSoFar, qtPointsEarned?, onAutoFillClick, tournamentId, locale, now?

**File:** `app/components/prediction-status-header/awards-header-variant.ts`
Pure selector function for the Awards prediction page header variant.
- **computeAwardsHeaderVariant(input: AwardsHeaderInput, t: TFunction)**: `StatusHeaderVariant` — Priority: never-filled-locked → locked-with-results → locked-pending → completed-pre-lock → pre-tournament (with urgency)
- **computeAwardsActionLabel(awardsCompleted: number, awardsTotal: number, t: TFunction)**: `string` — Returns 'Define'/'Continue'/'Finish' key based on progress
- **AwardsHeaderInput** (interface) — isLocked, awardsLockAt, awardsCompleted, awardsTotal, decidedSoFar, correctSoFar, awardsPointsEarned?, tournamentId, locale, now?

**File:** `app/components/prediction-status-header/hub-header-variant.ts`
Pure selector functions for the Tournament Hub banner variants (S1 logged-out, P1–P5 priority states, P6–P8 engagement rotation).
- **computeHubPriorityVariant(state: PriorityAttentionState, t: TFunction, gamesHref, qtHref, awardsHref)**: `StatusHeaderVariant` — Maps all 5 PriorityAttentionState types. urgent-games: deadlineNow (<2h via state.msUntilMostUrgentGame) or deadlineUrgent tone, clock icon, href=gamesHref?edit=firstUrgentGameId. now-available-playoff: brand, rocket icon, href=gamesHref?edit=firstGameId. deadline: deadlineUrgent (<24h via state.msUntilPredictionLock) or deadlineSoon, clock icon, primaryCTA=QT or Awards, optional secondaryAction=Awards when both incomplete. new-actions-qt: brand, rocket icon, href=qtHref. new-actions-awards: brand, trophy icon, href=awardsHref.
- **computeLoggedOutVariant(t: TFunction, onSignIn: () => void)**: `StatusHeaderVariant` — S1 logged-out CTA; brand tone, login icon; single action onClick=onSignIn (contained); message field set for two-line expanded layout. Translation namespace: tournament.public (welcome, ctaDescription, loginOrSignup keys).
- **computeEngagementVariant(cardType: EngagementCardType, t: TFunction, props: EngagementVariantProps)**: `StatusHeaderVariant` — pre-tournament-cta: brand, book icon, predict href (primary/contained) + tutorial onClick (secondary/outlined). app-install: brand, mobile icon, install onClick + dismiss onClick. notification-opt-in: brand, bell icon, enable onClick + dismiss onClick.
- **EngagementCardType** (type) - 'pre-tournament-cta' | 'app-install' | 'notification-opt-in'
- **EngagementVariantProps** (interface) - predictedGames?, gamesEditHref?, onTutorial?, onInstall?, onDismiss?, onEnable?

**File:** `app/components/prediction-status-header/index.ts`
Barrel export for the prediction-status-header folder.

**File:** `app/components/tournament-page/games-logged-out-header.tsx`
Logged-out CTA banner for the Games page. Renders `PredictionStatusHeader` via `computeLoggedOutVariant` wrapped in a sticky `Box` so the banner stays visible while the user scrolls through the games list.
- **GamesLoggedOutHeader()**: `JSX.Element` — [Client] Calls `computeLoggedOutVariant(t, onSignIn)` and renders `<PredictionStatusHeader variant={variant} />` inside a `Box sx={{ position: 'sticky', top: 0, zIndex: 1000 }}`. Manages `openAuthDialog` state to conditionally render `LoginOrSignupDialog`.

**File:** `app/components/tournament-page/public-games-page-client.tsx`
Client component rendering the read-only games list for logged-out users. Sorts games by date and game number, shows a no-games empty state, and renders `GamesLoggedOutHeader` (sticky PSH banner) above the list of `ReadOnlyGameCard` items.
- **PublicGamesPageClient({ games, teamsMap, groups, rounds })**: `JSX.Element` — [Client] Renders `GamesLoggedOutHeader` + list of `ReadOnlyGameCard` inside `ScrollShadowContainer`.
