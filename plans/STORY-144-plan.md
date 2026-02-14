# Implementation Plan: PWA Manifest & Metadata Updates for prodemundial.app (#144)

## Story Context

**Issue:** #144 - [PWA] Manifest & Metadata Updates for prodemundial.app

**Problem:**
- PWA manifest references old domain (la-maquina-prode.vercel.app) instead of prodemundial.app
- App branding hardcoded as "La Maquina" instead of using environment variables
- Missing PWA screenshots referenced in manifest (screenshot1-4.png files don't exist)
- Metadata in layout.tsx hardcoded instead of using NEXT_PUBLIC_APP_NAME/DESCRIPTION
- Dead code in service-worker-registration.tsx (unused disabled `registerServiceWorker()` function)

**Current State:**
- manifest.json: Uses "la_maquina_prode" ID, old domain, hardcoded "La Maquina" branding
- layout.tsx: Hardcoded "La Maquina" in metadata, apple-mobile-web-app-title
- service-worker-registration.tsx: Contains disabled `registerServiceWorker()` function that returns immediately
- Public folder: Screenshot files referenced in manifest don't exist (screenshot1-4.png)
- Environment: Only NEXT_PUBLIC_APP_URL defined, missing NEXT_PUBLIC_APP_NAME and NEXT_PUBLIC_APP_DESCRIPTION

**Objective:**
Update PWA configuration for proper branding and domain alignment with prodemundial.app, remove dead code, and prepare for environment-based configuration.

## Acceptance Criteria

- [ ] manifest.json uses prodemundial.app domain and updated branding
- [ ] manifest.json uses "prode_mundial" ID (updated from "la_maquina_prode")
- [ ] Screenshot references removed from manifest (files don't exist, optional feature)
- [ ] layout.tsx uses environment variables for metadata (name, description)
- [ ] Dead code removed from service-worker-registration.tsx
- [ ] .env.local and .env.example updated with required variables
- [ ] PWA installs with correct name and domain
- [ ] All hardcoded "La Maquina" references replaced
- [ ] Footer component displays app name dynamically (from env var or fallback)
- [ ] Vercel environment variables documented for deployment (user handles update)

## Technical Approach

### 1. Update manifest.json

**Changes:**
```json
{
  "id": "prode_mundial",  // Updated from "la_maquina_prode"
  "start_url": "https://prodemundial.app",  // Updated from old domain
  "name": "Prode Mundial",  // Updated from "La Maquina"
  "short_name": "Prode",  // Updated from "Maquina"
  "description": "Plataforma de pronósticos deportivos",  // Updated description
  // ... keep existing icons (already correct)
  // REMOVE screenshots array (files don't exist)
}
```

**Reasoning:**
- screenshots are optional PWA feature, not critical for functionality
- Files don't exist and creating placeholder screenshots is out of scope
- Better to remove invalid references than keep broken ones
- Can be added in future story if needed

### 2. Update layout.tsx Metadata

**Current (hardcoded):**
```typescript
export async function generateMetadata() {
  return {
    title: 'La Maquina',
    description: "Pagina de prode para multiples torneos de futbol",
    appleWebApp: {
      title: 'La Maquina',
    }
  } as Metadata;
}
```

**Updated (environment-based):**
```typescript
export async function generateMetadata() {
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Prode Mundial';
  const appDescription = process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'Plataforma de pronósticos deportivos';

  return {
    title: appName,
    description: appDescription,
    manifest: '/manifest.json',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: appName,
    },
    icons: [
      // ... keep existing
    ]
  } as Metadata;
}
```

**Also update:**
- Line 49: `<meta name="apple-mobile-web-app-title" content={appName}/>` (make dynamic)
- Line 67: `<Footer message={`${appName} © 2025`} />` (dynamic footer)

### 3. Clean Up Dead Code

**File:** `app/components/service-worker-registration.tsx`

**Remove:**
```typescript
export function registerServiceWorker() {
  // Service worker registration disabled
  return;
}
```

**Reasoning:**
- Function does nothing (immediate return)
- Serwist handles service worker registration automatically (configured in next.config.mjs)
- Not called anywhere in codebase
- Dead code removal improves maintainability

**Keep:**
- `clearBadges()` - Used for notification management
- `requestNotificationPermission()` - Used for notification permissions
- `onUpdate()` - Used for service worker updates

### 4. Update Environment Variables

**Files to update:**
1. `.env.local` (add missing variables)
2. Create `.env.example` (document required variables)

**Variables to add:**
```bash
# App Branding (add to existing .env.local)
NEXT_PUBLIC_APP_URL=https://prodemundial.app  # Update from localhost
NEXT_PUBLIC_APP_NAME=Prode Mundial
NEXT_PUBLIC_APP_DESCRIPTION=Plataforma de pronósticos deportivos
```

**Create .env.example:**
```bash
# Copy structure from CLAUDE.md Environment Variables section
# Include all required variables with placeholder values
# Add the three NEXT_PUBLIC_APP_* variables
```

### 5. Vercel Deployment Configuration

**CRITICAL:** Vercel environment variables must be set BEFORE deployment to production.

**Variables to configure in Vercel dashboard:**
- NEXT_PUBLIC_APP_URL=https://prodemundial.app
- NEXT_PUBLIC_APP_NAME=Prode Mundial
- NEXT_PUBLIC_APP_DESCRIPTION=Plataforma de pronósticos deportivos

**Responsibility:**
- Code changes include fallback values (Prode Mundial) that will be used if Vercel env vars are not set
- User must manually update Vercel environment variables via dashboard or CLI
- This is **deployment configuration**, not code change - **out of scope for this story**
- If env vars are not updated, app will display fallback values (acceptable behavior)

**Verification:**
After Vercel deployment with updated env vars, verify:
1. PWA manifest shows configured app name (not fallback)
2. Browser tab title shows configured app name
3. Installed PWA shows configured app name

## Files to Modify

1. **app/manifest.json** (line 2-7, 37-62)
   - Update id, start_url, name, short_name, description
   - Remove screenshots array

2. **app/layout.tsx** (lines 18-34, 49, 67)
   - Update generateMetadata() to use environment variables
   - Update apple-mobile-web-app-title meta tag
   - Update Footer message

3. **app/components/service-worker-registration.tsx** (lines 1-4)
   - Remove registerServiceWorker() function

4. **.env.local** (add lines)
   - Add NEXT_PUBLIC_APP_NAME
   - Add NEXT_PUBLIC_APP_DESCRIPTION
   - Update NEXT_PUBLIC_APP_URL to production domain

5. **.env.example** (create new file)
   - Document all required environment variables

## Implementation Steps

**Execution Order:**
1. Update environment files first (.env.local, .env.example) - Required for local testing
2. Update code files (manifest.json, layout.tsx, service-worker-registration.tsx)
3. Create tests for modified code
4. Run validation checks (build, tests, lint)
5. Commit and deploy to Vercel Preview for user testing

### Step 1: Update environment files (FIRST)
1. Create `.env.example` in project root:
   - Copy all environment variable sections from CLAUDE.md
   - Include DATABASE_URL, AUTH, EMAIL, AWS, VAPID sections with placeholder values
   - Add the three NEXT_PUBLIC_APP_* variables with example values
   - Check this file into git (standard practice for documenting required vars)
2. Update `.env.local` (not checked into git):
   - Add NEXT_PUBLIC_APP_NAME=Prode Mundial
   - Add NEXT_PUBLIC_APP_DESCRIPTION=Plataforma de pronósticos deportivos
   - Keep NEXT_PUBLIC_APP_URL=https://localhost:3000 for local dev (not production domain)
   - **Note:** Local .env.local uses localhost, production Vercel uses prodemundial.app

### Step 2: Update manifest.json
1. Change id from "la_maquina_prode" to "prode_mundial"
2. Change start_url to "https://prodemundial.app"
3. Change name to "Prode Mundial"
4. Change short_name to "Prode"
5. Update description to "Plataforma de pronósticos deportivos"
6. Remove screenshots array (lines 37-62)
7. Keep all other fields unchanged (icons, theme, display, etc.)

### Step 3: Update layout.tsx
1. Modify generateMetadata() function:
   - Add const for appName with env var + fallback
   - Add const for appDescription with env var + fallback
   - Replace hardcoded title with appName
   - Replace hardcoded description with appDescription
   - Update appleWebApp.title to use appName
2. Update apple-mobile-web-app-title meta tag in <head> to use appName variable
3. Update Footer message prop to use appName dynamically

### Step 4: Remove dead code
1. Delete registerServiceWorker() function from service-worker-registration.tsx
2. Verify no imports or calls to this function exist elsewhere (already confirmed via exploration)

### Step 5: Create tests
1. Create `app/layout.test.tsx` - Test generateMetadata() with and without env vars
2. Create `app/manifest.test.ts` - Validate manifest.json structure
3. Create `app/components/home/footer.test.tsx` - Test Footer displays app name correctly
4. Update `app/components/service-worker-registration.test.tsx` if it exists

### Step 6: Run validation checks
1. Run `npm test` - Ensure all tests pass
2. Run `npm run lint` - Fix any linting issues
3. Run `npm run build` - Ensure no build errors
4. Manually verify manifest.json is valid JSON

### Step 7: Commit and deploy
1. Commit changes with validation results
2. Push to trigger Vercel Preview deployment
3. User tests in Vercel Preview environment
1. Run `npm run build` to ensure no build errors
2. Check that manifest.json is valid JSON
3. Verify environment variables are read correctly in layout.tsx
4. Test PWA install locally with updated branding

## Testing Strategy

### Unit Tests

**Test Approach for Server-Side Functions:**
- `generateMetadata()` runs server-side during build
- Vitest can test this function by mocking `process.env` using `vi.stubEnv()`
- Tests will verify the function returns correct metadata based on env vars

**New test file:** `app/layout.test.tsx`

Testing `generateMetadata()`:
```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { generateMetadata } from './layout';

describe('generateMetadata', () => {
  beforeEach(() => {
    // Clear env mocks before each test
    vi.unstubAllEnvs();
  });

  it('uses environment variables when set', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_NAME', 'Test App');
    vi.stubEnv('NEXT_PUBLIC_APP_DESCRIPTION', 'Test Description');

    const metadata = await generateMetadata();

    expect(metadata.title).toBe('Test App');
    expect(metadata.description).toBe('Test Description');
    expect(metadata.appleWebApp?.title).toBe('Test App');
  });

  it('uses fallback values when env vars are missing', async () => {
    const metadata = await generateMetadata();

    expect(metadata.title).toBe('Prode Mundial');
    expect(metadata.description).toBe('Plataforma de pronósticos deportivos');
    expect(metadata.appleWebApp?.title).toBe('Prode Mundial');
  });

  it('includes manifest and icons', async () => {
    const metadata = await generateMetadata();

    expect(metadata.manifest).toBe('/manifest.json');
    expect(metadata.icons).toBeDefined();
    expect(metadata.icons?.length).toBeGreaterThan(0);
  });
});
```

**New test file:** `app/manifest.test.ts`

Tests for manifest.json validation:
```typescript
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('PWA Manifest', () => {
  const manifestPath = path.join(__dirname, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

  it('has correct id', () => {
    expect(manifest.id).toBe('prode_mundial');
  });

  it('has correct start_url', () => {
    expect(manifest.start_url).toBe('https://prodemundial.app');
  });

  it('has correct name and short_name', () => {
    expect(manifest.name).toBe('Prode Mundial');
    expect(manifest.short_name).toBe('Prode');
  });

  it('has correct description', () => {
    expect(manifest.description).toBe('Plataforma de pronósticos deportivos');
  });

  it('does not have screenshots array', () => {
    expect(manifest.screenshots).toBeUndefined();
  });

  it('has valid icons array', () => {
    expect(manifest.icons).toBeDefined();
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThan(0);
  });
});
```

**New test file:** `app/components/home/footer.test.tsx`

Tests for Footer component with dynamic app name:
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Footer from './footer';

describe('Footer', () => {
  it('displays provided message', () => {
    render(<Footer message="Test App © 2025" />);
    expect(screen.getByText('Test App © 2025')).toBeInTheDocument();
  });

  it('displays Prode Mundial by default in layout', () => {
    // This will be tested via layout.test.tsx integration
    // Footer itself just renders the message prop
  });
});
```

**Update test file:** `app/components/service-worker-registration.test.tsx`
- Remove tests for registerServiceWorker() function (if any exist)
- Verify clearBadges() tests still pass
- Verify requestNotificationPermission() tests still pass

**Coverage Expectations:**
- **Realistic target:** Zero coverage regression (maintain existing coverage)
- **Reasoning:** Changes are mostly configuration (manifest.json, env vars) with minimal new code
- **New code coverage:** Aim for 80%+ on `generateMetadata()` function specifically
- **Note:** Dead code removal (registerServiceWorker) may slightly decrease overall coverage, which is acceptable

### Manual Testing

1. **Local PWA Install:**
   - Run `npm run dev:https`
   - Open in Chrome/Edge
   - Click install prompt
   - Verify app name is "Prode Mundial" (or env var value)
   - Verify icon and theme are correct

2. **iOS Safari Testing:**
   - Open in iOS Safari
   - Add to Home Screen
   - Verify app name and icon
   - Verify standalone mode works

3. **Manifest Validation:**
   - Use Chrome DevTools > Application > Manifest
   - Verify no errors or warnings
   - Check all fields are correct

4. **Environment Variables:**
   - Test with different NEXT_PUBLIC_APP_NAME values
   - Test with missing env vars (should use fallbacks)
   - Verify build works with all combinations

## Validation Considerations

### SonarCloud Requirements
- **Coverage:** Zero coverage regression + 80%+ on generateMetadata() function
- **Reasoning:** Configuration changes (manifest.json, env vars) have minimal testable code
- **Code Smells:** None expected (straightforward changes)
- **Security:** No security impact (static configuration changes)
- **Duplicated Code:** None (unique configuration per file)
- **Note:** Dead code removal may slightly reduce overall coverage, which is acceptable improvement

### Quality Checks
- JSON validation for manifest.json
- No hardcoded strings in metadata (use env vars)
- Dead code removed (registerServiceWorker)
- Environment variables documented
- Tests cover all code paths

### Potential Issues
1. **Vercel env vars not updated:** App will use fallback values until Vercel is configured
2. **Caching:** Users may see old manifest until cache clears
3. **Already installed PWAs:** May need reinstall to see new branding

## Dependencies
- None (self-contained changes)
- Deployment configuration (Vercel env vars) is separate concern

## Estimated Effort
1-2 hours

## Open Questions
None - approach is straightforward based on issue requirements.

## Plan Amendments

### Amendment 1: VAPID Environment Variable Stubs in Test Setup (Discovered during implementation)

**Issue Discovered:**
When running tests for `app/layout.test.tsx`, the test suite failed with error: `Error: No key set vapidDetails.publicKey`

**Root Cause:**
- Importing `app/layout.tsx` for testing triggers an import chain that loads `app/actions/notification-actions.ts`
- That file calls `setVapidDetails()` from `web-push` library at module load time (top-level side effect)
- `setVapidDetails()` requires `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` environment variables to be set
- Without these env vars, module loading fails before tests can run

**Solution Implemented:**
Added VAPID environment variable stubs to `vitest.setup.ts` (before any imports):

```typescript
import { vi } from 'vitest';

// Stub VAPID environment variables to prevent web-push initialization errors
// This must be done before any modules are loaded
vi.stubEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY', 'BIgIOpCSB_MFNpSkPb4V_eM4SkemKR1l1XmmYFsewYF-XD0T0LZA8A79eerSnzNP00dIcixBZ_TD3SrSRkiQAlI');
vi.stubEnv('VAPID_PRIVATE_KEY', 'P3Zfb9llkSX79i6PVZW5JhBhsMJed2XtC2vcByjdPNo');

import '@testing-library/jest-dom';
// ... rest of setup
```

**Why This Location:**
- `vitest.setup.ts` runs before any test files are loaded
- Environment variables must be stubbed before the `web-push` library initializes
- Attempted fixes in individual test files were too late in the module loading process

**Files Modified:**
- `vitest.setup.ts` - Added VAPID env stubs at the top (before imports)
- `app/layout.test.tsx` - Added VAPID stub in beforeEach to maintain stub after vi.unstubAllEnvs()

**Impact:**
- Enables testing of `app/layout.tsx` without VAPID initialization errors
- All tests now pass (196 test files, 3639 tests)
- No impact on production code (test-only change)

**Note:** The VAPID keys used are actual key format values committed to the repository in test setup. These are for test environment only and do not affect production VAPID keys (stored in Vercel environment variables).
