# CODE-STRUCTURE.md

Living map of all production source files, their exported functions/components, and call relationships.

**Format guide:** `docs/claude/code-structure.md`
**Last updated:** 2026-03-09

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
cards (`PerformanceOverviewCard`, `PredictionAccuracyCard`, `BoostAnalysisCard`, `StatsTabs`).
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

1. Tournament home page
   TournamentPage (Server)
     └── getTournaments [server action]
           └── findAllActiveTournaments
           └── applyLocalizationBatch
     └── UnifiedGamesPage [renders]
           └── getGamesForDashboard [server action]
                 └── findGamesForDashboard
           └── FlippableGameCard [renders]
                 └── updateOrCreateGameGuesses [server action]
                       └── updateOrCreateGuess

2. Game scoring pipeline
   calculateGameScores [server action]
     ├── findAllGamesWithPublishedResultsAndGameGuesses
     ├── calculateScoreForGame (util)
     ├── updateGameGuessWithBoost
     └── recalculateGameScoresForUsers
           └── (materializes scores → tournament_guesses)

3. Friend group join request flow
   PublicGroupsBrowser [Client]
     └── getPublicGroupsAction [server action]
           └── findPublicGroups
           └── countPublicGroups
   JoinRequestForm [Client]
     └── requestToJoinGroup [server action]
           ├── findPendingJoinRequest (cooldown check)
           ├── createJoinRequest
           └── sendEmail (notify admins)
   JoinRequestManager [Client] (admin)
     └── approveJoinRequestAction [server action]
           ├── approveJoinRequest (adds user to group)
           └── sendEmail (notify requester)

4. Qualified teams prediction
   QualifiedTeamsClientPage [Client]
     └── updateGroupPositionsJsonb [server action]
           ├── upsertGroupPositionsPrediction
           └── updatePlayoffGameGuesses
                 ├── getAllUserGroupPositionsPredictions
                 ├── calculatePlayoffTeamsFromPositions (util)
                 └── updateGameGuessByGameId

5. Group stats / leaderboard
   LeaderboardView [Client]
     └── getUserScoresForTournament [server action]
           ├── getGameGuessStatisticsForUsers (materialized)
           └── findTournamentGuessByUserIdsTournament
   HeadToHeadDialog [Client]
     └── getUserStatsForComparison [server action]
           ├── getGameGuessStatisticsForUsers
           ├── getTournamentGuessStatsForUsers
           └── calculateAccuracyStats (util)
```
