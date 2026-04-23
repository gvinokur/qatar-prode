# Plan: Story #357 — Dashboard: Status Widgets (Qualified/Awards)

## Context

Story #356 established `GamesInfoWidget` and `GamesActiveWidget` as standalone `DashboardCard`-wrapped hub widgets. Story #357 continues that pattern: extract the "Qualified Teams" and "Awards" prediction tracks from `PreTournamentNewUserActionCenter` into their own standalone `DashboardCard` widgets, add urgency-coloured deadline boxes, and clean up the placeholder lorem ipsum cards from the hub grid.

**Also in scope**: move the QT/Awards prediction lock from **5 days** to **2 days** after tournament start, applied consistently across all files that reference this constant, and centralise it via a single exported constant from `hub-actions.ts`.

---

## Goal

1. Create `QualifiedTeamsWidget` and `AwardsWidget` — pre-tournament-only hub cards that mirror the `GamesInfoWidget` structure but add a severity-coloured deadline box (48h/24h/2h thresholds).
2. Remove the placeholder "Standings" and "Groups" `DashboardCard` lorem ipsum entries from the hub page.
3. Change the prediction lock offset from 5 days → 2 days everywhere.

---

## Files to Create

| File | Purpose |
|------|---------|
| `app/components/tournament-hub/qualified-teams-widget.tsx` | New async Server Component for QT card |
| `app/components/tournament-hub/awards-widget.tsx` | New async Server Component for Awards card |
| `app/components/tournament-hub/__tests__/qualified-teams-widget.test.tsx` | Unit tests |
| `app/components/tournament-hub/__tests__/awards-widget.test.tsx` | Unit tests |

## Files to Modify

| File | Change |
|------|--------|
| `app/actions/hub-actions.ts` | Change `PREDICTION_LOCK_OFFSET_MS` to 2 days, **export** it; add `qualifiersTotal` + `awardsTotal` to `TournamentHubPageData` and `getTournamentHubPageData` |
| `app/[locale]/tournaments/[id]/awards/page.tsx` | Replace `FIVE_DAYS_MS` with imported `PREDICTION_LOCK_OFFSET_MS` |
| `app/actions/qualification-actions.ts` | Replace inline `5 * 24 * 60 * 60 * 1000` with imported `PREDICTION_LOCK_OFFSET_MS` |
| `app/db/tournament-prediction-completion-repository.ts` | Replace inline `5 * 24 * 60 * 60 * 1000` with imported `PREDICTION_LOCK_OFFSET_MS` |
| `app/components/tournament-hub/pre-tournament-new-user-action-center.tsx` | Replace inline `5 * 24 * 60 * 60 * 1000` with imported `PREDICTION_LOCK_OFFSET_MS` |
| `app/utils/urgency-utils.ts` | Add `StatusWidgetSeverity` type + `computeStatusWidgetSeverity(ms)` |
| `app/[locale]/tournaments/[id]/page.tsx` | Add two new widgets (pre-tournament only); remove placeholder DashboardCards; compute lockDate using `PREDICTION_LOCK_OFFSET_MS` |
| `locales/en/hub.json` | Add `statusWidget` translation section |
| `locales/es/hub.json` | Add `statusWidget` translation section (Spanish) |
| `docs/code-structure/components/components-tournament-hub.md` | Document two new components + urgency-utils change |

---

## Design

### 1. Lock Offset Constant Change

In `hub-actions.ts`, change and **export** the constant:
```ts
export const PREDICTION_LOCK_OFFSET_MS = 2 * 24 * 60 * 60 * 1000 // 2 days after tournament start
```

Import and use in: `awards/page.tsx`, `qualification-actions.ts`, `tournament-prediction-completion-repository.ts`, `pre-tournament-new-user-action-center.tsx`, and hub `page.tsx`.

### 2. `qualifiersTotal` and `awardsTotal` in `getTournamentHubPageData`

Add to `TournamentHubPageData`:
```ts
export interface TournamentHubPageData {
  scoringConfig: ScoringConfig
  totalGames: number
  isStarted: boolean
  isFinished: boolean
  qualifiersTotal: number   // Total qualifying slots (first-stage playoff games × 2)
  awardsTotal: number        // Always 7 (3 finalStandings + 4 individual awards)
}
```

The `qualifiersTotal` query — `PlayoffRoundTable` already has a `total_games` field, so no JOIN needed:
```ts
const firstStageRound = await db
  .selectFrom('tournament_playoff_rounds')
  .select('total_games')
  .where('tournament_id', '=', tournamentId)
  .where('is_first_stage', '=', true)
  .executeTakeFirst()

qualifiersTotal = (firstStageRound?.total_games ?? 0) * 2
awardsTotal = 7  // 3 finalStandings + 4 individual awards (constant per app logic)
```

Add this query to the existing `Promise.all` in `getTournamentHubPageData`.

### 3. `computeStatusWidgetSeverity` (urgency-utils.ts)

```ts
export type StatusWidgetSeverity = 'normal' | 'info' | 'warning' | 'error'

export function computeStatusWidgetSeverity(msUntilLock: number): StatusWidgetSeverity {
  if (msUntilLock < 2 * ONE_HOUR_MS)       return 'error'
  if (msUntilLock < TWENTY_FOUR_HOURS_MS)   return 'warning'
  if (msUntilLock < FORTY_EIGHT_HOURS_MS)   return 'info'
  return 'normal'
}
```

### 4. Widget Props

```ts
interface QualifiedTeamsWidgetProps {
  isLoggedOff: boolean
  scoringRules: ScoringRulesBySection
  qtHref: string
  qualifiersCompleted: number   // 0 when logged-off
  qualifiersTotal: number       // from getTournamentHubPageData — available for all users
  msUntilPredictionLock: number
  lockDateFormatted: string | null
}

interface AwardsWidgetProps {
  isLoggedOff: boolean
  scoringRules: ScoringRulesBySection
  awardsHref: string
  awardsCompleted: number       // 0 when logged-off
  awardsTotal: number           // from getTournamentHubPageData — always 7
  msUntilPredictionLock: number
  lockDateFormatted: string | null
}
```

### 5. Widget Content Structure (mirrors GamesInfoWidget exactly)

Both widgets render inside `DashboardCard`:
- `DashboardCard` receives `urgent={severity === 'error'}` — turns card border red
- `count` always shown: `${completed}/${total}` (total > 0 from hub data for all users)
- Content:
  1. Description paragraph
  2. **Urgency deadline box** — dashed border + background tint, coloured by severity. Contains: ScheduleIcon + deadline label row + formatted lock date + severity message text below
  3. Scoring rules box (AddCircleOutlineIcon + rules array)
  4. `LinearProgress color="secondary"` above CTA (hidden when total=0)
  5. CTA via `GamesInfoWidgetCta` component (reuse existing)

### 6. Severity colour mapping (MUI theme colours — no hardcoded rgba)

```tsx
import { alpha } from '@mui/material/styles'

const severityStyle = {
  normal:  { borderColor: 'divider',        bgcolor: 'transparent' },
  info:    { borderColor: 'info.main',       bgcolor: (theme) => alpha(theme.palette.info.main, 0.05) },
  warning: { borderColor: 'warning.main',    bgcolor: (theme) => alpha(theme.palette.warning.main, 0.05) },
  error:   { borderColor: 'error.main',      bgcolor: (theme) => alpha(theme.palette.error.main, 0.05) },
}[severity]
```

The ScheduleIcon and deadline label text colour also change by severity (text.secondary for normal, severity color for info/warning/error).

### 7. CTA logic

QT:
- 0%: `hub.newUser.tracks.qualifiedTeams.cta`
- >0% & <90%: `ctaKeep`
- ≥90% & <100%: `ctaFinish`
- 100%: `ctaReview`

Awards:
- 0%: `hub.newUser.tracks.awards.cta`
- >0% & <90%: `ctaKeep`
- ≥90% & <100%: `ctaFinish`
- 100%: `ctaReview`

For `isLoggedOff=true`: `hub.gamesWidget.ctaLogin`

### 8. New i18n keys (`hub.statusWidget`)

```json
"statusWidget": {
  "deadlineLabel": "Prediction deadline:",
  "deadlineNormal": "Changes allowed until the tournament starts.",
  "deadlineInfo": "Less than 48 hours remaining.",
  "deadlineWarning": "Less than 24 hours remaining!",
  "deadlineError": "Final 2 hours — submit your predictions now!"
}
```

Spanish (`locales/es/hub.json`):
```json
"statusWidget": {
  "deadlineLabel": "Fecha límite:",
  "deadlineNormal": "Se permite modificar hasta el inicio del torneo.",
  "deadlineInfo": "Quedan menos de 48 horas.",
  "deadlineWarning": "¡Quedan menos de 24 horas!",
  "deadlineError": "¡Últimas 2 horas para enviar tus pronósticos!"
}
```

### 9. Hub Page Changes

After `timing` and `actionCenterData` are available, compute:
```tsx
const lockDateFormatted = timing.firstGameDate
  ? new Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric', year: 'numeric' }).format(
      new Date(timing.firstGameDate.getTime() + PREDICTION_LOCK_OFFSET_MS)
    )
  : null
const msUntilPredictionLock = timing.firstGameDate
  ? timing.firstGameDate.getTime() + PREDICTION_LOCK_OFFSET_MS - Date.now()
  : Number.MAX_SAFE_INTEGER
```

In the widget grid, replace placeholder DashboardCards:
```tsx
// REMOVE:
<DashboardCard title="Standings" ...> lorem ipsum </DashboardCard>
<DashboardCard title="Groups" ...> lorem ipsum </DashboardCard>

// ADD (pre-tournament only):
{!hubData.isStarted && (
  <>
    <QualifiedTeamsWidget
      isLoggedOff={!user}
      scoringRules={scoringRules}
      qtHref={`/${locale}/tournaments/${id}/qualified-teams`}
      qualifiersCompleted={actionCenterData?.qualifiersCompleted ?? 0}
      qualifiersTotal={hubData.qualifiersTotal}
      msUntilPredictionLock={msUntilPredictionLock}
      lockDateFormatted={lockDateFormatted}
    />
    <AwardsWidget
      isLoggedOff={!user}
      scoringRules={scoringRules}
      awardsHref={`/${locale}/tournaments/${id}/awards`}
      awardsCompleted={actionCenterData?.awardsCompleted ?? 0}
      awardsTotal={hubData.awardsTotal}
      msUntilPredictionLock={msUntilPredictionLock}
      lockDateFormatted={lockDateFormatted}
    />
  </>
)}
```

Remove unused imports: `EmojiEventsIcon`, `GroupsIcon`.

---

## Mid-Level Design

### `app/actions/hub-actions.ts` *(modified)*

**Changed:**
- `PREDICTION_LOCK_OFFSET_MS`: now exported, value changed from 5 days to 2 days
- `TournamentHubPageData`: add `qualifiersTotal: number`, `awardsTotal: number`
- `getTournamentHubPageData(tournamentId)`: add qualifiers total query to the existing `Promise.all`; hardcode `awardsTotal: 7`
  Calls: db (added query for first-stage playoff games)
  Tests:
  - returns qualifiersTotal as first-stage round total_games × 2
  - returns awardsTotal as 7
  - returns qualifiersTotal=0 when no first-stage playoff round configured

### `app/utils/urgency-utils.ts` *(modified)*

**New:**
- `StatusWidgetSeverity = 'normal' | 'info' | 'warning' | 'error'`
- **computeStatusWidgetSeverity(msUntilLock: number)**: `StatusWidgetSeverity`
  Derives deadline severity from ms remaining until prediction lock.
  Tests:
  - returns 'error' when msUntilLock < 7_200_000
  - returns 'warning' when msUntilLock is between 7_200_000 and 86_400_000
  - returns 'info' when msUntilLock is between 86_400_000 and 172_800_000
  - returns 'normal' when msUntilLock >= 172_800_000
  - returns 'normal' for Number.MAX_SAFE_INTEGER

### `app/components/tournament-hub/qualified-teams-widget.tsx` *(new)*

**QualifiedTeamsWidget({ isLoggedOff, scoringRules, qtHref, qualifiersCompleted, qualifiersTotal, msUntilPredictionLock, lockDateFormatted })**: `Promise<JSX.Element>` — [Server] Calls `getTranslations('hub')`. Calls `computeStatusWidgetSeverity(msUntilPredictionLock)`. Renders `DashboardCard` with `AccountTreeIcon`, title `newUser.tracks.qualifiedTeams.title`, count `${qualifiersCompleted}/${qualifiersTotal}`, `urgent={severity === 'error'}`. Inside: description; urgency deadline box (theme-alpha bg + dashed border coloured by severity, ScheduleIcon + `statusWidget.deadlineLabel` + `lockDateFormatted`, severity text); scoring rules box (`scoringRules.qualifiedTeams`); `LinearProgress color="secondary"` (hidden when total=0); CTA via `GamesInfoWidgetCta`.
Calls: getTranslations('hub'), computeStatusWidgetSeverity
Renders: DashboardCard, GamesInfoWidgetCta
Tests:
- renders AccountTreeIcon and QT title
- shows count as "completed/total"
- renders login CTA when isLoggedOff=true
- renders start CTA when isLoggedOff=false and progress=0
- renders ctaFinish when progress >= 90% but < 100%
- renders ctaReview when qualifiersCompleted === qualifiersTotal > 0
- applies error border and urgent=true when severity is error
- renders info-coloured deadline box when msUntilPredictionLock < 48h but > 24h
- hides LinearProgress when qualifiersTotal is 0
- renders normal deadline box when msUntilPredictionLock is MAX_SAFE_INTEGER

### `app/components/tournament-hub/awards-widget.tsx` *(new)*

**AwardsWidget({ isLoggedOff, scoringRules, awardsHref, awardsCompleted, awardsTotal, msUntilPredictionLock, lockDateFormatted })**: `Promise<JSX.Element>` — [Server] Same structure. `EmojiEventsIcon`, title `newUser.tracks.awards.title`, `scoringRules.awards`. 4-state CTA for awards track.
Calls: getTranslations('hub'), computeStatusWidgetSeverity
Renders: DashboardCard, GamesInfoWidgetCta
Tests:
- renders EmojiEventsIcon and awards title
- shows count as "completed/total"
- renders login CTA when isLoggedOff=true
- renders start CTA when isLoggedOff=false and progress=0
- renders ctaReview when awardsCompleted === awardsTotal > 0
- applies error border when severity is error (msUntilLock < 2h)
- renders normal deadline box when msUntilPredictionLock is MAX_SAFE_INTEGER

### Call Graph Changes

No new cross-layer flows. `getTournamentHubPageData` gains one extra parallel DB query (first-stage games count). `PREDICTION_LOCK_OFFSET_MS` export unifies the lock constant across layers.

---

## Testing Strategy

- Unit tests for `computeStatusWidgetSeverity` (5 cases — pure function)
- Unit tests for both new widgets following `games-info-widget.test.tsx` pattern exactly (mock `next-intl/server`, mock `next/link`, render async component)
- The lock constant change (`5 → 2 days`) is covered by existing tests in `qualification-actions` and `tournament-prediction-completion` suites — no new tests needed there

---

## Validation

1. `npm run test` — all existing tests pass + new tests pass
2. `npm run lint` — no errors
3. `npm run build` — no TypeScript errors
4. Visual: hub page pre-tournament → QT and Awards widgets visible; Standings/Groups placeholders gone
5. Visual: urgency severity colours change correctly at thresholds
6. Logged-off user: sees widgets with "Sign In" CTA and correct count from `hubData`
7. QT page + Awards page: lock triggers at 2 days (not 5) after tournament start

---

## Acceptance Criteria Coverage

| AC | Implementation |
|----|----------------|
| Follow Games card example | DashboardCard + GamesInfoWidgetCta + LinearProgress; count always shown via hubData |
| Urgency severity 48h/24h/2h | `computeStatusWidgetSeverity` + severity-coloured deadline box with MUI theme alpha bg |
| Progress bar | `LinearProgress color="secondary"` above CTA |
| Dynamic CTA text | 4-state logic; login CTA when isLoggedOff |
| Conditional presence (pre-tournament only) | `{!hubData.isStarted && ...}` in hub page |
| Rules sections | `scoringRules.qualifiedTeams` / `scoringRules.awards` from hub |
| Data as props | All from hub-fetched data; zero new calls from widgets |
| Clean up placeholders | Standings and Groups lorem ipsum DashboardCards removed |
| 2-day deadline | `PREDICTION_LOCK_OFFSET_MS` exported from hub-actions at 2 days; used everywhere |
