# Story 355 Plan: Dashboard — Refined Banners & Logic

## Context

Story 354 (complete) established the new dashboard layout: a two-zone page with a full-width **Banner Area** (placeholder dashed Paper) and a **Widget Grid** (4 mock DashboardCards). This story (Story 355) replaces the placeholder with real banner logic.

Currently `page.tsx` redirects non-logged-in users to `/games`. The new design removes that redirect. Instead, the Banner Area renders a **vertical stack** of banners — hero banners always display first (when applicable), and a secondary CTA banner is appended below:

| Layer | Condition | Banner |
|-------|-----------|--------|
| Hero | Tournament not started, `firstGameDate` set | `PreTournamentCountdown` |
| Hero | Tournament just started (≤48 h) | `TournamentStartBanner` |
| Secondary | User is unauthenticated | `LoggedOffBanner` |
| Secondary | User is authenticated but incomplete | `TutorialCTACard fullWidth` |

Hero and secondary are independent — a logged-off user who visits pre-tournament sees **both** the countdown and the login prompt.

---

## Worktree Setup (already done)

Worktree: `/Users/gvinokur/Personal/qatar-prode-story-355`
Branch: `feature/story-355`

---

## Files to Create

| File | Purpose |
|------|---------|
| `app/components/tournament-hub/dashboard-banner.tsx` | Server Component: stacks hero + secondary banners |
| `app/components/tournament-hub/__tests__/dashboard-banner.test.tsx` | Unit tests |

## Files to Modify

| File | Change |
|------|--------|
| `app/[locale]/tournaments/[id]/page.tsx` | Remove redirect; fetch `ActionCenterData`; pass to `DashboardBanner` |
| `app/components/tournament-page/public-cta-bar.tsx` | Add `sticky?: boolean` prop; rename export to `LoggedOffBanner`; update internal styles to use `#1e1b4b` |
| `app/components/tournament-page/public-games-page.tsx` | Update import from `LoggedOffBanner` (extracted from `PublicCTABar`) |
| `app/components/tournament-hub/tutorial-cta-card.tsx` | Add `fullWidth` prop for the New User Banner variant |
| `docs/code-structure/components/components-tournament-hub.md` | Document new `DashboardBanner` component |

---

## Visual Design

### Banner Area Stack

```
┌──────────────────────────────────────────────────────┐
│  ⏳  Tournament starts in: 12d  3h  22m              │  ← Hero (countdown)
│       FIFA 2026 kicks off soon!                      │
└──────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────┐
│  ℹ  Join the game — sign up to predict with friends  │  ← Secondary (logged-off)
│                          [Learn How]  [Login / Sign Up] │
└──────────────────────────────────────────────────────┘
```

When tournament is ongoing and user is established → Banner Area renders nothing (null).

### Logged Off Banner (extracted from `PublicCTABar`)

- `backgroundColor: 'primary.main'`, `color: 'primary.contrastText'`, `borderRadius: 1`, `p: 2`
- Row layout: `Info` icon + message (left), two buttons (right)
- `sticky` prop: when `true` adds `position: sticky, top: 0, zIndex: 1000` (used by games page)
- Default (`sticky=false`): non-sticky, used by dashboard banner area

### New User Banner — full-width `TutorialCTACard`

Same content as current compact `TutorialCTACard`. When `fullWidth=true`: `Paper` stretches full width with slightly taller padding.

---

## Mid-Level Design

### Call Graph Changes

**Modified flows:**
- `TournamentHubPage` → `getActionCenterGames` (new: data fetched at page level, not inside DashboardBanner)
- `TournamentHubPage` → `DashboardBanner` (receives `data` prop, no internal fetch)
- `DashboardBanner` → `computeIsIncompleteUser` (still called inside banner component)

---

### `app/components/tournament-page/public-cta-bar.tsx` *(modified)*

**Changed components:**

- **`LoggedOffBanner({ sticky?: boolean })`**: `JSX.Element` *(was: `PublicCTABar()` with no props)*
  Renamed export. When `sticky=true`, applies `position: sticky, top: 0, zIndex: 1000` (current games-page usage). When omitted, non-sticky for dashboard banner area. Background stays `primary.main` (no custom color).
  Calls: `LoginOrSignupDialog`, `OnboardingDialogClient`
  Tests:
  - renders with `primary.main` background color
  - applies sticky positioning when `sticky=true`
  - does not apply sticky positioning when `sticky` is omitted
  - "Learn How" button opens `OnboardingDialogClient`
  - "Login / Sign Up" button opens `LoginOrSignupDialog`

---

### `app/components/tournament-hub/tutorial-cta-card.tsx` *(modified)*

**Changed components:**

- **`TutorialCTACard({ fullWidth?: boolean })`**: `JSX.Element` *(was: no props)*
  When `fullWidth=true`, renders `Paper` at full width with slightly taller padding.
  When omitted (default), renders identically to current compact card.
  Tests:
  - renders tutorial title and CTA button when `fullWidth` is omitted (default behavior unchanged)
  - renders tutorial title and CTA button when `fullWidth=true`
  - clicking the CTA button opens `OnboardingDialogClient` in both variants

---

### `app/components/tournament-hub/dashboard-banner.tsx` *(new)*

**New components:**

- **`DashboardBanner({ user, data })`**: `Promise<JSX.Element | null>`
  Server Component. Receives pre-fetched data from the page; stacks hero banner (if any) and secondary CTA banner (if any).
  Props: `{ user: User | null; data: ActionCenterData | null }`
  Logic:
  - Hero: `TournamentStartBanner` if `data.tournamentJustStarted`; else `PreTournamentCountdown` if `!data.tournamentHasStarted && data.firstGameDate !== null`; else null
  - Secondary: `<LoggedOffBanner />` if `!user`; else `<TutorialCTACard fullWidth />` if `await computeIsIncompleteUser(data)`; else null
  - Returns null if both hero and secondary are null
  - Returns a `Stack gap={2}` wrapping whichever banners are non-null
  Calls: `computeIsIncompleteUser`, `LoggedOffBanner`, `TutorialCTACard`, `TournamentStartBanner`, `PreTournamentCountdown`
  Tests:
  - renders only LoggedOffBanner when user is null and data is null (no hero, no data)
  - renders PreTournamentCountdown + LoggedOffBanner when tournament hasn't started and user is null
  - renders PreTournamentCountdown + TutorialCTACard when tournament hasn't started and user is incomplete
  - renders only PreTournamentCountdown when tournament hasn't started and user is complete
  - renders TournamentStartBanner + LoggedOffBanner when tournament just started and user is null
  - renders only TournamentStartBanner when tournament just started and user is complete
  - returns null when tournament is ongoing (past 48 h) and user is complete (no banner needed)
  - returns null when firstGameDate is null and user is complete

---

### `app/[locale]/tournaments/[id]/page.tsx` *(modified)*

**Changed behavior:**
- Remove `if (!user) redirect(...)` (non-logged-in users now see the dashboard with `LoggedOffBanner`)
- Fetch: `const data = user ? await getActionCenterGames(tournamentId, locale) : null`
- Render `<DashboardBanner user={user} data={data} />` replacing the placeholder `Stack + Paper`

---

## Testing Strategy

Run unit tests with:
- `renderWithTheme` (from `app/components/test-utils`) for all component renders
- `testFactories.actionCenterData(overrides)` to build `ActionCenterData` fixtures
- `vi.mock` to mock `computeIsIncompleteUser`

Coverage: all new/modified components → target ≥ 80%

---

## Implementation Waves

**Wave 1 (parallel):**
- Extract `LoggedOffBanner` from `public-cta-bar.tsx` (add `sticky` prop, update bg color) + update `public-games-page.tsx` import + add/update tests
- Modify `tutorial-cta-card.tsx` (add `fullWidth` prop) + update tests

**Wave 2:**
- Create `dashboard-banner.tsx` + `dashboard-banner.test.tsx`

**Wave 3:**
- Modify `page.tsx` (remove redirect, fetch data, add `DashboardBanner`)
- Update `docs/code-structure/components/components-tournament-hub.md`

---

## Implementation Amendments

### Amendment 1: TournamentTiming + getPublicTournamentTiming (hub-actions.ts)
**Date:** 2026-04-22
**Reason:** Hero banners were not appearing for logged-out users because the hero layer read from `ActionCenterData`, which is auth-gated and returns null for guests.
**Change:** Added `TournamentTiming` interface and `getPublicTournamentTiming(tournamentId, locale)` to `hub-actions.ts`. This function calls `findTournamentById` and `findFirstGameInTournament` without an auth check, returning the minimal timing fields needed for hero banners.

### Amendment 2: DashboardBanner now receives timing prop
**Date:** 2026-04-22
**Reason:** Part of the same logged-out hero banner fix.
**Change:** `DashboardBanner` props expanded from `{ user, data }` to `{ user, timing, data }`. Hero layer now reads from `timing: TournamentTiming | null` (always available) instead of `data` (auth-gated). `page.tsx` always calls `getPublicTournamentTiming` via `Promise.all` regardless of auth state.

## Validation

```bash
npm run test -- --coverage
npm run lint
npm run build
```

Then verify in Vercel Preview:
1. Visit dashboard while logged out (pre-tournament) → Countdown + LoggedOff Banner stacked
2. Visit dashboard while logged out (tournament ongoing) → LoggedOff Banner only
3. Log in as new/incomplete user (pre-tournament) → Countdown + New User Banner stacked
4. Log in as established user (pre-tournament) → Countdown only
5. Log in as established user (tournament just started) → Celebration Banner only
6. Widget Grid (4 mock cards) renders correctly in all states
