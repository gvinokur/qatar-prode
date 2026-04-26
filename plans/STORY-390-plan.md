# Story 390 Plan: Unified Priority Attention Widget

## Context

Part of Epic #389 (Guided Tournament Prediction Flow). Stories #392 (done) and #391 (in progress) built the internal game flow and deep-link plumbing. Story #390 is the "brain" — a single, prominent card on the hub that identifies the most urgent prediction task and directs the user straight to it.

**Problem being solved:** The hub shows multiple independent widgets (Games, QT, Awards, Stats, Leaderboard). When a user visits the hub, they have to visually parse all widgets to determine what's most important to do. There's no single "here's what to do right now" signal.

**Dependencies:**
- **#391 (In Progress, PR #397):** Adds `EDIT_NEXT_TOKEN = 'next'` and `?edit=next` URL support in `UnifiedGamesPageClient`. The attention widget's CTA links to `gamesHref?edit=next`. Implementation of #390 should wait until #391 is merged.

---

## Acceptance Criteria

- Authenticated users see at most one priority card at a time in the hub, above the widget grid
- The card type shown follows this priority (first match wins):
  1. `urgent-games` — `mode==='urgent'` with unpredicted games (error/red)
  2. `qt-deadline` — QT incomplete + deadline < 48h (warning/orange)
  3. `awards-deadline` — awards incomplete + deadline < 48h (warning/orange)
  4. `fallback-games` — `mode==='fallback'` with upcoming games (primary/blue)
  5. `pre-games` — pre-tournament, games not fully predicted (primary)
  6. `pre-qt` — pre-tournament, QT incomplete (primary)
  7. `pre-awards` — pre-tournament, awards incomplete (primary)
- Widget not shown when: unauthenticated, tournament finished, all predictions complete
- CTA for games types links to `gamesHref?edit=next` (requires #391)
- CTA for QT links to `qtHref`; for awards links to `awardsHref`
- Widget is full-width (not inside the responsive grid)

---

## Technical Approach

### Data Source
`ActionCenterData` is already fetched on the hub page (`getActionCenterGames`). The widget receives it as a prop — no additional server requests.

Key fields used:
- `mode`, `games`, `gameGuesses` — urgent/fallback game detection
- `tournamentHasStarted`, `tournamentFinished` — phase gating
- `qtAndAwardsOpen`, `msUntilPredictionLock` — QT/awards deadline urgency
- `qualifiersCompleted`, `qualifiersTotal`, `awardsCompleted`, `awardsTotal` — completion counts
- `predictedGames`, `totalGames` — game prediction progress

### Priority Logic

A new pure function `computePriorityAttention(data: ActionCenterData): PriorityAttentionState | null` in `hub-actions.ts`. The function is pure (no I/O) and returns `null` when nothing actionable exists.

**Active tournament** (`tournamentHasStarted = true`, `!tournamentFinished`):
1. `mode === 'urgent'` → `urgent-games` (games in `data.games` are already filtered to unpredicted urgent)
2. `qtAndAwardsOpen && qualifiersCompleted < qualifiersTotal && msUntilPredictionLock < 48h` → `qt-deadline`
3. `qtAndAwardsOpen && awardsCompleted < awardsTotal && msUntilPredictionLock < 48h` → `awards-deadline`
4. `mode === 'fallback' && predictedGames < totalGames` → `fallback-games`
5. `qtAndAwardsOpen && qualifiersCompleted < qualifiersTotal` → `qt-deadline` (no deadline urgency)
6. `qtAndAwardsOpen && awardsCompleted < awardsTotal` → `awards-deadline`

**Pre-tournament** (`!tournamentHasStarted`):
1. `predictedGames < totalGames` → `pre-games`
2. `qtAndAwardsOpen && qualifiersCompleted < qualifiersTotal` → `pre-qt`
3. `qtAndAwardsOpen && awardsCompleted < awardsTotal` → `pre-awards`

**Finished / nothing actionable** → `null`

### Component Structure

`PriorityAttentionWidget` is a **Server Component** (no client state needed). It calls `computePriorityAttention`, reads translations, builds the card content, and renders.

The card follows the same visual pattern as `TutorialCTACard`:
- `Paper variant="outlined"` full-width
- `Avatar` with icon (color varies by priority type)
- Title, subtitle
- `Button` component={Link} to the target href

Placed in `page.tsx` between `DashboardBanner` and the widget grid, full-width, only when `user && actionCenterData`.

---

## Visual Prototype

### Urgent Games (error/red)
```
┌─────────────────────────────────────────────────────────┐
│ 🔴  2 games closing soon           [ Predict Now → ]   │
│     Argentina vs Brazil closes in 1h 30m               │
└─────────────────────────────────────────────────────────┘
```

### QT Deadline (warning/orange)
```
┌─────────────────────────────────────────────────────────┐
│ ⚠️  Qualified Teams close in 18h   [ Finish → ]        │
│     12 of 24 predicted                                  │
└─────────────────────────────────────────────────────────┘
```

### Fallback / Pre-tournament (primary/blue)
```
┌─────────────────────────────────────────────────────────┐
│ ⚽  18 games to predict             [ Start → ]        │
│     Predict before each match kicks off                 │
└─────────────────────────────────────────────────────────┘
```

### MUI Component Breakdown
- Container: `Paper variant="outlined" sx={{ p: 2.5 }}`
- Layout: `Stack direction="row" alignItems="center" spacing={2}`
- Icon: `Avatar sx={{ bgcolor: avatarColor, width: 40, height: 40 }}`
- Text: `Stack flexGrow={1}` with `Typography variant="subtitle1" fontWeight="bold"` + `variant="body2" color="text.secondary"`
- CTA: `Button variant="contained" color={buttonColor} size="small" component={Link} href={href}`

**Color mapping per type:**
| Type | Avatar bgcolor | Button color |
|------|----------------|--------------|
| urgent-games | `error.main` | `error` |
| qt-deadline (< 48h) | `warning.main` | `warning` |
| awards-deadline (< 48h) | `warning.main` | `warning` |
| fallback-games | `primary.main` | `primary` |
| pre-games | `primary.main` | `primary` |
| pre-qt | `primary.main` | `primary` |
| pre-awards | `primary.main` | `primary` |

---

## Files to Create / Modify

| File | Action | Description |
|------|--------|-------------|
| `app/components/tournament-hub/priority-attention-widget.tsx` | **Create** | New Server Component |
| `app/actions/hub-actions.ts` | **Modify** | Add `PriorityAttentionState`, `computePriorityAttention` |
| `app/[locale]/tournaments/[id]/page.tsx` | **Modify** | Render widget between banner and grid |
| `locales/en/hub.json` | **Modify** | Add `attentionWidget.*` i18n keys |
| `locales/es/hub.json` | **Modify** | Add Spanish translations |
| `docs/code-structure/components/components-tournament-hub.md` | **Modify** | Document new component |
| `docs/code-structure/actions.md` | **Modify** | Document new exported function/type |
| `app/components/tournament-hub/__tests__/priority-attention-widget.test.tsx` | **Create** | Component tests |
| `app/actions/__tests__/hub-actions-priority.test.ts` | **Create** | Unit tests for `computePriorityAttention` |

---

## Mid-Level Design

### Call Graph Changes

**Modified flows:**
- **Flow 29 (Tournament Hub shell):** `TournamentHubPage` gains a new `PriorityAttentionWidget` render between `DashboardBanner` and the widget grid. Calls `computePriorityAttention` (new utility in `hub-actions.ts`) using the already-fetched `actionCenterData`.

No new cross-layer calls. `computePriorityAttention` is pure — no DB or network I/O.

---

### `app/actions/hub-actions.ts` *(modified)*

**New types:**

```typescript
export type PriorityAttentionType =
  | 'urgent-games'
  | 'qt-deadline'
  | 'awards-deadline'
  | 'fallback-games'
  | 'pre-games'
  | 'pre-qt'
  | 'pre-awards'

export interface PriorityAttentionState {
  type: PriorityAttentionType
  /** Number of unpredicted urgent games (for urgent-games type) */
  urgentCount?: number
  /** ID of the first urgent game for deep-linking (for urgent-games type) */
  firstUrgentGameId?: string
  /** Completed predictions for this priority item */
  completedCount: number
  /** Total predictions for this priority item */
  totalCount: number
}
```

**New function:**

- **`computePriorityAttention(data: ActionCenterData)`**: `PriorityAttentionState | null`
  Pure function — no I/O. Evaluates `ActionCenterData` to determine the highest-priority actionable item.
  Returns `null` when the tournament is finished or all relevant predictions are complete.
  Tests:
  - returns `null` when `tournamentFinished` is true
  - returns `urgent-games` when `mode==='urgent'` (tournament started) with unpredicted games
  - returns `qt-deadline` over `awards-deadline` when both incomplete and `msUntilPredictionLock < 48h`
  - returns `awards-deadline` when QT complete but awards incomplete and deadline < 48h
  - returns `fallback-games` when `mode==='fallback'` and `predictedGames < totalGames`
  - returns `qt-deadline` when QT incomplete and no deadline urgency (fallback after urgent/fallback)
  - returns `pre-games` when `!tournamentHasStarted` and `predictedGames < totalGames`
  - returns `pre-qt` when pre-tournament, games complete but QT incomplete
  - returns `pre-awards` when pre-tournament, games and QT complete but awards incomplete
  - returns `null` when pre-tournament and all predictions complete
  - urgent-games state includes `urgentCount = data.games.length` and `firstUrgentGameId = data.games[0].id`

---

### `app/components/tournament-hub/priority-attention-widget.tsx` *(created)*

**New component:**

- **`PriorityAttentionWidget({ data, gamesHref, qtHref, awardsHref })`**: `React.ReactNode`
  Server Component. Calls `computePriorityAttention(data)`. Returns `null` when state is null.
  Builds title, subtitle, href, and color from the returned `PriorityAttentionState`.
  Calls: `computePriorityAttention`
  Props:
  - `data: ActionCenterData`
  - `gamesHref: string` — base games URL (widget appends `?edit=next`)
  - `qtHref: string`
  - `awardsHref: string`
  Tests:
  - renders nothing when `computePriorityAttention` returns null (tournament finished)
  - renders error-colored card with "Predict Now" CTA when type is `urgent-games`
  - renders warning-colored card when type is `qt-deadline` with deadline < 48h
  - renders primary-colored card for `fallback-games`
  - renders primary-colored card for `pre-games` with games href including `?edit=next`
  - CTA button has correct href for each type (games=`gamesHref?edit=next`, qt=`qtHref`, awards=`awardsHref`)
  - subtitle shows `completedCount`/`totalCount` for QT/awards types

---

### `app/[locale]/tournaments/[id]/page.tsx` *(modified)*

**Changed behavior:** Adds `PriorityAttentionWidget` between `DashboardBanner` and the widget grid.

```tsx
<DashboardBanner user={user} timing={timing} data={data} />

{user && actionCenterData && (
  <PriorityAttentionWidget
    data={actionCenterData}
    gamesHref={gamesHref}
    qtHref={`/${locale}/tournaments/${id}/qualified-teams`}
    awardsHref={`/${locale}/tournaments/${id}/awards`}
  />
)}

<Box sx={{ display: 'grid', ... }}>
  ...
</Box>
```

No new data fetching. Uses already-available `user`, `actionCenterData`, `locale`, `id`, `gamesHref`.

---

## i18n Keys

Add to `locales/en/hub.json` under `"attentionWidget"`:

```json
"attentionWidget": {
  "urgentGames": {
    "title": "{count, plural, one {1 game closing soon} other {{count} games closing soon}}",
    "subtitle": "Predict before it's too late — you won't be able to change this after kickoff.",
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
  "fallbackGames": {
    "title": "Games to predict",
    "subtitle": "{completed} of {total} games predicted",
    "cta": "Predict Games"
  },
  "preGames": {
    "title": "Start predicting matches",
    "subtitle": "{completed} of {total} games predicted",
    "cta": "Predict Now"
  },
  "preQt": {
    "title": "Predict who qualifies",
    "subtitle": "{completed} of {total} slots predicted",
    "cta": "Pick Qualifiers"
  },
  "preAwards": {
    "title": "Choose your award winners",
    "subtitle": "{completed} of {total} awards predicted",
    "cta": "Pick Awards"
  }
}
```

---

## Testing Strategy

### `hub-actions-priority.test.ts` — Unit tests for `computePriorityAttention`
- Pure function tests covering all 7 priority types + null cases
- Use `testFactories.actionCenterData(overrides)` factory for test data
- Target: 100% branch coverage (all 10+ test cases in Mid-Level Design)

### `priority-attention-widget.test.tsx` — Component render tests
- Use `renderWithTheme` wrapper
- Mock `computePriorityAttention` return values
- Test card title, subtitle, href, button color for each priority type
- Test null/empty rendering
- Target: 80% line coverage

---

## Validation Considerations

- **No new DB queries** — widget uses already-fetched `ActionCenterData`
- **Server Component** — no client bundle impact
- **SonarCloud:** 0 new issues; keep functions < 20 lines; extract constants for magic numbers
- **i18n:** Register `hub` namespace is already registered; no new namespace needed
- **#391 dependency:** The `?edit=next` link will silently degrade to opening games page without edit mode until #391 is merged — acceptable since both are planned for the same sprint

---

## Open Questions

1. **Should the widget be dismissible?** The mockup showed a close button, but implementing dismiss state requires either a cookie/localStorage (client state) or a database flag. Given scope, I recommend **no dismiss** for now — the widget simply disappears when the priority condition resolves (i.e., the user acts on it).

2. **Pre-tournament: should `pre-games` show even at 100%?** No — the check is `predictedGames < totalGames`, so it hides at 100%.

3. **Does `qt-deadline` show when QT isn't open yet?** No — guarded by `qtAndAwardsOpen`. Pre-tournament is handled by the `pre-qt` type.
