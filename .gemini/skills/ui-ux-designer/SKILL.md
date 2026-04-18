---
name: ui-ux-designer
description: UI/UX design skill — invoke when a feature needs high-fidelity mockups using real MUI v7 components. Produces a standalone HTML file (React + MUI v7 CDN, no build step) saved to mockups/. Can be invoked standalone or by ticket-creator.
---

# UI/UX Designer (Mockup Creation Skill)

## When to Invoke

- User says "design this" / "create a mockup" / "show me what this would look like"
- Called by `ticket-creator` Step 4 when a story has UI changes
- Before planning when visual alignment is needed

---

## Output

A standalone HTML file saved to `mockups/[feature-name]-mockup.html` via `write_file`.

Uses **React 19 + MUI v7 + Emotion + htm via ESM (importmap)** — renders real MUI components in the browser with the project's actual theme. 

**Note on MUI v7:** Starting with v6, MUI dropped UMD bundles. You **MUST** use an ESM-based CDN (like `esm.sh`) and standard `import` syntax. Since we want JSX-like syntax in a single file without a build step, we use `htm` to bind to `React.createElement`.

---

## MUI ESM Boilerplate (Required Starting Point)

Every mockup **MUST** start from this exact template:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>[Feature Name] — Mockup</title>
  <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
  
  <script type="importmap">
    {
      "imports": {
        "react": "https://esm.sh/react@19",
        "react/": "https://esm.sh/react@19/",
        "react-dom": "https://esm.sh/react-dom@19",
        "react-dom/client": "https://esm.sh/react-dom@19/client",
        "react/jsx-runtime": "https://esm.sh/react@19/jsx-runtime",
        "@mui/material": "https://esm.sh/@mui/material@7.0.2?external=react,react-dom,@emotion/react,@emotion/styled",
        "@emotion/react": "https://esm.sh/@emotion/react@11",
        "@emotion/styled": "https://esm.sh/@emotion/styled@11",
        "htm": "https://esm.sh/htm@3"
      }
    }
  </script>
</head>
<body>
  <div id="root"></div>
  <script type="module">
    import React from 'react';
    import { createRoot } from 'react-dom/client';
    import htm from 'htm';
    import { 
      ThemeProvider, createTheme, CssBaseline, 
      Container, Box, Stack, 
      Card, CardContent, CardHeader,
      Typography, Chip, Icon, Skeleton,
      Paper, Alert, Divider
      // Add more as needed
    } from '@mui/material';

    const html = htm.bind(React.createElement);

    // Project theme — mirrors app/components/context-providers/theme-provider.tsx
    const theme = createTheme({
      palette: {
        mode: 'dark',
        background: {
          default: '#0a0a0a',
          paper: '#1a1a1a',
        },
        primary: {
          main: '#a78bfa',
          contrastText: '#ffffff'
        },
        text: {
          primary: '#e5e7eb',
          secondary: '#9ca3af',
        },
        divider: 'rgba(255, 255, 255, 0.08)'
      },
      typography: {
        fontFamily: "'Archivo', Roboto, sans-serif",
      },
      shape: { borderRadius: 8 },
    });

    // ── State toggle helper ──
    function StateToggle({ states, current, onChange }) {
      return html`
        <\${Stack} direction="row" spacing=\${1} sx=\${{ mb: 3 }}>
          \${states.map(s => html`
            <\${Chip}
              key=\${s}
              label=\${s}
              size="small"
              onClick=\${() => onChange(s)}
              variant=\${current === s ? 'filled' : 'outlined'}
              color=\${current === s ? 'primary' : 'default'}
            />
          `)}
        <//>
      `;
    }

    function MockupApp() {
      const [state, setState] = React.useState('populated');

      return html`
        <\${ThemeProvider} theme=\${theme}>
          <\${CssBaseline} />
          <\${Container} maxWidth="sm" sx=\${{ py: 4 }}>

            <\${Box} sx=\${{ mb: 3 }}>
              <\${Typography} variant="h6" gutterBottom>[Feature Name]<//>
              <\${Typography} variant="caption" color="text.secondary">
                [Brief description]
              <//>
            <//>

            <\${StateToggle}
              states=\${['loading', 'empty', 'populated']}
              current=\${state}
              onChange=\${setState}
            />

            \${state === 'loading'   && html`<\${LoadingState} />`}
            \${state === 'empty'     && html`<\${EmptyState} />`}
            \${state === 'populated' && html`<\${PopulatedState} />`}

          <//>
        <//>
      `;
    }

    const root = createRoot(document.getElementById('root'));
    root.render(html`<\${MockupApp} />`);
  </script>
</body>
</html>
```

---

## Step 1: Gather Requirements

Analyze the feature description (from `ticket-creator` or user). Use `read_file` to review `docs/theme-variants.md` to ensure correct usage of theme variables.

---

## Step 2: Design the Spec

Use your reasoning to develop:
- Layout Blueprint (overall structure and component arrangement)
- MUI Component Inventory (specific MUI components with key props)
- States to Show (loading, empty, populated, error, etc.)
- Theme Token Mapping (which tokens to use for colors/spacing)
- JSX Scaffold (skeleton JSX structure)

---

## Step 3: Write the HTML Mockup

Starting from the boilerplate template above, implement the design spec.
Use the `write_file` tool to save it.

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

## Coding Rules for Mockups

| Rule | Correct | Wrong |
|------|---------|-------|
| HTML elements | `Box`, `Typography`, `Stack` | raw `div`, `p`, `span` |
| Styling | `sx={{ color: 'primary.main' }}` | `style={{ color: '#a78bfa' }}` |
| Color values | theme tokens (`'text.secondary'`) | hex values (`'#9ca3af'`) |
| Loading states | `<Skeleton variant="text" />` | custom CSS shimmer |
| Spacing | `sx={{ gap: 2 }}` (MUI spacing) | `style={{ gap: '16px' }}` |

**Never use hardcoded hex values in `sx` props — always use theme tokens.**
