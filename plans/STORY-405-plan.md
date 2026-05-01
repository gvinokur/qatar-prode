# Story 405: Rules UI/UX Improvements and Bug Fixes

## Story Context
**Issue:** #405 — [Story] Rules UI/UX improvements and bug fixes
**Mockup:** `mockups/rules-redesign-mockup-v3.html`
**Project:** UX Audit 2026

## Problem / Background
The current Rules component (`app/components/tournament-page/rules.tsx`) has four bugs/UX issues:

1. **Scoring confusion** — Goal Difference shows "+N extra points" instead of the incremental "+1 more (2 total)" format; Exact Score does the same. The mockup demands "+1 / +1 / +1 = 3" hierarchy.
2. **Wrong placement** — `boostTiming` ("Boosts can only be applied before the match starts") lives in the _Scoring_ section but belongs in _Deadlines_.
3. **Hardcoded 5-day offset** — `rules/page.tsx` computes `LOCK_OFFSET_MS = 5 * 24 * 60 * 60 * 1000` but the system constant `PREDICTION_LOCK_OFFSET_MS` (in `app/utils/prediction-constants.ts`) is 2 days. The fallback text in translations also says "5 days".
4. **Flat list** — All rules are in one undifferentiated list; the mockup wants four grouped categories.

## Acceptance Criteria (from issue)
- [ ] Incremental scoring hierarchy: Outcome +1 → Goal Diff +1 (2 total) → Exact +1 (3 total)
- [ ] Zero-point rules with Cancel icon: wrong winner, team fails to qualify
- [ ] Boosts use EmojiEvents icon with silver/gold colors + X2/X3 chips
- [ ] Rules grouped: Matches | Qualified Teams | Awards & Champion | Tournament Logic
- [ ] Each category split: Scoring / Deadlines / General
- [ ] Icons: CheckCircle (scoring), Schedule (deadlines), Info (general)
- [ ] Lock date uses `PREDICTION_LOCK_OFFSET_MS` (2 days) everywhere
- [ ] Hub games card: boost timing moved to Deadline section

## Visual Prototype

### Full-page Rules Layout

```
┌────────────────────────────────────────────────┐
│  Tournament Rules                              │
│  Understand the point system and lock windows  │
├────────────────────────────────────────────────┤
│                                                │
│  ⚽ Matches                                    │
│  ┌─────────────────────────────────────────┐  │
│  │ SCORING                                 │  │
│  │ ✓ Correct Winner or Draw          +1   │  │
│  │ ✓ Goal Difference (2 total pts)   +1   │  │
│  │ ✓ Exact Score (3 total pts)       +1   │  │
│  │ ✗ Wrong Winner / Ties              0   │  │
│  │ 🏆 Silver Boost (x2)              X2   │  │  ← silver color
│  │ 🏆 Golden Boost (x3)              X3   │  │  ← gold color
│  ├─────────────────────────────────────────┤  │
│  │ DEADLINES                               │  │
│  │ 🕐 Predictions lock 1 hour before kickoff│ │
│  │ 🕐 Boosts must be applied before kickoff│  │
│  └─────────────────────────────────────────┘  │
│                                                │
│  ⎇  Qualified Teams  (AccountTree bracket icon)│
│  ┌─────────────────────────────────────────┐  │
│  │ SCORING                                 │  │
│  │ ✓ Correct qualified team           +1   │  │
│  │ ✓ Exact position (2 total pts)     +1   │  │
│  │ ✗ Team fails to qualify             0   │  │
│  ├─────────────────────────────────────────┤  │
│  │ DEADLINES                               │  │
│  │ 🕐 Qualifiers lock on June 16 (2 days) │  │
│  └─────────────────────────────────────────┘  │
│                                                │
│  🏆 Awards & Champion                         │
│  ┌─────────────────────────────────────────┐  │
│  │ SCORING                                 │  │
│  │ ✓ Champion                         +5   │  │
│  │ ✓ Runner-up                        +3   │  │
│  │ ✓ Third Place                      +1   │  │
│  │ ✓ Individual Award                 +3   │  │
│  ├─────────────────────────────────────────┤  │
│  │ DEADLINES                               │  │
│  │ 🕐 Picks lock on June 16 (2 days)      │  │
│  └─────────────────────────────────────────┘  │
│                                                │
│  🌐 Tournament Logic                          │
│  ┌─────────────────────────────────────────┐  │
│  │ GENERAL                                 │  │
│  │ ℹ Only one active prediction per user  │  │
│  │ ℹ Same prediction used in all groups  │  │
│  │ ℹ Third-place only if match exists    │  │
│  └─────────────────────────────────────────┘  │
└────────────────────────────────────────────────┘
```

### Hub Sidebar Card / GamesInfoWidget (compact, no examples)
The `GamesInfoWidget` ("sidebar card" on the hub) shows scoring rules and a deadline box.
Same category layout concept but compact — no expandable examples, boost timing moves to the Deadline box.

## Technical Approach

### Files Modified

| File | Change |
|------|--------|
| `app/components/tournament-page/rules.tsx` | Major redesign — categorized layout, new icons, point chips |
| `app/[locale]/tournaments/[id]/rules/page.tsx` | Fix: use `PREDICTION_LOCK_OFFSET_MS` instead of hardcoded 5-day value |
| `app/utils/scoring-rules-utils.ts` | Move `boostTiming` from `matches` scoring to a new deadline entry |
| `locales/en/rules.json` | Add new keys: section labels, zero-point rules, boost deadline, tournament logic |
| `locales/es/rules.json` | Same — Spanish translations for new keys |
| `app/components/tournament-page/rules.test.tsx` | Update tests for new structure |

### No New Files
All changes are in-place refactors. No new components are extracted (the `RuleCategory` pattern stays internal to `rules.tsx`).

### Key Design Decisions

**1. `rules.tsx` stays `'use client'`** — it uses `useTranslations`, `useState`, `useTheme`. The full-page variant keeps expandable example blocks (the existing `rules-examples/` directory is unchanged).

**2. No changes to `rules-examples/`** — existing 13 example components are preserved and still rendered via expandable Collapse in `fullpage` mode. The new design wraps each scoring rule row in a clickable expander (same as today) just with different icon/chip decoration.

**3. `scoring-rules-utils.ts` gets `boostDeadline` field** — rather than embedding `boostTiming` in the scoring array (where `GamesInfoWidget` shows it in the scoring box), we add it to a new `matchesDeadline` string field. The hub widget then renders it in the Deadline box.

**4. Lock offset bug** — one-line change in `rules/page.tsx`: import `PREDICTION_LOCK_OFFSET_MS` from `prediction-constants.ts` and delete the local `LOCK_OFFSET_MS` constant.

**5. Translation fallback** — `lockDateFallback` in both locale files updated from "5 days" → "2 days" to match the actual system constant.

## Mid-Level Design

### Call Graph Changes
No new cross-layer flows. Changes are confined to existing component/utility layer. `scoring-rules-utils.ts` type changes may propagate to callers that read `ScoringRulesBySection`.

**Modified flows:**
- **Hub widget rendering** — `GamesInfoWidget` receives updated `ScoringRulesBySection` (with `boostTiming` removed from `matches`) and new optional `matchesDeadline` field; renders boost deadline in the Deadline box.

### `app/utils/scoring-rules-utils.ts` *(modified)*

**Changed types:**

- **`ScoringRulesBySection`** interface gains one field:
  ```ts
  matchesBoostDeadline?: string  // boost timing text, only set when boosts enabled
  ```
  The `matches` array no longer includes `boostTiming`.

**Changed functions:**

- **`getRulesBySection(config, tRules)`**: `ScoringRulesBySection`
  Removes `boostTiming` from `matches` array. When boosts enabled, populates `matchesBoostDeadline` with `tRules('boostTiming')`.
  Calls: (pure utility, no project calls)
  Tests:
  - matches array does NOT contain boostTiming when boosts disabled
  - matches array does NOT contain boostTiming when boosts enabled
  - matchesBoostDeadline is undefined when boosts disabled
  - matchesBoostDeadline is set to boostTiming string when boosts enabled

### `app/components/tournament-hub/games-info-widget.tsx` *(modified)*

**Changed functions:**

- **`GamesInfoWidget({ ..., scoringRules })`**: `JSX.Element`
  Renders `scoringRules.matchesBoostDeadline` inside the Deadline box when present.
  Calls: getTranslations
  Tests:
  - renders boost deadline text inside deadline box when matchesBoostDeadline is set
  - does not render boost deadline text when matchesBoostDeadline is undefined
  - renders scoring rules list without boost timing text when matchesBoostDeadline is absent

### `app/components/tournament-page/rules.tsx` *(modified)*

**Changed functions:**

- **`Rules({ expanded, fullpage, scoringConfig, tournamentId, isActive, lockDate })`**: `JSX.Element`
  Replaces the flat scoring list + constraints list with four `RuleCategory` sections.
  Internal helper `RuleCategory` renders a Paper with Scoring/Deadlines/General subsections.
  Internal helper `RuleItem` renders icon + label + point chip.
  Point chips: `+N` in success color for scoring; `0` in error color for zero-point rules; `X2`/`X3` in silver/gold for boosts.
  Icons: CheckCircle (scoring hits), Cancel (zero-point), EmojiEvents (boosts), Schedule (deadlines), Info (general).
  In `fullpage` mode: each scoring rule row is still clickable to expand the example Collapse (same as today).
  In card mode: same category layout, expandable via top-level toggle; no example expansion.
  Calls: useTranslations, useLocale, useTheme, useState
  Tests:
  - renders four category headings: Matches, Qualified Teams, Awards & Champion, Tournament Logic
  - renders SCORING subsection label within Matches category
  - renders DEADLINES subsection label within Matches category
  - renders zero-point row with Cancel icon text for wrong outcome
  - renders boost rows only when max_silver_games or max_golden_games > 0
  - boostTiming text appears in DEADLINES subsection (not SCORING)
  - lockDate string appears in QT deadline text
  - fullpage mode shows expandable example for winnerDraw rule
  - card mode does not show expand arrows for individual rules

### `app/[locale]/tournaments/[id]/rules/page.tsx` *(modified)*

**Changed functions:**

- **`TournamentRulesPage(props)`**: `Promise<JSX.Element>`
  Removes local `LOCK_OFFSET_MS` constant; imports `PREDICTION_LOCK_OFFSET_MS` from `app/utils/prediction-constants.ts`.
  Calls: findTournamentByIdCached, findFirstGameInTournament, getTranslations, getLocale, buildBreadcrumbListJsonLd, buildTournamentMetadata
  Tests:
  - passes a lockDate computed from firstGame.game_date + PREDICTION_LOCK_OFFSET_MS (2 days) to Rules component
  - passes lockDate as undefined when no first game exists
  - redirects to /es when tournament is not found

## Translation Keys (New / Changed)

### `locales/en/rules.json` additions

```json
"sections": {
  "scoring": "Points Calculation",       // existing
  "constraints": "General Conditions",   // existing — keep for backward compat
  "matches": "Matches",                  // NEW
  "qualifiedTeams": "Qualified Teams",   // NEW
  "awardsChampion": "Awards & Champion", // NEW
  "tournamentLogic": "Tournament Logic", // NEW
  "deadlines": "Deadlines",              // NEW subsection label
  "general": "General"                   // NEW subsection label
},
"rules": {
  // existing keys unchanged (winnerDraw, goalDifference, exactScore, etc.)
  // NEW zero-point rules:
  "wrongOutcome": "Wrong Winner, Ties not predicted, or disqualified teams",
  "teamFailedToQualify": "Team fails to qualify",
  // NEW tournament logic general rules:
  "sharedPrediction": "Same prediction is used across all groups you join",
  "thirdPlaceCondition": "Third-place rules only apply if the tournament has a 3rd place match"
},
"constraints": {
  // existing keys unchanged
  "boostDeadline": "Boosts can only be applied before the match starts",  // NEW (moved from rules.boostTiming)
  "lockDateFallback": "2 days after the tournament starts"   // CHANGED from "5 days"
}
```

### `locales/es/rules.json` additions — same structure in Spanish.

**Note:** `rules.boostTiming` key is retained (not deleted) to avoid breaking any other callers. `scoring-rules-utils.ts` will stop referencing it; `rules.tsx` will use `constraints.boostDeadline` instead.

## Implementation Steps

### Wave 1 — Bug fix (no visual change)
1. **`rules/page.tsx`**: Replace `LOCK_OFFSET_MS` with `PREDICTION_LOCK_OFFSET_MS`.
2. **Both locale files**: Change `lockDateFallback` from "5 days" → "2 days".

### Wave 2 — Utility refactor + hub alignment
3. **`scoring-rules-utils.ts`**: Add `matchesBoostDeadline` field; remove `boostTiming` from `matches` array.
4. **`games-info-widget.tsx`**: Render `matchesBoostDeadline` in the Deadline box.
5. **`games-info-widget` tests**: Update/add tests for boost deadline rendering.

### Wave 3 — Rules component redesign
6. **Both locale files**: Add all new translation keys.
7. **`rules.tsx`**: Full redesign — categorized layout with RuleCategory + RuleItem helpers; preserve fullpage expandable examples.
8. **`rules.test.tsx`**: Update tests for new structure.

## Testing Strategy

- **Unit tests** cover: `scoring-rules-utils.ts` (boostTiming removal), `GamesInfoWidget` (boost deadline in deadline box), `Rules` (four categories, icons, zero-point rows, boostTiming in Deadlines not Scoring), `TournamentRulesPage` (lock offset, redirect, undefined lockDate).
- **Test utilities**: Use `renderWithTheme` for all component tests. Mock `useTranslations`/`getTranslations` via the existing vitest mock at `__mocks__/next-intl`. Use `testFactories.scoringConfig()` for scoring config objects; build `ScoringRulesBySection` inline in tests.
- **Visual verification**: Open the app on the rules page and hub to confirm layout matches mockup.
- **i18n**: Test in both `es` and `en` locales.
- **Edge cases**:
  - Boosts disabled (no silver/gold rows, no boostDeadline in deadline box)
  - `lockDate` undefined → fallback text shows
  - `scoringConfig` with `thirdPlace = 0` (still renders row but 0 points)
  - `fullpage=false` → no expandable example arrows on individual rule rows

## Quality Gate Considerations
- No new SonarCloud issues (0 tolerance)
- ≥80% coverage on changed files
- No unused imports
