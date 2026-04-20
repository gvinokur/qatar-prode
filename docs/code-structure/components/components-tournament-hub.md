# Components — Tournament Hub

Part of the CODE-STRUCTURE.md system. See `CODE-STRUCTURE.md` for the full index and call graph.

**Last updated:** 2026-04-20

---

## Files

### app/components/tournament-hub/tournament-hub-action-center.tsx
Thin Server Component wrapper for the hub's Action Center widget. Calls the server action and delegates rendering to the client carousel.

- **TournamentHubActionCenter({ tournamentId, locale })**: `JSX.Element | null` — [Server] Calls `getActionCenterGames`; returns `null` when `data.tournamentFinished` (last game has kicked off). Otherwise passes result to `ActionCenterCarousel`.
  Calls: getActionCenterGames
  Renders: ActionCenterCarousel

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

- **SocialHubCard({ locale, tournamentId })**: `JSX.Element` — [Client] Outlined dashed Paper (secondary-tinted border). Renders GroupAddIcon (48px), h6 title, body2 description, and two buttons: "Create Group" (contained, secondary) and "Find Public Group" (outlined, secondary), both linking to the friend-groups page.
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
Async Server Component for the Recent Results widget. Fetches recent prediction outcome data and delegates rendering to the client widget.

- **TournamentHubRecentResults({ tournamentId, locale })**: `JSX.Element` — [Server] Calls `getRecentResultsData`; computes `statsHref`, `resultsHref`, `qualifiedTeamsHref`, `awardsHref` from `/${locale}/tournaments/${tournamentId}/[suffix]`; passes result and all hrefs to `RecentResultsWidget`.
  Calls: getRecentResultsData
  Renders: RecentResultsWidget

### app/components/tournament-hub/recent-results-widget.tsx
Client Component for the Recent Results widget. Renders 3-section card (recent games, qualified teams, tournament awards) with empty state when no data is available.

- **RecentResultsWidget({ data, statsHref, resultsHref, qualifiedTeamsHref, awardsHref })**: `JSX.Element` — [Client] Renders section title and a MUI `Paper` card. Shows empty state (soccer icon + message) when all data is absent. Otherwise renders up to 3 clickable sections: PARTIDOS RECIENTES (links to `resultsHref`; game items with ✅/❌, points, BoostBadge), EQUIPOS CLASIFICADOS (links to `qualifiedTeamsHref`; shown when `qualifiedTeamsActualCount > 0`), PREMIOS DEL TORNEO (links to `awardsHref`; shown when `individualAwardsScore !== null` or `honorRollScore !== null`; award items show specific correct positions/awards from `honorRollCorrect`/`individualAwardsCorrect`). "View full statistics" button below card links to `statsHref`.
  Uses: useTranslations('hub.recentResults')
  Renders: GameItem (inline sub-component), AwardItem (inline sub-component), BoostBadge
