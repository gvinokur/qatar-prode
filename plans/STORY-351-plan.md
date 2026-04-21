# Story #351 Plan: Fix Email Verification Overlay Blocking Tournament Header & Update Branding

## Context

Two bugs:
1. **Verification overlay blocks tournament header** — `app/template.tsx` is a global template that wraps ALL route content with a `pointerEvents: none` box and a `VerificationOverlay` when the user's email is unverified. Since this template wraps the tournament layout (including its `AppBar`), unverified users cannot interact with logout, theme switcher, or language switcher in tournament views.
2. **Stale "La Maquina" branding** — The app has been rebranded to "Prode Mundial" but several locale strings still reference "La Maquina Prode" / "La Maquina Prode Mundial", including `app.title`, `app.logoAlt`, `app.fullName` in both locales, onboarding welcome strings, and an `alt` attribute in the tournament header.

## Acceptance Criteria (from issue)

- Verification overlay blocks tournament content/nav but NOT the header (logout, theme, language)
- Overlay still prevents unauthorized prediction saves while unverified
- All "La Maquina Prode" / "La Maquina Prode Mundial" instances replaced with "Prode Mundial"
- Title and logo `alt` text updated in main header and tournament header
- Both EN and ES locales updated

---

## Technical Approach

### Fix 1: Verification Overlay

**Root Cause:** `app/template.tsx` wraps ALL nested content — including the tournament layout's `AppBar` — with `pointerEvents: none`, making the header non-interactive for unverified users.

**Fix strategy (final per user feedback):**
1. **Remove everything verification-related from `app/template.tsx`** — both the `VerificationBanner` AND the overlay/`pointerEvents` wrapping. The template becomes a simple passthrough.
2. **Add banner + overlay inside the tournament layout** (`app/[locale]/tournaments/[id]/layout.tsx`): render `VerificationBanner` between the `AppBar` and the main content area, and wrap the main content area with `VerificationOverlay` + `pointerEvents: none` when the user is unverified.

This keeps both elements entirely within the tournament context, below the header.

**Next.js rendering order (why this works):**
```
app/layout.tsx
  app/template.tsx              ← passthrough only (no verification)
    app/[locale]/layout.tsx     ← locale header/footer
      app/[locale]/tournaments/[id]/layout.tsx
        ┣ AppBar (header — always interactive)
        ┣ VerificationBanner (if unverified — below header)
        ┗ Main content Box
            ┣ VerificationOverlay (if unverified)
            ┗ children (page content, pointer-events:none if unverified)
```

No new files needed — changes are confined to `app/template.tsx` (simplify) and `app/[locale]/tournaments/[id]/layout.tsx` (add verification).

### Fix 2: Branding Updates

Update locale strings and the hardcoded `alt` attribute:

| File | Key / Location | From | To |
|------|---------------|------|----|
| `locales/en/common.json` | `app.title` | "La Maquina Prode" | "Prode Mundial" |
| `locales/en/common.json` | `app.logoAlt` | "La Maquina Prode" | "Prode Mundial" |
| `locales/en/common.json` | `app.fullName` | "La Maquina World Cup Predictions" | "Prode Mundial" |
| `locales/es/common.json` | `app.title` | "La Maquina Prode" | "Prode Mundial" |
| `locales/es/common.json` | `app.logoAlt` | "La Maquina Prode" | "Prode Mundial" |
| `locales/es/common.json` | `app.fullName` | "La Maquina Prode Mundial" | "Prode Mundial" |
| `locales/en/onboarding.json` | welcome title | "Welcome to La Maquina Prode!" | "Welcome to Prode Mundial!" |
| `locales/es/onboarding.json` | welcome title | "¡Bienvenido a La Maquina Prode!" | "¡Bienvenido a Prode Mundial!" |
| `app/[locale]/tournaments/[id]/layout.tsx` | `alt` on Avatar | "La Maquina" | "Prode Mundial" |
| `app/[locale]/tournaments/[id]/layout.tsx` | Comment | `{/* La Maquina logo button */}` | `{/* Logo button (home navigation) */}` |

`app.name` values ("World Cup Predictions" / "Prode Mundial") are already correct — no change needed.

---

## Files to Create / Modify

**Modify:**
- `app/template.tsx` — remove all verification logic (becomes a simple passthrough)
- `app/[locale]/tournaments/[id]/layout.tsx` — add `VerificationBanner` (below AppBar) + overlay wrapping on main content area
- `locales/en/common.json` — branding strings
- `locales/es/common.json` — branding strings
- `locales/en/onboarding.json` — welcome string
- `locales/es/onboarding.json` — welcome string
- `app/[locale]/tournaments/[id]/layout.tsx` — fix `alt` attribute and comment

**Tests to update:**
- `__tests__/components/header/header.test.tsx` — update expected branding strings
- `app/[locale]/tournaments/[id]/__tests__/layout.test.tsx` — update expected alt text

---

## Mid-Level Design

### Call Graph Changes

No call graph changes. No new cross-layer flows. The verification logic already exists; we are only restructuring where it renders.

---

### `app/template.tsx` *(modified)*

**`Template({ children: ReactNode }): Promise<JSX.Element>`**
Remove all verification logic. Becomes a simple passthrough that renders `children` unconditionally. Remove imports: `getLoggedInUser`, `findUserById`, `VerificationBanner`, `VerificationOverlay`.

Tests:
- renders children unconditionally (no verification logic)
- does not render `VerificationBanner`
- does not render `VerificationOverlay`

---

### `app/[locale]/tournaments/[id]/layout.tsx` *(modified)*

**`TournamentLayout(props): Promise<JSX.Element>`** *(add verification rendering)*
Fetch user + email verification status (reuse the same `getLoggedInUser` + `findUserById` already called). Render `VerificationBanner` between the `AppBar` and the main content `Box`. Wrap the main content `Box` with `VerificationOverlay` + `pointerEvents: none` when user is unverified and `REQUIRE_EMAIL_VERIFICATION` is true.

Calls: `getLoggedInUser` (already called), `findUserById` (new call — same pattern as template.tsx)

Layout structure change:
```tsx
<Box> {/* outer flex column */}
  <AppBar> ... </AppBar>         {/* unchanged — always interactive */}
  {isUnverified && <VerificationBanner />}   {/* NEW — below header */}
  <Box position="relative">      {/* NEW wrapper when unverified */}
    {isUnverified && <VerificationOverlay />}
    <Box sx={isUnverified ? { pointerEvents: 'none', userSelect: 'none' } : {}}>
      {/* existing main content area */}
    </Box>
  </Box>
</Box>
```

Tests:
- renders `VerificationBanner` below `AppBar` when user is unverified and verification required
- renders `VerificationOverlay` in main content area when user is unverified
- main content `Box` has `pointerEvents: none` when user is unverified
- does not render `VerificationBanner` when user is verified
- does not render `VerificationOverlay` when `REQUIRE_EMAIL_VERIFICATION` is false
- `AppBar` is rendered outside the `pointerEvents: none` wrapper (always interactive)

---

## Testing Strategy

**Test utilities:**
- Use `renderWithTheme(component)` from `__tests__/utils/test-utils.tsx` for all component tests
- Use `testFactories.createUser({ emailVerified: null })` for unverified users
- Use `testFactories.createUser({ emailVerified: new Date() })` for verified users
- Mock `getLoggedInUser` and `findUserById` via `vi.mock()`

**What to test:**
1. **Modified: `app/template.tsx`** — 3 test cases (passthrough, no banner, no overlay)
2. **Modified: `app/[locale]/tournaments/[id]/layout.tsx`** — 6 test cases covering banner placement, overlay, pointer-events, and header always accessible
3. **Update existing tests** — fix expected branding strings in `header.test.tsx` and `layout.test.tsx`
4. **Branding locale verification** — assert both `locales/en/common.json` and `locales/es/common.json` contain no "La Maquina" string

**Manual verification** (Vercel Preview):
- Log in with unverified email, navigate to tournament page
- Confirm: tournament content is blurred/non-interactive
- Confirm: header logout/theme/language buttons are CLICKABLE
- Confirm: clicking "Logout" in tournament header works
- Confirm: non-tournament pages still block header (existing behavior)
- Confirm: "Prode Mundial" shown in app title, logo alt, onboarding welcome

## Validation Considerations

- SonarCloud: 0 new issues — no logic changes, only refactoring + string updates
- Coverage: `VerificationGate` and `TournamentTemplate` are new files → need ≥80% test coverage
- No migrations needed
- No new i18n namespaces needed (updating existing keys only)
