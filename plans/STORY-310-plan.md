# Story #310: Add location data to tournaments for SportsEvent structured data

## Context

The SportsEvent JSON-LD added in story #303 is missing the `location` field required by Google's Rich Results Test. This story adds a `locations` JSONB column to the `tournaments` table so admins can configure city/country-level location names (e.g., "Qatar", "New York"). Story #303 will then use this data when generating JSON-LD structured data.

## Objective

Enable admins to configure one or more location names for each tournament, stored as a `locations` JSONB column (`string[]`) on the `tournaments` table. Provide read access via the existing tournament fetch for future JSON-LD integration.

## Acceptance Criteria

- [ ] Each tournament can have zero or more location names (e.g., "Qatar", "Lusail", "New York")
- [ ] Admins can add, edit, and remove locations for a tournament in the backoffice "Tournament Data" tab
- [ ] Tournaments with no locations configured show a clear "no locations" state in the UI
- [ ] `tournament.locations` returns `[]` for tournaments with no locations (supports graceful JSON-LD omission in story #303)

## Out of Scope

- JSON-LD integration (story #303 handles that)
- Coordinates (lat/lng) or postal addresses
- Linking locations to specific games or venues
- Integration with the existing `tournament_venues` table
- Displaying locations in the tournament UI (header, sidebar, etc.)

## Technical Approach

### Why JSONB over a separate table

Locations are a simple `string[]` — no metadata, no individual querying, no need for normalization. The `tournaments` table already uses JSONB for `theme` and i18n fields. A `locations JSONB DEFAULT '[]'` column keeps the implementation minimal: one migration, no new repository, no new server action. Uniqueness is enforced in the application layer.

### Database

`ALTER TABLE tournaments ADD COLUMN locations JSONB NOT NULL DEFAULT '[]'::jsonb`

### TypeScript Types

Add `locations: JSONColumnType<string[]>` to `TournamentTable` in `tables-definition.ts`. The existing `Tournament`, `TournamentNew`, `TournamentUpdate` derived types automatically include it via Kysely's `Selectable`/`Insertable`/`Updateable`.

### Server Actions

No new action file needed. Locations are saved via the existing `createOrUpdateTournament(tournamentId, formData, locale)` action — `parseFormData` extracts the locations array from FormData and it gets merged into the tournament update payload.

Add a thin `getTournamentLocations(tournamentId)` helper action for story #303's use (reads from the existing `findTournamentById` result).

### Admin UI

Extend `TournamentMainDataTab` with an inline "Tournament Locations" section (below Transfermarkt URL Template). Uses local React state (`string[]`) — no separate fetch needed since the tournament object already contains `locations`. Locations are saved with the main "Save Changes" button.

## Visual Prototype

```
Tournament Locations                              [ + Add Location ]
┌─────────────────────────────────────────────────────────────────┐
│  Qatar                                                    [🗑]   │
│  ─────────────────────────────────────────────────────────────  │
│  Lusail                                                   [🗑]   │
│  ─────────────────────────────────────────────────────────────  │
│  Al Rayyan                                                [🗑]   │
└─────────────────────────────────────────────────────────────────┘
```

Empty state:
```
Tournament Locations                              [ + Add Location ]
ℹ️  No locations defined for this tournament.
```

Each row is an inline `TextField` (variant="standard") with a delete `IconButton`. Changes are saved with the main "Save Changes" button.

## Files to Create

| File | Description |
|------|-------------|
| `migrations/20260406000000_add_locations_to_tournaments.sql` | ADD COLUMN locations JSONB |
| `app/actions/__tests__/tournament-location-actions.test.ts` | Unit tests for `getTournamentLocations` |

## Files to Modify

| File | Change |
|------|--------|
| `app/db/tables-definition.ts` | Add `locations: JSONColumnType<string[]>` to `TournamentTable` |
| `app/actions/tournament-actions.ts` | Add `getTournamentLocations`, update `parseFormData` to extract locations, update `createOrUpdateTournament` to include locations in save payload |
| `app/components/backoffice/tournament-main-data-tab.tsx` | Initialize `locations` state from `tournament.locations`, add location management UI section |
| `docs/code-structure/db.md` | Add `locations` field to `tournament-repository.ts` entry |
| `docs/code-structure/actions.md` | Add `getTournamentLocations`, update `createOrUpdateTournament` signature |
| `docs/code-structure/components/components-backoffice.md` | Update `TournamentMainDataTab` entry |
| `CODE-STRUCTURE.md` | Update call graph |

## Mid-Level Design

### Call Graph Changes

**YES — one existing flow modified:**

- **Modified: Tournament save flow** — `TournamentMainDataTab` (Client) → `createOrUpdateTournament(tournamentId, formData, locale)` now includes `locations: string[]` in the tournament data payload

No new cross-layer flows; `getTournamentLocations` is a thin wrapper over the existing tournament fetch.

---

### `migrations/20260406000000_add_locations_to_tournaments.sql` *(new)*

```sql
ALTER TABLE tournaments
  ADD COLUMN locations JSONB NOT NULL DEFAULT '[]'::jsonb;
```

---

### `app/db/tables-definition.ts` *(modified)*

Add to `TournamentTable`:
```typescript
locations: JSONColumnType<string[]>
```

---

### `app/actions/tournament-actions.ts` *(modified)*

**New exported function:**

- **`getTournamentLocations(tournamentId: string)`**: `Promise<string[]>`
  Returns the `locations` array from the tournament record. Returns `[]` if tournament not found.
  Calls: `findTournamentById`
  Tests:
  - returns empty array when tournament has no locations (empty JSONB array)
  - returns array of location strings for tournament with locations
  - returns empty array when tournament not found

**Modified private function:**

- **`parseFormData(formData: FormData)`**: `{ tournamentData: any; logoFile: File | null }`
  Now merges `locations` (parsed from FormData `'locations'` key) into `tournamentData`. Null-safe: defaults to `[]` when key absent.
  Tests:
  - includes locations array in returned tournamentData when key present
  - defaults locations to empty array when key absent
  - filters out empty/whitespace-only location strings before merging

**Modified exported function:**

- **`createOrUpdateTournament(tournamentId: string | null, tournamentFormData: FormData, locale: Locale)`**: `Promise<Tournament>` *(unchanged signature; `locations` now flows through `tournamentData`)*
  Calls: (unchanged) `validateAdminUser`, `parseFormData`, `getExistingTournament`, `handleLogoUpload`, `prepareTournamentData`, `saveOrUpdateTournament`, `cleanupOldLogo`, `applyLocalization`
  Tests (new scenarios only):
  - tournament is saved with provided locations array
  - tournament is saved with empty locations array when none provided
  - throws Unauthorized when non-admin attempts save (validateAdminUser guard)

---

### `app/components/backoffice/tournament-main-data-tab.tsx` *(modified)*

**Modified state initialization** (in `fetchTournamentData` useEffect):
```typescript
setLocations(tournamentData.locations ?? []);
```

**New state:** `const [locations, setLocations] = useState<string[]>([])`

**New handlers:**
- `handleLocationChange(index: number, newName: string)`: `void` — updates `locations[index]` by array index
- `addLocation()`: `void` — appends `''` to locations array
- `deleteLocation(index: number)`: `void` — removes `locations[index]`

**Modified `handleSubmit`:** Appends `formData.append('locations', JSON.stringify(locations.filter(l => l.trim() !== '')))`.

**New JSX section** below Transfermarkt URL Template: "Tournament Locations" with Add button, scrollable `List` of `TextField`+delete pairs, and empty `Alert`.

Note: Using array index as key/handler parameter is safe here because re-renders always use the current filtered list (no async key mismatches).

**Component tests:**
- renders "No locations" alert when `locations` is empty
- renders list of location TextFields for each location string
- adds new empty TextField when "Add Location" clicked
- removes correct entry when delete clicked
- sends locations JSON in FormData on submit (filters empty strings)

---

## Testing Strategy

### Action Tests (`tournament-location-actions.test.ts`)
Use `vi.mock('@/app/db/tournament-repository')` and `vi.mocked(findTournamentById)` for mock setup. Use `testFactories.tournament({ locations: ['Qatar', 'Lusail'] })` (or inline object) for fixture data. Cover:
- `getTournamentLocations` (empty, populated, not found)
- `parseFormData` locations extraction and filtering

### Component Tests
Use `vi.mock('../../actions/tournament-actions')` with `vi.mocked(getTournamentLocations)` returning fixture arrays. Use `renderWithTheme(<TournamentMainDataTab ... />)` from project test utilities. Cover:
- Verify location section renders, add/delete interactions update state

### Coverage Target
≥80% on changed code paths

## Implementation Steps

### Wave 1 — Data Layer
1. Create `migrations/20260406000000_add_locations_to_tournaments.sql`
2. Update `app/db/tables-definition.ts` — add `locations` field to `TournamentTable`

### Wave 2 — Actions Layer
3. Update `app/actions/tournament-actions.ts` — add `getTournamentLocations`, update `parseFormData`, update `createOrUpdateTournament`

### Wave 3 — UI
4. Update `app/components/backoffice/tournament-main-data-tab.tsx` — add location state, handlers, and UI section

### Wave 4 — Tests + Documentation
5. Create `app/actions/__tests__/tournament-location-actions.test.ts`
6. Update `docs/code-structure/db.md` (add `locations` to tournament entry)
7. Update `docs/code-structure/actions.md`
8. Update `docs/code-structure/components/components-backoffice.md`
9. Update `CODE-STRUCTURE.md` call graph

## Validation Considerations

- **Migration**: `ALTER TABLE` adding a `NOT NULL DEFAULT '[]'` column is safe on existing rows — Postgres backfills with the default.
- **SonarCloud**: No new quality issues; ≥80% coverage on new/changed code
- **TypeScript**: `JSONColumnType<string[]>` — Kysely automatically parses JSONB on read, so `tournament.locations` will be `string[]` at runtime
- **Deduplication**: Filter empty/whitespace strings before saving; UI should show an error if a duplicate name is entered (nice-to-have, not a hard requirement)
