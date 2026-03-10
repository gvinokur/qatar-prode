# STORY-273 Plan: Badge System Foundation + Core Badges

## Context

The leaderboard is static — there is no way to recognize individual achievements within a group. This misses engagement opportunities (banter, daily check-ins, recognition). This story introduces a badge system: a pure-TypeScript calculation engine + display component that awards 12 core badges computed from existing materialized data (no new schema required), plus one new query for Boost King ratio. Badges appear in the leaderboard cards, the share templates (leaderboard and H2H), and the H2H dialog.

---

## Acceptance Criteria

- 12 badges calculable from existing + minimally extended data pipeline
- Badges shown in collapsed leaderboard card (16px, below points)
- Expanded card shows "Insignias" section (20px, full list)
- Badges in H2H dialog for both players
- Badges in leaderboard share card (15px) and H2H share card (17px)
- Negative badges styled: opacity 0.4 + grayscale(1) in dark; opacity 0.35 only (no filter) in share cards (html-to-image incompatibility)
- i18n: badge names + descriptions in EN + ES
- Unit tests for badge-calculator.ts (≥80% coverage on new code)

---

## Badge Definitions

| Emoji | ID | Criteria | Type |
|---|---|---|---|
| 🥇 | `crack` | rank === 1 | Positive |
| 📈 | `rocket` | max rankChange in group (most places gained today) | Positive |
| 🎯 | `sharp` | top 10% by exactRate (exact/correct) in group | Positive |
| 👑 | `crystal-ball` | honor_roll_score >= champion_points | Positive |
| 🔮 | `oracle` | honor_roll_score >= champion+runner_up+third_place points | Positive |
| 🔍 | `award-scout` | individual_awards_score >= 9 (3+ awards at 3pts each), only if awards configured | Positive |
| 🎫 | `golden-ticket` | qualifiedTeamsCorrect / totalQualifyingSlots > 0.70 | Positive |
| 🏆 | `boost-king` | highest scored_boosts/boosts_used ratio in group | Positive |
| 📉 | `free-fall` | min rankChange in group (most places lost today) | Negative |
| 💩 | `dead-last` | last rank in group | Negative |
| 🙈 | `broken-sight` | bottom 10% by exactRate in group | Negative |
| 🥄 | `wooden-spoon` | lowest qualifiedTeamsCorrect in group | Negative |

Notes:
- `exactRate = total_exact_guesses / max(total_correct_guesses, 1)`
- Rocket/Free Fall only awarded if rankChange != 0 (someone must have actually moved)
- Boost King only awarded if user has at least 1 boost used
- Crystal Ball / Oracle only awarded if honor_roll scoring is configured (champion_points > 0)
- Award Scout only if individual_award_points is configured > 0
- Crystal Ball / Oracle are permanent once awarded (ignore rank, based purely on score history)

---

## Technical Approach

### Layer 1: New DB Query — `getBoostStatsForUsersInTournament`

**File:** `app/db/game-guess-repository.ts` *(modified)*

New function that queries `game_guesses` joined to `games` to count:
- `boosts_used`: COUNT where boost_type IS NOT NULL
- `scored_boosts`: COUNT where boost_type IS NOT NULL AND final_score > 0

This is the only new DB round-trip. All other badge data already exists in `tournament_guesses`.

### Layer 2: Extend Data Pipeline — `getUserScoresForTournament`

**File:** `app/actions/prode-group-actions.ts` *(modified)*
**File:** `app/definitions.ts` *(modified)*

Extend `UserScore` interface with:
```typescript
totalExactGuesses: number      // from tournamentGuess.total_exact_guesses
totalCorrectGuesses: number    // from tournamentGuess.total_correct_guesses
qualifiedTeamsCorrect: number  // from tournamentGuess.qualified_teams_correct
boostsUsed: number             // from new getBoostStatsForUsersInTournament
scoredBoosts: number           // from new getBoostStatsForUsersInTournament
```

These fields are already materialized in `tournament_guesses` (fetched by `findTournamentGuessByUserIdsTournament` which uses selectAll). Only `boostsUsed/scoredBoosts` require a new query (run in parallel with existing calls).

### Layer 3: Badge Calculator Utility

**File:** `app/utils/badge-calculator.ts` *(new)*

Pure TypeScript functions:

```typescript
export type BadgeId = 'crack' | 'rocket' | 'sharp' | 'crystal-ball' | 'oracle' |
  'award-scout' | 'golden-ticket' | 'boost-king' | 'free-fall' | 'dead-last' |
  'broken-sight' | 'wooden-spoon'

export interface Badge { id: BadgeId; emoji: string; type: 'positive' | 'negative' }

export interface TournamentBadgeConfig {
  champion_points: number            // default 5
  runner_up_points: number           // default 3
  third_place_points: number         // default 1
  has_third_place: boolean           // false = Oracle needs only champion+runner_up
  individual_award_points: number    // 0 = no award badges
  total_qualifying_slots: number     // for Golden Ticket threshold
}

export interface UserBadgeInput {
  userId: string
  rank: number
  rankChange: number
  totalExactGuesses: number
  totalCorrectGuesses: number
  qualifiedTeamsCorrect: number
  honorRollScore: number
  individualAwardsScore: number
  boostsUsed: number
  scoredBoosts: number
}

// Main function: computes badges for ALL users in a group at once
export function calculateBadges(
  users: UserBadgeInput[],
  config: TournamentBadgeConfig
): Map<string, Badge[]>
```

Relative badges (Rocket, FreeFall, Sharp, BrokenSight, Wooden Spoon) are computed group-wide (all users passed together).

### Layer 4: Component Types

**File:** `app/components/leaderboard/types.ts` *(modified)*

- Add `badges: Badge[]` to `LeaderboardUser`
- Add `badges: Badge[]` to `LeaderboardCardProps`
- Add `tournamentBadgeConfig: TournamentBadgeConfig` to `LeaderboardCardsProps` and `LeaderboardViewProps`

### Layer 5: New Component — BadgeRow

**File:** `app/components/leaderboard/BadgeRow.tsx` *(new)*

```typescript
interface BadgeRowProps {
  badges: Badge[]
  sizePx: 15 | 16 | 17 | 18 | 20   // matches spec pixel values per view
  context: 'dark' | 'share'          // 'share' omits grayscale filter (html-to-image)
  justify?: 'flex-start' | 'flex-end' | 'center'
  maxDisplay?: number                // cap for share cards (default: unlimited)
}
```

Renders a `flex` row of `<span>` elements (raw emoji). Each wrapped in MUI `Tooltip` with badge name + description from `useTranslations('groups.badges')`. Negative badges: opacity 0.4 (dark) / 0.35 (share) + `filter: grayscale(1)` in dark context only (omit in share context for html-to-image compat).

### Layer 6: Component Integration

**LeaderboardCards.tsx** *(modified)*:
- Accept `tournamentBadgeConfig` prop
- Compute badges via `useMemo(() => calculateBadges(leaderboardUsers, config), [...])`
- Pass badge data to: LeaderboardCard, HeadToHeadDialog, LeaderboardTemplate

**LeaderboardCard.tsx** *(modified)*:
- Collapsed row: render `<BadgeRow size="small" badges={badges}>` below points (align-items: flex-end, flex-direction: column on right side)
- Expanded "Insignias" section: `<BadgeRow size="large" badges={badges}>` with section label

**HeadToHeadDialog.tsx** *(modified)*:
- Accept `currentUserBadges: Badge[]` and `opponentBadges: Badge[]` props
- Pass to HeadToHeadTemplate

**LeaderboardTemplate.tsx** *(modified)*:
- Add `badges?: Badge[]` to `LeaderboardTemplateUser`
- Render 15px badge row in right column, below points; negative: `opacity: 0.35` only (no CSS filter)

**HeadToHeadTemplate.tsx** *(modified)*:
- Add `myBadges: Badge[]`, `theirBadges: Badge[]` props
- Left player: `justify-content: flex-start`, right: `justify-content: flex-end`; negative: `opacity: 0.35` only

### Layer 7: Page Config Extraction

**Files:** `app/[locale]/tournaments/[id]/friend-groups/[group_id]/page.tsx` and `app/[locale]/friend-groups/[id]/page.tsx` *(modified)*

Both pages already load the full `tournament` object. Add `findQualifiedTeams(tournament.id)` in parallel with existing calls. The `findQualifiedTeams` function already exists in `qualified-teams-repository.ts`.

```typescript
const [userScores, qualifiedTeams] = await Promise.all([
  getUserScoresForTournament(allParticipants, tournament.id),
  findQualifiedTeams(tournament.id),
])

const badgeConfig: TournamentBadgeConfig = {
  championPoints: tournament.champion_points ?? 5,
  runnerUpPoints: tournament.runner_up_points ?? 3,
  thirdPlacePoints: tournament.third_place_points ?? 1,
  individualAwardPoints: tournament.individual_award_points ?? 0,
  totalQualifyingSlots: qualifiedTeams.length,  // 0 = skip Golden Ticket
}
```

Pass `badgeConfig` through `LeaderboardView` → `LeaderboardCards`.

### Layer 8: i18n

**Files:** `locales/en/groups.json`, `locales/es/groups.json` *(modified)*

Add `"badges"` section under `"groups"` namespace:
```json
"badges": {
  "crack": { "name": "Crack", "description": "Currently #1 in the group" },
  "rocket": { "name": "Rocket", "description": "Most rank places gained today" },
  ...all 12 badges...
}
```

---

## Files to Create / Modify

| File | Action |
|---|---|
| `app/db/game-guess-repository.ts` | Add `getBoostStatsForUsersInTournament` |
| `app/definitions.ts` | Extend `UserScore` with 5 new fields |
| `app/actions/prode-group-actions.ts` | Extend `getUserScoresForTournament` |
| `app/utils/badge-calculator.ts` | **New** — badge engine |
| `app/components/leaderboard/types.ts` | Add badge props/types |
| `app/components/leaderboard/BadgeRow.tsx` | **New** — badge display component |
| `app/components/leaderboard/LeaderboardCards.tsx` | Compute + pass badges |
| `app/components/leaderboard/LeaderboardCard.tsx` | Render badges collapsed + expanded |
| `app/components/leaderboard/HeadToHeadDialog.tsx` | Accept + display badges |
| `app/components/friend-groups/sharing/LeaderboardTemplate.tsx` | Add badges to share card |
| `app/components/friend-groups/sharing/HeadToHeadTemplate.tsx` | Add badges to H2H share |
| `app/[locale]/tournaments/[id]/friend-groups/[group_id]/page.tsx` | Build + pass TournamentBadgeConfig |
| `app/[locale]/friend-groups/[id]/page.tsx` | Build + pass TournamentBadgeConfig |
| `locales/en/groups.json` | Add `badges.*` translations |
| `locales/es/groups.json` | Add `badges.*` translations |
| `CODE-STRUCTURE.md` (index) | Last updated date |
| `docs/code-structure/utils.md` | Add badge-calculator.ts |
| `docs/code-structure/components/components-leaderboard-stats.md` | Add BadgeRow, update signatures |
| `docs/code-structure/db.md` | Add getBoostStatsForUsersInTournament |
| `docs/code-structure/actions.md` | Update getUserScoresForTournament signature |

---

## Mid-Level Design

### Call Graph Changes

**Modified flows:**
- **Flow 5 (Group stats / leaderboard)** — `getUserScoresForTournament` now calls `getBoostStatsForUsersInTournament` (new repo fn) in parallel. `LeaderboardCards` now calls `calculateBadges` (new util) and passes `Badge[]` arrays to `LeaderboardCard`, `HeadToHeadDialog`, `LeaderboardTemplate`, `HeadToHeadTemplate`.

**New flows:** None — badges are computed client-side from data already in the leaderboard props, and one new parallel DB call is added inside the existing server action.

---

### `app/db/game-guess-repository.ts` *(modified)*

**New functions:**

- **getBoostStatsForUsersInTournament(userIds: string[], tournamentId: string)**: `Promise<Array<{ user_id: string; boosts_used: number; scored_boosts: number }>>`
  Queries `game_guesses` joined to `games` on `game_id`. Counts rows where `boost_type IS NOT NULL` as `boosts_used`, rows where `boost_type IS NOT NULL AND score > 0` as `scored_boosts` (`score` = base prediction score, 0 = wrong prediction regardless of boost). Groups by `user_id`. Returns empty array if `userIds` is empty.
  Tests:
  - returns empty array for empty userIds
  - returns 0 scored_boosts when all boosts had score = 0 (wrong predictions)
  - counts only rows where game belongs to the specified tournament
  - returns correct counts when some boosts scored and others didn't
  - does not count non-boosted game guesses in boosts_used

---

### `app/definitions.ts` *(modified)*

**Changed types:**

- **UserScore** *(was: 11 fields)* — add `totalExactGuesses: number`, `totalCorrectGuesses: number`, `qualifiedTeamsCorrect: number`, `boostsUsed: number`, `scoredBoosts: number`

Column mapping confirmation (all already exist in `tournament_guesses`, fetched by `findTournamentGuessByUserIdsTournament` which uses `selectAll()`):
- `totalExactGuesses` ← `tournament_guesses.total_exact_guesses` (materialized by `recalculateGameScoresForUsers`)
- `totalCorrectGuesses` ← `tournament_guesses.total_correct_guesses` (same materialization)
- `qualifiedTeamsCorrect` ← `tournament_guesses.qualified_teams_correct` (set by qualified-teams scoring pipeline)

Fields already in `UserScore` and used in `UserBadgeInput` (no new fields needed):
- `honorRollScore` ← `tournament_guesses.honor_roll_score` (already in UserScore)
- `individualAwardsScore` ← `tournament_guesses.individual_awards_score` (already in UserScore)

Only `boostsUsed` + `scoredBoosts` require the new `getBoostStatsForUsersInTournament` query.

---

### `app/actions/prode-group-actions.ts` *(modified)*

**Changed functions:**

- **getUserScoresForTournament(userIds: string[], tournamentId: string)**: `Promise<UserScore[]>` *(no signature change, extended return shape)*
  Now calls `getBoostStatsForUsersInTournament(userIds, tournamentId)` in parallel with the existing two calls (`getGameGuessStatisticsForUsers` + `findTournamentGuessByUserIdsTournament`). Both `total_exact_guesses`, `total_correct_guesses`, `qualified_teams_correct` are already in the `tournamentGuess` selectAll result — just add them to the returned object. Maps boost stats into each UserScore.
  Calls: getGameGuessStatisticsForUsers, findTournamentGuessByUserIdsTournament, getBoostStatsForUsersInTournament
  Tests:
  - returns totalExactGuesses = 0 when no exact guesses exist
  - returns qualifiedTeamsCorrect from tournament_guesses
  - merges boost stats correctly when user has both boosted scoring and non-scoring games
  - returns boostsUsed = 0 when user has no boosts

---

### `app/utils/badge-calculator.ts` *(new)*

**New functions:**

- **calculateBadges(users: UserBadgeInput[], config: TournamentBadgeConfig)**: `Map<string, Badge[]>`
  Pure function. Computes all 12 badge types in a single pass over all users. `UserBadgeInput.rankChange` is pre-computed by `calculateRanksWithChange` in `LeaderboardCards` and passed here; the badge calculator does NOT re-derive it. Relative badges compare across all users; absolute badges use per-user thresholds. Returns a Map keyed by userId. **Contract: each user's badge array is guaranteed positive-first, negative-last order** — `BadgeRow` relies on this for `maxDisplay` truncation (show most flattering badges first).
  Tests:
  - assigns Crack only to user with rank 1 (other users get no Crack badge)
  - assigns DeadLast only to user with the highest rank number; same user as Crack in 1-person group
  - assigns Rocket to user with most positive rankChange; skips if all rankChanges are 0
  - assigns FreeFall to user with most negative rankChange; skips if all rankChanges are 0
  - Rocket/FreeFall: tied users resolved by lexicographic userId (first alphabetically gets it)
  - assigns Sharp to top 10% by exactRate (1 out of 10); BrokenSight to bottom 10%
  - no Sharp/BrokenSight with fewer than 3 users (rounding prevents meaningful 10%)
  - assigns CrystalBall when `honorRollScore >= championPoints` and `championPoints > 0`
  - assigns Oracle when `honorRollScore >= championPoints + runnerUpPoints + thirdPlacePoints`; skips when thirdPlacePoints = 0 (no third-place in tournament)
  - does NOT assign CrystalBall/Oracle when championPoints = 0
  - assigns GoldenTicket when `qualifiedTeamsCorrect / totalQualifyingSlots > 0.70`; skips when totalQualifyingSlots = 0
  - assigns BoostKing to user with highest scored_boosts/boosts_used; award to NO ONE when tied
  - skips BoostKing for users with 0 boosts_used
  - assigns WoodenSpoon to user with lowest qualifiedTeamsCorrect; awards to ALL tied users
  - does NOT assign AwardScout when `individualAwardPoints = 0`
  - assigns AwardScout when `individualAwardsScore >= individualAwardPoints * 3`
  - returns empty array for users who earn none

- **BADGES**: `Record<BadgeId, Badge>` — static object defining all 12 badges (emoji, type 'positive'/'negative'). Used as lookup table; no tests needed.

`TournamentBadgeConfig` interface (exported from badge-calculator.ts):
```typescript
export interface TournamentBadgeConfig {
  championPoints: number         // default 5; 0 = no Crystal Ball/Oracle
  runnerUpPoints: number         // default 3
  thirdPlacePoints: number       // default 1; 0 = Oracle needs only champion+runner_up
  individualAwardPoints: number  // 0 = no Award Scout badge
  totalQualifyingSlots: number   // 0 = no Golden Ticket/Wooden Spoon
}
```

- **BADGES** constant: `Record<BadgeId, Badge>` — static definitions (emoji, type) for all 12 badges

---

### `app/components/leaderboard/BadgeRow.tsx` *(new)*

**New component:**

- **BadgeRow({ badges, size, context, justify })**: `JSX.Element`
  Renders a flex row of emoji spans, each wrapped in MUI `Tooltip` showing badge name + description from `useTranslations('groups.badges')`. Negative badges styled with opacity; CSS filter only when `context === 'dark'` (omit for share cards). Size `'small'` = 16px, `'large'` = 20px.
  Tests:
  - renders nothing when badges array is empty
  - applies grayscale filter for negative badges in dark context
  - does NOT apply filter in light context (share card compatibility)
  - renders tooltip with correct badge name

---

### `app/components/leaderboard/LeaderboardCards.tsx` *(modified)*

**Changed functions:**

- **LeaderboardCards(props)** *(adds tournamentBadgeConfig prop)*
  Adds `useMemo` for `badgeMap: Map<string, Badge[]>` computed from `calculateBadges(leaderboardUsers as UserBadgeInput[], tournamentBadgeConfig)`. Passes `badges={badgeMap.get(user.id) ?? []}` to each `LeaderboardCard`. Passes `currentUserBadges` and `opponentBadges` to `HeadToHeadDialog`. Passes badge data to share templates via updated `LeaderboardTemplateUser` and H2H template props.
  Tests:
  - passes empty badge array to cards when config is missing
  - badge computation reruns when leaderboardUsers change

---

### `app/components/leaderboard/LeaderboardCard.tsx` *(modified)*

**Changed functions:**

- **LeaderboardCard(props)** *(adds badges: Badge[] prop)*
  Collapsed row: adds `<BadgeRow size="small" context="dark" badges={badges}>` in the right column below points using `flex-direction: column; align-items: flex-end`. Expanded "Insignias" section: adds section label + `<BadgeRow size="large" context="dark" badges={badges}>` at bottom of point breakdown.
  Tests:
  - renders badge row with correct size in collapsed state
  - renders Insignias section when expanded and badges exist
  - does not render Insignias section when badges array is empty

---

## Visual Layout (Collapsed Card)

```
┌───────────────────────────────────────────────┐
│  #1 ↑  [Avatar]  PlayerName      450 pts  🥇🎯│
│                                               │
│                 ▼ Tap to view details         │
└───────────────────────────────────────────────┘

Right column (flex-direction: column, align-items: flex-end):
  └── 450 pts
  └── 🥇🎯  (gap: 4px, 5px margin-top from pts)
```

## Visual Layout (Expanded Card — Insignias section)

```
  ...point breakdown rows...

  ─────────────────────────────────
  INSIGNIAS
  🥇 🎯 🏆              (20px, gap: 6px)
```

---

## Testing Strategy

### New unit test files:
- `app/utils/__tests__/badge-calculator.test.ts` — covers all 12 badges with edge cases
- `app/components/leaderboard/__tests__/BadgeRow.test.tsx` — rendering + styling
- `app/db/__tests__/game-guess-repository.badge.test.ts` — getBoostStatsForUsersInTournament mock

### Test utilities (follow MANDATORY patterns):
- Use `renderWithTheme()` from `@/__tests__/utils/test-utils` for component tests
- Use `createMockSelectQuery()` from `@/__tests__/db/mock-helpers` for DB mocks
- Use `testFactories.*` for mock data

### Key test scenarios for badge-calculator.ts (pure function — no framework needed):
- Single user group → only Crack + DeadLast (same person)
- All users with zero exact guesses → no Sharp, no BrokenSight
- All users tied in qualified teams → no WoodenSpoon awarded
- 10-person group → Sharp = top 1 user, BrokenSight = bottom 1 user
- rankChange = 0 for all → no Rocket, no FreeFall

---

## Implementation Tasks (for TaskCreate)

1. **Data pipeline**: Extend `UserScore`, add `getBoostStatsForUsersInTournament`, update `getUserScoresForTournament`
2. **Badge calculator**: Create `badge-calculator.ts` + unit tests
3. **BadgeRow component**: Create `BadgeRow.tsx` + tests
4. **LeaderboardCard integration**: Add badge rendering + tests
5. **LeaderboardCards orchestration**: Compute badges, wire to all children
6. **Share templates**: Update LeaderboardTemplate + HeadToHeadTemplate
7. **HeadToHeadDialog**: Pass + render badges
8. **Page config**: Extract TournamentBadgeConfig in both group pages
9. **i18n**: Add EN + ES badge translations
10. **CODE-STRUCTURE updates**: Update per-task

CODE-STRUCTURE files to update:
- `docs/code-structure/db.md` (Task 1)
- `docs/code-structure/actions.md` (Task 1)
- `docs/code-structure/utils.md` (Task 2)
- `docs/code-structure/components/components-leaderboard-stats.md` (Tasks 3, 4, 5, 6, 7)
- Call graph: YES — Flow 5 modified

---

## Resolved Design Decisions

1. **total_qualifying_slots**: Add a call to `findQualifiedTeams(tournamentId)` in both friend-group pages (a simple `count()` query, already exists in repo). Pass the count as `total_qualifying_slots` in `TournamentBadgeConfig`. If count is 0 (teams not yet set), skip Golden Ticket entirely.
2. **Crystal Ball/Oracle threshold**: Uses `honor_roll_score` as a reliable proxy because the scoring design guarantees `champion_points (5) > runner_up_points + third_place_points (3+1=4)`. Therefore `honor_roll_score >= 5` iff and only if champion was correctly predicted. This assumption must be documented in the badge-calculator source. If `champion_points` is 0 or null → skip both badges.
3. **Boost King condition**: Use `score > 0 AND boost_type IS NOT NULL` in the new query. A boost "scored" means the base prediction (game outcome/score) was correct. `score` (not `final_score`) is the right field since `final_score` already includes the multiplier.
4. **Tied Rocket/FreeFall**: Award to first user by lexicographic userId sort (deterministic tie-break, documented in source).
5. **Tied Boost King**: No award when two or more users share the highest ratio (require unique winner).
6. **H2H badge data flow**: `LeaderboardCards` holds all pre-computed badges (it already manages all leaderboard state). Pass `currentUserBadges: Badge[]` and `opponentBadges: Badge[]` as props to `HeadToHeadDialog` when opening the dialog. No recalculation inside the dialog.
7. **Share card badge overflow**: Cap badges to 6 displayed in share card contexts (LeaderboardTemplate, HeadToHeadTemplate). Use a `maxDisplay` prop on `BadgeRow`. Show positive badges first, negative last.
8. **i18n namespace**: `badges.*` keys go inside the existing `groups.json` namespace (no new namespace registration needed).
9. **Two friend-group pages**: Both pages call `getUserScoresForTournament` independently (no shared helper currently). Badge config extraction is duplicated in both — this is intentional, as the pages have different server components with different tournament sources. Not worth abstracting for now.
10. **Magic number defaults**: The default points (5, 3, 1) match the scoring constants already used in `updateTournamentHonorRoll` in `backoffice-actions.ts`. These are the canonical defaults for this codebase. Acceptable as inline defaults with a comment.
