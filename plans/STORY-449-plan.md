# Story #449: Seed Team Strength Rankings

## Context

The app has no concept of team strength. Adding a nullable `rank` field (lower = stronger, following FIFA World Rankings convention) to the `teams` table allows future features (e.g., auto-fill predictions, smart defaults) to use relative team strength without re-importing data. The field is intentionally generic — it works for any tournament type. This story seeds official FIFA World Rankings (April 1, 2026 — the most recent update) for all 48 FIFA 2026 teams, including the 6 playoff-qualified teams (UEFA paths A–D + two inter-confederation paths), which were settled on March 31, 2026. Only Copa América and Euro teams remain NULL.

## Acceptance Criteria

- All 48 FIFA 2026 teams have a `rank` value reflecting official FIFA World Rankings (April 1, 2026), including the 6 playoff-qualified teams settled March 31, 2026
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

## FIFA 2026 Team Rankings (April 1, 2026)

Source: Official FIFA World Rankings, April 1, 2026 update (the most recent before tournament; next update scheduled June 9, 2026).
- **Ranks 1–20**: April 1, 2026 official update (via Wikipedia FIFA World Rankings article)
- **Ranks 21+**: November 19, 2025 official update (official draw seedings, via Wikipedia 2026 FIFA World Cup seeding article)

| Short Name | Team | FIFA Rank | Source |
|-----------|------|-----------|--------|
| FRA | France | 1 | Apr 2026 |
| ESP | Spain | 2 | Apr 2026 |
| ARG | Argentina | 3 | Apr 2026 |
| ENG | England | 4 | Apr 2026 |
| POR | Portugal | 5 | Apr 2026 |
| BRA | Brazil | 6 | Apr 2026 |
| NED | Netherlands | 7 | Apr 2026 |
| MAR | Morocco | 8 | Apr 2026 |
| BEL | Belgium | 9 | Apr 2026 |
| GER | Germany | 10 | Apr 2026 |
| CRO | Croatia | 11 | Apr 2026 |
| COL | Colombia | 13 | Apr 2026 |
| SEN | Senegal | 14 | Apr 2026 |
| MEX | Mexico | 15 | Apr 2026 |
| USA | USA | 16 | Apr 2026 |
| URU | Uruguay | 17 | Apr 2026 |
| JPN | Japan | 18 | Apr 2026 |
| SUI | Switzerland | 19 | Apr 2026 |
| IRN | Iran | 20 | Nov 2025 |
| TUR | Turkey (UEFA Path C) | 22 | Apr 2026 |
| KOR | South Korea | 22 | Nov 2025 |
| ECU | Ecuador | 23 | Nov 2025 |
| AUT | Austria | 24 | Nov 2025 |
| AUS | Australia | 26 | Nov 2025 |
| CAN | Canada | 27 | Nov 2025 |
| NOR | Norway | 29 | Nov 2025 |
| PAN | Panama | 30 | Nov 2025 |
| EGY | Egypt | 34 | Nov 2025 |
| SWE | Sweden (UEFA Path B) | 38 | Apr 2026 |
| ALG | Algeria | 35 | Nov 2025 |
| SCO | Scotland | 36 | Nov 2025 |
| CZE | Czech Republic (UEFA Path D) | 41 | Apr 2026 |
| PAR | Paraguay | 39 | Nov 2025 |
| TUN | Tunisia | 40 | Nov 2025 |
| CIV | Ivory Coast | 42 | Nov 2025 |
| COD | DR Congo (IC Path 1) | 46 | Apr 2026 |
| UZB | Uzbekistan | 50 | Nov 2025 |
| QAT | Qatar | 51 | Nov 2025 |
| IRQ | Iraq (IC Path 2) | 57 | Apr 2026 |
| KSA | Saudi Arabia | 60 | Nov 2025 |
| RSA | South Africa | 61 | Nov 2025 |
| BIH | Bosnia & Herzegovina (UEFA Path A) | 65 | Apr 2026 |
| JOR | Jordan | 66 | Nov 2025 |
| CPV | Cape Verde | 68 | Nov 2025 |
| GHA | Ghana | 72 | Nov 2025 |
| CUW | Curacao | 82 | Nov 2025 |
| HAI | Haiti | 84 | Nov 2025 |
| NZL | New Zealand | 86 | Nov 2025 |

**Playoff teams now settled (qualified March 31, 2026):**
- PO-A → Bosnia & Herzegovina (BIH, rank 65)
- PO-B → Sweden (SWE, rank 38)
- PO-C → Turkey (TUR, rank 22)
- PO-D → Czech Republic (CZE, rank 41)
- IC-1 → DR Congo (COD, rank 46)
- IC-2 → Iraq (IRQ, rank 57)

> ⚠️ **Implementer note on playoff teams:** The DB likely stores these teams under their placeholder short_names (PO-A, PO-B, etc.) from the original import. The seed migration should UPDATE by `short_name = 'PO-A'` etc. If the teams have already been renamed in the DB, adjust accordingly.

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
  - 48 UPDATE statements — all 48 teams now have ranks (playoffs settled March 31, 2026)
  - Playoff teams UPDATE by their placeholder short_name (PO-A, PO-B, PO-C, PO-D, IC-1, IC-2) since that's how they were imported
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
1. `SELECT short_name, rank FROM teams ORDER BY rank NULLS LAST;` — confirm all 48 FIFA 2026 teams have ranks
2. `SELECT COUNT(*) FROM teams WHERE rank IS NOT NULL;` — should be 48
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
