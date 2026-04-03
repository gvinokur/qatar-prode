# Story #300: Robots.txt and Dynamic Sitemap

## Context

The app has no `robots.txt` or `sitemap.xml`, so search engines have no guidance on what to crawl and cannot efficiently discover public content. This limits organic search visibility for tournament and friend-group pages. The app already has comprehensive per-page metadata (OG tags, canonical URLs, hreflang) but is missing these foundational SEO crawlability signals.

---

## Story Definition

**Objective:** Add `robots.txt` and a dynamic XML sitemap that helps search engines discover all public tournament and friend-group pages in both English and Spanish, while excluding admin and authentication pages.

**Acceptance Criteria:**
- Sitemap accessible at `/sitemap.xml` with localized URLs for `/en` and `/es`
- All active (non-dev-only) tournament pages included in sitemap for both locales
- All public (`is_public = true`) friend-group pages included for both locales
- Sitemap auto-updates when new tournaments/groups are created (dynamic generation)
- `robots.txt` accessible at `/robots.txt` with correct disallow rules
- Admin area, auth pages, and API routes excluded from crawling

**Out of Scope:**
- Image/news sitemaps
- `lastmod` timestamps from content changes
- Sitemap index files (multi-sitemap splitting)

---

## Technical Approach

Use Next.js built-in `app/sitemap.ts` and `app/robots.ts` conventions (both placed at `app/` root level, outside `[locale]`). These generate routes at `/sitemap.xml` and `/robots.txt` automatically.

**Data sources:**
- Tournaments: `findAllActiveTournaments()` from `app/db/tournament-repository.ts` — called without userId so dev-only tournaments are automatically excluded
- Public groups: new `findAllPublicGroupsForSitemap()` function in `app/db/prode-group-repository.ts` — a lightweight query returning only `id` values without pagination overhead
- Base URL: `process.env.NEXT_PUBLIC_APP_URL` (defaults to `https://prodemundial.app`)
- Locales: imported from `i18n.config.ts` (`['en', 'es']`)

**Tournament sub-pages to include in sitemap:**
- `/{locale}/tournaments/{id}` — main tournament page
- `/{locale}/tournaments/{id}/results`
- `/{locale}/tournaments/{id}/rules`
- `/{locale}/tournaments/{id}/awards`
- `/{locale}/tournaments/{id}/stats`
- `/{locale}/tournaments/{id}/qualified-teams`

**Friend-group pages:**
- `/{locale}/friend-groups/{id}` — global group leaderboard (public)

**robots.txt disallow rules:**
- `/*/backoffice`
- `/*/delete-account`
- `/*/verify-email`
- `/*/reset-password`
- `/api/`

---

## Files to Create/Modify

| File | Action | Notes |
|------|--------|-------|
| `app/robots.ts` | **Create** | Static robots.txt via Next.js MetadataRoute |
| `app/sitemap.ts` | **Create** | Dynamic sitemap via Next.js MetadataRoute |
| `app/db/prode-group-repository.ts` | **Modify** | Add `findAllPublicGroupsForSitemap()` |
| `docs/code-structure/db.md` | **Modify** | Document new function |
| `docs/code-structure/pages.md` | **Modify** | Document new sitemap/robots route handlers |

---

## Mid-Level Design

### Call Graph Changes

**New flows:**
- **Sitemap flow:** `GET /sitemap.xml` → `app/sitemap.ts` → `findAllActiveTournaments()` + `findAllPublicGroupsForSitemap()` → returns `MetadataRoute.Sitemap`
- **Robots flow:** `GET /robots.txt` → `app/robots.ts` → returns `MetadataRoute.Robots` (static)

### `app/db/prode-group-repository.ts` *(modified)*

**New functions:**

- **findAllPublicGroupsForSitemap()**: `Promise<{ id: string }[]>`
  Lightweight query returning only IDs of all public groups (`is_public = true`). No pagination, no joins — designed for sitemap generation.
  Tests:
  - returns empty array when no public groups exist
  - returns only groups with `is_public = true`
  - excludes groups with `is_public = false` or null

### `app/robots.ts` *(new file)*

- **default export robots()**: `MetadataRoute.Robots`
  Returns static robots configuration. Allows all user agents, disallows admin/auth/api paths, points to sitemap URL.
  Tests:
  - returns `userAgent: '*'` rule
  - disallow array includes all required paths: `/*/backoffice`, `/*/delete-account`, `/*/verify-email`, `/*/reset-password`, `/api/`
  - sitemap points to `${baseUrl}/sitemap.xml`
  - allows `/` (all public content)

### `app/sitemap.ts` *(new file)*

- **default export sitemap()**: `Promise<MetadataRoute.Sitemap>`
  Fetches active tournaments and public groups, generates URL entries for both locales (en, es) with hreflang alternates. Each unique page gets one entry with `alternates.languages` mapping both locales.
  Calls: findAllActiveTournaments, findAllPublicGroupsForSitemap
  Tests:
  - returns home page URLs (`/en` and `/es`) when tournaments and groups arrays are both empty
  - includes all 6 tournament sub-page types (main, results, rules, awards, stats, qualified-teams) for each active tournament, for each locale
  - includes `/en/friend-groups/{id}` and `/es/friend-groups/{id}` entries for each public group
  - each entry has `alternates.languages` with both `en` and `es` URLs pointing to the correct paths
  - returns tournament entries without friend-group entries when public groups array is empty
  - re-throws (or wraps) when `findAllActiveTournaments()` throws, so errors are not silently swallowed
  - re-throws (or wraps) when `findAllPublicGroupsForSitemap()` throws, so errors are not silently swallowed

---

## Implementation Steps

### Wave 1 — DB Repository (no dependencies)
1. Add `findAllPublicGroupsForSitemap()` to `app/db/prode-group-repository.ts`
2. Update `docs/code-structure/db.md`

### Wave 2 — Route Handlers (depends on Wave 1)
3. Create `app/robots.ts`
4. Create `app/sitemap.ts` (imports findAllActiveTournaments + findAllPublicGroupsForSitemap)
5. Update `docs/code-structure/pages.md`

---

## Testing Strategy

**Unit tests** (Vitest, co-located in `__tests__/` or `.test.ts` files):

- `app/db/__tests__/prode-group-repository.test.ts` — test `findAllPublicGroupsForSitemap()` using `createMockSelectQuery()` for Kysely db mocking
- `app/__tests__/robots.test.ts` — test robots() function output shape (pure function, no mocking needed)
- `app/__tests__/sitemap.test.ts` — test sitemap() using `vitest.mock()` to stub `findAllActiveTournaments` and `findAllPublicGroupsForSitemap`; verify URL structure, locale coverage, and alternates

**Manual verification:**
- `npm run build` then start dev: visit `/sitemap.xml` and `/robots.txt` to confirm valid output
- Validate sitemap XML at Google Search Console (paste URL)
- Check robots.txt with Google's robots.txt tester

---

## Validation Considerations

- **SonarCloud:** No new issues expected — simple pure functions with no security surface
- **Coverage:** New code needs ≥80% — robots.ts and sitemap.ts are small, achievable
- **Build:** `app/sitemap.ts` makes DB calls at request time (not build time), so no ISR issues
- **No migrations needed**

---

## CODE-STRUCTURE Updates Per Task

**Task 1 (DB function):** Update `docs/code-structure/db.md` — add `findAllPublicGroupsForSitemap` signature. Call graph: YES (new sitemap flow added).

**Task 2 (Route handlers):** Update `docs/code-structure/pages.md` — add `app/robots.ts` and `app/sitemap.ts` entries.
