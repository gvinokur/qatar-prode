# CODE-STRUCTURE.md

Living map of all production source files, their exported functions/components, and call relationships.

**Format guide:** `docs/claude/code-structure.md`
**Last updated:** 2026-05-19

---

## File Index

### [docs/code-structure/db.md](docs/code-structure/db.md)
All Kysely repository functions for every database table (`app/db/`). Read this when a story
touches data access — finding an existing query to reuse, adding a new query, understanding
available columns, or checking caching behaviour. Each function shows its exact TypeScript
signature. No auth or localization logic lives here; repositories are pure data access.
Tables covered: users, tournaments, games, game_guesses, game_results, tournament_guesses,
prode_groups, join_requests, qualified_teams, players, venues, short_urls, and more.

### [docs/code-structure/actions.md](docs/code-structure/actions.md)
All Server Actions (`app/actions/`). Read this for any story that changes business logic,
adds a new mutation or query, or needs to understand what auth/localization/validation
a given action applies before calling the database. Each action shows which repositories
and utilities it calls. This is the primary integration point between UI components and
the database.

### app/actions/hub-actions.ts
Provides data for the Tournament Hub's "Action Center" carousel, focusing on urgent, unpredicted games.

- **getHubPredictions(tournamentId, locale)**: `Promise<{ urgentPredictions: GamePredictionForHub[]; fallbackGames: GamePredictionForHub[] }>` — Fetches urgent, unpredicted games for the hub action center, with a fallback list of upcoming games.
  Calls: auth, getTranslations, findTournamentById, getAllTournamentGames, applyLocalizationBatch, findGameGuessesByUserId, calculateDeadline, formatCountdown

### [docs/code-structure/utils.md](docs/code-structure/utils.md)
All utility functions (`app/utils/`). Read this when looking for existing calculation or
helper logic before writing new code — score calculators, group position sorting, playoff
bracket calculation, localization helpers, email templates, date utilities, rank calculators,
sharing utilities, and more. Many bugs in past implementations came from duplicating logic
that already existed here.

### [docs/code-structure/pages.md](docs/code-structure/pages.md)
All Next.js page components, layouts, route handlers, and API routes (`app/[locale]/`,
`app/layout.tsx`, `app/api/`). Read this to understand which server actions a page calls,
which client components it renders as children, and how authentication state affects what
gets shown. Also covers middleware and short-URL redirect routes.

### [docs/code-structure/components/components-tournament-hub.md](docs/code-structure/components/components-tournament-hub.md)
Components for the Tournament Hub — the Action Center widget that surfaces urgent pending predictions. Covers `TournamentHubActionCenter` (Server wrapper) and `ActionCenterCarousel` (Client component with flip card edit state). Read this for any story touching the hub's Action Center (Story #317 and onwards).

### [docs/code-structure/components/components-tournament-games.md](docs/code-structure/components/components-tournament-games.md)
Components for the core game prediction experience: flippable game cards, urgency-based
accordion grouping, score input (stepper), boost selector (silver/golden), game filters,
prediction edit controls, game result dialogs, countdown display, point overlays, and the
unified games page that ties them together. Read this for any story touching game prediction
UI, score display, boost interactions, or the main tournament games feed.

### [docs/code-structure/components/components-tournament-page.md](docs/code-structure/components/components-tournament-page.md)
Components for the tournament home/overview experience: tournament group cards, group standings
sidebar, groups list, scrollable content areas, tournament sidebar navigation, public CTA bar,
read-only game cards for unauthenticated users, the home page tournament redirect, tournament
switcher, and rules/scoring explanation pages. Read this for stories touching the main
tournament landing page, group stage overview, or public-facing tournament views.

### [docs/code-structure/components/components-friend-groups.md](docs/code-structure/components/components-friend-groups.md)
All components for the friend groups feature: group management UI (`friends-group-table`,
`group-privacy-settings`), join request forms and manager, public group discovery browser,
admin panels (betting config, admin tabs), group theme/image picker, sharing templates
(leaderboard, head-to-head, personal highlight), empty states, notification dialogs, and
leave-group button. Read this for any story touching friend groups, invitations, public
discovery, join requests, or group-level leaderboard.

### [docs/code-structure/components/components-leaderboard-stats.md](docs/code-structure/components/components-leaderboard-stats.md)
Leaderboard components (`LeaderboardView`, `LeaderboardTable`, `LeaderboardCards`,
`LeaderboardCard`, `HeadToHeadDialog`, rank change animations) and tournament statistics
cards (`PerformanceOverviewCard`, `PredictionAccuracyCard`, `BoostAnalysisCard`, `StatsTabs`, `HistoryTabCard`, `ScoreGrowthChart`).
Also covers the qualified-teams prediction UI (`QualifiedTeamsClientPage`, `GroupCard`,
`DraggableTeamCard`, `QualifiedTeamsGrid`, `ThirdPlaceSummary`). Read this for stories
touching the leaderboard, head-to-head comparison, user stats, or qualified teams prediction.

### [docs/code-structure/components/components-results-playoffs.md](docs/code-structure/components/components-results-playoffs.md)
Results page and playoff bracket components: `ResultsPageClient`, `GroupsStageView`,
`PlayoffsBracketView`, `BracketGameCard`, `GroupResultCard`, bracket layout utilities,
minimalistic games list, and the tabbed playoff page. Also includes tournament-page
sub-components like the tournament group card, standings sidebar, and join group dialog.
Read this for stories touching the results page, bracket visualisation, or playoff display.

### [docs/code-structure/components/components-auth-onboarding.md](docs/code-structure/components/components-auth-onboarding.md)
Auth flow components (`LoginOrSignupDialog` orchestrates: `LoginForm`, `SignupForm`,
`ForgotPasswordForm`, `OTPVerifyForm`, `AccountSetupForm`, `EmailInputForm`), user settings
dialog, awards prediction panel (`AwardsPanel`, `TeamSelector`, `MobileFriendlyAutocomplete`),
onboarding dialog with 7 progressive steps, onboarding tooltips and checklist, and email
verification components. Read this for stories touching authentication, signup, onboarding
flow, awards predictions, or email verification.

### [docs/code-structure/components/components-backoffice.md](docs/code-structure/components/components-backoffice.md)
All admin/backoffice UI components: tabbed backoffice layout, game result editing
(`BackofficeFlippableGameCard`, `BackofficeGameResultEditControls`), bulk score actions,
group and playoff management tabs, tournament setup forms (main data, scoring config,
permissions, third-place rules), teams/groups/players manager tabs, notification sender,
i18n field editor, and the awards assignment tab. Read this for any story adding or changing
backoffice/admin functionality.

### [docs/code-structure/components/components-shared-ui.md](docs/code-structure/components/components-shared-ui.md)
Shared infrastructure components used across the application: context providers
(`GuessesContextProvider`, `FilterContextProvider`, `CountdownContextProvider`,
`EditModeContextProvider`, `TimezoneContextProvider`, `ThemeProvider`), header
(`Header`, `ConditionalHeader`, `LanguageSwitcher`, `ThemeSwitcher`, `UserActions`),
skeleton loaders for every major page section, common utilities (`ScrollShadowContainer`,
`DevTournamentBadge`), PWA helpers (`InstallPWA`, `ServiceWorkerRegistration`),
session wrapper, offline detection, and notification subscription prompt. Read this
for stories touching global layout, theming, authentication state display, or loading states.

---

## Call Graph

Strict layered architecture: **Pages → Server Actions → Repositories → Database**. Client Components call Server Actions; Server Components call Server Actions directly.

```
Architecture:
  [Page (Server Component)]
    └── calls Server Action directly
    └── renders Client Component [renders]
          └── calls Server Action [server action]

Key flows:

1. Predictions dashboard (games page — /tournaments/[id]/games)
   TournamentGamesPage (Server)
     └── UnifiedGamesPage [renders] (Server)
           ├── getLoggedInUser
           ├── getTeamsMap [server action]
           ├── getAllTournamentGames
           ├── findGameGuessesByUserId
           ├── getPredictionDashboardStats
           ├── getTournamentPredictionCompletion
           ├── findGroupsInTournament
           ├── findPlayoffStagesWithGamesInTournament
           ├── getGamesClosingWithin48Hours
           └── getPlayoffRoundsAvailability → findPlayoffRoundsWithAvailabilityInfo → computeNowAvailableRoundIds
           └── GuessesContextProvider [Provider]
                 ├── holds: all game guesses + boost counts (state)
                 └── auto-save: updateOrCreateGameGuesses [server action]
                               └── updateOrCreateGuess
                 └── EditTriggerContextProvider [Provider]
                       └── UnifiedGamesPageClient [renders]
                             └── FilterContextProvider [Provider]
                                   └── UnifiedGamesPageContent [Client]
                                         └── uses: GuessesContext, FilterContext
                                         ├── computeGamesHeaderVariant → PredictionStatusHeader [renders]
                                         └── GamesListWithScroll [renders]
                                               └── uses: GuessesContext
                                               └── FlippableGameCard [renders]
                                                     └── uses: GuessesContext
                                                     ├── GameView [renders] (front face)
                                                     │     └── CompactGameViewCard [renders]
                                                     └── GamePredictionEditControls [renders] (back face)
                                                           └── uses: GuessesContext (reads + writes guess)
                                                           └── GameBoostSelector [renders]
                                                                 └── setGameBoostAction [server action]
                                                                       └── setGameGuessBoost

2. Game scoring pipeline
   Triggered by: cron via app/api/update-guesses GET → calculateGameScores
                 or: saveGameResults (backoffice) → calculateGameScores (see flow 14)
   calculateGameScores [server action]
     ├── findAllGamesWithPublishedResultsAndGameGuesses
     ├── findAllGuessesForGamesWithResultsInDraft (draft recalc)
     ├── calculateScoreForGame (util) → returns { score, tier: PredictionTier } [Story #364]
     ├── updateGameGuessWithBoost(guessId, baseScore, boostType, tier) [writes prediction_tier, Story #364]
     ├── updateGameGuess
     ├── recalculateGameScoresForUsers
     │     ├── (materializes scores + goal_difference counts → tournament_guesses, Story #364)
     │     └── writeScoreSnapshot (per user, using updated game scores + existing award scores)
     └── recalculateGroupRankingsForUsers(tournamentId, changedUserIds) [see flow 27]

3. Friend group join request flow
   PublicGroupsBrowser [Client]
     └── getPublicGroupsAction [server action]
           ├── findPublicGroups
           └── countPublicGroups
   JoinRequestForm [Client]
     └── requestToJoinGroup [server action]
           ├── findPendingJoinRequest (cooldown check)
           ├── createJoinRequest
           └── sendEmail (notify admins)
   JoinRequestManager [Client] (admin)
     ├── approveJoinRequestAction [server action]
     │     ├── approveJoinRequestRepo (adds user to group)
     │     └── sendEmail (notify requester)
     └── rejectJoinRequestAction [server action]
           ├── rejectJoinRequestRepo
           └── sendEmail (notify requester)
   PendingRequestView / PendingRequestsCard [Client]
     └── cancelJoinRequestAction [server action]
           └── cancelJoinRequestRepo

4. Qualified teams prediction
   QualifiedTeamsPage (Server)
     ├── getLoggedInUser
     ├── getTournamentQualificationConfig [server action]
     ├── findQualifiedTeams
     ├── calculateQualifiedTeamsScore (util)
     ├── getAllTournamentGames
     ├── getTournamentPredictionCompletion [repo] → returns completedGroupGames + totalGroupGames
     └── derives qtBannerState: QTBannerState
     └── QualifiedTeamsClientPage [renders]
           └── QualifiedTeamsContextProvider [Provider]
                 ├── holds: position predictions per group (state)
                 └── auto-save: updateGroupPositionsJsonb [server action]
                               ├── upsertGroupPositionsPrediction
                               └── updatePlayoffGameGuesses
                                     ├── getAllUserGroupPositionsPredictions
                                     ├── calculatePlayoffTeamsFromPositions (util)
                                     └── updateGameGuessByGameId
                 └── QualifiedTeamsUI [renders]
                       ├── computeQTHeaderVariant → PredictionStatusHeader [renders]
                       │     └── (auto-fill action) on confirm: bulkAutoFillFromPredictions [server action]
                       │                     ├── findTournamentById (→ tiebreaker_mode)
                       │                     ├── findGameGuessesByUserId
                       │                     ├── computeGroupStandingsFromGuesses (util, tiebreakerMode)
                       │                     ├── upsertGroupPositionsPrediction
                       │                     └── updatePlayoffGameGuesses
                       │     └── on success: onAutoFillSuccess → resetPredictions (context, no refresh)
                       └── DndContext [renders]
                             └── QualifiedTeamsGrid [renders]
                                   └── GroupCard [renders]
                                         └── DraggableTeamCard [renders]

5. Group stats / leaderboard & social sharing
   TournamentScopedFriendGroup (Server)
     ├── getLoggedInUser
     ├── findProdeGroupById
     ├── findParticipantsInGroup
     └── getUserScoresForTournament [server action]
           ├── getGameGuessStatisticsForUsers (materialized)
           ├── findTournamentGuessByUserIdsTournament
           └── getBoostStatsForUsersInTournament (parallel, for badge data)
     └── AdminTabs [renders] (Clasificación/Historial/Admin? tabs for all users)
           ├── standingsContent → ProdeGroupTable [renders]
           │     └── LeaderboardView [renders] (simple passthrough)
           │           └── LeaderboardCards [renders]
           │                 ├── calculateBadges (util) — useMemo, computes Badge[] per user
           │                 ├── HeadToHeadDialog [renders] (on compare click)
           │                 │     ├── getUserStatsForComparison [server action]
           │                 │     │     ├── getGameGuessStatisticsForUsers
           │                 │     │     ├── getTournamentGuessStatsForUsers
           │                 │     │     └── calculateAccuracyStats (util)
           │                 │     ├── HeadToHeadTemplate [renders] (off-screen, image source)
           │                 │     └── SharePreviewModal [renders]
           │                 │           └── captures DOM → generates image → download/WhatsApp share
           │                 ├── LeaderboardTemplate [renders] (off-screen, leaderboard image source)
           │                 ├── PersonalHighlightTemplate [renders] (off-screen, personal card image source)
           │                 └── SharePreviewModal [renders] (on share click)
           │                       └── captures DOM → generates image → download/WhatsApp share
           ├── historyContent → HistoryTab [renders] (data pre-loaded server-side)
           │     ├── ScoreHistoryChart [renders]
           │     └── RankHistoryChart [renders]
           └── adminContent → AdminSectionTabs [renders] (admin only)

5b. Score history + rank-change snapshot — server-loaded data path
    TournamentScopedFriendGroup (Server):
      └── getScoreHistoryForGroup [server action]
            ├── findUsersByIds (display names)
            ├── getScoreHistoryForUsers
            ├── findFirstGameInTournament
            └── findLastGameInTournament
      └── computeSnapshotScores [utils/score-history-utils, pure]
            → patches latestSnapshotPoints / penultimateSnapshotPoints onto UserScore[]
    FriendsGroup (Server) — per active tournament:
      └── getScoreHistoryForGroup [server action] (same as above)
      └── computeSnapshotScores [utils/score-history-utils, pure]
            → patches latestSnapshotPoints / penultimateSnapshotPoints onto UserScore[]
    Patched UserScore[] → ProdeGroupTable → LeaderboardView → LeaderboardCards
      → computeSnapshotScores result drives rank-change animation

6. Authentication & signup
   LoginOrSignupDialog [Client] (orchestrates all sub-flows)
     └── EmailInputForm [renders]
           └── checkAuthMethods [server action]
                 └── getAuthMethodsForEmail
   LoginForm [Client]
     └── signIn (credentials)
   SignupForm [Client]
     └── signupUser [server action]
           ├── findUserByEmail
           ├── createUser
           ├── getPasswordHash
           └── sendVerificationEmail
   OTPVerifyForm [Client]
     ├── sendOTPCode [server action]
     │     └── sendEmail
     └── verifyOTPCode [server action]
           └── verifyOTP
   AccountSetupForm [Client]
     └── createAccountViaOTP [server action]
           ├── findUserByEmail
           └── updateUser
   NicknameSetupDialog [Client] (OAuth post-signup)
     └── setNickname [server action]
           └── updateUser
   VerificationBanner [Client] (persistent on all pages for unverified users)
     └── resendVerificationEmail [server action]
           └── sendVerificationEmail

7. Email verification
   VerifyEmailPage (Server)
     └── EmailVerifier [renders]
           └── verifyUserEmail [server action]
                 ├── findUserByVerificationToken
                 └── verifyEmail
           └── signOut (forces re-login with verified session)

8. Password reset
   ForgotPasswordForm [Client]
     └── sendPasswordResetLink [server action]
           ├── findUserByEmail
           ├── generatePasswordResetEmail (util)
           └── sendEmail
   ResetPasswordPage [Client]
     ├── verifyResetToken [server action]
     └── updateUserPassword [server action]
           └── updateUser

9. Onboarding flow
   ServerHome (Server)
     ├── getOnboardingStatus
     └── OnboardingTrigger [renders] (Server)
           └── OnboardingDialogClient [renders]
                 ├── getTournaments [server action] (loads active tournament)
                 └── OnboardingDialog [renders]
                       ├── saveOnboardingStep [server action]
                       │     └── updateOnboardingData
                       ├── markOnboardingComplete [server action]
                       │     └── completeOnboarding
                       └── skipOnboardingFlow [server action]
                             └── skipOnboarding
   OnboardingChecklist [Client]
     └── updateChecklistItem [server action]
           └── updateChecklistItemRepo
   OnboardingTooltip [Client] (scattered across UI)
     └── dismissTooltip [server action]
           └── dismissTooltipRepo

10. Awards prediction
    Awards (Server)
      ├── getLoggedInUser
      ├── findTournamentByIdCached (in parallel, for breadcrumb)
      ├── findTournamentGuessByUserIdTournament
      ├── findAllPlayersInTournamentWithTeamData
      ├── getTournamentStartDate [server action]
      ├── getPlayoffRounds [server action]
      ├── getAllTournamentGames
      ├── findGameGuessesByUserId
      └── getTournamentPredictionCompletion
      └── AwardsPanel [renders]
            ├── computeAwardsHeaderVariant → PredictionStatusHeader [renders]
            └── updateOrCreateTournamentGuess [server action]
                  └── dbUpdateOrCreateTournamentGuess

11. Tournament results page
    ResultsPage (Server)
      ├── findGamesInTournament
      ├── getTeamsMap [server action]
      ├── getGroupStandingsForTournament [server action]
      │     ├── findTournamentById (→ tiebreaker_mode)
      │     └── calculateGroupPosition (util, sortByGamesBetweenTeams from tiebreaker_mode)
      └── findPlayoffStagesWithGamesInTournament
      └── ResultsPageClient [renders]
            ├── GroupsStageView [renders] (groups tab)
            │     └── GroupResultCard [renders]
            │           ├── MinimalisticGamesList [renders]
            │           └── TeamStandingsCards [renders]
            └── PlayoffsBracketView [renders] (playoffs tab)
                  ├── buildOrderedBracketRounds (bracket-layout-utils)
                  │     └── isTeamWinnerRule (playoffs-rule-helper)
                  └── BracketGameCard [renders]

12. User stats page
    TournamentStatsPage (Server)
      ├── getLoggedInUser
      ├── findTournamentByIdCached
      ├── getGameGuessStatisticsForUsers
      ├── findTournamentGuessByUserIdTournament
      ├── getBoostAllocationBreakdown
      ├── getGameCountsForTournament
      ├── countGameGuessesByUserId
      ├── calculateAccuracyStats (util)
      ├── calculateBoostStats (util)
      └── getScoreHistoryForUsers (score-history-repository)
      └── StatsTabs [renders]
            ├── PerformanceOverviewCard, PredictionAccuracyCard, BoostAnalysisCard [renders]
            └── HistoryTabCard [renders]
                  └── ScoreGrowthChart [renders] (when rows.length > 0)

13. Friend group management
    FriendGroupsList [Client] (sidebar)
      ├── createDbGroup [server action]
      │     └── createProdeGroup
      ├── deleteGroup [server action]
      │     └── deleteProdeGroup
      ├── toggleFavoriteGroupAction [server action]
      │     └── getFavoriteGroupIds, addFavoriteGroup | removeFavoriteGroup
      └── setMainGroupAction [server action]
            └── getFavoriteGroupIds, setMainGroup
    TournamentGroupsList [Client] (friend-groups page)
      ├── createDbGroup [server action]
      │     └── createProdeGroup
      ├── toggleFavoriteGroupAction [server action]
      │     └── getFavoriteGroupIds, addFavoriteGroup | removeFavoriteGroup
      └── setMainGroupAction [server action]
            └── getFavoriteGroupIds, setMainGroup
    LeaveGroupButton [Client]
      └── leaveGroupAction [server action]
            └── deleteParticipantFromGroup
    AdminSectionTabs [Client] (admin view — 4 tabs)
      ├── JoinRequestManager [renders] → approveJoinRequestAction / rejectJoinRequestAction
      ├── GroupPrivacySettings [renders]
      │     └── updateGroupPrivacyAction [server action]
      │           └── updateGroupPrivacy
      ├── GroupTournamentBettingAdmin [renders]
      │     └── setGroupTournamentBettingConfigAction, setUserGroupTournamentBettingPaymentAction
      └── ProdeGroupThemer [renders]
            └── updateTheme [server action]
                  └── updateProdeGroup, deleteThemeLogoFromS3
    NotificationDialog [Client] (admin — send to group)
      └── sendGroupNotification [server action]
            ├── findParticipantsInGroup
            └── sendNotification

14. Backoffice game result editing
    GroupsTab [Client] → getGroupDataWithGamesAndTeams [server action]
      ├── findGroupsWithGamesAndTeamsInTournament
      └── findTournamentById (→ tiebreakerMode passed to each GroupBackoffice)
    GroupBackoffice [Client] (group stage, receives tiebreakerMode prop)
      ├── getCompleteGroupData [server action]
      ├── saveGamesData [server action]
      ├── calculateAndStoreGroupPosition [server action] (sortByGamesBetweenTeams from tiebreakerMode)
      ├── calculateAndStoreQualifiedTeamsScores [server action]
      │     ├── writeScoreSnapshot (per user, upsert RETURNING *)
      │     └── recalculateGroupRankingsForUsers(tournamentId, affectedUserIds) [see flow 27]
      ├── calculateAndSavePlayoffGamesForTournament [server action]
      └── BackofficeFlippableGameCard [renders]
            └── BackofficeGameResultEditControls [renders]
                  └── saveGameResults [server action]
                        ├── updateGameResult / createGameResult
                        └── calculateGameScores [see flow 2]
      └── BulkActionsMenu [renders]
            ├── autoFillGameScores [server action]
            └── clearGameScores [server action]
    PlayoffTab [Client] (playoff stage)
      ├── getCompletePlayoffData [server action]
      ├── saveGameResults [server action]
      └── updateTournamentHonorRoll [server action]
            ├── updateTournamentGuess
            ├── writeScoreSnapshot (per user, with all 6 score segments from updated guess)
            └── recalculateGroupRankingsForUsers(tournamentId, affectedUserIds) [see flow 27]
   GroupStageTab [Client] (awards via GroupStageTab)
      └── updateTournamentAwards [server action]
            ├── updateTournamentGuess
            ├── writeScoreSnapshot (per user, with all 6 score segments from updated guess)
            └── recalculateGroupRankingsForUsers(tournamentId, affectedUserIds) [see flow 27]

15. Push notifications (Story #390: InstallPwa + NotificationsSubscriptionPrompt global snackbars removed; functionality absorbed into EngagementRotatorWidget on the hub page)
    EngagementRotatorWidget [Client] (notification-opt-in card in rotation)
      └── Notification.requestPermission() [browser API, on user click]
      └── subscribeUser [server action, called externally when permission granted]
                  └── addNotificationSubscription
    UserSettingsDialog [Client] (manage from settings)
      ├── subscribeUser [server action]
      └── unsubscribeUser [server action]
            └── removeNotificationSubscription
    NotificationSender [Client] (admin — broadcast)
      └── sendNotification [server action]
            └── sendPushNotification

16. Short URL / group invite
    app/j/[code]/page.tsx (Server)
      ├── getShortUrlByCode
      └── incrementClickCount
    InviteFriendsDialogButton [Client]
      └── InviteFriendsDialog [renders]
            ├── generateShortUrlForGroup [server action]
            │     └── getOrCreateShortUrl
            ├── Email tab (Tab 1)
            │     └── EmailInvitationsTab [Client]
            │           └── sendGroupEmailInvitations [server action]
            │                 ├── getLoggedInUser
            │                 ├── findProdeGroupById
            │                 ├── findParticipantsInGroup (admin check)
            │                 ├── generateShortUrlForGroup + buildShortUrl (invite link)
            │                 ├── generateGroupInvitationEmail [util] (per recipient)
            │                 │     → colored header (themeColor + groupLogoUrl img)
            │                 │     → personalized greeting (recipientName)
            │                 │     → sender attribution (senderDisplayName)
            │                 └── sendEmail [util] (parallel Promise.allSettled)
            └── Folleto tab (Tab 2)
                  ├── rewrites groupLogoUrl → /api/proxy-image?url=<encoded> (same-origin proxy)
                  │     └── app/api/proxy-image/route.ts [API route] → upstream fetch (server-side, no CORS)
                  ├── InviteFlierTemplate [renders] (360×480px card; Avatar/img + QRCodeSVG + shortUrl)
                  ├── captureElement [util] → toPng (html-to-image; logo inlines via proxy URL)
                  ├── downloadBlob [util] → browser download
                  └── shareImage [util] → navigator.share or WhatsApp fallback

17. Backoffice Users tab
    UsersTab [Client] (self-fetching, no server props)
      ├── getUsersPaginated [server action] (on mount + search/page change)
      │     ├── findUsersPaginated
      │     └── countUsers
      └── toggleUserAdFreeAction [server action] (on Ad-Free switch toggle)
            └── updateUserAdFreeStatus

18. AdSense Auto Ads (SPA page-view signaling and ad-free suppression)
    LocaleLayout (Server)
      └── AdSensePageViewTracker [Client]
            ├── uses useSession to determine ad-free status
            ├── conditionally loads AdSense script based on user.isAdFree
            ├── adsbygoogle.push({}) (on pathname change — signals virtual page view to Auto Ads)
            └── adsbygoogle.pauseAdRequests = X (to suppress ads for ad-free users)

19. Ad-free toggle
    UsersTab [Client] → toggleUserAdFreeAction [server action] → updateUserAdFreeStatus

20. Backoffice player import (Transfermarkt)
    Backoffice [Server] → PlayersTab [Client]
      ├── getPlayersInTournament [server action] (on mount)
      │     └── findTeamInTournament, findPlayersByTeamId
      ├── getTransfermarktPlayerData [server action] (on import submit)
      │     └── getTournamentStartDate → findFirstGameInTournament
      ├── createTournamentTeamPlayers [server action] (after scrape)
      │     └── createPlayer
      ├── deleteTournamentTeamPlayers [server action] (when deleteExisting checked)
      │     └── deletePlayer
      └── saveTeamTransfermarktId [server action] (fire-and-forget after successful import)
            └── updateTeaminDb

21. GA4 Analytics (page-view tracking and event tracking)
    LocaleLayout (Server)
      └── <Suspense> → AnalyticsPageViewTracker [Client]
            ├── skips all tracking when NEXT_PUBLIC_GA_MEASUREMENT_ID unset or user.isAdFree
            ├── initializeGA4() on mount (sets gtag config, disables auto page views)
            └── trackPageView(url) on each pathname/searchParams change

    Modified flows for event tracking:
    - Flow 1 (Predictions): GuessesContextProvider.updateGameGuess
          → updateOrCreateGameGuesses [server action] returns analyticsEvent
          → trackEvent('prediction_submitted', { number_of_guesses, game_ids })
    - Flow 13 (Friend group management): JoinRequestManager.handleApprove
          → approveJoinRequestAction [server action] returns analyticsEvent
          → trackEvent('group_joined', { group_id, tournament_id })

22. Sitemap (dynamic XML sitemap for SEO)
    GET /sitemap.xml → app/sitemap.ts
      ├── findAllActiveTournaments() (no userId → dev_only excluded)
      └── findAllPublicGroupsForSitemap()
      → returns MetadataRoute.Sitemap with localized URLs (en, es)
         and alternates.languages hreflang for each entry

23. Robots.txt (static crawl directives)
    GET /robots.txt → app/robots.ts
      → returns MetadataRoute.Robots (static, no DB calls)
         disallows: /*/backoffice, /*/delete-account, /*/verify-email, /*/reset-password, /api/

24. Tournament location management (Story #310)
    TournamentMainDataTab [Client] → createOrUpdateTournament [server action]
      ├── parseFormData (extracts locations[] from FormData 'locations' key)
      └── prepareTournamentData → saveOrUpdateTournament → updateTournament / createTournament
          (locations flows as part of tournamentData payload)

    getTournamentLocations [server action] (read path for story #303 JSON-LD use)
      └── findTournamentById → returns tournament.locations ?? []

25. JSON-LD structured data — SportsEvent (tournament layout)
    TournamentLayout (Server)
      ├── [already-fetched] layoutData.tournament.long_name (from getTournamentAndGroupsData)
      ├── [already-fetched] tournamentStartDate (from getTournamentStartDate)
      ├── getTournamentLocations [server action] → tournament.locations ?? []
      └── buildSportsEventJsonLd(name, url, startDate, locations) (json-ld-utils)
            └── JsonLd [renders] → <script type="application/ld+json">

26. JSON-LD structured data — BreadcrumbList (tournament sub-pages)
    Sub-page generateMetadata (results, stats, awards, qualified-teams, rules)
      └── buildTournamentMetadata → findTournamentByIdCached (React.cache deduplicates with sub-page)
    Sub-page default export (results, stats, awards, qualified-teams, rules)
      └── findTournamentByIdCached (cache hit — no extra DB call)
            └── buildBreadcrumbListJsonLd(items) (json-ld-utils)
                  └── JsonLd [renders] → <script type="application/ld+json">

27. Group rank snapshot — write path (Story #315)
    Admin action (calculateGameScores / updateTournamentAwards / updateTournamentHonorRoll / calculateAndStoreQualifiedTeamsScores)
      └── recalculateGroupRankingsForUsers(tournamentId, changedUserIds)
            └── findGroupsForUsers(changedUserIds) → [groupId, ...]
                  └── per group: recalculateGroupRankings(groupId, tournamentId)
                        ├── findProdeGroupById(groupId)
                        ├── findParticipantsInGroup(groupId)
                        ├── getUserScoresForTournament(memberIds, tournamentId)
                        ├── calculateRanks(scores, 'totalPoints')
                        └── upsertGroupRankingSnapshots(snapshots) → group_rankings table

28. Group rank snapshot — read path (Story #315; extended Story #320)
    getGroupRankingForUser(userId, groupId, tournamentId) [server action]
      └── getLatestTwoGroupRankingSnapshots(userId, groupId, tournamentId) → [current, previous?]
            → derives rankChange = previous.rank - current.rank (positive = improved)
            → returns MaterializedGroupRanking | null

    getMaterializedLeaderboardRanks(groupId, tournamentId) [server action, added Story #320]
      └── getLatestRankingsForGroupWithChange(groupId, tournamentId)
            ├── query 1: 2 most-recent distinct snapshot_dates
            ├── query 2: all users' ranks at latest date
            └── query 3: all users' ranks at penultimate date (if exists)
                  → joins via Map → returns { userId, currentRank, previousRank | null, currentScore }[]
      → builds Map<userId, { currentRank, rankChange }> (rankChange = previousRank - currentRank)
      → passed to FriendGroupPage → ProdeGroupTable → LeaderboardView → LeaderboardCards
      → LeaderboardCards uses currentRank and rankChange from map; falls back to positional rank when map empty

29. Tournament Hub shell (Story #316; updated #317, #318, #319, #338 — promoted to root; #349 — data lift; #354 — two-zone layout; #355 — real banner logic; #356 — Games widget; #390 — Priority Attention Widget; #411 — merged timing into getTournamentHubPageData; #441 — migrated banners to PredictionStatusHeader)
    TournamentHubPage (Server) — /tournaments/[id]  (root; /tournaments/[id]/hub redirects here)
      → getTournamentHubPageData(tournamentId, locale) + getLoggedInUser() [parallel; Story #356; locale added #411]
      → getRulesBySection(scoringConfig, tRules)  [page-level, shared scoringRules; Story #356]
      → getActionCenterGames(id, locale)  [conditional: user && !isFinished; null otherwise; timing fields now in hubData #411]
          → findPlayoffRoundsWithAvailabilityInfo + computeNowAvailableRoundIds → nowAvailablePlayoffRound
      → renders DashboardBanner(user, hubData) [Story #355: hero + secondary banner stack; Story #390: TutorialCTACard removed; #411: hubData replaces timing param; #441: LoggedOffBanner → HubLoggedOutHeader]
          DashboardBanner (Server)
            → [hero reads from hubData — available for all users]
            → [hero] TournamentStartBanner [Client] (when hubData.tournamentJustStarted)
            → [hero] PreTournamentCountdown [Client] (when !hubData.tournamentHasStarted && hubData.firstGameDate set)
            → [secondary] HubLoggedOutHeader [Client] (when !user; Story #441: uses computeLoggedOutVariant → PredictionStatusHeader)
      → renders PriorityAttentionWidget(data, gamesHref, qtHref, awardsHref, locale, tournamentId) [Story #390: only when user && actionCenterData]
          PriorityAttentionWidget (Server)
            → computePriorityAttention(data)  [pure; returns PriorityAttentionState | null]
            → [null] EngagementRotatorWidget [Client] (Tier 3: uses computeEngagementVariant → PredictionStatusHeader; Story #441)
            → [non-null] computeHubPriorityVariant(state, t, ...) → PredictionStatusHeader [Story #441: replaces bespoke Paper card]
      → renders GamesPredictionWidget (zero-fetch orchestrator; Story #356)
          → [isFinished] → null
          → [!actionCenterData] → GamesInfoWidget(isLoggedOff=true, predictedGames=0)
              → DashboardCard
          → [actionCenterData && !isStarted] → GamesInfoWidget(isLoggedOff=false)
              → DashboardCard
          → [actionCenterData && isStarted] → GamesActiveWidget (Server)
              → GamesActiveSection [Client] — owns carousel state; initialSilverUsed/initialGoldenUsed from ActionCenterData
                  → GuessesContextProvider [Provider] (key={refetchKey}; tournamentSilverUsed/tournamentGoldenUsed for correct boost counts)
                  → GamesActiveClient [Client]
                      → FlippableGameCard → updateOrCreateGameGuesses (via context autoSave)
                  → on all urgentGameIds complete: getCarouselGames (lightweight refetch)
                      → increments refetchKey → remounts GuessesContextProvider + GamesActiveClient
      → renders DashboardCard ×3 (Standings, Groups, Results placeholder)

30. Action Center data flow (Story #317; updated #342, #349)
    TournamentHubActionCenter (Server) — uses pre-fetched ActionCenterData from page (Story #349)
      → computeIsIncompleteUser(data)
      → [branch: isIncompleteUser && pre-tournament] PreTournamentNewUserActionCenter [Server] (Story #349)
          → PreTournamentCountdown [Client] (conditional: firstGameDate set)
          → TutorialCTACard [Client]
              → OnboardingDialogClient [Client] (conditional: open=true)
          → PredictionTrackCard ×3 (Matches, QT, Awards) with getRulesBySection rules
      → [branch: complete user] ActionCenterCarousel [Client]
          → TournamentStartBanner [Client] (conditional: tournamentJustStarted=true, shown above carousel)
          → GuessesContextProvider (gameGuesses, autoSave=true, boost limits)
          → [branch: isPreTournament] PreTournamentHero [Client]
              → FlippableGameCard (opener game)
              → CircularProgress ×3 (QT, Awards, Overall)
          → [branch: active] ScrollShadowContainer (direction="horizontal")
              → FlippableGameCard ×N → updateOrCreateGameGuesses (via context autoSave)

31. Recent Results data flow (Story #318, updated Story #373)
    TournamentHubRecentResults (Server) → getRecentResultsData(tournamentId, locale)
      → getLoggedInUser
      → findRecentGamesForDashboard(userId, tournamentId, 10) (all games where prediction deadline passed)
      → findTeamInTournament(tournamentId)
      → applyLocalizationBatch (teams)
      → derives gameStatus per game (finished / about_to_start / pending)
      → returns RecentResultsData { recentGames: RecentGameResultItem[] }
    → RecentResultsWidget [Client]
        → renders games list (✅/❌/🕐 per gameStatus) with 5 visual states
        → "View full statistics" button → /${locale}/tournaments/${tournamentId}/stats

32. Leaderboard Peek data flow (Story #319; updated #342, #358, #413)
    TournamentHubPage (hub page) [renders via Suspense] TournamentHubLeaderboardPeek (Server)
      isAuthenticated={!!user} passed as prop (user already fetched by hub page)
    TournamentHubLeaderboardPeek (Server):
      → [branch 0: !isAuthenticated] → DashboardCard [Server] → SocialHubCard(loginHref) [Client]
      → calls getLeaderboardPeekData(tournamentId, locale) only when isAuthenticated
          → getLoggedInUser
          → findProdeGroupsByOwner(userId) + findProdeGroupsByParticipant(userId) + getFavoriteGroupIds(userId)
          → [Phase 1 — survey] getGroupRankingSummaries(groupIds, userId, tournamentId) — 2 DB round-trips for all N groups
              → filters to groups where userIsRanked=true, sorts (favorites first, then rankedCount desc), takes top 3
          → [Phase 2 — full data, top 3 only, concurrent]
              getLatestRankingsForGroup(groupId, tournamentId) ×3
              getLatestTwoGroupRankingSnapshots(userId, groupId, tournamentId) ×3
          → returns LeaderboardPeekResult { groups: GroupPeekData[], userHasGroups, allGroupNames }
      → [branch 1: !userHasGroups] DashboardCard → SocialHubCard [Client]
      → [branch 2: userHasGroups && no ranking data] DashboardCard → PreTournamentGroupsPreview [Client]
      → [branch 3: groups.length > 0] Fragment → LeaderboardPeekCard [Client] ×N (each is own grid cell)
          → LeaderboardCard (compact=true) ×3
          → RankChangeIndicator (header momentum chip)

    Modified flows (Story #316; updated Story #338):
    - TournamentRedirect [Client] always redirects to /${locale}/tournaments/${id} (hub root; Story #338 removed feature flag)
    - TournamentLayout (Server, Flow 25 context) — after getGroupsForUser():
        allGroups = [...userGroups, ...participantGroups]
        → await Promise.all(allGroups.map(g => getGroupRankingForUser(user.id, g.id, tournamentId)))
        → derives groupRanks: Record<string, number> (skips null results)
        → passes groupRanks, favoriteGroupIds, mainGroupId to TournamentSidebar → FriendGroupsList
          FriendGroupsList shows primary group rank in CardHeader subheader text and per-row Chips before group name links
          FriendGroupsList sorts groups: main → favorites (alpha) → others; renders star/crown icons per row
    - getGroupsForUser() now also fetches getFavoriteGroupIds and getMainGroupId in parallel
        → returns favoriteGroupIds: string[] and mainGroupId: string | null alongside existing fields
    - friend-groups/page.tsx also destructures favoriteGroupIds/mainGroupId from getGroupsForUser()
        → passes to TournamentGroupsList for sorting and star/crown rendering on cards
    - GroupSelector [Client] (top nav — Story #338): Hub tab always rendered with DashboardIcon, links to /tournaments/${id}; Matches tab links to /tournaments/${id}/games
    - TournamentBottomNav [Client] Home tab always navigates to /${locale}/tournaments/${id}

34. Stats at a Glance data flow (Story #375)
    TournamentHubPage → (Suspense, when tournamentHasStarted && user) StatsAtAGlanceWidget (Server)
      → getStatsAtAGlanceData(tournamentId, locale)
          → getLoggedInUser
          → getScoreHistoryForUsers([userId], tournamentId) → all tournament_score_history rows for user, ordered by date ASC
          → derives latest snapshot and previous snapshot
          → computes: totalPoints, matchesPoints, qualifiedTeamsPoints, awardsPoints (category breakdowns)
          → computes: momentumPoints, matchesDelta, qualifiedTeamsDelta, awardsDelta (deltas from prev)
          → computes: isYesterday (prev.snapshot_date vs Argentina TZ yesterday YYYYMMDD)
          → computes: snapshotDateLabel (Intl.DateTimeFormat short date of prev snapshot)
          → returns: sparklineData = last 7 total_points values
          → returns StatsAtAGlanceData { hasData, totals, deltas, isYesterday, snapshotDateLabel, sparklineData }
      → [branch: !hasData] renders empty state (InsightsIcon + noData text)
      → [branch: hasData] renders total score h3 + momentum chip + category rows + Sparkline SVG + "See all statistics" → /${locale}/tournaments/${tournamentId}/stats

33. Rank history read path — History tab (Story #335)
    FriendGroupPage / TournamentScopedFriendGroup (Server):
      └── getGroupRankHistory(groupId, tournamentId) [server action]
            └── getGroupRankingSnapshots(groupId, tournamentId) → group_rankings rows ordered by date ASC
                  → groups by userId → returns UserRankHistoryEntry[] | null (null when no snapshots)
      → preStoredRankHistories passed as prop to HistoryTab [Client]
          when non-null → HistoryTab merges with displayNames from historyData.userHistories
                          → passes merged data to RankHistoryChart (replaces computed ranks)
          when null     → HistoryTab falls back to computed ranks from getScoreHistoryForGroup (existing behavior)
```
