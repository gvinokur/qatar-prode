# Server Actions Localization Audit

This document identifies all Server Actions that return tournament/team/game/playoff data and need localization applied.

**Generated:** 2026-02-23
**Story:** #157 - Tournament & Static Data Internationalization

---

## Summary

**Total Actions Requiring Localization:** 21

### By File:
- `tournament-actions.ts`: 13 actions
- `team-actions.ts`: 3 actions
- `game-actions.ts`: 1 action
- `backoffice-actions.ts`: 3 actions
- `qualification-actions.ts`: 0 actions (no localizable data)
- `group-tournament-betting-actions.ts`: 0 actions (no tournament data)
- `guesses-actions.ts`: 0 actions (no tournament data)
- `tournament-scoring-actions.ts`: 1 action

### By Data Type:
- **Tournament** (long_name, short_name): 10 actions
- **Team** (name): 5 actions
- **Game** (location): 4 actions
- **Playoff Round** (round_name): 3 actions

---

## Detailed Action List

### 1. tournament-actions.ts (13 actions)

#### 1.1 `getAllTournaments()`
- **Lines:** 47-50
- **Returns:** `Tournament[]`
- **i18n Fields:** `long_name_i18n`, `short_name_i18n`
- **Localization Required:** YES
- **Usage:** Backoffice, admin pages
- **Implementation:**
  ```typescript
  const locale = await getLocale();
  const tournaments = await findAllTournaments();
  return applyLocalizationBatch(tournaments, locale, [
    { field: 'long_name', i18nField: 'long_name_i18n' },
    { field: 'short_name', i18nField: 'short_name_i18n' }
  ]);
  ```

#### 1.2 `getTournaments()`
- **Lines:** 52-56
- **Returns:** `Tournament[]`
- **i18n Fields:** `long_name_i18n`, `short_name_i18n`
- **Localization Required:** YES
- **Usage:** Public tournament listing, user-facing
- **Implementation:** Same as getAllTournaments()

#### 1.3 `getTournamentById(tournamentId: string)`
- **Lines:** 291-293
- **Returns:** `Tournament`
- **i18n Fields:** `long_name_i18n`, `short_name_i18n`
- **Localization Required:** YES
- **Usage:** Backoffice forms, tournament detail pages
- **Implementation:**
  ```typescript
  const locale = await getLocale();
  const tournament = await findTournamentById(tournamentId);
  if (!tournament) return null;
  return applyLocalization(tournament, locale, [
    { field: 'long_name', i18nField: 'long_name_i18n' },
    { field: 'short_name', i18nField: 'short_name_i18n' }
  ]);
  ```

#### 1.4 `getTournamentAndGroupsData(tournamentId: string)`
- **Lines:** 125-133
- **Returns:** `{ tournament: Tournament, allGroups: TournamentGroup[] }`
- **i18n Fields:** `tournament.long_name_i18n`, `tournament.short_name_i18n`
- **Localization Required:** YES (tournament only, groups have no i18n)
- **Usage:** Tournament configuration pages
- **Implementation:** Localize tournament object only

#### 1.5 `deactivateTournament(tournamentId: string, locale: Locale)`
- **Lines:** 145-162
- **Returns:** `Tournament`
- **i18n Fields:** `long_name_i18n`, `short_name_i18n`
- **Localization Required:** YES
- **Usage:** Backoffice deactivation
- **Implementation:** Localize returned tournament

#### 1.6 `createOrUpdateTournament(tournamentId, tournamentFormData, locale)`
- **Lines:** 173-193
- **Returns:** `Tournament`
- **i18n Fields:** `long_name_i18n`, `short_name_i18n`
- **Localization Required:** YES
- **Usage:** Backoffice tournament form
- **Implementation:** Localize returned tournament

#### 1.7 `getCompleteGroupData(groupId: string, includeDraftResults: boolean)`
- **Lines:** 83-106
- **Returns:** `CompleteGroupData` (includes `gamesMap`)
- **i18n Fields:** `gamesMap[gameId].location_i18n`
- **Localization Required:** YES (games only)
- **Usage:** Group standings pages
- **Implementation:**
  ```typescript
  const locale = await getLocale();
  const games = await findGamesInGroup(group.id, true, includeDraftResults);
  const localizedGames = applyLocalizationBatch(games, locale, [
    { field: 'location', i18nField: 'location_i18n' }
  ]);
  const gamesMap = toMap(localizedGames);
  ```

#### 1.8 `getCompletePlayoffData(tournamentId: string, includeDraftResults: boolean)`
- **Lines:** 108-123
- **Returns:** `CompletePlayoffData` (includes `playoffStages: PlayoffRound[]`, `gamesMap: {[k: string]: Game}`)
- **i18n Fields:**
  - `playoffStages[].round_name_i18n`
  - `gamesMap[gameId].location_i18n`
- **Localization Required:** YES (playoff stages AND games)
- **Usage:** Playoff bracket pages
- **Implementation:**
  ```typescript
  const locale = await getLocale();
  const playoffStages = await findPlayoffStagesWithGamesInTournament(tournamentId);
  const localizedStages = applyLocalizationBatch(playoffStages, locale, [
    { field: 'round_name', i18nField: 'round_name_i18n' }
  ]);
  const games = await findGamesInTournament(tournamentId, includeDraftResults);
  const localizedGames = applyLocalizationBatch(games, locale, [
    { field: 'location', i18nField: 'location_i18n' }
  ]);
  const gamesMap = toMap(localizedGames);
  ```

#### 1.9 `getCompleteTournamentGroups(tournamentId: string)`
- **Lines:** 295-297
- **Returns:** `ExtendedGroupData[]` (groups with games and teams)
- **i18n Fields:**
  - `games[].location_i18n`
  - `teams[].name_i18n`
- **Localization Required:** YES (games AND teams)
- **Usage:** Backoffice group management
- **Implementation:** Localize games and teams arrays within each group

#### 1.10 `getPlayoffRounds(tournamentId: string)`
- **Lines:** 378-380
- **Returns:** `PlayoffRound[]`
- **i18n Fields:** `round_name_i18n`
- **Localization Required:** YES
- **Usage:** Backoffice playoff management
- **Implementation:**
  ```typescript
  const locale = await getLocale();
  const rounds = await findPlayoffStagesWithGamesInTournament(tournamentId);
  return applyLocalizationBatch(rounds, locale, [
    { field: 'round_name', i18nField: 'round_name_i18n' }
  ]);
  ```

#### 1.11 `createOrUpdatePlayoffRound(playoffRoundData, locale)`
- **Lines:** 387-411
- **Returns:** `PlayoffRound`
- **i18n Fields:** `round_name_i18n`
- **Localization Required:** YES
- **Usage:** Backoffice playoff form
- **Implementation:** Localize returned playoff round

#### 1.12 `getGroupStandingsForTournament(tournamentId: string)`
- **Lines:** 441-493
- **Returns:** `{ groups: GroupWithStandings[], defaultGroupId, qualifiedTeams }` where `teamsMap: {[k: string]: Team}`
- **i18n Fields:** `teamsMap[teamId].name_i18n`
- **Localization Required:** YES (teams only)
- **Usage:** Tournament home page sidebar
- **Implementation:**
  ```typescript
  const locale = await getLocale();
  const teams = await findTeamInGroup(group.id);
  const localizedTeams = applyLocalizationBatch(teams, locale, [
    { field: 'name', i18nField: 'name_i18n' }
  ]);
  const teamsMap = toMap(localizedTeams);
  ```

#### 1.13 `getTeamsMap(objectId: string, teamParent: 'tournament' | 'group')`
- **Lines:** 76-81
- **Returns:** `{[k: string]: Team}`
- **i18n Fields:** `name_i18n`
- **Localization Required:** YES
- **Usage:** Multiple pages (group data, playoff data)
- **Implementation:**
  ```typescript
  const locale = await getLocale();
  const teams = teamParent === 'tournament'
    ? await findTeamInTournament(objectId)
    : await findTeamInGroup(objectId);
  const localizedTeams = applyLocalizationBatch(teams, locale, [
    { field: 'name', i18nField: 'name_i18n' }
  ]);
  return toMap(localizedTeams);
  ```

---

### 2. team-actions.ts (3 actions)

#### 2.1 `createTeam(formData: FormData, tournamentId: string)`
- **Lines:** 23-76
- **Returns:** `Team`
- **i18n Fields:** `name_i18n`
- **Localization Required:** YES
- **Usage:** Backoffice team creation
- **Implementation:**
  ```typescript
  const locale = await getLocale();
  const newTeam = await createTeamInDb(finalTeamData);
  // ... create tournament association
  return applyLocalization(newTeam, locale, [
    { field: 'name', i18nField: 'name_i18n' }
  ]);
  ```

#### 2.2 `updateTeam(teamId: string, formData: FormData)`
- **Lines:** 81-131
- **Returns:** `Team`
- **i18n Fields:** `name_i18n`
- **Localization Required:** YES
- **Usage:** Backoffice team editing
- **Implementation:** Localize returned team

#### 2.3 `getPlayersInTournament(tournamentId: string)`
- **Lines:** 136-164
- **Returns:** `{team: Team, players: Player[]}[]`
- **i18n Fields:** `team.name_i18n`
- **Localization Required:** YES (team objects only)
- **Usage:** Backoffice player management
- **Implementation:**
  ```typescript
  const locale = await getLocale();
  const teams = await findTeamInTournament(tournamentId);
  const localizedTeams = applyLocalizationBatch(teams, locale, [
    { field: 'name', i18nField: 'name_i18n' }
  ]);
  // ... build teamMap with localized teams
  ```

---

### 3. game-actions.ts (1 action)

#### 3.1 `getGamesInTournament(tournamentId: string)`
- **Lines:** 102-104
- **Returns:** `Game[]`
- **i18n Fields:** `location_i18n`
- **Localization Required:** YES
- **Usage:** Various pages displaying games
- **Implementation:**
  ```typescript
  const locale = await getLocale();
  const games = await findGamesInTournament(tournamentId);
  return applyLocalizationBatch(games, locale, [
    { field: 'location', i18nField: 'location_i18n' }
  ]);
  ```

---

### 4. backoffice-actions.ts (3 actions)

#### 4.1 `getGroupDataWithGamesAndTeams(tournamentId: string)`
- **Lines:** 398-400
- **Returns:** `ExtendedGroupData[]` (groups with games and teams)
- **i18n Fields:**
  - `games[].location_i18n`
  - `teams[].name_i18n`
- **Localization Required:** YES (games AND teams)
- **Usage:** Backoffice group standings editor
- **Implementation:** Localize games and teams within each group

#### 4.2 `findDataForAwards(tournamentId: string)`
- **Lines:** 526-536
- **Returns:** `{ tournamentUpdate: TournamentUpdate, players: PlayerWithTeam[] }`
- **i18n Fields:** `players[].team.name_i18n` (team is nested)
- **Localization Required:** YES (team objects within players)
- **Usage:** Backoffice awards management
- **Implementation:**
  ```typescript
  const locale = await getLocale();
  const players = await findAllPlayersInTournamentWithTeamData(tournamentId);
  const localizedPlayers = players.map(player => ({
    ...player,
    team: applyLocalization(player.team, locale, [
      { field: 'name', i18nField: 'name_i18n' }
    ])
  }));
  ```

#### 4.3 `copyTournament(tournamentId, newStartDate?, longName?, shortName?, locale)`
- **Lines:** 612-842
- **Returns:** `Tournament`
- **i18n Fields:** `long_name_i18n`, `short_name_i18n`
- **Localization Required:** YES
- **Usage:** Backoffice tournament duplication
- **Implementation:** Localize returned tournament

---

### 5. tournament-scoring-actions.ts (1 action)

#### 5.1 `getTournamentScoringConfigAction(tournamentId: string, locale: Locale)`
- **Lines:** 13-38
- **Returns:** Scoring config object (extracted fields from Tournament)
- **i18n Fields:** None (returns numeric config only)
- **Localization Required:** NO
- **Usage:** Backoffice scoring configuration
- **Notes:** This action extracts scoring config from tournament but doesn't return localizable fields

---

## Actions NOT Requiring Localization

The following actions were analyzed but do NOT require localization:

### qualification-actions.ts
- `getTournamentQualificationConfig()` - Returns boolean flags only
- `updateGroupPositionsJsonb()` - Updates predictions, no tournament data returned

### group-tournament-betting-actions.ts
- All actions - Handle betting config, not tournament data

### guesses-actions.ts
- `updateOrCreateGameGuesses()` - Creates guesses, no data returned
- `updateOrCreateTournamentGuess()` - Creates guesses, no data returned
- `updatePlayoffGameGuesses()` - Updates guesses, no data returned

### tournament-scoring-actions.ts
- `updateTournamentScoringConfigAction()` - Updates config, returns Tournament but used only in admin context
- `getRecommendedScoringValues()` - Returns calculated values, not tournament data

---

## Implementation Priority

### Phase 1: High-Impact User-Facing (Wave 1)
1. `getTournaments()` - Main tournament listing
2. `getTournamentById()` - Tournament details
3. `getCompleteGroupData()` - Group standings
4. `getCompletePlayoffData()` - Playoff brackets
5. `getGroupStandingsForTournament()` - Home page sidebar

### Phase 2: Backoffice Management (Wave 2)
6. `getAllTournaments()` - Admin tournament list
7. `getCompleteTournamentGroups()` - Group management
8. `getPlayoffRounds()` - Playoff management
9. `getPlayersInTournament()` - Player management
10. `getTeamsMap()` - Shared utility

### Phase 3: CRUD Operations (Wave 3)
11. `createOrUpdateTournament()` - Tournament form
12. `createOrUpdatePlayoffRound()` - Playoff form
13. `createTeam()` - Team creation
14. `updateTeam()` - Team editing
15. `copyTournament()` - Tournament duplication

### Phase 4: Supporting Actions (Wave 4)
16. `getTournamentAndGroupsData()` - Config pages
17. `deactivateTournament()` - Admin action
18. `getGroupDataWithGamesAndTeams()` - Backoffice
19. `findDataForAwards()` - Awards management
20. `getGamesInTournament()` - Game listings

---

## Notes

1. **Import Pattern:** All actions will need to import:
   ```typescript
   import { getLocale } from 'next-intl/server';
   import { applyLocalization, applyLocalizationBatch } from '../utils/localization-helper';
   ```

2. **Existing Locale Parameters:** Some actions already have `locale: Locale = 'es'` parameters (e.g., `createOrUpdateTournament`, `deactivateTournament`). These should use that parameter instead of calling `getLocale()`.

3. **Nested Data Structures:** Actions like `getCompletePlayoffData()` return complex objects with multiple arrays. Need to localize each array separately before assembling the final object.

4. **Performance:** Actions that return large arrays (e.g., `getAllTournaments()`) should use `applyLocalizationBatch()` for better performance.

5. **Testing Strategy:** Each wave should include unit tests to verify:
   - Localization is applied correctly
   - Fallback to original value when locale missing
   - Dev warnings are logged for missing locales

---

## Completion Criteria

- [ ] All 21 actions updated with localization
- [ ] Unit tests created for each action
- [ ] Integration tests verify end-to-end localization
- [ ] Documentation updated in action files
- [ ] No regressions in existing functionality
