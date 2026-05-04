# Plan: [Bug] Mobile nav tabs cut off text on small screens (#418)

## Context
The group navigation bar (`GroupSelector`) renders 4 tabs (HUB, MATCHES, QUALIFIED TEAMS, AWARDS) with `variant="fullWidth"`. On small phones each tab gets ~80–110px, which isn't wide enough for an icon + label — especially long Spanish strings like "CLASIFICADOS". The fix: on mobile (`xs`) only the **selected** tab shows its label; unselected tabs show icon only. Desktop (`sm`+) behavior is unchanged.

## Acceptance Criteria (from issue)
- [ ] Mobile: selected tab → icon + label
- [ ] Mobile: unselected tabs → icon only
- [ ] Desktop: all tabs → icon + label (no change)
- [ ] Tab switching still works on all screen sizes
- [ ] Spanish and English labels fit without overflow on the selected tab

## Files to Modify

| File | Change |
|------|--------|
| `app/components/groups-page/group-selector.tsx` | Add `Box` import; add `makeLabel` helper; wrap each tab's label prop |
| `__tests__/components/groups-page/group-selector.test.tsx` | Replace `getByText` assertions (broken by Box wrapper) with `getByRole` |

**No CODE-STRUCTURE.md update needed** — component API and exports are unchanged.

## Technical Approach

### Why Box wrapper (not `useMediaQuery`)
`useMediaQuery` causes a server/client hydration mismatch (`GroupSelector` is a Client Component but SSR renders without knowing screen size). The MUI `sx` responsive syntax is CSS-only and SSR-safe.

### Implementation: `group-selector.tsx`

1. Add `Box` to the `@mui/material` import.
2. Add internal helper just above the component:

```tsx
const makeLabel = (text: string, tabValue: string, selected: string) => (
  <Box
    component="span"
    sx={{ display: { xs: selected === tabValue ? 'inline' : 'none', sm: 'inline' } }}
  >
    {text}
  </Box>
);
```

3. Replace each tab's `label={t('...')}` with `label={makeLabel(t('...'), tabValue, selected)}`:

| Tab | tabValue |
|-----|----------|
| HUB | `'hub'` |
| MATCHES | `'matches'` |
| QUALIFIED | `'qualified-teams'` |
| AWARDS | `'individual_awards'` |

No other changes to the component (props, styling, routing, accessibility unchanged).

### Why tests need updating
When `label` is a plain string, the text node lives directly inside the `<a role="tab">` — `getByText('HUB')` finds exactly one element. After wrapping in `<Box component="span">`, both the `<span>HUB</span>` and its parent `<a>` have `textContent === 'HUB'`, so `getByText` throws "Found multiple elements". The fix is to use `getByRole('tab', { name: /HUB/i })` instead — the accessible name is derived from all child text and continues to work with the wrapper.

### Test changes: `group-selector.test.tsx`

Three tests use `getByText` for label verification — update each assertion to `getByRole`:

**"renders all four tabs" (line ~58):**
```tsx
// Before
expect(screen.getByText('HUB')).toBeInTheDocument();
expect(screen.getByText('PARTIDOS')).toBeInTheDocument();
expect(screen.getByText('CLASIFICADOS')).toBeInTheDocument();
expect(screen.getByText('PREMIOS')).toBeInTheDocument();

// After
expect(screen.getByRole('tab', { name: /HUB/i })).toBeInTheDocument();
expect(screen.getByRole('tab', { name: /PARTIDOS/i })).toBeInTheDocument();
expect(screen.getByRole('tab', { name: /CLASIFICADOS/i })).toBeInTheDocument();
expect(screen.getByRole('tab', { name: /PREMIOS/i })).toBeInTheDocument();
```

Same update pattern for `"handles empty groups array"` and `"renders with dark theme"` tests.

**`group-selector-i18n.test.tsx`** — already uses `getByRole`, no changes needed.

## Mid-Level Design

### `app/components/groups-page/group-selector.tsx` *(modified)*

**New internal function (not exported):**

- **makeLabel(text: string, tabValue: string, selected: string)**: `JSX.Element`  
  Returns a `Box` span with `display: { xs: selected === tabValue ? 'inline' : 'none', sm: 'inline' }`.  
  Used as the `label` prop for each Tab. Not exported.  
  Tests:
  - selected tab label has `display: inline` for xs
  - unselected tab label has `display: none` for xs
  - all labels have `display: inline` for sm

### Call Graph Changes
No call graph changes.

## Visual Prototype

```
Mobile (xs) — Hub tab selected:
┌──────────┬────┬────┬────┐
│ ⬛ HUB  │ ⚽ │ 🌳 │ 🏆 │
└──────────┴────┴────┴────┘
  (selected,     (icon only for unselected)
   icon+label)

Desktop (sm+) — all tabs show label:
┌──────────┬──────────┬────────────┬──────────┐
│ ⬛ HUB  │ ⚽ PARTIDOS│ 🌳 CLASIF. │ 🏆 PREMIOS│
└──────────┴──────────┴────────────┴──────────┘
```

## Verification

1. Run existing tests: `npm run test -- group-selector` — all should pass after test updates
2. Run lint: `npm run lint`
3. Run build: `npm run build`
4. Vercel Preview: resize browser to ~375px wide, verify unselected tabs show icon only; selected tab shows icon + label; clicking tabs still navigates correctly; desktop (1200px) shows all labels

## Open Questions
None.
