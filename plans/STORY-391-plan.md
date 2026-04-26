# Story 391 Plan: Prediction Entry Point & 'Open for Edit' Flow

## Context

Story #392 (done) built the internal guided flow within the Games page — auto-advance between games, stage transitions, etc. Story #391 is the integration layer: every external CTA that links to the Games page should land the user with the most relevant game already open for editing, triggering the guided flow automatically.

**The core problem:** All hub widget CTAs and the urgency popover "Edit" buttons navigate to the plain `/games` URL. The guided edit flow built in #392 is only triggered via `?edit=<gameId>` — so users who tap "View All" or "Start predicting" from the hub land on the full games list with nothing open, missing the flow entirely.

There is also a **bug**: `UrgencyAccordionGroup.handleEditGame` navigates to `/tournaments/${id}?edit=...` (the hub page), not the games page. The hub page has no edit param handling, so the button silently fails.

---

## Acceptance Criteria (derived from epic + story objective)

- Every CTA that routes to the Games page opens the most relevant game in edit mode
- Hub carousel "View All" button opens the currently-shown game for editing
- Hub info widget CTA opens the first upcoming game for editing (`?edit=next`)
- Urgency accordion "Edit" buttons (on the games page) scroll to the game and open it for editing (bug fix)
- `?edit=next` is a supported URL token that resolves to the first upcoming game

---

## Technical Approach

### `?edit=next` token

Add a special URL param value `"next"` that tells `UnifiedGamesPageClient` to find the first upcoming game (using existing `findScrollTarget`) and open it for editing. This avoids coupling the hub (server-rendered) to specific game IDs at render time.

Define it as `EDIT_NEXT_TOKEN = 'next'` in `app/utils/prediction-constants.ts`.

### Entry Point Changes

| Entry Point | File | Change |
|---|---|---|
| Hub carousel "View All" | `games-active-client.tsx` | `href={gamesHref}` → `href={\`${gamesHref}?edit=${currentGame.id}\`}` |
| Hub info widget CTA | `games-info-widget.tsx` | When logged in, pass `${gamesHref}?edit=next` to `GamesInfoWidgetCta` |
| Urgency popover edit | `urgency-accordion-group.tsx` | Fix URL: `/tournaments/${id}?edit=` → `/tournaments/${id}/games?edit=` |

### `UnifiedGamesPageClient` Extension

Effect 1 (the edit-param detector, ~lines 95–107) is extended to handle the `"next"` token:

```typescript
if (editParam === EDIT_NEXT_TOKEN) {
  const scrollTarget = findScrollTarget(games) // "game-{id}" | null
  targetGameId = scrollTarget ? scrollTarget.slice('game-'.length) : null
} else {
  targetGameId = editParam
}
```

After this point, the existing two-effect scroll+edit flow works unchanged.

---

## Visual Prototype

No new UI components. The changes are behavioral: CTAs that previously linked to `/games` now link to `/games?edit=<id>` or `/games?edit=next`, causing the games page to auto-scroll and open the relevant game card for editing. The existing FlippableGameCard flip animation is the visual feedback.

**Flow (hub → games):**
```
Hub carousel                   Games page
┌─────────────────────┐        ┌──────────────────────────────┐
│  [Game Card]        │        │  CompactPredictionDashboard  │
│  [↑] [↓]           │  ───►  │  GameFilters                 │
│  [View All Games]   │  edit  │  ──────────────────────────  │
└─────────────────────┘        │  [Other games...]            │
                               │  ┌────────────────────────┐  │
                               │  │ [TARGET GAME - flipped]│  │
                               │  │ Edit controls visible  │  │
                               │  └────────────────────────┘  │
                               └──────────────────────────────┘
```

---

## Files to Create / Modify

| File | Action | Description |
|---|---|---|
| `app/utils/prediction-constants.ts` | Modify | Add `EDIT_NEXT_TOKEN = 'next'` |
| `app/components/unified-games-page-client.tsx` | Modify | Handle `?edit=next` in Effect 1 |
| `app/components/tournament-hub/games-active-client.tsx` | Modify | "View All" href includes current game ID |
| `app/components/tournament-hub/games-info-widget.tsx` | Modify | CTA href includes `?edit=next` when logged in |
| `app/components/urgency-accordion-group.tsx` | Modify | Fix navigation URL to games page |

**Test files:**
- `app/components/__tests__/urgency-accordion-group-navigation.test.tsx` (already exists — update)
- New tests for `unified-games-page-client`, `games-active-client`, `games-info-widget`

---

## Mid-Level Design

### Call Graph Changes

No new cross-layer call relationships. All changes are within the component layer: existing navigation patterns adjusted to include `?edit` params.

**Modified flows:**
- **Hub → Games (carousel):** `GamesActiveClient` "View All" button now appends `?edit=currentGame.id`
- **Hub → Games (info widget):** `GamesInfoWidget` now appends `?edit=next` when logged in
- **Games page urgency popover → Games page:** `UrgencyAccordionGroup.handleEditGame` now routes to `/games?edit=gameId` (was routing to hub, broken)

### `app/utils/prediction-constants.ts` *(modified)*

**New exports:**
- **`EDIT_NEXT_TOKEN`**: `"next"` — special value for the `?edit` URL param meaning "resolve to first upcoming game at page load time"
  - No tests needed (plain constant)

### `app/components/unified-games-page-client.tsx` *(modified)*

**Changed behavior — Effect 1 (edit param detection):**

Current behavior: if `searchParams.get('edit')` is present, store it as `pendingEditGameId` and clear filters.

New behavior: if edit param is `EDIT_NEXT_TOKEN`, resolve it to the first upcoming game ID via `findScrollTarget(games)` (strip `"game-"` prefix), then proceed identically to the specific-ID path.

Calls: `findScrollTarget` (from `app/utils/auto-scroll`)

Tests:
- `?edit=next` with upcoming games → sets `pendingEditGameId` to first upcoming game's ID
- `?edit=next` with no upcoming games → sets `pendingEditGameId` to last game's ID (findScrollTarget fallback)
- `?edit=next` clears `activeFilter`, `groupFilter`, `roundFilter`
- `?edit=specificId` unchanged behavior (regression guard)
- `?edit=next` with empty games array → does not set `pendingEditGameId`

### `app/components/tournament-hub/games-active-client.tsx` *(modified)*

**Changed behavior — "View All" button href:**

Current: `href={gamesHref}`
New: `href={\`${gamesHref}?edit=${currentGame.id}\`}`

No signature change. `currentGame` is already available in scope (line 92).

Tests:
- "View All" button href contains `?edit=` followed by `currentGame.id`
- When `currentIndex` changes (next game shown), href updates to new game's ID
- When `gamesHref` already has query params (defensive), test does not apply here (gamesHref never has params)

### `app/components/tournament-hub/games-info-widget.tsx` *(modified)*

**Changed behavior — CTA href computation:**

Current: `<GamesInfoWidgetCta href={gamesHref} ... />`
New: `<GamesInfoWidgetCta href={isLoggedOff ? gamesHref : \`${gamesHref}?${EDIT_NEXT_TOKEN_PARAM}\`} ... />`

Where `EDIT_NEXT_TOKEN_PARAM = \`edit=${EDIT_NEXT_TOKEN}\`` or simply inline: `` `${gamesHref}?edit=next` ``

Calls: none (string interpolation)

Tests:
- when `isLoggedOff=false`, CTA href ends with `?edit=next`
- when `isLoggedOff=true`, CTA href is plain `gamesHref` (login dialog path — no edit param)
- CTA href does not double-add `?edit=next` if called twice (static render, not a concern)

### `app/components/urgency-accordion-group.tsx` *(modified)*

**Important:** This component is used from three pages — Games, Qualified Teams, and Awards. The fix applies uniformly; all three should navigate to `/games?edit=<gameId>` since the edit flow lives on the games page.

**Changed functions:**

- **`handleEditGame(gameId: string)`**: void *(was: navigating to hub page with broken ?edit param)*
  Bug fix: navigates to games page: `/${locale}/tournaments/${tournamentId}/games?edit=${gameId}`
  Calls: `router.push` (Next.js)
  Tests:
  - navigates to `/games?edit=<gameId>` (not hub page) when game is found
  - includes locale prefix in the URL
  - does not navigate when game ID is not found in the games array

---

## Implementation Steps

**Wave 1 — Foundation (no dependencies)**
1. Add `EDIT_NEXT_TOKEN` to `prediction-constants.ts`
2. Fix `urgency-accordion-group.tsx` navigation URL bug

**Wave 2 — Core (depends on Wave 1)**
3. Extend `UnifiedGamesPageClient` Effect 1 for `?edit=next`
4. Update `games-active-client.tsx` "View All" href
5. Update `games-info-widget.tsx` CTA href

**Wave 3 — Tests**
6. Write/update tests for all modified components

---

## Implementation Amendments

### Amendment 1: ?edit=next resolution uses isGuessComplete, not findScrollTarget
**Date:** 2026-04-26
**Reason:** Post-preview bug report — `?edit=next` was opening the first chronological upcoming game, not the first *unpredicted* upcoming game. Users who had already predicted some games were being sent to re-edit a predicted game.
**Change:** Effect 1's `EDIT_NEXT_TOKEN` branch now uses `isGuessComplete` + `guessesContext.gameGuesses` to find the first upcoming game where the guess is not complete. `findScrollTarget` is retained as a fallback when all upcoming games are predicted. `guessesContext.gameGuesses` added to Effect 1 dependency array. Two new tests added: one for the primary "skips predicted" path, one for the "all predicted → fallback" path.

## Testing Strategy

**Unit tests (Vitest) for each changed file:**

- `urgency-accordion-group-navigation.test.tsx` — existing file, add test case for correct URL
- `unified-games-page-client.test.tsx` — test `?edit=next` resolution with mocked `findScrollTarget`
- `games-active-client.test.tsx` — test "View All" href includes game ID
- `games-info-widget.test.tsx` — test CTA href logged-in vs logged-off

**Manual end-to-end flow:**
1. Open tournament hub → click "View All Games" → verify current carousel game opens in edit mode
2. Open tournament hub (pre-tournament state) → click "Start Predicting" → verify first upcoming game opens in edit mode
3. On games page → click game prediction row → open urgency popover → click "Edit" on a game → verify popover closes, page scrolls to game, game opens in edit mode
4. Navigate to `/games?edit=next` directly → verify first upcoming game opens in edit mode

---

## Worktree Setup

Story worktree will be at `/Users/gvinokur/Personal/qatar-prode-story-391` on branch `feature/story-391`.

Run: `./scripts/github-projects-helper story start 391 --project 1`

---

## Validation

- `npm run test` — all tests pass
- `npm run lint` — no new issues  
- `npm run build` — builds successfully
- SonarCloud: 0 new issues, ≥80% coverage on new/changed code
