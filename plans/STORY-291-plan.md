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

**Data fetching:** Call `findAllUsers()` directly in the backoffice Server Component —
same pattern as `findAllTournaments()` already in that file. No new Server Action needed
(the page already enforces `isAdmin`, and `findAllUsers` is a pure read).

**Component:** New `UsersTab` [Client] component. Receives `users: User[]` as props
(server fetches, client renders). Uses `useState` for search term and current page.

**Sensitive fields:** Never render `password_hash`, `reset_token`, `otp_code`,
`verification_token`, or any credential field. Only render safe display fields.

---

## Files to Create / Modify

| File | Action | Description |
|------|--------|-------------|
| `app/db/users-repository.ts` | **MODIFY** | Extend `findAllUsers()` to also select `auth_providers` and `email_verified` |
| `app/components/backoffice/users-tab.tsx` | **CREATE** | New `UsersTab` [Client] component |
| `app/[locale]/backoffice/page.tsx` | **MODIFY** | Import `UsersTab`, fetch users, add tab |
| `docs/code-structure/db.md` | **MODIFY** | Update `findAllUsers()` entry to reflect new fields |
| `docs/code-structure/components/components-backoffice.md` | **MODIFY** | Document `UsersTab` |
| `docs/code-structure/pages.md` | **MODIFY** | Update `Backoffice()` entry (new call + render) |

**Why extend `findAllUsers()`:** The current implementation selects only `['id', 'email', 'nickname', 'is_admin']`. The Users tab needs `auth_providers` (for login method display) and `email_verified` (for verified column). Both are non-sensitive display fields. The existing caller (`getTournamentPermissionData`) is unaffected by extra fields on the returned objects.

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
- **Flow (Backoffice page)** — add `findAllUsers` call and render `UsersTab` [Client]

```
Backoffice (Server)
  ├── getLoggedInUser
  ├── findAllTournaments     (existing)
  ├── findAllUsers           (NEW — for Users tab)
  └── UsersTab [renders]    (NEW)
        └── client-side: useState for search + pagination
```

### `app/[locale]/backoffice/page.tsx` *(modified)*

**Changed functions:**

- **`Backoffice()`**: `JSX.Element` *(existing — extended)*
  Now also calls `findAllUsers()` and adds `createTab('Users', <UsersTab users={users} />)` at the
  end of the top-level tabs array (before the `Notifications` tab).
  Calls (new): findAllUsers
  Renders (new): UsersTab

### `app/db/users-repository.ts` *(modified)*

**Changed functions:**

- **`findAllUsers()`**: `Promise<Pick<User, 'id' | 'email' | 'nickname' | 'is_admin' | 'auth_providers' | 'email_verified'>[]>` *(was: only id/email/nickname/is_admin)*
  Now also selects `auth_providers` and `email_verified` for use in admin Users tab.
  Existing caller (`getTournamentPermissionData`) is unaffected.

### `app/components/backoffice/users-tab.tsx` *(new)*

**New functions:**

- **`UsersTab({ users }: UsersTabProps)`**: `JSX.Element`
  [Client] Renders a paginated, searchable, read-only table of all users.
  - Props: `users: Array<Pick<User, 'id' | 'email' | 'nickname' | 'is_admin' | 'auth_providers' | 'email_verified'>>`
  - State: `search: string`, `page: number` (0-indexed), `rowsPerPage: 25`
  - Derived: `filteredUsers` = users filtered by `nickname` OR `email` containing `search` (case-insensitive)
  - Login method display: map `user.auth_providers ?? []` to Chip list using `PROVIDER_LABELS`
    - `auth_providers = null | []` → renders "(no login method)" text, no chips
    - Multiple providers → one Chip per provider
  - Role: `user.is_admin ? 'Admin' : 'User'`
  - Email verified: CheckIcon or CloseIcon based on `user.email_verified ?? false`
  - Does NOT render: password_hash, reset_token, otp_code, verification_token, or any credential/token fields
  Tests (using `testFactories.user()`):
  - renders all users when search is empty
  - filters users by nickname (case-insensitive)
  - filters users by email (case-insensitive)
  - shows "(no nickname)" when user.nickname is null
  - renders "Admin" for is_admin=true users, "User" for is_admin=false
  - renders one chip per entry in auth_providers (e.g. ['credentials', 'google'] → 2 chips: "Password", "Google")
  - renders "(no login method)" when auth_providers is null
  - renders "(no login method)" when auth_providers is empty array
  - renders empty state message when no users match the search term
  - paginates correctly: page 2 shows users 26–50 from filteredUsers
  - email_verified=null renders same as false (CloseIcon)

---

## Implementation Steps

**Wave 1 — Data Layer**
1. Modify `app/db/users-repository.ts`
   - In `findAllUsers()`, extend `.select([...])` to also include `'auth_providers'` and `'email_verified'`

**Wave 2 — Component + Page**
2. Create `app/components/backoffice/users-tab.tsx` [Client]
   - Search TextField (immediate filter, no debounce needed)
   - MUI Table with columns: Display Name, Email, Login Method(s), Role, Verified
   - TablePagination at 25/page
   - `PROVIDER_LABELS` constant defined locally at top of file (not imported): `{ credentials: 'Password', google: 'Google', otp: 'OTP / Magic Link' }`
   - Null/empty `auth_providers` → show "(no login method)" text

3. Modify `app/[locale]/backoffice/page.tsx`
   - Add `import UsersTab from '../../components/backoffice/users-tab'`
   - Call `const users = await findAllUsers()` inside `Backoffice()`
   - Add `createTab('Users', <UsersTab users={users} />)` after tournament tabs, before `Notifications`

**Wave 3 — CODE-STRUCTURE**
4. Update `docs/code-structure/db.md` — update `findAllUsers()` entry (new fields)
5. Update `docs/code-structure/components/components-backoffice.md` — add `UsersTab` entry
6. Update `docs/code-structure/pages.md` — update `Backoffice()` entry

---

## Testing Strategy

**Scope:** Unit tests for `UsersTab` in isolation — the component receives `users` as a prop, no
data fetching occurs inside it (purely presentational; no loading/error states needed). Auth
redirect is already enforced by the page (`isAdmin` check) and is not retested here.

**Factories:** `testFactories.user()` does NOT include `auth_providers` in its defaults. All test
cases that exercise login method rendering must override it explicitly:
```ts
testFactories.user({ auth_providers: ['credentials'] as unknown as ... })
// or use the JSON cast pattern used elsewhere in the test suite
```

**Test cases** (unit, UsersTab in isolation):
- renders all users when search is empty
- filters users by nickname (case-insensitive)
- filters users by email (case-insensitive)
- shows "(no nickname)" when user.nickname is null
- renders "Admin" for is_admin=true, "User" for is_admin=false
- renders one chip per provider in auth_providers (e.g. ['credentials', 'google'] → 2 chips)
- renders "(no login method)" when auth_providers is null
- renders "(no login method)" when auth_providers is empty array
- renders empty state message when no users match the search term
- paginates: when filteredUsers.length ≥ 26, page 2 shows users at indices 25–49
- paginates: when filteredUsers.length < 26, navigating to page 2 shows empty table
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
