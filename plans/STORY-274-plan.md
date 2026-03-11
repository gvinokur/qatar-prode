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

#### Updated `UserBadgeInput` — add `rankHistory?`
```typescript
export interface UserBadgeInput {
  userId: string
  rank: number
  rankChange: number
  totalExactGuesses: number
  totalCorrectGuesses: number
  qualifiedTeamsCorrect: number
  honorRollScore: number
  individualAwardsScore: number
  boostsUsed: number
  scoredBoosts: number
  /** Chronological rank history (oldest index 0, newest last). Optional — when absent, time badges suppress. */
  rankHistory?: number[]
}
```
Adding `rankHistory` directly to `UserBadgeInput` eliminates the need for a separate `TimeBadgeInputs` map + `deriveTimeBadgeInputs` utility. Badge apply functions access `u.rankHistory` directly — simpler and co-located with the user data they belong to. The existing `calculateBadges` signature is **unchanged** (no 3rd param).

#### `BadgeApplyFn` and `calculateBadges` — unchanged
`BadgeApplyFn` and `calculateBadges` signatures are **not changed**. Time badge `apply` functions access `u.rankHistory` via the existing `users: UserBadgeInput[]` first param. No 3rd param needed.

#### 5 new badge definitions

**`on-fire` (🔥, positive)**
```typescript
apply: (users) => users.filter(u => {
  const r = u.rankHistory
  if (!r || r.length < 3) return false
  const n = r.length
  return r[n - 3] > r[n - 2] && r[n - 2] > r[n - 1]  // strictly decreasing rank# = improving
}).map(u => u.userId)
```

**`ice-cold` (🧊, negative)** — direct inverse of on-fire
```typescript
apply: (users) => users.filter(u => {
  const r = u.rankHistory
  if (!r || r.length < 3) return false
  const n = r.length
  return r[n - 3] < r[n - 2] && r[n - 2] < r[n - 1]  // strictly increasing rank# = worsening
}).map(u => u.userId)
```

**`trending-up` (📈, positive)**
```typescript
apply: (users) => users.filter(u => {
  const r = u.rankHistory
  if (!r || r.length < 5) return false
  return r[r.length - 5] > r[r.length - 1]  // rank# improved vs 5 snapshots ago
}).map(u => u.userId)
```

**`trending-down` (📉, negative)**
```typescript
apply: (users) => users.filter(u => {
  const r = u.rankHistory
  if (!r || r.length < 5) return false
  return r[r.length - 5] < r[r.length - 1]  // rank# worsened vs 5 snapshots ago
}).map(u => u.userId)
```

**`comeback-kid` (🎢, positive)**
```typescript
apply: (users) => {
  if (users.length <= 3) return []
  const groupSize = users.length
  return users.filter(u => {
    const r = u.rankHistory
    if (!r || r.length < 2) return false
    if (r[r.length - 1] > 3) return false          // must be top 3 now
    return r.slice(0, -1).some(rank => rank === groupSize)  // was ever last place in past
  }).map(u => u.userId)
}
```

Notes:
- `rank` values are always positive integers (`computeRanksForDate` uses integer increments), so `=== groupSize` is safe.
- `tournamentStarted` gate: the existing `if (config.tournamentStarted)` block in `calculateBadges` wraps ALL badge apply calls. When `false`, nothing is awarded — time badges included. No extra guard needed in definitions.
- `rankHistory` absent = `undefined` → guards `if (!r || r.length < N)` handle silently (no crash).

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

### 4. `LeaderboardCards.tsx` — build rankHistory inline
```typescript
// Build userId → rankHistory map from historyData (inside badgeMap useMemo)
const rankHistoryMap = new Map<string, number[]>()
if (historyData && !historyData.isEmpty) {
  for (const uh of historyData.userHistories) {
    rankHistoryMap.set(uh.userId, uh.data.map((d: any) => d.rank))
  }
}

// Add rankHistory to each UserBadgeInput (inside existing inputs construction):
const inputs: UserBadgeInput[] = leaderboardUsers.map((u) => {
  const s = scoreMap.get(u.id) ?? {}
  return {
    userId: u.id,
    // ... existing fields ...
    rankHistory: rankHistoryMap.get(u.id),  // undefined if no history
  }
})

return calculateBadges(inputs, tournamentBadgeConfig)  // signature unchanged
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

- **`UserBadgeInput`** *(extended with `rankHistory?: number[]`)*: Optional chronological rank array (oldest index 0, newest last). When absent, all 5 time badges suppress per their `!r || r.length < N` guard. No other change to the type.

**Changed exports:**

- **`calculateBadges(users: UserBadgeInput[], config: TournamentBadgeConfig)`**: `Map<string, Badge[]>` *(signature unchanged)*
  When `rankHistory` is absent from a user's input, all 5 time badge definitions silently return no recipients for that user. Static badges unaffected.
  Tests:
  - (all existing tests pass unchanged — no signature change)
  - time badges produce no recipients when all users have `rankHistory: undefined`
  - time badges produce no recipients when `tournamentStarted: false`
  - user with `rankHistory` absent in input receives no time badges (no crash)
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

- **`LeaderboardCards(props: LeaderboardCardsProps)`** *(adds historyData? prop; builds rankHistory map inline)*
  Builds `rankHistoryMap: Map<string, number[]>` from `historyData.userHistories` (when present) and sets `rankHistory` on each `UserBadgeInput` before calling `calculateBadges`. Signature of `calculateBadges` call is unchanged.
  Calls: calculateRanks, calculateRanksWithChange, calculateBadges
  Tests: (integration — existing LeaderboardCard.badge tests cover rendering; logic covered by badge-calculator unit tests)

## Testing Strategy

### New test file: `app/utils/__tests__/badge-calculator.time-badges.test.ts`
Tests for:
1. `on-fire` badge (4 tests)
2. `ice-cold` badge (4 tests)
3. `trending-up` badge (4 tests)
4. `trending-down` badge (4 tests)
5. `comeback-kid` badge (6 tests)
6. `calculateBadges` with no `rankHistory` (2 tests — static badges unaffected)
7. Emoji updates: `rocket` is 🚀, `free-fall` is 🪂 (2 tests — can add to existing test file)

**Test helper pattern** (extends existing `makeUser` from `badge-calculator.test.ts`):
```typescript
// makeUser already accepts Partial<UserBadgeInput> overrides — just add rankHistory:
makeUser({ userId: 'u1', rank: 2, rankHistory: [5, 4, 3, 2] })
```

### Existing tests remain unchanged
- All 12 existing badge tests pass with new optional 3rd param (ignored).
- `BadgeRow.test.tsx` and `LeaderboardCard.badge.test.tsx` pass without changes.

## Implementation Tasks (for execution phase)

1. **badge-calculator.ts** — Add `rankHistory?` to `UserBadgeInput`, 5 badge defs, emoji updates (no signature change to `calculateBadges`)
   CODE-STRUCTURE: `utils.md` (badge-calculator entry)
   Call graph: NO (calculateBadges call site in LeaderboardCards unchanged)

2. **types.ts + LeaderboardView.tsx** — Add historyData prop thread
   CODE-STRUCTURE: `components-leaderboard-stats.md`
   Call graph: NO

3. **LeaderboardCards.tsx** — Build rankHistory map inline, add to UserBadgeInput per user
   CODE-STRUCTURE: `components-leaderboard-stats.md`
   Call graph: NO

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
