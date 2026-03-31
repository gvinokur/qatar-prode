# Plan: [Story] Google Analytics 4 Integration #301

## Context

The app has no analytics instrumentation today. GA4 is the natural fit given AdSense is already configured. A partial implementation already exists as uncommitted changes in the main worktree (rule violation). This story formalises that work into a proper story worktree, fixes two bugs, cleans up dev comments, and adds the required test coverage.

---

## Current State (Uncommitted in Main Worktree)

The following files have already been partially written and need to be carried into the story worktree:

**Untracked (new files):**
- `app/utils/ga4.ts` — GA4 utility: `initializeGA4`, `trackPageView`, `trackEvent`, `AnalyticsEventPayload`
- `app/components/shared-ui/AnalyticsPageViewTracker.tsx` — client component, fires page view on pathname change, skips ad-free users

**Modified (uncommitted):**
- `app/[locale]/layout.tsx` — GA4 script injected, `AnalyticsPageViewTracker` added, `AdSensePageViewTracker` mistakenly commented out
- `app/actions/guesses-actions.ts` — `updateOrCreateGameGuesses` returns `analyticsEvent` payload on success
- `app/actions/prode-group-join-request-actions.ts` — `approveJoinRequestAction` returns `analyticsEvent` payload on success
- `app/components/context-providers/guesses-context-provider.tsx` — calls `trackEvent` after successful guess save
- `app/components/friend-groups/join-request-manager.tsx` — calls `trackEvent` after `approveJoinRequestAction` succeeds

---

## Acceptance Criteria

- [x] Each page navigation is recorded as a separate page view ← implemented
- [x] Prediction submitted event tracked ← implemented
- [x] Group joined event tracked (on admin approval) ← implemented
- [x] Ad-free users are not tracked ← implemented
- [x] Analytics only activates when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set ← implemented
- [x] No data sent in local development unless explicitly configured ← implemented
- [ ] **Bug fix: AdSensePageViewTracker incorrectly removed** — must be restored
- [ ] **Suspense boundary** for `AnalyticsPageViewTracker` (uses `useSearchParams`)
- [ ] Dev comments cleaned up (all `// Add this import`, `// --- NEW ---` markers)
- [ ] Tests: 80% coverage on all new/changed code

---

## Bugs to Fix

### Bug 1: AdSensePageViewTracker Removed
`layout.tsx` has `{/* <AdSensePageViewTracker /> - Removed as per requirements */}`. This is wrong — AdSense auto-ads (vignette, anchor) require virtual page-view signals on SPA navigation. The comment was added by whoever did the partial work, not by any requirement. Fix: restore `<AdSensePageViewTracker />` alongside `<AnalyticsPageViewTracker user={user} />`.

### Bug 2: Missing Suspense Boundary for useSearchParams
`AnalyticsPageViewTracker` calls `useSearchParams()`. In Next.js App Router, this requires the component to be inside a `<Suspense>` boundary to avoid bailing out of static rendering. Fix: wrap `<AnalyticsPageViewTracker>` in `<Suspense fallback={null}>` in layout.tsx.

---

## Technical Approach

### No new architecture needed — wire up and polish existing work

1. **Create story worktree** via `github-projects-helper story start 301 --project 1`
2. **Copy partial implementation** from main worktree to story worktree using `git diff` patch
3. **Fix Bug 1**: Restore `<AdSensePageViewTracker />` in `app/[locale]/layout.tsx`
4. **Fix Bug 2**: Wrap `<AnalyticsPageViewTracker>` in `<Suspense>` in `app/[locale]/layout.tsx`
5. **Clean up dev comments** in all 5 modified files
6. **Write tests** for all new/changed code
7. **Update CODE-STRUCTURE.md**

### GA4 Script Injection (already done)
```tsx
// app/[locale]/layout.tsx — inside <head>
{gaMeasurementId && !user?.isAdFree && (
  <Script
    async
    src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
    strategy="afterInteractive"
  />
)}
```

### Page View Tracking (fix needed)
```tsx
// layout.tsx — inside <body>, with fix applied:
<AdSensePageViewTracker />                          {/* restored */}
<Suspense fallback={null}>
  <AnalyticsPageViewTracker user={user} />
</Suspense>
```

### Event Tracking Pattern (already done, cleanup needed)
Server Actions return `analyticsEvent?: AnalyticsEventPayload` on success. Client components fire `trackEvent()` after the action resolves.

---

## Files to Create / Modify

| File | Action | Notes |
|------|--------|-------|
| `app/utils/ga4.ts` | Carry over | Clean up 'use client' directive position, minor cleanup |
| `app/components/shared-ui/AnalyticsPageViewTracker.tsx` | Carry over | No changes needed |
| `app/[locale]/layout.tsx` | Carry over + fix | Restore `AdSensePageViewTracker` import + uncomment component; wrap `<AnalyticsPageViewTracker>` in `<Suspense fallback={null}>` |
| `app/actions/guesses-actions.ts` | Carry over + clean | Remove dev comments |
| `app/actions/prode-group-join-request-actions.ts` | Carry over + clean | Remove dev comments |
| `app/components/context-providers/guesses-context-provider.tsx` | Carry over + clean | Remove `// Add this import` comment |
| `app/components/friend-groups/join-request-manager.tsx` | Carry over + clean | Remove `// Add this import` comment |
| `app/utils/__tests__/ga4.test.ts` | **Create new** | Tests for all 3 exported functions |
| `app/components/shared-ui/__tests__/AnalyticsPageViewTracker.test.tsx` | **Create new** | Tests for page view tracker |
| `docs/code-structure/utils.md` | Update | Add ga4.ts entry |
| `docs/code-structure/components-shared-ui.md` (or equivalent) | Update | Add AnalyticsPageViewTracker entry |

---

## Mid-Level Design

### Call Graph Changes

**Modified flows:**
- All page navigations now trigger: `AnalyticsPageViewTracker → trackPageView → window.gtag('config', ...)`
- Flow 10 (Predictions / game guesses): `GuessesContextProvider.updateGameGuess` → `updateOrCreateGameGuesses` → returns `analyticsEvent` → `trackEvent('prediction_submitted')`
- Flow 13 (Friend group management): `JoinRequestManager.handleApprove` → `approveJoinRequestAction` → returns `analyticsEvent` → `trackEvent('group_joined')`

**New flows:** None

---

### `app/utils/ga4.ts` *(new)*

**Exported functions:**

- **initializeGA4()**: `void`
  Initializes GA4 by calling `gtag('js', new Date())` and `gtag('config', GA_MEASUREMENT_ID, { send_page_view: false })`. No-op if `NEXT_PUBLIC_GA_MEASUREMENT_ID` is unset or `window.gtag` is not yet defined.
  Tests:
  - does nothing when NEXT_PUBLIC_GA_MEASUREMENT_ID is not set
  - does nothing when window.gtag is not defined
  - calls gtag with 'js' and 'config' when measurement ID and gtag are available
  - does not throw if window.gtag itself throws during initialization

- **trackPageView(url: string, title?: string)**: `void`
  Calls `window.gtag('config', GA_MEASUREMENT_ID, { page_path, page_title })`. No-op if measurement ID is unset or `window.gtag` is not a function.
  Tests:
  - does nothing when NEXT_PUBLIC_GA_MEASUREMENT_ID is not set
  - does nothing when window.gtag is not a function
  - calls gtag with correct page_path and page_title when configured

- **trackEvent(eventName: string, eventParams?: Record\<string, any\>)**: `void`
  Calls `window.gtag('event', eventName, eventParams)`. No-op if measurement ID is unset or `window.gtag` is not a function.
  Tests:
  - does nothing when NEXT_PUBLIC_GA_MEASUREMENT_ID is not set
  - does nothing when window.gtag is not a function
  - calls gtag('event', eventName, eventParams) when configured
  - handles undefined eventParams (no second arg passed)
  - calls gtag with exact params for prediction_submitted event: `{ number_of_guesses: 2, game_ids: ['g1', 'g2'] }`
  - calls gtag with exact params for group_joined event: `{ group_id: 'grp1', tournament_id: 'tour1' }`

**Exported type:**

- **AnalyticsEventPayload**: `{ name: string; params?: Record<string, any> }`

---

### `app/components/shared-ui/AnalyticsPageViewTracker.tsx` *(new)*

- **AnalyticsPageViewTracker({ user }: { user: Session['user'] | null })**: `null`
  Client component. Uses `useSearchParams()` — **must be wrapped in `<Suspense fallback={null}>` at the call site in layout.tsx**. On pathname/searchParams change: calls `initializeGA4()` (initialization effect, runs on `isAdFree` change) and `trackPageView(url)` (page view effect). Both effects no-op when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is unset or user is ad-free.
  Tests:
  - renders null (no DOM output)
  - does not track when NEXT_PUBLIC_GA_MEASUREMENT_ID is not set
  - does not track when user.isAdFree is true
  - calls trackPageView with current URL on pathname change
  - calls initializeGA4 on mount when not ad-free and measurement ID set
  - stops tracking (no trackPageView call) when user.isAdFree changes from false to true

---

### `app/actions/guesses-actions.ts` *(modified)*

**Changed functions:**

- **updateOrCreateGameGuesses(gameGuesses: GameGuessNew[], locale: Locale)**: `Promise<{ success: boolean; error?: string; analyticsEvent?: AnalyticsEventPayload }>`
  *(was: `Promise<{ success: boolean; error?: string }>`)* — Now includes `analyticsEvent` with `name: 'prediction_submitted'` and `params: { number_of_guesses, game_ids }` on success.
  Tests: (existing tests unchanged; test that success response includes analyticsEvent)

---

### `app/actions/prode-group-join-request-actions.ts` *(modified)*

**Changed functions:**

- **approveJoinRequestAction(requestId: string, groupId: string, tournamentId?: string)**: `Promise<{ success: boolean; message: string; analyticsEvent?: AnalyticsEventPayload }>`
  *(was: no `analyticsEvent` in return)* — Now includes `analyticsEvent` with `name: 'group_joined'` and `params: { group_id, tournament_id }` on success.
  Tests: (existing tests; add: success response includes analyticsEvent with group_joined event)

---

## Testing Strategy

### New test files:

**`app/utils/__tests__/ga4.test.ts`** — pure unit tests, mock `process.env` and `window.gtag`:
- 10+ test cases covering all three functions and their guard conditions

**`app/components/shared-ui/__tests__/AnalyticsPageViewTracker.test.tsx`** — follows `adsense-page-view-tracker.test.tsx` pattern:
- Mock `next/navigation` (`usePathname`, `useSearchParams`)
- Mock `next-auth/react` (`useSession`)
- Mock `@/app/utils/ga4` (`initializeGA4`, `trackPageView`)
- Test: no-op when env var unset, no-op for ad-free users, fires correctly for non-ad-free users

### Modified files — add to existing test files:

**`app/components/context-providers/__tests__/guesses-context-provider.test.tsx`** (add to existing file):
- calls `trackEvent('prediction_submitted', { number_of_guesses: 1, game_ids: [...] })` after `updateOrCreateGameGuesses` returns `{ success: true, analyticsEvent: {...} }`
- does NOT call `trackEvent` when `updateOrCreateGameGuesses` returns `{ success: false }`
- does NOT call `trackEvent` when response has no `analyticsEvent` field

**`app/components/friend-groups/__tests__/join-request-manager.test.tsx`** (add to existing file):
- calls `trackEvent('group_joined', { group_id, tournament_id })` after `approveJoinRequestAction` returns `{ success: true, analyticsEvent: {...} }`
- does NOT call `trackEvent` when `approveJoinRequestAction` fails

**`app/actions/__tests__/guesses-actions.test.ts`** (add to existing file):
- `updateOrCreateGameGuesses` success response includes `analyticsEvent` with `name: 'prediction_submitted'` and correct params

**`app/actions/__tests__/prode-group-join-request-actions.test.ts`** (add to existing file):
- `approveJoinRequestAction` success response includes `analyticsEvent` with `name: 'group_joined'` and `{ group_id, tournament_id }`

---

## Validation

1. `npm run test` — all tests pass with ≥80% coverage on new files
2. `npm run lint` — no lint errors (remove all dev comments)
3. `npm run build` — clean build
4. Set `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-TESTID` in `.env.local`, start dev server, navigate pages, check browser Network tab for requests to `www.google-analytics.com/g/collect` — page views fire on each navigation
5. Verify AdSense vignette/anchor ads still work (AdSensePageViewTracker restored)
6. Set `user.isAdFree = true` in session → confirm no GA4 requests in Network tab
7. Remove env var → confirm no GA4 requests in Network tab

---

## Open Questions (Resolved)

- **Event tracking approach**: Client-side after server action success ✓ (chosen by user)
- **Group joined trigger**: On `approveJoinRequestAction` success (user actually joins, not just requests) ✓
