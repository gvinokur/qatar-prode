# Story #310: Add location data to tournaments for SportsEvent structured data

## Context

The SportsEvent JSON-LD added in story #303 is missing the `location` field required by Google's Rich Results Test. This story creates the data model and admin UI for tournament locations so admins can configure city/country-level names (e.g., "Qatar", "New York"). Story #303 will then use this data when generating JSON-LD structured data.

A partial reference implementation exists as uncommitted changes in the main worktree — the plan incorporates those patterns with bug fixes.

## Objective

Enable admins to configure one or more location names for each tournament, persisted in a dedicated `tournament_locations` table. Provide read access via a server action for future JSON-LD integration.

## Acceptance Criteria

- [ ] Each tournament can have zero or more location names (e.g., "Qatar", "Lusail", "New York")
- [ ] Admins can add, edit, and remove locations for a tournament in the backoffice "Tournament Data" tab
- [ ] Tournaments with no locations configured show a clear "no locations" state in the UI
- [ ] `getTournamentLocations` returns an empty array for tournaments with no locations (supports graceful JSON-LD omission in story #303)
- [ ] All CRUD location actions require admin authentication

## Out of Scope

- JSON-LD integration (story #303 handles that)
- Coordinates (lat/lng) or postal addresses
- Linking locations to specific games or venues
- Integration with the existing `tournament_venues` table
- Displaying locations in the tournament UI (header, sidebar, etc.)

## Technical Approach

### Database

New table `tournament_locations` with `(id, tournament_id, name, created_at, updated_at)`. Unique constraint on `(tournament_id, name)`. Cascade delete on tournament removal. Follows the same pattern as `tournament_venues`.

### Repository

New `app/db/tournament-location-repository.ts` using the project's `createBaseFunctions` utility plus a custom `findByTournamentId` function. Consistent with `tournament-venue-repository.ts`.

### Server Actions

Add to `app/actions/tournament-actions.ts`:
- `getTournamentLocations(tournamentId)` — public read, no admin check needed
- `createTournamentLocation`, `updateTournamentLocation`, `deleteTournamentLocation` — admin-only, for future direct CRUD use
- Private `handleLocationsUpdate(tournamentId, locations)` — batch sync called from `createOrUpdateTournament`
- Update `parseFormData` to extract locations with null safety
- Update `createOrUpdateTournament` to call `handleLocationsUpdate` after saving

### Admin UI

Extend `TournamentMainDataTab` with an inline "Tournament Locations" section (not a new tab). The section shows a scrollable list of location TextFields with delete buttons, plus an "Add Location" button. Locations are saved when the user clicks "Save Changes".

**Key design fix vs reference**: Use a `localId` field (stable UUID for new items, DB id for existing) to eliminate the key-matching bug in the uncommitted implementation.

### Testing

- Unit tests for `tournament-location-repository.ts` (mocked Kysely)
- Unit tests for location actions in `tournament-actions.ts` (mocked repository + auth)
- Component tests for the new locations UI in `TournamentMainDataTab`

## Visual Prototype

The "Tournament Data" tab already exists. Below the "Transfermarkt URL Template" field, add:

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

Each row is an inline `TextField` (variant="standard") with a delete `IconButton`. Changes are saved with the main "Save Changes" button at the bottom of the form.

## Files to Create

| File | Description |
|------|-------------|
| `migrations/20260406000000_create_tournament_locations.sql` | New table with unique constraint and cascade delete |
| `app/db/tournament-location-repository.ts` | Repository with base CRUD + `findByTournamentId` |
| `app/actions/__tests__/tournament-location-actions.test.ts` | Unit tests for location actions |
| `app/db/__tests__/tournament-location-repository.test.ts` | Unit tests for repository |

## Files to Modify

| File | Change |
|------|--------|
| `app/db/tables-definition.ts` | Add `TournamentLocationTable` interface + `TournamentLocation`, `TournamentLocationNew`, `TournamentLocationUpdate` types |
| `app/db/database.ts` | Import `TournamentLocationTable` + add `tournament_locations` entry |
| `app/actions/tournament-actions.ts` | Add location actions, `LocationFormDataType`, `handleLocationsUpdate`, update `parseFormData` + `createOrUpdateTournament` |
| `app/components/backoffice/tournament-main-data-tab.tsx` | Add location state/handlers/UI section |
| `docs/code-structure/db.md` | Add `tournament-location-repository.ts` entry |
| `docs/code-structure/actions.md` | Add location actions + update `createOrUpdateTournament` signature |
| `docs/code-structure/components/components-backoffice.md` | Update `TournamentMainDataTab` entry |
| `CODE-STRUCTURE.md` | Update call graph with new location flows |

## Mid-Level Design

### Call Graph Changes

**YES — new flows added:**

- **New: Location read flow** — `TournamentMainDataTab` (Client) →  `getTournamentLocations(tournamentId)` → `tournamentLocationRepository.findByTournamentId`
- **Modified: Tournament save flow** — `TournamentMainDataTab` (Client) → `createOrUpdateTournament(tournamentId, formData, locale)` (extended) → `handleLocationsUpdate(tournamentId, locations)` → `tournamentLocationRepository.{create|update|delete}`

---

### `migrations/20260406000000_create_tournament_locations.sql` *(new)*

```sql
CREATE TABLE tournament_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE (tournament_id, name)
);

CREATE INDEX idx_tournament_locations_tournament_id ON tournament_locations(tournament_id);

CREATE TRIGGER update_tournament_locations_updated_at
BEFORE UPDATE ON tournament_locations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

---

### `app/db/tables-definition.ts` *(modified)*

**New types:**

```typescript
export interface TournamentLocationTable extends Identifiable {
  tournament_id: string;
  name: string;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type TournamentLocation = Selectable<TournamentLocationTable>;
export type TournamentLocationNew = Insertable<TournamentLocationTable>;
export type TournamentLocationUpdate = Updateable<TournamentLocationTable>;
```

---

### `app/db/tournament-location-repository.ts` *(new)*

- **`tournamentLocationRepository.findByTournamentId(tournamentId: string)`**: `Promise<TournamentLocation[]>`
  Returns all locations for a tournament ordered by name. Uses `react.cache`.
  Tests:
  - returns empty array when tournament has no locations
  - returns locations sorted by name ascending
  - only returns locations for the specified tournament (not others)

- **`tournamentLocationRepository.create(data: TournamentLocationNew)`**: `Promise<TournamentLocation>`
  From `createBaseFunctions`. Inserts a new location row.
  Tests: covered by `createBaseFunctions` (shared utility)

- **`tournamentLocationRepository.update(id: string, data: TournamentLocationUpdate)`**: `Promise<TournamentLocation>`
  From `createBaseFunctions`. Updates a location by id.

- **`tournamentLocationRepository.delete(id: string)`**: `Promise<void>`
  From `createBaseFunctions`. Deletes a location by id.

---

### `app/actions/tournament-actions.ts` *(modified)*

**New private interface:**

```typescript
interface LocationFormDataType {
  id?: string;       // DB id, undefined for new unsaved items
  localId: string;   // Stable key: DB id for existing, UUID for new
  name: string;
  isDeleted?: boolean;
}
```

**New exported functions:**

- **`getTournamentLocations(tournamentId: string)`**: `Promise<TournamentLocation[]>`
  Reads all locations for a tournament. No admin check (read-only, called from admin page context).
  Calls: `tournamentLocationRepository.findByTournamentId`
  Tests:
  - returns empty array when no locations exist
  - returns array of TournamentLocation objects
  - delegates to repository with correct tournamentId

- **`createTournamentLocation(tournamentId: string, name: string)`**: `Promise<TournamentLocation>`
  Admin-only. Creates one location.
  Calls: `validateAdminUser`, `tournamentLocationRepository.create`
  Tests:
  - throws Unauthorized when user is not admin
  - creates and returns TournamentLocation when admin
  - passes correct tournament_id and name to repository

- **`updateTournamentLocation(locationId: string, name: string)`**: `Promise<TournamentLocation>`
  Admin-only. Updates location name.
  Calls: `validateAdminUser`, `tournamentLocationRepository.update`
  Tests:
  - throws Unauthorized when user is not admin
  - calls repository update with correct id and name
  - returns updated TournamentLocation

- **`deleteTournamentLocation(locationId: string)`**: `Promise<void>`
  Admin-only. Deletes a location.
  Calls: `validateAdminUser`, `tournamentLocationRepository.delete`
  Tests:
  - throws Unauthorized when user is not admin
  - calls repository delete with correct id
  - returns without error when location exists and is deleted successfully

**Modified private functions:**

- **`parseFormData(formData: FormData)`**: `{ tournamentData: any; logoFile: File | null; locations: LocationFormDataType[] }`
  Extracts tournament data, logo, and locations from FormData. Null-safe for locations. Trims location names and filters out empty/whitespace-only entries.
  Tests:
  - returns empty array when 'locations' key is absent
  - parses locations array from JSON string
  - handles empty locations array
  - trims whitespace and skips whitespace-only location names

- **`handleLocationsUpdate(tournamentId: string, locations: LocationFormDataType[])`**: `Promise<void>`
  Private. Diffs incoming locations against DB state, then creates/updates/deletes as needed. Skips items with empty names. Uses try-catch to log and skip individual errors; throws after processing all items if any errors occurred.
  Calls: `tournamentLocationRepository.findByTournamentId`, `tournamentLocationRepository.create`, `tournamentLocationRepository.update`, `tournamentLocationRepository.delete`
  Tests:
  - creates new locations (no id, not deleted, non-empty name)
  - updates existing locations (has id, not deleted)
  - deletes locations marked isDeleted
  - deletes locations present in DB but absent from incoming list (implicit delete)
  - skips items with empty name strings
  - logs and skips errors from individual repository operations (partial success)

**Modified exported functions:**

- **`createOrUpdateTournament(tournamentId: string | null, tournamentFormData: FormData, locale: Locale)`**: `Promise<Tournament>` *(was: `tournamentFormData: any`)*
  Now extracts and saves locations as part of the tournament save flow.
  Calls: `validateAdminUser`, `parseFormData` (updated), `getExistingTournament`, `handleLogoUpload`, `prepareTournamentData`, `saveOrUpdateTournament`, `cleanupOldLogo`, `handleLocationsUpdate`, `applyLocalization`
  Tests (new scenarios only):
  - locations are synchronized when saving a tournament
  - no-op on locations when empty array provided
  - returns Tournament and skips location sync if handleLocationsUpdate throws (error boundary)

---

### `app/components/backoffice/tournament-main-data-tab.tsx` *(modified)*

**New interface** (local, not exported):
```typescript
interface LocationFormDataType {
  id?: string;
  localId: string;  // stable key: DB id for existing, UUID for new
  name: string;
  isDeleted?: boolean;
}
```

**New state:** `const [locations, setLocations] = useState<LocationFormDataType[]>([])`

**New handlers:**
- `handleLocationChange(localId: string, newName: string)`: `void` — updates name by `localId`
- `addLocation()`: `void` — appends `{ localId: crypto.randomUUID(), name: '', isDeleted: false }`
- `deleteLocation(localId: string)`: `void` — marks matching item as `isDeleted: true`

**Modified `useEffect` (fetchTournamentData):** Also calls `getTournamentLocations(tournamentId)` and maps to `LocationFormDataType` with `localId: loc.id`.

**Modified `handleSubmit`:** Appends `formData.append('locations', JSON.stringify(locations))`.

**New JSX section** below Transfermarkt URL Template: "Tournament Locations" with Add button, scrollable `List` of `TextField`+delete pairs, and empty `Alert`.

Note: The `LocationFormDataType` interface is duplicated in `tournament-main-data-tab.tsx` (component state) and `tournament-actions.ts` (form parsing). This is intentional — the component type is purely local UI state; the action type is for parsing form data. They happen to have the same shape.

**Component tests:**
- renders "No locations" alert when no locations loaded
- renders list of location TextFields when locations exist
- adds new location field when "Add Location" clicked
- removes location from visible list when delete clicked
- sends locations JSON in FormData on submit

---

## Testing Strategy

### Repository Tests (`tournament-location-repository.test.ts`)
Mock `db` from `@/app/db/database`. Test `findByTournamentId` with mocked `selectFrom` chain using `vi.fn()` to create mock query builders.

### Action Tests (`tournament-location-actions.test.ts`)
Mock `tournamentLocationRepository` using `vi.mock()` and `getLoggedInUser` using `vi.mocked()`. Use `testFactories.createTournamentLocation()` for fixture data. Cover:
- All 4 exported location actions (happy path + unauthorized)
- `parseFormData` null-safety, parsing, and whitespace trimming
- `handleLocationsUpdate` diff logic (creates/updates/deletes/implicit deletes/partial errors)

### Component Tests
Extend or create tests for `TournamentMainDataTab`:
- Mock `getTournamentLocations` and `createOrUpdateTournament`
- Verify location list renders and interactions work

### Coverage Target
≥80% on new files (repository, actions, component location logic)

## Implementation Steps

### Wave 1 — Data Layer (prerequisite for everything)
1. Create `migrations/20260406000000_create_tournament_locations.sql`
2. Update `app/db/tables-definition.ts` — add `TournamentLocationTable` + types
3. Update `app/db/database.ts` — import + add to `Database` interface
4. Create `app/db/tournament-location-repository.ts`

### Wave 2 — Actions Layer
5. Update `app/actions/tournament-actions.ts` — add `LocationFormDataType`, location actions, `parseFormData` update, `handleLocationsUpdate`, `createOrUpdateTournament` update

### Wave 3 — UI
6. Update `app/components/backoffice/tournament-main-data-tab.tsx` — add location state, handlers, and UI section

### Wave 4 — Tests + Documentation
7. Create `app/db/__tests__/tournament-location-repository.test.ts`
8. Create `app/actions/__tests__/tournament-location-actions.test.ts`
9. Update `docs/code-structure/db.md`
10. Update `docs/code-structure/actions.md`
11. Update `docs/code-structure/components/components-backoffice.md`
12. Update `CODE-STRUCTURE.md` call graph

## Validation Considerations

- **Migration**: Requires running `20260406000000_create_tournament_locations.sql` against the DB before the app works (admin must run it)
- **SonarCloud**: No new quality issues; ≥80% coverage on new code
- **TypeScript**: `TournamentLocationTable` import in `database.ts` is critical — missing it causes compile error
- **Null safety**: `parseFormData` must handle `locationsJson` being null (e.g., if `createOrUpdateTournament` is called without locations)
- **UNIQUE constraint**: `(tournament_id, name)` — duplicate location names for the same tournament will throw at DB level; the UI should handle this gracefully (show error)

## Open Questions

None — requirements are clear. JSON-LD integration is out of scope per story notes.
