# Plan: Google AdSense Monetization — Sidebar (Desktop) and Modal (Mobile) #295

## Story Context

**Issue:** #295 — [Story] Google AdSense monetization — sidebar (desktop) and modal (mobile) with frequency control
**Epic:** —
**Milestone:** UX Audit 2026

## Objective

Monetize free-tier users by showing Google AdSense ads: a sticky right-side sidebar on desktop (using unused horizontal whitespace beside the max-width content column) and a configurable-frequency modal on mobile. Admins control per-user ad-free status and modal frequency settings from the backoffice.

## Acceptance Criteria

- [ ] On desktop, when right-side whitespace is available beside the content column, a Google AdSense display ad appears in the sidebar
- [ ] On mobile/narrow screens, a modal ad can appear with configurable frequency (minutes and/or page views between appearances)
- [ ] The sidebar ad persists across SPA navigation without reloading the layout
- [ ] The modal ad frequency is configurable by admins (min minutes between appearances, min page views between appearances); sensible defaults apply when no config is set (30 min / 10 page views)
- [ ] Ads are only shown to users not marked as ad-free by an admin
- [ ] Admins can toggle a user's ad-free status from the backoffice Users tab
- [ ] Admins can adjust the modal ad frequency settings from the backoffice (new "Ad Settings" tab)
- [ ] If AdSense fails to load (e.g., ad blocker), the layout does not break or show blank gaps
- [ ] Both ad formats render correctly in EN and ES locales

## Technical Approach

### Database

Add `is_ad_free BOOLEAN NOT NULL DEFAULT FALSE` to the `users` table. This avoids extra DB queries per request since the value flows through the session (same pattern as `is_admin`).

Create a singleton `ad_settings` table with `modal_min_minutes_between` (default 30) and `modal_min_pageviews_between` (default 10). A migration seeds one default row. The backoffice fetches and updates this row.

### Session augmentation

Extend `types/next-auth.d.ts`, `auth.ts` (all three `authorize` callbacks + `session`/`jwt` callbacks), to include `isAdFree: boolean`. The locale layout already calls `getLoggedInUser()` so it has the user's `is_ad_free` without an extra fetch.

### AdSense script

Use Next.js `<Script>` (`strategy="afterInteractive"`) in the locale layout `<head>` area to load the AdSense JS (`//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXX`). The publisher client ID comes from `NEXT_PUBLIC_ADSENSE_CLIENT_ID`.

In non-production environments (`process.env.NODE_ENV !== 'production'`), skip the script and render a placeholder styled box so ad slots are visible during development without triggering AdSense policies.

### Desktop sidebar

Wrap `{children}` in the locale layout inside a flex container. The content column keeps `flex: 1` and `minWidth: 0`. `AdSidebar` (Client Component) sits as `flex-shrink: 0` with `width: 300px` and is only visible via CSS `display: { xs: 'none', lg: 'block' }` (i.e., hidden on mobile/tablet). This ensures the layout stays intact on all screens.

`AdSidebar` receives `isAdFree: boolean` as a prop from the Server Component layout. If `isAdFree` is true, it renders `null`. Otherwise it renders the `ins.adsbygoogle` slot. It uses `usePathname` to detect route changes and call `(window.adsbygoogle = window.adsbygoogle || []).push({})` to refresh the ad on each navigation.

Graceful degradation: set `min-height: 0; overflow: hidden` on the `ins` element so an empty slot collapses rather than leaving a blank gap.

### Mobile modal

`AdModalController` is a Client Component placed inside the layout. It:
1. Reads `isAdFree` from `useSession()` (no extra prop drilling needed at this level).
2. Fetches ad settings once on mount via `getAdSettingsAction`.
3. Tracks page views using `usePathname` (increments a `useRef` counter on pathname change).
4. Stores `lastAdShownAt` in `localStorage` to survive page refreshes.
5. Opens a MUI `Dialog` containing the `ins.adsbygoogle` modal slot when both thresholds are met (page views AND minutes elapsed).
6. Only renders on small screens (`display: { xs: 'block', lg: 'none' }` wrapper).

### Backoffice — Users tab

Add an "Ad-Free" column to the users table with a `Switch` component. Toggling calls `toggleUserAdFreeAction(userId, isAdFree)`. Optimistic update on click with error revert.

### Backoffice — Ad Settings tab

New `AdSettingsTab` Client Component with two `TextField` (number) inputs: "Min minutes between modal ads" and "Min page views between modal ads". Calls `getAdSettingsAction` on mount and `updateAdSettingsAction` on save. Added to the backoffice page as "Ad Settings" tab.

## Visual Prototypes

### Component: Desktop Sidebar Ad

**Layout:** Sticky right-side ad column alongside the max-width content. Visible only on `lg+` breakpoints.

```
 Viewport (e.g., 1600px wide)
┌──────────────────────────────────────────────────────────┐
│  Header                                                  │
├───────────────────────────────────┬──────────────────────┤
│                                   │                      │
│   Content column (max 1200px)     │  [AdSense Ad]        │
│                                   │  300 × 250 or        │
│   ...games, leaderboard, etc...   │  300 × 600           │
│                                   │  (sticky)            │
│                                   │                      │
│                                   │                      │
└───────────────────────────────────┴──────────────────────┘
```

**States:**
- Ad-free user: component renders null, full-width layout
- Ad loaded: ad slot renders beside content
- Ad blocker: `ins` element is empty and collapses (min-height: 0)
- Development: colored placeholder box instead of real ad

**Material-UI components:** Box (flex container), Box (sticky ad wrapper)

---

### Component: Mobile Modal Ad

**Layout:** Centered dialog on small screens. Appears after reaching frequency threshold.

```
┌──────────────────────────────────┐
│                               [✕]│
│                                  │
│        [AdSense Ad Unit]         │
│        (responsive/auto)         │
│                                  │
│         [Cerrar anuncio]         │
└──────────────────────────────────┘
```

**States:**
- Not triggered: renders null (no DOM)
- Triggered: MUI Dialog opens with AdSense slot, calls `adsbygoogle.push()` in useEffect
- Ad blocker: dialog opens, ad slot is empty, user can dismiss
- Development: Dialog shows placeholder text instead of real ad

**Material-UI components:** Dialog, DialogContent, DialogActions, Button, IconButton, Box

---

### Component: Users Tab — Ad-Free toggle

**Layout:** New column added to the existing users table. Shows a Switch toggle per user row.

```
┌──────────┬───────────────┬──────────┬──────┬──────────┬─────────┐
│ Name     │ Email         │ Login    │ Role │ Verified │ Ad-Free │
├──────────┼───────────────┼──────────┼──────┼──────────┼─────────┤
│ Alice    │ alice@...     │ Password │ User │   ✓      │  [  ]   │
│ Bob      │ bob@...       │ Google   │ User │   ✓      │  [✓]   │
└──────────┴───────────────┴──────────┴──────┴──────────┴─────────┘
```

---

### Component: Ad Settings Tab

**Layout:** Simple settings form in backoffice.

```
┌──────────────────────────────────────────────┐
│  Ad Settings                                  │
│                                               │
│  Modal Ad Frequency                           │
│  ─────────────────────────────────────────    │
│  Min minutes between appearances: [  30  ]    │
│  Min page views between appearances: [ 10 ]   │
│                                               │
│                          [Save Settings]      │
└──────────────────────────────────────────────┘
```

## Mid-Level Design

### Call Graph Changes

**New flows:**

- **Flow 18 (Ad sidebar)** — `LocaleLayout (Server)` → renders `AdSidebar` [Client] (prop: `isAdFree`). On pathname change, `AdSidebar` calls `adsbygoogle.push()`.
- **Flow 19 (Ad modal)** — `LocaleLayout (Server)` → renders `AdModalController` [Client]. On mount, `AdModalController` calls `getAdSettingsAction`; on frequency threshold, shows `Dialog` with AdSense slot.
- **Flow 20 (Toggle ad-free)** — `UsersTab` [Client] → `toggleUserAdFreeAction` [Server Action] → `updateUser` [repo].
- **Flow 21 (Ad settings CRUD)** — `AdSettingsTab` [Client] → `getAdSettingsAction` / `updateAdSettingsAction` [Server Actions] → `getAdSettings` / `upsertAdSettings` [repo].

**Modified flows:**
- **Flow 17 (Backoffice Users tab)** — extend `UsersTab` to render "Ad-Free" Switch column; `getUsersPaginated` now returns `is_ad_free` field.

---

### `migrations/20260327000000_add_ad_settings.sql` *(new)*

SQL migration adding `is_ad_free` to users and creating `ad_settings` singleton table. No exported functions (raw SQL file).

---

### `app/db/tables-definition.ts` *(modified)*

**Changed interfaces:**

- **UserTable** — add `is_ad_free: boolean` field (non-optional; migration sets NOT NULL DEFAULT FALSE so all existing rows get `false`).
- **AdSettingsTable** (new) — `id: string`, `modal_min_minutes_between: number`, `modal_min_pageviews_between: number`, `created_at: Date`, `updated_at: Date`. The `updated_at` column is managed by a PostgreSQL trigger (`updated_at = NOW()` on every row update), same pattern as other timestamp-bearing tables in the project.
- **AdSettings** = `Selectable<AdSettingsTable>`
- **AdSettingsUpdate** = `Updateable<AdSettingsTable>`

---

### `app/db/ad-settings-repository.ts` *(new)*

**New functions:**

- **getAdSettings()**: `Promise<AdSettings | undefined>`
  Returns the singleton ad settings row. Returns undefined if table is empty (caller uses defaults).
  Tests:
  - returns the settings row when it exists
  - returns undefined when table is empty
  - returns correct field values for a seeded row

- **upsertAdSettings(update: AdSettingsUpdate)**: `Promise<AdSettings>`
  Updates the singleton row (by fixed ID). Creates it if missing.
  Tests:
  - updates modal_min_minutes_between to provided value
  - updates modal_min_pageviews_between to provided value
  - creates row if none exists (first-call scenario)

---

### `app/db/users-repository.ts` *(modified)*

**Changed functions:**

- **findUsersPaginated(search: string, page: number, pageSize: number)**: `Promise<...>` *(was: no is_ad_free in select)*
  Now selects `is_ad_free` in addition to existing fields.
  Tests:
  - (existing tests unchanged)
  - new: returned user rows include is_ad_free field

- **updateUserAdFreeStatus(userId: string, isAdFree: boolean)**: `Promise<User>` *(new)*
  Updates only the `is_ad_free` column for a user. Thin wrapper around `updateUser`. Does not swallow the error — `updateUser` throws if the user is not found, and that error propagates to the caller.
  Tests:
  - sets is_ad_free to true for a target user
  - sets is_ad_free to false for a target user
  - propagates the "user not found" error from updateUser when userId does not exist
  - propagates other database errors (connection failure, constraint violation) without swallowing them

---

### `types/next-auth.d.ts` *(modified)*

Add `isAdFree: boolean` (**required, not optional**) to all three augmented interfaces, mirroring the `is_admin` pattern (not `preferred_locale` which is optional/nullable). DB column is NOT NULL DEFAULT FALSE so `false` is always a valid value:
- `Session["user"]`: add `isAdFree: boolean`
- `User`: add `isAdFree: boolean`
- `JWT`: add `isAdFree: boolean`

---

### `auth.ts` *(modified)*

Add `isAdFree: user.is_ad_free || false` in all four auth paths and the session callback:
1. **Password `authorize`** — reads from `user.is_ad_free` after DB lookup.
2. **OTP `authorize`** — reads from `result.user.is_ad_free` after `verifyOTP`.
3. **Google `signIn` callback** — reads from `existingOAuthUser.is_ad_free` (existing OAuth account path), `updatedUser.is_ad_free` (account-merge path), and `newUser.is_ad_free` (new user path).
4. **`session` callback** — add `isAdFree` to the `pick` call alongside existing fields.

Note: the `is_ad_free` column has NOT NULL DEFAULT FALSE, so all three Google paths can safely use `user.is_ad_free || false`.

---

### `app/actions/user-actions.ts` *(modified)*

**New functions:**

- **toggleUserAdFreeAction(userId: string, isAdFree: boolean)**: `Promise<void>`
  Server Action. Admin-only. Toggles the ad-free status of a given user.
  Calls: getLoggedInUser, updateUserAdFreeStatus
  Tests:
  - throws Unauthorized when caller is not admin
  - updates is_ad_free to true for target user
  - updates is_ad_free to false for target user

---

### `app/actions/ad-settings-actions.ts` *(new)*

**New functions:**

- **getAdSettingsAction()**: `Promise<{ modalMinMinutesBetween: number; modalMinPageviewsBetween: number }>`
  Server Action (no auth required — settings are public for modal frequency decisions). Returns settings with hard-coded defaults (30 min, 10 pageviews) applied when row is missing. Does not throw on DB error — catches and returns defaults to avoid breaking ad visibility.
  Calls: getAdSettings
  Tests:
  - returns hard-coded defaults (30, 10) when settings row does not exist
  - returns stored values when settings row exists
  - camelCases the returned fields correctly (modal_min_minutes_between → modalMinMinutesBetween)
  - catches any error from getAdSettings and returns defaults without re-throwing (graceful degradation; no logging required — ad visibility must not break for DB issues)

- **updateAdSettingsAction(minMinutes: number, minPageviews: number)**: `Promise<void>`
  Server Action. Admin-only. Persists modal frequency settings. Validation (values must be ≥ 0) happens inside this action (not delegated to the component) — throws `Error('Invalid values')` for negative numbers.
  Calls: getLoggedInUser, upsertAdSettings
  Tests:
  - throws Unauthorized when caller is not admin
  - persists minMinutes value via upsertAdSettings
  - persists minPageviews value via upsertAdSettings
  - throws Error('Invalid values') when minMinutes < 0 or minPageviews < 0

---

### `app/components/ads/ad-sidebar.tsx` *(new)*

**New components:**

- **AdSidebar({ isAdFree }: { isAdFree: boolean }): JSX.Element** [Client]
  Sticky right-side 300px ad panel. Hidden on xs/sm/md, visible on lg+. Renders null when isAdFree. Calls `adsbygoogle.push()` on each pathname change to refresh the ad. In dev mode renders a colored placeholder box instead of an `ins` element.
  Uses: usePathname, useEffect
  Renders: Box (sticky wrapper), ins.adsbygoogle or placeholder
  Tests:
  - renders null when isAdFree is true
  - renders the ad container when isAdFree is false
  - renders placeholder box in development environment
  - is hidden on small screens (sx display prop)

---

### `app/components/ads/ad-modal-controller.tsx` *(new)*

**New components:**

- **AdModalController(): JSX.Element | null** [Client]
  Global modal ad orchestrator. Reads isAdFree from session, fetches ad settings once on mount, tracks page views via pathname, stores lastAdShownAt in localStorage. Opens MUI Dialog with AdSense slot when both min-minutes and min-pageviews thresholds are met. Resets counter and saves timestamp on close. Renders null for ad-free users or on large screens.
  Uses: useSession, usePathname, useEffect, useRef, useState
  Calls: getAdSettingsAction
  Renders: Dialog, DialogContent, DialogActions, Button, ins.adsbygoogle or placeholder
  Tests:
  - renders null when user is ad-free
  - does not open modal before page view threshold is reached (simulate N-1 pathname changes)
  - does not open modal before minutes threshold is reached (mock Date.now() to control elapsed time)
  - opens modal when both thresholds are met (page views AND minutes)
  - resets page view counter to 0 after showing modal (re-render with next pathname, no premature re-open)
  - calls localStorage.setItem with correct key and timestamp when modal closes
  - reads lastAdShownAt from localStorage on mount and uses stored value in threshold calculation
  - does not open modal twice when both thresholds crossed simultaneously (modal opens exactly once)
  - handles minPageviews=0 and minMinutes=0 (opens immediately on first route change)
  - renders null and does not crash when getAdSettingsAction throws (falls back to default thresholds of 30/10)

---

### `app/components/backoffice/users-tab.tsx` *(modified)*

**Changed components:**

- **UsersTab()**: `JSX.Element` *(add Ad-Free column)*
  Add "Ad-Free" table header column. For each user row, render a `Switch` toggling `is_ad_free`. On toggle, call `toggleUserAdFreeAction`; optimistically update local state; revert on error.
  Calls: getUsersPaginated, toggleUserAdFreeAction
  Tests:
  - renders Ad-Free column header
  - renders Switch checked when user.is_ad_free is true
  - toggling Switch calls toggleUserAdFreeAction with correct userId and new value
  - reverts switch state on action failure

---

### `app/components/backoffice/ad-settings-tab.tsx` *(new)*

**New components:**

- **AdSettingsTab(): JSX.Element** [Client]
  Backoffice form with two number inputs for modal frequency. Fetches current settings on mount via getAdSettingsAction. Saves via updateAdSettingsAction on button click. Shows success/error Snackbar.
  Uses: useState, useEffect
  Calls: getAdSettingsAction, updateAdSettingsAction
  Renders: TextField (minMinutes), TextField (minPageviews), Button, Snackbar, Alert, Paper, Typography
  Tests:
  - renders fields pre-populated with fetched settings
  - calls updateAdSettingsAction with correct values on save
  - shows success snackbar after successful save
  - shows error snackbar on action failure

---

### `app/[locale]/layout.tsx` *(modified)*

**Changes:**
- Import `Script` from `'next/script'` and add AdSense script (`strategy="afterInteractive"`, only when `NEXT_PUBLIC_ADSENSE_CLIENT_ID` is set).
- Wrap `{children}` in a flex `Box` with `AdSidebar` beside it.
- Add `AdModalController` inside providers (needs session).

---

### `app/[locale]/backoffice/page.tsx` *(modified)*

**Changes:**
- Import `AdSettingsTab`.
- Add `createTab('Ad Settings', <AdSettingsTab />)` to the top-level tabs array.

## Files to Create/Modify

**Create:**
- `migrations/20260327000000_add_ad_settings.sql` — adds `is_ad_free` to users, creates `ad_settings` table
- `app/db/ad-settings-repository.ts` — getAdSettings, upsertAdSettings
- `app/actions/ad-settings-actions.ts` — getAdSettingsAction, updateAdSettingsAction
- `app/components/ads/ad-sidebar.tsx` — desktop sticky sidebar Client Component
- `app/components/ads/ad-modal-controller.tsx` — mobile modal orchestrator Client Component
- `app/components/backoffice/ad-settings-tab.tsx` — admin modal frequency settings form

**Modify:**
- `migrations/` — new file (see create)
- `app/db/tables-definition.ts` — add is_ad_free to UserTable; add AdSettingsTable
- `app/db/users-repository.ts` — add is_ad_free to findUsersPaginated select; add updateUserAdFreeStatus
- `types/next-auth.d.ts` — add isAdFree to Session, User, JWT
- `auth.ts` — propagate isAdFree through all authorize paths and session callback
- `app/actions/user-actions.ts` — add toggleUserAdFreeAction; extend getUsersPaginated return type
- `app/[locale]/layout.tsx` — AdSense Script, flex wrapper, AdModalController
- `app/components/backoffice/users-tab.tsx` — add Ad-Free Switch column
- `app/[locale]/backoffice/page.tsx` — add "Ad Settings" tab

**CODE-STRUCTURE layer files to update:**
- `docs/code-structure/db.md` — add ad-settings-repository.ts; update users-repository.ts entries
- `docs/code-structure/actions.md` — add ad-settings-actions.ts; update user-actions.ts
- `docs/code-structure/components/components-backoffice.md` — update users-tab.tsx; add ad-settings-tab.tsx
- `docs/code-structure/components/components-shared-ui.md` — add AdSidebar, AdModalController
- `docs/code-structure/pages.md` — update locale layout

## Implementation Steps

1. **DB + Types** — Migration, table definition, next-auth types, auth.ts session propagation
   - Files: `migrations/20260327000000_add_ad_settings.sql`, `app/db/tables-definition.ts`, `types/next-auth.d.ts`, `auth.ts`
   - Dependencies: none

2. **DB repositories** — Ad settings repo + users repo changes
   - Files: `app/db/ad-settings-repository.ts`, `app/db/users-repository.ts`
   - Dependencies: Step 1 (table definitions must exist)

3. **Server actions** — Ad settings actions + user toggle action
   - Files: `app/actions/ad-settings-actions.ts`, `app/actions/user-actions.ts`
   - Dependencies: Step 2

4. **Ad components** — AdSidebar + AdModalController
   - Files: `app/components/ads/ad-sidebar.tsx`, `app/components/ads/ad-modal-controller.tsx`
   - Dependencies: Step 3 (for getAdSettingsAction)

5. **Layout integration** — AdSense script + flex wrapper + modal controller in layout
   - Files: `app/[locale]/layout.tsx`
   - Dependencies: Step 4

6. **Backoffice** — Users tab Ad-Free toggle + AdSettingsTab + backoffice page
   - Files: `app/components/backoffice/users-tab.tsx`, `app/components/backoffice/ad-settings-tab.tsx`, `app/[locale]/backoffice/page.tsx`
   - Dependencies: Step 3

7. **Tests** — Unit and component tests for all new code
   - Dependencies: Steps 1-6

8. **CODE-STRUCTURE updates** — Update layer files in same commit as source changes
   - Files: docs/code-structure layer files (update per-step as code is written)
   - Dependencies: Each step

## Testing Strategy

**Unit tests (Vitest):**
- `app/db/ad-settings-repository.ts` — all functions; use `createMockSelectQuery` / Kysely mock helpers (consistent with existing repo test pattern — no real DB in unit tests)
- `app/db/users-repository.ts` — `updateUserAdFreeStatus`, updated `findUsersPaginated`; same mock pattern
- `app/actions/ad-settings-actions.ts` — `getAdSettingsAction` (defaults when repo returns undefined), `updateAdSettingsAction` (auth check + validation); mock via `vi.mock('../db/ad-settings-repository')`
- `app/actions/user-actions.ts` — `toggleUserAdFreeAction` (auth check, value propagation); `testFactories.createUser({ is_ad_free: false })` for setup

**Test factories:**
- Extend `testFactories.createUser()` to accept `is_ad_free` field (default `false`)
- Add `testFactories.createAdSettings({ modal_min_minutes_between, modal_min_pageviews_between })` for ad settings seed data

**Component tests (Vitest + @testing-library/react):**
- `AdSidebar` — renders null for ad-free; renders container for non-ad-free; dev placeholder
- `AdModalController` — threshold logic; localStorage integration; modal open/close; error fallback
- `UsersTab` — Ad-Free column renders; Switch toggle calls action; optimistic update/revert
- `AdSettingsTab` — fetches on mount; save propagates values; snackbar feedback

**Component test mock patterns:**
- `useSession` — `vi.mock('next-auth/react', () => ({ useSession: () => ({ data: { user: { isAdFree: true/false } } }) }))`
- `usePathname` — `vi.mock('next/navigation', () => ({ usePathname: () => '/test-path' }))`
- Server Actions — `vi.mock('../actions/ad-settings-actions', () => ({ getAdSettingsAction: vi.fn() }))` (return data or throw)
- `localStorage` — `vi.spyOn(Storage.prototype, 'getItem'/'setItem')` or global `localStorageMock` if already defined in test setup

**Coverage target:** ≥80% on new code

## Validation Considerations

- **SonarCloud:** No direct DB queries in actions. The `toggleUserAdFreeAction` and both ad-settings actions have admin auth guards. `getAdSettingsAction` is intentionally unauthenticated (frequency config is public — no sensitive data).
- **Security:** Admin-only actions check `getLoggedInUser()?.isAdmin`. No user-facing mutation is exposed without auth.
- **Coverage:** Repository functions are pure DB wrappers; test with test factories + in-memory or integration DB. Modal logic (localStorage, page view counting) is unit-testable by mocking `usePathname` and localStorage.
- **AdSense policy compliance:** Ads only shown to non-bot traffic; do not render in dev/test environments (placeholder instead).
- **Environment variable:** `NEXT_PUBLIC_ADSENSE_CLIENT_ID` must be set in production `.env.local`; if absent, no AdSense script loads and no real ads render (no broken layout).

## Open Questions

- [ ] **AdSense client ID and slot IDs:** What are the real `ca-pub-XXXX`, sidebar slot ID, and modal slot ID values? (Implementation can use env vars with placeholders; admins fill in real values.)
- [ ] **Ad refresh behavior:** Should the sidebar ad refresh on every SPA navigation (higher impressions) or stay static (less intrusive)? Default plan: refresh on navigation for revenue maximization.
- [ ] **Modal ad-free for unauthenticated users:** Spec says "ads only shown to users not marked as ad-free by admin" — unauthenticated visitors (no session) should see ads. Current plan: show ads when `isAdFree === false || no session`. Confirm?

## Implementation Amendments

*(Added during implementation when deviations from plan are discovered)*
