---
name: ui-ux-designer
description: UI/UX design skill — invoke when a feature needs high-fidelity mockups using real MUI v7 components. Optionally uses Playwright to capture current app state, then produces a standalone HTML file (React + MUI v7 CDN, no build step) saved to mockups/. Can be invoked standalone or by /ticket-creator.
context: inline
---

# UI/UX Designer (Mockup Creation Skill)

## When to Invoke

- User says "design this" / "create a mockup" / "show me what this would look like"
- Called by `/ticket-creator` Step 4 when a story has UI changes
- Before `/architect` when visual alignment is needed before planning

---

## Output

A standalone HTML file saved to `mockups/[feature-name]-mockup.html`.

Uses **React 18 + MUI v7 + Emotion + Babel via CDN** — renders real MUI components in the browser with the project's actual theme. No build step, no dev server required.

---

## MUI CDN Boilerplate (Required Starting Point)

Every mockup starts from this exact template:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>[Feature Name] — Mockup</title>
  <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <!-- React 18 + MUI v7 + Emotion via CDN (no build step) -->
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@emotion/react/dist/emotion-react.umd.min.js"></script>
  <script src="https://unpkg.com/@emotion/styled/dist/emotion-styled.umd.min.js"></script>
  <script src="https://unpkg.com/@mui/material@7/umd/material-ui.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    const {
      ThemeProvider, createTheme, CssBaseline,
      Container, Box, Stack, Grid2,
      Card, CardContent, CardHeader, CardActions,
      Typography, Button, IconButton, Chip,
      TextField, Divider, Avatar, List, ListItem,
      ListItemText, ListItemAvatar, ListItemSecondaryAction,
      Skeleton, Alert, Badge, Tooltip,
      // Add more as needed from MaterialUI.*
    } = MaterialUI;

    // Project theme — mirrors app/components/context-providers/theme-provider.tsx
    const theme = createTheme({
      palette: {
        mode: 'dark',
        background: {
          default: '#0a0a0a',
          paper:   '#1a1a1a',
        },
        primary:  { main: '#a78bfa' },
        error:    { main: '#f44336' },
        success:  { main: '#4caf50' },
        warning:  { main: '#ff9800' },
        divider:  'rgba(255,255,255,0.08)',
        text: {
          primary:   '#e5e7eb',
          secondary: '#9ca3af',
        },
      },
      typography: {
        fontFamily: "'Archivo', Roboto, sans-serif",
      },
      shape: { borderRadius: 8 },
      components: {
        MuiCard: {
          defaultProps: { elevation: 0 },
          styleOverrides: {
            root: { border: '1px solid rgba(255,255,255,0.08)' },
          },
        },
      },
    });

    // ── State toggle helper (include in every mockup) ──
    function StateToggle({ states, current, onChange }) {
      return (
        <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
          {states.map(s => (
            <Chip
              key={s}
              label={s}
              size="small"
              onClick={() => onChange(s)}
              variant={current === s ? 'filled' : 'outlined'}
              color={current === s ? 'primary' : 'default'}
            />
          ))}
        </Stack>
      );
    }

    function MockupApp() {
      const [state, setState] = React.useState('populated');

      return (
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Container maxWidth="sm" sx={{ py: 4 }}>

            {/* Mockup header */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>[Feature Name]</Typography>
              <Typography variant="caption" color="text.secondary">
                [Brief description of what this mockup shows]
              </Typography>
            </Box>

            <StateToggle
              states={['loading', 'empty', 'populated']}
              current={state}
              onChange={setState}
            />

            {/* Feature content — replace with actual implementation */}
            {state === 'loading'   && <LoadingState />}
            {state === 'empty'     && <EmptyState />}
            {state === 'populated' && <PopulatedState />}

          </Container>
        </ThemeProvider>
      );
    }

    ReactDOM.createRoot(document.getElementById('root')).render(<MockupApp />);
  </script>
</body>
</html>
```

---

## Step 1: Capture Current UI State (Optional)

If the mockup shows changes to an existing page/component, capture screenshots with Playwright.

**Prerequisite:** dev server must be running (`npm run dev`).

```bash
npx playwright screenshot \
  --browser chromium \
  "http://localhost:3000/en/[relevant-path]" \
  /tmp/current-ui-state.png
```

If the user provides screenshots or wireframe images directly, skip this step.
If no screenshots are available at all, proceed to Step 2 — Gemini can design from description alone.

---

## Step 2: Design the MUI Component Spec

Based on the feature description, screenshot (if available), and existing MUI patterns in the codebase, design:
- **Layout Blueprint**: overall structure and component arrangement
- **MUI Component Inventory**: specific MUI components with key props
- **States to Show**: loading, empty, populated, error, etc.
- **Theme Token Mapping**: which tokens to use for colors/spacing
- **JSX Scaffold**: skeleton JSX structure

Reference `docs/theme-variants.md` for the project's theme configuration if needed.

---

## Step 3: Review Design with User

Present the key design decisions:
- Proposed MUI component hierarchy
- States to be shown in the mockup
- Any design decisions that deviate from existing UI patterns

Use AskUserQuestion to confirm or adjust **before** writing the HTML. One round is typical.

For revision requests after reviewing the rendered mockup, update your design spec and revise the HTML directly. Save the revised mockup as `mockups/[feature-slug]-mockup-v2.html`.

**Only make a fresh call** (new `-o json` with a new `UI_TAG`) if the design scope changes fundamentally — entirely new screens, a different feature entirely, or the session has gone off-track.

---

## Step 4: Write the HTML Mockup

Starting from the boilerplate template above, implement the design spec.

**Every mockup must have:**
1. The `StateToggle` component so states are switchable in the browser
2. `<Typography variant="overline">` or `<Chip>` labels identifying each state
3. `<Skeleton>` components for the loading state (matching the layout of the populated state)
4. Realistic placeholder data in the populated state

**Naming convention:**
```
mockups/[feature-slug]-mockup.html      # initial version
mockups/[feature-slug]-mockup-v2.html   # after revision
```

---

## Step 5: Open for Review

```bash
open mockups/[feature-name]-mockup.html
```

---

## Step 6: Return Mockup Path

Tell the user the path. If called by `/ticket-creator`, this path goes into the GitHub issue body.

---

## Coding Rules for Mockups

| Rule | Correct | Wrong |
|------|---------|-------|
| HTML elements | `Box`, `Typography`, `Stack` | raw `div`, `p`, `span` |
| Styling | `sx={{ color: 'primary.main' }}` | `style={{ color: '#a78bfa' }}` |
| Color values | theme tokens (`'text.secondary'`) | hex values (`'#9ca3af'`) |
| Loading states | `<Skeleton variant="text" />` | custom CSS shimmer |
| Spacing | `sx={{ gap: 2 }}` (MUI spacing) | `style={{ gap: '16px' }}` |

**Never use hardcoded hex values in `sx` props — always use theme tokens.**
