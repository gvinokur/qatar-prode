# Story 360 Plan: Dashboard: Logged-Off Routing & Navigation

## Story Context

**Issue:** [#360](https://github.com/gvinokur/qatar-prode/issues/360)
**Title:** [Story 7] Dashboard: Logged-Off Routing & Navigation
**Branch:** `feature/story-360` (branched from `feature/story-354`)
**Worktree:** `/Users/gvinokur/Personal/qatar-prode-story-360`

> **Dependency note:** This story builds directly on Story #354 (`feature/story-354`).
> The worktree MUST be created from `feature/story-354`, not `main`.
> Manual creation:
> ```
> cd /Users/gvinokur/Personal/qatar-prode-story-354
> git checkout -b feature/story-360
> git worktree add /Users/gvinokur/Personal/qatar-prode-story-360 feature/story-360
> ```
> Then copy `.env.local` and `.claude/` into the new worktree.

---

## Objective

Enable unauthenticated users to access the Tournament Hub page (`/tournaments/[id]`) and ensure the 'Central' (Hub) navigation tab is visible and clickable for guest users.

Currently:
- `page.tsx` redirects logged-off users to `/games`
- `GroupSelector` disables the Hub tab for guests (`disabled={!user}`)

After this story, guests land on the Hub page and can navigate to it freely.

---

## Acceptance Criteria

- [ ] **No Redirect**: Logged-off users accessing `/tournaments/[id]` (or `/hub`) land on the Hub page instead of being redirected to `/games`.
- [ ] **Nav Visibility**: The Hub tab in `GroupSelector` is enabled and clickable for guest users.
- [ ] **State Consistency**: The Hub page renders its layout (placeholder DashboardCards from Story #354) for all users regardless of auth state.

---

## Technical Approach

### Changes

#### 1. Remove auth redirect from `app/[locale]/tournaments/[id]/page.tsx`

Remove the `getLoggedInUser()` call and the `!user` redirect entirely. The page renders its placeholder DashboardCard layout for all users — no user-specific data is fetched in this page (that was removed in Story #354's rewrite).

Also remove the now-unused `redirect` import and `getLoggedInUser` import.

**Before:**
```typescript
const user = await getLoggedInUser()
if (!user) {
  redirect(`/${locale}/tournaments/${id}/games`)
}
```

**After:** (lines deleted entirely, `getLoggedInUser` and `redirect` imports also removed)

#### 2. Remove `disabled={!user}` from Hub tab in `app/components/groups-page/group-selector.tsx`

Only the Hub tab gets this change. Qualified Teams and Awards tabs keep their `disabled={!user}` guards since those routes are auth-protected at the page level.

**Before:**
```typescript
<Tab
  label={t('hub')}
  ...
  disabled={!user}
/>
```

**After:**
```typescript
<Tab
  label={t('hub')}
  ...
/>
```

#### 3. Update test in `app/components/groups-page/__tests__/group-selector-i18n.test.tsx`

The test "hub tab is disabled when user is not provided" now asserts the **opposite** — hub tab is enabled when no user is provided.

**Before:**
```typescript
it('hub tab is disabled when user is not provided', () => {
  renderWithTheme(<GroupSelector {...defaultProps} />)
  const hubTab = screen.getByRole('tab', { name: /hub/i })
  expect(hubTab).toHaveAttribute('aria-disabled', 'true')
})
```

**After:**
```typescript
it('hub tab is enabled when user is not provided', () => {
  renderWithTheme(<GroupSelector {...defaultProps} />)
  const hubTab = screen.getByRole('tab', { name: /hub/i })
  expect(hubTab).not.toHaveAttribute('aria-disabled', 'true')
})
```

---

## Mid-Level Design

### Call Graph Changes

No call graph changes. No new cross-layer calls are introduced. One existing call (`getLoggedInUser` in `TournamentHubPage`) is removed.

### `app/[locale]/tournaments/[id]/page.tsx` *(modified)*

**Changed component:**

- **TournamentHubPage(props)**: `Promise<JSX.Element>` *(was: redirected to /games when user is null)*
  Now renders the hub layout unconditionally for all users (authenticated and guest).
  Calls: `getLocale`, `toLocale` — (removed: `getLoggedInUser`, `redirect`)
  Tests:
  - This is a Next.js Server Component; covered by manual acceptance testing in Vercel Preview
  - No unit-testable behavior change (removal of redirect is an integration concern)

### `app/components/groups-page/group-selector.tsx` *(modified)*

**Changed component:**

- **GroupSelector({ groups, tournamentId, backgroundColor, textColor, user })**: `JSX.Element` *(was: Hub tab disabled when no user)*
  Hub tab is now always enabled; Qualified Teams and Awards tabs remain `disabled={!user}`.
  Tests:
  - hub tab is enabled when no user is provided *(was: expected disabled, now expects not-disabled)*
  - hub tab is enabled when user is provided (unchanged — still passes)
  - qualified-teams tab remains disabled when no user is provided
  - awards tab remains disabled when no user is provided
  - all four tabs are rendered regardless of auth state
  - qualified-teams tab is enabled when user IS provided *(guard: only auth behavior for hub has changed)*
  - awards tab is enabled when user IS provided *(guard: only auth behavior for hub has changed)*

---

## Files to Modify

| File | Change |
|------|--------|
| `app/[locale]/tournaments/[id]/page.tsx` | Remove `getLoggedInUser` call, `redirect`, and their imports |
| `app/components/groups-page/group-selector.tsx` | Remove `disabled={!user}` from Hub Tab only |
| `app/components/groups-page/__tests__/group-selector-i18n.test.tsx` | Flip assertion for hub-tab-disabled test |
| `docs/code-structure/pages.md` | Update `TournamentHubPage` description: remove mention of auth redirect |

---

## Testing Strategy

1. **Unit test update**: Flip the existing group-selector test for hub tab disabled state.
2. **Add guards test**: Add assertions that qualified-teams and awards tabs remain disabled without user (to prevent regression).
3. **Manual (Vercel Preview)**:
   - Open incognito → navigate to `/en/tournaments/[id]` → verify landing on Hub page (no redirect to games)
   - Verify Hub tab in nav is clickable and active
   - Verify Qualified Teams and Awards tabs are still grayed out/disabled for guests
   - Verify that logged-in users still see the Hub page normally

---

## Validation

- Run `npm run test` — should pass with updated test assertions
- Run `npm run lint` and `npm run build` — no new errors
- SonarCloud: 0 new issues (small targeted change)

---

## Implementation Amendments

### Amendment 1: TournamentHubPage signature simplified further than planned
**Date:** 2026-04-21
**Reason:** After removing the auth redirect, lint revealed that `locale`, `id`, `getLocale`, `toLocale`, and the `Props` type were now unused — they had only been used to construct the redirect URL. A follow-up cleanup commit removed them.
**Change:** `TournamentHubPage(props: Props): Promise<JSX.Element>` (Calls: getLocale, toLocale) → `TournamentHubPage(): JSX.Element` (no params, no calls). The CODE-STRUCTURE pages.md entry was updated accordingly.
