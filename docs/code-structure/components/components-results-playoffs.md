# Components: Results & Playoffs

Part of the CODE-STRUCTURE.md system. See `CODE-STRUCTURE.md` for the full index and call graph.

**Last updated:** 2026-05-01

---

## Files

### app/components/results-page/bracket-layout-utils.ts
Utility functions and constants for calculating playoff bracket layout positions and SVG connection paths. Exports interfaces and helper functions.

- **BracketRound**: `interface` — Represents a round in the playoff bracket with games and column index.
- **GamePosition**: `interface` — Represents the x,y position of a game in the bracket.
- **BRACKET_CONSTANTS**: `const object` — Contains dimensions and spacing constants (GAME_CARD_HEIGHT, GAME_CARD_WIDTH, ROUND_SPACING, etc.).
- **calculateGamePositions(rounds: BracketRound[])**: `GamePosition[]` — Calculates absolute positions for each game in the bracket.
- **calculateConnectionPath(fromPosition: GamePosition, toPosition: GamePosition)**: `string` — Generates SVG path for L-shaped connector lines between games.
- **calculateBracketDimensions(rounds: BracketRound[], isMobile?: boolean, hasThirdPlace?: boolean)**: `{ width: number; height: number }` — Calculates total bracket container dimensions.
- **buildOrderedBracketRounds(mainStages, gamesMap, gamesByNumber)**: `BracketRound[]` — Returns bracket rounds with games ordered by actual bracket tree structure, derived by traversing TeamWinnerRule references from the final backwards. Fixes SVG connection lines that would otherwise point to wrong game pairs when DB insertion order differs from bracket order.
  Calls: isTeamWinnerRule (from app/utils/playoffs-rule-helper)

### app/components/results-page/loading-skeleton.tsx
Loading skeleton component that displays placeholder cards while data loads.

- **LoadingSkeleton()**: `JSX.Element` — [Client] Shows 8 skeleton cards with MUI Skeleton components.
  Renders: Grid, Skeleton, Paper

### app/components/results-page/bracket-game-card.tsx
Minimalistic game card for playoff bracket display showing team names and scores. Uses C2 winner styling: winner name+score → text.primary/bold, loser name+score → text.secondary/normal. No primary.main color used.

- **BracketGameCard({ game, teamsMap }: BracketGameCardProps)**: `JSX.Element` — [Client] Displays team names with scores, highlights winner with C2 (text.primary/bold), dims loser (text.secondary), shows penalty results.
  Calls: formatPenaltyResult, getGameWinner, getTeamDescription
  Uses: useTranslations

### app/components/results-page/group-result-card.tsx
Card showing group games and standings with collapsible sections for mobile.

- **GroupResultCard({ group, games, qualifiedTeams }: GroupResultCardProps)**: `JSX.Element` — [Client] Mobile-collapsible, desktop always-expanded card with games list and team standings.
  Renders: MinimalisticGamesList, TeamStandingsCards

### app/components/results-page/groups-stage-view.tsx
Displays groups stage results in a responsive grid layout (1-3 columns based on viewport).

- **GroupsStageView({ groups, games, qualifiedTeams }: GroupsStageViewProps)**: `JSX.Element` — [Client] Renders one GroupResultCard per group sorted alphabetically.
  Renders: GroupResultCard

### app/components/results-page/minimalistic-games-list.tsx
Simple read-only list of all games showing team names and scores with penalty shootouts. Applies C2 winner styling to home/away name spans (winner → bold + text.primary, loser → normal + text.secondary).

- **MinimalisticGamesList({ games, teamsMap }: MinimalisticGamesListProps)**: `JSX.Element` — [Client] Sorts games by number, displays in flex column, calls getGameWinner per game for C2 name highlighting.
  Calls: formatGameScore, getTeamDescription, getGameWinner
  Uses: useTranslations

### app/components/results-page/results-page-client.tsx
Client wrapper providing tabs to switch between Groups and Playoffs views.

- **ResultsPageClient({ groups, qualifiedTeams, games, teamsMap, playoffStages }: ResultsPageClientProps)**: `JSX.Element` — [Client] Tab-based view with Groups and Playoffs tabs, uses ScrollShadowContainer for scrollable content.
  Renders: GroupsStageView, PlayoffsBracketView

### app/components/results-page/playoffs-bracket-view.tsx
Displays playoff bracket with SVG connection lines and game cards positioned absolutely.

- **PlayoffsBracketView({ playoffStages, games, teamsMap }: PlayoffsBracketViewProps)**: `JSX.Element` — [Client] Renders horizontally-scrollable bracket with positioned cards and SVG connectors, includes third-place playoff.
  Calls: buildOrderedBracketRounds, calculateGamePositions, calculateConnectionPath, calculateBracketDimensions
  Uses: useTranslations, useMemo, useTheme, useMediaQuery
  Renders: BracketGameCard

### app/components/playoffs/tabbed-playoff-page.tsx
Tabbed interface for playoff rounds with optional prediction dashboard or games grid.

- **TabbedPlayoffsPage(props: TabbedPlayoffsPageProps)**: `React.FC` — [Client] Renders tabs for each playoff section, auto-selects tab closest to today's date.
  Uses: useCallback, useEffect, useState, useTheme, useMediaQuery
  Renders: Tabs, GamesGrid, PredictionDashboard

### app/components/tournament-page/expand-more.tsx
Styled IconButton component with rotate animation for expand/collapse controls.

- **ExpandMore(props: ExpandMoreProps)**: `StyledComponent` — [Client] IconButton styled to rotate 180 degrees when expanded.

### app/components/tournament-page/join-group-dialog.tsx
Dialog for joining a group with a code input field.

- **JoinGroupDialog({ open, onClose }: JoinGroupDialogProps)**: `JSX.Element` — [Client] Dialog with code input, validation, and navigation to join page.
  Uses: useState, useRouter, useLocale, useTranslations

### app/components/tournament-page/rules-examples/match-prediction-time.tsx
Displays translation text for match prediction time constraints.

- **MatchPredictionTimeExample()**: `JSX.Element` — [Client] Renders translated constraint text.
  Uses: useTranslations

### app/components/tournament-page/rules-examples/podium-prediction-time.tsx
Displays translation text for podium prediction time constraints.

- **PodiumPredictionTimeExample()**: `JSX.Element` — [Client] Renders translated constraint text.
  Uses: useTranslations

### app/components/tournament-page/rules-examples/single-prediction.tsx
Displays translation text for single prediction constraints.

- **SinglePredictionExample()**: `JSX.Element` — [Client] Renders translated constraint text.
  Uses: useTranslations

### app/components/tournament-page/rules-examples/champion.tsx
Displays translated scoring text for champion prediction with points parameter.

- **ChampionExample({ points }: ChampionExampleProps)**: `JSX.Element` — [Client] Renders translated text with point value.
  Uses: useTranslations

### app/components/tournament-page/rules-examples/exact-score.tsx
Displays translated scoring text for exact score prediction with three parameters.

- **ExactScoreExample({ total, correctOutcome, bonus }: ExactScoreExampleProps)**: `JSX.Element` — [Client] Renders translated text with point breakdown.
  Uses: useTranslations

### app/components/tournament-page/rules-examples/group-position.tsx
Displays translated scoring text for group position prediction with qualified and exact position points.

- **GroupPositionExample({ qualifiedPoints, exactPositionPoints, totalPoints }: GroupPositionExampleProps)**: `JSX.Element` — [Client] Renders translated text with point values.
  Uses: useTranslations

### app/components/tournament-page/rules-examples/individual-awards.tsx
Displays translated scoring text for individual awards prediction with points parameter.

- **IndividualAwardsExample({ points }: IndividualAwardsExampleProps)**: `JSX.Element` — [Client] Renders translated text with point value.
  Uses: useTranslations

### app/components/tournament-page/rules-examples/qualified-teams-prediction-time.tsx
Displays translation text for qualified teams prediction time constraints.

- **QualifiedTeamsPredictionTimeExample()**: `JSX.Element` — [Client] Renders translated constraint text.
  Uses: useTranslations

### app/components/tournament-page/rules-examples/runner-up.tsx
Displays translated scoring text for runner-up prediction with points parameter.

- **RunnerUpExample({ points }: RunnerUpExampleProps)**: `JSX.Element` — [Client] Renders translated text with point value.
  Uses: useTranslations

### app/components/tournament-page/rules-examples/third-place.tsx
Displays translated scoring text for third-place prediction with points parameter.

- **ThirdPlaceExample({ points }: ThirdPlaceExampleProps)**: `JSX.Element` — [Client] Renders translated text with point value.
  Uses: useTranslations

### app/components/tournament-page/rules-examples/winner-draw.tsx
Displays translated scoring text for winner/draw prediction with points parameter.

- **WinnerDrawExample({ points }: WinnerDrawExampleProps)**: `JSX.Element` — [Client] Renders translated text with point value.
  Uses: useTranslations

### app/components/tournament-page/rules-examples/round-of-16.tsx
Displays translated scoring text for round of 16 (actually roundOf32) prediction with points parameter.

- **RoundOf16Example({ points }: RoundOf16ExampleProps)**: `JSX.Element` — [Client] Renders translated text with point value (mistakenly renders roundOf32).
  Uses: useTranslations

### app/components/tournament-page/scrollable-content-area.tsx
Wrapper component providing scrollable content area with background color and scroll shadow.

- **ScrollableContentArea({ children }: ScrollableContentAreaProps)**: `JSX.Element` — [Client] Renders children in scrollable container with alpha-blended background.
  Renders: ScrollShadowContainer

### app/components/tournament-page/public-cta-bar.tsx
CTA bar for logged-off users with login/signup and onboarding options. Used in both games page (sticky) and dashboard banner area (non-sticky).

- **LoggedOffBanner({ sticky?: boolean })**: `JSX.Element` — [Client] Renders `primary.main` background bar with info icon, CTA message, and two action buttons. When `sticky=true`, applies `position: sticky, top: 0, zIndex: 1000` (games page usage); omitting `sticky` renders non-sticky (dashboard banner usage). Manages `openAuthDialog` and `openOnboarding` state.
  Uses: useState, useTranslations
  Renders: LoginOrSignupDialog, OnboardingDialogClient (conditional)

### app/components/tournament-page/public-games-page-client.tsx
Client component displaying games list for public tournament view with optional CTA overlays.

- **PublicGamesPageClient({ games, teamsMap, groups, rounds }: PublicGamesPageClientProps)**: `JSX.Element` — [Client] Sorts and displays games with CTA overlay on every 5th card.
  Uses: useMemo, useTranslations
  Renders: LoggedOffBanner, ReadOnlyGameCard

### app/components/tournament-page/public-games-page.tsx
Server component fetching and passing game data to PublicGamesPageClient.

- **PublicGamesPage({ tournamentId }: PublicGamesPageProps)**: `Promise<JSX.Element>` — [Server] Fetches games, teams, groups, and playoff rounds in parallel; applies locale-aware localization on playoff round names before passing to client.
  Calls: getAllTournamentGames, getTeamsMap, findGroupsInTournament, findPlayoffStagesWithGamesInTournament, applyLocalization
  Renders: PublicGamesPageClient

### app/components/tournament-page/tournament-sidebar.tsx
Multi-section sidebar (Friend Groups, Group Standings, Stats, Rules) with navigation awareness.

- **TournamentSidebar(props: TournamentSidebarProps)**: `JSX.Element` — [Client] Renders conditional sections based on props and highlights active section. Props: `tournamentId`, `scoringConfig?`, `userGameStatistics?`, `tournamentGuess?`, `groupStandings?`, `prodeGroups?`, `user?`, `groupRanks?: Record<string, number>`. Sections rendered in order: Friend Groups (first), Group Standings, Stats, Rules.
  Uses: usePathname
  Renders: FriendGroupsList, GroupStandingsSidebar, UserTournamentStatistics, Rules

### app/components/tournament-page/empty-groups-state.tsx
Deprecated empty state component for groups (replaced by FriendGroupsLandingEmptyState).

- **EmptyGroupsState({ onCreateGroup, onDiscoverGroups }: EmptyGroupsStateProps)**: `JSX.Element` — [Client] Displays trophy icon and action buttons for creating or discovering groups.
  Uses: useTranslations

### app/components/tournament-page/friend-groups-list.tsx
Card showing user groups, participant groups, and pending requests with create/delete dialogs and optional rank badges.

- **FriendGroupsList(props: Props)**: `JSX.Element` — [Client] Collapsible card with combined sorted group list, create/delete dialogs, invite functionality, and empty state. Accepts `favoriteGroupIds?: string[]` and `mainGroupId?: string | null`; sorts groups main → favorites (alpha) → others. Renders star (StarIcon/StarBorderIcon) and crown (WorkspacePremiumIcon) icon buttons per row. Optimistic local state updated immediately; server actions called via useTransition.
  Props: `userGroups`, `participantGroups`, `tournamentId?`, `isActive?`, `pendingRequests?`, `groupRanks?`, `favoriteGroupIds?`, `mainGroupId?`
  Calls: createDbGroup, deleteGroup, toggleFavoriteGroupAction, setMainGroupAction
  Uses: useState, useTransition, useTheme, useLocale, useRouter, useForm, useTranslations
  Renders: FriendGroupsSidebarEmptyState, InviteFriendsDialog, ExpandMore, Chip

### app/components/tournament-page/group-standings-sidebar.tsx
Accordion card displaying group standings with carousel navigation (arrow buttons and keyboard/swipe support).

- **GroupStandingsSidebar(props: GroupStandingsSidebarProps)**: `JSX.Element` — [Client] Carousel-style group selector with prev/next buttons, keyboard navigation, and touch swipe support.
  Uses: useState, useEffect, useRef, useTheme, useLocale, useTranslations
  Renders: TeamStandingsCards, ExpandMore

### app/components/tournament-page/read-only-game-card.tsx
Read-only game card with optional CTA overlay for authentication.

- **ReadOnlyGameCard(props: ReadOnlyGameCardProps)**: `JSX.Element` — [Client] Displays game info with disabled editing, shows auth CTA overlay on specific cards.
  Uses: useState, useTranslations
  Renders: CompactGameViewCard, LoginOrSignupDialog

### app/components/tournament-page/rules.tsx
Comprehensive rules and constraints display with expandable sections and example components.

- **ScoringConfig**: `type` — Re-exported from `app/utils/scoring-config.ts`. Configuration object for tournament-specific point values.
- **Rules(props: RulesProps)**: `JSX.Element` — [Client] Renders four `RuleCategory` sections (Matches, Qualified Teams, Awards & Champion, Tournament Logic), each with Scoring/Deadlines/General subsections. Scoring rows show incremental point chips (+1/+1/+1 hierarchy). Zero-point rows use Cancel icon. Boost rows (silver/gold) shown only when `max_silver_games`/`max_golden_games > 0`. Boost timing text rendered in Deadlines subsection. Supports `fullpage` mode (expandable examples per scoring rule) and card mode. Accepts optional `lockDate?: string` (pre-formatted date for QT/Awards lock constraint; falls back to `lockDateFallback` i18n string when absent).
  Uses: useState, useTheme, useLocale, useTranslations
  Renders: GoalDifferenceExample, WinnerDrawExample, ExactScoreExample, RoundOf16Example, ChampionExample, RunnerUpExample, ThirdPlaceExample, IndividualAwardsExample, MatchPredictionTimeExample, PodiumPredictionTimeExample, SinglePredictionExample, GroupPositionExample, QualifiedTeamsPredictionTimeExample, ExpandMore

### app/components/tournament-page/tournament-group-card.tsx
Card component for displaying group info with dual variant support (my-groups and discovery).

- **DiscoveryGroupData**: `interface` — Data structure for public group discovery.
- **TournamentGroupCard(props: TournamentGroupCardProps)**: `JSX.Element` — [Client] Renders different UI based on variant (my-groups with stats/actions, discovery with request-to-join). Supports pending request blur effect. my-groups variant: group name is a clickable Next.js Link; star icon button toggles favorite; crown icon shown when isMainGroup=true.
  Props (my-groups only): `isFavorite?: boolean`, `isMainGroup?: boolean`, `onToggleFavorite?: (groupId: string) => void`, `onSetMainGroup?: (groupId: string) => void`
  Uses: useLocale, useTranslations
  Renders: PrivacyIndicatorIcon, InviteFriendsDialog

### app/components/tournament-page/tournament-groups-list.tsx
Main groups list with create/discover dialogs and grid display of group cards.

- **TournamentGroupsList({ groups, tournamentId, pendingRequests, favoriteGroupIds, mainGroupId }: TournamentGroupsListProps)**: `JSX.Element` — [Client] Renders grid of group cards sorted by favorites (main → favorites alpha → others), shows empty state when no groups, includes create dialog. Optimistic favorite state updated immediately; server actions called via useTransition.
  Props: `groups`, `tournamentId`, `pendingRequests?`, `favoriteGroupIds?: string[]`, `mainGroupId?: string | null`
  Calls: createDbGroup, toggleFavoriteGroupAction, setMainGroupAction
  Uses: useState, useTransition, useForm, useTranslations, useLocale, useRouter
  Renders: FriendGroupsLandingEmptyState, TournamentGroupCard, Dialog

### app/components/tournament-page/user-tournament-statistics.tsx
Card showing user's tournament scores broken down by category (groups, playoffs, qualified, awards).

- **StatRow(props: StatRowProps)**: `JSX.Element` — [Client] Helper component for label/value stat rows.
- **UserTournamentStatistics(props: Props)**: `JSX.Element` — [Client] Collapsible card displaying score breakdown and grand total.
  Uses: useState, useTheme, useLocale, useTranslations
  Renders: ExpandMore

### app/components/tournament-bottom-nav/tournament-bottom-nav-wrapper.tsx
Conditional wrapper that renders TournamentBottomNav only on mobile breakpoints.

- **TournamentBottomNavWrapper({ tournamentId, user }: TournamentBottomNavWrapperProps)**: `JSX.Element` — [Client] Returns null on desktop, renders TournamentBottomNav on mobile.
  Uses: usePathname, useTheme, useMediaQuery

### app/components/tournament-bottom-nav/tournament-bottom-nav.tsx
Fixed bottom navigation for tournament pages with 5 action tabs (home, results, rules, groups, stats).

- **TournamentBottomNav({ tournamentId, currentPath, user }: TournamentBottomNavProps)**: `JSX.Element` — [Client] BottomNavigation with conditional tabs (groups/stats hidden if not logged in), auto-selects tab based on pathname. Tab order: Home, Results, Rules, Groups, Stats. Home tab always navigates to `/${locale}/tournaments/${tournamentId}` (root hub). Root tournament path activates 'main-home'.
  Calls: none
  Uses: useState, useEffect, useRouter, useLocale, useTranslations