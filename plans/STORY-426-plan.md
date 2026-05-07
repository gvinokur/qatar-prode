# Story 426 Plan: QT Header Shows Auto-Fill Banner Before Group Stage Matches Are Complete

## Context

The Qualified Teams (QT) status header uses `computeQTHeaderVariant()` to decide which message to show. **Variant 5 (lock-window-urgent)** fires whenever the lock deadline is approaching, and unconditionally shows an auto-fill CTA regardless of whether the user has finished predicting group games.

**The Bug**: After a tournament starts and the qualifier lock window becomes active, a user who has NOT finished predicting group games still sees the auto-fill banner. The auto-fill option is only meaningful once group predictions are complete (it fills qualifiers based on group standings), so showing it before that is incorrect and confusing.

**The Fix**: Move `groupsAllPredicted` computation before Variant 5, then split Variant 5 into two sub-cases based on whether the user has completed group predictions — mirroring the non-urgent split between Variant 6 (auto-fill ready) and Variant 7/8 (pre-tournament):

- **Variant 5, groups complete**: current urgency + auto-fill CTA, message updated with more urgency
- **Variant 5, groups NOT complete**: same urgency tone, but CTA becomes "Predict Matches" (link to games page), message conveys urgency while clarifying they don't need to finish group predictions to pick qualifiers

---

## Acceptance Criteria

- [ ] Urgent + groups NOT complete → no auto-fill button; shows "Predict Matches" CTA; message is urgent but clarifies user can pick qualifiers manually
- [ ] Urgent + groups complete → auto-fill CTA present; urgency conveyed in message (no regression)
- [ ] Non-urgent + groups complete → auto-fill banner unchanged (Variant 6, no regression)
- [ ] Non-urgent + groups NOT complete → pre-tournament fallback unchanged (Variant 7/8, no regression)
- [ ] Games header behavior is unchanged
- [ ] Works in EN and ES locales

---

## Technical Approach

### Root Cause

In `app/components/prediction-status-header/qt-header-variant.ts`, `groupsAllPredicted` is currently computed **after** Variant 5:

```typescript
// ── VARIANT 5: lock-window-urgent ───────────────────────────────────────────
if (isUrgent) {
  // always shows auto-fill CTA — no check on groupsAllPredicted
  return { ..., action: { label: t('...autoFill.cta'), onClick: onAutoFillClick } };
}

// ── VARIANT 6: pre-tournament-auto-fill-ready ────────────────────────────────
const groupsAllPredicted = predictedGroupGames >= totalGroupGames && totalGroupGames > 0;
```

`groupsAllPredicted` needs to be hoisted before Variant 5 so it can gate the auto-fill action.

### No Interface Changes

`QTHeaderInput` already has `predictedGroupGames` and `totalGroupGames`. No new props needed. No changes to the client page.

### Fix: Hoist + Split Variant 5

```
locked → completed-pre-lock
  → urgent + groups complete    → auto-fill CTA (urgency message)
  → urgent + groups incomplete  → "Predict Matches" CTA (urgency + "no need to finish groups")
  → auto-fill ready (non-urgent, groups complete)
  → pre-tournament (fallback)
```

---

## Files to Modify

| File | Change |
|------|--------|
| `app/components/prediction-status-header/qt-header-variant.ts` | Hoist `groupsAllPredicted` before Variant 5; split Variant 5 on `groupsAllPredicted` |
| `locales/en/predictions.json` | Add `statusHeader.qt.lockWindowUrgentGroupsIncomplete` keys; optionally update `lockWindowUrgent.message` for more urgency |
| `locales/es/predictions.json` | Spanish translations for the same keys |
| `app/components/prediction-status-header/__tests__/qt-header-variant.test.ts` | New tests for the split Variant 5 |
| `docs/code-structure/components/components-leaderboard-stats.md` | No signature change; update variant description comment if present |

---

## Mid-Level Design

### Call Graph Changes

No call graph changes.

---

### `app/components/prediction-status-header/qt-header-variant.ts` *(modified)*

**Changed function: `computeQTHeaderVariant(input: QTHeaderInput, t: TFunction)`**

Hoist `groupsAllPredicted` and move the Variant 5 split:

```typescript
// hoist before Variant 5
const groupsAllPredicted = predictedGroupGames >= totalGroupGames && totalGroupGames > 0;

// ── VARIANT 5: lock-window-urgent ───────────────────────────────────────────
if (isUrgent) {
  const countdown = qtLockAt ? countdownLabel(qtLockAt, now) : '—';
  if (groupsAllPredicted) {
    return {
      tone: urgencyTone,
      leadIcon: urgencyIcon(urgencyTone),
      statusText: t('statusHeader.qt.lockWindowUrgent.status', { countdown }),
      chip,
      message: t('statusHeader.qt.lockWindowUrgent.message', { countdown }),
      action: { label: t('statusHeader.qt.lockWindowUrgent.cta'), onClick: onAutoFillClick },
    };
  }
  return {
    tone: urgencyTone,
    leadIcon: urgencyIcon(urgencyTone),
    statusText: t('statusHeader.qt.lockWindowUrgent.status', { countdown }),
    chip,
    message: t('statusHeader.qt.lockWindowUrgentGroupsIncomplete.message', { countdown }),
    action: { label: t('statusHeader.qt.lockWindowUrgentGroupsIncomplete.cta'), href: `/${locale}/tournaments/${tournamentId}/games?edit=next` },
  };
}

// ── VARIANT 6: pre-tournament-auto-fill-ready ────────────────────────────────
// (groupsAllPredicted already computed above — remove the duplicate declaration)
if (groupsAllPredicted) { ... }
```

Tests:
- urgent + groups complete → has auto-fill `onClick` action
- urgent + groups NOT complete → has `href` action pointing to games page, no `onClick`
- urgent + groups NOT complete → message uses `lockWindowUrgentGroupsIncomplete.message` key
- urgent + groups NOT complete + `totalGroupGames=0` → falls through (guarded by `totalGroupGames > 0`)
- non-urgent + groups complete → Variant 6 fires (auto-fill, no regression)
- non-urgent + groups NOT complete → pre-tournament fallback (no regression)

---

## Translation Strings

### `locales/en/predictions.json` — add inside `statusHeader.qt`:
```json
"lockWindowUrgentGroupsIncomplete": {
  "message": "Qualifiers lock in {countdown}. You can pick them manually now — you don't need to finish your group predictions first.",
  "cta": "Predict Matches"
}
```

Optionally update `lockWindowUrgent.message` to be more urgent:
```json
"lockWindowUrgent": {
  "message": "Qualifiers lock in {countdown} — auto-fill now or choose manually below."
}
```

### `locales/es/predictions.json` — add inside `statusHeader.qt`:
```json
"lockWindowUrgentGroupsIncomplete": {
  "message": "Los clasificadores se bloquean en {countdown}. Puedes elegirlos manualmente ahora — no necesitas terminar de predecir los partidos de grupos primero.",
  "cta": "Predecir Partidos"
}
```

---

## Implementation Steps

1. **`qt-header-variant.ts`**: Hoist `groupsAllPredicted` before Variant 5; split Variant 5 into groups-complete and groups-incomplete branches; remove duplicate `groupsAllPredicted` declaration from Variant 6
2. **`locales/en/predictions.json`**: Add `lockWindowUrgentGroupsIncomplete` keys
3. **`locales/es/predictions.json`**: Add Spanish translations
4. **`qt-header-variant.test.ts`**: Add/update tests for the split Variant 5 behavior

---

## Implementation Amendments

### Amendment 1: Variant 4 (completed-pre-lock) widened to fire on qualifiers alone
**Date:** 2026-05-07
**Reason:** Discovered during manual testing that users with all qualifiers filled but some group games still unpredicted were falling through to the urgent Variant 5 banner instead of the calm success state. The original Variant 4 guard required both `qtComplete` (groups AND qualifiers done). This was an undocumented bug exposed by the same root cause.
**Change:** Variant 4 now fires when `qualifiersComplete` alone (qualifiersCompleted >= qualifiersTotal && qualifiersTotal > 0), regardless of group game completion. The Recalculate CTA is conditionally rendered only when `groupsAllPredicted` is also true. Removed `groupsComplete` and `qtComplete` variables; hoisted `groupsAllPredicted` and introduced `qualifiersComplete` before Variant 4. New tests added: "qualifiers complete + groups NOT complete → success with no CTA" and "qualifiers complete + groups complete → success with Recalculate CTA".

## Testing Strategy

### Unit Tests (`app/components/prediction-status-header/__tests__/qt-header-variant.test.ts`)

New tests in the existing "Variant 5: lock-window-urgent" describe block:

Tests use the existing `baseInput` factory (`(overrides?: Partial<QTHeaderInput>) => QTHeaderInput`) and a mock `t` function that returns the key as-is.

| Test | Key inputs | Expected |
|------|-----------|----------|
| urgent + groups complete → auto-fill | `isUrgent=true, predictedGroupGames=8, totalGroupGames=8` | action has `onClick`, message key = `lockWindowUrgent.message` |
| urgent + groups NOT complete (partial) → predict matches | `isUrgent=true, predictedGroupGames=5, totalGroupGames=8` | action has `href` to games page, message key = `lockWindowUrgentGroupsIncomplete.message` |
| urgent + groups NOT complete (zero) → predict matches | `isUrgent=true, predictedGroupGames=0, totalGroupGames=8` | action has `href` to games page, message key = `lockWindowUrgentGroupsIncomplete.message` |
| urgent + totalGroupGames=0 → groups-incomplete branch | `isUrgent=true, predictedGroupGames=0, totalGroupGames=0` | `groupsAllPredicted=false` (guard `totalGroupGames>0` fails) → action has `href`, groups-incomplete message |
| non-urgent + groups complete → Variant 6 fires | `isUrgent=false, predictedGroupGames=8, totalGroupGames=8` | statusText = `autoFillReady.status` |
| non-urgent + groups NOT complete → pre-tournament | `isUrgent=false, predictedGroupGames=5, totalGroupGames=8` | statusText = `preTournament.status` |

### Manual Testing

- [ ] Lock window active, group predictions incomplete → "Predict Matches" CTA, urgent message, no auto-fill button
- [ ] Lock window active, group predictions complete → auto-fill button present
- [ ] Non-urgent, groups complete → auto-fill banner unchanged
- [ ] Non-urgent, groups incomplete → pre-tournament banner unchanged

---

## Validation

- `npm run test` — all existing tests pass + new tests pass
- `npm run lint` — no lint errors
- `npm run build` — successful build
- Test on Vercel Preview

---

## Out of Scope

- Changes to Games header logic
- Changes to auto-fill logic itself
- Changes to lock/post-lock display states

---

## CODE-STRUCTURE Files to Update

- `docs/code-structure/components/components-leaderboard-stats.md` — No signature change to `computeQTHeaderVariant`; update variant description if documented
- Call graph: No changes needed
