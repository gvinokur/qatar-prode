# Components — Tournament Hub

Part of the CODE-STRUCTURE.md system. See `CODE-STRUCTURE.md` for the full index and call graph.

**Last updated:** 2026-04-22

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

- **PreTournamentNewUserActionCenter({ data, tournamentId, locale })**: `JSX.Element` — [Server] Calls `getTranslations('hub')`, `getTranslations('rules.rules')`, and `getTranslations('rules.constraints')`. Calls `getRulesBySection(data.scoringConfig, tRules)` for scoring rule labels and `getConstraintsBySection(tConstraints, lockDate)` for per-section deadline strings. `lockDate` is computed from `data.firstGameDate + 5 days` formatted via `Intl.DateTimeFormat`. Computes per-track progress percentages and 4-state CTA labels (cta / ctaKeep / ctaFinish / ctaReview) keyed by progress thresholds. Renders: (1) `PreTournamentCountdown` when `data.firstGameDate !== null`; (2) `TutorialCTACard`; (3) three `PredictionTrackCard` sub-components (Matches, Qualified Teams, Awards).
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

- **SocialHubCard({ locale, tournamentId })**: `JSX.Element` — [Client] Outlined dashed Paper (secondary-tinted border). Renders GroupAddIcon (48px), h6 title, body2 description, two buttons ("Create Group" contained, "Find Public Group" outlined), and a text-variant "Learn more about groups" link below the buttons — all linking to the friend-groups page.
  Uses: useTranslations, Paper, Stack, Typography, Button, GroupAddIcon, Link

### app/components/tournament-hub/pre-tournament-groups-preview.tsx
Client Component shown in the Leaderboard widget when the user has groups but no ranking data yet (pre-tournament). Shows group name chips and 3 CTAs.

- **PreTournamentGroupsPreview({ allGroupNames, locale, tournamentId })**: `JSX.Element` — [Client] Renders "You're in" text followed by up to 3 group name `Chip` links; appends "and N others." text when `allGroupNames.length > 3`. Below that, 3 CTA buttons (Your Groups, Create Group, Discover Groups) linking to the friend-groups page.
  Uses: useTranslations, Box, Stack, Typography, Button, Chip, Link

### app/components/tournament-hub/action-center-carousel.tsx
Client Component for the Action Center carousel. Manages card edit state (one card open at a time) and wires FlippableGameCard instances with GuessesContextProvider for inline prediction saving.

- **ActionCenterCarousel({ data, tournamentId, locale })**: `JSX.Element` — [Client] Wraps content in `GuessesContextProvider` (autoSave=true). Renders `TournamentStartBanner` above everything when `data.tournamentJustStarted`. Renders `PreTournamentCountdown` above header when `!data.tournamentHasStarted && data.firstGameDate !== null`. Renders header (title/subtitle). Optionally renders "Opening Match" overline when `data.openerBackfill`. Branches: empty mode → dashed box; fallback/urgent mode → `ScrollShadowContainer` with `FlippableGameCard` per game (single-game carousel centers with `justifyContent: 'center'`). When `data.qtAndAwardsOpen`: renders a `Stack direction="row"` of 3 `TrackedCircularProgress` circles (inline helper component) for QT, Awards, and Games, each linking to its page.
  Renders: TournamentStartBanner (conditional), PreTournamentCountdown (conditional), FlippableGameCard
  Uses: GuessesContextProvider, ScrollShadowContainer, useTranslations, TrackedCircularProgress (inline), AccountTreeIcon, EmojiEventsIcon, SportsSoccerIcon

### app/components/tournament-hub/tournament-hub-leaderboard-peek.tsx
Async Server Component for the Leaderboard Peek widget. Fetches the current user's friend-group standings and branches on group membership and ranking state.

- **TournamentHubLeaderboardPeek({ tournamentId, locale })**: `JSX.Element` — [Server] Calls `getLeaderboardPeekData` (returns `LeaderboardPeekResult`). Three branches: (1) `!userHasGroups` → header + `SocialHubCard`; (2) `userHasGroups && groups.length === 0` → header + `PreTournamentGroupsPreview`; (3) `groups.length > 0` → header + `LeaderboardPeekCard` per group + "See all groups" link.
  Calls: getLeaderboardPeekData
  Renders: SocialHubCard, PreTournamentGroupsPreview, LeaderboardPeekCard

### app/components/tournament-hub/leaderboard-peek-card.tsx
Client Component for a single group card in the Leaderboard Peek widget. Tappable card showing group name, user rank, momentum indicator, and a 3-row compact mini-leaderboard.

- **LeaderboardPeekCard({ data, groupLeaderboardHref })**: `JSX.Element` — [Client] Renders a tappable MUI `CardActionArea` that navigates to `groupLeaderboardHref` on click. Header row shows group name (with Groups icon), `#N` rank chip, and `RankChangeIndicator`. Below a divider, renders up to 3 `LeaderboardCard compact=true` rows converted from `GroupPeekData.rows` (all point-breakdown fields set to 0).
  Uses: useRouter, useTheme, RankChangeIndicator
  Renders: LeaderboardCard (compact=true)

### app/components/tournament-hub/tournament-hub-recent-results.tsx
Async Server Component for the Recent Results widget. Fetches prediction outcome data and the card title translation in parallel, then wraps the result in DashboardCard.

- **TournamentHubRecentResults({ tournamentId, locale })**: `Promise<JSX.Element>` — [Server] Fetches `getRecentResultsData` and `getTranslations('hub.recentResults')` in parallel via `Promise.all`. Computes `statsHref`, `resultsHref`, `qualifiedTeamsHref`, `awardsHref` from `/${locale}/tournaments/${tournamentId}/[suffix]`. Wraps `RecentResultsWidget` inside `DashboardCard` using `t('title')` and `HistoryIcon`.
  Calls: getRecentResultsData
  Renders: DashboardCard, RecentResultsWidget

### app/components/tournament-hub/recent-results-widget.tsx
Client Component for the Recent Results widget content. Renders directly inside DashboardCard's CardContent (no own Paper or title wrapper).

- **RecentResultsWidget({ data, statsHref, resultsHref, qualifiedTeamsHref, awardsHref })**: `JSX.Element` — [Client] Shows empty state (SportsScoreIcon + message) when all data arrays are empty/zero/null. Otherwise renders up to 3 clickable sections: PARTIDOS RECIENTES (links to `resultsHref`; game items with ✅/❌, points, BoostBadge), EQUIPOS CLASIFICADOS (links to `qualifiedTeamsHref`; shown when `qualifiedTeamsActualCount > 0`), PREMIOS DEL TORNEO (links to `awardsHref`; shown when `individualAwardsScore !== null` or `honorRollScore !== null`). "View full statistics" button uses `mt: 'auto'` to anchor to the bottom of DashboardCard's flex column.
  Uses: useTranslations('hub.recentResults')
  Renders: GameItem (inline sub-component), AwardItem (inline sub-component), BoostBadge
