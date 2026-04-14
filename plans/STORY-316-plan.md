# Story #316 — Tournament Hub Shell & Routing

## Context

The app currently redirects every user from `/` straight to their last tournament. Epic #314 introduces a Tournament Hub as a social "command center" to increase DAU and prediction completion rates. Story #316 is the shell story: create the hub route (feature-flagged), build 3 placeholder widget slots, and update navigation so Friend Groups is more prominent. Stories #317 and #319 will fill the widget slots.

## Objective

Users can navigate to `/` and, when the hub flag is on, see the Tournament Hub shell with three widget placeholders. Friend Groups is repositioned to the top of the tournament sidebar and before Stats in the mobile bottom nav. A user's rank in their primary friend group appears as a badge in the sidebar's Friend Groups header.

## Acceptance Criteria

- `NEXT_PUBLIC_HUB_ENABLED=true` → `/` renders `TournamentHubPage`; flag absent/false → existing `TournamentRedirect` behavior
- Hub page has 3 labeled `Paper` placeholder sections: "Smart Predictor Carousel", "Prediction Dashboard", "Leaderboard Peek"
- Tournament sidebar order: 1. Friend Groups, 2. Group Standings, 3. Stats, 4. Rules
- Mobile bottom nav order: Home, Results, Rules, **Groups** (user), Stats (user)
- Rank badge (user's rank in their primary group) shown in the Friend Groups `CardHeader` in the sidebar
- Hub page renders without errors when user is logged out or has no groups
- No changes to `/tournaments/[id]` page or `/games` page

## Out of Scope

- Actual widget implementations (Smart Predictor Carousel, Prediction Dashboard Widget, Leaderboard Peek)
- Admin toggle for the feature flag
- Removal of the old frontend rank calculation (that is Story #6 in the epic)

---

## Technical Approach

### Feature Flag

Add `isHubEnabled(): boolean` to `app/utils/environment-utils.ts`. Checks `process.env.NEXT_PUBLIC_HUB_ENABLED === 'true'`. `NEXT_PUBLIC_` prefix makes it available client-side too for any future client components.

### Route: Keep `/` — Conditionally Branch in `page.tsx`

`app/[locale]/page.tsx` already handles `EmptyTournamentsState` vs `TournamentRedirect`. We add one more branch: if `isHubEnabled()`, render `TournamentHubPage` instead of `TournamentRedirect`. The server component already fetches `tournaments` and `user` — pass both to `TournamentHubPage`.

### Hub Page Shell

New file: `app/components/hub/tournament-hub-page.tsx`

Server Component ('use server'). Receives `tournaments` and `user` as props (fetched by parent `page.tsx`). Renders a stacked MUI layout with 3 `Paper` sections as widget placeholders. No new data fetching in this component for this story (widget data comes in #317–#319).

### Navigation Reordering

**Sidebar** (`app/components/tournament-page/tournament-sidebar.tsx`): Move Friend Groups block from position 3 to position 1 (before Group Standings). Add `primaryGroupRank?: { rank: number; groupName: string } | null` to `TournamentSidebarProps` and thread it through to `FriendGroupsList`.

**Bottom nav** (`app/components/tournament-bottom-nav/tournament-bottom-nav.tsx`): Swap order of `Groups` and `Stats` `BottomNavigationAction` elements.

### Rank Badge in Sidebar

`FriendGroupsList` (`app/components/tournament-page/friend-groups-list.tsx`) gets a new optional prop `primaryGroupRank?: { rank: number; groupName: string } | null`. When present, render a `<Badge badgeContent={rank} color="secondary">` inside the `CardHeader` title.

Data fetch: in `app/[locale]/tournaments/[id]/layout.tsx`, after `getGroupsForUser()`, derive the primary group (first item in `userGroups`), then call `getGroupRankingForUser(user.id, primaryGroup.id, params.id)`. Pass result to `TournamentSidebar` as new `primaryGroupRank` prop.

**Why sidebar only (not bottom nav or header)**: The story says "nav menu" which in context means the persistent sidebar. Adding rank to the bottom nav's badge would crowd mobile; UserActions is not tournament-specific. The FriendGroupsList card header is the most natural home.

**Prop type derivation**: `getGroupRankingForUser` (already exists in `app/actions/group-ranking-actions.ts`) returns `MaterializedGroupRanking | null` with field `currentRank: number`. The layout derives a simplified `{ rank: number; groupName: string }` object — `rank` from `snapshot.currentRank`, `groupName` from the primary group object — before passing it down. Components receive this simplified type and don't depend on `MaterializedGroupRanking` directly. This keeps component props clean and avoids tight coupling to the ranking action's return type.

---

## Visual Prototype

### Hub Page Shell

```
┌──────────────────────────────────────────────┐
│  Header (logo, theme switcher, user menu)    │
├──────────────────────────────────────────────┤
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  Smart Predictor Carousel              │  │
│  │  [Coming soon — Story #317]            │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  Prediction Dashboard                  │  │
│  │  [Coming soon — Story #318]            │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  Leaderboard Peek                      │  │
│  │  [Coming soon — Story #319]            │  │
│  └────────────────────────────────────────┘  │
│                                              │
└──────────────────────────────────────────────┘
```

### Sidebar — Friend Groups First (with rank badge)

```
┌─────────────────────┐
│ Friend Groups  ④    │  ← Badge shows rank "#4"
│ 2 groups · You are here │
│  > My World Cup Group│
│  > Work Friends      │
│  [View All Groups]   │
├─────────────────────┤
│ Group Standings      │
├─────────────────────┤
│ Stats                │
├─────────────────────┤
│ Rules                │
└─────────────────────┘
```

### Mobile Bottom Nav — Groups before Stats

```
[Home] [Results] [Rules] [Groups④] [Stats]
```

---

## Files to Create

| File | Notes |
|------|-------|
| `app/components/hub/tournament-hub-page.tsx` | Hub shell with 3 placeholder Paper slots |

## Files to Modify

| File | Change |
|------|--------|
| `app/utils/environment-utils.ts` | Add `isHubEnabled()` |
| `app/[locale]/page.tsx` | Branch on `isHubEnabled()` to render hub |
| `app/[locale]/tournaments/[id]/layout.tsx` | Fetch primaryGroupRank, pass to sidebar |
| `app/components/tournament-page/tournament-sidebar.tsx` | Reorder sections, add `primaryGroupRank` prop |
| `app/components/tournament-page/friend-groups-list.tsx` | Add `primaryGroupRank` prop + badge in CardHeader |
| `app/components/tournament-bottom-nav/tournament-bottom-nav.tsx` | Swap Groups/Stats order |
| `locales/en/navigation.json` | Add `hub.title` key |
| `locales/es/navigation.json` | Add `hub.title` key (vos conjugation) |

---

## Mid-Level Design

### Call Graph Changes

**New flow (Hub page):**
- Flow 29: `[locale]/page.tsx` → `isHubEnabled()` → `TournamentHubPage` (props only, no new action calls for this story)

**Modified flow:**
- Flow 3 (Tournament layout): Add `getGroupRankingForUser` call after `getGroupsForUser`, pass `primaryGroupRank` down to `TournamentSidebar → FriendGroupsList`

### `app/utils/environment-utils.ts` *(modified)*

**New functions:**

- **`isHubEnabled()`**: `boolean`
  Returns true when `NEXT_PUBLIC_HUB_ENABLED` env var is set to `'true'`.
  Calls: (none)
  Tests:
  - returns `true` when `NEXT_PUBLIC_HUB_ENABLED` is `'true'`
  - returns `false` when env var is `'false'`
  - returns `false` when env var is `undefined`

### `app/components/hub/tournament-hub-page.tsx` *(new)*

**New components:**

- **`TournamentHubPage({ tournaments, user })`**: `JSX.Element`
  Server Component. Renders the hub shell with three `Paper` placeholder sections for future widgets. Displays a welcome heading if user is logged in.
  Props: `tournaments: ReadonlyArray<{ readonly id: string }>`, `user: User | null`
  Calls: (none — props provided by parent)
  Tests:
  - renders three placeholder sections with correct labels
  - renders without errors when `user` is null (logged-out state)
  - renders without errors when `tournaments` array is empty

### `app/[locale]/page.tsx` *(modified)*

**Changed functions:**

- **`ServerHome({ searchParams })`**: `Promise<JSX.Element>` *(adds hub branch)*
  When `isHubEnabled()` returns true and tournaments exist, renders `TournamentHubPage` instead of `TournamentRedirect`.
  Calls: `isHubEnabled`, `getTournaments`, `getLoggedInUser`, `getOnboardingStatus`
  Tests:
  - renders `TournamentHubPage` when hub flag is enabled and tournaments exist
  - renders `TournamentRedirect` when hub flag is disabled and tournaments exist
  - renders `EmptyTournamentsState` when no tournaments regardless of flag

### `app/[locale]/tournaments/[id]/layout.tsx` *(modified)*

**Changed functions:**

- **`TournamentLayout(props)`**: `Promise<JSX.Element>` *(adds primaryGroupRank fetch)*
  After fetching `prodeGroups`, derives the primary group (first `userGroup`). Calls `getGroupRankingForUser(user.id, primaryGroup.id, tournamentId): Promise<MaterializedGroupRanking | null>` (already exists in `app/actions/group-ranking-actions.ts`). Derives `{ rank: snapshot.currentRank, groupName: primaryGroup.name }` and passes to `TournamentSidebar` as `primaryGroupRank`.
  Calls: `getGroupRankingForUser` (existing in group-ranking-actions.ts), `getGroupsForUser` (existing)
  Tests:
  - passes `{ rank: N, groupName: '...' }` when user has a primary group with a ranking snapshot
  - passes `null` when user has no groups
  - passes `null` when user has groups but `getGroupRankingForUser` returns null (no snapshot yet)

### `app/components/tournament-page/tournament-sidebar.tsx` *(modified)*

**Changed components:**

- **`TournamentSidebar(props)`**: `JSX.Element` *(reorder + new prop)*
  Friend Groups section rendered first. Accepts and threads `primaryGroupRank` to `FriendGroupsList`.
  New prop: `primaryGroupRank?: { rank: number; groupName: string } | null`
  Tests:
  - Friend Groups section renders before Group Standings in the DOM
  - passes `primaryGroupRank` value through to `FriendGroupsList`
  - renders correctly when `primaryGroupRank` is undefined

### `app/components/tournament-page/friend-groups-list.tsx` *(modified)*

**Changed components:**

- **`FriendGroupsList(props)`**: `JSX.Element` *(adds rank badge)*
  New optional `primaryGroupRank` prop. When provided, renders a `<Badge badgeContent={rank}>` inside the `CardHeader` title `Box`.
  New prop: `primaryGroupRank?: { rank: number; groupName: string } | null`
  Tests:
  - renders badge with correct rank number when `primaryGroupRank` is provided
  - does not render badge when `primaryGroupRank` is null
  - does not render badge when `primaryGroupRank` is undefined (backward compat)

### `app/components/tournament-bottom-nav/tournament-bottom-nav.tsx` *(modified)*

**Changed components:**

- **`TournamentBottomNav(props)`**: `JSX.Element` *(reorder only)*
  Groups `BottomNavigationAction` rendered before Stats `BottomNavigationAction`. No new props needed.
  Tests:
  - Groups tab appears at index 3, Stats tab at index 4 in the rendered nav
  - both Groups and Stats tabs are absent when `user` is undefined
  - Groups and Stats tabs render with correct icon and label when `user` is defined

---

## Testing Strategy

**Test utilities (mandatory per project conventions):**
- `renderWithTheme(ui)` — wraps all component tests in MUI theme provider
- `testFactories.tournament()`, `testFactories.user()` — for mock data (never construct raw objects)
- `vi.mock('../../actions/...')` — for isolating Server Action dependencies in component tests

**Test files to create / extend:**
- `app/utils/__tests__/environment-utils.test.ts` — `isHubEnabled()` (3 env var cases)
- `app/components/hub/__tests__/tournament-hub-page.test.tsx` — 3 placeholder sections, logged-out, empty tournaments
- `app/[locale]/__tests__/page.test.tsx` — hub enabled/disabled/no tournaments branches in `ServerHome`
- `app/components/tournament-page/__tests__/friend-groups-list.test.tsx` — rank badge present/null/undefined
- `app/components/tournament-bottom-nav/__tests__/tournament-bottom-nav.test.tsx` — tab order (Groups before Stats), user gating

**Mock pattern for layout tests** (new `getGroupRankingForUser` dependency):
```ts
vi.mock('@/app/actions/group-ranking-actions', () => ({
  getGroupRankingForUser: vi.fn(),
}))
```
Follow the same pattern used by other mocked actions in the existing layout test file.

Existing tests for `TournamentSidebar` and layout must not break.

Coverage target: ≥80% on new/changed code.

---

## Validation Considerations

- SonarCloud: 0 new issues — avoid `any` in new prop types
- No new i18n namespaces needed — `hub.title` goes in existing `navigation.json`
- `NEXT_PUBLIC_HUB_ENABLED` must be added to `.env.example` and Vercel env vars (non-blocking for dev)
- No database migrations required
- Verify feature flag off path (existing redirect) still works after changes
