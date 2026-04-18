# Plan: Story #340 — Align and Semanticize Top Navigation Icons

**Issue:** https://github.com/gvinokur/qatar-prode/issues/340  
**Branch:** feature/story-340  
**Worktree:** /Users/gvinokur/Personal/qatar-prode-story-340

---

## Context

The tournament top navigation (`GroupSelector`) has four tabs: Hub, Matches, Qualified Teams, and Awards. Currently only the Matches tab has an icon, and it uses `EmojiEventsIcon` (trophy) — which is semantically wrong for Matches and belongs on Awards. Hub, Qualified Teams, and Awards have no icons at all, creating visual inconsistency as documented in the mockup at `mockups/top-nav-icons.html`.

This story adds semantically correct icons to all four tabs:
- **Hub** → `DashboardIcon` (central overview)
- **Matches** → `SportsSoccerIcon` (replaces the misplaced trophy)
- **Qualified Teams** → `AccountTreeIcon` (bracket/tree structure)
- **Awards** → `EmojiEventsIcon` (trophy — correctly placed here)

All icons use `iconPosition="start"` at `fontSize: 20` — consistent with the existing Matches tab styling.

---

## Acceptance Criteria

- [ ] All four main tournament tabs (Hub, Matches, Qualified Teams, Awards) have icons
- [ ] Hub uses the Dashboard icon
- [ ] Matches uses the SportsSoccer icon (replacing the current trophy)
- [ ] Qualified Teams uses the AccountTree icon
- [ ] Awards uses the EmojiEvents (trophy) icon
- [ ] Icons are positioned at the 'start' of the tab labels
- [ ] Navigation remains functional and properly localized in EN and ES

---

## Visual Prototype

Reference: `mockups/top-nav-icons.html` (already committed, shows both Current and Proposed states)

```
┌─────────────────────────────────────────────────────────┐
│  [📊 HUB]  [⚽ MATCHES]  [🌳 QUALIFIED]  [🏆 AWARDS]  │
└─────────────────────────────────────────────────────────┘
```

All icons at `fontSize: 20`, `iconPosition="start"`, consistent with existing Matches tab.

---

## Technical Approach

**Single file change:** `app/components/groups-page/group-selector.tsx`

No new logic, no new components, no translation changes (all tab labels already exist). Only icon imports and JSX props added.

MUI icons `Dashboard`, `SportsSoccer`, `AccountTree` are all in `@mui/icons-material` — already a project dependency. No new package installs needed.

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `app/components/groups-page/group-selector.tsx` | Modify | Add icon imports and icon/iconPosition props to all 4 tabs |
| `__tests__/components/groups-page/group-selector.test.tsx` | Modify | Update existing icon test name; add icon presence tests for Hub/Qualified/Awards |
| `docs/code-structure/components/components-tournament-games.md` | Modify | Update GroupSelector `Renders:` entry to list all 4 icons |

---

## Mid-Level Design

### Call Graph Changes
No call graph changes.

### `app/components/groups-page/group-selector.tsx` *(modified)*

**No new or changed functions.** Only JSX change inside `GroupSelector`:

**Import change (line 4):**
```typescript
// Before:
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

// After:
import DashboardIcon from '@mui/icons-material/Dashboard';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
```

**Hub tab** — add `icon` and `iconPosition="start"`:
```tsx
<Tab
  label={t('hub')}
  icon={<DashboardIcon sx={{ fontSize: 20 }} />}
  iconPosition="start"
  value="hub"
  component={Link}
  href={`/${locale}/tournaments/${tournamentId}/hub`}
  sx={tabSx}
/>
```

**Matches tab** — swap `EmojiEventsIcon` → `SportsSoccerIcon`:
```tsx
icon={<SportsSoccerIcon sx={{ fontSize: 20 }} />}
```

**Qualified tab** — add `icon` and `iconPosition="start"`:
```tsx
<Tab
  label={t('qualified')}
  icon={<AccountTreeIcon sx={{ fontSize: 20 }} />}
  iconPosition="start"
  value="qualified-teams"
  ...
/>
```

**Awards tab** — add `icon` and `iconPosition="start"`:
```tsx
<Tab
  label={t('awards')}
  icon={<EmojiEventsIcon sx={{ fontSize: 20 }} />}
  iconPosition="start"
  value="individual_awards"
  ...
/>
```

---

## Implementation Steps

**Wave 1 — Component + Tests (single commit):**
1. Update icon imports in `group-selector.tsx`
2. Add `icon`/`iconPosition` to Hub, Qualified, Awards tabs; swap icon on Matches
3. Update `group-selector.test.tsx`:
   - Rename `'renders Matches tab with trophy icon'` → `'renders Matches tab with soccer ball icon'`
   - Add: Qualified tab renders with SVG icon
   - Add: Awards tab renders with SVG icon
   - Add: Hub tab renders with SVG icon when `isHubEnabled` mocked to `true`
   - Add: Hub tab is NOT rendered when `isHubEnabled` mocked to `false`
4. Update `docs/code-structure/components/components-tournament-games.md` (GroupSelector entry)

---

## Testing Strategy

**Test file:** `__tests__/components/groups-page/group-selector.test.tsx`

Existing pattern: `tab.querySelector('svg')` to verify icon presence (SVG renders). Mocking pattern: `vi.mock(...)` for `isHubEnabled` (utility mock, not `testFactories` which is for data models).

New test cases:
- `renders Matches tab with soccer ball icon` (rename of existing test)
- `renders Qualified tab with an icon`
- `renders Awards tab with an icon`
- `renders Hub tab with an icon when hub is enabled`
- `does not render Hub tab when hub is disabled`

---

## Validation

1. `npm run test -- --testPathPattern=group-selector` — all tests pass
2. `npm run build` — no TypeScript errors
3. `npm run lint` — no ESLint issues
4. Deploy to Vercel Preview → visually verify all 4 tabs show icons
