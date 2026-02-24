# Implementation Plan: Active Tournaments as App Home (#207)

## Story Context

**Objective:** Transform the app home page (/) into a tournament-centric experience by automatically redirecting users to an active tournament. Support multiple active tournaments with a switcher, persist user's tournament selection, provide discovery notifications for new tournaments, and handle the case when no tournaments are active.

**Why:** Currently, users land on "/" and see a list of tournament cards. This adds an extra click before engaging with tournament content. By redirecting directly to an active tournament, we reduce friction and create a more focused user experience.

**Target Users:** Both authenticated and unauthenticated users

**Dependencies:** ✅ Story #205 (Tournament public access) - Already merged in PR #206

## Acceptance Criteria

- [ ] Users landing on "/" are automatically redirected to an active tournament home page
- [ ] Tournament selection persists across sessions via localStorage (sticky selection)
- [ ] Dropdown switcher appears in tournament header when multiple tournaments are active
- [ ] Users can switch between active tournaments via the dropdown
- [ ] Snackbar notification appears when user visits a new tournament they haven't seen before
- [ ] Snackbar is dismissible and dismissal state persists per tournament
- [ ] Empty state displays when no active tournaments exist, showing past tournaments as examples
- [ ] All new strings are internationalized (i18n)
- [ ] Works identically for authenticated and unauthenticated users

## Visual Prototypes

### 1. Tournament Switcher Dropdown (in Header)

**Location:** Tournament header, next to tournament name

**Desktop Layout:**
```
┌────────────────────────────────────────────────────────────┐
│  [Logo]  🏆 World Cup 2022  [▼]  [Theme] [Lang] [User]   │
│                                                            │
└────────────────────────────────────────────────────────────┘
                            ↓ (on click)
                    ┌──────────────────────┐
                    │ ✓ World Cup 2022     │
                    │   Copa America 2024  │
                    │   Euro 2024          │
                    └──────────────────────────┘
```

**Component Details:**
- **Trigger:** IconButton with KeyboardArrowDownIcon next to tournament name
- **Only shown when:** `activeTournaments.length > 1`
- **Menu Items:** List of all active tournaments
- **Current tournament:** Indicated with checkmark (✓)
- **Material-UI Components:** IconButton, Menu, MenuItem, ListItemIcon (checkmark)
- **Similar to:** LanguageSwitcher pattern (Avatar trigger + Menu)

**Mobile Layout:**
```
┌────────────────────────────┐
│ [Logo] ⚽ WC 22 [▼]  [≡]   │
└────────────────────────────┘
```
- Use short tournament name on mobile
- Same dropdown behavior

### 2. New Tournament Snackbar

**Position:** Bottom-center of screen

**Visual Design:**
```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│                                                            │
│          ┌────────────────────────────────────┐           │
│          │ ℹ️  New Tournament Available!       │   [✕]    │
│          │                                    │           │
│          │  You're viewing World Cup 2022.    │           │
│          │  Switch tournaments anytime using  │           │
│          │  the dropdown in the header.       │           │
│          └────────────────────────────────────┘           │
└────────────────────────────────────────────────────────────┘
```

**Component Details:**
- **Material-UI:** Snackbar + Alert (severity: 'info', variant: 'outlined')
- **Position:** `{ vertical: 'bottom', horizontal: 'center' }`
- **autoHideDuration:** 8000ms (8 seconds)
- **Dismissible:** User can click [✕] to dismiss
- **Shows when:** User visits a tournament they haven't seen before
- **Doesn't show if:**
  - Only one active tournament exists
  - User has already seen this tournament
  - User has dismissed snackbar for this tournament

**Conditions for display:**
```typescript
// Show snackbar if:
// 1. Multiple active tournaments exist AND
// 2. This tournament hasn't been seen before AND
// 3. Snackbar hasn't been dismissed for this tournament
```

### 3. Empty State (No Active Tournaments)

**Location:** Home page "/" when no active tournaments

**Visual Design:**
```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│                         🏆                                 │
│                                                            │
│           No Active Tournaments Right Now                  │
│                                                            │
│               Check back soon for new tournaments!         │
│                                                            │
│                     Past Tournaments:                      │
│                                                            │
│               • World Cup 2022 (Ended Dec 2022)           │
│               • Copa America 2021 (Ended Jul 2021)        │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Component Details:**
- **Material-UI:** Box, Typography, Stack
- **Layout:** Centered flex column
- **minHeight:** '400px'
- **Icon:** 🏆 emoji in h1 Typography
- **Heading:** h4 variant
- **Description:** body1 variant
- **Past Tournaments List:**
  - Fetch inactive tournaments (non-dev)
  - Display tournament name and end date
  - Read-only list (no links)
  - Limit to 5 most recent

**Similar to:** EmptyGroupsState, EmptyGamesState components

## Technical Approach

### 1. Home Page Redirect Logic

**File:** `/app/[locale]/page.tsx`

**Current Behavior:**
- Server component fetches tournaments and groups
- Renders Home component with tournament cards
- User clicks tournament to navigate

**New Behavior:**
- Check if active tournaments exist
- If yes: redirect to selected tournament
- If no: render empty state component

**Implementation:**
```typescript
export default async function HomePage() {
  const tournaments = await getTournaments(); // Already returns active tournaments
  const locale = await getLocale();

  if (tournaments.length === 0) {
    // No active tournaments - show empty state
    return <EmptyTournamentsState />;
  }

  // Get last selected tournament from client-side (requires client component wrapper)
  // OR use middleware/redirect approach
  // Redirect to tournament page
  redirect(`/${locale}/tournaments/${selectedTournamentId}`);
}
```

**Challenge:** localStorage is client-side only, but redirect needs to happen server-side

**Solution:** Create client component wrapper that handles redirect logic:
- Server component checks if tournaments exist
- If exist, renders client component with tournaments data
- Client component reads localStorage and performs client-side redirect
- Use `useRouter().push()` for client-side navigation

**Alternative:** Use middleware for redirect (more complex, avoids client component)

**Recommended:** Client component approach (simpler, follows existing patterns)

### 2. Tournament Switcher Component

**New File:** `/app/components/tournament/tournament-switcher.tsx`

**Component Type:** Client component ('use client')

**Props:**
```typescript
interface TournamentSwitcherProps {
  currentTournamentId: number;
  tournaments: Tournament[]; // All active tournaments
}
```

**Behavior:**
- Render IconButton with KeyboardArrowDownIcon
- Show only if `tournaments.length > 1`
- On click: open Menu with tournament list
- On menu item click:
  - Update localStorage with selected tournament ID
  - Navigate to selected tournament page
  - Close menu

**Material-UI Components:**
- IconButton (trigger)
- Menu (dropdown)
- MenuItem (each tournament)
- ListItemIcon (checkmark for current tournament)
- CheckIcon (from @mui/icons-material)

**localStorage Key:** `lastSelectedTournamentId`

**Similar Pattern:** LanguageSwitcher component

**Integration Point:** Tournament layout header (around line 168)
```tsx
// In tournament layout header
<TournamentSwitcher
  currentTournamentId={tournament.id}
  tournaments={activeTournaments}
/>
```

### 3. New Tournament Snackbar

**New File:** `/app/components/tournament/new-tournament-snackbar.tsx`

**Component Type:** Client component ('use client')

**Props:**
```typescript
interface NewTournamentSnackbarProps {
  tournamentId: number;
  tournamentName: string;
  hasMultipleTournaments: boolean;
}
```

**State Management:**
```typescript
const [open, setOpen] = useState(false);

useEffect(() => {
  // Check if this tournament has been seen
  const seenTournaments = getSeenTournaments(); // from localStorage
  const dismissed = getDismissalState(`tournamentSnackbar_${tournamentId}`);

  if (!seenTournaments.includes(tournamentId) && !dismissed && hasMultipleTournaments) {
    setOpen(true);
    // Mark tournament as seen
    addSeenTournament(tournamentId);
  }
}, [tournamentId, hasMultipleTournaments]);
```

**localStorage Keys:**
- `seenTournaments`: JSON array of tournament IDs user has visited
- `dismissedTournamentSnackbar_${tournamentId}`: boolean for dismissal state

**Material-UI Components:**
- Snackbar (container)
- Alert (message with close button)
- Severity: 'info'
- Variant: 'outlined'

**Integration Point:** Tournament layout (render at bottom of layout)

### 4. Empty State Component

**New File:** `/app/components/tournament/empty-tournaments-state.tsx`

**Component Type:** Server component

**Data Requirements:**
- Fetch past tournaments (inactive, non-dev)
- Limit to 5 most recent
- Include tournament name and end date

**Database Query:**
- Create new function: `findPastTournaments(limit: number)` in tournament-repository.ts
- Filter: `is_active = false` AND `dev_only = false`
- Order by end date descending
- Apply localization

**Layout:**
- Centered Box with flexDirection: 'column'
- Emoji icon (🏆)
- Heading and description
- List of past tournaments with names and dates
- minHeight: '400px'

**Similar Pattern:** EmptyGroupsState component

### 5. localStorage Utilities

**Extend:** `/app/utils/dismissal-storage.ts`

**New Functions:**
```typescript
// Get last selected tournament ID
export function getLastSelectedTournamentId(): number | null {
  if (globalThis.window === undefined) return null;
  try {
    const value = localStorage.getItem('lastSelectedTournamentId');
    return value ? parseInt(value, 10) : null;
  } catch (error) {
    console.error('Error reading last selected tournament:', error);
    return null;
  }
}

// Set last selected tournament ID
export function setLastSelectedTournamentId(tournamentId: number): void {
  if (globalThis.window === undefined) return;
  try {
    localStorage.setItem('lastSelectedTournamentId', tournamentId.toString());
  } catch (error) {
    console.error('Error saving last selected tournament:', error);
  }
}

// Get seen tournaments
export function getSeenTournaments(): number[] {
  if (globalThis.window === undefined) return [];
  try {
    const value = localStorage.getItem('seenTournaments');
    return value ? JSON.parse(value) : [];
  } catch (error) {
    console.error('Error reading seen tournaments:', error);
    return [];
  }
}

// Add tournament to seen list
export function addSeenTournament(tournamentId: number): void {
  if (globalThis.window === undefined) return;
  try {
    const seenTournaments = getSeenTournaments();
    if (!seenTournaments.includes(tournamentId)) {
      seenTournaments.push(tournamentId);
      localStorage.setItem('seenTournaments', JSON.stringify(seenTournaments));
    }
  } catch (error) {
    console.error('Error saving seen tournament:', error);
  }
}
```

**Pattern:** Follow existing SSR-safe pattern with globalThis.window checks

### 6. Tournament Data Functions

**New Function in tournament-repository.ts:**
```typescript
export async function findPastTournaments(limit: number = 5) {
  const query = db
    .selectFrom('tournaments')
    .where('is_active', '=', false)
    .where('dev_only', '=', false)
    .orderBy('id', 'desc') // or use end_date if available
    .limit(limit)
    .selectAll();

  return await query.execute();
}
```

**New Server Action in tournament-actions.ts:**
```typescript
export async function getPastTournaments(limit: number = 5) {
  const locale = await getLocale();
  const tournaments = await findPastTournaments(limit);
  return applyLocalizationBatch(tournaments, locale, [
    { field: 'long_name', i18nField: 'long_name_i18n' },
    { field: 'short_name', i18nField: 'short_name_i18n' }
  ]);
}
```

### 7. Home Page Client Redirect Component

**New File:** `/app/components/home/tournament-redirect.tsx`

**Component Type:** Client component ('use client')

**Purpose:** Handle client-side redirect logic using localStorage

**Implementation:**
```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { getLastSelectedTournamentId, setLastSelectedTournamentId } from '@/app/utils/dismissal-storage';

interface TournamentRedirectProps {
  tournaments: Array<{ id: number }>;
}

export default function TournamentRedirect({ tournaments }: TournamentRedirectProps) {
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    if (tournaments.length === 0) return;

    // Get last selected tournament
    const lastSelectedId = getLastSelectedTournamentId();

    // Check if last selected tournament is still active
    const selectedTournament = lastSelectedId
      ? tournaments.find(t => t.id === lastSelectedId)
      : null;

    // If found, redirect to it; otherwise, redirect to first tournament
    const targetTournament = selectedTournament || tournaments[0];

    // Save selection
    setLastSelectedTournamentId(targetTournament.id);

    // Redirect (using id, not slug - route is /tournaments/[id])
    router.push(`/${locale}/tournaments/${targetTournament.id}`);
  }, [tournaments, router, locale]);

  // Show loading state while redirecting
  return <div>Loading...</div>;
}
```

**Integration in page.tsx:**
```typescript
export default async function HomePage() {
  const tournaments = await getTournaments();

  if (tournaments.length === 0) {
    return <EmptyTournamentsState />;
  }

  return <TournamentRedirect tournaments={tournaments} />;
}
```

### 8. Tournament Layout Updates

**File:** `/app/[locale]/tournaments/[id]/layout.tsx`

**Changes:**
1. Fetch all active tournaments (not just current one)
2. Pass to TournamentSwitcher component
3. Add NewTournamentSnackbar component
4. Update tournament selection in localStorage

**Implementation:**
```typescript
// Around line 40, after fetching tournament
const activeTournaments = await getTournaments(); // Gets all active tournaments

// In header section (around line 168)
<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
  <Typography variant="h6">
    {isMobile ? tournament.short_name : tournament.long_name}
  </Typography>
  <TournamentSwitcher
    currentTournamentId={tournament.id}
    tournaments={activeTournaments}
  />
</Box>

// At end of layout, before closing tag
<NewTournamentSnackbar
  tournamentId={tournament.id}
  tournamentName={tournament.long_name}
  hasMultipleTournaments={activeTournaments.length > 1}
/>
```

### 9. Internationalization (i18n)

**New Translation Keys:**

**File:** `/locales/en/tournament.json`
```json
{
  "switcher": {
    "label": "Switch tournament",
    "currentTournament": "Current tournament"
  },
  "snackbar": {
    "newTournament": {
      "title": "New Tournament Available!",
      "message": "You're viewing {tournamentName}. Switch tournaments anytime using the dropdown in the header."
    }
  },
  "emptyState": {
    "title": "No Active Tournaments Right Now",
    "description": "Check back soon for new tournaments!",
    "pastTournaments": {
      "heading": "Past Tournaments:",
      "endedOn": "Ended {date}"
    }
  }
}
```

**File:** `/locales/es/tournament.json`
```json
{
  "switcher": {
    "label": "Cambiar torneo",
    "currentTournament": "Torneo actual"
  },
  "snackbar": {
    "newTournament": {
      "title": "¡Nuevo Torneo Disponible!",
      "message": "Estás viendo {tournamentName}. Cambia de torneo en cualquier momento usando el menú desplegable en el encabezado."
    }
  },
  "emptyState": {
    "title": "No Hay Torneos Activos En Este Momento",
    "description": "¡Vuelve pronto para ver nuevos torneos!",
    "pastTournaments": {
      "heading": "Torneos Pasados:",
      "endedOn": "Finalizado {date}"
    }
  }
}
```

## Files to Create

1. `/app/components/tournament/tournament-switcher.tsx` - Tournament dropdown component
2. `/app/components/tournament/new-tournament-snackbar.tsx` - New tournament notification
3. `/app/components/tournament/empty-tournaments-state.tsx` - Empty state when no tournaments
4. `/app/components/home/tournament-redirect.tsx` - Client-side redirect handler

## Files to Modify

1. `/app/[locale]/page.tsx` - Add redirect logic and empty state
2. `/app/[locale]/tournaments/[id]/layout.tsx` - Integrate tournament switcher and snackbar
3. `/app/utils/dismissal-storage.ts` - Add tournament selection and tracking utilities
4. `/app/db/tournament-repository.ts` - Add `findPastTournaments()` function
5. `/app/actions/tournament-actions.ts` - Add `getPastTournaments()` server action
6. `/locales/en/tournament.json` - Add English translations
7. `/locales/es/tournament.json` - Add Spanish translations

## Implementation Steps

### Phase 1: Data Layer & Utilities
1. Add localStorage utility functions to `dismissal-storage.ts`
2. Add `findPastTournaments()` to tournament-repository.ts
3. Add `getPastTournaments()` to tournament-actions.ts
4. Add i18n keys to translation files

### Phase 2: Empty State
1. Create `EmptyTournamentsState` component
2. Update home page to show empty state when no tournaments

### Phase 3: Tournament Redirect
1. Create `TournamentRedirect` client component
2. Update home page to use redirect component
3. Test redirect with localStorage

### Phase 4: Tournament Switcher
1. Create `TournamentSwitcher` component
2. Integrate into tournament layout header
3. Test switching and localStorage persistence

### Phase 5: New Tournament Snackbar
1. Create `NewTournamentSnackbar` component
2. Integrate into tournament layout
3. Test tracking and dismissal

### Phase 6: Integration Testing
1. Test complete flow: home → tournament → switch → snackbar
2. Test empty state when no tournaments
3. Test localStorage persistence across sessions
4. Test both authenticated and unauthenticated users
5. Test mobile responsiveness

## Testing Strategy

### Unit Tests

**File:** `__tests__/utils/dismissal-storage.test.ts`
- Test `getLastSelectedTournamentId()` - returns null when empty, returns ID when set
- Test `setLastSelectedTournamentId()` - saves to localStorage
- Test `getSeenTournaments()` - returns empty array when empty, returns array when set
- Test `addSeenTournament()` - adds tournament to array, doesn't duplicate
- Test SSR safety (window undefined)
- Test error handling

**File:** `__tests__/db/tournament-repository.test.ts`
- Test `findPastTournaments()` - returns inactive tournaments only
- Test excludes dev_only tournaments
- Test limit parameter
- Test ordering (most recent first)

**File:** `__tests__/actions/tournament-actions.test.ts`
- Test `getPastTournaments()` - applies localization
- Test limit parameter

**File:** `__tests__/components/tournament/tournament-switcher.test.tsx`
- Test renders only when multiple tournaments
- Test menu opens on click
- Test navigation on selection
- Test checkmark on current tournament
- Test localStorage update

**File:** `__tests__/components/tournament/new-tournament-snackbar.test.tsx`
- Test shows when tournament not seen
- Test doesn't show when tournament already seen
- Test doesn't show when dismissed
- Test doesn't show when only one tournament
- Test dismissal persists

**File:** `__tests__/components/tournament/empty-tournaments-state.test.tsx`
- Test renders empty state message
- Test displays past tournaments list
- Test localization

**File:** `__tests__/components/home/tournament-redirect.test.tsx`
- Test redirects to last selected tournament
- Test redirects to first tournament when no selection
- Test saves selection to localStorage
- Test handles empty tournaments array

### Integration Tests

**Scenario 1: First-time user with multiple tournaments**
1. Clear localStorage
2. Visit "/"
3. Expect: Redirect to first active tournament
4. Expect: Snackbar appears
5. Click switcher, select different tournament
6. Expect: Navigate to selected tournament
7. Expect: No snackbar (already seen)
8. Refresh page, visit "/"
9. Expect: Redirect to last selected tournament

**Scenario 2: User with no active tournaments**
1. Mock getTournaments() to return []
2. Visit "/"
3. Expect: Empty state displayed
4. Expect: Past tournaments list shown

**Scenario 3: User dismisses snackbar**
1. Visit tournament for first time
2. Expect: Snackbar appears
3. Click dismiss
4. Refresh page
5. Expect: Snackbar doesn't appear

**Scenario 4: Single tournament (no switcher)**
1. Mock getTournaments() to return 1 tournament
2. Visit tournament page
3. Expect: No switcher in header
4. Expect: No snackbar

### Manual Testing Checklist

- [ ] Authenticated user: home redirect works
- [ ] Unauthenticated user: home redirect works
- [ ] Tournament switcher visible with 2+ tournaments
- [ ] Tournament switcher hidden with 1 tournament
- [ ] Switching tournaments updates localStorage
- [ ] Switching tournaments navigates to new tournament
- [ ] Snackbar appears for new tournament
- [ ] Snackbar dismissal persists
- [ ] Empty state shows with past tournaments
- [ ] Mobile responsive: switcher works
- [ ] Mobile responsive: snackbar readable
- [ ] Translations work in English
- [ ] Translations work in Spanish
- [ ] localStorage persists across browser sessions
- [ ] Works in incognito/private mode (fresh localStorage)

## Validation Considerations

### SonarCloud Requirements
- **80% code coverage** on new code
  - All new components must have comprehensive unit tests
  - All new utilities must have unit tests
  - Integration tests for redirect logic
- **0 new issues** of any severity
  - Watch for: unused variables, console.logs, type any usage
  - Ensure proper error handling in localStorage utilities
  - Validate proper TypeScript types for all components

### Quality Checks
- **Performance:** localStorage operations are synchronous, ensure they don't block rendering
- **Accessibility:**
  - Tournament switcher must be keyboard navigable
  - Snackbar must be screen reader friendly
  - Empty state must have proper heading hierarchy
- **Security:**
  - localStorage data is client-side and can be modified - don't rely on it for security
  - Validate tournament IDs from localStorage against active tournaments list
- **Error Handling:**
  - Handle localStorage quota exceeded errors
  - Handle malformed JSON in seenTournaments
  - Handle invalid tournament IDs gracefully

### Edge Cases
- User's last selected tournament is no longer active → Redirect to first active tournament
- User's seenTournaments list has invalid IDs → Filter out invalid IDs
- localStorage is disabled/blocked → Fall back to redirecting to first tournament
- User manually types "/" in URL → Redirect should still work
- Multiple browser tabs open → localStorage changes should sync

## Open Questions

None - all requirements are clear from the story description.

## Dependencies

- ✅ Story #205 (Tournament public access) - Already merged (PR #206)
- Material-UI components (already in use)
- next-intl (already configured)
- localStorage API (standard browser API)

## Risks & Mitigations

**Risk:** localStorage is unavailable (privacy mode, disabled)
**Mitigation:** Gracefully degrade - use first tournament as default, no persistence

**Risk:** User has many tournaments in seenTournaments array
**Mitigation:** Array is small (number of tournaments), no cleanup needed unless it becomes a problem

**Risk:** Snackbar is annoying if shown too often
**Mitigation:** Only show once per tournament, user can dismiss, and it auto-hides after 8 seconds

**Risk:** Redirect creates a flash of home page before redirecting
**Mitigation:** Use client component with useEffect - minimal flash, consider loading state

## Success Metrics

- Users land directly on tournament page (fewer clicks)
- Tournament selection persists across sessions
- Users discover new tournaments via snackbar
- Empty state provides context when no tournaments active
- Zero localStorage-related errors in production logs
