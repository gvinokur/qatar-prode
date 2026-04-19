# Story #338: Tournament Hub as Central Landing Page

## Context
Users currently land on the "Games" screen (`/tournaments/[id]`), a detailed match list that lacks a holistic tournament view. The Tournament Hub (with Action Center, Recent Results, Leaderboard Peek widgets) is better suited as the primary entry point. This story promotes the Hub to `/tournaments/[id]` and moves Games to `/tournaments/[id]/games`, while removing the `NEXT_PUBLIC_HUB_ENABLED` feature flag.

## Worktree
- **Path:** `/Users/gvinokur/Personal/qatar-prode-story-338`
- **Branch:** `feature/story-338`
- **Create with:** `./scripts/github-projects-helper story start 338 --project 1`

---

## Acceptance Criteria (from issue)
1. `/tournaments/[id]` → Tournament Hub (hub widgets)
2. Games page → `/tournaments/[id]/games`
3. `NEXT_PUBLIC_HUB_ENABLED` flag removed
4. Navigation: Dashboard icon on Hub link; en "HUB", es "CENTRAL"; en "MATCHES", es "PARTIDOS"
5. AppBar tournament logo → `/tournaments/[id]` (already correct — no change needed)
6. Offline: navigating to `/tournaments/[id]` shows view-only Games page

---

## Route Changes

| Before | After |
|--------|-------|
| `/tournaments/[id]` → UnifiedGamesPage | `/tournaments/[id]` → Hub widgets |
| `/tournaments/[id]/hub` → Hub widgets | `/tournaments/[id]/hub` → redirect to `/tournaments/[id]` |
| (none) | `/tournaments/[id]/games` → UnifiedGamesPage |

---

## Files to Create
- `app/[locale]/tournaments/[id]/games/page.tsx` — new Games page (move from root)
- `app/[locale]/tournaments/[id]/games/__tests__/page.test.tsx` — tests
- `app/components/tournament-hub/tournament-hub-offline-redirect.tsx` — client component for offline redirect

## Files to Modify
1. `app/[locale]/tournaments/[id]/page.tsx` — replace UnifiedGamesPage with Hub content + offline redirect
2. `app/[locale]/tournaments/[id]/hub/page.tsx` — replace with server-side redirect to parent route
3. `app/[locale]/tournaments/[id]/hub/__tests__/page.test.tsx` — update (hub page is now a redirect)
4. `app/utils/environment-utils.ts` — remove `isHubEnabled()`
5. `app/utils/__tests__/environment-utils.test.ts` — remove `isHubEnabled` tests
6. `app/components/groups-page/group-selector.tsx` — always show Hub tab, update paths, add Dashboard icon
7. `app/components/groups-page/__tests__/group-selector-i18n.test.tsx` — update for new hub tab + paths
8. `app/components/tournament-bottom-nav/tournament-bottom-nav.tsx` — remove `isHubEnabled`, always go to root
9. `app/components/home/tournament-redirect.tsx` — always redirect to `/tournaments/[id]`
10. `locales/es/navigation.json` — `topNav.hub` → "CENTRAL"

---

## Implementation Details

### 1. New Games Page (`app/[locale]/tournaments/[id]/games/page.tsx`)
Exact copy of current `page.tsx` — renders `<UnifiedGamesPage tournamentId={tournamentId} />` with metadata. No logic changes.

### 2. New Root Hub Page (`app/[locale]/tournaments/[id]/page.tsx`)
```tsx
'use server'
// Replace current UnifiedGamesPage render with hub widgets + offline redirect
export default async function TournamentHubPage(props: Props) {
  const { id } = await props.params
  const locale = toLocale(await getLocale())
  return (
    <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TournamentHubOfflineRedirect tournamentId={id} locale={locale} />
      <TournamentHubActionCenter tournamentId={id} locale={locale} />
      <TournamentHubRecentResults tournamentId={id} locale={locale} />
      <TournamentHubLeaderboardPeek tournamentId={id} locale={locale} />
    </Box>
  )
}
```

### 3. Hub Redirect Page (`app/[locale]/tournaments/[id]/hub/page.tsx`)
```tsx
'use server'
import { redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
export default async function TournamentHubRedirectPage({ params }: Props) {
  const { id } = await params
  const locale = await getLocale()
  redirect(`/${locale}/tournaments/${id}`)
}
```

### 4. Offline Redirect Component (`app/components/tournament-hub/tournament-hub-offline-redirect.tsx`)
```tsx
'use client'
// Client component: detects offline state, redirects to /games
// Uses navigator.onLine + 'offline'/'online' events
// When offline: router.replace(`/${locale}/tournaments/${tournamentId}/games`)
```

### 5. GroupSelector (`app/components/groups-page/group-selector.tsx`)
- Remove `isHubEnabled()` import/usage — Hub tab always rendered
- Hub tab: `Dashboard` icon, `value="hub"`, href = `/tournaments/[id]` (root)
- Matches tab: href = `/tournaments/[id]/games`
- Update `getSelectedTab()`:
  - `pathname.includes('/games')` → return `'matches'`
  - Root `/tournaments/[id]` → return `'hub'`  
  - Remove `/hub` check (no longer applicable)
  - Keep qualified-teams and awards checks

### 6. TournamentBottomNav (`app/components/tournament-bottom-nav/tournament-bottom-nav.tsx`)
- Remove `isHubEnabled()` import/usage
- `case 'main-home'`: always navigate to `/${locale}/tournaments/${tournamentId}` (root)
- Path detection: `/tournaments/${tournamentId}` (exact root) → `setValue('main-home')` (was `''`)
- Remove `/hub` path check

### 7. TournamentRedirect (`app/components/home/tournament-redirect.tsx`)
- Remove `isHubEnabled()` import/usage
- `targetPath` always = `/${locale}/tournaments/${targetTournament.id}`

### 8. environment-utils.ts
- Remove `isHubEnabled()` function entirely
- Remove its tests from `environment-utils.test.ts`

### 9. Translations
- `locales/es/navigation.json`: `topNav.hub` → `"CENTRAL"` (was `"HUB"`)
- `locales/en/navigation.json`: `topNav.hub` stays `"HUB"` ✓, `topNav.matches` stays `"MATCHES"` ✓

---

## Visual Design (Navigation)

```
Top Nav (GroupSelector):
┌──────────┬──────────┬────────────────┬────────────┐
│ 📊 HUB   │ 🏆 MATCHES│ QUALIFIED TEAMS │   AWARDS   │
│ (active) │          │                │            │
└──────────┴──────────┴────────────────┴────────────┘

Bottom Nav (mobile):
┌──────┬─────────┬───────┬────────┬───────┐
│ Home │Standings│ Rules │ Groups │ Stats │
│  🏠  │   📊    │   ⚖️  │   👥   │  📈   │
└──────┴─────────┴───────┴────────┴───────┘
Home button → /tournaments/[id] (always)
```

---

## Mid-Level Design

### Call Graph Changes
**Modified flows:**
- **Home redirect flow** — `TournamentRedirect` now always redirects to `/tournaments/[id]` (hub), no conditional
- **Tournament root navigation** — `/tournaments/[id]` now renders hub widgets instead of `UnifiedGamesPage`
- **New flow: Games page** — `/tournaments/[id]/games` renders `UnifiedGamesPage`

### `app/[locale]/tournaments/[id]/page.tsx` *(modified)*
**Changed functions:**
- **TournamentHubPage(props: Props)**: `JSX.Element` — [Server] Hub landing page. Resolves `id` from params, derives locale, renders offline redirect + hub widgets. Replaces previous `TournamentLandingPage`.
  Calls: getLocale, toLocale
  Renders: TournamentHubOfflineRedirect, TournamentHubActionCenter, TournamentHubRecentResults, TournamentHubLeaderboardPeek
  Tests:
  - renders Action Center widget
  - renders Recent Results widget
  - renders Leaderboard Peek widget
  - renders offline redirect component

### `app/[locale]/tournaments/[id]/games/page.tsx` *(new)*
**New functions:**
- **TournamentGamesPage(props: Props)**: `JSX.Element` — [Server] Games page (moved from root). Renders unified games page for tournament predictions.
  Calls: buildTournamentMetadata, getTranslations, getLocale
  Renders: UnifiedGamesPage
  Tests:
  - renders UnifiedGamesPage with tournamentId
  - generates metadata with tournament title
  - renders without errors when locale is 'es'

### `app/[locale]/tournaments/[id]/hub/page.tsx` *(modified)*
**Changed functions:**
- **TournamentHubRedirectPage(props: Props)**: `JSX.Element` — [Server] Backward-compatibility redirect. Redirects `/hub` to tournament root.
  Calls: getLocale, redirect
  Tests:
  - calls redirect to `/${locale}/tournaments/${id}` for 'es' locale
  - calls redirect to `/${locale}/tournaments/${id}` for 'en' locale
  - redirect uses the correct tournamentId from params

### `app/components/tournament-hub/tournament-hub-offline-redirect.tsx` *(new)*
**New functions:**
- **TournamentHubOfflineRedirect({ tournamentId, locale }: { tournamentId: string; locale: string })**: `JSX.Element` — [Client] Detects offline state on mount and on `offline` browser event; navigates to `/games` when offline. Returns null (renders nothing visible).
  Calls: useRouter, useEffect
  Tests:
  - returns null and does not redirect when online
  - redirects to `/[locale]/tournaments/[id]/games` when offline at mount
  - redirects when browser fires `offline` event after mount
  - does not redirect a second time if already navigated (event fires multiple times)

### `app/components/groups-page/group-selector.tsx` *(modified)*
**Changed functions:**
- **GroupSelector({ groups, tournamentId, backgroundColor, textColor, user })**: `JSX.Element` — [Client] Tournament top navigation. Hub tab always rendered (no feature flag), uses Dashboard icon, links to root; Matches tab links to `/games`. getSelectedTab updated to use `/games` path for `'matches'` value.
  Tests:
  - hub tab always rendered without feature flag
  - hub tab href is `/tournaments/[id]` (root)
  - matches tab href is `/tournaments/[id]/games`
  - Dashboard icon present on hub tab
  - getSelectedTab returns 'hub' for root tournament path
  - getSelectedTab returns 'matches' for /games path

### `app/components/tournament-bottom-nav/tournament-bottom-nav.tsx` *(modified)*
**Changed functions:**
- **TournamentBottomNav({ tournamentId, currentPath, user })**: `JSX.Element` — [Client] Bottom navigation. Home button navigates unconditionally to `/tournaments/[id]`. Root path activates 'main-home'.
  Tests:
  - home button navigates to `/tournaments/[id]` (no /hub suffix)
  - root tournament path activates home tab
  - /games sub-path does not activate any bottom nav tab

### `app/components/home/tournament-redirect.tsx` *(modified)*
**Changed functions:**
- **TournamentRedirect({ tournaments })**: `JSX.Element` — [Client] Redirects to tournament root `/tournaments/[id]` always (no hub flag check).
  Tests:
  - redirects to `/[locale]/tournaments/[id]` (not /hub)
  - renders loading state when no redirect yet (no tournament in list)
  - does not redirect when openSignin query param is present

### `app/utils/environment-utils.ts` *(modified)*
- Remove `isHubEnabled()` — no longer needed
- `isDevelopmentMode()` unchanged

---

## Implementation Amendments

### Amendment 1: Auth Redirect Instead of Offline Detection
**Date:** 2026-04-18
**Reason:** During implementation, the requirement "offline: show Games page" was clarified by the user to mean "logged out: show Games page." The originally planned `TournamentHubOfflineRedirect` client component (using `navigator.onLine`) was replaced with a server-side auth check.
**Change:**
- `TournamentHubOfflineRedirect` was NOT created (plan listed it as a file to create)
- `app/[locale]/tournaments/[id]/page.tsx` now calls `getLoggedInUser()` and server-redirects unauthenticated users to `/games`
- `GroupSelector` Hub tab is `disabled={!user}` (grayed out for unauthenticated users)
- No `tournament-hub-offline-redirect.test.tsx` was created (listed in Testing Strategy — never implemented)

---

## Testing Strategy
- New `games/page.test.tsx` — mirrors existing `hub/__tests__/page.test.tsx` pattern (render + mock widgets)
- Updated `hub/__tests__/page.test.tsx` — tests redirect behavior (mock `redirect` from `next/navigation`)
- Updated `group-selector-i18n.test.tsx` — hub tab always present, correct hrefs; use `renderWithTheme`
- Updated `tournament-bottom-nav-i18n.test.tsx` — home navigates to root; use `renderWithTheme`, mock `useRouter`
- New `tournament-hub-offline-redirect.test.tsx` — online/offline state; mock `navigator.onLine`, mock `useRouter` via `next/navigation`
- Remove `isHubEnabled` tests from `environment-utils.test.ts`

All component tests use `renderWithTheme()` from `@/__tests__/utils/test-utils`. Mocks follow project convention: `vi.mock('next/navigation', ...)`, `vi.mock('next-intl', ...)`. No inline test factories needed (no DB data involved).

---

## Validation
1. Run `npm run test` — all tests pass
2. Run `npm run lint` — no lint errors
3. Run `npm run build` — builds successfully
4. In browser: navigate to `/tournaments/[id]` → Hub shows
5. In browser: navigate to `/tournaments/[id]/games` → Games show
6. In browser: navigate to `/tournaments/[id]/hub` → redirected to root
7. TopNav: Hub tab has Dashboard icon, Matches tab links to `/games`
8. Spanish: Hub shows "CENTRAL", Games shows "PARTIDOS"
9. Bottom nav Home button → goes to root (not /hub)
10. Offline: go offline → hub redirects to games

---

## CODE-STRUCTURE Files to Update
- `docs/code-structure/pages.md` — update `[id]/page.tsx` entry, add `[id]/games/page.tsx`, update `[id]/hub/page.tsx`
- `docs/code-structure/components/components-tournament-hub.md` — add `TournamentHubOfflineRedirect`
- `docs/code-structure/components/components-tournament-games.md` — remove feature flag references in GroupSelector
- Call graph: update Flow for tournament root navigation
