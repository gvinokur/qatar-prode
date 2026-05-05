# Story 422 — Extract tournament sidebar into a dedicated Server Component with streaming

## Context

**Why:** `TournamentLayout` currently blocks the entire page render until all sidebar data resolves — `findTournamentById`, `getGroupsForUser`, `getGroupStandingsForTournament`, `getGameGuessStatisticsForUsers`, and per-group `getGroupRankingForUser` calls all run before the header HTML is sent to the browser. Users see nothing until all of it completes, even though the header needs none of it.

**What changes:** Moving those fetches into a dedicated `TournamentSidebarServer` async Server Component and wrapping it in `<Suspense>` lets React stream the header immediately while the sidebar resolves in the background. A skeleton component fills the sidebar slot during load.

**Scope:** Tournament layout only. No sidebar card designs, no main content area data fetching, no other layouts.

---

## Acceptance Criteria
- [ ] Header and navigation render immediately without waiting for sidebar data
- [ ] Sidebar shows skeleton placeholders while its data resolves, then renders all cards correctly
- [ ] All sidebar cards (friend groups, standings, user stats, rules) work for authenticated users
- [ ] Unauthenticated visitors see the correct public sidebar view (standings, rules) after load
- [ ] No regression across all tournament sub-pages (hub, games, stats, results, awards, qualified-teams, rules)
- [ ] Client-side navigation between sub-pages does not re-fetch sidebar data (Router Cache preserved)

---

## Current State Analysis

**`app/[locale]/tournaments/[id]/layout.tsx`** fetches two categories of data:

**Header data (must stay in layout):**
- `getLoggedInUser()` — user display, verification check, bottom nav, dev permission gate
- `getTournamentAndGroupsData(params.id)` — tournament theme colors, name, group tabs
- `getTournaments()` — tournament switcher
- `getTournamentStartDate(params.id)` — JSON-LD structured data
- `checkDevTournamentPermission()` — auth gate (redirect/notFound)

**Sidebar data (move to TournamentSidebarServer):**
- `findTournamentById(params.id)` — scoring config for Rules card
- `findTournamentGuessByUserIdTournament(user.id, params.id)` — tournament guess for stats
- `getGroupsForUser()` — friend groups list
- `getGroupStandingsForTournament(params.id)` — group standings carousel
- `getGameGuessStatisticsForUsers([user.id], params.id)` — user game stats
- `getGroupRankingForUser(userId, groupId, tournamentId)` x N (parallel) — rank per group

**Key insight on `findTournamentById` in JSON-LD:**
`getTournamentAndGroupsData` internally calls `findTournamentById` and includes all fields (only localizes `long_name`/`short_name`), so `layoutData.tournament?.locations` equals `tournament?.locations`. The separate `findTournamentById` call in the layout can be removed — switch JSON-LD to use `layoutData.tournament?.locations`.

---

## Technical Approach

### 1. New: `TournamentSidebarServer` (async Server Component)

**File:** `app/components/tournament-page/tournament-sidebar-server.tsx`

Accepts `tournamentId` and `user` (already fetched by the layout). Fetches all sidebar data in parallel, renders `TournamentSidebar`.

```
Suspense boundary in layout
  └── TournamentSidebarServer (async, fetches data)
        └── TournamentSidebar (existing client component, unchanged)
```

### 2. New: `TournamentSidebarSkeleton` (skeleton component)

**File:** `app/components/skeletons/tournament-sidebar-skeleton.tsx`

Matches the sidebar's Grid slot (size `{ xs: 12, md: 3 }`, hidden on mobile). Renders 4 stacked skeleton cards approximating: friend groups, standings, stats, rules sections.

Uses `getSkeletonA11yProps` from `app/components/skeletons/skeleton-utils.ts`.

### 3. Modified: `layout.tsx`

- Remove all 6 sidebar data fetching calls
- Remove `findTournamentById` import and call; switch JSON-LD to `layoutData.tournament?.locations`
- Replace `<TournamentSidebar ... />` with:
  ```tsx
  <Suspense fallback={<TournamentSidebarSkeleton />}>
    <TournamentSidebarServer tournamentId={params.id} user={user ?? undefined} />
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
| Create | `app/components/tournament-page/tournament-sidebar-server.tsx` |
| Create | `app/components/skeletons/tournament-sidebar-skeleton.tsx` |
| Create | `app/components/tournament-page/tournament-sidebar-server.test.tsx` |
| Modify | `app/[locale]/tournaments/[id]/layout.tsx` |
| Modify | `docs/code-structure/pages.md` |
| Modify | `docs/code-structure/components/components-tournament-hub.md` |

---

## Mid-Level Design

### Call Graph Changes

**Modified flows:**
- **Flow: TournamentLayout** — sidebar data fetching extracted; layout now renders header immediately. `TournamentSidebarServer` replaces the inline data fetch + `TournamentSidebar` call. A `Suspense` boundary wraps it so the header streams without waiting.

**New flows:**
- **TournamentSidebarServer** → `findTournamentById`, `findTournamentGuessByUserIdTournament`, `getGroupsForUser`, `getGroupStandingsForTournament`, `getGameGuessStatisticsForUsers`, `getGroupRankingForUser` (parallel per group) → `extractScoringConfig` → `TournamentSidebar`

---

### `app/components/tournament-page/tournament-sidebar-server.tsx` *(new)*

**New functions:**

- **TournamentSidebarServer({ tournamentId, user })**: `Promise<JSX.Element>`
  Async Server Component. Fetches all sidebar data in parallel where possible. For authenticated users: runs `findTournamentById`, `findTournamentGuessByUserIdTournament`, `getGroupsForUser`, `getGroupStandingsForTournament`, `getGameGuessStatisticsForUsers`, then fetches per-group ranks in parallel via `Promise.all`. For unauthenticated visitors: only fetches `getGroupStandingsForTournament` and `findTournamentById` (for scoring config in Rules card). Renders `TournamentSidebar` with the resolved data.
  Calls: findTournamentById, findTournamentGuessByUserIdTournament, getGroupsForUser, getGroupStandingsForTournament, getGameGuessStatisticsForUsers, getGroupRankingForUser, extractScoringConfig
  Tests (use `testFactories.user()`, `testFactories.tournament()`, `testFactories.group()` for mock data):
  - renders TournamentSidebar for an authenticated user with all props populated
  - renders TournamentSidebar for an unauthenticated visitor with no user-specific props
  - fetches group ranks in parallel for all groups (userGroups + participantGroups)
  - handles getGroupsForUser returning undefined gracefully (no prodeGroups prop)
  - skips user-specific fetches entirely when user is undefined
  - renders gracefully if findTournamentById returns null (scoringConfig is undefined)
  - renders gracefully if getGroupStandingsForTournament returns empty groups array

Note: `extractScoringConfig` is a pure helper currently defined in `layout.tsx`. It should be moved to a shared location (e.g., `app/utils/tournament-utils.ts`) or co-located with the sidebar server component. During implementation, check if it's already exported from layout — if not, move/re-export it.

---

### `app/components/skeletons/tournament-sidebar-skeleton.tsx` *(new)*

**New functions:**

- **TournamentSidebarSkeleton()**: `JSX.Element`
  Skeleton placeholder for the tournament sidebar. Renders in the same Grid slot as the real sidebar (`size={{ xs: 12, md: 3 }}`, `display: { xs: 'none', md: 'flex' }`). Contains 4 stacked skeleton cards with heights approximating friend groups, standings, stats, and rules. Uses `getSkeletonA11yProps('Loading sidebar')` for accessibility.
  Tests:
  - renders with aria role="status" and aria-busy="true"
  - hidden on mobile (xs: 'none') via Grid size prop
  - renders 4 skeleton card sections

---

### `app/[locale]/tournaments/[id]/layout.tsx` *(modified)*

**Changed functions:**

- **TournamentLayout(props)**: same signature
  Sidebar data fetching removed entirely. JSON-LD locations switched from `tournament?.locations` to `layoutData.tournament?.locations`. Renders `<Suspense fallback={<TournamentSidebarSkeleton />}><TournamentSidebarServer tournamentId={params.id} user={user ?? undefined} /></Suspense>` in place of the old inline `<TournamentSidebar>`. Imports of `findTournamentById`, `findTournamentGuessByUserIdTournament`, `getGroupsForUser`, `getGroupStandingsForTournament`, `getGameGuessStatisticsForUsers`, `getGroupRankingForUser` removed.

---

## Implementation Steps

### Wave 1 — New components (independent)
1. Create `app/components/skeletons/tournament-sidebar-skeleton.tsx`
2. Create `app/components/tournament-page/tournament-sidebar-server.tsx`
   - Move `extractScoringConfig` helper here or to a shared util (check if used elsewhere in layout first)
3. Write tests for both new components

### Wave 2 — Layout integration
4. Modify `layout.tsx`:
   - Add `import React, { Suspense } from 'react'`
   - Add imports for `TournamentSidebarServer`, `TournamentSidebarSkeleton`
   - Remove sidebar data fetching and old imports
   - Switch JSON-LD to `layoutData.tournament?.locations`
   - Replace `<TournamentSidebar>` with `<Suspense>` + `<TournamentSidebarServer>`

### Wave 3 — Documentation
5. Update `docs/code-structure/pages.md` — update `TournamentLayout` entry
6. Update `docs/code-structure/components/components-tournament-hub.md` — add `TournamentSidebarServer`

---

## Testing Strategy

### Unit Tests
- **`tournament-sidebar-server.test.tsx`**: Mock all data fetching functions; verify `TournamentSidebar` receives correct props in authenticated and unauthenticated scenarios
- **`tournament-sidebar-skeleton.tsx`**: Verify accessibility attributes, Grid visibility props, presence of 4 skeleton sections

### Manual Verification
- Navigate to any tournament sub-page, observe header renders immediately
- Watch sidebar skeleton appear, then replace with real content
- Test as unauthenticated user: standings and rules visible, no user stats
- Navigate between sub-pages (hub → games → stats) to confirm no sidebar re-fetch
- Test all 7 sub-pages: hub, games, stats, results, awards, qualified-teams, rules

---

## Validation Considerations

- SonarCloud: No new issues; coverage ≥80% on new files
- No new translation keys needed
- No DB migration needed
- `extractScoringConfig` is a pure helper — no side effects, easy to move
- Router Cache (30s default in Next.js App Router) will cache the sidebar segment; sub-page navigation won't re-fetch it

---

## Open Questions

1. **`extractScoringConfig` helper**: Currently defined as a local function in `layout.tsx`. Should it move to `app/utils/tournament-utils.ts` or stay co-located with `TournamentSidebarServer`? → Recommend co-locating with the server component since it's only used there after this change.

2. **`'use server'` on layout.tsx**: The current layout has `'use server'` at the top. After adding `<Suspense>`, this directive remains correct — Suspense is valid in Server Components.

3. **Router Cache**: Need to verify that the Suspense boundary doesn't bypass Router Cache for the streamed segment on client navigation. Based on Next.js docs, cached RSC payloads for a layout segment are reused on navigation — the Suspense behavior (streaming on initial load) doesn't affect client-side navigation cache behavior.
