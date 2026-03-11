# Database Repositories

Part of the CODE-STRUCTURE.md system. See `CODE-STRUCTURE.md` for the full index and call graph.

**Last updated:** 2026-03-09

---

## Files

### app/db/base-repository.ts
Generic factory for CRUD operations on identifiable database tables.

- **createBaseFunctions<K1, K2>(tableName: IdentifiableTables)**: `{ findById, create, update, delete }` — Factory generating base CRUD functions for a Kysely table with React cache() wrapper.

### app/db/database.ts
Kysely database instance and schema definition for PostgreSQL.

- **db**: `Database` — Initialized Kysely database instance with full schema interface.

### app/db/tables-definition.ts
TypeScript type definitions for all database tables, insertable/updateable shapes, and schema interface. No runtime exports — type-only file.

### app/db/game-guess-repository.ts
Repository for game_guesses table. Handles user predictions with boost tracking and materialized score storage.

- **findGameGuessById(id: string)**: `Promise<GameGuess | undefined>` — Finds single game guess by ID (cached).
- **createGameGuess(guess: GameGuessNew)**: `Promise<GameGuess>` — Creates a new game guess.
- **updateGameGuess(id: string, update: Updateable<GameGuessTable>)**: `Promise<GameGuess>` — Updates an existing game guess.
- **deleteGameGuess(id: string)**: `Promise<GameGuess>` — Deletes a game guess.
- **findGameGuessesByUserId(userId: string, tournamentId: string)**: `Promise<GameGuess[]>` — Returns all game guesses for user in tournament (cached).
- **updateGameGuessByGameId(gameId: string, userId: string, update: object)**: `Promise<GameGuess | undefined>` — Updates home/away scores for a specific game guess.
- **updateOrCreateGuess(guess: GameGuessNew)**: `Promise<GameGuess>` — Upserts a game guess (deletes existing, creates new).
- **legacyGetGameGuessStatisticsForUsers(userIds: string[], tournamentId: string)**: `Promise<GameStatisticForUser[]>` — Legacy SQL aggregation for game statistics; used for backfill and validation.
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
- **getBoostStatsForUsersInTournament(userIds: string[], tournamentId: string)**: `Promise<Array<{ user_id: string; boosts_used: number; scored_boosts: number }>>` — Multi-user boost stats for badge calculation. Only counts locked games (result exists OR game_date < NOW()). Returns empty array for empty userIds.

### app/db/game-repository.ts
Repository for games table. Manages game records with group/playoff metadata. Returns raw data; localization applied in Server Actions.

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
