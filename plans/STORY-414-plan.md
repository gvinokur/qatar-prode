# Plan: Story #414 — Replace JS-side count with SQL COUNT query for "Predictions Made"

## Story Metadata
- **Story Number:** 414
- **Story Title:** [Story] Replace JS-side count with SQL COUNT query for "Predictions Made" on statistics page
- **Worktree Path:** /Users/gvinokur/Personal/qatar-prode/.claude/worktrees/determined-turing-f8c893
- **Branch:** claude/determined-turing-f8c893
- **Epic:** #409

## Context
`app/[locale]/tournaments/[id]/stats/page.tsx` fetches every `game_guesses` row for the user
via `findGameGuessesByUserId()` just to call `.length` on the result (lines 108–109). This
transfers all row data over the wire when a single SQL `COUNT(*)` would suffice. The pattern for
efficient COUNT queries already exists in this codebase (e.g., `getGameCountsForTournament` in
`game-repository.ts`, `users-repository.ts` count helper).

## Objective
Replace the `.length`-on-array pattern on the stats page with a dedicated `countGameGuessesByUserId`
repository function that issues one `COUNT(*)` SQL query and returns a plain `number`.

## Files to Modify
| File | Change |
|------|--------|
| `app/db/game-guess-repository.ts` | Add `countGameGuessesByUserId` function |
| `app/[locale]/tournaments/[id]/stats/page.tsx` | Replace import + usage with new count function |
| `docs/code-structure/db.md` | Document new function |
| `CODE-STRUCTURE.md` | Update Flow 12 call graph entry |

## Technical Approach

### 1. New repository function (`game-guess-repository.ts`)

Add after `findGameGuessesByUserId` (line 25):

```typescript
export const countGameGuessesByUserId = cache(async function (
  userId: string,
  tournamentId: string
): Promise<number> {
  const result = await db
    .selectFrom(tableName)
    .innerJoin('games', 'games.id', 'game_guesses.game_id')
    .where('game_guesses.user_id', '=', userId)
    .where('games.tournament_id', '=', tournamentId)
    .select((eb) => eb.fn.countAll<string>().as('count'))
    .executeTakeFirst()
  return result ? Number(result.count) : 0
})
```

- Uses identical joins/where clauses as `findGameGuessesByUserId` so counts match exactly
- Returns `number` (0 when no guesses), not nullable — callers need no null checks
- Wrapped in `cache()` consistent with other read functions in this file
- Uses `countAll<string>` (Kysely serializes numeric aggregates as strings) then `Number()` — same pattern as `users-repository.ts` lines 63–73

### 2. Stats page (`stats/page.tsx`)

**Remove** `findGameGuessesByUserId` from import (line 7):
```typescript
// Before
import { getGameGuessStatisticsForUsers, getBoostAllocationBreakdown, findGameGuessesByUserId } from "../../../../db/game-guess-repository";
// After
import { getGameGuessStatisticsForUsers, getBoostAllocationBreakdown, countGameGuessesByUserId } from "../../../../db/game-guess-repository";
```

**Replace** lines 108–109:
```typescript
// Before
const gameGuessesArray = user ? await findGameGuessesByUserId(user.id, tournamentId) : []
const totalPredictionsMade = gameGuessesArray.length

// After
const totalPredictionsMade = await countGameGuessesByUserId(user.id, tournamentId)
```

Note: `user` is guaranteed non-null here because of the `redirect` guard at line 55–57, so the ternary is not needed.

### 3. CODE-STRUCTURE.md updates

**`docs/code-structure/db.md`** — add after `findGameGuessesByUserId` entry (line 76):
```
- **countGameGuessesByUserId(userId: string, tournamentId: string)**: `Promise<number>` — Returns the count of game guesses for user in tournament via SQL COUNT(*) (cached).
```

**`CODE-STRUCTURE.md` Flow 12** — replace `findGameGuessesByUserId` with `countGameGuessesByUserId`:
```
      ├── countGameGuessesByUserId   # was findGameGuessesByUserId
```

## Mid-Level Design

### Call Graph Changes
**Modified flows:**
- **Flow 12 (User stats page)** — replace `findGameGuessesByUserId` with `countGameGuessesByUserId`

### `app/db/game-guess-repository.ts` *(modified)*

**New functions:**
- **countGameGuessesByUserId(userId: string, tournamentId: string)**: `Promise<number>`
  Returns the count of game guesses for the user in tournament via SQL COUNT(*).
  Calls: db (Kysely), cache
  Tests:
  - returns 0 when executeTakeFirst returns undefined (no matching guesses)
  - returns Number(result.count) when executeTakeFirst returns a count row (e.g. { count: '3' } → 3)
  - returns 0 when executeTakeFirst returns undefined for a non-existent userId

### `app/[locale]/tournaments/[id]/stats/page.tsx` *(modified)*

**Changed usage:**
- Remove `findGameGuessesByUserId` import and array-then-length pattern
- Replace with single `await countGameGuessesByUserId(user.id, tournamentId)` call
- `totalPredictionsMade` type remains `number` — no downstream changes needed

## Testing Strategy
Add to `__tests__/db/game-guess-repository.test.ts` using the existing test infrastructure:
- Mock: `createMockSelectQuery({ count: '3' })` → `mockDb.selectFrom.mockReturnValue(mockQuery)` (same mock pattern as other tests in the file)
- Mock `react` cache: already mocked in the file as `cache: vi.fn((fn) => fn)`
- Test cases:
  - Returns correct count: mock returns `{ count: '3' }`, expect result `3` (verifies Number() conversion)
  - Returns 0 when no guesses: mock `executeTakeFirst` returns `undefined`, expect result `0`
  - Returns 0 for nonexistent user: same as above (db returns undefined row)

Note: `testFactories.gameGuess()` is not needed here — we're testing the COUNT query result, not full row data.
Note: Database errors are intentionally allowed to propagate — no error handling at the repository layer (consistent with all other functions in the file).

## Acceptance Criteria (from issue)
- [ ] "Predictions Made" count on the statistics page shows the correct number
- [ ] Statistics page loads and displays all sections correctly
- [ ] `countGameGuessesByUserId` repository function replaces the `.length` pattern

## Verification
1. Run `npm run build` — no TS errors
2. Run `npm run test` — existing stats page tests pass
3. Navigate to `/[locale]/tournaments/[id]/stats` while logged in — "Predictions Made" count is correct
4. Run `npm run lint` — no lint errors

## Out of Scope
- Visual changes to the statistics page
- Boost count queries (already optimized in story #412)
- Changes to other callers of `findGameGuessesByUserId` (games page, etc.)
