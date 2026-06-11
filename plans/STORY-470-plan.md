# STORY-470: Filter completion stats by friend group in backoffice

## Story Context

**Issue:** [#470](https://github.com/gvinokur/qatar-prode/issues/470)
**Branch:** `feature/story-470`
**Worktree:** `/Users/gvinokur/Personal/qatar-prode-story-470`

## Objective

Admins can narrow the user completion stats table to only show members of a specific friend group. A dropdown above the table lists all friend groups on the platform. Selecting a group filters the results; selecting "All groups" restores the full list. Page resets to 1 when the filter changes.

## Acceptance Criteria

- [ ] A dropdown appears above the completion stats table listing all friend groups
- [ ] Selecting a group filters the table to show only users belonging to that group
- [ ] Selecting "All groups" restores the full list
- [ ] Page resets to 1 when filter changes
- [ ] Works in both EN and ES

## Technical Approach

### Layer-by-layer changes

**1. DB — `app/db/prode-group-repository.ts`**

Add `findAllProdeGroupsForAdmin()` that does a simple `SELECT id, name FROM prode_groups ORDER BY name`. This is the data source for the dropdown.

**2. DB — `app/db/user-tournament-completion-repository.ts`**

Add optional `groupId?: string` parameter to `getUserTournamentCompletionsPaginated`. When provided:
- Add a WHERE clause to the main query filtering `u.id` to users who belong to the group (as owner OR participant):
  ```sql
  AND EXISTS (
    SELECT 1 FROM prode_group_participants pgp2
    WHERE pgp2.participant_id = u.id AND pgp2.prode_group_id = <groupId>
    UNION ALL
    SELECT 1 FROM prode_groups pg2
    WHERE pg2.owner_user_id = u.id AND pg2.id = <groupId>
  )
  ```
- Apply the same filter to the `COUNT(*)` query so pagination totals are accurate.

**3. Actions — `app/actions/admin-tournament-actions.ts`**

- Update `getUserTournamentCompletionsAction` to accept optional `groupId?: string` and pass it to the repository.
- Add `getAllGroupsForAdminAction(): Promise<{ id: string; name: string }[]>` — checks `user.isAdmin`, then calls `findAllProdeGroupsForAdmin()`.

**4. Component — `app/components/backoffice/user-completion-tab.tsx`**

- On mount, call `getAllGroupsForAdminAction()` to populate the group dropdown.
- Add `groupId` state (default `''` = all groups).
- Render a MUI `Select` (or `TextField` with `select`) above the table showing "All groups" + sorted group options.
- In the data-fetching `useEffect`, depend on `[tournamentId, page, groupId]`. When `groupId` changes, reset `page` to `0` simultaneously.
- Pass `groupId || undefined` to `getUserTournamentCompletionsAction`.

### Visual Prototype

```
┌──────────────────────────────────────────────────┐
│  Filter by group: [ All groups          ▼ ]      │
├────────────┬────────┬──────┬───────┬─────┬───────┤
│ Display    │ Active │  %   │Games  │Qual.│Groups │
├────────────┼────────┼──────┼───────┼─────┼───────┤
│ Alice      │  Yes   │ 72%  │ 35/48 │12/20│   2   │
│ Bob        │  No    │ 22%  │ 10/48 │ 4/20│   1   │
│ ...        │        │      │       │     │       │
└────────────┴────────┴──────┴───────┴─────┴───────┘
  [< Prev]                                [Next >]
```

The Select lives inside the `Box sx={{ p: 2 }}` wrapper, above the `TableContainer`. It has a label like "Filter by group" or a placeholder "All groups".

## Files to Create / Modify

| File | Change |
|------|--------|
| `app/db/prode-group-repository.ts` | Add `findAllProdeGroupsForAdmin()` |
| `app/db/user-tournament-completion-repository.ts` | Add optional `groupId` param with WHERE clause |
| `app/actions/admin-tournament-actions.ts` | Pass `groupId` through; add `getAllGroupsForAdminAction` |
| `app/components/backoffice/user-completion-tab.tsx` | Add dropdown + filter state |
| `app/components/backoffice/__tests__/user-completion-tab.test.tsx` | New filter tests |
| `docs/code-structure/db.md` | Document new `findAllProdeGroupsForAdmin` |
| `docs/code-structure/actions.md` | Document updated action signatures |
| `CODE-STRUCTURE.md` | Update call graph if needed |

## Mid-Level Design

### Call Graph Changes

No new end-to-end flows. Extending existing **Flow (Backoffice / User Completion)**:

- `UserCompletionTab` now also calls `getAllGroupsForAdminAction` on mount (one-time fetch for dropdown).
- `getUserTournamentCompletionsAction` gains an optional `groupId` parameter.

### `app/db/prode-group-repository.ts` *(modified)*

**New functions:**

- **`findAllProdeGroupsForAdmin()`**: `Promise<{ id: string; name: string }[]>`
  Returns all groups ordered by name. Used to populate the backoffice filter dropdown.
  Tests:
  - returns empty array when no groups exist
  - returns groups ordered by name ascending
  - returns id and name fields for each group

### `app/db/user-tournament-completion-repository.ts` *(modified)*

**Changed functions:**

- **`getUserTournamentCompletionsPaginated(tournamentId, page, pageSize, groupId?)`**: `Promise<{ rows: UserTournamentCompletionRow[]; total: number }>` *(was: no groupId param)*
  When `groupId` is provided, filters both the row query and the count query to users who are an owner or participant of that group.
  Tests:
  - returns all users when groupId is undefined (existing behavior)
  - returns only group members when groupId is provided (owner + participant)
  - count reflects the filtered result set
  - returns empty result when groupId matches no users

### `app/actions/admin-tournament-actions.ts` *(modified)*

**New functions:**

- **`getAllGroupsForAdminAction()`**: `Promise<{ id: string; name: string }[]>`
  Server Action. Verifies admin, then delegates to `findAllProdeGroupsForAdmin`.
  Calls: `getLoggedInUser`, `findAllProdeGroupsForAdmin`
  Tests:
  - throws Unauthorized when caller is not admin
  - returns groups array from repository on success

**Changed functions:**

- **`getUserTournamentCompletionsAction(tournamentId, page, pageSize, groupId?)`**: same return type *(was: no groupId)*
  Passes `groupId` through to repository.
  Tests:
  - (existing tests unchanged)
  - new: passes groupId to repository when provided

### `app/components/backoffice/user-completion-tab.tsx` *(modified)*

**Component changes (no new exported functions):**

- Add `groups` state: `{ id: string; name: string }[]` populated once from `getAllGroupsForAdminAction`.
- Add `groupId` state: `string` defaulting to `''`.
- Select dropdown renders above the table; options are "All groups" (value `''`) + one entry per group.
- `useEffect` depends on `[tournamentId, page, groupId]`; passes `groupId || undefined` to the action.
- Group change handler resets `page` to `0` before updating `groupId`.

Tests:
- renders group filter dropdown after groups load
- "All groups" option is present in dropdown
- selecting a group calls action with that groupId and resets page to 0
- selecting "All groups" calls action with undefined groupId

## Testing Strategy

- Unit tests in `user-completion-tab.test.tsx`: mock `getAllGroupsForAdminAction`, verify dropdown renders, verify filter triggers correct action calls, verify page reset.
- Unit tests for `getUserTournamentCompletionsAction` (if dedicated test file exists) or covered by component tests.
- DB-layer tests for `findAllProdeGroupsForAdmin` and updated `getUserTournamentCompletionsPaginated` (if in-memory DB tests exist for this repo) — otherwise rely on manual Vercel preview testing.

## Validation / Quality Gates

- `npm run test` — must include new test cases; coverage ≥80% on changed files
- `npm run lint` — no new ESLint issues
- `npm run build` — clean build
- Manual: Open backoffice → tournament → User Completion tab → verify dropdown renders, filter works, page resets

## Open Questions

None.
