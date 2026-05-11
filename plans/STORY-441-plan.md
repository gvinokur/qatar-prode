# Plan: Story #441 — Migrate Hub banner states to PredictionStatusHeader

## Context

The Hub page has three bespoke banner components (`PriorityAttentionWidget`, `EngagementRotatorWidget`, `LoggedOffBanner`) that each render custom `Paper`/`Avatar`/`Button` cards. These duplicate the visual pattern of the shared `PredictionStatusHeader` component which already handles 20+ states on the Games, QT, and Awards pages through a clean `tone/leadIcon/statusText/action` system.

This story unifies the Hub's 9 banner states to use `PredictionStatusHeader` — eliminating the duplication, ensuring visual consistency, and making the `hub-header-variant.ts` adapter the single source of truth for Hub banner logic.

---

## Acceptance Criteria (from issue)

- Logged-out users see a sign-in CTA with "Learn How" + "Sign In / Sign Up" (no icons in buttons; login icon in status strip)
- Urgent games warning (< 24h), playoff available, QT/Awards deadline, QT nudge, Awards nudge, tutorial, app install, notification opt-in — all render via PSH with the correct tone/icon/actions
- 5-tier priority ordering preserved; engagement rotation preserved; hero banners untouched
- Hub banner visual style matches Games/QT/Awards pages
- Both EN and ES locales work
- Logged-out variant can optionally be reused on other pages

---

## Technical Approach

### Phase 1 — Extend PSH type system (5 new icons)

`app/components/prediction-status-header/types.ts`:
- Add `'login' | 'clock' | 'book' | 'mobile' | 'bell'` to the `leadIcon` union.

`app/components/prediction-status-header/prediction-status-header.tsx`:
- Add rendering for the 5 new icons in the `LeadIcon` switch:
  - `login` → `LoginIcon` from `@mui/icons-material/Login`
  - `clock` → `AccessTimeIcon` from `@mui/icons-material/AccessTime`
  - `book` → `MenuBookIcon` from `@mui/icons-material/MenuBook`
  - `mobile` → `InstallMobileIcon` from `@mui/icons-material/InstallMobile`
  - `bell` → `NotificationsNoneIcon` from `@mui/icons-material/NotificationsNone`

### Phase 2 — Enrich PriorityAttentionState with timing fields

`app/utils/priority-attention.ts`:
- Add `msUntilMostUrgentGame?: number` to `PriorityAttentionState` (populated in the `urgent-games` branch so `hub-header-variant.ts` can select the correct PSH tone: `deadlineNow` when < 2h, `deadlineUrgent` otherwise).
- Add `msUntilPredictionLock?: number` to `PriorityAttentionState` for the `deadline` branch (enables `deadlineUrgent` vs `deadlineSoon` tone selection in PSH).

### Phase 3 — Create hub-header-variant.ts

New file: `app/components/prediction-status-header/hub-header-variant.ts`

Follows the same pattern as `games-header-variant.ts`, `qt-header-variant.ts`, `awards-header-variant.ts`. Three exported functions:

**`computeHubPriorityVariant`** — maps `PriorityAttentionState` to `StatusHeaderVariant` for P1–P5 states. Uses `hub.attentionWidget.*` translation keys (reusing existing strings).

**`computeLoggedOutVariant`** — maps the logged-out state to `StatusHeaderVariant` for S1. Uses `tournament.public.*` keys; actions use `onClick` callbacks (no hrefs) since login/onboarding require dialog state.

**`computeEngagementVariant`** — maps engagement card types (P6 tutorial, P7 app-install, P8 notification-opt-in) to `StatusHeaderVariant`. Uses `hub.newUser.*` and `hub.attentionWidget.*` keys.

State → Variant mapping:
| State | Tone | leadIcon | action |
|-------|------|----------|--------|
| S1 Logged-Out | `brand` | `login` | `onClick:onSignIn` (primary), `onClick:onLearnHow` (secondary) |
| P1 Urgent Games | `deadlineNow`/`deadlineUrgent` | `clock` | href: `/games?edit=next` |
| P2 Playoff Available | `success` | `rocket` | href: `/games?edit={firstGameId}` |
| P3 Deadline | `deadlineSoon`/`deadlineUrgent` | `clock` | href: qtHref (primary), awardsHref (secondary when both incomplete) |
| P4 New Actions QT | `success` | `rocket` | href: qtHref |
| P5 New Actions Awards | `success` | `trophy` | href: awardsHref |
| P6 Tutorial | `brand` | `book` | `onClick:onTutorial` (primary), href: `gamesHref?edit=next` (secondary) |
| P7 App Install | `brand` | `mobile` | `onClick:onInstall` (primary), `onClick:onDismiss` (secondary) |
| P8 Notification | `brand` | `bell` | `onClick:onEnable` (primary), `onClick:onDismiss` (secondary) |

### Phase 4 — Update PriorityAttentionWidget (Server Component)

`app/components/tournament-hub/priority-attention-widget.tsx`:
- Import `PredictionStatusHeader` and `computeHubPriorityVariant`
- Replace the `buildCardConfig()` function + custom `<Paper variant="outlined">` render with `<PredictionStatusHeader variant={computeHubPriorityVariant(state, t, gamesHref, qtHref, awardsHref)} />`
- Remove `Paper`, `Stack`, `Avatar`, `Typography`, `Button` (MUI) imports that are no longer needed
- Remove the `CardConfig` type and `buildCardConfig` function

### Phase 5 — Update EngagementRotatorWidget (Client Component)

`app/components/tournament-hub/engagement-rotator-widget.tsx`:
- Import `PredictionStatusHeader` and `computeEngagementVariant`
- Keep all state management, localStorage logic, `beforeinstallprompt` detection, dialog state
- Remove the `EngagementCard` internal component and its `CardProps` interface
- For each card type (`pre-tournament-cta`, `app-install`, `notification-opt-in`): replace `<EngagementCard ...>` render with `<PredictionStatusHeader variant={computeEngagementVariant(type, t, callbackProps)} />`
- Tutorial open state (`tutorialOpen`) remains; `OnboardingDialogClient` still rendered below PSH when tutorialOpen

### Phase 6 — Update DashboardBanner / logged-out state (S1)

Current: `DashboardBanner (Server)` → `LoggedOffBanner (Client)` — custom blue banner.

New approach: replace `<LoggedOffBanner />` with a new `<HubLoggedOutHeader />` Client Component that:
- Manages `openAuthDialog` + `openOnboarding` useState
- Calls `computeLoggedOutVariant(t, () => setOpenAuthDialog(true), () => setOpenOnboarding(true))`
- Renders `<PredictionStatusHeader variant={variant} />`
- Conditionally renders `<LoginOrSignupDialog>` and `<OnboardingDialogClient>`

`LoggedOffBanner` in `public-cta-bar.tsx` is **kept as-is** (still used on other tournament pages with sticky=true style). A new `HubLoggedOutHeader` is created as a separate component in `tournament-hub/`.

This separation:
- Avoids breaking the sticky banner on tournament pages
- Keeps `public-cta-bar.tsx` stable (the `@deprecated` wrapper stays)
- Enables the logged-out PSH pattern to be reused by other pages via `computeLoggedOutVariant`

### Phase 7 — Write unit tests

New file: `app/components/prediction-status-header/__tests__/hub-header-variant.test.ts`

Tests cover all 9 variant states, tone selection logic, and action wiring.

---

## Files to Modify / Create

| File | Change |
|------|--------|
| `app/components/prediction-status-header/types.ts` | Add 5 leadIcon values |
| `app/components/prediction-status-header/prediction-status-header.tsx` | Render 5 new icons |
| `app/utils/priority-attention.ts` | Add 2 timing fields to PriorityAttentionState |
| `app/components/prediction-status-header/hub-header-variant.ts` | **NEW** — 3 variant functions |
| `app/components/tournament-hub/priority-attention-widget.tsx` | Replace bespoke card with PSH |
| `app/components/tournament-hub/engagement-rotator-widget.tsx` | Replace EngagementCard with PSH |
| `app/components/tournament-hub/dashboard-banner.tsx` | Use HubLoggedOutHeader |
| `app/components/tournament-hub/hub-logged-out-header.tsx` | **NEW** — Client wrapper for S1 |
| `app/components/prediction-status-header/__tests__/hub-header-variant.test.ts` | **NEW** — unit tests |
| `docs/code-structure/components/components-tournament-hub.md` | Update layer file |
| `docs/code-structure/components/components-shared-ui.md` | (minor update if PSH doc changes) |
| `CODE-STRUCTURE.md` | Update call graph Flow 29 |

---

## Mid-Level Design

### Call Graph Changes

**Modified flows:**

- **Flow 29 (Tournament Hub shell)** — In `DashboardBanner`, replace `LoggedOffBanner [Client]` with `HubLoggedOutHeader [Client]` (which renders `PredictionStatusHeader`). In `PriorityAttentionWidget`, replace the `Paper` card render with `PredictionStatusHeader [Client]`. In `EngagementRotatorWidget`, replace `EngagementCard` renders with `PredictionStatusHeader [Client]`.

**New flows:**
- None. The data flow and priority computation are unchanged.

---

### `app/components/prediction-status-header/types.ts` *(modified)*

**Changed types:**

- **`StatusHeaderVariant.leadIcon`**: `'rocket' | 'check' | 'info' | 'warning' | 'error' | 'lock' | 'flag' | 'trophy' | 'login' | 'clock' | 'book' | 'mobile' | 'bell'` *(was: no last 5)*

---

### `app/utils/priority-attention.ts` *(modified)*

**Changed types:**

- **`PriorityAttentionState`** — 2 optional fields added:
  - `msUntilMostUrgentGame?: number` — for `urgent-games` type: ms until the soonest game kicks off (enables `deadlineNow` vs `deadlineUrgent` tone selection in hub-header-variant.ts)
  - `msUntilPredictionLock?: number` — for `deadline` type: forwarded from `data.msUntilPredictionLock` (enables `deadlineSoon` vs `deadlineUrgent` tone selection)

**Changed functions:**

- **`computePriorityAttention(data)`**: `PriorityAttentionState | null` *(signature unchanged)*
  - `urgent-games` return now includes `msUntilMostUrgentGame: Math.min(...within24h.map(g => calculateDeadline(g.game_date) - now))`
  - `deadline` return (via `buildDeadlineState`) now includes `msUntilPredictionLock: data.msUntilPredictionLock`
  Tests:
  - existing tests all pass (fields are optional, additive change)
  - new: `msUntilMostUrgentGame` is set to the min deadline across urgent games
  - new: `msUntilPredictionLock` is forwarded into deadline state

---

### `app/components/prediction-status-header/hub-header-variant.ts` *(new)*

> Note: `Calls:` lists project-level functions only (repos, actions, utils). Translation helper `t()` and MUI imports are framework-level and not listed.

**New functions:**

- **`computeHubPriorityVariant(state, t, gamesHref, qtHref, awardsHref)`**: `StatusHeaderVariant`
  Maps `PriorityAttentionState` (all 5 types) to a `StatusHeaderVariant`. Tone selection for urgent-games uses `state.msUntilMostUrgentGame` (< 2h → `deadlineNow`, else `deadlineUrgent`; undefined treated as `deadlineUrgent`). Tone selection for deadline uses `state.msUntilPredictionLock` (< 24h → `deadlineUrgent`, else `deadlineSoon`; undefined treated as `deadlineSoon`). Dual-action for deadline when both qtIncomplete && awardsIncomplete.
  Calls: (none — pure data transformation)
  Tests (using local `makeUrgentState()`, `makeDeadlineState()` helpers and `mockT`):
  - urgent-games with msUntilMostUrgentGame < 2h → tone is `deadlineNow`, leadIcon is `clock`
  - urgent-games with msUntilMostUrgentGame >= 2h → tone is `deadlineUrgent`
  - urgent-games with msUntilMostUrgentGame undefined → defaults to `deadlineUrgent`
  - now-available-playoff → tone is `success`, leadIcon is `rocket`, action.href includes firstGameId
  - deadline qtIncomplete only → action.href is qtHref, secondaryAction absent
  - deadline awardsIncomplete only → action.href is awardsHref, secondaryAction absent
  - deadline both incomplete → action.href is qtHref, secondaryAction.href is awardsHref
  - deadline msUntilPredictionLock < 24h → tone is `deadlineUrgent`
  - deadline msUntilPredictionLock >= 24h → tone is `deadlineSoon`
  - deadline msUntilPredictionLock undefined → defaults to `deadlineSoon`
  - new-actions-qt → tone is `success`, leadIcon is `rocket`, action.href is qtHref
  - new-actions-awards → tone is `success`, leadIcon is `trophy`, action.href is awardsHref

- **`computeLoggedOutVariant(t, onSignIn, onLearnHow)`**: `StatusHeaderVariant`
  Returns a `brand`-tone variant with `leadIcon: 'login'`, primary action `{ label: t('loginOrSignup'), onClick: onSignIn }`, secondary action `{ label: t('learnHow'), onClick: onLearnHow }`. Translation namespace: `tournament.public`.
  Calls: (none)
  Tests (using `vi.fn()` for callbacks):
  - tone is `brand`, leadIcon is `login`
  - action.onClick is the exact provided onSignIn callback reference
  - secondaryAction.onClick is the exact provided onLearnHow callback reference
  - action.label uses the `loginOrSignup` key (via mockT return value)
  - secondaryAction.label uses the `learnHow` key

- **`computeEngagementVariant(cardType, t, props)`**: `StatusHeaderVariant`
  Maps one of `'pre-tournament-cta' | 'app-install' | 'notification-opt-in'` to `StatusHeaderVariant`. All use `brand` tone. Translation namespace: `hub`.
  - `pre-tournament-cta`: leadIcon `book`, primary action onClick `props.onTutorial`, secondary action href `props.gamesEditHref` (label: `hub.newUser.tracks.matches.ctaKeep` when `props.predictedGames > 0`, else `hub.newUser.tracks.matches.cta`)
  - `app-install`: leadIcon `mobile`, primary action onClick `props.onInstall`, secondary action onClick `props.onDismiss`
  - `notification-opt-in`: leadIcon `bell`, primary action onClick `props.onEnable`, secondary action onClick `props.onDismiss`
  Calls: (none)
  Tests (using `vi.fn()` for callbacks):
  - pre-tournament-cta returns leadIcon `book`, tone `brand`
  - pre-tournament-cta secondary action label key is `ctaKeep` when predictedGames > 0
  - pre-tournament-cta secondary action label key is `cta` (Start Predicting) when predictedGames === 0
  - pre-tournament-cta secondary action is an href action (not onClick)
  - app-install returns leadIcon `mobile`, primary onClick reference is onInstall callback
  - app-install secondary action onClick reference is onDismiss callback
  - notification-opt-in returns leadIcon `bell`, primary onClick reference is onEnable callback
  - notification-opt-in secondary action onClick reference is onDismiss callback

---

### `app/components/tournament-hub/hub-logged-out-header.tsx` *(new)*

**New component:**

- **`HubLoggedOutHeader()`**: `JSX.Element` — [Client] Manages `openAuthDialog` and `openOnboarding` via `useState`. Calls `computeLoggedOutVariant(t, () => setOpenAuthDialog(true), () => setOpenOnboarding(true))`. Renders `<PredictionStatusHeader variant={variant} />` + conditionally `<LoginOrSignupDialog>` + conditionally `<OnboardingDialogClient>`.
  Uses: useState, useTranslations('tournament.public'), computeLoggedOutVariant, PredictionStatusHeader, LoginOrSignupDialog, OnboardingDialogClient
  Tests: (rendering — covered by unit tests on computeLoggedOutVariant; full integration via Vercel Preview)

---

### `app/components/tournament-hub/priority-attention-widget.tsx` *(modified)*

**Changed functions:**

- **`PriorityAttentionWidget({ data, gamesHref, qtHref, awardsHref })`**: `Promise<JSX.Element | null>` *(signature unchanged)*
  When `computePriorityAttention(data)` returns non-null: calls `computeHubPriorityVariant(state, t, gamesHref, qtHref, awardsHref)` and renders `<PredictionStatusHeader variant={variant} />`. When null: renders `<EngagementRotatorWidget>` unchanged.
  Calls: computePriorityAttention, computeHubPriorityVariant, getTranslations

---

### `app/components/tournament-hub/engagement-rotator-widget.tsx` *(modified)*

**Changed functions:**

- **`EngagementRotatorWidget({ gamesHref, tournamentStarted, predictedGames })`**: `JSX.Element | null` *(signature unchanged)*
  Internal `EngagementCard` sub-component and `CardProps` interface removed. Each card render replaced with `<PredictionStatusHeader variant={computeEngagementVariant(cardType, t, callbackProps)} />`. Tutorial dialog (`{tutorialOpen && <OnboardingDialogClient>}`) kept below PSH.
  Calls: computeEngagementVariant

---

### `app/components/tournament-hub/dashboard-banner.tsx` *(modified)*

**Changed functions:**

- **`DashboardBanner({ user, timing })`**: `Promise<JSX.Element | null>` *(signature unchanged)*
  Replaces `<LoggedOffBanner />` import with `<HubLoggedOutHeader />` from `./hub-logged-out-header`.

---

## Visual Prototype

This story changes banner visual language — from a bespoke flat card to a consistent `PredictionStatusHeader` card.

### Before (PriorityAttentionWidget — P1 Urgent Games)
```
┌─────────────────────────────────────────────────────┐
│  [🕐 red]  3 games closing soon           [Predict] │  ← Paper outlined, Avatar 40x40, Button
│            Predict before kickoff...                │
└─────────────────────────────────────────────────────┘
```

### After (PredictionStatusHeader — P1 Urgent Games)
```
┌─────────────────────────────────────────────────────┐  ← Card, red border, red tinted bg
│ 🕐 3 games closing soon              [2/10] [Pred] │  ← status strip with icon + text + chip
├─────────────────────────────────────────────────────┤  ← divider
│ Predict before kickoff...              [Predict Now]│  ← expanded section (message + CTA)
└─────────────────────────────────────────────────────┘
```

The PSH card is more information-dense (shows chip, tone-colored border, message below divider) and uses the exact same visual treatment as the Games/QT/Awards pages.

### Before (LoggedOffBanner)
```
┌─────────────────────────────────────────────────────┐  ← primary.main blue fill
│ ℹ️ Sign in to submit your predictions   [🎓 Learn]  │
│                                  [🔑 Sign In/Signup]│
└─────────────────────────────────────────────────────┘
```

### After (PredictionStatusHeader — S1 Logged-Out)
```
┌─────────────────────────────────────────────────────┐  ← Card, primary border, brand tinted bg
│ 🔑 Sign in to submit your predictions  [Learn] [SI]│  ← status strip (no icons in buttons)
└─────────────────────────────────────────────────────┘
```

---

## Testing Strategy

### Unit Tests (`hub-header-variant.test.ts`)
- All 9 variant states × tone + icon + action assertions
- Tone escalation boundary tests (deadlineNow threshold at < 2h)
- Dual-action deadline when both qtIncomplete && awardsIncomplete
- Pre-tournament-cta secondary CTA label based on predictedGames

### Integration
- User manually tests all 9 states in Vercel Preview (each state requires different tournament/user conditions)
- EN + ES switching verified in preview

### Regression
- `npm run test` passes (all existing priority-attention, games-variant, qt-variant, awards-variant tests continue to pass)
- `npm run build` passes (TypeScript types — new leadIcon values are exhaustively handled)
- `npm run lint` passes

---

## Validation Considerations

- SonarCloud: new `hub-header-variant.ts` needs ≥ 80% coverage — unit tests for all 9 functions will cover this
- No DB migrations required
- No new translation keys required (all existing `hub.*` and `tournament.public.*` strings reused)
- TypeScript exhaustive check: adding 5 new values to `leadIcon` union will cause compile error until `LeadIcon` switch handles them (Phase 1 + 2 must be in same commit)

---

## Open Questions

None — the acceptance criteria and implementation notes in the issue are comprehensive.
