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
| `app/components/backoffice/PlayersTab.tsx` | Fix delete logic: full wipe via `deleteAllTeamPlayersInTournament` when checkbox checked |

## Mid-Level Design

### Call Graph Changes
No call graph changes. `PlayersTab.tsx` will import `deleteAllTeamPlayersInTournament` which already exists in `team-actions.ts` but wasn't used from this component.

### `app/actions/team-actions.ts` *(modified)*

**Changed functions:**

- **getTransfermarktPlayerData(...)** — internal parsing change only, signature unchanged
  - Add `import dayjs from 'dayjs'` and `import customParseFormat from 'dayjs/plugin/customParseFormat'`
  - Replace `new Date(dobText)` block with `dayjs(dobText, formats, true)` where `formats = ['MMM D, YYYY', 'DD.MM.YYYY', 'D MMM YYYY', 'YYYY-MM-DD', 'MM/DD/YYYY']`
  - Log `console.error` with raw `dobText` when no format matches (keeps age-18 fallback but makes failures visible)
  - Transfermarkt is always fetched in English (`?locale=page`) so month abbreviations are always English
  - Tests:
    - parses `"Jan 5, 1998"` (US format) correctly
    - parses `"05.01.1998"` (European DD.MM.YYYY) correctly → NOT mis-read as May 3rd
    - parses `"5 Jan 1998"` (D MMM YYYY) correctly
    - parses `"01.01.1998"` (zero-padded European) correctly
    - falls back to age 18 and logs error when DOB is unparseable (e.g. `"99/99/9999"`)

### `app/components/backoffice/PlayersTab.tsx` *(modified)*

**Changed functions:**

- **handleImportPlayers()** — internal logic change, no signature
  - Import `deleteAllTeamPlayersInTournament` from `../../actions/team-actions`
  - When `deleteExistingPlayers === true`: call `deleteAllTeamPlayersInTournament(tournamentId, selectedTeam.id)` BEFORE fetching Transfermarkt data, set `existingPlayers = []`
  - Remove the old diff-delete block (lines ~78–89 in current file)
  - Note: delete-then-import is not atomic. If delete succeeds but the Transfermarkt fetch fails, the team has no players. User retries the import (delete runs again, then import). This is acceptable UX for a backoffice admin operation.
  - Tests:
    - when `deleteExistingPlayers === false`, existing players preserved and only new ones added
    - when `deleteExistingPlayers === true`, `deleteAllTeamPlayersInTournament` is called with correct `tournamentId` and `selectedTeam.id` before the fetch
    - when `deleteExistingPlayers === true`, `existingPlayers` is set to `[]` before dedup filter runs
    - when `deleteExistingPlayers === true`, all Transfermarkt players are created (no dedup against empty list)
    - when `deleteAllTeamPlayersInTournament` throws, the error is caught and import aborts

## Implementation Steps

1. `app/actions/team-actions.ts`: add dayjs imports, replace `new Date(dobText)` block
2. `app/components/backoffice/PlayersTab.tsx`: add `deleteAllTeamPlayersInTournament` import, replace diff-delete block with full wipe

## CODE-STRUCTURE Files to Update
- `docs/code-structure/actions.md` — update `getTransfermarktPlayerData` description
- `docs/code-structure/components/components-backoffice.md` — update `handleImportPlayers` note
- Call graph: No changes

## Verification
- Import a team from Transfermarkt → verify ages look correct (not all 18)
- Re-import same team with "delete existing players" checked → all old players removed, fresh set imported
- Re-import same team WITHOUT checkbox → existing players preserved, only new ones added
