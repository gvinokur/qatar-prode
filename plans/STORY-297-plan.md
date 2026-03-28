# Plan: Story #297 — Dead Code + Documentation Cleanup (post-#295)

## Context

Story #295 (AdSense) introduced `isAdFree` across auth, JWT, and session layers, and simplified the AdSense integration to Auto Ads only (removing sidebar/modal). This left behind:
1. Dead code in `middleware.ts` — `x-pathname` response header was originally read by `isTournamentPage` logic in layout.tsx, but that was removed in Amendment 1. The header is now set but never consumed.
2. Undocumented files — `auth.ts` and `types/next-auth.d.ts` are not in any CODE-STRUCTURE layer file. They contain `isAdFree` propagation logic added in #295.
3. Missing architecture doc — `docs/claude/architecture.md` has no AdSense section and no mention of `isAdFree` as a session field.

Worktree: `/Users/gvinokur/Personal/qatar-prode-story-297`
Branch: `feature/story-297`

## Critical Files

- `middleware.ts` — remove `x-pathname` header (lines 119-120)
- `docs/code-structure/pages.md` — add `auth.ts` and `types/next-auth.d.ts` entries
- `docs/claude/architecture.md` — add AdSense + `isAdFree` section

## Implementation Steps

### 1. Remove dead code in `middleware.ts`

Delete lines 119-120:
```
// 5b. Expose pathname to Server Components via response header
intlResponse.headers.set('x-pathname', pathname);
```

### 2. Document `auth.ts` in `docs/code-structure/pages.md`

Add a new `### auth.ts` section immediately after the `### middleware.ts` section (to group auth infrastructure files together):

```markdown
### auth.ts
Root NextAuth.js configuration. Exports `handlers`, `signIn`, `signOut`, `auth`.

- **authorize (credentials)**: `Promise<User | null>` — [Server] Validates email+password; returns user object with `isAdFree`, `isAdmin`, `emailVerified`, `nickname`, `preferred_locale`.
  Calls: findUserByEmail, getPasswordHash
- **authorize (otp)**: `Promise<User | null>` — [Server] Validates OTP code; clears OTP on success; returns user object including `isAdFree`.
  Calls: verifyOTP, clearOTP
- **signIn callback**: `Promise<boolean>` — [Server] Handles Google OAuth flow: finds or creates user, links OAuth account, populates `user` object including `isAdFree`.
  Calls: findUserByOAuthAccount, findUserByEmail, linkOAuthAccount, createOAuthUser
- **session callback**: `Session` — [Server] Picks fields from JWT token (including `isAdFree`) into `session.user`.
- **jwt callback**: `JWT` — [Server] Merges user fields (including `isAdFree`) into JWT token on sign-in or session update. Returns the merged `JWT` token.
```

### 3. Document `types/next-auth.d.ts` in `docs/code-structure/pages.md`

Add a new `### types/next-auth.d.ts` section immediately after the `### auth.ts` section:

```markdown
### types/next-auth.d.ts
TypeScript module augmentation for NextAuth.js. Extends `Session`, `User`, and `JWT` interfaces with app-specific fields.

- **Session.user**: extends `DefaultSession["user"]` with `id`, `nickname`, `isAdmin`, `isAdFree`, `emailVerified`, `preferred_locale`
- **User**: `id`, `nickname`, `isAdmin`, `isAdFree`, `emailVerified`, `preferred_locale`
- **JWT**: `id`, `nickname`, `isAdmin`, `isAdFree`, `emailVerified`, `preferred_locale`
```

### 4. Update `docs/claude/architecture.md`

Add a new `## AdSense Integration` section after the PWA section (or at end of file):

```markdown
## AdSense Integration

Google AdSense Auto Ads are loaded conditionally for non-ad-free users.

**Script loading flow:**
1. `app/[locale]/layout.tsx` (Server Component) checks `process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID && !user?.isAdFree` before rendering the `<Script>` tag
2. `AdSensePageViewTracker` (Client Component, always mounted) fires `adsbygoogle.push({})` on each SPA pathname change for non-ad-free sessions, or sets `adsbygoogle.pauseAdRequests = 1` for ad-free users — handles mid-session login/logout without a hard refresh

**isAdFree propagation:**
- Stored as `is_ad_free: boolean` in the `users` table
- All four auth paths (password, OTP, Google OAuth new/existing) read `is_ad_free` from the DB and set `user.isAdFree`
- `auth.ts` JWT callback merges `isAdFree` into the token; session callback picks it into `session.user`
- TypeScript interfaces in `types/next-auth.d.ts` extend `Session.user`, `User`, and `JWT` with `isAdFree: boolean`
- Admins toggle per-user ad-free status in the Backoffice → Users tab

**Graceful degradation:** If `NEXT_PUBLIC_ADSENSE_CLIENT_ID` is absent, no script loads and the tracker is a no-op.
```

### 5. Update `docs/code-structure/pages.md` Last Updated header

Change `**Last updated:** 2026-03-28` to today: `2026-03-28` (already current).

## Call Graph Changes

No call graph changes. `auth.ts` callbacks are internal NextAuth.js configuration — they are not exported functions called by other modules (only `handlers`, `signIn`, `signOut`, and `auth` are exported, and these were already in use). `types/next-auth.d.ts` is pure TypeScript module augmentation with no runtime impact.

## Verification

1. Run `npm run lint` — no errors
2. Run `npm run build` — production build succeeds (no TypeScript errors)
3. Run `npm run test` — all tests pass (no code changes, just docs)
4. Confirm `x-pathname` removed: `grep -r "x-pathname" middleware.ts` returns nothing
5. Confirm `auth.ts` documented: check pages.md has the new section
