# Change Plan: Add Theme-Specific Typography (Fonts)

## Context

After implementing the VIOLET color theme, we discovered that the mockup designs included specific Google Fonts for each theme variant:
- **Archivo** for Violet "Royal Sports" theme (geometric, modern)
- **Outfit** for Rose "Refined Competition" theme (rounded, friendly)
- **Public Sans** for Olive "Classic Championship" theme (clean, authoritative)

The color theme was implemented but the typography was not. This change plan adds the font specifications to match the mockup designs.

## Current State

**Fonts currently in use:**
- System font stack via `styles/globals.css`:
  ```css
  font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
    Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
  ```
- No Google Fonts loaded
- No MUI typography configuration in theme

**What's missing:**
- Google Fonts not loaded (Archivo, Outfit, Public Sans)
- MUI theme has no typography section
- Fonts not applied to match mockup design

## Proposed Solution

Add all 3 Google Fonts and configure MUI typography to use **Archivo** as the primary font (matching the Violet theme we implemented).

### Why Archivo as default?
- We implemented the Violet "Royal Sports" theme
- Mockup specifies Archivo for Violet theme
- Described as "geometric, modern" - matches the sophisticated violet aesthetic

### Why add all 3 fonts?
- Prepared for potential future theme switching
- Minimal performance impact (Google Fonts CDN is fast)
- Maintains consistency with mockup designs
- All 3 themes documented in `docs/theme-variants.md`

## Technical Approach

### 1. Load Google Fonts

**Add to:** `app/[locale]/layout.tsx` in the `<head>` section

```tsx
<head>
  <meta name="apple-mobile-web-app-title" content={appName}/>
  {/* Google Fonts for theme typography */}
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
  <link
    href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&family=Public+Sans:wght@400;500;600;700&display=swap"
    rel="stylesheet"
  />
</head>
```

**Font weights loaded:** 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

**Performance optimizations:**
- `rel="preconnect"` for faster DNS resolution
- `display=swap` prevents FOIT (Flash of Invisible Text)
- Fonts cached by Google Fonts CDN

### 2. Configure MUI Typography

**Update:** `app/components/context-providers/theme-provider.tsx`

Add typography configuration to the theme:

```typescript
const theme = createTheme({
  palette: {
    ...themeToUse
  },
  typography: {
    fontFamily: [
      'Archivo',              // Primary: Violet theme font
      'Roboto',               // MUI default fallback
      'Helvetica',            // System fallback
      'Arial',                // System fallback
      'sans-serif',           // Generic fallback
    ].join(','),
    // Optional: Configure font weights for MUI variants
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    subtitle2: { fontWeight: 500 },
    body1: { fontWeight: 400 },
    body2: { fontWeight: 400 },
    button: { fontWeight: 600 },
  },
});
```

**Why this fallback order:**
1. **Archivo** - Primary theme font
2. **Roboto** - Material-UI default (widely available)
3. **Helvetica** - High-quality system font (macOS/iOS)
4. **Arial** - Ubiquitous system font (Windows)
5. **sans-serif** - Generic fallback

### 3. Update Documentation

**Update:** `docs/theme-variants.md`

Add typography information to each theme section:

```markdown
## Royal Sports (Violet)
...
**Typography:**
- Font Family: Archivo
- Weights: 400, 500, 600, 700
- Style: Geometric, modern
- Primary use: All text content
```

(Similar sections for Rose/Outfit and Olive/Public Sans)

## Files to Modify

1. **`app/[locale]/layout.tsx`** - Add Google Fonts link in `<head>`
2. **`app/components/context-providers/theme-provider.tsx`** - Add typography config to createTheme()
3. **`docs/theme-variants.md`** - Document typography for each theme variant

**Total:** 3 files modified

## Implementation Steps

### Phase 1: Add Google Fonts

1. Open `app/[locale]/layout.tsx`
2. Locate the `<head>` section (around line 87)
3. Add preconnect links for Google Fonts
4. Add stylesheet link for Archivo, Outfit, and Public Sans
5. Use font weights: 400, 500, 600, 700 for each font

### Phase 2: Configure MUI Typography

1. Open `app/components/context-providers/theme-provider.tsx`
2. Locate the `createTheme()` call (around line 113)
3. Add `typography` configuration object
4. Set `fontFamily` with Archivo as primary, MUI defaults as fallbacks
5. Optionally configure font weights for MUI typography variants

### Phase 3: Update Documentation

1. Open `docs/theme-variants.md`
2. Add "Typography" subsection to each theme:
   - Royal Sports (Violet) → Archivo
   - Refined Competition (Rose) → Outfit
   - Classic Championship (Olive) → Public Sans
3. Include font weights and style descriptions

### Phase 4: Testing

1. Run `npm run dev`
2. Inspect page in browser DevTools
3. Verify Archivo font is loaded and applied
4. Check Network tab for Google Fonts requests
5. Test typography on various components (headings, buttons, body text)
6. Run build, lint, tests to ensure no regressions

## Testing Strategy

### Visual Testing

**Check font rendering:**
- Open app in browser
- Inspect element → Computed styles → font-family
- Should show: `Archivo, Roboto, Helvetica, Arial, sans-serif`
- Verify font actually renders (not just declared)

**Test on components:**
- Headings (h1-h6) → Should use Archivo with appropriate weights
- Body text → Should use Archivo 400
- Buttons → Should use Archivo 600
- Cards, forms, tables → All should use Archivo

**Browser testing:**
- Chrome (desktop & mobile)
- Safari (desktop & iOS)
- Firefox
- Edge

### Performance Testing

**Check font loading:**
- Network tab → Filter by "fonts.googleapis"
- Should see preconnect + stylesheet requests
- Fonts should load with `display=swap` (no FOIT)
- Total font download size should be reasonable (<200KB for all fonts)

**Lighthouse audit:**
- Run Lighthouse performance test
- Font loading should not impact FCP (First Contentful Paint)
- Should show proper font-display strategy

### Regression Testing

**Run validation checks:**
```bash
npm run test    # Ensure tests pass
npm run lint    # Ensure no linting errors
npm run build   # Ensure build succeeds
```

**Manual regression:**
- Light/dark mode toggle still works
- Violet theme colors still correct
- No layout shifts from font changes
- Accessibility (contrast) still meets WCAG AA

## Typography Specifications

### Archivo (Violet Theme)

**Characteristics:**
- **Style:** Geometric, modern
- **Letterforms:** Clean, professional
- **Best for:** Headings, UI elements, body text
- **Mood:** Sophisticated, contemporary

**Weights available:**
- 400 (Regular) - Body text, paragraphs
- 500 (Medium) - Subtitles, secondary headings
- 600 (Semibold) - Buttons, important text
- 700 (Bold) - Primary headings, emphasis

### Outfit (Rose Theme - Future)

**Characteristics:**
- **Style:** Rounded, friendly
- **Letterforms:** Soft curves, approachable
- **Best for:** Welcoming interfaces, casual tone
- **Mood:** Warm, inviting

**Weights:** 400, 500, 600, 700

### Public Sans (Olive Theme - Future)

**Characteristics:**
- **Style:** Clean, authoritative
- **Letterforms:** Neutral, professional
- **Best for:** Data-heavy interfaces, readability
- **Mood:** Trustworthy, classic

**Weights:** 400, 500, 600, 700

## Performance Considerations

**Font loading strategy:**
- Preconnect to Google Fonts → Faster DNS resolution (~100ms saved)
- `display=swap` → Prevents FOIT, shows system font until custom font loads
- Multiple fonts loaded but browser caches them

**Expected performance impact:**
- **First load:** ~150-200KB for all 3 fonts (12 font files total)
- **Subsequent loads:** Cached by browser (0 additional bytes)
- **LCP impact:** Minimal (<50ms with proper preconnect)

**Optimization opportunities (future):**
- Could use next/font for self-hosting (better caching, no external requests)
- Could load only Archivo initially, lazy-load others
- Could subset fonts to include only needed glyphs

## Risks & Mitigation

**Risk 1: Font Loading Delay**
- **Impact:** Brief moment where system font shows before Archivo loads
- **Mitigation:** `display=swap` makes this intentional, not jarring
- **Mitigation:** Preconnect reduces load time
- **Status:** Low risk - standard practice

**Risk 2: Visual Regression**
- **Impact:** Font change might affect layout (line heights, wrapping)
- **Mitigation:** Archivo is similar to Roboto (MUI default), minimal shift
- **Mitigation:** Test on key pages before merging
- **Status:** Low risk - geometric sans-serifs are similar

**Risk 3: Performance Impact**
- **Impact:** 200KB of fonts on first load
- **Mitigation:** Google Fonts CDN is fast and cacheable
- **Mitigation:** display=swap prevents render blocking
- **Status:** Very low risk - industry standard approach

**Risk 4: Cross-Browser Issues**
- **Impact:** Font might not load in older browsers
- **Mitigation:** Fallback to Roboto → Helvetica → Arial → sans-serif
- **Mitigation:** Google Fonts has excellent browser support
- **Status:** Very low risk - modern browsers all supported

## Success Metrics

**Functional:**
- ✅ Archivo font loads successfully
- ✅ Font applies to all text elements
- ✅ Fallbacks work if font fails to load
- ✅ No console errors

**Visual:**
- ✅ Typography looks modern and geometric
- ✅ Font weights render correctly (400, 500, 600, 700)
- ✅ Headings are bold and prominent
- ✅ Body text is readable and clean

**Performance:**
- ✅ Fonts load within 200ms
- ✅ No FOIT (Flash of Invisible Text)
- ✅ Lighthouse score not negatively impacted
- ✅ Total font size <200KB

**Quality:**
- ✅ All tests pass
- ✅ Linting passes
- ✅ Build succeeds
- ✅ No visual regressions

## Future Enhancements

**If theme switching is re-added:**
```typescript
// Example: Font switching based on theme variant
const getFontFamily = (variant: 'violet' | 'rose' | 'olive') => {
  const fonts = {
    violet: 'Archivo',
    rose: 'Outfit',
    olive: 'Public Sans',
  };
  return `${fonts[variant]}, Roboto, Helvetica, Arial, sans-serif`;
};

// In theme creation:
typography: {
  fontFamily: getFontFamily(currentVariant),
  // ...
}
```

**Self-hosting fonts with next/font:**
```typescript
// app/fonts.ts
import { Archivo, Outfit, Public_Sans } from 'next/font/google';

export const archivo = Archivo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});
```

Benefits: Better caching, no external requests, offline support

## Summary

**What's changing:**
- Adding Google Fonts (Archivo, Outfit, Public Sans)
- Configuring MUI typography to use Archivo
- Documenting typography in theme variants

**What's NOT changing:**
- Color palette (violet theme remains)
- Component structure
- Layout or spacing
- User interactions

**Complexity:** Low
- 3 files modified
- Straightforward font configuration
- Well-documented approach

**Risk:** Very Low
- Standard Google Fonts integration
- Proper fallbacks configured
- No breaking changes

**Timeline:** 1-2 hours
- 30 min: Add Google Fonts and typography config
- 30 min: Test font rendering across components
- 30 min: Update documentation and run validation

---

*Change plan created: 2026-03-02*
*Part of Story #241 - Theme Replacement*
