# Snackbar & Semantic Colors Audit

**Created:** 2026-03-03
**Story:** #243 - Improved Theme Color Adoption
**User Request:** *"Can we audit snackbars in general... to understand if they are using proper color or if we should modify them somehow? Also, our overall success, warning, error, info; does it still work well in the context of the new theme?"*

---

## Executive Summary

**Current State:**
- ✅ Snackbars are using semantic colors correctly (`severity="success"`, `severity="error"`, etc.)
- ⚠️ Theme does NOT customize semantic colors - using MUI defaults
- ⚠️ MUI default **info blue** (#0288d1) may clash with violet/coral theme aesthetic

**Recommendation:**
- Consider customizing semantic colors to match violet/coral palette
- Or keep MUI defaults for universal recognition (recommended)

---

## Current Theme Configuration

**From `theme-provider.tsx`:**

The theme defines:
- ✅ Primary: Violet (#7c3aed light, #a78bfa dark)
- ✅ Secondary: Coral (#f87171)
- ✅ Accent: Gold/Silver (awards)
- ❌ Success: **Not customized** (MUI default)
- ❌ Warning: **Not customized** (MUI default)
- ❌ Error: **Not customized** (MUI default)
- ❌ Info: **Not customized** (MUI default)

**MUI Default Semantic Colors:**

| Severity | Light Mode | Dark Mode | Usage |
|----------|-----------|-----------|-------|
| **success** | Green #2e7d32 | Green #66bb6a | Saved, completed, success |
| **error** | Red #d32f2f | Red #f44336 | Errors, failures, critical |
| **warning** | Orange #ed6c02 | Orange #ffa726 | Warnings, offline, caution |
| **info** | Blue #0288d1 | Blue #29b6f6 | Info, locked, neutral alerts |

---

## Snackbar Inventory

**Found 22 files with Snackbar components.**

### Key User-Facing Snackbars

#### 1. **PWA Installation** (`Install-pwa.tsx`)
```tsx
<Alert severity="success" variant="outlined" icon={<InstallMobile />}>
  <AlertTitle>{t('install.title')}</AlertTitle>
  <Button variant="contained" color="success">Install</Button>
</Alert>
```
- **Color:** Success (green)
- **Purpose:** Prompt user to install PWA
- **Assessment:** ✅ Correct use of success color for positive action

#### 2. **Notifications Permission** (`notifications-subscription-prompt.tsx`)
```tsx
<Alert severity="info" variant="outlined">
  <AlertTitle>{t('notifications.title')}</AlertTitle>
  <Button color="inherit">Activate</Button>
</Alert>
```
- **Color:** Info (blue)
- **Purpose:** Prompt user to enable notifications
- **Assessment:** ⚠️ Blue might clash with violet theme, but appropriate for informational prompt

#### 3. **Offline Detection** (`offline-detection.tsx`)
```tsx
<Alert severity="warning">
  {t('offline.message')}
</Alert>
```
- **Color:** Warning (orange)
- **Purpose:** Alert user when offline
- **Assessment:** ✅ Perfect use of warning color for connectivity issues

#### 4. **Qualified Teams Success/Error** (`qualified-teams-client-page.tsx`)
```tsx
// Success
<Alert severity="success">{t('page.savedSuccess')}</Alert>

// Error
<Alert severity="error">{error || t('page.saveError')}</Alert>

// Info (locked)
<Alert severity="info" icon={<LockIcon />}>{t('page.lockedAlert')}</Alert>
```
- **Colors:** Success (green), Error (red), Info (blue)
- **Purpose:** User feedback for save operations and locked state
- **Assessment:** ✅ Standard semantic usage

#### 5. **Verification Banner** (`verification/verification-banner.tsx`)
```tsx
<Alert severity="warning">
  <AlertTitle>Email Not Verified</AlertTitle>
  Please verify your email address to access all features.
</Alert>
```
- **Color:** Warning (orange)
- **Purpose:** Persistent banner for unverified email
- **Assessment:** ✅ Appropriate warning severity

### Other Snackbar Patterns Found

**Success Snackbars:**
- Save confirmations (friend groups, settings, awards)
- Action completions (join group, create group)
- Submission confirmations

**Error Snackbars:**
- Save failures (database errors, validation errors)
- API failures
- Permission errors

**Warning Snackbars:**
- Offline state
- Unverified email
- Locked predictions

**Info Snackbars:**
- Locked tournaments
- Informational messages
- Help/guidance prompts

---

## Visual Compatibility Analysis

### Does MUI Default Palette Clash with Violet/Coral Theme?

**Theme Colors:**
- Primary: Violet (#7c3aed) - purple family
- Secondary: Coral (#f87171) - red/pink family

**MUI Semantic Colors:**
- Success: Green - ✅ **Complements** violet/coral (no clash)
- Error: Red - ✅ **Harmonizes** with coral (same family)
- Warning: Orange - ✅ **Neutral** (works with any theme)
- Info: Blue - ⚠️ **Potentially clashes** with violet (cool vs cool)

### Info Blue Analysis

**Concern:** Info blue (#0288d1) vs Primary violet (#7c3aed)
- Both are cool colors (blue, purple)
- Info blue is vibrant, similar saturation to violet
- Could create visual competition

**Impact Areas:**
- Locked tournament alerts (qualified-teams page)
- Notification permission prompts
- Informational snackbars

**Severity:** **LOW** - Blue is semantically correct for "info", universally recognized

---

## Recommendations

### Option 1: Keep MUI Defaults (RECOMMENDED)

**Rationale:**
1. **Universal recognition** - Users expect green=success, red=error, orange=warning, blue=info
2. **Accessibility** - MUI colors meet WCAG AA standards
3. **Low risk** - No development effort, no breaking changes
4. **Semantic clarity** - Standard colors communicate intent clearly

**Trade-off:** Info blue doesn't match violet/coral aesthetic, but this is acceptable for semantic colors.

**Action:** None required.

---

### Option 2: Customize Semantic Colors to Match Theme

**Customized Palette Proposal:**

```tsx
// In theme-provider.tsx, add to lightTheme and darkTheme:
success: {
  main: '#10b981',      // Emerald green (more modern)
  light: '#34d399',
  dark: '#059669',
  contrastText: '#ffffff'
},
error: {
  main: '#f87171',      // Coral (matches secondary!)
  light: '#fca5a5',
  dark: '#dc2626',
  contrastText: '#ffffff'
},
warning: {
  main: '#f59e0b',      // Amber (warmer than MUI default)
  light: '#fbbf24',
  dark: '#d97706',
  contrastText: '#000000'
},
info: {
  main: '#a78bfa',      // Light violet (matches primary family!)
  light: '#c4b5fd',
  dark: '#8b5cf6',
  contrastText: '#ffffff'
}
```

**Benefits:**
- ✅ Info color harmonizes with violet theme (same family)
- ✅ Error uses coral (already part of theme)
- ✅ Visual cohesion across entire app
- ✅ Unique brand identity

**Risks:**
- ⚠️ **Breaks conventions** - Violet for "info" is unconventional (users expect blue)
- ⚠️ **Coral for "error"** might confuse users (coral = secondary actions, not errors)
- ⚠️ Accessibility concerns - Need to verify contrast ratios
- ⚠️ Development effort - Theme changes, testing required

**Action:** NOT RECOMMENDED - Semantic colors should remain standard for clarity.

---

### Option 3: Hybrid Approach (ALTERNATIVE)

**Keep standard colors, but adjust shades to complement violet/coral:**

```tsx
// Subtle adjustments to default MUI colors
success: {
  main: '#059669',      // Slightly darker green (more elegant)
  light: '#10b981',
  dark: '#047857',
  contrastText: '#ffffff'
},
error: {
  main: '#dc2626',      // Standard red (keep conventional)
  light: '#ef4444',
  dark: '#b91c1c',
  contrastText: '#ffffff'
},
warning: {
  main: '#f59e0b',      // Warmer amber (complements violet better)
  light: '#fbbf24',
  dark: '#d97706',
  contrastText: '#000000'
},
info: {
  main: '#6366f1',      // Indigo (closer to violet family, but still blue-ish)
  light: '#818cf8',
  dark: '#4f46e5',
  contrastText: '#ffffff'
}
```

**Benefits:**
- ✅ Maintains semantic conventions (green/red/orange/blue)
- ✅ Adjusts shades to complement violet/coral
- ✅ More visual harmony without breaking expectations
- ✅ Indigo for "info" bridges gap between blue and violet

**Risks:**
- ⚠️ Moderate development effort
- ⚠️ Still requires contrast verification
- ⚠️ Subtle changes may not be noticeable

**Action:** VIABLE OPTION - Could improve harmony while maintaining conventions.

---

## Specific Issues Found

### None! ✅

All Snackbars/Alerts use semantic colors correctly:
- Success → `severity="success"`
- Error → `severity="error"`
- Warning → `severity="warning"`
- Info → `severity="info"`

No hardcoded colors found in Snackbars.
No incorrect severity mappings.

---

## Testing Recommendations

If customizing semantic colors (Option 2 or 3):

1. **Contrast Verification:**
   - Test all severity levels in light and dark modes
   - Verify WCAG AA standards (4.5:1 for text, 3:1 for UI)
   - Use WebAIM Contrast Checker

2. **Visual Testing:**
   - Screenshot all Snackbar types (success/error/warning/info)
   - Compare in light and dark modes
   - Verify readability and visual harmony

3. **User Testing:**
   - Ensure users understand semantic meaning
   - Verify violet "info" doesn't confuse users
   - Test with colorblind users

4. **Snapshot Updates:**
   - ~22 files with Snackbars
   - ~46 files with Alert severity
   - All snapshots will need updates

---

## Decision Matrix

| Option | Visual Harmony | Semantic Clarity | Effort | Risk | Recommendation |
|--------|----------------|------------------|--------|------|----------------|
| **1. Keep Defaults** | Medium | ✅ High | None | None | ⭐ **RECOMMENDED** |
| **2. Custom Colors** | ✅ High | ❌ Low | High | High | ❌ Not Recommended |
| **3. Hybrid** | ✅ High | ✅ Medium | Medium | Medium | ⚠️ Consider |

---

## Final Recommendation

**Keep MUI default semantic colors (Option 1).**

**Rationale:**
1. Semantic colors serve a **functional purpose** (communicate state), not just aesthetics
2. Users rely on **universal conventions** (green=good, red=bad, orange=caution, blue=info)
3. Breaking conventions for visual harmony creates **usability issues**
4. Current theme already has **visual cohesion** with violet/coral for interactive elements
5. Snackbars are **temporary UI** - less critical than permanent elements

**The violet/coral theme should dominate permanent UI (buttons, headers, navigation), while semantic colors remain standard for clarity.**

---

## User Question: "Too Uniform?"

The screenshot shows extensive violet usage. The issue is NOT with Snackbars (which correctly use semantic colors), but with:

**Over-application of primary color to:**
- Section headers (Groups, Your Stats, Friend Groups, General Rules)
- All buttons/links (VIEW RESULTS, VIEW DETAILS, CREATE GROUP, VIEW GROUPS)

**Solution:** Dial back primary color on non-CTA elements (as discussed in main conversation).

**Snackbars are fine** - they use standard semantic colors (green/red/orange/blue) and provide visual contrast to the violet theme.

---

## Conclusion

✅ **Snackbars are correctly implemented** - using semantic colors appropriately
✅ **Semantic colors work well** - green/red/orange/blue provide clear feedback
⚠️ **Info blue could harmonize better** - but standard blue is more important for clarity
❌ **Do NOT customize semantic colors** - maintain universal conventions

**No action required on Snackbars.** Focus efforts on dialing back primary color usage on non-CTA elements instead.
