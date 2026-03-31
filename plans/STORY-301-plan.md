# Plan: [Story] Google Analytics 4 Integration #301

## Context

The app has no analytics instrumentation today. GA4 is the natural fit given AdSense is already configured. The core GA4 infrastructure was built outside the story workflow and has since been merged to `main`. This story's job is to **fix two bugs in that merged code, remove leftover dev comments, and add the required test coverage** to bring the implementation to production quality.

---

## What Is Already in Main

All core GA4 code is already merged and available in the story worktree via rebase:

| File | Status | Notes |
|------|--------|-------|
| `app/utils/ga4.ts` | ✅ In main | `initializeGA4`, `trackPageView`, `trackEvent`, `AnalyticsEventPayload` |
| `app/components/shared-ui/AnalyticsPageViewTracker.tsx` | ✅ In main | Client component, fires page view on pathname/searchParam change |
| `app/[locale]/layout.tsx` | ✅ In main | GA4 script injected, AnalyticsPageViewTracker added — **has Bug 1** |
| `app/actions/guesses-actions.ts` | ✅ In main | `updateOrCreateGameGuesses` returns `analyticsEvent` — **has dev comment** |
| `app/actions/prode-group-join-request-actions.ts` | ✅ In main | `approveJoinRequestAction` returns `analyticsEvent` — **has dev comment** |
| `app/components/context-providers/guesses-context-provider.tsx` | ✅ In main | Calls `trackEvent` after successful guess save — **has dev comments** |
| `app/components/friend-groups/join-request-manager.tsx` | ✅ In main | Calls `trackEvent` after `approveJoinRequestAction` — **has dev comments** |

---

## Acceptance Criteria

- [x] Each page navigation is recorded as a separate page view
- [x] Prediction submitted event tracked
- [x] Group joined event tracked (on admin approval)
- [x] Ad-free users are not tracked
- [x] Analytics only activates when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set
- [x] No data sent in local development unless explicitly configured
- [ ] **Bug fix: AdSensePageViewTracker incorrectly removed** — must be restored
- [ ] **Suspense boundary** for `AnalyticsPageViewTracker` (uses `useSearchParams`)
- [ ] Dev comments cleaned up in all 5 files
- [ ] Tests: ≥80% coverage on all new/changed code

---

## Bugs to Fix

### Bug 1: AdSensePageViewTracker Removed
`layout.tsx` currently has:
```tsx
{/* <AdSensePageViewTracker /> - Removed as per requirements */}
```
This is wrong — AdSense auto-ads (vignette, anchor) require virtual page-view signals on SPA navigation. This was not a requirement; it was a mistake in the original uncommitted work. Fix: restore `<AdSensePageViewTracker />` alongside `<AnalyticsPageViewTracker>`.

### Bug 2: Missing Suspense Boundary for useSearchParams
`AnalyticsPageViewTracker` calls `useSearchParams()`. In Next.js App Router this requires a `<Suspense>` boundary at the call site to avoid bailing out of static rendering. Fix: wrap `<AnalyticsPageViewTracker>` in `<Suspense fallback={null}>` in `layout.tsx`.

---

## Technical Approach

All core code is already in the worktree from main. Work is:
1. **Fix Bug 1** in `app/[locale]/layout.tsx`: restore `<AdSensePageViewTracker />`
2. **Fix Bug 2** in `app/[locale]/layout.tsx`: wrap `<AnalyticsPageViewTracker>` in `<Suspense fallback={null}>`
3. **Clean dev comments** from 5 files (see table below)
4. **Write tests** for all new/changed code
5. **Update CODE-STRUCTURE.md**

### Target state of layout.tsx body section
```tsx
<AdSensePageViewTracker />                     {/* restored */}
<Suspense fallback={null}>
  <AnalyticsPageViewTracker user={user ?? null} />
</Suspense>
```

### Dev comments to remove

| File | Comments to remove |
|------|-------------------|
| `app/actions/guesses-actions.ts` | `// Import AnalyticsEventPayload` |
| `app/actions/prode-group-join-request-actions.ts` | `// Import AnalyticsEventPayload` |
| `app/components/context-providers/guesses-context-provider.tsx` | `// Add this import`, `// --- NEW: Track analytics event ---`, `// --- END NEW ---` |
| `app/components/friend-groups/join-request-manager.tsx` | `// Add this import`, `// --- NEW: Track analytics event ---`, `// --- END NEW ---` |

---

## Files to Create / Modify

| File | Action | Notes |
|------|--------|-------|
| `app/[locale]/layout.tsx` | Modify | Fix Bug 1 (restore AdSensePageViewTracker) + Fix Bug 2 (Suspense) |
| `app/actions/guesses-actions.ts` | Modify | Remove dev comment |
| `app/actions/prode-group-join-request-actions.ts` | Modify | Remove dev comment |
| `app/components/context-providers/guesses-context-provider.tsx` | Modify | Remove dev comments |
| `app/components/friend-groups/join-request-manager.tsx` | Modify | Remove dev comments |
| `app/utils/__tests__/ga4.test.ts` | **Create** | Tests for all 3 exported functions |
| `app/components/shared-ui/__tests__/AnalyticsPageViewTracker.test.tsx` | **Create** | Tests for page view tracker |
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

### `app/utils/ga4.ts` *(already in main)*

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

### `app/components/shared-ui/AnalyticsPageViewTracker.tsx` *(already in main)*

- **AnalyticsPageViewTracker({ user }: { user: Session['user'] | null })**: `null`
  Client component. Uses `useSearchParams()` — **must be wrapped in `<Suspense fallback={null}>` at the call site in layout.tsx** (Bug 2 fix). On pathname/searchParams change: calls `initializeGA4()` (runs on `isAdFree` change) and `trackPageView(url)`. Both effects no-op when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is unset or user is ad-free.
  Tests:
  - renders null (no DOM output)
  - does not track when NEXT_PUBLIC_GA_MEASUREMENT_ID is not set
  - does not track when user.isAdFree is true
  - calls trackPageView with current URL on pathname change
  - calls initializeGA4 on mount when not ad-free and measurement ID set
  - stops tracking (no trackPageView call) when user.isAdFree changes from false to true

---

### `app/actions/guesses-actions.ts` *(already in main)*

**Changed functions:**

- **updateOrCreateGameGuesses(gameGuesses: GameGuessNew[], locale: Locale)**: `Promise<{ success: boolean; error?: string; analyticsEvent?: AnalyticsEventPayload }>`
  Includes `analyticsEvent` with `name: 'prediction_submitted'` and `params: { number_of_guesses, game_ids }` on success.
  Tests: success response includes analyticsEvent with prediction_submitted event and correct params

---

### `app/actions/prode-group-join-request-actions.ts` *(already in main)*

**Changed functions:**

- **approveJoinRequestAction(requestId: string, groupId: string, tournamentId?: string)**: `Promise<{ success: boolean; message: string; analyticsEvent?: AnalyticsEventPayload }>`
  Includes `analyticsEvent` with `name: 'group_joined'` and `params: { group_id, tournament_id }` on success.
  Tests: success response includes analyticsEvent with group_joined event and `{ group_id, tournament_id }`

---

## Testing Strategy

### New test files:

**`app/utils/__tests__/ga4.test.ts`** — pure unit tests, mock `process.env` and `window.gtag`:
- 12+ test cases covering all three functions, guard conditions, and exact event parameter shapes

**`app/components/shared-ui/__tests__/AnalyticsPageViewTracker.test.tsx`** — follows `adsense-page-view-tracker.test.tsx` pattern:
- Mock `next/navigation` (`usePathname`, `useSearchParams`)
- Mock `next-auth/react` (`useSession`)
- Mock `@/app/utils/ga4` (`initializeGA4`, `trackPageView`)
- 6 test cases including ad-free status change scenario

### Add to existing test files:

**`app/components/context-providers/__tests__/guesses-context-provider.test.tsx`**:
- calls `trackEvent('prediction_submitted', { number_of_guesses: 1, game_ids: [...] })` after `updateOrCreateGameGuesses` returns `{ success: true, analyticsEvent: {...} }`
- does NOT call `trackEvent` when `updateOrCreateGameGuesses` returns `{ success: false }`
- does NOT call `trackEvent` when response has no `analyticsEvent` field

**`app/components/friend-groups/__tests__/join-request-manager.test.tsx`**:
- calls `trackEvent('group_joined', { group_id, tournament_id })` after `approveJoinRequestAction` returns success with analyticsEvent
- does NOT call `trackEvent` when `approveJoinRequestAction` fails

**`app/actions/__tests__/guesses-actions.test.ts`**:
- `updateOrCreateGameGuesses` success response includes `analyticsEvent` with `name: 'prediction_submitted'` and correct params

**`app/actions/__tests__/prode-group-join-request-actions.test.ts`**:
- `approveJoinRequestAction` success response includes `analyticsEvent` with `name: 'group_joined'` and `{ group_id, tournament_id }`

---

## Validation

1. `npm run test` — all tests pass with ≥80% coverage on new files
2. `npm run lint` — no lint errors
3. `npm run build` — clean build
4. Set `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-TESTID` in `.env.local`, start dev server, navigate pages — verify requests to `www.google-analytics.com/g/collect` in Network tab
5. Verify AdSense vignette/anchor ads still work (AdSensePageViewTracker restored)
6. Ad-free user session → confirm no GA4 requests in Network tab
7. Unset env var → confirm no GA4 requests in Network tab

---

## Open Questions (Resolved)

- **Event tracking approach**: Client-side after server action success ✓
- **Group joined trigger**: On `approveJoinRequestAction` success ✓
