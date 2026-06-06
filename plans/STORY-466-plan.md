# STORY-466 Plan: Admin View of User Completion Stats per Tournament

## Story Context
- **Issue:** #466 — [Story] Admin view of user completion stats per tournament
- **Story Number:** 466
- **Worktree:** `/Users/gvinokur/Personal/qatar-prode-story-466`
- **Branch:** `feature/story-466`

## Objective
Give tournament admins a per-user breakdown of prediction activity. Admins can see which platform users are actively participating in a tournament and which are not.

## Acceptance Criteria
- [ ] Admin sees a new "User Completion" tab inside each tournament in the backoffice (active and inactive)
- [ ] The tab shows a paginated table of all platform users with their stats for that tournament
- [ ] Users who have made at least one prediction appear first; completely inactive users appear after
- [ ] Each row shows: display name, active status (yes/no), overall completion %, games predicted out of total, qualifiers filled out of total, and awards filled out of total
- [ ] Feature works correctly in both EN and ES locales

---

## Technical Approach

### Data Model

**Games predicted / total:**
- Count rows in `game_guesses` where home_score IS NOT NULL for games in this tournament
- Total = count of games in tournament

**Qualifiers filled / total:**
- Count rows in `tournament_user_group_positions_predictions` for user in groups belonging to this tournament
- Total = count of tournament groups (each group has a prediction set)

**Awards filled / total:**
- In `tournament_guesses`: count non-null fields from: champion_team_id, runner_up_team_id, third_place_team_id (final standings = 3) + best_player_id, top_goalscorer_player_id, best_goalkeeper_player_id, best_young_player_id (individual awards = 4)
- Total = 7 always

**Overall Completion %:**
- `(games_predicted + qualifiers_filled + awards_filled) / (total_games + total_groups + 7) * 100`

**Active status:**
- Maps to `email_verified` on the users table (consistent with the existing UsersTab "Verified" column)

### Sort Order
- Users with `games_predicted > 0` (any game prediction made) appear first — sorted by nickname ASC
- Users with zero game predictions appear after — sorted by nickname ASC
- This sort happens at the DB level for correct pagination

### Pagination
- 25 users per page (same as UsersTab)
- DB-level pagination with COUNT for total

---

## Visual Prototype

### User Completion Tab

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                         User Completion Statistics                            │
├────────────────────┬────────┬────────────┬───────────────┬──────────┬────────┤
│  Display Name      │ Active │ Completion │    Games      │Qualifiers│ Awards │
│                    │        │     %      │               │          │        │
├────────────────────┼────────┼────────────┼───────────────┼──────────┼────────┤
│  Alice             │  Yes   │   82%      │   35 / 48     │  8 / 8   │ 6 / 7  │
│  Bob               │  Yes   │   60%      │   25 / 48     │  6 / 8   │ 2 / 7  │
│  Carlos            │  Yes   │   12%      │    8 / 48     │  0 / 8   │ 0 / 7  │
├────────────────────┼────────┼────────────┼───────────────┼──────────┼────────┤
│  Dana              │  No    │    0%      │    0 / 48     │  0 / 8   │ 0 / 7  │
│  Eve               │  Yes   │    0%      │    0 / 48     │  0 / 8   │ 0 / 7  │
├────────────────────┴────────┴────────────┴───────────────┴──────────┴────────┤
│                     [< Prev]   Page 1 of 5   [Next >]                        │
└───────────────────────────────────────────────────────────────────────────────┘
```

**Design notes:**
- "Active" column uses a Chip component: green ("Yes") for email_verified, grey ("No") for unverified — same style as other status chips in the admin
- "Completion %" — plain percentage text
- Games/Qualifiers/Awards — show as "X / Y" format
- Divider row between "has predictions" and "no predictions" users (visual only, achieved via a subtle background difference or Divider MUI component)
- No search bar needed (out of scope)
- MUI TablePagination at the bottom

---

## Files to Create

### 1. `app/db/user-tournament-completion-repository.ts` (NEW)
Single Kysely query function that LEFT JOINs users to their tournament prediction data, with DB-level sort and pagination.

### 2. `app/actions/admin-tournament-actions.ts` (NEW)
Admin-gated Server Action that calls the repository. Auth check follows same pattern as `getUsersPaginated` in `user-actions.ts`.

### 3. `app/components/backoffice/user-completion-tab.tsx` (NEW)
Client component. Fetches paginated data on mount and on page change. Renders MUI Table + TablePagination.

## Files to Modify

### 4. `app/[locale]/backoffice/page.tsx`
- Import `UserCompletionTab`
- Add "User Completion" subtab to BOTH active tournament subtabs AND inactive tournament subtabs
- Pass `tournamentId` to `UserCompletionTab`

### 5. Translation files (for both EN and ES):
- Find and update the backoffice namespace (likely `messages/en/backoffice.json` and `messages/es/backoffice.json`)
- Add keys: `userCompletion`, `displayName`, `active`, `completionPct`, `gamesPredicted`, `qualifiers`, `awards`, `yes`, `no`

### 6. CODE-STRUCTURE layer files:
- `docs/code-structure/db.md` — add `getUserTournamentCompletionsPaginated`
- `docs/code-structure/actions.md` — add `getUserTournamentCompletionsAction`
- `docs/code-structure/components/components-backoffice.md` — add `UserCompletionTab`

---

## Mid-Level Design

### Call Graph Changes

**New flow — User Completion Stats (Admin):**
```
backoffice/page.tsx (server)
  → <UserCompletionTab tournamentId={id} /> (client, one per tournament)
    → getUserTournamentCompletionsAction(tournamentId, page, pageSize, locale) [Server Action]
      → getUserTournamentCompletionsPaginated(tournamentId, page, pageSize) [repository]
        → Kysely: users LEFT JOIN tournament_guesses, LEFT JOIN (game_guess subquery), LEFT JOIN (group_positions subquery)
```

---

### `app/db/user-tournament-completion-repository.ts` *(new file)*

**Types:**
```typescript
export interface UserTournamentCompletionRow {
  userId: string
  nickname: string
  isEmailVerified: boolean
  gamesPredicted: number
  totalGames: number
  qualifiersFilled: number
  qualifiersTotal: number
  awardsFilled: number   // max 7: 3 honor roll + 4 individual
  awardsTotal: number    // always 7
  overallPct: number     // rounded integer
}
```

**New functions:**

- **`getUserTournamentCompletionsPaginated(tournamentId: string, page: number, pageSize: number)`**: `Promise<{ rows: UserTournamentCompletionRow[], total: number }>`
  Single Kysely query:
  - FROM `users`
  - LEFT JOIN `tournament_guesses` ON (user_id, tournament_id)
  - LEFT JOIN subquery `gg_stats` = (SELECT user_id, COUNT(*) as games_predicted FROM game_guesses JOIN games ON game_id = games.id AND games.tournament_id = ? WHERE home_score IS NOT NULL GROUP BY user_id)
  - LEFT JOIN subquery `qp_stats` = (SELECT tugpp.user_id, COUNT(*) as qualifiers_filled FROM tournament_user_group_positions_predictions tugpp JOIN tournament_groups tg ON tugpp.group_id = tg.id WHERE tg.tournament_id = ? GROUP BY tugpp.user_id)
  - CROSS JOIN `(SELECT COUNT(*) FROM games WHERE tournament_id = ?)` as total_games
  - CROSS JOIN `(SELECT COUNT(*) FROM tournament_groups WHERE tournament_id = ?)` as total_groups
  - ORDER BY `CASE WHEN gg_stats.games_predicted > 0 THEN 0 ELSE 1 END ASC, users.nickname ASC`
  - LIMIT pageSize OFFSET (page * pageSize)
  - Parallel count query for total

  Note: count query uses same WHERE conditions as main query (no LIMIT/OFFSET) to return correct total across pages. `overallPct` denominator guards against division-by-zero if tournament has 0 games or 0 groups (returns 0).

  Tests (use `testFactories.createUser()`, `createGame()`, `createTournamentGroup()`, `createGameGuess()`, `createTournamentGuess()`):
  - returns empty `rows` and `total: 0` when no users exist
  - users with at least one game prediction appear before users with zero predictions
  - NULL `games_predicted` (from LEFT JOIN miss) is treated as 0 for sort ordering
  - within each group (predicted/not-predicted), users are sorted by nickname ascending
  - pagination: page 0 returns first N users, page 1 returns next N users
  - `gamesPredicted` equals count of game_guess rows with non-null scores for that tournament
  - `qualifiersFilled` equals count of group position prediction rows for that tournament's groups; total qualifiers = number of tournament_groups (same for all users)
  - `awardsFilled` is 0 when user has no tournament_guesses row (LEFT JOIN returns NULLs for all award fields)
  - `awardsFilled` correctly counts non-null award fields (honor roll: 3 + individual: 4 = max 7)
  - `overallPct` is 0 when no predictions made, 100 when all filled

---

### `app/actions/admin-tournament-actions.ts` *(new file)*

**New functions:**

- **`getUserTournamentCompletionsAction(tournamentId: string, page: number, pageSize: number)`**: `Promise<{ rows: UserTournamentCompletionRow[], total: number }>`
  Server Action. Admin-gated. Calls `getUserTournamentCompletionsPaginated`.
  Calls: `getLoggedInUser`, `getUserTournamentCompletionsPaginated`
  Note: No translations called in the action — all UI labels are handled in `UserCompletionTab` (Client Component) via `useTranslations`.
  Tests:
  - throws Unauthorized (or redirects) when caller is not admin
  - passes tournamentId, page, and pageSize correctly to repository
  - returns data from repository unchanged for valid admin caller

---

### `app/components/backoffice/user-completion-tab.tsx` *(new file)*

Client component. Props: `{ tournamentId: string }`

State: `page`, `rows`, `total`, `loading`

On mount and page change: calls `getUserTournamentCompletionsAction`.

Renders:
- MUI `Table` with columns: Display Name | Active | Completion % | Games | Qualifiers | Awards
- "Active" column: `<Chip label={t('yes')} color="success" />` or `<Chip label={t('no')} />`
- `<TablePagination>` at bottom (25 per page)
- Loading skeleton while fetching

(No unit tests required for this client component — behavior is covered by repository + action tests)

**Error handling:** If the action throws, component shows an inline error message (MUI Alert). Data is not real-time — admins reload the page to see fresh predictions (MVP behavior, acceptable for an admin tool).

---

## Implementation Tasks

**Wave 1 — DB + Action (independent of UI):**
1. Create `app/db/user-tournament-completion-repository.ts` with `getUserTournamentCompletionsPaginated`
2. Write tests for the repository function (covering all 8 test cases above)
3. Create `app/actions/admin-tournament-actions.ts` with `getUserTournamentCompletionsAction`
4. Write tests for the action (covering 3 test cases above)

**Wave 2 — UI (depends on Wave 1):**
5. Create `app/components/backoffice/user-completion-tab.tsx`
6. Update `app/[locale]/backoffice/page.tsx` to add the tab
7. Add translation keys to EN + ES namespace files

**Wave 3 — Documentation:**
8. Update CODE-STRUCTURE layer files (db.md, actions.md, components-backoffice.md)

---

## Testing Strategy

### Unit Tests (Vitest)
- `app/db/user-tournament-completion-repository.test.ts` — 8 test cases using test factories
- `app/actions/admin-tournament-actions.test.ts` — 3 test cases (auth check + delegation)

### Manual Verification
- Log into backoffice as admin
- Navigate to an active tournament → confirm "User Completion" subtab appears
- Navigate to an inactive tournament → confirm "User Completion" subtab appears
- Verify data is sorted: users with predictions first
- Verify pagination works (if > 25 users)
- Switch to ES locale → confirm tab label and column headers appear in Spanish
- Verify % calculation makes sense by comparing to known data

---

## Validation (SonarCloud Quality Gates)
- Code coverage ≥ 80% on new code (repository + action fully covered)
- 0 new issues of any severity
- No hardcoded colors (use MUI theme tokens only)
- TypeScript strict mode — no `any` types

---

## Open Questions / Assumptions
1. **Active status = email_verified**: Assuming this follows the existing "Verified" column in UsersTab. If "active" means something else (e.g., a separate `is_active` DB column), adjust accordingly.
2. **Awards total = 7**: 3 honor roll (champion, runner-up, third place) + 4 individual awards. If the story intends just the 4 individual awards (not honor roll), the total would be 4 and the "awards" column would exclude honor roll. Open to adjustment.
3. **Qualifiers = group position predictions**: Each group has one prediction row per user in `tournament_user_group_positions_predictions`. Total = number of groups. If "qualifiers" means something else (e.g., qualified teams prediction), adjust the subquery.
