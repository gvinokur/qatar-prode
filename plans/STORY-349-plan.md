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

---

## Files to Modify

### `app/actions/hub-actions.ts`
Add exported utility `computeIsIncompleteUser(data: ActionCenterData): boolean`.

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
Add `newUser` section with strings for tutorial card, 3 track cards, and the social hub "learn more" link.

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
│ 🌳  Equipos Clasificados         0%   0/64 │
│ Armá tu llave. Elegí quiénes pasan         │
│ de ronda y quién gana la final.             │
│ ┌──────────────────────────────────────┐   │
│ │ REGLAS: 1pto por equipo clasificado, │   │
│ │ +1 extra por posición exacta.        │   │
│ └──────────────────────────────────────┘   │
│ [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 0%│
│ [Armar mi Llave]                           │
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
  [Server] Full "incomplete user" layout. Renders: (1) `PreTournamentCountdown` when `data.firstGameDate !== null`; (2) `TutorialCTACard`; (3) 3 `PredictionTrackCard` entries (matches, qualifiedTeams, awards).
  Calls: getTranslations
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
  Renders: icon, title, description, scoring rules box (dashed border), LinearProgress, CTA Button (Link).
  Props: `title`, `icon`, `description`, `scoring`, `scoringLabel`, `progress` (0-100), `completed` (count), `total`, `cta`, `href`, `isComplete`
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
      "scoring": "1 pt for a correct winner/draw, +2 extra pts for the exact result.",
      "cta": "Start Predicting",
      "ctaReview": "Review"
    },
    "qualifiedTeams": {
      "title": "Qualified Teams",
      "description": "Build your bracket. Choose who advances from each group and who wins the final.",
      "scoring": "1 pt per qualified team, +1 extra pt for exact position in the group.",
      "cta": "Build My Bracket",
      "ctaReview": "Review"
    },
    "awards": {
      "title": "Awards",
      "description": "Choose the Champion, Top Scorer, Best Goalkeeper and more individual awards.",
      "scoring": "1 pt for each correct award (Top Scorer, Golden Glove, etc).",
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

### Wave 1 — Core utility + data lift

**Task 1:** Add `computeIsIncompleteUser` to `hub-actions.ts`
- Pure function, no DB calls
- Export it alongside `ActionCenterData`

**Task 2:** Update `tournament-hub-action-center.tsx` to accept optional `data` prop + route to new component
- Add `data?: ActionCenterData` to props interface
- Use pre-fetched data if provided, otherwise call `getActionCenterGames`
- Import and call `computeIsIncompleteUser`
- Render `PreTournamentNewUserActionCenter` (will stub to `null` until Task 3)

**Task 3:** Update `page.tsx` to fetch data at page level + hide Recent Results
- Import `getActionCenterGames`, `computeIsIncompleteUser`
- Compute `isIncompleteUser` from data
- Pass `data` to `TournamentHubActionCenter`
- Wrap `TournamentHubRecentResults` in `{!isIncompleteUser && ...}`

### Wave 2 — New components + i18n

**Task 4a:** Create `tutorial-cta-card.tsx` (Client Component)
- Uses `useState` to manage dialog open state
- Renders `OnboardingDialogClient` conditionally on button click

**Task 4b:** Create `pre-tournament-new-user-action-center.tsx` (Server Component)
- Countdown + TutorialCTACard + 3 Track Cards
- PredictionTrackCard sub-component
- Uses `getTranslations` for server-side i18n

**Task 5:** Add i18n strings to `locales/en/hub.json` and `locales/es/hub.json`

**Task 6:** Update `social-hub-card.tsx` — add "Learn more" link

### Wave 3 — Tests + Docs

**Task 7:** Write tests for `computeIsIncompleteUser` (unit), `TutorialCTACard` (dialog open/close), `PreTournamentNewUserActionCenter` (render), `SocialHubCard` (updated), `TournamentHubActionCenter` (routing)

**Task 8:** Update `docs/code-structure/components/components-tournament-hub.md`

---

## Testing Strategy

### Unit Tests

All tests use `testFactories.*` (from `@/__tests__/db/test-factories`) to build `ActionCenterData` instances with controlled field values. Mock patterns follow existing hub tests in `app/components/tournament-hub/__tests__/`.

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

## Validation Checklist

- [ ] `npm run test` — all tests pass (existing + new)
- [ ] `npm run build` — no TypeScript errors
- [ ] `npm run lint` — no new ESLint issues
- [ ] Verify incomplete user layout renders in Vercel Preview
- [ ] Toggle to complete user (adjust predictions in DB) — confirms switch to original carousel
- [ ] Check English and Spanish text rendering
- [ ] SonarCloud: 0 new issues
