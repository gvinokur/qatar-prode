# Components: Leaderboard & Stats

Part of the CODE-STRUCTURE.md system. See `CODE-STRUCTURE.md` for the full index and call graph.

**Last updated:** 2026-04-17

---

## Files

### app/components/leaderboard/types.ts
Type definitions for leaderboard UI including user stats, view props, card props, and rank change indicators.

- **No default exports** — Type definitions only (LeaderboardUser, LeaderboardViewProps, LeaderboardCardsProps, LeaderboardCardProps, RankChangeIndicatorProps, LeaderboardShareHandle). Re-exports Badge and TournamentBadgeConfig from badge-calculator.ts. LeaderboardUser includes `badges?: Badge[]`, `latestSnapshotPoints?: number`, `penultimateSnapshotPoints?: number` (replaces `yesterdayTotalPoints` removed in Story #277). LeaderboardCardsProps and LeaderboardViewProps include `tournamentBadgeConfig?: TournamentBadgeConfig`, `historyData?: ScoreHistoryResult`, and `materializedRanks?: Map<string, { currentRank: number; rankChange: number }>` (added Story #320). `previousScores?: unknown[]` removed from LeaderboardCardsProps (was unused dead prop). LeaderboardCardProps includes `badges?: Badge[]`.

### app/components/leaderboard/BadgeRow.tsx
Reusable badge display component rendering a flex row of emoji badges with tooltips.

- **BadgeRow(props: BadgeRowProps)**: `JSX.Element | null` — [Client] Renders a flex row of MUI Avatar elements wrapped in Tooltips. Returns null when badges array is empty. Each badge is a circle (Avatar, border-radius 50%) with a tinted background: alpha(success.light, 0.15) for positive, alpha(error.light, 0.15) for negative. No grayscale filter; badge type is conveyed by emoji semantics alone.
  Props: badges, sizePx (15|16|17|18|20), justify?, maxDisplay?
  Uses: useTranslations('groups.badges'), Avatar, Tooltip, Box, alpha

### app/components/leaderboard/LeaderboardView.tsx
Simple passthrough component — wraps LeaderboardCards with no tab logic. [Client]

- **LeaderboardView(props: LeaderboardViewProps)**: `JSX.Element` — [Client] Renders LeaderboardCards directly with all props passed through (scores, currentUserId, tournament, groupName, joinUrl, themeColor, shareRef, tournamentBadgeConfig, historyData, materializedRanks). No tab UI — history navigation is handled by AdminTabs in the parent page (Story #272 Amendment 1).
  Renders: LeaderboardCards

### app/components/leaderboard/LeaderboardCard.tsx
Expandable leaderboard card for individual user with collapsible detailed stats breakdown.

- **LeaderboardCard(props: LeaderboardCardProps)**: `JSX.Element` — [Client] Displays user rank, name, avatar, total points, and toggle for detailed breakdown (group/knockout/tournament stats with boost bonuses). Includes compare and share highlight buttons. Collapsed view shows badges below points (16px, flex-end). Expanded view shows "Insignias" section with badges (20px). When `compact=true` (Story #319): hides expand/collapse toggle, Compare and Share Highlight buttons, BadgeRow, per-row RankChangeIndicator, and Collapse detail section — preserves bg highlight, elevation, padding, and "You" bold text.
  Uses: useTheme, useTranslations('groups.leaderboard'), useTranslations('groups.badges'), RankChangeIndicator
  Renders: RankChangeIndicator (when not compact), BadgeRow (when not compact)

### app/components/leaderboard/LeaderboardCards.tsx
Cards layout wrapper managing leaderboard state (expanded cards, comparisons, ranking animations). Implements sharing modal for leaderboard and personal highlights.

- **LeaderboardCards(props: LeaderboardCardsProps)**: `JSX.Element` — [Client] Orchestrates leaderboard UI with expansion state, rank assignment from materialized data, rank-change indicators, head-to-head comparisons, and social sharing. Uses LayoutGroup for framer-motion animations. Renders off-screen LeaderboardTemplate and PersonalHighlightTemplate for image sharing. Computes badgeMap via useMemo from calculateBadges; builds rankHistoryMap from historyData.userHistories (when present). Rank and rankChange are sourced from `materializedRanks` prop (Story #320); falls back to positional rank (index + 1) when map is empty/undefined. Removed: calculateRanks, calculateRanksWithChange calls.
  Calls: calculateBadges (badge-calculator)
  Uses: useTranslations('groups.sharing'), useState, useMemo, useCallback, createPortal
  Renders: LeaderboardCard, HeadToHeadDialog, SharePreviewModal, LeaderboardTemplate, PersonalHighlightTemplate

### app/components/leaderboard/LeaderboardTable.tsx
Table-based leaderboard view (not currently exported; kept for legacy/future use).

- **LeaderboardTable(props: LeaderboardTableProps)**: `JSX.Element` — [Client] Responsive HTML table showing rank, player, total points, group/knockout breakdown (hidden on small screens). Highlights current user row.

### app/components/leaderboard/LeaderboardSkeleton.tsx
Loading skeleton UI mimicking card layout during data fetch.

- **LeaderboardSkeleton({ count?: number })**: `JSX.Element` — [Client] Renders skeleton cards with fixed stable keys. Default count = 5.

### app/components/leaderboard/LeaderboardError.tsx
Error state UI with optional retry button.

- **LeaderboardError({ onRetry? })**: `JSX.Element` — [Client] Displays error icon, message, and retry button if callback provided.

### app/components/leaderboard/RankChangeIndicator.tsx
Rank change chip display with up/down/neutral indicator.

- **RankChangeIndicator({ change, size? })**: `JSX.Element` — [Client] Displays green TrendingUpIcon + count for positive change, red TrendingDownIcon for negative, gray RemoveIcon for zero. Size = 'small' | 'medium'.

### app/components/leaderboard/rank-change-animations.tsx
Advanced animation utilities for rank transitions and celebration effects.

- **RankChangeIndicator({ rankChange, size? })**: `JSX.Element` — [Client] Animated rank change with framer-motion scale/fade (duration 0.3s backOut).
  Uses: useTheme, useState, useEffect, AnimatePresence, motion.div
- **AnimatedRankCell({ rank, rankChange?, children? })**: `JSX.Element` — [Client] Wraps TableCell with slide animation on rank change (+/-10px, 0.4s easeOut).
  Renders: RankChangeIndicator
- **AnimatedPointsCounter({ value, previousValue?, duration? })**: `JSX.Element` — [Client] Counter animation from previousValue to value (default 0.8s ease-out-quad). Colors text green on increase.
  Uses: useState, useEffect, useTheme
- **RankUpCelebration({ show, rankChange })**: `JSX.Element` — [Client] Green glow + confetti effect for rank improvements (1.5s duration). Triggers haptic feedback.
  Calls: triggerRankUpHaptic
  Renders: ConfettiEffect
- **StaggeredLeaderboardRow({ index, selected?, rankChange?, children })**: `JSX.Element` — [Client] TableRow wrapper with staggered fade-in (0.05s × index, max 10 rows, 0.3s total).
  Renders: RankUpCelebration

### app/components/leaderboard/HistoryTab.tsx
Wrapper component for the History tab content — renders score and rank charts from pre-loaded server data (Story #272). [Client]

- **HistoryTab({ historyData?, themeColor?, preStoredRankHistories? })**: `JSX.Element` — [Client] Displays empty state when historyData is undefined/isEmpty or tournamentStartDate is null. Otherwise renders ScoreHistoryChart and RankHistoryChart. When `preStoredRankHistories` is non-null, passes those pre-stored ranks to RankHistoryChart (merged with display names from historyData); falls back to computed ranks from historyData when null/undefined. Reads currentUserId from next-auth session.
  Uses: useSession, useTranslations('groups.history')
  Renders: ScoreHistoryChart, RankHistoryChart

### app/components/leaderboard/ScoreHistoryChart.tsx
Line chart showing total points over time for all group members (Story #272). [Client]

- **ScoreHistoryChart(props: ScoreHistoryChartProps)**: `JSX.Element` — [Client] Renders a MUI X Charts LineChart with one series per user. Current user highlighted with themeColor and wider line; others use palette colors. Missing dates produce gaps (no forward-fill except LOCF applied before this point in data pipeline). X-axis scaleType='time', spans startDate→endDate (YYYYMMDD as ms timestamp); tick format DD MMM. Title from i18n groups.history.totalPointsChartTitle. Card wrapper for visual grouping.
  Uses: useTranslations('groups.history'), @mui/x-charts

### app/components/leaderboard/RankHistoryChart.tsx
Line chart showing rank over time for all group members, Y-axis inverted with #N labels (Story #272). [Client]

- **RankHistoryChart(props: RankHistoryChartProps)**: `JSX.Element` — [Client] Same pattern as ScoreHistoryChart but Y-axis reversed=true (rank #1 at top), tick formatter '#'+v, domain 1→totalUsers. Tooltip rows sorted ascending by last known rank. Card wrapper for visual grouping.
  Uses: useTranslations('groups.history'), @mui/x-charts

### app/components/leaderboard/HeadToHeadDialog.tsx
Modal dialog for head-to-head comparison between two users across multiple metrics.

- **HeadToHeadDialog(props: HeadToHeadDialogProps)**: `JSX.Element` — [Client] Displays comparative stats (total points, group/playoff breakdown, accuracy metrics). Fetches data with useTransition. Includes sharing template for image export. Shows loading, error, or metric comparison with advantage highlights. Accepts currentUserBadges and opponentBadges; renders BadgeRow for each player in header and passes badges to HeadToHeadTemplate.
  Calls: getUserStatsForComparison
  Uses: useTransition, useState, useEffect, useTheme, useMediaQuery, useTranslations, createPortal
  Renders: MetricRow, SectionHeader, HeadToHeadTemplate, SharePreviewModal, BadgeRow

### app/components/tournament-stats/stats-tabs.tsx
Tab container for tournament stats (performance, accuracy, boosts, history) with scroll shadow support.

- **StatsTabs({ performanceTab, precisionTab, boostsTab, historyTab })**: `JSX.Element` — [Client] Renders 4 tabs (Performance, Accuracy, Boosts, History) with scrollable tab content (variant="scrollable" scrollButtons="auto"). Tab labels from useTranslations('stats').
  Uses: useState, useTranslations, ScrollShadowContainer
  Renders: TabPanel, ScrollShadowContainer

### app/components/tournament-stats/score-growth-chart.tsx
Stacked area chart showing user's cumulative score growth over tournament timeline, broken down by 6 score components (Story #279). [Client]

- **ScoreGrowthChart({ rows })**: `JSX.Element` — [Client] Renders a MUI X Charts LineChart with 6 stacked area series (total_game_score, total_boost_bonus, honor_roll_score, individual_awards_score, qualified_teams_score, group_position_score). X-axis scaleType='time' using YYYYMMDD-to-ms conversion; tick format DD MMM. Band labels from i18n stats.history.bands.*. Title from stats.history.title.
  Uses: useTranslations('stats'), @mui/x-charts

### app/components/tournament-stats/history-tab-card.tsx
Card wrapper for the History tab — renders empty state or ScoreGrowthChart (Story #279). [Client]

- **HistoryTabCard({ rows })**: `JSX.Element` — [Client] Renders empty state Typography (stats.history.emptyState) when rows is empty. Otherwise wraps ScoreGrowthChart in `Card variant="outlined"` + `CardContent` (matching leaderboard HistoryTab card pattern).
  Uses: useTranslations('stats'), Card, CardContent
  Renders: ScoreGrowthChart

### app/components/tournament-stats/performance-overview-card.tsx
Card displaying breakdown of user's total points across group stage, playoff, and tournament awards.

- **PerformanceOverviewCard(props: PerformanceOverviewCardProps)**: `JSX.Element` — [Client] Shows total points prominently, then nested breakdown: group stage (game points + boost bonus + qualified teams score + group positions), playoff (game points + boost bonus + honor roll + awards). Displays empty state if totalPoints = 0.
  Uses: useTheme, useTranslations('stats')

### app/components/tournament-stats/boost-analysis-card.tsx
Card showing silver/golden boost allocation, usage, success rate, ROI, and distribution by group.

- **BoostAnalysisCard(props: BoostAnalysisCardProps)**: `JSX.Element` — [Client] Two-section layout (silver/golden). Displays available, locked (with %), active, scored games (with %), points earned, ROI. Distribution summary shows group allocation (A: 2, B: 1) + playoffs count. Empty state if no boosts used.
  Uses: useTheme, useTranslations('stats')

### app/components/tournament-stats/prediction-accuracy-card.tsx
Card displaying prediction completion and accuracy metrics (correct, exact, missed) by overall and stage.

- **PredictionAccuracyCard(props: PredictionAccuracyCardProps)**: `JSX.Element` — [Client] Summary section (predictions made, completion %, games played) + overall accuracy section (correct %, exact %, missed %) + by-phase breakdown (group/playoff with correct/exact %). Empty state if totalPredictionsMade = 0.
  Uses: useTheme, useTranslations('stats')

### app/components/qualified-teams/qualified-teams-context.tsx
Context provider for managing qualified team predictions with optimistic updates, save state, and rollback on error.

- **QualifiedTeamsContextProvider(props: QualifiedTeamsContextProviderProps)**: `JSX.Element` — [Server/Client] Wraps children with prediction state (Map of QualifiedTeamPrediction keyed by teamId). Manages save state machine (idle/saving/saved/error) with 2s auto-return to idle. Batch updates entire group via updateGroupPositionsJsonb. Rollback on error. Mount cleanup via isMountedRef.
  Calls: updateGroupPositionsJsonb
  Uses: useState, useCallback, useRef, useEffect, useMemo, useLocale, toLocale, createContext
- **useQualifiedTeamsContext()**: `QualifiedTeamsContextValue` — [Client] Hook to access context. Throws if used outside provider.

### app/components/qualified-teams/qualified-teams-client-page.tsx
Main qualified teams prediction UI with drag-and-drop reordering, third place selection, and completion dashboard.

- **QualifiedTeamsClientPage(props: QualifiedTeamsClientPageProps)**: `JSX.Element` — [Client] Root component wrapping QualifiedTeamsUI with QualifiedTeamsContextProvider. Passes initialPredictions, tournamentId, userId, isLocked.
  Renders: QualifiedTeamsContextProvider, QualifiedTeamsUI
- **QualifiedTeamsUI(...)**: `JSX.Element` — [Client] DnD interface with CompactPredictionDashboard header. Mobile: full-page scroll; Desktop: ScrollShadowContainer. Handles drag-end (batch position/qualification updates), third-place toggle, save state snackbars (success/error/locked alert), and loading backdrop. Wraps QualifiedTeamsGrid in DndContext. Shows instructions popover.
  Calls: createDragEndHandler (returns handler for drag-end events)
  Uses: useMemo, useState, useEffect, useCallback, useTheme, useMediaQuery, useTranslations, useSensors, DndContext, GuessesContextProvider, ScrollShadowContainer
  Renders: CompactPredictionDashboard, Popover, DndContext, QualifiedTeamsGrid, Snackbar (success/error/locked), Backdrop, GuessesContextProvider

### app/components/qualified-teams/qualified-teams-grid.tsx
Responsive grid layout for group cards (1 column XS-M, 2 columns L+).

- **QualifiedTeamsGrid(props: QualifiedTeamsGridProps)**: `JSX.Element` — [Client] Maps groups to GroupCard components with responsive sizing. Builds lookup map for group scoring results.
  Renders: GroupCard

### app/components/qualified-teams/group-card.tsx
Group card with draggable team cards, expandable on mobile, shows scoring results when group complete.

- **GroupCard(props: GroupCardProps)**: `JSX.Element` — [Client] Mobile: Accordion (collapsible); Desktop: Card. Renders SortableContext with DraggableTeamCards. Calculates qualified count, group points total (when complete), and pending 3rd place state. Shows GroupHeader with check mark if group touched. Reduces opacity during save (isSaving).
  Renders: GroupHeader, SortableContext, DraggableTeamCard, Accordion/Card
- **GroupHeader(...)**: `JSX.Element` — [Client] Displays group letter ("Group A"), optional points, and success check mark if group touched.

### app/components/qualified-teams/draggable-team-card.tsx
Draggable team card with position badge, qualification checkbox (position 3 only), and results overlay.

- **DraggableTeamCard(props: DraggableTeamCardProps)**: `JSX.Element` — [Client] Uses dnd-kit useSortable for drag-and-drop (disabled when locked/saving). Displays position badge (1°, 2°, 3°, 4°), team name, and optional third-place checkbox (position 3 only, hidden when `allowsThirdPlace` is false or tournament is locked; disabled if limit reached). BorderColor logic: green for qualified, red for non-qualified, blue for pending, transparent for position 4+. Results overlay shows chip + explanation (pending, points awarded 0-2, or did-not-qualify).
  Uses: useTheme, useTranslations('qualified-teams'), useSortable, CSS.Transform
  Renders: DragHandle, PositionBadge, TeamInfo, ThirdPlaceCheckbox, ResultsOverlay

### app/components/qualified-teams/third-place-summary.tsx
Summary panel showing selected third place qualifiers and progress towards max limit.

- **ThirdPlaceSummary(props: ThirdPlaceSummaryProps)**: `JSX.Element` — [Client] Shows count/max with LinearProgress. Lists selected teams as chips. Displays alert if over limit or no selection. Hidden if !allowsThirdPlace.
  Uses: useMemo, useTranslations('qualified-teams')
  Renders: TeamChip, ProgressIndicator