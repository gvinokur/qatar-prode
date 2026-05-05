# Story 422 — Extract tournament sidebar into a dedicated Server Component with streaming

## Context

**Why:** `TournamentLayout` currently blocks the entire page render until all sidebar data resolves — `getGroupsForUser`, `getGroupStandingsForTournament`, `getGameGuessStatisticsForUsers`, `findTournamentGuessByUserIdTournament`, and per-group `getGroupRankingForUser` calls all run before the header HTML is sent to the browser. Users see nothing until all of it completes, even though the header needs none of it.

**What changes:** Moving those fetches into a dedicated `TournamentSidebarServer` async Server Component and wrapping it in `<Suspense>` lets React stream the header immediately while the sidebar resolves in the background. A skeleton component fills the sidebar slot during load.

Two additional cleanups incorporated from PR feedback:
1. `tournament` is passed as a prop from the layout (already fetched via `getTournamentAndGroupsData`) — avoids a duplicate `findTournamentById` call in the sidebar server component.
2. `getGameGuessStatisticsForUsers` is extended to include tournament-level score fields (`qualified_teams_score`, `group_position_score`, `honor_roll_score`, `individual_awards_score`) — consolidates two `tournament_guesses` reads into one and removes the `tournamentGuess` prop from the sidebar chain.

**Scope:** Tournament layout and sidebar chain only. `awards/page.tsx` and `stats/page.tsx` still call `findTournamentGuessByUserIdTournament` independently — they are unaffected.

---

## Acceptance Criteria
- [ ] Header and navigation render immediately without waiting for sidebar data
- [ ] Sidebar shows skeleton placeholders while its data resolves, then renders all cards correctly
- [ ] All sidebar cards (friend groups, standings, user stats, rules) work for authenticated users
- [ ] Unauthenticated visitors see the correct public sidebar view (standings, rules) after load
- [ ] No regression across all tournament sub-pages (hub, games, stats, results, awards, qualified-teams, rules)
- [ ] Client-side navigation between sub-pages does not re-fetch sidebar data (Router Cache preserved)
- [ ] `UserTournamentStatistics` shows correct Qualified and Awards totals (sourced from extended `GameStatisticForUser`)

---

## Current State Analysis

**`app/[locale]/tournaments/[id]/layout.tsx`** fetches two categories of data:

**Header data (must stay in layout):**
- `getLoggedInUser()` — user display, verification check, bottom nav, dev permission gate
- `getTournamentAndGroupsData(params.id)` — tournament theme colors, name, group tabs for `GroupSelector`; also provides `tournament` object (passed as prop to sidebar server component)
- `getTournaments()` — tournament switcher
- `getTournamentStartDate(params.id)` — JSON-LD structured data
- `checkDevTournamentPermission()` — auth gate (redirect/notFound)

**Sidebar data (move to TournamentSidebarServer):**
- `getGroupsForUser()` — friend groups list
- `getGroupStandingsForTournament(params.id)` — group standings carousel
- `getGameGuessStatisticsForUsers([user.id], params.id)` — user game stats (extended to also include qualified/awards scores)
- `getGroupRankingForUser(userId, groupId, tournamentId)` x N (parallel) — rank per group

**Removed from layout (and sidebar chain):**
- `findTournamentById(params.id)` — layout already has `layoutData.tournament` from `getTournamentAndGroupsData`; switch JSON-LD to `layoutData.tournament?.locations`; pass `layoutData.tournament` as prop to sidebar
- `findTournamentGuessByUserIdTournament(user.id, params.id)` — merged into `getGameGuessStatisticsForUsers`

---

## Technical Approach

### 1. Extend `getGameGuessStatisticsForUsers` + `GameStatisticForUser` type

**Files:** `app/db/game-guess-repository.ts`, `types/definitions.ts`

Add 4 columns to the existing `tournament_guesses` select query (all already on the table):
- `qualified_teams_score`
- `group_position_score`
- `honor_roll_score`
- `individual_awards_score`

Add the same 4 fields (all `number | null`) to `GameStatisticForUser` in `types/definitions.ts`.

### 2. Update `UserTournamentStatistics` (drop `tournamentGuess` prop)

**File:** `app/components/tournament-page/user-tournament-statistics.tsx`

Replace `tournamentGuess?.qualified_teams_score` → `userGameStatistics?.qualified_teams_score`, etc. Remove `tournamentGuess` from props and destructuring. Update existing test file accordingly.

### 3. Update `TournamentSidebar` (remove `tournamentGuess` prop)

**File:** `app/components/tournament-page/tournament-sidebar.tsx`

Remove `tournamentGuess` from interface and stop passing it to `UserTournamentStatistics`. Update existing test file accordingly.

### 4. New: `TournamentSidebarServer` (async Server Component)

**File:** `app/components/tournament-page/tournament-sidebar-server.tsx`

Accepts `tournamentId`, `user`, and `tournament` (already fetched by layout). Fetches remaining sidebar data, renders `TournamentSidebar`. Uses `extractScoringConfig` (moved from layout to `app/utils/tournament-utils.ts`).

```
Suspense boundary in layout
  └── TournamentSidebarServer (async, receives tournament as prop)
        └── TournamentSidebar (existing client component, minus tournamentGuess prop)
              └── UserTournamentStatistics (drops tournamentGuess, uses userGameStatistics for all stats)
```

### 5. New: `TournamentSidebarSkeleton`

**File:** `app/components/skeletons/tournament-sidebar-skeleton.tsx`

Matches the sidebar's Grid slot (size `{ xs: 12, md: 3 }`, hidden on mobile). Renders 4 stacked skeleton cards approximating: friend groups, standings, stats, rules.

Uses `getSkeletonA11yProps` from `app/components/skeletons/skeleton-utils.ts`.

### 6. Modified: `layout.tsx`

- Remove all sidebar data fetching and related imports
- Remove `findTournamentById` import/call; switch JSON-LD to `layoutData.tournament?.locations`
- Pass `layoutData.tournament` to `TournamentSidebarServer`
- Replace `<TournamentSidebar ... />` with:
  ```tsx
  <Suspense fallback={<TournamentSidebarSkeleton />}>
    <TournamentSidebarServer
      tournamentId={params.id}
      user={user ?? undefined}
      tournament={layoutData.tournament}
    />
  </Suspense>
  ```

---

## Visual Prototype — Sidebar Skeleton

```
┌────────────────────────────────────┐
│  display: none on mobile           │
│  (Grid size { xs: 12, md: 3 })     │
├────────────────────────────────────┤
│  ┌──────────────────────────────┐  │
│  │  [████████████] (title bar)  │  │  ← Skeleton card 1: Friend groups
│  │  [████] [████] [████]        │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │  [████████████] (title bar)  │  │  ← Skeleton card 2: Group standings
│  │  [██████████████████████████]│  │
│  │  [██████████████████████████]│  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │  [████████] (title bar)      │  │  ← Skeleton card 3: Stats
│  │  [████] [████]               │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │  [████████] (title bar)      │  │  ← Skeleton card 4: Rules
│  └──────────────────────────────┘  │
└────────────────────────────────────┘
```

Background uses `alpha(theme.palette.primary.main, 0.04)` to match real sidebar.

---

## Files to Create / Modify

| Action | File |
|--------|------|
| Modify | `types/definitions.ts` |
| Modify | `app/db/game-guess-repository.ts` |
| Modify | `app/components/tournament-page/user-tournament-statistics.tsx` |
| Modify | `app/components/tournament-page/user-tournament-statistics.test.tsx` |
| Modify | `app/components/tournament-page/tournament-sidebar.tsx` |
| Modify | `app/components/tournament-page/tournament-sidebar.test.tsx` |
| Modify | `app/[locale]/tournaments/[id]/layout.tsx` |
| Create | `app/utils/tournament-utils.ts` |
| Create | `app/components/tournament-page/tournament-sidebar-server.tsx` |
| Create | `app/components/skeletons/tournament-sidebar-skeleton.tsx` |
| Create | `app/components/tournament-page/tournament-sidebar-server.test.tsx` |
| Modify | `docs/code-structure/pages.md` |
| Modify | `docs/code-structure/components/components-tournament-hub.md` |
| Modify | `docs/code-structure/utils.md` |

---

## Mid-Level Design

### Call Graph Changes

**Modified flows:**
- **Flow: TournamentLayout** — sidebar data fetching extracted; layout now renders header immediately. `TournamentSidebarServer` wrapped in `Suspense` replaces the inline data fetch + `TournamentSidebar`. `tournament` object passed as prop (from `getTournamentAndGroupsData` result already in layout).
- **Flow: UserTournamentStatistics** — no longer receives `tournamentGuess`; reads qualified/awards scores from the extended `userGameStatistics` (type `GameStatisticForUser`).

**New flows:**
- **TournamentSidebarServer** → `getGroupsForUser`, `getGroupStandingsForTournament`, `getGameGuessStatisticsForUsers`, `getGroupRankingForUser` (parallel per group), `extractScoringConfig` → `TournamentSidebar`

---

### `types/definitions.ts` *(modified)*

**Changed types:**

- **GameStatisticForUser**: add 4 optional fields:
  - `qualified_teams_score: number | null`
  - `group_position_score: number | null`
  - `honor_roll_score: number | null`
  - `individual_awards_score: number | null`

---

### `app/db/game-guess-repository.ts` *(modified)*

**Changed functions:**

- **getGameGuessStatisticsForUsers(userIds, tournamentId)**: `Promise<GameStatisticForUser[]>` *(same signature)*
  Add `'qualified_teams_score'`, `'group_position_score'`, `'honor_roll_score'`, `'individual_awards_score'` to the existing `.select([...])` call. All 4 columns exist on `tournament_guesses`.
  Tests:
  - existing tests unchanged
  - new: returned records include qualified_teams_score and honor_roll_score fields

---

### `app/utils/tournament-utils.ts` *(new)*

**New functions:**

- **extractScoringConfig(tournament)**: `ScoringConfig | undefined`
  Pure helper. Extracted from `layout.tsx` (was a local function there). Returns scoring config object from tournament fields, with fallback defaults. No side effects.
  Calls: (none — pure function)
  Tests:
  - returns undefined when tournament is null/undefined
  - returns config with fallback defaults when tournament fields are null
  - returns correct values when tournament has all scoring fields

---

### `app/components/tournament-page/user-tournament-statistics.tsx` *(modified)*

**Changed functions:**

- **UserTournamentStatistics({ userGameStatistics, tournamentId, isActive })**: `JSX.Element` *(removes `tournamentGuess` prop)*
  Replace `tournamentGuess?.qualified_teams_score` → `userGameStatistics?.qualified_teams_score`, `tournamentGuess?.group_position_score` → `userGameStatistics?.group_position_score`, `tournamentGuess?.honor_roll_score` → `userGameStatistics?.honor_roll_score`, `tournamentGuess?.individual_awards_score` → `userGameStatistics?.individual_awards_score`. Remove `TournamentGuess` import.
  Tests (update existing `user-tournament-statistics.test.tsx`):
  - existing: update mock data — remove tournamentGuess, add qualified/awards fields to userGameStatistics
  - qualifiedTotal computed correctly from userGameStatistics.qualified_teams_score + group_position_score
  - awardsTotal computed correctly from userGameStatistics.honor_roll_score + individual_awards_score
  - grandTotal is 0 when userGameStatistics is undefined

---

### `app/components/tournament-page/tournament-sidebar.tsx` *(modified)*

**Changed functions:**

- **TournamentSidebar({ tournamentId, scoringConfig, userGameStatistics, groupStandings, prodeGroups, user, groupRanks })**: `JSX.Element` *(removes `tournamentGuess` prop)*
  Remove `tournamentGuess` from interface and destructuring. Stop passing it to `UserTournamentStatistics`.
  Tests (update existing `tournament-sidebar.test.tsx`):
  - existing tests pass without tournamentGuess in mock props
  - UserTournamentStatistics not rendered when user is undefined (unchanged behavior)

---

### `app/components/tournament-page/tournament-sidebar-server.tsx` *(new)*

**New functions:**

- **TournamentSidebarServer({ tournamentId, user, tournament })**: `Promise<JSX.Element>`
  Async Server Component. `tournament` prop is the already-fetched tournament object from the layout (from `getTournamentAndGroupsData`). For authenticated users: runs `getGroupsForUser`, `getGroupStandingsForTournament`, `getGameGuessStatisticsForUsers` (with extended fields), then fetches per-group ranks in parallel via `Promise.all`. For unauthenticated visitors: only fetches `getGroupStandingsForTournament`. Calls `extractScoringConfig(tournament)` for rules card. Renders `TournamentSidebar`.
  Calls: getGroupsForUser, getGroupStandingsForTournament, getGameGuessStatisticsForUsers, getGroupRankingForUser, extractScoringConfig
  Tests (use `testFactories.user()`, `testFactories.tournament()`, `testFactories.group()` for mock data):
  - renders TournamentSidebar for an authenticated user with all props populated
  - renders TournamentSidebar for an unauthenticated visitor with no user-specific props
  - fetches group ranks in parallel for all groups (userGroups + participantGroups)
  - handles getGroupsForUser returning undefined gracefully (no prodeGroups prop)
  - skips user-specific fetches entirely when user is undefined
  - renders gracefully if tournament is null (scoringConfig is undefined)
  - renders gracefully if getGroupStandingsForTournament returns empty groups array

---

### `app/components/skeletons/tournament-sidebar-skeleton.tsx` *(new)*

**New functions:**

- **TournamentSidebarSkeleton()**: `JSX.Element`
  Skeleton placeholder for the tournament sidebar. Renders in the same Grid slot as the real sidebar (`size={{ xs: 12, md: 3 }}`, `display: { xs: 'none', md: 'flex' }`). Contains 4 stacked skeleton cards with heights approximating friend groups, standings, stats, and rules. Uses `getSkeletonA11yProps('Loading sidebar')` for accessibility.
  Tests:
  - renders with aria role="status" and aria-busy="true"
  - hidden on mobile: Grid size xs is not rendered on narrow viewports
  - renders 4 skeleton card sections

---

### `app/[locale]/tournaments/[id]/layout.tsx` *(modified)*

**Changed functions:**

- **TournamentLayout(props)**: same signature
  Sidebar data fetching removed (imports and calls for `findTournamentById`, `findTournamentGuessByUserIdTournament`, `getGroupsForUser`, `getGroupStandingsForTournament`, `getGameGuessStatisticsForUsers`, `getGroupRankingForUser` all removed). `extractScoringConfig` helper removed (moved to `tournament-utils.ts`). JSON-LD switched to `layoutData.tournament?.locations`. Renders `<Suspense fallback={<TournamentSidebarSkeleton />}><TournamentSidebarServer tournamentId={params.id} user={user ?? undefined} tournament={layoutData.tournament} /></Suspense>`.

---

## Implementation Steps

### Wave 1 — Type + DB changes (foundation for all downstream)
1. Extend `GameStatisticForUser` type in `types/definitions.ts` (add 4 fields)
2. Extend `getGameGuessStatisticsForUsers` select in `app/db/game-guess-repository.ts`

### Wave 2 — Component updates (can run in parallel)
3. Create `app/utils/tournament-utils.ts` with `extractScoringConfig`
4. Update `UserTournamentStatistics` — drop `tournamentGuess` prop, use extended `userGameStatistics` fields; update test file
5. Update `TournamentSidebar` — remove `tournamentGuess` prop; update test file

### Wave 3 — New components
6. Create `app/components/skeletons/tournament-sidebar-skeleton.tsx` + tests
7. Create `app/components/tournament-page/tournament-sidebar-server.tsx` + tests

### Wave 4 — Layout integration
8. Modify `app/[locale]/tournaments/[id]/layout.tsx`

### Wave 5 — Documentation
9. Update `docs/code-structure/pages.md`, `components-tournament-hub.md`, `utils.md`

---

## Testing Strategy

### Unit Tests
- **`game-guess-repository` tests**: verify extended fields appear in returned records
- **`tournament-utils.test.ts`**: verify `extractScoringConfig` behavior (null input, defaults, full data)
- **`user-tournament-statistics.test.tsx`**: update mocks — remove `tournamentGuess`, add extended fields to `userGameStatistics`
- **`tournament-sidebar.test.tsx`**: remove `tournamentGuess` from mock props
- **`tournament-sidebar-server.test.tsx`**: authenticated + unauthenticated scenarios, graceful null handling
- **`tournament-sidebar-skeleton` tests**: accessibility attributes, 4 sections present

### Manual Verification
- Navigate to any tournament sub-page: header renders immediately, skeleton appears, then real sidebar
- Test as unauthenticated user: standings and rules visible, no user stats
- Navigate between sub-pages (hub → games → stats): no sidebar re-fetch (Router Cache)
- Visit stats page: confirm Qualified and Awards totals still show correct values (from extended `getGameGuessStatisticsForUsers`)
- Test all 7 sub-pages: hub, games, stats, results, awards, qualified-teams, rules

---

## Validation Considerations

- SonarCloud: No new issues; coverage ≥80% on new files
- No new translation keys needed
- No DB migration needed — only changes query column selection from existing table
- `extractScoringConfig` move: pure function, easy to extract and test in isolation
- Router Cache (30s default): sidebar Suspense segment cached on client navigation

---

## Notes

- `'use server'` directive on `layout.tsx` remains correct — Suspense is valid in Server Components
- `findTournamentGuessByUserIdTournament` is still used by `awards/page.tsx` and `stats/page.tsx` for different purposes — those files are untouched
- `testFactories.*` must be used in new server component test (per project patterns)
