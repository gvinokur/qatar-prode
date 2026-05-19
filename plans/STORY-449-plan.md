# Story #449: Seed Team Strength Rankings

## Context

The app has no concept of team strength. Adding a nullable `rank` field (lower = stronger, following FIFA World Rankings convention) to the `teams` table allows future features (e.g., auto-fill predictions, smart defaults) to use relative team strength without re-importing data. The field is intentionally generic — it works for any tournament type. This story seeds official FIFA World Rankings as of March 2026 (the most recent ranking before the tournament) for all 42 confirmed FIFA 2026 teams, while leaving the field NULL for Copa América, Euro, and playoff placeholder teams.

## Acceptance Criteria

- Every FIFA 2026 team has a `rank` value reflecting official FIFA World Rankings as of March 2026
- Teams without a rank (Copa América, Euro, playoff placeholders) display and function correctly (rank is nullable)
- The rank field is available via TypeScript types for use by other features
- No user-facing display of rankings (out of scope)

## Technical Approach

This is a pure backend/data story — no UI changes. Three changes are needed:

1. **SQL migration**: Add nullable `rank INTEGER` column to `teams` table
2. **SQL seed migration**: UPDATE all 48 confirmed FIFA 2026 teams with their official ranking
3. **TypeScript type**: Add `rank?: number | null` to `TeamTable` in `app/db/tables-definition.ts`

Additionally, update `data/fifa-2026/teams.ts` so fresh dev imports also include ranks (keeps the data file and DB in sync for future use).

### What does NOT change
- `app/db/team-repository.ts` — no new queries needed; existing `selectAll()` calls automatically include the new column via Kysely's type inference
- No Server Actions changes
- No UI changes

## Files to Create/Modify

| File | Change |
|------|--------|
| `migrations/20260519000000_add_rank_to_teams.sql` | New: ADD COLUMN rank INTEGER NULL |
| `migrations/20260519000001_seed_fifa_2026_team_ranks.sql` | New: UPDATE rank per FIFA 2026 team |
| `app/db/tables-definition.ts` | Modify: add `rank?: number | null` to TeamTable |
| `data/fifa-2026/teams.ts` | Modify: add optional rank param to team helper + values |
| `docs/code-structure/db.md` | Modify: document rank field on TeamTable |

## FIFA 2026 Team Rankings (March 2026)

Source: Official FIFA World Rankings, March 2026 release. Use the most recent ranking published at [https://www.fifa.com/fifa-world-ranking](https://www.fifa.com/fifa-world-ranking) before implementation.

> ⚠️ **Implementer note:** My training data does not extend to March 2026. Look up the official FIFA World Rankings for March 2026 and fill in this table before writing the seed migration. The FIFA website provides a full historical archive. All 42 confirmed teams below need a rank value; the 6 playoff placeholder teams (PO-A, PO-B, PO-C, PO-D, IC-1, IC-2) remain NULL.

| Short Name | Team | FIFA Rank (March 2026) |
|-----------|------|-----------|
| ARG | Argentina | *look up* |
| FRA | France | *look up* |
| BEL | Belgium | *look up* |
| ENG | England | *look up* |
| BRA | Brazil | *look up* |
| POR | Portugal | *look up* |
| NED | Netherlands | *look up* |
| ESP | Spain | *look up* |
| CRO | Croatia | *look up* |
| USA | USA | *look up* |
| URU | Uruguay | *look up* |
| MAR | Morocco | *look up* |
| GER | Germany | *look up* |
| MEX | Mexico | *look up* |
| COL | Colombia | *look up* |
| JPN | Japan | *look up* |
| SUI | Switzerland | *look up* |
| SEN | Senegal | *look up* |
| IRN | Iran | *look up* |
| KOR | South Korea | *look up* |
| AUS | Australia | *look up* |
| AUT | Austria | *look up* |
| ECU | Ecuador | *look up* |
| CAN | Canada | *look up* |
| NOR | Norway | *look up* |
| TUN | Tunisia | *look up* |
| EGY | Egypt | *look up* |
| ALG | Algeria | *look up* |
| KSA | Saudi Arabia | *look up* |
| SCO | Scotland | *look up* |
| GHA | Ghana | *look up* |
| PAR | Paraguay | *look up* |
| PAN | Panama | *look up* |
| RSA | South Africa | *look up* |
| QAT | Qatar | *look up* |
| CPV | Cape Verde | *look up* |
| CIV | Ivory Coast | *look up* |
| NZL | New Zealand | *look up* |
| JOR | Jordan | *look up* |
| UZB | Uzbekistan | *look up* |
| CUW | Curacao | *look up* |
| HAI | Haiti | *look up* |

**Playoff teams (NULL rank — team identity unknown):**
PO-A, PO-B, PO-C, PO-D, IC-1, IC-2

## Mid-Level Design

### Call Graph Changes

No call graph changes. The `rank` field is additive — existing queries return it automatically via Kysely `selectAll()`. No new cross-layer flows are introduced.

### `app/db/tables-definition.ts` *(modified)*

**Changed types:**

- **TeamTable** *(interface)*
  Add `rank?: number | null` field after `transfermarkt_id`.
  No function changes — Kysely derives `Team`, `TeamNew`, `TeamUpdate` automatically.
  Tests: N/A (type-only change, validated by TypeScript compiler)

### `data/fifa-2026/teams.ts` *(modified)*

**Changed functions:**

- **team(name, short_name, primary_color, secondary_color, rank?)**: `object` *(was: no rank param)*
  Update helper function to accept optional rank (number | undefined). All 42 confirmed FIFA 2026 team calls get their rank value; 6 playoff placeholder calls pass no rank (undefined).
  Tests: N/A (data file, no unit tests needed)

## Implementation Steps

### Wave 1: Database Schema

**Task 1: Add migration to add rank column**
- Create `migrations/20260519000000_add_rank_to_teams.sql`
  ```sql
  -- Story #449: Team strength rankings
  -- Lower rank = stronger (FIFA World Rankings convention)
  -- Nullable: non-FIFA-2026 teams (Copa América, Euro, etc.) have no rank
  -- CHECK constraint enforces valid FIFA ranking bounds (1–999)
  ALTER TABLE teams ADD COLUMN rank INTEGER CHECK (rank IS NULL OR (rank > 0 AND rank < 1000));
  ```
- CODE-STRUCTURE files to update: `docs/code-structure/db.md` — update TeamTable entry

**Task 2: Add seed migration for FIFA 2026 team ranks**
- Create `migrations/20260519000001_seed_fifa_2026_team_ranks.sql`
  - UPDATE each team by `short_name` with its FIFA ranking
  - 42 UPDATE statements for confirmed teams
  - Playoff placeholder teams (PO-A, PO-B, etc.) remain NULL (no UPDATE needed)
- CODE-STRUCTURE files to update: none (no new functions)

### Wave 2: TypeScript Types + Data File

**Task 3: Update TypeScript type definition**
- `app/db/tables-definition.ts`: add `rank?: number | null` to `TeamTable` after `transfermarkt_id`
- CODE-STRUCTURE files to update: `docs/code-structure/db.md` — update TeamTable entry

**Task 4: Update FIFA 2026 data file**
- `data/fifa-2026/teams.ts`: extend `team()` helper with optional `rank` param; add rank values to all 42 confirmed teams
- CODE-STRUCTURE files to update: none (data file, no layer documentation needed)

## Testing Strategy

### What to test
This story is primarily a database schema + seed data change.

- **TypeScript compilation**: `npm run build` must pass with no type errors (validates `rank` is optional and `number | null`-compatible)
- **Lint**: `npm run lint` must pass
- **Existing tests**: `npm run test` must pass — the nullable column addition must not break any existing test that creates/queries teams

### Integration test: rank field behavior
Add one integration test file covering the rank field's key behaviors. The project has existing Vitest integration test patterns that exercise the real database.

File: `app/db/__tests__/team-rank.test.ts`

Test cases:
1. **Rank is readable on an existing team** — create a team, set rank=10, query it back, confirm rank=10
2. **NULL rank is valid and returned as null** — create a team without rank, query it back, confirm rank is null (covers Copa América/Euro teams)
3. **Rank below 1 is rejected by database constraint** — attempt to set rank=0, expect DB error (validates CHECK constraint lower bound)
4. **Rank at or above 1000 is rejected by database constraint** — attempt to set rank=1000, expect DB error (validates CHECK constraint upper bound)
5. **Valid boundary ranks are accepted** — rank=1 and rank=999 insert without error

### Manual verification
After running migrations on dev:
1. `SELECT short_name, rank FROM teams ORDER BY rank NULLS LAST;` — confirm 42 teams have ranks, 6 playoff teams have NULL
2. `SELECT COUNT(*) FROM teams WHERE rank IS NOT NULL;` — should be 42
3. Confirm Copa América and Euro teams (if they exist in DB) have NULL rank and app works correctly

## Verification Checklist

- [ ] `npm run build` passes (TypeScript types compile)
- [ ] `npm run lint` passes
- [ ] `npm run test` passes (no regressions)
- [ ] `migrations/20260519000000_add_rank_to_teams.sql` exists with ADD COLUMN
- [ ] `migrations/20260519000001_seed_fifa_2026_team_ranks.sql` exists with UPDATE statements
- [ ] `TeamTable` interface has `rank?: number | null`
- [ ] `data/fifa-2026/teams.ts` updated with rank values
- [ ] `docs/code-structure/db.md` updated to document rank field
- [ ] User approves running migrations on dev database

## Open Questions

None — story scope is well-defined.
