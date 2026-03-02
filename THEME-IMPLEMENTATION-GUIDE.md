# 🎨 Multi-Theme Implementation Guide

This guide will help you implement all 3 theme variants (Soft Violet, Rose Red, Olive Green) with full light/dark mode support.

## 📦 What's Been Created

### New Files:
1. ✅ `app/components/context-providers/theme-variant-provider.tsx` - Manages theme variant state
2. ✅ `app/components/context-providers/theme-provider-new.tsx` - Updated theme provider with all 3 variants
3. ✅ `app/components/header/theme-variant-switcher.tsx` - UI component to switch themes

## 🚀 Implementation Steps

### Step 1: Update Layout to Include Theme Variant Provider

**File:** `app/[locale]/layout.tsx`

Add the `ThemeVariantProvider` wrapper:

```tsx
import { ThemeVariantProvider } from '../components/context-providers/theme-variant-provider';

// ... in your return statement, wrap ThemeProvider:

<NextThemeProvider defaultTheme={'system'} enableSystem={true}>
  <ThemeVariantProvider>  {/* ← ADD THIS */}
    <ThemeProvider>
      <SessionWrapper>
        {/* ... rest of your app */}
      </SessionWrapper>
    </ThemeProvider>
  </ThemeVariantProvider>  {/* ← ADD THIS */}
</NextThemeProvider>
```

### Step 2: Replace Old Theme Provider

**Option A: Rename and replace (Recommended)**

```bash
# Backup old theme provider
mv app/components/context-providers/theme-provider.tsx app/components/context-providers/theme-provider-old.tsx

# Use new theme provider
mv app/components/context-providers/theme-provider-new.tsx app/components/context-providers/theme-provider.tsx
```

**Option B: Manual update**

Replace the contents of `app/components/context-providers/theme-provider.tsx` with the contents of `theme-provider-new.tsx`

### Step 3: Add Theme Variant Switcher to Header

**File:** `app/components/header/header.tsx` (or wherever your header is)

Add the theme variant switcher:

```tsx
import ThemeVariantSwitcher from './theme-variant-switcher';
import ThemeSwitcher from './theme-switcher'; // Your existing dark/light switcher

// In your header component, add the switcher:
<ThemeVariantSwitcher />  {/* Color scheme selector */}
<ThemeSwitcher />         {/* Light/Dark mode selector */}
```

### Step 4: Add Translations (Optional)

**File:** `messages/en.json` and `messages/es.json`

Add theme-related translations:

```json
{
  "common": {
    "theme": {
      "changeColorScheme": "Change color scheme",
      "violet": "Royal Sports",
      "rose": "Refined Competition",
      "olive": "Classic Championship"
    }
  }
}
```

Spanish (`messages/es.json`):

```json
{
  "common": {
    "theme": {
      "changeColorScheme": "Cambiar esquema de colores",
      "violet": "Deportes Reales",
      "rose": "Competición Refinada",
      "olive": "Campeonato Clásico"
    }
  }
}
```

### Step 5: Test the Implementation

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Test theme switching:**
   - Click the palette icon in header
   - Select each theme variant
   - Toggle between light/dark mode
   - Refresh page - theme should persist

3. **Verify localStorage:**
   - Open DevTools → Application → Local Storage
   - Look for `theme-variant` key
   - Should show: `violet`, `rose`, or `olive`

## 🎨 Theme Color Reference

### 👑 Soft Violet (Royal Sports)

**Dark Mode:**
- Primary: `#7c3aed` (Soft Violet)
- Secondary: `#f87171` (Coral)
- Background: `#0f0a1a`
- Paper: `#1e1330`

**Light Mode:**
- Primary: `#7c3aed` (Violet)
- Secondary: `#f87171` (Coral)
- Background: `#f5f3ff` (Lavender tint)
- Paper: `#ffffff`

### 🍷 Rose Red (Refined Competition)

**Dark Mode:**
- Primary: `#e11d48` (Rose Red)
- Secondary: `#fde68a` (Cream)
- Background: `#120808`
- Paper: `#1c0e0e`

**Light Mode:**
- Primary: `#b91c1c` (Burgundy)
- Secondary: `#78350f` (Brown)
- Background: `#fef2f2` (Pink tint)
- Paper: `#ffffff`

### 🏆 Olive Green (Classic Championship)

**Dark Mode:**
- Primary: `#65a30d` (Olive Green)
- Secondary: `#ea580c` (Orange)
- Background: `#050a05`
- Paper: `#0d1a0d`

**Light Mode:**
- Primary: `#3f6212` (Dark Olive)
- Secondary: `#ea580c` (Orange)
- Background: `#f7fee7` (Lime tint)
- Paper: `#ffffff`

## 🎯 Usage in Components

### Using Theme Variant in Your Code

```tsx
import { useThemeVariant } from '@/app/components/context-providers/theme-variant-provider';

function MyComponent() {
  const { variant, setVariant } = useThemeVariant();

  // Current variant: 'violet' | 'rose' | 'olive'
  console.log('Current theme:', variant);

  // Change variant programmatically
  const handleClick = () => {
    setVariant('rose');
  };

  return <button onClick={handleClick}>Switch to Rose</button>;
}
```

### Variant-Specific Styling (CSS)

You can use the `data-theme-variant` attribute for variant-specific CSS:

```css
/* Global styles based on variant */
[data-theme-variant="violet"] {
  /* Violet-specific styles */
}

[data-theme-variant="rose"] {
  /* Rose-specific styles */
}

[data-theme-variant="olive"] {
  /* Olive-specific styles */
}
```

### Using MUI Theme

The theme automatically updates when variant changes:

```tsx
import { useTheme } from '@mui/material/styles';

function MyComponent() {
  const theme = useTheme();

  // Access theme colors
  const primaryColor = theme.palette.primary.main;
  const bgColor = theme.palette.background.default;

  return (
    <Box sx={{
      backgroundColor: 'primary.main',  // Automatically uses current variant
      color: 'text.primary'
    }}>
      Content
    </Box>
  );
}
```

## 🔧 Customization

### Changing Default Theme

Edit `theme-variant-provider.tsx`:

```tsx
// Change default from 'violet' to 'rose' or 'olive'
const [variant, setVariantState] = useState<ThemeVariant>('rose')
```

### Adding More Theme Variants

1. **Add new variant type:**
   ```tsx
   // theme-variant-provider.tsx
   export type ThemeVariant = 'violet' | 'rose' | 'olive' | 'blue' // ← Add new variant
   ```

2. **Define theme colors:**
   ```tsx
   // theme-provider.tsx
   const themeDefinitions = {
     // ... existing themes
     blue: {
       dark: { /* colors */ },
       light: { /* colors */ }
     }
   }
   ```

3. **Add to switcher:**
   ```tsx
   // theme-variant-switcher.tsx
   const themeVariants = [
     // ... existing variants
     {
       value: 'blue',
       labelKey: 'blue',
       icon: '💙',
       description: 'Ocean Blue'
     }
   ]
   ```

## 📊 Testing Checklist

- [ ] Theme switcher appears in header
- [ ] Can switch between all 3 variants
- [ ] Can toggle light/dark mode for each variant
- [ ] Theme persists after page refresh
- [ ] Theme persists in new tabs/windows
- [ ] All buttons/links use correct colors
- [ ] Cards and backgrounds use correct colors
- [ ] Text has proper contrast in all variants
- [ ] Gradients update correctly
- [ ] No console errors
- [ ] Works on mobile viewport

## 🐛 Troubleshooting

### Theme not persisting
- Check localStorage in DevTools
- Verify `theme-variant` key exists
- Check that `ThemeVariantProvider` wraps the app

### Wrong colors showing
- Verify you replaced the old theme provider
- Check browser cache - do a hard refresh (Cmd+Shift+R)
- Verify theme definitions are correct

### Switcher not appearing
- Check that you imported `ThemeVariantSwitcher` in header
- Verify MUI icons are installed: `npm list @mui/icons-material`
- Check console for errors

### Hydration mismatch error
- The providers return `null` until mounted to prevent this
- If you still see it, check that you're not accessing theme on server

## 🎉 Next Steps

Once implemented, you can:

1. **Gather user feedback** - See which theme users prefer
2. **A/B test** - Track conversion/engagement by theme
3. **Let users choose** - Keep the switcher permanently
4. **Set default by region** - Different themes for different locales
5. **Analytics** - Track theme usage with your analytics tool

## 📝 File Summary

```
app/
├── components/
│   ├── context-providers/
│   │   ├── theme-variant-provider.tsx    (NEW - Theme variant state)
│   │   └── theme-provider.tsx            (UPDATED - All 3 themes)
│   └── header/
│       └── theme-variant-switcher.tsx    (NEW - UI to switch themes)
└── [locale]/
    └── layout.tsx                        (UPDATE - Add provider)
```

## ✅ Implementation Complete!

After following these steps, your app will have:
- ✅ 3 unique, sophisticated theme variants
- ✅ Full light + dark mode support (6 total themes)
- ✅ Theme persistence across sessions
- ✅ Beautiful theme switcher UI
- ✅ No cookie-cutter teal in sight! 🎨
