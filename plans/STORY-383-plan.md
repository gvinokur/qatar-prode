# Plan: Hub Navigation Unification and Penalty Winner Indicators (#383)

## Story Context

**Issue:** [#383](https://github.com/gvinokur/qatar-prode/issues/383)
**Branch:** `feature/story-383`
**Worktree:** `/Users/gvinokur/Personal/qatar-prode-story-383`

### Problem
1. The Recent Results widget renders all 10 games at once — too tall on mobile.
2. Its static-list pattern differs from the Action Center's horizontal carousel.
3. Neither widget shows penalty shootout details, so users can't see how a tied playoff was decided.

### Objective
1. Recent Results → 5-item vertical carousel with up/down arrows
2. Action Center → single-card view with vertical arrow navigation (unified pattern)
3. Add penalty score format `HomeTeam Score (Pen)–(Pen) Score AwayTeam` with winner bolded
4. Surface penalty winner in prediction feedback subtext

---

## Acceptance Criteria

- [ ] Recent Results: shows 5 items at a time; up/down arrows navigate; arrows disabled at boundaries
- [ ] Action Center: one card at a time with vertical arrow nav; arrows disabled at boundaries
- [ ] Penalty games: score line = `**Winner** Score (WinPen)–(LosePen) Score Loser`
- [ ] Correct penalty prediction subtext: "Correct prediction • Your prediction: 1–1 • Penalty winner: Spain"
- [ ] Incorrect penalty prediction subtext: "Your prediction: 1–1 • Predicted penalty winner: France"
- [ ] No looping; English + Spanish translations for new keys

---

## Technical Approach

### Wave 1 — Data Layer (parallel tasks)

**T1: `app/db/game-repository.ts`**
- Add 4 fields to `RecentGameForDashboard`: `homePenaltyScore`, `awayPenaltyScore`, `userHomePenaltyWinner`, `userAwayPenaltyWinner`
- Extend `findRecentGamesForDashboard` SELECT: `game_results.home_penalty_score`, `game_results.away_penalty_score`, `game_guesses.home_penalty_winner`, `game_guesses.away_penalty_winner`

**T2: `app/actions/hub-actions.ts`**
- Add same 4 fields to `RecentGameResultItem`
- Map them in the `gameItems` mapper inside `getRecentResultsData`

**T3: Translations (`locales/en/hub.json`, `locales/es/hub.json`)**
- Add under `recentResults`:
  ```
  "correctResultWithPenaltyWinner": "Correct prediction • Your prediction: {home}–{away} • Penalty winner: {team}"
  "yourGuessWithPenaltyPrediction": "Your prediction: {home}–{away} • Predicted penalty winner: {team}"
  ```
  Spanish equivalents in `es/hub.json`.

### Wave 2 — Components (parallel, after Wave 1)

**T4: `app/components/tournament-hub/recent-results-widget.tsx`**

*`GameItem` changes:*
- Compute `hasPenalties = item.homePenaltyScore !== null && item.awayPenaltyScore !== null`
- When `hasPenalties`: render `<b>WinnerName</b> Score (HomePen)–(AwayPen) Score LoserName`
  - `homeWins = item.homePenaltyScore! > item.awayPenaltyScore!`
  - Bold tag on the winning side's name
- Update `subtext` logic when `hasPenalties`:
  - `isCorrect` + has user penalty winner → use `correctResultWithPenaltyWinner` key, passing `team` = winning team name
  - `!isCorrect` + `item.userHomePenaltyWinner || item.userAwayPenaltyWinner` → use `yourGuessWithPenaltyPrediction`, passing `team` = predicted winner

*`RecentResultsWidget` changes:*
- `const [startIndex, setStartIndex] = useState(0)`
- `const maxIndex = Math.max(0, recentGames.length - 5)`
- `const visibleGames = recentGames.slice(startIndex, startIndex + 5)`
- Wrap content in `<Box sx={{ display: 'flex', gap: 1 }}>`:
  - Left: games list (existing, but over `visibleGames`)
  - Right (only when `recentGames.length > 5`): vertical nav column
    - Up `IconButton` (disabled at `startIndex === 0`)
    - 3-dot position indicator
    - Down `IconButton` (disabled at `startIndex === maxIndex`)

**T5: `app/components/tournament-hub/action-center-carousel.tsx`**
- `const [visibleIndex, setVisibleIndex] = useState(0)`
- Replace `ScrollShadowContainer` block with:
  ```tsx
  <Box sx={{ display: 'flex', gap: 1 }}>
    <Box sx={{ flex: 1 }}>
      {data.games[visibleIndex] && (
        <FlippableGameCard game={data.games[visibleIndex]} ... />
      )}
    </Box>
    {data.games.length > 1 && (
      <VerticalNav current={visibleIndex} total={data.games.length} ... />
    )}
  </Box>
  ```
- Update `handleAutoAdvanceNext`: also `setVisibleIndex(i => Math.min(data.games.length - 1, i + 1))`
- Update `handleAutoGoPrevious`: also `setVisibleIndex(i => Math.max(0, i - 1))`
- Extract `VerticalNav` as a local component (same as Recent Results pattern):
  - `KeyboardArrowUpIcon` / `KeyboardArrowDownIcon` in bordered `IconButton`
  - 3 dots showing position

### Wave 3 — Tests

**T6: Unit tests** (update existing + add new)
- `hub-actions.test.ts`: mock returns penalty fields → assert they appear in result items
- `recent-results-widget.test.tsx`: 5-item limit, nav button states, penalty score format, penalty subtext
- `action-center-carousel.test.tsx`: single card shown, VerticalNav presence/absence, nav button states

---

## Visual Prototypes

### Recent Results Widget
```
┌─────────────────────────────────────────┐
│ RECENT GAMES                            │
├──────────────────────────────────┬──────┤
│  ✓  Spain 1 (4)–(2) 1 France    │  ▲   │
│     Correct • 1–1 • Pen: Spain  │      │
│  ───────────────────────────────│  ●   │
│  ✓  Argentina 2–1 Spain         │      │
│     Exact result                │  ·   │
│  ───────────────────────────────│      │
│  ✗  Italy 1 (3)–(5) 1 Germany  │  ·   │
│     Predicted: 2–1              │      │
│  ───────────────────────────────│  ▼   │
│  ✓  France 3–0 Netherlands      └──────┤
│  ───────────────────────────────────── │
│  ✗  Italy 2–1 Spain                    │
├────────────────────────────────────────┤
│        [View Full Statistics]          │
└────────────────────────────────────────┘
```

### Action Center (after)
```
┌─────────────────────────────────────────┐
│       ACTION CENTER · 2/64 ▶            │
│     Your predictions earn points        │
├──────────────────────────────────┬──────┤
│  24 Apr 19:00 · Closes in 5h 44m│  ▲   │
│  ─────────────────────────────── │      │
│       Your Prediction            │  ●   │
│    Italy     1 – 2     USA       │      │
│  ─────────────────────────────── │  ·   │
│  Big Stadium · Third Place       │      │
│                                  │  ▼   │
└──────────────────────────────────┴──────┘
│  [QT: 12/32]  [Awards: 4/8]  [Games]   │
└─────────────────────────────────────────┘
```

---

## Mid-Level Design

### Call Graph Changes

No new cross-layer flows. Penalty fields extend the existing Recent Results read path:
- `findRecentGamesForDashboard` → `getRecentResultsData` → `RecentResultsWidget` → `GameItem`

### `app/db/game-repository.ts` *(modified)*

**Changed interface:**

- **`RecentGameForDashboard`**: *(was: 12 fields)* Add `homePenaltyScore: number | null`, `awayPenaltyScore: number | null`, `userHomePenaltyWinner: boolean | null`, `userAwayPenaltyWinner: boolean | null`

**Changed functions:**

- **`findRecentGamesForDashboard(userId: string, tournamentId: string, limit: number)`**: `Promise<RecentGameForDashboard[]>`
  Extend SELECT with four new columns; extend return mapper to include them (null-coalesced).
  Tests:
  - maps `homePenaltyScore` and `awayPenaltyScore` from `game_results` when present
  - maps `userHomePenaltyWinner` and `userAwayPenaltyWinner` from `game_guesses` when present
  - returns `null` for all four penalty fields when the joined rows have no penalty data

### `app/actions/hub-actions.ts` *(modified)*

**Changed interface:**

- **`RecentGameResultItem`**: *(was: 10 fields)* Add `homePenaltyScore: number | null`, `awayPenaltyScore: number | null`, `userHomePenaltyWinner: boolean | null`, `userAwayPenaltyWinner: boolean | null`

**Changed functions:**

- **`getRecentResultsData(tournamentId: string, locale: Locale)`**: `Promise<RecentResultsData>`
  Map the four new penalty fields from repository result into `gameItems`.
  Calls: `getLoggedInUser`, `findRecentGamesForDashboard`, `findTeamInTournament`, `applyLocalizationBatch`
  Tests:
  - includes `homePenaltyScore` and `awayPenaltyScore` in returned `RecentGameResultItem`
  - includes `userHomePenaltyWinner` and `userAwayPenaltyWinner` in returned `RecentGameResultItem`
  - returns `null` penalty fields when repository data has null penalties
  - handles partial penalty data where only one side has penalty scores

### `app/components/tournament-hub/recent-results-widget.tsx` *(modified)*

**Changed components:**

- **`GameItem({ item }: { item: RecentGameResultItem })`**:
  Derive `hasPenalties`, `homeWins`. Conditionally render penalty score format and update `subtext` to use penalty-specific i18n keys.
  Calls: `useTranslations('hub.recentResults')`
  Tests:
  - renders `(homePen)–(awayPen)` in score line when penalty scores are non-null
  - bolds home team name when `homePenaltyScore > awayPenaltyScore`
  - bolds away team name when `awayPenaltyScore > homePenaltyScore`
  - uses `correctResultWithPenaltyWinner` key when correct and `hasPenalties`
  - uses `yourGuessWithPenaltyPrediction` key when user had penalty prediction and was incorrect
  - falls back to standard score format when penalty scores are null

- **`RecentResultsWidget({ data, statsHref }: RecentResultsWidgetProps)`**:
  Add `startIndex` state. Slice to 5 visible. Conditionally render vertical nav when `recentGames.length > 5`.
  Tests:
  - renders at most 5 `GameItem` rows when data has 10 games
  - up `IconButton` is disabled when `startIndex === 0`
  - down `IconButton` is disabled when `startIndex === recentGames.length - 5`
  - clicking down increments `startIndex` by 1
  - clicking up decrements `startIndex` by 1
  - does not render nav buttons when there are 5 or fewer games
  - renders empty state when `recentGames.length === 0`

### `app/components/tournament-hub/action-center-carousel.tsx` *(modified)*

**New local components:**

- **`VerticalNav({ current, total, onUp, onDown })`**: `JSX.Element`
  Up/down `IconButton` with bordered style; 3-dot position indicator between them. Mirrors the same pattern in Recent Results.
  Tests:
  - up button disabled when `current === 0`
  - down button disabled when `current === total - 1`
  - calls `onUp` on up click
  - calls `onDown` on down click

**Changed components:**

- **`ActionCenterCarousel({ data, tournamentId, locale }: ActionCenterCarouselProps)`**:
  Add `visibleIndex` state. Replace `ScrollShadowContainer` with flex row: single `FlippableGameCard` for `data.games[visibleIndex]` + optional `VerticalNav`. Update auto-advance handlers to also update `visibleIndex`.
  Tests:
  - renders exactly one `FlippableGameCard` at a time
  - shows `VerticalNav` when `data.games.length > 1`
  - does not show `VerticalNav` when `data.games.length === 1`
  - down button is disabled at `visibleIndex === data.games.length - 1`
  - up button is disabled at `visibleIndex === 0`
  - renders empty state when `data.games.length === 0`

---

## Open Questions

None — requirements are fully specified by mockups and acceptance criteria.

---

## Validation Checklist

- [ ] `npm run test` — all pass, ≥80% coverage on changed files
- [ ] `npm run lint` — 0 ESLint errors
- [ ] `npm run build` — succeeds
- [ ] No new SonarCloud issues
- [ ] Vercel Preview: Recent Results shows 5 items, nav arrows work
- [ ] Vercel Preview: Action Center shows 1 card with vertical nav
- [ ] Vercel Preview: Playoff shootout game shows penalty format with bold winner
