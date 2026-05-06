# Story 426 Plan: QT Header Shows Auto-Fill Banner Before Group Stage Matches Are Complete

## Context

The Qualified Teams (QT) status header uses `computeQTHeaderVariant()` to decide which message to show. Variant 6 ("pre-tournament-auto-fill-ready") fires whenever `predictedGroupGames >= totalGroupGames` — meaning the user has predicted all group stage games. This condition is checked with no awareness of whether the tournament has started or whether group games are still being played in real life.

**The Bug**: If a user predicts all group games before the tournament starts, then the tournament starts and group stage matches begin playing, Variant 6 continues to show the "auto-fill available" banner. The banner should instead be suppressed while actual group games are in progress, showing a "group stage in progress" message instead.

**The Fix**: Add two optional flags to `QTHeaderInput` — `tournamentStarted` and `groupStageComplete` — and insert a new Variant 6a that intercepts the auto-fill banner path when the tournament has started but group stage hasn't been finalized yet.

---

## Acceptance Criteria

- [ ] When tournament started + QT open + group stage not finalized (`!allGroupsComplete`) + user predicted all groups → QT header shows "group stage in progress" message, NOT auto-fill banner
- [ ] Pre-tournament + all group games predicted → still shows auto-fill banner (no regression)
- [ ] After group stage finalized (`allGroupsComplete=true`) + all group games predicted → auto-fill banner shows correctly
- [ ] Games header behavior is unchanged
- [ ] Works in EN and ES locales

---

## Technical Approach

### Root Cause

In `app/components/prediction-status-header/qt-header-variant.ts:172`:

```typescript
// ── VARIANT 6: pre-tournament-auto-fill-ready ────────────────────────────────
const groupsAllPredicted = predictedGroupGames >= totalGroupGames && totalGroupGames > 0;
if (groupsAllPredicted) {
  return { /* auto-fill banner */ };
}
```

No knowledge of tournament start or group stage completion.

### Data Already Available in Client Page

`QualifiedTeamsClientPage` already receives as props (both from the server page):
- `allGroupsComplete: boolean` — `true` when all groups have DB-finalized standings (`is_complete=true` in `tournament_group_teams`)
- `tournamentStartDate?: Date` — earliest game date across all tournament games

Neither is currently passed to `computeQTHeaderVariant`.

### Solution: Two New Optional Fields on `QTHeaderInput`

Add `tournamentStarted?: boolean` (default `false`) and `groupStageComplete?: boolean` (default `false`) to `QTHeaderInput`. Defaults preserve all existing test and caller behavior unchanged.

**New variant priority order after fix:**

```
locked → completed-pre-lock → lock-window-urgent
  → [NEW] group-stage-in-progress  (tournamentStarted && !groupStageComplete && groupsAllPredicted)
  → pre-tournament-auto-fill-ready (!tournamentStarted || groupStageComplete) && groupsAllPredicted
  → pre-tournament (fallback)
```

New variant characteristics:
- Tone: `'calm'`
- Icon: `'info'`
- Status: `statusHeader.qt.groupStageInProgress.status`
- Message: `statusHeader.qt.groupStageInProgress.message`
- Shows chip (qualifier count)
- No action button

---

## Files to Modify

| File | Change |
|------|--------|
| `app/components/prediction-status-header/qt-header-variant.ts` | Add `tournamentStarted?` and `groupStageComplete?` to `QTHeaderInput`; add new variant branch |
| `app/components/qualified-teams/qualified-teams-client-page.tsx` | Pass `tournamentStarted` and `groupStageComplete` in `computeQTHeaderVariant` call; update useMemo deps |
| `locales/en/predictions.json` | Add `statusHeader.qt.groupStageInProgress.status` and `.message` |
| `locales/es/predictions.json` | Spanish translations for the same keys |
| `app/components/prediction-status-header/__tests__/qt-header-variant.test.ts` | New tests for group-stage-in-progress variant |
| `docs/code-structure/components/components-leaderboard-stats.md` | Update `QTHeaderInput` signature |

---

## Mid-Level Design

### Call Graph Changes

No call graph changes. `computeQTHeaderVariant` already exists in the call graph; only its input signature and internal branching change.

---

### `app/components/prediction-status-header/qt-header-variant.ts` *(modified)*

**Changed interface:**

```typescript
export interface QTHeaderInput {
  // ... existing fields unchanged ...
  /** True once the tournament's first game date has passed. Defaults to false (pre-tournament behavior). */
  tournamentStarted?: boolean;
  /** True once all groups in the tournament have finalized standings (allGroupsComplete from DB). Defaults to false. */
  groupStageComplete?: boolean;
}
```

**Changed function: `computeQTHeaderVariant(input: QTHeaderInput, t: TFunction)`**

After Variant 5 (lock-window-urgent), before existing Variant 6:

```typescript
// ── VARIANT 6a: group-stage-in-progress ──────────────────────────────────────
// Suppress auto-fill banner while actual group games are still being played
const tournamentStarted = input.tournamentStarted ?? false;
const groupStageComplete = input.groupStageComplete ?? false;
if (groupsAllPredicted && tournamentStarted && !groupStageComplete) {
  return {
    tone: 'calm',
    leadIcon: 'info',
    statusText: t('statusHeader.qt.groupStageInProgress.status'),
    chip,
    message: t('statusHeader.qt.groupStageInProgress.message'),
  };
}
```

Existing Variant 6 check is unchanged — it naturally fires for pre-tournament (`!tournamentStarted`) and post-group-stage (`groupStageComplete`) cases.

Tests:
- fires when `tournamentStarted=true`, `groupStageComplete=false`, all groups predicted
- does NOT fire when `tournamentStarted=false` (pre-tournament → shows auto-fill instead)
- does NOT fire when `groupStageComplete=true` (post-group-stage → shows auto-fill instead)
- does NOT fire when groups not fully predicted (falls through to pre-tournament fallback)
- shows chip, has message, has NO action button
- does NOT fire when `totalGroupGames=0` (guarded by `totalGroupGames > 0` in `groupsAllPredicted`)

---

### `app/components/qualified-teams/qualified-teams-client-page.tsx` *(modified)*

**Changed: `qtHeaderVariant` useMemo** — pass two new fields:

```typescript
const qtHeaderVariant = useMemo(
  () => computeQTHeaderVariant(
    {
      // ... existing fields unchanged ...
      tournamentStarted: !!tournamentStartDate && new Date() >= tournamentStartDate,
      groupStageComplete: allGroupsComplete,
    },
    tPredictions as (key: string, values?: Record<string, unknown>) => string
  ),
  [isLocked, qtLockAt, tournamentPredictionCompletion, qualifiedTeamsCompleted,
   actualResults, correctSoFar, scoringBreakdown, locale, allGroupsComplete, tournamentStartDate]
);
```

`allGroupsComplete` and `tournamentStartDate` are already props — no server page changes needed.

Tests:
- (existing tests unchanged — new fields default to false)

---

## Translation Strings

### `locales/en/predictions.json` — add inside `statusHeader.qt`:
```json
"groupStageInProgress": {
  "status": "Group stage in progress",
  "message": "Group stage matches are still being played. Auto-fill will be available once all group results are in."
}
```

### `locales/es/predictions.json` — add inside `statusHeader.qt`:
```json
"groupStageInProgress": {
  "status": "Fase de grupos en curso",
  "message": "Los partidos de la fase de grupos todavía se están jugando. El auto-completar estará disponible cuando estén todos los resultados."
}
```

---

## Implementation Steps

1. **`qt-header-variant.ts`**: Add `tournamentStarted?` and `groupStageComplete?` to `QTHeaderInput`; add new variant branch (Variant 6a) before existing Variant 6
2. **`locales/en/predictions.json`**: Add `statusHeader.qt.groupStageInProgress` keys
3. **`locales/es/predictions.json`**: Add Spanish translations
4. **`qualified-teams-client-page.tsx`**: Pass `tournamentStarted` and `groupStageComplete` in the `computeQTHeaderVariant` call; add both to useMemo deps
5. **`qt-header-variant.test.ts`**: Add test block for the new variant; update `baseInput` defaults to include new optional fields

---

## Testing Strategy

### Unit Tests (`qt-header-variant.test.ts`)

Update `baseInput` factory to include new fields with safe defaults:
```typescript
const baseInput = (overrides?: Partial<QTHeaderInput>): QTHeaderInput => ({
  // ... existing fields ...
  tournamentStarted: false,
  groupStageComplete: false,
  ...overrides,
});
```

New describe block: **"Variant 6a: group-stage-in-progress"**

| Test | Key inputs | Expected |
|------|-----------|----------|
| fires when tournament started, group stage ongoing, all groups predicted | `tournamentStarted=true, groupStageComplete=false, predictedGroupGames=8, totalGroupGames=8` | `tone='calm'`, `leadIcon='info'`, `statusText='statusHeader.qt.groupStageInProgress.status'`, chip defined, no action |
| does NOT fire pre-tournament (shows auto-fill instead) | `tournamentStarted=false, groupStageComplete=false, predictedGroupGames=8, totalGroupGames=8` | `statusText='statusHeader.qt.autoFillReady.status'` |
| does NOT fire when group stage complete (shows auto-fill) | `tournamentStarted=true, groupStageComplete=true, predictedGroupGames=8, totalGroupGames=8` | `statusText='statusHeader.qt.autoFillReady.status'` |
| does NOT fire when groups not fully predicted | `tournamentStarted=true, groupStageComplete=false, predictedGroupGames=5, totalGroupGames=8` | `statusText='statusHeader.qt.preTournament.status'` |
| does NOT fire when `totalGroupGames=0` | `tournamentStarted=true, groupStageComplete=false, predictedGroupGames=0, totalGroupGames=0` | falls through to pre-tournament |

### Manual Testing

- [ ] Pre-tournament with all groups predicted: auto-fill banner visible
- [ ] Tournament started + no group results yet: "Group stage in progress" banner visible, no auto-fill button
- [ ] After group stage complete: auto-fill banner visible again

---

## Validation

- `npm run test` — all existing tests pass + new tests pass
- `npm run lint` — no lint errors
- `npm run build` — successful build
- Test on Vercel Preview

---

## Out of Scope

- Auto-fill from actual results after group stage (separate story)
- Changes to Games header logic
- Changes to auto-fill action itself
- Changes to lock/post-lock display states
