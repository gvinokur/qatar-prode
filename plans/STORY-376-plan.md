# Plan: Story #376 — Matchday Grouping and Per-Stage Separators for Games List

## Context

The Games list currently shows all predictions as a flat ordered list with no visual grouping. Users cannot quickly identify which matchday a game belongs to or navigate the tournament progression. This story introduces:

1. A `matchday` DB column on the `games` table (sortable; group-stage games grouped by matchday number, e.g. "Fecha 1")
2. `StageSeparator` visual headers that divide the list by Matchday (Group Stage) or Round (Playoff Stage)
3. A stage label at the bottom of each game card (e.g. "Grupo A", "Octavos de Final") that is an interactive filter link on the Games page and static text elsewhere
4. Argentine-Spanish and English localisations ("Fecha {N}" / "Matchday {N}")

**Mockup reference:** `mockups/game-card-stage-info-mockup.html`

---

## Worktree Setup

```bash
./scripts/github-projects-helper story start 376 --project 1
# Creates: /Users/gvinokur/Personal/qatar-prode-story-376  branch: feature/story-376
```

---

## Acceptance Criteria Coverage

| AC | Implementation |
|----|---------------|
| Matchday field on games table | Migration + `GameTable` interface |
| Sort by matchday, game_date | `getAllTournamentGames` updated |
| Granular separators — Group Stage | `StageSeparator` with "Fecha {N}" / "Matchday {N}" label |
| Granular separators — Playoff Stage | `StageSeparator` with round_name label |
| Conditional stage links | `onStageClick?` prop; sets filter on Games page |
| Static state (no handler) | `onStageClick` omitted in dashboard consumers |
| Navigation support (optional) | Not in MVP scope; `onStageClick` is extensible |
| Localization | `locales/en/predictions.json` + `locales/es/predictions.json` |

---

## Technical Approach

### 1. Database — Migrations

**Migration 1** — Schema: `migrations/20260423000000_add_matchday_to_games.sql`

```sql
ALTER TABLE games ADD COLUMN IF NOT EXISTS matchday INTEGER;
```

**Migration 2** — World Cup seed data: `migrations/20260423000001_seed_world_cup_matchdays.sql`

Sets matchday for FIFA World Cup 2026 group-stage games using the established game_number ranges (48-team format: 12 groups × 4 games = 48 games per matchday, 3 matchdays):

```sql
UPDATE games
SET matchday =
  CASE
    WHEN game_number BETWEEN  1 AND 24 THEN 1
    WHEN game_number BETWEEN 25 AND 48 THEN 2
    WHEN game_number BETWEEN 49 AND 72 THEN 3
  END
WHERE tournament_id = '280a5902-5dfc-4ffc-ba9b-73a4f32e4401'  -- World Cup 26
  AND game_number BETWEEN 1 AND 72;
```

Both migrations require manual execution with user permission. If no games exist yet for this tournament, the UPDATE affects 0 rows safely.

### 2. Type Update

`app/db/tables-definition.ts` — add to `GameTable`:
```typescript
matchday?: number | null
```
`ExtendedGameData` inherits from `Game` so no change needed there.

### 3. Repository Sort

`app/db/game-repository.ts` — `getAllTournamentGames`:
Change `.orderBy('game_date', 'asc')` to:
```typescript
.orderBy('matchday', sql`asc nulls last`)
.orderBy('game_date', 'asc')
```
Only this function needs the change; dashboard/hub queries are time-window scoped and don't need matchday ordering.

### 4. New Component — StageSeparator

`app/components/stage-separator.tsx`

```tsx
'use client'
interface StageSeparatorProps { label: string }
export function StageSeparator({ label }: StageSeparatorProps)
```

Renders a `Box` with `gridColumn: '1 / -1'` (spans the full CSS grid), an overline `Typography` in `primary.main`, and a `Divider` — matching the mockup design.

### 5. Stage Label on Game Card

**Thread:** `GamesListWithScroll → FlippableGameCard → GameView → CompactGameViewCard`

**`FlippableGameCard`** — new optional prop:
```typescript
onStageClick?: () => void
```
Passed through to `GameView`.

**`GameView`** — new optional prop `onStageClick?: () => void`:
- Computes `stageLabel: string | undefined`:
  ```typescript
  const stageLabel = game.playoffStage
    ? game.playoffStage.round_name
    : game.group
    ? t('secondaryFilters.groupWithLetter', { letter: game.group.group_letter })
    : undefined
  ```
  (Reuses existing `predictions.secondaryFilters.groupWithLetter` translation key — "Group {letter}" / "Grupo {letter}")
- Passes `stageLabel` and `onStageClick` to `CompactGameViewCard`.

**`CompactGameViewCard`** — extend `GameGuessProps`:
```typescript
stageLabel?: string
onStageClick?: () => void
```
Renders a row below the divider:
- If `onStageClick` provided: a clickable `Box` with hover `color: primary.main`, `ArrowForwardIos` (10px), aria-label
- If no `onStageClick`: a static `Typography caption` in `text.secondary`

### 6. Stage Separators in GamesListWithScroll

`app/components/games-list-with-scroll.tsx`

New prop:
```typescript
onGameStageClick?: (game: ExtendedGameData) => void
```

New internal logic — compute `gameSections`:
```typescript
type GameSection = { sectionKey: string; label: string; games: ExtendedGameData[] }
```

Grouping rules:
- **Playoff game** (`game.playoffStage != null`): `sectionKey = 'playoff-{roundId}'`, `label = round_name`
- **Group game with matchday** (`game.group != null && game.matchday != null`): `sectionKey = 'matchday-{matchday}'`, `label = t('game.matchday', { number: matchday })`
- **Group game without matchday**: `sectionKey = 'group-{group_letter}'`, `label = t('secondaryFilters.groupWithLetter', { letter })`

Renders inside the CSS grid:
```tsx
{gameSections.map(section => (
  <Fragment key={section.sectionKey}>
    <StageSeparator label={section.label} />  {/* gridColumn: '1 / -1' handled internally */}
    {section.games.map(game => (
      <Box key={game.id} id={`game-${game.id}`} data-game-id={game.id}>
        <FlippableGameCard
          ...
          onStageClick={onGameStageClick ? () => onGameStageClick(game) : undefined}
        />
      </Box>
    ))}
  </Fragment>
))}
```

### 7. UnifiedGamesPageClient — Filter Handler

`app/components/unified-games-page-client.tsx`

```typescript
const handleGameStageClick = useCallback((game: ExtendedGameData) => {
  if (game.playoffStage) {
    setActiveFilter('playoffs')
    setRoundFilter(game.playoffStage.tournament_playoff_round_id)
  } else if (game.group) {
    setActiveFilter('groups')
    setGroupFilter(game.group.tournament_group_id)
  }
}, [setActiveFilter, setGroupFilter, setRoundFilter])
```

Pass to `GamesListWithScroll`:
```tsx
<GamesListWithScroll
  ...
  onGameStageClick={handleGameStageClick}
/>
```

### 8. Localization

Add to `locales/en/predictions.json` → `game` section:
```json
"matchday": "Matchday {number}"
```

Add to `locales/es/predictions.json` → `game` section:
```json
"matchday": "Fecha {number}"
```

---

## Mid-Level Design

### Call Graph Changes

No new cross-layer flows. All changes are within existing UI components plus the sort change in `getAllTournamentGames`.

---

### `migrations/20260423000000_add_matchday_to_games.sql` *(new)*

SQL only. Adds `matchday INTEGER` column. No functions.

### `migrations/20260423000001_seed_world_cup_matchdays.sql` *(new)*

SQL only. Updates `matchday` for FIFA WC 2026 group-stage games using `short_name = 'WC 2026'` subquery. Safe no-op if tournament doesn't exist yet. No functions.

---

### `app/db/tables-definition.ts` *(modified)*

**Changed interfaces:**

- **GameTable** *(extended with `matchday` field)*
  `matchday?: number | null` — optional nullable integer; null when not set.

---

### `app/db/game-repository.ts` *(modified)*

**Changed functions:**

- **getAllTournamentGames(tournamentId: string)**: `Promise<ExtendedGameData[]>` *(sort order changed)*
  Now sorts by `matchday ASC NULLS LAST, game_date ASC` instead of `game_date ASC` only.
  Calls: db, jsonObjectFrom
  Tests:
  - games with matchday 2 appear after matchday 1
  - games with null matchday appear after games with a matchday value
  - games within the same matchday are sorted by game_date ascending

---

### `app/components/stage-separator.tsx` *(new)*

**New component:**

- **StageSeparator({ label: string })**: `JSX.Element`
  Full-width grid-spanning header row. Renders overline Typography (primary.main, letterSpacing 2) + Divider (flexGrow 1, alpha primary 20%).
  Uses `gridColumn: '1 / -1'` on outer Box, `mt: 4, mb: 2`.
  Tests:
  - renders the label text
  - applies gridColumn '1 / -1' to the root element
  - renders a Divider element alongside the label

---

### `app/components/compact-game-view-card.tsx` *(modified)*

**Changed types:**

- **GameGuessProps** *(extended)*
  New fields: `stageLabel?: string`, `onStageClick?: () => void`

**Changed rendering:**

- **CompactGameViewCard** *(renders stage row when stageLabel provided)*
  When `isGameGuess && stageLabel` is truthy, renders below the bottom divider:
  - If `onStageClick` is defined: clickable Box with ArrowForwardIos icon, hover primary.main color
  - Else: static Typography variant="caption" color="text.secondary"
  Tests:
  - renders nothing when stageLabel is undefined
  - renders static text when onStageClick is not provided
  - renders clickable element when onStageClick is provided
  - clickable element calls onStageClick when clicked
  - hover styles applied only when onStageClick is provided

---

### `app/components/game-view.tsx` *(modified)*

**Changed functions:**

- **GameView({ game, teamsMap, handleEditClick, disabled, onStageClick? })**: `JSX.Element` *(new `onStageClick` prop)*
  Computes `stageLabel` from `game.group.group_letter` (using `predictions.secondaryFilters.groupWithLetter`) or `game.playoffStage.round_name`. Passes both to `CompactGameViewCard`.
  Calls: useTranslations, CompactGameViewCard, getTeamNames, calculateScoreForGame
  Tests:
  - passes stageLabel for group game: "Group A" (en) / "Grupo A" (es)
  - passes stageLabel for playoff game using round_name
  - passes undefined stageLabel when game has no group or playoffStage
  - passes onStageClick through to CompactGameViewCard

---

### `app/components/flippable-game-card.tsx` *(modified)*

**Changed functions:**

- **FlippableGameCard({ ..., onStageClick? })**: `JSX.Element` *(new optional prop)*
  Passes `onStageClick` to `GameView` front face. No other logic changes.
  Tests:
  - passes onStageClick to GameView when provided
  - renders without error when onStageClick is undefined
  - all other FlippableGameCard props are passed through unchanged when onStageClick is added

---

### `app/components/games-list-with-scroll.tsx` *(modified)*

**Changed functions:**

- **GamesListWithScroll({ games, teamsMap, tournamentId, activeFilter, tournament, onGameStageClick? })**: `JSX.Element` *(new `onGameStageClick` prop)*
  Computes `gameSections: GameSection[]` from `games` using useMemo. Renders `StageSeparator` + game cards per section inside the existing CSS grid.
  Calls: useTranslations, StageSeparator, FlippableGameCard
  Tests:
  - groups group-stage games by matchday into separate sections
  - groups playoff games by round into separate sections
  - renders a StageSeparator for each unique section
  - games without matchday fall into a separate section
  - passes per-game onStageClick closure when onGameStageClick is provided
  - renders no separator when all games belong to one section

---

### `app/components/unified-games-page-client.tsx` *(modified)*

**Changed functions:**

- **UnifiedGamesPageContent({ ... })**: `JSX.Element` *(adds handleGameStageClick)*
  New callback `handleGameStageClick(game: ExtendedGameData)` sets primary + secondary filter based on game's stage. Passed to `GamesListWithScroll`.
  Calls: setActiveFilter, setGroupFilter, setRoundFilter
  Tests:
  - calls setActiveFilter('groups') and setGroupFilter for a group game
  - calls setActiveFilter('playoffs') and setRoundFilter for a playoff game
  - does not call any setter when game has neither group nor playoffStage

---

## Files to Create

| File | Purpose |
|------|---------|
| `migrations/20260423000000_add_matchday_to_games.sql` | Add matchday column to games table |
| `migrations/20260423000001_seed_world_cup_matchdays.sql` | Set matchday 1/2/3 for FIFA WC 2026 game_numbers 1–72 |
| `app/components/stage-separator.tsx` | StageSeparator UI component |

## Files to Modify

| File | Change |
|------|--------|
| `app/db/tables-definition.ts` | Add `matchday` to GameTable |
| `app/db/game-repository.ts` | Update sort in getAllTournamentGames |
| `app/components/compact-game-view-card.tsx` | Add stageLabel + onStageClick to GameGuessProps |
| `app/components/game-view.tsx` | Compute stageLabel, pass onStageClick through |
| `app/components/flippable-game-card.tsx` | Add onStageClick prop, pass to GameView |
| `app/components/games-list-with-scroll.tsx` | Add StageSeparators + onGameStageClick |
| `app/components/unified-games-page-client.tsx` | Add handleGameStageClick handler |
| `locales/en/predictions.json` | Add `game.matchday` key |
| `locales/es/predictions.json` | Add `game.matchday` key (Fecha {number}) |
| `docs/code-structure/components/components-tournament-games.md` | Update StageSeparator + changed components |

---

## Testing Strategy

All component tests use `renderWithTheme` and `testFactories.*` for test data.

- **Unit tests for `StageSeparator`**: renders label, spans full width, renders Divider
- **Unit tests for `CompactGameViewCard`** (existing test file): new cases for stageLabel — use `testFactories.game()` for base game data; test static vs interactive rendering, click handler
- **Unit tests for `GamesListWithScroll`**: section grouping logic using `testFactories.game()` with `group`/`playoffStage`/`matchday` set; separator rendering per section
- **Unit tests for `GameView`**: stageLabel computed correctly for group/playoff/no-stage games — use `testFactories.game()` with appropriate group/playoffStage; `useTranslations` is mocked via the project's i18n test setup (existing `renderWithTheme` wrapper handles this)
- **Integration test for `UnifiedGamesPageClient`**: handleGameStageClick sets correct filters using `testFactories.game()` variants

**Migration testing:** Manual-only. No unit test for the SQL migration itself — admin manually runs on dev and production with user permission. Schema validation is done via TypeScript type check (`npm run build`).

Coverage target: ≥ 80% on all new/changed files.

---

## Implementation Amendments

### Amendment 1: Seed migration short_name fix + group section alphabetical sort
**Date:** 2026-04-23
**Reason:** Discovered during testing that the migration used `'WC 2026'` as the `short_name` lookup value but the actual DB record uses `'World Cup 26'`. Also found group-fallback sections (games without matchday that group by group_letter) were rendering in insertion order rather than alphabetical order.
**Change:**
- `migrations/20260423000001_seed_world_cup_matchdays.sql`: changed `WHERE short_name = 'WC 2026'` to `WHERE short_name = 'World Cup 26'`
- `app/components/games-list-with-scroll.tsx`: added `.sort()` to `gameSections` that orders `group-*` sections alphabetically by `sectionKey` while preserving insertion order for matchday/playoff sections

### Amendment 2: Playoff round name localization (unplanned post-implementation fix)
**Date:** 2026-04-23
**Reason:** After implementation, it was discovered that playoff stage separator labels and game card stage labels were always showing English round names even when the UI language was set to Spanish. The `round_name_i18n` JSONB field existed on `tournament_playoff_rounds` (added in Story #157) but was not being fetched or applied.
**Change:**
- `app/db/game-repository.ts`: added `'tournament_playoff_rounds.round_name_i18n'` to the `playoffStage` subquery `.select()` arrays in `getAllTournamentGames` and related queries
- `app/definitions.ts`: added `round_name_i18n?: Record<string, string> | null` to the `playoffStage` field of `ExtendedGameData`
- `app/components/unified-games-page.tsx`: added `getLocale()` fetch and `applyLocalization` call to replace `round_name` with the locale-appropriate value before passing games to the client
- `app/components/tournament-page/public-games-page.tsx`: same treatment as `unified-games-page.tsx` for the unauthenticated view

### Amendment 3: demo-data.ts updated for new GameTable field
**Date:** 2026-04-23
**Reason:** Adding `matchday` to `GameTable` required updating `DEMO_GAMES` objects to satisfy TypeScript exhaustiveness checks.
**Change:** `app/components/onboarding/demo/demo-data.ts`: added `matchday: null` to all 4 demo game objects.

## Validation

1. Run migration on local DB (with user permission)
2. Seed `matchday` values for a few test games
3. `npm run build` — no TypeScript errors
4. `npm run lint` — no ESLint issues
5. `npm run test` — all tests pass, coverage ≥ 80% on changed files
6. Vercel Preview — manually verify:
   - Stage separators appear between matchday groups
   - Stage label appears on each game card
   - Clicking stage label applies the correct filter
   - Dashboard game cards show static stage label (no click effect)
