# Story #454 Plan: Show and edit team FIFA rank in backoffice

## Context

Story #449 (Done/Closed) added the `rank` field to the teams table and seeded FIFA World Rankings for all 48 FIFA 2026 teams. However, the TypeScript type (`TeamTable`) was not updated, and no UI exists to view or correct rank values without direct DB access. Story #454 surfaces rank in the backoffice Teams tab: display on cards and edit via the existing team dialog.

## Acceptance Criteria (from issue)

- [ ] Each team card in the Teams tab displays the current rank (or "—" if unranked)
- [ ] The team edit dialog includes a rank field (numeric, optional)
- [ ] Saving a rank of 0 or 1000+ is rejected with a validation error
- [ ] Clearing the field sets the rank to null (unranked)
- [ ] Changes are reflected immediately after saving

## Technical Approach

### 1. Migration (idempotent)

Add `rank INTEGER` column to teams table using `IF NOT EXISTS` so it's safe whether or not story #449 already applied the column directly to the DB.

### 2. TypeScript type update

Add `rank?: number | null` to `TeamTable` in `tables-definition.ts`. Kysely auto-derives `TeamNew`, `TeamUpdate`, and `Team` from this, so no other type changes are needed.

### 3. Test factory update

Add `rank: null` default to `testFactories.team()`.

### 4. Server-side validation in `team-actions.ts`

Both `createTeam` and `updateTeam` parse team data from FormData JSON. Add rank validation after parsing: if rank is provided (not null/undefined), it must be 1–999. Throw a descriptive error otherwise. This ensures validation even if the client-side check is bypassed.

### 5. Team dialog (`team-dialog.tsx`)

Add a `rank` state variable (`number | ''`, where `''` means unranked). Add a `TextField` (type="number") below the short_name field. Client-side validation in `handleSubmit` rejects 0 and ≥ 1000 before submission. The submitted JSON includes `rank: rankState === '' ? null : Number(rankState)`.

### 6. Team card (`tournament-teams-manager-tab.tsx`)

Add a small rank badge below the team name: `#${team.rank}` when ranked, or `—` when null. Placed in the `CardMedia` section below the existing name/short_name text.

## Visual Prototype

### Team card with rank badge

```
┌─────────────────────────────────┐
│ 🖊 (edit btn)                   │  ← top-right
│                                 │
│     [LOGO]   Argentina (ARG)    │
│               #3                │  ← rank badge
│                                 │
└─────────────────────────────────┘

Unranked team:
│     [LOGO]   Playoff B (PO-B)   │
│               —                 │  ← dash when null
```

### Team dialog rank field (positioned after Short Name)

```
┌─────────────────────────────────────────────────────┐
│  Edit Team: Argentina                               │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Team Name:    [Argentina               ]           │
│  Team Name (Localized): [i18n editor]               │
│  Short Name:   [ARG]   FIFA Rank: [3       ]        │
│                         Optional (1–999)             │
│                                                     │
│  Primary Color:  [████████████████]                 │
│  Secondary Color:[████████████████]                 │
│                                                     │
│  Team Logo: [image picker]                          │
│                                                     │
│  ❌ Rank must be between 1 and 999  (if invalid)    │
│                                                     │
│                       [Cancel]  [Save Changes]      │
└─────────────────────────────────────────────────────┘
```

**States:**
- Blank/empty rank field → saves as `null` (unranked)
- Rank 0 or ≥ 1000 → validation error shown before submission
- Valid rank (1–999) → saved as integer

## Files to Create / Modify

| File | Change |
|------|--------|
| `migrations/20260519000000_add_rank_to_teams.sql` | **NEW** — `ALTER TABLE teams ADD COLUMN IF NOT EXISTS rank INTEGER` |
| `app/db/tables-definition.ts` | **MODIFY** — add `rank?: number \| null` to `TeamTable` |
| `__tests__/db/test-factories.ts` | **MODIFY** — add `rank: null` to `team` factory |
| `app/actions/team-actions.ts` | **MODIFY** — server-side rank validation in `createTeam` and `updateTeam` |
| `app/components/backoffice/internal/team-dialog.tsx` | **MODIFY** — add rank TextField + client validation |
| `app/components/backoffice/tournament-teams-manager-tab.tsx` | **MODIFY** — display rank on team card |
| `__tests__/actions/team-actions-rank.test.ts` | **NEW** — unit tests for rank validation in actions |
| `docs/code-structure/db.md` | **UPDATE** — TeamTable now includes rank |
| `docs/code-structure/actions.md` | **UPDATE** — updateTeam/createTeam validate rank |
| `docs/code-structure/components/components-backoffice.md` | **UPDATE** — tournament-teams-manager-tab and team-dialog |

## Mid-Level Design

### Call Graph Changes

No new cross-layer flows. The existing flow is unchanged:
- `TournamentTeamsManagerTab` → `getTeamsMap` (tournament-actions)
- `TeamDialog` → `updateTeam` / `createTeam` (team-actions) → `updateTeam` / `createTeam` (team-repository)

`rank` flows through the existing JSON formData payload on the same path.

---

### `app/db/tables-definition.ts` *(modified)*

**Changed types:**

- **`TeamTable`** — adds `rank?: number | null`
  - `Team`, `TeamNew`, `TeamUpdate` are auto-derived via Kysely `Selectable`/`Insertable`/`Updateable`, no other changes needed.

---

### `app/actions/team-actions.ts` *(modified)*

**Changed functions:**

- **`createTeam(formData: FormData, tournamentId: string)`**: `Promise<Team>` *(no signature change)*
  Adds rank validation after `JSON.parse`: if `teamData.rank` is not null/undefined, throws if `rank <= 0 || rank >= 1000`. Non-numeric values are handled by the client (TextField type="number"), but the server treats any NaN value as invalid too.
  Calls: getLoggedInUser, s3Client.uploadFile, createTeamInDb, createTournamentTeam, applyLocalization
  Tests:
  - throws validation error when rank is 0
  - throws validation error when rank is 1000
  - throws validation error when rank is negative
  - accepts rank of null (unranked, treated same as undefined)
  - accepts rank = 1 (lower boundary)
  - accepts rank = 999 (upper boundary)

- **`updateTeam(teamId: string, formData: FormData)`**: `Promise<Team>` *(no signature change)*
  Same rank validation added after `JSON.parse`. Auth check (`getLoggedInUser`) runs first; rank validation only runs after the user is confirmed admin.
  Calls: getLoggedInUser, s3Client.uploadFile, deleteThemeLogoFromS3, updateTeaminDb, applyLocalization
  Tests:
  - throws Unauthorized when user is not admin (before rank validation runs)
  - throws validation error when rank is 0
  - throws validation error when rank is 1000
  - accepts rank of null (unranked, clears the field)
  - accepts rank = 1 (lower boundary)
  - accepts rank = 999 (upper boundary)

---

### `app/components/backoffice/internal/team-dialog.tsx` *(modified)*

**Changed component:**

- **`TeamDialog({ open, onClose, tournamentId, team, onTeamSaved })`**: `JSX.Element` *(no prop changes)*
  Adds `rank` state (`number | ''`), initializes from `team.rank ?? ''` on edit open, resets to `''` on create/close.
  Client validation in `handleSubmit`: if `rank !== ''` and `(rank <= 0 || rank >= 1000)`, sets error and returns early.
  JSON payload gains `rank: rank === '' ? null : Number(rank)`.
  New TextField placed in a new `Grid size={{ xs: 12, md: 6 }}` alongside short_name.

---

### `app/components/backoffice/tournament-teams-manager-tab.tsx` *(modified)*

**Changed component:**

- **`TournamentTeamsManagerTab({ tournamentId })`**: `JSX.Element` *(no prop changes)*
  Team card now renders a rank line below the name/short_name:
  `team.rank != null ? \`#\${team.rank}\` : '—'`
  Displayed as a `Typography` variant `caption` or `body2` inside the `CardMedia` box.

---

### `__tests__/actions/team-actions-rank.test.ts` *(new)*

Tests for rank validation in `createTeam` and `updateTeam`. Mocks:
- `getLoggedInUser` → returns `testFactories.user({ is_admin: true })`
- `createTeamInDb`, `updateTeaminDb` → resolved with `testFactories.team({ rank: 15 })` (or `rank: null` for null scenarios)
- `createTournamentTeam`, `s3Client` → no-op

Tests:
- `updateTeam` throws when rank = 0
- `updateTeam` throws when rank = 1000
- `updateTeam` throws when rank = -5
- `updateTeam` accepts rank = null (no error thrown)
- `updateTeam` accepts rank = 15 (no error thrown)
- `createTeam` throws when rank = 0
- `createTeam` accepts rank = null

## Implementation Steps

### Wave 1 — Foundation
1. Create migration `20260519000000_add_rank_to_teams.sql`
2. Update `TeamTable` in `tables-definition.ts` to add `rank?: number | null`
3. Update `testFactories.team()` to include `rank: null`

### Wave 2 — Server action validation
4. Add rank validation to `createTeam` and `updateTeam` in `team-actions.ts`
5. Write `__tests__/actions/team-actions-rank.test.ts`

### Wave 3 — UI
6. Update `team-dialog.tsx`: rank state, TextField, validation, JSON payload
7. Update `tournament-teams-manager-tab.tsx`: display rank on card

### Wave 4 — CODE-STRUCTURE & validation
8. Update `docs/code-structure/db.md`, `actions.md`, `components-backoffice.md`
9. Run `npm test`, `npm run lint`, `npm run build`

## Testing Strategy

**Unit tests (`__tests__/actions/team-actions-rank.test.ts`):**
- Rank boundary validation (0, negative, 1000, 999, 1, null/undefined)
- Auth check runs before rank validation (unauthorized test for `updateTeam`)
- Non-numeric rank: client TextField type="number" blocks this; server treats NaN as invalid

**Manual testing in Vercel Preview:**
- Teams tab shows rank values (e.g., Argentina → `#3`) and unranked teams show `—`
- Edit a ranked team → rank field pre-populated
- Change rank to 0 → see validation error, form not submitted
- Change rank to 1000 → see validation error
- Change rank to a valid value → saved, card updates immediately
- Clear rank field → saves as null, card shows `—`

## Validation (Quality Gates)

- `npm test` → all tests pass, ≥ 80% coverage on new code
- `npm run lint` → no ESLint errors
- `npm run build` → clean build, no TypeScript errors
- SonarCloud: 0 new issues of any severity
