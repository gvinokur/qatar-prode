# Implementation Plan: Shortened Invitation URLs (Story #235)

## Context

Currently, friend group invitation URLs are long and unwieldy:
- `https://prodemundial.app/tournaments/123/friend-groups/join/456`

This makes them:
- Harder to share via text/messaging
- Less professional looking
- Difficult to communicate verbally

This plan implements URL shortening to create cleaner, more shareable links:
- `https://prodemundial.app/j/abc123`

## Story Requirements

### User Stories
1. **As a Group Admin:** Share a short, memorable link that includes tournament context automatically and never expires
2. **As a User Receiving Invitation:** Click a clean, short link that takes me directly to the join page with clear error messages if invalid

### Acceptance Criteria
- ✅ Generate unique 6-character alphanumeric short codes (cryptographically random)
- ✅ Store mapping: short_code → group_id + tournament_id
- ✅ `/j/{code}` redirects to tournament-scoped or global join page
- ✅ Preserve locale in redirect (e.g., `/en/j/abc123` → `/en/tournaments/...`)
- ✅ Return 404 if code not found
- ✅ Track clicks/visits for analytics
- ✅ Update invite dialog to show shortened URL
- ✅ Copy button and WhatsApp button use shortened URL
- ✅ Short links never expire (permanent)

## Technical Approach

### Design Decisions

**1. Short Code Generation: Random Alphanumeric (Recommended)**
- Generate random 6-character codes using `crypto.randomBytes`
- Base62 encoding (a-z, A-Z, 0-9) = 62^6 = 56 billion combinations
- Check for collision, regenerate if exists (extremely unlikely)
- **Pros:** Hard to guess, no sequential enumeration, secure
- **Cons:** Slightly more complex generation logic

**2. Tournament Context: Always Include (Recommended)**
- Store both `group_id` AND `tournament_id` in mapping
- Redirect to tournament-scoped join page when available
- Fall back to global join page if no tournament
- **Better UX:** User lands directly in tournament context

**3. One Short URL Per Group (Simpler)**
- One canonical short code per group (reusable across sharing contexts)
- Simpler data model: lookup by `group_id` only
- Easier to manage and display in UI
- **Tournament context updates automatically:** When short URL is requested with a new tournament, the stored `tournament_id` updates to reflect current context
- **Example:** Group first used in World Cup 2026 → later used in Copa America 2027 → short URL updates to redirect to Copa America
- **Note:** Same group = same short code, but redirect target updates to current tournament
- **Trade-off:** Click tracking is cumulative across all tournaments (acceptable)
- **Implementation:** `getOrCreateShortUrl()` updates `tournament_id` if it changed since last use

**4. Track Analytics: Yes**
- Add `click_count` column to track visits
- Increment on each redirect
- Useful for future analytics/insights

**5. Path-based Route: `/j/{code}` (Easier)**
- No DNS configuration needed
- Works immediately
- Consistent with existing routing structure

### Visual Prototypes

#### Component: Invite Friends Dialog

**Current State (Before):**
```
┌─────────────────────────────────────────────────────────┐
│  Share Friend Group: "World Cup 2026 Squad"             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Invitation Link:                                        │
│  ┌────────────────────────────────────────────────┐     │
│  │ https://prodemundial.app/tournaments/123/      │ [📋] │
│  │ friend-groups/join/456789abcdef                │     │
│  └────────────────────────────────────────────────┘     │
│                                                          │
│  Share via:                                              │
│  ┌──────────────┐                                        │
│  │ 💬 WhatsApp  │                                        │
│  └──────────────┘                                        │
│                                                          │
│                                    [Close]               │
└─────────────────────────────────────────────────────────┘
```

**New State (After - Loading):**
```
┌─────────────────────────────────────────────────────────┐
│  Share Friend Group: "World Cup 2026 Squad"             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Invitation Link:                                        │
│  ┌────────────────────────────────────────────────┐     │
│  │ Generating link...                             │ [📋] │
│  │                                                │     │
│  └────────────────────────────────────────────────┘     │
│                                                          │
│  Share via:                                              │
│  ┌──────────────┐                                        │
│  │ 💬 WhatsApp  │  (disabled)                            │
│  └──────────────┘                                        │
│                                                          │
│                                    [Close]               │
└─────────────────────────────────────────────────────────┘
```

**New State (After - Loaded):**
```
┌─────────────────────────────────────────────────────────┐
│  Share Friend Group: "World Cup 2026 Squad"             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Invitation Link:                                        │
│  ┌────────────────────────────────────────────────┐     │
│  │ https://prodemundial.app/j/abc123              │ [📋] │
│  │                                                │     │
│  └────────────────────────────────────────────────┘     │
│                                                          │
│  Share via:                                              │
│  ┌──────────────┐                                        │
│  │ 💬 WhatsApp  │                                        │
│  └──────────────┘                                        │
│                                                          │
│                                    [Close]               │
└─────────────────────────────────────────────────────────┘
```

**New State (After - Error Fallback):**
```
┌─────────────────────────────────────────────────────────┐
│  Share Friend Group: "World Cup 2026 Squad"             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Invitation Link:                                        │
│  ┌────────────────────────────────────────────────┐     │
│  │ https://prodemundial.app/tournaments/123/      │ [📋] │
│  │ friend-groups/join/456789abcdef                │     │
│  └────────────────────────────────────────────────┘     │
│  ⚠️  Using fallback URL (short link unavailable)        │
│                                                          │
│  Share via:                                              │
│  ┌──────────────┐                                        │
│  │ 💬 WhatsApp  │                                        │
│  └──────────────┘                                        │
│                                                          │
│                                    [Close]               │
└─────────────────────────────────────────────────────────┘
```

**Layout Details:**

**Dialog Container:**
- Material-UI Dialog component (existing)
- Title: "Share Friend Group: {groupName}"
- Content padding: 24px
- Max width: 600px

**URL Display Field:**
- Material-UI TextField (existing)
- Variant: outlined
- Read-only: true
- Full width
- Font family: monospace (for better URL readability)
- End adornment: Copy icon button

**Copy Button:**
- Material-UI IconButton
- Icon: ContentCopy
- Position: End of TextField (InputAdornment)
- onClick: Copy shortUrl to clipboard
- Show tooltip "Copied!" on success

**WhatsApp Share Button:**
- Material-UI Button
- Variant: contained
- Color: success (green)
- Start icon: WhatsApp logo
- Text: "Share via WhatsApp" (i18n)
- onClick: Open WhatsApp with pre-filled message containing shortUrl

**Component States:**

| State | URL Field | Copy Button | WhatsApp Button | Additional UI |
|-------|-----------|-------------|-----------------|---------------|
| **Loading** | "Generating link..." | Enabled (but ineffective) | Disabled | Loading indicator (optional) |
| **Loaded** | `https://prodemundial.app/j/abc123` | Enabled | Enabled | None |
| **Error (Fallback)** | Long URL (fallback) | Enabled | Enabled | Warning text below field |

**Behavior:**

1. **On Dialog Open:**
   - Set loading state to true
   - Call `generateShortUrlForGroup(groupId, tournamentId)` server action
   - Display "Generating link..." in TextField
   - Disable WhatsApp button

2. **On Success:**
   - Set shortUrl state
   - Display short URL in TextField
   - Enable WhatsApp button
   - Set loading state to false

3. **On Error:**
   - Log error to console
   - Fall back to long URL (existing behavior)
   - Display long URL in TextField
   - Show warning message below field
   - Enable WhatsApp button (with fallback URL)
   - Set loading state to false

4. **Copy Button Click:**
   - Copy current URL (short or fallback) to clipboard
   - Show "Copied!" tooltip/snackbar

5. **WhatsApp Button Click:**
   - Encode message with shortUrl
   - Open WhatsApp Web/App with pre-filled message

**Material-UI Components Used:**
- Dialog (container)
- DialogTitle (title)
- DialogContent (content area)
- DialogActions (close button area)
- TextField (URL display)
- InputAdornment (copy button container)
- IconButton (copy action)
- Button (WhatsApp share)
- Typography (warning text if error)
- Tooltip (copy feedback)

**Responsive Considerations:**
- **Desktop:** Dialog centered, 600px max width
- **Tablet:** Dialog full width, 90% viewport width
- **Mobile:** Dialog full screen, full width
- URL TextField: Always full width, text overflow with ellipsis if too long

**Accessibility:**
- TextField has label "Invitation Link"
- Copy button has aria-label "Copy link to clipboard"
- WhatsApp button has clear text label
- Loading state announced to screen readers
- Error message is associated with TextField

### Database Schema

**New table: `short_urls`**

**Migration file: `migrations/YYYYMMDD_create_short_urls_table.sql`**

```sql
-- Migration: Create short_urls table for URL shortening feature
-- Story #235: Shortened Invitation URLs

CREATE TABLE short_urls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) NOT NULL,
  group_id UUID NOT NULL REFERENCES prode_groups(id) ON DELETE CASCADE,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  click_count INTEGER NOT NULL DEFAULT 0
);

-- Indexes for performance
CREATE UNIQUE INDEX idx_short_urls_code ON short_urls(code);
CREATE UNIQUE INDEX idx_short_urls_group ON short_urls(group_id);  -- One short URL per group
CREATE INDEX idx_short_urls_tournament ON short_urls(tournament_id);  -- For analytics queries

-- Comments for documentation
COMMENT ON TABLE short_urls IS 'Shortened URLs for friend group invitations';
COMMENT ON COLUMN short_urls.code IS 'Unique 6-character alphanumeric code for the short URL';
COMMENT ON COLUMN short_urls.group_id IS 'Friend group this short URL points to (one per group)';
COMMENT ON COLUMN short_urls.tournament_id IS 'Tournament context when URL was created (nullable, preserved for analytics)';
COMMENT ON COLUMN short_urls.click_count IS 'Number of times this short URL has been accessed';
```

**Key design notes:**
- `code` is VARCHAR(10) to allow for future expansion beyond 6 characters
- `tournament_id` is nullable to support global groups
- `ON DELETE CASCADE` for group_id (if group deleted, remove short URL)
- `ON DELETE SET NULL` for tournament_id (if tournament deleted, short URL still works but redirects to global join)
- Unique constraint on `code` prevents duplicate codes
- **Unique constraint on `group_id`** ensures one short URL per group (critical for "one per group" design)
- Index on `tournament_id` for analytics queries (which groups were created in which tournament)

### Code Generation Algorithm

```typescript
import crypto from 'crypto';

function generateShortCode(): string {
  const base62 = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const codeLength = 6;
  let code = '';

  // Generate 6 random characters from base62 alphabet
  const bytes = crypto.randomBytes(codeLength);
  for (let i = 0; i < codeLength; i++) {
    code += base62[bytes[i] % 62];
  }

  return code;
}

// Repository function with collision handling
async function createShortUrl(groupId: string, tournamentId?: string): Promise<ShortUrl> {
  const maxAttempts = 5;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateShortCode();

    try {
      return await db.insertInto('short_urls')
        .values({
          code,
          group_id: groupId,
          tournament_id: tournamentId,
          click_count: 0
        })
        .returningAll()
        .executeTakeFirstOrThrow();
    } catch (error) {
      // If unique constraint violation, try again
      if (isUniqueConstraintError(error) && attempt < maxAttempts - 1) {
        continue;
      }
      throw error;
    }
  }

  throw new Error('Failed to generate unique short code after multiple attempts');
}
```

### Redirect Route Implementation

**New file: `app/[locale]/j/[code]/page.tsx`**

Server Component that:
1. Extracts `code` from params
2. Looks up code in database
3. Increments click count
4. Gets group_id and tournament_id
5. Redirects using Next.js `redirect()` with locale preservation

```typescript
import { redirect, notFound } from 'next/navigation';
import { getShortUrlByCode, incrementClickCount } from '@/app/db/short-url-repository';

type Props = {
  readonly params: Promise<{ locale: string; code: string }>;
};

export default async function ShortUrlRedirect(props: Props) {
  const params = await props.params;
  const { locale, code } = params;

  // Look up short URL
  const shortUrl = await getShortUrlByCode(code);

  if (!shortUrl) {
    notFound(); // Returns 404
  }

  // Increment click count (fire-and-forget to avoid blocking redirect)
  // NOTE: This may miss some clicks if request is cancelled/terminated early, but it's acceptable trade-off for redirect speed
  incrementClickCount(code).catch(console.error);

  // Build redirect URL with locale preservation
  let redirectPath: string;
  if (shortUrl.tournament_id) {
    // Tournament-scoped join
    redirectPath = `/${locale}/tournaments/${shortUrl.tournament_id}/friend-groups/join/${shortUrl.group_id}`;
  } else {
    // Global join
    redirectPath = `/${locale}/friend-groups/join/${shortUrl.group_id}`;
  }

  redirect(redirectPath);
}
```

**Note on locale preservation:**
- The `[locale]` parameter is automatically captured from the route structure
- Pass it directly to redirect URL construction
- Middleware will handle validation and fallback if locale is invalid

### Repository Layer

**New file: `app/db/short-url-repository.ts`**

```typescript
import { db } from './database';
import { ShortUrl, ShortUrlNew, ShortUrlTable } from './tables-definition';
import { createBaseFunctions } from './base-repository';
import { cache } from 'react';
import crypto from 'crypto';

// Base CRUD operations
const baseFunctions = createBaseFunctions<ShortUrlTable, ShortUrl>('short_urls');
export const findShortUrlById = baseFunctions.findById;
export const deleteShortUrl = baseFunctions.delete;

// Find by code (NO caching - called during redirect which doesn't work well with React cache)
export async function getShortUrlByCode(code: string): Promise<ShortUrl | undefined> {
  return db
    .selectFrom('short_urls')
    .selectAll()
    .where('code', '=', code)
    .executeTakeFirst();
}

// Find existing short URL for group (one per group, ignoring tournament context)
export const getShortUrlForGroup = cache(async (groupId: string): Promise<ShortUrl | undefined> => {
  return db
    .selectFrom('short_urls')
    .selectAll()
    .where('group_id', '=', groupId)
    .executeTakeFirst();
});

// Generate short code
function generateShortCode(): string {
  const base62 = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const codeLength = 6;
  let code = '';

  const bytes = crypto.randomBytes(codeLength);
  for (let i = 0; i < codeLength; i++) {
    code += base62[bytes[i] % 62];
  }

  return code;
}

// Create short URL with collision handling
export async function createShortUrl(
  groupId: string,
  tournamentId?: string
): Promise<ShortUrl> {
  const maxAttempts = 5;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateShortCode();

    try {
      return await db
        .insertInto('short_urls')
        .values({
          code,
          group_id: groupId,
          tournament_id: tournamentId ?? null,
          click_count: 0
        })
        .returningAll()
        .executeTakeFirstOrThrow();
    } catch (error: any) {
      // Check for unique constraint violation
      const isUniqueViolation = error?.code === '23505' ||
                               error?.constraint === 'idx_short_urls_code';

      if (isUniqueViolation && attempt < maxAttempts - 1) {
        continue; // Try again with new code
      }
      throw error;
    }
  }

  throw new Error('Failed to generate unique short code after multiple attempts');
}

// Get or create short URL (upsert pattern - one per group)
export async function getOrCreateShortUrl(
  groupId: string,
  tournamentId?: string
): Promise<ShortUrl> {
  // Look up by group_id only (one short URL per group)
  const existing = await getShortUrlForGroup(groupId);

  if (existing) {
    // If tournament context changed, UPDATE the short URL to point to new tournament
    // This ensures users are redirected to the CURRENT tournament, not the original one
    if (existing.tournament_id !== tournamentId) {
      return await db
        .updateTable('short_urls')
        .set({ tournament_id: tournamentId ?? null })
        .where('id', '=', existing.id)
        .returningAll()
        .executeTakeFirstOrThrow();
    }
    return existing;
  }

  // Create new short URL with tournament context
  return createShortUrl(groupId, tournamentId);
}

// Increment click count (fire-and-forget)
export async function incrementClickCount(code: string): Promise<void> {
  await db
    .updateTable('short_urls')
    .set(eb => ({
      click_count: eb('click_count', '+', 1)
    }))
    .where('code', '=', code)
    .execute();
}
```

### Server Actions

**New file: `app/actions/short-url-actions.ts`**

```typescript
'use server';

import { getOrCreateShortUrl } from '@/app/db/short-url-repository';
import { ShortUrl } from '@/app/db/tables-definition';

/**
 * Get or create a short URL for a friend group
 * @param groupId - The friend group ID
 * @param tournamentId - Optional tournament context
 * @returns Short URL object with code
 */
export async function generateShortUrlForGroup(
  groupId: string,
  tournamentId?: string
): Promise<ShortUrl> {
  return getOrCreateShortUrl(groupId, tournamentId);
}

/**
 * Build full short URL for display/sharing
 * @param code - The short code
 * @returns Full URL (e.g., https://prodemundial.app/j/abc123)
 */
export function buildShortUrl(code: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://prodemundial.app';
  return `${baseUrl}/j/${code}`;
}
```

### UI Integration

**Modified file: `app/components/invite-friends-dialog.tsx`**

Changes needed:
1. Import server action: `generateShortUrlForGroup`, `buildShortUrl`
2. Add state for short URL loading
3. Fetch short URL on component mount (or when dialog opens)
4. Replace long URL display with short URL
5. Update copy button to use short URL
6. Update WhatsApp button to use short URL

```typescript
'use client';

import { useState, useEffect } from 'react';
import { generateShortUrlForGroup, buildShortUrl } from '@/app/actions/short-url-actions';

export function InviteFriendsDialog({
  groupId,
  groupName,
  tournamentId,
  trigger
}: {
  groupId: string;
  groupName: string;
  tournamentId?: string;
  trigger: React.ReactNode;
}) {
  const [shortUrl, setShortUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const locale = useLocale(); // Get current locale for fallback URL

  useEffect(() => {
    async function fetchShortUrl() {
      try {
        setLoading(true);
        const result = await generateShortUrlForGroup(groupId, tournamentId);
        const fullUrl = buildShortUrl(result.code);
        setShortUrl(fullUrl);
      } catch (error) {
        console.error('Failed to generate short URL:', error);
        // Fallback to long URL WITH LOCALE PRESERVATION
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const fallbackUrl = tournamentId
          ? `${baseUrl}/${locale}/tournaments/${tournamentId}/friend-groups/join/${groupId}`
          : `${baseUrl}/${locale}/friend-groups/join/${groupId}`;
        setShortUrl(fallbackUrl);
      } finally {
        setLoading(false);
      }
    }

    fetchShortUrl();
  }, [groupId, tournamentId, locale]);

  // Update TextField to show shortUrl
  // Update copy button to use shortUrl
  // Update WhatsApp button to use shortUrl

  return (
    <Dialog>
      {/* ... */}
      <TextField
        value={loading ? 'Generating link...' : shortUrl}
        InputProps={{
          readOnly: true,
          endAdornment: (
            <InputAdornment>
              <IconButton onClick={() => copyToClipboard(shortUrl)}>
                <ContentCopy />
              </IconButton>
            </InputAdornment>
          )
        }}
      />
      {/* ... WhatsApp button with shortUrl */}
    </Dialog>
  );
}
```

**Alternative approach (if performance is concern):**
- Pass short URL as prop from parent Server Component
- Generate short URL during initial page load
- Avoids client-side async call

### Type Definitions

**Modified file: `app/db/tables-definition.ts`**

Add new table type:

```typescript
export interface ShortUrlTable extends Identifiable {
  code: string;
  group_id: string;
  tournament_id: string | null;
  created_at: Date;
  click_count: number;
}

export type ShortUrl = Selectable<ShortUrlTable>;
export type ShortUrlNew = Insertable<ShortUrlTable>;
export type ShortUrlUpdate = Updateable<ShortUrlTable>;
```

**Modified file: `app/db/database.ts`**

Add to Database interface:

```typescript
export interface Database {
  // ... existing tables
  short_urls: ShortUrlTable;
}
```

## Implementation Steps

### Phase 1: Database & Repository (Foundation)
1. ✅ Create migration: `migrations/YYYYMMDD_create_short_urls_table.sql`
2. ✅ Add table types to `tables-definition.ts`
3. ✅ Update `database.ts` interface
4. ✅ Create `short-url-repository.ts` with CRUD operations
5. ✅ Create `short-url-actions.ts` server actions

### Phase 2: Redirect Route (Core Functionality)
6. ✅ Create catch-all route: `app/[locale]/j/[code]/page.tsx`
7. ✅ Implement redirect logic with locale preservation
8. ✅ Handle 404 for invalid codes
9. ✅ Implement click tracking (fire-and-forget)

### Phase 3: UI Integration (User-Facing)
10. ✅ Update `invite-friends-dialog.tsx` to fetch short URL
11. ✅ Replace long URL display with short URL
12. ✅ Update copy button functionality
13. ✅ Update WhatsApp share button

### Phase 4: Testing & Validation
14. ✅ Create unit tests for short code generation
15. ✅ Create unit tests for repository functions
16. ✅ Create integration tests for redirect flow
17. ✅ Test collision handling (low probability, but defensive)
18. ✅ Test locale preservation in redirects
19. ✅ Manual testing: Generate short URL, copy, share, verify redirect

## Files to Create

| File | Purpose | Estimated Lines |
|------|---------|----------------|
| `migrations/YYYYMMDD_create_short_urls_table.sql` | Database schema | ~30 |
| `app/db/short-url-repository.ts` | Repository layer | ~150 |
| `app/actions/short-url-actions.ts` | Server actions | ~30 |
| `app/[locale]/j/[code]/page.tsx` | Redirect route | ~40 |
| `app/db/__tests__/short-url-repository.test.ts` | Repository tests | ~200 |
| `app/[locale]/j/[code]/__tests__/page.test.tsx` | Route tests | ~150 |

**Total new code: ~600 lines**

## Files to Modify

| File | Changes | Estimated Changes |
|------|---------|------------------|
| `app/db/tables-definition.ts` | Add ShortUrl types | +10 lines |
| `app/db/database.ts` | Add short_urls to Database interface | +1 line |
| `app/components/invite-friends-dialog.tsx` | Fetch and display short URL | ~50 lines modified |

**Total modifications: ~60 lines**

## Testing Strategy

### Unit Tests

**Repository Tests (`app/db/__tests__/short-url-repository.test.ts`):**
- ✅ `generateShortCode()` produces 6-character codes
- ✅ `generateShortCode()` only uses base62 characters (a-z, A-Z, 0-9)
- ✅ `createShortUrl()` inserts into database
- ✅ `createShortUrl()` handles collisions (mock collision scenario)
- ✅ `createShortUrl()` throws after maxAttempts exceeded
- ✅ `createShortUrl()` handles unique constraint violation on code
- ✅ `createShortUrl()` handles unique constraint violation on group_id (one per group)
- ✅ `getShortUrlByCode()` retrieves correct mapping
- ✅ `getShortUrlByCode()` returns undefined for invalid code
- ✅ `getShortUrlForGroup()` finds existing URL by group_id only
- ✅ `getShortUrlForGroup()` ignores tournament_id parameter (one per group)
- ✅ `getOrCreateShortUrl()` returns existing if tournament context unchanged
- ✅ `getOrCreateShortUrl()` creates new if missing
- ✅ `getOrCreateShortUrl()` UPDATES tournament_id if tournament context changed
- ✅ `getOrCreateShortUrl()` stores tournament_id for current tournament
- ✅ `incrementClickCount()` updates click_count
- ✅ `incrementClickCount()` handles database errors gracefully
- ✅ Collision handling retries up to maxAttempts

**Server Action Tests (`app/actions/__tests__/short-url-actions.test.ts`):**
- ✅ `generateShortUrlForGroup()` calls repository correctly
- ✅ `buildShortUrl()` constructs correct URL format

### Integration Tests

**Redirect Route Tests (`app/[locale]/j/[code]/__tests__/page.test.tsx`):**
- ✅ Valid code redirects to tournament-scoped join page
- ✅ Valid code redirects to global join page (no tournament)
- ✅ Invalid code returns 404
- ✅ Code with special characters returns 404
- ✅ Empty code returns 404
- ✅ Locale is preserved in redirect URL (EN)
- ✅ Locale is preserved in redirect URL (ES)
- ✅ Click count is incremented on redirect
- ✅ Redirect works even if click count fails (fire-and-forget)
- ✅ Redirect handles deleted tournament (tournament_id NULL, redirects to global join)
- ✅ Redirect handles deleted group (returns 404)

### Manual Testing Checklist

- [ ] Create a friend group
- [ ] Open invite dialog in EN locale
- [ ] Verify short URL is displayed (format: `https://prodemundial.app/j/abc123`)
- [ ] Verify URL is same regardless of tournament context (one per group)
- [ ] Click copy button, verify clipboard contains short URL (not long URL)
- [ ] Click WhatsApp button, verify message contains short URL (not long URL)
- [ ] Open short URL in browser with EN locale (`/en/j/abc123`)
- [ ] Verify redirect to correct join page with EN locale preserved
- [ ] Open same short URL in browser with ES locale (`/es/j/abc123`)
- [ ] Verify redirect to correct join page with ES locale preserved
- [ ] Test with tournament-scoped group
- [ ] Test with global group (no tournament)
- [ ] Test invalid code (expect 404)
- [ ] Test malformed code with special characters (expect 404)
- [ ] Check database: verify click_count increments after each redirect
- [ ] Simulate server error (disable database), verify fallback URL shows in dialog with locale
- [ ] Verify fallback URL in error case preserves locale (not `/tournaments/...` but `/en/tournaments/...`)

## Edge Cases & Error Handling

| Scenario | Handling |
|----------|----------|
| **Short code collision** | Retry up to 5 times with new random code, throw error if all fail |
| **Invalid code** | Return 404 using Next.js `notFound()` |
| **Group deleted** | Cascade delete removes short_urls entry (ON DELETE CASCADE) |
| **Tournament deleted** | Set tournament_id to NULL (ON DELETE SET NULL), redirect to global join |
| **Tournament context changes** | Update tournament_id to new tournament when short URL is requested (ensures redirect to current tournament) |
| **Click tracking fails** | Fire-and-forget, don't block redirect if increment fails (may lose some click counts, acceptable trade-off) |
| **Click tracking across tournaments** | click_count is cumulative across all tournaments for a group (acceptable, simplifies analytics) |
| **Server action fails** | Fallback to long URL in invite dialog |

## Validation Considerations

### SonarCloud Requirements
- **80% test coverage on new code:** All files have comprehensive unit + integration tests
- **0 new issues:**
  - Use TypeScript strict mode (no `any` types)
  - Proper error handling in repository
  - No security vulnerabilities (crypto.randomBytes is secure)
  - No code duplication

### Performance
- **No caching on redirect lookup:** `getShortUrlByCode` doesn't use `cache()` since it's called during redirect (doesn't work well with React cache)
- **Database index optimization:** Unique index on `code` provides O(1) lookup performance
- **Click tracking:** Fire-and-forget async update to avoid blocking redirect (may miss some clicks if request terminates early)
- **Database indexes:** Unique index on `code`, unique index on `group_id` (one per group), index on `tournament_id` (analytics)
- **Redirect performance target:** < 200ms end-to-end (database lookup + redirect)

### Security
- **Cryptographically secure random:** Use `crypto.randomBytes`, not `Math.random()`
- **No enumeration:** Random codes prevent users from guessing valid codes
- **Cascade deletes:** Prevent orphaned short URLs
- **SQL injection:** Kysely provides parameterized queries

## Open Questions

### Resolved (Design Decisions Made)
1. ~~Should short URLs include tournament context?~~ → **YES** (store tournament_id for analytics, but lookup by group_id only)
2. ~~One short URL per group, or per group+tournament combo?~~ → **One per group** (unique constraint on group_id, same code regardless of where shared)
3. ~~Should we track analytics?~~ → **YES** (click_count column, tournament_id stored for analytics)
4. ~~Subdomain vs. path?~~ → **Path** (`/j/{code}`)
5. ~~Caching strategy?~~ → **No cache on redirect lookup** (doesn't work with React cache during redirect), database index provides sufficient performance

### For User Confirmation
None - all design decisions have been made based on story requirements and best practices.

## Dependencies

- ✅ None (independent feature)
- ✅ Uses existing infrastructure: Kysely, Next.js App Router, next-intl

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Short code collision** | Very Low | Medium | Retry logic with 5 attempts, 62^6 = 56B combinations |
| **Migration failure** | Low | High | Test migration on dev database first, have rollback ready |
| **Performance degradation** | Low | Medium | Add indexes, cache lookups, fire-and-forget click tracking |
| **User confusion (new URL format)** | Low | Low | Keep old URLs working, show short URL prominently |

## Success Criteria

- ✅ All acceptance criteria met
- ✅ 80%+ test coverage on new code
- ✅ 0 SonarCloud issues
- ✅ Manual testing passes
- ✅ Short URLs work in production
- ✅ Redirect performance < 200ms
- ✅ No breaking changes to existing invitation flow

## Estimated Effort

**Medium (2-3 days)**
- Day 1: Database, repository, server actions, tests
- Day 2: Redirect route, UI integration, integration tests
- Day 3: Testing, bug fixes, validation, deployment

## Notes

- Short codes are case-sensitive (e.g., `Abc123` ≠ `abc123`)
- Short URLs are permanent and never expire
- **Tournament context updates automatically:** When a group is used in multiple tournaments, the short URL redirects to the most recently used tournament
- **Click tracking is cumulative:** click_count tracks total clicks across all tournaments (not per-tournament)
- Migration is safe: new table, no changes to existing schema
- Backward compatible: old long URLs continue to work
