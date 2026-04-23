# Plan: Story #357 — Dashboard: Status Widgets (Qualified/Awards)

## Context

Story #356 established `GamesInfoWidget` and `GamesActiveWidget` as standalone `DashboardCard`-wrapped hub widgets. Story #357 continues that pattern: extract the "Qualified Teams" and "Awards" prediction tracks from `PreTournamentNewUserActionCenter` into their own standalone `DashboardCard` widgets, add urgency-coloured deadline boxes, and clean up the placeholder lorem ipsum cards from the hub grid.

---

## Goal

Create `QualifiedTeamsWidget` and `AwardsWidget` — pre-tournament-only hub cards that mirror the `GamesInfoWidget` structure but add a severity-coloured deadline box (48h/24h/2h thresholds). Remove the placeholder "Standings" and "Groups" `DashboardCard` lorem ipsum entries from the hub page.

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
| `app/utils/urgency-utils.ts` | Add `StatusWidgetSeverity` type + `computeStatusWidgetSeverity(ms)` |
| `app/[locale]/tournaments/[id]/page.tsx` | Add two new widgets (pre-tournament only); remove placeholder DashboardCards |
| `locales/en/hub.json` | Add `statusWidget` translation section |
| `locales/es/hub.json` | Add `statusWidget` translation section (Spanish) |
| `docs/code-structure/components/components-tournament-hub.md` | Document two new components + urgency-utils change |

---

## Design

### 1. `computeStatusWidgetSeverity` (urgency-utils.ts)

Reuses the existing thresholds already defined in the file:

```ts
export type StatusWidgetSeverity = 'normal' | 'info' | 'warning' | 'error'

export function computeStatusWidgetSeverity(msUntilLock: number): StatusWidgetSeverity {
  if (msUntilLock < 2 * ONE_HOUR_MS)       return 'error'
  if (msUntilLock < TWENTY_FOUR_HOURS_MS)   return 'warning'
  if (msUntilLock < FORTY_EIGHT_HOURS_MS)   return 'info'
  return 'normal'
}
```

### 2. Widget Props (same shape for both)

```ts
interface QualifiedTeamsWidgetProps {
  isLoggedOff: boolean
  scoringRules: ScoringRulesBySection
  qtHref: string
  qualifiersCompleted: number
  qualifiersTotal: number       // 0 when logged-off → count badge hidden
  msUntilPredictionLock: number
  lockDateFormatted: string | null
}
```

```ts
interface AwardsWidgetProps {
  isLoggedOff: boolean
  scoringRules: ScoringRulesBySection
  awardsHref: string
  awardsCompleted: number
  awardsTotal: number            // 0 when logged-off → count badge hidden
  msUntilPredictionLock: number
  lockDateFormatted: string | null
}
```

### 3. Widget Content Structure (matches GamesInfoWidget pattern)

Both widgets render inside `DashboardCard`:
- `DashboardCard` receives `urgent={severity === 'error'}` — turns card border red
- Content:
  1. Description paragraph
  2. **Urgency deadline box** — dashed border + background tint, coloured by severity (normal=divider, info=info.main, warning=warning.main, error=error.main). Contains: ScheduleIcon + deadline label row + formatted date + severity message text below
  3. Scoring rules box (same pattern as GamesInfoWidget — AddCircleOutlineIcon + rules array)
  4. `LinearProgress` with `color="error"` (per mockup: red progress bar, always shown; hidden when total=0)
  5. CTA via `GamesInfoWidgetCta` component (reuse existing — handles isLoggedOff→LoginOrSignupDialog, else Link)

### 4. Severity colour mapping

```tsx
const severityMap = {
  normal:  { borderColor: 'divider',        bgcolor: 'transparent' },
  info:    { borderColor: 'info.main',       bgcolor: 'rgba(96, 165, 250, 0.05)' },
  warning: { borderColor: 'warning.main',    bgcolor: 'rgba(251, 191, 36, 0.05)' },
  error:   { borderColor: 'error.main',      bgcolor: 'rgba(248, 113, 113, 0.05)' },
}
```

### 5. CTA logic

QT:
- 0%: `hub.newUser.tracks.qualifiedTeams.cta` ("Predict Who Advances")
- >0% & <90%: `ctaKeep` ("Keep Going")
- ≥90% & <100%: `ctaFinish` ("Finish Your Picks")
- 100%: `ctaReview` ("Review Your Predictions")

Awards:
- 0%: `hub.newUser.tracks.awards.cta` ("Choose Awards")
- >0% & <90%: `ctaKeep` ("Keep Choosing")
- ≥90% & <100%: `ctaFinish` ("Finish Choosing")
- 100%: `ctaReview` ("Review Your Predictions")

For `isLoggedOff=true`: CTA always shows `hub.gamesWidget.ctaLogin` ("Sign In to Predict")

### 6. New i18n keys (`hub.statusWidget`)

```json
"statusWidget": {
  "deadlineLabel": "Prediction deadline:",
  "deadlineNormal": "Changes allowed until the tournament starts.",
  "deadlineInfo": "Less than 48 hours remaining.",
  "deadlineWarning": "Less than 24 hours remaining!",
  "deadlineError": "Final 2 hours — submit your predictions now!"
}
```

Spanish:
```json
"statusWidget": {
  "deadlineLabel": "Fecha límite:",
  "deadlineNormal": "Se permite modificar hasta el inicio del torneo.",
  "deadlineInfo": "Quedan menos de 48 horas.",
  "deadlineWarning": "¡Quedan menos de 24 horas!",
  "deadlineError": "¡Últimas 2 horas para enviar tus pronósticos!"
}
```

### 7. Hub Page (`app/[locale]/tournaments/[id]/page.tsx`) Changes

Add computed values after `timing` and `actionCenterData` are available:
```tsx
const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000
const msUntilPredictionLock = timing.firstGameDate
  ? timing.firstGameDate.getTime() + FIVE_DAYS_MS - Date.now()
  : Number.MAX_SAFE_INTEGER
const lockDateFormatted = timing.firstGameDate
  ? new Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric', year: 'numeric' }).format(
      new Date(timing.firstGameDate.getTime() + FIVE_DAYS_MS)
    )
  : null
```

In the widget grid, replace placeholder DashboardCards:
```tsx
// REMOVE these two:
<DashboardCard title="Standings" icon={<EmojiEventsIcon />}>...</DashboardCard>
<DashboardCard title="Groups" icon={<GroupsIcon />} count="2 groups">...</DashboardCard>

// ADD (pre-tournament only):
{!hubData.isStarted && (
  <>
    <QualifiedTeamsWidget
      isLoggedOff={!user}
      scoringRules={scoringRules}
      qtHref={`/${locale}/tournaments/${id}/qualified-teams`}
      qualifiersCompleted={actionCenterData?.qualifiersCompleted ?? 0}
      qualifiersTotal={actionCenterData?.qualifiersTotal ?? 0}
      msUntilPredictionLock={msUntilPredictionLock}
      lockDateFormatted={lockDateFormatted}
    />
    <AwardsWidget
      isLoggedOff={!user}
      scoringRules={scoringRules}
      awardsHref={`/${locale}/tournaments/${id}/awards`}
      awardsCompleted={actionCenterData?.awardsCompleted ?? 0}
      awardsTotal={actionCenterData?.awardsTotal ?? 0}
      msUntilPredictionLock={msUntilPredictionLock}
      lockDateFormatted={lockDateFormatted}
    />
  </>
)}
```

Also remove unused imports: `EmojiEventsIcon`, `GroupsIcon` (only used in placeholder cards).

---

## Mid-Level Design

### `app/utils/urgency-utils.ts` *(modified)*

**New exported type:**
- `StatusWidgetSeverity = 'normal' | 'info' | 'warning' | 'error'`

**New function:**
- **computeStatusWidgetSeverity(msUntilLock: number)**: `StatusWidgetSeverity`
  Derives deadline severity for QT/Awards status widgets from ms remaining until prediction lock.
  Returns 'error' when < 2h, 'warning' when < 24h, 'info' when < 48h, else 'normal'.
  Tests:
  - returns 'error' when msUntilLock < 7_200_000
  - returns 'warning' when msUntilLock is between 7_200_000 and 86_400_000
  - returns 'info' when msUntilLock is between 86_400_000 and 172_800_000
  - returns 'normal' when msUntilLock >= 172_800_000
  - returns 'normal' for Number.MAX_SAFE_INTEGER (logged-off fallback)

### `app/components/tournament-hub/qualified-teams-widget.tsx` *(new)*

**QualifiedTeamsWidget({ isLoggedOff, scoringRules, qtHref, qualifiersCompleted, qualifiersTotal, msUntilPredictionLock, lockDateFormatted })**: `Promise<JSX.Element>` — [Server] Calls `getTranslations('hub')`. Calls `computeStatusWidgetSeverity(msUntilPredictionLock)`. Renders `DashboardCard` with `AccountTreeIcon`, title `newUser.tracks.qualifiedTeams.title`, count `${qualifiersCompleted}/${qualifiersTotal}` (only when `qualifiersTotal > 0`), and `urgent={severity === 'error'}`. Inside: description; urgency deadline box (severity-coloured border + bg tint, ScheduleIcon + `statusWidget.deadlineLabel` + `lockDateFormatted`, severity text below); scoring rules box (`scoringRules.qualifiedTeams`); `LinearProgress color="error"` (hidden when total=0); CTA via `GamesInfoWidgetCta` (isLoggedOff, qtHref, ctaLabel).
Calls: getTranslations('hub'), computeStatusWidgetSeverity
Renders: DashboardCard, GamesInfoWidgetCta
Tests:
- renders AccountTreeIcon and QT title
- shows count badge when qualifiersTotal > 0
- hides count badge when qualifiersTotal is 0
- renders login CTA when isLoggedOff=true
- renders start CTA when isLoggedOff=false and progress=0
- renders ctaFinish when progress >= 90%
- renders ctaReview when qualifiersCompleted === qualifiersTotal > 0
- applies error border color and urgent=true to DashboardCard when severity is error
- renders info-coloured deadline box when msUntilPredictionLock < 48h but > 24h
- hides LinearProgress when qualifiersTotal is 0

### `app/components/tournament-hub/awards-widget.tsx` *(new)*

**AwardsWidget({ isLoggedOff, scoringRules, awardsHref, awardsCompleted, awardsTotal, msUntilPredictionLock, lockDateFormatted })**: `Promise<JSX.Element>` — [Server] Same structure as QualifiedTeamsWidget. Uses `EmojiEventsIcon`, title `newUser.tracks.awards.title`, `scoringRules.awards`. CTA states follow the awards 4-state logic (cta/ctaKeep/ctaFinish/ctaReview).
Calls: getTranslations('hub'), computeStatusWidgetSeverity
Renders: DashboardCard, GamesInfoWidgetCta
Tests:
- renders EmojiEventsIcon and awards title
- shows count badge when awardsTotal > 0
- renders login CTA when isLoggedOff=true
- renders start CTA when isLoggedOff=false and progress=0
- renders ctaReview when awardsCompleted === awardsTotal > 0
- applies error border color when severity is error (< 2h)
- renders normal deadline box when msUntilPredictionLock is MAX_SAFE_INTEGER

### Call Graph Changes

No new cross-layer flows. New components call `getTranslations` (next-intl) and `computeStatusWidgetSeverity` (local util). Hub page passes pre-computed scalar props.

---

## Testing Strategy

- Unit tests for `computeStatusWidgetSeverity` (5 cases, pure function — easy)
- Unit tests for `QualifiedTeamsWidget` and `AwardsWidget` following the `games-info-widget.test.tsx` pattern exactly (mock `next-intl/server`, mock `next/link`, render async component, assert text/structure)
- No integration tests needed — all data is passed as props

---

## Validation

1. `npm run test` — all existing tests pass + new widget tests pass
2. `npm run lint` — no lint errors
3. `npm run build` — no TypeScript errors
4. Visual: open hub page pre-tournament → two new widgets visible in grid; Standings/Groups placeholders gone
5. Visual: change `msUntilPredictionLock` values to test urgency colours (or use mockup)
6. Visual: logged-off user sees widgets with "Sign In" CTA, no count badge

---

## Acceptance Criteria Coverage

| AC | Implementation |
|----|----------------|
| Follow Games card example | Both widgets use identical DashboardCard + GamesInfoWidgetCta + LinearProgress structure |
| Urgency severity 48h/24h/2h | `computeStatusWidgetSeverity` + severity-coloured deadline box |
| Progress bar red | `LinearProgress color="error"` above CTA |
| Dynamic CTA text | 4-state logic (cta/ctaKeep/ctaFinish/ctaReview); login CTA when isLoggedOff |
| Conditional presence (pre-tournament only) | `{!hubData.isStarted && ...}` wrapper in hub page |
| Rules sections | `scoringRules.qualifiedTeams` / `scoringRules.awards` passed from hub |
| Data as props | All data from hub-fetched `actionCenterData`; zero new BE calls from widgets |
| Clean up placeholders | Standings and Groups DashboardCards removed from page.tsx |
