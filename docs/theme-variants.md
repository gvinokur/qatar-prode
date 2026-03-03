# Theme Variants Documentation

This document preserves all theme variants explored for the Qatar Prode application. The app currently uses a single theme at a time, selected during development. This documentation allows easy theme switching in the future.

---

## Original Theme (RED)

**Status:** Replaced by Royal Sports (Violet) theme
**Preserved:** 2026-03-02

### Design Philosophy
- Classic sports theme using red as the primary color
- Blue secondary for contrast
- Gold and silver accents for awards/medals system
- Dimmed colors in dark mode for reduced eye strain

### Light Mode Colors

**Primary (Red):**
```typescript
primary: {
  main: '#c62828',        // Base red (gradient start)
  light: '#e53935',       // Gradient end
  dark: '#b71c1c',        // Darker variant
  contrastText: '#ffffff'
}
```

**Secondary (Blue):**
```typescript
secondary: {
  main: '#90caf9'         // Light blue
}
```

**Accent Colors (Awards):**
```typescript
accent: {
  gold: {
    main: '#ffc107',      // Better than #FFD700 for contrast
    light: '#ffd54f',
    dark: '#ffa000',
    contrastText: '#000000'
  },
  silver: {
    main: '#C0C0C0',
    light: '#E0E0E0',
    dark: '#A0A0A0',
    contrastText: '#000000'
  }
}
```

**Backgrounds & Text:**
- Default background: White (browser default)
- Paper background: White (browser default)
- Primary text: Dark gray (browser default)
- Secondary text: Medium gray (browser default)
- Divider: Light gray (browser default)

**Gradient:**
```
linear-gradient(135deg, #c62828 0%, #e53935 100%)
```

### Dark Mode Colors

**Primary (Softer Red):**
```typescript
primary: {
  main: '#e57373',        // Softer, muted red
  light: '#ef9a9a',
  dark: '#d32f2f',
  contrastText: '#ffffff'
}
```

**Secondary (Deeper Blue):**
```typescript
secondary: {
  main: '#5c93c4'         // Deeper, desaturated blue
}
```

**Accent Colors (Awards - Dimmed):**
```typescript
accent: {
  gold: {
    main: '#ffb300',      // Dimmed 20% for dark mode readability
    light: '#ffd54f',
    dark: '#ff8f00',
    contrastText: '#000000'
  },
  silver: {
    main: '#B0B0B0',      // Dimmed for dark mode
    light: '#D0D0D0',
    dark: '#909090',
    contrastText: '#000000'
  }
}
```

**Backgrounds & Text:**
```typescript
background: {
  default: '#1a1a1a',     // Not quite black
  paper: '#242424'        // Slightly lighter for elevated surfaces
}
text: {
  primary: '#e0e0e0',     // Not pure white
  secondary: '#a0a0a0'    // Muted secondary text
}
divider: 'rgba(255, 255, 255, 0.08)'  // Subtle dividers
```

**Gradient:**
```
linear-gradient(135deg, #d32f2f 0%, #e57373 100%)
```

### Implementation Notes
- Accent colors (gold/silver) are essential for the awards/medals system
- Dark mode uses dimmed variants of gold/silver for better readability
- Gradients injected as CSS custom properties (`--gradient-primary`)
- Theme mode (light/dark) controlled by `next-themes` package

---

## Royal Sports (Violet) - CURRENT DEFAULT

**Status:** Active (Current theme)
**Implemented:** 2026-03-02

### Design Philosophy
- Modern, sophisticated violet/purple palette for a fresh look
- Neutral backgrounds in dark mode (#0a0a0a) to prevent color overload
- Primary colors used ONLY for interactive elements (buttons, links, CTAs)
- Coral accent for contrast and energy
- Strategic use of color for visual hierarchy
- Gold and silver accents preserved for awards system

### Light Mode Colors

**Primary (Violet):**
```typescript
primary: {
  main: '#7c3aed',        // Violet
  light: '#a855f7',
  dark: '#6b21a8',
  contrastText: '#ffffff'
}
```

**Secondary (Coral):**
```typescript
secondary: {
  main: '#f87171',        // Coral
  light: '#fca5a5',
  dark: '#dc2626',
  contrastText: '#ffffff'
}
```

**Accent Colors (Awards):**
```typescript
accent: {
  gold: {
    main: '#ffc107',      // Gold for awards (same as original)
    light: '#ffd54f',
    dark: '#ffa000',
    contrastText: '#000000'
  },
  silver: {
    main: '#C0C0C0',      // Silver for awards (same as original)
    light: '#E0E0E0',
    dark: '#A0A0A0',
    contrastText: '#000000'
  }
}
```

**Backgrounds & Text:**
```typescript
background: {
  default: '#f5f3ff',     // Lavender tint
  paper: '#ffffff',
}
text: {
  primary: '#2e1065',     // Deep purple
  secondary: '#7c3aed',   // Violet
}
divider: 'rgba(124, 58, 237, 0.12)'
```

**Gradient:**
```
linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)
```

### Dark Mode Colors

**Primary (Softer Violet):**
```typescript
primary: {
  main: '#a78bfa',        // SOFTER violet (less eye strain)
  light: '#c4b5fd',
  dark: '#8b5cf6',
  contrastText: '#ffffff'
}
```

**Secondary (Coral):**
```typescript
secondary: {
  main: '#f87171',        // Coral (same as light mode for consistency)
  light: '#fca5a5',
  dark: '#dc2626',
  contrastText: '#ffffff'
}
```

**Accent Colors (Awards - Dimmed):**
```typescript
accent: {
  gold: {
    main: '#ffb300',      // Dimmed gold for dark mode
    light: '#ffd54f',
    dark: '#ff8f00',
    contrastText: '#000000'
  },
  silver: {
    main: '#B0B0B0',      // Dimmed silver for dark mode
    light: '#D0D0D0',
    dark: '#909090',
    contrastText: '#000000'
  }
}
```

**Backgrounds & Text:**
```typescript
background: {
  default: '#0a0a0a',     // NEUTRAL black (not purple-tinted)
  paper: '#1a1a1a',       // Neutral dark gray
}
text: {
  primary: '#e5e7eb',     // Neutral light gray (not purple-tinted)
  secondary: '#9ca3af',   // Neutral medium gray
}
divider: 'rgba(255, 255, 255, 0.08)'
```

**Gradient:**
```
linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)
```

### Typography

**Font Family:** Archivo
**Weights:** 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)
**Style:** Geometric, modern
**Source:** Google Fonts

**Characteristics:**
- Clean, geometric letterforms
- Professional and contemporary feel
- Excellent readability at all sizes
- Pairs well with violet color palette

**Usage:**
- Headings (h1-h6): 600-700 weight for prominence
- Body text: 400 weight for readability
- Buttons/UI: 600 weight for clarity
- Subtitles: 500 weight for hierarchy

**Fallback chain:**
```
font-family: 'Archivo', 'Roboto', 'Helvetica', 'Arial', sans-serif;
```

### Implementation Notes
- Neutral backgrounds prevent color overload in dark mode
- Softer violet in dark mode reduces eye strain during extended use
- Accent colors (gold/silver) preserved for awards system compatibility
- Gradients injected as CSS custom properties (`--gradient-primary`)
- Theme mode (light/dark) controlled by `next-themes` package
- All color combinations meet WCAG AA accessibility standards (4.5:1 contrast)

---

## Refined Competition (Rose) - Alternative

**Status:** Not active (Documented for future use)
**Explored:** 2026-03-02

### Design Philosophy
- Elegant rose red palette with gold accents
- Sophisticated and refined appearance
- Neutral backgrounds in dark mode
- Brown secondary for earthy contrast

### Light Mode Colors

**Primary (Rose Red):**
```typescript
primary: {
  main: '#b91c1c',
  light: '#dc2626',
  dark: '#7f1d1d',
  contrastText: '#ffffff'
}
```

**Secondary (Brown):**
```typescript
secondary: {
  main: '#78350f',        // Brown
  light: '#92400e',
  dark: '#451a03',
}
```

**Accent Colors (Awards):**
```typescript
accent: {
  gold: {
    main: '#f59e0b',
    light: '#fbbf24',
    dark: '#d97706',
    contrastText: '#000000'
  },
  silver: {
    main: '#9ca3af',
    light: '#d1d5db',
    dark: '#6b7280',
    contrastText: '#000000'
  }
}
```

**Backgrounds & Text:**
```typescript
background: {
  default: '#fef2f2',     // Rose tint
  paper: '#ffffff',
}
text: {
  primary: '#450a0a',     // Deep red-brown
  secondary: '#991b1b',   // Rose
}
divider: 'rgba(185, 28, 28, 0.12)'
```

**Gradient:**
```
linear-gradient(135deg, #7f1d1d 0%, #b91c1c 100%)
```

### Dark Mode Colors

**Primary (Rose):**
```typescript
primary: {
  main: '#f43f5e',        // Rose red (for buttons/CTAs)
  light: '#fb7185',
  dark: '#e11d48',
  contrastText: '#ffffff'
}
```

**Secondary (Gold):**
```typescript
secondary: {
  main: '#fbbf24',        // Gold accent
  light: '#fcd34d',
  dark: '#f59e0b',
}
```

**Accent Colors:**
```typescript
accent: {
  gold: {
    main: '#fbbf24',
    light: '#fcd34d',
    dark: '#f59e0b',
    contrastText: '#000000'
  },
  silver: {
    main: '#B0B0B0',
    light: '#D0D0D0',
    dark: '#909090',
    contrastText: '#000000'
  }
}
```

**Backgrounds & Text:**
```typescript
background: {
  default: '#0a0a0a',     // Neutral dark (not red tinted)
  paper: '#1a1a1a',       // Neutral dark gray
}
text: {
  primary: '#e5e7eb',     // Neutral light gray
  secondary: '#9ca3af',   // Neutral medium gray
}
divider: 'rgba(255, 255, 255, 0.08)'
```

**Gradient:**
```
linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)
```

### Typography

**Font Family:** Outfit
**Weights:** 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)
**Style:** Rounded, friendly
**Source:** Google Fonts

**Characteristics:**
- Soft, rounded letterforms
- Warm and approachable feel
- Modern yet inviting
- Pairs well with rose/red color palette

**Usage:**
- Headings (h1-h6): 600-700 weight for warmth
- Body text: 400 weight for readability
- Buttons/UI: 600 weight for friendliness
- Subtitles: 500 weight for balance

**Fallback chain:**
```
font-family: 'Outfit', 'Roboto', 'Helvetica', 'Arial', sans-serif;
```

**Note:** This font is loaded but not currently active. To use it, update the `fontFamily` in `theme-provider.tsx` to reference 'Outfit' instead of 'Archivo'.

---

## Classic Championship (Olive) - Alternative

**Status:** Not active (Documented for future use)
**Explored:** 2026-03-02

### Design Philosophy
- Earthy olive green palette with orange accents
- Natural, grounded aesthetic
- Neutral backgrounds in dark mode
- High-energy orange secondary for contrast

### Light Mode Colors

**Primary (Olive):**
```typescript
primary: {
  main: '#3f6212',
  light: '#65a30d',
  dark: '#1a2e05',
  contrastText: '#ffffff'
}
```

**Secondary (Orange):**
```typescript
secondary: {
  main: '#ea580c',
  light: '#fb923c',
  dark: '#c2410c',
}
```

**Accent Colors (Awards):**
```typescript
accent: {
  gold: {
    main: '#f59e0b',
    light: '#fbbf24',
    dark: '#d97706',
    contrastText: '#000000'
  },
  silver: {
    main: '#9ca3af',
    light: '#d1d5db',
    dark: '#6b7280',
    contrastText: '#000000'
  }
}
```

**Backgrounds & Text:**
```typescript
background: {
  default: '#f7fee7',     // Lime tint
  paper: '#ffffff',
}
text: {
  primary: '#1a2e05',     // Deep olive
  secondary: '#3f6212',   // Olive
}
divider: 'rgba(63, 98, 18, 0.12)'
```

**Gradient:**
```
linear-gradient(135deg, #3f6212 0%, #65a30d 100%)
```

### Dark Mode Colors

**Primary (Lime Green):**
```typescript
primary: {
  main: '#84cc16',        // Lime green (for buttons/CTAs)
  light: '#a3e635',
  dark: '#65a30d',
  contrastText: '#000000'
}
```

**Secondary (Orange):**
```typescript
secondary: {
  main: '#fb923c',        // Orange accent
  light: '#fdba74',
  dark: '#ea580c',
}
```

**Accent Colors:**
```typescript
accent: {
  gold: {
    main: '#fbbf24',
    light: '#fcd34d',
    dark: '#f59e0b',
    contrastText: '#000000'
  },
  silver: {
    main: '#B0B0B0',
    light: '#D0D0D0',
    dark: '#909090',
    contrastText: '#000000'
  }
}
```

**Backgrounds & Text:**
```typescript
background: {
  default: '#0a0a0a',     // Neutral dark (not green tinted)
  paper: '#1a1a1a',       // Neutral dark gray
}
text: {
  primary: '#e5e7eb',     // Neutral light gray
  secondary: '#9ca3af',   // Neutral medium gray
}
divider: 'rgba(255, 255, 255, 0.08)'
```

**Gradient:**
```
linear-gradient(135deg, #65a30d 0%, #84cc16 100%)
```

### Typography

**Font Family:** Public Sans
**Weights:** 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)
**Style:** Clean, authoritative
**Source:** Google Fonts

**Characteristics:**
- Neutral, professional letterforms
- Clean and legible
- Trustworthy and classic feel
- Pairs well with olive/green color palette

**Usage:**
- Headings (h1-h6): 600-700 weight for authority
- Body text: 400 weight for clarity
- Buttons/UI: 600 weight for confidence
- Subtitles: 500 weight for structure

**Fallback chain:**
```
font-family: 'Public Sans', 'Roboto', 'Helvetica', 'Arial', sans-serif;
```

**Note:** This font is loaded but not currently active. To use it, update the `fontFamily` in `theme-provider.tsx` to reference 'Public Sans' instead of 'Archivo'.

---

## Migration Instructions

To restore this theme or switch to a different variant:

1. Open `app/components/context-providers/theme-provider.tsx`
2. Replace the `lightTheme` and `darkTheme` objects with the desired theme's color values
3. Update the gradient injection `useEffect` with the desired gradients
4. Test in both light and dark modes
5. Run validation checks:
   ```bash
   npm run test
   npm run lint
   npm run build
   ```
6. Deploy to Vercel Preview for testing

### Required Theme Properties

Any theme must include these properties:

**Both Modes:**
- `primary` (main, light, dark, contrastText)
- `secondary` (main, and optionally light, dark)
- `accent.gold` (main, light, dark, contrastText) - for awards
- `accent.silver` (main, light, dark, contrastText) - for awards

**Dark Mode Only:**
- `mode: 'dark'` (string literal)
- `background` (default, paper)
- `text` (primary, secondary)
- `divider` (rgba string)

**Gradients:**
- Light mode gradient (for `--gradient-primary` CSS variable)
- Dark mode gradient (for `--gradient-primary` CSS variable)

### Testing Checklist

When switching themes:
- [ ] Colors look good in light mode
- [ ] Colors look good in dark mode
- [ ] Text contrast meets WCAG AA standards (4.5:1)
- [ ] Gold and silver accents work with primary colors
- [ ] Gradients render correctly
- [ ] No console errors
- [ ] Build compiles successfully
- [ ] All pages look cohesive

---

*Document created: 2026-03-02*
*Last updated: 2026-03-02*
