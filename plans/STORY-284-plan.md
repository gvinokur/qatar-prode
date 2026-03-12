# Plan: Fix Main Tabs Not Scrollable on Mobile (#284)

## Context

On touch devices, the main tabs on two pages cannot be scrolled horizontally by swiping. MUI `<Tabs>` / `<TabList>` default to a non-scrollable layout that clips tabs rather than allowing touch scroll. The fix is to add `variant="scrollable"` and `scrollButtons="auto"` — the same pattern already used in `AdminSectionTabs` and `BackofficeTabs`.

## Acceptance Criteria

- User can swipe horizontally through tabs on user stats page on mobile
- User can swipe horizontally through tabs on friend group detail page on mobile
- No visual regression on desktop

## Files to Modify

1. `app/components/tournament-stats/stats-tabs.tsx` — `<Tabs>` on line 64
2. `app/components/friend-groups/admin-tabs.tsx` — `<TabList>` on line 48

## Changes

### `stats-tabs.tsx`
```diff
- <Tabs value={value} onChange={handleChange} aria-label={t('tabs.ariaLabel')}>
+ <Tabs value={value} onChange={handleChange} aria-label={t('tabs.ariaLabel')} variant="scrollable" scrollButtons="auto">
```

### `admin-tabs.tsx`
```diff
- <TabList onChange={handleChange} aria-label="group tabs">
+ <TabList onChange={handleChange} aria-label="group tabs" variant="scrollable" scrollButtons="auto">
```

## Mid-Level Design

### Call Graph Changes
No call graph changes.

### Component changes

- **`StatsTabs`** *(modified)* — add `variant="scrollable" scrollButtons="auto"` to `<Tabs>`
  - No signature change, no new functions
- **`AdminTabs`** *(modified)* — add `variant="scrollable" scrollButtons="auto"` to `<TabList>`
  - No signature change, no new functions

## Testing Strategy

- Unit tests: update snapshot tests for both components if they exist; otherwise no new tests needed (pure prop addition with no logic change)
- Manual: open user stats and group detail pages on mobile viewport in browser devtools, verify tabs scroll horizontally via touch simulation

## CODE-STRUCTURE files to update

- `docs/code-structure/components/components-stats.md` — update `StatsTabs` entry to note scrollable variant
- `docs/code-structure/components/components-groups.md` — update `AdminTabs` entry to note scrollable variant
- Call graph: NO changes
