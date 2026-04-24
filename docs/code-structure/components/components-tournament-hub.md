# Components — Tournament Hub

Part of the CODE-STRUCTURE.md system. See `CODE-STRUCTURE.md` for the full index and call graph.

**Last updated:** 2026-04-24

---

## Files

### app/components/tournament-hub/dashboard-banner.tsx
Server Component stacking hero + secondary CTA banners in the dashboard Banner Area.

- **DashboardBanner({ user, timing, data })**: `Promise<JSX.Element | null>` — [Server] Receives pre-fetched `TournamentTiming | null` (always available, even for guests) and `ActionCenterData | null` (auth-gated, null for guests). Hero layer reads from `timing`: renders `TournamentStartBanner` when `timing?.tournamentJustStarted`; else `PreTournamentCountdown` when `timing && !timing.tournamentHasStarted && timing.firstGameDate !== null`; else null. Secondary layer: renders `LoggedOffBanner` when `!user`; else `TutorialCTACard fullWidth` when `data && computeIsIncompleteUser(data)` returns true; else null. Returns null when both layers are null; otherwise wraps non-null banners in `Stack gap={2}`.
  Calls: computeIsIncompleteUser
  Renders: TournamentStartBanner (conditional), PreTournamentCountdown (conditional), LoggedOffBanner (conditional), TutorialCTACard (conditional)

### app/components/tournament-hub/dashboard-card.tsx
Reusable presentational Server Component establishing the standard card layout for all hub widgets.

- **DashboardCard({ title, icon, count, children, urgent })**: `JSX.Element` — [Server] Renders MUI `Card variant="outlined"` with a standardized `CardHeader` (32×32 Avatar with purple tint containing `icon`, `Typography subtitle1 fontWeight:700` title, optional `count` Typography caption in action slot) and `CardContent` with `flexGrow:1`. `borderColor` switches to `error.main` when `urgent=true`, otherwise `divider`.
  Calls: (none — pure MUI composition)

### app/components/tournament-hub/tournament-hub-action-center.tsx
Thin Server Component wrapper for the hub's Action Center widget. Calls the server action and delegates rendering to the client carousel.

- **TournamentHubActionCenter({ tournamentId, locale, data? })**: `JSX.Element | null` — [Server] Uses `data` prop when provided (pre-fetched by page.tsx); otherwise calls `getActionCenterGames`. Returns `null` when `data.tournamentFinished`. Calls `computeIsIncompleteUser(data)`; when true, renders `PreTournamentNewUserActionCenter`; otherwise renders `ActionCenterCarousel`.
  Calls: getActionCenterGames (conditional), computeIsIncompleteUser
  Renders: PreTournamentNewUserActionCenter (conditional), ActionCenterCarousel

### app/components/tournament-hub/pre-tournament-new-user-action-center.tsx
Server Component rendering the full "incomplete user" Action Center layout for pre-tournament users with low prediction progress.

- **PreTournamentNewUserActionCenter({ data, tournamentId, locale })**: `JSX.Element` — [Server] Calls `getTranslations('hub')`, `getTranslations('rules.rules')`, and `getTranslations('rules.constraints')`. Calls `getRulesBySection(data.scoringConfig, tRules)` for scoring rule labels and `getConstraintsBySection(tConstraints, lockDate)` for per-section deadline strings. `lockDate` is computed from `data.firstGameDate + PREDICTION_LOCK_OFFSET_MS` (2 days) formatted via `Intl.DateTimeFormat`. Computes per-track progress percentages and 4-state CTA labels (cta / ctaKeep / ctaFinish / ctaReview) keyed by progress thresholds. Renders: (1) `PreTournamentCountdown` when `data.firstGameDate !== null`; (2) `TutorialCTACard`; (3) three `PredictionTrackCard` sub-components (Matches, Qualified Teams, Awards).
  Calls: getTranslations, getRulesBySection, getConstraintsBySection
  Renders: PreTournamentCountdown, TutorialCTACard, PredictionTrackCard

- **PredictionTrackCard(props)**: `JSX.Element` — Server-compatible sub-component (not exported). Props include `deadline: string | null` and `deadlineLabel: string` in addition to icon, title, description, rules, progress, CTA, etc. Renders an outlined Paper card with: icon + title + completed/total count row; description; dashed-border deadline box (`ScheduleIcon` + label + date text, omitted when `deadline === null`); dashed-border scoring rules box (`AddCircleOutlineIcon` + scoringLabel header + one rule per line); `LinearProgress` bar; CTA `Button` (Link). `isComplete=true` switches CTA to outlined variant with `CelebrationIcon`, progress bar color to 'success'.
  Icon usage: `SportsSoccerIcon` (Matches), `AccountTreeIcon` (Qualified Teams), `EmojiEventsIcon` (Awards), `ScheduleIcon` (deadline), `AddCircleOutlineIcon` (scoring rules).

### app/components/tournament-hub/tutorial-cta-card.tsx
Client Component for the "New to Prode?" tutorial CTA. Opens the onboarding dialog on button click.

- **TutorialCTACard({ fullWidth?: boolean })**: `JSX.Element` — [Client] Renders an outlined Paper card with `HelpOutlineIcon` avatar, title + subtitle text, and a "View Tutorial" Button. When `fullWidth=true`, Paper is full-width with `p: 3` (default `p: 2`). Manages `const [open, setOpen] = useState(false)`. On click sets `open=true` and renders `{open && <OnboardingDialogClient initialOpen={true} onClose={() => setOpen(false)} />}`. Uses `dynamic` import for `OnboardingDialogClient` (ssr: false) to avoid bundle impact.
  Uses: useState, useTranslations, Paper, Stack, Typography, Button, Avatar, HelpOutlineIcon
  Renders: OnboardingDialogClient (conditional)

### app/components/tournament-hub/pre-tournament-hero.tsx
Client Component countdown shown above the Action Center when the tournament hasn't started yet. Renders a live days/hours/mins countdown with an animated hourglass and optional tournament name subtitle.

- **PreTournamentCountdown({ firstGameDate, tournamentName })**: `JSX.Element` — [Client] Gradient Paper with secondary border. Renders a flip-animated `HourglassEmptyIcon`, a `Stack direction="row"` with days/hours/mins values computed from `firstGameDate - Date.now()` via `useEffect+setInterval(1000)` (clamped at 0). Conditionally renders a body2 subtitle with `countdownSubtitle` i18n key when `tournamentName` is non-null.
  Uses: useState, useEffect, useTranslations, Paper, Stack, Box, Typography, useTheme, HourglassEmptyIcon

### app/components/tournament-hub/tournament-start-banner.tsx
Client Component celebration banner shown above the Action Center carousel for 48h after the tournament's first game kicks off. No props — all display is self-contained.

- **TournamentStartBanner()**: `JSX.Element` — [Client] Gradient Paper matching the countdown style (secondary tint, secondary border). Renders `CelebrationIcon`, h6 title, and body2 subtitle. No link button (removed per UX feedback).
  Uses: useTranslations, Paper, Stack, Typography, useTheme, CelebrationIcon

### app/components/tournament-hub/social-hub-card.tsx
Client Component social CTA shown in the Leaderboard widget when the user belongs to 0 groups.

- **SocialHubCard({ locale, tournamentId, loginHref? })**: `JSX.Element` — [Client] Full-height `Stack` (`flexGrow: 1`, `justifyContent: 'space-between'`). Content area is an inner Stack with `flexGrow: 1` + `justifyContent: 'center'` so it stretches to fill remaining grid cell height. Renders `GroupAddIcon` (40px, secondary), subtitle2 title, two body2 description lines (description + joinHint). When `loginHref` is provided (logged-off mode): renders a single full-width contained "Log in" Button. Otherwise (default mode): renders a row of two size="small" Buttons (Create Group contained + Find Public Group outlined, each `flex: 1`) and a text-secondary "Learn more about groups" link below.
  Uses: useTranslations, Stack, Typography, Button, GroupAddIcon, Link

### app/components/tournament-hub/pre-tournament-groups-preview.tsx
Client Component shown in the Leaderboard widget when the user has groups but no ranking data yet (pre-tournament). Shows group name chips and 3 CTAs.

- **PreTournamentGroupsPreview({ allGroupNames, locale, tournamentId })**: `JSX.Element` — [Client] Outer `Stack` with `height: '100%'` + `justifyContent: 'space-between'` to pin CTA to bottom. Outlined `Paper` with `flexGrow: 1` fills remaining height; inner content is flex-centered (`justifyContent: 'center'`). Paper renders "You're in" text + up to 3 group name `Chip` links (each linking to that group's page); appends "and N others." when `allGroupNames.length > 3`; below that, `EmojiEventsIcon` + "Rankings pending" text. Single full-width outlined "See all your groups" Button (`seeAllGroups` key) anchored to the bottom outside the Paper.
  Uses: useTranslations, Box, Stack, Paper, Typography, Button, Chip, EmojiEventsIcon, Link

### app/components/tournament-hub/action-center-carousel.tsx
Client Component for the Action Center carousel. Manages card edit state (one card open at a time) and wires FlippableGameCard instances with GuessesContextProvider for inline prediction saving.

- **ActionCenterCarousel({ data, tournamentId, locale })**: `JSX.Element` — [Client] Wraps content in `GuessesContextProvider` (autoSave=true). Renders `TournamentStartBanner` above everything when `data.tournamentJustStarted`. Renders `PreTournamentCountdown` above header when `!data.tournamentHasStarted && data.firstGameDate !== null`. Renders header (title/subtitle). Optionally renders "Opening Match" overline when `data.openerBackfill`. Branches: empty mode → dashed box; fallback/urgent mode → single-card view with `VerticalNav` (when `data.games.length > 1`) and one `FlippableGameCard` for `data.games[visibleIndex]`. `handleAutoAdvanceNext`/`handleAutoGoPrevious` update both `editingGameId` and `visibleIndex`. When `data.qtAndAwardsOpen`: renders a `Stack direction="row"` of 3 `TrackedCircularProgress` circles (inline helper component) for QT, Awards, and Games, each linking to its page.
  Renders: TournamentStartBanner (conditional), PreTournamentCountdown (conditional), FlippableGameCard, VerticalNav (inline)
  Uses: GuessesContextProvider, useTranslations, TrackedCircularProgress (inline), AccountTreeIcon, EmojiEventsIcon, SportsSoccerIcon, KeyboardArrowUpIcon, KeyboardArrowDownIcon
- **VerticalNav({ current, total, onUp, onDown })**: `JSX.Element` — [Client, inline in action-center-carousel] Up/down `IconButton` (bordered) + 3-dot position indicator. Up disabled when `current === 0`, down disabled when `current === total - 1`.

### app/components/tournament-hub/tournament-hub-leaderboard-peek.tsx
Async Server Component for the Leaderboard Peek widget. Fetches the current user's friend-group standings and branches on group membership and ranking state.

- **TournamentHubLeaderboardPeek({ tournamentId, locale, isAuthenticated })**: `JSX.Element` — [Server] Four branches — skips `getLeaderboardPeekData` when `!isAuthenticated`. (0) `!isAuthenticated` → single `DashboardCard` wrapping `SocialHubCard` with `loginHref`; (1) `!userHasGroups` → single `DashboardCard` wrapping `SocialHubCard` (default mode); (2) `userHasGroups && groups.length === 0` → single `DashboardCard` wrapping `PreTournamentGroupsPreview`; (3) `groups.length > 0` → React Fragment with one `LeaderboardPeekCard` per group (each renders as its own CSS Grid cell). Integrated into the hub page widget grid via `Suspense`.
  Calls: getLeaderboardPeekData
  Renders: DashboardCard, SocialHubCard, PreTournamentGroupsPreview, LeaderboardPeekCard

### app/components/tournament-hub/leaderboard-peek-card.tsx
Client Component for a single group card in the Leaderboard Peek widget. Tappable card showing group name, user rank, momentum indicator, and a 3-row compact mini-leaderboard.

- **LeaderboardPeekCard({ data, groupLeaderboardHref })**: `JSX.Element` — [Client] Outlined Card with `height: '100%'` for CSS Grid alignment. Renders a tappable `CardActionArea` that navigates to `groupLeaderboardHref` on click. Header row shows group name (with Groups icon), `#N` rank chip, and `RankChangeIndicator`. Below a divider, renders up to 3 `LeaderboardCard compact=true` rows converted from `GroupPeekData.rows` (all point-breakdown fields set to 0).
  Uses: useRouter, useTheme, RankChangeIndicator
  Renders: LeaderboardCard (compact=true)

### app/components/tournament-hub/stats-at-a-glance-widget.tsx
Async Server Component for the Stats at a Glance widget. Fetches the user's score history summary and renders a compact DashboardCard with total score, per-category breakdowns with deltas, a sparkline trend, and a link to the full stats page.

- **StatsAtAGlanceWidget({ tournamentId, locale })**: `Promise<JSX.Element>` — [Server] Fetches `getStatsAtAGlanceData` and `getTranslations('hub.statsAtAGlance')` in parallel. Computes `statsHref = /${locale}/tournaments/${tournamentId}/stats`. Renders `DashboardCard` with `InsightsIcon`. When `!data.hasData`: centered empty state (48px disabled `InsightsIcon`, `noData` body2, `noDataSubtitle` caption). When `data.hasData`: total score `h3` + "pts" + momentum row always shown when `snapshotDateLabel` exists (`+N pts` in `success.main` when positive, `0 pts` in `text.secondary` when zero; `ArrowDropUpIcon` only when positive) + snapshot date caption (uses `sinceYesterday` key when `isYesterday=true`, else `since` key) + `Divider` + 3 category rows (Matches/QualifiedTeams/Awards; per-category `+N` delta chip shown only when category total > 0, color `success.main` when delta > 0 else `text.secondary`) + sparkline SVG with `trendLabel` heading and sparkline gain annotation (only when `sparklineData.length >= 2`) + "See all statistics" `Button` linking to `statsHref`.
  Calls: getStatsAtAGlanceData, getTranslations
  Renders: DashboardCard, Sparkline (inline helper — not exported)

- **Sparkline({ data: number[] })**: `JSX.Element | null` — [Server, inline] Returns `null` when `data.length < 2`. Otherwise renders a fixed 120×40 SVG `<path>` connecting normalized data points. `stroke="currentColor"`, wrapped in `Box sx={{ color: 'secondary.main', bgcolor: 'action.selected', borderRadius: 1 }}`.

### app/components/tournament-hub/tournament-hub-recent-results.tsx
Async Server Component for the Recent Results widget. Fetches prediction outcome data and the card title translation in parallel, then wraps the result in DashboardCard.

- **TournamentHubRecentResults({ tournamentId, locale })**: `Promise<JSX.Element>` — [Server] Fetches `getRecentResultsData` and `getTranslations('hub.recentResults')` in parallel via `Promise.all`. Computes `statsHref` from `/${locale}/tournaments/${tournamentId}/stats`. Wraps `RecentResultsWidget` inside `DashboardCard` using `t('title')` and `HistoryIcon`.
  Calls: getRecentResultsData
  Renders: DashboardCard, RecentResultsWidget

### app/components/tournament-hub/recent-results-widget.tsx
Client Component for the Recent Results widget content. Renders directly inside DashboardCard's CardContent (no own Paper or title wrapper).

- **RecentResultsWidget({ data, statsHref })**: `JSX.Element` — [Client] Shows empty state (SportsScoreIcon + message) when `recentGames` is empty. Otherwise slices `recentGames` to 5 visible items (via `startIndex` state). When `recentGames.length > 5`: renders `VerticalNav` to the right of the list; up disabled at `startIndex === 0`, down disabled at `startIndex === maxIndex`. "View full statistics" button anchored to bottom.
  Uses: useTranslations('hub.recentResults'), useState
  Renders: GameItem (inline sub-component), BoostBadge, VerticalNav (inline)
- **VerticalNav({ current, total, onUp, onDown })**: `JSX.Element` — [Client, inline in recent-results-widget] Up/down `IconButton` (bordered) + 3-dot position indicator. Up disabled when `current === 0`, down disabled when `current === total - 1`.
- **GameItem({ item })**: `JSX.Element` — [Client, inline] Renders one game row with icon (✅/❌/🕐), score/vs display, pts label, subtext. When `hasPenalties` (homePenaltyScore != null && awayPenaltyScore != null): score line shows `BoldWinner Score (HomePen)–(AwayPen) Score Loser`. Six visual states: `finished+no-prediction` → CancelOutlined + youDidntPredict; `finished+exact` → CheckCircle + exactResult; `finished+correct-not-exact+hasPenalties` → CheckCircle + correctResultWithPenaltyWinner; `finished+correct-not-exact` → CheckCircle + correctResultWithGuess; `finished+incorrect+hasPenalties+userHadPenaltyPrediction` → CancelOutlined + yourGuessWithPenaltyPrediction; `finished+incorrect` → CancelOutlined + yourGuess; `pending/about_to_start` → WatchLaterIcon (warning.main) + status + prediction or noPredictionShort + "-- pts".

### app/components/tournament-hub/games-prediction-widget.tsx
Zero-fetch Server Component that routes to the correct Games widget state based on auth and tournament phase.

- **GamesPredictionWidget({ tournamentId, scoringRules, totalGames, isNearStart, isFinished, actionCenterData, gamesHref })**: `JSX.Element | null` — Pure routing component — no async, no data calls. Returns `null` when `isFinished`. Renders `GamesInfoWidget` with `isLoggedOff=true, predictedGames=0` when `!actionCenterData`. Renders `GamesInfoWidget` with `isLoggedOff=false` when `actionCenterData && !isNearStart`. Renders `GamesActiveWidget` when `actionCenterData && isNearStart`.
  Calls: (none)
  Renders: GamesInfoWidget (conditional), GamesActiveWidget (conditional)

### app/components/tournament-hub/games-info-widget.tsx
Async Server Component for the Games widget in Logged-Off and Pre-Start states.

- **GamesInfoWidget({ isLoggedOff, scoringRules, gamesHref, predictedGames, totalGames })**: `Promise<JSX.Element>` — [Server] Calls `getTranslations('hub')`. Renders `DashboardCard` with title `newUser.tracks.matches.title`, `SportsSoccerIcon`, and count `"${predictedGames}/${totalGames}"`. Inside: description paragraph; dashed inline Box deadline section (ScheduleIcon + `newUser.tracks.deadline.label` + `gamesWidget.deadlineText`); dashed scoring rules box (AddCircleOutlineIcon + `scoringRules.matches` strings, all `variant="body2"`); `LinearProgress color="secondary"` (hidden when `totalGames===0`); CTA via `GamesInfoWidgetCta` — `gamesWidget.ctaLogin` when `isLoggedOff`; `gamesWidget.ctaContinue` when `predictedGames > 0`; else `newUser.tracks.matches.cta`.
  Calls: getTranslations('hub')
  Renders: DashboardCard, GamesInfoWidgetCta

### app/components/tournament-hub/deadline-box.tsx
Severity-aware Client Component wrapper for the dashed deadline box shown in pre-tournament hub widgets. Extracted to client boundary so MUI `alpha()` theme callbacks can resolve at runtime.

- **DeadlineBox({ severity, children })**: `JSX.Element` — [Client] Renders a `Box` with `border: '1px dashed'`. For `severity === 'normal'`: `borderColor: 'divider'`, `bgcolor: 'transparent'`. For other severities: `borderColor: '{severity}.main'`, `bgcolor: alpha(theme.palette[severity].main, 0.05)` via theme callback. `borderRadius: 1`, `p: 1`. Accepts `severity: StatusWidgetSeverity` and `children: React.ReactNode`.
  Uses: alpha (MUI styles), Box

### app/components/tournament-hub/qualified-teams-widget.tsx
Async Server Component for the Qualified Teams prediction widget in pre-tournament phase.

- **QualifiedTeamsWidget({ isLoggedOff, scoringRules, qtHref, qualifiersCompleted, qualifiersTotal, msUntilPredictionLock, lockDateFormatted })**: `Promise<JSX.Element>` — [Server] Calls `getTranslations('hub')` and `computeStatusWidgetSeverity(msUntilPredictionLock)`. Renders `DashboardCard` with `AccountTreeIcon`, title `newUser.tracks.qualifiedTeams.title`, count `"${qualifiersCompleted}/${qualifiersTotal}"`, and `urgent={severity === 'error'}`. Inside: description paragraph; severity-coloured dashed deadline box (ScheduleIcon + deadlineLabel + lockDateFormatted + deadline message selected by severity); dashed scoring rules box (AddCircleOutlineIcon + `scoringRules.qualifiedTeams`); `LinearProgress color="secondary"` (hidden when `qualifiersTotal === 0`); CTA via `GamesInfoWidgetCta` — 4-state label: 0% → `cta`, >0%<90% → `ctaKeep`, ≥90%<100% → `ctaFinish`, 100% → `ctaReview`; `gamesWidget.ctaLogin` when `isLoggedOff`.
  Calls: getTranslations('hub'), computeStatusWidgetSeverity
  Renders: DashboardCard, DeadlineBox, GamesInfoWidgetCta

### app/components/tournament-hub/awards-widget.tsx
Async Server Component for the Awards prediction widget in pre-tournament phase.

- **AwardsWidget({ isLoggedOff, scoringRules, awardsHref, awardsCompleted, awardsTotal, msUntilPredictionLock, lockDateFormatted })**: `Promise<JSX.Element>` — [Server] Same structure as `QualifiedTeamsWidget`. `EmojiEventsIcon`, title `newUser.tracks.awards.title`, count `"${awardsCompleted}/${awardsTotal}"`, `scoringRules.awards`. 4-state CTA keyed by awards progress.
  Calls: getTranslations('hub'), computeStatusWidgetSeverity
  Renders: DashboardCard, DeadlineBox, GamesInfoWidgetCta

### app/components/tournament-hub/games-active-widget.tsx
Async Server Component for the Games widget in Active state. Thin wrapper — computes initial urgency and urgent game IDs, then delegates to GamesActiveSection.

- **GamesActiveWidget({ data, tournamentId, gamesHref })**: `Promise<JSX.Element>` — [Server] Calls `getTranslations('hub')`. Computes `urgencyLevel` via `computeUrgencyLevel` (imported from `urgency-utils`). Computes `urgentGameIds` (all game IDs when `mode==='urgent'`, else empty). Passes `initialSilverUsed={data.silverBoostsUsed}` and `initialGoldenUsed={data.goldenBoostsUsed}` to `GamesActiveSection` for boost delta tracking.
  Calls: getTranslations('hub'), computeUrgencyLevel
  Renders: GamesActiveSection

### app/components/tournament-hub/games-active-section.tsx
Client Component that owns all mutable carousel state and handles independent refetch when all urgent games are predicted.

- **GamesActiveSection({ initialGames, initialGameGuesses, initialTeamsMap, initialUrgencyLevel, initialUrgentGameIds, initialPredicted, totalGames, tournamentMaxSilver, tournamentMaxGolden, initialSilverUsed, initialGoldenUsed, tournamentId, gamesHref, cardTitle })**: `JSX.Element` — [Client] Holds `games`, `gameGuesses`, `teamsMap`, `urgencyLevel`, `urgentGameIds`, `predicted`, `silverUsed`, `goldenUsed`, and `refetchKey` in `useState`. `handleAllUrgentComplete` calls `getCarouselGames` (lightweight — no `getTournamentPredictionCompletion`), updates all state, and increments `refetchKey`. The `key={refetchKey}` prop on `GuessesContextProvider` forces a clean remount, resetting both the guess context and the delta snapshots in `GamesActiveClient` and `GuessesContextProvider` simultaneously. Passes `tournamentSilverUsed={silverUsed}` and `tournamentGoldenUsed={goldenUsed}` to `GuessesContextProvider` for tournament-wide boost count accuracy.
  Calls: getCarouselGames, computeUrgencyLevel
  Renders: GuessesContextProvider (key={refetchKey}), GamesActiveClient

### app/components/tournament-hub/games-active-client.tsx
Client Component managing navigation through the single-card game carousel with reactive predicted-count tracking and urgency status display.

- **GamesActiveClient({ games, teamsMap, tournamentId, gamesHref, urgencyLevel, cardTitle, initialPredicted, totalGames, urgentGameIds, onAllUrgentComplete })**: `JSX.Element` — [Client] Manages `currentIndex` and `editingGameId` in `useState`. Reads `gameGuesses` from `GuessesContext`. Snapshot-tracks initial guesses in `initialGuessesRef` (reset on remount) to compute `delta = countCompleteGuesses(current) - countCompleteGuesses(initial)` for reactive `adjustedPredicted = initialPredicted + delta`. Computes `urgentRemaining` from `urgentGameIds` + live `gameGuesses` to derive `effectiveUrgencyLevel`. Fires `onAllUrgentComplete` once (guarded by `refetchTriggeredRef`) when `urgentRemaining === 0`. Renders: (1) status row (urgency/safe/none); (2) card area — full-width `FlippableGameCard` inside a `position:relative` wrapper; `ChevronLeft`/`ChevronRight` `IconButton`s are absolutely positioned at left/right edges (`top:50%`, `zIndex:1`, `bgcolor:action.selected`) and only rendered when `editingGameId === null` AND there is an adjacent card (hidden at boundaries, not disabled); (3) "View All Matches" Button/Link.
  Uses: useContext(GuessesContext), useState, useRef, useEffect, useTranslations('hub')
  Renders: DashboardCard, FlippableGameCard
