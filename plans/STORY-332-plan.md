# Plan: Story #332 — Favorite Friend Groups & Navigation Improvements

## Context

Users with many friend groups face a flat, unordered list in both the sidebar and the Friend Groups page. There's no way to surface important groups or control which group is highlighted in the sidebar. Two specific navigation issues also exist: group title names in the Friend Groups page are not clickable links, and the Spanish translation "Ver Marcador" doesn't reflect the correct word (posiciones = standings/positions). This story adds favorite/main group designation, sorts favorites to the top, makes group titles navigable, and fixes the translation.

---

## Acceptance Criteria

- [ ] Star icon on group rows (sidebar) and group cards (Friend Groups page) toggles favorite status
- [ ] Favorite groups sort to top of sidebar list and Friend Groups page
- [ ] Exactly one group can be designated as "Main Group" (crown icon; first in the sorted list)
- [ ] Group title/name in Friend Groups page card is a clickable link to the group page
- [ ] Spanish: "Ver Marcador" → "Ver Posiciones" in all occurrences
- [ ] Works in EN and ES

---

## Technical Approach

### 1. DB Migration

New table `user_favorite_groups`:

```sql
CREATE TABLE user_favorite_groups (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id   UUID NOT NULL REFERENCES prode_groups(id) ON DELETE CASCADE,
  is_main    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, group_id)
);
-- Enforce at most one main group per user
CREATE UNIQUE INDEX user_favorite_groups_main_idx
  ON user_favorite_groups(user_id) WHERE is_main = TRUE;
```

A group can only be main if it is also a favorite. Removing a favorite auto-clears the main flag (the DELETE removes the whole row).

### 2. Data Layer

**New file: `app/db/favorite-groups-repository.ts`**
- `getFavoriteGroupIds(userId)` — return `string[]` of favorited group IDs
- `getMainGroupId(userId)` — return `string | null` for the main group
- `addFavoriteGroup(userId, groupId)` — insert row
- `removeFavoriteGroup(userId, groupId)` — delete row (cascades main flag)
- `setMainGroup(userId, groupId)` — upsert row with `is_main=true` + clears any previous main via UPDATE
- `clearMainGroup(userId)` — set `is_main=false` for user's current main group

**Modified: `app/db/tables-definition.ts`**
- Add `UserFavoriteGroupTable` interface

**Modified: `app/db/database.ts`**
- Add `user_favorite_groups: UserFavoriteGroupTable` to `DB` interface

### 3. Server Actions

**New file: `app/actions/favorite-group-actions.ts`**
- `toggleFavoriteGroupAction(groupId)` — add or remove from favorites; revalidate
- `setMainGroupAction(groupId)` — set as main; revalidate
- `clearMainGroupAction()` — clear main group designation; revalidate

**Modified: `app/actions/prode-group-actions.ts` (`getGroupsForUser`)**
- Also fetch `favoriteGroupIds` and `mainGroupId` for the current user
- Return these alongside the existing `userGroups`, `participantGroups`, `pendingRequests`

### 4. UI — Sorting Logic (shared utility)

A sorting helper function (inline in components):
```
1. Main group (is_main=true) — always first
2. Other favorites (sorted by name alphabetically)
3. Non-favorites (existing order preserved)
```

### 5. UI — `FriendGroupsList` (sidebar)

**File: `app/components/tournament-page/friend-groups-list.tsx`**

New props:
- `favoriteGroupIds?: string[]`
- `mainGroupId?: string | null`

Changes:
- Sort all groups using the sort logic above before rendering
- Add a `StarBorderIcon` / `StarIcon` (amber) icon button next to each group name
- Add a `WorkspacePremiumIcon` (or `EmojiEventsIcon`) crown icon button for favorited groups to designate/clear main
- Primary group in the header subheader becomes the main group (if designated) or falls back to current behavior
- Calls `toggleFavoriteGroupAction` / `setMainGroupAction` via `useTransition` for optimistic UI

### 6. UI — `TournamentGroupCard` (my-groups variant)

**File: `app/components/tournament-page/tournament-group-card.tsx`**

New props on `MyGroupsCardProps`:
- `isFavorite?: boolean`
- `isMainGroup?: boolean`
- `onToggleFavorite?: (groupId: string) => void`
- `onSetMainGroup?: (groupId: string) => void`

Changes:
- Add star icon button in the card header (top right, alongside Share/Owner badge)
- Add crown icon for main group (only visible for favorited cards)
- **Make group name a `Link`** to `/${locale}/tournaments/${tournamentId}/friend-groups/${group.groupId}` — wraps the Typography element

### 7. UI — `TournamentGroupsList` (Friend Groups page)

**File: `app/components/tournament-page/tournament-groups-list.tsx`**

New props:
- `favoriteGroupIds?: string[]`
- `mainGroupId?: string | null`

Changes:
- Sort `groups` array with main → favorites → others before rendering
- Pass `isFavorite`, `isMainGroup`, `onToggleFavorite`, `onSetMainGroup` to each `TournamentGroupCard`
- Handle optimistic state updates: maintain local `favoriteGroupIds` / `mainGroupId` in `useState`, update immediately, then call server action via `useTransition`

### 8. Data Flow Changes

**`app/[locale]/tournaments/[id]/friend-groups/page.tsx`**
- Destructure `favoriteGroupIds` and `mainGroupId` from `getGroupsForUser()` result
- Pass them as props to `TournamentGroupsList`

**`app/[locale]/tournaments/[id]/layout.tsx`**
- `prodeGroups` now includes `favoriteGroupIds` and `mainGroupId`
- Pass through to `TournamentSidebar` → `FriendGroupsList`

**`app/[locale]/tournaments/[id]/layout.tsx` + `TournamentSidebarProps`**
- Update `prodeGroups` type to include `favoriteGroupIds?: string[]` and `mainGroupId?: string | null`

### 9. Translation Fix

**`locales/es/groups.json`**
- `groups.card.viewLeaderboard`: `"Ver Marcador"` → `"Ver Posiciones"`
- `groups.discovery.viewGroup`: `"Ver Marcador"` → `"Ver Posiciones"`
- `groups.discovery.viewLeaderboard`: `"Ver Marcador"` → `"Ver Posiciones"`
- Add new keys for favorites: `groups.favorites.addFavorite`, `groups.favorites.removeFavorite`, `groups.favorites.setMainGroup`, `groups.favorites.clearMainGroup`, `groups.favorites.mainGroupLabel`

**`locales/en/groups.json`**
- Add same new `groups.favorites.*` keys in English

---

## Visual Prototype

### Sidebar (`FriendGroupsList`) — list row
```
┌─────────────────────────────────────────────┐
│ Friend Groups                    [▾]        │
│ 3 groups · #2 in Main Crew                  │
├─────────────────────────────────────────────┤
│  👑 #2  Main Crew              [★][×][↗]   │  ← main group (crown + filled star)
│  ⭐ #5  Work Buds             [★][×][↗]   │  ← favorite (filled star)
│     #9  Casual League         [☆][×][↗]   │  ← not a favorite (empty star)
│  ─────────────────────────────────────────  │
│  [+ Create Group]                           │
└─────────────────────────────────────────────┘
```
- Crown only appears on the main group's row
- Clicking filled ★ on main group → removes from favorites (clears main too)
- Clicking filled ★ on non-main favorite → removes from favorites
- Clicking empty ☆ → adds to favorites
- Clicking 👑 on a favorite → sets it as main (previous main loses crown)

### TournamentGroupCard — header area
```
┌────────────────────────────────────────────┐
│  Main Crew                    [Owner] [★]  │  ← star icon in header
│  ↑ clicking name navigates to group page   │
│                                            │
│  Your Position   Your Points               │
│  #2 of 18        112                       │
│                                            │
│  Leader: Gabi (130 pts)                    │
├────────────────────────────────────────────┤
│          [View Standings]                  │
└────────────────────────────────────────────┘
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `migrations/20260417000000_create_user_favorite_groups.sql` | DB table |
| `app/db/favorite-groups-repository.ts` | DB operations |
| `app/actions/favorite-group-actions.ts` | Server actions |

## Files to Modify

| File | Change |
|------|--------|
| `app/db/tables-definition.ts` | Add `UserFavoriteGroupTable` |
| `app/db/database.ts` | Add `user_favorite_groups` to `DB` |
| `app/actions/prode-group-actions.ts` | Add favorites to `getGroupsForUser()` return |
| `app/definitions.ts` | Add `isFavorite?`, `isMainGroup?` to `TournamentGroupStats` |
| `app/components/tournament-page/friend-groups-list.tsx` | Star/crown icons, sort, call actions |
| `app/components/tournament-page/tournament-group-card.tsx` | Star icon, title as Link |
| `app/components/tournament-page/tournament-groups-list.tsx` | Sort, pass props, optimistic state |
| `app/[locale]/tournaments/[id]/friend-groups/page.tsx` | Pass favorites to list |
| `app/[locale]/tournaments/[id]/layout.tsx` | Pass favorites through sidebar props |
| `app/components/tournament-page/tournament-sidebar.tsx` | Update `prodeGroups` type |
| `locales/es/groups.json` | Translation fixes + new favorite keys |
| `locales/en/groups.json` | New favorite keys |
| `docs/code-structure/db.md` | Document new repository |
| `docs/code-structure/actions.md` | Document new actions |
| `docs/code-structure/components-friend-groups.md` | No new file, but update tournament-group-card entry |

---

## Mid-Level Design

### Call Graph Changes

**Modified flows:**
- **Flow: Sidebar prode groups** — `layout.tsx` → `getGroupsForUser()` now also returns `favoriteGroupIds` + `mainGroupId` → passed through `TournamentSidebar` → `FriendGroupsList`
- **Flow: Friend Groups page** — `tournament/friend-groups/page.tsx` → `getGroupsForUser()` → `favoriteGroupIds`/`mainGroupId` passed to `TournamentGroupsList` → `TournamentGroupCard`

**New flows:**
- `FriendGroupsList` → `toggleFavoriteGroupAction(groupId)` → `addFavoriteGroup/removeFavoriteGroup`
- `FriendGroupsList` → `setMainGroupAction(groupId)` → `setMainGroup/clearMainGroup`
- `TournamentGroupsList` → `toggleFavoriteGroupAction(groupId)` → `addFavoriteGroup/removeFavoriteGroup`

---

### `migrations/20260417000000_create_user_favorite_groups.sql` *(new)*

SQL migration creating the `user_favorite_groups` table with partial unique index for main group constraint.

---

### `app/db/favorite-groups-repository.ts` *(new)*

- **`getFavoriteGroupIds(userId: string)`**: `Promise<string[]>`
  Returns IDs of all groups the user has favorited.
  Tests:
  - returns empty array when user has no favorites
  - returns correct group IDs for user with favorites
  - does not return groups from other users

- **`getMainGroupId(userId: string)`**: `Promise<string | null>`
  Returns the ID of the user's designated main group, or null if none.
  Tests:
  - returns null when no main group is set
  - returns the correct group ID when main group is set
  - returns null after the main group is cleared

- **`addFavoriteGroup(userId: string, groupId: string)`**: `Promise<void>`
  Inserts a row. No-op if already exists (ON CONFLICT DO NOTHING).
  Tests:
  - inserts a new favorite row
  - does not throw when called with an already-favorited group (idempotent)
  - does not insert favorite for a different user (user isolation verified)

- **`removeFavoriteGroup(userId: string, groupId: string)`**: `Promise<void>`
  Deletes the row. Also clears main group if that row had is_main=true.
  Tests:
  - removes the favorite row
  - no-op when group is not favorited
  - removing a main group also clears the main designation

- **`setMainGroup(userId: string, groupId: string)`**: `Promise<void>`
  Upserts the row with is_main=true; clears is_main from the previous main group.
  Tests:
  - sets the specified group as main
  - previous main group loses its main status
  - requires the group to be in the favorites table (throws if not favorited)

- **`clearMainGroup(userId: string)`**: `Promise<void>`
  Sets is_main=false for the user's current main group.
  Tests:
  - clears the main group flag
  - no-op when no main group is set
  - does not clear another user's main group (user isolation)

---

### `app/actions/favorite-group-actions.ts` *(new)*

- **`toggleFavoriteGroupAction(groupId: string)`**: `Promise<{ isFavorite: boolean }>`
  Server Action. Adds or removes the group from the authenticated user's favorites.
  Calls: getLoggedInUser, getFavoriteGroupIds, addFavoriteGroup | removeFavoriteGroup, revalidatePath
  Tests:
  - throws Unauthorized when no active session
  - adds group to favorites when not currently favorited, returns `{ isFavorite: true }`
  - removes group from favorites when currently favorited, returns `{ isFavorite: false }`
  - removing a favorited main group also clears the main designation

- **`setMainGroupAction(groupId: string)`**: `Promise<void>`
  Server Action. Designates the given group as the user's main group (must already be a favorite).
  Calls: getLoggedInUser, getFavoriteGroupIds, setMainGroup, revalidatePath
  Tests:
  - throws Unauthorized when no active session
  - throws when groupId is not in user's favorites
  - sets the group as main for a valid favorited group

- **`clearMainGroupAction()`**: `Promise<void>`
  Server Action. Clears the user's main group designation.
  Calls: getLoggedInUser, clearMainGroup, revalidatePath
  Tests:
  - throws Unauthorized when no active session
  - clears the main group when one is set
  - no-op when no main group is set

---

### `app/actions/prode-group-actions.ts` — `getGroupsForUser` *(modified)*

- **`getGroupsForUser()`**: `Promise<{ userGroups, participantGroups, pendingRequests, favoriteGroupIds: string[], mainGroupId: string | null } | undefined>` *(was: no favorite fields)*
  Now also fetches favorite and main group data in parallel.
  Calls: getLoggedInUser, findProdeGroupsByOwner, findProdeGroupsByParticipant, findJoinRequestsByUser, getFavoriteGroupIds, getMainGroupId
  Tests:
  - (existing tests unchanged)
  - new: returned object includes `favoriteGroupIds` as empty array when user has no favorites
  - new: returned object includes correct `mainGroupId` when user has a main group

---

### `app/components/tournament-page/friend-groups-list.tsx` *(modified)*

New props: `favoriteGroupIds?: string[]`, `mainGroupId?: string | null`

Key behavior:
- Sorts all groups: main first, then favorites (alpha), then others
- Renders `StarIcon` (amber, filled) for favorited groups, `StarBorderIcon` for others
- Renders a crown-style secondary icon (`WorkspacePremiumIcon`) on the main group row
- Calls `toggleFavoriteGroupAction` and `setMainGroupAction` via `startTransition`
- Uses local optimistic state (`useState` for local `favoriteGroupIds`/`mainGroupId`)

---

### `app/components/tournament-page/tournament-group-card.tsx` *(modified)*

New props on `MyGroupsCardProps`:
- `isFavorite?: boolean`
- `isMainGroup?: boolean`
- `onToggleFavorite?: (groupId: string) => void`
- `onSetMainGroup?: (groupId: string) => void`

Changes:
- Group name `Typography` is wrapped in a MUI `Link` (Next.js `Link`) pointing to the group detail page
- Star icon button (amber when favorite) added to the header actions area
- Crown icon appears next to star only when `isMainGroup=true`

---

### `app/components/tournament-page/tournament-groups-list.tsx` *(modified)*

New props: `favoriteGroupIds?: string[]`, `mainGroupId?: string | null`

Key behavior:
- Sorts `groups` by: main → favorites → others
- Maintains local `favoriteGroupIds`/`mainGroupId` state for optimistic updates
- Passes `isFavorite`, `isMainGroup`, `onToggleFavorite`, `onSetMainGroup` to each `TournamentGroupCard`
- `onToggleFavorite` calls `toggleFavoriteGroupAction` via `startTransition` + updates local state
- `onSetMainGroup` calls `setMainGroupAction` via `startTransition` + updates local state

---

## Testing Strategy

**Project test utilities to use:**
- `renderWithTheme(component)` — all React component tests
- `testFactories.user()`, `testFactories.prodeGroup()` — for generating typed test data
- `vi.mock('@/app/actions/...')` — for mocking server actions in component tests
- `createMockSelectQuery()` (if applicable) — for mocking Kysely queries at the DB layer

**Test coverage plan:**
- Unit tests for `favorite-groups-repository.ts`: mock Kysely DB, test add/remove/setMain/clearMain including user isolation (different userId never affects results)
- Unit tests for `favorite-group-actions.ts`: mock auth (`getLoggedInUser`) + repository functions; test toggle behavior, auth errors, and permission checks (user can only affect their own favorites)
- Unit tests for updated `FriendGroupsList`: use `renderWithTheme`, verify sort order (main → favorites → others), verify star/crown icons render correctly, verify `toggleFavoriteGroupAction` is called on star click
- Unit tests for `TournamentGroupCard`: verify star renders when `isFavorite=true`, verify name is wrapped in a `Link`, verify `onToggleFavorite` fires on click
- Unit tests for `TournamentGroupsList`: verify optimistic sort update when `onToggleFavorite` fires
- **Edge cases to test explicitly:** concurrent toggle (DB-level idempotency), cascade when main group is deleted by another user (DB ON DELETE CASCADE removes the row), removing a main favorite also clears the main designation
- Existing `friend-groups-list.test.tsx` tests should still pass (new props are optional)
- Coverage target: ≥80% on new/modified files

---

## Validation

1. Create worktree: `./scripts/github-projects-helper story start 332 --project 1`
2. Run migration manually (with user permission)
3. Run `npm run test` — all tests pass
4. Run `npm run lint` — no ESLint errors
5. Run `npm run build` — clean build
6. Deploy to Vercel Preview
7. Manual test: star a group → it sorts to top in sidebar and Friend Groups page
8. Manual test: star two groups, set one as main → main appears first
9. Manual test: click group name in Friend Groups page → navigates to group
10. Manual test: check "Ver Posiciones" in Spanish locale

---

## Open Questions

None — scope is well-defined. No limit on number of favorites (per issue). Main group is implicitly part of favorites (is_main row lives in user_favorite_groups).
