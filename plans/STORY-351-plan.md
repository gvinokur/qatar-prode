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

**Root Cause:** `app/template.tsx` (a Next.js [Server Component template](https://nextjs.org/docs/app/api-reference/file-conventions/template)) wraps ALL nested content — including the tournament layout's `AppBar` — with:
```tsx
<Box position="relative">
  <VerificationOverlay />
  <Box sx={{ pointerEvents: 'none', userSelect: 'none' }}>
    {children}  {/* ← tournament layout incl. header is inside here */}
  </Box>
</Box>
```

**Fix strategy:**
1. Extract the `pointerEvents` gate into a new **client component** `VerificationGate` that reads `usePathname()`. On tournament pages it skips the overlay (delegates to the tournament template). On all other pages it applies the existing overlay.
2. Create `app/[locale]/tournaments/[id]/template.tsx` — a **server component** that fetches the same user/verification data and applies the overlay only to `children` (the page content). Since `template.tsx` wraps only the page slot and NOT the layout's `AppBar`, the header remains fully interactive.

**Next.js rendering order (why this works):**
```
app/layout.tsx
  app/template.tsx              ← wraps all content (uses VerificationGate)
    app/[locale]/layout.tsx     ← locale header/footer
      app/[locale]/tournaments/[id]/layout.tsx  ← tournament AppBar (HEADER IS HERE)
        app/[locale]/tournaments/[id]/template.tsx  ← wraps ONLY page content
          page.tsx              ← actual tournament page
```

The tournament template wraps only the page, never the `AppBar`.

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

**Create:**
- `app/components/verification/verification-gate.tsx` — new client component

**Create:**
- `app/[locale]/tournaments/[id]/template.tsx` — new tournament-level template

**Modify:**
- `app/template.tsx` — use `VerificationGate` instead of inline Box
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

No call graph changes. No new cross-layer flows. The verification logic already exists; we are only restructuring which template renders it for which routes.

---

### `app/components/verification/verification-gate.tsx` *(new)*

**`VerificationGate({ children: ReactNode }): JSX.Element`**
Client component. Reads `usePathname()` to determine if the current route is a tournament page (`/[locale]/tournaments/...`). On tournament pages, renders children unmodified (the tournament template handles the overlay). On all other pages, applies the existing `VerificationOverlay` + `pointerEvents: none` wrapper.

```typescript
'use client'
// Props: children: React.ReactNode
// Returns: children wrapped in overlay (non-tournament) or as-is (tournament)
```

Tests:
- renders children with overlay wrapper on non-tournament route (`/en/groups`)
- renders children without overlay or pointer-events on tournament route (`/en/tournaments/fifa-2026`)
- overlay Box has `position: relative` on non-tournament pages
- does not render `VerificationOverlay` on tournament pages

---

### `app/[locale]/tournaments/[id]/template.tsx` *(new)*

**`TournamentTemplate({ children: ReactNode }): Promise<JSX.Element>`**
Server component. Fetches user + email verification status (same logic as `app/template.tsx`). If unverified and verification required: wraps `children` (page content only, NOT layout header) with `VerificationOverlay` + `pointerEvents: none`. Otherwise renders children normally.

Calls: `getLoggedInUser`, `findUserById`

Tests:
- renders children unmodified when `REQUIRE_EMAIL_VERIFICATION` is false
- renders children unmodified when user is not logged in
- renders children unmodified when user is email-verified
- wraps children with overlay and `pointerEvents: none` when user is unverified and verification required
- `VerificationOverlay` is rendered as sibling to (not parent of) children when unverified

---

### `app/template.tsx` *(modified)*

**`Template({ children: ReactNode }): Promise<JSX.Element>`** *(was: inline conditional)*
Replace inline `<Box position="relative">` block with `<VerificationGate>`. The banner logic is unchanged.

```typescript
// Before (inline):
{isUnverified ? (
  <Box position="relative">
    <VerificationOverlay />
    <Box sx={{ pointerEvents: 'none', ... }}>{children}</Box>
  </Box>
) : children}

// After (uses VerificationGate):
{isUnverified ? <VerificationGate>{children}</VerificationGate> : children}
```

Tests:
- renders `VerificationGate` (not inline Box) when user is unverified and verification required
- renders `VerificationBanner` when user is unverified and verification required
- renders children directly when `REQUIRE_EMAIL_VERIFICATION` is false
- renders children directly when user is verified
- renders children directly when no user is logged in

---

## Testing Strategy

**Test utilities:**
- Use `renderWithTheme(component)` from `__tests__/utils/test-utils.tsx` for all component tests
- Use `testFactories.createUser({ emailVerified: null })` for unverified users
- Use `testFactories.createUser({ emailVerified: new Date() })` for verified users
- Mock `getLoggedInUser` and `findUserById` via `vi.mock()`
- Mock `next/navigation` `usePathname` for `VerificationGate` tests

**What to test:**
1. **New: `VerificationGate`** — 4 test cases (see Mid-Level Design)
2. **New: `TournamentTemplate`** — 5 test cases (see Mid-Level Design)
3. **Modified: `app/template.tsx`** — 5 test cases (see Mid-Level Design above), replacing the existing inline logic tests
4. **Update existing tests** — fix expected branding strings in `header.test.tsx` and `layout.test.tsx`
5. **Branding locale verification** — assert both `locales/en/common.json` and `locales/es/common.json` contain no "La Maquina" string (can be a simple grep-based snapshot test or manual Vercel verification)

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
