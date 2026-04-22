# Server Actions

Part of the CODE-STRUCTURE.md system. See `CODE-STRUCTURE.md` for the full index and call graph.

**Last updated:** 2026-04-20

---

## Files

### app/actions/backoffice-actions.ts
Administrative tournament management — full lifecycle operations: tournament creation from seed data, score calculation, group standings, playoff bracket management, and permissions. Restricted to admin users.

- **deleteDBTournamentTree(tournament, locale)**: `Promise<void>` — Deletes entire tournament tree (all games, guesses, groups, teams, results).
  Calls: getLoggedInUser, deleteAllGameGuessesByTournamentId, deleteAllTournamentGuessesByTournamentId, deleteAllTournamentGroupPositionsPredictions, deleteAllPlayersInTournament, deleteAllTournamentVenues, deleteThirdPlaceRulesByTournament, deleteAllGameResultsByTournamentId, deleteAllGamesFromTournament, deleteAllPlayoffRoundsInTournament, deleteAllGroupsFromTournament, deleteTournamentTeams, deleteTournament
- **generateDbTournamentTeamPlayers(tournamentName)**: `Promise<void>` — Populates players from seed data files.
  Calls: findTournamentByName, findTeamInTournament, createPlayer, updatePlayer
- **generateDbTournament(name, deletePrevious)**: `Promise<void>` — Creates a full tournament from seed data.
  Calls: findTournamentByName, deleteDBTournamentTree, createTournament, getTeamByName, createTeam, createTournamentTeam, createTournamentGroup, createTournamentGroupTeam, createPlayoffRound, createGame, createTournamentGroupGame, createPlayoffRoundGame
- **saveGameResults(gamesWithResults)**: `Promise<void>` — Saves game results with special handling when a published result changes.
  Calls: findGameResultByGameId, updateGameResult, createGameResult, calculateGameScores
- **saveGamesData(games)**: `Promise<void>` — Saves game scheduling data (teams, dates).
  Calls: updateGame
- **calculateAndSavePlayoffGamesForTournament(tournamentId)**: `Promise<void>` — Calculates playoff team assignments from group standings.
  Calls: findGroupsWithGamesAndTeamsInTournament, findGamesInTournament, findPlayoffStagesWithGamesInTournament, findGameResultByGameIds, calculatePlayoffTeams, updateGame
- **getGroupDataWithGamesAndTeams(tournamentId)**: `Promise<ExtendedGroupData[]>` — Gets group data structure for admin UI.
  Calls: findGroupsWithGamesAndTeamsInTournament
- **recalculateAllPlayoffFirstRoundGameGuesses(tournamentId)**: `Promise<void>` — Recalculates all users' playoff guesses.
  Calls: updatePlayoffGameGuesses
- **calculateGameScores(forceDrafts, forceAllGuesses, locale)**: `Promise<void>` — Recalculates all game guess scores, then triggers group rank snapshot materialization for all affected users.
  Calls: findAllGamesWithPublishedResultsAndGameGuesses, findAllGuessesForGamesWithResultsInDraft, findTournamentById, calculateScoreForGame, updateGameGuessWithBoost, updateGameGuess, recalculateGameScoresForUsers, recalculateGroupRankingsForUsers
- **calculateAndStoreGroupPosition(groupId, teamIds, groupGames, sortByGamesBetweenTeams)**: `Promise<void>` — Updates group standings.
  Calls: calculateGroupPosition, updateTournamentGroupTeams
- **findDataForAwards(tournamentId)**: `Promise<{ tournament: Tournament; players: ExtendedPlayerData[] }>` — Gets tournament and players for award assignment.
  Calls: findTournamentById, findAllPlayersInTournamentWithTeamData, applyLocalization
- **updateTournamentAwards(tournamentId, withUpdate, locale)**: `Promise<void>` — Updates individual awards, recalculates scores, writes daily score snapshot for each user, then triggers group rank snapshot materialization for all tournament participants.
  Calls: updateTournament, findTournamentById, findTournamentGuessByTournament, updateTournamentGuess, writeScoreSnapshot, recalculateGroupRankingsForUsers
- **updateTournamentHonorRoll(tournamentId, withUpdate, locale)**: `Promise<void>` — Updates honor roll (champion, runner-up, third place), writes daily score snapshot for each user, then triggers group rank snapshot materialization for all tournament participants.
  Calls: updateTournament, findTournamentById, findTournamentGuessByTournament, updateTournamentGuess, writeScoreSnapshot, recalculateGroupRankingsForUsers
- **copyTournament(tournamentId, newStartDate, longName, shortName, locale)**: `Promise<Tournament>` — Creates a complete tournament copy with all structure.
  Calls: getLoggedInUser, findTournamentById, createTournament, findTeamInTournament, createTournamentTeam, findAllPlayersInTournamentWithTeamData, createPlayer, findAllTournamentVenues, createTournamentVenue, findPlayoffStagesWithGamesInTournament, createPlayoffRound, findGroupsWithGamesAndTeamsInTournament, createTournamentGroup, createTournamentGroupTeam, findGamesInTournament, createGame, createTournamentGroupGame, createPlayoffRoundGame, findThirdPlaceRulesByTournament, createThirdPlaceRule, applyLocalization
- **updateGroupTeamConductScores(groupId, conductScores, locale)**: `Promise<void>` — Updates conduct scores (admin only).
  Calls: getLoggedInUser, updateTeamConductScores
- **getTournamentPermissionData(tournamentId)**: `Promise<{ allUsers: User[]; permittedUserIds: string[] }>` — Gets all users and permitted users for dev tournament.
  Calls: findAllUsers, findUserIdsForTournament
- **updateTournamentPermissions(tournamentId, userIds)**: `Promise<void>` — Updates tournament view permissions.
  Calls: removeAllTournamentPermissions, addUsersToTournament, revalidatePath

### app/actions/game-actions.ts
CRUD operations for games. Manages game creation, updates, and deletion within group and playoff contexts.

- **createGroupGame(gameData, groupId, locale)**: `Promise<Game>` — Creates game in group context.
  Calls: getLoggedInUser, createGame, createTournamentGroupGame
- **updateGroupGame(gameId, gameData, locale)**: `Promise<Game>` — Updates an existing group game.
  Calls: getLoggedInUser, updateGame
- **deleteGroupGame(gameId, locale)**: `Promise<void>` — Deletes group game and association.
  Calls: getLoggedInUser, deleteTournamentGroupGame, deleteGame
- **createOrUpdateGame(gameData, groupId, playoffRoundId)**: `Promise<Game>` — Creates or updates game with association (handles both group and playoff).
  Calls: updateGame, createGame, deleteTournamentGroupGame, deletePlayoffRoundGame, createTournamentGroupGame, createPlayoffRoundGame
- **getGamesInTournament(tournamentId)**: `Promise<Game[]>` — Gets all games with localization applied.
  Calls: findGamesInTournament, applyLocalizationBatch

### app/actions/game-boost-actions.ts
Manages boost allocations (silver/golden) for tournament game predictions.

- **setGameBoostAction(gameId, boostType, locale)**: `Promise<GameGuess>` — Sets silver/golden boost on a game prediction.
  Calls: auth, findGameById, findTournamentById, getGameGuessWithBoost, countUserBoostsByType, setGameGuessBoost
- **getBoostAllocationBreakdownAction(tournamentId, boostType, locale)**: `Promise<BoostBreakdown>` — Gets breakdown of boost usage across groups and playoffs.
  Calls: auth, getBoostAllocationBreakdown

### app/actions/game-notification-actions.ts
Sends game-related push notifications and emails to users.

- **sendGamesTomorrowNotification(tournamentId)**: `Promise<{ success: true; message: string }>` — Notifies all users about games tomorrow.
  Calls: findGamesInNext24Hours, sendNotification
- **notifyGameFinished(game)**: `Promise<{ success: boolean }>` — Notifies all users when a match finishes with score and result.
  Calls: sendNotification, getWinner

### app/actions/game-score-generator-actions.ts
Auto-fills and clears game scores for bulk admin operations.

- **autoFillGameScores(groupId, playoffRoundId, locale)**: `Promise<AutoFillResult>` — Generates realistic scores for games without results.
  Calls: findGamesInGroup, findGamesInTournament, generateMatchScore, updateGameResult, createGameResult, calculateAndStoreGroupPosition, calculateAndSavePlayoffGamesForTournament, calculateGameScores, calculateAndStoreQualifiedTeamsScores
- **clearGameScores(groupId, playoffRoundId, locale)**: `Promise<ClearResult>` — Clears all game scores and triggers recalculation.
  Calls: findGamesInGroup, findGamesInTournament, updateGameResult, calculateAndStoreGroupPosition, calculateAndSavePlayoffGamesForTournament, calculateGameScores, calculateAndStoreQualifiedTeamsScores

### app/actions/group-tournament-betting-actions.ts
Manages tournament betting configuration and payment tracking for friend groups.

- **getGroupTournamentBettingConfigAction(groupId, tournamentId)**: `Promise<ProdeGroupTournamentBetting | undefined>` — Gets betting config for group/tournament.
  Calls: getGroupTournamentBettingConfig
- **setGroupTournamentBettingConfigAction(groupId, tournamentId, config, locale)**: `Promise<ProdeGroupTournamentBetting>` — Sets betting config (owner/admin only).
  Calls: getLoggedInUser, findProdeGroupById, findParticipantsInGroup, getGroupTournamentBettingConfig, updateGroupTournamentBettingConfig, createGroupTournamentBettingConfig
- **getGroupTournamentBettingPaymentsAction(groupTournamentBettingId)**: `Promise<ProdeGroupTournamentBettingPayment[]>` — Gets all payment statuses.
  Calls: getGroupTournamentBettingPayments
- **setUserGroupTournamentBettingPaymentAction(groupTournamentBettingId, userId, hasPaid, groupId, locale)**: `Promise<ProdeGroupTournamentBettingPayment>` — Sets user payment status (admin only).
  Calls: getLoggedInUser, findProdeGroupById, findParticipantsInGroup, setUserGroupTournamentBettingPayment
- **getUserGroupTournamentBettingPaymentAction(groupTournamentBettingId, userId)**: `Promise<ProdeGroupTournamentBettingPayment | undefined>` — Gets a user's payment status.
  Calls: getUserGroupTournamentBettingPayment

### app/actions/guesses-actions.ts
Manages game and tournament predictions (guesses).

- **updateOrCreateGameGuesses(gameGuesses, locale)**: `Promise<{ success: boolean; error?: string; analyticsEvent?: AnalyticsEventPayload }>` — Saves game predictions (upsert). Returns analytics event payload on success.
  Calls: getLoggedInUser, updateOrCreateGuess, trackEvent
- **updateOrCreateTournamentGuess(guess, locale)**: `Promise<TournamentGuess>` — Saves tournament-level prediction.
  Calls: dbUpdateOrCreateTournamentGuess
- **updatePlayoffGameGuesses(tournamentId, user)**: `Promise<void>` — Recalculates and updates playoff guesses from position predictions.
  Calls: findPlayoffStagesWithGamesInTournament, findGamesInTournament, findGroupsInTournament, getAllUserGroupPositionsPredictions, calculatePlayoffTeamsFromPositions, updateGameGuessByGameId

### app/actions/notification-actions.ts
Manages user push notification subscriptions and delivery.

- **subscribeUser(sub)**: `Promise<{ success: true }>` — Subscribes user to push notifications.
  Calls: addNotificationSubscription
- **unsubscribeUser(sub)**: `Promise<{ success: true }>` — Unsubscribes user from push notifications.
  Calls: removeNotificationSubscription
- **sendNotification(title, message, url, userIds, sendToAllUsers)**: `Promise<{ success: boolean; sentCount: number; errorCount: number }>` — Sends push notifications to target users.
  Calls: findUsersWithNotificationSubscriptions, findUserById, findUsersByIds, sendPushNotification, removeNotificationSubscription
- **sendGroupNotification({ groupId, tournamentId, targetPage, title, message, senderId })**: `Promise<void>` — Sends notification to all group participants except sender.
  Calls: findParticipantsInGroup, findProdeGroupById, sendNotification

### app/actions/oauth-actions.ts
OAuth authentication flow and post-signup user setup.

- **checkAuthMethods(email, locale)**: `Promise<{ hasPassword: boolean; hasGoogle: boolean; userExists: boolean; success: boolean; error?: string }>` — Checks available auth methods for email (progressive disclosure).
  Calls: getTranslations, getAuthMethodsForEmail
- **setNickname(nickname, locale)**: `Promise<{ success: boolean; error?: string }>` — Sets user nickname after OAuth signup.
  Calls: auth, updateUser, revalidatePath

### app/actions/onboarding-actions.ts
Manages user onboarding flow, checklist state, and tooltip dismissal.

- **getOnboardingData()**: `Promise<OnboardingData | undefined>` — Gets onboarding status for logged-in user.
  Calls: getLoggedInUser, getOnboardingStatus
- **saveOnboardingStep(step, locale)**: `Promise<{ success: boolean; error?: string }>` — Saves current onboarding step.
  Calls: getLoggedInUser, updateOnboardingData
- **markOnboardingComplete(locale)**: `Promise<{ success: boolean; error?: string }>` — Marks onboarding as completed.
  Calls: getLoggedInUser, completeOnboarding, revalidatePath
- **skipOnboardingFlow(locale)**: `Promise<{ success: boolean; error?: string }>` — Skips onboarding entirely.
  Calls: getLoggedInUser, skipOnboarding, revalidatePath
- **dismissTooltip(tooltipId, locale)**: `Promise<{ success: boolean; error?: string }>` — Dismisses a specific tooltip.
  Calls: getLoggedInUser, dismissTooltipRepo
- **updateChecklistItem(itemId, completed, locale)**: `Promise<{ success: boolean; error?: string }>` — Updates onboarding checklist item completion.
  Calls: getLoggedInUser, updateChecklistItemRepo, revalidatePath

### app/actions/otp-actions.ts
OTP (one-time password) based authentication and account creation.

- **sendOTPCode(email, locale)**: `Promise<{ success: boolean; error?: string }>` — Sends OTP to email address.
  Calls: generateOTP, findUserByEmail, generateOTPEmailContent, sendEmail
- **verifyOTPCode(email, code, locale)**: `Promise<{ success: boolean; user?: User; error?: string }>` — Verifies OTP code.
  Calls: verifyOTP
- **createAccountViaOTP(data, locale)**: `Promise<{ success: boolean; error?: string }>` — Creates account after OTP verification.
  Calls: findUserByEmail, findUserByNickname, updateUser, getPasswordHash
- **checkNicknameAvailability(nickname, locale)**: `Promise<{ available: boolean; error?: string }>` — Checks if nickname is taken.
  Calls: findUserByNickname

### app/actions/prode-group-actions.ts
Friend group management — creation, membership, scoring, and theme updates.

- **createDbGroup(groupName)**: `Promise<ProdeGroup>` — Creates a new friend group.
  Calls: getLoggedInUser, createProdeGroup
- **getGroupsForUser()**: `Promise<{ userGroups: ProdeGroup[]; participantGroups: ProdeGroup[]; pendingRequests: { id: string; group_id: string; group_name: string | null }[]; favoriteGroupIds: string[]; mainGroupId: string | null } | undefined>` — Gets user's groups (owned, participating, pending join requests) plus favorite group IDs and main group ID in parallel.
  Calls: getLoggedInUser, findProdeGroupsByOwner, findProdeGroupsByParticipant, findJoinRequestsByUser, getFavoriteGroupIds, getMainGroupId
- **deleteGroup(groupId)**: `Promise<void>` — Deletes group (owner only).
  Calls: getLoggedInUser, findProdeGroupById, deleteAllParticipantsFromGroup, deleteProdeGroup
- **promoteParticipantToAdmin(groupId, userId)**: `Promise<void>` — Promotes participant to admin.
  Calls: getLoggedInUser, findProdeGroupById, updateParticipantAdminStatus
- **demoteParticipantFromAdmin(groupId, userId)**: `Promise<void>` — Demotes admin to participant.
  Calls: getLoggedInUser, findProdeGroupById, updateParticipantAdminStatus
- **updateTheme(groupId, formData)**: `Promise<ProdeGroup>` — Updates group theme and logo.
  Calls: findProdeGroupById, updateProdeGroup, deleteThemeLogoFromS3
- **updateGroupPrivacyAction(groupId, isPublic, description)**: `Promise<{ success: true } | { error: string }>` — Updates group public/private visibility.
  Calls: getLoggedInUser, findProdeGroupById, findParticipantsInGroup, updateGroupPrivacy
- **leaveGroupAction(groupId)**: `Promise<{ success: true }>` — Current user leaves a group.
  Calls: getLoggedInUser, findProdeGroupById, deleteParticipantFromGroup
- **getUsersForGroup(groupId)**: `Promise<string[]>` — Gets all user IDs in a group.
  Calls: findProdeGroupById, findParticipantsInGroup
- **getUserScoresForTournament(userIds, tournamentId)**: `Promise<UserScore[]>` — Calculates tournament scores for a set of users. Return shape includes badge fields (totalExactGuesses, totalCorrectGuesses, qualifiedTeamsCorrect, boostsUsed, scoredBoosts). Does not include yesterdayTotalPoints (removed in Story #277); snapshot fields (latestSnapshotPoints, penultimateSnapshotPoints) are patched on by pages after calling computeSnapshotScores.
  Calls: getGameGuessStatisticsForUsers, findTournamentGuessByUserIdsTournament, getBoostStatsForUsersInTournament
- **calculateTournamentGroupStats(groupId, tournamentId, userId)**: `Promise<TournamentGroupStats>` — Gets aggregated group stats for a tournament.
  Calls: findProdeGroupById, findParticipantsInGroup, getUserScoresForTournament, getGroupTournamentBettingConfig, findUsersByIds
- **sendGroupEmailInvitations(groupId, recipients, customMessage, locale, groupLogoUrl?, themeColor?)**: `Promise<{sent: number; failed: string[]}>` — Sends localized group invitation emails to up to 50 recipients. Validates user is owner or admin, deduplicates by email, sends in parallel via Promise.allSettled, returns counts of sent/failed.
  Calls: getLoggedInUser, findProdeGroupById, findParticipantsInGroup, generateShortUrlForGroup, buildShortUrl, generateGroupInvitationEmail, sendEmail

### app/actions/favorite-group-actions.ts
Server Actions for managing user-level favorite and main-group designation (Story #332).

- **toggleFavoriteGroupAction(groupId: string)**: `Promise<{ isFavorite: boolean }>` — Adds or removes the group from the authenticated user's favorites. Returns the new state.
  Calls: getLoggedInUser, getFavoriteGroupIds, addFavoriteGroup | removeFavoriteGroup, revalidatePath
- **setMainGroupAction(groupId: string)**: `Promise<void>` — Designates the group as the user's main group. Group must already be a favorite; throws otherwise.
  Calls: getLoggedInUser, getFavoriteGroupIds, setMainGroup, revalidatePath
- **clearMainGroupAction()**: `Promise<void>` — Clears the user's main group designation.
  Calls: getLoggedInUser, clearMainGroup, revalidatePath

### app/actions/prode-group-discovery-actions.ts
Public group discovery and search for group browsing.

- **getPublicGroupsAction(searchTerm, page, tournamentId)**: `Promise<GetPublicGroupsResult | { error: string }>` — Gets paginated public groups matching search criteria.
  Calls: findPublicGroups, countPublicGroups

### app/actions/prode-group-join-request-actions.ts
Manages join requests for friend groups — requesting, approving, rejecting, and cancelling.

- **requestToJoinGroup(groupId, source, locale, tournamentId, message)**: `Promise<{ success: true; message: string }>` — Sends a join request to a group.
  Calls: getLoggedInUser, findProdeGroupById, findParticipantsInGroup, findPendingJoinRequest, findRecentRejectedRequest, createJoinRequest, findUsersByIds, generateJoinRequestNotificationEmail, sendEmail
- **getUserJoinRequests()**: `Promise<JoinRequest[]>` — Gets current user's join requests.
  Calls: getLoggedInUser, findJoinRequestsByUser
- **getGroupJoinRequests(groupId)**: `Promise<JoinRequest[]>` — Gets pending requests for a group (admin only).
  Calls: getLoggedInUser, findProdeGroupById, findParticipantsInGroup, findJoinRequestsByGroup
- **approveJoinRequestAction(requestId, groupId, tournamentId)**: `Promise<{ success: true; message: string; analyticsEvent?: AnalyticsEventPayload }>` — Approves a join request (admin). Returns analytics event payload on success.
  Calls: getLoggedInUser, findProdeGroupById, findParticipantsInGroup, approveJoinRequestRepo, findUsersByIds, generateJoinRequestApprovedEmail, sendEmail, revalidatePath, trackEvent
- **rejectJoinRequestAction(requestId, groupId)**: `Promise<{ success: true; message: string }>` — Rejects a join request (admin).
  Calls: getLoggedInUser, findProdeGroupById, findParticipantsInGroup, rejectJoinRequestRepo, findUsersByIds, generateJoinRequestRejectedEmail, sendEmail, revalidatePath
- **cancelJoinRequestAction(requestId)**: `Promise<{ success: true; message: string }>` — Cancels own pending join request.
  Calls: getLoggedInUser, cancelJoinRequestRepo
- **getPendingRequestCount(groupId)**: `Promise<number>` — Gets pending request count for notification badge (admin).
  Calls: getLoggedInUser, findProdeGroupById, findParticipantsInGroup, countPendingRequestsRepo

### app/actions/qualification-actions.ts
Manages qualified team position predictions for group stages.

- **getTournamentQualificationConfig(tournamentId, locale)**: `Promise<{ allowsThirdPlace: boolean; maxThirdPlace: number; isLocked: boolean }>` — Gets tournament qualification settings and lock status.
  Calls: getTournamentStartDate
- **updateGroupPositionsJsonb(groupId, tournamentId, positionUpdates, locale)**: `Promise<{ success: boolean; message: string }>` — Updates all team positions for a group including qualification flags.
  Calls: getLoggedInUser, validateTeamsInGroup, validateNoDuplicateTeams, validatePositionsValidAndUnique, validateQualificationFlagsForPositions, validateThirdPlaceForGroup, upsertGroupPositionsPrediction, updatePlayoffGameGuesses

### app/actions/qualified-teams-scoring-actions.ts
Calculates and stores scores for qualified team predictions.

- **calculateAndStoreQualifiedTeamsScores(tournamentId, locale)**: `Promise<BatchScoringResult>` — Calculates and persists scores for all tournament users. Uses upsert (INSERT...ON CONFLICT) with RETURNING * to get full row, writes a score snapshot per user, then triggers group rank snapshot materialization for all affected users.
  Calls: findTournamentById, calculateQualifiedTeamsScore, db.insertInto (upsert), writeScoreSnapshot, getTodayYYYYMMDD, recalculateGroupRankingsForUsers, revalidatePath
- **calculateUserQualifiedTeamsScore(userId, tournamentId, locale)**: `Promise<SingleUserScoringResult>` — Calculates score for a single user.
  Calls: calculateQualifiedTeamsScore
- **triggerQualifiedTeamsScoringAction(tournamentId, locale)**: `Promise<BatchScoringResult>` — Admin trigger for qualification scoring.
  Calls: getLoggedInUser, calculateAndStoreQualifiedTeamsScores

### app/actions/s3.ts
Manages S3 file uploads and logo handling.

- **createS3Client(dirName)**: `S3Client` — Initializes S3 client for a specific directory.
- **deleteThemeLogoFromS3(theme)**: `Promise<void>` — Deletes logo file from S3 bucket.
  Calls: getS3KeyFromURL, deleteFile
- **getS3KeyFromURL(url)**: `string | null` — Extracts S3 key from full URL or path.

### app/actions/short-url-actions.ts
Generates and manages short invite URLs for groups.

- **generateShortUrlForGroup(groupId, tournamentId)**: `Promise<ShortUrl>` — Creates or gets short URL for a group.
  Calls: getOrCreateShortUrl
- **buildShortUrl(code)**: `Promise<string>` — Builds full short URL from code.

### app/actions/stats-actions.ts
Calculates comparison statistics for head-to-head user comparisons.

- **getUserStatsForComparison(userIds, tournamentId)**: `Promise<UserComparisonStats[]>` — Gets performance and accuracy stats for 2 users.
  Calls: getGameGuessStatisticsForUsers, getTournamentGuessStatsForUsers, getGameCountsForTournament, calculateAccuracyStats

### app/actions/third-place-rules-actions.ts
Manages third-place playoff bracket rules (admin only).

- **getThirdPlaceRulesForTournament(tournamentId, locale)**: `Promise<TournamentThirdPlaceRules[]>` — Gets rules for a tournament.
  Calls: findThirdPlaceRulesByTournament
- **upsertThirdPlaceRuleAction(tournamentId, combinationKey, rules, locale)**: `Promise<TournamentThirdPlaceRules>` — Creates or updates a third-place rule.
  Calls: upsertThirdPlaceRule
- **deleteThirdPlaceRuleAction(ruleId, locale)**: `Promise<void>` — Deletes a rule.
  Calls: deleteThirdPlaceRule

### app/actions/team-actions.ts
Team and player management for backoffice — creates/updates teams, imports player rosters from Transfermarkt, and manages player assignments.

- **createTeam(formData: FormData, tournamentId: string)**: `Promise<Team>` — Creates a new team with optional logo upload (admin only).
  Calls: getLoggedInUser, createTeaminDb, handleLogoUpload
- **updateTeam(teamId: string, formData: FormData)**: `Promise<Team>` — Updates team fields and logo (admin only).
  Calls: getLoggedInUser, updateTeaminDb, handleLogoUpload
- **getPlayersInTournament(tournamentId: string)**: `Promise<{team: Team, players: Player[]}[]>` — Returns all teams in a tournament with their player rosters.
  Calls: findTeamInTournament, findPlayersByTeamId
- **getTransfermarktPlayerData(transfermarktTeamName: string, transfermarktTeamId: string, tournamentId: string, urlTemplate?: string | null)**: `Promise<PlayerData[]>` — Scrapes player data from Transfermarkt. Uses urlTemplate (with `{teamName}` and `{teamId}` placeholders) when provided and valid; falls back to hardcoded club URL (admin only).
  Calls: getLoggedInUser, getTournamentStartDate
- **deleteAllTeamPlayersInTournament(tournamentId: string, teamId: string)**: `Promise<void>` — Deletes all players for a team in a tournament (admin only).
  Calls: getLoggedInUser, findPlayersByTeamId, deletePlayer
- **createTournamentTeamPlayers(players: PlayerNew[])**: `Promise<Player[]>` — Bulk-creates player records (admin only).
  Calls: getLoggedInUser, createPlayer
- **deleteTournamentTeamPlayers(players: Player[])**: `Promise<void>` — Bulk-deletes player records (admin only).
  Calls: getLoggedInUser, deletePlayer
- **moveTournamentTeamPlayer(player: Player, newTeamId: string)**: `Promise<Player>` — Moves a player to a different team (admin only).
  Calls: getLoggedInUser, updatePlayer
- **saveTeamTransfermarktId(teamId: string, transfermarktId: string)**: `Promise<void>` — Persists a team's Transfermarkt ID after a successful import for pre-filling on re-import (admin only).
  Calls: getLoggedInUser, updateTeaminDb

### app/actions/tournament-actions.ts
Tournament CRUD and data retrieval — the primary data access layer for tournament-related pages.

- **getAllTournaments()**: `Promise<Tournament[]>` — Gets all tournaments including dev/inactive.
  Calls: findAllTournaments, applyLocalizationBatch
- **getTournaments()**: `Promise<Tournament[]>` — Gets active tournaments for current user (filtered by permissions).
  Calls: getLoggedInUser, findAllActiveTournaments, applyLocalizationBatch
- **getPastTournaments(limit)**: `Promise<Tournament[]>` — Gets recently completed tournaments.
  Calls: findPastTournaments, applyLocalizationBatch
- **getGamesForDashboard(tournamentId)**: `Promise<ExtendedGameData[]>` — Gets games for dashboard (last 24h results + next 48h upcoming).
  Calls: findGamesForDashboard
- **getTeamsMap(objectId, teamParent)**: `Promise<{ [teamId: string]: Team }>` — Gets localized teams for tournament or group as a map.
  Calls: findTeamInTournament, findTeamInGroup, applyLocalizationBatch, toMap
- **getCompleteGroupData(groupId, includeDraftResults)**: `Promise<CompleteGroupData>` — Gets group with games, teams, and standings.
  Calls: findTournamentgroupById, findGroupsInTournament, getTeamsMap, findGamesInGroup, findTeamsInGroup, applyLocalizationBatch, toMap
- **getCompletePlayoffData(tournamentId, includeDraftResults)**: `Promise<CompletePlayoffData>` — Gets playoff stages with games and team assignments.
  Calls: findPlayoffStagesWithGamesInTournament, getTeamsMap, findGamesInTournament, applyLocalizationBatch, toMap
- **getTournamentAndGroupsData(tournamentId)**: `Promise<{ tournament: Tournament; groups: TournamentGroup[] }>` — Gets tournament and all groups.
  Calls: findTournamentById, findGroupsInTournament, applyLocalization
- **getTournamentStartDate(tournamentId)**: `Promise<Date>` — Gets tournament's first game date.
  Calls: findFirstGameInTournament
- **deactivateTournament(tournamentId, locale)**: `Promise<Tournament>` — Deactivates tournament (admin).
  Calls: getLoggedInUser, findTournamentById, updateTournament, applyLocalization
- **createOrUpdateTournament(tournamentId, tournamentFormData, locale)**: `Promise<Tournament>` — Creates or updates tournament with optional logo upload. Persists `transfermarkt_url_template` and `locations` when included in the JSON payload.
  Calls: validateAdminUser, parseFormData, getExistingTournament, handleLogoUpload, prepareTournamentData, saveOrUpdateTournament, cleanupOldLogo, handleLocationsUpdate, applyLocalization
- **getTournamentLocations(tournamentId)**: `Promise<TournamentLocation[]>` — Fetches all stored locations for a given tournament as `TournamentLocation` objects.
  Calls: tournamentLocationRepository.findByTournamentId
- **createTournamentLocation(tournamentId, name)**: `Promise<TournamentLocation>` — Creates a new location entry for a tournament. Admin only.
  Calls: validateAdminUser, tournamentLocationRepository.create
- **updateTournamentLocation(locationId, name)**: `Promise<TournamentLocation>` — Updates the name of an existing tournament location. Admin only.
  Calls: validateAdminUser, tournamentLocationRepository.update
- **deleteTournamentLocation(locationId)**: `Promise<void>` — Deletes a tournament location entry. Admin only.
  Calls: validateAdminUser, tournamentLocationRepository.delete
- **getTournamentById(tournamentId)**: `Promise<Tournament | null>` — Gets single tournament with localization.
  Calls: findTournamentById, applyLocalization
- **getCompleteTournamentGroups(tournamentId)**: `Promise<ExtendedGroupData[]>` — Gets all groups for tournament.
  Calls: findGroupsWithGamesAndTeamsInTournament
- **createOrUpdateTournamentGroup(tournamentId, groupData, teamIds, locale)**: `Promise<void>` — Creates or updates group with team assignments.
  Calls: getLoggedInUser, updateTournamentGroup, findTeamInGroup, createTournamentGroup, deleteTournamentGroupTeams, createTournamentGroupTeam, findGroupsWithGamesAndTeamsInTournament
- **getPlayoffRounds(tournamentId)**: `Promise<PlayoffRound[]>` — Gets all playoff stages with localization.
  Calls: findPlayoffStagesWithGamesInTournament, applyLocalizationBatch
- **createOrUpdatePlayoffRound(playoffRoundData, locale)**: `Promise<PlayoffRound>` — Creates or updates playoff stage.
  Calls: getLoggedInUser, updatePlayoffRound, createPlayoffRound, applyLocalization
- **findLatestFinishedGroupGame(tournamentId)**: `Promise<Game | undefined>` — Finds the most recently completed group game.
- **getGroupStandingsForTournament(tournamentId)**: `Promise<GroupStandings[]>` — Gets standings for all groups in a tournament.
  Calls: findGroupsInTournament, findQualifiedTeams, findGamesInGroup, findTeamInGroup, calculateGroupPosition, applyLocalizationBatch, toMap

### app/actions/score-history-actions.ts
Server Action for reading daily score history for a friend group in a tournament (Story #272). Also provides snapshot score utilities for leaderboard rank-change computation (Story #277).

- **getScoreHistoryForGroup(userIds: string[], tournamentId: string)**: `Promise<ScoreHistoryResult>` — Fetches per-user daily score snapshots and computes 1224 competition ranks per date. Returns `isEmpty: true` when no snapshots exist. LOCF with score=0: users with no prior snapshot get score=0 at earlier dates (ranked last).
  Calls: findUsersByIds, getScoreHistoryForUsers, findFirstGameInTournament, findLastGameInTournament

Exported types: `ScoreHistoryDataPoint`, `UserScoreHistory`, `ScoreHistoryResult`

### app/actions/tournament-scoring-actions.ts
Manages tournament scoring configuration (points per correct prediction).

- **getTournamentScoringConfigAction(tournamentId, locale)**: `Promise<ScoringConfig>` — Gets scoring config for a tournament.
  Calls: auth, findTournamentById
- **updateTournamentScoringConfigAction(tournamentId, update, locale)**: `Promise<Tournament>` — Updates scoring configuration.
  Calls: auth, updateTournament
- **getRecommendedScoringValues(tournamentId, locale)**: `Promise<RecommendedValues>` — Gets recommended scoring values based on game count.
  Calls: auth, findGamesInTournament

### app/actions/user-actions.ts
Authentication and user account management — signup, verification, password, OAuth.

- **signupUser(user, locale)**: `Promise<{ success: boolean; error?: string }>` — Creates new user with password authentication.
  Calls: findUserByEmail, createUser, getPasswordHash, sendVerificationEmail
- **resendVerificationEmail(locale)**: `Promise<{ success: boolean; error?: string }>` — Resends verification email.
  Calls: getLoggedInUser, updateUser, sendVerificationEmail
- **updateNickname(nickname, locale)**: `Promise<{ success: boolean; error?: string }>` — Updates user nickname.
  Calls: getLoggedInUser, updateUser
- **updateUserLocale(locale)**: `Promise<void>` — Updates user's language preference.
  Calls: auth, updateUser
- **getLoggedInUser()**: `Promise<User | undefined>` — Gets the currently authenticated user.
  Calls: auth
- **sendPasswordResetLink(email, locale)**: `Promise<{ success: boolean; error?: string; isOAuthOnly?: boolean }>` — Sends password reset email.
  Calls: findUserByEmail, userHasPasswordAuth, updateUser, generatePasswordResetEmail, sendEmail
- **verifyUserEmail(token, locale)**: `Promise<{ success: boolean; user?: User; error?: string }>` — Verifies email with token.
  Calls: findUserByVerificationToken, verifyEmail
- **verifyResetToken(token)**: `Promise<User | null>` — Verifies password reset token validity.
  Calls: findUserByResetToken
- **updateUserPassword(userId, newPassword, locale)**: `Promise<{ success: boolean; message?: string; error?: string }>` — Updates user password.
  Calls: getPasswordHash, updateUser
- **deleteAccount(locale)**: `Promise<{ success?: boolean; error?: string }>` — Deletes user account and all associated data.
  Calls: getLoggedInUser, findProdeGroupsByOwner, deleteAllParticipantsFromGroup, deleteProdeGroup, deleteParticipantFromAllGroups, deleteAllUserTournamentGuesses, deleteAllUserGameGuesses, deleteAllUserGroupPositionsPredictions, deleteUser
- **getUsersPaginated(search: string, page: number, pageSize: number)**: `Promise<{ users: Pick<User, 'id' | 'email' | 'nickname' | 'is_admin' | 'is_ad_free' | 'auth_providers' | 'email_verified'>[]; total: number }>` — Admin-only. Fetches paginated, filtered user list for backoffice Users tab.
  Calls: getLoggedInUser, findUsersPaginated, countUsers
- **toggleUserAdFreeAction(userId: string, isAdFree: boolean)**: `Promise<void>` — Admin-only. Toggles ad-free status for a user.
  Calls: getLoggedInUser, updateUserAdFreeStatus

### app/actions/hub-actions.ts
Tournament Hub data fetching: shared page-level hub data, Action Center game cards, Leaderboard Peek widget, Recent Results widget, and public tournament timing.

**Exported types:** `TournamentHubPageData { scoringConfig: ScoringConfig, totalGames: number, isStarted: boolean, isFinished: boolean }`, `TournamentTiming { firstGameDate: Date|null, tournamentHasStarted: boolean, tournamentJustStarted: boolean, tournamentName: string|null }`, `ActionCenterData { games, gameGuesses, teamsMap, tournamentMaxSilver, tournamentMaxGolden, mode: 'urgent'|'fallback'|'empty', qtAndAwardsOpen, msUntilPredictionLock, tournamentFinished, firstGameDate: Date|null, tournamentHasStarted: boolean, tournamentName: string|null, openerBackfill: boolean, totalGames: number, predictedGames: number, awardsCompleted: number, awardsTotal: number, qualifiersCompleted: number, qualifiersTotal: number, tournamentJustStarted: boolean, scoringConfig: ScoringConfig }`, `LeaderboardPeekResult { groups: GroupPeekData[], userHasGroups: boolean, allGroupNames: Array<{ id: string; name: string }> }`, `RankNeighborEntry { userId, userName, rank, score, isCurrentUser }`, `GroupPeekData { groupId, groupName, totalMembers, userRank, rankChange: number|null, rows: RankNeighborEntry[] }`, `HonorRollPosition = 'champion'|'runnerUp'|'thirdPlace'`, `IndividualAwardType = 'bestPlayer'|'topGoalscorer'|'bestGoalkeeper'|'bestYoungPlayer'`, `RecentGameResultItem { gameId, homeTeamName, awayTeamName, homeScore, awayScore, userHomeGuess, userAwayGuess, basePoints, boostType, boostBonus, finalPoints, gameDate }`, `RecentResultsData { recentGames, qualifiedTeamsScore, qualifiedTeamsCorrect, qualifiedTeamsActualCount: number, individualAwardsScore, honorRollScore, honorRollCorrect: HonorRollPosition[]|null, individualAwardsCorrect: IndividualAwardType[]|null }`

- **getTournamentHubPageData(tournamentId: string)**: `Promise<TournamentHubPageData>` — Server Action. Returns shared tournament data needed by all dashboard widgets. Does NOT require authentication. Runs `findTournamentById`, `findFirstGameInTournament`, `findLastGameInTournament`, and an inline Kysely `countAll` query for total games in parallel. Derives `isStarted` (firstGame.game_date <= now) and `isFinished` (lastGame.game_date < now). Falls back to DEFAULT_SCORING when tournament is not found or all scoring fields are null.
  Calls: findTournamentById, findFirstGameInTournament, findLastGameInTournament, db.selectFrom (inline count)

- **computeIsIncompleteUser(data: ActionCenterData)**: `Promise<boolean>` — Returns `true` when `!tournamentHasStarted && qtAndAwardsOpen && firstGameDate !== null` AND any track is below its completion threshold (games < 30%, awards < 90% when awardsTotal > 0, qualifiers < 90% when qualifiersTotal > 0). Zero-total sections treated as complete (100%).
  Calls: *(none — pure function)*
- **getPublicTournamentTiming(tournamentId: string, locale: Locale)**: `Promise<TournamentTiming>` — Returns minimal public timing data without requiring authentication. Fetches tournament and first game in parallel. Computes `tournamentHasStarted` (first game kicked off), `tournamentJustStarted` (first game kicked off within last 48h), and `tournamentName` via `computeTournamentName`. Safe to call for all users.
  Calls: findTournamentById, findFirstGameInTournament
- **getActionCenterGames(tournamentId: string, locale: Locale)**: `Promise<ActionCenterData>` — Server Action. Fetches games in the 7-day dashboard window, user guesses, teams, tournament boost limits, first/last game dates, and prediction completion stats via `getTournamentPredictionCompletion`. Returns up to 4 unpredicted open-deadline games (urgent mode), next 3 games when all open games are predicted (fallback mode), or empty/fallback mode when no window games exist. When no window games are found and the tournament hasn't started, backfills `games` with the opener via `findFirstGameFullData` and sets `openerBackfill=true` (mode becomes 'fallback'). Computes: `qtAndAwardsOpen`/`msUntilPredictionLock` (lock fires 5 days after first game); `tournamentFinished` (last game has kicked off); `tournamentHasStarted` (first game has kicked off); `firstGameDate`; `tournamentName` (localized short name via `applyLocalization`); `totalGames`, `predictedGames`, `awardsCompleted`, `awardsTotal`, `qualifiersCompleted`, `qualifiersTotal` (from prediction completion); `tournamentJustStarted` (first game kicked off within last 48h). Throws Unauthorized if user is not logged in.
  Calls: getLoggedInUser, findGamesForDashboard, findGameGuessesByUserId, findTeamInTournament, findTournamentById, findFirstGameInTournament, findLastGameInTournament, getTournamentPredictionCompletion, findFirstGameFullData (conditional), calculateDeadline, applyLocalizationBatch, applyLocalization
- **getLeaderboardPeekData(tournamentId: string, _locale: Locale)**: `Promise<LeaderboardPeekResult>` — Server Action. Returns up to 3 friend groups where the current user has ranking data, sorted by ranked member count descending. Also returns `userHasGroups` (true if user belongs to any group, before ranking filter) and `allGroupNames` (all group names for pre-tournament preview). Per group: builds a 3-row neighbor window and computes rank change from the two most recent snapshots. Returns `{ groups: [], userHasGroups: false, allGroupNames: [] }` when unauthenticated or user has no groups.
  Calls: getLoggedInUser, findProdeGroupsByOwner, findProdeGroupsByParticipant, getFavoriteGroupIds, getLatestRankingsForGroup, getLatestTwoGroupRankingSnapshots
- **getRecentResultsData(tournamentId: string, locale: Locale)**: `Promise<RecentResultsData>` — Server Action. Fetches last 5 scored games with user guesses plus materialized QT/award scores. Computes `qualifiedTeamsActualCount` from `findQualifiedTeams`. Populates `honorRollCorrect` and `individualAwardsCorrect` arrays by comparing tournament result fields with user's tournament guess (null when not yet scored). Throws Unauthorized if no session.
  Calls: getLoggedInUser, findRecentGamesWithUserGuesses, getTournamentGuessStatsForUsers, findTeamInTournament, findQualifiedTeams, findTournamentById, findTournamentGuessByUserIdTournament, applyLocalizationBatch

### app/actions/group-ranking-actions.ts
Server Actions for materializing and reading per-group rank snapshots. Snapshots are written after admin score-change triggers; reads derive rank change from the two most recent snapshots (Story #315). Batch leaderboard read added in Story #320. Rank history read (for History tab) added in Story #335.

- **recalculateGroupRankings(groupId: string, tournamentId: string)**: `Promise<void>` — Internal. Fetches all group members, computes their scores, applies competition ranking, and upserts today's snapshots. No auth check.
  Calls: findProdeGroupById, findParticipantsInGroup, getUserScoresForTournament, calculateRanks, getTodayYYYYMMDD, upsertGroupRankingSnapshots
- **recalculateGroupRankingsForUsers(tournamentId: string, changedUserIds: string[])**: `Promise<void>` — Internal. Finds all groups containing at least one user from changedUserIds, then calls recalculateGroupRankings per group with error isolation (try/catch per group). Does nothing for empty changedUserIds.
  Calls: findGroupsForUsers, recalculateGroupRankings
- **getGroupRankHistory(groupId: string, tournamentId: string)**: `Promise<UserRankHistoryEntry[] | null>` — Server Action. Reads all pre-stored rank snapshots from group_rankings for a group/tournament. Returns null when no snapshots exist (caller falls back to computed ranks). Snapshots are grouped by userId and ordered by date ascending.
  Calls: getGroupRankingSnapshots
- **getGroupRankingForUser(userId: string, groupId: string, tournamentId: string)**: `Promise<MaterializedGroupRanking | null>` — Server Action. Fetches two most recent snapshots and derives rankChange (previousRank - currentRank; positive = improved). Returns null when no snapshots exist.
  Calls: getLatestTwoGroupRankingSnapshots
- **getMaterializedLeaderboardRanks(groupId: string, tournamentId: string)**: `Promise<Map<string, { currentRank: number; rankChange: number }>>` — Server Action. Returns a Map keyed by userId with each user's current rank and rank change (positive = moved up) for use by LeaderboardCards. `rankChange = previousRank - currentRank`; users with no previous snapshot get `rankChange: 0`. Returns empty Map when no snapshots exist or repository throws.
  Calls: getLatestRankingsForGroupWithChange
