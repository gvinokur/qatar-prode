# Plan: Story #306 — Configurable Transfermarkt Import URL and Persistent Team IDs

## Context

Admins use the backoffice Players tab to import player rosters from Transfermarkt.com. Currently:
- The URL is hardcoded to the club team format (`/kader/verein/...`), so national-team tournaments (which use a different URL structure) cannot be imported.
- The Transfermarkt Team ID is not persisted — admins must re-enter it every time they re-import.

This story makes the URL template configurable per tournament and persists the Team ID on the team record, so re-imports are faster and support any Transfermarkt URL structure.

---

## Acceptance Criteria (from issue)

- Admins can configure a Transfermarkt URL template per tournament using mandatory placeholders `{teamName}` and `{teamId}`.
- The URL template is editable in the Tournament Data settings tab.
- The system persists a team's Transfermarkt ID after a successful import.
- When re-opening the import dialog, the Transfermarkt ID field is pre-filled.
- **Idempotency**: Re-importing must not change existing player IDs (already satisfied by the current name+age deduplication logic — no behavioral change needed).
- "Delete existing players" prunes only players absent from the new import (already correct — no change needed).

---

## File Impact Map

| File | Change | Layer |
|------|--------|-------|
| `migrations/20260402000000_add_transfermarkt_url_template_to_tournaments.sql` | New — ALTER TABLE tournaments | DB |
| `migrations/20260402000001_add_transfermarkt_id_to_teams.sql` | New — ALTER TABLE teams | DB |
| `app/db/tables-definition.ts` | Add fields to TournamentTable and TeamTable | DB |
| `app/actions/team-actions.ts` | Update getTransfermarktPlayerData, add saveTeamTransfermarktId | Actions |
| `app/actions/tournament-actions.ts` | Update createOrUpdateTournament to handle new field | Actions |
| `app/components/backoffice/tournament-main-data-tab.tsx` | Add URL template TextField to form | Components |
| `app/components/backoffice/PlayersTab.tsx` | Pre-fill team ID, persist after import, pass template | Components |
| `app/[locale]/backoffice/page.tsx` | Pass transfermarkt_url_template to PlayersTab | Pages |
| `docs/code-structure/components/components-backoffice.md` | Update PlayersTab entry | Docs |
| `docs/code-structure/actions.md` | Update team-actions entries | Docs |
| `docs/code-structure/db.md` | Note new fields on TournamentTable/TeamTable | Docs |

---

## Technical Approach

### 1. DB Migrations

**`20260402000000_add_transfermarkt_url_template_to_tournaments.sql`:**
```sql
ALTER TABLE tournaments
ADD COLUMN IF NOT EXISTS transfermarkt_url_template TEXT;
```

**`20260402000001_add_transfermarkt_id_to_teams.sql`:**
```sql
ALTER TABLE teams
ADD COLUMN IF NOT EXISTS transfermarkt_id TEXT;
```

No foreign keys or constraints — both are nullable plain text columns.

### 2. tables-definition.ts changes

Add to `TournamentTable`:
```ts
transfermarkt_url_template?: string | null
```

Add to `TeamTable`:
```ts
transfermarkt_id?: string | null
```

These flow automatically through `Selectable<>` to the `Tournament` and `Team` types used everywhere.

### 3. team-actions.ts changes

**`getTransfermarktPlayerData`** — update signature and URL construction:
- Add `urlTemplate?: string | null` parameter (after `tournamentId`)
- If template is provided, substitute `{teamName}` and `{teamId}` to form the URL
- Fallback to current hardcoded URL if no template

**`saveTeamTransfermarktId`** — new Server Action:
- Admin-only guard
- Calls `updateTeaminDb(teamId, { transfermarkt_id: transfermarktId })`
- Returns `void`

### 4. tournament-actions.ts changes

`createOrUpdateTournament` already reads arbitrary fields from the JSON payload and passes them to the repository update. The only change needed is to include `transfermarkt_url_template` in the field set that gets parsed and passed.

Look at line ~177: `formData.append('tournament', JSON.stringify({...}))` — the client already assembles a payload object. As long as the server action doesn't strip the field, it will flow through. Verify this and add it to the parsed object if needed.

### 5. tournament-main-data-tab.tsx changes

- Add `transfermarktUrlTemplate` state (string, defaulting to `''`)
- Load from `tournamentData.transfermarkt_url_template` in `useEffect`
- Add a `TextField` in the form for the template with helper text: `"Use {teamName} and {teamId} as placeholders. E.g.: https://www.transfermarkt.com/{teamName}/kader/verein/{teamId}/saison_id/2024/plus/1"`
- Include in the `JSON.stringify` payload on submit

### 6. PlayersTab.tsx changes

- Add `transfermarktUrlTemplate?: string | null` to the props interface
- In `openImportPlayersModal(team)`: pre-fill `setTransfermarktId(team.transfermarkt_id ?? '')`
- In `handleImportPlayers()`: after successful `createTournamentTeamPlayers`, call `saveTeamTransfermarktId(selectedTeam.id, transfermarktId)` (fire-and-forget — catch and log on failure but don't block)
- Pass `transfermarktUrlTemplate` to `getTransfermarktPlayerData` call

### 7. backoffice/page.tsx

Pass `transfermarktUrlTemplate={tournament.transfermarkt_url_template}` to both `<PlayersTab>` invocations (active + inactive tournament loops).

---

## Mid-Level Design

### Call Graph Changes

No new cross-layer flows. The existing flow (PlayersTab → team-actions → scraping) gains one outbound call to `saveTeamTransfermarktId` and gets the URL template threaded through. No new flows to add to the call graph.

### `app/db/tables-definition.ts` *(modified)*

**Changed interfaces (no new functions):**

- **`TournamentTable`**: Add `transfermarkt_url_template?: string | null`
- **`TeamTable`**: Add `transfermarkt_id?: string | null`

No repository functions change — Kysely's type inference propagates the new fields automatically.

---

### `app/actions/team-actions.ts` *(modified)*

**New functions:**

- **`saveTeamTransfermarktId(teamId: string, transfermarktId: string)`**: `Promise<void>`
  Server Action. Persists the Transfermarkt ID to the team record after a successful import.
  Calls: `getLoggedInUser`, `updateTeaminDb`
  Tests:
  - throws Unauthorized when user is not admin
  - calls updateTeaminDb with correct teamId and transfermarktId
  - does not throw when called with valid inputs

**Changed functions:**

- **`getTransfermarktPlayerData(transfermarktTeamName: string, transfermarktTeamId: string, tournamentId: string, urlTemplate?: string | null)`**: `Promise<PlayerData[]>` *(was: no urlTemplate param)*
  Constructs URL from template if provided (replacing `{teamName}` and `{teamId}`), otherwise uses current hardcoded URL.
  Calls: `getLoggedInUser`, `getTournamentStartDate`
  Tests:
  - uses hardcoded URL when urlTemplate is null/undefined
  - substitutes {teamName} and {teamId} from template when provided
  - uses hardcoded URL when template is missing {teamId} placeholder (falls back safely)
  - throws Unauthorized when user is not admin

---

### `app/actions/tournament-actions.ts` *(modified)*

**Changed functions:**

- **`createOrUpdateTournament(tournamentId: string | null, tournamentFormData: any, locale?: Locale)`**: no signature change
  Now reads and persists `transfermarkt_url_template` from the JSON payload.
  Tests: (existing tests unchanged; the field flows naturally if included in payload)

---

### `app/components/backoffice/tournament-main-data-tab.tsx` *(modified)*

No new exported functions. Component state additions and form field changes only.

---

### `app/components/backoffice/PlayersTab.tsx` *(modified)*

**Changed functions:**

- **`PlayersTab({ tournamentId, transfermarktUrlTemplate }: Props)`**: `JSX.Element` *(was: just tournamentId)*
  Accepts optional URL template prop. Pre-fills team's stored transfermarktId on modal open. Persists ID after successful import.
  Calls: `getPlayersInTournament`, `getTransfermarktPlayerData`, `createTournamentTeamPlayers`, `deleteTournamentTeamPlayers`, `saveTeamTransfermarktId` (new)
  Tests:
  - pre-fills transfermarktId from team.transfermarkt_id when opening import modal
  - calls saveTeamTransfermarktId with correct teamId and transfermarktId after successful import
  - does not crash when transfermarktUrlTemplate is undefined/null

---

## Testing Strategy

All tests use project-standard utilities: `testFactories.*` for mock data, `renderWithTheme()` for component rendering, `vi.mock()` / `vi.fn()` for mocking server actions and repositories.

### Unit Tests (new/updated in `__tests__/actions/`)

1. **`saveTeamTransfermarktId`** — vi.mock `updateTeaminDb`; test admin guard, verify `updateTeaminDb` called with correct `{ transfermarkt_id }`, no-throw on valid inputs
2. **`getTransfermarktPlayerData` URL construction** — vi.mock `fetch`; assert the URL used matches template substitution vs. fallback (null/undefined template, valid template, template missing `{teamId}`)

### Component Tests (new/updated)

3. **`PlayersTab` pre-fill behavior** — mock `getPlayersInTournament` returning `testFactories.team({ transfermarkt_id: '583' })`; use `renderWithTheme`; assert ID input has value `'583'` after opening modal
4. **`PlayersTab` persist behavior** — mock all actions with `vi.fn()`; simulate successful import; assert `saveTeamTransfermarktId` was called with correct teamId and id value

### Manual Validation (post-migration)

1. Apply migrations on local DB
2. Open backoffice → Tournament Data tab → set URL template → save → reload → verify it persists
3. Open Players tab → click "Import Players" on a team → verify ID field is empty (first time)
4. Complete a successful import → reopen dialog → verify ID is pre-filled

---

## Implementation Notes

- **No migration permission needed at planning time** — user must approve migration execution before running (per CLAUDE.md rule 6)
- The `saveTeamTransfermarktId` call in `handleImportPlayers` should be fire-and-forget (try/catch, log error, don't surface to user) since it's non-critical: the import already succeeded
- `transfermarktUrlTemplate` prop in PlayersTab should be optional (`string | null | undefined`) to remain backwards compatible with any existing tests

---

## Verification Checklist

- [ ] Migrations applied without errors
- [ ] `npm run build` passes (TypeScript types compile)
- [ ] `npm run test` passes
- [ ] `npm run lint` passes
- [ ] Tournament Data tab saves and loads URL template
- [ ] PlayersTab pre-fills team's stored ID
- [ ] Import completes and ID is persisted on team record
- [ ] Re-import of same players does not duplicate or change their IDs
