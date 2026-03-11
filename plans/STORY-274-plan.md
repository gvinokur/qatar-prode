# Plan: [Social] Time-Dimension Badges #274

## Context

Story B (#273) added a snapshot-based badge engine. This story adds 5 time-aware badges (On Fire, Trending Up, Comeback Kid, Ice Cold, Trending Down) that tell narratives over time using the rank-per-snapshot history data already fetched from Story A (#272). It also updates the emoji for two existing Story B badges (Rocket: 📈→🚀, Free Fall: 📉→🪂).

The history data (`historyByTournament`) is already fetched server-side in both friend-group pages. It currently flows only to `HistoryTab` for charts. This story threads it one level deeper: also passing it to `ProdeGroupTable` → `LeaderboardView` → `LeaderboardCards`, where a new utility function derives per-user rank arrays that the badge engine uses.

No new DB queries or server actions are required.

## Story worktree setup

```bash
./scripts/github-projects-helper story start 274 --project 1
# WORKTREE_PATH=/Users/gvinokur/Personal/qatar-prode-story-274
# BRANCH=feature/story-274
```

## Files to change

| File | Change |
|------|--------|
| `app/utils/badge-calculator.ts` | Add 5 badge IDs, `TimeBadgeInputs` interface, `deriveTimeBadgeInputs()`, 5 badge defs, emoji updates, extend `calculateBadges` signature |
| `app/components/leaderboard/types.ts` | Add `historyData?: ScoreHistoryResult` to `LeaderboardViewProps` + `LeaderboardCardsProps` |
| `app/components/leaderboard/LeaderboardView.tsx` | Pass `historyData` through to `LeaderboardCards` |
| `app/components/leaderboard/LeaderboardCards.tsx` | Derive `timeBadgeInputs` via `deriveTimeBadgeInputs`; pass to `calculateBadges` |
| `app/components/friend-groups/friends-group-table.tsx` | Add `historyByTournament?: Record<string, ScoreHistoryResult>` prop; pass to `LeaderboardView` |
| `app/[locale]/friend-groups/[id]/page.tsx` | Pass `historyByTournament` to `ProdeGroupTable` |
| `app/[locale]/tournaments/[id]/friend-groups/[group_id]/page.tsx` | Build `historyByTournament = { [tournament.id]: historyData }` and pass to `ProdeGroupTable` |
| `locales/en/groups.json` | Add 5 new badge keys; update emoji in rocket/free-fall descriptions |
| `locales/es/groups.json` | Same as EN in Spanish |
| `docs/code-structure/utils.md` | Update badge-calculator.ts entry: add new exports |
| `docs/code-structure/components/components-leaderboard-stats.md` | Update LeaderboardCards, LeaderboardView, types.ts entries |

## Technical Design

### 1. `badge-calculator.ts` changes

#### New `BadgeId` values
```typescript
| 'on-fire' | 'trending-up' | 'comeback-kid' | 'ice-cold' | 'trending-down'
```

#### Updated emoji constants
```typescript
rocket:    emoji: '🚀'   // was 📈
'free-fall': emoji: '🪂'   // was 📉
```

#### New `TimeBadgeInputs` interface
```typescript
export interface TimeBadgeInputs {
  /** userId → rank array, chronological (oldest index 0, newest last) */
  ranksByUser: Map<string, number[]>
}
```
Note: `groupSize` is NOT in `TimeBadgeInputs`. Comeback Kid uses `users.length` (already available via the `users: UserBadgeInput[]` first param) for the group-size guard and last-place check. This avoids the `userHistories.length` vs actual membership discrepancy.

#### New `deriveTimeBadgeInputs` function
```typescript
// Accepts UserScoreHistory[] from score-history-actions directly (structural supertype)
export function deriveTimeBadgeInputs(
  userHistories: { userId: string; data: { rank: number }[] }[]
): TimeBadgeInputs {
  const ranksByUser = new Map<string, number[]>()
  for (const h of userHistories) {
    ranksByUser.set(h.userId, h.data.map((d) => d.rank))
  }
  return { ranksByUser }
}
```
The duck-typed input `{ userId, data: { rank }[] }[]` is a structural subset of `UserScoreHistory`, so callers pass `historyData.userHistories` directly without casting. No import of `score-history-actions` in `badge-calculator.ts`.

#### Extended `BadgeApplyFn` type
```typescript
type BadgeApplyFn = (
  users: UserBadgeInput[],
  config: TournamentBadgeConfig,
  timeBadgeInputs?: TimeBadgeInputs
) => string[]
```
Existing 12 badge `apply` functions are compatible (they already ignore extra args in JS/TS).

#### Updated `calculateBadges` signature
```typescript
export function calculateBadges(
  users: UserBadgeInput[],
  config: TournamentBadgeConfig,
  timeBadgeInputs?: TimeBadgeInputs
): Map<string, Badge[]>
```
Pass `timeBadgeInputs` to each `def.apply(users, config, timeBadgeInputs)` call inside the loop.

#### 5 new badge definitions

**`on-fire` (🔥, positive)**
The last 3 ranks (tail) form a strictly decreasing sequence (lower rank number = better position).
Implementation uses concrete index arithmetic to avoid off-by-one bugs:
```typescript
apply: (users, _config, timeBadgeInputs) => {
  if (!timeBadgeInputs) return []
  return users.filter(u => {
    const ranks = timeBadgeInputs.ranksByUser.get(u.userId)
    if (!ranks || ranks.length < 3) return false
    const len = ranks.length
    // ranks[len-3] is 3rd-from-last, ranks[len-1] is most recent
    return ranks[len - 3] > ranks[len - 2] && ranks[len - 2] > ranks[len - 1]
  }).map(u => u.userId)
}
```

**`ice-cold` (🧊, negative)**
The last 3 ranks (tail) form a strictly increasing sequence (higher rank number = worsening position — direct inverse of on-fire).
```typescript
apply: (users, _config, timeBadgeInputs) => {
  if (!timeBadgeInputs) return []
  return users.filter(u => {
    const ranks = timeBadgeInputs.ranksByUser.get(u.userId)
    if (!ranks || ranks.length < 3) return false
    const len = ranks.length
    // ranks[len-3] < ranks[len-2] < ranks[len-1]: each snapshot rank number is larger = worse
    return ranks[len - 3] < ranks[len - 2] && ranks[len - 2] < ranks[len - 1]
  }).map(u => u.userId)
}
```

**`trending-up` (📈, positive)**
Net rank improved (lower rank number) from 5 snapshots ago vs current.
```typescript
apply: (users, _config, timeBadgeInputs) => {
  if (!timeBadgeInputs) return []
  return users.filter(u => {
    const ranks = timeBadgeInputs.ranksByUser.get(u.userId)
    if (!ranks || ranks.length < 5) return false
    const len = ranks.length
    return ranks[len - 5] > ranks[len - 1]  // baseline rank > current rank = improved
  }).map(u => u.userId)
}
```

**`trending-down` (📉, negative)**
Net rank declined (higher rank number) from 5 snapshots ago vs current.
```typescript
apply: (users, _config, timeBadgeInputs) => {
  if (!timeBadgeInputs) return []
  return users.filter(u => {
    const ranks = timeBadgeInputs.ranksByUser.get(u.userId)
    if (!ranks || ranks.length < 5) return false
    const len = ranks.length
    return ranks[len - 5] < ranks[len - 1]  // baseline rank < current rank = declined
  }).map(u => u.userId)
}
```

**`comeback-kid` (🎢, positive)**
Uses `users.length` (current group size from `UserBadgeInput[]`) for both the suppression guard and the "last place" check. This is consistent with how static badges like `dead-last` work and avoids `userHistories.length` discrepancies.
- Suppress when `users.length <= 3`
- Need ≥ 2 snapshots
- At any PAST snapshot (all except most recent): `rank === users.length`
- Currently top 3: `ranks[len - 1] <= 3`
```typescript
apply: (users, _config, timeBadgeInputs) => {
  if (!timeBadgeInputs) return []
  if (users.length <= 3) return []
  const groupSize = users.length
  return users.filter(u => {
    const ranks = timeBadgeInputs.ranksByUser.get(u.userId)
    if (!ranks || ranks.length < 2) return false
    const len = ranks.length
    if (ranks[len - 1] > 3) return false          // must be top 3 now
    const pastRanks = ranks.slice(0, len - 1)     // all but most recent
    return pastRanks.some(r => r === groupSize)   // was ever last place
  }).map(u => u.userId)
}
```
Note: `rank` values in `ScoreHistoryDataPoint` are always positive integers (set by `computeRanksForDate` which uses integer `currentRank` increments with no fractional values). `===` equality is safe.

Note on `tournamentStarted` gate: the existing `if (config.tournamentStarted)` block in `calculateBadges` wraps ALL badge processing including the time badge `apply` calls. When `tournamentStarted: false`, the badgesByUser map is returned empty — no badge (static or time) is awarded. No additional guard needed in time badge definitions.

Note on field names: `ScoreHistoryResult.userHistories` is `UserScoreHistory[]` where each entry has `userId: string` and `data: ScoreHistoryDataPoint[]` with `data[i].rank: number`. This matches the duck type `{ userId: string; data: { rank: number }[] }[]` exactly. `deriveTimeBadgeInputs(historyData.userHistories)` compiles without cast.

### 2. `types.ts` — new `historyData` prop
```typescript
import type { ScoreHistoryResult } from '../../actions/score-history-actions'

// Add to LeaderboardViewProps and LeaderboardCardsProps:
readonly historyData?: ScoreHistoryResult
```

### 3. `LeaderboardView.tsx` — pass-through
```typescript
// Accept historyData, pass to LeaderboardCards
<LeaderboardCards ... historyData={historyData} />
```

### 4. `LeaderboardCards.tsx` — derive and inject
```typescript
import { deriveTimeBadgeInputs } from '../../utils/badge-calculator'

// Inside badgeMap useMemo, after checking tournamentBadgeConfig:
const timeBadgeInputs =
  historyData && !historyData.isEmpty
    ? deriveTimeBadgeInputs(historyData.userHistories)
    : undefined

return calculateBadges(inputs, tournamentBadgeConfig, timeBadgeInputs)
```

### 5. `friends-group-table.tsx` — thread history prop
```typescript
// Add to Props:
readonly historyByTournament?: Record<string, ScoreHistoryResult>

// Pass to LeaderboardView for each tournament:
historyData={historyByTournament?.[tournament.id]}
```

### 6. Page 1 `friend-groups/[id]/page.tsx`
```typescript
// historyByTournament already built on line 102-109; add to ProdeGroupTable:
historyByTournament={historyByTournament}
```

### 7. Page 2 `tournaments/[id]/friend-groups/[group_id]/page.tsx`
```typescript
// historyData already fetched on line 140; build single-tournament map:
const historyByTournament = { [tournament.id]: historyData }
// Pass to ProdeGroupTable:
historyByTournament={historyByTournament}
```

### 8. i18n keys

**EN additions** (`locales/en/groups.json` under `"badges"`):
```json
"on-fire":       { "name": "On Fire",       "description": "Rank improved 3 or more consecutive snapshots" },
"trending-up":   { "name": "Trending Up",   "description": "Net rank improvement over the last 5 snapshots" },
"comeback-kid":  { "name": "Comeback Kid",  "description": "Was in last place, now in the top 3" },
"ice-cold":      { "name": "Ice Cold",      "description": "Rank dropped 3 or more consecutive snapshots" },
"trending-down": { "name": "Trending Down", "description": "Net rank decline over the last 5 snapshots" }
```

**ES additions** (`locales/es/groups.json`):
```json
"on-fire":       { "name": "En llamas",     "description": "El rango mejoró 3 o más snapshots consecutivos" },
"trending-up":   { "name": "En ascenso",    "description": "Mejora neta del rango en los últimos 5 snapshots" },
"comeback-kid":  { "name": "La remontada",  "description": "Estuvo en el último lugar, ahora está en el top 3" },
"ice-cold":      { "name": "Helado",        "description": "El rango cayó 3 o más snapshots consecutivos" },
"trending-down": { "name": "En descenso",   "description": "Caída neta del rango en los últimos 5 snapshots" }
```

## Mid-Level Design

### Call Graph Changes

**Modified flows (no new flows):**
- **Standings flow** — `LeaderboardCards` now calls `deriveTimeBadgeInputs` (new) in addition to `calculateBadges`; `calculateBadges` now accepts optional `TimeBadgeInputs`
- **Prop threading** — history data propagates: page → `ProdeGroupTable` (historyByTournament) → `LeaderboardView` (historyData) → `LeaderboardCards` (historyData)

### `app/utils/badge-calculator.ts` *(modified)*

**New exports:**

- **`TimeBadgeInputs`**: `{ ranksByUser: Map<string, number[]> }` — Input type for time-dimension badge computation. `ranksByUser` maps userId to chronological rank array (oldest=index 0). No `groupSize` field — Comeback Kid uses `users.length` from its first param instead (consistent with how static badges access group size).

- **`deriveTimeBadgeInputs(userHistories: { userId: string; data: { rank: number }[] }[])`**: `TimeBadgeInputs` — Pure derivation function. Maps each user's `data[i].rank` into `ranksByUser`. Duck-typed input is a structural subset of `UserScoreHistory[]` from score-history-actions; no import needed.
  Calls: none
  Tests:
  - returns empty ranksByUser map when userHistories is empty
  - ranksByUser has one entry per user
  - rank array preserves chronological order from input data
  - non-rank fields in data entries are correctly ignored (only rank is mapped)

**Changed exports:**

- **`calculateBadges(users: UserBadgeInput[], config: TournamentBadgeConfig, timeBadgeInputs?: TimeBadgeInputs)`**: `Map<string, Badge[]>` *(added optional 3rd param)*
  When `timeBadgeInputs` is absent: 5 new time badges produce no recipients, static badges unaffected.
  Tests:
  - (all existing tests pass unchanged)
  - time badges produce no recipients when timeBadgeInputs is undefined
  - time badges produce no recipients when tournamentStarted is false
  - user with 5 snapshots but absent from timeBadgeInputs.ranksByUser receives no time badges (no crash)
  - rocket badge emoji is 🚀 (verified via BADGES lookup)
  - free-fall badge emoji is 🪂 (verified via BADGES lookup)

**New badge definitions (in BADGE_DEFINITIONS):**

- **`on-fire` (🔥, positive)**
  Awards users whose last 3 rank values form a strictly decreasing sequence (ranks[n-3] > ranks[n-2] > ranks[n-1]).
  Tests:
  - suppressed when fewer than 3 snapshots exist for user
  - awarded when last 3 ranks are strictly decreasing (e.g. [5, 4, 3, 2] tail)
  - not awarded when last rank is same as second-to-last (strict required)
  - not awarded when ice-cold conditions are met (mutually exclusive by construction)

- **`ice-cold` (🧊, negative)**
  Awards users whose last 3 rank values form a strictly increasing sequence (worsening).
  Tests:
  - suppressed when fewer than 3 snapshots
  - awarded when last 3 ranks are strictly increasing (e.g. [1, 2, 3])
  - not awarded when rank unchanged between any consecutive pair
  - does not award user who simultaneously qualifies for on-fire (impossible by construction)

- **`trending-up` (📈, positive)**
  Awards users whose rank 5 snapshots ago is strictly greater than current rank (net improvement).
  Tests:
  - suppressed when fewer than 5 snapshots
  - awarded when rank improved from 5 snapshots ago
  - not awarded when rank unchanged from 5 snapshots ago (flat trend)
  - not awarded when rank declined from 5 snapshots ago

- **`trending-down` (📉, negative)**
  Awards users whose rank 5 snapshots ago is strictly less than current rank (net decline).
  Tests:
  - suppressed when fewer than 5 snapshots
  - awarded when rank declined from 5 snapshots ago
  - not awarded when rank unchanged from 5 snapshots ago
  - not awarded when rank improved from 5 snapshots ago

- **`comeback-kid` (🎢, positive)**
  Awards users who (a) have ≥2 snapshots, (b) are currently top 3 (rank ≤ 3), and (c) had rank === `users.length` (current group size) at any past snapshot (all except most recent). Suppressed when `users.length ≤ 3`.
  Tests:
  - suppressed when users array has 3 or fewer members (users.length ≤ 3)
  - suppressed when fewer than 2 snapshots exist for the user
  - awarded when user had rank === users.length at any past snapshot and is now in top 3
  - not awarded when user is currently outside top 3 (rank > 3)
  - not awarded when user never had rank equal to users.length in past snapshots
  - can be held simultaneously with on-fire (independent conditions)

### `app/components/leaderboard/types.ts` *(modified)*

**Changed types:**

- **`LeaderboardViewProps`** *(added `historyData?`)*: adds `readonly historyData?: ScoreHistoryResult` — Passes history data for time badge derivation. Optional; when absent, time badges suppress.

- **`LeaderboardCardsProps`** *(added `historyData?`)*: adds `readonly historyData?: ScoreHistoryResult` — Same.

Tests: No unit tests needed for type-only changes.

### `app/components/leaderboard/LeaderboardCards.tsx` *(modified)*

**Changed function:**

- **`LeaderboardCards(props: LeaderboardCardsProps)`** *(adds historyData? prop and timeBadgeInputs derivation)*
  `timeBadgeInputs` derived via `deriveTimeBadgeInputs(historyData.userHistories)` when `historyData && !historyData.isEmpty`. Passed as 3rd arg to `calculateBadges`.
  Calls: calculateRanks, calculateRanksWithChange, calculateBadges, deriveTimeBadgeInputs *(new)*
  Tests: (integration — existing LeaderboardCard.badge tests cover rendering; no new component test needed for this change; logic covered by badge-calculator tests)

## Testing Strategy

### New test file: `app/utils/__tests__/badge-calculator.time-badges.test.ts`
Tests for:
1. `deriveTimeBadgeInputs` (4 tests above)
2. `on-fire` badge (4 tests)
3. `ice-cold` badge (4 tests)
4. `trending-up` badge (4 tests)
5. `trending-down` badge (4 tests)
6. `comeback-kid` badge (6 tests)
7. `calculateBadges` with no `timeBadgeInputs` (2 tests — static badges unaffected)
8. Emoji updates: `rocket` is 🚀, `free-fall` is 🪂 (2 tests in existing test file)

**Test helper pattern** (same as existing `badge-calculator.test.ts`):
```typescript
function makeTimeBadgeInputs(
  entries: { userId: string; ranks: number[] }[],
  groupSize?: number
): TimeBadgeInputs {
  return {
    ranksByUser: new Map(entries.map(e => [e.userId, e.ranks])),
    groupSize: groupSize ?? entries.length,
  }
}
```

### Existing tests remain unchanged
- All 12 existing badge tests pass with new optional 3rd param (ignored).
- `BadgeRow.test.tsx` and `LeaderboardCard.badge.test.tsx` pass without changes.

## Implementation Tasks (for execution phase)

1. **badge-calculator.ts** — Add types, `deriveTimeBadgeInputs`, 5 badge defs, emoji updates, extend signature
   CODE-STRUCTURE: `utils.md` (badge-calculator entry)
   Call graph: YES (new call in LeaderboardCards)

2. **types.ts + LeaderboardView.tsx** — Add historyData prop thread
   CODE-STRUCTURE: `components-leaderboard-stats.md`
   Call graph: NO

3. **LeaderboardCards.tsx** — Derive timeBadgeInputs, pass to calculateBadges
   CODE-STRUCTURE: `components-leaderboard-stats.md`
   Call graph: YES

4. **friends-group-table.tsx + page.tsx (×2)** — Thread historyByTournament
   CODE-STRUCTURE: NO (no new exported function)
   Call graph: NO

5. **i18n files** — 5 new badge keys (EN + ES)
   CODE-STRUCTURE: NO
   Call graph: NO

6. **Tests** — New test file for time badges
   CODE-STRUCTURE: NO
   Call graph: NO

## Validation

- `npm test` — All existing tests pass, new time badge tests pass
- `npm run lint` — No lint errors
- `npm run build` — Clean build
- Manual smoke: Visit friend group with history data → confirm 🔥, 🧊, 📈, 📉, 🎢 appear on eligible users in leaderboard
- i18n: Badge tooltips show localized names in EN and ES
- Emoji regression: Rocket shows 🚀 (not 📈), Free Fall shows 🪂 (not 📉)
- Edge: Verify no time badges appear when historyData is absent (empty group/new tournament)
- Edge: Verify static badges (crack, rocket, etc.) unaffected when timeBadgeInputs is absent

## Dependencies
- Blocked by Story A (#272) — score history data must exist
- Blocked by Story B (#273) — badge engine infrastructure must exist
- Both are already merged (worktree base includes them)
