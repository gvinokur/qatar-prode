# Utilities

Part of the CODE-STRUCTURE.md system. See `CODE-STRUCTURE.md` for the full index and call graph.

**Last updated:** 2026-05-05

---

## Files

### app/utils/priority-attention.ts
Pure priority computation for the Tournament Hub attention widget. No I/O — takes `ActionCenterData` and returns the highest-priority actionable item for Tiers 1–4 (urgent, now-available-playoff, deadline, stage transition). Tier 5 engagement rotation is handled client-side by `EngagementRotatorWidget`.

- **PriorityAttentionType**: TypeScript type — `'urgent-games' | 'now-available-playoff' | 'deadline' | 'new-actions-qt' | 'new-actions-awards'`
- **PriorityAttentionState**: TypeScript interface — `{ type: PriorityAttentionType, urgentCount?: number, firstUrgentGameId?: string, completedCount: number, totalCount: number, qtIncomplete?: boolean, qtCompleted?: number, qtTotal?: number, awardsIncomplete?: boolean, awardsCompleted?: number, awardsTotal?: number, availableRoundName?: string, availableRoundFirstGameId?: string }`
- **computePriorityAttention(data: ActionCenterData)**: `PriorityAttentionState | null` — Priority order: `urgent-games` (mode==='urgent' AND at least one game has `calculateDeadline(game_date) - now <= 24h`) → `now-available-playoff` (data.nowAvailablePlayoffRound is set) → `deadline` (tournamentHasStarted && qtAndAwardsOpen && msUntilPredictionLock < 48h && at least one of QT/awards incomplete) → `new-actions-qt` (!tournamentHasStarted && areGroupStageGamesPredicted(data) && qualifiersCompleted===0) → `new-actions-awards` (!tournamentHasStarted && qualifiersCompleted===qualifiersTotal && awardsCompleted===0). Returns null when tournamentFinished or no condition matches. `urgentCount` reflects only the within-24h game count.
  Calls: calculateDeadline, areGroupStageGamesPredicted

### app/utils/playoff-availability.ts
Pure utility for detecting "Now Available" playoff rounds. No I/O — takes availability info and a timestamp, returns qualifying round IDs.

- **PlayoffRoundAvailabilityInfo**: TypeScript interface — `{ roundId: string, roundOrder: number, hasTeamsDefined: boolean, previousStageLastGameDate: Date | null, hasUnpredictedGames: boolean }`
- **computeNowAvailableRoundIds(rounds: PlayoffRoundAvailabilityInfo[], now: number)**: `string[]` — Returns round IDs where `hasUnpredictedGames` is true AND (Trigger A: `hasTeamsDefined`) OR (Trigger B: `previousStageLastGameDate + 3h < now`).
  Calls: *(none — pure function)*

### app/utils/stage-utils.ts
Stage-completion detection helpers for the Priority Attention Widget.

- **areGroupStageGamesPredicted(data: ActionCenterData)**: `boolean` — Returns true when all group-stage games (`game_type='group'`) have been predicted by the user (`groupStageGamesTotal > 0 && groupStageGamesCompleted === groupStageGamesTotal`).
  Calls: *(none — pure function)*

### app/utils/prediction-constants.ts
Shared constants for prediction lock timing — neutral (no `'use server'`) so it can be imported in Server Actions, repositories, and components alike.

- **PREDICTION_LOCK_OFFSET_MS**: `number` — Milliseconds after tournament start before QT/awards predictions lock (`2 * 24 * 60 * 60 * 1000` = 2 days).
- **EDIT_NEXT_TOKEN**: `"next"` — Special `?edit` URL param value meaning "resolve to first upcoming game at page load time". Used by hub widget CTAs to avoid coupling server render to specific game IDs.

### app/utils/urgency-utils.ts
Shared urgency derivation for the active games carousel and status widgets (Qualified Teams, Awards).

- **UrgencyLevel**: TypeScript type — `'critical' | 'high' | 'medium' | 'safe' | 'empty'`
- **StatusWidgetSeverity**: TypeScript type — `'normal' | 'info' | 'warning' | 'error'`
- **computeUrgencyLevel(data: { mode: string; games: Array<{ game_date: Date }> })**: `UrgencyLevel` — Maps carousel mode + nearest game deadline to a display urgency. `mode !== 'urgent'` → `'safe'` (fallback) or `'empty'`. `mode === 'urgent'`: finds minimum deadline across games → `< 2h → 'critical'`, `< 24h → 'high'`, `≤ 48h → 'medium'`, otherwise `'safe'`.
  Calls: calculateDeadline
- **computeStatusWidgetSeverity(msUntilLock: number)**: `StatusWidgetSeverity` — Derives deadline severity from ms remaining until prediction lock. `< 2h → 'error'`, `< 24h → 'warning'`, `< 48h → 'info'`, otherwise `'normal'`.
  Calls: *(none — pure function)*

### app/utils/guess-utils.ts
Pure utility functions for evaluating game guess completeness — shared between `GamesActiveClient` (client-side delta tracking) and `getActionCenterGames` (server-side urgent-game filtering).

- **isGuessComplete(guess: GameGuessNew | undefined, isPlayoff: boolean)**: `boolean` — Returns `true` when both scores are non-null/non-undefined AND, for playoff games with equal scores, at least one penalty winner flag is set.
  Calls: *(none — pure function)*
- **countCompleteGuesses(guessMap: Record<string, GameGuessNew>, games: ExtendedGameData[])**: `number` — Counts games whose guess in `guessMap` satisfies `isGuessComplete`. Derives `isPlayoff` from `game.playoffStage`.
  Calls: isGuessComplete

### app/utils/tournament-utils.ts
Pure helpers for tournament data transformation that can be shared across Server Components and Server Actions.

- **extractScoringConfig(tournament: any)**: `ScoringConfig | undefined` — Returns a `ScoringConfig` from a tournament record, applying defaults (`??`) for any null fields. Returns `undefined` when `tournament` is null or undefined. Default values match `DEFAULT_SCORING`: exact=3, goal_diff=2, outcome=1, champion=5, runner_up=3, third=1, awards=3, qt=1, exact_qt=2, silver=0, golden=0.
  Calls: *(none — pure function)*

### app/utils/scoring-config.ts
Shared scoring configuration types and defaults — kept in a neutral (non-client, non-server) file so it can be imported from Server Components/Actions and Client Components alike.

- **ScoringConfig**: TypeScript interface — `{ game_exact_score_points, game_correct_outcome_points, game_correct_goal_difference_points, champion_points, runner_up_points, third_place_points, individual_award_points, qualified_team_points, exact_position_qualified_points, max_silver_games, max_golden_games }` (all `number`). Re-exported from `rules.tsx` for backward compatibility.
- **DEFAULT_SCORING**: `ScoringConfig` — Default scoring values: correct_outcome=1, goal_difference=2, exact=3; 5/3/1 podium, 3 awards, 1+2 QT, no boosts. Used as fallback when a tournament has no scoring config.

### app/utils/scoring-rules-utils.ts
Pure utility that organises scoring rule labels into the three prediction tracks (Matches, Qualified Teams, Awards) using the same i18n keys and pluralisation logic as `rules.tsx`.

- **getRulesBySection(config: ScoringConfig, tRules: (key: string, params?: Record<string, unknown>) => string)**: `ScoringRulesBySection` — Maps `ScoringConfig` values to the three prediction track sections. `matches` = winnerDraw + exactScore + optional boost entries (silverBoost, goldenBoost — NOT boostTiming). `qualifiedTeams` = qualifiedTeam + exactPosition. `awards` = champion + runnerUp + thirdPlace + individualAwards. When boosts enabled, sets `matchesBoostDeadline` = boostTiming string (moved out of scoring array so hub widget can render it in the deadline box). Accepts translator bound to `rules.rules` namespace so it works in both server (`getTranslations`) and client (`useTranslations`) contexts.
  Calls: *(none — pure function)*
- **getConstraintsBySection(tConstraints: (key: string, params?: Record<string, unknown>) => string, lockDate: string | null)**: `ConstraintsBySection` — Returns per-section prediction deadline constraint strings sourced from `rules.constraints` namespace. `matches` = `matchPredictionTime`. `qualifiedTeams` = `qualifiedTeamsPredictionTime({date})`. `awards` = `podiumPredictionTime({date})`. When `lockDate` is null, falls back to `tConstraints('lockDateFallback')` as the date value.
  Calls: *(none — pure function)*
- **ScoringRulesBySection**: TypeScript interface — `{ matches: string[], qualifiedTeams: string[], awards: string[], matchesBoostDeadline?: string }`. The `matchesBoostDeadline` field is set only when boosts are enabled; hub widget renders it in the deadline box.
- **ConstraintsBySection**: TypeScript interface — `{ matches: string, qualifiedTeams: string, awards: string }`.

### app/utils/json-ld-utils.ts
Pure builder functions for schema.org JSON-LD structured data objects.

- **buildSportsEventJsonLd(name: string, url: string, startDate: Date, locations?: string[])**: `object` — Returns a schema.org SportsEvent JSON-LD object with `@context`, `@type`, `name`, `startDate` (ISO string), `url`, and optionally `location` (array of `Place` objects) when `locations` is a non-empty string array.
  Calls: none
- **buildBreadcrumbListJsonLd(items: BreadcrumbItem[])**: `object` — Returns a schema.org BreadcrumbList JSON-LD object. Each `BreadcrumbItem` (`{ name, url }`) maps to a `ListItem` with 1-indexed `position`, `name`, and `item` (url).
  Calls: none

### app/utils/metadata-utils.ts
Next.js page metadata builder shared by all `generateMetadata` functions.

- **findTournamentByIdCached**: `(id: string) => Promise<Tournament | undefined>` — `React.cache()`-wrapped version of `findTournamentById`. Deduplicates DB calls within the same React render request. Used by `buildTournamentMetadata` internally and exported for sub-pages rendering JSON-LD breadcrumbs.
  Calls: findTournamentById
- **buildPageMetadata(title: string, description: string)**: `Metadata` — Builds a standard Next.js Metadata object with title, description, OpenGraph (type: website, static 512×512 image), and Twitter card (summary) fields.
  Calls: none
- **buildTournamentMetadata(id: string, appName: string, buildTitle: (t: TournamentShape) => string, buildDescription: (t: TournamentShape) => string)**: `Promise<Metadata>` — Fetches a tournament by ID and invokes the provided title/description builder callbacks; returns a fallback `{ title: appName }` on not-found or DB error. Now calls `findTournamentByIdCached` (instead of `findTournamentById`) to share cache with page components.
  Calls: findTournamentByIdCached, buildPageMetadata

### app/utils/environment-utils.ts
Environment configuration utilities.

- **isDevelopmentMode()**: `boolean` — Checks if the application is running in development mode by inspecting NODE_ENV.
  Calls: none

### app/utils/notifications-utils.ts
Web push notification subscription and management utilities for PWA.

- **urlBase64ToUint8Array(base64String)**: `Uint8Array` — Converts a base64-encoded string to a Uint8Array for use with the Push API.
  Calls: none
- **isNotificationSupported()**: `boolean` — Checks if the browser supports the Notification API, ServiceWorker, and PushManager.
- **checkExistingSubscription()**: `Promise<boolean>` — Checks if the user is already subscribed to push notifications.
- **subscribeToNotifications()**: `Promise<void>` — Requests notification permission and subscribes the user to push notifications.
  Calls: subscribeUser
- **unsubscribeFromNotifications()**: `Promise<void>` — Unsubscribes the user from push notifications.
  Calls: unsubscribeUser

### app/utils/theme-utils.ts
Theme and logo utilities for tournaments and groups.

- **getThemeLogoUrl(theme)**: `string | null` — Returns the appropriate logo URL from theme configuration, preferring S3-hosted logos with fallback to direct URL.

### app/utils/ObjectUtils.ts
Generic object mapping and transformation utilities.

- **toMap<K>(objectList)**: `{[key:string]: K}` — Converts an array of identifiable objects to a map keyed by their IDs.
- **customToMap<K, T>(objectList, keyExtractor)**: `{[key: string]: K}` — Converts an array to a map using a custom key extraction function.

### app/utils/score-utils.tsx
Game outcome determination utilities for winner and loser identification.

- **getGameWinner(game)**: `string | undefined` — Determines the winner of a completed game based on scores and penalties.
  Calls: getWinner
- **getGameLoser(game)**: `string | undefined` — Determines the loser of a completed game based on scores and penalties.
  Calls: getLoser
- **getGuessWinner(guess, homeTeam, awayTeam)**: `string | undefined` — Determines the winner based on a game guess prediction.
  Calls: getWinner
- **getGuessLoser(guess, homeTeam, awayTeam)**: `string | undefined` — Determines the loser based on a game guess prediction.
  Calls: getLoser
- **getWinner(homeScore, awayScore, homePenaltyWinner, awayPenaltyWinner, homeTeam, awayTeam)**: `string | undefined` — Core logic to determine the winner considering scores and penalty results.

### app/utils/group-standings-calculator.ts
Pure utility for computing simulated group standings from user's predicted game scores. No DB dependency.

- **computeGroupStandingsFromGuesses(groupGames: GroupGame[], guessMap: Record<string, { home_score: number | null; away_score: number | null }>)**: `TeamStanding[]` — Distributes points (3/1/0), accumulates goals for/against per team. Returns sorted standings (points DESC → goal difference DESC → goals scored DESC → teamId alphabetical). Skips games where home_score or away_score is null.

### app/utils/game-score-calculator.ts
Game prediction scoring calculation with three tiers: exact score (3pt), goal difference (2pt), correct outcome (1pt).

- **PredictionTier**: `'exact' | 'goal_difference' | 'correct' | 'missed'` — exported type for prediction result category.
- **ScoreResult**: `{ score: number; tier: PredictionTier }` — return type of calculateScoreForGame.
- **calculateScoreForGame(game, gameGuess, scoringConfig)**: `ScoreResult` — Calculates points and tier for a game prediction. Checks exact → goal_difference → correct → playoff penalty scenarios in order. Default scoringConfig: exact=3, goal_diff=2, outcome=1.
  Calls: checkExactMatch, checkGoalDifferenceMatch, checkCorrectOutcome, checkPlayoffPenaltyScenarios, hasValidScores, getPenaltyWinners
- **checkGoalDifferenceMatch(gameHomeScore, gameAwayScore, gameGuess, homePenaltyWin, awayPenaltyWin, goalDifferencePoints)**: `ScoreResult | null` — Returns goal_difference tier when `(gameHomeScore - gameAwayScore) === (guessHome - guessAway)`. Returns null when margin doesn't match; returns score=0/tier=missed when margin matches but penalty winner wrong.

### app/utils/group-position-calculator.ts
Group stage team ranking calculator implementing FIFA tiebreaker rules and two-team head-to-head logic.

- **calculateGroupPosition(teamIds, games, sortByGamesBetweenTeams)**: `TeamStats[]` — Calculates final group standings applying FIFA tiebreaker rules (points, goal difference, goals for, conduct score) with support for two-way and three-way ties.
  Calls: getWinner, genericTeamStatsComparator
- **genericTeamStatsComparator(a, b)**: `number` — Comparator function for sorting teams by complete FIFA stats hierarchy (higher score ranks better).
- **pointsBasesTeamStatsComparator(a, b)**: `number` — Simple comparator sorting teams by points only (used in first pass for games-between-teams mode).

### app/utils/team-stats-utils.ts
Team statistics validation utility.

- **groupCompleteReducer(teamPositions)**: `boolean` — Checks if all teams in a group have completed their games (all is_complete flags true).

### app/utils/playoff-utils.ts
Playoff game team determination based on group stage predictions.

- **calculateTeamNamesForPlayoffGame(isPlayoffGame, game, gameGuesses, gamesMap)**: `{homeTeam?: string, awayTeam?: string}` — Calculates which teams will play in a playoff game based on group results or predictions.
  Calls: getGuessWinner, getGuessLoser

### app/utils/point-calculator.ts
Point calculation with boost multiplier application for game predictions.

- **calculateFinalPoints(baseScore, boostType)**: `PointCalculation` — Calculates final points from base score (0/1/2) and boost type (silver=2x, golden=3x).
- **formatBoostText(boostType)**: `string` — Returns localized boost type display text (Spanish: "Dorado", "Plateado", "Sin Multiplicador").

### app/utils/haptics.ts
Mobile haptic feedback utilities using the Vibration API.

- **triggerRankUpHaptic()**: `void` — Triggers a celebration vibration pattern (50ms-100ms-50ms) for rank improvements.
- **triggerRankChangeHaptic()**: `void` — Triggers a subtle 30ms vibration for rank changes.
- **isHapticSupported()**: `boolean` — Checks if the device supports the Vibration API.

### app/utils/score-history-utils.ts
Pure utility for computing snapshot scores from score history data (Story #277).

- **computeSnapshotScores(userHistories: UserScoreHistory[])**: `Map<string, { latest: number; penultimate: number | undefined }>` — Returns latest and penultimate LOCF snapshot scores per user. `penultimate` is `undefined` when fewer than 2 distinct dates exist. Returns empty Map when input is empty.
  Calls: (none — pure data transformation)

### app/utils/rank-calculator.ts
User ranking and rank change calculation with competition ranking support.

- **calculateRanks<T>(users, scoreField)**: `UserWithRank<T>[]` — Calculates competition ranks for users (1-2-2-4 for ties) based on a numeric score field.
- **calculateRanksWithChange<T>(users, comparisonScoreField)**: `UserWithRankChange<T>[]` — Calculates ranks with snapshot-based rank changes for leaderboard movement tracking. Uses penultimateSnapshotPoints as the comparison field (Story #277).

### app/utils/poisson-generator.ts
Sports score generation using Poisson distribution for realistic predictions.

- **generatePoissonScore(lambda)**: `number` — Generates a random score following Poisson distribution (Knuth's algorithm) with normal approximation for large lambda.
- **generateMatchScore(lambda, isPlayoff)**: `MatchScore` — Generates realistic match scores for both teams with automatic penalty shootout generation for tied playoff games.

### app/utils/qualified-teams-scoring.ts
Qualified teams scoring calculation with progressive scoring as groups complete.

- **calculateQualifiedTeamsScore(userId, tournamentId)**: `Promise<QualifiedTeamsScoringResult>` — Calculates points awarded for qualified team predictions: 1 point for qualifying, +1 bonus for exact position (max 2 per team).
  Calls: findTournamentById, getAllUserGroupPositionsPredictions, findQualifiedTeams

### app/utils/auto-scroll.ts
DOM scrolling utilities for automatic navigation to relevant games.

- **findScrollTarget(games)**: `string | null` — Finds the next upcoming game's element ID or the most recent past game.
- **scrollToGame(gameId, behavior)**: `void` — Scrolls to a game element in the viewport with smooth or instant behavior.

### app/utils/game-filters.ts
Game filtering and badge counting for tournament prediction views.

- **filterGames(games, activeFilter, groupFilter, roundFilter, gameGuesses)**: `ExtendedGameData[]` — Filters games by type (all/groups/playoffs/unpredicted/closingSoon) with secondary group/round filters (sorts by date and game_number).
- **calculateFilterCounts(games, gameGuesses)**: `{total, groups, playoffs, unpredicted, closingSoon}` — Calculates badge counts for each filter type.

### app/utils/penalty-result-formatter.ts
Penalty shootout formatting utilities.

- **formatPenaltyResult(game)**: `string | null` — Formats penalty shootout result as "(4-3p)" or null if no penalties.
- **formatGameScore(game)**: `string` — Formats complete game score including penalties: "2 - 2 (4-3p)" or "2 - 2".

### app/utils/date-utils.ts
Date and time formatting utilities with timezone and locale support.

- **getLocalGameTime(date, gameTimezone, locale)**: `string` — Formats game time in local timezone: "MMM D, YYYY - HH:mm".
- **getUserLocalTime(date, locale)**: `string` — Formats date in user's local timezone: "MMM D, YYYY - HH:mm".
- **getCompactGameTime(date, gameTimezone, locale)**: `string` — Formats game time compactly with timezone: "18 Jan 15:00 GMT-5 (Local Time)".
- **getCompactUserTime(date, locale)**: `string` — Formats date compactly with user timezone label: "18 Jan 14:00 (Your Time)".
- **getTodayYYYYMMDD()**: `number` — Returns today's date as YYYYMMDD integer (e.g., 20260206) in Argentina timezone for daily rank tracking.
- **getPreviousDayYYYYMMDD(date: number)**: `number` — Parses a YYYYMMDD integer in Argentina timezone, subtracts 1 day, and returns the result as a YYYYMMDD integer. Handles all month/year boundaries (e.g., 20260101 → 20251231).

### app/utils/playoffs-rule-helper.ts
Type guards and description helpers for playoff team assignment rules.

- **isGroupFinishRule(object)**: `boolean` — Type guard checking if object is a valid GroupFinishRule (has position and group properties).
- **isTeamWinnerRule(object)**: `boolean` — Type guard checking if object is a valid TeamWinnerRule (has winner and game properties).
- **getTeamDescription(rule, t, shortName)**: `string` — Returns translated description of a team rule: group position or game winner/loser.

### app/utils/team-name-helper.ts
Team name resolution from IDs or rule descriptions.

- **getTeamNames(game, gameGuess, teamsMap, t)**: `{homeTeamId, awayTeamId, homeTeamName, awayTeamName, homeTeamShortName, awayTeamShortName}` — Resolves team names and short names from team IDs or rule descriptions.
  Calls: getTeamDescription

### app/utils/locale-utils.ts
Locale type conversion and validation utilities.

- **toLocale(value)**: `Locale` — Safely converts string to Locale type ('en' | 'es') with fallback to default.
- **isValidLocale(value)**: `boolean` — Type guard to check if string is a valid Locale.

### app/utils/award-utils.ts
Individual tournament awards definition with filtering and translation support.

- **getAwardsDefinition(t)**: `AwardDefinition[]` — Returns awards definitions with translated labels: Best Player, Top Goalscorer, Best Goalkeeper, Best Young Player.

### app/utils/localization-helper.ts
Database localization application for i18n fields in server actions.

- **applyLocalization<T>(data, locale, fields)**: `T` — Applies localization to an object's i18n fields based on locale, keeping original value as fallback.
- **applyLocalizationBatch<T>(dataArray, locale, fields)**: `T[]` — Batch applies localization to array of objects.

### app/utils/countdown-utils.ts
Prediction deadline countdown formatting and urgency calculation.

- **calculateDeadline(gameDate)**: `number` — Calculates prediction deadline (1 hour before game start) as milliseconds.
- **formatCountdown(ms)**: `string` — Formats milliseconds as human-readable countdown: "3h 45m", "45m", "2 días".
- **getUrgencyLevel(ms)**: `UrgencyLevel` — Determines urgency level: safe (>48h), notice (24-48h), warning (1-24h), urgent (<1h), closed (<=0).
- **calculateProgress(gameDate, currentTime)**: `number` — Calculates progress bar percentage (0-100%) for 48h deadline window.
- **getUrgencyColor(theme, urgency)**: `string` — Returns MUI theme color for urgency level.
- **shouldShowProgressBar(ms)**: `boolean` — Checks if progress bar should be shown (true within 48h window).

### app/utils/locale-detection.ts
Accept-Language header parsing and locale matching utilities.

- **parseAcceptLanguage(header)**: `string[]` — Parses Accept-Language header with quality values, returns language codes sorted by preference.
- **matchLocale(acceptedLanguages, supportedLocales)**: `Locale | null` — Matches parsed languages against supported locales, returns first match or null.

### app/utils/game-prediction-helpers.ts
Game prediction validation utility for group and playoff games.

- **isGamePredictionComplete(gameType, homeScore, awayScore, homePenaltyWinner, awayPenaltyWinner)**: `boolean` — Checks if game prediction is complete: both scores required, plus penalty winner for tied playoff games.

### app/utils/email.ts
Email sending utility with Nodemailer Gmail configuration.

- **sendEmail(options)**: `Promise<{success: boolean, messageId: string}>` — Sends email via configured provider (Gmail) with localized sender name.

### app/utils/dismissal-storage.ts
localStorage persistence for dismissible UI overlays and tournament selection.

- **getDismissalState(key)**: `boolean` — Retrieves dismissal state from localStorage (true if dismissed).
- **setDismissalState(key, dismissed)**: `void` — Sets dismissal state in localStorage.
- **getLastSelectedTournamentId()**: `string | null` — Retrieves last selected tournament ID from localStorage.
- **setLastSelectedTournamentId(tournamentId)**: `void` — Saves tournament ID to localStorage and cookie for persistence across sessions.

### app/utils/email-templates.ts
Email template generators for verification, password reset, join request notifications, and group invitations.

- **generateGroupInvitationEmail(params: GroupInvitationEmailParams)**: `Promise<{to: string, subject: string, html: string, locale: Locale}>` — Generates a localized group invitation email with branded header (themeColor background, groupLogoUrl img when provided), personalized greeting using recipientName, sender attribution, invite CTA button, and optional custom message block. Falls back to #1976d2 when themeColor absent; omits logo img when groupLogoUrl absent.
  Calls: getTranslations
- **generateVerificationEmail(email, verificationLink, locale)**: `Promise<{to, subject, html, locale}>` — Generates email verification email with localized content.
- **generatePasswordResetEmail(email, resetLink, locale)**: `Promise<{to, subject, html, locale}>` — Generates password reset email with localized content.
- **generateJoinRequestNotificationEmail(adminEmail, adminName, requesterName, groupName, requestedDate, groupUrl, options)**: `Promise<{to, subject, html}>` — Generates admin notification for group join requests with optional personal message.
- **generateJoinRequestApprovedEmail(userEmail, userName, groupName, groupUrl, locale)**: `Promise<{to, subject, html}>` — Generates approval notification email for user.
- **generateJoinRequestRejectedEmail(userEmail, userName, groupName, locale)**: `Promise<{to, subject, html}>` — Generates rejection notification email for user.

### app/utils/playoff-teams-calculator.ts
Playoff bracket team determination from group predictions with third-place rule handling.

- **calculatePlayoffTeams(tournamentId, firstPlayoffStage, groups, gamesMap, gameResultsMap, gameGuessesMap)**: `Promise<{[gameId]: {gameId, homeTeam?, awayTeam?}}>` — Calculates playoff bracket teams from group results/guesses with third-place rule application.
  Calls: calculateGroupPosition, getThirdPlaceRulesMapForTournament, groupCompleteReducer, genericTeamStatsComparator
- **calculatePlayoffTeamsFromPositions(tournamentId, firstPlayoffStage, gamesMap, positionsByGroup)**: `Promise<{[gameId]: {gameId, homeTeam?, awayTeam?}}>` — Calculates playoff teams from pre-calculated group positions with third-place handling.
  Calls: getThirdPlaceRulesMapForTournament, groupCompleteReducer, genericTeamStatsComparator
- **calculateTeamNamesForPlayoffGame(isPlayoffGame, game, gameGuesses, gamesMap)**: `{homeTeam?, awayTeam?}` — Calculates team names for playoff games based on guesses (duplicate of playoff-utils version).
  Calls: getGuessWinner, getGuessLoser

### app/utils/stats-calculations.ts
Shared statistics calculation utilities for performance and accuracy analysis.

- **calculatePercentage(numerator, denominator, decimalPlaces)**: `number` — Calculates percentage with configurable decimal places.
- **calculateAccuracyStats(userGameStats, totalPredictionsMade, totalGamesAvailable, totalGamesPlayed)**: `AccuracyStats` — Calculates prediction accuracy including correct/goal_difference/exact rates by stage. `goalDifference` is cumulative (uses `total_exact_guesses` from DB = goal_diff + exact combined); `exact` is pure tier (`total_exact_guesses - total_goal_difference_guesses`). Mirrors the same cumulative hierarchy as `correct` (which includes all positive tiers).
- **calculateBoostStats(boostData, maxGames, boostType)**: `BoostStats` — Calculates boost usage statistics including success rate, ROI, and allocation by group.

### app/utils/avatar-utils.ts
User avatar color and initial generation utilities.

- **getAvatarColor(userId)**: `string` — Generates a consistent avatar color based on user ID hash.
- **getUserInitials(name)**: `string` — Extracts user initials from name (first and last letter or first two letters).

### app/utils/badge-calculator.ts
Pure TypeScript badge calculation engine. No framework dependencies.

- **calculateBadges(users: UserBadgeInput[], config: TournamentBadgeConfig)**: `Map<string, Badge[]>` — Computes badges for all users in a group. Returns positive badges first, negative last per user (guaranteed contract for BadgeRow maxDisplay truncation).
- **BADGES**: `Record<BadgeId, Badge>` — Static lookup of all 17 badge definitions (emoji + type). Used for display without re-running apply().
- **BadgeId**: type union of 17 badge string literals (12 static + 5 time-dimension: 'on-fire', 'trending-up', 'comeback-kid', 'ice-cold', 'trending-down').
- **Badge**: `{ id: BadgeId; emoji: string; type: 'positive' | 'negative' }`.
- **TournamentBadgeConfig**: `{ tournamentStarted, championPoints, runnerUpPoints, thirdPlacePoints, individualAwardPoints, totalQualifyingSlots }`. `tournamentStarted: false` skips all badges. 0 values disable corresponding badges.
- **UserBadgeInput**: `{ userId, rank, rankChange, totalExactGuesses, totalCorrectGuesses, qualifiedTeamsCorrect, honorRollScore, individualAwardsScore, boostsUsed, scoredBoosts, rankHistory?: number[] }`. `rankHistory` is chronological rank array (oldest index 0, newest last); when absent or too short, all 5 time-dimension badges suppress silently. Updated emoji: rocket=🚀, free-fall=🪂.

### app/utils/ga4.ts
Google Analytics 4 utility. All functions are no-ops when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is unset or `window.gtag` is not a function, so GA4 only activates in production when the measurement ID is configured.

- **initializeGA4()**: `void` — Calls `gtag('js', new Date())` and `gtag('config', GA_MEASUREMENT_ID, { send_page_view: false })`. No-op when measurement ID unset or `window.gtag` unavailable.
- **trackPageView(url: string, title?: string)**: `void` — Calls `gtag('config', GA_MEASUREMENT_ID, { page_path, page_title })`. No-op guard same as above.
- **trackEvent(eventName: string, eventParams?: Record<string, any>)**: `void` — Calls `gtag('event', eventName, eventParams)`. No-op guard same as above.
- **AnalyticsEventPayload**: `{ name: string; params?: Record<string, any> }` (TypeScript interface — type-only, no runtime value).

### app/utils/share-utils.ts
Image capture and sharing utilities for social media.

- **captureElement(el)**: `Promise<Blob>` — Captures DOM element as PNG image blob using html-to-image.
- **shareImage(blob, text, filename)**: `Promise<void>` — Shares image via native share API or downloads with WhatsApp fallback.
- **downloadBlob(blob, filename)**: `void` — Downloads blob as file using browser download mechanism.
- **openWhatsApp(text)**: `void` — Opens WhatsApp with pre-filled text message.