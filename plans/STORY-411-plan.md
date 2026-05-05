# Story 411: Hub page — stop fetching action center data for finished tournaments and eliminate duplicate tournament queries

## Context

The tournament hub page (`/tournaments/[id]`) loads multiple data sources on each request. Two of those sources — `getTournamentHubPageData` and `getPublicTournamentTiming` — independently call `findTournamentById` and `findFirstGameInTournament`, resulting in those two DB queries executing twice on every hub page load. A third source, `getActionCenterGames`, is already correctly guarded by `!hubData.isFinished && user` so it is not called for finished tournaments.

This story merges the timing queries into the main hub data action, eliminating the 2 duplicate DB calls and removing `getPublicTournamentTiming` as a separate server action.

**Out of scope:** Consolidating the prediction completion queries inside `getActionCenterGames` (those 7+ sequential queries are a separate story).

---

## Acceptance Criteria

1. Hub page displays correctly for an active tournament with an authenticated user
2. Hub page displays correctly for a finished tournament — action center not shown, no errors, all other widgets appear
3. Hub page displays correctly for a pre-tournament (not yet started) state
4. Unauthenticated user sees the public hub view with no errors
5. No visible change in content or behavior for any user type
6. `findTournamentById` and `findFirstGameInTournament` are each called exactly once per hub page load (instead of twice)

---

## Problem Analysis

### Current query duplication (per hub page load)

| Query | `getTournamentHubPageData` | `getPublicTournamentTiming` | `getActionCenterGames` |
|---|---|---|---|
| `findTournamentById` | ✓ | ✓ **DUPLICATE** | ✓ (active only) |
| `findFirstGameInTournament` | ✓ | ✓ **DUPLICATE** | ✓ (active only) |
| `findLastGameInTournament` | ✓ | — | ✓ (active only) |

**On every hub load:** 2 guaranteed duplicate queries (timing function).
**On active authenticated loads:** 3 additional duplicates in `getActionCenterGames` (left for a follow-up story per Out of Scope).

### Existing guard (already in place — not changed by this story)

`page.tsx:48` already prevents `getActionCenterGames` from being called for finished tournaments:
```typescript
!hubData.isFinished && user ? getActionCenterGames(id, locale) : Promise.resolve(null),
```

---

## Technical Approach

### Step 1 — Extend `TournamentHubPageData` and merge timing into `getTournamentHubPageData`

Add the four timing fields to `TournamentHubPageData`:

```typescript
export interface TournamentHubPageData {
  // existing fields unchanged
  scoringConfig: ScoringConfig
  totalGames: number
  isStarted: boolean
  isNearStart: boolean
  isFinished: boolean
  qualifiersTotal: number
  awardsTotal: number
  // NEW: timing fields (merged from getPublicTournamentTiming)
  firstGameDate: Date | null
  tournamentHasStarted: boolean
  tournamentJustStarted: boolean
  tournamentName: string | null
}
```

Change the signature: `getTournamentHubPageData(tournamentId: string, locale: Locale): Promise<TournamentHubPageData>`

Internal DB call consolidation — all five queries already run in one `Promise.all`:
```typescript
const [tournament, firstGame, lastGame, totalGamesResult, firstStageRound] = await Promise.all([...])
```
The timing derivations (`tournamentHasStarted`, `tournamentJustStarted`) are computed from the same `firstGame` already fetched. No new DB calls.

Delete `getPublicTournamentTiming` — it is only consumed by the hub page.

### Step 2 — Update `page.tsx`

Simplify the two-batch fetch pattern:

**Before:**
```typescript
// Batch 1
const [hubData, user] = await Promise.all([
  getTournamentHubPageData(id),
  getLoggedInUser(),
])
// Batch 2
const [timing, data] = await Promise.all([
  getPublicTournamentTiming(id, locale),
  !hubData.isFinished && user ? getActionCenterGames(id, locale) : Promise.resolve(null),
])
const actionCenterData = data
```

**After:**
```typescript
// Single batch — no more separate timing call
const [hubData, user] = await Promise.all([
  getTournamentHubPageData(id, locale),
  getLoggedInUser(),
])
const actionCenterData = !hubData.isFinished && user
  ? await getActionCenterGames(id, locale)
  : null
```

Replace all `timing?.xxx` references with `hubData.xxx`:
- `timing?.firstGameDate` → `hubData.firstGameDate`
- `timing?.tournamentHasStarted` → `hubData.tournamentHasStarted`
- `timing` (passed to `DashboardBanner`) → `hubData` (structurally compatible — `TournamentHubPageData` is a superset of `TournamentTiming`)

### Step 3 — Keep `TournamentTiming` exported for `DashboardBanner`

`DashboardBanner` accepts `timing: TournamentTiming | null`. Since `TournamentHubPageData` will contain all four `TournamentTiming` fields, `hubData` is assignable to `TournamentTiming` via TypeScript structural subtyping. No change needed to `DashboardBanner`.

### Step 4 — Update tests

**`hub-actions.test.ts`:**
- Add `locale` param to all `getTournamentHubPageData(TOURNAMENT_ID, 'en')` calls
- Add tests for timing fields returned by the merged function
- Fold `getPublicTournamentTiming` describe block into `getTournamentHubPageData` tests (or keep as separate describe targeting the same merged function)

**`page-metadata.test.tsx`:**
- Extend `DEFAULT_HUB_DATA` with timing fields (`firstGameDate: null, tournamentHasStarted: false, tournamentJustStarted: false, tournamentName: null`)
- Remove `mockGetPublicTournamentTiming` mock and all references
- Remove the `getPublicTournamentTiming` entry from the `hub-actions` vi.mock factory
- Update timing-driven tests (Results widget, QualifiedTeams lock, etc.) to set fields on `mockGetTournamentHubPageData` return instead of `mockGetPublicTournamentTiming`
- Add: test for "does not call getActionCenterGames when tournament is finished"

---

## Files to Modify

| File | Change |
|---|---|
| `app/actions/hub-actions.ts` | Extend `TournamentHubPageData` interface; add `locale` param to `getTournamentHubPageData`; merge timing queries inside it; delete `getPublicTournamentTiming` |
| `app/[locale]/tournaments/[id]/page.tsx` | Simplify to single-batch fetch; remove timing variable; use `hubData` for timing fields |
| `app/[locale]/tournaments/[id]/__tests__/page-metadata.test.tsx` | Update mocks and test cases as described |
| `app/actions/__tests__/hub-actions.test.ts` | Add `locale` param; fold timing tests into merged function tests |
| `docs/code-structure/actions.md` | Update `getTournamentHubPageData` entry (new signature + return type); remove `getPublicTournamentTiming` entry |
| `CODE-STRUCTURE.md` | Update call graph (hub page flow — timing no longer a separate call) |

---

## Mid-Level Design

### Call Graph Changes

**Modified flow (hub page load):**

Before:
```
TournamentHubPage
  → getTournamentHubPageData(id)          # DB: tournament, firstGame, lastGame, totalGames, qualifiers
  → getPublicTournamentTiming(id, locale) # DB: tournament (dup), firstGame (dup)
  → getActionCenterGames(id, locale)      # if !isFinished && user
```

After:
```
TournamentHubPage
  → getTournamentHubPageData(id, locale)  # DB: tournament, firstGame, lastGame, totalGames, qualifiers + timing
  → getActionCenterGames(id, locale)      # if !isFinished && user (unchanged)
```

### `app/actions/hub-actions.ts` *(modified)*

**Changed interfaces:**

- **`TournamentHubPageData`** — adds four new fields: `firstGameDate: Date | null`, `tournamentHasStarted: boolean`, `tournamentJustStarted: boolean`, `tournamentName: string | null`. Existing fields unchanged.

**Changed functions:**

- **`getTournamentHubPageData(tournamentId: string, locale: Locale)`**: `Promise<TournamentHubPageData>` *(was: no locale param, returned without timing fields)*
  Fetches shared tournament metadata AND timing fields for hero banners in a single DB round-trip. Eliminates the separate `getPublicTournamentTiming` call.
  Calls: findTournamentById, findFirstGameInTournament, findLastGameInTournament, computeTournamentName, buildScoringConfig
  Tests:
  - returns `isFinished=true` when last game date is in the past
  - returns `isFinished=false` when last game date is in the future
  - returns `tournamentHasStarted=true` when first game date is in the past
  - returns `tournamentHasStarted=false` when first game date is in the future
  - returns `tournamentJustStarted=true` when first game kicked off within the last 48h
  - returns `tournamentJustStarted=false` when first game kicked off more than 48h ago
  - returns `firstGameDate=null` and `tournamentHasStarted=false` when no games exist
  - returns `tournamentName` as the locale-resolved short_name from tournament
  - returns `tournamentName=null` when tournament row is not found

**Deleted functions:**
- **`getPublicTournamentTiming`** — merged into `getTournamentHubPageData`; only caller was `page.tsx`

### `app/[locale]/tournaments/[id]/page.tsx` *(modified)*

No new exported functions. Internal logic change:
- Remove `timing` variable; use `hubData.firstGameDate`, `hubData.tournamentHasStarted` etc. directly
- `getPublicTournamentTiming` import removed
- `getTournamentHubPageData` call now receives `locale` as second argument
- Two-batch `Promise.all` pattern simplified: timing no longer a separate parallel call

### `app/[locale]/tournaments/[id]/__tests__/page-metadata.test.tsx` *(modified)*

Key test updates:
- `DEFAULT_HUB_DATA` gains timing fields; existing hub-data-driven tests unaffected
- `getPublicTournamentTiming` mock removed from `vi.mock('hub-actions')` factory
- Timing-driven tests (Results widget visibility, QT/Awards lock state, DashboardBanner) now set fields on `mockGetTournamentHubPageData` return value instead of `mockGetPublicTournamentTiming`
- New test added:
  - "does not call getActionCenterGames when tournament is finished" — sets `isFinished: true` on hub data mock, verifies `mockGetActionCenterGames` not called
  Tests:
  - does not call getActionCenterGames when tournament is finished
  - does not call getActionCenterGames when user is not logged in (existing, kept)
  - calls getActionCenterGames when user is logged in and tournament is not finished (existing, updated description)

---

## Testing Strategy

### Unit tests (Vitest)

Use `testFactories.tournament()` and `testFactories.game()` for fixture data in action tests, and `vi.mock()` for server action mocks in page tests, following project conventions.

1. **`app/actions/__tests__/hub-actions.test.ts`** — update `getTournamentHubPageData` describe block:
   - Add `locale` param to all existing calls
   - Add 7 new test cases covering the merged timing fields (listed in Mid-Level Design)
   - Fold existing `getPublicTournamentTiming` tests into the merged function block (same behaviors, same test cases)

2. **`app/[locale]/tournaments/[id]/__tests__/page-metadata.test.tsx`** — update mock structure:
   - Add timing fields to `DEFAULT_HUB_DATA`
   - Remove `getPublicTournamentTiming` mock
   - Update 4 timing-driven tests (Results widget, QT/Awards lock) to set fields via `mockGetTournamentHubPageData`
   - Add 1 new test: finished tournament skips action center

### Manual verification

After implementation:
1. Run `npm run test` — must pass all tests including new ones
2. Run `npm run build` — must compile without TypeScript errors
3. Run `npm run lint` — must produce no new lint errors
4. Verify hub page renders in browser for:
   - Active tournament + logged-in user (action center shows)
   - Finished tournament + logged-in user (action center hidden, standings/results/stats visible)
   - Unauthenticated user (banner shows, action center hidden)

---

## Verification Checklist

- [ ] `getTournamentHubPageData` returns all four timing fields
- [ ] `getPublicTournamentTiming` is deleted from `hub-actions.ts`
- [ ] `page.tsx` no longer imports or calls `getPublicTournamentTiming`
- [ ] `DashboardBanner` receives `hubData` as `timing` prop (structural subtyping — no component change needed)
- [ ] All existing page-metadata tests pass with updated mocks
- [ ] New test "does not call getActionCenterGames when tournament is finished" passes
- [ ] `CODE-STRUCTURE.md` call graph updated
- [ ] `docs/code-structure/actions.md` updated for merged function signature
- [ ] `npm run test` — green
- [ ] `npm run build` — green
- [ ] `npm run lint` — green
