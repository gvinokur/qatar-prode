# Plan: Fix Player Import — DOB Parsing & Delete Existing Players (#461)

## Story
[GitHub Issue #461](https://github.com/gvinokur/qatar-prode/issues/461)
- **Worktree:** `/Users/gvinokur/Personal/qatar-prode-story-461`
- **Branch:** `feature/story-461`

## Context

Two bugs in the Transfermarkt player import flow in the backoffice Players tab.

**Bug 1 — DOB parsing failures:** `getTransfermarktPlayerData` in `app/actions/team-actions.ts` parses the scraped DOB with `new Date(dobText)`. This silently fails for non-US date formats (e.g. `"05.03.1998"`, which `new Date` interprets as May 3rd or returns `Invalid Date`). Failed parses fall back to age 18.

**Bug 2 — Delete existing players not working:** The "delete existing players" checkbox does a diff-delete: removes players NOT in the new Transfermarkt list by matching on name+age. Because Bug 1 causes all new-import ages to default to 18, the age comparison always fails (e.g. `18 !== 28`), so `toDelete` ends up containing all existing players or none. The simpler and more reliable fix: when the checkbox is checked, wipe all existing players for the team first via `deleteAllTeamPlayersInTournament` (already exists in `team-actions.ts`), then import fresh.

## Files to Modify

| File | Change |
|------|--------|
| `app/actions/team-actions.ts` | Fix DOB parsing: replace `new Date()` with `dayjs` + `customParseFormat` |
| `app/db/tournament-guess-repository.ts` | Add `clearPlayerAwardSelections(playerIds)` |
| `app/actions/team-actions.ts` | Export `deleteSpecificTeamPlayers` (award cleanup + delete) and `updateTournamentTeamPlayer` (correct stale age/position) |
| `app/components/backoffice/PlayersTab.tsx` | Fix delete logic: diff-delete by name-only, with award cleanup for removed players |

## Background: Award Selections

`tournament_guesses` stores per-user award picks with 4 player FK columns:
`best_player_id`, `top_goalscorer_player_id`, `best_goalkeeper_player_id`, `best_young_player_id`.
**There is no FK cascade** — deleting a player leaves orphaned UUIDs silently.
We must NULL these out before deleting any players.
`tournaments` has the same 4 columns for final results (admin-set); we do NOT auto-clear those.

## Why diff-delete (not full wipe)

A full wipe assigns new UUIDs on reimport → all award selections for the team are lost.
Diff-delete (match by name) keeps existing player records for players still in the squad,
preserving their IDs and award selections. Only players removed from the squad are deleted,
and their award selections are cleaned up.

## Mid-Level Design

### Call Graph Changes
New call path added: `PlayersTab (handleImportPlayers)` → `deleteSpecificTeamPlayers` → `clearPlayerAwardSelections` + `deleteTournamentTeamPlayers`.

### `app/db/tournament-guess-repository.ts` *(modified)*

**New functions:**

- **clearPlayerAwardSelections(playerIds: string[])**: `Promise<void>`
  No-ops when `playerIds` is empty. Runs 4 separate `UPDATE tournament_guesses SET col = NULL WHERE col IN (playerIds)` queries (one per award column) using Kysely.
  Tests:
  - no-ops when playerIds is empty
  - clears `best_player_id` where it matches a deleted player
  - clears `top_goalscorer_player_id` where it matches
  - clears `best_goalkeeper_player_id` where it matches
  - clears `best_young_player_id` where it matches
  - does not affect rows whose award columns reference other players

### `app/actions/team-actions.ts` *(modified)*

**New functions:**

- **updateTournamentTeamPlayer(playerId: string, data: { age_at_tournament: number, position: string })**: `Promise<void>`
  Server Action. Admin-only. Updates age and position for an existing player record. Used to correct stale data on re-import.
  Calls: getLoggedInUser, updatePlayer
  Tests:
  - throws Unauthorized when non-admin
  - updates age_at_tournament and position on the player record
  - no-ops on fields not passed

- **deleteSpecificTeamPlayers(tournamentId: string, teamId: string, playerIds: string[])**: `Promise<void>`
  Server Action. Admin-only. Clears award selections for the given playerIds, then deletes those player records.
  Calls: getLoggedInUser, clearPlayerAwardSelections, deleteTournamentTeamPlayers
  Tests:
  - throws Unauthorized when non-admin
  - calls clearPlayerAwardSelections before deleting players
  - no-ops when playerIds is empty
  - deletes only the specified player IDs

**Changed functions:**

- **getTransfermarktPlayerData(...)** — internal parsing change only, signature unchanged
  - Add `import dayjs from 'dayjs'` and `import customParseFormat from 'dayjs/plugin/customParseFormat'`
  - The backend fetch already sends `Accept-Language: en-US,en;q=0.5` but Transfermarkt may not honor it for date formatting — the URL path is in German (`/kader/verein/`) and date format can vary independently of the language header
  - Replace `new Date(dobText)` block with `dayjs(dobText, formats, true)` where `formats = ['MM/DD/YYYY', 'MMM D, YYYY', 'DD.MM.YYYY', 'D MMM YYYY', 'YYYY-MM-DD']`
  - `MM/DD/YYYY` is first because `"05/25/1995 (31)"` is the confirmed browser-side format; if the server returns a different format, the next formats in the list will catch it
  - **Important ambiguity:** `MM/DD/YYYY` vs `DD/MM/YYYY` cannot be distinguished for dates where day ≤ 12. Do NOT add `DD/MM/YYYY` to the list — it would silently mis-parse ambiguous dates. If the server-side format turns out to be `DD/MM/YYYY`, we need to remove `MM/DD/YYYY` and add `DD/MM/YYYY` instead (not both).
  - Add `console.info('Transfermarkt raw DOB:', dobText)` in the parsing block **during this implementation** so the first test deploy reveals the actual server-side format. Remove this log once confirmed.
  - Log `console.error` with raw `dobText` when no format matches (keeps age-18 fallback but makes failures visible)
  - Tests:
    - parses `"Jan 5, 1998"` (US format) correctly
    - parses `"05.01.1998"` (European DD.MM.YYYY) correctly — not mis-read as May 3rd
    - parses `"5 Jan 1998"` (D MMM YYYY) correctly
    - parses `"01.01.1998"` (zero-padded European) correctly
    - falls back to age 18 and logs error when DOB is unparseable (e.g. `"99/99/9999"`)

### `app/components/backoffice/PlayersTab.tsx` *(modified)*

**Changed functions:**

- **handleImportPlayers()** — internal logic change, no signature
  - Replace `deleteTournamentTeamPlayers` import with `deleteSpecificTeamPlayers` from `team-actions`
  - Import `updateTournamentTeamPlayer` from `team-actions` (new action, see below)
  - **Always** (regardless of checkbox): for each Transfermarkt player whose name matches an existing player, call `updateTournamentTeamPlayer(existingPlayer.id, { age_at_tournament, position })`. This corrects stale ages from the old broken DOB parser.
  - When `deleteExistingPlayers === true`: compute `toDelete` by matching existing vs new import **by name only**. Call `deleteSpecificTeamPlayers(tournamentId, selectedTeam.id, toDelete.map(p => p.id))`. Update local `existingPlayers` to remove deleted entries.
  - Insert only players not already in DB by name (unchanged logic, now correct because updates handled separately)
  - Note: name-only matching assumes player names are unique per team (standard for real squad data).
  - Tests:
    - matched player with stale age is updated to the new age from Transfermarkt
    - matched player's position is updated if it changed
    - when `deleteExistingPlayers === false`, unmatched existing players are preserved (not deleted)
    - when `deleteExistingPlayers === true`, players not in the new import are identified by name and passed to `deleteSpecificTeamPlayers`
    - when `deleteExistingPlayers === true`, players whose name appears in the new import are NOT deleted (award selections survive)
    - when `deleteExistingPlayers === true` and a player is removed from squad, `deleteSpecificTeamPlayers` is called with that player's ID (verifies award cleanup integration)
    - when `deleteSpecificTeamPlayers` throws, the error propagates and import aborts

## Implementation Steps

1. `app/db/tournament-guess-repository.ts`: add `clearPlayerAwardSelections`
2. `app/actions/team-actions.ts`: add dayjs imports + fix DOB parsing; add `deleteSpecificTeamPlayers` and `updateTournamentTeamPlayer` actions
3. `app/components/backoffice/PlayersTab.tsx`: update imports; on import — update matched players (age+position), delete removed players with award cleanup, insert new players

## CODE-STRUCTURE Files to Update
- `docs/code-structure/db.md` — add `clearPlayerAwardSelections` to tournament-guess-repository section
- `docs/code-structure/actions.md` — add `deleteSpecificTeamPlayers`; update `getTransfermarktPlayerData`
- `docs/code-structure/components/components-backoffice.md` — update `handleImportPlayers` note
- Call graph: Add new flow for `deleteSpecificTeamPlayers`

## Verification
- Import a team from Transfermarkt → verify ages look correct (not all 18)
- A user selects a player for "best player" award → re-import same team with "delete existing players" checked → that player's award selection is preserved (player kept by name match)
- Re-import with a player removed from the squad → that player's award selection is NULLed out in `tournament_guesses`
- Re-import without checkbox → existing players and award selections fully preserved
