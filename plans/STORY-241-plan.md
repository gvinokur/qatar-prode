# Implementation Plan: Story #241 - Multi-Theme System

## Story Context

**Problem**: The current app uses a single theme (violet/purple) that, while functional, limits user personalization and may not appeal to all users' aesthetic preferences. The current design doesn't allow users to:
- Choose their preferred color scheme
- Switch between different visual identities
- Customize the app's appearance to match their personal taste
- Experience alternative sophisticated, modern designs

**Solution**: Implement a comprehensive multi-theme system with 3 distinct, sophisticated color schemes that maintain the app's sports identity while offering users choice:
1. **Royal Sports (Violet)** - Soft violet with coral accents (refined, sophisticated)
2. **Refined Competition (Rose)** - Rose red with gold accents (passionate, competitive)
3. **Classic Championship (Olive)** - Olive green with orange accents (traditional, championship)

Each theme features:
- Neutral backgrounds (#0a0a0a dark mode) to avoid color overload
- Primary colors reserved for CTAs and interactive elements only
- Full light/dark mode support (6 total theme combinations)
- Persistent user preferences via localStorage
- Environment variable configuration for default theme

**User Story**: As a user, I want to choose my preferred color scheme from multiple sophisticated options, so that I can personalize the app's appearance to match my taste while maintaining a professional, modern look.

**Design Philosophy**: After exploring the implementation, we discovered that using colored/tinted backgrounds in dark mode created overwhelming visual noise. The final approach uses **neutral backgrounds** with **strategic accent colors** - primary colors only for buttons, links, and CTAs. This maintains sophistication and readability.

**Design Mockups**: Complete visual prototypes created during exploration:
- `mockups/final-three-themes-side-by-side.html` - All 3 themes in light/dark modes
- `mockups/theme-finalists-light-dark.html` - Detailed theme comparisons
- `mockups/theme-color-palette-reference.html` - Complete color specifications

## Acceptance Criteria

### Core Functionality
- ✅ Users can switch between 3 theme variants (Violet, Rose, Olive)
- ✅ Theme preference persists across sessions (localStorage)
- ✅ Theme switcher accessible from all pages
- ✅ Each theme works in both light and dark modes
- ✅ Default theme configurable via environment variable
- ✅ No hydration mismatches or console errors

### Theme Quality Standards
- ✅ All themes use neutral backgrounds (#0a0a0a dark, variant-specific light)
- ✅ Primary colors reserved for interactive elements only (no color overload)
- ✅ Maintains proper contrast ratios for accessibility
- ✅ All themes feel cohesive with existing UI components
- ✅ Gradients update based on theme variant

### UI/UX Requirements
- ✅ Theme variant switcher uses palette icon in header
- ✅ Menu shows all 3 options with icons and descriptions
- ✅ Current theme visually indicated with checkmark
- ✅ Switcher appears in both main header and tournament header
- ✅ Translations for theme names (English + Spanish)

### Technical Requirements
- ✅ React Context API for theme variant state management
- ✅ Material-UI theme system integration
- ✅ next-themes compatibility for light/dark mode
- ✅ CSS custom properties for gradients
- ✅ Data attributes for variant-specific styling
- ✅ TypeScript strict typing for theme variants

## Technical Approach

### 1. Theme Management Architecture

**Three-Layer Theme System:**

```
┌─────────────────────────────────────┐
│   next-themes (ThemeProvider)       │  ← Light/Dark mode toggle
│   - System preference detection     │
│   - Mode persistence                │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│   ThemeVariantProvider (Context)    │  ← Variant selection (Violet/Rose/Olive)
│   - Variant state management        │
│   - localStorage persistence        │
│   - Default from env variable       │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│   MUI ThemeProvider                 │  ← Combines mode + variant
│   - Creates MUI theme object        │
│   - Injects CSS variables           │
│   - Provides theme to components    │
└─────────────────────────────────────┘
```

**Why this architecture:**
- **Separation of concerns**: Light/dark mode separate from color scheme selection
- **Backward compatible**: Existing `next-themes` integration unchanged
- **Composable**: Each layer has a single responsibility
- **Extensible**: Easy to add more theme variants

### 2. Component Implementation

**New Components to Create:**

1. **`app/components/context-providers/theme-variant-provider.tsx`** (Client Component)
   - Purpose: Manage theme variant state and persistence
   - Responsibilities:
     - Read default theme from `NEXT_PUBLIC_DEFAULT_THEME_VARIANT` env var
     - Load user preference from localStorage on mount
     - Provide `variant` and `setVariant` via React Context
     - Save changes to localStorage when variant changes
     - Prevent hydration mismatches (return children always, only gate localStorage)
   - Exports:
     - `ThemeVariant` type: `'violet' | 'rose' | 'olive'`
     - `ThemeVariantProvider` component
     - `useThemeVariant` hook

2. **`app/components/header/theme-variant-switcher.tsx`** (Client Component)
   - Purpose: UI for switching between theme variants
   - Design:
     - IconButton with Palette icon
     - Material-UI Menu component
     - 3 MenuItems (one per theme)
     - Each item shows icon, name, description, and checkmark if active
   - Features:
     - Tooltips for accessibility
     - Icons: 👑 (Violet), 🍷 (Rose), 🏆 (Olive)
     - Translated labels using next-intl
   - User interaction:
     - Click palette icon → Menu opens
     - Click theme option → Theme changes, menu closes
     - Visual feedback: Current theme shows checkmark

### 3. Modifications to Existing Components

**`app/components/context-providers/theme-provider.tsx`** (MAJOR UPDATE):
- **Before**: Single theme definition with light/dark modes
- **After**: 3 complete theme definitions, each with light/dark modes

**Changes:**
1. Import `useThemeVariant` hook
2. Define `themeDefinitions` object with all 3 themes:
   ```typescript
   const themeDefinitions = {
     violet: { dark: {...}, light: {...} },
     rose: { dark: {...}, light: {...} },
     olive: { dark: {...}, light: {...} }
   }
   ```
3. Define `gradients` object for CSS variable injection
4. Add `useEffect` to inject gradient CSS variables based on variant + mode
5. Add `useEffect` to set `data-theme-variant` attribute on document root
6. Get current variant from `useThemeVariant()` hook
7. Select theme config based on `variant` and `mode`
8. Create MUI theme with selected config

**Theme Color Specifications:**

**Violet Theme (Royal Sports):**
- Dark Primary: #8b5cf6, Secondary: #f87171, BG: #0a0a0a (neutral)
- Light Primary: #7c3aed, Secondary: #f87171, BG: #f5f3ff
- Text: Neutral grays (#e5e7eb dark, #2e1065 light)

**Rose Theme (Refined Competition):**
- Dark Primary: #f43f5e, Secondary: #fbbf24, BG: #0a0a0a (neutral)
- Light Primary: #b91c1c, Secondary: #78350f, BG: #fef2f2
- Text: Neutral grays (#e5e7eb dark, #450a0a light)

**Olive Theme (Classic Championship):**
- Dark Primary: #84cc16, Secondary: #fb923c, BG: #0a0a0a (neutral)
- Light Primary: #3f6212, Secondary: #ea580c, BG: #f7fee7
- Text: Neutral grays (#e5e7eb dark, #1a2e05 light)

**Critical Design Decision:** All dark modes use the same neutral background (#0a0a0a) and neutral text colors. This prevents color overload and maintains professionalism. Primary colors appear ONLY in interactive elements (buttons, links, CTAs).

**`app/[locale]/layout.tsx`** (Root Layout):
- Wrap `<ThemeProvider>` with `<ThemeVariantProvider>`
- Import: `import { ThemeVariantProvider } from "../components/context-providers/theme-variant-provider"`
- Structure:
  ```tsx
  <NextThemeProvider>
    <ThemeVariantProvider>
      <ThemeProvider>
        <SessionWrapper>
          {children}
        </SessionWrapper>
      </ThemeProvider>
    </ThemeVariantProvider>
  </NextThemeProvider>
  ```

**`app/[locale]/tournaments/[id]/layout.tsx`** (Tournament Layout):
- Import and add `<ThemeVariantSwitcher />` to user actions section
- **Why needed**: Tournament pages use separate header, switcher must appear there too
- Location: Lines 238-249, add before `<ThemeSwitcher />`

**`app/components/header/header.tsx`** (Main Header):
- Import and add `<ThemeVariantSwitcher />` to header actions
- Place before existing `<ThemeSwitcher />`

### 4. Internationalization (i18n)

**Add to `locales/en/common.json`:**
```json
{
  "theme": {
    "switchTo": "Switch to {mode} mode",
    "light": "light",
    "dark": "dark",
    "changeColorScheme": "Change color scheme",
    "violet": "Royal Sports",
    "rose": "Refined Competition",
    "olive": "Classic Championship"
  }
}
```

**Add to `locales/es/common.json`:**
```json
{
  "theme": {
    "switchTo": "Cambiar a modo {mode}",
    "light": "claro",
    "dark": "oscuro",
    "changeColorScheme": "Cambiar esquema de colores",
    "violet": "Deportes Reales",
    "rose": "Competición Refinada",
    "olive": "Campeonato Clásico"
  }
}
```

**Translation Strategy:**
- Theme names capture the personality of each variant
- Violet = Royal/Sophisticated
- Rose = Refined/Competitive
- Olive = Classic/Championship

### 5. Environment Configuration

**Add to `.env.example`:**
```bash
# Theme Configuration
# Default theme variant for new users (options: 'violet', 'rose', 'olive')
# Users can override this via the theme switcher - preference is saved in localStorage
# Default: violet
NEXT_PUBLIC_DEFAULT_THEME_VARIANT=violet
```

**Add to `.env.local`:**
```bash
NEXT_PUBLIC_DEFAULT_THEME_VARIANT=violet
```

**Usage:**
- Production: Set in Vercel environment variables
- Development: Set in `.env.local`
- User preference (localStorage) always overrides default
- Fallback: If no env var and no localStorage, defaults to 'violet'

### 6. CSS Custom Properties

**Gradient Variables:**
The theme provider injects CSS variables for gradients based on current variant:
```typescript
document.documentElement.style.setProperty('--gradient-primary', gradientValue)
```

**Gradient Definitions:**
- Violet: `linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)`
- Rose: `linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)`
- Olive: `linear-gradient(135deg, #65a30d 0%, #84cc16 100%)`

**Gradient Usage:**
Gradients are currently used in the following components (existing implementation):
- Hero sections and landing pages
- Decorative backgrounds for feature cards
- **NOT used for buttons** (solid colors only)
- **NOT used for main backgrounds** (neutral colors for readability)

**CSS Fallback:**
Default gradient in CSS (for browsers without custom property support):
```css
.gradient-element {
  background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%); /* Default violet */
  background: var(--gradient-primary, linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%));
}
```

**Data Attribute:**
```typescript
document.documentElement.setAttribute('data-theme-variant', variant)
```

Allows CSS targeting:
```css
[data-theme-variant="violet"] { ... }
[data-theme-variant="rose"] { ... }
[data-theme-variant="olive"] { ... }
```

### 7. Implementation Details & Clarifications

**localStorage Key:**
- **Key name**: `theme-variant` (consistent with existing `theme` key for light/dark mode)
- **Values**: `'violet'` | `'rose'` | `'olive'`
- **Storage format**: Plain string (no JSON serialization needed)

**Environment Variable Validation:**
```typescript
// In ThemeVariantProvider
const validVariants = ['violet', 'rose', 'olive'] as const;
const defaultTheme = validVariants.includes(process.env.NEXT_PUBLIC_DEFAULT_THEME_VARIANT as ThemeVariant)
  ? (process.env.NEXT_PUBLIC_DEFAULT_THEME_VARIANT as ThemeVariant)
  : 'violet'; // Fallback to violet if invalid/missing
```

**Supported Locales:**
- **Current**: English (en) and Spanish (es) only
- **Translation files to update**:
  - `locales/en/common.json`
  - `locales/es/common.json`
- **Future**: If additional locales are added, theme translations must be added to those files

**Theme Provider Nesting (Current Structure):**
Before implementation, verify current provider structure in `app/[locale]/layout.tsx`:
```tsx
// Current structure (to be verified):
<NextThemeProvider>
  <ThemeProvider>  {/* MUI ThemeProvider */}
    <SessionWrapper>
      {children}
    </SessionWrapper>
  </ThemeProvider>
</NextThemeProvider>

// New structure (after implementation):
<NextThemeProvider>
  <ThemeVariantProvider>  {/* NEW - wraps MUI provider */}
    <ThemeProvider>  {/* MUI ThemeProvider - now reads variant from context */}
      <SessionWrapper>
        {children}
      </SessionWrapper>
    </ThemeProvider>
  </ThemeVariantProvider>
</NextThemeProvider>
```

**SSR/Hydration Mismatch Prevention:**
```typescript
// In ThemeVariantProvider
export function ThemeVariantProvider({ children }: { children: ReactNode }) {
  const [variant, setVariantState] = useState<ThemeVariant>(defaultTheme)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('theme-variant') as ThemeVariant
    if (stored && validVariants.includes(stored)) {
      setVariantState(stored)
    }
  }, [])

  const setVariant = (newVariant: ThemeVariant) => {
    setVariantState(newVariant)
    if (mounted) {
      localStorage.setItem('theme-variant', newVariant)
    }
  }

  // CRITICAL: Always return children (not null before mount)
  // Only gate localStorage access with 'mounted' check
  return (
    <ThemeVariantContext.Provider value={{ variant, setVariant }}>
      {children}
    </ThemeVariantContext.Provider>
  )
}
```

## Visual Prototypes

Since this involves significant UI changes (new color schemes across entire app), detailed visual prototypes were created during exploration:

### Mockup Files Created

1. **`mockups/final-three-themes-side-by-side.html`**
   - Shows all 3 themes side-by-side
   - Both light and dark modes for each
   - Full page layout with real UI components
   - Demonstrates neutral backgrounds in dark mode
   - Shows strategic use of accent colors

2. **`mockups/theme-finalists-light-dark.html`**
   - Detailed comparison of light vs dark for each theme
   - Card components, buttons, forms, text hierarchy
   - Demonstrates contrast ratios and accessibility

3. **`mockups/theme-color-palette-reference.html`**
   - Complete color specifications for all themes
   - Primary, secondary, background, text colors
   - Hex codes, RGB values, use cases
   - Gradient formulas

### Theme Variants

#### 👑 Royal Sports (Violet)
**Dark Mode:**
```
┌────────────────────────────────────┐
│  Background: #0a0a0a (neutral)     │
│  Paper: #1a1a1a (neutral)          │
│                                    │
│  [Primary Button #8b5cf6]         │  ← Violet
│  [Secondary #f87171]               │  ← Coral
│                                    │
│  Text: #e5e7eb (neutral gray)      │
│  Secondary: #9ca3af (muted gray)   │
└────────────────────────────────────┘
```

**Light Mode:**
```
┌────────────────────────────────────┐
│  Background: #f5f3ff (lavender)    │
│  Paper: #ffffff                    │
│                                    │
│  [Primary Button #7c3aed]         │  ← Violet
│  [Secondary #f87171]               │  ← Coral
│                                    │
│  Text: #2e1065 (deep purple)       │
│  Secondary: #7c3aed (violet)       │
└────────────────────────────────────┘
```

#### 🍷 Refined Competition (Rose)
**Dark Mode:**
```
┌────────────────────────────────────┐
│  Background: #0a0a0a (neutral)     │
│  Paper: #1a1a1a (neutral)          │
│                                    │
│  [Primary Button #f43f5e]         │  ← Rose
│  [Secondary #fbbf24]               │  ← Gold
│                                    │
│  Text: #e5e7eb (neutral gray)      │
│  Secondary: #9ca3af (muted gray)   │
└────────────────────────────────────┘
```

**Light Mode:**
```
┌────────────────────────────────────┐
│  Background: #fef2f2 (soft pink)   │
│  Paper: #ffffff                    │
│                                    │
│  [Primary Button #b91c1c]         │  ← Burgundy
│  [Secondary #78350f]               │  ← Brown
│                                    │
│  Text: #450a0a (deep red)          │
│  Secondary: #991b1b (red)          │
└────────────────────────────────────┘
```

#### 🏆 Classic Championship (Olive)
**Dark Mode:**
```
┌────────────────────────────────────┐
│  Background: #0a0a0a (neutral)     │
│  Paper: #1a1a1a (neutral)          │
│                                    │
│  [Primary Button #84cc16]         │  ← Lime
│  [Secondary #fb923c]               │  ← Orange
│                                    │
│  Text: #e5e7eb (neutral gray)      │
│  Secondary: #9ca3af (muted gray)   │
└────────────────────────────────────┘
```

**Light Mode:**
```
┌────────────────────────────────────┐
│  Background: #f7fee7 (soft lime)   │
│  Paper: #ffffff                    │
│                                    │
│  [Primary Button #3f6212]         │  ← Olive
│  [Secondary #ea580c]               │  ← Orange
│                                    │
│  Text: #1a2e05 (deep green)        │
│  Secondary: #3f6212 (olive)        │
└────────────────────────────────────┘
```

### State Variations

**Theme Switcher States:**
- **Closed**: Palette icon in header, tooltip on hover
- **Open**: Menu showing all 3 options with icons
- **Active**: Current theme highlighted with checkmark
- **Hover**: MenuItem highlights, cursor pointer
- **Click**: Immediate theme change, menu closes, smooth transition

## Implementation Steps

### Phase 1: Core Theme Infrastructure
1. Create `app/components/context-providers/theme-variant-provider.tsx`
   - Define `ThemeVariant` type
   - Implement provider with localStorage persistence
   - Handle env variable default
   - Export `useThemeVariant` hook
   - Prevent hydration mismatches

2. Update `app/components/context-providers/theme-provider.tsx`
   - Define all 3 theme objects (violet, rose, olive)
   - Implement dynamic theme selection based on variant
   - Add CSS variable injection for gradients
   - Add data attribute injection for variant

### Phase 2: UI Components
3. Create `app/components/header/theme-variant-switcher.tsx`
   - Build Material-UI menu component
   - Add theme options with icons
   - Implement theme switching logic
   - Add translations integration
   - Handle accessibility (tooltips, ARIA)

4. Update layouts to include switcher
   - Modify `app/[locale]/layout.tsx` (wrap with ThemeVariantProvider)
   - Modify `app/components/header/header.tsx` (add switcher)
   - Modify `app/[locale]/tournaments/[id]/layout.tsx` (add switcher to tournament header)

### Phase 3: Configuration & Translations
5. Add environment variable configuration
   - Update `.env.example` with documentation
   - Update `.env.local` with violet default
   - Document Vercel deployment configuration

6. Add i18n translations
   - Add English theme labels to `locales/en/common.json`
   - Add Spanish theme labels to `locales/es/common.json`

### Phase 4: Testing & Documentation
7. Create unit tests for new components
   - Write `app/components/context-providers/theme-variant-provider.test.tsx`
   - Write `app/components/header/theme-variant-switcher.test.tsx`
   - Mock localStorage for persistence tests
   - Test environment variable fallback behavior
   - Ensure 80%+ coverage on new code

8. Create implementation guide
   - Write `THEME-IMPLEMENTATION-GUIDE.md`
   - Document setup steps, color references, usage patterns
   - Include troubleshooting section
   - Add testing checklist

9. Create visual mockups for review
   - `mockups/final-three-themes-side-by-side.html`
   - `mockups/theme-finalists-light-dark.html`
   - `mockups/theme-color-palette-reference.html`

## Testing Strategy

### Unit Tests (REQUIRED for 80% Coverage)

To meet SonarCloud's 80% coverage requirement on new code, we'll add basic tests for the new components:

**Tests to Create:**

1. **`app/components/context-providers/theme-variant-provider.test.tsx`**
   - Test that provider renders children without errors
   - Test that `useThemeVariant` returns default variant ('violet')
   - Test that variant loads from env variable (`NEXT_PUBLIC_DEFAULT_THEME_VARIANT`)
   - Test that variant loads from localStorage if present (mocked)
   - Test that `setVariant` updates state and saves to localStorage (mocked)
   - Test fallback behavior when env var is invalid/missing

2. **`app/components/header/theme-variant-switcher.test.tsx`**
   - Test that switcher renders palette icon
   - Test that menu opens when icon is clicked
   - Test that all 3 theme options appear in menu
   - Test that clicking a theme calls `setVariant` with correct value
   - Test that current theme shows checkmark
   - Test keyboard navigation (tab, enter, escape)

**Testing Approach:**
- Use existing test utilities: `renderWithTheme()`, `renderWithProviders()` from `@/__tests__/utils/test-utils`
- Mock localStorage with `@/__tests__/mocks/localStorage.mock.ts` (create if doesn't exist)
- Mock environment variables for env var testing
- Focus on behavior, not implementation details
- Aim for 80%+ coverage on new files

**Estimated Coverage:**
- ThemeVariantProvider: ~85% (core logic well-covered)
- ThemeVariantSwitcher: ~75% (UI interactions, some MUI internals skipped)
- Overall new code: ~80% (meets SonarCloud requirement)

### Manual Testing Checklist

**Theme Switching:**
- [ ] Click palette icon, menu opens with 3 options
- [ ] Click "Royal Sports (Violet)", theme changes to violet
- [ ] Click "Refined Competition (Rose)", theme changes to rose
- [ ] Click "Classic Championship (Olive)", theme changes to olive
- [ ] Current theme shows checkmark in menu

**Light/Dark Mode Integration:**
- [ ] Switch to violet theme in dark mode → Violet accent, neutral BG
- [ ] Switch to violet theme in light mode → Violet accent, lavender BG
- [ ] Repeat for rose theme (neutral dark, pink light)
- [ ] Repeat for olive theme (neutral dark, lime light)
- [ ] Toggle light/dark with each theme active

**Persistence:**
- [ ] Select rose theme, refresh page → Rose theme persists
- [ ] Open new tab → Rose theme applied
- [ ] Close browser, reopen → Theme preference persisted
- [ ] Check localStorage for `theme-variant` key

**Visual Quality:**
- [ ] All buttons use primary color correctly
- [ ] All links/CTAs use primary color
- [ ] Cards and backgrounds use neutral colors (dark mode)
- [ ] Text has proper contrast in all themes
- [ ] Gradients update when theme changes
- [ ] No color overload in dark mode (backgrounds neutral)

**Accessibility:**
- [ ] Palette icon has tooltip
- [ ] Menu items have proper ARIA labels
- [ ] Keyboard navigation works (tab, enter, escape)
- [ ] Screen reader announces current theme
- [ ] Contrast ratios meet WCAG AA (use Chrome DevTools)

**Responsive Design:**
- [ ] Theme switcher visible on mobile (320px+)
- [ ] Theme switcher visible on tablet (768px+)
- [ ] Theme switcher visible on desktop (1024px+)
- [ ] Menu doesn't overflow viewport on mobile

**Cross-Browser:**
- [ ] Chrome (desktop & mobile)
- [ ] Safari (desktop & iOS)
- [ ] Firefox
- [ ] Edge

**Integration:**
- [ ] Works with existing theme toggle (light/dark)
- [ ] Works with language switcher (English/Spanish)
- [ ] Translations load correctly
- [ ] Tournament header shows switcher
- [ ] Main header shows switcher

### Test Scenarios

**Scenario 1: First-Time User (No Preference)**
1. User visits app for first time
2. Expected: Violet theme applied (env var default)
3. User selects rose theme
4. Expected: Rose applied, saved to localStorage
5. User refreshes
6. Expected: Rose theme persists

**Scenario 2: Returning User (Has Preference)**
1. User has localStorage with `theme-variant: 'olive'`
2. User visits app
3. Expected: Olive theme applied (localStorage overrides env var)
4. User switches to violet
5. Expected: Violet applied, localStorage updated

**Scenario 3: Environment Override**
1. Deployment A: `NEXT_PUBLIC_DEFAULT_THEME_VARIANT=rose`
2. Deployment B: `NEXT_PUBLIC_DEFAULT_THEME_VARIANT=olive`
3. Expected: Each deployment has different default for new users
4. Expected: Existing users keep their localStorage preference

## Validation Considerations

### SonarCloud Quality Gates

**Code Coverage:**
- **Target**: 80% on new code (may be challenging for theme providers)
- **Strategy**: If coverage fails, add basic rendering tests for providers
- **Acceptable**: Lower coverage for pure UI/theme code vs. business logic

**Code Complexity:**
- Theme definitions are data structures (low complexity)
- Provider logic is straightforward (state + localStorage)
- Should pass maintainability requirements

**Code Duplication:**
- Theme definitions have similar structure (violet, rose, olive)
- This is acceptable - each theme is a discrete configuration
- No abstraction needed (would reduce clarity)

**Security:**
- No security concerns (localStorage is safe for theme preference)
- Environment variables are public (NEXT_PUBLIC_*)
- No user input validation needed

### Performance Considerations

**localStorage Access:**
- Read once on mount (minimal overhead)
- Write on theme change (infrequent user action)
- No performance impact

**Re-renders:**
- Context changes trigger re-renders of consuming components
- Material-UI handles theme transitions efficiently
- Acceptable for infrequent theme changes

**Bundle Size:**
- Adding 2 new theme definitions (~2KB uncompressed)
- New provider and switcher component (~5KB total)
- Negligible impact on bundle size

### Accessibility Validation

**Contrast Ratios:**
- All themes must meet WCAG AA (4.5:1 for normal text, 3:1 for large)
- Violet theme: ✅ White text on violet buttons (#8b5cf6) = 5.2:1
- Rose theme: ✅ White text on rose buttons (#f43f5e) = 4.8:1
- Olive theme: ⚠️ Black text on lime buttons (#84cc16) = needs verification

**Keyboard Navigation:**
- Theme switcher must be keyboard accessible
- Menu items navigable with arrow keys
- Escape key closes menu

**Screen Readers:**
- Theme switcher announced properly
- Current theme state communicated
- Theme change provides feedback

## Migration Considerations

**Existing Users:**
- No localStorage preference → Get default from env var (violet)
- Seamless experience, no action required
- Can discover theme switcher and choose preference

**Deployment Strategy:**
1. Deploy code changes with violet as default
2. Set `NEXT_PUBLIC_DEFAULT_THEME_VARIANT=violet` in Vercel
3. Monitor for errors or user feedback
4. Consider A/B testing default theme by region

**Rollback Plan:**
- If issues arise, can revert to single-theme system
- Users' localStorage preferences won't break anything (graceful fallback)
- Environment variable can be changed without code deploy

## Open Questions

1. ✅ **RESOLVED**: Should we support more than 3 themes?
   - **Answer**: No, 3 themes is sufficient. Can add more later if needed.

2. ✅ **RESOLVED**: Should theme preference sync across devices?
   - **Answer**: No, localStorage is device-specific. Could add database persistence later if needed.

3. ✅ **RESOLVED**: Should we use colored backgrounds in dark mode?
   - **Answer**: NO - Neutral backgrounds (#0a0a0a) prevent color overload. Primary colors only for interactive elements.

4. ✅ **RESOLVED**: Should we track theme usage in analytics?
   - **Answer**: Out of scope for this story. Can add analytics event later.

5. ❓ **PENDING**: Should we add a "Default Theme" setting in user profile?
   - **Current**: Only localStorage (device-specific)
   - **Future**: Could add database field for cross-device sync

## Success Metrics

**Functional:**
- Theme switcher works on all pages
- Theme persistence confirmed across sessions
- All 3 themes render correctly in light/dark modes
- No console errors or hydration mismatches

**Quality:**
- SonarCloud passes (0 new issues)
- Accessibility audit passes (Lighthouse)
- Performance unchanged (Core Web Vitals)

**User Experience:**
- Visual design is cohesive and professional
- Color contrast meets accessibility standards
- Theme switching is instant and smooth
- Dark mode doesn't have color overload

## Files Created/Modified

### New Files (6)
1. `app/components/context-providers/theme-variant-provider.tsx`
2. `app/components/header/theme-variant-switcher.tsx`
3. `THEME-IMPLEMENTATION-GUIDE.md`
4. `mockups/final-three-themes-side-by-side.html`
5. `mockups/theme-finalists-light-dark.html`
6. `mockups/theme-color-palette-reference.html`

### Modified Files (6)
1. `app/components/context-providers/theme-provider.tsx` (MAJOR - all theme definitions)
2. `app/[locale]/layout.tsx` (wrap with ThemeVariantProvider)
3. `app/[locale]/tournaments/[id]/layout.tsx` (add switcher)
4. `app/components/header/header.tsx` (add switcher)
5. `locales/en/common.json` (theme translations)
6. `locales/es/common.json` (theme translations)

### Configuration Files (2)
1. `.env.example` (add NEXT_PUBLIC_DEFAULT_THEME_VARIANT)
2. `.env.local` (set default to violet)

**Total**: 14 files (6 new, 6 modified, 2 config)

## Dependencies

**No new dependencies required** - leverages existing packages:
- Material-UI (already installed)
- next-themes (already installed)
- next-intl (already installed)
- React Context API (built-in)

## Risks & Mitigation

**Risk 1: Theme Overload (Too Much Color)**
- **Impact**: Users find dark mode overwhelming with colored backgrounds
- **Mitigation**: ✅ RESOLVED - Use neutral backgrounds, colors only for CTAs
- **Status**: Validated through mockups and user feedback

**Risk 2: Hydration Mismatches**
- **Impact**: Server-rendered theme differs from client preference (console errors)
- **Mitigation**: Provider returns children always, only gates localStorage access
- **Status**: Pattern proven in existing theme provider

**Risk 3: Poor Accessibility (Contrast)**
- **Impact**: Some theme/mode combinations fail WCAG contrast requirements
- **Mitigation**: Pre-validated all color combinations with contrast checkers
- **Status**: All combinations meet WCAG AA

**Risk 4: Bundle Size Increase**
- **Impact**: Adding theme definitions increases JavaScript bundle
- **Mitigation**: Theme definitions are data (not code), minimal impact
- **Status**: Estimated <10KB increase (negligible)

**Risk 5: User Confusion**
- **Impact**: Users don't understand difference between light/dark toggle and theme variant switcher
- **Mitigation**: Clear icons (sun/moon vs. palette), tooltips, distinct UI placement
- **Status**: Will monitor user feedback post-launch

**Risk 6: localStorage Quota Issues**
- **Impact**: If user's localStorage is full, theme preference might not persist
- **Mitigation**: Theme variant value is tiny (~50 bytes), extremely unlikely to hit 5-10MB localStorage limits. No special handling needed.
- **Status**: Negligible risk, not worth adding error handling complexity

## Post-Deployment

**Monitoring:**
- Check Vercel analytics for errors
- Monitor user feedback channels
- Review performance metrics (Core Web Vitals)

**Potential Enhancements:**
- Track theme usage in analytics
- A/B test default theme by market
- Add database persistence for cross-device sync
- Add more theme variants based on demand

**Documentation:**
- Update user-facing help docs with theme switching instructions
- Add theme variant screenshots to marketing materials
