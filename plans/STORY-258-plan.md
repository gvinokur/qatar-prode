# Plan: [Social] Head-to-Head Comparison View (#258)

## Context

Users cannot easily compare their performance with specific friends in their group. This limits friendly competition opportunities. The solution is a head-to-head comparison modal that opens when clicking any member's name in the leaderboard.

## Acceptance Criteria

- Clicking any member name in the leaderboard opens a comparison modal
- Modal shows side-by-side: total points (you vs them), accuracy %, category breakdown (Group Stage, Knockout, Tournament Awards), highlighted advantages for each person
- Share button generates a WhatsApp text message with comparison stats and banter copy
- Modal is accessible on mobile (fullScreen) and desktop (dialog)
- All text is internationalized (EN + ES)

## Worktree

`/Users/gvinokur/Personal/qatar-prode-story-258`
Branch: `feature/story-258`

## Technical Approach

### 1. Correct Guesses Data Surfacing (replacing "accuracy %")

The primary `getGameGuessStatisticsForUsers` reads from materialized columns in `tournament_guesses` and returns `total_correct_guesses` and `total_exact_guesses` (from `types/definitions.ts: GameStatisticForUser`). There is **no `total_games` denominator** in the primary data path — confirmed by reading `types/definitions.ts`.

**Decision:** Instead of an accuracy percentage (which requires a denominator not in scope), display raw guess counts:
- **"Correct Outcome: X"** — games where the user guessed home win / draw / away win correctly (`total_correct_guesses`)
- **"Exact Score: X"** — games where the user guessed the exact scoreline (`total_exact_guesses`)

These two metrics are actually more informative than a % and compare directly since all users play the same games.

**Changes to `app/definitions.ts`:** Add optional fields:
```typescript
interface UserScore {
  // existing fields...
  correctGuesses?: number   // from gameStats.total_correct_guesses
  exactGuesses?: number     // from gameStats.total_exact_guesses
}
```

**Changes to `app/actions/prode-group-actions.ts`:** Include in `getUserScoresForTournament` return:
```typescript
correctGuesses: gameStats?.total_correct_guesses || 0,
exactGuesses: gameStats?.total_exact_guesses || 0,
```

### 2. Click Target: Differentiated Card Actions (No Nesting Issue)

The current `LeaderboardCard` uses `role="button"` on the outer Card element. Nesting another interactive element inside (e.g., a clickable name area) would be invalid HTML and break accessibility.

**Solution: Differentiate behavior by card type, single action per card:**
- **Current user's card:** Full card click = expand/collapse detail view (existing behavior preserved)
- **Other users' cards:** Full card click = open head-to-head comparison modal

This avoids nested interactive elements entirely. Each card has exactly one interactive role.

**Visual affordance:** Add "Tap to compare" caption on non-self cards (similar to existing "Tap to view details" on self cards). Update `aria-label` to read "Press Enter to compare with {name}" for non-self cards.

**Changes:** `LeaderboardCard` keeps the existing `onToggle: () => void` prop — no interface change. `LeaderboardCards` passes different closures based on `isCurrentUser`. `aria-label` is already computed with `isCurrentUser` available, so a conditional string is sufficient.

### 3. New Component: HeadToHeadDialog

**File:** `app/components/leaderboard/HeadToHeadDialog.tsx`

Props:
```typescript
interface HeadToHeadDialogProps {
  open: boolean
  onClose: () => void
  currentUser: LeaderboardUser   // the logged-in user's data
  opponent: LeaderboardUser      // the clicked user's data
  currentUserRank: number
  opponentRank: number
}
```

Layout (uses MUI Dialog, fullScreen on mobile):
```
┌─────────────────────────────────────────┐
│  HEAD TO HEAD                      [X]  │
├─────────────────────────────────────────┤
│                                         │
│       YOU              MARIA            │
│   [avatar]          [avatar]            │
│   Rank #2           Rank #3             │
│                                         │
│  TOTAL POINTS                           │
│   1,250 pts    vs    1,180 pts          │
│  [you are winning - highlighted]        │
│                                         │
│  ─── CATEGORY BREAKDOWN ───             │
│  Group Stage:  850  vs  800             │
│  Knockout:     300  vs  300             │
│  Tournament:   100  vs   80             │
│                                         │
│  CORRECT GUESSES (outcome)              │
│    25          vs      22               │
│  EXACT SCORES                           │
│    8           vs      6                │
│                                         │
│  YOUR LEAD:                             │
│    Total Points  +70 pts                │
│    Group Stage   +50 pts                │
│    Correct Guesses  +3                  │
│                                         │
│  THEIR LEAD:                            │
│    (none this time)                     │
│                                         │
│  [Share on WhatsApp]  [Close]           │
└─────────────────────────────────────────┘
```

**Category Breakdown — Exact Field Mapping:**
- **Group Stage** = `groupStageScore + groupBoostBonus + groupStageQualifiersScore + (groupPositionScore ?? 0)`
- **Knockout** = `playoffScore + playoffBoostBonus`
- **Tournament Awards** = `honorRollScore + individualAwardsScore`
- **Correct Guesses** = `correctGuesses` (outcome: home/draw/away correct)
- **Exact Scores** = `exactGuesses` (correct scoreline)

**Advantages calculation (per metric):**
- Metrics checked: Total Points, Group Stage, Knockout, Tournament Awards, Correct Guesses, Exact Scores
- If `myValue > theirValue` → "your lead" section
- If `theirValue > myValue` → "their lead" section
- If equal → omit from advantages
- If no advantages for either side → show "You're evenly matched!" message

**WhatsApp Share (text-based, same pattern as invite dialog):**

Generate dynamic banter message based on who's winning:
- If currentUser is winning: "I'm crushing it! In [GroupName] - Me: {pts} pts vs {opponentName}: {pts} pts. Correct guesses: {mine} vs {theirs}. Catch me if you can!"
- If opponent is winning: "Catching up... In [GroupName] - {opponentName}: {pts} pts vs Me: {pts} pts. I'm coming for you!"
- If tied: "It's all tied up! In [GroupName] - We're both at {pts} pts!"

Display name logic: current user shows as their actual name (not "You") in the share message.
Share via: `window.open('https://wa.me/?text=' + encodeURIComponent(message))`

Note: No image generation is needed. The story says "share functionality enhanced by related story" — text sharing delivers core value immediately.

### 4. State Management in LeaderboardCards

Add state for which user to compare:
```typescript
const [compareUserId, setCompareUserId] = useState<string | null>(null)
```

Compute `compareUser` and `compareUserRank` from `leaderboardUsers` when `compareUserId` is set.
Pass `onToggle` with different closures per card (self = expand, other = `setCompareUserId(user.id)`).
Render `<HeadToHeadDialog>` at the bottom of the component.

### 5. Data Flow for Dialog

The `LeaderboardCards` already has all user data (`leaderboardUsers`). The `currentUserId` prop identifies the logged-in user. When comparison dialog opens, find both users in `leaderboardUsers` array. No additional server calls needed.

The `groupName` is threaded as a prop from `friends-group-table.tsx` (where `prodeGroup.name` is available via its parent pages) through `LeaderboardView` → `LeaderboardCards` → `HeadToHeadDialog` for use in the share message.

## Files to Create

| File | Purpose |
|------|---------|
| `app/components/leaderboard/HeadToHeadDialog.tsx` | New comparison modal |
| `__tests__/components/leaderboard/HeadToHeadDialog.test.tsx` | Tests for dialog |

## Files to Modify

| File | Change |
|------|--------|
| `app/definitions.ts` | Add `correctGuesses?`, `exactGuesses?` to `UserScore` |
| `app/actions/prode-group-actions.ts` | Include `correctGuesses` and `exactGuesses` in `getUserScoresForTournament` return |
| `app/components/leaderboard/types.ts` | Add `correctGuesses?`, `exactGuesses?` to `LeaderboardUser`; add `groupName?: string` to `LeaderboardCardsProps` and `LeaderboardViewProps` |
| `app/components/leaderboard/LeaderboardCard.tsx` | When `onCompare` provided: card click/keyboard = compare (not expand); add compare affordance hint |
| `app/components/leaderboard/LeaderboardCards.tsx` | Add `compareUserId` state, compute ranks, pass `onCompare` + `groupName`, render HeadToHeadDialog |
| `app/components/leaderboard/LeaderboardView.tsx` | Thread `groupName?: string` prop through to LeaderboardCards |
| `app/components/friend-groups/friends-group-table.tsx` | Pass `correctGuesses`, `exactGuesses` in `transformedScores`; pass `groupName` to LeaderboardView |
| `locales/en/groups.json` | Add `groups.headToHead.*` translations |
| `locales/es/groups.json` | Add Spanish translations |

**Data flow for `correctGuesses`/`exactGuesses`:**
`getGameGuessStatisticsForUsers` (returns `total_correct_guesses`, `total_exact_guesses`)
→ `getUserScoresForTournament` (maps to `correctGuesses`, `exactGuesses` on `UserScore`)
→ `transformedScores` in `friends-group-table.tsx` — **EXPLICIT mapping required** (the transform is field-by-field, NOT a spread; must add `correctGuesses: score.correctGuesses, exactGuesses: score.exactGuesses`)
→ `transformToLeaderboardUser()` in `LeaderboardCards.tsx` (add explicit mapping)
→ `LeaderboardUser` (consumed by `HeadToHeadDialog`)

**Data flow for `groupName`:**
`prodeGroup.name` (available in `friend-groups/[id]/page.tsx`)
→ Add `groupName: string` prop to `ProdeGroupTable` in `friends-group-table.tsx`
→ Pass `groupName` to `<LeaderboardView>` → `<LeaderboardCards>` → `<HeadToHeadDialog>`
(One-liner prop addition at each layer; `friends-group-table.tsx` Props type needs explicit `groupName: string`)

**Category totals in HeadToHeadDialog — compute from sub-scores, NOT pre-computed fields:**

`LeaderboardUser` has pre-computed fields `groupPoints` and `knockoutPoints` but these use a different formula than desired:
- `groupPoints` in `friends-group-table.tsx` = `groupStageScore + groupStageQualifiersScore` (missing groupBoostBonus, groupPositionScore)
- `knockoutPoints` = `playoffScore` only (missing playoffBoostBonus)

`HeadToHeadDialog` MUST compute category totals inline from individual sub-scores:
```typescript
const groupStageTotal = (u: LeaderboardUser) =>
  u.groupStageScore + u.groupBoostBonus + u.groupStageQualifiersScore + (u.groupPositionScore ?? 0)
const knockoutTotal = (u: LeaderboardUser) =>
  u.playoffScore + u.playoffBoostBonus
const awardsTotal = (u: LeaderboardUser) =>
  u.honorRollScore + u.individualAwardsScore
```
All individual sub-scores ARE on `LeaderboardUser`; DO NOT use `groupPoints` or `knockoutPoints`.

**Callback pattern for LeaderboardCard — no interface change needed:**

`LeaderboardCard` keeps existing `onToggle: () => void` prop. `LeaderboardCards` determines which function to pass:
```typescript
// In LeaderboardCards.tsx
onToggle={isCurrentUser
  ? () => handleCardToggle(user.id)     // expand behavior
  : () => setCompareUserId(user.id)      // compare behavior
}
```
No `onCompare` prop needed. `LeaderboardCardProps` unchanged. The `aria-label` in `LeaderboardCard` can be updated to reference "compare" vs "expand" based on a new `isCurrentUser` prop logic (already available).

Note: `LeaderboardCardProps` already has `onToggle: () => void` — the card doesn't need to know *what* the toggle does, only that clicking triggers it. The parent decides the behavior.

## Visual Prototype

### Leaderboard Card (non-self, with compare affordance)
```
┌─────────────────────────────────────────────────┐
│  #3  [👤]  Maria                     1,180 pts  │
│             Tap to compare                       │
└─────────────────────────────────────────────────┘
```

### Leaderboard Card (self, with expand affordance)
```
┌─────────────────────────────────────────────────┐
│  #2  [👤]  You                      1,250 pts   │
│             Tap to view details                  │
└─────────────────────────────────────────────────┘
```

### Mobile (fullScreen dialog)
```
┌──────────────────────────┐
│ Head to Head         [X] │
├──────────────────────────┤
│                          │
│   [You]      [Maria]     │
│   👤 #2       👤 #3      │
│                          │
│ ── TOTAL POINTS ──       │
│  1,250 pts  1,180 pts    │
│  [you are winning]       │
│                          │
│ ── CATEGORY BREAKDOWN ─  │
│ Group Stage  850  800    │
│ Knockout     300  300    │
│ Awards       100   80    │
│                          │
│ ── GUESSES ──            │
│ Correct       25   22    │
│ Exact score    8    6    │
│                          │
│ YOUR LEAD:               │
│  Points  +70 pts         │
│  Stage   +50 pts         │
│  Guesses +3              │
│                          │
│ THEIR LEAD: (none)       │
│                          │
│ [Share on WhatsApp]      │
│ [Close]                  │
└──────────────────────────┘
```

### Desktop (centered dialog, maxWidth="sm")
Same content, wider spacing, side-by-side columns for user comparison headers.

## Implementation Steps

1. **Add guess counts to UserScore** (`definitions.ts`, `prode-group-actions.ts`)
   - Add `correctGuesses?` and `exactGuesses?` to `UserScore`
   - Pass from `gameStats.total_correct_guesses` and `gameStats.total_exact_guesses` in `getUserScoresForTournament`

2. **Update LeaderboardUser type** (`types.ts`)
   - Add `correctGuesses?` and `exactGuesses?` to `LeaderboardUser`
   - No change to `LeaderboardCardProps` (onToggle pattern reused)

3. **Update LeaderboardCard** (`LeaderboardCard.tsx`)
   - Update `aria-label` to use `isCurrentUser` to switch between "expand" and "compare" wording
   - Add visual affordance hint for non-self cards: "Tap to compare" (similar to existing "Tap to view details")
   - No structural change; `onToggle` still drives the click

4. **Update friends-group-table.tsx** (`friends-group-table.tsx`)
   - Add `groupName: string` to `Props` type
   - Add `correctGuesses: score.correctGuesses, exactGuesses: score.exactGuesses` explicitly to `transformedScores` mapping block (it is field-by-field, NOT a spread)
   - Pass `groupName` prop to `LeaderboardView`

5. **Update LeaderboardView.tsx** (`LeaderboardView.tsx`)
   - Accept and thread `groupName?: string` prop to `LeaderboardCards`

6. **Update LeaderboardCards** (`LeaderboardCards.tsx`)
   - Accept `groupName?: string` prop
   - Add `compareUserId` state
   - Add `compareUser` + `compareUserRank` derived from `leaderboardUsers`
   - Update `transformToLeaderboardUser()` to include `correctGuesses` and `exactGuesses`
   - Pass `onToggle` with different behavior per card: self = expand, other = `setCompareUserId(user.id)`
   - Render `<HeadToHeadDialog>` conditionally

7. **Create HeadToHeadDialog** (`HeadToHeadDialog.tsx`)
   - MUI Dialog with `fullScreen` on mobile (`useMediaQuery(theme.breakpoints.down('sm'))`)
   - Side-by-side comparison: total points (highlighted winner), category breakdown, correct/exact guesses
   - Advantages section: "Your Lead" and "Their Lead"
   - WhatsApp share button using `wa.me` URL scheme
   - Current user's actual name used in share message (not "You")
   - Translations via `useTranslations('groups.headToHead')`

8. **Add translations** (`locales/en/groups.json`, `locales/es/groups.json`)
   - Add `groups.headToHead.*` keys

9. **Write tests** (`HeadToHeadDialog.test.tsx`)
   - Renders both user names and points
   - Highlights correct winner
   - Shows correct category breakdown
   - Calculates advantages correctly (with division-by-zero guards where needed)
   - Handles equal stats ("evenly matched" state)
   - Share button opens correct WhatsApp URL
   - Close button closes dialog
   - No advantages on either side shows correct empty state

## Testing Strategy

**Unit tests for HeadToHeadDialog:**
- Renders both users' names and points
- Highlights winner (higher total points has visual emphasis)
- Shows correct category breakdown values
- Shows "Your Lead" section with correct advantages
- Shows "Their Lead" section when opponent leads in some category
- Shows "evenly matched" message when no advantages either side
- Share button opens WhatsApp URL with correct banter copy (currentUser winning vs losing vs tied)
- Close button fires onClose callback
- Renders correctly when `correctGuesses`/`exactGuesses` are 0 (no division by zero)
- Use `renderWithTheme()` from `@/__tests__/utils/test-utils`
- Mock `LeaderboardUser` objects directly (no factory needed for this type)

**Unit tests for LeaderboardCard (updated behavior):**
- `aria-label` contains "compare" when `isCurrentUser` is false
- `aria-label` contains "expand"/"collapse" when `isCurrentUser` is true
- "Tap to compare" caption visible for non-self cards
- "Tap to view details" caption visible for self card (existing behavior)

**Integration check (LeaderboardCards):**
- Clicking a non-self card opens HeadToHeadDialog
- Self card still expands (not compare)
- Closing dialog clears compareUserId

**Coverage target:** 80% on new code (SonarCloud enforced)

## Validation Considerations

- 0 new SonarCloud issues
- 80% coverage on new files
- Accessibility: dialog has `aria-labelledby`, compare button has `aria-label`
- No new TypeScript strict mode violations
- Translations registered in both EN and ES

## Open Questions / Resolved

1. **Group name in share message:** Resolved — thread `groupName?: string` through `friends-group-table.tsx` → `LeaderboardView` → `LeaderboardCards`. The page already has the group name available.

2. **Accuracy %:** Resolved — `getGameGuessStatisticsForUsers` (primary path) does NOT return `total_games`. Instead, display raw `total_correct_guesses` and `total_exact_guesses` from `GameStatisticForUser` type, labeled as "Correct Guesses" and "Exact Scores".

3. **Self-comparison:** Resolved — cards for the current user will not receive `onCompare`, so clicking still expands the detail view. Other users' cards exclusively open the comparison modal.

4. **"You" label in dialog:** Show "You" in the dialog for the current user (consistent with leaderboard), use actual name in the share message text.

5. **Accessibility (nested interactive elements):** Resolved — no nesting required. Each card has one action: self-card = expand, other-card = compare. No nested interactive elements.
