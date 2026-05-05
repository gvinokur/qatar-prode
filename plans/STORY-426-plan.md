# Story 426 Plan: QT Header Shows Auto-Fill Banner Before Group Stage Matches Are Complete

## Context

The Qualified Teams (QT) prediction status header displays Variant 6 ("pre-tournament-auto-fill-ready") whenever a user has predicted all group games (`predictedGroupGames >= totalGroupGames`). This condition is based purely on user predictions, with no awareness of whether the tournament has actually started and whether group games have been played.

**The Bug:** After a tournament starts, if a user pre-tournament predicted all group stage games, the QT header incorrectly shows the "Groups ready · auto-fill your qualifiers" banner — even while group matches are still being played and no actual standings exist yet.

**The Fix:** Add tournament-start and group-stage-completion awareness to `computeQTHeaderVariant()`. When the tournament has started but group stage is not yet complete, show a "group stage in progress, results pending" message instead of the auto-fill banner.

---

## Acceptance Criteria

- [ ] When tournament started + QT open + group stage not complete → QT header shows "group stage pending" message (NOT auto-fill banner)
- [ ] Pre-tournament + all group games predicted → QT header still shows auto-fill banner (no regression)
- [ ] After group stage completes → QT header shows auto-fill banner correctly
- [ ] Games header behavior is unchanged
- [ ] Works in EN and ES locales

---

## Technical Approach

### Root Cause

In `app/components/prediction-status-header/qt-header-variant.ts:172`:
```typescript
const groupsAllPredicted = predictedGroupGames >= totalGroupGames && totalGroupGames > 0;
if (groupsAllPredicted) {
  return { /* auto-fill banner */ };
}
```

This checks only whether the **user** has predicted all group games. It has no knowledge of:
1. Whether the tournament has started yet
2. Whether actual group game results exist

### Data Already Available

`QualifiedTeamsClientPage` already receives:
- `allGroupsComplete: boolean` — `true` when all groups have actual results (from `findQualifiedTeams()`)
- `tournamentStartDate?: Date` — earliest game date in the tournament

Both flow from the server page (`app/[locale]/tournaments/[id]/qualified-teams/page.tsx`) which already fetches them.

### Solution: Two New Optional Fields on `QTHeaderInput`

Add `tournamentStarted?: boolean` (default: `false`) and `groupStageComplete?: boolean` (default: `false`) to `QTHeaderInput`. These default to `false` so existing callers and tests have unchanged behavior.

**New variant priority (between Variant 5 and old Variant 6):**

```
... → lock-window-urgent →
[NEW] group-stage-pending (tournamentStarted && !groupStageComplete && groupsAllPredicted) →
pre-tournament-auto-fill-ready (!tournamentStarted || groupStageComplete) && groupsAllPredicted →
pre-tournament (fallback)
```

The new `groupStagePending` variant:
- Tone: `'calm'`
- Icon: `'info'`  
- Status: `"statusHeader.qt.groupStagePending.status"` → "Group stage in progress"
- Message: `"statusHeader.qt.groupStagePending.message"` → informational, no auto-fill action
- Shows chip (qualifier count)

---

## Files to Modify

| File | Change |
|------|--------|
| `app/components/prediction-status-header/qt-header-variant.ts` | Add `tournamentStarted?` and `groupStageComplete?` to `QTHeaderInput`; add new `groupStagePending` variant branch |
| `app/components/qualified-teams/qualified-teams-client-page.tsx` | Pass `tournamentStarted` and `groupStageComplete` to `computeQTHeaderVariant` |
| `locales/en/predictions.json` | Add `statusHeader.qt.groupStagePending.status` and `statusHeader.qt.groupStagePending.message` |
| `locales/es/predictions.json` | Spanish translations for the same keys |
| `app/components/prediction-status-header/__tests__/qt-header-variant.test.ts` | New test cases for the `groupStagePending` variant; update `baseInput` default to include new fields |
| `docs/code-structure/components/components-leaderboard-stats.md` | Update `QTHeaderInput` signature to reflect new optional fields |

---

## Mid-Level Design

### Call Graph Changes

No call graph changes. `computeQTHeaderVariant` already exists in the call graph; only its input signature and internal branching change.

---

### `app/components/prediction-status-header/qt-header-variant.ts` *(modified)*

**Changed interface:**

```typescript
export interface QTHeaderInput {
  isLocked: boolean;
  qtLockAt: Date | null;
  predictedGroupGames: number;
  totalGroupGames: number;
  qualifiersCompleted: number;
  qualifiersTotal: number;
  definedSoFar: number;
  correctSoFar: number;
  qtPointsEarned?: number;
  onAutoFillClick: () => void;
  tournamentId: string;
  locale: string;
  now?: Date;
  /** True once the tournament start date has passed. Defaults to false (pre-tournament). */
  tournamentStarted?: boolean;
  /** True once all group stage games have actual published results. Defaults to false. */
  groupStageComplete?: boolean;
}
```

**Changed function: `computeQTHeaderVariant(input: QTHeaderInput, t: TFunction)`** *(was: no tournamentStarted/groupStageComplete params)*

Logic change: After Variant 5 (urgency check), before existing Variant 6 (auto-fill), insert:

```typescript
// ── VARIANT 6a: group-stage-pending ─────────────────────────────────────────
// Tournament has started but group results not yet complete — suppress auto-fill banner
const tournamentStarted = input.tournamentStarted ?? false;
const groupStageComplete = input.groupStageComplete ?? false;
if (groupsAllPredicted && tournamentStarted && !groupStageComplete) {
  return {
    tone: 'calm',
    leadIcon: 'info',
    statusText: t('statusHeader.qt.groupStagePending.status'),
    chip,
    message: t('statusHeader.qt.groupStagePending.message'),
  };
}
```

The existing Variant 6 auto-fill check remains unchanged — it naturally fires for pre-tournament (`!tournamentStarted`) and post-group-stage (`groupStageComplete`) scenarios.

Tests:
- `groupStagePending` fires when `tournamentStarted=true`, `groupStageComplete=false`, `groupsAllPredicted=true`
- `groupStagePending` does NOT fire when `tournamentStarted=false` (pre-tournament → still shows auto-fill)
- `groupStagePending` does NOT fire when `groupStageComplete=true` (post-group-stage → shows auto-fill)
- `groupStagePending` does NOT fire when groups not fully predicted (falls through to default pre-tournament)
- `groupStagePending` shows chip, has message, has NO action (no auto-fill button)

---

### `app/components/qualified-teams/qualified-teams-client-page.tsx` *(modified)*

**Changed: `qtHeaderVariant` useMemo** — add two new fields to `computeQTHeaderVariant` call:

```typescript
const qtHeaderVariant = useMemo(
  () => computeQTHeaderVariant(
    {
      // ... existing fields unchanged ...
      tournamentStarted: !!tournamentStartDate && new Date() >= tournamentStartDate,
      groupStageComplete: allGroupsComplete,
    },
    tPredictions
  ),
  // add allGroupsComplete to deps
  [isLocked, qtLockAt, tournamentPredictionCompletion, qualifiedTeamsCompleted, 
   actualResults, correctSoFar, scoringBreakdown, locale, allGroupsComplete, tournamentStartDate]
);
```

No signature change to the component itself (`allGroupsComplete` and `tournamentStartDate` are already props).

Tests:
- (smoke test) renders without crash when `tournamentStarted=true` and `allGroupsComplete=false`

---

## Translation Strings

### `locales/en/predictions.json` — add inside `statusHeader.qt`:
```json
"groupStagePending": {
  "status": "Group stage in progress",
  "message": "Group stage matches are still being played. Auto-fill will be available once all group results are in."
}
```

### `locales/es/predictions.json` — add inside `statusHeader.qt`:
```json
"groupStagePending": {
  "status": "Fase de grupos en curso",
  "message": "Los partidos de la fase de grupos todavía se están jugando. El auto-completar estará disponible cuando estén todos los resultados."
}
```

---

## Implementation Steps

1. **`qt-header-variant.ts`**: Add `tournamentStarted?` and `groupStageComplete?` to `QTHeaderInput`; add `groupStagePending` variant branch before existing Variant 6
2. **`locales/en/predictions.json`**: Add `statusHeader.qt.groupStagePending` keys
3. **`locales/es/predictions.json`**: Add Spanish translations
4. **`qualified-teams-client-page.tsx`**: Pass `tournamentStarted` and `groupStageComplete` to `computeQTHeaderVariant`; update `useMemo` deps
5. **`qt-header-variant.test.ts`**: Add tests for the new `groupStagePending` variant; update `baseInput` to include new optional fields with defaults

---

## Testing Strategy

### Unit Tests (`qt-header-variant.test.ts`)

The shared `baseInput` fixture will be updated to include the new optional fields with their defaults:
```typescript
const baseInput = (overrides?: Partial<QTHeaderInput>): QTHeaderInput => ({
  // ... existing fields ...
  tournamentStarted: false,   // default: pre-tournament
  groupStageComplete: false,  // default: no actual results yet
  ...overrides,
});
```
This ensures all existing tests continue to pass unchanged (defaults match pre-tournament behavior).

New describe block: **"Variant 6a: group-stage-pending"**

| Test | Input | Expected |
|------|-------|----------|
| fires when tournament started, group stage not complete, groups all predicted | `tournamentStarted=true, groupStageComplete=false, predictedGroupGames=8, totalGroupGames=8` | `tone='calm'`, `leadIcon='info'`, `statusText='statusHeader.qt.groupStagePending.status'`, chip defined, no action |
| does NOT fire when tournament not started (pre-tournament) | `tournamentStarted=false, groupStageComplete=false, predictedGroupGames=8, totalGroupGames=8` | `statusText='statusHeader.qt.autoFillReady.status'` |
| does NOT fire when group stage complete | `tournamentStarted=true, groupStageComplete=true, predictedGroupGames=8, totalGroupGames=8` | `statusText='statusHeader.qt.autoFillReady.status'` |
| does NOT fire when groups not fully predicted | `tournamentStarted=true, groupStageComplete=false, predictedGroupGames=5, totalGroupGames=8` | falls through to `preTournament.status` |
| existing pre-tournament auto-fill test still passes | defaults (tournamentStarted=false) | `statusText='statusHeader.qt.autoFillReady.status'` (no regression) |
| does NOT fire when `totalGroupGames=0` | `tournamentStarted=true, groupStageComplete=false, predictedGroupGames=0, totalGroupGames=0` | falls through to `preTournament.status` (guarded by `totalGroupGames > 0` in `groupsAllPredicted`) |

Note: The `tournamentStarted` boolean is computed in the client page as `!!tournamentStartDate && new Date() >= tournamentStartDate` — the `>=` boundary ensures the pending state activates at the moment the tournament starts. This boundary is handled at the client-side useMemo level, not inside `computeQTHeaderVariant`.

### Manual Testing Checklist

- [ ] Pre-tournament with all games predicted: auto-fill banner visible
- [ ] Tournament started + no group results yet: "Group stage in progress" banner visible, no auto-fill button
- [ ] After group stage complete: auto-fill banner visible again

---

## Validation

- `npm run test` — all existing tests pass + new tests pass
- `npm run lint` — no lint errors
- `npm run build` — successful build
- Test on Vercel Preview with a tournament in each phase

---

## Out of Scope

- Changing the auto-fill action logic (it still computes from user predictions)
- Games header behavior
- Changes to lock/post-lock states
- Auto-fill after group stage using actual results (separate story)
