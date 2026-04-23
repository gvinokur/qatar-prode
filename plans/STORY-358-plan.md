# Story #358: Dashboard: Dynamic Friend Group Widgets

## Context

The Tournament Hub dashboard has two static placeholder DashboardCards — "Standings" and "Groups" — both showing Lorem ipsum content. A `TournamentHubLeaderboardPeek` component already exists and fully implements the data fetching and rendering logic for up to 3 friend group leaderboard peek cards, but it is **not wired into the hub page**.

The story activates the "Groups" slot by integrating `TournamentHubLeaderboardPeek` into the hub page with a key structural change: instead of wrapping all groups inside a single widget container, each active group gets its **own separate card** in the dashboard CSS Grid. Edge states (no groups, pre-tournament) still render as a single consolidated card.

## Files to Create/Modify

| File | Action |
|------|--------|
| `app/[locale]/tournaments/[id]/page.tsx` | Remove "Groups" placeholder; add `TournamentHubLeaderboardPeek` in Suspense |
| `app/components/tournament-hub/tournament-hub-leaderboard-peek.tsx` | Refactor: remove Box wrapper + shared header; return Fragment for active groups |
| `app/components/tournament-hub/leaderboard-peek-card.tsx` | Style update: add `variant="outlined"` + `height: '100%'` for grid consistency |
| `app/components/tournament-hub/__tests__/tournament-hub-leaderboard-peek.test.tsx` | New: unit tests for 3 branches |
| `app/components/tournament-hub/__tests__/leaderboard-peek-card.test.tsx` | New or updated: rendering + click tests |

**No changes to:**
- `app/actions/hub-actions.ts` — data fetching stays as-is
- `app/components/tournament-hub/social-hub-card.tsx`
- `app/components/tournament-hub/pre-tournament-groups-preview.tsx`
- `app/components/tournament-hub/dashboard-card.tsx`

## Visual Prototype

**Active state — 3 groups (each its own grid cell):**
```
┌──────────────────┬──────────────────┬──────────────────┬────────────────────┐
│ 🎮 Games         │ 🏆 Standings     │ 👥 Filial WA     │ 👥 El Grupo Vino   │
│ [Prediction]     │ [placeholder]    │ #1 ↑1            │ #4 →               │
│                  │                  │ ────────────────  │ ──────────────── │
│                  │                  │ 1. Vos  42pts    │ 3. Gabriel 38pts   │
│                  │                  │ 2. Gabi 38pts    │ 4. Vos    35pts    │
│                  │                  │ 3. Lio  35pts    │ 5. Lio    30pts    │
└──────────────────┴──────────────────┴──────────────────┴────────────────────┘
  (grid auto-fits: narrow screen stacks all cards vertically)
```

**Empty state (no groups) — single card:**
```
┌──────────────────┬──────────────────┬──────────────────┐
│ 🎮 Games         │ 🏆 Standings     │ 👥 Grupos        │
│ [Prediction]     │ [placeholder]    │ [SocialHubCard]  │
│                  │                  │ ¡No juegues solo!│
│                  │                  │ [Crear] [Unirse] │
└──────────────────┴──────────────────┴──────────────────┘
```

**Pre-tournament state — single card:**
```
┌──────────────────┬──────────────────┬──────────────────┐
│ 🎮 Games         │ 🏆 Standings     │ 🏆 Tus Grupos    │
│ [Prediction]     │ [placeholder]    │ [Group chips]    │
│                  │                  │ Rankings pending │
│                  │                  │ [Ver grupos]     │
└──────────────────┴──────────────────┴──────────────────┘
```

## Technical Approach

### Hub Page (`page.tsx`)

Remove:
```tsx
<DashboardCard title="Groups" icon={<GroupsIcon />} count="2 groups">
  <Typography ...>Lorem ipsum...</Typography>
</DashboardCard>
```

Add (in the same grid Box, after the Standings card):
```tsx
<Suspense fallback={<DashboardCard title="Groups" icon={<GroupsIcon />} />}>
  <TournamentHubLeaderboardPeek tournamentId={id} locale={locale} />
</Suspense>
```

The Suspense wraps the component as a whole. When resolved, if it returns a Fragment with 3 group cards, all 3 appear as separate grid cells (React Fragment doesn't add DOM nodes, so children flow directly into the parent CSS Grid). If it returns a single DashboardCard (empty/pre-tournament), one cell appears.

Keep the "Standings" DashboardCard placeholder unchanged (different story scope).

### `TournamentHubLeaderboardPeek` refactor

**Before:** Single `<Box>` wrapper with shared header → all branches inside.

**After:**
- Branch 1 (`!userHasGroups`): Return `<DashboardCard title={t('groups')} icon={<GroupsIcon />}><SocialHubCard .../></DashboardCard>`
- Branch 2 (`userHasGroups && groups.length === 0`): Return `<DashboardCard title={t('yourStandings')} icon={<GroupsIcon />}><PreTournamentGroupsPreview .../></DashboardCard>`
- Branch 3 (`groups.length > 0`): Return `<>{groups.map(g => <LeaderboardPeekCard key={g.groupId} ... />)}</>`

Remove the "See all groups" link (navigation is via card click, which is already in LeaderboardPeekCard's CardActionArea).

### `LeaderboardPeekCard` style update

Change Card root from:
```tsx
<Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
```
To:
```tsx
<Card variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', height: '100%' }}>
```

This ensures visual consistency with other DashboardCard-style widgets in the grid (outlined border, full height for alignment).

## Mid-Level Design

### Call Graph Changes

**Flow 32 (Leaderboard Peek data flow)** — updated:
- `TournamentHubPage` (hub page) now renders `TournamentHubLeaderboardPeek` directly inside the widget grid (it was previously unused in the hub page)
- `TournamentHubLeaderboardPeek` no longer wraps in a Box; returns Fragment (active) or DashboardCard (empty/pre-tournament)

### `app/components/tournament-hub/tournament-hub-leaderboard-peek.tsx` *(modified)*

**Changed functions:**

- **`TournamentHubLeaderboardPeek({ tournamentId, locale }): JSX.Element`** *(removes Box wrapper, shared header, and "See all groups" link; returns Fragment for active state, single DashboardCard for edge states)*
  Calls: `getLeaderboardPeekData`, `getTranslations`
  Tests:
  - renders a DashboardCard containing SocialHubCard when `userHasGroups` is false
  - renders a DashboardCard containing PreTournamentGroupsPreview when `userHasGroups` is true and `groups` is empty
  - renders one LeaderboardPeekCard per group (not wrapped in a Box) when `groups` has items
  - does NOT render a shared "Your Standings" header Typography in the active state
  - renders exactly 3 LeaderboardPeekCard components when `groups` has 3 items

### `app/components/tournament-hub/leaderboard-peek-card.tsx` *(modified)*

**Changed functions:**

- **`LeaderboardPeekCard({ data, groupLeaderboardHref }): JSX.Element`** *(style update: adds `variant="outlined"` and `height: "100%"` to Card)*
  Tests:
  - renders `data.groupName` in the card header
  - renders `#${data.userRank}` rank label
  - renders exactly `data.rows.length` LeaderboardCard rows
  - applies `height: 100%` style on the root Card
  - calls `router.push(groupLeaderboardHref)` when CardActionArea is clicked
  - renders zero LeaderboardCard rows when `data.rows` is an empty array

### `app/[locale]/tournaments/[id]/page.tsx` *(modified)*

No new exported functions — JSX-only changes (remove Groups DashboardCard, add TournamentHubLeaderboardPeek in Suspense).

### Test Utilities

- Mock `getLeaderboardPeekData` with `vi.mock('../../actions/hub-actions')` returning `LeaderboardPeekResult` shaped data
- Build test data inline using the `GroupPeekData` and `RankNeighborEntry` types (no factory exists yet for this domain — create test fixtures inline)
- Mock `getTranslations` to return a simple `(key: string) => key` passthrough
- Mock `useRouter` from `next/navigation` for click navigation tests
- Wrap Client Component tests with `renderWithTheme` from project test utilities

## Implementation Waves

**Wave 1 — Component changes (parallel):**
- Task A: Update `leaderboard-peek-card.tsx` (add `variant="outlined"`, `height: '100%'`)
- Task B: Refactor `tournament-hub-leaderboard-peek.tsx` (remove wrapper, branch to Fragment/DashboardCard)

**Wave 2 — Integration:**
- Task C: Update `page.tsx` (remove placeholder, add TournamentHubLeaderboardPeek in Suspense) — depends on Task B being complete

**Wave 3 — Tests (parallel):**
- Task D: Write tests for `tournament-hub-leaderboard-peek.tsx`
- Task E: Write/update tests for `leaderboard-peek-card.tsx`

## Validation

- `npm run test` — ≥ 80% coverage on changed files
- `npm run lint` — no ESLint errors
- `npm run build` — no TypeScript errors
- Visual check in Vercel Preview: verify 3 states (active groups / pre-tournament / no groups)

## CODE-STRUCTURE Files to Update

- `docs/code-structure/components/components-tournament-hub.md` — update `TournamentHubLeaderboardPeek` entry (returns Fragment for active, single DashboardCard for edge states; integrated into hub page)
- `docs/code-structure/components/components-tournament-hub.md` — update `LeaderboardPeekCard` entry (add `variant="outlined"`, `height: "100%"`)
- `CODE-STRUCTURE.md` — update Flow 32 to show `TournamentHubPage` → `TournamentHubLeaderboardPeek` connection

## Worktree

New worktree needed: `/Users/gvinokur/Personal/qatar-prode-story-358`  
Branch: `feature/story-358`

Run before implementation:
```bash
./scripts/github-projects-helper story start 358 --project 1
```
