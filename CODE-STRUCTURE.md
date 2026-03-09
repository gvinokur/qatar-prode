# CODE-STRUCTURE.md

Living map of all production source files, their exported functions/components, and call relationships.

**Format guide:** `docs/claude/code-structure.md`
**Last updated:** 2026-03-09

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
- **calculateGameScores(forceDrafts, forceAllGuesses, locale)**: `Promise<void>` — Recalculates all game guess scores.
  Calls: findAllGamesWithPublishedResultsAndGameGuesses, findAllGuessesForGamesWithResultsInDraft, findTournamentById, calculateScoreForGame, updateGameGuessWithBoost, updateGameGuess, recalculateGameScoresForUsers
- **calculateAndStoreGroupPosition(groupId, teamIds, groupGames, sortByGamesBetweenTeams)**: `Promise<void>` — Updates group standings.
  Calls: calculateGroupPosition, updateTournamentGroupTeams
- **findDataForAwards(tournamentId)**: `Promise<{ tournament: Tournament; players: ExtendedPlayerData[] }>` — Gets tournament and players for award assignment.
  Calls: findTournamentById, findAllPlayersInTournamentWithTeamData, applyLocalization
- **updateTournamentAwards(tournamentId, withUpdate, locale)**: `Promise<void>` — Updates individual awards and recalculates scores.
  Calls: updateTournament, findTournamentById, findTournamentGuessByTournament, updateTournamentGuessWithSnapshot
- **updateTournamentHonorRoll(tournamentId, withUpdate, locale)**: `Promise<void>` — Updates honor roll (champion, runner-up, third place).
  Calls: updateTournament, findTournamentById, findTournamentGuessByTournament, updateTournamentGuessWithSnapshot
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

- **updateOrCreateGameGuesses(gameGuesses, locale)**: `Promise<{ success: boolean; error?: string }>` — Saves game predictions (upsert).
  Calls: getLoggedInUser, updateOrCreateGuess
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
- **getGroupsForUser()**: `Promise<{ owned: ProdeGroup[]; participating: ProdeGroup[]; pendingRequests: JoinRequest[] }>` — Gets user's groups (owned, participating, and pending join requests).
  Calls: getLoggedInUser, findProdeGroupsByOwner, findProdeGroupsByParticipant, findJoinRequestsByUser
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
- **getUserScoresForTournament(userIds, tournamentId)**: `Promise<UserScore[]>` — Calculates tournament scores for a set of users.
  Calls: getGameGuessStatisticsForUsers, findTournamentGuessByUserIdsTournament
- **calculateTournamentGroupStats(groupId, tournamentId, userId)**: `Promise<TournamentGroupStats>` — Gets aggregated group stats for a tournament.
  Calls: findProdeGroupById, findParticipantsInGroup, getUserScoresForTournament, getGroupTournamentBettingConfig, findUsersByIds

### app/actions/prode-group-discovery-actions.ts
Public group discovery and search for group browsing.

- **getPublicGroupsAction(searchTerm, page, tournamentId)**: `Promise<GetPublicGroupsResult | { error: string }>` — Gets paginated public groups matching search criteria.
  Calls: findPublicGroups, countPublicGroups

### app/actions/prode-group-join-request-actions.ts
Manages join requests for friend groups — requesting, approving, rejecting, and cancelling.

- **requestToJoinGroup(groupId, source, locale, tournamentId, message)**: `Promise<{ success: boolean; message: string }>` — Sends a join request to a group.
  Calls: getLoggedInUser, findProdeGroupById, findParticipantsInGroup, findPendingJoinRequest, findRecentRejectedRequest, createJoinRequest, findUsersByIds, generateJoinRequestNotificationEmail, sendEmail
- **getUserJoinRequests()**: `Promise<JoinRequest[]>` — Gets current user's join requests.
  Calls: getLoggedInUser, findJoinRequestsByUser
- **getGroupJoinRequests(groupId)**: `Promise<JoinRequest[]>` — Gets pending requests for a group (admin only).
  Calls: getLoggedInUser, findProdeGroupById, findParticipantsInGroup, findJoinRequestsByGroup
- **approveJoinRequestAction(requestId, groupId, tournamentId)**: `Promise<{ success: boolean; message: string }>` — Approves a join request (admin).
  Calls: getLoggedInUser, findProdeGroupById, findParticipantsInGroup, approveJoinRequestRepo, findUsersByIds, generateJoinRequestApprovedEmail, sendEmail, revalidatePath
- **rejectJoinRequestAction(requestId, groupId)**: `Promise<{ success: boolean; message: string }>` — Rejects a join request (admin).
  Calls: getLoggedInUser, findProdeGroupById, findParticipantsInGroup, rejectJoinRequestRepo, findUsersByIds, generateJoinRequestRejectedEmail, sendEmail, revalidatePath
- **cancelJoinRequestAction(requestId)**: `Promise<{ success: boolean; message: string }>` — Cancels own pending join request.
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

- **calculateAndStoreQualifiedTeamsScores(tournamentId, locale)**: `Promise<BatchScoringResult>` — Calculates and persists scores for all tournament users.
  Calls: findTournamentById, calculateQualifiedTeamsScore, updateTournamentGuesses, revalidatePath
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
- **createOrUpdateTournament(tournamentId, tournamentFormData, locale)**: `Promise<Tournament>` — Creates or updates tournament with optional logo upload.
  Calls: validateAdminUser, parseFormData, getExistingTournament, handleLogoUpload, prepareTournamentData, saveOrUpdateTournament, cleanupOldLogo, applyLocalization
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

### app/db/base-repository.ts
Generic factory for CRUD operations on identifiable database tables.

- **createBaseFunctions<K1, K2>(tableName: IdentifiableTables)**: `{ findById, create, update, delete }` — Factory generating base CRUD functions for a Kysely table with React cache() wrapper.

### app/db/database.ts
Kysely database instance and schema definition for PostgreSQL.

- **db**: `Database` — Initialized Kysely database instance with full schema interface.

### app/db/game-guess-repository.ts
Repository for game_guesses table. Handles user predictions with boost tracking and materialized score storage.

- **findGameGuessById(id: string)**: `Promise<GameGuess | undefined>` — Finds single game guess by ID (cached).
- **createGameGuess(guess: GameGuessNew)**: `Promise<GameGuess>` — Creates a new game guess.
- **updateGameGuess(id: string, update: Updateable<GameGuessTable>)**: `Promise<GameGuess>` — Updates an existing game guess.
- **deleteGameGuess(id: string)**: `Promise<GameGuess>` — Deletes a game guess.
- **findGameGuessesByUserId(userId: string, tournamentId: string)**: `Promise<GameGuess[]>` — Returns all game guesses for user in tournament (cached).
- **updateGameGuessByGameId(gameId: string, userId: string, update: object)**: `Promise<GameGuess | undefined>` — Updates home/away scores for a specific game guess.
- **updateOrCreateGuess(guess: GameGuessNew)**: `Promise<GameGuess>` — Upserts a game guess (deletes existing, creates new).
- **legacyGetGameGuessStatisticsForUsers(userIds: string[], tournamentId: string)**: `Promise<GameStatisticForUser[]>` — Legacy SQL aggregation for game statistics.
- **getGameGuessStatisticsForUsers(userIds: string[], tournamentId: string)**: `Promise<GameStatisticForUser[]>` — Reads materialized game scores from tournament_guesses table.
- **findAllGuessesForGamesWithResultsInDraft()**: `Promise<GameGuess[]>` — Finds guesses for games with draft results.
- **deleteAllUserGameGuesses(userId: string)**: `Promise<void>` — Deletes all game guesses for user (account deletion).
- **deleteAllGameGuessesByTournamentId(tournamentId: string)**: `Promise<void>` — Deletes all game guesses for tournament.
- **updateGameGuessWithBoost(guessId: string, baseScore: number, boostType: 'silver' | 'golden' | null)**: `Promise<GameGuess>` — Updates score and boost multiplier.
- **setGameGuessBoost(userId: string, gameId: string, boostType: 'silver' | 'golden' | null)**: `Promise<GameGuess>` — Sets boost type for a game guess.
- **countUserBoostsByType(userId: string, tournamentId: string)**: `Promise<{ silver: number; golden: number }>` — Counts silver and golden boosts used.
- **getGameGuessWithBoost(userId: string, gameId: string)**: `Promise<GameGuess | undefined>` — Gets game guess with boost information.
- **getPredictionDashboardStats(userId: string, tournamentId: string)**: `Promise<{ totalGames: number; predictedGames: number; silverUsed: number; goldenUsed: number }>` — Aggregated dashboard metrics in single query.
- **getBoostAllocationBreakdown(userId: string, tournamentId: string, boostType: 'silver' | 'golden')**: `Promise<BoostBreakdown>` — Breaks down boost usage by group and playoff stage.

### app/db/game-repository.ts
Repository for games table. Manages game records with group/playoff metadata.

- **findGameById(id: string)**: `Promise<Game | undefined>` — Finds single game by ID (cached).
- **updateGame(id: string, update: Updateable<GameTable>)**: `Promise<Game>` — Updates a game.
- **createGame(game: GameTable)**: `Promise<Game>` — Creates a new game.
- **deleteGame(id: string)**: `Promise<Game>` — Deletes a game.
- **findGamesInTournament(tournamentId: string, draftResult: boolean)**: `Promise<ExtendedGameData[]>` — Finds all games in tournament with group/playoff metadata (cached).
- **getGameCountsForTournament(tournamentId: string)**: `Promise<{ total: number; played: number }>` — Efficient COUNT query for total and played games.
- **findFirstGameInTournament(tournamentId: string)**: `Promise<Game | undefined>` — Finds first game by date (cached).
- **findGamesInGroup(groupId: string, completeGame: boolean, draftResult: boolean)**: `Promise<ExtendedGameData[] | Game[]>` — Finds games in a group with optional metadata (cached).
- **deleteAllGamesFromTournament(tournamentId: string)**: `Promise<void>` — Deletes all games for a tournament.
- **findAllGamesWithPublishedResultsAndGameGuesses(forceDrafts: boolean, forceAllGameGuesses: boolean)**: `Promise<GameWithResultAndGuess[]>` — Finds games with published results and unscored guesses (cached).
- **findGamesAroundCurrentTime(tournamentId: string)**: `Promise<ExtendedGameData[]>` — Finds last 24h results + next 48h upcoming games (cached).
- **findGamesInNext24Hours(tournamentId: string)**: `Promise<ExtendedGameData[]>` — Finds upcoming games in next 24 hours (cached).
- **findGamesForDashboard(tournamentId: string)**: `Promise<ExtendedGameData[]>` — Unified dashboard query: last 24h + next 48h games (cached).
- **getAllTournamentGames(tournamentId: string)**: `Promise<ExtendedGameData[]>` — Fetches ALL games for unified games page (cached).
- **getTournamentGameCounts(userId: string | null, tournamentId: string)**: `Promise<TournamentGameCounts>` — Counts for filter badges (total, groups, playoffs, unpredicted, closing soon) (cached).

### app/db/game-result-repository.ts
Repository for game_results table. Manages actual game outcomes (scores, penalties).

- **createGameResult(result: GameResultNew)**: `Promise<GameResult>` — Creates a new game result.
- **updateGameResult(gameId: string, result: GameResultUpdate)**: `Promise<GameResult | undefined>` — Updates game result, handling null values.
- **findGameResultByGameId(gameId: string, includeDrafts: boolean)**: `Promise<GameResult | undefined>` — Finds result for a single game (cached).
- **findGameResultByGameIds(gameIds: string[], includeDrafts: boolean)**: `Promise<GameResult[]>` — Finds results for multiple games (cached).
- **deleteAllGameResultsByTournamentId(tournamentId: string)**: `Promise<void>` — Deletes all results for tournament.

### app/db/onboarding-repository.ts
Repository for user onboarding state and checklist tracking.

- **getOnboardingStatus(userId: string)**: `Promise<OnboardingStatus | undefined>` — Gets onboarding status and data (cached).
- **updateOnboardingData(userId: string, data: Partial<OnboardingData>)**: `Promise<User | undefined>` — Merges new onboarding data with existing.
- **completeOnboarding(userId: string)**: `Promise<User | undefined>` — Marks onboarding as completed.
- **skipOnboarding(userId: string)**: `Promise<User | undefined>` — Skips onboarding.
- **dismissTooltip(userId: string, tooltipId: string)**: `Promise<User | undefined>` — Adds tooltip ID to dismissed list.
- **updateChecklistItem(userId: string, itemId: string, completed: boolean)**: `Promise<User | undefined>` — Updates checklist item completion.

### app/db/player-repository.ts
Repository for players table. Manages individual player records in tournaments.

- **findPLayerById(id: string)**: `Promise<Player | undefined>` — Finds player by ID (cached).
- **createPlayer(player: PlayerTable)**: `Promise<Player>` — Creates a new player.
- **deletePlayer(id: string)**: `Promise<Player>` — Deletes a player.
- **updatePlayer(id: string, update: Updateable<PlayerTable>)**: `Promise<Player>` — Updates a player.
- **findPlayerByTeamAndTournament(tournamentId: string, teamId: string, name: string)**: `Promise<Player | undefined>` — Finds specific player in tournament.
- **findAllPlayersInTournamentWithTeamData(tournamentId: string)**: `Promise<ExtendedPlayerData[]>` — Finds all players with team info.
- **getPlayersInTournament(tournamentId: string)**: `Promise<number>` — Counts players in tournament.
- **deleteAllPlayersInTournamentTeam(tournamentId: string, teamId: string)**: `Promise<void>` — Deletes all players for team.
- **deleteAllPlayersInTournament(tournamentId: string)**: `Promise<void>` — Deletes all players in tournament.

### app/db/prode-group-join-request-repository.ts
Repository for prode_group_join_requests table. Manages friend group membership requests with cooldown and rate limiting.

- **createJoinRequest(groupId: string, userId: string, source: JoinRequestSource, message?: string)**: `Promise<ProdeGroupJoinRequest>` — Creates new join request.
- **findJoinRequestsByGroup(groupId: string, status?: JoinRequestStatus)**: `Promise<JoinRequest[]>` — Finds requests for a group with user profile data (cached).
- **findJoinRequestsByUser(userId: string, status?: JoinRequestStatus)**: `Promise<JoinRequest[]>` — Finds requests for a user (cached).
- **findPendingJoinRequest(groupId: string, userId: string)**: `Promise<ProdeGroupJoinRequest | undefined>` — Finds specific pending request.
- **findRecentRejectedRequest(groupId: string, userId: string)**: `Promise<ProdeGroupJoinRequest | undefined>` — Finds recent rejection for cooldown check.
- **approveJoinRequest(requestId: string, resolvedByUserId: string)**: `Promise<ProdeGroupJoinRequest>` — Approves request and adds user to group.
- **rejectJoinRequest(requestId: string, resolvedByUserId: string)**: `Promise<ProdeGroupJoinRequest>` — Rejects a join request.
- **cancelJoinRequest(requestId: string, userId: string)**: `Promise<void>` — User cancels own request.
- **countPendingRequestsForGroup(groupId: string)**: `Promise<number>` — Counts pending requests for notification badge.

### app/db/prode-group-repository.ts
Repository for prode_groups (friend groups) and related tables. Manages group creation, members, privacy, and betting configuration.

- **findProdeGroupById(id: string)**: `Promise<ProdeGroup | undefined>` — Finds group by ID (cached).
- **createProdeGroup(group: ProdeGroupTable)**: `Promise<ProdeGroup>` — Creates new friend group.
- **deleteProdeGroup(id: string)**: `Promise<ProdeGroup>` — Deletes a group.
- **updateProdeGroup(id: string, update: Updateable<ProdeGroupTable>)**: `Promise<ProdeGroup>` — Updates group info.
- **findProdeGroupsByOwner(userId: string)**: `Promise<ProdeGroup[]>` — Finds groups owned by user (cached).
- **findProdeGroupsByParticipant(userId: string)**: `Promise<ProdeGroup[]>` — Finds groups where user is a member (cached).
- **addParticipantToGroup(group: ProdeGroup, user: User, isAdmin: boolean)**: `Promise<void>` — Adds user to group.
- **deleteAllParticipantsFromGroup(groupId: string)**: `Promise<void>` — Removes all members from group.
- **deleteParticipantFromAllGroups(userId: string)**: `Promise<void>` — Removes user from all groups (account deletion).
- **findParticipantsInGroup(groupId: string)**: `Promise<{ user_id: string; is_admin: boolean }[]>` — Finds members with admin status.
- **deleteParticipantFromGroup(groupId: string, userId: string)**: `Promise<void>` — Removes specific member.
- **updateParticipantAdminStatus(groupId: string, userId: string, isAdmin: boolean)**: `Promise<void>` — Updates member admin privilege.
- **getGroupTournamentBettingConfig(groupId: string, tournamentId: string)**: `Promise<ProdeGroupTournamentBetting | undefined>` — Gets betting config for group/tournament.
- **createGroupTournamentBettingConfig(config: ProdeGroupTournamentBettingNew)**: `Promise<ProdeGroupTournamentBetting>` — Creates betting config.
- **updateGroupTournamentBettingConfig(id: string, update: ProdeGroupTournamentBettingUpdate)**: `Promise<ProdeGroupTournamentBetting>` — Updates betting config.
- **getGroupTournamentBettingPayments(groupTournamentBettingId: string)**: `Promise<ProdeGroupTournamentBettingPayment[]>` — Gets all payment statuses.
- **getUserGroupTournamentBettingPayment(groupTournamentBettingId: string, userId: string)**: `Promise<ProdeGroupTournamentBettingPayment | undefined>` — Gets user's payment status.
- **setUserGroupTournamentBettingPayment(groupTournamentBettingId: string, userId: string, hasPaid: boolean)**: `Promise<ProdeGroupTournamentBettingPayment>` — Sets user payment status (upsert).
- **findPublicGroups(searchTerm?: string, limit: number, offset: number, tournamentId?: string)**: `Promise<PublicGroupData[]>` — Finds public groups for discovery (paginated).
- **countPublicGroups(searchTerm?: string)**: `Promise<number>` — Counts public groups for pagination.
- **updateGroupPrivacy(groupId: string, isPublic: boolean, description?: string | null)**: `Promise<ProdeGroup>` — Updates privacy and rejects discovery requests if making private.

### app/db/qualified-teams-repository.ts
Repository for group position predictions (JSONB-based). Handles group position predictions and qualified team selections.

- **getGroupPositionsPrediction(userId: string, tournamentId: string, groupId: string)**: `Promise<TournamentUserGroupPositionsPrediction | null>` — Gets group position prediction (cached).
- **getAllUserGroupPositionsPredictions(userId: string, tournamentId: string)**: `Promise<TournamentUserGroupPositionsPrediction[]>` — Gets all group predictions (not cached).
- **upsertGroupPositionsPrediction(userId: string, tournamentId: string, groupId: string, positions: TeamPositionPrediction[])**: `Promise<TournamentUserGroupPositionsPrediction>` — Creates or updates group prediction.
- **deleteGroupPositionsPrediction(userId: string, tournamentId: string, groupId: string)**: `Promise<void>` — Deletes specific group prediction.
- **deleteAllGroupPositionsPredictions(userId: string, tournamentId: string)**: `Promise<void>` — Deletes all predictions for user in tournament.
- **deleteAllUserGroupPositionsPredictions(userId: string)**: `Promise<void>` — Deletes all predictions for user (account deletion).
- **deleteAllTournamentGroupPositionsPredictions(tournamentId: string)**: `Promise<void>` — Deletes all predictions for tournament.

### app/db/short-url-repository.ts
Repository for short_urls table. Manages short invite links for groups.

- **findShortUrlById(id: string)**: `Promise<ShortUrl | undefined>` — Finds short URL by ID (cached).
- **deleteShortUrl(id: string)**: `Promise<ShortUrl>` — Deletes a short URL.
- **getShortUrlByCode(code: string)**: `Promise<ShortUrl | undefined>` — Finds short URL by code (not cached for redirects).
- **getShortUrlForGroup(groupId: string)**: `Promise<ShortUrl | undefined>` — Gets existing short URL for group (cached).
- **createShortUrl(groupId: string, tournamentId?: string)**: `Promise<ShortUrl>` — Creates short URL with collision handling.
- **getOrCreateShortUrl(groupId: string, tournamentId?: string)**: `Promise<ShortUrl>` — Gets or creates short URL (one per group).
- **incrementClickCount(code: string)**: `Promise<void>` — Increments click counter (fire-and-forget).

### app/db/team-repository.ts
Repository for teams table. Manages team records across tournaments. Returns raw data; localization applied in Server Actions.

- **findTeamById(id: string)**: `Promise<Team | undefined>` — Finds team by ID (cached).
- **updateTeam(id: string, update: Updateable<TeamTable>)**: `Promise<Team>` — Updates a team.
- **createTeam(team: TeamTable)**: `Promise<Team>` — Creates a new team.
- **deleteTeam(id: string)**: `Promise<Team>` — Deletes a team.
- **getTeamByName(name: string)**: `Promise<Team | undefined>` — Finds team by name (cached).
- **findTeamInTournament(tournamentId: string)**: `Promise<Team[]>` — Finds all teams in tournament (cached).
- **findTeamInGroup(groupId: string)**: `Promise<Team[]>` — Finds teams in group (cached).
- **findGuessedQualifiedTeams(tournamentId: string, userId: string, inGroupId?: string)**: `Promise<Team[]>` — Finds teams user predicted as qualified (cached).
- **findQualifiedTeams(tournamentId: string, inGroupId?: string)**: `Promise<QualifiedTeamsResult>` — Finds qualified teams progressively (1st/2nd from complete groups, 3rd when playoff known) (cached).

### app/db/tournament-group-repository.ts
Repository for tournament_groups and team standings. Manages group structure and standings.

- **findTournamentgroupById(id: string)**: `Promise<TournamentGroup | undefined>` — Finds group by ID (cached).
- **updateTournamentGroup(id: string, update: Updateable<TournamentGroupTable>)**: `Promise<TournamentGroup>` — Updates group.
- **createTournamentGroup(group: TournamentGroupTable)**: `Promise<TournamentGroup>` — Creates new group.
- **deleteTournamentGroup(id: string)**: `Promise<TournamentGroup>` — Deletes group.
- **createTournamentGroupTeam(team: TournamentGroupTeamNew)**: `Promise<TournamentGroupTeam>` — Adds team to group.
- **createTournamentGroupGame(game: TournamentGroupGameTable)**: `Promise<TournamentGroupGame>` — Adds game to group.
- **findGroupsInTournament(tournamentId: string)**: `Promise<TournamentGroup[]>` — Finds all groups in tournament.
- **findGroupsWithGamesAndTeamsInTournament(tournamentId: string)**: `Promise<ExtendedGroupData[]>` — Finds groups with game/team IDs nested.
- **deleteAllGroupsFromTournament(tournamentId: string)**: `Promise<void>` — Deletes all groups for tournament.
- **findTeamsInGroup(tournamentGroupId: string)**: `Promise<TournamentGroupTeam[]>` — Finds team standings in group.
- **updateTournamentGroupTeams(groupTeams: TournamentGroupTeamUpdate[])**: `Promise<void>` — Batch updates team standings.
- **deleteTournamentGroupTeams(tournamentGroupId: string)**: `Promise<void>` — Deletes all team standings for group.
- **deleteTournamentGroupGame(gameId: string)**: `Promise<void>` — Deletes group game association.
- **updateTeamConductScores(conductScores: { [teamId: string]: number }, tournamentGroupId: string)**: `Promise<void>` — Updates conduct scores for multiple teams.

### app/db/tournament-guess-repository.ts
Repository for tournament_guesses table. Tracks overall tournament scores and materialized game scores.

- **findTournamentGuessById(id: string)**: `Promise<TournamentGuess | undefined>` — Finds record by ID (cached).
- **createTournamentGuess(guess: TournamentGuessNew)**: `Promise<TournamentGuess>` — Creates new record.
- **updateTournamentGuess(id: string, update: TournamentGuessUpdate)**: `Promise<TournamentGuess>` — Updates record.
- **deleteTournamentGuess(id: string)**: `Promise<TournamentGuess>` — Deletes record.
- **updateTournamentGuessWithSnapshot(guessId: string, updates: TournamentGuessUpdate)**: `Promise<TournamentGuess | undefined>` — Updates with daily snapshot for rank tracking.
- **updateTournamentGuessByUserIdTournament(userId: string, tournamentId: string, update: TournamentGuessUpdate)**: `Promise<TournamentGuess | undefined>` — Updates by user/tournament composite key.
- **updateTournamentGuessByUserIdTournamentWithSnapshot(userId: string, tournamentId: string, updates: TournamentGuessUpdate)**: `Promise<TournamentGuess | undefined>` — Updates with daily snapshot by user/tournament.
- **findTournamentGuessByUserIdTournament(userId: string, tournamentId: string)**: `Promise<TournamentGuess | undefined>` — Finds by user/tournament composite.
- **findTournamentGuessByUserIdsTournament(userIds: string[], tournamentId: string)**: `Promise<TournamentGuess[]>` — Finds for multiple users.
- **getTournamentGuessStatsForUsers(userIds: string[], tournamentId: string)**: `Promise<TournamentGuessStats[]>` — Gets stats columns (optimized projection).
- **updateOrCreateTournamentGuess(guess: TournamentGuessNew)**: `Promise<TournamentGuess>` — Upserts record.
- **findTournamentGuessByTournament(tournamentId: string)**: `Promise<TournamentGuess[]>` — Finds all for tournament.
- **deleteAllUserTournamentGuesses(userId: string)**: `Promise<void>` — Deletes all for user (account deletion).
- **deleteAllTournamentGuessesByTournamentId(tournamentId: string)**: `Promise<void>` — Deletes all for tournament.
- **recalculateGameScoresForUsers(userIds: string[], tournamentId: string)**: `Promise<TournamentGuess[]>` — Recalculates and materializes game scores from aggregation.

### app/db/tournament-playoff-repository.ts
Repository for tournament_playoff_rounds and playoff games. Manages playoff bracket structure.

- **findPlayoffRoundBy(id: string)**: `Promise<PlayoffRound | undefined>` — Finds playoff round by ID (cached).
- **updatePlayoffRound(id: string, update: Updateable<PlayoffRoundTable>)**: `Promise<PlayoffRound>` — Updates round.
- **createPlayoffRound(round: PlayoffRoundTable)**: `Promise<PlayoffRound>` — Creates new round.
- **deletePlayoffRound(id: string)**: `Promise<PlayoffRound>` — Deletes round.
- **createPlayoffRoundGame(game: PlayoffRoundGameTable)**: `Promise<PlayoffRoundGame>` — Adds game to playoff round.
- **deletePlayoffRoundGame(gameId: string)**: `Promise<PlayoffRoundGame>` — Removes game from round.
- **findPlayoffStagesWithGamesInTournament(tournamentId: string)**: `Promise<ExtendedPlayoffRoundData[]>` — Finds all playoff stages with game IDs nested, sorted by round order.
- **deleteAllPlayoffRoundsInTournament(tournamentId: string)**: `Promise<void>` — Deletes all playoff rounds for tournament.

### app/db/tournament-prediction-completion-repository.ts
Repository for tournament prediction completion tracking.

- **getTournamentPredictionCompletion(userId: string, tournamentId: string, tournament: Tournament)**: `Promise<TournamentPredictionCompletion>` — Calculates overall prediction progress including game completion, boost usage, award selection, and qualifier selections.

### app/db/tournament-repository.ts
Repository for tournaments table. Manages tournament master records. Returns raw data; localization applied in Server Actions.

- **findTournamentById(id: string)**: `Promise<Tournament | undefined>` — Finds tournament by ID (cached).
- **updateTournament(id: string, update: Updateable<TournamentTable>)**: `Promise<Tournament>` — Updates tournament.
- **createTournament(tournament: TournamentTable)**: `Promise<Tournament>` — Creates new tournament.
- **deleteTournament(id: string)**: `Promise<Tournament>` — Deletes tournament.
- **findTournamentByName(name: string)**: `Promise<Tournament | undefined>` — Finds by long_name.
- **findAllTournaments()**: `Promise<Tournament[]>` — Finds all tournaments.
- **findAllActiveTournaments(userId?: string)**: `Promise<Tournament[]>` — Finds active tournaments, filtering dev tournaments by permission.
- **findPastTournaments(limit: number)**: `Promise<Tournament[]>` — Finds inactive tournaments.
- **createTournamentTeam(team: TournamentTeamTable)**: `Promise<TournamentTeam>` — Adds team to tournament.
- **deleteTournamentTeams(tournamentId: string)**: `Promise<void>` — Removes all teams from tournament.

### app/db/tournament-third-place-rules-repository.ts
Repository for tournament_third_place_rules table. Manages third-place playoff bracket rules.

- **createThirdPlaceRule(rule: TournamentThirdPlaceRulesTable)**: `Promise<TournamentThirdPlaceRules>` — Creates rule.
- **updateThirdPlaceRule(id: string, update: Updateable<TournamentThirdPlaceRulesTable>)**: `Promise<TournamentThirdPlaceRules>` — Updates rule.
- **deleteThirdPlaceRule(id: string)**: `Promise<TournamentThirdPlaceRules>` — Deletes rule.
- **findThirdPlaceRuleById(id: string)**: `Promise<TournamentThirdPlaceRules | undefined>` — Finds rule by ID (cached).
- **findThirdPlaceRulesByTournament(tournamentId: string)**: `Promise<TournamentThirdPlaceRules[]>` — Finds all rules for tournament.
- **findThirdPlaceRuleByTournamentAndCombination(tournamentId: string, combinationKey: string)**: `Promise<TournamentThirdPlaceRules | undefined>` — Finds rule by group combination key.
- **upsertThirdPlaceRule(tournamentId: string, combinationKey: string, rules: ThirdPlaceRuleMapping)**: `Promise<TournamentThirdPlaceRules>` — Creates or updates rule on conflict.
- **deleteThirdPlaceRulesByTournament(tournamentId: string)**: `Promise<void>` — Deletes all rules for tournament.
- **getThirdPlaceRulesMapForTournament(tournamentId: string)**: `Promise<{ [key: string]: ThirdPlaceRuleMapping }>` — Gets rules map for playoff calculator.

### app/db/tournament-venue-repository.ts
Repository for tournament_venues table. Manages stadium/venue information.

- **findTournamentVenueById(id: string)**: `Promise<TournamentVenue | undefined>` — Finds venue by ID (cached).
- **updateTournamentVenue(id: string, update: Updateable<TournamentVenueTable>)**: `Promise<TournamentVenue>` — Updates venue.
- **createTournamentVenue(venue: TournamentVenueTable)**: `Promise<TournamentVenue>` — Creates venue.
- **deleteTournamentVenue(id: string)**: `Promise<TournamentVenue>` — Deletes venue.
- **findAllTournamentVenues(tournamentId: string)**: `Promise<TournamentVenue[]>` — Finds all venues for tournament.
- **findTournamentVenueByName(name: string)**: `Promise<TournamentVenue | undefined>` — Finds venue by name.
- **createManyTournamentVenues(venues: TournamentVenueNew[])**: `Promise<TournamentVenue[]>` — Bulk creates venues.
- **deleteAllTournamentVenues(tournamentId: string)**: `Promise<void>` — Deletes all venues for tournament.

### app/db/tournament-view-permission-repository.ts
Repository for tournament_view_permissions table. Manages developer tournament access control.

- **findPermissionById(id: string)**: `Promise<TournamentViewPermission | undefined>` — Finds permission by ID (cached).
- **createPermission(perm: TournamentViewPermissionNew)**: `Promise<TournamentViewPermission>` — Creates permission.
- **deletePermission(id: string)**: `Promise<TournamentViewPermission>` — Deletes permission.
- **findUserIdsForTournament(tournamentId: string)**: `Promise<string[]>` — Gets user IDs with access to tournament.
- **hasUserPermission(tournamentId: string, userId: string)**: `Promise<boolean>` — Checks if user has access.
- **addUsersToTournament(tournamentId: string, userIds: string[])**: `Promise<void>` — Adds users to tournament (ignores duplicates).
- **removeAllTournamentPermissions(tournamentId: string)**: `Promise<void>` — Removes all permissions for tournament.
- **removeUserFromTournament(tournamentId: string, userId: string)**: `Promise<void>` — Removes user's access.

### app/db/users-repository.ts
Repository for users table. Manages user accounts, authentication (password, OAuth, OTP), and push notification subscriptions.

- **findUserById(id: string)**: `Promise<User | undefined>` — Finds user by ID (cached).
- **updateUser(id: string, update: Updateable<UserTable>)**: `Promise<User>` — Updates user.
- **createUser(user: UserTable)**: `Promise<User>` — Creates new user.
- **deleteUser(id: string)**: `Promise<User>` — Deletes user.
- **findUserByEmail(email: string)**: `Promise<User | undefined>` — Finds by email (cached).
- **findUserByNickname(nickname: string)**: `Promise<User | undefined>` — Finds by nickname (cached).
- **findUsersByIds(userIds: string[])**: `Promise<User[]>` — Finds multiple by IDs (cached).
- **findAllUsers()**: `Promise<User[]>` — Finds all users sorted by email (cached).
- **findUserByResetToken(token: string)**: `Promise<User | undefined>` — Finds by password reset token.
- **getPasswordHash(password: string)**: `string` — Hashes password with salt.
- **verifyEmail(token: string)**: `Promise<User | undefined>` — Marks email verified by token.
- **findUserByVerificationToken(token: string)**: `Promise<User | undefined>` — Finds user by valid verification token.
- **addNotificationSubscription(userId: string, subscription: PushSubscription)**: `Promise<User | undefined>` — Adds web push subscription.
- **removeNotificationSubscription(userId: string, subscription: PushSubscription)**: `Promise<User | undefined>` — Removes push subscription.
- **getNotificationSubscriptions(userId: string)**: `Promise<PushSubscription[]>` — Gets all subscriptions.
- **findUsersWithNotificationSubscriptions()**: `Promise<User[]>` — Finds users with active subscriptions.
- **findUserByOAuthAccount(provider: string, providerUserId: string)**: `Promise<User | undefined>` — Finds by OAuth account.
- **linkOAuthAccount(userId: string, oauthAccount: OAuthAccount)**: `Promise<User | undefined>` — Links OAuth to existing user.
- **createOAuthUser(email: string, oauthAccount: OAuthAccount, displayName: string | null)**: `Promise<User | undefined>` — Creates OAuth-only user.
- **getAuthMethodsForEmail(email: string)**: `Promise<{ hasPassword: boolean; hasGoogle: boolean; userExists: boolean }>` — Gets available auth methods (cached).
- **getAuthProviders(user: User)**: `string[]` — Gets auth_providers array.
- **userHasPasswordAuth(user: User)**: `boolean` — Checks password authentication enabled.
- **generateOTP(email: string)**: `Promise<{ success: boolean; error?: string }>` — Generates OTP with rate limiting (1 min).
- **verifyOTP(email: string, code: string)**: `Promise<{ success: boolean; user?: User; error?: string }>` — Verifies OTP with max 3 attempts.
- **clearOTP(userId: string)**: `Promise<User | undefined>` — Clears OTP fields.

### app/definitions.ts
Type definitions for extended data shapes used throughout the application.

*(Type-only file — no exported functions)*

### app/hooks/use-game-countdown.ts
Custom hook for countdown to game prediction deadline with urgency levels.

- **useGameCountdown(gameDate: Date)**: `{ timeLeft: string; isLive: boolean; countdownEnded: boolean }` — [Client] Tracks time until game, updates every second.
  Uses: useCountdownContext

### app/utils/environment-utils.ts
Environment detection utilities.

- **isDevelopmentMode()**: `boolean` — Checks if running in development mode.

### app/utils/game-score-calculator.ts
Game prediction score calculation logic.

- **calculateScoreForGame(game: Game, gameGuess: GameGuess, scoringConfig: ScoringConfig)**: `number` — Calculates points earned for a prediction.
  Calls: hasValidScores, getPenaltyWinners, checkExactMatch, checkCorrectOutcome, checkPlayoffPenaltyScenarios

### app/utils/score-utils.tsx
Helper functions to determine game and prediction winners/losers.

- **getGameWinner(game: Game)**: `string | undefined` — Gets winning team ID from game result.
- **getGameLoser(game: Game)**: `string | undefined` — Gets losing team ID from game result.
- **getGuessWinner(guess: GameGuess, homeTeam: string, awayTeam: string)**: `string | undefined` — Gets predicted winner team ID.
- **getGuessLoser(guess: GameGuess, homeTeam: string, awayTeam: string)**: `string | undefined` — Gets predicted loser team ID.
- **getWinner(homeScore: number, awayScore: number, homePenaltyWinner: boolean, awayPenaltyWinner: boolean, homeTeam: string, awayTeam: string)**: `string | undefined` — Determines winner from scores and penalties.

### app/utils/stats-calculations.ts
Shared statistics calculation utilities.

- **calculatePercentage(numerator: number, denominator: number, decimalPlaces: number)**: `number` — Calculates percentage with rounding.
- **calculateAccuracyStats(userGameStats: GameStatisticForUser, totalPredictionsMade: number, totalGamesAvailable: number, totalGamesPlayed: number)**: `AccuracyStats` — Calculates accuracy breakdown.
  Calls: calculatePercentage
- **calculateBoostStats(boostData: BoostData, maxGames: number, boostType: 'silver' | 'golden')**: `BoostStats` — Calculates boost performance metrics.

---

## Call Graph

This codebase follows a strict layered architecture: **Pages → Server Actions → Repositories → Database**.

```
Architecture pattern:
  [Page (Server Component)]
    └── calls Server Action [server action]
          ├── calls Repository functions
          ├── calls getLoggedInUser (auth check)
          └── calls applyLocalization / applyLocalizationBatch
  [Client Component]
    └── calls Server Action [server action]
    └── uses Custom Hooks

Key flows:

1. Game Prediction Flow:
   updateOrCreateGameGuesses [server action]
     └── updateOrCreateGuess
     └── getLoggedInUser

2. Game Scoring Flow:
   calculateGameScores [server action]
     ├── findAllGamesWithPublishedResultsAndGameGuesses
     ├── calculateScoreForGame
     ├── updateGameGuessWithBoost
     └── recalculateGameScoresForUsers
           └── (materializes scores to tournament_guesses)

3. Tournament Data Flow:
   getTournaments [server action]
     ├── findAllActiveTournaments
     └── applyLocalizationBatch

4. Group Membership Flow:
   requestToJoinGroup [server action]
     ├── findPendingJoinRequest (prevent duplicates)
     ├── findRecentRejectedRequest (cooldown check)
     ├── createJoinRequest
     └── sendEmail (notification to admins)

   approveJoinRequestAction [server action]
     ├── approveJoinRequestRepo (adds to group)
     └── sendEmail (approved notification to user)

5. Group Stats Flow:
   calculateTournamentGroupStats [server action]
     ├── findParticipantsInGroup
     ├── getUserScoresForTournament
     │     ├── getGameGuessStatisticsForUsers (materialized)
     │     └── findTournamentGuessByUserIdsTournament
     └── getGroupTournamentBettingConfig

6. Qualified Teams Flow:
   updateGroupPositionsJsonb [server action]
     ├── validateTeamsInGroup / validateNoDuplicateTeams (validation)
     ├── upsertGroupPositionsPrediction
     └── updatePlayoffGameGuesses
           ├── getAllUserGroupPositionsPredictions
           ├── calculatePlayoffTeamsFromPositions
           └── updateGameGuessByGameId
```
