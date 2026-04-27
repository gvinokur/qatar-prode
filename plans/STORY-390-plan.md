# Story 390 Plan: Unified Priority Attention Widget

## Context

Part of Epic #389 (Guided Tournament Prediction Flow). Stories #392 (done) and #391 (in progress) built the internal game flow and deep-link plumbing. Story #390 is the "brain" — a single, prominent card slot on the hub that identifies the most important action and directs the user straight to it, covering prediction urgency, stage guidance, onboarding, and engagement features.

**Problem being solved:**
1. The hub shows multiple independent widgets without a single "here's what to do right now" signal.
2. App install and notification prompts live as global snackbars with no connection to tournament context.
3. The pre-tournament onboarding card (TutorialCTACard) is generic — it doesn't adapt to the user's prediction state.
4. No stage-transition guidance exists when a user completes one prediction category and should move to the next.

**Dependencies:**
- **#391 (In Progress, PR #397):** Adds `EDIT_NEXT_TOKEN = 'next'` — CTA links for game types use `gamesHref?edit=next`. Gracefully degrades to plain `gamesHref` until #391 is merged.

---

## Acceptance Criteria

- Authenticated hub users see at most **one** priority action card at a time, above the widget grid
- Priority hierarchy (first match wins):
  1. **Urgent** — unpredicted games closing soon (error), OR QT/awards deadline < 48h (warning)
  2. **Stage transition** — a prediction category just hit 100%, next category is at 0%
  3. **Rotation** — visit-based cycle through: pre-tournament CTA, app-install prompt, notification opt-in (each only when applicable and not dismissed)
  4. **Nothing** — all tiers exhausted
- Widget not shown when: unauthenticated, no actionCenterData, tournament finished
- `TutorialCTACard` in `DashboardBanner` is removed; pre-tournament guidance lives in the rotation pool
- Snackbars removed: `InstallPwa` (global layout), `NotificationsSubscriptionPrompt` (nested inside InstallPwa), `EmptyAwardsSnackbar` (tournament layout)
- Rotation state persists across page visits via localStorage; dismissals permanently remove a card from rotation

---

## Technical Approach

### Widget Structure: Two Components

**`PriorityAttentionWidget` — Server Component**
- Receives `ActionCenterData` (already fetched on hub page — no new DB calls)
- Calls `computePriorityAttention(data)` → returns card type for Tiers 1–2
- If Tier 1–2 is active: renders static card (Paper + Avatar + title + subtitle + Link button)
- If null: renders `<EngagementRotatorWidget>` (client slot for Tier 3)
- Returns null when no actionCenterData or tournament finished

**`EngagementRotatorWidget` — Client Component**
- Reads client-side state: `window.matchMedia('(display-mode: standalone)')`, `Notification.permission`
- Reads dismissal states from localStorage (reusing `dismissal-storage.ts` utility)
- Reads/increments `hub-engagement-visit-count` in localStorage on each mount
- Builds available pool: `[pre-tournament-cta (always), app-install?, notification-opt-in?]`
  - `app-install` included when: `beforeinstallprompt` fired OR iOS (not standalone), not dismissed
  - `notification-opt-in` included when: permission !== 'denied', not subscribed, not dismissed
- Shows `pool[visitCount % pool.length]`
- Dismiss handlers: write to localStorage, remove card from pool

### Priority Logic (`computePriorityAttention`)

**Tier 1 — Urgent (tournament active, `!tournamentFinished`, `tournamentHasStarted`):**
1. `mode === 'urgent'` → `urgent-games` (games in `data.games` are already filtered to unpredicted urgent)
2. `qtAndAwardsOpen && qualifiersCompleted < qualifiersTotal && msUntilPredictionLock < 48h` → `qt-deadline`
3. `qtAndAwardsOpen && awardsCompleted < awardsTotal && msUntilPredictionLock < 48h` → `awards-deadline`

**Tier 2 — Stage Transition (pre-tournament or early active):**
4. `predictedGames === totalGames && totalGames > 0 && qualifiersCompleted === 0 && qualifiersTotal > 0` → `transition-to-qt`
5. `qualifiersCompleted === qualifiersTotal && qualifiersTotal > 0 && awardsCompleted === 0` → `transition-to-awards`
6. `mode === 'fallback' && predictedGames < totalGames` → `fallback-games` (fallback window, predict now)
7. `qtAndAwardsOpen && qualifiersCompleted < qualifiersTotal` → `qt-nudge` (low urgency, no deadline)
8. `qtAndAwardsOpen && awardsCompleted < awardsTotal` → `awards-nudge`

**Finished / all complete → null (EngagementRotatorWidget takes over)**

**Note:** Pre-tournament prediction guidance moves entirely into the Tier 3 rotation pool as `pre-tournament-cta`.

### Snackbar Removals

| Component | Location | Action |
|---|---|---|
| `InstallPwa` | `app/[locale]/layout.tsx` | Remove import + mount |
| `notifications-subscription-prompt.tsx` | nested inside `Install-pwa.tsx` | File can be repurposed or deleted |
| `Install-pwa.tsx` | `app/components/` | Repurpose: extract iOS guide content reused in widget |
| `EmptyAwardsSnackbar` | `app/[locale]/tournaments/[id]/layout.tsx` | Remove import + mount |
| `app/components/awards/empty-award-notification.tsx` | Component file | Delete |

### DashboardBanner Simplification

Remove the `computeIsIncompleteUser` secondary layer. After this story, `DashboardBanner` only renders:
- Hero layer: `TournamentStartBanner` or `PreTournamentCountdown` (unchanged)
- Secondary layer: `LoggedOffBanner` only (when `!user`)

`computeIsIncompleteUser` in `hub-actions.ts` becomes unused — can be removed or left (dead code scan will catch it).

### Hub Page Change

```tsx
<DashboardBanner user={user} timing={timing} data={data} />

{user && actionCenterData && (
  <PriorityAttentionWidget
    data={actionCenterData}
    gamesHref={gamesHref}
    qtHref={`/${locale}/tournaments/${id}/qualified-teams`}
    awardsHref={`/${locale}/tournaments/${id}/awards`}
    locale={locale}
    tournamentId={id}
  />
)}

<Box sx={{ display: 'grid', ... }}>
  ...
```

---

## Visual Prototypes

### Tier 1 — Urgent Games (error/red)
```
┌──────────────────────────────────────────────────────────┐
│  🔴  2 games closing soon          [ Predict Now →  ]   │
│      Deadline approaching — predict before kickoff       │
└──────────────────────────────────────────────────────────┘
```

### Tier 1 — QT/Awards Deadline (warning/orange)
```
┌──────────────────────────────────────────────────────────┐
│  ⚠️   Qualified Teams close in 18h  [ Finish →     ]   │
│       12 of 24 predicted                                 │
└──────────────────────────────────────────────────────────┘
```

### Tier 2 — Stage Transition (success/green)
```
┌──────────────────────────────────────────────────────────┐
│  ✅  All games predicted!           [ Pick Qualifiers → ]│
│      Next: choose who advances from each group           │
└──────────────────────────────────────────────────────────┘
```

### Tier 2 — Fallback / QT Nudge (primary/blue)
```
┌──────────────────────────────────────────────────────────┐
│  ⚽  18 games still to predict      [ Predict →    ]    │
│      28 of 46 predicted                                  │
└──────────────────────────────────────────────────────────┘
```

### Tier 3 — Pre-Tournament CTA (rotation slot)
```
┌──────────────────────────────────────────────────────────┐
│  🎯  Start predicting before kickoff  [ Let's Go → ]    │
│      Lock in your picks before the tournament starts     │
└──────────────────────────────────────────────────────────┘
```

### Tier 3 — App Install (rotation slot, dismissible)
```
┌──────────────────────────────────────────────────────────┐
│  📲  Install for a better experience  [ Install →  ]  ✕ │
│      Add Qatar Prode to your home screen                 │
└──────────────────────────────────────────────────────────┘
```

### Tier 3 — Notification Opt-in (rotation slot, dismissible)
```
┌──────────────────────────────────────────────────────────┐
│  🔔  Get notified when games start    [ Enable →   ]  ✕ │
│      Never miss a result or closing deadline             │
└──────────────────────────────────────────────────────────┘
```

**MUI Components:** `Paper variant="outlined" sx={{ p: 2.5 }}` · `Stack direction="row"` · `Avatar` (40×40) · `Stack flexGrow={1}` with two `Typography` · `Button variant="contained" size="small" component={Link}` · optional `IconButton` (dismiss ✕)

**Color mapping:**

| Card type | Avatar bgcolor | Button color |
|---|---|---|
| urgent-games | `error.main` | `error` |
| qt-deadline / awards-deadline | `warning.main` | `warning` |
| transition-to-qt / transition-to-awards | `success.main` | `success` |
| fallback-games / qt-nudge / awards-nudge | `primary.main` | `primary` |
| pre-tournament-cta | `primary.main` | `primary` |
| app-install | `info.main` | `info` |
| notification-opt-in | `info.main` | `info` |

---

## Files to Create / Modify

| File | Action | Description |
|------|--------|-------------|
| `app/components/tournament-hub/priority-attention-widget.tsx` | **Create** | Server Component — Tiers 1–2 |
| `app/components/tournament-hub/engagement-rotator-widget.tsx` | **Create** | Client Component — Tier 3 rotation |
| `app/actions/hub-actions.ts` | **Modify** | Add `PriorityAttentionState`, `computePriorityAttention`; remove `computeIsIncompleteUser` |
| `app/[locale]/tournaments/[id]/page.tsx` | **Modify** | Add widget between banner and grid |
| `app/components/tournament-hub/dashboard-banner.tsx` | **Modify** | Remove TutorialCTACard secondary layer |
| `app/[locale]/layout.tsx` | **Modify** | Remove `InstallPwa` import + mount |
| `app/[locale]/tournaments/[id]/layout.tsx` | **Modify** | Remove `EmptyAwardsSnackbar` import + mount |
| `app/components/Install-pwa.tsx` | **Delete** | Snackbar replaced by widget |
| `app/components/notifications-subscription-prompt.tsx` | **Delete** | Snackbar replaced by widget |
| `app/components/awards/empty-award-notification.tsx` | **Delete** | Snackbar replaced by widget |
| `locales/en/hub.json` | **Modify** | Add `attentionWidget.*` i18n keys |
| `locales/es/hub.json` | **Modify** | Spanish translations |
| `docs/code-structure/components/components-tournament-hub.md` | **Modify** | Document new components |
| `docs/code-structure/actions.md` | **Modify** | Document new exported types/functions |
| Test files (×2) | **Create** | Unit + component tests |

---

## Mid-Level Design

### Call Graph Changes

**Modified flows:**
- **Flow 29 (Tournament Hub shell):** `TournamentHubPage` adds `PriorityAttentionWidget` between `DashboardBanner` and the grid. `DashboardBanner` removes `computeIsIncompleteUser` + `TutorialCTACard`.
- **Global layout:** `app/[locale]/layout.tsx` removes `InstallPwa` (and its nested `NotificationsSubscriptionPrompt`).

**New flows:**
- `TournamentHubPage` → `PriorityAttentionWidget` → `computePriorityAttention` (pure, no DB)
- `TournamentHubPage` → `PriorityAttentionWidget` → `EngagementRotatorWidget` (client, localStorage only)

---

### `app/actions/hub-actions.ts` *(modified)*

**New exported types:**

```typescript
export type PriorityAttentionType =
  | 'urgent-games'
  | 'qt-deadline' | 'awards-deadline'
  | 'transition-to-qt' | 'transition-to-awards'
  | 'fallback-games'
  | 'qt-nudge' | 'awards-nudge'

export interface PriorityAttentionState {
  type: PriorityAttentionType
  urgentCount?: number          // urgent-games: count of unpredicted urgent games
  firstUrgentGameId?: string    // urgent-games: deep-link target
  completedCount: number
  totalCount: number
}
```

**New function:**

- **`computePriorityAttention(data: ActionCenterData)`**: `PriorityAttentionState | null`
  Pure function — no I/O. Evaluates tournament phase and completion state to return the highest-priority actionable item. Returns `null` when nothing actionable (engagement rotation takes over).
  Calls: nothing (pure computation)
  Tests:
  - returns `null` when `tournamentFinished`
  - returns `urgent-games` when `mode==='urgent'`, includes `urgentCount = data.games.length` and `firstUrgentGameId = data.games[0].id`
  - returns `qt-deadline` before `awards-deadline` when both incomplete and `msUntilPredictionLock < 48h`
  - returns `awards-deadline` when QT complete but awards incomplete and deadline < 48h
  - returns `transition-to-qt` when `predictedGames === totalGames && qualifiersCompleted === 0`
  - returns `transition-to-awards` when `qualifiersCompleted === qualifiersTotal && awardsCompleted === 0`
  - returns `fallback-games` when `mode==='fallback'` and `predictedGames < totalGames`
  - returns `qt-nudge` when QT incomplete and no deadline urgency, no transition condition
  - returns `null` when tournament not started and all predictions complete (no active phase priority)
  - does NOT return pre-tournament guidance types (those live in EngagementRotatorWidget)
  - returns `null` gracefully when `ActionCenterData` fields are at zero/default values (empty tournament)

**Removed:**
- `computeIsIncompleteUser` — no longer used after DashboardBanner simplification

---

### `app/components/tournament-hub/priority-attention-widget.tsx` *(created)*

- **`PriorityAttentionWidget({ data, gamesHref, qtHref, awardsHref, locale, tournamentId })`**: `React.ReactNode`
  Server Component. Calls `computePriorityAttention`, builds card content (title, subtitle, href, color), renders `Paper` card or `<EngagementRotatorWidget>` when null.
  Calls: `computePriorityAttention`
  Props: `data: ActionCenterData`, `gamesHref: string`, `qtHref: string`, `awardsHref: string`, `locale: Locale`, `tournamentId: string`
  Tests:
  - renders null when `computePriorityAttention` returns null AND renders `EngagementRotatorWidget` slot
  - renders error Paper card for `urgent-games` with CTA href = `${gamesHref}?edit=next`
  - renders warning Paper card for `qt-deadline`; CTA href = `qtHref`
  - renders success Paper card for `transition-to-qt`; CTA href = `qtHref`
  - renders primary Paper card for `fallback-games`; CTA href = `${gamesHref}?edit=next`
  - CTA href for awards types = `awardsHref`
  - subtitle shows `completedCount`/`totalCount` for completion-based types

---

### `app/components/tournament-hub/engagement-rotator-widget.tsx` *(created)*

- **`EngagementRotatorWidget({ gamesHref, tournamentStarted })`**: `React.ReactNode`
  Client Component. On mount: detects PWA install state, notification permission, dismissal states from localStorage, increments `hub-engagement-visit-count`. Builds available card pool and renders `pool[visitCount % pool.length]`. Returns null when pool is empty.
  Pool card types: `'pre-tournament-cta'` (always, when `!tournamentStarted`), `'app-install'` (when applicable + not dismissed), `'notification-opt-in'` (when applicable + not dismissed)
  Dismiss handlers use `dismissal-storage.ts` utility with keys: `engagement-app-install-dismissed`, `engagement-notification-dismissed`
  Tests:
  - shows `pre-tournament-cta` card on first visit when tournament not started
  - shows `app-install` card on second visit when install applicable and not dismissed
  - shows `notification-opt-in` card when permission !== 'granted' and not dismissed
  - skips dismissed cards in rotation (pool shrinks on dismiss)
  - returns null when all cards dismissed or inapplicable
  - does NOT show `pre-tournament-cta` when `tournamentStarted` is true
  - increments visit counter on mount
  - gracefully degrades (renders null) when localStorage is unavailable or throws

---

## i18n Keys (locales/en/hub.json — add under `"attentionWidget"`)

```json
"attentionWidget": {
  "urgentGames": {
    "title": "{count, plural, one {1 game closing soon} other {{count} games closing soon}}",
    "subtitle": "Predict before kickoff — scores lock 1 hour before each match",
    "cta": "Predict Now"
  },
  "qtDeadline": {
    "title": "Qualified Teams closing soon",
    "subtitle": "{completed} of {total} predicted",
    "cta": "Finish QT"
  },
  "awardsDeadline": {
    "title": "Awards closing soon",
    "subtitle": "{completed} of {total} predicted",
    "cta": "Finish Awards"
  },
  "transitionToQt": {
    "title": "Games locked in — pick your qualifiers!",
    "subtitle": "Choose who advances from each group before the window closes",
    "cta": "Pick Qualifiers"
  },
  "transitionToAwards": {
    "title": "Qualifiers done — now choose your awards",
    "subtitle": "Golden Boot, Best Goalkeeper and more",
    "cta": "Choose Awards"
  },
  "fallbackGames": {
    "title": "Games to predict",
    "subtitle": "{completed} of {total} games predicted",
    "cta": "Predict Games"
  },
  "qtNudge": {
    "title": "Don't forget Qualified Teams",
    "subtitle": "{completed} of {total} slots predicted",
    "cta": "Go to QT"
  },
  "awardsNudge": {
    "title": "Don't forget Awards",
    "subtitle": "{completed} of {total} awards predicted",
    "cta": "Go to Awards"
  },
  "preTournamentCta": {
    "title": "Start predicting before kickoff",
    "subtitle": "Lock in your picks — you can edit right up until each match starts",
    "cta": "Let's Go"
  },
  "appInstall": {
    "title": "Install for a better experience",
    "subtitle": "Add Qatar Prode to your home screen",
    "cta": "Install"
  },
  "notificationOptIn": {
    "title": "Get notified when games start",
    "subtitle": "Never miss a result or a closing deadline",
    "cta": "Enable"
  }
}
```

---

## Testing Strategy

### `hub-actions-priority.test.ts` — Unit tests for `computePriorityAttention`
- Pure function: all 9+ test cases from Mid-Level Design
- Use `testFactories.actionCenterData(overrides)`
- 100% branch coverage

### `priority-attention-widget.test.tsx` — Server Component render tests
- Mock `computePriorityAttention` return values
- Use `renderWithTheme` wrapper
- Verify card content (title, href, button color) for each type
- Verify `EngagementRotatorWidget` slot rendered when priority is null

### `engagement-rotator-widget.test.tsx` — Client Component tests
- Mock `localStorage`, `window.matchMedia`, `Notification.permission`
- Test rotation pool composition (all 3 present → 3-card cycle)
- Test dismissal shrinks pool
- Test null when all dismissed

---

## Validation Considerations

- **No new DB queries** — both new components use already-fetched data or client-only APIs
- **Server Component default** — `PriorityAttentionWidget` has zero client bundle impact
- **Client component isolation** — `EngagementRotatorWidget` is a leaf; SSR renders null, hydration fills in
- **Snackbar removal** — `InstallPwa` and `EmptyAwardsSnackbar` are global/layout mounts; removing them requires verifying no other component depends on them (confirmed: none found)
- **SonarCloud:** 0 new issues; delete dead code (`computeIsIncompleteUser`) rather than leave it

---

## Open Questions

1. **Rotation display:** Should `EngagementRotatorWidget` auto-advance within a single session (timed, e.g. every 8s), or only advance on page re-visit? Current plan: **page-visit based** (simpler, less jarring).

2. **`pre-tournament-cta` when tournament has started:** The rotation slot currently excludes it when `tournamentStarted`. Should it show "keep predicting" guidance instead? Current plan: **yes** — when tournament active and Tiers 1–2 return null, the `EngagementRotatorWidget` shows `[app-install?, notification-opt-in?]` only (no pre-tournament CTA).

3. **iOS PWA install:** `beforeinstallprompt` doesn't fire on Safari/iOS. The existing `Install-pwa.tsx` has an iOS-specific guide. The engagement card should retain that branch (show install card on iOS in standalone check).
