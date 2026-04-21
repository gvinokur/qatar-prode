# STORY-349 Plan: Pre-tournament Hub Action Center Redesign for New Users

## Story Context

**Issue:** [#349 — Pre-tournament Hub: Action Center redesign for new users](https://github.com/gvnt/qatar-prode/issues/349)

**Problem:** The current Pre-tournament Hub is designed for users who have already made predictions. New or "incomplete" users (< 30% match predictions OR < 90% bracket/awards completed) need a clearer, instructional layout that shows them what to do, how scoring works, and how to engage with friend groups.

**Mockup:** `mockups/pre-tournament-action-center-mockup-v2.html` (2-state toggle: "incomplete" vs "complete")

---

## Acceptance Criteria

- [x] Users with low prediction progress see a prioritized "Action Center" layout
- [x] A prominent Tutorial/Onboarding CTA is displayed for new users
- [x] The "Opening Game" card is hidden for incomplete users (achieved by rendering a different component entirely)
- [x] Display 3 main prediction tracks (Matches, Qualified Teams, Awards) as large instructional cards
- [x] Each track card includes a concise summary of its scoring rules
- [x] Each track card shows a progress bar and a clear CTA to start/continue predicting
- [x] The "Friend Groups" empty state includes a "Learn more" link to the group explanation page
- [x] "Recent Results" section is hidden for users in this state
- [x] Feature works in both English and Spanish (Argentine)

---

## Incomplete User Definition

A user is considered "incomplete" when **all 3** of these conditions are true:
1. Pre-tournament phase: `!data.tournamentHasStarted`
2. Predictions window is open: `data.qtAndAwardsOpen` (tournament is active and first game date set)
3. Low progress on any track:
   - `gamesProgress < 30` (< 30% of match predictions done), OR
   - `awardsProgress < 90` (< 90% of awards/podium done), OR
   - `qtProgress < 90` (< 90% of qualified teams predicted)

Edge cases: totals of 0 treated as "complete" (100%) to avoid false positives when sections aren't configured.

---

## Technical Approach

### Architecture: Server-side routing between "incomplete" and "complete" views

**Key insight:** We already have all the progress data in `ActionCenterData` (returned by `getActionCenterGames`). We lift the fetch to the page level, compute `isIncompleteUser` once, and use it to:
1. Route `TournamentHubActionCenter` to render the new `PreTournamentNewUserActionCenter` component
2. Conditionally hide `TournamentHubRecentResults`

**Flow (new):**
```
TournamentHubPage (page.tsx)
  ├── [fetches ActionCenterData once]
  ├── [computes isIncompleteUser from data]
  ├── TournamentHubActionCenter(data={prefetched})
  │   ├── if isIncompleteUser → PreTournamentNewUserActionCenter (SERVER)
  │   │   ├── PreTournamentCountdown (Client, reused)
  │   │   ├── TutorialCard (static JSX)
  │   │   └── 3 × PredictionTrackCard (static JSX)
  │   └── else → ActionCenterCarousel (Client, unchanged)
  ├── {!isIncompleteUser && TournamentHubRecentResults}  ← hidden for incomplete
  └── TournamentHubLeaderboardPeek (unchanged)
```

---

## Files to Create

### NEW: `app/components/tournament-hub/pre-tournament-new-user-action-center.tsx`
Server Component. The full "incomplete user" Action Center layout:
- Countdown (reuses `PreTournamentCountdown` client component)
- Tutorial CTA card (delegates to `TutorialCTACard` client component)
- 3 prediction track cards (Matches, Qualified Teams, Awards) with description, scoring rules, LinearProgress, and CTA link

### NEW: `app/components/tournament-hub/tutorial-cta-card.tsx`
Client Component (`'use client'`). Small card that renders the "New to Prode?" CTA. Contains `useState(false)` for dialog open state. On button click, sets state to true and renders `OnboardingDialogClient` (existing) with `initialOpen={true}` + `onClose` handler. Follows the same pattern as `user-actions.tsx` which also uses `OnboardingDialogClient` conditionally.

### NEW: `app/utils/scoring-rules-utils.ts`
Pure utility with `getRulesBySection(config: ScoringConfig, tRules: (key: string, params?) => string): ScoringRulesBySection`. Organizes the existing scoring rule labels (from the `rules.rules` i18n namespace, same keys used by `rules.tsx`) into three sections: `matches`, `qualifiedTeams`, `awards`. Matches section also includes boost rules when `max_silver_games > 0` or `max_golden_games > 0`. Works in both server (via `getTranslations`) and client (via `useTranslations`) contexts since it takes the translator as a parameter.

```typescript
export interface ScoringRulesBySection {
  matches: string[]       // winnerDraw, exactScore, optional boost rules
  qualifiedTeams: string[] // qualifiedTeam, exactPosition
  awards: string[]        // champion, runnerUp, thirdPlace, individualAwards
}
```

---

## Files to Modify

### `app/actions/hub-actions.ts`
- Add exported utility `computeIsIncompleteUser(data: ActionCenterData): boolean`
- Add `scoringConfig: ScoringConfig` to `ActionCenterData` interface
- Populate `scoringConfig` from tournament data in `getActionCenterGames()`

### `app/[locale]/tournaments/[id]/page.tsx`
- Import `getActionCenterGames` and `computeIsIncompleteUser`
- Fetch `ActionCenterData` at page level, pass to `TournamentHubActionCenter` via `data` prop
- Conditionally hide `TournamentHubRecentResults` when `isIncompleteUser`

### `app/components/tournament-hub/tournament-hub-action-center.tsx`
- Add optional `data?: ActionCenterData` prop (falls back to fetching if not provided)
- Call `computeIsIncompleteUser(data)`
- Render `PreTournamentNewUserActionCenter` or `ActionCenterCarousel` based on result

### `app/components/tournament-hub/social-hub-card.tsx`
Add a "Learn more" text link below the Create/Find buttons, linking to the friend-groups page.

### `locales/en/hub.json` + `locales/es/hub.json`
Add `newUser` section with strings for tutorial card (title, subtitle, CTA) and "learn more" link. **Scoring rule strings are NOT added here** — they come from the existing `rules.rules` i18n namespace dynamically via `getRulesBySection()`.

### `docs/code-structure/components/components-tournament-hub.md`
Update entries for `tournament-hub-action-center.tsx` and `social-hub-card.tsx`; add entry for `pre-tournament-new-user-action-center.tsx`.

---

## Visual Prototype

### Incomplete User Layout (pre-tournament phase)

```
┌────────────────────────────────────────────┐
│  [Hourglass] ⏳  COUNTDOWN                  │
│     51 Días   21 Horas   53 Min            │
│     Para que empiece el Mundial 2026        │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│ [?] ¿Nuevo en el Prode?                    │
│     Aprendé cómo sumar puntos y ganar.     │
│                          [Ver Tutorial →]  │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│ ⚽  Partidos                    12%  12/104│
│ Pronosticá el resultado de los 104          │
│ partidos del mundial.                       │
│ ┌──────────────────────────────────────┐   │
│ │ REGLAS: 1pto por acierto Gan/Emp,    │   │
│ │ +2 extra por resultado exacto.       │   │
│ └──────────────────────────────────────┘   │
│ [████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 12%│
│ [Empezar a Pronosticar]                    │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│ [AccountTreeIcon]  Equipos Clasificados  0%│
│ Armá tu llave. Elegí quiénes pasan         │
│ de ronda y quién gana la final.             │
│ ┌──────────────────────────────────────┐   │
│ │ REGLAS: (from rules.rules i18n)      │   │
│ └──────────────────────────────────────┘   │
│ [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 0%│
│ [Pronosticar quien avanza]                 │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│ 🏆  Premios                      14%  1/7  │
│ Elegí al Campeón, Goleador,                │
│ Mejor Arquero y más.                        │
│ ┌──────────────────────────────────────┐   │
│ │ REGLAS: 1pto por cada premio correcto │   │
│ │ (Goleador, Guante de Oro, etc).      │   │
│ └──────────────────────────────────────┘   │
│ [██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 14%│
│ [Elegir Premios]                           │
└────────────────────────────────────────────┘

--- (TournamentHubLeaderboardPeek — unchanged) ---

Empty friend groups state (SocialHubCard):
┌────────────────────────────────────────────┐
│         👥 ¡No juegues solo!               │
│  La mejor manera de disfrutar el Mundial   │
│  es en grupo. Creá el tuyo.                │
│    [Crear Grupo]   [Encontrar Público]     │
│    Más información sobre los grupos        │  ← NEW
└────────────────────────────────────────────┘
```

When all tracks are 100%: show "Revisar" (Review) instead of "Empezar" (CTA), button style changes to outlined.

---

## Mid-Level Design

### Call Graph Changes

**Modified flows:**
- **Flow 1 (Tournament Hub page)** — `TournamentHubPage` now fetches `ActionCenterData` directly and computes `isIncompleteUser`, passing pre-fetched data to `TournamentHubActionCenter` and conditionally suppressing `TournamentHubRecentResults`.
- **Pre-tournament routing** — `TournamentHubActionCenter` routes to `PreTournamentNewUserActionCenter` (new) when `computeIsIncompleteUser(data) === true`.

### `app/utils/scoring-rules-utils.ts` *(new)*

**New functions:**

- **getRulesBySection(config: ScoringConfig, tRules: (key: string, params?: Record<string, unknown>) => string)**: `ScoringRulesBySection`
  Pure utility. Organizes existing rule labels (using the same keys as `rules.tsx`'s `getRules()`) into three sections. `matches` = winnerDraw + exactScore + optional boost entries (same condition as `rules.tsx`: `max_silver_games > 0 || max_golden_games > 0`). `qualifiedTeams` = qualifiedTeam + exactPosition. `awards` = champion + runnerUp + thirdPlace + individualAwards.
  Calls: *(none — pure function, takes translator as param)*
  Tests:
  - returns correct matches rules (winnerDraw + exactScore) from scoring config values
  - includes silver boost rule in matches when max_silver_games > 0
  - includes golden boost rule in matches when max_golden_games > 0
  - excludes boost rules when both max values are 0
  - returns correct qualifiedTeams rules (qualifiedTeam + exactPosition)
  - returns correct awards rules (all 4 items)
  - boost timing rule included in matches when either boost is enabled

### `app/actions/hub-actions.ts` *(modified)*

**New functions:**

- **computeIsIncompleteUser(data: ActionCenterData)**: `boolean`
  Pure utility. Returns `true` when:  `!data.tournamentHasStarted && data.qtAndAwardsOpen && data.firstGameDate !== null` AND any track is below threshold (games < 30%, awards < 90% if awardsTotal > 0, qualifiers < 90% if qualifiersTotal > 0).
  Calls: *(none — pure function)*
  Tests:
  - returns false when tournament has already started
  - returns false when qtAndAwardsOpen is false
  - returns false when firstGameDate is null
  - returns true when gamesProgress < 30 (pre-tournament, open window)
  - returns true when awardsProgress < 90 (pre-tournament, open window)
  - returns true when qtProgress < 90 (pre-tournament, open window)
  - returns false when all tracks are at or above thresholds
  - returns false when awardsTotal is 0 (not available → treated as complete)
  - returns false when qualifiersTotal is 0 (not available → treated as complete)

**Changed interface:**

- **ActionCenterData** *(was: no scoringConfig field)*
  Add `scoringConfig: ScoringConfig` — populated from tournament data (fallback to `DEFAULT_SCORING` when tournament is null).

### `app/components/tournament-hub/tournament-hub-action-center.tsx` *(modified)*

**Changed functions:**

- **TournamentHubActionCenter({ tournamentId, locale, data? })**: `JSX.Element | null` *(was: no data prop)*
  [Server] If `data` prop is provided, uses it directly; otherwise calls `getActionCenterGames`. Returns `null` when `data.tournamentFinished`. Calls `computeIsIncompleteUser(data)`; when true and `!data.tournamentHasStarted && data.firstGameDate !== null`, renders `PreTournamentNewUserActionCenter`. Otherwise renders existing `ActionCenterCarousel`.
  Calls: getActionCenterGames (conditional), computeIsIncompleteUser
  Renders: PreTournamentNewUserActionCenter (new), ActionCenterCarousel (existing)
  Tests:
  - renders ActionCenterCarousel for complete user (all tracks above thresholds)
  - renders PreTournamentNewUserActionCenter for incomplete user pre-tournament
  - renders ActionCenterCarousel (not new user view) when tournament has started even if progress is low
  - returns null when tournamentFinished

### `app/components/tournament-hub/tutorial-cta-card.tsx` *(new)*

**New functions:**

- **TutorialCTACard()**: `JSX.Element`
  [Client] `'use client'`. Renders a Card with avatar icon, title + subtitle text, and a "View Tutorial" Button. Manages `const [open, setOpen] = useState(false)`. On button click sets open to true; renders `{open && <OnboardingDialogClient initialOpen={true} onClose={...} />}` — same pattern as `user-actions.tsx`.
  Calls: useTranslations
  Renders: OnboardingDialogClient (conditional)
  Tests:
  - renders tutorial title and subtitle
  - clicking the CTA button renders the OnboardingDialogClient
  - onClose callback resets open state (dialog disappears after close)

### `app/components/tournament-hub/pre-tournament-new-user-action-center.tsx` *(new)*

**New functions:**

- **PreTournamentNewUserActionCenter({ data, tournamentId, locale })**: `JSX.Element`
  [Server] Full "incomplete user" layout. Calls `getTranslations('hub')` and `getTranslations('rules.rules')`, then `getRulesBySection(data.scoringConfig, tRules)` to get per-section rule labels. Renders: (1) `PreTournamentCountdown` when `data.firstGameDate !== null`; (2) `TutorialCTACard`; (3) 3 `PredictionTrackCard` entries (matches, qualifiedTeams, awards) each with their section's `rules` array.
  Calls: getTranslations, getRulesBySection
  Renders: PreTournamentCountdown, TutorialCTACard, PredictionTrackCard
  Tests:
  - renders countdown when firstGameDate is set
  - does not render countdown when firstGameDate is null
  - renders tutorial card section
  - renders 3 track cards (matches, qualified-teams, awards sections visible)
  - matches track shows correct progress: predictedGames/totalGames
  - awards track shows correct progress: awardsCompleted/awardsTotal
  - qt track shows correct progress: qualifiersCompleted/qualifiersTotal
  - renders "Review" CTA variant when track is 100% complete
  - all track CTA links navigate to correct URLs

- **PredictionTrackCard(props)**: `JSX.Element` (server-compatible sub-component within the same file)
  Renders: icon, title, description, scoring rules list (dashed border box, one item per line), LinearProgress, CTA Button (Link).
  Props: `title`, `icon`, `description`, `rules: string[]` (pre-computed from `getRulesBySection`), `scoringLabel`, `progress` (0-100), `completed` (count), `total`, `cta`, `href`, `isComplete`
  Icon usage: `SportsSoccerIcon` for Matches, `AccountTreeIcon` for Qualified Teams (same as `action-center-carousel.tsx`), `EmojiEventsIcon` for Awards.
  Tests: covered by PreTournamentNewUserActionCenter tests above

### `app/components/tournament-hub/social-hub-card.tsx` *(modified)*

**Changed functions:**

- **SocialHubCard({ locale, tournamentId })**: `JSX.Element` *(was: 2 CTAs only)*
  Now also renders a text-variant Button "Learn more about groups" below the Create/Find buttons, linking to the friend-groups page.
  Calls: useTranslations
  Tests:
  - renders "Learn more" link below the main CTAs
  - "Learn more" link points to the friend-groups page URL
  - existing tests: create group and find group buttons unchanged

### i18n strings (new keys in `hub.json` `newUser` section)

**Note:** Scoring rule text is NOT added to `hub.json`. It comes from the existing `rules.rules` namespace dynamically via `getRulesBySection(config, tRules)`.

```json
"newUser": {
  "tutorial": {
    "title": "New to Prode?",
    "subtitle": "Learn how to earn points and win your friends' tournament.",
    "cta": "View Tutorial"
  },
  "tracks": {
    "matches": {
      "title": "Matches",
      "description": "Predict the result of all {total} tournament matches.",
      "cta": "Start Predicting",
      "ctaReview": "Review"
    },
    "qualifiedTeams": {
      "title": "Qualified Teams",
      "description": "Build your bracket. Choose who advances from each group and who wins the final.",
      "cta": "Predict who advances",
      "ctaReview": "Review"
    },
    "awards": {
      "title": "Awards",
      "description": "Choose the Champion, Top Scorer, Best Goalkeeper and more individual awards.",
      "cta": "Choose Awards",
      "ctaReview": "Review"
    },
    "scoringLabel": "SCORING RULES:"
  },
  "socialHub": {
    "learnMore": "Learn more about groups"
  }
}
```

---

## Implementation Steps

### Wave 1 — Core utilities + data lift

**Task 1:** Create `app/utils/scoring-rules-utils.ts`
- Export `ScoringRulesBySection` interface and `getRulesBySection(config, tRules)` pure function
- Matches: winnerDraw + exactScore + boost rules (if enabled)
- QualifiedTeams: qualifiedTeam + exactPosition
- Awards: champion + runnerUp + thirdPlace + individualAwards
- CODE-STRUCTURE files to update: `docs/code-structure/utils.md` — add entry for scoring-rules-utils.ts; call graph: NO

**Task 2:** Update `hub-actions.ts`
- Add `scoringConfig: ScoringConfig` to `ActionCenterData` interface
- Populate from tournament data in `getActionCenterGames()` (use `DEFAULT_SCORING` from `rules.tsx` as fallback when tournament is null)
- Add `computeIsIncompleteUser(data: ActionCenterData): boolean` exported utility
- CODE-STRUCTURE files to update: `docs/code-structure/actions.md` — update `ActionCenterData` shape; call graph: NO

**Task 3:** Update `tournament-hub-action-center.tsx` + `page.tsx`
- `tournament-hub-action-center.tsx`: add `data?: ActionCenterData` prop, call `computeIsIncompleteUser`, route to new component
- `page.tsx`: fetch `ActionCenterData` at page level, compute `isIncompleteUser`, pass data as prop, hide `TournamentHubRecentResults` conditionally
- CODE-STRUCTURE files to update: `docs/code-structure/components/components-tournament-hub.md` (TournamentHubActionCenter entry); `docs/code-structure/pages.md` (page.tsx entry); call graph: YES — page now fetches ActionCenterData directly

### Wave 2 — New components + i18n

**Task 4a:** Create `tutorial-cta-card.tsx` (Client Component)
- Uses `useState` to manage dialog open state
- Renders `OnboardingDialogClient` conditionally on button click
- CODE-STRUCTURE files to update: `docs/code-structure/components/components-tournament-hub.md` — add entry; call graph: NO

**Task 4b:** Create `pre-tournament-new-user-action-center.tsx` (Server Component)
- Calls `getTranslations('hub')` and `getTranslations('rules.rules')`, calls `getRulesBySection(data.scoringConfig, tRules)`
- Renders: Countdown + TutorialCTACard + 3 PredictionTrackCard (with `rules` from `getRulesBySection`)
- PredictionTrackCard as inline sub-component
- CODE-STRUCTURE files to update: `docs/code-structure/components/components-tournament-hub.md` — add entry; call graph: YES — new rendering path from TournamentHubActionCenter

**Task 5:** Add i18n strings to `locales/en/hub.json` and `locales/es/hub.json`
- `newUser.tutorial.*`, `newUser.tracks.*.{title,description,cta,ctaReview}`, `newUser.tracks.scoringLabel`, `newUser.socialHub.learnMore`

**Task 6:** Update `social-hub-card.tsx` — add "Learn more" link
- CODE-STRUCTURE files to update: `docs/code-structure/components/components-tournament-hub.md` — update SocialHubCard entry; call graph: NO

### Wave 3 — Tests + Docs

**Task 7:** Write tests for `getRulesBySection` (unit), `computeIsIncompleteUser` (unit), `TutorialCTACard` (dialog open/close), `PreTournamentNewUserActionCenter` (render), `SocialHubCard` (updated), `TournamentHubActionCenter` (routing)

**Task 8:** Final CODE-STRUCTURE.md index update (any call graph changes not yet captured)

---

## Testing Strategy

### Unit Tests

All tests use `testFactories.*` (from `@/__tests__/db/test-factories`) to build `ActionCenterData` instances with controlled field values. Mock patterns follow existing hub tests in `app/components/tournament-hub/__tests__/`. `ScoringConfig` instances built inline (plain objects — no factory needed since it's a simple value type).

**`scoring-rules-utils.ts` — `getRulesBySection`:**
Pass a mock `tRules` that returns `key(params)` strings. Build `ScoringConfig` objects inline with various `max_silver_games`/`max_golden_games` combinations. Test matches/qualifiedTeams/awards section content and boost inclusion/exclusion.

**`hub-actions.ts` — `computeIsIncompleteUser`:**
Build `ActionCenterData` via `testFactories.createActionCenterData({ tournamentHasStarted, qtAndAwardsOpen, predictedGames, totalGames, awardsCompleted, awardsTotal, qualifiersCompleted, qualifiersTotal })`. Test all threshold combinations: started/not-started, window open/closed, all 3 track thresholds (above/below), zero-total edge cases.

**`tutorial-cta-card.tsx`:**
Mock `next-intl` (`useTranslations` returns key), mock `OnboardingDialogClient` with a `data-testid`. Test: title/subtitle render, clicking "View Tutorial" shows dialog, `onClose` call hides dialog.

**`pre-tournament-new-user-action-center.tsx`:**
Mock `next-intl/server` (`getTranslations` returns key-identity fn), mock `PreTournamentCountdown`, mock `TutorialCTACard`, mock `next/link`. Build data with `testFactories.createActionCenterData()`. Test: countdown visibility, tutorial card section present, 3 track cards with correct hrefs, progress values, CTA label switching (ctaReview vs cta).

**`tournament-hub-action-center.tsx`:**
Mock `getActionCenterGames` (returns `testFactories.createActionCenterData(...)`), mock `computeIsIncompleteUser`, mock `ActionCenterCarousel`, mock `PreTournamentNewUserActionCenter`. Test routing logic: incomplete→new, complete→carousel, started→carousel, finished→null.

**`social-hub-card.tsx`:**
Add test for "Learn more" link presence and correct href (friend-groups URL).

### Coverage Target
≥ 80% on all new/modified files.

---

## Open Questions

*(Resolved by user)*

1. **Tutorial CTA action:** Opens the existing onboarding dialog (`OnboardingDialogClient`), same as the header menu "Tutorial" option. No URL navigation.

2. **"Learn more about groups" target:** Links to the friend-groups page (`/${locale}/tournaments/${tournamentId}/friend-groups`).

---

## Implementation Amendments

### Amendment 1: 4-state CTA labels per track
**Date:** 2026-04-21
**Reason:** User feedback — single cta/ctaReview was not enough. Distinct labels needed to match progress stages.
**Change:** Each track card CTA now has 4 states keyed by progress thresholds:
- `cta` — 0% (nothing done yet)
- `ctaKeep` — 1–29% for matches, 1–89% for QT/awards
- `ctaFinish` — ≥30% for matches, ≥90% for QT/awards (but not 100%)
- `ctaReview` — 100% complete
Added `ctaKeep` and `ctaFinish` keys to all 3 track sections in `hub.json` (EN + ES).

### Amendment 2: Prediction deadline box in each track card
**Date:** 2026-04-21
**Reason:** User feedback — users should see when predictions lock, not just scoring rules.
**Change:** `PredictionTrackCard` gains `deadline: string | null` and `deadlineLabel: string` props. A dashed-border deadline box with `ScheduleIcon` is rendered above the scoring rules box. Deadline text is sourced from `rules.constraints` namespace (see Amendment 3).

### Amendment 3: `getConstraintsBySection` added to `scoring-rules-utils.ts`
**Date:** 2026-04-21
**Reason:** Deadline text was already defined in `rules.json` `constraints` section. Reusing it avoids duplication and ensures the Hub track cards and the Rules page show identical, consistent text.
**Change:** Added `getConstraintsBySection(tConstraints, lockDate: string | null): ConstraintsBySection` to `scoring-rules-utils.ts`. The `lockDate` parameter is the actual QT/awards lock date, formatted as a locale-specific string (e.g. "June 6, 2026"). Matches constraint: `matchPredictionTime` (no date param). QT/Awards: `qualifiedTeamsPredictionTime` / `podiumPredictionTime` with `{ date }` interpolation. When `lockDate` is null, falls back to `lockDateFallback` ("5 days after the tournament starts").

### Amendment 4: `rules.json` constraints refactored to use `{date}` param
**Date:** 2026-04-21
**Reason:** Constraint strings previously embedded a hardcoded "2 days" which was wrong (code enforces 5-day offset). Replacing with a `{date}` param allows the actual date to be interpolated, fixing the discrepancy and making the text date-accurate.
**Change:** `qualifiedTeamsPredictionTime` and `podiumPredictionTime` in both `locales/en/rules.json` and `locales/es/rules.json` now use `{date}`. Added `lockDateFallback` key as the generic fallback string. Updated examples in both locales from "June 3rd"/"3 de junio" to "June 6th"/"6 de junio" (correct 5-day offset from June 1st).

### Amendment 5: `rules.tsx` accepts optional `lockDate` prop
**Date:** 2026-04-21
**Reason:** The tournament-specific rules page should show the actual computed lock date, not the generic fallback.
**Change:** `Rules` component gains `lockDate?: string` prop. When provided, it is passed as the `date` param to `qualifiedTeamsPredictionTime` / `podiumPredictionTime` constraint strings. Falls back to `lockDateFallback` when absent.

### Amendment 6: `rules/page.tsx` fetches `firstGameDate` to compute `lockDate`
**Date:** 2026-04-21
**Reason:** To pass the actual lock date to `Rules` component (Amendment 5), the page must know the first game date.
**Change:** `rules/page.tsx` now fetches `[tournament, firstGame]` in parallel using `Promise.all`. Computes `lockDate` = first game date + 5 days, formatted via `Intl.DateTimeFormat`. Passes `lockDate={lockDate}` to `<Rules />`. Gracefully handles missing first game (lockDate remains undefined, Rules uses fallback).

### Amendment 7: Scoring rules box icon changed to `AddCircleOutline`
**Date:** 2026-04-21
**Reason:** User feedback — the original scoreboard icon was confused with a game score, not a scoring-rules concept. `AddCircleOutline` ("+") better represents "points you can earn."
**Change:** `PredictionTrackCard`'s scoring rules box header uses `AddCircleOutlineIcon` instead of a scoreboard-style icon.

---

## Validation Checklist

- [ ] `npm run test` — all tests pass (existing + new)
- [ ] `npm run build` — no TypeScript errors
- [ ] `npm run lint` — no new ESLint issues
- [ ] Verify incomplete user layout renders in Vercel Preview
- [ ] Toggle to complete user (adjust predictions in DB) — confirms switch to original carousel
- [ ] Check English and Spanish text rendering
- [ ] SonarCloud: 0 new issues
