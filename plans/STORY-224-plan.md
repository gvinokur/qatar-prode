# Story #224: Public Groups with Discovery

## Context

Story #223 (Unified Join Request System) is complete. It established:
- `prode_group_join_requests` table with `request_source` supporting `'discovery'`
- Join request workflow (create, approve, reject, cancel)
- Admin tabs in `[group_id]/page.tsx` with sections for Join Requests, Betting, Theme
- Email notifications for requests

Story #224 adds public/private visibility to groups and a discovery page for users to browse and join public groups.

**WORKTREE:** `/Users/gvinokur/Personal/qatar-prode-story-224`
**BRANCH:** `feature/story-224`
**PLAN FILE:** `/Users/gvinokur/Personal/qatar-prode-story-224/plans/STORY-224-plan.md`

---

## Objectives

1. Add `is_public` and `description` columns to `prode_groups` table
2. Privacy settings UI for group admins (toggle + description + preview)
3. Privacy indicator icons (lock/globe) throughout the app
4. Public groups discovery page with search and pagination
5. "Browse Public Groups" link in the join group dialog
6. Request to join from discovery (reusing existing `requestToJoinGroup` with `source='discovery'`)

---

## Acceptance Criteria Summary

- Owner/admin can toggle group between public/private in Admin tab
- Description required when making group public
- Confirmation dialog when making group private (warns about rejected discovery requests)
- Privacy indicator icons (lock/globe) on group headers and cards
- Discovery page at `/[locale]/tournaments/[id]/friend-groups/discover`
- Discovery page is guest-accessible (no auth required to browse)
- Search by group name (debounced 500ms, URL-synced)
- Pagination (20 groups per page, URL-synced)
- "Request to Join" → creates request with source='discovery' or shows login prompt for guests
- "Browse Public Groups" link in join group dialog

---

## Technical Approach

### 1. Database Migration

New file: `migrations/20260228_add_group_public_fields.sql`

```sql
ALTER TABLE prode_groups
  ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN description TEXT,
  ADD CONSTRAINT chk_description_length CHECK (char_length(description) <= 500);

-- Partial index for efficient public group queries
CREATE INDEX idx_prode_groups_is_public
  ON prode_groups(is_public)
  WHERE is_public = true;

-- Index for efficient case-insensitive name search on public groups
CREATE INDEX idx_prode_groups_name_public
  ON prode_groups(LOWER(name))
  WHERE is_public = true;

-- Index for created_at ordering
CREATE INDEX idx_prode_groups_created_at_public
  ON prode_groups(created_at DESC)
  WHERE is_public = true;
```

All existing groups default to `is_public = FALSE` (backward compatible, no data loss).

### 2. TypeScript Types

Update `app/db/tables-definition.ts`:
```typescript
export interface ProdeGroupTable extends Identifiable {
  owner_user_id: string
  name: string
  theme?: JSONColumnType<Theme>
  is_public?: boolean        // NEW: default false in DB
  description?: string | null  // NEW: nullable TEXT, max 500 chars
}
```

### 3. Repository Layer

Update `app/db/prode-group-repository.ts`:

**New functions:**
- `findPublicGroups(searchTerm?: string, limit = 20, offset = 0)` — Single JOIN query returning paginated public groups with owner info and member count. Kysely uses parameterized bindings by default (SQL injection safe). Returns:
  ```typescript
  Array<{
    id: string; name: string; description: string | null; is_public: boolean;
    theme?: Theme; created_at: Date;
    owner: { id: string; name: string };
    memberCount: number;
  }>
  ```
- `countPublicGroups(searchTerm?: string)` — Returns `number` total for pagination (same WHERE clause as findPublicGroups). Cap result at max 100 pages worth (2000 groups) to avoid expensive COUNT on huge datasets.
- `updateGroupPrivacy(groupId: string, isPublic: boolean, description?: string | null)` — Wrapped in a DB transaction: (1) updates `prode_groups` row, (2) if `isPublic = false`, bulk-rejects all pending requests with `request_source = 'discovery'` for this group (sets status='rejected', resolved_at=NOW()). Does NOT affect `invite_link` or `email_invite` requests.

### 4. Server Actions

**New file:** `app/actions/prode-group-discovery-actions.ts`
- `getPublicGroupsAction(searchTerm?: string, page = 1)` — No auth required; validates `page >= 1` and `page <= 100` (DoS prevention); returns `{ groups, totalCount, currentPage, totalPages }` (20 per page)
- Note: Join requests from discovery reuse existing `requestToJoinGroup(groupId, 'discovery', locale, tournamentId)` from story #223 — no new join action needed

**Update:** `app/actions/prode-group-actions.ts`
- `updateGroupPrivacyAction(groupId: string, isPublic: boolean, description?: string)` — Owner/admin only; validates with Zod: description required + ≤500 chars when isPublic=true; calls repository in transaction; returns success message

**Discovery Page Data Fetching Pattern (separation of concerns):**
The `discover/page.tsx` server component composes data from two separate sources:
1. `getPublicGroupsAction(searchTerm, page)` → raw group list
2. `getUserJoinRequests()` (from story #223, if user is logged in) → user's pending/approved requests
3. Server component merges: for each group, compute `userStatus: 'none' | 'pending' | 'member'` by matching group_id against user's requests + checking if user is a participant
4. Passes `initialGroups` (with userStatus per group) to `PublicGroupsBrowser` client component

**Guest UX for Discovery:**
- Guest can browse freely — no auth redirect from server component
- Clicking "Request to Join" on a card: `PublicGroupCard` checks if `currentUserId` is null → redirects to `/[locale]/login?returnUrl=/[locale]/tournaments/[id]/friend-groups/discover`

### 5. New Components

| Component | Purpose |
|-----------|---------|
| `app/components/friend-groups/privacy-indicator-icon.tsx` | Lock/Globe icon with tooltip. Props: `isPublic: boolean`, `size?: 'small' \| 'medium'` |
| `app/components/friend-groups/group-privacy-settings.tsx` | Privacy toggle section for admin tab. Props: `groupId`, `initialIsPublic`, `initialDescription` |
| `app/components/friend-groups/public-group-preview-dialog.tsx` | Preview dialog showing how group appears in discovery. Props: `open`, `onClose`, `group` |
| `app/components/friend-groups/public-group-card.tsx` | Single group card for discovery. Props: `group`, `userStatus: 'none' \| 'pending' \| 'member'`, `onRequestToJoin` |
| `app/components/friend-groups/public-groups-browser.tsx` | Client component: search bar + grid + pagination. Props: `initialGroups`, `initialSearchTerm`, `initialPage`, `totalPages`, `tournamentId`, `currentUserId?` |

### 6. Updated Components/Pages

- **`app/[locale]/tournaments/[id]/friend-groups/[group_id]/page.tsx`** — Add `PrivacyIndicatorIcon` next to group name; add `GroupPrivacySettings` as Section 3 in admin tab (between Betting and Theme)
- **`app/components/tournament-page/tournament-groups-list.tsx`** — Add `PrivacyIndicatorIcon` to group cards
- **`app/components/tournament-page/join-group-dialog.tsx`** — Add "Browse Public Groups" button/link at bottom; navigates to `/tournaments/[id]/friend-groups/discover`
- **`TournamentGroupStats` type in `app/definitions.ts`** — Add `is_public?: boolean` so privacy indicator can be shown in tournament group cards

### 7. New Page

`app/[locale]/tournaments/[id]/friend-groups/discover/page.tsx`

- Server Component (no auth redirect — tournament layout handles guests gracefully)
- Fetches initial public groups server-side
- Reads `searchParams.search` and `searchParams.page` for URL state
- Passes `currentUserId` (from `getLoggedInUser()`) for button state
- Also needs to fetch user's join requests to determine `userStatus` per group

```
Route: /[locale]/tournaments/[id]/friend-groups/discover?search=...&page=...
```

**Note:** `discover` is a static segment — it takes Next.js routing priority over `[group_id]` dynamic segment. No conflict.

### 8. i18n Updates

Add to `locales/en/groups.json` and `locales/es/groups.json` under `groups.privacy` and `groups.discovery`:

```json
{
  "privacy": {
    "public": "Public",
    "private": "Private",
    "settingsTitle": "Privacy Settings",
    "description": "Description",
    "descriptionPlaceholder": "Describe your group to help others decide if they want to join...",
    "descriptionHelper": "Visible when users browse public groups (max 500 characters)",
    "descriptionRequired": "Description is required for public groups",
    "previewInDiscovery": "Preview in Discovery",
    "makePrivateConfirm": "Making your group private will remove it from discovery. Pending discovery-based requests will be rejected. Continue?",
    "makePublicTip": "Your group will be visible to everyone in the discovery page",
    "saveSettings": "Save Settings",
    "saved": "Privacy settings saved",
    "tooltip": {
      "public": "Public Group",
      "private": "Private Group"
    }
  },
  "discovery": {
    "title": "Discover Public Groups",
    "subtitle": "Find and join friend groups",
    "searchPlaceholder": "Search groups by name...",
    "noResults": "No public groups found",
    "noResultsSearch": "No groups matching \"{search}\"",
    "browsePublicGroups": "Or browse public groups to find one to join",
    "memberCount": "{count} member",
    "memberCount_plural": "{count} members",
    "leaderInfo": "Led by {name} with {points} pts",
    "createdBy": "Created by {name}",
    "requestToJoin": "Request to Join",
    "pending": "Request Pending",
    "viewGroup": "View Group",
    "readMore": "Read more",
    "readLess": "Read less",
    "loginToJoin": "Sign in to join this group"
  },
  "pagination": {
    "previous": "Previous",
    "next": "Next",
    "pageInfo": "Page {current} of {total}"
  }
}
```

---

## Visual Prototypes

### Discovery Page Layout

```
┌─────────────────────────────────────────────────────────┐
│ [Tournament AppBar]                                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Discover Public Groups                                 │
│  Find and join friend groups                            │
│                                                         │
│  [🔍 Search groups by name...                        ]  │
│                                                         │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ │
│  │ 🌐 Group Name  │ │ 🌐 Group Name  │ │ 🌐 Group Name  │ │
│  │               │ │               │ │               │ │
│  │ Description   │ │ Description   │ │ Description   │ │
│  │ truncated...  │ │ truncated...  │ │ truncated...  │ │
│  │               │ │               │ │               │ │
│  │ 👥 12 members │ │ 👥 8 members  │ │ 👥 20 members │ │
│  │ 🏆 Led by X   │ │ 🏆 Led by Y   │ │ 🏆 Led by Z   │ │
│  │ by Owner Name │ │ by Owner Name │ │ by Owner Name │ │
│  │               │ │               │ │               │ │
│  │[Request Join] │ │  [Pending ✓]  │ │ [View Group →]│ │
│  └───────────────┘ └───────────────┘ └───────────────┘ │
│                                                         │
│         ← Previous  |  Page 1 of 5  |  Next →          │
└─────────────────────────────────────────────────────────┘
Mobile: 1 column grid
Tablet: 2 column grid
Desktop: 3 column grid
```

### Privacy Settings (Admin Tab - Section 3)

```
┌────────────────────────────────────────────────────┐
│ 🔒 Privacy Settings                                │
├────────────────────────────────────────────────────┤
│                                                    │
│  Group Visibility                                  │
│  ○ Private                 ● Public               │
│                                                    │
│  (Visible when Public selected:)                   │
│  Description *                                     │
│  ┌──────────────────────────────────────────────┐ │
│  │ Tell others about your group and why they    │ │
│  │ should join...                               │ │
│  └──────────────────────────────────────────────┘ │
│  45 / 500                                         │
│                                                    │
│  [👁 Preview in Discovery]       [Save Settings]  │
│                                                    │
│  ℹ️ Your group will be visible to all users        │
└────────────────────────────────────────────────────┘
```

### Privacy Indicator Icon Usage

- In group header (next to group name): `🔒` or `🌐` with tooltip
- In tournament group cards: small icon in top-right corner
- In discovery cards: `🌐` always shown (only public groups appear)

---

## Files to Create

1. `migrations/20260228_add_group_public_fields.sql`
2. `app/components/friend-groups/privacy-indicator-icon.tsx`
3. `app/components/friend-groups/group-privacy-settings.tsx`
4. `app/components/friend-groups/public-group-preview-dialog.tsx`
5. `app/components/friend-groups/public-group-card.tsx`
6. `app/components/friend-groups/public-groups-browser.tsx`
7. `app/actions/prode-group-discovery-actions.ts`
8. `app/[locale]/tournaments/[id]/friend-groups/discover/page.tsx`

## Files to Modify

1. `app/db/tables-definition.ts` — Add `is_public`, `description` to `ProdeGroupTable`
2. `app/db/prode-group-repository.ts` — Add 3 new functions
3. `app/actions/prode-group-actions.ts` — Add `updateGroupPrivacyAction`
4. `app/[locale]/tournaments/[id]/friend-groups/[group_id]/page.tsx` — Privacy indicator + privacy settings section
5. `app/components/tournament-page/tournament-groups-list.tsx` — Privacy indicator on cards
6. `app/components/tournament-page/join-group-dialog.tsx` — "Browse Public Groups" link
7. `app/definitions.ts` — Add `is_public` to `TournamentGroupStats`
8. `locales/en/groups.json` — Add privacy + discovery keys
9. `locales/es/groups.json` — Add translated keys

---

## Implementation Steps

### Phase 1: Foundation (DB + Types + Repository)
1. Create database migration (`20260228_add_group_public_fields.sql`)
2. Update `tables-definition.ts` — add `is_public` and `description` to `ProdeGroupTable`
3. Update `prode-group-repository.ts` — add `findPublicGroups`, `countPublicGroups`, `updateGroupPrivacy`
4. Update `app/definitions.ts` — add `is_public` to `TournamentGroupStats`

### Phase 2: Server Actions
5. Create `prode-group-discovery-actions.ts` with `getPublicGroupsAction`
6. Add `updateGroupPrivacyAction` to `prode-group-actions.ts`

### Phase 3: Core UI Components
7. Create `privacy-indicator-icon.tsx`
8. Create `public-group-card.tsx`
9. Create `public-group-preview-dialog.tsx`
10. Create `group-privacy-settings.tsx`
11. Create `public-groups-browser.tsx`

### Phase 4: Discovery Page + Integration
12. Create `discover/page.tsx`
13. Update `[group_id]/page.tsx` — add privacy indicator + privacy settings section
14. Update `tournament-groups-list.tsx` — add privacy indicator
15. Update `join-group-dialog.tsx` — add "Browse Public Groups" link

### Phase 5: i18n
16. Add keys to `locales/en/groups.json` and `locales/es/groups.json`
   ⚠️ **Do this BEFORE building components** — add placeholder keys first in Phase 1 to prevent runtime errors during development

### Phase 6: Tests (parallel)
17. Repository tests (`prode-group-repository.test.ts`):
    - `findPublicGroups()` — returns only public groups; not private groups
    - `findPublicGroups('term')` — ILIKE filter, case-insensitive
    - `findPublicGroups(undefined, 20, 20)` — pagination offset
    - `countPublicGroups()` — returns correct total
    - `updateGroupPrivacy(id, true, 'desc')` — sets is_public=true, description
    - `updateGroupPrivacy(id, false)` — sets is_public=false; rejects ONLY 'discovery' requests; leaves 'invite_link' requests untouched; sets resolved_at on rejected requests
18. Action tests (`prode-group-discovery-actions.test.ts`, `prode-group-actions.test.ts`):
    - `getPublicGroupsAction()` — returns paginated data, no auth needed
    - `getPublicGroupsAction()` with page=101 — returns error (DoS limit)
    - `updateGroupPrivacyAction()` — requires owner/admin
    - `updateGroupPrivacyAction(id, true, undefined)` — error: description required
    - `updateGroupPrivacyAction(id, true, 'x'.repeat(501))` — error: too long
    - Non-owner calling `updateGroupPrivacyAction` — throws unauthorized
19. Component tests:
    - `PrivacyIndicatorIcon` — LockIcon for private; PublicIcon for public; correct tooltip text
    - `PublicGroupCard` — "Request to Join" for status='none'; "Pending" (disabled) for status='pending'; "View Group" for status='member'; null user → redirects to login on click
    - `GroupPrivacySettings` — description field hidden when toggle=private; shown+required when toggle=public; preview dialog opens on preview click
    - `PublicGroupsBrowser` — renders search input; renders group grid; renders pagination; search input calls onSearch callback

---

## Key Design Decisions

### Discovery Reuses Existing Join Request Infrastructure
`requestToJoinGroup(groupId, 'discovery', locale, tournamentId)` from story #223 already handles the discovery source. No new join action needed.

### Guest Access on Discovery Page
The tournament layout does NOT enforce authentication (handles `user = null` gracefully). The `discover/page.tsx` will call `getLoggedInUser()` without redirecting on null. Guests see groups; clicking "Request to Join" shows a login prompt or redirects to login.

### Static Route Priority
`/friend-groups/discover` (static segment) takes priority over `/friend-groups/[group_id]` (dynamic segment) in Next.js App Router. No conflict.

### Rejection Cascade When Making Private
`updateGroupPrivacy(groupId, false)` will also reject all pending requests with `request_source = 'discovery'` for that group. Requests from `invite_link` or `email_invite` remain pending.

### No Redis Caching
The project doesn't appear to use Redis. Server-side rendering is used without special caching for the discovery page MVP. Can be added later if performance is an issue.

### Zod Validation
Description field validated with Zod in the server action:
- Max 500 characters
- Required when `isPublic = true`
- Sanitized to prevent XSS

---

## Testing Strategy

### Repository Tests (`prode-group-repository.test.ts`)
- `findPublicGroups()` — returns only public groups, not private
- `findPublicGroups('search')` — filters by name case-insensitively
- `findPublicGroups(undefined, 20, 20)` — pagination offset works
- `countPublicGroups()` — returns correct total
- `updateGroupPrivacy(groupId, true, 'desc')` — sets is_public=true
- `updateGroupPrivacy(groupId, false)` — sets is_public=false, rejects discovery-sourced pending requests, leaves invite_link requests untouched

### Action Tests
- `getPublicGroupsAction()` — no auth required, returns paginated results
- `getPublicGroupsAction('term', 2)` — applies search and page correctly
- `updateGroupPrivacyAction()` — requires owner/admin, validates description required for public, calls repository

### Component Tests
- `PrivacyIndicatorIcon` — renders LockIcon for private, PublicIcon for public; shows correct tooltip
- `PublicGroupCard` — "Request to Join" for status='none', "Pending" for status='pending', "View Group" for status='member'
- `GroupPrivacySettings` — description field shows/hides based on toggle; "Save" button calls action; preview dialog opens
- `PublicGroupsBrowser` — renders grid, search input, pagination; search updates URL

---

## Open Questions / Assumptions

1. **`definitions.ts` location of `TournamentGroupStats`**: Assumed to be in `app/definitions.ts` — verify during implementation and update `is_public` field there too.
2. **join-group-dialog tournament ID**: Assumed the dialog has access to `tournamentId` for the "Browse" link — verify props during implementation.
3. **Group leader info in discovery**: `calculateTournamentGroupStats` computes leader info per-tournament. The discovery page can optionally include leader info by calculating top scorer across ALL tournaments the group has, or simply omit it. For MVP: show member count and owner name only; skip leader info on discovery page (add as enhancement later).
4. **Description markdown rendering**: For MVP, render as plain text with line breaks. Full markdown rendering (react-markdown) can be added later.
5. **"created_at" column**: `ProdeGroupTable` may not have `created_at` — verify and add to migration or use `id` for ordering if needed.

## Verification / End-to-End Testing

After implementation:
1. Run migration on dev DB: `psql $DATABASE_URL -f migrations/20260228_add_group_public_fields.sql`
2. Create a group, navigate to admin tab → Privacy Settings section should appear
3. Toggle to public, add description, save → group appears in discovery page
4. Browse `/[locale]/tournaments/[id]/friend-groups/discover` as guest → groups visible, "Request to Join" redirects to login
5. Log in, browse discovery → "Request to Join" creates request, button changes to "Pending"
6. As admin, toggle group to private → confirm dialog appears; after confirm, pending discovery requests are rejected
7. Search for group name → results filter correctly; URL updates with `?search=`; pagination works
