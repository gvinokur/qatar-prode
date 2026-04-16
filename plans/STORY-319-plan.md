# Story #319 — Leaderboard Peek Widget

## Context
The Tournament Hub (`/[locale]/tournaments/[id]/hub`) currently has a placeholder `<Paper>` for the "Leaderboard Peek" widget. This story replaces that placeholder with a real "Ego Section" — a compact social snapshot showing the current user's competitive standing across their top 3 friend groups, pulling from the materialized `group_rankings` table built in Story #315.

## Goal
Build the Leaderboard Peek Widget: shows the user's rank in up to 3 friend groups, a 3-row neighbor mini-table per group (person above, user, person below), and a momentum indicator (rank change from last snapshot). Tapping a group card navigates to the full group leaderboard.

## Acceptance Criteria (from issue)
- Displays user's rank in top 3 friend groups (ordered by member count in latest ranking snapshot)
- Per group: 3-row mini-table (above, user, below) with edge case handling:
  - Rank #1 → show top 3
  - Last rank → show last 3
- Momentum indicator per group: `↑ N`, `↓ N`, or `→ No change`
- Tapping a group card navigates to full group leaderboard
- Data from `group_rankings` materialized table
- Handles <3 groups gracefully; handles groups with no ranking data

## Dependencies (confirmed done)
- Story #315 (Rank Materialization Backend): ✅ migration + repo + actions exist
- Story #316 (Tournament Hub Shell): ✅ hub page exists at `app/[locale]/tournaments/[id]/hub/page.tsx`

---

## Technical Approach

### Data Flow
```
TournamentHubPage (Server)
  └── TournamentHubLeaderboardPeek (Server Component)
        └── getLeaderboardPeekData(tournamentId, locale) [Server Action]
              ├── getLoggedInUser()
              ├── findProdeGroupsByOwner(userId) + findProdeGroupsByParticipant(userId)
              └── per group: getLatestRankingsForGroup(groupId, tournamentId)
                            + getLatestTwoGroupRankingSnapshots(userId, groupId, tournamentId)
              └── returns GroupPeekData[]
        └── LeaderboardPeekCard (Client Component, per group)
              └── reuses: RankChangeIndicator from leaderboard/
```

### Group Ordering
Sort all user groups by count of ranked members in the latest snapshot (descending). Groups with no ranking data sort last. Take top 3.

### 3-row Window Logic (server-side, in action)
- Normal: rows at rank-1, rank, rank+1
- Rank = 1: rows at ranks 1, 2, 3
- Rank = last (N): rows at ranks N-2, N-1, N (clamped to available)
- Fewer than 3 total members: show all

### Rank Change
Reuse `getLatestTwoGroupRankingSnapshots(userId, groupId, tournamentId)` which returns the latest 2 snapshots per user. Rank change = `previousRank - currentRank` (positive = moved up).

---

## Files to Create/Modify

### 1. `app/db/group-ranking-repository.ts` *(modified)*
Add `getLatestRankingsForGroup(groupId, tournamentId)` — fetches all users' latest-snapshot ranks with their names (JOIN users), ordered by rank.

### 2. `app/actions/hub-actions.ts` *(modified)*
Add `getLeaderboardPeekData(tournamentId, locale)` — orchestrates the data fetch: gets user groups, fetches rankings, sorts, builds 3-row windows.

### 3. `app/components/tournament-hub/tournament-hub-leaderboard-peek.tsx` *(new)*
Server component. Calls `getLeaderboardPeekData`, renders `LeaderboardPeekCard` per group or empty state. Returns `null` if user is not logged in.

### 4. `app/components/tournament-hub/leaderboard-peek-card.tsx` *(new)*
Client component. Renders a single group's mini-card: group name, user rank with `RankChangeIndicator` reused from `app/components/leaderboard/RankChangeIndicator`, 3-row table, tappable to navigate to group leaderboard.

### 5. `app/[locale]/tournaments/[id]/hub/page.tsx` *(modified)*
Remove `leaderboardPeek` from the `placeholders` array. Add `<TournamentHubLeaderboardPeek tournamentId={id} locale={locale} />` in place of the placeholder Paper.

### 6. i18n namespace files *(modified if needed)*
Add keys to `hub` namespace: `you` ("You"), `noRankingData` ("Rankings coming soon"). Verify existing keys cover other strings.

### 7. `app/components/tournament-hub/__tests__/leaderboard-peek-card.test.tsx` *(new)*
Unit tests for `LeaderboardPeekCard` and the 3-row window logic.

---

## Mid-Level Design

### Call Graph Changes

**Modified flows:**
- **Tournament Hub Shell flow** — `TournamentHubPage` now renders `TournamentHubLeaderboardPeek` instead of `leaderboardPeek` placeholder Paper. `TournamentHubLeaderboardPeek` calls `getLeaderboardPeekData` → `getLatestRankingsForGroup` (×N groups) + `getLatestTwoGroupRankingSnapshots` (×N groups).

**New flows:**
- **Flow: Leaderboard Peek** — `TournamentHubPage` → `TournamentHubLeaderboardPeek` → `getLeaderboardPeekData` → `findProdeGroupsByOwner` + `findProdeGroupsByParticipant` + `getLatestRankingsForGroup` + `getLatestTwoGroupRankingSnapshots`

---

### `app/db/group-ranking-repository.ts` *(modified)*

**New functions:**

- **getLatestRankingsForGroup(groupId: string, tournamentId: string)**: `Promise<{ userId: string; userName: string; rank: number; score: number }[]>`
  Two-step query: 1) get max snapshot_date for group+tournament, 2) JOIN group_rankings with users table at that date ordered by rank asc. Returns empty array if no snapshots.
  Tests:
  - returns empty array when no snapshots exist for the group
  - returns all users ordered by rank ascending at the latest snapshot date
  - returns correct user names via JOIN with users table
  - ignores older snapshots when newer one exists

---

### `app/actions/hub-actions.ts` *(modified)*

**New types (exported):**
```typescript
export interface RankNeighborEntry {
  userId: string
  userName: string
  rank: number
  score: number
  isCurrentUser: boolean
}

export interface GroupPeekData {
  groupId: string
  groupName: string
  totalMembers: number
  userRank: number
  rankChange: number | null
  rows: RankNeighborEntry[]
}
```

**New functions:**

- **getLeaderboardPeekData(tournamentId: string, locale: Locale)**: `Promise<GroupPeekData[]>`
  Server Action. Gets current user; fetches owned + participant groups; for each group calls `getLatestRankingsForGroup` (concurrent); sorts groups by member count desc; takes top 3; for each: calls `getLatestTwoGroupRankingSnapshots` for rank change, builds 3-row window around user. Returns empty array if no user or no groups.
  Calls: getLoggedInUser, findProdeGroupsByOwner, findProdeGroupsByParticipant, getLatestRankingsForGroup, getLatestTwoGroupRankingSnapshots
  Tests:
  - returns empty array when user is not authenticated
  - returns empty array when user has no groups
  - returns up to 3 groups sorted by member count descending
  - filters out groups where user has no ranking entry (not yet played)
  - builds correct 3-row window when user is rank 1 (shows top 3)
  - builds correct 3-row window when user is last rank (shows last 3)
  - builds correct 3-row window for middle ranks (shows above/user/below)
  - sets rankChange to null when only one snapshot exists
  - returns positive rankChange when user moved up in rank

---

### `app/components/tournament-hub/tournament-hub-leaderboard-peek.tsx` *(new)*

**New functions:**

- **TournamentHubLeaderboardPeek(props: { tournamentId: string; locale: Locale })**: `JSX.Element | null`
  Async Server Component. Calls `getLeaderboardPeekData`; if empty renders empty state UI (no null, to always show section title); renders section title + `LeaderboardPeekCard` list. Returns `null` only if user is unauthenticated (action returns null for unauthenticated).
  Calls: getLeaderboardPeekData
  Tests:
  - renders empty state when no groups have ranking data
  - renders one LeaderboardPeekCard per GroupPeekData entry
  - passes correct props to each LeaderboardPeekCard

---

### `app/components/tournament-hub/leaderboard-peek-card.tsx` *(new)*

**New functions:**

- **LeaderboardPeekCard(props: { data: GroupPeekData; groupLeaderboardHref: string; locale: Locale })**: `JSX.Element`
  Client Component. Renders a tappable MUI Card with: group name header, user's rank + `RankChangeIndicator`, 3-row mini-table (each row: rank number, name, score; current user row highlighted with theme background color). Navigates to `groupLeaderboardHref` on click via `useRouter`.
  Calls: RankChangeIndicator (reused from leaderboard/)
  Tests:
  - renders group name in card header
  - highlights current user row distinctly
  - renders RankChangeIndicator with correct change value
  - navigates to groupLeaderboardHref when card is clicked
  - renders "No change" indicator when rankChange is null

---

## Visual Prototype

### Mobile Layout (primary)

```
┌─────────────────────────────────────────┐
│  Your Standings                         │  ← section title (t('leaderboardPeek'))
├─────────────────────────────────────────┤
│  ┌───────────────────────────────────┐  │
│  │ 👥 Group Alpha        #4 ↑ 2     │  │  ← group name + rank + RankChangeIndicator
│  │ ──────────────────────────────── │  │
│  │   3  Carlos          892 pts     │  │  ← row above
│  │ ▶ 4  You             800 pts     │  │  ← current user (highlighted bg)
│  │   5  Maria           750 pts     │  │  ← row below
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │ 👥 Los Amigos         #1 →       │  │
│  │ ──────────────────────────────── │  │
│  │ ▶ 1  You            1050 pts     │  │  ← rank 1: show top 3
│  │   2  Diego           980 pts     │  │
│  │   3  Lucia           900 pts     │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │ 👥 Familia           #7 ↓ 1     │  │
│  │ ──────────────────────────────── │  │
│  │   6  Abuela          620 pts     │  │
│  │ ▶ 7  You             600 pts     │  │
│  │   8  Tío Pedro       580 pts     │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**Empty state** (no groups or no data):
```
┌─────────────────────────────────────────┐
│  Your Standings                         │
├─────────────────────────────────────────┤
│   Rankings will appear once the         │
│   tournament is underway.               │
└─────────────────────────────────────────┘
```

**MUI Components:**
- `Card` / `CardActionArea` — tappable group card
- `Typography` — group name, rank, scores
- `Box` / `Stack` — layout
- `Divider` — between header and rows
- `RankChangeIndicator` (reused from `leaderboard/`) — momentum chip

---

## Hub Page Change

```typescript
// Before (hub/page.tsx):
const placeholders = [t('predictionDashboard'), t('leaderboardPeek')]
// ... renders both as Paper placeholders

// After:
return (
  <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
    <TournamentHubActionCenter tournamentId={id} locale={locale} />
    <Paper sx={{ p: 4, textAlign: 'center' }}>
      <Typography variant="h6" color="text.secondary">{t('predictionDashboard')}</Typography>
    </Paper>
    <TournamentHubLeaderboardPeek tournamentId={id} locale={locale} />
  </Box>
)
```

---

## Route for Group Leaderboard Navigation
Verify during implementation: grep for group leaderboard page route in `docs/code-structure/pages.md`. Most likely: `/[locale]/groups/[groupId]` or `/[locale]/tournaments/[id]?group=[groupId]`. The `href` is computed in the Server Component and passed down to `LeaderboardPeekCard`.

---

## i18n Keys (hub namespace)
Verify these keys exist, add if missing:
- `leaderboardPeek` — "Your Standings" / "Tu posición" (already exists as placeholder title)
- `you` — "You" / "Tú" (current user row marker)
- `noRankingData` — "Rankings will appear once the tournament is underway." / "..."

---

## Testing Strategy
- **Unit tests** for `getLatestRankingsForGroup` (mock db, test JOIN behavior + empty case)
- **Unit tests** for `getLeaderboardPeekData` (mock repo fns: auth, groups, rankings; test all 3-row window edge cases + group sorting)
- **Unit tests** for `LeaderboardPeekCard` (renderWithTheme: highlights current user, rank change chip, navigation click)
- **Coverage target:** ≥80% on new code
- Run: `npm run test` + `npm run lint` + `npm run build` before commit

---

## CODE-STRUCTURE Files to Update
- `docs/code-structure/db.md` — add `getLatestRankingsForGroup` to group-ranking-repository section
- `docs/code-structure/actions.md` — add `getLeaderboardPeekData` + exported types to hub-actions section
- `docs/code-structure/components/components-tournament-hub.md` — add `TournamentHubLeaderboardPeek` and `LeaderboardPeekCard`
- `docs/code-structure/pages.md` — update hub page entry (no longer renders placeholder Paper for leaderboardPeek)
- `CODE-STRUCTURE.md` call graph — add new Leaderboard Peek flow
