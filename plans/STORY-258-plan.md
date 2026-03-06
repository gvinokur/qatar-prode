# Plan: [Social] Head-to-Head Comparison View (#258)

## Context

Users cannot easily compare their performance with specific friends. The solution is a head-to-head comparison modal that opens when clicking a leaderboard member. The comparison should show a **summary of the User Stats page** (same data, same quality) calculated for 2 users — not just the basic leaderboard score.

The original plan was wrong: it only used basic `UserScore` leaderboard data. The correct approach reuses the existing stats page infrastructure, extracting its calculation logic into shared utilities and a new multi-user server action.

## Acceptance Criteria

- Clicking any other member's card in the leaderboard opens a comparison modal
- Modal shows the same rich stats as the User Stats page, summarized side-by-side: total points, category breakdown, accuracy %, exact score %, by-phase accuracy
- "Your Lead" / "Their Lead" advantages sections
- Share button generates a WhatsApp text message with comparison stats + banter copy
- Modal is responsive (fullScreen on mobile, dialog on desktop)
- All text is internationalized (EN + ES)

## Worktree

`/Users/gvinokur/Personal/qatar-prode-story-258`
Branch: `feature/story-258`

## Technical Approach

### 1. Extract Shared Calculation Utilities (Refactor)

The stats page (`app/[locale]/tournaments/[id]/stats/page.tsx`) has calculation logic hardcoded as local helper functions. Extract these to a shared file so they can be reused for head-to-head.

**New file: `app/utils/stats-calculations.ts`**

Move/export these functions from the stats page:
- `calculatePercentage(numerator, denominator, decimalPlaces?)` — already exists in page, move out
- `calculateAccuracyStats(userGameStats, totalPredictionsMade, totalGamesAvailable, totalGamesPlayed)` — already exists, move out
- `calculateBoostStats(boostData, maxGames, boostType)` — already exists, move out (not used in H2H but part of the refactor)

Also move/export the type definitions:
- `PerformanceStats` — defined locally in stats page, export from `stats-calculations.ts`
- `AccuracyStats` — defined locally in stats page, export from `stats-calculations.ts`
- `BoostStats` — defined locally in stats page, export from `stats-calculations.ts`

**Update `app/[locale]/tournaments/[id]/stats/page.tsx`:** Import from `stats-calculations.ts` instead of local definitions. No functional change to the stats page.

### 2. New Server Action: getUserStatsForComparison

**New file: `app/actions/stats-actions.ts`**

```typescript
export interface UserComparisonStats {
  userId: string
  performance: PerformanceStats
  accuracy: AccuracyStats
}

export async function getUserStatsForComparison(
  userIds: [string, string],
  tournamentId: string
): Promise<UserComparisonStats[]>
```

**Implementation:**
1. `getGameGuessStatisticsForUsers(userIds, tournamentId)` — already multi-user
2. `findTournamentGuessByUserIdsTournament(userIds, tournamentId)` — already multi-user
3. `findGamesInTournament(tournamentId)` — fetched once, common to all users; provides `totalGamesPlayed` (games with results) — **this is the denominator for accuracy %**
4. For each userId: compute `PerformanceStats` and `AccuracyStats` using the extracted `stats-calculations.ts` utilities

Note: Boost stats are NOT included in head-to-head (too detailed; head-to-head is a "summary").

Note: `findGameGuessesByUserId` (used in stats page for `totalPredictionsMade`) is single-user only. For head-to-head, `totalPredictionsMade` can be omitted or approximated — the comparison focuses on accuracy % not completion rate.

### 3. HeadToHeadDialog Component

**New file: `app/components/leaderboard/HeadToHeadDialog.tsx`**

- Client component (`'use client'`)
- Accepts `open`, `onClose`, `currentUserId`, `opponentId`, `tournamentId`, `currentUserName`, `opponentName`, `groupName?`
- When `open` becomes true: calls `getUserStatsForComparison` via `useEffect` + `startTransition`, shows loading skeleton
- Once loaded, renders side-by-side comparison

**Dialog Layout:**
```
┌──────────────────────────────────────┐
│  Head to Head                   [X]  │
├──────────────────────────────────────┤
│       YOU              MARIA         │
│    [avatar]         [avatar]         │
│    Rank #2          Rank #3          │
│                                      │
│  ── TOTAL POINTS ──                  │
│  1,250 pts      vs    1,180 pts      │
│  [winner highlighted]                │
│                                      │
│  ── CATEGORY BREAKDOWN ──            │
│  Group Stage:   850  vs  800         │
│  Playoff Stage: 300  vs  300         │
│  Tournament:    100  vs   80         │
│                                      │
│  ── ACCURACY ──                      │
│  Overall:      68%  vs  64%          │
│  Exact Score:  21%  vs  18%          │
│  Group Stage:  62%  vs  59%          │
│  Playoff:      80%  vs  75%          │
│                                      │
│  YOUR LEAD:                          │
│   Total Points    +70 pts            │
│   Group Stage     +50 pts            │
│   Overall Acc.    +4%                │
│                                      │
│  THEIR LEAD: (none this time)        │
│                                      │
│  [Share on WhatsApp]   [Close]       │
└──────────────────────────────────────┘
```

**Category Totals (from PerformanceStats):**
- Group Stage = `groupGamePoints + groupBoostBonus + groupQualifiedTeamsPoints`
- Playoff Stage = `playoffGamePoints + playoffBoostBonus + honorRollPoints + individualAwardsPoints`
- Tournament Awards = `honorRollPoints + individualAwardsPoints` (subset of playoff stage total)

**Accuracy (from AccuracyStats, using `overallCorrectPercentage`, `overallExactPercentage`, `groupCorrectPercentage`, `playoffCorrectPercentage`).**

**Advantages (per metric):**
- Total Points, Group Stage, Playoff Stage, Overall Accuracy %, Exact Score %
- If `myValue > theirValue` → "Your Lead"
- If `theirValue > myValue` → "Their Lead"
- If equal or no advantages → "You're evenly matched!"

**WhatsApp Share:**
```
// If winning:  "I'm crushing it! In {groupName}: Me {pts}pts vs {name} {pts}pts. Accuracy: {my%} vs {their%}"
// If losing:   "Catching up... {name}: {pts}pts vs Me: {pts}pts. I'm coming for you!"
// If tied:     "It's tied! In {groupName}: both at {pts}pts!"
```
Via: `window.open('https://wa.me/?text=' + encodeURIComponent(message))`

### 4. Click Target: Differentiated Card Actions

Same as previously planned — no nested interactive elements:
- **Self card:** click = expand/collapse breakdown (existing behavior)
- **Other cards:** click = open HeadToHeadDialog

`LeaderboardCard` keeps existing `onToggle: () => void` prop. `LeaderboardCards` passes different closures per card:
```typescript
onToggle={isCurrentUser
  ? () => handleCardToggle(user.id)       // expand
  : () => setCompareUserId(user.id)       // compare
}
```

Visual affordance: "Tap to compare" caption on non-self cards (matches existing "Tap to view details").
`aria-label` updated to "Press Enter to compare with {name}" for non-self cards.

### 5. State & Data Flow

`LeaderboardCards` adds:
- `compareUserId: string | null` state
- `tournamentId: string` prop (new — needed for server action call)

When `compareUserId` is set → `HeadToHeadDialog` opens. The dialog internally calls `getUserStatsForComparison([currentUserId, compareUserId], tournamentId)` and shows a loading skeleton while fetching.

`tournamentId` threading: `LeaderboardView` already receives `tournament` prop → pass `tournament.id` as `tournamentId` to `LeaderboardCards`.

## Files to Create

| File | Purpose |
|------|---------|
| `app/utils/stats-calculations.ts` | Extracted calculation utilities (refactor from stats page) |
| `app/actions/stats-actions.ts` | New `getUserStatsForComparison` server action |
| `app/components/leaderboard/HeadToHeadDialog.tsx` | Comparison modal |
| `__tests__/utils/stats-calculations.test.ts` | Tests for calculation utilities |
| `__tests__/components/leaderboard/HeadToHeadDialog.test.tsx` | Tests for dialog |

## Files to Modify

| File | Change |
|------|--------|
| `app/[locale]/tournaments/[id]/stats/page.tsx` | Import from `stats-calculations.ts` instead of local functions; no functional change |
| `app/components/leaderboard/types.ts` | Add `tournamentId?: string` to `LeaderboardCardsProps`; add `tournamentId?: string` to `LeaderboardViewProps` |
| `app/components/leaderboard/LeaderboardCard.tsx` | Update aria-label and add "Tap to compare" caption for non-self cards |
| `app/components/leaderboard/LeaderboardCards.tsx` | Add `compareUserId` state, `tournamentId` prop, pass different closures to `onToggle`, render `<HeadToHeadDialog>` |
| `app/components/leaderboard/LeaderboardView.tsx` | Pass `tournament.id` as `tournamentId` to `LeaderboardCards` |
| `locales/en/groups.json` | Add `groups.headToHead.*` translations |
| `locales/es/groups.json` | Add Spanish translations |

Note: No changes needed to `friends-group-table.tsx`, `definitions.ts`, or `prode-group-actions.ts` — the rich stats are fetched fresh by the dialog via the new server action.

## Data Flow Summary

```
Leaderboard loads (existing):
  getUserScoresForTournament → UserScore[] → LeaderboardCards (basic points for ranking)

When user clicks another member's card:
  HeadToHeadDialog opens (with loading skeleton)
  → calls getUserStatsForComparison([currentUserId, opponentId], tournamentId)
      → getGameGuessStatisticsForUsers (multi-user, materialized)
      → findTournamentGuessByUserIdsTournament (multi-user)
      → findGamesInTournament (once, provides totalGamesPlayed for accuracy %)
      → calculateAccuracyStats() per user (from stats-calculations.ts)
      → returns UserComparisonStats[]
  → Dialog renders side-by-side comparison with accuracy %
```

## Implementation Steps

1. **Extract stats utilities** (`app/utils/stats-calculations.ts`)
   - Move `calculatePercentage`, `calculateAccuracyStats`, `calculateBoostStats` from stats page
   - Export `PerformanceStats`, `AccuracyStats`, `BoostStats` types

2. **Update stats page** (`stats/page.tsx`)
   - Import from `stats-calculations.ts`
   - No functional change

3. **Create server action** (`app/actions/stats-actions.ts`)
   - `getUserStatsForComparison(userIds, tournamentId)` using multi-user repo functions
   - Returns `UserComparisonStats[]` with `PerformanceStats` + `AccuracyStats` per user

4. **Update leaderboard types** (`types.ts`)
   - Add `tournamentId?: string` to `LeaderboardCardsProps` and `LeaderboardViewProps`

5. **Update LeaderboardView** (`LeaderboardView.tsx`)
   - Pass `tournament.id` as `tournamentId` to `LeaderboardCards`

6. **Update LeaderboardCards** (`LeaderboardCards.tsx`)
   - Add `compareUserId` state
   - Accept `tournamentId` prop
   - Pass differentiated `onToggle` per card
   - Render `<HeadToHeadDialog>`

7. **Update LeaderboardCard** (`LeaderboardCard.tsx`)
   - Update aria-label and caption based on `isCurrentUser`

8. **Create HeadToHeadDialog** (`HeadToHeadDialog.tsx`)
   - Loading skeleton while fetching
   - Side-by-side comparison with accuracy %
   - Advantages section
   - WhatsApp share

9. **Add translations** (EN + ES)
   - `groups.headToHead.*` keys

10. **Write tests**
    - `stats-calculations.test.ts`: unit tests for all calculation functions
    - `HeadToHeadDialog.test.tsx`: mock `getUserStatsForComparison`, test all states

## Testing Strategy

**`stats-calculations.test.ts`:**
- `calculatePercentage`: normal case, zero denominator, decimal places
- `calculateAccuracyStats`: with/without game stats, zero games played
- `calculateBoostStats`: with data, with locked boosts

**`HeadToHeadDialog.test.tsx`:**
- Loading skeleton shows while fetching
- After fetch: renders both user names, points, accuracy %
- Highlights winner (higher total points)
- Shows correct category breakdown
- "Your Lead" section correct
- "Their Lead" section correct
- "Evenly matched" when no advantages
- Share button generates correct WhatsApp URL (winning / losing / tied)
- Close button fires `onClose`
- Use `renderWithTheme()` from `@/__tests__/utils/test-utils`
- Mock `getUserStatsForComparison` with `vi.mock`

**`LeaderboardCard` updates:**
- "Tap to compare" caption visible for non-self cards
- Correct aria-label per card type

**Coverage target:** 80% on new code (SonarCloud enforced)

## Visual Prototype

### Leaderboard Card States
```
Non-self card (compare action):
┌──────────────────────────────────────────────┐
│  #3  [👤]  Maria                  1,180 pts  │
│             Tap to compare                    │
└──────────────────────────────────────────────┘

Self card (expand action, unchanged):
┌──────────────────────────────────────────────┐
│  #2  [👤]  You                    1,250 pts  │
│             Tap to view details               │
└──────────────────────────────────────────────┘
```

### Head-to-Head Dialog (Mobile fullScreen)
```
┌──────────────────────────┐
│ Head to Head         [X] │
├──────────────────────────┤
│  [You]      [Maria]      │
│  👤 #2       👤 #3       │
│                          │
│ ── TOTAL POINTS ──       │
│ 1,250 pts  1,180 pts     │
│ [you are winning]        │
│                          │
│ ── BREAKDOWN ──          │
│ Group      850    800    │
│ Playoff    300    300    │
│                          │
│ ── ACCURACY ──           │
│ Overall   68%    64%     │
│ Exact     21%    18%     │
│ Group     62%    59%     │
│ Playoff   80%    75%     │
│                          │
│ YOUR LEAD:               │
│  Points   +70 pts        │
│  Overall  +4%            │
│                          │
│ THEIR LEAD: (none)       │
│                          │
│ [Share on WhatsApp]      │
│ [Close]                  │
└──────────────────────────┘
```

## Validation Considerations

- 0 new SonarCloud issues
- 80% coverage on new files (`stats-calculations.ts`, `HeadToHeadDialog.tsx`, `stats-actions.ts`)
- Accessibility: dialog has `aria-labelledby`, loading state announced
- No TypeScript strict mode violations
- Translations in both EN and ES
- Stats page continues to work identically after refactor (no functional change)
