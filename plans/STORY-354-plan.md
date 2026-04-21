# Story 354 Plan: Dashboard Card Primitive & Grid Foundation

## Story Context

**Issue:** [#354](https://github.com/gvinokur/qatar-prode/issues/354)
**Title:** [Story 1] Dashboard: Card Primitive & Grid Foundation
**Branch:** `feature/story-354`
**Worktree:** `/Users/gvinokur/Personal/qatar-prode-story-354`

### Objective

This is **Story 1 of the new hub iteration (UX Audit 2026)**. It establishes the dashboard layout architecture as a clean foundation — no old hub components are used:

1. Create a reusable `DashboardCard` primitive with standardized header (icon avatar, title, action slot) and flex content area.
2. Rewrite `page.tsx` with a two-zone layout: a **mock full-width banner** in the Banner Area (Stack) and **3–4 mock `DashboardCard` instances** with Lorem Ipsum content in the Widget Grid (CSS Grid).

The old `tournament-hub` components are deliberately excluded from this story's `page.tsx`. Future stories will implement real widgets using `DashboardCard`.

## Acceptance Criteria

- [ ] **DashboardCard Component**: Implements the standardized header (icon, title, action slot) and content area as defined in `mockups/dashboard-composite-mockup.html`.
- [ ] **Two-Zone Layout**: `page.tsx` has a Banner Area (full-width Stack) and a Widget Grid (CSS Grid) — **no old hub components used**.
- [ ] **CSS Grid Implementation**: Widget area uses `display: 'grid'` with `repeat(auto-fit, minmax(340px, 1fr))`.
- [ ] **No Grid2**: Uses standard MUI Box/Stack only.
- [ ] **Mock Content**: Banner area shows a visible mock banner; widget grid shows 3–4 `DashboardCard` instances with Lorem Ipsum content for layout validation.

## Technical Approach

### 1. DashboardCard Primitive

Create `app/components/tournament-hub/dashboard-card.tsx` — a **Server Component** (no interactivity needed).

**Design reference:** `mockups/dashboard-composite-mockup.html` lines 76–90.

```
┌─────────────────────────────────────────────┐
│  [Avatar:icon]  Title              count?   │  ← CardHeader
│─────────────────────────────────────────────│
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

Styling (from mockup):
- `Card variant="outlined"`, `height: '100%'`, `display: 'flex'`, `flexDirection: 'column'`, `bgcolor: 'background.paper'`
- `borderColor: urgent ? 'error.main' : 'divider'`
- Avatar: `bgcolor: 'rgba(167, 139, 250, 0.1)'`, `color: 'primary.main'`, `width: 32`, `height: 32`
- Title: `Typography variant="subtitle1"`, `fontWeight: 700`, `fontSize: '0.95rem'`
- Count: `Typography variant="caption"`, `color: 'text.secondary'`, `fontWeight: 600`, `mt: 1`, `mr: 1`
- CardContent: `flexGrow: 1`, `pt: 0`, `display: 'flex'`, `flexDirection: 'column'`

### 2. page.tsx — Clean Two-Zone Layout

Rewrite to use two zones with **mock content only**. No old hub components are imported.

```
┌─────────────────────────────────────────────────────┐
│  Banner Area (Stack, full-width)                    │
│  ┌─────────────────────────────────────────────┐   │
│  │  Mock Banner — dashed outlined Paper        │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘

┌──────────────────────┐  ┌──────────────────────┐
│  DashboardCard       │  │  DashboardCard        │
│  "Games"             │  │  "Standings"          │
│  Lorem ipsum...      │  │  Lorem ipsum...       │
└──────────────────────┘  └──────────────────────┘
┌──────────────────────┐  ┌──────────────────────┐
│  DashboardCard       │  │  DashboardCard        │
│  "Groups"            │  │  "Results"            │
│  Lorem ipsum...      │  │  Lorem ipsum...       │
└──────────────────────┘  └──────────────────────┘
          ↑ Widget Grid: CSS Grid, 2-col on desktop, 1-col on mobile
```

```tsx
export default async function TournamentHubPage(props: Props) {
  const { id } = await props.params
  const locale = toLocale(await getLocale())

  const user = await getLoggedInUser()
  if (!user) redirect(`/${locale}/tournaments/${id}/games`)

  return (
    <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>

      {/* Banner Area — full-width Stack */}
      <Stack gap={2}>
        <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', borderStyle: 'dashed', color: 'text.secondary' }}>
          <Typography variant="body2">Banner Area — full-width (Hero, Onboarding, etc.)</Typography>
        </Paper>
      </Stack>

      {/* Widget Grid — CSS Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 2 }}>
        <DashboardCard title="Games" icon={<SportsSoccerIcon />} count="3 pending" urgent>
          <Typography variant="body2" color="text.secondary">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</Typography>
        </DashboardCard>
        <DashboardCard title="Standings" icon={<EmojiEventsIcon />}>
          <Typography variant="body2" color="text.secondary">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</Typography>
        </DashboardCard>
        <DashboardCard title="Groups" icon={<GroupsIcon />} count="2 groups">
          <Typography variant="body2" color="text.secondary">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</Typography>
        </DashboardCard>
        <DashboardCard title="Results" icon={<HistoryIcon />}>
          <Typography variant="body2" color="text.secondary">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</Typography>
        </DashboardCard>
      </Box>

    </Box>
  )
}
```

This removes `getActionCenterGames`, `computeIsIncompleteUser`, and all old hub component imports.

## Files to Create/Modify

| Action | File |
|--------|------|
| Create | `app/components/tournament-hub/dashboard-card.tsx` |
| Create | `app/components/tournament-hub/__tests__/dashboard-card.test.tsx` |
| Modify | `app/[locale]/tournaments/[id]/page.tsx` |
| Update | `docs/code-structure/components/components-tournament-hub.md` |

## Mid-Level Design

### Call Graph Changes

No call graph changes. `DashboardCard` is a pure presentational component. `page.tsx` now only calls `getLoggedInUser` (pre-existing flow).

---

### `app/components/tournament-hub/dashboard-card.tsx` *(new)*

**DashboardCard({ title, icon, count, children, urgent })**: `JSX.Element`
  Presentational Server Component. Renders MUI `Card variant="outlined"` with standardized `CardHeader` (Avatar containing `icon`, Typography title, optional `count` in action slot) and `CardContent` containing `children`. Border color switches to `error.main` when `urgent=true`.
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
  - renders Avatar container even when icon is a simple element

---

### `app/[locale]/tournaments/[id]/page.tsx` *(modified)*

No new functions. Structure changes:
- Remove imports: `TournamentHubActionCenter`, `TournamentHubRecentResults`, `TournamentHubLeaderboardPeek`, `getActionCenterGames`, `computeIsIncompleteUser`
- Add imports: `DashboardCard`, `Stack`, `Paper`, `Typography`, MUI icons (`SportsSoccerIcon`, `EmojiEventsIcon`, `GroupsIcon`, `HistoryIcon`)
- Replace body with two-zone layout (Banner Stack + Widget Grid) using mock content

---

## Implementation Steps

### Wave 1 — DashboardCard Primitive
1. Create `app/components/tournament-hub/dashboard-card.tsx`
2. Create `app/components/tournament-hub/__tests__/dashboard-card.test.tsx`

### Wave 2 — page.tsx Rewrite (depends on Wave 1)
3. Rewrite `app/[locale]/tournaments/[id]/page.tsx` with two-zone mock layout

### Wave 3 — Documentation
4. Update `docs/code-structure/components/components-tournament-hub.md` with `DashboardCard` entry
5. Update `docs/code-structure/pages.md` to reflect simplified page.tsx (no hub action imports)

## Testing Strategy

### DashboardCard Unit Tests

File: `app/components/tournament-hub/__tests__/dashboard-card.test.tsx`

Utilities: `renderWithTheme` from test utilities. No `testFactories` needed — `DashboardCard` is pure presentational; props are inline primitives (strings, React elements). Follow existing test patterns in `app/components/tournament-hub/__tests__/`.

### Manual Verification (Vercel Preview)
- Desktop: widget grid shows 2 columns
- Mobile: widget grid collapses to 1 column
- `urgent=true` card shows red border
- Banner area is clearly full-width above the grid

## Validation

- `npm run test` — must pass; coverage ≥80% on new DashboardCard
- `npm run lint` — must pass
- `npm run build` — must pass
