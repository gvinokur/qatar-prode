# Story #449: Seed Team Strength Rankings

## Context

The app has no concept of team strength. Adding a nullable `rank` field (lower = stronger, following FIFA World Rankings convention) to the `teams` table allows future features (e.g., auto-fill predictions, smart defaults) to use relative team strength without re-importing data. The field is intentionally generic — it works for any tournament type. This story seeds official FIFA World Rankings as of the December 2023 tournament draw for all 48 FIFA 2026 teams, while leaving the field NULL for Copa América and Euro teams.

## Acceptance Criteria

- Every FIFA 2026 team has a `rank` value reflecting official FIFA World Rankings as of the draw date (Dec 2023)
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

## FIFA 2026 Team Rankings (December 2023)

Source: Official FIFA World Rankings as of the tournament draw (December 2, 2023). The November 23, 2023 ranking update is the reference.

| Short Name | Team | FIFA Rank |
|-----------|------|-----------|
| ARG | Argentina | 1 |
| FRA | France | 2 |
| BEL | Belgium | 3 |
| ENG | England | 4 |
| BRA | Brazil | 5 |
| POR | Portugal | 6 |
| NED | Netherlands | 7 |
| ESP | Spain | 8 |
| CRO | Croatia | 10 |
| USA | USA | 11 |
| URU | Uruguay | 12 |
| MAR | Morocco | 13 |
| GER | Germany | 16 |
| MEX | Mexico | 15 |
| COL | Colombia | 17 |
| JPN | Japan | 19 |
| SUI | Switzerland | 20 |
| SEN | Senegal | 18 |
| IRN | Iran | 21 |
| KOR | South Korea | 24 |
| AUS | Australia | 25 |
| AUT | Austria | 23 |
| ECU | Ecuador | 41 |
| CAN | Canada | 49 |
| NOR | Norway | 38 |
| TUN | Tunisia | 31 |
| EGY | Egypt | 42 |
| ALG | Algeria | 51 |
| KSA | Saudi Arabia | 57 |
| SCO | Scotland | 39 |
| GHA | Ghana | 64 |
| PAR | Paraguay | 66 |
| PAN | Panama | 75 |
| RSA | South Africa | 70 |
| QAT | Qatar | 58 |
| CPV | Cape Verde | 63 |
| CIV | Ivory Coast | 52 |
| NZL | New Zealand | 92 |
| JOR | Jordan | 84 |
| UZB | Uzbekistan | 74 |
| CUW | Curacao | 89 |
| HAI | Haiti | 83 |

**Playoff teams (NULL rank — team identity unknown at draw time):**
PO-A, PO-B, PO-C, PO-D, IC-1, IC-2

> ⚠️ **Implementer note:** Verify these values against the official FIFA World Rankings released November 23, 2023 before writing the migration. The FIFA World Rankings page archives historical rankings.

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
