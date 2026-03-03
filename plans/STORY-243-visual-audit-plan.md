# Implementation Plan: Visual Audit System for Theme Color Adoption (#243)

## Story Context

**Story #243:** Improve theme color adoption across components

**Problem:** Current theme color adoption is only 35-40% when it should be 60-70% following MUI best practices (60-30-10 rule).

**Current Gap:**
- Secondary color (coral): Only 2 instances (severely underused)
- Buttons: 30% lack explicit color props (defaulting to neutral gray)
- IconButtons: 0% use theme colors (0 out of 26)
- Hardcoded colors: 14 instances override theme (footer, header)

**This Plan's Goal:** Set up a reusable Playwright-based visual audit system to systematically identify ALL components needing theme colors, then use findings to guide the implementation of this story.

**Note:** This is a pre-implementation tool/analysis plan. The actual theme color updates will follow in a separate implementation plan after this audit is complete.

## Objectives

1. **Install and configure Playwright** for automated browser testing
2. **Store test credentials securely** in .env.local (already gitignored)
3. **Create comprehensive visual audit script** that:
   - Authenticates with test credentials
   - Crawls all major pages in both light and dark modes
   - Captures full-page screenshots systematically
   - Handles navigation and page waits properly
4. **Execute the audit** and capture screenshots of the entire app
5. **Analyze screenshots** to identify visual patterns:
   - Buttons without color props (appearing gray)
   - IconButtons without theme colors
   - Cards without theme styling
   - Hardcoded colors visible in UI
   - Inconsistent use of primary/secondary colors
6. **Document findings** in a detailed analysis report with actionable recommendations
7. **Create reusable documentation** for running audits in future stories

## Acceptance Criteria

- [ ] Playwright is installed and configured in the story worktree
- [ ] Test credentials stored in .env.local (verified gitignored)
- [ ] Directory structure created: `docs/visual-audit/baseline/{light,dark}/`
- [ ] Visual audit script created at `scripts/visual-audit.ts`
- [ ] Script successfully authenticates and navigates through app
- [ ] Screenshots captured for ALL key pages in BOTH light and dark modes
- [ ] Analysis report created: `docs/visual-audit/pre-implementation-analysis.md`
- [ ] How-to guide created: `docs/visual-audit/how-to-run-audit.md`
- [ ] At least 20-30 screenshots captured covering all major UI components
- [ ] Analysis report identifies specific components needing theme colors
- [ ] Documentation is clear enough for future use without additional context

## Technical Approach

### 1. Installation and Setup

**Install Playwright:**
```bash
cd /Users/gvinokur/Personal/qatar-prode-story-243
npm install -D @playwright/test
npx playwright install
```

**Verify .env.local is in .gitignore:**
- Confirmed: `.env*.local` and `.env.local` already in .gitignore (lines 29-30)

**Add test credentials to .env.local:**
```env
# Playwright Visual Audit
PLAYWRIGHT_TEST_EMAIL=gvinokur+3@gmail.com
PLAYWRIGHT_TEST_PASSWORD=somepass
```

### 2. Directory Structure

Create organized storage for baseline screenshots:
```bash
mkdir -p /Users/gvinokur/Personal/qatar-prode-story-243/docs/visual-audit/baseline/light
mkdir -p /Users/gvinokur/Personal/qatar-prode-story-243/docs/visual-audit/baseline/dark
```

**Directory purpose:**
- `baseline/light/` - Screenshots captured in light mode
- `baseline/dark/` - Screenshots captured in dark mode
- Future: Could add `after-implementation/` for comparison

### 3. Visual Audit Script Design

**Location:** `/Users/gvinokur/Personal/qatar-prode-story-243/scripts/visual-audit.ts`

**Key Components:**

#### 3.1 Authentication Flow
- Navigate to login page
- Fill email/password from env vars
- Submit and wait for redirect to home
- Verify authentication by checking for user-specific elements

#### 3.2 Page Navigation Strategy

Based on app routes discovery, crawl these pages:

**Core Pages:**
1. Home page (/) - Tournament list or redirect
2. Tournament detail (/tournaments/[id]) - Games, predictions
3. Tournament leaderboard (/tournaments/[id]/results)
4. Tournament stats (/tournaments/[id]/stats)
5. Qualified teams (/tournaments/[id]/qualified-teams)
6. Tournament awards (/tournaments/[id]/awards)

**Friend Groups:**
7. Friend groups list (/friend-groups)
8. Friend group detail (/friend-groups/[id])
9. Tournament friend groups (/tournaments/[id]/friend-groups)
10. Discover friend groups (/tournaments/[id]/friend-groups/discover)

**User Pages:**
11. User settings (header → settings menu)
12. Rules page (/rules)

**Special States:**
13. Onboarding flow (if accessible via ?showOnboarding=true)
14. Empty states (if possible to trigger)

#### 3.3 Theme Switching Logic

For each page:
1. Navigate to page URL
2. Wait for page to load completely
3. **Capture in light mode:**
   - Ensure theme is set to light
   - Wait for theme transition to complete
   - Take full-page screenshot with descriptive filename
4. **Switch to dark mode:**
   - Click theme switcher (Avatar button with DarkMode/LightMode icon)
   - Wait for theme transition
5. **Capture in dark mode:**
   - Take full-page screenshot with descriptive filename

**Screenshot naming convention:**
```
light/01-home.png
light/02-tournament-detail.png
light/03-tournament-leaderboard.png
...
dark/01-home.png
dark/02-tournament-detail.png
dark/03-tournament-leaderboard.png
```

#### 3.4 Error Handling and Robustness

- Use reasonable timeouts for page loads (10-15 seconds)
- Handle authentication failures gracefully
- Skip pages that require specific data (use first available tournament/group)
- Log progress and any errors encountered
- Continue audit even if one page fails

#### 3.5 Browser Configuration

```typescript
{
  headless: false,  // Show browser for debugging
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: 1,
  baseURL: 'https://localhost:3000',
  ignoreHTTPSErrors: true,  // For local HTTPS cert
}
```

### 4. Script Implementation Outline

```typescript
import { chromium, Browser, Page } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Configuration
const BASE_URL = 'https://localhost:3000';
const SCREENSHOT_DIR = path.join(__dirname, '../docs/visual-audit/baseline');
const LIGHT_DIR = path.join(SCREENSHOT_DIR, 'light');
const DARK_DIR = path.join(SCREENSHOT_DIR, 'dark');

// Ensure directories exist
[LIGHT_DIR, DARK_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Pages to audit (with dynamic IDs to be fetched)
const pages = [
  { name: '01-home', path: '/en' },
  { name: '02-tournament-list', path: '/en' },  // Same as home
  { name: '03-tournament-detail', path: '/en/tournaments/{tournamentId}' },
  { name: '04-tournament-leaderboard', path: '/en/tournaments/{tournamentId}/results' },
  // ... more pages
];

async function login(page: Page) {
  // Navigate to login and authenticate
}

async function switchTheme(page: Page, mode: 'light' | 'dark') {
  // Find and click theme switcher
  // Wait for transition
}

async function captureScreenshot(page: Page, filename: string, mode: 'light' | 'dark') {
  const dir = mode === 'light' ? LIGHT_DIR : DARK_DIR;
  await page.screenshot({
    path: path.join(dir, filename),
    fullPage: true
  });
}

async function auditPage(page: Page, pageName: string, path: string) {
  console.log(`Auditing: ${pageName}...`);

  // Navigate
  await page.goto(path);
  await page.waitForLoadState('networkidle');

  // Capture light mode
  await switchTheme(page, 'light');
  await captureScreenshot(page, `${pageName}.png`, 'light');

  // Capture dark mode
  await switchTheme(page, 'dark');
  await captureScreenshot(page, `${pageName}.png`, 'dark');
}

async function runAudit() {
  const browser = await chromium.launch({
    headless: false,
    args: ['--ignore-certificate-errors']
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    baseURL: BASE_URL,
    ignoreHTTPSErrors: true
  });

  const page = await context.newPage();

  try {
    // Login
    await login(page);

    // Fetch dynamic IDs (first tournament, first group)
    const tournamentId = await getTournamentId(page);
    const groupId = await getGroupId(page);

    // Audit each page
    for (const pageConfig of pages) {
      const path = pageConfig.path
        .replace('{tournamentId}', tournamentId)
        .replace('{groupId}', groupId);

      await auditPage(page, pageConfig.name, path);
    }

    console.log('✅ Audit complete!');
  } catch (error) {
    console.error('❌ Audit failed:', error);
  } finally {
    await browser.close();
  }
}

runAudit();
```

### 5. Execution Plan

1. **Start dev server** in a separate terminal:
   ```bash
   cd /Users/gvinokur/Personal/qatar-prode-story-243
   npm run dev
   ```

2. **Wait for server** to be ready (https://localhost:3000)

3. **Run audit script:**
   ```bash
   cd /Users/gvinokur/Personal/qatar-prode-story-243
   npx ts-node scripts/visual-audit.ts
   ```

4. **Monitor execution:**
   - Browser window will open (headless: false)
   - Watch automated navigation and screenshot capture
   - Check console for progress logs

5. **Verify outputs:**
   ```bash
   ls -l docs/visual-audit/baseline/light/
   ls -l docs/visual-audit/baseline/dark/
   ```

### 6. Screenshot Analysis Methodology

After capturing screenshots, perform systematic analysis:

#### 6.1 Visual Inspection Checklist

For each screenshot pair (light + dark):
- [ ] **Buttons:**
  - Do CTAs have `color="primary"` (violet background)?
  - Do secondary actions have `color="secondary"` (coral)?
  - Are any buttons appearing gray (missing color prop)?
- [ ] **IconButtons:**
  - Are action icons colored (edit, delete, share)?
  - Are navigation icons colored?
  - Count how many IconButtons lack color prop
- [ ] **Cards:**
  - Do cards use theme background colors?
  - Are card borders using theme colors?
  - Any hardcoded colors visible?
- [ ] **AppBar/Header:**
  - Using theme colors or hardcoded?
  - Background: primary.dark or hardcoded hex?
- [ ] **Footer:**
  - Using theme colors or hardcoded?
  - Background: primary.dark or hardcoded hex?
- [ ] **Color Distribution:**
  - Roughly 60% neutral/background? ✓
  - Roughly 30% primary color (violet)? Check
  - Roughly 10% secondary color (coral)? Check

#### 6.2 Analysis Document Structure

**File:** `docs/visual-audit/pre-implementation-analysis.md`

Template includes:
- Audit metadata (date, pages count, screenshots count)
- Summary of findings (overall theme adoption, gaps identified)
- Buttons without color props (with screenshot references)
- IconButtons without theme colors (with screenshot references)
- Hardcoded colors found (with locations and recommendations)
- Secondary color usage analysis
- Page-by-page breakdown
- High-priority changes recommendations
- Visual examples with screenshot references
- Appendix with all screenshot listings

### 7. How-To Documentation

**File:** `docs/visual-audit/how-to-run-audit.md`

Template includes:
- Purpose and context
- Prerequisites (Playwright, credentials, dev server)
- Step-by-step running instructions
- How to update credentials
- How to add new pages to crawl
- Analysis guidelines
- Troubleshooting common issues
- Directory structure reference
- Future enhancement ideas

## Files to Create/Modify

### New Files

1. **scripts/visual-audit.ts**
   - Main audit script
   - ~200-300 lines
   - Handles authentication, navigation, theme switching, screenshot capture

2. **docs/visual-audit/baseline/light/** (directory)
   - Storage for light mode screenshots

3. **docs/visual-audit/baseline/dark/** (directory)
   - Storage for dark mode screenshots

4. **docs/visual-audit/pre-implementation-analysis.md**
   - Detailed analysis of findings
   - ~500-1000 lines
   - Component-by-component breakdown

5. **docs/visual-audit/how-to-run-audit.md**
   - Reusable documentation
   - ~150-200 lines
   - Instructions for future use

### Modified Files

1. **.env.local**
   - Add Playwright test credentials
   - Already gitignored (verified)

2. **package.json**
   - Add @playwright/test to devDependencies (via npm install)

## Testing Strategy

### Manual Testing (Visual Audit Execution)

1. **Pre-audit checks:**
   - [ ] Dev server running and accessible
   - [ ] Test credentials valid and set in .env.local
   - [ ] Playwright installed with browsers
   - [ ] Directory structure created

2. **Audit execution:**
   - [ ] Script runs without errors
   - [ ] Browser opens and navigates correctly
   - [ ] Login successful
   - [ ] All pages load without timeouts
   - [ ] Theme switching works
   - [ ] Screenshots captured for all pages

3. **Post-audit verification:**
   - [ ] All expected screenshots present
   - [ ] File sizes reasonable (not empty)
   - [ ] Both light and dark screenshots captured
   - [ ] Filenames match naming convention

### Analysis Quality Checks

1. **Analysis completeness:**
   - [ ] All pages reviewed
   - [ ] All component types assessed (buttons, IconButtons, cards, etc.)
   - [ ] Specific file references provided
   - [ ] Screenshot references included

2. **Recommendation quality:**
   - [ ] Prioritized by impact
   - [ ] Specific and actionable
   - [ ] Aligned with MUI 60-30-10 rule
   - [ ] Includes file counts and estimates

### Documentation Quality

1. **How-to guide:**
   - [ ] Prerequisites clear
   - [ ] Step-by-step instructions
   - [ ] Troubleshooting section
   - [ ] Future enhancement ideas

## SonarCloud Considerations

- **New code:** ~300-400 lines (audit script + docs)
- **Coverage target:** 80% on new code
- **Testing approach:**
  - Script is a utility tool (not production code)
  - No unit tests required for one-time audit script
  - Documentation files don't need tests
- **Quality focus:** Clean, readable code with error handling

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Dev server not running | High | Check server before running script, add wait logic |
| Test credentials invalid | High | Verify credentials work with manual login first |
| Pages timeout during load | Medium | Use generous timeouts (15s), handle errors gracefully |
| Theme switching fails | Medium | Add explicit waits after theme toggle, verify state |
| Screenshots missing content | Medium | Use fullPage: true, add scroll logic if needed |
| Dynamic IDs unavailable | Medium | Fetch IDs at runtime, use first available tournament/group |
| Audit takes too long | Low | Run in background, optimize waits, limit page count |

## Success Metrics

**Audit System Success:**
- ✅ Script successfully captures 20+ screenshots
- ✅ Both light and dark modes captured for each page
- ✅ Zero authentication failures
- ✅ Documentation complete and reusable

**Analysis Success:**
- ✅ All component types assessed
- ✅ Specific recommendations provided
- ✅ Priority levels assigned
- ✅ File references and counts included

**Business Value:**
- ✅ Clear roadmap for implementing story #243
- ✅ Systematic identification of ALL gaps (not just sample)
- ✅ Reusable tool for future theme audits
- ✅ Evidence-based approach to theme improvement

## Implementation Steps

### Step 1: Install Playwright
1. Install @playwright/test as dev dependency
2. Run playwright install to download browsers
3. Verify installation

### Step 2: Configure Environment
1. Add test credentials to .env.local
2. Verify .env.local is gitignored
3. Create directory structure for screenshots

### Step 3: Create Audit Script
1. Implement authentication flow
2. Implement theme switching logic
3. Implement page navigation and screenshot capture
4. Add error handling and logging
5. Test script execution

### Step 4: Run Audit
1. Start dev server
2. Execute audit script
3. Monitor progress
4. Verify screenshot outputs

### Step 5: Analyze Screenshots
1. Review each screenshot pair (light + dark)
2. Identify buttons without color props
3. Identify IconButtons without colors
4. Identify hardcoded colors
5. Count primary/secondary color usage
6. Document findings with specific references

### Step 6: Create Reports
1. Write detailed analysis document
2. Prioritize recommendations
3. Create how-to guide
4. Review for completeness

### Step 7: Validation
1. Verify all screenshots captured
2. Review analysis for accuracy
3. Test how-to guide instructions
4. Confirm documentation is reusable

## Open Questions

None - approach is clear and straightforward.

## Visual Prototype

Not applicable - this is a tooling/infrastructure story focused on analysis, not UI changes.

## Dependencies

- **Blocks:** None
- **Blocked by:** None
- **External dependencies:**
  - Dev server running
  - Test account with valid credentials
  - Playwright browser binaries

## Timeline Estimate

- **Installation & setup:** 15 minutes
- **Script development:** 2-3 hours
- **Audit execution:** 15-30 minutes
- **Analysis & documentation:** 2-3 hours
- **Total:** ~5-7 hours

## Notes

- This is infrastructure work to support story #243 implementation
- The audit system is reusable for future theme-related stories
- Screenshots provide concrete evidence for changes
- Analysis will guide prioritization of component updates
- Consider committing audit script and documentation but excluding screenshots from repo (can be regenerated)
- After this audit is complete, will create a separate implementation plan for the actual theme color updates
