# Story 355 Plan: Dashboard — Refined Banners & Logic

## Context

Story 354 (complete) established the new dashboard layout: a two-zone page with a full-width **Banner Area** (placeholder dashed Paper) and a **Widget Grid** (4 mock DashboardCards). This story (Story 355) replaces the placeholder with real banner logic.

Currently `page.tsx` redirects non-logged-in users to `/games`. The new design removes that redirect and instead shows one of three banners based on user state, in priority order:

1. **Logged Off** — user is unauthenticated
2. **New User** — user is authenticated but incomplete (`computeIsIncompleteUser = true`)
3. **Hero** — countdown before tournament starts, or 48 h celebration after

---

## Worktree Setup (before coding)

```bash
./scripts/github-projects-helper story start 355 --project 1
# Creates /Users/gvinokur/Personal/qatar-prode-story-355
# Branch: feature/story-355
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `app/components/tournament-hub/dashboard-banner.tsx` | Server Component: selects & renders the right banner |
| `app/components/tournament-hub/logged-off-banner.tsx` | Client Component: ported from `PublicCTABar`, with `#1e1b4b` bg |
| `app/components/tournament-hub/__tests__/dashboard-banner.test.tsx` | Unit tests |

## Files to Modify

| File | Change |
|------|--------|
| `app/[locale]/tournaments/[id]/page.tsx` | Remove redirect + placeholder; render `DashboardBanner` |
| `app/components/tournament-hub/tutorial-cta-card.tsx` | Add `fullWidth` prop for the New User Banner variant |
| `docs/code-structure/components/components-tournament-hub.md` | Document new components |

---

## Visual Design

### Logged Off Banner — `#1e1b4b` deep-indigo background

```
┌──────────────────────────────────────────────────────────────┐
│  ℹ  Join the prediction game — sign up to compete with      │
│     friends                      [Learn How] [Login / Sign Up]│
└──────────────────────────────────────────────────────────────┘
```

- Full-width, non-sticky `Box`
- `backgroundColor: '#1e1b4b'`, `color: 'white'`
- `borderRadius: 1`, `p: 2`
- Row layout: icon + message on left, two buttons on right
- Buttons: "Learn How" (outlined, white border) opens `OnboardingDialogClient`;
  "Login / Sign Up" (contained, white bg, dark text) opens `LoginOrSignupDialog`

### New User Banner — full-width `TutorialCTACard`

```
┌──────────────────────────────────────────────────────────────┐
│  [?]  New here? Learn how to predict  │  [View Tutorial]     │
└──────────────────────────────────────────────────────────────┘
```

- Same content as current `TutorialCTACard`
- When `fullWidth` prop is passed: width 100%, slightly taller padding
- Existing compact card (used in `PreTournamentNewUserActionCenter`) unchanged

### Hero Banner

- **Countdown** (`PreTournamentCountdown`) — shown when tournament hasn't started  
  Already exists; reused directly  
- **Celebration** (`TournamentStartBanner`) — shown 48 h after first game  
  Already exists; reused directly  
- **null** — no banner when tournament is ongoing past the 48 h window

---

## Mid-Level Design

### Call Graph Changes

**Modified flow:**
- `TournamentHubPage` → `DashboardBanner` → `getActionCenterGames` (only when user is logged in) → `computeIsIncompleteUser`

No other call-graph flows affected.

---

### `app/components/tournament-hub/logged-off-banner.tsx` *(new)*

**New components:**

- **`LoggedOffBanner()`**: `JSX.Element`
  Client Component. Sticky (top-level) banner for unauthenticated users.
  Renders an `Info` icon, a localized message, and two action buttons.
  Uses `useState` for dialog visibility.
  Calls: `LoginOrSignupDialog`, `OnboardingDialogClient`
  Tests:
  - renders with correct background color `#1e1b4b`
  - "Learn How" button opens OnboardingDialogClient when clicked
  - "Login / Sign Up" button opens LoginOrSignupDialog when clicked

---

### `app/components/tournament-hub/tutorial-cta-card.tsx` *(modified)*

**Changed components:**

- **`TutorialCTACard({ fullWidth?: boolean })`**: `JSX.Element` *(was: no props)*
  When `fullWidth=true`, uses `Paper` with full-width layout (existing row layout, slightly larger padding).
  When `fullWidth=false` (default), renders identically to current component.
  Tests:
  - renders tutorial title and CTA button when `fullWidth` is omitted (default behavior unchanged)
  - renders tutorial title and CTA button when `fullWidth=true`
  - clicking the CTA button opens OnboardingDialogClient in both variants

---

### `app/components/tournament-hub/dashboard-banner.tsx` *(new)*

**New components:**

- **`DashboardBanner({ tournamentId, locale, user })`**: `Promise<JSX.Element | null>`
  Server Component. Orchestrates banner priority logic.
  Props: `{ tournamentId: string; locale: Locale; user: User | null }`
  - Returns `<LoggedOffBanner />` when `user` is `null`
  - Calls `getActionCenterGames`, then `computeIsIncompleteUser`; returns `<TutorialCTACard fullWidth />` when incomplete
  - Returns `<TournamentStartBanner />` when `data.tournamentJustStarted`
  - Returns `<PreTournamentCountdown firstGameDate={data.firstGameDate} tournamentName={data.tournamentName} />` when not started and firstGameDate is set
  - Returns `null` otherwise
  Calls: `getActionCenterGames`, `computeIsIncompleteUser`, `LoggedOffBanner`, `TutorialCTACard`, `TournamentStartBanner`, `PreTournamentCountdown`
  Tests:
  - returns LoggedOffBanner when user is null (no data fetch)
  - returns TutorialCTACard with fullWidth when computeIsIncompleteUser is true
  - returns TournamentStartBanner when tournamentJustStarted is true and user is complete
  - returns PreTournamentCountdown when tournament hasn't started, firstGameDate is set, and user is complete
  - returns null when tournament has started more than 48 h ago (ongoing, user is complete)
  - returns null when firstGameDate is null and tournament hasn't started (no games configured)
  
  **Error handling:** If `getActionCenterGames` throws (Unauthorized or DB error), the error propagates to the Next.js error boundary — no silent fallback, since this indicates a real server error.
  Additional tests:
  - re-throws when `getActionCenterGames` throws an Unauthorized error
  - re-throws when `getActionCenterGames` throws a DB error

---

### `app/[locale]/tournaments/[id]/page.tsx` *(modified)*

**Changed behavior:**
- Remove `redirect(/${locale}/tournaments/${id}/games)` for unauthenticated users
- Import and render `<DashboardBanner tournamentId={id} locale={locale} user={user} />` in place of the placeholder `Stack + Paper`

---

## Testing Strategy

Run unit tests in `__tests__/dashboard-banner.test.tsx`:
- Use `renderWithTheme` (from `app/components/test-utils`) for all component renders
- Use `testFactories.actionCenterData(overrides)` to build `ActionCenterData` fixtures
- Mock `getActionCenterGames` and `computeIsIncompleteUser` via `vi.mock`
- Test all 6 code paths in `DashboardBanner` (logged-off, new-user, tournament-just-started, pre-tournament, ongoing, null firstGameDate)
- `logged-off-banner.test.tsx`: dialog interaction tests using `renderWithTheme` + `fireEvent` for button clicks

Coverage: new components + modified TutorialCTACard → target ≥ 80%

---

## Implementation Waves

**Wave 1 (parallel):**
- Create `logged-off-banner.tsx` + its test
- Modify `tutorial-cta-card.tsx` (add `fullWidth` prop) + update its test

**Wave 2:**
- Create `dashboard-banner.tsx` + `dashboard-banner.test.tsx`

**Wave 3:**
- Modify `page.tsx` (remove redirect, add DashboardBanner)
- Update `docs/code-structure/components/components-tournament-hub.md`

---

## Validation

```bash
npm run test -- --coverage
npm run lint
npm run build
```

Then deploy to Vercel Preview and verify:
1. Visit dashboard while logged out → Logged Off Banner shown, no redirect
2. Log in as new/incomplete user → New User Banner (full-width tutorial CTA) shown
3. Log in as established user, tournament not started → Countdown banner shown
4. Log in as established user, tournament just started → Celebration banner shown
5. Widget Grid (4 mock cards) still renders correctly in all states
