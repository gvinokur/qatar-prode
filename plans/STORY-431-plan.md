# Plan: [Bug] Group standings tiebreaker ranks teams incorrectly when conduct scores are set (#431)

## Context

Admins can update conduct scores for teams via the backoffice team-stats dialog. Conduct score is the final tiebreaker in group standings (after points → goal difference → goals scored). Lower is better.

Three separate bugs compound to produce incorrect ranking:

1. **`calculateGroupPosition` ignores conduct_scores** — always starts each team at `conduct_score: 0`; the game-reducer never updates it since conduct is set separately from game results.
2. **`calculateAndStoreGroupPosition` wipes conduct_scores in DB** — it calls `calculateGroupPosition` (which returns 0 for conduct_scores), then `updateTournamentGroupTeams` writes those zeroes over the admin-set values. This happens every time game results are saved or the admin triggers recalculation.
3. **`TeamStandingsCards` client-side sort only uses points + goal_difference** — even if the DB had correct data, the display re-sorts without goals_for or conduct_score, so tied teams appear in wrong order.

The backoffice local standings preview (useEffect calling `calculateGroupPosition` directly in `group-backoffice-tab.tsx`) has the same issue.

---

## Acceptance Criteria (from issue)

- After admin updates conduct scores, standings re-rank tied teams with lower conduct score ranked higher
- Conduct score acts as last tiebreaker (points → goal difference → goals for → conduct score)
- Corrected ranking appears in both backoffice standings view and public tournament standings

---

## Technical Approach

Four targeted changes + new unit tests. No schema changes needed. No new DB columns.

---

## Files to Modify

| File | Change |
|------|--------|
| `app/utils/group-position-calculator.ts` | Add `conductScores` param; inject into initial stats; thread through recursive calls |
| `app/actions/backoffice-actions.ts` | Fetch existing conduct_scores from DB before calculating; pass to `calculateGroupPosition` |
| `app/components/groups-page/team-standings-cards.tsx` | Extend sort to include goals_for and conduct_score |
| `app/components/backoffice/group-backoffice-tab.tsx` | Pass `conductScores` state to local `calculateGroupPosition` useEffect |
| `docs/code-structure/utils.md` | Update `calculateGroupPosition` signature |
| `docs/code-structure/actions.md` | Update `calculateAndStoreGroupPosition` description |

## Files to Create

| File | Purpose |
|------|---------|
| `app/utils/__tests__/group-position-calculator.test.ts` | Unit tests for conduct_score tiebreaking |

---

## Mid-Level Design

### Call Graph Changes

No new cross-layer flows added. Existing flows modified:
- **calculateAndStoreGroupPosition** — now calls `findTeamsInGroup` before `calculateGroupPosition` to load current conduct scores.

### `app/utils/group-position-calculator.ts` *(modified)*

**Changed function:**

- **calculateGroupPosition(teamIds, games, sortByGamesBetweenTeams, conductScores)**: `TeamStats[]`
  *(was: no conductScores param)*
  Adds optional 4th param `conductScores: Record<string, number> = {}`. Injects `conductScores[teamId] ?? 0` into the initial stats for each team so `getMagicNumber` correctly uses conduct score for tiebreaking. Threads the parameter through all recursive calls. No defensive validation added — callers guarantee valid data (`calculateAndStoreGroupPosition` ensures all teamIds have entries, or defaults to 0 for missing keys via `?? 0`).
  Calls: getWinner, genericTeamStatsComparator, pointsBasesTeamStatsComparator
  Tests:
  - two teams equal on points, GD, and goals_for but different conduct_score → team with lower conduct_score ranks first
  - team with conduct_score=0 (default) vs team with conduct_score=5 → zero-score team ranks first
  - conductScores parameter is optional; omitting it preserves existing sort behavior (backward compat)
  - team with better goal_difference ranks above another even when the lower-GD team has conduct_score=0 (GD beats conduct)
  - team with more goals_for ranks above another even when the lower-GF team has conduct_score=0 (goals_for beats conduct)
  - three-way tie resolved: teams with different conduct_scores rank in correct order when all other stats are equal
  - team ID missing from conductScores map defaults to 0 (?? 0 fallback, treated as best conduct)

### `app/actions/backoffice-actions.ts` *(modified)*

**Changed function:**

- **calculateAndStoreGroupPosition(groupId, teamIds, groupGames, sortByGamesBetweenTeams)**: `Promise<void>`
  *(signature unchanged, internal logic changes)*
  Before calling `calculateGroupPosition`, calls `findTeamsInGroup(group_id)` to read current conduct_scores and builds a `Record<string, number>` map. Passes this map as the 4th arg to `calculateGroupPosition`. The result then carries correct conduct_scores that are written back to DB, preserving admin-set values.
  Calls: findTeamsInGroup, calculateGroupPosition, updateTournamentGroupTeams

### `app/components/groups-page/team-standings-cards.tsx` *(modified)*

**Changed logic (no signature change):**

- **sort comparator in `useMemo`** (lines 26-29 and 37-39):
  Extends the sort chain: points → goal_difference → goals_for → conduct_score (lower is better).
  Before: `return b.goal_difference - a.goal_difference` as final fallback.
  After: adds `if (b.goals_for !== a.goals_for) return b.goals_for - a.goals_for` then `return (a.conduct_score || 0) - (b.conduct_score || 0)`.
  Same fix applied to the `prevSorted` comparator (previousTeamStats).

### `app/components/backoffice/group-backoffice-tab.tsx` *(modified)*

**Changed logic:**

- **useEffect that calls `calculateGroupPosition` locally** (lines ~80-89):
  Passes `conductScores` state as 4th arg so the backoffice live preview also ranks by conduct score.
  Adds `conductScores` to the useEffect dependency array.

---

## Testing Strategy

### New test file: `app/utils/__tests__/group-position-calculator.test.ts`

Tests to write (all 7 map to the Mid-Level Design test cases above):
- `conduct_score tiebreaker: lower conduct_score ranks higher when all other stats are equal`
- `conduct_score tiebreaker: team with conduct_score=0 ranks above team with conduct_score=5`
- `conduct_score is optional (backward compat): omitting conductScores parameter gives same results as before`
- `goal_difference beats conduct_score: team with better GD ranks higher even with conduct_score=0`
- `goals_for beats conduct_score: team with more goals_for ranks higher even with conduct_score=0`
- `three-way tie with conduct_score: tied teams ranked correctly by conduct_score as final tiebreaker`
- `missing team ID in conductScores defaults to 0`

Pattern: construct test data inline using local helpers (e.g. `makeGame(homeTeam, awayTeam, homeScore, awayScore)`), matching the style in `group-standings-calculator.test.ts`. No external factories.

Coverage: `calculateGroupPosition` is currently uncovered → this file provides direct coverage.

---

## Validation

1. Run `npm test` — new tests in `group-position-calculator.test.ts` must pass; no regressions in existing standings tests
2. Run `npm run build` and `npm run lint`
3. In Vercel Preview: open backoffice for a group with tied teams (same points, GD, GF), set different conduct scores via the team-stats dialog, save → verify standings reorder with lower conduct score first
4. Verify the public tournament standings page shows the same corrected order
