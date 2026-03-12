# Components: Tournament Games & Predictions

Part of the CODE-STRUCTURE.md system. See `CODE-STRUCTURE.md` for the full index and call graph.

**Last updated:** 2026-03-09

---

## Files

Now let me compile the complete report with all the file information.

---

## Component Reference Report

**File:** `app/components/actual-result-display.tsx`
Displays actual game result with scores and prediction result badge. Shows "Actual Result" label, team names, scores, logos, penalty scores, and prediction accuracy with points earned. Derives homeIsWinner/awayIsWinner inline using typeof null-safety guard on penalty scores and passes C2 winner props to TeamScoreRow.
- **ActualResultDisplay** (FC) - `[Client]` - Calls: none (inline winner derivation) - Uses: `useTranslations` - Renders: `TeamScoreRow` (with homeIsWinner/awayIsWinner)
- **getPredictionResultLabel** (fn) - Helper to format prediction result labels with translations
- **getPredictionResultIcon** (fn) - Returns icon for prediction result (Check/Close)

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

**File:** `app/components/compact-game-view-card.tsx`
Compact card displaying a single game with prediction and result. Handles game guesses, fixtures, and results with optional boost display. Computes prediction row winner inline (predictionHomeIsWinner/predictionAwayIsWinner) and passes C2 props to the prediction TeamScoreRow; actual result row winner is handled independently by ActualResultDisplay.
- **CompactGameViewCard** (FC) - `[Client]` - Calls: none - Uses: `useTheme, useTranslations` - Renders: `Card, GameCountdownDisplay, TeamScoreRow` (prediction row with C2 winner props)`, ActualResultDisplay, GameCardPointOverlay`
- **calculatePredictionResult(predictedHome, predictedAway, actualHome, actualAway, predictedHomePenaltyWinner?, predictedAwayPenaltyWinner?, actualHomePenaltyScore?, actualAwayPenaltyScore?)** (fn) - Determines prediction accuracy (exact/correct/incorrect). Returns 'incorrect' when scores match exactly but game went to penalties and user predicted wrong winner or made no penalty prediction.

**File:** `app/components/compact-prediction-dashboard.tsx`
Compact dashboard showing game and tournament prediction progress with urgency indicators and boost counts.
- **CompactPredictionDashboard** (FC) - `[Client]` - Calls: none - Uses: `useTranslations, useSearchParams, useMemo, useState, useContext` - Renders: `Box, PredictionProgressRow, GameDetailsPopover, TournamentDetailsPopover, BoostInfoPopover`

**File:** `app/components/flippable-game-card.tsx`
3D flip card for inline game editing. Shows game view on front, edit controls on back with keyboard navigation support.
- **FlippableGameCard** (FC) - `[Client]` - Calls: none - Uses: `useContext(GuessesContext), useTheme, useMediaQuery, useReducedMotion` - Renders: `Box, GameView, Card, GamePredictionEditControls`

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
(Output too large - read separately) Full game prediction edit form with scores, penalties, boosts, keyboard navigation, and save/cancel controls.
- **GamePredictionEditControls** (FC) - `[Client]` - Calls: none - Uses: `useContext(GuessesContext), useTheme, useMediaQuery, useTranslations` - Renders: `Box, TextField, Checkbox, ToggleButtonGroup, GameBoostSelector, StepperScoreInput, Alert`

**File:** `app/components/game-result-edit-dialog.tsx`
Dialog for editing game results or guesses. Supports penalty shootouts, game date (for results), and game guess forms.
- **GameResultEditDialog** (FC) - `[Client]` - Calls: none - Uses: `useState, useEffect` - Renders: `Dialog, DateTimePicker, GamePredictionEditControls, TextField, Grid`

**File:** `app/components/game-view.tsx`
Displays a single game prediction card. Gets game data from context and renders CompactGameViewCard.
- **GameView** (FC) - `[Client]` - Calls: `calculateScoreForGame` - Uses: `useContext(GuessesContext), useTranslations` - Renders: `CompactGameViewCard`
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
Scrollable list of games with filter integration, auto-scroll to first unpredicted game, and keyboard navigation support.
- **GamesListWithScroll** (FC) - `[Client]` - Calls: none - Uses: `useContext(GuessesContext), useEditMode, useEditTrigger, useSession, useTranslations` - Renders: `Box, FlippableGameCard, EmptyGamesState`

**File:** `app/components/stepper-score-input.tsx`
Stepper input for scores with increment/decrement buttons, imperatively expose focus method.
- **StepperScoreInput** (FC) - `[Client]` - Calls: none - Uses: `useRef, useImperativeHandle` - Renders: `Box, IconButton, Typography`

**File:** `app/components/urgency-accordion-group.tsx`
Groups games into urgency tiers (urgent/warning/notice) with auto-expansion for unpredicted urgent games.
- **UrgencyAccordionGroup** (FC) - `[Client]` - Calls: none - Uses: `useRouter, useTranslations, useLocale, useCountdownContext, useMemo, useState, useEffect` - Renders: `Box, UrgencyAccordion`

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
Main games page with filter integration, edit parameter handling, and auto-scroll to next/urgent games.
- **UnifiedGamesPageContent** (FC) - `[Client]` - Calls: none - Uses: `useSearchParams, useRouter, useFilterContext, useEditTrigger, useContext(GuessesContext), useTheme, useMediaQuery, useMemo, useEffect, useState` - Renders: `ScrollShadowContainer, CompactPredictionDashboard, GameFilters, SecondaryFilters, GamesListWithScroll, Fab`
- **UnifiedGamesPageClient** (FC) - `[Client]` - Calls: none - Uses: none - Renders: `FilterContextProvider, UnifiedGamesPageContent`

**File:** `app/components/unified-games-page.tsx`
Server component that fetches all tournament data and renders client page with GuessesContext and EditTriggerContext.
- **UnifiedGamesPage** (FC) - `[Server]` - Calls: `getLoggedInUser, getTeamsMap, getGamesClosingWithin48Hours, getAllTournamentGames, getTournamentGameCounts, findGameGuessesByUserId, getPredictionDashboardStats, findTournamentById, findGroupsInTournament, findPlayoffStagesWithGamesInTournament, getTournamentPredictionCompletion` - Uses: none - Renders: `GuessesContextProvider, EditTriggerContextProvider, UnifiedGamesPageClient, PublicGamesPage`

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
- **SecondaryFilters** (FC) - `[Client]` - Calls: none - Uses: `useTranslations` - Renders: `FormControl, Select, MenuItem`

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
Loading component that redirects to last selected or first tournament while preserving query parameters.
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
Tab navigation for tournament pages: Matches, Qualified Teams, Individual Awards. Disables tabs for non-authenticated users.
- **GroupSelector** (FC) - `[Client]` - Calls: none - Uses: `useLocale, useTranslations, usePathname, useTheme` - Renders: `Tabs, Tab, Link, EmojiEventsIcon`
- **getTabSx** (fn) - Helper for tab styling
- **getSelectedTab** (fn) - Helper to determine active tab from pathname

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
- **TeamStandingsCards** (FC) - `[Client]` - Calls: none - Uses: `useTranslations, useMemo, useState` - Renders: `LayoutGroup, Box, TeamStandingCard`

**File:** `app/components/groups-page/types.ts`
Type definitions for team standings components (TeamStanding, TeamStandingsCardsProps, TeamStandingCardProps).
- **TeamStanding** (interface) - Complete team standing with position, stats, and qualification
- **TeamStandingsCardsProps** (interface) - Props for standings container
- **TeamStandingCardProps** (interface) - Props for individual standing card