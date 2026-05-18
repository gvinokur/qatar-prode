# Plan: Replace LoggedOffBanner with PredictionStatusHeader on Games Page (#445)

## Context

Story #441 migrated the Hub's logged-out banner to the reusable `PredictionStatusHeader` system (via `HubLoggedOutHeader` + `computeLoggedOutVariant`). The Games page still uses a bespoke `LoggedOffBanner` component (`public-cta-bar.tsx`) — a blue sticky bar predating the PSH system. This story deletes that one-off component and replaces it with the same PSH-based pattern, giving logged-out users a visually consistent experience across Hub and Games.

## Acceptance Criteria (from issue)

- Logged-out users see a branded PSH banner: "Welcome to Prode Mundial", sign-in description, "Login or Sign Up" button
- Banner remains sticky while scrolling
- Clicking "Login or Sign Up" opens the auth dialog
- `public-cta-bar.tsx` and its test file are deleted; no orphan components remain
- Works in EN and ES

## Current State

| File | Role |
|------|------|
| `app/components/tournament-page/public-cta-bar.tsx` | `LoggedOffBanner` — bespoke blue sticky bar (to delete) |
| `app/components/tournament-page/__tests__/public-cta-bar.test.tsx` | 37 tests for old component (to delete) |
| `app/components/tournament-page/public-games-page-client.tsx` | Renders `<LoggedOffBanner sticky />` on line ~73 |
| `app/components/tournament-hub/hub-logged-out-header.tsx` | Reference pattern: PSH + `computeLoggedOutVariant` |
| `app/components/prediction-status-header/hub-header-variant.ts` | Has `computeLoggedOutVariant` (reusable, no changes needed) |

## Technical Approach

Mirror `HubLoggedOutHeader` exactly:

1. Create `GamesLoggedOutHeader` — a client component that manages auth dialog state, calls `computeLoggedOutVariant(t, onSignIn)`, renders `PredictionStatusHeader` inside a sticky `Box`, and renders `LoginOrSignupDialog`.
2. In `public-games-page-client.tsx`, swap `<LoggedOffBanner sticky />` for `<GamesLoggedOutHeader />`.
3. Delete `public-cta-bar.tsx` and its test file.
4. Write tests for `GamesLoggedOutHeader`.
5. Update `docs/code-structure/components/components-tournament-games.md`.

**No i18n changes needed** — `computeLoggedOutVariant` already uses `tournament.public` keys (`welcome`, `ctaDescription`, `loginOrSignup`) that exist in both EN and ES.

**No new server actions or DB flows** — pure UI component swap.

## Visual Design

`GamesLoggedOutHeader` will render identically to `HubLoggedOutHeader`:

```
┌─────────────────────────────────────────────────────┐
│ 🔑  Welcome to Prode Mundial                        │
│ ─────────────────────────────────────────────────── │
│  Sign in or create a free account to make           │
│  predictions and compete with friends.              │
│                              [Login or Sign Up]     │
└─────────────────────────────────────────────────────┘
```

- Tone: `brand`
- Lead icon: `login`
- Expanded mode (message field set → divider appears)
- Sticky: `Box` wrapper with `sx={{ position: 'sticky', top: 0, zIndex: 1000 }}`

## Files

### Create
- `app/components/tournament-page/games-logged-out-header.tsx` — new component
- `app/components/tournament-page/__tests__/games-logged-out-header.test.tsx` — replacement tests

### Modify
- `app/components/tournament-page/public-games-page-client.tsx` — swap `LoggedOffBanner` → `GamesLoggedOutHeader`
- `docs/code-structure/components/components-tournament-games.md` — remove old entry, add new one

### Delete
- `app/components/tournament-page/public-cta-bar.tsx`
- `app/components/tournament-page/__tests__/public-cta-bar.test.tsx`

## Mid-Level Design

### Call Graph Changes

No call graph changes. `GamesLoggedOutHeader` is a leaf UI component; it does not introduce any new page → action → repo flows.

---

### `app/components/tournament-page/games-logged-out-header.tsx` *(new)*

**New functions:**

- **GamesLoggedOutHeader()**: `JSX.Element`
  `'use client'` component. Manages `openAuthDialog` boolean state. Calls `computeLoggedOutVariant(t, onSignIn)` to build the PSH variant, renders `PredictionStatusHeader` inside a sticky `Box`, and renders `LoginOrSignupDialog` controlled by state.
  Calls: `computeLoggedOutVariant`, `useTranslations('tournament.public')`
  Tests:
  - renders PSH with "Welcome to Prode Mundial" status text
  - renders PSH with sign-in description message
  - wraps PSH in an element with sticky positioning
  - clicking "Login or Sign Up" action opens the auth dialog
  - auth dialog closes when close handler is called
  - renders "Iniciar Sesión o Registrarse" button label in ES locale
  - rapid clicks on Login button do not open multiple dialogs (idempotent)
  - component unmounts without errors while dialog is open

---

### `app/components/tournament-page/public-games-page-client.tsx` *(modified)*

**Changed functions:**

- **PublicGamesPageClient(props)**: `JSX.Element` *(import change only)*
  Remove import of `LoggedOffBanner` from `./public-cta-bar`. Add import of `GamesLoggedOutHeader` from `./games-logged-out-header`. Replace `<LoggedOffBanner sticky />` with `<GamesLoggedOutHeader />`. No other changes.
  Tests: no new tests needed (component-level tests handled in games-logged-out-header tests)

## Implementation Steps

1. **Create `games-logged-out-header.tsx`** — copy `hub-logged-out-header.tsx` as starting point, add sticky `Box` wrapper
2. **Update `public-games-page-client.tsx`** — swap import and JSX
3. **Delete `public-cta-bar.tsx`** and **`public-cta-bar.test.tsx`**
4. **Write tests** for `games-logged-out-header.tsx`
5. **Update `components-tournament-games.md`**
6. **Validate**: `npm run test`, `npm run lint`, `npm run build`

## Testing Strategy

**Mocking approach**: `useTranslations` mocked via next-intl's test utilities (same pattern as `hub-logged-out-header` tests). `LoginOrSignupDialog` mocked with `vi.mock` — only its open/close prop behaviour matters for this component's tests.

**New tests** (`games-logged-out-header.test.tsx`):
- Render: PSH present, status text matches, message matches
- Sticky: wrapper has `position: sticky` and `top: 0`
- Auth dialog: opens on button click, closes on handler call
- i18n: ES locale renders Spanish label

**Deleted tests** (`public-cta-bar.test.tsx`): 37 tests removed — all functionality is now covered by the PSH system's own tests plus the new component-level tests above.

**Coverage target**: ≥80% on new/modified files.

## Validation

```bash
npm run test            # all tests pass, coverage ≥80% on new file
npm run lint            # no ESLint errors
npm run build           # clean production build
```

Manual check: start dev server, visit Games page as logged-out user — verify PSH banner appears, is sticky, and the Login button opens the auth dialog. Repeat for `/es/` locale.
