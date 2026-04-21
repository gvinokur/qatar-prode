# Story 354 Plan: Dashboard Card Primitive & Grid Foundation

## Story Context

**Issue:** [#354](https://github.com/gvinokur/qatar-prode/issues/354)
**Title:** [Story 1] Dashboard: Card Primitive & Grid Foundation
**Branch:** `feature/story-354`
**Worktree:** `/Users/gvinokur/Personal/qatar-prode-story-354`

### Objective

This is **Story 1 of the new hub iteration (UX Audit 2026)**. It establishes the dashboard layout architecture:

1. Create a reusable `DashboardCard` primitive component with a standardized header (icon avatar, title, action slot) and flex content area.
2. Refactor `page.tsx` to separate full-width banners (Stack) from the responsive 2-column widget grid (CSS Grid).
3. Back up existing `tournament-hub` components to `app/components/hub_backup/` for reference during the iteration, pending later deletion.

## Acceptance Criteria

- [ ] **DashboardCard Component**: Implements the standardized header (icon, title, action slot) and content area as defined in `mockups/dashboard-composite-mockup.html`.
- [ ] **Separated Layout**: `page.tsx` clearly distinguishes between the full-width banner Stack and the responsive widget grid.
- [ ] **CSS Grid Implementation**: Widget area uses `display: 'grid'` with `repeat(auto-fit, minmax(340px, 1fr))`.
- [ ] **No Grid2**: Uses standard MUI Box/Stack only.
- [ ] **Hub Backup**: Current `tournament-hub` components are copied to `app/components/hub_backup/` for later deletion.

## Technical Approach

### 1. Hub Backup

Copy all `.tsx` source files from `app/components/tournament-hub/` to a new `app/components/hub_backup/` directory (excluding `__tests__/`). These files are inert — not imported anywhere — and serve as a reference snapshot of the pre-iteration hub components.

**Why now:** This is Story 1 of the new hub iteration. Backing up here gives a clean restore point before any components are modified by subsequent stories.

### 2. DashboardCard Primitive

Create `app/components/tournament-hub/dashboard-card.tsx` — a **Server Component** (no interactivity needed).

**Design reference:** `mockups/dashboard-composite-mockup.html` lines 76–90.

```
┌─────────────────────────────────────────────┐
│  [Avatar:icon]  Title              count?   │  ← CardHeader
│─────────────────────────────────────────────│  ← Divider (from CardHeader)
│                                             │
│  {children}                                 │  ← CardContent (flex, grows)
│                                             │
└─────────────────────────────────────────────┘
```

Props:
- `title: string` — card header title
- `icon: React.ReactNode` — MUI icon element rendered inside Avatar
- `count?: React.ReactNode` — optional right-aligned text (e.g., "3 games")
- `children: React.ReactNode` — card body content
- `urgent?: boolean` — when true, switches border color to `error.main`

Styling:
- `Card variant="outlined"`, `height: '100%'`, `flexDirection: 'column'`, `bgcolor: 'background.paper'`
- `borderColor: urgent ? 'error.main' : 'divider'`
- Avatar: `bgcolor: 'rgba(167, 139, 250, 0.1)'`, `color: 'primary.main'`, `width: 32`, `height: 32`
- Title: `Typography variant="subtitle1"`, `fontWeight: 700`, `fontSize: '0.95rem'`
- Count: `Typography variant="caption"`, `color: 'text.secondary'`, `fontWeight: 600`, `mt: 1`, `mr: 1`
- CardContent: `flexGrow: 1`, `pt: 0`, `display: 'flex'`, `flexDirection: 'column'`

### 3. page.tsx Layout Refactor

Split the single vertical `Box` into two zones:

```tsx
<Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>

  {/* Banner Area — full-width Stack */}
  <Stack gap={2}>
    <TournamentHubActionCenter tournamentId={id} locale={locale} data={actionCenterData} />
  </Stack>

  {/* Widget Grid — CSS Grid */}
  <Box sx={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: 2,
  }}>
    {!isIncompleteUser && <TournamentHubRecentResults tournamentId={id} locale={locale} />}
    <TournamentHubLeaderboardPeek tournamentId={id} locale={locale} />
  </Box>

</Box>
```

**Rationale:**
- `TournamentHubActionCenter` stays in the banner area: it internally renders either the full-width `PreTournamentNewUserActionCenter` (for incomplete users) or `ActionCenterCarousel` — both are naturally full-width.
- `TournamentHubRecentResults` and `TournamentHubLeaderboardPeek` move into the widget grid, where future stories will wrap them in `DashboardCard`.
- The outer `Box` with `flexDirection: 'column'` preserves the existing top-level spacing.

## Files to Create/Modify

| Action | File |
|--------|------|
| Create | `app/components/tournament-hub/dashboard-card.tsx` |
| Create | `app/components/hub_backup/*.tsx` (copies of tournament-hub files) |
| Create | `app/components/tournament-hub/__tests__/dashboard-card.test.tsx` |
| Modify | `app/[locale]/tournaments/[id]/page.tsx` |
| Update | `docs/code-structure/components/components-tournament-hub.md` |

## Mid-Level Design

### Call Graph Changes

No call graph changes. No new cross-layer calls are introduced. The new `DashboardCard` is a pure presentational component with no data-fetching. The page layout change reorders existing components only.

---

### `app/components/tournament-hub/dashboard-card.tsx` *(new)*

**DashboardCard({ title, icon, count, children, urgent })**: `JSX.Element`
  Presentational Server Component. Renders an MUI `Card variant="outlined"` with standardized `CardHeader` (Avatar containing `icon`, `Typography` title, optional `count` in action slot) and `CardContent` containing `children`. Border color switches to `error.main` when `urgent=true`.
  Calls: (none — pure MUI composition)
  Tests:
  - renders title text in CardHeader
  - renders icon inside Avatar element
  - renders count in action slot when provided
  - does NOT render count element when count is undefined
  - applies `error.main` border styling when `urgent=true`
  - applies default `divider` border styling when `urgent` is omitted
  - renders children inside CardContent
  - renders empty CardContent when children is undefined
  - renders Avatar even when icon is an empty element (Avatar container is always present)

---

### `app/[locale]/tournaments/[id]/page.tsx` *(modified)*

No new functions. Structural JSX change only:
- Replace single `Box flex column` with outer `Box flex column` → inner `Stack` (banner area) + inner `Box CSS Grid` (widget area).
- No change to data-fetching logic (`getActionCenterGames`, `computeIsIncompleteUser`, `getLoggedInUser`).

---

## Implementation Steps

### Wave 1 — Hub Backup (standalone, no deps)
1. Create `app/components/hub_backup/` directory
2. Copy all `.tsx` files from `app/components/tournament-hub/` to `app/components/hub_backup/` (exclude `__tests__/`)

### Wave 2 — DashboardCard Primitive (no deps on Wave 1)
3. Create `app/components/tournament-hub/dashboard-card.tsx`
4. Create `app/components/tournament-hub/__tests__/dashboard-card.test.tsx`

### Wave 3 — page.tsx Refactor (depends on Wave 2 existing)
5. Modify `app/[locale]/tournaments/[id]/page.tsx` — add Stack import, apply two-zone layout

### Wave 4 — Documentation
6. Update `docs/code-structure/components/components-tournament-hub.md` with `DashboardCard` entry

## Testing Strategy

### DashboardCard Unit Tests

File: `app/components/tournament-hub/__tests__/dashboard-card.test.tsx`

Tests:
- renders title text in CardHeader
- renders icon inside Avatar element
- renders count in action slot when provided
- does NOT render count element when count is undefined
- applies `error.main` border styling when `urgent=true`
- applies default `divider` border styling when `urgent` is omitted
- renders children inside CardContent
- renders empty CardContent when children is undefined
- renders Avatar container even when icon is a simple element

Utilities to use: `renderWithTheme` from test utilities. No `testFactories` needed — `DashboardCard` is a pure presentational component with no data dependencies; test props are inline primitives (strings, React elements). Follow the existing `__tests__/` patterns in `app/components/tournament-hub/__tests__/`.

### Manual Verification
- Open hub page (complete user): widget grid shows 2 columns on desktop, 1 on mobile
- Open hub page (incomplete user): banner area shows PreTournamentNewUserActionCenter full-width; leaderboard peek in grid below
- Verify `DashboardCard` renders as designed by writing a quick storybook-style story or visual inspection via mockup

## Validation Considerations

- `npm run test` must pass (coverage ≥80% on new DashboardCard)
- `npm run lint` must pass (no unused imports in hub_backup files may trigger lint — if needed, disable lint for the backup directory)
- `npm run build` must pass

### Lint note on hub_backup

The `hub_backup/` directory will contain `.tsx` files that are never imported. ESLint rules like `no-unused-vars` won't flag these since they're not imported, but TypeScript strict mode compiles them and all their imports must resolve. Since the backup files import from paths like `@/app/actions/hub-actions`, `@/app/components/...`, these should all resolve correctly since originals are untouched.

If the backup files cause TypeScript compile errors (e.g., circular references or strict mode issues due to copied code), we can add a `tsconfig.json` exclude for `app/components/hub_backup/**` as a fallback.

## Open Questions

1. **Lint/TS exclusion for hub_backup**: Should `hub_backup/` be excluded from TypeScript compilation via `tsconfig.json`? This avoids any risk of compile errors from the inert backup files. *(Prefer yes — cleaner.)*
2. **DashboardCard location**: The issue references `app/components/tournament-hub/dashboard-card.tsx`. Future stories may move it to a shared primitives directory. That's out of scope for Story 354.
