# Story #316 — Tournament Hub Shell & Routing

## Context

The app currently redirects every user from `/` straight to their last tournament's games page. Epic #314 introduces a Tournament Hub as a social "command center" to increase DAU and prediction completion rates. Story #316 is the shell story: create the hub as a proper sub-page inside the tournament context (`/tournaments/[id]/hub`), add it to tournament navigation, and change `TournamentRedirect` to land users there when the feature flag is on. Stories #317 and #319 will fill the widget slots.

## Objective

Users land on the Tournament Hub (`/tournaments/[id]/hub`) when `NEXT_PUBLIC_HUB_ENABLED=true`, and on the existing games page otherwise. The hub has three widget placeholder slots and is accessible from the tournament top nav and bottom nav. Friend Groups is repositioned first in the sidebar and before Stats in the mobile bottom nav. A user's rank in their primary group appears as a badge in the sidebar's Friend Groups header.

## Acceptance Criteria

- `NEXT_PUBLIC_HUB_ENABLED=true` → `TournamentRedirect` sends users to `/tournaments/[id]/hub`; flag absent/false → existing `/tournaments/[id]` behavior
- Hub page at `/tournaments/[id]/hub` has 3 labeled `Paper` placeholder sections: "Smart Predictor Carousel", "Prediction Dashboard", "Leaderboard Peek"
- Hub appears as a nav item **before** Matches in the tournament top nav (conditional on flag)
- Mobile bottom nav "Home" tab points to `/tournaments/[id]/hub` when flag is on, `/[locale]` otherwise
- Tournament sidebar order: 1. Friend Groups, 2. Group Standings, 3. Stats, 4. Rules
- Mobile bottom nav order: Home (or Hub), Results, Rules, **Groups** (user), Stats (user)
- Rank badge (user's rank in their primary group) shown in the Friend Groups `CardHeader` in the sidebar
- Hub page renders without errors when user is logged out or has no groups
- `app/[locale]/page.tsx` is **untouched** — no changes to the root page
- No changes to the games page at `/tournaments/[id]`

## Out of Scope

- Actual widget implementations (Smart Predictor Carousel, Prediction Dashboard, Leaderboard Peek)
- Admin toggle for the feature flag
- Renaming `/hub` → `/` and `/` → `/games` (future story)
- Removal of the old frontend rank calculation (future story)

---

## Technical Approach

### Feature Flag

Add `isHubEnabled(): boolean` to `app/utils/environment-utils.ts`. Checks `process.env.NEXT_PUBLIC_HUB_ENABLED === 'true'`. `NEXT_PUBLIC_` prefix makes it readable client-side for the bottom nav component.

### Route: New sub-page inside tournament context

New file: `app/[locale]/tournaments/[id]/hub/page.tsx`

Server Component. Receives tournament and user data available from the parent tournament layout (already fetched). Renders 3 `Paper` placeholder sections. No new data fetching for this story — widget data arrives in #317–#319.

**Why this is better than modifying root `/`:**
- Hub inherits the full tournament layout (sidebar, bottom nav, tournament AppBar) for free
- `TournamentRedirect` becomes the single toggle point — one change instead of branching root
- Future rename story (`/hub` → `/`, `/` → `/games`) is a clean route swap with no logic changes

### TournamentRedirect: Single toggle point

`app/components/home/tournament-redirect.tsx` — add `isHubEnabled()` check. When true, redirect to `/[locale]/tournaments/[id]/hub`; otherwise keep current `/[locale]/tournaments/[id]` redirect. This is the **only** change needed to make hub the default landing experience.

### Tournament Top Nav: Add Hub item

The tournament top nav component (renders MATCHES | QUALIFIED TEAMS | AWARDS links — identify exact file during implementation by searching for `topNav.matches` translation key usage) gets a new "HUB" item prepended, conditional on `isHubEnabled()`. Hub tab links to `/[locale]/tournaments/[id]/hub`.

### Navigation Reordering

**Sidebar** (`app/components/tournament-page/tournament-sidebar.tsx`): Move Friend Groups block from position 3 to position 1. Add `primaryGroupRank?: { rank: number; groupName: string } | null` prop threaded through to `FriendGroupsList`.

**Bottom nav** (`app/components/tournament-bottom-nav/tournament-bottom-nav.tsx`):
- Swap order of Groups and Stats tabs (Groups before Stats)
- When `isHubEnabled()`: "Home" tab navigates to `/[locale]/tournaments/${tournamentId}/hub` instead of `/[locale]`
- `isHubEnabled()` is `NEXT_PUBLIC_` so it's safe to call in this client component

### Rank Badge in Sidebar

`FriendGroupsList` (`app/components/tournament-page/friend-groups-list.tsx`) gets a new optional prop `primaryGroupRank?: { rank: number; groupName: string } | null`. When present, renders a `<Badge badgeContent={rank} color="secondary">` inside the `CardHeader` title `Box`.

Data fetch: in `app/[locale]/tournaments/[id]/layout.tsx`, after `getGroupsForUser()`, derive the primary group (first item in `userGroups`), call `getGroupRankingForUser(user.id, primaryGroup.id, params.id)` (exists in `app/actions/group-ranking-actions.ts`, returns `MaterializedGroupRanking | null`). Derive `{ rank: snapshot.currentRank, groupName: primaryGroup.name }` and pass to `TournamentSidebar` as `primaryGroupRank`.

**Prop type note**: Components receive the simplified `{ rank: number; groupName: string }` derived in the layout — not the full `MaterializedGroupRanking` — keeping component props clean and decoupled from the ranking action's return type.

---

## Visual Prototype

### Hub Page (inside tournament layout)

```
┌─────────────────────────────────────────────────────────┐
│  [Logo] FIFA 2026        [Theme] [Lang] [User]          │  ← tournament AppBar
├─────────────────────────────────────────────────────────┤
│  [HUB] MATCHES  QUALIFIED TEAMS  AWARDS                 │  ← top nav (Hub first)
├──────────────────────────────┬──────────────────────────┤
│                              │  Friend Groups  ④        │
│  ┌──────────────────────┐    │  ─────────────────────   │
│  │  Smart Predictor     │    │  Group Standings          │
│  │  Carousel            │    │  ─────────────────────   │
│  │  [Coming — #317]     │    │  Stats                   │
│  └──────────────────────┘    │  ─────────────────────   │
│                              │  Rules                   │
│  ┌──────────────────────┐    │                          │
│  │  Prediction Dashboard│    │                          │
│  │  [Coming — #318]     │    │                          │
│  └──────────────────────┘    │                          │
│                              │                          │
│  ┌──────────────────────┐    │                          │
│  │  Leaderboard Peek    │    │                          │
│  │  [Coming — #319]     │    │                          │
│  └──────────────────────┘    │                          │
├──────────────────────────────┴──────────────────────────┤
│  [Hub/Home] [Results] [Rules] [Groups④] [Stats]         │  ← bottom nav (mobile)
└─────────────────────────────────────────────────────────┘
```

### Bottom Nav — Home tab behavior

```
Flag OFF:  [Home→/]  [Results] [Rules] [Groups④] [Stats]
Flag ON:   [Hub→/hub] [Results] [Rules] [Groups④] [Stats]
```

---

## Files to Create

| File | Notes |
|------|-------|
| `app/[locale]/tournaments/[id]/hub/page.tsx` | Hub page with 3 placeholder Paper slots |

## Files to Modify

| File | Change |
|------|--------|
| `app/utils/environment-utils.ts` | Add `isHubEnabled()` |
| `app/components/home/tournament-redirect.tsx` | Check `isHubEnabled()`, redirect to `/hub` or `/` |
| `app/[locale]/tournaments/[id]/layout.tsx` | Fetch primaryGroupRank, pass to sidebar |
| `app/components/tournament-page/tournament-sidebar.tsx` | Reorder sections, add `primaryGroupRank` prop |
| `app/components/tournament-page/friend-groups-list.tsx` | Add `primaryGroupRank` prop + badge in CardHeader |
| `app/components/tournament-bottom-nav/tournament-bottom-nav.tsx` | Swap Groups/Stats order; hub-aware Home tab |
| Tournament top nav component | Add Hub item before Matches (find file via `topNav.matches` usage) |
| `locales/en/navigation.json` | Add `topNav.hub` key |
| `locales/es/navigation.json` | Add `topNav.hub` key (Argentine Spanish) |

---

## Mid-Level Design

### Call Graph Changes

**Modified flow:**
- Flow 1 (Predictions dashboard / home redirect): `TournamentRedirect` now branches on `isHubEnabled()` — redirects to `/tournaments/[id]/hub` or `/tournaments/[id]`
- Flow 3 (Tournament layout): Add `getGroupRankingForUser` call after `getGroupsForUser`, pass `primaryGroupRank` down to `TournamentSidebar → FriendGroupsList`

**New flow:**
- Flow 29: `[locale]/tournaments/[id]/hub/page.tsx` renders as a static shell (no new action calls for this story — widget data in future stories)

### `app/utils/environment-utils.ts` *(modified)*

**New functions:**

- **`isHubEnabled()`**: `boolean`
  Returns true when `NEXT_PUBLIC_HUB_ENABLED` env var is set to `'true'`.
  Calls: (none)
  Tests:
  - returns `true` when `NEXT_PUBLIC_HUB_ENABLED` is `'true'`
  - returns `false` when env var is `'false'`
  - returns `false` when env var is `undefined`

### `app/[locale]/tournaments/[id]/hub/page.tsx` *(new)*

**New components:**

- **`TournamentHubPage()`**: `JSX.Element`
  Server Component. Renders the hub shell with three `Paper` placeholder sections labeled for future widgets. Uses `getTranslations` for i18n labels.
  Calls: (none — data from parent layout in future stories)
  Tests:
  - renders three placeholder sections with correct translated labels
  - renders without errors for a logged-out user (no user-specific content yet)
  - page is accessible at the correct route path

### `app/components/home/tournament-redirect.tsx` *(modified)*

**Changed components:**

- **`TournamentRedirect({ tournaments })`**: `JSX.Element` *(adds hub redirect branch)*
  When `isHubEnabled()` returns true, redirects to `/[locale]/tournaments/[id]/hub`; otherwise keeps current `/[locale]/tournaments/[id]` behavior.
  Calls: `isHubEnabled` (new)
  Tests:
  - redirects to `/tournaments/[id]/hub` when hub flag is enabled
  - redirects to `/tournaments/[id]` when hub flag is disabled
  - redirects to first tournament when no last-selected tournament is stored

### `app/[locale]/tournaments/[id]/layout.tsx` *(modified)*

**Changed functions:**

- **`TournamentLayout(props)`**: `Promise<JSX.Element>` *(adds primaryGroupRank fetch)*
  After fetching `prodeGroups`, derives the primary group (first `userGroup`). Calls `getGroupRankingForUser(user.id, primaryGroup.id, tournamentId): Promise<MaterializedGroupRanking | null>` (exists in `app/actions/group-ranking-actions.ts`). Derives `{ rank: snapshot.currentRank, groupName: primaryGroup.name }` and passes to `TournamentSidebar` as `primaryGroupRank`.
  Calls: `getGroupRankingForUser` (existing), `getGroupsForUser` (existing)
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

- **`TournamentBottomNav(props)`**: `JSX.Element` *(reorder + hub-aware Home tab)*
  Groups tab rendered before Stats tab. Home tab navigates to `/[locale]/tournaments/${tournamentId}/hub` when `isHubEnabled()`, otherwise to `/[locale]`.
  Calls: `isHubEnabled` (new)
  Tests:
  - Groups tab appears before Stats tab in the rendered nav
  - Home tab navigates to `/tournaments/[id]/hub` when hub flag is enabled
  - Home tab navigates to `/[locale]` when hub flag is disabled
  - Groups and Stats tabs absent when `user` is undefined

### Tournament top nav component *(modified)*

**Changed components:**

- Hub nav item added before Matches, conditional on `isHubEnabled()`. Links to `/[locale]/tournaments/[id]/hub`. Find exact file by searching for `topNav.matches` translation key usage.
  Tests:
  - Hub item renders before Matches when flag is enabled
  - Hub item is absent when flag is disabled
  - Hub item link resolves to correct tournament-scoped URL

---

## Testing Strategy

**Test utilities (mandatory per project conventions):**
- `renderWithTheme(ui)` — wraps all component tests in MUI theme provider
- `testFactories.tournament()`, `testFactories.user()` — for mock data (never construct raw objects)
- `vi.mock('../../actions/...')` — for isolating Server Action dependencies

**Mock pattern for layout tests** (new `getGroupRankingForUser` dependency):
```ts
vi.mock('@/app/actions/group-ranking-actions', () => ({
  getGroupRankingForUser: vi.fn(),
}))
```

**Test files to create / extend:**
- `app/utils/__tests__/environment-utils.test.ts` — `isHubEnabled()` (3 env var cases)
- `app/[locale]/tournaments/[id]/hub/__tests__/page.test.tsx` — 3 placeholder sections, logged-out, route accessibility
- `app/components/home/__tests__/tournament-redirect.test.tsx` — hub-on/hub-off/no-last-tournament branches
- `app/components/tournament-page/__tests__/friend-groups-list.test.tsx` — rank badge present/null/undefined
- `app/components/tournament-bottom-nav/__tests__/tournament-bottom-nav.test.tsx` — tab order, hub-aware Home tab (on/off), user gating

Existing tests for `TournamentSidebar` and layout must not break.

Coverage target: ≥80% on new/changed code.

---

## Validation Considerations

- SonarCloud: 0 new issues — avoid `any` in new prop types
- `topNav.hub` goes in existing `navigation.json` (no new namespace)
- `NEXT_PUBLIC_HUB_ENABLED` must be added to `.env.example` and Vercel env vars
- No database migrations required
- Verify feature flag OFF path (existing redirect to games) still works after `TournamentRedirect` change
