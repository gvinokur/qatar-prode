# Pages, Layouts & API Routes

Part of the CODE-STRUCTURE.md system. See `CODE-STRUCTURE.md` for the full index and call graph.

**Last updated:** 2026-04-21

---

## Files

### app/layout.tsx
Root layout that sets up global metadata and CSS imports, returns raw children without wrapper components.

- **generateMetadata()**: `Metadata` — [Server] Generates global app metadata including PWA configuration, OpenGraph, Twitter cards, and favicons from environment variables.
- **RootLayout({ children })**: `JSX.Element` — [Server] Root layout component that returns children directly without any wrappers.

### app/robots.ts
Static robots.txt via Next.js MetadataRoute. Returns disallow rules for admin/auth/API paths.

- **robots()**: `MetadataRoute.Robots` — [Server] Returns static robots configuration. Allows all user agents with disallow rules for `/*/backoffice`, `/*/delete-account`, `/*/verify-email`, `/*/reset-password`, `/api/`. Points sitemap to `${baseUrl}/sitemap.xml`.

### app/sitemap.ts
Dynamic XML sitemap via Next.js MetadataRoute. Fetches active tournaments and public groups at request time to generate localized URL entries for all public pages.

- **sitemap()**: `Promise<MetadataRoute.Sitemap>` — [Server] Fetches active tournaments and public friend-groups, returns sitemap entries for home pages, 6 tournament sub-pages, and friend-group pages in all locales (en, es). Each entry includes `alternates.languages` for hreflang support.
  Calls: findAllActiveTournaments, findAllPublicGroupsForSitemap

### app/template.tsx
Template component that applies email verification overlay and banner logic across all routes.

- **Template({ children })**: `JSX.Element` — [Server] Wraps children with verification banner and overlay based on user verification status and email verification requirement config.
  Calls: getLoggedInUser, findUserById

### app/transition.tsx
Client-side page transition animation component using Framer Motion.

- **Transition({ children })**: `JSX.Element` — [Client] Applies fade-in/out animation on page transitions with `beforeunload` detection.

### app/service-worker.ts
Service worker configuration using Serwist for PWA offline support and push notifications.

- No exported functions. Initializes Serwist with precaching, navigation fallback to `/offline`, and handles push/notification events.

### middleware.ts
i18n and authentication routing middleware.

- **detectLocale(request)**: `Promise<Locale>` — [Server] Detects user locale from cookie, user preference, Accept-Language header, or defaults to configured default locale.
  Calls: auth, parseAcceptLanguage, matchLocale
- **middleware(request)**: `NextResponse` — [Server] Handles locale routing, authentication checks, and legacy route redirects.
  Calls: detectLocale, auth
- **config**: `Object` — Next.js middleware matcher configuration; applies middleware to all routes except API, static files, and asset paths.

### auth.ts
Root NextAuth.js configuration. Exports `handlers`, `signIn`, `signOut`, `auth` for use throughout the app.

- **handlers**: `Object` — NextAuth.js GET/POST route handlers; re-exported by `app/api/auth/[...nextauth]/route.ts`.
- **signIn**: `Function` — Initiates sign-in with a given provider; used in auth Server Actions.
- **signOut**: `Function` — Initiates sign-out; used in auth Server Actions.
- **auth**: `Function` — Returns the current session (or null); used throughout Server Components and middleware.
- **authorize (credentials)**: `Promise<User | null>` — [Server] Validates email+password against stored hash; returns user object with `isAdFree`, `isAdmin`, `emailVerified`, `nickname`, `preferred_locale`, or `null` on mismatch.
  Calls: findUserByEmail, getPasswordHash
- **authorize (otp)**: `Promise<User | null>` — [Server] Validates OTP code; clears OTP on success; returns user object including `isAdFree`, or `null` on failed verification.
  Calls: verifyOTP, clearOTP
- **signIn callback**: `Promise<boolean>` — [Server] Handles Google OAuth flow: finds existing linked account, merges with matching email, or creates new OAuth user; populates `user` object including `isAdFree`. Returns `false` if user creation fails.
  Calls: findUserByOAuthAccount, findUserByEmail, linkOAuthAccount, createOAuthUser
- **session callback**: `Session` — [Server] Picks `isAdFree`, `isAdmin`, `nickname`, `emailVerified`, `preferred_locale`, `id` from JWT token into `session.user`.
- **jwt callback**: `JWT` — [Server] Merges user fields (including `isAdFree`) into JWT token on sign-in or session update trigger. Returns merged `JWT`.

### types/next-auth.d.ts
TypeScript module augmentation for NextAuth.js. Extends `Session`, `User`, and `JWT` interfaces with app-specific fields including `isAdFree`.

- **Session.user**: extends `DefaultSession["user"]` with `id: string`, `nickname: string | null`, `isAdmin: boolean`, `isAdFree: boolean`, `emailVerified: boolean`, `preferred_locale?: string | null`
- **User**: `id: string`, `nickname: string | null`, `isAdmin: boolean`, `isAdFree: boolean`, `emailVerified: boolean`, `preferred_locale?: string | null`
- **JWT**: `id: string`, `nickname: string | null`, `isAdmin: boolean`, `isAdFree: boolean`, `emailVerified: boolean`, `preferred_locale?: string | null`

### app/api/auth/[...nextauth]/route.ts
NextAuth.js route handler that exports authentication endpoints.

- **GET/POST**: Route handlers exported from auth configuration module.

### app/api/update-guesses/route.ts
API route for scoring calculation triggered by cron jobs or manual requests.

- **GET(req)**: `NextResponse` — [Server] Calculates game scores based on query parameters (object, forceAll, forceDrafts, forceAllGuesses).
  Calls: calculateGameScores

### app/[locale]/layout.tsx
Locale-specific layout that sets up i18n providers, theme, and session context.

- **generateStaticParams()**: `Array` — [Server] Returns static locale parameters for SSG (en, es).
- **generateMetadata({ params })**: `Metadata` — [Server] Generates locale-specific metadata with alternate language links.
  Calls: getTranslations
- **LocaleLayout({ children, params })**: `JSX.Element` — [Server] Sets up locale context, theme providers, session wrapper, header, footer, and AdSense Auto Ads. AdSense Script loaded afterInteractive when NEXT_PUBLIC_ADSENSE_CLIENT_ID is set and user is NOT ad-free. Mounts AdSensePageViewTracker to signal virtual page views on SPA navigation.
  Calls: getLoggedInUser, getMessages, getTranslations
  Renders: NextIntlClientProvider, TimezoneProvider, CountdownProvider, NextThemeProvider, ThemeProvider, SessionWrapper, ConditionalHeader, Header, AdSensePageViewTracker, Footer, InstallPwa, OfflineDetection, AnalyticsPageViewTracker

### app/[locale]/page.tsx
Home/landing page that conditionally shows onboarding or redirects to first tournament.

- **generateMetadata()**: `Promise<Metadata>` — [Server] Returns improved home page title and description from `common.home.metadata.description` translation key; overrides the generic locale layout metadata for the home route.
  Calls: getLocale, getTranslations
- **ServerHome({ searchParams })**: `JSX.Element` — [Server] Displays onboarding trigger and either empty tournaments state or tournament redirect based on available tournaments.
  Calls: getTournaments, getLoggedInUser, getOnboardingStatus
  Renders: OnboardingTrigger, EmptyTournamentsState, TournamentRedirect

### app/[locale]/backoffice/page.tsx
Admin console page with tabbed interface for tournament management.

- **Backoffice()**: `JSX.Element` — [Server] Displays backoffice tabs for active/inactive tournaments with admin subcomponents (scoring, awards, teams, games, players, users, notifications). Does NOT fetch users — UsersTab is self-fetching. Passes `transfermarkt_url_template` from the tournament record to `PlayersTab` (Story #306).
  Calls: getLoggedInUser, getLocale, findAllTournaments
  Renders: BackofficeTabs, CreateTournamentButton, UsersTab, NotificationSender, various tournament management tabs

### app/[locale]/delete-account/page.tsx
Simple page for account deletion with centered button component.

- **Page()**: `JSX.Element` — [Server] Renders delete account button in centered container.
  Renders: DeleteAccountButton

### app/[locale]/verify-email/page.tsx
Email verification page that validates token from URL parameter.

- **VerifyEmailPage({ searchParams })**: `JSX.Element` — [Server] Validates email verification token and renders verifier component; redirects home if token missing.
  Calls: getLocale
  Renders: EmailVerifier

### app/[locale]/reset-password/page.tsx
Client-side password reset form with token validation.

- **ResetPasswordPage()**: `JSX.Element` — [Client] Password reset form that verifies token on load and submits new password via server action.
  Calls: verifyResetToken, updateUserPassword
  Renders: AuthPageSkeleton, TextField, Button, Alert

### app/[locale]/rules/page.tsx
Standalone rules page displaying tournament rules.

- **RulesPage()**: `JSX.Element` — [Server] Displays full-page rules component.
  Renders: Rules

### app/[locale]/offline/page.tsx
Offline fallback page shown when service worker catches offline navigation.

- **OfflinePage()**: `JSX.Element` — [Server] Displays reload link with styled typography.
  Calls: getLocale

### app/[locale]/tournaments/[id]/page.tsx
Tournament Hub landing page — the primary entry point after route promotion (Story #338).

- **TournamentHubPage(props: Props)**: `JSX.Element` — [Server] Hub landing page. Resolves `id` from params, derives locale via `toLocale`, redirects to `/games` if user is not logged in. Fetches `ActionCenterData` at page level, computes `isIncompleteUser` via `computeIsIncompleteUser`, passes pre-fetched data to `TournamentHubActionCenter`, and suppresses `TournamentHubRecentResults` for incomplete users.
  Calls: getLocale, toLocale, getLoggedInUser, redirect, getActionCenterGames, computeIsIncompleteUser
  Renders: TournamentHubActionCenter, TournamentHubRecentResults (conditional), TournamentHubLeaderboardPeek

### app/[locale]/tournaments/[id]/games/page.tsx
Games page (moved from root in Story #338). Shows match predictions for the tournament. Metadata is provided by the parent `layout.tsx`.

- **TournamentGamesPage(props: Props)**: `JSX.Element` — [Server] Renders unified games page for tournament predictions.
  Renders: UnifiedGamesPage

### app/[locale]/tournaments/[id]/layout.tsx
Tournament context layout with header, sidebar, and bottom navigation.

- **generateMetadata({ params }: { params: Promise<{ id: string }> })**: `Promise<Metadata>` — [Server] Returns tournament-specific title `"{long_name} | {appName}"` and localized description; applies to all pages nested under this layout; falls back to appName on error or missing tournament.
  Calls: buildTournamentMetadata, getTranslations, getLocale
- **checkDevTournamentPermission(tournamentId, tournament, user, locale)**: `Promise<void>` — [Server] Validates user access to dev-only tournaments in production.
  Calls: hasUserPermission
- **extractScoringConfig(tournament)**: `ScoringConfig | undefined` — [Server] Extracts scoring configuration from tournament object.
- **isWithinFiveDaysOfStart(startDate)**: `boolean` — [Server] Checks if current time is within 5 days of tournament start.
- **TournamentLayout(props: TournamentLayoutProps)**: `JSX.Element` — [Server] Renders two-column layout with main content (9/12) and sidebar (3/12 desktop, hidden mobile); handles tournament switcher, navigation, badges, SportsEvent JSON-LD structured data, and parallel group rank fetching. After `getGroupsForUser`, fetches ranks for all user groups in parallel via `getGroupRankingForUser`, derives `groupRanks: Record<string, number>`, and passes `prodeGroups` (including `favoriteGroupIds` and `mainGroupId`) to `TournamentSidebar → FriendGroupsList`.
  Calls: getLocale, getLoggedInUser, getTournamentAndGroupsData, getTournaments, getTournamentStartDate, getGroupStandingsForTournament, getGroupsForUser, findTournamentGuessByUserIdTournament, getPlayersInTournament, findTournamentById, getGameGuessStatisticsForUsers, getThemeLogoUrl, isDevelopmentMode, buildSportsEventJsonLd, getGroupRankingForUser
  Renders: JsonLd, TournamentSwitcher, GroupSelector, TournamentSidebar, ThemeSwitcher, LanguageSwitcher, UserActions, DevTournamentBadge, ScrollableContentArea, EmptyAwardsSnackbar, EnvironmentIndicator, TournamentBottomNavWrapper, NewTournamentSnackbar

### app/[locale]/tournaments/[id]/hub/page.tsx
Backward-compatibility redirect for the old `/hub` route. Redirects to the tournament root.

- **TournamentHubRedirectPage(props: Props)**: `JSX.Element` — [Server] Resolves `id` from params and locale, then calls `redirect` to `/${locale}/tournaments/${id}`.
  Calls: getLocale, redirect

### app/[locale]/tournaments/[id]/error.tsx
Error boundary for tournament access denied scenarios.

- **TournamentError({ _error, _reset })**: `JSX.Element` — [Client] Displays access denied error with icon and home navigation button.
  Calls: useLocale, useRouter, useTranslations

### app/[locale]/tournaments/[id]/results/page.tsx
Results and standings page showing group stage and playoff results.

- **generateMetadata({ params }: { params: Promise<{ id: string }> })**: `Promise<Metadata>` — [Server] Returns sub-page title `"{results.title} – {long_name} | {appName}"` with localized description; falls back to appName on error.
  Calls: buildTournamentMetadata, getTranslations, getLocale
- **ResultsPage(props: Props)**: `JSX.Element` — [Server] Fetches game results, group standings, playoff data, and tournament (for breadcrumbs); displays in tabbed interface with loading skeleton fallback and BreadcrumbList JSON-LD.
  Calls: findGamesInTournament, getTeamsMap, getGroupStandingsForTournament, findPlayoffStagesWithGamesInTournament, getTranslations, getLocale, findTournamentByIdCached, buildBreadcrumbListJsonLd
  Renders: JsonLd, LoadingSkeleton, ResultsPageClient

### app/[locale]/tournaments/[id]/rules/page.tsx
Tournament-specific rules page with scoring configuration.

- **generateMetadata({ params }: { params: Promise<{ id: string }> })**: `Promise<Metadata>` — [Server] Returns sub-page title `"{rules.title} – {long_name} | {appName}"` with localized description; falls back to appName on error.
  Calls: buildTournamentMetadata, getTranslations, getLocale
- **TournamentRulesPage(props: Props)**: `JSX.Element` — [Server] Fetches tournament and first game in parallel (`Promise.all`). Computes `lockDate` = first game date + 5 days formatted via `Intl.DateTimeFormat` (undefined when no first game). Passes `lockDate` to `<Rules />` so constraint strings show the actual date rather than the generic fallback.
  Calls: findTournamentByIdCached, findFirstGameInTournament, getLocale, getTranslations, buildBreadcrumbListJsonLd
  Renders: JsonLd, Rules

### app/[locale]/tournaments/[id]/stats/page.tsx
User tournament statistics page showing performance, accuracy, boost analysis, and score history.

- **generateMetadata({ params }: { params: Promise<{ id: string }> })**: `Promise<Metadata>` — [Server] Returns sub-page title `"{sidebar.title} – {long_name} | {appName}"` with localized description; falls back to appName on error.
  Calls: buildTournamentMetadata, getTranslations, getLocale
- **TournamentStatsPage(props: Props)**: `JSX.Element` — [Server] Fetches game guesses, tournament guesses, boost allocations, and score history (tournament via cache); calculates performance and accuracy metrics; renders stats with BreadcrumbList JSON-LD.
  Calls: getLoggedInUser, findTournamentByIdCached, getLocale, getTranslations, getGameGuessStatisticsForUsers, findTournamentGuessByUserIdTournament, getBoostAllocationBreakdown, getGameCountsForTournament, findGameGuessesByUserId, calculateAccuracyStats, calculateBoostStats, getScoreHistoryForUsers, buildBreadcrumbListJsonLd
  Renders: JsonLd, StatsTabs, PerformanceOverviewCard, PredictionAccuracyCard, BoostAnalysisCard, HistoryTabCard

### app/[locale]/tournaments/[id]/awards/page.tsx
Awards prediction page for tournament individual awards and podium.

- **generateMetadata({ params }: { params: Promise<{ id: string }> })**: `Promise<Metadata>` — [Server] Returns sub-page title `"{awards.metadata.title} – {long_name} | {appName}"` with localized description; falls back to appName on error.
  Calls: buildTournamentMetadata, getTranslations, getLocale
- **Awards(props: Props)**: `JSX.Element` — [Server] Fetches all players, tournament guesses, playoff stages, and games (tournament via cache); checks if predictions are locked; renders awards panel with BreadcrumbList JSON-LD.
  Calls: getLoggedInUser, getLocale, getTranslations, findTournamentGuessByUserIdTournament, findAllPlayersInTournamentWithTeamData, getTournamentStartDate, getTeamsMap, findTournamentByIdCached, getPlayoffRounds, getAllTournamentGames, findGameGuessesByUserId, getTournamentPredictionCompletion, buildBreadcrumbListJsonLd
  Renders: JsonLd, AwardsPanel

### app/[locale]/tournaments/[id]/qualified-teams/page.tsx
Qualified teams (group finalists) prediction page with drag-and-drop interface.

- **generateMetadata({ params }: { params: Promise<{ id: string }> })**: `Promise<Metadata>` — [Server] Returns sub-page title `"{page.title} – {long_name} | {appName}"` with localized description; falls back to appName on error.
  Calls: buildTournamentMetadata, getTranslations, getLocale
- **fetchGroupsWithTeams(tournamentId: string)**: `Promise<Array>` — [Server] Fetches tournament groups with localized team names.
  Calls: getLocale, applyLocalizationBatch
- **initializePredictions(userId: string, tournamentId: string, groupsWithTeams: Array<{ group: TournamentGroup; teams: Team[] }>)**: `Promise<QualifiedTeamPrediction[]>` — [Server] Creates initial JSONB predictions for user in each group.
- **fetchAndFlattenPredictions(userId: string, tournamentId: string)**: `Promise<QualifiedTeamPrediction[]>` — [Server] Fetches JSONB predictions and flattens into array format.
- **QualifiedTeamsPage({ params, searchParams }: PageProps)**: `JSX.Element` — [Server] Fetches tournament, qualification config, groups, predictions, and actual results; renders client page with scoring breakdown and BreadcrumbList JSON-LD.
  Calls: getLoggedInUser, getTranslations, findTournamentByIdCached, getTournamentQualificationConfig, findQualifiedTeams, calculateQualifiedTeamsScore, getAllTournamentGames, findGameGuessesByUserId, getTournamentPredictionCompletion, getTeamsMap, buildBreadcrumbListJsonLd
  Renders: JsonLd, QualifiedTeamsClientPage

### app/[locale]/tournaments/[id]/friend-groups/page.tsx
Tournament-scoped friend groups list showing group stats for specific tournament.

- **TournamentGroupsPage(props)**: `JSX.Element` — [Server] Fetches user's groups and calculates tournament-specific stats; passes `favoriteGroupIds` and `mainGroupId` from `getGroupsForUser` to `TournamentGroupsList` for sorting and star/crown rendering.
  Calls: getLoggedInUser, getGroupsForUser, calculateTournamentGroupStats, getUserJoinRequests
  Renders: TournamentGroupsList

### app/[locale]/tournaments/[id]/friend-groups/[group_id]/page.tsx
Tournament-scoped group leaderboard with admin management interface.

- **generateMetadata({ params })**: `Promise<Metadata>` — [Server] Returns title `"{group.name} | {tournament.short_name} | {appName}"` (tournament suffix omitted if not found); falls back to appName on error.
  Calls: findProdeGroupById, findTournamentById, getTranslations, getLocale
- **TournamentScopedFriendGroup(props)**: `JSX.Element` — [Server] Fetches group, participants, user scores for tournament; checks admin status; fetches score history and pre-stored rank history for History tab (Story #335); calls computeSnapshotScores [utils] to patch latestSnapshotPoints/penultimateSnapshotPoints onto user scores before passing to ProdeGroupTable; fetches materialized ranks and passes as materializedRanksByTournament (Story #320); renders leaderboard with optional admin tabs and betting config.
  Calls: getLoggedInUser, findProdeGroupById, findTournamentById, findParticipantsInGroup, findUsersByIds, getUserScoresForTournament, findQualifiedTeams, getMaterializedLeaderboardRanks, generateShortUrlForGroup, getGroupTournamentBettingConfigAction, getGroupTournamentBettingPaymentsAction, getPendingRequestCount, getGroupJoinRequests, getScoreHistoryForGroup, getGroupRankHistory, computeSnapshotScores [utils], getTranslations, getThemeLogoUrl
  Renders: ProdeGroupTable, AdminTabs, LeaveGroupButton, InviteFriendsDialogButton (passes groupLogoUrl via getThemeLogoUrl, themeColor via theme.primary_color)

### app/[locale]/tournaments/[id]/friend-groups/discover/page.tsx
Public friend groups discovery page with search and pagination.

- **DiscoverGroupsPage(props)**: `JSX.Element` — [Server] Fetches public groups with search/pagination; determines user membership status for each group; renders browser with search UI.
  Calls: getPublicGroupsAction, getLoggedInUser, findJoinRequestsByUser, findProdeGroupsByOwner, findProdeGroupsByParticipant, getTranslations
  Renders: PublicGroupsBrowser

### app/[locale]/tournaments/[id]/friend-groups/join/[group_id]/page.tsx
Tournament-scoped join request form for groups.

- **TournamentScopedJoinGroup(props)**: `JSX.Element` — [Server] Checks authentication, membership, and rejection cooldown; renders join request form or pending/member views.
  Calls: getLoggedInUser, findTournamentById, findProdeGroupById, findParticipantsInGroup, findPendingJoinRequest, findRecentRejectedRequest
  Renders: JoinRequestForm, PendingRequestView, Alert

### app/[locale]/friend-groups/[id]/page.tsx
Global friend group leaderboard showing scores across all active tournaments.

- **generateMetadata({ params })**: `Promise<Metadata>` — [Server] Returns title `"{group.name} | {appName}"` with localized description; falls back to appName on error or missing group.
  Calls: findProdeGroupById, getTranslations, getLocale
- **FriendsGroup(props)**: `JSX.Element` — [Server] Fetches all active tournaments, group participants, user scores and qualified teams for each tournament; builds TournamentBadgeConfig per tournament; fetches materialized ranks per tournament (Story #320); fetches score history and pre-stored rank history per tournament for History tab (Story #335); calls computeSnapshotScores [utils] per tournament to patch latestSnapshotPoints/penultimateSnapshotPoints onto user scores before passing to ProdeGroupTable.
  Calls: getLoggedInUser, findProdeGroupById, findParticipantsInGroup, findUsersByIds, findAllActiveTournaments, getUserScoresForTournament, findQualifiedTeams, getMaterializedLeaderboardRanks, getGroupTournamentBettingConfigAction, getGroupTournamentBettingPaymentsAction, generateShortUrlForGroup, getScoreHistoryForGroup, getGroupRankHistory, computeSnapshotScores [utils], getThemeLogoUrl, toMap
  Renders: ProdeGroupTable, ProdeGroupThemer, InviteFriendsDialogButton (passes groupLogoUrl via getThemeLogoUrl, themeColor via theme.primary_color), LeaveGroupButton

### app/[locale]/friend-groups/join/[id]/page.tsx
Global join request form for groups.

- **JoinGroup(props)**: `JSX.Element` — [Server] Checks authentication and membership; renders join request form or pending/member views.
  Calls: getLoggedInUser, findProdeGroupById, findParticipantsInGroup, findPendingJoinRequest
  Renders: JoinRequestForm, PendingRequestView, Alert

### app/[locale]/manifest.webmanifest/route.ts
PWA manifest endpoint that generates locale-specific app manifest.

- **GET(_request, { params })**: `NextResponse` — [Server] Returns PWA manifest JSON with localized app name/description, icons, and theme colors.
  Calls: getTranslations

### app/api/proxy-image/route.ts
Same-origin image proxy for bypassing S3/CDN CORS restrictions in html-to-image capture.

- **GET(request: NextRequest)**: `NextResponse` — [Server] Proxies an external image URL (passed as `?url=` query param) server-side and returns it same-origin with `Cache-Control: public, max-age=86400, stale-while-revalidate=3600`. Accepts only `https://` URLs to limit SSRF surface. Returns 400 on missing/non-https URL, 502 on upstream fetch failure.

### app/j/[code]/page.tsx
Short URL redirect handler for group join links.

- **ShortUrlRedirect(props)**: `never` — [Server] Looks up short URL code and redirects to tournament-scoped or global group join page with detected locale.
  Calls: getShortUrlByCode, incrementClickCount, cookies