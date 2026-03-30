# Story #302: Per-page SEO Metadata

## Context

Every page currently renders the same generic title and description (e.g., "World Cup Predictions" / "Sports prediction platform"). This hurts SEO relevance and click-through rates because search engines and social media previews cannot distinguish a tournament page from the home page. The fix is to export `generateMetadata` from each key page/layout so Next.js injects entity-specific titles and descriptions into the HTML `<head>`.

---

## Approach

Add `generateMetadata` to 5 pages/layouts, add localized translation keys for metadata descriptions, and write unit tests for each new function.

**No new DB functions needed** — existing repo functions (`findTournamentById`, `findProdeGroupById`) already return all required data.

---

## Files to Modify

### 1. `app/[locale]/tournaments/[id]/layout.tsx` *(modified)*
Add `generateMetadata` that fetches the tournament by ID and returns a localized title + description.

- Calls `findTournamentById(id)` (already imported and called at line 107 in the render function)
- Title: `{tournament.long_name} | {appName}`
- Description: `t('tournament', 'metadata.description', { name: tournament.long_name })`
- OG/Twitter: uses same title/description + static `/web-app-manifest-512x512.png` fallback

### 2. `app/[locale]/tournaments/[id]/page.tsx` *(modified)*
Add `generateMetadata` for the tournament landing page. Same data as layout but needed per issue spec.

- Defers to same pattern as layout

### 3. `app/[locale]/friend-groups/[id]/page.tsx` *(modified)*
Add `generateMetadata` that fetches the friend group by ID.

- Calls `findProdeGroupById(id)` (already imported and called at line 40 in the render function)
- Title: `{group.name} | {appName}`
- Description: `t('groups', 'metadata.description', { name: group.name })`

### 4. `app/[locale]/tournaments/[id]/friend-groups/[group_id]/page.tsx` *(modified)*
Add `generateMetadata` using both tournament + group names.

- Calls `findProdeGroupById(group_id)` and `findTournamentById(id)` (already imported/used)
- Title: `{group.name} | {tournament.short_name} | {appName}`
- Description: `t('groups', 'metadata.description', { name: group.name })`

### 5. `app/[locale]/page.tsx` *(modified)*
Add `generateMetadata` with improved home page description (overrides the generic locale layout metadata for just the home route).

- Title: `{appName}` (unchanged)
- Description: `t('common', 'home.metadata.description')`

---

## Translation Files

### `locales/en/tournament.json` *(modified)*
Add:
```json
"metadata": {
  "description": "Make your predictions for {name} and compete with friends"
}
```

### `locales/es/tournament.json` *(modified)*
Add:
```json
"metadata": {
  "description": "Hace tus predicciones para {name} y compite con tus amigos"
}
```

### `locales/en/groups.json` *(modified)*
Add:
```json
"metadata": {
  "description": "View friend group standings and compete in {name}"
}
```

### `locales/es/groups.json` *(modified)*
Add:
```json
"metadata": {
  "description": "Ver la tabla de posiciones del grupo {name}"
}
```

### `locales/en/common.json` *(modified)*
In the existing `home` key, add:
```json
"home": {
  "metadata": {
    "description": "Make sports predictions, compete with friends, and track your standings across tournaments"
  },
  ...existing keys
}
```

### `locales/es/common.json` *(modified)*
Same pattern:
```json
"home": {
  "metadata": {
    "description": "Hacé tus predicciones deportivas, competí con amigos y seguí tus posiciones en cada torneo"
  },
  ...existing keys
}
```

---

## Mid-Level Design

### Call Graph Changes

No new cross-layer call relationships. Existing `findTournamentById` and `findProdeGroupById` are already in use within these files. `generateMetadata` is a Next.js static export, not a new layer boundary.

### `app/[locale]/tournaments/[id]/layout.tsx` *(modified)*

**New function:**

- **generateMetadata({ params })**: `Promise<Metadata>`
  Fetches tournament name and returns localized title/description/OG/Twitter metadata. Wraps DB call in try/catch to return appName fallback on any error.
  Calls: `findTournamentById`, `getTranslations`
  Tests:
  - returns `"{tournamentName} | {appName}"` as title when tournament exists
  - returns fallback appName as title when tournament not found (null)
  - returns fallback appName as title when repository throws an error
  - description contains the tournament name (localized)
  - openGraph.title matches the page title

### `app/[locale]/tournaments/[id]/page.tsx` *(modified)*

**New function:**

- **generateMetadata({ params })**: `Promise<Metadata>`
  Same as layout — redundant per-page override for the tournament landing page specifically.
  Calls: `findTournamentById`, `getTranslations`
  Tests:
  - returns `"{tournamentName} | {appName}"` as title when tournament exists
  - returns fallback appName when tournament not found
  - returns fallback appName when repository throws an error

### `app/[locale]/friend-groups/[id]/page.tsx` *(modified)*

**New function:**

- **generateMetadata({ params })**: `Promise<Metadata>`
  Fetches friend group name and returns localized metadata. Wraps DB call in try/catch to return appName fallback on error.
  Calls: `findProdeGroupById`, `getTranslations`
  Tests:
  - returns `"{groupName} | {appName}"` as title when group exists
  - returns fallback appName when group not found
  - returns fallback appName when repository throws an error
  - description contains the group name

### `app/[locale]/tournaments/[id]/friend-groups/[group_id]/page.tsx` *(modified)*

**New function:**

- **generateMetadata({ params })**: `Promise<Metadata>`
  Fetches both group and tournament, returns metadata with group name as primary identity. Wraps DB calls in try/catch to return appName fallback on any error.
  Calls: `findProdeGroupById`, `findTournamentById`, `getTranslations`
  Tests:
  - returns `"{groupName} | {tournamentShortName} | {appName}"` as title when both exist
  - falls back to `"{groupName} | {appName}"` when tournament not found
  - falls back to appName when group not found
  - returns fallback appName when repository throws an error

### `app/[locale]/page.tsx` *(modified)*

**New function:**

- **generateMetadata({ params })**: `Promise<Metadata>`
  Returns improved home page description overriding the generic locale layout metadata.
  Calls: `getTranslations`
  Tests:
  - returns improved description (not the generic `app.description` string)
  - title is the appName
  - openGraph metadata is present

---

## Implementation Steps

**Wave 1 — Translations (no code risk, no DB)**
1. Add `metadata` keys to `locales/en/tournament.json` and `locales/es/tournament.json`
2. Add `metadata` keys to `locales/en/groups.json` and `locales/es/groups.json`
3. Add `home.metadata.description` to `locales/en/common.json` and `locales/es/common.json`

**Wave 2 — Page metadata functions**
4. Add `generateMetadata` to `app/[locale]/tournaments/[id]/layout.tsx`
5. Add `generateMetadata` to `app/[locale]/tournaments/[id]/page.tsx`
6. Add `generateMetadata` to `app/[locale]/friend-groups/[id]/page.tsx`
7. Add `generateMetadata` to `app/[locale]/tournaments/[id]/friend-groups/[group_id]/page.tsx`
8. Add `generateMetadata` to `app/[locale]/page.tsx`

**Wave 3 — Tests**
9. Create `app/[locale]/tournaments/[id]/__tests__/layout-metadata.test.tsx`
10. Create `app/[locale]/tournaments/[id]/__tests__/page-metadata.test.tsx`
11. Create `app/[locale]/friend-groups/[id]/__tests__/page-metadata.test.tsx`
12. Create `app/[locale]/tournaments/[id]/friend-groups/[group_id]/__tests__/page-metadata.test.tsx`
13. Extend or create `app/[locale]/__tests__/home-metadata.test.tsx`

---

## Testing Strategy

All `generateMetadata` tests follow the same pattern as the existing `app/[locale]/__tests__/layout-metadata.test.tsx`:
- Mock `next-intl/server` with `vi.mock('next-intl/server', () => ({ getTranslations: async (...) => (key) => translations[locale][key] }))`
- Mock repository modules with `vi.mock('../../db/tournament-repository', () => ({ findTournamentById: vi.fn() }))` — these are direct module mocks, not `testFactories.*` (which are for component props, not pure DB functions)
- Call `generateMetadata` with `{ params: Promise.resolve({ locale, id, ... }) }`
- Assert `metadata.title`, `metadata.description`, `metadata.openGraph.title`

**Note on special characters:** Next.js Metadata API handles HTML encoding of entity names automatically (e.g., `&` becomes `&amp;` in the rendered HTML). No manual escaping needed in `generateMetadata`. Tests will use plain string assertions since the API returns raw strings that Next.js encodes downstream.

**Note on long names:** No truncation is implemented. Tournament and group names are user-entered strings with application-level validation. Metadata rendering with long names is accepted behavior — Next.js does not impose length limits in the Metadata object.

---

## Validation

1. `npm run test` — all tests pass, coverage ≥ 80% on changed files
2. `npm run lint` — no ESLint errors
3. `npm run build` — no TypeScript errors
4. Manual smoke test: visit `/en/tournaments/{id}` and check browser tab + view-source `<title>` tag
5. Use a social media preview tool (e.g. opengraph.xyz) with a tournament URL to verify OG metadata renders correctly

---

## CODE-STRUCTURE Files to Update
- `docs/code-structure/pages.md` — add `generateMetadata` entries for all 5 modified files
- Call graph: No changes needed (no new cross-layer flows introduced)
