# Plan: Story #291 — Backoffice Users Tab

## Context

The backoffice currently only shows tournament-scoped tabs. Admins have no way to view the
user base from the platform. This story adds a read-only "Users" tab at the end of the
backoffice tab bar, showing a paginated, searchable table of all registered users.

**Branch note:** This story branches from `feature/guidelines-skills-based` (not `main`).
The worktree must be created from that branch and the plan PR must target it.

---

## Story Objectives

- Add a "Users" tab to the backoffice (after all tournament tabs, before Notifications)
- Display a paginated table (25/page) of all registered users
- Client-side search by nickname or email
- Columns: Display name, Email, Login method(s), Role, Email verified
- Read-only — no user actions
- Admin-only (backoffice already enforces `isAdmin`)

---

## Open Questions (Resolved in Plan)

**Registration date:** `UserTable` has NO `created_at` column — Kysely `Identifiable`
only adds `id: Generated<string>`. The story AC lists "Registration date" but the data
doesn't exist in the schema. Plan: **omit the column** for this MVP and note it as
future work (requires a DB migration to add `created_at`). Will not add to plan until
user confirms approach.

**Auth providers:** `auth_providers` JSON array stores `['credentials']`, `['google']`,
`['otp']`, or combinations. We map these to human-readable chips:
- `credentials` → "Password"
- `google` → "Google"
- `otp` → "OTP / Magic Link"

---

## Acceptance Criteria Coverage

| AC | Approach |
|----|----------|
| "Users" tab at end of backoffice bar | Add after tournament tabs in `page.tsx` |
| Paginated table | MUI Table + TablePagination, 25/page, client-side |
| Display name / nickname | `user.nickname ?? "(no nickname)"` |
| Email | `user.email` |
| Registration date | **Omitted** (not in DB schema) |
| Login method(s) | Map `auth_providers` → Chip list |
| Role | `user.is_admin ? "Admin" : "User"` |
| Other directly available fields | `email_verified` boolean |
| Search / filter by name or email | Client-side filter on `nickname + email` |
| No user actions | Read-only table, no buttons |

---

## Technical Approach

**Data fetching:** Server-side pagination and search — the backoffice page does NOT
pre-load users. Instead, `UsersTab` [Client] calls a Server Action on mount and on
every search/page change. This avoids loading the full user list into memory and
scales as the user base grows.

**Repository:** Two new functions in `users-repository.ts`:
- `findUsersPaginated(search, page, pageSize)` — DB-level `ILIKE` filter on
  `nickname` and `email`, `LIMIT`/`OFFSET` for pagination, ordered by email
- `countUsers(search)` — matching `COUNT(*)` for total row count (drives pagination)
  `findAllUsers()` is **not modified** (its existing caller is unaffected).

**Server Action:** New `getUsersPaginated(search, page, pageSize)` in
`app/actions/user-actions.ts` — calls `getLoggedInUser()`, asserts `isAdmin`,
then calls both repo functions in parallel and returns `{ users, total }`.

**Component:** New `UsersTab` [Client] component. No props from server — it manages
its own search, page, loading state and calls the Server Action via `useEffect` with
300 ms debounce on the search string. Resets to page 0 when search changes.

**Sensitive fields:** Never render `password_hash`, `reset_token`, `otp_code`,
`verification_token`, or any credential field. Only render safe display fields.

---

## Files to Create / Modify

| File | Action | Description |
|------|--------|-------------|
| `app/db/users-repository.ts` | **MODIFY** | Add `findUsersPaginated()` and `countUsers()` — DB-level search + pagination |
| `app/actions/user-actions.ts` | **MODIFY** | Add `getUsersPaginated(search, page, pageSize)` Server Action (admin-gated) |
| `app/components/backoffice/users-tab.tsx` | **CREATE** | New `UsersTab` [Client] component — calls Server Action, manages loading/search/page state |
| `app/[locale]/backoffice/page.tsx` | **MODIFY** | Import `UsersTab`, add tab (no user data fetched here) |
| `docs/code-structure/db.md` | **MODIFY** | Document `findUsersPaginated()` and `countUsers()` |
| `docs/code-structure/actions.md` | **MODIFY** | Document `getUsersPaginated()` Server Action |
| `docs/code-structure/components/components-backoffice.md` | **MODIFY** | Document `UsersTab` |
| `docs/code-structure/pages.md` | **MODIFY** | Update `Backoffice()` entry (renders `UsersTab`, no user fetch) |

**`findAllUsers()` is unchanged** — its only caller (`getTournamentPermissionData`) is unaffected. New repo functions are additive.

---

## Visual Prototype

```
┌─────────────────────────────────────────────────────────────────┐
│  [Tournament A] [Tournament B] ... [Users] [Notifications] [+]  │
├─────────────────────────────────────────────────────────────────┤
│  Users                                                           │
│                                                                  │
│  🔍 [Search by name or email...                              ]   │
│                                                                  │
│  ┌──────────────┬──────────────────────┬───────────┬──────────┬─────────┐
│  │ Display Name │ Email                │ Login     │ Role     │ Verified│
│  ├──────────────┼──────────────────────┼───────────┼──────────┼─────────┤
│  │ john_doe     │ john@example.com     │ [Password]│ User     │ ✓       │
│  │ admin_user   │ admin@example.com    │ [Google]  │ Admin    │ ✓       │
│  │ (no nickname)│ magic@example.com    │ [OTP]     │ User     │ ✗       │
│  └──────────────┴──────────────────────┴───────────┴──────────┴─────────┘
│                                                                  │
│  Rows per page: 25 ▾          1–25 of 150    < >               │
└─────────────────────────────────────────────────────────────────┘
```

**MUI components:** `Table`, `TableHead`, `TableBody`, `TableRow`, `TableCell`,
`TablePagination`, `TextField` (search), `Chip` (login methods), `CheckIcon`/`CloseIcon`
(email verified), `Paper` (container), `Typography`.

**Login method chips:** One chip per provider, small size.

---

## Mid-Level Design

### Call Graph Changes

**Modified flows:**
- **Flow (Backoffice page)** — renders `UsersTab` with no user data (no server fetch)
- **Flow (UsersTab → Server Action)** — client-driven, triggered on mount + search/page change

```
Backoffice (Server)
  ├── getLoggedInUser
  ├── findAllTournaments     (existing)
  └── UsersTab [renders]    (NEW — no props, self-fetching)

UsersTab [Client]
  └── getUsersPaginated(search, page, 25)   (Server Action, on mount + change)
        ├── getLoggedInUser
        ├── isAdmin check
        ├── findUsersPaginated(search, page, pageSize)   (NEW repo)
        └── countUsers(search)                           (NEW repo)
```

### `app/[locale]/backoffice/page.tsx` *(modified)*

**Changed functions:**

- **`Backoffice()`**: `JSX.Element` *(existing — extended)*
  Adds `createTab('Users', <UsersTab />)` at the end of the top-level tabs array
  (before the `Notifications` tab). Does NOT call `findAllUsers()` — the component
  fetches its own data via Server Action.
  Renders (new): UsersTab

### `app/db/users-repository.ts` *(modified — additive only)*

**New functions:**

- **`findUsersPaginated(search: string, page: number, pageSize: number)`**:
  `Promise<Pick<User, 'id' | 'email' | 'nickname' | 'is_admin' | 'auth_providers' | 'email_verified'>[]>`
  DB-level filter: `WHERE (nickname ILIKE %search% OR email ILIKE %search%)` (skipped when search is empty).
  `ORDER BY email ASC`, `LIMIT pageSize OFFSET page * pageSize`.

- **`countUsers(search: string)`**: `Promise<number>`
  `SELECT COUNT(*) FROM users WHERE (same filter as above)`. Returns total matching rows
  for pagination.

`findAllUsers()` is **not modified**.

### `app/actions/user-actions.ts` *(modified — additive only)*

**New functions:**

- **`getUsersPaginated(search: string, page: number, pageSize: number)`**:
  `Promise<{ users: UserRow[]; total: number }>`
  Server Action. Calls `getLoggedInUser()`, asserts `user?.isAdmin` (throws if not).
  Calls `findUsersPaginated` and `countUsers` in parallel via `Promise.all`.
  Returns `{ users, total }`.

### `app/components/backoffice/users-tab.tsx` *(new)*

**New functions:**

- **`UsersTab()`**: `JSX.Element`
  [Client] No props. Self-fetching via `getUsersPaginated` Server Action.
  - State: `search: string`, `debouncedSearch: string` (300 ms debounce), `page: number` (0-indexed), `users: UserRow[]`, `total: number`, `loading: boolean`
  - On `debouncedSearch` or `page` change: calls `getUsersPaginated(debouncedSearch, page, 25)`, sets `users` + `total`
  - Resets `page` to 0 when `debouncedSearch` changes
  - Shows loading skeleton/indicator while fetching
  - Login method display: map `user.auth_providers ?? []` to Chip list using `PROVIDER_LABELS`
    - `auth_providers = null | []` → renders "(no login method)" text, no chips
    - Multiple providers → one Chip per provider
  - Role: `user.is_admin ? 'Admin' : 'User'`
  - Email verified: CheckIcon or CloseIcon based on `user.email_verified ?? false`
  - Does NOT render: password_hash, reset_token, otp_code, verification_token, or any credential/token fields
  Tests (mocking `getUsersPaginated`):
  - renders returned users on mount (calls action with empty search, page 0)
  - debounces search input (action not called on every keystroke)
  - calls action with new search term after debounce delay
  - resets page to 0 when search changes
  - shows "(no nickname)" when user.nickname is null
  - renders "Admin" for is_admin=true, "User" for is_admin=false
  - renders one chip per provider in auth_providers (e.g. ['credentials', 'google'] → 2 chips)
  - renders "(no login method)" when auth_providers is null or empty array
  - renders empty state message when action returns empty users array
  - calls action with correct page when user navigates pagination
  - email_verified=null treated same as false (shows CloseIcon)

---

## Implementation Steps

**Wave 1 — Data Layer**
1. Modify `app/db/users-repository.ts`
   - Add `findUsersPaginated(search, page, pageSize)` — Kysely query with optional ILIKE filter, ORDER BY email, LIMIT/OFFSET
   - Add `countUsers(search)` — Kysely COUNT query with same optional filter

**Wave 2 — Server Action**
2. Modify `app/actions/user-actions.ts`
   - Add `getUsersPaginated(search, page, pageSize)` — assert admin, `Promise.all([findUsersPaginated, countUsers])`, return `{ users, total }`

**Wave 3 — Component + Page**
3. Create `app/components/backoffice/users-tab.tsx` [Client]
   - 300 ms debounce on search input
   - `useEffect` calls `getUsersPaginated` on mount and on `debouncedSearch`/`page` change
   - Loading indicator while fetching
   - MUI Table with columns: Display Name, Email, Login Method(s), Role, Verified
   - `TablePagination` driven by `total` from Server Action
   - `PROVIDER_LABELS` constant defined locally: `{ credentials: 'Password', google: 'Google', otp: 'OTP / Magic Link' }`
   - Null/empty `auth_providers` → show "(no login method)" text

4. Modify `app/[locale]/backoffice/page.tsx`
   - Add `import UsersTab from '../../components/backoffice/users-tab'`
   - Add `createTab('Users', <UsersTab />)` after tournament tabs, before `Notifications`
   - No user data fetched in the Server Component

**Wave 4 — CODE-STRUCTURE**
5. Update `docs/code-structure/db.md` — add `findUsersPaginated()` and `countUsers()` entries
6. Update `docs/code-structure/actions.md` — add `getUsersPaginated()` entry
7. Update `docs/code-structure/components/components-backoffice.md` — add `UsersTab` entry
8. Update `docs/code-structure/pages.md` — update `Backoffice()` entry (renders UsersTab, no user fetch)

---

## Testing Strategy

**Scope:** Unit tests for `UsersTab` in isolation — mock `getUsersPaginated` Server Action
so tests are fully synchronous with controlled data. No real DB or auth needed.

**Factories:** `testFactories.user()` does NOT include `auth_providers` or `email_verified`
in its defaults. All test cases that exercise those fields must override them explicitly:
```ts
testFactories.user({ auth_providers: ['credentials'] as unknown as JsonValue })
```

**Mock pattern:**
```ts
vi.mock('@/app/actions/user-actions', () => ({
  getUsersPaginated: vi.fn(),
}))
// In each test:
vi.mocked(getUsersPaginated).mockResolvedValue({ users: [...], total: N })
```

**Test cases** (unit, UsersTab with mocked Server Action):
- renders returned users on mount (calls action with empty search '', page 0, pageSize 25)
- debounces search: rapid typing fires action only once after 300 ms
- calls action with updated search term after debounce fires
- resets to page 0 when search changes
- shows "(no nickname)" when user.nickname is null
- renders "Admin" for is_admin=true, "User" for is_admin=false
- renders one chip per provider (e.g. ['credentials', 'google'] → 2 chips: "Password", "Google")
- renders "(no login method)" when auth_providers is null
- renders "(no login method)" when auth_providers is empty array
- renders empty state message when action returns users: []
- calls action with correct page when user navigates to next page
- email_verified=null treated same as false (shows CloseIcon)

---

## Worktree Setup (Non-Standard)

This story branches from `feature/guidelines-skills-based`, not `main`.

```bash
# Create worktree branching from feature/guidelines-skills-based
git -C /Users/gvinokur/Personal/qatar-prode-guidelines-skills worktree add \
  -b feature/story-291 \
  /Users/gvinokur/Personal/qatar-prode-story-291 \
  feature/guidelines-skills-based

# Copy required files
cp /Users/gvinokur/Personal/qatar-prode-guidelines-skills/.env.local \
   /Users/gvinokur/Personal/qatar-prode-story-291/
cp -r /Users/gvinokur/Personal/qatar-prode-guidelines-skills/.claude/ \
      /Users/gvinokur/Personal/qatar-prode-story-291/
```

Plan PR base: `feature/guidelines-skills-based` (not `main`)

---

## Validation

1. `npm run build` — no TypeScript errors, no lint errors
2. `npm run test` — UsersTab unit tests pass
3. Navigate to `/[locale]/backoffice` → "Users" tab appears at end of tab bar
4. Users table renders with search and pagination working
5. Login method chips show correct labels
6. Sensitive fields (password_hash, tokens) not rendered anywhere in DOM
