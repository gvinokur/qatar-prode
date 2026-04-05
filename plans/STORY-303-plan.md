# Plan: [Story] JSON-LD Structured Data (#303)

## Story Context

**Issue:** [#303](https://github.com/gvinokur/qatar-prode/issues/303)
**Branch:** `feature/story-303`
**Worktree:** `/Users/gvinokur/Personal/qatar-prode-story-303`

## Objective

Enable search engines to display rich results for tournament pages and help users understand the page hierarchy via breadcrumbs. Without structured data the app misses out on rich search result features (event previews, breadcrumb trails) that increase visibility and click-through rates.

## Acceptance Criteria

- [ ] Tournament pages include SportsEvent structured data (name, start date)
- [ ] Deep pages (results, stats, awards, qualified-teams, rules) include BreadcrumbList structured data
- [ ] Structured data is valid and passes Google's Rich Results Test
- [ ] Both English and Spanish versions include localized structured data
- [ ] No additional DB queries solely for JSON-LD

## Out of Scope

- Structured data for individual match results
- Person, player, or team schema
- FAQ, HowTo, Organization, or WebSite schema
- JSON-LD for friend-group pages

---

## Technical Approach

### Injection Method

JSON-LD is injected via `<script type="application/ld+json">` rendered by a new `JsonLd` server component in the page/layout JSX body. This is the Next.js-recommended pattern. Google reads JSON-LD from both `<head>` and `<body>`.

### No Extra DB Queries Strategy

**SportsEvent in layout:** `app/[locale]/tournaments/[id]/layout.tsx` already calls:
- `getTournamentAndGroupsData(params.id)` → returns `layoutData.tournament.long_name` (already localized)
- `getTournamentStartDate(params.id)` → returns `Date` of first game

Both values are already fetched. No extra query needed.

**BreadcrumbList in sub-pages:** Sub-page `generateMetadata` calls `findTournamentById` via `buildTournamentMetadata`. We wrap `findTournamentById` in `React.cache()` in `metadata-utils.ts` and export the cached version. Both `generateMetadata` (via `buildTournamentMetadata`) and the page default export share the same per-request cache. Effectively one DB call per request.

### SportsEvent Schema Shape

```json
{
  "@context": "https://schema.org",
  "@type": "SportsEvent",
  "name": "Copa América 2024",
  "startDate": "2024-06-20T18:00:00.000Z",
  "url": "https://lamaquina.app/en/tournaments/copa-america-2024"
}
```

`startDate` is sourced from `tournamentStartDate` (first game date). Location omitted — not in data model.

### BreadcrumbList Schema Shape

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://lamaquina.app/en" },
    { "@type": "ListItem", "position": 2, "name": "Copa América 2024", "item": "https://lamaquina.app/en/tournaments/copa-america-2024" },
    { "@type": "ListItem", "position": 3, "name": "Results", "item": "https://lamaquina.app/en/tournaments/copa-america-2024/results" }
  ]
}
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `app/utils/json-ld-utils.ts` | Pure builder functions for SportsEvent and BreadcrumbList |
| `app/components/shared/json-ld.tsx` | Reusable server component rendering `<script type="application/ld+json">` |
| `app/utils/__tests__/json-ld-utils.test.ts` | Unit tests for builder functions |
| `app/components/shared/__tests__/json-ld.test.tsx` | Unit tests for JsonLd component |

## Files to Modify

| File | Change |
|------|--------|
| `app/utils/metadata-utils.ts` | Add `React.cache()` wrapper around `findTournamentById`; export `findTournamentByIdCached`; update `buildTournamentMetadata` to use cached version |
| `app/[locale]/tournaments/[id]/layout.tsx` | Add `<JsonLd>` with SportsEvent using already-fetched `layoutData.tournament` and `tournamentStartDate` |
| `app/[locale]/tournaments/[id]/results/page.tsx` | Add `<JsonLd>` with BreadcrumbList (Home → Tournament → Results) |
| `app/[locale]/tournaments/[id]/stats/page.tsx` | Add `<JsonLd>` with BreadcrumbList (Home → Tournament → Stats) |
| `app/[locale]/tournaments/[id]/awards/page.tsx` | Add `<JsonLd>` with BreadcrumbList (Home → Tournament → Awards) |
| `app/[locale]/tournaments/[id]/qualified-teams/page.tsx` | Add `<JsonLd>` with BreadcrumbList (Home → Tournament → Qualified Teams) |
| `app/[locale]/tournaments/[id]/rules/page.tsx` | Add `<JsonLd>` with BreadcrumbList (Home → Tournament → Rules) |

---

## Mid-Level Design

### Call Graph Changes

YES — New flows for JSON-LD rendering in the metadata/page pipeline:

**Modified flows:**
- **Tournament layout render** — extends to call `buildSportsEventJsonLd` + render `<JsonLd>` using already-fetched `layoutData.tournament.long_name` and `tournamentStartDate`
- **Sub-page render** (results, stats, awards, qualified-teams, rules) — extends to call `findTournamentByIdCached` + `buildBreadcrumbListJsonLd` + render `<JsonLd>`; the cache deduplicates with `generateMetadata`'s `findTournamentByIdCached` call

**New flows:**
- Layout → `buildSportsEventJsonLd` → `<JsonLd>`
- Sub-page `generateMetadata` → `buildTournamentMetadata` → `findTournamentByIdCached`
- Sub-page default export → `findTournamentByIdCached` (cache hit) → `buildBreadcrumbListJsonLd` → `<JsonLd>`

---

### `app/utils/json-ld-utils.ts` *(new)*

**New types:**

```typescript
export interface BreadcrumbItem {
  name: string
  url: string
}
```

**New functions:**

- **`buildSportsEventJsonLd(name: string, url: string, startDate: Date)`**: `object`
  Returns a schema.org SportsEvent JSON-LD object with `@context`, `@type`, `name`, `startDate` (ISO string), and `url`.
  Tests:
  - returns object with `@context: "https://schema.org"` and `@type: "SportsEvent"`
  - `name` field matches the provided tournament name
  - `startDate` is a valid ISO 8601 string derived from the provided Date
  - `url` field is included correctly

- **`buildBreadcrumbListJsonLd(items: BreadcrumbItem[])`**: `object`
  Returns a schema.org BreadcrumbList JSON-LD object. Each item maps to a `ListItem` with `position` (1-indexed), `name`, and `item` (url).
  Tests:
  - returns object with `@context: "https://schema.org"` and `@type: "BreadcrumbList"`
  - `itemListElement` has correct length matching input array
  - positions are 1-indexed sequentially
  - each item has correct `name` and `item` (url) values
  - returns empty `itemListElement` for empty input array

---

### `app/components/shared/json-ld.tsx` *(new)*

**New functions:**

- **`JsonLd({ data }: { data: object })`**: `JSX.Element`
  Server component. Renders `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />`. No client code needed.
  Tests:
  - renders a `<script>` element with `type="application/ld+json"`
  - `dangerouslySetInnerHTML.__html` is the JSON-serialized form of `data`
  - handles nested objects correctly

---

### `app/utils/metadata-utils.ts` *(modified)*

**New exports:**

- **`findTournamentByIdCached`**: `(id: string) => Promise<Tournament | undefined>`
  `cache()`-wrapped version of `findTournamentById`. Deduplicates calls within the same React render request. Used by `buildTournamentMetadata` internally and exported for page components needing tournament data for JSON-LD breadcrumbs.
  Tests (existing tests unchanged — `buildTournamentMetadata` behavior does not change):
  - returns a Tournament object with correct fields when tournament exists (happy path)
  - calling `findTournamentByIdCached` twice with the same id within a test returns the same object reference (cache deduplication)
  - `buildTournamentMetadata` still returns fallback `{ title: appName }` when tournament not found

**Changed functions:**

- **`buildTournamentMetadata(id, appName, buildTitle, buildDescription)`**: `Promise<Metadata>` *(internal implementation change only — signature unchanged)*
  Now calls `findTournamentByIdCached` instead of `findTournamentById`. Behavior is identical; the change enables cache sharing with page components.
  Calls: `findTournamentByIdCached`, `buildPageMetadata`
  Tests: all existing tests remain valid; no new test scenarios introduced

---

### `app/[locale]/tournaments/[id]/layout.tsx` *(modified)*

**Changed functions:**

- **`TournamentLayout` default export** *(adds JSON-LD render)*
  Renders `<JsonLd data={buildSportsEventJsonLd(...)}>` as the first child of the returned JSX, using already-fetched `layoutData.tournament.long_name` and `tournamentStartDate`. Wrapped in a null-guard: only rendered when `layoutData.tournament` is not null. The URL is constructed from `process.env.NEXT_PUBLIC_APP_URL`, `locale`, and `params.id`.
  Calls: `buildSportsEventJsonLd`, `JsonLd`
  Tests:
  - renders `<script type="application/ld+json">` when tournament data is available
  - does NOT render JSON-LD script when tournament is null (e.g., dev tournament without permission)
  - rendered JSON-LD contains correct `name` matching tournament's `long_name`

---

### Sub-pages: results, stats, awards, qualified-teams, rules *(pattern repeated × 5)*

Each sub-page default export is modified using this pattern (example for results):

- **`ResultsPage` default export** *(adds breadcrumb JSON-LD)*
  Fetches tournament via `findTournamentByIdCached(tournamentId)` (cache hit — no extra DB query). Constructs breadcrumb items: Home → Tournament Name → Page Name. Renders `<JsonLd data={buildBreadcrumbListJsonLd(items)} />` as the first child of the returned JSX. If tournament is null (not found), skips JSON-LD gracefully.
  Calls: `findTournamentByIdCached`, `buildBreadcrumbListJsonLd`, `JsonLd`, existing data fetches
  Tests (new test file per page):
  - renders `<script type="application/ld+json">` when tournament exists
  - JSON-LD contains 3 breadcrumb items in correct order
  - first item `name` is the translated "Home" label
  - second item `name` matches tournament's `long_name`
  - third item `name` is the page-specific label (e.g., "Results")
  - does NOT render JSON-LD when tournament is null

---

## Testing Strategy

### New test files
- `app/utils/__tests__/json-ld-utils.test.ts` — pure unit tests, no mocks needed
- `app/components/shared/__tests__/json-ld.test.tsx` — shallow render check for script output

### Updated test files
- `app/[locale]/tournaments/[id]/__tests__/layout.test.tsx` *(new, layout JSON-LD)* — mock `getTournamentAndGroupsData`, `getTournamentStartDate`, `JsonLd`, `buildSportsEventJsonLd`; use `testFactories.createTournament()` for tournament mock objects; verify render behavior
- One new `__tests__/page-json-ld.test.tsx` per sub-page — mock `findTournamentByIdCached` and `getTranslations`; use `testFactories.createTournament()` for tournament data; mock `JsonLd` and builder functions; verify breadcrumb count, names, and null-fallback behavior
- Note: pure function tests in `json-ld-utils.test.ts` use inline literal objects (BreadcrumbItem, schema data) — no factory needed for these

### Coverage requirements
- `json-ld-utils.ts`: 100% (pure functions, easy)
- `json-ld.tsx`: ≥80%
- Sub-page JSON-LD rendering: ≥80% on new code paths

---

## Validation Considerations

- SonarCloud: `dangerouslySetInnerHTML` in `json-ld.tsx` is safe here (server component, data is our own serialized JSON — no user input). Mark with `// NOSONAR` if flagged as security issue.
- All new code must pass `npm run lint`, `npm run test`, and `npm run build`
- Manual verification: visit a tournament page, view page source, check for `<script type="application/ld+json">` tags with correct content
- Google Rich Results Test: paste URL for final acceptance validation

---

## Open Questions

None — requirements are clear from the issue. No UI changes, so no visual prototypes needed.
