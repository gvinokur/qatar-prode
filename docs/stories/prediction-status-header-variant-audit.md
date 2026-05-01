# StatusBanner Variant Audit — STORY: Phase-aware Prediction Status Header

**Source mockup:** `mockups/STORY-prediction-page-status-header-v4-hybrid.html`
**Replaces:** `app/components/prediction-status-bar.tsx` + `app/components/qualified-teams/qt-action-banner.tsx`
**Audit started:** 2026-05-01

---

## Audit Format (per variant)

```
### [page] / [variant-key]
- **Exists?** yes | no | merge-with-X
- **Trigger predicate:** (data conditions)
- **Status text rule:** (template + dynamic parts)
- **Chip:** label format + color rule
- **Boost data (Games only):** silver X/Y + gold X/Y source
- **Message/detail rule:** when shown, how composed
- **Action:** label rule + target route
- **Tone:** tone token
- **BE data needed:** [field] — exists? (yes/no/needs-add)
- **Open questions:**
- **Status:** pending | locked
```

---

## GAMES

### games / pre-tournament
- **Exists?** yes
- **Trigger predicate:**
  - `tournamentStartDate > now`
  - `predictedGroupGames >= 1 AND predictedGroupGames < totalGroupGames`
  - (No `0 / X` substate — there's always at least 1 prediction once user lands here)
- **Status text rule:** `"Kickoff en N días"` — always in days. Exact thresholds (today/mañana/etc.) deferred to planner.
- **Chip:**
  - Label: `"X / Y partidos"` where Y is the total group games for the tournament
  - Color: `default` (until urgency kicks in via deadline tone)
- **Boost data:**
  - Silver: `silverUsed / silverMax`
  - Gold: `goldenUsed / goldenMax`
  - Both come from BE per-user allocation (already exists in `prediction-status-bar.tsx` props)
- **Message rule:** static-ish copy nudging "complete groups before kickoff, then auto-fill QT in one tap"
- **Action:**
  - Label follows hub logic: `Empezar` (0 predicted — N/A here since trigger requires ≥1) / `Seguir` (in progress) / `Finalizar` (close to 100%)
  - Target: scroll to next unpredicted group game on same page (or first incomplete stage)
- **Tone:** `brand`
- **BE data needed:**
  - `tournamentStartDate` — yes (already in props)
  - `totalGroupGames` / `predictedGroupGames` — yes, **added in story #394** (per-stage split)
  - `silverUsed/silverMax`, `goldenUsed/goldenMax` — yes (already in props)
- **Action label logic:** reuse the Empezar / Seguir / Finalizar rule from `app/components/tournament-hub/games-prediction-widget.tsx` (planner: extract to shared util, e.g., `lib/prediction-action-label.ts`)
- **Open questions:** none
- **Status:** locked

---

### games / urgent-unpredicted (parameterized — replaces `groups-about-to-start-unpredicted` AND `r16-active`)
- **Exists?** yes — generalized
- **Trigger predicate:** at any point, `>=1` game starts within urgency-window AND has no prediction. Severity ladder (highest active wins):
  - `error` (deadlineNow): any unpredicted game starts in `< 2h`
  - `warning` (deadlineUrgent): any unpredicted game starts in `< 24h`
  - `info` (deadlineSoon): any unpredicted game starts in `< 48h`
- **Stage parameter:** `group` | `playoff` — drives chip + boost figures
  - For playoff stage, **Final + Third-place game are grouped together** (treated as one unit in the count denominator)
- **Status text rule:** summary count, not single-game name (avoid repeating game names already on screen):
  - `"{N} partido(s) sin predecir cierra(n) en < {window}"`
  - Window per severity: `2 h` / `24 h` / `48 h`
- **Chip:**
  - Label: `"X / Y partidos"` of the **current stage** (group OR playoff). Playoff Y collapses Final+Third into one slot.
  - Color: matches severity tone (`error` / `warning` / `info`-default)
- **Boost data:**
  - Silver: `silverUsed / silverMax`
  - Gold: `goldenUsed / goldenMax`
  - Both already in props
- **Message rule:**
  - Lists each soon-closing unpredicted game (not just the soonest) — e.g., bullet/inline list with team names + countdown per game
  - "¿Le metés boost?" tail appears only when user has any unused boost (`silverMax - silverUsed > 0 OR goldenMax - goldenUsed > 0`)
- **Action:**
  - Label: `"Predecilo"` (single soon-closing game) OR `"Predecir"` (multiple)
  - Target: navigates to the **next unpredicted game** in the soon-closing set
  - Color matches severity tone
- **Tone:** `deadlineNow` | `deadlineUrgent` | `deadlineSoon` driven by severity
- **BE data needed:**
  - Per-game `kickoffAt` + `userPrediction?` — yes (already available in `games: ExtendedGameData[]` + `gameGuesses` context)
  - Per-stage totals (group/playoff with Final+Third grouped) — group counts from #394; **needs verification**: does playoff total collapse Final+Third into one slot or does that need a small util?
  - `silverUsed/silverMax`, `goldenUsed/goldenMax` — yes
- **Action label logic:** reuse same hub helper (Empezar/Seguir/Finalizar) — but here action is always "Predecilo/Predecir" (urgency override), so label rule is local to variant
- **Open questions:**
  - Confirm "playoff stage with Final+Third grouped" math: is the `Y` for playoffs `R16(8) + QF(4) + SF(2) + Final-pair(1) = 15` or do we keep Final & Third as 2? Planner can decide; UX prefers grouped.
- **Status:** locked

### games / r16-active
- **Exists?** **MERGED** into `games / urgent-unpredicted` with `stage = playoff`. Remove as separate variant.
- **Status:** locked (merged)

### games / pre-groups-complete-nudge-qt
- **Exists?** yes
- **Trigger predicate:**
  - `predictedGroupGames == totalGroupGames` (all group games predicted)
  - AND QT predictions are still open (lock window not yet passed) AND QT not yet complete
  - Persists across pre-tournament AND tournament-started-but-QT-still-open windows
- **Status text rule:** `"Grupos completos · Clasificados cierran en {N} {días|horas}"` — countdown to QT lock
- **Chip:**
  - Label: `"Y / Y partidos"` (groups, full count)
  - Color: `success`
- **Boost data:**
  - Silver: `silverUsed / silverMax` (actual user values, no override)
  - Gold: `goldenUsed / goldenMax`
- **Message rule:** static nudge — "Grupos al 100%. Ya podés auto-completar tus clasificados."
- **Action:**
  - Label: `"Ir a Clasificados"` (always — autocomplete UX lives on QT page)
  - Target: `/predictions/qualified-teams` (or equivalent route)
- **Tone:** `success`
- **BE data needed:**
  - `predictedGroupGames` / `totalGroupGames` — yes (#394)
  - QT lock-window deadline — yes (existing tournament prediction lock logic)
  - QT completion state (open AND incomplete) — yes (`tournamentPredictions: TournamentPredictionCompletion`)
  - Boost usage — yes
- **Open questions:** none
- **Status:** locked

### games / r16-active
- **Status:** pending

### games / stage-active-caught-up (was `group-active-predicted` — generalized per stage)
- **Exists?** yes — generalized to any active stage (groups OR playoffs)
- **Trigger predicate:**
  - Tournament started AND a stage is active (groups, R16, QF, SF, Final)
  - Every game in the active stage closing within `< 48h` has a prediction (no urgency tier active)
- **Stage parameter:** `group` | `r16` | `qf` | `sf` | `final` (or generic "current/next open stage")
- **Status text rule:** dynamic next-batch info (no "Al día" prefix):
  - `"{N} partido(s) hoy"` (next-day games today)
  - `"{N} partido(s) mañana"`
  - `"{N} partido(s) en {D} días"`
- **Chip:**
  - Label: `"X / Y partidos"` for current stage
  - Color: `success` only when `X == Y`; neutral (`default`) otherwise
- **Boost data:**
  - Silver: `silverUsed / silverMax`
  - Gold: `goldenUsed / goldenMax`
- **Message rule:** compact — no `message`
- **Action:**
  - Label: `"Revisar"`
  - Target: scrolls/navigates to **first unlocked predicted game** (so user can edit before kickoff)
- **Tone:** `calm` (status color override `success.main` only when chip is success too)
- **BE data needed:**
  - Per-stage `predicted/total` — yes (#394)
  - Next-batch grouping (today/mañana/in N days) — needs verification: does the BE expose a "next games day" aggregate, or is it derivable client-side from `games: ExtendedGameData[]` kickoff timestamps?
  - Boost usage — yes
- **Open questions:**
  - For playoff stages with very few games (e.g., 1 SF left), do we keep the same "N partidos en D días" copy or shift to a per-game format ("ARG vs FRA en 3 días")?
- **Status:** locked

### games / awaiting-r16
- **Exists?** **NO — REMOVED**. When a stage finishes, transition directly to the next-stage variant (assume games have teams). No inter-stage gap state.
- **Status:** locked (removed)

### games / just-missed
- **Exists?** **NO — REMOVED**. Missed games not surfaced at the header level.
- **Status:** locked (removed)

### games / tournament-finished
- **Exists?** yes
- **Trigger predicate:** tournament fully ended (final played, all results in)
- **Status text rule:** `"Torneo finalizado · {correct} / {totalGames} aciertos"` (mirrors QT/Awards aciertos pattern)
- **Chip:** **none** (drop count chip)
- **Boost data:** **none** (drop boost chips)
- **Points (top-right):** total tournament points earned for game predictions (e.g., `"1.245 pts"`) — filled badge
- **Message rule:** rich expansion — `"Mirá cómo te fue y compará con tus grupos."`
- **Actions (inline right of message):**
  - `"Mis estadísticas"` → user stats page
  - `"Mis grupos"` → friend groups page
- **Tone:** `locked` (status color override `success.main`)
- **Stage label (top-left):** `"Finalizado"`
- **BE data needed:**
  - `tournamentEnded` flag — yes
  - Correct game predictions count + total — yes (existing scoring)
  - Total game-prediction points — yes (existing scoring)
  - User stats page route — exists
  - Friend groups page route — exists
- **Open questions:** none
- **Status:** locked

---

## QUALIFIED TEAMS

### qt / pre-tournament
- **Exists?** yes — **rich (non-compact)** variant
- **Trigger predicate:** QT predictions open AND group games **not all** predicted (`predictedGroupGames < totalGroupGames`)
- **Status text rule:** `"Predecí quién clasifica"` (planner can refine wording)
- **Chip:**
  - Label: `"X / Y clasificados"` (per-team count, not group count)
  - Color: `default` (neutral until further along)
- **Boost data:** none (QT never shows boosts)
- **Message rule:** `"Elegí manualmente o predecí los partidos primero."` (rich body)
- **Action:**
  - Label: `"Predecir Partidos"`
  - Target: navigates to Games page
- **Tone:** `calm` (or `brand` — TBD by planner)
- **Stage label (top-left):** **none** — drop entirely
- **BE data needed:**
  - `predictedGroupGames` / `totalGroupGames` — yes (#394)
  - `predictedQualifiers` / `totalQualifiers` (X/Y clasificados) — yes (per user)
  - QT lock-window state — yes
- **Open questions:** none
- **Status:** locked

### qt / pre-tournament-ready
- **Exists?** yes — **rich (non-compact)** variant
- **Trigger predicate:** QT predictions open AND `predictedGroupGames == totalGroupGames` AND QT not yet complete (applies even when QT is partially filled)
- **Status text rule:** `"Predecí quién clasifica"` (aligned with QT #1)
- **Chip:**
  - Label: `"X / Y clasificados"`
  - Color: `default` (neutral)
- **Boost data:** none
- **Message rule:** copy mentions **Y clasificados** (per-team count) AND surfaces the manual option, e.g. `"Tus grupos están listos — auto-completá tus {Y} clasificados en un toque o elegí manualmente acá abajo."`
- **Action:**
  - Label: `"Auto-completar"`
  - Behavior: leverage the existing `qt-action-banner.tsx` auto-complete logic (this header subsumes that banner). Fills QT from user's group-game predictions; manual edit remains available on the page itself.
- **Tone:** `brand`
- **Stage label (top-left):** none (per cross-cutting rule)
- **BE data needed:**
  - `predictedGroupGames` / `totalGroupGames` — yes (#394)
  - `predictedQualifiers` / `totalQualifiers` — yes
  - Auto-complete server action — yes (already invoked by `qt-action-banner.tsx`)
- **Open questions:** none
- **Status:** locked

### qt / lock-window-urgent (parameterized by severity)
- **Exists?** yes — **rich (non-compact)**, parameterized
- **Trigger predicate:** QT predictions open AND **incomplete** (`predictedQualifiers < totalQualifiers`) AND `predictedGroupGames == totalGroupGames` (auto-complete is a viable path) AND lock window approaching:
  - `error` (deadlineNow): lock in `< 2h`
  - `warning` (deadlineUrgent): lock in `< 24h`
  - `info` (deadlineSoon): lock in `< 48h`
  - (If group games also incomplete, see QT #1 amendment below — that variant gains the same urgency modifiers and shows a "Predecir manualmente" route since auto-complete isn't viable.)
- **Status text rule:** `"Clasificados cierran en {N}{h|d}"` (planner refines wording per threshold)
- **Chip:**
  - Label: `"X / Y clasificados"`
  - Color: matches severity (`error` / `warning` / `info-default`)
- **Boost data:** none
- **Message rule:** lead with the urgency, **prominently** offer manual editing alongside auto-complete (e.g., `"Tus clasificados cierran en {N}{h|d}. Auto-completá desde tus grupos o elegí manualmente."`)
- **Action:**
  - Label: `"Auto-completar"`
  - Behavior: same auto-complete logic from `qt-action-banner.tsx`
  - Color: matches severity tone
- **Tone:** `deadlineNow` | `deadlineUrgent` | `deadlineSoon`
- **Stage label (top-left):** none
- **BE data needed:**
  - QT lock datetime — yes
  - `predictedQualifiers` / `totalQualifiers` — yes
  - `predictedGroupGames` / `totalGroupGames` — yes (#394)
- **Open questions:** none
- **Status:** locked

### qt / pre-tournament — AMENDMENT (urgency modifiers)
- The base `qt / pre-tournament` variant (group games incomplete + QT open) **also gains the same severity ladder** as `lock-window-urgent` when lock window approaches:
  - `error` <2h, `warning` <24h, `info` <48h
- **Action remains `"Predecir Partidos"`** (target = Games page). There is no separate destination for manual QT entry — manual selection happens in-place on the QT page itself, so a button can't navigate "to manual mode."
- Message copy must still surface the manual option as available right here, e.g. `"Cierra en 18 h. Elegí manualmente acá abajo o predecí los partidos primero."` Planner can refine wording.
- Status/message copy adapts to surface the closing window.

### qt / NEW — `completed-pre-lock`
- **Exists?** yes (newly added)
- **Trigger predicate:** QT predictions open AND **complete** (`predictedQualifiers == totalQualifiers`) AND lock has not yet passed
- **Status text rule:** `"Clasificados listos · cierran en {N}{h|d}"` (planner refines)
- **Chip:** `"Y / Y clasificados"`, color `success`
- **Boost data:** none
- **Message rule:** compact (no `message`); manual edit is implicit on the page below
- **Action:** `"Recalcular"` — re-runs the auto-complete logic from the user's current group-game predictions (group picks may have changed since QT was filled). NOT "Revisar" — manual review/edit is what the user does on the page itself.
- **Tone:** `success` (calm) — no urgency tier override (always "ya está")
- **Stage label (top-left):** none
- **BE data needed:** existing QT progress + lock datetime + auto-complete server action (already exists in `qt-action-banner.tsx`)
- **Status:** locked

### qt / locked-pending
- **Exists?** yes
- **Trigger predicate:** QT lock has passed AND **no qualified teams officially defined yet** (no group has produced an official result) AND user has predicted at least some qualifiers (otherwise → `never-filled-locked`)
- **Status text rule:** `"Bloqueado · Fase de grupos en juego"`
- **Chip:**
  - Label: `"X / Y clasificados definidos"` (X = officially-confirmed-by-results so far; here X = 0)
  - Color: `default`
- **Boost data:** none
- **Message rule:** compact (no `message`)
- **Action:** none (predictions visible on the page)
- **Tone:** `locked`
- **Stage label (top-left):** none
- **BE data needed:**
  - QT lock state — yes
  - Officially-defined qualifier count (live from group results) — yes (existing tournament progression data)
  - User's predicted qualifier count (>0 to distinguish from `never-filled-locked`) — yes
- **Open questions:** none
- **Status:** locked

> **Implementation note:** Planner may collapse the four locked QT variants (`locked-pending` / `locked-partial` / `locked-all` / `never-filled-locked`) into one parameterized `locked` variant driven by `(definedSoFar, totalQualifiers, userPredictedCount, userCorrectCount)`. The user-facing states are distinct, but the rendering can share code.

### qt / locked-with-results (merges `locked-partial`, `locked-all`, `one-group-locked`)
- **Exists?** yes — generalized
- **Trigger predicate:** QT locked AND user has ≥1 prediction AND **at least 1 qualifier has been officially defined** by group results
- **Status text rule:**
  - Partial (`definedSoFar < totalQualifiers`): `"Bloqueado · {correct} / {totalQualifiers} aciertos hasta ahora"`
  - Complete (`definedSoFar == totalQualifiers`): `"Bloqueado · {correct} / {totalQualifiers} aciertos"`
  - Denominator is **always** total qualifiers in tournament (not picks, not "defined so far")
  - Per-team count throughout
- **Chip:** none (removed)
- **Boost data:** none
- **Points (top-right, complete sub-state only):** total QT prediction points (e.g., `"240 pts"`) — filled badge. Partial sub-state: no points display (running totals not yet final).
- **Message rule:**
  - Partial: compact (no `message`).
  - Complete: rich — `"Mirá cómo te fue y compará con tus grupos."` (shared terminal copy)
- **Actions:**
  - Partial: none.
  - Complete: inline right of message — `"Mis estadísticas"` + `"Mis grupos"`.
- **Tone:** `locked` (status color override `success.main` once any correct picks land)
- **Stage label (top-left):** none
- **BE data needed:**
  - QT lock state — yes
  - User predicted qualifiers (≥1) — yes
  - Defined-so-far count + correct-so-far count — yes
  - `totalQualifiers` — yes
  - QT points total — yes (existing scoring)
- **Open questions:** none
- **Status:** locked

### qt / locked-all
- **Exists?** **MERGED** into `qt / locked-with-results` (complete sub-state — `definedSoFar == totalQualifiers`).
- **Status:** locked (merged)

### qt / locked-all
- **Status:** pending

### qt / never-filled-locked
- **Exists?** yes
- **Trigger predicate:** QT locked AND user has 0 predictions (strictly 0)
- **Status text rule:** `"Bloqueado · no completaste a tiempo"`
- **Chip:** none (removed)
- **Boost data:** none
- **Message rule:** compact (no `message`)
- **Detail line:** `"Sin puntos por clasificados"`
- **Action:** none
- **Tone:** `locked` (status color override `error.main`)
- **Stage label (top-left):** none
- **BE data needed:**
  - QT lock state — yes
  - User predicted qualifier count (= 0) — yes
- **Open questions:** none
- **Status:** locked

### qt / one-group-locked
- **Exists?** **MERGED** into `qt / locked-with-results` (it's the same state with `definedSoFar = qualifiers from one group`).
- **Status:** locked (merged)

---

## AWARDS

### awards / pre-tournament (with urgency modifiers)
- **Exists?** yes — **rich (non-compact)**, parameterized by severity
- **Trigger predicate:** Awards open AND user has 0 to N-1 awards picked (incomplete)
- **Severity ladder** (mirrors QT pattern):
  - calm/brand (default): lock far away
  - `info` (deadlineSoon): lock in `< 48h`
  - `warning` (deadlineUrgent): lock in `< 24h`
  - `error` (deadlineNow): lock in `< 2h`
- **Status text rule:** `"Cierra en {N}{h|d}"` — generic; planner refines per-threshold copy
- **Chip:**
  - Label: `"X / Y premios"` (per-award count)
  - Color: matches severity (`default` / `info` / `warning` / `error`)
- **Boost data:** none
- **Message rule:** rich body — `"Elegí podio y premios individuales. Pensá en los equipos que predijiste pasar a la final."` (coherence hint folded in here; old `coherent-suggestion` variant removed)
- **Action:**
  - Label: contextual — `"Definir"` (X = 0) / `"Continuar"` (in progress) / `"Finalizar"` (close to N)
  - Behavior: opens the next unpredicted award (analogous to hub Empezar/Seguir/Finalizar pattern)
  - Color: matches severity tone in urgent sub-states
- **Tone:** `brand` (default) escalating to `deadlineSoon` / `deadlineUrgent` / `deadlineNow`
- **Stage label (top-left):** none
- **BE data needed:**
  - Awards lock datetime — yes
  - `predictedAwards` / `totalAwards` — yes
- **Open questions:** none
- **Status:** locked

### awards / NEW — `completed-pre-lock`
- **Exists?** yes (newly added)
- **Trigger predicate:** Awards open AND **complete** (`predictedAwards == totalAwards`) AND lock has not yet passed
- **Status text rule:** `"Premios listos · cierran en {N}{h|d}"` (planner refines)
- **Chip:** `"Y / Y premios"`, color `success`
- **Boost data:** none
- **Message rule:** compact (no `message`); manual review/edit happens on the page below
- **Action:** none (no equivalent of QT's "Recalcular" — Awards have no auto-complete source)
- **Tone:** `success` (calm, no urgency override)
- **Stage label (top-left):** none
- **BE data needed:** existing awards progress + lock datetime
- **Status:** locked

### awards / coherent-suggestion
- **Exists?** **NO — REMOVED**. Coherence hint folded into the rich message of `awards / pre-tournament`.
- **Status:** locked (removed)


### awards / locked-pending
- **Exists?** yes
- **Trigger predicate:** Awards lock has passed AND **no awards officially decided yet** AND user has ≥1 prediction (otherwise → `never-filled-locked`)
- **Status text rule:** `"Bloqueado · esperando resultados"`
- **Chip:** none (removed)
- **Boost data:** none
- **Message rule:** compact (no `message`)
- **Action:** none (predictions visible on the page)
- **Tone:** `locked`
- **Stage label (top-left):** none
- **BE data needed:**
  - Awards lock state — yes
  - Officially-decided award count (= 0) — yes
  - User's predicted award count (≥1) — yes
- **Open questions:** none
- **Status:** locked

> **Implementation note:** Planner may collapse the three locked Awards variants (`locked-pending` / `locked-with-results` / `never-filled-locked`) following the same pattern as QT — share rendering code, distinct copy.

### awards / locked-with-results (merges `locked-partial`, `locked-all`, `one-award-decided`)
- **Exists?** yes — generalized
- **Trigger predicate:** Awards locked AND user has ≥1 prediction AND **at least 1 award has been officially decided**
- **Status text rule:**
  - Partial (`decidedSoFar < totalAwards`): `"Bloqueado · {correct} / {totalAwards} aciertos hasta ahora"`
  - Complete (`decidedSoFar == totalAwards`): `"Bloqueado · {correct} / {totalAwards} aciertos"`
  - Denominator is **always** total awards in tournament (per-award count throughout)
- **Chip:** none (removed)
- **Boost data:** none
- **Points (top-right, complete sub-state only):** total Awards prediction points (e.g., `"180 pts"`) — filled badge. Partial sub-state: no points display.
- **Message rule:**
  - Partial: compact (no `message`).
  - Complete: rich — `"Mirá cómo te fue y compará con tus grupos."` (shared terminal copy)
- **Actions:**
  - Partial: none.
  - Complete: inline right of message — `"Mis estadísticas"` + `"Mis grupos"`.
- **Tone:** `locked` (status color override `success.main` once any correct picks land)
- **Stage label (top-left):** none
- **BE data needed:**
  - Awards lock state — yes
  - User predicted awards (≥1) — yes
  - Decided-so-far count + correct-so-far count — yes
  - `totalAwards` — yes
  - Awards points total — yes (existing scoring)
- **Open questions:** none
- **Status:** locked

### awards / locked-all
- **Exists?** **MERGED** into `awards / locked-with-results` (complete sub-state — `decidedSoFar == totalAwards`).
- **Status:** locked (merged)

### awards / one-award-decided
- **Exists?** **MERGED** into `awards / locked-with-results` (it's the same state with `decidedSoFar = 1`).
- **Status:** locked (merged)

### awards / never-filled-locked
- **Exists?** yes
- **Trigger predicate:** Awards locked AND user has 0 predictions (strictly 0)
- **Status text rule:** `"Bloqueado · no completaste a tiempo"`
- **Chip:** none (removed)
- **Boost data:** none
- **Message rule:** compact (no `message`)
- **Detail line:** `"Sin puntos por premios"`
- **Action:** none
- **Tone:** `locked` (status color override `error.main`)
- **Stage label (top-left):** none
- **BE data needed:**
  - Awards lock state — yes
  - User predicted award count (= 0) — yes
- **Open questions:** none
- **Status:** locked

---

## Cross-cutting design decisions

### Terminal / "results-in" pattern (shared across pages)
Three variants share the same shape so users get a consistent payoff view:
- `games / tournament-finished`
- `qt / locked-with-results` (complete sub-state)
- `awards / locked-with-results` (complete sub-state)

Common shape:
1. **Status text:** `"... · {correct} / {total} aciertos"` (Games adds aciertos to mirror QT/Awards).
2. **Top-right slot:** **Points earned** for that prediction type (e.g., `"1.245 pts"`) — distinct from the count chip; rendered as a filled badge so it reads as the payoff.
3. **Message:** rich expansion with a shared closeout line (e.g., `"Mirá cómo te fue y compará con tus grupos."`).
4. **Actions:** rendered **inline to the right of the message** (same row, not a separate row below) for consistency with all other rich variants. Set: `"Mis estadísticas"` + `"Mis grupos"`.


- **Header label slot (top-left):**
  - **Games:** drop the "Partidos" page name. Use the slot for the **current/next open stage** label (`"Grupos"`, `"Octavos"`, `"Cuartos"`, `"Semis"`, `"Final"`). For `tournament-finished`: `"Finalizado"`.
  - **QT and Awards:** **drop entirely** — no replacement (page title already conveys context).

### Action button color (all variants)
- All banner action buttons stay on the **standard primary palette** (`color="primary"`) regardless of banner tone (`deadlineNow` / `deadlineUrgent` / `deadlineSoon` / `success` / `brand` / etc.).
- **Why:** the codebase reserves `color="error"` and `color="warning"` for *destructive* actions (delete, leave, remove, make-private). Re-using those colors for "urgent but constructive" actions like *Predecir Partidos* would mis-signal intent and break the existing visual contract.
- **How to apply:**
  - Lead action: `variant="contained" color="primary"`.
  - Secondary action: `variant="outlined" color="primary"`.
  - The banner's tone (background tint + leading icon + status text) carries the urgency signal — the button stays neutral so the user reads it as "the safe forward action," not "danger."
- **Exception:** none in scope for this story. If a future variant needs a destructive action (e.g., "Borrar predicciones"), that single button may use `color="error"` per the existing convention.

## Cross-cutting BE notes

- Existing `PredictionStatusBarProps` (in `prediction-status-bar.tsx`):
  - `totalGames`, `predictedGames` (full tournament — likely needs splitting per stage)
  - `silverUsed/silverMax`, `goldenUsed/goldenMax`
  - `tournamentPredictions: TournamentPredictionCompletion`
  - `tournamentId`, `tournamentStartDate`
  - `games: ExtendedGameData[]`, `teamsMap`, `isPlayoffs`
- New shape needed (DRAFT — refine per variant):
  - per-stage counts: group / R16 / QF / SF / final — predicted vs total
  - per-stage closing-soon counts (next 2h, 24h, 48h)
  - QT predictions: `predicted/total groups`, `correct/total finalized`, `lock window state`
  - Awards predictions: `predicted/total awards`, `correct/total finalized`, `coherent suggestion candidate?`
  - Hub action-label rule (Empezar/Seguir/Finalizar) — find/centralize
